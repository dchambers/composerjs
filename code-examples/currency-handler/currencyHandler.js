'use strict';

function currencyHandler(in, out, current) {
  out.baseCurrency = in.currencyPair.substr(0, 3);
  out.termCurrency = in.currencyPair.substr(4, 6);
}

currencyHandler.inputs = ['currencyPair'];
currencyHandler.outputs = ['baseCurrency', 'termCurrency'];

module.exports = currencyHandler;
