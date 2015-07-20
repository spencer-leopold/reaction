var BaseServerAdapter = require('./base/serverAdapter');
var util = require('util');

function HapiAdapter(options, server) {
  BaseServerAdapter.call(this, options, server);
  return server;
}

/**
 * Extend base Server class
 */
util.inherits(HapiAdapter, BaseServerAdapter);

HapiAdapter.prototype.formatParams = function(path) {
  var formattedPath = path
    .replace(/\(\/\:([^\/\s]*)\)/g, '/{$1?}') // reformat optional parameters
    .replace(/\:([^\/\s]*)/g, '{$1}'); // reformat normal parameters

  return formattedPath;
}

HapiAdapter.prototype.attachRoutes = function() {
  var route, handler, routes = this.serverRoutes;

  for (var i in routes) {
    route = routes[i];
    handler = this.buildHandler(route.options);

    this.server.route({
      method: 'GET',
      path: route.path,
      handler: handler
    });
  }
}

HapiAdapter.prototype.routeCallback = function(callback) {
  var serverFetcher = {
    register: function(server, options, next) {
      server.ext('onPreHandler', function(request, reply) {
        callback(request, request.route.path, reply.continue.bind(reply));
      });

      next();
    }
  }

  serverFetcher.register.attributes = {
    name: 'ServerFetcher',
    version: '1.0.0'
  }

  return serverFetcher;
}

HapiAdapter.prototype.attachServerFetcher = function() {
  var plugin = this.getFetcherCallback();

  this.server.register({
    register: plugin
  }, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

HapiAdapter.prototype.attachApiProxy = function() {
  var plugin = this.loadApiProxy('plugin');
  var apiPath = this.options.apiPath || '/api';

  this.server.register({ register: plugin }, {
    routes: {
      prefix: apiPath
    }
  }, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

module.exports = HapiAdapter;
