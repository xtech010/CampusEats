class AdminOrdersManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.loadOrders();
        this.setupEventListeners();
    }

    checkAdminAuth() {
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (!adminLoggedIn) {
            window.location.href = 'admin.html';
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchOrders(e.target.value));
        }
    }

    loadOrders() {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        // Sort by latest first
        orders.sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate));
        this.displayOrders(orders);
    }

    displayOrders(orders) {
        const container = document.getElementById('ordersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h4>No Orders Found</h4>
                    <p>No orders have been placed yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            const orderDate = order.createdAt || order.orderDate;
            const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString() : 'N/A';
            const orderTotal = order.totalAmount || order.total || 
                (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);

            return `
                <div class="order-admin-card" onclick="adminOrdersManager.viewOrderDetails('${order.id}')">
                    <div class="order-admin-header">
                        <div class="order-basic-info">
                            <h4>Order #ORD-${order.id.toString().padStart(4, '0')}</h4>
                            <p>${formattedDate} • ${order.vendorName}</p>
                            <p>Student: ${order.studentName || 'Unknown'}</p>
                        </div>
                        <div class="order-admin-meta">
                            <span class="order-status ${order.status}">${this.getStatusText(order.status)}</span>
                            <span class="order-total">₦${orderTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="order-items-preview">
                        ${order.items ? order.items.slice(0, 3).map(item => 
                            `<span class="order-item-tag">${item.name} x${item.quantity}</span>`
                        ).join('') : ''}
                        ${order.items && order.items.length > 3 ? 
                            `<span class="order-more-items">+${order.items.length - 3} more</span>` : ''
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    searchOrders(query) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const filteredOrders = orders.filter(order => 
            order.id.toString().includes(query) ||
            (order.studentName && order.studentName.toLowerCase().includes(query.toLowerCase())) ||
            (order.vendorName && order.vendorName.toLowerCase().includes(query.toLowerCase())) ||
            `ORD-${order.id.toString().padStart(4, '0')}`.includes(query)
        );
        this.displayOrders(filteredOrders);
    }

    filterOrders() {
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');

        let filteredOrders = orders;

        // Status filter
        if (statusFilter !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt || order.orderDate);
                switch (dateFilter) {
                    case 'today':
                        return orderDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return orderDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        return orderDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        this.displayOrders(filteredOrders);
    }

    viewOrderDetails(orderId) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const order = orders.find(o => o.id == orderId);
        
        if (!order) return;

        const orderDate = order.createdAt || order.orderDate;
        const formattedDate = orderDate ? new Date(orderDate).toLocaleString() : 'N/A';
        const orderTotal = order.totalAmount || order.total || 
            (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);

        const modalContent = document.getElementById('orderDetailsContent');
        modalContent.innerHTML = `
            <div class="order-detail-section">
                <h4>Order Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Order ID</label>
                        <span class="unique-id">ORD-${order.id.toString().padStart(4, '0')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        <span class="order-status ${order.status}">${this.getStatusText(order.status)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Date & Time</label>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="detail-item">
                        <label>Total Amount</label>
                        <span class="order-total">₦${orderTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Customer Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Student Name</label>
                        <span>${order.studentName || 'Unknown'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Student ID</label>
                        <span>${order.studentId || 'Not provided'}</span>
                    </div>
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Vendor Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Vendor Name</label>
                        <span>${order.vendorName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Vendor ID</label>
                        <span class="unique-id">VEN-${order.vendorId.toString().padStart(4, '0')}</span>
                    </div>
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Order Items</h4>
                <div class="items-list">
                    ${order.items ? order.items.map(item => `
                        <div class="item-detail">
                            <div class="item-info">
                                <strong>${item.name}</strong>
                                <span>Quantity: ${item.quantity}</span>
                                <small>₦${item.price.toLocaleString()} each</small>
                            </div>
                            <div class="item-price">
                                ₦${(item.price * item.quantity).toLocaleString()}
                            </div>
                        </div>
                    `).join('') : 'No items found'}
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Order Actions</h4>
                <div class="action-buttons">
                    <button class="btn btn-outline" onclick="adminOrdersManager.updateOrderStatus('${order.id}', 'completed')">
                        Mark Completed
                    </button>
                    <button class="btn btn-outline" onclick="adminOrdersManager.updateOrderStatus('${order.id}', 'cancelled')">
                        Cancel Order
                    </button>
                    <button class="btn" onclick="adminOrdersManager.contactParties('${order.id}')">
                        <i class="fas fa-comments"></i> Contact Parties
                    </button>
                </div>
            </div>
        `;

        this.showModal('orderDetailsModal');
    }

    updateOrderStatus(orderId, status) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id == orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = status;
            localStorage.setItem('student_orders', JSON.stringify(orders));
            
            this.showNotification(`Order status updated to ${status}`, 'success');
            this.loadOrders();
            this.closeModal('orderDetailsModal');
        }
    }

    contactParties(orderId) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const order = orders.find(o => o.id == orderId);
        
        if (order) {
            const message = prompt(`Enter message to send to both ${order.studentName} and ${order.vendorName}:`);
            if (message) {
                // Store notifications for both parties
                this.sendNotificationToStudent(order.studentId, message);
                this.sendNotificationToVendor(order.vendorId, message);
                this.showNotification('Message sent to both parties', 'success');
            }
        }
    }

    sendNotificationToStudent(studentId, message) {
        const notifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
        notifications.push({
            studentId,
            title: 'Admin Message',
            message,
            type: 'admin',
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('student_notifications', JSON.stringify(notifications));
    }

    sendNotificationToVendor(vendorId, message) {
        const notifications = JSON.parse(localStorage.getItem('vendor_notifications') || '[]');
        notifications.push({
            vendorId,
            title: 'Admin Message',
            message,
            type: 'admin',
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('vendor_notifications', JSON.stringify(notifications));
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

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.adminOrdersManager = new AdminOrdersManager();
});