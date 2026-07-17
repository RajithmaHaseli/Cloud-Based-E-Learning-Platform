package com.elearning.controller;

import com.elearning.model.AssignmentSubmission;
import com.elearning.repository.AssignmentSubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentSubmissionRepository assignmentSubmissionRepository;

    @Autowired
    private com.elearning.repository.AssignmentRepository assignmentRepository;

    @PostMapping("/tasks")
    public ResponseEntity<?> createAssignmentTask(@RequestBody com.elearning.model.Assignment task) {
        com.elearning.model.Assignment saved = assignmentRepository.save(task);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/tasks")
    public List<com.elearning.model.Assignment> getAssignmentTasks(@RequestParam(required = false) Long courseId) {
        if (courseId != null) {
            return assignmentRepository.findByCourseId(courseId);
        }
        return assignmentRepository.findAll();
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<?> updateAssignmentTask(@PathVariable Long id, @RequestBody com.elearning.model.Assignment details) {
        Optional<com.elearning.model.Assignment> opt = assignmentRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        com.elearning.model.Assignment task = opt.get();
        task.setTitle(details.getTitle());
        task.setDescription(details.getDescription());
        task.setDeadline(details.getDeadline());
        com.elearning.model.Assignment updated = assignmentRepository.save(task);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<?> deleteAssignmentTask(@PathVariable Long id) {
        if (!assignmentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        assignmentRepository.deleteById(id);
        return ResponseEntity.ok("Assignment task deleted successfully");
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitAssignment(@RequestBody AssignmentSubmission submission) {
        submission.setSubmittedAt(LocalDateTime.now());
        if (submission.getFileUrl() == null || submission.getFileUrl().trim().isEmpty()) {
            // Mock S3 URL if none provided to satisfy cloud storage showcase
            submission.setFileUrl("https://s3.amazonaws.com/cloudlearn-submissions/assignment_" + 
                    System.currentTimeMillis() + ".pdf");
        }
        AssignmentSubmission saved = assignmentSubmissionRepository.save(submission);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<AssignmentSubmission> getAllSubmissions() {
        return assignmentSubmissionRepository.findAll();
    }

    @GetMapping("/student/{email}")
    public List<AssignmentSubmission> getSubmissionsByStudent(@PathVariable String email) {
        return assignmentSubmissionRepository.findByStudentEmail(email);
    }

    @PutMapping("/{id}/grade")
    public ResponseEntity<?> gradeAssignment(
            @PathVariable Long id,
            @RequestBody GradeRequest request) {
        
        Optional<AssignmentSubmission> subOpt = assignmentSubmissionRepository.findById(id);
        if (subOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        AssignmentSubmission sub = subOpt.get();
        sub.setGrade(request.getGrade());
        sub.setFeedback(request.getFeedback());
        sub.setGradedAt(LocalDateTime.now());

        AssignmentSubmission saved = assignmentSubmissionRepository.save(sub);
        return ResponseEntity.ok(saved);
    }

    public static class GradeRequest {
        private String grade;
        private String feedback;

        public String getGrade() { return grade; }
        public void setGrade(String grade) { this.grade = grade; }

        public String getFeedback() { return feedback; }
        public void setFeedback(String feedback) { this.feedback = feedback; }
    }
}
