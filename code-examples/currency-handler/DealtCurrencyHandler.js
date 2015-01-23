'use strict';

var p = require('composerjs').p;

function DealtCurrencyHandler() {
  this._baseCurrency = true;

  this.inputs = ['baseCurrency', 'termCurrency'];
  this.outputs = ['dealtCurrency'];
}

DealtCurrencyHandler.prototype.handler = function(in, out) {
  if(this._baseCurrency) {
    out.dealtCurrency = in.baseCurrency;
  }
  else {
    out.dealtCurrency = in.termCurrency;
  }
};

DealtCurrencyHandler.prototype.switch = function() {
  this._baseCurrency = !this._baseCurrency;
};
