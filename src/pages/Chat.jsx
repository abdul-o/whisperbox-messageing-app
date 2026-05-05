import { useState } from "react";
import axios from "axios";

export default function Chat() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    if (!userId || !message) {
      alert("Enter recipient and message");
      return;
    }

    try {
      // 1. Get recipient public key
      const res = await axios.get(
        `https://whisperbox.koyeb.app/users/${userId}/public-key`,
        {
          headers: {
            Authorization: `Bearer ${window.token}`,
          },
        }
      );

      const publicKeyBase64 = res.data.public_key;

      const publicKey = await crypto.subtle.importKey(
        "spki",
        Uint8Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0)),
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
      );

      // 2. AES key
      const aesKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));

      // 3. Encrypt message
      const encoded = new TextEncoder().encode(message);

      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encoded
      );

      const rawKey = await crypto.subtle.exportKey("raw", aesKey);

      // 4. Encrypt AES key
      const encryptedKey = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        rawKey
      );

      const encryptedKeyForSelf = encryptedKey;

      // 5. Send
      await axios.post(
        "https://whisperbox.koyeb.app/messages",
        {
          to: userId,
          payload: {
            ciphertext: btoa(
              String.fromCharCode(...new Uint8Array(ciphertext))
            ),
            iv: btoa(String.fromCharCode(...iv)),
            encryptedKey: btoa(
              String.fromCharCode(...new Uint8Array(encryptedKey))
            ),
            encryptedKeyForSelf: btoa(
              String.fromCharCode(...new Uint8Array(encryptedKeyForSelf))
            ),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${window.token}`,
          },
        }
      );

      // Add to UI
      setMessages((prev) => [...prev, { text: message, sender: "me" }]);
      setMessage("");

    } catch (err) {
      console.error(err);
      alert("Failed to send ❌");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* Sidebar */}
      <div
        style={{
          width: "30%",
          backgroundColor: "#111b21",
          color: "#fff",
          padding: "20px",
        }}
      >
        <h3>Chats</h3>

        <input
          placeholder="Recipient ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            borderRadius: "5px",
            border: "none",
          }}
        />
      </div>

      {/* Chat Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#efeae2",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "15px",
            backgroundColor: "#202c33",
            color: "#fff",
          }}
        >
          Secure Chat 🔒
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            padding: "15px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf:
                  msg.sender === "me" ? "flex-end" : "flex-start",
                backgroundColor:
                  msg.sender === "me" ? "#d9fdd3" : "#ffffff",
                padding: "10px 14px",
                borderRadius: "10px",
                maxWidth: "60%",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Input */}
        <div
          style={{
            display: "flex",
            padding: "10px",
            backgroundColor: "#f0f2f5",
            gap: "10px",
          }}
        >
          <input
            value={message}
            placeholder="Type a message..."
            onChange={(e) => setMessage(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "20px",
              border: "1px solid #ccc",
            }}
          />

          <button
            onClick={sendMessage}
            style={{
              padding: "10px 16px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: "#25d366",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}