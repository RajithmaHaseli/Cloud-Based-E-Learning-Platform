package com.elearning.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String instructor;
    
    @Column(length = 2000)
    private String description;
    
    private String video; // URL of video lecture
    private Boolean approved = true;
    private String assignedLecturerEmail;
    
    @Column(columnDefinition = "TEXT")
    private String assignmentTitle;

    @Column(columnDefinition = "TEXT")
    private String assignmentDescription;

    private String assignmentDeadline;
    
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(name = "course_id")
    private List<Lesson> lessons = new ArrayList<>();

    public Course() {}

    public Course(Long id, String title, String instructor, String description, String video, List<Lesson> lessons) {
        this.id = id;
        this.title = title;
        this.instructor = instructor;
        this.description = description;
        this.video = video;
        this.lessons = lessons;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getInstructor() {
        return instructor;
    }

    public void setInstructor(String instructor) {
        this.instructor = instructor;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getVideo() {
        return video;
    }

    public void setVideo(String video) {
        this.video = video;
    }

    public List<Lesson> getLessons() {
        return lessons;
    }

    public void setLessons(List<Lesson> lessons) {
        this.lessons = lessons;
    }

    public Boolean getApproved() {
        return approved == null ? true : approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public String getAssignedLecturerEmail() {
        return assignedLecturerEmail;
    }

    public void setAssignedLecturerEmail(String assignedLecturerEmail) {
        this.assignedLecturerEmail = assignedLecturerEmail;
    }

    public String getAssignmentTitle() {
        return assignmentTitle;
    }

    public void setAssignmentTitle(String assignmentTitle) {
        this.assignmentTitle = assignmentTitle;
    }

    public String getAssignmentDescription() {
        return assignmentDescription;
    }

    public void setAssignmentDescription(String assignmentDescription) {
        this.assignmentDescription = assignmentDescription;
    }

    public String getAssignmentDeadline() {
        return assignmentDeadline;
    }

    public void setAssignmentDeadline(String assignmentDeadline) {
        this.assignmentDeadline = assignmentDeadline;
    }
}
