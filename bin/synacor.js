#!/usr/bin/env node
const prog = require('caporal');

prog.version("1.0.0");

prog
  .command('run', 'Run a program')
  .argument('<program>', 'Program to run')
  .option('--eval <command>', 'Command to evaluate before executing the current opcode')
  .action((args, options) => {
    console.log(args, options);
    const run = require('../src/main');
    run(args.program, options.eval);
  });

prog
  .command('disassemble', 'Disassemble a program')
  .argument('<program>', 'Program to disassemble')
  .action((args, options) => {
    const { disassembleFile } = require('../src/disassembly');

    disassembleFile(args.program);
  });

prog.parse(process.argv);