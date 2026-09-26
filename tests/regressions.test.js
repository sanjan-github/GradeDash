const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function loadStateWithStoredValues(settingsValue, studentsValue) {
    const storage = new Map([
        ['gradeDashSettings', settingsValue],
        ['studentsData', studentsValue]
    ]);
    const context = {
        localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, String(value))
        },
        JSON,
        Number,
        Math,
        Set,
        Array,
        String,
        Object
    };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js/state.js'), 'utf8'), context);
    return vm.runInNewContext('({ settings, students })', context);
}

test('recovers from malformed localStorage instead of crashing the dashboard', () => {
    const state = loadStateWithStoredValues('{broken', '[also broken');
    assert.deepEqual([...state.settings.subjects], ['Mathematics', 'Science', 'English']);
    assert.equal(state.students.length, 0);
});

test('subject-wide validation defines the selected subject maximum before using it', () => {
    const source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
    const handler = source.slice(source.indexOf('function handleAddSubjectMarks'), source.indexOf('function handleUpdate'));
    assert.match(handler, /const maxMark = settings\.subjectMaxMarks\[subject\] \|\| 100;/);
});
