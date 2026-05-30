const dom = {
    settingsModal: document.getElementById('settings-modal'),
    templatesModal: document.getElementById('templates-modal'),
    confirmModal: document.getElementById('confirm-modal'),
    topbar: document.querySelector('.topbar'),
    dashboardScroll: document.querySelector('.dashboard-scroll'),
    sidebar: document.querySelector('.sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop'),
    btnSettings: document.getElementById('btn-settings'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    btnTemplates: document.getElementById('btn-templates'),
    btnSidebarToggle: document.getElementById('btn-sidebar-toggle'),
    btnSidebarClose: document.getElementById('btn-sidebar-close'),
    btnExportMenu: document.getElementById('btn-export-menu'),
    exportMenu: document.getElementById('export-menu'),
    btnAddSubject: document.getElementById('btn-add-subject'),
    addStudentForm: document.getElementById('add-student-form'),
    addSubjectForm: document.getElementById('add-subject-form'),
    settingsForm: document.getElementById('settings-form'),
    updateForm: document.getElementById('update-form'),
    searchInput: document.getElementById('global-search'),
    sortSelect: document.getElementById('sort-select'),
    tabByStudent: document.getElementById('tab-by-student'),
    tabBySubject: document.getElementById('tab-by-subject'),
    studentsTable: document.getElementById('students-table'),
    studentsBody: document.getElementById('students-body'),
    emptyState: document.getElementById('empty-state'),
    emptyStateTitle: document.getElementById('empty-state-title'),
    emptyStateCopy: document.getElementById('empty-state-copy'),
    updateContainer: document.getElementById('update-container'),
    studentFormInputs: document.getElementById('student-form-inputs'),
    subjectSelect: document.getElementById('subject-select'),
    subjectStudentsList: document.getElementById('subject-students-list'),
    subjectsListContainer: document.getElementById('subjects-list'),
    tableHeadRow: document.getElementById('table-head-row'),
    updateFormInputs: document.getElementById('update-form-inputs'),
    printHeadRow: document.getElementById('print-head-row'),
    printBody: document.getElementById('print-body'),
    printDate: document.getElementById('print-date'),
    templateSearchInput: document.getElementById('template-search'),
    templateLibrary: document.getElementById('template-library'),
    templateCurrentSummary: document.getElementById('template-current-summary'),
    templateToolbar: document.getElementById('template-toolbar'),
    templateBackButton: document.getElementById('template-back-btn'),
    templateModalTitle: document.getElementById('template-modal-title'),
    templateModalDescription: document.getElementById('template-modal-desc'),
    newSubjectName: document.getElementById('new-subject-name'),
    newSubjectMax: document.getElementById('new-subject-max'),
    settingQualifyType: document.getElementById('setting-qualify-type'),
    settingQualifyValue: document.getElementById('setting-qualify-value'),
    settingQualifyLabel: document.getElementById('setting-qualify-label'),
    settingQualifyHelp: document.getElementById('setting-qualify-help'),
    updateName: document.getElementById('update-name'),
    cancelUpdate: document.getElementById('cancel-update'),
    subjectPanelMeta: document.getElementById('subject-panel-meta'),
    resultsSummary: document.getElementById('results-summary'),
    overviewSubjectCount: document.getElementById('overview-subject-count'),
    overviewTotalMax: document.getElementById('overview-total-max'),
    overviewQualification: document.getElementById('overview-qualification'),
    overviewReadyTemplates: document.getElementById('overview-ready-templates'),
    insightTopName: document.getElementById('insight-top-name'),
    insightTopScore: document.getElementById('insight-top-score'),
    insightAttentionCount: document.getElementById('insight-attention-count'),
    insightPassRule: document.getElementById('insight-pass-rule'),
    insightTotalMax: document.getElementById('insight-total-max'),
    subjectHighlightList: document.getElementById('subject-highlight-list'),
    rank1Name: document.getElementById('rank1-name'),
    rank1Mark: document.getElementById('rank1-mark'),
    rank2Name: document.getElementById('rank2-name'),
    rank2Mark: document.getElementById('rank2-mark'),
    rank3Name: document.getElementById('rank3-name'),
    rank3Mark: document.getElementById('rank3-mark'),
    kpiTotal: document.getElementById('kpi-total'),
    kpiPassed: document.getElementById('kpi-passed'),
    kpiFailed: document.getElementById('kpi-failed'),
    kpiAverage: document.getElementById('kpi-average'),
    kpiPassRate: document.getElementById('kpi-pass-rate'),
    kpiFailRate: document.getElementById('kpi-fail-rate'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    toastIcon: document.querySelector('#toast .toast-icon'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmDescription: document.getElementById('confirm-description'),
    confirmCancel: document.getElementById('confirm-cancel'),
    confirmConfirm: document.getElementById('confirm-confirm')
};

let currentSort = 'entry-desc';
let templateStep = 'level';
let selectedLevel = null;
let selectedBranchIndex = null;
let templateSearchQuery = '';
let editingId = null;
let toastTimer = null;
let confirmResolver = null;
const modalStack = [];

function init() {
    applyTheme(localStorage.getItem('theme') || 'light');
    applySidebarState();
    renderEverything({ preserveSubjectSelection: false });
    setupEventListeners();
}

function persistState() {
    localStorage.setItem('studentsData', JSON.stringify(students));
    localStorage.setItem('gradeDashSettings', JSON.stringify(settings));
}

function saveState(options = {}) {
    clampQualifySettings();
    persistState();
    renderEverything(options);
}

function renderEverything(options = {}) {
    renderForms(options);
    renderSubjectManagement();
    populateSettingsForm();
    renderCurrentTemplateSummary();

    if (!dom.templatesModal.classList.contains('hidden')) {
        renderTemplateWizard();
    }

    if (editingId !== null) {
        const student = getStudentById(editingId);
        if (student) renderUpdateForm(student);
        else hideUpdateCard();
    }

    renderApp();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function parseInteger(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
}

function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getStudentById(id) {
    return students.find(student => student.id === id);
}

function getCurrentQuery() {
    return dom.searchInput.value.trim().toLowerCase();
}

function getStudentMark(student, subject) {
    const mark = student && student.marks ? student.marks[subject] : 0;
    return Number.isFinite(mark) ? mark : 0;
}

function getTotalMark(student) {
    return settings.subjects.reduce((sum, subject) => sum + getStudentMark(student, subject), 0);
}

function getMaxTotalMarks() {
    return settings.subjects.reduce((sum, subject) => sum + (settings.subjectMaxMarks[subject] || 100), 0);
}

function getPercentage(student) {
    const maxTotal = getMaxTotalMarks();
    if (maxTotal <= 0) return 0;
    return Number(((getTotalMark(student) / maxTotal) * 100).toFixed(1));
}

function hasPassed(student) {
    if (!student || settings.subjects.length === 0) return false;

    return settings.subjects.every(subject => {
        const mark = getStudentMark(student, subject);
        const maxMark = settings.subjectMaxMarks[subject] || 100;

        if (settings.qualifyType === 'marks') {
            return mark >= settings.qualifyValue;
        }

        const percentage = maxMark === 0 ? 0 : (mark / maxMark) * 100;
        return percentage >= settings.qualifyValue;
    });
}

function getFailingSubjectCount(student) {
    return settings.subjects.reduce((count, subject) => {
        const mark = getStudentMark(student, subject);
        const maxMark = settings.subjectMaxMarks[subject] || 100;

        if (settings.qualifyType === 'marks') {
            return count + (mark < settings.qualifyValue ? 1 : 0);
        }

        const percentage = maxMark === 0 ? 0 : (mark / maxMark) * 100;
        return count + (percentage < settings.qualifyValue ? 1 : 0);
    }, 0);
}

function getQualifyRuleSummary() {
    if (settings.subjects.length === 0) return 'Add at least one subject';
    return settings.qualifyType === 'marks'
        ? `At least ${settings.qualifyValue} marks in every subject`
        : `At least ${settings.qualifyValue}% in every subject`;
}

function getShortQualifyRuleSummary() {
    return settings.qualifyType === 'marks'
        ? `>= ${settings.qualifyValue} marks each`
        : `>= ${settings.qualifyValue}% each`;
}

function clampQualifySettings() {
    if (settings.qualifyType === 'percentage') {
        settings.qualifyValue = clampNumber(Number.parseInt(settings.qualifyValue, 10) || 0, 0, 100);
        return;
    }

    const subjectCaps = settings.subjects.map(subject => settings.subjectMaxMarks[subject] || 100);
    const ceiling = subjectCaps.length > 0 ? Math.min(...subjectCaps) : 100;
    settings.qualifyValue = clampNumber(Number.parseInt(settings.qualifyValue, 10) || 0, 0, ceiling);
}

function getSortedStudents() {
    const query = getCurrentQuery();
    let filtered = [...students];

    if (query) {
        filtered = filtered.filter(student => student.name.toLowerCase().includes(query));
    }

    filtered.sort((a, b) => {
        const aTotal = getTotalMark(a);
        const bTotal = getTotalMark(b);

        switch (currentSort) {
            case 'entry-asc':
                return a.id - b.id;
            case 'entry-desc':
                return b.id - a.id;
            case 'marks-desc':
                return bTotal - aTotal || a.name.localeCompare(b.name);
            case 'marks-asc':
                return aTotal - bTotal || a.name.localeCompare(b.name);
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
    });

    return filtered;
}

function getStudentInitials(name) {
    const parts = normalizeName(name).split(' ').filter(Boolean);
    return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'ST';
}

function formatPercent(value) {
    return `${Number(value).toFixed(1)}%`;
}

function getStudentSummary(student) {
    if (hasPassed(student)) return 'Qualified across all current subjects';

    const failingSubjectCount = getFailingSubjectCount(student);
    if (failingSubjectCount === 0) return 'Awaiting evaluation';
    if (failingSubjectCount === 1) return '1 subject below target';
    return `${failingSubjectCount} subjects below target`;
}

function getTopStudents(limit = 3) {
    return [...students]
        .sort((a, b) => getTotalMark(b) - getTotalMark(a) || a.name.localeCompare(b.name))
        .slice(0, limit);
}

function buildExportFilename(extension) {
    const dateStamp = new Date().toISOString().slice(0, 10);
    return `grade-dash-report-${dateStamp}.${extension}`;
}

function validateStudentName(name, studentId = null) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) {
        showToast('Enter a student name before saving.', 'error');
        return null;
    }

    const duplicate = students.find(student => student.id !== studentId && student.name.toLowerCase() === normalizedName.toLowerCase());
    if (duplicate) {
        showToast('That student name already exists. Use a distinct label to avoid confusion.', 'error');
        return null;
    }

    return normalizedName;
}

function collectMarks(inputs) {
    const marks = {};

    for (const input of inputs) {
        const subject = input.dataset.subject;
        const maxMark = settings.subjectMaxMarks[subject] || 100;
        const rawValue = input.value.trim();
        const parsedValue = rawValue === '' ? 0 : parseInteger(rawValue);

        if (parsedValue === null || parsedValue < 0) {
            showToast(`Enter a whole number between 0 and ${maxMark} for ${subject}.`, 'error');
            input.focus();
            return null;
        }

        if (parsedValue > maxMark) {
            showToast(`${subject} cannot exceed its maximum of ${maxMark}.`, 'error');
            input.focus();
            return null;
        }

        marks[subject] = parsedValue;
    }

    return marks;
}

function syncQualifyFieldCopy() {
    const qualifyType = dom.settingQualifyType.value;

    if (qualifyType === 'marks') {
        const subjectCaps = settings.subjects.map(subject => settings.subjectMaxMarks[subject] || 100);
        const ceiling = subjectCaps.length > 0 ? Math.min(...subjectCaps) : 100;
        dom.settingQualifyLabel.textContent = 'Minimum marks per subject';
        dom.settingQualifyHelp.textContent = `Each subject must meet this raw score. The highest allowed value right now is ${ceiling}.`;
        dom.settingQualifyValue.max = String(ceiling);
    } else {
        dom.settingQualifyLabel.textContent = 'Minimum percentage per subject';
        dom.settingQualifyHelp.textContent = 'Each subject must reach this percentage of its own maximum mark.';
        dom.settingQualifyValue.max = '100';
    }
}

function populateSettingsForm() {
    dom.settingQualifyType.value = settings.qualifyType;
    dom.settingQualifyValue.value = settings.qualifyValue;
    syncQualifyFieldCopy();
}

function renderForms(options = {}) {
    const preserveSubjectSelection = options.preserveSubjectSelection !== false;
    const previousSubject = preserveSubjectSelection ? dom.subjectSelect.value : '';

    const studentFields = settings.subjects.map((subject, index) => {
        const maxMark = settings.subjectMaxMarks[subject] || 100;
        const fieldId = `student-subject-${index}`;

        return `
            <div class="form-group">
                <label for="${fieldId}">${escapeHtml(subject)}</label>
                <input type="number" id="${fieldId}" class="student-subject-input" data-subject="${escapeHtml(subject)}" min="0" max="${maxMark}" step="1" placeholder="0">
                <p class="field-note">Max ${maxMark}</p>
            </div>
        `;
    }).join('');

    dom.studentFormInputs.innerHTML = `
        <div class="form-group">
            <label for="student-name">Student name</label>
            <input type="text" id="student-name" required placeholder="e.g. Aadhya Reddy" autocomplete="off">
            <p class="field-note">Use the name exactly as you want it to appear in reports.</p>
        </div>
        ${studentFields}
        <div class="form-actions-stack">
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-user-plus"></i>
                <span>Add student</span>
            </button>
            <p class="field-note">All marks are validated against the configured subject maximums.</p>
        </div>
    `;

    dom.subjectSelect.innerHTML = `
        <option value="">Choose a subject</option>
        ${settings.subjects.map(subject => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join('')}
    `;

    if (previousSubject && settings.subjects.includes(previousSubject)) {
        dom.subjectSelect.value = previousSubject;
    }

    dom.tableHeadRow.innerHTML = `
        <th>Student profile</th>
        ${settings.subjects.map(subject => `<th>${escapeHtml(subject)}</th>`).join('')}
        <th>Total</th>
        <th>Percentage</th>
        <th>Status</th>
        <th>Actions</th>
    `;

    dom.printHeadRow.innerHTML = `
        <th>Name</th>
        ${settings.subjects.map(subject => `<th>${escapeHtml(subject)}</th>`).join('')}
        <th>Total</th>
        <th>Percentage</th>
        <th>Status</th>
    `;

    renderSubjectEntryList(dom.subjectSelect.value);
}

function renderSubjectEntryList(subject) {
    if (!subject) {
        dom.subjectPanelMeta.textContent = 'Select a subject to begin.';
        dom.subjectStudentsList.innerHTML = `<div class="subject-student-placeholder">Choose a subject to update the class set in one pass.</div>`;
        return;
    }

    const maxMark = settings.subjectMaxMarks[subject] || 100;
    dom.subjectPanelMeta.textContent = `${students.length} student${students.length === 1 ? '' : 's'} · Max ${maxMark}`;

    if (students.length === 0) {
        dom.subjectStudentsList.innerHTML = `<div class="subject-student-placeholder">No students yet. Add a student first, then return here for class-wide subject entry.</div>`;
        return;
    }

    dom.subjectStudentsList.innerHTML = students.map(student => {
        const inputId = `subject-mark-${student.id}`;
        return `
            <div class="subject-row">
                <div class="subject-row-name">
                    <strong>${escapeHtml(student.name)}</strong>
                    <span>${escapeHtml(getStudentSummary(student))}</span>
                </div>
                <div class="subject-score-meta">
                    <label for="${inputId}" class="sr-only">Marks for ${escapeHtml(student.name)} in ${escapeHtml(subject)}</label>
                    <input type="number" id="${inputId}" class="subject-score-input subject-student-mark-input" data-id="${student.id}" data-subject="${escapeHtml(subject)}" min="0" max="${maxMark}" step="1" value="${getStudentMark(student, subject)}">
                    <span>/ ${maxMark}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderSubjectManagement() {
    dom.subjectsListContainer.innerHTML = settings.subjects.map(subject => {
        const maxMark = settings.subjectMaxMarks[subject] || 100;
        const enrolledCount = students.filter(student => typeof student.marks?.[subject] !== 'undefined').length;

        return `
            <div class="subject-editor-row">
                <div class="subject-editor-copy">
                    <strong>${escapeHtml(subject)}</strong>
                    <span>${enrolledCount} student${enrolledCount === 1 ? '' : 's'} currently tracked in this subject</span>
                </div>
                <div class="subject-editor-actions">
                    <input
                        type="number"
                        class="subject-max-input"
                        data-role="subject-max"
                        data-subject="${escapeHtml(subject)}"
                        min="1"
                        step="1"
                        value="${maxMark}"
                        aria-label="Maximum marks for ${escapeHtml(subject)}">
                    <button type="button" class="subject-remove-btn" data-action="delete-subject" data-subject="${escapeHtml(subject)}" aria-label="Delete ${escapeHtml(subject)}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderOverview() {
    dom.overviewSubjectCount.textContent = String(settings.subjects.length);
    dom.overviewTotalMax.textContent = `Total max ${getMaxTotalMarks()}`;
    dom.overviewQualification.textContent = getShortQualifyRuleSummary();
    dom.overviewReadyTemplates.textContent = `${getReadyStateCount()} + CBSE`;
}

function renderMetrics() {
    dom.kpiTotal.textContent = String(students.length);

    if (students.length === 0) {
        dom.kpiPassed.textContent = '0';
        dom.kpiFailed.textContent = '0';
        dom.kpiAverage.textContent = '0';
        dom.kpiPassRate.textContent = '0% pass rate';
        dom.kpiFailRate.textContent = '0% below target';
        return;
    }

    const qualifiedCount = students.filter(hasPassed).length;
    const attentionCount = students.length - qualifiedCount;
    const averageTotal = students.reduce((sum, student) => sum + getTotalMark(student), 0) / students.length;

    dom.kpiPassed.textContent = String(qualifiedCount);
    dom.kpiFailed.textContent = String(attentionCount);
    dom.kpiAverage.textContent = averageTotal.toFixed(1);
    dom.kpiPassRate.textContent = `${Math.round((qualifiedCount / students.length) * 100)}% pass rate`;
    dom.kpiFailRate.textContent = `${Math.round((attentionCount / students.length) * 100)}% below target`;
}

function renderInsights() {
    const topStudent = getTopStudents(1)[0];
    const attentionCount = students.filter(student => !hasPassed(student)).length;

    dom.insightTopName.textContent = topStudent ? topStudent.name : '-';
    dom.insightTopScore.textContent = topStudent
        ? `${getTotalMark(topStudent)} / ${getMaxTotalMarks()} · ${formatPercent(getPercentage(topStudent))}`
        : 'No scores yet';
    dom.insightAttentionCount.textContent = String(attentionCount);
    dom.insightPassRule.textContent = getQualifyRuleSummary();
    dom.insightTotalMax.textContent = `${getMaxTotalMarks()} total max`;

    dom.subjectHighlightList.innerHTML = settings.subjects.map(subject => `
        <span class="subject-pill">
            ${escapeHtml(subject)}
            <small>${settings.subjectMaxMarks[subject] || 100}</small>
        </span>
    `).join('');
}

function renderPodium() {
    const topStudents = getTopStudents(3);
    const slots = [
        { name: dom.rank1Name, mark: dom.rank1Mark, student: topStudents[0] },
        { name: dom.rank2Name, mark: dom.rank2Mark, student: topStudents[1] },
        { name: dom.rank3Name, mark: dom.rank3Mark, student: topStudents[2] }
    ];

    slots.forEach(slot => {
        slot.name.textContent = slot.student ? slot.student.name : '-';
        slot.mark.textContent = slot.student ? `${getTotalMark(slot.student)} pts` : '-';
    });
}

function setEmptyState(title, copy, action, buttonLabel, iconClass) {
    dom.emptyStateTitle.textContent = title;
    dom.emptyStateCopy.textContent = copy;

    const button = dom.emptyState.querySelector('button');
    button.dataset.action = action;
    button.innerHTML = `<i class="${iconClass}"></i><span>${buttonLabel}</span>`;
}

function renderRosterSummary(filteredCount) {
    const totalCount = students.length;
    const query = dom.searchInput.value.trim();

    if (totalCount === 0) {
        dom.resultsSummary.textContent = 'No students yet. Add the first record to start the class view.';
        return;
    }

    if (query && filteredCount === 0) {
        dom.resultsSummary.textContent = `No students match "${query}".`;
        return;
    }

    if (query) {
        dom.resultsSummary.textContent = `Showing ${filteredCount} of ${totalCount} students for "${query}".`;
        return;
    }

    dom.resultsSummary.textContent = `Showing ${filteredCount} student${filteredCount === 1 ? '' : 's'} across ${settings.subjects.length} subject${settings.subjects.length === 1 ? '' : 's'}.`;
}

function renderTable(data) {
    renderRosterSummary(data.length);

    if (students.length === 0) {
        dom.studentsBody.innerHTML = '';
        dom.studentsTable.classList.add('hidden');
        dom.emptyState.classList.remove('hidden');
        setEmptyState(
            'Start your cohort',
            'Add the first student to unlock ranking, analytics, and polished exports.',
            'focus-add-form',
            'Add first student',
            'fas fa-plus'
        );
        return;
    }

    if (data.length === 0) {
        dom.studentsBody.innerHTML = '';
        dom.studentsTable.classList.add('hidden');
        dom.emptyState.classList.remove('hidden');
        setEmptyState(
            'No results match your search',
            'Try a broader search term, or clear the filter to restore the full roster.',
            'clear-search',
            'Clear search',
            'fas fa-rotate-left'
        );
        return;
    }

    dom.studentsTable.classList.remove('hidden');
    dom.emptyState.classList.add('hidden');

    dom.studentsBody.innerHTML = data.map(student => {
        const total = getTotalMark(student);
        const percentage = getPercentage(student);
        const qualified = hasPassed(student);
        const studentSummary = getStudentSummary(student);

        const subjectCells = settings.subjects.map(subject => {
            const maxMark = settings.subjectMaxMarks[subject] || 100;
            const markValue = getStudentMark(student, subject);
            const passedSubject = settings.qualifyType === 'marks'
                ? markValue >= settings.qualifyValue
                : ((markValue / maxMark) * 100) >= settings.qualifyValue;
            const renderedValue = passedSubject ? String(markValue) : `<span class="failing-mark">${markValue}</span>`;

            return `<td data-label="${escapeHtml(subject)}">${renderedValue}</td>`;
        }).join('');

        return `
            <tr>
                <td data-label="Student">
                    <div class="student-cell">
                        <span class="student-avatar">${escapeHtml(getStudentInitials(student.name))}</span>
                        <div class="student-meta">
                            <strong>${escapeHtml(student.name)}</strong>
                            <span>${escapeHtml(studentSummary)}</span>
                        </div>
                    </div>
                </td>
                ${subjectCells}
                <td data-label="Total">
                    <div class="total-cell">
                        <strong>${total}</strong>
                        <span>of ${getMaxTotalMarks()}</span>
                    </div>
                </td>
                <td data-label="Percentage">
                    <div class="percentage-pill">
                        <strong>${formatPercent(percentage)}</strong>
                        <span>${qualified ? 'On target' : 'Below target'}</span>
                    </div>
                </td>
                <td data-label="Status">
                    <span class="badge ${qualified ? 'pass' : 'fail'}">${qualified ? 'Qualified' : 'Needs attention'}</span>
                </td>
                <td data-label="Actions">
                    <div class="actions-cell">
                        <button type="button" class="btn-action edit" data-action="edit-student" data-id="${student.id}" aria-label="Edit ${escapeHtml(student.name)}">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button type="button" class="btn-action delete" data-action="delete-student" data-id="${student.id}" aria-label="Delete ${escapeHtml(student.name)}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderApp() {
    const sortedStudents = getSortedStudents();
    renderOverview();
    renderMetrics();
    renderInsights();
    renderPodium();
    renderTable(sortedStudents);
}

function renderUpdateForm(student) {
    dom.updateName.value = student.name;
    dom.updateFormInputs.innerHTML = settings.subjects.map((subject, index) => {
        const maxMark = settings.subjectMaxMarks[subject] || 100;
        const inputId = `update-subject-${index}`;

        return `
            <div class="update-field-row">
                <label for="${inputId}">${escapeHtml(subject)} <span class="field-note">Max ${maxMark}</span></label>
                <input type="number" id="${inputId}" class="update-subject-input" data-subject="${escapeHtml(subject)}" min="0" max="${maxMark}" step="1" value="${getStudentMark(student, subject)}">
            </div>
        `;
    }).join('');
}

function prepareUpdate(id) {
    const student = getStudentById(id);
    if (!student) return;

    editingId = id;
    renderUpdateForm(student);
    dom.updateContainer.classList.remove('hidden');
    dom.updateContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    dom.updateName.focus();
}

function hideUpdateCard() {
    editingId = null;
    dom.updateContainer.classList.add('hidden');
}

function getCurrentSettingsSignature() {
    const currentSubjects = settings.subjects.map(subject => ({
        name: subject,
        max: settings.subjectMaxMarks[subject] || 100
    }));

    return buildTemplateSignature(currentSubjects);
}

function getReadyStateCount() {
    return new Set(boardTemplates.filter(template => template.region !== 'National').map(template => template.region)).size;
}

function getTemplateRegionSortIndex(region) {
    const index = TEMPLATE_REGION_ORDER.indexOf(region);
    return index === -1 ? TEMPLATE_REGION_ORDER.length : index;
}

function getTemplateDisplayLabel(template) {
    if (template.menuLabel) return template.menuLabel;
    if (template.group === 'secondary') return '10th board';
    if (template.streamKey === 'humanities') return 'Arts / Humanities';
    return template.stream || template.title;
}

function getTemplateDisplayMeta(template) {
    return `${template.subjects.length} subjects · ${template.totalMarks} max`;
}

function getTemplateFormulaText(template) {
    return (template.formulas || []).slice(0, 3).join(' · ') || 'Custom pattern';
}

function getTemplateStateLabel(region) {
    return region === 'National' ? 'CBSE' : region;
}

function getTemplateStateBoardLabel(region, templates) {
    if (region === 'National') return 'National board';
    return templates[0].board;
}

function sortTemplatesForDisplay(a, b) {
    const streamOrder = ['General', 'MPC', 'BiPC', 'PCM', 'PCB', 'Science', 'CEC', 'MEC', 'Commerce', 'HEC', 'Humanities', 'Arts'];
    const aIndex = streamOrder.indexOf(a.stream);
    const bIndex = streamOrder.indexOf(b.stream);
    const safeAIndex = aIndex === -1 ? streamOrder.length : aIndex;
    const safeBIndex = bIndex === -1 ? streamOrder.length : bIndex;

    if (safeAIndex !== safeBIndex) return safeAIndex - safeBIndex;
    return a.title.localeCompare(b.title);
}

function renderCurrentTemplateSummary() {
    const subjectPreview = settings.subjects.slice(0, 4).map(subject => `${subject} ${settings.subjectMaxMarks[subject] || 100}`).join(', ');
    const remainingCount = Math.max(settings.subjects.length - 4, 0);

    dom.templateCurrentSummary.innerHTML = `
        <div class="template-summary-strip">
            <span class="template-summary-pill"><strong>Current setup:</strong> ${settings.subjects.length} subjects</span>
            <span class="template-summary-pill"><strong>Total max:</strong> ${getMaxTotalMarks()}</span>
            <span class="template-summary-pill"><strong>Ready:</strong> ${getReadyStateCount()} states + CBSE</span>
        </div>
        <p class="template-summary-note">
            ${subjectPreview ? `Current subjects: ${escapeHtml(subjectPreview)}${remainingCount > 0 ? `, +${remainingCount} more` : ''}.` : 'No subjects configured yet.'}
        </p>
    `;
}

function renderTemplateExperience() {
    templateStep = 'level';
    selectedLevel = null;
    selectedBranchIndex = null;
    templateSearchQuery = '';
    dom.templateSearchInput.value = '';
    renderTemplateWizard();
}

function renderTemplateWizard() {
    renderCurrentTemplateSummary();

    if (templateStep === 'level') {
        dom.templateToolbar.classList.add('hidden');
        dom.templateBackButton.classList.add('hidden');
        dom.templateModalTitle.textContent = 'Pick a template';
        dom.templateModalDescription.textContent = 'Choose the academic level that matches your roster.';
        renderLevelSelection();
        return;
    }

    if (templateStep === 'board') {
        dom.templateToolbar.classList.remove('hidden');
        dom.templateBackButton.classList.remove('hidden');
        dom.templateModalTitle.textContent = TEMPLATE_GROUPS[selectedLevel].title;
        dom.templateModalDescription.textContent = TEMPLATE_GROUPS[selectedLevel].description;
        renderBoardSelection();
        return;
    }

    if (templateStep === 'branch') {
        dom.templateToolbar.classList.remove('hidden');
        dom.templateBackButton.classList.remove('hidden');
        dom.templateModalTitle.textContent = 'Engineering branches';
        dom.templateModalDescription.textContent = 'Search and select a branch, then choose the semester.';
        renderBranchSelection();
        return;
    }

    dom.templateToolbar.classList.add('hidden');
    dom.templateBackButton.classList.remove('hidden');
    dom.templateModalTitle.textContent = engineeringData[selectedBranchIndex]?.name || 'Engineering';
    dom.templateModalDescription.textContent = 'Select the semester that should replace your current subjects.';
    renderSemesterSelection();
}

function renderLevelSelection() {
    dom.templateLibrary.innerHTML = `
        <div class="wizard-grid">
            <button type="button" class="wizard-card" data-action="template-step" data-step="board" data-level="secondary">
                <i class="fas fa-school"></i>
                <h3>10th class</h3>
                <p>CBSE, SSC, SSLC, and state board class 10 patterns.</p>
            </button>
            <button type="button" class="wizard-card" data-action="template-step" data-step="board" data-level="intermediate">
                <i class="fas fa-building-columns"></i>
                <h3>Intermediate</h3>
                <p>State board science, commerce, and arts streams for class 11 and 12.</p>
            </button>
            <button type="button" class="wizard-card" data-action="template-step" data-step="branch" data-level="engineering">
                <i class="fas fa-laptop-code"></i>
                <h3>Engineering</h3>
                <p>B.Tech semester-wise subject structures across supported branches.</p>
            </button>
        </div>
    `;
}

function goToWizardStep(step, payload) {
    if (step === 'board') {
        selectedLevel = payload;
    } else if (step === 'branch') {
        selectedLevel = 'engineering';
    } else if (step === 'semester') {
        selectedBranchIndex = payload;
    }

    templateStep = step;
    templateSearchQuery = '';
    dom.templateSearchInput.value = '';
    renderTemplateWizard();
}

function goBackWizardStep() {
    if (templateStep === 'board' || templateStep === 'branch') {
        templateStep = 'level';
    } else if (templateStep === 'semester') {
        templateStep = 'branch';
    }

    templateSearchQuery = '';
    dom.templateSearchInput.value = '';
    renderTemplateWizard();
}

function renderBoardSelection() {
    const currentSignature = getCurrentSettingsSignature();
    const visibleTemplates = boardTemplates.filter(template => {
        if (template.group !== selectedLevel) return false;
        if (templateSearchQuery && !template.searchText.includes(templateSearchQuery)) return false;
        return true;
    });

    const templatesByRegion = visibleTemplates.reduce((groups, template) => {
        if (!groups[template.region]) groups[template.region] = [];
        groups[template.region].push(template);
        return groups;
    }, {});

    const stateCards = Object.keys(templatesByRegion)
        .sort((a, b) => getTemplateRegionSortIndex(a) - getTemplateRegionSortIndex(b) || a.localeCompare(b))
        .map(region => {
            const stateTemplates = templatesByRegion[region].sort(sortTemplatesForDisplay);

            return `
                <article class="template-state-card">
                    <div class="template-state-heading">
                        <div>
                            <h4>${escapeHtml(getTemplateStateLabel(region))}</h4>
                            <p>${escapeHtml(getTemplateStateBoardLabel(region, stateTemplates))}</p>
                        </div>
                        <span class="template-state-count">${stateTemplates.length} option${stateTemplates.length === 1 ? '' : 's'}</span>
                    </div>
                    <div class="template-option-list">
                        ${stateTemplates.map(template => {
                            const isCurrent = template.signature === currentSignature;
                            return `
                                <button
                                    type="button"
                                    class="template-option ${isCurrent ? 'is-current' : ''}"
                                    data-action="apply-template"
                                    data-template-id="${escapeHtml(template.id)}"
                                    ${isCurrent ? 'disabled' : ''}>
                                    <span class="template-option-main">
                                        <strong>${escapeHtml(getTemplateDisplayLabel(template))}</strong>
                                        <small>${escapeHtml(getTemplateDisplayMeta(template))}</small>
                                    </span>
                                    <span class="template-option-formula">${escapeHtml(getTemplateFormulaText(template))}</span>
                                    <span class="template-option-action">${isCurrent ? 'Loaded' : 'Use template'}</span>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </article>
            `;
        }).join('');

    dom.templateLibrary.innerHTML = stateCards ? `<div class="template-state-grid">${stateCards}</div>` : `
        <div class="template-empty-state">
            <i class="fas fa-compass"></i>
            <h3>No templates match that search</h3>
            <p>Try a different state, board, or stream keyword.</p>
        </div>
    `;
}

function renderBranchSelection() {
    const visibleBranches = engineeringData
        .map((branch, index) => ({ branch, index }))
        .filter(({ branch }) => !templateSearchQuery || branch.name.toLowerCase().includes(templateSearchQuery));

    dom.templateLibrary.innerHTML = visibleBranches.length > 0 ? `
        <div class="branch-list">
            ${visibleBranches.map(({ branch, index }) => `
                <button type="button" class="branch-item" data-action="template-step" data-step="semester" data-branch-index="${index}">
                    <span>${escapeHtml(branch.name)}</span>
                    <span>${Object.keys(branch.semesters).length} semesters <i class="fas fa-chevron-right"></i></span>
                </button>
            `).join('')}
        </div>
    ` : `
        <div class="template-empty-state">
            <i class="fas fa-compass"></i>
            <h3>No branches found</h3>
            <p>Try a different branch abbreviation or full branch name.</p>
        </div>
    `;
}

function renderSemesterSelection() {
    const branch = engineeringData[selectedBranchIndex];
    if (!branch) {
        renderBranchSelection();
        return;
    }

    const semesters = Object.keys(branch.semesters).sort((a, b) => Number(a) - Number(b));
    dom.templateLibrary.innerHTML = `
        <div class="wizard-grid">
            ${semesters.map(semester => `
                <button type="button" class="wizard-card" data-action="apply-engineering-template" data-branch-index="${selectedBranchIndex}" data-semester="${semester}">
                    <i class="fas fa-book-open"></i>
                    <h3>Semester ${semester}</h3>
                    <p>${branch.semesters[semester].length} subjects in the current catalog.</p>
                </button>
            `).join('')}
        </div>
    `;
}

async function applyEngineeringTemplate(branchIndex, semester) {
    const branch = engineeringData[branchIndex];
    if (!branch) return;

    const confirmed = await confirmAction({
        title: `Use ${branch.name} semester ${semester}?`,
        description: 'This will replace the current subjects and keep only matching marks where names still align.',
        confirmLabel: 'Apply template'
    });

    if (!confirmed) return;

    const nextSubjects = [...branch.semesters[semester]];
    const nextSubjectMaxMarks = {};
    nextSubjects.forEach(subject => {
        nextSubjectMaxMarks[subject] = 100;
    });

    settings.subjects = nextSubjects;
    settings.subjectMaxMarks = nextSubjectMaxMarks;

    students = students.map(student => {
        const nextMarks = {};
        nextSubjects.forEach(subject => {
            nextMarks[subject] = clampNumber(getStudentMark(student, subject), 0, 100);
        });
        return { ...student, marks: nextMarks };
    });

    hideUpdateCard();
    saveState();
    closeModal(dom.templatesModal);
    showToast(`Loaded ${branch.name} semester ${semester}.`, 'success');
}

async function applyTemplate(templateId) {
    const template = boardTemplates.find(item => item.id === templateId);
    if (!template) return;

    const confirmed = await confirmAction({
        title: `Use ${template.title}?`,
        description: 'This will replace the current subjects and maximum marks. Existing marks keep only the subjects that still match by name.',
        confirmLabel: 'Apply template'
    });

    if (!confirmed) return;

    settings.subjects = template.subjects.map(subject => subject.name);
    settings.subjectMaxMarks = {};
    template.subjects.forEach(subject => {
        settings.subjectMaxMarks[subject.name] = subject.max;
    });

    students = students.map(student => {
        const nextMarks = {};
        template.subjects.forEach(subject => {
            nextMarks[subject.name] = clampNumber(getStudentMark(student, subject.name), 0, subject.max);
        });
        return { ...student, marks: nextMarks };
    });

    hideUpdateCard();
    saveState();
    closeModal(dom.templatesModal);
    showToast(`${template.title} loaded successfully.`, 'success');
}

function getFocusableElements(container) {
    return [...container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter(element => !element.hasAttribute('disabled') && !element.closest('.hidden'));
}

function getActiveModal() {
    return modalStack[modalStack.length - 1] || null;
}

function focusModal(modal, preferredSelector) {
    const preferredElement = preferredSelector ? modal.querySelector(preferredSelector) : null;
    const focusableElements = getFocusableElements(modal);
    const target = preferredElement && !preferredElement.hasAttribute('disabled')
        ? preferredElement
        : focusableElements[0];

    if (target) target.focus();
}

function openModal(modal, preferredSelector) {
    if (!modal || !modal.classList.contains('hidden')) return;

    modal.__returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.classList.remove('hidden');
    modalStack.push(modal);
    document.body.classList.add('modal-open');
    focusModal(modal, preferredSelector);
}

function closeModal(modal) {
    if (!modal || modal.classList.contains('hidden')) return;

    modal.classList.add('hidden');
    const modalIndex = modalStack.lastIndexOf(modal);
    if (modalIndex !== -1) modalStack.splice(modalIndex, 1);

    if (modalStack.length === 0) {
        document.body.classList.remove('modal-open');
        if (modal.__returnFocus && document.body.contains(modal.__returnFocus)) {
            modal.__returnFocus.focus();
        }
        return;
    }

    const activeModal = getActiveModal();
    if (activeModal) focusModal(activeModal);
}

function handleConfirmDismiss() {
    if (!confirmResolver) {
        closeModal(dom.confirmModal);
        return;
    }

    const resolver = confirmResolver;
    confirmResolver = null;
    closeModal(dom.confirmModal);
    resolver(false);
}

function handleConfirmAccept() {
    if (!confirmResolver) {
        closeModal(dom.confirmModal);
        return;
    }

    const resolver = confirmResolver;
    confirmResolver = null;
    closeModal(dom.confirmModal);
    resolver(true);
}

function confirmAction({ title, description, confirmLabel = 'Confirm' }) {
    dom.confirmTitle.textContent = title;
    dom.confirmDescription.textContent = description;
    dom.confirmConfirm.textContent = confirmLabel;

    return new Promise(resolve => {
        confirmResolver = resolve;
        openModal(dom.confirmModal, '#confirm-cancel');
    });
}

function syncTopbarState() {
    dom.topbar.classList.toggle('scrolled', dom.dashboardScroll.scrollTop > 8);
}

function isMobileViewport() {
    return window.innerWidth <= 960;
}

function updateSidebarToggleButton() {
    const sidebarOpen = document.body.classList.contains('sidebar-open');
    const sidebarCollapsed = document.body.classList.contains('sidebar-collapsed');

    if (isMobileViewport()) {
        dom.btnSidebarToggle.innerHTML = `<i class="fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}"></i><span>${sidebarOpen ? 'Close' : 'Menu'}</span>`;
        dom.btnSidebarToggle.setAttribute('aria-label', sidebarOpen ? 'Close menu' : 'Open menu');
        return;
    }

    dom.btnSidebarToggle.innerHTML = `<i class="fas ${sidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'}"></i><span>${sidebarCollapsed ? 'Show menu' : 'Hide menu'}</span>`;
    dom.btnSidebarToggle.setAttribute('aria-label', sidebarCollapsed ? 'Show menu' : 'Hide menu');
}

function applySidebarState() {
    const savedCollapsed = localStorage.getItem('gradeDashSidebarCollapsed') === 'true';

    if (isMobileViewport()) {
        document.body.classList.remove('sidebar-collapsed');
        document.body.classList.remove('sidebar-open');
    } else {
        document.body.classList.toggle('sidebar-collapsed', savedCollapsed);
        document.body.classList.remove('sidebar-open');
    }

    updateSidebarToggleButton();
}

function openSidebar() {
    document.body.classList.add('sidebar-open');
    updateSidebarToggleButton();
}

function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    updateSidebarToggleButton();
}

function toggleSidebar() {
    if (isMobileViewport()) {
        if (document.body.classList.contains('sidebar-open')) closeSidebar();
        else openSidebar();
        return;
    }

    const nextCollapsed = !document.body.classList.contains('sidebar-collapsed');
    document.body.classList.toggle('sidebar-collapsed', nextCollapsed);
    localStorage.setItem('gradeDashSidebarCollapsed', String(nextCollapsed));
    updateSidebarToggleButton();
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const iconClass = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    const label = theme === 'dark' ? 'Light mode' : 'Dark mode';
    dom.btnThemeToggle.innerHTML = `<i class="${iconClass}"></i><span>${label}</span>`;
    dom.btnThemeToggle.setAttribute('aria-label', label);

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', theme === 'dark' ? '#07120f' : '#0e7e64');
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    applyTheme(currentTheme === 'light' ? 'dark' : 'light');
}

function showToast(message, tone = 'success') {
    dom.toastMessage.textContent = message;
    dom.toast.classList.remove('hidden', 'is-error', 'is-info');

    if (tone === 'error') {
        dom.toast.classList.add('is-error');
        dom.toastIcon.className = 'fas fa-circle-exclamation toast-icon';
    } else if (tone === 'info') {
        dom.toast.classList.add('is-info');
        dom.toastIcon.className = 'fas fa-circle-info toast-icon';
    } else {
        dom.toastIcon.className = 'fas fa-circle-check toast-icon';
    }

    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        dom.toast.classList.add('hidden');
    }, 3200);
}

function openSettingsModal() {
    if (isMobileViewport()) closeSidebar();
    populateSettingsForm();
    openModal(dom.settingsModal, '#new-subject-name');
}

function openTemplatesModal() {
    if (isMobileViewport()) closeSidebar();
    renderTemplateExperience();
    openModal(dom.templatesModal, '.wizard-card, .close-modal');
}

function focusAddForm() {
    switchEntryTab('student');
    dom.dashboardScroll.scrollTo({ top: 0, behavior: 'smooth' });
    const studentNameInput = document.getElementById('student-name');
    if (studentNameInput) studentNameInput.focus();
}

function clearSearch() {
    dom.searchInput.value = '';
    renderApp();
    dom.searchInput.focus();
}

function switchEntryTab(mode) {
    const showStudent = mode === 'student';
    dom.tabByStudent.classList.toggle('active', showStudent);
    dom.tabBySubject.classList.toggle('active', !showStudent);
    dom.tabByStudent.setAttribute('aria-selected', String(showStudent));
    dom.tabBySubject.setAttribute('aria-selected', String(!showStudent));
    dom.addStudentForm.classList.toggle('hidden', !showStudent);
    dom.addSubjectForm.classList.toggle('hidden', showStudent);
}

function handleAddStudent(event) {
    event.preventDefault();

    const nameInput = document.getElementById('student-name');
    const name = validateStudentName(nameInput.value);
    if (!name) return;

    const marks = collectMarks(dom.addStudentForm.querySelectorAll('.student-subject-input'));
    if (!marks) return;

    const newId = students.length > 0 ? Math.max(...students.map(student => student.id)) + 1 : 1;
    students.push({ id: newId, name, marks });
    saveState();
    showToast(`Added ${name} to the roster.`, 'success');
    document.getElementById('student-name')?.focus();
}

function handleAddSubjectMarks(event) {
    event.preventDefault();

    const subject = dom.subjectSelect.value;
    if (!subject) {
        showToast('Choose a subject before saving marks.', 'error');
        dom.subjectSelect.focus();
        return;
    }

    const markInputs = [...dom.addSubjectForm.querySelectorAll('.subject-student-mark-input')];

    for (const input of markInputs) {
        const parsedValue = input.value.trim() === '' ? 0 : parseInteger(input.value);
        if (parsedValue === null || parsedValue < 0) {
            showToast(`Enter a whole number between 0 and ${maxMark} for ${subject}.`, 'error');
            input.focus();
            return;
        }

        if (parsedValue > maxMark) {
            showToast(`${subject} cannot exceed its maximum of ${maxMark}.`, 'error');
            input.focus();
            return;
        }
    }

    markInputs.forEach(input => {
        const student = getStudentById(Number.parseInt(input.dataset.id, 10));
        const parsedValue = input.value.trim() === '' ? 0 : Number(input.value);
        if (!student) return;
        student.marks[subject] = parsedValue;
    });

    saveState();
    renderSubjectEntryList(subject);
    showToast(`Saved ${subject} marks for the class set.`, 'success');
}

function handleUpdate(event) {
    event.preventDefault();
    if (editingId === null) return;

    const student = getStudentById(editingId);
    if (!student) return;

    const nextName = validateStudentName(dom.updateName.value, editingId);
    if (!nextName) return;

    const marks = collectMarks(dom.updateForm.querySelectorAll('.update-subject-input'));
    if (!marks) return;

    student.name = nextName;
    student.marks = marks;

    saveState();
    hideUpdateCard();
    showToast(`Updated ${nextName}.`, 'success');
}

function handleSettings(event) {
    event.preventDefault();

    const nextType = dom.settingQualifyType.value === 'marks' ? 'marks' : 'percentage';
    const nextValue = parseInteger(dom.settingQualifyValue.value);

    if (nextValue === null || nextValue < 0) {
        showToast('Enter a valid qualifying value.', 'error');
        dom.settingQualifyValue.focus();
        return;
    }

    settings.qualifyType = nextType;
    settings.qualifyValue = nextValue;
    clampQualifySettings();
    saveState();
    closeModal(dom.settingsModal);
    showToast('Evaluation settings saved.', 'success');
}

function handleAddSubjectConfig() {
    const subjectName = normalizeName(dom.newSubjectName.value);
    const subjectMax = parseInteger(dom.newSubjectMax.value);

    if (!subjectName) {
        showToast('Enter a subject name before adding it.', 'error');
        dom.newSubjectName.focus();
        return;
    }

    if (subjectMax === null || subjectMax <= 0) {
        showToast('Enter a positive whole number for the subject maximum.', 'error');
        dom.newSubjectMax.focus();
        return;
    }

    const alreadyExists = settings.subjects.some(subject => subject.toLowerCase() === subjectName.toLowerCase());
    if (alreadyExists) {
        showToast('That subject already exists. Try renaming it or adjusting the current entry.', 'error');
        dom.newSubjectName.focus();
        return;
    }

    settings.subjects.push(subjectName);
    settings.subjectMaxMarks[subjectName] = subjectMax;
    students = students.map(student => ({
        ...student,
        marks: {
            ...student.marks,
            [subjectName]: 0
        }
    }));

    dom.newSubjectName.value = '';
    dom.newSubjectMax.value = '100';
    saveState();
    showToast(`Added ${subjectName}.`, 'success');
    dom.newSubjectName.focus();
}

function updateSubjectMax(subject, value) {
    const nextMax = parseInteger(value);

    if (nextMax === null || nextMax <= 0) {
        showToast('Maximum marks must be a positive whole number.', 'error');
        renderSubjectManagement();
        return;
    }

    settings.subjectMaxMarks[subject] = nextMax;
    students = students.map(student => ({
        ...student,
        marks: {
            ...student.marks,
            [subject]: clampNumber(getStudentMark(student, subject), 0, nextMax)
        }
    }));

    saveState();
    showToast(`Updated ${subject} maximum to ${nextMax}.`, 'success');
}

async function deleteSubject(subject) {
    if (settings.subjects.length === 1) {
        showToast('Keep at least one subject in the workspace.', 'error');
        return;
    }

    const confirmed = await confirmAction({
        title: `Delete ${subject}?`,
        description: 'This removes the subject from the roster and clears its marks from every student record.',
        confirmLabel: 'Delete subject'
    });

    if (!confirmed) return;

    settings.subjects = settings.subjects.filter(item => item !== subject);
    delete settings.subjectMaxMarks[subject];

    students = students.map(student => {
        const nextMarks = { ...student.marks };
        delete nextMarks[subject];
        return { ...student, marks: nextMarks };
    });

    saveState({ preserveSubjectSelection: false });
    showToast(`Deleted ${subject}.`, 'success');
}

async function deleteStudent(id) {
    const student = getStudentById(id);
    if (!student) return;

    const confirmed = await confirmAction({
        title: `Delete ${student.name}?`,
        description: 'This will permanently remove the student from the current roster and exports.',
        confirmLabel: 'Delete student'
    });

    if (!confirmed) return;

    students = students.filter(item => item.id !== id);
    if (editingId === id) hideUpdateCard();
    saveState();
    showToast(`Removed ${student.name}.`, 'success');
}

function exportData(format) {
    const data = getSortedStudents();
    if (data.length === 0) {
        showToast('There is no filtered roster data to export yet.', 'error');
        return;
    }

    if (format === 'docx') exportDOCX(data);
    if (format === 'xlsx') exportExcel(data);
    if (format === 'pdf') exportPDF(data);
}

async function exportDOCX(data) {
    if (typeof docx === 'undefined') {
        showToast('The DOCX exporter is still loading. Try again in a moment.', 'info');
        return;
    }

    showToast('Generating Word document…', 'info');
    const maxTotal = getMaxTotalMarks();

    const headerCells = [
        new docx.TableCell({
            children: [new docx.Paragraph({ text: 'Name', alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })]
        })
    ];

    settings.subjects.forEach(subject => {
        headerCells.push(new docx.TableCell({
            children: [new docx.Paragraph({ text: subject, alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })]
        }));
    });

    headerCells.push(
        new docx.TableCell({ children: [new docx.Paragraph({ text: 'Total', alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }),
        new docx.TableCell({ children: [new docx.Paragraph({ text: 'Percentage', alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }),
        new docx.TableCell({ children: [new docx.Paragraph({ text: 'Status', alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] })
    );

    const rows = [new docx.TableRow({ children: headerCells })];

    data.forEach(student => {
        const rowCells = [new docx.TableCell({ children: [new docx.Paragraph({ text: student.name })] })];
        settings.subjects.forEach(subject => {
            rowCells.push(new docx.TableCell({
                children: [new docx.Paragraph({ text: String(getStudentMark(student, subject)), alignment: docx.AlignmentType.CENTER })]
            }));
        });

        rowCells.push(
            new docx.TableCell({ children: [new docx.Paragraph({ text: String(getTotalMark(student)), alignment: docx.AlignmentType.CENTER })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: formatPercent(getPercentage(student)), alignment: docx.AlignmentType.CENTER })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: hasPassed(student) ? 'Qualified' : 'Needs attention', alignment: docx.AlignmentType.CENTER })] })
        );

        rows.push(new docx.TableRow({ children: rowCells }));
    });

    const documentFile = new docx.Document({
        sections: [{
            properties: {},
            children: [
                new docx.Paragraph({
                    text: 'Student Performance Report',
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER
                }),
                new docx.Paragraph({
                    text: `Generated on ${new Date().toLocaleDateString()}`,
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 220 }
                }),
                new docx.Paragraph({
                    text: `Total marks available: ${maxTotal}`,
                    spacing: { after: 200 }
                }),
                new docx.Table({
                    rows,
                    width: { size: 100, type: docx.WidthType.PERCENTAGE }
                })
            ]
        }]
    });

    try {
        const blob = await docx.Packer.toBlob(documentFile);
        downloadBlob(blob, buildExportFilename('docx'));
    } catch (error) {
        console.error(error);
        showToast('Unable to generate the Word document.', 'error');
    }
}

function exportExcel(data) {
    if (typeof XLSX === 'undefined') {
        showToast('The Excel exporter is still loading. Try again in a moment.', 'info');
        return;
    }

    const rows = data.map(student => {
        const row = { 'Student Name': student.name };
        settings.subjects.forEach(subject => {
            row[subject] = getStudentMark(student, subject);
        });
        row['Total Marks'] = getTotalMark(student);
        row.Percentage = formatPercent(getPercentage(student));
        row.Status = hasPassed(student) ? 'Qualified' : 'Needs attention';
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, buildExportFilename('xlsx'));
    showToast('Excel export downloaded.', 'success');
}

function exportPDF(data) {
    if (typeof html2pdf === 'undefined') {
        showToast('The PDF exporter is still loading. Try again in a moment.', 'info');
        return;
    }

    showToast('Generating PDF…', 'info');
    dom.printDate.textContent = new Date().toLocaleDateString();

    dom.printBody.innerHTML = data.map(student => `
        <tr>
            <td>${escapeHtml(student.name)}</td>
            ${settings.subjects.map(subject => `<td>${getStudentMark(student, subject)}</td>`).join('')}
            <td>${getTotalMark(student)}</td>
            <td>${formatPercent(getPercentage(student))}</td>
            <td>${hasPassed(student) ? 'Qualified' : 'Needs attention'}</td>
        </tr>
    `).join('');

    const template = document.getElementById('print-template');
    template.classList.remove('hidden');

    const options = {
        margin: 0.4,
        filename: buildExportFilename('pdf'),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: {
            unit: 'in',
            format: 'letter',
            orientation: settings.subjects.length > 4 ? 'landscape' : 'portrait'
        }
    };

    html2pdf().set(options).from(template).save()
        .then(() => {
            showToast('PDF export downloaded.', 'success');
        })
        .catch(error => {
            console.error(error);
            showToast('Unable to generate the PDF export.', 'error');
        })
        .finally(() => {
            template.classList.add('hidden');
        });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${filename} downloaded.`, 'success');
}

function handleSubjectManagementChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.role !== 'subject-max') return;
    updateSubjectMax(target.dataset.subject, target.value);
}

async function handleActionClick(button, event) {
    const action = button.dataset.action;
    if (!action) return;

    switch (action) {
        case 'open-settings':
            event.preventDefault();
            openSettingsModal();
            return;
        case 'open-templates':
            event.preventDefault();
            openTemplatesModal();
            return;
        case 'toggle-theme':
            event.preventDefault();
            toggleTheme();
            return;
        case 'focus-add-form':
            event.preventDefault();
            focusAddForm();
            return;
        case 'clear-search':
            event.preventDefault();
            clearSearch();
            return;
        case 'edit-student':
            event.preventDefault();
            prepareUpdate(Number.parseInt(button.dataset.id, 10));
            return;
        case 'delete-student':
            event.preventDefault();
            await deleteStudent(Number.parseInt(button.dataset.id, 10));
            return;
        case 'delete-subject':
            event.preventDefault();
            await deleteSubject(button.dataset.subject);
            return;
        case 'template-step':
            event.preventDefault();
            if (button.dataset.step === 'semester') {
                goToWizardStep('semester', Number.parseInt(button.dataset.branchIndex, 10));
                return;
            }
            goToWizardStep(button.dataset.step, button.dataset.level);
            return;
        case 'apply-template':
            event.preventDefault();
            await applyTemplate(button.dataset.templateId);
            return;
        case 'apply-engineering-template':
            event.preventDefault();
            await applyEngineeringTemplate(Number.parseInt(button.dataset.branchIndex, 10), button.dataset.semester);
            return;
        default:
            return;
    }
}

function setupEventListeners() {
    dom.dashboardScroll.addEventListener('scroll', syncTopbarState, { passive: true });
    syncTopbarState();

    dom.btnSidebarToggle.addEventListener('click', toggleSidebar);
    dom.btnSidebarClose.addEventListener('click', closeSidebar);
    dom.sidebarBackdrop.addEventListener('click', closeSidebar);

    dom.btnSettings.addEventListener('click', openSettingsModal);
    dom.btnTemplates.addEventListener('click', openTemplatesModal);
    dom.btnThemeToggle.addEventListener('click', toggleTheme);

    dom.tabByStudent.addEventListener('click', () => switchEntryTab('student'));
    dom.tabBySubject.addEventListener('click', () => switchEntryTab('subject'));

    dom.addStudentForm.addEventListener('submit', handleAddStudent);
    dom.addSubjectForm.addEventListener('submit', handleAddSubjectMarks);
    dom.settingsForm.addEventListener('submit', handleSettings);
    dom.updateForm.addEventListener('submit', handleUpdate);
    dom.cancelUpdate.addEventListener('click', hideUpdateCard);

    dom.subjectSelect.addEventListener('change', event => {
        renderSubjectEntryList(event.target.value);
    });

    dom.searchInput.addEventListener('input', renderApp);
    dom.sortSelect.addEventListener('change', event => {
        currentSort = event.target.value;
        renderApp();
    });

    dom.btnAddSubject.addEventListener('click', handleAddSubjectConfig);
    dom.settingQualifyType.addEventListener('change', syncQualifyFieldCopy);
    dom.subjectsListContainer.addEventListener('change', handleSubjectManagementChange);

    dom.templateBackButton.addEventListener('click', goBackWizardStep);
    dom.templateSearchInput.addEventListener('input', event => {
        templateSearchQuery = event.target.value.toLowerCase().trim();
        renderTemplateWizard();
    });

    dom.btnExportMenu.addEventListener('click', event => {
        event.stopPropagation();
        const isExpanded = dom.btnExportMenu.getAttribute('aria-expanded') === 'true';
        dom.exportMenu.classList.toggle('hidden', isExpanded);
        dom.btnExportMenu.setAttribute('aria-expanded', String(!isExpanded));
    });

    dom.exportMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            exportData(event.currentTarget.dataset.format);
            dom.exportMenu.classList.add('hidden');
            dom.btnExportMenu.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('click', event => {
        if (!event.target.closest('.export-dropdown')) {
            dom.exportMenu.classList.add('hidden');
            dom.btnExportMenu.setAttribute('aria-expanded', 'false');
        }

        const closeButton = event.target.closest('.close-modal');
        if (closeButton) {
            const modal = closeButton.closest('.modal-overlay');
            if (modal === dom.confirmModal) {
                handleConfirmDismiss();
            } else {
                closeModal(modal);
            }
            return;
        }

        const modalBackdrop = event.target.classList.contains('modal-overlay') ? event.target : null;
        if (modalBackdrop) {
            if (modalBackdrop === dom.confirmModal) {
                handleConfirmDismiss();
            } else {
                closeModal(modalBackdrop);
            }
            return;
        }

        const actionButton = event.target.closest('[data-action]');
        if (actionButton) {
            void handleActionClick(actionButton, event);
        }
    });

    dom.confirmCancel.addEventListener('click', handleConfirmDismiss);
    dom.confirmConfirm.addEventListener('click', handleConfirmAccept);

    document.addEventListener('keydown', event => {
        const activeModal = getActiveModal();

        if (event.key === 'Escape') {
            if (activeModal === dom.confirmModal) {
                handleConfirmDismiss();
                return;
            }

            if (activeModal) {
                closeModal(activeModal);
                return;
            }

            if (document.body.classList.contains('sidebar-open')) {
                closeSidebar();
            }
            return;
        }

        if (event.key !== 'Tab' || !activeModal) return;

        const focusableElements = getFocusableElements(activeModal);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    });

    window.addEventListener('resize', applySidebarState);
}

init();
