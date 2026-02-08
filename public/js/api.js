// ==========================================
// TMDB_API: Funções da Nuvem (Filmes e Séries)
// ==========================================
const TMDB_API = {
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

    getSeriesDetails: async (seriesId) => {
        try {
            const response = await fetch(
                `${TMDB_CONFIG.BASE_URL}/tv/${seriesId}?api_key=${TMDB_CONFIG.API_KEY}&language=pt-BR&append_to_response=credits,videos,similar`
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar detalhes:', error);
            return null;
        }
    },

    getImageUrl: (path, size = 'w500') => {
        if (!path) return '/uploads/default-poster.png';
        return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
    }
};

// ==========================================
// API: Banco de Dados Local (Autenticação e Social)
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

    // Perfil
    getUser: async (userId) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/user/${userId}`);
        if (!response.ok) return null; 
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

    // Avaliações (Sincronizado com o Backend)
    addRating: async (seriesData) => {
        // seriesData deve conter: seriesId, rating, review, status + metadados (title, poster, etc)
        const response = await fetch(`${APP_CONFIG.API_BASE}/rating`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(seriesData)
        });
        return await response.json();
    },

    getRating: async (seriesId) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/rating/${seriesId}`);
        return await response.json();
    },

    getUserRatings: async (userId) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/user/${userId}/ratings`);
        return await response.json();
    },

    getSeriesRatings: async (seriesId) => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/series/${seriesId}/ratings`);
        return await response.json();
    },

    getRecentActivity: async () => {
        const response = await fetch(`${APP_CONFIG.API_BASE}/recent-activity`);
        return await response.json();
    }
};