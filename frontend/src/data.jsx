/* Data + small shared bits */

const INITIAL_TASKS = [
  { id: 't1', title: 'Calculus Problem Set 5', desc: 'Complete problems 1-20 from Chapter 7', subject: 'Mathematics', due: 'Tomorrow', dueDate: 'Jun 7', priority: 'urgent', done: false },
  { id: 't2', title: 'Programming Assignment 3', desc: 'Implement binary search tree', subject: 'Computer Science', due: '4 days', dueDate: 'Jun 10', priority: 'urgent', done: false },
  { id: 't3', title: 'Read Chapters 7–9', desc: 'Read and take notes on thermodynamics', subject: 'Physics', due: '5 days', dueDate: 'Jun 11', priority: 'medium', done: false },
  { id: 't4', title: 'Essay Draft', desc: 'First draft of comparative essay', subject: 'English Literature', due: '7 days', dueDate: 'Jun 13', priority: 'medium', done: true },
  { id: 't5', title: 'Lab Report 2', desc: 'Write up findings from titration experiment', subject: 'Chemistry', due: '9 days', dueDate: 'Jun 15', priority: 'low', done: false },
  { id: 't6', title: 'Discussion post', desc: 'Reply to two classmates in ethics forum', subject: 'Philosophy', due: '2 days', dueDate: 'Jun 8', priority: 'low', done: false },
];

const TEAM_MEMBERS = [
  { id: 'jw', initials: 'JW', name: 'Josh Williams', role: 'Leader' },
  { id: 'sc', initials: 'SC', name: 'Sarah Chen', role: 'Member' },
  { id: 'mr', initials: 'MR', name: 'Mike Rodriguez', role: 'Member' },
];

const GROUPS = [
  {
    id: 'g1',
    title: 'Database Systems Project',
    subject: 'Computer Science', mark: 'CS',
    members: ['JW', 'SC', 'MR'],
    progress: 0.33, tasksDone: 1, tasksTotal: 3,
  },
  {
    id: 'g2',
    title: 'Physics Lab Report',
    subject: 'Physics', mark: 'PH',
    members: ['JW', 'ED'],
    progress: 0.5, tasksDone: 1, tasksTotal: 2,
  },
  {
    id: 'g3',
    title: 'Macroeconomics Case Study',
    subject: 'Economics', mark: 'EC',
    members: ['JW', 'SC', 'AL', 'KP'],
    progress: 0.15, tasksDone: 1, tasksTotal: 7,
  },
];

const GROUP_TASKS = {
  g1: [
    { id: 'gt1', title: 'Design database schema', due: 'Due 2 days', dueDate: 'Jun 8', priority: 'medium', done: true, assignees: ['JW', 'SC'] },
    { id: 'gt2', title: 'Implement API endpoints', due: 'Due 4 days', dueDate: 'Jun 10', priority: 'urgent', done: false, assignees: ['JW'] },
    { id: 'gt3', title: 'Create frontend interface', due: 'Due 6 days', dueDate: 'Jun 12', priority: 'medium', done: false, assignees: ['SC', 'MR'] },
  ],
};

const NOTIFICATIONS = [
  { id: 'n1', kind: 'urgent', title: 'Calculus Problem Set 5 due tomorrow', sub: 'Mathematics · 12 problems remaining', time: '2H AGO', unread: true },
  { id: 'n2', kind: 'group', title: 'Sarah Chen completed Design database schema', sub: 'Database Systems Project', time: '5H AGO', unread: true },
  { id: 'n3', kind: 'ai', title: 'AI suggests rescheduling Lab Report 2', sub: 'Conflict detected with Friday study block', time: 'YESTERDAY', unread: true },
  { id: 'n4', kind: 'group', title: 'Mike Rodriguez added you to Macroeconomics Case Study', sub: 'You are now a member', time: '2D AGO', unread: false },
  { id: 'n5', kind: 'system', title: 'Weekly review ready', sub: 'You completed 8 of 12 tasks this week', time: '3D AGO', unread: false },
];

const SUBJECTS = ['Mathematics', 'Computer Science', 'Physics', 'Chemistry', 'English Literature', 'Philosophy', 'Economics', 'Biology'];

/* Suggested subject bundles per major — used in onboarding and as quick presets */
const MAJOR_PRESETS = {
  'Computer Science': ['Computer Science', 'Mathematics', 'Statistics', 'Data Structures & Algorithms', 'Operating Systems', 'Databases', 'Web Development'],
  'Engineering': ['Mathematics', 'Physics', 'Engineering Mechanics', 'Thermodynamics', 'Materials Science', 'Circuits & Electronics', 'Computer Science'],
  'Business': ['Economics', 'Accounting', 'Finance', 'Marketing', 'Statistics', 'Business Law', 'Management'],
  'Medicine & Health': ['Biology', 'Chemistry', 'Anatomy', 'Physiology', 'Biochemistry', 'Psychology', 'Statistics'],
  'Natural Sciences': ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'Statistics', 'Environmental Science'],
  'Arts & Humanities': ['English Literature', 'History', 'Philosophy', 'Art & Design', 'Languages', 'Music'],
  'Social Sciences': ['Psychology', 'Sociology', 'Economics', 'Political Science', 'Statistics', 'Philosophy'],
};

/* ---- Persistent state (survives reload via localStorage) ---- */
function usePersistentState(key, initial) {
  const [value, setValue] = React.useState(() => {
    try {
      const raw = localStorage.getItem('planify:' + key);
      return raw ? JSON.parse(raw) : initial;
    } catch (e) { return initial; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('planify:' + key, JSON.stringify(value)); } catch (e) {}
  }, [key, value]);
  return [value, setValue];
}

/* ---- Toasts ---- */
function notify(message) {
  window.dispatchEvent(new CustomEvent('planify:toast', { detail: { message } }));
}

function Toasts() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const fn = e => {
      const id = Date.now() + Math.random();
      setItems(t => [...t, { id, message: e.detail.message }]);
      setTimeout(() => setItems(t => t.filter(x => x.id !== id)), 2600);
    };
    window.addEventListener('planify:toast', fn);
    return () => window.removeEventListener('planify:toast', fn);
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="toasts">
      {items.map(t => <div key={t.id} className="toast"><IconCheck size={12} /> {t.message}</div>)}
    </div>
  );
}

/* ---- Avatar ---- */
function Avatar({ initials, size = 28 }) {
  const palette = {
    JW: '#0a0a0a', SC: '#0a0a0a', MR: '#0a0a0a', ED: '#0a0a0a', AL: '#0a0a0a', KP: '#0a0a0a',
  };
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: palette[initials] || '#0a0a0a' }}>
      {initials}
    </span>
  );
}

function AvStack({ list, size = 24 }) {
  return (
    <span className="av-stack">
      {list.map(i => <Avatar key={i} initials={i} size={size} />)}
    </span>
  );
}

Object.assign(window, {
  INITIAL_TASKS, TEAM_MEMBERS, GROUPS, GROUP_TASKS, NOTIFICATIONS, SUBJECTS, MAJOR_PRESETS,
  Avatar, AvStack, usePersistentState, notify, Toasts
});
