// --- STATE MANAGEMENT ---
// Default Settings
let settings = JSON.parse(localStorage.getItem('gradeDashSettings')) || {
    subjectMaxMarks: { 'Math': 100, 'Science': 100, 'English': 100 },
    qualifyType: 'percentage', // 'marks' or 'percentage'
    qualifyValue: 40,
    subjects: ['Math', 'Science', 'English']
};

if (settings.totalMarks !== undefined) {
    settings.subjectMaxMarks = {};
    settings.subjects.forEach(sub => settings.subjectMaxMarks[sub] = settings.totalMarks);
    delete settings.totalMarks;
}

let rawStudents = JSON.parse(localStorage.getItem('studentsData')) || [];
let students = [];

// Migration logic
if (rawStudents.length > 0 && typeof rawStudents[0].mark !== 'undefined') {
    students = rawStudents.map(s => {
        let marks = {};
        settings.subjects.forEach(sub => marks[sub] = 0);
        if (settings.subjects.length > 0) marks[settings.subjects[0]] = s.mark;
        return { id: s.id, name: s.name, marks };
    });
    localStorage.setItem('studentsData', JSON.stringify(students));
} else {
    students = rawStudents;
}

let currentSort = 'entry-desc';

// --- DOM ELEMENTS ---
// Modals
const settingsModal = document.getElementById('settings-modal');
const closeModals = document.querySelectorAll('.close-modal');
const topbar = document.querySelector('.topbar');
const dashboardScroll = document.querySelector('.dashboard-scroll');

// Buttons
const btnSettings = document.getElementById('btn-settings');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const btnExportMenu = document.getElementById('btn-export-menu');
const exportMenu = document.getElementById('export-menu');
const btnAddSubject = document.getElementById('btn-add-subject');

// Forms & Tabs
const addStudentForm = document.getElementById('add-student-form');
const addSubjectForm = document.getElementById('add-subject-form');
const settingsForm = document.getElementById('settings-form');
const updateForm = document.getElementById('update-form');
const searchInput = document.getElementById('global-search');
const sortSelect = document.getElementById('sort-select');

const tabByStudent = document.getElementById('tab-by-student');
const tabBySubject = document.getElementById('tab-by-subject');

// Containers
const studentsBody = document.getElementById('students-body');
const emptyState = document.getElementById('empty-state');
const updateContainer = document.getElementById('update-container');
const studentFormInputs = document.getElementById('student-form-inputs');
const subjectSelect = document.getElementById('subject-select');
const subjectStudentsList = document.getElementById('subject-students-list');
const subjectsListContainer = document.getElementById('subjects-list');
const tableHeadRow = document.getElementById('table-head-row');
const updateFormInputs = document.getElementById('update-form-inputs');
const printHeadRow = document.getElementById('print-head-row');

// --- INITIALIZATION ---
function init() {
    applyTheme(localStorage.getItem('theme') || 'light');
    populateSettingsForm();
    renderSubjectManagement();
    renderForms();
    renderApp();
    setupEventListeners();
}

function saveState() {
    localStorage.setItem('studentsData', JSON.stringify(students));
    localStorage.setItem('gradeDashSettings', JSON.stringify(settings));
    renderForms();
    renderApp();
}

// --- LOGIC HELPER FUNCTIONS ---
function getTotalMark(student) {
    if (!student.marks) return 0;
    return Object.values(student.marks).reduce((sum, val) => sum + (val || 0), 0);
}

function getMaxTotalMarks() {
    return settings.subjects.reduce((sum, sub) => sum + (settings.subjectMaxMarks[sub] || 100), 0);
}

function hasPassed(student) {
    const total = getTotalMark(student);
    if (settings.qualifyType === 'marks') {
        return total >= settings.qualifyValue;
    } else {
        const max = getMaxTotalMarks();
        if (max === 0) return true;
        const percentage = (total / max) * 100;
        return percentage >= settings.qualifyValue;
    }
}

function getSortedStudents() {
    let sorted = [...students];
    const query = searchInput.value.toLowerCase().trim();
    
    if (query) {
        sorted = sorted.filter(s => s.name.toLowerCase().includes(query));
    }

    sorted.sort((a, b) => {
        const aTotal = getTotalMark(a);
        const bTotal = getTotalMark(b);
        switch (currentSort) {
            case 'entry-asc': return a.id - b.id;
            case 'entry-desc': return b.id - a.id;
            case 'marks-desc': return bTotal - aTotal;
            case 'marks-asc': return aTotal - bTotal;
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            default: return 0;
        }
    });
    return sorted;
}

