-- ============================================================
-- Migration 003: Fix missing columns for registration
-- ============================================================
-- Exécuter dans l'éditeur SQL de Supabase :
--   1. Aller à https://supabase.com/dashboard/project/logueiaidsizrmhujxzu
--   2. SQL Editor → New query
--   3. Coller et exécuter
-- ============================================================

-- 1. Ajouter les colonnes manquantes à profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seller_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS arrondissement TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_profiles_is_seller ON profiles(is_seller) WHERE is_seller = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp);
