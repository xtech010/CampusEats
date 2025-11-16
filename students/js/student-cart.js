// Student Cart Management
class StudentCart {
    constructor() {
        this.cart = [];
        this.currentStudent = null;
        this.init();
    }

    init() {
        this.checkStudentAuth();
        this.loadCart();
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    checkStudentAuth() {
        const studentData = localStorage.getItem('currentStudent');
        if (studentData) {
            this.currentStudent = JSON.parse(studentData);
        } else {
            window.location.href = 'index.html';
        }
    }

    setupEventListeners() {
        // Checkout form
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => this.handleCheckout(e));
        }

        // Delivery option changes
        document.querySelectorAll('input[name="deliveryOption"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateDeliveryInfo());
        });

        // Preferred time changes
        const preferredTime = document.getElementById('preferredTime');
        if (preferredTime) {
            preferredTime.addEventListener('change', () => this.toggleSpecificTime());
        }
    }

    loadCart() {
        this.cart = JSON.parse(localStorage.getItem('student_cart') || '[]');
        console.log('Cart loaded:', this.cart);
    }

    saveCart() {
        localStorage.setItem('student_cart', JSON.stringify(this.cart));
    }

    updateCartDisplay() {
        this.updateCartItems();
        this.updateCartSummary();
        this.updateCartStats();
    }

    updateCartItems() {
        const container = document.getElementById('cartItems');
        
        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; color: #FFD700;"></i>
                    <h3 style="color: #FFD700; margin-bottom: 0.5rem;">Your cart is empty</h3>
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 2rem;">Add some delicious items from our campus market!</p>
                    <a href="index.html#campus-market" class="btn">
                        <i class="fas fa-store"></i> Browse Products
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item-card" data-product-id="${item.productId}">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=Product'">
                </div>
                <div class="item-details">
                    <h4 class="item-name">${item.name}</h4>
                    <p class="item-vendor">Sold by: ${item.vendorName}</p>
                    <div class="item-price">₦${item.price.toLocaleString()}</div>
                </div>
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button class="btn btn-sm btn-outline" onclick="studentCart.updateQuantity(${item.productId}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline" onclick="studentCart.updateQuantity(${item.productId}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="studentCart.removeItem(${item.productId})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
                <div class="item-total">
                    ₦${(item.price * item.quantity).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = this.getDeliveryFee();
        const total = subtotal + deliveryFee;

        document.getElementById('subtotal').textContent = `₦${subtotal.toLocaleString()}`;
        document.getElementById('deliveryFee').textContent = `₦${deliveryFee.toLocaleString()}`;
        document.getElementById('summaryTotal').textContent = `₦${total.toLocaleString()}`;
        
        // Update modal total
        const modalTotal = document.getElementById('modalTotal');
        if (modalTotal) {
            modalTotal.textContent = `₦${total.toLocaleString()}`;
        }
    }

    updateCartStats() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const itemsCount = document.getElementById('cartItemsCount');
        const totalAmountEl = document.getElementById('cartTotalAmount');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (itemsCount) itemsCount.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
        if (totalAmountEl) totalAmountEl.textContent = `Total: ₦${totalAmount.toLocaleString()}`;
        if (checkoutBtn) checkoutBtn.disabled = this.cart.length === 0;
    }

    getDeliveryFee() {
        const selectedOption = document.querySelector('input[name="deliveryOption"]:checked');
        return selectedOption && selectedOption.value === 'meetup' ? 0 : 0; // Free delivery for now
    }

    updateDeliveryInfo() {
        this.updateCartSummary();
        this.toggleSpecificTime();
    }

    toggleSpecificTime() {
        const preferredTime = document.getElementById('preferredTime');
        const specificTimeGroup = document.getElementById('specificTimeGroup');
        
        if (preferredTime && specificTimeGroup) {
            if (preferredTime.value === 'specific') {
                specificTimeGroup.style.display = 'block';
            } else {
                specificTimeGroup.style.display = 'none';
            }
        }
    }

    updateQuantity(productId, newQuantity) {
        if (newQuantity < 1) {
            this.removeItem(productId);
            return;
        }

        const item = this.cart.find(item => item.productId === productId);
        if (item) {
            item.quantity = newQuantity;
            this.saveCart();
            this.updateCartDisplay();
            
            // Update main app cart count
            if (window.app) {
                window.app.updateCartCount();
            }
        }
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.saveCart();
        this.updateCartDisplay();
        
        // Update main app cart count
        if (window.app) {
            window.app.updateCartCount();
        }

        this.showNotification('Item removed from cart', 'success');
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartDisplay();
        
        if (window.app) {
            window.app.updateCartCount();
        }
    }

    showCheckoutModal() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }

        // Update order review in modal
        this.updateOrderReview();
        this.showModal('checkoutModal');
    }

    updateOrderReview() {
        const container = document.getElementById('orderReviewItems');
        if (!container) return;

        const itemsHTML = this.cart.map(item => `
            <div class="review-item">
                <span>${item.name} x${item.quantity}</span>
                <span>₦${(item.price * item.quantity).toLocaleString()}</span>
            </div>
        `).join('');

        container.innerHTML = itemsHTML;
    }

    async handleCheckout(e) {
        e.preventDefault();
        
        if (!this.currentStudent) {
            this.showNotification('Please login to place an order', 'error');
            return;
        }

        // Get form values
        const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked')?.value;
        const instructions = document.getElementById('deliveryInstructions').value;
        const preferredTime = document.getElementById('preferredTime').value;
        const specificTime = document.getElementById('specificTime').value;
        const meetingLocation = document.getElementById('meetingLocation').value;

        if (!deliveryOption) {
            this.showNotification('Please select a delivery option', 'error');
            return;
        }

        if (!meetingLocation) {
            this.showNotification('Please select a meeting location', 'error');
            return;
        }

        // Create order
        const order = {
            id: Date.now(),
            studentId: this.currentStudent.id,
            studentName: this.currentStudent.name,
            studentEmail: this.currentStudent.email,
            items: [...this.cart],
            subtotal: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            deliveryFee: this.getDeliveryFee(),
            totalAmount: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + this.getDeliveryFee(),
            deliveryOption,
            deliveryInstructions: instructions,
            preferredTime: preferredTime === 'specific' ? specificTime : preferredTime,
            meetingLocation,
            status: 'pending',
            createdAt: new Date().toISOString(),
            vendorId: this.cart[0].vendorId,
            vendorName: this.cart[0].vendorName
        };

        // Save order
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        orders.push(order);
        localStorage.setItem('student_orders', JSON.stringify(orders));

        // Create notification for vendor
        this.createVendorNotification(order);

        // Clear cart
        this.clearCart();

        // Close modal
        this.closeModal('checkoutModal');

        this.showNotification('🎉 Order placed successfully! The vendor will contact you soon.', 'success');

        // Redirect to orders page after delay
        setTimeout(() => {
            window.location.href = 'student-orders.html';
        }, 2000);
    }

    createVendorNotification(order) {
        const notifications = JSON.parse(localStorage.getItem('vendor_notifications') || '[]');
        
        const notification = {
            id: Date.now(),
            vendorId: order.vendorId,
            type: 'new_order',
            title: 'New Order Received',
            message: `${order.studentName} placed an order for ${order.items.length} item(s) - Total: ₦${order.totalAmount.toLocaleString()}`,
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
        // Use the main app's notification system if available
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-message">${message}</span>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
            `;
            document.body.appendChild(notification);

            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }
    }
}

// Global functions
function checkout() {
    if (window.studentCart) {
        window.studentCart.showCheckoutModal();
    }
}

function closeModal(modalId) {
    if (window.studentCart) {
        window.studentCart.closeModal(modalId);
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('nav ul');
    if (navMenu) {
        navMenu.classList.toggle('show');
    }
}

// Initialize cart
document.addEventListener('DOMContentLoaded', function() {
    window.studentCart = new StudentCart();
});