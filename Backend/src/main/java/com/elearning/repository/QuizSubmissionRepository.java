package com.elearning.repository;

import com.elearning.model.QuizSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, Long> {
    List<QuizSubmission> findByStudentEmail(String studentEmail);
    List<QuizSubmission> findByCourseId(Long courseId);
}
