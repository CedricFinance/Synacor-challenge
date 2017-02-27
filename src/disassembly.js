const sprintf = require('sprintf').sprintf;

const labels = {
  0x015b: "jmp_test_1",
  0x0170: "bad_jmp_minus_2",
  0x018d: "bad_jmp_minus_1",
  0x01a8: "bad_jmp_plus_1",
  0x01c5: "bad_jmp_plus_2",
  0x0166: "jmp_test_2",
  0x01e4: "jt_test_no_jump",
  0x01e7: "jf_test_no_jump",
  0x01ea: "jt_test_jump",
  0x01ef: "jf_test_jump",
  0x01f4: "r0_initial_value",
  0x01f7: "r1_initial_value",
  0x01fa: "r2_initial_value",
  0x01fd: "r3_initial_value",
  0x0200: "r4_initial_value",
  0x0203: "r5_initial_value",
  0x0206: "r6_initial_value",
  0x0209: "r7_initial_value",
  0x0432: "no_jt_jf",
  0x0445: "non_zero_register",
  0x045e: "no_set",
}

function labelFor(address) {
  return labels[address] || "";
}

function toHexString(value) {
  return typeof value !== "undefined" ? sprintf("%04x", value) : ""
}

function printCode(result) {
  console.log(sprintf("0x%06x %04x %4s %4s %4s %-24s %s %s",
    result.address,
    result.opcode.value,
    toHexString(result.rawParameters[0]),
    toHexString(result.rawParameters[1]),
    toHexString(result.rawParameters[2]),
    labelFor(result.address),
    result.opcode.name,
    result.decodedParameters
  ));
}

function mergeOutOpcode(mergedOut, result) {
  if (typeof mergedOut === "undefined") {
    mergedOut = {
      address: result.address,
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
      printCode(result);
    }

    address += result.opcode.length
  }
}

function hexParams(params) {
  return params.map(toHexString);
}

function toAddressOrLabel(address) {
  const label = labelFor(address);

  if (label.length > 0) {
    return label;
  }

  return toHexString(address);
}

function toRegister(v) {
  return "r"+(v-32768);
}

function toValueOrRegister(v) {
  if (v < 32768) {
    return sprintf("%04x", v);
  }
  return toRegister(v);
}

function decodeConditionals([value, address]) {
  return [ toValueOrRegister(value), toAddressOrLabel(address) ];
}

function decodeOneAddress([address]) {
  return [ toAddressOrLabel(address) ];
}

function decodeRegisterAndValue([register, value]) {
  return [ toRegister(register), value ];
}

const opcodes = [
  { value: 0,  length: 1, name: "halt", decodeParameters: hexParams },
  { value: 1,  length: 3, name: "set",  decodeParameters: decodeRegisterAndValue },
  { value: 2,  length: 2, name: "push", decodeParameters: hexParams },
  { value: 3,  length: 2, name: "pop",  decodeParameters: hexParams },
  { value: 4,  length: 4, name: "eq",   decodeParameters: hexParams },
  { value: 5,  length: 4, name: "gt",   decodeParameters: hexParams },
  { value: 6,  length: 2, name: "jmp",  decodeParameters: decodeOneAddress },
  { value: 7,  length: 3, name: "jt",   decodeParameters: decodeConditionals },
  { value: 8,  length: 3, name: "jf",   decodeParameters: decodeConditionals },
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
      address,
      opcode: { value, name: '???', length: 1 },
      rawParameters: [],
      decodedParameters: []
    }
  }

  const opcode = opcodes[value];
  const rawParameters = program.slice(address+1, address+1+opcode.length-1);

  const result = {
    address,
    opcode,
    rawParameters,
    decodedParameters: opcode.decodeParameters(rawParameters).join(" ")
  };

  return result;
}

module.exports = {
  disassemble
}