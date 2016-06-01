"use strict";
const bot = require('../index.js');
const Path = require('path');
const readline = require('readline');

bot
  .load(Path.resolve(__dirname, 'os'))
  .setSend(function(metadata, text) {
    console.log(text);
  });
bot
  .command('*', {noHelp: true})
  .action(meta => bot.send(null, 'command not found'))
bot
  .command('exit')
  .alias('quit')
  .description('Exit program')
  .action(function() {
    process.exit(0);
  });

const rl = readline.createInterface(process.stdin, process.stdout);

let meta = {
  currDir: __dirname
}

let prompt= meta => {
  rl.setPrompt(Path.basename(meta.currDir) + "> ");
  rl.prompt();
}

prompt(meta);
rl.on('line', (cmd) => {
  bot.parse(cmd, meta);
  prompt(meta);
}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});