const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const UserManager = require('./userManager');
const { loadCommands } = require('./commandLoader');
require('dotenv').config();

class YouTubeLivestreamBot {
  constructor() {
    this.youtube = null;
    this.liveChatId = null;
    this.nextPageToken = null;
    this.interval = null;
    this.oauth2Client = null;
    this.botOauth2Client = null;
    this.userManager = new UserManager();
    this.saveInterval = null;
    this.commandHandler = null;
  }

  async init() {
    await this.userManager.init();
    
    // Load commands
    this.commandHandler = loadCommands();
    
    // Set up auto-save for user data every 5 minutes
    this.saveInterval = setInterval(() => {
      this.userManager.saveUsers();
    }, 5 * 60 * 1000);
  }

  async authenticate() {
    try {
      // Main OAuth client (stream owner account)
      this.oauth2Client = new OAuth2Client(
        process.env.CLIENT_ID || process.env.OWNER_CLIENT_ID,
        process.env.CLIENT_SECRET || process.env.OWNER_CLIENT_SECRET,
        process.env.REDIRECT_URI
      );

      this.oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN || process.env.OWNER_REFRESH_TOKEN
      });

      // Bot OAuth client (if separate credentials are provided)
      if (process.env.BOT_CLIENT_ID && process.env.BOT_CLIENT_SECRET && process.env.BOT_REFRESH_TOKEN) {
        this.botOauth2Client = new OAuth2Client(
          process.env.BOT_CLIENT_ID,
          process.env.BOT_CLIENT_SECRET,
          process.env.REDIRECT_URI
        );

        this.botOauth2Client.setCredentials({
          refresh_token: process.env.BOT_REFRESH_TOKEN
        });
        
        console.log('Bot account authentication configured');
      }

      this.youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      console.log('Authentication successful');
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }

  async getLiveChatId() {
    try {
      // Check if a specific video ID is provided
      const videoId = process.env.YOUTUBE_VIDEO_ID;
      
      if (videoId) {
        console.log(`Looking for live chat for specific video ID: ${videoId}`);
        // Get the video details to check if it's a live stream
        const videoResponse = await this.youtube.videos.list({
          part: 'liveStreamingDetails',
          id: videoId
        });
        
        if (videoResponse.data.items.length === 0) {
          console.error('No video found with the provided ID');
          return null;
        }
        
        const video = videoResponse.data.items[0];
        if (!video.liveStreamingDetails || !video.liveStreamingDetails.activeLiveChatId) {
          console.error('The provided video is not an active live stream');
          return null;
        }
        
        this.liveChatId = video.liveStreamingDetails.activeLiveChatId;
        console.log(`Live chat ID found for video ${videoId}: ${this.liveChatId}`);
        return this.liveChatId;
      }
      
      // If no specific video ID, get the active live broadcast
      console.log('No specific video ID provided, looking for any active broadcast');
      const response = await this.youtube.liveBroadcasts.list({
        part: 'snippet',
        broadcastStatus: 'active'
      });

      if (response.data.items.length === 0) {
        console.error('No active livestreams found');
        return null;
      }

      this.liveChatId = response.data.items[0].snippet.liveChatId;
      console.log(`Live chat ID found: ${this.liveChatId}`);
      return this.liveChatId;
    } catch (error) {
      console.error('Error getting live chat ID:', error);
      return null;
    }
  }

  async startListening() {
    if (!this.liveChatId) {
      console.error('No live chat ID available');
      return;
    }

    this.interval = setInterval(async () => {
      try {
        const response = await this.youtube.liveChatMessages.list({
          part: 'snippet,authorDetails',
          liveChatId: this.liveChatId,
          pageToken: this.nextPageToken
        });

        const { data } = response;
        this.nextPageToken = data.nextPageToken;

        // Process new messages
        data.items.forEach(item => this.processMessage(item));

        // Adjust polling interval based on API response
        const pollingIntervalMs = data.pollingIntervalMillis || 5000;
        clearInterval(this.interval);
        this.interval = setInterval(() => this.startListening(), pollingIntervalMs);
      } catch (error) {
        console.error('Error retrieving live chat messages:', error);
        clearInterval(this.interval);
      }
    }, 5000); // Initial polling interval
  }

  processMessage(message) {
    const { authorDetails, snippet } = message;
    const userId = authorDetails.channelId;
    const userName = authorDetails.displayName;
    const messageText = snippet.displayMessage;

    console.log(`[${userName}]: ${messageText}`);

    // Ensure user exists and update stats
    const user = this.userManager.ensureUser(userId, userName);
    this.userManager.incrementMessageCount(userId);
    this.userManager.addPoints(userId, 1);  // 1 point per message

    // Process welcome for first-time chatters (if welcome command exists)
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
      console.log(`Detected command: ${messageText}`);
      const commandContext = {
        user,
        bot: this,
        userManager: this.userManager,
        commandHandler: this.commandHandler,
        message
      };
      
      this.commandHandler.handleCommand(messageText, commandContext)
        .then(handled => {
          console.log(`Command ${messageText} handled: ${handled}`);
        })
        .catch(error => console.error('Error handling command:', error));
    }
  }

  async sendMessage(text) {
    try {
      // Determine which auth client to use for sending messages
      const authClient = this.botOauth2Client || this.oauth2Client;
      
      // Create a YouTube instance with the appropriate auth
      const youtubeForMessages = google.youtube({
        version: 'v3',
        auth: authClient
      });
      
      await youtubeForMessages.liveChatMessages.insert({
        part: 'snippet',
        resource: {
          snippet: {
            liveChatId: this.liveChatId,
            type: 'textMessageEvent',
            textMessageDetails: {
              messageText: text
            }
          }
        }
      });
      console.log(`Message sent: ${text}`);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('Bot stopped listening');
    }
    
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      console.log('Bot stopped auto-saving');
    }
    
    // Final save of user data
    this.userManager.saveUsers();
  }
}

// Simple function to start the bot
async function startBot() {
  const bot = new YouTubeLivestreamBot();
  
  console.log('Initializing user manager and commands...');
  await bot.init();
  
  console.log('Authenticating with YouTube API...');
  await bot.authenticate();
  
  console.log('Getting live chat ID...');
  const liveChatId = await bot.getLiveChatId();
  
  if (liveChatId) {
    console.log('Starting to listen for chat messages...');
    bot.startListening();
    console.log('Bot is now running');
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Shutting down bot...');
      bot.stop();
      process.exit(0);
    });
  } else {
    console.log('Failed to start the bot: No live chat ID found');
  }
  
  return bot;
}

// Export for use in other files
module.exports = {
  YouTubeLivestreamBot,
  startBot
};

// If this file is run directly
if (require.main === module) {
  startBot().catch(error => {
    console.error('Failed to start bot:', error);
  });
} 