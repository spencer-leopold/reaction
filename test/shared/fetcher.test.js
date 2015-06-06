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
        var options = {
          protocol: 'http',
          host: 'testing.com',
          port: '1234'
        }

        Fetcher.setBaseUrl(options);
        Fetcher.baseUrl.should.equal('http://testing.com:1234');
      });

      it('should use http as a default if no protocol is passed', function() {
        var options = {
          host: 'testing.com'
        }

        Fetcher.setBaseUrl(options);
        Fetcher.baseUrl.should.equal('http://testing.com');
      });

      it('should throw an error if no host is passed', function() {
        var spy = sinon.spy(Fetcher, 'setBaseUrl');

        expect(function() {
          Fetcher.setBaseUrl({ protocol: 'http' });
        }).to.throw('Host name must be provided');

        spy.should.have.been.calledOnce;
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
