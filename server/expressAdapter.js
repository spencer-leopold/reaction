var BaseServerAdapter = require('./base/serverAdapter');
var url = require('url');
var util = require('util');

function ExpressAdapter(options, server) {
  BaseServerAdapter.call(this, options, server);
  return server;
}

/**
 * Extend base Server class
 */
util.inherits(ExpressAdapter, BaseServerAdapter);

ExpressAdapter.prototype.attachRoutes = function() {
  var route, handler, routes = this.serverRoutes;

  for (var i in routes) {
    route = routes[i];
    handler = this.buildHandler(route.options, 'send');
    this.server.get(route.path, handler);
  }
}

ExpressAdapter.prototype.routeCallback = function(callback) {
  return function(req, res, next) {
    var path;

    if (typeof req.url === 'string') {
      path = req.url;
    }
    else {
      path = req.url.path;
    }

    callback(req, path, next);
  }
}

ExpressAdapter.prototype.attachServerFetcher = function() {
  this.server.use(this.getFetcherCallback());
}

ExpressAdapter.prototype.attachApiProxy = function() {
  var middleware = this.loadApiProxy();
  var apiPath = this.options.apiPath || '/api';
  this.server.use(apiPath, middleware);
}

module.exports = ExpressAdapter;
