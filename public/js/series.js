// Gerenciamento de séries e avaliações

// Renderizar card de série
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
async function searchSeries(event) {
    if (event && event.key !== 'Enter') return;
    performSearch();
}

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
        
        data.results.forEach(series => {
            grid.appendChild(renderSeriesCard(series));
        });
        
        container.appendChild(grid);
    } catch (error) {
        container.innerHTML = '<p class="placeholder-text">Erro ao buscar séries</p>';
    }
}

// Busca na hero section
function heroSearchSeries(event) {
    if (event.key === 'Enter') {
        const query = document.getElementById('heroSearch').value.trim();
        if (query) {
            window.location.hash = '#search';
            setTimeout(() => {
                document.getElementById('searchInput').value = query;
                performSearch();
            }, 100);
        }
    }
}

// Mostrar detalhes da série
async function showSeriesDetail(seriesId) {
    window.location.hash = `#series/${seriesId}`;
    const container = document.getElementById('seriesDetail');
    container.innerHTML = '<div class="loading">Carregando detalhes...</div>';
    
    try {
        const series = await TMDB_API.getSeriesDetails(seriesId);
        
        if (!series) {
            container.innerHTML = '<p class="placeholder-text">Erro ao carregar detalhes</p>';
            return;
        }
        
        const backdropUrl = TMDB_API.getImageUrl(series.backdrop_path, 'w1280');
        const posterUrl = TMDB_API.getImageUrl(series.poster_path);
        const year = series.first_air_date ? series.first_air_date.split('-')[0] : '?';
        const rating = series.vote_average ? series.vote_average.toFixed(1) : 'N/A';
        const genres = series.genres ? series.genres.map(g => g.name).join(', ') : '';
        
        let userRatingSection = '';
        if (currentUser) {
            const userRatingData = await API.getRating(seriesId);
            const userRating = userRatingData.rating;
            
            userRatingSection = `
                <div class="rating-section">
                    <h3>Sua Avaliação</h3>
                    <form class="rating-form" onsubmit="submitRating(event, ${seriesId})">
                        <div class="form-group">
                            <label>Avaliação</label>
                            <div class="stars" id="ratingStars">
                                ${[1, 2, 3, 4, 5].map(i => `
                                    <span class="star ${userRating && userRating.rating >= i ? 'active' : ''}" 
                                          data-rating="${i}" 
                                          onclick="setRating(${i})">★</span>
                                `).join('')}
                            </div>
                            <input type="hidden" name="rating" id="ratingValue" value="${userRating ? userRating.rating : '0'}">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select name="status" required>
                                <option value="watching" ${userRating && userRating.status === 'watching' ? 'selected' : ''}>Assistindo</option>
                                <option value="completed" ${userRating && userRating.status === 'completed' ? 'selected' : ''}>Completei</option>
                                <option value="plan_to_watch" ${userRating && userRating.status === 'plan_to_watch' ? 'selected' : ''}>Planejo Assistir</option>
                                <option value="dropped" ${userRating && userRating.status === 'dropped' ? 'selected' : ''}>Dropei</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Review (opcional)</label>
                            <textarea name="review" placeholder="Escreva sua opinião sobre a série...">${userRating && userRating.review ? userRating.review : ''}</textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">Salvar Avaliação</button>
                        ${userRating ? '<button type="button" class="btn btn-outline btn-block" onclick="deleteRating(' + seriesId + ')">Deletar Avaliação</button>' : ''}
                    </form>
                </div>
            `;
        } else {
            userRatingSection = `
                <div class="rating-section">
                    <p style="text-align: center; color: var(--text-secondary);">
                        <a href="#" onclick="showLogin()" style="color: var(--primary-color);">Faça login</a> 
                        para avaliar esta série
                    </p>
                </div>
            `;
        }
        
        // Buscar avaliações da comunidade
        const ratingsData = await API.getSeriesRatings(seriesId);
        
        const reviewsSection = `
            <div class="rating-section">
                <h3>Avaliações da Comunidade</h3>
                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="font-size: 3rem; color: var(--warning);">⭐ ${ratingsData.average || 0}</div>
                        <div>
                            <div style="font-size: 1.2rem; font-weight: 600;">${ratingsData.count} avaliações</div>
                            <div style="color: var(--text-secondary);">Média da comunidade</div>
                        </div>
                    </div>
                </div>
                <div class="reviews-list">
                    ${ratingsData.reviews && ratingsData.reviews.length > 0 ? 
                        ratingsData.reviews.map(review => `
                            <div class="review-item">
                                <div class="review-header">
                                    <img src="/uploads/${review.avatar || 'default-avatar.png'}" alt="${review.username}" class="review-avatar">
                                    <div class="review-info">
                                        <div class="review-username">${review.username}</div>
                                        <div class="review-date">${new Date(review.created_at).toLocaleDateString('pt-BR')}</div>
                                    </div>
                                    <div class="review-rating">
                                        ${'★'.repeat(Math.round(review.rating))}${'☆'.repeat(5 - Math.round(review.rating))}
                                    </div>
                                </div>
                                ${review.review ? `<div class="review-text">${review.review}</div>` : ''}
                            </div>
                        `).join('') 
                        : '<p style="text-align: center; color: var(--text-secondary);">Nenhuma avaliação ainda</p>'
                    }
                </div>
            </div>
        `;
        
        container.innerHTML = `
            <div style="position: relative; overflow: hidden;">
                <img src="${backdropUrl}" alt="${series.name}" style="width: 100%; height: 400px; object-fit: cover;" 
                     onerror="this.style.display='none'">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
                     background: linear-gradient(to bottom, transparent, var(--bg-dark));"></div>
            </div>
            
            <div class="series-detail-content">
                <div class="series-detail-header">
                    <img src="${posterUrl}" alt="${series.name}" class="series-detail-poster"
                         onerror="this.src='/uploads/default-poster.png'">
                    <div class="series-detail-info">
                        <h2 class="series-detail-title">${series.name}</h2>
                        <div class="series-detail-meta">
                            <span>${year}</span>
                            <span>${series.number_of_seasons} Temporada${series.number_of_seasons > 1 ? 's' : ''}</span>
                            <span>${series.number_of_episodes} Episódios</span>
                            <span>⭐ ${rating}</span>
                        </div>
                        ${genres ? `<div style="margin-bottom: 1rem; color: var(--text-secondary);">${genres}</div>` : ''}
                    </div>
                </div>
                
                <div class="series-detail-overview">
                    <h3>Sinopse</h3>
                    <p>${series.overview || 'Sinopse não disponível.'}</p>
                </div>
                
                ${userRatingSection}
                ${reviewsSection}
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar detalhes da série</p>';
    }
}

// Definir avaliação por estrelas
function setRating(rating) {
    document.getElementById('ratingValue').value = rating;
    
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Submeter avaliação
async function submitRating(event, seriesId) {
    event.preventDefault();
    
    if (!currentUser) {
        showLogin();
        return;
    }
    
    const form = event.target;
    const rating = parseFloat(form.rating.value);
    const review = form.review.value;
    const status = form.status.value;
    
    if (rating === 0) {
        alert('Por favor, selecione uma avaliação');
        return;
    }
    
    try {
        const data = await API.addRating(seriesId, rating, review, status);
        
        if (data.success) {
            alert('Avaliação salva com sucesso!');
            showSeriesDetail(seriesId); // Recarregar detalhes
        } else {
            alert('Erro ao salvar avaliação');
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor');
    }
}

// Deletar avaliação
async function deleteRating(seriesId) {
    if (!confirm('Tem certeza que deseja deletar sua avaliação?')) {
        return;
    }
    
    try {
        const data = await API.deleteRating(seriesId);
        
        if (data.success) {
            alert('Avaliação deletada com sucesso!');
            showSeriesDetail(seriesId); // Recarregar detalhes
        } else {
            alert('Erro ao deletar avaliação');
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor');
    }
}

// Carregar atividades recentes
async function loadRecentActivity() {
    const container = document.getElementById('activityFeed');
    container.innerHTML = '<div class="loading">Carregando atividades...</div>';
    
    try {
        const data = await API.getRecentActivity();
        container.innerHTML = '';
        
        if (data.activities.length === 0) {
            container.innerHTML = '<p class="placeholder-text">Nenhuma atividade recente</p>';
            return;
        }
        
        for (const activity of data.activities.slice(0, 10)) {
            // Buscar informações da série
            const series = await TMDB_API.getSeriesDetails(activity.series_id);
            
            if (series) {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.onclick = () => showSeriesDetail(activity.series_id);
                
                activityItem.innerHTML = `
                    <img src="/uploads/${activity.avatar || 'default-avatar.png'}" 
                         alt="${activity.username}" class="activity-avatar">
                    <div class="activity-content">
                        <div>
                            <span class="activity-username">${activity.username}</span>
                            avaliou
                            <strong>${series.name}</strong>
                        </div>
                        <div class="activity-text">
                            ${'★'.repeat(Math.round(activity.rating))}${'☆'.repeat(5 - Math.round(activity.rating))}
                            ${activity.review ? ` - "${activity.review.substring(0, 100)}${activity.review.length > 100 ? '...' : ''}"` : ''}
                        </div>
                        <div class="activity-date">
                            ${new Date(activity.created_at).toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                `;
                
                container.appendChild(activityItem);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar atividades</p>';
    }
}
