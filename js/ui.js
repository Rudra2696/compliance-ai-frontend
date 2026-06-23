window.currentFilter = 'all';
function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showDashboard(data) {
    window.taskData = data;
    const dashboard = document.getElementById('dashboard-section');
    if (dashboard) dashboard.classList.remove('hidden');
    const statusInd = document.getElementById('status-indicator');
    if (statusInd) {
        statusInd.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-400 ring-pulse"></span>
            <span class="text-slate-400">Analysis Completed</span>
        `;
    }
    const titleEl = document.getElementById('doc-title');
    const descEl = document.getElementById('doc-description');
    if (titleEl) titleEl.innerHTML = escapeHTML(data.document.title).replace(/&amp;/g, '&');
    if (descEl) descEl.textContent = escapeHTML(data.summary);
    const totalTasks = data.departments.reduce((sum, d) => sum + d.tasks.length, 0);
    const criticalTasks = data.departments.reduce((sum, d) => sum + d.tasks.filter(t => t.priority === 'critical').length, 0);
    const stats = [
        { label: 'Total Obligations', value: totalTasks, icon: '📋', color: 'from-brand-500/20 to-brand-600/5' },
        { label: 'Critical Items', value: criticalTasks, icon: '🔴', color: 'from-red-500/20 to-red-600/5' },
        { label: 'Departments', value: data.departments.length, icon: '🏢', color: 'from-amber-500/20 to-amber-600/5' },
        { label: 'Risk Level', value: escapeHTML(data.document.riskLevel), icon: '⚠️', color: 'from-orange-500/20 to-orange-600/5' }
    ];
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
        statsGrid.innerHTML = stats.map((s, i) => `
            <div class="stat-card glass rounded-xl p-5 transition-all duration-500 transform translate-y-0 opacity-100">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-2xl">${s.icon}</span>
                    <span class="text-[10px] uppercase tracking-widest text-slate-500">${escapeHTML(s.label)}</span>
                </div>
                <p class="text-3xl font-extrabold">${s.value}</p>
            </div>
        `).join('');
    }
    const tabsContainer = document.getElementById('department-tabs');
    if (tabsContainer) {
        tabsContainer.innerHTML = `<button class="department-tab active px-4 py-2 rounded-xl text-sm font-medium" data-dept="all" onclick="filterDepartment('all', this)">All Tasks</button>`;
        data.departments.forEach(dept => {
            const btn = document.createElement('button');
            btn.className = 'department-tab px-4 py-2 rounded-xl text-sm font-medium text-slate-400';
            btn.dataset.dept = dept.name;
            btn.innerHTML = `${dept.icon} ${escapeHTML(dept.name)}`;
            btn.onclick = function() { filterDepartment(dept.name, this); };
            tabsContainer.appendChild(btn);
        });
    }
    renderTasks(data.departments);
    setTimeout(() => updateComplianceScore(), 400);
    showToast('success', 'Analysis Completed', `${totalTasks} obligations mapped out successfully.`);
}
function renderTasks(departments) {
    const container = document.getElementById('tasks-container');
    if (!container) return;
    container.innerHTML = '';
    const filteredDepts = window.currentFilter === 'all'
        ? departments
        : departments.filter(d => d.name === window.currentFilter);
    filteredDepts.forEach((dept, deptIdx) => {
        const section = document.createElement('div');
        section.className = "transition-all duration-500 transform translate-y-0 opacity-100 mb-6";
        section.innerHTML = `
            <div class="flex items-center gap-3 mb-4 mt-${deptIdx > 0 ? '8' : '2'}">
                <span class="text-xl">${dept.icon}</span>
                <h3 class="text-lg font-bold">${escapeHTML(dept.name)}</h3>
                <span class="text-xs text-slate-500 bg-surface-3 px-2 py-0.5 rounded-full">${dept.tasks.length} tasks</span>
                <div class="flex-1 h-px bg-gradient-to-r from-slate-700/50 to-transparent"></div>
            </div>
            <div class="grid gap-3">
                ${dept.tasks.map(task => renderTaskCard(task, dept.color)).join('')}
            </div>
        `;
        container.appendChild(section);
    });
}
function renderTaskCard(task, color) {
    const priorityClasses = {
        critical: 'priority-critical',
        high: 'priority-high',
        medium: 'priority-medium',
        low: 'priority-low'
    };
    let dateDisplay = "No deadline";
    let dateColorClass = "text-slate-500";
    const taskDescLower = (task.description || "").toLowerCase();
    const isContinuous = taskDescLower.includes("continuous") || taskDescLower.includes("log of all original");
    if (task.dueDate && task.dueDate.trim() !== "" && !isContinuous) {
        const parts = task.dueDate.split('-');
        if (parts.length === 3) {
            const dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            const dueDateFormatted = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            if (daysLeft < 0) {
                dateColorClass = "text-red-400 font-medium";
                dateDisplay = `${dueDateFormatted} (Overdue by ${Math.abs(daysLeft)}d)`;
            } else if (daysLeft <= 14) {
                dateColorClass = "text-amber-400 font-medium";
                dateDisplay = `${dueDateFormatted} (${daysLeft}d left)`;
            } else {
                dateColorClass = "text-emerald-400";
                dateDisplay = `${dueDateFormatted} (${daysLeft}d left)`;
            }
        }
    }
    const safeId = escapeHTML(task.id);
    const safeTitle = escapeHTML(task.title);
    const safePriority = escapeHTML(task.priority);
    const safeDescription = escapeHTML(task.description);
    // Section hidden, Task ID restored next to the live countdown badge
    return `
        <div class="task-card glass-light rounded-xl p-5 group" id="task-${safeId}">
            <div class="flex items-start gap-4">
                <div class="pt-0.5">
                    <input type="checkbox" id="cb-${safeId}" class="checkbox-custom w-5 h-5 rounded-md border-2 border-slate-600 bg-transparent appearance-none cursor-pointer checked:bg-brand-500 checked:border-brand-500 relative"
                           ${task.completed ? 'checked' : ''}
                           onchange="toggleTask('${safeId}', this.checked)"
                           style="background-image: ${task.completed ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 13l4 4L19 7'/%3E%3C/svg%3E\")" : 'none'}; background-size: 14px; background-position: center; background-repeat: no-repeat;">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-1.5">
                        <span class="task-text text-sm font-semibold ${task.completed ? 'line-through opacity-50' : ''}">${safeTitle}</span>
                        <span class="${priorityClasses[task.priority] || 'priority-low'} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white">${safePriority}</span>
                    </div>
                    <p class="text-slate-400 text-xs leading-relaxed mb-3 ${task.completed ? 'opacity-30' : ''}">${safeDescription}</p>
                    <div class="flex items-center gap-4 flex-wrap">
                        <span class="flex items-center gap-1.5 text-[11px] ${dateColorClass}">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            ${dateDisplay}
                        </span>
                        <span class="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">${safeId}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}
