var fs = require('fs')
const disassemble = require('./disassembly').disassemble;

debug_enabled = false

function debug(message) {
  if (debug_enabled) {
    console.error(message);
  }
}

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

disassemble(memory, 0, 1200);

while (true) {

  var oldPC = pc
  var opcode = next();

  switch (opcode) {
    case 0:
      exit()
      break;
    case 1:
      var register = next();
      var value = next()
      debug(`PC: ${oldPC} set ${register} ${value}`)
      writeRegister(register, value)
      break;
    case 2:
      var rawA = next()
      debug(`PC: ${oldPC} push ${rawA}`)
      stack.push(decodeValue(rawA))
      break;
    case 3:
      var dest = next()
      debug(`PC: ${oldPC} pop ${dest}`)
      writeRegister(dest, stack.pop())
      break;
    case 4:
      var dest = next();
      var rawA = next();
      var rawB = next();
      debug(`PC: ${oldPC} EQ ${dest} ${rawA} ${rawB}`);
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
      debug(`PC: ${oldPC} GT ${dest} ${rawA} ${rawB}`);
      if (decodeValue(rawA) > decodeValue(rawB)) {
        writeRegister(dest, 1)
      } else {
        writeRegister(dest, 0)
      }
      break;
    case 6:
      var address = next();
      //debug(`PC: ${oldPC} JMP ${address}`);
      pc = address;
      break;
    case 7:
      var value = next()
      var address = next()
      debug(`PC: ${oldPC} JT ${value} ${address}`);
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
      debug(`PC: ${oldPC} JF ${value} ${address}`);
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
      debug(`PC: ${oldPC} ADD ${dest} ${a} ${b}`);
      writeRegister(dest, (a + b) % 32768)
      break;
    case 10:
      var dest = next()
      var a = next()
      var b = next()
      debug(`PC: ${oldPC} MULT ${dest} ${a} ${b}`);
      writeRegister(dest, (a * b) % 32768)
      break;
    case 11:
      var dest = next()
      var a = next()
      var b = next()
      debug(`PC: ${oldPC} MOD ${dest} ${a} ${b}`);
      writeRegister(dest, a % b)
      break;
    case 12:
      var dest = next()
      var a = next()
      var b = next()
      debug(`PC: ${oldPC} AND ${dest} ${a} ${b}`);
      writeRegister(dest, a & b)
      break;
    case 13:
      var dest = next()
      var a = next()
      var b = next()
      debug(`PC: ${oldPC} OR ${dest} ${a} ${b}`);
      writeRegister(dest, a | b)
      break;
    case 14:
      var dest = next()
      var a = next()
      debug(`PC: ${oldPC} NOT ${dest} ${a}`);
      writeRegister(dest, ~ a & 32767)
      break;
    case 15:
      var dest = next()
      var a = next()
      debug(`PC: ${oldPC} RMEM ${dest} ${a}`);
      writeRegister(dest, memory[decodeValue(a)])
      break;
    case 16:
      var dest = next()
      var a = next()
      debug(`PC: ${oldPC} WMEM ${dest} ${a}`);
      memory[readRegister(dest)] = decodeValue(a)
      break;
    case 17:
      var address = next()
      debug(`PC: ${oldPC} CALL ${address}`);
      stack.push(pc);
      pc = decodeValue(address)
      break;
    case 18:
      debug(`PC: ${oldPC} RET`);
      pc = stack.pop()
      break;
    case 19:
      var char = next()
      var c = String.fromCharCode(char)
      //debug(`PC: ${oldPC} putc ${c}`);
      process.stdout.write(c);
      break;
    break;
    case 21:
      //debug(`PC: ${oldPC} NOOP`);
      break;
    default:
      throw new Error(`Unknown opcode: ${opcode}`)

  }

}
