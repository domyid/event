// Event Approval Main JavaScript
import { getCookie } from "https://cdn.jsdelivr.net/gh/jscroot/cookie@0.0.1/croot.js";
import { getJSON, postJSON } from "https://cdn.jsdelivr.net/gh/jscroot/api@0.0.7/croot.js";

// Get claim ID from URL hash
const claimId = window.location.hash.substring(1); // Remove # from hash

// Backend URLs
const backend = {
    getClaimDetails: `https://asia-southeast2-awangga.cloudfunctions.net/domyid/api/event/claim/${claimId}`,
    approveTask: 'https://asia-southeast2-awangga.cloudfunctions.net/domyid/api/event/approve'
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

// Global claim data
let claimData = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Event Approval Page Loaded');
    console.log('Claim ID:', claimId);
    
    if (!claimId) {
        showNoData();
        return;
    }

    await loadClaimDetails();
    setupEventHandlers();
});

// Load claim details from backend
async function loadClaimDetails() {
    try {
        showLoading();
        
        const response = await getJSON(backend.getClaimDetails, 'login', getCookie('login'));
        
        if (response.status === 'Success') {
            claimData = response.data;
            populateClaimDetails(claimData);
            hideAllMessages();
        } else {
            console.error('Failed to load claim details:', response);
            showNoData();
        }
    } catch (error) {
        console.error('Error loading claim details:', error);
        showError('Error loading claim details: ' + error.message);
    }
}

// Populate page with claim details
function populateClaimDetails(data) {
    // Student and user information
    elements.studentName.textContent = data.user_name || 'Unknown';
    elements.userName.textContent = data.user_name || 'Unknown';
    elements.userPhone.textContent = data.user_phone || 'Unknown';
    elements.userEmail.textContent = data.user_email || 'Unknown';
    
    // Event information
    elements.eventName.textContent = data.event_name || 'Unknown Event';
    elements.eventPoints.textContent = (data.event_points || 0) + ' Points';
    elements.eventDescription.textContent = data.event_description || 'No description available';
    
    // Task information
    if (data.task_link) {
        elements.taskLink.href = data.task_link;
        elements.taskLink.textContent = data.task_link;
        elements.openTaskBtn.onclick = () => window.open(data.task_link, '_blank');
    } else {
        elements.taskLink.textContent = 'No task link provided';
        elements.openTaskBtn.disabled = true;
    }
    
    // Timing information
    elements.submittedAt.textContent = formatDate(data.submitted_at);
    elements.claimedAt.textContent = formatDate(data.claimed_at);
    elements.timerDuration.textContent = formatDuration(data.timer_sec);
    
    // Store claim ID for approval actions
    elements.approveBtn.dataset.claimId = data.claim_id;
    elements.rejectBtn.dataset.claimId = data.claim_id;
}

// Setup event handlers
function setupEventHandlers() {
    elements.approveBtn.addEventListener('click', () => handleApproval(true));
    elements.rejectBtn.addEventListener('click', () => handleApproval(false));
}

// Handle approval/rejection
async function handleApproval(isApproved) {
    const button = isApproved ? elements.approveBtn : elements.rejectBtn;
    const claimId = button.dataset.claimId;
    const comment = elements.approvalComment.value.trim();

    if (!claimId) {
        showError('Claim ID tidak ditemukan');
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
        const approvalData = {
            claim_id: claimId,
            is_approved: isApproved,
            comment: comment
        };

        const response = await postJSON(backend.approveTask, 'login', getCookie('login'), approvalData);

        if (response.status === 'Success') {
            const actionText = isApproved ? 'approved' : 'rejected';
            const message = `Task has been ${actionText} successfully!`;

            if (isApproved) {
                showSuccess(`${message} Student will receive ${claimData.event_points} points.`);

                // Redirect to approved page after 2 seconds
                setTimeout(() => {
                    if (response.data.redirect_url) {
                        window.location.href = response.data.redirect_url;
                    } else {
                        window.location.href = `approved.html?event=${encodeURIComponent(claimData.event_name)}&points=${claimData.event_points}`;
                    }
                }, 2000);
            } else {
                showSuccess(message);
            }

            // Hide approval buttons after action
            elements.approveBtn.style.display = 'none';
            elements.rejectBtn.style.display = 'none';
            elements.approvalComment.disabled = true;

        } else {
            showError(response.info || response.response || 'Failed to process approval');
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

function formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    return `${seconds} seconds (${minutes} minutes display time)`;
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
    claimId,
    claimData,
    loadClaimDetails,
    handleApproval
};

console.log('Event Approval System Loaded');
console.log('Claim ID:', claimId);
console.log('Available functions: window.eventApproval');
