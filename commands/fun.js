const fs = require('fs');
const path = require('path');

/**
 * Fun command - Responds with a random fun message from any category
 */
const funCommand = {
  name: 'fun',
  description: 'Shows a random fun message (joke, proverb, pickup line, or flirt line)',
  usage: '!fun',
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
      // Define all the fun file types
      const fileTypes = [
        { name: 'joke', path: '../data/commands/jokes.txt', intro: "here's a joke" },
        { name: 'proverb', path: '../data/commands/proverbs.txt', intro: "here's some wisdom" },
        { name: 'pickup line', path: '../data/commands/pickuplines.txt', intro: "try this pickup line" },
        { name: 'flirt line', path: '../data/commands/flirtlines.txt', intro: "try this subtle flirt" }
      ];
      
      // Randomly select a file type
      const randomType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      
      // Path to the selected file
      const filePath = path.join(__dirname, randomType.path);
      
      // Read the file
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Split by lines and filter out empty lines
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        await bot.sendMessage(`Sorry @${user.name}, I couldn't find any ${randomType.name}s!`);
        return;
      }
      
      // Select a random line
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      
      // Send the message
      await bot.sendMessage(`@${user.name}, ${randomType.intro}: ${randomLine}`);
    } catch (error) {
      console.error('Error in fun command:', error);
      await bot.sendMessage(`Sorry @${user.name}, there was an error getting a fun message.`);
    }
  }
};

module.exports = funCommand; 