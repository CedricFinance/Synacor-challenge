#!/usr/bin/env node
import * as prog from 'caporal';
import * as labels from '../src/labels';
import { disassembleFile } from '../src/disassembly';
import { printCode } from '../src/disassembly/print';
import { GatherAddress } from '../src/disassembly/gatherAddresses';
import { CodePrinter } from '../src/disassembly/print';

prog.version("1.0.0");

prog
  .command('run', 'Run a program')
  .argument('<program>', 'Program to run')
  .complete(function() {
    return new Promise((resolve,reject) => {
      const fs = require('fs');
      fs.readdir(process.cwd(), (err, files) => {
        resolve(files);
      });
    })
  })
  .option('--eval <command>', 'Command to evaluate before executing the current opcode')
  .option('--input <file>', 'Inputs for the program')
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
    let action;

    if (options.action === "findAddresses") {
      action = new GatherAddress(labels.all);
    } else {
      action = new CodePrinter();
    }

    action.start();
    disassembleFile(args.program, { callback: action.callback.bind(action) });
    action.end();
  });

prog.parse(process.argv);