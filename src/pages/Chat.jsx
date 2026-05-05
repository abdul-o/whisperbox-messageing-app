import { useState } from "react";
import axios from "axios";

export default function Chat() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    try {
      // 1. get recipient public key
      const res = await axios.get(
        `https://whisperbox.koyeb.app/users/${userId}/public-key`,
        {
          headers: {
            Authorization: `Bearer ${window.token}`,
          },
        }
      );

      const publicKeyBase64 = res.data.public_key;

      // 2. import public key
      const publicKey = await crypto.subtle.importKey(
        "spki",
        Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0)),
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
      );

      // 3. generate AES key
      const aesKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));

      // 4. encrypt message
      const encoded = new TextEncoder().encode(message);

      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encoded
      );

      // 5. export AES key
      const rawKey = await crypto.subtle.exportKey("raw", aesKey);

      // 6. encrypt AES key with recipient public key
      const encryptedKey = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        rawKey
      );

      // 7. encrypt AES key for self
      const encryptedKeyForSelf = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        rawKey
      );

      // 8. send message
      await axios.post(
        "https://whisperbox.koyeb.app/messages",
        {
          to: userId,
          payload: {
            ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
            iv: btoa(String.fromCharCode(...iv)),
            encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedKey))),
            encryptedKeyForSelf: btoa(String.fromCharCode(...new Uint8Array(encryptedKeyForSelf))),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${window.token}`,
          },
        }
      );

      alert("Message sent ✅");

    } catch (err) {
      console.error(err);
      alert("Failed ❌");
    }
  };

  return (
    <div>
      <h1>Send Message</h1>

      <input
        placeholder="Recipient ID"
        onChange={(e) => setUserId(e.target.value)}
      />

      <input
        placeholder="Message"
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}