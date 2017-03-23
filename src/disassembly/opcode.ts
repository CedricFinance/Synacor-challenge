interface Opcode {
  name: string
  value: number
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