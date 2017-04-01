import { loadProgram } from '../loader';
import { Printer } from './print';
import Disassembler, { disassembleAt } from './disassembler';
import { Labels } from '../labels';

export function disassemble(program: number[], labels: Labels, { startAddress = 0, maxAddress = program.length, callback = undefined } = {}) {
  if (typeof callback === "undefined") {
    const printer = new Printer();
    callback = r => printer.printCode(r);
  }
  const disassembledProgram = new Disassembler(program, labels, { startAddress, maxAddress }).run();
  disassembledProgram.forEach(callback);
}

export function printCodeAt(program: number[], address: number, labels: Labels) {
  new Printer().printCode(disassembleAt(program, address, { labels }));
}

export function disassembleFile(file: string, labels: Labels, options) {
  disassemble(loadProgram(file), labels, options);
}
