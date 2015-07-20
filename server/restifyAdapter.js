var BaseServerAdapter = require('reaction/server/base/serverAdapter');
var util = require('util');

function RestifyAdapter(options, server) {
  BaseServerAdapter.call(this, options, server);
  return server;
}

/**
 * Extend base Server class
 */
util.inherits(RestifyAdapter, BaseServerAdapter);

RestifyAdapter.prototype.attachRoutes = function() {
  var route, handler, routes = this.serverRoutes;

  for (var i in routes) {
    route = routes[i];
    handler = this.buildHandler(route.options, 'send');
    this.server.get(route.path, handler);
  }
}

RestifyAdapter.prototype.routeCallback = function(callback) {
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

RestifyAdapter.prototype.attachServerFetcher = function() {
  this.server.use(this.getFetcherCallback());
}

RestifyAdapter.prototype.attachApiProxy = function() {
  var middleware = this.loadApiProxy();
  var apiPath = this.options.apiPath || '/api';
  this.server.get(apiPath, middleware);
}

module.exports = RestifyAdapter;
