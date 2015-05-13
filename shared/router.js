//
// @TODO: Option to support React Router Components?
//
var React = require('react');
var ReactRouter = require('react-router');
var Fetcher = require('./fetcher');
var Events = require('./events');
var ReactTools = require('react-tools');
var _ = require('lodash');
var isServer = (typeof window === 'undefined');
var _currentRoute;

function ReactionRouter(options) {
  this.routes = [];
  this.componentRoutes = {};
  this._initOptions(options);
}

ReactionRouter.prototype._initOptions = function(options) {
  var entryPath;

  options = options || {};
  options.paths = options.paths || {};

  entryPath = options.paths.entryPath || options.entryPath;

  options.paths = _.defaults(options.paths, {
    entryPath: entryPath,
    componentsDir: entryPath + 'app/components'
  });

  this.options = options;
}

ReactionRouter.prototype.getComponentPath = function(componentName) {
  var componentsDir = this.options.paths.componentsDir;
  return componentsDir + '/' + componentName;
}

ReactionRouter.prototype.loadComponent = function(componentName) {
  var componentPath = this.getComponentPath(componentName);
  return require(componentPath);
}

ReactionRouter.prototype.getRouteBuilder = function() {
  if (this.options.paths.routes) {
    return require(this.options.paths.routes);
  }
  else {
    return false;
  }
}

ReactionRouter.prototype.prefixRoutePath = function(path) {
  var mountPath = this.options.mountPath;
  // Prefix React Router paths if a mountPath
  // is set and the react path is absolute

  if (!mountPath || mountPath === '') {
    return path;
  }

  if (path && path.charAt(0) === '/') {
    if (path === '/') {
      path = mountPath;
    }
    else {
      path = mountPath + path;
    }
  }

  return path;
}

ReactionRouter.prototype.buildRoutes = function() {
  var routeBuilder = this.getRouteBuilder();
  var options = this.options;
  var routes = {};
  var that = this;
  var path;

  if (options.entryPoints) {
    if (options.entryPoints.constructor !== Array) {
      throw new Error('entryPoints needs to be an array');
    }

    _.forEach(options.entryPoints, function(entryPoint) {
      var component = this.loadComponent(entryPoint);
      var staticRoutes = component.routes();
      var parentRoute = staticRoutes._store.props;
      var childRoutes = false;

      if (parentRoute.children) {
        var childRoutes = _.assign({}, parentRoute.children);
        delete parentRoute.children;
        parentRoute.childRoutes = [];
      }

      parentRoute.path = that.prefixRoutePath(parentRoute.path);

      if (childRoutes) {
        _.forEach(Object.keys(childRoutes), function(idx) {
          var childRoute = childRoutes[idx]._store.props;
          var childRouteType = childRoutes[idx].type.name;

          if (!childRoute.name && childRoute.handler && childRouteType !== 'Redirect') {
            var lastSlashPos = childRoute.handler.indexOf('/');
            var name = childRoute.handler.substring(lastSlashPos + 1, childRoute.handler.length);
            childRoute.name = name.toLowerCase();
          }

          if (!childRoute.path && childRoute.name && childRouteType !== 'Redirect') {
            if (childRouteType === 'DefaultRoute') {
              childRoute.path = parentRoute.path;
            }
            else {
              childRoute.path = '/' + childRoute.name;
            }
          }

          childRoute.parent = parentRoute;
          parentRoute.childRoutes.push(childRoute);
        });
      }

      routes[parentRoute.name] = parentRoute;
    }.bind(this));
  }

  function captureRoutes(options, callback) {
    options.path = that.prefixRoutePath(options.path);

    if (!callback) {
      routes[options.name] = options
    }
    else {
      var routeNest = _.toArray(arguments);
      var parentRoute = routeNest[0];
      var children = routeNest.slice(1);

      // remove processed children from routes object
      _.each(children, function(child, i) {
        if (child !== undefined) {
          delete routes[child.name];
        }

        children[i].parent = parentRoute;
      });

      // add children as property to main route
      parentRoute.childRoutes = children;
      routes[parentRoute.name] = parentRoute;
    }

    return options;
  }

  if (routeBuilder) {
    routeBuilder(captureRoutes);
  }

  // Loop through routes object and add definitions
  _.each(Object.keys(routes), function(route, i) {
    this.addRouteDefinition(routes[route]);
  }.bind(this));

  return this.routes;
}

ReactionRouter.prototype.addRouteDefinition = function(route) {
  var componentsDir = this.options.paths.componentsDir;
  var that = this;

  function buildChildPaths(path, child) {
    if (child.path && child.path.charAt(0) !== '/') {
      if (path === '/') {
        child.path = path + child.path;
      }
      else {
        child.path = path + '/' + child.path;
      }
    }

    if (child.childRoutes) {
      _.each(child.childRoutes, function(childRoute) {
        buildChildPaths(child.path, childRoute);
      });
    }
  }

  // Make relative children paths absolute
  if (route.childRoutes) {
    _.each(route.childRoutes, function(childRoute) {
      buildChildPaths(route.path, childRoute);
    });
  }

  // recursive helper to run through routes and children
  function checkChildRoutes(route, parent) {
    var addToRoutes = true, reactRoute;

    // Attach the React component, it's originally set as
    // a string to prevent having to require all components
    // in the routes.js file
    if (route.name) {

      // Only add the route to react if it has a name,
      // otherwise it's a server route only
      route.handler = require(componentsDir + '/' + route.handler);

      // If a parent is passed as an argument we
      // add it as a parentRoute
      if (parent) {
        route.parentRoute = parent;
      }

      reactRoute = ReactRouter.createRoute(route);
    }

    Events.trigger('route:add', route);

    // If route doesn't have a parent it's a top-level route,
    // so we want to add it to the main routes array
    if (route.parent) {
      addToRoutes = false;
    }

    // If the route has children, run the function again
    // this time passing the current route as the `parent` parameter.
    // This will repeat for as long as necessary until full nested route
    // definition is built.
    if (route.childRoutes) {
      _.each(route.childRoutes, function(child) {
        checkChildRoutes(child, reactRoute);
      });
    }

    // If top-level route and not a server only route
    // add to our main routes array
    if (addToRoutes && route.name) {
      that.routes.push(reactRoute);
    }
  }

  checkChildRoutes(route);

  return route;
}

ReactionRouter.prototype.start = function(appData, el) {
  var that = this;

  if (!isServer) {

    if (!el) {
      el = document.body
    }

    window.onload = function() {
      ReactRouter.run(that.buildRoutes(), ReactRouter.HistoryLocation, function (Handler, state) {
        if (appData && typeof appData === 'object' && appData.path === state.path) {
          React.render(React.createFactory(Handler)(appData), el);
        }
        else {
          Fetcher.fetchData(state.routes, state.params).then(function(data) {
            React.render(React.createFactory(Handler)({ data: data }), el);
          });
        }
      });
    }
  }
}

module.exports = ReactionRouter;
