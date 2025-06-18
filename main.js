// Event Approval Main JavaScript
import { getCookie } from "https://cdn.jsdelivr.net/gh/jscroot/cookie@0.0.1/croot.js";
import { getJSON, postJSON } from "https://cdn.jsdelivr.net/gh/jscroot/api@0.0.7/croot.js";

// Get claim ID from URL hash or phone from URL params
const claimId = window.location.hash.substring(1); // Remove # from hash
const urlParams = new URLSearchParams(window.location.search);
const phoneNumber = urlParams.get('phone');

// Backend URLs
const backend = {
    getClaimDetails: `https://asia-southeast2-awangga.cloudfunctions.net/domyid/api/event/claim/${claimId}`,
    getClaims: 'https://asia-southeast2-awangga.cloudfunctions.net/domyid/api/event/claims',
    approveTask: 'https://asia-southeast2-awangga.cloudfunctions.net/domyid/api/event/approve'
};

// DOM Elements
const elements = {
    // Search elements
    searchSection: document.getElementById('search-section'),
    phoneSearch: document.getElementById('phone-search'),
    searchBtn: document.getElementById('search-btn'),
    claimsListSection: document.getElementById('claims-list-section'),
    claimsContainer: document.getElementById('claims-container'),
    individualClaimSection: document.getElementById('individual-claim-section'),

    // Individual claim elements
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

    // Message elements
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
    console.log('Phone Number:', phoneNumber);

    setupEventHandlers();

    if (claimId) {
        // Individual claim mode
        showIndividualClaimMode();
        await loadClaimDetails();
    } else if (phoneNumber) {
        // Search mode with phone number from URL
        showSearchMode();
        elements.phoneSearch.value = phoneNumber;
        await searchClaims();
    } else {
        // Default search mode
        showSearchMode();
    }
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

// Mode switching functions
function showSearchMode() {
    elements.searchSection.style.display = 'block';
    elements.claimsListSection.style.display = 'none';
    elements.individualClaimSection.style.display = 'none';
}

function showClaimsListMode() {
    elements.searchSection.style.display = 'block';
    elements.claimsListSection.style.display = 'block';
    elements.individualClaimSection.style.display = 'none';
}

function showIndividualClaimMode() {
    elements.searchSection.style.display = 'none';
    elements.claimsListSection.style.display = 'none';
    elements.individualClaimSection.style.display = 'block';
}

// Search claims by phone number
async function searchClaims() {
    const phone = elements.phoneSearch.value.trim();

    if (!phone) {
        showError('Please enter a phone number');
        return;
    }

    if (!/^08\d{8,12}$/.test(phone)) {
        showError('Please enter a valid phone number (e.g., 08123456789)');
        return;
    }

    try {
        showLoading();

        const response = await getJSON(`${backend.getClaims}?phonenumber=${phone}`, 'login', getCookie('login'));

        if (response.status === 'Success' && response.data) {
            const claims = response.data.claims || [];
            renderClaimsList(claims, phone);
            showClaimsListMode();
        } else {
            showError('No pending claims found for this phone number');
        }
    } catch (error) {
        console.error('Error searching claims:', error);
        showError('Error searching claims: ' + error.message);
    }
}

// Render claims list
function renderClaimsList(claims, phone) {
    if (!claims || claims.length === 0) {
        elements.claimsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background-color: #fff3cd; border-radius: 8px;">
                <h4>No Pending Claims</h4>
                <p>No pending event claims found for phone number: ${phone}</p>
            </div>
        `;
        return;
    }

    let html = '';
    claims.forEach(claim => {
        html += createClaimCard(claim);
    });

    elements.claimsContainer.innerHTML = html;
    hideAllMessages();
}

// Create claim card HTML
function createClaimCard(claim) {
    const submittedDate = formatDate(claim.submitted_at);

    return `
        <div class="claim-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; background-color: #f9f9f9;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; color: #333;">${claim.event_name}</h4>
                <span style="background-color: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-size: 14px;">
                    ${claim.event_points} Points
                </span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <strong>Student:</strong> ${claim.user_name}<br>
                    <strong>Phone:</strong> ${claim.user_phone}
                </div>
                <div>
                    <strong>Email:</strong> ${claim.user_email}<br>
                    <strong>Submitted:</strong> ${submittedDate}
                </div>
            </div>

            <div style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                <strong>Task Link:</strong><br>
                <a href="${claim.task_link}" target="_blank" style="word-break: break-all; color: #1976d2;">
                    ${claim.task_link}
                </a>
            </div>

            <div style="display: flex; gap: 10px;">
                <button onclick="approveClaimFromList('${claim.claim_id}', true)"
                        style="background-color: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                    ✅ Approve
                </button>
                <button onclick="approveClaimFromList('${claim.claim_id}', false)"
                        style="background-color: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                    ❌ Reject
                </button>
                <button onclick="viewClaimDetails('${claim.claim_id}')"
                        style="background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                    👁️ View Details
                </button>
            </div>
        </div>
    `;
}

// Setup event handlers
function setupEventHandlers() {
    // Search functionality
    elements.searchBtn.addEventListener('click', searchClaims);
    elements.phoneSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchClaims();
        }
    });

    // Individual claim approval (only if elements exist)
    if (elements.approveBtn) {
        elements.approveBtn.addEventListener('click', () => handleApproval(true));
    }
    if (elements.rejectBtn) {
        elements.rejectBtn.addEventListener('click', () => handleApproval(false));
    }
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

// Global functions for claim list actions
window.approveClaimFromList = async function(claimId, isApproved) {
    const action = isApproved ? 'approve' : 'reject';
    if (!confirm(`Are you sure you want to ${action} this task?`)) {
        return;
    }

    try {
        showLoading();

        const approvalData = {
            claim_id: claimId,
            is_approved: isApproved
        };

        const response = await postJSON(backend.approveTask, 'login', getCookie('login'), approvalData);

        if (response.status === 'Success') {
            const actionText = isApproved ? 'approved' : 'rejected';
            showSuccess(`Task has been ${actionText} successfully!`);

            // Remove the claim card from the list
            const claimCards = document.querySelectorAll('.claim-card');
            claimCards.forEach(card => {
                if (card.innerHTML.includes(claimId)) {
                    card.style.transition = 'all 0.5s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(-100%)';
                    setTimeout(() => card.remove(), 500);
                }
            });

        } else {
            showError(response.info || response.response || 'Failed to process approval');
        }
    } catch (error) {
        console.error('Error processing approval:', error);
        showError('Error: ' + error.message);
    }
};

window.viewClaimDetails = function(claimId) {
    // Redirect to individual claim view
    window.location.href = `index.html#${claimId}`;
};

// Export for debugging
window.eventApproval = {
    claimId,
    phoneNumber,
    claimData,
    loadClaimDetails,
    handleApproval,
    searchClaims
};

console.log('Event Approval System Loaded');
console.log('Claim ID:', claimId);
console.log('Phone Number:', phoneNumber);
console.log('Available functions: window.eventApproval');
