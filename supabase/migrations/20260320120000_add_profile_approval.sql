ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Existing accounts stay active, while new registrations will be pending by default.
UPDATE public.profiles
SET is_approved = TRUE
WHERE is_approved = FALSE;
