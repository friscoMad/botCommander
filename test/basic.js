"use strict";
const BotCommand = require('../index.js').BotCommand,
	should = require('should');


describe('prefix', function() {
	describe('#basic', function() {
		it("shouldn't call the cb when there is no prefix", function() {
			const bot = new BotCommand();
			bot
				.prefix('!')
				.command('test')
				.action(() => {
					throw "Should not be called";
				});
			bot.parse("test");
			bot.parse("test!");
			bot.parse("tes!t");
			bot.parse("test !test");
			bot.parse("test test !");
			bot.parse("test ! test");
		});
		it("should call the function if there is no prefix set", function(done) {
			const bot = new BotCommand();
			bot
				.command('test')
				.action(done);
			bot.parse("test");
		});
	});
	describe('#multiple prefixes', function() {
		it("could use any of the defined prefixes", function() {
			let count = 0;
			const bot = new BotCommand()
			bot
				.prefix(['!', '@', '$'])
				.command('test')
				.action(a => {
					count++;
				});
			bot.parse("!test");
			bot.parse("@test");
			bot.parse("$test");
			bot.parse("#test");
			bot.parse("/test");
			(count).should.be.exactly(3);
		});
		it("should treat a string as long prefix", function() {
			let count = 0;
			const bot = new BotCommand()
			bot
				.prefix("!@$")
				.command('test')
				.action(a => {
					count++;
				});
			bot.parse("!test");
			bot.parse("@test");
			bot.parse("$test");
			bot.parse("#test");
			bot.parse("/test");
			bot.parse("!@$test");
			(count).should.be.exactly(1);
		});
	});
});

describe('usage', function() {
	it("should print the description", function() {
		const bot = new BotCommand()
		const description = 'test command description';
		bot
			.command('test')
			.description(description);
		(bot.help().indexOf(description)).should.be.above(0);
	});
	it("should show commands", function() {
		const bot = new BotCommand()
		const commands = ['test1', 'test2 [option] [option]', 'test3 <option>', 'test4 <option> [option]', 'test5 <option> [options...]'];
		commands.forEach(cmd => bot.command(cmd));
		const help = bot.help();
		commands.forEach(cmd => {
			(help.indexOf(cmd)).should.be.above(0);
		});
	});
	it("should show command alias and name", function() {
		const bot = new BotCommand()
		bot
			.command('test')
			.alias('test2');
		(bot.help().indexOf('test|test2')).should.be.above(0);
	});
	it("should show arguments", function() {
		const bot = new BotCommand()
		const command = 'test <param1> <param2> [param3]';
		bot
			.command(command);
		(bot.help().indexOf(command)).should.be.above(0);
	});
	it("should show options", function() {
		const bot = new BotCommand()
		const options = ['-s --size <size>', '-d --drink [drink]', '-p', '--test', '-o --option', '-N --no-test'];
		options.forEach(opt => bot.option(opt));
		const help = bot.help();
		options.forEach(opt => {
			(help.indexOf(opt)).should.be.above(0);
		});
	});
	it("should show option description", function() {
		const bot = new BotCommand()
		const desc = 'option description';
		bot.option('-o --option', desc);
		bot.help().indexOf(desc).should.be.above(0);
	});
	it("should always show help option", function() {
		const bot = new BotCommand()
		bot.help().indexOf('-h, --help').should.be.above(0);
	});
	it("should show help command if there is a command", function() {
		const bot = new BotCommand()
		bot.command('test');
		bot.help().indexOf('help [cmd]').should.be.above(0);
		bot.help().indexOf('display help for [cmd]').should.be.above(0);
	});
	it("should not show help command if there is no command", function() {
		const bot = new BotCommand()
		bot.help().indexOf('help [cmd]').should.be.equal(-1);
		bot.help().indexOf('display help for [cmd]').should.be.equal(-1);
	});
	it("should not show subcommands", function() {
		const bot = new BotCommand()
		const test = bot.command('test');
		test.command('sub1');
		test.command('sub2');
		bot.help().indexOf('test').should.be.above(0);
		bot.help().indexOf('sub1').should.be.equal(-1);
		bot.help().indexOf('sub2').should.be.equal(-1);
	});
	it("should print the same that is returned", function(done) {
		const bot = new BotCommand();
		bot.setSend((meta, msg) => {
			msg.should.be.equal(bot.help());
			done();
		});
		bot
			.command('pizza')
			.alias('order')
			.option('-s --size <size>', 'Pizza size')
			.option('-d --drink [drink]', 'Drink')
			.description('Order your pizza')
		bot.parse('help');
	});
});