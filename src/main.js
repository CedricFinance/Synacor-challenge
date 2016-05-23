var fs = require('fs')

debug_enabled = true

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
  return registers[v - 32768]
}

function setRegister(register, value) {
  registers[register - 32768] = value
}

function next() {
  var value = memory[pc]
  pc++
  return value;
}

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
      setRegister(register, value)
      break;
    case 2:
      var rawA = next()
      debug(`PC: ${oldPC} push ${rawA}`)
      stack.push(decodeValue(rawA))
      break;
    case 3:
      var dest = next()
      debug(`PC: ${oldPC} pop ${dest}`)
      setRegister(dest, stack.pop())
      break;
    case 4:
      var dest = next();
      var rawA = next();
      var rawB = next();
      debug(`PC: ${oldPC} EQ ${dest} ${rawA} ${rawB}`);
      if (decodeValue(rawA) === decodeValue(rawB)) {
        setRegister(dest, 1)
      } else {
        setRegister(dest, 0)
      }
      break;
    case 5:
      var dest = next();
      var rawA = next();
      var rawB = next();
      debug(`PC: ${oldPC} GT ${dest} ${rawA} ${rawB}`);
      if (decodeValue(rawA) > decodeValue(rawB)) {
        setRegister(dest, 1)
      } else {
        setRegister(dest, 0)
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
        value = registers[value - 32768]
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
        value = registers[value - 32768]
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
      setRegister(dest, a + b)
      break;
    case 12:
      var dest = next()
      var a = next()
      var b = next()
      debug(`PC: ${oldPC} AND ${dest} ${a} ${b}`);
      setRegister(dest, a & b)
      break;
    case 13:
      var dest = next()
      var a = next()
      var b = next()
      debug(`PC: ${oldPC} OR ${dest} ${a} ${b}`);
      setRegister(dest, a | b)
      break;
    case 14:
      var dest = next()
      var a = next()
      debug(`PC: ${oldPC} NOT ${dest} ${a}`);
      setRegister(dest, ~ a & 32767)
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
