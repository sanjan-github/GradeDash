from pathlib import Path
import re

root = Path(r"C:\Users\TestUser\Documents\GitHub\student_marks")

index = root / "index.html"
html = index.read_text(encoding="utf-8")
start = html.index('                <section class="hero-panel">')
end = html.index('                <section class="workspace-grid">', start)
replacement = '''                <section class="task-header" aria-labelledby="page-title">
                    <div class="task-copy">
                        <span class="task-label">Class marks</span>
                        <h1 id="page-title">Enter the next mark.</h1>
                        <p>Add a student, fill in the current subjects, and keep the qualification rule visible while you work.</p>
                    </div>
                    <div class="task-actions">
                        <button type="button" class="btn btn-primary" data-action="focus-add-form">
                            <i class="fas fa-user-plus" aria-hidden="true"></i>
                            <span>Add student</span>
                        </button>
                        <button type="button" class="btn btn-secondary" data-action="open-templates">
                            <i class="fas fa-layer-group" aria-hidden="true"></i>
                            <span>Choose template</span>
                        </button>
                    </div>
                    <div class="class-meta" aria-label="Current class setup">
                        <div class="class-meta-item">
                            <span>Subjects</span>
                            <strong id="overview-subject-count">0</strong>
                            <small id="overview-total-max">Total max 0</small>
                        </div>
                        <div class="class-meta-item">
                            <span>Pass rule</span>
                            <strong id="overview-qualification">Awaiting setup</strong>
                            <small>Applied per subject</small>
                        </div>
                        <div class="class-meta-item">
                            <span>Templates</span>
                            <strong id="overview-ready-templates">0</strong>
                            <small>Boards available</small>
                        </div>
                    </div>
                </section>

'''
html = html[:start] + replacement + html[end:]

insight_start = html.index('                        <section class="card insight-card"')
update_start = html.index('                        <section class="card update-card', insight_start)
insight_replacement = '''                        <section class="class-summary" aria-labelledby="insight-title">
                            <div class="section-heading">
                                <div>
                                    <span class="section-label">Class summary</span>
                                    <h2 id="insight-title">What needs attention</h2>
                                    <p>Based on the current subjects and pass rule.</p>
                                </div>
                            </div>
                            <div class="summary-list">
                                <div class="summary-row">
                                    <span>Top mark</span>
                                    <strong id="insight-top-name">-</strong>
                                    <small id="insight-top-score">No scores yet</small>
                                </div>
                                <div class="summary-row">
                                    <span>Below the rule</span>
                                    <strong id="insight-attention-count">0</strong>
                                    <small id="insight-pass-rule">Awaiting criteria</small>
                                </div>
                            </div>
                            <div class="subject-overview">
                                <div class="subject-overview-header">
                                    <h3>Subjects</h3>
                                    <span id="insight-total-max">0 total max</span>
                                </div>
                                <div class="subject-pill-list" id="subject-highlight-list"></div>
                            </div>
                        </section>

'''
html = html[:insight_start] + insight_replacement + html[update_start:]
html = html.replace('<span class="card-kicker">Add marks</span>', '<span class="section-label">Enter marks</span>')
html = html.replace('<span class="card-kicker">Your class</span>', '<span class="section-label">Roster</span>')
html = html.replace('<span class="card-kicker">Edit record</span>', '<span class="section-label">Edit student</span>')
html = html.replace('Start with a student', 'Add a student')
html = html.replace('A quick read of the roster', 'What needs attention')
html = html.replace('Start your cohort', 'No students yet')
index.write_text(html, encoding="utf-8")

