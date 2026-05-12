// --- STATE MANAGEMENT ---
// Default Settings
let settings = JSON.parse(localStorage.getItem('gradeDashSettings')) || {
    totalMarks: 100,
    qualifyType: 'percentage', // 'marks' or 'percentage'
    qualifyValue: 40
};

// Students Data Migration & Loading
// Previous version used an object { "Name": Mark }. We need an array for sorting by entry order.
let rawStudents = JSON.parse(localStorage.getItem('studentsData')) || {};
let students = [];

if (Array.isArray(rawStudents)) {
    students = rawStudents;
} else {
    // Migration from old dict structure
    let id = 1;
    for (const [name, mark] of Object.entries(rawStudents)) {
        students.push({ id: id++, name, mark });
    }
    localStorage.setItem('studentsData', JSON.stringify(students));
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

// Forms
const addForm = document.getElementById('add-student-form');
const settingsForm = document.getElementById('settings-form');
const updateForm = document.getElementById('update-form');
const searchInput = document.getElementById('global-search');
const sortSelect = document.getElementById('sort-select');

// Table & Metrics
const studentsBody = document.getElementById('students-body');
const emptyState = document.getElementById('empty-state');
const updateContainer = document.getElementById('update-container');

// --- INITIALIZATION ---
function init() {
    applyTheme(localStorage.getItem('theme') || 'light');
    populateSettingsForm();
    renderApp();
    setupEventListeners();
}

function saveState() {
    localStorage.setItem('studentsData', JSON.stringify(students));
    localStorage.setItem('gradeDashSettings', JSON.stringify(settings));
    renderApp();
}

// --- LOGIC HELPER FUNCTIONS ---
function hasPassed(mark) {
    if (settings.qualifyType === 'marks') {
        return mark >= settings.qualifyValue;
    } else {
        const percentage = (mark / settings.totalMarks) * 100;
        return percentage >= settings.qualifyValue;
    }
}

function getSortedStudents() {
    // Clone array to avoid mutating original order
    let sorted = [...students];
    const query = searchInput.value.toLowerCase().trim();
    
    if (query) {
        sorted = sorted.filter(s => s.name.toLowerCase().includes(query));
    }

    sorted.sort((a, b) => {
        switch (currentSort) {
            case 'entry-asc': return a.id - b.id;
            case 'entry-desc': return b.id - a.id;
            case 'marks-desc': return b.mark - a.mark;
            case 'marks-asc': return a.mark - b.mark;
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            default: return 0;
        }
    });
    return sorted;
}

// --- RENDER FUNCTIONS ---
function renderApp() {
    const sorted = getSortedStudents();
    renderTable(sorted);
    renderMetrics(sorted);
    renderPodium(); // Podium always based on overall top 3, not search filtered
}

function renderTable(data) {
    if (data.length === 0) {
        studentsBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    studentsBody.innerHTML = data.map(s => {
        const pass = hasPassed(s.mark);
        const percentage = ((s.mark / settings.totalMarks) * 100).toFixed(1);
        
        return `
            <tr>
                <td data-label="Student" style="font-weight: 500;">${s.name}</td>
                <td data-label="Marks">${s.mark} <span style="color:var(--text-muted);font-size:11px;">/ ${settings.totalMarks}</span></td>
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
    document.getElementById('kpi-total').textContent = students.length; // Always show total
    
    if (students.length === 0) {
        document.getElementById('kpi-passed').textContent = '0';
        document.getElementById('kpi-failed').textContent = '0';
        document.getElementById('kpi-average').textContent = '0';
        return;
    }

    const passed = students.filter(s => hasPassed(s.mark)).length;
    const failed = students.length - passed;
    const sum = students.reduce((acc, curr) => acc + curr.mark, 0);
    const avg = (sum / students.length).toFixed(1);

    document.getElementById('kpi-passed').textContent = passed;
    document.getElementById('kpi-failed').textContent = failed;
    document.getElementById('kpi-average').textContent = avg;
    
    document.getElementById('kpi-pass-rate').textContent = `${((passed/students.length)*100).toFixed(0)}% Pass Rate`;
    document.getElementById('kpi-fail-rate').textContent = `${((failed/students.length)*100).toFixed(0)}% Fail Rate`;
}

function renderPodium() {
    // Always sort by marks descending for podium
    const topStudents = [...students].sort((a, b) => b.mark - a.mark).slice(0, 3);
    
    const updateRank = (rank, data) => {
        document.getElementById(`rank${rank}-name`).textContent = data ? data.name : '-';
        document.getElementById(`rank${rank}-mark`).textContent = data ? `${data.mark} pts` : '-';
    };

    updateRank(1, topStudents[0]);
    updateRank(2, topStudents[1]);
    updateRank(3, topStudents[2]);
}

function populateSettingsForm() {
    document.getElementById('setting-total-marks').value = settings.totalMarks;
    document.getElementById('setting-qualify-type').value = settings.qualifyType;
    document.getElementById('setting-qualify-value').value = settings.qualifyValue;
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

    // Forms
    addForm.addEventListener('submit', handleAdd);
    settingsForm.addEventListener('submit', handleSettings);
    updateForm.addEventListener('submit', handleUpdate);
    document.getElementById('cancel-update').addEventListener('click', () => {
        updateContainer.classList.add('hidden');
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
function handleAdd(e) {
    e.preventDefault();
    const name = document.getElementById('student-name').value.trim();
    const mark = parseInt(document.getElementById('student-mark').value);

    if (name && !isNaN(mark)) {
        const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
        students.push({ id: newId, name, mark });
        saveState();
        addForm.reset();
        document.getElementById('student-name').focus(); // Automatically focus for quick entry
        showToast(`Added ${name} successfully!`);
    }
}

let editingId = null;
window.prepareUpdate = function(id) {
    const student = students.find(s => s.id === id);
    if (student) {
        editingId = id;
        document.getElementById('update-name').value = student.name;
        document.getElementById('update-mark').value = student.mark;
        updateContainer.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function handleUpdate(e) {
    e.preventDefault();
    const newMark = parseInt(document.getElementById('update-mark').value);
    
    if (!isNaN(newMark) && editingId !== null) {
        const studentIndex = students.findIndex(s => s.id === editingId);
        if (studentIndex > -1) {
            students[studentIndex].mark = newMark;
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
    settings.totalMarks = parseInt(document.getElementById('setting-total-marks').value);
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

    const tableRows = [
        new docx.TableRow({
            children: [
                new docx.TableCell({ children: [new docx.Paragraph({ text: "Name", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }),
                new docx.TableCell({ children: [new docx.Paragraph({ text: "Marks", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }),
                new docx.TableCell({ children: [new docx.Paragraph({ text: "Percentage", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }),
                new docx.TableCell({ children: [new docx.Paragraph({ text: "Status", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] })
            ]
        })
    ];

    data.forEach(s => {
        const pass = hasPassed(s.mark) ? 'Qualified' : 'Failed';
        const percent = ((s.mark / settings.totalMarks) * 100).toFixed(1) + '%';
        tableRows.push(new docx.TableRow({
            children: [
                new docx.TableCell({ children: [new docx.Paragraph({ text: s.name })] }),
                new docx.TableCell({ children: [new docx.Paragraph({ text: String(s.mark), alignment: docx.AlignmentType.CENTER })] }),
                new docx.TableCell({ children: [new docx.Paragraph({ text: percent, alignment: docx.AlignmentType.CENTER })] }),
                new docx.TableCell({ children: [new docx.Paragraph({ text: pass, alignment: docx.AlignmentType.CENTER })] })
            ]
        }));
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
                    width: {
                        size: 100,
                        type: docx.WidthType.PERCENTAGE,
                    }
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

    const exportData = data.map(s => ({
        "Student Name": s.name,
        "Marks Scored": s.mark,
        "Percentage": ((s.mark / settings.totalMarks) * 100).toFixed(1) + '%',
        "Status": hasPassed(s.mark) ? 'Qualified' : 'Failed'
    }));

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
    
    // Populate hidden template
    const template = document.getElementById('print-template');
    const tbody = document.getElementById('print-body');
    document.getElementById('print-date').textContent = new Date().toLocaleDateString();
    
    tbody.innerHTML = data.map(s => {
        const pass = hasPassed(s.mark);
        const percent = ((s.mark / settings.totalMarks) * 100).toFixed(1) + '%';
        return `
            <tr>
                <td style="padding: 8px;">${s.name}</td>
                <td style="padding: 8px;">${s.mark}</td>
                <td style="padding: 8px;">${percent}</td>
                <td style="padding: 8px; color: ${pass ? '#10B981' : '#EF4444'}">${pass ? 'Qualified' : 'Failed'}</td>
            </tr>
        `;
    }).join('');

    template.classList.remove('hidden');
    
    const opt = {
        margin:       1,
        filename:     'student_report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
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
