package com.elearning.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.UUID;
import java.util.logging.Logger;

@Service
public class S3Service {

    private static final Logger logger = Logger.getLogger(S3Service.class.getName());

    @Value("${aws.s3.bucket:elearning-lecture-videos-bucket}")
    private String bucketName;

    @Value("${aws.cloudfront.url:https://d111111abcdef8.cloudfront.net}")
    private String cloudFrontUrl;

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    private S3Presigner s3Presigner;
    private boolean useLocalFallback = false;

    public S3Service() {
        // Empty constructor, initialization deferred to @PostConstruct method
    }

    @PostConstruct
    public void init() {
        try {
            // Attempt to initialize AWS S3 Presigner using default credentials provider chain
            this.s3Presigner = S3Presigner.builder()
                    .region(Region.of(awsRegion != null ? awsRegion : "us-east-1"))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
            logger.info("AWS S3 Presigner initialized successfully with region: " + awsRegion);
        } catch (Exception e) {
            logger.warning("AWS S3 Presigner initialization failed: " + e.getMessage() + ". Enabling Local Fallback emulation.");
            this.useLocalFallback = true;
        }
    }

    public static class PresignedResponse {
        private String uploadUrl;
        private String downloadUrl;

        public PresignedResponse(String uploadUrl, String downloadUrl) {
            this.uploadUrl = uploadUrl;
            this.downloadUrl = downloadUrl;
        }

        public String getUploadUrl() { return uploadUrl; }
        public String getDownloadUrl() { return downloadUrl; }
    }

    public PresignedResponse generatePresignedUploadUrl(String fileName, String contentType) {
        String uniqueFileName = UUID.randomUUID().toString() + "-" + fileName;

        // Force check if useLocalFallback is needed (e.g. if presigner is null)
        if (s3Presigner == null) {
            useLocalFallback = true;
        }

        String baseUrl = getBaseUrl();

        if (useLocalFallback) {
            logger.info("Using Local Fallback to generate mock upload details for " + fileName);
            String mockUploadUrl = baseUrl + "/api/s3/mock-upload/" + uniqueFileName;
            String mockDownloadUrl = baseUrl + "/api/s3/mock-video-stream/" + uniqueFileName;
            return new PresignedResponse(mockUploadUrl, mockDownloadUrl);
        }

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(uniqueFileName)
                    .contentType(contentType)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15))
                    .putObjectRequest(putObjectRequest)
                    .build();

            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
            String uploadUrl = presignedRequest.url().toString();
            
            // Format CloudFront download/stream URL
            String cdnBase = cloudFrontUrl.endsWith("/") ? cloudFrontUrl : cloudFrontUrl + "/";
            String downloadUrl = cdnBase + uniqueFileName;

            logger.info("Generated S3 presigned URL successfully for: " + uniqueFileName);
            return new PresignedResponse(uploadUrl, downloadUrl);

        } catch (Exception e) {
            logger.warning("Failed to generate S3 Presigned URL: " + e.getMessage() + ". Falling back to local mock emulation.");
            String mockUploadUrl = baseUrl + "/api/s3/mock-upload/" + uniqueFileName;
            String mockDownloadUrl = baseUrl + "/api/s3/mock-video-stream/" + uniqueFileName;
            return new PresignedResponse(mockUploadUrl, mockDownloadUrl);
        }
    }

    private String getBaseUrl() {
        try {
            return org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentContextPath().toUriString();
        } catch (Exception e) {
            logger.warning("Failed to resolve dynamic base URL, falling back to localhost:8080. Error: " + e.getMessage());
            return "http://localhost:8080";
        }
    }
}
