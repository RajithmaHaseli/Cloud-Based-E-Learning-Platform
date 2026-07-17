package com.elearning.controller;

import com.elearning.model.Course;
import com.elearning.model.Lesson;
import com.elearning.repository.CourseRepository;
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
        return ResponseEntity.ok(updated);
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
