'use strict';

function amountLockingHandler(input, output, current, index) {
  if(input.globalAmount !== null) {
    output.amount = input.globalAmount;
  }
}

amountLockingHandler.inputs = ['globalAmount'];
amountLockingHandler.outputs = ['amount'];

module.exports = amountLockingHandler;
