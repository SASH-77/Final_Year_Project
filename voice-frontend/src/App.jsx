import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import LogsPage from "./LogsPage";
import VoiceRecorder from "./VoiceRecorder";

function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/" element={<Login />} />
      <Route path="/record" element={<VoiceRecorder />} />
      <Route path="/logs" element={<LogsPage />} />
    </Routes>
  );
}

export default App;