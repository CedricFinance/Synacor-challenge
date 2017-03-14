const { format } = require('../labels');

class GatherAddress {

  constructor(existingLabels) {
    this.result = new Map(existingLabels);
  }

  start() {}

  callback(result) {
    if (result.opcode.name === "???") { return; }

    const opcodeValue = result.opcode.value;
    let address;

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

module.exports = {
  GatherAddress
};