var React = require('react');
var Router = require('../../shared/router');
var Events = require('../../shared/events');
var _ = require('../../shared/lodash.custom');

function BaseServer(options) {
  // @TODO: Add some error checking for options
  this.options = options || {};
  this.serverRoutePaths = [];
  // Listen for new routes and parse them
  Events.on('route:add', this.parseRoute, this);
  // Attach the router and trigger all routes to be built
  this.router = new Router(options);
  this.router.buildRoutes();

  this.attachServerFetcher();
}

BaseServer.prototype.parseRoute = function(options, component, mainComponent) {
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

      this.addRoute(path, options);
    }
  }
}

BaseServer.prototype.buildHandler = function(options, responseMethod) {
  var handler;
  var entryPath = this.router.options.entryPath;
  var templatesDir = this.router.options.paths.templatesDir;
  var routeTemplate = options.template || 'layout';

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
        options.handle(request, response, next);
      }
    }
  }
  else {
    handler = function(request, response, next) {
      var reactionData = request.reactionData || {};
      var templateVars = {
        body: reactionData.body,
        appData: {
          data: reactionData.appData,
          path: request.path
        },
        start: function(replaceElement, locationType) {
          if (!replaceElement) {
            replaceElement = 'document.body';
          }
          var o = "<script type='text/javascript'>";
          o += "(function() {\n";
          o += "\tvar bootstrapData = "+JSON.stringify(reactionData.appData)+";\n";
          o += "\tvar appSettings = "+JSON.stringify(clientOptions)+";\n";
          o += "\tvar ReactionRouter = window.ReactionRouter = require('reaction').Router(appSettings);\n";
          o += "\tReactionRouter.start(bootstrapData, '"+locationType+"', "+replaceElement+");\n";
          o += "})();\n";
          o += "</script>";

          return o;
        }
      }

      var layoutTemplate = require(templatesDir + '/' + routeTemplate);
      var markup = React.renderToString(React.createFactory(layoutTemplate)(templateVars));

      if (!responseMethod) {
        response(markup);
      }
      else {
        response[responseMethod](markup);
      }

      if (next) {
        next();
      }
    }
  }

  return handler;
}

BaseServer.prototype.loadServerFetcher = function(type) {
  var reactRoutes = this.router.routes;
  var serverRoutePaths = this.serverRoutePaths;

  var pluginOptions = {
    clientRoutes: reactRoutes,
    serverRoutes: serverRoutePaths,
    type: type
  }

  return require('./serverFetcher')(pluginOptions);
}

/**
 * Implement these methods in child class
 */
BaseServer.prototype.attachServerFetcher = function(path, options) {
  throw new Error('`attachServerFetcher` needs to be implemented');
}

BaseServer.prototype.addRoute = function(path, options) {
  throw new Error('`addRoute` needs to be implemented');
}

BaseServer.prototype.formatParams = function(path) {
  throw new Error('`formatParams` needs to be implemented');
}

module.exports = BaseServer;
