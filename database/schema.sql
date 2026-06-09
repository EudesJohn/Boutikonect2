-- ============================================================
-- BoutiKonect Complete Database Schema
-- PostgreSQL with Row-Level Security
-- ============================================================

-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CUSTOM TYPES & ENUMS
-- ============================================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE product_status AS ENUM ('active', 'inactive', 'sold', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE service_status AS ENUM ('active', 'inactive', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE report_reason AS ENUM ('spam', 'inappropriate', 'fake', 'offensive', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('mobile_money', 'bank_transfer', 'cash_on_delivery', 'card'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE product_category AS ENUM (
        'clothing', 'electronics', 'home_garden', 'beauty_health',
        'sports', 'books', 'food_beverages', 'handicrafts',
        'automotive', 'baby_kids', 'pet_supplies', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE service_category AS ENUM (
        'education_tutoring', 'home_repair', 'beauty_wellness',
        'it_support', 'delivery_logistics', 'photography',
        'consulting', 'cleaning', 'event_planning', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABLES
-- ============================================================

-- 2.1 PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    banner_url TEXT,
    role user_role NOT NULL DEFAULT 'buyer',
    bio TEXT,
    store_name TEXT,
    store_description TEXT,
    store_logo_url TEXT,
    store_banner_url TEXT,
    city TEXT,
    department TEXT,
    commune_id INTEGER,
    address TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified_at TIMESTAMPTZ,
    rating NUMERIC(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    product_count INTEGER DEFAULT 0,
    service_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    total_sales NUMERIC(12,2) DEFAULT 0.00,
    last_seen_at TIMESTAMPTZ,
    notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    category product_category NOT NULL DEFAULT 'other',
    subcategory TEXT,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(12,2) CHECK (compare_at_price >= 0),
    currency TEXT NOT NULL DEFAULT 'XOF',
    condition TEXT DEFAULT 'new',
    brand TEXT,
    tags TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    cover_image TEXT,
    video_url TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    unit TEXT DEFAULT 'piece',
    min_order_qty INTEGER DEFAULT 1,
    weight NUMERIC(10,2),
    dimensions TEXT,
    is_digital BOOLEAN NOT NULL DEFAULT FALSE,
    digital_file_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
    promoted_until TIMESTAMPTZ,
    status product_status NOT NULL DEFAULT 'active',
    city TEXT,
    department TEXT,
    commune_id INTEGER,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    is_deliverable BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_fee NUMERIC(12,2) DEFAULT 0.00,
    delivery_radius_km INTEGER DEFAULT 50,
    rating NUMERIC(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    saved_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    category service_category NOT NULL DEFAULT 'other',
    subcategory TEXT,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'XOF',
    pricing_type TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'hourly', 'custom_quote')),
    images TEXT[] DEFAULT '{}',
    cover_image TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
    promoted_until TIMESTAMPTZ,
    status service_status NOT NULL DEFAULT 'active',
    city TEXT,
    department TEXT,
    commune_id INTEGER,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    is_remote_available BOOLEAN NOT NULL DEFAULT FALSE,
    is_on_site_available BOOLEAN NOT NULL DEFAULT TRUE,
    service_radius_km INTEGER DEFAULT 30,
    availability TEXT DEFAULT 'weekdays',
    rating NUMERIC(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    saved_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(12,2) DEFAULT 0.00 CHECK (delivery_fee >= 0),
    service_fee NUMERIC(12,2) DEFAULT 0.00 CHECK (service_fee >= 0),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'XOF',
    status order_status NOT NULL DEFAULT 'pending',
    payment_method payment_method,
    payment_ref TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    buyer_notes TEXT,
    seller_notes TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_department TEXT,
    shipping_commune_id INTEGER,
    shipping_latitude NUMERIC(10,7),
    shipping_longitude NUMERIC(10,7),
    delivery_contact_phone TEXT,
    delivery_contact_name TEXT,
    estimated_delivery_date DATE,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    refund_amount NUMERIC(12,2),
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    images TEXT[] DEFAULT '{}',
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    status review_status NOT NULL DEFAULT 'pending',
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT review_target_check CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR
        (product_id IS NULL AND service_id IS NOT NULL)
    )
);

-- 2.6 REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    reason report_reason NOT NULL,
    description TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_note TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 SAVED ITEMS (wishlist / bookmarks)
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT saved_item_target_check CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR
        (product_id IS NULL AND service_id IS NOT NULL)
    ),
    UNIQUE(user_id, product_id),
    UNIQUE(user_id, service_id)
);

-- 2.8 CONVERSATIONS (messaging)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    buyer_unread_count INTEGER DEFAULT 0,
    seller_unread_count INTEGER DEFAULT 0,
    is_buyer_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_seller_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(buyer_id, seller_id, product_id),
    UNIQUE(buyer_id, seller_id, service_id)
);

-- 2.9 MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.11 TRANSACTIONS (for financial records)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('payment', 'refund', 'payout', 'fee')),
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    status TEXT NOT NULL DEFAULT 'completed',
    payment_ref TEXT,
    gateway_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.12 PROMOTIONS / ADS
-- ============================================================
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('featured', 'boosted', 'banner', 'homepage')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT promotion_target_check CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR
        (product_id IS NULL AND service_id IS NOT NULL)
    )
);


