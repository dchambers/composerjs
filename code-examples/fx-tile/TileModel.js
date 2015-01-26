'use strict';

var composerjs = require('composerjs');
var currencyHandler = require('../currency-handler/currencyHandler');
var dealtCurrencyHandler = require('../currency-handler/dealtCurrencyHandler');
var RateHandler = require('../rate-handler/RateHandler');

function TileModel(currencyPair) {
  composerjs.mixinTo(this);
  this.addHandler(currencyHandler);
  this.addHandler(dealtCurrencyHandler);
  this.addHandler(new RateHandler('bid'));
  this.addHandler(new RateHandler('ask'));
  this.set('useBaseCurrency', true);
  this.set('tenor', 'spot');
  this.set('amount', 1);
  this.set('currencyPair', currencyPair);
  this.seal();
}

TileModel.prototype.switchDealtCurrency() {
  this.set('useBaseCurrency', !this.get('useBaseCurrency'));
};

module.exports = TileModel;
