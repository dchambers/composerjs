'use strict';

var composerjs = require('composerjs');
var baseTermCurrencyHandler = require('../currency-handler/baseTermCurrencyHandler');
var dealtCurrencyHandler = require('../currency-handler/dealtCurrencyHandler');
var RateHandler = require('../rate-handler/RateHandler');

function TileModel(currencyPair) {
  composerjs.mixinTo(this);
  this.define('useBaseCurrency', true);
  this.define('tenor', 0);
  this.define('amount', 1);
  this.define('currencyPair', currencyPair);
  this.addHandler(baseTermCurrencyHandler);
  this.addHandler(dealtCurrencyHandler);
  this.addHandlerConstructor(RateHandler.inputs,
    this.props(RateHandler.outputs).prefixedWith('bid'), RateHandler.bind(null, 'bid'));
  this.addHandlerConstructor(RateHandler.inputs,
    this.props(RateHandler.outputs).prefixedWith('ask'), RateHandler.bind(null, 'ask'));
  this.seal();
}

TileModel.prototype.switchDealtCurrency() {
  this.set('useBaseCurrency', !this.get('useBaseCurrency'));
};

module.exports = TileModel;
