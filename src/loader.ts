import * as fs from 'fs';

export function loadProgram(file: string) {
  const data = fs.readFileSync(file);
  const program: number[] = [];

  for(var i=0; i < data.byteLength/2; i++) {
    program.push(data.readUInt16LE(2*i))
  }

  return program;
}
