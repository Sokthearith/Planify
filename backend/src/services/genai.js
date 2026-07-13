import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-2.5-flash";

let client;

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    const error = new Error("Gemini API key is not configured");
    error.code = "GEMINI_NOT_CONFIGURED";
    throw error;
  }
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
};

export async function handleChatbot(userMessage, conversationHistory = []) {
  const ai = getClient();
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
  const ai = getClient();
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
export async function autoScheduleTasks(tasks, options = {}) {
  const ai = getClient();
  const {
    weekStart,
    timezone = "UTC",
    focusStart = "08:00",
    focusEnd = "20:00",
    sessionMinutes = 60,
    includeWeekends = true,
    instructions = "",
    availability = [],
  } = options;

  const taskList = tasks
    .map(
      (t, index) =>
        `- T${index + 1} | "${t.title}" | priority: ${t.priority} | subject: ${t.subject || "General"} | deadline: ${t.deadline || "none"} | estimated hours: ${t.estimatedHours || "not provided"}`,
    )
    .join("\n");

  const availabilityList = availability.length
    ? availability
        .map(
          (slot) =>
            `- day ${slot.dayOfWeek}: ${slot.startTime}-${slot.endTime} (${slot.type})${slot.name ? `, ${slot.name}` : ""}`,
        )
        .join("\n")
    : "No saved availability. Use the requested focus window.";

  const prompt = `Build a practical study plan for the seven-day period beginning ${weekStart} in timezone ${timezone}.

Tasks:
${taskList}

Planning preferences:
- Daily focus window: ${focusStart}-${focusEnd}
- Preferred session length: ${sessionMinutes} minutes
- Weekends: ${includeWeekends ? "available" : "do not schedule"}
- Additional instructions: ${instructions.trim() || "none"}

Saved availability (day numbers use Sunday=0 through Saturday=6):
${availabilityList}

Schedule every task at least once. Split tasks into multiple sessions when estimated time requires it. Do not schedule overlapping sessions, outside the seven-day period, outside the focus window, in blocked availability, or after a task deadline. Use the task reference (T1, T2, etc.) exactly.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction:
        "You are the scheduling engine for Planify, a student productivity app. Return a realistic, conflict-free study plan as structured JSON. " +
        "Prioritize urgent deadlines, distribute demanding work across the week, and keep the explanation concise. " +
        "Dates must use YYYY-MM-DD and times must use 24-hour HH:MM. Do not invent tasks.",
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          strategyNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          entries: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskRef: { type: Type.STRING },
                date: { type: Type.STRING },
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["taskRef", "date", "startTime", "endTime", "reason"],
            },
          },
        },
        required: ["summary", "strategyNotes", "entries"],
      },
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  });

  return {
    ...JSON.parse(response.text),
    model: MODEL,
  };
}
