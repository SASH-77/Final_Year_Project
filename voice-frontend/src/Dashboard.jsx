import { useState, useEffect, useRef } from "react";
import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Chip,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom"; // ✅ import for navigation

function Dashboard() {
  const [spokenText, setSpokenText] = useState("");
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState("");

  const navigate = useNavigate();


  useEffect(() => {
    if (!localStorage.getItem("user")) {
      navigate("/");
    }
  }, [navigate]);

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/command/logs");
      const data = await response.text();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut and voice recording logic
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space" && !listening) handleRecording();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [listening]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech Recognition not supported.");

    // start audio capture in parallel with speech recognition
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start();
      })
      .catch((err) => {
        console.error("microphone access error", err);
      });

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

      // stop recording to obtain blob
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      // when recorder stops we can send the audio
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });

          const form = new FormData();
          form.append("speechText", voiceText);
          form.append("audio", blob, "voice.wav");
          form.append("username", localStorage.getItem("user"));

          try {
            const response = await fetch("http://localhost:8080/api/command/parse", {
              method: "POST",
              body: form,
            });

            const data = await response.json();
            setResult(data);

            setHistory((prev) => [
              { text: voiceText, authorized: data.authorized, message: data.message },
              ...prev.slice(0, 4),
            ]);
          } catch (error) {
            setResult({ authorized: false, message: "BACKEND_CONNECTION_FAILED" });
          }
        };
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
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
          width: 520,
          borderRadius: 25,
          boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
          animation: listening ? "pulse 1.5s infinite" : "none",
        }}
      >
        <CardContent style={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Voice Authentication Dashboard
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

          <Button
            variant="outlined"
            color="secondary"
            style={{ marginTop: 16, marginLeft: 16 }}
            onClick={() => navigate("/logs")} // ✅ Navigate to LogsPage
          >
            View Logs
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
            rows={2}
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
              {result.authorized ? "AUTHORIZED" : `REJECTED (${result.message})`}
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
                  label={`${item.text} — ${item.authorized ? "AUTHORIZED" : `REJECTED`}`}
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

          <Divider style={{ margin: "20px 0" }} />
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

export default Dashboard;