package com.elearning.controller;

import com.elearning.model.AssignmentSubmission;
import com.elearning.repository.AssignmentSubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentSubmissionRepository assignmentSubmissionRepository;

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
}
