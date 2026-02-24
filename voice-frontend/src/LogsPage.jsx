import { useState, useEffect } from "react";
import { Button, Card, CardContent, Typography, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";

function LogsPage() {
  const [logs, setLogs] = useState("");
  const navigate = useNavigate();

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/command/logs");
      const data = await res.text();
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: 20, minHeight: "100vh" }}>
      <Button onClick={() => navigate("/")} variant="contained" style={{ marginBottom: 20 }}>
        Back to Dashboard
      </Button>
      <Card style={{ width: "calc(100vw - 40px)", margin: "0 auto" }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Security Logs
          </Typography>
          <TextField
            multiline
            rows={30}
            fullWidth
            value={logs}
            InputProps={{
              readOnly: true,
              style: { fontFamily: "monospace", fontSize: "18px", backgroundColor: "#111", color: "#00ff88" },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default LogsPage;