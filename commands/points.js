/**
 * Points command - Shows a user their current points or someone else's points
 */
const pointsCommand = {
  name: 'points',
  description: 'Check your points or another user\'s points',
  usage: '!points [username]',
  cooldown: 5, // Cooldown in seconds
  
  /**
   * Execute the command
   * @param {Array} args - Command arguments
   * @param {Object} context - Command context
   * @param {Object} context.user - User who triggered the command
   * @param {Object} context.bot - Bot instance
   * @param {Object} context.userManager - User manager instance
   */
  async execute(args, context) {
    const { user, bot, userManager } = context;
    
    // If no username is provided, show the user's own points
    if (args.length === 0) {
      await bot.sendMessage(`@${user.name} you have ${user.points} points!`);
      return;
    }
    
    // If a username is provided, try to find that user
    const targetUsername = args.join(' ');
    
    // Find the user by name (this could be more efficient with a name-based lookup)
    const allUsers = [...userManager.users.values()];
    const targetUser = allUsers.find(u => 
      u.name.toLowerCase() === targetUsername.toLowerCase()
    );
    
    if (targetUser) {
      await bot.sendMessage(`@${targetUser.name} has ${targetUser.points} points!`);
    } else {
      await bot.sendMessage(`User "${targetUsername}" not found.`);
    }
  }
};

module.exports = pointsCommand; 