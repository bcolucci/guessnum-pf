'use strict';

const Immutable = require('immutable');
const Maybe = require('maybe');

// utils -----------------------------------------------------------------------

const isNumber = number => !isNaN(number) && Number(number) === number;
const isInteger = (isNumber => number => isNumber(number) && Math.floor(number) === number)(isNumber);
const toInteger = (isNumber => number => isNumber(number) ? new Maybe(Math.floor(number)) : Maybe.Nothing)(isNumber);

const generateRandomNumber = (isNumber => max => isNumber(max) ? new Maybe(Math.random() * max + 1) : Maybe.Nothing)(isNumber);
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
  isInteger: isInteger,
  generator: generateRandomIntNumber,
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


const Game = function (configuration) {

  const configuration_ = configuration || new configuration();

  if (typeof configuration_.isInteger !== 'function')
    throw new Error('Please provide a isInteger function');

  if (!configuration_.isInteger(configuration_.maxNumber)
      || configuration_.maxNumber < 1)
    throw new Error('Invalid maxNumber configuration.'
      + ' Must be an integer higher or equal to 1');

  if (!configuration_.isInteger(configuration_.maxTries)
      || configuration_.maxTries < 1
      || configuration_.maxTries > configuration_.maxNumber)
    throw new Error('Invalid maxTries configuration.'
      + 'Must be an integer higher or equal to 1 and lower ro equal than the maxNumber.');

  const numberToGuess_ = configuration_.generator(configuration_.maxNumber).value();
  const initialState_ = new State();

  const checkPlayerNumber_ = (isInteger => number => {
    if (!isInteger(number))
      return new Maybe(ERROR_NOT_AN_INTEGER(number));
    if (number < 1)
      return new Maybe(ERROR_LOWER_THAN_ONE(number));
    if (number > configuration_.maxNumber)
      return new Maybe(ERROR_HIGHER_THAN_MAX_NUMBER(configuration_.maxNumber));
    return Maybe.Nothing;
  })(isInteger);

  const play_ = (number, previousState) => {
    const state = previousState || initialState_;
    //TODO check state
    if (state.end) return state;
    const checkNumber = checkPlayerNumber_(number);
    let nexState;
    if (checkNumber === Maybe.Nothing) {
      const nexTurn = state.turn + 1;
      if (number === numberToGuess_)
        nexState = { turn: nexTurn, haveWon: true };
      else {
        if (nexTurn === configuration_.maxTries)
          nexState = {
            turn: nexTurn,
            haveLost: true,
            response: RESPONSE_MAX_TRIES_EXCEEDED(configuration_.maxTries)
          };
        else if (number < numberToGuess_)
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

  // here we could add internal functions for test purpose
  return { play: play_, initialState: initialState_ };
};

module.exports = {

  // for tests purpose ---------------------------------------------------------

  isNumber: isNumber,
  isInteger: isInteger,
  toInteger: toInteger,

  generateRandomNumber: generateRandomNumber,
  generateRandomIntNumber: generateRandomIntNumber,

  RESPONSE_HIGHER: RESPONSE_HIGHER,
  RESPONSE_LOWER: RESPONSE_LOWER,
  RESPONSE_MAX_TRIES_EXCEEDED: RESPONSE_MAX_TRIES_EXCEEDED,
  responses: Immutable.Set(
    RESPONSE_HIGHER,
    RESPONSE_LOWER,
    RESPONSE_MAX_TRIES_EXCEEDED
  ),

  ERROR_NOT_AN_INTEGER: ERROR_NOT_AN_INTEGER,
  ERROR_LOWER_THAN_ONE: ERROR_LOWER_THAN_ONE,
  ERROR_HIGHER_THAN_MAX_NUMBER: ERROR_HIGHER_THAN_MAX_NUMBER,
  errors: Immutable.Set(
    ERROR_NOT_AN_INTEGER,
    ERROR_LOWER_THAN_ONE,
    ERROR_HIGHER_THAN_MAX_NUMBER
  ),

  State: State,

  // mandatory in order to play ------------------------------------------------

  Configuration: Configuration,
  Game: Game
};
