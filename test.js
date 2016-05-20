'use strict';
/*global describe*/
/*global it*/

const should = require('should');

const lib = require('.');

const checkForEach = (arr, fn, expRes) => arr.forEach(v => fn(v).should.be.equal(expRes));
const badValues = [ , null, undefined, NaN ];

describe('guessnum-pf', () => {
  
  describe('core', () => {

    it('return check if is number', () => {
      checkForEach(badValues.concat('1'), lib.core.isNumber, false);
      checkForEach([ 0, 1, 1.5 ], lib.core.isNumber, true);
    });

    it('return check if is integer', () => {
      checkForEach(badValues.concat([ '1', 1.1 ]), lib.core.isInteger, false);
      checkForEach([ 0, 1 ], lib.core.isInteger, true);
    });

  });

  //TODO

});
