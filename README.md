# SkyLearn - Cloud-Based E-Learning Platform 🌧️🌧️

A scalable cloud-native e-learning platform built with React (frontend) 
and Spring Boot (backend), deployed on AWS.

## Project Overview
SkyLearn supports course management, student enrollment, video lectures, 
and quiz assessments, deployed using AWS EC2, RDS, S3, and Application 
Load Balancer.

## Tech Stack ⚛️
- **Frontend:** React
- **Backend:** Spring Boot (Java), REST API
- **Database:** MySQL (Amazon RDS)
- **Storage:** Amazon S3
- **Infrastructure:** AWS EC2, ALB, VPC, IAM, CloudWatch

## Core Functions 🧑‍💻

### 1. User Management & Authentication
- Student and lecturer registration and login
- JWT-based secure authentication
- Role-based access control (Student, Lecturer, Admin)

### 2. Course Management
- Create, update, and delete courses (lecturer/admin)
- Browse and search available courses (student)
- Enroll in courses
- Add and manage lessons within a course

### 3. Video Content Delivery & AWS S3
- Upload and stream course lecture videos
- Secure video delivery via Amazon S3 storage
- Video Lecture Hub for organized content playback

### 4. Assessments, Progress Tracking & Notifications
- Create and manage quizzes and quiz questions
- Submit quiz answers and automatic scoring
- Track student progress across enrolled courses
- Assignment submission and grading

### 5. Admin Functions, Deployment, Security & Testing
- Lecturer/Admin hub for managing courses, students, and grades
- Assignment specification management
- Security group and firewall configuration
- API testing (Postman) and performance testing (JMeter, Lighthouse)
- Cloud deployment and monitoring (CloudWatch)

## Live Deployment
- Frontend: http://elearning-alb-2114866715.eu-north-1.elb.amazonaws.com
- Backend API: http://13.49.159.89:8080/api/

## Folder Structure
- `/Backend` - Spring Boot REST API source code
- `/Frontend` - React application source code
- `/aws-lambda-autograde` - Lambda function for auto-grading

## Setup Instructions ⚙️
1. Clone the repository
2. Backend: `cd Backend && mvn spring-boot:run`
3. Frontend: `cd Frontend && npm install && npm run dev`

## Team Members 
- S.H.R.H. Premarathne - 14624
- P M C N Fernando - 14618
- P.R.K. De Silva - 11376
- G.A.P.L.L.Ganihiachchi - 11344
- T.A.C.Dayangani - 11571

## Module
Cloud Computing - Group Project
