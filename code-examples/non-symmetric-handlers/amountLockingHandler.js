'use strict';

// this was a non-symmetric handler when I first started creating it but then I realized that it didn't have to be
function amountLockingHandler(input, output, current, modified) {
  if(input.globalAmount !== null) {
    output.amount = input.globalAmount;
  }
}

amountLockingHandler.inputs = ['globalAmount'];
amountLockingHandler.outputs = ['amount'];

module.exports = amountLockingHandler;
