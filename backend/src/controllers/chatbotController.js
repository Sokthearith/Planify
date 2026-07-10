import { handleChatbot } from "../services/genai.js";

export const chatbox = async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.json({ answer: "Hi! I'm Planify Bot. How can I help you?" });
  }
  try {
    const answer = await handleChatbot(message, history || []);
    res.json({ answer });
  } catch {
    res.json({ answer: "Sorry, I'm having a trouble connecting, Try again " });
  }
};
