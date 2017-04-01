import * as fs from "fs";
import { sprintf } from "sprintf";

const POINTER_PREFIX = "p_";
const STRING_ARRAY_PREFIX = "a_s_";

function byAddress([firstAddress], [secondAddress]) {
  return firstAddress - secondAddress;
}

interface LabelEntry {
  address: string;
  value: string;
}

export class Labels {
  static load(file) {
    const labels = new Labels();
    labels.load(file);
    return labels;
  }

  static isPointer(label: string) {
    return label.startsWith(POINTER_PREFIX);
  }

  static isStringArray(label: string) {
    return label.startsWith(STRING_ARRAY_PREFIX);
  }

  private labels = new Map<number, string>();

  load(file) {
    this.labels.clear();

    const content = fs.readFileSync(file, "utf8");
    const loadedLabels: LabelEntry[] = JSON.parse(content) as LabelEntry[];
    loadedLabels.forEach(entry => {
      this.labels.set(parseInt(entry.address), entry.value);
    })
  }

  get(address: number) {
    return this.labels.get(address) || "";
  }

  set(address:number, label:string) {
    this.labels.set(address, label);
  }

  has(address:number) {
    return this.labels.has(address);
  }

  toJSON() {
    const result: LabelEntry[] = [];

    for (var [address, label] of Array.from(this.labels.entries()).sort(byAddress)) {
      result.push({ address: sprintf("0x%04x", address), value: label });
    }

    return JSON.stringify(result, null, 2);
  }
}