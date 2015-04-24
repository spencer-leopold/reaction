var Promise = require('q');

function Fetcher() {
  this._cache = {};
}

Fetcher.prototype.fetchData = function(routes, params) {
  var data = {};

  return Promise.all(routes
    .filter(function(route) {
      return route.handler.fetchData;
    })
    .map(function(route) {
      return route.handler.fetchData(params).then(function(d) {
        return data[route.name] = d;
      });
    })
  ).then(function() {
    return data;
  });
}

Fetcher.prototype.request = function() {
}

module.exports = Fetcher;
