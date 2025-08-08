-- Ensure uniqueness on profiles.user_id to support FK relationships
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique ON public.profiles (user_id);

-- Add foreign key from trainers.user_id -> profiles.user_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_trainers_user_profile'
  ) THEN
    ALTER TABLE public.trainers
    ADD CONSTRAINT fk_trainers_user_profile
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(user_id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Helpful index for join performance
CREATE INDEX IF NOT EXISTS idx_trainers_user_id ON public.trainers(user_id);
