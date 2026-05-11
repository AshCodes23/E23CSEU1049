/**
 * Notification type enum matching the API contract.
 */
export type NotificationType = 'Placement' | 'Event' | 'Result';

/**
 * Raw notification object from the API response.
 */
export interface NotificationItem {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

/**
 * API response shape for the notifications endpoint.
 */
export interface NotificationsResponse {
  notifications: NotificationItem[];
}

/**
 * Weight mapping for notification types.
 * Used for priority calculation: Placement > Result > Event.
 */
export const TYPE_WEIGHT: Record<NotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

/**
 * Compute a priority score combining type weight and recency.
 * Higher score = more important.
 */
export function computePriorityScore(notification: NotificationItem): number {
  const weight = TYPE_WEIGHT[notification.Type] || 0;
  const timestamp = new Date(notification.Timestamp).getTime() / 1000;
  return weight * 1_000_000 + timestamp;
}
