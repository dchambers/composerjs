'use strict';

var composerjs = require('composerjs');
var p = composerjs.p;
var ps = composerjs.ps;
var currencyHandler = require('../currency-handler/currencyHandler');
var multiLegTenorHandler = require('../tenor-handler/multiLegTenorHandler');
var RateHandler = require('../rate-handler/RateHandler');

function TicketModel(currencyPair) {
  this._dealtCurrencyHandler = new DealtCurrencyHandler();
  var bidRateHandler = new RateHandler('bid');
  bidRateHandler.inputs = ps(bidRateHandler.inputs).relativeTo(this).excluding('currencyPair');
  var askRateHandler = new RateHandler('ask');
  askRateHandler.inputs = ps(askRateHandler.inputs).relativeTo(this).excluding('currencyPair');

  composerjs.mixinTo(this);
  this.addNodeList('legs');
  this.addHandler(currencyHandler);
  this.addHandler(this._dealtCurrencyHandler);
  this.legs.addHandler(bidRateHandler);
  this.legs.addHandler(askRateHandler);
  this.legs.addHandler(multiLegTenorHandler);
  this.legs.set('amount', 1);
  this.set('type', 'outright');
  this.set('currencyPair', currencyPair);
  this.seal();

  this.legs.addNode();
  this.type.on('change', function(type) {
    if(type == 'outright') {
      this.legs.removeNode();
    }
    else {
      this.legs.addNode();
    }
  });
}

TicketModel.prototype.switchDealtCurrency() {
  this._dealtCurrencyHandler.switch();
};

module.exports = TicketModel;
