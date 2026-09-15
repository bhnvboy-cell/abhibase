-- Fitness Tracker Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  duration DECIMAL(12,2) NOT NULL,
  calories DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  target DECIMAL(12,2) NOT NULL,
  current DECIMAL(12,2),
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

