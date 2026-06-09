-- ============================================================
-- Migration 002: Add neighborhood and arrondissement columns
-- ============================================================
-- Ajoute les colonnes manquantes aux tables concernées pour
-- la géolocalisation précise (quartier + arrondissement).
--
-- Exécuter dans l'éditeur SQL de Supabase :
--   1. Aller à https://supabase.com/dashboard/project/logueiaidsizrmhujxzu
--   2. SQL Editor → New query
--   3. Coller et exécuter
-- ============================================================

-- 1. PROFILES — ajout de neighborhood et arrondissement
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS arrondissement TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_arrondissement ON profiles(arrondissement);
CREATE INDEX IF NOT EXISTS idx_profiles_neighborhood ON profiles(neighborhood);

-- 2. PRODUCTS — ajout de arrondissement (neighborhood existe déjà ?)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS arrondissement TEXT;

CREATE INDEX IF NOT EXISTS idx_products_arrondissement ON products(arrondissement);

-- 3. SERVICES — ajout de arrondissement
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS arrondissement TEXT;

CREATE INDEX IF NOT EXISTS idx_services_arrondissement ON services(arrondissement);
