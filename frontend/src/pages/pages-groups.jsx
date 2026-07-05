/* Groups list + Group detail */

import React from 'react';
import { AvStack, Avatar, notify } from '../data.jsx';
import { IconAddUser, IconBack, IconCheck, IconClose, IconPlus } from '../components/icons.jsx';
import { PriorityTag, priorityClass } from './pages-home-tasks.jsx';

function GroupsPage({ groups, onOpen, onCreate }) {
  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">Collaborate</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>Groups <span style={{ color: 'var(--muted-2)', fontWeight: 500 }}>/ {groups.length}</span></h1>
          <div className="t-mut" style={{ marginTop: 8 }}>Shared projects and study groups</div>
        </div>
        <button className="btn" onClick={onCreate}><IconPlus size={14} /> Create group</button>
      </div>

      <div className="grid-3">
        {groups.map(g => (
          <div key={g.id} className="group-card" onClick={() => onOpen(g.id)}>
            <div className="head">
              <div>
                <div className="subject">{g.subject}</div>
                <div className="title">{g.title}</div>
              </div>
              <div className="subject-mark">{g.mark}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AvStack list={g.members} />
              <span className="t-eyebrow">{g.members.length} members</span>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="progressbar"><div style={{ width: (g.progress * 100) + '%' }} /></div>
              <div className="progress-meta">
                <span>Progress</span>
                <span>{g.tasksDone}/{g.tasksTotal} tasks</span>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={onCreate}
          style={{
            border: '1px dashed var(--line)',
            background: 'transparent', padding: 24,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
            cursor: 'pointer', textAlign: 'left', minHeight: 200,
          }}>
          <div className="subject-mark" style={{ borderStyle: 'dashed' }}><IconPlus size={14} /></div>
          <div>
            <div className="t-eyebrow">New</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6, letterSpacing: '-0.01em' }}>Create a group</div>
            <div className="t-mut" style={{ marginTop: 6 }}>Start a shared project</div>
          </div>
        </button>
      </div>
    </div>
  );
}

