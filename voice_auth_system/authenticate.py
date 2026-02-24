# authenticate.py

import pickle
import numpy as np

from feature_extraction import extract_features
from config import MODEL_PATH, AUTH_THRESHOLD


def load_model():
    with open(MODEL_PATH, "rb") as f:
        data = pickle.load(f)
    return data["model"], data["label_encoder"]


def authenticate(file_path):
    model, le = load_model()

    feat = extract_features(file_path).reshape(1, -1)

    prediction = model.predict(feat)[0]
    probabilities = model.predict_proba(feat)[0]

    confidence = np.max(probabilities)

    label = le.inverse_transform([prediction])[0]

    if label == "authorized" and confidence >= AUTH_THRESHOLD:
        return {
            "status": "ACCESS GRANTED",
            "confidence": float(confidence)
        }
    else:
        return {
            "status": "ACCESS DENIED",
            "confidence": float(confidence)
        }


def main():
    import sys, json

    # allow caller to pass audio file path arg
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
    else:
        test_file = "voice_data/authorized/sample1.wav"

    result = authenticate(test_file)

    # print JSON so other applications can parse
    sys.stdout.write(json.dumps(result))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
