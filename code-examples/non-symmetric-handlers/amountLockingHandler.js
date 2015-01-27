'use strict';

function amountLockingHandler(input, output, current, index) {
  if(input.amountLocked) {
    output.amount = current[0].amount;
  }
}

module.exports = amountLockingHandler;
