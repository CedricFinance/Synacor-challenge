import { loadProgram } from '../loader';
import { printCode } from './print';
import Disassembler, { disassembleAt } from './disassembler';

export function disassemble(program: number[], { startAddress = 0, maxAddress = program.length, callback = printCode } = {}) {
  const disassembledProgram = new Disassembler(program, { startAddress, maxAddress }).run();
  disassembledProgram.forEach(callback);
}

export function printCodeAt(program: number[], address: number) {
  printCode(disassembleAt(program, address));
}

export function disassembleFile(file: string, options) {
  disassemble(loadProgram(file), options);
}
