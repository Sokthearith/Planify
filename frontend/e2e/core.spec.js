import { expect, test } from '@playwright/test';

const user = {
  id: 'user-1',
  name: 'Planify Tester',
  email: 'tester@example.com',
  year: 'Second Year',
  major: 'Computer Science',
  bio: '',
  avatar: '',
  subjects: ['Mathematics', 'Computer Science'],
  preferences: {
    inAppNotifications: true,
    dueReminders: true,
    groupTaskUpdates: true,
    groupMessages: true,
    aiSuggestions: true,
    focusMinutes: 25,
    breakMinutes: 5,
  },
};

const progress = {
  stats: { completed: 0, onTimeRate: 0, focusSeconds: 0, streak: 0 },
  buckets: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(label => ({ label, total: 0, done: 0, rate: 0 })),
  subjects: [], priorities: [], nextActions: [],
};

const installApi = async (page, options = {}) => {
  let currentUser = { ...user, ...(options.user || {}) };
  const tasks = [];
  const groups = options.groups || [];
  const groupTasks = options.groupTasks || {};
  let scheduleCreates = 0;
  await page.addInitScript((initialUser) => {
    localStorage.setItem('planify:authToken', 'e2e-token');
    localStorage.setItem('planify:authUser', JSON.stringify(initialUser));
  }, currentUser);
  await page.route('http://localhost:5001/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api', '');
    const method = request.method();
    let body = null;
    if (path === '/auth/me' && method === 'GET') body = { data: currentUser };
    else if (path === '/auth/me' && method === 'PATCH') {
      currentUser = { ...currentUser, ...request.postDataJSON() };
      body = { data: currentUser };
    } else if (path === '/auth/me/preferences' && method === 'PATCH') {
      const update = request.postDataJSON();
      currentUser.preferences = { ...currentUser.preferences, ...(update.preferences || {}) };
      currentUser.subjects = update.subjects || currentUser.subjects;
      body = { preferences: currentUser.preferences, subjects: currentUser.subjects };
    } else if (path === '/tasks' && method === 'GET') body = tasks;
    else if (path === '/tasks' && method === 'POST') {
      const task = request.postDataJSON();
      body = { id: `task-${tasks.length + 1}`, ...task, status: 'pending', createAt: new Date().toISOString() };
      tasks.unshift(body);
    } else if (path === '/groups') body = groups;
    else if (/^\/groups\/[^/]+\/tasks$/.test(path) && method === 'GET') {
      body = groupTasks[path.split('/')[2]] || [];
    }
    else if (path === '/notifications') body = [];
    else if (path.startsWith('/schedules/active')) body = null;
    else if (path === '/schedules' && method === 'POST') {
      scheduleCreates += 1;
      const input = request.postDataJSON();
      body = { id: 'schedule-1', planData: input.planData, isActive: true };
    }
    else if (path.startsWith('/progress')) body = progress;
    else if (path === '/focus-sessions/current') body = null;
    else if (path === '/focus-sessions' && method === 'POST') {
      const input = request.postDataJSON();
      body = {
        id: 'focus-1', kind: input.kind, status: 'running', plannedSeconds: input.plannedSeconds,
        elapsedSeconds: 0, endsAt: new Date(Date.now() + input.plannedSeconds * 1000).toISOString(),
      };
    } else body = { message: 'OK' };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  return { tasks, getUser: () => currentUser, getScheduleCreates: () => scheduleCreates };
};

test('login remains authenticated when optional dashboard data fails', async ({ page }) => {
  await page.route('http://localhost:5001/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api', '');
    if (path === '/auth/login') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'login-token', data: user }),
      });
      return;
    }
    if (path === '/auth/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: user }),
      });
      return;
    }
    if (path === '/tasks') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Tasks temporarily unavailable' }),
      });
      return;
    }
    const body = path === '/groups' || path === '/notifications' ? [] : null;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in' }).first().click();
  await page.locator('input[type="email"]').fill('tester@example.com');
  await page.locator('input[type="password"]').fill('Password1!');
  await page.getByRole('button', { name: 'Sign in' }).last().click();

  await expect(page.getByRole('button', { name: 'Home' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('planify:authToken'))).toBe('login-token');
});

test('new personal task appears on Home immediately', async ({ page }) => {
  await installApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'New task' }).first().click();
  await page.getByPlaceholder('e.g. Complete problem set').fill('E2E calculus task');
  await page.locator('.modal select').selectOption('Mathematics');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByText('E2E calculus task').first()).toBeVisible();
});

test('profile picture persists to landing account avatar', async ({ page }) => {
  const state = await installApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1pQAAAAASUVORK5CYII=', 'base64');
  await page.locator('input[type="file"]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect.poll(() => Boolean(state.getUser().avatar)).toBe(true);
  await page.getByTitle('Back to home menu').click();
  await expect(page.locator('.landing-nav .avatar img')).toBeVisible();
});

test('custom focus duration starts a persisted session', async ({ page }) => {
  await installApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Progress' }).click();
  const focusMinutes = page.getByLabel('Focus minutes');
  await focusMinutes.fill('45');
  await page.getByRole('button', { name: 'Start focus' }).click();
  await expect(page.getByRole('button', { name: 'Pause focus' })).toBeVisible();
  await expect(page.getByText('45').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open full screen' })).toBeVisible();
});

test('group member avatar appears on shared assignments', async ({ page }) => {
  const avatar = 'data:image/jpeg;base64,/9j/2Q==';
  const member = { id: 'membership-1', userId: 'user-1', role: 'admin', status: 'accepted', User: { ...user, avatar } };
  await installApi(page, {
    user: { avatar },
    groups: [{ id: 'group-1', name: 'Study Group', subject: 'Mathematics', createBy: 'user-1', GroupMembers: [member] }],
    groupTasks: { 'group-1': [{ id: 'group-task-1', groupId: 'group-1', title: 'Shared worksheet', priority: 'medium', done: false, assignees: ['user-1'] }] },
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Groups', exact: true }).click();
  await page.getByText('Study Group', { exact: true }).click();
  await expect(page.getByText('Shared worksheet')).toBeVisible();
  await expect(page.locator('.av-stack img')).toBeVisible();
});

test('first manual schedule edit creates an active schedule', async ({ page }) => {
  const state = await installApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Add row' }).click();
  await expect.poll(state.getScheduleCreates).toBe(1);
});
