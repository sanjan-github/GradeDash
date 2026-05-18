# Student Marks Manager

This project is a simple student marks manager with two parts:

1. A web dashboard using `index.html`, `styles.css`, and `app.js`.
2. A Python command-line tool in `menu.py`.

## What it does

- The web dashboard lets you add students, enter marks, and see summary data.
- The dashboard can show total students, passed/failed count, average score, and top students.
- The dashboard lets you search students and sort the list.
- It can export data to PDF, Excel, or Word files.
- The Python tool lets you add student names and marks from the terminal.
- The Python tool can show all records, count passed/failed students, find top and lowest scores, update marks, delete students, and search by name.

## Files in this project

- `index.html` — the main web page for the browser dashboard.
- `styles.css` — the dashboard design and layout.
- `app.js` — the JavaScript logic for the web dashboard.
- `menu.py` — the Python CLI script for terminal-based student mark management.
- `students.txt` — a text file sample how the Python tool saves results on exit.

## How to use the web dashboard

1. Open `index.html` in your web browser.
2. Use the dashboard menus to add subjects, students, and marks.
3. You can save or export the data using the export buttons.
4. The dashboard data is stored in your browser and stays there until you clear it.

## How to use the Python CLI

1. Open a terminal in this project folder.
2. Run:

```powershell
python menu.py
```

3. Follow the menu choices to add students, display records, analyze results, update marks, delete students, or search.
4. When you exit, the data is saved to `students.txt`.

## Notes

- The web app stores data in browser local storage.
- The Python tool stores data in memory while it runs and writes it to `students.txt` when it exits.
- The web app and the Python CLI do not share the same student data.

