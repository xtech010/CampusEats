class AdminVendorsManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.loadVendors();
        this.setupEventListeners();
    }

    checkAdminAuth() {
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (!adminLoggedIn) {
            window.location.href = 'admin.html';
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('vendorSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchVendors(e.target.value));
        }
    }

    loadVendors() {
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        this.displayVendors(vendors);
    }

    displayVendors(vendors) {
        const container = document.getElementById('vendorsList');
        if (!container) return;

        if (vendors.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-store-slash"></i>
                    <h4>No Vendors Found</h4>
                    <p>No vendor accounts have been created yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = vendors.map(vendor => `
            <div class="vendor-admin-card" onclick="adminVendorsManager.viewVendorDetails(${vendor.id})">
                <div class="vendor-admin-info">
                    <div class="vendor-avatar">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="vendor-details">
                        <h4>${vendor.businessName}</h4>
                        <p>${vendor.vendorName} • ${vendor.email}</p>
                        <div class="vendor-stats">
                            <span class="vendor-status ${vendor.status || 'pending'}">${vendor.status || 'pending'}</span>
                            <span class="vendor-join-date">Joined: ${new Date(vendor.joinedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div class="vendor-actions">
                    <button class="btn btn-sm ${vendor.status === 'approved' ? 'btn-outline' : 'btn-primary'}" 
                            onclick="event.stopPropagation(); adminVendorsManager.toggleVendorStatus(${vendor.id})">
                        ${vendor.status === 'approved' ? 'Disable' : 'Approve'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    searchVendors(query) {
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const filteredVendors = vendors.filter(vendor => 
            vendor.businessName.toLowerCase().includes(query.toLowerCase()) ||
            vendor.vendorName.toLowerCase().includes(query.toLowerCase()) ||
            vendor.email.toLowerCase().includes(query.toLowerCase()) ||
            vendor.id.toString().includes(query)
        );
        this.displayVendors(filteredVendors);
    }

    viewVendorDetails(vendorId) {
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendor = vendors.find(v => v.id === vendorId);
        
        if (!vendor) return;

        const modalContent = document.getElementById('vendorDetailsContent');
        modalContent.innerHTML = `
            <div class="vendor-detail-section">
                <h4>Business Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Business Name</label>
                        <span>${vendor.businessName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Vendor Name</label>
                        <span>${vendor.vendorName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email</label>
                        <span>${vendor.email}</span>
                    </div>
                    <div class="detail-item">
                        <label>Phone</label>
                        <span>${vendor.phone || 'Not provided'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        <span class="vendor-status ${vendor.status || 'pending'}">${vendor.status || 'pending'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Joined Date</label>
                        <span>${new Date(vendor.joinedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="vendor-detail-section">
                <h4>Account Details</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Vendor ID</label>
                        <span class="unique-id">VEN-${vendor.id.toString().padStart(4, '0')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Categories</label>
                        <span>${vendor.categories || 'Not specified'}</span>
                    </div>
                </div>
            </div>

            <div class="action-buttons" style="margin-top: 2rem;">
                <button class="btn ${vendor.status === 'approved' ? 'btn-outline' : 'btn-primary'}" 
                        onclick="adminVendorsManager.toggleVendorStatus(${vendor.id})">
                    ${vendor.status === 'approved' ? 'Disable Vendor' : 'Approve Vendor'}
                </button>
                <button class="btn btn-outline" onclick="adminVendorsManager.sendNotification(${vendor.id})">
                    <i class="fas fa-bell"></i> Send Notification
                </button>
            </div>
        `;

        this.showModal('vendorDetailsModal');
    }

    toggleVendorStatus(vendorId) {
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendorIndex = vendors.findIndex(v => v.id === vendorId);
        
        if (vendorIndex !== -1) {
            vendors[vendorIndex].status = vendors[vendorIndex].status === 'approved' ? 'pending' : 'approved';
            localStorage.setItem('vendor_accounts', JSON.stringify(vendors));
            
            this.loadVendors();
            this.showNotification(`Vendor ${vendors[vendorIndex].status === 'approved' ? 'approved' : 'disabled'} successfully`, 'success');
            
            // Close modal if open
            this.closeModal('vendorDetailsModal');
        }
    }

    sendNotification(vendorId) {
        const message = prompt('Enter notification message for vendor:');
        if (message) {
            // Store notification
            const notifications = JSON.parse(localStorage.getItem('vendor_notifications') || '[]');
            notifications.push({
                vendorId,
                message,
                type: 'admin',
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('vendor_notifications', JSON.stringify(notifications));
            
            this.showNotification('Notification sent to vendor', 'success');
        }
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

// Global functions
function logout() {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = 'admin.html';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.adminVendorsManager = new AdminVendorsManager();
});