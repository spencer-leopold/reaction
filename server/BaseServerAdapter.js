// @TODO: Add caching options.
// @TODO: Need a way to add middleware that adds onto reactionData object.
// @TODO: Need a better way to match routes (or at least use React-Routers
// match functionality)

var React = require('react');
var ReactRouter = require('react-router');
var ReactionFetcher = require('../shared/fetcher');
var DataManager = require('../shared/components/DataManager');
var Router = require('../shared/router');
var qs = require('qs2');
var debug = require('debug')('reaction');
var _ = require('../shared/lodash.custom');

/**
 * Constructor.
 *
 * @class
 * @classdesc This class should be extended instead of used directly.
 *
 * @param {Object} options - The app's configuration.
 * @param {Object} server - An instance of the server being used.
 */
function BaseServerAdapter(options, server) {
  // @TODO: Add some error checking for options
  this.options = options || {};
  this.server = server;
  this.serverRoutes = [];
  this.serverRoutePaths = [];

  // Attach the router and bind to all events.
  this.router = new Router(options);

  // Listen for new routes and parse them.
  this.router.on('route:add', this.parseRoute, this);
  this.router.on('routes:finished', this.onRoutesFinished, this);

  this.router.buildRoutes();

  if (this.options.api) {
    if (!this.options.dataAdapter) {
      this.options.dataAdapter = require('./DataAdapter/RestAdapter');
    }

    var dataAdapter = new this.options.dataAdapter(options.api);
    var apiPath = this.options.apiPath || '/api';
    this.attachApiProxy(apiPath, dataAdapter.request.bind(dataAdapter));
  }

  this.attachErrorHandler(this.errorHandler());
}

/**
 * Parses a single route.
 *
 * @param {String} event - This function is called as an event callback with
 *   this parameter being any child events called in the same scope.
 * @param {Object} options - The route options.
 * @param {Object} component - The component associated with the route.
 * @param {Object} mainComponent - The main/parent component for the route.
 */
BaseServerAdapter.prototype.parseRoute = function(event, options, component, mainComponent) {
  var path = '', handler;
  options = options || {};

  if (options.path) {
    path = options.path;
    path = this.formatParams(path);

    if (this.serverRoutePaths.indexOf(path) === -1) {
      // Only add to route paths if it's also a react route. Prevents adding
      // routes for stuff like assets.
      if (options.name || component) {
        this.serverRoutePaths.push(path);
      }

      this.serverRoutes.push({ path: path, options: options });
    }
  }
}

/**
 * Builds the server-side Route handler.
 *
 * @param {Object} options - The route options.
 * @returns {Function} - The server-side route handler function.
 */
BaseServerAdapter.prototype.buildHandler = function(options) {
  var handler;
  var handleResponse = this.handleResponse;
  var handleNext = this.handleNext;
  var entryPath = this.router.options.entryPath;
  var templatesDir = this.router.options.paths.templatesDir;
  var routeTemplate = options.template || 'layout';

  var renderReactApp = this.renderReactApp;
  var routes = this.router.routes;
  var appOptions = this.options;

  // Rewrite app paths for use on client-side.
  var clientOptions = _.cloneDeep(this.router.options);
  clientOptions.entryPath = '';
  clientOptions.paths.entryPath = '';
  clientOptions.paths.routes = clientOptions.paths.routes.replace(entryPath, '');
  clientOptions.paths.componentsDir = clientOptions.paths.componentsDir.replace(entryPath, '');
  clientOptions.paths.templatesDir = clientOptions.paths.templatesDir.replace(entryPath, '');

  if (options.handle || options.handler.handleRequest) {
    var handleRequest = options.handle || options.handler.handleRequest;

    if (typeof handleRequest !== 'function') {
      throw new Error('Route handle must be a function');
    }
    else {
      handler = function(request, response, next) {
        renderReactApp(request, appOptions, routes).then(function(data) {
          request.reactionData = data;
          handleRequest(request, response, next);
        }).catch(function(e) {
          console.log(e);
        });
      }
    }
  }
  else {
    handler = function(request, response, next) {

      renderReactApp(request, appOptions, routes).then(function(data) {
        var reactionData = data || {};
        var pageTitle = 'Reaction App';

        if (reactionData.appData && reactionData.appData.title) {
          pageTitle = reactionData.appData.title;
        }

        var templateVars = {
          body: reactionData.body,
          appData: reactionData.appData,
          title: pageTitle,
          start: function(replaceElement, locationType) {
            var o = "(function() {\n";
            o += "\tvar bootstrapData = "+JSON.stringify(reactionData.appData)+";\n";
            o += "\tvar appSettings = "+JSON.stringify(clientOptions)+";\n";
            o += "\tvar ReactionRouter = window.ReactionRouter = require('reaction').Router(appSettings);\n";
            o += "\tReactionRouter.start(bootstrapData, '"+locationType+"', '"+replaceElement+"');\n";
            o += "})();\n";

            return o;
          }
        }

        var layoutTemplate = require(templatesDir + '/' + routeTemplate);
        var markup = React.renderToString(React.createFactory(layoutTemplate)(templateVars));

        handleResponse(request, response, markup);

        if (next) {
          handleNext(request, response, next);
        }
      }).catch(function(e) {
        console.log(e);
      });
    }
  }

  return handler;
}

