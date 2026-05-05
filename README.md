#  WhisperBox Frontend — End-to-End Encrypted Messaging App

##  Overview

This project is a secure messaging frontend built as part of the **Stage 4B — End-to-End Encryption (E2EE) task**.

The application ensures that:

* All messages are **encrypted on the client**
* The **server never sees plaintext**
* Only the intended recipient can decrypt messages

It integrates with the WhisperBox backend API.

---

##  Objective

To build a secure messaging application where:

* Encryption happens **before sending data**
* Decryption happens **only on the recipient device**
* Backend stores **only encrypted data (ciphertext)**

---

##  Architecture

###  High-Level Architecture

```
[ User A (Client) ]
     │
     │ Encrypt (AES-GCM)
     │ Encrypt Key (RSA-OAEP)
     ▼
[ Backend API (Ciphertext only) ]
     ▼
[ User B (Client) ]
     │
     │ Decrypt Key (RSA-OAEP)
     │ Decrypt Message (AES-GCM)
     ▼
[ Plaintext Message ]
```

---

##  Encryption Flow

###  Registration (Key Setup)

1. Generate RSA-OAEP key pair (2048-bit)
2. Generate PBKDF2 salt
3. Derive AES-KW wrapping key from password
4. Wrap (encrypt) private key using AES-KW
5. Send to backend:

   * Public key
   * Wrapped private key
   * Salt

---

###  Login (Key Recovery)

1. Fetch wrapped private key and salt from server
2. Derive AES-KW key using password + salt
3. Unwrap private key
4. Store private key **in memory only**

---

###  Sending a Message

1. Generate random AES-GCM key (256-bit)
2. Encrypt message → ciphertext
3. Encrypt AES key with:

   * Recipient’s public key
   * Sender’s public key (for self-read)
4. Send payload:

```json
{
  "ciphertext": "...",
  "iv": "...",
  "encryptedKey": "...",
  "encryptedKeyForSelf": "..."
}
```

---

###  Receiving a Message

1. Decrypt AES key using private key
2. Decrypt ciphertext using AES key
3. Display plaintext message

---

##  Key Management

| Key Type    | Storage Location     | Security |
| ----------- | -------------------- | -------- |
| Public Key  | Backend              | Safe     |
| Private Key | Client (memory only) | Secure   |
| Wrapped Key | Backend (encrypted)  | Safe     |
| Password    | User input only      | Secure   |

---

##  Security Decisions

* ✅ Web Crypto API used (no external crypto libs)
* ✅ AES-GCM for message encryption
* ✅ RSA-OAEP for key exchange
* ✅ PBKDF2 for password-based key derivation
* ✅ Private key never stored in plaintext
* ✅ No sensitive data in localStorage
* ✅ HTTPS API communication

---

## ⚖️ Security Trade-offs

| Decision              | Trade-off                          |
| --------------------- | ---------------------------------- |
| Private key in memory | Lost on refresh (but more secure)  |
| No persistent storage | Requires login each session        |
| No forward secrecy    | Simpler implementation             |
| No replay protection  | Not implemented (optional feature) |

---

##  Known Limitations

* No forward secrecy (keys reused)
* No replay attack protection
* No message signature verification
* Private key not persisted securely (memory only)
* No group messaging support

---

##  Features Implemented

* ✅ User registration with key generation
* ✅ Secure login with private key recovery
* ✅ End-to-end encrypted messaging
* ✅ Public key retrieval
* ✅ Encrypted message sending

---

## 🖥️ Tech Stack

* **Frontend:** React (Vite)
* **Crypto:** Web Crypto API
* **HTTP Client:** Axios
* **Backend API:** WhisperBox

---

##  API Base URL

```
https://whisperbox.koyeb.app/
```

Docs:

```
https://whisperbox.koyeb.app/docs#
```

---

## 🚀 How to Run

```bash
npm install
npm run dev
```

---

##  Demo Steps

1. Register two users
2. Login as User A
3. Get User B ID
4. Send encrypted message
5. Verify message is unreadable on backend

---

##  Evaluation Criteria Coverage

| Requirement                  | Status |
| ---------------------------- | ------ |
| Client-side encryption       | ✅      |
| Server cannot read messages  | ✅      |
| Proper key management        | ✅      |
| Secure architecture          | ✅      |
| Clean separation of concerns | ✅      |

---

##  Summary

This project demonstrates a working implementation of **End-to-End Encryption in a web application**, ensuring that:

>  Only the sender and recipient can read messages — not even the server.

---

##  Repository

👉 [Add your GitHub repo link here]

---

##  Live Demo

👉 [Add your deployed link here]

---

#
