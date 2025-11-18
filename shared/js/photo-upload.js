class PhotoUploadManager {
    constructor() {
        this.uploadedFiles = [];
        this.currentUser = null;
        this.userType = null;
        this.init();
    }

    init() {
        this.checkUserAuth();
        this.setupEventListeners();
        this.loadUserData();
    }

    checkUserAuth() {
        const studentData = localStorage.getItem('currentStudent');
        const vendorData = localStorage.getItem('currentVendor');
        
        if (studentData) {
            this.currentUser = JSON.parse(studentData);
            this.userType = 'student';
        } else if (vendorData) {
            this.currentUser = JSON.parse(vendorData);
            this.userType = 'vendor';
        } else {
            // Redirect to login if no user is logged in
            window.location.href = '../index.html';
        }
    }

    loadUserData() {
        if (this.userType === 'vendor') {
            this.loadVendorProducts();
        } else if (this.userType === 'student') {
            this.loadStudentReviews();
        }
    }

    loadVendorProducts() {
        const products = JSON.parse(localStorage.getItem('vendor_products') || '[]');
        const vendorProducts = products.filter(p => p.vendorId === this.currentUser.id);
        
        const productSelect = document.getElementById('relatedProduct');
        if (productSelect) {
            vendorProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                productSelect.appendChild(option);
            });
        }
    }

    loadStudentReviews() {
        const reviews = JSON.parse(localStorage.getItem('product_reviews') || '[]');
        const studentReviews = reviews.filter(r => r.studentId === this.currentUser.id);
        
        const reviewSelect = document.getElementById('relatedReview');
        if (reviewSelect) {
            studentReviews.forEach(review => {
                const option = document.createElement('option');
                option.value = review.id;
                option.textContent = `${review.productName} - ${new Date(review.createdAt).toLocaleDateString()}`;
                reviewSelect.appendChild(option);
            });
        }
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadType = document.getElementById('uploadType');
        const submitButton = document.getElementById('submitUpload');

        // Upload area click
        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                this.handleFiles(e.dataTransfer.files);
            });
        }

        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });
        }

        // Upload type change
        if (uploadType) {
            uploadType.addEventListener('change', (e) => {
                this.handleUploadTypeChange(e.target.value);
            });
        }

        // Submit button
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                this.submitPhotos();
            });
        }
    }

    handleUploadTypeChange(type) {
        // Hide all sections first
        document.querySelectorAll('.upload-type-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show relevant section
        if (type === 'product') {
            document.getElementById('productUploadSection').classList.remove('hidden');
        } else if (type === 'review') {
            document.getElementById('reviewUploadSection').classList.remove('hidden');
        }
    }

    handleFiles(files) {
        const validFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/') && 
            file.size <= 5 * 1024 * 1024
        );

        if (validFiles.length === 0) {
            this.showNotification('Please select valid image files (max 5MB each)', 'error');
            return;
        }

        if (this.uploadedFiles.length + validFiles.length > 10) {
            this.showNotification('Maximum 10 photos allowed per upload', 'error');
            return;
        }

        validFiles.forEach(file => {
            this.previewFile(file);
        });

        this.updateSubmitButton();
    }

    previewFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const fileId = Date.now() + Math.random();
            this.uploadedFiles.push({
                id: fileId,
                file: file,
                url: e.target.result
            });

            const previewGrid = document.getElementById('photoPreview');
            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <div class="photo-actions">
                    <button class="photo-action-btn" onclick="photoUploadManager.removeFile(${fileId})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            previewGrid.appendChild(previewItem);
        };

        reader.readAsDataURL(file);
    }

    removeFile(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== fileId);
        
        // Remove from preview
        const previewGrid = document.getElementById('photoPreview');
        previewGrid.innerHTML = '';
        
        // Regenerate previews
        this.uploadedFiles.forEach(file => {
            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview';
            previewItem.innerHTML = `
                <img src="${file.url}" alt="Preview">
                <div class="photo-actions">
                    <button class="photo-action-btn" onclick="photoUploadManager.removeFile(${file.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            previewGrid.appendChild(previewItem);
        });

        this.updateSubmitButton();
    }

    updateSubmitButton() {
        const submitButton = document.getElementById('submitUpload');
        const uploadType = document.getElementById('uploadType').value;

        if (this.uploadedFiles.length > 0 && uploadType) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    }

    async submitPhotos() {
        const uploadType = document.getElementById('uploadType').value;
        const description = document.getElementById('photoDescription').value;
        const relatedProduct = document.getElementById('relatedProduct')?.value || '';
        const relatedReview = document.getElementById('relatedReview')?.value || '';

        if (!uploadType) {
            this.showNotification('Please select an upload type', 'error');
            return;
        }

        if (this.uploadedFiles.length === 0) {
            this.showNotification('Please select at least one photo to upload', 'error');
            return;
        }

        // Show progress
        this.showUploadProgress();

        try {
            // Simulate upload progress
            for (let i = 0; i <= 100; i += 10) {
                await this.updateProgress(i);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Store photos for moderation
            this.storePhotosForModeration(uploadType, description, relatedProduct, relatedReview);

            // Show success
            this.showUploadSuccess();

        } catch (error) {
            this.showNotification('Upload failed. Please try again.', 'error');
        }
    }

    showUploadProgress() {
        const progressSection = document.getElementById('uploadProgress');
        progressSection.classList.remove('hidden');
    }

    updateProgress(percent) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressText) progressText.textContent = `Uploading... ${percent}%`;
    }

    storePhotosForModeration(uploadType, description, relatedProduct, relatedReview) {
        const photos = JSON.parse(localStorage.getItem('uploaded_photos') || '[]');
        
        this.uploadedFiles.forEach(uploadedFile => {
            const photoData = {
                id: Date.now() + Math.random(),
                url: uploadedFile.url,
                type: uploadType,
                uploaderId: this.currentUser.id,
                uploaderName: this.userType === 'student' ? this.currentUser.name : this.currentUser.businessName,
                uploaderType: this.userType,
                description: description,
                uploadedAt: new Date().toISOString(),
                adminStatus: 'pending'
            };

            // Add related information based on upload type
            if (uploadType === 'product' && relatedProduct) {
                photoData.relatedTo = `Product ID: ${relatedProduct}`;
            } else if (uploadType === 'review' && relatedReview) {
                photoData.relatedTo = `Review ID: ${relatedReview}`;
            }

            photos.push(photoData);
        });

        localStorage.setItem('uploaded_photos', JSON.stringify(photos));

        // Create admin notification
        this.createAdminNotification();
    }

    createAdminNotification() {
        const adminNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
        
        adminNotifications.push({
            id: Date.now(),
            type: 'photo_upload',
            title: 'New Photos for Moderation',
            message: `${this.userType === 'student' ? this.currentUser.name : this.currentUser.businessName} uploaded ${this.uploadedFiles.length} photo(s) for moderation.`,
            timestamp: new Date().toISOString(),
            read: false
        });

        localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));
    }

    showUploadSuccess() {
        this.showModal('uploadSuccessModal');
    }

    clearUploads() {
        this.uploadedFiles = [];
        document.getElementById('photoPreview').innerHTML = '';
        document.getElementById('fileInput').value = '';
        document.getElementById('submitUpload').disabled = true;
        document.getElementById('uploadProgress').classList.add('hidden');
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
function clearUploads() {
    if (window.photoUploadManager) {
        window.photoUploadManager.clearUploads();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.photoUploadManager = new PhotoUploadManager();
});