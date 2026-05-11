"""
Stage 6: Priority Inbox — Top N Notification Selector

Fetches notifications from the campus notification API and returns the
top N most important unread notifications based on:
  - Weight: Placement (3) > Result (2) > Event (1)
  - Recency: More recent notifications rank higher

Uses a Min-Heap (heapq) of size N to efficiently maintain the top N
notifications in O(M log N) time where M = total notifications.

New notifications can be dynamically inserted into the heap, replacing
the current minimum if they have a higher priority score.

Author : Student
Date   : 2026-05-11
"""

import heapq
import requests
import json
from datetime import datetime
from typing import List, Dict, Optional


# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────

API_URL = "http://4.224.186.213/evaluation-service/notifications"

# Weight mapping: higher weight = more important
TYPE_WEIGHT: Dict[str, int] = {
    "Placement": 3,
    "Result": 2,
    "Event": 1,
}

DEFAULT_TOP_N = 10


# ─────────────────────────────────────────────
# Data Model
# ─────────────────────────────────────────────

class Notification:
    """Represents a single notification with a computed priority score."""

    def __init__(self, id: str, type: str, message: str, timestamp: str):
        self.id = id
        self.type = type
        self.message = message
        self.timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        self.weight = TYPE_WEIGHT.get(type, 0)

    @property
    def priority_score(self) -> float:
        """
        Compute a priority score combining weight and recency.

        Score = weight * 1_000_000 + unix_timestamp

        This ensures that weight is the primary factor, and recency
        breaks ties within the same weight class.
        """
        unix_ts = self.timestamp.timestamp()
        return self.weight * 1_000_000 + unix_ts

    def __lt__(self, other: "Notification") -> bool:
        """Min-heap comparison: lower score = lower priority (evicted first)."""
        return self.priority_score < other.priority_score

    def __repr__(self) -> str:
        return (
            f"Notification(type={self.type}, message='{self.message}', "
            f"timestamp={self.timestamp.isoformat()}, score={self.priority_score:.0f})"
        )

    def to_dict(self) -> dict:
        """Serialize to a dictionary for display."""
        return {
            "ID": self.id,
            "Type": self.type,
            "Message": self.message,
            "Timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "Weight": self.weight,
            "PriorityScore": round(self.priority_score, 2),
        }


# ─────────────────────────────────────────────
# Priority Inbox (Min-Heap of size N)
# ─────────────────────────────────────────────

class PriorityInbox:
    """
    Maintains the top N most important notifications using a min-heap.

    Time Complexity:
        - insert(): O(log N) per insertion
        - get_top_n(): O(N log N) for final sort
        - build from M notifications: O(M log N) total

    Space Complexity: O(N) — only stores N items at any time.

    Handling new notifications:
        - When a new notification arrives, call insert().
        - If the new notification has a higher priority than the current
          minimum in the heap, it replaces the minimum.
        - This keeps the heap at exactly N items, always holding the top N.
    """

    def __init__(self, n: int = DEFAULT_TOP_N):
        self.n = n
        self._heap: List[Notification] = []

    def insert(self, notification: Notification) -> None:
        """
        Insert a notification into the priority inbox.

        If the heap has fewer than N items, push directly.
        If the heap is full and the new item has higher priority
        than the current minimum, replace the minimum.
        """
        if len(self._heap) < self.n:
            heapq.heappush(self._heap, notification)
        elif notification > self._heap[0]:
            # New notification is more important than the least
            # important item in our top-N — replace it.
            heapq.heapreplace(self._heap, notification)

    def get_top_n(self) -> List[Notification]:
        """
        Return the top N notifications sorted by priority (highest first).
        """
        return sorted(self._heap, reverse=True)

    @property
    def size(self) -> int:
        return len(self._heap)

    @property
    def min_score(self) -> Optional[float]:
        """The lowest priority score currently in the top-N."""
        if self._heap:
            return self._heap[0].priority_score
        return None


# ─────────────────────────────────────────────
# API Client
# ─────────────────────────────────────────────

