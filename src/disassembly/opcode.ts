interface Opcode {
  name: string
  value: number,
  /** The length in words */
  length: number
}

export enum ResultType {
  Code, Data
}

export interface DisassemblyResult {
  opcode: Opcode,
  address: number,
  rawParameters: number[],
  decodedParameters: any[],
  type: ResultType
}

export enum MergedResultKind {
  Array, String, Out
}

export interface MergedDisassemblyResult extends DisassemblyResult {
  kind: MergedResultKind
}

export interface OpcodeDefinition {
  value: number,
  name: string,
  length: number,
  decodeParameters: { (parameters: number[]): string[] }
}