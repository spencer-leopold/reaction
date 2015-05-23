//
// @TODO: Option to support React Router Components?
//
var React = require('react');
var ReactRouter = require('react-router');
var ReactionRouterComponents = require('./components');
var DeepExtend = require('deep-extend');
var Fetcher = require('./fetcher');
var Events = require('./events');
var _ = require('lodash');
var isServer = (typeof window === 'undefined');
var _currentRoute;

function ReactionRouter(options) {
  this.routes = [];
  this.componentRoutes = [];
  this._initOptions(options);
}

ReactionRouter.prototype._initOptions = function(options) {
  var entryPath;

  options = options || {};
  options.paths = options.paths || {};

  entryPath = options.paths.entryPath || options.entryPath;

  options.paths = _.defaults(options.paths, {
    entryPath: entryPath,
    routes: entryPath + 'app/routes',
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

ReactionRouter.prototype.loadRoutesFromFile = function() {
  var routesFile = false;

  // try and load route files, don't throw en error
  // if it fails since this is optional and we don't
  // want an error thrown or logged in the browser.
  try {
    routesFile = require(this.options.paths.routes);
  }
  catch (e) {
  }

  return routesFile;
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

ReactionRouter.prototype.setRoutes = function(route) {
  if (route.parent) {
    this.setRoutes(route.parent);
  }
  else {
    if (!this.componentRoutes[route.name]) {
      this.componentRoutes[route.name] = route;
    }
    else {
      var currentComponentRoute = this.componentRoutes[route.name];

      // @TODO: Add deep extend
      this.componentRoutes[route.name] = route;
    }
  }
}

ReactionRouter.prototype.iterateComponentRoutes = function(parentRoute, childRoute, childRouteType) {
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
      childRoute.path = childRoute.name;
    }
  }

  switch (childRouteType) {
    case 'DefaultRoute':
      childRoute.isDefault = true;
      break;
    case 'NotFoundRoute':
      childRoute.isNotFound = true;
      break;
    case 'Prefetch':
      childRoute.prefetch = true;
      break;
    case 'Redirect':
      childRoute.path = childRoute.path || childRoute.from || "*",
      childRoute.onEnter = function onEnter(transition, params, query) {
        transition.redirect(childRoute.to, childRoute.params || params, childRoute.query || query);
      }
      break;
  }

  childRoute.parent = parentRoute;
  parentRoute.childRoutes.push(childRoute);

  if (childRoute.children) {
    var childRouteChildren = _.assign({}, childRoute.children);
    delete childRoute.children;
    childRoute.childRoutes = [];

    this.buildComponentRoutes(childRouteChildren, childRoute);
  }
}

ReactionRouter.prototype.buildComponentRoutes = function(childRoutes, parentRoute) {
  if (childRoutes.type) {
    var childRoute = childRoutes._store.props;
    var childRouteType = childRoutes.type.name;
    this.iterateComponentRoutes(parentRoute, childRoute, childRouteType);
  }
  else {
    _.forEach(Object.keys(childRoutes), function(idx) {
      var childRoute = childRoutes[idx]._store.props;
      var childRouteType = childRoutes[idx].type.name;
      this.iterateComponentRoutes(parentRoute, childRoute, childRouteType);
    }.bind(this));
  }

  this.setRoutes(parentRoute);
}

ReactionRouter.prototype.parseRoute = function(routes) {
  var parentRoute = routes._store.props;
  var childRoutes = false;

  if (parentRoute.children) {
    var childRoutes = _.assign({}, parentRoute.children);
    delete parentRoute.children;
    parentRoute.childRoutes = [];
  }

  parentRoute.path = this.prefixRoutePath(parentRoute.path);

  if (childRoutes) {
    this.buildComponentRoutes(childRoutes, parentRoute);
  }
}

ReactionRouter.prototype.loadRoutesFromComponent = function(entryPoints) {
  if (entryPoints.constructor !== Array) {
    throw new Error('entryPoints needs to be an array');
  }

  _.forEach(entryPoints, function(entryPoint) {
    var component = this.loadComponent(entryPoint);
    var routes = component.routes();
    this.parseRoute(routes);
  }.bind(this));
}

ReactionRouter.prototype.buildRoutes = function() {
  var options = this.options;
  var routeBuilder = this.loadRoutesFromFile();

  if (options.entryPoints) {
    this.loadRoutesFromComponent(options.entryPoints);
  }

  if (routeBuilder) {
    var routes = routeBuilder(ReactionRouterComponents);
    this.parseRoute(routes);
  }

  // Loop through componentRoutes object and add definitions
  _.each(Object.keys(this.componentRoutes), function(route, i) {
    this.addRouteDefinition(this.componentRoutes[route]);
  }.bind(this));

  // console.log(this.routes[0].childRoutes[2]);
  console.log(this.routes[0].childRoutes);
  // console.log(this.routes);
  return this.routes;
}


ReactionRouter.prototype.setChildRoutePath = function(path, child) {
  if (child.path && child.path.charAt(0) !== '/') {
    if (path === '/') {
      child.path = path + child.path;
    }
    else {
      child.path = path + '/' + child.path;
    }
  }

  this.buildChildRoutePaths(child);
}

ReactionRouter.prototype.buildChildRoutePaths = function(route) {
  if (route.childRoutes) {
    _.each(route.childRoutes, function(childRoute) {
      this.setChildRoutePath(route.path, childRoute);
    }.bind(this));
  }

  return route;
}

ReactionRouter.prototype.processRoute = function(route, parent) {
  var componentsDir = this.options.paths.componentsDir;
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

    // Load components that need to be prefetched when
    // route loads
    if (route.prefetch) {
      reactRoute.prefetchComponents = [];
      _.forEach(route.prefetch, function(component) {
        reactRoute.prefetchComponents.push(this.loadComponent(component));
      }.bind(this));
    }
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
      this.processRoute(child, reactRoute);
    }.bind(this));
  }

  // If top-level route and not a server only route
  // add to our main routes array
  if (addToRoutes && route.name) {
    this.routes.push(reactRoute);
  }

  return route;
}

ReactionRouter.prototype.addRouteDefinition = function(route) {
  // Make relative children paths absolute
  if (route.childRoutes) {
    route = this.buildChildRoutePaths(route);
  }

  route = this.processRoute(route);

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
