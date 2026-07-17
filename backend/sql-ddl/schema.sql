-- Planify Database Schema
-- Generated from Sequelize model definitions

CREATE TABLE IF NOT EXISTS `User` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `resetPasswordCode` VARCHAR(255) NULL,
  `resetPasswordExpires` DATETIME NULL,
  `createAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `StudyGroup` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NULL,
  `createBy` CHAR(36) NOT NULL,
  `createAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `StudyGroup_createBy_fk` FOREIGN KEY (`createBy`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Task` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `groupId` CHAR(36) NULL,
  `subject` VARCHAR(255) NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `deadline` DATETIME NULL,
  `estimatedHours` FLOAT NULL,
  `assignees` JSON NULL,
  `priority` ENUM('high','medium','low') DEFAULT 'low',
  `status` ENUM('pending','in_progress','done') DEFAULT 'pending',
  `createAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `Task_userId` (`userId`),
  INDEX `Task_groupId` (`groupId`),
  INDEX `Task_deadline` (`deadline`),
  INDEX `Task_status` (`status`),
  CONSTRAINT `Task_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `Task_groupId_fk` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Schedule` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `generatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `planData` JSON NOT NULL,
  `isActive` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `Schedule_userId` (`userId`),
  INDEX `Schedule_userId_isActive` (`userId`, `isActive`),
  CONSTRAINT `Schedule_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `GroupMember` (
  `id` CHAR(36) NOT NULL,
  `groupId` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `role` VARCHAR(255) DEFAULT 'member',
  `status` ENUM('pending','accepted') DEFAULT 'accepted',
  PRIMARY KEY (`id`),
  INDEX `GroupMember_groupId_userId` (`groupId`, `userId`),
  INDEX `GroupMember_userId_status` (`userId`, `status`),
  INDEX `GroupMember_groupId_status` (`groupId`, `status`),
  CONSTRAINT `GroupMember_groupId_fk` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup` (`id`) ON DELETE CASCADE,
  CONSTRAINT `GroupMember_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `GroupTask` (
  `id` CHAR(36) NOT NULL,
  `groupId` CHAR(36) NOT NULL,
  `createBy` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `dueDate` DATETIME NULL,
  `priority` ENUM('high','medium','low') DEFAULT 'medium',
  `done` TINYINT(1) DEFAULT 0,
  `assignees` JSON DEFAULT '[]',
  `createAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `GroupTask_groupId` (`groupId`),
  INDEX `GroupTask_createBy` (`createBy`),
  CONSTRAINT `GroupTask_groupId_fk` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup` (`id`) ON DELETE CASCADE,
  CONSTRAINT `GroupTask_createBy_fk` FOREIGN KEY (`createBy`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `GroupTaskAssignee` (
  `groupTaskId` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `assignedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`groupTaskId`, `userId`),
  INDEX `GroupTaskAssignee_userId_groupTaskId` (`userId`, `groupTaskId`),
  CONSTRAINT `GroupTaskAssignee_groupTaskId_fk` FOREIGN KEY (`groupTaskId`) REFERENCES `GroupTask` (`id`) ON DELETE CASCADE,
  CONSTRAINT `GroupTaskAssignee_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `GroupMessage` (
  `id` CHAR(36) NOT NULL,
  `groupId` CHAR(36) NOT NULL,
  `senderId` CHAR(36) NOT NULL,
  `message` TEXT NOT NULL,
  `sentAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `GroupMessage_groupId` (`groupId`),
  INDEX `GroupMessage_senderId` (`senderId`),
  INDEX `GroupMessage_sentAt` (`sentAt`),
  CONSTRAINT `GroupMessage_groupId_fk` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup` (`id`) ON DELETE CASCADE,
  CONSTRAINT `GroupMessage_senderId_fk` FOREIGN KEY (`senderId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `UserAvailability` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `dayOfWeek` TINYINT NOT NULL,
  `startTime` VARCHAR(255) NOT NULL,
  `endTime` VARCHAR(255) NOT NULL,
  `type` ENUM('available','blocked') DEFAULT 'available',
  PRIMARY KEY (`id`),
  INDEX `UserAvailability_userId_dayOfWeek` (`userId`, `dayOfWeek`),
  CONSTRAINT `UserAvailability_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Notifications` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `taskId` CHAR(36) NULL,
  `groupId` CHAR(36) NULL,
  `inviterId` CHAR(36) NULL,
  `type` ENUM('task','group','group_invite','ai','system') DEFAULT 'task',
  `inviteStatus` ENUM('pending','accepted','declined') NULL,
  `message` VARCHAR(255) NOT NULL,
  `isRead` TINYINT(1) DEFAULT 0,
  `sentAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `Notifications_userId` (`userId`),
  INDEX `Notifications_groupId` (`groupId`),
  INDEX `Notifications_inviterId` (`inviterId`),
  INDEX `Notifications_isRead` (`isRead`),
  INDEX `Notifications_inviteStatus` (`inviteStatus`),
  INDEX `Notifications_sentAt` (`sentAt`),
  CONSTRAINT `Notifications_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `Notifications_taskId_fk` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
