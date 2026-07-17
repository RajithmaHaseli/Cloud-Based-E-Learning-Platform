# AWS IAM Security & Monitoring Configuration Guide

This guide describes the recommended IAM security roles, policies, and CloudWatch setup for deploying the Cloud-Based E-Learning Platform on AWS.

---

## 1. Amazon S3 Bucket Policy (Lecture Videos)

Configure the S3 bucket to allow secure direct client uploads via Presigned URLs, and restrict playback streams exclusively via CloudFront.

### CORS Configuration
Apply this CORS configuration to the S3 bucket to enable the React frontend to upload videos via HTTP PUT requests:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["PUT", "POST"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

### S3 Bucket Policy
Restrict direct access to the S3 bucket and allow reads ONLY from CloudFront using Origin Access Control (OAC) or Origin Access Identity (OAI):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipalReadOnly",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::elearning-lecture-videos-bucket/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::YOUR_AWS_ACCOUNT_ID:distribution/YOUR_CLOUDFRONT_DISTRIBUTION_ID"
                }
            }
        }
    ]
}
```

---

## 2. AWS IAM Role for Spring Boot Application

The Spring Boot backend requires an IAM Role with permissions to generate presigned S3 URLs and invoke the Quiz Autograding Lambda Function. Attach the following IAM policy to the EC2 Instance Profile, ECS Task Execution Role, or IAM User:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3PresignedUploadPermissions",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::elearning-lecture-videos-bucket/*"
        },
        {
            "Sid": "LambdaAutoGradingInvocation",
            "Effect": "Allow",
            "Action": "lambda:InvokeFunction",
            "Resource": "arn:aws:lambda:us-east-1:YOUR_AWS_ACCOUNT_ID:function:QuizAutogradingFunction"
        }
    ]
}
```

---

## 3. AWS IAM Role for Quiz Autograding Lambda Function

The Lambda function requires execution permissions to execute code and write logs to CloudWatch. Use the standard AWS managed policy **`AWSLambdaBasicExecutionRole`** which includes:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        }
    ]
}
```

---

## 4. CloudWatch Monitoring & Metrics

Configure CloudWatch Log Agent on your host environment (EC2 or ECS) to collect the Spring Boot application logs located at `./data/logs/elearning-platform.log`.

### Custom Metrics
You can create CloudWatch Alarm Metrics for the following key logs:
- **AUTOGRADING_FAILURE**: Trigger an alarm if Lambda invocation throws errors in `LambdaGradingService`.
- **S3_UPLOAD_FAILURE**: Trigger an alarm if presigned URL generation or mock upload fails in `S3Controller`.
- **HTTP_5XX_ERRORS**: Track system stability and notify administrators.
