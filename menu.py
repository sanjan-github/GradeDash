students = {}
def get_student_count():
    while True:
        try:
            s=int(input("Enter number of students :"))
            return s
        except ValueError:
            print("Enter a valid number")
def student_input(students, n):
    i=1
    while i<=n:
        try:
            name=input(f"Enter name of the student {i} :")
            mark=int(input(f"Enter marks of {name} :"))
            students[name]=mark
            i+=1
        except ValueError:
            print("Please enter a valid input")
    return students

def display_students(students):
    if not students:
        print("No student data available")
        return
    for name,mark in students.items():
        print(f"{name}-{mark} marks")
    
def passed(students):
    passed=0
    failed=0 
    for mark in students.values():
        if mark >=40:
            passed +=1
        else:
            failed +=1
    print(f"Passed :{passed},Failed :{failed}")

def find_extremes(students):
    
    if not students:
        print("No student data available")
        return
    
    name,mark = next(iter(students.items()))
    max_mark = min_mark = mark
    max_name = min_name = name
    
    for name, mark in students.items():
         if mark > max_mark:
            max_mark = mark
            max_name = name
         if mark < min_mark:
              min_mark = mark
              min_name = name
    print(f"Topper :{max_name} with {max_mark} marks")
    print(f"Lowest :{min_name} with {min_mark} marks")

def add_students(students):
    n=get_student_count()
    student_input(students,n)

def update(students):
    no_of_updates=int(input("How many number of student marks should be updated? :"))
    k=1
    while k<=no_of_updates:
        stu=input("Which student marks should be updated :")
        
        if stu in students:
            try:
                new_mark=int(input(f"Enter latest marks of the {stu} :"))
                students[stu]=new_mark
                print("Student data updated succefully")
            except ValueError:
                print("Enter a valid number")
        else:
            print("Student not found")
        k+=1

def delete_student(students):
    name=input("Enter a name to delete :")

    if name in students:
        students.pop(name)
        print("student deleted")
    else:
        print("Student not found")


def search(students):
        x=input("Enter student name to search :")

        if x in students:
            print(f"{x} - {students[x]}")
        else:
            print("Student not found")
    

while True:

    print("\n 1. Add students \n 2. Display students \n 3. Analyze \n 4. Find extremes \n 5. Update student information \n 6. Delete student \n 7. Search student \n 8. Exit")
    
    try:
        choice = int(input("Enter choice :"))

        if choice == 1:
            add_students(students)
        elif choice == 2:
            display_students(students)
        elif choice == 3:
            passed(students)
        elif choice  == 4:
            find_extremes(students)
        elif choice == 8:
            break
        elif choice == 5:
            update(students)
        elif choice == 6:
            delete_student(students)
        elif choice == 7:
            search(students)
        
    except ValueError:
        print("Enter valid number")

with open("students.txt", "w") as file:
    for name, mark in students.items():
        file.write(f"{name} gained {mark} marks \n")
print("Your file saved succesfully")