const sinon = require('sinon');
const expect = require('chai').expect;
const describe = require('mocha').describe;
const it = require('mocha').it;

describe('asyncback', () => {

    const asyncback = require('../index');

    it('Is a function', () => {
        expect(asyncback).to.be.a('function');
    });

    it('Accepts a function and returns a function', () => {
        expect(asyncback(sinon.spy())).to.be.a('function');
    });

    it('Throws if given something that is not a function', () => {
        expect(asyncback).to.throw(Error);
        expect(() => asyncback([])).to.throw(Error);
        expect(() => asyncback({})).to.throw(Error);
    });

    it('Calls the wrapped function with all arguments if called without any callback', () => {
        const wrapped = sinon.spy();

        asyncback(wrapped)('a', 1, 2);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Calls the wrapped function with all arguments except callback if called with callback', () => {
        const wrapped = sinon.spy();

        const next = sinon.spy();
        asyncback(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Invokes callback after simple function returns', () => {
        const wrapped = sinon.stub().returns('Test result');

        const next = sinon.spy();
        asyncback(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
        sinon.assert.calledOnce(next);
        sinon.assert.calledWith(next);
    });

    it('Invokes callback with error after simple function throws', () => {
        const err = new Error('Test error');
        const wrapped = sinon.stub().throws(err);

        const next = sinon.spy();
        asyncback(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
        sinon.assert.calledOnce(next);
        sinon.assert.calledWith(next, err);
    });

    it('Invokes callback after promisified function resolves', (done) => {
        const wrapped = sinon.stub().resolves('Test Result');

        const next = sinon.spy(() => {
            sinon.assert.calledOnce(next);
            sinon.assert.calledWith(next);
            done();
        });

        asyncback(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Invokes callback with error after promisified function rejects', (done) => {
        const err = new Error('Test error');
        const wrapped = sinon.stub().rejects(err);

        const next = sinon.spy(() => {
            sinon.assert.calledOnce(next);
            sinon.assert.calledWith(next, err);
            done();
        });

        asyncback(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Invokes callback after async function returns', (done) => {
        const wrapped = sinon.spy();
        const wrappedAsync = async function () {
            wrapped.apply(wrapped, arguments);
            return 'Test Result';
        }

        const next = sinon.spy(() => {
            sinon.assert.calledOnce(next);
            sinon.assert.calledWith(next);
            done();
        });

        asyncback(wrappedAsync)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Invokes callback with error after async function throws', (done) => {
        const err = new Error('Test error');
        const wrapped = sinon.spy();
        const wrappedAsync = async function () {
            wrapped.apply(wrapped, arguments);
            throw err;
        }

        const next = sinon.spy(() => {
            sinon.assert.calledOnce(next);
            sinon.assert.calledWith(next, err);
            done();
        });

        asyncback(wrappedAsync)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Does not invoke callback function if returned value is NO_CB token', (done) => {
        const next = sinon.spy();
        const wrapped = sinon.spy(() => {
            process.nextTick(() => {
                sinon.assert.notCalled(next);
                done();
            });
            return asyncback.NO_CB;
        });

        asyncback(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Does not invoke callback function if resolved value is NO_CB token', (done) => {
        const next = sinon.spy();
        const wrapped = sinon.spy(() => {
            process.nextTick(() => {
                sinon.assert.notCalled(next);
                done();
            });
            return Promise.resolve(asyncback.NO_CB);
        });

        asyncback(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

});