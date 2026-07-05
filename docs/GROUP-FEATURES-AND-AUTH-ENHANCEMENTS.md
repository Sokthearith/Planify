# What We Did Today

## Group Collaboration
- **AddTaskModal**: added description field + edit mode with pre-filled data
- **Group task editing**: click Edit button (gear icon, then "Edit" text) on task row to edit
- **Description display**: group tasks show description below title
- **Edit/delete buttons**: always visible (no hover needed)

## Member Progress
- Computed locally from task state (no API call) — instant updates on toggle
- Shows per-member % based on assigned tasks done/total

## Invite System
- Notifications page shows Accept/Decline buttons for pending invites
- `group_invite` notifications get a dedicated `kind: "invite"` in UI
- Accept → backend updates GroupMember to `status: "accepted"`, refreshes data
- Decline → notification removed, invite rejected

## Remove Members
- X button next to each member (creator only)
- Calls `DELETE /groups/:id/members/:memberId`

## Role-Based Permissions
- **Creator**: full access — edit all fields, delete tasks, remove members
- **Assigned member**: can edit task fields (except assignees), toggle done
- **Unassigned member**: view-only — no Edit button, can't toggle done

## Backend Fixes
- `getMemberProgress`: fixed JSON `assignees` parsing (was raw string)
- `acceptGroupInvite`: fixed — now updates existing GroupMember to `status: "accepted"`
- `updateGroupTask`: non-creator can edit if assigned; strips `assignees` field for non-creator
- `deleteGroupTask`: only creator can delete

## Email Validation
- Register/login check domain has real MX records (Node.js `dns.resolveMx`)
- Built-in `dns` module, no external API needed
- Catches obviously fake domains (not typos of real ones)

## Files Changed
- `backend/src/controllers/groupController.js`
- `backend/src/controllers/notificationController.js`
- `backend/src/controllers/authController.js`
- `backend/src/controllers/groupTaskController.js`
- `frontend/src/app.jsx`
- `frontend/src/api.jsx`
- `frontend/src/components/modals.jsx`
- `frontend/src/pages/pages-groups.jsx`
- `frontend/src/pages/pages-other.jsx`
- `frontend/src/styles/styles.css`
