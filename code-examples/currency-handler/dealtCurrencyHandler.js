'use strict';

function dealtCurrencyHandler(in, out, current) {
  if(in.useBaseCurrency) {
    out.dealtCurrency = in.baseCurrency;
  }
  else {
    out.dealtCurrency = in.termCurrency;
  }
}

dealtCurrencyHandler.inputs = ['currencySide', 'baseCurrency', 'termCurrency'];
dealtCurrencyHandler.outputs = ['dealtCurrency'];

module.exports = dealtCurrencyHandler;
