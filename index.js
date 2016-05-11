"use strict";

/**
 * Module dependencies.
 */

const EventEmitter = require('events').EventEmitter;
const util = require('util');

/**
 * Initialize a new `Option` with the given `flags` and `description`.
 *
 * @param {String} flags
 * @param {String} description
 * @api public
 */

function Option(flags, description) {
	this.flags = flags;
	this.required = ~flags.indexOf('<');
	this.optional = ~flags.indexOf('[');
	this.bool = !~flags.indexOf('-no-');
	flags = flags.split(/[ ,|]+/);
	if (flags.length > 1 && !/^[[<]/.test(flags[1])) this.short = flags.shift();
	this.long = flags.shift();
	this.description = description || '';
}

/**
 * Return option name.
 *
 * @return {String}
 * @api private
 */

Option.prototype.name = function() {
	return this.long
		.replace('--', '')
		.replace('no-', '');
};

/**
 * Initialize a new `BotCommand`.
 *
 * @param {String} name
 * @api public
 */

function BotCommand(name) {
	this.prefixes = null;
	this.sendMessage = null;
	this.commands = [];
	this.options = [];
	this._execs = {};
	this._allowUnknownOption = false;
	this._args = [];
	this._name = name || '';
	this._alias = null;
}

util.inherits(BotCommand, EventEmitter);


BotCommand.prototype.setSend = function(cb) {
	this.sendMessage = cb;
}

BotCommand.prototype.prefix = function(prefix) {
	if (typeof prefix === 'string') {
		this.prefixes = [prefix];
	} else {
		this.prefixes = prefix;
	}
	return this;
}

/**
 * Add command `name`.
 *
 * The `.action()` callback is invoked when the
 * command `name` is specified via __ARGV__,
 * and the remaining arguments are applied to the
 * function for access.
 *
 * When the `name` is "*" an un-matched command
 * will be passed as the first arg, followed by
 * the rest of __ARGV__ remaining.
 *
 * Examples:
 *
 *      program
 *        .version('0.0.1')
 *        .option('-C, --chdir <path>', 'change the working directory')
 *        .option('-c, --config <path>', 'set config path. defaults to ./deploy.conf')
 *        .option('-T, --no-tests', 'ignore test hook')
 *
 *      program
 *        .command('setup')
 *        .description('run remote setup commands')
 *        .action(function() {
 *          console.log('setup');
 *        });
 *
 *      program
 *        .command('exec <cmd>')
 *        .description('run the given remote command')
 *        .action(function(cmd) {
 *          console.log('exec "%s"', cmd);
 *        });
 *
 *      program
 *        .command('teardown <dir> [otherDirs...]')
 *        .description('run teardown commands')
 *        .action(function(dir, otherDirs) {
 *          console.log('dir "%s"', dir);
 *          if (otherDirs) {
 *            otherDirs.forEach(function (oDir) {
 *              console.log('dir "%s"', oDir);
 *            });
 *          }
 *        });
 *
 *      program
 *        .command('*')
 *        .description('deploy the given env')
 *        .action(function(env) {
 *          console.log('deploying "%s"', env);
 *        });
 *
 *      program.parse(process.argv);
 *
 * @param {String} name
 * @param {String} [desc] for git-style sub-commands
 * @return {Command} the new command
 * @api public
 */
BotCommand.prototype.command = function(name, opts) {
	opts = opts || {};
	var args = name.split(/ +/);

	//If there is at least one command always add and implicit help command
	if (this.commands.length === 0 && args[0] !== 'help') {
		// implicit command help
		this.addImplicitHelpCommand();
	}
	var cmd = new BotCommand(args.shift());
	cmd.setSend(this.sendMessage);

	cmd._noHelp = !!opts.noHelp;
	this.commands.push(cmd);
	cmd.parseExpectedArgs(args);
	cmd.parent = this;

	return cmd;
};

/**
 * Define argument syntax for the top-level command.
 *
 * @api public
 */

BotCommand.prototype.arguments = function(desc) {
	return this.parseExpectedArgs(desc.split(/ +/));
};

/**
 * Add an implicit `help [cmd]` subcommand
 * which invokes `--help` for the given command.
 *
 * @api private
 */

BotCommand.prototype.addImplicitHelpCommand = function() {
	this.command('help [cmd]')
		.description('display help for [cmd]');
};

/**
 * Parse expected `args`.
 *
 * For example `["[type]"]` becomes `[{ required: false, name: 'type' }]`.
 *
 * @param {Array} args
 * @return {Command} for chaining
 * @api public
 */

BotCommand.prototype.parseExpectedArgs = function(args) {
	if (!args.length) return;
	var self = this;
	args.forEach(function(arg) {
		var argDetails = {
			required: false,
			name: '',
			variadic: false
		};

		switch (arg[0]) {
			case '<':
				argDetails.required = true;
				argDetails.name = arg.slice(1, -1);
				break;
			case '[':
				argDetails.name = arg.slice(1, -1);
				break;
		}

		if (argDetails.name.length > 3 && argDetails.name.slice(-3) === '...') {
			argDetails.variadic = true;
			argDetails.name = argDetails.name.slice(0, -3);
		}
		if (argDetails.name) {
			self._args.push(argDetails);
		}
	});
	return this;
};

/**
 * Register callback `fn` for the command.
 *
 * Examples:
 *
 *      program
 *        .command('help')
 *        .description('display verbose help')
 *        .action(function() {
 *           // output help here
 *        });
 *
 * @param {Function} fn
 * @return {Command} for chaining
 * @api public
 */
BotCommand.prototype.action = function(fn) {
	let self = this;
	const listener = function(args, unknown, metadata) {
		// Parse any so-far unknown options
		args = args || [];
		unknown = unknown || [];

		const parsed = self.parseOptions(unknown);
		if (parsed.error) {
			self.outputHelp(metadata);
			return;
		}
		// Output help if necessary
		if (outputHelpIfNecessary(self, parsed.unknown, metadata)) {
			return;
		}

		// If there are still any unknown options, then we simply
		// die, unless someone asked for help, in which case we give it
		// to them, and then we die.
		if (parsed.unknown.length > 0) {
			self.unknownOption(parsed.unknown[0], metadata);
			self.outputHelp(metadata);
		}

		// Leftover arguments need to be pushed back. Fixes issue #56
		if (parsed.args.length) args = parsed.args.concat(args);

		let errorCount = 0;
		self._args.forEach(function(arg, i) {
			if (arg.required && null == args[i]) {
				self.missingArgument(arg.name, metadata);
				errorCount++;
			} else if (arg.variadic) {
				if (i !== self._args.length - 1) {
					self.variadicArgNotLast(arg.name);
					errorCount++;
				}

				args[i] = args.splice(i);
			}
		});
		if (errorCount > 0) {
			this.outputHelp(metadata);
			return;
		}

		for (let i = args; i < self._args; i++) {
			args.push(null);
		}
		args.push(self.opts());
		args.unshift(metadata);
		fn.apply(self, args);
	};
	let parent = this.parent || this;
	let name = parent === this ? '*' : this._name;
	parent.on(name, listener);
	if (this._alias) parent.on(this._alias, listener);
	return this;
};

/**
 * Define option with `flags`, `description` and optional
 * coercion `fn`.
 *
 * The `flags` string should contain both the short and long flags,
 * separated by comma, a pipe or space. The following are all valid
 * all will output this way when `--help` is used.
 *
 *    "-p, --pepper"
 *    "-p|--pepper"
 *    "-p --pepper"
 *
 * Examples:
 *
 *     // simple boolean defaulting to false
 *     program.option('-p, --pepper', 'add pepper');
 *
 *     --pepper
 *     program.pepper
 *     // => Boolean
 *
 *     // simple boolean defaulting to true
 *     program.option('-C, --no-cheese', 'remove cheese');
 *
 *     program.cheese
 *     // => true
 *
 *     --no-cheese
 *     program.cheese
 *     // => false
 *
 *     // required argument
 *     program.option('-C, --chdir <path>', 'change the working directory');
 *
 *     --chdir /tmp
 *     program.chdir
 *     // => "/tmp"
 *
 *     // optional argument
 *     program.option('-c, --cheese [type]', 'add cheese [marble]');
 *
 * @param {String} flags
 * @param {String} description
 * @param {Function|Mixed} fn or default
 * @param {Mixed} defaultValue
 * @return {Command} for chaining
 * @api public
 */

BotCommand.prototype.option = function(flags, description, fn, defaultValue) {
	let self = this,
		option = new Option(flags, description),
		oname = option.name(),
		name = camelcase(oname);

	// default as 3rd arg
	if (typeof fn != 'function') {
		if (fn instanceof RegExp) {
			var regex = fn;
			fn = function(val, def) {
				var m = regex.exec(val);
				return m ? m[0] : def;
			}
		} else {
			defaultValue = fn;
			fn = null;
		}
	}

	// preassign default value only for --no-*, [optional], or <required>
	if (false == option.bool || option.optional || option.required) {
		// when --no-* we make sure default is true
		if (false == option.bool) defaultValue = true;
		// preassign only if we have a default
		if (undefined !== defaultValue) self[name] = defaultValue;
	}

	// register the option
	this.options.push(option);
	// when it's passed assign the value
	// and conditionally invoke the callback
	this.on(oname, function(val) {
		// coercion
		if (null !== val && fn) {
			val = fn(val, undefined === self[name] ? defaultValue : self[name]);
		}

		// unassigned or bool
		if ('boolean' == typeof self[name] || 'undefined' == typeof self[name]) {
			// if no value, bool true, and we have a default, then use it!
			if (null == val) {
				self[name] = option.bool ? defaultValue || true : false;
			} else {
				self[name] = val;
			}
		} else if (null !== val) {
			// reassign
			self[name] = val;
		}
	});

	return this;
};

/**
 * Allow unknown options on the command line.
 *
 * @param {Boolean} arg if `true` or omitted, no error will be thrown
 * for unknown options.
 * @api public
 */
BotCommand.prototype.allowUnknownOption = function(arg) {
	this._allowUnknownOption = arguments.length === 0 || arg;
	return this;
};

/**
 * Parse `argv`, settings options and invoking commands when defined.
 *
 * @param {Array} argv
 * @return {Command} for chaining
 * @api public
 */
BotCommand.prototype.parse = function(line, metadata) {
	if (this.prefixes) {
		let prefixFound = this.prefixes.find(prefix => line.startsWith(prefix));
		//Nothing to do if there was no prefix found
		if (!prefixFound) {
			return;
		}
		line = line.substring(prefixFound.length);
	}

	const argv = line.split(/\s+/);
	// store raw args
	this.rawArgs = argv;

	// process argv
	const parsed = this.parseOptions(this.normalize(argv), metadata);
	if (parsed.error) {
		this.outputHelp(metadata);
		return;
	}
	this.args = parsed.args;
	this.parseArgs(this.args, parsed.unknown, metadata);
}

/**
 * Normalize `args`, splitting joined short flags. For example
 * the arg "-abc" is equivalent to "-a -b -c".
 * This also normalizes equal sign and splits "--abc=def" into "--abc def".
 *
 * @param {Array} args
 * @return {Array}
 * @api private
 */

BotCommand.prototype.normalize = function(args) {
	var ret = [],
		arg, lastOpt, index;

	for (var i = 0, len = args.length; i < len; ++i) {
		arg = args[i];
		if (i > 0) {
			lastOpt = this.optionFor(args[i - 1]);
		}

		if (arg === '--') {
			// Honor option terminator
			ret = ret.concat(args.slice(i));
			break;
		} else if (lastOpt && lastOpt.required) {
			ret.push(arg);
		} else if (arg.length > 1 && '-' == arg[0] && '-' != arg[1]) {
			arg.slice(1).split('').forEach(function(c) {
				ret.push('-' + c);
			});
		} else if (/^--/.test(arg) && ~(index = arg.indexOf('='))) {
			ret.push(arg.slice(0, index), arg.slice(index + 1));
		} else {
			ret.push(arg);
		}
	}
	return ret;
};


/**
 * Parse command `args`.
 *
 * When listener(s) are available those
 * callbacks are invoked, otherwise the "*"
 * event is emitted and those actions are invoked.
 *
 * @param {Array} args
 * @return {Command} for chaining
 * @api private
 */

BotCommand.prototype.parseArgs = function(args, unknown, metadata) {
	var name;

	if (args.length) {
		name = args[0];
		if ('help' == name && 1 == args.length) {
			this.outputHelp(metadata);
			return;
		} else if ('help' == name) {
			args.shift();
			name = args[0];
			unknown.push('--help');
			this.rawArgs = this.rawArgs.slice(1);
			this.rawArgs.push('--help');
		}
		if (this.listeners(name).length) {
			this.emit(args.shift(), args, unknown, metadata);
		} else {
			let command = this.commands.find(cmd => cmd._name === name || cmd._alias === name);
			if (command) {
				let line = this.rawArgs.slice(1).join(' ');
				command.parse(line, metadata);
			} else {
				this.emit('*', args, null, metadata);
			}
		}
	} else {
		outputHelpIfNecessary(this, unknown, metadata);
	}
};

/**
 * Return an option matching `arg` if any.
 *
 * @param {String} arg
 * @return {Option}
 * @api private
 */

BotCommand.prototype.optionFor = function(arg) {
	return this.options.find(opt => opt.long === arg || opt.short === arg);
};

/**
 * Parse options from `argv` returning `argv`
 * void of these options.
 *
 * @param {Array} argv
 * @return {Array}
 * @api public
 */

BotCommand.prototype.parseOptions = function(argv, metadata) {
	let args = [],
		len = argv.length,
		literal, option, arg, errorCount = 0;

	let unknownOptions = [];

	// parse options
	for (var i = 0; i < len; ++i) {
		arg = argv[i];

		// literal args after --
		if ('--' == arg) {
			literal = true;
			continue;
		}

		if (literal) {
			args.push(arg);
			continue;
		}

		// find matching Option
		option = this.optionFor(arg);
		// option is defined
		if (option) {
			// requires arg
			if (option.required) {
				arg = argv[++i];
				if (null == arg) {
					this.optionMissingArgument(option, metadata);
					errorCount++;
				}
				this.emit(option.name(), arg);
				// optional arg
			} else if (option.optional) {
				arg = argv[i + 1];
				if (null == arg || ('-' == arg[0] && '-' != arg)) {
					arg = null;
				} else {
					++i;
				}
				this.emit(option.name(), arg);
				// bool
			} else {
				this.emit(option.name());
			}
			continue;
		}

		// looks like an option
		if (arg.length > 1 && '-' == arg[0]) {
			unknownOptions.push(arg);

			// If the next argument looks like it might be
			// an argument for this option, we pass it on.
			// If it isn't, then it'll simply be ignored
			if (argv[i + 1] && '-' != argv[i + 1][0]) {
				unknownOptions.push(argv[++i]);
			}
			continue;
		}

		// arg
		args.push(arg);
	}
	return {
		error: errorCount > 0,
		args: args,
		unknown: unknownOptions
	};
};

/**
 * Return an object containing options as key-value pairs
 *
 * @return {Object}
 * @api public
 */
BotCommand.prototype.opts = function() {
	let self = this;
	return this.options.reduce((res, opt) => {
		const key = camelcase(opt.name());
		res[key] = this[key];
		return res;
	}, {});
};

/**
 * Argument `name` is missing.
 *
 * @param {String} name
 * @api private
 */

BotCommand.prototype.missingArgument = function(name, metadata) {
	this.sendMessage(metadata, `  error: missing required argument ${name}`);
};

/**
 * `Option` is missing an argument, but received `flag` or nothing.
 *
 * @param {String} option
 * @param {String} flag
 * @api private
 */

BotCommand.prototype.optionMissingArgument = function(option, metadata) {
	this.sendMessage(metadata, `  error: option ${option.flags} argument missing`);
};

/**
 * Unknown option `flag`.
 *
 * @param {String} flag
 * @api private
 */

BotCommand.prototype.unknownOption = function(flag, metadata) {
	if (this._allowUnknownOption) return;
	this.sendMessage(metadata, `  error: unknown option ${flag}`);
};

/**
 * Variadic argument with `name` is not the last argument as required.
 *
 * @param {String} name
 * @api private
 */

BotCommand.prototype.variadicArgNotLast = function(name, metadata) {
	this.sendMessage(metadata, `  error: variadic arguments must be last ${name}`);
};

/**
 * Set the description to `str`.
 *
 * @param {String} str
 * @return {String|Command}
 * @api public
 */

BotCommand.prototype.description = function(str) {
	if (0 === arguments.length) return this._description;
	this._description = str;
	return this;
};

/**
 * Set an alias for the command
 *
 * @param {String} alias
 * @return {String|Command}
 * @api public
 */

BotCommand.prototype.alias = function(alias) {
	if (0 == arguments.length) return this._alias;
	this._alias = alias;
	return this;
};

/**
 * Set / get the command usage `str`.
 *
 * @param {String} str
 * @return {String|Command}
 * @api public
 */

BotCommand.prototype.usage = function(str) {
	var args = this._args.map(function(arg) {
		return humanReadableArgName(arg);
	});

	var usage = '[options]' + (this.commands.length ? ' [command]' : '') + (this._args.length ? ' ' + args.join(' ') : '');

	if (0 == arguments.length) return this._usage || usage;
	this._usage = str;

	return this;
};

/**
 * Get the name of the command
 *
 * @param {String} name
 * @return {String|Command}
 * @api public
 */

BotCommand.prototype.name = function() {
	return this._name;
};

/**
 * Return the largest option length.
 *
 * @return {Number}
 * @api private
 */

BotCommand.prototype.largestOptionLength = function() {
	return this.options.reduce(function(max, option) {
		return Math.max(max, option.flags.length);
	}, 0);
};

/**
 * Return help for options.
 *
 * @return {String}
 * @api private
 */

BotCommand.prototype.optionHelp = function() {
	var width = this.largestOptionLength();

	// Prepend the help information
	return [pad('-h, --help', width) + '  ' + 'output usage information']
		.concat(this.options.map(function(option) {
			return pad(option.flags, width) + '  ' + option.description;
		}))
		.join('\n');
};

/**
 * Return command help documentation.
 *
 * @return {String}
 * @api private
 */

BotCommand.prototype.commandHelp = function() {
	if (!this.commands.length) return '';

	var commands = this.commands.filter(function(cmd) {
		return !cmd._noHelp;
	}).map(function(cmd) {
		var args = cmd._args.map(function(arg) {
			return humanReadableArgName(arg);
		}).join(' ');

		return [
			cmd._name + (cmd._alias ? '|' + cmd._alias : '') + (cmd.options.length ? ' [options]' : '') + ' ' + args, cmd.description()
		];
	});

	var width = commands.reduce(function(max, command) {
		return Math.max(max, command[0].length);
	}, 0);

	return [
		'', '  Commands:', '', commands.map(function(cmd) {
			var desc = cmd[1] ? '  ' + cmd[1] : '';
			return pad(cmd[0], width) + desc;
		}).join('\n').replace(/^/gm, '    '), ''
	].join('\n');
};

/**
 * Return program help documentation.
 *
 * @return {String}
 * @api private
 */

BotCommand.prototype.helpInformation = function() {
	var desc = [];
	if (this._description) {
		desc = [
			'  ' + this._description, ''
		];
	}

	var cmdName = this._name;
	if (this._alias) {
		cmdName = cmdName + '|' + this._alias;
	}
	var usage = [
		'', '  Usage: ' + cmdName + ' ' + this.usage(), ''
	];

	var cmds = [];
	var commandHelp = this.commandHelp();
	if (commandHelp) cmds = [commandHelp];

	var options = [
		'  Options:', '', '' + this.optionHelp().replace(/^/gm, '    '), '', ''
	];

	return usage
		.concat(cmds)
		.concat(desc)
		.concat(options)
		.join('\n');
};

/**
 * Output help information for this command
 *
 * @api public
 */

BotCommand.prototype.outputHelp = function(metadata) {
	this.sendMessage(metadata, this.helpInformation());
	this.emit('--help');
};

/**
 * Output help information and exit.
 *
 * @api public
 */

BotCommand.prototype.help = function(cb) {
	return this.helpInformation();
};

/**
 * Camel-case the given `flag`
 *
 * @param {String} flag
 * @return {String}
 * @api private
 */

function camelcase(flag) {
	return flag.split('-').reduce(function(str, word) {
		return str + word[0].toUpperCase() + word.slice(1);
	});
}

/**
 * Pad `str` to `width`.
 *
 * @param {String} str
 * @param {Number} width
 * @return {String}
 * @api private
 */

function pad(str, width) {
	var len = Math.max(0, width - str.length);
	return str + Array(len + 1).join(' ');
}

/**
 * Output help information if necessary
 *
 * @param {Command} command to output help for
 * @param {Array} array of options to search for -h or --help
 * @api private
 */

function outputHelpIfNecessary(cmd, opts, metadata) {
	const options = opts || [];
	if (options.find(opt => opt == '--help' || opt == '-h')) {
		cmd.outputHelp(metadata);
		return true;
	}
	return false;
}

/**
 * Takes an argument an returns its human readable equivalent for help usage.
 *
 * @param {Object} arg
 * @return {String}
 * @api private
 */

function humanReadableArgName(arg) {
	var nameOutput = arg.name + (arg.variadic === true ? '...' : '');

	return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']'
}

/**
 * Expose the root command.
 */

exports = module.exports = new BotCommand();

/**
 * Expose `BotCommand`.
 */

exports.BotCommand = BotCommand;

/**
 * Expose `Option`.
 */

exports.Option = Option;