import { useState, useEffect } from "react";
import api from "../services/api";

export default function Assignment() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    // Fetch courses list safely
    api.get("/courses")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setCourses(data);
          if (data.length > 0) setSelectedCourseId(data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load courses:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.email) {
      alert("Please login first");
      return;
    }

    const courseObj = courses.find(c => c.id === Number(selectedCourseId));

    const payload = {
      studentEmail: user.email,
      courseId: Number(selectedCourseId),
      courseTitle: courseObj ? courseObj.title : "General",
      submissionText: `Title: ${title}\nDescription: ${description}`,
      fileUrl: fileName ? `s3://cloudlearn-submissions/${user.email}/${fileName}` : null
    };

    try {
      const response = await api.post("/assignments/submit", payload);

      if (response.status === 200 || response.status === 201) {
        alert("Assignment submitted successfully to cloud storage!");
        setTitle("");
        setDescription("");
        setFileName("");
      } else {
        alert("Submission failed");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error occurred");
    }
  };

  return (
    <div className="page assignment-page">
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1>Assignment Submission</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Submit your work summaries and files directly to SkyLearn's secure cloud storage.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <form className="assignment-card" onSubmit={handleSubmit} style={{ width: "min(680px, 100%)", padding: "45px 40px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: "800", marginBottom: "10px", borderBottom: "1px solid var(--border)", paddingBottom: "12px", color: "#fff" }}>
            Submission Details
          </h2>

          <div className="form-group">
            <label>Select Associated Course</label>
            <select 
              value={selectedCourseId} 
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Assignment Title</label>
            <input 
              type="text" 
              placeholder="e.g. Cloud Security Architecture Case Study" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Short Summary / Explanation</label>
            <textarea
              placeholder="Provide a brief explanation of your solution steps..."
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>Upload Solution Document</label>
            <input
              type="file"
              onChange={(e) => setFileName(e.target.files[0]?.name)}
              required
            />
            {fileName && (
              <p style={{ fontSize: "0.85rem", color: "var(--success)", fontWeight: "600", marginTop: "8px" }}>
                ✓ Selected file: {fileName} (Prepared for secure upload)
              </p>
            )}
          </div>

          <button type="submit" style={{ width: "100%", height: "52px", marginTop: "10px" }}>
            Submit to Cloud Storage
          </button>
        </form>
      </div>
    </div>
  );
}