function sanitizeCSV(text) {
    if (text == null) return '';
    let str = String(text);
    str = str.replace(/"/g, '""');
    if (/^[=+\-@]/.test(str)) {
        str = "'" + str;
    }
    return str;
}

window.currentFilter = 'all';
window.taskData = null;

function getApiKey() {
    return sessionStorage.getItem('compliance_api_key') || '';
}

function setApiKey(key) {
    sessionStorage.setItem('compliance_api_key', key);
}

function clearApiKey() {
    sessionStorage.removeItem('compliance_api_key');
}

function isAuthenticated() {
    return getApiKey().length > 0;
}

function showAuthGate() {
    const authSection = document.getElementById('auth-section');
    const uploadSection = document.getElementById('upload-section');
    const logoutBtn = document.getElementById('logout-btn');
    if (authSection) authSection.classList.remove('hidden');
    if (uploadSection) uploadSection.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
}

function showMainApp() {
    const authSection = document.getElementById('auth-section');
    const uploadSection = document.getElementById('upload-section');
    const logoutBtn = document.getElementById('logout-btn');
    if (authSection) authSection.classList.add('hidden');
    if (uploadSection) uploadSection.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
}

function toggleKeyVisibility() {
    const input = document.getElementById('api-key-input');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

async function handleLogin() {
    const input = document.getElementById('api-key-input');
    const errorEl = document.getElementById('auth-error');
    const submitBtn = document.getElementById('auth-submit-btn');

    if (!input) return;
    const key = input.value.trim();

    if (!key) {
        showAuthError('Please enter your API key.');
        return;
    }

    // Input validation: reject excessively long or malformed keys
    if (key.length > 256) {
        showAuthError('API key is too long (max 256 characters).');
        return;
    }

    if (key.length < 16) {
        showAuthError('API key is too short. Please check your key.');
        return;
    }

    // Reject control characters (except normal ASCII printable range)
    if (/[\x00-\x1f\x7f]/.test(key)) {
        showAuthError('API key contains invalid characters.');
        return;
    }

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Verifying…
    `;

    try {
        // Validate key against the backend's /api/verify-key endpoint
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/verify-key`, {
            method: 'POST',
            headers: { 'x-api-key': key }
        });

        if (response.ok) {
            setApiKey(key);

            if (errorEl) errorEl.classList.add('hidden');
            input.value = ''; 

            showMainApp();

            verifyBackendConnection();

        } else if (response.status === 403) {
            showAuthError('Invalid API key. Please check and try again.');

        } else if (response.status === 429) {
            showAuthError('Too many attempts. Please wait a minute and try again.');

        } else {
            showAuthError('Server error. Please try again later.');
        }

    } catch (err) {
        showAuthError('Cannot reach the server. Is the backend running?');
        console.error('Auth verification failed:', err);

    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
            </svg>
            Authenticate
        `;
    }
}

function showAuthError(message) {
    const errorEl = document.getElementById('auth-error');

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

function handleLogout() {
    clearApiKey();
    resetApp();
    showAuthGate();
    showToast('info', 'Logged Out', 'Your API key has been cleared from this session.');
}

document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        showMainApp();
        verifyBackendConnection();
    } else {
        showAuthGate();
    }

    const apiKeyInput = document.getElementById('api-key-input');

    if (apiKeyInput) {
        apiKeyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLogin();
            }
        });
    }
});

async function verifyBackendConnection() {
    const indicator = document.getElementById('status-indicator');

    if (!indicator) return;
    indicator.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
        <span class="text-slate-500">Checking Pipeline...</span>
    `;
    
    try {
        const ping = await fetch(`${window.APP_CONFIG.BACKEND_URL}/`);

        if (ping.ok) {
            indicator.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-emerald-400 ring-pulse"></span>
                <span class="text-emerald-400 font-medium">System Ready</span>
            `;
        } else {
            throw new Error();
        }
    } catch (err) {
        indicator.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-red-500 animate-bounce"></span>
            <span class="text-red-400 font-bold">System Offline</span>
        `;
        showToast('error', 'System Offline', 'The compliance network is currently offline. Please try again later.');
        console.error('Connection Error: FastAPI backend is offline.');
    }
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; 

const MIN_FILE_SIZE_BYTES = 10; 

function validateFile(file) {

    if (!file) {
        showToast('error', 'No File', 'No file was provided.');
        return false;
    }

    const allowedTypes = ['application/pdf', 'application/x-pdf'];

    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('error', 'Invalid File', 'Only PDF documents are accepted.');
        return false;
    }

    if (!file.name || !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('error', 'Invalid Extension', 'File must have a .pdf extension.');
        return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        showToast('error', 'File Too Large', `Maximum file size is 50 MB. Your file is ${(file.size / (1024*1024)).toFixed(1)} MB.`);
        return false;
    }
    
    if (file.size < MIN_FILE_SIZE_BYTES) {
        showToast('error', 'File Too Small', 'The file appears to be empty or invalid.');
        return false;
    }

    if (file.name.length > 255) {
        showToast('error', 'Filename Too Long', 'Filename must be 255 characters or less.');
        return false;
    }

    return true;
}

const uploadZone = document.getElementById('upload-zone');

if (uploadZone) {
    ['dragenter', 'dragover'].forEach(evt => {
        uploadZone.addEventListener(evt, e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    });
    ['dragleave', 'drop'].forEach(evt => {
        uploadZone.addEventListener(evt, e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); });
    });
    uploadZone.addEventListener('drop', e => {
        const files = e.dataTransfer.files;
        if (files.length && validateFile(files[0])) {
            startProcessing(files[0]);
        }
    });
}

function handleFileUpload(event) {
    const file = event.target.files[0];

    if (file && validateFile(file)) {
        startProcessing(file);
    }
}

async function runDemo() {

    document.getElementById('upload-section').classList.add('hidden');

    const procSection = document.getElementById('processing-section');

    procSection.classList.remove('hidden');
    
    document.getElementById('status-indicator').innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span class="text-slate-400">Loading Demo...</span>
    `;

    const steps = document.querySelectorAll('.step-item');

    const progressBar = document.getElementById('progress-bar');

    const progressText = document.getElementById('progress-text');

    try {
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/analyze/demo`, { method: 'POST' });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const demoData = await response.json();

        steps.forEach(step => {
            step.classList.remove('opacity-40');

            const circle = step.querySelector('.step-circle');

            circle.innerHTML = `<svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>`;

            circle.classList.remove('border-slate-600', 'border-brand-500', 'border-emerald-500');

            circle.classList.add('border-emerald-500');

            const span = step.querySelector('span');

            if (span) {
                span.classList.remove('text-slate-500', 'text-slate-300');
                span.classList.add('text-emerald-400');
            }

        });

        progressBar.style.width = '100%';

        progressText.textContent = '100% complete';

        setTimeout(() => {
            procSection.classList.add('hidden');
            showDashboard(demoData);
        }, 600);

    } catch (error) {
        console.error("Demo Request Failed:", error);

        resetApp();

        showToast('error', 'Demo Unavailable', 'Unable to process the sample policy layout at this moment.');
    }
}

