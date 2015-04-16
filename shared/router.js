var React = require('react');
var ReactRouter = require('react-router');
var url = require('url');
var _ = require('lodash');
var MicroEvent = require('microevent');

function ReactionRouter(options) {
  this.routes = [];
  this._initOptions(options);
}

MicroEvent.mixin(ReactionRouter);

ReactionRouter.prototype._initOptions = function(options) {
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
}

ReactionRouter.prototype.getComponentPath = function(componentName) {
  var componentDir = this.options.paths.componentDir;
  return componentDir + '/' + componentName;
}

ReactionRouter.prototype.loadComponent = function(componentName) {
  var componentPath = this.getcomponentPath(componentName);
  return require(componentPath);
}

ReactionRouter.prototype.getRouteBuilder = function() {
  return require(this.options.paths.routes);
}

ReactionRouter.prototype.buildRoutes = function() {
  var routeBuilder = this.getRouteBuilder();
  var routes = [];
  var that = this;

  function captureRoutes() {
    var args = _.toArray(arguments);
    var options = args[0] || {};
    var route = ReactRouter.createRoute(options);
    that.trigger('route:add', options);


    // if we have multiple arguments
    // it means this is a parent
    if (args.length > 1) {
      var childRoutes = args.splice(1);
      _.each(childRoutes, function(childRoute) {
        childRoute.parentRoute = route;
        route.appendChild(childRoute)
      });
      routes.push(route);
    }

    return route;
  }

  routeBuilder(captureRoutes);

  return routes;
}

module.exports = ReactionRouter;
