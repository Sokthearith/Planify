import dotenv from "dotenv";

const MODEL = "auto:free";
const API_BASE = "https://bazaarlink.ai/api/v1/chat/completions";

let apiKey;

const getKey = () => {
  dotenv.config({ override: true });
  apiKey = process.env.BAZAARLINK_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("BazaarLink API key is not configured");
    error.code = "BAZAARLINK_NOT_CONFIGURED";
    throw error;
  }
  return apiKey;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const apiFetch = async (body, retries = 3) => {
  const key = getKey();
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${res.status}`;
    const isRetryable = res.status === 429 || res.status === 503;
    if (isRetryable && attempt < retries) {
      const match = msg.match(/try again in ([\d.]+)s/);
      const wait = match ? Math.ceil(Number(match[1]) * 1000) + 500 : 5000 * attempt;
      await sleep(wait);
      continue;
    }
    const e = new Error(`BazaarLink API error: ${msg}`);
    e.status = res.status;
    throw e;
  }
};

export async function handleChatbot(userMessage, conversationHistory = []) {
  const messages = [
    {
      role: "system",
      content:
        "You are Planify Bot, a friendly and helpful assistant for the Planify study planner app. " +
        "Users can create tasks, organize into subjects, set priorities (low/medium/high), " +
        "create study groups, invite members by email, assign group tasks, track member progress, " +
        "and generate AI-powered schedules. Answer concisely and conversationally.",
    },
    ...conversationHistory.map((m) => ({
      role: m.role,
      content: m.parts?.map((p) => p.text).join("\n") || m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const data = await apiFetch({
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  });

  return data.choices[0].message.content;
}

export async function handleSmartScheduler(userScheduleRequest) {
  const data = await apiFetch({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a strict calendar parser. Extract structured schedule entries from the user's natural language request. " +
          "Output ONLY a valid JSON array matching the specified schema. Each entry must include: " +
          "taskName (short descriptive title), startTime (HH:MM format, 24-hour), endTime (HH:MM format, 24-hour), " +
          "and priority (one of: High, Medium, Low). Infer any missing details intelligently. " +
          "If the input is ambiguous, use reasonable defaults (e.g., 1-hour duration, Medium priority).\n\n" +
          'Schema: { "type": "array", "items": { "type": "object", "properties": { "taskName": { "type": "string" }, "startTime": { "type": "string" }, "endTime": { "type": "string" }, "priority": { "type": "string", "enum": ["High", "Medium", "Low"] } }, "required": ["taskName", "startTime", "endTime", "priority"] } }',
      },
      { role: "user", content: userScheduleRequest },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 4096,
  });

  return JSON.parse(data.choices[0].message.content);
}

export async function autoScheduleTasks(tasks, options = {}) {
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

  const todayStr = options.timezone
    ? new Intl.DateTimeFormat("en-CA", { timeZone: options.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
    : new Date().toISOString().slice(0, 10);

  const prompt = `Build a practical study plan for the seven-day period starting from today (${todayStr}) in timezone ${timezone}.

Tasks:
${taskList}

Planning preferences:
- Daily focus window: ${focusStart}-${focusEnd}
- Preferred session length: ${sessionMinutes} minutes
- Weekends: ${includeWeekends ? "available" : "do not schedule"}
- Additional instructions: ${instructions.trim() || "none"}

Saved availability (day numbers use Sunday=0 through Saturday=6):
${availabilityList}

Schedule every task at least once. Split tasks into multiple sessions when estimated time requires it. Include a 10-minute break between consecutive sessions on the same day. Do not schedule overlapping sessions, outside the seven-day period, outside the focus window, in blocked availability, before today (${todayStr}), or after a task deadline. Use the task reference (T1, T2, etc.) exactly.`;

  const systemInstruction =
    "You are the scheduling engine for Planify, a student productivity app. Return a realistic, conflict-free study plan as structured JSON. " +
    "Prioritize urgent deadlines, distribute demanding work across the week, and keep the explanation concise. " +
    "Dates must use YYYY-MM-DD and times must use 24-hour HH:MM. Do not invent tasks.\n\n" +
    'Required JSON schema: { "type": "object", "properties": { "summary": { "type": "string" }, "strategyNotes": { "type": "array", "items": { "type": "string" } }, "entries": { "type": "array", "items": { "type": "object", "properties": { "taskRef": { "type": "string" }, "date": { "type": "string" }, "startTime": { "type": "string" }, "endTime": { "type": "string" }, "reason": { "type": "string" } }, "required": ["taskRef", "date", "startTime", "endTime", "reason"] } } }, "required": ["summary", "strategyNotes", "entries"] }';

  const data = await apiFetch({
    model: MODEL,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 8192,
  });

  return {
    ...JSON.parse(data.choices[0].message.content),
    model: MODEL,
  };
}
