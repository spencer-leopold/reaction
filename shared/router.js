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

  getRouteBuilder = function() {
    return require(this.options.paths.routes);
  },

  createRoute = function() {
    function route(options, callback) {
      if (callback) {
        var parentRoute = ReactRouter.createRoute(options);
        callback.call(parentRoute, options);
        this.reactRoutes.push(parentRoute);
      }
      else {
        this.reactRoutes.push(ReactRouter.createRoute(options))
      }
    }

    return {
      get: function() {
        route(arguments);
        this.trigger('route:add', 'get', arguments);
      },
      post: function() {
        route(arguments);
        this.trigger('route:add', 'post', arguments);
      }
      put: function() {
        route(arguments);
        this.trigger('route:add', 'put', arguments);
      }
      delete: function() {
        route(arguments);
        this.trigger('route:add', 'delete', arguments);
      }
    }
  },

  buildRoutes = function() {
    var routeBuilder = this.getRouteBuilder();
    routeBuilder(this.createRoute);

    return this.reactRoutes;
  }
})

