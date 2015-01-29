'use strict';

var Subscriber = require('./Subscriber');

function RateHandler(side, fieldMap) {
  this.inputs = RateHandler.inputs;
  this.outputs = RateHandler.outputs;

  this._fieldMap = fieldMap || {};
  this._subscriber = new Subscriber(Object.keys(input).map(function(field) {
    return (this._fieldMap[field]) ? this._fieldMap[field] : field;
  }.bind(this)));
}

RateHandler.inputs = ['amount', 'tenor', 'currencyPair'];
RateHandler.outputs = ['rate'];

RateHandler.prototype.handler = function(input, output, current, modified) {
  output.rate = null;

  this._subscriber.requestSubject('/FX/' + input.currencyPair + '/' + input.tenor + '/' + this._side + '/' + input.amount, function(data) {
    output.rate = data.rate;
    output.markAsUpdated();
  });
};

handlerFunc.dispose = function() {
  this._subscriber.dispose();
};

module.exports = RateHandler;
