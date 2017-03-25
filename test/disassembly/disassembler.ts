import { expect } from 'chai';
import 'mocha';

import { ResultType } from '../../src/disassembly/opcode';
import { disassembleAt } from '../../src/disassembly/disassembler';
import { Register } from '../../src/disassembly/parameters';

describe('disassembleAt', () => {
  it('should disassemble "halt" opcode', () => {
    const result = disassembleAt( [ 0x0000 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([]);
    expect(result.decodedParameters).to.deep.equal([]);
  });

  it('should disassemble "pop" opcode', () => {
    const result = disassembleAt( [ 0x0003, 0x8000 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000) ]);
  });

  it('should disassemble "ret" opcode', () => {
    const result = disassembleAt( [ 0x0012 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([]);
    expect(result.decodedParameters).to.deep.equal([]);
  });

  it('should disassemble "noop" opcode', () => {
    const result = disassembleAt( [ 0x0014, 0x8000 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000) ]);
  });
});