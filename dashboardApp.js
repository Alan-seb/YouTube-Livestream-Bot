const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const path = require('path');
const flash = require('connect-flash');
const { YouTubeLivestreamBot } = require('./index');
const UserManager = require('./userManager');

// This is where we'll store our admin users
// In a production app, you'd want to use a database
const users = [
  { id: 1, username: 'ADMIN', password: '$2b$10$XvbUGDZ4QZ0VQlGGtE2dPulHlhC3bQ0dFu1aE9K8LkZQLO0EsXW0W', role: 'admin' }, // Vazha@2025
  { id: 2, username: 'USER', password: '$2b$10$6Z1JqKfpwsXxIPDfDwxR/OecKDRpYpvmVZXwJ81pdSVZ9lEQjD4I.', role: 'viewer' } // 123456789
];

// Create a global bot instance that will be controlled from the dashboard
let botInstance = null;
// Create a global userManager instance to access user data
let userManager = new UserManager();

// Initialize bot status and settings globals
let botStatus = 'stopped';
let settings = {
  liveStreamUrl: '',
  pointsPerMessage: 1,
  commandPrefix: '!'
};

// Let's create an array to store recent bot logs
const botLogs = [];
const MAX_LOGS = 50;

// Function to add a log entry
function addBotLog(message) {
  botLogs.unshift({
    timestamp: new Date(),
    message: message
  });
  
  // Keep only the most recent logs
  if (botLogs.length > MAX_LOGS) {
    botLogs.pop();
  }
}

// Create Express app
const app = express();

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'youtube-bot-dashboard-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware to log session and user info
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Is Authenticated:', req.isAuthenticated());
  console.log('Current user:', req.user);
  next();
});

// Passport configuration
passport.use(new LocalStrategy(
  async (username, password, done) => {
    console.log(`Login attempt for username: ${username}`);
    
    // For debugging - direct credential access (only for development)
    if ((username === 'ADMIN' && password === 'Vazha@2025') || 
        (username === 'USER' && password === '123456789')) {
      const user = users.find(user => user.username.toLowerCase() === username.toLowerCase());
      if (user) {
        console.log(`Direct login successful for ${username}`);
        return done(null, user);
      }
    }
    
    // Normal authentication flow
    const user = users.find(user => user.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      console.log(`User not found: ${username}`);
      return done(null, false, { message: 'Incorrect username or password.' });
    }
    
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.log('Error comparing passwords:', err);
        return done(err);
      }
      if (!result) {
        console.log(`Login failed: Incorrect password for ${username}`);
        return done(null, false, { message: 'Incorrect password.' });
      }
      console.log(`Login successful for ${username}`);
      return done(null, user);
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user);
});

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Middleware to ensure user is admin
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  req.flash('message', 'You need administrator privileges to access this page');
  req.flash('messageType', 'warning');
  res.redirect('/dashboard');
}

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  // Initialize message and messageType with defaults if not present
  const message = req.flash('error') || [];
  const messageType = 'danger';
  
  res.render('login', { 
    message: message.length > 0 ? message[0] : null,
    messageType
  });
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      console.error('Error during logout:', err);
    }
    res.redirect('/login');
  });
});

// Routes - Dashboard
app.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    // Initialize userManager if not initialized
    if (!userManager.initialized) {
      await userManager.init();
    }
    
    // Get real top users from the UserManager
    const topUsers = userManager.getTopUsers(5);
  
  // Initialize message and messageType with defaults if not present
  const message = req.flash('message') || [];
  const messageType = req.flash('messageType') || 'info';
  
  res.render('dashboard', { 
    user: req.user,
    botStatus,
    topUsers,
    message: message.length > 0 ? message[0] : null,
    messageType: messageType.length > 0 ? messageType[0] : 'info'
  });
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).send('Internal server error');
  }
});

