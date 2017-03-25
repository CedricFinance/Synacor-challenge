import { expect } from 'chai';
import 'mocha';

import { ResultType } from '../../src/disassembly/opcode';
import { disassembleAt } from '../../src/disassembly/disassembler';
import { Register, Address, Value } from '../../src/disassembly/parameters';

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

  it('should disassemble "jmp" opcode', () => {
    const result = disassembleAt( [ 0x0006, 0x23a8 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x23a8 ]);
    expect(result.decodedParameters).to.deep.equal([ new Address(0x23a8) ]);
  });

  for(var p of [ {opcode:"jt", value: 0x06}, {opcode:"jf", value: 0x07} ]) {
    it(`should disassemble "${p.opcode}" opcode with a register`, () => {
      const result = disassembleAt( [ p.value, 0x8000, 0x23a8 ], 0);
      expect(result.type).to.equal(ResultType.Code);
      expect(result.address).to.equal(0);
      expect(result.rawParameters).to.deep.equal([ 0x8000, 0x23a8 ]);
      expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Address(0x23a8) ]);
    });

    it(`should disassemble "${p.opcode}" opcode with a value`, () => {
      const result = disassembleAt( [ p.value, 0x0010, 0x23a8 ], 0);
      expect(result.type).to.equal(ResultType.Code);
      expect(result.address).to.equal(0);
      expect(result.rawParameters).to.deep.equal([ 0x0010, 0x23a8 ]);
      expect(result.decodedParameters).to.deep.equal([ new Value(0x0010), new Address(0x23a8) ]);
    });
  }

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

  it('should return an invalid opcode when an error occurs', () => {
    const result = disassembleAt( [ 0x0003, 0x0001 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.opcode.name).to.equal("???");
    expect(result.address).to.equal(0);
  });

});