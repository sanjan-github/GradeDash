# GradeDash

A student marks management tool. Includes a web dashboard (HTML/CSS/JS) and a Python CLI script.

## Author

The `menu.py` script is my own original code. The web application was developed by vibe coding.

## Web Dashboard

Runs locally in your browser. Saves data in the browser's local storage.

### Core Features

- **Manage Subjects:** Add or remove subjects (e.g., Math, Science) in the Settings menu.
- **Add Marks:**
  - **By Student:** Enter a student's name and input marks for all declared subjects.
  - **By Subject:** Select a subject from a dropdown, view all students, and input marks for that specific subject.
- **Manage Students:** Edit existing marks or delete students from the main table.
- **Search & Sort:** Find students by name. Sort the table by newest, oldest, total marks (high/low), or name (A-Z, Z-A).
- **Live Metrics:** Displays total students, total passed, total failed, and class average.
- **Leaderboard:** Shows the top 3 students based on total marks.
- **Settings:** 
  - Manage the subject list.
  - Set total maximum marks per subject.
  - Set passing rules (require a minimum total mark or a minimum overall percentage).
- **Export Data:** Download the table as PDF, Excel (.xlsx), or Word (.docx). Exports dynamically include all subject columns.
- **Theme:** Toggle between light and dark modes. Features a custom black-to-green gradient UI.

### How to Run

1. Open `index.html` in your web browser.
2. (Optional) Run a local server: `python -m http.server 8000`, then open `http://localhost:8000`.

## Python CLI

A terminal-based manager in `menu.py`.

### Features

- Add student names and single marks.
- Display all students.
- Count passes and fails (pass mark is 40).
- Find the highest and lowest scorers.
- Update or delete records.
- Search by student name.
- Saves final results to `students.txt` on exit.

### How to Run

```powershell
python menu.py
```

## Storage Notes

- **Web App:** Data is saved in the browser (`localStorage`). Clearing browser data deletes the records.
- **CLI:** Data is kept in memory and writes to `students.txt` on exit.
- **Isolation:** Data is not shared between the Web App and the CLI.

