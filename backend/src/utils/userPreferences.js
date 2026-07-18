export const DEFAULT_PREFERENCES = Object.freeze({
  inAppNotifications: true,
  dueReminders: true,
  groupTaskUpdates: true,
  groupMessages: true,
  aiSuggestions: true,
  focusMinutes: 25,
  breakMinutes: 5,
});

export const normalizePreferences = (value = {}) => ({
  ...DEFAULT_PREFERENCES,
  ...(value && typeof value === "object" && !Array.isArray(value) ? value : {}),
});

export const notificationPreferenceEnabled = (preferences, category) => {
  const normalized = normalizePreferences(preferences);
  if (!normalized.inAppNotifications) return false;
  return category ? normalized[category] !== false : true;
};
