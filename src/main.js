var fs = require('fs')
const { disassemble, printCodeAt } = require('./disassembly');
const Promise = require('bluebird');

debug_enabled = false

function exit() {
  console.log(`Registers: ${registers}`);

  process.exit(1)
}

var registers = new Array(8).fill(0)
var stack = []
var memory = []
var data = fs.readFileSync('challenge.bin')
for(var i=0; i < data.byteLength/2; i++) {
  memory.push(data.readUInt16LE(2*i))
}

var pc = 0

function decodeValue(v) {
  if (v < 32768) {
    return v
  }
  return readRegister(v)
}

function validateRegister(register) {
  if (register < 32768 || register > 32775) {
    throw new Error(`Invalid register ${register}`)
  }
}

function writeRegister(register, value) {
  validateRegister(register)
  registers[register - 32768] = value
}

function readRegister(register) {
  validateRegister(register)
  return registers[register - 32768]
}

function next() {
  var value = memory[pc]
  pc++
  return value;
}

disassemble(memory, 0, memory.length);

function* run() {
  while (true) {
    if (debug_enabled) {
      printCodeAt(memory, pc);
    }

    var oldPC = pc
    var opcode = next();

    switch (opcode) {
      case 0:
        exit()
        break;
      case 1:
        var register = next();
        var value = next()
        writeRegister(register, decodeValue(value))
        break;
      case 2:
        var rawA = next()
        stack.push(decodeValue(rawA))
        break;
      case 3:
        var dest = next()
        writeRegister(dest, stack.pop())
        break;
      case 4:
        var dest = next();
        var rawA = next();
        var rawB = next();
        if (decodeValue(rawA) === decodeValue(rawB)) {
          writeRegister(dest, 1)
        } else {
          writeRegister(dest, 0)
        }
        break;
      case 5:
        var dest = next();
        var rawA = next();
        var rawB = next();
        if (decodeValue(rawA) > decodeValue(rawB)) {
          writeRegister(dest, 1)
        } else {
          writeRegister(dest, 0)
        }
        break;
      case 6:
        var address = next();
        pc = address;
        break;
      case 7:
        var value = next()
        var address = next()
        if (value > 32767) {
          value = readRegister(value)
        }
        if (value !== 0) {
          pc = address
        }
        break;
      case 8:
        var value = next()
        var address = next()
        if (value > 32767) {
          value = readRegister(value)
        }
        if (value === 0) {
          pc = address
        }
        break;
      case 9:
        var dest = next()
        var a = next()
        var b = next()
        writeRegister(dest, (decodeValue(a) + decodeValue(b)) % 32768)
        break;
      case 10:
        var dest = next()
        var a = next()
        var b = next()
        writeRegister(dest, (decodeValue(a) * decodeValue(b)) % 32768)
        break;
      case 11:
        var dest = next()
        var a = next()
        var b = next()
        writeRegister(dest, decodeValue(a) % decodeValue(b))
        break;
      case 12:
        var dest = next()
        var a = next()
        var b = next()
        writeRegister(dest, decodeValue(a) & decodeValue(b))
        break;
      case 13:
        var dest = next()
        var a = next()
        var b = next()
        writeRegister(dest, decodeValue(a) | decodeValue(b))
        break;
      case 14:
        var dest = next()
        var a = next()
        writeRegister(dest, ~ decodeValue(a) & 32767)
        break;
      case 15:
        var dest = next()
        var a = next()
        writeRegister(dest, memory[decodeValue(a)])
        break;
      case 16:
        var dest = next()
        var a = next()
        memory[decodeValue(dest)] = decodeValue(a)
        break;
      case 17:
        var address = next()
        stack.push(pc);
        pc = decodeValue(address)
        break;
      case 18:
        pc = stack.pop()
        break;
      case 19:
        var char = next()
        var c = String.fromCharCode(decodeValue(char))
        process.stdout.write(c);
        break;
      case 20:
        var dest = next()
        var v = yield readChar();
        writeRegister(dest, v)
        break;
      case 21:
        break;
      default:
        throw new Error(`Unknown opcode: ${opcode}`)

    }
  }
}

var input = require('./inputs');
var readChar = require('./readChar')(input, () => { debug_enabled = true; });
run = Promise.coroutine(run);

run();
