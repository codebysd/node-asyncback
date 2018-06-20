/** 
 * The no callback token, when returned, callback is not called.
 */
const NO_CB = Symbol('No-callback token');

/**
 * Check if value is nil (null or undefined).
 * @param {*} val value to check
 * @returns {boolean} true if value is nil
 */
function isNil(val) {
    return val === null || val === undefined;
}

/**
 * Check if value is Not a Function.
 * @param {*} val value to check
 * @returns {boolean} true if value is Not a Function
 */
function isNaF(val) {
    return isNil(val) || !(val instanceof Function);
}

/**
 * Check if value is Not a Promise like object.
 * @param {*} val value to check
 * @returns {boolean} true if value is Not a Promise like object
 */
function isNaP(val) {
    return isNil(val) || isNaF(val.then) || isNaF(val.catch);
}

/**
 * Invoke callback if result os other than NO_CB
 * @param {*} result function result value 
 * @param {function} next next callback
 */
function invokeNext(result, next) {
    if (NO_CB !== result) {
        next(undefined, result);
    }
}

/**
 * Wraps an async function to produce a normal expressjs middleware function.
 * The async function is called with all but the last argument (next callback), if supplied.
 * 
 * @param {Function} fn async function to wrap
 * @returns {Function} normal express middleware function 
 */
function asyncback(fn) {

    // Ensure parameter is at least a function.
    if (isNaF(fn)) {
        throw new Error('Parameter must be a function.');
    }

    // return middleware function
    return function () {

        // called arguments
        const args = Array.prototype.slice.call(arguments);

        // last argument
        const next = args.pop();

        if (isNaF(next)) {
            // last arg is not a callback, call function as it is
            fn.apply(fn, arguments);
        } else {
            try {
                // call function, expect a promise
                const promise = fn.apply(fn, args);

                if (isNaP(promise)) {
                    // return value is not promise like
                    invokeNext(promise, next);
                } else {
                    // bind next to promise resolution and rejection
                    promise.then((r) => invokeNext(r, next)).catch(next);
                }

            } catch (err) {
                // forward error
                next(err);
            }

        }
    }
}

// add NO_CB as property
Object.defineProperty(asyncback, 'NO_CB', { value: NO_CB, writable: false });

/** 
 * @type {asyncback}
 */
module.exports = asyncback;
