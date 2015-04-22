var Router = require('../shared/router');
var React = require('react');
var ReactRouter = require('react-router');
var _ = require('lodash');

function Server(options, serverInstance) {
  // @TODO: Add some error checking for options
  this.options = options || {};
  var server = serverInstance.connection({ port: options.port, labels: options.appName });
  this.serverRoutePaths = [];
  this.serverRoutesObj = [];

  this.server = server.select(options.appName);

  this.router = new Router(options);
  this.router.bind('route:add', this.addRoute, this);

  this.router.buildRoutes();
  this.getHandler();
}

Server.prototype.addRoute = function(options) {
  var path = '', handler;
  var mountPath = this.options.mountPath
  options = options || {};

  if (options.path && this.serverRoutePaths.indexOf(options.path) === -1) {
    path = options.path;
    path = path.replace(/\:([^\/\s]*)/g, '{$1}');

    // check path again after formatting
    if (this.serverRoutePaths.indexOf(path) === -1) {
      // Only add to route paths if it's also
      // a react route.  Need this otherwise
      // asset paths are picked up in getHandler
      if (options.name) {
        this.serverRoutePaths.push(path);
      }

      if (!options.handle || (typeof options.handle !== 'function' && typeof options.handle !== 'object')) {
        handler = function(request, reply) {
          reply.view('index', { body: request.app.body });
        }
      }
      else {
        if (typeof options.handle === 'function') {
          handler = function(request, reply) {
            options.handle(request, reply);
          }
        }
        if (typeof options.handle === 'object') {
          handler = options.handle;
        }
      }

      // Add the route to hapi server
      this.server.route({
        method: 'GET',
        path: path,
        handler: handler
      });
    }
  }
}

Server.prototype.getHandler = function() {
  var fetcher = this.router.fetcher;
  var reactRoutes = this.router.routes;
  var serverRoutePaths = this.serverRoutePaths;
  var serverRoutesObj = this.serverRoutesObj;
  var that = this;

  this.server.ext('onPreHandler', function(request, reply) {
    if (serverRoutePaths.indexOf(request.route.path) >= 0) {
      ReactRouter.run(reactRoutes, request.path, function(Handler, state) {
        fetcher.fetchData(state.routes, state.params).then(function(data) {
          // loadingEvents.emit('loadEnd');
          markup = React.renderToString(React.createFactory(Handler)({ data: data, routes: reactRoutes }));
          request.app.body = markup;
          reply.continue();
        });
      });
    }
    else {
      reply.continue();
    }
  });

  //
  //
  // @TODO: Test app using hashbang paths, may need to use the below
  // commented out chunk to get that to work
  //
  //
  // this.server.register({ register: ReactionHandler }, function (err) {
  //   if (err) {
  //     console.error('Failed to load plugin:', err);
  //   }
  // });

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

module.exports = Server;
