/**
 * OAuth 2.0 Helper for getting refresh tokens
 * Run this script to get refresh tokens for both owner and bot accounts
 */
const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const url = require('url');
const openBrowser = require('open');
const destroyer = require('server-destroy');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration - Update these values
const CLIENT_ID = process.env.CLIENT_ID || ''; // Your client ID
const CLIENT_SECRET = process.env.CLIENT_SECRET || ''; // Your client secret
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

// Required OAuth 2.0 scopes for YouTube Data API
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl'
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Create an OAuth2 client with the provided credentials
 * @param {Object} credentials The client credentials
 * @param {function} callback The callback to call with the authorized client
 */
function authorize(credentials, callback) {
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

  // Generate an auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force approval prompt to ensure refresh token
  });

  // Start a local server to handle the redirect
  getAccessTokenFromAuthCode(oAuth2Client, authUrl, callback);
}

/**
 * Get the access token using the authorization code
 * @param {OAuth2Client} oAuth2Client The OAuth2 client
 * @param {string} authUrl The authorization URL
 * @param {function} callback The callback function
 */
function getAccessTokenFromAuthCode(oAuth2Client, authUrl, callback) {
  // Start a server to handle the OAuth callback
  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      
      if (parsedUrl.pathname !== '/oauth2callback') {
        res.end('Invalid callback URL');
        return;
      }
      
      // Close the server and handle the code
      res.end('Authentication successful! You can now close this window.');
      server.destroy();
      
      // Get the code from the URL
      const code = parsedUrl.query.code;
      
      // Exchange the code for tokens
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      
      console.log('\n\n=======================================');
      console.log('OAuth2 Authorization Successful!');
      console.log('=======================================');
      console.log('Refresh Token:', tokens.refresh_token);
      console.log('Access Token:', tokens.access_token);
      console.log('=======================================');
      console.log('Copy the refresh token to your .env file');
      console.log('=======================================\n\n');
      
      callback(oAuth2Client);
    } catch (e) {
      console.error('Error processing OAuth callback:', e);
      res.end('Error during authentication. See console for details.');
      server.destroy();
    }
  }).listen(3000);

  // Enable server cleanup
  destroyer(server);

  // Open the authorization URL in a browser
  console.log('Opening browser for authorization. Please log in and grant permissions...');
  try {
    openBrowser(authUrl);
  } catch (err) {
    console.error('Could not open the browser automatically. Please open this URL manually:', authUrl);
  }
}

/**
 * Start the OAuth process
 */
function startOAuth() {
  rl.question('Which account are you authorizing? (owner/bot): ', (answer) => {
    console.log(`Authorizing ${answer} account...`);
    
    rl.question('Enter Client ID: ', (clientId) => {
      rl.question('Enter Client Secret: ', (clientSecret) => {
        const credentials = {
          installed: {
            client_id: clientId || CLIENT_ID,
            client_secret: clientSecret || CLIENT_SECRET,
            redirect_uris: [REDIRECT_URI]
          }
        };
        
        authorize(credentials, () => {
          console.log(`\nAuthorization complete for ${answer} account!`);
          rl.question('Do you want to authorize another account? (y/n): ', (continueAuth) => {
            if (continueAuth.toLowerCase() === 'y') {
              startOAuth();
            } else {
              console.log('OAuth process complete.');
              rl.close();
            }
          });
        });
      });
    });
  });
}

// Start the OAuth process
console.log('YouTube Bot OAuth 2.0 Helper');
console.log('============================');
console.log('This script helps you obtain refresh tokens for both owner and bot accounts.\n');
startOAuth(); 