
ALTER TABLE public.diplomas
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS birth_place TEXT,
  ADD COLUMN IF NOT EXISTS cni TEXT,
  ADD COLUMN IF NOT EXISTS mention TEXT,
  ADD COLUMN IF NOT EXISTS moyenne NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS attestation_number TEXT,
  ADD COLUMN IF NOT EXISTS pdf_hash TEXT,
  ADD COLUMN IF NOT EXISTS signature TEXT,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_by UUID;

CREATE UNIQUE INDEX IF NOT EXISTS diplomas_attestation_number_key
  ON public.diplomas(attestation_number) WHERE attestation_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS diplomas_pdf_hash_key
  ON public.diplomas(pdf_hash) WHERE pdf_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.blockchain_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_index BIGSERIAL NOT NULL,
  diploma_id UUID NOT NULL REFERENCES public.diplomas(id) ON DELETE RESTRICT,
  pdf_hash TEXT NOT NULL,
  signature TEXT NOT NULL,
  prev_hash TEXT,
  block_hash TEXT NOT NULL,
  event TEXT NOT NULL DEFAULT 'issue',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.blockchain_ledger TO authenticated;
GRANT ALL ON public.blockchain_ledger TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.blockchain_ledger_block_index_seq TO authenticated;

ALTER TABLE public.blockchain_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read ledger"
  ON public.blockchain_ledger FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Universities append their diploma blocks"
  ON public.blockchain_ledger FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.has_role(auth.uid(), 'university')
    AND diploma_id IN (SELECT id FROM public.diplomas WHERE issued_by = auth.uid())
  );

DROP POLICY IF EXISTS "Verifiers can read diplomas for verification" ON public.diplomas;
CREATE POLICY "Verifiers can read active diplomas"
  ON public.diplomas FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'verifier') AND status <> 'draft');
