import { sprintf } from 'sprintf';
import * as chalk from 'chalk';

import * as labels from '../labels';
import { DisassemblyResult, MergedDisassemblyResult, ResultType, MergedResultKind } from './opcode';

const HALT =  0;
const RET  = 18;

const newlineOpcodes = [ HALT, RET];

var mergedOut: MergedDisassemblyResult;
var emptyLine = false;

function toHexString(value: number) {
  return typeof value !== "undefined" ? sprintf("%04x", value) : ""
}

function isRegister(value: number) {
  return value >= 32768 && value <= 32775;
}

function newLineBefore(result: DisassemblyResult) {
  const label = labels.get(result.address);
  return label.length > 0 && !label.startsWith("_");
}

function printLine(result: DisassemblyResult) {
  if (!emptyLine && newLineBefore(result)) {
    console.log();
  }

  emptyLine = false;

  const chalkColor = result.type === ResultType.Code ? chalk.cyan : chalk.green;

  console.log(chalkColor(sprintf("0x%06x %04x %4s %4s %4s %-36s %s %s",
    result.address,
    result.opcode.value,
    toHexString(result.rawParameters[0]),
    toHexString(result.rawParameters[1]),
    toHexString(result.rawParameters[2]),
    result.label,
    result.opcode.name,
    result.decodedParameters.map(p => p.toString({ labels })).join(" ")
  )));

  if (result.opcode.name !== "???" && newlineOpcodes.includes(result.opcode.value)) {
    console.log();
    emptyLine = true;
  }
}

function canMerge(result: DisassemblyResult) {
  return (result.opcode.value === 19 && labels.get(result.address).length === 0 && !isRegister(result.rawParameters[0]))
      || (mergedOut.opcode.name === "???" && mergedOut.rawParameters.length < mergedOut.opcode.value);
}

function startMerge(result: DisassemblyResult) {
  return (result.opcode.value === 19 && !endMerge(result))
      || (result.opcode.name === "???" && (labels.get(result.address).startsWith("s_") || labels.get(result.address).startsWith("a_")));
}

function endMerge(result: DisassemblyResult) {
  return (result.opcode.value === 19 && (result.rawParameters[0] === 10 || isRegister(result.rawParameters[0])))
      || (mergedOut && mergedOut.opcode.name === "???" && mergedOut.rawParameters.length == mergedOut.opcode.value);
}

/** Print the disassembly result
  * Consecutive out opcode are merged (the same for arrays and strings).
  */
export function printCode(result: DisassemblyResult) {
  if (mergedOut) {
    if (canMerge(result)) {
      mergedOut.merge(result);

      if (endMerge(result)) {
        printLine(mergedOut);
        mergedOut = undefined;
      }

      return;
    }

    printLine(mergedOut);
    mergedOut = undefined;
  }

  if (startMerge(result)) {
    mergedOut = new MergedDisassemblyResult(result);
  } else {
    printLine(result);
  }
}

export class CodePrinter {

  start() {}

  callback(result: DisassemblyResult) {
    printCode(result);
  }

  end() {
    if (mergedOut) {
      printLine(mergedOut);
    }
  }
}
