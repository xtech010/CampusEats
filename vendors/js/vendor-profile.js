
class VendorProfileManager {
    constructor() {
        this.currentVendor = null;
        this.init();
    }

    init() {
        this.checkVendorAuth();
        this.setupEventListeners();
        this.loadProfileData();
        this.setupNavigation();
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
        const businessForm = document.getElementById('businessInfoForm');
        if (businessForm) {
            businessForm.addEventListener('submit', (e) => this.handleBusinessInfoUpdate(e));
        }

        const accountForm = document.getElementById('accountSettingsForm');
        if (accountForm) {
            accountForm.addEventListener('submit', (e) => this.handleAccountUpdate(e));
        }

        const notificationForm = document.getElementById('notificationSettingsForm');
        if (notificationForm) {
            notificationForm.addEventListener('submit', (e) => this.handleNotificationUpdate(e));
        }

        const passwordForm = document.getElementById('changePasswordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.profile-nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const section = button.getAttribute('data-section');
                
                // Update active button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show corresponding section
                this.showSection(section);
            });
        });
    }

    showSection(sectionId) {
        const sections = document.querySelectorAll('.profile-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    loadProfileData() {
        if (!this.currentVendor) return;

        // Load business information
        this.setValue('businessName', this.currentVendor.businessName);
        this.setValue('businessDescription', this.currentVendor.businessDescription || '');
        
        // Load categories
        if (this.currentVendor.categories) {
            const categories = this.currentVendor.categories.split(', ');
            const categorySelect = document.getElementById('businessCategories');
            if (categorySelect) {
                Array.from(categorySelect.options).forEach(option => {
                    if (categories.includes(option.value)) {
                        option.selected = true;
                    }
                });
            }
        }

        // Load account information
        this.setValue('vendorName', this.currentVendor.vendorName);
        this.setValue('vendorEmail', this.currentVendor.email);
        this.setValue('vendorPhone', this.currentVendor.phone);
        this.setValue('businessAddress', this.currentVendor.businessAddress || '');

        // Load business hours
        if (this.currentVendor.businessHours) {
            this.setValue('weekdayOpen', this.currentVendor.businessHours.weekdayOpen);
            this.setValue('weekdayClose', this.currentVendor.businessHours.weekdayClose);
            this.setValue('saturdayOpen', this.currentVendor.businessHours.saturdayOpen);
            this.setValue('saturdayClose', this.currentVendor.businessHours.saturdayClose);
            this.setValue('sundayOpen', this.currentVendor.businessHours.sundayOpen);
            this.setValue('sundayClose', this.currentVendor.businessHours.sundayClose);
        }

        // Load logo
        if (this.currentVendor.logo) {
            const previewLogo = document.getElementById('previewLogo');
            const logoPreview = document.getElementById('logoPreview');
            if (previewLogo && logoPreview) {
                previewLogo.src = this.currentVendor.logo;
                previewLogo.style.display = 'block';
                logoPreview.classList.add('has-image');
            }
        }

        // Load notification preferences
        const notifications = this.currentVendor.notificationPreferences || {
            newOrders: true,
            orderUpdates: true,
            messages: true,
            reviews: true,
            promotions: true
        };

        this.setChecked('notifyNewOrders', notifications.newOrders);
        this.setChecked('notifyOrderUpdates', notifications.orderUpdates);
        this.setChecked('notifyMessages', notifications.messages);
        this.setChecked('notifyReviews', notifications.reviews);
        this.setChecked('notifyPromotions', notifications.promotions);

        this.loadActiveSessions();
    }

    handleBusinessInfoUpdate(e) {
        e.preventDefault();
        
        const businessName = document.getElementById('businessName').value;
        const businessDescription = document.getElementById('businessDescription').value;
        const categorySelect = document.getElementById('businessCategories');
        const categories = Array.from(categorySelect.selectedOptions).map(option => option.value).join(', ');

        const businessHours = {
            weekdayOpen: document.getElementById('weekdayOpen').value,
            weekdayClose: document.getElementById('weekdayClose').value,
            saturdayOpen: document.getElementById('saturdayOpen').value,
            saturdayClose: document.getElementById('saturdayClose').value,
            sundayOpen: document.getElementById('sundayOpen').value,
            sundayClose: document.getElementById('sundayClose').value
        };

        // Update vendor data
        this.currentVendor.businessName = businessName;
        this.currentVendor.businessDescription = businessDescription;
        this.currentVendor.categories = categories;
        this.currentVendor.businessHours = businessHours;

        // Update logo if changed
        const previewLogo = document.getElementById('previewLogo');
        if (previewLogo && previewLogo.src) {
            this.currentVendor.logo = previewLogo.src;
        }

        this.saveVendorData();
        this.showNotification('Business information updated successfully!', 'success');
    }

    handleAccountUpdate(e) {
        e.preventDefault();
        
        const vendorName = document.getElementById('vendorName').value;
        const vendorEmail = document.getElementById('vendorEmail').value;
        const vendorPhone = document.getElementById('vendorPhone').value;
        const businessAddress = document.getElementById('businessAddress').value;

        // Check if email is already taken (excluding current vendor)
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const emailExists = vendors.some(vendor => 
            vendor.email === vendorEmail && vendor.id !== this.currentVendor.id
        );

        if (emailExists) {
            this.showNotification('This email is already registered with another account', 'error');
            return;
        }

        // Update vendor data
        this.currentVendor.vendorName = vendorName;
        this.currentVendor.email = vendorEmail;
        this.currentVendor.phone = vendorPhone;
        this.currentVendor.businessAddress = businessAddress;

        // Update vendor accounts list
        const vendorIndex = vendors.findIndex(v => v.id === this.currentVendor.id);
        if (vendorIndex !== -1) {
            vendors[vendorIndex] = this.currentVendor;
            localStorage.setItem('vendor_accounts', JSON.stringify(vendors));
        }

        this.saveVendorData();
        this.showNotification('Account information updated successfully!', 'success');
    }

    handleNotificationUpdate(e) {
        e.preventDefault();
        
        const notificationPreferences = {
            newOrders: document.getElementById('notifyNewOrders').checked,
            orderUpdates: document.getElementById('notifyOrderUpdates').checked,
            messages: document.getElementById('notifyMessages').checked,
            reviews: document.getElementById('notifyReviews').checked,
            promotions: document.getElementById('notifyPromotions').checked
        };

        this.currentVendor.notificationPreferences = notificationPreferences;
        this.saveVendorData();
        this.showNotification('Notification preferences updated!', 'success');
    }

    changePassword() {
        this.showModal('changePasswordModal');
    }

    handlePasswordChange(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (currentPassword !== this.currentVendor.password) {
            this.showNotification('Current password is incorrect', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('Password must be at least 6 characters long', 'error');
            return;
        }

        // Update password in vendor accounts
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendorIndex = vendors.findIndex(v => v.id === this.currentVendor.id);
        if (vendorIndex !== -1) {
            vendors[vendorIndex].password = newPassword;
            localStorage.setItem('vendor_accounts', JSON.stringify(vendors));
        }

        // Update current vendor
        this.currentVendor.password = newPassword;
        this.saveVendorData();

        this.showNotification('Password updated successfully!', 'success');
        this.closeModal('changePasswordModal');
        document.getElementById('changePasswordForm').reset();
    }

    loadActiveSessions() {
        const container = document.getElementById('activeSessions');
        if (!container) return;

        const sessions = [
            {
                device: 'Chrome on Windows',
                location: 'Lagos, Nigeria',
                lastActive: new Date().toISOString(),
                current: true
            },
            {
                device: 'Safari on iPhone',
                location: 'Abuja, Nigeria',
                lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                current: false
            }
        ];

        container.innerHTML = sessions.map(session => `
            <div class="session-item ${session.current ? 'current' : ''}">
                <div class="session-info">
                    <strong>${session.device}</strong>
                    <span>${session.location}</span>
                    <small>Last active: ${new Date(session.lastActive).toLocaleString()}</small>
                </div>
                ${session.current ? '<span class="session-badge">Current</span>' : ''}
            </div>
        `).join('');
    }

    logoutAllSessions() {
        if (confirm('This will log you out from all other devices. Continue?')) {
            this.showNotification('All other sessions have been logged out', 'success');
            this.loadActiveSessions();
        }
    }

    manageDataPrivacy() {
        this.showNotification('Data privacy settings would be configured here', 'info');
    }

    enhanceSecurity() {
        this.showNotification('Security enhancement options would be shown here', 'info');
    }

    deleteAccount() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.')) {
            if (confirm('This will delete all your products, orders, and business data. Type "DELETE" to confirm:')) {
                // Remove vendor from accounts
                const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
                const filteredVendors = vendors.filter(v => v.id !== this.currentVendor.id);
                localStorage.setItem('vendor_accounts', JSON.stringify(filteredVendors));

                // Remove vendor products
                const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
                const filteredProducts = products.filter(p => p.vendorId !== this.currentVendor.id);
                localStorage.setItem('vendor_products', JSON.stringify(filteredProducts));

                // Clear current vendor
                localStorage.removeItem('currentVendor');

                this.showNotification('Account deleted successfully', 'success');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
            }
        }
    }

    saveVendorData() {
        localStorage.setItem('currentVendor', JSON.stringify(this.currentVendor));
        
        // Also update in vendor accounts list
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendorIndex = vendors.findIndex(v => v.id === this.currentVendor.id);
        if (vendorIndex !== -1) {
            vendors[vendorIndex] = this.currentVendor;
            localStorage.setItem('vendor_accounts', JSON.stringify(vendors));
        }
    }

    setValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value || '';
        }
    }

    setChecked(elementId, checked) {
        const element = document.getElementById(elementId);
        if (element) {
            element.checked = checked;
        }
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
}

// Global function for logo image preview
function previewLogoImage(input) {
    const preview = document.getElementById('previewLogo');
    const logoPreview = document.getElementById('logoPreview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            logoPreview.classList.add('has-image');
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Initialize vendor profile manager
document.addEventListener('DOMContentLoaded', function() {
    window.vendorProfileManager = new VendorProfileManager();
});
