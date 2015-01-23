'use strict';

var p = require('composerjs').p;
var Subscriber = require('./Subscriber');

function RateHandler(side, fieldMap) {
  fieldMap = fieldMap || {};

  this.inputs = ['amount', 'tenor', 'currencyPair'];
  this.outputs = [side + '-rate'];

  this._side = side;
  this._subscriber = new Subscriber(this.inputs.map(function(field) {
    return (fieldMap[field]) ? fieldMap[field] : field
  }));
}

RateHandler.prototype.handler = function(in, out) {
  out.rate = null;

  this._subscriber.requestSubject('/FX/' + in.currencyPair + '/' + in.tenor + '/' + this._side + '/' + in.amount, function(data) {
    out.rate = data.rate;
    out.hasBeenUpdated();
  });
};

RateHandler.prototype.dispose = function() {
  this._subscriber.dispose();
};

RateHandler.prototype.pause = function() {
  this._subscriber.pause();
};

RateHandler.prototype.unpause = function() {
  this._subscriber.unpause();
};

module.exports = RateHandler;
