// Vendor Application
class VendorApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkVendorAuth();
        this.initializeSampleData();
        console.log('Vendor App Initialized');
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

        // Add product form
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', (e) => this.handleAddProduct(e));
        }

        // Profile form
        const profileForm = document.getElementById('vendorProfileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Contact form
        const contactForm = document.getElementById('vendorContactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactUpdate(e));
        }

        // Navigation tabs
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('vendorLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        console.log('Vendor event listeners setup complete');
    }

    checkVendorAuth() {
        console.log('Checking vendor authentication...');
        
        const vendorData = localStorage.getItem('currentVendor');
        
        if (vendorData) {
            this.currentUser = JSON.parse(vendorData);
            this.showDashboard();
            this.loadVendorData();
        } else {
            this.showLogin();
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

        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendor = vendors.find(v => v.email === email && v.password === password);

        if (vendor) {
            this.currentUser = vendor;
            localStorage.setItem('currentVendor', JSON.stringify(vendor));
            this.showDashboard();
            this.loadVendorData();
            this.showNotification('Login successful! Welcome back!', 'success');
            
            // Clear form
            document.getElementById('vendorLoginForm').reset();
        } else {
            this.showNotification('❌ Invalid email or password. Please try again.', 'error');
        }
    }

    handleVendorSignup(e) {
        e.preventDefault();
        console.log('Vendor signup form submitted');
        
        const businessName = document.getElementById('businessName').value;
        const vendorName = document.getElementById('vendorName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const phone = document.getElementById('vendorPhone').value;

        if (!businessName || !vendorName || !email || !password || !phone) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        
        if (vendors.find(v => v.email === email)) {
            this.showNotification('A vendor with this email already exists. Please login.', 'error');
            return;
        }
        
        const newVendor = {
            id: Date.now(),
            businessName,
            vendorName,
            email,
            password,
            phone,
            joinedAt: new Date().toISOString(),
            profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            description: '',
            contactPreferences: {
                meetingLocations: ['campus_gate'],
                timeSlots: ['morning', 'afternoon']
            }
        };
        
        vendors.push(newVendor);
        localStorage.setItem('vendor_accounts', JSON.stringify(vendors));
        
        this.currentUser = newVendor;
        localStorage.setItem('currentVendor', JSON.stringify(newVendor));
        this.showDashboard();
        this.loadVendorData();
        this.showNotification('Vendor account created successfully!', 'success');
        
        // Clear form
        document.getElementById('vendorSignupForm').reset();
    }

    handleAddProduct(e) {
        e.preventDefault();
        console.log('Add product form submitted');
        
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const mainCategory = document.getElementById('productMainCategory').value;
        const subcategory = document.getElementById('productSubcategory').value;

        if (!name || !description || !price || !mainCategory || !subcategory) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (price <= 0) {
            this.showNotification('Please enter a valid price', 'error');
            return;
        }

        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        
        const newProduct = {
            id: Date.now(),
            vendorId: this.currentUser.id,
            vendorName: this.currentUser.businessName,
            name,
            description,
            price,
            category: mainCategory,
            subcategory,
            image: this.getProductImage(mainCategory),
            isAvailable: true,
            createdAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        localStorage.setItem('vendor_products', JSON.stringify(products));
        
        this.showNotification('🎉 Product added successfully!', 'success');
        this.switchTab('vendor-products');
        this.loadVendorProducts();
        
        // Clear form
        document.getElementById('addProductForm').reset();
        document.getElementById('imagePreview').innerHTML = `
            <i class="fas fa-camera"></i>
            <span>Click to upload product image</span>
        `;
        document.getElementById('imagePreview').classList.remove('has-image');
        
        // Reset category selections
        document.getElementById('productMainCategory').selectedIndex = 0;
        document.getElementById('productSubcategory').innerHTML = '<option value="">Select Subcategory</option>';
    }

    getProductImage(mainCategory) {
        // Return empty string to use only uploaded images
        return '';
    }

    handleProfileUpdate(e) {
        e.preventDefault();
        console.log('Profile update form submitted');
        
        const businessName = document.getElementById('profileBusinessName').value;
        const vendorName = document.getElementById('profileVendorName').value;
        const email = document.getElementById('profileEmail').value;
        const phone = document.getElementById('profilePhone').value;
        const description = document.getElementById('profileDescription').value;

        if (!businessName || !vendorName || !email || !phone) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Update vendor data
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendorIndex = vendors.findIndex(v => v.id === this.currentUser.id);
        
        if (vendorIndex !== -1) {
            vendors[vendorIndex].businessName = businessName;
            vendors[vendorIndex].vendorName = vendorName;
            vendors[vendorIndex].email = email;
            vendors[vendorIndex].phone = phone;
            vendors[vendorIndex].description = description;
            
            localStorage.setItem('vendor_accounts', JSON.stringify(vendors));
            
            // Update current user
            this.currentUser = vendors[vendorIndex];
            localStorage.setItem('currentVendor', JSON.stringify(vendors[vendorIndex]));
            
            this.showNotification('✅ Profile updated successfully!', 'success');
            this.loadVendorData();
        }
    }

    handleContactUpdate(e) {
        e.preventDefault();
        console.log('Contact form submitted');
        
        const phone = document.getElementById('contactPhone').value;
        const contactPerson = document.getElementById('contactPerson').value;
        
        const meetingLocations = Array.from(document.querySelectorAll('input[name="meetingLocations"]:checked'))
            .map(checkbox => checkbox.value);
            
        const timeSlots = Array.from(document.querySelectorAll('input[name="timeSlots"]:checked'))
            .map(checkbox => checkbox.value);

        if (!phone || !contactPerson) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Update vendor data
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendorIndex = vendors.findIndex(v => v.id === this.currentUser.id);
        
        if (vendorIndex !== -1) {
            vendors[vendorIndex].phone = phone;
            vendors[vendorIndex].contactPerson = contactPerson;
            vendors[vendorIndex].contactPreferences = {
                meetingLocations,
                timeSlots
            };
            
            localStorage.setItem('vendor_accounts', JSON.stringify(vendors));
            
            // Update current user
            this.currentUser = vendors[vendorIndex];
            localStorage.setItem('currentVendor', JSON.stringify(vendors[vendorIndex]));
            
            this.showNotification('✅ Contact preferences updated!', 'success');
        }
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
            
            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.tab === tabName) {
                    item.classList.add('active');
                }
            });
            
            // Load tab-specific data
            switch(tabName) {
                case 'vendor-dashboard':
                    this.loadDashboardStats();
                    break;
                case 'vendor-products':
                    this.loadVendorProducts();
                    break;
                case 'vendor-orders':
                    this.loadVendorOrders();
                    break;
                case 'vendor-messages':
                    this.loadVendorMessages();
                    break;
                case 'vendor-contact':
                    this.loadContactPreferences();
                    break;
                case 'vendor-profile':
                    this.loadProfileData();
                    break;
            }
        }
    }

    loadVendorData() {
        this.loadDashboardStats();
        this.updateWelcomeMessage();
    }

    loadDashboardStats() {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        
        const vendorProducts = products.filter(p => p.vendorId === this.currentUser.id);
        const vendorOrders = orders.filter(o => o.vendorId === this.currentUser.id);
        
        // FIXED: Proper revenue calculation
        const totalRevenue = vendorOrders.reduce((sum, order) => {
            // Calculate total from items if totalAmount doesn't exist
            let orderTotal = order.totalAmount;
            if (!orderTotal && order.items) {
                orderTotal = order.items.reduce((itemSum, item) => {
                    return itemSum + (item.price * item.quantity);
                }, 0);
            }
            return sum + (parseFloat(orderTotal) || 0);
        }, 0);
        
        console.log('Vendor Orders:', vendorOrders);
        console.log('Total Revenue:', totalRevenue);
        
        // Update stats
        document.getElementById('vendorTotalProducts').textContent = vendorProducts.length;
        document.getElementById('vendorTotalOrders').textContent = vendorOrders.length;
        document.getElementById('vendorTotalRevenue').textContent = `₦${totalRevenue.toLocaleString()}`;
        
        // Update nav badges
        const productsCount = document.getElementById('productsCount');
        const ordersCount = document.getElementById('ordersCount');
        const messagesCount = document.getElementById('messagesCount');
        
        if (productsCount) productsCount.textContent = vendorProducts.length;
        if (ordersCount) ordersCount.textContent = vendorOrders.length;
        
        // Update messages count
        if (messagesCount) {
            const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
            const unreadCount = messages.filter(msg => 
                msg.vendorId === this.currentUser.id && !msg.read && msg.senderType === 'student'
            ).length;
            messagesCount.textContent = unreadCount > 0 ? unreadCount : '0';
        }
    }

    loadVendorProducts() {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const vendorProducts = products.filter(p => p.vendorId === this.currentUser.id);
        const productsContainer = document.getElementById('vendorProductsList');
        
        if (!productsContainer) return;
        
        if (vendorProducts.length === 0) {
            productsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.7); grid-column: 1 / -1;">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3 style="color: #FFD700; margin-bottom: 0.5rem;">No Products Yet</h3>
                    <p>Start by adding your first product!</p>
                    <button class="btn" onclick="window.vendorApp.switchTab('add-product')" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Add Your First Product
                    </button>
                </div>
            `;
        } else {
            productsContainer.innerHTML = vendorProducts.map(product => `
                <div class="product-card-modern">
                    <div class="product-image-modern">
                        ${product.image ? `
                            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400x200?text=Product+Image'">
                        ` : `
                            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: rgba(255,215,0,0.1); color: #FFD700;">
                                <i class="fas fa-camera" style="font-size: 2rem;"></i>
                            </div>
                        `}
                        <div class="product-badge-modern">${product.category}</div>
                        <div class="product-status-badge ${product.isAvailable ? 'available' : 'unavailable'}">
                            ${product.isAvailable ? 'Available' : 'Unavailable'}
                        </div>
                    </div>
                    <div class="product-content-modern">
                        <h3 class="product-title-modern">${product.name}</h3>
                        <p class="product-description-modern">${product.description}</p>
                        <div class="product-meta-modern">
                            <span class="product-category">${product.subcategory}</span>
                            <span class="product-date">${new Date(product.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="product-footer-modern">
                            <div class="product-price-modern">₦${product.price.toLocaleString()}</div>
                            <div class="product-actions-modern">
                                <button class="btn btn-sm btn-outline" onclick="window.vendorApp.editProduct(${product.id})" title="Edit Product">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-sm ${product.isAvailable ? 'btn-outline' : 'btn'}" onclick="window.vendorApp.toggleProductAvailability(${product.id})" title="${product.isAvailable ? 'Disable' : 'Enable'} Product">
                                    <i class="fas fa-eye${product.isAvailable ? '' : '-slash'}"></i> ${product.isAvailable ? 'Disable' : 'Enable'}
                                </button>
                                <button class="btn btn-sm btn-outline" onclick="window.vendorApp.deleteProduct(${product.id})" title="Delete Product">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    loadVendorOrders() {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        const vendorOrders = orders.filter(o => o.vendorId === this.currentUser.id);
        const ordersContainer = document.getElementById('vendor-orders');
        
        if (!ordersContainer) return;
        
        // Clear existing content but keep the header
        const modernCard = ordersContainer.querySelector('.modern-card');
        if (modernCard) {
            modernCard.innerHTML = `
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #FFD700;">Order Management</h2>
                    <button class="btn btn-outline" onclick="window.vendorApp.switchTab('vendor-dashboard')">
                        <i class="fas fa-arrow-left"></i> Back to Dashboard
                    </button>
                </div>
                <div class="order-stats" style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <span class="stat-badge pending">Pending: <span id="pendingCount">${vendorOrders.filter(o => o.status === 'pending').length}</span></span>
                    <span class="stat-badge confirmed">Confirmed: <span id="confirmedCount">${vendorOrders.filter(o => o.status === 'confirmed').length}</span></span>
                    <span class="stat-badge completed">Completed: <span id="completedCount">${vendorOrders.filter(o => o.status === 'completed').length}</span></span>
                </div>
                <div class="orders-list" id="vendorOrdersListContent"></div>
            `;
        }
        
        const ordersList = document.getElementById('vendorOrdersListContent');
        
        if (vendorOrders.length === 0) {
            ordersList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.7);">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3 style="color: #FFD700; margin-bottom: 0.5rem;">No Orders Yet</h3>
                    <p>Orders from customers will appear here</p>
                </div>
            `;
        } else {
            ordersList.innerHTML = vendorOrders.map(order => {
                const student = students.find(s => s.id === order.studentId) || { name: 'Unknown Student', email: 'N/A' };
                
                // FIXED: Proper date display
                const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
                const formattedDate = orderDate.toLocaleDateString() + ' ' + orderDate.toLocaleTimeString();
                
                return `
                    <div class="order-card-modern">
                        <div class="order-header-modern">
                            <div class="order-info">
                                <h4>Order #${order.id}</h4>
                                <p class="order-customer">Customer: ${student.name} (${student.email})</p>
                                <p class="order-date">Placed: ${formattedDate}</p>
                                ${order.deliveryInstructions ? `
                                    <p class="order-instructions"><strong>Instructions:</strong> ${order.deliveryInstructions}</p>
                                ` : ''}
                                ${order.preferredTime ? `
                                    <p class="order-time"><strong>Preferred Time:</strong> ${this.getTimeSlotDisplay(order.preferredTime)}</p>
                                ` : ''}
                            </div>
                            <div class="order-status-modern ${order.status}">
                                ${order.status.toUpperCase()}
                            </div>
                        </div>
                        <div class="order-items-modern">
                            ${order.items ? order.items.map(item => `
                                <div class="order-item-modern">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-quantity">Qty: ${item.quantity}</span>
                                    <span class="item-price">₦${(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            `).join('') : '<p>No items found</p>'}
                        </div>
                        <div class="order-total-section">
                            <strong>Order Total: ₦${order.totalAmount ? order.totalAmount.toLocaleString() : '0'}</strong>
                        </div>
                        <div class="order-footer-modern">
                            <div class="vendor-suggestions">
                                <button class="btn btn-sm btn-outline" onclick="window.vendorApp.suggestDeliveryTime(${order.id})">
                                    <i class="fas fa-clock"></i> Suggest Time
                                </button>
                                <button class="btn btn-sm btn-outline" onclick="window.vendorApp.suggestMeetingLocation(${order.id})">
                                    <i class="fas fa-map-marker-alt"></i> Suggest Location
                                </button>
                            </div>
                            <div class="order-actions-modern">
                                ${order.status === 'pending' ? `
                                    <button class="btn btn-sm" onclick="window.vendorApp.updateOrderStatus(${order.id}, 'confirmed')">Confirm Order</button>
                                    <button class="btn btn-sm btn-outline" onclick="window.vendorApp.updateOrderStatus(${order.id}, 'cancelled')">Cancel</button>
                                ` : order.status === 'confirmed' ? `
                                    <button class="btn btn-sm" onclick="window.vendorApp.updateOrderStatus(${order.id}, 'completed')">Mark Complete</button>
                                ` : ''}
                                <button class="btn btn-sm btn-outline" onclick="window.vendorApp.viewOrderDetails(${order.id})">View Details</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // MESSAGING METHODS
    loadVendorMessages() {
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        
        // Filter messages for this vendor
        const vendorMessages = messages.filter(msg => 
            msg.vendorId === this.currentUser.id || 
            (msg.conversationId && msg.conversationId.includes(`vendor-${this.currentUser.id}`))
        );
        
        // Group messages by conversation
        const conversations = this.groupMessagesByConversation(vendorMessages, students);
        this.displayConversations(conversations);
    }

    groupMessagesByConversation(messages, students) {
        const conversations = {};
        
        messages.forEach(message => {
            const studentId = message.studentId;
            const conversationId = `vendor-${this.currentUser.id}-student-${studentId}`;
            
            if (!conversations[conversationId]) {
                const student = students.find(s => s.id === studentId) || { 
                    name: 'Unknown Student', 
                    email: 'Unknown Email',
                    phone: ''
                };
                
                conversations[conversationId] = {
                    id: conversationId,
                    studentId: studentId,
                    studentName: student.name,
                    studentEmail: student.email,
                    studentPhone: student.phone,
                    lastMessage: '',
                    lastMessageTime: '',
                    unreadCount: 0,
                    messages: []
                };
            }
            
            conversations[conversationId].messages.push(message);
            
            // Update last message and unread count
            const lastMsg = message;
            conversations[conversationId].lastMessage = lastMsg.content;
            conversations[conversationId].lastMessageTime = lastMsg.timestamp;
            
            if (!lastMsg.read && lastMsg.senderType === 'student') {
                conversations[conversationId].unreadCount++;
            }
        });
        
        // Convert to array and sort by last message time
        return Object.values(conversations).sort((a, b) => 
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
    }

    displayConversations(conversations) {
        const container = document.getElementById('conversationsList');
        
        if (conversations.length === 0) {
            container.innerHTML = `
                <div class="empty-conversations">
                    <i class="fas fa-comments" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No messages yet</p>
                    <small>Customer messages will appear here</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = conversations.map(conv => `
            <div class="conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}" 
                 onclick="window.vendorApp.openConversation('${conv.id}', ${conv.studentId})">
                <div class="conversation-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <h4>${conv.studentName}</h4>
                        <span class="conversation-time">${this.formatMessageTime(conv.lastMessageTime)}</span>
                    </div>
                    <p class="conversation-preview">${conv.lastMessage}</p>
                </div>
                ${conv.unreadCount > 0 ? `
                    <div class="unread-badge">${conv.unreadCount}</div>
                ` : ''}
            </div>
        `).join('');
    }

    openConversation(conversationId, studentId) {
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        
        // Filter messages for this conversation
        const conversationMessages = messages.filter(msg => 
            msg.conversationId === conversationId
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const student = students.find(s => s.id === studentId) || { 
            name: 'Unknown Student', 
            email: 'Unknown Email',
            phone: ''
        };
        
        this.displayConversation(conversationId, student, conversationMessages);
        
        // Mark messages as read
        this.markMessagesAsRead(conversationId);
    }

    displayConversation(conversationId, student, messages) {
        const container = document.getElementById('messagesView');
        
        container.innerHTML = `
            <div class="conversation-header">
                <div class="conversation-partner">
                    <div class="partner-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="partner-info">
                        <h4>${student.name}</h4>
                        <span>${student.email}</span>
                        ${student.phone ? `
                            <small style="color: #FFD700; margin-top: 0.25rem; display: block;">
                                <i class="fas fa-phone"></i> ${student.phone}
                            </small>
                        ` : ''}
                    </div>
                </div>
                <div class="conversation-actions">
                    <button class="btn btn-outline btn-sm" onclick="window.vendorApp.viewStudentOrders(${student.id})">
                        <i class="fas fa-shopping-cart"></i> Orders
                    </button>
                    ${student.phone ? `
                        <button class="btn btn-outline btn-sm" onclick="window.vendorApp.callStudent(${student.id})">
                            <i class="fas fa-phone"></i> Call
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="messages-list" id="messagesList">
                ${messages.length === 0 ? `
                    <div class="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ` : messages.map(msg => `
                    <div class="message ${msg.senderType === 'vendor' ? 'sent' : 'received'}">
                        <div class="message-content">
                            <p>${msg.content}</p>
                            <span class="message-time">${this.formatMessageTime(msg.timestamp)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="message-input-container">
                <div class="message-input">
                    <input type="text" id="messageInput" placeholder="Type your message..." 
                           onkeypress="if(event.key === 'Enter') window.vendorApp.sendMessage('${conversationId}', ${student.id})">
                    ${student.phone ? `
                        <button class="btn btn-outline call-btn" onclick="window.vendorApp.callStudent(${student.id})" title="Call Student">
                            <i class="fas fa-phone"></i>
                        </button>
                    ` : ''}
                    <button class="btn send-btn" onclick="window.vendorApp.sendMessage('${conversationId}', ${student.id})">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Scroll to bottom of messages
        this.scrollToBottom();
        
        // Focus on input field
        setTimeout(() => {
            const input = document.getElementById('messageInput');
            if (input) input.focus();
        }, 300);
    }

    sendMessage(conversationId, studentId) {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        
        if (!content) return;
        
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        
        const newMessage = {
            id: Date.now(),
            conversationId: conversationId,
            vendorId: this.currentUser.id,
            studentId: studentId,
            content: content,
            senderType: 'vendor',
            timestamp: new Date().toISOString(),
            read: false
        };
        
        messages.push(newMessage);
        localStorage.setItem('vendor_messages', JSON.stringify(messages));
        
        // Clear input
        input.value = '';
        
        // Reload messages
        this.loadVendorMessages();
        this.openConversation(conversationId, studentId);
        
        this.showNotification('Message sent!', 'success');
    }

    callStudent(studentId) {
        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        const student = students.find(s => s.id === studentId);
        
        if (student && student.phone) {
            // Format phone number for tel: link
            const phoneNumber = student.phone.replace(/\s+/g, '');
            
            // Show confirmation before calling
            if (confirm(`Call ${student.name} at ${student.phone}?`)) {
                // Create tel link
                window.location.href = `tel:${phoneNumber}`;
            }
        } else {
            this.showNotification('Student phone number not available.', 'error');
        }
    }

    markMessagesAsRead(conversationId) {
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        let updated = false;
        
        const updatedMessages = messages.map(msg => {
            if (msg.conversationId === conversationId && !msg.read && msg.senderType === 'student') {
                updated = true;
                return { ...msg, read: true };
            }
            return msg;
        });
        
        if (updated) {
            localStorage.setItem('vendor_messages', JSON.stringify(updatedMessages));
            this.loadVendorMessages(); // Update unread counts
        }
    }

    scrollToBottom() {
        const messagesList = document.getElementById('messagesList');
        if (messagesList) {
            // Use multiple timeouts to ensure DOM is fully rendered
            setTimeout(() => {
                messagesList.scrollTop = messagesList.scrollHeight;
            }, 50);
            setTimeout(() => {
                messagesList.scrollTop = messagesList.scrollHeight;
            }, 200);
        }
    }

    refreshMessages() {
        this.loadVendorMessages();
        this.showNotification('Messages refreshed', 'info');
    }

    // OTHER METHODS
    getTimeSlotDisplay(timeSlot) {
        const timeSlots = {
            'morning': 'Morning (8AM - 12PM)',
            'afternoon': 'Afternoon (12PM - 4PM)',
            'evening': 'Evening (4PM - 8PM)',
            'specific': 'Specific Time (Contact Vendor)'
        };
        return timeSlots[timeSlot] || timeSlot;
    }

    formatMessageTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    loadContactPreferences() {
        const contactForm = document.getElementById('vendorContactForm');
        if (!contactForm) return;
        
        document.getElementById('contactPhone').value = this.currentUser.phone || '';
        document.getElementById('contactPerson').value = this.currentUser.contactPerson || this.currentUser.vendorName || '';
        
        // Set checkboxes based on preferences
        const preferences = this.currentUser.contactPreferences || {
            meetingLocations: ['campus_gate'],
            timeSlots: ['morning', 'afternoon']
        };
        
        // Set meeting locations
        document.querySelectorAll('input[name="meetingLocations"]').forEach(checkbox => {
            checkbox.checked = preferences.meetingLocations.includes(checkbox.value);
        });
        
        // Set time slots
        document.querySelectorAll('input[name="timeSlots"]').forEach(checkbox => {
            checkbox.checked = preferences.timeSlots.includes(checkbox.value);
        });
    }

    loadProfileData() {
        document.getElementById('vendorProfileName').textContent = this.currentUser.vendorName;
        document.getElementById('vendorProfileBusiness').textContent = this.currentUser.businessName;
        document.getElementById('vendorAvatar').src = this.currentUser.profilePicture;
        
        document.getElementById('profileBusinessName').value = this.currentUser.businessName;
        document.getElementById('profileVendorName').value = this.currentUser.vendorName;
        document.getElementById('profileEmail').value = this.currentUser.email;
        document.getElementById('profilePhone').value = this.currentUser.phone;
        document.getElementById('profileDescription').value = this.currentUser.description || '';
        
        // Update profile stats
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const vendorProducts = products.filter(p => p.vendorId === this.currentUser.id);
        const vendorOrders = orders.filter(o => o.vendorId === this.currentUser.id);
        const totalRevenue = vendorOrders.reduce((sum, order) => {
            let orderTotal = order.totalAmount;
            if (!orderTotal && order.items) {
                orderTotal = order.items.reduce((itemSum, item) => {
                    return itemSum + (item.price * item.quantity);
                }, 0);
            }
            return sum + (parseFloat(orderTotal) || 0);
        }, 0);
        
        document.getElementById('profileProducts').textContent = vendorProducts.length;
        document.getElementById('profileOrders').textContent = vendorOrders.length;
        document.getElementById('profileRevenue').textContent = `₦${totalRevenue.toLocaleString()}`;
    }

    updateWelcomeMessage() {
        document.getElementById('vendorWelcome').textContent = `Welcome, ${this.currentUser.vendorName}!`;
    }

    showLogin() {
        document.getElementById('vendorLogin').classList.remove('hidden');
        document.getElementById('vendorSignup').classList.add('hidden');
        document.getElementById('vendorDashboard').classList.add('hidden');
    }

    showSignup() {
        document.getElementById('vendorLogin').classList.add('hidden');
        document.getElementById('vendorSignup').classList.remove('hidden');
        document.getElementById('vendorDashboard').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('vendorLogin').classList.add('hidden');
        document.getElementById('vendorSignup').classList.add('hidden');
        document.getElementById('vendorDashboard').classList.remove('hidden');
    }

    logout() {
        localStorage.removeItem('currentVendor');
        this.currentUser = null;
        this.showLogin();
        this.showNotification('Logged out successfully', 'success');
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

    // Product management methods
    editProduct(productId) {
        // Find the product
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const product = products.find(p => p.id === productId);
        
        if (product) {
            // Switch to add product tab and populate form
            this.switchTab('add-product');
            
            // Populate form with product data
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productMainCategory').value = product.category;
            
            // Trigger subcategory update
            updateSubcategories();
            setTimeout(() => {
                document.getElementById('productSubcategory').value = product.subcategory;
            }, 100);
            
            // Update image preview if image exists
            const preview = document.getElementById('imagePreview');
            if (product.image) {
                preview.innerHTML = `<img src="${product.image}" alt="Product Image Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
                preview.classList.add('has-image');
            }
            
            this.showNotification('Product loaded for editing. Update the details and click "Update Product".', 'info');
        }
    }

    toggleProductAvailability(productId) {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            products[productIndex].isAvailable = !products[productIndex].isAvailable;
            localStorage.setItem('vendor_products', JSON.stringify(products));
            this.loadVendorProducts();
            this.showNotification(`Product ${products[productIndex].isAvailable ? 'enabled' : 'disabled'}`, 'success');
        }
    }

    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
            const updatedProducts = products.filter(p => p.id !== productId);
            localStorage.setItem('vendor_products', JSON.stringify(updatedProducts));
            this.loadVendorProducts();
            this.loadDashboardStats();
            this.showNotification('Product deleted successfully', 'success');
        }
    }

    // Order management methods
    updateOrderStatus(orderId, newStatus) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            orders[orderIndex].updatedAt = new Date().toISOString();
            localStorage.setItem('student_orders', JSON.stringify(orders));
            this.loadVendorOrders();
            this.loadDashboardStats();
            this.showNotification(`Order ${newStatus} successfully`, 'success');
        }
    }

    suggestDeliveryTime(orderId) {
        const time = prompt('Suggest a delivery time to the student (e.g., "Tomorrow 2PM", "Friday 10AM"):');
        if (time) {
            this.showNotification(`Delivery time suggestion sent to student: ${time}`, 'success');
        }
    }

    suggestMeetingLocation(orderId) {
        const location = prompt('Suggest a meeting location to the student:');
        if (location) {
            this.showNotification(`Meeting location suggestion sent to student: ${location}`, 'success');
        }
    }

    viewOrderDetails(orderId) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            let details = `Order Details:\n\n`;
            details += `Order ID: ${order.id}\n`;
            details += `Status: ${order.status}\n`;
            details += `Total: ₦${order.totalAmount ? order.totalAmount.toLocaleString() : '0'}\n`;
            details += `Items: ${order.items ? order.items.length : 0}\n`;
            
            if (order.deliveryInstructions) {
                details += `Delivery Instructions: ${order.deliveryInstructions}\n`;
            }
            
            if (order.preferredTime) {
                details += `Preferred Time: ${this.getTimeSlotDisplay(order.preferredTime)}\n`;
            }
            
            alert(details);
        }
    }

    viewStudentOrders(studentId) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const studentOrders = orders.filter(order => 
            order.studentId === studentId && order.vendorId === this.currentUser.id
        );
        
        let ordersInfo = `Orders from this student:\n\n`;
        
        if (studentOrders.length === 0) {
            ordersInfo += 'No orders found';
        } else {
            studentOrders.forEach(order => {
                ordersInfo += `Order #${order.id} - ${order.status}\n`;
                if (order.items) {
                    order.items.forEach(item => {
                        ordersInfo += `  ${item.name} x${item.quantity}\n`;
                    });
                }
                ordersInfo += `Total: ₦${order.totalAmount || '0'}\n\n`;
            });
        }
        
        alert(ordersInfo);
    }

    // Initialize sample data for testing
    initializeSampleData() {
        // Only create sample orders if none exist
        const existingOrders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        if (existingOrders.length === 0 && this.currentUser) {
            const sampleOrders = [
                {
                    id: Date.now(),
                    studentId: 1,
                    vendorId: this.currentUser.id,
                    studentName: "John Student",
                    vendorName: this.currentUser.businessName,
                    items: [
                        { name: "Jollof Rice with Chicken", price: 1500, quantity: 2 },
                        { name: "Fresh Orange Juice", price: 500, quantity: 1 }
                    ],
                    totalAmount: 3500,
                    status: "pending",
                    deliveryInstructions: "Please deliver to hostel block B",
                    preferredTime: "evening",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('student_orders', JSON.stringify(sampleOrders));
        }
    }
    // In vendor-app.js, add this method to the VendorApp class:
refreshCurrentConversation() {
    // Save current input content
    const currentInput = document.getElementById('messageInput');
    const currentContent = currentInput ? currentInput.value : '';
    
    const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
    const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
    
    if (!this.currentConversation) return;
    
    // Filter messages for this conversation
    const conversationMessages = messages.filter(msg => 
        msg.conversationId === this.currentConversation.id
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const student = students.find(s => s.id === this.currentConversation.studentId) || { 
        name: 'Unknown Student', 
        email: 'Unknown Email',
        phone: ''
    };
    
    this.displayConversation(this.currentConversation.id, student, conversationMessages);
    
    // Restore input content after refresh
    if (currentContent) {
        setTimeout(() => {
            const newInput = document.getElementById('messageInput');
            if (newInput) {
                newInput.value = currentContent;
                // Keep cursor at the end of the text
                newInput.focus();
                newInput.setSelectionRange(currentContent.length, currentContent.length);
            }
        }, 100);
    }
}

// Update the loadVendorMessages method to use refreshCurrentConversation:
loadVendorMessages() {
    const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
    const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
    
    // Filter messages for this vendor
    const vendorMessages = messages.filter(msg => 
        msg.vendorId === this.currentUser.id || 
        (msg.conversationId && msg.conversationId.includes(`vendor-${this.currentUser.id}`))
    );
    
    // Group messages by conversation
    const conversations = this.groupMessagesByConversation(vendorMessages, students);
    this.displayConversations(conversations);
    
    // If there's a current conversation, refresh it but preserve input
    if (this.currentConversation) {
        this.refreshCurrentConversation();
    }
    
    // Update messages count badge
    const unreadCount = vendorMessages.filter(msg => 
        !msg.read && msg.senderType === 'student'
    ).length;
    
    const messagesCount = document.getElementById('messagesCount');
    if (messagesCount) {
        messagesCount.textContent = unreadCount > 0 ? unreadCount : '0';
    }
}
}

// Global functions for vendor dashboard
function showVendorLogin() {
    if (window.vendorApp) {
        window.vendorApp.showLogin();
    }
}

function showVendorSignup() {
    if (window.vendorApp) {
        window.vendorApp.showSignup();
    }
}

function switchTab(tabName) {
    if (window.vendorApp) {
        window.vendorApp.switchTab(tabName);
    }
}

function updateSubcategories() {
    const mainCategory = document.getElementById('productMainCategory').value;
    const subcategorySelect = document.getElementById('productSubcategory');
    
    // Clear existing options
    subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
    
    const categoryStructure = {
        'food': ['Jollof Rice', 'Fried Rice', 'Pasta', 'Swallow', 'Soup', 'Protein', 'Small Chop', 'Pastry'],
        'electronics': ['Phone', 'Tablet', 'Laptop', 'Power Bank', 'Charger', 'Headphones', 'Earphones', 'Smart Watch'],
        'fashion': ['T-Shirt', 'Shirt', 'Trouser', 'Short', 'Jacket', 'Hoodie', 'Sneakers', 'Sandals'],
        'stationery': ['Notebook', 'Textbook', 'Pen', 'Pencil', 'Highlighter', 'Calculator', 'Folder'],
        'beauty': ['Skincare', 'Haircare', 'Makeup', 'Perfume', 'Body Spray', 'Nail Polish'],
        'sports': ['Football', 'Basketball', 'Jersey', 'Sport Shoes', 'Sport Bag', 'Water Bottle'],
        'other': ['Other Products']
    };
    
    if (mainCategory && categoryStructure[mainCategory]) {
        categoryStructure[mainCategory].forEach(subcat => {
            const option = document.createElement('option');
            option.value = subcat.toLowerCase().replace(/\s+/g, '-');
            option.textContent = subcat;
            subcategorySelect.appendChild(option);
        });
    }
}

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const file = input.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Product Image Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
            preview.classList.add('has-image');
        }
        
        reader.readAsDataURL(file);
    }
}

function updateProfilePicture(input) {
    const file = input.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            document.getElementById('vendorAvatar').src = e.target.result;
            if (window.vendorApp) {
                window.vendorApp.showNotification('Profile picture updated!', 'success');
            }
        }
        
        reader.readAsDataURL(file);
    }
}

// Initialize the vendor app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing vendor app...');
    window.vendorApp = new VendorApp();
});