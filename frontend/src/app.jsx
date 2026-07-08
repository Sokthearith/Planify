/* Main app + tweaks */

import React from 'react';
import PlanifyAPI from './api.jsx';
import { SUBJECTS, Toasts, notify, usePersistentState } from './data.jsx';
import {
  TweakColor,
  TweakRadio,
  TweakSection,
  TweakSelect,
  TweaksPanel,
  useTweaks,
} from './components/tweaks-panel.jsx';
import { Sidebar } from './components/sidebar.jsx';
import { AddTaskModal, CreateGroupModal } from './components/modals.jsx';
import { HomePage, TasksPage } from './pages/pages-home-tasks.jsx';
import { GroupsPage, GroupDetailPage } from './pages/pages-groups.jsx';
import {
  NotificationsPage,
  ProfilePage,
  ProgressPage,
  SchedulePage,
  SettingsPage,
} from './pages/pages-other.jsx';
import { LandingPage, SignInPage, ForgotPasswordPage, CreateAccountPage } from './pages/pages-auth.jsx';
import { OnboardingFlow } from './pages/pages-onboarding.jsx';
import { AISchedulePage } from './pages/pages-ai-schedule.jsx';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#ff2d2d",
  "density": "regular",
  "typeStyle": "Mono",
  "showInsightCard": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const storedAuth = PlanifyAPI.getStoredAuth();
  const [currentUser, setCurrentUser] = React.useState(storedAuth?.user || null);
  const [isAuthed, setIsAuthed] = React.useState(!!storedAuth?.token);
  const [authView, setAuthView] = React.useState(storedAuth?.token ? 'app' : 'landing'); // 'landing' | 'signin' | 'forgot' | 'register' | 'onboarding' | 'app'
  const [page, setPage] = React.useState('home');
  const [openGroupId, setOpenGroupId] = React.useState(null);
  const [tasks, setTasks] = React.useState([]);
  const [groupTasks, setGroupTasks] = React.useState({});
  const [notifications, setNotifications] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [groupMessages, setGroupMessages] = React.useState({});
  const [activeSchedule, setActiveSchedule] = React.useState(null);
  const [subjects, setSubjects] = usePersistentState('subjects', SUBJECTS);
  const [showAddTask, setShowAddTask] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState(null);
  const [initialTaskDraft, setInitialTaskDraft] = React.useState(null);
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);

  React.useEffect(() => {
    if (showAddTask || showCreateGroup) window.PlanifySound?.play('open');
  }, [showAddTask, showCreateGroup]);

  const goto = (p) => {
    setOpenGroupId(null);
    setAuthView('app');
    setPage(p);
  };
  const refreshAppData = async (user = currentUser) => {
    const [loadedTasks, loadedGroups, loadedNotifications, loadedSchedule] = await Promise.all([
      PlanifyAPI.listTasks(),
      PlanifyAPI.loadGroupsWithTasks(user),
      PlanifyAPI.listNotifications(),
      PlanifyAPI.getActiveSchedule(),
    ]);
    setTasks(loadedTasks);
    setGroups(loadedGroups.groups);
    setGroupTasks(loadedGroups.groupTasks);
    setNotifications(loadedNotifications);
    setActiveSchedule(loadedSchedule);
  };

  React.useEffect(() => {
    if (!isAuthed) return;
    let alive = true;
    (async () => {
      try {
        const user = await PlanifyAPI.me();
        if (!alive) return;
        setCurrentUser(user);
        await refreshAppData(user);
      } catch (e) {
        if (!alive) return;
        PlanifyAPI.clearAuth();
        setCurrentUser(null);
        setIsAuthed(false);
        setAuthView('signin');
        notify(e.message || 'Please sign in again');
      }
    })();
    return () => { alive = false; };
  }, [isAuthed]);

  React.useEffect(() => {
    if (!isAuthed) return undefined;

    const upsertById = (mapper) => (arr, item) => {
      const mapped = mapper(item);
      const withoutExisting = arr.filter(existing => existing.id !== mapped.id);
      return [mapped, ...withoutExisting];
    };

    const socket = PlanifyAPI.connectSocket({
      'notification:created': (payload) => {
        setNotifications(arr => upsertById(PlanifyAPI.toUiNotification)(arr, payload));
      },
      'notification:updated': (payload) => {
        const mapped = PlanifyAPI.toUiNotification(payload);
        setNotifications(arr => arr.map(n => n.id === mapped.id ? mapped : n));
      },
      'notification:deleted': ({ id }) => {
        setNotifications(arr => arr.filter(n => n.id !== id));
      },
      'task:created': (payload) => {
        setTasks(arr => upsertById(PlanifyAPI.toUiTask)(arr, payload));
      },
      'task:updated': (payload) => {
        const mapped = PlanifyAPI.toUiTask(payload);
        setTasks(arr => arr.map(t => t.id === mapped.id ? mapped : t));
      },
      'task:deleted': ({ id }) => {
        setTasks(arr => arr.filter(t => t.id !== id));
      },
      'group-task:created': (payload) => {
        const mapped = PlanifyAPI.toUiTask(payload);
        setGroupTasks(gt => ({
          ...gt,
          [payload.groupId]: (gt[payload.groupId] || []).some(t => t.id === mapped.id)
            ? (gt[payload.groupId] || []).map(t => t.id === mapped.id ? mapped : t)
            : [mapped, ...(gt[payload.groupId] || [])],
        }));
      },
      'group-task:updated': (payload) => {
        const mapped = PlanifyAPI.toUiTask(payload);
        setGroupTasks(gt => ({
          ...gt,
          [payload.groupId]: (gt[payload.groupId] || []).map(t => t.id === mapped.id ? mapped : t),
        }));
      },
      'group-task:deleted': ({ groupId, id }) => {
        setGroupTasks(gt => ({ ...gt, [groupId]: (gt[groupId] || []).filter(t => t.id !== id) }));
      },
      'group:member-added': () => refreshAppData(),
      'group:member-updated': () => refreshAppData(),
      'group:member-removed': () => refreshAppData(),
      'group:created': () => refreshAppData(),
      'group:updated': () => refreshAppData(),
      'group:deleted': () => refreshAppData(),
      'schedule:created': (payload) => setActiveSchedule(PlanifyAPI.toUiSchedule(payload)),
      'schedule:updated': (payload) => setActiveSchedule(PlanifyAPI.toUiSchedule(payload)),
      'schedule:deleted': ({ id }) => setActiveSchedule(s => s?.id === id ? null : s),
      'group-chat:message': (payload) => {
        const mapped = PlanifyAPI.toUiMessage(payload);
        setGroupMessages(prev => {
          const list = prev[mapped.groupId] || [];
          if (list.some(m => m.id === mapped.id)) return prev;
          return { ...prev, [mapped.groupId]: [...list, mapped] };
        });
      },
      'error:message': (payload) => notify(payload.message || 'Realtime connection error'),
    });

    return () => socket?.disconnect();
  }, [isAuthed]);

  const signOut = async () => {
    await PlanifyAPI.logout();
    setIsAuthed(false);
    setCurrentUser(null);
    setTasks([]);
    setGroups([]);
    setGroupTasks({});
    setNotifications([]);
    setGroupMessages({});
    setActiveSchedule(null);
    setOpenGroupId(null);
    setPage('home');
    setAuthView('landing');
    notify('Signed out');
  };
  const openProfile = () => goto('profile');
  React.useEffect(() => {
    const fn = () => openProfile();
    window.addEventListener('planify:open-profile', fn);
    return () => window.removeEventListener('planify:open-profile', fn);
  }, []);
  const notifCount = notifications.filter(n => n.unread).length;
  const upsertItem = (arr, item) => [item, ...arr.filter(existing => existing.id !== item.id)];

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTasks(arr => arr.map(t => t.id === id ? { ...t, done: !t.done } : t));
    try {
      const saved = await PlanifyAPI.updateTask(id, { ...task, done: !task.done });
      setTasks(arr => arr.map(t => t.id === id ? saved : t));
    } catch (e) {
      setTasks(arr => arr.map(t => t.id === id ? task : t));
      notify(e.message || 'Could not update task');
    }
  };
  const toggleGroupTask = async (gid, id) => {
    const task = (groupTasks[gid] || []).find(t => t.id === id);
    if (!task) return;
    setGroupTasks(gt => ({
      ...gt,
      [gid]: (gt[gid] || []).map(t => t.id === id ? { ...t, done: !t.done } : t),
    }));
    try {
      const lookup = {};
      (currentGroup?.memberList || []).forEach(m => { lookup[m.id] = m.initials; });
      const saved = await PlanifyAPI.updateGroupTask(gid, id, { ...task, done: !task.done }, lookup);
      setGroupTasks(gt => ({
        ...gt,
        [gid]: (gt[gid] || []).map(t => t.id === id ? saved : t),
      }));
    } catch (e) {
      setGroupTasks(gt => ({
        ...gt,
        [gid]: (gt[gid] || []).map(t => t.id === id ? task : t),
      }));
      notify(e.message || 'Could not update task');
    }
  };
  const deleteTask = async (id) => {
    const previous = tasks;
    setTasks(arr => arr.filter(t => t.id !== id));
    try {
      await PlanifyAPI.deleteTask(id);
      notify('Task deleted');
    } catch (e) {
      setTasks(previous);
      notify(e.message || 'Could not delete task');
    }
  };
  const deleteGroupTask = async (gid, id) => {
    const previous = groupTasks[gid] || [];
    setGroupTasks(gt => ({ ...gt, [gid]: previous.filter(t => t.id !== id) }));
    try {
      await PlanifyAPI.deleteGroupTask(gid, id);
      notify('Task deleted');
    } catch (e) {
      setGroupTasks(gt => ({ ...gt, [gid]: previous }));
      notify(e.message || 'Could not delete task');
    }
  };
  const loadGroupMessages = async (gid) => {
    try {
      const messages = await PlanifyAPI.listGroupMessages(gid);
      setGroupMessages(prev => ({ ...prev, [gid]: messages }));
    } catch (e) {
      notify(e.message || 'Could not load chat');
    }
  };
  const sendGroupMessage = async (gid, text) => {
    const socket = window.PlanifySocket;
    if (!socket?.connected) {
      notify('Realtime connection is still starting');
      return;
    }
    socket.emit('group:message:send', { groupId: gid, message: text }, (ack) => {
      if (!ack?.ok) notify(ack?.message || 'Could not send message');
    });
  };
  const saveTaskDeadlineTime = async (task, time) => {
    if (!time || !activeSchedule) return;
    try {
      const latest = await PlanifyAPI.getActiveSchedule();
      const entries = latest.planData.entries.map(entry => (
        entry.sourceType === 'task-deadline' && entry.sourceId === task.id
          ? { ...entry, time, manualTime: true }
          : entry
      ));
      const saved = await PlanifyAPI.updateSchedule(latest.id, { ...latest.planData, entries });
      setActiveSchedule(saved);
    } catch (e) {
      notify(e.message || 'Task added, but schedule time could not be customized');
    }
  };
  const addTask = async (data) => {
    try {
      const task = await PlanifyAPI.createTask({
        title: data.title,
        description: data.description,
        subject: data.subject || 'General',
        due: data.due,
        priority: data.priority,
      });
      setTasks(arr => upsertItem(arr, task));
      await saveTaskDeadlineTime(task, data.scheduleTime);
      notify('Task added');
    } catch (e) {
      notify(e.message || 'Could not add task');
    }
  };
  const addGroupTask = async (gid, data) => {
    try {
      const lookup = {};
      (currentGroup?.memberList || []).forEach(m => { lookup[m.id] = m.initials; });
      const task = await PlanifyAPI.createGroupTask(gid, {
        title: data.title,
        description: data.description,
        subject: currentGroup?.subject || 'General',
        due: data.due,
        priority: data.priority,
        assignees: data.assignees,
      }, lookup);
      setGroupTasks(gt => ({ ...gt, [gid]: upsertItem(gt[gid] || [], task) }));
      notify('Task added to group');
    } catch (e) {
      notify(e.message || 'Could not add group task');
    }
  };
  const createGroup = async (data) => {
    try {
      const group = await PlanifyAPI.createGroup(data, currentUser);
      for (const email of data.invites || []) {
        try { await PlanifyAPI.addGroupMember(group.id, email); } catch (e) {}
      }
      const loaded = await PlanifyAPI.loadGroupsWithTasks(currentUser);
      setGroups(loaded.groups);
      setGroupTasks(loaded.groupTasks);
      notify('Group created');
    } catch (e) {
      notify(e.message || 'Could not create group');
    }
  };
  const deleteGroup = async (groupId) => {
    const previousGroups = groups;
    const previousTasks = groupTasks;
    setOpenGroupId(null);
    setGroups(arr => arr.filter(g => g.id !== groupId));
    setGroupTasks(gt => {
      const next = { ...gt };
      delete next[groupId];
      return next;
    });
    try {
      await PlanifyAPI.deleteGroup(groupId);
      notify('Group deleted');
    } catch (e) {
      setGroups(previousGroups);
      setGroupTasks(previousTasks);
      notify(e.message || 'Could not delete group');
    }
  };
  const addGroupMember = async (groupId, email) => {
    await PlanifyAPI.addGroupMember(groupId, email);
    notify('Invite sent to ' + email);
  };
  const removeGroupMember = async (groupId, memberId) => {
    try {
      await PlanifyAPI.removeGroupMember(groupId, memberId);
      await refreshAppData();
      notify('Member removed');
    } catch (e) {
      notify(e.message || 'Could not remove member');
    }
  };
  const editGroupTask = async (gid, id, data) => {
    try {
      const lookup = {};
      (currentGroup?.memberList || []).forEach(m => { lookup[m.id] = m.initials; });
      const saved = await PlanifyAPI.updateGroupTask(gid, id, data, lookup);
      setGroupTasks(gt => ({
        ...gt,
        [gid]: (gt[gid] || []).map(t => t.id === id ? saved : t),
      }));
      notify('Task updated');
    } catch (e) {
      notify(e.message || 'Could not update task');
    }
  };
  const acceptInvite = async (notificationId) => {
    try {
      const res = await PlanifyAPI.acceptInvite(notificationId);
      const loaded = await PlanifyAPI.loadGroupsWithTasks(currentUser);
      setGroups(loaded.groups);
      setGroupTasks(loaded.groupTasks);
      setNotifications(await PlanifyAPI.listNotifications());
      goto('groups');
      notify('Invite accepted');
      console.log('Groups after accept:', loaded.groups);
    } catch (e) {
      notify(e.message || 'Could not accept invite');
      console.error('Accept invite error:', e);
    }
  };
  const declineInvite = async (notificationId) => {
    try {
      await PlanifyAPI.declineInvite(notificationId);
      setNotifications(arr => arr.filter(n => n.id !== notificationId));
      notify('Invite declined');
    } catch (e) {
      notify(e.message || 'Could not decline invite');
    }
  };
  const markAllRead = async () => {
    const previous = notifications;
    setNotifications(arr => arr.map(n => ({ ...n, unread: false })));
    try {
      await PlanifyAPI.markNotificationsRead();
      notify('All notifications marked read');
    } catch (e) {
      setNotifications(previous);
      notify(e.message || 'Could not update notifications');
    }
  };
  const toggleNotif = async (id) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;
    setNotifications(arr => arr.map(n => n.id === id ? { ...n, unread: false } : n));
    if (!notification.unread) return;
    try {
      const saved = await PlanifyAPI.markNotificationRead(id);
      setNotifications(arr => arr.map(n => n.id === id ? saved : n));
    } catch (e) {
      setNotifications(arr => arr.map(n => n.id === id ? notification : n));
      notify(e.message || 'Could not update notification');
    }
  };
  const dismissNotif = async (id) => {
    const previous = notifications;
    setNotifications(arr => arr.filter(n => n.id !== id));
    try {
      await PlanifyAPI.deleteNotification(id);
    } catch (e) {
      setNotifications(previous);
      notify(e.message || 'Could not dismiss notification');
    }
  };

  const addSubject = (name) => {
    const v = (name || '').trim();
    if (!v) return;
    setSubjects(arr => arr.some(s => s.toLowerCase() === v.toLowerCase()) ? arr : [...arr, v]);
    notify('Subject added: ' + v);
  };
  const removeSubject = (name) => {
    setSubjects(arr => arr.filter(s => s !== name));
    notify('Subject removed');
  };

  // Onboarding hands back name/major/subjects — fold them into the app state
  const finishOnboarding = (data) => {
    if (data) {
      if (data.subjects && data.subjects.length) setSubjects(data.subjects);
      try {
        const raw = localStorage.getItem('planify:profile');
        const prof = raw ? JSON.parse(raw) : {
          name: currentUser?.username || currentUser?.name || '', email: currentUser?.email || '', year: 'First Year',
          major: 'Engineering', bio: '',
        };
        localStorage.setItem('planify:profile', JSON.stringify({
          ...prof,
          name: currentUser?.username || currentUser?.name || data.name || prof.name,
          email: currentUser?.email || prof.email,
          year: data.year || prof.year,
          major: data.major || prof.major,
        }));
      } catch (e) {}
      notify('Welcome to Planify' + (data.name ? ', ' + data.name : '') + '!');
    }
    setIsAuthed(true);
    setAuthView('app');
  };

  // Group cards reflect live task state once a group has a task list
  const groupsView = groups.map(g => {
    const ts = groupTasks[g.id];
    if (!ts) return g;
    const done = ts.filter(t => t.done).length;
    return { ...g, tasksDone: done, tasksTotal: ts.length, progress: ts.length ? done / ts.length : 0 };
  });

  // Accent → CSS var
  const appClass =
    'app density-' + t.density + ' ' +
    (t.accent === '#1f5fff' ? 'accent-blue' :
     t.accent === '#6c2bd9' ? 'accent-violet' :
     t.accent === '#007a40' ? 'accent-green' : '');

  // Type style → font family swap
  const typeStyles = {
    Editorial: "'Inter', sans-serif",
    Grotesque: "'Space Grotesk', 'Inter', sans-serif",
    Mono: "'JetBrains Mono', ui-monospace, monospace",
    Serif: "'Fraunces', 'Times New Roman', serif",
  };

  const currentGroup = openGroupId ? groupsView.find(g => g.id === openGroupId) : null;

  React.useEffect(() => {
    if (!openGroupId || !window.PlanifySocket) return undefined;
    window.PlanifySocket.emit('group:join', { groupId: openGroupId }, (ack) => {
      if (!ack?.ok) notify(ack?.message || 'Could not join group chat');
    });
    loadGroupMessages(openGroupId);
    return () => window.PlanifySocket?.emit('group:leave', { groupId: openGroupId });
  }, [openGroupId]);

  let content = null;
  if (currentGroup) {
    content = (
      <GroupDetailPage
        user={currentUser}
        group={currentGroup}
        tasks={groupTasks[currentGroup.id] || []}
        messages={groupMessages[currentGroup.id] || []}
        onBack={() => setOpenGroupId(null)}
        onToggle={(id) => toggleGroupTask(currentGroup.id, id)}
        onDelete={(id) => deleteGroupTask(currentGroup.id, id)}
        onDeleteGroup={() => deleteGroup(currentGroup.id)}
        onAddTask={() => setShowAddTask(true)}
        onEditTask={(task) => setEditingTask(task)}
        onAddMember={(email) => addGroupMember(currentGroup.id, email)}
        onRemoveMember={(memberId) => removeGroupMember(currentGroup.id, memberId)}
        onSendMessage={(text) => sendGroupMessage(currentGroup.id, text)}
      />
    );
  } else if (page === 'home') {
    content = <HomePage user={currentUser} tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onAdd={() => setShowAddTask(true)} goto={goto} />;
  } else if (page === 'tasks') {
    content = <TasksPage tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onAdd={() => setShowAddTask(true)} />;
  } else if (page === 'groups') {
    content = <GroupsPage groups={groupsView} onOpen={setOpenGroupId} onCreate={() => setShowCreateGroup(true)} />;
  } else if (page === 'schedule') {
    content = (
      <SchedulePage
        schedule={activeSchedule}
        onSaveSchedule={(planData) => activeSchedule && PlanifyAPI.updateSchedule(activeSchedule.id, planData).then(setActiveSchedule)}
        onCreateTaskAt={(slot) => {
          setInitialTaskDraft({ due: slot.date, scheduleTime: slot.time, title: '', priority: 'medium' });
          setShowAddTask(true);
        }}
      />
    );
  } else if (page === 'ai-schedule') {
    content = <AISchedulePage onAdd={() => setShowAddTask(true)} />;
  } else if (page === 'progress') {
    content = <ProgressPage tasks={tasks} />;
  } else if (page === 'notifications') {
    content = <NotificationsPage items={notifications} onMarkAll={markAllRead} onToggle={toggleNotif} onDismiss={dismissNotif} onAcceptInvite={acceptInvite} onDeclineInvite={declineInvite} />;
  } else if (page === 'profile') {
    content = <ProfilePage user={currentUser} tasks={tasks} groups={groupsView} />;
  } else if (page === 'settings') {
    content = <SettingsPage subjects={subjects} onAddSubject={addSubject} onRemoveSubject={removeSubject} onSignOut={signOut} />;
  }

  // Auth flow: show landing / signin / register before the app
  if (authView !== 'app') {
    let authContent = null;
    if (authView === 'landing') {
      authContent = (
        <LandingPage
          onSignIn={() => setAuthView('signin')}
          onGetStarted={() => setAuthView('register')}
          auth={isAuthed && currentUser ? {
            name: currentUser.username || currentUser.name,
            initials: PlanifyAPI.initials(currentUser.username || currentUser.name),
          } : null}
          onOpenApp={() => setAuthView('app')}
          onSignOut={signOut}
        />
      );
    } else if (authView === 'signin') {
      authContent = (
        <SignInPage
          onBack={() => setAuthView('landing')}
          onSubmit={async ({ email, password }) => {
            const user = await PlanifyAPI.login(email, password);
            setCurrentUser(user);
            setIsAuthed(true);
            setAuthView('app');
          }}
          onSwitchToRegister={() => setAuthView('register')}
          onForgotPassword={() => setAuthView('forgot')}
        />
      );
    } else if (authView === 'forgot') {
      authContent = (
        <ForgotPasswordPage
          onBack={() => setAuthView('signin')}
          onDone={() => setAuthView('signin')}
        />
      );
    } else if (authView === 'register') {
      authContent = (
        <CreateAccountPage
          onBack={() => setAuthView('landing')}
          onSubmit={async ({ name, email, password }) => {
            const user = await PlanifyAPI.register(name, email, password);
            setCurrentUser(user);
            setIsAuthed(true);
            setAuthView('onboarding');
          }}
          onSwitchToSignIn={() => setAuthView('signin')}
        />
      );
    } else if (authView === 'onboarding') {
      authContent = (
        <OnboardingFlow
          user={currentUser}
          onDone={finishOnboarding}
          onSkip={() => { setIsAuthed(true); setAuthView('app'); }}
        />
      );
    }
    return (
      <div className={appClass} style={{ fontFamily: typeStyles[t.typeStyle] || typeStyles.Mono, display: 'block' }}>
        {authContent}
        <Toasts />
        <TweaksPanel title="Tweaks">
          <TweakSection label="Flow" />
          <TweakRadio
            label="Screen"
            value={authView}
            options={['landing', 'signin', 'register', 'onboarding', 'app']}
            onChange={(v) => setAuthView(v)}
          />
          <TweakSection label="Theme" />
          <TweakColor
            label="Accent"
            value={t.accent}
            options={['#ff2d2d', '#1f5fff', '#6c2bd9', '#007a40']}
            onChange={(v) => setTweak('accent', v)}
          />
          <TweakSelect
            label="Type style"
            value={t.typeStyle}
            options={['Editorial', 'Grotesque', 'Mono', 'Serif']}
            onChange={(v) => setTweak('typeStyle', v)}
          />
        </TweaksPanel>
      </div>
    );
  }

  return (
    <div className={appClass} style={{ fontFamily: typeStyles[t.typeStyle] || typeStyles.Mono }}>
      <Sidebar
        user={currentUser}
        current={currentGroup ? 'groups' : page}
        onNav={goto}
        onProfile={openProfile}
        notifCount={notifCount}
        onGoLanding={() => setAuthView('landing')}
      />
      <main>{content}</main>

      {showAddTask || editingTask ? (
        <AddTaskModal
          key={editingTask ? 'edit-' + editingTask.id : 'add'}
          context={currentGroup ? { group: currentGroup.title, subject: currentGroup.subject, members: currentGroup.memberList, createdBy: currentGroup.createdBy } : null}
          subjects={subjects}
          editTask={editingTask}
          initialTask={initialTaskDraft}
          isAdmin={currentGroup ? currentGroup.createdBy === currentUser?.id : true}
          onAddSubject={addSubject}
          onClose={() => { setShowAddTask(false); setEditingTask(null); setInitialTaskDraft(null); }}
          onAdd={(data) => currentGroup ? addGroupTask(currentGroup.id, data) : addTask(data)}
          onEdit={(data) => {
            const gid = currentGroup.id;
            editGroupTask(gid, editingTask.id, data);
            setEditingTask(null);
          }}
        />
      ) : null}

      {showCreateGroup ? (
        <CreateGroupModal subjects={subjects} onAddSubject={addSubject} onClose={() => setShowCreateGroup(false)} onCreate={createGroup} />
      ) : null}

      <Toasts />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Flow" />
        <TweakRadio
          label="Screen"
          value="app"
          options={['landing', 'signin', 'register', 'onboarding', 'app']}
          onChange={(v) => setAuthView(v)}
        />
        <TweakSection label="Theme" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={['#ff2d2d', '#1f5fff', '#6c2bd9', '#007a40']}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)}
        />
        <TweakSection label="Type" />
        <TweakSelect
          label="Type style"
          value={t.typeStyle}
          options={['Editorial', 'Grotesque', 'Mono', 'Serif']}
          onChange={(v) => setTweak('typeStyle', v)}
        />
      </TweaksPanel>
    </div>
  );
}

export default App;
