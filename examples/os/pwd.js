"use strict";

const Path = require('path');

module.exports = bot => {
  bot.command('pwd')
    .description('print name of current/working directory')
    .action((meta) => {
      bot.send(meta, meta.currDir);
    });
};