'use strict';

var p = require('composerjs').p;
var Subscriber = require('./Subscriber');

function RateHandler(side, fieldMap) {
  fieldMap = fieldMap || {};

  this.inputs = [p('amount'), p('tenor'), p('currencyPair')];
  this.outputs = [p(side + '-rate')];

  var handler = function(in, out) {
    out.rate = null;

    subscriber.requestSubject('/FX/' + in.currencyPair + '/' + in.tenor + '/' + side + '/' + in.amount, function(data) {
      out.rate = data.rate;
      out.hasBeenUpdated();
    });
  };

  handler.dispose = function() {
    subscriber.dispose();
  };

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
