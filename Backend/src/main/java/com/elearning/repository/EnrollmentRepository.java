package com.elearning.repository;

import com.elearning.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentEmail(String studentEmail);
    Optional<Enrollment> findByStudentEmailAndCourseId(String studentEmail, Long courseId);
    List<Enrollment> findByCourseId(Long courseId);
    boolean existsByStudentEmailAndCourseId(String studentEmail, Long courseId);
}
