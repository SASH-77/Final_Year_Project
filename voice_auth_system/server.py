import uuid
from fastapi import FastAPI, File, UploadFile, Form
from authenticate import authenticate
import shutil
import os
from pydub import AudioSegment

app = FastAPI()


@app.post("/extract")
async def extract_audio(
    file: UploadFile = File(None),
    username: str = Form(...),
    mode: str = Form(...),
    phrase: str = Form("")
):

    print("\n==============================")
    print("👤 Username:", username)
    print("⚙️ Mode:", mode)
    print("==============================")

    # =========================
    # 🔹 RESET MODE (NO FILE)
    # =========================
    if mode == "reset":
        result = authenticate(None, username, mode)
        print("🔄 Reset result:", result)
        return result

    # =========================
    # 🔹 VALIDATE FILE
    # =========================
    if file is None:
        return {
            "status": "ERROR",
            "message": "Audio file is required"
        }

    if file.filename == "":
        return {
            "status": "ERROR",
            "message": "Empty file received"
        }

    # =========================
    # 🔹 UNIQUE FILE PATHS
    # =========================
    unique_id = str(uuid.uuid4())

    _, ext = os.path.splitext(file.filename or "upload")
    if not ext:
        ext = ".webm"

    raw_path = f"temp_{unique_id}{ext}"
    wav_path = f"temp_{unique_id}.wav"

    # =========================
    # 🔹 SAVE FILE
    # =========================
    try:
        with open(raw_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print("📥 Saved file:", raw_path)
        print("🗣️ Phrase:", phrase)

    except Exception as e:
        return {
            "status": "ERROR",
            "message": f"File save failed: {str(e)}"
        }

    try:
        # =========================
        # 🔹 CONVERT TO WAV
        # =========================
        AudioSegment.from_file(
            raw_path,
            format=ext.replace(".", "")
        ).export(wav_path, format="wav")

        print("🔄 Converted to WAV:", wav_path)

    except Exception as e:
        print("❌ Conversion failed:", e)
        wav_path = raw_path  # fallback

    try:
        # =========================
        # 🔹 AUTHENTICATE
        # =========================
        result = authenticate(wav_path, username, mode, phrase)

        print("🎯 Result:", result)

        if isinstance(result, dict) and "status" in result:
            return result

        return {
            "status": "ERROR",
            "message": "Invalid response from authenticate()"
        }

    except Exception as e:
        print("❌ Processing failed:", e)
        return {
            "status": "ERROR",
            "message": str(e)
        }

    finally:
        # =========================
        # 🔹 CLEANUP
        # =========================
        for path in [raw_path, wav_path]:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
                    print("🧹 Deleted:", path)
            except Exception as e:
                print("⚠️ Cleanup failed:", e)


# =========================
# 🔹 RUN SERVER
# =========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=6000, reload=True)