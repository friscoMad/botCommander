"use strict";

const Path = require('path');
const fs = require('fs');

let formatLines = (lines, opts) => {
  if (opts.squeezeBlank) {
    lines = lines.filter((line, index, lines) => !(index > 1 && line.trim() === '' && lines[index-1].trim() === ''));
  }
  let nonBlank = 1;
  lines = lines.map((line, index) => {
    if (opts.showEnds) {
      line = line + '$';
    }
    if (opts.number) {
      line = index + ' ' + line;
    } else if (opts.numberNonblank && line.trim() !== '') {
      line = nonBlank + ' ' + line;
      nonBlank++;
    }
    return line;
  });
  return lines.join('\n');
}

module.exports = bot => {
  bot.command('cat [file...]')
    .description('concatenate files and print on the standard output')
    .option('-b, --number-nonblank', 'number nonempty output lines')
    .option('-E, --show-ends', 'display $ at end of each line')
    .option('-n, --number', 'number all output lines')
    .option('-s, --squeeze-blank', 'suppress repeated empty output lines')
    .action((meta, files, opts) => {
      files.forEach(file => {
        const lines = fs.readFileSync(Path.resolve(meta.currDir, file)).toString().split(/\r?\n/);
        bot.send(meta, formatLines(lines, opts))
      });
    });
};

