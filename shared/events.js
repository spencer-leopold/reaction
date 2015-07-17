'use strict';

function ScopedEvents() {
}

/**
 * Creates a listener for an event
 * @param {String} event 
 * @param {Function} fn
 * @param {Object} ctx
 */
ScopedEvents.prototype.on = function(event, fn, ctx) {
  if (!fn) {
    throw new Error('A callback function is required when adding an event listener');
  }

  this._listeners = this._listeners || {};
  this._listeners[event] = this._listeners[event] || [];

  if (!this._listeners[event].length) {
    this._listeners[event].push({ fn: fn, ctx: ctx || this });
  }
  else {
    var matches = this.getExistingMatch(this._listeners[event], fn, ctx);

    // If exact listener already exists, don't add a duplicate
    if (!matches.length) {
      this._listeners[event].push({ fn: fn, ctx: ctx || this });
    }
  }
};

/**
 * Removes one or all listeners. If ctx is null remove all
 * with supplied fn, if fn is null removes all listeners to
 * event, if event is null it removes all listeners
 * @param {String} event 
 * @param {Function} fn
 * @param {Object} ctx
 */
ScopedEvents.prototype.remove = function(event, fn, ctx) {
  this._listeners = this._listeners || {};

  var matches;

  if (!event && !fn && !ctx) {
    this._listeners = [];
    return this._listeners;
  }

  if (!event) {
    for (var evt in this._listeners) {
      if (this._listeners.hasOwnProperty(evt)) {

        var listener = this._listeners[evt];
        matches = this.getExistingMatch(listener, fn, ctx);

        for (var i = 0; i < matches.length; i++) {
          listener.splice(matches[i], 1);
        }

        // Remove listener entirely if nothing
        // is bound to it
        if (!listener.length) {
          delete this._listeners[evt];
        }
      }
    }

    return this._listeners;
  }

  // If a fn is passed in, remove that exact listener.
  // If not, remove all listeners under that event
  if (!!this._listeners[event]) {
    if (!fn && !ctx) {
      delete this._listeners[event];
    }
    else {
      matches = this.getExistingMatch(this._listeners[event], fn, ctx);

      for (var j = 0; j < matches.length; j++) {
        this._listeners[event].splice(matches[j], 1);
      }
    }
  }
};

/**
 * Triggers all scopes of an event.  So if you have an event listener
 * on "route" and the event "route:add" is triggered, the event for
 * "route" is called as well as anything listening to "route:add"
 * All additional arguments will be passed to the callback function
 * of anything listening for the event (or the parent scopes).
 *
 * The "all" event will be always be triggered regardless of the
 * event name.
 * @param {String} event 
 */
ScopedEvents.prototype.trigger = function(event) {
  this._listeners = this._listeners || {};

  var evt = '';
  var namespaces = event.split(':');
  var namespaces_length = namespaces.length;

  var args = Array.prototype.slice.call(arguments, 1);

  // trigger event and all parent scopes of event
  for (var i = 0; i < namespaces_length; i++) {
    var namespace = namespaces[i];

    if (evt === '') {
      evt = namespace;
    }
    else {
      evt += ':'+namespace;
    }

    // If event "test:scope:one" was triggered, when it triggers each scope up the chain
    // "test:scope" will have a directChildScope of "one", and "test" will have the
    // directChildScope of "scope:one"
    var directChildScope = namespaces.slice(i+1, namespaces_length).join(':');

    if (directChildScope === '') {
      directChildScope = null;
    }

    if (!!this._listeners[evt]) {
      var listeners = this._listeners[evt];
      var listeners_length = listeners.length;

      for (var j = 0; j < listeners_length; j++) {
        var listener = listeners[j];
        listener.fn.apply(listener.ctx || this, [directChildScope].concat(args));
      }
    }

    // Trigger the 'all' event and send the called event's
    // name and each additional argument to any 'all' listeners.
    this.triggerEventAll.apply(this, [evt].concat(args));
  }
};

/**
 * Triggers the 'all' event and passes the original event name
 * and any other arguments along with it
 * @param {String} event 
 */
ScopedEvents.prototype.triggerEventAll = function(event) {
  this._listeners = this._listeners || {};

  if (!!this._listeners.all) {
    var listeners = this._listeners.all;
    var listeners_length = listeners.length;

    for (var i = 0; i < listeners_length; i++) {
      var listener = listeners[i];
      listener.fn.apply(listener.ctx || this, arguments);
    }
  }
};

/**
 * Returns an array of indexes of matching event listeners
 * @param {Array} listeners
 * @param {Function} fn
 * @param {Object} ctx
 */
ScopedEvents.prototype.getExistingMatch = function(listeners, fn, ctx) {
  var indexes = listeners.map(function(obj, idx) {
    if (!ctx) {
      if (obj.fn === fn) {
        return idx;
      }
    }
    else if (!fn) {
      if (obj.ctx === ctx) {
        return idx;
      }
    }
    else {
      if (obj.fn === fn && obj.ctx === ctx) {
        return idx;
      }
    }
  }).filter(isFinite);

  return indexes;
};

ScopedEvents.mixin = function(obj) {
  var methods = ['on', 'remove', 'trigger', 'triggerEventAll', 'getExistingMatch'];
  var ctor = (typeof obj === 'function') ? obj.prototype : obj;

  for (var i = 0; i < methods.length; i++) {
    var method = methods[i];
    ctor[method] = ScopedEvents.prototype[method];
  }

  return ctor;
};

ScopedEvents.Dispatcher = new ScopedEvents();

module.exports = ScopedEvents;
