'use strict';

var p = require('composerjs').p;

function currencyHandler(in, out) {
  out.baseCurrency = in.currencyPair.substr(0, 3);
  out.termCurrency = in.currencyPair.substr(4, 6);
}

currencyHandler.inputs = ['currencyPair'];
currencyHandler.outputs = ['baseCurrency'];

module.exports = currencyHandler;
