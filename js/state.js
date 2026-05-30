const DEFAULT_SETTINGS = {
    subjects: ['Mathematics', 'Science', 'English'],
    subjectMaxMarks: {
        Mathematics: 100,
        Science: 100,
        English: 100
    },
    qualifyType: 'percentage',
    qualifyValue: 40
};

function normalizeStoredText(value) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeStoredPositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeStoredMark(value, maxMark) {
    const parsed = Number.parseInt(value, 10);
    const safeValue = Number.isFinite(parsed) ? parsed : 0;
    return Math.min(Math.max(safeValue, 0), maxMark);
}

function normalizeStoredSettings(rawSettings) {
    const safeSettings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
    const sourceSubjects = Array.isArray(safeSettings.subjects) ? safeSettings.subjects : DEFAULT_SETTINGS.subjects;
    const subjectMaxMarks = safeSettings.subjectMaxMarks && typeof safeSettings.subjectMaxMarks === 'object'
        ? safeSettings.subjectMaxMarks
        : {};

    const seenSubjects = new Set();
    const subjects = sourceSubjects
        .map(normalizeStoredText)
        .filter(subject => {
            if (!subject) return false;
            const key = subject.toLowerCase();
            if (seenSubjects.has(key)) return false;
            seenSubjects.add(key);
            return true;
        });

    const finalSubjects = subjects.length > 0 ? subjects : DEFAULT_SETTINGS.subjects;
    const finalSubjectMaxMarks = {};

    finalSubjects.forEach(subject => {
        if (safeSettings.totalMarks !== undefined) {
            finalSubjectMaxMarks[subject] = normalizeStoredPositiveInteger(safeSettings.totalMarks, 100);
            return;
        }

        const defaultMax = DEFAULT_SETTINGS.subjectMaxMarks[subject] || 100;
        finalSubjectMaxMarks[subject] = normalizeStoredPositiveInteger(subjectMaxMarks[subject], defaultMax);
    });

    const qualifyType = safeSettings.qualifyType === 'marks' ? 'marks' : 'percentage';
    const maxAllowedMarkRule = Math.min(...finalSubjects.map(subject => finalSubjectMaxMarks[subject]));
    const qualifyValue = qualifyType === 'percentage'
        ? Math.min(Math.max(Number.parseInt(safeSettings.qualifyValue, 10) || DEFAULT_SETTINGS.qualifyValue, 0), 100)
        : Math.min(Math.max(Number.parseInt(safeSettings.qualifyValue, 10) || 40, 0), maxAllowedMarkRule);

    return {
        subjects: finalSubjects,
        subjectMaxMarks: finalSubjectMaxMarks,
        qualifyType,
        qualifyValue
    };
}

function normalizeStoredStudents(rawStudents, subjectList, subjectMaxMarks) {
    const sourceStudents = Array.isArray(rawStudents) ? rawStudents : [];
    const seenIds = new Set();
    let nextId = 1;

    return sourceStudents
        .map((student, index) => {
            const safeStudent = student && typeof student === 'object' ? student : {};
            const legacyMark = typeof safeStudent.mark !== 'undefined' ? safeStudent.mark : undefined;
            const name = normalizeStoredText(safeStudent.name);
            if (!name) return null;

            let id = Number.parseInt(safeStudent.id, 10);
            if (!Number.isFinite(id) || id <= 0 || seenIds.has(id)) {
                while (seenIds.has(nextId)) nextId += 1;
                id = nextId;
            }

            seenIds.add(id);
            if (id >= nextId) nextId = id + 1;

            const marks = {};
            subjectList.forEach((subject, subjectIndex) => {
                const maxMark = subjectMaxMarks[subject] || 100;
                const sourceMarks = safeStudent.marks && typeof safeStudent.marks === 'object' ? safeStudent.marks : {};

                if (typeof legacyMark !== 'undefined' && subjectIndex === 0) {
                    marks[subject] = normalizeStoredMark(legacyMark, maxMark);
                    return;
                }

                marks[subject] = normalizeStoredMark(sourceMarks[subject], maxMark);
            });

            return { id, name, marks };
        })
        .filter(Boolean);
}

let settings = normalizeStoredSettings(JSON.parse(localStorage.getItem('gradeDashSettings')));
let students = normalizeStoredStudents(
    JSON.parse(localStorage.getItem('studentsData')),
    settings.subjects,
    settings.subjectMaxMarks
);

localStorage.setItem('gradeDashSettings', JSON.stringify(settings));
localStorage.setItem('studentsData', JSON.stringify(students));
