import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AddCourse() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [useUploadMode, setUseUploadMode] = useState(true);
  const [uploadProgress, setUploadProgress] = useState("");
  const [loading, setLoading] = useState(false);

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
      }
    }

    const payload = {
      title: courseName,
      description: description,
      instructor: instructor || "Instructor",
      video: finalVideoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      approved: true, // Auto publish on add
      lessons: [
        { title: "Introduction & Cloud Architecture Overview" },
        { title: "Core Services, Virtualization, and Storage" },
        { title: "Practical Lab: Setting up Infrastructure" }
      ]
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