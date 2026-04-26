import numpy as np
import os
import whisper
import re
import sqlite3
import json
from difflib import SequenceMatcher
from feature_extraction import extract_features

conn = sqlite3.connect("voice_auth.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS voice_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    embedding TEXT
)
""")

conn.commit()

SIMILARITY_THRESHOLD = 0.75
PHRASE_THRESHOLD = 0.7

PROFILE_DIR = "voice_profiles"
TEMP_DIR = "temp_profiles"

os.makedirs(PROFILE_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# ✅ Load Whisper once
stt_model = whisper.load_model("base")


# =========================
# 🔹 UTIL
# =========================

def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

def cosine_similarity(a, b):
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return np.dot(a, b) / denom


def text_similarity(a, b):
    a_words = set(a.lower().split())
    b_words = set(b.lower().split())

    if not a_words or not b_words:
        return 0.0

    return len(a_words & b_words) / len(a_words | b_words)


def normalize_text(text):
    cleaned = re.sub(r"[^a-z0-9\s]", "", text.lower())
    return " ".join(cleaned.split())


def transcribe_audio(file_path):
    try:
        result = stt_model.transcribe(file_path)
        text = result["text"].strip()
        print("🗣️ Transcribed:", text)
        return text
    except Exception as e:
        print("❌ STT error:", e)
        return ""


# =========================
# 🔹 PATHS
# =========================

def get_user_profile_dir(username):
    path = os.path.join(PROFILE_DIR, username)
    os.makedirs(path, exist_ok=True)
    return path


def get_profile_path(username):
    return os.path.join(PROFILE_DIR, f"{username}.npy")


def get_temp_dir(username):
    path = os.path.join(TEMP_DIR, username)
    os.makedirs(path, exist_ok=True)
    return path


# =========================
# 🔹 TEMP (ENROLL)
# =========================

def save_temp_sample(username, features):
    temp_dir = get_temp_dir(username)
    index = len(os.listdir(temp_dir)) + 1
    np.save(os.path.join(temp_dir, f"{index}.npy"), features)
    return index


def load_temp_samples(username):
    temp_dir = get_temp_dir(username)
    return [np.load(os.path.join(temp_dir, f)) for f in sorted(os.listdir(temp_dir))]


def clear_temp(username):
    temp_dir = get_temp_dir(username)
    for f in os.listdir(temp_dir):
        os.remove(os.path.join(temp_dir, f))


# =========================
# 🔹 PROFILE MGMT
# =========================

def save_new_profile(username, features):
    embedding_json = json.dumps(features.tolist())
    
    cursor.execute(
        "INSERT INTO voice_profiles (username, embedding) VALUES (?, ?)",
        (username, embedding_json)
    )
    
    conn.commit()
    print(f"💾 Saved profile for {username} to database")


def save_final_profile(username, new_features):
    path = get_profile_path(username)

    # If profile exists → append
    if os.path.exists(path):
        existing = np.load(path, allow_pickle=True)
        updated = np.vstack([existing, new_features])
    else:
        updated = np.array([new_features])

    np.save(path, updated)
    print(f"💾 Updated voice profile for {username}")


def load_voice(username):
    path = get_profile_path(username)
    if not os.path.exists(path):
        return None

    return np.load(path, allow_pickle=True)


def load_all_profiles(username):
    cursor.execute("SELECT embedding FROM voice_profiles WHERE username = ?", (username,))
    rows = cursor.fetchall()
    
    profiles = []
    for row in rows:
        embedding_json = row[0]
        embedding_array = np.array(json.loads(embedding_json))
        profiles.append(embedding_array)
    
    return profiles


def delete_all_profiles(username):
    user_dir = get_user_profile_dir(username)
    for f in os.listdir(user_dir):
        os.remove(os.path.join(user_dir, f))


# =========================
# 🔹 RESET
# =========================

def reset_voice(username):
    try:
        delete_all_profiles(username)
        clear_temp(username)
        return {"status": "RESET"}
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}


# =========================
# 🔹 AUTH
# =========================

def authenticate(file_path, username, mode, phrase=""):
    try:
        # 🔹 RESET
        if mode == "reset":
            return reset_voice(username)

        # =========================
        # 🔹 ENROLL MODE
        # =========================
        if mode == "enroll":
            # 🔹 Extract features
            features = extract_features(file_path)

            count = save_temp_sample(username, features)

            print(f"🎙️ Enrollment sample {count}/3")

            if count < 3:
                return {"status": "ENROLLING"}

            samples = load_temp_samples(username)
            avg_features = np.mean(samples, axis=0)

            # ✅ Save as new profile
            save_new_profile(username, avg_features)

            clear_temp(username)

            return {"status": "ENROLLED"}

        # =========================
        # 🔹 VERIFY MODE
        # =========================

        cursor.execute(
            "SELECT embedding FROM voice_profiles WHERE username=?",
            (username,)
        )

        rows = cursor.fetchall()

        if not rows:
            return {
                "status": "REJECTED",
                "stage": "NO_PROFILE"
            }

        stored_embeddings = [
            np.array(json.loads(row[0])) for row in rows
        ]

        # 🔹 Transcribe audio for phrase verification
        result = stt_model.transcribe(file_path)
        transcribed_text = result["text"]
        print("🧠 Transcribed:", transcribed_text)
        print("🎯 Expected:", phrase)

        expected = normalize_text(phrase)
        spoken = normalize_text(transcribed_text)

        score = similarity(expected, spoken)
        word_score = text_similarity(expected, spoken)
        best_phrase_score = max(score, word_score)

        print(f"📊 Phrase scores: exact={score:.3f}, words={word_score:.3f}, best={best_phrase_score:.3f}")

        if best_phrase_score < PHRASE_THRESHOLD:
            return {
                "status": "REJECTED",
                "stage": "PHRASE_MISMATCH",
                "expected": expected,
                "spoken": spoken,
                "score": best_phrase_score
            }

        # 🔹 Extract features for voice authentication (only after phrase check passes)
        features = extract_features(file_path)

        similarities = [
            cosine_similarity(profile, features)
            for profile in stored_embeddings
        ]

        best_similarity = max(similarities)

        print("🔍 All similarities:", similarities)
        print("🏆 Best similarity:", best_similarity)

        # 🔹 Decision:
        if best_similarity >= SIMILARITY_THRESHOLD:
            return {
                "status": "GRANTED",
                "confidence": float(best_similarity)
            }
        else:
            return {
                "status": "DENIED",
                "confidence": float(best_similarity)
            }

    except Exception as e:
        print("❌ Error:", e)
        return {"status": "ERROR", "message": str(e)}