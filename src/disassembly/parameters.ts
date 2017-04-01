import { sprintf } from 'sprintf';

export interface Context {
  labels: Map<number, string>
}

interface Parameter {
  toString(context: Context): string;
}

function safeStringFromCharCode(charCode: number) {
  return charCode === 10 ? "'\\n'" : `'${String.fromCharCode(charCode)}'`
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

export class Value implements Parameter {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  toString(context: Context) {
    var suffix = "";
    if (context.labels.has(this.value)) {
      var label = context.labels.get(this.value);
      suffix = ` /* ${label} */`;
    }
    return toHexString(this.value)+suffix;
  }
}

export class Character implements Parameter {
  private charCode: number;

  constructor(value: number) {
    this.charCode = value;
  }

  toString(context: Context) {
    return safeStringFromCharCode(this.charCode);
  }
}

export class Data implements Parameter {
  private data: number;

  constructor(data: number) {
    this.data = data;
  }

  toString(context: Context) {
    return `${this.data} ${safeStringFromCharCode(this.data)} ${context.labels.get(this.data)}`
  }
}