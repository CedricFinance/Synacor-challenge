import { sprintf } from 'sprintf';

export interface Context {
  labels: Map<number, string>
}

interface Parameter {
  toString(context: Context): string;
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

export class Register implements Parameter {
  private register: number;

  constructor(value: number) {
    validateRegister(value);
    this.register = value - 0x8000;
  }

  toString(context: Context) {
    return `r${this.register}`;
  }
}

export class Address implements Parameter {
  private address: number;

  constructor(value: number) {
    this.address = value;
  }

  toString(context: Context) {
    if (context.labels.has(this.address)) {
      return context.labels.get(this.address)
    }
    return toHexString(this.address);
  }
}