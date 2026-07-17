package com.elearning.controller;

import com.elearning.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/s3")
public class S3Controller {

    @Autowired
    private S3Service s3Service;

    // Directory for local fallback mock uploads
    private static final String MOCK_UPLOAD_DIR = "./data/videos/";

    @GetMapping("/presigned-upload")
    public ResponseEntity<?> getPresignedUploadUrl(
            @RequestParam String fileName,
            @RequestParam String contentType) {
        
        S3Service.PresignedResponse response = s3Service.generatePresignedUploadUrl(fileName, contentType);
        Map<String, String> result = new HashMap<>();
        result.put("uploadUrl", response.getUploadUrl());
        result.put("downloadUrl", response.getDownloadUrl());
        return ResponseEntity.ok(result);
    }

    // Mock Upload endpoint for Local Fallback Mode
    @RequestMapping(value = "/mock-upload/{fileName}", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> handleMockUpload(
            @PathVariable String fileName,
            InputStream requestBody) {
        
        try {
            // Ensure directories exist
            File dir = new File(MOCK_UPLOAD_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            File targetFile = new File(MOCK_UPLOAD_DIR + fileName);
            try (FileOutputStream out = new FileOutputStream(targetFile)) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = requestBody.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }

            System.out.println("Mock S3 Upload: Saved file locally to " + targetFile.getAbsolutePath());
            return ResponseEntity.ok("Mock Upload Successful to local storage");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Mock Upload Failed: " + e.getMessage());
        }
    }

    // Mock Streaming endpoint for Local Fallback Mode
    @GetMapping("/mock-video-stream/{fileName}")
    public ResponseEntity<Resource> handleMockStream(@PathVariable String fileName) {
        Path path = Paths.get(MOCK_UPLOAD_DIR + fileName);
        if (!Files.exists(path)) {
            return ResponseEntity.notFound().build();
        }

        Resource fileResource = new FileSystemResource(path.toFile());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("video/mp4"));
        
        return new ResponseEntity<>(fileResource, headers, HttpStatus.OK);
    }
}
