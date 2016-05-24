module.exports = bot => {
  bot.command('test1')
    .action(a => {
      bot.send(null, 'test1');
    });
};