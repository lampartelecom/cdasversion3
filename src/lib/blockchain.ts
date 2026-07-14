import { supabase } from "@/integrations/supabase/client";
import { canonicalize, computeBlockHash, hmacSignHex, sha256Hex } from "./crypto";

export interface DiplomaCanonicalPayload {
  attestation_number: string;
  reference: string;
  holder_name: string;
  cni: string | null;
  birth_date: string | null;
  birth_place: string | null;
  diploma_type: string;
  specialization: string | null;
  institution: string;
  year: string;
  mention: string | null;
  moyenne: number | null;
  issued_by: string;
}

/** Canonical SHA-256 fingerprint of a diploma's official fields. */
export async function computeDataHash(payload: DiplomaCanonicalPayload): Promise<string> {
  return sha256Hex(canonicalize(payload));
}

/** Sign a data-hash with the CDAS institutional key (HMAC-SHA256). */
export async function signDataHash(dataHash: string): Promise<string> {
  return hmacSignHex(dataHash);
}

/** Fetch the current top of the ledger to link the next block. */
export async function getLatestBlockHash(): Promise<string | null> {
  const { data } = await supabase
    .from("blockchain_ledger")
    .select("block_hash")
    .order("block_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.block_hash ?? null;
}

/** Append a new block to the ledger. Returns the inserted block. */
export async function appendBlock(params: {
  diploma_id: string;
  pdf_hash: string;
  signature: string;
  created_by: string;
  event?: "issue" | "revoke";
}) {
  const prevHash = await getLatestBlockHash();
  const block_hash = await computeBlockHash(prevHash, params.pdf_hash, params.signature);
  const { data, error } = await supabase
    .from("blockchain_ledger")
    .insert({
      diploma_id: params.diploma_id,
      pdf_hash: params.pdf_hash,
      signature: params.signature,
      prev_hash: prevHash,
      block_hash,
      event: params.event ?? "issue",
      created_by: params.created_by,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
