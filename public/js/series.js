// Gerenciamento de séries e avaliações - Versão Final Consolidada

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

// Função auxiliar para renderizar múltiplas séries em um container
function renderSeries(seriesList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    seriesList.forEach(series => {
        container.appendChild(renderSeriesCard(series));
    });
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

// Carregar Tudo (Animes, Novidades e Populares) - Versão Corrigida para TMDB
async function fetchAndDisplaySeries() {
    try {
        // Carrega as seções em paralelo para melhor performance
        await Promise.all([
            loadAnimeSection(),
            loadNewReleasesSection(),
            loadPopularSeries(),
            loadTopRatedSeries()
        ]);
    } catch (error) {
        console.error("Erro ao carregar seções de séries:", error);
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

// Mostrar detalhes da série 
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

        // --- TRATAMENTO DA MÉDIA UNIFICADO ---
        let ratingsData = { average: 0, reviews: [] };
        try {
            ratingsData = await API.getSeriesRatings(seriesId);
        } catch (e) { 
            console.error("Sem avaliações locais", e); 
        }

        const averageValue = parseFloat(ratingsData?.average || 0);
        const communityAvg = averageValue.toFixed(1);

        container.innerHTML = `
            <div class="backdrop-container">
                <img src="${backdropUrl}" class="backdrop-img" onerror="this.style.display='none'">
            </div>
            <div class="series-detail-content">
                <div class="series-detail-header">
                    <img src="${posterUrl}" class="series-detail-poster" onerror="this.src='/uploads/default-poster.png'">
                    <div class="series-detail-info">
                        <h2>${series.name}</h2>
                        <p>${year} • ${series.number_of_seasons || '?'} Temporadas • ⭐ ${rating}</p>
                    </div>
                </div>
                <div class="series-detail-overview">
                    <h3>Sinopse</h3>
                    <p>${series.overview || 'Sem sinopse.'}</p>
                </div>
                ${userRatingSection}
                <div class="rating-section">
                    <h3>Comunidade (Nota: ${communityAvg})</h3>
                    <div class="reviews-list">
                        ${ratingsData.reviews && ratingsData.reviews.length > 0 ? ratingsData.reviews.map(rev => `
                            <div class="review-item">
                                <img src="${rev.avatar && rev.avatar.startsWith('http') ? rev.avatar : '/uploads/' + (rev.avatar || 'default-avatar.png')}" class="review-avatar" onerror="this.src='/uploads/default-avatar.png'">
                                <div class="review-content">
                                    <strong>${rev.username}</strong> - ⭐ ${rev.rating}
                                    <p>${rev.review || ''}</p>
                                </div>
                            </div>
                        `).join('') : '<p>Ainda não há avaliações.</p>'}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar detalhes da série.</p>';
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
    const ratingValue = document.getElementById('ratingValue').value;
    const reviewText = form.review.value;
    const watchStatus = form.status.value;

    if (!ratingValue || ratingValue == "0") {
        alert("Por favor, selecione uma nota antes de salvar.");
        return;
    }

    try {
        const data = await API.addRating(seriesId, ratingValue, reviewText, watchStatus);
        if (data.success) {
            alert('Avaliação salva com sucesso!');
            showSeriesDetail(seriesId); 
        } else {
            alert('Erro ao salvar: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        alert('Erro de conexão com o servidor.');
    }
}
window.submitRating = submitRating;

// CARREGAR ATIVIDADE RECENTE
async function loadRecentActivity() {
    const container = document.getElementById('activityFeed'); 
    if (!container) return;
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        const activities = await API.getRecentActivity();
        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="placeholder-text">Nenhuma atividade recente</p>';
            return;
        }
        
        container.innerHTML = '';
        const activityPromises = activities.map(async (activity) => {
            try {
                const series = await TMDB_API.getSeriesDetails(activity.series_id);
                return series ? { activity, series } : null;
            } catch (e) { return null; }
        });

        const results = await Promise.all(activityPromises);
        results.forEach(item => {
            if(item) {
                const { activity, series } = item;
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.onclick = () => showSeriesDetail(activity.series_id);
                
                const rating = Math.round(activity.rating || 0);
                const userAvatar = activity.avatar && activity.avatar.startsWith('http') 
                    ? activity.avatar : `/uploads/${activity.avatar || 'default-avatar.png'}`;
                
                activityItem.innerHTML = `
                    <img src="${userAvatar}" class="activity-avatar" onerror="this.src='/uploads/default-avatar.png'">
                    <div class="activity-content">
                        <div><span class="activity-username">${activity.username}</span> avaliou <strong>${series.name}</strong></div>
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
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar atividades</p>';
    }
}

// Funções de busca
function heroSearchSeries(event) {
    if (event.key === 'Enter') {
        const query = event.target.value;
        if (query) {
            window.location.hash = '#search';
            setTimeout(() => {
                const input = document.getElementById('searchInput');
                if(input) { input.value = query; performSearch(); }
            }, 100);
        }
    }
}

function searchSeries(event) { if (event.key === 'Enter') performSearch(); }
window.heroSearchSeries = heroSearchSeries;
window.searchSeries = searchSeries;

// --- SEÇÕES ESPECÍFICAS ---
async function loadAnimeSection() {
    const container = document.getElementById('animeSeries'); 
    if (!container) return;
    container.innerHTML = '<div class="loading">Carregando animes...</div>';
    try {
        const data = await TMDB_API.getAnimes();
        container.innerHTML = ''; 
        data.results.slice(0, 12).forEach(series => container.appendChild(renderSeriesCard(series)));
    } catch (error) { container.innerHTML = '<p>Erro ao carregar animes</p>'; }
}

async function loadNewReleasesSection() {
    const container = document.getElementById('newSeries'); 
    if (!container) return;
    container.innerHTML = '<div class="loading">Carregando novidades...</div>';
    try {
        const data = await TMDB_API.getRecentReleases();
        container.innerHTML = '';
        data.results.slice(0, 12).forEach(series => container.appendChild(renderSeriesCard(series)));
    } catch (error) { container.innerHTML = '<p>Erro ao carregar novidades</p>'; }
}