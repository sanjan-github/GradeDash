// --- STATE MANAGEMENT ---
// Default Settings
let settings = JSON.parse(localStorage.getItem('gradeDashSettings')) || {
    subjectMaxMarks: { 'Math': 100, 'Science': 100, 'English': 100 },
    qualifyType: 'percentage', // 'marks' or 'percentage'
    qualifyValue: 40,
    subjects: ['Math', 'Science', 'English']
};

if (settings.totalMarks !== undefined) {
    settings.subjectMaxMarks = {};
    settings.subjects.forEach(sub => settings.subjectMaxMarks[sub] = settings.totalMarks);
    delete settings.totalMarks;
}

let rawStudents = JSON.parse(localStorage.getItem('studentsData')) || [];
let students = [];

// Migration logic
if (rawStudents.length > 0 && typeof rawStudents[0].mark !== 'undefined') {
    students = rawStudents.map(s => {
        let marks = {};
        settings.subjects.forEach(sub => marks[sub] = 0);
        if (settings.subjects.length > 0) marks[settings.subjects[0]] = s.mark;
        return { id: s.id, name: s.name, marks };
    });
    localStorage.setItem('studentsData', JSON.stringify(students));
} else {
    students = rawStudents;
}

let currentSort = 'entry-desc';
let activeTemplateFilter = 'all';
let templateSearchQuery = '';
let templateStep = 'level';
let selectedLevel = null;
let selectedBranch = null;

// --- TEMPLATE HELPERS ---
const THEORY_80_INTERNAL_20 = [['Theory', 80], ['Internal', 20]];
const THEORY_70_PRACTICAL_30 = [['Theory', 70], ['Practical', 30]];
const THEORY_60_PRACTICAL_40 = [['Theory', 60], ['Practical', 40]];
const THEORY_70_PRACTICAL_25_INTERNAL_5 = [['Theory', 70], ['Practical', 25], ['Internal', 5]];
const THEORY_56_PRACTICAL_14_INTERNAL_30 = [['Theory', 56], ['Practical', 14], ['Internal', 30]];
const THEORY_75_INTERNAL_25 = [['Theory', 75], ['Internal', 25]];
const THEORY_70_INTERNAL_30 = [['Theory', 70], ['Internal', 30]];
const THEORY_70_PRACTICAL_20_INTERNAL_10 = [['Theory', 70], ['Practical', 20], ['Internal', 10]];
const FULL_100 = 100;

const TEMPLATE_GROUPS = {
    secondary: { title: '10th', description: 'Start here for class 10 board templates.' },
    intermediate: { title: 'Intermediate', description: 'Pick a state first, then choose the stream you want.' },
    engineering: { title: 'Engineering', description: 'Pick your branch, then select a semester.' }
};

const TEMPLATE_FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'secondary', label: '10th' },
    { id: 'intermediate', label: 'Intermediate' }
];

const TEMPLATE_REGION_ORDER = [
    'National',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal'
];

const subjectItem = (name, max) => ({ name, max });
const subjectParts = (name, parts) => parts.map(([label, max]) => ({ name: `${name} (${label})`, max }));
const flattenSubjects = (...groups) => groups.flat();

function buildSubject(name, pattern) {
    return typeof pattern === 'number' ? [subjectItem(name, pattern)] : subjectParts(name, pattern);
}

function getFormulaLabel(pattern) {
    return typeof pattern === 'number' ? String(pattern) : pattern.map(([, max]) => max).join('+');
}

function buildTemplateSignature(subjects) {
    return subjects.map(subject => `${subject.name}:${subject.max}`).join('|');
}

function createTemplate(config) {
    const totalMarks = config.subjects.reduce((sum, subject) => sum + subject.max, 0);
    const searchParts = [
        config.board,
        config.region,
        config.title,
        config.level,
        config.stream,
        config.description,
        ...(config.formulas || []),
        ...(config.tags || [])
    ].filter(Boolean);

    return {
        ...config,
        totalMarks,
        signature: buildTemplateSignature(config.subjects),
        searchText: searchParts.join(' ').toLowerCase()
    };
}

function createClass10Template(config) {
    return createTemplate({
        group: 'secondary',
        level: '10th Grade',
        stream: 'General',
        streamKey: 'general',
        ...config
    });
}

function createSeniorTemplate(config) {
    return createTemplate({
        group: 'intermediate',
        level: '11th / 12th',
        ...config
    });
}

function buildSecondarySubjects({
    primaryLanguage = 'English',
    primaryLanguagePattern = THEORY_80_INTERNAL_20,
    secondLanguage = 'Hindi / Regional Language',
    secondLanguagePattern = THEORY_80_INTERNAL_20,
    mathPattern = THEORY_80_INTERNAL_20,
    scienceName = 'Science',
    sciencePattern = THEORY_70_PRACTICAL_30,
    socialName = 'Social Science',
    socialPattern = THEORY_80_INTERNAL_20,
    electiveName = 'Computer Applications',
    electivePattern = FULL_100
}) {
    return flattenSubjects(
        buildSubject(primaryLanguage, primaryLanguagePattern),
        buildSubject(secondLanguage, secondLanguagePattern),
        buildSubject('Mathematics', mathPattern),
        buildSubject(scienceName, sciencePattern),
        buildSubject(socialName, socialPattern),
        buildSubject(electiveName, electivePattern)
    );
}

function buildScienceSubjects({
    languagePattern = THEORY_80_INTERNAL_20,
    languageName = 'English',
    mathPattern = THEORY_80_INTERNAL_20,
    physicsPattern = THEORY_70_PRACTICAL_30,
    chemistryPattern = THEORY_70_PRACTICAL_30,
    fifthSubjectName = 'Biology',
    fifthSubjectPattern = THEORY_70_PRACTICAL_30
}) {
    return flattenSubjects(
        buildSubject(languageName, languagePattern),
        buildSubject('Mathematics', mathPattern),
        buildSubject('Physics', physicsPattern),
        buildSubject('Chemistry', chemistryPattern),
        buildSubject(fifthSubjectName, fifthSubjectPattern)
    );
}

function buildCommerceSubjects({
    languagePattern = THEORY_80_INTERNAL_20,
    languageName = 'English',
    accountancyPattern = THEORY_80_INTERNAL_20,
    businessPattern = THEORY_80_INTERNAL_20,
    economicsPattern = THEORY_80_INTERNAL_20,
    fifthSubjectName = 'Computer Applications',
    fifthSubjectPattern = THEORY_80_INTERNAL_20
}) {
    return flattenSubjects(
        buildSubject(languageName, languagePattern),
        buildSubject('Accountancy', accountancyPattern),
        buildSubject('Business Studies', businessPattern),
        buildSubject('Economics', economicsPattern),
        buildSubject(fifthSubjectName, fifthSubjectPattern)
    );
}

function buildHumanitiesSubjects({
    languagePattern = THEORY_80_INTERNAL_20,
    languageName = 'English',
    historyPattern = THEORY_80_INTERNAL_20,
    politicalSciencePattern = THEORY_80_INTERNAL_20,
    economicsPattern = THEORY_80_INTERNAL_20,
    fifthSubjectName = 'Geography',
    fifthSubjectPattern = THEORY_80_INTERNAL_20
}) {
    return flattenSubjects(
        buildSubject(languageName, languagePattern),
        buildSubject('History', historyPattern),
        buildSubject('Political Science', politicalSciencePattern),
        buildSubject('Economics', economicsPattern),
        buildSubject(fifthSubjectName, fifthSubjectPattern)
    );
}


