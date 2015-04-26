var React = require('react');
var Router = require('react-router');
var _ = require('lodash');

exports.register = function (server, options, next) {
  var fetcher = server.app.fetcher;
  var reactRoutes = server.app.reactRoutes;
  var serverRoutePaths = server.app.serverRoutePaths;
  var serverRoutesObj = server.app.serverRoutesObj;
  var markup;

  _.forEach(serverRoutesObj, function(route) {
    server.route(route);
  });

  server.ext('onPreHandler', function(request, reply) {
    if (serverRoutePaths.indexOf(request.route.path) >= 0) {
      Router.run(reactRoutes, request.path, function(Handler, state) {
        fetcher.fetchData(state.routes, state.params).then(function(data) {
          // loadingEvents.emit('loadEnd');
          markup = React.renderToString(React.createFactory(Handler)({ data: data, routes: reactRoutes }));
          request.app.body = markup;
          reply.continue();
        });
      });
    }
    else {
      reply.continue();
    }
  });

  next();
};

exports.register.attributes = {
  name: 'ReactionHandler',
  version: '1.0.0'
};
