import { expect } from 'chai';
import 'mocha';

import * as parameters from '../../src/disassembly/parameters';

describe('disassembly', () => {
  describe('parameters', () => {
    var vmContext: parameters.Context;

    before(() => {
      vmContext = { labels: new Map<number,string>() };
    })

    describe('Register', () => {

      for(var i=0; i<8; i++) {
        var register = `r${i}`
        var value = 0x8000+i;

        it(`should accept register ${register}`, () => {
          const result = new parameters.Register(value);
          expect(result.toString(vmContext)).to.equal(register);
        });
      }

      it('should fail with higher value', () => {
        expect(() => { new parameters.Register(0x8008) }).to.throw();
      });

      it('should fail with lower value', () => {
        expect(() => { new parameters.Register(0x7fff) }).to.throw();
      });

    });

    describe('Address', () => {

      it('should accept an address', () => {
        const result = new parameters.Address(0x23ef);
        expect(result.toString(vmContext)).to.equal("23ef");
      });

      it('should display the label if any', () => {
        vmContext.labels.set(0x23ef, "test");

        const result = new parameters.Address(0x23ef);
        expect(result.toString(vmContext)).to.equal("test");
      });
    });
  });
});