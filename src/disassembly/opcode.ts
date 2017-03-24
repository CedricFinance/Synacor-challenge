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
  type: ResultType,
  address: number,

  /** The label for this item, empty string if none. */
  label: string,
  rawParameters: number[],
  opcode: Opcode,
  decodedParameters: any[]
}

export enum MergedResultKind {
  Array, String, Out
}

export interface MergedDisassemblyResult extends DisassemblyResult {
  kind: MergedResultKind
}
