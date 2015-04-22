/**
 * Modified version of MicroEvent (to add an execution context)
 * MicroEvent - to make any js object an event emitter (server or browser)
*/

var MicroEvent = function() {}
MicroEvent.prototype = {
	bind: function(event, fct, ctx){
		this._events = this._events || {};
		this._events[event] = this._events[event]	|| [];
		if (!ctx) ctx = this;
		this._events[event].push({ fn: fct, ctx: ctx });
	},
	unbind: function(event, fct){
		this._events = this._events || {};
		if( event in this._events === false  )	return;
		this._events[event].splice(this._events[event].indexOf(fct), 1);
	},
	trigger: function(event /* , args... */){
		this._events = this._events || {};
		if( event in this._events === false  )	return;
		for(var i = 0; i < this._events[event].length; i++){
			var calledEvent = this._events[event][i];
			var fn = calledEvent.fn;
			var ctx = calledEvent.ctx;
			fn.apply(ctx, Array.prototype.slice.call(arguments, 1))
		}
	}
};

/**
 * mixin will delegate all MicroEvent.js function in the destination object
 *
 * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
 *
 * @param {Object} the object which will support MicroEvent
*/
MicroEvent.mixin	= function(destObject){
	var props	= ['bind', 'unbind', 'trigger'];
	for (var i = 0; i < props.length; i ++) {
		destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
	}
}

// export in common js
module.exports	= MicroEvent
