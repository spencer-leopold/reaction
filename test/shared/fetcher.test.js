var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var ReactionFetcher = require('../../shared/fetcher');
var should = chai.should();
var expect = chai.expect;

chai.use(sinonChai);

describe('shared/fetcher', function() {

  describe('Fetcher instance', function() {
    var Fetcher;

    beforeEach(function() {
      Fetcher = new ReactionFetcher();
    });

    describe('#setBaseUrl()', function() {

      it('should return a properly formatted url', function() {
        Fetcher.setBaseUrl('http://testing.com:1234');
        Fetcher.baseUrl.should.equal('http://testing.com:1234');
      });
    });

    describe('#setHeaderValue()', function() {
      it('should store the header value', function() {
        Fetcher.setHeaderValue('api-key', '123456789');
        Fetcher.should.have.property('headers');
        Fetcher.headers.should.have.property('api-key');
        Fetcher.headers['api-key'].should.equal('123456789');
      });

      it('should send the header value in all subsequent requests', function() {
      });
    });

    describe('#removeHeaderValue()', function() {
      it('should remove the specified header value', function() {
      });
    });


    describe('#fetchData()', function() {
    });

    describe('#fetchRouteData()', function() {
    });

    describe('#fetchPrefetchData()', function() {
    });

    describe('#get()', function() {
    });

    describe('#post()', function() {
    });

    describe('#put()', function() {
    });

    describe('#patch()', function() {
    });

    describe('#delete()', function() {
    });

    describe('#options()', function() {
    });
  });

});
