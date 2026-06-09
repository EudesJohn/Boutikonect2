-- ============================================================
-- FIX: Fonction trigger handle_new_user pour Google OAuth
-- ============================================================

-- 1. S'assurer que les types existent
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ajouter is_seller si la colonne n'existe pas (compatibilité frontend)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_seller BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_since TIMESTAMPTZ;

-- 3. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Créer / remplacer la fonction trigger
-- ATTENTION: PAS de SET search_path = '' car le type user_role est dans public
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    existing_count INTEGER;
    user_full_name TEXT;
    new_role user_role;
BEGIN
    -- Le premier utilisateur devient admin
    SELECT COUNT(*) INTO existing_count FROM public.profiles;

    -- Gérer les différents formats de nom selon le provider OAuth
    -- Google utilise "name", email/password utilise "full_name"
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.email,
        'Utilisateur'
    );

    -- Déterminer le rôle
    IF existing_count = 0 THEN
        new_role := 'admin'::user_role;
    ELSIF NEW.raw_user_meta_data->>'role' IS NOT NULL
          AND NEW.raw_user_meta_data->>'role' IN ('buyer', 'seller', 'admin') THEN
        new_role := (NEW.raw_user_meta_data->>'role')::user_role;
    ELSE
        new_role := 'buyer'::user_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, phone, role, is_seller)
    VALUES (
        NEW.id,
        NEW.email,
        user_full_name,
        NEW.raw_user_meta_data->>'phone',
        new_role,
        CASE WHEN existing_count = 0 THEN true ELSE false END
    );

    RETURN NEW;
END;
$function$;

-- 5. Créer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 6. Vérifier que la fonction existe
SELECT proname, prorettype::regtype as return_type
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pg_function_is_visible(oid);

-- 7. Nettoyer les utilisateurs orphelins
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
AND created_at < now() - interval '1 minute';
