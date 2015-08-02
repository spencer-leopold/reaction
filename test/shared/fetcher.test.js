require('node-jsx').install({extension:'.jsx'});
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var React = require('react');
var fetcher = require('../../shared/fetcher');
var MemoryStore = require('../../shared/memory_store');
var memoryStore = new MemoryStore();
var should = chai.should();
var expect = chai.expect;
var PostsFixture = require('../fixtures/Posts');

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('shared/fetcher', function() {

  describe('Fetcher instance', function() {
    var testEndpoint = 'http://jsonplaceholder.typicode.com/posts/1';

    describe('#fetchData()', function(done) {
      var f, fetchRouteDataSpy, fetchPrefetchDataSpy;

      beforeEach(function() {
        f = fetcher();
        fetchRouteDataSpy = sinon.spy(f, 'fetchRouteData');
        fetchPrefetchDataSpy = sinon.spy(f, 'fetchPrefetchData');
      });

      it('should return an object with the data returned by each components fetchData method', function(done) {

        f.fetchData([{ name: 'posts', handler: PostsFixture }]).then(function(data) {
          data.should.have.property('posts');
          data.posts.should.have.property('id');
          done();
        }).catch(done);

      });

      it('should fetch data from component if its in the prefetch property of route', function(done) {

        f.fetchData([{ name: 'post', handler: PostsFixture, prefetchHandlers: [ PostsFixture ] }]).then(function(data) {
          fetchRouteDataSpy.should.have.been.calledOnce;
          fetchPrefetchDataSpy.should.have.been.calledOnce;
          console.log(data);
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
        return fetcher.get('http://jsonplaceholder.typicode.com/postssss/1').should.reject;
      });

    });

  });

});
