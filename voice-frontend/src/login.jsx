import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8080/auth/login",
        {},
        { params: { username, password }, headers: { "Content-Type": "application/json" } }
      );

      if (response.data?.status === "SUCCESS") {
        localStorage.setItem("user", username);
        localStorage.setItem("token", response.data.token);
        navigate("/record");
      } else {
        alert(response.data?.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      const status = error?.response?.status;
      const data = error?.response?.data;
      alert(`Error connecting to server${status ? ` (status ${status})` : ""}: ${data || error.message}`);
    }
  };

  return (
    <div className="auth-container" role="main">
      <h1 className="auth-title">Voice Authentication</h1>
      <p className="auth-subtitle">Secure voice-based login</p>

      <form className="auth-form" onSubmit={handleLogin}>
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

        <button className="auth-button" type="submit">Login</button>
      </form>

      <p className="auth-register" onClick={() => navigate("/register")}>Create Account</p>
    </div>
  );
}

export default Login;