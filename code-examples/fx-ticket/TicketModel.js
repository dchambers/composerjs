'use strict';

var composerjs = require('composerjs');
var currencyHandler = require('../currency-handler/currencyHandler');
var dealtCurrencyHandler = require('../currency-handler/dealtCurrencyHandler');
var multiLegTenorHandler = require('../tenor-handler/multiLegTenorHandler');
var RateHandler = require('../rate-handler/RateHandler');

function TicketModel(currencyPair) {
  composerjs.mixinTo(this);
  this.set('useBaseCurrency', true);
  this.set('type', 'outright');
  this.set('currencyPair', currencyPair);
  this.addHandler(currencyHandler);
  this.addHandler(dealtCurrencyHandler);

  this.addNodeList('legs');
  this.legs.set('tenor', 'spot');
  this.legs.set('amount', 1);
  var rateInputs = this.legs.props(RateHandler.inputs).relativeTo('..').for('currencyPair');
  this.legs.addHandlerConstructor(rateInputs,
    this.props(RateHandler.outputs).prefixedWith('bid'), RateHandler.bind(null, 'bid'));
  this.legs.addHandlerConstructor(rateInputs,
    this.props(RateHandler.outputs).prefixedWith('ask'), RateHandler.bind(null, 'ask'));
  this.seal();

  this.legs.addNode();
  this.type.on('change', function(type) {
    if(type == 'outright') {
      this.legs.removeNode();
    }
    else {
      this.legs.addNode();
      this.legs.item(1).set('tenor', this.legs.item(0).get('tenor')); // TODO: move this logic into a handler
    }
  });
}

TicketModel.prototype.switchDealtCurrency() {
  this.set('useBaseCurrency', !this.get('useBaseCurrency'));
};

module.exports = TicketModel;