// Routes - Settings page
app.get('/settings', ensureAuthenticated, ensureAdmin, (req, res) => {
  try {
    // Initialize message and messageType with defaults
    const message = req.flash('message');
    const messageType = req.flash('messageType');
    
    console.log('Settings page - message:', message);
    console.log('Settings page - messageType:', messageType);
    
    res.render('settings', { 
      user: req.user,
      botStatus,
      settings,
      message: message.length > 0 ? message[0] : null,
      messageType: messageType.length > 0 ? messageType[0] : 'info'
    });
  } catch (error) {
    console.error('Error rendering settings page:', error);
    res.status(500).send('Internal server error');
  }
});

// Routes - Start Bot action
app.post('/start-bot', ensureAuthenticated, ensureAdmin, async (req, res) => {
  if (botStatus === 'running') {
    req.flash('message', 'Bot is already running');
    req.flash('messageType', 'warning');
  } else {
    try {
      // Create a new bot instance if it doesn't exist
      if (!botInstance) {
        botInstance = new YouTubeLivestreamBot();
        // Share the same UserManager instance
        botInstance.userManager = userManager;
        
        // Add custom logging for the bot
        const originalProcessMessage = botInstance.processMessage;
        botInstance.processMessage = function(message) {
          // Before calling the original method, ensure commandHandler is available
          if (!this.commandContext) {
            this.commandContext = {
              bot: this,
              userManager: this.userManager,
              commandHandler: this.commandHandler
            };
          }
          
          // Modify original method call to ensure proper command handling
          try {
            const { authorDetails, snippet } = message;
            const userId = authorDetails.channelId;
            const userName = authorDetails.displayName;
            const messageText = snippet.displayMessage;
            
            // Ensure user exists and update stats
            const user = this.userManager.ensureUser(userId, userName);
            this.userManager.incrementMessageCount(userId);
            this.userManager.addPoints(userId, 1); // 1 point per message
            
            // Process welcome for first-time chatters
            const welcomeCommand = this.commandHandler.getCommands().find(cmd => cmd.name === '_welcome');
            if (welcomeCommand) {
              const commandContext = {
                user,
                bot: this,
                userManager: this.userManager,
                commandHandler: this.commandHandler,
                message
              };
              
              welcomeCommand.execute([], commandContext)
                .catch(error => console.error('Error handling welcome:', error));
            }
            
            // Handle explicit commands
            if (messageText.startsWith('!') && this.commandHandler) {
              addBotLog(`Detected command: ${messageText}`);
              const commandContext = {
                user,
                bot: this,
                userManager: this.userManager,
                commandHandler: this.commandHandler,
                message
              };
              
              this.commandHandler.handleCommand(messageText, commandContext)
                .then(handled => {
                  addBotLog(`Command ${messageText} handled: ${handled}`);
                })
                .catch(error => {
                  addBotLog(`Error handling command: ${error.message}`);
                  console.error('Error handling command:', error);
                });
            }
          } catch (err) {
            console.error("Error in modified processMessage:", err);
            // Fall back to original implementation if our custom one fails
            originalProcessMessage.call(this, message);
          }
          
          // Log the message
          const { authorDetails, snippet } = message;
          const userName = authorDetails.displayName;
          const messageText = snippet.displayMessage;
          addBotLog(`[${userName}]: ${messageText}`);
        };
        
        // Also log when the bot sends messages
        const originalSendMessage = botInstance.sendMessage;
        botInstance.sendMessage = async function(text) {
          // Call the original method
          const result = await originalSendMessage.call(this, text);
          
          // Log the bot's message
          addBotLog(`Bot: ${text}`);
          
          return result;
        };
      }
      
      // Initialize and start the bot
      addBotLog('Bot initializing...');
      await botInstance.init();
      addBotLog('Bot authenticating with YouTube...');
      await botInstance.authenticate();
      
      const liveStreamUrl = settings.liveStreamUrl;
      
      if (liveStreamUrl) {
        // Extract video ID from URL if present
        const videoId = extractVideoId(liveStreamUrl);
        if (videoId) {
          process.env.YOUTUBE_VIDEO_ID = videoId;
          addBotLog(`Using video ID: ${videoId}`);
        }
        
        addBotLog('Getting live chat ID...');
        const liveChatId = await botInstance.getLiveChatId();
        
        if (liveChatId) {
          addBotLog(`Live chat ID found: ${liveChatId}`);
          botInstance.startListening();
          botStatus = 'running';
          addBotLog('Bot started successfully and is now listening to chat');
  req.flash('message', 'Bot started successfully');
  req.flash('messageType', 'success');
        } else {
          addBotLog('Failed to get live chat ID. Make sure the stream is active.');
          req.flash('message', 'Failed to get live chat ID. Make sure the stream is active.');
          req.flash('messageType', 'danger');
        }
      } else {
        addBotLog('No livestream URL provided');
        req.flash('message', 'Please set a livestream URL first');
        req.flash('messageType', 'warning');
      }
    } catch (error) {
      console.error('Error starting bot:', error);
      addBotLog(`Error starting bot: ${error.message}`);
      req.flash('message', `Error starting bot: ${error.message}`);
      req.flash('messageType', 'danger');
    }
  }
  
  res.redirect('/settings');
});