async function startProcessing(file) {

    if (!isAuthenticated()) {
        showAuthGate();
        showToast('error', 'Session Expired', 'Please enter your API key again.');
        return;
    }

    document.getElementById('upload-section').classList.add('hidden');

    const procSection = document.getElementById('processing-section');

    procSection.classList.remove('hidden');
    
    document.getElementById('status-indicator').innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span class="text-slate-400">Processing…</span>
    `;

    const steps = document.querySelectorAll('.step-item');

    const progressBar = document.getElementById('progress-bar');

    const progressText = document.getElementById('progress-text');

    steps.forEach((step, idx) => {

        if (idx === 0) {
            step.classList.remove('opacity-40');
            step.querySelector('.step-circle').innerHTML = `<div class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>`;
            step.querySelector('.step-circle').className = 'w-5 h-5 rounded-full border-2 border-brand-500 flex items-center justify-center flex-shrink-0 step-circle';
            step.querySelector('span').className = 'text-slate-300';
        } else {
            step.classList.add('opacity-40');
            step.querySelector('.step-circle').innerHTML = ``;
            step.querySelector('.step-circle').className = 'w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center flex-shrink-0 step-circle';
            step.querySelector('span').className = 'text-slate-500';
        }
    });

    let activeTimeouts = [];

    const stepTimings = [
        { pct: 15, delay: 600 },
        { pct: 40, delay: 1800 },
        { pct: 75, delay: 3200 }
    ];

    stepTimings.forEach((step, idx) => {
        const timeoutId = setTimeout(() => {

            if (idx > 0) {
                const prev = steps[idx - 1];
                prev.classList.remove('opacity-40');
                prev.querySelector('.step-circle').innerHTML = `<svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>`;
                prev.querySelector('.step-circle').classList.replace('border-brand-500', 'border-emerald-500');
                prev.querySelector('span').classList.replace('text-slate-300', 'text-emerald-400');
            }

            const current = steps[idx];
            current.classList.remove('opacity-40');
            current.querySelector('.step-circle').innerHTML = `<div class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>`;
            current.querySelector('.step-circle').classList.replace('border-slate-600', 'border-brand-500');
            current.querySelector('span').classList.replace('text-slate-500', 'text-slate-300');
            progressBar.style.width = step.pct + '%';
            progressText.textContent = step.pct + '% complete';
        }, step.delay);
        activeTimeouts.push(timeoutId);
    });

    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'x-api-key': getApiKey() },
            body: formData
        });

        if (response.status === 403) {
            clearApiKey();
            activeTimeouts.forEach(clearTimeout);
            resetApp();
            showAuthGate();
            showToast('error', 'Authentication Failed', 'Your API key is invalid. Please re-enter it.');
            return;
        }

        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const actualData = await response.json();
        activeTimeouts.forEach(clearTimeout);
        steps.forEach(step => {
            step.classList.remove('opacity-40');
            const circle = step.querySelector('.step-circle');
            circle.innerHTML = `<svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>`;
            circle.classList.remove('border-brand-500', 'border-slate-600');
            circle.classList.add('border-emerald-500');
            const span = step.querySelector('span');
            span.classList.remove('text-slate-500', 'text-slate-300');
            span.classList.add('text-emerald-400');
        });

        progressBar.style.width = '100%';

        progressText.textContent = '100% complete';

        setTimeout(() => {
            procSection.classList.add('hidden');
            showDashboard(actualData);
        }, 800);
        
    } catch (error) {
        console.error("Analysis Request Failed:", error);
        activeTimeouts.forEach(clearTimeout);
        resetApp();
        showToast('error', 'Analysis Failed', 'The document parsing sequence failed. Please verify the document layout and retry.');
    }
}

function toggleTask(taskId, completed) {
    if (!window.taskData) return;
    
    if (typeof taskId !== 'string' || !/^[A-Za-z0-9\-]+$/.test(taskId) || taskId.length > 20) {
        console.warn('toggleTask: rejected invalid taskId:', taskId);
        return;
    }

    completed = !!completed;

    for (const dept of window.taskData.departments) {

        const task = dept.tasks.find(t => t.id === taskId);

        if (task) { task.completed = completed; break; }
    }

    const cb = document.getElementById(`cb-${taskId}`);

    if (cb) {
        cb.style.backgroundImage = completed
            ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 13l4 4L19 7'/%3E%3C/svg%3E\")"
            : 'none';
    }

    const card = document.getElementById(`task-${taskId}`);

    if (card) {
        const title = card.querySelector('.task-text');
        const desc = card.querySelector('p');
        
        if (completed) {
            if (title) title.classList.add('line-through', 'opacity-50');
            if (desc) desc.classList.add('opacity-30');
        } else {
            if (title) title.classList.remove('line-through', 'opacity-50');
            if (desc) desc.classList.remove('opacity-30');
        }
    }
    updateComplianceScore();
}

function resetApp() {

    window.taskData = null;
    window.currentFilter = 'all';
    const dashSection = document.getElementById('dashboard-section');

    if (dashSection) dashSection.classList.add('hidden');
    const procSection = document.getElementById('processing-section');

    if (procSection) procSection.classList.add('hidden');
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection && isAuthenticated()) uploadSection.classList.remove('hidden');
    const progressBar = document.getElementById('progress-bar');

    if (progressBar) progressBar.style.width = '0%';
    const progressText = document.getElementById('progress-text');

    if (progressText) progressText.textContent = '0% complete';

    document.querySelectorAll('.step-item').forEach((step, i) => {
        step.classList.toggle('opacity-40', i > 0);
        const circle = step.querySelector('.step-circle');

        if (circle) {
            circle.className = 'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 step-circle ' + (i === 0 ? 'border-brand-500' : 'border-slate-600');
            circle.innerHTML = i === 0 ? '<div class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>' : '';
        }

        const span = step.querySelector('span');

        if (span) span.className = i === 0 ? 'text-slate-300' : 'text-slate-500';
    });

    verifyBackendConnection();

    const fileInput = document.getElementById('file-input');

    if (fileInput) fileInput.value = '';
}

function exportTasks() {

    if (!window.taskData) return;

    const lines = ['Department,Task ID,Title,Priority,Due Date,Status'];

    window.taskData.departments.forEach(dept => {
        dept.tasks.forEach(t => {
            const safeDept = sanitizeCSV(dept.name);
            const safeId = sanitizeCSV(t.id);
            const safeTitle = sanitizeCSV(t.title);
            const safePriority = sanitizeCSV(t.priority);
            const safeStatus = sanitizeCSV(t.completed ? 'Done' : 'Pending');
            const taskDescLower = (t.description || "").toLowerCase();
            const isContinuous = taskDescLower.includes("continuous") || taskDescLower.includes("log of all original");
            const safeDueDate = isContinuous ? "No deadline" : sanitizeCSV(t.dueDate);
            lines.push(`"${safeDept}","${safeId}","${safeTitle}","${safePriority}","${safeDueDate}","${safeStatus}"`);
        });
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'compliance_action_plan.csv'; a.click();
    URL.revokeObjectURL(url);
    
    if(typeof showToast === 'function') showToast('success', 'Exported', 'Action plan downloaded successfully.');
}