const engineeringData = [
  {
    "name": "CSE – Computer Science and Engineering",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Programming for Problem Solving",
        "Basic Electrical Engineering",
        "Engineering Drawing and Computer Aided Drafting",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "Basic Electrical Engineering Lab",
        "Python Programming Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "Data Structures",
        "Electronic Devices and Circuits",
        "English for Skill Enhancement",
        "Engineering Chemistry Lab",
        "Data Structures Lab",
        "English Language and Communication Skills Lab",
        "Engineering Workshop",
        "IT Workshop"
      ],
      "3": [
        "Mathematical and Statistical Foundations",
        "Computer Organization",
        "Java Programming",
        "Software Engineering",
        "Database Management Systems",
        "Computational Mathematics Lab",
        "Java Programming Lab",
        "Software Engineering Lab",
        "Database Management Systems Lab",
        "Data Visualization-R Programming/Power BI/Tableau/Google Chart"
      ],
      "4": [
        "Discrete Mathematics",
        "Operating Systems",
        "Algorithms Design and Analysis",
        "Computer Networks",
        "Innovation and Entrepreneurship",
        "Operating Systems Lab",
        "Computer Networks Lab",
        "Algorithms Design and Analysis Lab",
        "Node JS/React JS/Django – UI Design – Flutter",
        "Indian Knowledge System"
      ],
      "5": [
        "Compiler Design",
        "Computer Networks",
        "Software Quality & Reliability",
        "Professional Elective-I",
        "Open Elective-I",
        "Compiler Design Lab",
        "Computer Networks Lab",
        "Software Quality & Reliability Lab",
        "Field Based Project/Internship",
        "Full Stack Development",
        "Gender Sensitization / Human Values and Professional Ethics"
      ],
      "6": [
        "Internet of Things",
        "Machine Learning and Data Mining",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Internet of Things Lab",
        "Machine Learning Lab",
        "DevOps Lab",
        "English for Employability Skills Lab",
        "Big Data – Spark",
        "Environmental Science"
      ],
      "7": [
        "Cyber Security and Cryptography",
        "Blockchain Technology and Applications",
        "Fundamentals of Management for Engineers",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Cyber Security and Cryptography Lab",
        "Blockchain Technology Lab",
        "Industry Oriented Mini Project/Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "CSM – CSE (Artificial Intelligence & Machine Learning)",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Programming for Problem Solving",
        "Basic Electrical Engineering",
        "Engineering Drawing and Computer Aided Drafting",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "Basic Electrical Engineering Lab",
        "Python Programming Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "Data Structures",
        "Electronic Devices and Circuits",
        "English for Skill Enhancement",
        "Engineering Chemistry Lab",
        "Data Structures Lab",
        "English Language and Communication Skills Lab",
        "Engineering Workshop",
        "IT Workshop"
      ],
      "3": [
        "Mathematical and Statistical Foundations",
        "Computer Organization",
        "Java Programming",
        "Software Engineering",
        "Database Management Systems",
        "Computational Mathematics Lab",
        "Java Programming Lab",
        "Software Engineering Lab",
        "Database Management Systems Lab",
        "Data Visualization-R Programming/Power BI/Tableau/Google Chart"
      ],
      "4": [
        "Discrete Mathematics",
        "Operating Systems",
        "Algorithms Design and Analysis",
        "Computer Networks",
        "Machine Learning",
        "Innovation and Entrepreneurship",
        "Operating Systems Lab",
        "Computer Networks Lab",
        "Machine Learning Lab",
        "Data Visualization-R Programming/Power BI/Power BI Lab",
        "Indian Knowledge System"
      ],
      "5": [
        "Compiler Design",
        "Computer Networks",
        "Software Quality & Reliability",
        "Professional Elective-I",
        "Open Elective-I",
        "Compiler Design Lab",
        "Computer Networks Lab",
        "Software Quality & Reliability Lab",
        "Field Based Project/Internship",
        "Full Stack Development",
        "Gender Sensitization / Human Values and Professional Ethics"
      ],
      "6": [
        "Internet of Things",
        "Machine Learning and Data Mining",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Internet of Things Lab",
        "Machine Learning Lab",
        "DevOps Lab",
        "English for Employability Skills Lab",
        "Big Data – Spark",
        "Environmental Science"
      ],
      "7": [
        "Cyber Security and Cryptography",
        "Blockchain Technology and Applications",
        "Fundamentals of Management for Engineers",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Cyber Security and Cryptography Lab",
        "Blockchain Technology Lab",
        "Industry Oriented Mini Project/Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "CSD – CSE (Data Science)",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Programming for Problem Solving",
        "Basic Electrical Engineering",
        "Engineering Drawing and Computer Aided Drafting",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "Basic Electrical Engineering Lab",
        "Python Programming Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "Data Structures",
        "Electronic Devices and Circuits",
        "English for Skill Enhancement",
        "Engineering Chemistry Lab",
        "Data Structures Lab",
        "English Language and Communication Skills Lab",
        "Engineering Workshop",
        "IT Workshop"
      ],
      "3": [
        "Mathematical and Statistical Foundations",
        "Computer Organization",
        "Java Programming",
        "Software Engineering",
        "Database Management Systems",
        "Computational Mathematics Lab",
        "Java Programming Lab",
        "Software Engineering Lab",
        "Database Management Systems Lab",
        "Data Visualization-R Programming/Power BI/Tableau/Google Chart"
      ],
      "4": [
        "Discrete Mathematics",
        "Operating Systems",
        "SQL and NoSQL for Data Science",
        "Computer Networks",
        "Machine Learning with Data Science",
        "Innovation and Entrepreneurship",
        "Operating Systems Lab",
        "Computer Networks Lab",
        "Machine Learning Lab",
        "Node JS/React JS/Django – UI Design – Flutter",
        "Indian Knowledge System"
      ],
      "5": [
        "Compiler Design",
        "Computer Networks",
        "Internet of Things and Applications",
        "Professional Elective-I",
        "Open Elective-I",
        "Compiler Design Lab",
        "Computer Networks Lab",
        "IoT and Applications Lab",
        "Field Based Project/Internship",
        "UI design – Flutter",
        "Gender Sensitization / Human Values and Professional Ethics"
      ],
      "6": [
        "Information Security Essentials",
        "Scripting Languages",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Information Security Essentials Lab",
        "Scripting Languages Lab",
        "DevOps Lab",
        "English for Employability Skills Lab",
        "Prompt Engineering",
        "Environmental Science"
      ],
      "7": [
        "Advanced Artificial Intelligence",
        "Cloud Computing and Internet of Things",
        "Fundamentals of Management for Engineers",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Advanced AI Lab",
        "Cloud Computing Lab",
        "Industry Oriented Mini Project/Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "CSO – CSE (Internet of Things)",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Programming for Problem Solving",
        "Basic Electrical Engineering",
        "Engineering Drawing and Computer Aided Drafting",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "Basic Electrical Engineering Lab",
        "Python Programming Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "Data Structures",
        "Electronic Devices and Circuits",
        "English for Skill Enhancement",
        "Engineering Chemistry Lab",
        "Data Structures Lab",
        "English Language and Communication Skills Lab",
        "Engineering Workshop",
        "IT Workshop"
      ],
      "3": [
        "Computer Organization",
        "Data Science Fundamentals",
        "Digital Systems Design",
        "Computer Networks",
        "Database Management Systems",
        "Computational Mathematics Lab",
        "Data Science Fundamentals Lab",
        "Digital Systems Design Lab",
        "Computer Networks Lab",
        "Node JS/React JS/Django – UI Design – Flutter"
      ],
      "4": [
        "Discrete Mathematics",
        "Operating Systems",
        "Algorithms Design and Analysis",
        "Computer Networks",
        "Machine Learning",
        "Innovation and Entrepreneurship",
        "Operating Systems Lab",
        "Computer Networks Lab",
        "Machine Learning Lab",
        "Prompt Engineering",
        "Indian Knowledge System"
      ],
      "5": [
        "Compiler Design",
        "Information Security",
        "Embedded Systems",
        "Professional Elective-I",
        "Open Elective-I",
        "Compiler Design Lab",
        "Information Security Lab",
        "Embedded Systems Lab",
        "Field Based Project/Internship",
        "Full Stack Development",
        "Gender Sensitization / Human Values and Professional Ethics"
      ],
      "6": [
        "Cyber Physical Systems",
        "Wireless Sensor Networks",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Cyber Physical Systems Lab",
        "Wireless Sensor Networks Lab",
        "AI and ML for IoT Lab",
        "English for Employability Skills Lab",
        "Ethical Hacking",
        "Environmental Science"
      ],
      "7": [
        "Internet of Things Applications",
        "Cloud Computing and Big Data Analytics",
        "Fundamentals of Management for Engineers",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "IoT Applications Lab",
        "Cloud Computing Lab",
        "Industry Oriented Mini Project/Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "CSN – CSE (Networks)",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Engineering Drawing and Computer Aided Drafting",
        "Basic Electrical Engineering",
        "Programming for Problem Solving",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "Python Programming Lab",
        "Basic Electrical Engineering Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "English for Skill Enhancement",
        "Electronic Devices and Circuits",
        "Data Structures",
        "Engineering Chemistry Lab",
        "Data Structures Lab",
        "English Language and Communication Skills Lab",
        "Engineering Workshop",
        "IT Workshop"
      ],
      "3": [
        "Probability and Statistical Foundations",
        "Database Management Systems",
        "Software Engineering",
        "Computer Organization",
        "Java Programming",
        "Computational Mathematics Laboratory",
        "Software Engineering Laboratory",
        "Java Programming Laboratory",
        "Database Management Systems Laboratory",
        "Data Visualization – R Programming/Power BI/Tableau/Google Chart"
      ],
      "4": [
        "Discrete Mathematics",
        "Web Programming",
        "Operating Systems",
        "Automata Theory and Compiler Design",
        "Data Communications",
        "Innovation and Entrepreneurship",
        "Web Programming Laboratory",
        "Operating Systems Laboratory",
        "Linux Programming Laboratory",
        "Node JS/React JS/Django – UI Design – Flutter",
        "Indian Knowledge System"
      ],
      "5": [
        "Network Programming",
        "Computer Networks",
        "Algorithms Design and Analysis",
        "Professional Elective-I",
        "Open Elective-I",
        "Network Programming Laboratory",
        "Algorithms Design and Analysis Laboratory",
        "Computer Networks Laboratory",
        "Field Based Project/Internship",
        "Full Stack Development",
        "Gender Sensitization & Human Values and Professional Ethics"
      ],
      "6": [
        "Cryptography and Network Security",
        "Internet of Things",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Cryptography and Network Security Laboratory",
        "Internet of Things Laboratory",
        "Development and Operations (DevOps) Laboratory",
        "English for Employability Skills Lab",
        "Drone Technology Lab",
        "Environmental Sciences"
      ],
      "7": [
        "Blockchain Technology",
        "Cloud Computing",
        "Fundamentals of Management",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Blockchain Technology Laboratory",
        "Cloud Computing Laboratory",
        "Industry Oriented Mini Project/Summer Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "CSC – CSE (Cyber Security)",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Programming for Problem Solving",
        "Basic Electrical Engineering",
        "Engineering Drawing and Computer Aided Drafting",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "Basic Electrical Engineering Lab",
        "Python Programming Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "Data Structures",
        "Electronic Devices and Circuits",
        "English for Skill Enhancement",
        "Engineering Chemistry Lab",
        "Data Structures Lab",
        "English Language and Communication Skills Lab",
        "Engineering Workshop",
        "IT Workshop"
      ],
      "3": [
        "Mathematical and Statistical Foundations",
        "Computer Organization",
        "Java Programming",
        "Software Engineering",
        "Database Management System",
        "Computational Mathematics Lab",
        "Java Programming Lab",
        "Software Engineering Lab",
        "Database Management Systems Lab",
        "Data Visualization-R Programming/Power BI/Tableau/Google Chart"
      ],
      "4": [
        "Discrete Mathematics",
        "Operating Systems",
        "Formal Languages and Automata Theory",
        "Computer Networks",
        "Mathematical Foundations of Cryptography",
        "Innovation and Entrepreneurship",
        "Operating Systems Lab",
        "Computer Networks Lab",
        "Mathematical Foundations of Cryptography Lab",
        "Node JS/React JS/Django – UI Design – Flutter",
        "Indian Knowledge System"
      ],
      "5": [
        "Information Security",
        "Network Management Systems and Operations",
        "Algorithm Design and Analysis",
        "Professional Elective-I",
        "Open Elective-I",
        "Information Security Laboratory",
        "Network Management Systems and Operations Lab",
        "Algorithm Design and Analysis Lab",
        "Field Based Research Project",
        "Full Stack Development",
        "Gender Sensitization/Human Values and Professional Ethics"
      ],
      "6": [
        "Cyber Security Essentials",
        "Secure Coding Practices",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Cyber Security Essentials Lab",
        "Secure Coding Practices Lab",
        "Development and Operations (DevOps) Lab",
        "English for Employability Skills Lab",
        "Big Data – Spark",
        "Environmental Science"
      ],
      "7": [
        "Vulnerability Assessment & Penetration Testing",
        "Cyber Crime Investigation & Digital Forensics",
        "Fundamentals of Management",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Vulnerability Assessment & Penetration Testing Lab",
        "Cyber Crime Investigation & Digital Forensics Lab",
        "Industry Oriented Mini Project/Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "CSB – Computer Science and Business Systems (CSBS)",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Programming for Problem Solving",
        "Basic Electrical Engineering",
        "Engineering Drawing and Computer Aided Drafting",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "Basic Electrical Engineering Lab",
        "Python Programming Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "Data Structures",
        "Electronic Devices and Circuits",
        "English for Skill Enhancement",
        "Engineering Chemistry Lab",
        "Data Structures Lab",
        "English Language and Communication Skills Lab",
        "Engineering Workshop",
        "IT Workshop"
      ],
      "3": [
        "Mathematical and Statistical Foundations",
        "Computer Organization",
        "Business Statistics Using R",
        "Algorithms Design and Analysis",
        "Database Management Systems",
        "Computational Mathematics Lab",
        "Business Statistics Using R Lab",
        "Algorithms Design and Analysis Lab",
        "Database Management Systems Lab",
        "Data Visualization-R Programming/Power BI/Tableau/Google Chart"
      ],
      "4": [
        "Discrete Mathematics",
        "Operating Systems",
        "Artificial Intelligence",
        "Software Engineering",
        "Computer Networks",
        "Innovation and Entrepreneurship",
        "Operating Systems Lab",
        "Artificial Intelligence Laboratory",
        "Software Engineering Laboratory",
        "Node JS/React JS/Django",
        "Indian Knowledge System"
      ],
      "5": [
        "Automata Theory and Compiler Design",
        "Web Technologies",
        "Business Analytics",
        "Professional Elective-I",
        "Open Elective-I",
        "Compiler Design Laboratory",
        "Web Technologies Laboratory",
        "Business Analytics Laboratory",
        "Field Based Research Project",
        "UI Design – Flutter",
        "Gender Sensitization",
        "Human Values and Professional Ethics"
      ],
      "6": [
        "Machine Learning",
        "Operations Research",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Operations Research Laboratory",
        "Linux Programming Laboratory",
        "Machine Learning Laboratory",
        "English for Employability Skills Laboratory",
        "Big Data – Spark",
        "Environmental Science"
      ],
      "7": [
        "Deep Learning",
        "Marketing Management and Research",
        "Fundamentals of Management for Engineers",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Deep Learning Laboratory",
        "DevOps Laboratory",
        "Industry Oriented Mini Project/ Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "CSW – Computer Engineering (Software Engineering)",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Programming for Problem Solving",
        "Basic Electrical Engineering",
        "Engineering Drawing and Computer Aided Drafting",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "Basic Electrical Engineering Lab",
        "Python Programming Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "Data Structures",
        "Electronic Devices and Circuits",
        "English for Skill Enhancement",
        "Engineering Chemistry Lab",
        "Data Structures Lab",
        "English Language and Communication Skills Lab",
        "Engineering Workshop",
        "IT Workshop"
      ],
      "3": [
        "Mathematical and Statistical Foundations",
        "Computer Organization",
        "Java Programming",
        "Software Engineering",
        "Database Management System",
        "Computational Mathematics Lab",
        "Java Programming Lab",
        "Software Engineering Lab",
        "Database Management Systems Lab",
        "Data Visualization-R Programming/Power BI/Tableau/Google Chart"
      ],
      "4": [
        "Discrete Mathematics",
        "Operating Systems",
        "Automata Theory and Compiler Design",
        "Software Requirements and Estimation",
        "Web Technologies",
        "Innovation and Entrepreneurship",
        "Linux Programming Lab",
        "Operating Systems Lab",
        "Web Technologies Lab",
        "Node JS/React JS/Django",
        "Indian Knowledge System"
      ],
      "5": [
        "Software Testing Methodologies",
        "Machine Learning",
        "Algorithm Design and Analysis",
        "Professional Elective-I",
        "Open Elective-I",
        "Software Testing Methodologies Lab",
        "Machine Learning Lab",
        "Algorithm Design and Analysis Lab",
        "Field Based Project/Internship",
        "UI Design – Flutter",
        "Gender Sensitization/Human Values and Professional Ethics"
      ],
      "6": [
        "Software Architecture and Design Patterns",
        "Computer Networks",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Software Architecture and Design Patterns Lab",
        "Computer Networks Lab",
        "DevOps Laboratory",
        "English for Employability Skills Lab",
        "Big Data – Spark",
        "Environmental Science"
      ],
      "7": [
        "Agile Software Development",
        "Deep Learning",
        "Fundamentals of Management",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Agile Software Development Lab",
        "Deep Learning Laboratory",
        "Industry Oriented Mini Project/Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "INF – Information Technology (IT)",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Programming for Problem Solving",
        "Basic Electrical Engineering",
        "Engineering Drawing and Computer Aided Drafting",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "Basic Electrical Engineering Lab",
        "Python Programming Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "Data Structures",
        "Electronic Devices and Circuits",
        "English for Skill Enhancement",
        "Engineering Chemistry Lab",
        "Data Structures Lab",
        "English Language and Communication Skills Lab",
        "Engineering Workshop",
        "IT Workshop"
      ],
      "3": [
        "Mathematical and Statistical Foundations",
        "Computer Organization and Microprocessor",
        "Java Programming",
        "Operating Systems",
        "Introduction to IoT",
        "Computational Mathematics Lab",
        "Java Programming Lab",
        "Operating Systems Lab",
        "Internet of Things Lab",
        "Data Visualization-R Programming/Power BI/Tableau/Google Chart"
      ],
      "4": [
        "Discrete Mathematics",
        "Data Communications and Computer Networks",
        "Formal Languages and Automata Theory",
        "Database Management Systems",
        "Web Programming",
        "Innovation and Entrepreneurship",
        "Computer Networks Lab",
        "Database Management Systems Lab",
        "Web Programming Lab",
        "Node JS/React JS/Django – UI Design – Flutter",
        "Indian Knowledge System"
      ],
      "5": [
        "Software Engineering",
        "Machine Learning",
        "Algorithm Design and Analysis",
        "Professional Elective-I",
        "Open Elective-I",
        "Software Engineering Lab",
        "Machine Learning Lab",
        "Algorithm Design and Analysis Lab",
        "Field Based Project/Internship",
        "Full Stack Development",
        "Gender Sensitization/Human Values and Professional Ethics"
      ],
      "6": [
        "Compiler Design",
        "Deep Learning",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Compiler Design Lab",
        "Deep Learning Lab",
        "Development Operations (DevOps) Lab",
        "English for Employability Skills Lab",
        "Big Data – Spark",
        "Environmental Science"
      ],
      "7": [
        "Information Security",
        "Natural Language Processing",
        "Fundamentals of Management",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Information Security Lab",
        "Natural Language Processing Lab",
        "Industry Oriented Mini Project/Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "ECE – Electronics and Communication Engineering",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Programming for Problem Solving",
        "Basic Electrical Engineering",
        "Engineering Drawing and Computer Aided Drafting",
        "English for Skill Enhancement",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "English Language and Communication Skills Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "Python Programming",
        "Data Structures",
        "Network Analysis and Synthesis",
        "Engineering Chemistry Lab",
        "Applied Python Programming Lab",
        "Data Structures Lab",
        "Basic Electrical Engineering Lab",
        "Engineering Workshop"
      ],
      "3": [
        "Probability Theory and Stochastic Processes",
        "Signals and Systems",
        "Electronic Devices and Circuits",
        "Digital Logic Design",
        "Control Systems",
        "Innovation and Entrepreneurship",
        "Modelling and Simulation Lab",
        "Electronic Devices and Circuits Lab",
        "Digital Logic Design Lab",
        "Linux and Shell Scripting",
        "Environmental Science"
      ],
      "4": [
        "Numerical Methods and Complex Variables",
        "Electromagnetic Fields and Transmission Lines",
        "Analog and Digital Communications",
        "Electronic Circuit Analysis",
        "Linear and Digital IC Applications",
        "Computational Mathematics Lab",
        "Analog and Digital Communications Lab",
        "Electronic Circuit Analysis Lab",
        "Linear and Digital IC Applications Lab",
        "Web and Mobile Applications"
      ],
      "5": [
        "Digital Signal Processing",
        "RISC and Microcontroller Architectures",
        "CMOS VLSI Design",
        "Professional Elective-I",
        "Open Elective-I",
        "RISC and Microcontroller Interfacing Laboratory",
        "CMOS VLSI Design Laboratory",
        "Digital Signal Processing Laboratory",
        "Field Based Research Project",
        "FPGA based System Design",
        "Indian Knowledge System"
      ],
      "6": [
        "Antenna Design and Wave Propagation",
        "IoT Architectures and Protocols",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Advanced Communications Lab",
        "IoT Architectures and Protocols Lab",
        "VLSI Design Verification Lab",
        "Advanced English Communication Skills Lab",
        "5G Practical Lab/Robotic Lab/Drone Lab",
        "Gender Sensitization and Human Values and Professional Ethics"
      ],
      "7": [
        "Microwave and Optical Communications",
        "Embedded System Design",
        "Fundamentals of Management for Engineers",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Microwave and Optical Communications Lab",
        "Embedded System Design Lab",
        "Industry Oriented Mini Project/Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "EEE – Electrical and Electronics Engineering",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "Programming for Problem Solving",
        "Electrical Circuits – I",
        "Engineering Drawing and Computer Aided Drafting",
        "English for Skill Enhancement",
        "Advanced Engineering Physics Lab",
        "Programming for Problem Solving Lab",
        "English Language and Communication Skills Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Engineering Chemistry",
        "Python Programming",
        "Data Structures",
        "Electrical Circuits – II",
        "Engineering Chemistry Lab",
        "Python Programming Lab",
        "Data Structures Lab",
        "Electrical Circuits Lab",
        "Engineering Workshop"
      ],
      "3": [
        "Electromagnetic Fields",
        "Electrical Machines – I",
        "Electronic Devices and Circuits",
        "Power Systems – I",
        "Electrical Measurements and Sensors",
        "Innovation and Entrepreneurship",
        "Electrical Machines – I Lab",
        "Electrical Measurements and Sensors Lab",
        "Electronic Devices and Circuits Lab",
        "Design of Electrical Systems using AutoCAD",
        "Environmental Science"
      ],
      "4": [
        "Numerical Methods and Complex Variables",
        "Electrical Machines – II",
        "Power Systems – II",
        "Digital Electronics",
        "Control Systems",
        "Computational Mathematics Lab",
        "Electrical Machines – II Lab",
        "Control Systems Lab",
        "Digital Electronics Lab",
        "PCB Design"
      ],
      "5": [
        "Power Electronics",
        "Microprocessors and Microcontrollers",
        "Power System Protection",
        "Professional Elective-I",
        "Open Elective-I",
        "Power Electronics Laboratory",
        "Power System Simulation Lab",
        "Microprocessors and Microcontrollers Lab",
        "Field Based Project/Internship",
        "Robotics and Automation",
        "Indian Knowledge System"
      ],
      "6": [
        "Power System Operation and Control",
        "Signals and Systems",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Signals and Systems Lab",
        "Power System Simulation Lab",
        "Electrical and Electronics Design Lab",
        "English for Employability Skills Lab",
        "Design of Solar Power System",
        "Gender Sensitization and Human Values and Professional Ethics"
      ],
      "7": [
        "Power Electronics for Renewable Energy Systems",
        "Hybrid Electric Vehicles",
        "Fundamentals of Management",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Power Electronics for Renewable Energy Systems Lab",
        "Electric Vehicles Laboratory",
        "Industry Oriented Mini Project/Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "CIV – Civil Engineering",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "C Programming and Data Structures/Programming for Problem Solving",
        "Computer Aided Engineering Graphics",
        "Engineering Workshop",
        "English for Skill Enhancement",
        "Advanced Engineering Physics Laboratory",
        "C Programming and Data Structures Lab/Programming for Problem Solving Lab",
        "English Language and Communication Skills Laboratory"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Applied Chemistry",
        "Python Programming",
        "Basic Electrical and Electronics Engineering",
        "Building Planning and Construction",
        "Engineering Mechanics",
        "Chemistry Laboratory for Engineers",
        "Python Programming Laboratory",
        "Basic Electrical Engineering Laboratory",
        "NSS and Yoga"
      ],
      "3": [
        "Probability and Statistics",
        "Building Materials and Concrete Technology",
        "Strength of Materials",
        "Surveying and Geomatics",
        "Fluid Mechanics",
        "Computational Mathematics Laboratory",
        "Material Testing Laboratory",
        "Strength of Materials Laboratory",
        "Surveying & Geomatics Laboratory",
        "Design Thinking and Tinkering Laboratory"
      ],
      "4": [
        "Structural Mechanics",
        "Water Resources and Irrigation Engineering",
        "Hydraulics & Hydraulic Machinery",
        "Theory of Structures",
        "Engineering Geology",
        "Innovation and Entrepreneurship",
        "Engineering Geology Laboratory",
        "Hydraulics & Hydraulic Machinery Laboratory",
        "Computer Aided Building Drafting Laboratory",
        "Digital Surveying Laboratory",
        "Indian Knowledge System"
      ],
      "5": [
        "Environmental Engineering",
        "Design of Reinforced Concrete Members",
        "Transportation Engineering",
        "Professional Elective-I",
        "Open Elective-I",
        "Environmental Engineering Laboratory",
        "Computer Aided Design Laboratory",
        "Highway Materials Laboratory",
        "Field Based Project/Internship",
        "Building Information Modelling Laboratory",
        "Gender Sensitization Lab/Human Values and Professional Ethics"
      ],
      "6": [
        "Geotechnical Engineering",
        "Design of Steel Structures",
        "Business Economics and Financial Analysis",
        "Professional Elective-II",
        "Open Elective-II",
        "Geotechnical Engineering Laboratory",
        "GIS Laboratory",
        "Civil Engineering Software Laboratory",
        "Advanced English Communication Skills Laboratory",
        "Project Management Software Lab",
        "Environmental Science"
      ],
      "7": [
        "Estimation, Quantity Surveying & Valuation",
        "Foundation Engineering",
        "Fundamentals of Management",
        "Professional Elective-III",
        "Professional Elective-IV",
        "Open Elective-III",
        "Quantity Surveying Laboratory",
        "Computational Laboratory/IoT Laboratory",
        "Industry Oriented Mini Project/Summer Internship"
      ],
      "8": [
        "Professional Elective-V",
        "Professional Elective-VI",
        "Project Work"
      ]
    }
  },
  {
    "name": "MEC – Mechanical Engineering",
    "semesters": {
      "1": [
        "Matrices and Calculus",
        "Advanced Engineering Physics",
        "C Programming and Data Structures",
        "Engineering Mechanics",
        "English for Skill Enhancement",
        "Advanced Engineering Physics Lab",
        "C Programming and Data Structures Lab",
        "Engineering Workshop",
        "English Language and Communication Skills Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Applied Chemistry",
        "Python Programming",
        "Elements of Electrical and Electronics Engineering",
        "Thermodynamics",
        "Engineering Drawing and Computer Aided Drafting",
        "Chemistry Lab for Engineers",
        "Python Programming Lab",
        "Elements of Electrical and Electronics Engineering Lab"
      ],
      "3": [
        "Probability, Statistics and Complex Variables",
        "Mechanics of Solids",
        "Material Science and Metallurgy",
        "Production Technology",
        "Fluid Mechanics and Hydraulic Machines",
        "Computational Mathematics Lab",
        "Production Technology Lab",
        "Material Science and Mechanics of Solids Lab",
        "Fluid Mechanics and Hydraulic Machines Lab",
        "Design Thinking and Ideation"
      ],
      "4": [
        "Kinematics of Machinery",
        "Thermal Engineering – I",
        "Design of Machine Elements",
        "Instrumentation and Control Systems",
        "Operations Research",
        "Innovation and Entrepreneurship",
        "Conventional and Computer Aided Machine Drawing",
        "Instrumentation and Control Systems Lab",
        "Thermal Engineering – I Lab",
        "Data Analytics and Python for Engineers",
        "Indian Knowledge System"
      ]
    }
  },
  {
    "name": "Aeronautical Engineering",
    "semesters": {
      "1": [
        "Matrices & Calculus",
        "Engineering Chemistry",
        "Elements of Electrical & Electronics Engineering",
        "C Programming & Data Structures",
        "Engineering Mechanics",
        "Engineering Chemistry Lab",
        "C Programming & Data Structures Lab",
        "Engineering Workshop",
        "Elements of Electrical & Electronics Engineering Lab"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Advanced Engineering Physics",
        "Computer Aided Engineering Drawing",
        "English for Skill Enhancement",
        "Python Programming",
        "Aero Thermodynamics",
        "Advanced Engineering Physics Lab",
        "Python Programming Lab",
        "English Language and Communication Skills Lab"
      ],
      "3": [
        "Probability, Statistics & Complex Variables",
        "Engineering Thermodynamics – I",
        "Mechanics of Solids",
        "Environmental Science and Engineering",
        "Materials Science and Engineering",
        "Fluid Mechanics and Thermodynamics of Machines",
        "Manufacturing Technology – I",
        "Engineering Graphics (Skill Development Course)",
        "Constitution of India & Professional Ethics (S&H Course)"
      ],
      "4": [
        "Differential Equations and Fourier Transforms",
        "Advance Engineering Mathematics",
        "Fluid Mechanics",
        "Engineering Metallurgy",
        "Mechanics of Materials",
        "Manufacturing Technology – II",
        "Dynamics of Machinery",
        "Engineering Practices Lab",
        "Computer Aided Machine Drawing Lab"
      ],
      "5": [
        "Heat and Mass Transfer",
        "Mine Surveying – I",
        "Mine Geology",
        "Introduction to Material Handling Equipment",
        "Environmental Engineering and Pollution Control Engineering",
        "Professional Ethics & Cyber Security",
        "Introduction to Data Science and Applications (Skill Dev Course)",
        "Elective – I (Open Elective)",
        "Open Elective – I",
        "Fire and Safety Engineering Laboratory",
        "Environmental Engineering Laboratory"
      ],
      "6": [
        "Industrial Management",
        "Mine Ventilation – I",
        "Mine Planning & Design – I",
        "Transportation Engineering",
        "Advanced Rock Mechanics",
        "Elective – II (Open Elective)",
        "Open Elective – II",
        "Mine Ventilation – I Lab",
        "Mine Planning & Design Lab",
        "Advanced Rock Mechanics Lab"
      ],
      "7": [
        "Mining Machinery – I",
        "Mineral Economics",
        "Elective – III (Open Elective)",
        "Elective – IV (Open Elective)",
        "Safety in Mines – I",
        "Human Resource Development (Skill Dev Course)",
        "Entrepreneurship Development (Value Added Course)",
        "Elective – V",
        "Industry Oriented Mini Project",
        "Professional Practices Laboratory"
      ],
      "8": [
        "Seminar and Industrial Visits",
        "Elective – VI",
        "Elective – VII",
        "Project Work"
      ]
    }
  },
  {
    "name": "Mining Engineering",
    "semesters": {
      "1": [
        "Mathematics – I",
        "Engineering Physics",
        "C Programming and Data Structures",
        "Computer Aided Engineering Graphics",
        "English for Skill Enhancement",
        "Physics Laboratory",
        "C Programming and Data Structures Laboratory",
        "English Language and Communication Skills Laboratory"
      ],
      "2": [
        "Ordinary Differential Equations and Vector Calculus",
        "Applied Chemistry",
        "Python Programming",
        "Basic Electrical and Electronics Engineering",
        "Introduction to Mining Engineering",
        "Engineering Mechanics/Applied Mechanics",
        "Chemistry Laboratory for Engineers",
        "Python Programming Laboratory",
        "Basic Electrical Engineering Laboratory"
      ],
      "3": [
        "Probability, Statistics & Complex Variables",
        "Mine Surveying – I",
        "Development of Mineral Deposits",
        "Mining Geology",
        "Fluid Mechanics & Hydraulic Machines",
        "Computational Mathematics Laboratory",
        "Mine Surveying – I Laboratory",
        "Mining Geology Laboratory",
        "Fluid Mechanics & Hydraulic Machines Lab",
        "Industrial Training – I"
      ],
      "4": [
        "Surface Mining Technology",
        "Mine Ventilation",
        "Mine Surveying – II",
        "Underground Coal Mining Technology",
        "Mine Mechanization – I",
        "Mine Surveying – II Lab",
        "Mine Ventilation Lab",
        "Mine Mechanization – I Lab",
        "Introduction to Data Science for Mining Engg",
        "Indian Knowledge System",
        "(Optional) Work-based Vocational Course/Internship"
      ],
      "5": [
        "Rock Mechanics",
        "Mine Mechanization – II",
        "Mine Hazards & Rescue",
        "Professional Elective – I",
        "Open Elective – I",
        "Rock Mechanics Lab",
        "Mine Mechanization – II Lab",
        "Mine Hazards & Rescue Lab",
        "Industrial Training – II",
        "Gender Sensitization Lab*/Constitution of India*"
      ],
      "6": [
        "Mine Planning & Design",
        "Mineral Processing",
        "Fundamentals of Management for Engineers/Entrepreneurship/etc.",
        "Professional Elective – II",
        "Open Elective – II",
        "Mineral Processing Lab",
        "Ground Control Lab",
        "Mine Planning & Design Lab",
        "Advanced English Communication Skills Lab",
        "Industrial Training – III",
        "Environmental Science"
      ],
      "7": [
        "Mine Legislation & General Safety",
        "Underground Metal Mining Technology",
        "Fundamentals of Management for Engineers/Entrepreneurship/etc.",
        "Professional Elective – III",
        "Professional Elective – IV",
        "Open Elective – III",
        "Computer Applications in Mining Lab",
        "Mine Safety Lab",
        "Industry Oriented Mini Project/Summer Internship"
      ],
      "8": [
        "Professional Elective – V",
        "Professional Elective – VI",
        "Project Work"
      ]
    }
  }
];
const boardTemplates = [
    createClass10Template({
        id: 'cbse-class-10',
        board: 'CBSE',
        region: 'National',
        title: 'CBSE Class 10 Core',
        description: 'Core secondary setup with 80/20 internal splits for mathematics, science, and social science.',
        formulas: ['80+20', '100'],
        tags: ['cbse', 'class 10', 'secondary'],
        subjects: buildSecondarySubjects({
            primaryLanguagePattern: FULL_100,
            secondLanguagePattern: FULL_100,
            mathPattern: THEORY_80_INTERNAL_20,
            sciencePattern: THEORY_80_INTERNAL_20,
            socialPattern: THEORY_80_INTERNAL_20,
            electivePattern: FULL_100,
            electiveName: 'Information Technology'
        })
    }),
    createClass10Template({
        id: 'andhra-pradesh-ssc',
        board: 'BSEAP',
        region: 'Andhra Pradesh',
        title: 'Andhra Pradesh SSC',
        description: 'A practical-friendly SSC layout balancing language papers with science lab components.',
        formulas: ['80+20', '70+30'],
        tags: ['ssc', 'ap', 'andhra pradesh'],
        subjects: buildSecondarySubjects({
            primaryLanguagePattern: THEORY_80_INTERNAL_20,
            secondLanguage: 'Telugu / Hindi',
            secondLanguagePattern: THEORY_80_INTERNAL_20,
            sciencePattern: THEORY_70_PRACTICAL_30,
            electivePattern: THEORY_80_INTERNAL_20
        })
    }),
    createClass10Template({
        id: 'telangana-ssc',
        board: 'BSE Telangana',
        region: 'Telangana',
        title: 'Telangana SSC',
        description: 'SSC template with 70/30 science and 80/20 academic papers for a familiar state-board mix.',
        formulas: ['80+20', '70+30'],
        tags: ['ssc', 'telangana'],
        subjects: buildSecondarySubjects({
            secondLanguage: 'Telugu / Hindi',
            sciencePattern: THEORY_70_PRACTICAL_30,
            electivePattern: THEORY_80_INTERNAL_20
        })
    }),
    createClass10Template({
        id: 'maharashtra-ssc',
        board: 'MSBSHSE',
        region: 'Maharashtra',
        title: 'Maharashtra SSC',
        description: 'SSC subjects tuned for Maharashtra with science practicals and 80/20 core papers.',
        formulas: ['80+20', '70+30'],
        tags: ['ssc', 'maharashtra'],
        subjects: buildSecondarySubjects({
            secondLanguage: 'Marathi / Hindi',
            sciencePattern: THEORY_70_PRACTICAL_30,
            electivePattern: FULL_100,
            electiveName: 'Information Technology'
        })
    }),
    createClass10Template({
        id: 'karnataka-sslc',
        board: 'KSEAB',
        region: 'Karnataka',
        title: 'Karnataka SSLC',
        description: 'SSLC layout using 70/30 science plus 80/20 internals across language and social papers.',
        formulas: ['80+20', '70+30'],
        tags: ['sslc', 'karnataka'],
        subjects: buildSecondarySubjects({
            secondLanguage: 'Kannada / Hindi',
            sciencePattern: THEORY_70_PRACTICAL_30,
            electivePattern: THEORY_80_INTERNAL_20
        })
    }),
    createClass10Template({
        id: 'kerala-sslc',
        board: 'KBPE',
        region: 'Kerala',
        title: 'Kerala SSLC',
        description: 'Kerala secondary pattern with practical science and strong internal weighting for academic subjects.',
        formulas: ['80+20', '70+30'],
        tags: ['sslc', 'kerala'],
        subjects: buildSecondarySubjects({
            secondLanguage: 'Malayalam / Hindi',
            scienceName: 'Basic Science',
            sciencePattern: THEORY_70_PRACTICAL_30,
            electiveName: 'Information Technology',
            electivePattern: FULL_100
        })
    }),
    createClass10Template({
        id: 'tamilnadu-sslc',
        board: 'DGE Tamil Nadu',
        region: 'Tamil Nadu',
        title: 'Tamil Nadu SSLC',
        description: 'A clean SSLC setup emphasizing 80/20 splits across major papers for Tamil Nadu schools.',
        formulas: ['80+20'],
        tags: ['sslc', 'tamil nadu'],
        subjects: buildSecondarySubjects({
            secondLanguage: 'Tamil / Hindi',
            sciencePattern: THEORY_80_INTERNAL_20,
            electivePattern: THEORY_80_INTERNAL_20
        })
    }),
    createClass10Template({
        id: 'west-bengal-madhyamik',
        board: 'WBBSE',
        region: 'West Bengal',
        title: 'West Bengal Madhyamik',
        description: 'Madhyamik-inspired subject pack with practical science and internal-backed core studies.',
        formulas: ['80+20', '70+30'],
        tags: ['madhyamik', 'west bengal'],
        subjects: buildSecondarySubjects({
            secondLanguage: 'Bengali / Hindi',
            sciencePattern: THEORY_70_PRACTICAL_30,
            socialName: 'History & Geography',
            electivePattern: THEORY_80_INTERNAL_20,
            electiveName: 'Computer Applications'
        })
    }),
    createClass10Template({
        id: 'punjab-matric',
        board: 'PSEB',
        region: 'Punjab',
        title: 'Punjab Matric',
        description: 'Punjab matric template with 70/30 science and steady 80/20 internal splits elsewhere.',
        formulas: ['80+20', '70+30'],
        tags: ['pseb', 'punjab', 'matric'],
        subjects: buildSecondarySubjects({
            secondLanguage: 'Punjabi / Hindi',
            sciencePattern: THEORY_70_PRACTICAL_30,
            electiveName: 'Computer Science'
        })
    }),
    createClass10Template({
        id: 'rajasthan-class-10',
        board: 'RBSE',
        region: 'Rajasthan',
        title: 'Rajasthan Class 10',
        description: 'RBSE-inspired secondary template including the distinctive 56/14/30 split for lab-heavy subjects.',
        formulas: ['80+20', '56+14+30'],
        tags: ['rbse', 'rajasthan'],
        subjects: buildSecondarySubjects({
            primaryLanguagePattern: THEORY_80_INTERNAL_20,
            secondLanguage: 'Hindi / Sanskrit',
            secondLanguagePattern: THEORY_80_INTERNAL_20,
            sciencePattern: THEORY_56_PRACTICAL_14_INTERNAL_30,
            socialPattern: THEORY_56_PRACTICAL_14_INTERNAL_30,
            electivePattern: THEORY_80_INTERNAL_20,
            electiveName: 'Third Language'
        })
    }),
    createClass10Template({
        id: 'up-high-school',
        board: 'UPMSP',
        region: 'Uttar Pradesh',
        title: 'UP Board High School',
        description: 'UPMSP high-school pattern with science practicals and 80/20 papers for the rest of the core set.',
        formulas: ['80+20', '70+30'],
        tags: ['upmsp', 'uttar pradesh'],
        subjects: buildSecondarySubjects({
            secondLanguage: 'Hindi / Sanskrit',
            sciencePattern: THEORY_70_PRACTICAL_30,
            electivePattern: THEORY_80_INTERNAL_20,
            electiveName: 'Computer / Elective'
        })
    }),
    createClass10Template({
        id: 'bihar-matric',
        board: 'BSEB',
        region: 'Bihar',
        title: 'Bihar Matric',
        description: 'BSEB-like mix with full-mark language papers and internal-backed science and social subjects.',
        formulas: ['100', '80+20'],
        tags: ['bseb', 'bihar', 'matric'],
        subjects: buildSecondarySubjects({
            primaryLanguagePattern: FULL_100,
            secondLanguage: 'Hindi / Urdu',
            secondLanguagePattern: FULL_100,
            mathPattern: FULL_100,
            sciencePattern: THEORY_80_INTERNAL_20,
            socialPattern: THEORY_80_INTERNAL_20,
            electivePattern: FULL_100,
            electiveName: 'Optional Language'
        })
    }),
    createClass10Template({
        id: 'odisha-hsc',
        board: 'BSE Odisha',
        region: 'Odisha',
        title: 'Odisha HSC',
        description: 'Odisha secondary schema with 70/30 science and 80/20 support subjects.',
        formulas: ['80+20', '70+30'],
        tags: ['odisha', 'hsc'],
        subjects: buildSecondarySubjects({
            secondLanguage: 'Odia / Hindi',
            sciencePattern: THEORY_70_PRACTICAL_30,
            electiveName: 'Sanskrit / Elective',
            electivePattern: THEORY_80_INTERNAL_20
        })
    }),
    createClass10Template({
        id: 'gujarat-ssc',
        board: 'GSEB',
        region: 'Gujarat',
        title: 'Gujarat SSC',
        description: 'A GSEB-flavored secondary template with 70/30 science and 80/20 academic papers.',
        formulas: ['80+20', '70+30'],
        tags: ['gseb', 'gujarat', 'ssc'],
        subjects: buildSecondarySubjects({
            secondLanguage: 'Gujarati / Hindi',
            sciencePattern: THEORY_70_PRACTICAL_30,
            electivePattern: THEORY_80_INTERNAL_20
        })
    }),
    createSeniorTemplate({
        id: 'cbse-class-12-pcm',
        board: 'CBSE',
        region: 'National',
        title: 'CBSE Class 12 PCM',
        stream: 'PCM',
        streamKey: 'science',
        description: 'Physics and chemistry are split out for practical evaluation while English and maths stay core.',
        formulas: ['100', '70+30'],
        tags: ['cbse', 'pcm', 'class 12'],
        subjects: flattenSubjects(
            buildSubject('English', FULL_100),
            buildSubject('Mathematics', FULL_100),
            buildSubject('Physics', THEORY_70_PRACTICAL_30),
            buildSubject('Chemistry', THEORY_70_PRACTICAL_30),
            buildSubject('Optional', FULL_100)
        )
    }),
    createSeniorTemplate({
        id: 'cbse-class-12-pcb',
        board: 'CBSE',
        region: 'National',
        title: 'CBSE Class 12 PCB',
        stream: 'PCB',
        streamKey: 'science',
        description: 'Biology joins physics and chemistry with dedicated practical components for board-ready entry.',
        formulas: ['100', '70+30'],
        tags: ['cbse', 'pcb', 'class 12'],
        subjects: flattenSubjects(
            buildSubject('English', FULL_100),
            buildSubject('Biology', THEORY_70_PRACTICAL_30),
            buildSubject('Physics', THEORY_70_PRACTICAL_30),
            buildSubject('Chemistry', THEORY_70_PRACTICAL_30),
            buildSubject('Optional', FULL_100)
        )
    }),
    createSeniorTemplate({
        id: 'cbse-class-12-commerce',
        board: 'CBSE',
        region: 'National',
        title: 'CBSE Class 12 Commerce',
        stream: 'Commerce',
        streamKey: 'commerce',
        description: 'A commerce-focused CBSE setup centered on 80/20 internal splits across business subjects.',
        formulas: ['80+20'],
        tags: ['cbse', 'commerce', 'class 12'],
        subjects: buildCommerceSubjects({
            fifthSubjectName: 'Mathematics / Informatics Practices'
        })
    }),
    createSeniorTemplate({
        id: 'cbse-class-12-humanities',
        board: 'CBSE',
        region: 'National',
        title: 'CBSE Class 12 Humanities',
        stream: 'Humanities',
        streamKey: 'humanities',
        description: 'Humanities-ready CBSE lineup with internal assessment-friendly 80/20 splits.',
        formulas: ['80+20'],
        tags: ['cbse', 'humanities', 'class 12'],
        subjects: buildHumanitiesSubjects({
            fifthSubjectName: 'Sociology'
        })
    }),
    createSeniorTemplate({
        id: 'andhra-pradesh-inter-mpc',
        board: 'BIEAP',
        region: 'Andhra Pradesh',
        title: 'Andhra Pradesh Inter 1st / 2nd Year MPC',
        stream: 'MPC',
        streamKey: 'science',
        description: 'Intermediate MPC split with 80/20 English, 75-mark mathematics papers, and 60/30 lab sciences.',
        formulas: ['80+20', '75', '60+30'],
        tags: ['andhra pradesh', 'mpc', 'intermediate'],
        subjects: flattenSubjects(
            buildSubject('English', [['Theory', 80], ['Practical', 20]]),
            buildSubject('Telugu / Sanskrit', FULL_100),
            buildSubject('Mathematics A', 75),
            buildSubject('Mathematics B', 75),
            buildSubject('Physics', [['Theory', 60], ['Practical', 30]]),
            buildSubject('Chemistry', [['Theory', 60], ['Practical', 30]])
        )
    }),
    createSeniorTemplate({
        id: 'andhra-pradesh-inter-bipc',
        board: 'BIEAP',
        region: 'Andhra Pradesh',
        title: 'Andhra Pradesh Inter 1st / 2nd Year BiPC',
        stream: 'BiPC',
        streamKey: 'science',
        description: 'BiPC template with 60/30 lab components for core sciences and a full second language paper.',
        formulas: ['80+20', '60+30', '100'],
        tags: ['andhra pradesh', 'bipc', 'intermediate'],
        subjects: flattenSubjects(
            buildSubject('English', [['Theory', 80], ['Practical', 20]]),
            buildSubject('Telugu / Sanskrit', FULL_100),
            buildSubject('Botany', [['Theory', 60], ['Practical', 30]]),
            buildSubject('Zoology', [['Theory', 60], ['Practical', 30]]),
            buildSubject('Physics', [['Theory', 60], ['Practical', 30]]),
            buildSubject('Chemistry', [['Theory', 60], ['Practical', 30]])
        )
    }),
    createSeniorTemplate({
        id: 'andhra-pradesh-inter-cec',
        board: 'BIEAP',
        region: 'Andhra Pradesh',
        title: 'Andhra Pradesh Inter 1st / 2nd Year CEC',
        stream: 'CEC',
        streamKey: 'commerce',
        description: 'A 100-mark CEC pattern for English, language, civics, economics, and commerce papers.',
        formulas: ['100'],
        tags: ['andhra pradesh', 'cec', 'intermediate'],
        subjects: flattenSubjects(
            buildSubject('English', FULL_100),
            buildSubject('Telugu / Sanskrit', FULL_100),
            buildSubject('Commerce', FULL_100),
            buildSubject('Economics', FULL_100),
            buildSubject('Civics', FULL_100)
        )
    }),
    createSeniorTemplate({
        id: 'andhra-pradesh-inter-mec',
        board: 'BIEAP',
        region: 'Andhra Pradesh',
        title: 'Andhra Pradesh Inter 1st / 2nd Year MEC',
        stream: 'MEC',
        streamKey: 'commerce',
        description: 'MEC schema pairing full-mark language and commerce papers with split mathematics A and B.',
        formulas: ['100', '75'],
        tags: ['andhra pradesh', 'mec', 'intermediate'],
        subjects: flattenSubjects(
            buildSubject('English', FULL_100),
            buildSubject('Telugu / Sanskrit', FULL_100),
            buildSubject('Mathematics A', 75),
            buildSubject('Mathematics B', 75),
            buildSubject('Economics', FULL_100),
            buildSubject('Commerce', FULL_100)
        )
    }),
    createSeniorTemplate({
        id: 'andhra-pradesh-inter-hec',
        board: 'BIEAP',
        region: 'Andhra Pradesh',
        title: 'Andhra Pradesh Inter 1st / 2nd Year HEC',
        stream: 'HEC',
        streamKey: 'humanities',
        description: 'Humanities-focused HEC pack with full-mark papers across language and social subjects.',
        formulas: ['100'],
        tags: ['andhra pradesh', 'hec', 'intermediate'],
        subjects: flattenSubjects(
            buildSubject('English', FULL_100),
            buildSubject('Telugu / Sanskrit', FULL_100),
            buildSubject('History', FULL_100),
            buildSubject('Economics', FULL_100),
            buildSubject('Civics', FULL_100)
        )
    }),
    createSeniorTemplate({
        id: 'telangana-inter-mpc',
        board: 'TSBIE',
        region: 'Telangana',
        title: 'Telangana Inter 1st / 2nd Year MPC',
        stream: 'MPC',
        streamKey: 'science',
        description: 'TSBIE MPC layout with 80/20 languages, 75/25 mathematics, and 60/40 lab sciences.',
        formulas: ['80+20', '75+25', '60+40'],
        tags: ['telangana', 'mpc', 'intermediate'],
        subjects: flattenSubjects(
            buildSubject('English', THEORY_80_INTERNAL_20),
            buildSubject('Telugu / Sanskrit', THEORY_80_INTERNAL_20),
            buildSubject('Mathematics A', THEORY_75_INTERNAL_25),
            buildSubject('Mathematics B', THEORY_75_INTERNAL_25),
            buildSubject('Physics', THEORY_60_PRACTICAL_40),
            buildSubject('Chemistry', THEORY_60_PRACTICAL_40)
        )
    }),
    createSeniorTemplate({
        id: 'telangana-inter-bipc',
        board: 'TSBIE',
        region: 'Telangana',
        title: 'Telangana Inter 1st / 2nd Year BiPC',
        stream: 'BiPC',
        streamKey: 'science',
        description: 'BiPC configuration tuned for Telangana with 60/40 science labs and 80/20 language components.',
        formulas: ['80+20', '60+40'],
        tags: ['telangana', 'bipc', 'intermediate'],
        subjects: flattenSubjects(
            buildSubject('English', THEORY_80_INTERNAL_20),
            buildSubject('Telugu / Sanskrit', THEORY_80_INTERNAL_20),
            buildSubject('Botany', THEORY_60_PRACTICAL_40),
            buildSubject('Zoology', THEORY_60_PRACTICAL_40),
            buildSubject('Physics', THEORY_60_PRACTICAL_40),
            buildSubject('Chemistry', THEORY_60_PRACTICAL_40)
        )
    }),
    createSeniorTemplate({
        id: 'telangana-inter-cec',
        board: 'TSBIE',
        region: 'Telangana',
        title: 'Telangana Inter 1st / 2nd Year CEC',
        stream: 'CEC',
        streamKey: 'commerce',
        description: 'Commerce, economics, and civics with Telangana-style internal splits and arts-friendly pacing.',
        formulas: ['80+20', '70+30', '100'],
        tags: ['telangana', 'cec', 'intermediate'],
        subjects: flattenSubjects(
            buildSubject('English', THEORY_80_INTERNAL_20),
            buildSubject('Telugu / Sanskrit', THEORY_80_INTERNAL_20),
            buildSubject('Commerce', THEORY_70_INTERNAL_30),
            buildSubject('Economics', THEORY_80_INTERNAL_20),
            buildSubject('Civics', FULL_100)
        )
    }),
    createSeniorTemplate({
        id: 'telangana-inter-mec',
        board: 'TSBIE',
        region: 'Telangana',
        title: 'Telangana Inter 1st / 2nd Year MEC',
        stream: 'MEC',
        streamKey: 'commerce',
        description: 'MEC layout using 75/25 mathematics, 80/20 economics, and a 70/30 commerce paper.',
        formulas: ['80+20', '75+25', '70+30'],
        tags: ['telangana', 'mec', 'intermediate'],
        subjects: flattenSubjects(
            buildSubject('English', THEORY_80_INTERNAL_20),
            buildSubject('Telugu / Sanskrit', THEORY_80_INTERNAL_20),
            buildSubject('Mathematics A', THEORY_75_INTERNAL_25),
            buildSubject('Mathematics B', THEORY_75_INTERNAL_25),
            buildSubject('Economics', THEORY_80_INTERNAL_20),
            buildSubject('Commerce', THEORY_70_INTERNAL_30)
        )
    }),
    createSeniorTemplate({
        id: 'telangana-inter-hec',
        board: 'TSBIE',
        region: 'Telangana',
        title: 'Telangana Inter 1st / 2nd Year HEC',
        stream: 'HEC',
        streamKey: 'humanities',
        description: 'HEC template for history, economics, and civics with the Telangana language split preserved.',
        formulas: ['80+20', '100'],
        tags: ['telangana', 'hec', 'intermediate'],
        subjects: flattenSubjects(
            buildSubject('English', THEORY_80_INTERNAL_20),
            buildSubject('Telugu / Sanskrit', THEORY_80_INTERNAL_20),
            buildSubject('History', FULL_100),
            buildSubject('Economics', THEORY_80_INTERNAL_20),
            buildSubject('Civics', FULL_100)
        )
    }),
    createSeniorTemplate({
        id: 'maharashtra-hsc-science',
        board: 'MSBSHSE',
        region: 'Maharashtra',
        title: 'Maharashtra HSC Science',
        stream: 'Science',
        streamKey: 'science',
        description: 'Science set with 70/30 lab papers and 80/20 evaluation for English and mathematics.',
        formulas: ['80+20', '70+30'],
        tags: ['maharashtra', 'hsc', 'science'],
        subjects: buildScienceSubjects({
            fifthSubjectName: 'Biology'
        })
    }),
    createSeniorTemplate({
        id: 'maharashtra-hsc-commerce',
        board: 'MSBSHSE',
        region: 'Maharashtra',
        title: 'Maharashtra HSC Commerce',
        stream: 'Commerce',
        streamKey: 'commerce',
        description: 'Commerce-focused HSC pattern built around 80/20 internal splits across all major papers.',
        formulas: ['80+20'],
        tags: ['maharashtra', 'hsc', 'commerce'],
        subjects: buildCommerceSubjects({
            fifthSubjectName: 'Organization of Commerce'
        })
    }),
    createSeniorTemplate({
        id: 'maharashtra-hsc-humanities',
        board: 'MSBSHSE',
        region: 'Maharashtra',
        title: 'Maharashtra HSC Humanities',
        stream: 'Humanities',
        streamKey: 'humanities',
        description: 'Arts and humanities setup using 80/20 subjects across the standard senior-board mix.',
        formulas: ['80+20'],
        tags: ['maharashtra', 'hsc', 'humanities'],
        subjects: buildHumanitiesSubjects({
            fifthSubjectName: 'Sociology'
        })
    }),
    createSeniorTemplate({
        id: 'karnataka-puc-science',
        board: 'KSEAB',
        region: 'Karnataka',
        title: 'Karnataka PUC Science',
        stream: 'Science',
        streamKey: 'science',
        description: 'PUC science model with 70/30 lab subjects and 80/20 academic components.',
        formulas: ['80+20', '70+30'],
        tags: ['karnataka', 'puc', 'science'],
        subjects: buildScienceSubjects({
            languageName: 'English',
            fifthSubjectName: 'Computer Science',
            fifthSubjectPattern: THEORY_70_PRACTICAL_30
        })
    }),
    createSeniorTemplate({
        id: 'karnataka-puc-commerce',
        board: 'KSEAB',
        region: 'Karnataka',
        title: 'Karnataka PUC Commerce',
        stream: 'Commerce',
        streamKey: 'commerce',
        description: 'Commerce subjects aligned to Karnataka PUC with 80/20 internal assessment weighting.',
        formulas: ['80+20'],
        tags: ['karnataka', 'puc', 'commerce'],
        subjects: buildCommerceSubjects({
            fifthSubjectName: 'Statistics'
        })
    }),
    createSeniorTemplate({
        id: 'karnataka-puc-humanities',
        board: 'KSEAB',
        region: 'Karnataka',
        title: 'Karnataka PUC Humanities',
        stream: 'Humanities',
        streamKey: 'humanities',
        description: 'Humanities-ready PUC selection with consistent 80/20 evaluation across core subjects.',
        formulas: ['80+20'],
        tags: ['karnataka', 'puc', 'humanities'],
        subjects: buildHumanitiesSubjects({
            fifthSubjectName: 'Sociology'
        })
    }),
    createSeniorTemplate({
        id: 'kerala-dhse-science',
        board: 'DHSE',
        region: 'Kerala',
        title: 'Kerala DHSE Science',
        stream: 'Science',
        streamKey: 'science',
        description: 'Kerala +2 science layout using 60/40 practical-heavy lab subjects and 80/20 academic papers.',
        formulas: ['80+20', '60+40'],
        tags: ['kerala', 'dhse', 'science'],
        subjects: buildScienceSubjects({
            physicsPattern: THEORY_60_PRACTICAL_40,
            chemistryPattern: THEORY_60_PRACTICAL_40,
            fifthSubjectName: 'Biology',
            fifthSubjectPattern: THEORY_60_PRACTICAL_40
        })
    }),
    createSeniorTemplate({
        id: 'kerala-dhse-commerce',
        board: 'DHSE',
        region: 'Kerala',
        title: 'Kerala DHSE Commerce',
        stream: 'Commerce',
        streamKey: 'commerce',
        description: 'Commerce stream with 80/20 non-practical subjects following the common Kerala DHSE pattern.',
        formulas: ['80+20'],
        tags: ['kerala', 'dhse', 'commerce'],
        subjects: buildCommerceSubjects({
            fifthSubjectName: 'Computer Application'
        })
    }),
    createSeniorTemplate({
        id: 'kerala-dhse-humanities',
        board: 'DHSE',
        region: 'Kerala',
        title: 'Kerala DHSE Humanities',
        stream: 'Humanities',
        streamKey: 'humanities',
        description: 'Humanities selection with Kerala-style 80/20 assessment splits for non-lab papers.',
        formulas: ['80+20'],
        tags: ['kerala', 'dhse', 'humanities'],
        subjects: buildHumanitiesSubjects({
            fifthSubjectName: 'Sociology'
        })
    }),
    createSeniorTemplate({
        id: 'tamilnadu-hsc-science',
        board: 'DGE Tamil Nadu',
        region: 'Tamil Nadu',
        title: 'Tamil Nadu HSC Science',
        stream: 'Science',
        streamKey: 'science',
        description: 'Tamil Nadu science stream with 70/20/10 theory, practical, and internal splits across papers.',
        formulas: ['70+20+10'],
        tags: ['tamil nadu', 'hsc', 'science'],
        subjects: buildScienceSubjects({
            languagePattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            mathPattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            physicsPattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            chemistryPattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            fifthSubjectName: 'Biology',
            fifthSubjectPattern: THEORY_70_PRACTICAL_20_INTERNAL_10
        })
    }),
    createSeniorTemplate({
        id: 'tamilnadu-hsc-commerce',
        board: 'DGE Tamil Nadu',
        region: 'Tamil Nadu',
        title: 'Tamil Nadu HSC Commerce',
        stream: 'Commerce',
        streamKey: 'commerce',
        description: 'Commerce layout using Tamil Nadu’s 70/20/10 style across the core senior subjects.',
        formulas: ['70+20+10'],
        tags: ['tamil nadu', 'hsc', 'commerce'],
        subjects: buildCommerceSubjects({
            languagePattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            accountancyPattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            businessPattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            economicsPattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            fifthSubjectName: 'Computer Applications',
            fifthSubjectPattern: THEORY_70_PRACTICAL_20_INTERNAL_10
        })
    }),
    createSeniorTemplate({
        id: 'tamilnadu-hsc-humanities',
        board: 'DGE Tamil Nadu',
        region: 'Tamil Nadu',
        title: 'Tamil Nadu HSC Humanities',
        stream: 'Humanities',
        streamKey: 'humanities',
        description: 'Humanities-oriented HSC model with the same 70/20/10 scoring style used across Tamil Nadu papers.',
        formulas: ['70+20+10'],
        tags: ['tamil nadu', 'hsc', 'humanities'],
        subjects: buildHumanitiesSubjects({
            languagePattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            historyPattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            politicalSciencePattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            economicsPattern: THEORY_70_PRACTICAL_20_INTERNAL_10,
            fifthSubjectName: 'Geography',
            fifthSubjectPattern: THEORY_70_PRACTICAL_20_INTERNAL_10
        })
    }),
    createSeniorTemplate({
        id: 'west-bengal-hs-science',
        board: 'WBCHSE',
        region: 'West Bengal',
        title: 'West Bengal HS Science',
        stream: 'Science',
        streamKey: 'science',
        description: 'HS science template with a full mathematics paper and 70/30 practical splits for lab subjects.',
        formulas: ['100', '80+20', '70+30'],
        tags: ['west bengal', 'hs', 'science'],
        subjects: flattenSubjects(
            buildSubject('English', THEORY_80_INTERNAL_20),
            buildSubject('Mathematics', FULL_100),
            buildSubject('Physics', THEORY_70_PRACTICAL_30),
            buildSubject('Chemistry', THEORY_70_PRACTICAL_30),
            buildSubject('Biology', THEORY_70_PRACTICAL_30)
        )
    }),
    createSeniorTemplate({
        id: 'west-bengal-hs-commerce',
        board: 'WBCHSE',
        region: 'West Bengal',
        title: 'West Bengal HS Commerce',
        stream: 'Commerce',
        streamKey: 'commerce',
        description: 'Commerce stream following 80/20 patterns with a full-mark mathematics paper for calculation-heavy study.',
        formulas: ['100', '80+20'],
        tags: ['west bengal', 'hs', 'commerce'],
        subjects: flattenSubjects(
            buildSubject('English', THEORY_80_INTERNAL_20),
            buildSubject('Mathematics', FULL_100),
            buildSubject('Accountancy', THEORY_80_INTERNAL_20),
            buildSubject('Business Studies', THEORY_80_INTERNAL_20),
            buildSubject('Economics', THEORY_80_INTERNAL_20)
        )
    }),
    createSeniorTemplate({
        id: 'west-bengal-hs-humanities',
        board: 'WBCHSE',
        region: 'West Bengal',
        title: 'West Bengal HS Humanities',
        stream: 'Humanities',
        streamKey: 'humanities',
        description: 'Humanities lineup with 80/20 papers and a practical-backed geography subject.',
        formulas: ['80+20', '70+30'],
        tags: ['west bengal', 'hs', 'humanities'],
        subjects: flattenSubjects(
            buildSubject('English', THEORY_80_INTERNAL_20),
            buildSubject('History', THEORY_80_INTERNAL_20),
            buildSubject('Political Science', THEORY_80_INTERNAL_20),
            buildSubject('Economics', THEORY_80_INTERNAL_20),
            buildSubject('Geography', THEORY_70_PRACTICAL_30)
        )
    }),
    createSeniorTemplate({
        id: 'punjab-senior-secondary-science',
        board: 'PSEB',
        region: 'Punjab',
        title: 'Punjab Senior Secondary Science',
        stream: 'Science',
        streamKey: 'science',
        description: 'Science setup capturing Punjab’s 70/25/5 structure for lab subjects and 80/20 maths and English.',
        formulas: ['80+20', '70+25+5'],
        tags: ['punjab', 'pseb', 'science'],
        subjects: flattenSubjects(
            buildSubject('English', THEORY_80_INTERNAL_20),
            buildSubject('Mathematics', THEORY_80_INTERNAL_20),
            buildSubject('Physics', THEORY_70_PRACTICAL_25_INTERNAL_5),
            buildSubject('Chemistry', THEORY_70_PRACTICAL_25_INTERNAL_5),
            buildSubject('Biology', THEORY_70_PRACTICAL_25_INTERNAL_5)
        )
    }),
    createSeniorTemplate({
        id: 'punjab-senior-secondary-commerce',
        board: 'PSEB',
        region: 'Punjab',
        title: 'Punjab Senior Secondary Commerce',
        stream: 'Commerce',
        streamKey: 'commerce',
        description: 'Commerce and business papers aligned to Punjab’s standard 80/20 internal split.',
        formulas: ['80+20'],
        tags: ['punjab', 'pseb', 'commerce'],
        subjects: buildCommerceSubjects({
            fifthSubjectName: 'Punjabi / Computer Applications'
        })
    }),
    createSeniorTemplate({
        id: 'rajasthan-senior-secondary-science',
        board: 'RBSE',
        region: 'Rajasthan',
        title: 'Rajasthan Senior Secondary Science',
        stream: 'Science',
        streamKey: 'science',
        description: 'RBSE science template with the 56/14/30 split for lab papers and 80/20 for theory-led subjects.',
        formulas: ['80+20', '56+14+30'],
        tags: ['rajasthan', 'rbse', 'science'],
        subjects: flattenSubjects(
            buildSubject('English', THEORY_80_INTERNAL_20),
            buildSubject('Mathematics', THEORY_80_INTERNAL_20),
            buildSubject('Physics', THEORY_56_PRACTICAL_14_INTERNAL_30),
            buildSubject('Chemistry', THEORY_56_PRACTICAL_14_INTERNAL_30),
            buildSubject('Biology', THEORY_56_PRACTICAL_14_INTERNAL_30)
        )
    }),
    createSeniorTemplate({
        id: 'rajasthan-senior-secondary-commerce',
        board: 'RBSE',
        region: 'Rajasthan',
        title: 'Rajasthan Senior Secondary Commerce',
        stream: 'Commerce',
        streamKey: 'commerce',
        description: 'Commerce-oriented RBSE layout following the common 80/20 pattern across non-lab papers.',
        formulas: ['80+20'],
        tags: ['rajasthan', 'rbse', 'commerce'],
        subjects: buildCommerceSubjects({
            fifthSubjectName: 'Mathematics / Informatics'
        })
    }),
    createSeniorTemplate({
        id: 'uttar-pradesh-intermediate-science',
        board: 'UPMSP',
        region: 'Uttar Pradesh',
        title: 'Uttar Pradesh Intermediate Science',
        stream: 'Science',
        streamKey: 'science',
        description: 'UP board science pattern with full-mark non-practical papers and 70/30 lab subjects.',
        formulas: ['100', '70+30'],
        tags: ['uttar pradesh', 'upmsp', 'science'],
        subjects: flattenSubjects(
            buildSubject('English', FULL_100),
            buildSubject('Mathematics', FULL_100),
            buildSubject('Physics', THEORY_70_PRACTICAL_30),
            buildSubject('Chemistry', THEORY_70_PRACTICAL_30),
            buildSubject('Biology / Computer Science', THEORY_70_PRACTICAL_30)
        )
    }),
    createSeniorTemplate({
        id: 'uttar-pradesh-intermediate-commerce',
        board: 'UPMSP',
        region: 'Uttar Pradesh',
        title: 'Uttar Pradesh Intermediate Commerce',
        stream: 'Commerce',
        streamKey: 'commerce',
        description: 'Commerce-friendly UPMSP template with full-mark theory papers for non-practical subjects.',
        formulas: ['100'],
        tags: ['uttar pradesh', 'upmsp', 'commerce'],
        subjects: flattenSubjects(
            buildSubject('English', FULL_100),
            buildSubject('Accountancy', FULL_100),
            buildSubject('Business Studies', FULL_100),
            buildSubject('Economics', FULL_100),
            buildSubject('Mathematics / Computer', FULL_100)
        )
    })
];

