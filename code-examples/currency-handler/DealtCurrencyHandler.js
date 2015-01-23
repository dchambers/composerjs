'use strict';

var p = require('composerjs').p;

function DealtCurrencyHandler() {
  this._baseCurrency = true;

  this.handler = function(in, out) {
    if(this._baseCurrency) {
      out.dealtCurrency = in.baseCurrency;
    }
    else {
      out.dealtCurrency = in.termCurrency;
    }
  }.bind(this);
}

DealtCurrencyHandler.prototype.switch = function() {
  this._baseCurrency = !this._baseCurrency;
};
