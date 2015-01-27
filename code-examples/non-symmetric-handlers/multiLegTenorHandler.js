'use strict';

function multiLegTenorHandler(input, output, current, index) {
  if((index > 0) && isTenorLessThan(current[index].tenor, current[index - 1].tenor)) {
    output.tenor = current[index - 1].tenor;
  }
  else if((index < (current.length - 1)) && !isTenorLessThan(current[index].tenor, current[index + 1].tenor)) {
    output.tenor = current[index + 1].tenor;
  }
  else {
    output.tenor = current[index].tenor;
  }
}

multiLegTenorHandler.inputs = [];
multiLegTenorHandler.outputs = ['tenor'];

function isTenorLessThan(tenor1, tenor2) {
  // Note: this function isn't correctly implemented, but is indicative of what should exist
  return tenor < tenor2;
}

module.exports = multiLegTenorHandler;
