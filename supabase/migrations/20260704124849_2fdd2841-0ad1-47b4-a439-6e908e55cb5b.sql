
-- Universities upload into their own folder
CREATE POLICY "Universities upload own diploma PDFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'diplomas'
    AND public.has_role(auth.uid(), 'university')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Universities read own diploma PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'diplomas'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Students read PDFs of their diplomas"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'diplomas'
    AND EXISTS (
      SELECT 1 FROM public.diplomas d
      WHERE d.holder_user_id = auth.uid()
        AND name = d.issued_by::text || '/' || d.id::text || '.pdf'
    )
  );

CREATE POLICY "Verifiers read active diploma PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'diplomas'
    AND public.has_role(auth.uid(), 'verifier')
    AND EXISTS (
      SELECT 1 FROM public.diplomas d
      WHERE d.status <> 'draft'
        AND name = d.issued_by::text || '/' || d.id::text || '.pdf'
    )
  );
