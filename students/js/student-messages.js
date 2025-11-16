// Student Messages Management
class StudentMessages {
    constructor() {
        this.currentStudent = null;
        this.conversations = [];
        this.currentConversation = null;
        this.init();
    }

    init() {
        this.checkStudentAuth();
        this.loadMessages();
        console.log('Student Messages initialized');
    }

    checkStudentAuth() {
        const studentData = localStorage.getItem('currentStudent');
        if (studentData) {
            this.currentStudent = JSON.parse(studentData);
            console.log('Student authenticated:', this.currentStudent.name);
        } else {
            window.location.href = 'index.html';
        }
    }

    loadMessages() {
        console.log('Loading messages...');
        
        // Get messages and vendors from localStorage
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        
        console.log('Total messages:', messages.length);
        console.log('Total vendors:', vendors.length);
        
        // Filter messages for this student
        const studentMessages = messages.filter(msg => {
            return msg.studentId === this.currentStudent.id;
        });
        
        console.log('Student messages:', studentMessages);
        
        // Group messages by conversation
        this.conversations = this.groupMessagesByConversation(studentMessages, vendors);
        console.log('Conversations:', this.conversations);
        
        this.displayConversations();
    }

    groupMessagesByConversation(messages, vendors) {
        const conversations = {};
        
        messages.forEach(message => {
            const vendorId = message.vendorId;
            const conversationId = `vendor-${vendorId}-student-${this.currentStudent.id}`;
            
            if (!conversations[conversationId]) {
                const vendor = vendors.find(v => v.id === vendorId) || { 
                    businessName: 'Unknown Vendor', 
                    vendorName: 'Vendor',
                    phone: ''
                };
                
                conversations[conversationId] = {
                    id: conversationId,
                    vendorId: vendorId,
                    vendorName: vendor.businessName,
                    vendorContact: vendor.vendorName,
                    vendorPhone: vendor.phone,
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
            
            if (!lastMsg.read && lastMsg.senderType === 'vendor') {
                conversations[conversationId].unreadCount++;
            }
        });
        
        // Convert to array and sort by last message time
        return Object.values(conversations).sort((a, b) => 
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
    }

    displayConversations() {
        const container = document.getElementById('conversationsList');
        
        if (this.conversations.length === 0) {
            container.innerHTML = `
                <div class="empty-conversations">
                    <i class="fas fa-comments" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No messages yet</p>
                    <small>Start a conversation from your orders page</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}" 
                 onclick="studentMessages.openConversation('${conv.id}', ${conv.vendorId})">
                <div class="conversation-avatar">
                    <i class="fas fa-store"></i>
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <h4>${conv.vendorName}</h4>
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

    openConversation(conversationId, vendorId) {
        console.log('Opening conversation:', conversationId);
        
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        
        // Filter messages for this conversation
        const conversationMessages = messages.filter(msg => 
            msg.conversationId === conversationId
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const vendor = vendors.find(v => v.id === vendorId) || { 
            businessName: 'Unknown Vendor', 
            vendorName: 'Vendor',
            phone: ''
        };
        
        this.currentConversation = {
            id: conversationId,
            vendorId: vendorId,
            vendorName: vendor.businessName
        };
        
        this.displayConversation(conversationId, vendor, conversationMessages);
        
        // Mark vendor messages as read
        this.markMessagesAsRead(conversationId);
    }

displayConversation(conversationId, vendor, messages) {
    const container = document.getElementById('messagesView');
    
    container.innerHTML = `
        <div class="conversation-header">
            <div class="conversation-partner">
                <div class="partner-avatar">
                    <i class="fas fa-store"></i>
                </div>
                <div class="partner-info">
                    <h4>${vendor.businessName}</h4>
                    <span>${vendor.vendorName}</span>
                    ${vendor.phone ? `
                        <small>
                            <i class="fas fa-phone"></i> ${vendor.phone}
                        </small>
                    ` : ''}
                </div>
            </div>
            <div class="conversation-actions">
                <button class="btn btn-outline btn-sm back-btn" onclick="studentMessages.goBack()">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <button class="btn btn-outline btn-sm" onclick="studentMessages.viewVendorOrders(${vendor.id})">
                    <i class="fas fa-shopping-cart"></i> Orders
                </button>
                ${vendor.phone ? `
                    <button class="btn btn-outline btn-sm" onclick="studentMessages.callVendor(${vendor.id})">
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
                <div class="message ${msg.senderType === 'student' ? 'sent' : 'received'}">
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
                       onkeypress="if(event.key === 'Enter') studentMessages.sendMessage('${conversationId}', ${vendor.id})">
                ${vendor.phone ? `
                    <button class="btn btn-outline call-btn" onclick="studentMessages.callVendor(${vendor.id})" title="Call Vendor">
                        <i class="fas fa-phone"></i>
                    </button>
                ` : ''}
                <button class="btn send-btn" onclick="studentMessages.sendMessage('${conversationId}', ${vendor.id})">
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

    sendMessage(conversationId, vendorId) {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        
        if (!content) {
            this.showNotification('Please type a message', 'error');
            return;
        }
        
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        
        const newMessage = {
            id: Date.now(),
            conversationId: conversationId,
            vendorId: vendorId,
            studentId: this.currentStudent.id,
            studentName: this.currentStudent.name,
            vendorName: this.currentConversation.vendorName,
            content: content,
            senderType: 'student',
            timestamp: new Date().toISOString(),
            read: false
        };
        
        messages.push(newMessage);
        localStorage.setItem('vendor_messages', JSON.stringify(messages));
        
        // Clear input
        input.value = '';
        
        // Add the message to the UI immediately
        this.addMessageToUI(newMessage);
        
        this.showNotification('Message sent!', 'success');
        
        // Reload conversations to update the last message preview
        setTimeout(() => {
            this.loadMessages();
        }, 100);
    }

    addMessageToUI(message) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;
        
        // Remove "no messages" text if it exists
        const noMessages = messagesList.querySelector('.no-messages');
        if (noMessages) {
            noMessages.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.senderType === 'student' ? 'sent' : 'received'}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message.content}</p>
                <span class="message-time">${this.formatMessageTime(message.timestamp)}</span>
            </div>
        `;
        messagesList.appendChild(messageElement);
        
        // Scroll to bottom to show the new message
        this.scrollToBottom();
    }

    goBack() {
        // Clear current conversation and show conversation list
        this.currentConversation = null;
        this.showConversationList();
    }

    showConversationList() {
        const container = document.getElementById('messagesView');
        container.innerHTML = `
            <div class="no-conversation-selected">
                <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3 style="color: #FFD700; margin-bottom: 0.5rem;">Select a Conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
            </div>
        `;
    }

    callVendor(vendorId) {
        const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
        const vendor = vendors.find(v => v.id === vendorId);
        
        if (vendor && vendor.phone) {
            // Format phone number for tel: link
            const phoneNumber = vendor.phone.replace(/\s+/g, '');
            
            // Show confirmation before calling
            if (confirm(`Call ${vendor.businessName} at ${vendor.phone}?`)) {
                // Create tel link
                window.location.href = `tel:${phoneNumber}`;
            }
        } else {
            this.showNotification('Vendor phone number not available.', 'error');
        }
    }

    markMessagesAsRead(conversationId) {
        const messages = JSON.parse(localStorage.getItem('vendor_messages') || '[]');
        let updated = false;
        
        const updatedMessages = messages.map(msg => {
            if (msg.conversationId === conversationId && !msg.read && msg.senderType === 'vendor') {
                updated = true;
                return { ...msg, read: true };
            }
            return msg;
        });
        
        if (updated) {
            localStorage.setItem('vendor_messages', JSON.stringify(updatedMessages));
            this.loadMessages(); // Update unread counts
        }
    }

    scrollToBottom() {
        const messagesList = document.getElementById('messagesList');
        if (messagesList) {
            setTimeout(() => {
                messagesList.scrollTop = messagesList.scrollHeight;
            }, 100);
        }
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

    viewVendorOrders(vendorId) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const vendorOrders = orders.filter(order => 
            order.vendorId === vendorId && order.studentId === this.currentStudent.id
        );
        
        let ordersInfo = `Your orders with this vendor:\n\n`;
        
        if (vendorOrders.length === 0) {
            ordersInfo += 'No orders found';
        } else {
            vendorOrders.forEach(order => {
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
}

// Global functions
function toggleMobileMenu() {
    const navMenu = document.querySelector('nav ul');
    if (navMenu) {
        navMenu.classList.toggle('show');
    }
}

// Initialize messages
document.addEventListener('DOMContentLoaded', function() {
    window.studentMessages = new StudentMessages();
});