package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Request struct {
	Mode           string        `json:"mode"`
	Question       string        `json:"question"`
	Options        []string      `json:"options"`
	CorrectAnswer  string        `json:"correctAnswer"`
	SelectedAnswer string        `json:"selectedAnswer"`
	UserMessage    string        `json:"userMessage"`
	History        []ChatMessage `json:"history"`
	Message        string        `json:"message"` // fallback for old simple chat
}

type Response struct {
	Reply string `json:"reply"`
}

type ChatMessage struct {
	Sender string `json:"sender"`
	Text   string `json:"text"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIRequest struct {
	Model    string          `json:"model"`
	Messages []OpenAIMessage `json:"messages"`
}

type OpenAIChoice struct {
	Message OpenAIMessage `json:"message"`
}

type OpenAIResponse struct {
	Choices []OpenAIChoice `json:"choices"`
}

func init() {
	_ = godotenv.Load()
}

func callAI(messages []OpenAIMessage) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("OPENAI_API_KEY is missing")
	}

	model := os.Getenv("OPENAI_MODEL")
	if model == "" {
		model = "gpt-4o-mini"
	}

	url := "https://api.openai.com/v1/chat/completions"

	body := OpenAIRequest{
		Model:    model,
		Messages: messages,
	}

	jsonData, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	fmt.Println("OpenAI status:", resp.StatusCode)
	fmt.Println("OpenAI raw response:", string(bodyBytes))

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("openai returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var result OpenAIResponse
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %v", err)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no choices returned")
	}

	return result.Choices[0].Message.Content, nil
}

func buildPrompt(req Request) []OpenAIMessage {
	systemMessage := OpenAIMessage{
		Role: "system",
		Content: `You are an AI tutor helping a student with quiz questions.
Explain clearly and simply.
Keep your tone supportive and student-friendly.
When explaining mistakes:
1. say why the chosen answer is wrong,
2. say why the correct answer is right,
3. keep it concise unless deeper explanation is requested.
Do not make up facts outside the question context unless needed for explanation.`,
	}

	// Old simple chatbot fallback
	if strings.TrimSpace(req.Message) != "" && strings.TrimSpace(req.Question) == "" {
		return []OpenAIMessage{
			systemMessage,
			{
				Role:    "user",
				Content: req.Message,
			},
		}
	}

	baseContext := fmt.Sprintf(
		`Question: %s
Options: %s
Correct answer: %s
Student selected: %s`,
		req.Question,
		strings.Join(req.Options, ", "),
		req.CorrectAnswer,
		req.SelectedAnswer,
	)

	switch req.Mode {
	case "short_explanation":
		return []OpenAIMessage{
			systemMessage,
			{
				Role: "user",
				Content: baseContext + `

Please explain briefly why the selected answer is wrong and why the correct answer is right.
Use simple language.
Keep it short.`,
			},
		}

	case "deep_explanation":
		return []OpenAIMessage{
			systemMessage,
			{
				Role: "user",
				Content: baseContext + `

Give a deeper step-by-step explanation.
Make it easy for a student to understand.
Show the logic clearly.`,
			},
		}

	case "question_chat":
		messages := []OpenAIMessage{
			systemMessage,
			{
				Role: "user",
				Content: baseContext + `

The student will now ask follow-up questions about this quiz item.
Answer only in the context of this question unless the student asks for broader help.`,
			},
		}

		for _, msg := range req.History {
			role := "assistant"
			if msg.Sender == "user" {
				role = "user"
			}
			messages = append(messages, OpenAIMessage{
				Role:    role,
				Content: msg.Text,
			})
		}

		if strings.TrimSpace(req.UserMessage) != "" {
			messages = append(messages, OpenAIMessage{
				Role:    "user",
				Content: req.UserMessage,
			})
		}

		return messages

	default:
		return []OpenAIMessage{
			systemMessage,
			{
				Role: "user",
				Content: baseContext + `

Explain this question clearly to the student.`,
			},
		}
	}
}

func chatHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var reqBody Request
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

    fmt.Println("Server running on " + port)

	messages := buildPrompt(reqBody)

	reply, err := callAI(messages)
	if err != nil {
		fmt.Println("Backend error:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(Response{Reply: reply})
}

func main() {
	http.HandleFunc("/api/chat", chatHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	fmt.Println("Server running on " + port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		fmt.Println("Server error:", err)
	}
}