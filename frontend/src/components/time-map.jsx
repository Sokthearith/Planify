import React from 'react';
import PlanifyAPI from '../api.jsx';
import { notify } from '../data.jsx';
import { IconClose } from './icons.jsx';

const TM_HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
const TM_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function TimeMapPopup({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="tm-overlay" onClick={() => onClose?.()}>
      <div className="tm-modal" onClick={e => e.stopPropagation()}>
        <TimeMapInline onClose={onClose} />
      </div>
    </div>
  );
}

export function TimeMapInline({ onClose }) {
  const [grid, setGrid] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [blockModal, setBlockModal] = React.useState(null);
  const [blockReason, setBlockReason] = React.useState("");

  React.useEffect(() => {
    PlanifyAPI.getAvailability().then(data => {
      const g = {}; for (let d = 0; d < 7; d++) g[d] = {};
      if (data) for (const slot of data) {
        if (slot.type !== "blocked") continue;
        const sh = parseInt(slot.startTime), eh = parseInt(slot.endTime);
        for (let h = sh; h < eh; h++) { if (h >= 6 && h <= 23) g[slot.dayOfWeek][h] = slot.name; }
      }
      setGrid(g); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const blockCell = (d, h, name) => setGrid(prev => ({ ...prev, [d]: { ...prev?.[d], [h]: name } }));
  const unblockCell = (d, h) => setGrid(prev => {
    const next = { ...prev?.[d] }; delete next[h]; return { ...prev, [d]: next };
  });

  const save = async () => {
    if (!grid) return;
    setSaving(true);
    try {
      const slots = [];
      for (let d = 0; d < 7; d++) {
        let start = null, name = null;
        for (const h of TM_HOURS) {
          const v = grid[d]?.[h] || null;
          if (v && v === name && start !== null) continue;
          if (start !== null && name !== null)
            slots.push({ name, dayOfWeek: d, startTime: String(start).padStart(2, "0") + ":00", endTime: String(h).padStart(2, "0") + ":00", type: "blocked" });
          start = v ? h : null; name = v || null;
        }
        if (start !== null && name !== null)
          slots.push({ name, dayOfWeek: d, startTime: String(start).padStart(2, "0") + ":00", endTime: "23:00", type: "blocked" });
      }
      await PlanifyAPI.setAvailability(slots);
      notify("Time map saved — regenerate your schedule");
    } catch (e) { notify(e.message || "Could not save"); }
    setSaving(false);
  };

  const isPopup = !!onClose;

  return (
    <div style={isPopup ? { padding: '24px 28px', overflow: 'auto', flex: 1 } : { padding: '24px 28px', borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Time Map</div>
        {isPopup ? <button className="btn ghost" onClick={onClose}><IconClose size={14} /></button> : null}
      </div>
      <div className="t-mut" style={{ marginTop: 4 }}>
        All hours are available by default. Click any cell to block it and name the reason (e.g. School, Sleep).
      </div>
      {loading ? (
        <div className="t-mut" style={{ marginTop: 16 }}>Loading...</div>
      ) : (
        <>
          <div className="week-wrap" style={{ marginTop: 14 }}>
            <div className="week">
              <div className="hd" />
              {TM_DAYS.map(d => <div key={d} className="hd day">{d}</div>)}
              {TM_HOURS.map(h => (
                <React.Fragment key={h}>
                  <div className="hour">{String(h).padStart(2, "0")}:00</div>
                  {TM_DAYS.map((_, d) => {
                    const b = grid?.[d]?.[h] || null;
                    return (
                      <div key={d} className={'cell' + (b ? ' blocked' : '')}
                        onClick={() => {
                          if (b) { unblockCell(d, h); return; }
                          setBlockModal({ day: d, hour: h });
                          setBlockReason("");
                        }}
                        title={b ? b + ' — click to unblock' : 'Click to block this hour'}
                      >
                        {b ? <span className="tm-block-label">{b}</span> : null}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Time Map'}</button>
            <button className="btn ghost" onClick={() => PlanifyAPI.deleteAvailability().then(() => {
              const g = {}; for (let d = 0; d < 7; d++) g[d] = {}; setGrid(g); notify('Time map cleared');
            })}>Clear all</button>
          </div>
        </>
      )}

      {blockModal ? (
        <div className="tm-block-overlay" onClick={() => setBlockModal(null)}>
          <div className="tm-block-modal" onClick={e => e.stopPropagation()}>
            <div className="tm-block-head">
              <span>Block {TM_DAYS[blockModal.day]} {String(blockModal.hour).padStart(2,"0")}:00</span>
              <button className="btn ghost" onClick={() => setBlockModal(null)}><IconClose size={12} /></button>
            </div>
            <div className="tm-block-body">
              <input className="input" placeholder="Why? e.g. School, Sleep, Work" value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && blockReason.trim()) { blockCell(blockModal.day, blockModal.hour, blockReason.trim()); setBlockModal(null); } }}
                autoFocus
              />
            </div>
            <div className="tm-block-foot">
              <button className="btn ghost" onClick={() => setBlockModal(null)}>Cancel</button>
              <button className="btn" onClick={() => { if (blockReason.trim()) { blockCell(blockModal.day, blockModal.hour, blockReason.trim()); setBlockModal(null); } }}
                disabled={!blockReason.trim()}>Block</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
