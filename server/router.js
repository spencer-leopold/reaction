var ReactionRouter = require('../shared/router');
var url = require('url');
var _ = require('lodash');
var MicroEvent = require('microevent');

function ServerRouter(options, hapiInstance) {
  this.server = hapiInstance;
  this.bind('route:add', this.addHapiRoute);

  ReactionRouter.call(this, options);
  this.buildRoutes();
}

/**
 * Set up inheritance.
 */
ServerRouter.prototype = Object.create(ReactionRouter.prototype);
ServerRouter.prototype.constructor = ServerRouter;

ReactionRouter.prototype.addHapiRoute = function(options) {
  var path;
  options = options || {};

  if (options.path) {
    path = options.path;
    path = path.replace(/\:([^\/\s]*)/g, '{$1}');

    if (path.charAt(0) !== '/') {
      path = '/' + path;
    }

    this.server.route({
      method: options.method,
      path: path,
      // Add a fetcher class that gets handled here
      handler: function (request, reply) {
        reply('Hello, '+path);
      }
    });
  }
}

module.exports = ServerRouter;
