const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;
const API_URL = "http://4.224.186.213/evaluation-service/notifications";

// Weight mapping
const TYPE_WEIGHT = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
};

// Fallback data if API is down
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

function getPriorityScore(notification) {
    const weight = TYPE_WEIGHT[notification.Type] || 0;
    const timestamp = new Date(notification.Timestamp).getTime() / 1000;
    return weight * 1000000 + timestamp;
}

// Min-Heap Implementation (no external libraries)
class MinHeap {
    constructor(maxSize) {
        this.heap = [];
        this.maxSize = maxSize;
    }

    insert(notification) {
        if (this.heap.length < this.maxSize) {
            this.heap.push(notification);
            this.bubbleUp(this.heap.length - 1);
        } else if (getPriorityScore(notification) > getPriorityScore(this.heap[0])) {
            this.heap[0] = notification;
            this.sinkDown(0);
        }
    }

    bubbleUp(index) {
        let parentIndex = Math.floor((index - 1) / 2);
        while (index > 0 && getPriorityScore(this.heap[index]) < getPriorityScore(this.heap[parentIndex])) {
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
            parentIndex = Math.floor((index - 1) / 2);
        }
    }

    sinkDown(index) {
        let smallest = index;
        const left = 2 * index + 1;
        const right = 2 * index + 2;

        if (left < this.heap.length && getPriorityScore(this.heap[left]) < getPriorityScore(this.heap[smallest])) {
            smallest = left;
        }
        if (right < this.heap.length && getPriorityScore(this.heap[right]) < getPriorityScore(this.heap[smallest])) {
            smallest = right;
        }

        if (smallest !== index) {
            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            this.sinkDown(smallest);
        }
    }

    getSortedTopN() {
        // Sort descending by priority score
        return [...this.heap].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
    }
}

// Priority Inbox API
app.get('/api/priority-inbox', async (req, res) => {
    try {
        const topN = parseInt(req.query.n) || 10;
        
        let notificationsData = [];
        try {
            const response = await axios.get(API_URL, { timeout: 3000 });
            notificationsData = response.data.notifications || [];
        } catch (error) {
            console.log('API unavailable, using fallback data for priority inbox');
            notificationsData = FALLBACK_DATA;
        }

        const inbox = new MinHeap(topN);
        notificationsData.forEach(notif => {
            inbox.insert(notif);
        });

        const topNotifications = inbox.getSortedTopN();
        
        res.json({
            success: true,
            data: topNotifications.map(notif => ({
                ...notif,
                PriorityScore: getPriorityScore(notif)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// Mock POST endpoint to simulate adding a notification (demonstration purposes)
app.post('/api/notifications', (req, res) => {
    const { type, message } = req.body;
    if (!type || !message) {
        return res.status(400).json({ success: false, error: "Type and message required" });
    }
    
    res.json({
        success: true,
        data: {
            ID: `new-id-${Date.now()}`,
            Type: type,
            Message: message,
            Timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }
    });
});

app.listen(PORT, () => {
    console.log(`Backend Server running on http://localhost:${PORT}`);
});
