import { sprintf } from 'sprintf';

import * as labels from '../labels';
import * as parameters from './parameters';

enum ParameterType {
  Register,
  Address,
  Value,
  Character
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
        case ParameterType.Character:
          return new parameters.Character(value);
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

const opcodes: OpcodeDefinition[] = [
  { value: 0,  length: 1, name: "halt", parameterTypes: [] },
  { value: 1,  length: 3, name: "set",  parameterTypes: [ ParameterType.Register, [ParameterType.Register, ParameterType.Value]] },
  { value: 2,  length: 2, name: "push", parameterTypes: [ [ParameterType.Register, ParameterType.Value] ] },
  { value: 3,  length: 2, name: "pop",  parameterTypes: [ ParameterType.Register ] },
  { value: 4,  length: 4, name: "eq",   parameterTypes: [ ParameterType.Register, [ParameterType.Register, ParameterType.Value], [ParameterType.Register, ParameterType.Value]] },
  { value: 5,  length: 4, name: "gt",   parameterTypes: [ ParameterType.Register, [ParameterType.Register, ParameterType.Value], [ParameterType.Register, ParameterType.Value]] },
  { value: 6,  length: 2, name: "jmp",  parameterTypes: [ ParameterType.Address ] },
  { value: 7,  length: 3, name: "jt",   parameterTypes: [ [ParameterType.Register, ParameterType.Value], ParameterType.Address] },
  { value: 8,  length: 3, name: "jf",   parameterTypes: [ [ParameterType.Register, ParameterType.Value], ParameterType.Address] },
  { value: 9,  length: 4, name: "add",  parameterTypes: [ ParameterType.Register, [ParameterType.Register, ParameterType.Value], [ParameterType.Register, ParameterType.Value]] },
  { value: 10, length: 4, name: "mult", parameterTypes: [ ParameterType.Register, [ParameterType.Register, ParameterType.Value], [ParameterType.Register, ParameterType.Value]] },
  { value: 11, length: 4, name: "mod",  parameterTypes: [ ParameterType.Register, [ParameterType.Register, ParameterType.Value], [ParameterType.Register, ParameterType.Value]] },
  { value: 12, length: 4, name: "and",  parameterTypes: [ ParameterType.Register, [ParameterType.Register, ParameterType.Value], [ParameterType.Register, ParameterType.Value]] },
  { value: 13, length: 4, name: "or",   parameterTypes: [ ParameterType.Register, [ParameterType.Register, ParameterType.Value], [ParameterType.Register, ParameterType.Value]] },
  { value: 14, length: 3, name: "not",  parameterTypes: [ ParameterType.Register, [ParameterType.Register, ParameterType.Value]] },
  { value: 15, length: 3, name: "rmem", parameterTypes: [ ParameterType.Register, [ParameterType.Register, ParameterType.Address]] },
  { value: 16, length: 3, name: "wmem", parameterTypes: [ [ParameterType.Register, ParameterType.Value], [ParameterType.Register, ParameterType.Value]] },
  { value: 17, length: 2, name: "call", parameterTypes: [ [ParameterType.Register, ParameterType.Address] ] },
  { value: 18, length: 1, name: "ret",  parameterTypes: [] },
  { value: 19, length: 2, name: "out",  parameterTypes: [ [ParameterType.Register, ParameterType.Character] ] },
  { value: 20, length: 2, name: "in",   parameterTypes: [ ParameterType.Register ] },
  { value: 21, length: 1, name: "noop", parameterTypes: [] },
];

export default opcodes;
