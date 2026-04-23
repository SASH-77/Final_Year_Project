import numpy as np
import os
import whisper
from feature_extraction import extract_features

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
    user_dir = get_user_profile_dir(username)
    index = len(os.listdir(user_dir)) + 1
    path = os.path.join(user_dir, f"profile_{index}.npy")

    np.save(path, features)
    print(f"💾 Saved profile: {path}")


def load_all_profiles(username):
    user_dir = get_user_profile_dir(username)
    profiles = []

    for f in os.listdir(user_dir):
        if f.endswith(".npy"):
            profiles.append(np.load(os.path.join(user_dir, f)))

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

        # 🔹 Extract features
        features = extract_features(file_path)

        # =========================
        # 🔹 ENROLL MODE
        # =========================
        if mode == "enroll":
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

        profiles = load_all_profiles(username)

        if not profiles:
            return {"status": "ERROR", "message": "User not enrolled"}

        # 🔹 Voice matching (multi-profile)
        scores = [cosine_similarity(p, features) for p in profiles]
        best_voice_score = max(scores)

        print("🔍 Voice scores:", scores)
        print("🏆 Best voice score:", best_voice_score)

        # 🔹 Phrase verification
        spoken_text = transcribe_audio(file_path)
        phrase_score = text_similarity(spoken_text, phrase)

        print("🧠 Phrase score:", phrase_score)

        # 🔥 FINAL DECISION
        if best_voice_score >= SIMILARITY_THRESHOLD and phrase_score >= PHRASE_THRESHOLD:
            return {
                "status": "GRANTED",
                "voice_confidence": float(best_voice_score),
                "phrase_confidence": float(phrase_score)
            }
        else:
            return {
                "status": "DENIED",
                "voice_confidence": float(best_voice_score),
                "phrase_confidence": float(phrase_score)
            }

    except Exception as e:
        print("❌ Error:", e)
        return {"status": "ERROR", "message": str(e)}