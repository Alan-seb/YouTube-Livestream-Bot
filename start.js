const { spawn } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Keep track of child processes
const processes = {
  bot: null,
  dashboard: null
};

// Start the dashboard
function startDashboard() {
  console.log('Starting dashboard...');
  const dashboardProcess = spawn('node', ['dashboardApp.js'], { 
    stdio: ['inherit', 'pipe', 'pipe'],
    detached: false
  });
  
  processes.dashboard = dashboardProcess;
  
  dashboardProcess.stdout.on('data', (data) => {
    console.log(`[Dashboard] ${data}`);
  });
  
  dashboardProcess.stderr.on('data', (data) => {
    console.error(`[Dashboard Error] ${data}`);
  });
  
  dashboardProcess.on('close', (code) => {
    console.log(`Dashboard process exited with code ${code}`);
    processes.dashboard = null;
  });
  
  return dashboardProcess;
}

// Start the bot
function startBot() {
  console.log('Starting bot...');
  const botProcess = spawn('node', ['index.js'], { 
    stdio: ['inherit', 'pipe', 'pipe'],
    detached: false
  });
  
  processes.bot = botProcess;
  
  botProcess.stdout.on('data', (data) => {
    console.log(`[Bot] ${data}`);
  });
  
  botProcess.stderr.on('data', (data) => {
    console.error(`[Bot Error] ${data}`);
  });
  
  botProcess.on('close', (code) => {
    console.log(`Bot process exited with code ${code}`);
    processes.bot = null;
  });
  
  return botProcess;
}

// Show the main menu
function showMenu() {
  console.log('\n--- YouTube Livestream Bot Control ---');
  console.log('1. Start Dashboard');
  console.log('2. Start Bot');
  console.log('3. Start Both');
  console.log('4. Stop Dashboard');
  console.log('5. Stop Bot');
  console.log('6. Stop All');
  console.log('7. Exit');
  
  rl.question('Select an option: ', (answer) => {
    switch(answer.trim()) {
      case '1':
        if (!processes.dashboard) {
          startDashboard();
        } else {
          console.log('Dashboard is already running.');
        }
        break;
      case '2':
        if (!processes.bot) {
          startBot();
        } else {
          console.log('Bot is already running.');
        }
        break;
      case '3':
        if (!processes.dashboard) {
          startDashboard();
        } else {
          console.log('Dashboard is already running.');
        }
        
        if (!processes.bot) {
          startBot();
        } else {
          console.log('Bot is already running.');
        }
        break;
      case '4':
        if (processes.dashboard) {
          processes.dashboard.kill();
          processes.dashboard = null;
          console.log('Dashboard stopped.');
        } else {
          console.log('Dashboard is not running.');
        }
        break;
      case '5':
        if (processes.bot) {
          processes.bot.kill();
          processes.bot = null;
          console.log('Bot stopped.');
        } else {
          console.log('Bot is not running.');
        }
        break;
      case '6':
        if (processes.dashboard) {
          processes.dashboard.kill();
          processes.dashboard = null;
          console.log('Dashboard stopped.');
        }
        
        if (processes.bot) {
          processes.bot.kill();
          processes.bot = null;
          console.log('Bot stopped.');
        }
        
        if (!processes.dashboard && !processes.bot) {
          console.log('All processes stopped.');
        }
        break;
      case '7':
        console.log('Exiting...');
        
        if (processes.dashboard) {
          processes.dashboard.kill();
        }
        
        if (processes.bot) {
          processes.bot.kill();
        }
        
        rl.close();
        process.exit(0);
        return;
      default:
        console.log('Invalid option.');
    }
    
    // Show the menu again
    showMenu();
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Cleaning up...');
  
  if (processes.dashboard) {
    processes.dashboard.kill();
  }
  
  if (processes.bot) {
    processes.bot.kill();
  }
  
  rl.close();
  process.exit(0);
});

// Start the interactive menu
console.log('Welcome to YouTube Livestream Bot Control');
showMenu(); 