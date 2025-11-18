
class VendorOrdersManager {
    constructor() {
        this.currentVendor = null;
        this.allOrders = [];
        this.init();
    }

    init() {
        this.checkVendorAuth();
        this.setupEventListeners();
        this.loadOrders();
    }

    checkVendorAuth() {
        const vendorData = localStorage.getItem('currentVendor');
        if (vendorData) {
            this.currentVendor = JSON.parse(vendorData);
            this.updateVendorWelcome();
        } else {
            window.location.href = 'vendor-dashboard.html';
        }
    }

    updateVendorWelcome() {
        const vendorWelcome = document.getElementById('vendorWelcome');
        if (vendorWelcome && this.currentVendor) {
            vendorWelcome.textContent = this.currentVendor.businessName;
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
        this.allOrders = orders
            .filter(order => order.vendorId === this.currentVendor.id)
            .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate));
        
        this.updateOrderStats();
        this.displayOrders(this.allOrders);
    }

    updateOrderStats() {
        const today = new Date().toDateString();
        
        const pendingOrders = this.allOrders.filter(o => o.status === 'pending').length;
        const preparingOrders = this.allOrders.filter(o => o.status === 'preparing').length;
        const readyOrders = this.allOrders.filter(o => o.status === 'ready').length;
        const completedToday = this.allOrders.filter(o => 
            o.status === 'completed' && 
            new Date(o.completedAt || o.updatedAt).toDateString() === today
        ).length;

        this.updateElement('pendingOrdersCount', pendingOrders);
        this.updateElement('preparingOrdersCount', preparingOrders);
        this.updateElement('readyOrdersCount', readyOrders);
        this.updateElement('completedOrdersCount', completedToday);
    }

    displayOrders(orders) {
        const container = document.getElementById('ordersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h4>No Orders Found</h4>
                    <p>You haven't received any orders yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            const orderDate = order.createdAt || order.orderDate;
            const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString() : 'Recent';
            const orderTotal = order.totalAmount || order.total || 
                (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);

            return `
                <div class="order-vendor-card" onclick="vendorOrdersManager.viewOrderDetails(${order.id})">
                    <div class="order-vendor-header">
                        <div class="order-basic-info">
                            <h4>Order #${order.id}</h4>
                            <p>${order.studentName || 'Customer'} • ${formattedDate}</p>
                            <div class="order-items-preview">
                                ${order.items ? order.items.slice(0, 3).map(item => 
                                    `<span class="order-item-tag">${item.name} x${item.quantity}</span>`
                                ).join('') : ''}
                                ${order.items && order.items.length > 3 ? 
                                    `<span class="order-more-items">+${order.items.length - 3} more</span>` : ''
                                }
                            </div>
                        </div>
                        <div class="order-vendor-meta">
                            <span class="order-status ${order.status}">${this.getStatusText(order.status)}</span>
                            <span class="order-total">₦${orderTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="order-vendor-actions">
                        ${order.status === 'pending' ? `
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); vendorOrdersManager.updateOrderStatus(${order.id}, 'confirmed')">
                                Accept Order
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); vendorOrdersManager.updateOrderStatus(${order.id}, 'cancelled')">
                                Reject
                            </button>
                        ` : order.status === 'confirmed' ? `
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); vendorOrdersManager.updateOrderStatus(${order.id}, 'preparing')">
                                Start Preparing
                            </button>
                        ` : order.status === 'preparing' ? `
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); vendorOrdersManager.updateOrderStatus(${order.id}, 'ready')">
                                Mark Ready
                            </button>
                        ` : order.status === 'ready' ? `
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); vendorOrdersManager.updateOrderStatus(${order.id}, 'completed')">
                                Complete Order
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); vendorOrdersManager.contactStudent(${order.id})">
                            <i class="fas fa-comment"></i> Contact
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    searchOrders(query) {
        const filteredOrders = this.allOrders.filter(order => 
            order.id.toString().includes(query) ||
            (order.studentName && order.studentName.toLowerCase().includes(query.toLowerCase())) ||
            (order.items && order.items.some(item => 
                item.name.toLowerCase().includes(query.toLowerCase())
            ))
        );
        this.displayOrders(filteredOrders);
    }

    filterOrders(status = null) {
        const statusFilter = status || document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        let filteredOrders = this.allOrders;

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
        const order = this.allOrders.find(o => o.id == orderId);
        
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
                        <span class="unique-id">#${order.id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        <span class="order-status ${order.status}">${this.getStatusText(order.status)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Order Date</label>
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
                        <span>${order.studentName || 'Not provided'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Student ID</label>
                        <span>${order.studentId || 'Not provided'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Delivery Address</label>
                        <span>${order.deliveryAddress || 'Not specified'}</span>
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
                    ${order.status === 'pending' ? `
                        <button class="btn btn-primary" onclick="vendorOrdersManager.updateOrderStatus(${order.id}, 'confirmed')">
                            Accept Order
                        </button>
                        <button class="btn btn-outline" onclick="vendorOrdersManager.updateOrderStatus(${order.id}, 'cancelled')">
                            Reject Order
                        </button>
                    ` : order.status === 'confirmed' ? `
                        <button class="btn btn-primary" onclick="vendorOrdersManager.updateOrderStatus(${order.id}, 'preparing')">
                            Start Preparing
                        </button>
                    ` : order.status === 'preparing' ? `
                        <button class="btn btn-primary" onclick="vendorOrdersManager.updateOrderStatus(${order.id}, 'ready')">
                            Mark Ready
                        </button>
                    ` : order.status === 'ready' ? `
                        <button class="btn btn-primary" onclick="vendorOrdersManager.updateOrderStatus(${order.id}, 'completed')">
                            Complete Order
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        this.showModal('orderDetailsModal');
    }

    updateOrderStatus(orderId, newStatus) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id == orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            orders[orderIndex].updatedAt = new Date().toISOString();
            
            if (newStatus === 'completed') {
                orders[orderIndex].completedAt = new Date().toISOString();
            }

            localStorage.setItem('student_orders', JSON.stringify(orders));

            // Create notification for student
            const order = orders[orderIndex];
            const studentNotifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
            studentNotifications.push({
                id: Date.now(),
                studentId: order.studentId,
                type: 'order_update',
                title: 'Order Status Updated',
                message: `Your order #${order.id} has been ${newStatus}`,
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('student_notifications', JSON.stringify(studentNotifications));

            this.loadOrders();
            this.showNotification(`Order status updated to ${this.getStatusText(newStatus)}`, 'success');
            this.closeModal('orderDetailsModal');
        }
    }

    contactStudent(orderId) {
        const order = this.allOrders.find(o => o.id == orderId);
        if (!order) return;

        const modalContent = document.getElementById('contactStudentContent');
        modalContent.innerHTML = `
            <div class="contact-info">
                <div class="contact-header">
                    <h4>Contact Student</h4>
                    <p>Get in touch with ${order.studentName || 'the student'}</p>
                </div>
                
                <div class="contact-details">
                    <div class="contact-item">
                        <i class="fas fa-user"></i>
                        <div>
                            <strong>Student Name</strong>
                            <span>${order.studentName || 'Not provided'}</span>
                        </div>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-id-card"></i>
                        <div>
                            <strong>Student ID</strong>
                            <span>${order.studentId || 'Not provided'}</span>
                        </div>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <strong>Delivery Address</strong>
                            <span>${order.deliveryAddress || 'Not specified'}</span>
                        </div>
                    </div>
                </div>

                <div class="contact-notes">
                    <p>Contact Information:</p>
                    <ul>
                        <li>Use the messaging system to communicate with students</li>
                        <li>Always be professional and courteous</li>
                        <li>Respond to student inquiries promptly</li>
                    </ul>
                </div>

                <div class="contact-actions">
                    <button class="btn btn-primary" onclick="vendorOrdersManager.startChat(${order.id})">
                        <i class="fas fa-comments"></i> Send Message
                    </button>
                    <button class="btn btn-outline" onclick="closeModal('contactStudentModal')">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        this.showModal('contactStudentModal');
    }

    startChat(orderId) {
        const order = this.allOrders.find(o => o.id == orderId);
        if (!order) return;

        // Create or get conversation
        const conversations = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const existingConversation = conversations.find(conv => 
            conv.vendorId === this.currentVendor.id && conv.studentId === order.studentId
        );

        if (!existingConversation) {
            const newConversation = {
                id: Date.now(),
                vendorId: this.currentVendor.id,
                studentId: order.studentId,
                studentName: order.studentName,
                lastMessage: 'New conversation started',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                messages: []
            };
            conversations.push(newConversation);
            localStorage.setItem('vendor_messages', JSON.stringify(conversations));
        }

        this.closeModal('contactStudentModal');
        window.location.href = 'vendor-messages.html';
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'preparing': 'Preparing',
            'ready': 'Ready for Pickup',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// Initialize vendor orders manager
document.addEventListener('DOMContentLoaded', function() {
    window.vendorOrdersManager = new VendorOrdersManager();
});