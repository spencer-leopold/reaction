var ReactionRouter = require('../shared/router');
var ReactionServerRouteHandler = require('./plugins/handler');
var url = require('url');
var _ = require('lodash');
var MicroEvent = require('microevent');

function ServerRouter(options, hapiInstance) {
  this.server = hapiInstance;
  this.serverRoutes = [];
  this.bind('route:add', this.addHapiRoute);

  ReactionRouter.call(this, options);
  this.buildRoutes();
  this.getHandler();
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

    this.serverRoutes.push(path);

    this.server.route({
      method: options.method,
      path: path,
      // Add a fetcher class that gets handled here
      handler: function (request, reply) {
        // console.log(reply);
        reply('Hello, '+path);
      }
    });
  }
}

ReactionRouter.prototype.getHandler = function() {
  this.server.app.fetcher = this.fetcher;
  this.server.app.reactRoutes = this.routes;
  this.server.app.serverRoutes = this.serverRoutes;

  this.server.register({ register: ReactionServerRouteHandler }, function (err) {
    if (err) {
        console.error('Failed to load plugin:', err);
    }
  });
}

module.exports = ServerRouter;
