'use strict';

var messageService = require('service!caplin.message-service');

function Subscriber(fields) {
  this._fields = fields;
}

Subscriber.prototype.requestSubject = function(subject, callback) {
  if(this._messageServiceSubcription) {
    this._messageServiceSubcription.dispose();
  }

  this._callback = callback;
  this._messageServiceSubcription = messageService.subscribe(subject, this, {fields: this._fields});
};

Subscriber.prototype.onDataUpdate = function(subject, data) {
  this._callback(data);
};

Subscriber.prototype.onStatusUpdate = function(subject, status) {
  // do nothing: need to know how model error handling will work first
};

Subscriber.prototype.onError = function(subject, errorType) {
  // do nothing: need to know how model error handling will work first
};

module.exports = Subscriber;
