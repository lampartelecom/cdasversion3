// Web Crypto helpers for CDAS: SHA-256 of arbitrary data, canonical hashing
// of diploma payloads, and HMAC-based "digital signature".
// Note: the signing key lives client-side for demo purposes. In production it
// would live in an edge function.

const SIGNING_KEY = "CDAS-CAMEROON-DIPLOMA-AUTH-2026";
const encoder = new TextEncoder();

export function bytesToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

export async function sha256Hex(input: ArrayBuffer | Uint8Array | string): Promise<string> {
  let data: ArrayBuffer;
  if (typeof input === "string") {
    data = encoder.encode(input).slice().buffer;
  } else if (input instanceof Uint8Array) {
    data = input.slice().buffer;
  } else {
    data = input;
  }
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(digest);
}

export async function sha256File(file: File | Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  return sha256Hex(buf);
}

/** Deterministic JSON string with sorted keys. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonicalize((value as Record<string, unknown>)[k]))
      .join(",") +
    "}"
  );
}

export async function hmacSignHex(payload: string): Promise<string> {
  const keyBuf = encoder.encode(SIGNING_KEY).slice().buffer;
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload).slice().buffer);
  return bytesToHex(sig);
}

export async function computeBlockHash(prevHash: string | null, dataHash: string, signature: string) {
  return sha256Hex(`${prevHash ?? "GENESIS"}|${dataHash}|${signature}`);
}
