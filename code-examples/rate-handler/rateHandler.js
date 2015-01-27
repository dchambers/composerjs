'use strict';

var Subscriber = require('./Subscriber');

function rateHandler(side, fieldMap) {
  fieldMap = fieldMap || {};

  var handlerFunc = function(input, output, current, state) {
    output.rate = null;

    state.subscriber.requestSubject('/FX/' + input.currencyPair + '/' + input.tenor + '/' + this._side + '/' + input.amount, function(data) {
      output.rate = data.rate;
      output.hasBeenUpdated();
    });
  };

  handlerFunc.inputs = ['amount', 'tenor', 'currencyPair'];
  handlerFunc.outputs = [side + '-rate'];

  handlerFunc.initState = function(state) {
    state.subscriber = new Subscriber(Object.keys(input).map(function(field) {
      return (fieldMap[field]) ? fieldMap[field] : field;
    }));
  };

  handlerFunc.disposeState = function(state) {
    state.subscriber.dispose();
  };

  return handlerFunc;
}

module.exports = rateHandler;
