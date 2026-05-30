# GradeDash

GradeDash is a polished student marks workspace with two complementary tools:

1. A browser-based dashboard for building a roster, managing subjects, applying board templates, and exporting reports.
2. A Python CLI for quick mark entry and analysis from the terminal.

## Web dashboard

Open `index.html` in a browser to use the dashboard.

### Highlights

- Premium responsive layout with desktop and mobile support
- Student-first and subject-first score entry flows
- Dynamic subject management with per-subject maximum marks
- Qualification rules based on minimum marks or minimum percentage
- Search, sorting, empty-state guidance, and leaderboard insights
- Board-template library for 10th, intermediate, and engineering structures
- Export to PDF, Excel, and Word
- Theme toggle with saved preference
- Local persistence with `localStorage`

## Python CLI

Run the terminal tool with:

```powershell
python menu.py
```

### CLI capabilities

- Load existing records from `students.txt`
- Add, update, delete, and search students
- View pass/fail status, class averages, and top/lowest scores
- Save data back to `students.txt` on exit

The CLI stores records in a simple `name|mark` text format and also understands the older `name gained 90 marks` lines for backward compatibility.

## Project files

- `index.html` - application structure and modal markup
- `styles.css` - visual system, responsive layout, theming, and component styles
- `js/state.js` - storage normalization and initial state hydration
- `js/app.js` - dashboard logic, rendering, validation, modals, and export flows
- `js/data/templates.js` - board and semester template catalog
- `menu.py` - terminal-based student marks manager
- `students.txt` - CLI data file

## Notes

- The web dashboard and the Python CLI do not share the same storage layer.
- Browser data stays in `localStorage` until the user clears it.
- Export features rely on the external client-side libraries loaded in `index.html`.
