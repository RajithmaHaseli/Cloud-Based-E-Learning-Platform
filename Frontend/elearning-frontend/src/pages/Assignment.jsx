import { useState, useEffect } from "react";

export default function Assignment() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    // Fetch courses list for selecting course
    fetch("http://localhost:8080/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        if (data.length > 0) setSelectedCourseId(data[0].id);
      })
      .catch((err) => console.error(err));
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
      const response = await fetch("http://localhost:8080/api/assignments/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
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
    <div className="page">
      <h1>Assignment Submission</h1>

      <form className="assignment-card" onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Select Course</label>
        <select 
          value={selectedCourseId} 
          onChange={(e) => setSelectedCourseId(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ccc" }}
        >
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>

        <input 
          type="text" 
          placeholder="Assignment title" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required 
        />

        <textarea
          placeholder="Write a short description"
          rows="5"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>

        <input
          type="file"
          onChange={(e) => setFileName(e.target.files[0]?.name)}
          required
        />

        {fileName && <p>Selected file (prepared for S3 upload): {fileName}</p>}

        <button type="submit">Submit Assignment</button>
      </form>
    </div>
  );
}