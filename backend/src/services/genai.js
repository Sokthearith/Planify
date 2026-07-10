import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = "gemini-2.5-flash";

export async function handleChatbot(userMessage, conversationHistory = []) {
  const contents = [
    ...conversationHistory,
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction:
        "You are Planify Bot, a friendly and helpful assistant for the Planify study planner app. " +
        "Users can create tasks, organize into subjects, set priorities (low/medium/high), " +
        "create study groups, invite members by email, assign group tasks, track member progress, " +
        "and generate AI-powered schedules. Answer concisely and conversationally.",
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  return response.text;
}

export async function handleSmartScheduler(userScheduleRequest) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: userScheduleRequest }] }],
    config: {
      systemInstruction:
        "You are a strict calendar parser. Extract structured schedule entries from the user's natural language request. " +
        "Output ONLY a valid JSON array matching the specified schema. Each entry must include: " +
        "taskName (short descriptive title), startTime (HH:MM format, 24-hour), endTime (HH:MM format, 24-hour), " +
        "and priority (one of: High, Medium, Low). Infer any missing details intelligently. " +
        "If the input is ambiguous, use reasonable defaults (e.g., 1-hour duration, Medium priority).",
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            taskName: { type: Type.STRING },
            startTime: { type: Type.STRING },
            endTime: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          },
          propertyOrdering: ["taskName", "startTime", "endTime", "priority"],
        },
      },
      temperature: 0.2,
      maxOutputTokens: 4096,
    },
  });

  return JSON.parse(response.text);
}
export async function autoScheduleTasks(tasks) {
  const taskList = tasks
    .map(
      (t) =>
        `- "${t.title}" | priority: ${t.priority} | subject: ${t.subject || "General"} | deadline: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : "none"}`,
    )
    .join("\n");

  const prompt = `Here are my existing tasks. Create an optimized weekly study schedule that places each task into specific time blocks. Consider priority (high first), deadlines (urgent first), and balance subjects across days.\n\nTasks:\n${taskList}\n\nReturn a JSON array of scheduled blocks. Spread tasks across weekdays (Monday–Friday), 08:00–20:00. Assign each entry to a specific day. Group shorter tasks together.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction:
        "You are an AI study scheduler. Given a list of tasks with priorities, subjects, and deadlines, " +
        "you generate an optimized weekly schedule. Output ONLY valid JSON matching the schema. " +
        "Place high-priority and urgent tasks in peak hours (morning). Balance subjects across the week. " +
        "Distribute tasks across Monday through Friday. Include short breaks between tasks. " +
        "Every task from the input must appear in the schedule.",
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            taskName: { type: Type.STRING },
            day: {
              type: Type.STRING,
              enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            },
            startTime: { type: Type.STRING },
            endTime: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          },
          propertyOrdering: ["taskName", "day", "startTime", "endTime", "priority"],
        },
      },
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  });

  return JSON.parse(response.text);
}