// --- CUSTOM SELECT COMPONENT ---
function initCustomSelects() {
    document.querySelectorAll('select').forEach(select => {
        if (!select.classList.contains('custom-select-hidden')) {
            select.classList.add('custom-select-hidden');
        }
        
        // Remove existing custom select if re-rendering
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select')) {
            select.nextElementSibling.remove();
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select';
        
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        
        const textSpan = document.createElement('span');
        textSpan.className = 'custom-select-text';
        
        const selectedOption = select.options[select.selectedIndex];
        textSpan.textContent = selectedOption ? selectedOption.textContent : 'Select...';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-chevron-down custom-select-icon';
        
        trigger.appendChild(textSpan);
        trigger.appendChild(icon);
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'custom-select-options';
        
        Array.from(select.options).forEach(option => {
            if (option.disabled && option.value === "") return;
            const optDiv = document.createElement('div');
            optDiv.className = 'custom-option';
            if (option.selected) optDiv.classList.add('selected');
            optDiv.textContent = option.textContent;
            optDiv.dataset.value = option.value;
            
            optDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                textSpan.textContent = option.textContent;
                optionsDiv.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
                optDiv.classList.add('selected');
                select.value = option.value;
                select.dispatchEvent(new Event('change'));
                wrapper.classList.remove('open');
            });
            optionsDiv.appendChild(optDiv);
        });
        
        wrapper.appendChild(trigger);
        wrapper.appendChild(optionsDiv);
        
        select.parentNode.insertBefore(wrapper, select.nextSibling);
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            document.querySelectorAll('.custom-select').forEach(el => el.classList.remove('open'));
            if (!isOpen) wrapper.classList.add('open');
        });
    });
}

document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach(el => el.classList.remove('open'));
});

// --- RENDER FUNCTIONS ---
function renderForms() {
    // By Student form
    const studentInputsHTML = settings.subjects.map(sub => `
        <div class="form-group" style="flex: 1; min-width: 100px; margin-bottom: 0;">
            <label style="margin-bottom: 6px;">${sub} (Max ${settings.subjectMaxMarks[sub] || 100})</label>
            <input type="number" class="student-subject-input" data-subject="${sub}" required min="0" max="${settings.subjectMaxMarks[sub] || 100}" placeholder="0">
        </div>
    `).join('');
    
    // Inject before the add button
    const btnHTML = `<button type="submit" class="btn btn-primary" style="height: 44px; padding: 0 32px; flex: none;"><i class="fas fa-plus"></i> Add</button>`;
    
    studentFormInputs.innerHTML = `
        <div class="form-group" style="flex: 2; min-width: 150px; margin-bottom: 0;">
            <label style="margin-bottom: 6px;">Student Name</label>
            <input type="text" id="student-name" required placeholder="e.g. John Doe" autocomplete="off">
        </div>
        ${studentInputsHTML}
        ${btnHTML}
    `;

    // Subject dropdown
    subjectSelect.innerHTML = `<option value="" disabled selected>Choose...</option>` + 
        settings.subjects.map(sub => `<option value="${sub}">${sub}</option>`).join('');
        
    subjectStudentsList.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; margin-top: 8px;">Select a subject to enter marks for all students.</p>`;
    
    // Table Headers
    const headersHTML = `
        <th>Student Details</th>
        ${settings.subjects.map(sub => `<th>${sub}</th>`).join('')}
        <th>Total Marks</th>
        <th>Percentage</th>
        <th>Status</th>
        <th class="text-right">Actions</th>
    `;
    tableHeadRow.innerHTML = headersHTML;
    
    // Print Headers
    const printHeadersHTML = `
        <th style="padding: 10px;">Name</th>
        ${settings.subjects.map(sub => `<th style="padding: 10px;">${sub}</th>`).join('')}
        <th style="padding: 10px;">Total</th>
        <th style="padding: 10px;">%</th>
        <th style="padding: 10px;">Status</th>
    `;
    printHeadRow.innerHTML = printHeadersHTML;
    
    initCustomSelects();
}

