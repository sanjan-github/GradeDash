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
let activeTemplateFilter = 'all';
let templateSearchQuery = '';
let templateStep = 'level';
let selectedLevel = null;
let selectedBranch = null;

