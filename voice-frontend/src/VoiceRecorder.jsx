import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Tap to start recording");
  const [phrases, setPhrases] = useState([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);


  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const navigate = useNavigate();
  const username = localStorage.getItem("user");

  const [mode, setMode] = useState("verify");


  useEffect(() => {
    if (!username) {
      setStatus("User not logged in ❌");
      return;
    }

    fetch("http://localhost:8080/auth/phrase")
      .then(res => res.json())
      .then(data => {
        setPhrases(data.phrases?.length ? data.phrases : [
          "My voice is my password",
          "My voice is my password",
          "My voice is my password"
        ]);
      })
      .catch(() => {
        setPhrases([
          "My voice is my password",
          "My voice is my password",
          "My voice is my password"
        ]);
      });

    const enrolled = localStorage.getItem("voiceRegistered");

    if (!enrolled) {
      setMode("enroll");
      setStatus("Please record your voice (Enrollment)");
    } else {
      setMode("verify");
      setStatus("Tap to verify your voice");
    }
  }, [username]);


  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;

    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#00ffcc";

      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const stopWaveform = () => {
    cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };


  const handleReset = async () => {
    if (!username) return;

    if (!window.confirm("Reset your voice profile?")) return;

    try {
      setStatus("Resetting voice...");

      const formData = new FormData();
      formData.append("username", username);
      formData.append("mode", "reset");

      const res = await fetch("http://localhost:8080/auth/process", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.status === "RESET") {
        localStorage.removeItem("voiceRegistered");
        setMode("enroll");
        setCurrentPhraseIndex(0);
        setStatus("Voice reset. Please enroll again.");
      } else {
        setStatus(data.message || "Reset failed ❌");
      }

    } catch {
      setStatus("Error resetting voice ❌");
    }
  };


  const handleRecording = async () => {
    if (!username) return;

    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Setup audio context for waveform
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;

        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        drawWaveform(); // Start animation

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          stopWaveform(); // Stop animation

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

          const formData = new FormData();
          formData.append("audio", audioBlob, "sample.webm");
          formData.append("phrase", phrases[currentPhraseIndex] || "");
          formData.append("username", username);
          formData.append("mode", mode);

          setStatus("Processing voice...");

          const res = await fetch("http://localhost:8080/auth/process", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (data.status === "ERROR") {
            setStatus(data.message);
            return;
          }

          if (
            data.status === "GRANTED" ||
            data.status === "ENROLLED" ||
            data.status === "ENROLLING"
          ) {
            if (mode === "verify") {
              setStatus("User Verified ✅");
              setTimeout(() => navigate("/dashboard"), 1500);
              return;
            }

            setCurrentPhraseIndex(prev => {
              const next = prev + 1;

              if (next < phrases.length) {
                setStatus("Good! Say it again.");
                return next;
              }

              localStorage.setItem("voiceRegistered", "true");
              setStatus("Enrollment complete ✅");
              setTimeout(() => navigate("/dashboard"), 1500);

              return prev;
            });

          } else {
            setStatus(data.message ? `Access Denied: ${data.message}` : "Access Denied ❌");
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setStatus("Recording...");

      } catch {
        setStatus("Microphone access denied ❌");
      }

    } else {
      mediaRecorderRef.current.stop();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      setIsRecording(false);
    }
  };


  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Voice Recorder</h1>

      <h2>Repeat this phrase:</h2>
      <h3 style={{ color: "blue" }}>
        {phrases[currentPhraseIndex] || "Loading..."}
      </h3>

      <p>{`Phrase ${currentPhraseIndex + 1} of ${phrases.length}`}</p>


      <canvas
        ref={canvasRef}
        width="400"
        height="100"
        style={{
          margin: "20px auto",
          display: "block",
          background: "#111",
          borderRadius: "10px"
        }}
      />

      <button
        onClick={handleRecording}
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          fontSize: "30px",
          backgroundColor: isRecording ? "red" : "green",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        ⏺
      </button>

      <p>{status}</p>

      <button
        onClick={handleReset}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "orange",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Reset Voice
      </button>
    </div>
  );
}