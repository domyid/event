// Event Approval System - Mengikuti pola kambing-main

import {setInner, onClick, getValue} from "https://cdn.jsdelivr.net/gh/jscroot/element@0.1.5/croot.js";
import {getHash} from "https://cdn.jsdelivr.net/gh/jscroot/url@0.0.9/croot.js";
import {get, postWithToken} from "https://cdn.jsdelivr.net/gh/jscroot/api@0.0.6/croot.js";
import {getCookie} from "https://cdn.jsdelivr.net/gh/jscroot/cookie@0.0.1/croot.js";

// Ambil data dan jalankan 2 fungsi callback sekaligus (mengikuti pola kambing)
const API_URL = "https://asia-southeast2-awangga.cloudfunctions.net/domyid/data/event/approval/" + getHash()

get(API_URL, handleEventApprovalResponse, runAfterGet);

// Setup event listener untuk tombol approve
onClick("approveBtn", runOnApproval);

function runAfterGet(result) {
    console.log("🔍 Raw data:", result);
    setInner("eventName", result.eventname || "N/A");
    setInner("eventDescription", result.description || "N/A");
    setInner("eventPoints", result.points || "0");
    setInner("userName", result.username || "N/A");
    setInner("userNPM", result.npm || "N/A");
    setInner("userPhone", result.phonenumber || "N/A");
    setInner("userEmail", result.email || "N/A");

    // Set task link
    const taskLinkDisplay = document.getElementById("taskLinkDisplay");
    const taskLinkButton = document.getElementById("taskLinkButton");
    if (taskLinkDisplay && taskLinkButton) {
        taskLinkDisplay.value = result.tasklink || "N/A";
        taskLinkButton.href = result.tasklink || "#";
    }

    // Set dates
    setInner("submittedAt", formatDate(result.submittedat));
    setInner("deadline", formatDate(result.deadline));
}

function handleEventApprovalResponse(result) {
    if (result.status && result.status.includes("Error")) {
        showError(result.status + ": " + result.response);
        return;
    }

    if (result.approved || result.isapproved) {
        showError('Tugas ini sudah di-approve sebelumnya');
        return;
    }

    if (result.status !== "submitted") {
        showError('Tugas belum di-submit oleh user. Status: ' + result.status);
        return;
    }

    console.log("📋 Response masuk:", result);

    // Show approval content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('approvalContent').style.display = 'block';
}

function runOnApproval() {
    const tombol = document.getElementById('approveBtn');
    const feedbackDiv = document.getElementById('feedback');

    tombol.disabled = true;
    feedbackDiv.style.display = 'block';
    feedbackDiv.className = 'notification is-info';

    let approvalData = {
        approved: true,
        komentar: "Event task approved by owner"
    };

    setInner("feedback", "Mohon tunggu sebentar data sedang diproses...");
    postWithToken(API_URL, "login", getCookie("login"), approvalData, responseFunction);
}

function responseFunction(result) {
    console.log("✅ Approval response:", result);
    if (result.Status === "Success" || result.status === "Success") {
        showSuccess(result);
    } else {
        showError("Error: " + (result.Response || result.response || "Unknown error"));
    }
}

function showSuccess(result) {
    // Hide approval content
    document.getElementById('approvalContent').style.display = 'none';

    // Show success state
    document.getElementById('successState').style.display = 'block';

    // Update success information
    setInner("approvedUserName", result.user || "User");
    setInner("approvedEventName", result.event || "Event");
    setInner("approvedPoints", result.points || "0");

    // Auto-close after 10 seconds
    setTimeout(() => {
        if (confirm('Approval successful! Close this window?')) {
            window.close();
        }
    }, 10000);
}

function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('approvalContent').style.display = 'none';
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorState').style.display = 'block';
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
    });
}

console.log('Event Approval System loaded successfully');
console.log('Claim ID from URL:', getHash());
