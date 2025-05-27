const fs = require('fs');
const path = require('path');

/**
 * Addline command - Allows users to add their own pickup lines to the collection
 */
const addLineCommand = {
  name: 'addline',
  description: 'Add your own pickup line to the collection',
  usage: '!addline [your pickup line]',
  cooldown: 30, // Higher cooldown to prevent spam
  
  /**
   * Execute the command
   * @param {Array} args - Command arguments
   * @param {Object} context - Command context
   * @param {Object} context.user - User who triggered the command
   * @param {Object} context.bot - Bot instance
   */
  async execute(args, context) {
    const { user, bot } = context;
    
    // Check if user provided a pickup line
    if (args.length === 0) {
      await bot.sendMessage(`@${user.name}, please provide a pickup line to add! Usage: !addline [your pickup line]`);
      return;
    }
    
    // Get the pickup line text
    const pickupLine = args.join(' ');
    
    // Validate input length (avoid extremely long messages)
    if (pickupLine.length < 5) {
      await bot.sendMessage(`@${user.name}, your pickup line is too short!`);
      return;
    }
    
    if (pickupLine.length > 200) {
      await bot.sendMessage(`@${user.name}, your pickup line is too long! Please keep it under 200 characters.`);
      return;
    }
    
    try {
      // Path to the pickup lines file
      const filePath = path.join(__dirname, '../data/commands/pickuplines.txt');
      
      // Append the new pickup line to the file
      fs.appendFileSync(filePath, `\n${pickupLine}`);
      
      // Send confirmation message
      await bot.sendMessage(`@${user.name}, your pickup line has been added to my collection! Try using !pickuplines to see if it comes up.`);
    } catch (error) {
      console.error('Error in addline command:', error);
      await bot.sendMessage(`Sorry @${user.name}, there was an error adding your pickup line.`);
    }
  }
};

module.exports = addLineCommand; 