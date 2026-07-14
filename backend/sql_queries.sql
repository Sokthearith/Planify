-- 1) Get all tasks for a specific user with group name (JOIN)
SELECT
  t.title,
  t.status,
  t.priority,
  t.deadline,
  s.name AS group_name
FROM Tasks t
LEFT JOIN StudyGroups s ON t.groupId = s.id
WHERE t.userId = '<user-uuid>'
ORDER BY t.deadline;

-- 2) Count tasks by status per user (GROUP BY + aggregation)
SELECT
  u.name,
  t.status,
  COUNT(*) AS task_count
FROM Users u
JOIN Tasks t ON u.id = t.userId
GROUP BY u.id, t.status
ORDER BY u.name, t.status;

-- 3) Find groups where a user has unread messages (subquery)
SELECT DISTINCT sg.name
FROM StudyGroups sg
WHERE sg.id IN (
  SELECT gm.groupId
  FROM GroupMessages gm
  WHERE gm.sentAt > COALESCE(
    (SELECT MAX(n.sentAt) FROM Notifications n
     WHERE n.userId = '<user-uuid>' AND n.groupId = gm.groupId),
    '1970-01-01'
  )
);

-- 4) Get members with pending invites (correlated subquery)
SELECT
  u.name AS member_name,
  sg.name AS group_name,
  gm.status
FROM GroupMembers gm
JOIN Users u ON gm.userId = u.id
JOIN StudyGroups sg ON gm.groupId = sg.id
WHERE gm.status = 'pending';

-- 5) Average estimated hours per priority level
SELECT
  priority,
  AVG(estimatedHours) AS avg_hours,
  COUNT(*) AS task_count
FROM Tasks
GROUP BY priority
ORDER BY avg_hours DESC;

-- 6) Users with the most incomplete tasks (aggregation + HAVING)
SELECT
  u.name,
  COUNT(*) AS pending_count
FROM Users u
JOIN Tasks t ON u.id = t.userId
WHERE t.status != 'done'
GROUP BY u.id
HAVING pending_count > 2
ORDER BY pending_count DESC;

-- 7) Full project task progress with member names (multi-JOIN)
SELECT
  gt.title AS group_task,
  u.name AS assignee,
  gt.done
FROM GroupTasks gt
CROSS JOIN JSON_TABLE(gt.assignees, '$[*]' COLUMNS (uid VARCHAR(36) PATH '$')) AS jt
JOIN Users u ON u.id = jt.uid
WHERE gt.groupId = '<group-uuid>'
ORDER BY gt.title;