const additionalStateTemplateConfigs = [
    {
        id: 'arunachal-pradesh',
        region: 'Arunachal Pradesh',
        board: 'Arunachal Board',
        secondLanguage: 'Hindi / English'
    },
    {
        id: 'assam',
        region: 'Assam',
        board: 'Assam Board',
        secondLanguage: 'Assamese / Bengali / Bodo'
    },
    {
        id: 'chhattisgarh',
        region: 'Chhattisgarh',
        board: 'Chhattisgarh Board',
        secondLanguage: 'Hindi / Sanskrit'
    },
    {
        id: 'goa',
        region: 'Goa',
        board: 'Goa Board',
        secondLanguage: 'Konkani / Marathi'
    },
    {
        id: 'haryana',
        region: 'Haryana',
        board: 'Haryana Board',
        secondLanguage: 'Hindi / Sanskrit'
    },
    {
        id: 'himachal-pradesh',
        region: 'Himachal Pradesh',
        board: 'Himachal Pradesh Board',
        secondLanguage: 'Hindi / Sanskrit'
    },
    {
        id: 'jharkhand',
        region: 'Jharkhand',
        board: 'Jharkhand Board',
        secondLanguage: 'Hindi / Sanskrit'
    },
    {
        id: 'madhya-pradesh',
        region: 'Madhya Pradesh',
        board: 'Madhya Pradesh Board',
        secondLanguage: 'Hindi / Sanskrit'
    },
    {
        id: 'manipur',
        region: 'Manipur',
        board: 'Manipur Board',
        secondLanguage: 'Meitei / English'
    },
    {
        id: 'meghalaya',
        region: 'Meghalaya',
        board: 'Meghalaya Board',
        secondLanguage: 'Khasi / Garo / Hindi'
    },
    {
        id: 'mizoram',
        region: 'Mizoram',
        board: 'Mizoram Board',
        secondLanguage: 'Mizo / Hindi'
    },
    {
        id: 'nagaland',
        region: 'Nagaland',
        board: 'Nagaland Board',
        secondLanguage: 'English / Tenyidie'
    },
    {
        id: 'sikkim',
        region: 'Sikkim',
        board: 'Sikkim Board',
        secondLanguage: 'Nepali / Hindi'
    },
    {
        id: 'tripura',
        region: 'Tripura',
        board: 'Tripura Board',
        secondLanguage: 'Bengali / Kokborok'
    },
    {
        id: 'uttarakhand',
        region: 'Uttarakhand',
        board: 'Uttarakhand Board',
        secondLanguage: 'Hindi / Sanskrit',
        seniorLanguagePattern: FULL_100,
        seniorMathPattern: FULL_100,
        seniorNonPracticalPattern: FULL_100
    }
];

