exports.handler = async (event) => {
    console.log("Received autograding request event:", JSON.stringify(event, null, 2));
    
    const { studentAnswers, correctAnswers } = event;
    
    if (!studentAnswers || !correctAnswers) {
        return {
            statusCode: 400,
            body: "Missing studentAnswers or correctAnswers in event payload"
        };
    }
    
    let score = 0;
    
    // Map correct answers by questionId for fast lookup
    const correctMap = {};
    correctAnswers.forEach(q => {
        // questionId can be either ID or index based
        correctMap[q.questionId] = q.correctAnswer;
    });
    
    studentAnswers.forEach(ans => {
        const correctVal = correctMap[ans.questionId];
        if (correctVal !== undefined && String(correctVal).trim() === String(ans.selectedAnswer).trim()) {
            score++;
        }
    });
    
    const totalQuestions = correctAnswers.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    
    return {
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        evaluatedAt: new Date().toISOString()
    };
};
