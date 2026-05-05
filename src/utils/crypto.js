// src/utils/crypto.js

// ===============================
// Base64 Helpers
// ===============================
export const bufferToBase64 = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

export const base64ToBuffer = (base64) => {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};

// ===============================
// RSA KEY GENERATION
// ===============================
export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// ===============================
// EXPORT / IMPORT KEYS
// ===============================
export async function exportPublicKey(publicKey) {
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  return bufferToBase64(spki);
}

export async function importPublicKey(base64Key) {
  const buffer = base64ToBuffer(base64Key);
  return await crypto.subtle.importKey(
    "spki",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// ===============================
// PBKDF2 + AES-KW (WRAPPING KEY)
// ===============================
export function generateSalt() {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

export async function deriveKey(password, salt) {
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-KW",
      length: 256,
    },
    true,
    ["wrapKey", "unwrapKey"]
  );
}

// ===============================
// WRAP / UNWRAP PRIVATE KEY
// ===============================
export async function wrapPrivateKey(privateKey, wrappingKey) {
  const wrapped = await crypto.subtle.wrapKey(
    "pkcs8",
    privateKey,
    wrappingKey,
    { name: "AES-KW" }
  );

  return bufferToBase64(wrapped);
}

export async function unwrapPrivateKey(wrappedKeyBase64, wrappingKey) {
  const wrappedBuffer = base64ToBuffer(wrappedKeyBase64);

  return await crypto.subtle.unwrapKey(
    "pkcs8",
    wrappedBuffer,
    wrappingKey,
    { name: "AES-KW" },
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}