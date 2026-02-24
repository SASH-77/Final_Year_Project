# server.py

from fastapi import FastAPI, File, UploadFile
from authenticate import authenticate
import shutil
import os
from pydub import AudioSegment

app = FastAPI()

@app.post("/auth")
async def auth(file: UploadFile = File(...)):
    # save incoming audio to a temporary path with original extension
    filename = file.filename or "upload"
    # ensure we have an extension; default to .wav
    _, ext = os.path.splitext(filename)
    if not ext:
        ext = ".wav"

    raw_path = f"temp_audio{ext}"
    with open(raw_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # convert whatever was uploaded to WAV so librosa can read it
    wav_path = "temp_audio.wav"
    try:
        AudioSegment.from_file(raw_path).export(wav_path, format="wav")
    except Exception:
        # if conversion fails, still attempt to read raw file; let loader raise
        wav_path = raw_path

    result = authenticate(wav_path)

    # cleanup temp files
    for p in (raw_path, wav_path):
        try:
            os.remove(p)
        except Exception:
            pass

    return result


if __name__ == "__main__":
    # when you run `python server.py`, start Uvicorn on port 5000
    # (matches the Java service's expectation)
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=5000, reload=True)


if __name__ == "__main__":
    # when you run `python server.py`, start Uvicorn on port 5000
    # (matches the Java service's expectation)
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=5000, reload=True)

