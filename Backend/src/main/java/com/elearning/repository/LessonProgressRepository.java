package com.elearning.repository;

import com.elearning.model.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    List<LessonProgress> findByStudentEmailAndCourseId(String studentEmail, Long courseId);
    Optional<LessonProgress> findByStudentEmailAndLessonId(String studentEmail, Long lessonId);
}
