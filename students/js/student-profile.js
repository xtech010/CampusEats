class StudentProfileManager {
    constructor() {
        this.currentStudent = null;
        this.init();
    }

    init() {
        this.checkStudentAuth();
        this.setupEventListeners();
        this.loadStudentProfile();
    }

    checkStudentAuth() {
        const studentData = localStorage.getItem('currentStudent');
        if (studentData) {
            this.currentStudent = JSON.parse(studentData);
            this.setupUserMenu();
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
        const personalInfoForm = document.getElementById('personalInfoForm');
        if (personalInfoForm) {
            personalInfoForm.addEventListener('submit', (e) => this.handlePersonalInfoUpdate(e));
        }

        const securityForm = document.getElementById('securityForm');
        if (securityForm) {
            securityForm.addEventListener('submit', (e) => this.handlePasswordUpdate(e));
        }

        const preferencesForm = document.getElementById('preferencesForm');
        if (preferencesForm) {
            preferencesForm.addEventListener('submit', (e) => this.handlePreferencesUpdate(e));
        }
    }

    loadStudentProfile() {
        if (!this.currentStudent) return;

        // Load basic info
        this.updateElement('profileName', this.currentStudent.name);
        this.updateElement('profileEmail', this.currentStudent.email);
        this.updateElement('fullName', this.currentStudent.name);
        this.updateElement('email', this.currentStudent.email);
        this.updateElement('studentId', this.currentStudent.studentId || '');
        this.updateElement('phone', this.currentStudent.phone || '');
        this.updateElement('deliveryAddress', this.currentStudent.deliveryAddress || '');

        // Load avatar if exists
        if (this.currentStudent.profileImage) {
            const avatar = document.getElementById('profileAvatar');
            avatar.innerHTML = `<img src="${this.currentStudent.profileImage}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }

        // Load stats
        this.loadStudentStats();

        // Load preferences
        this.loadStudentPreferences();
    }

    loadStudentStats() {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const studentOrders = orders.filter(order => order.studentId === this.currentStudent.id);
        
        const reviews = JSON.parse(localStorage.getItem('product_reviews') || '[]');
        const studentReviews = reviews.filter(review => review.studentId === this.currentStudent.id);

        this.updateElement('totalOrders', studentOrders.length);
        this.updateElement('totalReviews', studentReviews.length);
        
        const joinYear = new Date(this.currentStudent.joinedAt).getFullYear();
        this.updateElement('memberSince', joinYear);
    }

    loadStudentPreferences() {
        if (this.currentStudent.preferences) {
            // Notifications
            if (this.currentStudent.preferences.emailNotifications !== undefined) {
                document.getElementById('emailNotifications').checked = this.currentStudent.preferences.emailNotifications;
            }
            if (this.currentStudent.preferences.smsNotifications !== undefined) {
                document.getElementById('smsNotifications').checked = this.currentStudent.preferences.smsNotifications;
            }
            if (this.currentStudent.preferences.promotionalEmails !== undefined) {
                document.getElementById('promotionalEmails').checked = this.currentStudent.preferences.promotionalEmails;
            }

            // Preferred categories
            if (this.currentStudent.preferences.categories) {
                this.currentStudent.preferences.categories.forEach(category => {
                    const checkbox = document.querySelector(`input[name="preferredCategories"][value="${category}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }
        }
    }

    handlePersonalInfoUpdate(e) {
        e.preventDefault();
        
        const name = document.getElementById('fullName').value;
        const studentId = document.getElementById('studentId').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const deliveryAddress = document.getElementById('deliveryAddress').value;

        if (!name || !email) {
            this.showNotification('Name and email are required', 'error');
            return;
        }

        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        const studentIndex = students.findIndex(s => s.id === this.currentStudent.id);
        
        if (studentIndex !== -1) {
            students[studentIndex].name = name;
            students[studentIndex].studentId = studentId;
            students[studentIndex].email = email;
            students[studentIndex].phone = phone;
            students[studentIndex].deliveryAddress = deliveryAddress;
            students[studentIndex].updatedAt = new Date().toISOString();

            localStorage.setItem('student_accounts', JSON.stringify(students));
            
            // Update current student
            this.currentStudent = students[studentIndex];
            localStorage.setItem('currentStudent', JSON.stringify(this.currentStudent));
            
            this.updateElement('profileName', name);
            this.updateElement('userName', name.split(' ')[0]);
            
            this.showNotification('Personal information updated successfully', 'success');
        }
    }

    handlePasswordUpdate(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword) {
            this.showNotification('Please enter your current password', 'error');
            return;
        }

        if (currentPassword !== this.currentStudent.password) {
            this.showNotification('Current password is incorrect', 'error');
            return;
        }

        if (!newPassword) {
            this.showNotification('Please enter a new password', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        const studentIndex = students.findIndex(s => s.id === this.currentStudent.id);
        
        if (studentIndex !== -1) {
            students[studentIndex].password = newPassword;
            localStorage.setItem('student_accounts', JSON.stringify(students));
            
            // Update current student
            this.currentStudent.password = newPassword;
            localStorage.setItem('currentStudent', JSON.stringify(this.currentStudent));
            
            // Clear form
            document.getElementById('securityForm').reset();
            
            this.showNotification('Password updated successfully', 'success');
        }
    }

    handlePreferencesUpdate(e) {
        e.preventDefault();
        
        const emailNotifications = document.getElementById('emailNotifications').checked;
        const smsNotifications = document.getElementById('smsNotifications').checked;
        const promotionalEmails = document.getElementById('promotionalEmails').checked;
        
        const preferredCategories = Array.from(document.querySelectorAll('input[name="preferredCategories"]:checked'))
            .map(checkbox => checkbox.value);

        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        const studentIndex = students.findIndex(s => s.id === this.currentStudent.id);
        
        if (studentIndex !== -1) {
            if (!students[studentIndex].preferences) {
                students[studentIndex].preferences = {};
            }
            
            students[studentIndex].preferences.emailNotifications = emailNotifications;
            students[studentIndex].preferences.smsNotifications = smsNotifications;
            students[studentIndex].preferences.promotionalEmails = promotionalEmails;
            students[studentIndex].preferences.categories = preferredCategories;

            localStorage.setItem('student_accounts', JSON.stringify(students));
            
            // Update current student
            this.currentStudent.preferences = students[studentIndex].preferences;
            localStorage.setItem('currentStudent', JSON.stringify(this.currentStudent));
            
            this.showNotification('Preferences updated successfully', 'success');
        }
    }

    handleAvatarUpload(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showNotification('Please select an image file', 'error');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('Image size should be less than 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                
                // Update avatar display
                const avatar = document.getElementById('profileAvatar');
                avatar.innerHTML = `<img src="${imageUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                
                // Store photo for moderation
                this.storeProfilePhotoForModeration(file);
                
                // Update student profile
                this.updateStudentAvatar(imageUrl);
            };
            
            reader.readAsDataURL(file);
        }
    }

    storeProfilePhotoForModeration(imageFile) {
        const photos = JSON.parse(localStorage.getItem('uploaded_photos') || '[]');
        
        photos.push({
            id: Date.now(),
            url: URL.createObjectURL(imageFile),
            type: 'profile',
            uploaderId: this.currentStudent.id,
            uploaderName: this.currentStudent.name,
            uploaderType: 'student',
            description: 'Profile photo',
            uploadedAt: new Date().toISOString(),
            adminStatus: 'pending'
        });

        localStorage.setItem('uploaded_photos', JSON.stringify(photos));
    }

    updateStudentAvatar(imageUrl) {
        const students = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        const studentIndex = students.findIndex(s => s.id === this.currentStudent.id);
        
        if (studentIndex !== -1) {
            students[studentIndex].profileImage = imageUrl;
            localStorage.setItem('student_accounts', JSON.stringify(students));
            
            // Update current student
            this.currentStudent.profileImage = imageUrl;
            localStorage.setItem('currentStudent', JSON.stringify(this.currentStudent));
            
            this.showNotification('Profile photo updated successfully', 'success');
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value;
            }
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
function handleAvatarUpload(input) {
    if (window.studentProfileManager) {
        window.studentProfileManager.handleAvatarUpload(input);
    }
}

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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.studentProfileManager = new StudentProfileManager();
});