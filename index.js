var React = require('react');
var ReactRouter = require('react-router');
var RouteHandler = ReactRouter.RouteHandler;
var Link = ReactRouter.Link;
var ReactionRouter = require('./shared/router');
var Fetcher = require('./shared/fetcher');
var Component = require('./shared/components/Component');
var Route = require('./shared/components/Route');
var DefaultRoute = require('./shared/components/DefaultRoute');
var NotFoundRoute = require('./shared/components/NotFoundRoute');
var Redirect = require('./shared/components/Redirect');
var Prefetch = require('./shared/components/Prefetch');
var Events = require('./shared/events');

exports.React = React;

exports.ReactRouter = ReactRouter;

exports.RouteHandler = RouteHandler;

exports.Link = Link;

exports.Route = Route;

exports.Component = Component;

exports.DefaultRoute = DefaultRoute;

exports.NotFoundRoute = NotFoundRoute;

exports.Redirect = Redirect;

exports.Prefetch = Prefetch;

exports.route = React.createFactory(Route);

exports.defaultRoute = React.createFactory(DefaultRoute);

exports.notFoundRoute = React.createFactory(NotFoundRoute);

exports.redirect = React.createFactory(Redirect);

exports.preFetch = React.createFactory(Prefetch);

exports.Fetcher = Fetcher;

exports.Events = Events.Dispatcher;

exports.Router = function(options) {
  return new ReactionRouter(options);
};

exports.attachApp = function(options, server) {
  var ServerAdapter;

  // Use variables to require adapter modules in order to hide them from
  // requirejs.
  if (options.serverAdapter) {
    ServerAdapter = options.serverAdapter;
  }
  else {
    if (server.inspect && typeof server.inspect === 'function') {
      var koaAdapter = './server/KoaAdapter';
      ServerAdapter = require(koaAdapter);
    }
    else if (server.response) {
      var expressAdapter = './server/ExpressAdapter';
      ServerAdapter = require(expressAdapter);
    }
    else if (server.formatters) {
      var restifyAdapter = './server/RestifyAdapter';
      ServerAdapter = require(restifyAdapter);
    }
    else {
      var hapiAdapter = './server/HapiAdapter';
      ServerAdapter = require(hapiAdapter);
    }
  }

  return new ServerAdapter(options, server);
}

// Startup for frontend.
exports.initApp = function(props, el) {
  if (!el) {
    el = '.react-app';
  }

  var wrapperAttrs = {
    dangerouslySetInnerHTML: {
      __html: props.body
    }
  };

  if (el.charAt(0) === '#') {
    wrapperAttrs.id = el.replace('#', '');
  }
  else if (el.charAt(0) === '.') {
    wrapperAttrs.className = el.replace('.', '');
  }
  else {
    throw new Error('el must be a class or id selector')
  }

  var wrapper = React.createElement('div', wrapperAttrs);

  var script = React.createElement('script', {
    dangerouslySetInnerHTML: {
      __html: props.start(el)
    }
  });

  return React.createElement('div', { id: el.substr(1) + '-wrapper' }, wrapper, script);
}
