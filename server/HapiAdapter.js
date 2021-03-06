// @TODO: Add API caching.
var BaseServerAdapter = require('./BaseServerAdapter');
var util = require('util');

/**
 * Constructs a new HapiAdapter instance.
 *
 * @class
 * @classdesc Adapter to use Reaction with Hapi as the server.
 * @augments BaseServerAdapter
 * @inheritdoc
 */
function HapiAdapter(options, server) {
  BaseServerAdapter.call(this, options, server);
  return server;
}

// Extend the BaseServerAdapter class.
util.inherits(HapiAdapter, BaseServerAdapter);

/**
 * @inheritdoc
 */
HapiAdapter.prototype.formatParams = function(path) {
  var formattedPath = path
    .replace(/\(\/\:([^\/\s]*)\)/g, '/{$1?}') // reformat optional parameters
    .replace(/\:([^\/\s]*)/g, '{$1}'); // reformat normal parameters

  return formattedPath;
}

/**
 * @inheritdoc
 */
HapiAdapter.prototype.handleResponse = function(req, reply, body) {
  reply(body);
}

/**
 * @inheritdoc
 */
HapiAdapter.prototype.handleNext = function(req, reply) {
  reply.continue();
}

/**
 * @inheritdoc
 */
HapiAdapter.prototype.addRoute = function(route, handler) {
  var config = {};
  var cache = route.options.cache;

  if (cache) {
    if (typeof cache === 'object') {
      config.cache = cache;
    }
    else if (typeof cache === 'number') {
      config.cache = {
        expiresIn: cache
      };
    }
    else {
      config.cache = {
        expiresIn: 60 * minute
      };
    }
  }

  this.server.route({
    method: 'GET',
    path: route.path,
    handler: handler,
    config: config
  });
}

/**
 * @inheritdoc
 */
HapiAdapter.prototype.attachApiProxy = function(apiPath, callback) {
  this.server.route({
    method: '*',
    path: apiPath + '/{p*}',
    handler: function(request, reply) {
      callback(request, reply);
    }
  });
}

/**
 * @inheritdoc
 */
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
