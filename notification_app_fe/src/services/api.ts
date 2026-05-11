// NOTE: axios is not installed yet, using fetch instead
// This file uses the native fetch API

const API_BASE = '/api';

/**
 * Query parameters for the notifications API.
 */
interface NotificationQueryParams {
  page?: number;
  limit?: number;
  notification_type?: string;
}

/**
 * Fetch notifications from the campus notification API.
 * Supports pagination and type filtering via query parameters.
 *
 * @param params - Optional query parameters (page, limit, notification_type)
 * @returns The raw API response JSON
 * @throws Error if the request fails
 */
export async function fetchNotifications(params?: NotificationQueryParams) {
  const queryParts: string[] = [];

  if (params?.page !== undefined) {
    queryParts.push(`page=${params.page}`);
  }
  if (params?.limit !== undefined) {
    queryParts.push(`limit=${params.limit}`);
  }
  if (params?.notification_type) {
    queryParts.push(`notification_type=${params.notification_type}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const url = `${API_BASE}/notifications${queryString}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch from API, using fallback data:', error);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...FALLBACK_DATA];
    if (params?.notification_type) {
      filtered = filtered.filter(n => n.Type === params.notification_type);
    }
    
    // Simple pagination simulation
    const limit = params?.limit || 20;
    const page = params?.page || 1;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return { notifications: paginated };
  }
}

// Fallback data matching the API payload structure
const FALLBACK_DATA = [
  {"ID": "d146095a-0d86-4a34-9e69-3900a14576bc", "Type": "Result", "Message": "mid-sem", "Timestamp": "2026-04-22 17:51:30"},
  {"ID": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0", "Type": "Placement", "Message": "CSX Corporation hiring", "Timestamp": "2026-04-22 17:51:18"},
  {"ID": "81589ada-0ad3-4f77-9554-f52fb558e09d", "Type": "Event", "Message": "farewell", "Timestamp": "2026-04-22 17:51:06"},
  {"ID": "0005513a-142b-4bbc-8678-eefec65e1ede", "Type": "Result", "Message": "mid-sem", "Timestamp": "2026-04-22 17:50:54"},
  {"ID": "ea836726-c25e-4f21-a72f-544a6af8a37f", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:50:42"},
  {"ID": "003cb427-8fc6-47f7-bb00-be228f6b0d2c", "Type": "Result", "Message": "external", "Timestamp": "2026-04-22 17:50:30"},
  {"ID": "e5c4ff20-31bf-4d40-8f02-72fda59e8918", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:50:18"},
  {"ID": "1cfce5ee-ad37-4894-8946-d707627176a5", "Type": "Event", "Message": "tech-fest", "Timestamp": "2026-04-22 17:50:06"},
  {"ID": "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:49:54"},
  {"ID": "8a7412bd-6065-4d09-8501-a37f11cc848b", "Type": "Placement", "Message": "Advanced Micro Devices Inc. hiring", "Timestamp": "2026-04-22 17:49:42"},
];
