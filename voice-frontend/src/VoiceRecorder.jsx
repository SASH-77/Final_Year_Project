import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Tap to start recording");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const navigate = useNavigate();

  const handleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });

          const formData = new FormData();
          formData.append("audio", audioBlob, "sample.wav");

          try {
            setStatus("Processing voice...");

            const res = await fetch("http://localhost:5000/process", {
              method: "POST",
              body: formData,
            });

            const data = await res.json();
            console.log("Server response:", data);

            if (data.status === "GRANTED") {
              setStatus("User Verified ✅");

              // Redirect after short delay
              setTimeout(() => {
                navigate("/dashboard");
              }, 1500);

            } else {
              setStatus("Access Denied ❌");
            }

          } catch (err) {
            console.error(err);
            setStatus("Error processing voice ❌");
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setStatus("Recording...");

      } catch (err) {
        console.error(err);
        setStatus("Microphone access denied ❌");
      }

    } else {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus("Processing...");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Voice Recorder</h1>

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
    </div>
  );
}