def fetch_notifications() -> List[Dict]:
    """
    Fetch notifications from the campus notification API.

    Returns:
        List of notification dictionaries from the API response.

    Raises:
        requests.RequestException: If the API call fails.
    """
    try:
        response = requests.get(API_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("notifications", [])
    except requests.RequestException as e:
        print(f"[ERROR] Failed to fetch notifications from API: {e}")
        print("[INFO]  Using fallback sample data for demonstration.\n")
        return get_fallback_data()


def get_fallback_data() -> List[Dict]:
    """
    Fallback sample data matching the API response format.
    Used when the API is unreachable (e.g., during development).
    """
    return [
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
    ]


# ─────────────────────────────────────────────
# Display Helpers
# ─────────────────────────────────────────────

def print_separator(char: str = "=", width: int = 90) -> None:
    print(char * width)


def print_header(title: str) -> None:
    print_separator()
    print(f"  {title}")
    print_separator()


def display_notifications(notifications: List[Notification], title: str) -> None:
    """Pretty-print a list of notifications in a formatted table."""
    print_header(title)
    print(f"  {'Rank':<6} {'Type':<12} {'Weight':<8} {'Message':<35} {'Timestamp':<22} {'Score'}")
    print_separator("-")

    for i, notif in enumerate(notifications, 1):
        print(
            f"  {i:<6} {notif.type:<12} {notif.weight:<8} "
            f"{notif.message:<35} {notif.timestamp.strftime('%Y-%m-%d %H:%M:%S'):<22} "
            f"{notif.priority_score:.0f}"
        )

    print_separator()
    print()


# ─────────────────────────────────────────────
# Main Execution
# ─────────────────────────────────────────────

def main():
    """
    Main entry point:
    1. Fetch notifications from the API
    2. Build a PriorityInbox (min-heap of size 10)
    3. Display the top 10 priority notifications
    4. Demonstrate dynamic insertion of a new notification
    """

    print("\n" + "=" * 90)
    print("  CAMPUS NOTIFICATION PLATFORM - PRIORITY INBOX (Stage 6)")
    print("=" * 90 + "\n")

    # Step 1: Fetch from API
    print("[1] Fetching notifications from API...")
    raw_notifications = fetch_notifications()
    print(f"    Received {len(raw_notifications)} notifications.\n")

    # Step 2: Parse into Notification objects
    notifications = [
        Notification(
            id=n["ID"],
            type=n["Type"],
            message=n["Message"],
            timestamp=n["Timestamp"],
        )
        for n in raw_notifications
    ]

    # Display all fetched notifications (before prioritization)
    display_notifications(notifications, "ALL FETCHED NOTIFICATIONS (unsorted)")

    # Step 3: Build Priority Inbox
    print("[2] Building Priority Inbox (Top 10)...\n")
    inbox = PriorityInbox(n=10)
    for notif in notifications:
        inbox.insert(notif)

    # Step 4: Display top 10
    top_10 = inbox.get_top_n()
    display_notifications(top_10, "TOP 10 PRIORITY NOTIFICATIONS")

    # Step 5: Demonstrate dynamic insertion
    print("[3] Simulating a NEW incoming Placement notification...\n")
    new_notif = Notification(
        id="new-dynamic-uuid-001",
        type="Placement",
        message="Google hiring for SDE-1",
        timestamp="2026-05-11 10:00:00",
    )
    print(f"    New notification: {new_notif}")
    print(f"    Priority score:  {new_notif.priority_score:.0f}")
    print(f"    Current min in heap: {inbox.min_score:.0f}\n")

    inbox.insert(new_notif)

    # Display updated top 10
    updated_top_10 = inbox.get_top_n()
    display_notifications(updated_top_10, "UPDATED TOP 10 (after new Placement notification)")

    # Step 6: Summary
    print_header("ALGORITHM SUMMARY")
    print("  Data Structure : Min-Heap (heapq) of size N")
    print("  Insert         : O(log N) per notification")
    print("  Get Top N      : O(N log N) for final sorted output")
    print("  Space          : O(N) — only N items stored at any time")
    print("  Total build    : O(M log N) where M = total notifications")
    print()
    print("  How new notifications are handled efficiently:")
    print("  -> On arrival, compare with heap minimum (O(1) peek)")
    print("  -> If higher priority: replace minimum via heapreplace (O(log N))")
    print("  -> If lower priority: discard (O(1))")
    print("  -> The top N is always maintained without re-sorting all data")
    print_separator()


if __name__ == "__main__":
    main()
