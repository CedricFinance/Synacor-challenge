import { expect } from 'chai';
import 'mocha';

import * as chalk from 'chalk';

import { ResultType, DisassemblyResult } from '../../src/disassembly/opcode';
import { Character } from '../../src/disassembly/parameters';
import { Printer } from '../../src/disassembly/print';

describe('print', () => {
  describe('formatCode', () => {
    it('should format an halt opcode', () => {
      const opcode = new DisassemblyResult(ResultType.Code, 0x1234, "", { name: "halt", length: 1, value: 0x00 }, [], []);
      const lines = new Printer().formatCode(opcode);
      expect(lines).to.deep.equal([chalk.cyan("0x001234 0000                                                     halt"), ""]);
    });

    it('should format an a simple program', () => {
      const opcode1 = new DisassemblyResult(ResultType.Code, 0x1234, "", { name: "noop", length: 1, value: 0x15 }, [], []);
      const printer = new Printer();

      const lines1 = printer.formatCode(opcode1);
      expect(lines1).to.deep.equal([chalk.cyan("0x001234 0015                                                     noop")]);

      const opcode2 = new DisassemblyResult(ResultType.Code, 0x1235, "", { name: "halt", length: 1, value: 0x00 }, [], []);
      const lines2 = printer.formatCode(opcode2);
      expect(lines2).to.deep.equal([chalk.cyan("0x001235 0000                                                     halt"), ""]);
    });

    it('should format an a program with an opcode that stop the merge', () => {
      const opcode1 = new DisassemblyResult(ResultType.Code, 0x1234, "", { name: "out", length: 2, value: 0x13 }, [0x61], [new Character(0x61)]);
      const printer = new Printer();

      const lines1 = printer.formatCode(opcode1);
      expect(lines1).to.deep.equal([]);

      const opcode2 = new DisassemblyResult(ResultType.Code, 0x1235, "", { name: "halt", length: 1, value: 0x00 }, [], []);
      const lines2 = printer.formatCode(opcode2);
      expect(lines2).to.deep.equal([
        chalk.cyan("0x001234 0013 0061                                                out 'a'"),
        chalk.cyan("0x001235 0000                                                     halt"),
        ""]);
    });

    it('should format a string', () => {
      const opcode1 = new DisassemblyResult(ResultType.Data, 0x1234, "s_test", { name: "???", length: 1, value: 0x02 }, [], []);
      const opcode2 = new DisassemblyResult(ResultType.Data, 0x1235, "", { name: "???", length: 1, value: 0x61 }, [], []);
      const opcode3 = new DisassemblyResult(ResultType.Data, 0x1236, "", { name: "???", length: 1, value: 0x62 }, [], []);
      const printer = new Printer();
      var lines = printer.formatCode(opcode1);
      expect(lines).to.deep.equal([]);

      lines = printer.formatCode(opcode2);
      expect(lines).to.deep.equal([]);

      lines = printer.formatCode(opcode3);
      expect(lines).to.deep.equal(["", chalk.green("0x001234 0002 0061 0062      s_test                               'ab'")]);
    });

    it('should format an array', () => {
      const opcode1 = new DisassemblyResult(ResultType.Data, 0x1234, "a_test", { name: "???", length: 1, value: 0x02 }, [], ["2 '\u0002'"]);
      const opcode2 = new DisassemblyResult(ResultType.Data, 0x1235, "", { name: "???", length: 1, value: 0x61 }, [], ["97 'a'"]);
      const opcode3 = new DisassemblyResult(ResultType.Data, 0x1236, "", { name: "???", length: 1, value: 0x62 }, [], ["98 'b'"]);
      const opcode4 = new DisassemblyResult(ResultType.Data, 0x1237, "", { name: "???", length: 1, value: 0x62 }, [], ["98 'b'"]);
      const printer = new Printer();
      var lines = printer.formatCode(opcode1);
      expect(lines).to.deep.equal([]);

      lines = printer.formatCode(opcode2);
      expect(lines).to.deep.equal([]);

      lines = printer.formatCode(opcode3);
      expect(lines).to.deep.equal(["", chalk.green("0x001234 0002 0061 0062      a_test                               0061,0062")]);

      lines = printer.formatCode(opcode4);
      expect(lines).to.deep.equal([chalk.green("0x001237 0062                                                     98 'b'")]);
    });

  });
});