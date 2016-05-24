module.exports = bot => {
  bot.command('test2')
    .action(a => {
      bot.send(null, 'test2');
    });
};