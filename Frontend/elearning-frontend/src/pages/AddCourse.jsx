import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddCourse() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title: courseName,
      description: description,
      instructor: instructor || "Instructor",
      video: videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      lessons: [
        { title: "Introduction" },
        { title: "Course Content - Module 1" }
      ]
    };

    try {
      const response = await fetch("http://localhost:8080/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(`Course "${courseName}" added successfully to the cloud platform!`);
        navigate("/courses");
      } else {
        alert("Failed to add course");
      }
    } catch (err) {
      console.error(err);
      alert("Could not connect to backend");
    }
  };

  return (
    <div className="page">
      <h1>Add New Course</h1>

      <form className="assignment-card" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Course title"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          required
        />

        <textarea
          placeholder="Course description"
          rows="5"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>

        <input 
          type="text" 
          placeholder="Instructor name" 
          value={instructor}
          onChange={(e) => setInstructor(e.target.value)}
          required 
        />

        <input 
          type="text" 
          placeholder="Lecture Video URL (e.g. S3 cloudfront link)" 
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />

        <button type="submit">Add Course</button>
      </form>
    </div>
  );
}