import { sprintf } from 'sprintf';
import * as chalk from 'chalk';

import * as labels from '../labels';
import { DisassemblyResult, MergedDisassemblyResult, ResultType, MergedResultKind } from './opcode';

const HALT =  0;
const RET  = 18;

const newlineOpcodes = [ HALT, RET];

function toHexString(value: number) {
  return typeof value !== "undefined" ? sprintf("%04x", value) : ""
}

function newLineBefore(result: DisassemblyResult) {
  return result.label.length > 0 && !result.label.startsWith("_");
}

export class Printer {
  mergedOut: MergedDisassemblyResult;
  private emptyLine = false;


  /** Print the disassembly result
    * Consecutive out opcode are merged (the same for arrays and strings).
    */
  printCode(result: DisassemblyResult) {
    console.log(this.formatCode(result).join("\n"));
  }

  formatCode(result: DisassemblyResult) {
    var lines: string[] = [];

    if (this.mergedOut) {
      if (this.mergedOut.canMerge(result)) {
        this.mergedOut.merge(result);

        if (this.mergedOut.isStopped()) {
          lines = lines.concat(this.formatResult(this.mergedOut));
          this.mergedOut = undefined;
        }

        return lines;
      }

      lines = lines.concat(this.formatResult(this.mergedOut));
      this.mergedOut = undefined;
    }

    if (MergedDisassemblyResult.startMerge(result)) {
      this.mergedOut = new MergedDisassemblyResult(result);
    } else {
      lines = lines.concat(this.formatResult(result));
    }

    return lines;
  }

  formatResult(result: DisassemblyResult) {
    var lines: string[] = [];

    if (!this.emptyLine && newLineBefore(result)) {
      lines.push("");
    }

    this.emptyLine = false;

    const chalkColor = result.type === ResultType.Code ? chalk.cyan : chalk.green;

    lines.push(chalkColor(sprintf("0x%06x %04x %4s %4s %4s %-36s %s",
      result.address,
      result.opcode.value,
      toHexString(result.rawParameters[0]),
      toHexString(result.rawParameters[1]),
      toHexString(result.rawParameters[2]),
      result.label,
      result.toCode()
    )));

    if (result.opcode.name !== "???" && newlineOpcodes.includes(result.opcode.value)) {
      lines.push("");
      this.emptyLine = true;
    }

    return lines;
  }
}

export class CodePrinter {
  private printer: Printer;

  constructor() {
    this.printer = new Printer();
  }

  start() {}

  callback(result: DisassemblyResult) {
    this.printer.printCode(result);
  }

  end() {
    if (this.printer.mergedOut) {
      console.log(this.printer.formatResult(null));
    }
  }
}
