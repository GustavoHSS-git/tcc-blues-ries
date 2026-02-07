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

/* ================= CONFIGURAÇÕES ================= */

cloudinary.config({
    cloud_name: 'ddwwhhika',
    api_key: '956751932938519',
    api_secret: 'EMAZtnyNZzIKBR5sA8rZasxcXZk'
});

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

db.query('SELECT NOW()', err => {
    if (err) console.error('❌ Erro DB:', err.message);
    else console.log('✅ PostgreSQL conectado');
});

/* ================= MIDDLEWARES ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'seriesbox-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }
}));

/* ================= UPLOAD ================= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public/uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

const requireAuth = (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Não autorizado' });
    next();
};

/* ================= AUTH ================= */

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const r = await db.query(
            'INSERT INTO users (username,email,password) VALUES ($1,$2,$3) RETURNING id',
            [username, email, hash]
        );
        req.session.userId = r.rows[0].id;
        res.json({ success: true, userId: r.rows[0].id, username });
    } catch {
        res.status(400).json({ error: 'Usuário ou email já existe' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const r = await db.query('SELECT * FROM users WHERE email=$1', [email]);
        const user = r.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }
        req.session.userId = user.id;
        res.json({
            success: true,
            userId: user.id,
            username: user.username,
            avatar: user.avatar
        });
    } catch {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.get('/api/check-session', async (req, res) => {
    if (!req.session.userId) return res.json({ authenticated: false });
    const r = await db.query(
        'SELECT id,username,email,bio,avatar FROM users WHERE id=$1',
        [req.session.userId]
    );
    res.json({ authenticated: true, user: r.rows[0] });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

/* ================= PERFIL ================= */

app.get('/api/user/:id', async (req, res) => {
    const userId = req.params.id;
    const user = await db.query(
        'SELECT id,username,email,bio,avatar FROM users WHERE id=$1',
        [userId]
    );
    if (!user.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });

    const stats = await db.query(`
        SELECT 
            COUNT(*)::INT as total_ratings,
            COALESCE(AVG(rating),0)::FLOAT as avg_rating,
            COUNT(CASE WHEN status='completed' THEN 1 END)::INT as completed_series
        FROM ratings WHERE user_id=$1
    `, [userId]);

    res.json({ user: user.rows[0], stats: stats.rows[0] });
});

app.put('/api/user/update', requireAuth, async (req, res) => {
    await db.query(
        'UPDATE users SET bio=$1 WHERE id=$2',
        [req.body.bio, req.session.userId]
    );
    res.json({ success: true });
});

app.post('/api/user/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'seriesbox_avatars',
        transformation: [{ width: 250, height: 250, crop: 'fill' }]
    });

    await db.query(
        'UPDATE users SET avatar=$1 WHERE id=$2',
        [uploadResult.secure_url, req.session.userId]
    );

    fs.unlinkSync(req.file.path);
    res.json({ success: true, avatar: uploadResult.secure_url });
});

/* ================= RATINGS (TMDB_ID) ================= */

app.get('/api/rating/:tmdb_id', requireAuth, async (req, res) => {
    const r = await db.query(
        'SELECT * FROM ratings WHERE user_id=$1 AND tmdb_id=$2',
        [req.session.userId, req.params.tmdb_id]
    );
    res.json({ rating: r.rows[0] || null });
});

app.post('/api/rating', requireAuth, async (req, res) => {
    const { tmdb_id, rating, review, status } = req.body;
    try {
        await db.query(`
            INSERT INTO ratings (user_id, tmdb_id, rating, review, status)
            VALUES ($1,$2,$3,$4,$5)
            ON CONFLICT (user_id, tmdb_id)
            DO UPDATE SET
                rating=EXCLUDED.rating,
                review=EXCLUDED.review,
                status=EXCLUDED.status,
                created_at=CURRENT_TIMESTAMP
        `, [req.session.userId, +tmdb_id, +rating, review, status]);

        res.json({ success: true });
    } catch (err) {
        console.error('Erro rating:', err);
        res.status(500).json({ error: 'Erro ao salvar avaliação' });
    }
});

app.get('/api/user/:userId/ratings', async (req, res) => {
    const r = await db.query(
        'SELECT * FROM ratings WHERE user_id=$1 ORDER BY created_at DESC',
        [req.params.userId]
    );
    res.json(r.rows);
});

app.get('/api/series/:tmdb_id/ratings', async (req, res) => {
    const reviews = await db.query(`
        SELECT r.*, u.username, u.avatar
        FROM ratings r
        JOIN users u ON u.id=r.user_id
        WHERE r.tmdb_id=$1
        ORDER BY r.created_at DESC
    `, [req.params.tmdb_id]);

    const stats = await db.query(`
        SELECT AVG(rating)::FLOAT as average, COUNT(*)::INT as count
        FROM ratings WHERE tmdb_id=$1
    `, [req.params.tmdb_id]);

    res.json({
        average: stats.rows[0].average?.toFixed(1) || '0.0',
        count: stats.rows[0].count || 0,
        reviews: reviews.rows
    });
});

/* ================= ATIVIDADE ================= */

app.get('/api/recent-activity', async (req, res) => {
    const r = await db.query(`
        SELECT r.*, u.username, u.avatar
        FROM ratings r
        JOIN users u ON u.id=r.user_id
        ORDER BY r.created_at DESC
        LIMIT 10
    `);
    res.json(r.rows);
});

/* ================= FRONTEND ================= */

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
