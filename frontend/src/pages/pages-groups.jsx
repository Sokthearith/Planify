/* Groups list + Group detail */

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

function GroupDetailPage({ group, tasks, onBack, onToggle, onAddTask }) {
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
          <button className="btn ghost"><IconAddUser size={14} /> Invite</button>
          <button className="btn" onClick={onAddTask}><IconPlus size={14} /> Add task</button>
        </div>
      </div>

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
            {tasks.map(t => (
              <div key={t.id} className={'task' + (t.priority === 'urgent' ? ' urgent' : '') + (t.done ? ' done' : '')}>
                <button
                  className={'checkbox' + (t.priority === 'urgent' ? ' urgent' : '') + (t.done ? ' done' : '')}
                  onClick={() => onToggle(t.id)}
                >
                  {t.done ? <IconCheck size={12} /> : null}
                </button>
                <div>
                  <div className="title">{t.title}</div>
                  <div className="meta">
                    <span>{t.due}</span>
                    <span className="sep">·</span>
                    <span>{t.dueDate}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                    <span className="t-eyebrow">Assigned</span>
                    <AvStack list={t.assignees} size={22} />
                  </div>
                </div>
                <div className="right">
                  {t.priority === 'urgent' ? <span className="tag urgent">Urgent</span> : null}
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
              {TEAM_MEMBERS.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                  <Avatar initials={m.initials} size={32} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                    <div className="t-eyebrow">{m.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head" style={{ padding: '18px 20px' }}>
              <h3 className="t-h3">Member progress</h3>
            </div>
            <div className="panel-pad" style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[{ n: 'Josh Williams', i: 'JW', val: 0.5 }, { n: 'Sarah Chen', i: 'SC', val: 0.5 }, { n: 'Mike Rodriguez', i: 'MR', val: 0 }].map(m => (
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
