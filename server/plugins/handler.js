// require('node-jsx').install({extension: '.jsx'});
var React = require('react');
var Router = require('react-router');
var Route = Router.Route;

exports.register = function (server, options, next) {
  var fetcher = server.app.fetcher;
  var reactRoutes = server.app.reactRoutes;
  var serverRoutes = server.app.serverRoutes;
  var markup;

  server.ext('onPreHandler', function(request, reply) {
    if (serverRoutes.indexOf(request.route.path) >= 0) {
      Router.run(reactRoutes, request.path, function(Handler, state) {
        fetcher.fetchData(state.routes, state.params).then(function(data) {
          // loadingEvents.emit('loadEnd');
          markup = React.renderToString(React.createFactory(Handler)({ data: data, routes: reactRoutes }));

          reply('<!DOCTYPE html>'+markup).type('text/html');
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
  name: 'ReactionServerRouteHandler',
  version: '1.0.0'
};
