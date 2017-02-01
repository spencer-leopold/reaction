var _route, _mount;
var BaseServerAdapter = require('./base/serverAdapter');
var util = require('util');

// We don't want to make koa-route and koa-mount required dependencies since
// Koa is only one of a few different servers supported. If it's used we'll
// try loading each dependency and throw and error if it's not found.

// Try to load koa-route.
try {
  _route = require('koa-route');
}
catch (e) {
  throw new Error('In order to use Reaction with Koa you need to add "koa-route" to your dependencies in package.json');
}

// Try to load koa-mount.
try {
  _mount = require('koa-mount');
}
catch (e) {
  throw new Error('In order to use Reaction with Koa you need to add "koa-mount" to your dependencies in package.json');
}

/**
 * Constructs a new KoaAdapter instance.
 *
 * @class
 * @classdesc Adapter to use Reaction with Koa as the server.
 * @augments BaseAdapter
 * @inheritdoc
 */
function KoaAdapter(options, server) {
  BaseServerAdapter.call(this, options, server);
  return server;
}

// Extend the BaseAdapter class.
util.inherits(KoaAdapter, BaseServerAdapter);

/**
 * @inheritdoc
 */
KoaAdapter.prototype.handleResponse = function(req, ctx, body) {
  ctx.body = body;
}

/**
 * @inheritdoc
 */
KoaAdapter.prototype.handleNext = function(req, ctx, next) {
}

/**
 * @inheritdoc
 */
KoaAdapter.prototype.addRoute = function(route, handler) {
  this.server.use(_route.get(route.path, function *() {
    var req = this.request;
    handler(req, this);
  }));
}

/**
 * @inheritdoc
 */
KoaAdapter.prototype.attachApiProxy = function(apiPath, callback) {
  function cbThunk(req) {
    return function(cb) {
      callback(req, cb);
    };
  }

  this.server.use(_mount(apiPath, function *(next) {
    yield next;

    var body, req = this.request;

    try {
      body = yield cbThunk(req);
    }
    catch (e) {}

    this.body = body;
  }));
}

/**
 * @inheritdoc
 */
KoaAdapter.prototype.attachErrorHandler = function(renderTemplateCb) {
  this.server.use(function *() {
    if (!this.response.headersSent) {
      this.body = renderTemplateCb(404);
    }
  });
}

module.exports = KoaAdapter;
