import { sprintf } from 'sprintf';

import { format } from '../labels';
import { DisassemblyResult } from './opcode';

export class GatherAddress {

  result: Map<number, string>

  constructor(existingLabels: Map<number, string>) {
    this.result = new Map(existingLabels);
  }

  start() {}

  callback(result: DisassemblyResult) {
    if (result.opcode.name === "???") { return; }

    const opcodeValue = result.opcode.value;
    let address: number;

    if (opcodeValue === 6 || opcodeValue === 17) {
      address = result.rawParameters[0];
    } else if (opcodeValue === 7 || opcodeValue === 8) {
      address = result.rawParameters[1];
    } else {
      return;
    }


    if (address < 0x8000 && !this.result.has(address)) {
      this.result.set(address, sprintf("label_%04x", address));
    }
  }

  end() {
    format(this.result);
  }
}
