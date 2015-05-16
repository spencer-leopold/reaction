var Router = require('../shared/router');
var Events = require('../shared/events');
var _ = require('lodash');

function Server(options, serverInstance) {
  // @TODO: Add some error checking for options
  this.options = options || {};
  this.serverRoutePaths = [];
  this.serverRoutesObj = {};

  this.expressRouter = false;

  if (options.express) {
    express = require('express');
    this.expressRouter = express.Router();
    this.server = serverInstance;
  }
  else {
    if (!options.appName && !options.mountPath) {
      this.server = serverInstance;
    }
    else {
      var serverName = (options.appName) ? options.appName : options.mountPath.replace(/^\//, '');
      var server = serverInstance.connection({ port: options.port, labels: serverName });
      this.server = server.select(serverName);
    }
  }

  // this.fetcher = Fetcher;
  // need to set the baseUrl, otherwise fetching relative paths
  // fail on initial page load
  // this.fetcher.setBaseUrl(this.server.info);

  // Listen for new routes and parse them for Hapi
  Events.on('route:add', this.addRoute, this);

  // Attach the router and trigger all routes to be built
  this.router = new Router(options);
  this.router.buildRoutes();

  // register our main route handler, this will run before
  // all user defined route handlers so the server reply can be
  // overriden
  this.attachPlugins();

  return this.expressRouter;
}

Server.prototype.addRoute = function(options, component, mainComponent) {
  var path = '', handler;
  options = options || {};

  if (options.path) {
    path = options.path;
    path = path.replace(/\:([^\/\s]*)/g, '{$1}');

    if (this.serverRoutePaths.indexOf(options.path) === -1) {

      // check path again after formatting
      if (this.serverRoutePaths.indexOf(path) === -1) {
        // Only add to route paths if it's also
        // a react route.  Need this otherwise
        // asset paths are picked up in getHandler
        if (options.name || component) {
          this.serverRoutePaths.push(path);
        }

        if (!options.handle || (typeof options.handle !== 'function' && typeof options.handle !== 'object')) {
          var action = 'view';

          if (this.expressRouter) {
            action = 'render';
          }

          handler = function(request, reply) {
            var attrs = request.attributes || {};
            // @TODO: add option for XML appData
            reply[action]('index', { body: attrs.body, appData: { data: attrs.appData, path: request.path } });
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
        if (this.expressRouter) {
          this.expressRouter.get(path, handler);
        }
        else {
          this.server.route({
            method: 'GET',
            path: path,
            handler: handler
          });
        }
      }
    }
  }
}

Server.prototype.attachPlugins = function() {
  // Add our fetcher to be used in getHandler
  var reactRoutes = this.router.routes;
  var serverRoutePaths = this.serverRoutePaths;
  var serverRoutesObj = this.serverRoutesObj;
  var pluginOptions = {
    reactRoutes: reactRoutes,
    serverRoutePaths: serverRoutePaths,
    serverRoutesObj: serverRoutesObj
  }

  if (this.expressRouter) {
    this.server.use(require('./middleware/expressApp')(pluginOptions));
  }
  else {
    this.server.register({
      register: require('./plugins/isoApp'),
      options: pluginOptions
    }, function(err) {
      if (err) {
        console.log(err);
      }
    });
  }

  // var serverRoutesObj = this.serverRoutesObj;

  // this.server.ext('onPreHandler', function(request, reply) {
  //   // Make sure we're calling the ReactRouter on an actual react path,
  //   // not an asset path or some other resource
  //   if (serverRoutePaths.indexOf(request.route.path) === -1) {
  //     reply.continue();
  //   }
  //   else {
  //     ReactRouter.run(reactRoutes, request.path, function(Handler, state) {
  //       fetcher.fetchData(state.routes, state.params).then(function(data) {
  //         markup = React.renderToString(React.createFactory(Handler)({ data: data }));
  //         // attach the markup and initial data to the
  //         // request object to be used with templates
  //         request.app.body = markup;
  //         request.app.appData = data;
  //         reply.continue();
  //       });
  //     });
  //   }
  // });

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
