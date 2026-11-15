const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('the visual system uses SF Pro Display first', () => {
    assert.match(css, /--font-sans:\s*["']SF Pro Display["']/);
    assert.match(css, /body\s*\{[\s\S]*?font-family:\s*var\(--font-sans\)/);
});

test('the stylesheet contains no gradients', () => {
    assert.doesNotMatch(css, /gradient/i);
});

test('the stylesheet contains no glow, blur, or shadow effects', () => {
    assert.doesNotMatch(css, /backdrop-filter/i);
    assert.doesNotMatch(css, /box-shadow/i);
    assert.doesNotMatch(css, /text-shadow/i);
});

test('focus treatment is solid and non-glowing', () => {
    assert.match(css, /:where\([^)]*button[^)]*\):focus-visible[\s\S]*?outline:\s*2px solid var\(--primary\)/);
    assert.doesNotMatch(css, /focus-visible[\s\S]{0,200}box-shadow/i);
});

test('the page has no external font dependency', () => {
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
});
