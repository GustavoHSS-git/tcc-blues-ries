// Controle principal da aplicação

// Navegação entre páginas
function showPage(pageId) {
    window.scrollTo(0, 0); // <-- Reseta o scroll ao mudar de página
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Adicionar classe active à página selecionada
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
    
    // Atualizar links de navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
}

// Carregar página inicial
function loadHomePage() {
    showPage('homePage');
    document.querySelector('.nav-link[href="#home"]').classList.add('active');
    
    // Ajustar banner se autenticado
    updateHeroBanner();
    
    // Carregar conteúdo da Nuvem (TMDB)
    loadNewReleasesSection(); 
    loadAnimeSection();       
    loadPopularSeries();
    loadTopRatedSeries();
    
    // Carregar conteúdo do seu Banco (Atividade dos usuários)
    loadRecentActivity();
}

// Ajustar banner de acordo com estado de autenticação
function updateHeroBanner() {
    const hero = document.querySelector('.hero');
    const heroTitle = hero?.querySelector('h2');
    const heroSubtitle = hero?.querySelector('p');
    
    if (currentUser && heroTitle && heroSubtitle) {
        hero.classList.add('hero-compact');
        heroTitle.style.display = 'none';
        heroSubtitle.style.display = 'none';
    } else if (heroTitle && heroSubtitle) {
        hero?.classList.remove('hero-compact');
        heroTitle.style.display = 'block';
        heroSubtitle.style.display = 'block';
    }
}

// Carregar página de busca
function loadSearchPage() {
    showPage('searchPage');
    document.querySelector('.nav-link[href="#search"]').classList.add('active');
    
    // Focar no input de busca
    setTimeout(() => {
        document.getElementById('searchInput').focus();
    }, 100);
}

// Carregar página de perfil
function loadProfilePage(userId) {
    showPage('profilePage');
    document.querySelector('.nav-link[href="#profile"]')?.classList.add('active');
    
    loadUserProfile(userId);
}

// Carregar página de detalhes da série
function loadSeriesDetailPage(seriesId) {
    showPage('seriesDetailPage');
    showSeriesDetail(seriesId);
}

// Gerenciar rotas (hash navigation)
function handleRoute() {
    const hash = window.location.hash || '#home';
    
    if (hash === '#home' || hash === '') {
        loadHomePage();
    } else if (hash === '#search') {
        loadSearchPage();
    } else if (hash.startsWith('#profile')) {
        const userId = hash.split('/')[1];
        if (userId) {
            loadProfilePage(userId);
        } else if (currentUser) {
            window.location.hash = `#profile/${currentUser.id}`;
        } else {
            showLogin();
        }
    } else if (hash.startsWith('#series/')) {
        const seriesId = hash.split('/')[1];
        if (seriesId) {
            loadSeriesDetailPage(seriesId);
        }
    }
}

// Event listeners para navegação
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        
        // Se clicar em perfil sem estar logado
        if (href === '#profile' && !currentUser) {
            showLogin();
            return;
        }
        
        window.location.hash = href;
    });
});

// Listener para mudanças de hash
window.addEventListener('hashchange', handleRoute);

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sessão
    await checkSession();
    
    // Carregar rota inicial
    handleRoute();
    
    // Scroll suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href.length > 1) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
});

// Logo clica para home
document.querySelector('.logo').addEventListener('click', () => {
    window.location.hash = '#home';
});

// Prevenir envio de formulários padrão
document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.id === 'loginForm' || form.id === 'registerForm') {
        return; // Permitir para esses formulários específicos
    }
    e.preventDefault();
});
