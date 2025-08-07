require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data storage
const dataPath = path.join(__dirname, 'data', 'analytics.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(dataPath))) {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({ bots: [], stats: {} }, null, 2));
}

// API endpoint to receive analytics data
app.post('/api/analytics', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath));
    const botData = req.body;
    
    // Update or add bot data
    const existingIndex = data.bots.findIndex(b => b.botId === botData.botId);
    if (existingIndex >= 0) {
      data.bots[existingIndex] = botData;
    } else {
      data.bots.push(botData);
    }
    
    // Update global stats
    data.stats = {
      totalBots: data.bots.length,
      totalUsers: data.bots.reduce((sum, bot) => sum + bot.stats.totalUsers, 0),
      activeUsers: data.bots.reduce((sum, bot) => sum + bot.stats.activeUsers, 0),
      messagesProcessed: data.bots.reduce((sum, bot) => sum + bot.stats.messagesProcessed, 0),
      commandsProcessed: data.bots.reduce((sum, bot) => sum + bot.stats.commandsProcessed, 0),
      groups: data.bots.reduce((sum, bot) => sum + bot.stats.groups, 0),
      errors: data.bots.reduce((sum, bot) => sum + bot.stats.errors, 0),
      lastUpdated: new Date().toISOString()
    };
    
    // Save to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    res.status(200).send('Data received');
  } catch (error) {
    console.error('Error processing analytics:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API endpoint to get analytics data
app.get('/api/analytics', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath));
    res.json(data);
  } catch (error) {
    console.error('Error reading analytics:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Serve dashboard
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Analytics server running on http://localhost:${PORT}`);
});