function buildAdditionalStateTemplates(config) {
    const secondaryOtherPattern = config.secondaryOtherPattern || THEORY_80_INTERNAL_20;
    const secondarySciencePattern = config.secondarySciencePattern || THEORY_70_PRACTICAL_30;
    const seniorSciencePattern = config.seniorSciencePattern || THEORY_70_PRACTICAL_30;
    const seniorNonPracticalPattern = config.seniorNonPracticalPattern || THEORY_80_INTERNAL_20;
    const seniorLanguagePattern = config.seniorLanguagePattern || seniorNonPracticalPattern;
    const seniorMathPattern = config.seniorMathPattern || seniorNonPracticalPattern;

    return [
        createClass10Template({
            id: `${config.id}-class-10`,
            board: config.board,
            region: config.region,
            title: `${config.region} Class 10`,
            menuLabel: '10th Board',
            description: `Simple class 10 layout for ${config.region}.`,
            formulas: [getFormulaLabel(secondaryOtherPattern), getFormulaLabel(secondarySciencePattern)],
            tags: [config.region.toLowerCase(), 'class 10', 'secondary'],
            subjects: buildSecondarySubjects({
                secondLanguage: config.secondLanguage,
                secondLanguagePattern: secondaryOtherPattern,
                mathPattern: secondaryOtherPattern,
                sciencePattern: secondarySciencePattern,
                socialPattern: secondaryOtherPattern,
                electivePattern: secondaryOtherPattern,
                electiveName: 'Computer / Elective'
            })
        }),
        createSeniorTemplate({
            id: `${config.id}-intermediate-science`,
            board: config.board,
            region: config.region,
            title: `${config.region} Intermediate Science`,
            stream: 'Science',
            streamKey: 'science',
            menuLabel: 'Science',
            description: `Science stream template for ${config.region}.`,
            formulas: [getFormulaLabel(seniorLanguagePattern), getFormulaLabel(seniorSciencePattern)],
            tags: [config.region.toLowerCase(), 'intermediate', 'science'],
            subjects: buildScienceSubjects({
                languagePattern: seniorLanguagePattern,
                mathPattern: seniorMathPattern,
                fifthSubjectName: 'Biology',
                fifthSubjectPattern: seniorSciencePattern,
                physicsPattern: seniorSciencePattern,
                chemistryPattern: seniorSciencePattern
            })
        }),
        createSeniorTemplate({
            id: `${config.id}-intermediate-commerce`,
            board: config.board,
            region: config.region,
            title: `${config.region} Intermediate Commerce`,
            stream: 'Commerce',
            streamKey: 'commerce',
            menuLabel: 'Commerce',
            description: `Commerce stream template for ${config.region}.`,
            formulas: [getFormulaLabel(seniorNonPracticalPattern)],
            tags: [config.region.toLowerCase(), 'intermediate', 'commerce'],
            subjects: buildCommerceSubjects({
                languagePattern: seniorLanguagePattern,
                accountancyPattern: seniorNonPracticalPattern,
                businessPattern: seniorNonPracticalPattern,
                economicsPattern: seniorNonPracticalPattern,
                fifthSubjectName: 'Mathematics / Computer',
                fifthSubjectPattern: seniorMathPattern
            })
        }),
        createSeniorTemplate({
            id: `${config.id}-intermediate-arts`,
            board: config.board,
            region: config.region,
            title: `${config.region} Intermediate Arts`,
            stream: 'Arts',
            streamKey: 'humanities',
            menuLabel: 'Arts',
            description: `Arts and humanities template for ${config.region}.`,
            formulas: [getFormulaLabel(seniorNonPracticalPattern)],
            tags: [config.region.toLowerCase(), 'intermediate', 'arts', 'humanities'],
            subjects: buildHumanitiesSubjects({
                languagePattern: seniorLanguagePattern,
                historyPattern: seniorNonPracticalPattern,
                politicalSciencePattern: seniorNonPracticalPattern,
                economicsPattern: seniorNonPracticalPattern,
                fifthSubjectName: 'Geography',
                fifthSubjectPattern: seniorNonPracticalPattern
            })
        })
    ];
}

