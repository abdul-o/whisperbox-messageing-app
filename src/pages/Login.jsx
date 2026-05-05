import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  deriveKey,
  unwrapPrivateKey,
  base64ToBuffer,
} from "../utils/crypto";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      // 1. Login request
      const res = await axios.post(
        "https://whisperbox.koyeb.app/auth/login",
        {
          username: username.toLowerCase(),
          password,
        }
      );

      const user = res.data.user;

      //  Derive wrapping key
      const salt = base64ToBuffer(user.pbkdf2_salt);
      const wrappingKey = await deriveKey(password, salt);

      //  Unwrap private key
      const privateKey = await unwrapPrivateKey(
        user.wrapped_private_key,
        wrappingKey
      );

      //  Store in memory
      window.privateKey = privateKey;
      window.token = res.data.access_token;

      alert("Login successful ✅");

      //  Navigate to chat
      navigate("/chat");

    } catch (err) {
      console.error(err);
      alert("Login failed ❌");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f7fb",
      }}
    >
      <div
        style={{
          width: "320px",
          padding: "30px",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
          Login
        </h2>

        {/* Username */}
        <input
          value={username}
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            outline: "none",
          }}
        />

        {/* Password */}
        <input
          value={password}
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            outline: "none",
          }}
        />

        {/* Button */}
        <button
          onClick={handleLogin}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#4f46e5",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        {/* Link to Register */}
        <p
          onClick={() => navigate("/register")}
          style={{
            textAlign: "center",
            cursor: "pointer",
            color: "#4f46e5",
            fontSize: "14px",
          }}
        >
          Don't have an account? Register
        </p>
      </div>
    </div>
  );
}