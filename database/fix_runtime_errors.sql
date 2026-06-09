-- =============================================================================
-- Fixes for runtime errors reported on 2026-06-08
-- Apply in Supabase SQL Editor after schema.sql
-- =============================================================================

-- 1. Fix ambiguous "category" in get_recommended_products RPC
--    (conflict between RETURNS TABLE(category) and user_events.category)
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

-- 2. Fix ambiguous "review_count" in trigger function
--    (conflict between local variable name and table column)
CREATE OR REPLACE FUNCTION update_item_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    v_review_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.product_id IS NOT NULL THEN
            SELECT ROUND(AVG(rating)::NUMERIC, 2), COUNT(*)::INTEGER
            INTO avg_rating, v_review_count
            FROM reviews
            WHERE product_id = NEW.product_id AND status = 'approved';

            UPDATE products
            SET rating = COALESCE(avg_rating, 0),
                review_count = COALESCE(v_review_count, 0)
            WHERE id = NEW.product_id;
        ELSIF NEW.service_id IS NOT NULL THEN
            SELECT ROUND(AVG(rating)::NUMERIC, 2), COUNT(*)::INTEGER
            INTO avg_rating, v_review_count
            FROM reviews
            WHERE service_id = NEW.service_id AND status = 'approved';

            UPDATE services
            SET rating = COALESCE(avg_rating, 0),
                review_count = COALESCE(v_review_count, 0)
            WHERE id = NEW.service_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.product_id IS NOT NULL THEN
            SELECT ROUND(AVG(rating)::NUMERIC, 2), COUNT(*)::INTEGER
            INTO avg_rating, v_review_count
            FROM reviews
            WHERE product_id = OLD.product_id AND status = 'approved';

            UPDATE products
            SET rating = COALESCE(avg_rating, 0),
                review_count = COALESCE(v_review_count, 0)
            WHERE id = OLD.product_id;
        ELSIF OLD.service_id IS NOT NULL THEN
            SELECT ROUND(AVG(rating)::NUMERIC, 2), COUNT(*)::INTEGER
            INTO avg_rating, v_review_count
            FROM reviews
            WHERE service_id = OLD.service_id AND status = 'approved';

            UPDATE services
            SET rating = COALESCE(avg_rating, 0),
                review_count = COALESCE(v_review_count, 0)
            WHERE id = OLD.service_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Enable anonymous sign-ins (required for guest checkout)
-- Run this in Supabase dashboard: Authentication > Providers > Anonymous > Enable
-- Or via SQL:
-- UPDATE auth.config SET allow_anonymous_sign_ins = true;
