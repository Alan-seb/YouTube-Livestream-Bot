// This file will serve as the central command registry and handler

// Command registry
const commands = new Map();

/**
 * Register a new command
 * @param {string} name - The command name (without ! prefix)
 * @param {object} commandObj - Command object with execute method and other properties
 */
function registerCommand(name, commandObj) {
  if (!name || typeof name !== 'string') {
    throw new Error('Command name must be a string');
  }
  
  if (!commandObj || typeof commandObj !== 'object' || typeof commandObj.execute !== 'function') {
    throw new Error('Command object must have an execute method');
  }
  
  // Normalize command name - IMPORTANT: We store commands WITHOUT the ! prefix
  // This resolves several command matching issues
  const normalizedName = name.toLowerCase().startsWith('!') 
    ? name.toLowerCase().substring(1) // Remove ! if present
    : name.toLowerCase();
    
  // Store the command
  commands.set(normalizedName, commandObj);
  
  console.log(`Registered command: "${normalizedName}" (${commandObj.description || 'No description'})`);
}

/**
 * Handles a command from a chat message
 * @param {string} commandText - The full command text from chat
 * @param {object} context - Execution context (user, bot, etc.)
 * @returns {Promise<boolean>} - Whether the command was handled
 */
async function handleCommand(commandText, context) {
  if (!commandText || !commandText.startsWith('!')) {
    console.log('Not a command:', commandText);
    return false;
  }
  
  // Extract command and arguments
  const args = commandText.trim().split(/\s+/);
  
  // Get the command name WITHOUT the ! prefix
  const fullCommandName = args[0].toLowerCase();
  const commandName = fullCommandName.startsWith('!') 
    ? fullCommandName.substring(1) // Remove the ! prefix
    : fullCommandName;
    
  const commandArgs = args.slice(1);
  
  console.log(`Processing command: "${commandName}" (from "${fullCommandName}"), args:`, commandArgs);
  console.log('Available commands:', Array.from(commands.keys()).join(', '));
  
  // Check if command exists
  if (!commands.has(commandName)) {
    console.log(`Unknown command: "${commandName}"`);
    return false;
  }
  
  // Execute command
  try {
    console.log(`Executing command: "${commandName}"`);
    const command = commands.get(commandName);
    await command.execute(commandArgs, context);
    console.log(`Command "${commandName}" executed successfully`);
    return true;
  } catch (error) {
    console.error(`Error executing command "${commandName}":`, error);
    return false;
  }
}

/**
 * Get all registered commands
 * @returns {Array} - Array of command objects
 */
function getCommands() {
  return Array.from(commands.values());
}

module.exports = {
  registerCommand,
  handleCommand,
  getCommands
}; 