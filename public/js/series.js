// Gerenciamento de séries e avaliações - Versão Final Consolidada e Revisitada

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

// Carregar Tudo (Animes, Novidades e Populares)
async function fetchAndDisplaySeries() {
    try {
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

// Mostrar detalhes da série e gerenciar formulário de avaliação
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
        if (typeof currentUser !== 'undefined' && currentUser) {
            try {
                const response = await API.getRating(seriesId);
                const userRating = response.rating; 
                
                const currentStars = userRating ? userRating.rating : 0;
                const currentStatus = userRating ? userRating.status : 'watching';
                const currentReview = userRating ? userRating.review : '';

                // Armazenamos os dados da série para o submitRating usar depois
                window.currentViewingSeries = series;

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

        let ratingsData = { average: 0, reviews: [] };
        try {
            ratingsData = await API.getSeriesRatings(seriesId);
        } catch (e) { console.error("Sem avaliações locais", e); }

        const communityAvg = parseFloat(ratingsData?.average || 0).toFixed(1);

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
                                    ${rev.title ? `<p style="font-size: 0.9em; color: #888;">Série: ${rev.title}</p>` : ''}
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

// Submeter avaliação - CORRIGIDO para enviar objeto seriesData
async function submitRating(event, seriesId) {
    event.preventDefault();
    const form = event.target;
    const ratingValue = document.getElementById('ratingValue').value;
    const reviewText = form.review.value;
    const watchStatus = form.status.value;
    const s = window.currentViewingSeries; // Pegamos os dados carregados em showSeriesDetail

    if (!ratingValue || ratingValue == "0") {
        notifyWarning("Por favor, selecione uma nota antes de salvar.", "Avaliação Incompleta");
        return;
    }

    // Criamos o objeto completo que o backend espera
    const ratingPayload = {
        tmdb_id: seriesId,
        rating: ratingValue,
        review: reviewText,
        status: watchStatus,
        title: s.name,
        poster: s.poster_path,
        backdrop: s.backdrop_path,
        overview: s.overview,
        genre: (s.genres && s.genres.length > 0) ? s.genres[0].name : 'Série',
        first_air_date: s.first_air_date || null,
        number_of_seasons: s.number_of_seasons || 0
    };

    try {
        const data = await API.addRating(ratingPayload);
        if (data.success) {
            notifySuccess('Sua avaliação foi salva com sucesso!', '✓ Avaliação Salva');
            showSeriesDetail(seriesId); 
        } else {
            notifyError(data.error || 'Erro desconhecido', '✗ Erro ao Salvar');
        }
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        notifyError('Erro de conexão com o servidor.', '✗ Erro de Conexão');
    }
}

// Renderizar atividade recente com busca de dados paralela
async function loadRecentActivity() {
    const container = document.getElementById('activityFeed'); 
    if (!container) return;
    
    try {
        const activities = await API.getRecentActivity();
        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="placeholder-text">Nenhuma atividade recente</p>';
            return;
        }
        
        container.innerHTML = '';
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            // usar tmdb_id (id da TMDB) ao abrir detalhes, não o id interno do DB
            activityItem.onclick = () => showSeriesDetail(activity.tmdb_id || activity.series_id);
            
            const rating = Math.round(activity.rating || 0);
            const userAvatar = activity.avatar && activity.avatar.startsWith('http') 
                ? activity.avatar : `/uploads/${activity.avatar || 'default-avatar.png'}`;
            
            activityItem.innerHTML = `
                <img src="${userAvatar}" class="activity-avatar" onerror="this.src='/uploads/default-avatar.png'">
                <div class="activity-content">
                    <div><span class="activity-username">${activity.username}</span> avaliou <strong>${activity.title || 'Série'}</strong></div>
                    <div class="activity-text">
                        <span style="color: #ffc107;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>
                        ${activity.review ? ` - "${activity.review.substring(0, 60)}..."` : ''}
                    </div>
                    <div class="activity-date">${new Date(activity.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
            `;
            container.appendChild(activityItem);
        });
    } catch (error) {
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar atividades</p>';
    }
}

// Funções de utilidade e eventos
function setRating(rating) {
    document.getElementById('ratingValue').value = rating;
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
}

function searchSeries(event) { if (event.key === 'Enter') performSearch(); }

// Carregadores de seções da página inicial
async function loadNewReleasesSection() {
    const container = document.getElementById('newSeries');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Carregando novidades...</div>';
    try {
        const data = await TMDB_API.getRecentReleases();
        container.innerHTML = '';
        
        if (data.results && data.results.length > 0) {
            data.results.slice(0, 10).forEach(series => {
                container.appendChild(renderSeriesCard(series));
            });
        } else {
            container.innerHTML = '<p class="placeholder-text">Nenhuma novidade encontrada</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar novidades:', error);
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar novidades</p>';
    }
}

async function loadAnimeSection() {
    const container = document.getElementById('animeSeries');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Carregando animes...</div>';
    try {
        const data = await TMDB_API.getAnimes();
        container.innerHTML = '';
        
        if (data.results && data.results.length > 0) {
            data.results.slice(0, 10).forEach(series => {
                container.appendChild(renderSeriesCard(series));
            });
        } else {
            container.innerHTML = '<p class="placeholder-text">Nenhum anime encontrado</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar animes:', error);
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar animes</p>';
    }
}

async function loadPopularSeries() {
    const container = document.getElementById('popularSeries');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Carregando populares...</div>';
    try {
        const data = await TMDB_API.getPopularSeries();
        container.innerHTML = '';
        
        if (data.results && data.results.length > 0) {
            data.results.slice(0, 10).forEach(series => {
                container.appendChild(renderSeriesCard(series));
            });
        } else {
            container.innerHTML = '<p class="placeholder-text">Nenhuma série popular encontrada</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar séries populares:', error);
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar séries populares</p>';
    }
}

async function loadTopRatedSeries() {
    const container = document.getElementById('topRatedSeries');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Carregando melhores...</div>';
    try {
        const data = await TMDB_API.getTopRatedSeries();
        container.innerHTML = '';
        
        if (data.results && data.results.length > 0) {
            data.results.slice(0, 10).forEach(series => {
                container.appendChild(renderSeriesCard(series));
            });
        } else {
            container.innerHTML = '<p class="placeholder-text">Nenhuma série top encontrada</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar top séries:', error);
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar top séries</p>';
    }
}

// Função de busca de séries
async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        document.getElementById('searchResults').innerHTML = '<p class="placeholder-text">Digite algo para buscar</p>';
        return;
    }
    
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="loading">Buscando séries...</div>';
    
    try {
        const data = await TMDB_API.searchSeries(query);
        resultsContainer.innerHTML = '';
        
        if (data.results && data.results.length > 0) {
            data.results.forEach(series => {
                resultsContainer.appendChild(renderSeriesCard(series));
            });
        } else {
            resultsContainer.innerHTML = '<p class="placeholder-text">Nenhuma série encontrada para "' + query + '"</p>';
        }
    } catch (error) {
        console.error('Erro ao buscar séries:', error);
        resultsContainer.innerHTML = '<p class="placeholder-text">Erro ao buscar séries</p>';
    }
}

// Busca na home (hero search)
async function heroSearchSeries(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

window.submitRating = submitRating;
window.setRating = setRating;
window.searchSeries = searchSeries;