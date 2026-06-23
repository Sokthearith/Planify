/* Inline minimal stroke icons — sharp, 1.5px strokes */

const I = ({ children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter"
       style={{ display: 'block' }}>
    {children}
  </svg>
);

const IconHome = ({ size }) => (
  <I size={size}><path d="M3 11 L12 4 L21 11 V20 H14 V14 H10 V20 H3 Z" /></I>
);
const IconTasks = ({ size }) => (
  <I size={size}>
    <rect x="3" y="3" width="18" height="18" />
    <path d="M7 12 L11 16 L17 8" />
  </I>
);
const IconGroups = ({ size }) => (
  <I size={size}>
    <circle cx="9" cy="9" r="3.2" />
    <circle cx="17" cy="11" r="2.4" />
    <path d="M3 20 C3 16, 6 14, 9 14 C12 14, 15 16, 15 20" />
    <path d="M15 20 C15 17.5, 17 16, 19 16 C21 16, 21 18, 21 20" />
  </I>
);
const IconCal = ({ size }) => (
  <I size={size}>
    <rect x="3" y="5" width="18" height="16" />
    <path d="M3 10 H21" />
    <path d="M8 3 V7" />
    <path d="M16 3 V7" />
  </I>
);
const IconProgress = ({ size }) => (
  <I size={size}><path d="M4 18 L9 13 L13 17 L20 7" /><path d="M20 7 H15" /><path d="M20 7 V12" /></I>
);
const IconBell = ({ size }) => (
  <I size={size}>
    <path d="M6 16 V10 C6 7, 9 5, 12 5 C15 5, 18 7, 18 10 V16 L20 18 H4 Z" />
    <path d="M10 21 H14" />
  </I>
);
const IconUser = ({ size }) => (
  <I size={size}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20 C4 16, 8 14, 12 14 C16 14, 20 16, 20 20" />
  </I>
);
const IconGear = ({ size }) => (
  <I size={size}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5" />
  </I>
);
const IconBack = ({ size }) => (
  <I size={size}><path d="M15 5 L8 12 L15 19" /></I>
);
const IconPlus = ({ size }) => (
  <I size={size}><path d="M12 5 V19 M5 12 H19" /></I>
);
const IconClose = ({ size }) => (
  <I size={size}><path d="M5 5 L19 19 M19 5 L5 19" /></I>
);
const IconArrow = ({ size }) => (
  <I size={size}><path d="M5 12 H19 M14 7 L19 12 L14 17" /></I>
);
const IconCheck = ({ size }) => (
  <I size={size}><path d="M5 12 L10 17 L19 7" /></I>
);
const IconSearch = ({ size }) => (
  <I size={size}>
    <circle cx="11" cy="11" r="6" />
    <path d="M16 16 L21 21" />
  </I>
);
const IconAddUser = ({ size }) => (
  <I size={size}>
    <circle cx="10" cy="8" r="3.5" />
    <path d="M3 20 C3 16, 6 14, 10 14 C13 14, 16 16, 16 20" />
    <path d="M19 8 V14 M16 11 H22" />
  </I>
);
const IconSpark = ({ size }) => (
  <I size={size}><path d="M12 4 L13.5 10.5 L20 12 L13.5 13.5 L12 20 L10.5 13.5 L4 12 L10.5 10.5 Z" /></I>
);
const IconClock = ({ size }) => (
  <I size={size}><circle cx="12" cy="12" r="9" /><path d="M12 7 V12 L15 14" /></I>
);
const IconEye = ({ size }) => (
  <I size={size}>
    <path d="M2 12 C5 7, 8 5, 12 5 C16 5, 19 7, 22 12 C19 17, 16 19, 12 19 C8 19, 5 17, 2 12 Z" />
    <circle cx="12" cy="12" r="3" />
  </I>
);
const IconEyeOff = ({ size }) => (
  <I size={size}>
    <path d="M2 12 C5 7, 8 5, 12 5 C16 5, 19 7, 22 12 C20.9 13.8, 19.6 15.2, 18 16.3" />
    <path d="M14.2 18.7 C13.5 18.9, 12.8 19, 12 19 C8 19, 5 17, 2 12 C3.1 10.2, 4.4 8.8, 6 7.7" />
    <path d="M5 5 L19 19" />
    <path d="M10 10 C9.5 10.5, 9.2 11.2, 9.2 12 C9.2 13.5, 10.5 14.8, 12 14.8 C12.8 14.8, 13.5 14.5, 14 14" />
  </I>
);
const IconLogout = ({ size }) => (
  <I size={size}>
    <path d="M10 4 H5 V20 H10" />
    <path d="M14 8 L18 12 L14 16" />
    <path d="M8 12 H18" />
  </I>
);

Object.assign(window, {
  IconHome, IconTasks, IconGroups, IconCal, IconProgress, IconBell, IconUser, IconGear,
  IconBack, IconPlus, IconClose, IconArrow, IconCheck, IconSearch, IconAddUser, IconSpark, IconClock,
  IconEye, IconEyeOff, IconLogout
});
