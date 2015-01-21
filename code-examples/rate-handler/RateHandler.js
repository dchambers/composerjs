'use strict';

var p = require('composerjs').p;
var Subscription = require('./Subscription');

function RateHandler() {
  var subscription = new Subscription(null, fieldMap);

  var handler = function(in, out) {
    if(subscription.updateSubject('/FX/' + in.currencyPair + '/' + in.tenor + '/' + in.baseCurrency + '/' + in.amount)) {
      return false;
    }
    else {
      out.rate = subscription.data.rate;
    }
  };

  handler.dispose = function() {
    subscription.dispose();
  };

  handler.inputs = ['amount', 'tenor', 'baseCurrency', 'currencyPair'];
  handler.outputs = ['rate'];

  this.handler = handler;
  this._subscription = subscription;
}

RateHandler.prototype.pause = function() {
  this._subscription.pause();
};

RateHandler.prototype.unpause = function() {
  this._subscription.unpause();
};

module.exports = RateHandler;
