import { sprintf } from 'sprintf';

import { DisassemblyResult, ResultType, DisassemblyContext } from './opcode';
import { Labels } from '../labels';
import opcodes, { DecodeParameter } from './opcodes';
import { Address, Data } from './parameters';

function isData(address: number) {
  return (address >= 0x090d && address <= 0x0aad) || address >= 0x017b4
}

function invalidOpcode(address: number, value: number, context: DisassemblyContext): DisassemblyResult {
  const label = context.labels.get(address);
  var decodedParameters;
  if (Labels.isPointer(label)) {
    decodedParameters = [ new Address(value) ];
  } else {
    decodedParameters = [ new Data(value) ];
  }

  return new DisassemblyResult(
    ResultType.Code,
    address,
    label,
    { value, name: '???', length: 1 },
    [],
    decodedParameters
  );
}

function data(address: number, value: number, context: DisassemblyContext) {
  const result = invalidOpcode(address, value, context);
  result.type = ResultType.Data;
  return result;
}

export function disassembleAt(program: number[], address: number, context: DisassemblyContext) {
  const value = program[address];

  if (isData(address) || value >= opcodes.length) {
    return data(address, value, context);
  }

  const opcode = opcodes[value];
  const rawParameters = program.slice(address+1, address+1+opcode.length-1);

  const result: DisassemblyResult = new DisassemblyResult(
    ResultType.Code,
    address,
    context.labels.get(address),
    opcode,
    rawParameters,
    []
  );

  try {
    result.decodedParameters = result.rawParameters.map( (value, index) => DecodeParameter(opcode.parameterTypes[index], value));
  } catch(err) {
    //console.error(new Error(`An error occured while decoding parameters for opcode ${JSON.stringify(result)}: ${err}`));
    return invalidOpcode(address, value, context);
  }

  return result;
}

export default class Disassembler {

  private program: number[];
  private startAddress: number;
  private maxAddress: number;
  private context: DisassemblyContext;

  constructor(program: number[], labels: Labels, { startAddress = 0, maxAddress = program.length } = {}) {
    this.program = program;
    this.startAddress = startAddress;
    this.maxAddress = maxAddress;
    this.context = { labels };
  }

  run() {
    return this.disassemble();
  }

  private disassemble() {
    const results: DisassemblyResult[] = [];
    let address = this.startAddress;
    while(address < this.maxAddress) {
      let result = disassembleAt(this.program, address, this.context);
      results.push(result);
      address += result.opcode.length
    }
    return results;
  }

}