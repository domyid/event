// Event Approval System Main JavaScript

// Configuration
const CONFIG = {
    backend: {
        approveEvent: 'https://asia-southeast2-awangga.cloudfunctions.net/domyid/api/event/approve',
        getClaimDetails: 'https://asia-southeast2-awangga.cloudfunctions.net/domyid/api/event/claim/'
    },
    ownerToken: 'owner-token' // This should be properly implemented with real authentication
};

// Global variables
let claimId = null;
let claimData = null;

// DOM Elements
const elements = {
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    approvalContent: document.getElementById('approvalContent'),
    successState: document.getElementById('successState'),
    loadingModal: document.getElementById('loadingModal'),
    approveBtn: document.getElementById('approveBtn'),
    
    // Event info
    eventName: document.getElementById('eventName'),
    eventDescription: document.getElementById('eventDescription'),
    eventPoints: document.getElementById('eventPoints'),
    
    // User info
    userName: document.getElementById('userName'),
    userNPM: document.getElementById('userNPM'),
    userPhone: document.getElementById('userPhone'),
    userEmail: document.getElementById('userEmail'),
    
    // Task info
    taskLinkDisplay: document.getElementById('taskLinkDisplay'),
    taskLinkButton: document.getElementById('taskLinkButton'),
    submittedAt: document.getElementById('submittedAt'),
    
    // Success info
    approvedUserName: document.getElementById('approvedUserName'),
    approvedEventName: document.getElementById('approvedEventName'),
    approvedPoints: document.getElementById('approvedPoints')
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Event Approval System initialized');
    
    // Get claim ID from URL
    claimId = getClaimIdFromUrl();
    
    if (!claimId || claimId === 'index.html') {
        showError('Invalid claim ID in URL. Please check the approval link.');
        return;
    }
    
    console.log('Claim ID:', claimId);
    
    // Load claim details
    loadClaimDetails();
    
    // Setup event listeners
    setupEventListeners();
});

// Get claim ID from URL parameters
function getClaimIdFromUrl() {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const claimParam = urlParams.get('claim');
    if (claimParam) {
        return claimParam;
    }

    // Fallback: check path segments
    const urlPath = window.location.pathname;
    const segments = urlPath.split('/');

    // Expected format: /event/{claimId} or /{claimId}
    if (segments.length >= 2) {
        const lastSegment = segments[segments.length - 1];
        if (lastSegment && lastSegment !== 'index.html' && lastSegment !== '') {
            return lastSegment;
        }
    }

    // Fallback: check hash
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        return hash;
    }

    return null;
}

// Setup event listeners
function setupEventListeners() {
    // Approve button
    elements.approveBtn.addEventListener('click', handleApprove);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.close();
        }
        if (e.key === 'Enter' && e.ctrlKey) {
            handleApprove();
        }
    });
}

// Load claim details (mock implementation)
async function loadClaimDetails() {
    try {
        showLoading(true);
        
        // For now, we'll show the approval form directly
        // In a real implementation, you would fetch claim details from API
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API call
        claimData = {
            event: {
                name: 'Sample Event',
                description: 'This is a sample event for testing approval system',
                points: 100
            },
            user: {
                name: 'John Doe',
                npm: '2023001',
                phone: '628123456789',
                email: 'john.doe@example.com'
            },
            taskLink: 'https://github.com/user/sample-project',
            submittedAt: new Date().toLocaleString('id-ID')
        };
        
        displayClaimDetails();
        
    } catch (error) {
        console.error('Error loading claim details:', error);
        showError('Failed to load claim details: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Display claim details
function displayClaimDetails() {
    if (!claimData) {
        showError('No claim data available');
        return;
    }
    
    // Populate event information
    elements.eventName.textContent = claimData.event.name;
    elements.eventDescription.textContent = claimData.event.description;
    elements.eventPoints.textContent = claimData.event.points;
    
    // Populate user information
    elements.userName.textContent = claimData.user.name;
    elements.userNPM.textContent = claimData.user.npm;
    elements.userPhone.textContent = claimData.user.phone;
    elements.userEmail.textContent = claimData.user.email;
    
    // Populate task information
    elements.taskLinkDisplay.value = claimData.taskLink;
    elements.taskLinkButton.href = claimData.taskLink;
    elements.submittedAt.textContent = claimData.submittedAt;
    
    // Show approval content
    elements.loadingState.style.display = 'none';
    elements.approvalContent.style.display = 'block';
    elements.approvalContent.classList.add('fade-in');
}

// Handle approve action
async function handleApprove() {
    if (!claimId) {
        showError('No claim ID available');
        return;
    }
    
    // Confirm action
    if (!confirm('Are you sure you want to approve this task? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoadingModal(true);
        elements.approveBtn.disabled = true;
        
        const response = await fetch(CONFIG.backend.approveEvent, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'login': CONFIG.ownerToken
            },
            body: JSON.stringify({
                claim_id: claimId
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'Success') {
            showSuccess(result.data);
        } else {
            throw new Error(result.response || 'Unknown error occurred');
        }
        
    } catch (error) {
        console.error('Error approving task:', error);
        showError('Failed to approve task: ' + error.message);
    } finally {
        showLoadingModal(false);
        elements.approveBtn.disabled = false;
    }
}

// Show success state
function showSuccess(data) {
    elements.approvalContent.style.display = 'none';
    
    // Populate success information
    if (claimData) {
        elements.approvedUserName.textContent = claimData.user.name;
        elements.approvedEventName.textContent = claimData.event.name;
        elements.approvedPoints.textContent = claimData.event.points;
    }
    
    elements.successState.style.display = 'block';
    elements.successState.classList.add('slide-up');
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        if (confirm('Approval successful! Close this window?')) {
            window.close();
        }
    }, 10000);
}

// Show error state
function showError(message) {
    elements.loadingState.style.display = 'none';
    elements.approvalContent.style.display = 'none';
    elements.errorMessage.textContent = message;
    elements.errorState.style.display = 'block';
    elements.errorState.classList.add('fade-in');
}

// Show/hide loading state
function showLoading(show) {
    elements.loadingState.style.display = show ? 'block' : 'none';
    if (show) {
        elements.loadingState.classList.add('fade-in');
    }
}

// Show/hide loading modal
function showLoadingModal(show) {
    if (show) {
        elements.loadingModal.classList.add('is-active');
    } else {
        elements.loadingModal.classList.remove('is-active');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function validateUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Export for debugging
window.EventApproval = {
    CONFIG,
    claimId,
    claimData,
    elements,
    loadClaimDetails,
    handleApprove,
    showSuccess,
    showError
};

console.log('Event Approval System loaded successfully');
