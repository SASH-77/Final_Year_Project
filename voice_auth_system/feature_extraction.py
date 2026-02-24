# feature_extraction.py

import librosa
import numpy as np
from config import N_MFCC

def extract_features(file_path):
    """
    Extract MFCC features from a WAV file.
    Returns a normalized feature vector.
    """
    audio, sr = librosa.load(file_path, sr=None)
    
    # Extract MFCCs
    mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=N_MFCC)
    
    # Take mean across time axis
    mfccs_mean = np.mean(mfccs.T, axis=0)
    
    # Normalize
    mfccs_norm = (mfccs_mean - np.mean(mfccs_mean)) / np.std(mfccs_mean)
    
    return mfccs_norm