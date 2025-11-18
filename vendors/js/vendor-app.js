class CampusEatsVendor {
    constructor() {
        this.currentVendor = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkVendorAuth();
        this.loadVendorDashboard();
    }

    setupEventListeners() {
        // Vendor login form
        const vendorLoginForm = document.getElementById('vendorLoginForm');
        if (vendorLoginForm) {
            vendorLoginForm.addEventListener('submit', (e) => this.handleVendorLogin(e));
        }

        // Vendor signup form
        const vendorSignupForm = document.getElementById('vendorSignupForm');
        if (vendorSignupForm) {
            vendorSignupForm.addEventListener('submit', (e) => this.handleVendorSignup(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('vendorLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    checkVendorAuth() {
        const vendorData = localStorage.getItem('currentVendor');
        if (vendorData) {
            this.currentVendor = JSON.parse(vendorData);
            document.getElementById('vendorLogin').classList.add('hidden');
            document.getElementById('vendorSignup').classList.add('hidden');
            document.getElementById('vendorDashboard').classList.remove('hidden');
            this.updateVendorUI();
        } else {
            document.getElementById('vendorLogin').classList.remove('hidden');
            document.getElementById('vendorDashboard').classList.add('hidden');
        }
    }

    handleVendorLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('vendorEmail').value;
        const password = document.getElementById('vendorPassword').value;

        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendor = vendors.find(v => v.email === email && v.password === password);

        if (vendor) {
            if (vendor.status === 'pending') {
                this.showNotification('Your account is pending approval from admin.', 'warning');
                return;
            }

            if (vendor.status === 'suspended') {
                this.showNotification('Your account has been suspended. Please contact admin.', 'error');
                return;
            }

            this.currentVendor = vendor;
            localStorage.setItem('currentVendor', JSON.stringify(vendor));
            this.checkVendorAuth();
            this.showNotification('Vendor login successful!', 'success');
        } else {
            this.showNotification('Invalid vendor email or password.', 'error');
        }
    }

    handleVendorSignup(e) {
        e.preventDefault();
        
        const businessName = document.getElementById('businessName').value;
        const vendorName = document.getElementById('vendorName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const phone = document.getElementById('vendorPhone').value;
        const categories = Array.from(document.getElementById('vendorCategories').selectedOptions)
            .map(option => option.value);
        const agreeTerms = document.getElementById('agreeTerms').checked;

        if (!businessName || !vendorName || !email || !password || !phone) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (!agreeTerms) {
            this.showNotification('Please agree to the terms and conditions', 'error');
            return;
        }

        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        
        if (vendors.find(v => v.email === email)) {
            this.showNotification('An account with this email already exists.', 'error');
            return;
        }

        const newVendor = {
            id: Date.now(),
            businessName,
            vendorName,
            email,
            password,
            phone,
            categories: categories.join(', '),
            status: 'pending',
            joinedAt: new Date().toISOString(),
            profileImage: '',
            rating: 0,
            totalOrders: 0,
            totalRevenue: 0
        };

        vendors.push(newVendor);
        localStorage.setItem('vendor_accounts', JSON.stringify(vendors));

        // Create admin notification
        const adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
        adminNotifications.push({
            id: Date.now(),
            type: 'vendor_signup',
            title: 'New Vendor Registration',
            message: `${businessName} has registered and is awaiting approval.`,
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));

        this.showNotification('Vendor account created successfully! Awaiting admin approval.', 'success');
        this.showVendorLogin();
    }

    updateVendorUI() {
        const vendorWelcome = document.getElementById('vendorWelcome');
        if (vendorWelcome && this.currentVendor) {
            vendorWelcome.textContent = `Welcome, ${this.currentVendor.businessName}!`;
        }
        
        this.updateVendorStats();
        this.updateNotificationCount();
    }

    updateVendorStats() {
        // Products count
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const vendorProducts = products.filter(p => p.vendorId === this.currentVendor.id && p.isAvailable);
        this.updateElement('vendorTotalProducts', vendorProducts.length);
        this.updateElement('productsCount', vendorProducts.length);

        // Orders count
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const vendorOrders = orders.filter(o => o.vendorId === this.currentVendor.id);
        this.updateElement('vendorTotalOrders', vendorOrders.length);
        this.updateElement('ordersCount', vendorOrders.filter(o => o.status === 'pending').length);

        // Revenue calculation
        const totalRevenue = vendorOrders.reduce((sum, order) => {
            const orderTotal = order.totalAmount || order.total || 
                (order.items ? order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) : 0);
            return sum + (orderTotal * 0.93); // 7% platform fee
        }, 0);
        this.updateElement('vendorTotalRevenue', `₦${Math.round(totalRevenue).toLocaleString()}`);

        // Unread messages
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const unreadMessages = messages.filter(msg => 
            msg.vendorId === this.currentVendor.id && 
            !msg.read && 
            msg.senderType === 'student'
        ).length;
        this.updateElement('vendorUnreadMessages', unreadMessages);
        this.updateElement('messagesCount', unreadMessages);

        this.loadRecentOrders();
        this.loadRecentNotifications();
    }

    loadRecentOrders() {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const vendorOrders = orders
            .filter(o => o.vendorId === this.currentVendor.id)
            .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
            .slice(0, 3);

        const container = document.getElementById('recentVendorOrders');
        if (!container) return;

        if (vendorOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <i class="fas fa-shopping-cart"></i>
                    <h4>No Orders Yet</h4>
                    <p>You haven't received any orders yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = vendorOrders.map(order => {
            const orderDate = order.createdAt || order.orderDate;
            const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString() : 'Recent';
            const orderTotal = order.totalAmount || order.total || 
                (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);

            return `
                <div class="order-preview-card" onclick="location.href='vendor-orders.html?order=${order.id}'">
                    <div class="order-preview-header">
                        <strong>Order #${order.id}</strong>
                        <span class="order-status ${order.status}">${this.getStatusText(order.status)}</span>
                    </div>
                    <div class="order-preview-info">
                        <span>${order.studentName || 'Customer'}</span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="order-preview-total">
                        ₦${orderTotal.toLocaleString()}
                    </div>
                </div>
            `;
        }).join('');
    }

    loadRecentNotifications() {
        const notifications = JSON.parse(localStorage.getItem('vendor_notifications') || '[]');
        const vendorNotifications = notifications
            .filter(notification => notification.vendorId === this.currentVendor.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 3);

        const container = document.getElementById('recentVendorNotifications');
        if (!container) return;

        if (vendorNotifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: rgba(255,255,255,0.7);">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        container.innerHTML = vendorNotifications.map(notification => `
            <div class="notification-item ${!notification.read ? 'unread' : ''}">
                <div class="notification-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="notification-content">
                    <strong>${notification.title}</strong>
                    <p>${notification.message}</p>
                    <small>${this.formatTimeAgo(notification.timestamp)}</small>
                </div>
            </div>
        `).join('');
    }

    updateNotificationCount() {
        const notifications = JSON.parse(localStorage.getItem('vendor_notifications') || '[]');
        const unreadNotifications = notifications.filter(notification => 
            notification.vendorId === this.currentVendor.id && !notification.read
        ).length;

        this.updateElement('vendorNotificationCount', unreadNotifications);
    }

    handleLogout() {
        localStorage.removeItem('currentVendor');
        window.location.reload();
    }

    showVendorLogin() {
        document.getElementById('vendorSignup').classList.add('hidden');
        document.getElementById('vendorLogin').classList.remove('hidden');
    }

    showVendorSignup() {
        document.getElementById('vendorLogin').classList.add('hidden');
        document.getElementById('vendorSignup').classList.remove('hidden');
    }

    viewVendorNotifications() {
        // Will be implemented in notifications system
        alert('Notifications page coming soon!');
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
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

    showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Global functions
function showVendorLogin() {
    if (window.vendorApp) {
        window.vendorApp.showVendorLogin();
    }
}

function showVendorSignup() {
    if (window.vendorApp) {
        window.vendorApp.showVendorSignup();
    }
}

function viewVendorNotifications() {
    if (window.vendorApp) {
        window.vendorApp.viewVendorNotifications();
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        toggle.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

// Initialize vendor app
document.addEventListener('DOMContentLoaded', function() {
    window.vendorApp = new CampusEatsVendor();
});