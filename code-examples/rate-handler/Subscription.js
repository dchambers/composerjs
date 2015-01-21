'use strict';

var messageService = require('service!caplin.message-service');

function Subscription(subject, fields) {
  this._fields = fields;

  if(subject) {
    this.updateSubject(subject);
  }
}

Subscription.prototype.updateSubject = function(subject) {
  var subjectUpdated = false;

  if(subject != this._subject) {
    subjectUpdated = true;

    if(this._messageServiceSubcription) {
      this._messageServiceSubcription.dispose();
    }

    this._messageServiceSubcription = messageService.subscribe(subject, this, {fields: this._fields});
  }

  return subjectUpdated;
};

Subscription.prototype.onDataUpdate = function(subject, updateData) {
  this.data = updateData;
};

Subscription.prototype.onStatusUpdate = function(subject, status) {
  // do nothing: need to know how model error handling will work first
};

Subscription.prototype.onError = function(subject, errorType) {
  // do nothing: need to know how model error handling will work first
};

module.exports = Subscription;
