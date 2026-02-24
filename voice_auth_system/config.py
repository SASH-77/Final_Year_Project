# config.py

DATA_PATH = "voice_data"
MODEL_PATH = "model/voice_auth_model.pkl"

# Feature settings
N_MFCC = 13

# Training settings
TEST_SIZE = 0.2
RANDOM_STATE = 42

# Authentication threshold
AUTH_THRESHOLD = 0.75  # 75% confidence required