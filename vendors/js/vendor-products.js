
class VendorProductsManager {
    constructor() {
        this.currentVendor = null;
        this.allProducts = [];
        this.init();
    }

    init() {
        this.checkVendorAuth();
        this.setupEventListeners();
        this.loadProducts();
        this.checkUrlParams();
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
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchProducts(e.target.value));
        }

        const newProductForm = document.getElementById('newProductForm');
        if (newProductForm) {
            newProductForm.addEventListener('submit', (e) => this.handleAddProduct(e));
        }
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action === 'add') {
            this.showAddProductForm();
        }
    }

    loadProducts() {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        this.allProducts = products
            .filter(product => product.vendorId === this.currentVendor.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        this.displayProducts(this.allProducts);
    }

    displayProducts(products) {
        const container = document.getElementById('productsList');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box"></i>
                    <h4>No Products Found</h4>
                    <p>You haven't added any products yet.</p>
                    <button class="btn btn-primary" onclick="vendorProductsManager.showAddProductForm()">
                        <i class="fas fa-plus"></i> Add Your First Product
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => {
            const statusClass = product.status === 'active' ? 'active' : 
                              product.status === 'pending' ? 'pending' : 'inactive';
            
            return `
                <div class="product-vendor-card">
                    <div class="product-vendor-image">
                        <img src="${product.image || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${product.name}">
                        <div class="product-status ${statusClass}">${product.status}</div>
                    </div>
                    <div class="product-vendor-content">
                        <div class="product-vendor-info">
                            <h4>${product.name}</h4>
                            <p class="product-description">${product.description}</p>
                            <div class="product-meta">
                                <span class="product-category">${product.category}</span>
                                <span class="product-price">₦${product.price.toLocaleString()}</span>
                            </div>
                            <div class="product-stats">
                                <span><i class="fas fa-shopping-cart"></i> ${product.totalOrders || 0} orders</span>
                                <span><i class="fas fa-star"></i> ${product.rating || 'No ratings'}</span>
                            </div>
                        </div>
                        <div class="product-vendor-actions">
                            <button class="btn btn-sm btn-primary" onclick="vendorProductsManager.editProduct(${product.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="vendorProductsManager.toggleAvailability(${product.id})">
                                <i class="fas fa-power-off"></i> ${product.isAvailable ? 'Disable' : 'Enable'}
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="vendorProductsManager.deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    searchProducts(query) {
        const filteredProducts = this.allProducts.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
        );
        this.displayProducts(filteredProducts);
    }

    filterProducts() {
        const statusFilter = document.getElementById('statusFilter').value;
        let filteredProducts = this.allProducts;

        if (statusFilter !== 'all') {
            filteredProducts = filteredProducts.filter(product => product.status === statusFilter);
        }

        this.displayProducts(filteredProducts);
    }

    showAddProductForm() {
        document.getElementById('addProductForm').classList.remove('hidden');
        document.getElementById('productsListSection').classList.add('hidden');
    }

    hideAddProductForm() {
        document.getElementById('addProductForm').classList.add('hidden');
        document.getElementById('productsListSection').classList.remove('hidden');
        document.getElementById('newProductForm').reset();
        document.getElementById('previewImage').style.display = 'none';
        document.getElementById('imagePreview').classList.remove('has-image');
    }

    handleAddProduct(e) {
        e.preventDefault();
        
        const productName = document.getElementById('productName').value;
        const productDescription = document.getElementById('productDescription').value;
        const productPrice = parseFloat(document.getElementById('productPrice').value);
        const productCategory = document.getElementById('productCategory').value;
        const productAvailable = document.getElementById('productAvailable').checked;
        const productImage = document.getElementById('previewImage').src;

        if (!productName || !productDescription || !productPrice || !productCategory) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        
        const newProduct = {
            id: Date.now(),
            vendorId: this.currentVendor.id,
            vendorName: this.currentVendor.businessName,
            name: productName,
            description: productDescription,
            price: productPrice,
            category: productCategory,
            image: productImage || 'https://via.placeholder.com/300x200?text=No+Image',
            isAvailable: productAvailable,
            status: 'active',
            rating: 0,
            totalOrders: 0,
            totalRevenue: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        products.push(newProduct);
        localStorage.setItem('vendor_products', JSON.stringify(products));

        this.showNotification('Product added successfully!', 'success');
        this.hideAddProductForm();
        this.loadProducts();
    }

    editProduct(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (!product) return;

        const modalContent = document.getElementById('editProductContent');
        modalContent.innerHTML = `
            <form id="editProductForm">
                <div class="form-group">
                    <label>Product Name</label>
                    <input type="text" id="editProductName" value="${product.name}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="editProductDescription" rows="3" required>${product.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Price (₦)</label>
                    <input type="number" id="editProductPrice" value="${product.price}" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select id="editProductCategory" required>
                        <option value="food" ${product.category === 'food' ? 'selected' : ''}>Food</option>
                        <option value="drinks" ${product.category === 'drinks' ? 'selected' : ''}>Drinks</option>
                        <option value="snacks" ${product.category === 'snacks' ? 'selected' : ''}>Snacks</option>
                        <option value="desserts" ${product.category === 'desserts' ? 'selected' : ''}>Desserts</option>
                        <option value="gadgets" ${product.category === 'gadgets' ? 'selected' : ''}>Gadgets</option>
                        <option value="stationery" ${product.category === 'stationery' ? 'selected' : ''}>Stationery</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="editProductAvailable" ${product.isAvailable ? 'checked' : ''}>
                        Available for sale
                    </label>
                </div>
                <div class="action-buttons">
                    <button type="submit" class="btn btn-primary">Update Product</button>
                    <button type="button" class="btn btn-outline" onclick="closeModal('editProductModal')">Cancel</button>
                </div>
            </form>
        `;

        const editForm = document.getElementById('editProductForm');
        editForm.addEventListener('submit', (e) => this.handleUpdateProduct(e, productId));

        this.showModal('editProductModal');
    }

    handleUpdateProduct(e, productId) {
        e.preventDefault();
        
        const productName = document.getElementById('editProductName').value;
        const productDescription = document.getElementById('editProductDescription').value;
        const productPrice = parseFloat(document.getElementById('editProductPrice').value);
        const productCategory = document.getElementById('editProductCategory').value;
        const productAvailable = document.getElementById('editProductAvailable').checked;

        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            products[productIndex].name = productName;
            products[productIndex].description = productDescription;
            products[productIndex].price = productPrice;
            products[productIndex].category = productCategory;
            products[productIndex].isAvailable = productAvailable;
            products[productIndex].updatedAt = new Date().toISOString();

            localStorage.setItem('vendor_products', JSON.stringify(products));
            this.showNotification('Product updated successfully!', 'success');
            this.closeModal('editProductModal');
            this.loadProducts();
        }
    }

    toggleAvailability(productId) {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            products[productIndex].isAvailable = !products[productIndex].isAvailable;
            products[productIndex].updatedAt = new Date().toISOString();

            localStorage.setItem('vendor_products', JSON.stringify(products));
            this.showNotification(`Product ${products[productIndex].isAvailable ? 'enabled' : 'disabled'}`, 'success');
            this.loadProducts();
        }
    }

    deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const filteredProducts = products.filter(p => p.id !== productId);
        
        localStorage.setItem('vendor_products', JSON.stringify(filteredProducts));
        this.showNotification('Product deleted successfully!', 'success');
        this.loadProducts();
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

// Global function for image preview
function previewImage(input) {
    const preview = document.getElementById('previewImage');
    const imagePreview = document.getElementById('imagePreview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            imagePreview.classList.add('has-image');
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Initialize vendor products manager
document.addEventListener('DOMContentLoaded', function() {
    window.vendorProductsManager = new VendorProductsManager();
});
