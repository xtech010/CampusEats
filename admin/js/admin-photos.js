class AdminPhotosManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.loadPhotos();
        this.setupEventListeners();
    }

    checkAdminAuth() {
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (!adminLoggedIn) {
            window.location.href = 'admin.html';
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('photoSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchPhotos(e.target.value));
        }
    }

    loadPhotos() {
        const photos = JSON.parse(localStorage.getItem('uploaded_photos') || '[]');
        // Sort by latest first
        photos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        this.displayPhotos(photos);
    }

    displayPhotos(photos) {
        const container = document.getElementById('photosList');
        if (!container) return;

        if (photos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <h4>No Photos</h4>
                    <p>No photos awaiting moderation.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = photos.map(photo => {
            const status = photo.adminStatus || 'pending';

            return `
                <div class="photo-admin-card ${status}" onclick="adminPhotosManager.viewPhotoDetails('${photo.id}')">
                    <div class="photo-admin-image">
                        <img src="${photo.url}" alt="${photo.description || 'Uploaded photo'}" 
                             onerror="this.src='https://via.placeholder.com/150x150?text=Photo'">
                    </div>
                    <div class="photo-admin-info">
                        <div class="photo-basic-info">
                            <h4>${this.getPhotoTypeText(photo.type)} Photo</h4>
                            <p>Uploaded by: ${photo.uploaderName}</p>
                            ${photo.description ? `<p>Description: ${photo.description}</p>` : ''}
                            <p class="photo-date">${new Date(photo.uploadedAt).toLocaleDateString()}</p>
                        </div>
                        <div class="photo-admin-meta">
                            <span class="photo-status ${status}">${this.getStatusText(status)}</span>
                            ${photo.relatedTo ? `<span class="photo-related">Related to: ${photo.relatedTo}</span>` : ''}
                        </div>
                    </div>
                    <div class="photo-admin-actions">
                        ${status === 'pending' ? `
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); adminPhotosManager.approvePhoto('${photo.id}')">
                                Approve
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); adminPhotosManager.showRejectionForm('${photo.id}')">
                                Reject
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    searchPhotos(query) {
        const photos = JSON.parse(localStorage.getItem('uploaded_photos') || '[]');
        const filteredPhotos = photos.filter(photo => 
            photo.uploaderName.toLowerCase().includes(query.toLowerCase()) ||
            (photo.description && photo.description.toLowerCase().includes(query.toLowerCase())) ||
            (photo.relatedTo && photo.relatedTo.toLowerCase().includes(query.toLowerCase())) ||
            photo.type.toLowerCase().includes(query.toLowerCase())
        );
        this.displayPhotos(filteredPhotos);
    }

    filterPhotos() {
        const statusFilter = document.getElementById('statusFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const photos = JSON.parse(localStorage.getItem('uploaded_photos') || '[]');

        let filteredPhotos = photos;

        // Status filter
        if (statusFilter !== 'all') {
            filteredPhotos = filteredPhotos.filter(photo => 
                (photo.adminStatus || 'pending') === statusFilter
            );
        }

        // Type filter
        if (typeFilter !== 'all') {
            filteredPhotos = filteredPhotos.filter(photo => 
                photo.type === typeFilter
            );
        }

        this.displayPhotos(filteredPhotos);
    }

    viewPhotoDetails(photoId) {
        const photos = JSON.parse(localStorage.getItem('uploaded_photos') || '[]');
        const photo = photos.find(p => p.id === photoId);
        
        if (!photo) return;

        const status = photo.adminStatus || 'pending';

        const modalContent = document.getElementById('photoDetailsContent');
        modalContent.innerHTML = `
            <div class="photo-detail-section">
                <div class="photo-detail-image-large">
                    <img src="${photo.url}" alt="${photo.description || 'Uploaded photo'}" 
                         onerror="this.src='https://via.placeholder.com/400x300?text=Photo+Not+Found'">
                </div>
            </div>

            <div class="photo-detail-section">
                <h4>Photo Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Photo Type</label>
                        <span>${this.getPhotoTypeText(photo.type)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Uploaded By</label>
                        <span>${photo.uploaderName} (${photo.uploaderType})</span>
                    </div>
                    <div class="detail-item">
                        <label>Upload Date</label>
                        <span>${new Date(photo.uploadedAt).toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        <span class="photo-status ${status}">${this.getStatusText(status)}</span>
                    </div>
                    ${photo.relatedTo ? `
                    <div class="detail-item">
                        <label>Related To</label>
                        <span>${photo.relatedTo}</span>
                    </div>
                    ` : ''}
                    ${photo.description ? `
                    <div class="detail-item full-width">
                        <label>Description</label>
                        <p>${photo.description}</p>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="photo-detail-section">
                <h4>Moderation Actions</h4>
                <div class="action-buttons">
                    ${status === 'pending' ? `
                        <button class="btn btn-primary" onclick="adminPhotosManager.approvePhoto('${photo.id}')">
                            <i class="fas fa-check"></i> Approve Photo
                        </button>
                        <button class="btn btn-outline" onclick="adminPhotosManager.showRejectionForm('${photo.id}')">
                            <i class="fas fa-times"></i> Reject Photo
                        </button>
                    ` : status === 'approved' ? `
                        <button class="btn btn-outline" onclick="adminPhotosManager.unapprovePhoto('${photo.id}')">
                            <i class="fas fa-undo"></i> Revoke Approval
                        </button>
                    ` : status === 'rejected' ? `
                        <button class="btn btn-primary" onclick="adminPhotosManager.approvePhoto('${photo.id}')">
                            <i class="fas fa-redo"></i> Re-approve Photo
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        this.showModal('photoDetailsModal');
    }

    approvePhoto(photoId) {
        const photos = JSON.parse(localStorage.getItem('uploaded_photos') || '[]');
        const photoIndex = photos.findIndex(p => p.id === photoId);
        
        if (photoIndex !== -1) {
            photos[photoIndex].adminStatus = 'approved';
            photos[photoIndex].reviewedAt = new Date().toISOString();
            photos[photoIndex].reviewedBy = 'admin';
            localStorage.setItem('uploaded_photos', JSON.stringify(photos));
            
            this.sendNotificationToUploader(photos[photoIndex].uploaderId, photos[photoIndex].uploaderType,
                `Your photo has been approved and is now visible on CampusEats.`);
            
            this.showNotification('Photo approved successfully', 'success');
            this.loadPhotos();
            this.closeModal('photoDetailsModal');
        }
    }

    showRejectionForm(photoId) {
        const photos = JSON.parse(localStorage.getItem('uploaded_photos') || '[]');
        const photo = photos.find(p => p.id === photoId);
        
        if (!photo) return;

        const rejectionContent = document.getElementById('photoRejectionContent');
        rejectionContent.innerHTML = `
            <h4>Reject Photo</h4>
            <div class="form-group">
                <label>Rejection Reason</label>
                <select id="rejectionReason">
                    <option value="poor_quality">Poor Quality/Blurry</option>
                    <option value="inappropriate_content">Inappropriate Content</option>
                    <option value="not_relevant">Not Relevant</option>
                    <option value="copyright_issues">Copyright Issues</option>
                    <option value="contains_personal_info">Contains Personal Information</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Message to User</label>
                <textarea id="rejectionMessage" rows="3" placeholder="Explain why the photo was rejected..." required></textarea>
            </div>
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="adminPhotosManager.rejectPhoto('${photoId}')">
                    Confirm Rejection
                </button>
            </div>
        `;

        this.closeModal('photoDetailsModal');
        this.showModal('photoRejectionModal');
    }

    rejectPhoto(photoId) {
        const rejectionReason = document.getElementById('rejectionReason').value;
        const rejectionMessage = document.getElementById('rejectionMessage').value;
        
        if (!rejectionMessage) {
            this.showNotification('Please provide a rejection message for the user', 'error');
            return;
        }

        const photos = JSON.parse(localStorage.getItem('uploaded_photos') || '[]');
        const photoIndex = photos.findIndex(p => p.id === photoId);
        
        if (photoIndex !== -1) {
            photos[photoIndex].adminStatus = 'rejected';
            photos[photoIndex].rejectionReason = rejectionReason;
            photos[photoIndex].rejectionMessage = rejectionMessage;
            photos[photoIndex].reviewedAt = new Date().toISOString();
            photos[photoIndex].reviewedBy = 'admin';
            
            localStorage.setItem('uploaded_photos', JSON.stringify(photos));
            
            this.sendNotificationToUploader(photos[photoIndex].uploaderId, photos[photoIndex].uploaderType,
                `Your photo has been rejected. Reason: ${rejectionMessage}`);
            
            this.showNotification('Photo rejected successfully', 'success');
            this.loadPhotos();
            this.closeModal('photoRejectionModal');
        }
    }

    unapprovePhoto(photoId) {
        const photos = JSON.parse(localStorage.getItem('uploaded_photos') || '[]');
        const photoIndex = photos.findIndex(p => p.id === photoId);
        
        if (photoIndex !== -1) {
            photos[photoIndex].adminStatus = 'pending';
            localStorage.setItem('uploaded_photos', JSON.stringify(photos));
            
            this.showNotification('Photo approval revoked', 'info');
            this.loadPhotos();
            this.closeModal('photoDetailsModal');
        }
    }

    sendNotificationToUploader(uploaderId, uploaderType, message) {
        if (uploaderType === 'student') {
            const notifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
            notifications.push({
                studentId: uploaderId,
                title: 'Photo Moderation',
                message,
                type: 'admin',
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('student_notifications', JSON.stringify(notifications));
        } else if (uploaderType === 'vendor') {
            const notifications = JSON.parse(localStorage.getItem('vendor_notifications') || '[]');
            notifications.push({
                vendorId: uploaderId,
                title: 'Photo Moderation',
                message,
                type: 'admin',
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('vendor_notifications', JSON.stringify(notifications));
        }
    }

    getPhotoTypeText(type) {
        const typeMap = {
            'product': 'Product',
            'review': 'Review',
            'profile': 'Profile'
        };
        return typeMap[type] || type;
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pending Review',
            'approved': 'Approved',
            'rejected': 'Rejected'
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
    window.adminPhotosManager = new AdminPhotosManager();
});