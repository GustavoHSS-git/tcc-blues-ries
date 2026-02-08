const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
<<<<<<< HEAD
const cloudinary = require('cloudinary').v2; 
=======
const cloudinary = require('cloudinary').v2;
>>>>>>> 2797ee0922b782881b980ce503facf713d049237

const app = express();
const PORT = process.env.PORT || 10000;

<<<<<<< HEAD
// ============= CONFIGURAÇÕES EXTERNAS =============

// Configuração do Cloudinary - Campos separados para evitar erro de parse no SDK
cloudinary.config({ 
=======
/* ================= CONFIGURAÇÕES ================= */

cloudinary.config({
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
    cloud_name: 'ddwwhhika',
    api_key: '956751932938519',
    api_secret: 'EMAZtnyNZzIKBR5sA8rZasxcXZk'
});

<<<<<<< HEAD
// Configuração do Banco de Dados PostgreSQL (Supabase/Render)
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

// ============= MIDDLEWARES =============
=======
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

db.query('SELECT NOW()', err => {
    if (err) console.error('❌ Erro DB:', err.message);
    else console.log('✅ PostgreSQL conectado');
});

/* ================= MIDDLEWARES ================= */
>>>>>>> 2797ee0922b782881b980ce503facf713d049237

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
<<<<<<< HEAD
=======

>>>>>>> 2797ee0922b782881b980ce503facf713d049237
app.use(session({
    secret: 'seriesbox-secret-key-2024',
    resave: false,
    saveUninitialized: false,
<<<<<<< HEAD
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        secure: false // Defina como true se usar HTTPS em produção com proxy
    }
}));

// Configuração de Upload Temporário local (necessário para o Multer processar antes do Cloudinary)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
=======
    cookie: { maxAge: 86400000 }
}));

/* ================= UPLOAD ================= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public/uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
<<<<<<< HEAD
const upload = multer({ storage });

// Middleware de Proteção de Rota
const requireAuth = (req, res, next) => {
    if (req.session.userId) next();
    else res.status(401).json({ error: 'Não autorizado' });
};

// ============= ROTAS DE AUTENTICAÇÃO =============
=======

const upload = multer({ storage });

const requireAuth = (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Não autorizado' });
    next();
};

/* ================= AUTH ================= */
>>>>>>> 2797ee0922b782881b980ce503facf713d049237

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
<<<<<<< HEAD
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );
        req.session.userId = result.rows[0].id;
        req.session.username = username;
        res.json({ success: true, userId: req.session.userId, username });
    } catch (error) {
=======
        const hash = await bcrypt.hash(password, 10);
        const r = await db.query(
            'INSERT INTO users (username,email,password) VALUES ($1,$2,$3) RETURNING id',
            [username, email, hash]
        );
        req.session.userId = r.rows[0].id;
        res.json({ success: true, userId: r.rows[0].id, username });
    } catch {
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
        res.status(400).json({ error: 'Usuário ou email já existe' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
<<<<<<< HEAD
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            return res.json({ success: true, userId: user.id, username: user.username, avatar: user.avatar });
        }
        res.status(400).json({ error: 'Credenciais inválidas' });
    } catch (error) {
=======
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
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.get('/api/check-session', async (req, res) => {
    if (!req.session.userId) return res.json({ authenticated: false });
<<<<<<< HEAD
    try {
        const result = await db.query('SELECT id, username, email, bio, avatar FROM users WHERE id = $1', [req.session.userId]);
        res.json({ authenticated: true, user: result.rows[0] });
    } catch (err) {
        res.json({ authenticated: false });
    }
=======
    const r = await db.query(
        'SELECT id,username,email,bio,avatar FROM users WHERE id=$1',
        [req.session.userId]
    );
    res.json({ authenticated: true, user: r.rows[0] });
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

<<<<<<< HEAD
// ============= ROTAS DE PERFIL E UPLOAD =============

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

app.put('/api/user/update', requireAuth, async (req, res) => {
    const { bio } = req.body;
    try {
        await db.query('UPDATE users SET bio = $1 WHERE id = $2', [bio, req.session.userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar bio' });
    }
});

app.get('/api/user/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const userRes = await db.query('SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        const statsRes = await db.query(`
            SELECT COUNT(*)::INT as total_ratings, COALESCE(AVG(rating), 0)::FLOAT as avg_rating,
            COUNT(CASE WHEN status = 'completed' THEN 1 END)::INT as completed_series
            FROM ratings WHERE user_id = $1`, [userId]);
        
        res.json({ user, stats: statsRes.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
});

// ============= ROTAS DE SÉRIES E AVALIAÇÕES =============

// NOVA ROTA: Atividade Recente para a Home (Resolve o erro no series.js:411)
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
        res.json([]); // Retorna array vazio em vez de erro HTML
    }
});

// NOVA ROTA: Avaliações específicas de um usuário (Para a lista no perfil)
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
        console.error('Erro ao buscar ratings do usuário:', err);
        res.json([]);
    }
});

app.get('/api/rating/:seriesId', requireAuth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM ratings WHERE user_id = $1 AND series_id = $2', [req.session.userId, req.params.seriesId]);
        res.json({ rating: result.rows[0] || null });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar avaliação' });
    }
});

app.get('/api/series/:id/ratings', async (req, res) => {
    const seriesId = req.params.id;
    try {
        const reviews = await db.query(`
            SELECT r.*, u.username, u.avatar 
            FROM ratings r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.series_id = $1 
            ORDER BY r.created_at DESC`, [seriesId]);
            
        const stats = await db.query(`SELECT AVG(rating)::FLOAT as average, COUNT(*)::INT as count FROM ratings WHERE series_id = $1`, [seriesId]);
        
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
    // Agora recebemos todos os dados necessários para a função SQL
    const { seriesId, rating, review, status, title, poster, backdrop, overview, category } = req.body;
    
    try {
        // Chamamos a função add_or_update_rating que você criou!
        await db.query(`SELECT add_or_update_rating($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, 
        [
            req.session.userId, 
            +seriesId, // Este é o tmdb_id que vira p_tmdb_id
            title, 
            poster, 
            backdrop, 
            overview, 
            category, 
            +rating, 
            review, 
            status
        ]);
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao salvar rating:', err);
=======
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
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
        res.status(500).json({ error: 'Erro ao salvar avaliação' });
    }
});

<<<<<<< HEAD

// ============= TRATAMENTO DE ROTAS FRONTEND =============

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
=======
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
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
