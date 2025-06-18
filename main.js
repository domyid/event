// Event Approval Main JavaScript
import { getCookie } from "https://cdn.jsdelivr.net/gh/jscroot/cookie@0.0.1/croot.js";
import { getJSON } from "https://cdn.jsdelivr.net/gh/jscroot/api@0.0.7/croot.js";

// Get event ID from URL hash
const eventId = window.location.hash.substring(1); // Remove # from hash

// Backend URLs
const backend = {
    getApprovalDetails: `https://asia-southeast2-awangga.cloudfunctions.net/domyid/api/event/approval/${eventId}`,
    updateApproval: `https://asia-southeast2-awangga.cloudfunctions.net/domyid/api/event/approval/${eventId}`
};

// DOM Elements
const elements = {
    studentName: document.getElementById('student-name'),
    eventName: document.getElementById('event-name'),
    eventPoints: document.getElementById('event-points'),
    eventDescription: document.getElementById('event-description'),
    userName: document.getElementById('user-name'),
    userPhone: document.getElementById('user-phone'),
    userEmail: document.getElementById('user-email'),
    submittedAt: document.getElementById('submitted-at'),
    taskLink: document.getElementById('task-link'),
    openTaskBtn: document.getElementById('open-task-btn'),
    claimedAt: document.getElementById('claimed-at'),
    timerDuration: document.getElementById('timer-duration'),
    approveBtn: document.getElementById('approve-btn'),
    rejectBtn: document.getElementById('reject-btn'),
    approvalComment: document.getElementById('approval-comment'),
    loadingMessage: document.getElementById('loading-message'),
    successMessage: document.getElementById('success-message'),
    errorMessage: document.getElementById('error-message'),
    noDataMessage: document.getElementById('no-data-message'),
    successText: document.getElementById('success-text'),
    errorText: document.getElementById('error-text')
};

// Global approval data
let approvalData = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Event Approval Page Loaded');
    console.log('Event ID:', eventId);

    if (!eventId) {
        showNoData();
        return;
    }

    await loadApprovalDetails();
    setupEventHandlers();
});

// Load approval details from backend
async function loadApprovalDetails() {
    try {
        showLoading();

        const response = await getJSON(backend.getApprovalDetails, 'login', getCookie('login'));

        if (response.status === 'Success') {
            approvalData = response.data;
            populateApprovalDetails(approvalData);
            hideAllMessages();
        } else {
            console.error('Failed to load approval details:', response);
            showNoData();
        }
    } catch (error) {
        console.error('Error loading approval details:', error);
        showError('Error loading approval details: ' + error.message);
    }
}

// Populate page with approval details
function populateApprovalDetails(data) {
    // Student and user information
    elements.studentName.textContent = data.username || 'Unknown';
    elements.userName.textContent = data.username || 'Unknown';
    elements.userPhone.textContent = data.userphone || 'Unknown';
    elements.userEmail.textContent = data.useremail || 'Unknown';

    // Event information
    elements.eventName.textContent = data.eventname || 'Unknown Event';
    elements.eventPoints.textContent = (data.eventpoints || 0) + ' Points';
    elements.eventDescription.textContent = 'Event Task Submission'; // Simple description

    // Task information
    if (data.tasklink) {
        elements.taskLink.href = data.tasklink;
        elements.taskLink.textContent = data.tasklink;
        elements.openTaskBtn.onclick = () => window.open(data.tasklink, '_blank');
    } else {
        elements.taskLink.textContent = 'No task link provided';
        elements.openTaskBtn.disabled = true;
    }

    // Timing information
    elements.submittedAt.textContent = formatDate(data.createdat);
    elements.claimedAt.textContent = formatDate(data.createdat);
    elements.timerDuration.textContent = 'Event Task';

    // Store approval ID for approval actions
    elements.approveBtn.dataset.approvalId = data._id;
    elements.rejectBtn.dataset.approvalId = data._id;
}

// Setup event handlers
function setupEventHandlers() {
    elements.approveBtn.addEventListener('click', () => handleApproval(true));
    elements.rejectBtn.addEventListener('click', () => handleApproval(false));
}

// Handle approval/rejection (seperti bimbingan)
async function handleApproval(isApproved) {
    const button = isApproved ? elements.approveBtn : elements.rejectBtn;
    const approvalId = button.dataset.approvalId;
    const comment = elements.approvalComment.value.trim();

    if (!approvalId) {
        showError('Approval ID tidak ditemukan');
        return;
    }

    // Confirm action
    const action = isApproved ? 'approve' : 'reject';
    const confirmMessage = `Are you sure you want to ${action} this task?`;
    if (!confirm(confirmMessage)) {
        return;
    }

    // Show loading
    showLoading();
    button.disabled = true;

    try {
        // Prepare approval data (seperti bimbingan)
        const approvalUpdate = {
            approved: isApproved,
            validasi: isApproved ? 5 : 1, // Default rating
            komentar: comment || (isApproved ? 'Task approved' : 'Task rejected')
        };

        const response = await fetch(backend.updateApproval, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'login': getCookie('login')
            },
            body: JSON.stringify(approvalUpdate)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();

        if (responseData) {
            const actionText = isApproved ? 'approved' : 'rejected';
            const message = `Task has been ${actionText} successfully!`;

            if (isApproved) {
                showSuccess(`${message} Student will receive ${approvalData.eventpoints} points.`);

                // Redirect to approved page after 2 seconds
                setTimeout(() => {
                    window.location.href = `approved.html?event=${encodeURIComponent(approvalData.eventname)}&points=${approvalData.eventpoints}`;
                }, 2000);
            } else {
                showSuccess(message);

                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = `approved.html?event=${encodeURIComponent(approvalData.eventname)}&rejected=true`;
                }, 2000);
            }

            // Hide approval buttons after action
            elements.approveBtn.style.display = 'none';
            elements.rejectBtn.style.display = 'none';
            elements.approvalComment.disabled = true;

        } else {
            showError('Failed to process approval');
            button.disabled = false;
        }
    } catch (error) {
        console.error('Error processing approval:', error);
        showError('Error: ' + error.message);
        button.disabled = false;
    }
}

// Utility functions for date formatting
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// Message display functions
function showLoading() {
    hideAllMessages();
    elements.loadingMessage.style.display = 'block';
}

function showSuccess(message) {
    hideAllMessages();
    elements.successText.textContent = message;
    elements.successMessage.style.display = 'block';
}

function showError(message) {
    hideAllMessages();
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'block';
}

function showNoData() {
    hideAllMessages();
    elements.noDataMessage.style.display = 'block';

    // Hide approval section
    document.querySelector('.approval-section').style.display = 'none';
}

function hideAllMessages() {
    elements.loadingMessage.style.display = 'none';
    elements.successMessage.style.display = 'none';
    elements.errorMessage.style.display = 'none';
    elements.noDataMessage.style.display = 'none';
}

// Export for debugging
window.eventApproval = {
    eventId,
    approvalData,
    loadApprovalDetails,
    handleApproval
};

console.log('Event Approval System Loaded');
console.log('Event ID:', eventId);
console.log('Available functions: window.eventApproval');
