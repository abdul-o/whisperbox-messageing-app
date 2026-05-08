import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  deriveKey,
  unwrapPrivateKey,
  base64ToBuffer,
} from "../utils/crypto";

export default function Login() {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const navigate = useNavigate();





  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      console.log("STEP 1: Sending login request");

      const res = await axios.post(
        "https://whisperbox.koyeb.app/auth/login",
        {
          username: username.toLowerCase(),
          password,
        }
      );
      console.log(
        "TOKEN SAVED:",
        localStorage.getItem("token")
      );



      console.log("STEP 2: Login response");
      console.log(res.data);

      const user = res.data.user;

      console.log("STEP 3: User object");
      console.log(user);

      if (!user.wrapped_private_key) {
        throw new Error(
          "wrapped_private_key missing"
        );
      }

      if (!user.pbkdf2_salt) {
        throw new Error(
          "pbkdf2_salt missing"
        );
      }

      console.log("STEP 4: Decode salt");

      const salt = new Uint8Array(
        base64ToBuffer(user.pbkdf2_salt)
      );

      console.log("STEP 5: Deriving key");

      const wrappingKey =
        await deriveKey(
          password,
          salt
        );

      console.log("STEP 6: Unwrapping key");

      const privateKey =
        await unwrapPrivateKey(
          user.wrapped_private_key,
          wrappingKey
        );

      console.log("STEP 7: SUCCESS");

      // store auth

// EXPORT PRIVATE KEY TO JWK
const privateKeyJwk =
  await crypto.subtle.exportKey(
    "jwk",
    privateKey
  );

// SAVE PRIVATE KEY
localStorage.setItem(
  "privateKey",
  JSON.stringify(privateKeyJwk)
);

      window.token =
        res.data.access_token;

      window.user = user;

      localStorage.setItem(
        "token",
        res.data.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );




      navigate("/chat");


    } catch (err) {

      console.error(
        "FULL LOGIN ERROR:"
      );

      console.error(err);

      if (err.response) {
        console.log(
          err.response.data
        );
      }

      alert("Login failed ❌");

    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[] flex items-center justify-center px-4"
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "#0f172a",
      }}
    >
      <div
        style={{
          width: "350px",
          padding: "35px",
          borderRadius: "16px",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.2)",

          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          Login
        </h2>

        {/* USERNAME */}

        <input
          value={username}
          placeholder="Username"
          autoComplete="off"
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          style={{
            padding: "12px",
            borderRadius: "8px",
            border:
              "1px solid #d1d5db",

            outline: "none",
            fontSize: "15px",
          }}
        />

        {/* PASSWORD */}

        <input
          value={password}
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          style={{
            padding: "12px",
            borderRadius: "8px",
            border:
              "1px solid #d1d5db",

            outline: "none",
            fontSize: "15px",
          }}
        />

        {/* LOGIN BUTTON */}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor:
              "#0f172a",

            color: "#fff",
            fontWeight: "bold",
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>

        {/* NAVIGATION */}

        <p
          onClick={() =>
            navigate("/register")
          }
          style={{
            textAlign: "center",
            cursor: "pointer",
            color: "#4f46e5",
            fontSize: "14px",
          }}
        >
          Don't have an account?
          Register
        </p>
      </div>
    </div>
  );
}