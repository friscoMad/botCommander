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