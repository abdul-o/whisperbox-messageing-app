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

    //  Generate RSA keys
    const { publicKey, privateKey } =
      await generateRSAKeyPair();

      const privateKeyJwk =
  await crypto.subtle.exportKey(
    "jwk",
    privateKey
  );

localStorage.setItem(
  "privateKey",
  JSON.stringify(privateKeyJwk)
);

    //  Export public key
    const publicKeyBase64 =
      await exportPublicKey(publicKey);

    //  Generate salt
    const salt = generateSalt();

    const saltBase64 =
      bufferToBase64(salt);

    //  Derive wrapping key
    const wrappingKey =
      await deriveKey(password, salt);

    // Encrypt private key
    const wrappedPrivateKey =
      await wrapPrivateKey(
        privateKey,
        wrappingKey
      );


console.log({
  username,
  password,
  publicKeyBase64,
  wrappedPrivateKey,
  salt,
});



    //  Send to backend
const res = await axios.post(
  "https://whisperbox.koyeb.app/auth/register",
  {
    username: username.toLowerCase(),
    password,
    display_name: username,

    public_key:
      publicKeyBase64,

    wrapped_private_key:
      wrappedPrivateKey,

    pbkdf2_salt:
      saltBase64,
  }
);



    setUsername("");
    setPassword("");

    navigate("/login");

  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    if (error.response) {
      console.log(error.response.data);

      alert(
        JSON.stringify(
          error.response.data
        )
      );

    } else {
      alert("Network error ");
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
        background: "#0f172a",
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
            backgroundColor: "#0f172a",
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
            color: "#0f172a",
            cursor: "pointer",
          }}
        >
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}