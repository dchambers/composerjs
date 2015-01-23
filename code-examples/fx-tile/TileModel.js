'use strict';

var composerjs = require('composerjs');
var p = composerjs.p;
var ps = composerjs.ps; // TODO: document this feature
var currencyHandler = require('../currency-handler/currencyHandler');
var RateHandler = require('../rate-handler/RateHandler');

function TileModel(currencyPair) {
  var bidRateHandler = new RateHandler().handler;
  var askRateHandler = new RateHandler().handler;

  composerjs.mixinTo(this);
  this.addHandler(currencyHandler);
  this.addHandler(ps(bidRateHandler.inputs).prefixedWith('bid-'), [p('rate').as('bid-rate')], bidRateHandler);
  this.addHandler(ps(askRateHandler.inputs).prefixedWith('ask-'), [p('rate').as('ask-rate')], askRateHandler);
  this.set('tenor', 'SPOT');
  this.set('amount', 1);
  this.set('currencyPair', currencyPair);
  this.seal();
}

module.exports = TileModel;
