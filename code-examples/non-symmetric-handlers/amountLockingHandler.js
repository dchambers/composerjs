'use strict';

function amountLockingHandler(in, out, current, index) {
  if(in.amountLocked) {
    out.amount = current[0].amount;
  }
}

module.exports = amountLockingHandler;
