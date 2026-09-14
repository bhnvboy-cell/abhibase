-- Migration: Add websites table for Website Generator

CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  html TEXT DEFAULT '',
  css TEXT DEFAULT '',
  js TEXT DEFAULT '',
  template VARCHAR(50) DEFAULT 'custom',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  custom_domain VARCHAR(255),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_slug ON websites(slug);
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
