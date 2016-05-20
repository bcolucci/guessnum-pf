'use strict';
/*global describe*/
/*global it*/

const Maybe = require('maybe');
const should = require('should');

const lib = require('.');

const badValues = [ , null, undefined, NaN ];

const checkForEach = (arr, fn, expRes) => arr.forEach(v => fn(v).should.be.deepEqual(expRes));
const compareEach = (arr, fn) => arr[0].forEach((v, i) => fn(v).should.be.deepEqual(arr[1][i]));

const callManyTimes = (fn, nbTests, cbk) => {
  (function nextCall(i) {
    if (i === 0)
      return cbk();
    fn();
    return nextCall(i - 1);
  })(nbTests);
};

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

    it('cast to integer', () => {
      compareEach([
        [ 'a', '1', 0, 1, 1.1 ],
        [ Maybe.Nothing, Maybe.Nothing, new Maybe(0), new Maybe(1), new Maybe(1) ]
      ], lib.core.toInteger);
    });

    it('generate random (float) number', done => {
      checkForEach(badValues, lib.core.generateRandomNumber, Maybe.Nothing);
      callManyTimes(() => {
        const v = lib.core.generateRandomNumber(3).value();
        v.should.be.Number();
        v.should.be.greaterThan(0);
        v.should.be.lessThan(4);
      }, 1000, done);
    });

    it('generate random (integer) number', done => {
      checkForEach(badValues, lib.core.generateRandomIntNumber, Maybe.Nothing);
      callManyTimes(() => {
        const v = lib.core.generateRandomIntNumber(3).value();
        lib.core.isInteger(v).should.be.deepEqual(true);
        v.should.be.greaterThan(0);
        v.should.be.lessThan(4);
      }, 1000, done);
    });

  });

});
