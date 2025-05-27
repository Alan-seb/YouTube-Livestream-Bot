const fs = require('fs');
const path = require('path');

/**
 * FlirtWith command - Sends a flirt line to a specific user
 */
const flirtWithCommand = {
  name: 'flirtwith',
  description: 'Send a Manglish flirt line to a specific user',
  usage: '!flirtwith [username]',
  cooldown: 10, // Higher cooldown to prevent spam
  
  /**
   * Execute the command
   * @param {Array} args - Command arguments
   * @param {Object} context - Command context
   * @param {Object} context.user - User who triggered the command
   * @param {Object} context.bot - Bot instance
   */
  async execute(args, context) {
    const { user, bot } = context;
    
    // Check if a target username was provided
    if (args.length === 0) {
      await bot.sendMessage(`@${user.name}, please specify who you want to flirt with! Usage: !flirtwith [username]`);
      return;
    }
    
    // Get the target username
    const targetUser = args.join(' ');
    
    try {
      // Get flirt lines from both files to have more variety
      const flirtLinesPath = path.join(__dirname, '../data/commands/flirtlines.txt');
      const pickupLinesPath = path.join(__dirname, '../data/commands/pickuplines.txt');
      
      // Read and combine both files
      const flirtContent = fs.readFileSync(flirtLinesPath, 'utf8');
      let pickupContent = '';
      
      try {
        pickupContent = fs.readFileSync(pickupLinesPath, 'utf8');
      } catch (error) {
        // If pickup lines file can't be read, continue with just flirt lines
        console.error('Error reading pickup lines file:', error);
      }
      
      // Split and filter both content types
      const flirtLines = flirtContent.split('\n').filter(line => line.trim() !== '');
      const pickupLines = pickupContent ? pickupContent.split('\n').filter(line => line.trim() !== '') : [];
      
      // Combine lines, giving preference to flirt lines (70% chance)
      const useFlirtLine = Math.random() < 0.7 || pickupLines.length === 0;
      const lines = useFlirtLine ? flirtLines : pickupLines;
      
      if (lines.length === 0) {
        await bot.sendMessage(`Sorry @${user.name}, I couldn't find any flirt lines!`);
        return;
      }
      
      // Select a random line
      const randomIndex = Math.floor(Math.random() * lines.length);
      const randomLine = lines[randomIndex];
      
      // Send the message, targeting the specified user
      await bot.sendMessage(`@${targetUser}, ${user.name} wants to tell you: ${randomLine}`);
    } catch (error) {
      console.error('Error in flirtwith command:', error);
      await bot.sendMessage(`Sorry @${user.name}, there was an error sending your flirt.`);
    }
  }
};

module.exports = flirtWithCommand; 