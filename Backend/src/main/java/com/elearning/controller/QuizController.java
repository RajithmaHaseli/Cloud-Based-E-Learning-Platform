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

    @Autowired
    private com.elearning.service.LambdaGradingService lambdaGradingService;

    @GetMapping("/{courseId}")
    public List<QuizQuestion> getQuizQuestions(@PathVariable Long courseId) {
        return quizQuestionRepository.findByCourseId(courseId);
    }

    @PostMapping("/questions")
    public ResponseEntity<QuizQuestion> addQuestion(@RequestBody QuizQuestion question) {
        QuizQuestion savedQuestion = quizQuestionRepository.save(question);
        return ResponseEntity.ok(savedQuestion);
    }

    public static class QuizSubmissionRequest {
        private String studentEmail;
        private Long courseId;
        private String courseTitle;
        private List<com.elearning.service.LambdaGradingService.StudentAnswer> answers;

        public QuizSubmissionRequest() {}

        public String getStudentEmail() { return studentEmail; }
        public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
        public Long getCourseId() { return courseId; }
        public void setCourseId(Long courseId) { this.courseId = courseId; }
        public String getCourseTitle() { return courseTitle; }
        public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }
        public List<com.elearning.service.LambdaGradingService.StudentAnswer> getAnswers() { return answers; }
        public void setAnswers(List<com.elearning.service.LambdaGradingService.StudentAnswer> answers) { this.answers = answers; }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitQuiz(@RequestBody QuizSubmissionRequest request) {
        List<QuizQuestion> correctQuestions = quizQuestionRepository.findByCourseId(request.getCourseId());
        
        com.elearning.service.LambdaGradingService.GradingResult result = 
                lambdaGradingService.gradeQuiz(request.getAnswers(), correctQuestions);

        QuizSubmission submission = new QuizSubmission();
        submission.setStudentEmail(request.getStudentEmail());
        submission.setCourseId(request.getCourseId());
        submission.setCourseTitle(request.getCourseTitle());
        submission.setScore(result.getScore());
        submission.setTotalQuestions(result.getTotalQuestions());
        submission.setSubmittedAt(LocalDateTime.now());

        QuizSubmission saved = quizSubmissionRepository.save(submission);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<?> updateQuestion(@PathVariable Long id, @RequestBody QuizQuestion questionDetails) {
        java.util.Optional<QuizQuestion> opt = quizQuestionRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        QuizQuestion q = opt.get();
        q.setQuestion(questionDetails.getQuestion());
        q.setOption1(questionDetails.getOption1());
        q.setOption2(questionDetails.getOption2());
        q.setOption3(questionDetails.getOption3());
        q.setOption4(questionDetails.getOption4());
        q.setCorrectAnswer(questionDetails.getCorrectAnswer());
        QuizQuestion updated = quizQuestionRepository.save(q);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
        if (!quizQuestionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        quizQuestionRepository.deleteById(id);
        return ResponseEntity.ok("Question deleted successfully");
    }

    @GetMapping("/submissions")
    public List<QuizSubmission> getAllSubmissions() {
        return quizSubmissionRepository.findAll();
    }
}
