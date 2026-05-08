import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { decryptMessage } from "../utils/crypto";
const API = "https://whisperbox.koyeb.app";

export default function Chat() {
  const navigate = useNavigate();
  const [recipientUsername, setRecipientUsername] = useState("");
  const [recipientUser, setRecipientUser] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("user"));



  // SEARCH USER

  useEffect(() => {
    if (!recipientUser) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${API}/conversations/${recipientUser.id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const privateKeyJwk = JSON.parse(
          localStorage.getItem("privateKey")
        );

        const privateKey =
          await crypto.subtle.importKey(
            "jwk",
            privateKeyJwk,
            {
              name: "RSA-OAEP",
              hash: "SHA-256",
            },
            true,
            ["decrypt"]
          );

        const decryptedMessages =
          await Promise.all(
            response.data.map(async (msg) => {
              try {
                const decryptedText =
                  await decryptMessage(
                    msg.payload,
                    msg.from_user_id

                  );

                return {
                  id: msg.id,
                  text: decryptedText,
                  sender:
                    msg.from_user_id ===
                      currentUser.id
                      ? "me"
                      : "them",
                };
              } catch {
                return {
                  id: msg.id,
                  text: "[Unable to decrypt]",
                  sender:
                    msg.from_user_id ===
                      currentUser.id
                      ? "me"
                      : "them",
                };
              }
            })
          );

        setMessages(decryptedMessages);

      } catch (error) {
        console.error(
          "Fetch messages error:",
          error
        );
      }
    };

    fetchMessages();

    const interval = setInterval(
      fetchMessages,
      3000
    );

    return () => clearInterval(interval);

  }, [recipientUser]);

  const searchUser = async () => {
    if (!recipientUsername.trim()) {
      alert("Enter username");
      return;
    }

    try {
      const res = await axios.get(
        `${API}/users/search?q=${recipientUsername}`,
        {
          headers: {
            Authorization: `Bearer ${window.token}`,
          },
        }
      );

      if (!res.data.length) {
        alert("User not found");
        return;
      }

      const foundUser = res.data[0];

      setRecipientUser(foundUser);



    } catch (err) {
      console.log(err);
      alert("Failed to search user");
    }
  };


  // SEND MESSAGE
  const sendMessage = async () => {



    if (!recipientUser) {
      alert("Search for a user first");
      return;
    }

    if (!message.trim()) {
      alert("Type a message");
      return;
    }

    try {
      setLoading(true);

      // GET RECIPIENT PUBLIC KEY
      const publicKeyRes = await axios.get(
        `${API}/users/${recipientUser.id}/public-key`,
        {
          headers: {
            Authorization: `Bearer ${window.token}`,
          },
        }
      );

      const publicKeyBase64 =
        publicKeyRes.data.public_key;

      // IMPORT PUBLIC KEY
      const publicKey =
        await crypto.subtle.importKey(
          "spki",
          Uint8Array.from(
            atob(publicKeyBase64),
            (c) => c.charCodeAt(0)
          ),
          {
            name: "RSA-OAEP",
            hash: "SHA-256",
          },
          true,
          ["encrypt"]
        );



      const myPublicKeyBase64 =
        currentUser.public_key;

      const myPublicKey =
        await crypto.subtle.importKey(
          "spki",
          Uint8Array.from(
            atob(myPublicKeyBase64),
            (c) => c.charCodeAt(0)
          ),
          {
            name: "RSA-OAEP",
            hash: "SHA-256",
          },
          true,
          ["encrypt"]
        );



      // AES KEY
      const aesKey =
        await crypto.subtle.generateKey(
          {
            name: "AES-GCM",
            length: 256,
          },
          true,
          ["encrypt", "decrypt"]
        );

      const iv =
        crypto.getRandomValues(
          new Uint8Array(12)
        );

      // ENCRYPT MESSAGE
      const encoded =
        new TextEncoder().encode(message);

      const ciphertext =
        await crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv,
          },
          aesKey,
          encoded
        );

      // EXPORT AES KEY
      const rawKey =
        await crypto.subtle.exportKey(
          "raw",
          aesKey
        );

      // ENCRYPT AES KEY
      const encryptedKey =
        await crypto.subtle.encrypt(
          {
            name: "RSA-OAEP",
          },
          publicKey,
          rawKey
        );

      const encryptedKeyForSelf =
        await crypto.subtle.encrypt(
          {
            name: "RSA-OAEP",
          },
          myPublicKey,
          rawKey
        );

      // SEND

      console.log("CURRENT USER:");
      console.log(window.user);

      console.log("RECIPIENT USER:");
      console.log(recipientUser);

      console.log("MESSAGE:");
      console.log(message);

      console.log("PUBLIC KEY:");
      console.log(publicKeyBase64);

      console.log("TOKEN:");
      console.log(window.token);

      const payload = {
        recipient_user_id: recipientUser.id,

        encrypted_payload: {
          ciphertext: btoa(
            String.fromCharCode(
              ...new Uint8Array(ciphertext)
            )
          ),

          iv: btoa(
            String.fromCharCode(...iv)
          ),

          encrypted_key: btoa(
            String.fromCharCode(
              ...new Uint8Array(encryptedKey)
            )
          ),
        },
      };

      console.log("FINAL PAYLOAD:");
      console.log(payload);


      const token =
        localStorage.getItem("token");

      await axios.post(
        `${API}/messages`,
        {
          to: recipientUser.id,

          payload: {
            ciphertext: btoa(
              String.fromCharCode(
                ...new Uint8Array(ciphertext)
              )
            ),

            iv: btoa(
              String.fromCharCode(...iv)
            ),

            encrypted_key: btoa(
              String.fromCharCode(
                ...new Uint8Array(encryptedKey)
              )
            ),
            encryptedKeyForSelf: btoa(
              String.fromCharCode(
                ...new Uint8Array(
                  encryptedKeyForSelf
                )
              )
            ),

          },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // await axios.post(
      //   `${API}/messages`,
      //   {
      //     to: recipientUser.id,

      //     payload: {
      //       ciphertext: btoa(
      //         String.fromCharCode(
      //           ...new Uint8Array(ciphertext)
      //         )
      //       ),

      //       iv: btoa(
      //         String.fromCharCode(...iv)
      //       ),

      //       encrypted_key: btoa(
      //         String.fromCharCode(
      //           ...new Uint8Array(encryptedKey)
      //         )
      //       ),
      //     },
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${localStorage.getItem("token")}`,
      //     },
      //   }
      // );

      // await axios.post(
      //   `${API}/messages`,
      //   {
      //     to: recipientUser.id,

      //     encrypted_payload: {
      //       ciphertext: btoa(
      //         String.fromCharCode(
      //           ...new Uint8Array(ciphertext)
      //         )
      //       ),

      //       iv: btoa(
      //         String.fromCharCode(...iv)
      //       ),

      //       encrypted_key: btoa(
      //         String.fromCharCode(
      //           ...new Uint8Array(encryptedKey)
      //         )
      //       ),
      //     },
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   }
      // );


      // UPDATE UI
      setMessages((prev) => [
        ...prev,
        {
          text: message,
          sender: "me",
        },
      ]);

      setMessage("");

    } catch (err) {
      console.error("SEND ERROR:");

      console.error(err);

      if (err.response) {
        console.log("STATUS:");
        console.log(err.response.status);

        console.log("DATA:");
        console.log(err.response.data);
      }
      alert("Failed to send message");

    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem("privateKey");

    window.token = null;
    window.user = null;
    window.privateKey = null;

    navigate("/login");
  };



  return (
    <main
      style={{
        display: "flex",
        height: "98vh",
        width: "100vw",
        padding: "0px",
        maging: "0px",
        background: darkMode
          ? "#0b141a"
          : "#efeae2",
      }}
    >

      {/* SIDEBAR */}
      <div
        style={{

          width: "320px",
          background: darkMode
            ? "#111b21"
            : "#ffffff",
          borderRight:
            darkMode
              ? "1px solid #222"
              : "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
        }}
      >

        {/* HEADER */}
        <div
          style={{
            padding: "20px",
            borderBottom:
              darkMode
                ? "1px solid #222"
                : "1px solid #ddd",
          }}
        >
          <h2
            style={{
              color: darkMode
                ? "#fff"
                : "#111",
              marginBottom: "15px",
            }}
          >
            WhisperBox
          </h2>

          <input
            value={recipientUsername}
            onChange={(e) =>
              setRecipientUsername(
                e.target.value
              )
            }
            placeholder="Search username..."
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              outline: "none",
              background: darkMode
                ? "#445057"
                : "#f0f2f5",
              color: darkMode
                ? "#fff"
                : "#111",
            }}
          />

          <button
            onClick={searchUser}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              background: "#00a884",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Search User
          </button>
        </div>

        {/* USER CARD */}
        {recipientUser && (
          <div
            style={{
              padding: "15px",
              cursor: "pointer",
              background: darkMode
                ? "#202c33"
                : "#f0f2f5",
              color: darkMode
                ? "#fff"
                : "#111",
              margin: "10px",
              borderRadius: "10px",
            }}
          >
            @{recipientUser.username}
          </div>
        )}
      </div>

      {/* CHAT AREA */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >

        {/* TOP BAR */}
        <div
          style={{
            padding: "15px 20px",
            background: darkMode
              ? "#202c33"
              : "#ffffff",
            borderBottom:
              darkMode
                ? "1px solid #222"
                : "1px solid #ddd",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: darkMode
                ? "#fff"
                : "#111",
              fontWeight: "bold",
            }}
          >
            🔒 Secure Chat
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >

            {/* DARK MODE BUTTON */}

            <button
              onClick={() =>
                setDarkMode(!darkMode)
              }
              style={{
                border: "none",
                borderRadius: "20px",
                padding: "10px 14px",
                cursor: "pointer",
                background: "#00a884",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              {darkMode
                ? "☀️ Light"
                : "🌙 Dark"}
            </button>

            {/* LOGOUT BUTTON */}

            <button
              onClick={handleLogout}

              style={{
                border: "none",
                borderRadius: "20px",
                padding: "10px 14px",
                cursor: "pointer",
                background: "#ff0000",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              Logout
            </button>

          </div>


        </div>

        {/* MESSAGES */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf:
                  msg.sender === "me"
                    ? "flex-end"
                    : "flex-start",

                background:
                  msg.sender === "me"
                    ? "#00a884"
                    : darkMode
                      ? "#202c33"
                      : "#fff",

                color:
                  msg.sender === "me"
                    ? "#fff"
                    : darkMode
                      ? "#fff"
                      : "#111",

                padding: "12px 15px",
                borderRadius: "14px",
                maxWidth: "60%",
                wordBreak: "break-word",
              }}
            >
              {msg.text}


            </div>
          ))}
        </div>

        {/* INPUT */}
        <div
          style={{
            padding: "15px",
            display: "flex",
            gap: "10px",
            background: darkMode
              ? "#202c33"
              : "#ffffff",
          }}
        >
          <input
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "25px",
              border: "none",
              outline: "none",
              background: darkMode
                ? "#2a3942"
                : "#f0f2f5",
              color: darkMode
                ? "#fff"
                : "#111",
            }}
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              padding: "0 22px",
              borderRadius: "25px",
              border: "none",
              background: "#00a884",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </main>
  );
}