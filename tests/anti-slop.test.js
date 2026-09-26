const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

function finalOverride() {
    const marker = '/* GradeDash editorial system:';
    return css.slice(css.lastIndexOf(marker));
}

test('the rendered design disables decorative AI defaults', () => {
    const override = finalOverride();
    assert.match(override, /background-image:\s*none\s*!important/);
    assert.match(override, /backdrop-filter:\s*none\s*!important/);
    assert.match(override, /box-shadow:\s*none\s*!important/);
    assert.match(override, /border-radius:\s*4px\s*!important/);
});

test('product copy describes the classroom task instead of marketing the interface', () => {
    const copy = html.toLowerCase();
    for (const phrase of ['performance command center', 'student performance studio', 'premium dashboard', 'unlock ranking', 'polished exports', 'keep the class view sharp']) {
        assert.equal(copy.includes(phrase), false, `generic product phrase remains: ${phrase}`);
    }
});

test('the page does not advertise a fake quality or insight layer', () => {
    const copy = html.toLowerCase();
    assert.equal(copy.includes('quality check'), false);
    assert.equal(copy.includes('what deserves attention right now'), false);
    assert.equal(copy.includes('without breaking rhythm'), false);
});

test('the hero is a compact working header, not a landing-page composition', () => {
    const override = finalOverride();
    assert.match(override, /\.hero-panel\s*\{[\s\S]*?padding:\s*24px/);
    assert.match(override, /\.hero-insights\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
});
