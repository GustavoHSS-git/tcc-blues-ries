// Gerenciamento de séries e avaliações - Versão Final Corrigida

// Renderizar card de série (Padrão TMDB)
function renderSeriesCard(series) {
    const card = document.createElement('div');
    card.className = 'series-card';
    card.onclick = () => showSeriesDetail(series.id);
    
    const posterUrl = TMDB_API.getImageUrl(series.poster_path);
    const rating = series.vote_average ? series.vote_average.toFixed(1) : 'N/A';
    const year = series.first_air_date ? series.first_air_date.split('-')[0] : '?';
    
    card.innerHTML = `
        <img src="${posterUrl}" alt="${series.name}" class="series-card-poster" 
             onerror="this.src='/uploads/default-poster.png'">
        <div class="series-card-content">
            <div class="series-card-title" title="${series.name}">${series.name}</div>
            <div class="series-card-info">
                <span>${year}</span>
                <span class="series-rating">⭐ ${rating}</span>
            </div>
        </div>
    `;
    
    return card;
}

// Carregar séries populares
async function loadPopularSeries() {
    const container = document.getElementById('popularSeries');
    if (!container) return;
    container.innerHTML = '<div class="loading">Carregando séries...</div>';
    
    try {
        const data = await TMDB_API.getPopularSeries();
        container.innerHTML = '';
        data.results.slice(0, 12).forEach(series => {
            container.appendChild(renderSeriesCard(series));
        });
    } catch (error) {
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar séries</p>';
    }
}

// Carregar top séries
async function loadTopRatedSeries() {
    const container = document.getElementById('topRatedSeries');
    if (!container) return;
    container.innerHTML = '<div class="loading">Carregando séries...</div>';
    
    try {
        const data = await TMDB_API.getTopRatedSeries();
        container.innerHTML = '';
        data.results.slice(0, 12).forEach(series => {
            container.appendChild(renderSeriesCard(series));
        });
    } catch (error) {
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar séries</p>';
    }
}

// Carregar séries novas
async function loadNewSeries() {
    const container = document.getElementById('newSeries');
    if (!container) return;
    container.innerHTML = '<div class="loading">Carregando séries...</div>';
    
    try {
        const data = await TMDB_API.getOnTheAirSeries();
        container.innerHTML = '';
        data.results.slice(0, 12).forEach(series => {
            container.appendChild(renderSeriesCard(series));
        });
    } catch (error) {
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar séries</p>';
    }
}

// Buscar séries
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const container = document.getElementById('searchResults');
    
    if (!query) {
        container.innerHTML = '<p class="placeholder-text">Digite algo para começar a buscar...</p>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Buscando...</div>';
    
    try {
        const data = await TMDB_API.searchSeries(query);
        container.innerHTML = '';
        
        if (data.results.length === 0) {
            container.innerHTML = '<p class="placeholder-text">Nenhuma série encontrada</p>';
            return;
        }
        
        const grid = document.createElement('div');
        grid.className = 'series-grid';
        data.results.forEach(series => grid.appendChild(renderSeriesCard(series)));
        container.appendChild(grid);
    } catch (error) {
        container.innerHTML = '<p class="placeholder-text">Erro ao buscar séries</p>';
    }
}