function filterDepartment(deptName, activeBtn) {
    window.currentFilter = deptName;
    document.querySelectorAll('.department-tab').forEach(btn => {
        btn.classList.remove('active', 'text-white');
        btn.classList.add('text-slate-400');
    });
    if (activeBtn) activeBtn.classList.add('active', 'text-white');
    if (window.taskData && window.taskData.departments) {
        renderTasks(window.taskData.departments);
    }
}
function updateComplianceScore() {
    if (!window.taskData || !window.taskData.departments) return;
    const all = window.taskData.departments.flatMap(d => d.tasks);
    if (all.length === 0) return;
    const done = all.filter(t => t.completed).length;
    const pct = Math.round((done / all.length) * 100);
    const ring = document.getElementById('score-ring');
    if (ring) {
        const circumference = 2 * Math.PI * 42;
        ring.style.strokeDashoffset = circumference - (circumference * pct / 100);
    }
    const scoreTxt = document.getElementById('score-text');
    if (scoreTxt) scoreTxt.textContent = pct + '%';
    const label = document.getElementById('score-label');
    const sublabel = document.getElementById('score-sublabel');
    if (label && sublabel) {
        if (pct === 0) { label.textContent = 'Getting Started'; sublabel.textContent = 'Complete the tasks to improve your score'; }
        else if (pct < 30) { label.textContent = 'In Progress'; sublabel.textContent = 'Good start — keep checking off tasks'; }
        else if (pct < 60) { label.textContent = 'Making Headway'; sublabel.textContent = 'You\'re building momentum'; }
        else if (pct < 90) { label.textContent = 'Almost There'; sublabel.textContent = 'Just a few more tasks remaining'; }
        else { label.textContent = 'Fully Compliant'; sublabel.textContent = 'Congratulations! All obligations addressed'; }
    }
}
function showToast(type, title, msg) {
    let container = document.getElementById('centered-alert-overlay');
    if (!container) {
        container = document.createElement('div');
        container.id = 'centered-alert-overlay';
        container.className = 'fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999] transition-opacity duration-300 opacity-0 pointer-events-none';
        container.innerHTML = `
            <div id="centered-alert-box" class="w-full max-w-md mx-4 glass border border-slate-700 p-6 rounded-2xl shadow-2xl transform scale-95 transition-all duration-300 flex flex-col items-center text-center">
                <div id="alert-icon-wrapper" class="w-14 h-14 rounded-full flex items-center justify-center mb-4"></div>
                <h3 id="alert-title-text" class="text-xl font-bold text-white mb-2"></h3>
                <p id="alert-msg-text" class="text-slate-400 text-sm leading-relaxed mb-6"></p>
                <button onclick="closeAlertModal()" class="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-medium rounded-xl transition-all">
                    Acknowledge
                </button>
            </div>
        `;
        document.body.appendChild(container);
    }
    const modalBox = document.getElementById('centered-alert-box');
    const iconEl = document.getElementById('alert-icon-wrapper');
    document.getElementById('alert-title-text').textContent = title;
    document.getElementById('alert-msg-text').textContent = msg;
    const icons = {
        success: { bg: 'bg-emerald-500/20 text-emerald-400', svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>' },
        error: { bg: 'bg-red-500/20 text-red-400', svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>' },
        info: { bg: 'bg-brand-500/20 text-brand-400', svg: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' }
    };
    const cfg = icons[type] || icons.info;
    iconEl.className = `w-14 h-14 rounded-full flex items-center justify-center mb-4 ${cfg.bg}`;
    iconEl.innerHTML = cfg.svg;
    container.classList.remove('opacity-0', 'pointer-events-none');
    container.classList.add('opacity-100');
    if (modalBox) {
        modalBox.classList.remove('scale-95');
        modalBox.classList.add('scale-100');
    }
}
function closeAlertModal() {
    const container = document.getElementById('centered-alert-overlay');
    const modalBox = document.getElementById('centered-alert-box');
    if (container) {
        container.classList.remove('opacity-100');
        container.classList.add('opacity-0', 'pointer-events-none');
        if (modalBox) {
            modalBox.classList.remove('scale-100');
            modalBox.classList.add('scale-95');
        }
    }
}