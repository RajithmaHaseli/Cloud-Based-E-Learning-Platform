package com.elearning.controller;

import com.elearning.model.QuizQuestion;
import com.elearning.model.QuizSubmission;
import com.elearning.repository.QuizQuestionRepository;
import com.elearning.repository.QuizSubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    @Autowired
    private QuizQuestionRepository quizQuestionRepository;

    @Autowired
    private QuizSubmissionRepository quizSubmissionRepository;

    @GetMapping("/{courseId}")
    public List<QuizQuestion> getQuizQuestions(@PathVariable Long courseId) {
        return quizQuestionRepository.findByCourseId(courseId);
    }

    @PostMapping("/questions")
    public ResponseEntity<QuizQuestion> addQuestion(@RequestBody QuizQuestion question) {
        QuizQuestion savedQuestion = quizQuestionRepository.save(question);
        return ResponseEntity.ok(savedQuestion);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitQuiz(@RequestBody QuizSubmission submission) {
        submission.setSubmittedAt(LocalDateTime.now());
        QuizSubmission saved = quizSubmissionRepository.save(submission);
        return ResponseEntity.ok(saved);
    }
}
