class StudentReviewsManager {
    constructor() {
        this.currentStudent = null;
        this.init();
    }

    init() {
        this.checkStudentAuth();
        this.setupEventListeners();
        this.loadReviews();
        this.setupUserMenu();
    }

    checkStudentAuth() {
        const studentData = localStorage.getItem('currentStudent');
        if (studentData) {
            this.currentStudent = JSON.parse(studentData);
        } else {
            window.location.href = '../index.html';
        }
    }

    setupUserMenu() {
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userMenu = document.getElementById('userMenu');
        
        if (userMenuBtn && userMenu) {
            userMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                userMenu.classList.toggle('hidden');
                const chevron = userMenuBtn.querySelector('.fa-chevron-down');
                chevron.style.transform = userMenu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#userMenuBtn') && !e.target.closest('#userMenu')) {
                const userMenu = document.getElementById('userMenu');
                if (userMenu) userMenu.classList.add('hidden');
                const chevron = document.querySelector('#userMenuBtn .fa-chevron-down');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
        });

        // Update user name
        const userName = document.getElementById('userName');
        if (userName && this.currentStudent) {
            userName.textContent = this.currentStudent.name.split(' ')[0];
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('reviewSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchReviews(e.target.value));
        }
    }

    loadReviews() {
        this.loadPendingReviews();
        this.loadMyReviews();
    }

