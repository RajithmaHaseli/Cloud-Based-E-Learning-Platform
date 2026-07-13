package com.elearning.config;

import com.elearning.model.Course;
import com.elearning.model.Lesson;
import com.elearning.model.QuizQuestion;
import com.elearning.model.User;
import com.elearning.repository.CourseRepository;
import com.elearning.repository.QuizQuestionRepository;
import com.elearning.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private QuizQuestionRepository quizQuestionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed default users if empty
        if (userRepository.count() == 0) {
            User student = new User();
            student.setName("Student Test");
            student.setEmail("student@elearning.com");
            student.setPassword(passwordEncoder.encode("password123"));
            student.setRole("student");
            userRepository.save(student);

            User instructor = new User();
            instructor.setName("Dr. Silva");
            instructor.setEmail("instructor@elearning.com");
            instructor.setPassword(passwordEncoder.encode("password123"));
            instructor.setRole("instructor");
            userRepository.save(instructor);

            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@elearning.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("admin");
            userRepository.save(admin);
        }

        // Seed courses if empty
        if (courseRepository.count() == 0) {
            Course c1 = new Course();
            c1.setTitle("Cloud Computing Basics");
            c1.setInstructor("Dr. Silva");
            c1.setDescription("Learn key cloud computing concepts, services, models, and architectures using AWS.");
            c1.setVideo("https://www.w3schools.com/html/mov_bbb.mp4");
            c1.setLessons(Arrays.asList(
                new Lesson(null, "Cloud Introduction"),
                new Lesson(null, "IaaS, PaaS, SaaS"),
                new Lesson(null, "Virtualization & Containers")
            ));
            Course savedC1 = courseRepository.save(c1);

            // Add quizzes for Course 1
            QuizQuestion q1 = new QuizQuestion();
            q1.setCourseId(savedC1.getId());
            q1.setQuestion("What does IaaS stand for?");
            q1.setOption1("Internet as a Service");
            q1.setOption2("Infrastructure as a Service");
            q1.setOption3("Information as a Service");
            q1.setOption4("Integration as a Service");
            q1.setCorrectAnswer("Infrastructure as a Service");
            quizQuestionRepository.save(q1);

            QuizQuestion q2 = new QuizQuestion();
            q2.setCourseId(savedC1.getId());
            q2.setQuestion("Which service is used for object storage in AWS?");
            q2.setOption1("EC2");
            q2.setOption2("S3");
            q2.setOption3("RDS");
            q2.setOption4("Lambda");
            q2.setCorrectAnswer("S3");
            quizQuestionRepository.save(q2);

            Course c2 = new Course();
            c2.setTitle("Web Development");
            c2.setInstructor("Mr. Perera");
            c2.setDescription("Learn standard modern web technologies including HTML, CSS, JavaScript, and React.");
            c2.setVideo("https://www.w3schools.com/html/movie.mp4");
            c2.setLessons(Arrays.asList(
                new Lesson(null, "HTML Basics"),
                new Lesson(null, "CSS Grid & Flexbox"),
                new Lesson(null, "React Components & State")
            ));
            courseRepository.save(c2);
        }
    }
}
