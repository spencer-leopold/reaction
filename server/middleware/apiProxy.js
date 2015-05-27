var request = require('request');
var qs = require('qs2');
var _ = require('../../shared/lodash.custom');

module.exports = function(options) {
  var requestUrl;
  var apiUrl = options.protocol + '://' + options.host + ':' + options.port + '/api';

  return function(req, res, next) {
    requestUrl = apiUrl + req.url;

    if (req.query && !_.isEmpty(req.query)) {
      requestUrl += '?' + qs.stringify(req.query);
    }

    var api = {
      url: requestUrl,
      method: req.method,
      headers: req.headers,
      json: req.body,
      params: req.params
    };

    delete api.headers['accept-encoding'];

    if (req.method === 'GET') {
      delete api.json;
    }

    request(api, function (err, response, body) {
      if (err) {
        next(err);
      }
      else {
        try {
          body = JSON.parse(body);
        }
        catch (e) {
          console.log(e);
        }

        res.json(body);
      }
    });
  }
}
