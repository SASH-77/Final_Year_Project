import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8080/auth/register",
        {},
        { params: { username, password }, headers: { "Content-Type": "application/json" } }
      );

      alert(response.data);
      navigate("/");
    } catch (error) {
      console.error("Register error:", error);
      const status = error?.response?.status;
      const data = error?.response?.data;
      alert(`Error connecting to server${status ? ` (status ${status})` : ""}: ${data || error.message}`);
    }
  };

  return (
    <div className="auth-container" role="main">
      <h1 className="auth-title">Create Account</h1>
      <p className="auth-subtitle">Register for voice authentication</p>

      <form className="auth-form" onSubmit={handleRegister}>
        <input
          className="auth-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-button" type="submit">Create Account</button>
      </form>

      <p className="auth-register" onClick={() => navigate("/")}>Back to Login</p>
    </div>
  );
}

export default Register;