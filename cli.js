#!/usr/bin/node
'use strict';

require('colors');
const readline = require('readline-sync');

const lib = require('.game');

const print = console.log;
const printTab = function () {
  print.apply(null, ['\t'].concat(Array.from(arguments)));
};

const configuration = new lib.Configuration();
const game = new lib.Game(configuration);

print();
printTab('Ready to play?'.bold)
printTab('Configuration:', JSON.stringify(configuration).yellow);
printTab('CTRL+C to exit'.italic.grey);

(function nextTurn (previousState) {

  print();

  const number = readline.questionInt(`\t(Turn ${previousState.turn + 1} > What is your number? `.bold);
  const state = game.play(number, previousState);

  debugger;

  if (state.error)
    printTab(('Error: ' + state.error.message).bold.red);

  if (state.end) {

    if (state.haveWon)
      printTab('\nCongraluations! We have won!'.bold.green);
    else if (state.haveLost)
      printTab('\nOh... you have lost'.bold.orange);

    return; // end of game (recursive call)
  }

  if (state.response)
    printTab(('You should find a ' + state.response + ' number').bold.yellow);

  nextTurn(state);

})(game.initialState);
