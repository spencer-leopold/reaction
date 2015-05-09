var React = require('react');
var ReactRouter = require('react-router');
var fetcher = require('../../shared/fetcher');

exports.register = function(server, options, next) {

  // need to set the baseUrl, otherwise fetching relative paths
  // fail on initial page load
  fetcher.setBaseUrl(server.info);

  server.ext('onPreHandler', function(request, reply) {
    // Make sure we're calling the ReactRouter on an actual react path,
    // not an asset path or some other resource
    if (options.serverRoutePaths.indexOf(request.route.path) === -1) {
      reply.continue();
    }
    else {
      ReactRouter.run(options.reactRoutes, request.path, function(Handler, state) {
        console.log(state);

        fetcher.fetchData(state.routes, state.params).then(function(data) {
          markup = React.renderToString(React.createFactory(Handler)({ data: data }));
          // attach the markup and initial data to the
          // request object to be used with templates
          request.app.body = markup;
          request.app.appData = data;
          reply.continue();
        });
      });
    }
  });
}

exports.register.attributes = {
  name: 'IsoApp',
  version: '1.0.0'
}
