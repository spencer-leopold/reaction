var request = require('request');
var qs = require('qs2');
var _ = require('../../shared/lodash.custom');

function RestAdapter(options) {
  this.options = options;
}

RestAdapter.prototype.request = function(req, res, callback) {
  var requestUrl;
  // var next = (!cbContext) ? callback : callback.bind(cbContext);

  var apiUrl = this.options.protocol + '://' + this.options.host + ':' + this.options.port + '/api';

  if (typeof req.url === 'string') {
    requestUrl = req.url;
  }
  else {
    requestUrl = req.url.path;
  }

  if (req.query && !_.isEmpty(req.query)) {
    requestUrl += '?' + qs.stringify(req.query);
  }

  var api = {
    url: apiUrl + requestUrl,
    method: req.method,
    headers: req.headers,
    json: req.body || req.payload,
    params: req.params
  };

  delete api.headers['accept-encoding'];

  if (req.method === 'GET') {
    delete api.json;
  }

  request(api, function (err, response, body) {
    if (err) {
      return callback(err);
    }

    try {
      body = JSON.parse(body);
    }
    catch (e) {
      console.log(e);
    }

    return callback(body);
  });
}

module.exports = RestAdapter;
