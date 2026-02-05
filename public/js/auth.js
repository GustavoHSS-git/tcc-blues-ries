// Autenticação e gerenciamento de sessão
let currentUser = null;

// Verificar sessão ao carregar a página
async function checkSession() {
    try {
        const data = await API.checkSession();
        if (data.authenticated) {
            currentUser = data.user;
            updateUIForLoggedInUser();
        }
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
    }
}

// Atualizar interface para usuário logado
function updateUIForLoggedInUser() {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userMenu').style.display = 'block';
    document.getElementById('profileLink').style.display = 'block';
    document.getElementById('headerUsername').textContent = currentUser.username;
    
    if (currentUser.avatar) {
        const avatarElement = document.getElementById('headerAvatar');
        
        // Verifica se é link do Cloudinary (http) ou arquivo local
        const avatarSrc = currentUser.avatar.startsWith('http') 
            ? currentUser.avatar 
            : `/uploads/${currentUser.avatar}`;
            
        avatarElement.src = avatarSrc;

        // Se a imagem não carregar por algum motivo, põe a padrão
        avatarElement.onerror = function() { 
            this.src = '/uploads/default-avatar.png';
            this.onerror = null;
        };
    }
}

// Atualizar interface para usuário deslogado
function updateUIForLoggedOutUser() {
    currentUser = null;
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userMenu').style.display = 'none';
    document.getElementById('profileLink').style.display = 'none';
}

// Toggle dropdown do usuário
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    
    if (!userMenu.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// Mostrar modal de login
function showLogin() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('loginError').classList.remove('active');
}

// Mostrar modal de registro
function showRegister() {
    document.getElementById('registerModal').classList.add('active');
    document.getElementById('registerError').classList.remove('active');
}

// Fechar modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Alternar entre modais
function switchToRegister() {
    closeModal('loginModal');
    showRegister();
}

function switchToLogin() {
    closeModal('registerModal');
    showLogin();
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const errorDiv = document.getElementById('loginError');

    try {
        const data = await API.login(email, password);
        
        // Dentro do handleLogin(event)
            if (data.success) {
            currentUser = {
            id: data.userId,
            username: data.username,
            avatar: data.avatar // Garanta que esta linha exista!
        };
    
            closeModal('loginModal');
            updateUIForLoggedInUser();
    

            // Recarregar página inicial
            if (window.location.hash === '#home' || !window.location.hash) {
                loadHomePage();
            }
        } else {
            errorDiv.textContent = data.error || 'Erro ao fazer login';
            errorDiv.classList.add('active');
        }
    } catch (error) {
        errorDiv.textContent = 'Erro ao conectar com o servidor';
        errorDiv.classList.add('active');
    }
}

// Handle register
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const username = form.username.value;
    const email = form.email.value;
    const password = form.password.value;
    const errorDiv = document.getElementById('registerError');

    try {
        const data = await API.register(username, email, password);
        
        if (data.success) {
            currentUser = {
                id: data.userId,
                username: data.username
            };
            
            closeModal('registerModal');
            updateUIForLoggedInUser();
            
            // Recarregar página inicial
            if (window.location.hash === '#home' || !window.location.hash) {
                loadHomePage();
            }
        } else {
            errorDiv.textContent = data.error || 'Erro ao criar conta';
            errorDiv.classList.add('active');
        }
    } catch (error) {
        errorDiv.textContent = 'Erro ao conectar com o servidor';
        errorDiv.classList.add('active');
    }
}

// Logout
async function logout() {
    try {
        await API.logout();
        updateUIForLoggedOutUser();
        
        // Redirecionar para home
        window.location.hash = '#home';
        loadHomePage();
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Fechar modais ao clicar fora
window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};
