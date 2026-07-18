import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const enabled = Boolean(process.env.TEST_DB_NAME);
let app;
let server;
let base;
let models;
let user;
let token;

const api = async (path, options = {}) => {
  const response = await fetch(base + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await response.json();
  return { response, data };
};

before(async () => {
  if (!enabled) return;
  process.env.DB_NAME = process.env.TEST_DB_NAME;
  process.env.DB_USER = process.env.TEST_DB_USER || process.env.DB_USER;
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD;
  process.env.DB_HOST = process.env.TEST_DB_HOST || process.env.DB_HOST;
  process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_PORT;
  process.env.JWT_SECRET = process.env.JWT_SECRET || "planify-test-secret";
  models = await import("../src/models/index.js");
  await models.connectDB();
  ({ default: app } = await import("../src/app.js"));
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
  user = await models.User.create({
    name: "Integration User",
    email: `integration-${Date.now()}@example.com`,
    password: await bcrypt.hash("Testing1!", 4),
  });
  token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
});

after(async () => {
  if (!enabled) return;
  await user?.destroy();
  await new Promise((resolve) => server.close(resolve));
  await models.disconnectDB();
});

test("profile and preferences persist per account", { skip: !enabled }, async () => {
  const profile = await api("/auth/me", {
    method: "PATCH",
    body: { name: "Updated User", year: "Third Year", major: "Physics", bio: "Testing" },
  });
  assert.equal(profile.response.status, 200);
  assert.equal(profile.data.data.major, "Physics");

  const preferences = await api("/auth/me/preferences", {
    method: "PATCH",
    body: {
      preferences: { focusMinutes: 45, groupMessages: false },
      subjects: ["Physics", "Mathematics"],
    },
  });
  assert.equal(preferences.data.preferences.focusMinutes, 45);
  assert.deepEqual(preferences.data.subjects, ["Physics", "Mathematics"]);
});

test("personal create and completion do not create self notifications", { skip: !enabled }, async () => {
  const created = await api("/tasks", {
    method: "POST",
    body: { title: "Silent personal task", priority: "medium" },
  });
  assert.equal(created.response.status, 201);
  await api(`/tasks/${created.data.id}`, {
    method: "PUT",
    body: { title: created.data.title, status: "done", priority: "medium" },
  });
  const notifications = await api("/notifications");
  assert.equal(notifications.data.some((item) => /Task (created|completed):/.test(item.message)), false);
});

test("focus completion contributes to progress", { skip: !enabled }, async () => {
  const started = await api("/focus-sessions", {
    method: "POST",
    body: { kind: "focus", plannedSeconds: 60 },
  });
  assert.equal(started.response.status, 201);
  const completed = await api(`/focus-sessions/${started.data.id}`, {
    method: "PATCH",
    body: { action: "complete" },
  });
  assert.equal(completed.data.status, "completed");
  const progress = await api("/progress?range=week&timezone=UTC");
  assert.ok(progress.data.stats.focusSeconds >= 60);
  assert.equal(progress.data.buckets.length, 7);
});

test("group task changes notify other members but not the actor", { skip: !enabled }, async () => {
  const member = await models.User.create({
    name: "Other Member",
    email: `member-${Date.now()}@example.com`,
    password: await bcrypt.hash("Testing1!", 4),
  });
  try {
    const groupResponse = await api("/groups", {
      method: "POST",
      body: { name: "Integration Group", subject: "Testing" },
    });
    await models.GroupMember.create({ groupId: groupResponse.data.id, userId: member.id, status: "accepted" });
    const task = await api(`/groups/${groupResponse.data.id}/tasks`, {
      method: "POST",
      body: { title: "Shared test", priority: "medium", assignees: [member.id] },
    });
    assert.equal(task.response.status, 201);
    assert.equal(await models.Notifications.count({ where: { userId: user.id, groupId: groupResponse.data.id } }), 0);
    assert.equal(await models.Notifications.count({ where: { userId: member.id, groupId: groupResponse.data.id } }), 1);
  } finally {
    await member.destroy();
  }
});
