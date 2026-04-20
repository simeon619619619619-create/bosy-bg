CREATE TABLE IF NOT EXISTS b2b_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  city TEXT,
  phone TEXT,
  sent_1 TIMESTAMPTZ,
  sent_2 TIMESTAMPTZ,
  sent_3 TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS b2b_campaigns_status_idx ON b2b_campaigns(replied_at, sent_1, sent_2, sent_3);
