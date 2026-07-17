package com.elearning.controller;

import com.elearning.model.DiscussionComment;
import com.elearning.model.DiscussionPost;
import com.elearning.repository.DiscussionCommentRepository;
import com.elearning.repository.DiscussionPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/discussion")
public class DiscussionController {

    @Autowired
    private DiscussionPostRepository discussionPostRepository;

    @Autowired
    private DiscussionCommentRepository discussionCommentRepository;

    @GetMapping("/posts")
    public List<DiscussionPost> getPostsByCourse(@RequestParam Long courseId) {
        return discussionPostRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }

    @PostMapping("/posts")
    public ResponseEntity<DiscussionPost> createPost(@RequestBody DiscussionPost post) {
        post.setCreatedAt(LocalDateTime.now());
        DiscussionPost saved = discussionPostRepository.save(post);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/comments")
    public List<DiscussionComment> getCommentsByPost(@RequestParam Long postId) {
        return discussionCommentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }

    @PostMapping("/comments")
    public ResponseEntity<DiscussionComment> createComment(@RequestBody DiscussionComment comment) {
        comment.setCreatedAt(LocalDateTime.now());
        DiscussionComment saved = discussionCommentRepository.save(comment);
        return ResponseEntity.ok(saved);
    }
}
