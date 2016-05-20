'use strict';

const Immutable = require('immutable');
const Maybe = require('maybe');

// utils -----------------------------------------------------------------------

/**
 * @param n number
 * @return boolean
 */
const isNumber = n => !isNaN(n) && Number(n) === n;

/**
 * @param n number
 * @return boolean
 */
const isInteger = (isNumber => n => isNumber(n) && Math.floor(n) === n)(isNumber);

/**
 * @param number
 * @return Maybe<number>
 */
const toInteger = (isNumber => n => isNumber(n) ? new Maybe(Math.floor(n)) : Maybe.Nothing)(isNumber);

/**
 * @param max number
 * @return Maybe<number> between 1.0 and max
 */
const generateRandomNumber = (isNumber => max => isNumber(max) ? new Maybe(Math.random() * max + 1) : Maybe.Nothing)(isNumber);

/**
 * @param number
 * @return Maybe<number> between 1 and max
 */
const generateRandomIntNumber = ((generateRandomNumber, toInteger) => max => {
  const randomFloat = generateRandomNumber(max);
  return randomFloat !== Maybe.Nothing ? toInteger(randomFloat.value()) : Maybe.Nothing;
})(generateRandomNumber, toInteger);

// game specific ---------------------------------------------------------------

const RESPONSE_HIGHER = 'higher';
const RESPONSE_LOWER = 'lower';

/**
 * @param turn string
 * @return string
 */
const RESPONSE_MAX_TRIES_EXCEEDED = turn => `Max tries exceeded, it is the ${turn}th turn`;

/**
 * @param n number
 * @return string
 */
const ERROR_NOT_AN_INTEGER = n => `Invalid integer: ${n}`;

/**
 * @param n number
 * @return string
 */
const ERROR_HIGHER_THAN_MAX_NUMBER = n => `Your number must be lower or equal than ${n}`;

const ERROR_LOWER_THAN_ONE = 'Your number must be higher than 0';

/**
 * The game configuration
 * @constructor
 */
const Configuration = Immutable.Record({ maxNumber: 30, maxTries: 10 });

/**
 * The game state
 * @constructor
 */
const State = Immutable.Record({
  turn: 0, // the current turn
  haveLost: false, // have I lost?
  haveWon: false, // have I won?
  end: false, // haveLost || haveWon
  playerNumber: null, // what number I have tried this time
  response: null, // the game response (higher, lower, lost, won)
  error: null, // an error?
  states: Immutable.Set() // previous states
});

/**
 * @param maxNumber number
 * @return boolean
 */
const isValidMaxNum = (isInteger => maxNumber => isInteger(maxNumber) && maxNumber > 0)(isInteger);

/**
 * @param maxTries number
 * @param maxNumber number
 * @return boolean
 */
const isValidMaxTriesNum = (isInteger => (maxTries, maxNumber) => isInteger(maxTries) && maxTries <= maxNumber)(isInteger);

/**
 * @param isInteger Function
 * @param maxNumber number
 * @return Function
 */
const checkPlayerNumber = (isInteger, maxNumber) => {
  /**
   * @param n number
   * @return Maybe<string>
   */
  return n => {
    if (!isInteger(n))
      return new Maybe(ERROR_NOT_AN_INTEGER(n));
    if (n < 1)
      return new Maybe(ERROR_LOWER_THAN_ONE);
    if (n > maxNumber)
      return new Maybe(ERROR_HIGHER_THAN_MAX_NUMBER(maxNumber));
    return Maybe.Nothing;
  };
};

/**
 * @param numberToGuess number
 * @param maxTries number
 * @param checkPlayerNumber Function
 * @param initialState State
 * @return Function
 */
const play = (numberToGuess, maxTries, checkPlayerNumber, initialState) => {
  /**
   * @param n number
   * @param previousState State
   */
  return (n, previousState) => {

    const state = previousState || initialState;

    // done is done
    if (state.end)
      return state;

    let nexState;

    const checkNumber = checkPlayerNumber(n);
    if (checkNumber !== Maybe.Nothing) // error case
      nexState = { turn: state.turn, error: new Error(checkNumber.value()) };
    else {

      const nexTurn = state.turn + 1;
      if (n === numberToGuess) // play won!
        nexState = { turn: nexTurn, haveWon: true };
      else {

        // too many tries...
        if (nexTurn === maxTries)
          nexState = {
            turn: nexTurn,
            haveLost: true,
            response: RESPONSE_MAX_TRIES_EXCEEDED(maxTries)
          };
        else if (n < numberToGuess) // should try a higher number
          nexState = { turn: nexTurn, response: RESPONSE_HIGHER };
        else // should try a lower number
          nexState = { turn: nexTurn, response: RESPONSE_LOWER };

      }

    }

    nexState.playerNumber = n;
    nexState.states = state.states.add(nexState); // we keep all states (so we can check and replay)
    nexState.end = nexState.haveLost || nexState.haveWon;

    return new State(nexState); // the new state after the action
  };
};

/**
 *
 * @param configuration Configuration
 * @return {{initialState: Record, play: Function}}
 * @constructor
 */
const Game = function (configuration) {

  const configuration_ = configuration || new Configuration();

  if (!isValidMaxNum(configuration_.maxNumber))
    throw new Error('Invalid maxNumber configuration. Must be an integer higher or equal to 1');

  if (!isValidMaxTriesNum(configuration_.maxTries, configuration_.maxNumber))
    throw new Error('Invalid maxTries configuration. Must be an integer higher or equal to 1 and lower ro equal than the maxNumber.');

  // let's generate the number the play will have to guess
  const someNumberToGuess = generateRandomIntNumber(configuration_.maxNumber);
  if (someNumberToGuess === Maybe.Nothing)
    throw new Error('Error when generating the number to guess.');
  const numberToGuess = someNumberToGuess.value();

  const initialState = new State();
  const checkNumber = checkPlayerNumber(isInteger, configuration_.maxNumber);

  return {
    initialState: initialState,
    play: play(numberToGuess, configuration_.maxTries, checkNumber, initialState)
  };
};

module.exports = {

  // for tests purpose ---------------------------------------------------------

  core: {

    isNumber,
    isInteger,
    toInteger,

    generateRandomNumber,
    generateRandomIntNumber,

    isValidMaxNum,
    isValidMaxTriesNum,

    checkPlayerNumber,

    RESPONSE_HIGHER,
    RESPONSE_LOWER,
    RESPONSE_MAX_TRIES_EXCEEDED,
    responses: Immutable.Set(
      RESPONSE_HIGHER,
      RESPONSE_LOWER,
      RESPONSE_MAX_TRIES_EXCEEDED
    ),

    ERROR_NOT_AN_INTEGER,
    ERROR_LOWER_THAN_ONE,
    ERROR_HIGHER_THAN_MAX_NUMBER,
    errors: Immutable.Set(
      ERROR_NOT_AN_INTEGER,
      ERROR_LOWER_THAN_ONE,
      ERROR_HIGHER_THAN_MAX_NUMBER
    ),

    State,
    play
  },

  // mandatory in order to play ------------------------------------------------

  Configuration,
  Game
};
