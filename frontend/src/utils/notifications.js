export const normalizeNotificationPayload = (payload = {}) => {
  const toCamel = (value) =>
    value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

  const toSnake = (value) =>
    value
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');

  const coalesce = (keys, fallback = null) => {
    for (const key of keys) {
      const variants = new Set([key]);
      if (typeof key === 'string') {
        if (key.includes('_')) {
          variants.add(toCamel(key));
        } else if (/[A-Z]/.test(key)) {
          variants.add(toSnake(key));
        }
      }

      for (const variant of variants) {
        if (payload[variant] !== undefined && payload[variant] !== null) {
          return payload[variant];
        }
      }
    }
    return fallback;
  };

  const id = coalesce(['id', 'notificationId', 'notification_id']);
  const createdAt = coalesce(['createdAt', 'created_at']);
  const readAt = coalesce(['readAt', 'read_at']);
  const relatedUser = coalesce(['relatedUser', 'related_user']);
  const relatedPost = coalesce(['relatedPost', 'related_post']);

  return {
    id,
    type: coalesce(['type', 'notificationType', 'notification_type'], 'notification'),
    title: coalesce(['title'], ''),
    message: coalesce(['message', 'content', 'body', 'text'], ''),
    isRead: coalesce(['isRead', 'is_read'], false),
    readAt: readAt || null,
    createdAt: createdAt || new Date().toISOString(),
    actionUrl: coalesce(['actionUrl', 'action_url'], null),
    relatedUserId: coalesce(['relatedUserId', 'related_user_id'], relatedUser?.id ?? null),
    relatedPostId: coalesce(['relatedPostId', 'related_post_id'], relatedPost?.id ?? null),
    relatedUser: relatedUser || null,
    relatedPost: relatedPost || null,
  };
};

export const upsertNotifications = (notifications, incoming) => {
  if (!incoming) {
    return notifications;
  }

  if (!incoming.id) {
    return [incoming, ...notifications];
  }

  const index = notifications.findIndex((item) => item.id === incoming.id);
  if (index === -1) {
    return [incoming, ...notifications];
  }

  const updated = [...notifications];
  updated[index] = { ...updated[index], ...incoming };
  return updated;
};

export const notificationRelatedEventTypes = new Set([
  'notification',
  'new_comment',
  'new_reaction',
  'new_share',
  'friend_request',
  'friend_accepted',
  'follow',
  'follow_update',
]);

export const shouldRefreshNotifications = (eventType) =>
  notificationRelatedEventTypes.has(eventType);
