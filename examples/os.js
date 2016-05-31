"use strict";
const bot = require('../index.js');
const Path = require('path');

bot
  .load(Path.resolve(__dirname, 'os'))
  .setSend(function(metadata, text) {
    console.log(text);
  });
bot
  .command('exit')
  .alias('quit')
  .description('Exit program')
  .action(function() {
    process.exit(0);
  });
const readline = require('readline');

const rl = readline.createInterface(process.stdin, process.stdout);
rl.prompt();

rl.on('line', (cmd) => {
  bot.parse(cmd);
  rl.prompt();
}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});