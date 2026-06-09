-- ============================================================
-- BoutiKonect User Events Table
-- Permet de tracker le comportement des utilisateurs
-- pour les recommandations personnalisées
-- ============================================================

-- 1. Créer la table user_events
CREATE TABLE IF NOT EXISTS user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'page_view', 'product_view', 'service_view',
        'search', 'favorite_add', 'favorite_remove',
        'cart_add', 'cart_remove', 'purchase'
    )),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    category TEXT,
    search_query TEXT,
    referrer TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_category ON user_events(category);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_user_category ON user_events(user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_events_session ON user_events(session_id);

-- 3. RLS (Row Level Security)
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres événements
DROP POLICY IF EXISTS "Users can view own events" ON user_events;
CREATE POLICY "Users can view own events"
    ON user_events FOR SELECT
    USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres événements
DROP POLICY IF EXISTS "Users can insert own events" ON user_events;
CREATE POLICY "Users can insert own events"
    ON user_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all events" ON user_events;
CREATE POLICY "Admins can view all events"
    ON user_events FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Fonction RPC pour récupérer les recommandations
CREATE OR REPLACE FUNCTION get_recommended_products(p_user_id UUID, p_limit INTEGER DEFAULT 8)
RETURNS TABLE(
    id UUID,
    title TEXT,
    price NUMERIC,
    images TEXT[],
    cover_image TEXT,
    category TEXT,
    city TEXT,
    department TEXT,
    quantity INTEGER,
    is_promoted BOOLEAN,
    slug TEXT,
    seller_id UUID,
    seller_full_name TEXT,
    seller_store_name TEXT,
    seller_avatar_url TEXT,
    seller_city TEXT,
    relevance_score NUMERIC
) AS $$
DECLARE
    top_categories TEXT[];
    user_city TEXT;
    user_department TEXT;
BEGIN
    -- Récupérer les 3 catégories les plus consultées par l'utilisateur
    SELECT ARRAY_AGG(cat ORDER BY cnt DESC)
    INTO top_categories
    FROM (
        SELECT user_events.category AS cat, COUNT(*) AS cnt
        FROM user_events
        WHERE user_id = p_user_id
          AND user_events.category IS NOT NULL
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY user_events.category
        ORDER BY cnt DESC
        LIMIT 3
    ) t;

    -- Récupérer la ville et le département de l'utilisateur
    SELECT city, department INTO user_city, user_department
    FROM profiles
    WHERE id = p_user_id;

    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.price,
        p.images,
        p.cover_image,
        p.category::TEXT,
        p.city,
        p.department,
        p.quantity,
        p.is_promoted,
        p.slug,
        p.seller_id,
        pr.full_name AS seller_full_name,
        pr.store_name AS seller_store_name,
        pr.avatar_url AS seller_avatar_url,
        pr.city AS seller_city,
        CASE
            WHEN p.category::TEXT = ANY(top_categories) THEN 3.0
            ELSE 1.0
        END +
        CASE WHEN p.city = user_city THEN 2.0 ELSE 0.0 END +
        CASE WHEN p.department = user_department THEN 1.0 ELSE 0.0 END
        + COALESCE(p.rating, 0) * 0.5
        AS relevance_score
    FROM products p
    JOIN profiles pr ON pr.id = p.seller_id
    WHERE p.status = 'active'
      AND p.id NOT IN (
          SELECT COALESCE(product_id, '00000000-0000-0000-0000-000000000000')
          FROM user_events
          WHERE user_id = p_user_id AND event_type IN ('purchase', 'favorite_remove')
      )
    ORDER BY relevance_score DESC, p.view_count DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Fonction RPC pour les tendances (utilisateurs non connectés)
CREATE OR REPLACE FUNCTION get_trending_products(
    p_department TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 8
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    price NUMERIC,
    images TEXT[],
    cover_image TEXT,
    category TEXT,
    city TEXT,
    department TEXT,
    quantity INTEGER,
    is_promoted BOOLEAN,
    slug TEXT,
    seller_id UUID,
    seller_full_name TEXT,
    seller_store_name TEXT,
    seller_avatar_url TEXT,
    seller_city TEXT,
    popularity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.price,
        p.images,
        p.cover_image,
        p.category::TEXT,
        p.city,
        p.department,
        p.quantity,
        p.is_promoted,
        p.slug,
        p.seller_id,
        pr.full_name AS seller_full_name,
        pr.store_name AS seller_store_name,
        pr.avatar_url AS seller_avatar_url,
        pr.city AS seller_city,
        COALESCE(p.rating, 0) * 2.0 + LEAST(COALESCE(p.view_count, 0)::NUMERIC / 100, 5.0)
        AS popularity_score
    FROM products p
    JOIN profiles pr ON pr.id = p.seller_id
    WHERE p.status = 'active'
      AND (p_department IS NULL OR p.department = p_department)
      AND (p_city IS NULL OR p.city = p_city)
    ORDER BY popularity_score DESC, p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
