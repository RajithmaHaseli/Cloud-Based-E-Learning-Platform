package com.elearning.service;

import com.elearning.model.QuizQuestion;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.util.List;
import java.util.logging.Logger;

@Service
public class LambdaGradingService {

    private static final Logger logger = Logger.getLogger(LambdaGradingService.class.getName());

    @Value("${aws.lambda.function-name:QuizAutogradingFunction}")
    private String functionName;

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    private LambdaClient lambdaClient;
    private boolean useLocalFallback = false;

    public LambdaGradingService() {
        try {
            // Attempt to build AWS Lambda Client using default credentials
            this.lambdaClient = LambdaClient.builder()
                    .region(Region.of(awsRegion != null ? awsRegion : "us-east-1"))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
            logger.info("AWS Lambda Client initialized successfully.");
        } catch (Exception e) {
            logger.warning("AWS Lambda Client initialization failed: " + e.getMessage() + ". Enabling local fallback auto-grading.");
            this.useLocalFallback = true;
        }
    }

    public static class StudentAnswer {
        private Long questionId;
        private String selectedAnswer;

        public StudentAnswer() {}
        public StudentAnswer(Long questionId, String selectedAnswer) {
            this.questionId = questionId;
            this.selectedAnswer = selectedAnswer;
        }

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }
        public String getSelectedAnswer() { return selectedAnswer; }
        public void setSelectedAnswer(String selectedAnswer) { this.selectedAnswer = selectedAnswer; }
    }

    public static class GradingResult {
        private int score;
        private int totalQuestions;
        private int percentage;

        public GradingResult(int score, int totalQuestions, int percentage) {
            this.score = score;
            this.totalQuestions = totalQuestions;
            this.percentage = percentage;
        }

        public int getScore() { return score; }
        public int getTotalQuestions() { return totalQuestions; }
        public int getPercentage() { return percentage; }
    }

    public GradingResult gradeQuiz(List<StudentAnswer> studentAnswers, List<QuizQuestion> correctAnswers) {
        if (lambdaClient == null) {
            useLocalFallback = true;
        }

        if (useLocalFallback) {
            logger.info("Using Local Fallback to grade quiz answers on local server...");
            return gradeLocally(studentAnswers, correctAnswers);
        }

        try {
            // Construct JSON Payload for AWS Lambda function
            StringBuilder payloadBuilder = new StringBuilder();
            payloadBuilder.append("{\"studentAnswers\":[");
            for (int i = 0; i < studentAnswers.size(); i++) {
                StudentAnswer ans = studentAnswers.get(i);
                payloadBuilder.append(String.format("{\"questionId\":%d,\"selectedAnswer\":\"%s\"}", 
                        ans.getQuestionId(), escapeJson(ans.getSelectedAnswer())));
                if (i < studentAnswers.size() - 1) payloadBuilder.append(",");
            }
            payloadBuilder.append("],\"correctAnswers\":[");
            for (int i = 0; i < correctAnswers.size(); i++) {
                QuizQuestion q = correctAnswers.get(i);
                payloadBuilder.append(String.format("{\"questionId\":%d,\"correctAnswer\":\"%s\"}", 
                        q.getId(), escapeJson(q.getCorrectAnswer())));
                if (i < correctAnswers.size() - 1) payloadBuilder.append(",");
            }
            payloadBuilder.append("]}");

            logger.info("Invoking AWS Lambda Function " + functionName + " with payload: " + payloadBuilder.toString());

            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(functionName)
                    .payload(SdkBytes.fromUtf8String(payloadBuilder.toString()))
                    .build();

            InvokeResponse response = lambdaClient.invoke(invokeRequest);
            String responseStr = response.payload().asUtf8String();
            logger.info("AWS Lambda Autograding response payload: " + responseStr);

            // Parse response (simple regex parser to avoid complex JSON dependencies)
            int score = parseJsonIntField(responseStr, "score");
            int totalQuestions = parseJsonIntField(responseStr, "totalQuestions");
            int percentage = parseJsonIntField(responseStr, "percentage");

            return new GradingResult(score, totalQuestions, percentage);

        } catch (Exception e) {
            logger.warning("AWS Lambda invocation failed: " + e.getMessage() + ". Defaulting to local grading fallback.");
            return gradeLocally(studentAnswers, correctAnswers);
        }
    }

    private GradingResult gradeLocally(List<StudentAnswer> studentAnswers, List<QuizQuestion> correctAnswers) {
        int score = 0;
        for (StudentAnswer ans : studentAnswers) {
            for (QuizQuestion q : correctAnswers) {
                if (q.getId().equals(ans.getQuestionId())) {
                    if (q.getCorrectAnswer() != null && q.getCorrectAnswer().trim().equalsIgnoreCase(ans.getSelectedAnswer().trim())) {
                        score++;
                    }
                    break;
                }
            }
        }
        int total = correctAnswers.size();
        int percent = total > 0 ? (int) Math.round(((double) score / total) * 100) : 0;
        return new GradingResult(score, total, percent);
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\"", "\\\"");
    }

    private int parseJsonIntField(String json, String fieldName) {
        try {
            String pattern = "\"" + fieldName + "\"\\s*:\\s*(\\d+)";
            java.util.regex.Pattern r = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = r.matcher(json);
            if (m.find()) {
                return Integer.parseInt(m.group(1));
            }
        } catch (Exception e) {
            logger.warning("Failed to parse JSON field " + fieldName + " from string: " + json);
        }
        return 0;
    }
}
