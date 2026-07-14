
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('student', 'verifier', 'university');
CREATE TYPE public.diploma_status AS ENUM ('active', 'revoked');
CREATE TYPE public.verification_result AS ENUM ('authentic', 'invalid', 'not_found');

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============= USER ROLES =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'university' THEN 1
    WHEN 'verifier' THEN 2
    WHEN 'student' THEN 3
  END
  LIMIT 1
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ============= DIPLOMAS =============
CREATE TABLE public.diplomas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  qr_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  issued_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  holder_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  holder_name TEXT NOT NULL,
  holder_email TEXT,
  diploma_type TEXT NOT NULL,
  specialization TEXT,
  institution TEXT NOT NULL,
  year TEXT NOT NULL,
  verification_fee INTEGER NOT NULL DEFAULT 5000,
  status public.diploma_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diplomas ENABLE ROW LEVEL SECURITY;
CREATE INDEX diplomas_qr_token_idx ON public.diplomas(qr_token);
CREATE INDEX diplomas_reference_idx ON public.diplomas(reference);
CREATE INDEX diplomas_issued_by_idx ON public.diplomas(issued_by);
CREATE INDEX diplomas_holder_user_id_idx ON public.diplomas(holder_user_id);

-- Universities can manage what they issue
CREATE POLICY "Universities insert diplomas"
  ON public.diplomas FOR INSERT
  WITH CHECK (auth.uid() = issued_by AND public.has_role(auth.uid(), 'university'));

CREATE POLICY "Universities view own diplomas"
  ON public.diplomas FOR SELECT
  USING (auth.uid() = issued_by AND public.has_role(auth.uid(), 'university'));

CREATE POLICY "Universities update own diplomas"
  ON public.diplomas FOR UPDATE
  USING (auth.uid() = issued_by AND public.has_role(auth.uid(), 'university'));

-- Students can see their own diplomas
CREATE POLICY "Students view their diplomas"
  ON public.diplomas FOR SELECT
  USING (auth.uid() = holder_user_id);

-- Authenticated verifiers can read any diploma (needed for verification flow)
CREATE POLICY "Verifiers can read diplomas for verification"
  ON public.diplomas FOR SELECT
  USING (public.has_role(auth.uid(), 'verifier'));

-- ============= VERIFICATIONS =============
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verifier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diploma_id UUID REFERENCES public.diplomas(id) ON DELETE SET NULL,
  query_value TEXT NOT NULL,
  query_type TEXT NOT NULL,
  result public.verification_result NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  amount INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX verifications_verifier_idx ON public.verifications(verifier_id);
CREATE INDEX verifications_diploma_idx ON public.verifications(diploma_id);

CREATE POLICY "Verifiers see own verifications"
  ON public.verifications FOR SELECT
  USING (auth.uid() = verifier_id);

CREATE POLICY "Verifiers create their verifications"
  ON public.verifications FOR INSERT
  WITH CHECK (auth.uid() = verifier_id);

CREATE POLICY "Verifiers update their own verifications"
  ON public.verifications FOR UPDATE
  USING (auth.uid() = verifier_id);

-- Diploma owners (students) and issuing universities can also see verifications about their diplomas
CREATE POLICY "Diploma stakeholders see related verifications"
  ON public.verifications FOR SELECT
  USING (
    diploma_id IN (
      SELECT id FROM public.diplomas
      WHERE holder_user_id = auth.uid() OR issued_by = auth.uid()
    )
  );

-- ============= TRIGGERS =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  -- profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  -- role from signup metadata, default student
  BEGIN
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');
  EXCEPTION WHEN OTHERS THEN
    _role := 'student';
  END;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_set_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER diplomas_set_updated
  BEFORE UPDATE ON public.diplomas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
