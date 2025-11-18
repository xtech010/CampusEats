
class VendorTransactionsManager {
    constructor() {
        this.currentVendor = null;
        this.allTransactions = [];
        this.init();
    }

    init() {
        this.checkVendorAuth();
        this.setupEventListeners();
        this.loadTransactions();
        this.calculateRevenue();
        this.updatePayoutInfo();
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
        const payoutForm = document.getElementById('payoutSetupForm');
        if (payoutForm) {
            payoutForm.addEventListener('submit', (e) => this.handlePayoutSetup(e));
        }
    }

    loadTransactions() {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const vendorOrders = orders.filter(order => order.vendorId === this.currentVendor.id);
        
        this.allTransactions = [];
        
        vendorOrders.forEach(order => {
            const orderTotal = order.totalAmount || order.total || 
                (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);
            
            // Platform fee (7%)
            const platformFee = orderTotal * 0.07;
            const vendorEarnings = orderTotal - platformFee;
            
            if (order.status === 'completed') {
                // Order payment transaction
                this.allTransactions.push({
                    id: `order_${order.id}`,
                    type: 'order',
                    orderId: order.id,
                    amount: vendorEarnings,
                    fee: platformFee,
                    total: orderTotal,
                    description: `Order #${order.id} - ${order.studentName || 'Customer'}`,
                    date: order.completedAt || order.updatedAt,
                    status: 'completed'
                });
            } else if (order.status === 'cancelled') {
                // Refund transaction (if applicable)
                this.allTransactions.push({
                    id: `refund_${order.id}`,
                    type: 'refund',
                    orderId: order.id,
                    amount: -orderTotal,
                    fee: 0,
                    total: -orderTotal,
                    description: `Refund for Order #${order.id}`,
                    date: order.updatedAt,
                    status: 'completed'
                });
            }
        });

        // Sort by date (newest first)
        this.allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.displayTransactions(this.allTransactions);
    }

