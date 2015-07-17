var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var ScopedEvents = require('../../shared/events');
var eventMixin = ScopedEvents.mixin;
var Events = new ScopedEvents();
var expect = chai.expect;
var should = chai.should();

chai.use(sinonChai);

describe('shared/events', function() {
  var fnSpy, fnSpy2, fnSpy3;

  beforeEach(function() {
    fnSpy = sinon.spy();
    fnSpy2 = sinon.spy();
    fnSpy3 = sinon.spy();
  });

  afterEach(function() {
    Events._listeners = {};
    fnSpy = null;
    fnSpy2 = null;
    fnSpy3 = null;
  });

  describe('ScopedEvents.Dispatcher', function() {
    it('should return the same instance each time', function() {
      var Dispatcher = require('../../shared/events').Dispatcher;
      var DispatcherTwo = require('../../shared/events').Dispatcher;
      Dispatcher.on('testOne', fnSpy);
      DispatcherTwo._listeners.should.have.property('testOne');
    });
  });

  describe('ScopedEvents.mixin', function() {

    it('should mixin the on, remove, and trigger methods', function() {
      function testClass() {
        this.name = 'testClass';
      }
      testClass.prototype.name = function() {
        return this.name;
      }
      eventMixin(testClass);
      var inst = new testClass();

      inst.should.have.property('on');
      inst.should.have.property('remove');
      inst.should.have.property('trigger');
      expect(typeof inst.on).to.equal('function');
    });

    it('should work on an object', function() {
      var testObj = {};
      eventMixin(testObj);

      testObj.should.have.property('on');
      testObj.should.have.property('remove');
      testObj.should.have.property('trigger');
      expect(typeof testObj.on).to.equal('function');
    });

    it('should have separate scopes', function() {
      // First class
      function testClass() {
        this.name = 'testClass';
      }
      testClass.prototype.name = function() {
        return this.name;
      }
      eventMixin(testClass);
      var inst = new testClass();

      // Second class
      function testClass2() {
        this.name = 'testClass2';
      }
      testClass2.prototype.name = function() {
        return this.name;
      }
      eventMixin(testClass2);
      var inst2 = new testClass2();

      // First object
      var testObj = {};
      eventMixin(testObj);

      // Second object
      var testObj2 = {};
      eventMixin(testObj2);

      inst.on('test', fnSpy)
      inst2.on('test', fnSpy)
      testObj.on('test', fnSpy2)
      testObj2.on('test', fnSpy2)

      inst.trigger('test');
      testObj.trigger('test');

      fnSpy.should.have.been.calledOnce;
      fnSpy2.should.have.been.calledOnce;

    });

  });

  describe('ScopedEvents', function() {
    describe('#on()', function() {
      it('should throw an error if no function callback is passed', function() {
        expect(function() {
          Events.on('test')
        }).to.throw('A callback function is required when adding an event listener');
      });

      it('should create one listener per original event', function() {
        Events.on('test', fnSpy);
        Events._listeners.should.have.a.property('test');
        Object.keys(Events._listeners).length.should.be.equal(1);
        Events.on('test', fnSpy);
        Object.keys(Events._listeners).length.should.be.equal(1);
      });

      it('should use the passed in context', function() {
        var ctx = {};
        Events.on('test', fnSpy, ctx);
        Events._listeners.should.deep.equal({ test: [{ fn: fnSpy, ctx: ctx }] });
      });

      it('should fallback to current context', function() {
        Events.on('test', fnSpy);
        Events._listeners.should.deep.equal({ test: [{ fn: fnSpy, ctx: Events }] });
      });

      it('should only add the listener is its unique', function() {
        var ctx = {};
        Events.on('test', fnSpy);
        Events.on('test', fnSpy, ctx);
        Events.on('test', fnSpy, ctx);
        Events.on('test', fnSpy);
        Events._listeners.test.should.have.length(2);
      });
    });

    describe('#remove()', function() {
      it('should remove all listeners if called with no arguments', function() {
        Events.on('testOne', fnSpy);
        Events.on('testTwo', fnSpy2);
        Object.keys(Events._listeners).should.have.length(2);
        Events.remove();
        Events._listeners.should.deep.equal([]);
      });

      it('should remove all listeners under event if only event is passed', function() {
        Events.on('test', fnSpy);
        Events.on('test', fnSpy2);
        Events._listeners.test.should.have.length(2);
        Events.remove('test');
        Events._listeners.should.not.have.property('test');
      });

      it('should remove listener that matches supplied function when event and function are passed', function() {
        Events.on('test', fnSpy);
        Events.remove('test', fnSpy2);
        Events._listeners.should.be.deep.equal({ test: [{ fn: fnSpy, ctx: Events }] });
        Events.remove('test', fnSpy);
        Events._listeners.should.be.deep.equal({ test: [] });
      });

      it('should remove listener that matches supplied function and context when event, function, and context are passed', function() {
        var ctx = {};
        Events.on('test', fnSpy);
        Events.on('test', fnSpy2, ctx);
        Events.remove('test', fnSpy, ctx);
        Events._listeners.test.should.have.length(2);
        Events.remove('test', fnSpy2, ctx);
        Events._listeners.test.should.have.length(1);
      });

      it('should remove all listeners that have matching function if only a function is passed in', function() {
        Events.on('testOne', fnSpy);
        Events.on('testTwo', fnSpy);
        Events.on('testThree', fnSpy2);
        Object.keys(Events._listeners).should.have.length(3);
        Events.remove(null, fnSpy);
        Object.keys(Events._listeners).should.have.length(1);
      });

      it('should remove all listeners that have matching function and context if only function and context are passed in', function() {
        var ctx = {};
        Events.on('testOne', fnSpy, ctx);
        Events.on('testTwo', fnSpy);
        Events.on('testThree', fnSpy);
        Object.keys(Events._listeners).should.have.length(3);
        Events.remove(null, fnSpy, ctx);
        Object.keys(Events._listeners).should.have.length(2);
      });

      it('should remove all listeners that have matching context if only context is passed in', function() {
        var ctx = {};
        Events.on('testOne', fnSpy, ctx);
        Events.on('testTwo', fnSpy2);
        Events.on('testThree', fnSpy3, ctx);
        Object.keys(Events._listeners).should.have.length(3);
        Events.remove(null, null, ctx);
        Object.keys(Events._listeners).should.have.length(1);
      });
    });

    describe('#trigger()', function() {

      it('should trigger function attached to an event', function() {
        Events.on('test', fnSpy);
        Events.trigger('test');
        fnSpy.should.have.been.calledOnce;
        Events.trigger('test');
        fnSpy.should.have.been.calledTwice;
      });

      it('should call all parent events', function() {
        Events.on('test', fnSpy);
        Events.on('test:scope', fnSpy2);
        Events.trigger('test:scope');
        Events.trigger('test');
        fnSpy2.should.have.been.calledOnce;
        fnSpy.should.have.been.calledTwice;
      });

      it('should send the child scope as the last argument to the parent scope', function() {
        Events.on('test', fnSpy);
        Events.on('test:scope', fnSpy);
        Events.on('test:scope:two', fnSpy);

        Events.trigger('test:scope:two', 'arg1');

        Events.on('load', fnSpy2);

        Events.trigger('load:sliders');

        fnSpy.should.have.been.calledThrice;

        fnSpy2.should.have.been.calledOnce;

        fnSpy.args[0][0].should.equal('scope:two');
        fnSpy.args[0][1].should.equal('arg1');

        fnSpy.args[1][0].should.equal('two');
        fnSpy.args[1][1].should.equal('arg1');

        expect(fnSpy.args[2][0]).to.equal(null);
        fnSpy.args[2][1].should.equal('arg1');

        fnSpy2.args[0][0].should.equal('sliders');
      });

      it('should trigger the "all" event', function() {
        Events.on('all', fnSpy);
        Events.on('test', fnSpy2);
        Events.on('test:scope', fnSpy2);
        Events.trigger('test:scope');
        fnSpy2.should.have.been.calledTwice;
        fnSpy.should.have.been.calledTwice;
        fnSpy.args[0][0].should.equal('test');
        fnSpy.args[1][0].should.equal('test:scope');
      });
    });

    describe('#triggerEventAll()', function() {

      it('should be called anytime an event is triggered', function() {
        Events.on('testOne', fnSpy);
        Events.on('testTwo', fnSpy);
        Events.on('testThree', fnSpy);
        Events.on('all', fnSpy2);

        Events.trigger('testOne');
        Events.trigger('testTwo');
        Events.trigger('testThree');

        fnSpy2.should.have.been.calledThrice;
      });

      it('should receive the events name and any additional arguments', function() {
        Events.on('testOne', fnSpy);
        Events.on('testTwo', fnSpy);
        Events.on('all', fnSpy2);

        Events.trigger('testOne', 'arg1', 'arg2');
        Events.trigger('testTwo', 'arg2-1', 'arg2-2');

        fnSpy2.args[0][0].should.equal('testOne');
        fnSpy2.args[0][1].should.equal('arg1');
        fnSpy2.args[0][2].should.equal('arg2');

        fnSpy2.args[1][0].should.equal('testTwo');
        fnSpy2.args[1][1].should.equal('arg2-1');
        fnSpy2.args[1][2].should.equal('arg2-2');
        fnSpy2.should.have.been.calledTwice;
      });
    });

    describe('#getExistingMatch()', function() {

      it('should return an array of indexes of matching listeners', function() {
        var ctx = {};

        Events.on('test', fnSpy);
        Events.on('test', fnSpy2);
        Events.on('test', fnSpy, ctx);

        var indexes1 = Events.getExistingMatch(Events._listeners['test'], fnSpy, Events);
        indexes1.should.have.length(1);

        var indexes2 = Events.getExistingMatch(Events._listeners['test'], fnSpy);
        indexes2.should.have.length(2);

        var indexes3 = Events.getExistingMatch(Events._listeners['test'], fnSpy2);
        indexes3.should.have.length(1);
      });

    });
  });

});
