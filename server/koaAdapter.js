var _route, _mount;
var BaseServerAdapter = require('./base/serverAdapter');
var util = require('util');

//
// Don't want to make koa-route and koa-mount required
// dependencies, since Koa is only one of a few different
// servers supported.
//

// Try to load koa-route, log error to console if not found
try {
  _route = require('koa-route');
}
catch (e) {
  console.error('In order to use Reaction with Koa you need to add "koa-route" to your dependencies in package.json');
}

// Try to load koa-mount, log error to console if not found
try {
  _mount = require('koa-mount');
}
catch (e) {
  console.error('In order to use Reaction with Koa you need to add "koa-mount" to your dependencies in package.json');
}

function KoaAdapter(options, server) {
  BaseServerAdapter.call(this, options, server);
  return server;
}

/**
 * Extend base Server class
 */
util.inherits(KoaAdapter, BaseServerAdapter);

KoaAdapter.prototype.handleResponse = function(req, ctx, body) {
  ctx.body = body;
}

// Make handleNext a noop
KoaAdapter.prototype.handleNext = function(req, ctx, next) {
}

KoaAdapter.prototype.addRoute = function(route, handler) {
  this.server.use(_route.get(route.path, function *() {
    var req = this.request;
    handler(req, this);
  }));
}

KoaAdapter.prototype.attachServerFetcher = function(callback) {
  var run = this.attachAppDataAsync.bind(this);

  this.server.use(function *(next) {
    yield next;

    var data, req = this.request;

    try {
      data = yield run(req);
    }
    catch (e) {
    }

    req.reactionData = data;
  });
}

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

KoaAdapter.prototype.attachErrorHandler = function(renderTemplateCb) {
  this.server.use(function *() {
    if (!this.response.headersSent) {
      this.body = renderTemplateCb(404);
    }
  });
}

module.exports = KoaAdapter;
