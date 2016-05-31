"use strict";
const bot = require('../index.js');

bot
	.setSend(function(metadata, text) {
		console.log(text);
	});

bot
	.command('copy <file> <dest>')
	.description('Copy file to dest')
	.action(function(metadata, file, dest, opts) {
		console.log(`Copying file ${file} to ${dest}`);
	});

bot
	.command('pizza')
	.option('-s --size <size>', 'Pizza size', /^(large|medium|small)$/i, 'medium')
	.option('-d --drink [drink]', 'Drink', /^(coke|pepsi|izze)$/i)
	.description('Order your pizza')
	.action(function(metadata, opts) {
		let order = `You ordered a ${opts.size} pizza`;
		if (opts.drink === true) {
			order += ' with a random drink';
		} else if (opts.drink) {
			order += ` with a cup of ${opts.drink}`;
		}
		console.log(order);
	});

bot
	.command('nohelp', {noHelp: true})
	.description('hidden command')
	.action(function(metadata, opts) {
		console.log('It works!!');
	});

const command = bot
	.command('sub <command>')
	.description('Subcomand');

command
	.command('echo <echo>')
	.description('echo command')
	.action(function(metadata, echo) {
		console.log(echo);
	});

command
	.command('hello [name]')
	.description('hello command')
	.action(function(metadata, name) {
		if (name) {
			console.log(`Hello ${name}`);
		} else {
			console.log('Hello world!');
		}
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
	bot.parse(cmd, {
		data: 1,
		texto: 'texto',
	});
	rl.prompt();
}).on('close', () => {
	console.log('Have a great day!');
	process.exit(0);
});