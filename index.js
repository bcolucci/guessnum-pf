'use strict';

const Immutable = require('immutable');
const Maybe = require('maybe');

// utils -----------------------------------------------------------------------

/**
 * @param number
 * @returns boolean
 */
const isNumber = number => !isNaN(number) && Number(number) === number;

/**
 * @param number
 * @returns boolean
 */
const isInteger = (isNumber => number => isNumber(number) && Math.floor(number) === number)(isNumber);

/**
 * @param number
 * @returns number
 */
const toInteger = (isNumber => number => isNumber(number) ? new Maybe(Math.floor(number)) : Maybe.Nothing)(isNumber);

/**
 * @param number
 * @returns number
 */
const generateRandomNumber = (isNumber => max => isNumber(max) ? new Maybe(Math.random() * max + 1) : Maybe.Nothing)(isNumber);

/**
 * @param number
 * @returns Maybe<number>
 */
const generateRandomIntNumber = ((generateRandomNumber, toInteger) => max => {
  const randomFloat = generateRandomNumber(max);
  return randomFloat !== Maybe.Nothing ? toInteger(randomFloat.value()) : Maybe.Nothing;
})(generateRandomNumber, toInteger);

// game specific ---------------------------------------------------------------

const RESPONSE_HIGHER = () => 'higher';
const RESPONSE_LOWER = () => 'lower';
const RESPONSE_MAX_TRIES_EXCEEDED = turn => `Max tries exceeded, it is the ${turn}th turn`;

const ERROR_NOT_AN_INTEGER = number => `Invalid integer: ${number}`;
const ERROR_LOWER_THAN_ONE = number => 'Your number must be higher than 0';
const ERROR_HIGHER_THAN_MAX_NUMBER = max => `Your number must be lower or equal than ${max}`;

const Configuration = Immutable.Record({
  maxNumber: 30,
  maxTries: 10
});

const State = Immutable.Record({
  turn: 0,
  haveLost: false,
  haveWon: false,
  end: false,
  playerNumber: null,
  response: null,
  error: null,
  states: Immutable.Set()
});

const isValidMaxNum = (isInteger => maxNumber => isInteger(maxNumber) && maxNumber > 0)(isInteger);
const isValidMaxTriesNum = (isInteger => (maxTries, maxNumber) => isInteger(maxTries) && maxTries <= maxNumber)(isInteger);

const checkPlayerNumber = (isInteger, maxNumber) => {
  return number => {
    if (!isInteger(number))
      return new Maybe(ERROR_NOT_AN_INTEGER(number));
    if (number < 1)
      return new Maybe(ERROR_LOWER_THAN_ONE(number));
    if (number > maxNumber)
      return new Maybe(ERROR_HIGHER_THAN_MAX_NUMBER(maxNumber));
    return Maybe.Nothing;
  };
};

const play = (numberToGuess, maxTries, checkPlayerNumber, initialState) => {
  return (number, previousState) => {
    const state = previousState || initialState;
    //TODO check state
    if (state.end) return state;
    const checkNumber = checkPlayerNumber(number);
    let nexState;
    if (checkNumber === Maybe.Nothing) {
      const nexTurn = state.turn + 1;
      if (number === numberToGuess)
        nexState = { turn: nexTurn, haveWon: true };
      else {
        if (nexTurn === maxTries)
          nexState = {
            turn: nexTurn,
            haveLost: true,
            response: RESPONSE_MAX_TRIES_EXCEEDED(maxTries)
          };
        else if (number < numberToGuess)
          nexState = { turn: nexTurn, response: RESPONSE_HIGHER() };
        else
          nexState = { turn: nexTurn, response: RESPONSE_LOWER() };
      }
    } else
      nexState = { turn: state.turn, error: new Error(checkNumber.value()) };
    nexState.playerNumber = number;
    nexState.states = state.states.add(nexState);
    nexState.end = nexState.haveLost || nexState.haveWon;
    return new State(nexState);
  };
};

const Game = function (configuration) {

  const configuration_ = configuration || new Configuration();

  if (!isValidMaxNum(configuration_.maxNumber))
    throw new Error('Invalid maxNumber configuration. Must be an integer higher or equal to 1');

  if (!isValidMaxTriesNum(configuration_.maxTries, configuration_.maxNumber))
    throw new Error('Invalid maxTries configuration. Must be an integer higher or equal to 1 and lower ro equal than the maxNumber.');

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
