/* Backend API adapter */

import { io } from 'socket.io-client';

const PlanifyAPI = (() => {
  const API_BASE = localStorage.getItem('planify:apiBase') || 'http://localhost:5001/api';
  const SOCKET_BASE = API_BASE.replace(/\/api\/?$/, '');
  const TOKEN_KEY = 'planify:authToken';
  const USER_KEY = 'planify:authUser';

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const request = async (path, options = {}) => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (token) headers.Authorization = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(API_BASE + path, {
        ...options,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch (error) {
      const connectionError = new Error('Cannot reach the Planify server. Start the backend and try again.');
      connectionError.status = 0;
      connectionError.cause = error;
      throw connectionError;
    }

    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = { message: text }; }
    }

    if (!res.ok) {
      const message = data?.message || data?.errors?.join(', ') || 'Request failed';
      const requestError = new Error(message);
      requestError.status = res.status;
      requestError.data = data;
      throw requestError;
    }

    return data;
  };

  const initials = (name, fallback = 'U') => {
    return (name || fallback)
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || fallback;
  };

  const formatRelative = (value) => {
    if (!value) return 'NOW';
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '';
    const minutes = Math.max(0, Math.floor((Date.now() - then) / 60000));
    if (minutes < 1) return 'NOW';
    if (minutes < 60) return minutes + 'M AGO';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'H AGO';
    return Math.floor(hours / 24) + 'D AGO';
  };

  const formatDue = (value) => {
    if (!value) return { due: 'No date', dueDate: '' };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { due: 'Scheduled', dueDate: value };

    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const target = new Date(date);
    const targetUTC = new Date(Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()));
    const days = Math.round((targetUTC - todayUTC) / 86400000);
    const due =
      days === 0 ? 'Today' :
      days === 1 ? 'Tomorrow' :
      days > 1 ? days + ' days' :
      Math.abs(days) + ' days overdue';

    const hasTime = value.includes('T') && !value.endsWith('T00:00:00.000Z') && !value.endsWith('T00:00');
    return {
      due,
      dueDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      dueTime: hasTime ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : null,
    };
  };

  const toUiPriority = (priority) => priority === 'high' ? 'urgent' : (priority || 'medium');
  const toApiPriority = (priority) => priority === 'urgent' ? 'high' : (priority || 'medium');

  const toUiTask = (task, memberLookup = {}) => {
    const rawDeadline = task.deadline || task.dueDate || '';
    const done = task.done !== undefined ? task.done : task.status === 'done';
    const due = formatDue(rawDeadline);
    return {
      id: task.id,
      title: task.title,
      desc: task.description || '',
      subject: task.subject || 'General',
      priority: toUiPriority(task.priority),
      done,
      assignees: (task.assignees || []).map(id => memberLookup[id] || String(id).toUpperCase().slice(0, 2)),
      assigneeIds: task.assignees || [],
      rawDeadline,
      status: task.status || (done ? 'done' : 'pending'),
      completedAt: task.completedAt || null,
      estimatedHours: task.estimatedHours != null && task.estimatedHours !== '' ? Number(task.estimatedHours) : null,
      ...due,
    };
  };

  const toDateValue = (v) => {
    if (!v) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v;
    return null;
  };

  const taskPayload = (task) => {
    const done = task.done === true;
    const status = done
      ? 'done'
      : task.status === 'in_progress' ? 'in_progress' : 'pending';

    return {
      title: task.title,
      description: task.desc || task.description || '',
      deadline: task.rawDeadline || toDateValue(task.due),
      dueDate: task.rawDeadline || toDateValue(task.due),
      priority: toApiPriority(task.priority),
      estimatedHours: task.estimatedHours || null,
      done,
      status,
      assignees: task.assigneeIds || task.assignees || [],
    };
  };

  const toUiGroupMember = (member) => ({
    id: member.userId,
    memberId: member.id,
    name: member.User?.name || member.User?.email || '',
    initials: initials(member.User?.name || member.User?.email, 'U'),
    role: member.role || 'member',
    avatar: member.User?.avatar || '',
  });

  const toUiGroup = (group, user) => {
    const rawMembers = group.GroupMembers || [];
    const memberList = rawMembers.map(toUiGroupMember);
    const subject = group.subject || 'General';
    return {
      id: group.id,
      title: group.name,
      subject,
      mark: subject.slice(0, 2).toUpperCase(),
      members: memberList.map(m => m.initials),
      memberList,
      createdBy: group.createBy,
      progress: group.progress || 0,
      tasksDone: group.tasksDone || 0,
      tasksTotal: group.tasksTotal || 0,
    };
  };

  const toUiNotification = (notification) => ({
    id: notification.id,
    kind:
      notification.type === 'task' ? 'urgent' :
      notification.type === 'group_invite' ? 'invite' :
      notification.type === 'group' ? 'group' :
      notification.type || 'system',
    title: notification.message,
    sub: notification.Task?.title || (notification.inviteStatus ? 'Invite ' + notification.inviteStatus : ''),
    time: formatRelative(notification.sentAt),
    unread: !notification.isRead,
    inviteStatus: notification.inviteStatus,
    groupId: notification.groupId,
  });

  const toUiMessage = (message) => ({
    id: message.id,
    groupId: message.groupId,
    senderId: message.senderId,
    text: message.message,
    sentAt: message.sentAt,
    senderName: message.sender?.name || message.sender?.email || 'Member',
    senderInitials: initials(message.sender?.name || message.sender?.email, 'U'),
    senderAvatar: message.sender?.avatar || '',
  });

  const toUiSchedule = (schedule) => {
    if (!schedule) return null;
    return {
      ...schedule,
      planData: {
        ...(schedule.planData && !Array.isArray(schedule.planData) ? schedule.planData : {}),
        timezone: schedule.planData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        entries: Array.isArray(schedule.planData?.entries)
          ? schedule.planData.entries
          : (Array.isArray(schedule.planData) ? schedule.planData : []),
      },
    };
  };

  const saveAuth = (payload) => {
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.data));
    return payload.data;
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const getStoredAuth = () => {
    const token = getToken();
    if (!token) return null;
    try {
      return { token, user: JSON.parse(localStorage.getItem(USER_KEY) || 'null') };
    } catch (e) {
      return { token, user: null };
    }
  };

  const loadGroupsWithTasks = async (user) => {
    const groups = await request('/groups');
    const mappedGroups = groups.map(group => toUiGroup(group, user));
    const taskPairs = await Promise.all(mappedGroups.map(async (group) => {
      const lookup = {};
      (group.memberList || []).forEach(m => { lookup[m.id] = m.initials; });
      const tasks = await request('/groups/' + group.id + '/tasks');
      return [group.id, tasks.map(t => toUiTask(t, lookup))];
    }));
    return {
      groups: mappedGroups,
      groupTasks: Object.fromEntries(taskPairs),
    };
  };

  return {
    request,
    initials,
    toUiTask,
    toUiGroup,
    toUiGroupMember,
    toUiNotification,
    toUiMessage,
    toUiSchedule,
    getStoredAuth,
    clearAuth,
    login: async (email, password) => saveAuth(await request('/auth/login', {
      method: 'POST',
      body: { email, password },
    })),
    register: async (name, email, password) => saveAuth(await request('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    })),
    requestPasswordReset: async (email) => request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
    verifyPasswordResetCode: async (email, code) => request('/auth/verify-reset-code', {
      method: 'POST',
      body: { email, code },
    }),
    resetPassword: async (email, code, password) => request('/auth/reset-password', {
      method: 'POST',
      body: { email, code, password },
    }),
    me: async () => {
      const data = await request('/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(data.data));
      return data.data;
    },
    updateMe: async (profile) => {
      const data = await request('/auth/me', { method: 'PATCH', body: profile });
      localStorage.setItem(USER_KEY, JSON.stringify(data.data));
      return data.data;
    },
    getPreferences: async () => request('/auth/me/preferences'),
    updatePreferences: async (updates) => request('/auth/me/preferences', {
      method: 'PATCH',
      body: updates,
    }),
    logout: async () => {
      try { await request('/auth/logout', { method: 'POST' }); } catch (e) {}
      clearAuth();
    },
    listTasks: async () => (await request('/tasks')).map(toUiTask),
    createTask: async (task) => toUiTask(await request('/tasks', {
      method: 'POST',
      body: taskPayload(task),
    })),
    updateTask: async (id, task) => toUiTask(await request('/tasks/' + id, {
      method: 'PUT',
      body: taskPayload(task),
    })),
    deleteTask: async (id) => request('/tasks/' + id, { method: 'DELETE' }),
    loadGroupsWithTasks,
    createGroup: async (group, user) => toUiGroup(await request('/groups', {
      method: 'POST',
      body: { name: group.name, subject: group.subject, invites: group.invites || [] },
    }), user),
    deleteGroup: async (groupId) => request('/groups/' + groupId, {
      method: 'DELETE',
    }),
    addGroupMember: async (groupId, email) => request('/groups/' + groupId + '/members', {
      method: 'POST',
      body: { email },
    }),
    removeGroupMember: async (groupId, memberId) => request('/groups/' + groupId + '/members/' + memberId, {
      method: 'DELETE',
    }),
    listGroupTasks: async (groupId, memberLookup = {}) =>
      (await request('/groups/' + groupId + '/tasks'))
        .map(task => toUiTask(task, memberLookup)),
    createGroupTask: async (groupId, task, memberLookup = {}) => toUiTask(await request('/groups/' + groupId + '/tasks', {
      method: 'POST',
      body: taskPayload(task),
    }), memberLookup),
    updateGroupTask: async (groupId, taskId, task, memberLookup = {}) => toUiTask(await request('/groups/' + groupId + '/tasks/' + taskId, {
      method: 'PUT',
      body: taskPayload(task),
    }), memberLookup),
    deleteGroupTask: async (groupId, taskId) => request('/groups/' + groupId + '/tasks/' + taskId, {
      method: 'DELETE',
    }),
    listGroupMessages: async (groupId) => (await request('/groups/' + groupId + '/messages')).map(toUiMessage),
    listNotifications: async () => (await request('/notifications')).map(toUiNotification),
    markNotificationRead: async (id) => toUiNotification(await request('/notifications/' + id + '/read', {
      method: 'PATCH',
    })),
    markNotificationsRead: async () => request('/notifications/read-all', { method: 'PATCH' }),
    deleteNotification: async (id) => request('/notifications/' + id, { method: 'DELETE' }),
    acceptInvite: async (notificationId) => request('/notifications/' + notificationId + '/accept', { method: 'PATCH' }),
    declineInvite: async (notificationId) => request('/notifications/' + notificationId + '/decline', { method: 'PATCH' }),
    getActiveSchedule: async () => toUiSchedule(await request('/schedules/active?timezone=' + encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone))),
    createSchedule: async (planData = { entries: [] }) => toUiSchedule(await request('/schedules', {
      method: 'POST',
      body: {
        planData,
        isActive: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    })),
    updateSchedule: async (id, planData) => toUiSchedule(await request('/schedules/' + id, {
      method: 'PUT',
      body: {
        planData,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    })),
    autoGenerateSchedule: async (preferences = {}) => toUiSchedule(await request('/schedules/auto-generate', {
      method: 'POST',
      body: preferences,
    })),
    chat: async (message, history = []) => {
      const response = await request('/chat', {
        method: 'POST',
        body: { message, history },
      });
      return response?.answer || '';
    },
    getAvailability: async () => request('/availability'),
    setAvailability: async (slots) => request('/availability', { method: 'PUT', body: { slots } }),
    deleteAvailability: async () => request('/availability', { method: 'DELETE' }),
    getCurrentFocusSession: async () => request('/focus-sessions/current'),
    startFocusSession: async (kind, plannedSeconds) => request('/focus-sessions', {
      method: 'POST', body: { kind, plannedSeconds },
    }),
    updateFocusSession: async (id, action) => request('/focus-sessions/' + id, {
      method: 'PATCH', body: { action },
    }),
    cancelFocusSession: async (id) => request('/focus-sessions/' + id, { method: 'DELETE' }),
    getProgress: async (range = 'month') => request('/progress?range=' + encodeURIComponent(range) + '&timezone=' + encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)),
    connectSocket: (handlers = {}) => {
      const token = getToken();
      if (!token) return null;
      const socket = io(SOCKET_BASE, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.on(event, handler);
      });
      window.PlanifySocket = socket;
      return socket;
    },
  };
})();

Object.assign(window, { PlanifyAPI });

export default PlanifyAPI;
