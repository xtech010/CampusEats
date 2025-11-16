class CampusEatsAdmin {
    constructor() {
        this.adminCredentials = {
            email: 'admin@campuseats.com',
            password: 'admin123'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAdminAuth();
        this.startLiveUpdates();
    }

    setupEventListeners() {
        // Admin login
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('adminLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleAdminLogout());
        }

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target));
        });

        // Search functionality
        const searchInput = document.getElementById('adminSearch');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performAdminSearch();
                }
            });
        }
    }

    checkAdminAuth() {
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (isLoggedIn) {
            this.showDashboard();
            this.loadDashboardData();
        } else {
            this.showLogin();
        }
    }

    handleAdminLogin(e) {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        if (email === this.adminCredentials.email && password === this.adminCredentials.password) {
            localStorage.setItem('adminLoggedIn', 'true');
            this.showDashboard();
            this.loadDashboardData();
            this.showNotification('Admin login successful!', 'success');
        } else {
            this.showNotification('Invalid admin credentials.', 'error');
        }
    }

    handleAdminLogout() {
        localStorage.removeItem('adminLoggedIn');
        this.showLogin();
        this.showNotification('Logged out successfully!', 'success');
    }

    showLogin() {
        document.getElementById('adminLogin').classList.remove('hidden');
        document.getElementById('adminDashboard').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('adminLogin').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
    }

    switchTab(clickedTab) {
        // Remove active class from all
        document.querySelectorAll('.nav-btn').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active to clicked
        clickedTab.classList.add('active');
        const tabId = clickedTab.getAttribute('data-tab');
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
            tabContent.classList.add('active');
        }

        // Load tab-specific data
        this.loadTabData(tabId);
    }

    loadTabData(tabId) {
        switch(tabId) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'admin-vendors':
                this.loadVendorsData();
                break;
            case 'admin-orders':
                this.loadOrdersData();
                break;
            case 'admin-messages':
                this.loadMessagesData();
                break;
            case 'admin-reports':
                this.loadReportsData();
                break;
            case 'admin-products':
                this.loadProductsData();
                break;
            case 'admin-photos':
                this.loadPhotosData();
                break;
            case 'admin-reviews':
                this.loadReviewsData();
                break;
        }
    }

    async loadDashboardData() {
        try {
            // Load all data
            const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
            const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
            const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
            const reports = JSON.parse(localStorage.getItem('platform_reports') || '[]');
            const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
            
            // Calculate stats
            const approvedVendors = vendors.filter(vendor => vendor.status === 'approved').length;
            const pendingVendors = vendors.filter(vendor => vendor.status === 'pending').length;
            const totalRevenue = this.calculatePlatformRevenue(orders);
            const todayMessages = this.getTodayCount(messages);
            const todayOrders = this.getTodayCount(orders);
            const activeReports = reports.filter(report => report.status === 'pending').length;

            // Update dashboard stats
            this.updateElement('totalVendors', approvedVendors);
            this.updateElement('pendingVendors', pendingVendors);
            this.updateElement('totalRevenue', `₦${totalRevenue.toLocaleString()}`);
            this.updateElement('totalReports', activeReports);
            this.updateElement('totalMessages', todayMessages);
            this.updateElement('totalOrders', todayOrders);

            // Update nav badges
            this.updateNavBadges({
                vendors: pendingVendors,
                orders: todayOrders,
                messages: todayMessages,
                reports: activeReports
            });

            // Load recent activity
            this.loadRecentActivity();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    calculatePlatformRevenue(orders) {
        return orders.reduce((total, order) => {
            const orderTotal = order.totalAmount || order.total || 0;
            return total + (parseFloat(orderTotal) * 0.07); // 7% commission
        }, 0);
    }

    getTodayCount(items) {
        const today = new Date().toDateString();
        return items.filter(item => {
            const itemDate = new Date(item.createdAt || item.timestamp).toDateString();
            return itemDate === today;
        }).length;
    }

    updateNavBadges(counts) {
        this.updateElement('vendorsCount', counts.vendors > 0 ? counts.vendors : '0');
        this.updateElement('ordersCount', counts.orders > 0 ? counts.orders : '0');
        this.updateElement('messagesCount', counts.messages > 0 ? counts.messages : '0');
        this.updateElement('reportsCount', counts.reports > 0 ? counts.reports : '0');
    }

    loadRecentActivity() {
        const activities = this.getRecentActivities();
        const container = document.getElementById('recentAdminActivity');
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.7);">
                    <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 0.5rem;">
                <div style="width: 40px; height: 40px; background: rgba(255,215,0,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas ${activity.icon}" style="color: #FFD700;"></i>
                </div>
                <div style="flex: 1;">
                    <p style="margin: 0 0 0.25rem 0; color: #FFD700;">${activity.title}</p>
                    <small style="color: rgba(255,255,255,0.7);">${activity.description}</small>
                </div>
                <small style="color: rgba(255,255,255,0.6);">${this.formatTimeAgo(activity.timestamp)}</small>
            </div>
        `).join('');
    }

    getRecentActivities() {
        const activities = [];
        const now = new Date();
        
        // Get recent orders
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
        
        orders.forEach(order => {
            activities.push({
                icon: 'fa-shopping-cart',
                title: `New Order #${order.id}`,
                description: `From ${order.studentName} to ${order.vendorName}`,
                timestamp: order.createdAt
            });
        });

        // Get vendor applications
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]')
            .filter(v => v.status === 'pending')
            .slice(0, 2);
        
        vendors.forEach(vendor => {
            activities.push({
                icon: 'fa-store',
                title: 'New Vendor Application',
                description: `${vendor.businessName} applied`,
                timestamp: vendor.joinedAt
            });
        });

        // Get recent reports
        const reports = JSON.parse(localStorage.getItem('platform_reports') || '[]')
            .slice(0, 2);
        
        reports.forEach(report => {
            activities.push({
                icon: 'fa-flag',
                title: 'New Report',
                description: `Report on ${report.type}`,
                timestamp: report.timestamp
            });
        });

        return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
    }

    performAdminSearch() {
        const query = document.getElementById('adminSearch').value.trim().toLowerCase();
        if (!query) return;

        const results = this.searchAllData(query);
        this.displaySearchResults(results);
    }

    searchAllData(query) {
        const results = {
            orders: [],
            vendors: [],
            students: [],
            products: []
        };

        // Search orders
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        results.orders = orders.filter(order => 
            order.id.toLowerCase().includes(query) ||
            order.studentName.toLowerCase().includes(query) ||
            order.vendorName.toLowerCase().includes(query)
        );

        // Search vendors
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        results.vendors = vendors.filter(vendor =>
            vendor.businessName.toLowerCase().includes(query) ||
            vendor.vendorName.toLowerCase().includes(query) ||
            vendor.email.toLowerCase().includes(query)
        );

        // Search students
        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        results.students = students.filter(student =>
            student.name.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query) ||
            student.studentId.toLowerCase().includes(query)
        );

        // Search products
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        results.products = products.filter(product =>
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.vendorName.toLowerCase().includes(query)
        );

        return results;
    }

    displaySearchResults(results) {
        // This will be implemented in search results modal
        let resultText = `Search Results:\n\n`;
        
        if (results.orders.length > 0) {
            resultText += `Orders (${results.orders.length}):\n`;
            results.orders.slice(0, 3).forEach(order => {
                resultText += `• ${order.id} - ${order.studentName}\n`;
            });
            resultText += '\n';
        }

        if (results.vendors.length > 0) {
            resultText += `Vendors (${results.vendors.length}):\n`;
            results.vendors.slice(0, 3).forEach(vendor => {
                resultText += `• ${vendor.businessName} - ${vendor.vendorName}\n`;
            });
            resultText += '\n';
        }

        if (results.students.length > 0) {
            resultText += `Students (${results.students.length}):\n`;
            results.students.slice(0, 3).forEach(student => {
                resultText += `• ${student.name} - ${student.email}\n`;
            });
        }

        alert(resultText);
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return time.toLocaleDateString();
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    startLiveUpdates() {
        // Update dashboard every 60 seconds
        setInterval(() => {
            this.loadDashboardData();
        }, 60000);
    }

    showNotification(message, type = 'info') {
        // Use existing notification system
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }

    // Tab-specific data loading methods
    loadVendorsData() {
        // Will be implemented in admin-vendors.js
        console.log('Loading vendors data...');
    }

    loadOrdersData() {
        // Will be implemented in admin-orders.js
        console.log('Loading orders data...');
    }

    loadMessagesData() {
        // Will be implemented in admin-messages.js
        console.log('Loading messages data...');
    }

    loadReportsData() {
        // Will be implemented in admin-reports.js
        console.log('Loading reports data...');
    }

    loadProductsData() {
        // Will be implemented in admin-products.js
        console.log('Loading products data...');
    }

    loadPhotosData() {
        // Will be implemented in admin-photos.js
        console.log('Loading photos data...');
    }

    loadReviewsData() {
        // Will be implemented in admin-reviews.js
        console.log('Loading reviews data...');
    }
}

// Global functions
function switchToTab(tabName) {
    if (window.adminApp) {
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) window.adminApp.switchTab(tabBtn);
    }
}

function performAdminSearch() {
    if (window.adminApp) {
        window.adminApp.performAdminSearch();
    }
}

function viewAdminNotifications() {
    alert('Admin notifications system coming soon!');
}

function viewPlatformAnalytics() {
    alert('Platform analytics dashboard coming soon!');
}

function refreshAdminData() {
    if (window.adminApp) {
        window.adminApp.loadDashboardData();
        window.adminApp.showNotification('Data refreshed!', 'success');
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    const icon = toggle.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Initialize admin app
document.addEventListener('DOMContentLoaded', function() {
    window.adminApp = new CampusEatsAdmin();
});