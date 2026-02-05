// Gerenciamento de perfil do usuário

// Navegar para o perfil
function navigateToProfile() {
    if (currentUser) {
        window.location.hash = `#profile/${currentUser.id}`;
    }
}

// Carregar perfil do usuário
async function loadUserProfile(userId) {
    const container = document.getElementById('profileContent');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Carregando perfil...</div>';
    
    try {
        const userData = await API.getUser(userId);
        
        if (!userData || !userData.user) {
            container.innerHTML = '<p class="placeholder-text">Usuário não encontrado</p>';
            return;
        }
        
        const user = userData.user;
        const stats = userData.stats || { total_ratings: 0, completed_series: 0, avg_rating: 0 };
        const isOwnProfile = currentUser && currentUser.id === parseInt(userId);
        
        // --- LÓGICA CLOUDINARY AQUI ---
        const avatarUrl = (user.avatar && user.avatar.startsWith('http')) 
            ? user.avatar 
            : `/uploads/${user.avatar || 'default-avatar.png'}`;
        
        let avatarSection = '';
        if (isOwnProfile) {
            avatarSection = `
                <div style="position: absolute; bottom: 0; right: 0;">
                    <label for="avatarUpload" class="btn btn-primary" style="cursor: pointer; font-size: 0.9rem; padding: 0.4rem 0.8rem;">
                        📷 Alterar
                    </label>
                    <input type="file" id="avatarUpload" accept="image/*" style="display: none;" onchange="handleAvatarUpload(event)">
                </div>
            `;
        }
        
        let bioSection = isOwnProfile ? `
            <div style="margin-top: 1rem;">
                <textarea id="bioEdit" placeholder="Escreva algo sobre você..." 
                          style="width: 100%; min-height: 80px; padding: 0.8rem; background: var(--bg-dark); 
                          border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); 
                          font-family: inherit; resize: vertical;">${user.bio || ''}</textarea>
                <button class="btn btn-primary" style="margin-top: 0.5rem;" onclick="saveBio()">Salvar Bio</button>
            </div>
        ` : `<p class="profile-bio">${user.bio || 'Sem bio disponível.'}</p>`;
        
        container.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar-container" style="position: relative;">
                    <img src="${avatarUrl}" 
                         alt="${user.username}" class="profile-avatar"
                         onerror="this.src='/uploads/default-avatar.png'">
                    ${avatarSection}
                </div>
                <div class="profile-info">
                    <h2 class="profile-username">${user.username}</h2>
                    ${bioSection}
                    <div class="profile-stats">
                        <div class="stat-item">
                            <div class="stat-value">${stats.total_ratings || 0}</div>
                            <div class="stat-label">Avaliações</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.completed_series || 0}</div>
                            <div class="stat-label">Completadas</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${Number(stats.avg_rating || 0).toFixed(1)}</div>
                            <div class="stat-label">Média</div>
                        </div>
                    </div>
                </div>
            </div>
            <div style="margin-top: 3rem;">
                <h3 style="margin-bottom: 1.5rem;">Séries Avaliadas</h3>
                <div class="profile-ratings" id="userRatings">
                    <div class="loading">Carregando avaliações...</div>
                </div>
            </div>
        `;
        
        loadUserRatingsList(userId);

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar dados do perfil.</p>';
    }
}

// Função separada para as notas para evitar o erro de promise pendente
async function loadUserRatingsList(userId) {
    const ratingsContainer = document.getElementById('userRatings');
    if (!ratingsContainer) return;

    try {
        const ratingsData = await API.getUserRatings(userId);
        const ratings = (ratingsData && ratingsData.ratings) ? ratingsData.ratings : [];
        
        ratingsContainer.innerHTML = '';
        
        if (ratings.length === 0) {
            ratingsContainer.innerHTML = '<p class="placeholder-text" style="grid-column: 1/-1;">Nenhuma série avaliada ainda</p>';
            return;
        }
        
        for (const rating of ratings) {
            try {
                const series = await TMDB_API.getSeriesDetails(rating.series_id);
                if (series) {
                    const card = document.createElement('div');
                    card.className = 'series-card';
                    card.onclick = () => showSeriesDetail(series.id);
                    
                    const posterUrl = TMDB_API.getImageUrl(series.poster_path);
                    const statusLabels = { watching: 'Assistindo', completed: 'Completou', plan_to_watch: 'Planeja', dropped: 'Dropou' };
                    const statusColors = { watching: '#00d4ff', completed: '#00ff88', plan_to_watch: '#ffd600', dropped: '#ff4444' };
                    
                    card.innerHTML = `
                        <div style="position: relative;">
                            <img src="${posterUrl}" alt="${series.name}" class="series-card-poster"
                                 onerror="this.src='/uploads/default-poster.png'">
                            <div style="position: absolute; top: 0.5rem; right: 0.5rem; 
                                 background: ${statusColors[rating.status] || '#666'}; 
                                 color: white; padding: 0.3rem 0.6rem; border-radius: 6px; 
                                 font-size: 0.75rem; font-weight: 600;">
                                ${statusLabels[rating.status] || rating.status}
                            </div>
                        </div>
                        <div class="series-card-content">
                            <div class="series-card-title" title="${series.name}">${series.name}</div>
                            <div class="series-card-info">
                                <span>${new Date(rating.created_at).toLocaleDateString('pt-BR')}</span>
                                <span class="series-rating">⭐ ${Number(rating.rating).toFixed(1)}</span>
                            </div>
                        </div>
                    `;
                    ratingsContainer.appendChild(card);
                }
            } catch (e) { console.error("Erro ao carregar série na lista:", e); }
        }
    } catch (error) {
        ratingsContainer.innerHTML = '<p>Erro ao carregar avaliações.</p>';
    }
}

// Upload de avatar corrigido
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const data = await API.uploadAvatar(file);
        if (data.success) {
            alert('Avatar atualizado!');
            location.reload(); // Recarga limpa para atualizar todos os componentes
        }
    } catch (error) {
        alert('Erro no upload');
    }
}

// Salvar bio
async function saveBio() {
    const bio = document.getElementById('bioEdit').value;
    try {
        // Agora usamos o método PUT que criamos no servidor
        const response = await fetch('/api/user/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bio })
        });
        const data = await response.json();
        if (data.success) {
            alert('Bio atualizada com sucesso');
        }
    } catch (error) {
        alert('Erro ao salvar bio');
    }
}