function renderSubjectManagement() {
    subjectsListContainer.innerHTML = settings.subjects.map(sub => `
        <div style="display: flex; gap: 8px; align-items: center;">
            <span class="subject-tag" style="flex: 1; margin: 0; display: flex; justify-content: space-between;">
                ${sub}
                <button type="button" onclick="deleteSubject('${sub}')"><i class="fas fa-times"></i></button>
            </span>
            <div style="display: flex; align-items: center; gap: 6px;">
                <label style="margin: 0; font-size: 11px;">Max:</label>
                <input type="number" class="subject-max-mark-input" data-subject="${sub}" value="${settings.subjectMaxMarks[sub] || 100}" min="1" style="width: 70px; height: 32px;" onchange="updateSubjectMax('${sub}', this.value)">
            </div>
        </div>
    `).join('');
}

window.updateSubjectMax = function(sub, val) {
    settings.subjectMaxMarks[sub] = parseInt(val) || 100;
    saveState();
}

function renderApp() {
    const sorted = getSortedStudents();
    renderTable(sorted);
    renderMetrics(sorted);
    renderPodium();
}

function renderTable(data) {
    if (data.length === 0) {
        studentsBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    const maxTotal = getMaxTotalMarks();
    
    studentsBody.innerHTML = data.map(s => {
        const pass = hasPassed(s);
        const total = getTotalMark(s);
        const percentage = maxTotal === 0 ? "0.0" : ((total / maxTotal) * 100).toFixed(1);
        
        const subjectCells = settings.subjects.map(sub => `
            <td data-label="${sub}">${s.marks && s.marks[sub] !== undefined ? s.marks[sub] : '-'}</td>
        `).join('');
        
        return `
            <tr>
                <td data-label="Student" style="font-weight: 500;">${s.name}</td>
                ${subjectCells}
                <td data-label="Total Marks">${total} <span style="color:var(--text-muted);font-size:11px;">/ ${maxTotal}</span></td>
                <td data-label="Percentage">${percentage}%</td>
                <td data-label="Status"><span class="badge ${pass ? 'pass' : 'fail'}">${pass ? 'Qualified' : 'Failed'}</span></td>
                <td data-label="Actions" class="actions-cell">
                    <button class="btn-action edit" onclick="prepareUpdate(${s.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-action delete" onclick="deleteStudent(${s.id})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderMetrics(data) {
    document.getElementById('kpi-total').textContent = students.length;
    
    if (students.length === 0) {
        document.getElementById('kpi-passed').textContent = '0';
        document.getElementById('kpi-failed').textContent = '0';
        document.getElementById('kpi-average').textContent = '0';
        return;
    }

    const passed = students.filter(s => hasPassed(s)).length;
    const failed = students.length - passed;
    const sum = students.reduce((acc, curr) => acc + getTotalMark(curr), 0);
    const avg = (sum / students.length).toFixed(1);

    document.getElementById('kpi-passed').textContent = passed;
    document.getElementById('kpi-failed').textContent = failed;
    document.getElementById('kpi-average').textContent = avg;
    
    document.getElementById('kpi-pass-rate').textContent = `${((passed / students.length) * 100).toFixed(0)}% Pass Rate`;
    document.getElementById('kpi-fail-rate').textContent = `${((failed / students.length) * 100).toFixed(0)}% Fail Rate`;
}

function renderPodium() {
    const topStudents = [...students].sort((a, b) => getTotalMark(b) - getTotalMark(a)).slice(0, 3);
    
    const updateRank = (rank, data) => {
        document.getElementById(`rank${rank}-name`).textContent = data ? data.name : '-';
        document.getElementById(`rank${rank}-mark`).textContent = data ? `${getTotalMark(data)} pts` : '-';
    };

    updateRank(1, topStudents[0]);
    updateRank(2, topStudents[1]);
    updateRank(3, topStudents[2]);
}

function populateSettingsForm() {
    const typeSelect = document.getElementById('setting-qualify-type');
    typeSelect.value = settings.qualifyType;
    document.getElementById('setting-qualify-value').value = settings.qualifyValue;
    
    if (typeSelect.nextElementSibling && typeSelect.nextElementSibling.classList.contains('custom-select')) {
        const textSpan = typeSelect.nextElementSibling.querySelector('.custom-select-text');
        textSpan.textContent = typeSelect.options[typeSelect.selectedIndex].textContent;
        typeSelect.nextElementSibling.querySelectorAll('.custom-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === settings.qualifyType);
        });
    }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    document.querySelectorAll('.menu-item[href="#"]').forEach(link => {
        link.addEventListener('click', (e) => e.preventDefault());
    });

    dashboardScroll.addEventListener('scroll', syncTopbarState, { passive: true });
    syncTopbarState();

    // Modals
    btnSettings.addEventListener('click', (e) => {
        e.preventDefault();
        settingsModal.classList.remove('hidden');
    });
    
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
    });

    // Theme
    btnThemeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const current = document.body.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
    });

    // Tabs
    tabByStudent.addEventListener('click', () => {
        tabByStudent.classList.add('active');
        tabBySubject.classList.remove('active');
        addStudentForm.classList.remove('hidden');
        addSubjectForm.classList.add('hidden');
    });

    tabBySubject.addEventListener('click', () => {
        tabBySubject.classList.add('active');
        tabByStudent.classList.remove('active');
        addSubjectForm.classList.remove('hidden');
        addStudentForm.classList.add('hidden');
    });

    // Forms
    addStudentForm.addEventListener('submit', handleAddStudent);
    addSubjectForm.addEventListener('submit', handleAddSubjectMarks);
    
    subjectSelect.addEventListener('change', (e) => {
        const sub = e.target.value;
        if (!sub) return;
        
        if (students.length === 0) {
            subjectStudentsList.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No students added yet.</p>`;
            return;
        }

        const maxMark = settings.subjectMaxMarks[sub] || 100;
        subjectStudentsList.innerHTML = `<p style="margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Max Marks: ${maxMark}</p>` + students.map(s => `
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
                <label style="margin: 0; width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.name}</label>
                <input type="number" data-id="${s.id}" class="subject-student-mark-input" value="${s.marks && s.marks[sub] !== undefined ? s.marks[sub] : ''}" required min="0" max="${maxMark}" placeholder="0" style="width: 80px; height: 32px;">
            </div>
        `).join('');
    });

    settingsForm.addEventListener('submit', handleSettings);
    updateForm.addEventListener('submit', handleUpdate);
    document.getElementById('cancel-update').addEventListener('click', () => {
        updateContainer.classList.add('hidden');
    });

    // Subjects
    btnAddSubject.addEventListener('click', () => {
        const input = document.getElementById('new-subject-name');
        const maxInput = document.getElementById('new-subject-max');
        const val = input.value.trim();
        const maxVal = parseInt(maxInput.value) || 100;
        
        if (val && !settings.subjects.includes(val)) {
            settings.subjects.push(val);
            settings.subjectMaxMarks[val] = maxVal;
            input.value = '';
            maxInput.value = '100';
            
            // Give existing students 0 for new subject
            students.forEach(s => {
                if (!s.marks) s.marks = {};
                s.marks[val] = 0;
            });
            
            saveState();
            renderSubjectManagement();
        }
    });

    // Interactions
    searchInput.addEventListener('input', renderApp);
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderApp();
    });

    // Export Dropdown
    btnExportMenu.addEventListener('click', () => exportMenu.classList.toggle('hidden'));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.export-dropdown')) exportMenu.classList.add('hidden');
    });

    exportMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const format = e.currentTarget.dataset.format;
            exportData(format);
            exportMenu.classList.add('hidden');
        });
    });
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const iconClass = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    const label = theme === 'dark' ? 'Light Mode' : 'Dark Mode';

    btnThemeToggle.title = label;
    btnThemeToggle.setAttribute('aria-label', label);
    btnThemeToggle.innerHTML = `<i class="${iconClass}"></i> <span>${label}</span>`;
}

