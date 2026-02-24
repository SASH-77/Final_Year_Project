# train_model.py

import os
import numpy as np
import pickle
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

from feature_extraction import extract_features
from config import DATA_PATH, MODEL_PATH, TEST_SIZE, RANDOM_STATE

def load_dataset():
    features = []
    labels = []

    for label in os.listdir(DATA_PATH):
        folder = os.path.join(DATA_PATH, label)
        if os.path.isdir(folder):
            for file in os.listdir(folder):
                if file.endswith(".wav"):
                    file_path = os.path.join(folder, file)
                    feat = extract_features(file_path)
                    features.append(feat)
                    labels.append(label)

    return np.array(features), np.array(labels)


def train():
    print("Loading dataset...")
    X, y = load_dataset()

    print("Encoding labels...")
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    print("Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE
    )

    print("Training SVM model...")
    model = SVC(kernel='rbf', probability=True)
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Model Accuracy: {accuracy*100:.2f}%")

    os.makedirs("model", exist_ok=True)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump({
            "model": model,
            "label_encoder": le
        }, f)

    print("Model saved successfully!")


if __name__ == "__main__":
    train()