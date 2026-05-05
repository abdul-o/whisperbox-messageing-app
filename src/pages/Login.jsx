import { useState } from "react";
import axios from "axios";
import {
  deriveKey,
  unwrapPrivateKey,
  base64ToBuffer,
} from "../utils/crypto";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "https://whisperbox.koyeb.app/auth/login",
        {
          username: username.toLowerCase(),
          password,
        }
      );

      const user = res.data.user;

      // 🔑 derive key again
      const salt = base64ToBuffer(user.pbkdf2_salt);
      const wrappingKey = await deriveKey(password, salt);

      // 🔓 unwrap private key
      const privateKey = await unwrapPrivateKey(
        user.wrapped_private_key,
        wrappingKey
      );

      // store in memory (global)
      window.privateKey = privateKey;
      window.token = res.data.access_token;

      alert("Login successful ✅");

    } catch (err) {
      alert("Login failed ❌");
    }
  };

  return (
    <div>
      <h1>Login</h1>

      <input
        placeholder="username"
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}