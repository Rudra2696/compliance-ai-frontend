// =====================================================================
//  SECURITY HELPERS
// =====================================================================

function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// =====================================================================
//  UI RENDERING FUNCTIONS
// =====================================================================

function showDashboard(data) {
    window.taskData = data;
    const dashboard = document.getElementById('dashboard-section');
    dashboard.classList.remove('hidden');

    // Update status
    document.getElementById('status-indicator').innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400 ring-pulse"></span>
        <span class="text-slate-400">Analysis Complete</span>
    `;

    // Document summary (Escaping title and description just to be safe)
    document.getElementById('doc-title').textContent = escapeHTML(data.document.title);
    document.getElementById('doc-description').textContent = escapeHTML(data.summary);

    // Stats
    const totalTasks = data.departments.reduce((sum, d) => sum + d.tasks.length, 0);
    const criticalTasks = data.departments.reduce((sum, d) => sum + d.tasks.filter(t => t.priority === 'critical').length, 0);
    const stats = [
        { label: 'Total Obligations', value: totalTasks, icon: '📋', color: 'from-brand-500/20 to-brand-600/5' },
        { label: 'Critical Items', value: criticalTasks, icon: '🔴', color: 'from-red-500/20 to-red-600/5' },
        { label: 'Departments', value: data.departments.length, icon: '🏢', color: 'from-amber-500/20 to-amber-600/5' },
        { label: 'Risk Level', value: escapeHTML(data.document.riskLevel), icon: '⚠️', color: 'from-orange-500/20 to-orange-600/5' }
    ];

    document.getElementById('stats-grid').innerHTML = stats.map((s, i) => `
        <div class="stat-card glass rounded-xl p-5 animate-slide-up stagger-${i + 1}" style="opacity:0">
            <div class="flex items-center justify-between mb-3">
                <span class="text-2xl">${s.icon}</span>
                <span class="text-[10px] uppercase tracking-widest text-slate-500">${escapeHTML(s.label)}</span>
            </div>
            <p class="text-3xl font-extrabold animate-count-up">${s.value}</p>
        </div>
    `).join('');

    // Department tabs
    const tabsContainer = document.getElementById('department-tabs');
    data.departments.forEach((dept, i) => {
        const btn = document.createElement('button');
        btn.className = 'department-tab px-4 py-2 rounded-xl text-sm font-medium text-slate-400';
        btn.dataset.dept = dept.name;
        btn.innerHTML = `${dept.icon} ${escapeHTML(dept.name)}`;
        btn.onclick = function() { filterDepartment(dept.name, this); };
        tabsContainer.appendChild(btn);
    });

    // Render all tasks
    renderTasks(data.departments);

    // Animate compliance score
    setTimeout(() => updateComplianceScore(), 800);

    showToast('success', 'Analysis Complete', `${totalTasks} obligations extracted across ${data.departments.length} departments.`);
}

function renderTasks(departments) {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';

    const filteredDepts = window.currentFilter === 'all'
        ? departments
        : departments.filter(d => d.name === window.currentFilter);

    filteredDepts.forEach((dept, deptIdx) => {
        const section = document.createElement('div');
        section.className = `animate-slide-up stagger-${Math.min(deptIdx + 1, 5)}`;
        section.style.opacity = '0';

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

    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    const dueDateFormatted = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const isOverdue = daysLeft < 0;
    const isUrgent = daysLeft >= 0 && daysLeft <= 14;

    // Secure dynamic strings against DOM XSS vulnerabilities
    const safeId = escapeHTML(task.id);
    const safeTitle = escapeHTML(task.title);
    const safePriority = escapeHTML(task.priority);
    const safeDescription = escapeHTML(task.description);
    const safeSourceClause = escapeHTML(task.sourceClause);

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
                        <span class="flex items-center gap-1.5 text-[11px] ${isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-500'}">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            ${dueDateFormatted} ${isOverdue ? '(Overdue)' : isUrgent ? `(${daysLeft}d left)` : ''}
                        </span>
                        <span class="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                            ${safeSourceClause}
                        </span>
                        <span class="text-[10px] text-slate-700 font-mono">${safeId}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateComplianceScore() {
    const all = window.taskData.departments.flatMap(d => d.tasks);
    const done = all.filter(t => t.completed).length;
    const pct = Math.round((done / all.length) * 100);

    // Animate ring
    const ring = document.getElementById('score-ring');
    const circumference = 2 * Math.PI * 42;
    ring.style.strokeDashoffset = circumference - (circumference * pct / 100);

    // Animate number
    document.getElementById('score-text').textContent = pct + '%';

    // Update label
    const label = document.getElementById('score-label');
    const sublabel = document.getElementById('score-sublabel');
    if (pct === 0) { label.textContent = 'Getting Started'; sublabel.textContent = 'Complete the tasks to improve your score'; }
    else if (pct < 30) { label.textContent = 'In Progress'; sublabel.textContent = 'Good start — keep checking off tasks'; }
    else if (pct < 60) { label.textContent = 'Making Headway'; sublabel.textContent = 'You\'re building momentum'; }
    else if (pct < 90) { label.textContent = 'Almost There'; sublabel.textContent = 'Just a few more tasks remaining'; }
    else { label.textContent = 'Fully Compliant'; sublabel.textContent = 'Congratulations! All obligations addressed'; }

    // Update stats if visible
    const statsValues = document.querySelectorAll('#stats-grid .stat-card');
    if (statsValues.length >= 1) {
        const completedStat = `${done}/${all.length}`;
    }
}

// =====================================================================
//  TOAST NOTIFICATIONS
// =====================================================================
function showToast(type, title, msg) {
    const toast = document.getElementById('toast');
    const iconEl = document.getElementById('toast-icon');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-msg').textContent = msg;

    const icons = {
        success: { bg: 'bg-emerald-500/20', svg: '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' },
        error: { bg: 'bg-red-500/20', svg: '<svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' },
        info: { bg: 'bg-brand-500/20', svg: '<svg class="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' }
    };
    const cfg = icons[type] || icons.info;
    iconEl.className = `w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`;
    iconEl.innerHTML = cfg.svg;

    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
        toast.classList.remove('translate-y-0', 'opacity-100');
    }, 4000);
}