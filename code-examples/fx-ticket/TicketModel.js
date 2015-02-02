'use strict';

var composerjs = require('composerjs');
var baseTermCurrencyHandler = require('../currency-handler/baseTermCurrencyHandler');
var dealtCurrencyHandler = require('../currency-handler/dealtCurrencyHandler');
var multiLegTenorHandler = require('../tenor-handler/multiLegTenorHandler');
var RateHandler = require('../rate-handler/RateHandler');

function TicketModel(currencyPair) {
  composerjs.mixinTo(this);
  this.define('useBaseCurrency', true);
  this.define('type', 'outright');
  this.define('currencyPair', currencyPair);
  this.addHandler(baseTermCurrencyHandler);
  this.addHandler(dealtCurrencyHandler);

  this.addNodeList('legs', {amount: 1});
  this.legs.addHandler(multiLegTenorHandler);
  this.legs.addHandlerConstructor(
    this.legs.props(RateHandler.inputs).relativeTo('..').for('currencyPair'),
    this.legs.props(RateHandler.outputs).prefixedWith('bid'),
    RateHandler.bind(null, 'bid'));
  this.legs.addHandlerConstructor(
    this.legs.props(RateHandler.inputs).relativeTo('..').for('currencyPair'),
    this.legs.props(RateHandler.outputs).prefixedWith('ask'),
    RateHandler.bind(null, 'ask'));
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
  this.set('useBaseCurrency', !this.get('useBaseCurrency'));
};

module.exports = TicketModel;
