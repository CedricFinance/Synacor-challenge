interface Opcode {
  name: string
  value: number,
  /** The length in words */
  length: number
}

export enum ResultType {
  Code, Data
}

export class DisassemblyResult {
  type: ResultType;
  address: number;

  /** The label for this item, empty string if none. */
  label: string;
  rawParameters: number[];
  opcode: Opcode;
  decodedParameters: any[];

  constructor(type: ResultType, address: number, label: string, opcode: Opcode, rawParameters: number[], decodedParameters: any[]) {
    this.type = type;
    this.address = address;
    this.label = label;
    this.opcode = opcode;
    this.rawParameters = rawParameters;
    this.decodedParameters = decodedParameters;
  }
}

export enum MergedResultKind {
  Array, String, Out
}

import * as labels from '../labels';

function getKind(result: DisassemblyResult) {
  const label = labels.get(result.address);
  if (label.startsWith("a_")) {
    return MergedResultKind.Array;
  }
  if (label.startsWith("s_")) {
    return MergedResultKind.String;
  }
  return MergedResultKind.Out;
}

export class MergedDisassemblyResult extends DisassemblyResult {
  kind: MergedResultKind;

  constructor(result: DisassemblyResult) {
    super(result.type, result.address, result.label, result.opcode, result.rawParameters, result.decodedParameters);
    this.kind = getKind(result);
  }
}
