require('node-jsx').install({extension:'.jsx'});
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var React = require('react');
var ReactionFetcher = require('../../shared/fetcher');
var should = chai.should();
var expect = chai.expect;
var PostsFixture = require('../fixtures/Posts');

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('shared/fetcher', function() {

  describe('Fetcher instance', function() {
    var Fetcher;
    var testEndpoint = 'http://jsonplaceholder.typicode.com/posts/1';

    beforeEach(function() {
      Fetcher = new ReactionFetcher();
    });

    afterEach(function() {
      Fetcher = null;
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

    });

    describe('#removeHeaderValue()', function() {

      it('should remove the specified header value', function() {
        Fetcher.setHeaderValue('api-key', '123456789');
        Fetcher.should.have.property('headers');
        Fetcher.headers.should.have.property('api-key');
        Fetcher.headers['api-key'].should.equal('123456789');
        Fetcher.removeHeaderValue('api-key');
        Fetcher.should.have.property('headers');
        Fetcher.headers.should.not.have.property('api-key');
      });

    });


    describe('#fetchData()', function(done) {
      var fetchRouteDataSpy, fetchPrefetchDataSpy;

      beforeEach(function() {
        fetchRouteDataSpy = sinon.spy(Fetcher, 'fetchRouteData');
        fetchPrefetchDataSpy = sinon.spy(Fetcher, 'fetchPrefetchData');
      });

      it('should return an object with the data returned by each components fetchData method', function(done) {

        Fetcher.fetchData([{ name: 'posts', handler: PostsFixture }]).then(function(data) {
          data.should.have.property('posts');
          data.posts.should.have.property('id');
          done();
        }).catch(done);

      });

      it('should fetch data from component if its in the prefetch property of route', function(done) {

        Fetcher.fetchData([{ name: 'post', handler: PostsFixture, prefetchHandlers: [ PostsFixture ] }]).then(function(data) {
          fetchRouteDataSpy.should.have.been.calledOnce;
          fetchPrefetchDataSpy.should.have.been.calledOnce;
          data.should.have.property('post');
          data.post.should.have.property('id');
          data.should.have.property('posts');
          data.posts.should.have.property('id');
          done();
        }).catch(done);

      });

    });

    describe('#get()', function() {

      it('should fail if url doesn\'t exist', function() {
        return Fetcher.get('http://jsonplaceholder.typicode.com/postssss/1').should.reject;
      });

      it('should cache the response if cache arg is true', function(done) {

        Fetcher.get(testEndpoint, {}, {}, true).then(function(res) {
          Fetcher._cache.should.have.property(testEndpoint);
          done();
        }).catch(done);

      });

      it('should return data from the cache', function(done) {

        Fetcher._cache['/test'] = { id: 1 };

        Fetcher.get('/test', {}, {}, true).then(function(res) {
          res.should.deep.equal({ id: 1 });
          done();
        }).catch(done);

      });

    });

  });

});
