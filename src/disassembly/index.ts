import { sprintf } from 'sprintf';

import { loadProgram } from '../loader';
import * as labels from '../labels';
import { printCode } from './print.js';
import { ResultType, DisassemblyResult, OpcodeDefinition } from './opcode';

function toHexString(value: number): string {
  return typeof value !== "undefined" ? sprintf("%04x", value) : ""
}

function hexParams(params: number[]) {
  return params.map(toHexString);
}

function isRegister(value: number) {
  return value >= 32768 && value <= 32775;
}

function validateRegister(register: number) {
  if (!isRegister(register)) {
    throw new Error(`Invalid register ${toHexString(register)}`)
  }
}

function validateValue(value: number) {
  if (value >= 32768) {
    throw new Error(`Invalid value ${toHexString(value)}`)
  }
}

function toAddressOrLabel(address: number) {
  const label = labels.get(address);

  if (label.length > 0) {
    return label;
  }

  return toHexString(address);
}

function toLabeledValue(address: number) {
  let suffix = '';
  const label = labels.get(address);

  if (label.length > 0) {
    suffix = ` /* = ${label} */`;
  }

  return toHexString(address)+suffix;
}

function toRegister(v: number) {
  validateRegister(v);
  return "r"+(v-32768);
}

function toAddressOrRegister(v: number) {
  if (isRegister(v)) {
    return toRegister(v);
  }
  return toAddressOrLabel(v);
}

function toValueOrRegister(v: number) {
  if (isRegister(v)) {
    return toRegister(v);
  }
  return toLabeledValue(v);
}

function decodeConditionals([value, address]: number[]) {
  return [ toValueOrRegister(value), toAddressOrLabel(address) ];
}

function decodeOneAddress([address]: number[]) {
  return [ toAddressOrLabel(address) ];
}

function decodeOneRegister([register]: number[]) {
  validateRegister(register);
  return [ toRegister(register) ];
}

function decodeRegisterAndValue([register, value]: number[]) {
  validateRegister(register);
  validateValue(value);
  return [ toRegister(register), toHexString(value) ];
}

function decodeRegisterOrAddress([registerOrAddress]: number[]) {
  return [ toAddressOrRegister(registerOrAddress) ];
}

function decodeRegisterOrValue([registerOrValue]: number[]) {
  return [ toValueOrRegister(registerOrValue) ];
}

function decodeTwoRegisterOrValue([registerOrValue1, registerOrValue2]: number[]) {
  return [ toValueOrRegister(registerOrValue1), toValueOrRegister(registerOrValue2) ];
}

function decodeRegisterAndTwoValues([register, first, second]: number[]) {
  validateRegister(register);
  validateValue(first);
  validateValue(second);
  return [ toRegister(register), toHexString(first), toHexString(second) ];
}

function decodeRegisterAndTwoValueOrRegister([register, first, second]: number[]) {
  return [ toRegister(register), toValueOrRegister(first), toValueOrRegister(second) ];
}

function decodeRegisterAndOneValueOrRegister([register, valueOrRegister]: number[]) {
  validateRegister(register);
  return [ toRegister(register), toValueOrRegister(valueOrRegister) ];
}

function safeStringFromCharCode(charCode: number) {
  return charCode === 10 ? "'\\n'" : `'${String.fromCharCode(charCode)}'`
}

const opcodes: OpcodeDefinition[] = [
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
    decodeParameters: ([value]) => {
      if (isRegister(value)) {
        return [ toRegister(value) ];
      }
      return [ safeStringFromCharCode(value) ];
    }
  },
  { value: 20, length: 2, name: "in",   decodeParameters: hexParams },
  { value: 21, length: 1, name: "noop", decodeParameters: hexParams },
]

function isData(address: number) {
  return (address >= 0x090d && address <= 0x0aad) || address >= 0x017b4
}

function invalidOpcode(address: number, value: number): DisassemblyResult {
  const label = labels.get(address);
  var decodedParameters;
  if (labels.isPointer(label)) {
    decodedParameters = [ toAddressOrLabel(value) ];
  } else {
    decodedParameters = [ `${value} ${safeStringFromCharCode(value)} ${labels.get(value)}` ];
  }

  return {
    address,
    opcode: { value, name: '???', length: 1 },
    rawParameters: [],
    decodedParameters,
    type: ResultType.Code
  };
}

function data(address: number, value: number) {
  const result = invalidOpcode(address, value);
  result.type = ResultType.Data;
  return result;
}

function disassembleAt(program: number[], address: number) {
  const value = program[address];

  if (isData(address) || value >= opcodes.length) {
    return data(address, value);
  }

  const opcode = opcodes[value];
  const rawParameters = program.slice(address+1, address+1+opcode.length-1);

  const result: DisassemblyResult = {
    address,
    opcode,
    rawParameters,
    decodedParameters: [],
    type: ResultType.Code
  };

  try {
    result.decodedParameters = opcode.decodeParameters(rawParameters);
  } catch(err) {
    console.error(new Error(`An error occured while decoding parameters for opcode ${JSON.stringify(result)}: ${err}`));
    return invalidOpcode(address, value);
  }

  return result;
}

export function printCodeAt(program: number[], address: number) {
  printCode(disassembleAt(program, address));
}

export function disassemble(program: number[], { startAddress = 0, maxAddress = program.length, callback = printCode } = {}) {
  let address = startAddress;
  while(address < maxAddress) {
    let result = disassembleAt(program, address);
    callback(result);
    address += result.opcode.length
  }
}

export function disassembleFile(file: string, options) {
  const program = loadProgram(file);
  disassemble(program, options);
}
