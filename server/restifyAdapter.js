var BaseServerAdapter = require('reaction/server/base/serverAdapter');
var util = require('util');

function RestifyAdapter(options, server) {
  this.server = server;

  BaseServerAdapter.call(this, options);

  return this.server;
}

/**
 * Extend base Server class
 */
util.inherits(RestifyAdapter, BaseServerAdapter);

RestifyAdapter.prototype.attachRoutes = function(routes) {
  var route, handler;

  for (var i in routes) {
    route = routes[i];
    handler = this.buildHandler(route.options, 'send');
    this.server.get(route.path, handler);
  }
}

RestifyAdapter.prototype.attachServerFetcher = function() {
  var middleware = this.loadServerFetcher();
  this.server.use(middleware);
}

RestifyAdapter.prototype.attachApiProxy = function() {
  var middleware = this.loadApiProxy();
  var apiPath = this.options.apiPath || '/api';
  this.server.get(apiPath, middleware);
}

module.exports = RestifyAdapter;