// Mostrar detalhes da série (CORRIGIDO PARA POSTGRES)
async function showSeriesDetail(seriesId) {
    window.location.hash = `#series/${seriesId}`;
    const container = document.getElementById('seriesDetail');
    container.innerHTML = '<div class="loading">Carregando detalhes...</div>';
    
    try {
        const series = await TMDB_API.getSeriesDetails(seriesId);
        if (!series) throw new Error("Série não encontrada");

        const backdropUrl = TMDB_API.getImageUrl(series.backdrop_path, 'w1280');
        const posterUrl = TMDB_API.getImageUrl(series.poster_path);
        const year = series.first_air_date ? series.first_air_date.split('-')[0] : '?';
        const rating = series.vote_average ? series.vote_average.toFixed(1) : 'N/A';
        
        let userRatingSection = '';
        if (currentUser) {
            try {
                const response = await API.getRating(seriesId);
                // Ajuste: A API retorna { rating: { ... } }
                const userRating = response.rating; 
                
                const currentStars = userRating ? userRating.rating : 0;
                const currentStatus = userRating ? userRating.status : 'watching';
                const currentReview = userRating ? userRating.review : '';

                userRatingSection = `
                    <div class="rating-section">
                        <h3>Sua Avaliação</h3>
                        <form class="rating-form" onsubmit="submitRating(event, ${seriesId})">
                            <div class="form-group">
                                <label>Nota</label>
                                <div class="stars" id="ratingStars">
                                    ${[1, 2, 3, 4, 5].map(i => `
                                        <span class="star ${currentStars >= i ? 'active' : ''}" 
                                              onclick="setRating(${i})">★</span>
                                    `).join('')}
                                </div>
                                <input type="hidden" name="rating" id="ratingValue" value="${currentStars}">
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select name="status">
                                    <option value="watching" ${currentStatus === 'watching' ? 'selected' : ''}>Assistindo</option>
                                    <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Completei</option>
                                    <option value="plan_to_watch" ${currentStatus === 'plan_to_watch' ? 'selected' : ''}>Planejo Assistir</option>
                                    <option value="dropped" ${currentStatus === 'dropped' ? 'selected' : ''}>Dropei</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Review</label>
                                <textarea name="review">${currentReview}</textarea>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">Salvar</button>
                        </form>
                    </div>
                `;
            } catch (err) { console.error(err); }
        }

        const ratingsData = await API.getSeriesRatings(seriesId);
        
        container.innerHTML = `
            <div class="backdrop-container">
                <img src="${backdropUrl}" class="backdrop-img" onerror="this.style.display='none'">
            </div>
            <div class="series-detail-content">
                <div class="series-detail-header">
                    <img src="${posterUrl}" class="series-detail-poster" onerror="this.src='/uploads/default-poster.png'">
                    <div class="series-detail-info">
                        <h2>${series.name}</h2>
                        <p>${year} • ${series.number_of_seasons} Temporadas • ⭐ ${rating}</p>
                    </div>
                </div>
                <div class="series-detail-overview">
                    <h3>Sinopse</h3>
                    <p>${series.overview || 'Sem sinopse.'}</p>
                </div>
                ${userRatingSection}
                <div class="rating-section">
                    <h3>Comunidade (Nota: ${ratingsData.average || 0})</h3>
                    <div class="reviews-list">
                        ${ratingsData.reviews.map(rev => `
                            <div class="review-item">
                                <img src="${rev.avatar && rev.avatar.startsWith('http') ?HJrev.avatar : '/uploads/' + (rev.avatar || 'default-avatar.png')}" class="review-avatar" onerror="this.src='/uploads/default-avatar.png'">
                                <div class="review-content">
                                    <strong>${rev.username}</strong> - ⭐ ${rev.rating}
                                    <p>${rev.review || ''}</p>
                                </div>
                            </div>
                        `).join('') || '<p>Ainda não há avaliações.</p>'}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<p>Erro ao carregar detalhes.</p>';
    }
}

// Definir avaliação por estrelas
function setRating(rating) {
    document.getElementById('ratingValue').value = rating;
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
}

// Submeter avaliação
async function submitRating(event, seriesId) {
    event.preventDefault();
    const form = event.target;
    const rating = form.rating.value;
    const review = form.review.value;
    const status = form.status.value;

    try {
        const data = await API.addRating(seriesId, rating, review, status);
        if (data.success) {
            alert('Avaliação salva!');
            showSeriesDetail(seriesId);
        }
    } catch (error) { alert('Erro ao salvar.'); }
}

// CARREGAR ATIVIDADE RECENTE (CORRIGIDO PARA OTIMIZAÇÃO E POSTGRES)
async function loadRecentActivity() {
    const container = document.getElementById('activityFeed'); 
    if (!container) return;

    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        // A API retorna o array diretamente: [{}, {}, ...]
        const activities = await API.getRecentActivity();
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="placeholder-text">Nenhuma atividade recente</p>';
            return;
        }
        
        container.innerHTML = '';
        
        // OTIMIZAÇÃO: Busca todas as informações do TMDB em paralelo (Promise.all)
        // Isso evita que o site trave carregando um por um
        const activityPromises = activities.map(async (activity) => {
            try {
                const series = await TMDB_API.getSeriesDetails(activity.series_id);
                if (series) {
                    return { activity, series };
                }
            } catch (e) {
                console.error("Erro no TMDB para série " + activity.series_id, e);
            }
            return null;
        });

        const results = await Promise.all(activityPromises);
        
        // Renderiza apenas os resultados válidos
        results.forEach(item => {
            if(item) {
                const { activity, series } = item;
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.onclick = () => showSeriesDetail(activity.series_id);
                
                const rating = Math.round(activity.rating || 0);
                // Suporte para URL Cloudinary ou Local
                const userAvatar = activity.avatar && activity.avatar.startsWith('http') 
                    ? activity.avatar 
                    : `/uploads/${activity.avatar || 'default-avatar.png'}`;
                
                activityItem.innerHTML = `
                    <img src="${userAvatar}" class="activity-avatar" onerror="this.src='/uploads/default-avatar.png'">
                    <div class="activity-content">
                        <div>
                            <span class="activity-username">${activity.username}</span> avaliou 
                            <strong>${series.name}</strong>
                        </div>
                        <div class="activity-text">
                            <span style="color: #ffc107;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>
                            ${activity.review ? ` - "${activity.review.substring(0, 60)}..."` : ''}
                        </div>
                        <div class="activity-date">${new Date(activity.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                `;
                container.appendChild(activityItem);
            }
        });

    } catch (error) {
        console.error('Erro na atividade:', error);
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar atividades</p>';
    }
}

// Função para busca na Hero Section (Página Inicial)
function heroSearchSeries(event) {
    if (event.key === 'Enter') {
        const query = event.target.value;
        if (query) {
            window.location.hash = '#search';
            setTimeout(() => {
                const searchInput = document.getElementById('searchInput');
                if(searchInput) {
                    searchInput.value = query;
                    performSearch();
                }
            }, 100);
        }
    }
}

// Função para busca na Página de Busca
function searchSeries(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

// Garante que as funções estejam disponíveis globalmente para o HTML (onkeyup)
window.heroSearchSeries = heroSearchSeries;
window.searchSeries = searchSeries;