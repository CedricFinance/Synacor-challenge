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

  toCode() {
    var codeParts: string[] = [];

    if (this.opcode.name !== "???") {
      codeParts.push(this.opcode.name);
    }

    if (this.decodedParameters.length > 0) {
      codeParts.push(this.decodedParameters.map(p => p.toString({ labels })).join(" "));
    }

    return codeParts.join(" ");
  }
}

export enum MergedResultKind {
  Array, String, Out
}

import * as labels from '../labels';

function getKind(result: DisassemblyResult) {
  const label = result.label;
  if (label.startsWith("a_")) {
    return MergedResultKind.Array;
  }
  if (label.startsWith("s_")) {
    return MergedResultKind.String;
  }
  return MergedResultKind.Out;
}

function safeStringFromCharCode(charCode: number) {
  return charCode === 10 ? "'\\n'" : `'${String.fromCharCode(charCode)}'`
}

function toLabeledValue(address: number) {
  let suffix = '';
  const label = labels.get(address);

  if (label.length > 0) {
    suffix = ` /* = ${label} */`;
  }

  return `${address}${suffix}`;
}

function isRegister(value: number) {
  return value >= 32768 && value <= 32775;
}

export class MergedDisassemblyResult extends DisassemblyResult {
  kind: MergedResultKind;
  private stopped: boolean;

  constructor(result: DisassemblyResult) {
    super(result.type, result.address, result.label, result.opcode, result.rawParameters, result.decodedParameters);
    this.kind = getKind(result);
    this.stopped = false;

    if (this.kind === MergedResultKind.Array) {
      this.decodedParameters = [[]];
    } else {
      this.decodedParameters = ["''"];
    }

    if (this.kind !== MergedResultKind.Array && this.kind !== MergedResultKind.String)
    {
      this.rawParameters.push(result.rawParameters[0]);
      this.decodedParameters[0] = this.decodedParameters[0].toString().slice(0, this.decodedParameters[0].length-1) + result.decodedParameters[0].toString().slice(1);
    }
  }

  canMerge(result: DisassemblyResult) {
    return (result.opcode.value === 19 && labels.get(result.address).length === 0 && !isRegister(result.rawParameters[0]))
        || (this.opcode.name === "???" && this.rawParameters.length < this.opcode.value);
  }

  merge(result: DisassemblyResult) {
    if (this.kind === MergedResultKind.String) {
      this.rawParameters.push(result.opcode.value);
      this.decodedParameters[0] = this.decodedParameters[0].slice(0, this.decodedParameters[0].length-1) + safeStringFromCharCode(result.opcode.value).slice(1);
    } else if (this.kind === MergedResultKind.Array) {
      this.rawParameters.push(result.opcode.value);
      this.decodedParameters[0].push(toLabeledValue(result.opcode.value));
    } else {
      this.rawParameters.push(result.rawParameters[0]);
      this.decodedParameters[0] = this.decodedParameters[0].toString().slice(0, this.decodedParameters[0].length-1) + result.decodedParameters[0].toString().slice(1);
    }

    this.stopped = MergedDisassemblyResult.stopMerge(result) || (this.opcode.name === "???" && this.rawParameters.length == this.opcode.value);
  }

  isStopped() {
    return this.stopped;
  }

  static startMerge(result: DisassemblyResult) {
    return (result.opcode.value === 19 && !MergedDisassemblyResult.stopMerge(result))
        || (result.opcode.name === "???" && (result.label.startsWith("s_") || result.label.startsWith("a_")));
  }

  static stopMerge(result: DisassemblyResult) {
    return result.opcode.value === 19 && (result.rawParameters[0] === 10 || isRegister(result.rawParameters[0]))
  }
}