function syncTopbarState() {
    topbar.classList.toggle('scrolled', dashboardScroll.scrollTop > 8);
}

// --- CRUD OPERATIONS ---
window.deleteSubject = function(sub) {
    if (confirm(`Delete subject '${sub}'?`)) {
        settings.subjects = settings.subjects.filter(s => s !== sub);
        students.forEach(s => {
            if (s.marks) delete s.marks[sub];
        });
        saveState();
        renderSubjectManagement();
    }
}

function handleAddStudent(e) {
    e.preventDefault();
    const name = document.getElementById('student-name').value.trim();
    
    let marks = {};
    const inputs = document.querySelectorAll('.student-subject-input');
    let hasError = false;
    inputs.forEach(input => {
        const sub = input.dataset.subject;
        const val = parseInt(input.value) || 0;
        const max = settings.subjectMaxMarks[sub] || 100;
        if (val > max) {
            showToast(`Error: ${sub} marks cannot exceed ${max}`);
            hasError = true;
        }
        marks[sub] = val;
    });

    if (hasError) return;

    if (name) {
        const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
        students.push({ id: newId, name, marks });
        saveState();
        addStudentForm.reset();
        document.getElementById('student-name').focus();
        showToast(`Added ${name} successfully!`);
    }
}

function handleAddSubjectMarks(e) {
    e.preventDefault();
    const sub = subjectSelect.value;
    if (!sub) return;
    const max = settings.subjectMaxMarks[sub] || 100;

    const inputs = document.querySelectorAll('.subject-student-mark-input');
    let hasError = false;
    inputs.forEach(input => {
        const val = parseInt(input.value) || 0;
        if (val > max) {
            showToast(`Error: marks for ${sub} cannot exceed ${max}`);
            hasError = true;
        }
    });
    
    if (hasError) return;

    inputs.forEach(input => {
        const id = parseInt(input.dataset.id);
        const val = parseInt(input.value) || 0;
        const student = students.find(s => s.id === id);
        if (student) {
            if (!student.marks) student.marks = {};
            student.marks[sub] = val;
        }
    });
    
    saveState();
    showToast(`Marks saved for ${sub}!`);
}

