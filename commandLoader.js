const fs = require('fs');
const path = require('path');
const commandHandler = require('./commands/index.js');

/**
 * Load all commands from the commands directory
 */
function loadCommands() {
  console.log('=== LOADING COMMANDS ===');
  
  // Load the command handler first
  if (!commandHandler) {
    console.error('Command handler module not found');
    return null;
  }
  
  // Path to commands directory
  const commandsDir = path.join(__dirname, 'commands');
  console.log(`Commands directory: ${commandsDir}`);
  
  // Check if commands directory exists
  if (!fs.existsSync(commandsDir)) {
    console.error(`Commands directory not found: ${commandsDir}`);
    return commandHandler;
  }
  
  // Get all command files
  const commandFiles = fs.readdirSync(commandsDir)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
  
  console.log(`Found ${commandFiles.length} command files: ${commandFiles.join(', ')}`);
  
  // Load each command
  for (const file of commandFiles) {
    try {
      const commandPath = path.join(commandsDir, file);
      const command = require(commandPath);
      
      // Verify command structure
      if (!command.name || typeof command.execute !== 'function') {
        console.warn(`Command in ${file} is missing name or execute method, skipping...`);
        continue;
      }
      
      // Register the command
      commandHandler.registerCommand(command.name, command);
      console.log(`Loaded command: ${command.name} (from ${file})`);
    } catch (error) {
      console.error(`Error loading command from ${file}:`, error);
    }
  }
  
  const loadedCommands = commandHandler.getCommands();
  console.log(`Successfully loaded ${loadedCommands.length} commands:`);
  loadedCommands.forEach(cmd => console.log(` - ${cmd.name}: ${cmd.description || 'No description'}`));
  console.log('=== COMMAND LOADING COMPLETE ===');
  
  return commandHandler;
}

module.exports = {
  loadCommands
}; 