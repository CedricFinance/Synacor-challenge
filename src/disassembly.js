const sprintf = require('sprintf').sprintf;

const { loadProgram } = require('./loader');
const { labelFor } = require('./labels');

const HALT =  0;
const JMP  =  6;
const RET  = 18;

function toHexString(value) {
  return typeof value !== "undefined" ? sprintf("%04x", value) : ""
}

const newlineOpcodes = [ HALT, JMP, RET];
var mergedOut;

function printCode2(result) {
  console.log(sprintf("0x%06x %04x %4s %4s %4s %-24s %s %s",
    result.address,
    result.opcode.value,
    toHexString(result.rawParameters[0]),
    toHexString(result.rawParameters[1]),
    toHexString(result.rawParameters[2]),
    labelFor(result.address),
    result.opcode.name,
    result.decodedParameters.join(" ")
  ));

  if (result.opcode.name !== "???" && newlineOpcodes.includes(result.opcode.value)) {
    console.log();
  }
}

function canMerge(result) {
  return (labelFor(result.address).length === 0 && result.opcode.value === 19)
      || (mergedOut.opcode.name === "???" && mergedOut.rawParameters.length < mergedOut.opcode.value);
}

function startMerge(result) {
  return (result.opcode.value === 19 && !endMerge(result))
      || (result.opcode.name === "???" && labelFor(result.address).startsWith("s_"));
}