let editingId = null;
window.prepareUpdate = function(id) {
    const student = students.find(s => s.id === id);
    if (student) {
        editingId = id;
        document.getElementById('update-name').value = student.name;
        
        updateFormInputs.innerHTML = settings.subjects.map(sub => `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <label style="margin: 0;">${sub} (Max: ${settings.subjectMaxMarks[sub] || 100})</label>
                <input type="number" class="update-subject-input" data-subject="${sub}" required min="0" max="${settings.subjectMaxMarks[sub] || 100}" value="${student.marks && student.marks[sub] !== undefined ? student.marks[sub] : 0}" style="width: 100px;">
            </div>
        `).join('');
        
        updateContainer.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function handleUpdate(e) {
    e.preventDefault();
    if (editingId !== null) {
        const studentIndex = students.findIndex(s => s.id === editingId);
        if (studentIndex > -1) {
            const inputs = document.querySelectorAll('.update-subject-input');
            let hasError = false;
            let newMarks = { ...students[studentIndex].marks };
            inputs.forEach(input => {
                const sub = input.dataset.subject;
                const val = parseInt(input.value) || 0;
                const max = settings.subjectMaxMarks[sub] || 100;
                if (val > max) {
                    showToast(`Error: ${sub} marks cannot exceed ${max}`);
                    hasError = true;
                }
                newMarks[sub] = val;
            });
            
            if (hasError) return;
            
            students[studentIndex].marks = newMarks;
            saveState();
            updateContainer.classList.add('hidden');
            showToast('Marks updated successfully!');
            editingId = null;
        }
    }
}

window.deleteStudent = function(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id !== id);
        saveState();
        showToast('Student deleted.');
        if (editingId === id) updateContainer.classList.add('hidden');
    }
}

function handleSettings(e) {
    e.preventDefault();
    settings.qualifyType = document.getElementById('setting-qualify-type').value;
    settings.qualifyValue = parseInt(document.getElementById('setting-qualify-value').value);
    
    saveState();
    settingsModal.classList.add('hidden');
    showToast('Evaluation settings saved!');
}

// --- EXPORT LOGIC ---
function exportData(format) {
    const data = getSortedStudents();
    if (data.length === 0) {
        showToast('No data to export!');
        return;
    }

    if (format === 'docx') exportDOCX(data);
    else if (format === 'xlsx') exportExcel(data);
    else if (format === 'pdf') exportPDF(data);
}

