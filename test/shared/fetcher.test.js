var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var ReactionFetcher = require('../../shared/fetcher');
var should = chai.should();

chai.use(sinonChai);

describe('shared/fetcher', function() {

  describe('Fetcher instance', function() {

    describe('#setBaseUrl()', function() {
      it('should return a properly formatted url', function() {
      });

      it('should use http as a default if no protocol is passed', function() {
      });

      it('should throw an error if no host is passed', function() {
      });
    });

    describe('#setHeaderValue()', function() {
      it('should store the header value', function() {
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
