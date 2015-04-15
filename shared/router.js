var React = require('react');
var ReactRouter = require('react-router');
var Route = ReactRouter.Route;
var DefaultRoute = ReactRouter.DefaultRoute;
var RouteHandler = ReactRouter.RouteHandler;
var Link = ReactRouter.Link;
var url = require('url');
var _ = require('lodash');
var MicroEvent = require('microevent');

function ReactionRouter(options) {
  this.routes = [];
  this._initOptions(options);
}

_.extend(ReactionRouter.prototype, MicroEvent, {

  _initOptions: function(options) {
    var entryPath;

    options = options || {};
    options.paths = options.paths || {};

    entryPath = options.paths.entryPath || options.entryPath;

    options.paths = _.defaults(options.paths, {
      entryPath: entryPath,
      routes: entryPath + '/routes',
      componentsDir: entryPath + '/components'
    });

    this.options = options;
  },

  getComponentPath: function(componentName) {
    var componentDir = this.options.paths.componentDir;
    return componentDir + '/' + componentName;
  },

  loadComponent: function(componentName) {
    var componentPath = this.getcomponentPath(componentName);
    return require(componentPath);
  },

  ReactionRouter.prototype.getRouteBuilder = function() {
    return require(this.options.paths.routes);
  }

  ReactionRouter.prototype.createReactRoute = function(path, attrs) {
    var parentRoute = ReactRouter.createRoute({});
    ReactRouter.createDefaultRoute({ parentRoute: parentRoute });
    ReactRouter.createRoute({ parentRoute: parentRoute });

    this.reactRoutes.push(parentRoute);
  }

  ReactionRouter.prototype.createHapiRoute = function(path, cb) {
  }


  ReactionRouter.prototype.buildRoutes = function() {
    var routeBuilder = this.getRouteBuilder();
    var routes = [];

    function captureRoutes() {
      routes.push(arguments);
      this.trigger('route:add', parent)
    }

    routeBuilder(captureRoutes);

    return routes;
  }
})