function GroupDetailPage({ user, group, tasks, onBack, onToggle, onDelete, onAddTask, onAddMember, onEditTask, onRemoveMember }) {
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [showInvite, setShowInvite] = React.useState(false);
  const [inviting, setInviting] = React.useState(false);
  const teamMembers = group.memberList || [];
  const isAdmin = user?.id && group.createdBy === user.id;

  const memberProgress = React.useMemo(() => {
    return teamMembers.map(m => {
      const assigned = tasks.filter(t => {
        const list = t.assigneeIds || t.assignees || [];
        return list.includes(m.id);
      });
      const done = assigned.filter(t => t.done).length;
      return {
        n: m.name,
        i: m.initials,
        val: assigned.length > 0 ? done / assigned.length : 0,
      };
    });
  }, [tasks, teamMembers]);
  const doInvite = async () => {
    if (!inviteEmail.trim() || inviting) return;
    setInviting(true);
    try {
      await onAddMember(inviteEmail.trim());
      setInviteEmail('');
      setShowInvite(false);
    } catch (e) {
      notify(e.message || 'Could not invite member');
    } finally {
      setInviting(false);
    }
  };
  return (
    <div className="page">
      <div className="page-eyebrow">
        <button className="crumb-btn" onClick={onBack}><IconBack size={12} /> Back to groups</button>
        <span className="sep">/</span>
        <span>{group.subject}</span>
      </div>
      <div className="page-head row" style={{ paddingBottom: 32, marginBottom: 32 }}>
        <div>
          <h1 className="t-h1" style={{ marginTop: 14 }}>{group.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn ghost" onClick={() => setShowInvite(o => !o)}><IconAddUser size={14} /> Invite</button>
          <button className="btn" onClick={onAddTask}><IconPlus size={14} /> Add task</button>
        </div>
      </div>

      {showInvite ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <input className="input" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && doInvite()} autoFocus style={{ flex: 1 }} />
          <button className="btn" onClick={doInvite} disabled={inviting}>{inviting ? 'Sending…' : 'Send'}</button>
          <button className="btn ghost" onClick={() => { setShowInvite(false); setInviteEmail(''); }}>Cancel</button>
        </div>
      ) : null}
      <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat">
          <span className="label">Team members</span>
          <span className="t-stat">{group.members.length}</span>
        </div>
        <div className="stat">
          <span className="label">Tasks completed</span>
          <span className="t-stat">{group.tasksDone}<span style={{ fontSize: 28, color: 'var(--muted)' }}>/{group.tasksTotal}</span></span>
        </div>
        <div className="stat">
          <span className="label">Overall progress</span>
          <span className="t-stat">{Math.round(group.progress * 100)}<span style={{ fontSize: 28, color: 'var(--muted)' }}>%</span></span>
        </div>
      </div>

      <div style={{ height: 32 }} />

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <h2 className="t-h2">Shared tasks</h2>
            <button className="btn iconbtn" onClick={onAddTask}><IconPlus size={14} /></button>
          </div>
          <div>
            {tasks.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
                <div className="t-eyebrow">No tasks yet</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 10, color: 'var(--ink)' }}>Add the first shared task</div>
                <button className="btn sm" style={{ marginTop: 16 }} onClick={onAddTask}><IconPlus size={12} /> Add task</button>
              </div>
            ) : tasks.map(t => (
              <div key={t.id} className={'task priority-' + priorityClass(t.priority) + (t.priority === 'urgent' ? ' urgent' : '') + (t.done ? ' done' : '')}>
                <button
                  className={'checkbox ' + priorityClass(t.priority) + (t.priority === 'urgent' ? ' urgent' : '') + (t.done ? ' done' : '')}
                  onClick={e => { e.stopPropagation(); if (isAdmin || (t.assigneeIds || []).includes(user?.id)) onToggle(t.id); }}
                  aria-label="Toggle done"
                >
                  {t.done ? <IconCheck size={12} /> : null}
                </button>
                <div>
                  <div className="title">{t.title}</div>
                  {t.desc ? <div className="desc">{t.desc}</div> : null}
                  <div className="meta">
                    <span>{t.due}</span>
                    <span className="sep">·</span>
                    <span>{t.dueDate}</span>
                  </div>
                  {t.assignees && t.assignees.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                      <span className="t-eyebrow">Assigned</span>
                      <AvStack list={t.assignees} size={22} />
                    </div>
                  ) : null}
                </div>
                <div className="right">
                  <PriorityTag priority={t.priority} />
                  {isAdmin || (t.assigneeIds || []).includes(user?.id) ? (
                    <button className="task-edit" onClick={(e) => { e.stopPropagation(); onEditTask?.(t); }} aria-label="Edit task" title="Edit task">
                      Edit
                    </button>
                  ) : null}
                  {isAdmin ? (
                    <button className="task-del" data-sound="delete" onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} aria-label="Delete task" title="Delete task">
                      <IconClose size={12} />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="panel">
            <div className="panel-head" style={{ padding: '18px 20px' }}>
              <h3 className="t-h3">Team</h3>
              <button className="btn iconbtn" style={{ width: 32, height: 32 }}><IconAddUser size={12} /></button>
            </div>
            <div style={{ padding: '8px 20px 20px' }}>
              {teamMembers.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                  <Avatar initials={m.initials} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                    <div className="t-eyebrow">{m.role}</div>
                  </div>
                  {user?.id && group.createdBy === user.id && m.id !== user.id ? (
                    <button className="x" onClick={() => onRemoveMember?.(m.memberId)} aria-label="Remove member" title="Remove member">
                      <IconClose size={12} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head" style={{ padding: '18px 20px' }}>
              <h3 className="t-h3">Member progress</h3>
            </div>
            <div className="panel-pad" style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {memberProgress.map(m => (
                <div key={m.i} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar initials={m.i} size={24} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{m.n}</span>
                    </div>
                    <span className="t-eyebrow">{Math.round(m.val * 100)}%</span>
                  </div>
                  <div className="progressbar" style={{ height: 4, background: 'var(--bg-sunken)' }}>
                    <div style={{ width: (m.val * 100) + '%', height: '100%', background: 'var(--ink)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GroupsPage, GroupDetailPage });

export { GroupsPage, GroupDetailPage };
