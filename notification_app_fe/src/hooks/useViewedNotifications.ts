import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'viewed_notification_ids';

/**
 * Custom hook to track which notifications have been viewed.
 * Persists viewed IDs in localStorage so they survive page reloads.
 *
 * A notification is "new" if its ID has not been saved to the viewed set.
 * Once the user sees a notification (or explicitly marks it), it becomes "viewed".
 */
export function useViewedNotifications() {
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return new Set<string>(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
    return new Set<string>();
  });

  // Persist to localStorage whenever viewedIds changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...viewedIds]));
  }, [viewedIds]);

  /**
   * Mark a single notification as viewed.
   */
  const markAsViewed = useCallback((id: string) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  /**
   * Mark multiple notifications as viewed at once.
   */
  const markMultipleAsViewed = useCallback((ids: string[]) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  /**
   * Check if a notification has been viewed.
   */
  const isViewed = useCallback(
    (id: string) => viewedIds.has(id),
    [viewedIds]
  );

  return { viewedIds, isViewed, markAsViewed, markMultipleAsViewed };
}
