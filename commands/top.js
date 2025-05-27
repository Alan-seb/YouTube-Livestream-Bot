/**
 * Top command - Shows the top users by points
 */
const topCommand = {
  name: 'top',
  description: 'Shows the top users by points',
  usage: '!top [number]',
  cooldown: 10, // Cooldown in seconds
  
  /**
   * Execute the command
   * @param {Array} args - Command arguments
   * @param {Object} context - Command context
   * @param {Object} context.user - User who triggered the command
   * @param {Object} context.bot - Bot instance
   * @param {Object} context.userManager - User manager instance
   */
  async execute(args, context) {
    const { bot, userManager } = context;
    
    // Default to showing top 5 users, but allow customization
    let limit = 5;
    
    if (args.length > 0 && !isNaN(args[0])) {
      limit = Math.min(Math.max(parseInt(args[0], 10), 1), 10); // Between 1 and 10
    }
    
    const topUsers = userManager.getTopUsers(limit);
    
    if (topUsers.length === 0) {
      await bot.sendMessage('No users with points yet!');
      return;
    }
    
    let message = `Top ${topUsers.length} users by points:\n`;
    
    topUsers.forEach((user, index) => {
      message += `${index + 1}. ${user.name}: ${user.points} points\n`;
    });
    
    await bot.sendMessage(message);
  }
};

module.exports = topCommand; 