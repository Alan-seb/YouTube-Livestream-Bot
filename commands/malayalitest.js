/**
 * MalayaliTest command - A fun game to test if someone is a true Malayali
 */
const malayaliTestCommand = {
  name: 'malayalitest',
  description: 'Test if you or someone else is a true Malayali',
  usage: '!malayalitest [username]',
  cooldown: 10, // Cooldown in seconds
  
  /**
   * Execute the command
   * @param {Array} args - Command arguments
   * @param {Object} context - Command context
   * @param {Object} context.user - User who triggered the command
   * @param {Object} context.bot - Bot instance
   */
  async execute(args, context) {
    const { user, bot } = context;
    
    // Determine target user (self or someone else)
    let targetUser = user.name;
    if (args.length > 0) {
      targetUser = args.join(' ');
    }
    
    // List of Malayali test questions
    const questions = [
      "Knows what 'Pani pali' means",
      "Can survive on just kappa and meen curry",
      "Says 'Naatil evideya?' to strangers",
      "Adds 'mwone' or 'mwole' to every sentence",
      "Has a bottle of coconut oil in the bathroom",
      "Has asked 'Kalyanam aayi?' to someone younger",
      "Can dance to 'Jimmiki Kammal' without practice",
      "Has given 'kashu' instead of a gift for weddings",
      "Adds 'alle' to the end of every question, alle?",
      "Uses 'Adipoli' to describe anything awesome",
      "Knows at least five porotta varieties by name",
      "Can recognize Mohanlal from just his voice",
      "Starts stories with 'Oru divasam...'",
      "Calls every snack 'palaharam'",
      "Uses 'Seri' for OK, fine, right, and agreement",
      "Identifies Thrissur Pooram from just one photo",
      "Knows at least three types of payasam"
    ];
    
    // Randomly choose 5 tests
    const selectedTests = [];
    const usedIndices = new Set();
    
    while (selectedTests.length < 5 && usedIndices.size < questions.length) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      
      if (!usedIndices.has(randomIndex)) {
        selectedTests.push(questions[randomIndex]);
        usedIndices.add(randomIndex);
      }
    }
    
    // Generate a random score (fun feature)
    const score = Math.floor(Math.random() * 101);
    
    // Determine result based on score
    let result;
    if (score < 30) {
      result = "Looks like you need to watch more Malayalam movies!";
    } else if (score < 60) {
      result = "You've got some Malayali spirit, but you're not quite there yet.";
    } else if (score < 90) {
      result = "Nee pakka Malayali thanne! Just missing a few points.";
    } else {
      result = "100% authentic Malayali confirmed! Full Malayali spirit!";
    }
    
    // Build message
    let message = `Malayali Test for ${targetUser}:\n\n`;
    
    // Add test results
    selectedTests.forEach((test, index) => {
      const passed = Math.random() > 0.3; // 70% chance to pass each test
      message += `${index + 1}. ${test}: ${passed ? '✅' : '❌'}\n`;
    });
    
    message += `\nMalayali Score: ${score}%\n`;
    message += `Verdict: ${result}`;
    
    // Send the message
    await bot.sendMessage(message);
  }
};

module.exports = malayaliTestCommand; 