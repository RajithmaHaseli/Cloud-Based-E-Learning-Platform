export const courses = [
  {
    id: 1,
    title: "Cloud Computing Basics",
    instructor: "Mr. Perera",
    description: "Learn cloud computing concepts, services, and deployment models.",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    lessons: ["Cloud Introduction", "IaaS, PaaS, SaaS", "Virtualization"],
  },
  {
    id: 2,
    title: "Web Development",
    instructor: "Ms. Silva",
    description: "Learn HTML, CSS, JavaScript, and React basics.",
    video: "https://www.w3schools.com/html/movie.mp4",
    lessons: ["HTML Basics", "CSS Styling", "React Components"],
  },
  {
    id: 3,
    title: "Database Management",
    instructor: "Dr. Fernando",
    description: "Learn SQL, relational databases, and cloud database services.",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    lessons: ["SQL Basics", "Tables", "Cloud Databases"],
  },
];

export const quizQuestions = [
  {
    question: "What does IaaS stand for?",
    options: [
      "Internet as a Service",
      "Infrastructure as a Service",
      "Information as a Service",
      "Integration as a Service",
    ],
    answer: "Infrastructure as a Service",
  },
  {
    question: "Which service is used for object storage in AWS?",
    options: ["EC2", "S3", "RDS", "Lambda"],
    answer: "S3",
  },
];