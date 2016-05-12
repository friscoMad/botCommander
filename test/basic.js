"use strict";
const BotCommand = require('../index.js').BotCommand,
	should = require('should');

const testMetadata = {
	test: 1,
	test2: 'test3'
};

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
describe('prefix', function() {
	describe('#basic', function() {
		it("shouldn't call the cb when there is no prefix", function() {
			const bot = new BotCommand();
			bot
				.prefix('!')
				.command('test')
				.action(() => {
					throw new Error("Should not be called");
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
			const bot = new BotCommand();
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
			const bot = new BotCommand();
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
describe('parsing', function() {
	let calledCount = 0,
		output = '';
	let countCalls = function() {
		calledCount++;
	}
	let send = function(meta, msg) {
		output += msg + "\n";
	}
	beforeEach(function() {
		calledCount = 0;
		output = "";
	});
	describe('#output', function() {
		it("should call the send function when errors", function(done) {
			const bot = new BotCommand();
			bot.setSend(done);
			bot.command('test <required>')
				.action(countCalls);
			bot.parse('test');
		});
		it("should work even if defined after the command", function(done) {
			const bot = new BotCommand();
			bot.command('test <required>')
				.action(countCalls);
			bot.setSend(done);
			bot.parse('test');
		});
		it("should honor showHelpOnError", function(done) {
			const bot = new BotCommand();
			bot.showHelpOnError(false);
			let cmd = bot.command('test <required>')
				.action(countCalls);
			bot.setSend((meta, msg) => {
				(msg.indexOf(cmd.help())).should.be.exactly(-1);
				done();
			});
			bot.parse('test');
		});
		it("should be able to reassign send functions", function(done) {
			const bot = new BotCommand();
			let cmd = bot.command('test <required>')
				.action(countCalls);
			bot.setSend(a => {
				throw new Error("This shouldn't be called");
			});
			cmd.setSend(done);
			bot.parse('test');
		});
		it("should be able to reassign send functions2", function(done) {
			const bot = new BotCommand();
			let cmd = bot.command('test <required>')
				.action(countCalls)
				.setSend(a => {
					throw new Error("This shouldn't be called");
				});
			bot.setSend(done);
			bot.parse('test');
		});
		it("should pass metadata", function(done) {
			const bot = new BotCommand();
			let meta
			let cmd = bot.command('test <required>')
				.action(countCalls)
				.setSend(a => {
					a.should.be.equal(testMetadata);
					done();
				});
			bot.parse('test', testMetadata);
		});
	});
	describe('#basic commands', function() {
		it("should call the command if matches", function(done) {
			const bot = new BotCommand();
			bot
				.command('test')
				.action(done);
			bot.parse('test');
		});
		it("shouldn't print anything or call any command if doesn't match", function() {
			const bot = new BotCommand();
			bot.setSend(countCalls);
			bot
				.command('test')
				.action(countCalls);
			bot
				.command('test2')
				.action(countCalls);
			bot.parse('test3');
			bot.parse('!test');
			bot.parse('test4 test test2');
			(calledCount).should.be.exactly(0);
		});
		it("should pass metadata to the command", function(done) {
			const bot = new BotCommand();
			bot
				.command('test')
				.action(meta => {
					meta.should.be.exactly(testMetadata);
					done();
				});
			bot.parse('test', testMetadata);
		});
	});
	describe('#arguments', function() {
		it("should pass arguments to the command", function(done) {
			const bot = new BotCommand();
			bot
				.command('test <required> [opt1] [opt2]')
				.action((meta, required, opt1, opt2) => {
					required.should.be.exactly("required");
					opt1.should.be.exactly("opt1");
					opt2.should.be.exactly("opt2");
					done();
				});
			bot.parse('test required opt1 opt2');
		});
		it("should only pass arguments defined", function(done) {
			const bot = new BotCommand();
			bot
				.command('test <required> [opt1] [opt2]')
				.action((meta, required, opt1, opt2) => {
					required.should.be.exactly("required");
					should.not.exist(opt1);
					should.not.exist(opt2);
					done();
				});
			bot.parse('test required');
		});
		it("should only pass arguments defined 2", function(done) {
			const bot = new BotCommand();
			bot
				.command('test <required> [opt1] [opt2]')
				.action((meta, required, opt1, opt2) => {
					required.should.be.exactly("required");
					opt1.should.be.exactly("opt1");
					should.not.exist(opt2);
					done();
				});
			bot.parse('test required opt1');
		});
		it("should print help when a required argument is missing", function() {
			const bot = new BotCommand();
			bot.setSend(send);
			let cmd = bot
				.command('test <required> [opt1] [opt2]')
				.action(countCalls);
			bot.parse('test');
			calledCount.should.be.exactly(0);
			(output.indexOf('error: missing required argument required')).should.be.above(0);
			(output.indexOf(cmd.help())).should.be.above(0);
		});
		it("should allow variadic arguments", function(done) {
			const bot = new BotCommand();
			let args = ['arg1', 'arg2', 'arg3'];
			bot
				.command('test [args...]')
				.action((meta, args2) => {
					args2.forEach((arg, index) => {
						arg.should.be.equal(args[index]);
					});
					done();
				});
			bot.parse('test '+args.join(' '));
		});
		it("should allow variadic arguments with required arguments", function(done) {
			const bot = new BotCommand();
			let args = ['arg1', 'arg2', 'arg3'];
			bot
				.command('test <required> [args...]')
				.action((meta, required,  args2) => {
					required.should.be.equal('required');
					args2.forEach((arg, index) => {
						arg.should.be.equal(args[index]);
					});
					done();
				});
			bot.parse('test required '+args.join(' '));
		});
		it("should allow variadic arguments with optional arguments", function(done) {
			const bot = new BotCommand();
			let args = ['arg1', 'arg2', 'arg3'];
			bot
				.command('test [optional] [args...]')
				.action((meta, optional,  args2) => {
					optional.should.be.equal('optional');
					args2.forEach((arg, index) => {
						arg.should.be.equal(args[index]);
					});
					done();
				});
			bot.parse('test optional '+args.join(' '));
		});
		it("should allow variadic arguments to be empty", function(done) {
			const bot = new BotCommand();
			bot
				.command('test [args...]')
				.action((meta, args2) => {
					(args2.length).should.be.empty;
					done();
				});
			bot.parse('test');
		});
		it("should not allow variadic arguments not being the last one", function() {
			const bot = new BotCommand();
			(function() {
				bot.command('test [args...] <required>');
			}).should.throw('error: variadic arguments must be last args');
		});
	});
	describe('#options', function() {
		it("should print help on unknow options", function() {
			const bot = new BotCommand();
			bot.setSend(send);
			let cmd = bot
				.command('test')
				.action(countCalls);
			bot.parse('test -f');
			calledCount.should.be.exactly(0);
			(output.indexOf('error: unknown option -f')).should.be.above(0);
			(output.indexOf(cmd.help())).should.be.above(0);
		});
		it("should honor allowUnknownOptions", function(done) {
			const bot = new BotCommand();
			bot.setSend(send);
			let cmd = bot
				.command('test')
				.allowUnknownOption()
				.action(done);
			bot.parse('test -f');
		});
	});
});