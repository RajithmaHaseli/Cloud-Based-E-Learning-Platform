package com.elearning.model;

import jakarta.persistence.*;

@Entity
@Table(name = "lessons")
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String quizQuestion;
    private String quizOption1;
    private String quizOption2;
    private String quizOption3;
    private String quizOption4;
    private String quizCorrectAnswer;

    @Column(columnDefinition = "TEXT")
    private String quizQuestionsJson;

    public Lesson() {}

    public Lesson(Long id, String title) {
        this.id = id;
        this.title = title;
        this.content = "";
    }

    public Lesson(Long id, String title, String content) {
        this.id = id;
        this.title = title;
        this.content = content;
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getQuizQuestion() {
        return quizQuestion;
    }

    public void setQuizQuestion(String quizQuestion) {
        this.quizQuestion = quizQuestion;
    }

    public String getQuizOption1() {
        return quizOption1;
    }

    public void setQuizOption1(String quizOption1) {
        this.quizOption1 = quizOption1;
    }

    public String getQuizOption2() {
        return quizOption2;
    }

    public void setQuizOption2(String quizOption2) {
        this.quizOption2 = quizOption2;
    }

    public String getQuizOption3() {
        return quizOption3;
    }

    public void setQuizOption3(String quizOption3) {
        this.quizOption3 = quizOption3;
    }

    public String getQuizOption4() {
        return quizOption4;
    }

    public void setQuizOption4(String quizOption4) {
        this.quizOption4 = quizOption4;
    }

    public String getQuizCorrectAnswer() {
        return quizCorrectAnswer;
    }

    public void setQuizCorrectAnswer(String quizCorrectAnswer) {
        this.quizCorrectAnswer = quizCorrectAnswer;
    }

    public String getQuizQuestionsJson() {
        return quizQuestionsJson;
    }

    public void setQuizQuestionsJson(String quizQuestionsJson) {
        this.quizQuestionsJson = quizQuestionsJson;
    }
}
