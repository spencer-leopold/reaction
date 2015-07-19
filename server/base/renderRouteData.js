//
// @TODO: Need a better way to match routes
// (or at least use React-Routers match functionality)
//

var React = require('react');
var ReactRouter = require('react-router');
var Match = require('../../node_modules/react-router/lib/Match');
var ReactionFetcher = require('../../shared/fetcher');

module.exports = function(clientRoutes) {
  var fetcher = new ReactionFetcher();

  return function(request, baseUrl, path, next) {
    var pathExists = Match.findMatch(clientRoutes, path);

    if (!pathExists) {
      next();
    }
    else {
      fetcher.setBaseUrl(baseUrl);

      ReactRouter.run(clientRoutes, path, function(Handler, state) {
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

          next();
        });
      });

    }
  }
}
