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
    container.innerHTML = '<div class="loading">Carregando perfil...</div>';
    
    try {
        const userData = await API.getUser(userId);
        const ratingsData = await API.getUserRatings(userId);
        
        if (!userData.user) {
            container.innerHTML = '<p class="placeholder-text">Usuário não encontrado</p>';
            return;
        }
        
        const user = userData.user;
        const stats = userData.stats;
        const isOwnProfile = currentUser && currentUser.id === parseInt(userId);
        
        // Avatar upload section (apenas para perfil próprio)
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
        
        // Bio edit section (apenas para perfil próprio)
        let bioSection = '';
        if (isOwnProfile) {
            bioSection = `
                <div style="margin-top: 1rem;">
                    <textarea id="bioEdit" placeholder="Escreva algo sobre você..." 
                              style="width: 100%; min-height: 80px; padding: 0.8rem; background: var(--bg-dark); 
                              border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); 
                              font-family: inherit; resize: vertical;">${user.bio || ''}</textarea>
                    <button class="btn btn-primary" style="margin-top: 0.5rem;" onclick="saveBio()">Salvar Bio</button>
                </div>
            `;
        } else if (user.bio) {
            bioSection = `<p class="profile-bio">${user.bio}</p>`;
        }
        
        container.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar-container" style="position: relative;">
                    <img src="/uploads/${user.avatar || 'default-avatar.png'}" alt="${user.username}" class="profile-avatar">
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
                            <div class="stat-value">${stats.avg_rating ? stats.avg_rating.toFixed(1) : '0.0'}</div>
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
        
        // Carregar séries avaliadas
        const ratingsContainer = document.getElementById('userRatings');
        ratingsContainer.innerHTML = '';
        
        if (ratingsData.ratings.length === 0) {
            ratingsContainer.innerHTML = '<p class="placeholder-text" style="grid-column: 1/-1;">Nenhuma série avaliada ainda</p>';
            return;
        }
        
        for (const rating of ratingsData.ratings) {
            try {
                const series = await TMDB_API.getSeriesDetails(rating.series_id);
                
                if (series) {
                    const card = document.createElement('div');
                    card.className = 'series-card';
                    card.onclick = () => showSeriesDetail(series.id);
                    
                    const posterUrl = TMDB_API.getImageUrl(series.poster_path);
                    
                    // Status badge
                    const statusColors = {
                        watching: '#00d4ff',
                        completed: '#00ff88',
                        plan_to_watch: '#ffd600',
                        dropped: '#ff4444'
                    };
                    
                    const statusLabels = {
                        watching: 'Assistindo',
                        completed: 'Completou',
                        plan_to_watch: 'Planeja',
                        dropped: 'Dropou'
                    };
                    
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
                                <span class="series-rating">⭐ ${rating.rating.toFixed(1)}</span>
                            </div>
                            ${rating.review ? `<p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem; 
                                 overflow: hidden; text-overflow: ellipsis; display: -webkit-box; 
                                 -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                "${rating.review}"
                            </p>` : ''}
                        </div>
                    `;
                    
                    ratingsContainer.appendChild(card);
                }
            } catch (error) {
                console.error('Erro ao carregar série:', error);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        container.innerHTML = '<p class="placeholder-text">Erro ao carregar perfil</p>';
    }
}

// Upload de avatar
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem');
        return;
    }
    
    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
    }
    
    try {
        const data = await API.uploadAvatar(file);
        
        if (data.success) {
            // Atualizar avatar na interface
            document.getElementById('headerAvatar').src = `/uploads/${data.avatar}`;
            currentUser.avatar = data.avatar;
            
            // Recarregar perfil
            if (currentUser) {
                loadUserProfile(currentUser.id);
            }
            
            alert('Avatar atualizado com sucesso!');
        } else {
            alert('Erro ao fazer upload do avatar');
        }
    } catch (error) {
        console.error('Erro ao fazer upload:', error);
        alert('Erro ao conectar com o servidor');
    }
}

// Salvar bio
async function saveBio() {
    const bio = document.getElementById('bioEdit').value;
    
    try {
        const data = await API.updateProfile(bio);
        
        if (data.success) {
            alert('Bio atualizada com sucesso!');
        } else {
            alert('Erro ao atualizar bio');
        }
    } catch (error) {
        console.error('Erro ao atualizar bio:', error);
        alert('Erro ao conectar com o servidor');
    }
}

async function updateProfileData() {
    const newUsername = document.getElementById('editUsername').value;
    const newBio = document.getElementById('editBio').value;

    try {
        const response = await fetch(`${APP_CONFIG.API_BASE}/user/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Se usar autenticação por token
            },
            body: JSON.stringify({ 
                username: newUsername, 
                bio: newBio 
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('Perfil atualizado!');
            location.reload(); // Recarrega para atualizar o header e o banco
        }
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
    }
}
