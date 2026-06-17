// =====================================================================
//  SECURITY HELPERS
// =====================================================================
function sanitizeCSV(text) {
    if (text == null) return '';
    let str = String(text);
    
    // Escape double quotes by doubling them per CSV RFC 4180
    str = str.replace(/"/g, '""');
    
    // Defend against CSV Formula Injection (DDE)
    // If the field begins with =, +, -, or @, prepend a single quote
    if (/^[=+\-@]/.test(str)) {
        str = "'" + str;
    }
    return str;
}

// =====================================================================
//  APPLICATION STATE
// =====================================================================
window.currentFilter = 'all';
window.taskData = null;

// =====================================================================
//  FILE UPLOAD HANDLER
// =====================================================================
const uploadZone = document.getElementById('upload-zone');

// Drag & drop events
['dragenter', 'dragover'].forEach(evt => {
    uploadZone.addEventListener(evt, e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
});
['dragleave', 'drop'].forEach(evt => {
    uploadZone.addEventListener(evt, e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); });
});
uploadZone.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    if (files.length && files[0].type === 'application/pdf') {
        // Pass the actual file object
        startProcessing(files[0]);
    } else {
        showToast('error', 'Invalid File', 'Please upload a PDF document.');
    }
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        // Pass the actual file object
        startProcessing(file);
    } else {
        showToast('error', 'Invalid File', 'Please upload a PDF document.');
    }
}

// =====================================================================
//  DEMO MODE
// =====================================================================
async function runDemo() {
    document.getElementById('upload-section').classList.add('hidden');
    const procSection = document.getElementById('processing-section');
    procSection.classList.remove('hidden');

    // Update status indicator
    document.getElementById('status-indicator').innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span class="text-slate-400">Loading Demo...</span>
    `;

    const steps = document.querySelectorAll('.step-item');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    try {
        // Fetch from the dedicated demo endpoint without API keys or FormData
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/analyze/demo`, {
    method: 'POST'
    });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const demoData = await response.json();

        // Quickly animate the progress bar and all step indicators to 100% completion
        steps.forEach(step => {
            step.classList.remove('opacity-40');
            const circle = step.querySelector('.step-circle');
            circle.innerHTML = `<svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>`;
            circle.classList.remove('border-slate-600', 'border-brand-500');
            circle.classList.add('border-emerald-500');
            
            const span = step.querySelector('span');
            span.classList.remove('text-slate-500', 'text-slate-300');
            span.classList.add('text-emerald-400');
        });
        
        progressBar.style.width = '100%';
        progressText.textContent = '100% complete';

        // Brief delay for the animation to finish before showing the dashboard
        setTimeout(() => {
            procSection.classList.add('hidden');
            showDashboard(demoData);
        }, 600);

    } catch (error) {
        console.error("Demo Request Failed:", error);
        resetApp();
        showToast('error', 'Demo Failed', 'Could not load the demo data from the backend API.');
    }
}

// =====================================================================
//  PROCESSING LOGIC & API CALL
// =====================================================================
async function startProcessing(file) {
    document.getElementById('upload-section').classList.add('hidden');
    const procSection = document.getElementById('processing-section');
    procSection.classList.remove('hidden');

    // Update status
    document.getElementById('status-indicator').innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span class="text-slate-400">Processing…</span>
    `;

    const steps = document.querySelectorAll('.step-item');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    const stepTimings = [
        { pct: 15, delay: 600 },
        { pct: 40, delay: 1800 },
        { pct: 75, delay: 3200 }
        // The final 100% stage is now tied to the API fetch resolution
    ];

    // Maintain the visual simulation running concurrently
    stepTimings.forEach((step, idx) => {
        setTimeout(() => {
            // Complete previous step
            if (idx > 0) {
                const prev = steps[idx - 1];
                prev.classList.remove('opacity-40');
                prev.querySelector('.step-circle').innerHTML = `<svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>`;
                prev.querySelector('.step-circle').classList.replace('border-brand-500', 'border-emerald-500');
                prev.querySelector('span').classList.replace('text-slate-300', 'text-emerald-400');
            }

            // Activate current step
            const current = steps[idx];
            current.classList.remove('opacity-40');
            current.querySelector('.step-circle').innerHTML = `<div class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>`;
            current.querySelector('.step-circle').classList.add('border-brand-500');
            current.querySelector('span').classList.replace('text-slate-500', 'text-slate-300');

            // Update progress bar
            progressBar.style.width = step.pct + '%';
            progressText.textContent = step.pct + '% complete';
        }, step.delay);
    });

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/analyze`, {
    method: 'POST',
    headers: {
        'x-api-key': window.APP_CONFIG.ADMIN_API_KEY // Pulls dynamically from config.js
    },
    body: formData // Your uploaded multi-part PDF byte stream
    });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const actualData = await response.json();

        // Ensure UI concludes its sequence gracefully once the fetch resolves
        const lastStep = steps[3];
        lastStep.classList.remove('opacity-40');
        lastStep.querySelector('.step-circle').innerHTML = `<svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>`;
        lastStep.querySelector('.step-circle').classList.replace('border-brand-500', 'border-emerald-500');
        lastStep.querySelector('span').classList.replace('text-slate-500', 'text-emerald-400');
        
        progressBar.style.width = '100%';
        progressText.textContent = '100% complete';

        setTimeout(() => {
            procSection.classList.add('hidden');
            showDashboard(actualData);
        }, 600);

    } catch (error) {
        console.error("Analysis Request Failed:", error);
        resetApp();
        showToast('error', 'Analysis Failed', 'Could not process the document with the backend API.');
    }
}

