const fs = require('fs');
const path = require('path');

/**
 * Pickuplines command - Responds with a random Manglish pickup line
 */
const pickupLinesCommand = {
  name: 'pickuplines',
  description: 'Shows a random Manglish pickup line',
  usage: '!pickuplines',
  cooldown: 3, // Cooldown in seconds
  
  /**
   * Execute the command
   * @param {Array} args - Command arguments
   * @param {Object} context - Command context
   * @param {Object} context.user - User who triggered the command
   * @param {Object} context.bot - Bot instance
   */
  async execute(args, context) {
    const { user, bot } = context;
    
    try {
      // Path to the pickup lines file
      const filePath = path.join(__dirname, '../data/commands/pickuplines.txt');
      
      // Read the file
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Split by lines and filter out empty lines
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        await bot.sendMessage(`Sorry @${user.name}, I couldn't find any pickup lines!`);
        return;
      }
      
      // Select a random line
      const randomIndex = Math.floor(Math.random() * lines.length);
      const randomLine = lines[randomIndex];
      
      // Send the message
      await bot.sendMessage(`@${user.name}, here's a pickup line: ${randomLine}`);
    } catch (error) {
      console.error('Error in pickup lines command:', error);
      await bot.sendMessage(`Sorry @${user.name}, there was an error getting a pickup line.`);
    }
  }
};

module.exports = pickupLinesCommand; 