import { expect } from 'chai';
import 'mocha';

import { Labels } from '../src/labels';

describe('Labels', () => {
  it('should load labels from a file', () => {
    const labels = Labels.load(__dirname+"/labels.json");

    expect(labels.get(0x0140)).to.equal("test_jmp");
    expect(labels.get(0x015b)).to.equal("_jmp_1");
  });

  it('should set a label for an adress', () => {
    const labels = new Labels();
    labels.set(0x1234, "test");

    expect(labels.get(0x1234)).to.equal("test");
  });

  it('should tell if an address has a label', () => {
    const labels = new Labels();
    labels.set(0x1234, "test");

    expect(labels.has(0x1234)).to.be.true;
    expect(labels.has(0x1235)).to.be.false;
  });

  it('should serialize to json', () => {
    const labels = new Labels();
    labels.set(0x1234, "test");
    labels.set(0x0ade, "test2");

    expect(labels.toJSON()).to.equal(
      [
        '[',
        '  {',
        '    "address": "0x0ade",',
        '    "value": "test2"',
        '  },',
        '  {',
        '    "address": "0x1234",',
        '    "value": "test"',
        '  }',
        ']'
      ].join("\n"));
  });
});