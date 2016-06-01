"use strict";

const Fs = require('fs');
const Path = require('path');

let formatFile = (name, path, opts) => {
  let fullPath = Path.join(path, name);
  let stat = Fs.lstatSync(fullPath);
  if (opts.classify) {
    if (stat.isDirectory()) {
      name += '/'; 
    }
    if (stat.isSymbolicLink()) {
      name += '*';
    }    
  }
  if (opts.l) {
    let mode = convertModeToText(stat.mode);
    name = `${mode} ${stat.uid} ${stat.guid} ${stat.size}\t\t ${name}`
  }
  if (opts)
  return name;
}

let convertModeToText = mode => {
  var owner = mode >> 6,
      group = (mode << 3) >> 6,
      others = (mode << 6) >> 6;
  let ret = '';
  ret += (!!(owner & 4))?'r':'-';
  ret += (!!(owner & 2))?'w':'-';
  ret += (!!(owner & 1))?'x':'-';

  ret += (!!(group & 4))?'r':'-';
  ret += (!!(group & 2))?'w':'-';
  ret += (!!(group & 1))?'x':'-';

  ret += (!!(others & 4))?'r':'-';
  ret += (!!(others & 2))?'w':'-';
  ret += (!!(others & 1))?'x':'-';
  return ret;
}

module.exports = bot => {
  bot.command('ls [path]')
    .description('list directory contents')
    .option('-F, --classify', 'append indicator (one of */=>@|) to entries')
    .option('-a, --all', 'do not ignore entries starting with .')
    .option('-l', 'use a long listing format')
    .action((meta, path, opts) => {
      path = path || '.';
      path = Path.resolve(meta.currDir, path);
      let files = Fs.readdirSync(path);
      if (!opts.all) {
        files = files.filter(name => !name.startsWith('.'));
      }
      bot.send(null, files.map(file => formatFile(file, path, opts)).join("\n"));
    });
};