'use strict';

function currencyHandler(input, output, current, modified) {
  output.baseCurrency = input.currencyPair.substr(0, 3);
  output.termCurrency = input.currencyPair.substr(4, 6);
}

currencyHandler.inputs = ['currencyPair'];
currencyHandler.outputs = ['baseCurrency', 'termCurrency'];

module.exports = currencyHandler;
