# Voice Authentication System

This folder contains the Python machine‑learning component that trains a speaker
recognition model and exposes a simple authentication API.

## Setup

```powershell
cd voice_auth_system
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

`requirements.txt` already lists packages such as `librosa`, `numpy`, `scikit-learn`,
`fastapi` and `uvicorn`.

## Training

Record a few WAV files under `voice_data/authorized` and `voice_data/unauthorized`.
Then run:

```powershell
python train_model.py
```

A model (`model/voice_auth_model.pkl`) will be created.

## Authentication script

`authenticate.py` exposes an `authenticate(file_path)` helper. You can also run
it from the command line:

```powershell
python authenticate.py path\to\sample.wav
```

The script prints a JSON object with `status` and `confidence`.

## HTTP service (optional)

To run the microservice that the Java backend calls:

```powershell
python server.py
```

It listens on port **5000** by default and accepts multipart uploads at
`/auth`. The service now accepts common browser formats (WebM/OGG/MP3) by
converting them to WAV before feature extraction. This requires **ffmpeg** on
your PATH (download from https://ffmpeg.org) – alternatively `pydub` will
handle the conversion automatically when `ffmpeg` is available.

The Java application must be started after the Python service; see the root
README for usage instructions.
