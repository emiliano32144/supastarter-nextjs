CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  level_name TEXT DEFAULT 'Bronce',
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

CREATE TABLE IF NOT EXISTS earned_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  loyalty_level_id UUID REFERENCES loyalty_levels(id) ON DELETE SET NULL,
  reward_type TEXT NOT NULL,
  reward_value DECIMAL(10,2) DEFAULT 0,
  reward_description TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','used','expired')),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  reason TEXT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cut_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_profiles_org ON client_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON client_profiles(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_earned_rewards_client ON earned_rewards(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_earned_rewards_status ON earned_rewards(status);
CREATE INDEX IF NOT EXISTS idx_xp_history_client ON xp_history(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_org ON xp_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_cut_photos_client ON cut_photos(client_profile_id);
