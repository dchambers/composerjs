'use strict';

var composerjs = require('composerjs');
var currencyHandler = require('../currency-handler/currencyHandler');
var multiLegTenorHandler = require('../tenor-handler/multiLegTenorHandler');
var RateHandler = require('../rate-handler/RateHandler');

function TicketModel(currencyPair) {
  this._dealtCurrencyHandler = new DealtCurrencyHandler();
  var bidRateHandler = new RateHandler('bid');
  bidRateHandler.inputs = composerjs.props(bidRateHandler.inputs).relativeTo(this).excluding('currencyPair');
  var askRateHandler = new RateHandler('ask');
  askRateHandler.inputs = composerjs.props(askRateHandler.inputs).relativeTo(this).excluding('currencyPair');

  composerjs.mixinTo(this);
  this.addNodeList('legs');
  this.addHandler(currencyHandler);
  this.addHandler(this._dealtCurrencyHandler);
  this.legs.addHandler(bidRateHandler);
  this.legs.addHandler(askRateHandler);
  this.legs.set('tenor', 'spot');
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
      this.legs.item(1).set('tenor', this.legs.item(0).get('tenor'));
    }
  });
}

TicketModel.prototype.switchDealtCurrency() {
  this._dealtCurrencyHandler.switch();
};

module.exports = TicketModel;
