'use strict';

function baseTermCurrencyHandler(input, output, current, modified) {
  output.baseCurrency = input.currencyPair.substr(0, 3);
  output.termCurrency = input.currencyPair.substr(4, 6);
}

baseTermCurrencyHandler.inputs = ['currencyPair'];
baseTermCurrencyHandler.outputs = ['baseCurrency', 'termCurrency'];

module.exports = baseTermCurrencyHandler;
