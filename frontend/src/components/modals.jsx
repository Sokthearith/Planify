/* Modals: Add Task, Create Group */

function Modal({ title, onClose, children, footer, width = 540 }) {
  React.useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="t-h3">{title}</h3>
          <button className="x" onClick={onClose}><IconClose size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* Subject dropdown with an inline "add new" mode */
function SubjectSelect({ value, onChange, subjects, onAddSubject }) {
  const list = subjects || SUBJECTS;
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const confirm = () => {
    const v = draft.trim();
    if (!v) return;
    onAddSubject?.(v);
    onChange(v);
    setAdding(false);
    setDraft('');
  };
  if (adding) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8 }}>
        <input
          className="input" autoFocus placeholder="New subject name"
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirm(); } if (e.key === 'Escape') setAdding(false); }}
        />
        <button className="btn" onClick={confirm} disabled={!draft.trim()}>Add</button>
        <button className="btn ghost" onClick={() => { setAdding(false); setDraft(''); }}>Cancel</button>
      </div>
    );
  }
  return (
    <select
      className="select" value={value}
      onChange={e => e.target.value === '__new__' ? setAdding(true) : onChange(e.target.value)}
    >
      <option value="">Select subject</option>
      {list.map(s => <option key={s}>{s}</option>)}
      <option value="__new__">＋ Add new subject…</option>
    </select>
  );
}

function AddTaskModal({ context, subjects, onAddSubject, onClose, onAdd }) {
  const [title, setTitle] = React.useState('');
  const [due, setDue] = React.useState('');
  const [subject, setSubject] = React.useState(context?.subject || '');
  const [priority, setPriority] = React.useState('medium');
  const [assignees, setAssignees] = React.useState([]);
  const requiresAssign = !!context?.group;
  const valid = title.trim() && (!requiresAssign || assignees.length > 0);

  const toggle = id => setAssignees(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);

  const submit = () => {
    if (!valid) return;
    onAdd({ title, due, subject, priority, assignees });
    onClose();
  };

  return (
    <Modal
      title={context?.group ? `Add task to ${context.group}` : 'Create new task'}
      onClose={onClose}
      footer={(
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!valid}>Add Task</button>
        </>
      )}
    >
      <div className="field">
        <label>Task title</label>
        <input className="input" placeholder="e.g. Complete problem set" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      </div>
      {!context?.group ? (
        <div className="field">
          <label>Subject</label>
          <SubjectSelect value={subject} onChange={setSubject} subjects={subjects} onAddSubject={onAddSubject} />
        </div>
      ) : null}
      <div className="field">
        <label>Due date</label>
        <input className="input" type="date" value={due} onChange={e => setDue(e.target.value)} />
      </div>
      <div className="field">
        <label>Priority</label>
        <div className="priority">
          {['low', 'medium', 'high'].map(p => (
            <button key={p}
              className={priority === p ? 'on ' + (p === 'high' ? 'high' : '') : ''}
              onClick={() => setPriority(p)}
            >{p}</button>
          ))}
        </div>
      </div>
      {requiresAssign ? (
        <div className="field">
          <label>Assign to members</label>
          <div className="member-list">
            {TEAM_MEMBERS.map(m => (
              <div key={m.id} className={'member-row' + (assignees.includes(m.id) ? ' on' : '')} onClick={() => toggle(m.id)}>
                <span className={'check' + (assignees.includes(m.id) ? ' on' : '')}>
                  {assignees.includes(m.id) ? <IconCheck size={12} /> : null}
                </span>
                <Avatar initials={m.initials} />
                <div style={{ flex: 1 }}>
                  <div className="name">{m.name}</div>
                  <div className="role">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
          {requiresAssign && assignees.length === 0 ? (
            <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600, letterSpacing: 0.04 }}>
              Please assign at least one member
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

function CreateGroupModal({ subjects, onAddSubject, onClose, onCreate }) {
  const [name, setName] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [invite, setInvite] = React.useState('');
  const [invites, setInvites] = React.useState([]);
  const addInvite = () => {
    if (invite && /\S+@\S+/.test(invite)) {
      setInvites(i => [...i, invite]);
      setInvite('');
    }
  };
  const valid = name.trim() && subject;
  return (
    <Modal
      title="Create new group"
      onClose={onClose}
      footer={(
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => { onCreate({ name, subject, invites }); onClose(); }} disabled={!valid}>Create Group</button>
        </>
      )}
    >
      <div className="field">
        <label>Group name</label>
        <input className="input" placeholder="e.g. Database Systems Project" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label>Subject</label>
        <SubjectSelect value={subject} onChange={setSubject} subjects={subjects} onAddSubject={onAddSubject} />
      </div>
      <div className="field">
        <label>Invite members</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px', gap: 8 }}>
          <input className="input" placeholder="member@university.edu" value={invite}
                 onChange={e => setInvite(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInvite())} />
          <button className="btn iconbtn" style={{ width: 44, height: 44 }} onClick={addInvite}><IconPlus size={14} /></button>
        </div>
        {invites.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {invites.map((v, i) => (
              <span key={i} className="tag">{v}</span>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

Object.assign(window, { AddTaskModal, CreateGroupModal, Modal, SubjectSelect });
