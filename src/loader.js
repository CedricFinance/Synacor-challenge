const fs = require('fs');

function loadProgram(file) {
  const data = fs.readFileSync(file);
  const program = [];

  for(var i=0; i < data.byteLength/2; i++) {
    program.push(data.readUInt16LE(2*i))
  }

  return program;
}

module.exports = {
  loadProgram
}