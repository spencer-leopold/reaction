var Router = require('react-router');
var Route = Router.Route;

module.exports = {
  register: function (server, options, next) {
    var fetcher = server.app.fetcher;
    var routes = server.app.reactRoutes;
    var markup;

    server.ext('onRequest', function(request, reply) {
      Router.run([MainRoute], path, function(Handler, state) {
        fetchData(state.routes, state.params).then(function(data) {
          // loadingEvents.emit('loadEnd');

          markup = React.renderToString(Handler({ data: data }));
          reply('<!DOCTYPE html>'+markup).type('text/html');
        });
      });
    });

    next();
  }
};
