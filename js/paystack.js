// Paystack Configuration with Escrow System
const PAYSTACK_PUBLIC_KEY = 'pk_test_8bb43c51e2178becd9c9953a478bdba14db5eaec';
const PAYSTACK_SECRET_KEY = 'sk_test_a75c597bebacbb42d3924c60ddf6649056049e9a';

class PaystackPayment {
    constructor() {
        this.publicKey = PAYSTACK_PUBLIC_KEY;
        this.secretKey = PAYSTACK_SECRET_KEY;
        this.commissionRate = 0.7; // 7% commission
    }

    // Initialize payment with escrow tracking
    async initializePayment(email, amount, orderData) {
        return new Promise((resolve, reject) => {
            const metadata = {
                custom_fields: [
                    {
                        display_name: "Order ID",
                        variable_name: "order_id",
                        value: orderData.id
                    },
                    {
                        display_name: "Student ID", 
                        variable_name: "student_id",
                        value: orderData.studentId
                    },
                    {
                        display_name: "Vendor ID",
                        variable_name: "vendor_id", 
                        value: orderData.vendorId
                    },
                    {
                        display_name: "Escrow Amount",
                        variable_name: "escrow_amount",
                        value: amount
                    },
                    {
                        display_name: "Commission Rate",
                        variable_name: "commission_rate", 
                        value: this.commissionRate
                    }
                ]
            };

            const handler = PaystackPop.setup({
                key: this.publicKey,
                email: email,
                amount: amount * 100, // Convert to kobo
                currency: 'NGN',
                ref: 'CE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                metadata: metadata,
                callback: (response) => {
                    // Payment successful - store in escrow
                    this.storeEscrowPayment(orderData.id, response.reference, amount);
                    resolve(response);
                },
                onClose: () => {
                    reject(new Error('Payment window closed'));
                }
            });
            handler.openIframe();
        });
    }

    // Store payment in escrow
    storeEscrowPayment(orderId, reference, amount) {
        const escrowPayments = JSON.parse(localStorage.getItem('escrow_payments') || '{}');
        
        escrowPayments[orderId] = {
            reference: reference,
            amount: amount,
            status: 'held',
            paidAt: new Date().toISOString(),
            commission: amount * this.commissionRate,
            vendorAmount: amount * (1 - this.commissionRate),
            released: false,
            releasedAt: null
        };
        
        localStorage.setItem('escrow_payments', JSON.stringify(escrowPayments));
        console.log(`Payment ${reference} stored in escrow for order ${orderId}`);
    }

    // Verify payment and update order status
    async verifyPayment(reference) {
        try {
            const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.secretKey}`
                }
            });
            
            const result = await response.json();
            
            if (result.status && result.data.status === 'success') {
                // Update escrow status
                this.updateEscrowStatus(reference, 'verified');
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result.message };
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
        }
    }

    // Release payment to vendor (minus commission)
    releasePaymentToVendor(orderId) {
        const escrowPayments = JSON.parse(localStorage.getItem('escrow_payments') || '{}');
        const payment = escrowPayments[orderId];
        
        if (!payment) {
            throw new Error('Payment not found in escrow');
        }
        
        if (payment.released) {
            throw new Error('Payment already released');
        }
        
        // Simulate payment release (in real app, this would call PayStack transfer API)
        payment.status = 'released';
        payment.released = true;
        payment.releasedAt = new Date().toISOString();
        
        // Update vendor earnings
        this.updateVendorEarnings(orderId, payment.vendorAmount);
        
        // Update order status
        this.updateOrderPaymentStatus(orderId, 'released');
        
        localStorage.setItem('escrow_payments', JSON.stringify(escrowPayments));
        
        console.log(`Payment released to vendor: ₦${payment.vendorAmount} (Commission: ₦${payment.commission})`);
        return payment;
    }

    // Update vendor earnings
    updateVendorEarnings(orderId, amount) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const order = orders.find(o => o.id === orderId);
        
        if (order && order.vendorId) {
            const vendors = JSON.parse(localStorage.getItem('vendor_accounts') || '[]');
            const vendor = vendors.find(v => v.id === order.vendorId);
            
            if (vendor) {
                vendor.earnings = (vendor.earnings || 0) + amount;
                vendor.totalOrders = (vendor.totalOrders || 0) + 1;
                
                localStorage.setItem('vendor_accounts', JSON.stringify(vendors));
                console.log(`Vendor ${vendor.businessName} earnings updated: ₦${vendor.earnings}`);
            }
        }
    }

    // Update order payment status
    updateOrderPaymentStatus(orderId, status) {
        const orders = JSON.parse(localStorage.getItem('student_orders') || '[]');
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            order.paymentStatus = status;
            order.updatedAt = new Date().toISOString();
            localStorage.setItem('student_orders', JSON.stringify(orders));
        }
    }

    // Get escrow balance (total held payments)
    getEscrowBalance() {
        const escrowPayments = JSON.parse(localStorage.getItem('escrow_payments') || '{}');
        let totalHeld = 0;
        let totalCommission = 0;
        
        Object.values(escrowPayments).forEach(payment => {
            if (payment.status === 'held') {
                totalHeld += payment.amount;
                totalCommission += payment.commission;
            }
        });
        
        return {
            totalHeld: totalHeld,
            totalCommission: totalCommission,
            availableForRelease: totalHeld - totalCommission
        };
    }

    // Auto-release payments after 24 hours (simulated)
    autoReleasePayments() {
        const escrowPayments = JSON.parse(localStorage.getItem('escrow_payments') || '{}');
        const now = new Date();
        let releasedCount = 0;
        
        Object.entries(escrowPayments).forEach(([orderId, payment]) => {
            if (!payment.released && payment.status === 'held') {
                const paidAt = new Date(payment.paidAt);
                const hoursDiff = (now - paidAt) / (1000 * 60 * 60);
                
                // Auto-release after 24 hours
                if (hoursDiff >= 24) {
                    this.releasePaymentToVendor(orderId);
                    releasedCount++;
                }
            }
        });
        
        if (releasedCount > 0) {
            console.log(`Auto-released ${releasedCount} payments after 24 hours`);
        }
    }
}

// Enhanced payment functions for student cart
async function processOrderPayment(orderData) {
    try {
        const paymentResult = await window.paystack.initializePayment(
            orderData.studentEmail, 
            orderData.totalAmount, 
            orderData
        );
        
        // Verify payment
        const verification = await window.paystack.verifyPayment(paymentResult.reference);
        
        if (verification.success) {
            return {
                success: true,
                reference: paymentResult.reference,
                message: 'Payment successful! Order confirmed.'
            };
        } else {
            return {
                success: false,
                error: 'Payment verification failed'
            };
        }
    } catch (error) {
        console.error('Payment error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Vendor function to release payment
function releaseVendorPayment(orderId) {
    try {
        const payment = window.paystack.releasePaymentToVendor(orderId);
        return {
            success: true,
            vendorAmount: payment.vendorAmount,
            commission: payment.commission
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Initialize auto-release check on app start
document.addEventListener('DOMContentLoaded', function() {
    // Check for auto-releases every minute
    setInterval(() => {
        window.paystack.autoReleasePayments();
    }, 60000);
});

// Create global Paystack instance
window.paystack = new PaystackPayment();
window.processOrderPayment = processOrderPayment;
window.releaseVendorPayment = releaseVendorPayment;