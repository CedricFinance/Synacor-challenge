import { sprintf } from 'sprintf';

import { DisassemblyResult, ResultType } from './opcode';
import * as labels from '../labels';
import opcodes, { DecodeParameter } from './opcodes';

function toHexString(value: number): string {
  return typeof value !== "undefined" ? sprintf("%04x", value) : ""
}

function safeStringFromCharCode(charCode: number) {
  return charCode === 10 ? "'\\n'" : `'${String.fromCharCode(charCode)}'`
}

function toAddressOrLabel(address: number) {
  const label = labels.get(address);

  if (label.length > 0) {
    return label;
  }

  return toHexString(address);
}

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
    type: ResultType.Code,
    address,
    label,
    opcode: { value, name: '???', length: 1 },
    rawParameters: [],
    decodedParameters
  };
}

function data(address: number, value: number) {
  const result = invalidOpcode(address, value);
  result.type = ResultType.Data;
  return result;
}

export function disassembleAt(program: number[], address: number) {
  const value = program[address];

  if (isData(address) || value >= opcodes.length) {
    return data(address, value);
  }

  const opcode = opcodes[value];
  const rawParameters = program.slice(address+1, address+1+opcode.length-1);

  const result: DisassemblyResult = {
    type: ResultType.Code,
    label: labels.get(address),
    address,
    opcode,
    rawParameters,
    decodedParameters: []
  };

  try {
    if (opcode.decodeParameters) {
      result.decodedParameters = opcode.decodeParameters(rawParameters);
    } else {
      result.decodedParameters = result.rawParameters.map( (value, index) => DecodeParameter(opcode.parameterTypes[index], value));
    }
  } catch(err) {
    //console.error(new Error(`An error occured while decoding parameters for opcode ${JSON.stringify(result)}: ${err}`));
    return invalidOpcode(address, value);
  }

  return result;
}

export default class Disassembler {

  private program: number[];
  private startAddress: number;
  private maxAddress: number;

  constructor(program: number[], { startAddress = 0, maxAddress = program.length } = {}) {
    this.program = program;
    this.startAddress = startAddress;
    this.maxAddress = maxAddress;
  }

  run() {
    return this.disassemble();
  }

  private disassemble() {
    const results: DisassemblyResult[] = [];
    let address = this.startAddress;
    while(address < this.maxAddress) {
      let result = disassembleAt(this.program, address);
      results.push(result);
      address += result.opcode.length
    }
    return results;
  }

}