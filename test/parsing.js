"use strict";
const BotCommand = require('../index.js').BotCommand,
  should = require('should');

const testMetadata = {
  test: 1,
  test2: 'test3'
};


describe('parsing', function() {
	let calledCount = 0,
		output = '';
	let countCalls = function() {
		calledCount++;
	};
	let send = function(meta, msg) {
		output += msg + "\n";
	};
	let sendError = function(meta, msg) {
		throw new Error('Should not be called \n' + msg);
	};
	let basicBot = function() {
		const bot = new BotCommand();
		return bot.setSend(sendError)
			.allowUnknownOption(false);
	};
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
		it("should honor showHelpOnEmpty", function(done) {
			const bot = new BotCommand();
			bot.showHelpOnEmpty(true)
				.command('test')
				.setSend((meta, msg) => {
					msg.should.be.eql(bot.help());
					done();
				});
			bot.parse('');
		});
		it("should be able to reassign send functions", function(done) {
			const bot = new BotCommand();
			let cmd = bot.command('test <required>')
				.action(countCalls);
			bot.setSend(sendError);
			cmd.setSend(done);
			bot.parse('test');
		});
		it("should be able to reassign send functions2", function(done) {
			const bot = new BotCommand();
			let cmd = bot.command('test <required>')
				.action(countCalls)
				.setSend(sendError);
			bot.setSend(done);
			bot.parse('test');
		});
		it("should pass metadata", function(done) {
			const bot = new BotCommand();
			let cmd = bot.command('test <required>')
				.action(countCalls)
				.setSend(a => {
					a.should.be.equal(testMetadata);
					done();
				});
			bot.parse('test', testMetadata);
		});
		it("should not call send if null or empty", function(done) {
			const bot = new BotCommand();
			let cmd = bot.command('test')
				.action(meta => {
					bot.send(meta, null);
					bot.send(meta);
					bot.send(meta, '');
					done();
				})
				.setSend(sendError);
			bot.parse('test', testMetadata);
		});
		it("should return the value the send function returns", function(done) {
			const bot = new BotCommand();
			let cmd = bot.command('test')
				.action(meta => {
					let ret = bot.send(meta, "test");
					ret.should.be.equal("test"); 
					ret = bot.send(meta);
					should.not.exist(ret);
					done();
				})
				.setSend((meta, a) => a);
			bot.parse('test', testMetadata);
		});
		it("should return the value the send function returns 2", function(done) {
			const bot = new BotCommand();
			let cmd = bot.command('test')
				.action(meta => {
					let ret = bot.send(meta, "1");
					ret.should.be.equal("11");
					ret = bot.send(meta, "test");
					ret.should.be.equal("test1");
					done();
				})
				.setSend((meta, a) => a + "1");
			bot.parse('test', testMetadata);
		});
	});
	describe('#basic commands', function() {
		it("should call the command if matches", function(done) {
			const bot = basicBot();
			bot
				.command('test')
				.action(done);
			bot.parse('test');
		});
		it("should call the command if matches with alias", function(done) {
			const bot = basicBot();
			bot
				.command('test')
				.alias('alias')
				.action(countCalls);
			bot.parse('alias');
			bot.parse('test');
			(calledCount).should.be.eql(2);
			done();
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
			const bot = basicBot();
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
			const bot = basicBot();
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
		it("should pass arguments to the command (argument way)", function(done) {
			const bot = basicBot();
			bot
				.command('test')
				.arguments('<required> [opt1] [opt2]')
				.action((meta, required, opt1, opt2) => {
					required.should.be.exactly("required");
					opt1.should.be.exactly("opt1");
					opt2.should.be.exactly("opt2");
					done();
				});
			bot.parse('test required opt1 opt2');
		});
		it("should only pass arguments defined", function(done) {
			const bot = basicBot();
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
			const bot = basicBot();
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
			const bot = basicBot();
			let args = ['arg1', 'arg2', 'arg3'];
			bot
				.command('test [args...]')
				.action((meta, args2) => {
					args2.forEach((arg, index) => {
						arg.should.be.equal(args[index]);
					});
					done();
				});
			bot.parse('test ' + args.join(' '));
		});
		it("should allow variadic arguments with required arguments", function(done) {
			const bot = basicBot();
			let args = ['arg1', 'arg2', 'arg3'];
			bot
				.command('test <required> [args...]')
				.action((meta, required, args2) => {
					required.should.be.equal('required');
					args2.forEach((arg, index) => {
						arg.should.be.equal(args[index]);
					});
					done();
				});
			bot.parse('test required ' + args.join(' '));
		});
		it("should allow variadic arguments with optional arguments", function(done) {
			const bot = basicBot();
			let args = ['arg1', 'arg2', 'arg3'];
			bot
				.command('test [optional] [args...]')
				.action((meta, optional, args2) => {
					optional.should.be.equal('optional');
					args2.forEach((arg, index) => {
						arg.should.be.equal(args[index]);
					});
					done();
				});
			bot.parse('test optional ' + args.join(' '));
		});
		it("should allow variadic arguments to be empty", function(done) {
			const bot = basicBot();
			bot
				.command('test [args...]')
				.action((meta, args2) => {
					should.exist(args2);
					(args2.length).should.be.eql(0);
					done();
				});
			bot.parse('test');
		});
		it("should not allow variadic arguments not being the last one", function() {
			const bot = basicBot();
			(function() {
				bot.command('test [args...] <required>');
			}).should.throw('error: variadic arguments must be last args');
		});
		it("should allow quotes for spaces containing arguments", function(done) {
			const bot = basicBot();
			bot.command('test <arg> [optional]')
			.action((meta, arg, optional) => {
				should.not.exist(optional);
				arg.should.be.eql('test test');
				done();
			});
			bot.parse('test "test test"');
		});
		it("should allow quotes for spaces containing arguments (single)", function(done) {
			const bot = basicBot();
			bot.command('test <arg> [optional]')
			.action((meta, arg, optional) => {
				should.not.exist(optional);
				arg.should.be.eql('test test');
				done();
			});
			bot.parse('test \'test test\'');
		});
		it("should parse arguments even if prefixed if -- is in front of them", function(done) {
			const bot = basicBot();
			bot.command('test <arg> [optional]')
			.action((meta, arg, optional) => {
				arg.should.be.eql('-test');
				optional.should.be.eql('--test-test');
				done();
			});
			bot.parse('test -- -test -- --test-test');
		});
		it("should parse in lower case if directed", function() {
			const bot = basicBot();
			bot.command('test')
			.lowerCase(true)
			.action(countCalls);
			bot.parse('test');
			bot.parse('TEST');
			bot.parse('Test');
			bot.parse('tESt');
			(calledCount).should.be.eql(4);
		});
	});
	describe('#options', function() {
		describe('#general options', function() {
			let optionsBot = function(bot) {
				return bot
					.command('test')
					.option('-o --opt', 'option')
					.option('-v --verbose', 'verbose')
					.option('-e --exists', 'exists')
					.option('-a', 'apples')
					.option('-A --no-apples', "don't like apples");
			};
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
				const bot = basicBot();
				let cmd = bot
					.command('test')
					.allowUnknownOption()
					.action(done);
				bot.parse('test -f');
			});
			it("should pass defined options", function(done) {
				const bot = basicBot();
				let cmd = bot
					.command('test')
					.option('-o', 'option')
					.option('-e', 'option2')
					.action((meta, opts) => {
						opts.should.con;
						(opts.e).should.be.true();
						done();
					});
				bot.parse('test -o -e');
			});
			it("should pass defined options with long name if exists", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						(opts.opt).should.be.true();
						(opts.exists).should.be.true();
						done();
					});
				bot.parse('test -o -e');
			});
			it("should pass defined options if called with long name", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						(opts.opt).should.be.true();
						(opts.exists).should.be.true();
						done();
					});
				bot.parse('test --opt --exists');
			});
			it("should pass short options if combined", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						(opts.opt).should.be.true();
						(opts.exists).should.be.true();
						done();
					});
				bot.parse('test -oe');
			});
			it("should pass short options if combined2", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						(opts.opt).should.be.true();
						(opts.exists).should.be.true();
						(opts.a).should.be.true();
						done();
					});
				bot.parse('test -oe -a');
			});
			it("should be able to mix and match", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						(opts.opt).should.be.true();
						(opts.exists).should.be.true();
						(opts.verbose).should.be.true();
						done();
					});
				bot.parse('test -oe --verbose');
			});
			it("should work with negative options", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						(opts.apples).should.be.false();
						done();
					});
				bot.parse('test -A');
			});
			it("should work with negative options 2", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						(opts.apples).should.be.false();
						done();
					});
				bot.parse('test --no-apples');
			});
			it("should work with negative options 3", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						(opts.apples).should.be.true();
						done();
					});
				bot.parse('test');
			});
			it("should pass all undefined options", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						opts.should.have.property('opt');
						opts.should.have.property('exists');
						opts.should.have.property('verbose');
						should.not.exist(opts.opt);
						should.not.exist(opts.exists);
						should.not.exist(opts.verbose);
						should.not.exist(opts.A);
						(opts.apples).should.be.true();
						done();
					});
				bot.parse('test');
			});
			it("should pass arguments and opts even if argument is not defined", function(done) {
				const bot = basicBot();
				let cmd = bot
					.command('test [optional]')
					.option('-o', 'option')
					.option('-e', 'option2')
					.action((meta, optional, opts) => {
						should.not.exist(optional);
						(opts.o).should.be.true();
						(opts.e).should.be.true();
						done();
					});
				bot.parse('test -oe');
			});
			it("should camel case options names", function(done) {
				const bot = basicBot();
				let cmd = bot
					.command('test [optional]')
					.option('-o, -option-name', 'option')
					.option('-e -extra-large-name', 'option2')
					.action((meta, optional, opts) => {
						should.not.exist(optional);
						(opts.optionName).should.be.true();
						(opts.extraLargeName).should.be.true();
						done();
					});
				bot.parse('test -oe');
			});
		});
		describe('#options with values', function() {
			it("should pass arguments values", function(done) {
				const bot = basicBot();
				let cmd = bot
					.command('test')
					.option('-s [value]', 'option')
					.option('-l --large [value]', 'option2')
					.action((meta, opts) => {
						(opts.s).should.be.eql('val');
						(opts.large).should.be.eql('val2');
						done();
					});
				bot.parse('test -s val -l val2');
			});
			it("should pass arguments global values", function(done) {
				const bot = basicBot();
				let cmd = bot
					.option('-s [value]', 'option')
					.command('test')
					.action((meta, opts) => {
						(opts.s).should.be.eql('val');
						done();
					});
				bot.parse('test -s val');
			});
			it("should pass long arguments values using =", function(done) {
				const bot = basicBot();
				let cmd = bot
					.command('test')
					.option('-s [value]', 'option')
					.option('-l --large [value]', 'option2')
					.action((meta, opts) => {
						(opts.s).should.be.eql('val');
						(opts.large).should.be.eql('val2');
						done();
					});
				bot.parse('test -s val --large=val2');
			});
			it("should pass short arguments values using =", function(done) {
				const bot = basicBot();
				let cmd = bot
					.command('test')
					.option('-s [value]', 'option')
					.action((meta, opts) => {
						(opts.s).should.be.eql('val');
						done();
					});
				bot.parse('test -s=val');
			});
			it("should honor default values", function(done) {
				const bot = basicBot();
				let cmd = bot
					.command('test')
					.option('-s [value]', 'option', 'default')
					.action((meta, opts) => {
						(opts.s).should.be.eql('default');
						done();
					});
				bot.parse('test');
			});
			it("should not require required values if option not present", function(done) {
				const bot = basicBot();
				let cmd = bot
					.command('test')
					.option('-s <value>', 'option')
					.action((meta, opts) => {
						should.not.exist(opts.S);
						done();
					});
				bot.parse('test');
			});
			it("should require required values if option present", function() {
				const bot = basicBot();
				let cmd = bot
					.command('test')
					.option('-s <value>', 'option')
					.action(countCalls)
					.setSend(send);
				bot.parse('test -s');
				calledCount.should.be.eql(0);
				output.indexOf('error: option -s <value> argument missing');
			});
			it("should require required values if global option is present", function() {
				const bot = basicBot();
				let cmd = bot
					.option('-s <value>', 'option')
					.command('test')
					.action(countCalls)
					.setSend(send);
				bot.parse('test -s');
				calledCount.should.be.eql(0);
				output.indexOf('error: option -s <value> argument missing');
			});
			it("should require required values if option present even if there is a default value", function() {
				const bot = basicBot();
				let cmd = bot
					.command('test')
					.option('-s <value>', 'option', 'default')
					.action(countCalls)
					.setSend(send);
				bot.parse('test -s');
				calledCount.should.be.eql(0);
				output.indexOf('error: option -s <value> argument missing');
			});
			it("should clean options between parse calls", function() {
				const bot = basicBot();
				let cmd = bot.command('test')
					.option('-o --opt', 'option')
					.option('-v --verbose', 'verbose')
					.action((meta, opts) => {
						if (meta == 1) {
							(opts.opt).should.be.true();
							should.not.exists(opts.verbose);
						} else {
							(opts.verbose).should.be.true();
							should.not.exists(opts.opt);							
						}
					});
				bot.parse('test -o', 1);
				bot.parse('test -v', 2);
			});	
		});
		describe('#options with coercion', function() {
			let range = val => val.split('..').map(Number);
			let list = val => val.split(',');
			let collect = (val, memo) => {
				memo.push(val);
				return memo;
			};
			let increaseVerbosity = (v, total) => {
				return total + 1;
			};
			let optionsBot = function(bot) {
				return bot
					.command('test')
					.option('-i, --integer <n>', 'An integer argument', parseInt)
					.option('-f, --float <n>', 'A float argument', parseFloat)
					.option('-r, --range <a>..<b>', 'A range', range)
					.option('-l, --list <items>', 'A list', list)
					.option('-c, --collect [value]', 'A repeatable value', collect, [])
					.option('-v, --verbose', 'A value that can be increased', increaseVerbosity, 0);
			};
			it("should return integer", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						opts.integer.should.be.Number();
						opts.integer.should.be.eql(1);
						done();
					});
				bot.parse('test -i 1');
			});
			it("should return float", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						opts.float.should.be.Number();
						opts.float.should.be.eql(4.5);
						done();
					});
				bot.parse('test -f 4.5');
			});
			it("should return range", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						opts.range.should.be.Array();
						opts.range.should.be.eql([1, 3]);
						done();
					});
				bot.parse('test -r 1..3');
			});
			it("should return list", function(done) {
				const bot = basicBot();
				const list = ['opt1', 'opt2', 'opt3'];
				optionsBot(bot)
					.action((meta, opts) => {
						opts.list.should.be.Array();
						opts.list.forEach((value, index) => {
							value.should.be.eql(list[index]);
						});
						done();
					});
				bot.parse('test -l ' + list.join(','));
			});
			it("should return list of repetitions", function(done) {
				const bot = basicBot();
				const list = ['opt1', 'opt2', 'opt3'];
				optionsBot(bot)
					.action((meta, opts) => {
						opts.collect.should.be.Array();
						opts.collect.forEach((value, index) => {
							value.should.be.eql(list[index]);
						});
						done();
					});
				bot.parse('test -c ' + list.join(' -c '));
			});
			it("should count repetitions", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						opts.verbose.should.be.exactly(3);
						done();
					});
				bot.parse('test -vvv');
			});
		});
		describe('#options with regular expresion', function() {
			let optionsBot = function(bot) {
				return bot
					.command('test')
					.option('-s --size <size>', 'Pizza size', /^(large|medium|small)$/i, 'medium')
					.option('-d --drink [drink]', 'Drink', /^(coke|pepsi|izze)$/i);
			};
			it("should use regular expressions", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						opts.size.should.be.exactly('large');
						done();
					});
				bot.parse('test -s large');
			});
			it("should return default if not matches", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						opts.size.should.be.exactly('medium');
						done();
					});
				bot.parse('test -s test');
			});
			it("should return null if not matches and no default is defined", function(done) {
				const bot = basicBot();
				optionsBot(bot)
					.action((meta, opts) => {
						(opts.drink).should.be.true();
						done();
					});
				bot.parse('test -d');
			});
		});
	});
	describe('#subcommands', function() {
		let subcommandBot = function(bot) {
			return bot
				.command('test')
				.description('sub command test');
		};
		it("main help should only show top commands", function() {
			const bot = basicBot();
			const testCmd = subcommandBot(bot);
			testCmd
				.command('subcmd');
			bot.help().should.not.be.eql(testCmd.help());
			(bot.help().indexOf('subcmd')).should.be.eql(-1);
		});
		it("should show help if no subcommand is passed", function() {
			const bot = basicBot();
			const testCmd = subcommandBot(bot);
			testCmd
				.command('subcmd')
				.setSend(send);
			bot.parse('test');
			output.should.be.eql(testCmd.help() + "\n");
		});
		it("should show help if no subcommand is passed unless disabled", function() {
			const bot = basicBot();
			const testCmd = subcommandBot(bot);
			testCmd
				.showHelpOnEmpty(false)
				.command('subcmd');
			bot.parse('test');
		});
		it("should call subcommands", function(done) {
			const bot = basicBot();
			const testCmd = subcommandBot(bot);
			testCmd
				.command('subcmd')
				.action(done);
			bot.parse('test subcmd');
		});
	});
});