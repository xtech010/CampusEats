// Student Orders Management
class StudentOrders {
    constructor() {
        this.orders = [];
        this.currentStudent = null;
        this.init();
    }

    init() {
        this.checkStudentAuth();
        this.loadOrders();
        this.setupEventListeners();
        this.checkUrlParams();
    }

    checkStudentAuth() {
        const studentData = localStorage.getItem('currentStudent');
        if (studentData) {
            this.currentStudent = JSON.parse(studentData);
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
        }
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.target.dataset.status;
                this.filterOrders(status);
                
                // Update active filter
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Close modal buttons
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('.modal').id;
                this.closeModal(modalId);
            });
        });

        // Confirm delivery arrangements
        const confirmBtn = document.getElementById('confirmDeliveryBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmDeliveryArrangements());
        }

        // Request vendor contact
        const contactBtn = document.getElementById('requestContactBtn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => this.requestVendorContact());
        }
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order');
        if (orderId) {
            this.viewOrderDetails(parseInt(orderId));
        }
    }

    loadOrders() {
        const allOrders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        this.orders = allOrders.filter(order => order.studentId === this.currentStudent.id)
                              .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate));
        
        this.displayOrders();
        this.updateOrderStats();
    }

    displayOrders(filterStatus = 'all') {
        const container = document.getElementById('ordersList');
        
        const filteredOrders = filterStatus === 'all' 
            ? this.orders 
            : this.orders.filter(order => order.status === filterStatus);

        if (filteredOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No ${filterStatus === 'all' ? 'Orders' : this.getStatusText(filterStatus) + ' Orders'} Found</h3>
                    <p>${filterStatus === 'all' ? 'You haven\'t placed any orders yet.' : `No ${filterStatus} orders found.`}</p>
                    ${filterStatus === 'all' ? 
                        '<a href="index.html#campus-market" class="btn">Browse Products</a>' : 
                        '<button class="btn btn-outline" onclick="studentOrders.filterOrders(\'all\')">View All Orders</button>'
                    }
                </div>
            `;
            return;
        }

        container.innerHTML = filteredOrders.map(order => {
            // FIXED: Proper date and total calculation
            const orderDate = order.createdAt || order.orderDate;
            const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString() : 'Recent';
            
            const orderTotal = order.totalAmount || order.total || 
                (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);

            return `
                <div class="order-card" data-order-id="${order.id}">
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
                            ${order.items ? order.items.slice(0, 3).map(item => `
                                <div class="order-item">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>₦${(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            `).join('') : ''}
                            ${order.items && order.items.length > 3 ? `
                                <div class="order-more-items">
                                    +${order.items.length - 3} more items
                                </div>
                            ` : ''}
                        </div>
                        <div class="order-total">
                            <strong>Total: ₦${orderTotal.toLocaleString()}</strong>
                        </div>
                    </div>

                    <div class="order-actions">
                        <button class="btn btn-sm btn-outline" onclick="studentOrders.viewOrderDetails(${order.id})">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        ${order.status === 'pending' || order.status === 'confirmed' ? `
                            <button class="btn btn-sm btn-outline" onclick="studentOrders.contactVendor(${order.id})">
                                <i class="fas fa-comments"></i> Message Vendor
                            </button>
                        ` : ''}
                        ${order.status === 'pending' ? `
                            <button class="btn btn-sm btn-danger" onclick="studentOrders.cancelOrder(${order.id})">
                                <i class="fas fa-times"></i> Cancel Order
                            </button>
                        ` : ''}
                        ${order.status === 'confirmed' ? `
                            <button class="btn btn-sm btn-success" onclick="studentOrders.arrangeDelivery(${order.id})">
                                <i class="fas fa-truck"></i> Arrange Delivery
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateOrderStats() {
        const totalOrders = this.orders.length;
        const pendingOrders = this.orders.filter(order => order.status === 'pending').length;
        const confirmedOrders = this.orders.filter(order => order.status === 'confirmed').length;
        const completedOrders = this.orders.filter(order => order.status === 'completed').length;

        // Update filter badges if they exist
        document.querySelectorAll('[data-status="all"] .filter-count').forEach(el => {
            el.textContent = totalOrders;
        });
        document.querySelectorAll('[data-status="pending"] .filter-count').forEach(el => {
            el.textContent = pendingOrders;
        });
        document.querySelectorAll('[data-status="confirmed"] .filter-count').forEach(el => {
            el.textContent = confirmedOrders;
        });
        document.querySelectorAll('[data-status="completed"] .filter-count').forEach(el => {
            el.textContent = completedOrders;
        });
    }

    filterOrders(status) {
        this.displayOrders(status);
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

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modalContent = document.getElementById('orderDetailsContent');
        
        // FIXED: Proper date and total calculation
        const orderDate = order.createdAt || order.orderDate;
        const formattedDate = orderDate ? new Date(orderDate).toLocaleString() : 'Recent';
        
        const orderTotal = order.totalAmount || order.total || 
            (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);

        modalContent.innerHTML = `
            <div class="order-detail-section">
                <h4><i class="fas fa-info-circle"></i> Order Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Order ID:</label>
                        <span>#${order.id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Order Date:</label>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status ${order.status}">${this.getStatusText(order.status)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Vendor:</label>
                        <span>${order.vendorName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Delivery Option:</label>
                        <span>${order.deliveryOption === 'meetup' ? '🏫 Campus Meetup' : '🚶 Vendor Pickup'}</span>
                    </div>
                    ${order.preferredTime ? `
                        <div class="detail-item">
                            <label>Preferred Time:</label>
                            <span>${this.getTimeDisplay(order.preferredTime)}</span>
                        </div>
                    ` : ''}
                    ${order.meetingLocation ? `
                        <div class="detail-item">
                            <label>Meeting Location:</label>
                            <span>${this.getLocationDisplay(order.meetingLocation)}</span>
                        </div>
                    ` : ''}
                    ${order.deliveryInstructions ? `
                        <div class="detail-item full-width">
                            <label>Delivery Instructions:</label>
                            <span>${order.deliveryInstructions}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="order-detail-section">
                <h4><i class="fas fa-shopping-bag"></i> Order Items</h4>
                <div class="items-list">
                    ${order.items ? order.items.map(item => `
                        <div class="item-detail">
                            <div class="item-info">
                                <strong>${item.name}</strong>
                                <span>Quantity: ${item.quantity}</span>
                                <small>₦${item.price.toLocaleString()} each</small>
                            </div>
                            <div class="item-price">₦${(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                    `).join('') : '<p>No items found</p>'}
                </div>
            </div>

            <div class="order-detail-section">
                <h4><i class="fas fa-receipt"></i> Payment Summary</h4>
                <div class="payment-summary">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>₦${order.subtotal?.toLocaleString() || orderTotal.toLocaleString()}</span>
                    </div>
                    <div class="summary-row">
                        <span>Delivery Fee:</span>
                        <span>₦${order.deliveryFee?.toLocaleString() || '0'}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total Amount:</span>
                        <span>₦${orderTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div class="order-actions">
                <button class="btn btn-outline" onclick="studentOrders.contactVendor(${order.id})">
                    <i class="fas fa-comments"></i> Message Vendor
                </button>
                ${order.status === 'pending' ? `
                    <button class="btn btn-danger" onclick="studentOrders.cancelOrder(${order.id})">
                        <i class="fas fa-times"></i> Cancel Order
                    </button>
                ` : ''}
                ${order.status === 'confirmed' ? `
                    <button class="btn btn-success" onclick="studentOrders.arrangeDelivery(${order.id})">
                        <i class="fas fa-truck"></i> Arrange Delivery
                    </button>
                ` : ''}
            </div>
        `;

        this.showModal('orderDetailsModal');
    }

    getTimeDisplay(timeSlot) {
        const timeMap = {
            'morning': '🌅 Morning (8AM - 12PM)',
            'afternoon': '☀️ Afternoon (12PM - 4PM)',
            'evening': '🌆 Evening (4PM - 8PM)',
            'specific': '⏰ Specific Time'
        };
        return timeMap[timeSlot] || timeSlot;
    }

    getLocationDisplay(location) {
        const locationMap = {
            'campus_gate': '🏛️ Main Campus Gate',
            'library': '📚 Library Entrance',
            'student_center': '🎯 Student Center',
            'hostel': '🏠 Hostel Reception',
            'specific': '📍 Specific Location'
        };
        return locationMap[location] || location;
    }

// In student-orders.js, replace the contactVendor function:
contactVendor(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    // Check if a message was already sent recently (within last 5 minutes)
    const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
    const conversationId = `vendor-${order.vendorId}-student-${this.currentStudent.id}`;
    
    const recentMessages = messages.filter(msg => 
        msg.conversationId === conversationId && 
        msg.senderType === 'student' &&
        (new Date() - new Date(msg.timestamp)) < 300000 // 5 minutes
    );

    // If no recent messages, create initial message
    if (recentMessages.length === 0) {
        const messageContent = `Hello! I just placed order #${order.id} and would like to discuss the details.`;
        
        const newMessage = {
            id: Date.now(),
            conversationId: conversationId,
            vendorId: order.vendorId,
            studentId: this.currentStudent.id,
            studentName: this.currentStudent.name,
            vendorName: order.vendorName,
            content: messageContent,
            senderType: 'student',
            timestamp: new Date().toISOString(),
            read: false,
            orderId: order.id
        };
        
        messages.push(newMessage);
        localStorage.setItem('vendor_messages', JSON.stringify(messages));
        
        this.showNotification('📩 Message sent! Redirecting to messages...', 'success');
    } else {
        this.showNotification('📩 Opening messages...', 'info');
    }
    
    // Always redirect to messages page
    setTimeout(() => {
        window.location.href = 'student-messages.html';
    }, 1000);
}

    showMessageSentModal(vendorName, orderId) {
        const modalContent = document.getElementById('vendorContactContent');
        modalContent.innerHTML = `
            <div class="contact-info">
                <div class="contact-header">
                    <h4><i class="fas fa-comments"></i> Message Sent!</h4>
                    <p>Your message has been sent to ${vendorName}</p>
                </div>
                
                <div class="contact-details">
                    <div class="contact-item success">
                        <i class="fas fa-check-circle"></i>
                        <div>
                            <strong>Message Delivered</strong>
                            <span>The vendor will respond to your message soon</span>
                        </div>
                    </div>
                    
                    <div class="contact-item">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <strong>Order Reference</strong>
                            <span>Order #${orderId}</span>
                        </div>
                    </div>
                    
                    <div class="contact-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <strong>Response Time</strong>
                            <span>Vendor typically responds within a few hours</span>
                        </div>
                    </div>
                </div>

                <div class="contact-notes">
                    <p><strong>💡 What happens next:</strong></p>
                    <ul>
                        <li>The vendor will see your message in their dashboard</li>
                        <li>You can continue the conversation when they respond</li>
                        <li>Check your messages regularly for updates</li>
                        <li>For urgent matters, use the phone contact option</li>
                    </ul>
                </div>

                <div class="contact-actions">
                    <button class="btn btn-outline" onclick="studentOrders.showVendorContact(${orderId})">
                        <i class="fas fa-phone"></i> Get Phone Number
                    </button>
                    <button class="btn" onclick="studentOrders.closeModal('vendorContactModal')">
                        <i class="fas fa-check"></i> Got It
                    </button>
                </div>
            </div>
        `;

        this.showModal('vendorContactModal');
    }

    showVendorContact(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendor = vendors.find(v => v.id === order.vendorId);
        
        if (vendor) {
            const modalContent = document.getElementById('vendorContactContent');
            modalContent.innerHTML = `
                <div class="contact-info">
                    <div class="contact-header">
                        <h4><i class="fas fa-store"></i> ${order.vendorName}</h4>
                        <p>Contact information for your order #${order.id}</p>
                    </div>
                    
                    <div class="contact-details">
                        <div class="contact-item">
                            <i class="fas fa-phone"></i>
                            <div>
                                <strong>Phone Number</strong>
                                <span>${vendor.phone || 'Not provided'}</span>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <i class="fas fa-envelope"></i>
                            <div>
                                <strong>Email Address</strong>
                                <span>${vendor.email || 'Not provided'}</span>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <i class="fas fa-user"></i>
                            <div>
                                <strong>Contact Person</strong>
                                <span>${vendor.vendorName || 'Vendor'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="contact-notes">
                        <p><strong>💡 Tips for contacting the vendor:</strong></p>
                        <ul>
                            <li>Mention your order number (#${order.id})</li>
                            <li>Be clear about your preferred delivery time</li>
                            <li>Confirm the meeting location</li>
                            <li>Keep the conversation professional</li>
                        </ul>
                    </div>

                    <div class="contact-actions">
                        <button class="btn" onclick="studentOrders.closeModal('vendorContactModal')">
                            <i class="fas fa-check"></i> Close
                        </button>
                    </div>
                </div>
            `;
        } else {
            this.showNotification('Vendor contact information not available.', 'error');
        }
    }

    arrangeDelivery(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modalContent = document.getElementById('deliveryArrangementsContent');
        modalContent.innerHTML = `
            <div class="delivery-arrangements">
                <div class="arrangement-header">
                    <h4><i class="fas fa-truck"></i> Arrange Delivery</h4>
                    <p>Set up delivery details for order #${order.id}</p>
                </div>

                <form id="deliveryArrangementsForm">
                    <div class="form-group">
                        <label>📦 Delivery Instructions</label>
                        <textarea 
                            id="deliveryInstructions" 
                            rows="3" 
                            placeholder="Any specific delivery instructions? (e.g., 'Leave at security desk', 'Call when arrived', 'Campus building location')"
                        >${order.deliveryInstructions || ''}</textarea>
                    </div>

                    <div class="form-grid">
                        <div class="form-group">
                            <label>🕐 Preferred Meeting Time</label>
                            <select id="preferredTime" required>
                                <option value="">Select Time</option>
                                <option value="morning" ${order.preferredTime === 'morning' ? 'selected' : ''}>Morning (8AM - 12PM)</option>
                                <option value="afternoon" ${order.preferredTime === 'afternoon' ? 'selected' : ''}>Afternoon (12PM - 4PM)</option>
                                <option value="evening" ${order.preferredTime === 'evening' ? 'selected' : ''}>Evening (4PM - 8PM)</option>
                                <option value="specific">Specific Time (Vendor will contact)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>📅 Preferred Meeting Date</label>
                            <input type="date" id="preferredDate" min="${new Date().toISOString().split('T')[0]}" value="${order.preferredDate || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>📍 Meeting Location</label>
                        <select id="meetingLocation" required>
                            <option value="">Select Location</option>
                            <option value="campus_gate" ${order.meetingLocation === 'campus_gate' ? 'selected' : ''}>Main Campus Gate</option>
                            <option value="library" ${order.meetingLocation === 'library' ? 'selected' : ''}>Library Entrance</option>
                            <option value="student_center" ${order.meetingLocation === 'student_center' ? 'selected' : ''}>Student Center</option>
                            <option value="hostel" ${order.meetingLocation === 'hostel' ? 'selected' : ''}>Hostel Reception</option>
                            <option value="specific">Specific Location (Specify in instructions)</option>
                        </select>
                    </div>

                    <div class="arrangement-actions">
                        <button type="button" class="btn btn-success" onclick="studentOrders.confirmDeliveryArrangements(${order.id})">
                            <i class="fas fa-check-circle"></i> Confirm Arrangements
                        </button>
                        <button type="button" class="btn btn-outline" onclick="studentOrders.requestVendorContact(${order.id})">
                            <i class="fas fa-phone"></i> Need to Discuss? Get Vendor Phone
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.showModal('deliveryArrangementsModal');
    }

    confirmDeliveryArrangements(orderId) {
        const instructions = document.getElementById('deliveryInstructions').value;
        const preferredTime = document.getElementById('preferredTime').value;
        const preferredDate = document.getElementById('preferredDate').value;
        const location = document.getElementById('meetingLocation').value;

        if (!preferredTime || !location) {
            this.showNotification('Please select both preferred time and meeting location', 'error');
            return;
        }

        // Update order with delivery arrangements
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].deliveryInstructions = instructions;
            orders[orderIndex].preferredTime = preferredTime;
            orders[orderIndex].preferredDate = preferredDate;
            orders[orderIndex].meetingLocation = location;
            orders[orderIndex].deliveryArranged = true;
            orders[orderIndex].deliveryArrangedAt = new Date().toISOString();
            
            localStorage.setItem('student_orders', JSON.stringify(orders));
            
            // Send automatic message to vendor about delivery arrangements
            this.sendDeliveryArrangementMessage(orderId);
            
            // Reload orders to reflect changes
            this.loadOrders();
            
            this.closeModal('deliveryArrangementsModal');
            this.showNotification('✅ Delivery arrangements confirmed! The vendor has been notified.', 'success');
        }
    }

    sendDeliveryArrangementMessage(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const conversationId = `vendor-${order.vendorId}-student-${this.currentStudent.id}`;
        
        const messageContent = `I've confirmed the delivery arrangements for order #${order.id}. ` +
            `Preferred time: ${this.getTimeDisplay(order.preferredTime)}, ` +
            `Location: ${this.getLocationDisplay(order.meetingLocation)}` +
            (order.deliveryInstructions ? `. Instructions: ${order.deliveryInstructions}` : '');
        
        const newMessage = {
            id: Date.now(),
            conversationId: conversationId,
            vendorId: order.vendorId,
            studentId: this.currentStudent.id,
            studentName: this.currentStudent.name,
            vendorName: order.vendorName,
            content: messageContent,
            senderType: 'student',
            timestamp: new Date().toISOString(),
            read: false,
            orderId: order.id,
            isSystemMessage: true
        };
        
        messages.push(newMessage);
        localStorage.setItem('vendor_messages', JSON.stringify(messages));
    }

    requestVendorContact(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendor = vendors.find(v => v.id === order.vendorId);
        
        if (vendor && vendor.phone) {
            this.showVendorContact(orderId);
        } else {
            this.showNotification('Vendor phone number not available.', 'error');
        }
    }

    cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;

        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = 'cancelled';
            orders[orderIndex].cancelledAt = new Date().toISOString();
            localStorage.setItem('student_orders', JSON.stringify(orders));
            
            // Create cancellation notification for vendor
            this.createCancellationNotification(orders[orderIndex]);
            
            // Send cancellation message
            this.sendCancellationMessage(orderId);
            
            // Reload orders
            this.loadOrders();
            this.closeModal('orderDetailsModal');
            
            this.showNotification('Order cancelled successfully', 'success');
        }
    }

    sendCancellationMessage(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const conversationId = `vendor-${order.vendorId}-student-${this.currentStudent.id}`;
        
        const messageContent = `I've cancelled order #${order.id}. Sorry for any inconvenience.`;
        
        const newMessage = {
            id: Date.now(),
            conversationId: conversationId,
            vendorId: order.vendorId,
            studentId: this.currentStudent.id,
            studentName: this.currentStudent.name,
            vendorName: order.vendorName,
            content: messageContent,
            senderType: 'student',
            timestamp: new Date().toISOString(),
            read: false,
            orderId: order.id,
            isCancellationNotice: true
        };
        
        messages.push(newMessage);
        localStorage.setItem('vendor_messages', JSON.stringify(messages));
    }

    createCancellationNotification(order) {
        const notifications = JSON.parse(localStorage.getItem('vendor_notifications') || '[]');
        
        const notification = {
            id: Date.now(),
            vendorId: order.vendorId,
            type: 'order_cancelled',
            title: 'Order Cancelled',
            message: `${order.studentName} cancelled order #${order.id}`,
            orderId: order.id,
            studentId: order.studentId,
            studentName: order.studentName,
            timestamp: new Date().toISOString(),
            read: false
        };

        notifications.push(notification);
        localStorage.setItem('vendor_notifications', JSON.stringify(notifications));
    }

    showModal(modalId) {
        document.getElementById(modalId)?.classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global functions
function closeModal(modalId) {
    if (window.studentOrders) {
        window.studentOrders.closeModal(modalId);
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('nav ul');
    if (navMenu) {
        navMenu.classList.toggle('show');
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        window.studentOrders.closeModal(e.target.id);
    }
});

// Initialize orders
document.addEventListener('DOMContentLoaded', function() {
    window.studentOrders = new StudentOrders();
});