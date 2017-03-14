const sprintf = require('sprintf').sprintf;
const labels = require('../labels');

const HALT =  0;
const JMP  =  6;
const RET  = 18;

const newlineOpcodes = [ HALT, JMP, RET];
var mergedOut;

function safeStringFromCharCode(charCode) {
  return charCode === 10 ? "'\\n'" : `'${String.fromCharCode(charCode)}'`
}

function toHexString(value) {
  return typeof value !== "undefined" ? sprintf("%04x", value) : ""
}

function isRegister(value) {
  return value >= 32768 && value <= 32775;
}

function printCode2(result) {
  console.log(sprintf("0x%06x %04x %4s %4s %4s %-36s %s %s",
    result.address,
    result.opcode.value,
    toHexString(result.rawParameters[0]),
    toHexString(result.rawParameters[1]),
    toHexString(result.rawParameters[2]),
    labels.get(result.address),
    result.opcode.name,
    result.decodedParameters.join(" ")
  ));

  if (result.opcode.name !== "???" && newlineOpcodes.includes(result.opcode.value)) {
    console.log();
  }
}

function canMerge(result) {
  return (result.opcode.value === 19 && labels.get(result.address).length === 0 && !isRegister(result.rawParameters[0]))
      || (mergedOut.opcode.name === "???" && mergedOut.rawParameters.length < mergedOut.opcode.value);
}

function startMerge(result) {
  return (result.opcode.value === 19 && !endMerge(result))
      || (result.opcode.name === "???" && (labels.get(result.address).startsWith("s_") || labels.get(result.address).startsWith("a_")));
}

function endMerge(result) {
  return (result.opcode.value === 19 && (result.rawParameters[0] === 10 || isRegister(result.rawParameters[0])))
      || (mergedOut && mergedOut.opcode.name === "???" && mergedOut.rawParameters.length == mergedOut.opcode.value);
}

function printCode(result) {
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

function getKind(result) {
  const label = labels.get(result.address);
  if (label.startsWith("a_")) {
    return "array";
  }
  if (label.startsWith("s_")) {
    return "string";
  }
  return "out"
}

function mergeOutOpcode(mergedOut, result) {
  var startingMerge = false;

  if (typeof mergedOut === "undefined") {
    startingMerge = true;
    mergedOut = {
      address: result.address,
      opcode: result.opcode,
      rawParameters: [],
      kind: getKind(result)
    };
    if (mergedOut.kind === "array") {
      mergedOut.decodedParameters = [[]];
    } else {
      mergedOut.decodedParameters = ["''"];
    }

  }

  if (mergedOut.kind === "string") {
    if (!startingMerge) {
      mergedOut.rawParameters.push(result.opcode.value);
      mergedOut.decodedParameters[0] = mergedOut.decodedParameters[0].slice(0, mergedOut.decodedParameters[0].length-1) + safeStringFromCharCode(result.opcode.value).slice(1);
    }
  } else if (mergedOut.kind === "array") {
    if (!startingMerge) {
      mergedOut.rawParameters.push(result.opcode.value);
      mergedOut.decodedParameters[0].push(result.opcode.value);
    }
  } else {
    mergedOut.rawParameters.push(result.rawParameters[0]);
    mergedOut.decodedParameters[0] = mergedOut.decodedParameters[0].slice(0, mergedOut.decodedParameters[0].length-1) + result.decodedParameters[0].slice(1);
  }
  return mergedOut;
}

class CodePrinter {

  start() {}

  callback(result) {
    printCode(result);
  }

  end() {
    if (mergedOut) {
      printCode2(mergedOut);
    }
  }
}

module.exports = {
  CodePrinter,
  printCode
};