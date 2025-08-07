const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// In-memory storage (for production consider using a database)
const analyticsData = {
    totalConnections: 0,
    activeConnections: 0,
    connectionsToday: 0,
    hourlyConnections: Array(24).fill(0),
    dailyConnections: {},
    botVersions: {},
    disconnectReasons: {}
};

// Middleware
app.use(cors());
app.use(express.json());

// Reset daily counter at midnight
function resetDailyCounter() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight - now;
    
    setTimeout(() => {
        analyticsData.connectionsToday = 0;
        resetDailyCounter();
    }, timeUntilMidnight);
}
resetDailyCounter();

// API endpoint to receive analytics
app.post('/api/analytics', (req, res) => {
    const { event, botId } = req.body;
    const now = new Date();
    const hour = now.getHours();
    const dateKey = now.toISOString().split('T')[0];
    
    switch(event) {
        case 'connection':
            analyticsData.totalConnections++;
            analyticsData.activeConnections++;
            analyticsData.connectionsToday++;
            analyticsData.hourlyConnections[hour]++;
            
            // Track by date
            if (!analyticsData.dailyConnections[dateKey]) {
                analyticsData.dailyConnections[dateKey] = 0;
            }
            analyticsData.dailyConnections[dateKey]++;
            
            // Track bot versions
            const version = req.body.version || 'unknown';
            if (!analyticsData.botVersions[version]) {
                analyticsData.botVersions[version] = 0;
            }
            analyticsData.botVersions[version]++;
            break;
            
        case 'disconnection':
            analyticsData.activeConnections = Math.max(0, analyticsData.activeConnections - 1);
            const reason = req.body.reason || 'unknown';
            if (!analyticsData.disconnectReasons[reason]) {
                analyticsData.disconnectReasons[reason] = 0;
            }
            analyticsData.disconnectReasons[reason]++;
            break;
            
        case 'message_received':
            // You can track message metrics here if needed
            break;
    }
    
    res.status(200).send('OK');
});

// API endpoint to get analytics data
app.get('/api/analytics', (req, res) => {
    res.json({
        ...analyticsData,
        currentTime: new Date().toISOString()
    });
});

// Serve static files (for dashboard)
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Analytics server running on port ${PORT}`);
});