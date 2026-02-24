import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import LogsPage from "./LogsPage";

function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/" element={<Login />} />
      <Route path="/logs" element={<LogsPage />} />
    </Routes>
  );
}

export default App;