// =====================================================================
//  INTERACTIVITY
// =====================================================================
function toggleTask(taskId, completed) {
    // Update data
    for (const dept of window.taskData.departments) {
        const task = dept.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = completed;
            break;
        }
    }

    // Update checkbox visual
    const cb = document.getElementById(`cb-${taskId}`);
    if (cb) {
        cb.style.backgroundImage = completed
            ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 13l4 4L19 7'/%3E%3C/svg%3E\")"
            : 'none';
    }

    // Update card styling
    const card = document.getElementById(`task-${taskId}`);
    if (card) {
        const title = card.querySelector('.task-text');
        const desc = card.querySelector('p');
        if (completed) {
            title.classList.add('line-through', 'opacity-50');
            desc.classList.add('opacity-30');
        } else {
            title.classList.remove('line-through', 'opacity-50');
            desc.classList.remove('opacity-30');
        }
    }

    updateComplianceScore();
}

function filterDepartment(dept, btn) {
    window.currentFilter = dept;
    document.querySelectorAll('.department-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderTasks(window.taskData.departments);
}

function resetApp() {
    window.taskData = null;
    window.currentFilter = 'all';
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('processing-section').classList.add('hidden');
    document.getElementById('upload-section').classList.remove('hidden');

    // Reset tabs
    const tabs = document.getElementById('department-tabs');
    tabs.innerHTML = `<button class="department-tab active px-4 py-2 rounded-xl text-sm font-medium" data-dept="all" onclick="filterDepartment('all', this)">All Tasks</button>`;

    // Reset progress
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('progress-text').textContent = '0% complete';

    // Reset steps
    document.querySelectorAll('.step-item').forEach((step, i) => {
        step.classList.toggle('opacity-40', i > 0);
        const circle = step.querySelector('.step-circle');
        circle.className = 'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 step-circle ' + (i === 0 ? 'border-brand-500' : 'border-slate-600');
        circle.innerHTML = i === 0 ? '<div class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>' : '';
        const span = step.querySelector('span');
        span.className = i === 0 ? 'text-slate-300' : 'text-slate-500';
    });

    // Reset status
    document.getElementById('status-indicator').innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400 ring-pulse"></span>
        <span class="text-slate-400">System Ready</span>
    `;

    // Reset file input
    document.getElementById('file-input').value = '';
}

function exportTasks() {
    if (!window.taskData) return;
    const lines = ['Department,Task ID,Title,Priority,Due Date,Status,Source Clause'];
    
    window.taskData.departments.forEach(dept => {
        dept.tasks.forEach(t => {
            // Apply CSV sanitization logic to mitigate formula injection 
            const safeDept = sanitizeCSV(dept.name);
            const safeId = sanitizeCSV(t.id);
            const safeTitle = sanitizeCSV(t.title);
            const safePriority = sanitizeCSV(t.priority);
            const safeDueDate = sanitizeCSV(t.dueDate);
            const safeStatus = sanitizeCSV(t.completed ? 'Done' : 'Pending');
            const safeSource = sanitizeCSV(t.sourceClause);
            
            lines.push(`"${safeDept}","${safeId}","${safeTitle}","${safePriority}","${safeDueDate}","${safeStatus}","${safeSource}"`);
        });
    });
    
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'compliance_action_plan.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Exported', 'CSV file downloaded successfully.');
}