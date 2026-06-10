/* Main app + tweaks */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#ff2d2d",
  "density": "regular",
  "typeStyle": "Mono",
  "showInsightCard": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [isAuthed, setIsAuthed] = React.useState(false);
  const [authView, setAuthView] = React.useState('landing'); // 'landing' | 'signin' | 'register' | 'onboarding' | 'app'
  const [page, setPage] = React.useState('home');
  const [openGroupId, setOpenGroupId] = React.useState(null);
  const [tasks, setTasks] = usePersistentState('tasks', INITIAL_TASKS);
  const [groupTasks, setGroupTasks] = usePersistentState('groupTasks', GROUP_TASKS);
  const [notifications, setNotifications] = usePersistentState('notifications', NOTIFICATIONS);
  const [groups, setGroups] = usePersistentState('groups', GROUPS);
  const [showAddTask, setShowAddTask] = React.useState(false);
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);

  const goto = (p) => { setOpenGroupId(null); setPage(p); };
  const notifCount = notifications.filter(n => n.unread).length;

  const toggleTask = (id) => setTasks(arr => arr.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const toggleGroupTask = (gid, id) => setGroupTasks(gt => ({
    ...gt,
    [gid]: gt[gid].map(t => t.id === id ? { ...t, done: !t.done } : t),
  }));
  const deleteTask = (id) => {
    setTasks(arr => arr.filter(t => t.id !== id));
    notify('Task deleted');
  };
  const deleteGroupTask = (gid, id) => {
    setGroupTasks(gt => ({ ...gt, [gid]: gt[gid].filter(t => t.id !== id) }));
    notify('Task deleted');
  };
  const addTask = (data) => {
    setTasks(arr => [{
      id: 'tn' + Date.now(),
      title: data.title, desc: '',
      subject: data.subject || 'General',
      due: data.due ? 'Scheduled' : 'No date',
      dueDate: data.due || '',
      priority: data.priority === 'high' ? 'urgent' : data.priority,
      done: false,
    }, ...arr]);
    notify('Task added');
  };
  const addGroupTask = (gid, data) => {
    setGroupTasks(gt => ({
      ...gt,
      [gid]: [{
        id: 'gtn' + Date.now(),
        title: data.title, due: data.due ? 'Scheduled' : 'No date', dueDate: data.due || '',
        priority: data.priority === 'high' ? 'urgent' : data.priority,
        done: false, assignees: data.assignees,
      }, ...(gt[gid] || [])],
    }));
    notify('Task added to group');
  };
  const createGroup = (data) => {
    const id = 'gn' + Date.now();
    setGroups(g => [...g, {
      id, title: data.name, subject: data.subject || 'General',
      mark: (data.subject || 'NA').slice(0, 2).toUpperCase(),
      members: ['JW'], progress: 0, tasksDone: 0, tasksTotal: 0,
    }]);
    setGroupTasks(gt => ({ ...gt, [id]: [] }));
    notify('Group created');
  };
  const markAllRead = () => {
    setNotifications(arr => arr.map(n => ({ ...n, unread: false })));
    notify('All notifications marked read');
  };
  const toggleNotif = (id) => setNotifications(arr => arr.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  const dismissNotif = (id) => setNotifications(arr => arr.filter(n => n.id !== id));

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

  let content = null;
  if (currentGroup) {
    content = (
      <GroupDetailPage
        group={currentGroup}
        tasks={groupTasks[currentGroup.id] || []}
        onBack={() => setOpenGroupId(null)}
        onToggle={(id) => toggleGroupTask(currentGroup.id, id)}
        onDelete={(id) => deleteGroupTask(currentGroup.id, id)}
        onAddTask={() => setShowAddTask(true)}
      />
    );
  } else if (page === 'home') {
    content = <HomePage tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onAdd={() => setShowAddTask(true)} goto={goto} />;
  } else if (page === 'tasks') {
    content = <TasksPage tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onAdd={() => setShowAddTask(true)} />;
  } else if (page === 'groups') {
    content = <GroupsPage groups={groupsView} onOpen={setOpenGroupId} onCreate={() => setShowCreateGroup(true)} />;
  } else if (page === 'schedule') {
    content = <SchedulePage onAdd={() => setShowAddTask(true)} />;
  } else if (page === 'ai-schedule') {
    content = <AISchedulePage onAdd={() => setShowAddTask(true)} />;
  } else if (page === 'progress') {
    content = <ProgressPage />;
  } else if (page === 'notifications') {
    content = <NotificationsPage items={notifications} onMarkAll={markAllRead} onToggle={toggleNotif} onDismiss={dismissNotif} />;
  } else if (page === 'profile') {
    content = <ProfilePage />;
  } else if (page === 'settings') {
    content = <SettingsPage />;
  }

  // Auth flow: show landing / signin / register before the app
  if (authView !== 'app') {
    let authContent = null;
    if (authView === 'landing') {
      authContent = (
        <LandingPage
          onSignIn={() => setAuthView('signin')}
          onGetStarted={() => setAuthView('register')}
          auth={isAuthed ? { name: 'Josh Williams', initials: 'JW' } : null}
          onOpenApp={() => setAuthView('app')}
          onSignOut={() => { setIsAuthed(false); }}
        />
      );
    } else if (authView === 'signin') {
      authContent = (
        <SignInPage
          onBack={() => setAuthView('landing')}
          onSubmit={() => { setIsAuthed(true); setAuthView('app'); }}
          onSwitchToRegister={() => setAuthView('register')}
        />
      );
    } else if (authView === 'register') {
      authContent = (
        <CreateAccountPage
          onBack={() => setAuthView('landing')}
          onSubmit={() => { setIsAuthed(true); setAuthView('onboarding'); }}
          onSwitchToSignIn={() => setAuthView('signin')}
        />
      );
    } else if (authView === 'onboarding') {
      authContent = (
        <OnboardingFlow
          onDone={() => { setIsAuthed(true); setAuthView('app'); }}
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
        current={currentGroup ? 'groups' : page}
        onNav={goto}
        notifCount={notifCount}
        onGoLanding={() => setAuthView('landing')}
      />
      <main>{content}</main>

      {showAddTask ? (
        <AddTaskModal
          context={currentGroup ? { group: currentGroup.title, subject: currentGroup.subject } : null}
          onClose={() => setShowAddTask(false)}
          onAdd={(data) => currentGroup ? addGroupTask(currentGroup.id, data) : addTask(data)}
        />
      ) : null}

      {showCreateGroup ? (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreate={createGroup} />
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
