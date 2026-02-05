const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Pool } = require('pg'); // Mudança para PostgreSQL
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000, // Desiste após 5 segundos se a rede travar
    idleTimeoutMillis: 30000
});

// Teste de conexão imediata
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('🚀 Conectado ao banco de dados PostgreSQL no Supabase');
    }
});

// Configuração de upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './public/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'seriesbox-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Middleware de autenticação
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado' });
    }
};

// ============= ROTAS DE AUTENTICAÇÃO =============

// Cadastro
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await db.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );
        
        const newUserId = result.rows[0].id;
        req.session.userId = newUserId;
        req.session.username = username;
        res.json({ success: true, userId: newUserId, username });
    } catch (error) {
        if (error.message.includes('unique')) {
            return res.status(400).json({ error: 'Usuário ou email já existe' });
        }
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        
        if (!user) {
            return res.status(400).json({ error: 'Email ou senha inválidos' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Email ou senha inválidos' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ 
            success: true, 
            userId: user.id, 
            username: user.username,
            avatar: user.avatar
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Verificar sessão
app.get('/api/check-session', async (req, res) => {
    if (req.session.userId) {
        try {
            const result = await db.query('SELECT id, username, email, bio, avatar FROM users WHERE id = $1', [req.session.userId]);
            const user = result.rows[0];
            if (!user) return res.json({ authenticated: false });
            res.json({ authenticated: true, user });
        } catch (err) {
            res.json({ authenticated: false });
        }
    } else {
        res.json({ authenticated: false });
    }
});

// ============= ROTAS DE USUÁRIO =============

// Obter perfil do usuário
app.get('/api/user/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const userRes = await db.query('SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];

        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        const statsRes = await db.query(`
            SELECT 
                COUNT(*) as total_ratings,
                AVG(rating) as avg_rating,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_series
            FROM ratings 
            WHERE user_id = $1
        `, [userId]);
        
        res.json({ user, stats: statsRes.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
});

// Atualizar perfil
app.put('/api/user/profile', requireAuth, async (req, res) => {
    const { bio } = req.body;
    const userId = req.session.userId;
    try {
        await db.query('UPDATE users SET bio = $1 WHERE id = $2', [bio, userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
});

// Upload de avatar
app.post('/api/user/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const avatarPath = req.file.filename;
    const userId = req.session.userId;
    try {
        await db.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarPath, userId]);
        res.json({ success: true, avatar: avatarPath });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar avatar' });
    }
});

// ============= ROTAS DE AVALIAÇÕES =============

// Adicionar/atualizar avaliação (Uso do ON CONFLICT para PostgreSQL)
app.post('/api/rating', requireAuth, async (req, res) => {
    const { seriesId, rating, review, status } = req.body;
    const userId = req.session.userId;
    try {
        await db.query(`
            INSERT INTO ratings (user_id, series_id, rating, review, status)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT(user_id, series_id) 
            DO UPDATE SET rating = $3, review = $4, status = $5
        `, [userId, seriesId, rating, review, status]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao salvar avaliação' });
    }
});

// Média de avaliações de uma série
app.get('/api/series/:id/ratings', async (req, res) => {
    const seriesId = req.params.id;
    try {
        const result = await db.query(`
            SELECT 
                u.username, u.avatar, r.rating, r.review, r.created_at,
                (SELECT AVG(rating) FROM ratings WHERE series_id = $1) as average_global,
                (SELECT COUNT(*) FROM ratings WHERE series_id = $1) as count_global
            FROM ratings r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.series_id = $1
            ORDER BY r.created_at DESC
        `, [seriesId]);
        
        const reviews = result.rows;
        const average = reviews.length > 0 ? parseFloat(reviews[0].average_global).toFixed(1) : 0;
        const count = reviews.length > 0 ? reviews[0].count_global : 0;
        
        res.json({ average, count, reviews });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar avaliações' });
    }
});

// Obter todas as avaliações de um usuário
app.get('/api/user/:id/ratings', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM ratings WHERE user_id = $1 ORDER BY created_at DESC', [req.params.id]);
        res.json({ ratings: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar avaliações' });
    }
});

// ============= ATIVIDADES RECENTES =============

app.get('/api/recent-activity', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.*, u.username, u.avatar
            FROM ratings r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
            LIMIT 20
        `);
        res.json({ activities: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar atividades' });
    }
});

// Servir o frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(` Servidor rodando em http://localhost:${PORT}`);
});

// Teste de deploy numero 2