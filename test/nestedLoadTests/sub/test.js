"use strict";

module.exports = bot => {
  bot.command('test')
    .action(a => {
      bot.send(null, 'test');
    });
};