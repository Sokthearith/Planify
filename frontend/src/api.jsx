/* Backend API adapter */

const PlanifyAPI = (() => {
  const API_BASE = localStorage.getItem('planify:apiBase') || 'http://localhost:5001/api';
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

    const res = await fetch(API_BASE + path, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = { message: text }; }
    }

    if (!res.ok) {
      const message = data?.message || data?.errors?.join(', ') || 'Request failed';
      throw new Error(message);
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
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const days = Math.round((target - today) / 86400000);
    const due =
      days === 0 ? 'Today' :
      days === 1 ? 'Tomorrow' :
      days > 1 ? days + ' days' :
      Math.abs(days) + ' days overdue';

    return {
      due,
      dueDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };
  };

  const toUiPriority = (priority) => priority === 'high' ? 'urgent' : (priority || 'medium');
  const toApiPriority = (priority) => priority === 'urgent' ? 'high' : (priority || 'medium');

  const toUiTask = (task, memberLookup = {}) => {
    const due = formatDue(task.dueDate);
    return {
      id: task.id,
      title: task.title,
      desc: task.description || '',
      subject: task.subject || 'General',
      priority: toUiPriority(task.priority),
      done: task.done,
      assignees: (task.assignees || []).map(id => memberLookup[id] || String(id).toUpperCase().slice(0, 2)),
      assigneeIds: task.assignees || [],
      rawDeadline: task.dueDate || '',
      ...due,
    };
  };

  const taskPayload = (task) => ({
    title: task.title,
    description: task.desc || task.description || '',
    dueDate: task.rawDeadline || (task.due && /^\d{4}-\d{2}-\d{2}/.test(task.due) ? task.due : null),
    priority: toApiPriority(task.priority),
    done: task.done || false,
    assignees: task.assigneeIds || task.assignees || [],
  });

  const toUiGroup = (group, user) => {
    const rawMembers = group.GroupMembers || [];
    const memberList = rawMembers.map(member => ({
      id: member.userId,
      memberId: member.id,
      name: member.User?.name || member.User?.email || '',
      initials: initials(member.User?.name || member.User?.email, 'U'),
      role: member.role || 'member',
    }));
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
      body: { name: group.name, subject: group.subject },
    }), user),
    addGroupMember: async (groupId, email) => request('/groups/' + groupId + '/members', {
      method: 'POST',
      body: { email },
    }),
    removeGroupMember: async (groupId, memberId) => request('/groups/' + groupId + '/members/' + memberId, {
      method: 'DELETE',
    }),
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
    listNotifications: async () => (await request('/notifications')).map(toUiNotification),
    markNotificationRead: async (id) => toUiNotification(await request('/notifications/' + id + '/read', {
      method: 'PATCH',
    })),
    markNotificationsRead: async () => request('/notifications/read-all', { method: 'PATCH' }),
    deleteNotification: async (id) => request('/notifications/' + id, { method: 'DELETE' }),
    acceptInvite: async (notificationId) => request('/notifications/' + notificationId + '/accept', { method: 'PATCH' }),
    declineInvite: async (notificationId) => request('/notifications/' + notificationId + '/decline', { method: 'PATCH' }),
  };
})();

Object.assign(window, { PlanifyAPI });

export default PlanifyAPI;