    calculateRevenue() {
        const totalRevenue = this.allTransactions
            .filter(t => t.type === 'order')
            .reduce((sum, transaction) => sum + transaction.total, 0);
            
        const totalFees = this.allTransactions
            .filter(t => t.type === 'order')
            .reduce((sum, transaction) => sum + transaction.fee, 0);
            
        const netEarnings = this.allTransactions
            .reduce((sum, transaction) => sum + transaction.amount, 0);

        // This month's earnings
        const now = new Date();
        const thisMonth = this.allTransactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === now.getMonth() && 
                       transactionDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum, transaction) => sum + transaction.amount, 0);

        this.updateElement('totalRevenue', `₦${Math.round(totalRevenue).toLocaleString()}`);
        this.updateElement('platformFees', `₦${Math.round(totalFees).toLocaleString()}`);
        this.updateElement('netEarnings', `₦${Math.round(netEarnings).toLocaleString()}`);
        this.updateElement('thisMonth', `₦${Math.round(thisMonth).toLocaleString()}`);
    }

    displayTransactions(transactions) {
        const container = document.getElementById('transactionsList');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h4>No Transactions Found</h4>
                    <p>You haven't completed any orders yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(transaction => {
            const isPositive = transaction.amount >= 0;
            const icon = transaction.type === 'order' ? 'shopping-cart' : 
                        transaction.type === 'refund' ? 'undo' : 'percentage';
            const typeText = transaction.type === 'order' ? 'Order Payment' : 
                           transaction.type === 'refund' ? 'Refund' : 'Platform Fee';

            return `
                <div class="transaction-card" onclick="vendorTransactionsManager.viewTransactionDetails('${transaction.id}')">
                    <div class="transaction-icon">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div class="transaction-info">
                        <div class="transaction-header">
                            <h4>${transaction.description}</h4>
                            <span class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                                ${isPositive ? '+' : ''}₦${Math.abs(transaction.amount).toLocaleString()}
                            </span>
                        </div>
                        <div class="transaction-details">
                            <span class="transaction-type">${typeText}</span>
                            <span class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                        ${transaction.fee > 0 ? `
                            <div class="transaction-fee">
                                Platform fee: -₦${transaction.fee.toLocaleString()}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    filterTransactions() {
        const timeFilter = document.getElementById('timeFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;

        let filteredTransactions = this.allTransactions;

        // Time filter
        if (timeFilter !== 'all') {
            const now = new Date();
            filteredTransactions = filteredTransactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                switch (timeFilter) {
                    case 'today':
                        return transactionDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return transactionDate >= weekAgo;
                    case 'month':
                        return transactionDate.getMonth() === now.getMonth() && 
                               transactionDate.getFullYear() === now.getFullYear();
                    case 'last-month':
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                        return transactionDate >= lastMonth && transactionDate <= endOfLastMonth;
                    default:
                        return true;
                }
            });
        }

        // Type filter
        if (typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => transaction.type === typeFilter);
        }

        this.displayTransactions(filteredTransactions);
    }

    viewTransactionDetails(transactionId) {
        const transaction = this.allTransactions.find(t => t.id === transactionId);
        if (!transaction) return;

        const modalContent = document.getElementById('transactionDetailsContent');
        modalContent.innerHTML = `
            <div class="transaction-detail-section">
                <h4>Transaction Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Transaction ID</label>
                        <span class="unique-id">${transaction.id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Type</label>
                        <span>${transaction.type === 'order' ? 'Order Payment' : 
                               transaction.type === 'refund' ? 'Refund' : 'Platform Fee'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Date</label>
                        <span>${new Date(transaction.date).toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        <span class="order-status ${transaction.status}">${transaction.status}</span>
                    </div>
                </div>
            </div>

            <div class="transaction-detail-section">
                <h4>Amount Details</h4>
                <div class="amount-breakdown">
                    <div class="amount-row">
                        <span>Order Total</span>
                        <span>₦${transaction.total.toLocaleString()}</span>
                    </div>
                    ${transaction.fee > 0 ? `
                    <div class="amount-row fee">
                        <span>Platform Fee (7%)</span>
                        <span>-₦${transaction.fee.toLocaleString()}</span>
                    </div>
                    ` : ''}
                    <div class="amount-row total">
                        <span><strong>Net Amount</strong></span>
                        <span><strong>₦${transaction.amount.toLocaleString()}</strong></span>
                    </div>
                </div>
            </div>

            ${transaction.orderId ? `
            <div class="transaction-detail-section">
                <h4>Related Order</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Order ID</label>
                        <span class="unique-id">#${transaction.orderId}</span>
                    </div>
                    <div class="detail-item">
                        <label>Description</label>
                        <span>${transaction.description}</span>
                    </div>
                </div>
            </div>
            ` : ''}
        `;

        this.showModal('transactionDetailsModal');
    }

    updatePayoutInfo() {
        const vendorData = JSON.parse(localStorage.getItem('currentVendor'));
        
        // Calculate next payout date (every Friday)
        const nextPayout = this.getNextPayoutDate();
        this.updateElement('nextPayoutDate', nextPayout.toLocaleDateString());
        
        // Calculate available payout (net earnings from completed orders)
        const availablePayout = this.allTransactions
            .filter(t => t.status === 'completed' && t.amount > 0)
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        this.updateElement('availablePayout', `₦${Math.round(availablePayout).toLocaleString()}`);
        
        // Bank account info
        if (vendorData.bankAccount) {
            this.updateElement('bankAccount', `${vendorData.bankAccount.bankName} ••••${vendorData.bankAccount.accountNumber.slice(-4)}`);
        }
    }

    getNextPayoutDate() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 - dayOfWeek + 7;
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + daysUntilFriday);
        return nextFriday;
    }

    setupPayout() {
        this.showModal('payoutSetupModal');
    }

    handlePayoutSetup(e) {
        e.preventDefault();
        
        const bankName = document.getElementById('bankName').value;
        const accountNumber = document.getElementById('accountNumber').value;
        const accountName = document.getElementById('accountName').value;
        const accountType = document.getElementById('accountType').value;

        const vendorData = JSON.parse(localStorage.getItem('currentVendor'));
        vendorData.bankAccount = {
            bankName,
            accountNumber,
            accountName,
            accountType,
            verified: true
        };

        localStorage.setItem('currentVendor', JSON.stringify(vendorData));
        
        this.showNotification('Bank account setup successfully!', 'success');
        this.closeModal('payoutSetupModal');
        this.updatePayoutInfo();
    }

    requestPayout() {
        const vendorData = JSON.parse(localStorage.getItem('currentVendor'));
        
        if (!vendorData.bankAccount) {
            this.showNotification('Please setup your bank account first', 'error');
            this.setupPayout();
            return;
        }

        const availablePayout = this.allTransactions
            .filter(t => t.status === 'completed' && t.amount > 0)
            .reduce((sum, transaction) => sum + transaction.amount, 0);

        if (availablePayout < 1000) {
            this.showNotification('Minimum payout amount is ₦1,000', 'error');
            return;
        }

        // Create payout request
        const payouts = JSON.parse(localStorage.getItem('vendor_payouts') || '[]');
        payouts.push({
            id: Date.now(),
            vendorId: this.currentVendor.id,
            amount: availablePayout,
            bankAccount: vendorData.bankAccount,
            status: 'pending',
            requestedAt: new Date().toISOString()
        });

        localStorage.setItem('vendor_payouts', JSON.stringify(payouts));
        
        this.showNotification('Payout request submitted successfully! It will be processed within 2-3 business days.', 'success');
    }

    exportTransactions() {
        // Simple CSV export
        const headers = ['Date', 'Type', 'Description', 'Amount', 'Fee', 'Net Amount'];
        const csvData = this.allTransactions.map(transaction => [
            new Date(transaction.date).toLocaleDateString(),
            transaction.type === 'order' ? 'Order Payment' : transaction.type,
            transaction.description,
            transaction.total,
            transaction.fee,
            transaction.amount
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Transactions exported successfully!', 'success');
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

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// Initialize vendor transactions manager
document.addEventListener('DOMContentLoaded', function() {
    window.vendorTransactionsManager = new VendorTransactionsManager();
});
