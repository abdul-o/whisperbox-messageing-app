import { useNavigate } from "react-router-dom";

import { useState } from "react";
import {
  generateRSAKeyPair,
  exportPublicKey,
  generateSalt,
  deriveKey,
  wrapPrivateKey,
  bufferToBase64,
} from "../utils/crypto";
import axios from "axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !password) {
      alert("Fill all fields");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      console.log("START REGISTER");

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
      const wrappedPrivateKey = await wrapPrivateKey(privateKey, wrappingKey);

      console.log("SENDING REQUEST...");

      // 6. Send request (IMPORTANT FIX HERE)
      const res = await axios({
        method: "POST",
        url: "https://whisperbox.koyeb.app/auth/register",
        data: {
          username: username.toLowerCase().trim(),
          password,
          display_name: username.trim(),
          public_key: publicKeyBase64,
          wrapped_private_key: wrappedPrivateKey,
          pbkdf2_salt: saltBase64,
        },
        timeout: 15000, // 🔥 prevents hanging
      });

      console.log("SUCCESS:", res.data);

      alert("Registration successful ✅");

      // Clear inputs
      setUsername("");
      setPassword("");

    } catch (error) {
      console.error("ERROR:", error);

      if (error.response) {
        alert(JSON.stringify(error.response.data));
      } else if (error.request) {
        alert("Server not responding (network/CORS)");
      } else {
        alert("Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Register</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRegister();
        }}
      >

        <div style={{
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  gap: "10px"
}}>
  <h1>Register</h1>

  <input placeholder="username" />
  <input placeholder="password" type="password" />


  <p onClick={() => navigate("/login")} style={{cursor: "pointer"}}>
    Already have an account? Login
  </p>
</div>




        {/* <input
          value={username}
          placeholder="username"
          autoComplete="off"
          onChange={(e) => setUsername(e.target.value)}
        /> */}

        {/* <input
          value={password}
          type="password"
          placeholder="password"
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
        /> */}

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}