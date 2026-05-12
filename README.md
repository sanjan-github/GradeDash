# GradeDash

A modern student marks management dashboard built with HTML, CSS, and JavaScript, with an additional Python CLI version included for simple terminal-based workflows.

GradeDash helps you add, search, sort, update, analyze, and export student performance data through a clean dashboard experience. The web app is designed for fast local use and stores data directly in the browser, while the Python script offers a lightweight command-line alternative.

## Highlights

- Clean dashboard interface for managing student records
- Quick-add student workflow directly on the main screen
- Search and sorting controls for faster browsing
- Configurable qualifying rules by minimum marks or percentage
- Live summary cards for total students, pass count, fail count, and class average
- Top 3 leaderboard / podium view for highest scorers
- Light and dark theme toggle
- Export support for PDF, Excel, and Word documents
- Responsive mobile layout for smaller screens
- Legacy Python CLI version for terminal-based usage

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Font Awesome
- `html2pdf.js`
- SheetJS (`xlsx`)
- `docx`
- Python 3 for the CLI script

## Project Structure

```text
student_marks/
|-- index.html      # Main web dashboard markup
|-- styles.css      # Dashboard styling and responsive UI rules
|-- app.js          # Client-side logic, storage, rendering, and exports
|-- menu.py         # Python CLI version of the student marks manager
|-- students.txt    # Output file written by the CLI script
```

## Features

### Web Dashboard

- Add new students with marks from the quick-entry form
- Edit or delete existing student records
- Search students instantly by name
- Sort records by:
  - newest first
  - oldest first
  - marks high to low
  - marks low to high
  - name A-Z
  - name Z-A
- View calculated percentage values
- Track pass/fail results based on configurable evaluation settings
- See a live podium for the top 3 students
- Export filtered/sorted data to:
  - PDF
  - Excel (`.xlsx`)
  - Word (`.docx`)

### Evaluation Settings

The dashboard includes a settings panel where you can configure:

- Total maximum marks
- Qualification type:
  - by minimum marks
  - by minimum percentage
- Qualification threshold value

### Data Storage

The web app stores data locally in the browser using `localStorage`.

That means:

- Your student list stays available after refreshing the page
- Data is stored only in the current browser on the current device
- Clearing browser storage will remove saved records

## Getting Started

### Option 1: Open Directly

You can open the dashboard by launching [index.html](./index.html) in your browser.

### Option 2: Run with a Local Server

Using a local server is recommended for a cleaner development workflow.

If Python is installed:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Web App Usage

1. Open the dashboard in your browser.
2. Add a student name and marks.
3. Use the search bar to find specific students.
4. Use the sort dropdown to reorder the roster.
5. Open Settings to adjust total marks and qualification rules.
6. Use the export menu to download reports in your preferred format.

## Export Notes

The export features rely on CDN-hosted libraries loaded in the browser:

- `html2pdf.js`
- `xlsx`
- `docx`

If you are offline, the export buttons may not work until those libraries are available.

## Python CLI Version

This project also includes a basic terminal version in [menu.py](./menu.py).

### What the CLI Supports

- Add student records
- Display all students
- Count pass/fail totals
- Find highest and lowest marks
- Update student marks
- Delete student records
- Search by student name
- Save final output to `students.txt`

### Run the CLI

```powershell
python menu.py
```

### CLI Behavior

- The script stores records in memory while running
- When you exit, it writes the final results to [students.txt](./students.txt)

## Development Notes

- The web dashboard is fully client-side and does not require a backend
- Student data is not shared between the web app and the Python CLI
- The project currently focuses on local-first usage rather than multi-user or cloud sync

## Future Improvements

- Import students from CSV or Excel
- Persistent database or cloud storage
- Authentication and multi-user support
- Charts for performance trends
- Subject-wise marks breakdown
- Better validation and duplicate-name handling

## Publishing to GitHub

Once your repository is connected to GitHub, you can push it with:

```powershell
git add .
git commit -m "Add professional README"
git push
```

## Author

Created as a student marks management project with both web and CLI workflows.

## License

No license has been specified yet. Add a license file if you want to define reuse permissions.