boardTemplates.push(...additionalStateTemplateConfigs.flatMap(buildAdditionalStateTemplates));

// --- DOM ELEMENTS ---
// Modals
const settingsModal = document.getElementById('settings-modal');
const templatesModal = document.getElementById('templates-modal');
const closeModals = document.querySelectorAll('.close-modal');
const topbar = document.querySelector('.topbar');
const dashboardScroll = document.querySelector('.dashboard-scroll');
const sidebar = document.querySelector('.sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

// Buttons
const btnSettings = document.getElementById('btn-settings');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const btnTemplates = document.getElementById('btn-templates');
const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
const btnSidebarClose = document.getElementById('btn-sidebar-close');
const btnExportMenu = document.getElementById('btn-export-menu');
const exportMenu = document.getElementById('export-menu');
const btnAddSubject = document.getElementById('btn-add-subject');

// Forms & Tabs
const addStudentForm = document.getElementById('add-student-form');
const addSubjectForm = document.getElementById('add-subject-form');
const settingsForm = document.getElementById('settings-form');
const updateForm = document.getElementById('update-form');
const searchInput = document.getElementById('global-search');
const sortSelect = document.getElementById('sort-select');

const tabByStudent = document.getElementById('tab-by-student');
const tabBySubject = document.getElementById('tab-by-subject');

// Containers
const studentsBody = document.getElementById('students-body');
const emptyState = document.getElementById('empty-state');
const updateContainer = document.getElementById('update-container');
const studentFormInputs = document.getElementById('student-form-inputs');
const subjectSelect = document.getElementById('subject-select');
const subjectStudentsList = document.getElementById('subject-students-list');
const subjectsListContainer = document.getElementById('subjects-list');
const tableHeadRow = document.getElementById('table-head-row');
const updateFormInputs = document.getElementById('update-form-inputs');
const printHeadRow = document.getElementById('print-head-row');
const templateSearchInput = document.getElementById('template-search');
const templateFiltersContainer = document.getElementById('template-filters');
const templateLibrary = document.getElementById('template-library');
const templateCurrentSummary = document.getElementById('template-current-summary');

// --- INITIALIZATION ---
function init() {
    applyTheme(localStorage.getItem('theme') || 'light');
    applySidebarState();
    populateSettingsForm();
    renderSubjectManagement();
    renderForms();
    renderTemplateExperience();
    renderApp();
    setupEventListeners();
}

function saveState() {
    localStorage.setItem('studentsData', JSON.stringify(students));
    localStorage.setItem('gradeDashSettings', JSON.stringify(settings));
    renderForms();
    renderTemplateExperience();
    renderApp();
}

// --- LOGIC HELPER FUNCTIONS ---
function getTotalMark(student) {
    if (!student.marks) return 0;
    return Object.values(student.marks).reduce((sum, val) => sum + (val || 0), 0);
}

function getMaxTotalMarks() {
    return settings.subjects.reduce((sum, sub) => sum + (settings.subjectMaxMarks[sub] || 100), 0);
}

function hasPassed(student) {
    const total = getTotalMark(student);
    if (settings.qualifyType === 'marks') {
        return total >= settings.qualifyValue;
    } else {
        const max = getMaxTotalMarks();
        if (max === 0) return true;
        const percentage = (total / max) * 100;
        return percentage >= settings.qualifyValue;
    }
}

function getSortedStudents() {
    let sorted = [...students];
    const query = searchInput.value.toLowerCase().trim();
    
    if (query) {
        sorted = sorted.filter(s => s.name.toLowerCase().includes(query));
    }

    sorted.sort((a, b) => {
        const aTotal = getTotalMark(a);
        const bTotal = getTotalMark(b);
        switch (currentSort) {
            case 'entry-asc': return a.id - b.id;
            case 'entry-desc': return b.id - a.id;
            case 'marks-desc': return bTotal - aTotal;
            case 'marks-asc': return aTotal - bTotal;
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            default: return 0;
        }
    });
    return sorted;
}

// --- CUSTOM SELECT COMPONENT ---
function initCustomSelects() {
    document.querySelectorAll('select').forEach(select => {
        if (!select.classList.contains('custom-select-hidden')) {
            select.classList.add('custom-select-hidden');
        }
        
        // Remove existing custom select if re-rendering
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select')) {
            select.nextElementSibling.remove();
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select';
        
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        
        const textSpan = document.createElement('span');
        textSpan.className = 'custom-select-text';
        
        const selectedOption = select.options[select.selectedIndex];
        textSpan.textContent = selectedOption ? selectedOption.textContent : 'Select...';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-chevron-down custom-select-icon';
        
        trigger.appendChild(textSpan);
        trigger.appendChild(icon);
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'custom-select-options';
        
        Array.from(select.options).forEach(option => {
            if (option.disabled && option.value === "") return;
            const optDiv = document.createElement('div');
            optDiv.className = 'custom-option';
            if (option.selected) optDiv.classList.add('selected');
            optDiv.textContent = option.textContent;
            optDiv.dataset.value = option.value;
            
            optDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                textSpan.textContent = option.textContent;
                optionsDiv.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
                optDiv.classList.add('selected');
                select.value = option.value;
                select.dispatchEvent(new Event('change'));
                wrapper.classList.remove('open');
            });
            optionsDiv.appendChild(optDiv);
        });
        
        wrapper.appendChild(trigger);
        wrapper.appendChild(optionsDiv);
        
        select.parentNode.insertBefore(wrapper, select.nextSibling);
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            document.querySelectorAll('.custom-select').forEach(el => el.classList.remove('open'));
            if (!isOpen) wrapper.classList.add('open');
        });
    });
}

