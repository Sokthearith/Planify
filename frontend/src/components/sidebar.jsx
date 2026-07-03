/* Sidebar */

function Sidebar({ user, current, onNav, onProfile, notifCount, onGoLanding }) {
  const name = user?.username || user?.name || 'Student';
  const initials = PlanifyAPI.initials(name, 'U');
  const navTo = (id) => {
    onNav?.(id);
  };
  const openProfile = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    onProfile?.();
    window.dispatchEvent(new CustomEvent('planify:open-profile'));
  };
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
            onClick={it.id === 'profile' ? openProfile : () => navTo(it.id)}
          >
            <span className="icon"><it.Icon size={16} /></span>
            <span>{it.label}</span>
            {it.badge ? <span className="badge">{it.badge}</span> : null}
          </button>
        ))}
      </nav>
      <button
        type="button"
        className={'sb-user' + (current === 'profile' ? ' active' : '')}
        onClick={openProfile}
        onPointerUp={openProfile}
        data-sound="nav"
        aria-label="Open profile"
        title="Open profile"
      >
        <span className="avatar">{initials}</span>
        <div>
          <div className="name">{name}</div>
          <div className="sub">First Year · Engineering</div>
          <div className="profile-link">View profile</div>
        </div>
      </button>
    </aside>
  );
}

Object.assign(window, { Sidebar });
