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
  .option('--action', 'Action to execute on disassembled code. Default: printCode', ['printCode', 'findAddresses'])
  .action((args, options) => {
    const { disassembleFile, printCode } = require('../src/disassembly');
    let action;

    if (options.action === "findAddresses") {
      const labels = require('../src/labels');
      const { GatherAddress } = require('../src/disassembly/gatherAddresses');

      action = new GatherAddress(labels.all);
    } else {
      const { CodePrinter } = require('../src/disassembly/print');

      action = new CodePrinter();
    }

    const labels = require('../src/labels');

    action.start();
    disassembleFile(args.program, { callback: action.callback.bind(action) });
    action.end();
  });

prog.parse(process.argv);