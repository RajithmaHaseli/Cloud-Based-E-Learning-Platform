import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AddCourse() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState(
    user.role?.toLowerCase() === "lecturer" || user.role?.toLowerCase() === "instructor"
      ? user.name || ""
      : ""
  );
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [useUploadMode, setUseUploadMode] = useState(true);
  const [uploadProgress, setUploadProgress] = useState("");
  const [loading, setLoading] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDeadline, setAssignmentDeadline] = useState("");

  // Dynamic Lessons State (Includes Title, Content, and Lesson-Quizzes list)
  const [lessons, setLessons] = useState([{
    title: "",
    content: "",
    quizQuestions: [{
      question: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correctAnswer: "Option 1"
    }]
  }]);

  const handleAddLessonInput = () => {
    setLessons([...lessons, {
      title: "",
      content: "",
      quizQuestions: [{
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correctAnswer: "Option 1"
      }]
    }]);
  };

  const handleRemoveLessonInput = (index) => {
    const newLessons = lessons.filter((_, idx) => idx !== index);
    setLessons(newLessons);
  };

  const handleLessonFieldChange = (index, field, value) => {
    const newLessons = lessons.map((l, idx) => (idx === index ? { ...l, [field]: value } : l));
    setLessons(newLessons);
  };

  const handleAddQuizQuestion = (lessonIndex) => {
    const updatedLessons = lessons.map((l, idx) => {
      if (idx === lessonIndex) {
        return {
          ...l,
          quizQuestions: [
            ...(l.quizQuestions || []),
            { question: "", option1: "", option2: "", option3: "", option4: "", correctAnswer: "Option 1" }
          ]
        };
      }
      return l;
    });
    setLessons(updatedLessons);
  };

  const handleRemoveQuizQuestion = (lessonIndex, questionIndex) => {
    const updatedLessons = lessons.map((l, idx) => {
      if (idx === lessonIndex) {
        const filteredQ = (l.quizQuestions || []).filter((_, qIdx) => qIdx !== questionIndex);
        return { ...l, quizQuestions: filteredQ };
      }
      return l;
    });
    setLessons(updatedLessons);
  };

  const handleQuizQuestionFieldChange = (lessonIndex, questionIndex, field, value) => {
    const updatedLessons = lessons.map((l, idx) => {
      if (idx === lessonIndex) {
        const updatedQ = (l.quizQuestions || []).map((q, qIdx) => {
          if (qIdx === questionIndex) {
            return { ...q, [field]: value };
          }
          return q;
        });
        return { ...l, quizQuestions: updatedQ };
      }
      return l;
    });
    setLessons(updatedLessons);
  };

  const handleFileUpload = async (file) => {
    try {
      setUploadProgress("Getting secure upload authorization...");
      // 1. Get S3 Presigned URL
      const presignedRes = await api.get(`/s3/presigned-upload?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type || "video/mp4")}`);
      const { uploadUrl, downloadUrl } = presignedRes.data;

      setUploadProgress("Uploading video to cloud S3 bucket...");
      // 2. Upload file directly to S3 via PUT request
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "video/mp4"
        },
        body: file
      });

      if (!response.ok) {
        throw new Error("Direct S3 upload failed");
      }

      setUploadProgress("Upload complete!");
      return downloadUrl;
    } catch (err) {
      console.error(err);
      setUploadProgress("Upload failed, falling back to default video...");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress("");

    let finalVideoUrl = videoUrl;

    // Handle file upload if in upload mode and file is selected
    if (useUploadMode && videoFile) {
      const s3Url = await handleFileUpload(videoFile);
      if (s3Url) {
        finalVideoUrl = s3Url;
      } else {
        alert("Video upload failed. Please verify S3 cloud storage configurations or try pasting a direct link.");
        setLoading(false);
        return;
      }
    }

    const filteredLessons = lessons.filter(l => l.title.trim() !== "");

    // Prepare payload with serialized quizQuestionsJson
    const mappedLessons = filteredLessons.map(l => {
      const questionsList = l.quizQuestions || [];
      return {
        title: l.title,
        content: l.content,
        quizQuestionsJson: JSON.stringify(questionsList),
        // Legacy single question fields mapping
        quizQuestion: questionsList[0]?.question || "",
        quizOption1: questionsList[0]?.option1 || "",
        quizOption2: questionsList[0]?.option2 || "",
        quizOption3: questionsList[0]?.option3 || "",
        quizOption4: questionsList[0]?.option4 || "",
        quizCorrectAnswer: questionsList[0]?.correctAnswer || "Option 1"
      };
    });

    const payload = {
      title: courseName,
      description: description,
      instructor: instructor || user.name || "Instructor",
      video: finalVideoUrl || "",
      approved: true, // Auto publish on add
      assignedLecturerEmail:
        user.role?.toLowerCase() === "lecturer" || user.role?.toLowerCase() === "instructor"
          ? user.email
          : null,
      assignmentTitle: assignmentTitle,
      assignmentDescription: assignmentDescription,
      assignmentDeadline: assignmentDeadline,
      lessons: mappedLessons.length > 0 ? mappedLessons : [{
        title: "Introduction",
        content: "Welcome to the course!",
        quizQuestionsJson: JSON.stringify([{
          question: "Is this course starting now?",
          option1: "Yes",
          option2: "No",
          option3: "Maybe",
          option4: "Not sure",
          correctAnswer: "Option 1"
        }]),
        quizQuestion: "Is this course starting now?",
        quizOption1: "Yes",
        quizOption2: "No",
        quizOption3: "Maybe",
        quizOption4: "Not sure",
        quizCorrectAnswer: "Option 1"
      }]
    };

    try {
      setUploadProgress("Saving course information on server...");
      const response = await api.post("/courses", payload);

      if (response.status === 200 || response.status === 201) {
        alert(`Course "${courseName}" added successfully to the cloud platform!`);
        navigate("/courses");
      } else {
        alert("Failed to add course");
      }
    } catch (err) {
      console.error(err);
      alert("Could not connect to backend");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="page add-course-page">
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1>Add New Course</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Publish a new syllabus to SkyLearn. Enter course titles, resource videos, and detailed outlines.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div className="assignment-card" style={{ width: "min(680px, 100%)", padding: "45px 40px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: "800", marginBottom: "30px", borderBottom: "1px solid var(--border)", paddingBottom: "12px", color: "#fff" }}>
            Course Specifications
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-group">
              <label>Course Title</label>
              <input
                type="text"
                placeholder="e.g. AWS Solutions Architect Masterclass"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Instructor Name</label>
              <input 
                type="text" 
                placeholder="e.g. Dr. Jane Smith" 
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: "5px" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Lecture Video Resource</span>
                <span style={{ fontSize: "0.8rem", color: "var(--primary)", cursor: "pointer", fontWeight: "bold" }} onClick={() => setUseUploadMode(!useUploadMode)}>
                  {useUploadMode ? "✍ Or paste direct Link" : "📁 Or upload MP4 video file"}
                </span>
              </label>
              
              {useUploadMode ? (
                <div style={{ border: "1px dashed var(--border)", padding: "20px", borderRadius: "8px", textAlign: "center", background: "rgba(255,255,255,0.01)" }}>
                  <input 
                    type="file" 
                    accept="video/mp4" 
                    onChange={(e) => setVideoFile(e.target.files[0])}
                    style={{ color: "var(--text-secondary)" }}
                    required={!videoUrl}
                  />
                  {videoFile && <p style={{ fontSize: "0.85rem", color: "var(--success)", marginTop: "10px" }}>✓ Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)</p>}
                </div>
              ) : (
                <input 
                  type="text" 
                  placeholder="e.g. https://s3.amazonaws.com/skylearn-lectures/intro.mp4" 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required={!videoFile}
                />
              )}
            </div>

            {/* Dynamic Course Syllabus section */}
            <div className="form-group" style={{ border: "1px solid var(--border)", padding: "20px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.01)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <span style={{ fontWeight: "800", color: "#fff", fontSize: "0.95rem" }}>Course Syllabus & Lessons</span>
                <button 
                  type="button" 
                  onClick={handleAddLessonInput}
                  style={{ padding: "6px 12px", background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)", fontSize: "0.8rem", height: "auto", cursor: "pointer" }}
                >
                  + Add Lesson
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                {lessons.map((lesson, index) => (
                  <div key={index} style={{ borderBottom: index < lessons.length - 1 ? "2px solid var(--border)" : "none", paddingBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    
                    {/* Lesson Header */}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ minWidth: "75px", color: "#fff", fontSize: "0.85rem", fontWeight: "bold" }}>Lesson {index + 1}:</span>
                      <input 
                        type="text"
                        placeholder="Lesson Title"
                        value={lesson.title}
                        onChange={(e) => handleLessonFieldChange(index, "title", e.target.value)}
                        required
                        style={{ flex: 1, padding: "8px 12px" }}
                      />
                      {lessons.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveLessonInput(index)}
                          style={{ padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "var(--radius-sm)", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Lesson Content Textarea */}
                    <div style={{ paddingLeft: "85px" }}>
                      <textarea
                        placeholder="Provide lecture notes / conatin / reading materials for this lesson..."
                        value={lesson.content}
                        onChange={(e) => handleLessonFieldChange(index, "content", e.target.value)}
                        rows="3"
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "transparent", color: "var(--text-primary)", resize: "vertical", outline: "none" }}
                      />
                    </div>

                    {/* Lesson Quizzes Section (Multiple Questions) */}
                    <div style={{ paddingLeft: "85px", marginTop: "5px", display: "flex", flexDirection: "column", gap: "15px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.1)", padding: "15px", borderRadius: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--primary)" }}>📝 Lesson {index + 1} Quiz Questions</span>
                        <button 
                          type="button" 
                          onClick={() => handleAddQuizQuestion(index)}
                          style={{ padding: "4px 8px", fontSize: "0.75rem", background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)", height: "auto" }}
                        >
                          + Add Question
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        {(lesson.quizQuestions || []).map((q, qIdx) => (
                          <div key={qIdx} style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
                            
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "bold" }}>Q{qIdx + 1}:</span>
                              <input 
                                type="text"
                                placeholder="Quiz Question Text"
                                value={q.question}
                                onChange={(e) => handleQuizQuestionFieldChange(index, qIdx, "question", e.target.value)}
                                required
                                style={{ flex: 1, padding: "6px 10px", fontSize: "0.85rem" }}
                              />
                              {(lesson.quizQuestions || []).length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveQuizQuestion(index, qIdx)}
                                  style={{ padding: "6px 10px", background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)", height: "30px", width: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                              <input 
                                type="text"
                                placeholder="Option 1"
                                value={q.option1}
                                onChange={(e) => handleQuizQuestionFieldChange(index, qIdx, "option1", e.target.value)}
                                required
                                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                              />
                              <input 
                                type="text"
                                placeholder="Option 2"
                                value={q.option2}
                                onChange={(e) => handleQuizQuestionFieldChange(index, qIdx, "option2", e.target.value)}
                                required
                                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                              />
                              <input 
                                type="text"
                                placeholder="Option 3"
                                value={q.option3}
                                onChange={(e) => handleQuizQuestionFieldChange(index, qIdx, "option3", e.target.value)}
                                required
                                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                              />
                              <input 
                                type="text"
                                placeholder="Option 4"
                                value={q.option4}
                                onChange={(e) => handleQuizQuestionFieldChange(index, qIdx, "option4", e.target.value)}
                                required
                                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                              />
                            </div>

                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Correct Answer:</span>
                              <select
                                value={q.correctAnswer}
                                onChange={(e) => handleQuizQuestionFieldChange(index, qIdx, "correctAnswer", e.target.value)}
                                style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: "6px", background: "#1e293b", color: "#fff", cursor: "pointer", fontSize: "0.8rem" }}
                              >
                                <option value="Option 1">Option 1</option>
                                <option value="Option 2">Option 2</option>
                                <option value="Option 3">Option 3</option>
                                <option value="Option 4">Option 4</option>
                              </select>
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Detailed Course Description</label>
              <textarea
                placeholder="Provide a comprehensive summary of what students will learn..."
                rows="6"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Course Final Assignment Specification */}
            <div className="form-group" style={{ border: "1px solid var(--border)", padding: "20px", borderRadius: "8px", background: "rgba(255,255,255,0.01)", marginTop: "10px" }}>
              <h3 style={{ margin: "0 0 15px 0", color: "#fff", fontSize: "0.95rem", fontWeight: "800" }}>📝 Course Final Assignment (Optional)</h3>
              
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>Assignment Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cloud System Migration Implementation Project" 
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>Description / Guidelines</label>
                <textarea
                  placeholder="Provide detailed instructions and guidelines for the final assignment..."
                  rows="4"
                  value={assignmentDescription}
                  onChange={(e) => setAssignmentDescription(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "transparent", color: "var(--text-primary)", resize: "vertical", outline: "none" }}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Submission Deadline</label>
                <input 
                  type="text" 
                  placeholder="e.g. 2026-12-31" 
                  value={assignmentDeadline}
                  onChange={(e) => setAssignmentDeadline(e.target.value)}
                />
              </div>
            </div>

            {uploadProgress && (
              <div style={{ padding: "12px 18px", background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "6px", fontSize: "0.9rem", color: "var(--primary)", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="spinner">⏳</span>
                <span>{uploadProgress}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{ marginTop: "15px", height: "52px", width: "100%" }}
            >
              {loading ? "Processing..." : "Publish Course Outline"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}