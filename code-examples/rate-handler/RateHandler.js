'use strict';

var p = require('composerjs').p;
var Subscriber = require('./Subscriber');

function RateHandler(fieldMap) {
  fieldMap = fieldMap || {};

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

  handler.inputs = [p('amount'), p('tenor'), p('baseCurrency'), p('currencyPair')];
  handler.outputs = [p('rate')];

  var mappedFields = handler.inputs.map(function(field) {
    return (fieldMap[field]) ? fieldMap[field] : field
  });
  var subscriber = new Subscriber(mappedFields);

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
