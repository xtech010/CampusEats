// CampusEats Main Application
class CampusEatsApp {
    constructor() {
        this.currentUser = null;
        this.userType = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkUserAuth();
        this.loadCampusMarket();
        this.setupNavigation();
        console.log('CampusEats App Initialized');
    }

    setupEventListeners() {
        // Student login form
        const studentLoginForm = document.getElementById('studentLoginForm');
        if (studentLoginForm) {
            studentLoginForm.addEventListener('submit', (e) => this.handleStudentLogin(e));
        }

        // Vendor login form
        const vendorLoginForm = document.getElementById('vendorLoginForm');
        if (vendorLoginForm) {
            vendorLoginForm.addEventListener('submit', (e) => this.handleVendorLogin(e));
        }

        // Admin login form
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }

        // Student signup form
        const signupForm = document.getElementById('studentSignupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleStudentSignup(e));
        }

        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterProducts(category);
                
                // Update active filter
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    this.scrollToSection(href.substring(1));
                }
            });
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        console.log('All event listeners setup complete');
    }

    setupNavigation() {
        this.updateAuthSection();
    }

    checkUserAuth() {
        console.log('Checking user authentication...');
        
        const studentData = localStorage.getItem('currentStudent');
        const vendorData = localStorage.getItem('currentVendor');
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';

        if (studentData) {
            this.currentUser = JSON.parse(studentData);
            this.userType = 'student';
            console.log('Student user found:', this.currentUser.name);
        } else if (vendorData) {
            this.currentUser = JSON.parse(vendorData);
            this.userType = 'vendor';
            console.log('Vendor user found:', this.currentUser.businessName);
        } else if (adminLoggedIn) {
            this.userType = 'admin';
            this.currentUser = { name: 'Admin' };
            console.log('Admin user logged in');
        } else {
            console.log('No user logged in');
        }
        
        this.updateAuthSection();
    }

    updateAuthSection() {
        const authSection = document.getElementById('authSection');
        if (!authSection) {
            console.log('Auth section not found');
            return;
        }
        
        if (this.currentUser) {
            let userLinks = '';
            
            if (this.userType === 'student') {
                userLinks = `
                    <li class="user-menu-container">
                        <a href="#" class="nav-link user-toggle">
                            <i class="fas fa-user-circle"></i> ${this.currentUser.name}
                            <i class="fas fa-chevron-down"></i>
                        </a>
                        <div class="user-dropdown hidden">
                            <a href="student.html" class="dropdown-item">
                                <i class="fas fa-tachometer-alt"></i> Dashboard
                            </a>
                            <a href="student-cart.html" class="dropdown-item">
                                <i class="fas fa-shopping-cart"></i> Cart
                            </a>
                            <a href="student-orders.html" class="dropdown-item">
                                <i class="fas fa-history"></i> Orders
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="vendor-dashboard.html" class="dropdown-item">
                                <i class="fas fa-store"></i> Vendor Portal
                            </a>
                            <a href="admin.html" class="dropdown-item">
                                <i class="fas fa-shield-alt"></i> Admin Portal
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item" onclick="logout()">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </a>
                        </div>
                    </li>
                `;
            } else if (this.userType === 'vendor') {
                userLinks = `
                    <li class="user-menu-container">
                        <a href="#" class="nav-link user-toggle">
                            <i class="fas fa-store"></i> ${this.currentUser.businessName}
                            <i class="fas fa-chevron-down"></i>
                        </a>
                        <div class="user-dropdown hidden">
                            <a href="vendor-dashboard.html" class="dropdown-item">
                                <i class="fas fa-tachometer-alt"></i> Vendor Dashboard
                            </a>
                            <a href="student-cart.html" class="dropdown-item">
                                <i class="fas fa-shopping-cart"></i> Cart
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="student.html" class="dropdown-item">
                                <i class="fas fa-user-graduate"></i> Student Portal
                            </a>
                            <a href="admin.html" class="dropdown-item">
                                <i class="fas fa-shield-alt"></i> Admin Portal
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item" onclick="logout()">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </a>
                        </div>
                    </li>
                `;
            } else if (this.userType === 'admin') {
                userLinks = `
                    <li class="user-menu-container">
                        <a href="#" class="nav-link user-toggle">
                            <i class="fas fa-shield-alt"></i> Admin
                            <i class="fas fa-chevron-down"></i>
                        </a>
                        <div class="user-dropdown hidden">
                            <a href="admin.html" class="dropdown-item">
                                <i class="fas fa-tachometer-alt"></i> Admin Dashboard
                            </a>
                            <a href="student-cart.html" class="dropdown-item">
                                <i class="fas fa-shopping-cart"></i> Cart
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="student.html" class="dropdown-item">
                                <i class="fas fa-user-graduate"></i> Student Portal
                            </a>
                            <a href="vendor-dashboard.html" class="dropdown-item">
                                <i class="fas fa-store"></i> Vendor Portal
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item" onclick="logout()">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </a>
                        </div>
                    </li>
                `;
            }
            
            authSection.innerHTML = userLinks;
            this.setupUserDropdown();
            
        } else {
            authSection.innerHTML = `
                <div class="auth-buttons">
                    <button class="btn-auth btn-login" onclick="showLoginOptions()">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                    <a href="vendor-dashboard.html" class="btn-auth btn-vendor">
                        <i class="fas fa-store"></i> Sell on Campus
                    </a>
                </div>
            `;
        }
        
        this.updateCartCount();
        console.log('Auth section updated');
    }

    setupUserDropdown() {
        const userToggles = document.querySelectorAll('.user-toggle');
        userToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdown = toggle.nextElementSibling;
                dropdown.classList.toggle('hidden');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu-container')) {
                document.querySelectorAll('.user-dropdown').forEach(dropdown => {
                    dropdown.classList.add('hidden');
                });
            }
        });
        
        console.log('User dropdown setup complete');
    }

    handleStudentLogin(e) {
        e.preventDefault();
        console.log('Student login form submitted');
        
        const email = document.getElementById('studentEmail').value;
        const password = document.getElementById('studentPassword').value;

        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Check students
        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        const student = students.find(s => s.email === email && s.password === password);

        if (student) {
            this.currentUser = student;
            this.userType = 'student';
            localStorage.setItem('currentStudent', JSON.stringify(student));
            this.updateAuthSection();
            this.closeModal('loginModal');
            this.showNotification('Login successful! Welcome back!', 'success');
            this.loadCampusMarket();
            
            // Clear form
            document.getElementById('studentLoginForm').reset();
        } else {
            this.showNotification('Invalid email or password. Please try again.', 'error');
        }
    }

    handleVendorLogin(e) {
        e.preventDefault();
        console.log('Vendor login form submitted');
        
        const email = document.getElementById('vendorEmail').value;
        const password = document.getElementById('vendorPassword').value;

        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Check vendors
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendor = vendors.find(v => v.email === email && v.password === password);

        if (vendor) {
            this.currentUser = vendor;
            this.userType = 'vendor';
            localStorage.setItem('currentVendor', JSON.stringify(vendor));
            this.updateAuthSection();
            this.closeModal('loginModal');
            this.showNotification('Vendor login successful!', 'success');
            this.loadCampusMarket();
            
            // Clear form
            document.getElementById('vendorLoginForm').reset();
        } else {
            this.showNotification('Invalid vendor email or password.', 'error');
        }
    }

    handleAdminLogin(e) {
        e.preventDefault();
        console.log('Admin login form submitted');
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Check admin credentials
        if (email === 'admin@campuseats.com' && password === 'admin123') {
            this.userType = 'admin';
            this.currentUser = { name: 'Admin' };
            localStorage.setItem('adminLoggedIn', 'true');
            this.updateAuthSection();
            this.closeModal('loginModal');
            this.showNotification('Admin login successful!', 'success');
        } else {
            this.showNotification('Invalid admin credentials.', 'error');
        }
    }

    handleStudentSignup(e) {
        e.preventDefault();
        console.log('Signup form submitted');
        
        const name = document.getElementById('studentName').value;
        const email = document.getElementById('studentSignupEmail').value;
        const password = document.getElementById('studentSignupPassword').value;
        const studentId = document.getElementById('studentId').value;

        if (!name || !email || !password) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        
        if (students.find(s => s.email === email)) {
            this.showNotification('An account with this email already exists. Please login.', 'error');
            return;
        }
        
        const newStudent = {
            id: Date.now(),
            name,
            email,
            password,
            studentId,
            joinedAt: new Date().toISOString(),
            isVendor: false
        };
        
        students.push(newStudent);
        localStorage.setItem('student_accounts', JSON.stringify(students));
        
        this.currentUser = newStudent;
        this.userType = 'student';
        localStorage.setItem('currentStudent', JSON.stringify(newStudent));
        this.updateAuthSection();
        this.closeModal('studentSignupModal');
        this.showNotification('Account created successfully! Welcome to CampusEats!', 'success');
        this.loadCampusMarket();
        
        // Clear form
        document.getElementById('studentSignupForm').reset();
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('student_cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCounts = document.querySelectorAll('#cartCount, #navCartCount');
        cartCounts.forEach(element => {
            if (element) {
                element.textContent = totalItems;
            }
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            const activeLink = document.querySelector(`[href="#${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }

    loadCampusMarket() {
        console.log('Loading campus market...');
        
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const approvedVendors = vendors.filter(v => v.status === 'approved' || !v.status);
        
        const vendorsContainer = document.getElementById('campusMarketVendors');
        const productsContainer = document.getElementById('campusMarketProducts');
        
        // Load vendors
        if (vendorsContainer) {
            if (approvedVendors.length === 0) {
                vendorsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-store-slash"></i>
                        <h4>No Vendors Yet</h4>
                        <p>Be the first to start selling on campus!</p>
                        <a href="vendor-dashboard.html" class="btn btn-sm">Become a Vendor</a>
                    </div>
                `;
            } else {
                vendorsContainer.innerHTML = approvedVendors.map(vendor => `
                    <div class="vendor-card">
                        <div class="vendor-avatar">
                            <i class="fas fa-store"></i>
                        </div>
                        <div class="vendor-info">
                            <h4>${vendor.businessName}</h4>
                            <p class="vendor-category">${vendor.categories || 'General'}</p>
                            <div class="vendor-stats">
                                <span class="rating">⭐ 4.5</span>
                                <span class="products">${products.filter(p => p.vendorId === vendor.id).length} products</span>
                            </div>
                        </div>
                        <div class="vendor-actions">
                            <button class="btn btn-sm btn-outline" onclick="viewVendorProducts(${vendor.id})">
                                View Products
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Load products
        if (productsContainer) {
            const availableProducts = products.filter(p => p.isAvailable);
            if (availableProducts.length === 0) {
                productsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h4>No Products Available</h4>
                        <p>Check back soon for new products!</p>
                    </div>
                `;
            } else {
                productsContainer.innerHTML = availableProducts.map(product => `
                    <div class="product-card" data-category="${product.category}">
                        <div class="product-badge">${this.getCategoryIcon(product.category)} ${product.category}</div>
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Product+Image'">
                            <div class="product-overlay">
                                <button class="btn btn-sm quick-view" onclick="quickView(${product.id})">
                                    <i class="fas fa-eye"></i> Quick View
                                </button>
                            </div>
                        </div>
                        <div class="product-content">
                            <h4 class="product-title">${product.name}</h4>
                            <p class="product-description">${product.description}</p>
                            <div class="product-meta">
                                <span class="vendor"><i class="fas fa-store"></i> ${product.vendorName}</span>
                                <span class="delivery">🚚 Free Delivery</span>
                            </div>
                            <div class="product-footer">
                                <div class="product-price">
                                    <span class="price">₦${product.price?.toLocaleString() || '0'}</span>
                                </div>
                                <button class="btn btn-sm btn-primary add-to-cart" onclick="addToCart(${product.id})" ${!this.currentUser ? 'disabled' : ''}>
                                    <i class="fas fa-cart-plus"></i> ${!this.currentUser ? 'Login to Buy' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        console.log('Campus market loaded successfully');
    }

    getCategoryIcon(category) {
        const icons = {
            'food': '🍕',
            'drinks': '🥤',
            'snacks': '🍿',
            'desserts': '🍰',
            'gadgets': '📱',
            'stationery': '✏️'
        };
        return icons[category] || '📦';
    }

    filterProducts(category) {
        const products = document.querySelectorAll('.product-card');
        products.forEach(product => {
            if (category === 'all' || product.dataset.category === category) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
        
        this.showNotification(`Showing ${category === 'all' ? 'all' : category} products`, 'info');
    }

    sortProducts() {
        const sortBy = document.getElementById('sortProducts').value;
        const productsContainer = document.getElementById('campusMarketProducts');
        if (!productsContainer) return;

        const products = Array.from(productsContainer.children);

        products.sort((a, b) => {
            const priceA = parseInt(a.querySelector('.price').textContent.replace('₦', '').replace(/,/g, '') || '0');
            const priceB = parseInt(b.querySelector('.price').textContent.replace('₦', '').replace(/,/g, '') || '0');
            const nameA = a.querySelector('.product-title').textContent.toLowerCase();
            const nameB = b.querySelector('.product-title').textContent.toLowerCase();

            switch (sortBy) {
                case 'price-low':
                    return priceA - priceB;
                case 'price-high':
                    return priceB - priceA;
                case 'name':
                    return nameA.localeCompare(nameB);
                default:
                    return 0;
            }
        });

        products.forEach(product => productsContainer.appendChild(product));
    }

    showLoginOptions() {
        this.showModal('loginModal');
    }

    switchLoginType(type) {
        // Update active button
        document.querySelectorAll('.login-option-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
        
        // Show correct form
        document.querySelectorAll('.login-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${type}LoginForm`).classList.add('active');
    }

    showStudentSignup() {
        this.showModal('studentSignupModal');
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

        // Add notification styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--card-bg);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 15px 20px;
                    color: white;
                    z-index: 1000;
                    max-width: 400px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }
                .notification-success { border-left: 4px solid var(--success); }
                .notification-error { border-left: 4px solid var(--danger); }
                .notification-info { border-left: 4px solid var(--secondary); }
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 15px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: var(--secondary);
                    font-size: 18px;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(styles);
        }

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
function showLoginOptions() {
    if (window.app) {
        window.app.showLoginOptions();
    }
}

function switchLoginType(type) {
    if (window.app) {
        window.app.switchLoginType(type);
    }
}

function showStudentSignup() {
    if (window.app) {
        window.app.showStudentSignup();
    }
}

function closeModal(modalId) {
    if (window.app) {
        window.app.closeModal(modalId);
    }
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('show');
    }
}

function viewVendorProducts(vendorId) {
    const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
    const vendorProducts = products.filter(p => p.vendorId == vendorId && p.isAvailable);
    
    if (vendorProducts.length === 0) {
        if (window.app) {
            window.app.showNotification('This vendor has no products available yet.', 'info');
        }
        return;
    }
    
    const productsList = vendorProducts.map(p => 
        `• ${p.name} - ₦${p.price?.toLocaleString() || '0'} (${p.category})`
    ).join('\n');
    
    if (window.app) {
        window.app.showNotification(
            `Products from this vendor:\n\n${productsList}\n\nScroll down to browse all products!`, 
            'info'
        );
    }
}

function quickView(productId) {
    const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
    const product = products.find(p => p.id == productId);
    
    if (product && window.app) {
        window.app.showNotification(
            `Quick View: ${product.name}\nPrice: ₦${product.price?.toLocaleString() || '0'}\nCategory: ${product.category}\nVendor: ${product.vendorName}\n\n${product.description}`,
            'info'
        );
    }
}

function addToCart(productId) {
    if (!window.app || !window.app.currentUser) {
        if (window.app) {
            window.app.showNotification('Please login to add items to cart.', 'error');
            window.app.showLoginOptions();
        }
        return;
    }
    
    const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
    const product = products.find(p => p.id == productId);
    
    if (!product) {
        if (window.app) {
            window.app.showNotification('Product not found.', 'error');
        }
        return;
    }

    if (!product.isAvailable) {
        if (window.app) {
            window.app.showNotification('This product is currently unavailable.', 'error');
        }
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('student_cart') || '[]');
    const existingItem = cart.find(item => item.productId == productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            vendorId: product.vendorId,
            vendorName: product.vendorName,
            image: product.image,
            category: product.category,
            quantity: 1
        });
    }
    
    localStorage.setItem('student_cart', JSON.stringify(cart));
    
    if (window.app) {
        window.app.updateCartCount();
        window.app.showNotification(`🎉 ${product.name} added to cart!`, 'success');
    }
}

function showComingSoonAlert() {
    if (window.app) {
        window.app.showNotification(
            '🚀 Kano City Restaurants Delivery Coming Soon!\n\nWe\'re working hard to bring your favorite Kano restaurants to campus. Stay tuned!', 
            'info'
        );
    }
}

function subscribeKanoUpdates() {
    const email = document.getElementById('kanoNotifyEmail').value;
    
    if (!email) {
        if (window.app) {
            window.app.showNotification('Please enter your email address', 'error');
        }
        return;
    }
    
    // Store email for notifications
    const updates = JSON.parse(localStorage.getItem('kano_updates') || '[]');
    if (!updates.includes(email)) {
        updates.push(email);
        localStorage.setItem('kano_updates', JSON.stringify(updates));
    }
    
    if (window.app) {
        window.app.showNotification('🎉 Thanks! We\'ll notify you when Kano delivery launches!', 'success');
        document.getElementById('kanoNotifyEmail').value = '';
    }
}

function logout() {
    localStorage.removeItem('currentStudent');
    localStorage.removeItem('currentVendor');
    localStorage.removeItem('adminLoggedIn');
    window.location.reload();
}

// Initialize sample data if none exists
function initializeSampleData() {
    // Sample students
    if (!localStorage.getItem('student_accounts')) {
        const sampleStudents = [
            {
                id: 1,
                name: "John Student",
                email: "student@example.com",
                password: "password123",
                studentId: "STU001",
                joinedAt: new Date().toISOString(),
                isVendor: false
            }
        ];
        localStorage.setItem('student_accounts', JSON.stringify(sampleStudents));
    }

    // Sample vendors
    if (!localStorage.getItem('vendor_accounts')) {
        const sampleVendors = [
            {
                id: 1,
                businessName: "Campus Kitchen",
                vendorName: "Sarah Vendor",
                email: "vendor@example.com",
                password: "password123",
                phone: "+2348012345678",
                categories: "food,drinks",
                status: "approved",
                joinedAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('vendor_accounts', JSON.stringify(sampleVendors));
    }

    // Sample products
    if (!localStorage.getItem('vendor_products')) {
        const sampleProducts = [
            {
                id: 1,
                vendorId: 1,
                vendorName: "Campus Kitchen",
                name: "Jollof Rice with Chicken",
                description: "Delicious Nigerian jollof rice served with grilled chicken and plantain",
                price: 1500,
                category: "food",
                image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400",
                isAvailable: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                vendorId: 1,
                vendorName: "Campus Kitchen",
                name: "Fresh Orange Juice",
                description: "Freshly squeezed orange juice, no additives",
                price: 500,
                category: "drinks",
                image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400",
                isAvailable: true,
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('vendor_products', JSON.stringify(sampleProducts));
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeSampleData();
    window.app = new CampusEatsApp();
});