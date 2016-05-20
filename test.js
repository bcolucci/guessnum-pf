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

    it('should return check if is number', () => {
      checkForEach(badValues.concat('1'), lib.core.isNumber, false);
      checkForEach([ 0, 1, 1.5 ], lib.core.isNumber, true);
    });

    it('should return check if is integer', () => {
      checkForEach(badValues.concat([ '1', 1.1 ]), lib.core.isInteger, false);
      checkForEach([ 0, 1 ], lib.core.isInteger, true);
    });

    it('should cast to integer', () => {
      compareEach([
        [ 'a', '1', 0, 1, 1.1 ],
        [ Maybe.Nothing, Maybe.Nothing, new Maybe(0), new Maybe(1), new Maybe(1) ]
      ], lib.core.toInteger);
    });

    it('should generate random (float) number', done => {
      checkForEach(badValues, lib.core.generateRandomNumber, Maybe.Nothing);
      callManyTimes(() => {
        const v = lib.core.generateRandomNumber(3).value();
        v.should.be.Number();
        v.should.be.greaterThan(0);
        v.should.be.lessThan(4);
      }, 1000, done);
    });

    it('should generate random (integer) number', done => {
      checkForEach(badValues, lib.core.generateRandomIntNumber, Maybe.Nothing);
      callManyTimes(() => {
        const v = lib.core.generateRandomIntNumber(3).value();
        lib.core.isInteger(v).should.be.deepEqual(true);
        v.should.be.greaterThan(0);
        v.should.be.lessThan(4);
      }, 1000, done);
    });
    
    it('should validate integer greater than zero', () => {
      checkForEach([ -1, 0 ], lib.core.isIntegerGreaterThanZero, false);
      lib.core.isIntegerGreaterThanZero(1).should.be.deepEqual(true);
    });

    it('should validate integer lesser or equal to x', () => {
      checkForEach([ 0, 1 ], x => lib.core.isIntegerLesserOrEqualTo(x, 1), true);
      lib.core.isIntegerLesserOrEqualTo(1, 0).should.be.deepEqual(false);
    });
    
    it('should check play number', () => {
      const max = 1;
      const check = lib.core.checkPlayerNumber(max);
      check('a').value().should.be.deepEqual(lib.core.ERROR_NOT_AN_INTEGER('a'));
      check(0).value().should.be.deepEqual(lib.core.ERROR_LOWER_THAN_ONE);
      check(2).value().should.be.deepEqual(lib.core.ERROR_HIGHER_THAN_MAX_NUMBER(max));
      check(max).should.be.deepEqual(Maybe.Nothing);
    });
    
    describe('play', () => {

      it('should do nothing if play is ended', () => {
        const configuration = new lib.core.PlayConfiguration();
        const play = new lib.core.PlayEngine(configuration);
        play(1, new lib.core.State({ end: true })).turn.should.be.deepEqual(0);
      });

      it('should make error and stay in the same turn', done => {
        const configuration = new lib.core.PlayConfiguration();
        const play = new lib.core.PlayEngine(configuration);
        callManyTimes(() => {
          const state = play('a');
          state.error.should.be.a.Error();
          state.turn.should.be.deepEqual(0);
        }, configuration.maxTries + 1, done);
      });

      it('should increment turn number if no error', () => {
        const configuration = new lib.core.PlayConfiguration();
        const play = new lib.core.PlayEngine(configuration);
        configuration.initialState.turn.should.be.deepEqual(0);
        const state1 = play(2);
        const state2 = play(3, state1);
        state1.turn.should.be.deepEqual(configuration.initialState.turn + 1);
        state2.turn.should.be.deepEqual(state1.turn + 1);
      });
      
      //play = (numberToGuess, maxTries, checkPlayerNumber, initialState)
    });

  });

});
