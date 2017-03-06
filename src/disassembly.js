const sprintf = require('sprintf').sprintf;

const HALT = 0;
const RET = 18;

const labels = {
  0x015b: "test_jmp_1",
  0x0170: "err_jmp_minus_2",
  0x018d: "err_jmp_minus_1",
  0x01a8: "err_jmp_plus_1",
  0x01c5: "err_jmp_plus_2",
  0x0166: "test_jmp_2",
  0x01e4: "test_jt_no_jump",
  0x01e7: "test_jf_no_jump",
  0x01ea: "test_jt_jump",
  0x01ef: "test_jf_jump",
  0x01f4: "test_r0_initial_value",
  0x01f7: "test_r1_initial_value",
  0x01fa: "test_r2_initial_value",
  0x01fd: "test_r3_initial_value",
  0x0200: "test_r4_initial_value",
  0x0203: "test_r5_initial_value",
  0x0206: "test_r6_initial_value",
  0x0209: "test_r7_initial_value",
  0x021f: "err_no_add",
  0x0234: "test_eq",
  0x023b: "err_no_eq",
  0x024e: "test_push_pop",
  0x0264: "test_gt",
  0x0279: "test_and",
  0x0284: "test_or",
  0x028f: "err_no_or",
  0x02ac: "test_not",
  0x02c0: "test_call_with_address",
  0x02c4: "verify_stack",
  0x02d4: "test_call_with_register",
  0x02db: "verify_stack_2",
  0x02eb: "test_add_modulo",
  0x030b: "test_mult",
  0x0328: "test_mod",
  0x034b: "rmem_data",
  0x034d: "test_rmem",
  0x0365: "test_wmem",
  0x03ad: "err_wmem",
  0x0432: "err_no_jt_jf",
  0x0445: "err_non_zero_register",
  0x045e: "err_no_set",
  0x0473: "err_no_gt",
  0x0486: "err_no_stack",
  0x0499: "err_no_and",
  0x04b8: "err_no_not",
  0x04d7: "err_no_rmem",
  0x04ee: "err_no_wmem",
  0x0505: "jumping_function",
  0x0507: "jumping_function_2",
  0x0509: "err_no_call",
  0x0520: "err_no_modulo_add_mult",
  0x0565: "err_no_hitchhiking",
  0x0586: "err_no_mult",
  0x059d: "err_no_mod",
  0x06bb: "fct_XXX_decrypt",
  0x17b4: "data_??"
}

function labelFor(address) {
  return labels[address] || "";
}

function toHexString(value) {
  return typeof value !== "undefined" ? sprintf("%04x", value) : ""
}

var mergedOut;

function printCode2(result) {
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

  if (result.opcode.value === HALT || result.opcode.value === RET) {
    console.log();
  }
}

function canMerge(result) {
  return labelFor(result.address).length === 0 && result.opcode.value === 19;
}

function startMerge(result) {
  return result.opcode.value === 19 && !endMerge(result);
}

function endMerge(result) {
  return result.rawParameters[0] === 10;
}

function printCode(result) {
  if (mergedOut) {
    if (canMerge(result)) {
      mergedOut = mergeOutOpcode(mergedOut, result);

      if (endMerge(result)) {
        printCode2(mergedOut);
        mergedOut = undefined;
      }

      return;
    }

    printCode2(mergedOut);
    mergedOut = undefined;
  }

  if (startMerge(result)) {
    mergedOut = mergeOutOpcode(mergedOut, result);
  } else {
    printCode2(result);
  }
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
  while(address < maxAddress) {
    let result = disassembleAt(program, address);
    printCode(result);
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

function toLabeledValue(address) {
  let suffix = '';
  const label = labelFor(address);

  if (label.length > 0) {
    suffix = ` /* = ${label} */`;
  }

  return toHexString(address)+suffix;
}

function toRegister(v) {
  return "r"+(v-32768);
}

function toAddressOrRegister(v) {
  if (v < 32768) {
    return toAddressOrLabel(v);
  }
  return toRegister(v);
}

function toValueOrRegister(v) {
  if (v < 32768) {
    return toLabeledValue(v);
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

function decodeRegisterOrAddress([registerOrAddress]) {
  return [ toAddressOrRegister(registerOrAddress) ];
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
  { value: 15, length: 3, name: "rmem", decodeParameters: ([a,b]) => [toRegister(a), toAddressOrRegister(b)] },
  { value: 16, length: 3, name: "wmem", decodeParameters: decodeTwoRegisterOrValue },
  { value: 17, length: 2, name: "call", decodeParameters: decodeRegisterOrAddress },
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

  if (value >= opcodes.length) {
    return {
      address,
      opcode: { value, name: '???', length: 1 },
      rawParameters: [],
      decodedParameters: `${value} '${String.fromCharCode(value)}'`
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
    console.error(new Error(`An error occured while decoding parameters for opcode ${JSON.stringify(result)}: ${err}`));
    return {
      address,
      opcode: { value, name: '???', length: 1 },
      rawParameters: [],
      decodedParameters: `${value} '${String.fromCharCode(value)}'`
    }
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