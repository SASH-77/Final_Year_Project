import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Chip,
} from "@mui/material";

function App() {
  const [spokenText, setSpokenText] = useState("");
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [history, setHistory] = useState([]);

  // Keyboard shortcut (Space)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space" && !listening) {
        handleRecording();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [listening]);

  const handleRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported. Use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);
    setResult(null);
    setSpokenText("");
    setOpenSnack(true);

    recognition.start();

    recognition.onresult = async (event) => {
      const voiceText = event.results[0][0].transcript;
      setSpokenText(voiceText);

      try {
        const response = await fetch(
          "http://localhost:8080/api/command/parse", // matches backend
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ speechText: voiceText }),
          }
        );

        const data = await response.json();
        setResult(data);

        setHistory((prev) => [
          {
            text: voiceText,
            authorized: data.authorized,
            message: data.message, // updated to match backend
          },
          ...prev.slice(0, 4),
        ]);
      } catch (error) {
        setResult({
          authorized: false,
          message: "BACKEND_CONNECTION_FAILED",
        });
      }
    };

    recognition.onerror = () => {
      setResult({
        authorized: false,
        message: "VOICE_RECOGNITION_ERROR",
      });
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  const resetAll = () => {
    setSpokenText("");
    setResult(null);
    setHistory([]);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1d2671, #c33764)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 480,
          borderRadius: 25,
          boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
          animation: listening ? "pulse 1.5s infinite" : "none",
        }}
      >
        <CardContent style={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Voice Command Interface
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Press <b>Space</b> or click to speak
          </Typography>

          <Button
            variant="contained"
            onClick={handleRecording}
            disabled={listening}
            style={{
              marginTop: 16,
              backgroundColor: listening ? "#9e9e9e" : "#ff1744",
              padding: "14px 36px",
              borderRadius: 40,
              fontSize: 16,
            }}
          >
            {listening ? "Listening..." : "Start Recording"}
          </Button>

          {listening && (
            <div style={{ marginTop: 16 }}>
              <CircularProgress />
              <Typography variant="body2">Listening…</Typography>
            </div>
          )}

          <TextField
            label="Recognized Speech"
            multiline
            rows={3}
            fullWidth
            margin="normal"
            value={spokenText}
          />

          {result && (
            <Typography
              fontWeight="bold"
              style={{
                fontSize: 18,
                marginTop: 10,
                color: result.authorized ? "#00e676" : "#ff5252",
              }}
            >
              {result.authorized
                ? `AUTHORIZED`
                : `REJECTED (${result.message})`}
            </Typography>
          )}

          {history.length > 0 && (
            <>
              <Typography variant="subtitle1" marginTop={2}>
                Recent Attempts
              </Typography>
              {history.map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.text} — ${
                    item.authorized ? "AUTHORIZED" : `REJECTED (${item.message})`
                  }`}
                  color={item.authorized ? "success" : "error"}
                  style={{ margin: 4 }}
                />
              ))}
            </>
          )}

          <Button
            variant="outlined"
            color="secondary"
            style={{ marginTop: 16 }}
            onClick={resetAll}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      <Snackbar
        open={openSnack}
        autoHideDuration={2000}
        onClose={() => setOpenSnack(false)}
        message="Microphone activated"
      />

      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255,23,68,0.6); }
            70% { box-shadow: 0 0 0 20px rgba(255,23,68,0); }
            100% { box-shadow: 0 0 0 0 rgba(255,23,68,0); }
          }
        `}
      </style>
    </div>
  );
}

export default App;
