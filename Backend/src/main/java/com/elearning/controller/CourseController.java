package com.elearning.controller;

import com.elearning.model.Course;
import com.elearning.model.Lesson;
import com.elearning.model.QuizQuestion;
import com.elearning.repository.CourseRepository;
import com.elearning.repository.QuizQuestionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private QuizQuestionRepository quizQuestionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        return courseOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course) {
        Course savedCourse = courseRepository.save(course);
        syncQuizQuestions(savedCourse);
        return ResponseEntity.ok(savedCourse);
    }

    @PostMapping("/{id}/lessons")
    public ResponseEntity<Course> addLessonToCourse(@PathVariable Long id, @RequestBody Lesson lesson) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Course course = courseOpt.get();
        course.getLessons().add(lesson);
        Course updatedCourse = courseRepository.save(course);
        syncQuizQuestions(updatedCourse);
        return ResponseEntity.ok(updatedCourse);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody Course courseDetails) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Course course = courseOpt.get();
        course.setTitle(courseDetails.getTitle());
        course.setDescription(courseDetails.getDescription());
        course.setInstructor(courseDetails.getInstructor());
        course.setVideo(courseDetails.getVideo());
        if (courseDetails.getLessons() != null && !courseDetails.getLessons().isEmpty()) {
            course.getLessons().clear();
            course.getLessons().addAll(courseDetails.getLessons());
        }
        Course updated = courseRepository.save(course);
        syncQuizQuestions(updated);
        return ResponseEntity.ok(updated);
    }

    private void syncQuizQuestions(Course course) {
        if (course == null || course.getId() == null) {
            return;
        }

        // 1. Fetch and delete existing questions for this course
        List<QuizQuestion> existing = quizQuestionRepository.findByCourseId(course.getId());
        if (existing != null && !existing.isEmpty()) {
            quizQuestionRepository.deleteAll(existing);
        }

        // 2. Parse and save quiz questions from each lesson
        if (course.getLessons() != null) {
            for (Lesson lesson : course.getLessons()) {
                boolean parsedQuestions = false;

                // Parse questions from quizQuestionsJson
                if (lesson.getQuizQuestionsJson() != null && !lesson.getQuizQuestionsJson().trim().isEmpty()) {
                    try {
                        QuizQuestion[] questions = objectMapper.readValue(lesson.getQuizQuestionsJson(), QuizQuestion[].class);
                        if (questions != null) {
                            for (QuizQuestion q : questions) {
                                if (q.getQuestion() != null && !q.getQuestion().trim().isEmpty()) {
                                    q.setId(null); // Ensure a new entity is saved
                                    q.setCourseId(course.getId());
                                    quizQuestionRepository.save(q);
                                    parsedQuestions = true;
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Error parsing quizQuestionsJson: " + e.getMessage());
                    }
                }

                // Fallback to single legacy quiz fields if no questions were parsed and legacy fields are present
                if (!parsedQuestions && lesson.getQuizQuestion() != null && !lesson.getQuizQuestion().trim().isEmpty()) {
                    QuizQuestion q = new QuizQuestion();
                    q.setCourseId(course.getId());
                    q.setQuestion(lesson.getQuizQuestion());
                    q.setOption1(lesson.getQuizOption1());
                    q.setOption2(lesson.getQuizOption2());
                    q.setOption3(lesson.getQuizOption3());
                    q.setOption4(lesson.getQuizOption4());
                    q.setCorrectAnswer(lesson.getQuizCorrectAnswer());
                    quizQuestionRepository.save(q);
                }
            }
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveCourse(@PathVariable Long id, @RequestParam boolean approved) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Course course = courseOpt.get();
        course.setApproved(approved);
        Course updated = courseRepository.save(course);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignLecturer(@PathVariable Long id, @RequestParam String email) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Course course = courseOpt.get();
        course.setAssignedLecturerEmail(email);
        Course updated = courseRepository.save(course);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        if (!courseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        courseRepository.deleteById(id);
        return ResponseEntity.ok("Course deleted successfully");
    }
}