/**
 * Handles rendering the React app.
 *
 * @param {Object} req - The request.
 * @param {Object} options - The Reaction configuration options.
 * @param {Object} routes - The routes object.
 * @returns {Promise.<Object>} - An object containing the rendered React app
 *   and the current app-level props.
 */
BaseServerAdapter.prototype.renderReactApp = function(req, options, routes) {
  var path;
  var fetcher = ReactionFetcher(options);
  var clientRoutes = routes;

  // Need a router instance to use the static "match" method.
  var localRouter = ReactRouter.create({ routes: routes });

  return new Promise(function(resolve, reject) {
    var baseUrl = options.baseUrl || false;

    if (!baseUrl) {
      var protocol = '';
      var host = req.headers.host;

      if (host.indexOf('https://') === -1) {
        protocol = 'http://';
      }

      baseUrl = protocol + host;
    }

    fetcher.setBaseUrl(baseUrl);

    // Some servers use a url object to define each part of the url.
    if (typeof req.url === 'string') {
      path = req.url;
    }
    else {
      path = req.url.path;
    }

    // Append query string to path.
    if (req.query && !_.isEmpty(req.query) && path.indexOf('?') === -1) {
      path += '?' + qs.stringify(req.query);
    }

    ReactRouter.run(clientRoutes, path, function(Handler, state) {
      // If path doesn't match a defined route, skip over it.
      if (!localRouter.match(path)) {
        return resolve();
      }

      var isNotFound = state.routes.some(function(route) {
        return route.isNotFound;
      });

      if (isNotFound) {
        var data = {
          body: errorHandler(404),
          appData: {} 
        };

        return resolve(data);
      }

      fetcher.fetchData(state.routes, state.params, state.query).then(function(routeData) {

        // Check for a page title.
        state.routes.forEach(function(route) {
          if (route.title) {
            routeData.title = route.title;
          }
        });

        if (!routeData.path) {
          routeData.path = path;
        }
        if (!routeData.params) {
          routeData.params = state.params;
        }
        if (!routeData.query) {
          routeData.query = state.query;
        }

        routeData.baseUrl = baseUrl;

        var markup = React.renderToString(React.createFactory(DataManager)({ handler: Handler, data: routeData }));

        // Attach the markup and initial data to the request object so it can
        // be injected into layout templates.
        var data = {
          body: markup,
          appData: routeData 
        };

        resolve(data);
      });
    });
  });
}

/**
 * Handles error responses.
 *
 * @returns {Function} - The function that renders the error page.
 */
BaseServerAdapter.prototype.errorHandler = function() {
  var templatesDir = this.router.options.paths.templatesDir;
  var template = false;

  return function(errCode) {
    try {
      template = require(templatesDir + '/error_'+errCode);
    }
    catch(e) {
    }

    if (!template) {
      try {
        template = require(templatesDir + '/error');
      }
      catch(e) {
        throw new Error('You need to create an error template');
      }
    }

    var markup = React.renderToString(React.createFactory(template)());
    return markup;
  }
}

/**
 * Event handler that runs once all routes are processed.
 */
BaseServerAdapter.prototype.onRoutesFinished = function() {
  var route, handler, routes = this.serverRoutes;

  for (var i in routes) {
    route = routes[i];
    handler = this.buildHandler(route.options);

    debug("Adding route %s", route.path);
    this.addRoute(route, handler);
  }
}

/**
 * The following methods should be implemented in a child class.
 */

/**
 * Adds a route to the server.
 * @abstract
 * @param {Object} route - The route.
 * @param {Function} handler - The request handler.
 */
BaseServerAdapter.prototype.addRoute = function(route, handler) {
  throw new Error('`addRoute` needs to be implemented');
}

/**
 * Handles a response.
 *
 * @abstract
 * @param {Object} req - The request.
 * @param {Object} res - The response.
 * @param {Object|Array|String} body - The response body.
 */
BaseServerAdapter.prototype.handleResponse = function(req, res, body) {
  throw new Error('`handleResponse` needs to be implemented');
}

/**
 * Handles proceeding to the next callback.
 *
 * @abstract
 * @param {Object} req - The request.
 * @param {Object} res - The response.
 * @param {Function} next - The next callback.
 */
BaseServerAdapter.prototype.handleNext = function(req, res, next) {
  throw new Error('`handleNext` needs to be implemented');
}

/**
 * The callback to render an error template.
 *
 * @callback errorTemplateCb
 * @param {Number} errCode - The response error code.
 */

/**
 * Attaches the error handler middleware.
 *
 * @abstract
 * @param {errorTemplateCb} cb - The callback that renders an error template.
 */
BaseServerAdapter.prototype.attachErrorHandler = function(cb) {
  throw new Error('`attachErrorHandler` needs to be implemented');
}

/**
 * Attaches the API Proxy.
 *
 * @abstract
 * @param {Object} options - The Reaction configuration options.
 */
BaseServerAdapter.prototype.attachApiProxy = function(options) {
  throw new Error('`attachApiProxy` needs to be implemented');
}

/**
 * Formats URL parameters.
 *
 * Most servers use a similar route convention so we shouldn't require
 * `formatParams` to be implemented, instead by default we just return the
 * path so that it can be overridden for cases like when Hapi is used.
 *
 * @param {String} path - The request path.
 */
BaseServerAdapter.prototype.formatParams = function(path) {
  return path;
}

module.exports = BaseServerAdapter;
