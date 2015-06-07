var React = require('react');
var ReactRouter = require('react-router');
var ReactionFetcher = require('../../shared/fetcher');

module.exports = function(options) {
  var fetcher = new ReactionFetcher();

  return function(request, baseUrl, path, next, nextCtx) {
    var cont = (!nextCtx) ? next : next.bind(nextCtx);

    if (options.serverRoutePaths.indexOf(path) === -1) {
      cont();
    }
    else {
      // need to set the baseUrl, otherwise fetching relative paths
      // fail on initial page load
      fetcher.setBaseUrl(baseUrl);

      // React-Router functionality
      ReactRouter.run(options.reactRoutes, path, function(Handler, state) {
        fetcher.fetchData(state.routes, state.params).then(function(data) {
          var markup = React.renderToString(React.createFactory(Handler)({ data: data }));

          if (!data.path) {
            data.path = request.path;
          }

          // attach the markup and initial data to the
          // request object to be used with templates
          request.reactionData = {
            body: markup,
            appData: data
          };

          cont();
        });
      });
    }

  }
}
