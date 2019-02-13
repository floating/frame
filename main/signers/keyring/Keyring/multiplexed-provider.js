function MultiplexedProvider(subProvider) {
  this.subProvider = subProvider;
};

MultiplexedProvider.prototype.send = function (payload, callback) {
  const responseId = payload.id
  payload.id = Math.floor(Math.random()*1000000)
  return this.subProvider.send(payload,(err,response)=>{
    callback(response,err)
  });
};


/**
 Will add the error and end event to timeout existing calls
 @method addDefaultEvents
 */
MultiplexedProvider.prototype.addDefaultEvents = function(){
    return this.subProvider.addDefaultEvents();
};

/**
 Will parse the response and make an array out of it.
 @method _parseResponse
 @param {String} data
 */
MultiplexedProvider.prototype._parseResponse = function(data) {
    return this.subProvider._parseResponse(data);
};


/**
 Adds a callback to the responseCallbacks object,
 which will be called if a response matching the response Id will arrive.
 @method _addResponseCallback
 */
MultiplexedProvider.prototype._addResponseCallback = function(payload, callback) {
    return this.subProvider._addResponseCallback(payload, callback);
};

/**
 Timeout all requests when the end/error event is fired
 @method _timeout
 */
MultiplexedProvider.prototype._timeout = function() {
    return this.subProvider._timeout();
};


/**
 Subscribes to provider events.provider
 @method on
 @param {String} type    'notifcation', 'connect', 'error', 'end' or 'data'
 @param {Function} callback   the callback to call
 */
MultiplexedProvider.prototype.on = function (type, callback) {
    return this.subProvider.on(type, callback);
};

// TODO add once

/**
 Removes event listener
 @method removeListener
 @param {String} type    'notifcation', 'connect', 'error', 'end' or 'data'
 @param {Function} callback   the callback to call
 */
MultiplexedProvider.prototype.removeListener = function (type, callback) {
    return this.subProvider.removeListener(type, callback);
};

/**
 Removes all event listeners
 @method removeAllListeners
 @param {String} type    'notifcation', 'connect', 'error', 'end' or 'data'
 */
MultiplexedProvider.prototype.removeAllListeners = function (type) {
    return this.subProvider.removeAllListeners(type);
};

/**
 Resets the providers, clears all callbacks
 @method reset
 */
MultiplexedProvider.prototype.reset = function () {
    return this.subProvider.reset();
};

MultiplexedProvider.prototype.disconnect = function () {
    return this.subProvider.disconnect();
};

module.exports = MultiplexedProvider;
