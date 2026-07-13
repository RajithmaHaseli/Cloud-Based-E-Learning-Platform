package com.elearning.repository;

import com.elearning.model.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {
    List<AssignmentSubmission> findByStudentEmail(String studentEmail);
    List<AssignmentSubmission> findByCourseId(Long courseId);
}
