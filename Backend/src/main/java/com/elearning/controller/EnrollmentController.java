package com.elearning.controller;

import com.elearning.model.Course;
import com.elearning.model.Enrollment;
import com.elearning.model.LessonProgress;
import com.elearning.repository.CourseRepository;
import com.elearning.repository.EnrollmentRepository;
import com.elearning.repository.LessonProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LessonProgressRepository lessonProgressRepository;

    @PostMapping("/course/{courseId}")
    public ResponseEntity<?> enrollInCourse(@PathVariable Long courseId, @RequestParam String email) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Course course = courseOpt.get();
        if (enrollmentRepository.existsByStudentEmailAndCourseId(email, courseId)) {
            return ResponseEntity.badRequest().body("Already enrolled in this course");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudentEmail(email);
        enrollment.setCourseId(courseId);
        enrollment.setCourseTitle(course.getTitle());
        enrollment.setProgress(0.0);
        enrollment.setEnrolledAt(LocalDateTime.now());

        Enrollment saved = enrollmentRepository.save(enrollment);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<Enrollment> getAllEnrollments() {
        return enrollmentRepository.findAll();
    }

    @GetMapping("/my")
    public List<Enrollment> getMyEnrollments(@RequestParam String email) {
        return enrollmentRepository.findByStudentEmail(email);
    }

    @PostMapping("/lessons/{lessonId}/complete")
    public ResponseEntity<?> toggleLessonComplete(
            @PathVariable Long lessonId,
            @RequestParam String email,
            @RequestParam Long courseId,
            @RequestParam boolean completed) {

        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Course course = courseOpt.get();

        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findByStudentEmailAndCourseId(email, courseId);
        if (enrollmentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Student is not enrolled in this course");
        }
        Enrollment enrollment = enrollmentOpt.get();

        Optional<LessonProgress> lpOpt = lessonProgressRepository.findByStudentEmailAndLessonId(email, lessonId);
        LessonProgress lp;
        if (lpOpt.isPresent()) {
            lp = lpOpt.get();
            lp.setCompleted(completed);
        } else {
            lp = new LessonProgress();
            lp.setStudentEmail(email);
            lp.setCourseId(courseId);
            lp.setLessonId(lessonId);
            lp.setCompleted(completed);
        }
        lessonProgressRepository.save(lp);

        // Recalculate progress percentage
        List<LessonProgress> allProgress = lessonProgressRepository.findByStudentEmailAndCourseId(email, courseId);
        long completedCount = allProgress.stream().filter(LessonProgress::isCompleted).count();
        long totalLessons = course.getLessons().size();

        double progressPercent = 0.0;
        if (totalLessons > 0) {
            progressPercent = ((double) completedCount / totalLessons) * 100.0;
            // Round to 2 decimal places
            progressPercent = Math.round(progressPercent * 100.0) / 100.0;
        }

        enrollment.setProgress(progressPercent);
        enrollmentRepository.save(enrollment);

        return ResponseEntity.ok(enrollment);
    }

    @GetMapping("/lessons/completed")
    public List<Long> getCompletedLessons(@RequestParam String email, @RequestParam Long courseId) {
        List<LessonProgress> lpList = lessonProgressRepository.findByStudentEmailAndCourseId(email, courseId);
        return lpList.stream()
                .filter(LessonProgress::isCompleted)
                .map(LessonProgress::getLessonId)
                .collect(Collectors.toList());
    }
}
