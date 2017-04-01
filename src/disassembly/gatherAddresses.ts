import { sprintf } from 'sprintf';

import { Labels } from '../labels';
import { DisassemblyResult } from './opcode';

export class GatherAddress {

  labels: Labels

  constructor(existingLabels: Labels) {
    this.labels = existingLabels;
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


    if (address < 0x8000 && !this.labels.has(address)) {
      this.labels.set(address, sprintf("label_%04x", address));
    }
  }

  end() {
    console.log(this.labels.toJSON());
  }
}
