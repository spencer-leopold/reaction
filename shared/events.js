function EventDispatcher() {
  this._listeners = {};
}

EventDispatcher.prototype.on = function(event, fn, ctx) {
  this._listeners[event] = this._listeners[event] || [];
  this._listeners[event].push({ fn: fn, ctx: ctx || this });
}

EventDispatcher.prototype.remove = function(event, fn) {
  // If a fn is passed in, remove that exact listener.
  // If not, remove all listeners under that event
  if (this._listeners[event] instanceof Array) {
    if (fn) {
      var indexes = this._listeners[event].map(function(obj, idx) {
        if (obj.fn === fn) {
          return idx;
        }
      }).filter(isFinite);

      for (var i = 0; i < indexes.length; i++) {
        this._listeners[event].splice(i, 1);
      }
    }
    else {
      delete this._listeners[event];
    }
  }
}

/*
 * Triggers all scopes of an event.  So if you have an event listener
 * on "route" and the event "route:add" is triggered, the event for
 * "route" is called as well as anything listening to "route:add"
 */
EventDispatcher.prototype.trigger = function(event) {
  var evt = '';
  var namespaces = event.split(':');
  var namespaces_length = namespaces.length;

  // trigger event and all parent scopes of event
  for (var i = 0; i < namespaces_length; i++) {
    var namespace = namespaces[i];

    if (evt === '') {
      evt = namespace;
    }
    else {
      evt += ':'+namespace;
    }

    if (this._listeners[evt] instanceof Array) {
      var listeners = this._listeners[evt];
      var listeners_length = listeners.length;

      for (var j = 0; j < listeners_length; j++) {
        var listener = listeners[j];
        listener.fn.apply(listener.ctx || this, Array.prototype.slice.call(arguments, 1))
      }
    }

    this.triggerAllEvent(evt);
  }
}

EventDispatcher.prototype.triggerAllEvent = function(evt) {
  if (this._listeners['all'] instanceof Array) {
    var listeners = this._listeners['all'];
    var listeners_length = listeners.length;

    for (var j = 0; j < listeners_length; j++) {
      var listener = listeners[j];
      listener.fn.apply(listener.ctx || this, arguments)
    }
  }
}

EventDispatcher.prototype.mixin = function(Constructor) {
  var methods = ['on', 'remove', 'trigger'];

  for (var i = 0; i < methods.length; i++) {
    Constructor.prototype[method[i]] = this[method[i]];
  }
}

module.exports = new EventDispatcher();
