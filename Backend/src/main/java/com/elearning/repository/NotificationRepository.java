package com.elearning.repository;

import com.elearning.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(String email);
    List<Notification> findByRecipientEmailAndIsReadOrderByCreatedAtDesc(String email, boolean isRead);
}