    loadPendingReviews() {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const completedOrders = orders.filter(order => 
            order.studentId === this.currentStudent.id && 
            order.status === 'completed' &&
            !this.hasOrderBeenReviewed(order.id)
        );

        const container = document.getElementById('pendingReviews');
        if (!container) return;

        if (completedOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <i class="fas fa-check-circle"></i>
                    <h4>All Caught Up!</h4>
                    <p>You have no pending reviews.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = completedOrders.map(order => {
            const orderDate = order.createdAt || order.orderDate;
            const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString() : 'Recent';

            return `
                <div class="pending-review-card">
                    <div class="pending-review-info">
                        <h4>Order #${order.id}</h4>
                        <p>${order.vendorName} • ${formattedDate}</p>
                        <div class="order-items-preview">
                            ${order.items ? order.items.slice(0, 2).map(item => 
                                `<span class="item-tag">${item.name} x${item.quantity}</span>`
                            ).join('') : ''}
                        </div>
                    </div>
                    <div class="pending-review-actions">
                        <button class="btn btn-primary" onclick="studentReviewsManager.showReviewForm(${order.id})">
                            <i class="fas fa-star"></i> Write Review
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadMyReviews() {
        const reviews = JSON.parse(localStorage.getItem('product_reviews') || '[]');
        const studentReviews = reviews.filter(review => 
            review.studentId === this.currentStudent.id
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const container = document.getElementById('myReviews');
        if (!container) return;

        if (studentReviews.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <i class="fas fa-star"></i>
                    <h4>No Reviews Yet</h4>
                    <p>You haven't written any reviews yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = studentReviews.map(review => {
            const reviewDate = new Date(review.createdAt).toLocaleDateString();
            const helpfulCount = review.helpful || 0;

            return `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-product-info">
                            <h4>${review.productName}</h4>
                            <p>${review.vendorName}</p>
                        </div>
                        <div class="review-meta">
                            <div class="review-rating">
                                ${this.generateStarRating(review.rating)}
                            </div>
                            <span class="review-date">${reviewDate}</span>
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${review.comment}</p>
                        ${review.images && review.images.length > 0 ? `
                            <div class="review-images">
                                ${review.images.map(img => `
                                    <img src="${img}" alt="Review image" onclick="studentReviewsManager.viewImage('${img}')">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="review-footer">
                        <div class="review-actions">
                            <button class="btn btn-sm btn-outline" onclick="studentReviewsManager.editReview(${review.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm" onclick="studentReviewsManager.reportReview(${review.id})">
                                <i class="fas fa-flag"></i> Report
                            </button>
                        </div>
                        <div class="review-stats">
                            <span class="helpful-count">
                                <i class="fas fa-thumbs-up"></i> ${helpfulCount} helpful
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    showReviewForm(orderId) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const order = orders.find(o => o.id == orderId);
        
        if (!order) return;

        const modalContent = document.getElementById('reviewContent');
        modalContent.innerHTML = `
            <div class="review-order-info">
                <h4>Review Order #${order.id}</h4>
                <p>${order.vendorName}</p>
            </div>
            
            <form id="reviewForm">
                <input type="hidden" id="reviewOrderId" value="${order.id}">
                <input type="hidden" id="reviewVendorId" value="${order.vendorId}">
                
                ${order.items ? order.items.map(item => `
                    <div class="review-item">
                        <div class="review-item-header">
                            <h5>${item.name}</h5>
                            <span>₦${item.price.toLocaleString()} x ${item.quantity}</span>
                        </div>
                        <div class="review-item-content">
                            <div class="rating-section">
                                <label>Rating:</label>
                                <div class="star-rating">
                                    ${[1,2,3,4,5].map(star => `
                                        <i class="fas fa-star" data-rating="${star}" onclick="studentReviewsManager.setRating(this, ${item.id})"></i>
                                    `).join('')}
                                </div>
                                <input type="hidden" id="rating-${item.id}" name="rating-${item.id}" value="0">
                            </div>
                            <div class="comment-section">
                                <label>Comment (Optional):</label>
                                <textarea name="comment-${item.id}" placeholder="Share your experience with this product..."></textarea>
                            </div>
                            <div class="photo-section">
                                <label>Add Photos (Optional):</label>
                                <div class="photo-upload">
                                    <div class="photo-preview" id="preview-${item.id}"></div>
                                    <button type="button" class="btn btn-sm btn-outline" onclick="studentReviewsManager.addPhoto(${item.id})">
                                        <i class="fas fa-camera"></i> Add Photo
                                    </button>
                                    <input type="file" id="photo-${item.id}" multiple accept="image/*" style="display: none;" onchange="studentReviewsManager.handlePhotoUpload(this, ${item.id})">
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('') : ''}
                
                <div class="vendor-rating">
                    <h5>Overall Vendor Experience</h5>
                    <div class="rating-section">
                        <label>Vendor Rating:</label>
                        <div class="star-rating">
                            ${[1,2,3,4,5].map(star => `
                                <i class="fas fa-star" data-rating="${star}" onclick="studentReviewsManager.setVendorRating(this)"></i>
                            `).join('')}
                        </div>
                        <input type="hidden" id="vendorRating" name="vendorRating" value="0">
                    </div>
                    <div class="comment-section">
                        <label>Vendor Comment (Optional):</label>
                        <textarea name="vendorComment" placeholder="Share your overall experience with this vendor..."></textarea>
                    </div>
                </div>
                
                <div class="action-buttons" style="margin-top: 2rem;">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Submit Review
                    </button>
                    <button type="button" class="btn btn-outline" onclick="closeModal('reviewModal')">
                        Cancel
                    </button>
                </div>
            </form>
        `;

        const reviewForm = document.getElementById('reviewForm');
        reviewForm.addEventListener('submit', (e) => this.handleReviewSubmit(e));

        this.showModal('reviewModal');
    }

    setRating(starElement, productId) {
        const rating = parseInt(starElement.dataset.rating);
        const stars = starElement.parentElement.querySelectorAll('.fa-star');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });

        document.getElementById(`rating-${productId}`).value = rating;
    }

    setVendorRating(starElement) {
        const rating = parseInt(starElement.dataset.rating);
        const stars = starElement.parentElement.querySelectorAll('.fa-star');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });

        document.getElementById('vendorRating').value = rating;
    }

    addPhoto(productId) {
        document.getElementById(`photo-${productId}`).click();
    }

    handlePhotoUpload(input, productId) {
        if (input.files && input.files.length > 0) {
            const preview = document.getElementById(`preview-${productId}`);
            preview.innerHTML = '';
            
            Array.from(input.files).forEach(file => {
                if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.alt = 'Review photo';
                        preview.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    handleReviewSubmit(e) {
        e.preventDefault();
        
        const orderId = document.getElementById('reviewOrderId').value;
        const vendorId = document.getElementById('reviewVendorId').value;
        const vendorRating = document.getElementById('vendorRating').value;
        const vendorComment = document.querySelector('textarea[name="vendorComment"]').value;

        if (vendorRating === '0') {
            this.showNotification('Please rate the vendor', 'error');
            return;
        }

        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const order = orders.find(o => o.id == orderId);
        
        if (!order) return;

        const reviews = JSON.parse(localStorage.getItem('product_reviews') || '[]');
        
        // Submit reviews for each product
        order.items.forEach(item => {
            const productRating = document.getElementById(`rating-${item.id}`).value;
            const productComment = document.querySelector(`textarea[name="comment-${item.id}"]`).value;
            
            if (productRating !== '0') {
                const review = {
                    id: Date.now() + item.id,
                    orderId: parseInt(orderId),
                    productId: item.id,
                    productName: item.name,
                    vendorId: parseInt(vendorId),
                    vendorName: order.vendorName,
                    studentId: this.currentStudent.id,
                    studentName: this.currentStudent.name,
                    rating: parseInt(productRating),
                    comment: productComment,
                    images: this.getUploadedImages(item.id),
                    createdAt: new Date().toISOString(),
                    helpful: 0,
                    reported: false
                };
                
                reviews.push(review);
            }
        });

        // Update vendor rating
        this.updateVendorRating(vendorId, parseInt(vendorRating), vendorComment);

        localStorage.setItem('product_reviews', JSON.stringify(reviews));
        
        this.showNotification('Review submitted successfully!', 'success');
        this.closeModal('reviewModal');
        this.loadReviews();
    }

    getUploadedImages(productId) {
        const preview = document.getElementById(`preview-${productId}`);
        if (!preview) return [];
        
        const images = [];
        preview.querySelectorAll('img').forEach(img => {
            images.push(img.src);
        });
        
        return images;
    }

    updateVendorRating(vendorId, rating, comment) {
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendorIndex = vendors.findIndex(v => v.id == vendorId);
        
        if (vendorIndex !== -1) {
            if (!vendors[vendorIndex].ratings) {
                vendors[vendorIndex].ratings = [];
            }
            
            vendors[vendorIndex].ratings.push({
                rating: rating,
                comment: comment,
                studentId: this.currentStudent.id,
                studentName: this.currentStudent.name,
                date: new Date().toISOString()
            });
            
            // Calculate new average rating
            const totalRating = vendors[vendorIndex].ratings.reduce((sum, r) => sum + r.rating, 0);
            vendors[vendorIndex].rating = totalRating / vendors[vendorIndex].ratings.length;
            
            localStorage.setItem('vendor_accounts', JSON.stringify(vendors));
        }
    }

    editReview(reviewId) {
        const reviews = JSON.parse(localStorage.getItem('product_reviews') || '[]');
        const review = reviews.find(r => r.id === reviewId);
        
        if (!review) return;

        const modalContent = document.getElementById('editReviewContent');
        modalContent.innerHTML = `
            <form id="editReviewForm">
                <input type="hidden" id="editReviewId" value="${review.id}">
                
                <div class="review-product-info">
                    <h4>${review.productName}</h4>
                    <p>${review.vendorName}</p>
                </div>
                
                <div class="rating-section">
                    <label>Rating:</label>
                    <div class="star-rating">
                        ${[1,2,3,4,5].map(star => `
                            <i class="fas fa-star ${star <= review.rating ? 'active' : ''}" 
                               data-rating="${star}" 
                               onclick="studentReviewsManager.setEditRating(this)"></i>
                        `).join('')}
                    </div>
                    <input type="hidden" id="editRating" value="${review.rating}">
                </div>
                
                <div class="comment-section">
                    <label>Comment:</label>
                    <textarea id="editComment">${review.comment}</textarea>
                </div>
                
                <div class="action-buttons" style="margin-top: 2rem;">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Update Review
                    </button>
                    <button type="button" class="btn btn-outline" onclick="closeModal('editReviewModal')">
                        Cancel
                    </button>
                </div>
            </form>
        `;

        const editForm = document.getElementById('editReviewForm');
        editForm.addEventListener('submit', (e) => this.handleEditReview(e));

        this.showModal('editReviewModal');
    }

    setEditRating(starElement) {
        const rating = parseInt(starElement.dataset.rating);
        const stars = starElement.parentElement.querySelectorAll('.fa-star');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });

        document.getElementById('editRating').value = rating;
    }

    handleEditReview(e) {
        e.preventDefault();
        
        const reviewId = parseInt(document.getElementById('editReviewId').value);
        const rating = parseInt(document.getElementById('editRating').value);
        const comment = document.getElementById('editComment').value;

        const reviews = JSON.parse(localStorage.getItem('product_reviews') || '[]');
        const reviewIndex = reviews.findIndex(r => r.id === reviewId);
        
        if (reviewIndex !== -1) {
            reviews[reviewIndex].rating = rating;
            reviews[reviewIndex].comment = comment;
            reviews[reviewIndex].updatedAt = new Date().toISOString();
            
            localStorage.setItem('product_reviews', JSON.stringify(reviews));
            
            this.showNotification('Review updated successfully!', 'success');
            this.closeModal('editReviewModal');
            this.loadReviews();
        }
    }

    reportReview(reviewId) {
        const reason = prompt('Please specify why you are reporting this review:');
        if (reason) {
            const reports = JSON.parse(localStorage.getItem('reports') || '[]');
            
            reports.push({
                id: Date.now(),
                type: 'review',
                reporterId: this.currentStudent.id,
                reporterName: this.currentStudent.name,
                reporterType: 'student',
                targetId: reviewId,
                targetType: 'review',
                reason: reason,
                description: 'Student reported their own review',
                timestamp: new Date().toISOString(),
                resolved: false
            });
            
            localStorage.setItem('reports', JSON.stringify(reports));
            this.showNotification('Review reported successfully', 'info');
        }
    }

    viewImage(imageUrl) {
        window.open(imageUrl, '_blank');
    }

    searchReviews(query) {
        const reviews = JSON.parse(localStorage.getItem('product_reviews') || '[]');
        const studentReviews = reviews.filter(review => 
            review.studentId === this.currentStudent.id
        );
        
        const filteredReviews = studentReviews.filter(review => 
            review.productName.toLowerCase().includes(query.toLowerCase()) ||
            review.vendorName.toLowerCase().includes(query.toLowerCase()) ||
            review.comment.toLowerCase().includes(query.toLowerCase())
        );
        
        this.displayMyReviews(filteredReviews);
    }

    displayMyReviews(reviews) {
        const container = document.getElementById('myReviews');
        if (!container) return;

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <i class="fas fa-search"></i>
                    <h4>No Reviews Found</h4>
                    <p>No reviews match your search criteria.</p>
                </div>
            `;
            return;
        }

        // Same display logic as loadMyReviews but with filtered reviews
        container.innerHTML = reviews.map(review => {
            const reviewDate = new Date(review.createdAt).toLocaleDateString();
            const helpfulCount = review.helpful || 0;

            return `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-product-info">
                            <h4>${review.productName}</h4>
                            <p>${review.vendorName}</p>
                        </div>
                        <div class="review-meta">
                            <div class="review-rating">
                                ${this.generateStarRating(review.rating)}
                            </div>
                            <span class="review-date">${reviewDate}</span>
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${review.comment}</p>
                        ${review.images && review.images.length > 0 ? `
                            <div class="review-images">
                                ${review.images.map(img => `
                                    <img src="${img}" alt="Review image" onclick="studentReviewsManager.viewImage('${img}')">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="review-footer">
                        <div class="review-actions">
                            <button class="btn btn-sm btn-outline" onclick="studentReviewsManager.editReview(${review.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm" onclick="studentReviewsManager.reportReview(${review.id})">
                                <i class="fas fa-flag"></i> Report
                            </button>
                        </div>
                        <div class="review-stats">
                            <span class="helpful-count">
                                <i class="fas fa-thumbs-up"></i> ${helpfulCount} helpful
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    hasOrderBeenReviewed(orderId) {
        const reviews = JSON.parse(localStorage.getItem('product_reviews') || '[]');
        return reviews.some(review => review.orderId === orderId);
    }

    generateStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star active"></i>';
            } else {
                stars += '<i class="fas fa-star"></i>';
            }
        }
        return stars;
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
function toggleMobileMenu() {
    const navMenu = document.querySelector('nav ul');
    if (navMenu) {
        navMenu.classList.toggle('show');
    }
}

function studentLogout() {
    localStorage.removeItem('currentStudent');
    window.location.href = '../index.html';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Add CSS for star ratings
const style = document.createElement('style');
style.textContent = `
    .star-rating {
        display: flex;
        gap: 0.25rem;
        margin: 0.5rem 0;
    }
    
    .star-rating .fa-star {
        color: #666;
        cursor: pointer;
        transition: color 0.2s ease;
    }
    
    .star-rating .fa-star.active,
    .star-rating .fa-star:hover {
        color: #FFD700;
    }
    
    .review-rating .fa-star.active {
        color: #FFD700;
    }
    
    .review-images {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
    }
    
    .review-images img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        cursor: pointer;
        border: 1px solid rgba(255,215,0,0.3);
    }
    
    .photo-preview {
        display: flex;
        gap: 0.5rem;
        margin: 0.5rem 0;
        flex-wrap: wrap;
    }
    
    .photo-preview img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid rgba(255,215,0,0.3);
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.studentReviewsManager = new StudentReviewsManager();
});