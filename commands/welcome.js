/**
 * Automatically welcomes first-time chatters to the stream
 */
const welcomedUsers = new Set(); // Track users who have been welcomed

module.exports = {
  name: '_welcome', // Underscore prefix indicates it's an internal command
  description: 'Automatically welcomes new users to the stream',
  usage: '[Automatic]',
  isVisible: false, // Don't show in help command
  
  /**
   * Execute the command
   * @param {Array} args - Command arguments
   * @param {Object} context - Command context
   */
  execute: async function(args, context) {
    const { user, bot, message } = context;
    
    // Check if this is a first-time chatter
    if (user && user.messageCount === 1 && !welcomedUsers.has(user.id)) {
      // Add user to welcomed set to prevent duplicate welcomes
      welcomedUsers.add(user.id);
      
      // Wait a short delay before sending welcome (appears more natural)
      setTimeout(async () => {
        await bot.sendMessage(`Heyy ${user.name} welcome to the stream!`);
      }, 1000);
    }
  }
}; 