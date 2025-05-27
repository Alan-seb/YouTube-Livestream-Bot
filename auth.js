const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const url = require('url');
const open = require('open');
const destroyer = require('server-destroy');
const readline = require('readline');
require('dotenv').config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getRefreshToken() {
  const clientId = process.env.CLIENT_ID || await promptForValue('Enter your client ID: ');
  const clientSecret = process.env.CLIENT_SECRET || await promptForValue('Enter your client secret: ');
  const redirectUri = process.env.REDIRECT_URI || await promptForValue('Enter your redirect URI (e.g., http://localhost:3000/oauth2callback): ');

  const oAuth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );

  // Generate the URL that will be used for the consent dialog
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube'],
    prompt: 'consent'
  });

  console.log('Authorize this app by visiting this URL:', authorizeUrl);
  
  // If we're in a supported environment, try to open the URL automatically
  try {
    await open(authorizeUrl);
    console.log('Opening browser automatically...');
  } catch (err) {
    console.log('Failed to open browser automatically. Please open the URL manually.');
  }

  // Create a local server to receive the token
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.indexOf('/oauth2callback') > -1) {
        // Acquire the code from the querystring, and close the web server
        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = qs.get('code');
        console.log(`Code received: ${code}`);
        res.end('Authentication successful! You can close this window.');
        
        // Stop the server
        server.close();
        
        // Get the access token and refresh token
        const r = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(r.tokens);
        
        console.log('Authentication successful!');
        console.log('\nAdd the following to your .env file:');
        console.log(`REFRESH_TOKEN=${r.tokens.refresh_token}`);
        console.log('\nKeep this refresh token secure!');
        
        rl.close();
      }
    } catch (e) {
      console.error('Error getting OAuth tokens:', e);
      res.end('Failed to authenticate. Check console for more details.');
    }
  }).listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
  
  destroyer(server);
}

function promptForValue(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Check if we need to install missing dependencies
try {
  require('open');
  require('server-destroy');
} catch (e) {
  console.log('Installing missing dependencies...');
  require('child_process').execSync('npm install open server-destroy --save-dev');
  console.log('Dependencies installed. Restarting script...');
  process.exit(0);
}

// Start the auth process
getRefreshToken().catch(console.error); 