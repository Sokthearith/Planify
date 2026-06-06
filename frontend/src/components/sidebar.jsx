/* Sidebar */

function Sidebar({ current, onNav, notifCount, onGoLanding }) {
  const items = [
    { id: 'home', label: 'Home', Icon: IconHome },
    { id: 'tasks', label: 'Tasks', Icon: IconTasks },
    { id: 'groups', label: 'Groups', Icon: IconGroups },
    { id: 'schedule', label: 'Schedule', Icon: IconCal },
    { id: 'ai-schedule', label: 'AI Schedule', Icon: IconSpark },
    { id: 'progress', label: 'Progress', Icon: IconProgress },
    { id: 'notifications', label: 'Notifications', Icon: IconBell, badge: notifCount },
    { id: 'profile', label: 'Profile', Icon: IconUser },
    { id: 'settings', label: 'Settings', Icon: IconGear },
  ];
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <button className="sb-brand-btn" onClick={onGoLanding} title="Back to home menu">
          <span className="word">Planify</span>
          <span className="dot" aria-hidden="true"></span>
          <span className="home-hint"><IconBack size={10} /> Menu</span>
        </button>
      </div>
      <nav className="sb-nav">
        {items.map(it => (
          <button
            key={it.id}
            className={'sb-item' + (current === it.id ? ' active' : '')}
            onClick={() => onNav(it.id)}
          >
            <span className="icon"><it.Icon size={16} /></span>
            <span>{it.label}</span>
            {it.badge ? <span className="badge">{it.badge}</span> : null}
          </button>
        ))}
      </nav>
      <div className="sb-user">
        <span className="avatar">JW</span>
        <div>
          <div className="name">Josh Williams</div>
          <div className="sub">First Year · Engineering</div>
        </div>
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar });
