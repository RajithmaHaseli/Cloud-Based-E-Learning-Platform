import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    const videoId = match[2];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return null;
};

export default function CourseDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // lessonId -> selectedOption
  const [quizFeedback, setQuizFeedback] = useState({}); // lessonId -> { type: 'success'|'error', text: string }

  // Assignment Submissions states
  const [mySubmission, setMySubmission] = useState(null);
  const [subTitle, setSubTitle] = useState("");
  const [subDescription, setSubDescription] = useState("");
  const [subFileName, setSubFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Discussion Board states
  const [activeTab, setActiveTab] = useState("syllabus"); // "syllabus" or "discussion"
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [commentsMap, setCommentsMap] = useState({}); // postId -> commentsList
  const [newCommentContent, setNewCommentContent] = useState({}); // postId -> commentText

  const user = JSON.parse(localStorage.getItem("user"));
  const isStudent = user?.role?.toLowerCase() === "student";

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const courseRes = await api.get(`/courses/${id}`);
      setCourse(courseRes.data);

      // Verify enrollment
      if (user?.email) {
        const enrollmentsRes = await api.get(`/enrollments/my?email=${user.email}`);
        const currentEnrollment = enrollmentsRes.data.find(e => e.courseId === Number(id));
        setEnrollment(currentEnrollment);

        if (isStudent && currentEnrollment) {
          // Fetch student completed lessons
          const completedRes = await api.get(`/enrollments/lessons/completed?email=${user.email}&courseId=${id}`);
          setCompletedLessons(completedRes.data);

          // Fetch student submissions for final assignment
          const subsRes = await api.get(`/assignments/student/${user.email}`);
          const currentSub = subsRes.data.find(s => s.courseId === Number(id));
          setMySubmission(currentSub || null);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Course not found.");
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const res = await api.get(`/discussion/posts?courseId=${id}`);
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to load forum posts:", err);
    }
  };

  const loadComments = async (postId) => {
    try {
      const res = await api.get(`/discussion/comments?postId=${postId}`);
      setCommentsMap(prev => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "discussion") {
      loadPosts();
    }
  }, [activeTab]);

  const handleLessonQuizSubmit = async (e, lesson) => {
    e.preventDefault();
    if (!user?.email) return;

    let questions = [];
    try {
      questions = lesson.quizQuestionsJson ? JSON.parse(lesson.quizQuestionsJson) : [];
    } catch (err) {
      console.error("Error parsing quiz questions:", err);
    }
    if (questions.length === 0 && lesson.quizQuestion) {
      questions.push({
        question: lesson.quizQuestion,
        option1: lesson.quizOption1,
        option2: lesson.quizOption2,
        option3: lesson.quizOption3,
        option4: lesson.quizOption4,
        correctAnswer: lesson.quizCorrectAnswer
      });
    }

    if (questions.length === 0) {
      try {
        const response = await api.post(
          `/enrollments/lessons/${lesson.id}/complete?email=${user.email}&courseId=${id}&completed=true`
        );
        setCompletedLessons([...completedLessons, lesson.id]);
        setEnrollment(response.data);
        setQuizFeedback(prev => ({
          ...prev,
          [lesson.id]: { type: "success", text: "🎉 Lesson completed successfully." }
        }));
      } catch (err) {
        console.error("Failed to complete lesson:", err);
      }
      return;
    }

    let allCorrect = true;
    let unanswered = false;
    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const userAns = selectedAnswers[`${lesson.id}-${qIdx}`];
      if (!userAns) {
        unanswered = true;
        break;
      }
      if (userAns !== questions[qIdx].correctAnswer) {
        allCorrect = false;
      }
    }

    if (unanswered) {
      alert("Please answer all questions first.");
      return;
    }

    if (allCorrect) {
      try {
        const response = await api.post(
          `/enrollments/lessons/${lesson.id}/complete?email=${user.email}&courseId=${id}&completed=true`
        );
        setCompletedLessons([...completedLessons, lesson.id]);
        setEnrollment(response.data);
        setQuizFeedback(prev => ({
          ...prev,
          [lesson.id]: { type: "success", text: "🎉 Correct! You passed the quiz & completed this lesson." }
        }));
      } catch (err) {
        console.error("Failed to complete lesson:", err);
        alert("Failed to save progress.");
      }
    } else {
      setQuizFeedback(prev => ({
        ...prev,
        [lesson.id]: { type: "error", text: "❌ Incorrect answer(s). Please review and try again!" }
      }));
    }
  };

  const handleCourseAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.email) {
      alert("Please login first");
      return;
    }
    setSubmitting(true);
    const payload = {
      studentEmail: user.email,
      courseId: Number(id),
      courseTitle: course.title,
      submissionText: `Title: ${subTitle}\nDescription: ${subDescription}`,
      fileUrl: subFileName ? `s3://cloudlearn-submissions/${user.email}/${subFileName}` : null
    };

    try {
      const response = await api.post("/assignments/submit", payload);
      alert("Assignment submitted successfully to cloud storage!");
      setMySubmission(response.data);
      setSubTitle("");
      setSubDescription("");
      setSubFileName("");
    } catch (err) {
      console.error(err);
      alert("Connection error occurred while submitting assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLessonToggle = async (lessonId, currentStatus) => {
    if (!user?.email) return;
    try {
      const response = await api.post(
        `/enrollments/lessons/${lessonId}/complete?email=${user.email}&courseId=${id}&completed=${!currentStatus}`
      );
      // Update local state
      if (currentStatus) {
        setCompletedLessons(completedLessons.filter(lId => lId !== lessonId));
      } else {
        setCompletedLessons([...completedLessons, lessonId]);
      }
      setEnrollment(response.data);
    } catch (err) {
      console.error("Failed to update lesson status", err);
    }
  };

  const enrollInCourse = async () => {
    if (!user?.email) return;
    try {
      await api.post(`/enrollments/course/${id}?email=${user.email}`);
      alert("Successfully enrolled!");
      loadCourseData();
    } catch (err) {
      alert("Failed to enroll");
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    try {
      const payload = {
        courseId: Number(id),
        authorEmail: user.email,
        authorName: user.name || user.email,
        authorRole: user.role || "student",
        content: newPostContent
      };
      await api.post("/discussion/posts", payload);
      setNewPostContent("");
      loadPosts();
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  const handleCreateComment = async (e, postId) => {
    e.preventDefault();
    const commentText = newCommentContent[postId];
    if (!commentText || !commentText.trim()) return;
    try {
      const payload = {
        postId: postId,
        authorEmail: user.email,
        authorName: user.name || user.email,
        authorRole: user.role || "student",
        content: commentText
      };
      await api.post("/discussion/comments", payload);
      setNewCommentContent(prev => ({ ...prev, [postId]: "" }));
      loadComments(postId);
    } catch (err) {
      console.error("Failed to create comment:", err);
    }
  };

  if (loading) {
    return <div className="page"><p>Loading course...</p></div>;
  }

  if (error || !course) {
    return <div className="page"><p className="error-message">{error}</p></div>;
  }

  const isCompleted = (lessonId) => completedLessons.includes(lessonId);
  const progressPercent = enrollment ? enrollment.progress : 0;
  const enrolled = !!enrollment;
  const showSyllabus = !enrolled || activeTab === "syllabus";

  return (
    <div className="page course-details-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1>{course.title}</h1>
          <p style={{ color: "var(--text-secondary)", margin: "0" }}>
            <strong>Instructor:</strong> {course.instructor}
          </p>
        </div>
        {isStudent && !enrolled && (
          <button className="main-btn" onClick={enrollInCourse}>
            Enroll in Course to Start Lessons
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      {enrolled && (
        <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border)", marginBottom: "30px" }}>
          <button 
            onClick={() => setActiveTab("syllabus")}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === "syllabus" ? "3px solid var(--primary)" : "3px solid transparent",
              color: activeTab === "syllabus" ? "var(--primary)" : "var(--text-secondary)",
              padding: "10px 20px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            📚 Syllabus & Lessons
          </button>
          <button 
            onClick={() => setActiveTab("discussion")}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === "discussion" ? "3px solid var(--primary)" : "3px solid transparent",
              color: activeTab === "discussion" ? "var(--primary)" : "var(--text-secondary)",
              padding: "10px 20px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            💬 Discussion Board
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: enrolled ? "2fr 1fr" : "1fr", gap: "40px", marginTop: "10px" }}>
        
        {/* Main Left Content Panel */}
        <div>
          {showSyllabus ? (
            <div>
              <p style={{ fontSize: "1.1rem", marginBottom: "20px", color: "var(--text-primary)" }}>{course.description}</p>
              
              {course.video && (
                <div style={{ marginBottom: "30px", maxWidth: "800px", width: "100%", margin: "0 auto 30px auto" }}>
                  {getYouTubeEmbedUrl(course.video) ? (
                    <iframe 
                      key={course.video}
                      className="video-player" 
                      src={getYouTubeEmbedUrl(course.video)} 
                      title={course.title}
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      style={{ width: "100%", aspectRatio: "16/9", objectFit: "contain", background: "#000", borderRadius: "var(--radius-md)", border: "none" }}
                    />
                  ) : (
                    <video key={course.video} className="video-player" controls preload="none" style={{ width: "100%", aspectRatio: "16/9", objectFit: "contain", background: "#000", borderRadius: "var(--radius-md)" }}>
                      <source src={course.video} type="video/mp4" />
                      Your browser does not support HTML5 video streaming.
                    </video>
                  )}
                </div>
              )}

              <h2>Course Syllabus & Lessons</h2>
              
              {isStudent && !enrolled ? (
                <div style={{ padding: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "15px" }}>Enroll in this course to track your progress and view syllabus quizzes.</p>
                  <ul className="lesson-list">
                    {course.lessons?.map((lesson) => (
                      <li key={lesson.id} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", padding: "0" }}>
                        <div 
                          onClick={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", cursor: "pointer" }}
                        >
                          <span style={{ fontWeight: "600" }}>{lesson.title}</span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            {expandedLessonId === lesson.id ? "▲ Hide" : "▼ View"}
                          </span>
                        </div>
                        {expandedLessonId === lesson.id && (
                          <div style={{ padding: "15px 18px", borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.01)", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>
                            {lesson.content ? (
                              <div style={{ whiteSpace: "pre-wrap", marginBottom: "10px" }}>{lesson.content}</div>
                            ) : (
                              <em style={{ color: "var(--text-muted)", display: "block", marginBottom: "10px" }}>No conatin uploaded for this lesson.</em>
                            )}
                            {(() => {
                              let questions = [];
                              try {
                                questions = lesson.quizQuestionsJson ? JSON.parse(lesson.quizQuestionsJson) : [];
                              } catch (err) {
                                console.error("Error parsing quiz questions:", err);
                              }
                              if (questions.length === 0 && lesson.quizQuestion) {
                                questions.push({
                                  question: lesson.quizQuestion,
                                  option1: lesson.quizOption1,
                                  option2: lesson.quizOption2,
                                  option3: lesson.quizOption3,
                                  option4: lesson.quizOption4,
                                  correctAnswer: lesson.quizCorrectAnswer
                                });
                              }
                              if (questions.length > 0) {
                                return (
                                  <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px" }}>
                                    <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--primary)", display: "block", marginBottom: "8px" }}>📝 Lesson Quiz Preview ({questions.length} Questions):</span>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                      {questions.map((q, qIdx) => (
                                        <p key={qIdx} style={{ margin: "0", fontSize: "0.85rem" }}>{qIdx + 1}. {q.question}</p>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <ul className="lesson-list">
                  {course.lessons?.map((lesson) => {
                    const checked = isCompleted(lesson.id);
                    const isExpanded = expandedLessonId === lesson.id;
                    return (
                      <li 
                        key={lesson.id} 
                        style={{ 
                          display: "flex", 
                          flexDirection: "column",
                          alignItems: "stretch",
                          padding: "0"
                        }}
                      >
                        <div 
                          onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "15px 20px",
                            cursor: "pointer",
                            background: isExpanded ? "rgba(255,255,255,0.02)" : "transparent",
                            transition: "background 0.2s"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {isStudent && (
                              <span style={{ fontSize: "1.1rem" }}>
                                {checked ? "🟢" : "⚪"}
                              </span>
                            )}
                            <span style={{ fontWeight: "600" }}>{lesson.title}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {checked && <span style={{ color: "var(--success)", fontSize: "0.85rem", fontWeight: "600" }}>✓ Completed</span>}
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              {isExpanded ? "▲ Hide" : "▼ View"}
                            </span>
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{ padding: "20px", borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.01)", color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                            
                            {/* Content */}
                            {lesson.content ? (
                              <div style={{ whiteSpace: "pre-wrap", marginBottom: "20px" }}>{lesson.content}</div>
                            ) : (
                              <em style={{ color: "var(--text-muted)", display: "block", marginBottom: "20px" }}>No conatin uploaded for this lesson yet.</em>
                            )}

                            {/* Quiz Form */}
                            {isStudent && (
                              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "15px", marginTop: "15px" }}>
                                {checked ? (
                                  <div style={{ color: "var(--success)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span>✓ Lesson quiz passed & completed.</span>
                                  </div>
                                ) : (
                                  (() => {
                                    let questions = [];
                                    try {
                                      questions = lesson.quizQuestionsJson ? JSON.parse(lesson.quizQuestionsJson) : [];
                                    } catch (err) {
                                      console.error("Error parsing quiz questions:", err);
                                    }
                                    if (questions.length === 0 && lesson.quizQuestion) {
                                      questions.push({
                                        question: lesson.quizQuestion,
                                        option1: lesson.quizOption1,
                                        option2: lesson.quizOption2,
                                        option3: lesson.quizOption3,
                                        option4: lesson.quizOption4,
                                        correctAnswer: lesson.quizCorrectAnswer
                                      });
                                    }

                                    if (questions.length > 0) {
                                      return (
                                        <form onSubmit={(e) => handleLessonQuizSubmit(e, lesson)} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                          <span style={{ fontWeight: "bold", color: "#fff", fontSize: "0.95rem" }}>📝 Lesson Quiz:</span>
                                          
                                          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                            {questions.map((q, qIdx) => (
                                              <div key={qIdx} style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                                <p style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "600", fontSize: "0.9rem" }}>{qIdx + 1}. {q.question}</p>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                  {[
                                                    { label: q.option1, val: "Option 1" },
                                                    { label: q.option2, val: "Option 2" },
                                                    { label: q.option3, val: "Option 3" },
                                                    { label: q.option4, val: "Option 4" }
                                                  ].map((opt, oIdx) => (
                                                    <label key={oIdx} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                                      <input 
                                                        type="radio" 
                                                        name={`lesson-quiz-${lesson.id}-${qIdx}`}
                                                        value={opt.val}
                                                        checked={selectedAnswers[`${lesson.id}-${qIdx}`] === opt.val}
                                                        onChange={() => setSelectedAnswers(prev => ({ ...prev, [`${lesson.id}-${qIdx}`]: opt.val }))}
                                                        required
                                                      />
                                                      <span>{opt.label}</span>
                                                    </label>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>

                                          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "5px" }}>
                                            <button type="submit" className="main-btn" style={{ padding: "6px 15px", fontSize: "0.85rem", height: "auto" }}>
                                              Submit Answers
                                            </button>
                                            {quizFeedback[lesson.id] && (
                                              <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: quizFeedback[lesson.id].type === "success" ? "var(--success)" : "var(--danger)" }}>
                                                {quizFeedback[lesson.id].text}
                                              </span>
                                            )}
                                          </div>
                                        </form>
                                      );
                                    } else {
                                      return (
                                        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                          <button 
                                            onClick={() => handleLessonToggle(lesson.id, false)}
                                            className="main-btn" 
                                            style={{ padding: "6px 15px", fontSize: "0.85rem", height: "auto" }}
                                          >
                                            Mark as Completed
                                          </button>
                                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>This lesson has no quiz. You can complete it directly.</span>
                                        </div>
                                      );
                                    }
                                  })()
                                )}
                              </div>
                            )}

                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Final Course Assignment Challenge Panel */}
              {enrolled && progressPercent >= 100 && course.assignmentTitle && (
                <div style={{ marginTop: "40px", padding: "30px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)" }}>
                  <h2 style={{ color: "#fff", marginTop: "0", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.4rem" }}>🎓 Final Course Assignment</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Congratulations on completing all course lessons! Please read the final assignment details below, prepare your document/project, and submit it to secure your certificate.</p>
                  
                  <div style={{ background: "rgba(255,255,255,0.01)", padding: "20px", borderRadius: "8px", border: "1px dashed var(--border)", marginBottom: "25px" }}>
                    <h3 style={{ color: "var(--primary)", marginTop: "0", fontSize: "1.1rem" }}>{course.assignmentTitle}</h3>
                    <p style={{ whiteSpace: "pre-wrap", color: "var(--text-primary)", fontSize: "0.9rem", lineHeight: "1.6" }}>{course.assignmentDescription}</p>
                    {course.assignmentDeadline && (
                      <p style={{ margin: "15px 0 0 0", fontSize: "0.85rem", color: "var(--warning)", fontWeight: "bold" }}>
                        ⏳ Deadline: {course.assignmentDeadline}
                      </p>
                    )}
                  </div>

                  {mySubmission ? (
                    <div style={{ background: "rgba(16, 185, 129, 0.03)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "20px", borderRadius: "8px" }}>
                      <h4 style={{ color: "var(--success)", margin: "0 0 10px 0", fontWeight: "bold", fontSize: "0.95rem" }}>✓ Assignment Submitted Successfully</h4>
                      <p style={{ margin: "5px 0", fontSize: "0.85rem" }}><strong>Your Submitted Solution:</strong></p>
                      <pre style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "pre-wrap", color: "var(--text-primary)", border: "1px solid var(--border)" }}>{mySubmission.submissionText}</pre>
                      {mySubmission.fileUrl && (
                        <p style={{ margin: "10px 0 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          Attachment: <code>{mySubmission.fileUrl.split("/").pop()}</code>
                        </p>
                      )}
                      
                      <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <p style={{ margin: "0", fontSize: "0.85rem" }}>
                          <strong>Grading & Evaluation Status:</strong>{" "}
                          {mySubmission.grade ? (
                            <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold", marginLeft: "5px" }}>
                              Graded: {mySubmission.grade} (Feedback: {mySubmission.feedback || "Good job!"})
                            </span>
                          ) : (
                            <span style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)", padding: "3px 8px", borderRadius: "4px", marginLeft: "5px" }}>
                              Pending Evaluation
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCourseAssignmentSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      <div className="form-group">
                        <label>Submission Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. My Solutions Report / Project Summary"
                          value={subTitle}
                          onChange={(e) => setSubTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Summary / Explanation of Work</label>
                        <textarea 
                          placeholder="Provide a summary of your steps and results..."
                          rows="4"
                          value={subDescription}
                          onChange={(e) => setSubDescription(e.target.value)}
                          required
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label>Upload Document / Solution File</label>
                        <input 
                          type="file"
                          onChange={(e) => setSubFileName(e.target.files[0]?.name || "")}
                          required
                        />
                        {subFileName && (
                          <p style={{ fontSize: "0.85rem", color: "var(--success)", fontWeight: "600", marginTop: "8px" }}>
                            ✓ Selected: {subFileName}
                          </p>
                        )}
                      </div>

                      <button type="submit" disabled={submitting} className="main-btn" style={{ height: "46px", marginTop: "10px" }}>
                        {submitting ? "Uploading to Cloud..." : "Submit Assignment Solution"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Discussion Forum Tab */
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              <div className="assignment-card" style={{ padding: "25px", border: "1px solid var(--border)" }}>
                <h3 style={{ margin: "0 0 15px 0", color: "var(--text-primary)" }}>Start a Discussion</h3>
                <form onSubmit={handleCreatePost}>
                  <textarea
                    placeholder="Ask a question or share resource materials with the class..."
                    rows="3"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    style={{ width: "100%", background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "12px", borderRadius: "8px", resize: "vertical" }}
                    required
                  ></textarea>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                    <button className="main-btn" type="submit" style={{ padding: "8px 24px", height: "auto" }}>Post to Board</button>
                  </div>
                </form>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {posts.length === 0 ? (
                  <div className="profile-card" style={{ padding: "30px", textAlign: "center" }}>
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>No discussions have been started yet. Be the first to post!</p>
                  </div>
                ) : (
                  posts.map(post => {
                    const comments = commentsMap[post.id] || [];
                    const isCommentsOpen = commentsMap[post.id] !== undefined;

                    return (
                      <div className="profile-card" key={post.id} style={{ padding: "25px", border: "1px solid var(--border)", background: "var(--surface)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "1.5rem" }}>👤</span>
                            <div>
                              <strong style={{ display: "block" }}>{post.authorName}</strong>
                              <small style={{ color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
                                {post.authorRole.toUpperCase()} • {new Date(post.createdAt).toLocaleString()}
                              </small>
                            </div>
                          </div>
                        </div>
                        <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "var(--text-primary)", margin: "0 0 15px 0" }}>{post.content}</p>

                        <div style={{ marginTop: "15px", borderTop: "1px solid var(--border)", paddingTop: "15px" }}>
                          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                            <span 
                              style={{ cursor: "pointer", color: "var(--primary)", fontSize: "0.9rem", fontWeight: "bold" }}
                              onClick={() => {
                                if (isCommentsOpen) {
                                  setCommentsMap(prev => {
                                    const copy = { ...prev };
                                    delete copy[post.id];
                                    return copy;
                                  });
                                } else {
                                  loadComments(post.id);
                                }
                              }}
                            >
                              💬 {isCommentsOpen ? "Hide Replies" : "Show Replies"} ({comments.length || "0"})
                            </span>
                          </div>

                          {isCommentsOpen && (
                            <div style={{ paddingLeft: "15px", borderLeft: "2px solid var(--primary)", display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
                              {comments.map(comment => (
                                <div key={comment.id} style={{ background: "rgba(255,255,255,0.01)", padding: "10px 14px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                    <strong style={{ fontSize: "0.85rem" }}>{comment.authorName} <small style={{ color: "var(--text-secondary)", fontWeight: "normal" }}>({comment.authorRole})</small></strong>
                                    <small style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{new Date(comment.createdAt).toLocaleDateString()}</small>
                                  </div>
                                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>{comment.content}</p>
                                </div>
                              ))}

                              <form onSubmit={(e) => handleCreateComment(e, post.id)} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <input
                                  type="text"
                                  placeholder="Write a reply..."
                                  value={newCommentContent[post.id] || ""}
                                  onChange={(e) => setNewCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  style={{ flex: 1, background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "8px 12px", borderRadius: "6px" }}
                                  required
                                />
                                <button className="main-btn" type="submit" style={{ padding: "8px 16px", fontSize: "0.85rem", height: "auto" }}>Reply</button>
                              </form>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar for student progress & actions */}
        {enrolled && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "25px", borderRadius: "var(--radius-md)", alignSelf: "start" }}>
            <h3 style={{ marginTop: 0 }}>My Progress</h3>
            
            <div className="progress-section" style={{ margin: "20px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "600", fontSize: "0.9rem" }}>
                <span>Lessons Completed</span>
                <span>{progressPercent}%</span>
              </div>
              <progress value={progressPercent} max="100"></progress>
            </div>

            {progressPercent >= 100 ? (
              (!course.assignmentTitle || mySubmission) ? (
                <button 
                  className="main-btn" 
                  onClick={() => setShowCertificate(true)}
                  style={{ width: "100%", background: "linear-gradient(135deg, #d4af37, #aa7c11)", color: "#fff", border: "0" }}
                >
                  Claim Certificate
                </button>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "var(--warning)", textAlign: "center", fontWeight: "bold" }}>
                  ⚠️ Submit the Final Course Assignment to claim your Certificate!
                </p>
              )
            ) : (
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center" }}>
                Complete all lessons to generate your Certificate of Completion!
              </p>
            )}

            <div style={{ marginTop: "25px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
              <Link className="main-btn" to={`/quiz/${course.id}`} style={{ width: "100%" }}>
                Take Course Quiz
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: "rgba(15, 23, 42, 0.75)", 
            backdropFilter: "blur(10px)",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 9999 
          }}
          onClick={() => setShowCertificate(false)}
        >
          <div 
            style={{ 
              background: "white", 
              width: "min(850px, 90%)", 
              padding: "50px", 
              borderRadius: "20px", 
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              border: "12px solid #eaeaea",
              position: "relative",
              textAlign: "center",
              backgroundImage: "linear-gradient(to right, #fcfcfc, #f4f4f4)",
              color: "#1e293b"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ border: "2px solid #d4af37", padding: "30px", height: "100%" }}>
              <h4 style={{ color: "#d4af37", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 10px 0" }}>Certificate of Completion</h4>
              <p style={{ fontStyle: "italic", fontSize: "1.1rem", margin: "10px 0" }}>This is proudly presented to</p>
              <h2 style={{ fontSize: "2.5rem", margin: "15px 0", fontFamily: "Georgia, serif", color: "var(--primary)" }}>{user.name}</h2>
              <p style={{ margin: "20px 0", maxWidth: "600px", marginLeft: "auto", marginRight: "auto", lineHeight: "1.6" }}>
                for successfully fulfilling all requirements and completing the course titled
              </p>
              <h3 style={{ fontSize: "1.8rem", margin: "15px 0", color: "#0f172a" }}>{course.title}</h3>
              <p style={{ fontStyle: "italic", margin: "10px 0" }}>under instruction of <strong>{course.instructor}</strong></p>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "50px", padding: "0 40px" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ borderBottom: "1px solid #94a3b8", width: "150px", marginBottom: "5px" }}></div>
                  <small style={{ color: "#64748b" }}>Date: {new Date().toLocaleDateString()}</small>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: "2rem", color: "#d4af37" }}>☁</span>
                  <strong style={{ fontSize: "1.2rem", color: "var(--primary)" }}>SkyLearn</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontStyle: "italic", fontFamily: "Georgia", marginBottom: "5px" }}>{course.instructor}</div>
                  <div style={{ borderBottom: "1px solid #94a3b8", width: "150px", marginBottom: "5px" }}></div>
                  <small style={{ color: "#64748b" }}>Authorized Signature</small>
                </div>
              </div>
            </div>

            <button 
              className="main-btn" 
              onClick={() => window.print()}
              style={{ marginTop: "25px", background: "var(--primary)", border: 0 }}
            >
              Print Certificate
            </button>
            <button 
              onClick={() => setShowCertificate(false)}
              style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: 0, fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}