// State management using LocalStorage
let students = JSON.parse(localStorage.getItem('studentsData')) || {};

// DOM Elements
const addForm = document.getElementById('add-student-form');
const nameInput = document.getElementById('student-name');
const markInput = document.getElementById('student-mark');
const searchInput = document.getElementById('search-input');
const searchResult = document.getElementById('search-result');
const updateForm = document.getElementById('update-form');
const updateName = document.getElementById('update-name');
const updateMark = document.getElementById('update-mark');
const cancelUpdateBtn = document.getElementById('cancel-update');
const studentsBody = document.getElementById('students-body');
const emptyState = document.getElementById('empty-state');
const tableContainer = document.querySelector('table');
const downloadBtn = document.getElementById('download-btn');

// Analytics Elements
const elTotal = document.getElementById('total-students');
const elPassed = document.getElementById('passed-count');
const elFailed = document.getElementById('failed-count');
const elTop = document.getElementById('top-performer');
const elLowest = document.getElementById('lowest-performer');

// Initialize app
function init() {
    renderTable();
    updateAnalytics();
    setupEventListeners();
}

// Save to LocalStorage
function saveState() {
    localStorage.setItem('studentsData', JSON.stringify(students));
    updateAnalytics();
    renderTable();
}

// Event Listeners
function setupEventListeners() {
    addForm.addEventListener('submit', handleAddStudent);
    
    // Real-time search
    searchInput.addEventListener('input', handleSearch);
    
    updateForm.addEventListener('submit', handleUpdateStudent);
    cancelUpdateBtn.addEventListener('click', () => {
        updateForm.classList.add('hidden');
        searchInput.value = '';
        searchResult.classList.add('hidden');
    });

    downloadBtn.addEventListener('click', handleDownloadData);
}

// Add Student
function handleAddStudent(e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    const mark = parseInt(markInput.value);

    if (name && !isNaN(mark)) {
        students[name] = mark;
        saveState();
        
        nameInput.value = '';
        markInput.value = '';
        showToast(`Added ${name} successfully!`);
    }
}

// Delete Student
window.deleteStudent = function(name) {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
        delete students[name];
        saveState();
        showToast(`Deleted ${name}`);
        
        // Clear search if the deleted user was being searched/updated
        if (updateName.value === name) {
            updateForm.classList.add('hidden');
            searchResult.classList.add('hidden');
        }
    }
}

// Prepare Update
window.prepareUpdate = function(name) {
    updateForm.classList.remove('hidden');
    updateName.value = name;
    updateMark.value = students[name];
    updateMark.focus();
    searchResult.classList.add('hidden');
}

// Handle Update
function handleUpdateStudent(e) {
    e.preventDefault();
    const name = updateName.value;
    const newMark = parseInt(updateMark.value);

    if (name && !isNaN(newMark) && students.hasOwnProperty(name)) {
        students[name] = newMark;
        saveState();
        updateForm.classList.add('hidden');
        searchInput.value = '';
        showToast(`Updated ${name}'s marks to ${newMark}`);
    }
}

// Search Student
function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (query === '') {
        searchResult.classList.add('hidden');
        updateForm.classList.add('hidden');
        return;
    }

    // Exact match search as per original python script, but case insensitive for better UX
    const foundName = Object.keys(students).find(name => name.toLowerCase() === query);

    searchResult.classList.remove('hidden');
    
    if (foundName) {
        searchResult.className = 'result-box';
        searchResult.innerHTML = `
            <div>
                <strong>${foundName}</strong> - ${students[foundName]} Marks
            </div>
            <button class="btn btn-primary" onclick="prepareUpdate('${foundName}')">
                <i class="fas fa-edit"></i> Edit
            </button>
        `;
    } else {
        searchResult.className = 'result-box error';
        searchResult.innerHTML = `<div><i class="fas fa-exclamation-circle"></i> Student not found</div>`;
        updateForm.classList.add('hidden');
    }
}

// Render Table
function renderTable() {
    const names = Object.keys(students);
    
    if (names.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        studentsBody.innerHTML = '';
        return;
    }

    tableContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    studentsBody.innerHTML = names.map(name => {
        const mark = students[name];
        const isPass = mark >= 40;
        const badgeClass = isPass ? 'pass' : 'fail';
        const statusText = isPass ? 'Passed' : 'Failed';

        return `
            <tr>
                <td style="font-weight: 500;">${name}</td>
                <td>${mark}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td class="actions-cell">
                    <button class="btn-action edit" onclick="prepareUpdate('${name}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteStudent('${name}')" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Analytics and Extremes
function updateAnalytics() {
    const entries = Object.entries(students);
    const total = entries.length;
    
    elTotal.textContent = total;

    if (total === 0) {
        elPassed.textContent = '0';
        elFailed.textContent = '0';
        elTop.textContent = '-';
        elLowest.textContent = '-';
        return;
    }

    let passed = 0;
    let failed = 0;
    let topName = entries[0][0];
    let topMark = entries[0][1];
    let lowestName = entries[0][0];
    let lowestMark = entries[0][1];

    for (const [name, mark] of entries) {
        if (mark >= 40) passed++;
        else failed++;

        if (mark > topMark) {
            topMark = mark;
            topName = name;
        }
        if (mark < lowestMark) {
            lowestMark = mark;
            lowestName = name;
        }
    }

    elPassed.textContent = passed;
    elFailed.textContent = failed;
    elTop.innerHTML = `${topName} <span style="color:var(--text-muted);font-size:0.8rem;">(${topMark})</span>`;
    elLowest.innerHTML = `${lowestName} <span style="color:var(--text-muted);font-size:0.8rem;">(${lowestMark})</span>`;
}

// Download Data Feature
function handleDownloadData() {
    const names = Object.keys(students);
    if (names.length === 0) {
        showToast('No data to download');
        return;
    }

    // Format matching original python script text file: "Name gained X marks \n"
    let fileContent = "";
    for (const [name, mark] of Object.entries(students)) {
        fileContent += `${name} gained ${mark} marks\n`;
    }

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.txt';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data downloaded as students.txt');
}

// Toast Notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    
    toastMsg.textContent = message;
    toast.classList.add('show');
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

// Start the app
init();
