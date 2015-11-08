//
// @TODO: Need a better way to match routes
// (or at least use React-Routers match functionality)
//

var React = require('react');
var ReactRouter = require('react-router');
var ReactionFetcher = require('../../shared/fetcher');
var DataManager = require('../../shared/components/DataManager');
var Router = require('../../shared/router');
var qs = require('qs2');
var debug = require('debug')('reaction');
var _ = require('../../shared/lodash.custom');

function BaseAdapter(options, server) {
  // @TODO: Add some error checking for options
  this.options = options || {};
  this.server = server;
  this.serverRoutes = [];
  this.serverRoutePaths = [];

  // Attach the router and bind to all events
  this.router = new Router(options);

  // Listen for new routes and parse them
  this.router.on('route:add', this.parseRoute, this);
  this.router.on('routes:finished', this.onRoutesFinished, this);

  this.router.buildRoutes();

  if (this.options.api) {
    if (!this.options.dataAdapter) {
      this.options.dataAdapter = require('../data_adapters/rest_adapter');
    }

    var dataAdapter = new this.options.dataAdapter(options.api);
    var apiPath = this.options.apiPath || '/api';
    this.attachApiProxy(apiPath, dataAdapter.request.bind(dataAdapter));
  }

  this.attachErrorHandler(this.errorHandler());
}

BaseAdapter.prototype.parseRoute = function(event, options, component, mainComponent) {
  var path = '', handler;
  options = options || {};

  if (options.path) {
    path = options.path;
    path = this.formatParams(path);

    if (this.serverRoutePaths.indexOf(path) === -1) {
      // Only add to route paths if it's also
      // a react route. Prevents adding routes
      // for stuff like assets.
      if (options.name || component) {
        this.serverRoutePaths.push(path);
      }

      this.serverRoutes.push({ path: path, options: options });
    }
  }
}

BaseAdapter.prototype.buildHandler = function(options) {
  var handler;
  var handleResponse = this.handleResponse;
  var handleNext = this.handleNext;
  var entryPath = this.router.options.entryPath;
  var templatesDir = this.router.options.paths.templatesDir;
  var routeTemplate = options.template || 'layout';

  var renderReactApp = this.renderReactApp;
  var routes = this.router.routes;
  var appOptions = this.options;

  // Rewrite app paths for use on client-side
  var clientOptions = _.cloneDeep(this.router.options);
  clientOptions.entryPath = '';
  clientOptions.paths.entryPath = '';
  clientOptions.paths.routes = clientOptions.paths.routes.replace(entryPath, '');
  clientOptions.paths.componentsDir = clientOptions.paths.componentsDir.replace(entryPath, '');
  clientOptions.paths.templatesDir = clientOptions.paths.templatesDir.replace(entryPath, '');

  if (options.handle) {
    if (typeof options.handle !== 'function') {
      throw new Error('Route handle must be a function');
    }
    else {
      handler = function(request, response, next) {
        renderReactApp(request, appOptions, routes).then(function(data) {
          request.reactionData = data;
          options.handle(request, response, next);
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

BaseAdapter.prototype.renderReactApp = function(req, options, routes) {
  var path;
  var fetcher = ReactionFetcher(options);
  var clientRoutes = routes;
  // var errorHandler = this.errorHandler();

  return new Promise(function(resolve, reject) {

    if (typeof req.url === 'string') {
      path = req.url;
    }
    else {
      path = req.url.path;
    }

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

    if (req.query && !_.isEmpty(req.query) && path.indexOf('?') === -1) {
      path += '?' + qs.stringify(req.query);
    }

    ReactRouter.run(clientRoutes, path, function(Handler, state) {
      var isNotFound = state.routes.some(function(route) {
        return route.isNotFound;
      });

      if (isNotFound) {
        var data = {
          body: errorHandler(404),
          appData: {} 
        };

        resolve(data);
      }
      else {
        fetcher.fetchData(state.routes, state.params, state.query).then(function(routeData) {

          // Check for a page title
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

          // var markup = React.renderToString(React.createFactory(Handler)(routeData));
          var markup = React.renderToString(React.createFactory(DataManager)({ handler: Handler, data: routeData }));

          // attach the markup and initial data to the request
          // object to be injected into layout templates
          var data = {
            body: markup,
            appData: routeData 
          };

          resolve(data);
        });
      }
    });
  });
}

BaseAdapter.prototype.errorHandler = function() {
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

BaseAdapter.prototype.onRoutesFinished = function() {
  var route, handler, routes = this.serverRoutes;

  for (var i in routes) {
    route = routes[i];
    handler = this.buildHandler(route.options);

    debug("Adding route %s", route.path);
    this.addRoute(route, handler);
  }
}

/**
 * Implement these methods in child class
 */
BaseAdapter.prototype.addRoute = function(route, handler) {
  throw new Error('`addRoute` needs to be implemented');
}

BaseAdapter.prototype.handleResponse = function(req, res, body) {
  throw new Error('`handleResponse` needs to be implemented');
}

BaseAdapter.prototype.handleNext = function(req, res, next) {
  throw new Error('`handleNext` needs to be implemented');
}

/**
 * attachErrorHandler needs to return middleware that
 * returns the rendered error template
 * @param {Function} renderTemplateCb 
 *
 * renderTemplateCb 
 * @param {String} errCode
 */
BaseAdapter.prototype.attachErrorHandler = function(renderTemplateCb) {
  throw new Error('`attachErrorHandler` needs to be implemented');
}

// Most servers use a similar route convention so we shouldn't
// require `formatParams` to be implemented, instead by default
// we just return the path so that it can be overridden for cases
// like when using Hapi
BaseAdapter.prototype.formatParams = function(path) {
  return path;
}

BaseAdapter.prototype.attachApiProxy = function(options) {
  throw new Error('`attachApiProxy` needs to be implemented');
}

module.exports = BaseAdapter;
