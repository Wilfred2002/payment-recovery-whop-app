-- Add trial_ends_at column to creator_settings table
ALTER TABLE creator_settings
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Add index for trial queries
CREATE INDEX IF NOT EXISTS idx_creator_settings_trial_ends_at ON creator_settings(trial_ends_at);

-- Update existing records to have a trial period (30 days from now)
-- This gives existing users a trial if they don't have one yet
UPDATE creator_settings
SET trial_ends_at = NOW() + INTERVAL '30 days'
WHERE trial_ends_at IS NULL;
