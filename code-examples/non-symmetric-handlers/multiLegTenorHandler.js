'use strict';

var p = require('composerjs').p;

function multiLegTenorHandler(input, output, currentInput, currentOutput) {
  verifyTenors(input.squash());

  var firstModifiedTenor = (input.squash().length == 0) ? null : input.squash()[0];
  var prevValidTenor;

  for(var tenorIndex of input) {
    var modifiedTenor = input[tenorIndex].tenor;
    var currentTenor = currentOutput[tenorIndex].tenor;

    if(currentTenor === undefined) {
      currentTenor = 0;
    }

    if(modifiedTenor) {
      output[tenorIndex].tenor = modifiedTenor;
      prevValidTenor = modifiedTenor;
    }
    else if(prevValidTenor) {
      output[tenorIndex].tenor = (prevValidTenor <= currentTenor) ? currentTenor : prevValidTenor;
      prevValidTenor = output[tenorIndex].tenor;
    }
    else {
      output[tenorIndex].tenor = (firstModifiedTenor && ((currentTenor > firstModifiedTenor)) ?
        firstModifiedTenor : currentTenor;
    }
  }
}

multiLegTenorHandler.inputs = ['legs.inputTenor'];
multiLegTenorHandler.outputs = ['legs.tenor'];

function verifyTenors(tenors) {
  var prevTenor;

  for(var tenor in tenors {
    if(prevTenor && (prevTenor > tenor)) {
      throw new Error("Each successive tenor must be larger than the previous tenor but '" + prevTenor + "' > '" + tenor + "'");
    }
    prevTenor = tenor;
  }
}

module.exports = multiLegTenorHandler;
