'use strict';

var Subscriber = require('./Subscriber');

function RateHandler(side, fieldMap) {
  fieldMap = fieldMap || {};

  this.inputs = ['amount', 'tenor', 'currencyPair'];
  this.outputs = [side + '-rate'];

  this._side = side;
  this._subscriber = new Subscriber(this.inputs.map(function(field) {
    return (fieldMap[field]) ? fieldMap[field] : field;
  }));
}

RateHandler.prototype.handler = function(input, output, current) {
  output.rate = null;

  this._subscriber.requestSubject('/FX/' + input.currencyPair + '/' + input.tenor + '/' + this._side + '/' + input.amount, function(data) {
    output.rate = data.rate;
    output.hasBeenUpdated();
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
