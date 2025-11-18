class AdminProductsManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.loadProducts();
        this.setupEventListeners();
    }

    checkAdminAuth() {
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (!adminLoggedIn) {
            window.location.href = 'admin.html';
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchProducts(e.target.value));
        }
    }

    loadProducts() {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        // Sort by latest first
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        this.displayProducts(products);
    }

    displayProducts(products) {
        const container = document.getElementById('productsList');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h4>No Products</h4>
                    <p>No products have been added yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => {
            const status = product.adminStatus || 'pending';
            const reports = this.getProductReports(product.id);
            const reportCount = reports.length;

            return `
                <div class="product-admin-card ${status}" onclick="adminProductsManager.viewProductDetails(${product.id})">
                    <div class="product-admin-image">
                        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/100x100?text=Product'">
                    </div>
                    <div class="product-admin-info">
                        <div class="product-basic-info">
                            <h4>${product.name}</h4>
                            <p>${product.vendorName} • ${product.category}</p>
                            <p class="product-price">₦${product.price.toLocaleString()}</p>
                        </div>
                        <div class="product-admin-meta">
                            <span class="product-status ${status}">${this.getStatusText(status)}</span>
                            ${reportCount > 0 ? `<span class="report-badge">${reportCount} reports</span>` : ''}
                            <span class="product-date">${new Date(product.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="product-admin-actions">
                        ${status === 'pending' ? `
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); adminProductsManager.approveProduct(${product.id})">
                                Approve
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); adminProductsManager.showRejectionForm(${product.id})">
                                Reject
                            </button>
                        ` : status === 'active' ? `
                            <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); adminProductsManager.deactivateProduct(${product.id})">
                                Deactivate
                            </button>
                        ` : ''}
                        ${reportCount > 0 ? `
                            <button class="btn btn-sm" onclick="event.stopPropagation(); adminProductsManager.viewReports(${product.id})">
                                View Reports
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    searchProducts(query) {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.vendorName.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );
        this.displayProducts(filteredProducts);
    }

    filterProducts() {
        const statusFilter = document.getElementById('statusFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');

        let filteredProducts = products;

        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'reported') {
                filteredProducts = filteredProducts.filter(product => 
                    this.getProductReports(product.id).length > 0
                );
            } else {
                filteredProducts = filteredProducts.filter(product => 
                    (product.adminStatus || 'pending') === statusFilter
                );
            }
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filteredProducts = filteredProducts.filter(product => 
                product.category === categoryFilter
            );
        }

        this.displayProducts(filteredProducts);
    }

    viewProductDetails(productId) {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const product = products.find(p => p.id === productId);
        
        if (!product) return;

        const reports = this.getProductReports(productId);
        const status = product.adminStatus || 'pending';

        const modalContent = document.getElementById('productDetailsContent');
        modalContent.innerHTML = `
            <div class="product-detail-section">
                <div class="product-detail-header">
                    <div class="product-detail-image">
                        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Product'">
                    </div>
                    <div class="product-detail-basic">
                        <h3>${product.name}</h3>
                        <p class="product-category">${product.category}</p>
                        <p class="product-price-large">₦${product.price.toLocaleString()}</p>
                        <div class="product-status-display ${status}">
                            Status: ${this.getStatusText(status)}
                        </div>
                    </div>
                </div>
            </div>

            <div class="product-detail-section">
                <h4>Product Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Description</label>
                        <p>${product.description}</p>
                    </div>
                    <div class="detail-item">
                        <label>Vendor</label>
                        <span>${product.vendorName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Vendor ID</label>
                        <span class="unique-id">VEN-${product.vendorId.toString().padStart(4, '0')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Created Date</label>
                        <span>${new Date(product.createdAt).toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Availability</label>
                        <span>${product.isAvailable ? 'Available' : 'Not Available'}</span>
                    </div>
                </div>
            </div>

            ${reports.length > 0 ? `
            <div class="product-detail-section">
                <h4>Product Reports (${reports.length})</h4>
                <div class="reports-list">
                    ${reports.map(report => `
                        <div class="report-item">
                            <div class="report-header">
                                <strong>${report.reporterName}</strong>
                                <span class="report-reason">${report.reason}</span>
                                <small>${new Date(report.timestamp).toLocaleDateString()}</small>
                            </div>
                            <p class="report-description">${report.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="product-detail-section">
                <h4>Moderation Actions</h4>
                <div class="action-buttons">
                    ${status === 'pending' ? `
                        <button class="btn btn-primary" onclick="adminProductsManager.approveProduct(${product.id})">
                            <i class="fas fa-check"></i> Approve Product
                        </button>
                        <button class="btn btn-outline" onclick="adminProductsManager.showRejectionForm(${product.id})">
                            <i class="fas fa-times"></i> Reject Product
                        </button>
                    ` : status === 'active' ? `
                        <button class="btn btn-outline" onclick="adminProductsManager.deactivateProduct(${product.id})">
                            <i class="fas fa-pause"></i> Deactivate Product
                        </button>
                    ` : status === 'rejected' ? `
                        <button class="btn btn-primary" onclick="adminProductsManager.approveProduct(${product.id})">
                            <i class="fas fa-redo"></i> Re-approve Product
                        </button>
                    ` : ''}
                    
                    <button class="btn" onclick="adminProductsManager.contactVendor(${product.vendorId})">
                        <i class="fas fa-envelope"></i> Contact Vendor
                    </button>
                </div>
            </div>
        `;

        this.showModal('productDetailsModal');
    }

    approveProduct(productId) {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            products[productIndex].adminStatus = 'active';
            products[productIndex].isAvailable = true;
            localStorage.setItem('vendor_products', JSON.stringify(products));
            
            this.sendNotificationToVendor(products[productIndex].vendorId, 
                `Your product "${products[productIndex].name}" has been approved and is now live on CampusEats.`);
            
            this.showNotification('Product approved successfully', 'success');
            this.loadProducts();
            this.closeModal('productDetailsModal');
        }
    }

    showRejectionForm(productId) {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const product = products.find(p => p.id === productId);
        
        if (!product) return;

        const rejectionContent = document.getElementById('rejectionContent');
        rejectionContent.innerHTML = `
            <h4>Reject Product: ${product.name}</h4>
            <div class="form-group">
                <label>Rejection Reason</label>
                <select id="rejectionReason">
                    <option value="inappropriate_content">Inappropriate Content</option>
                    <option value="poor_quality">Poor Quality Image/Description</option>
                    <option value="prohibited_item">Prohibited Item</option>
                    <option value="incorrect_category">Incorrect Category</option>
                    <option value="suspicious_activity">Suspicious Activity</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Additional Notes (Sent to Vendor)</label>
                <textarea id="rejectionNotes" rows="3" placeholder="Explain why the product was rejected..." required></textarea>
            </div>
            <div class="form-group">
                <label>Internal Notes (Not Shared)</label>
                <textarea id="internalNotes" rows="2" placeholder="Internal notes for admin..."></textarea>
            </div>
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="adminProductsManager.rejectProduct(${productId})">
                    Confirm Rejection
                </button>
            </div>
        `;

        this.closeModal('productDetailsModal');
        this.showModal('rejectionModal');
    }

    rejectProduct(productId) {
        const rejectionReason = document.getElementById('rejectionReason').value;
        const rejectionNotes = document.getElementById('rejectionNotes').value;
        const internalNotes = document.getElementById('internalNotes').value;
        
        if (!rejectionNotes) {
            this.showNotification('Please provide rejection notes for the vendor', 'error');
            return;
        }

        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            products[productIndex].adminStatus = 'rejected';
            products[productIndex].isAvailable = false;
            products[productIndex].rejectionReason = rejectionReason;
            products[productIndex].rejectionNotes = rejectionNotes;
            products[productIndex].rejectedAt = new Date().toISOString();
            
            localStorage.setItem('vendor_products', JSON.stringify(products));
            
            this.sendNotificationToVendor(products[productIndex].vendorId, 
                `Your product "${products[productIndex].name}" has been rejected. Reason: ${rejectionNotes}`);
            
            this.showNotification('Product rejected successfully', 'success');
            this.loadProducts();
            this.closeModal('rejectionModal');
        }
    }

    deactivateProduct(productId) {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            products[productIndex].isAvailable = false;
            localStorage.setItem('vendor_products', JSON.stringify(products));
            
            this.sendNotificationToVendor(products[productIndex].vendorId, 
                `Your product "${products[productIndex].name}" has been temporarily deactivated by admin.`);
            
            this.showNotification('Product deactivated', 'info');
            this.loadProducts();
            this.closeModal('productDetailsModal');
        }
    }

    viewReports(productId) {
        const reports = this.getProductReports(productId);
        if (reports.length > 0) {
            alert(`This product has ${reports.length} reports. Check the product details for more information.`);
        }
    }

    contactVendor(vendorId) {
        const message = prompt('Enter message to send to vendor:');
        if (message) {
            this.sendNotificationToVendor(vendorId, message);
            this.showNotification('Message sent to vendor', 'success');
        }
    }

    getProductReports(productId) {
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        return reports.filter(report => 
            report.productId === productId && report.type === 'product'
        );
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
            'pending': 'Pending Review',
            'active': 'Active',
            'rejected': 'Rejected',
            'inactive': 'Inactive'
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
    window.adminProductsManager = new AdminProductsManager();
});