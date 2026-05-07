
// BASE64 HELPERS
export const bufferToBase64 = (buffer) => {
  return btoa(
    Array.from(new Uint8Array(buffer))
      .map((b) =>
        String.fromCharCode(b)
      )
      .join("")
  );
};

export const base64ToBuffer = (base64) => {
  const binary = atob(base64);

  const bytes = new Uint8Array(
    binary.length
  );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes.buffer;
};


// GENERATE RSA KEY PAIR


export async function generateRSAKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",

      modulusLength: 2048,

      publicExponent:
        new Uint8Array([
          1, 0, 1,
        ]),

      hash: "SHA-256",
    },

    true,

    ["encrypt", "decrypt"]
  );
}


// EXPORT PUBLIC KEY


export async function exportPublicKey(
  publicKey
) {
  const exported =
    await crypto.subtle.exportKey(
      "spki",
      publicKey
    );

  return bufferToBase64(
    exported
  );
}


// GENERATE SALT


export function generateSalt() {
  return crypto.getRandomValues(
    new Uint8Array(16)
  );
}


// DERIVE AES-GCM KEY


export async function deriveKey(
  password,
  salt
) {
  const encoder =
    new TextEncoder();

  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",

      salt,

      iterations: 100000,

      hash: "SHA-256",
    },

    keyMaterial,

    {
      name: "AES-GCM",

      length: 256,
    },

    true,

    ["encrypt", "decrypt"]
  );
}


// WRAP PRIVATE KEY


export async function wrapPrivateKey(
  privateKey,
  wrappingKey
) {
  // export RSA private key
  const exported =
    await crypto.subtle.exportKey(
      "pkcs8",
      privateKey
    );

  // generate random IV
  const iv =
    crypto.getRandomValues(
      new Uint8Array(12)
    );

  // encrypt private key
  const encrypted =
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",

        iv,
      },

      wrappingKey,

      exported
    );

  // combine IV + ciphertext
  const combined =
    new Uint8Array(
      iv.length +
        encrypted.byteLength
    );

  combined.set(iv, 0);

  combined.set(
    new Uint8Array(encrypted),
    iv.length
  );

  // return single base64 string
  return bufferToBase64(
    combined
  );
}

// UNWRAP PRIVATE KEY

export async function unwrapPrivateKey(
  wrappedKeyBase64,
  wrappingKey
) {
  // decode base64
  const combinedBuffer =
    base64ToBuffer(
      wrappedKeyBase64
    );

  // convert to Uint8Array
  const combined =
    new Uint8Array(
      combinedBuffer
    );

  // extract IV
  const iv =
    combined.slice(0, 12);

  // extract ciphertext
  const encrypted =
    combined.slice(12);

  // decrypt private key
  const decrypted =
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",

        iv,
      },

      wrappingKey,

      encrypted
    );

  // restore RSA private key
  return await crypto.subtle.importKey(
    "pkcs8",

    decrypted,

    {
      name: "RSA-OAEP",

      hash: "SHA-256",
    },

    true,

    ["decrypt"]
  );
}



// Decrypt Received message

export async function decryptMessage(payload) {

  try {

    const privateKeyJwk = JSON.parse(
      localStorage.getItem("privateKey")
    );

    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      privateKeyJwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );

    // Decode encrypted AES key

const encryptedKey = Uint8Array.from(
  atob(payload.encryptedKeyForSelf),
  c => c.charCodeAt(0)
);







    // Decrypt AES key
    const aesKeyRaw = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedKey
    );

    // Import AES key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      aesKeyRaw,
      {
        name: "AES-GCM",
      },
      false,
      ["decrypt"]
    );

    // Decode IV
    const iv = Uint8Array.from(
      atob(payload.iv),
      c => c.charCodeAt(0)
    );

    // Decode ciphertext
    const ciphertext = Uint8Array.from(
      atob(payload.ciphertext),
      c => c.charCodeAt(0)
    );

    // AES decrypt
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      aesKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);

  } catch (err) {

    console.error("Decrypt error:", err);

    return "[Unable to decrypt]";
  }
}