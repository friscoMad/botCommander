"use strict";

const Path = require('path');

module.exports = bot => {
  bot.command('sub')
  .load(Path.resolve(__dirname, 'sub'));
};