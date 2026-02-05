const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configuração do banco de dados
const db = new sqlite3.Database('./seriesbox.db', (err) => {
    if (err) console.error('Erro ao conectar ao banco:', err);
    else console.log('Conectado ao banco de dados SQLite');
});

// Criar tabelas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        bio TEXT,
        avatar TEXT DEFAULT 'default-avatar.png',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        series_id INTEGER NOT NULL,
        rating REAL NOT NULL,
        review TEXT,
        status TEXT DEFAULT 'watching',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, series_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        series_id INTEGER NOT NULL,
        status TEXT DEFAULT 'plan_to_watch',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, series_id)
    )`);
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
        
        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Usuário ou email já existe' });
                    }
                    return res.status(500).json({ error: 'Erro ao criar usuário' });
                }
                
                req.session.userId = this.lastID;
                req.session.username = username;
                res.json({ success: true, userId: this.lastID, username });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        
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
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Verificar sessão
app.get('/api/check-session', (req, res) => {
    if (req.session.userId) {
        db.get('SELECT id, username, email, bio, avatar FROM users WHERE id = ?', 
            [req.session.userId], 
            (err, user) => {
                if (err || !user) {
                    return res.json({ authenticated: false });
                }
                res.json({ authenticated: true, user });
            }
        );
    } else {
        res.json({ authenticated: false });
    }
});

// ============= ROTAS DE USUÁRIO =============

// Obter perfil do usuário
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    
    db.get('SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?', 
        [userId], 
        (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            
            // Buscar estatísticas do usuário
            db.all(`
                SELECT 
                    COUNT(*) as total_ratings,
                    AVG(rating) as avg_rating,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_series
                FROM ratings 
                WHERE user_id = ?
            `, [userId], (err, stats) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
                }
                
                res.json({ user, stats: stats[0] });
            });
        }
    );
});

// Atualizar perfil
app.put('/api/user/profile', requireAuth, (req, res) => {
    const { bio } = req.body;
    const userId = req.session.userId;

    db.run('UPDATE users SET bio = ? WHERE id = ?', [bio, userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }
        res.json({ success: true });
    });
});

// Upload de avatar
app.post('/api/user/avatar', requireAuth, upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const avatarPath = req.file.filename;
    const userId = req.session.userId;

    db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar avatar' });
        }
        res.json({ success: true, avatar: avatarPath });
    });
});

// ============= ROTAS DE AVALIAÇÕES =============

// Adicionar/atualizar avaliação
app.post('/api/rating', requireAuth, (req, res) => {
    const { seriesId, rating, review, status } = req.body;
    const userId = req.session.userId;

    db.run(`
        INSERT INTO ratings (user_id, series_id, rating, review, status)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, series_id) 
        DO UPDATE SET rating = ?, review = ?, status = ?
    `, [userId, seriesId, rating, review, status, rating, review, status], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao salvar avaliação' });
        }
        res.json({ success: true, ratingId: this.lastID });
    });
});

// Obter avaliação do usuário para uma série
app.get('/api/rating/:seriesId', requireAuth, (req, res) => {
    const seriesId = req.params.seriesId;
    const userId = req.session.userId;

    db.get('SELECT * FROM ratings WHERE user_id = ? AND series_id = ?', 
        [userId, seriesId], 
        (err, rating) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar avaliação' });
            }
            res.json({ rating: rating || null });
        }
    );
});

// Obter todas as avaliações de um usuário
app.get('/api/user/:id/ratings', (req, res) => {
    const userId = req.params.id;
    
    db.all('SELECT * FROM ratings WHERE user_id = ? ORDER BY created_at DESC', 
        [userId], 
        (err, ratings) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar avaliações' });
            }
            res.json({ ratings });
        }
    );
});

// Obter média de avaliações de uma série
app.get('/api/series/:id/ratings', (req, res) => {
    const seriesId = req.params.id;
    
    db.all(`
        SELECT 
            AVG(rating) as average,
            COUNT(*) as count,
            users.username,
            users.avatar,
            ratings.rating,
            ratings.review,
            ratings.created_at
        FROM ratings
        LEFT JOIN users ON ratings.user_id = users.id
        WHERE ratings.series_id = ?
        GROUP BY ratings.id
        ORDER BY ratings.created_at DESC
    `, [seriesId], (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar avaliações' });
        }
        
        const average = data.length > 0 ? data[0].average : 0;
        const count = data.length;
        
        res.json({ 
            average: average ? parseFloat(average.toFixed(1)) : 0, 
            count,
            reviews: data 
        });
    });
});

// Deletar avaliação
app.delete('/api/rating/:seriesId', requireAuth, (req, res) => {
    const seriesId = req.params.seriesId;
    const userId = req.session.userId;

    db.run('DELETE FROM ratings WHERE user_id = ? AND series_id = ?', 
        [userId, seriesId], 
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao deletar avaliação' });
            }
            res.json({ success: true });
        }
    );
});

// ============= ATIVIDADES RECENTES =============

app.get('/api/recent-activity', (req, res) => {
    db.all(`
        SELECT 
            ratings.*,
            users.username,
            users.avatar
        FROM ratings
        LEFT JOIN users ON ratings.user_id = users.id
        ORDER BY ratings.created_at DESC
        LIMIT 20
    `, [], (err, activities) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar atividades' });
        }
        res.json({ activities });
    });
});

// Servir o frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log('📺 SeriesBox - Sua plataforma de avaliação de séries!');
});
