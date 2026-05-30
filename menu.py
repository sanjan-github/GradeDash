from __future__ import annotations

from pathlib import Path
import re

DATA_FILE = Path(__file__).with_name("students.txt")
PASS_MARK = 40
MIN_MARK = 0
MAX_MARK = 100


def normalize_name(value: str) -> str:
    return " ".join(value.strip().split())


def find_existing_name(students: dict[str, int], query: str) -> str | None:
    normalized_query = normalize_name(query).casefold()
    for name in students:
        if name.casefold() == normalized_query:
            return name
    return None


def prompt_integer(prompt: str, minimum: int | None = None, maximum: int | None = None) -> int:
    while True:
        raw_value = input(prompt).strip()
        try:
            value = int(raw_value)
        except ValueError:
            print("Enter a valid whole number.")
            continue

        if minimum is not None and value < minimum:
            print(f"Value must be at least {minimum}.")
            continue

        if maximum is not None and value > maximum:
            print(f"Value must be at most {maximum}.")
            continue

        return value


def prompt_name(prompt: str) -> str:
    while True:
        name = normalize_name(input(prompt))
        if name:
            return name
        print("Student name cannot be empty.")


def prompt_yes_no(prompt: str) -> bool:
    while True:
        answer = input(prompt).strip().lower()
        if answer in {"y", "yes"}:
            return True
        if answer in {"n", "no"}:
            return False
        print("Please answer with yes or no.")


def load_students() -> dict[str, int]:
    if not DATA_FILE.exists():
        return {}

    students: dict[str, int] = {}
    legacy_pattern = re.compile(r"^(?P<name>.+?)\s+gained\s+(?P<mark>\d+)\s+marks\s*$", re.IGNORECASE)

    for raw_line in DATA_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if "|" in line:
            raw_name, raw_mark = line.split("|", maxsplit=1)
            name = normalize_name(raw_name)
            try:
                mark = int(raw_mark)
            except ValueError:
                continue
        else:
            match = legacy_pattern.match(line)
            if not match:
                continue
            name = normalize_name(match.group("name"))
            mark = int(match.group("mark"))

        if not name:
            continue

        students[name] = max(MIN_MARK, min(MAX_MARK, mark))

    return students


def save_students(students: dict[str, int]) -> None:
    lines = [f"{name}|{students[name]}" for name in sorted(students, key=str.casefold)]
    DATA_FILE.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def display_students(students: dict[str, int]) -> None:
    if not students:
        print("No student data available.")
        return

    print("\nStudent Records")
    print("-" * 40)
    print(f"{'Name':<24} {'Marks':>5}  Status")
    print("-" * 40)

    for name in sorted(students, key=str.casefold):
        mark = students[name]
        status = "Pass" if mark >= PASS_MARK else "Fail"
        print(f"{name:<24} {mark:>5}  {status}")


def analyze_students(students: dict[str, int]) -> None:
    if not students:
        print("No student data available.")
        return

    total_students = len(students)
    passed_students = sum(1 for mark in students.values() if mark >= PASS_MARK)
    failed_students = total_students - passed_students
    average_mark = sum(students.values()) / total_students
    pass_rate = (passed_students / total_students) * 100

    print("\nClass Analysis")
    print("-" * 40)
    print(f"Total students : {total_students}")
    print(f"Passed        : {passed_students}")
    print(f"Failed        : {failed_students}")
    print(f"Average marks : {average_mark:.1f}")
    print(f"Pass rate     : {pass_rate:.1f}%")


def find_extremes(students: dict[str, int]) -> None:
    if not students:
        print("No student data available.")
        return

    top_mark = max(students.values())
    low_mark = min(students.values())
    toppers = [name for name, mark in students.items() if mark == top_mark]
    lowest = [name for name, mark in students.items() if mark == low_mark]

    print("\nPerformance Extremes")
    print("-" * 40)
    print(f"Top score    : {top_mark} ({', '.join(sorted(toppers, key=str.casefold))})")
    print(f"Lowest score : {low_mark} ({', '.join(sorted(lowest, key=str.casefold))})")


def add_students(students: dict[str, int]) -> None:
    count = prompt_integer("How many students do you want to add? ", minimum=1)

    for index in range(1, count + 1):
        print(f"\nStudent {index}")
        name = prompt_name("Enter student name: ")
        existing_name = find_existing_name(students, name)

        if existing_name and not prompt_yes_no(f"{existing_name} already exists. Replace the stored marks? (yes/no): "):
            print("Skipped.")
            continue

        mark = prompt_integer(f"Enter marks for {name} ({MIN_MARK}-{MAX_MARK}): ", minimum=MIN_MARK, maximum=MAX_MARK)
        students[existing_name or name] = mark
        print(f"Saved {name} with {mark} marks.")


def update_student(students: dict[str, int]) -> None:
    if not students:
        print("No student data available.")
        return

    name = prompt_name("Which student should be updated? ")
    existing_name = find_existing_name(students, name)

    if not existing_name:
        print("Student not found.")
        return

    new_mark = prompt_integer(
        f"Enter the latest marks for {existing_name} ({MIN_MARK}-{MAX_MARK}): ",
        minimum=MIN_MARK,
        maximum=MAX_MARK,
    )
    students[existing_name] = new_mark
    print(f"Updated {existing_name} successfully.")


def delete_student(students: dict[str, int]) -> None:
    if not students:
        print("No student data available.")
        return

    name = prompt_name("Enter the student name to delete: ")
    existing_name = find_existing_name(students, name)

    if not existing_name:
        print("Student not found.")
        return

    if not prompt_yes_no(f"Delete {existing_name}? (yes/no): "):
        print("Deletion cancelled.")
        return

    students.pop(existing_name)
    print(f"Deleted {existing_name}.")


def search_students(students: dict[str, int]) -> None:
    if not students:
        print("No student data available.")
        return

    query = normalize_name(input("Enter a name or partial name to search: "))
    if not query:
        print("Search query cannot be empty.")
        return

    matches = [
        (name, mark)
        for name, mark in sorted(students.items(), key=lambda item: item[0].casefold())
        if query.casefold() in name.casefold()
    ]

    if not matches:
        print("No students matched that search.")
        return

    print("\nSearch Results")
    print("-" * 40)
    for name, mark in matches:
        status = "Pass" if mark >= PASS_MARK else "Fail"
        print(f"{name:<24} {mark:>5}  {status}")


def show_menu() -> None:
    print("\nStudent Marks Manager")
    print("-" * 40)
    print("1. Add students")
    print("2. Display students")
    print("3. Analyze results")
    print("4. Find extremes")
    print("5. Update student marks")
    print("6. Delete student")
    print("7. Search students")
    print("8. Exit")


def main() -> None:
    students = load_students()
    print(f"Loaded {len(students)} student record{'s' if len(students) != 1 else ''} from {DATA_FILE.name}.")

    actions = {
        1: add_students,
        2: display_students,
        3: analyze_students,
        4: find_extremes,
        5: update_student,
        6: delete_student,
        7: search_students,
    }

    while True:
        show_menu()
        choice = prompt_integer("Enter your choice: ", minimum=1, maximum=8)

        if choice == 8:
            save_students(students)
            print(f"Saved {len(students)} student record{'s' if len(students) != 1 else ''} to {DATA_FILE.name}.")
            return

        actions[choice](students)


if __name__ == "__main__":
    main()
