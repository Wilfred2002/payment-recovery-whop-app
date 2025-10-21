-- Create creator_settings table
CREATE TABLE IF NOT EXISTS creator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  email_subject TEXT NOT NULL DEFAULT '⚠️ Your payment failed - Update needed',
  email_body TEXT NOT NULL DEFAULT 'Hi {name},

We noticed your recent payment of {amount} failed. This can happen for a few reasons:

• Your card has expired
• You''ve reached your card limit
• Your bank declined the charge

To keep your access, please update your payment method within 24 hours.

{updateLink}

If you have any questions, feel free to reach out. We''re here to help!

Best,
The Team',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on company_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_creator_settings_company_id ON creator_settings(company_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_creator_settings_updated_at
  BEFORE UPDATE ON creator_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
