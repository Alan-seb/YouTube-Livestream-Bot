# YouTube Livestream Bot with Dashboard

A Node.js bot for interacting with YouTube livestream chats. The bot can read chat messages, award points to users, and respond to commands. It also includes a web dashboard for monitoring and controlling the bot.

## Features

- Connects to YouTube Live Chat API
- Reads chat messages in real-time
- Tracks user participation with a points system
- Supports custom commands
- Persists user data between sessions
- Web dashboard with:
  - Leaderboard of users with highest points
  - Bot controls (start/stop)
  - Custom livestream URL input
  - Analytics page
  - Role-based access (admin/viewer)

## Prerequisites

- Node.js (v12 or higher)
- YouTube Data API v3 credentials
- A YouTube channel with livestreaming capability

## Setup

1. Clone this repository:
```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Set up YouTube API credentials:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the YouTube Data API v3
   - Create OAuth 2.0 credentials (Web application type)
   - Set up authorized redirect URIs (e.g., http://localhost:3000/oauth2callback)

4. Create a `.env` file based on the `.env.example` template:
```bash
cp .env.example .env
```

5. Run the authentication script to get your refresh token:
```bash
npm run auth
```

6. Follow the prompts to authenticate with your YouTube account and get your refresh token.

7. Update your `.env` file with the provided refresh token.

## OAuth 2.0 Setup Guide

### Setting Up Both Owner and Bot Accounts

This bot can use two different YouTube accounts:
1. **Owner Account** - Used to access the YouTube live stream
2. **Bot Account** - Used to send chat messages (optional)

Follow these steps to set up OAuth 2.0 for both accounts:

### Step 1: Create Projects in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create two separate projects (one for owner, one for bot)
   - Click "New Project" at the top right
   - Enter a name (e.g., "YouTube Bot Owner" and "YouTube Bot Account")
   - Click "Create"

### Step 2: Enable YouTube Data API for Both Projects

For each project:
1. Select the project from the dropdown at the top of the page
2. Go to "APIs & Services" > "Library"
3. Search for "YouTube Data API v3"
4. Click on it and click "Enable"

### Step 3: Set Up OAuth Consent Screen for Both Projects

For each project:
1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Fill in the required information:
   - App name
   - User support email
   - Developer contact information
4. Click "Save and Continue"
5. Add necessary scopes:
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.force-ssl`
6. Click "Save and Continue"
7. Add any test users (your email) and complete the setup

### Step 4: Create OAuth Credentials for Both Projects

For each project:
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Set Application type to "Web application"
4. Add a name (e.g., "YouTube Bot Owner" or "YouTube Bot Account")
5. Add an authorized redirect URI:
   - `http://localhost:3000/oauth2callback`
6. Click "Create"
7. Save the "Client ID" and "Client Secret" for each project

### Step 5: Get Refresh Tokens for Both Accounts

You'll need to run a simple OAuth flow to get refresh tokens for both accounts:

#### Option 1: Using the OAuth Playground

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon in the top right
3. Check "Use your own OAuth credentials"
4. Enter the Client ID and Client Secret for the first account
5. Click "Close"
6. Select "YouTube Data API v3" > select all scopes
7. Click "Authorize APIs"
8. Log in with the corresponding YouTube account (owner or bot)
9. Click "Allow"
10. Click "Exchange authorization code for tokens"
11. Copy the "Refresh token"
12. Repeat the entire process for the second account, using its credentials

#### Option 2: Using the Built-in Authorization Script

If the provided oauth.js script exists:

1. Update the `CLIENT_ID`, `CLIENT_SECRET`, and `REDIRECT_URI` in the script for the first account
2. Run `node oauth.js`
3. Follow the prompts, which will open a browser window
4. Log in with the corresponding YouTube account
5. Allow the permissions
6. Copy the refresh token from the console output
7. Repeat for the second account

### Step 6: Update .env File

Create or update your .env file with all credentials:

```
# Owner account (for accessing stream)
OWNER_CLIENT_ID=your_owner_client_id
OWNER_CLIENT_SECRET=your_owner_client_secret
OWNER_REFRESH_TOKEN=your_owner_refresh_token

# Bot account (for posting messages)
BOT_CLIENT_ID=your_bot_client_id
BOT_CLIENT_SECRET=your_bot_client_secret
BOT_REFRESH_TOKEN=your_bot_refresh_token

# Common settings
REDIRECT_URI=http://localhost:3000/oauth2callback
YOUTUBE_VIDEO_ID=optional_specific_video_id
```

The bot will use the bot account for sending messages if bot credentials are provided. Otherwise, it will use the owner account for both access and messaging.

## Usage

### Interactive Control Panel

The easiest way to start and manage the bot and dashboard is through the interactive control panel:

```bash
npm run control
```

This will present you with a menu where you can:
- Start/stop the bot
- Start/stop the dashboard
- Start both together
- Stop all processes

### Starting the Bot Directly

Start the bot when you're running a livestream:

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev:bot
```

### Using the Dashboard

Start the dashboard:

```bash
npm run dashboard
```

For development with auto-reload:
```bash
npm run dev:dashboard
```

Access the dashboard at: http://localhost:3000

#### Default Dashboard Accounts

- Admin User:
  - Username: `admin`
  - Password: `admin123`
  - Full control of the bot

- Viewer User:
  - Username: `viewer`
  - Password: `viewer123`
  - Read-only access

## Available Commands

- `!points` - Check your points or another user's points
  - Usage: `!points [username]`
- `!top` - Show top users by points
  - Usage: `!top [number]` (number between 1-10)

## Dashboard Features

- **Dashboard Home**: Overview with leaderboard and quick actions
- **Settings** (Admin Only): Start/stop the bot and input custom livestream URLs
- **Analytics**: View statistics about user engagement and bot performance

## Adding New Commands

1. Create a new file in the `commands` directory (e.g., `commands/mycommand.js`)
2. Follow the command template:

```javascript
const myCommand = {
  name: 'commandname',
  description: 'What the command does',
  usage: '!commandname [args]',
  cooldown: 5, // Cooldown in seconds
  
  async execute(args, context) {
    const { user, bot, userManager } = context;
    // Command implementation
  }
};

module.exports = myCommand;
```

The command will be automatically loaded when the bot starts.

## Points System

- Users earn 1 point for each message they send
- Points are persisted between bot sessions
- Points can be checked using the `!points` command
- Leaderboard can be viewed using the `!top` command or on the dashboard

## License

This project is licensed under the ISC License. 