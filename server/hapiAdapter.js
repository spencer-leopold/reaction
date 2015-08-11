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

HapiAdapter.prototype.handleResponse = function(req, reply, body) {
  reply(body);
}

HapiAdapter.prototype.handleNext = function(req, reply) {
  reply.continue();
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

HapiAdapter.prototype.attachServerFetcher = function(callback) {
  this.server.ext('onPreHandler', function(req, reply) {
    callback(req, reply);
  });
}

HapiAdapter.prototype.attachApiProxy = function(apiPath, callback) {
  this.server.route({
    method: '*',
    path: apiPath + '/{p*}',
    handler: function(request, reply) {
      callback(request, reply, reply);
    }
  });
}

HapiAdapter.prototype.attachErrorHandler = function(renderTemplateCb) {
  this.server.ext('onPreResponse', function(request, reply) {
    if (request.response && request.response.output && request.response.output.statusCode) {
      var errCode = request.response.output.statusCode;
      var markup = renderTemplateCb(errCode);
      return reply(markup)
    }

    return reply.continue();
  });
}

module.exports = HapiAdapter;
