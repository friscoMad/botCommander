"use strict";

const Path = require('path');

module.exports = bot => {
  bot.command('cd [dir]')
    .description('change the shell working directory')
    .action((meta, dir) => {
      if (dir) {
        meta.currDir = Path.resolve(meta.currDir, dir);
      }
    });
};