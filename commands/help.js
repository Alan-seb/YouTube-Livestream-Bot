/**
 * Help command - Shows available commands and their usage
 */
const helpCommand = {
  name: 'help',
  description: 'Shows all available commands and their usage',
  usage: '!help [command name]',
  cooldown: 10, // Cooldown in seconds
  
  /**
   * Execute the command
   * @param {Array} args - Command arguments
   * @param {Object} context - Command context
   * @param {Object} context.user - User who triggered the command
   * @param {Object} context.bot - Bot instance
   * @param {Object} context.commandHandler - Command handler instance
   */
  async execute(args, context) {
    const { user, bot, commandHandler } = context;
    const commandPrefix = '!'; // The command prefix used by the bot
    
    // Get all available commands
    const commands = commandHandler.getCommands();
    
    // If a specific command was requested
    if (args.length > 0) {
      const commandName = args[0].toLowerCase().startsWith(commandPrefix) 
        ? args[0].toLowerCase() 
        : commandPrefix + args[0].toLowerCase();
      
      // Find the command
      const command = commands.find(cmd => cmd.name.toLowerCase() === commandName.replace(commandPrefix, ''));
      
      if (command) {
        // Detailed help for a specific command
        let helpMessage = `Command: ${commandPrefix}${command.name}\n`;
        helpMessage += `Description: ${command.description || 'No description available'}\n`;
        helpMessage += `Usage: ${command.usage || commandPrefix + command.name}\n`;
        helpMessage += `Cooldown: ${command.cooldown || 0} second(s)`;
        
        await bot.sendMessage(helpMessage);
      } else {
        await bot.sendMessage(`@${user.name}, I couldn't find a command called "${args[0]}"`);
      }
      return;
    }
    
    // General help - list all commands
    let helpMessage = `Available commands (use ${commandPrefix}help [command] for details):\n\n`;
    
    commands.forEach(command => {
      helpMessage += `${commandPrefix}${command.name} - ${command.description || 'No description'}\n`;
    });
    
    await bot.sendMessage(helpMessage);
  }
};

module.exports = helpCommand; 