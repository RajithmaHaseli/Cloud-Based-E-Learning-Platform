package com.elearning.controller;

import com.elearning.repository.*;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private QuizSubmissionRepository quizSubmissionRepository;

    @Autowired
    private AssignmentSubmissionRepository assignmentSubmissionRepository;

    @GetMapping("/student/{email}")
    public ResponseEntity<?> getStudentProgress(@PathVariable String email) {
        Map<String, Object> progress = new HashMap<>();
        progress.put("quizSubmissions", quizSubmissionRepository.findByStudentEmail(email));
        progress.put("assignmentSubmissions", assignmentSubmissionRepository.findByStudentEmail(email));
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", userRepository.findAll().stream().filter(u -> "student".equalsIgnoreCase(u.getRole())).count());
        stats.put("totalInstructors", userRepository.findAll().stream().filter(u -> "instructor".equalsIgnoreCase(u.getRole())).count());
        stats.put("totalCourses", courseRepository.count());
        stats.put("totalQuizSubmissions", quizSubmissionRepository.count());
        stats.put("totalAssignmentSubmissions", assignmentSubmissionRepository.count());
        return ResponseEntity.ok(stats);
    }
}
