'use strict';

function multiLegTenorHandler(in, out, current, index) {
  if((index > 0) && isTenorLessThan(current[index].tenor, current[index - 1].tenor)) {
    out.tenor = current[index - 1].tenor;
  }
  else if((index < (current.length - 1)) && !isTenorLessThan(current[index].tenor, current[index + 1].tenor)) {
    out.tenor = current[index + 1].tenor;
  }
  else {
    out.tenor = current[index].tenor;
  }
}

function isTenorLessThan(tenor1, tenor2) {
  // Note: this function is currently incorrectly implemented
  return tenor < tenor2;
}

module.exports = multiLegTenorHandler;
