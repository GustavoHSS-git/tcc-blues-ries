// ==========================================
// TMDB_API: Funções da Nuvem (Filmes e Séries)
// ==========================================
const TMDB_API = {
    // Séries populares
    getPopularSeries: async () => {
        try {
            const response = await fetch(
                `${TMDB_CONFIG.BASE_URL}/tv/popular?api_key=${TMDB_CONFIG.API_KEY}&language=pt-BR&page=1`
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar séries populares:', error);
            return { results: [] };
        }
    },

    // Top séries avaliadas
    getTopRatedSeries: async () => {
        try {
            const response = await fetch(
                `${TMDB_CONFIG.BASE_URL}/tv/top_rated?api_key=${TMDB_CONFIG.API_KEY}&language=pt-BR&page=1`
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar top séries:', error);
            return { results: [] };
        }
    },

    // Séries no ar
    getOnTheAirSeries: async () => {
        try {
            const response = await fetch(
                `${TMDB_CONFIG.BASE_URL}/tv/on_the_air?api_key=${TMDB_CONFIG.API_KEY}&language=pt-BR&page=1`
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar séries no ar:', error);
            return { results: [] };
        }
    },

    // Buscar Animes (Animação + Keyword Anime)
    getAnimes: async () => {
        try {
            const response = await fetch(
                `${TMDB_CONFIG.BASE_URL}/discover/tv?api_key=${TMDB_CONFIG.API_KEY}&language=pt-BR&with_genres=16&with_keywords=210024&sort_by=popularity.desc`
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar animes:', error);
            return { results: [] };
        }
    },

<<<<<<< HEAD
    // Buscar Novidades (Séries que estrearam recentemente)
=======
    // Buscar Novidades
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
    getRecentReleases: async () => {
        try {
            const response = await fetch(
                `${TMDB_CONFIG.BASE_URL}/tv/on_the_air?api_key=${TMDB_CONFIG.API_KEY}&language=pt-BR&page=1`
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar novidades:', error);
            return { results: [] };
        }
    },

<<<<<<< HEAD
    // Buscar por Gênero específico
=======
    // Buscar por Gênero
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
    getSeriesByGenre: async (genreId) => {
        try {
            const response = await fetch(
                `${TMDB_CONFIG.BASE_URL}/discover/tv?api_key=${TMDB_CONFIG.API_KEY}&language=pt-BR&with_genres=${genreId}&sort_by=popularity.desc`
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar gênero:', error);
            return { results: [] };
        }
    },

<<<<<<< HEAD
    // Buscar séries (Barra de busca)
=======
    // Buscar séries
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
    searchSeries: async (query) => {
        try {
            const response = await fetch(
                `${TMDB_CONFIG.BASE_URL}/search/tv?api_key=${TMDB_CONFIG.API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar séries:', error);
            return { results: [] };
        }
    },

    // Detalhes da série
    getSeriesDetails: async (seriesId) => {
        try {
            const response = await fetch(
                `${TMDB_CONFIG.BASE_URL}/tv/${seriesId}?api_key=${TMDB_CONFIG.API_KEY}&language=pt-BR&append_to_response=credits,videos,similar`
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar detalhes da série:', error);
            return null;
        }
    },

    // Construir URL de imagem
    getImageUrl: (path, size = 'w500') => {
        if (!path) return '/uploads/default-poster.png';
        return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
    }
};

<<<<<<< HEAD
// ==========================================
// API: Funções do seu Banco de Dados (Login, Reviews, Atividade)
=======

// ==========================================
// API: Banco de Dados (Node / Postgres)
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
// ==========================================
const API = {
    // Autenticação
    register: async (username, email, password) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        return await response.json();
    },

    login: async (email, password) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return await response.json();
    },

    logout: async () => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/logout`, { method: 'POST' });
        return await response.json();
    },

    checkSession: async () => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/check-session`);
        return await response.json();
    },

<<<<<<< HEAD
    // Perfil do Usuário
    getUser: async (userId) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/user/${userId}`);
        if (!response.ok) return null; 
=======
    // Perfil
    getUser: async (userId) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/user/${userId}`);
        if (!response.ok) return null;
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
        return await response.json();
    },

    updateProfile: async (bio) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/user/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bio })
        });
        return await response.json();
    },

    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await fetch(`${APP_CONFIG.API_BASE}/user/avatar`, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    },

<<<<<<< HEAD
   // Adicione os campos extras no envio
    addRating: async (seriesData) => {
    const response = await fetch(`${APP_CONFIG.API_BASE}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seriesData) // Passamos o objeto completo
    });
    return await response.json();
    },

    getRating: async (seriesId) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/rating/${seriesId}`);
=======
    // =========================
    // AVALIAÇÕES (CORRIGIDO)
    // =========================
    addRating: async (tmdb_id, rating, review, status) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/rating`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tmdb_id, rating, review, status })
        });
        return await response.json();
    },

    getRating: async (tmdb_id) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/rating/${tmdb_id}`);
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
        return await response.json();
    },

    getUserRatings: async (userId) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/user/${userId}/ratings`);
        return await response.json();
    },

<<<<<<< HEAD
    getSeriesRatings: async (seriesId) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/series/${seriesId}/ratings`);
        return await response.json();
    },

    // Atividades da Comunidade
=======
    getSeriesRatings: async (tmdb_id) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/series/${tmdb_id}/ratings`);
        return await response.json();
    },

    // Atividade recente
>>>>>>> 2797ee0922b782881b980ce503facf713d049237
    getRecentActivity: async () => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/recent-activity`);
        return await response.json();
    }
};