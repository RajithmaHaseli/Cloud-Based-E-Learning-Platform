package com.elearning.repository;

import com.elearning.model.DiscussionComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionCommentRepository extends JpaRepository<DiscussionComment, Long> {
    List<DiscussionComment> findByPostIdOrderByCreatedAtAsc(Long postId);
}
