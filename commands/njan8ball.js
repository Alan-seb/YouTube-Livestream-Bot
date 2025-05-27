/**
 * Njan8ball command - A Manglish version of the magic 8-ball that responds to yes/no questions
 */
const njan8ballCommand = {
  name: 'njan8ball',
  description: 'Ask the Manglish magic 8-ball a yes/no question',
  usage: '!njan8ball [your question]',
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
    
    // If no question was asked
    if (args.length === 0) {
      await bot.sendMessage(`@${user.name}, oru question chodicho! Appo njan oru answer tharaam.`);
      return;
    }
    
    // The possible responses (Manglish)
    const responses = [
      "Theerchayayum, 100%!",
      "Athinu oru doubt-um illa.",
      "Athe, pakka sure.",
      "Enikku thonnunnu angane thanne aavum.",
      "Njan vicharikkunnu, yes.",
      "Athokke nadakkum, worry cheyyanda.",
      "Sure aayum, no doubt!",
      "Ente answer is yes.",
      
      "Ippo clear alla, pinne nokkam.",
      "Enikku ariyilla, pinne chodicho.",
      "Concentrate cheythu veendum chodicho.",
      "Ippo parayan patilla.",
      "Predict cheyyan patunnilla ippo.",
      "Ippol parayan pattilla, naale vaa.",
      
      "Athu nadakkilla ennu thonnunnu.",
      "Ente answer is no.",
      "Athrakku nalla idea alla.",
      "Doubtful aanu situation.",
      "Athinu chance kuravanu.",
      "Theerchayayum illa!",
      "Athokke verum swapnam aanu.",
      "Athinu 0% chance undu, sorry!"
    ];
    
    // Get a random response
    const randomIndex = Math.floor(Math.random() * responses.length);
    const response = responses[randomIndex];
    
    // Get the question text
    const question = args.join(' ');
    
    // Send the message
    await bot.sendMessage(`@${user.name} chodichu: "${question}" - Njan8ball parayunnu: ${response}`);
  }
};

module.exports = njan8ballCommand; 