-- Migration: Add generated_apps table for AI App Builder

CREATE TABLE IF NOT EXISTS generated_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  models JSONB DEFAULT '[]',
  api_routes JSONB DEFAULT '[]',
  ui_components JSONB DEFAULT '[]',
  installed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_generated_apps_user_id ON generated_apps(user_id);
