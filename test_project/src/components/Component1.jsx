import React, { useState } from "react";

function Component1() {
  const questions = [
    {
      question: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome", "Lisbon"],
      correctAnswer: "Paris",
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus", "Saturn"],
      correctAnswer: "Mars",
    },
    {
      question: "What is 5 + 7?",
      options: ["10", "11", "12", "13", "14"],
      correctAnswer: "12",
    },
  ];

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(null);
  const [sidebarMode, setSidebarMode] = useState("explanation");
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeQuestion =
    activeQuestionIndex !== null ? questions[activeQuestionIndex] : null;

  const askAi = async ({
    mode,
    questionData,
    selectedAnswer,
    userMessage = "",
    history = [],
  }) => {
    const response = await fetch("https://abudi-ai.onrender.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        question: questionData.question,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        selectedAnswer,
        userMessage,
        history,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to get response from backend");
    }

    return await response.json();
  };

  const handleOptionClick = async (questionIndex, option) => {
    if (selectedAnswers[questionIndex]) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));

    const question = questions[questionIndex];
    const isCorrect = option === question.correctAnswer;

    if (isCorrect) return;

    setActiveQuestionIndex(questionIndex);
    setIsSidebarOpen(true);
    setSidebarMode("explanation");
    setLoading(true);
    setError("");
    setChatMessages([
      /*{
        sender: "ai",
        text: "Thinking...",
      },*/
    ]);

    try {
      const data = await askAi({
        mode: "short_explanation",
        questionData: question,
        selectedAnswer: option,
        userMessage: "Explain briefly why this answer is wrong and why the correct answer is right.",
      });

      setChatMessages([
        {
          sender: "ai",
          text: data.reply,
        },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setChatMessages([
        {
          sender: "ai",
          text: "Sorry, something went wrong while getting the explanation.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGoDeeper = async () => {
    if (activeQuestionIndex === null) return;

    const currentQuestion = questions[activeQuestionIndex];
    const selectedOption = selectedAnswers[activeQuestionIndex];

    setSidebarMode("deeper");
    setLoading(true);
    setError("");

    try {
      const data = await askAi({
        mode: "deep_explanation",
        questionData: currentQuestion,
        selectedAnswer: selectedOption,
        userMessage:
          "Give a deeper step-by-step explanation in simple student-friendly language.",
      });

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.reply,
        },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskWhy = () => {
    setSidebarMode("chat");
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || activeQuestionIndex === null || loading) return;

    const currentQuestion = questions[activeQuestionIndex];
    const selectedOption = selectedAnswers[activeQuestionIndex];
    const newUserMessage = {
      sender: "user",
      text: userInput.trim(),
    };

    const previousMessages = [...chatMessages];

setChatMessages((prev) => [...prev, newUserMessage]);
setUserInput("");
setLoading(true);
setError("");

try {
  const data = await askAi({
    mode: "question_chat",
    questionData: currentQuestion,
    selectedAnswer: selectedOption,
    userMessage: newUserMessage.text,
    history: previousMessages,
  });

  setChatMessages((prev) => [
    ...prev,
    {
      sender: "ai",
      text: data.reply,
    },
  ]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, something went wrong while getting the response.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSidebarMode("explanation");
    setActiveQuestionIndex(null);
    setChatMessages([]);
    setUserInput("");
    setError("");
  };

  return (
    <div className="quiz-layout">
      <aside className={`quiz-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>AI Help</h2>
          <button className="sidebar-close-btn" onClick={handleCloseSidebar}>
            ×
          </button>
        </div>

        {activeQuestion && (
          <div className="sidebar-content">
            <div className="sidebar-status wrong-status">Incorrect Answer</div>

            <div className="sidebar-section">
              <p className="sidebar-label">Question</p>
              <p className="sidebar-text">{activeQuestion.question}</p>
            </div>

            <div className="sidebar-section">
              <p className="sidebar-label">Correct answer</p>
              <p className="sidebar-correct-answer">
                {activeQuestion.correctAnswer}
              </p>
            </div>

            <div className="sidebar-section">
              <p className="sidebar-label">AI Help</p>

              <div className="chat-messages">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`chat-message ${
                      message.sender === "user" ? "user-message" : "ai-message"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}

                {loading && (
                  <div className="chat-message ai-message">Thinking...</div>
                )}
              </div>

              {error && <p style={{ color: "#fca5a5", marginTop: "10px" }}>{error}</p>}

              <div className="sidebar-actions">
                <button className="sidebar-action-btn" onClick={handleGoDeeper}>
                  Go deeper
                </button>
                <button
                  className="sidebar-action-btn secondary"
                  onClick={handleAskWhy}
                >
                  Ask why?
                </button>
              </div>

              {sidebarMode === "chat" && (
                <div className="chat-input-area" style={{ marginTop: "14px" }}>
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask why this is wrong..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                  />
                  <button className="chat-send-btn" onClick={handleSendMessage}>
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      <main className={`quiz-main ${isSidebarOpen ? "shrink" : ""}`}>
        <div className="quiz-container">
          <h1 className="quiz-title">Quiz Test</h1>
          <p className="quiz-subtitle">
            Choose an answer and get AI help if you make a mistake
          </p>

          {questions.map((q, questionIndex) => {
            const selectedOption = selectedAnswers[questionIndex];

            return (
              <div key={questionIndex} className="quiz-card">
                <h2 className="quiz-question">
                  {questionIndex + 1}. {q.question}
                </h2>

                <div className="quiz-options">
                  {q.options.map((option, optionIndex) => {
                    let buttonClass = "quiz-option";

                    if (selectedOption) {
                      if (option === q.correctAnswer) {
                        buttonClass += " correct";
                      } else if (option === selectedOption) {
                        buttonClass += " wrong";
                      }
                    }

                    return (
                      <button
                        key={optionIndex}
                        className={buttonClass}
                        onClick={() => handleOptionClick(questionIndex, option)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {selectedOption && (
                  <div className="quiz-answer-box">
                    <p className="quiz-answer-text">
                      <strong>Correct answer:</strong> {q.correctAnswer}
                    </p>
                    <p className="quiz-result-text">
                      {selectedOption === q.correctAnswer ? "Correct" : "Incorrect"}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default Component1;