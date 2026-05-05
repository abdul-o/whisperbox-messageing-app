import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  generateRSAKeyPair,
  exportPublicKey,
  generateSalt,
  deriveKey,
  wrapPrivateKey,
  bufferToBase64,
} from "../utils/crypto";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !password) {
      alert("Please fill all fields");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      // 1. Generate RSA keys
      const { publicKey, privateKey } = await generateRSAKeyPair();

      // 2. Export public key
      const publicKeyBase64 = await exportPublicKey(publicKey);

      // 3. Generate salt
      const salt = generateSalt();
      const saltBase64 = bufferToBase64(salt);

      // 4. Derive wrapping key
      const wrappingKey = await deriveKey(password, salt);

      // 5. Wrap private key
      const wrappedPrivateKey = await wrapPrivateKey(
        privateKey,
        wrappingKey
      );

      // 6. Send to backend
      await axios.post("https://whisperbox.koyeb.app/auth/register", {
        username: username.toLowerCase().trim(),
        password,
        display_name: username.trim(),
        public_key: publicKeyBase64,
        wrapped_private_key: wrappedPrivateKey,
        pbkdf2_salt: saltBase64,
      });

      alert("Registration successful ✅");

      // Reset fields
      setUsername("");
      setPassword("");

      // Redirect to login
      navigate("/login");

    } catch (error) {
      console.error(error);

      if (error.response) {
        alert(JSON.stringify(error.response.data));
      } else {
        alert("Network error ❌");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #4f46e5, #6366f1)",
      }}
    >
      <div
        style={{
          width: "340px",
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
          Create Account
        </h2>

        {/* Username */}
        <input
          value={username}
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ddd",
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
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            outline: "none",
          }}
        />

        {/* Register Button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#4f46e5",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "0.2s",
          }}
        >
          {loading ? "Creating..." : "Register"}
        </button>

        {/* Link to Login */}
        <p
          onClick={() => navigate("/login")}
          style={{
            textAlign: "center",
            fontSize: "14px",
            color: "#4f46e5",
            cursor: "pointer",
          }}
        >
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}