document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach(el => el.classList.remove('open'));
});

// --- RENDER FUNCTIONS ---
function renderForms() {
    // By Student form
    const studentInputsHTML = settings.subjects.map(sub => `
        <div class="form-group" style="flex: 1; min-width: 100px; margin-bottom: 0;">
            <label style="margin-bottom: 6px;">${sub} (Max ${settings.subjectMaxMarks[sub] || 100})</label>
            <input type="number" class="student-subject-input" data-subject="${sub}" required min="0" max="${settings.subjectMaxMarks[sub] || 100}" placeholder="0">
        </div>
    `).join('');
    
    // Inject before the add button
    const btnHTML = `<button type="submit" class="btn btn-primary" style="height: 44px; padding: 0 32px; flex: none;"><i class="fas fa-plus"></i> Add</button>`;
    
    studentFormInputs.innerHTML = `
        <div class="form-group" style="flex: 2; min-width: 150px; margin-bottom: 0;">
            <label style="margin-bottom: 6px;">Student Name</label>
            <input type="text" id="student-name" required placeholder="e.g. John Doe" autocomplete="off">
        </div>
        ${studentInputsHTML}
        ${btnHTML}
    `;

    // Subject dropdown
    subjectSelect.innerHTML = `<option value="" disabled selected>Choose...</option>` + 
        settings.subjects.map(sub => `<option value="${sub}">${sub}</option>`).join('');
        
    subjectStudentsList.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; margin-top: 8px;">Select a subject to enter marks for all students.</p>`;
    
    // Table Headers
    const headersHTML = `
        <th>Student Details</th>
        ${settings.subjects.map(sub => `<th>${sub}</th>`).join('')}
        <th>Total Marks</th>
        <th>Percentage</th>
        <th>Status</th>
        <th class="text-right">Actions</th>
    `;
    tableHeadRow.innerHTML = headersHTML;
    
    // Print Headers
    const printHeadersHTML = `
        <th style="padding: 10px;">Name</th>
        ${settings.subjects.map(sub => `<th style="padding: 10px;">${sub}</th>`).join('')}
        <th style="padding: 10px;">Total</th>
        <th style="padding: 10px;">%</th>
        <th style="padding: 10px;">Status</th>
    `;
    printHeadRow.innerHTML = printHeadersHTML;
    
    initCustomSelects();
}

function renderSubjectManagement() {
    subjectsListContainer.innerHTML = settings.subjects.map(sub => `
        <div style="display: flex; gap: 8px; align-items: center;">
            <span class="subject-tag" style="flex: 1; margin: 0; display: flex; justify-content: space-between;">
                ${sub}
                <button type="button" onclick="deleteSubject('${sub}')"><i class="fas fa-times"></i></button>
            </span>
            <div style="display: flex; align-items: center; gap: 6px;">
                <label style="margin: 0; font-size: 11px;">Max:</label>
                <input type="number" class="subject-max-mark-input" data-subject="${sub}" value="${settings.subjectMaxMarks[sub] || 100}" min="1" style="width: 70px; height: 32px;" onchange="updateSubjectMax('${sub}', this.value)">
            </div>
        </div>
    `).join('');
}

window.updateSubjectMax = function(sub, val) {
    settings.subjectMaxMarks[sub] = parseInt(val) || 100;
    saveState();
}

function renderApp() {
    const sorted = getSortedStudents();
    renderTable(sorted);
    renderMetrics(sorted);
    renderPodium();
}

