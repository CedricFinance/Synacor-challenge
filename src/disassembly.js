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
  0x021f: "no_add",
  0x0234: "eq_test",
  0x023b: "no_eq",
  0x024e: "push_pop_test",
  0x0264: "gt_test",
  0x0279: "and_test",
  0x0284: "or_test",
  0x028f: "no_or",
  0x02ac: "not_test",
  0x02c0: "call_test",
  0x0432: "no_jt_jf",
  0x0445: "non_zero_register",
  0x045e: "no_set",
  0x0473: "no_gt",
  0x0486: "no_stack",
  0x0499: "no_and",
  0x04b8: "no_not",
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

function validateRegister(register) {
  if (register < 32768 || register > 32775) {
    throw new Error(`Invalid register ${toHexString(register)}`)
  }
}

function validateValue(value) {
  if (value >= 32768) {
    throw new Error(`Invalid value ${toHexString(value)}`)
  }
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
    return toHexString(v);
  }
  return toRegister(v);
}

function decodeConditionals([value, address]) {
  return [ toValueOrRegister(value), toAddressOrLabel(address) ];
}

function decodeOneAddress([address]) {
  return [ toAddressOrLabel(address) ];
}

function decodeOneRegister([register]) {
  validateRegister(register);
  return [ toRegister(register) ];
}

function decodeRegisterAndValue([register, value]) {
  validateRegister(register);
  validateValue(value);
  return [ toRegister(register), toHexString(value) ];
}

function decodeRegisterOrValue([registerOrValue]) {
  return [ toValueOrRegister(registerOrValue) ];
}

function decodeTwoRegisterOrValue([registerOrValue1, registerOrValue2]) {
  return [ toValueOrRegister(registerOrValue1), toValueOrRegister(registerOrValue2) ];
}

function decodeRegisterAndTwoValues([register, first, second]) {
  validateRegister(register);
  validateValue(first);
  validateValue(second);
  return [ toRegister(register), toHexString(first), toHexString(second) ];
}

function decodeRegisterAndTwoValueOrRegister([register, first, second]) {
  return [ toRegister(register), toValueOrRegister(first), toValueOrRegister(second) ];
}

function decodeRegisterAndOneValueOrRegister([register, valueOrRegister]) {
  validateRegister(register);
  return [ toRegister(register), toValueOrRegister(valueOrRegister) ];
}

const opcodes = [
  { value: 0,  length: 1, name: "halt", decodeParameters: hexParams },
  { value: 1,  length: 3, name: "set",  decodeParameters: decodeRegisterAndOneValueOrRegister },
  { value: 2,  length: 2, name: "push", decodeParameters: decodeRegisterOrValue },
  { value: 3,  length: 2, name: "pop",  decodeParameters: decodeOneRegister },
  { value: 4,  length: 4, name: "eq",   decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 5,  length: 4, name: "gt",   decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 6,  length: 2, name: "jmp",  decodeParameters: decodeOneAddress },
  { value: 7,  length: 3, name: "jt",   decodeParameters: decodeConditionals },
  { value: 8,  length: 3, name: "jf",   decodeParameters: decodeConditionals },
  { value: 9,  length: 4, name: "add",  decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 10, length: 4, name: "mult", decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 11, length: 4, name: "mod",  decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 12, length: 4, name: "and",  decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 13, length: 4, name: "or",   decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 14, length: 3, name: "not",  decodeParameters: decodeRegisterAndOneValueOrRegister },
  { value: 15, length: 3, name: "rmem", decodeParameters: decodeTwoRegisterOrValue },
  { value: 16, length: 3, name: "wmem", decodeParameters: decodeTwoRegisterOrValue },
  { value: 17, length: 2, name: "call", decodeParameters: decodeRegisterOrValue },
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
  };

  try {
    result.decodedParameters = opcode.decodeParameters(rawParameters).join(" ");
  } catch(err) {
    throw new Error(`An error occured while decoding parameters for opcode ${JSON.stringify(result)}: ${err}`);
  }

  return result;
}

function printCodeAt(program, address) {
  printCode(disassembleAt(program, address));
}

module.exports = {
  disassemble,
  printCodeAt
}