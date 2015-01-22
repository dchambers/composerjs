'use strict';

var p = require('composerjs').p;
var Subscriber = require('./Subscriber');

function RateHandler(fieldMap) {
  var mappedFields = handler.inputs.map(function(field) {
    return (fieldMap[field]) ? fieldMap[field] : field
  });
  var subscriber = new Subscriber(mappedFields);

  var handler = function(in, out) {
    out.rate = null;

    subscriber.requestSubject('/FX/' + in.currencyPair + '/' + in.tenor + '/' + in.baseCurrency + '/' + in.amount, function(data) {
      out.rate = data.rate;
      out.hasBeenUpdated();
    });
  };

  handler.dispose = function() {
    subscriber.dispose();
  };

  handler.inputs = ['amount', 'tenor', 'baseCurrency', 'currencyPair'];
  handler.outputs = ['rate'];

  this.handler = handler;
  this._subscriber = subscriber;
}

RateHandler.prototype.pause = function() {
  this._subscriber.pause();
};

RateHandler.prototype.unpause = function() {
  this._subscriber.unpause();
};

module.exports = RateHandler;
