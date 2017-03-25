import { sprintf } from 'sprintf';

import * as labels from '../labels';
import * as parameters from './parameters';

enum ParameterType {
  Register,
  Address,
  Value
}


export function DecodeParameter(parameterType: ParameterType|ParameterType[], value: number) {
  var types: ParameterType[];

  if (!Array.isArray(parameterType)) {
    types = [ parameterType ];
  } else {
    types = parameterType;
  }

  const errors: string[] = [];

  for(var type of types) {
    try {
      switch(type) {
        case ParameterType.Register:
          return new parameters.Register(value);
        case ParameterType.Address:
          return new parameters.Address(value);
        case ParameterType.Value:
          return new parameters.Value(value);
      }
    } catch(error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }
  }

  throw new Error("Failed to decode parameter: " + errors.join(". "));
}

export interface OpcodeDefinition {
  value: number,
  name: string,
  length: number,
  decodeParameters?: { (parameters: number[]): string[] },
  parameterTypes?: Array<ParameterType|ParameterType[]>
}

function toHexString(value: number): string {
  return typeof value !== "undefined" ? sprintf("%04x", value) : ""
}

function isRegister(value: number) {
  return value >= 32768 && value <= 32775;
}

function validateRegister(register: number) {
  if (!isRegister(register)) {
    throw new Error(`Invalid register ${toHexString(register)}`)
  }
}

function validateValue(value: number) {
  if (value >= 32768) {
    throw new Error(`Invalid value ${toHexString(value)}`)
  }
}

function toAddressOrLabel(address: number) {
  const label = labels.get(address);

  if (label.length > 0) {
    return label;
  }

  return toHexString(address);
}

function toLabeledValue(address: number) {
  let suffix = '';
  const label = labels.get(address);

  if (label.length > 0) {
    suffix = ` /* = ${label} */`;
  }

  return toHexString(address)+suffix;
}

function toRegister(v: number) {
  validateRegister(v);
  return "r"+(v-32768);
}

function toAddressOrRegister(v: number) {
  if (isRegister(v)) {
    return toRegister(v);
  }
  return toAddressOrLabel(v);
}

function toValueOrRegister(v: number) {
  if (isRegister(v)) {
    return toRegister(v);
  }
  return toLabeledValue(v);
}

function decodeRegisterOrAddress([registerOrAddress]: number[]) {
  return [ toAddressOrRegister(registerOrAddress) ];
}

function decodeRegisterOrValue([registerOrValue]: number[]) {
  return [ toValueOrRegister(registerOrValue) ];
}

function decodeTwoRegisterOrValue([registerOrValue1, registerOrValue2]: number[]) {
  return [ toValueOrRegister(registerOrValue1), toValueOrRegister(registerOrValue2) ];
}

function decodeRegisterAndTwoValueOrRegister([register, first, second]: number[]) {
  return [ toRegister(register), toValueOrRegister(first), toValueOrRegister(second) ];
}

function decodeRegisterAndOneValueOrRegister([register, valueOrRegister]: number[]) {
  validateRegister(register);
  return [ toRegister(register), toValueOrRegister(valueOrRegister) ];
}

function safeStringFromCharCode(charCode: number) {
  return charCode === 10 ? "'\\n'" : `'${String.fromCharCode(charCode)}'`
}

const opcodes: OpcodeDefinition[] = [
  { value: 0,  length: 1, name: "halt", parameterTypes: [] },
  { value: 1,  length: 3, name: "set",  decodeParameters: decodeRegisterAndOneValueOrRegister },
  { value: 2,  length: 2, name: "push", decodeParameters: decodeRegisterOrValue },
  { value: 3,  length: 2, name: "pop",  parameterTypes: [ ParameterType.Register ] },
  { value: 4,  length: 4, name: "eq",   decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 5,  length: 4, name: "gt",   decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 6,  length: 2, name: "jmp",  parameterTypes: [ ParameterType.Address ] },
  { value: 7,  length: 3, name: "jt",   parameterTypes: [ [ParameterType.Register, ParameterType.Value], ParameterType.Address] },
  { value: 8,  length: 3, name: "jf",   parameterTypes: [ [ParameterType.Register, ParameterType.Value], ParameterType.Address] },
  { value: 9,  length: 4, name: "add",  decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 10, length: 4, name: "mult", decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 11, length: 4, name: "mod",  decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 12, length: 4, name: "and",  decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 13, length: 4, name: "or",   decodeParameters: decodeRegisterAndTwoValueOrRegister },
  { value: 14, length: 3, name: "not",  decodeParameters: decodeRegisterAndOneValueOrRegister },
  { value: 15, length: 3, name: "rmem", decodeParameters: ([a,b]) => [toRegister(a), toAddressOrRegister(b)] },
  { value: 16, length: 3, name: "wmem", decodeParameters: decodeTwoRegisterOrValue },
  { value: 17, length: 2, name: "call", decodeParameters: decodeRegisterOrAddress },
  { value: 18, length: 1, name: "ret",  parameterTypes: [] },
  { value: 19, length: 2, name: "out",
    decodeParameters: ([value]) => {
      if (isRegister(value)) {
        return [ toRegister(value) ];
      }
      return [ safeStringFromCharCode(value) ];
    }
  },
  { value: 20, length: 2, name: "in",   parameterTypes: [ ParameterType.Register ] },
  { value: 21, length: 1, name: "noop", parameterTypes: [] },
];

export default opcodes;
