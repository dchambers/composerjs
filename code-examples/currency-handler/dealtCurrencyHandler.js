'use strict';

function dealtCurrencyHandler(input, output, current) {
  if(input.useBaseCurrency) {
    output.dealtCurrency = input.baseCurrency;
  }
  else {
    output.dealtCurrency = input.termCurrency;
  }
}

dealtCurrencyHandler.inputs = ['useBaseCurrency', 'baseCurrency', 'termCurrency'];
dealtCurrencyHandler.outputs = ['dealtCurrency'];

module.exports = dealtCurrencyHandler;