async function exportDOCX(data) {
    if (typeof docx === 'undefined') {
        showToast('DOCX library still loading. Please try again in a moment.');
        return;
    }

    showToast('Generating DOCX...');

    const maxTotal = getMaxTotalMarks();

    const headerChildren = [
        new docx.TableCell({ children: [new docx.Paragraph({ text: "Name", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] })
    ];
    
    settings.subjects.forEach(sub => {
        headerChildren.push(new docx.TableCell({ children: [new docx.Paragraph({ text: sub, alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }));
    });
    
    headerChildren.push(
        new docx.TableCell({ children: [new docx.Paragraph({ text: "Total", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }),
        new docx.TableCell({ children: [new docx.Paragraph({ text: "Percentage", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }),
        new docx.TableCell({ children: [new docx.Paragraph({ text: "Status", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] })
    );

    const tableRows = [new docx.TableRow({ children: headerChildren })];

    data.forEach(s => {
        const pass = hasPassed(s) ? 'Qualified' : 'Failed';
        const total = getTotalMark(s);
        const percent = maxTotal === 0 ? "0.0%" : ((total / maxTotal) * 100).toFixed(1) + '%';
        
        const rowChildren = [new docx.TableCell({ children: [new docx.Paragraph({ text: s.name })] })];
        
        settings.subjects.forEach(sub => {
            rowChildren.push(new docx.TableCell({ children: [new docx.Paragraph({ text: String(s.marks && s.marks[sub] !== undefined ? s.marks[sub] : '-'), alignment: docx.AlignmentType.CENTER })] }));
        });
        
        rowChildren.push(
            new docx.TableCell({ children: [new docx.Paragraph({ text: String(total), alignment: docx.AlignmentType.CENTER })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: percent, alignment: docx.AlignmentType.CENTER })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: pass, alignment: docx.AlignmentType.CENTER })] })
        );

        tableRows.push(new docx.TableRow({ children: rowChildren }));
    });

    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: [
                new docx.Paragraph({
                    text: "Student Performance Report",
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER
                }),
                new docx.Paragraph({
                    text: "Generated on " + new Date().toLocaleDateString(),
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new docx.Table({
                    rows: tableRows,
                    width: { size: 100, type: docx.WidthType.PERCENTAGE }
                })
            ]
        }]
    });

    try {
        const blob = await docx.Packer.toBlob(doc);
        downloadBlob(blob, 'student_report.docx');
    } catch (err) {
        showToast('Error generating DOCX');
        console.error(err);
    }
}

function exportExcel(data) {
    if (typeof XLSX === 'undefined') {
        showToast('Excel library still loading. Please try again in a moment.');
        return;
    }

    const maxTotal = getMaxTotalMarks();

    const exportData = data.map(s => {
        const total = getTotalMark(s);
        let row = { "Student Name": s.name };
        
        settings.subjects.forEach(sub => {
            row[sub] = s.marks && s.marks[sub] !== undefined ? s.marks[sub] : 0;
        });
        
        row["Total Marks"] = total;
        row["Percentage"] = maxTotal === 0 ? "0.0%" : ((total / maxTotal) * 100).toFixed(1) + '%';
        row["Status"] = hasPassed(s) ? 'Qualified' : 'Failed';
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "student_report.xlsx");
    showToast('Excel downloaded successfully');
}

function exportPDF(data) {
    if (typeof html2pdf === 'undefined') {
        showToast('PDF library still loading. Please try again in a moment.');
        return;
    }

    showToast('Generating PDF...');
    
    const template = document.getElementById('print-template');
    const tbody = document.getElementById('print-body');
    document.getElementById('print-date').textContent = new Date().toLocaleDateString();
    
    const maxTotal = getMaxTotalMarks();
    
    tbody.innerHTML = data.map(s => {
        const pass = hasPassed(s);
        const total = getTotalMark(s);
        const percent = maxTotal === 0 ? "0.0%" : ((total / maxTotal) * 100).toFixed(1) + '%';
        
        let subCells = settings.subjects.map(sub => `<td style="padding: 8px;">${s.marks && s.marks[sub] !== undefined ? s.marks[sub] : '-'}</td>`).join('');
        
        return `
            <tr>
                <td style="padding: 8px;">${s.name}</td>
                ${subCells}
                <td style="padding: 8px;">${total}</td>
                <td style="padding: 8px;">${percent}</td>
                <td style="padding: 8px; color: ${pass ? '#10B981' : '#EF4444'}">${pass ? 'Qualified' : 'Failed'}</td>
            </tr>
        `;
    }).join('');

    template.classList.remove('hidden');
    
    // Scale or orientation changes might be needed if there are many subjects
    const isLandscape = settings.subjects.length > 4;
    
    const opt = {
        margin:       0.5,
        filename:     'student_report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: isLandscape ? 'landscape' : 'portrait' }
    };

    html2pdf().set(opt).from(template).save().then(() => {
        template.classList.add('hidden');
        showToast('PDF generated successfully!');
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`${filename} downloaded successfully`);
}

// Toast
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Start
init();
