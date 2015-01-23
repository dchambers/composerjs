'use strict';

var composerjs = require('composerjs');
var p = composerjs.p;
var ps = composerjs.ps;
var currencyHandler = require('../currency-handler/currencyHandler');
var RateHandler = require('../rate-handler/RateHandler');

function TicketModel(currencyPair) {
  // TODO: the RateHandler doesn't currently support multi-leg trades
  var bidRateHandler = new RateHandler().handler;
  var askRateHandler = new RateHandler().handler;

  composerjs.mixinTo(this);
  this.addNodeList('legs');
  this.addHandler(currencyHandler);
  var rateHandlerInputs = ps(bidRateHandler).relativeTo(this);
  this.legs.addHandler(ps(rateHandlerInputs).prefixedWith('bid-'), [p('rate').as('bid-rate')], bidRateHandler);
  this.legs.addHandler(ps(rateHandlerInputs).prefixedWith('ask-'), [p('rate').as('ask-rate')], askRateHandler);
  this.set('type', 'OUTRIGHT');
  this.set('tenor', 'SPOT');
  this.set('amount', 1);
  this.set('currencyPair', currencyPair);
  this.seal();

  this.legs.addNode();
  this.type.on('change', function(type) {
    if(type == 'OUTRIGHT') {
      this.legs.removeNode();
    }
    else {
      this.legs.addNode();
    }
  });
}

module.exports = TicketModel;
