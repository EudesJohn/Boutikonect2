-- =============================================================================
-- BoutiKonect ML Assistant — Knowledge Base with pgvector
-- =============================================================================
-- Ce fichier crée la base de connaissances vectorielle pour l'assistant ML.
-- Il permet la recherche sémantique par similarité de vecteurs.
--
-- Prérequis : Activer l'extension pgvector dans Supabase
--   go_to: Database > Extensions > enable "vector"
--
-- Ou via SQL :
--   CREATE EXTENSION IF NOT EXISTS vector;
-- =============================================================================

-- 1. Activer l'extension vector (commenté car déjà fait manuellement)
-- CREATE EXTENSION IF NOT EXISTS vector;
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE : knowledge_base
-- Stocke les entrées de la base de connaissances avec leurs embeddings.
-- =============================================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id TEXT UNIQUE NOT NULL,                    -- Correspond à l'ID dans knowledge.js
    topic TEXT NOT NULL,                              -- Catégorie principale
    subtopic TEXT,                                    -- Sous-catégorie
    content TEXT NOT NULL,                            -- Le texte de la réponse
    keywords TEXT[] DEFAULT '{}',                     -- Mots-clés associés
    context_tags TEXT[] DEFAULT '{}',                 -- Tags de contexte
    priority INTEGER DEFAULT 5,                       -- Priorité (1-10)
    source_type TEXT DEFAULT 'faq' CHECK (source_type IN (
        'faq', 'product', 'service', 'code_doc', 'feature', 'guide'
    )),
    embedding VECTOR(384),                            -- Embedding dimension (all-MiniLM-L6-v2 = 384)
    metadata JSONB DEFAULT '{}',                      -- Métadonnées supplémentaires
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la recherche vectorielle (distance cosinus)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding
    ON knowledge_base
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Index pour les requêtes par topic
CREATE INDEX IF NOT EXISTS idx_knowledge_base_topic
    ON knowledge_base (topic);

-- Index pour la recherche plein texte (fallback)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_search
    ON knowledge_base
    USING GIN (to_tsvector('french', content || ' ' || array_to_string(keywords, ' ')));

-- =============================================================================
-- TABLE : conversation_log
-- Stocke les conversations pour améliorer l'assistant.
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,                          -- ID de session unique
    user_message TEXT NOT NULL,                        -- Message utilisateur
    bot_response TEXT NOT NULL,                        -- Réponse de l'assistant
    intent TEXT,                                       -- Intention détectée
    confidence NUMERIC(4,3),                          -- Score de confiance
    sentiment TEXT,                                   -- Sentiment détecté
    entities JSONB DEFAULT '{}',                       -- Entités extraites
    response_time_ms INTEGER,                         -- Temps de réponse (ms)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour l'analyse des conversations
CREATE INDEX IF NOT EXISTS idx_conversation_log_session
    ON conversation_log (session_id, created_at DESC);

-- Index pour l'analyse des intentions
CREATE INDEX IF NOT EXISTS idx_conversation_log_intent
    ON conversation_log (intent);

-- =============================================================================
-- RLS (Row Level Security)
-- =============================================================================
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_log ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire la base de connaissances
DROP POLICY IF EXISTS "Anyone can read knowledge base" ON knowledge_base;
CREATE POLICY "Anyone can read knowledge base"
    ON knowledge_base FOR SELECT
    USING (true);

-- Seuls les admins peuvent modifier la base de connaissances
DROP POLICY IF EXISTS "Admins can insert knowledge" ON knowledge_base;
CREATE POLICY "Admins can insert knowledge"
    ON knowledge_base FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can update knowledge" ON knowledge_base;
CREATE POLICY "Admins can update knowledge"
    ON knowledge_base FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can delete knowledge" ON knowledge_base;
CREATE POLICY "Admins can delete knowledge"
    ON knowledge_base FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Conversations : les utilisateurs voient leurs propres logs
DROP POLICY IF EXISTS "Users can view own conversations" ON conversation_log;
CREATE POLICY "Users can view own conversations"
    ON conversation_log FOR SELECT
    USING (auth.uid()::text = session_id OR auth.role() = 'admin');

DROP POLICY IF EXISTS "Anyone can insert conversation" ON conversation_log;
CREATE POLICY "Anyone can insert conversation"
    ON conversation_log FOR INSERT
    WITH CHECK (true);

-- =============================================================================
-- FONCTION : search_knowledge_base
-- Recherche sémantique dans la base de connaissances
-- =============================================================================
CREATE OR REPLACE FUNCTION search_knowledge_base(
    p_embedding VECTOR(384),
    p_match_threshold FLOAT DEFAULT 0.6,
    p_match_count INT DEFAULT 5,
    p_topic TEXT DEFAULT NULL,
    p_source_type TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    entry_id TEXT,
    topic TEXT,
    subtopic TEXT,
    content TEXT,
    keywords TEXT[],
    context_tags TEXT[],
    priority INTEGER,
    source_type TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.entry_id,
        kb.topic,
        kb.subtopic,
        kb.content,
        kb.keywords,
        kb.context_tags,
        kb.priority,
        kb.source_type,
        1 - (kb.embedding <=> p_embedding) AS similarity
    FROM knowledge_base kb
    WHERE
        kb.embedding IS NOT NULL
        AND 1 - (kb.embedding <=> p_embedding) > p_match_threshold
        AND (p_topic IS NULL OR kb.topic = p_topic)
        AND (p_source_type IS NULL OR kb.source_type = p_source_type)
    ORDER BY kb.embedding <=> p_embedding
    LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- FONCTION : log_conversation
-- Enregistre une conversation pour analyse
-- =============================================================================
CREATE OR REPLACE FUNCTION log_conversation(
    p_session_id TEXT,
    p_user_message TEXT,
    p_bot_response TEXT,
    p_intent TEXT DEFAULT NULL,
    p_confidence NUMERIC DEFAULT NULL,
    p_sentiment TEXT DEFAULT NULL,
    p_entities JSONB DEFAULT '{}',
    p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO conversation_log (
        session_id, user_message, bot_response,
        intent, confidence, sentiment, entities,
        response_time_ms
    ) VALUES (
        p_session_id, p_user_message, p_bot_response,
        p_intent, p_confidence, p_sentiment, p_entities,
        p_response_time_ms
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FONCTION : get_knowledge_stats
-- Statistiques sur la base de connaissances
-- =============================================================================
CREATE OR REPLACE FUNCTION get_knowledge_stats()
RETURNS TABLE(
    total_entries BIGINT,
    topics_count BIGINT,
    source_types TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT,
        COUNT(DISTINCT topic)::BIGINT,
        ARRAY_AGG(DISTINCT source_type)
    FROM knowledge_base;
END;
$$ LANGUAGE plpgsql STABLE;