-- 3. INDEXES
-- ============================================================

-- 3.1 PROFILES INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_store_name ON profiles(store_name) WHERE store_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified) WHERE is_verified = TRUE;

-- 3.2 PRODUCTS INDEXES
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_department ON products(department);
CREATE INDEX IF NOT EXISTS idx_products_city ON products(city);
CREATE INDEX IF NOT EXISTS idx_products_promoted ON products(is_promoted, promoted_until) WHERE is_promoted = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(to_tsvector('french', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_products_location ON products(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3.3 SERVICES INDEXES
CREATE INDEX IF NOT EXISTS idx_services_seller_id ON services(seller_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_price ON services(price);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_rating ON services(rating DESC);
CREATE INDEX IF NOT EXISTS idx_services_department ON services(department);
CREATE INDEX IF NOT EXISTS idx_services_promoted ON services(is_promoted, promoted_until) WHERE is_promoted = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_search ON services USING GIN(to_tsvector('french', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_services_location ON services(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3.4 ORDERS INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON orders(service_id) WHERE service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_is_paid ON orders(is_paid) WHERE is_paid = TRUE;

-- 3.5 REVIEWS INDEXES
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id) WHERE service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- 3.6 REPORTS INDEXES
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- 3.7 SAVED ITEMS INDEXES
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_product_id ON saved_items(product_id) WHERE product_id IS NOT NULL;

-- 3.8 CONVERSATIONS & MESSAGES INDEXES
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 3.9 NOTIFICATIONS INDEXES
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);


-- 4. FUNCTIONS
-- ============================================================

-- 4.1 AUTO-UPDATE UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 GENERATE UNIQUE ORDER NUMBER
-- ============================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := 'BK-';
    i INTEGER;
BEGIN
    result := result || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
    FOR i IN 1..6 LOOP
        result := result || SUBSTRING(chars FROM FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER FOR 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4.3 AUTO-SET ORDER NUMBER ON INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.4 UPDATE PRODUCT / SERVICE RATING
-- ============================================================
CREATE OR REPLACE FUNCTION update_item_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    v_review_count INTEGER;
BEGIN
    -- For products
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

-- 4.5 UPDATE SELLER STATS ON ORDER CHANGE
-- ============================================================
CREATE OR REPLACE FUNCTION update_seller_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles
        SET order_count = order_count + 1,
            total_sales = total_sales + NEW.total_amount
        WHERE id = NEW.seller_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        IF NEW.status = 'delivered' THEN
            UPDATE profiles
            SET total_sales = total_sales + NEW.total_amount
            WHERE id = NEW.seller_id;
        ELSIF NEW.status = 'cancelled' AND OLD.status = 'delivered' THEN
            UPDATE profiles
            SET total_sales = total_sales - NEW.total_amount
            WHERE id = NEW.seller_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles
        SET order_count = order_count - 1,
            total_sales = total_sales - OLD.total_amount
        WHERE id = OLD.seller_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4.6 INCREMENT VIEW COUNT
-- ============================================================
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
    -- This is called manually via RPC, not as a trigger
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.7 SEARCH PRODUCTS BY DISTANCE (Haversine in SQL)
-- ============================================================
CREATE OR REPLACE FUNCTION search_products_by_distance(
    user_lat NUMERIC,
    user_lng NUMERIC,
    max_distance_km INTEGER DEFAULT 50,
    p_category TEXT DEFAULT NULL,
    p_query TEXT DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    slug TEXT,
    price NUMERIC,
    cover_image TEXT,
    category TEXT,
    city TEXT,
    department TEXT,
    distance_km NUMERIC,
    rating NUMERIC,
    review_count INTEGER,
    seller_id UUID,
    seller_name TEXT,
    seller_store_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.slug,
        p.price,
        p.cover_image,
        p.category::TEXT,
        p.city,
        p.department,
        ROUND(
            (6371 * ACOS(
                LEAST(1, GREATEST(-1,
                    COS(RADIANS(user_lat)) * COS(RADIANS(p.latitude)) *
                    COS(RADIANS(p.longitude) - RADIANS(user_lng)) +
                    SIN(RADIANS(user_lat)) * SIN(RADIANS(p.latitude))
                ))
            ))::NUMERIC, 1
        ) AS distance_km,
        p.rating,
        p.review_count,
        p.seller_id,
        pr.full_name AS seller_name,
        pr.store_name AS seller_store_name,
        p.created_at
    FROM products p
    JOIN profiles pr ON pr.id = p.seller_id
    WHERE p.status = 'active'
        AND p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
        AND (6371 * ACOS(
            LEAST(1, GREATEST(-1,
                COS(RADIANS(user_lat)) * COS(RADIANS(p.latitude)) *
                COS(RADIANS(p.longitude) - RADIANS(user_lng)) +
                SIN(RADIANS(user_lat)) * SIN(RADIANS(p.latitude))
            ))
        )) <= max_distance_km
        AND (p_category IS NULL OR p.category::TEXT = p_category)
        AND (p_query IS NULL OR p.title ILIKE '%' || p_query || '%' OR COALESCE(p.description, '') ILIKE '%' || p_query || '%')
        AND (p_min_price IS NULL OR p.price >= p_min_price)
        AND (p_max_price IS NULL OR p.price <= p_max_price)
    ORDER BY distance_km ASC, p.rating DESC, p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4.8 GET ADMIN DASHBOARD STATS
-- ============================================================
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT JSONB_BUILD_OBJECT(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'total_buyers', (SELECT COUNT(*) FROM profiles WHERE role = 'buyer'),
        'total_sellers', (SELECT COUNT(*) FROM profiles WHERE role = 'seller'),
        'total_products', (SELECT COUNT(*) FROM products WHERE status = 'active'),
        'total_services', (SELECT COUNT(*) FROM services WHERE status = 'active'),
        'total_orders', (SELECT COUNT(*) FROM orders),
        'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered'),
        'pending_orders', (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
        'pending_reviews', (SELECT COUNT(*) FROM reviews WHERE status = 'pending'),
        'pending_reports', (SELECT COUNT(*) FROM reports WHERE status = 'pending'),
        'total_promoted_items', (
            SELECT COUNT(*) FROM products WHERE is_promoted = TRUE AND promoted_until > NOW()
        ) + (
            SELECT COUNT(*) FROM services WHERE is_promoted = TRUE AND promoted_until > NOW()
        ),
        'recent_users', (
            SELECT COALESCE(JSONB_AGG(sub), '[]'::jsonb) FROM (
                SELECT JSONB_BUILD_OBJECT(
                    'id', id, 'full_name', full_name, 'email', email, 'role', role, 'created_at', created_at
                ) AS sub
                FROM profiles
                ORDER BY created_at DESC
                LIMIT 10
            ) t
        ),
        'recent_orders', (
            SELECT COALESCE(JSONB_AGG(sub), '[]'::jsonb) FROM (
                SELECT JSONB_BUILD_OBJECT(
                    'id', id, 'order_number', order_number, 'total_amount', total_amount,
                    'status', status, 'created_at', created_at
                ) AS sub
                FROM orders
                ORDER BY created_at DESC
                LIMIT 10
            ) t
        )
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4.9 GET SELLER DASHBOARD STATS
-- ============================================================
CREATE OR REPLACE FUNCTION get_seller_dashboard_stats(p_seller_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT JSONB_BUILD_OBJECT(
        'total_products', (SELECT COUNT(*) FROM products WHERE seller_id = p_seller_id),
        'active_products', (SELECT COUNT(*) FROM products WHERE seller_id = p_seller_id AND status = 'active'),
        'total_services', (SELECT COUNT(*) FROM services WHERE seller_id = p_seller_id),
        'active_services', (SELECT COUNT(*) FROM services WHERE seller_id = p_seller_id AND status = 'active'),
        'total_orders', (SELECT COUNT(*) FROM orders WHERE seller_id = p_seller_id),
        'pending_orders', (SELECT COUNT(*) FROM orders WHERE seller_id = p_seller_id AND status = 'pending'),
        'processing_orders', (SELECT COUNT(*) FROM orders WHERE seller_id = p_seller_id AND status = 'processing'),
        'delivered_orders', (SELECT COUNT(*) FROM orders WHERE seller_id = p_seller_id AND status = 'delivered'),
        'cancelled_orders', (SELECT COUNT(*) FROM orders WHERE seller_id = p_seller_id AND status = 'cancelled'),
        'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE seller_id = p_seller_id AND status = 'delivered'),
        'monthly_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE seller_id = p_seller_id AND status = 'delivered' AND created_at >= DATE_TRUNC('month', NOW())),
        'average_rating', (SELECT COALESCE(AVG(rating), 0) FROM products WHERE seller_id = p_seller_id AND review_count > 0),
        'recent_orders', (
            SELECT COALESCE(JSONB_AGG(sub), '[]'::jsonb) FROM (
                SELECT JSONB_BUILD_OBJECT(
                    'id', o.id, 'order_number', o.order_number, 'total_amount', o.total_amount,
                    'status', o.status, 'buyer_name', p.full_name, 'created_at', o.created_at
                ) AS sub
                FROM orders o
                JOIN profiles p ON p.id = o.buyer_id
                WHERE o.seller_id = p_seller_id
                ORDER BY o.created_at DESC
                LIMIT 10
            ) t
        )
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;


-- 5. TRIGGERS
-- ============================================================

-- 5.1 UPDATED_AT TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles CASCADE;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products CASCADE;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services CASCADE;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders CASCADE;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews CASCADE;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports CASCADE;
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5.2 ORDER NUMBER TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS set_order_number_trigger ON orders CASCADE;
CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- 5.3 RATING UPDATE TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS update_product_rating_on_review ON reviews CASCADE;
CREATE TRIGGER update_product_rating_on_review
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_item_rating();

-- 5.4 SELLER STATS TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS update_seller_stats_on_order ON orders CASCADE;
CREATE TRIGGER update_seller_stats_on_order
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_seller_stats();

-- 5.5 AUTO CREATE PROFILE ON USER SIGNUP
-- ============================================================
-- Le premier utilisateur inscrit devient automatiquement admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_count FROM public.profiles;

    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'phone',
        CASE
            WHEN existing_count = 0 THEN 'admin'::user_role
            ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')::user_role
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5.6 UPDATE PROFILE COUNTS WHEN PRODUCT CHANGES
-- ============================================================
CREATE OR REPLACE FUNCTION update_seller_product_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles
        SET product_count = (SELECT COUNT(*) FROM products WHERE seller_id = NEW.seller_id AND status = 'active')
        WHERE id = NEW.seller_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        UPDATE profiles
        SET product_count = (SELECT COUNT(*) FROM products WHERE seller_id = NEW.seller_id AND status = 'active')
        WHERE id = NEW.seller_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles
        SET product_count = (SELECT COUNT(*) FROM products WHERE seller_id = OLD.seller_id AND status = 'active')
        WHERE id = OLD.seller_id;
        RETURN OLD;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_seller_product_count_trigger ON products CASCADE;
CREATE TRIGGER update_seller_product_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION update_seller_product_count();

-- 5.7 UPDATE PROFILE COUNTS WHEN SERVICE CHANGES
-- ============================================================
CREATE OR REPLACE FUNCTION update_seller_service_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles
        SET service_count = (SELECT COUNT(*) FROM services WHERE seller_id = NEW.seller_id AND status = 'active')
        WHERE id = NEW.seller_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        UPDATE profiles
        SET service_count = (SELECT COUNT(*) FROM services WHERE seller_id = NEW.seller_id AND status = 'active')
        WHERE id = NEW.seller_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles
        SET service_count = (SELECT COUNT(*) FROM services WHERE seller_id = OLD.seller_id AND status = 'active')
        WHERE id = OLD.seller_id;
        RETURN OLD;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_seller_service_count_trigger ON services CASCADE;
CREATE TRIGGER update_seller_service_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON services
    FOR EACH ROW EXECUTE FUNCTION update_seller_service_count();


-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- 6.1 ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- 6.2 PROFILES POLICIES
-- ============================================================
-- Anyone can view public profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles CASCADE;
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles CASCADE;
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles CASCADE;
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only admins can delete profiles
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles CASCADE;
CREATE POLICY "Only admins can delete profiles"
    ON profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6.3 PRODUCTS POLICIES
-- ============================================================
-- Anyone can view active products
DROP POLICY IF EXISTS "Anyone can view active products" ON products CASCADE;
CREATE POLICY "Anyone can view active products"
    ON products FOR SELECT
    USING (status = 'active' OR auth.uid() = seller_id OR (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    ));

-- Sellers can create products
DROP POLICY IF EXISTS "Sellers can create products" ON products CASCADE;
CREATE POLICY "Sellers can create products"
    ON products FOR INSERT
    WITH CHECK (
        auth.uid() = seller_id AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND (role = 'seller' OR role = 'admin')
            )
        )
    );

-- Sellers can update their own products
DROP POLICY IF EXISTS "Sellers can update their own products" ON products CASCADE;
CREATE POLICY "Sellers can update their own products"
    ON products FOR UPDATE
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

-- Sellers can delete their own products, admins can delete any
DROP POLICY IF EXISTS "Sellers and admins can delete products" ON products CASCADE;
CREATE POLICY "Sellers and admins can delete products"
    ON products FOR DELETE
    USING (
        auth.uid() = seller_id OR (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- 6.4 SERVICES POLICIES
-- ============================================================
-- Anyone can view active services
DROP POLICY IF EXISTS "Anyone can view active services" ON services CASCADE;
CREATE POLICY "Anyone can view active services"
    ON services FOR SELECT
    USING (status = 'active' OR auth.uid() = seller_id OR (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    ));

-- Sellers can create services
DROP POLICY IF EXISTS "Sellers can create services" ON services CASCADE;
CREATE POLICY "Sellers can create services"
    ON services FOR INSERT
    WITH CHECK (
        auth.uid() = seller_id AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND (role = 'seller' OR role = 'admin')
            )
        )
    );

-- Sellers can update their own services
DROP POLICY IF EXISTS "Sellers can update their own services" ON services CASCADE;
CREATE POLICY "Sellers can update their own services"
    ON services FOR UPDATE
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

-- Sellers and admins can delete services
DROP POLICY IF EXISTS "Sellers and admins can delete services" ON services CASCADE;
CREATE POLICY "Sellers and admins can delete services"
    ON services FOR DELETE
    USING (
        auth.uid() = seller_id OR (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- 6.5 ORDERS POLICIES
-- ============================================================
-- Buyers can view their own orders, sellers can view orders for their items
DROP POLICY IF EXISTS "Buyers and sellers can view relevant orders" ON orders CASCADE;
CREATE POLICY "Buyers and sellers can view relevant orders"
    ON orders FOR SELECT
    USING (
        auth.uid() = buyer_id OR
        auth.uid() = seller_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Buyers can create orders
DROP POLICY IF EXISTS "Buyers can create orders" ON orders CASCADE;
CREATE POLICY "Buyers can create orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Buyers and sellers can update orders (limited fields)
DROP POLICY IF EXISTS "Buyers and sellers can update orders" ON orders CASCADE;
CREATE POLICY "Buyers and sellers can update orders"
    ON orders FOR UPDATE
    USING (
        auth.uid() = buyer_id OR
        auth.uid() = seller_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete orders
DROP POLICY IF EXISTS "Only admins can delete orders" ON orders CASCADE;
CREATE POLICY "Only admins can delete orders"
    ON orders FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6.6 REVIEWS POLICIES
-- ============================================================
-- Anyone can view approved reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews CASCADE;
CREATE POLICY "Anyone can view approved reviews"
    ON reviews FOR SELECT
    USING (
        status = 'approved' OR
        auth.uid() = reviewer_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Authenticated users can create reviews
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews CASCADE;
CREATE POLICY "Authenticated users can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- Users can update their own reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews CASCADE;
CREATE POLICY "Users can update their own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = reviewer_id)
    WITH CHECK (auth.uid() = reviewer_id);

-- Users can delete their own reviews, admins can delete any
DROP POLICY IF EXISTS "Users and admins can delete reviews" ON reviews CASCADE;
CREATE POLICY "Users and admins can delete reviews"
    ON reviews FOR DELETE
    USING (
        auth.uid() = reviewer_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6.7 REPORTS POLICIES
-- ============================================================
-- Users can view their own reports, admins can view all
DROP POLICY IF EXISTS "Users can view own reports, admins view all" ON reports CASCADE;
CREATE POLICY "Users can view own reports, admins view all"
    ON reports FOR SELECT
    USING (
        auth.uid() = reporter_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Authenticated users can create reports
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports CASCADE;
CREATE POLICY "Authenticated users can create reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Only admins can update reports (resolve them)
DROP POLICY IF EXISTS "Only admins can update reports" ON reports CASCADE;
CREATE POLICY "Only admins can update reports"
    ON reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete reports
DROP POLICY IF EXISTS "Only admins can delete reports" ON reports CASCADE;
CREATE POLICY "Only admins can delete reports"
    ON reports FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6.8 SAVED ITEMS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own saved items" ON saved_items CASCADE;
CREATE POLICY "Users can view their own saved items"
    ON saved_items FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save items" ON saved_items CASCADE;
CREATE POLICY "Users can save items"
    ON saved_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved items" ON saved_items CASCADE;
CREATE POLICY "Users can delete their own saved items"
    ON saved_items FOR DELETE
    USING (auth.uid() = user_id);

-- 6.9 CONVERSATIONS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations CASCADE;
CREATE POLICY "Participants can view conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Participants can create conversations" ON conversations CASCADE;
CREATE POLICY "Participants can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Participants can update conversations" ON conversations CASCADE;
CREATE POLICY "Participants can update conversations"
    ON conversations FOR UPDATE
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 6.10 MESSAGES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Conversation participants can view messages" ON messages CASCADE;
CREATE POLICY "Conversation participants can view messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Conversation participants can send messages" ON messages CASCADE;
CREATE POLICY "Conversation participants can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
        )
    );

-- 6.11 NOTIFICATIONS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications CASCADE;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications CASCADE;
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications (mark as read)" ON notifications CASCADE;
CREATE POLICY "Users can update their own notifications (mark as read)"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6.12 TRANSACTIONS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Order participants can view transactions" ON transactions CASCADE;
CREATE POLICY "Order participants can view transactions"
    ON transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = transactions.order_id
            AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
        ) OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only system can insert transactions (via server-side)
DROP POLICY IF EXISTS "Only authenticated system can insert transactions" ON transactions CASCADE;
CREATE POLICY "Only authenticated system can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6.13 PROMOTIONS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions CASCADE;
CREATE POLICY "Anyone can view active promotions"
    ON promotions FOR SELECT
    USING (is_active = true OR auth.uid() = seller_id OR (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    ));

DROP POLICY IF EXISTS "Sellers can create promotions" ON promotions CASCADE;
CREATE POLICY "Sellers can create promotions"
    ON promotions FOR INSERT
    WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers and admins can update promotions" ON promotions CASCADE;
CREATE POLICY "Sellers and admins can update promotions"
    ON promotions FOR UPDATE
    USING (
        auth.uid() = seller_id OR (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );


-- 7. STORAGE BUCKETS & POLICIES
-- ============================================================

-- Note: Storage buckets must be created via the Supabase dashboard or API
-- Buckets needed: 'avatars', 'products', 'services', 'reviews', 'banners', 'logos', 'digital-files'

-- Storage bucket policies are defined per bucket and would be:
-- INSERT: authenticated users can upload to their own folder
-- SELECT: anyone can view files
-- UPDATE: owners can update their files
-- DELETE: owners or admins can delete

-- Create bucket function (run via Supabase dashboard or migration)
-- SELECT storage.create_bucket('avatars', { public: true });
-- SELECT storage.create_bucket('products', { public: true });
-- SELECT storage.create_bucket('services', { public: true });
-- SELECT storage.create_bucket('reviews', { public: true });
-- SELECT storage.create_bucket('banners', { public: true });
-- SELECT storage.create_bucket('logos', { public: true });
-- SELECT storage.create_bucket('digital-files', { public: false });


-- 8. SEED DATA (optional)
-- ============================================================

-- Example: Insert departments and communes for Benin
-- This can be used as reference data
CREATE TABLE IF NOT EXISTS benin_communes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL
);

-- All 77 communes of Benin
INSERT INTO benin_communes (id, name, department, latitude, longitude) VALUES
-- Alibori
(1, 'Banikoara', 'Alibori', 11.3000, 2.4333),
(2, 'Gogounou', 'Alibori', 10.8333, 2.8167),
(3, 'Kandi', 'Alibori', 11.1333, 2.9333),
(4, 'Karimama', 'Alibori', 12.0667, 3.1833),
(5, 'Malanville', 'Alibori', 11.8667, 3.3833),
(6, 'Segbana', 'Alibori', 10.9333, 3.7000),
-- Atacora
(7, 'Boukoumbé', 'Atacora', 10.1833, 1.1000),
(8, 'Cobly', 'Atacora', 10.2500, 1.0667),
(9, 'Kérou', 'Atacora', 10.8167, 1.3000),
(10, 'Kouandé', 'Atacora', 10.3333, 1.6833),
(11, 'Matéri', 'Atacora', 10.7000, 1.0667),
(12, 'Natitingou', 'Atacora', 10.3000, 1.3833),
(13, 'Pehonko', 'Atacora', 10.1500, 1.1500),
(14, 'Tanguiéta', 'Atacora', 10.6167, 1.2667),
(15, 'Toucountouna', 'Atacora', 10.5000, 1.3833),
-- Atlantique
(16, 'Abomey-Calavi', 'Atlantique', 6.4500, 2.3500),
(17, 'Allada', 'Atlantique', 6.6500, 2.1500),
(18, 'Kpomassè', 'Atlantique', 6.4000, 1.8833),
(19, 'Ouidah', 'Atlantique', 6.3667, 2.0833),
(20, 'Sô-Ava', 'Atlantique', 6.4833, 2.4167),
(21, 'Toffo', 'Atlantique', 6.8500, 2.0833),
(22, 'Tori-Bossito', 'Atlantique', 6.5333, 2.2000),
(23, 'Zè', 'Atlantique', 6.6833, 2.3500),
-- Borgou
(24, 'Bembéréké', 'Borgou', 10.2333, 2.6667),
(25, 'Kalalé', 'Borgou', 10.3000, 3.3833),
(26, 'N''Dali', 'Borgou', 10.4833, 2.7500),
(27, 'Nikki', 'Borgou', 9.9333, 3.2167),
(28, 'Parakou', 'Borgou', 9.3333, 2.6167),
(29, 'Pèrèrè', 'Borgou', 9.8167, 2.9833),
(30, 'Sinendé', 'Borgou', 10.3500, 2.3833),
(31, 'Tchaourou', 'Borgou', 8.8833, 2.6000),
-- Collines
(32, 'Bantè', 'Collines', 8.4167, 1.8833),
(33, 'Dassa-Zoumé', 'Collines', 7.7500, 2.1833),
(34, 'Glazoué', 'Collines', 7.9667, 2.2333),
(35, 'Ouèssè', 'Collines', 8.4833, 2.4333),
(36, 'Savalou', 'Collines', 7.9333, 1.9667),
(37, 'Savé', 'Collines', 8.0333, 2.4833),
-- Couffo
(38, 'Aplahoué', 'Couffo', 6.9333, 1.6833),
(39, 'Djakotomey', 'Couffo', 6.9000, 1.7000),
(40, 'Klouékanmè', 'Couffo', 6.9833, 1.7500),
(41, 'Lalo', 'Couffo', 6.9167, 1.8833),
(42, 'Toviklin', 'Couffo', 6.8500, 1.8000),
-- Donga
(43, 'Bassila', 'Donga', 9.0167, 1.6667),
(44, 'Copargo', 'Donga', 9.8333, 1.5500),
(45, 'Djougou', 'Donga', 9.7000, 1.6667),
(46, 'Ouaké', 'Donga', 9.6667, 1.4000),
-- Littoral
(47, 'Cotonou', 'Littoral', 6.3667, 2.4333),
-- Mono
(48, 'Athiémè', 'Mono', 6.5833, 1.6667),
(49, 'Bopa', 'Mono', 6.6000, 1.9833),
(50, 'Comè', 'Mono', 6.4000, 1.8833),
(51, 'Grand-Popo', 'Mono', 6.2833, 1.8333),
(52, 'Houéyogbé', 'Mono', 6.5500, 1.8667),
(53, 'Lokossa', 'Mono', 6.6333, 1.7167),
-- Ouémé
(54, 'Adjarra', 'Ouémé', 6.5167, 2.6667),
(55, 'Adjohoun', 'Ouémé', 6.7000, 2.4833),
(56, 'Aguégués', 'Ouémé', 6.4833, 2.5333),
(57, 'Akpro-Missérété', 'Ouémé', 6.5500, 2.5833),
(58, 'Avrankou', 'Ouémé', 6.5667, 2.6500),
(59, 'Bonou', 'Ouémé', 6.9167, 2.4500),
(60, 'Dangbo', 'Ouémé', 6.5000, 2.5500),
(61, 'Porto-Novo', 'Ouémé', 6.4833, 2.6167),
(62, 'Sèmè-Kpodji', 'Ouémé', 6.3667, 2.6000),
-- Plateau
(63, 'Adja-Ouèrè', 'Plateau', 6.6500, 2.6667),
(64, 'Ifangni', 'Plateau', 6.6833, 2.7333),
(65, 'Kétou', 'Plateau', 7.3667, 2.6000),
(66, 'Pobè', 'Plateau', 6.9833, 2.6667),
(67, 'Sakété', 'Plateau', 6.7333, 2.6500),
-- Zou
(68, 'Abomey', 'Zou', 7.1833, 1.9833),
(69, 'Agbangnizoun', 'Zou', 7.1000, 1.9667),
(70, 'Bohicon', 'Zou', 7.1833, 2.0667),
(71, 'Covè', 'Zou', 7.2167, 2.3000),
(72, 'Djidja', 'Zou', 7.3500, 1.9333),
(73, 'Ouinhi', 'Zou', 7.0833, 2.4833),
(74, 'Za-Kpota', 'Zou', 7.2333, 2.2167),
(75, 'Zagnanado', 'Zou', 7.2667, 2.4333),
(76, 'Zogbodomey', 'Zou', 7.1000, 2.1000)
ON CONFLICT (id) DO NOTHING;

-- Seed departments reference table
CREATE TABLE IF NOT EXISTS benin_departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    capital TEXT NOT NULL,
    region TEXT NOT NULL
);

INSERT INTO benin_departments (name, capital, region) VALUES
    ('Alibori', 'Kandi', 'North'),
    ('Atacora', 'Natitingou', 'North'),
    ('Atlantique', 'Allada', 'South'),
    ('Borgou', 'Parakou', 'North'),
    ('Collines', 'Dassa-Zoumé', 'Center'),
    ('Couffo', 'Aplahoué', 'South'),
    ('Donga', 'Djougou', 'North'),
    ('Littoral', 'Cotonou', 'South'),
    ('Mono', 'Lokossa', 'South'),
    ('Ouémé', 'Porto-Novo', 'South'),
    ('Plateau', 'Sakété', 'South'),
    ('Zou', 'Abomey', 'Center')
ON CONFLICT (name) DO NOTHING;

-- Reset the sequence for commune IDs
SELECT setval('benin_communes_id_seq', (SELECT MAX(id) FROM benin_communes));


-- 9. COMMENTS & DOCUMENTATION
-- ============================================================

COMMENT ON TABLE profiles IS 'User profiles extending auth.users with marketplace-specific fields';
COMMENT ON TABLE products IS 'Product listings created by sellers';
COMMENT ON TABLE services IS 'Service listings created by sellers';
COMMENT ON TABLE orders IS 'Orders placed by buyers for products or services';
COMMENT ON TABLE reviews IS 'Reviews and ratings for products and services';
COMMENT ON TABLE reports IS 'User reports for inappropriate content or behavior';
COMMENT ON TABLE saved_items IS 'User wishlist/bookmarks for products and services';
COMMENT ON TABLE conversations IS 'Messaging threads between buyers and sellers';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE transactions IS 'Financial transaction records';
COMMENT ON TABLE promotions IS 'Paid promotion/advertising entries';

COMMENT ON COLUMN products.slug IS 'URL-friendly version of the product title';
COMMENT ON COLUMN products.compare_at_price IS 'Original/comparison price for showing discounts';
COMMENT ON COLUMN products.is_digital IS 'Whether this is a digital downloadable product';
COMMENT ON COLUMN products.delivery_radius_km IS 'Maximum delivery distance from seller location';
COMMENT ON COLUMN services.pricing_type IS 'fixed, hourly, or custom_quote';
COMMENT ON COLUMN services.is_remote_available IS 'Whether service can be provided remotely';
COMMENT ON COLUMN orders.order_number IS 'Human-readable unique order identifier (BK-YYYYMMDD-XXXXXX)';
COMMENT ON COLUMN orders.service_fee IS 'Platform service fee';
COMMENT ON COLUMN promotions.type IS 'featured, boosted, banner, or homepage';
