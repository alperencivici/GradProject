-- Create address_lookup table for cascading address dropdowns
CREATE TABLE IF NOT EXISTS address_lookup (
  id SERIAL PRIMARY KEY,
  il TEXT NOT NULL,
  ilce TEXT NOT NULL,
  semt TEXT,
  mahalle TEXT
);

-- Index for fast cascading lookups
CREATE INDEX IF NOT EXISTS idx_address_il ON address_lookup (il);
CREATE INDEX IF NOT EXISTS idx_address_ilce ON address_lookup (il, ilce);
CREATE INDEX IF NOT EXISTS idx_address_semt ON address_lookup (il, ilce, semt);

-- Enable RLS
ALTER TABLE address_lookup ENABLE ROW LEVEL SECURITY;

-- Everyone can read the lookup table
CREATE POLICY "Address lookup is public." ON address_lookup FOR SELECT USING (true);
