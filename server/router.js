var ReactionRouter = require('../shared/router');
var ReactionServerRouteHandler = require('./plugins/handler');
var url = require('url');
var _ = require('lodash');
var MicroEvent = require('microevent');

function ServerRouter(options, hapiInstance) {
  this.server = hapiInstance;
  this.serverRoutePaths = [];
  this.serverRoutesObj = [];
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
  var mountPath = this.options.mountPath
  options = options || {};

  if (options.path) {
    path = options.path;
    path = path.replace(/\:([^\/\s]*)/g, '{$1}');

    // @TODO: Get relative paths to actually work
    if (path.charAt(0) !== '/') {
      path = '/' + path;
    }

    // Remove the mountPath from initial React Routes
    if (mountPath !== '' && path.substr(0, mountPath.length)) {
      if (path === mountPath) {
        path = '/';
      }
      else {
        path = path.replace(path.substr(0, 5), '');
      }
    }

    this.serverRoutePaths.push(path);

    this.serverRoutesObj.push({
      method: 'GET',
      path: path,
      // Add a fetcher class that gets handled here
      handler: function (request, reply) {
        reply.view('index', { body: request.app.body });
      }
    });
  }
}

ReactionRouter.prototype.getHandler = function() {
  this.server.app.fetcher = this.fetcher;
  this.server.app.reactRoutes = this.routes;
  this.server.app.serverRoutePaths = this.serverRoutePaths;
  this.server.app.serverRoutesObj = this.serverRoutesObj;

  this.server.register({ register: ReactionServerRouteHandler }, {
    routes: {
      prefix: '/dash'
    }
  }, function (err) {
    if (err) {
        console.error('Failed to load plugin:', err);
    }
  });
}

module.exports = ServerRouter;
