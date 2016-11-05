# BotCommander

[![Build Status](https://api.travis-ci.org/frisco82/botCommander.svg?style=flat)](http://travis-ci.org/frisco82/botCommander)
[![codecov](https://img.shields.io/codecov/c/github/frisco82/botCommander.svg?style=flat)](https://codecov.io/gh/frisco82/botCommander)
[![NPM Version](http://img.shields.io/npm/v/bot-commander.svg?style=flat)](https://www.npmjs.org/package/bot-commander)
[![NPM Downloads](https://img.shields.io/npm/dt/bot-commander.svg?style=flat)](https://www.npmjs.org/package/bot-commander)

  The complete solution for [node.js](http://nodejs.org) interactive interfaces, focused in bots, based on and inspired by [Commander.js](https://github.com/tj/commander.js).

## Overview

<!-- MarkdownTOC depth=3 autolink=true bracket=round -->

- [Installation](#installation)
- [Command parsing](#command-parsing)
- [Specify the argument syntax](#specify-the-argument-syntax)
- [Variadic arguments](#variadic-arguments)
- [Option parsing](#option-parsing)
  - [Option Arguments](#option-arguments)
  - [Coercion](#coercion)
  - [Regular Expression](#regular-expression)
- [Subcommands](#subcommands)
- [Load plugins](#load-plugins)
- [Output](#output)
- [Metadata](#metadata)
- [Automated help](#automated-help)
  - [.help\(\)](#help)
- [Configuration](#configuration)
- [Examples](#examples)
- [License](#license)

<!-- /MarkdownTOC -->


## Installation

    $ npm install bot-commander

## Command parsing

Commands are defined with the `.command()` method, it will return the new command to configure it with a fluent api. The `.action()` command sets the callback to be called when the command is recognised by default nothing will be called creating a command without action can be usefull for creating subcommand APIs.
`.description()` method serves as documentation for the command, `.alias()` can be used to define command alias so both command names are interchangeable.

Options can be passed with the call to `.command()`. Specifying `true` for `opts.noHelp` will remove the option from the generated help output.

```js
const bot = require(bot-commander);

bot
  .command('test')
  .alias('testAlias')
  .description('This is a test command')
  .action( a => {
    //This will be called when this command is found in the input
  });

bot.
  .command('onlyCommand')
  .action( a => {
    //This will be called when this command is found in the input
  });


let input = 'test';
//This will parse the input and call the 'test' command action.
bot.parse(input);
```

## Specify the argument syntax

```js
const bot = require(bot-commander);

bot.
  .command('test <required> [optional]')
  .action( (meta, required, optional) => {
    if (optional) {
      console.log(optional);
    }
    console.log(required);
  });

bot.parse('test req');
//The output will be 'req'
bot.parse('test req opt');
//The output will be 'opt req'
```
Angled brackets (e.g. `<required>`) indicate required input. Square brackets (e.g. `[optional]`) indicate optional input.
The arguments are applied to the callback function in the same order as the are found, the first argument will allways be the metadata described in [Metadata](#metadata), all arguments will appear after it.
Argument definition and parsing support single and double quoted arguments, so the comunication it is not confined to one word values.

```js
const bot = require(bot-commander);

bot.
  .command('test ["multi word argument"]')
  .action( (meta, arg) => {
    console.log(arg);
  });

bot.parse("test 'this is the first argument'");
//The output will be 'this is the first argument'
```

## Variadic arguments

 The last argument of a command can be variadic, and only the last argument.  To make an argument variadic you have to append `...` to the argument name.  Here is an example:

```js

const bot = require(bot-commander);

bot
  .command('rmdir <dir> [otherDirs...]')
  .action((meta, dir, otherDirs) => {
    console.log('rmdir %s', dir);
    if (otherDirs) {
      otherDirs.forEach(oDir => console.log('rmdir %s', oDir));
    }
  });

bot.parse('rmdir dir1 dir2 dir3');
```

 An `Array` is used for the value of a variadic argument.

## Option parsing

 Options with commander are defined with the `.option()` method, also serving as documentation for the options. The example below parses args and options.

```js

const bot = require(bot-commander);

bot
  .command('pizza')
  .option('-p, --peppers', 'Add peppers')
  .option('-P, --pineapple', 'Add pineapple')
  .option('-b, --bbq-sauce', 'Add bbq sauce')
  .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
  .action((meta, opts) => {
    console.log('you ordered a pizza with:');
    if (opts.peppers) console.log('  - peppers');
    if (opts.pineapple) console.log('  - pineapple');
    if (opts.bbqSauce) console.log('  - bbq');
    console.log('  - %s cheese', opts.cheese);  
  });
```

 Short flags may be passed as a single arg, for example `-abc` is equivalent to `-a -b -c`. Multi-word options such as "--template-engine" are camel-cased, becoming `templateEngine` etc.

### Option Arguments

Options can have their own arguments, that are defined the same way as regular arguments, by default they are treated as string except if the option name contains `-no-` like in `--no-flag` this will make the option boolean and have a default value of `true` and setting the flag will set the value to `false` even if using a short version.

```js

const bot = require(bot-commander);

bot
  .command('pizza')
  .option('-p, --no-pineapple', 'Remove pineapple')
  .option('-opt <required>', 'option with required argument')
  .option('-opt2 [optional]', 'option with optional argument')
  .action((meta, opts) => {
    if (opts.pineapple) console.log('You ordered a pizza with pineapple');
  });

bot.parse('pizza -p'); //No output
bot.parse('--no-pineapple'); //No output
bot.parse('pizza'); //'You ordered a pizza with pineapple'
```

Arguments can be separated from the option using spaces or equals.

### Coercion

Options can also have it's own values, and can be parsed with custom functions to fit your needs.
The third parameter of the `.option()` method accepts a default value, a regex or a function. In case a function is passed it will be called when a value is parsed and its return value will be stored for the action callback.

```js
function range(val) {
  return val.split('..').map(Number);
}

function list(val) {
  return val.split(',');
}

function collect(val, memo) {
  memo.push(val);
  return memo;
}

function increaseVerbosity(v, total) {
  return total + 1;
}

bot
  .commnad('test')
  .option('-i, --integer <n>', 'An integer argument', parseInt)
  .option('-f, --float <n>', 'A float argument', parseFloat)
  .option('-r, --range <a>..<b>', 'A range', range)
  .option('-l, --list <items>', 'A list', list)
  .option('-o, --optional [value]', 'An optional value')
  .option('-c, --collect [value]', 'A repeatable value', collect, [])
  .option('-v, --verbose', 'A value that can be increased', increaseVerbosity, 0)
  .action((meta, opts) => {
    console.log(' int: %j', opts.integer);
    console.log(' float: %j', opts.float);
    console.log(' optional: %j', opts.optional);
    opts.range = opts.range || [];
    console.log(' range: %j..%j', opts.range[0], opts.range[1]);
    console.log(' list: %j', opts.list);
    console.log(' collect: %j', opts.collect);
    console.log(' verbosity: %j', opts.verbose);
    console.log(' args: %j', opts.args);
  });

bot.parse('test -i 3 -f 3.2 -r 1..3 -o -c 1 -c 4 -vvv')
```

### Regular Expression

```js
bot
  .command('pizza')
  .option('-s --size <size>', 'Pizza size', /^(large|medium|small)$/i, 'medium')
  .option('-d --drink [drink]', 'Drink', /^(coke|pepsi|izze)$/i)
  .action((meta, opts) => {
    console.log(' size: %j', opts.size);
    console.log(' drink: %j', opts.drink);
    });
  
```

## Subcommands

```js

const bot = require(bot-commander);
cmd.

let cmd = bot.
  .command('pack')
  .showHelpOnEmpty();

cmd
  .command('install [name]')
  .description('install one or more packages');

cmd 
  .command('search [query]')
  .description('search with optional query');

cmd 
  .command('list')
  .description('list packages installed')
  .action(a => console.log('list'));

bot.parse('pack list');
//Output will be 'out'
```

The commands can be configured in a multilevel hierarchy this gives a great flexibility when creating interfaces. If a command does not have an action or a subcommand nothing will be called, except if the command is configured to show help on empy with `.showHelpOnEmpty()` in that case the command help will be returned.

When a subcommand is created, a help command is created by default that shows the usage of the command and subcommands. Take into account that the help shown is different for each level as it only shows the usage of the commands in the same level.

```js

const bot = require(bot-commander);

let cmd = bot
  .command('pack')

cmd
  .command('install [name]')
  .description('install one or more packages');

bot.parse('help');
//Will output only help and pack usage
bot.parse('pack help'); //or 'pack -h'
//Will output only help and install usage
```

The parent command can have an action if desired, it will be called if no subcommand is used, in case you want to require a subcommand you can force it with `bot.command('main <subcommand>')` as with any command or if you only want to show the help without an error then use `.showHelpOnEmpty()`.

## Load plugins

Another feature of the library is the hability to load commands from external files, it is really easy with `.load(path)` if the path is a file and exports function it will be called with parser as the only argument so it can add commands or even call load itself.
Take into account that relative paths are resolved from the main script path.

plugin.js
```js
module.exports = bot => {
  bot.command('test1')
    .action(a => console.log('test1'));
};
```

main.js
```js
const bot = require(bot-commander);

bot.load('plugin.js');
bot.parse('test1');
//Output will be 'test1'
```

If the path is a directory it will load every file that could be loaded in that directory.
The load function can also be used under a command, in that case the plugins will create subcommands for the main command.

## Output

As the library is intended for interactive usage and mainly bots, it will not output anything in the console unless your actions print anything. All communication from the library itself is done via a configurable send function, it will only be used for help and missing arguments. By default the send function is undefined, so be sure to configure it before parsing anything with `.setSend(cb)` the callback function receive 2 arguments, [metadata](#metadata) and the message to send.

The `.send()` function can be used in your actions to output anything and will use the function previously configured using `.setSend()`. This function will check that the message is defined before calling the configured function and will return the same that the function returns.

```js
const bot = require(bot-commander);

bot
  .setSend((meta, message) => console.log(message))
  .command('test')
  .action(meta => {
    //ret will be null as console.log does not have a return value
	let ret = bot.send(meta, 'message');
  });

bot.parse('test');
//Will send 'message' through the configured send function.
```

The send function is shared by the whole hierarchy of commands so it can be set in the main object or at any command or subcommand and it will work for every one.

## Metadata

As you probably have noted, through the whole library there are metadata arguments, this may seem a bit strange at first but the library it is designed to configure a stateless parser and then reuse many times even simultaneusly, think of an irc bot receiving commands from several users. The metadata object is passed from the parser call to actions and send function to be able to use all the metadata around the text being parsed this could be usefull for time data, from and to information, the channel, etc.
The library does not make use of it or manipulate in any way, you can use it as you need.

For example using a fictional irc library with `.on()` and `.send()` functions this could be a simple irc bot.

```js
const bot = require(bot-commander);

bot
  .command('hello')
  .action(meta => {
    let message = `${meta.from} says hello world to the channel`;
    delete meta.from;
    bot.send(meta, message);
  })

bot
  .setSend((meta, message) => {
    if (meta.from) {
      irc.send(meta.from, message);
    } else {
      irc.send(meta.channel, message);      
    }
  });

irc.on(event => {
  //Event could be something like: {from: 'user1', channel: '#channel', message: ''}
  bot.parse(event.message, event);
});
```

## Automated help

The help information is auto-generated based on the information bot commander already knows about your commands, so the following `--help` info is for free.

This is the help output from the general [example](https://github.com/frisco82/botCommander/blob/master/examples/general.js), it will be sent when parsing `help`
```  
  Usage:  [options] [command]


  Commands:

    help [cmd]          display help for [cmd]
    copy <file> <dest>  Copy file to dest
    pizza [options]     Order your pizza
    sub <command>       Subcomand
    exit|quit           Exit program

  Options:

    -h, --help  output usage information
```

Every command has it's own command help, using the same example parsing `copy -h`, `copy --help` or `help copy` will render this:
```  
  Usage: copy [options] <file> <dest>

  Copy file to dest

  Options:

    -h, --help  output usage information
```

### .help()

Returns the help information as a string, this can be helpfull for some error handling in your actions, or for customising the help implicit command.
If the first command you define is `help` the implicit help command will not be created so your command will be able to send a customized help.
The help command is diffent for every node in the command hierarchy so you can redefine whatever you want.

```js
const bot = require(bot-commander);

bot
  .command('help')
  .action(meta => {
    let message = bot.help() + '\n Show examples under the main help'; 
    bot.send(meta, message);
  });

bot
  .command('test')
```

## Configuration

Aside from the option argument in the command constructor (that currently is used only for noHelp), there are several functions that can alter the parsing and error handling for each command or the whole hierarchy.

The shared configuration options are: `.setSend()`, `.allowUnknownOption()`, `lowerCase()` and `.showHelpOnError()`.

* `.setSend()`: has already been discussed on the Output section.
* `.allowUnknownOption(boolean)`: Allows to disable errors when an unknown option is present in the command line. Default is to show an error.
* `.lowerCase(boolean)`: Configures the parser to check commands in lower case (options and argmuents are not changed).
* `.showHelpOnError(boolean)`: Allows to show or not the help when a parsing error is found, the parsing error is always reported but you can opt to not show the full help. Default is true.

The configuration options that only affects one command are this three:

* `.prefix()`: Allows to configure a prefix (string) or an array of prefixes to search for at the start of parsing if they are not present the line will not be parsed, this is usefull for bots listening to group channels where you need to tell the bot what to parse. It can be used on any command but it is mainly used in the main object. Default is null.
* `.showHelpOnEmpty(boolean)`: Force to show the help when no command or subcommand is identified in the parsed line. Default is false.
*`.setParseOptions(object)`: Sets a new object as parse options for the command, this options are `{send: null, allowUnknownOption: false, showHelpOnError: true }` this function allows you to configure different options from the full hierarchy and any subcommand created after this call will inherit this options. After setting a new option object you can safely call any of the shared setting functions and will only affect this command and all subcommands created after the call.

## Examples

```js
const bot = require('bot-commander');

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
```

More Demos can be found in the [examples](https://github.com/frisco82/botCommander/tree/master/examples) directory.

## License

MIT
