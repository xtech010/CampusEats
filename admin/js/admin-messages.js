class AdminMessagesManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.loadConversations();
        this.setupEventListeners();
    }

    checkAdminAuth() {
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (!adminLoggedIn) {
            window.location.href = 'admin.html';
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('messageSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchConversations(e.target.value));
        }
    }

    loadConversations() {
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const conversations = this.groupMessagesIntoConversations(messages);
        this.displayConversations(conversations);
    }

    groupMessagesIntoConversations(messages) {
        const conversations = {};
        
        messages.forEach(message => {
            const convId = this.generateConversationId(message.studentId, message.vendorId);
            
            if (!conversations[convId]) {
                conversations[convId] = {
                    id: convId,
                    studentId: message.studentId,
                    vendorId: message.vendorId,
                    studentName: message.studentName,
                    vendorName: message.vendorName,
                    messages: [],
                    lastMessage: message,
                    unreadCount: 0
                };
            }
            
            conversations[convId].messages.push(message);
            
            // Update last message if this is newer
            if (!conversations[convId].lastMessage || 
                new Date(message.timestamp) > new Date(conversations[convId].lastMessage.timestamp)) {
                conversations[convId].lastMessage = message;
            }
        });

        return Object.values(conversations).sort((a, b) => 
            new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
        );
    }

    generateConversationId(studentId, vendorId) {
        return `conv_${studentId}_${vendorId}`;
    }

    displayConversations(conversations) {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        if (conversations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h4>No Conversations</h4>
                    <p>No messages have been exchanged yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = conversations.map(conv => {
            const lastMessage = conv.lastMessage;
            const preview = lastMessage.message.length > 50 ? 
                lastMessage.message.substring(0, 50) + '...' : lastMessage.message;
            const timeAgo = this.getTimeAgo(lastMessage.timestamp);

            return `
                <div class="conversation-admin-card" onclick="adminMessagesManager.viewConversation('${conv.id}')">
                    <div class="conversation-parties">
                        <div class="party-info">
                            <div class="party-avatar student">
                                <i class="fas fa-user-graduate"></i>
                            </div>
                            <div class="party-details">
                                <strong>${conv.studentName}</strong>
                                <small>Student</small>
                            </div>
                        </div>
                        <div class="conversation-arrow">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                        <div class="party-info">
                            <div class="party-avatar vendor">
                                <i class="fas fa-store"></i>
                            </div>
                            <div class="party-details">
                                <strong>${conv.vendorName}</strong>
                                <small>Vendor</small>
                            </div>
                        </div>
                    </div>
                    <div class="conversation-preview">
                        <p>${preview}</p>
                        <small>${timeAgo}</small>
                    </div>
                    <div class="conversation-id">
                        <small class="unique-id">${conv.id}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    searchConversations(query) {
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const conversations = this.groupMessagesIntoConversations(messages);
        
        const filteredConversations = conversations.filter(conv => 
            conv.id.toLowerCase().includes(query.toLowerCase()) ||
            conv.studentName.toLowerCase().includes(query.toLowerCase()) ||
            conv.vendorName.toLowerCase().includes(query.toLowerCase()) ||
            conv.messages.some(msg => msg.message.toLowerCase().includes(query.toLowerCase()))
        );
        
        this.displayConversations(filteredConversations);
    }

    viewConversation(conversationId) {
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const convMessages = messages.filter(msg => 
            this.generateConversationId(msg.studentId, msg.vendorId) === conversationId
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (convMessages.length === 0) return;

        const firstMessage = convMessages[0];
        const studentName = firstMessage.studentName;
        const vendorName = firstMessage.vendorName;

        const modalContent = document.getElementById('conversationContent');
        modalContent.innerHTML = `
            <div class="conversation-header-admin">
                <h4>Conversation between ${studentName} and ${vendorName}</h4>
                <div class="conversation-id-display">
                    <small class="unique-id">${conversationId}</small>
                </div>
            </div>
            <div class="messages-container-admin">
                ${convMessages.map(msg => `
                    <div class="message-admin ${msg.senderType === 'student' ? 'student-msg' : 'vendor-msg'}">
                        <div class="message-sender">
                            <strong>${msg.senderType === 'student' ? studentName : vendorName}</strong>
                            <small>${this.getTimeAgo(msg.timestamp)}</small>
                        </div>
                        <div class="message-content-admin">
                            ${msg.message}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="conversation-actions-admin">
                <button class="btn btn-outline" onclick="adminMessagesManager.flagConversation('${conversationId}')">
                    <i class="fas fa-flag"></i> Flag Conversation
                </button>
                <button class="btn" onclick="adminMessagesManager.contactParties('${conversationId}')">
                    <i class="fas fa-comment-medical"></i> Send Message to Both
                </button>
            </div>
        `;

        this.showModal('conversationModal');
    }

    flagConversation(conversationId) {
        const reason = prompt('Enter reason for flagging this conversation:');
        if (reason) {
            const flagged = JSON.parse(localStorage.getItem('flagged_conversations') || '[]');
            flagged.push({
                conversationId,
                reason,
                timestamp: new Date().toISOString(),
                resolved: false
            });
            localStorage.setItem('flagged_conversations', JSON.stringify(flagged));
            this.showNotification('Conversation flagged for review', 'warning');
        }
    }

    contactParties(conversationId) {
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const convMessages = messages.filter(msg => 
            this.generateConversationId(msg.studentId, msg.vendorId) === conversationId
        );

        if (convMessages.length === 0) return;

        const firstMessage = convMessages[0];
        const adminMessage = prompt(`Enter admin message to send to ${firstMessage.studentName} and ${firstMessage.vendorName}:`);
        
        if (adminMessage) {
            // Send to student
            this.sendNotificationToStudent(firstMessage.studentId, adminMessage);
            // Send to vendor
            this.sendNotificationToVendor(firstMessage.vendorId, adminMessage);
            
            this.showNotification('Admin message sent to both parties', 'success');
        }
    }

    sendNotificationToStudent(studentId, message) {
        const notifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
        notifications.push({
            studentId,
            title: 'Admin Message',
            message,
            type: 'admin',
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('student_notifications', JSON.stringify(notifications));
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

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return time.toLocaleDateString();
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
    window.adminMessagesManager = new AdminMessagesManager();
});