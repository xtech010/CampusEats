class AdminReportsManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.loadReports();
        this.setupEventListeners();
    }

    checkAdminAuth() {
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (!adminLoggedIn) {
            window.location.href = 'admin.html';
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('reportSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchReports(e.target.value));
        }
    }

    loadReports() {
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        // Sort by latest first
        reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.displayReports(reports);
    }

    displayReports(reports) {
        const container = document.getElementById('reportsList');
        if (!container) return;

        if (reports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-flag"></i>
                    <h4>No Reports</h4>
                    <p>No reports or complaints have been submitted yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reports.map(report => {
            const timeAgo = this.getTimeAgo(report.timestamp);
            const reportType = this.getReportTypeText(report.type);

            return `
                <div class="report-admin-card ${report.resolved ? 'resolved' : 'pending'}" 
                     onclick="adminReportsManager.viewReportDetails('${report.id}')">
                    <div class="report-header">
                        <div class="report-basic-info">
                            <h4>Report #RPT-${report.id.toString().padStart(4, '0')}</h4>
                            <p>${reportType} • ${report.reason}</p>
                            <p>From: ${report.reporterName} • Against: ${report.targetName}</p>
                        </div>
                        <div class="report-meta">
                            <span class="report-status ${report.resolved ? 'resolved' : 'pending'}">
                                ${report.resolved ? 'Resolved' : 'Pending'}
                            </span>
                            <span class="report-time">${timeAgo}</span>
                        </div>
                    </div>
                    <div class="report-preview">
                        <p>${report.description.length > 100 ? 
                            report.description.substring(0, 100) + '...' : report.description}</p>
                    </div>
                    ${report.resolved ? `
                        <div class="report-resolution">
                            <strong>Resolution:</strong> ${report.resolution}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    searchReports(query) {
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        const filteredReports = reports.filter(report => 
            report.id.toString().includes(query) ||
            report.reporterName.toLowerCase().includes(query.toLowerCase()) ||
            report.targetName.toLowerCase().includes(query.toLowerCase()) ||
            report.reason.toLowerCase().includes(query.toLowerCase()) ||
            `RPT-${report.id.toString().padStart(4, '0')}`.includes(query)
        );
        this.displayReports(filteredReports);
    }

    filterReports() {
        const statusFilter = document.getElementById('statusFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');

        let filteredReports = reports;

        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'pending') {
                filteredReports = filteredReports.filter(report => !report.resolved);
            } else if (statusFilter === 'resolved') {
                filteredReports = filteredReports.filter(report => report.resolved && report.resolution !== 'dismissed');
            } else if (statusFilter === 'dismissed') {
                filteredReports = filteredReports.filter(report => report.resolution === 'dismissed');
            }
        }

        // Type filter
        if (typeFilter !== 'all') {
            filteredReports = filteredReports.filter(report => report.type === typeFilter);
        }

        this.displayReports(filteredReports);
    }

    viewReportDetails(reportId) {
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        const report = reports.find(r => r.id == reportId);
        
        if (!report) return;

        const modalContent = document.getElementById('reportDetailsContent');
        modalContent.innerHTML = `
            <div class="report-detail-section">
                <h4>Report Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Report ID</label>
                        <span class="unique-id">RPT-${report.id.toString().padStart(4, '0')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Type</label>
                        <span>${this.getReportTypeText(report.type)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Reason</label>
                        <span>${report.reason}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        <span class="report-status ${report.resolved ? 'resolved' : 'pending'}">
                            ${report.resolved ? 'Resolved' : 'Pending'}
                        </span>
                    </div>
                    <div class="detail-item">
                        <label>Date Reported</label>
                        <span>${new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div class="report-detail-section">
                <h4>Parties Involved</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Reported By</label>
                        <span>${report.reporterName} (${report.reporterType})</span>
                    </div>
                    <div class="detail-item">
                        <label>Reported Against</label>
                        <span>${report.targetName} (${report.targetType})</span>
                    </div>
                    ${report.productId ? `
                    <div class="detail-item">
                        <label>Product Involved</label>
                        <span>${report.productName || 'Unknown Product'}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="report-detail-section">
                <h4>Description</h4>
                <div class="report-description">
                    <p>${report.description}</p>
                </div>
            </div>

            ${report.resolved ? `
            <div class="report-detail-section">
                <h4>Resolution</h4>
                <div class="report-resolution-details">
                    <p><strong>Action Taken:</strong> ${report.resolution}</p>
                    ${report.resolutionNotes ? `<p><strong>Notes:</strong> ${report.resolutionNotes}</p>` : ''}
                    <p><strong>Resolved On:</strong> ${new Date(report.resolvedAt).toLocaleString()}</p>
                </div>
            </div>
            ` : ''}

            <div class="report-detail-section">
                <h4>Actions</h4>
                <div class="action-buttons">
                    ${!report.resolved ? `
                        <button class="btn btn-primary" onclick="adminReportsManager.showActionForm('${report.id}', 'warn')">
                            <i class="fas fa-exclamation-triangle"></i> Issue Warning
                        </button>
                        <button class="btn" onclick="adminReportsManager.showActionForm('${report.id}', 'suspend')">
                            <i class="fas fa-ban"></i> Suspend Account
                        </button>
                        <button class="btn btn-outline" onclick="adminReportsManager.showActionForm('${report.id}', 'dismiss')">
                            <i class="fas fa-times"></i> Dismiss Report
                        </button>
                    ` : `
                        <button class="btn btn-outline" onclick="adminReportsManager.reopenReport('${report.id}')">
                            <i class="fas fa-redo"></i> Reopen Report
                        </button>
                    `}
                    <button class="btn" onclick="adminReportsManager.contactReporter('${report.id}')">
                        <i class="fas fa-comment"></i> Contact Reporter
                    </button>
                </div>
            </div>
        `;

        this.showModal('reportDetailsModal');
    }

    showActionForm(reportId, actionType) {
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        const report = reports.find(r => r.id == reportId);
        
        if (!report) return;

        const actionContent = document.getElementById('actionContent');
        let formHtml = '';

        switch (actionType) {
            case 'warn':
                formHtml = `
                    <h4>Issue Warning to ${report.targetName}</h4>
                    <div class="form-group">
                        <label>Warning Message</label>
                        <textarea id="warningMessage" rows="4" placeholder="Enter warning message..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Additional Notes (Internal)</label>
                        <textarea id="warningNotes" rows="2" placeholder="Internal notes..."></textarea>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="adminReportsManager.issueWarning('${reportId}')">
                            Send Warning
                        </button>
                    </div>
                `;
                break;
            
            case 'suspend':
                formHtml = `
                    <h4>Suspend ${report.targetName}</h4>
                    <div class="form-group">
                        <label>Suspension Duration</label>
                        <select id="suspensionDuration">
                            <option value="1">1 Day</option>
                            <option value="3">3 Days</option>
                            <option value="7">1 Week</option>
                            <option value="30">1 Month</option>
                            <option value="permanent">Permanent</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Suspension Reason</label>
                        <textarea id="suspensionReason" rows="3" placeholder="Reason for suspension..." required></textarea>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="adminReportsManager.suspendAccount('${reportId}')">
                            Confirm Suspension
                        </button>
                    </div>
                `;
                break;
            
            case 'dismiss':
                formHtml = `
                    <h4>Dismiss Report</h4>
                    <div class="form-group">
                        <label>Reason for Dismissal</label>
                        <textarea id="dismissalReason" rows="3" placeholder="Why is this report being dismissed?" required></textarea>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="adminReportsManager.dismissReport('${reportId}')">
                            Dismiss Report
                        </button>
                    </div>
                `;
                break;
        }

        actionContent.innerHTML = formHtml;
        this.closeModal('reportDetailsModal');
        this.showModal('actionModal');
    }

    issueWarning(reportId) {
        const warningMessage = document.getElementById('warningMessage').value;
        const warningNotes = document.getElementById('warningNotes').value;
        
        if (!warningMessage) {
            this.showNotification('Please enter a warning message', 'error');
            return;
        }

        this.resolveReport(reportId, 'warning_issued', `Warning issued: ${warningMessage}`, warningNotes);
        this.showNotification('Warning issued successfully', 'success');
    }

    suspendAccount(reportId) {
        const duration = document.getElementById('suspensionDuration').value;
        const reason = document.getElementById('suspensionReason').value;
        
        if (!reason) {
            this.showNotification('Please enter a suspension reason', 'error');
            return;
        }

        this.resolveReport(reportId, 'account_suspended', `Account suspended for ${duration} days: ${reason}`);
        this.showNotification('Account suspended successfully', 'success');
    }

    dismissReport(reportId) {
        const reason = document.getElementById('dismissalReason').value;
        
        if (!reason) {
            this.showNotification('Please enter a dismissal reason', 'error');
            return;
        }

        this.resolveReport(reportId, 'dismissed', `Report dismissed: ${reason}`);
        this.showNotification('Report dismissed', 'info');
    }

    resolveReport(reportId, resolution, resolutionNotes = '') {
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        const reportIndex = reports.findIndex(r => r.id == reportId);
        
        if (reportIndex !== -1) {
            reports[reportIndex].resolved = true;
            reports[reportIndex].resolution = resolution;
            reports[reportIndex].resolutionNotes = resolutionNotes;
            reports[reportIndex].resolvedAt = new Date().toISOString();
            
            localStorage.setItem('reports', JSON.stringify(reports));
            
            this.loadReports();
            this.closeModal('actionModal');
        }
    }

    reopenReport(reportId) {
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        const reportIndex = reports.findIndex(r => r.id == reportId);
        
        if (reportIndex !== -1) {
            reports[reportIndex].resolved = false;
            reports[reportIndex].resolution = '';
            reports[reportIndex].resolutionNotes = '';
            reports[reportIndex].resolvedAt = null;
            
            localStorage.setItem('reports', JSON.stringify(reports));
            
            this.loadReports();
            this.closeModal('reportDetailsModal');
            this.showNotification('Report reopened', 'success');
        }
    }

    contactReporter(reportId) {
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        const report = reports.find(r => r.id == reportId);
        
        if (report) {
            const message = prompt(`Enter message to send to ${report.reporterName}:`);
            if (message) {
                if (report.reporterType === 'student') {
                    this.sendNotificationToStudent(report.reporterId, message);
                } else if (report.reporterType === 'vendor') {
                    this.sendNotificationToVendor(report.reporterId, message);
                }
                this.showNotification('Message sent to reporter', 'success');
            }
        }
    }

    sendNotificationToStudent(studentId, message) {
        const notifications = JSON.parse(localStorage.getItem('student_notifications') || '[]');
        notifications.push({
            studentId,
            title: 'Regarding Your Report',
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
            title: 'Regarding Your Report',
            message,
            type: 'admin',
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('vendor_notifications', JSON.stringify(notifications));
    }

    getReportTypeText(type) {
        const typeMap = {
            'product': 'Product Issue',
            'vendor': 'Vendor Issue',
            'delivery': 'Delivery Issue',
            'behavior': 'Behavior Issue'
        };
        return typeMap[type] || type;
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
    window.adminReportsManager = new AdminReportsManager();
});