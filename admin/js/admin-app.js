class CampusEatsAdmin {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    checkAdminAuth() {
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (!adminLoggedIn) {
            document.getElementById('adminLogin').classList.remove('hidden');
            document.getElementById('adminDashboard').classList.add('hidden');
        } else {
            document.getElementById('adminLogin').classList.add('hidden');
            document.getElementById('adminDashboard').classList.remove('hidden');
        }
    }

    setupEventListeners() {
        // Admin login form
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('adminLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        if (email === 'admin@campuseats.com' && password === 'admin123') {
            localStorage.setItem('adminLoggedIn', 'true');
            this.checkAdminAuth();
            this.showNotification('Admin login successful!', 'success');
        } else {
            this.showNotification('Invalid admin credentials.', 'error');
        }
    }

    handleLogout() {
        localStorage.removeItem('adminLoggedIn');
        window.location.reload();
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        const activeTab = document.getElementById(tabName);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    loadDashboardData() {
        this.updateStats();
        this.loadRecentActivity();
    }

    updateStats() {
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');

        const totalVendors = vendors.length;
        const pendingVendors = vendors.filter(v => v.status === 'pending').length;
        const totalOrders = orders.length;
        const activeReports = reports.filter(r => !r.resolved).length;

        this.updateElement('totalVendors', totalVendors);
        this.updateElement('pendingVendors', pendingVendors);
        this.updateElement('pendingVendorsCount', pendingVendors);
        this.updateElement('totalOrders', totalOrders);
        this.updateElement('totalReports', activeReports);
        this.updateElement('unresolvedReports', activeReports);
    }

    loadRecentActivity() {
        const activity = [
            { type: 'vendor', message: 'New vendor registration: Campus Kitchen', time: '2 minutes ago' },
            { type: 'order', message: 'New order #ORD-001 placed', time: '5 minutes ago' },
            { type: 'report', message: 'Product reported by student', time: '10 minutes ago' }
        ];

        const container = document.getElementById('recentActivity');
        if (container) {
            container.innerHTML = activity.map(item => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${this.getActivityIcon(item.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${item.message}</p>
                        <small>${item.time}</small>
                    </div>
                </div>
            `).join('');
        }
    }

    getActivityIcon(type) {
        const icons = {
            'vendor': 'store',
            'order': 'shopping-cart',
            'report': 'flag'
        };
        return icons[type] || 'bell';
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    showNotification(message, type = 'info') {
        // Use the notification system from main app
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize admin app
document.addEventListener('DOMContentLoaded', function() {
    window.adminApp = new CampusEatsAdmin();
});