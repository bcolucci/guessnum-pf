'use strict';

const Immutable = require('immutable');
const Maybe = require('maybe');

// utils -----------------------------------------------------------------------

/**
 * @param n number
 * @return boolean
 */
const isNumber = n => false === isNaN(n) && n === Number(n);

/**
 * @param n number
 * @return boolean
 */
const isInteger = (isNumber => n => isNumber(n) && Math.floor(n) === n)(isNumber);

/**
 * @param n number
 * @return boolean
 */
const isIntegerGreaterThanZero = (isInteger => n => isInteger(n) && n > 0)(isInteger);

/**
 * @param n number
 * @param max number
 * @return boolean
 */
const isIntegerLesserOrEqualTo = (isInteger => (n, max) => isInteger(n) && n <= max)(isInteger);

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
  return randomFloat === Maybe.Nothing ? Maybe.Nothing : toInteger(randomFloat.value());
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

const DEFAULT_MAX_NUMBER = 3;
const DEFAULT_MAX_TRIES = 10;

/**
 * The game configuration
 * @constructor
 */
const GameConfiguration = Immutable.Record({
  maxNumber: DEFAULT_MAX_NUMBER,
  maxTries: DEFAULT_MAX_TRIES
});

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
 * The play configuration
 * @constructor
 */
const PlayEngineConfiguration = Immutable.Record({
  maxNumber: DEFAULT_MAX_NUMBER,
  maxTries: DEFAULT_MAX_TRIES,
  numberToGuess: 1,
  initialState: new State()
});

/**
 * @param isInteger Function
 * @param maxNumber number
 * @return Function
 */
const checkPlayerNumber = (isInteger => maxNumber => {

  /**
   * @param n number
   * @return Maybe<string>
   */
  return n => {
    if (false === isInteger(n))
      return new Maybe(ERROR_NOT_AN_INTEGER(n));
    if (n < 1)
      return new Maybe(ERROR_LOWER_THAN_ONE);
    if (n > maxNumber)
      return new Maybe(ERROR_HIGHER_THAN_MAX_NUMBER(maxNumber));
    return Maybe.Nothing;
  };

})(isInteger);

/**
 * The play engine
 * @param configuration PlayEngineConfiguration
 * @return Function
 * @constructor
 */
const PlayEngine = function (configuration) {

  const checkNumber = checkPlayerNumber(configuration.maxNumber);

  /**
   * @param n number
   * @param previousState State
   */
  return (n, previousState) => {

    const state = previousState || configuration.initialState;

    // done is done
    if (state.end)
      return state;

    const createNextState = nextState => {
      nextState.playerNumber = n;
      nextState.end = nextState.haveLost || nextState.haveWon || false;
      nextState.states = state.states.add(nextState); // we keep all states (so we can check and replay)
      return new State(nextState);
    };

    const numberValidation = checkNumber(n);
    if (numberValidation !== Maybe.Nothing) // error case
      return createNextState({ turn: state.turn, error: new Error(numberValidation.value()) });

    const nexTurn = state.turn + 1;

    if (n === configuration.numberToGuess) // play won!
      return createNextState({ turn: nexTurn, haveWon: true });

    // too many tries...
    if (nexTurn === configuration.maxTries)
      return createNextState({
        turn: nexTurn,
        haveLost: true,
        response: RESPONSE_MAX_TRIES_EXCEEDED(configuration.maxTries)
      });

    // should try a higher number
    if (n < configuration.numberToGuess)
      return createNextState({ turn: nexTurn, response: RESPONSE_HIGHER });

    // should try a lower number
    return createNextState({ turn: nexTurn, response: RESPONSE_LOWER });
  };
};

/**
 *
 * @param configuration GameConfiguration
 * @return {{initialState: Record, play: Function}}
 * @constructor
 */
const Game = function (configuration) {

  const configuration_ = configuration || new Configuration();

  if (false === isIntegerGreaterThanZero(configuration_.maxNumber))
    throw new Error('Invalid maxNumber configuration. Must be an integer higher to 0');

  if (false === isIntegerLesserOrEqualTo,(configuration_.maxTries, configuration_.maxNumber))
    throw new Error('Invalid maxTries configuration. Must be an integer higher or equal to 1 and lower ro equal than the maxNumber.');

  // let's generate the number the play will have to guess
  const someNumberToGuess = generateRandomIntNumber(configuration_.maxNumber);
  if (someNumberToGuess === Maybe.Nothing)
    throw new Error('Error when generating the number to guess.');

  const engineConfiguration = new PlayEngineConfiguration({
    maxNumber: configuration_.maxNumber,
    maxTries: configuration_.maxTries,
    numberToGuess: someNumberToGuess.value(),
    initialState: new State()
  });

  return {
    initialState: engineConfiguration.initialState,
    play: new PlayEngine(engineConfiguration)
  };
};

module.exports = {

  // for tests purpose ---------------------------------------------------------

  core: {

    isNumber,
    isInteger,
    isIntegerGreaterThanZero,
    isIntegerLesserOrEqualTo,
    toInteger,

    generateRandomNumber,
    generateRandomIntNumber,

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
    PlayEngineConfiguration,
    PlayEngine
  },

  // mandatory in order to play ------------------------------------------------

  GameConfiguration,
  Game
};
