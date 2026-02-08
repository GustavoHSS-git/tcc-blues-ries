const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2; 

const app = express();
const PORT = process.env.PORT || 10000;

/* ================= CONFIGURAÇÕES EXTERNAS ================= */

cloudinary.config({ 
    cloud_name: 'ddwwhhika',
    api_key: '956751932938519',
    api_secret: 'EMAZtnyNZzIKBR5sA8rZasxcXZk'
});

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
});

// Teste de conexão com o banco
db.query('SELECT NOW()', (err) => {
    if (err) console.error('❌ Erro de conexão com Banco:', err.message);
    else console.log('🚀 Conectado ao PostgreSQL no Supabase');
});

/* ================= MIDDLEWARES ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'seriesbox-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        secure: false 
    }
}));

/* ================= CONFIGURAÇÃO DE UPLOAD ================= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

const requireAuth = (req, res, next) => {
    if (req.session.userId) next();
    else res.status(401).json({ error: 'Não autorizado' });
};

/* ================= ROTAS DE AUTENTICAÇÃO ================= */

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );
        req.session.userId = result.rows[0].id;
        req.session.username = username;
        res.json({ success: true, userId: req.session.userId, username });
    } catch (error) {
        res.status(400).json({ error: 'Usuário ou email já existe' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            return res.json({ 
                success: true, 
                userId: user.id, 
                username: user.username, 
                avatar: user.avatar 
            });
        }
        res.status(400).json({ error: 'Credenciais inválidas' });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.get('/api/check-session', async (req, res) => {
    if (!req.session.userId) return res.json({ authenticated: false });
    try {
        const result = await db.query(
            'SELECT id, username, email, bio, avatar FROM users WHERE id = $1', 
            [req.session.userId]
        );
        res.json({ authenticated: true, user: result.rows[0] });
    } catch (err) {
        res.json({ authenticated: false });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

/* ================= ROTAS DE PERFIL ================= */

app.get('/api/user/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const userRes = await db.query(
            'SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = $1', 
            [userId]
        );
        const user = userRes.rows[0];
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        const statsRes = await db.query(`
            SELECT 
                COUNT(*)::INT as total_ratings, 
                COALESCE(AVG(rating), 0)::FLOAT as avg_rating,
                COUNT(CASE WHEN status = 'completed' THEN 1 END)::INT as completed_series
            FROM ratings WHERE user_id = $1`, [userId]);
        
        res.json({ user, stats: statsRes.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
});

app.put('/api/user/update', requireAuth, async (req, res) => {
    const { bio } = req.body;
    try {
        await db.query('UPDATE users SET bio = $1 WHERE id = $2', [bio, req.session.userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar bio' });
    }
});

app.post('/api/user/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'seriesbox_avatars',
            transformation: [{ width: 250, height: 250, crop: 'fill' }]
        });

        const imageUrl = result.secure_url;
        await db.query('UPDATE users SET avatar = $1 WHERE id = $2', [imageUrl, req.session.userId]);

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.json({ success: true, avatar: imageUrl });
    } catch (error) {
        console.error("Erro no Cloudinary:", error);
        res.status(500).json({ error: 'Erro ao subir imagem' });
    }
});

/* ================= ROTAS DE SÉRIES E AVALIAÇÕES ================= */

// Atividade Recente (Home)
app.get('/api/recent-activity', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.*, u.username, u.avatar 
            FROM ratings r 
            JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC 
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro atividade recente:', err);
        res.json([]);
    }
});

// Avaliações de um usuário específico
app.get('/api/user/:userId/ratings', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.*, u.username, u.avatar 
            FROM ratings r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.user_id = $1 
            ORDER BY r.created_at DESC`, [req.params.userId]);
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

// Buscar avaliação específica (Check se o usuário já avaliou) - usa tmdb_id
app.get('/api/rating/:tmdb_id', requireAuth, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT r.* FROM ratings r JOIN series s ON r.series_id = s.id WHERE r.user_id = $1 AND s.tmdb_id = $2', 
            [req.session.userId, req.params.tmdb_id]
        );
        res.json({ rating: result.rows[0] || null });
    } catch (err) {
        console.error('Erro ao buscar avaliação:', err);
        res.status(500).json({ error: 'Erro ao buscar avaliação' });
    }
});

// Buscar todas as avaliações de uma série (Página de Detalhes) - usa tmdb_id
app.get('/api/series/:tmdb_id/ratings', async (req, res) => {
    const tmdb_id = req.params.tmdb_id;
    try {
        const reviews = await db.query(`
            SELECT r.*, u.username, u.avatar, s.title, s.poster, s.tmdb_id
            FROM ratings r 
            JOIN users u ON r.user_id = u.id 
            JOIN series s ON r.series_id = s.id 
            WHERE s.tmdb_id = $1 
            ORDER BY r.created_at DESC`, [tmdb_id]);
            
        const stats = await db.query(`
            SELECT AVG(rating)::FLOAT as average, COUNT(*)::INT as count 
            FROM ratings r 
            JOIN series s ON r.series_id = s.id 
            WHERE s.tmdb_id = $1`, [tmdb_id]);
        
        const avgRating = stats.rows[0] && stats.rows[0].average 
            ? stats.rows[0].average.toFixed(1) 
            : "0.0";
        const count = stats.rows[0] && stats.rows[0].count 
            ? stats.rows[0].count 
            : 0;
        
        res.json({
            average: avgRating,
            count: count,
            reviews: reviews.rows
        });
    } catch (err) {
        console.error('Erro ao buscar avaliações:', err);
        res.status(500).json({ error: 'Erro ao buscar avaliações' });
    }
});

// Salvar ou Atualizar avaliação
app.post('/api/rating', requireAuth, async (req, res) => {
    const { tmdb_id, rating, review, status, title, poster, backdrop, overview, genre, first_air_date, number_of_seasons } = req.body;
    
    try {
        // Converter first_air_date para formato DATE se existir
        const dateValue = first_air_date ? new Date(first_air_date).toISOString().split('T')[0] : null;
        
        // Esta rota usa a função SQL add_or_update_rating com o novo schema
        const result = await db.query(`
            SELECT * FROM add_or_update_rating(
                $1, $2, $3, $4, $5, $6, $7, $8::DATE, $9::INT, $10::NUMERIC, $11, $12
            )`, 
        [
            req.session.userId,           // p_user_id
            +tmdb_id,                     // p_tmdb_id
            title,                        // p_title
            poster,                       // p_poster
            backdrop,                     // p_backdrop
            overview,                     // p_overview
            genre || null,                // p_genre
            dateValue,                    // p_first_air_date (convertido para DATE)
            number_of_seasons || null,    // p_number_of_seasons
            +rating,                      // p_rating (convertido para NUMERIC)
            review || null,               // p_review
            status                        // p_status
        ]);
        
        if (result.rows && result.rows.length > 0) {
            res.json({ success: true, rating_id: result.rows[0].rating_id });
        } else {
            res.status(500).json({ error: 'Erro ao salvar avaliação' });
        }
    } catch (err) {
        console.error('Erro ao salvar rating:', err);
        res.status(500).json({ error: 'Erro ao salvar avaliação: ' + err.message });
    }
});

// Rotas de Estatísticas
app.get('/api/series/:tmdb_id/stats', async (req, res) => {
    try {
        // Primeiro, busca a série pelo tmdb_id
        const seriesResult = await db.query('SELECT id FROM series WHERE tmdb_id = $1', [req.params.tmdb_id]);
        
        if (!seriesResult.rows[0]) {
            return res.json({ total_ratings: 0, average_rating: 0, rating_distribution: {} });
        }
        
        const series_id = seriesResult.rows[0].id;
        const result = await db.query('SELECT * FROM get_series_stats($1)', [series_id]);
        
        if (result.rows[0]) {
            res.json(result.rows[0]);
        } else {
            res.json({ total_ratings: 0, average_rating: 0, rating_distribution: {} });
        }
    } catch (err) {
        console.error('Erro ao buscar stats da série:', err);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

app.get('/api/user/:user_id/stats', requireAuth, async (req, res) => {
    // Apenas o usuário pode ver suas próprias stats
    if (parseInt(req.params.user_id) !== req.session.userId) {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    
    try {
        const result = await db.query('SELECT * FROM get_user_stats($1)', [req.params.user_id]);
        if (result.rows[0]) {
            res.json(result.rows[0]);
        } else {
            res.json({ total_rated: 0, average_rating: 0, watching: 0, completed: 0, plan_to_watch: 0, dropped: 0 });
        }
    } catch (err) {
        console.error('Erro ao buscar stats do usuário:', err);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

/* ================= TRATAMENTO DE ROTAS FRONTEND ================= */

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));