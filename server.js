const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuração do Banco de Dados
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
});

// Teste de conexão
db.query('SELECT NOW()', (err) => {
    if (err) console.error('❌ Erro de conexão:', err.message);
    else console.log('🚀 Conectado ao PostgreSQL no Supabase');
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'seriesbox-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Configuração de Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './public/uploads';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const requireAuth = (req, res, next) => {
    if (req.session.userId) next();
    else res.status(401).json({ error: 'Não autorizado' });
};

// ============= ROTAS DE AUTENTICAÇÃO =============

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
            return res.json({ success: true, userId: user.id, username: user.username, avatar: user.avatar });
        }
        res.status(400).json({ error: 'Credenciais inválidas' });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.get('/api/check-session', async (req, res) => {
    if (!req.session.userId) return res.json({ authenticated: false });
    try {
        const result = await db.query('SELECT id, username, email, bio, avatar FROM users WHERE id = $1', [req.session.userId]);
        res.json({ authenticated: true, user: result.rows[0] });
    } catch (err) {
        res.json({ authenticated: false });
    }
});

// ============= ROTAS DE SÉRIES E AVALIAÇÕES =============

// NOVA ROTA: Buscar avaliação específica (Necessária para o series.js não quebrar)
app.get('/api/rating/:seriesId', requireAuth, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM ratings WHERE user_id = $1 AND series_id = $2',
            [req.session.userId, req.params.seriesId]
        );
        res.json({ rating: result.rows[0] || null });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar avaliação' });
    }
});

app.get('/api/series/:id/ratings', async (req, res) => {
    const seriesId = req.params.id;
    try {
        // Busca as reviews e calcula a média separadamente para evitar erros de tipos no Postgres
        const reviews = await db.query(`
            SELECT r.*, u.username, u.avatar 
            FROM ratings r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.series_id = $1 ORDER BY r.created_at DESC`, [seriesId]);

        const stats = await db.query(`
            SELECT AVG(rating)::FLOAT as average, COUNT(*)::INT as count 
            FROM ratings WHERE series_id = $1`, [seriesId]);

        res.json({
            average: stats.rows[0].average ? stats.rows[0].average.toFixed(1) : "0.0",
            count: stats.rows[0].count || 0,
            reviews: reviews.rows
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar avaliações' });
    }
});

app.post('/api/rating', requireAuth, async (req, res) => {
    const { seriesId, rating, review, status } = req.body;
    try {
        await db.query(`
            INSERT INTO ratings (user_id, series_id, rating, review, status)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, series_id) 
            DO UPDATE SET rating = EXCLUDED.rating, review = EXCLUDED.review, status = EXCLUDED.status`,
            [req.session.userId, seriesId, rating, review, status]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao salvar avaliação' });
    }
});

// ============= ATIVIDADES E PERFIL =============

app.get('/api/recent-activity', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.*, u.username, u.avatar 
            FROM ratings r 
            JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC LIMIT 15`);
        res.json({ activities: result.rows });
    } catch (err) {
        res.json({ activities: [] });
    }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await db.query('SELECT id, username, bio, avatar, created_at FROM users WHERE id = $1', [req.params.id]);
        const stats = await db.query(`
            SELECT COUNT(*)::INT as total_ratings, AVG(rating)::FLOAT as avg_rating 
            FROM ratings WHERE user_id = $1`, [req.params.id]);
        
        if (!user.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ user: user.rows[0], stats: stats.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Erro no perfil' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));