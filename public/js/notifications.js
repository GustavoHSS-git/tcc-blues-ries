// Sistema de Notificações Toast Elegante

/**
 * Exibir notificação toast
 * @param {string} message - Mensagem principal
 * @param {string} type - Tipo: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duração em ms (0 = manual)
 * @param {string} title - Título opcional
 */
function showNotification(message, type = 'info', duration = 4000, title = '') {
    const container = document.getElementById('notificationContainer');
    
    if (!container) return;

    // Mapear tipos para títulos padrão se não fornecido
    const titles = {
        success: '✓ Sucesso',
        error: '✗ Erro',
        info: 'ℹ Informação',
        warning: '⚠ Aviso'
    };

    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>',
        info: '<i class="fas fa-info-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>'
    };

    const finalTitle = title || titles[type] || 'Notificação';
    const icon = icons[type] || icons.info;

    // Criar elemento da notificação
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${finalTitle}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="closeToast(this.parentElement)">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // Auto-remover após duração
    if (duration > 0) {
        setTimeout(() => {
            closeToast(toast);
        }, duration);
    }

    return toast;
}

/**
 * Fechar notificação com animação
 */
function closeToast(element) {
    element.classList.add('removing');
    setTimeout(() => {
        element.remove();
    }, 300);
}

// Atalhos para tipos específicos
function notifySuccess(message, title = 'Sucesso', duration = 4000) {
    return showNotification(message, 'success', duration, title);
}

function notifyError(message, title = 'Erro', duration = 5000) {
    return showNotification(message, 'error', duration, title);
}

function notifyInfo(message, title = 'Informação', duration = 4000) {
    return showNotification(message, 'info', duration, title);
}

function notifyWarning(message, title = 'Aviso', duration = 4000) {
    return showNotification(message, 'warning', duration, title);
}

// Notificação de carregamento (sem auto-fechar)
function notifyLoading(message, title = 'Carregando') {
    const container = document.getElementById('notificationContainer');
    
    if (!container) return null;

    const toast = document.createElement('div');
    toast.className = 'toast-notification info';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-spinner fa-spin"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);
    return toast;
}
