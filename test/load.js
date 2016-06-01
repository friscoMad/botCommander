"use strict";
const BotCommand = require('../index.js').BotCommand,
  should = require('should');

describe('load', function() {
  let output = '';
  let send = function(meta, msg) {
    output += msg + "\n";
  };
  let basicBot = function() {
    const bot = new BotCommand();
    return bot.setSend(send)
      .allowUnknownOption(false);
  };
  beforeEach(function() {
    output = "";
  });
  it("should load a file", function(done) {
    const bot = basicBot();
    bot.loadFile('./test/loadTests', 'test1.js')
      .setSend((meta, msg) => {
        msg.should.be.eql('test1');
        done();
      })
      .parse("test1");
  });
  it("should load a file2", function(done) {
    const bot = basicBot();
    bot.load('./test/loadTests/test1.js')
      .setSend((meta, msg) => {
        msg.should.be.eql('test1');
        done();
      })
      .parse("test1");
  });
  it("should fail if file or folder does not exists", function() {
    const bot = basicBot();
    (function() {
      bot.loadFile('./test/loadTests2', 'test1.js');
    }).should.throw();
    (function() {
      bot.loadFile('./test/loadTests2', 'aaa.js');
    }).should.throw();
  });
  it("should load several files", function() {
    const bot = basicBot();
    bot.load('./test/loadTests');
    bot.parse("test1");
    output.should.be.eql('test1\n');
    output = "";
    bot.parse("test2");
    output.should.be.eql('test2\n');    
  });
  it("should be possible to load inside a load", function(done) {
    const bot = basicBot();
    bot.load('./test/nestedLoadTests')
      .setSend((meta, msg) => {
        msg.should.be.eql('test');
        done();
      })
      .parse("sub test");
  });
});