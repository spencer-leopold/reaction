//
// @TODO: Option to support React Router Components?
//
var React = require('react');
var ReactRouter = require('react-router');
var ReactionRouterComponents = require('./components');
var Fetcher = require('./fetcher');
var Events = require('./events');
var _ = require('./lodash.custom');
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
    componentsDir: entryPath + 'app/components',
    templatesDir: entryPath + 'app/templates'
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
  // Only add to componentRoutes if it's a top level
  // route, so if route has a parent, iterate until
  // we're at the top
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
      if (currentComponentRoute.childRoutes && route.childRoutes) {
        route.childRoutes = this.extendChildRoutes(route.childRoutes, currentComponentRoute.childRoutes);
      }

      this.componentRoutes[route.name] = route;
    }
  }
}

ReactionRouter.prototype.extendChildRoutes = function(source1, source2) {
  var extended = [];

  for (var i = 0; i < source2.length; i++) {
    var shared = false;

    for (var j = 0; j < source1.length; j++) {
      // want to look for matching names first since
      // there can't be two react routes with the same
      // name
      if (source2[i].name) {
        if (source2[i].name === source1[j].name) {
          shared = true;
          break;
        }
      }
      // Redirect routes don't have a name so have a 
      // fallback to check for path. All routes must
      // have a path
      else {
        if (source2[i].path === source1[j].path) {
          shared = true;
          break;
        }
      }
    }

    if (!shared) {
      extended.push(source2[i]);
    }
  }

  extended = source1.concat(extended);
  return extended;
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
    case 'Redirect':
      childRoute.path = childRoute.path || childRoute.from || "*",
      childRoute.onEnter = function onEnter(transition, params, query) {
        transition.redirect(childRoute.to, childRoute.params || params, childRoute.query || query);
      }
      break;
  }

  if (childRouteType !== 'Prefetch') {
    childRoute.parent = parentRoute;
    parentRoute.childRoutes.push(childRoute);
  }
  else {
    if (!parentRoute.prefetchHandlers) {
      parentRoute.prefetchHandlers = [];
    }

    var handler = this.loadComponent(childRoute.handler);
    parentRoute.prefetchHandlers.push(handler);
  }

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
  if (!routes) {
    return false;
  }

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
  _.forEach(Object.keys(this.componentRoutes), function(route, i) {
    this.addRouteDefinition(this.componentRoutes[route]);
  }.bind(this));

  // console.log(this.routes[0].childRoutes[0]);
  // console.log(this.routes[0].defaultRoute.childRoutes);
  // console.log(this.routes[0]);
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
    _.forEach(route.childRoutes, function(childRoute) {
      this.setChildRoutePath(route.path, childRoute);
    }.bind(this));
  }

  return route;
}

ReactionRouter.prototype.processRoute = function(route, parent) {
  var componentsDir = this.options.paths.componentsDir;
  var addToRoutes = true;
  var reactRoute = false;

  // If a parent is passed as an argument we
  // add it as a parentRoute
  if (parent) {
    route.parentRoute = parent;
  }

  if (route.name) {

    if (route.to) {
      reactRoute = ReactRouter.createRoute(route);
    }
    else {
      // Attach the React component, it's originally set as
      // a string to prevent having to require all components
      // in the routes configuration
      route.handler = this.loadComponent(route.handler);

      if (route.handler.willTransitionTo) {
        route.onEnter = route.handler.willTransitionTo;
      }

      if (route.handler.willTransitionFrom) {
        route.onLeave = route.handler.willTransitionFrom;
      }

      reactRoute = ReactRouter.createRoute(route);
    }
  }

  Events.trigger('route:add', route);

  // If route doesn't have a parent it's a top-level route,
  // so we want to add it to the main routes array
  if (route.parent) {
    addToRoutes = false;
  }

  // Add any prefetch handlers on to the react route
  if (route.prefetchHandlers && reactRoute) {
    reactRoute.prefetchHandlers = route.prefetchHandlers;
  }

  // If the route has children, run the function again
  // this time passing the current route as the `parent` parameter.
  // This will repeat for as long as necessary until full nested route
  // definition is built.
  if (route.childRoutes) {
    _.forEach(route.childRoutes, function(child) {
      this.processRoute(child, reactRoute);
    }.bind(this));
  }

  // If top-level route and not a server only route
  // add to our main routes array
  if ((addToRoutes && route.name) || (addToRoutes && route.to)) {
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

ReactionRouter.prototype.start = function(appData, locationType, el) {
  var that = this;

  if (!isServer) {
    if (typeof locationType !== 'function') {
      switch(locationType) {
        case 'Hash':
          locationType = ReactRouter.HashLocation;
          break;
        case 'Refresh':
          locationType = ReactRouter.RefreshLocation;
          break;
        case 'Static':
          locationType = ReactRouter.StaticLocation;
          break;
        case 'History':
        default:
          locationType = ReactRouter.HistoryLocation;
          break;
      }
    }

    window.onload = function() {
      ReactRouter.run(that.buildRoutes(), locationType, function (Handler, state) {
        if (appData && typeof appData === 'object' && appData.path === state.path) {
          React.render(React.createFactory(Handler)({ data: appData }), el);
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
