-- Real Estate Platform Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE propertys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  bedrooms DECIMAL(12,2),
  area DECIMAL(12,2),
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inquirys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  property_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

