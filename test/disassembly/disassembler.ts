import { expect } from 'chai';
import 'mocha';

import { ResultType } from '../../src/disassembly/opcode';
import Disassembler, { disassembleAt } from '../../src/disassembly/disassembler';
import { Register, Address, Value, Character } from '../../src/disassembly/parameters';

describe('disassembleAt', () => {
  it('should disassemble "halt" opcode', () => {
    const result = disassembleAt( [ 0x0000 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([]);
    expect(result.decodedParameters).to.deep.equal([]);
  });

  it('should disassemble "set" opcode with a register', () => {
    const result = disassembleAt( [ 0x0001, 0x8000, 0x8001 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000, 0x8001 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Register(0x8001) ]);
  });

  it('should disassemble "set" opcode with a value', () => {
    const result = disassembleAt( [ 0x0001, 0x8000, 0x1234 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000, 0x1234 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Value(0x1234) ]);
  });

  it('should disassemble "push" opcode with a register', () => {
    const result = disassembleAt( [ 0x0002, 0x8000 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000) ]);
  });

  it('should disassemble "push" opcode with a value', () => {
    const result = disassembleAt( [ 0x0002, 0x1234], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x1234 ]);
    expect(result.decodedParameters).to.deep.equal([ new Value(0x1234) ]);
  });

  it('should disassemble "pop" opcode', () => {
    const result = disassembleAt( [ 0x0003, 0x8000 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000) ]);
  });

  for(let p of [ {opcode:"eq", value: 0x04}, {opcode:"gt", value: 0x05} ]) {
    it(`should disassemble "${p.opcode}" ${p.value} opcode with registers`, () => {
      const result = disassembleAt( [ p.value, 0x8000, 0x8001, 0x8002 ], 0);
      expect(result.type).to.equal(ResultType.Code);
      expect(result.address).to.equal(0);
      expect(result.rawParameters).to.deep.equal([ 0x8000, 0x8001, 0x8002 ]);
      expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Register(0x8001), new Register(0x8002) ]);
    });

    it(`should disassemble "${p.opcode}" ${p.value} opcode with values`, () => {
      const result = disassembleAt( [ p.value, 0x8000, 0x1234, 0x0012 ], 0);
      expect(result.type).to.equal(ResultType.Code);
      expect(result.address).to.equal(0);
      expect(result.rawParameters).to.deep.equal([ 0x8000, 0x1234, 0x0012 ]);
      expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Value(0x1234), new Value(0x0012) ]);
    });
  }

  it('should disassemble "jmp" opcode', () => {
    const result = disassembleAt( [ 0x0006, 0x23a8 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x23a8 ]);
    expect(result.decodedParameters).to.deep.equal([ new Address(0x23a8) ]);
  });

  for(let p of [ {opcode:"jt", value: 0x07}, {opcode:"jf", value: 0x08} ]) {
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

  for(let p of [ {opcode:"add", value: 0x09}, {opcode:"mult", value: 0x0a}, {opcode:"mod", value: 0x0b}, {opcode:"and", value: 0x0c}, {opcode:"or", value: 0x0d} ]) {
    it(`should disassemble "${p.opcode}" ${p.value} opcode with registers`, () => {
      const result = disassembleAt( [ p.value, 0x8000, 0x8001, 0x8002 ], 0);
      expect(result.type).to.equal(ResultType.Code);
      expect(result.address).to.equal(0);
      expect(result.rawParameters).to.deep.equal([ 0x8000, 0x8001, 0x8002 ]);
      expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Register(0x8001), new Register(0x8002) ]);
    });

    it(`should disassemble "${p.opcode}" ${p.value} opcode with values`, () => {
      const result = disassembleAt( [ p.value, 0x8000, 0x1234, 0x0012 ], 0);
      expect(result.type).to.equal(ResultType.Code);
      expect(result.address).to.equal(0);
      expect(result.rawParameters).to.deep.equal([ 0x8000, 0x1234, 0x0012 ]);
      expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Value(0x1234), new Value(0x0012) ]);
    });
  }

  it('should disassemble "not" opcode with a register', () => {
    const result = disassembleAt( [ 0x000e, 0x8000, 0x8000 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000, 0x8000 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Register(0x8000) ]);
  });

  it('should disassemble "not" opcode with a value', () => {
    const result = disassembleAt( [ 0x000e, 0x8000, 0x1234 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000, 0x1234 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Value(0x1234) ]);
  });

  it('should disassemble "rmem" opcode with an address', () => {
    const result = disassembleAt( [ 0x000f, 0x8000, 0x1234 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000, 0x1234 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Address(0x1234) ]);
  });

  it('should disassemble "rmem" opcode with a register', () => {
    const result = disassembleAt( [ 0x000f, 0x8000, 0x8000 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000, 0x8000 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Register(0x8000) ]);
  });

  it('should disassemble "wmem" opcode with a value', () => {
    const result = disassembleAt( [ 0x0010, 0x8000, 0x1234 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000, 0x1234 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Value(0x1234) ]);
  });

  it('should disassemble "wmem" opcode with a register', () => {
    const result = disassembleAt( [ 0x0010, 0x8000, 0x8001 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000, 0x8001 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000), new Register(0x8001) ]);
  });

  it('should disassemble "call" opcode with an address', () => {
    const result = disassembleAt( [ 0x0011, 0x1234 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x1234 ]);
    expect(result.decodedParameters).to.deep.equal([ new Address(0x1234) ]);
  });

  it('should disassemble "call" opcode with a register', () => {
    const result = disassembleAt( [ 0x0011, 0x8000 ], 0);
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

  it('should disassemble "out" opcode with a register', () => {
    const result = disassembleAt( [ 0x0013, 0x8000 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x8000 ]);
    expect(result.decodedParameters).to.deep.equal([ new Register(0x8000) ]);
  });

  it('should disassemble "out" opcode with a character', () => {
    const result = disassembleAt( [ 0x0013, 0x0061 ], 0);
    expect(result.type).to.equal(ResultType.Code);
    expect(result.address).to.equal(0);
    expect(result.rawParameters).to.deep.equal([ 0x0061 ]);
    expect(result.decodedParameters).to.deep.equal([ new Character(0x0061) ]);
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

describe("Disassembler", () => {
  it("should decompile a simple program", () => {
    const program = [0x0013, 0x0061, 0x0000];
    const disassembler = new Disassembler(program);

    const disassembledProgram = disassembler.run();

    expect(disassembledProgram).to.have.length(2);
    expect(disassembledProgram[0].toCode()).to.equal("out 'a'");
    expect(disassembledProgram[1].toCode()).to.equal("halt");
  })
});