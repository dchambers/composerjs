'use strict';

var p = require('composerjs').p;
var CurrencyPairUtil = require('caplin/fx/util/CurrencyPair');

function currencyHandler(in, out) {
  out.baseCurrency = CurrencyPairUtil.getBaseCurrency(in.currencyPair);
}

currencyHandler.inputs = [p('currencyPair')];
currencyHandler.outputs = [p('baseCurrency')];

module.exports = currencyHandler;
