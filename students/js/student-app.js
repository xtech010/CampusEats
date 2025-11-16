// Enhanced Student App with all new features
class CampusEatsStudent {
    constructor() {
        this.currentStudent = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkStudentAuth();
        this.loadStudentDashboard();
        this.startLiveUpdates();
    }

    setupEventListeners() {
        // User menu toggle
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userMenu = document.getElementById('userMenu');
        
        if (userMenuBtn && userMenu) {
            userMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                userMenu.classList.toggle('hidden');
                // Rotate chevron
                const chevron = userMenuBtn.querySelector('.fa-chevron-down');
                chevron.style.transform = userMenu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#userMenuBtn') && !e.target.closest('#userMenu')) {
                const userMenu = document.getElementById('userMenu');
                if (userMenu) userMenu.classList.add('hidden');
                
                // Reset chevron
                const chevron = document.querySelector('#userMenuBtn .fa-chevron-down');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
        });

        // Update current time
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 60000);
    }

    checkStudentAuth() {
        const studentData = localStorage.getItem('currentStudent');
        if (studentData) {
            this.currentStudent = JSON.parse(studentData);
            this.updateStudentUI();
        } else {
            window.location.href = '../index.html';
        }
    }

    updateStudentUI() {
        const userName = document.getElementById('userName');
        const userGreeting = document.getElementById('userGreeting');
        const userGreetingMain = document.getElementById('userGreetingMain');
        
        if (userName && this.currentStudent) {
            userName.textContent = this.currentStudent.name.split(' ')[0];
        }
        
        if (userGreeting && this.currentStudent) {
            userGreeting.textContent = `Hello, ${this.currentStudent.name.split(' ')[0]}!`;
        }
        
        if (userGreetingMain && this.currentStudent) {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
            userGreetingMain.textContent = `${greeting}, ${this.currentStudent.name.split(' ')[0]}!`;
        }
        
        this.updateNavBadges();
        this.updateCartCount();
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
    }

    updateNavBadges() {
        // Update orders count
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const studentOrders = orders.filter(order => order.studentId === this.currentStudent.id);
        const pendingOrders = studentOrders.filter(order => order.status === 'pending').length;
        
        const ordersCount = document.getElementById('navOrdersCount');
        if (ordersCount) {
            ordersCount.textContent = pendingOrders > 0 ? pendingOrders : '0';
            ordersCount.style.display = pendingOrders > 0 ? 'inline-block' : 'none';
        }

        // Update messages count
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const unreadMessages = messages.filter(msg => 
            msg.studentId === this.currentStudent.id && 
            !msg.read && 
            msg.senderType === 'vendor'
        ).length;
        
        const messagesCount = document.getElementById('navMessagesCount');
        if (messagesCount) {
            messagesCount.textContent = unreadMessages > 0 ? unreadMessages : '0';
            messagesCount.style.display = unreadMessages > 0 ? 'inline-block' : 'none';
        }

        // Update notification count
        this.updateNotificationCount();
    }

    updateNotificationCount() {
        const notifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
        const studentNotifications = notifications.filter(notification => 
            notification.studentId === this.currentStudent.id && !notification.read
        );
        
        const notificationCount = document.getElementById('notificationCount');
        if (notificationCount) {
            notificationCount.textContent = studentNotifications.length > 0 ? studentNotifications.length : '0';
            notificationCount.style.display = studentNotifications.length > 0 ? 'flex' : 'none';
        }
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('student_cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCount = document.getElementById('navCartCount');
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    }

    loadStudentDashboard() {
        this.loadStudentStats();
        this.loadRecentOrders();
        this.loadRecentNotifications();
        this.updateNavBadges();
    }

    loadStudentStats() {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const studentOrders = orders.filter(order => order.studentId === this.currentStudent.id);
        
        const totalOrders = studentOrders.length;
        const pendingOrders = studentOrders.filter(order => order.status === 'pending').length;
        const completedOrders = studentOrders.filter(order => order.status === 'completed').length;
        
        // Enhanced total spent calculation
        const totalSpent = studentOrders.reduce((sum, order) => {
            let orderTotal = order.totalAmount || order.total;
            if (!orderTotal && order.items) {
                orderTotal = order.items.reduce((itemSum, item) => {
                    return itemSum + (item.price * item.quantity);
                }, 0);
            }
            return sum + (parseFloat(orderTotal) || 0);
        }, 0);

        this.updateElement('studentTotalOrders', totalOrders);
        this.updateElement('studentPendingOrders', pendingOrders);
        this.updateElement('studentCompletedOrders', completedOrders);
        this.updateElement('studentTotalSpent', `₦${totalSpent.toLocaleString()}`);
    }

    loadRecentOrders() {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const studentOrders = orders
            .filter(order => order.studentId === this.currentStudent.id)
            .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
            .slice(0, 3);

        const container = document.getElementById('recentOrders');
        
        if (studentOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h4>No Orders Yet</h4>
                    <p>Start exploring our campus market!</p>
                    <a href="../index.html#campus-market" class="btn btn-sm">
                        <i class="fas fa-store"></i> Browse Products
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = studentOrders.map(order => {
            const orderDate = order.createdAt || order.orderDate;
            const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString() : 'Recent';
            
            const orderTotal = order.totalAmount || order.total || 
                (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);

            return `
                <div class="order-card" onclick="viewOrderDetails(${order.id})" style="cursor: pointer;">
                    <div class="order-header">
                        <div class="order-info">
                            <h4>Order #${order.id}</h4>
                            <span class="order-date">${formattedDate}</span>
                            <span class="order-vendor">
                                <i class="fas fa-store"></i> ${order.vendorName}
                            </span>
                        </div>
                        <div class="order-status ${order.status}">
                            ${this.getStatusText(order.status)}
                        </div>
                    </div>
                    <div class="order-details">
                        <div class="order-items">
                            ${order.items ? order.items.slice(0, 2).map(item => `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>₦${(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            `).join('') : ''}
                            ${order.items && order.items.length > 2 ? `
                                <div style="color: rgba(255,255,255,0.6); font-size: 0.8rem;">
                                    +${order.items.length - 2} more items
                                </div>
                            ` : ''}
                        </div>
                        <div class="order-total" style="text-align: right; margin-top: 0.5rem;">
                            <strong>Total: ₦${orderTotal.toLocaleString()}</strong>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadRecentNotifications() {
        const notifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
        const studentNotifications = notifications
            .filter(notification => notification.studentId === this.currentStudent.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        const container = document.getElementById('recentNotifications');
        
        if (studentNotifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.7);">
                    <i class="fas fa-bell-slash" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = studentNotifications.map(notification => `
            <div class="notification-item" style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 0.5rem; border-left: 3px solid #FFD700;">
                <i class="fas fa-bell" style="color: #FFD700; margin-top: 0.25rem;"></i>
                <div style="flex: 1;">
                    <h5 style="margin: 0 0 0.25rem 0; color: #FFD700;">${notification.title}</h5>
                    <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 0.9rem;">${notification.message}</p>
                    <small style="color: rgba(255,255,255,0.6);">${this.formatTimeAgo(notification.timestamp)}</small>
                </div>
                ${!notification.read ? `<span style="background: #e74c3c; width: 8px; height: 8px; border-radius: 50%;"></span>` : ''}
            </div>
        `).join('');
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

    startLiveUpdates() {
        // Update dashboard every 30 seconds
        setInterval(() => {
            this.loadStudentStats();
            this.updateNavBadges();
        }, 30000);
    }

    studentLogout() {
        localStorage.removeItem('currentStudent');
        window.location.href = '../index.html';
    }
}

// Global functions
function toggleMobileMenu() {
    const navMenu = document.querySelector('nav ul');
    if (navMenu) {
        navMenu.classList.toggle('show');
    }
}

function viewProfile() {
    window.location.href = 'student-profile.html';
}

function viewReviews() {
    window.location.href = 'student-reviews.html';
}

function viewNotifications() {
    // Will be implemented in notifications system
    alert('Notifications page coming soon!');
}

function viewOrderDetails(orderId) {
    window.location.href = `student-orders.html?order=${orderId}`;
}

// Close user menu when clicking outside
document.addEventListener('click', function(e) {
    const userMenu = document.getElementById('userMenu');
    const userMenuBtn = document.getElementById('userMenuBtn');
    
    if (userMenu && !userMenu.contains(e.target) && !userMenuBtn.contains(e.target)) {
        userMenu.classList.add('hidden');
        const chevron = document.querySelector('#userMenuBtn .fa-chevron-down');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
});

// Initialize student app
document.addEventListener('DOMContentLoaded', function() {
    window.studentApp = new CampusEatsStudent();
});