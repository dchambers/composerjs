'use strict';

var composerjs = require('composerjs');
var p = composerjs.p;
var ps = composerjs.ps;
var currencyHandler = require('../currency-handler/currencyHandler');
var DealturrencyHandler = require('../currency-handler/DealtCurrencyHandler');
var RateHandler = require('../rate-handler/RateHandler');

function TileModel(currencyPair) {
  this._dealtCurrencyHandler = new DealtCurrencyHandler();

  composerjs.mixinTo(this);
  this.addHandler(currencyHandler);
  this.addHandler(this._dealtCurrencyHandler);
  this.addHandler(new RateHandler('bid'));
  this.addHandler(new RateHandler('ask'));
  this.set('tenor', 'spot');
  this.set('amount', 1);
  this.set('currencyPair', currencyPair);
  this.seal();
}

TileModel.prototype.switchDealtCurrency() {
  this._dealtCurrencyHandler.switch();
};

module.exports = TileModel;