function renderTable(data) {
    if (data.length === 0) {
        studentsBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    const maxTotal = getMaxTotalMarks();
    
    studentsBody.innerHTML = data.map(s => {
        const pass = hasPassed(s);
        const total = getTotalMark(s);
        const percentage = maxTotal === 0 ? "0.0" : ((total / maxTotal) * 100).toFixed(1);
        
        const subjectCells = settings.subjects.map(sub => `
            <td data-label="${sub}">${s.marks && s.marks[sub] !== undefined ? s.marks[sub] : '-'}</td>
        `).join('');
        
        return `
            <tr>
                <td data-label="Student" style="font-weight: 500;">${s.name}</td>
                ${subjectCells}
                <td data-label="Total Marks">${total} <span style="color:var(--text-muted);font-size:11px;">/ ${maxTotal}</span></td>
                <td data-label="Percentage">${percentage}%</td>
                <td data-label="Status"><span class="badge ${pass ? 'pass' : 'fail'}">${pass ? 'Qualified' : 'Failed'}</span></td>
                <td data-label="Actions" class="actions-cell">
                    <button class="btn-action edit" onclick="prepareUpdate(${s.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-action delete" onclick="deleteStudent(${s.id})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderMetrics(data) {
    document.getElementById('kpi-total').textContent = students.length;
    
    if (students.length === 0) {
        document.getElementById('kpi-passed').textContent = '0';
        document.getElementById('kpi-failed').textContent = '0';
        document.getElementById('kpi-average').textContent = '0';
        return;
    }

    const passed = students.filter(s => hasPassed(s)).length;
    const failed = students.length - passed;
    const sum = students.reduce((acc, curr) => acc + getTotalMark(curr), 0);
    const avg = (sum / students.length).toFixed(1);

    document.getElementById('kpi-passed').textContent = passed;
    document.getElementById('kpi-failed').textContent = failed;
    document.getElementById('kpi-average').textContent = avg;
    
    document.getElementById('kpi-pass-rate').textContent = `${((passed / students.length) * 100).toFixed(0)}% Pass Rate`;
    document.getElementById('kpi-fail-rate').textContent = `${((failed / students.length) * 100).toFixed(0)}% Fail Rate`;
}

function renderPodium() {
    const topStudents = [...students].sort((a, b) => getTotalMark(b) - getTotalMark(a)).slice(0, 3);
    
    const updateRank = (rank, data) => {
        document.getElementById(`rank${rank}-name`).textContent = data ? data.name : '-';
        document.getElementById(`rank${rank}-mark`).textContent = data ? `${getTotalMark(data)} pts` : '-';
    };

    updateRank(1, topStudents[0]);
    updateRank(2, topStudents[1]);
    updateRank(3, topStudents[2]);
}

function populateSettingsForm() {
    const typeSelect = document.getElementById('setting-qualify-type');
    typeSelect.value = settings.qualifyType;
    document.getElementById('setting-qualify-value').value = settings.qualifyValue;
    
    if (typeSelect.nextElementSibling && typeSelect.nextElementSibling.classList.contains('custom-select')) {
        const textSpan = typeSelect.nextElementSibling.querySelector('.custom-select-text');
        textSpan.textContent = typeSelect.options[typeSelect.selectedIndex].textContent;
        typeSelect.nextElementSibling.querySelectorAll('.custom-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === settings.qualifyType);
        });
    }
}

function getCurrentSettingsSignature() {
    const currentSubjects = settings.subjects.map(sub => ({
        name: sub,
        max: settings.subjectMaxMarks[sub] || 100
    }));
    return buildTemplateSignature(currentSubjects);
}

function getReadyStateCount() {
    return new Set(boardTemplates.filter(template => template.region !== 'National').map(template => template.region)).size;
}

function getTemplateLevelHeading(groupKey) {
    return groupKey === 'secondary' ? 'Pick a state for class 10' : 'Pick a state, then choose a stream';
}

function getTemplateRegionSortIndex(region) {
    const index = TEMPLATE_REGION_ORDER.indexOf(region);
    return index === -1 ? TEMPLATE_REGION_ORDER.length : index;
}

function getTemplateDisplayLabel(template) {
    if (template.menuLabel) return template.menuLabel;
    if (template.group === 'secondary') return '10th Board';
    if (template.streamKey === 'humanities') return 'Arts / Humanities';
    return template.stream || template.title;
}

function getTemplateDisplayMeta(template) {
    return `${template.subjects.length} subjects · ${template.totalMarks} max`;
}

function getTemplateFormulaText(template) {
    return (template.formulas || []).slice(0, 3).join(' · ');
}

function getTemplateStateLabel(region) {
    return region === 'National' ? 'CBSE' : region;
}

function getTemplateStateBoardLabel(region, templates) {
    if (region === 'National') return 'National Board';
    return templates[0].board;
}

function sortTemplatesForDisplay(a, b) {
    const streamOrder = ['General', 'MPC', 'BiPC', 'PCM', 'PCB', 'Science', 'CEC', 'MEC', 'Commerce', 'HEC', 'Humanities', 'Arts'];
    const aIndex = streamOrder.indexOf(a.stream);
    const bIndex = streamOrder.indexOf(b.stream);
    const safeAIndex = aIndex === -1 ? streamOrder.length : aIndex;
    const safeBIndex = bIndex === -1 ? streamOrder.length : bIndex;

    if (safeAIndex !== safeBIndex) return safeAIndex - safeBIndex;
    return a.title.localeCompare(b.title);
}

function renderCurrentTemplateSummary() {
    const subjectPreview = settings.subjects.slice(0, 3).map(sub => `${sub} ${settings.subjectMaxMarks[sub] || 100}`).join(', ');
    const remainingCount = Math.max(settings.subjects.length - 3, 0);

    templateCurrentSummary.innerHTML = `
        <div class="template-summary-strip">
            <span class="template-summary-pill"><strong>Current setup:</strong> ${settings.subjects.length} entries</span>
            <span class="template-summary-pill"><strong>Total max:</strong> ${getMaxTotalMarks()}</span>
            <span class="template-summary-pill"><strong>Ready:</strong> ${getReadyStateCount()} states + CBSE</span>
        </div>
        <p class="template-summary-note">
            ${subjectPreview ? `Current subjects: ${subjectPreview}${remainingCount > 0 ? `, +${remainingCount} more` : ''}.` : 'No subjects configured yet.'}
        </p>
    `;
}

function renderTemplateExperience() {
    templateStep = 'level';
    selectedLevel = null;
    selectedBranch = null;
    templateSearchQuery = '';
    document.getElementById('template-search').value = '';
    renderTemplateWizard();
}

function renderTemplateWizard() {
    renderCurrentTemplateSummary();
    const toolbar = document.getElementById('template-toolbar');
    const backBtn = document.getElementById('template-back-btn');
    const title = document.getElementById('template-modal-title');
    const desc = document.getElementById('template-modal-desc');

    if (templateStep === 'level') {
        toolbar.classList.add('hidden');
        backBtn.classList.add('hidden');
        title.textContent = 'Pick a template';
        desc.textContent = 'Choose an educational level.';
        renderLevelSelection();
    } else if (templateStep === 'board') {
        toolbar.classList.remove('hidden');
        backBtn.classList.remove('hidden');
        title.textContent = TEMPLATE_GROUPS[selectedLevel].title;
        desc.textContent = TEMPLATE_GROUPS[selectedLevel].description;
        renderBoardSelection();
    } else if (templateStep === 'branch') {
        toolbar.classList.remove('hidden');
        backBtn.classList.remove('hidden');
        title.textContent = 'Engineering Branches';
        desc.textContent = 'Search and select your branch.';
        renderBranchSelection();
    } else if (templateStep === 'semester') {
        toolbar.classList.add('hidden');
        backBtn.classList.remove('hidden');
        title.textContent = selectedBranch.name;
        desc.textContent = 'Select a semester to apply.';
        renderSemesterSelection();
    }
}

function renderLevelSelection() {
    templateLibrary.innerHTML = `
        <div class="wizard-grid">
            <div class="wizard-card" onclick="goToWizardStep('board', 'secondary')">
                <i class="fas fa-school"></i>
                <h3>10th Class</h3>
                <p>CBSE, SSC, SSLC, etc.</p>
            </div>
            <div class="wizard-card" onclick="goToWizardStep('board', 'intermediate')">
                <i class="fas fa-university"></i>
                <h3>Intermediate</h3>
                <p>State Boards, CBSE 11/12</p>
            </div>
            <div class="wizard-card" onclick="goToWizardStep('branch', 'engineering')">
                <i class="fas fa-laptop-code"></i>
                <h3>Engineering</h3>
                <p>B.Tech Semesters 1-8</p>
            </div>
        </div>
    `;
}

function goToWizardStep(step, levelOrBranch) {
    if (step === 'board') {
        selectedLevel = levelOrBranch;
    } else if (step === 'branch') {
        selectedLevel = 'engineering';
    } else if (step === 'semester') {
        selectedBranch = levelOrBranch;
    }
    templateStep = step;
    templateSearchQuery = '';
    document.getElementById('template-search').value = '';
    renderTemplateWizard();
}

function goBackWizardStep() {
    if (templateStep === 'board' || templateStep === 'branch') {
        templateStep = 'level';
    } else if (templateStep === 'semester') {
        templateStep = 'branch';
    }
    templateSearchQuery = '';
    document.getElementById('template-search').value = '';
    renderTemplateWizard();
}

function renderBoardSelection() {
    const currentSignature = getCurrentSettingsSignature();
    const visibleTemplates = boardTemplates.filter(template => {
        if (template.group !== selectedLevel) return false;
        if (templateSearchQuery && !template.searchText.includes(templateSearchQuery)) return false;
        return true;
    });

    const templatesByRegion = visibleTemplates.reduce((groups, template) => {
        if (!groups[template.region]) groups[template.region] = [];
        groups[template.region].push(template);
        return groups;
    }, {});

    const stateCards = Object.keys(templatesByRegion)
        .sort((a, b) => getTemplateRegionSortIndex(a) - getTemplateRegionSortIndex(b) || a.localeCompare(b))
        .map(region => {
            const stateTemplates = templatesByRegion[region].sort(sortTemplatesForDisplay);
            return `
                <article class="template-state-card">
                    <div class="template-state-heading">
                        <div>
                            <h4>${getTemplateStateLabel(region)}</h4>
                            <p>${getTemplateStateBoardLabel(region, stateTemplates)}</p>
                        </div>
                        <span class="template-state-count">${stateTemplates.length} option${stateTemplates.length === 1 ? '' : 's'}</span>
                    </div>
                    <div class="template-option-list">
                        ${stateTemplates.map(template => {
                            const isCurrent = template.signature === currentSignature;
                            return `
                                <button
                                    type="button"
                                    class="template-option ${isCurrent ? 'is-current' : ''}"
                                    ${isCurrent ? 'disabled' : ''}
                                    onclick="applyTemplate('${template.id}')">
                                    <span class="template-option-main">
                                        <strong>${getTemplateDisplayLabel(template)}</strong>
                                        <small>${getTemplateDisplayMeta(template)}</small>
                                    </span>
                                    <span class="template-option-formula">${getTemplateFormulaText(template)}</span>
                                    <span class="template-option-action">${isCurrent ? 'Loaded' : 'Use'}</span>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </article>
            `;
        }).join('');

    templateLibrary.innerHTML = stateCards ? `<div class="template-state-grid">${stateCards}</div>` : `
        <div class="template-empty-state">
            <i class="fas fa-compass"></i>
            <h3>No templates match that search</h3>
            <p>Try searching for a different state or board.</p>
        </div>
    `;
}

function renderBranchSelection() {
    const visibleBranches = engineeringData.filter(branch => {
        if (!templateSearchQuery) return true;
        return branch.name.toLowerCase().includes(templateSearchQuery);
    });

    const branchList = visibleBranches.map(branch => {
        // Find how many semesters have data
        const semCount = Object.keys(branch.semesters).length;
        return `
            <div class="branch-item" onclick="goToWizardStep('semester', engineeringData.find(b => b.name === '${branch.name}'))">
                <span>${branch.name}</span>
                <span style="font-size: 13px; color: var(--text-muted); font-weight: normal;">${semCount} Semesters <i class="fas fa-chevron-right" style="margin-left: 8px;"></i></span>
            </div>
        `;
    }).join('');

    templateLibrary.innerHTML = branchList ? `<div class="branch-list">${branchList}</div>` : `
        <div class="template-empty-state">
            <i class="fas fa-compass"></i>
            <h3>No branches found</h3>
            <p>Try searching for a different branch name.</p>
        </div>
    `;
}

function renderSemesterSelection() {
    const semesters = Object.keys(selectedBranch.semesters).sort((a, b) => parseInt(a) - parseInt(b));
    
    const semCards = semesters.map(sem => {
        const subjects = selectedBranch.semesters[sem];
        return `
            <div class="wizard-card" onclick="applyEngineeringTemplate('${selectedBranch.name}', ${sem})" style="padding: 16px;">
                <h3 style="margin-bottom: 8px;">Semester ${sem}</h3>
                <p>${subjects.length} Subjects</p>
            </div>
        `;
    }).join('');

    templateLibrary.innerHTML = `<div class="wizard-grid">${semCards}</div>`;
}

function applyEngineeringTemplate(branchName, semester) {
    const branch = engineeringData.find(b => b.name === branchName);
    const subjects = branch.semesters[semester];
    
    const message = [
        `Apply ${branchName} - Semester ${semester}?`,
        '',
        'This will replace your current subjects.',
        'Some marks may reset if the subject names change.'
    ].join('\n');

    if (!confirm(message)) return;

    const nextSubjects = [...subjects];
    const nextSubjectMaxMarks = {};
    nextSubjects.forEach(sub => nextSubjectMaxMarks[sub] = 100);

    settings.subjects = nextSubjects;
    settings.subjectMaxMarks = nextSubjectMaxMarks;

    students = students.map(student => {
        const previousMarks = student.marks || {};
        const nextMarks = {};

        nextSubjects.forEach(subject => {
            const rawValue = parseInt(previousMarks[subject], 10);
            const safeValue = Number.isFinite(rawValue) ? rawValue : 0;
            nextMarks[subject] = Math.min(Math.max(safeValue, 0), 100);
        });

        return { ...student, marks: nextMarks };
    });

    editingId = null;
    updateContainer.classList.add('hidden');

    saveState();
    renderSubjectManagement();
    templatesModal.classList.add('hidden');
    showToast(`Semester ${semester} loaded successfully!`);
}

window.applyTemplate = function(templateId) {
    const template = boardTemplates.find(item => item.id === templateId);
    if (!template) return;

    const message = [
        `Apply "${template.title}"?`,
        '',
        'This will replace your current subjects and max marks.',
        'Some marks may reset if the subject names change.'
    ].join('\n');

    if (!confirm(message)) return;

    const nextSubjects = template.subjects.map(subject => subject.name);
    const nextSubjectMaxMarks = {};

    template.subjects.forEach(subject => {
        nextSubjectMaxMarks[subject.name] = subject.max;
    });

    settings.subjects = nextSubjects;
    settings.subjectMaxMarks = nextSubjectMaxMarks;

    students = students.map(student => {
        const previousMarks = student.marks || {};
        const nextMarks = {};

        template.subjects.forEach(subject => {
            const rawValue = parseInt(previousMarks[subject.name], 10);
            const safeValue = Number.isFinite(rawValue) ? rawValue : 0;
            nextMarks[subject.name] = Math.min(Math.max(safeValue, 0), subject.max);
        });

        return { ...student, marks: nextMarks };
    });

    editingId = null;
    updateContainer.classList.add('hidden');

    saveState();
    renderSubjectManagement();
    templatesModal.classList.add('hidden');
    showToast(`${template.title} loaded successfully!`);
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Pull to refresh logic
    let touchStartY = 0;
    let ptrContainer = document.createElement('div');
    ptrContainer.className = 'ptr-container';
    ptrContainer.innerHTML = '<div class="ptr-spinner"><i class="fas fa-sync-alt"></i></div>';
    document.body.appendChild(ptrContainer);
    
    let ptrSpinner = ptrContainer.querySelector('.ptr-spinner');
    let isPulling = false;

    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            touchStartY = e.touches[0].clientY;
            isPulling = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        const touchY = e.touches[0].clientY;
        const diff = touchY - touchStartY;
        
        if (diff > 0 && window.scrollY === 0) {
            e.preventDefault(); // Prevent default scroll
            ptrContainer.style.height = Math.min(diff, 100) + 'px';
            ptrSpinner.style.transform = `translateY(${Math.max(100 - diff, 0)}%)`;
            ptrSpinner.style.opacity = Math.min(diff / 100, 1);
            if (diff > 80) ptrSpinner.style.color = 'var(--primary)';
            else ptrSpinner.style.color = 'var(--text-muted)';
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (!isPulling) return;
        isPulling = false;
        
        const currentHeight = parseInt(ptrContainer.style.height || '0');
        if (currentHeight > 80) {
            // Trigger refresh
            ptrSpinner.classList.add('spinning');
            ptrContainer.style.height = '60px';
            ptrSpinner.style.transform = 'translateY(0)';
            
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            // Cancel refresh
            ptrContainer.style.height = '0';
            ptrSpinner.style.transform = 'translateY(100%)';
        }
    });

    document.querySelectorAll('.menu-item[href="#"]').forEach(link => {
        link.addEventListener('click', (e) => e.preventDefault());
    });

    dashboardScroll.addEventListener('scroll', syncTopbarState, { passive: true });
    syncTopbarState();

    btnSidebarToggle.addEventListener('click', toggleSidebar);
    btnSidebarClose.addEventListener('click', closeSidebar);
    sidebarBackdrop.addEventListener('click', closeSidebar);
    window.addEventListener('resize', applySidebarState);

    // Modals
    btnSettings.addEventListener('click', (e) => {
        e.preventDefault();
        if (isMobileViewport()) closeSidebar();
        settingsModal.classList.remove('hidden');
    });

    document.getElementById('template-back-btn').addEventListener('click', goBackWizardStep);
    
    // Search input listener update
    document.getElementById('template-search').addEventListener('input', (e) => {
        templateSearchQuery = e.target.value.toLowerCase().trim();
        renderTemplateWizard();
    });

    btnTemplates.addEventListener('click', (e) => {
        e.preventDefault();
        if (isMobileViewport()) closeSidebar();
        renderTemplateExperience();
        templatesModal.classList.remove('hidden');
        templateSearchInput.focus();
    });
    
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            const overlay = btn.closest('.modal-overlay');
            if (overlay) overlay.classList.add('hidden');
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            closeSidebar();
        }
    });

    // Theme
    btnThemeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (isMobileViewport()) closeSidebar();
        const current = document.body.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
    });

    // Tabs
    tabByStudent.addEventListener('click', () => {
        tabByStudent.classList.add('active');
        tabBySubject.classList.remove('active');
        addStudentForm.classList.remove('hidden');
        addSubjectForm.classList.add('hidden');
    });

    tabBySubject.addEventListener('click', () => {
        tabBySubject.classList.add('active');
        tabByStudent.classList.remove('active');
        addSubjectForm.classList.remove('hidden');
        addStudentForm.classList.add('hidden');
    });

    // Forms
    addStudentForm.addEventListener('submit', handleAddStudent);
    addSubjectForm.addEventListener('submit', handleAddSubjectMarks);
    
    subjectSelect.addEventListener('change', (e) => {
        const sub = e.target.value;
        if (!sub) return;
        
        if (students.length === 0) {
            subjectStudentsList.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No students added yet.</p>`;
            return;
        }

        const maxMark = settings.subjectMaxMarks[sub] || 100;
        subjectStudentsList.innerHTML = `<p style="margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Max Marks: ${maxMark}</p>` + students.map(s => `
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
                <label style="margin: 0; width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.name}</label>
                <input type="number" data-id="${s.id}" class="subject-student-mark-input" value="${s.marks && s.marks[sub] !== undefined ? s.marks[sub] : ''}" required min="0" max="${maxMark}" placeholder="0" style="width: 80px; height: 32px;">
            </div>
        `).join('');
    });

    settingsForm.addEventListener('submit', handleSettings);
    updateForm.addEventListener('submit', handleUpdate);
    document.getElementById('cancel-update').addEventListener('click', () => {
        updateContainer.classList.add('hidden');
    });

    // Subjects
    btnAddSubject.addEventListener('click', () => {
        const input = document.getElementById('new-subject-name');
        const maxInput = document.getElementById('new-subject-max');
        const val = input.value.trim();
        const maxVal = parseInt(maxInput.value) || 100;
        
        if (val && !settings.subjects.includes(val)) {
            settings.subjects.push(val);
            settings.subjectMaxMarks[val] = maxVal;
            input.value = '';
            maxInput.value = '100';
            
            // Give existing students 0 for new subject
            students.forEach(s => {
                if (!s.marks) s.marks = {};
                s.marks[val] = 0;
            });
            
            saveState();
            renderSubjectManagement();
        }
    });

    // Interactions
    searchInput.addEventListener('input', renderApp);
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderApp();
    });



    // Export Dropdown
    btnExportMenu.addEventListener('click', () => exportMenu.classList.toggle('hidden'));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.export-dropdown')) exportMenu.classList.add('hidden');
    });

    exportMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const format = e.currentTarget.dataset.format;
            exportData(format);
            exportMenu.classList.add('hidden');
        });
    });
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const iconClass = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    const label = theme === 'dark' ? 'Light Mode' : 'Dark Mode';

    btnThemeToggle.title = label;
    btnThemeToggle.setAttribute('aria-label', label);
    btnThemeToggle.innerHTML = `<i class="${iconClass}"></i> <span>${label}</span>`;
}

function syncTopbarState() {
    topbar.classList.toggle('scrolled', dashboardScroll.scrollTop > 8);
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.classList.add('hidden');
    });
}

function isMobileViewport() {
    return typeof window !== 'undefined' && typeof window.innerWidth === 'number'
        ? window.innerWidth <= 768
        : false;
}

function updateSidebarToggleButton() {
    const sidebarIsOpen = document.body.classList.contains('sidebar-open');
    const sidebarIsCollapsed = document.body.classList.contains('sidebar-collapsed');

    if (isMobileViewport()) {
        btnSidebarToggle.innerHTML = `<i class="fas ${sidebarIsOpen ? 'fa-times' : 'fa-bars'}"></i> <span>${sidebarIsOpen ? 'Close' : 'Menu'}</span>`;
        btnSidebarToggle.setAttribute('aria-label', sidebarIsOpen ? 'Close menu' : 'Open menu');
        return;
    }

    btnSidebarToggle.innerHTML = `<i class="fas ${sidebarIsCollapsed ? 'fa-bars' : 'fa-chevron-left'}"></i> <span>${sidebarIsCollapsed ? 'Show Menu' : 'Hide Menu'}</span>`;
    btnSidebarToggle.setAttribute('aria-label', sidebarIsCollapsed ? 'Show menu' : 'Hide menu');
}

function applySidebarState() {
    const savedCollapsed = localStorage.getItem('gradeDashSidebarCollapsed') === 'true';

    if (isMobileViewport()) {
        document.body.classList.remove('sidebar-collapsed');
    } else {
        document.body.classList.toggle('sidebar-collapsed', savedCollapsed);
        document.body.classList.remove('sidebar-open');
    }

    updateSidebarToggleButton();
}

function openSidebar() {
    document.body.classList.add('sidebar-open');
    updateSidebarToggleButton();
}

function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    updateSidebarToggleButton();
}

function toggleSidebar() {
    if (isMobileViewport()) {
        if (document.body.classList.contains('sidebar-open')) closeSidebar();
        else openSidebar();
        return;
    }

    const nextCollapsed = !document.body.classList.contains('sidebar-collapsed');
    document.body.classList.toggle('sidebar-collapsed', nextCollapsed);
    localStorage.setItem('gradeDashSidebarCollapsed', String(nextCollapsed));
    updateSidebarToggleButton();
}

// --- CRUD OPERATIONS ---
window.deleteSubject = function(sub) {
    if (confirm(`Delete subject '${sub}'?`)) {
        settings.subjects = settings.subjects.filter(s => s !== sub);
        students.forEach(s => {
            if (s.marks) delete s.marks[sub];
        });
        saveState();
        renderSubjectManagement();
    }
}

function handleAddStudent(e) {
    e.preventDefault();
    const name = document.getElementById('student-name').value.trim();
    
    let marks = {};
    const inputs = document.querySelectorAll('.student-subject-input');
    let hasError = false;
    inputs.forEach(input => {
        const sub = input.dataset.subject;
        const val = parseInt(input.value) || 0;
        const max = settings.subjectMaxMarks[sub] || 100;
        if (val > max) {
            showToast(`Error: ${sub} marks cannot exceed ${max}`);
            hasError = true;
        }
        marks[sub] = val;
    });

    if (hasError) return;

    if (name) {
        const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
        students.push({ id: newId, name, marks });
        saveState();
        addStudentForm.reset();
        document.getElementById('student-name').focus();
        showToast(`Added ${name} successfully!`);
    }
}

function handleAddSubjectMarks(e) {
    e.preventDefault();
    const sub = subjectSelect.value;
    if (!sub) return;
    const max = settings.subjectMaxMarks[sub] || 100;

    const inputs = document.querySelectorAll('.subject-student-mark-input');
    let hasError = false;
    inputs.forEach(input => {
        const val = parseInt(input.value) || 0;
        if (val > max) {
            showToast(`Error: marks for ${sub} cannot exceed ${max}`);
            hasError = true;
        }
    });
    
    if (hasError) return;

    inputs.forEach(input => {
        const id = parseInt(input.dataset.id);
        const val = parseInt(input.value) || 0;
        const student = students.find(s => s.id === id);
        if (student) {
            if (!student.marks) student.marks = {};
            student.marks[sub] = val;
        }
    });
    
    saveState();
    showToast(`Marks saved for ${sub}!`);
}

let editingId = null;
window.prepareUpdate = function(id) {
    const student = students.find(s => s.id === id);
    if (student) {
        editingId = id;
        document.getElementById('update-name').value = student.name;
        
        updateFormInputs.innerHTML = settings.subjects.map(sub => `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <label style="margin: 0;">${sub} (Max: ${settings.subjectMaxMarks[sub] || 100})</label>
                <input type="number" class="update-subject-input" data-subject="${sub}" required min="0" max="${settings.subjectMaxMarks[sub] || 100}" value="${student.marks && student.marks[sub] !== undefined ? student.marks[sub] : 0}" style="width: 100px;">
            </div>
        `).join('');
        
        updateContainer.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function handleUpdate(e) {
    e.preventDefault();
    if (editingId !== null) {
        const studentIndex = students.findIndex(s => s.id === editingId);
        if (studentIndex > -1) {
            const inputs = document.querySelectorAll('.update-subject-input');
            let hasError = false;
            let newMarks = { ...students[studentIndex].marks };
            inputs.forEach(input => {
                const sub = input.dataset.subject;
                const val = parseInt(input.value) || 0;
                const max = settings.subjectMaxMarks[sub] || 100;
                if (val > max) {
                    showToast(`Error: ${sub} marks cannot exceed ${max}`);
                    hasError = true;
                }
                newMarks[sub] = val;
            });
            
            if (hasError) return;
            
            students[studentIndex].marks = newMarks;
            saveState();
            updateContainer.classList.add('hidden');
            showToast('Marks updated successfully!');
            editingId = null;
        }
    }
}

window.deleteStudent = function(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id !== id);
        saveState();
        showToast('Student deleted.');
        if (editingId === id) updateContainer.classList.add('hidden');
    }
}

function handleSettings(e) {
    e.preventDefault();
    settings.qualifyType = document.getElementById('setting-qualify-type').value;
    settings.qualifyValue = parseInt(document.getElementById('setting-qualify-value').value);
    
    saveState();
    settingsModal.classList.add('hidden');
    showToast('Evaluation settings saved!');
}

// --- EXPORT LOGIC ---
function exportData(format) {
    const data = getSortedStudents();
    if (data.length === 0) {
        showToast('No data to export!');
        return;
    }

    if (format === 'docx') exportDOCX(data);
    else if (format === 'xlsx') exportExcel(data);
    else if (format === 'pdf') exportPDF(data);
}

async function exportDOCX(data) {
    if (typeof docx === 'undefined') {
        showToast('DOCX library still loading. Please try again in a moment.');
        return;
    }

    showToast('Generating DOCX...');

    const maxTotal = getMaxTotalMarks();

    const headerChildren = [
        new docx.TableCell({ children: [new docx.Paragraph({ text: "Name", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] })
    ];
    
    settings.subjects.forEach(sub => {
        headerChildren.push(new docx.TableCell({ children: [new docx.Paragraph({ text: sub, alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }));
    });
    
    headerChildren.push(
        new docx.TableCell({ children: [new docx.Paragraph({ text: "Total", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }),
        new docx.TableCell({ children: [new docx.Paragraph({ text: "Percentage", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] }),
        new docx.TableCell({ children: [new docx.Paragraph({ text: "Status", alignment: docx.AlignmentType.CENTER, heading: docx.HeadingLevel.HEADING_3 })] })
    );

    const tableRows = [new docx.TableRow({ children: headerChildren })];

    data.forEach(s => {
        const pass = hasPassed(s) ? 'Qualified' : 'Failed';
        const total = getTotalMark(s);
        const percent = maxTotal === 0 ? "0.0%" : ((total / maxTotal) * 100).toFixed(1) + '%';
        
        const rowChildren = [new docx.TableCell({ children: [new docx.Paragraph({ text: s.name })] })];
        
        settings.subjects.forEach(sub => {
            rowChildren.push(new docx.TableCell({ children: [new docx.Paragraph({ text: String(s.marks && s.marks[sub] !== undefined ? s.marks[sub] : '-'), alignment: docx.AlignmentType.CENTER })] }));
        });
        
        rowChildren.push(
            new docx.TableCell({ children: [new docx.Paragraph({ text: String(total), alignment: docx.AlignmentType.CENTER })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: percent, alignment: docx.AlignmentType.CENTER })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: pass, alignment: docx.AlignmentType.CENTER })] })
        );

        tableRows.push(new docx.TableRow({ children: rowChildren }));
    });

    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: [
                new docx.Paragraph({
                    text: "Student Performance Report",
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER
                }),
                new docx.Paragraph({
                    text: "Generated on " + new Date().toLocaleDateString(),
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new docx.Table({
                    rows: tableRows,
                    width: { size: 100, type: docx.WidthType.PERCENTAGE }
                })
            ]
        }]
    });

    try {
        const blob = await docx.Packer.toBlob(doc);
        downloadBlob(blob, 'student_report.docx');
    } catch (err) {
        showToast('Error generating DOCX');
        console.error(err);
    }
}

function exportExcel(data) {
    if (typeof XLSX === 'undefined') {
        showToast('Excel library still loading. Please try again in a moment.');
        return;
    }

    const maxTotal = getMaxTotalMarks();

    const exportData = data.map(s => {
        const total = getTotalMark(s);
        let row = { "Student Name": s.name };
        
        settings.subjects.forEach(sub => {
            row[sub] = s.marks && s.marks[sub] !== undefined ? s.marks[sub] : 0;
        });
        
        row["Total Marks"] = total;
        row["Percentage"] = maxTotal === 0 ? "0.0%" : ((total / maxTotal) * 100).toFixed(1) + '%';
        row["Status"] = hasPassed(s) ? 'Qualified' : 'Failed';
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "student_report.xlsx");
    showToast('Excel downloaded successfully');
}

function exportPDF(data) {
    if (typeof html2pdf === 'undefined') {
        showToast('PDF library still loading. Please try again in a moment.');
        return;
    }

    showToast('Generating PDF...');
    
    const template = document.getElementById('print-template');
    const tbody = document.getElementById('print-body');
    document.getElementById('print-date').textContent = new Date().toLocaleDateString();
    
    const maxTotal = getMaxTotalMarks();
    
    tbody.innerHTML = data.map(s => {
        const pass = hasPassed(s);
        const total = getTotalMark(s);
        const percent = maxTotal === 0 ? "0.0%" : ((total / maxTotal) * 100).toFixed(1) + '%';
        
        let subCells = settings.subjects.map(sub => `<td style="padding: 8px;">${s.marks && s.marks[sub] !== undefined ? s.marks[sub] : '-'}</td>`).join('');
        
        return `
            <tr>
                <td style="padding: 8px;">${s.name}</td>
                ${subCells}
                <td style="padding: 8px;">${total}</td>
                <td style="padding: 8px;">${percent}</td>
                <td style="padding: 8px; color: ${pass ? '#10B981' : '#EF4444'}">${pass ? 'Qualified' : 'Failed'}</td>
            </tr>
        `;
    }).join('');

    template.classList.remove('hidden');
    
    // Scale or orientation changes might be needed if there are many subjects
    const isLandscape = settings.subjects.length > 4;
    
    const opt = {
        margin:       0.5,
        filename:     'student_report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: isLandscape ? 'landscape' : 'portrait' }
    };

    html2pdf().set(opt).from(template).save().then(() => {
        template.classList.add('hidden');
        showToast('PDF generated successfully!');
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`${filename} downloaded successfully`);
}

// Toast
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Start
init();
