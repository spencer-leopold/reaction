var ReactionRouter = require('../shared/router');
var ReactionHandler = require('./plugins/handler');
var url = require('url');
var _ = require('lodash');
var MicroEvent = require('microevent');

function ServerRouter(options, hapiInstance) {
  this.server = hapiInstance;
  this.serverRoutePaths = [];
  this.serverRoutesObj = [];
  this.bind('route:add', this.addHapiRoute);

  ReactionRouter.call(this, options);
}

/**
 * Set up inheritance.
 */
ServerRouter.prototype = Object.create(ReactionRouter.prototype);
ServerRouter.prototype.constructor = ServerRouter;

ReactionRouter.prototype.addHapiRoute = function(options) {
  console.log('added hapi route');
  var path;
  var mountPath = this.options.mountPath
  options = options || {};

  if (options.path && this.serverRoutePaths.indexOf(options.path) === -1) {
    path = options.path;
    path = path.replace(/\:([^\/\s]*)/g, '{$1}');

    // prepend parent route's path if route
    // is relative
    if (path.charAt(0) !== '/') {
      if (options.parentRoutePath) {
        path = options.parentRoutePath + '/' + path;
      }
      else {
        return false;
      }
    }


    // check path again after formatting
    if (this.serverRoutePaths.indexOf(path) === -1) {
      this.serverRoutePaths.push(path);

      this.serverRoutesObj.push({
        method: 'GET',
        path: path,
        handler: function (request, reply) {
          if (options.handle && typeof options.handle === 'function') {
            options.handle(request, reply);
          }
          else {
            reply.view('index', { body: request.app.body });
          }
        }
      });
    }

  }
}

ReactionRouter.prototype.getHandler = function() {
  this.server.app.fetcher = this.fetcher;
  this.server.app.reactRoutes = this.routes;
  this.server.app.serverRoutePaths = this.serverRoutePaths;
  this.server.app.serverRoutesObj = this.serverRoutesObj;

  //
  //
  // @TODO: Test app using hashbang paths, may need to use the below
  // commented out chunk to get that to work
  //
  //
  this.server.register({ register: ReactionHandler }, function (err) {
    if (err) {
      console.error('Failed to load plugin:', err);
    }
  });

  // this.server.register({ register: ReactionHandler }, {
  //   routes: {
  //     prefix: '/dash'
  //   }
  // }, function (err) {
  //   if (err) {
  //       console.error('Failed to load plugin:', err);
  //   }
  // });
}

module.exports = ServerRouter;
