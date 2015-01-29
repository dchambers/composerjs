'use strict';

var p = require('composerjs').p;

// TODO: add support for broken tenors provided as ISO date strings (will require a 'businessDate'
// input-property since the tenor days for broken tenors will tick as 'businessDate' changes)
function multiLegTenorHandler(input, output, current, modified) {
  verifyTenors(modified.squash());

  var firstModifiedTenor = (modified.squash().length == 0) ? null : modified.squash()[0];
  var prevValidTenor;

  for(var tenorIndex of modified) {
    var modifiedTenor = modified[tenorIndex].tenor;
    var currentTenor = current[tenorIndex].tenor;

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

multiLegTenorHandler.inputs = [];
multiLegTenorHandler.outputs = [p('tenor').asList()];

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
