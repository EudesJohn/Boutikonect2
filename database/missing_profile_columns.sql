-- =============================================================================
-- Missing profiles columns
-- Description: Adds columns used by the codebase but missing from schema.sql.
-- These may already exist in your Supabase project if added manually.
-- Run this safely with IF NOT EXISTS.
-- =============================================================================

-- is_seller: used by AuthContext.isSeller, Register.jsx, ProtectedRoute, etc.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT FALSE;

-- seller_since: used by Register.jsx, Profile.jsx
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_since TIMESTAMPTZ;

-- neighborhood: used by Register.jsx, ServiceDetail.jsx, SellerProfile.jsx
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- whatsapp: used by Register.jsx, Profile.jsx, Publish.jsx, etc.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;