function endMerge(result) {
  return (result.opcode.value === 19 && result.rawParameters[0] === 10)
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

function mergeOutOpcode(mergedOut, result) {
  var startingMerge = false;

  if (typeof mergedOut === "undefined") {
    startingMerge = true;
    mergedOut = {
      address: result.address,
      opcode: result.opcode,
      rawParameters: [],
      decodedParameters: ["''"]
    };
  }

  if (result.opcode.name === "???") {
    if (!startingMerge) {
      mergedOut.rawParameters.push(result.opcode.value);
      mergedOut.decodedParameters[0] = mergedOut.decodedParameters[0].slice(0, mergedOut.decodedParameters[0].length-1) + safeStringFromCharCode(result.opcode.value).slice(1);
    }
  } else {
    mergedOut.rawParameters.push(result.rawParameters[0]);
    mergedOut.decodedParameters[0] = mergedOut.decodedParameters[0].slice(0, mergedOut.decodedParameters[0].length-1) + result.decodedParameters[0].slice(1);
  }
  return mergedOut;
}

function disassemble(program, startAddress = 0, maxAddress = program.length) {
  let address = startAddress;
  while(address < maxAddress) {
    let result = disassembleAt(program, address);
    printCode(result);
    address += result.opcode.length
  }
}

function hexParams(params) {
  return params.map(toHexString);
}

function validateRegister(register) {
  if (register < 32768 || register > 32775) {
    throw new Error(`Invalid register ${toHexString(register)}`)
  }
}

function validateValue(value) {
  if (value >= 32768) {
    throw new Error(`Invalid value ${toHexString(value)}`)
  }
}

function toAddressOrLabel(address) {
  const label = labelFor(address);

  if (label.length > 0) {
    return label;
  }

  return toHexString(address);
}

function toLabeledValue(address) {
  let suffix = '';
  const label = labelFor(address);

  if (label.length > 0) {
    suffix = ` /* = ${label} */`;
  }

  return toHexString(address)+suffix;
}

function toRegister(v) {
  validateRegister(v);
  return "r"+(v-32768);
}

function toAddressOrRegister(v) {
  if (v < 32768) {
    return toAddressOrLabel(v);
  }
  return toRegister(v);
}

function toValueOrRegister(v) {
  if (v < 32768) {
    return toLabeledValue(v);
  }
  return toRegister(v);
}

function decodeConditionals([value, address]) {
  return [ toValueOrRegister(value), toAddressOrLabel(address) ];
}

function decodeOneAddress([address]) {
  return [ toAddressOrLabel(address) ];
}

function decodeOneRegister([register]) {
  validateRegister(register);
  return [ toRegister(register) ];
}

function decodeRegisterAndValue([register, value]) {
  validateRegister(register);
  validateValue(value);
  return [ toRegister(register), toHexString(value) ];
}

function decodeRegisterOrAddress([registerOrAddress]) {
  return [ toAddressOrRegister(registerOrAddress) ];
}

function decodeRegisterOrValue([registerOrValue]) {
  return [ toValueOrRegister(registerOrValue) ];
}

function decodeTwoRegisterOrValue([registerOrValue1, registerOrValue2]) {
  return [ toValueOrRegister(registerOrValue1), toValueOrRegister(registerOrValue2) ];
}

function decodeRegisterAndTwoValues([register, first, second]) {
  validateRegister(register);
  validateValue(first);
  validateValue(second);
  return [ toRegister(register), toHexString(first), toHexString(second) ];
}

function decodeRegisterAndTwoValueOrRegister([register, first, second]) {
  return [ toRegister(register), toValueOrRegister(first), toValueOrRegister(second) ];
}

function decodeRegisterAndOneValueOrRegister([register, valueOrRegister]) {
  validateRegister(register);
  return [ toRegister(register), toValueOrRegister(valueOrRegister) ];
}

function safeStringFromCharCode(charCode) {
  return charCode === 10 ? "'\\n'" : `'${String.fromCharCode(charCode)}'`
}

const opcodes = [
  { value: 0,  length: 1, name: "halt", decodeParameters: hexParams },
  { value: 1,  length: 3, name: "set",  decodeParameters: decodeRegisterAndOneValueOrRegister },
  { value: 2,  length: 2, name: "push", decodeParameters: decodeRegisterOrValue },
  { value: 3,  length: 2, name: "pop",  decodeParameters: decodeOneRegister },
  { value: 4,  length: 4, name: "eq",   decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 5,  length: 4, name: "gt",   decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 6,  length: 2, name: "jmp",  decodeParameters: decodeOneAddress },
  { value: 7,  length: 3, name: "jt",   decodeParameters: decodeConditionals },
  { value: 8,  length: 3, name: "jf",   decodeParameters: decodeConditionals },
  { value: 9,  length: 4, name: "add",  decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 10, length: 4, name: "mult", decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 11, length: 4, name: "mod",  decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 12, length: 4, name: "and",  decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 13, length: 4, name: "or",   decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 14, length: 3, name: "not",  decodeParameters: decodeRegisterAndOneValueOrRegister },
  { value: 15, length: 3, name: "rmem", decodeParameters: ([a,b]) => [toRegister(a), toAddressOrRegister(b)] },
  { value: 16, length: 3, name: "wmem", decodeParameters: decodeTwoRegisterOrValue },
  { value: 17, length: 2, name: "call", decodeParameters: decodeRegisterOrAddress },
  { value: 18, length: 1, name: "ret",  decodeParameters: hexParams },
  { value: 19, length: 2, name: "out",
    decodeParameters: ([charCode]) => {
      const str = safeStringFromCharCode(charCode);
      return [ str ];
    }
  },
  { value: 20, length: 2, name: "in",   decodeParameters: hexParams },
  { value: 21, length: 1, name: "noop", decodeParameters: hexParams },
]

function isData(address) {
  return address >= 0x017b4
}

function invalidOpcode(address, value) {
  return {
    address,
    opcode: { value, name: '???', length: 1 },
    rawParameters: [],
    decodedParameters: [`${value} ${safeStringFromCharCode(value)}`]
  };
}

function disassembleAt(program, address) {
  const value = program[address];

  if (isData(address) || value >= opcodes.length) {
    return invalidOpcode(address, value);
  }

  const opcode = opcodes[value];
  const rawParameters = program.slice(address+1, address+1+opcode.length-1);

  const result = {
    address,
    opcode,
    rawParameters,
  };

  try {
    result.decodedParameters = opcode.decodeParameters(rawParameters);
  } catch(err) {
    console.error(new Error(`An error occured while decoding parameters for opcode ${JSON.stringify(result)}: ${err}`));
    return invalidOpcode(address, value);
  }

  return result;
}

function printCodeAt(program, address) {
  printCode(disassembleAt(program, address));
}

function disassembleFile(file) {
  const program = loadProgram(file);
  disassemble(program);
}

module.exports = {
  disassembleFile,
  disassemble,
  printCodeAt
}