// Function to extract YouTube video ID from URL
function extractVideoId(url) {
  if (!url) return null;
  
  // Check for youtube.com/live/VIDEO_ID format
  const liveRegExp = /^.*youtube\.com\/live\/([^\/\?&#]+)/;
  const liveMatch = url.match(liveRegExp);
  if (liveMatch && liveMatch[1]) {
    return liveMatch[1];
  }
  
  // Regular expression to extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
}

// Handle settings updates - advanced settings
app.post('/settings/update-advanced', ensureAuthenticated, ensureAdmin, (req, res) => {
  const { pointsPerMessage, commandPrefix } = req.body;
  
  settings.pointsPerMessage = parseInt(pointsPerMessage) || 1;
  settings.commandPrefix = commandPrefix || '!';
  
  console.log('Advanced settings updated:', settings);
  
  req.flash('message', 'Advanced settings updated successfully');
  req.flash('messageType', 'success');
  res.redirect('/settings');
});

// Handle settings updates - livestream URL
app.post('/update-stream', ensureAuthenticated, ensureAdmin, (req, res) => {
  const { liveStreamUrl } = req.body;
  
  if (!liveStreamUrl) {
    req.flash('message', 'Livestream URL is required');
    req.flash('messageType', 'danger');
  } else {
    settings.liveStreamUrl = liveStreamUrl;
    req.flash('message', 'Livestream URL updated successfully');
    req.flash('messageType', 'success');
  }
  
  res.redirect('/settings');
});

// Routes - Stop Bot action
app.post('/stop-bot', ensureAuthenticated, ensureAdmin, (req, res) => {
  if (botStatus === 'stopped') {
    req.flash('message', 'Bot is already stopped');
    req.flash('messageType', 'warning');
  } else {
    try {
      // Stop the bot
      if (botInstance) {
        addBotLog('Stopping bot...');
        
        if (botInstance.interval) {
          clearInterval(botInstance.interval);
          botInstance.interval = null;
        }
        
        if (botInstance.saveInterval) {
          clearInterval(botInstance.saveInterval);
          botInstance.saveInterval = null;
        }
        
        // Save user data before stopping
        if (botInstance.userManager) {
          addBotLog('Saving user data...');
          botInstance.userManager.saveUsers();
        }
      }
      
      botStatus = 'stopped';
      addBotLog('Bot stopped successfully');
  req.flash('message', 'Bot stopped successfully');
  req.flash('messageType', 'success');
    } catch (error) {
      console.error('Error stopping bot:', error);
      addBotLog(`Error stopping bot: ${error.message}`);
      req.flash('message', `Error stopping bot: ${error.message}`);
      req.flash('messageType', 'danger');
    }
  }
  
  res.redirect('/settings');
});

// Handle restart bot
app.post('/restart-bot', ensureAuthenticated, ensureAdmin, (req, res) => {
  if (settings.liveStreamUrl) {
    botStatus = 'running';
    
    // In a real implementation, this would restart the bot
    console.log(`Bot restarted with URL: ${settings.liveStreamUrl}`);
    
    req.flash('message', 'Bot restarted successfully');
    req.flash('messageType', 'success');
  } else {
    req.flash('message', 'Cannot restart bot without a livestream URL');
    req.flash('messageType', 'danger');
  }
  
  res.redirect('/settings');
});

// Routes - Analytics page
app.get('/analytics', ensureAuthenticated, async (req, res) => {
  try {
    // Initialize userManager if not initialized
    if (!userManager.initialized) {
      await userManager.init();
    }
    
    // Get real user data
    const allUsers = [...userManager.users.values()];
    const mostActiveUsers = allUsers
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 5);
    
    const totalUsers = userManager.users.size;
    const totalMessages = allUsers.reduce((sum, user) => sum + user.messages, 0);
    const totalPoints = allUsers.reduce((sum, user) => sum + user.points, 0);
    const averagePoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;
  
  // Initialize message and messageType with defaults if not present
  const message = req.flash('message') || [];
  const messageType = req.flash('messageType') || 'info';
  
  res.render('analytics', { 
    user: req.user,
    botStatus,
    mostActiveUsers,
    totalUsers,
    totalMessages,
    totalPoints,
    averagePoints,
    message: message.length > 0 ? message[0] : null,
    messageType: messageType.length > 0 ? messageType[0] : 'info'
  });
  } catch (error) {
    console.error('Error rendering analytics:', error);
    res.status(500).send('Internal server error');
  }
});

// Routes - Live Chat page
app.get('/livechat', ensureAuthenticated, async (req, res) => {
  try {
    // Get the video ID from either the bot instance or settings
    let videoId = null;
    let liveChatFound = false;
    
    // If we have an active bot instance with a video ID
    if (botInstance && process.env.YOUTUBE_VIDEO_ID) {
      videoId = process.env.YOUTUBE_VIDEO_ID;
      liveChatFound = !!botInstance.liveChatId;
    } else if (settings.liveStreamUrl) {
      // Try to extract from the settings URL
      videoId = extractVideoId(settings.liveStreamUrl);
      
      // If we have a bot instance, check if it found a live chat ID
      if (botInstance) {
        liveChatFound = !!botInstance.liveChatId;
      }
    }
    
    // Initialize message and messageType with defaults if not present
    const message = req.flash('message') || [];
    const messageType = req.flash('messageType') || 'info';
    
    res.render('livechat', { 
      user: req.user,
      botStatus,
      videoId,
      liveChatFound,
      logs: botLogs,
      message: message.length > 0 ? message[0] : null,
      messageType: messageType.length > 0 ? messageType[0] : 'info'
    });
  } catch (error) {
    console.error('Error rendering live chat:', error);
    res.status(500).send('Internal server error');
  }
});

// Test route to check video ID extraction and live chat ID
app.get('/test-video/:url', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);
    const videoId = extractVideoId(url);
    
    // Create a result object
    const result = {
      originalUrl: url,
      extractedVideoId: videoId,
      isValidVideoId: videoId && videoId.length === 11
    };
    
    // If we have a valid video ID, try to get live chat ID
    if (result.isValidVideoId) {
      if (!botInstance) {
        botInstance = new YouTubeLivestreamBot();
        await botInstance.init();
        await botInstance.authenticate();
      }
      
      // Set the video ID for testing
      process.env.YOUTUBE_VIDEO_ID = videoId;
      
      // Try to get live chat ID
      const liveChatId = await botInstance.getLiveChatId();
      
      result.liveChatId = liveChatId;
      result.liveChatFound = !!liveChatId;
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message,
      stack: error.stack
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard server running on http://localhost:${PORT}`);
  console.log('Default users:');
  console.log('- Admin: username=ADMIN, password=Vazha@2025');
  console.log('- Viewer: username=USER, password=123456789');
}); 