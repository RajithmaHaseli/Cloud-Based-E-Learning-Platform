package com.elearning.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.File;
import java.io.FileOutputStream;
import java.time.Duration;
import java.util.UUID;
import java.util.logging.Logger;

@Service
public class S3Service {

    private static final Logger logger = Logger.getLogger(S3Service.class.getName());
    private static final String MOCK_UPLOAD_DIR = "./data/videos/";

    @Value("${aws.s3.bucket:elearning-lecture-videos-bucket}")
    private String bucketName;

    @Value("${aws.cloudfront.url:https://d111111abcdef8.cloudfront.net}")
    private String cloudFrontUrl;

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Value("${aws.access-key:}")
    private String awsAccessKey;

    @Value("${aws.secret-key:}")
    private String awsSecretKey;

    private S3Presigner s3Presigner;
    private S3Client s3Client;
    private boolean useLocalFallback = false;

    public S3Service() {
        // Empty constructor, initialization deferred to @PostConstruct method
    }

    @PostConstruct
    public void init() {
        try {
            software.amazon.awssdk.auth.credentials.AwsCredentialsProvider credentialsProvider;
            if (awsAccessKey != null && !awsAccessKey.trim().isEmpty() &&
                awsSecretKey != null && !awsSecretKey.trim().isEmpty()) {
                logger.info("Using static AWS credentials for S3 client and presigner.");
                credentialsProvider = StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(awsAccessKey, awsSecretKey)
                );
            } else {
                logger.info("Using default AWS credentials provider chain for S3 client and presigner.");
                credentialsProvider = DefaultCredentialsProvider.create();
            }

            // Attempt to initialize AWS S3 Presigner using credentials provider
            this.s3Presigner = S3Presigner.builder()
                    .region(Region.of(awsRegion != null ? awsRegion : "us-east-1"))
                    .credentialsProvider(credentialsProvider)
                    .build();

            // Attempt to initialize AWS S3 Client using credentials provider
            this.s3Client = S3Client.builder()
                    .region(Region.of(awsRegion != null ? awsRegion : "us-east-1"))
                    .credentialsProvider(credentialsProvider)
                    .build();

            logger.info("AWS S3 Presigner and S3 Client initialized successfully with region: " + awsRegion);
        } catch (Exception e) {
            logger.warning("AWS S3 client initialization failed: " + e.getMessage() + ". Enabling Local Fallback emulation.");
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
        return generatePresignedUploadUrl(fileName, contentType, false);
    }

    public PresignedResponse generatePresignedUploadUrl(String fileName, String contentType, boolean forceLocal) {
        String uniqueFileName = UUID.randomUUID().toString() + "-" + fileName;

        // Force check if useLocalFallback is needed (e.g. if presigner is null)
        if (s3Presigner == null) {
            useLocalFallback = true;
        }

        String baseUrl = getBaseUrl();

        if (useLocalFallback || forceLocal) {
            logger.info("Using Local Fallback to generate mock upload details for " + fileName + " (forceLocal: " + forceLocal + ")");
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

    public String uploadFileToS3(String fileName, byte[] fileData, String contentType) {
        String uniqueFileName = UUID.randomUUID().toString() + "-" + fileName;
        
        if (useLocalFallback || s3Client == null) {
            logger.info("Using local fallback to save file " + fileName + " locally.");
            saveLocally(uniqueFileName, fileData);
            String baseUrl = getBaseUrl();
            return baseUrl + "/api/s3/mock-video-stream/" + uniqueFileName;
        }

        try {
            logger.info("Uploading file " + fileName + " directly from backend to S3 bucket: " + bucketName);
            software.amazon.awssdk.core.sync.RequestBody requestBody = 
                software.amazon.awssdk.core.sync.RequestBody.fromBytes(fileData);
                
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(uniqueFileName)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putObjectRequest, requestBody);
            
            // Return CloudFront URL
            String cdnBase = cloudFrontUrl.endsWith("/") ? cloudFrontUrl : cloudFrontUrl + "/";
            return cdnBase + uniqueFileName;
        } catch (Exception e) {
            logger.severe("Failed to upload file to S3: " + e.getMessage() + ". Saving locally as fallback.");
            saveLocally(uniqueFileName, fileData);
            String baseUrl = getBaseUrl();
            return baseUrl + "/api/s3/mock-video-stream/" + uniqueFileName;
        }
    }

    private void saveLocally(String fileName, byte[] fileData) {
        try {
            File dir = new File(MOCK_UPLOAD_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File targetFile = new File(MOCK_UPLOAD_DIR + fileName);
            try (FileOutputStream out = new FileOutputStream(targetFile)) {
                out.write(fileData);
            }
            logger.info("Saved file locally to: " + targetFile.getAbsolutePath());
        } catch (Exception e) {
            logger.severe("Failed to save file locally: " + e.getMessage());
        }
    }
}
