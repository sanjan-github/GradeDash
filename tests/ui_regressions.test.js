const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');

function mediaBlock(source, query) {
    const start = source.indexOf(query);
    assert.notEqual(start, -1, `missing media query: ${query}`);
    return source.slice(start, source.indexOf('\n}', start) + 2);
}

test('table action buttons have matching component styles', () => {
    assert.match(app, /class="btn-action edit"/);
    assert.match(css, /\.btn-action\s*\{/);
    assert.match(css, /\.actions-cell\s*\{/);
});

test('interactive controls expose visible keyboard focus indicators', () => {
    assert.match(css, /:where\([^)]*button[^)]*\):focus-visible/);
    assert.match(css, /outline:\s*3px solid var\(--primary-light\)/);
});

test('primary action and modal controls meet touch target size', () => {
    assert.match(css, /\.btn-action\s*\{[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/);
    assert.match(css, /\.close-modal\s*\{[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/);
});

test('entry switcher implements accessible tabs and keyboard navigation', () => {
    assert.match(html, /id="tab-by-student"[^>]*role="tab"[^>]*aria-controls="add-student-form"/);
    assert.match(html, /id="tab-by-subject"[^>]*role="tab"[^>]*aria-controls="add-subject-form"/);
    assert.match(html, /id="add-student-form"[^>]*role="tabpanel"/);
    assert.match(html, /id="add-subject-form"[^>]*role="tabpanel"/);
    assert.match(app, /ArrowRight|ArrowLeft/);
    assert.match(app, /Home/);
    assert.match(app, /End/);
});

test('motion respects prefers-reduced-motion', () => {
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('mobile roster uses a compact non-horizontal layout', () => {
    const mobile = mediaBlock(css, '@media (max-width: 768px)');
    assert.match(mobile, /\.table-container\s*\{[\s\S]*?overflow-x:\s*visible/);
    assert.match(mobile, /tbody\s+tr\s*\{[\s\S]*?border-radius:\s*var\(--radius-md\)/);
});

test('incomplete theme toggle is removed from the interface and controller', () => {
    assert.doesNotMatch(html, /btn-theme-toggle/);
    assert.doesNotMatch(app, /btnThemeToggle|applyTheme|toggleTheme/);
});

test('modal open state makes the application background inert', () => {
    assert.match(app, /dom\.mainContent\?\.setAttribute\(['"]inert['"], ['"]['"]\)/);
    assert.match(app, /dom\.mainContent\?\.removeAttribute\(['"]inert['"]\)/);
});

test('export menu supports keyboard navigation and Escape', () => {
    assert.match(app, /ArrowDown|ArrowUp/);
    assert.match(app, /Home/);
    assert.match(app, /End/);
    assert.match(app, /event\.key === ['"]Escape['"][\s\S]*?setExportMenuOpen\(false, true\)/);
});