css = root / "styles.css"
styles = css.read_text(encoding="utf-8")
cut = styles.index('/* GradeDash editorial system: deliberate hierarchy over decoration. */')
base = styles[:cut].rstrip() + "\n\n"
final = r'''/* Hallmark · macrostructure: Workbench · genre: utilitarian editorial · theme: Almanac
 * audience: teachers and school administrators · use: enter and review marks · tone: utilitarian
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 */
:root {
    --font-sans: "IBM Plex Sans", "Segoe UI", sans-serif;
    --font-display: "Newsreader", Georgia, serif;
    --bg: #f3f0e8;
    --surface: #fbfaf6;
    --surface-strong: #fffefa;
    --surface-muted: #eeeae0;
    --border: #d8d2c5;
    --border-strong: #aaa293;
    --text-primary: #202622;
    --text-secondary: #4a514a;
    --text-muted: #73786f;
    --primary: #176b5b;
    --primary-strong: #0d5246;
    --primary-soft: #e0ece7;
    --primary-soft-strong: #c8ddd5;
    --success: #176b5b;
    --danger: #b34d3e;
    --danger-soft: #f4e2dc;
    --warning: #a56b18;
    --focus: #176b5b;
    --shadow-soft: 0 2px 8px rgba(42, 38, 29, 0.05);
    --shadow-medium: 0 8px 18px rgba(42, 38, 29, 0.1);
    --shadow-strong: 0 16px 32px rgba(42, 38, 29, 0.14);
    --radius-xs: 4px;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 10px;
    --radius-xl: 12px;
}

body[data-theme="dark"] {
    --bg: #171b18;
    --surface: #202622;
    --surface-strong: #252b26;
    --surface-muted: #1b211d;
    --border: #39423b;
    --border-strong: #59665a;
    --text-primary: #f2efe7;
    --text-secondary: #c5c9bf;
    --text-muted: #99a095;
    --primary: #67b29c;
    --primary-strong: #8ac5b1;
    --primary-soft: #263b33;
    --primary-soft-strong: #315044;
    --success: #67b29c;
    --danger: #e27a68;
    --danger-soft: #432c28;
    --warning: #d3a153;
    --focus: #8ac5b1;
}

html,
body { overflow-x: clip; }
body,
body[data-theme="dark"] { background: var(--bg); color: var(--text-primary); }
body { background-image: none; }
.page-noise { display: none; }

.sidebar,
body[data-theme="dark"] .sidebar {
    background: var(--surface);
    border-right-color: var(--border);
    box-shadow: none;
    backdrop-filter: none;
}
.topbar,
.topbar.scrolled,
body[data-theme="dark"] .topbar.scrolled {
    background: var(--bg);
    box-shadow: 0 1px 0 var(--border);
    backdrop-filter: none;
}

.brand-icon,
.student-avatar,
.empty-state-media,
.wizard-card i {
    background: var(--primary-soft);
    color: var(--primary-strong);
    box-shadow: none;
}
.brand-icon { border-radius: var(--radius-sm); }
.menu-item { border-radius: var(--radius-sm); }
.menu-item.active { background: var(--primary-soft); color: var(--primary-strong); box-shadow: inset 0 0 0 1px var(--border); }
.menu-item:hover { background: var(--surface-muted); color: var(--text-primary); transform: none; }
.sidebar-panel { border-radius: var(--radius-md); background: var(--surface-muted); box-shadow: none; }

.task-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px 28px;
    align-items: end;
    margin-top: 8px;
    padding: 22px 0 20px;
    border-bottom: 1px solid var(--border);
}
.task-copy { min-width: 0; }
.task-label,
.section-label {
    display: block;
    color: var(--primary-strong);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.task-copy h1 {
    max-width: 18ch;
    margin: 7px 0 8px;
    font-family: var(--font-display);
    font-size: clamp(2rem, 3vw, 3rem);
    font-style: normal;
    line-height: 1.02;
    letter-spacing: -0.04em;
    overflow-wrap: anywhere;
}
.task-copy p { max-width: 62ch; margin: 0; color: var(--text-secondary); line-height: 1.55; }
.task-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.task-actions .btn { white-space: nowrap; }
.class-meta {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-top: 1px solid var(--border);
    padding-top: 14px;
}
.class-meta-item { min-width: 0; padding: 0 18px; border-left: 1px solid var(--border); }
.class-meta-item:first-child { padding-left: 0; border-left: 0; }
.class-meta-item span,
.class-meta-item small { display: block; color: var(--text-muted); font-size: 0.8rem; }
.class-meta-item strong { display: block; margin: 3px 0; font-size: 1.05rem; overflow-wrap: anywhere; }

.kpi-grid { display: none; }
.workspace-grid { grid-template-columns: minmax(0, 1.55fr) minmax(260px, 0.7fr); gap: 28px; margin-top: 24px; }
.primary-stack,
.secondary-stack { gap: 24px; }
.card,
.modal-card,
.subject-student-panel,
.subject-overview,
.subject-row,
.subject-editor-row,
.wizard-card,
.branch-item,
.template-option,
.template-state-card,
.hero-insight-card,
.insight-stat { border-radius: var(--radius-md); box-shadow: none; backdrop-filter: none; }
.card { padding: 0; border: 0; background: transparent; }
.composer-card { padding-bottom: 24px; border-bottom: 1px solid var(--border); }
.roster-card { min-width: 0; }
.card-header { padding: 0 0 16px; border-bottom: 1px solid var(--border); }
.card-header h2,
.modal-header h2 { margin: 6px 0; font-size: 1.45rem; }
.card-header p,
.modal-header p { line-height: 1.5; }
.tabs { border-radius: var(--radius-sm); padding: 2px; background: var(--surface-muted); border: 1px solid var(--border); }
.tab-btn { border-radius: var(--radius-xs); min-height: 38px; padding-inline: 12px; }
.tab-btn.active { background: var(--primary); box-shadow: none; }

.form-group input,
.form-group select,
.subject-score-input,
.subject-max-input,
.update-fields input,
.search-shell,
.sort-control,
.template-search-shell,
.btn,
.close-modal,
.btn-action { border-radius: var(--radius-sm); }
.form-group input,
.form-group select,
.subject-score-input,
.subject-max-input,
.update-fields input { min-height: 48px; box-shadow: none; }
.form-group input:focus-visible,
.form-group select:focus-visible,
.subject-score-input:focus-visible,
.subject-max-input:focus-visible,
.update-fields input:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; box-shadow: none; }
.btn { min-height: 44px; }
.btn-primary { background: var(--primary); box-shadow: none; }
.btn-primary:hover,
.btn-secondary:hover,
.btn-outline:hover,
.close-modal:hover { transform: none; }
.btn:active,
.btn-action:active,
.tab-btn:active { transform: translateY(1px); }
.btn:disabled,
.btn-action:disabled,
.template-option:disabled { opacity: 0.55; cursor: not-allowed; }

.table-container { margin-top: 18px; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: auto; background: var(--surface); }
#students-table { font-variant-numeric: tabular-nums; }
#students-table thead th { background: var(--surface-muted); color: var(--text-secondary); letter-spacing: 0.08em; }
#students-table tbody tr:hover { background: var(--surface-muted); }
.student-cell { min-width: 200px; }
.student-avatar { width: 34px; height: 34px; border-radius: var(--radius-xs); }
.student-meta span { max-width: 28ch; }
.badge,
.subject-pill,
.template-summary-pill { border-radius: var(--radius-xs); }
.badge { padding: 5px 8px; }
.percentage-pill { min-width: 100px; }
.actions-cell { gap: 6px; }
.btn-action { width: 36px; height: 36px; }
.empty-state { padding: 28px; }
.empty-state-media { width: 48px; height: 48px; border-radius: var(--radius-sm); font-size: 1.1rem; }

.class-summary { padding-left: 22px; border-left: 1px solid var(--border); }
.section-heading { padding-bottom: 14px; border-bottom: 1px solid var(--border); }
.section-heading h2 { margin: 6px 0; font-size: 1.2rem; }
.section-heading p { margin: 0; color: var(--text-muted); line-height: 1.5; }
.summary-list { display: grid; gap: 0; }
.summary-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 3px 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.summary-row span { color: var(--text-muted); font-size: 0.82rem; }
.summary-row strong { text-align: right; overflow-wrap: anywhere; }
.summary-row small { grid-column: 1 / -1; color: var(--text-muted); }
.subject-overview { margin-top: 18px; padding: 14px 0 0; border: 0; border-top: 1px solid var(--border); background: transparent; }
.subject-pill { padding: 5px 7px; background: var(--surface-muted); }

.modal-overlay { background: rgba(32, 38, 34, 0.42); backdrop-filter: blur(4px); }
.modal-card { padding: 24px; background: var(--surface); border: 1px solid var(--border); }
.settings-section { border-radius: var(--radius-md); background: var(--surface-muted); }
.dropdown-menu { border-radius: var(--radius-md); box-shadow: var(--shadow-medium); }
.toast { border-radius: var(--radius-md); box-shadow: var(--shadow-medium); }

@media (max-width: 1120px) {
    .workspace-grid { grid-template-columns: 1fr; }
    .class-summary { padding: 20px 0 0; border-left: 0; border-top: 1px solid var(--border); }
}
@media (max-width: 760px) {
    .task-header { grid-template-columns: 1fr; align-items: start; }
    .task-actions { justify-content: flex-start; }
    .task-actions .btn { flex: 1 1 auto; }
    .class-meta { grid-template-columns: 1fr; gap: 12px; }
    .class-meta-item,
    .class-meta-item:first-child { padding: 0; border-left: 0; }
    .class-meta-item + .class-meta-item { padding-top: 12px; border-top: 1px solid var(--border); }
    .card-header { flex-direction: column; align-items: stretch; }
    .tabs { align-self: flex-start; }
    .table-container { border-inline: 0; border-radius: 0; }
    #students-table tbody tr { border-radius: var(--radius-md); box-shadow: none; }
}
@media (max-width: 560px) {
    .task-actions .btn { width: 100%; flex-basis: 100%; }
    .task-copy h1 { max-width: none; font-size: 2rem; }
    .composer-card { padding-bottom: 18px; }
}
@media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
'''
css.write_text(base + final, encoding="utf-8")

js = root / "js" / "app.js"
app = js.read_text(encoding="utf-8")
app = app.replace("function renderMetrics() {\n    dom.kpiTotal.textContent = String(students.length);", "function renderMetrics() {\n    if (!dom.kpiTotal || !dom.kpiPassed || !dom.kpiFailed || !dom.kpiAverage || !dom.kpiPassRate || !dom.kpiFailRate) return;\n    dom.kpiTotal.textContent = String(students.length);")
app = app.replace("function showToast(message, tone = 'success') {\n    dom.toastMessage.textContent = message;", "function showToast(message, tone = 'success') {\n    if (tone === 'success') return;\n    dom.toastMessage.textContent = message;")
app = app.replace("'Start your cohort',", "'No students yet',")
app = app.replace("'Add a student to start entering marks.',", "'Add a student above to start entering marks.',", 1)
js.write_text(app, encoding="utf-8")

print("Hallmark redesign applied to index.html, styles.css, and js/app.js")
