#!/usr/bin/env node
import * as prog from 'caporal';
import { Labels } from '../src/labels';
import { disassembleFile } from '../src/disassembly';
import { GatherAddress } from '../src/disassembly/gatherAddresses';
import { CodePrinter } from '../src/disassembly/print';

function loadLabels(file) {
  const labels = new Labels();
  if (file) {
    console.log("Loading labels from "+file);
    labels.load(file);
  }
  return labels;
}

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
  .option('--labels <file>', 'File containing the list of labels for the program')
  .action((args, options) => {
    console.log(args, options);
    const run = require('../src/main');
    run(args.program, options.eval, loadLabels(options.labels));
  });

prog
  .command('disassemble', 'Disassemble a program')
  .argument('<program>', 'Program to disassemble')
  .option('--action', 'Action to execute on disassembled code. Default: printCode', ['printCode', 'findAddresses'])
  .option('--labels <file>', 'File containing the list of labels for the program')
  .action((args, options) => {
    let action;

    const labels = loadLabels(options.labels);

    if (options.action === "findAddresses") {
      action = new GatherAddress(labels);
    } else {
      action = new CodePrinter();
    }

    action.start();
    disassembleFile(args.program, labels, { callback: action.callback.bind(action) });
    action.end();
  });

prog.parse(process.argv);