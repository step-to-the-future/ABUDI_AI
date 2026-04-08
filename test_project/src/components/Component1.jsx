import React, { useState } from "react";

function Component1() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userMessage },
    ]);

    setMessage("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to get response from backend");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.reply },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong while sending the request.");
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, something went wrong while getting the response.",
        },
      ]);
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-wrapper">
        <h1 className="chat-title">ABUDI AI</h1>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>Start the conversation by typing a message below.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message-row ${
                msg.sender === "user" ? "user-row" : "ai-row"
              }`}
            >
              <div
                className={`chat-message-bubble ${
                  msg.sender === "user" ? "user-bubble" : "ai-bubble"
                }`}
              >
                <p>{msg.text}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message-row ai-row">
              <div className="chat-message-bubble ai-bubble">
                <p>Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-box">
            <p>{error}</p>
          </div>
        )}

        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
          />

          <button
            className="chat-send-button"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Component1;