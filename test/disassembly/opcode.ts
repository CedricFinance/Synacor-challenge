import { expect } from 'chai';
import 'mocha';

import { ResultType, DisassemblyResult, MergedDisassemblyResult } from '../../src/disassembly/opcode';
import { Character } from '../../src/disassembly/parameters';

describe('MergedDisassemblyResult', () => {
  it('should merge one out opcode', () => {
    const firstOpcode = new DisassemblyResult(ResultType.Code, 0x1234, "test", { name: "out", length: 1, value: 0x13 }, [0x61], [ new Character(0x61)]);
    const mergedOut = new MergedDisassemblyResult(firstOpcode);
    expect(mergedOut.address).to.equal(0x1234);
    expect(mergedOut.label).to.equal("test");
    expect(mergedOut.opcode).to.deep.equal({ name: "out", length: 1, value: 0x13 });
    expect(mergedOut.toCode()).to.equal("out 'a'");
  });

  it('should merge two out opcode', () => {
    const firstOpcode = new DisassemblyResult(ResultType.Code, 0, "", { name: "out", length: 1, value: 0x13 }, [0x61], [ new Character(0x61)]);
    const secondOpcode = new DisassemblyResult(ResultType.Code, 1, "", { name: "out", length: 1, value: 0x13 }, [0x62], [ new Character(0x62)]);
    const mergedOut = new MergedDisassemblyResult(firstOpcode);
    mergedOut.merge(secondOpcode);
    expect(mergedOut.toCode()).to.equal("out 'ab'");
  });

  it('should merge two chars', () => {
    const firstResult = new DisassemblyResult(ResultType.Data, 0, "s_ab", { name: "???", length: 1, value: 0x2 }, [], []);
    const secondResult = new DisassemblyResult(ResultType.Data, 1, "", { name: "???", length: 1, value: 0x61 }, [], []);
    const thirdResult = new DisassemblyResult(ResultType.Data, 1, "", { name: "???", length: 1, value: 0x62 }, [], []);
    const mergeResult = new MergedDisassemblyResult(firstResult);
    mergeResult.merge(secondResult);
    mergeResult.merge(thirdResult);
    expect(mergeResult.toCode()).to.equal("'ab'");
  });

  it('should escape newline char', () => {
    const firstResult = new DisassemblyResult(ResultType.Data, 0, "s_anl", { name: "???", length: 1, value: 0x2 }, [], []);
    const secondResult = new DisassemblyResult(ResultType.Data, 1, "", { name: "???", length: 1, value: 0x61 }, [], []);
    const thirdResult = new DisassemblyResult(ResultType.Data, 1, "", { name: "???", length: 1, value: 0x0a }, [], []);
    const mergeResult = new MergedDisassemblyResult(firstResult);
    mergeResult.merge(secondResult);
    mergeResult.merge(thirdResult);
    expect(mergeResult.toCode()).to.equal("'a\\n'");
  });

  it('should merge two array items', () => {
    const firstResult = new DisassemblyResult(ResultType.Data, 0, "a_ab", { name: "???", length: 1, value: 0x2 }, [], []);
    const secondResult = new DisassemblyResult(ResultType.Data, 1, "", { name: "???", length: 1, value: 0x61 }, [], []);
    const thirdResult = new DisassemblyResult(ResultType.Data, 1, "", { name: "???", length: 1, value: 0x62 }, [], []);
    const mergeResult = new MergedDisassemblyResult(firstResult);
    mergeResult.merge(secondResult);
    mergeResult.merge(thirdResult);
    expect(mergeResult.toCode()).to.equal("97,98");
  });
});