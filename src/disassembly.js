const sprintf = require('sprintf').sprintf;

function toHexString(value) {
  return typeof value !== "undefined" ? sprintf("%04x", value) : ""
}

function printCode(address, result) {
  console.log(sprintf("0x%06x %04x %4s %4s %4s %s %s",
    address,
    result.opcode.value,
    toHexString(result.rawParameters[0]),
    toHexString(result.rawParameters[1]),
    toHexString(result.rawParameters[2]),
    result.opcode.name,
    result.decodedParameters
  ));
}

function mergeOutOpcode(mergedOut, result) {
  if (typeof mergedOut === "undefined") {
    mergedOut = {
      opcode: result.opcode,
      rawParameters: result.rawParameters.slice(0),
      decodedParameters: ["''"]
    };
  }

  mergedOut.decodedParameters[0] = mergedOut.decodedParameters[0].slice(0, mergedOut.decodedParameters[0].length-1) + result.decodedParameters.slice(1);
  return mergedOut;
}

function disassemble(program, startAddress, maxAddress) {
  let address = startAddress;
  let mergedOut;
  while(address < maxAddress) {
    let print = true;
    let result = disassembleAt(program, address);

    if (result.opcode.value === 19) {
      mergedOut = mergeOutOpcode(mergedOut, result);

      if (result.rawParameters[0] === 10) {
        result = mergedOut;
        mergedOut = undefined;
      } else {
        print = false;
      }
    }

    if (print) {
      printCode(address, result);
    }

    address += result.opcode.length
  }
}

function hexParams(params) {
  return params.map(toHexString);
}

const opcodes = [
  { value: 0,  length: 1, name: "halt", decodeParameters: hexParams },
  { value: 1,  length: 3, name: "set",  decodeParameters: hexParams },
  { value: 2,  length: 2, name: "push", decodeParameters: hexParams },
  { value: 3,  length: 2, name: "pop",  decodeParameters: hexParams },
  { value: 4,  length: 4, name: "eq",   decodeParameters: hexParams },
  { value: 5,  length: 4, name: "gt",   decodeParameters: hexParams },
  { value: 6,  length: 2, name: "jmp",  decodeParameters: hexParams },
  { value: 7,  length: 3, name: "jt",   decodeParameters: hexParams },
  { value: 8,  length: 3, name: "jf",   decodeParameters: hexParams },
  { value: 9,  length: 4, name: "add",  decodeParameters: hexParams },
  { value: 10, length: 4, name: "mult", decodeParameters: hexParams },
  { value: 11, length: 4, name: "mod",  decodeParameters: hexParams },
  { value: 12, length: 4, name: "and",  decodeParameters: hexParams },
  { value: 13, length: 4, name: "or",   decodeParameters: hexParams },
  { value: 14, length: 3, name: "not",  decodeParameters: hexParams },
  { value: 15, length: 3, name: "rmem", decodeParameters: hexParams },
  { value: 16, length: 3, name: "wmem", decodeParameters: hexParams },
  { value: 17, length: 2, name: "call", decodeParameters: hexParams },
  { value: 18, length: 1, name: "ret",  decodeParameters: hexParams },
  { value: 19, length: 2, name: "out",
    decodeParameters: ([charCode]) => {
      const str = charCode === 10 ? "'\\n'" : `'${String.fromCharCode(charCode)}'`;
      return [ str ];
    }
  },
  { value: 20, length: 2, name: "in",   decodeParameters: hexParams },
  { value: 21, length: 1, name: "noop", decodeParameters: hexParams },
]

function disassembleAt(program, address) {
  const value = program[address];

  if (value > opcodes.length) {
    return {
      opcode: { value, name: '???', length: 1 },
      rawParameters: [],
      decodedParameters: []
    }
  }

  const opcode = opcodes[value];
  const rawParameters = program.slice(address+1, address+1+opcode.length-1);

  const result = {
    opcode,
    rawParameters,
    decodedParameters: opcode.decodeParameters(rawParameters).join(" ")
  };

  return result;
}

module.exports = {
  disassemble
}