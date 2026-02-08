-- ============================================================
-- SCHEMA DO BANCO DE DADOS - BLUE SERIES
-- ============================================================

-- DROP DAS TABELAS ANTIGAS (se existirem)
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS watchlist CASCADE;
DROP TABLE IF EXISTS series CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- TABELA: USERS
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar VARCHAR(500) DEFAULT 'default-avatar.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================
-- TABELA: SERIES
-- ============================================================
CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    poster VARCHAR(500),
    backdrop VARCHAR(500),
    overview TEXT,
    genre VARCHAR(100),
    rating DECIMAL(3,1),
    first_air_date DATE,
    number_of_seasons INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_series_tmdb_id ON series(tmdb_id);
CREATE INDEX idx_series_title ON series(title);
CREATE INDEX idx_series_created_at ON series(created_at DESC);

-- ============================================================
-- TABELA: RATINGS (Avaliações dos Usuários)
-- ============================================================
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    review TEXT,
    status VARCHAR(50) DEFAULT 'watching',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_series UNIQUE(user_id, series_id)
);

CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_series_id ON ratings(series_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);
CREATE INDEX idx_ratings_status ON ratings(status);

-- ============================================================
-- FUNÇÃO: ADD_OR_UPDATE_RATING
-- ============================================================
CREATE OR REPLACE FUNCTION add_or_update_rating(
    p_user_id INT,
    p_tmdb_id INT,
    p_title TEXT,
    p_poster TEXT,
    p_backdrop TEXT,
    p_overview TEXT,
    p_genre TEXT,
    p_first_air_date DATE,
    p_number_of_seasons INT,
    p_rating NUMERIC,
    p_review TEXT,
    p_status TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT, rating_id INT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_series_id INT;
    v_rating_id INT;
BEGIN
    -- 1️⃣ Verifica se a série já existe no banco
    SELECT id INTO v_series_id
    FROM series
    WHERE tmdb_id = p_tmdb_id;

    -- 2️⃣ Se não existir, cria
    IF v_series_id IS NULL THEN
        INSERT INTO series (
            tmdb_id, title, poster, backdrop, overview, genre, first_air_date, number_of_seasons
        )
        VALUES (
            p_tmdb_id, p_title, p_poster, p_backdrop, p_overview, p_genre, p_first_air_date, p_number_of_seasons
        )
        RETURNING id INTO v_series_id;
    END IF;

    -- 3️⃣ Insere ou atualiza o rating
    INSERT INTO ratings (
        user_id, series_id, rating, review, status
    )
    VALUES (
        p_user_id, v_series_id, p_rating, p_review, p_status
    )
    ON CONFLICT (user_id, series_id)
    DO UPDATE SET
        rating = EXCLUDED.rating,
        review = EXCLUDED.review,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_rating_id;

    RETURN QUERY SELECT TRUE, 'Avaliação salva com sucesso', v_rating_id;
END;
$$;

-- ============================================================
-- FUNCTION: GET_SERIES_STATS
-- ============================================================
CREATE OR REPLACE FUNCTION get_series_stats(p_series_id INT)
RETURNS TABLE(
    total_ratings INT,
    average_rating NUMERIC,
    rating_distribution TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INT as total_ratings,
        ROUND(AVG(rating)::NUMERIC, 1) as average_rating,
        (SELECT json_object_agg(rating, count) FROM (
            SELECT rating, COUNT(*) as count
            FROM ratings
            WHERE series_id = p_series_id
            GROUP BY rating
            ORDER BY rating DESC
        ) t)::TEXT as rating_distribution
    FROM ratings
    WHERE series_id = p_series_id;
END;
$$;

-- ============================================================
-- FUNCTION: GET_USER_STATS
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id INT)
RETURNS TABLE(
    total_rated INT,
    average_rating NUMERIC,
    watching INT,
    completed INT,
    plan_to_watch INT,
    dropped INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INT as total_rated,
        ROUND(AVG(rating)::NUMERIC, 1) as average_rating,
        (SELECT COUNT(*) FROM ratings WHERE user_id = p_user_id AND status = 'watching')::INT,
        (SELECT COUNT(*) FROM ratings WHERE user_id = p_user_id AND status = 'completed')::INT,
        (SELECT COUNT(*) FROM ratings WHERE user_id = p_user_id AND status = 'plan_to_watch')::INT,
        (SELECT COUNT(*) FROM ratings WHERE user_id = p_user_id AND status = 'dropped')::INT
    FROM ratings
    WHERE user_id = p_user_id;
END;
$$;

-- ============================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_series_timestamp BEFORE UPDATE ON series
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_ratings_timestamp BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- DADOS DE TESTE (opcional)
-- ============================================================
-- INSERT INTO users (username, email, password) VALUES
-- ('user1', 'user1@example.com', 'hashed_password_here'),
-- ('user2', 'user2@example.com', 'hashed_password_here');

COMMIT;
