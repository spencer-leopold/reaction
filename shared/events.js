function EventDispatcher() {
  this._listeners = {};
}

EventDispatcher.prototype.on = function(event, fn, ctx) {
  this._listeners[event] = this._listeners[event] || [];

  if (!ctx) {
    ctx = this;
  }

  this._listeners[event].push({ fn: fn, ctx: ctx });
}

EventDispatcher.prototype.remove = function(event, fn) {
  if (this._listeners[event] instanceof Array) {
		this._listeners[event].splice(this._listeners[event].indexOf(fn), 1);
  }
}

/*
 * The trigger method triggers all scopes of an event.  So if you have an event
 * binding to `route` and the event `route:add` is triggered, the binding for
 * `route` is called as well as anything bound to `route:add`
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

      for (var i = 0; i < listeners_length; i++) {
        var listener = listeners[i];
        var fn = listener.fn;
        var ctx = listener.ctx;
        fn.apply(ctx, Array.prototype.slice.call(arguments, 1))
      }
    }
  }
}

var Dispatcher = (function() {
  var instance;

  function createInstance() {
    return new EventDispatcher();
  }
 
  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };

})();

module.exports = Dispatcher.getInstance();
