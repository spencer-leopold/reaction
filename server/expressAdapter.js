var BaseServerAdapter = require('./base/serverAdapter');
var util = require('util');

function ExpressAdapter(options, serverInstance) {
  this.server = serverInstance;

  BaseServerAdapter.call(this, options);

  return this.server;
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

ExpressAdapter.prototype.attachServerFetcher = function() {
  var middleware = this.loadServerFetcher();
  this.server.use(middleware);
}

ExpressAdapter.prototype.attachApiProxy = function() {
  var middleware = this.loadApiProxy();
  var apiPath = this.options.apiPath || '/api';
  this.server.use(apiPath, middleware);
}

module.exports = ExpressAdapter;
