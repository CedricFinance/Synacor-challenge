import { sprintf } from 'sprintf';
import * as chalk from 'chalk';

import * as labels from '../labels';
import { DisassemblyResult, MergedDisassemblyResult, ResultType, MergedResultKind } from './opcode';

const HALT =  0;
const RET  = 18;

const newlineOpcodes = [ HALT, RET];

var mergedOut: MergedDisassemblyResult;
var emptyLine = false;

function safeStringFromCharCode(charCode: number) {
  return charCode === 10 ? "'\\n'" : `'${String.fromCharCode(charCode)}'`
}

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

function printCode2(result: DisassemblyResult) {
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
    labels.get(result.address),
    result.opcode.name,
    result.decodedParameters.join(" ")
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
      mergedOut = mergeOutOpcode(mergedOut, result);

      if (endMerge(result)) {
        printCode2(mergedOut);
        mergedOut = undefined;
      }

      return;
    }

    printCode2(mergedOut);
    mergedOut = undefined;
  }

  if (startMerge(result)) {
    mergedOut = mergeOutOpcode(mergedOut, result);
  } else {
    printCode2(result);
  }
}

function getKind(result: DisassemblyResult) {
  const label = labels.get(result.address);
  if (label.startsWith("a_")) {
    return MergedResultKind.Array;
  }
  if (label.startsWith("s_")) {
    return MergedResultKind.String;
  }
  return MergedResultKind.Out;
}

function toLabeledValue(address: number) {
  let suffix = '';
  const label = labels.get(address);

  if (label.length > 0) {
    suffix = ` /* = ${label} */`;
  }

  return `${address}${suffix}`;
}

function mergeOutOpcode(mergedOut: MergedDisassemblyResult, result: DisassemblyResult) {
  var startingMerge = false;

  if (typeof mergedOut === "undefined") {
    startingMerge = true;
    mergedOut = {
      address: result.address,
      opcode: result.opcode,
      rawParameters: [],
      decodedParameters: [],
      kind: getKind(result),
      type: result.type
    };
    if (mergedOut.kind === MergedResultKind.Array) {
      mergedOut.decodedParameters = [[]];
    } else {
      mergedOut.decodedParameters = ["''"];
    }

  }

  if (mergedOut.kind === MergedResultKind.String) {
    if (!startingMerge) {
      mergedOut.rawParameters.push(result.opcode.value);
      mergedOut.decodedParameters[0] = mergedOut.decodedParameters[0].slice(0, mergedOut.decodedParameters[0].length-1) + safeStringFromCharCode(result.opcode.value).slice(1);
    }
  } else if (mergedOut.kind === MergedResultKind.Array) {
    if (!startingMerge) {
      mergedOut.rawParameters.push(result.opcode.value);
      mergedOut.decodedParameters[0].push(toLabeledValue(result.opcode.value));
    }
  } else {
    mergedOut.rawParameters.push(result.rawParameters[0]);
    mergedOut.decodedParameters[0] = mergedOut.decodedParameters[0].slice(0, mergedOut.decodedParameters[0].length-1) + result.decodedParameters[0].slice(1);
  }
  return mergedOut;
}

export class CodePrinter {

  start() {}

  callback(result: DisassemblyResult) {
    printCode(result);
  }

  end() {
    if (mergedOut) {
      printCode2(mergedOut);
    }
  }
}
