(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*! Hammer.JS - v2.0.6 - 2015-12-23
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2015 Jorik Tangelder;
 * Licensed under the  license */
(function(window, document, exportName, undefined) {
  'use strict';

var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
var TEST_ELEMENT = document.createElement('div');

var TYPE_FUNCTION = 'function';

var round = Math.round;
var abs = Math.abs;
var now = Date.now;

/**
 * set a timeout with a given scope
 * @param {Function} fn
 * @param {Number} timeout
 * @param {Object} context
 * @returns {number}
 */
function setTimeoutContext(fn, timeout, context) {
    return setTimeout(bindFn(fn, context), timeout);
}

/**
 * if the argument is an array, we want to execute the fn on each entry
 * if it aint an array we don't want to do a thing.
 * this is used by all the methods that accept a single and array argument.
 * @param {*|Array} arg
 * @param {String} fn
 * @param {Object} [context]
 * @returns {Boolean}
 */
function invokeArrayArg(arg, fn, context) {
    if (Array.isArray(arg)) {
        each(arg, context[fn], context);
        return true;
    }
    return false;
}

/**
 * walk objects and arrays
 * @param {Object} obj
 * @param {Function} iterator
 * @param {Object} context
 */
function each(obj, iterator, context) {
    var i;

    if (!obj) {
        return;
    }

    if (obj.forEach) {
        obj.forEach(iterator, context);
    } else if (obj.length !== undefined) {
        i = 0;
        while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
        }
    } else {
        for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
        }
    }
}

/**
 * wrap a method with a deprecation warning and stack trace
 * @param {Function} method
 * @param {String} name
 * @param {String} message
 * @returns {Function} A new function wrapping the supplied method.
 */
function deprecate(method, name, message) {
    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
    return function() {
        var e = new Error('get-stack-trace');
        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

        var log = window.console && (window.console.warn || window.console.log);
        if (log) {
            log.call(window.console, deprecationMessage, stack);
        }
        return method.apply(this, arguments);
    };
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} target
 * @param {...Object} objects_to_assign
 * @returns {Object} target
 */
var assign;
if (typeof Object.assign !== 'function') {
    assign = function assign(target) {
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return output;
    };
} else {
    assign = Object.assign;
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} dest
 * @param {Object} src
 * @param {Boolean=false} [merge]
 * @returns {Object} dest
 */
var extend = deprecate(function extend(dest, src, merge) {
    var keys = Object.keys(src);
    var i = 0;
    while (i < keys.length) {
        if (!merge || (merge && dest[keys[i]] === undefined)) {
            dest[keys[i]] = src[keys[i]];
        }
        i++;
    }
    return dest;
}, 'extend', 'Use `assign`.');

/**
 * merge the values from src in the dest.
 * means that properties that exist in dest will not be overwritten by src
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object} dest
 */
var merge = deprecate(function merge(dest, src) {
    return extend(dest, src, true);
}, 'merge', 'Use `assign`.');

/**
 * simple class inheritance
 * @param {Function} child
 * @param {Function} base
 * @param {Object} [properties]
 */
function inherit(child, base, properties) {
    var baseP = base.prototype,
        childP;

    childP = child.prototype = Object.create(baseP);
    childP.constructor = child;
    childP._super = baseP;

    if (properties) {
        assign(childP, properties);
    }
}

/**
 * simple function bind
 * @param {Function} fn
 * @param {Object} context
 * @returns {Function}
 */
function bindFn(fn, context) {
    return function boundFn() {
        return fn.apply(context, arguments);
    };
}

/**
 * let a boolean value also be a function that must return a boolean
 * this first item in args will be used as the context
 * @param {Boolean|Function} val
 * @param {Array} [args]
 * @returns {Boolean}
 */
function boolOrFn(val, args) {
    if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined : undefined, args);
    }
    return val;
}

/**
 * use the val2 when val1 is undefined
 * @param {*} val1
 * @param {*} val2
 * @returns {*}
 */
function ifUndefined(val1, val2) {
    return (val1 === undefined) ? val2 : val1;
}

/**
 * addEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function addEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.addEventListener(type, handler, false);
    });
}

/**
 * removeEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function removeEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.removeEventListener(type, handler, false);
    });
}

/**
 * find if a node is in the given parent
 * @method hasParent
 * @param {HTMLElement} node
 * @param {HTMLElement} parent
 * @return {Boolean} found
 */
function hasParent(node, parent) {
    while (node) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

/**
 * small indexOf wrapper
 * @param {String} str
 * @param {String} find
 * @returns {Boolean} found
 */
function inStr(str, find) {
    return str.indexOf(find) > -1;
}

/**
 * split string on whitespace
 * @param {String} str
 * @returns {Array} words
 */
function splitStr(str) {
    return str.trim().split(/\s+/g);
}

/**
 * find if a array contains the object using indexOf or a simple polyFill
 * @param {Array} src
 * @param {String} find
 * @param {String} [findByKey]
 * @return {Boolean|Number} false when not found, or the index
 */
function inArray(src, find, findByKey) {
    if (src.indexOf && !findByKey) {
        return src.indexOf(find);
    } else {
        var i = 0;
        while (i < src.length) {
            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                return i;
            }
            i++;
        }
        return -1;
    }
}

/**
 * convert array-like objects to real arrays
 * @param {Object} obj
 * @returns {Array}
 */
function toArray(obj) {
    return Array.prototype.slice.call(obj, 0);
}

/**
 * unique array with objects based on a key (like 'id') or just by the array's value
 * @param {Array} src [{id:1},{id:2},{id:1}]
 * @param {String} [key]
 * @param {Boolean} [sort=False]
 * @returns {Array} [{id:1},{id:2}]
 */
function uniqueArray(src, key, sort) {
    var results = [];
    var values = [];
    var i = 0;

    while (i < src.length) {
        var val = key ? src[i][key] : src[i];
        if (inArray(values, val) < 0) {
            results.push(src[i]);
        }
        values[i] = val;
        i++;
    }

    if (sort) {
        if (!key) {
            results = results.sort();
        } else {
            results = results.sort(function sortUniqueArray(a, b) {
                return a[key] > b[key];
            });
        }
    }

    return results;
}

/**
 * get the prefixed property
 * @param {Object} obj
 * @param {String} property
 * @returns {String|Undefined} prefixed
 */
function prefixed(obj, property) {
    var prefix, prop;
    var camelProp = property[0].toUpperCase() + property.slice(1);

    var i = 0;
    while (i < VENDOR_PREFIXES.length) {
        prefix = VENDOR_PREFIXES[i];
        prop = (prefix) ? prefix + camelProp : property;

        if (prop in obj) {
            return prop;
        }
        i++;
    }
    return undefined;
}

/**
 * get a unique id
 * @returns {number} uniqueId
 */
var _uniqueId = 1;
function uniqueId() {
    return _uniqueId++;
}

/**
 * get the window object of an element
 * @param {HTMLElement} element
 * @returns {DocumentView|Window}
 */
function getWindowForElement(element) {
    var doc = element.ownerDocument || element;
    return (doc.defaultView || doc.parentWindow || window);
}

var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

var SUPPORT_TOUCH = ('ontouchstart' in window);
var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

var INPUT_TYPE_TOUCH = 'touch';
var INPUT_TYPE_PEN = 'pen';
var INPUT_TYPE_MOUSE = 'mouse';
var INPUT_TYPE_KINECT = 'kinect';

var COMPUTE_INTERVAL = 25;

var INPUT_START = 1;
var INPUT_MOVE = 2;
var INPUT_END = 4;
var INPUT_CANCEL = 8;

var DIRECTION_NONE = 1;
var DIRECTION_LEFT = 2;
var DIRECTION_RIGHT = 4;
var DIRECTION_UP = 8;
var DIRECTION_DOWN = 16;

var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

var PROPS_XY = ['x', 'y'];
var PROPS_CLIENT_XY = ['clientX', 'clientY'];

/**
 * create new input type manager
 * @param {Manager} manager
 * @param {Function} callback
 * @returns {Input}
 * @constructor
 */
function Input(manager, callback) {
    var self = this;
    this.manager = manager;
    this.callback = callback;
    this.element = manager.element;
    this.target = manager.options.inputTarget;

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
            self.handler(ev);
        }
    };

    this.init();

}

Input.prototype = {
    /**
     * should handle the inputEvent data and trigger the callback
     * @virtual
     */
    handler: function() { },

    /**
     * bind the events
     */
    init: function() {
        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    },

    /**
     * unbind the events
     */
    destroy: function() {
        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    }
};

/**
 * create new input type manager
 * called by the Manager constructor
 * @param {Hammer} manager
 * @returns {Input}
 */
function createInputInstance(manager) {
    var Type;
    var inputClass = manager.options.inputClass;

    if (inputClass) {
        Type = inputClass;
    } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
    } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
    } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
    } else {
        Type = TouchMouseInput;
    }
    return new (Type)(manager, inputHandler);
}

/**
 * handle input events
 * @param {Manager} manager
 * @param {String} eventType
 * @param {Object} input
 */
function inputHandler(manager, eventType, input) {
    var pointersLen = input.pointers.length;
    var changedPointersLen = input.changedPointers.length;
    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

    input.isFirst = !!isFirst;
    input.isFinal = !!isFinal;

    if (isFirst) {
        manager.session = {};
    }

    // source event is the normalized value of the domEvents
    // like 'touchstart, mouseup, pointerdown'
    input.eventType = eventType;

    // compute scale, rotation etc
    computeInputData(manager, input);

    // emit secret event
    manager.emit('hammer.input', input);

    manager.recognize(input);
    manager.session.prevInput = input;
}

/**
 * extend the data with some usable properties like scale, rotate, velocity etc
 * @param {Object} manager
 * @param {Object} input
 */
function computeInputData(manager, input) {
    var session = manager.session;
    var pointers = input.pointers;
    var pointersLength = pointers.length;

    // store the first input to calculate the distance and direction
    if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
    }

    // to compute scale and rotation we need to store the multiple touches
    if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
    } else if (pointersLength === 1) {
        session.firstMultiple = false;
    }

    var firstInput = session.firstInput;
    var firstMultiple = session.firstMultiple;
    var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

    var center = input.center = getCenter(pointers);
    input.timeStamp = now();
    input.deltaTime = input.timeStamp - firstInput.timeStamp;

    input.angle = getAngle(offsetCenter, center);
    input.distance = getDistance(offsetCenter, center);

    computeDeltaXY(session, input);
    input.offsetDirection = getDirection(input.deltaX, input.deltaY);

    var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
    input.overallVelocityX = overallVelocity.x;
    input.overallVelocityY = overallVelocity.y;
    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

    computeIntervalInputData(session, input);

    // find the correct target
    var target = manager.element;
    if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
    }
    input.target = target;
}

function computeDeltaXY(session, input) {
    var center = input.center;
    var offset = session.offsetDelta || {};
    var prevDelta = session.prevDelta || {};
    var prevInput = session.prevInput || {};

    if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
        prevDelta = session.prevDelta = {
            x: prevInput.deltaX || 0,
            y: prevInput.deltaY || 0
        };

        offset = session.offsetDelta = {
            x: center.x,
            y: center.y
        };
    }

    input.deltaX = prevDelta.x + (center.x - offset.x);
    input.deltaY = prevDelta.y + (center.y - offset.y);
}

/**
 * velocity is calculated every x ms
 * @param {Object} session
 * @param {Object} input
 */
function computeIntervalInputData(session, input) {
    var last = session.lastInterval || input,
        deltaTime = input.timeStamp - last.timeStamp,
        velocity, velocityX, velocityY, direction;

    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
        var deltaX = input.deltaX - last.deltaX;
        var deltaY = input.deltaY - last.deltaY;

        var v = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v.x;
        velocityY = v.y;
        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
        direction = getDirection(deltaX, deltaY);

        session.lastInterval = input;
    } else {
        // use latest velocity info if it doesn't overtake a minimum period
        velocity = last.velocity;
        velocityX = last.velocityX;
        velocityY = last.velocityY;
        direction = last.direction;
    }

    input.velocity = velocity;
    input.velocityX = velocityX;
    input.velocityY = velocityY;
    input.direction = direction;
}

/**
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 * @param {Object} input
 * @returns {Object} clonedInputData
 */
function simpleCloneInputData(input) {
    // make a simple copy of the pointers because we will get a reference if we don't
    // we only need clientXY for the calculations
    var pointers = [];
    var i = 0;
    while (i < input.pointers.length) {
        pointers[i] = {
            clientX: round(input.pointers[i].clientX),
            clientY: round(input.pointers[i].clientY)
        };
        i++;
    }

    return {
        timeStamp: now(),
        pointers: pointers,
        center: getCenter(pointers),
        deltaX: input.deltaX,
        deltaY: input.deltaY
    };
}

/**
 * get the center of all the pointers
 * @param {Array} pointers
 * @return {Object} center contains `x` and `y` properties
 */
function getCenter(pointers) {
    var pointersLength = pointers.length;

    // no need to loop when only one touch
    if (pointersLength === 1) {
        return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
        };
    }

    var x = 0, y = 0, i = 0;
    while (i < pointersLength) {
        x += pointers[i].clientX;
        y += pointers[i].clientY;
        i++;
    }

    return {
        x: round(x / pointersLength),
        y: round(y / pointersLength)
    };
}

/**
 * calculate the velocity between two points. unit is in px per ms.
 * @param {Number} deltaTime
 * @param {Number} x
 * @param {Number} y
 * @return {Object} velocity `x` and `y`
 */
function getVelocity(deltaTime, x, y) {
    return {
        x: x / deltaTime || 0,
        y: y / deltaTime || 0
    };
}

/**
 * get the direction between two points
 * @param {Number} x
 * @param {Number} y
 * @return {Number} direction
 */
function getDirection(x, y) {
    if (x === y) {
        return DIRECTION_NONE;
    }

    if (abs(x) >= abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

/**
 * calculate the absolute distance between two points
 * @param {Object} p1 {x, y}
 * @param {Object} p2 {x, y}
 * @param {Array} [props] containing x and y keys
 * @return {Number} distance
 */
function getDistance(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];

    return Math.sqrt((x * x) + (y * y));
}

/**
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle
 */
function getAngle(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];
    return Math.atan2(y, x) * 180 / Math.PI;
}

/**
 * calculate the rotation degrees between two pointersets
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} rotation
 */
function getRotation(start, end) {
    return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
}

/**
 * calculate the scale factor between two pointersets
 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} scale
 */
function getScale(start, end) {
    return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
}

var MOUSE_INPUT_MAP = {
    mousedown: INPUT_START,
    mousemove: INPUT_MOVE,
    mouseup: INPUT_END
};

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;
    this.evWin = MOUSE_WINDOW_EVENTS;

    this.allow = true; // used by Input.TouchMouse to disable mouse events
    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
        }

        // mouse must be down, and mouse events are allowed (see the TouchMouse input)
        if (!this.pressed || !this.allow) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

var POINTER_INPUT_MAP = {
    pointerdown: INPUT_START,
    pointermove: INPUT_MOVE,
    pointerup: INPUT_END,
    pointercancel: INPUT_CANCEL,
    pointerout: INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
var IE10_POINTER_TYPE_ENUM = {
    2: INPUT_TYPE_TOUCH,
    3: INPUT_TYPE_PEN,
    4: INPUT_TYPE_MOUSE,
    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

var POINTER_ELEMENT_EVENTS = 'pointerdown';
var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
if (window.MSPointerEvent && !window.PointerEvent) {
    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
}

/**
 * Pointer events input
 * @constructor
 * @extends Input
 */
function PointerEventInput() {
    this.evEl = POINTER_ELEMENT_EVENTS;
    this.evWin = POINTER_WINDOW_EVENTS;

    Input.apply(this, arguments);

    this.store = (this.manager.session.pointerEvents = []);
}

inherit(PointerEventInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;

        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

        // get index of the event in the store
        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

        // start and mouse must be down
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
                store.push(ev);
                storeIndex = store.length - 1;
            }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
        }

        // it not found, so the pointer hasn't been down (so it's probably a hover)
        if (storeIndex < 0) {
            return;
        }

        // update the event in the store
        store[storeIndex] = ev;

        this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType: pointerType,
            srcEvent: ev
        });

        if (removePointer) {
            // remove from the store
            store.splice(storeIndex, 1);
        }
    }
});

var SINGLE_TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Touch events input
 * @constructor
 * @extends Input
 */
function SingleTouchInput() {
    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
    this.started = false;

    Input.apply(this, arguments);
}

inherit(SingleTouchInput, Input, {
    handler: function TEhandler(ev) {
        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

        // should we handle the touch events?
        if (type === INPUT_START) {
            this.started = true;
        }

        if (!this.started) {
            return;
        }

        var touches = normalizeSingleTouches.call(this, ev, type);

        // when done, reset the started state
        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function normalizeSingleTouches(ev, type) {
    var all = toArray(ev.touches);
    var changed = toArray(ev.changedTouches);

    if (type & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), 'identifier', true);
    }

    return [all, changed];
}

var TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
function TouchInput() {
    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};

    Input.apply(this, arguments);
}

inherit(TouchInput, Input, {
    handler: function MTEhandler(ev) {
        var type = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type);
        if (!touches) {
            return;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev, type) {
    var allTouches = toArray(ev.touches);
    var targetIds = this.targetIds;

    // when there is only one touch, the process can be simplified
    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
    }

    var i,
        targetTouches,
        changedTouches = toArray(ev.changedTouches),
        changedTargetTouches = [],
        target = this.target;

    // get target touches from touches
    targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
    });

    // collect touches
    if (type === INPUT_START) {
        i = 0;
        while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
        }
    }

    // filter changed touches to only contain touches that exist in the collected target ids
    i = 0;
    while (i < changedTouches.length) {
        if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
        }

        // cleanup removed touches
        if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
        }
        i++;
    }

    if (!changedTargetTouches.length) {
        return;
    }

    return [
        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
        changedTargetTouches
    ];
}

/**
 * Combined touch and mouse input
 *
 * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
 * This because touch devices also emit mouse events while doing a touch.
 *
 * @constructor
 * @extends Input
 */
function TouchMouseInput() {
    Input.apply(this, arguments);

    var handler = bindFn(this.handler, this);
    this.touch = new TouchInput(this.manager, handler);
    this.mouse = new MouseInput(this.manager, handler);
}

inherit(TouchMouseInput, Input, {
    /**
     * handle mouse and touch events
     * @param {Hammer} manager
     * @param {String} inputEvent
     * @param {Object} inputData
     */
    handler: function TMEhandler(manager, inputEvent, inputData) {
        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

        // when we're in a touch event, so  block all upcoming mouse events
        // most mobile browser also emit mouseevents, right after touchstart
        if (isTouch) {
            this.mouse.allow = false;
        } else if (isMouse && !this.mouse.allow) {
            return;
        }

        // reset the allowMouse when we're done
        if (inputEvent & (INPUT_END | INPUT_CANCEL)) {
            this.mouse.allow = true;
        }

        this.callback(manager, inputEvent, inputData);
    },

    /**
     * remove the event listeners
     */
    destroy: function destroy() {
        this.touch.destroy();
        this.mouse.destroy();
    }
});

var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
var TOUCH_ACTION_COMPUTE = 'compute';
var TOUCH_ACTION_AUTO = 'auto';
var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
var TOUCH_ACTION_NONE = 'none';
var TOUCH_ACTION_PAN_X = 'pan-x';
var TOUCH_ACTION_PAN_Y = 'pan-y';

/**
 * Touch Action
 * sets the touchAction property or uses the js alternative
 * @param {Manager} manager
 * @param {String} value
 * @constructor
 */
function TouchAction(manager, value) {
    this.manager = manager;
    this.set(value);
}

TouchAction.prototype = {
    /**
     * set the touchAction value on the element or enable the polyfill
     * @param {String} value
     */
    set: function(value) {
        // find out the touch-action by the event handlers
        if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
        }

        if (NATIVE_TOUCH_ACTION && this.manager.element.style) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
        this.actions = value.toLowerCase().trim();
    },

    /**
     * just re-set the touchAction value
     */
    update: function() {
        this.set(this.manager.options.touchAction);
    },

    /**
     * compute the value for the touchAction property based on the recognizer's settings
     * @returns {String} value
     */
    compute: function() {
        var actions = [];
        each(this.manager.recognizers, function(recognizer) {
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
                actions = actions.concat(recognizer.getTouchAction());
            }
        });
        return cleanTouchActions(actions.join(' '));
    },

    /**
     * this method is called on each input cycle and provides the preventing of the browser behavior
     * @param {Object} input
     */
    preventDefaults: function(input) {
        // not needed with native support for the touchAction property
        if (NATIVE_TOUCH_ACTION) {
            return;
        }

        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;

        // if the touch action did prevented once this session
        if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
        }

        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE);
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);

        if (hasNone) {
            //do not prevent defaults if this is a tap gesture

            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;

            if (isTapPointer && isTapMovement && isTapTouchTime) {
                return;
            }
        }

        if (hasPanX && hasPanY) {
            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
            return;
        }

        if (hasNone ||
            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
            (hasPanX && direction & DIRECTION_VERTICAL)) {
            return this.preventSrc(srcEvent);
        }
    },

    /**
     * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
     * @param {Object} srcEvent
     */
    preventSrc: function(srcEvent) {
        this.manager.session.prevented = true;
        srcEvent.preventDefault();
    }
};

/**
 * when the touchActions are collected they are not a valid value, so we need to clean things up. *
 * @param {String} actions
 * @returns {*}
 */
function cleanTouchActions(actions) {
    // none
    if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
    }

    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
        return TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
    }

    return TOUCH_ACTION_AUTO;
}

/**
 * Recognizer flow explained; *
 * All recognizers have the initial state of POSSIBLE when a input session starts.
 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
 * Example session for mouse-input: mousedown -> mousemove -> mouseup
 *
 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
 * which determines with state it should be.
 *
 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
 * POSSIBLE to give it another change on the next cycle.
 *
 *               Possible
 *                  |
 *            +-----+---------------+
 *            |                     |
 *      +-----+-----+               |
 *      |           |               |
 *   Failed      Cancelled          |
 *                          +-------+------+
 *                          |              |
 *                      Recognized       Began
 *                                         |
 *                                      Changed
 *                                         |
 *                                  Ended/Recognized
 */
var STATE_POSSIBLE = 1;
var STATE_BEGAN = 2;
var STATE_CHANGED = 4;
var STATE_ENDED = 8;
var STATE_RECOGNIZED = STATE_ENDED;
var STATE_CANCELLED = 16;
var STATE_FAILED = 32;

/**
 * Recognizer
 * Every recognizer needs to extend from this class.
 * @constructor
 * @param {Object} options
 */
function Recognizer(options) {
    this.options = assign({}, this.defaults, options || {});

    this.id = uniqueId();

    this.manager = null;

    // default is enable true
    this.options.enable = ifUndefined(this.options.enable, true);

    this.state = STATE_POSSIBLE;

    this.simultaneous = {};
    this.requireFail = [];
}

Recognizer.prototype = {
    /**
     * @virtual
     * @type {Object}
     */
    defaults: {},

    /**
     * set options
     * @param {Object} options
     * @return {Recognizer}
     */
    set: function(options) {
        assign(this.options, options);

        // also update the touchAction, in case something changed about the directions/enabled state
        this.manager && this.manager.touchAction.update();
        return this;
    },

    /**
     * recognize simultaneous with an other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
            return this;
        }

        var simultaneous = this.simultaneous;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (!simultaneous[otherRecognizer.id]) {
            simultaneous[otherRecognizer.id] = otherRecognizer;
            otherRecognizer.recognizeWith(this);
        }
        return this;
    },

    /**
     * drop the simultaneous link. it doesnt remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRecognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        delete this.simultaneous[otherRecognizer.id];
        return this;
    },

    /**
     * recognizer can only run when an other is failing
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    requireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
            return this;
        }

        var requireFail = this.requireFail;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (inArray(requireFail, otherRecognizer) === -1) {
            requireFail.push(otherRecognizer);
            otherRecognizer.requireFailure(this);
        }
        return this;
    },

    /**
     * drop the requireFailure link. it does not remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRequireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
            this.requireFail.splice(index, 1);
        }
        return this;
    },

    /**
     * has require failures boolean
     * @returns {boolean}
     */
    hasRequireFailures: function() {
        return this.requireFail.length > 0;
    },

    /**
     * if the recognizer can recognize simultaneous with an other recognizer
     * @param {Recognizer} otherRecognizer
     * @returns {Boolean}
     */
    canRecognizeWith: function(otherRecognizer) {
        return !!this.simultaneous[otherRecognizer.id];
    },

    /**
     * You should use `tryEmit` instead of `emit` directly to check
     * that all the needed recognizers has failed before emitting.
     * @param {Object} input
     */
    emit: function(input) {
        var self = this;
        var state = this.state;

        function emit(event) {
            self.manager.emit(event, input);
        }

        // 'panstart' and 'panmove'
        if (state < STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }

        emit(self.options.event); // simple 'eventName' events

        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
            emit(input.additionalEvent);
        }

        // panend and pancancel
        if (state >= STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }
    },

    /**
     * Check that all the require failure recognizers has failed,
     * if true, it emits a gesture event,
     * otherwise, setup the state to FAILED.
     * @param {Object} input
     */
    tryEmit: function(input) {
        if (this.canEmit()) {
            return this.emit(input);
        }
        // it's failing anyway
        this.state = STATE_FAILED;
    },

    /**
     * can we emit?
     * @returns {boolean}
     */
    canEmit: function() {
        var i = 0;
        while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                return false;
            }
            i++;
        }
        return true;
    },

    /**
     * update the recognizer
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        // make a new copy of the inputData
        // so we can change the inputData without messing up the other recognizers
        var inputDataClone = assign({}, inputData);

        // is is enabled and allow recognizing?
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
        }

        // reset when we've reached the end
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
        }

        this.state = this.process(inputDataClone);

        // the recognizer has recognized a gesture
        // so trigger an event
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
        }
    },

    /**
     * return the state of the recognizer
     * the actual recognizing happens in this method
     * @virtual
     * @param {Object} inputData
     * @returns {Const} STATE
     */
    process: function(inputData) { }, // jshint ignore:line

    /**
     * return the preferred touch-action
     * @virtual
     * @returns {Array}
     */
    getTouchAction: function() { },

    /**
     * called when the gesture isn't allowed to recognize
     * like when another is being recognized or it is disabled
     * @virtual
     */
    reset: function() { }
};

/**
 * get a usable string, used as event postfix
 * @param {Const} state
 * @returns {String} state
 */
function stateStr(state) {
    if (state & STATE_CANCELLED) {
        return 'cancel';
    } else if (state & STATE_ENDED) {
        return 'end';
    } else if (state & STATE_CHANGED) {
        return 'move';
    } else if (state & STATE_BEGAN) {
        return 'start';
    }
    return '';
}

/**
 * direction cons to string
 * @param {Const} direction
 * @returns {String}
 */
function directionStr(direction) {
    if (direction == DIRECTION_DOWN) {
        return 'down';
    } else if (direction == DIRECTION_UP) {
        return 'up';
    } else if (direction == DIRECTION_LEFT) {
        return 'left';
    } else if (direction == DIRECTION_RIGHT) {
        return 'right';
    }
    return '';
}

/**
 * get a recognizer by name if it is bound to a manager
 * @param {Recognizer|String} otherRecognizer
 * @param {Recognizer} recognizer
 * @returns {Recognizer}
 */
function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
    var manager = recognizer.manager;
    if (manager) {
        return manager.get(otherRecognizer);
    }
    return otherRecognizer;
}

/**
 * This recognizer is just used as a base for the simple attribute recognizers.
 * @constructor
 * @extends Recognizer
 */
function AttrRecognizer() {
    Recognizer.apply(this, arguments);
}

inherit(AttrRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof AttrRecognizer
     */
    defaults: {
        /**
         * @type {Number}
         * @default 1
         */
        pointers: 1
    },

    /**
     * Used to check if it the recognizer receives valid input, like input.distance > 10.
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {Boolean} recognized
     */
    attrTest: function(input) {
        var optionPointers = this.options.pointers;
        return optionPointers === 0 || input.pointers.length === optionPointers;
    },

    /**
     * Process the input and return the state for the recognizer
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {*} State
     */
    process: function(input) {
        var state = this.state;
        var eventType = input.eventType;

        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
        var isValid = this.attrTest(input);

        // on cancel input and we've recognized before, return STATE_CANCELLED
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
                return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
                return STATE_BEGAN;
            }
            return state | STATE_CHANGED;
        }
        return STATE_FAILED;
    }
});

/**
 * Pan
 * Recognized when the pointer is down and moved in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function PanRecognizer() {
    AttrRecognizer.apply(this, arguments);

    this.pX = null;
    this.pY = null;
}

inherit(PanRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PanRecognizer
     */
    defaults: {
        event: 'pan',
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
    },

    getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
    },

    directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;

        // lock to axis?
        if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                hasMoved = x != this.pX;
                distance = Math.abs(input.deltaX);
            } else {
                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                hasMoved = y != this.pY;
                distance = Math.abs(input.deltaY);
            }
        }
        input.direction = direction;
        return hasMoved && distance > options.threshold && direction & options.direction;
    },

    attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) &&
            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
    },

    emit: function(input) {

        this.pX = input.deltaX;
        this.pY = input.deltaY;

        var direction = directionStr(input.direction);

        if (direction) {
            input.additionalEvent = this.options.event + direction;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Pinch
 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
 * @constructor
 * @extends AttrRecognizer
 */
function PinchRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(PinchRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'pinch',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
    },

    emit: function(input) {
        if (input.scale !== 1) {
            var inOut = input.scale < 1 ? 'in' : 'out';
            input.additionalEvent = this.options.event + inOut;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Press
 * Recognized when the pointer is down for x ms without any movement.
 * @constructor
 * @extends Recognizer
 */
function PressRecognizer() {
    Recognizer.apply(this, arguments);

    this._timer = null;
    this._input = null;
}

inherit(PressRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PressRecognizer
     */
    defaults: {
        event: 'press',
        pointers: 1,
        time: 251, // minimal time of the pointer to be pressed
        threshold: 9 // a minimal movement is ok, but keep it low
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_AUTO];
    },

    process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTime = input.deltaTime > options.time;

        this._input = input;

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
            this.reset();
        } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
            }, options.time, this);
        } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
            return;
        }

        if (input && (input.eventType & INPUT_END)) {
            this.manager.emit(this.options.event + 'up', input);
        } else {
            this._input.timeStamp = now();
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Rotate
 * Recognized when two or more pointer are moving in a circular motion.
 * @constructor
 * @extends AttrRecognizer
 */
function RotateRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(RotateRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof RotateRecognizer
     */
    defaults: {
        event: 'rotate',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
    }
});

/**
 * Swipe
 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function SwipeRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(SwipeRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof SwipeRecognizer
     */
    defaults: {
        event: 'swipe',
        threshold: 10,
        velocity: 0.3,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
    },

    getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
    },

    attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;

        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
        } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
        }

        return this._super.attrTest.call(this, input) &&
            direction & input.offsetDirection &&
            input.distance > this.options.threshold &&
            input.maxPointers == this.options.pointers &&
            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
    },

    emit: function(input) {
        var direction = directionStr(input.offsetDirection);
        if (direction) {
            this.manager.emit(this.options.event + direction, input);
        }

        this.manager.emit(this.options.event, input);
    }
});

/**
 * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
 * a single tap.
 *
 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
 * multi-taps being recognized.
 * @constructor
 * @extends Recognizer
 */
function TapRecognizer() {
    Recognizer.apply(this, arguments);

    // previous time and center,
    // used for tap counting
    this.pTime = false;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;
}

inherit(TapRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'tap',
        pointers: 1,
        taps: 1,
        interval: 300, // max time between the multi-tap taps
        time: 250, // max time of the pointer to be down (like finger on the screen)
        threshold: 9, // a minimal movement is ok, but keep it low
        posThreshold: 10 // a multi-tap can be a bit off the initial position
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_MANIPULATION];
    },

    process: function(input) {
        var options = this.options;

        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTouchTime = input.deltaTime < options.time;

        this.reset();

        if ((input.eventType & INPUT_START) && (this.count === 0)) {
            return this.failTimeout();
        }

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
                return this.failTimeout();
            }

            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

            this.pTime = input.timeStamp;
            this.pCenter = input.center;

            if (!validMultiTap || !validInterval) {
                this.count = 1;
            } else {
                this.count += 1;
            }

            this._input = input;

            // if tap count matches we have recognized it,
            // else it has began recognizing...
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
                // no failing requirements, immediately trigger the tap event
                // or wait as long as the multitap interval to trigger
                if (!this.hasRequireFailures()) {
                    return STATE_RECOGNIZED;
                } else {
                    this._timer = setTimeoutContext(function() {
                        this.state = STATE_RECOGNIZED;
                        this.tryEmit();
                    }, options.interval, this);
                    return STATE_BEGAN;
                }
            }
        }
        return STATE_FAILED;
    },

    failTimeout: function() {
        this._timer = setTimeoutContext(function() {
            this.state = STATE_FAILED;
        }, this.options.interval, this);
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function() {
        if (this.state == STATE_RECOGNIZED) {
            this._input.tapCount = this.count;
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Simple way to create a manager with a default set of recognizers.
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Hammer(element, options) {
    options = options || {};
    options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
    return new Manager(element, options);
}

/**
 * @const {string}
 */
Hammer.VERSION = '2.0.6';

/**
 * default settings
 * @namespace
 */
Hammer.defaults = {
    /**
     * set if DOM events are being triggered.
     * But this is slower and unused by simple implementations, so disabled by default.
     * @type {Boolean}
     * @default false
     */
    domEvents: false,

    /**
     * The value for the touchAction property/fallback.
     * When set to `compute` it will magically set the correct value based on the added recognizers.
     * @type {String}
     * @default compute
     */
    touchAction: TOUCH_ACTION_COMPUTE,

    /**
     * @type {Boolean}
     * @default true
     */
    enable: true,

    /**
     * EXPERIMENTAL FEATURE -- can be removed/changed
     * Change the parent input target element.
     * If Null, then it is being set the to main element.
     * @type {Null|EventTarget}
     * @default null
     */
    inputTarget: null,

    /**
     * force an input class
     * @type {Null|Function}
     * @default null
     */
    inputClass: null,

    /**
     * Default recognizer setup when calling `Hammer()`
     * When creating a new Manager these will be skipped.
     * @type {Array}
     */
    preset: [
        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
        [RotateRecognizer, {enable: false}],
        [PinchRecognizer, {enable: false}, ['rotate']],
        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
        [TapRecognizer],
        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
        [PressRecognizer]
    ],

    /**
     * Some CSS properties can be used to improve the working of Hammer.
     * Add them to this method and they will be set when creating a new Manager.
     * @namespace
     */
    cssProps: {
        /**
         * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Disable the Windows Phone grippers when pressing an element.
         * @type {String}
         * @default 'none'
         */
        touchSelect: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in iOS. This property obeys the alpha value, if specified.
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

var STOP = 1;
var FORCED_STOP = 2;

/**
 * Manager
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Manager(element, options) {
    this.options = assign({}, Hammer.defaults, options || {});

    this.options.inputTarget = this.options.inputTarget || element;

    this.handlers = {};
    this.session = {};
    this.recognizers = [];

    this.element = element;
    this.input = createInputInstance(this);
    this.touchAction = new TouchAction(this, this.options.touchAction);

    toggleCssProps(this, true);

    each(this.options.recognizers, function(item) {
        var recognizer = this.add(new (item[0])(item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
    }, this);
}

Manager.prototype = {
    /**
     * set options
     * @param {Object} options
     * @returns {Manager}
     */
    set: function(options) {
        assign(this.options, options);

        // Options that need a little more setup
        if (options.touchAction) {
            this.touchAction.update();
        }
        if (options.inputTarget) {
            // Clean up existing event listeners and reinitialize
            this.input.destroy();
            this.input.target = options.inputTarget;
            this.input.init();
        }
        return this;
    },

    /**
     * stop recognizing for this session.
     * This session will be discarded, when a new [input]start event is fired.
     * When forced, the recognizer cycle is stopped immediately.
     * @param {Boolean} [force]
     */
    stop: function(force) {
        this.session.stopped = force ? FORCED_STOP : STOP;
    },

    /**
     * run the recognizers!
     * called by the inputHandler function on every movement of the pointers (touches)
     * it walks through all the recognizers and tries to detect the gesture that is being made
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        var session = this.session;
        if (session.stopped) {
            return;
        }

        // run the touch-action polyfill
        this.touchAction.preventDefaults(inputData);

        var recognizer;
        var recognizers = this.recognizers;

        // this holds the recognizer that is being recognized.
        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
        // if no recognizer is detecting a thing, it is set to `null`
        var curRecognizer = session.curRecognizer;

        // reset when the last recognizer is recognized
        // or when we're in a new session
        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
            curRecognizer = session.curRecognizer = null;
        }

        var i = 0;
        while (i < recognizers.length) {
            recognizer = recognizers[i];

            // find out if we are allowed try to recognize the input for this one.
            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
            //      that is being recognized.
            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
            //      this can be setup with the `recognizeWith()` method on the recognizer.
            if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                recognizer.recognize(inputData);
            } else {
                recognizer.reset();
            }

            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
            // current active recognizer. but only if we don't already have an active recognizer
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
        }
    },

    /**
     * get a recognizer by its event name.
     * @param {Recognizer|String} recognizer
     * @returns {Recognizer|Null}
     */
    get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
            return recognizer;
        }

        var recognizers = this.recognizers;
        for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
                return recognizers[i];
            }
        }
        return null;
    },

    /**
     * add a recognizer to the manager
     * existing recognizers with the same event name will be removed
     * @param {Recognizer} recognizer
     * @returns {Recognizer|Manager}
     */
    add: function(recognizer) {
        if (invokeArrayArg(recognizer, 'add', this)) {
            return this;
        }

        // remove existing
        var existing = this.get(recognizer.options.event);
        if (existing) {
            this.remove(existing);
        }

        this.recognizers.push(recognizer);
        recognizer.manager = this;

        this.touchAction.update();
        return recognizer;
    },

    /**
     * remove a recognizer by name or instance
     * @param {Recognizer|String} recognizer
     * @returns {Manager}
     */
    remove: function(recognizer) {
        if (invokeArrayArg(recognizer, 'remove', this)) {
            return this;
        }

        recognizer = this.get(recognizer);

        // let's make sure this recognizer exists
        if (recognizer) {
            var recognizers = this.recognizers;
            var index = inArray(recognizers, recognizer);

            if (index !== -1) {
                recognizers.splice(index, 1);
                this.touchAction.update();
            }
        }

        return this;
    },

    /**
     * bind event
     * @param {String} events
     * @param {Function} handler
     * @returns {EventEmitter} this
     */
    on: function(events, handler) {
        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);
        });
        return this;
    },

    /**
     * unbind event, leave emit blank to remove all handlers
     * @param {String} events
     * @param {Function} [handler]
     * @returns {EventEmitter} this
     */
    off: function(events, handler) {
        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            if (!handler) {
                delete handlers[event];
            } else {
                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
        });
        return this;
    },

    /**
     * emit event to the listeners
     * @param {String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        // we also want to trigger dom events
        if (this.options.domEvents) {
            triggerDomEvent(event, data);
        }

        // no handlers, so skip it all
        var handlers = this.handlers[event] && this.handlers[event].slice();
        if (!handlers || !handlers.length) {
            return;
        }

        data.type = event;
        data.preventDefault = function() {
            data.srcEvent.preventDefault();
        };

        var i = 0;
        while (i < handlers.length) {
            handlers[i](data);
            i++;
        }
    },

    /**
     * destroy the manager and unbinds all events
     * it doesn't unbind dom events, that is the user own responsibility
     */
    destroy: function() {
        this.element && toggleCssProps(this, false);

        this.handlers = {};
        this.session = {};
        this.input.destroy();
        this.element = null;
    }
};

/**
 * add/remove the css properties as defined in manager.options.cssProps
 * @param {Manager} manager
 * @param {Boolean} add
 */
function toggleCssProps(manager, add) {
    var element = manager.element;
    if (!element.style) {
        return;
    }
    each(manager.options.cssProps, function(value, name) {
        element.style[prefixed(element.style, name)] = add ? value : '';
    });
}

/**
 * trigger dom event
 * @param {String} event
 * @param {Object} data
 */
function triggerDomEvent(event, data) {
    var gestureEvent = document.createEvent('Event');
    gestureEvent.initEvent(event, true, true);
    gestureEvent.gesture = data;
    data.target.dispatchEvent(gestureEvent);
}

assign(Hammer, {
    INPUT_START: INPUT_START,
    INPUT_MOVE: INPUT_MOVE,
    INPUT_END: INPUT_END,
    INPUT_CANCEL: INPUT_CANCEL,

    STATE_POSSIBLE: STATE_POSSIBLE,
    STATE_BEGAN: STATE_BEGAN,
    STATE_CHANGED: STATE_CHANGED,
    STATE_ENDED: STATE_ENDED,
    STATE_RECOGNIZED: STATE_RECOGNIZED,
    STATE_CANCELLED: STATE_CANCELLED,
    STATE_FAILED: STATE_FAILED,

    DIRECTION_NONE: DIRECTION_NONE,
    DIRECTION_LEFT: DIRECTION_LEFT,
    DIRECTION_RIGHT: DIRECTION_RIGHT,
    DIRECTION_UP: DIRECTION_UP,
    DIRECTION_DOWN: DIRECTION_DOWN,
    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
    DIRECTION_ALL: DIRECTION_ALL,

    Manager: Manager,
    Input: Input,
    TouchAction: TouchAction,

    TouchInput: TouchInput,
    MouseInput: MouseInput,
    PointerEventInput: PointerEventInput,
    TouchMouseInput: TouchMouseInput,
    SingleTouchInput: SingleTouchInput,

    Recognizer: Recognizer,
    AttrRecognizer: AttrRecognizer,
    Tap: TapRecognizer,
    Pan: PanRecognizer,
    Swipe: SwipeRecognizer,
    Pinch: PinchRecognizer,
    Rotate: RotateRecognizer,
    Press: PressRecognizer,

    on: addEventListeners,
    off: removeEventListeners,
    each: each,
    merge: merge,
    extend: extend,
    assign: assign,
    inherit: inherit,
    bindFn: bindFn,
    prefixed: prefixed
});

// this prevents errors when Hammer is loaded in the presence of an AMD
//  style loader but by script tag, not by the loader.
var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
freeGlobal.Hammer = Hammer;

if (typeof define === 'function' && define.amd) {
    define(function() {
        return Hammer;
    });
} else if (typeof module != 'undefined' && module.exports) {
    module.exports = Hammer;
} else {
    window[exportName] = Hammer;
}

})(window, document, 'Hammer');

},{}],2:[function(require,module,exports){
var postGraphicsTemplate = require('./pg-template/postGraphicsTemplate.js');


},{"./pg-template/postGraphicsTemplate.js":6}],3:[function(require,module,exports){
(function() {

    // All utility functions should attach themselves to this object.
    var util = {};

    // This code assumes it is running in a browser context
    window.TWP = window.TWP || {
        Module: {}
    };
    window.TWP.Module = window.TWP.Module || {};
    window.TWP.Module.util = util;

    if (!util.getParameters || typeof util.getParameters === 'undefined'){
        util.getParameters = function(url){
            var paramList = [],
                params = {},
                kvPairs,
                tmp;
            if (url) {
                if (url.indexOf('?') !== -1) {
                    paramList = url.split('?')[1];
                    if (paramList) {
                        if (paramList.indexOf('&')) {
                            kvPairs = paramList.split('&');
                        } else {
                            kvPairs = [paramList];
                        }
                        for (var a = 0; a < kvPairs.length; a++) {
                            if (kvPairs[a].indexOf('=') !== -1) {
                                tmp = kvPairs[a].split('=');
                                params[tmp[0]] = unescape(tmp[1]);
                            }
                        }
                    }
                }
            }
            return params;
        };
    }

    // Update the height of the iframe if this page is iframe'd.
    // NOTE: This **requires** the iframe's src property to use a location
    // without its protocol. Using a protocol will not work.
    //
    // e.g. <iframe frameborder="0" scrolling="no" style="width: 100%; height:600px;" src="//www.washingtonpost.com/graphics/national/census-commute-map/?template=iframe"></iframe>
    util.changeIframeHeight = function(){
        // Location *without* protocol and search parameters
        var partialLocation = (window.location.origin.replace(window.location.protocol, '')) + window.location.pathname;

        // Build up a series of possible CSS selector strings
        var selectors = [];

        // Add the URL as it is (adding in the search parameters)
        selectors.push('iframe[src="' + partialLocation + window.location.search + '"]');

        if (window.location.pathname[window.location.pathname.length - 1] === '/') {
            // If the URL has a trailing slash, add a version without it
            // (adding in the search parameters)
            selectors.push('iframe[src="' + (partialLocation.slice(0, -1) + window.location.search) + '"]');
        } else {
            // If the URL does *not* have a trailing slash, add a version with
            // it (adding in the search parameters)
            selectors.push('iframe[src="' + partialLocation + '/' + window.location.search + '"]');
        }

        // Search for those selectors in the parent page, and adjust the height
        // accordingly.
        var $iframe = $(window.top.document).find(selectors.join(','));
        var h = $('body').outerHeight(true);
        $iframe.css({'height' : h + 'px'});
    };

    // from http://davidwalsh.name/javascript-debounce-function
    util.debounce = function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    $(document).ready(function() {
        // iframe code
        var params = util.getParameters(document.URL);
        if (params['template'] && params['template'] === 'iframe') {
            // TODO Why do we need this? Nobody knows.
            try {
                document.domain = 'washingtonpost.com';
            } catch(e) {
            }

            $('body').addClass('iframe').show().css('display','block');
            if (params['graphic_id']){
                $('#' + params['graphic_id']).siblings().hide();
            }
            $('#pgcontent, .pgArticle').siblings().hide();

            // CORS limitations
            try {
                if (window.location.hostname === window.top.location.hostname){
                    var resizeIframe = util.debounce(function() {
                        util.changeIframeHeight();
                    }, 250);

                    // responsive part
                    // TODO Why 1000ms? This is not reliable.
                    window.setTimeout(function() {
                        util.changeIframeHeight();
                    }, 1000);

                    $(window).on('resize', resizeIframe);
                }
            } catch(e) {
            }
        }
    });

}.call(this));

},{}],4:[function(require,module,exports){
var Hammer = require('hammerjs');

(function ($, window, undefined) {

    /*
     * extend jQuery for nicer syntax for rendering our menus and lists.
     */
    //update <li>s from json

    var __isIE = $('html.ie').length ? true : false;


    $.fn.appendLinkItems = function(links, surroundingTag) {
        var element = this;
        surroundingTag = surroundingTag || "<li>";
        $.each(links, function(i, link) {
            var a = $("<a>");
            if (link.title) { a.text(link.title); }
            if (link.html) { a.html(link.html); }
            if (link.href) { a.attr("href", link.href); }
            if (link.attr) { a.attr(link.attr); }
            element.append(
                $(surroundingTag).append(a).addClass(link.selected ? "selected" : "")
            );
        });
        return this;
    };

    $.fn.trackClick = function(type) {
        var element = this;
        element.on("click", function() {
            var linkname;
            var link = $(this);
            if (!!window.s && typeof s.sendDataToOmniture == 'function') {
                linkname = ("pbnav:" + type + " - " +  $.trim(link.text())).toLowerCase();
                s.sendDataToOmniture(linkname, '', {
                    "channel": s.channel,
                    "prop28": linkname
                });
            }
        });
        return this;
    };

    $.fn.trackShare = function(){
        var element = this;
        element.on("click", function() {
            var link = $(this);
            var type = link.attr("data-share-type");
            if (!!window.s && typeof s.sendDataToOmniture == 'function' && type) {
                s.sendDataToOmniture('share.' + type, 'event6', { eVar27: type }); 
            }  
        });
        return this;
    };

    $.fn.makeDropdown = function (menuElement, options) {
        var clickElement = this;
        options = options || {};
        options.disabled = false;

        //default behavior for dropdown
        var down = options.down || function (_clickElement, _menuElement) {
            nav.closeDropdowns();
            _clickElement.addClass("active");
            $(".leaderboard").addClass("hideAd");
            var windowHeight = $(window).height() - 50;
            _menuElement.css("height","");
            _menuElement.css("height", (windowHeight <= _menuElement.height()) ? windowHeight : "auto");
            _menuElement.css("width", _clickElement.outerWidth() );
            _menuElement.css("left", _clickElement.offset().left );
            _menuElement.slideDown('fast');
        };

        var up = options.up || function (_clickElement, _menuElement) {
            _menuElement.slideUp('fast', function () {
                _clickElement.removeClass("active");
                $(".leaderboard").removeClass("hideAd");
            });
        };

        clickElement.click(function (event) {
            if( !options.disabled ){
                event.stopPropagation();
                //event.preventDefault();
                //And I used to think ie9 was a good browser...
                event.preventDefault ? event.preventDefault() : event.returnValue = false;

                if (menuElement.find("li").length == 0) return;

                if(clickElement.is(".active")){
                    up(clickElement, menuElement);
                } else {
                    down(clickElement, menuElement);
                }

                options.disabled = true;
                setTimeout(function(){ 
                    options.disabled = false;
                }, 500);
            }
        });

        if(!__isIE){
            var hammertime = new Hammer(clickElement[0], { prevent_mouseevents: true });
            hammertime.on("tap",handleTap);
}
        return this;
    };

    //move header feature outside of pb-container, so that the menu sliding animation can work
    // if( $("#pb-root .pb-f-page-header-v2").length && ($("#pb-root .pb-f-page-header-v2").siblings(".pb-feature").length || $("#pb-root .pb-f-page-header-v2").siblings(".pb-container").length) ) {
    //     (function () {
    //         var $header = $(".pb-f-page-header-v2");
    //         $(".pb-f-page-header-v2 script").remove();
    //         $("#pb-root").before( $header );
    //     }());
    // }

    //load the ad after the header has been moved, so it doesn't load twice. no callback on ad scripts, so have to set an interval to check
    // if( $("#nav-ad:visible").length ){
    //     var adIntervalTimeout = 10; //only try this for five seconds, or deal with it
    //     var adInterval = setInterval(function(){
    //         if( typeof(placeAd2) != "undefined" ){
    //             $("#wpni_adi_88x31").append(placeAd2(commercialNode,'88x31',false,''));    
    //             clearInterval(adInterval)
    //         }    
    //         if (adIntervalTimeout == 0) clearInterval(adInterval);
    //         adIntervalTimeout--;
    //     }, 500);
    // }

    //add tracking
    // $("#site-menu a").trackClick("main");
    // $("#share-menu a").trackShare();

    //activate dropdowns
    $("#wp-header .nav-btn[data-menu]").each(function(){
        $(this).addClass("dropdown-trigger");
        $(this).makeDropdown( $("#" + $(this).data("menu") ) );
    });

    //activate site menu with custom actions
    $("#site-menu-btn").makeDropdown( $("#site-menu"), {
        down: function(_clickElement, _menuElement){
            nav.closeDropdowns();
            _menuElement.css("height", window.outerHeight - 50);
            $("body").addClass( ($("#pb-root .pb-f-page-header-v2").length) ? "left-menu" : "left-menu left-menu-pb" );
            _clickElement.addClass("active");
            _menuElement.addClass("active");
            $('.pbHeader').toggleClass('not-fixed');
        },
        up: function(_clickElement, _menuElement){
            $("body").removeClass("left-menu").removeClass("left-menu-pb");
            _clickElement.removeClass("active");
            _menuElement.removeClass("active");
            $('.pbHeader').toggleClass('not-fixed');
        }
    });

    var hammertime = new Hammer( document.getElementById("site-menu"), {
        dragLockToAxis: true,
        dragBlockHorizontal: true
    });

    hammertime.on( "dragleft swipeleft", function(ev){ 
        ev.gesture.preventDefault();
        //ev.gesture.preventDefault ? ev.gesture.preventDefault() : ev.gesture.returnValue = false;
        ev.gesture.stopPropagation();
        if( ev.gesture.direction == "left" && $("body").is(".left-menu") ){
            $("#site-menu-btn").click();
        }
    });

    /* search-specific manipulation */
    $(".ios #nav-search-mobile input").focus(function(){
        $("header").css("position","absolute").css("top",window.pageYOffset);
    }).blur(function(){
        $("header").css("position","fixed").css("top",0);
    });

    //trigger window resize when mobile keyboard hides
    $("#nav-search-mobile input").blur(function(){
        $( window ).resize();
    });

    $(document).keyup(function(e) {
        // If you press ESC while in the search input, you should remove focus from the input
        if (e.keyCode == 27 && $("#nav-search input[type=text]").is(":focus")) {
            $("#nav-search input[type=text]").blur();
        }
    });

    $("#nav-search,#nav-search-mobile").submit(function (event) {
        if ($(this).find('input[type=text]').val()) {
            try{
                s.sendDataToOmniture('Search Submit','event2',{'eVar38':$(this).find('input[type=text]').val(),'eVar1':s.pageName});
            } catch(e) {}
            return true;
        } else {
            return false;
        }
    });

    /*
     * CLIENT SIDE API for CUSTOMIZING the HEADER
     */

    // There should only be one navigation per page. So our navigation object is a singleton.
    // Heavy dependency on jQuery
    var core = window.wp_pb = window.wp_pb || {};
    var nav = core.nav = core.nav || {};
    var deprecated = function () {};

    nav.setSearch = nav.showTopMenu = nav.hideTopMenu = nav.showPrimaryLinks =
    nav.hidePrimaryLinks = nav.showInTheNews = nav.hideInTheNews = nav.showAdSlug =
    nav.hideAdSlug = nav.showSectionName = nav.hideSectionName =
    nav.setMainMenu = nav.setSectionMenu = nav.setSectionName = deprecated;

    nav.showIdentity = function () {
        nav.renderIdentity();
        showIdentity = true;
    };

    nav.hideIdentity = function () {
        $("#nav-user").hide();
        $("nav-sign-in").hide();
        showIdentity = false;
    };

    nav.showSearch = function () {
        $("#nav-search").show();
    };

    nav.hideSearch = function () { 
        $("#nav-search").hide(); 
    };

    nav.showSubscription = function () {
        $("#nav-subscription").show();
    };

    nav.hideSubscription = function () { 
        $("#nav-subscription").hide(); 
    };
    
    var setMenu = function (elem, menu) {
        var element = $(elem);
        element.children('li').remove();
        element.appendLinkItems(menu);
    };

    nav.setIdentityMenu = function (menu) {
        setMenu("#user-menu ul", menu);
    };

    nav.setPageTitle = function(name){
        $('#nav-page-title').text(name);
        $("#share-menu").data('title', name);
    };

    nav.setShareUrl = function(url){
        $("#share-menu").data('permalink',url);
    };

    nav.setTwitterHandle = function(handle){
        if($('#share-menu a[data-share-type="Twitter"]').length){
            $('#share-menu a[data-share-type="Twitter"]').data('twitter-handle', handle);
        }
    };

    nav.closeDropdowns = function(){
        $("#wp-header .dropdown-trigger.active").each(function(){
            $(this).removeClass("active");
            $("#"+$(this).data("menu")).hide();
        });
        $(".leaderboard").removeClass("hideAd");
    }


    var scrollEvents = {},
        scrollPos = $(this).scrollTop();

    var forceOpen = $("#wp-header").is(".stay-open");

    $(window).scroll(function () {

        /* show and hide nav on scroll */
        var currentPos = $(this).scrollTop();
        if (!forceOpen) {   

            if( (currentPos + 20) < scrollPos || currentPos === 0 ){
                nav.showNav();
                scrollPos = currentPos;
            } else if ( (currentPos - 20) > scrollPos && currentPos > 50 ){
                nav.hideNav();
                scrollPos = currentPos;
            }
        }

        /* listen for show/hide title */

        if (scrollEvents.length == 0) return;

        for (var i in scrollEvents) {
            if (scrollEvents.hasOwnProperty(i)) {
                if ( currentPos >= scrollEvents[i].targetPosition) {
                    scrollEvents[i].down.call();
                } else if (currentPos < scrollEvents[i].targetPosition) {
                    scrollEvents[i].up.call();
                }
            }
        }

    });

    $(window).resize(function() {
        //remove standard dropdowns
        nav.closeDropdowns();
        //resize site menu, if open
        if($("body").is(".left-menu")){
            $("#site-menu").css("height", $(window).height() - 50);
        }
    });

    nav.showNav = function(){
        if( $("#wp-header").is(".bar-hidden") ){
            $("#wp-header").removeClass("bar-hidden");
        }
    };

    nav.hideNav = function(){
        if( !$("#wp-header").is(".bar-hidden") && !$("#wp-header .nav-btn.active").length ){
            $("#wp-header").addClass("bar-hidden");
        }
    };

    nav.showTitleOnScroll = function($target){
        var element = $target;
        scrollEvents["titleScroll"] = {
            targetPosition: element.offset().top + 50,
            down: function () { 
                if( !$('#wp-header').is(".title-mode") ){
                    $('#wp-header').addClass('title-mode');
                    $("#wp-header .nav-middle").css( "padding-right",  $("#wp-header .nav-right").outerWidth() );
                    nav.closeDropdowns();
                }   
            },
            up: function () { 
                if( $('#wp-header').is(".title-mode") ){
                    $('#wp-header').removeClass('title-mode'); 
                    nav.closeDropdowns();
                }   
            }
        };
    };

    if ( $('#nav-page-title[data-show-on-scroll="true"]').length ){
        var $target = ( $(".nav-scroll-target").length ) ? $(".nav-scroll-target") : $("h1, h2");
        if( $target.length ) nav.showTitleOnScroll( $target.first() );
    }
        
    nav.renderShare = function(){
        $share = $("#share-menu");
        $facebook = $('a[data-share-type="Facebook"]', $share);
        $twitter = $('a[data-share-type="Twitter"]', $share);
        $linkedin = $('a[data-share-type="LinkedIn"]', $share);
        $email = $('a[data-share-type="Email"]', $share);
        $pinterest = $('a[data-share-type="Pinterest"]', $share);

        if ($facebook.length){
            $facebook.click(function(event){
                 window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent( $("#share-menu").data('permalink') ),'','width=658,height=354,scrollbars=no');
                return false;
            });
        }

        if ($twitter.length){
            $twitter.click(function(event){
                var twitterHandle = ($(this).data("twitter-handle")) ?  $(this).data("twitter-handle").replace("@","") : "washingtonpost";
                window.open('https://twitter.com/share?url=' + encodeURIComponent( $("#share-menu").data('permalink') ) + '&text=' + encodeURIComponent( $("#share-menu").data('title') ) + '&via=' + twitterHandle ,'','width=550, height=350, scrollbars=no');
                return false;
            });
        }

        if ($linkedin.length){
            $linkedin.click(function(event){
                window.open('https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent( $("#share-menu").data('permalink') ) + '&title=' + encodeURIComponent( $("#share-menu").data('title') ),'','width=830,height=460,scrollbars=no');
                return false;
            });
        }

        if ($email.length){
            $email.click(function(event){
                window.open('mailto:?subject=' + encodeURIComponent( $("#share-menu").data('title') ) + ' from The Washington Post&body=' + encodeURIComponent( $("#share-menu").data('permalink') ),'','');
                return false;
            });
        }

        if($pinterest.length){
            $pinterest.click(function(event){
                var e = document.createElement('script');
                e.setAttribute('type','text/javascript');
                e.setAttribute('charset','UTF-8');
                e.setAttribute('src','https://assets.pinterest.com/js/pinmarklet.js?r=' + Math.random()*99999999);
                document.body.appendChild(e);
            });
        }

    };

    if( $("#share-menu").length ){
        nav.renderShare();
    }

    var idp; //private variable. There can be only one provider. So this is a singleton.
    nav.getIdentityProvider = function () {
        return idp;
    };
    nav.setIdentityProvider = function (provider) {
        var ef = function () {}; //empty function
        idp = {};
        // we'll pad any missing portion with empty function
        idp.name = provider.name || "";
        idp.getUserId = provider.getUserId || ef;
        idp.getUserMenu = provider.getUserMenu || ef;
        idp.getSignInLink = provider.getSignInLink || ef;
        idp.getRegistrationLink = provider.getRegistrationLink || ef;
        idp.isUserLoggedIn = provider.isUserLoggedIn || ef;
        idp.isUserSubscriber = provider.isUserSubscriber || ef;
        
        idp.render = provider.render || function () {
            if (idp.isUserLoggedIn()) {
                $("#nav-user .username").text(idp.getUserId());
                $("#nav-user-mobile a").text(idp.getUserId());
                nav.setIdentityMenu(idp.getUserMenu());
                $("#nav-user").removeClass("hidden");
                $("#nav-user-mobile").removeClass("hidden");
                $("#nav-user-mobile a").attr("href",idp.getUserMenu()[0]["href"]);
                if( idp.isUserSubscriber() === "0" ){
                    $("#nav-subscribe").removeClass("hidden");
                    $("#nav-subscribe-mobile").removeClass("hidden");
                }
            } else {
                $("#nav-sign-in").attr("href", idp.getSignInLink()+"&nid=top_pb_signin").removeClass("hidden");
                $("#nav-sign-in-mobile").removeClass("hidden").find("a").attr("href", idp.getSignInLink()+"&nid=top_pb_signin");
                $("#nav-subscribe").removeClass("hidden");
                $("#nav-subscribe-mobile").removeClass("hidden");
            }
        };

        //let's render
        nav.renderIdentity();
    };
    nav.renderIdentity = function (callback) {
        callback = callback || function () {};
        if (idp) { // the user might not have configured any identity. So check for it.
            idp.render();
        }
        callback(idp);
    };

    /*
     * Using the privded API, set up the default identity provider as TWP
     */

    // if the identity component were set as hidden from PageBuilder admin
    // set a flag so that we don't process login at all
    var showIdentity = $("#nav-user").data("show-identity");

    // default Identity
    var current = window.location.href.split("?")[0];
    var twpIdentity = {
        name: "TWP",
        getUserId: function () {
            var username = TWP.Util.User.getUserName();
            var userid = TWP.Util.User.getUserId();
            if (typeof username == "string" && username.length > 0) {
                return username;
            } else {
                return userid;
            }
        },
        getUserMenu: function () {
            return [
                { "title": "Profile", "href": TWP.signin.profileurl + current + '&refresh=true' },
                { "title": "Log out", "href": TWP.signin.logouturl_page }
            ];
        },
        getSignInLink: function () {
            return TWP.signin.loginurl_page + current;
        },
        getRegistrationLink: function () {
            return TWP.signin.registrationurl_page + current;
        },
        isUserSubscriber: function (){
            sub = (document.cookie.match(/rplsb=([0-9]+)/)) ? RegExp.$1 : ''; 
            return sub;
        },
        isUserLoggedIn: function () {
            return (TWP.Util.User) ? TWP.Util.User.getAuthentication() : false;
        }
    };

    // If we are showing identity then set the default identity provider to TWP.
    //   User can overide this whenever they want.
    //
    // In TWP, identity user interface needs to processed after the fact that all other javascript has been loaded.
    //   But the js resources are loaded asynchronously and it doesn't have any callbacks hooks. So we watch for it.
    if (showIdentity) {
        //try to load TWP only if we are showing Identity.
        var init = new Date().getTime();
        (function checkTWP() {
            // if there's already idp set, then don't try to load TWP.
            if (!nav.getIdentityProvider()) {
                if (TWP && TWP.signin && TWP.Util) { // make sure TWP has been loaded.
                    nav.setIdentityProvider(twpIdentity);
                    nav.renderIdentity();
                } else {
                    var now = new Date().getTime();
                    // after 3 seconds, if TWP indentity hasn't been loaded. Let's just stop.
                    if (now - init < 3 * 1000) {
                        // if it hasn't been loaded, we wait few milliseconds and try again.
                        window.setTimeout(function () { checkTWP(); }, 200);
                    }
                }
            }
        }());
    }

    /* hammer.js tap */

    function handleTap(ev) {
        ev.gesture.preventDefault();
        //ev.gesture.preventDefault ? ev.gesture.preventDefault() : ev.gesture.returnValue = false;
        ev.gesture.stopPropagation();
        $(ev.gesture.target).click();
    }

    /* a/b test and target */
    // $(window.document).on('abtest-ready', function(e, ABT) {

    //     if ( !supportedClient() ) {
    //         return;
    //     }

    //     applyVariantExperience('mastHead2', 'logoLarge');

    //     function applyVariantExperience(featureName, variantName) {
    //         var ftr = ABT.get(featureName);
    //         var trk = ftr.is(variantName);
            
    //         var $target = $('header.abt-not-loaded, #wp-topper, .pb-f-page-header-v2, body');
    //         $target.removeClass( 'abt-not-loaded' );
    //         $target.addClass( 'abt-' + featureName + '-' + variantName + '-' + trk );

    //         var fd = moment().format('dddd, LL');

    //         $('#wp-topper .top-timestamp').text(fd);
    //     }

    //     function supportedClient() {

    //         return $('html.desktop').length > 0 && $('header.dark').length == 0;
    //     }
    // });

}(jQuery, window));


},{"hammerjs":1}],5:[function(require,module,exports){
//Top Share Bar JS - stolen straight from 
(function($){

   var socialTools = {
        myRoot : '.top-sharebar-wrapper',

        init:function (myRoot) {
            myRoot = myRoot || this.myRoot;
            $(myRoot).each(function(index, myRootElement){
                myRootElement.postShare = new postShare();
                myRootElement.postShare.init($(myRootElement), $(myRootElement).data('postshare'));
                var $root = $(myRootElement), 
                    $individualTool = $('.tool:not(.more)',$root),
                    $socialToolsWrapper = $('.social-tools-wrapper',$root),
                    $socialToolsMoreBtn = $('.tool.more',$socialToolsWrapper),
                    $socialToolsAdditional = $('.social-tools-additional',$root),
                    $socialToolsUtility = $('.utility-tools-wrapper',$root),
                    width = (window.innerWidth > 0) ? window.innerWidth : screen.width,
                    isMobile = (mobile_browser === 1 && width < 480) ? true : false,
                    config = {'omnitureEvent' : 'event6'};          
    
                $socialToolsMoreBtn.off('click').on('click',this,function(ev){  
                    if(isMobile){$socialToolsUtility.hide('fast');};        
                    $socialToolsMoreBtn.hide('fast');
                        $socialToolsAdditional.show('fast',function(ev){
                            $('.tool',$socialToolsWrapper).animate({"width":40},250);
                            $root.addClass("expanded");
                            $('.social-tools',$socialToolsAdditional).animate({"margin-left":0},250);
                            if(isMobile){$socialToolsUtility.show('slow');};        
                        });//end addtl show
                });//end more click 
                $individualTool.bind({
                    click: function(event){
                        //event.stopPropagation();
                        if (typeof window.sendDataToOmniture === 'function' ) {
                            var shareType = $(this).attr('class');
                            shareType = (typeof shareType != 'undefined')?shareType.split(" ")[0].trim():'';
                            var omnitureVars =  {
                                    "eVar1":(typeof window.s == 'object') && s && s.eVar1,
                                    "eVar2":(typeof window.s == 'object') && s && s.eVar2,
                                    "eVar8":(typeof window.s == 'object') && s && s.eVar8,
                                    "eVar17":(typeof window.s == 'object') && s && s.eVar17,
                                    "eVar27":''
                                    };
                            omnitureVars.eVar27 = shareType;
                            var eventName = config.omnitureEvent;
                            try {
                                sendDataToOmniture('share.' + shareType,eventName,omnitureVars);
                            } catch (e){}    
                        }
                    }
                });
            });
         }
    };   

   var textResizer = {
        currIncrementMax:4,
        currIncrementUnit:2,
        currIncrementIndex:0,
        init: function (myRoot,resizeableElementList,clickElement) {
            myRoot = myRoot || '#article-body article, .related-story';
            resizeableElementList = resizeableElementList || 'p, li';
            clickElement = clickElement || '.tool.textresizer';
            this.root = $(myRoot);
            this.resizeableElements = $(resizeableElementList, this.root);

            // add "Next up" lable to the resizable element's list
            if($(".related-story").prev('h3').length > 0){
                this.resizeableElements.push($('.related-story').prev('h3'));
                this.resizeableElements.push($('.related-story h4 a'));
            }
            $(clickElement).unbind('click').on('click',this,this.resize);
        },
        resize: function (event) {  
            var currObj = event.data;
            if (currObj.currIncrementIndex == currObj.currIncrementMax) {
                currObj.currIncrementIndex = 0;
                currObj.currIncrementUnit = (currObj.currIncrementUnit == 2)?-2:2;
            }
            currObj.currIncrementIndex = currObj.currIncrementIndex + 1;
            currObj.resizeableElements.each(function(){
                elm = $(this);
                currSize= parseFloat(elm.css('font-size'),5);
                var result = currSize + currObj.currIncrementUnit;
                elm.css('font-size', result);
                wp_pb.report('textresizer', 'resized', result);
            }); 

            
        }
   };
var mobile_browser = mobile_browser && mobile_browser === 1 ? 1 : 0;
   
   var postShare = function() {
       this.init = function(rootElement, postShareTypes) {
           if (postShareTypes) {
               postShareTypes.split(",").forEach(function(element, index){
                   var postShareUrl = "";
                   if (window.location.host.indexOf('washingtonpost.com') >= 0) {
                       postShareUrl = 'http://postshare.washingtonpost.com'; //production only
                   } else if (window.location.host.indexOf('pb-staging.digitalink.com') >= 0 || window.location.host.indexOf('pb-staging.wpprivate.com') >= 0) {
                       postShareUrl = 'http://postshare-stage.wpprivate.com'; //testing pb-staging
                   } else {
                       postShareUrl = 'http://postshare-dev.wpprivate.com'; //testing pb-dev
                   }
                   var preTimestamp = (new Date()).getTime();
                   var preBusinessKey = wp_pb.StaticMethods.getUniqueKey(1000, null, preTimestamp);
                   var object = {
                       shareType : element,
                       timestamp : preTimestamp,
                       businessKey : preBusinessKey,
                       shareUrl : null,
                       tinyUrl : null,
                       calledPostShare : false,
                       clientUuid : null,
                       postShareUrl : postShareUrl,
                       
                       callPostShare : function (){
                           if (!this.calledPostShare){
                               var _this = this;
                                $.ajax({
                                    url: _this.postShareUrl+"/api/bk/"+_this.businessKey+"/"+_this.clientUuid+"/"+_this.shareType+"/"+_this.timestamp,
                                    async: true,
                                    type: 'POST',
                                    error: function(){
                                        _this.calledPostShare = false;
                                    }
                                });
                                this.calledPostShare = true;
                           }
                       },
                       
                       share : function (socialUrl, socialUrl2, style, callbackContext) {
                           var _this = this;
                           if (!this.tinyUrl || this.tinyUrl.length == 0){
                               $.ajax({
                                   url: "http://tinyurl.washingtonpost.com/create.jsonp",
                                   async: false,
                                   data: {
                                       url: _this.shareUrl + "?postshare="+_this.businessKey
                                   },
                                   type: 'GET',
                                   dataType: 'jsonp',
                                   crossDomain: true,
                                   success: function(data){
                                       _this.tinyUrl = data.tinyUrl;
                                       callbackContext.openWindow(socialUrl+_this.tinyUrl+socialUrl2,_this.shareType,style);
                                   },
                                   error: function(){
                                       //throw "PostShare failed: tinyUrl";
                                   },
                                   timeout: 200
                                });
                            } else {
                                callbackContext.openWindow(socialUrl+_this.tinyUrl+socialUrl2,_this.shareType,style);
                            }
                        }
                    };
                   $(rootElement.find('.'+element)[0]).parent()[0].postShare = $(rootElement)[0].postShare;
                   $(rootElement.find('.'+element)[0]).parent()[0].postShareObject = object;
               });
           }
       },
       
       this.callPostShare = function (element, elementObject, socialUrl, shareUrlLong, socialUrl2, style) {
           if(element && elementObject && socialUrl && shareUrlLong) {
                var shareType = $(element).children().attr('class');
                shareType = (typeof shareType != 'undefined')?shareType.split(" ")[0].trim():'';
                
                if(!socialUrl2) {
                    socialUrl2 = "";
                }
                
                var clientUuid = $.cookie("wapo_login_id");
                
                elementObject.clientUuid = clientUuid;
                if (clientUuid && clientUuid.length > 0 && shareType && shareType.length > 0 && elementObject.shareType && shareType.trim() == elementObject.shareType.trim()) {
                    elementObject.shareUrl = shareUrlLong;
                    elementObject.callPostShare();
                    elementObject.share(socialUrl, socialUrl2, style, element.postShare);
                } else {
                    throw "PostShare failed: no logged in User or wrong Sharetype";
                }
                $(element).parent()[0].postShareObject = elementObject;
           } else {
               throw "PostShare failed: Data missing";
           }
        },
       
        this.openWindow = function(url, name, style){
            window.open(url,'share_'+name,style);
        }
   };
   
   window.TWP = window.TWP || {};
   TWP.SocialTools = TWP.SocialTools || socialTools;
   TWP.TextResizer = TWP.TextResizer || textResizer;

   TWP.TextResizer.init();
   TWP.SocialTools.init();


   /*
     * POPOUT code for later var $article = $('#article-topper'); // START:
     * Social share pop-out var $socialToolsMoreBtn = $('.social-tools
     * .more',$article), $socialToolsPopOut =
     * $('.social-tools.pop-out',$article) ;
     * $socialToolsMoreBtn.on('click',function(ev){ var targetTop =
     * $socialToolsMoreBtn.position().top +
     * $socialToolsMoreBtn.outerHeight()-1-14; var targetLeft =
     * $socialToolsMoreBtn.position().left-1-3;
     * $socialToolsPopOut.css({"top":targetTop,"left":targetLeft});
     * $socialToolsPopOut.toggle(); });
     * $socialToolsPopOut.on('mouseout',function(ev){
     * $socialToolsPopOut.toggle(); }); // END: Social share pop-out
     */
})(jQuery);
},{}],6:[function(require,module,exports){
var iframe = require('./iframe.js');
var twitterFollowButtonModules = require('./twitter-follow.js');
var pbHeaderModule = require('./pbHeader.js');
var pbSocialTools = require('./pbSocialTools.js');

//Adds the return url to the subscribe action
var setupSubscribeBtn = function(){
  var $subscribe = $('#nav-subscribe'),
    href =  $subscribe.attr('href'),
    pageLocation = window.encodeURI(window.location.href);
   $subscribe.attr('href', href + pageLocation);
};
//Drop in your init file
setupSubscribeBtn();

/**************************************
        General
**************************************/
var getOffset = function(el) {
  el = el.getBoundingClientRect();
  return {
    left: el.left + window.scrollX,
    top: el.top + window.scrollY
  }
}

var shuffle = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

/**************************************
        Values
**************************************/
mosquitosPositionsPhase1 = new Array(
  new Array({x:0.8, y:0.2}, {x:0.78, y:0.18}, {x:0.74, y:0.2}, {x:0.72, y:0.21}, {x:0.71, y:0.24}, {x:0.73, y:0.26}, {x:0.76, y:0.23}, {x:0.79, y:0.2}),
  new Array({x:0.6, y:0.3}, {x:0.55, y:0.22}, {x:0.62, y:0.24}, {x:0.68, y:0.2}, {x:0.71, y:0.18}, {x:0.68, y:0.15}, {x:0.64, y:0.18}, {x:0.63, y:0.22}, {x:0.62, y:0.26}, {x:0.61, y:0.28}),
  new Array({x:0.49, y:0.14}, {x:0.54, y:0.16}, {x:0.56, y:0.14}, {x:0.54, y:0.18}, {x:0.56, y:0.22}, {x:0.52, y:0.18}, {x:0.5, y:0.14}, {x:0.47, y:0.12}),
  new Array({x:0.55, y:0.31}, {x:0.58, y:0.28}, {x:0.64, y:0.26}, {x:0.72, y:0.22}, {x:0.8, y:0.18}, {x:0.73, y:0.22}, {x:0.68, y:0.24}, {x:0.62, y:0.28}),
  new Array({x:0.75, y:0.16}, {x:0.72, y:0.18}, {x:0.68, y:0.22}, {x:0.62, y:0.26}, {x:0.55, y:0.3}, {x:0.62, y:0.26}, {x:0.68, y:0.22}, {x:0.72, y:0.18}),
  new Array({x:0.8127696289905091, y:0.1458153580672994},{x:0.7618636755823986, y:0.1371872303710095},{x:0.6937014667817084, y:0.13459879206212252},{x:0.5858498705780846, y:0.14322691975841242},{x:0.5185504745470233, y:0.16997411561691114},{x:0.5099223468507333, y:0.2079378774805867},{x:0.5599654874892148, y:0.23209663503019845},{x:0.637618636755824, y:0.21484037963761865},{x:0.7066436583261432, y:0.21397756686798963},{x:0.7903364969801553, y:0.2355478861087144},{x:0.8395168248490078, y:0.21138912855910266},{x:0.8395168248490078, y:0.19327006039689387}),
  new Array({x:0.4909404659188956, y:0.31924072476272647},{x:0.5030198446937014, y:0.2786885245901639},{x:0.5754961173425367, y:0.1993097497842968},{x:0.6384814495254529, y:0.13805004314063848},{x:0.6781708369283865, y:0.09663503019844694},{x:0.7144089732528042, y:0.11130284728213978},{x:0.7480586712683348, y:0.17601380500431407},{x:0.8050043140638481, y:0.26833477135461603},{x:0.7920621225194133, y:0.3201035375323555},{x:0.6557377049180327, y:0.33045729076790337},{x:0.545297670405522, y:0.3175150992234685}),
  new Array({x:0.6074201898188093, y:0.11216566005176877},{x:0.5823986194995686, y:0.14754098360655737},{x:0.546160483175151, y:0.2200172562553926},{x:0.5530629853321829, y:0.3088869715271786},{x:0.6419327006039689, y:0.3071613459879206},{x:0.6721311475409836, y:0.2372735116479724},{x:0.6962899050905953, y:0.14926660914581535},{x:0.7532355478861087, y:0.1458153580672994},{x:0.7368421052631579, y:0.28817946505608283},{x:0.8032786885245902, y:0.3330457290767903},{x:0.822260569456428, y:0.2269197584124245},{x:0.7394305435720449, y:0.12079378774805867},{x:0.6781708369283865, y:0.1182053494391717},{x:0.6056945642795514, y:0.13114754098360656}),
  new Array({x:0.5168248490077653, y:0.270060396893874},{x:0.5133735979292493, y:0.1906816220880069},{x:0.5625539257981018, y:0.13114754098360656},{x:0.6289905090595341, y:0.09836065573770492},{x:0.7040552200172563, y:0.09232096635030199},{x:0.7515099223468508, y:0.13114754098360656},{x:0.7894736842105263, y:0.18723037100949094},{x:0.8533218291630716, y:0.25625539257981017}),
  new Array({x:0.8274374460742019, y:0.13891285591026747},{x:0.7610008628127696, y:0.10094909404659189},{x:0.7057808455565142, y:0.07679033649698015},{x:0.630716134598792, y:0.07592752372735116},{x:0.548748921484038, y:0.091458153580673},{x:0.49611734253666956, y:0.13201035375323555},{x:0.48058671268334774, y:0.17515099223468508},{x:0.5107851596203624, y:0.21570319240724764},{x:0.5668679896462467, y:0.25625539257981017},{x:0.6600517687661778, y:0.30371009490940465},{x:0.7351164797238999, y:0.30457290767903367},{x:0.7842968075927523, y:0.32182916307161347},{x:0.8403796376186368, y:0.3114754098360656},{x:0.8360655737704918, y:0.19585849870578084}),
  new Array({x:0.4797238999137187, y:0.30198446937014667},{x:0.4909404659188956, y:0.2079378774805867},{x:0.5323554788610871, y:0.12424503882657463},{x:0.639344262295082, y:0.08886971527178603},{x:0.7739430543572045, y:0.0992234685073339},{x:0.8472821397756687, y:0.1544434857635893},{x:0.8705780845556514, y:0.27092320966350303},{x:0.8446937014667817, y:0.3244176013805004},{x:0.728213977566868, y:0.3459879206212252},{x:0.5323554788610871, y:0.34081104400345125})
);
mosquitosPositionsPhase2 = new Array(
  new Array({x:0.48228813559322037, y:0.2016949152542373},{x:0.4204237288135594, y:0.20423728813559322},{x:0.37466101694915255, y:0.2059322033898305},{x:0.3026271186440678, y:0.2076271186440678},{x:0.28991525423728814, y:0.21525423728813559},{x:0.2848305084745763, y:0.22796610169491524},{x:0.28228813559322036, y:0.25169491525423726},{x:0.27466101694915257, y:0.2669491525423729},{x:0.2560169491525424, y:0.26949152542372884},{x:0.07211864406779663, y:0.27203389830508473},{x:0.05516949152542373, y:0.2805084745762712},{x:0.050084745762711866, y:0.30338983050847457},{x:0.047542372881355946, y:0.4245762711864407},{x:0.049237288135593235, y:0.49830508474576274},{x:0.05686440677966102, y:0.5135593220338983},{x:0.06957627118644068, y:0.5186440677966102},{x:0.09245762711864407, y:0.5211864406779662},{x:0.10940677966101696, y:0.5262711864406779},{x:0.11449152542372883, y:0.5423728813559322},{x:0.11449152542372883, y:0.559322033898305})
);
mosquitosPositionsPhase3 = new Array(
  new Array({x:0.11, y:0.62}, {x:0.12, y:0.68}, {x:0.13, y:0.72}, {x:0.14, y:0.68}, {x:0.13, y:0.62}, {x:0.11, y:0.6}),
  new Array({x:0.08, y:0.6}, {x:0.09, y:0.58}, {x:0.1, y:0.52}, {x:0.12, y:0.58}, {x:0.13, y:0.64}, {x:0.09, y:0.62}),
  new Array({x:0.13, y:0.68}, {x:0.12, y:0.62}, {x:0.11, y:0.58}, {x:0.12, y:0.57}, {x:0.13, y:0.58}, {x:0.11, y:0.62}),
  new Array({x:0.12796610169491526, y:0.6194915254237288},{x:0.11949152542372882, y:0.6322033898305085},{x:0.11016949152542373, y:0.6542372881355932},{x:0.1, y:0.6796610169491526},{x:0.10677966101694915, y:0.7101694915254237},{x:0.13559322033898305, y:0.7110169491525423},{x:0.14576271186440679, y:0.6813559322033899},{x:0.14661016949152542, y:0.6457627118644068},{x:0.1423728813559322, y:0.5822033898305085},{x:0.13389830508474576, y:0.559322033898305},{x:0.10762711864406779, y:0.5669491525423729},{x:0.10932203389830508, y:0.5991525423728814}),
  new Array({x:0.14491525423728813, y:0.5796610169491525},{x:0.14915254237288136, y:0.5601694915254237},{x:0.12796610169491526, y:0.55},{x:0.11271186440677966, y:0.5567796610169492},{x:0.13644067796610168, y:0.5991525423728814},{x:0.11610169491525424, y:0.6245762711864407},{x:0.10338983050847457, y:0.6635593220338983},{x:0.12033898305084746, y:0.6754237288135593},{x:0.14576271186440679, y:0.6949152542372882},{x:0.12627118644067797, y:0.7152542372881356},{x:0.10762711864406779, y:0.688135593220339},{x:0.12457627118644068, y:0.6288135593220339},{x:0.13813559322033897, y:0.5864406779661017})
);
mosquitosPositionsPhase4 = new Array(
  new Array({x:0.11618644067796612, y:0.711864406779661}, {x:0.11364406779661017, y:0.7398305084745763}, {x:0.11364406779661017, y:0.7584745762711864}, {x:0.11364406779661017, y:0.7711864406779662}, {x:0.11364406779661017, y:0.7915254237288135})
);
mosquitosPositionsPhase5 = new Array(
  new Array({x:0.11, y:0.82}, {x:0.12, y:0.88}, {x:0.13, y:0.92}, {x:0.14, y:0.88}, {x:0.13, y:0.82}, {x:0.11, y:0.8}),
  new Array({x:0.08, y:0.8}, {x:0.09, y:0.78}, {x:0.1, y:0.82}, {x:0.12, y:0.78}, {x:0.13, y:0.84}, {x:0.09, y:0.82}),
  new Array({x:0.13, y:0.88}, {x:0.12, y:0.82}, {x:0.11, y:0.78}, {x:0.12, y:0.77}, {x:0.13, y:0.78}, {x:0.11, y:0.82}),
  new Array({x:0.14745762711864407, y:0.7694915254237288},{x:0.11694915254237288, y:0.7728813559322034},{x:0.09576271186440678, y:0.7813559322033898},{x:0.0847457627118644, y:0.8067796610169492},{x:0.1, y:0.8372881355932204},{x:0.13389830508474576, y:0.8533898305084746},{x:0.15169491525423728, y:0.838135593220339},{x:0.1635593220338983, y:0.8025423728813559}),
  new Array({x:0.1152542372881356, y:0.8508474576271187},{x:0.09067796610169492, y:0.8203389830508474},{x:0.09830508474576272, y:0.7957627118644067},{x:0.11271186440677966, y:0.7754237288135594},{x:0.13898305084745763, y:0.7796610169491526},{x:0.13559322033898305, y:0.8033898305084746},{x:0.14745762711864407, y:0.8271186440677966},{x:0.12627118644067797, y:0.8491525423728814})
);
mosquitosPositionsPhase6 = new Array(
  new Array({x:0.10694915254237287, y:0.8220338983050848},{x:0.10271186440677967, y:0.8347457627118644},{x:0.10694915254237287, y:0.8483050847457627},{x:0.10779661016949153, y:0.8796610169491526},{x:0.10779661016949153, y:0.9033898305084745},{x:0.10779661016949153, y:0.9279661016949152},{x:0.10949152542372882, y:0.9550847457627119},{x:0.11372881355932203, y:0.9711864406779661},{x:0.12305084745762711, y:0.9788135593220338},{x:0.14169491525423727, y:0.9822033898305085},{x:0.16966101694915253, y:0.9830508474576272},{x:0.1950847457627119, y:0.9830508474576272},{x:0.22389830508474579, y:0.9805084745762712},{x:0.24593220338983052, y:0.9805084745762712},{x:0.2586440677966102, y:0.9838983050847457},{x:0.26457627118644067, y:0.9889830508474576},{x:0.2705084745762712, y:1.0016949152542374},{x:0.27305084745762714, y:1.0245762711864406},{x:0.27728813559322035, y:1.0415254237288136},{x:0.28576271186440677, y:1.047457627118644},{x:0.304406779661017, y:1.05},{x:0.34847457627118644, y:1.0491525423728814},{x:0.3806779661016949, y:1.0491525423728814},{x:0.4086440677966102, y:1.0491525423728814},{x:0.42135593220338985, y:1.0559322033898304},{x:0.4289830508474577, y:1.0669491525423729},{x:0.43067796610169495, y:1.088135593220339},{x:0.4289830508474577, y:1.1144067796610169},{x:0.428135593220339, y:1.1559322033898305},{x:0.4323728813559322, y:1.1906779661016949},{x:0.42983050847457627, y:1.2059322033898305})
);
mosquitosPositionsPhase7 = new Array(
  new Array({x:0.4101694915254237, y:1.188135593220339},{x:0.3822033898305085, y:1.2101694915254237},{x:0.37542372881355934, y:1.255084745762712},{x:0.39152542372881355, y:1.2923728813559323},{x:0.43728813559322033, y:1.3152542372881355},{x:0.4745762711864407, y:1.306779661016949},{x:0.5, y:1.276271186440678},{x:0.5059322033898305, y:1.2330508474576272},{x:0.46779661016949153, y:1.1838983050847458}),
  new Array({x:0.46016949152542375, y:1.2372881355932204},{x:0.47627118644067795, y:1.2584745762711864},{x:0.4728813559322034, y:1.3008474576271187},{x:0.42033898305084744, y:1.3084745762711865},{x:0.38813559322033897, y:1.2686440677966102},{x:0.40423728813559323, y:1.238135593220339},{x:0.45084745762711864, y:1.2627118644067796},{x:0.49491525423728816, y:1.244915254237288},{x:0.5084745762711864, y:1.2152542372881356},{x:0.47966101694915253, y:1.1813559322033897}),
  new Array({x:0.41271186440677965, y:1.1923728813559322},{x:0.4728813559322034, y:1.2},{x:0.5059322033898305, y:1.2483050847457626},{x:0.5033898305084745, y:1.2949152542372881},{x:0.43728813559322033, y:1.3},{x:0.3855932203389831, y:1.2847457627118644},{x:0.376271186440678, y:1.2423728813559323},{x:0.423728813559322, y:1.2474576271186442},{x:0.4652542372881356, y:1.2194915254237289},{x:0.41694915254237286, y:1.1872881355932203})
);
mosquitosPositionsPhase8 = new Array(
  new Array({x:0.48745762711864404, y:1.2508474576271187},{x:0.5086440677966102, y:1.2508474576271187},{x:0.5323728813559322, y:1.2491525423728813},{x:0.542542372881356, y:1.2516949152542374},{x:0.5493220338983051, y:1.2584745762711864},{x:0.551864406779661, y:1.271186440677966},{x:0.551864406779661, y:1.285593220338983},{x:0.551864406779661, y:1.3135593220338984},{x:0.551864406779661, y:1.3432203389830508},{x:0.5561016949152543, y:1.3508474576271186},{x:0.5620338983050848, y:1.3644067796610169},{x:0.5772881355932203, y:1.36864406779661},{x:0.5959322033898306, y:1.3694915254237288},{x:0.6103389830508474, y:1.3652542372881356},{x:0.6205084745762712, y:1.3584745762711865},{x:0.625593220338983, y:1.3457627118644069},{x:0.628135593220339, y:1.3194915254237287},{x:0.6272881355932204, y:1.2957627118644068},{x:0.6247457627118644, y:1.2661016949152541},{x:0.6238983050847458, y:1.238135593220339},{x:0.6289830508474576, y:1.2271186440677966},{x:0.6272881355932204, y:1.2135593220338983},{x:0.625593220338983, y:1.2016949152542373},{x:0.6289830508474576, y:1.1940677966101696},{x:0.6383050847457628, y:1.1872881355932203},{x:0.6696610169491526, y:1.1889830508474577},{x:0.6959322033898305, y:1.1872881355932203},{x:0.718813559322034, y:1.1864406779661016},{x:0.7332203389830508, y:1.1923728813559322},{x:0.7349152542372881, y:1.2042372881355932},{x:0.7349152542372881, y:1.2220338983050847},{x:0.7315254237288136, y:1.2601694915254238},{x:0.7306779661016949, y:1.2940677966101695},{x:0.7332203389830508, y:1.3101694915254238},{x:0.7349152542372881, y:1.3398305084745763},{x:0.7408474576271187, y:1.3576271186440678},{x:0.7561016949152543, y:1.3635593220338984},{x:0.7891525423728813, y:1.3644067796610169},{x:0.813728813559322, y:1.3635593220338984},{x:0.8222033898305084, y:1.361864406779661},{x:0.8315254237288136, y:1.3677966101694916},{x:0.84, y:1.3805084745762712},{x:0.8416949152542373, y:1.402542372881356},{x:0.8391525423728814, y:1.4296610169491526},{x:0.8416949152542373, y:1.4542372881355932},{x:0.8374576271186441, y:1.4915254237288136})
);
mosquitosPositionsPhase9 = new Array(
  new Array({x:0.8094237288135593, y:1.5180593220338983},{x:0.8280677966101695, y:1.5417881355932204},{x:0.8594237288135593, y:1.5553474576271187},{x:0.8797627118644068, y:1.5409406779661017},{x:0.8848474576271186, y:1.5265338983050847},{x:0.8772203389830509, y:1.5070423728813558},{x:0.8577288135593221, y:1.4909406779661016}),
  new Array({x:0.8678983050847457, y:1.5392457627118643},{x:0.8755254237288136, y:1.525686440677966},{x:0.8551864406779661, y:1.5146694915254237},{x:0.8365423728813559, y:1.5146694915254237},{x:0.8246779661016949, y:1.528228813559322},{x:0.8153559322033899, y:1.5375508474576272},{x:0.8034915254237288, y:1.5248389830508473},{x:0.8085762711864407, y:1.497720338983051},{x:0.831457627118644, y:1.490093220338983},{x:0.8560338983050847, y:1.5028050847457626}),
  new Array({x:0.8450169491525423, y:1.4841610169491526},{x:0.8560338983050847, y:1.5019576271186441},{x:0.8662033898305085, y:1.5214491525423728},{x:0.8670508474576271, y:1.535008474576271},{x:0.8509491525423729, y:1.5417881355932204},{x:0.8272203389830508, y:1.5358559322033898},{x:0.807728813559322, y:1.520601694915254},{x:0.810271186440678, y:1.5045},{x:0.8331525423728814, y:1.5028050847457626},{x:0.8509491525423729, y:1.5155169491525424},{x:0.8738305084745762, y:1.5129745762711864},{x:0.8704406779661017, y:1.5002627118644067},{x:0.8551864406779661, y:1.4917881355932203},{x:0.8433220338983051, y:1.483313559322034})
);
mosquitosPositionsPhase10 = new Array(
  new Array({x:0.8366101694915254, y:1.5186440677966102},{x:0.8467796610169491, y:1.5245762711864406},{x:0.8442372881355933, y:1.5440677966101695},{x:0.8416949152542373, y:1.5805084745762712},{x:0.8383050847457627, y:1.611864406779661},{x:0.8442372881355933, y:1.6372881355932203},{x:0.8416949152542373, y:1.6584745762711866},{x:0.8459322033898306, y:1.685593220338983},{x:0.8450847457627119, y:1.7110169491525424},{x:0.8442372881355933, y:1.7296610169491526},{x:0.8416949152542373, y:1.756779661016949},{x:0.8391525423728814, y:1.7754237288135593},{x:0.8467796610169491, y:1.7932203389830508},{x:0.8467796610169491, y:1.8059322033898304},{x:0.8467796610169491, y:1.8220338983050848},{x:0.8450847457627119, y:1.8491525423728814},{x:0.8425423728813559, y:1.8661016949152542},{x:0.8433898305084746, y:1.8822033898305084},{x:0.8442372881355933, y:1.8949152542372882},{x:0.84, y:1.9059322033898305},{x:0.828135593220339, y:1.911864406779661},{x:0.813728813559322, y:1.9127118644067798},{x:0.7976271186440678, y:1.914406779661017},{x:0.7849152542372881, y:1.9211864406779662},{x:0.7789830508474577, y:1.935593220338983},{x:0.7772881355932203, y:1.952542372881356},{x:0.7798305084745762, y:2.006779661016949},{x:0.7747457627118645, y:2.0830508474576273},{x:0.7772881355932203, y:2.1186440677966103},{x:0.7764406779661017, y:2.136440677966102},{x:0.7645762711864407, y:2.1449152542372882},{x:0.7450847457627119, y:2.147457627118644},{x:0.7349152542372881, y:2.1449152542372882},{x:0.7306779661016949, y:2.1389830508474574},{x:0.7222033898305085, y:2.1508474576271186},{x:0.718813559322034, y:2.1372881355932205},{x:0.7120338983050848, y:2.152542372881356},{x:0.7077966101694916, y:2.1389830508474574},{x:0.7010169491525424, y:2.1508474576271186},{x:0.6959322033898305, y:2.1372881355932205},{x:0.6900000000000001, y:2.1533898305084747},{x:0.6857627118644067, y:2.136440677966102},{x:0.680677966101695, y:2.1508474576271186},{x:0.6764406779661017, y:2.136440677966102},{x:0.6679661016949152, y:2.152542372881356},{x:0.6645762711864407, y:2.1372881355932205},{x:0.6535593220338983, y:2.145762711864407},{x:0.6332203389830509, y:2.1466101694915256},{x:0.6188135593220339, y:2.143220338983051},{x:0.6120338983050848, y:2.1296610169491523},{x:0.6120338983050848, y:2.1161016949152542},{x:0.601864406779661, y:2.0966101694915253},{x:0.5942372881355933, y:2.090677966101695})
);
mosquitosPositionsPhase11 = new Array(
  new Array({x:0.5823050847457627, y:2.1045000000000003},{x:0.5662033898305084, y:2.100262711864407},{x:0.5670508474576271, y:2.092635593220339},{x:0.5873898305084746, y:2.0867033898305087},{x:0.6145084745762712, y:2.076533898305085},{x:0.6331525423728813, y:2.0748389830508476},{x:0.636542372881356, y:2.08585593220339},{x:0.6212881355932203, y:2.097720338983051},{x:0.5916271186440678, y:2.102805084745763})
);
mosquitosPositionsPhase12 = new Array(
  new Array({x:0.5983898305084746, y:2.0940677966101693},{x:0.609406779661017, y:2.1008474576271188},{x:0.6195762711864407, y:2.1203389830508477},{x:0.6195762711864407, y:2.133050847457627},{x:0.6255084745762712, y:2.1440677966101696},{x:0.645, y:2.145762711864407},{x:0.6627966101694915, y:2.1491525423728812},{x:0.6636440677966102, y:2.1652542372881354},{x:0.6602542372881356, y:2.1847457627118643},{x:0.6526271186440679, y:2.2059322033898305},{x:0.6348305084745763, y:2.2101694915254235},{x:0.6034745762711865, y:2.2101694915254235},{x:0.5560169491525424, y:2.2093220338983053},{x:0.5195762711864407, y:2.2127118644067796},{x:0.4814406779661017, y:2.2127118644067796},{x:0.43991525423728817, y:2.211016949152542},{x:0.4161864406779662, y:2.2067796610169492},{x:0.4043220338983051, y:2.1991525423728815},{x:0.39754237288135597, y:2.18135593220339},{x:0.39754237288135597, y:2.1542372881355933},{x:0.4000847457627119, y:2.1271186440677967},{x:0.4000847457627119, y:2.110169491525424},{x:0.3856779661016949, y:2.102542372881356},{x:0.3729661016949153, y:2.1110169491525426},{x:0.3687288135593221, y:2.0966101694915253},{x:0.36110169491525423, y:2.1110169491525426},{x:0.34923728813559324, y:2.0957627118644067},{x:0.34923728813559324, y:2.110169491525424},{x:0.33652542372881356, y:2.0966101694915253},{x:0.3297457627118644, y:2.1127118644067795},{x:0.32466101694915256, y:2.0966101694915253},{x:0.31703389830508477, y:2.107627118644068},{x:0.3102542372881356, y:2.102542372881356},{x:0.3043220338983051, y:2.1059322033898304},{x:0.2966949152542373, y:2.113559322033898},{x:0.29584745762711867, y:2.130508474576271},{x:0.29584745762711867, y:2.1508474576271186},{x:0.2873728813559322, y:2.161864406779661},{x:0.26533898305084747, y:2.164406779661017},{x:0.23228813559322037, y:2.164406779661017},{x:0.20940677966101695, y:2.166101694915254},{x:0.17550847457627122, y:2.1677966101694914},{x:0.13737288135593223, y:2.164406779661017},{x:0.10432203389830509, y:2.166101694915254},{x:0.08483050847457628, y:2.16864406779661},{x:0.0755084745762712, y:2.1847457627118643},{x:0.0755084745762712, y:2.2059322033898305},{x:0.0755084745762712, y:2.2288135593220337},{x:0.07381355932203391, y:2.2550847457627117},{x:0.07381355932203391, y:2.2779661016949153},{x:0.0755084745762712, y:2.292372881355932},{x:0.07296610169491526, y:2.3194915254237287})
);
mosquitosPositionsPhase13 = new Array(
  new Array({x:0.05433898305084746, y:2.3697542372881357},{x:0.053491525423728814, y:2.412127118644068},{x:0.0687457627118644, y:2.430771186440678},{x:0.08484745762711865, y:2.4282288135593224},{x:0.09162711864406779, y:2.401110169491526},{x:0.0899322033898305, y:2.372296610169492},{x:0.07383050847457627, y:2.339245762711865},{x:0.06450847457627118, y:2.318906779661017},{x:0.06027118644067797, y:2.347720338983051}),
  new Array({x:0.06959322033898305, y:2.345177966101695},{x:0.08230508474576272, y:2.3578898305084746},{x:0.08654237288135593, y:2.3824661016949156},{x:0.07298305084745763, y:2.397720338983051},{x:0.06027118644067797, y:2.410432203389831},{x:0.053491525423728814, y:2.4222966101694916},{x:0.06959322033898305, y:2.437550847457627},{x:0.08315254237288136, y:2.43585593220339},{x:0.08738983050847457, y:2.4282288135593224},{x:0.08823728813559321, y:2.410432203389831})
);
mosquitosPositionsPhase14 = new Array(
  new Array({x:0.07474576271186441, y:2.3254237288135595},{x:0.0916949152542373, y:2.3254237288135595},{x:0.11118644067796611, y:2.321186440677966},{x:0.1188135593220339, y:2.321186440677966},{x:0.1264406779661017, y:2.3228813559322035},{x:0.12983050847457628, y:2.3271186440677964},{x:0.12983050847457628, y:2.3347457627118646},{x:0.12898305084745765, y:2.3483050847457627},{x:0.12305084745762711, y:2.3703389830508477})
);
mosquitosPositionsPhase15 = new Array(
  new Array({x:0.1297627118644068, y:2.3629745762711867},{x:0.11959322033898305, y:2.371449152542373},{x:0.1128135593220339, y:2.3892457627118646},{x:0.11620338983050847, y:2.4222966101694916},{x:0.11620338983050847, y:2.443483050847458},{x:0.10942372881355932, y:2.4646694915254237},{x:0.11620338983050847, y:2.4900932203389834},{x:0.13145762711864406, y:2.497720338983051},{x:0.14416949152542374, y:2.4782288135593222},{x:0.1373898305084746, y:2.455347457627119}),
  new Array({x:0.14077966101694916, y:2.49856779661017},{x:0.12044067796610168, y:2.488398305084746},{x:0.11535593220338984, y:2.4799237288135596},{x:0.12467796610169492, y:2.462127118644068},{x:0.13908474576271185, y:2.457042372881356},{x:0.14332203389830506, y:2.4417881355932205},{x:0.134, y:2.4189067796610173},{x:0.11450847457627118, y:2.407889830508475},{x:0.11027118644067797, y:2.38585593220339},{x:0.11874576271186442, y:2.372296610169492})
);
mosquitosPositionsPhase16 = new Array(
  new Array({x:0.12728813559322033, y:2.4491525423728815},{x:0.1306779661016949, y:2.4601694915254235},{x:0.1306779661016949, y:2.471186440677966},{x:0.1264406779661017, y:2.4966101694915253},{x:0.12983050847457628, y:2.5144067796610168},{x:0.12050847457627119, y:2.522881355932203},{x:0.12898305084745765, y:2.5271186440677966},{x:0.12220338983050848, y:2.5313559322033896},{x:0.12898305084745765, y:2.533050847457627},{x:0.12050847457627119, y:2.538135593220339},{x:0.12983050847457628, y:2.5406779661016947},{x:0.12305084745762711, y:2.545762711864407},{x:0.12983050847457628, y:2.549152542372881},{x:0.1188135593220339, y:2.5542372881355933},{x:0.12983050847457628, y:2.5567796610169493},{x:0.1247457627118644, y:2.5601694915254236},{x:0.12898305084745765, y:2.5635593220338984},{x:0.12898305084745765, y:2.5728813559322035},{x:0.1247457627118644, y:2.577966101694915},{x:0.12135593220338982, y:2.5822033898305086},{x:0.10864406779661016, y:2.5847457627118646},{x:0.08915254237288135, y:2.585593220338983},{x:0.07135593220338983, y:2.592372881355932})
);
mosquitosPositionsPhase17 = new Array(
  new Array({x:0.06959322033898305, y:2.5917881355932204},{x:0.053491525423728814, y:2.568906779661017},{x:0.05264406779661017, y:2.5443305084745766},{x:0.06535593220338982, y:2.5324661016949155},{x:0.08654237288135593, y:2.5468728813559323},{x:0.0856949152542373, y:2.5706016949152546},{x:0.0687457627118644, y:2.589245762711865},{x:0.059423728813559326, y:2.616364406779661},{x:0.05603389830508475, y:2.6485677966101697},{x:0.07298305084745763, y:2.6689067796610173},{x:0.08315254237288136, y:2.657889830508475},{x:0.08484745762711865, y:2.6400932203389833},{x:0.08230508474576272, y:2.629076271186441},{x:0.06620338983050847, y:2.614669491525424},{x:0.0628135593220339, y:2.5841610169491527}),
  new Array({x:0.05772881355932204, y:2.5706016949152546},{x:0.05772881355932204, y:2.5917881355932204},{x:0.07298305084745763, y:2.6112796610169493},{x:0.084, y:2.6273813559322035},{x:0.08484745762711865, y:2.6528050847457627},{x:0.07891525423728814, y:2.6689067796610173},{x:0.061118644067796615, y:2.661279661016949},{x:0.05772881355932204, y:2.6417881355932207},{x:0.0780677966101695, y:2.6138220338983054},{x:0.07467796610169491, y:2.595177966101695},{x:0.05857627118644068, y:2.580771186440678},{x:0.0551864406779661, y:2.562127118644068},{x:0.0551864406779661, y:2.5417881355932206},{x:0.07213559322033898, y:2.5350084745762715},{x:0.08484745762711865, y:2.5494152542372883},{x:0.07383050847457627, y:2.5756864406779663},{x:0.07383050847457627, y:2.621449152542373},{x:0.07976271186440678, y:2.6333135593220343})
);
mosquitosPositionsPhase18 = new Array(
  //new Array({x:0.07298305084745763, y:2.6553474576271188},{x:0.07298305084745763, y:2.6706016949152542},{x:0.06450847457627118, y:2.6917881355932205},{x:0.07467796610169491, y:2.6985677966101695},{x:0.06450847457627118, y:2.7036525423728817}, {x:0.06789830508474576, y:2.7606016949152543},{x:0.07976271186440678, y:2.768228813559322},{x:0.1051864406779661, y:2.768228813559322},{x:0.13061016949152543, y:2.768228813559322},{x:0.1509491525423729, y:2.781618644067797},{x:0.15264406779661016, y:2.7960254237288136},{x:0.1534915254237288, y:2.8155169491525425},{x:0.15433898305084748, y:2.845177966101695},{x:0.16027118644067795, y:2.8587372881355932},{x:0.1763728813559322, y:2.8512796610169493},{x:0.18315254237288137, y:2.8478898305084746},{x:0.18654237288135594, y:2.8555169491525427},{x:0.19077966101694915, y:2.8478898305084746},{x:0.19671186440677968, y:2.8538220338983054},{x:0.2009491525423729, y:2.845347457627119},{x:0.20688135593220341, y:2.854669491525424},{x:0.210271186440678, y:2.8445000000000003},{x:0.2145084745762712, y:2.854669491525424},{x:0.21959322033898304, y:2.8445000000000003},{x:0.22467796610169494, y:2.8438220338983054},{x:0.22806779661016952, y:2.8436525423728816},{x:0.2306101694915254, y:2.8504322033898306},{x:0.24925423728813556, y:2.8604322033898306},{x:0.281457627118644, y:2.8504322033898306},{x:0.34671186440677965, y:2.8512796610169493},{x:0.38908474576271185, y:2.8504322033898306},{x:0.4034915254237288, y:2.8487372881355932},{x:0.40603389830508474, y:2.845347457627119},{x:0.4111186440677966, y:2.856364406779661},{x:0.4162033898305085, y:2.855347457627119},{x:0.41874576271186437, y:2.8504322033898306},{x:0.4263728813559322, y:2.852805084745763},{x:0.42806779661016947, y:2.8504322033898306},{x:0.43145762711864405, y:2.8436525423728816},{x:0.434, y:2.8529745762711867},{x:0.434, y:2.8461949152542376},{x:0.4416271186440678, y:2.856364406779661},{x:0.44501694915254236, y:2.845347457627119},{x:0.4501016949152542, y:2.8512796610169493},{x:0.4636610169491525, y:2.8504322033898306},{x:0.484, y:2.8504322033898306},{x:0.49416949152542367, y:2.8680593220338984},{x:0.4975593220338983, y:2.8875508474576272},{x:0.4975593220338983, y:2.9256864406779663},{x:0.4967118644067796, y:2.952805084745763},{x:0.4975593220338983, y:2.9807711864406783}, {x:0.48484745762711867, y:3.0036525423728815},{x:0.4628135593220339, y:3.0129745762711866},{x:0.4424745762711864, y:3.0138220338983053},{x:0.4323050847457627, y:3.0180593220338983},{x:0.42722033898305084, y:3.0290762711864407},{x:0.4263728813559322, y:3.0629745762711864},{x:0.4297627118644068, y:3.1011101694915255},{x:0.42383050847457626, y:3.1138220338983054},{x:0.38569491525423727, y:3.1180593220338984},{x:0.3568813559322034, y:3.1172118644067797},{x:0.345864406779661, y:3.1087372881355932},{x:0.345864406779661, y:3.095177966101695},{x:0.34332203389830507, y:3.0231440677966104})
  new Array({x:0.06457627118644067, y:2.613559322033898},{x:0.07135593220338983, y:2.6186440677966103},{x:0.07135593220338983, y:2.6279661016949154},{x:0.0705084745762712, y:2.6449152542372882},{x:0.06711864406779662, y:2.6627118644067798},{x:0.06881355932203391, y:2.6847457627118643},{x:0.06372881355932204, y:2.6940677966101694},{x:0.07305084745762712, y:2.6966101694915254},{x:0.06542372881355933, y:2.702542372881356},{x:0.07389830508474575, y:2.705084745762712},{x:0.06542372881355933, y:2.7093220338983053},{x:0.07559322033898304, y:2.7127118644067796},{x:0.06711864406779662, y:2.7194915254237286},{x:0.07559322033898304, y:2.721186440677966},{x:0.06796610169491525, y:2.7254237288135594},{x:0.07559322033898304, y:2.727966101694915},{x:0.06881355932203391, y:2.733050847457627},{x:0.06966101694915254, y:2.7491525423728813},{x:0.0705084745762712, y:2.7584745762711864},{x:0.07559322033898304, y:2.76864406779661},{x:0.08322033898305085, y:2.773728813559322},{x:0.0976271186440678, y:2.7745762711864406},{x:0.11203389830508474, y:2.7745762711864406},{x:0.1306779661016949, y:2.7745762711864406},{x:0.14508474576271185, y:2.776271186440678},{x:0.15101694915254238, y:2.7822033898305083},{x:0.15610169491525427, y:2.7915254237288134},{x:0.15610169491525427, y:2.8033898305084746},{x:0.1552542372881356, y:2.843220338983051},{x:0.16033898305084748, y:2.8550847457627118},{x:0.16796610169491527, y:2.859322033898305},{x:0.178135593220339, y:2.859322033898305},{x:0.18915254237288137, y:2.8627118644067795},{x:0.1942372881355932, y:2.8550847457627118},{x:0.19593220338983053, y:2.8627118644067795},{x:0.19847457627118648, y:2.8559322033898304},{x:0.20355932203389832, y:2.863559322033898},{x:0.20610169491525426, y:2.8559322033898304},{x:0.2111864406779661, y:2.8627118644067795},{x:0.21203389830508473, y:2.8550847457627118},{x:0.21796610169491526, y:2.864406779661017},{x:0.2188135593220339, y:2.8550847457627118},{x:0.22474576271186442, y:2.8627118644067795},{x:0.22644067796610173, y:2.8559322033898304},{x:0.23152542372881357, y:2.8610169491525426},{x:0.23406779661016952, y:2.8559322033898304},{x:0.24084745762711868, y:2.8584745762711865},{x:0.25440677966101694, y:2.860169491525424},{x:0.27728813559322035, y:2.861864406779661},{x:0.30779661016949156, y:2.861864406779661},{x:0.3340677966101695, y:2.861864406779661},{x:0.36203389830508476, y:2.861864406779661},{x:0.3840677966101695, y:2.860169491525424},{x:0.4010169491525424, y:2.856779661016949},{x:0.4094915254237288, y:2.863559322033898},{x:0.41118644067796617, y:2.8550847457627118},{x:0.4179661016949152, y:2.863559322033898},{x:0.42050847457627116, y:2.8550847457627118},{x:0.42559322033898306, y:2.8627118644067795},{x:0.42983050847457627, y:2.854237288135593},{x:0.4323728813559322, y:2.864406779661017},{x:0.4383050847457627, y:2.8559322033898304},{x:0.4416949152542373, y:2.8652542372881356},{x:0.44593220338983053, y:2.856779661016949},{x:0.45525423728813563, y:2.860169491525424},{x:0.4755932203389831, y:2.861864406779661},{x:0.48745762711864404, y:2.861864406779661},{x:0.49254237288135594, y:2.864406779661017},{x:0.4984745762711864, y:2.8728813559322033},{x:0.5001694915254238, y:2.885593220338983},{x:0.5001694915254238, y:2.9042372881355933},{x:0.5001694915254238, y:2.928813559322034},{x:0.5001694915254238, y:2.957627118644068},{x:0.4984745762711864, y:2.964406779661017},{x:0.501864406779661, y:2.9822033898305085},{x:0.5010169491525424, y:2.9949152542372883},{x:0.4942372881355932, y:3.009322033898305},{x:0.48830508474576273, y:3.016949152542373},{x:0.47305084745762715, y:3.0152542372881355},{x:0.45864406779661016, y:3.01271186440678},{x:0.4476271186440678, y:3.0152542372881355},{x:0.44000000000000006, y:3.01864406779661},{x:0.43576271186440674, y:3.023728813559322},{x:0.42983050847457627, y:3.0338983050847457},{x:0.43067796610169495, y:3.0466101694915255},{x:0.43152542372881353, y:3.066949152542373},{x:0.43152542372881353, y:3.0864406779661016},{x:0.4323728813559322, y:3.1016949152542375},{x:0.4289830508474577, y:3.1110169491525426},{x:0.42135593220338985, y:3.116949152542373},{x:0.4052542372881356, y:3.119491525423729},{x:0.3823728813559322, y:3.119491525423729},{x:0.36542372881355933, y:3.1177966101694916},{x:0.35610169491525423, y:3.113559322033898},{x:0.351864406779661, y:3.102542372881356},{x:0.3510169491525424, y:3.0889830508474576},{x:0.3493220338983051, y:3.0754237288135595},{x:0.3467796610169492, y:3.0627118644067797},{x:0.34, y:3.0338983050847457})
);
mosquitosPositionsPhase19 = new Array(
  new Array({x:0.3475593220338983, y:3.0248389830508478},{x:0.3306101694915254, y:3.0468728813559323},{x:0.3051864406779661, y:3.0299237288135594},{x:0.30433898305084744, y:2.9994152542372885},{x:0.3068813559322034, y:2.9604322033898307},{x:0.32976271186440675, y:2.9350084745762715},{x:0.35942372881355933, y:2.942635593220339},{x:0.38145762711864406, y:2.9612796610169494},{x:0.37213559322033896, y:2.976533898305085},{x:0.3450169491525424, y:2.983313559322034},{x:0.3407796610169491, y:3.0002627118644067},{x:0.3704406779661017, y:3.0155169491525426},{x:0.3780677966101695, y:3.040940677966102},{x:0.3492542372881356, y:3.0519576271186444}), 
  new Array({x:0.3789152542372881, y:2.9392457627118644},{x:0.3823050847457627, y:2.9629745762711868},{x:0.3611186440677966, y:2.9731440677966106},{x:0.32552542372881355, y:2.9841610169491526},{x:0.30857627118644065, y:3.002805084745763},{x:0.3323050847457627, y:3.0138220338983053},{x:0.3662033898305085, y:3.0231440677966104},{x:0.38061016949152543, y:3.045177966101695},{x:0.35264406779661017, y:3.059584745762712},{x:0.3094237288135593, y:3.0485677966101696},{x:0.3153559322033898, y:3.0163644067796613},{x:0.33823728813559323, y:2.995177966101695},{x:0.3662033898305085, y:2.988398305084746},{x:0.35264406779661017, y:2.9646694915254237},{x:0.3170508474576271, y:2.9485677966101695},{x:0.3365423728813559, y:2.9341610169491528},{x:0.3653559322033898, y:2.9392457627118644})
);
mosquitosPositionsPhase20 = new Array(
  new Array({x:0.06457627118644067, y:2.613559322033898},{x:0.07135593220338983, y:2.6186440677966103},{x:0.07135593220338983, y:2.6279661016949154},{x:0.0705084745762712, y:2.6449152542372882},{x:0.06711864406779662, y:2.6627118644067798},{x:0.06881355932203391, y:2.6847457627118643},{x:0.06372881355932204, y:2.6940677966101694},{x:0.07305084745762712, y:2.6966101694915254},{x:0.06542372881355933, y:2.702542372881356},{x:0.07389830508474575, y:2.705084745762712},{x:0.06542372881355933, y:2.7093220338983053},{x:0.07559322033898304, y:2.7127118644067796},{x:0.06711864406779662, y:2.7194915254237286},{x:0.07559322033898304, y:2.721186440677966},{x:0.06796610169491525, y:2.7254237288135594},{x:0.07559322033898304, y:2.727966101694915},{x:0.06881355932203391, y:2.733050847457627},{x:0.06966101694915254, y:2.7491525423728813},{x:0.0705084745762712, y:2.7584745762711864},{x:0.07559322033898304, y:2.76864406779661},{x:0.08322033898305085, y:2.773728813559322},{x:0.0976271186440678, y:2.7745762711864406},{x:0.11203389830508474, y:2.7745762711864406},{x:0.1306779661016949, y:2.7745762711864406},{x:0.14508474576271185, y:2.776271186440678},{x:0.15101694915254238, y:2.7822033898305083},{x:0.15610169491525427, y:2.7915254237288134},{x:0.15610169491525427, y:2.8033898305084746},{x:0.1552542372881356, y:2.843220338983051},{x:0.16033898305084748, y:2.8550847457627118},{x:0.16796610169491527, y:2.859322033898305},{x:0.178135593220339, y:2.859322033898305},{x:0.18915254237288137, y:2.8627118644067795},{x:0.1942372881355932, y:2.8550847457627118},{x:0.19593220338983053, y:2.8627118644067795},{x:0.19847457627118648, y:2.8559322033898304},{x:0.20355932203389832, y:2.863559322033898},{x:0.20610169491525426, y:2.8559322033898304},{x:0.2111864406779661, y:2.8627118644067795},{x:0.21203389830508473, y:2.8550847457627118},{x:0.21796610169491526, y:2.864406779661017},{x:0.2188135593220339, y:2.8550847457627118},{x:0.22474576271186442, y:2.8627118644067795},{x:0.22644067796610173, y:2.8559322033898304},{x:0.23152542372881357, y:2.8610169491525426},{x:0.23406779661016952, y:2.8559322033898304},{x:0.24084745762711868, y:2.8584745762711865},{x:0.25440677966101694, y:2.860169491525424},{x:0.27728813559322035, y:2.861864406779661},{x:0.30779661016949156, y:2.861864406779661},{x:0.3340677966101695, y:2.861864406779661},{x:0.36203389830508476, y:2.861864406779661},{x:0.3840677966101695, y:2.860169491525424},{x:0.4010169491525424, y:2.856779661016949},{x:0.4094915254237288, y:2.863559322033898},{x:0.41118644067796617, y:2.8550847457627118},{x:0.4179661016949152, y:2.863559322033898},{x:0.42050847457627116, y:2.8550847457627118},{x:0.42559322033898306, y:2.8627118644067795},{x:0.42983050847457627, y:2.854237288135593},{x:0.4323728813559322, y:2.864406779661017},{x:0.4383050847457627, y:2.8559322033898304},{x:0.4416949152542373, y:2.8652542372881356},{x:0.44593220338983053, y:2.856779661016949},{x:0.45525423728813563, y:2.860169491525424},{x:0.4755932203389831, y:2.861864406779661},{x:0.48745762711864404, y:2.861864406779661},{x:0.49254237288135594, y:2.864406779661017},{x:0.4984745762711864, y:2.8728813559322033},{x:0.5001694915254238, y:2.885593220338983},{x:0.5001694915254238, y:2.9042372881355933},{x:0.5001694915254238, y:2.928813559322034},{x:0.5001694915254238, y:2.957627118644068},{x:0.4984745762711864, y:2.964406779661017},{x:0.501864406779661, y:2.9822033898305085},{x:0.5010169491525424, y:2.9949152542372883},{x:0.5086440677966102, y:3.01271186440678},{x:0.5154237288135594, y:3.0177966101694915},{x:0.5340677966101695, y:3.0144067796610168},{x:0.5476271186440678, y:3.011864406779661},{x:0.5594915254237288, y:3.016101694915254},{x:0.5688135593220339, y:3.022033898305085},{x:0.5722033898305084, y:3.0338983050847457},{x:0.5722033898305084, y:3.049152542372881},{x:0.5713559322033899, y:3.0728813559322035},{x:0.5713559322033899, y:3.0898305084745763},{x:0.5713559322033899, y:3.1059322033898304},{x:0.5755932203389831, y:3.1127118644067795},{x:0.5849152542372882, y:3.1177966101694916},{x:0.6027118644067797, y:3.119491525423729},{x:0.6230508474576272, y:3.119491525423729},{x:0.6450847457627119, y:3.1152542372881356},{x:0.6501694915254237, y:3.107627118644068},{x:0.6501694915254237, y:3.1},{x:0.6552542372881356, y:3.0754237288135595},{x:0.6569491525423728, y:3.057627118644068},{x:0.6586440677966102, y:3.023728813559322})
);
mosquitosPositionsPhase21 = new Array(
  new Array({x:0.6314576271186441, y:3.047720338983051},{x:0.6645084745762712, y:3.0511101694915257},{x:0.6856949152542373, y:3.0426355932203393},{x:0.6882372881355933, y:3.0155169491525426},{x:0.6678983050847458, y:2.9900932203389834},{x:0.6712881355932203, y:2.968906779661017},{x:0.6814576271186441, y:2.950262711864407},{x:0.6670508474576271, y:2.9341610169491528},{x:0.6382372881355932, y:2.936703389830509},{x:0.6390847457627119, y:2.950262711864407},{x:0.6102711864406779, y:2.962127118644068},{x:0.6077288135593221, y:2.98585593220339},{x:0.6297627118644068, y:3.001957627118644},{x:0.6153559322033898, y:3.030771186440678},{x:0.6255254237288136, y:3.0545}),
  new Array({x:0.6526440677966101, y:2.9290762711864406},{x:0.669593220338983, y:2.937550847457627},{x:0.6738305084745763, y:2.9672118644067798},{x:0.6585762711864407, y:2.976533898305085},{x:0.6289152542372881, y:2.9934830508474577},{x:0.6128135593220339, y:3.0087372881355936},{x:0.6102711864406779, y:3.0367033898305085},{x:0.6263728813559322, y:3.050262711864407},{x:0.6534915254237288, y:3.0536525423728813},{x:0.669593220338983, y:3.0417881355932206},{x:0.6755254237288135, y:3.0248389830508478},{x:0.6534915254237288, y:3.0061949152542375},{x:0.6229830508474576, y:2.9867033898305086},{x:0.6162033898305085, y:2.9587372881355933},{x:0.6534915254237288, y:2.943483050847458},{x:0.6543389830508475, y:2.936703389830509})
);
var pregnantSelected = false;
var nonPregnantSelected = false;
/**************************************
        Animations
**************************************/
var canvas, canvas2, canvas3, canvas4, canvas5, context, context2, context3, context4, context5;
var mosquitosArray = new Array()
var totalMosquitos = 100;
var stopMain = false;
var currentMosquitoPhase = 0;
var currentPhase = 0;
var mosquitosLeft = totalMosquitos;
var pregnantMosquitos = 0;
var leftCoverGlass, rightCoverGlass, leftCoverGlassHover, rightCoverGlassHover;
var hoverBehaviorImages = new Array("icon1_hover.png","icon2_hover.png","icon3_hover.png","icon4_hover.png","icon5_hover.png","icon6_hover.png","icon7_hover.png","icon8_hover.png","icon9_hover.png");
var behaviorImages = new Array("icon1.png","icon2.png","icon3.png","icon4.png","icon5.png","icon6.png","icon7.png","icon8.png","icon9.png");
/**
  The canvasImage class represents an element drawn on the canvas.
 
  @class CanvasImage
  @constructor
*/
function CanvasImage(img, x, y, angle, speed, type, currentImage, positionsArray) {
  this.image = img;
  this.x = x;
  this.y = y;
  this.xAmount = 0;
  this.yAmount = 0;
  this.width = img.width;
  this.height = img.height;
  this.position = 1;
  this.angle = angle;
  this.speed = speed;
  this.type = type;
  this.currentImage = currentImage;
  this.firstTime = false;
  this.currentPosition = 0;
  this.positionsArray = positionsArray;
  this.currentMosquitoPhase = 0;
  this.flippedImages = new Array();
  return this;
}
//Setup request animation frame
var requestAnimationFrame = function(time) {
  if (!stopMain) {
    main(time);
  }
  
  window.requestAnimationFrame(requestAnimationFrame);
}
var requestAnimationFrameInitialization = function(){
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                 || window[vendors[x]+'CancelRequestAnimationFrame'];
  }
 
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); },
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
  }
 
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
}
//Setup main loop
var setupMainLoop = function(){
  requestAnimationFrameInitialization();
    setTimeout(function() {
      window.requestAnimationFrame(requestAnimationFrame);
      currentPhase = 1;
      $('#pgStep1 .pg-button').removeAttr("disabled");
    }, 3000);
}
//Execute main loop
var main = function(time){
  context5.clearRect(0, 0, context5.canvas.width, context5.canvas.height);
  /*switch (leftCoverGlass.currentMosquitoPhase) {
    case 0:*/
      var leftGlassControlHover = false;
      if (((leftCoverGlassHover.x > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x &&
            leftCoverGlassHover.xDir) || (leftCoverGlassHover.x < leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x &&
            !leftCoverGlassHover.xDir) || (leftCoverGlassHover.x == leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x)) && 
           ((leftCoverGlassHover.y > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y &&
            leftCoverGlassHover.yDir) || (leftCoverGlassHover.y < leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y &&
            !leftCoverGlassHover.yDir) || (leftCoverGlassHover.y == leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y))) {

        leftCoverGlassHover.currentPosition = leftCoverGlassHover.currentPosition + 1;
          if (leftCoverGlassHover.currentPosition >= leftCoverGlassHover.positionsArray.length) {
            leftCoverGlassHover.currentPosition = leftCoverGlassHover.currentPosition - 1;
            if (currentPhase > 20) {
              leftGlassControlHover = true;
            }
            //context5.drawImage(leftCoverGlassHover.image[leftCoverGlassHover.currentImage], parseInt(leftCoverGlassHover.x * canvas3.width), parseInt(leftCoverGlassHover.y * canvas3.width), parseInt(canvas3.width * 0.113), parseInt((canvas3.width * 0.113) * (42.0/135.0)));
          }
        }
        else {
          if (leftCoverGlassHover.x > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x) {
            leftCoverGlassHover.xDir = false;
          }
          else {
            leftCoverGlassHover.xDir = true;
          }
          if (leftCoverGlassHover.y > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y) {
            leftCoverGlassHover.yDir = false;
          }
          else {
            leftCoverGlassHover.yDir = true;
          }
      }

      if (!leftGlassControlHover) {
        var xvalue = Math.abs(leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x - leftCoverGlassHover.x);
        var yvalue = Math.abs(leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y - leftCoverGlassHover.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * rightCoverGlassHover.speed;
          yAmount = rightCoverGlassHover.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * rightCoverGlassHover.speed;
          xAmount = rightCoverGlassHover.speed;
        }

        leftCoverGlassHover.x = ((leftCoverGlassHover.x > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x && leftCoverGlassHover.xDir) || (leftCoverGlassHover.x < leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x && !leftCoverGlassHover.xDir) || (leftCoverGlassHover.x == leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x)) ? leftCoverGlassHover.x : (leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x < leftCoverGlassHover.x) ? leftCoverGlassHover.x - xAmount : leftCoverGlassHover.x + xAmount;
        leftCoverGlassHover.y = ((leftCoverGlassHover.y > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y && leftCoverGlassHover.yDir) || (leftCoverGlassHover.y < leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y && !leftCoverGlassHover.yDir) || (leftCoverGlassHover.y == leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y)) ? leftCoverGlassHover.y : (leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y < leftCoverGlassHover.y) ? leftCoverGlassHover.y - yAmount : leftCoverGlassHover.y + yAmount;

        //context5.drawImage(rightCoverGlassHover.image[leftCoverGlassHover.currentImage], parseInt(leftCoverGlassHover.x * canvas3.width), parseInt(rightCoverGlassHover.y * canvas3.width), parseInt(canvas3.width * 0.113), parseInt((canvas3.width * 0.113) * (42.0/135.0)));
      }

  var rightGlassControlHover = false;
      if (((rightCoverGlassHover.x > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x &&
            rightCoverGlassHover.xDir) || (rightCoverGlassHover.x < rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x &&
            !rightCoverGlassHover.xDir) || (rightCoverGlassHover.x == rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x)) && 
           ((rightCoverGlassHover.y > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y &&
            rightCoverGlassHover.yDir) || (rightCoverGlassHover.y < rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y &&
            !rightCoverGlassHover.yDir) || (rightCoverGlassHover.y == rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y))) {

        rightCoverGlassHover.currentPosition = rightCoverGlassHover.currentPosition + 1;
          if (rightCoverGlassHover.currentPosition >= rightCoverGlassHover.positionsArray.length) {
            rightCoverGlassHover.currentPosition = rightCoverGlassHover.currentPosition - 1;
            if (currentPhase > 20) {
              rightGlassControlHover = true;
            }
            //context5.drawImage(rightCoverGlassHover.image[rightCoverGlassHover.currentImage], parseInt(rightCoverGlassHover.x * canvas3.width), parseInt(rightCoverGlassHover.y * canvas3.width), parseInt(canvas3.width * 0.113), parseInt((canvas3.width * 0.113) * (42.0/135.0)));
          }
        }
        else {
          if (rightCoverGlassHover.x > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x) {
            rightCoverGlassHover.xDir = false;
          }
          else {
            rightCoverGlassHover.xDir = true;
          }
          if (rightCoverGlassHover.y > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y) {
            rightCoverGlassHover.yDir = false;
          }
          else {
            rightCoverGlassHover.yDir = true;
          }
      }

      if (!rightGlassControlHover) {
        var xvalue = Math.abs(rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x - rightCoverGlassHover.x);
        var yvalue = Math.abs(rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y - rightCoverGlassHover.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * rightCoverGlassHover.speed;
          yAmount = rightCoverGlassHover.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * rightCoverGlassHover.speed;
          xAmount = rightCoverGlassHover.speed;
        }

        rightCoverGlassHover.x = ((rightCoverGlassHover.x > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x && rightCoverGlassHover.xDir) || (rightCoverGlassHover.x < rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x && !rightCoverGlassHover.xDir) || (rightCoverGlassHover.x == rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x)) ? rightCoverGlassHover.x : (rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x < rightCoverGlassHover.x) ? rightCoverGlassHover.x - xAmount : rightCoverGlassHover.x + xAmount;
        rightCoverGlassHover.y = ((rightCoverGlassHover.y > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y && rightCoverGlassHover.yDir) || (rightCoverGlassHover.y < rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y && !rightCoverGlassHover.yDir) || (rightCoverGlassHover.y == rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y)) ? rightCoverGlassHover.y : (rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y < rightCoverGlassHover.y) ? rightCoverGlassHover.y - yAmount : rightCoverGlassHover.y + yAmount;

        //context5.drawImage(rightCoverGlassHover.image[rightCoverGlassHover.currentImage], parseInt(rightCoverGlassHover.x * canvas3.width), parseInt(rightCoverGlassHover.y * canvas3.width), parseInt(canvas3.width * 0.113), parseInt((canvas3.width * 0.113) * (42.0/135.0)));
      }

  context3.clearRect(0, 0, context3.canvas.width, context3.canvas.height);
  /*switch (leftCoverGlass.currentMosquitoPhase) {
    case 0:*/
      var leftGlassControl = false;
      if (((leftCoverGlass.x > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x &&
            leftCoverGlass.xDir) || (leftCoverGlass.x < leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x &&
            !leftCoverGlass.xDir) || (leftCoverGlass.x == leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x)) && 
           ((leftCoverGlass.y > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y &&
            leftCoverGlass.yDir) || (leftCoverGlass.y < leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y &&
            !leftCoverGlass.yDir) || (leftCoverGlass.y == leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y))) {

        leftCoverGlass.currentPosition = leftCoverGlass.currentPosition + 1;
          if (leftCoverGlass.currentPosition >= leftCoverGlass.positionsArray.length) {
            leftCoverGlass.currentPosition = leftCoverGlass.currentPosition - 1;
            if (currentPhase > 20) {
              leftGlassControl = true;
            }
            context3.drawImage(leftCoverGlass.image[leftCoverGlass.currentImage], parseInt(leftCoverGlass.x * canvas3.width), parseInt(leftCoverGlass.y * canvas3.width), parseInt(canvas3.width * 0.125), parseInt((canvas3.width * 0.125) * (224.0/149.0)));
          }
        }
        else {
          if (leftCoverGlass.x > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x) {
            leftCoverGlass.xDir = false;
          }
          else {
            leftCoverGlass.xDir = true;
          }
          if (leftCoverGlass.y > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y) {
            leftCoverGlass.yDir = false;
          }
          else {
            leftCoverGlass.yDir = true;
          }
      }

      if (!leftGlassControl) {
        var xvalue = Math.abs(leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x - leftCoverGlass.x);
        var yvalue = Math.abs(leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y - leftCoverGlass.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * leftCoverGlass.speed;
          yAmount = leftCoverGlass.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * leftCoverGlass.speed;
          xAmount = leftCoverGlass.speed;
        }

        leftCoverGlass.x = ((leftCoverGlass.x > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x && leftCoverGlass.xDir) || (leftCoverGlass.x < leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x && !leftCoverGlass.xDir) || (leftCoverGlass.x == leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x)) ? leftCoverGlass.x : (leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x < leftCoverGlass.x) ? leftCoverGlass.x - xAmount : leftCoverGlass.x + xAmount;
        leftCoverGlass.y = ((leftCoverGlass.y > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y && leftCoverGlass.yDir) || (leftCoverGlass.y < leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y && !leftCoverGlass.yDir) || (leftCoverGlass.y == leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y)) ? leftCoverGlass.y : (leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y < leftCoverGlass.y) ? leftCoverGlass.y - yAmount : leftCoverGlass.y + yAmount;

        context3.drawImage(leftCoverGlass.image[leftCoverGlass.currentImage], parseInt(leftCoverGlass.x * canvas3.width), parseInt(leftCoverGlass.y * canvas3.width), parseInt(canvas3.width * 0.125), parseInt((canvas3.width * 0.125) * (224.0/149.0)));
      }
    /*break;
    case 1:
    break;
    case 2:
    break;
  }*/
    var rightGlassControl = false;
      if (((rightCoverGlass.x > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x &&
            rightCoverGlass.xDir) || (rightCoverGlass.x < rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x &&
            !rightCoverGlass.xDir) || (rightCoverGlass.x == rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x)) && 
           ((rightCoverGlass.y > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y &&
            rightCoverGlass.yDir) || (rightCoverGlass.y < rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y &&
            !rightCoverGlass.yDir) || (rightCoverGlass.y == rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y))) {

        rightCoverGlass.currentPosition = rightCoverGlass.currentPosition + 1;
          if (rightCoverGlass.currentPosition >= rightCoverGlass.positionsArray.length) {
            rightCoverGlass.currentPosition = rightCoverGlass.currentPosition - 1;
            if (currentPhase > 20) {
              leftGlassControl = true;
            }
            context3.drawImage(rightCoverGlass.image[rightCoverGlass.currentImage], parseInt(rightCoverGlass.x * canvas3.width), parseInt(rightCoverGlass.y * canvas3.width), parseInt(canvas3.width * 0.125), parseInt((canvas3.width * 0.125) * (224.0/149.0)));
          }
        }
        else {
          if (rightCoverGlass.x > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x) {
            rightCoverGlass.xDir = false;
          }
          else {
            rightCoverGlass.xDir = true;
          }
          if (rightCoverGlass.y > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y) {
            rightCoverGlass.yDir = false;
          }
          else {
            rightCoverGlass.yDir = true;
          }
      }

      if (!rightGlassControl) {
        var xvalue = Math.abs(rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x - rightCoverGlass.x);
        var yvalue = Math.abs(rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y - rightCoverGlass.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * rightCoverGlass.speed;
          yAmount = rightCoverGlass.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * rightCoverGlass.speed;
          xAmount = rightCoverGlass.speed;
        }

        rightCoverGlass.x = ((rightCoverGlass.x > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x && rightCoverGlass.xDir) || (rightCoverGlass.x < rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x && !rightCoverGlass.xDir) || (rightCoverGlass.x == rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x)) ? rightCoverGlass.x : (rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x < rightCoverGlass.x) ? rightCoverGlass.x - xAmount : rightCoverGlass.x + xAmount;
        rightCoverGlass.y = ((rightCoverGlass.y > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y && rightCoverGlass.yDir) || (rightCoverGlass.y < rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y && !rightCoverGlass.yDir) || (rightCoverGlass.y == rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y)) ? rightCoverGlass.y : (rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y < rightCoverGlass.y) ? rightCoverGlass.y - yAmount : rightCoverGlass.y + yAmount;

        context3.drawImage(rightCoverGlass.image[rightCoverGlass.currentImage], parseInt(rightCoverGlass.x * canvas3.width), parseInt(rightCoverGlass.y * canvas3.width), parseInt(canvas3.width * 0.125), parseInt((canvas3.width * 0.125) * (224.0/149.0)));
      }
  // clear the canvas
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  mosquitosArray.forEach(function(element,index,array){
    switch (element.currentMosquitoPhase) {
      case 0:
      case 2:
      case 4:
      case 6:
      case 8:
      case 10:
      case 12:
      case 14:
      case 16:
      case 18:
      case 20:
      case 22:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) && 
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y))) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;
          }
          if (element.x > element.positionsArray[element.currentPosition].x) {
            element.xDir = false;
          }
          else {
            element.xDir = true;
          }
          if (element.y > element.positionsArray[element.currentPosition].y) {
            element.yDir = false;
          }
          else {
            element.yDir = true;
          }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        element.currentImage = element.currentImage + 1;
        if (element.currentImage >= element.image.length) {
          element.currentImage = 0;
        }

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        
      break;
      case 1:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;
            var auxPositionsArray = mosquitosPositionsPhase3[index%mosquitosPositionsPhase3.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.1) - 0.05) * 1.0), y: element2.y + (((Math.random() * 0.1) - 0.05) * 1.0)};
              auxElement.x = Math.max(0.086,Math.min(0.135, auxElement.x))
              auxElement.y = Math.max(0.555,Math.min(0.715, auxElement.y))
              element.positionsArray.push(auxElement);
            });

            currentPhase = 2;

            if (index == mosquitosLeft - 1) {
              $('#pgQuestion-container1 .pg-button').removeAttr("disabled");
              $('#pgQuestion-container1 select').removeAttr("disabled");
              $('#pgQuestion-container1').removeAttr("disabled");
            }

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 2;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
      case 3:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;
            var auxPositionsArray = mosquitosPositionsPhase5[index%mosquitosPositionsPhase5.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.1) - 0.05) * 1.0), y: element2.y + (((Math.random() * 0.1) - 0.05) * 1.0)};
              auxElement.x = Math.max(0.076,Math.min(0.15, auxElement.x))
              auxElement.y = Math.max(0.78,Math.min(0.86, auxElement.y))
              if (auxElement.x >= 0.13 || auxElement.x <= 0.088) {
                if (auxElement.y <= 0.78) {
                  auxElement.y = auxElement.y + 0.02;
                }
                else if (auxElement.y >= 0.82) {
                  auxElement.y = auxElement.y - 0.02;
                }
              }
              element.positionsArray.push(auxElement);
            });

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);
            //element.x = element.positionsArray[element.currentPosition].x;
            //element.y = element.positionsArray[element.currentPosition].y;

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 4;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
      case 5:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;
            
            currentPhase = 3;

            if (index == mosquitosLeft - 1) {
              $("#pgStep2 .pg-button").removeAttr("disabled");
              $("#pgStep2").removeAttr("disabled");
            }

            var auxPositionsArray = mosquitosPositionsPhase7[index%mosquitosPositionsPhase7.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.1) - 0.05) * 1.0), y: element2.y + (((Math.random() * 0.1) - 0.05) * 1.0)};
              if (auxElement.x >= 0.42 || auxElement.x <= 0.39) {
                if (auxElement.y <= 1.206610169491526) {
                  auxElement.y = 1.20;
                }
                else if (auxElement.y >= 1.28) {
                  auxElement.y = 1.28;
                }
              }
              if (auxElement.x >= 0.49) {
                  auxElement.x = 0.49
                }
                if (auxElement.x <= 0.36) {
                  auxElement.x = 0.36
                }
                if (auxElement.y >= 1.3) {
                  auxElement.y = 1.3
                }
                if (auxElement.y <= 1.19) {
                  auxElement.y = 1.19
                }
              element.positionsArray.push(auxElement);
            });

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);
            //element.x = element.positionsArray[element.currentPosition].x;
            //element.y = element.positionsArray[element.currentPosition].y;

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 6;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
      case 7:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;
            //element.positionsArray = mosquitosPositionsPhase9[index%mosquitosPositionsPhase9.length];

            if (index == mosquitosLeft - 1) {
              $('#pgQuestion-container2 .pg-button').removeAttr("disabled");
              $('#pgQuestion-container2').removeAttr("disabled");

              $('.pgQuestion__body__option').removeClass("disabled-option");
            }

            var auxPositionsArray = mosquitosPositionsPhase9[index%mosquitosPositionsPhase9.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0)};
              if (auxElement.x >= 0.885 || auxElement.x <= 0.806) {
                if (auxElement.y <= 1.487) {
                  auxElement.y = 1.487;
                }
                else if (auxElement.y >= 1.558) {
                  auxElement.y = 1.558;
                }
              }
              if (auxElement.x >= 0.898) {
                  auxElement.x = 0.898;
                }
                if (auxElement.x <= 0.79) {
                  auxElement.x = 0.79;
                }
                if (auxElement.y >= 1.57) {
                  auxElement.y = 1.57;
                }
                if (auxElement.y <= 1.47) {
                  auxElement.y = 1.47;
                }
              element.positionsArray.push(auxElement);
            });

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);
            //element.x = element.positionsArray[element.currentPosition].x;
            //element.y = element.positionsArray[element.currentPosition].y;

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 8;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
      case 9:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;
            //element.positionsArray = mosquitosPositionsPhase11[index%mosquitosPositionsPhase11.length];

            if (index == mosquitosLeft - 1) {
              $("#pgStep3 .pg-button").removeAttr("disabled");
              $("#pgStep3").removeAttr("disabled");
            }

            var auxPositionsArray = mosquitosPositionsPhase11[index%mosquitosPositionsPhase11.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.018, y: element2.y + (((Math.random() * 0.001) - 0.0005) * 1.0)};
              element.positionsArray.push(auxElement);
            });

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 10;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
      case 11:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;
            //element.positionsArray = mosquitosPositionsPhase13[index%mosquitosPositionsPhase13.length];

            if (index == mosquitosLeft - 1) {
              $(".pgQuestion__body__binary-option").removeClass("disabled-option");
              $('#pgQuestion-container3 .pg-button').removeAttr("disabled");
              $('#pgQuestion-container3').removeAttr("disabled");
            }

            var auxPositionsArray = mosquitosPositionsPhase13[index%mosquitosPositionsPhase13.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.01};
              element.positionsArray.push(auxElement);
            });

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 12;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
      case 13:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;

            var auxPositionsArray = mosquitosPositionsPhase15[index%mosquitosPositionsPhase15.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.01};
              element.positionsArray.push(auxElement);
            });

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 14;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
      case 15:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;

            var auxPositionsArray = mosquitosPositionsPhase17[index%mosquitosPositionsPhase17.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0)};
              element.positionsArray.push(auxElement);
            });

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 16;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
      case 17:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;

            var auxPositionsArray = mosquitosPositionsPhase19[index%mosquitosPositionsPhase19.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0)};
              element.positionsArray.push(auxElement);
            });

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 18;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
      case 19:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;

            var auxPositionsArray = mosquitosPositionsPhase21[index%mosquitosPositionsPhase21.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0)};
              element.positionsArray.push(auxElement);
            });

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 20;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
      case 21:
        if (((element.x > element.positionsArray[element.currentPosition].x &&
            element.xDir) || (element.x < element.positionsArray[element.currentPosition].x &&
            !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) &&  
           ((element.y > element.positionsArray[element.currentPosition].y &&
            element.yDir) || (element.y < element.positionsArray[element.currentPosition].y &&
            !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ) {
          element.currentPosition = element.currentPosition + 1;
          if (element.currentPosition >= element.positionsArray.length) {
            element.currentPosition = 0;
            // TO DO
            element.positionsArray = new Array(element.positionsArray[0],element.positionsArray[0],element.positionsArray[0],element.positionsArray[0],element.positionsArray[0], element.positionsArray[0],element.positionsArray[0],element.positionsArray[0],element.positionsArray[0],element.positionsArray[0])

            for (var i = 0; i < 20; i++) {
              element.positionsArray.push({x: element.positionsArray[0].x + ((Math.random() * 0.066) - 0.033), y: element.positionsArray[0].y + ((Math.random() * 0.066) - 0.033)});
            }

            element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);
            //element.x = element.positionsArray[element.currentPosition].x;
            //element.y = element.positionsArray[element.currentPosition].y;

            var nextPosition = element.currentPosition + 1;
            if (nextPosition >= element.positionsArray.length) {
              nextPosition = 0;
            }

            if (element.x > element.positionsArray[nextPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[nextPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }

            element.currentMosquitoPhase = 22;
            element.speed = 0.001;
          }
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
        }

        var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
        var yvalue = Math.abs(element.positionsArray[element.currentPosition].y - element.y);
        var xAmount = 0;
        var yAmount = 0;

        if (xvalue < yvalue) {
          xAmount = (xvalue / yvalue) * element.speed;
          yAmount = element.speed;
        }
        else {
          yAmount = (yvalue / xvalue) * element.speed;
          xAmount = element.speed;
        }

        element.x = ((element.x > element.positionsArray[element.currentPosition].x && element.xDir) || (element.x < element.positionsArray[element.currentPosition].x && !element.xDir) || (element.x == element.positionsArray[element.currentPosition].x)) ? element.x : (element.positionsArray[element.currentPosition].x < element.x) ? element.x - xAmount : element.x + xAmount;
        element.y = ((element.y > element.positionsArray[element.currentPosition].y && element.yDir) || (element.y < element.positionsArray[element.currentPosition].y && !element.yDir) || (element.y == element.positionsArray[element.currentPosition].y)) ? element.y : (element.positionsArray[element.currentPosition].y < element.y) ? element.y - yAmount : element.y + yAmount;

        var w = (canvas.width * 0.01) + ((Math.random() * 0.001) - 0.0005)

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width, element.y * canvas.width, w, w * ( 16.0/12.0));
        }
      break;
    }
    
  });
}
//Animate behavior elements
var animateBehaviorElements = function() {
  $(document).on("mouseenter", ".pgQuestion__body__option:not(.disabled-option)", function() {
    if (!$(this).hasClass("selected")) {
      $(this).find("img").attr("src", "http://yowlu.com/wapo/images/" + hoverBehaviorImages[$(this).attr("data-index")]);
    }
  });
  $(document).on("mouseleave", ".pgQuestion__body__option:not(.disabled-option)", function() {
    if (!$(this).hasClass("selected")) {
      $(this).find("img").attr("src", "http://yowlu.com/wapo/images/" + behaviorImages[$(this).attr("data-index")]);
    }
  });
};
//Animate pregnancy elements
var animateElementsPregnancy = function() {
  $(document).on("mouseenter", ".pgStep__pregnancy-ok", function() {
    if (currentPhase == 20) {
    if (leftCoverGlass.currentMosquitoPhase != 2) {
      leftCoverGlass.currentMosquitoPhase = 1
      leftCoverGlass.positionsArray = new Array({x:0.291,y:(3415.0/canvas3.width)}, {x:0.291,y:(3415.0/canvas3.width) - 0.005});
      leftCoverGlass.currentPosition = 0;
      if (leftCoverGlass.x > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x) {
        leftCoverGlass.xDir = false;
      }
      else {
        leftCoverGlass.xDir = true;
      }
      if (leftCoverGlass.y > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y) {
        leftCoverGlass.yDir = false;
      }
      else {
        leftCoverGlass.yDir = true;
      }

      leftCoverGlassHover.positionsArray = new Array({x:0.298,y:(3593.0/canvas3.width)}, {x:0.298,y:(3593.0/canvas3.width) - 0.005});
      leftCoverGlassHover.currentPosition = 0;
      if (leftCoverGlassHover.x > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x) {
        leftCoverGlassHover.xDir = false;
      }
      else {
        leftCoverGlassHover.xDir = true;
      }
      if (leftCoverGlassHover.y > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y) {
        leftCoverGlassHover.yDir = false;
      }
      else {
        leftCoverGlassHover.yDir = true;
      }
    }
  }
  });
  $(document).on("mouseleave", ".pgStep__pregnancy-ok", function() {
    if (currentPhase == 20) {
    if (leftCoverGlass.currentMosquitoPhase != 2) {
      leftCoverGlass.currentMosquitoPhase = 0
      leftCoverGlass.positionsArray = new Array({x:0.291,y:(3415.0/canvas3.width) - 0.005}, {x:0.291,y:(3415.0/canvas3.width)});
      leftCoverGlass.currentPosition = 0;
      if (leftCoverGlass.x > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x) {
        leftCoverGlass.xDir = false;
      }
      else {
        leftCoverGlass.xDir = true;
      }
      if (leftCoverGlass.y > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y) {
        leftCoverGlass.yDir = false;
      }
      else {
        leftCoverGlass.yDir = true;
      }

      leftCoverGlassHover.positionsArray = new Array({x:0.298,y:(3593.0/canvas3.width) - 0.005}, {x:0.298,y:(3593.0/canvas3.width)});
      leftCoverGlassHover.currentPosition = 0;
      if (leftCoverGlassHover.x > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x) {
        leftCoverGlassHover.xDir = false;
      }
      else {
        leftCoverGlassHover.xDir = true;
      }
      if (leftCoverGlassHover.y > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y) {
        leftCoverGlassHover.yDir = false;
      }
      else {
        leftCoverGlassHover.yDir = true;
      }
    }
  }
  });
  $(document).on("mouseenter", ".pgStep__pregnancy-ko", function() {
    if (currentPhase == 20) {
    if (rightCoverGlass.currentMosquitoPhase != 2) {
      rightCoverGlass.currentMosquitoPhase = 1
      rightCoverGlass.positionsArray = new Array({x:0.5975,y:(3415.0/canvas3.width)}, {x:0.5975,y:(3415.0/canvas3.width) - 0.005});
      rightCoverGlass.currentPosition = 0;
      if (rightCoverGlass.x > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x) {
        rightCoverGlass.xDir = false;
      }
      else {
        rightCoverGlass.xDir = true;
      }
      if (rightCoverGlass.y > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y) {
        rightCoverGlass.yDir = false;
      }
      else {
        rightCoverGlass.yDir = true;
      }

      rightCoverGlassHover.positionsArray = new Array({x:0.5975,y:(3593.0/canvas3.width)}, {x:0.5975,y:(3593.0/canvas3.width) - 0.005});
      rightCoverGlassHover.currentPosition = 0;
      if (rightCoverGlassHover.x > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x) {
        rightCoverGlassHover.xDir = false;
      }
      else {
        rightCoverGlassHover.xDir = true;
      }
      if (rightCoverGlassHover.y > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y) {
        rightCoverGlassHover.yDir = false;
      }
      else {
        rightCoverGlassHover.yDir = true;
      }
    }
    }
  });
  $(document).on("mouseleave", ".pgStep__pregnancy-ko", function() {
    if (currentPhase == 20) {
    if (rightCoverGlass.currentMosquitoPhase != 2) {
      rightCoverGlass.currentMosquitoPhase = 0
      rightCoverGlass.positionsArray = new Array({x:0.5975,y:(3415.0/canvas3.width) - 0.005}, {x:0.5975,y:(3415.0/canvas3.width)});
      rightCoverGlass.currentPosition = 0;
      if (rightCoverGlass.x > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x) {
        rightCoverGlass.xDir = false;
      }
      else {
        rightCoverGlass.xDir = true;
      }
      if (rightCoverGlass.y > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y) {
        rightCoverGlass.yDir = false;
      }
      else {
        rightCoverGlass.yDir = true;
      }

      rightCoverGlassHover.positionsArray = new Array({x:0.5975,y:(3593.0/canvas3.width) - 0.005}, {x:0.5975,y:(3593.0/canvas3.width)});
      rightCoverGlassHover.currentPosition = 0;
      if (rightCoverGlassHover.x > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x) {
        rightCoverGlassHover.xDir = false;
      }
      else {
        rightCoverGlassHover.xDir = true;
      }
      if (rightCoverGlassHover.y > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y) {
        rightCoverGlassHover.yDir = false;
      }
      else {
        rightCoverGlassHover.yDir = true;
      }
    }
    }
  });
}
//Setup canvas
var setupCanvas = function(){
  canvas2 = document.getElementById('elementsCanvas');
  canvas2.width = $('.pgChart').width();
  canvas2.height = $('.pgChart').height() + 0;
  canvas2.style.width  = canvas2.width.toString() + "px";
  canvas2.style.height = canvas2.height.toString() + "px";
  context2 = canvas2.getContext('2d');
  context2.imageSmoothingEnabled = false;

  canvas3 = document.getElementById('animationCanvas');
  canvas3.width = $('.pgChart').width();
  canvas3.height = $('.pgChart').height();
  canvas3.style.width  = canvas3.width.toString() + "px";
  canvas3.style.height = canvas3.height.toString() + "px";
  context3 = canvas3.getContext('2d');
  context3.imageSmoothingEnabled = false;

  canvas = document.getElementById('mosquitosCanvas');
  canvas.width = $('.pgChart').width();
  canvas.height = $('.pgChart').height();
  canvas.style.width  = canvas.width.toString() + "px";
  canvas.style.height = canvas.height.toString() + "px";
  context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;

  canvas4 = document.getElementById('hoverCanvas');
  canvas4.width = $('.pgChart').width();
  canvas4.height = $('.pgChart').height();
  canvas4.style.width  = canvas4.width.toString() + "px";
  canvas4.style.height = canvas4.height.toString() + "px";
  context4 = canvas4.getContext('2d');
  context4.imageSmoothingEnabled = false;

  canvas5 = document.getElementById('glassAnimationCanvas');
  canvas5.width = $('.pgChart').width();
  canvas5.height = $('.pgChart').height();
  canvas5.style.width  = canvas5.width.toString() + "px";
  canvas5.style.height = canvas5.height.toString() + "px";
  context5 = canvas5.getContext('2d');
  context5.imageSmoothingEnabled = false;
  
  context2.fillStyle = "#f8f8f8";
  context2.fillRect(0, getOffset($('#pgQuestion-container1')[0]).top - getOffset($(".pgArticle")[0]).top - $('#nav-bar').height(), canvas2.width, $('#pgQuestion-container1').height());
  context2.fillRect(0, getOffset($('#pgQuestion-container2')[0]).top - getOffset($(".pgArticle")[0]).top - $('#nav-bar').height(), canvas2.width, $('#pgQuestion-container2').height());
  context2.fillRect(0, getOffset($('#pgQuestion-container3')[0]).top - getOffset($(".pgArticle")[0]).top - $('#nav-bar').height(), canvas2.width, $('#pgQuestion-container3').height());

  var picture1 = new Image();
  picture1.addEventListener('load', function () {
    context2.drawImage(picture1, parseInt(canvas.width - (canvas.width * 0.55) - (canvas.width * 0.064)), 0, parseInt(canvas.width * 0.55), parseInt((canvas.width * 0.55) * (536.0/656.0)));
      var picture1Hover = new Image();
      picture1Hover.addEventListener('load', function () {
        context4.drawImage(picture1Hover, parseInt(canvas.width - (canvas.width * 0.55) - (canvas.width * 0.064)), 0, parseInt(canvas.width * 0.55), parseInt((canvas.width * 0.55) * (536.0/656.0)));
      });
      picture1Hover.src = 'http://yowlu.com/wapo/images/terrarium-hover.png';

      var tube1 = new Image();
      tube1.addEventListener('load', function () {
        context2.drawImage(tube1, parseInt(canvas.width - (canvas.width * 0.55) - (canvas.width * 0.0585) - (canvas.width * 0.36051)), 235, parseInt(canvas.width * 0.36051), parseInt((canvas.width * 0.36051) * (300.0/430.0)));
      });
      tube1.src = 'http://yowlu.com/wapo/images/tube1.png';
  });
  picture1.src = 'http://yowlu.com/wapo/images/terrarium.png';

  var tube2 = new Image();
  tube2.addEventListener('load', function () {
    context2.drawImage(tube2, parseInt(canvas.width * 0.0345), 530, parseInt(canvas.width * 0.14672), parseInt((canvas.width * 0.14672) * (622.0/175.0)));
  });
  tube2.src = 'http://yowlu.com/wapo/images/tube2.png';

  var tube3 = new Image();
  tube3.addEventListener('load', function () {
    context2.drawImage(tube3, parseInt(canvas.width * 0.0545), 1115, parseInt(canvas.width * 0.8073), parseInt((canvas.width * 0.8073) * (517.0/963.0)));
    var tube3Hover = new Image();
    tube3Hover.addEventListener('load', function () {
      context4.drawImage(tube3Hover, parseInt(canvas.width * 0.0545), 1115, parseInt(canvas.width * 0.8073), parseInt((canvas.width * 0.8073) * (517.0/963.0)));
    });
    tube3Hover.src = 'http://yowlu.com/wapo/images/tube3-hover.png';
  });
  tube3.src = 'http://yowlu.com/wapo/images/tube3.png';

  var tube5 = new Image();
  tube5.addEventListener('load', function () {
    context2.drawImage(tube5, parseInt(canvas.width - (canvas.width * 0.8015) - (canvas.width * 0.133)), 2120, parseInt(canvas.width * 0.8015), parseInt((canvas.width * 0.8015) * (510.0/956.0)));
    
    var tube5Hover = new Image();
    tube5Hover.addEventListener('load', function () {
      context4.drawImage(tube5Hover, parseInt(canvas.width - (canvas.width * 0.8015) - (canvas.width * 0.133)), 2120, parseInt(canvas.width * 0.8015), parseInt((canvas.width * 0.8015) * (510.0/956.0)));
    });
    tube5Hover.src = 'http://yowlu.com/wapo/images/tube5-hover.png';  

    var tube4 = new Image();
    tube4.addEventListener('load', function () {
      context2.drawImage(tube4, parseInt(canvas.width - (canvas.width * 0.1358) - (canvas.width * 0.08)) - 3, 1618, parseInt(canvas.width * 0.1358), parseInt((canvas.width * 0.1358) * (600.0/162.0)));
      var tube4Hover = new Image();
      tube4Hover.addEventListener('load', function () {
        context4.drawImage(tube4Hover, parseInt(canvas.width - (canvas.width * 0.1358) - (canvas.width * 0.08)) - 3, 1618, parseInt(canvas.width * 0.1358), parseInt((canvas.width * 0.1358) * (600.0/162.0)));
      });
      tube4Hover.src = 'http://yowlu.com/wapo/images/tube4-hover.png';
    });
    tube4.src = 'http://yowlu.com/wapo/images/tube4.png';

  });
  tube5.src = 'http://yowlu.com/wapo/images/tube5.png';  

  var tube6 = new Image();
  tube6.addEventListener('load', function () {
    context2.drawImage(tube6, parseInt(canvas.width * 0.028), 2621, parseInt(canvas.width * 0.1383), parseInt((canvas.width * 0.1383) * (592.0/165.0)));
    var tube6Hover = new Image();
    tube6Hover.addEventListener('load', function () {
      context4.drawImage(tube6Hover, parseInt(canvas.width * 0.028), 2621, parseInt(canvas.width * 0.1383), parseInt((canvas.width * 0.1383) * (592.0/165.0)));
    });
    tube6Hover.src = 'http://yowlu.com/wapo/images/tube6-hover.png';
  });
  tube6.src = 'http://yowlu.com/wapo/images/tube6.png';

  var tube7 = new Image();
  tube7.addEventListener('load', function () {
    context2.drawImage(tube7, parseInt(canvas.width * 0.06), 3200, parseInt(canvas.width * 0.6707), parseInt((canvas.width * 0.6707) * (552.0/800.0)));
    var coverGlass = new Image();
    coverGlass.addEventListener('load', function () {
      context3.drawImage(coverGlass, parseInt(canvas3.width * 0.291), 3415, parseInt(canvas3.width * 0.125), parseInt((canvas3.width * 0.125) * (224.0/149.0)));
      context3.drawImage(coverGlass, parseInt(canvas3.width * 0.5975), 3415, parseInt(canvas3.width * 0.125), parseInt((canvas3.width * 0.125) * (224.0/149.0)));
      
      leftCoverGlass = new CanvasImage([coverGlass], 0.291, (3415.0/canvas3.width), 0, 0.0005, 0, 0, new Array({x:0.291,y:(3415.0/canvas3.width)}));
      rightCoverGlass = new CanvasImage([coverGlass], 0.5975, (3415.0/canvas3.width), 0, 0.0005, 0, 0, new Array({x:0.5975,y:(3415.0/canvas3.width)}))

      if (leftCoverGlass > leftCoverGlass.positionsArray[0].x) {
       leftCoverGlass.xDir = false;
      }
      else {
        leftCoverGlass.xDir = true;
      }
      if (leftCoverGlass.y > leftCoverGlass.positionsArray[0].y) {
        leftCoverGlass.yDir = false;
      }
      else {
        leftCoverGlass.yDir = true;
      }
      if (rightCoverGlass > rightCoverGlass.positionsArray[0].x) {
       rightCoverGlass.xDir = false;
      }
      else {
        rightCoverGlass.xDir = true;
      }
      if (rightCoverGlass.y > rightCoverGlass.positionsArray[0].y) {
        rightCoverGlass.yDir = false;
      }
      else {
        rightCoverGlass.yDir = true;
      }

      var tube7Hover = new Image();
      tube7Hover.addEventListener('load', function () {
        context4.drawImage(tube7Hover, parseInt(canvas.width * 0.06), 3200, parseInt(canvas.width * 0.6707), parseInt((canvas.width * 0.6707) * (552.0/800.0)));
        
        coverGlassHover = new Image();
        coverGlassHover.addEventListener('load', function () {
          //context5.drawImage(coverGlassHover, parseInt(canvas.width * 0.298), 3593, parseInt(canvas.width * 0.113), parseInt((canvas.width * 0.113) * (42.0/135.0)));
          //context5.drawImage(coverGlassHover, parseInt(canvas.width * 0.605), 3593, parseInt(canvas.width * 0.113), parseInt((canvas.width * 0.113) * (42.0/135.0)));
          leftCoverGlassHover = new CanvasImage([coverGlassHover], 0.298, (3593.0/canvas3.width), 0, 0.0005, 0, 0, new Array({x:0.298,y:(3593.0/canvas3.width)}));
          rightCoverGlassHover = new CanvasImage([coverGlassHover], 0.605, (3593.0/canvas3.width), 0, 0.0005, 0, 0, new Array({x:0.605,y:(3593.0/canvas3.width)}))
        });
        coverGlassHover.src = 'http://yowlu.com/wapo/images/cover-glass-animate.png';

      });
      tube7Hover.src = 'http://yowlu.com/wapo/images/tube7-hover.png';
    });
    coverGlass.src = 'http://yowlu.com/wapo/images/cover-glass.png';
  });
  tube7.src = 'http://yowlu.com/wapo/images/tube7.png';

  var chart = new Image();
  chart.addEventListener('load', function () {
    context2.drawImage(chart, parseInt((canvas.width * 0.5) - (canvas.width * 0.77 * 0.5)), 3755, parseInt(canvas.width * 0.77), parseInt((canvas.width * 0.77) * (315.0/912.0)));
  });
  chart.src = 'http://yowlu.com/wapo/images/last-chart.png';

  var chart2 = new Image();
  chart2.addEventListener('load', function () {
    context2.drawImage(chart2, parseInt((canvas.width * 0.5) - (canvas.width * 0.7026 * 0.5)), 4055, parseInt(canvas.width * 0.7026), parseInt((canvas.width * 0.7026) * (188.0/838.0)));
  });
  chart2.src = 'http://yowlu.com/wapo/images/graphic.png';
}
//Draw an image rotated
var TO_RADIANS = Math.PI/180; 
function drawRotatedImage(image, x, y, angle, auxCtx) { 
 
  // save the current co-ordinate system 
  // before we screw with it
  auxCtx.save(); 
 
  // move to the middle of where we want to draw our image
  auxCtx.translate(x + (image.width/2), y + (image.height/2));
 
  // rotate around that point, converting our 
  // angle from degrees to radians 
  auxCtx.rotate(angle);
 
  // draw it up and to the left by half the width
  // and height of the image 
  auxCtx.drawImage(image, -(image.width/2), -(image.height/2));
 
  // and restore the co-ords to how they were when we began
  auxCtx.restore(); //
}
//Setup mosquitos
var setupMosquitos = function(){
  var mosquito = new Image();
  mosquito.addEventListener('load', function () {
    //
  });
  mosquito.src = 'http://yowlu.com/wapo/images/mosquito1_left.png';
  var mosquito2 = new Image();
  mosquito2.addEventListener('load', function () {
    //
  });
  mosquito2.src = 'http://yowlu.com/wapo/images/mosquito2_left.png';
  var mosquitoFlipped = new Image();
  mosquitoFlipped.addEventListener('load', function () {
    //
  });
  mosquitoFlipped.src = 'http://yowlu.com/wapo/images/mosquito1_left.png';
  var mosquito2Flipped = new Image();
  mosquito2Flipped.addEventListener('load', function () {
    //
  });
  mosquito2Flipped.src = 'http://yowlu.com/wapo/images/mosquito2_left.png';

  for (var i = 0; i < totalMosquitos; i++) {
    

    mosquitosArray.push(new CanvasImage([mosquito/*, mosquito2*/], 0, 0, 0, 0.001 + (Math.random() * 0.001), 0, 0, new Array()));

    mosquitosArray[i].flippedImages = new Array(mosquitoFlipped/*, mosquito2Flipped*/);
    
    var auxPositionsArray = mosquitosPositionsPhase1[i%mosquitosPositionsPhase1.length];

    auxPositionsArray = shuffle(auxPositionsArray);
    
    auxPositionsArray.forEach(function(element,index,array) {
      var auxElement = {x: element.x + (((Math.random() * 0.1) - 0.05) * 1.0), y: element.y + (((Math.random() * 0.1) - 0.05) * 1.0)};
      auxElement.x = Math.max(0.5, Math.min(0.85, auxElement.x));
      auxElement.y = Math.max(0.1, Math.min(0.3, auxElement.y));
      if (auxElement.y <= 0.1 && auxElement.x <= 0.49) {
        auxElement.x = auxElement.x + 0.2;
      }
      mosquitosArray[i].positionsArray.push(auxElement);
    });

    mosquitosArray[i].currentPosition = Math.floor(Math.random() * mosquitosArray[i].positionsArray.length);
    mosquitosArray[i].x = mosquitosArray[i].positionsArray[mosquitosArray[i].currentPosition].x;
    mosquitosArray[i].y = mosquitosArray[i].positionsArray[mosquitosArray[i].currentPosition].y;

    var nextPosition = mosquitosArray[i].currentPosition + 1;
    if (nextPosition >= mosquitosArray[i].positionsArray.length) {
      nextPosition = 0;
    }

    if (mosquitosArray[i].x > mosquitosArray[i].positionsArray[nextPosition].x) {
      mosquitosArray[i].xDir = false;
    }
    else {
      mosquitosArray[i].xDir = true;
    }
    if (mosquitosArray[i].y > mosquitosArray[i].positionsArray[nextPosition].y) {
      mosquitosArray[i].yDir = false;
    }
    else {
      mosquitosArray[i].yDir = true;
    }
  }
}
//Decide next step actions
var decideNextStep = function(nextStep){
  switch (nextStep) {
    case 0:
      $('#pgStep1 .pg-button').attr("disabled", "disabled");
      $('#pgStep1').attr("disabled", "disabled");
      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          // add delay
          element.positionsArray = mosquitosPositionsPhase2[0];

          element.positionsArray.forEach(function(element2,index2,array2) {
            element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
            element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
            element.positionsArray[index2] = element2;
          });

          element.currentPosition = 0;
          element.currentMosquitoPhase = 1;
          element.speed = 0.004 + (Math.random() * 0.001);
          if (element.x > element.positionsArray[element.currentPosition].x) {
            element.xDir = false;
          }
          else {
            element.xDir = true;
          }
          if (element.y > element.positionsArray[element.currentPosition].y) {
            element.yDir = false;
          }
          else {
            element.yDir = true;
          }
        }, Math.random() * 1500);
      });
      
      $('html, body').animate({
        scrollTop: $('#pgQuestion-container1').offset().top
      }, 7000);
    break;
    case 1:
      var auxMosquitosLeft = mosquitosLeft;
      mosquitosLeft -= returnMosquitosLeft(0, 2, parseInt($('#visit-country').val()));
      mosquitosArray.forEach(function(element,index,array){
        if (index < mosquitosLeft) {
          setTimeout(function() {
            // add delay
            
            if (index > auxMosquitosLeft) {
              element.positionsArray = new Array();

              for (var i = 0; i < mosquitosPositionsPhase4[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase4[0][i]);
              };
              for (var i = 0; i < mosquitosPositionsPhase6[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase6[0][i]);
              }
            }
            else {
              element.positionsArray = mosquitosPositionsPhase6[0];
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x /*+ (((Math.random() * 0.1) - 0.05) * 0.0003)*/;
              element2.y = element2.y /*+ (((Math.random() * 0.1) - 0.05) * 0.0003)*/;
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 5;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }, Math.random() * 1500);
        }
      });
      
      $("#pgQuestion-container1").attr("disabled", "disabled");
      $("#pgQuestion-container1 select").attr("disabled", "disabled");

      $('html, body').animate({
        scrollTop: $('#pgStep2').offset().top
      }, 5000);
    break;
    case 2:
      $('#pgStep2 .pg-button').attr("disabled", "disabled");
      $("#pgStep2").attr("disabled", "disabled");
      mosquitosArray.forEach(function(element,index,array){
        if (index < mosquitosLeft) {
          setTimeout(function() {
            // add delay
            element.positionsArray = mosquitosPositionsPhase8[0];

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x /*+ (((Math.random() * 0.1) - 0.05) * 0.002)*/;
              element2.y = element2.y /*+ (((Math.random() * 0.1) - 0.05) * 0.002)*/;
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 7;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }, Math.random() * 1500);
        }
      });
      
      $('html, body').animate({
        scrollTop: $('#pgQuestion-container2').offset().top
      }, 7000);
    break;
    case 3:
      $('#pgQuestion-container2 .pg-button').attr("disabled", "disabled");
      $('#pgQuestion-container2').attr("disabled", "disabled");
      $('.pgQuestion__body__option').addClass("disabled-option");
      
      mosquitosArray.forEach(function(element,index,array){
        if (index < mosquitosLeft) {
          setTimeout(function() {
            // add delay
            element.positionsArray = mosquitosPositionsPhase10[0];

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 9;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }, Math.random() * 1500);
        }
      });
      
      $('html, body').animate({
        scrollTop: $('#pgStep3').offset().top
      }, 7000);
    break;
    case 4:
      $("#pgStep3 .pg-button").attr("disabled", "disabled");
      $("#pgStep3").attr("disabled", "disabled");
      mosquitosArray.forEach(function(element,index,array){
        if (index < mosquitosLeft) {
          setTimeout(function() {
            // add delay
            element.positionsArray = mosquitosPositionsPhase12[0];

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 11;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }, Math.random() * 1500);
        }
      });
      
      $('html, body').animate({
        scrollTop: $('#pgQuestion-container3').offset().top
      }, 7000);
      break;
      case 5:
      $($('#pgQuestion-wrapper3 .pgQuestion')[2]).find(".check").css("opacity", "1.0");

      setTimeout(function() {
        mosquitosLeft -= returnMosquitosLeft(4, 3, !$($($('#pgQuestion-wrapper3 .pgQuestion')[1]).find("pgQuestion__body__binary-option")[1]).hasClass("selected"));

        pregnantMosquitos = mosquitosLeft * 0.75;

      mosquitosArray.forEach(function(element,index,array){
        if (index < pregnantMosquitos) {
          setTimeout(function() {
            // add delay
            element.positionsArray = mosquitosPositionsPhase18[0];

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 17;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }, Math.random() * 1500);
        }
      });

      $('#pgQuestion-container3 .pg-button').attr("disabled", "disabled");
      $('#pgQuestion-container3').attr("disabled", "disabled");
      $('.pgQuestion__body__binary-option').addClass("disabled-option");

      mosquitosArray.forEach(function(element,index,array){
        if (index >= pregnantMosquitos && index < mosquitosLeft) {
          setTimeout(function() {
            // add delay
            element.positionsArray = mosquitosPositionsPhase20[0];

            currentPhase = 20;

            $("#pgStep4").removeAttr("disabled", "disabled");


            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 19;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }, Math.random() * 1500);
        }
      });
      
      $('html, body').animate({
        scrollTop: $('#pgStep4').offset().top
      }, 7000);
      }, 750);
      break;

    default:
  }
};
/**************************************
        Steps
**************************************/
//Deals with the scrolling between steps and questions
var manageStepsAction = function(){
  $(document).on('click', '.pgStep__info__text-action', function(){
    var nextStep = parseInt($(this).attr('data-step'));
    decideNextStep(nextStep);
  });
  $(document).on('change', 'select#visit-country', function(){
    var nextStep = parseInt($(this).attr('data-step') + 1);
    decideNextStep(nextStep);
  });
};

/**************************************
        Questions
**************************************/
//Deals with the scrolling between questions
var manageQuestionsScroll = function() {
  $(document).on('change', 'select#home-country', function() {
    var nextPosition = $(this).attr('data-pos'),
      currentStep = $(this).attr('data-step');

   var $questionWrapper = $($('.pgQuestion-wrapper')[currentStep]),
        $questionContainer = $($('.pgQuestion-container')[currentStep]),
        newTranslationValue = -(($questionContainer.width() * nextPosition) / $questionWrapper.width()) * 100.0,
        newTranslation = 'translate3d(' + newTranslationValue + '%,0,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);

      if (currentStep == 0 && nextPosition == 1) {
      mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, parseInt($('#home-country').val()));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay
            element.positionsArray = mosquitosPositionsPhase4[0];

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 3;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }
        }, Math.random() * 1500);
      });
    }
  });

  $(document).on('click', '.pgQuestion-action', function(){
    $(this).attr("disabled", "disabled");
    var nextPosition = $(this).attr('data-pos'),
      currentStep = $(this).attr('data-step');

    var auxCurrentStep = currentStep;
    if (nextPosition != -1) {
      
      if (currentStep == 3) {
        auxCurrentStep = 2;
      }
      else {
        var $questionWrapper = $($('.pgQuestion-wrapper')[auxCurrentStep]),
        $questionContainer = $($('.pgQuestion-container')[auxCurrentStep]),
        newTranslationValue = -(($questionContainer.width() * nextPosition) / $questionWrapper.width()) * 100.0,
        newTranslation = 'translate3d(' + newTranslationValue + '%,0,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);
      }
    }
    else {
      if (parseInt(currentStep) == 2) {
        mosquitosLeft -= returnMosquitosLeft(parseInt(currentStep), nextPosition, 0)
      }
      decideNextStep(parseInt(currentStep) + 1);
    }
    if (currentStep == 0 && nextPosition == 1) {
      mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, parseInt($('#home-country').val()));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay
            element.positionsArray = mosquitosPositionsPhase4[0];

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 3;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }
        }, Math.random() * 1500);
      });
    }
    else if (currentStep == 3 && nextPosition == 1) {
      $($('#pgQuestion-wrapper3 .pgQuestion')[0]).find(".check").css("opacity", "1.0");

      setTimeout(function() {
        var $questionWrapper = $($('.pgQuestion-wrapper')[auxCurrentStep]),
        $questionContainer = $($('.pgQuestion-container')[auxCurrentStep]),
        newTranslationValue = -(($questionContainer.width() * nextPosition) / $questionWrapper.width()) * 100.0,
        newTranslation = 'translate3d(' + newTranslationValue + '%,0,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);//

        mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, ($($($('#pgQuestion-wrapper3 .pgQuestion')[0]).find("pgQuestion__body__binary-option")[0]).hasClass("selected")) ? 0 : (($($($('#pgQuestion-wrapper3 .pgQuestion')[0]).find("pgQuestion__body__binary-option")[1]).hasClass("selected")) ? 1 : 2));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay
            element.positionsArray = mosquitosPositionsPhase14[0];

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 13;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }
        }, Math.random() * 1500);
      });
      }, 750);
    }
    else if (currentStep == 3 && nextPosition == 2) {
      $($('#pgQuestion-wrapper3 .pgQuestion')[1]).find(".check").css("opacity", "1.0");

      setTimeout(function() {
        var $questionWrapper = $($('.pgQuestion-wrapper')[auxCurrentStep]),
        $questionContainer = $($('.pgQuestion-container')[auxCurrentStep]),
        newTranslationValue = -(($questionContainer.width() * nextPosition) / $questionWrapper.width()) * 100.0,
        newTranslation = 'translate3d(' + newTranslationValue + '%,0,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);//

        mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, !$($($('#pgQuestion-wrapper3 .pgQuestion')[1]).find("pgQuestion__body__binary-option")[1]).hasClass("selected"));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay
            element.positionsArray = mosquitosPositionsPhase16[0];

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 15;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }
        }, Math.random() * 1500);
      });
      }, 750);
    }

  });
};

//Select an option on the second question
var selectOption = function(){
  $(document).on('click', '.pgQuestion__body__option:not(.disabled-option)', function() {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $(this).find("img").attr("src", "http://yowlu.com/wapo/images/" + behaviorImages[$(this).attr("data-index")]);
    }
    else {
      $(this).addClass("selected");
      $(this).find("img").attr("src", "http://yowlu.com/wapo/images/" + hoverBehaviorImages[$(this).attr("data-index")]);
    }
  });
};

//Select a binary option on the third question
var selectBinaryOption = function(){
  $(document).on('click', '.pgQuestion__body__binary-option:not(.disabled-option)', function() {

    var nextPosition = $(this).attr('data-pos'),
      currentStep = $(this).attr('data-step');

    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      // move mosquitos
      $(this).parent().parent().parent().find(".pg-button").attr("disabled", "disabled");
    }
    else {
      $(this).parent().find(".pgQuestion__body__binary-option").removeClass("selected");
      $(this).addClass("selected");
      $(this).parent().parent().parent().find(".pg-button").removeAttr("disabled");
    }

    if (currentStep == 3 && nextPosition == 1) {
      $($('#pgQuestion-wrapper3 .pgQuestion')[0]).find(".check").css("opacity", "1.0");

      setTimeout(function() {
        var $questionWrapper = $($('.pgQuestion-wrapper')[currentStep - 1]),
        $questionContainer = $($('.pgQuestion-container')[currentStep - 1]),
        newTranslationValue = -(($questionContainer.width() * nextPosition) / $questionWrapper.width()) * 100.0,
        newTranslation = 'translate3d(' + newTranslationValue + '%,0,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);//

        mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, ($($($('#pgQuestion-wrapper3 .pgQuestion')[0]).find("pgQuestion__body__binary-option")[0]).hasClass("selected")) ? 0 : (($($($('#pgQuestion-wrapper3 .pgQuestion')[0]).find("pgQuestion__body__binary-option")[1]).hasClass("selected")) ? 1 : 2));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay
            element.positionsArray = mosquitosPositionsPhase14[0];

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 13;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }
        }, Math.random() * 1500);
      });
      }, 750);
    }
    else if (currentStep == 3 && nextPosition == 2) {
      $($('#pgQuestion-wrapper3 .pgQuestion')[1]).find(".check").css("opacity", "1.0");

      setTimeout(function() {
        var $questionWrapper = $($('.pgQuestion-wrapper')[currentStep - 1]),
        $questionContainer = $($('.pgQuestion-container')[currentStep - 1]),
        newTranslationValue = -(($questionContainer.width() * nextPosition) / $questionWrapper.width()) * 100.0,
        newTranslation = 'translate3d(' + newTranslationValue + '%,0,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);//

        mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, !$($($('#pgQuestion-wrapper3 .pgQuestion')[1]).find("pgQuestion__body__binary-option")[1]).hasClass("selected"));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay
            element.positionsArray = mosquitosPositionsPhase16[0];

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 15;
            element.speed = 0.004 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }
        }, Math.random() * 1500);
      });
      }, 750);
    }
    else {
      decideNextStep(5);
    }

  });
};

//Select the pregnancy option
var selectPregnancyOption = function() {
  $(document).on('click', '.pgStep__pregnancy-ok', function() {
    if (currentPhase == 20) {
      $('.pgStep__pregnancy-ok').attr("disabled", "disabled");
      $('.pgStep__pregnancy-ko').attr("disabled", "disabled");
      currentPhase = 21;
    pregnantSelected = true;
    leftCoverGlass.currentMosquitoPhase = 2
    leftCoverGlass.speed = 0.001;
    leftCoverGlass.positionsArray = new Array({x:0.291,y:(3415.0/canvas3.width) - 0.065});
    leftCoverGlassHover.positionsArray = new Array({x:0.298,y:(3593.0/canvas3.width) - 0.065});
    leftCoverGlassHover.currentPosition = 0;
    leftCoverGlass.currentPosition = 0;
    if (leftCoverGlass.x > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].x) {
      leftCoverGlass.xDir = false;
    }
    else {
      leftCoverGlass.xDir = true;
    }
    if (leftCoverGlass.y > leftCoverGlass.positionsArray[leftCoverGlass.currentPosition].y) {
      leftCoverGlass.yDir = false;
    }
    else {
      leftCoverGlass.yDir = true;
    }

    if (leftCoverGlassHover.x > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].x) {
      leftCoverGlassHover.xDir = false;
    }
    else {
      leftCoverGlassHover.xDir = true;
    }
    if (leftCoverGlassHover.y > leftCoverGlassHover.positionsArray[leftCoverGlassHover.currentPosition].y) {
      leftCoverGlassHover.yDir = false;
    }
    else {
      leftCoverGlassHover.yDir = true;
    }

    var cell = Math.floor(25 * (mosquitosLeft / totalMosquitos));
    var newX = 0.3;
    var newY = 3.22;
    switch (cell) {
      case 1:
      case 3:
      case 5:
      case 8:
      case 12:
        newX = 0.3;
      break;
      case 2:
      case 6:
      case 10:
      case 14:
      case 17:
        newX = 0.4;
      break;
      case 4:
      case 9:
      case 15:
      case 19:
      case 21:
        newX = 0.5;
      break;
      case 7:
      case 13:
      case 18:
      case 22:
      case 24:
        newX = 0.6;
      break;
      case 11:
      case 16:
      case 20:
      case 23:
      case 25:
        newX = 0.7;
      break;
    }
    switch (cell) {
      case 1:
      case 2:
      case 4:
      case 7:
      case 11:
        newY = 3.39;
      break;
      case 3:
      case 6:
      case 9:
      case 13:
      case 16:
        newY = 3.3475;
      break;
      case 5:
      case 10:
      case 15:
      case 18:
      case 20:
        newY = 3.305;
      break;
      case 8:
      case 14:
      case 19:
      case 22:
      case 23:
        newY = 3.2625;
      break;
      case 12:
      case 17:
      case 21:
      case 24:
      case 25:
        newY = 3.22;
      break;
    }

    var newPositionsArray = new Array({x: newX, y: newY});
    
    var marker = new Image();
    marker.addEventListener('load', function () {
      context4.drawImage(marker, parseInt((newX * canvas.width) - ((canvas.width * 0.024) * 0.5)), parseInt((newY * canvas.width) - ((canvas.width * 0.024) * (37.0/29.0) * 0.5)), parseInt(canvas.width * 0.024), parseInt((canvas.width * 0.024) * (37.0/29.0)));
    });
    marker.src = 'http://yowlu.com/wapo/images/marker.png';

    mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < pregnantMosquitos) {
            element.positionsArray = newPositionsArray;

            element.currentPosition = 0;
            element.currentMosquitoPhase = 21;
            element.speed = 0.002 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }
        }, (Math.random() * 1500) + 1000);
      });
    setTimeout(function() {
      createConclusions();
      createUsersStats(newX, newY);
      setTimeout(function() {
        $('html, body').animate({
          scrollTop: $('.pgStep__last-chart').offset().top
        }, 1000);
      }, 1000);
    }, 2000);
    }
  });
  $(document).on('click', '.pgStep__pregnancy-ko', function() {
    if (currentPhase == 20) {
      $('.pgStep__pregnancy-ok').attr("disabled", "disabled");
      $('.pgStep__pregnancy-ko').attr("disabled", "disabled");
      currentPhase = 21;
    nonPregnantSelected = true;
    rightCoverGlass.currentMosquitoPhase = 2;
    rightCoverGlass.speed = 0.001;
    rightCoverGlass.positionsArray = new Array({x:0.5975,y:(3415.0/canvas3.width) - 0.065});
    rightCoverGlassHover.positionsArray = new Array({x:0.5975,y:(3593.0/canvas3.width) - 0.065});
    rightCoverGlassHover.currentPosition = 0;

    rightCoverGlass.currentPosition = 0;
    if (rightCoverGlass.x > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].x) {
      rightCoverGlass.xDir = false;
    }
    else {
      rightCoverGlass.xDir = true;
    }
    if (rightCoverGlass.y > rightCoverGlass.positionsArray[rightCoverGlass.currentPosition].y) {
      rightCoverGlass.yDir = false;
    }
    else {
      rightCoverGlass.yDir = true;
    }

    rightCoverGlassHover.currentPosition = 0;
    if (rightCoverGlassHover.x > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].x) {
      rightCoverGlassHover.xDir = false;
    }
    else {
      rightCoverGlassHover.xDir = true;
    }
    if (rightCoverGlassHover.y > rightCoverGlassHover.positionsArray[rightCoverGlassHover.currentPosition].y) {
      rightCoverGlassHover.yDir = false;
    }
    else {
      rightCoverGlassHover.yDir = true;
    }

    var newMosquitosLeftValue = Math.max(5, mosquitosLeft - (mosquitosLeft * 0.45));

    var cell = Math.floor(25 * (newMosquitosLeftValue / totalMosquitos));
    var newX = 0.3;
    var newY = 3.22;
    switch (cell) {
      case 1:
      case 3:
      case 5:
      case 8:
      case 12:
        newX = 0.3;
      break;
      case 2:
      case 6:
      case 10:
      case 14:
      case 17:
        newX = 0.4;
      break;
      case 4:
      case 9:
      case 15:
      case 19:
      case 21:
        newX = 0.5;
      break;
      case 7:
      case 13:
      case 18:
      case 22:
      case 24:
        newX = 0.6;
      break;
      case 11:
      case 16:
      case 20:
      case 23:
      case 25:
        newX = 0.7;
      break;
    }
    switch (cell) {
      case 1:
      case 2:
      case 4:
      case 7:
      case 11:
        newY = 3.39;
      break;
      case 3:
      case 6:
      case 9:
      case 13:
      case 16:
        newY = 3.3475;
      break;
      case 5:
      case 10:
      case 15:
      case 18:
      case 20:
        newY = 3.305;
      break;
      case 8:
      case 14:
      case 19:
      case 22:
      case 23:
        newY = 3.2625;
      break;
      case 12:
      case 17:
      case 21:
      case 24:
      case 25:
        newY = 3.22;
      break;
    }

    var newPositionsArray = new Array({x: newX, y: newY});
    
    var marker = new Image();
    marker.addEventListener('load', function () {
      context2.drawImage(marker, parseInt((newX * canvas.width) - ((canvas.width * 0.024) * 0.5)), parseInt((newY * canvas.width) - ((canvas.width * 0.024) * (37.0/29.0) * 0.5)), parseInt(canvas.width * 0.024), parseInt((canvas.width * 0.024) * (37.0/29.0)));
    });
    marker.src = 'http://yowlu.com/wapo/images/marker.png';
    
    mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index >= pregnantMosquitos && index < mosquitosLeft) {
            element.positionsArray = newPositionsArray;

            element.currentPosition = 0;
            element.currentMosquitoPhase = 21;
            element.speed = 0.002 + (Math.random() * 0.001);
            if (element.x > element.positionsArray[element.currentPosition].x) {
              element.xDir = false;
            }
            else {
              element.xDir = true;
            }
            if (element.y > element.positionsArray[element.currentPosition].y) {
              element.yDir = false;
            }
            else {
              element.yDir = true;
            }
          }
        }, (Math.random() * 1500) + 1000);
      });

    setTimeout(function() {
      createConclusions();
      createUsersStats(newX, newY);
      setTimeout(function() {
        $('html, body').animate({
          scrollTop: $('.pgStep__last-chart').offset().top
        }, 1000);
      }, 1000);
    }, 2000);
    }
  });
}

//Return mosquitos left depending on the chosen country
var returnMosquitosLeft = function(step, question, option){
  var auxMosquitosLeft = 0;

  if (step == 0) {
    if (question == 1) {
      if (option == 1) {
        auxMosquitosLeft = 0;
      }
      else if (option == 2) {
        auxMosquitosLeft = 80;
      }
    }
    if (question == 2) {
      if (option == 1) {
        if (mosquitosLeft <= 20) {
          auxMosquitosLeft = -80;
        }
        else {
          auxMosquitosLeft = 0;
        }
      }
      else if (option == 2) {
        if (mosquitosLeft <= 20) {
          auxMosquitosLeft = 0;
        }
        else {
          auxMosquitosLeft = 0;
        }
      }
    }
  }
  if (step == 2) {
    //if (question == 0) {
      if ($($('.pgQuestion__body__option')[0]).hasClass('selected')) {
        auxMosquitosLeft += 3;
      }
      else {
        auxMosquitosLeft += 0; 
      }
      if ($($('.pgQuestion__body__option')[1]).hasClass('selected')) {
        auxMosquitosLeft += 0;
      }
      else {
        auxMosquitosLeft += 1; 
      }
      if ($($('.pgQuestion__body__option')[2]).hasClass('selected')) {
        auxMosquitosLeft += 0;
      }
      else {
        auxMosquitosLeft += 1; 
      }
      if ($($('.pgQuestion__body__option')[3]).hasClass('selected')) {
        auxMosquitosLeft += 1;
      }
      else {
        auxMosquitosLeft += 0; 
      }
      if ($($('.pgQuestion__body__option')[4]).hasClass('selected')) {
        auxMosquitosLeft += 1;
      }
      else {
        auxMosquitosLeft += 0; 
      }
      if ($($('.pgQuestion__body__option')[5]).hasClass('selected')) {
        auxMosquitosLeft += 0;
      }
      else {
        auxMosquitosLeft += 1; 
      }
      if ($($('.pgQuestion__body__option')[6]).hasClass('selected')) {
        auxMosquitosLeft += 0;
      }
      else {
        auxMosquitosLeft += 1; 
      }
      if ($($('.pgQuestion__body__option')[7]).hasClass('selected')) {
        auxMosquitosLeft += 1;
      }
      else {
        auxMosquitosLeft += 0; 
      }
      if ($($('.pgQuestion__body__option')[8]).hasClass('selected')) {
        auxMosquitosLeft += 0;
      }
      else {
        auxMosquitosLeft += (mosquitosLeft <= 80) ? 2 : 1; 
      }
    //}
  }

  if (step == 3) {
    if (question == 1) {
      if (option == 0) {
        auxMosquitosLeft = 1;
      }
      else if (option == 1) {
        auxMosquitosLeft = 0;
      }
      else {
        auxMosquitosLeft = 0;
      }
    }
    if (question == 2) {
      if (option == 0) {
        auxMosquitosLeft = 0;
      }
      else if (option == 1) {
        auxMosquitosLeft = 1;
      }
    }
    if (question == 3) {
      if (option == 0) {
        auxMosquitosLeft = 0;
      }
      else if (option == 1) {
        auxMosquitosLeft = 1;
      }
    }
  }

  return auxMosquitosLeft;
};

/**************************************
        Conclusions
**************************************/
var createConclusions = function() {
  var conclusionsText = "";

  if (parseInt($("#home-country").val()) == 2 && parseInt($("#visit-country").val()) == 2) {
    if (!$($(".pgQuestion__body__option")[8]).hasClass("selected") || pregnantSelected) {
      conclusionsText += "<p>You don’t live in a country nor are you planning to travel to a country affected by the Zika virus. Your risk is low but remember that there have been cases of sexual transmission by partners that got infected in those areas.</p>";
    }
    else {
      conclusionsText += "<p>You don’t live in a country nor are you planning to travel to a country affected by the Zika virus. Your risk is zero.</p>";
    }
  }
  else {
    conclusionsText += "<p>You live in a country that is affected by the Zika virus or you are planning to travel to a country that is.</p>";

    if ($($(".pgQuestion__body__option")[1]).hasClass("selected") || $($(".pgQuestion__body__option")[2]).hasClass("selected") || $($(".pgQuestion__body__option")[5]).hasClass("selected") || $($(".pgQuestion__body__option")[6]).hasClass("selected")) {
      conclusionsText += "<p>Wearing shorts and sleeveless shirts that are dark in color and keeping buckets of water or having water containers near your house can increase your risk of being bitten by the mosquito and raise your chances of getting the virus.</p>";
    }
    if ($($(".pgQuestion__body__option")[3]).hasClass("selected") || $($(".pgQuestion__body__option")[4]).hasClass("selected") || $($(".pgQuestion__body__option")[7]).hasClass("selected")) {
      conclusionsText += "<p>Using insect repellent, wearing light color clothes, having physical barriers such mesh screens or treated netting materials on doors and windows, or sleeping under mosquito nets will all decrease your risk of getting bitten by the mosquito and lower your changes of getting the virus.</p>";
    }

    if (nonPregnantSelected) {
      conclusionsText += "<p>Zika virus is spread primarily through the bite of infected Aedes species mosquitoes. Only 20% people who contract the virus will even develop any symptoms and the illness is usually mild, with symptoms like fever, rash or joint pain that will last a few days.<br><br>Recently in Brazil, local health authorities have observed an increase in Guillain-Barré syndrome, that causes paralysis, which coincided with Zika virus infections in the general public. Based on a growing body of preliminary research, there is scientific consensus that Zika virus is a cause of microcephaly and Guillain-Barré syndrome.</p>";
    }
    else {
      conclusionsText += "<p>The Zika virus can be transmitted from infected mothers to their fetuses and this can happen during both pregnancy or at childbirth. Based on a growing body of preliminary research, there is scientific consensus that Zika virus is a cause of microcephaly, which is a condition where a baby is born with a small head or the head stops growing after birth. Babies with microcephaly can develop developmental disabilities. Early diagnosis of microcephaly can sometimes be made by fetal ultrasound.<br><br>Pregnant women who develop symptoms of Zika virus infection, should see their health-care provider for close monitoring of their pregnancy. If you’re travelling to a country affected by Zika, the World Health Organization is advising pregnant women not to travel to areas of ongoing Zika virus transmission.</p>";
    }
  }

  conclusionsText += "<br><br>";

  $(".pgConclusions-desc").before(conclusionsText);
}

var createUsersStats = function(markerLeft, markerTop) {
  var results = [1, 2, 1, 2, 5, 3, 6, 10, 1, 1, 1, 1, 10, 12, 5, 1, 1, 10, 12, 1, 1, 1, 2, 9, 1];

  var maxResults = -1;

  for (var i = 0; i < results.length; i++) {
    if (maxResults < results[i]) {
      maxResults = results[i];
    }
  }

  $(".pgStep__users-stats-mid").html(parseInt(maxResults / 2.0));
  $(".pgStep__users-stats-max").html(maxResults);

  for (var i = 0; i < results.length; i++) {
    animateUsersStats($($(".pgStep__users-stats__col")[parseInt(i/5)]).find(".pgStep__users-stats__col__value")[i%5], (results[i] / maxResults) * 100.0, i);
  }

  $(".pgStep__users-stats-marker").css("opacity", 1.0);

  if (markerLeft <= 0.3) {
    if (markerTop == 3.39) {
      markerLeft = 0.235
    }
    else if (markerTop == 3.3475) {
      markerLeft = 0.2425
    }
    else if (markerTop == 3.305) {
      markerLeft = 0.255
    }
    else if (markerTop == 3.2625) {
      markerLeft = 0.27
    }
    else {
      markerLeft = 0.28
    }
  }
  else if (markerLeft <= 0.4) {
    if (markerTop == 3.39) {
      markerLeft = 0.35
    }
    else if (markerTop == 3.3475) {
      markerLeft = 0.365
    }
    else if (markerTop == 3.305) {
      markerLeft = 0.375
    }
    else if (markerTop == 3.2625) {
      markerLeft = 0.39
    }
    else {
      markerLeft = 0.4
    }
  }
  else if (markerLeft > 0.47 && markerLeft < 0.53) {
    if (markerTop == 3.39) {
      markerLeft = 0.47
    }
    else if (markerTop == 3.3475) {
      markerLeft = 0.4825
    }
    else if (markerTop == 3.305) {
      markerLeft = 0.495
    }
    else if (markerTop == 3.2625) {
      markerLeft = 0.505
    }
    else {
      markerLeft = 0.52
    }
  }
  else if (markerLeft <= 0.6) {
    if (markerTop == 3.39) {
      markerLeft = 0.59
    }
    else if (markerTop == 3.3475) {
      markerLeft = 0.6
    }
    else if (markerTop == 3.305) {
      markerLeft = 0.61
    }
    else if (markerTop == 3.2625) {
      markerLeft = 0.62
    }
    else {
      markerLeft = 0.635
    }
  }
  else {
    if (markerTop == 3.39) {
      markerLeft = 0.7075
    }
    else if (markerTop == 3.3475) {
      markerLeft = 0.72
    }
    else if (markerTop == 3.305) {
      markerLeft = 0.73
    }
    else if (markerTop == 3.2625) {
      markerLeft = 0.74
    }
    else {
      markerLeft = 0.755
    }
  }

  $(".pgStep__users-stats-marker").css("left", (markerLeft * 100) + "%");
};

var animateUsersStats = function(bar, value, i) {
  setTimeout(function() {
    bar.style.height = value + "%";
    bar.style.webkitTransform = "scaleY(" + 1 + ")";
    bar.style.transform = "scaleY(" + 1 + ")";
  }, 1500 + (i * 100));
}

$(document).ready(function() {
  //Set up needed functions
  manageQuestionsScroll();
  manageStepsAction();
  selectOption();
  selectBinaryOption();
  selectPregnancyOption();
  animateElementsPregnancy();
  animateBehaviorElements();
  setTimeout(function() {
    setupCanvas();
    setupMosquitos();
  }, 500);
  setupMainLoop();

  /*$(document).on("click", function(e) {
    console.log('{x:'+((e.pageX/$("canvas").width()) - 0.11) + ', y:' + (((e.pageY - 561)/$("canvas").width())) + '}');
  });*/
});

},{"./iframe.js":3,"./pbHeader.js":4,"./pbSocialTools.js":5,"./twitter-follow.js":7}],7:[function(require,module,exports){
window.twttr = (function (d, s, id) {
  var t, js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src= "https://platform.twitter.com/widgets.js";
  fjs.parentNode.insertBefore(js, fjs);
  return window.twttr || (t = { _e: [], ready: function (f) { t._e.push(f) } });
}(document, "script", "twitter-wjs"));
},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGFtbWVyanMvaGFtbWVyLmpzIiwic3JjL2pzL2Jhc2UuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvaWZyYW1lLmpzIiwic3JjL2pzL3BnLXRlbXBsYXRlL3BiSGVhZGVyLmpzIiwic3JjL2pzL3BnLXRlbXBsYXRlL3BiU29jaWFsVG9vbHMuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvcG9zdEdyYXBoaWNzVGVtcGxhdGUuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvdHdpdHRlci1mb2xsb3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Z0ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiEgSGFtbWVyLkpTIC0gdjIuMC42IC0gMjAxNS0xMi0yM1xuICogaHR0cDovL2hhbW1lcmpzLmdpdGh1Yi5pby9cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgSm9yaWsgVGFuZ2VsZGVyO1xuICogTGljZW5zZWQgdW5kZXIgdGhlICBsaWNlbnNlICovXG4oZnVuY3Rpb24od2luZG93LCBkb2N1bWVudCwgZXhwb3J0TmFtZSwgdW5kZWZpbmVkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxudmFyIFZFTkRPUl9QUkVGSVhFUyA9IFsnJywgJ3dlYmtpdCcsICdNb3onLCAnTVMnLCAnbXMnLCAnbyddO1xudmFyIFRFU1RfRUxFTUVOVCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG52YXIgVFlQRV9GVU5DVElPTiA9ICdmdW5jdGlvbic7XG5cbnZhciByb3VuZCA9IE1hdGgucm91bmQ7XG52YXIgYWJzID0gTWF0aC5hYnM7XG52YXIgbm93ID0gRGF0ZS5ub3c7XG5cbi8qKlxuICogc2V0IGEgdGltZW91dCB3aXRoIGEgZ2l2ZW4gc2NvcGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge051bWJlcn0gdGltZW91dFxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIHNldFRpbWVvdXRDb250ZXh0KGZuLCB0aW1lb3V0LCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoYmluZEZuKGZuLCBjb250ZXh0KSwgdGltZW91dCk7XG59XG5cbi8qKlxuICogaWYgdGhlIGFyZ3VtZW50IGlzIGFuIGFycmF5LCB3ZSB3YW50IHRvIGV4ZWN1dGUgdGhlIGZuIG9uIGVhY2ggZW50cnlcbiAqIGlmIGl0IGFpbnQgYW4gYXJyYXkgd2UgZG9uJ3Qgd2FudCB0byBkbyBhIHRoaW5nLlxuICogdGhpcyBpcyB1c2VkIGJ5IGFsbCB0aGUgbWV0aG9kcyB0aGF0IGFjY2VwdCBhIHNpbmdsZSBhbmQgYXJyYXkgYXJndW1lbnQuXG4gKiBAcGFyYW0geyp8QXJyYXl9IGFyZ1xuICogQHBhcmFtIHtTdHJpbmd9IGZuXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaW52b2tlQXJyYXlBcmcoYXJnLCBmbiwgY29udGV4dCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgICAgZWFjaChhcmcsIGNvbnRleHRbZm5dLCBjb250ZXh0KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiB3YWxrIG9iamVjdHMgYW5kIGFycmF5c1xuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGVhY2gob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBpO1xuXG4gICAgaWYgKCFvYmopIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChvYmouZm9yRWFjaCkge1xuICAgICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgb2JqLmxlbmd0aCkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgaW4gb2JqKSB7XG4gICAgICAgICAgICBvYmouaGFzT3duUHJvcGVydHkoaSkgJiYgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogd3JhcCBhIG1ldGhvZCB3aXRoIGEgZGVwcmVjYXRpb24gd2FybmluZyBhbmQgc3RhY2sgdHJhY2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uIHdyYXBwaW5nIHRoZSBzdXBwbGllZCBtZXRob2QuXG4gKi9cbmZ1bmN0aW9uIGRlcHJlY2F0ZShtZXRob2QsIG5hbWUsIG1lc3NhZ2UpIHtcbiAgICB2YXIgZGVwcmVjYXRpb25NZXNzYWdlID0gJ0RFUFJFQ0FURUQgTUVUSE9EOiAnICsgbmFtZSArICdcXG4nICsgbWVzc2FnZSArICcgQVQgXFxuJztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlID0gbmV3IEVycm9yKCdnZXQtc3RhY2stdHJhY2UnKTtcbiAgICAgICAgdmFyIHN0YWNrID0gZSAmJiBlLnN0YWNrID8gZS5zdGFjay5yZXBsYWNlKC9eW15cXChdKz9bXFxuJF0vZ20sICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL15cXHMrYXRcXHMrL2dtLCAnJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9eT2JqZWN0Ljxhbm9ueW1vdXM+XFxzKlxcKC9nbSwgJ3thbm9ueW1vdXN9KClAJykgOiAnVW5rbm93biBTdGFjayBUcmFjZSc7XG5cbiAgICAgICAgdmFyIGxvZyA9IHdpbmRvdy5jb25zb2xlICYmICh3aW5kb3cuY29uc29sZS53YXJuIHx8IHdpbmRvdy5jb25zb2xlLmxvZyk7XG4gICAgICAgIGlmIChsb2cpIHtcbiAgICAgICAgICAgIGxvZy5jYWxsKHdpbmRvdy5jb25zb2xlLCBkZXByZWNhdGlvbk1lc3NhZ2UsIHN0YWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBleHRlbmQgb2JqZWN0LlxuICogbWVhbnMgdGhhdCBwcm9wZXJ0aWVzIGluIGRlc3Qgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSB0aGUgb25lcyBpbiBzcmMuXG4gKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0XG4gKiBAcGFyYW0gey4uLk9iamVjdH0gb2JqZWN0c190b19hc3NpZ25cbiAqIEByZXR1cm5zIHtPYmplY3R9IHRhcmdldFxuICovXG52YXIgYXNzaWduO1xuaWYgKHR5cGVvZiBPYmplY3QuYXNzaWduICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKHRhcmdldCkge1xuICAgICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQgfHwgdGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvdXRwdXQgPSBPYmplY3QodGFyZ2V0KTtcbiAgICAgICAgZm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKHNvdXJjZSAhPT0gdW5kZWZpbmVkICYmIHNvdXJjZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG5leHRLZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkobmV4dEtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFtuZXh0S2V5XSA9IHNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG59IGVsc2Uge1xuICAgIGFzc2lnbiA9IE9iamVjdC5hc3NpZ247XG59XG5cbi8qKlxuICogZXh0ZW5kIG9iamVjdC5cbiAqIG1lYW5zIHRoYXQgcHJvcGVydGllcyBpbiBkZXN0IHdpbGwgYmUgb3ZlcndyaXR0ZW4gYnkgdGhlIG9uZXMgaW4gc3JjLlxuICogQHBhcmFtIHtPYmplY3R9IGRlc3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBzcmNcbiAqIEBwYXJhbSB7Qm9vbGVhbj1mYWxzZX0gW21lcmdlXVxuICogQHJldHVybnMge09iamVjdH0gZGVzdFxuICovXG52YXIgZXh0ZW5kID0gZGVwcmVjYXRlKGZ1bmN0aW9uIGV4dGVuZChkZXN0LCBzcmMsIG1lcmdlKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhzcmMpO1xuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGtleXMubGVuZ3RoKSB7XG4gICAgICAgIGlmICghbWVyZ2UgfHwgKG1lcmdlICYmIGRlc3Rba2V5c1tpXV0gPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIGRlc3Rba2V5c1tpXV0gPSBzcmNba2V5c1tpXV07XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbn0sICdleHRlbmQnLCAnVXNlIGBhc3NpZ25gLicpO1xuXG4vKipcbiAqIG1lcmdlIHRoZSB2YWx1ZXMgZnJvbSBzcmMgaW4gdGhlIGRlc3QuXG4gKiBtZWFucyB0aGF0IHByb3BlcnRpZXMgdGhhdCBleGlzdCBpbiBkZXN0IHdpbGwgbm90IGJlIG92ZXJ3cml0dGVuIGJ5IHNyY1xuICogQHBhcmFtIHtPYmplY3R9IGRlc3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBzcmNcbiAqIEByZXR1cm5zIHtPYmplY3R9IGRlc3RcbiAqL1xudmFyIG1lcmdlID0gZGVwcmVjYXRlKGZ1bmN0aW9uIG1lcmdlKGRlc3QsIHNyYykge1xuICAgIHJldHVybiBleHRlbmQoZGVzdCwgc3JjLCB0cnVlKTtcbn0sICdtZXJnZScsICdVc2UgYGFzc2lnbmAuJyk7XG5cbi8qKlxuICogc2ltcGxlIGNsYXNzIGluaGVyaXRhbmNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjaGlsZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gYmFzZVxuICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzXVxuICovXG5mdW5jdGlvbiBpbmhlcml0KGNoaWxkLCBiYXNlLCBwcm9wZXJ0aWVzKSB7XG4gICAgdmFyIGJhc2VQID0gYmFzZS5wcm90b3R5cGUsXG4gICAgICAgIGNoaWxkUDtcblxuICAgIGNoaWxkUCA9IGNoaWxkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoYmFzZVApO1xuICAgIGNoaWxkUC5jb25zdHJ1Y3RvciA9IGNoaWxkO1xuICAgIGNoaWxkUC5fc3VwZXIgPSBiYXNlUDtcblxuICAgIGlmIChwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGFzc2lnbihjaGlsZFAsIHByb3BlcnRpZXMpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBzaW1wbGUgZnVuY3Rpb24gYmluZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGJpbmRGbihmbiwgY29udGV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbiBib3VuZEZuKCkge1xuICAgICAgICByZXR1cm4gZm4uYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIGxldCBhIGJvb2xlYW4gdmFsdWUgYWxzbyBiZSBhIGZ1bmN0aW9uIHRoYXQgbXVzdCByZXR1cm4gYSBib29sZWFuXG4gKiB0aGlzIGZpcnN0IGl0ZW0gaW4gYXJncyB3aWxsIGJlIHVzZWQgYXMgdGhlIGNvbnRleHRcbiAqIEBwYXJhbSB7Qm9vbGVhbnxGdW5jdGlvbn0gdmFsXG4gKiBAcGFyYW0ge0FycmF5fSBbYXJnc11cbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5mdW5jdGlvbiBib29sT3JGbih2YWwsIGFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIHZhbCA9PSBUWVBFX0ZVTkNUSU9OKSB7XG4gICAgICAgIHJldHVybiB2YWwuYXBwbHkoYXJncyA/IGFyZ3NbMF0gfHwgdW5kZWZpbmVkIDogdW5kZWZpbmVkLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbDtcbn1cblxuLyoqXG4gKiB1c2UgdGhlIHZhbDIgd2hlbiB2YWwxIGlzIHVuZGVmaW5lZFxuICogQHBhcmFtIHsqfSB2YWwxXG4gKiBAcGFyYW0geyp9IHZhbDJcbiAqIEByZXR1cm5zIHsqfVxuICovXG5mdW5jdGlvbiBpZlVuZGVmaW5lZCh2YWwxLCB2YWwyKSB7XG4gICAgcmV0dXJuICh2YWwxID09PSB1bmRlZmluZWQpID8gdmFsMiA6IHZhbDE7XG59XG5cbi8qKlxuICogYWRkRXZlbnRMaXN0ZW5lciB3aXRoIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXRcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICovXG5mdW5jdGlvbiBhZGRFdmVudExpc3RlbmVycyh0YXJnZXQsIHR5cGVzLCBoYW5kbGVyKSB7XG4gICAgZWFjaChzcGxpdFN0cih0eXBlcyksIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIHJlbW92ZUV2ZW50TGlzdGVuZXIgd2l0aCBtdWx0aXBsZSBldmVudHMgYXQgb25jZVxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0XG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAqL1xuZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcnModGFyZ2V0LCB0eXBlcywgaGFuZGxlcikge1xuICAgIGVhY2goc3BsaXRTdHIodHlwZXMpLCBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBmaW5kIGlmIGEgbm9kZSBpcyBpbiB0aGUgZ2l2ZW4gcGFyZW50XG4gKiBAbWV0aG9kIGhhc1BhcmVudFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZVxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gcGFyZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufSBmb3VuZFxuICovXG5mdW5jdGlvbiBoYXNQYXJlbnQobm9kZSwgcGFyZW50KSB7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogc21hbGwgaW5kZXhPZiB3cmFwcGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICogQHJldHVybnMge0Jvb2xlYW59IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIGluU3RyKHN0ciwgZmluZCkge1xuICAgIHJldHVybiBzdHIuaW5kZXhPZihmaW5kKSA+IC0xO1xufVxuXG4vKipcbiAqIHNwbGl0IHN0cmluZyBvbiB3aGl0ZXNwYWNlXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJucyB7QXJyYXl9IHdvcmRzXG4gKi9cbmZ1bmN0aW9uIHNwbGl0U3RyKHN0cikge1xuICAgIHJldHVybiBzdHIudHJpbSgpLnNwbGl0KC9cXHMrL2cpO1xufVxuXG4vKipcbiAqIGZpbmQgaWYgYSBhcnJheSBjb250YWlucyB0aGUgb2JqZWN0IHVzaW5nIGluZGV4T2Ygb3IgYSBzaW1wbGUgcG9seUZpbGxcbiAqIEBwYXJhbSB7QXJyYXl9IHNyY1xuICogQHBhcmFtIHtTdHJpbmd9IGZpbmRcbiAqIEBwYXJhbSB7U3RyaW5nfSBbZmluZEJ5S2V5XVxuICogQHJldHVybiB7Qm9vbGVhbnxOdW1iZXJ9IGZhbHNlIHdoZW4gbm90IGZvdW5kLCBvciB0aGUgaW5kZXhcbiAqL1xuZnVuY3Rpb24gaW5BcnJheShzcmMsIGZpbmQsIGZpbmRCeUtleSkge1xuICAgIGlmIChzcmMuaW5kZXhPZiAmJiAhZmluZEJ5S2V5KSB7XG4gICAgICAgIHJldHVybiBzcmMuaW5kZXhPZihmaW5kKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgc3JjLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKChmaW5kQnlLZXkgJiYgc3JjW2ldW2ZpbmRCeUtleV0gPT0gZmluZCkgfHwgKCFmaW5kQnlLZXkgJiYgc3JjW2ldID09PSBmaW5kKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG59XG5cbi8qKlxuICogY29udmVydCBhcnJheS1saWtlIG9iamVjdHMgdG8gcmVhbCBhcnJheXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuZnVuY3Rpb24gdG9BcnJheShvYmopIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqLCAwKTtcbn1cblxuLyoqXG4gKiB1bmlxdWUgYXJyYXkgd2l0aCBvYmplY3RzIGJhc2VkIG9uIGEga2V5IChsaWtlICdpZCcpIG9yIGp1c3QgYnkgdGhlIGFycmF5J3MgdmFsdWVcbiAqIEBwYXJhbSB7QXJyYXl9IHNyYyBbe2lkOjF9LHtpZDoyfSx7aWQ6MX1dXG4gKiBAcGFyYW0ge1N0cmluZ30gW2tleV1cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW3NvcnQ9RmFsc2VdXG4gKiBAcmV0dXJucyB7QXJyYXl9IFt7aWQ6MX0se2lkOjJ9XVxuICovXG5mdW5jdGlvbiB1bmlxdWVBcnJheShzcmMsIGtleSwgc29ydCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgIHZhciBpID0gMDtcblxuICAgIHdoaWxlIChpIDwgc3JjLmxlbmd0aCkge1xuICAgICAgICB2YXIgdmFsID0ga2V5ID8gc3JjW2ldW2tleV0gOiBzcmNbaV07XG4gICAgICAgIGlmIChpbkFycmF5KHZhbHVlcywgdmFsKSA8IDApIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChzcmNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlc1tpXSA9IHZhbDtcbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIGlmIChzb3J0KSB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5zb3J0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5zb3J0KGZ1bmN0aW9uIHNvcnRVbmlxdWVBcnJheShhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFba2V5XSA+IGJba2V5XTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKlxuICogZ2V0IHRoZSBwcmVmaXhlZCBwcm9wZXJ0eVxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5XG4gKiBAcmV0dXJucyB7U3RyaW5nfFVuZGVmaW5lZH0gcHJlZml4ZWRcbiAqL1xuZnVuY3Rpb24gcHJlZml4ZWQob2JqLCBwcm9wZXJ0eSkge1xuICAgIHZhciBwcmVmaXgsIHByb3A7XG4gICAgdmFyIGNhbWVsUHJvcCA9IHByb3BlcnR5WzBdLnRvVXBwZXJDYXNlKCkgKyBwcm9wZXJ0eS5zbGljZSgxKTtcblxuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoaSA8IFZFTkRPUl9QUkVGSVhFUy5sZW5ndGgpIHtcbiAgICAgICAgcHJlZml4ID0gVkVORE9SX1BSRUZJWEVTW2ldO1xuICAgICAgICBwcm9wID0gKHByZWZpeCkgPyBwcmVmaXggKyBjYW1lbFByb3AgOiBwcm9wZXJ0eTtcblxuICAgICAgICBpZiAocHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9wO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBnZXQgYSB1bmlxdWUgaWRcbiAqIEByZXR1cm5zIHtudW1iZXJ9IHVuaXF1ZUlkXG4gKi9cbnZhciBfdW5pcXVlSWQgPSAxO1xuZnVuY3Rpb24gdW5pcXVlSWQoKSB7XG4gICAgcmV0dXJuIF91bmlxdWVJZCsrO1xufVxuXG4vKipcbiAqIGdldCB0aGUgd2luZG93IG9iamVjdCBvZiBhbiBlbGVtZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcmV0dXJucyB7RG9jdW1lbnRWaWV3fFdpbmRvd31cbiAqL1xuZnVuY3Rpb24gZ2V0V2luZG93Rm9yRWxlbWVudChlbGVtZW50KSB7XG4gICAgdmFyIGRvYyA9IGVsZW1lbnQub3duZXJEb2N1bWVudCB8fCBlbGVtZW50O1xuICAgIHJldHVybiAoZG9jLmRlZmF1bHRWaWV3IHx8IGRvYy5wYXJlbnRXaW5kb3cgfHwgd2luZG93KTtcbn1cblxudmFyIE1PQklMRV9SRUdFWCA9IC9tb2JpbGV8dGFibGV0fGlwKGFkfGhvbmV8b2QpfGFuZHJvaWQvaTtcblxudmFyIFNVUFBPUlRfVE9VQ0ggPSAoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KTtcbnZhciBTVVBQT1JUX1BPSU5URVJfRVZFTlRTID0gcHJlZml4ZWQod2luZG93LCAnUG9pbnRlckV2ZW50JykgIT09IHVuZGVmaW5lZDtcbnZhciBTVVBQT1JUX09OTFlfVE9VQ0ggPSBTVVBQT1JUX1RPVUNIICYmIE1PQklMRV9SRUdFWC50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG52YXIgSU5QVVRfVFlQRV9UT1VDSCA9ICd0b3VjaCc7XG52YXIgSU5QVVRfVFlQRV9QRU4gPSAncGVuJztcbnZhciBJTlBVVF9UWVBFX01PVVNFID0gJ21vdXNlJztcbnZhciBJTlBVVF9UWVBFX0tJTkVDVCA9ICdraW5lY3QnO1xuXG52YXIgQ09NUFVURV9JTlRFUlZBTCA9IDI1O1xuXG52YXIgSU5QVVRfU1RBUlQgPSAxO1xudmFyIElOUFVUX01PVkUgPSAyO1xudmFyIElOUFVUX0VORCA9IDQ7XG52YXIgSU5QVVRfQ0FOQ0VMID0gODtcblxudmFyIERJUkVDVElPTl9OT05FID0gMTtcbnZhciBESVJFQ1RJT05fTEVGVCA9IDI7XG52YXIgRElSRUNUSU9OX1JJR0hUID0gNDtcbnZhciBESVJFQ1RJT05fVVAgPSA4O1xudmFyIERJUkVDVElPTl9ET1dOID0gMTY7XG5cbnZhciBESVJFQ1RJT05fSE9SSVpPTlRBTCA9IERJUkVDVElPTl9MRUZUIHwgRElSRUNUSU9OX1JJR0hUO1xudmFyIERJUkVDVElPTl9WRVJUSUNBTCA9IERJUkVDVElPTl9VUCB8IERJUkVDVElPTl9ET1dOO1xudmFyIERJUkVDVElPTl9BTEwgPSBESVJFQ1RJT05fSE9SSVpPTlRBTCB8IERJUkVDVElPTl9WRVJUSUNBTDtcblxudmFyIFBST1BTX1hZID0gWyd4JywgJ3knXTtcbnZhciBQUk9QU19DTElFTlRfWFkgPSBbJ2NsaWVudFgnLCAnY2xpZW50WSddO1xuXG4vKipcbiAqIGNyZWF0ZSBuZXcgaW5wdXQgdHlwZSBtYW5hZ2VyXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJucyB7SW5wdXR9XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSW5wdXQobWFuYWdlciwgY2FsbGJhY2spIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgdGhpcy5lbGVtZW50ID0gbWFuYWdlci5lbGVtZW50O1xuICAgIHRoaXMudGFyZ2V0ID0gbWFuYWdlci5vcHRpb25zLmlucHV0VGFyZ2V0O1xuXG4gICAgLy8gc21hbGxlciB3cmFwcGVyIGFyb3VuZCB0aGUgaGFuZGxlciwgZm9yIHRoZSBzY29wZSBhbmQgdGhlIGVuYWJsZWQgc3RhdGUgb2YgdGhlIG1hbmFnZXIsXG4gICAgLy8gc28gd2hlbiBkaXNhYmxlZCB0aGUgaW5wdXQgZXZlbnRzIGFyZSBjb21wbGV0ZWx5IGJ5cGFzc2VkLlxuICAgIHRoaXMuZG9tSGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmIChib29sT3JGbihtYW5hZ2VyLm9wdGlvbnMuZW5hYmxlLCBbbWFuYWdlcl0pKSB7XG4gICAgICAgICAgICBzZWxmLmhhbmRsZXIoZXYpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdCgpO1xuXG59XG5cbklucHV0LnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBzaG91bGQgaGFuZGxlIHRoZSBpbnB1dEV2ZW50IGRhdGEgYW5kIHRyaWdnZXIgdGhlIGNhbGxiYWNrXG4gICAgICogQHZpcnR1YWxcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHsgfSxcblxuICAgIC8qKlxuICAgICAqIGJpbmQgdGhlIGV2ZW50c1xuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmV2RWwgJiYgYWRkRXZlbnRMaXN0ZW5lcnModGhpcy5lbGVtZW50LCB0aGlzLmV2RWwsIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgICAgIHRoaXMuZXZUYXJnZXQgJiYgYWRkRXZlbnRMaXN0ZW5lcnModGhpcy50YXJnZXQsIHRoaXMuZXZUYXJnZXQsIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgICAgIHRoaXMuZXZXaW4gJiYgYWRkRXZlbnRMaXN0ZW5lcnMoZ2V0V2luZG93Rm9yRWxlbWVudCh0aGlzLmVsZW1lbnQpLCB0aGlzLmV2V2luLCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB1bmJpbmQgdGhlIGV2ZW50c1xuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmV2RWwgJiYgcmVtb3ZlRXZlbnRMaXN0ZW5lcnModGhpcy5lbGVtZW50LCB0aGlzLmV2RWwsIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgICAgIHRoaXMuZXZUYXJnZXQgJiYgcmVtb3ZlRXZlbnRMaXN0ZW5lcnModGhpcy50YXJnZXQsIHRoaXMuZXZUYXJnZXQsIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgICAgIHRoaXMuZXZXaW4gJiYgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZ2V0V2luZG93Rm9yRWxlbWVudCh0aGlzLmVsZW1lbnQpLCB0aGlzLmV2V2luLCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgIH1cbn07XG5cbi8qKlxuICogY3JlYXRlIG5ldyBpbnB1dCB0eXBlIG1hbmFnZXJcbiAqIGNhbGxlZCBieSB0aGUgTWFuYWdlciBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtIYW1tZXJ9IG1hbmFnZXJcbiAqIEByZXR1cm5zIHtJbnB1dH1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlSW5wdXRJbnN0YW5jZShtYW5hZ2VyKSB7XG4gICAgdmFyIFR5cGU7XG4gICAgdmFyIGlucHV0Q2xhc3MgPSBtYW5hZ2VyLm9wdGlvbnMuaW5wdXRDbGFzcztcblxuICAgIGlmIChpbnB1dENsYXNzKSB7XG4gICAgICAgIFR5cGUgPSBpbnB1dENsYXNzO1xuICAgIH0gZWxzZSBpZiAoU1VQUE9SVF9QT0lOVEVSX0VWRU5UUykge1xuICAgICAgICBUeXBlID0gUG9pbnRlckV2ZW50SW5wdXQ7XG4gICAgfSBlbHNlIGlmIChTVVBQT1JUX09OTFlfVE9VQ0gpIHtcbiAgICAgICAgVHlwZSA9IFRvdWNoSW5wdXQ7XG4gICAgfSBlbHNlIGlmICghU1VQUE9SVF9UT1VDSCkge1xuICAgICAgICBUeXBlID0gTW91c2VJbnB1dDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBUeXBlID0gVG91Y2hNb3VzZUlucHV0O1xuICAgIH1cbiAgICByZXR1cm4gbmV3IChUeXBlKShtYW5hZ2VyLCBpbnB1dEhhbmRsZXIpO1xufVxuXG4vKipcbiAqIGhhbmRsZSBpbnB1dCBldmVudHNcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50VHlwZVxuICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gKi9cbmZ1bmN0aW9uIGlucHV0SGFuZGxlcihtYW5hZ2VyLCBldmVudFR5cGUsIGlucHV0KSB7XG4gICAgdmFyIHBvaW50ZXJzTGVuID0gaW5wdXQucG9pbnRlcnMubGVuZ3RoO1xuICAgIHZhciBjaGFuZ2VkUG9pbnRlcnNMZW4gPSBpbnB1dC5jaGFuZ2VkUG9pbnRlcnMubGVuZ3RoO1xuICAgIHZhciBpc0ZpcnN0ID0gKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUICYmIChwb2ludGVyc0xlbiAtIGNoYW5nZWRQb2ludGVyc0xlbiA9PT0gMCkpO1xuICAgIHZhciBpc0ZpbmFsID0gKGV2ZW50VHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpICYmIChwb2ludGVyc0xlbiAtIGNoYW5nZWRQb2ludGVyc0xlbiA9PT0gMCkpO1xuXG4gICAgaW5wdXQuaXNGaXJzdCA9ICEhaXNGaXJzdDtcbiAgICBpbnB1dC5pc0ZpbmFsID0gISFpc0ZpbmFsO1xuXG4gICAgaWYgKGlzRmlyc3QpIHtcbiAgICAgICAgbWFuYWdlci5zZXNzaW9uID0ge307XG4gICAgfVxuXG4gICAgLy8gc291cmNlIGV2ZW50IGlzIHRoZSBub3JtYWxpemVkIHZhbHVlIG9mIHRoZSBkb21FdmVudHNcbiAgICAvLyBsaWtlICd0b3VjaHN0YXJ0LCBtb3VzZXVwLCBwb2ludGVyZG93bidcbiAgICBpbnB1dC5ldmVudFR5cGUgPSBldmVudFR5cGU7XG5cbiAgICAvLyBjb21wdXRlIHNjYWxlLCByb3RhdGlvbiBldGNcbiAgICBjb21wdXRlSW5wdXREYXRhKG1hbmFnZXIsIGlucHV0KTtcblxuICAgIC8vIGVtaXQgc2VjcmV0IGV2ZW50XG4gICAgbWFuYWdlci5lbWl0KCdoYW1tZXIuaW5wdXQnLCBpbnB1dCk7XG5cbiAgICBtYW5hZ2VyLnJlY29nbml6ZShpbnB1dCk7XG4gICAgbWFuYWdlci5zZXNzaW9uLnByZXZJbnB1dCA9IGlucHV0O1xufVxuXG4vKipcbiAqIGV4dGVuZCB0aGUgZGF0YSB3aXRoIHNvbWUgdXNhYmxlIHByb3BlcnRpZXMgbGlrZSBzY2FsZSwgcm90YXRlLCB2ZWxvY2l0eSBldGNcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYW5hZ2VyXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUlucHV0RGF0YShtYW5hZ2VyLCBpbnB1dCkge1xuICAgIHZhciBzZXNzaW9uID0gbWFuYWdlci5zZXNzaW9uO1xuICAgIHZhciBwb2ludGVycyA9IGlucHV0LnBvaW50ZXJzO1xuICAgIHZhciBwb2ludGVyc0xlbmd0aCA9IHBvaW50ZXJzLmxlbmd0aDtcblxuICAgIC8vIHN0b3JlIHRoZSBmaXJzdCBpbnB1dCB0byBjYWxjdWxhdGUgdGhlIGRpc3RhbmNlIGFuZCBkaXJlY3Rpb25cbiAgICBpZiAoIXNlc3Npb24uZmlyc3RJbnB1dCkge1xuICAgICAgICBzZXNzaW9uLmZpcnN0SW5wdXQgPSBzaW1wbGVDbG9uZUlucHV0RGF0YShpbnB1dCk7XG4gICAgfVxuXG4gICAgLy8gdG8gY29tcHV0ZSBzY2FsZSBhbmQgcm90YXRpb24gd2UgbmVlZCB0byBzdG9yZSB0aGUgbXVsdGlwbGUgdG91Y2hlc1xuICAgIGlmIChwb2ludGVyc0xlbmd0aCA+IDEgJiYgIXNlc3Npb24uZmlyc3RNdWx0aXBsZSkge1xuICAgICAgICBzZXNzaW9uLmZpcnN0TXVsdGlwbGUgPSBzaW1wbGVDbG9uZUlucHV0RGF0YShpbnB1dCk7XG4gICAgfSBlbHNlIGlmIChwb2ludGVyc0xlbmd0aCA9PT0gMSkge1xuICAgICAgICBzZXNzaW9uLmZpcnN0TXVsdGlwbGUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZmlyc3RJbnB1dCA9IHNlc3Npb24uZmlyc3RJbnB1dDtcbiAgICB2YXIgZmlyc3RNdWx0aXBsZSA9IHNlc3Npb24uZmlyc3RNdWx0aXBsZTtcbiAgICB2YXIgb2Zmc2V0Q2VudGVyID0gZmlyc3RNdWx0aXBsZSA/IGZpcnN0TXVsdGlwbGUuY2VudGVyIDogZmlyc3RJbnB1dC5jZW50ZXI7XG5cbiAgICB2YXIgY2VudGVyID0gaW5wdXQuY2VudGVyID0gZ2V0Q2VudGVyKHBvaW50ZXJzKTtcbiAgICBpbnB1dC50aW1lU3RhbXAgPSBub3coKTtcbiAgICBpbnB1dC5kZWx0YVRpbWUgPSBpbnB1dC50aW1lU3RhbXAgLSBmaXJzdElucHV0LnRpbWVTdGFtcDtcblxuICAgIGlucHV0LmFuZ2xlID0gZ2V0QW5nbGUob2Zmc2V0Q2VudGVyLCBjZW50ZXIpO1xuICAgIGlucHV0LmRpc3RhbmNlID0gZ2V0RGlzdGFuY2Uob2Zmc2V0Q2VudGVyLCBjZW50ZXIpO1xuXG4gICAgY29tcHV0ZURlbHRhWFkoc2Vzc2lvbiwgaW5wdXQpO1xuICAgIGlucHV0Lm9mZnNldERpcmVjdGlvbiA9IGdldERpcmVjdGlvbihpbnB1dC5kZWx0YVgsIGlucHV0LmRlbHRhWSk7XG5cbiAgICB2YXIgb3ZlcmFsbFZlbG9jaXR5ID0gZ2V0VmVsb2NpdHkoaW5wdXQuZGVsdGFUaW1lLCBpbnB1dC5kZWx0YVgsIGlucHV0LmRlbHRhWSk7XG4gICAgaW5wdXQub3ZlcmFsbFZlbG9jaXR5WCA9IG92ZXJhbGxWZWxvY2l0eS54O1xuICAgIGlucHV0Lm92ZXJhbGxWZWxvY2l0eVkgPSBvdmVyYWxsVmVsb2NpdHkueTtcbiAgICBpbnB1dC5vdmVyYWxsVmVsb2NpdHkgPSAoYWJzKG92ZXJhbGxWZWxvY2l0eS54KSA+IGFicyhvdmVyYWxsVmVsb2NpdHkueSkpID8gb3ZlcmFsbFZlbG9jaXR5LnggOiBvdmVyYWxsVmVsb2NpdHkueTtcblxuICAgIGlucHV0LnNjYWxlID0gZmlyc3RNdWx0aXBsZSA/IGdldFNjYWxlKGZpcnN0TXVsdGlwbGUucG9pbnRlcnMsIHBvaW50ZXJzKSA6IDE7XG4gICAgaW5wdXQucm90YXRpb24gPSBmaXJzdE11bHRpcGxlID8gZ2V0Um90YXRpb24oZmlyc3RNdWx0aXBsZS5wb2ludGVycywgcG9pbnRlcnMpIDogMDtcblxuICAgIGlucHV0Lm1heFBvaW50ZXJzID0gIXNlc3Npb24ucHJldklucHV0ID8gaW5wdXQucG9pbnRlcnMubGVuZ3RoIDogKChpbnB1dC5wb2ludGVycy5sZW5ndGggPlxuICAgICAgICBzZXNzaW9uLnByZXZJbnB1dC5tYXhQb2ludGVycykgPyBpbnB1dC5wb2ludGVycy5sZW5ndGggOiBzZXNzaW9uLnByZXZJbnB1dC5tYXhQb2ludGVycyk7XG5cbiAgICBjb21wdXRlSW50ZXJ2YWxJbnB1dERhdGEoc2Vzc2lvbiwgaW5wdXQpO1xuXG4gICAgLy8gZmluZCB0aGUgY29ycmVjdCB0YXJnZXRcbiAgICB2YXIgdGFyZ2V0ID0gbWFuYWdlci5lbGVtZW50O1xuICAgIGlmIChoYXNQYXJlbnQoaW5wdXQuc3JjRXZlbnQudGFyZ2V0LCB0YXJnZXQpKSB7XG4gICAgICAgIHRhcmdldCA9IGlucHV0LnNyY0V2ZW50LnRhcmdldDtcbiAgICB9XG4gICAgaW5wdXQudGFyZ2V0ID0gdGFyZ2V0O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRGVsdGFYWShzZXNzaW9uLCBpbnB1dCkge1xuICAgIHZhciBjZW50ZXIgPSBpbnB1dC5jZW50ZXI7XG4gICAgdmFyIG9mZnNldCA9IHNlc3Npb24ub2Zmc2V0RGVsdGEgfHwge307XG4gICAgdmFyIHByZXZEZWx0YSA9IHNlc3Npb24ucHJldkRlbHRhIHx8IHt9O1xuICAgIHZhciBwcmV2SW5wdXQgPSBzZXNzaW9uLnByZXZJbnB1dCB8fCB7fTtcblxuICAgIGlmIChpbnB1dC5ldmVudFR5cGUgPT09IElOUFVUX1NUQVJUIHx8IHByZXZJbnB1dC5ldmVudFR5cGUgPT09IElOUFVUX0VORCkge1xuICAgICAgICBwcmV2RGVsdGEgPSBzZXNzaW9uLnByZXZEZWx0YSA9IHtcbiAgICAgICAgICAgIHg6IHByZXZJbnB1dC5kZWx0YVggfHwgMCxcbiAgICAgICAgICAgIHk6IHByZXZJbnB1dC5kZWx0YVkgfHwgMFxuICAgICAgICB9O1xuXG4gICAgICAgIG9mZnNldCA9IHNlc3Npb24ub2Zmc2V0RGVsdGEgPSB7XG4gICAgICAgICAgICB4OiBjZW50ZXIueCxcbiAgICAgICAgICAgIHk6IGNlbnRlci55XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaW5wdXQuZGVsdGFYID0gcHJldkRlbHRhLnggKyAoY2VudGVyLnggLSBvZmZzZXQueCk7XG4gICAgaW5wdXQuZGVsdGFZID0gcHJldkRlbHRhLnkgKyAoY2VudGVyLnkgLSBvZmZzZXQueSk7XG59XG5cbi8qKlxuICogdmVsb2NpdHkgaXMgY2FsY3VsYXRlZCBldmVyeSB4IG1zXG4gKiBAcGFyYW0ge09iamVjdH0gc2Vzc2lvblxuICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVJbnRlcnZhbElucHV0RGF0YShzZXNzaW9uLCBpbnB1dCkge1xuICAgIHZhciBsYXN0ID0gc2Vzc2lvbi5sYXN0SW50ZXJ2YWwgfHwgaW5wdXQsXG4gICAgICAgIGRlbHRhVGltZSA9IGlucHV0LnRpbWVTdGFtcCAtIGxhc3QudGltZVN0YW1wLFxuICAgICAgICB2ZWxvY2l0eSwgdmVsb2NpdHlYLCB2ZWxvY2l0eVksIGRpcmVjdGlvbjtcblxuICAgIGlmIChpbnB1dC5ldmVudFR5cGUgIT0gSU5QVVRfQ0FOQ0VMICYmIChkZWx0YVRpbWUgPiBDT01QVVRFX0lOVEVSVkFMIHx8IGxhc3QudmVsb2NpdHkgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgdmFyIGRlbHRhWCA9IGlucHV0LmRlbHRhWCAtIGxhc3QuZGVsdGFYO1xuICAgICAgICB2YXIgZGVsdGFZID0gaW5wdXQuZGVsdGFZIC0gbGFzdC5kZWx0YVk7XG5cbiAgICAgICAgdmFyIHYgPSBnZXRWZWxvY2l0eShkZWx0YVRpbWUsIGRlbHRhWCwgZGVsdGFZKTtcbiAgICAgICAgdmVsb2NpdHlYID0gdi54O1xuICAgICAgICB2ZWxvY2l0eVkgPSB2Lnk7XG4gICAgICAgIHZlbG9jaXR5ID0gKGFicyh2LngpID4gYWJzKHYueSkpID8gdi54IDogdi55O1xuICAgICAgICBkaXJlY3Rpb24gPSBnZXREaXJlY3Rpb24oZGVsdGFYLCBkZWx0YVkpO1xuXG4gICAgICAgIHNlc3Npb24ubGFzdEludGVydmFsID0gaW5wdXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdXNlIGxhdGVzdCB2ZWxvY2l0eSBpbmZvIGlmIGl0IGRvZXNuJ3Qgb3ZlcnRha2UgYSBtaW5pbXVtIHBlcmlvZFxuICAgICAgICB2ZWxvY2l0eSA9IGxhc3QudmVsb2NpdHk7XG4gICAgICAgIHZlbG9jaXR5WCA9IGxhc3QudmVsb2NpdHlYO1xuICAgICAgICB2ZWxvY2l0eVkgPSBsYXN0LnZlbG9jaXR5WTtcbiAgICAgICAgZGlyZWN0aW9uID0gbGFzdC5kaXJlY3Rpb247XG4gICAgfVxuXG4gICAgaW5wdXQudmVsb2NpdHkgPSB2ZWxvY2l0eTtcbiAgICBpbnB1dC52ZWxvY2l0eVggPSB2ZWxvY2l0eVg7XG4gICAgaW5wdXQudmVsb2NpdHlZID0gdmVsb2NpdHlZO1xuICAgIGlucHV0LmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbn1cblxuLyoqXG4gKiBjcmVhdGUgYSBzaW1wbGUgY2xvbmUgZnJvbSB0aGUgaW5wdXQgdXNlZCBmb3Igc3RvcmFnZSBvZiBmaXJzdElucHV0IGFuZCBmaXJzdE11bHRpcGxlXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqIEByZXR1cm5zIHtPYmplY3R9IGNsb25lZElucHV0RGF0YVxuICovXG5mdW5jdGlvbiBzaW1wbGVDbG9uZUlucHV0RGF0YShpbnB1dCkge1xuICAgIC8vIG1ha2UgYSBzaW1wbGUgY29weSBvZiB0aGUgcG9pbnRlcnMgYmVjYXVzZSB3ZSB3aWxsIGdldCBhIHJlZmVyZW5jZSBpZiB3ZSBkb24ndFxuICAgIC8vIHdlIG9ubHkgbmVlZCBjbGllbnRYWSBmb3IgdGhlIGNhbGN1bGF0aW9uc1xuICAgIHZhciBwb2ludGVycyA9IFtdO1xuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGlucHV0LnBvaW50ZXJzLmxlbmd0aCkge1xuICAgICAgICBwb2ludGVyc1tpXSA9IHtcbiAgICAgICAgICAgIGNsaWVudFg6IHJvdW5kKGlucHV0LnBvaW50ZXJzW2ldLmNsaWVudFgpLFxuICAgICAgICAgICAgY2xpZW50WTogcm91bmQoaW5wdXQucG9pbnRlcnNbaV0uY2xpZW50WSlcbiAgICAgICAgfTtcbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHRpbWVTdGFtcDogbm93KCksXG4gICAgICAgIHBvaW50ZXJzOiBwb2ludGVycyxcbiAgICAgICAgY2VudGVyOiBnZXRDZW50ZXIocG9pbnRlcnMpLFxuICAgICAgICBkZWx0YVg6IGlucHV0LmRlbHRhWCxcbiAgICAgICAgZGVsdGFZOiBpbnB1dC5kZWx0YVlcbiAgICB9O1xufVxuXG4vKipcbiAqIGdldCB0aGUgY2VudGVyIG9mIGFsbCB0aGUgcG9pbnRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IHBvaW50ZXJzXG4gKiBAcmV0dXJuIHtPYmplY3R9IGNlbnRlciBjb250YWlucyBgeGAgYW5kIGB5YCBwcm9wZXJ0aWVzXG4gKi9cbmZ1bmN0aW9uIGdldENlbnRlcihwb2ludGVycykge1xuICAgIHZhciBwb2ludGVyc0xlbmd0aCA9IHBvaW50ZXJzLmxlbmd0aDtcblxuICAgIC8vIG5vIG5lZWQgdG8gbG9vcCB3aGVuIG9ubHkgb25lIHRvdWNoXG4gICAgaWYgKHBvaW50ZXJzTGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiByb3VuZChwb2ludGVyc1swXS5jbGllbnRYKSxcbiAgICAgICAgICAgIHk6IHJvdW5kKHBvaW50ZXJzWzBdLmNsaWVudFkpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHggPSAwLCB5ID0gMCwgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBwb2ludGVyc0xlbmd0aCkge1xuICAgICAgICB4ICs9IHBvaW50ZXJzW2ldLmNsaWVudFg7XG4gICAgICAgIHkgKz0gcG9pbnRlcnNbaV0uY2xpZW50WTtcbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHJvdW5kKHggLyBwb2ludGVyc0xlbmd0aCksXG4gICAgICAgIHk6IHJvdW5kKHkgLyBwb2ludGVyc0xlbmd0aClcbiAgICB9O1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgdmVsb2NpdHkgYmV0d2VlbiB0d28gcG9pbnRzLiB1bml0IGlzIGluIHB4IHBlciBtcy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVRpbWVcbiAqIEBwYXJhbSB7TnVtYmVyfSB4XG4gKiBAcGFyYW0ge051bWJlcn0geVxuICogQHJldHVybiB7T2JqZWN0fSB2ZWxvY2l0eSBgeGAgYW5kIGB5YFxuICovXG5mdW5jdGlvbiBnZXRWZWxvY2l0eShkZWx0YVRpbWUsIHgsIHkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB4OiB4IC8gZGVsdGFUaW1lIHx8IDAsXG4gICAgICAgIHk6IHkgLyBkZWx0YVRpbWUgfHwgMFxuICAgIH07XG59XG5cbi8qKlxuICogZ2V0IHRoZSBkaXJlY3Rpb24gYmV0d2VlbiB0d28gcG9pbnRzXG4gKiBAcGFyYW0ge051bWJlcn0geFxuICogQHBhcmFtIHtOdW1iZXJ9IHlcbiAqIEByZXR1cm4ge051bWJlcn0gZGlyZWN0aW9uXG4gKi9cbmZ1bmN0aW9uIGdldERpcmVjdGlvbih4LCB5KSB7XG4gICAgaWYgKHggPT09IHkpIHtcbiAgICAgICAgcmV0dXJuIERJUkVDVElPTl9OT05FO1xuICAgIH1cblxuICAgIGlmIChhYnMoeCkgPj0gYWJzKHkpKSB7XG4gICAgICAgIHJldHVybiB4IDwgMCA/IERJUkVDVElPTl9MRUZUIDogRElSRUNUSU9OX1JJR0hUO1xuICAgIH1cbiAgICByZXR1cm4geSA8IDAgPyBESVJFQ1RJT05fVVAgOiBESVJFQ1RJT05fRE9XTjtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgdGhlIGFic29sdXRlIGRpc3RhbmNlIGJldHdlZW4gdHdvIHBvaW50c1xuICogQHBhcmFtIHtPYmplY3R9IHAxIHt4LCB5fVxuICogQHBhcmFtIHtPYmplY3R9IHAyIHt4LCB5fVxuICogQHBhcmFtIHtBcnJheX0gW3Byb3BzXSBjb250YWluaW5nIHggYW5kIHkga2V5c1xuICogQHJldHVybiB7TnVtYmVyfSBkaXN0YW5jZVxuICovXG5mdW5jdGlvbiBnZXREaXN0YW5jZShwMSwgcDIsIHByb3BzKSB7XG4gICAgaWYgKCFwcm9wcykge1xuICAgICAgICBwcm9wcyA9IFBST1BTX1hZO1xuICAgIH1cbiAgICB2YXIgeCA9IHAyW3Byb3BzWzBdXSAtIHAxW3Byb3BzWzBdXSxcbiAgICAgICAgeSA9IHAyW3Byb3BzWzFdXSAtIHAxW3Byb3BzWzFdXTtcblxuICAgIHJldHVybiBNYXRoLnNxcnQoKHggKiB4KSArICh5ICogeSkpO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgYW5nbGUgYmV0d2VlbiB0d28gY29vcmRpbmF0ZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBwMVxuICogQHBhcmFtIHtPYmplY3R9IHAyXG4gKiBAcGFyYW0ge0FycmF5fSBbcHJvcHNdIGNvbnRhaW5pbmcgeCBhbmQgeSBrZXlzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGFuZ2xlXG4gKi9cbmZ1bmN0aW9uIGdldEFuZ2xlKHAxLCBwMiwgcHJvcHMpIHtcbiAgICBpZiAoIXByb3BzKSB7XG4gICAgICAgIHByb3BzID0gUFJPUFNfWFk7XG4gICAgfVxuICAgIHZhciB4ID0gcDJbcHJvcHNbMF1dIC0gcDFbcHJvcHNbMF1dLFxuICAgICAgICB5ID0gcDJbcHJvcHNbMV1dIC0gcDFbcHJvcHNbMV1dO1xuICAgIHJldHVybiBNYXRoLmF0YW4yKHksIHgpICogMTgwIC8gTWF0aC5QSTtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgdGhlIHJvdGF0aW9uIGRlZ3JlZXMgYmV0d2VlbiB0d28gcG9pbnRlcnNldHNcbiAqIEBwYXJhbSB7QXJyYXl9IHN0YXJ0IGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBlbmQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEByZXR1cm4ge051bWJlcn0gcm90YXRpb25cbiAqL1xuZnVuY3Rpb24gZ2V0Um90YXRpb24oc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiBnZXRBbmdsZShlbmRbMV0sIGVuZFswXSwgUFJPUFNfQ0xJRU5UX1hZKSArIGdldEFuZ2xlKHN0YXJ0WzFdLCBzdGFydFswXSwgUFJPUFNfQ0xJRU5UX1hZKTtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgdGhlIHNjYWxlIGZhY3RvciBiZXR3ZWVuIHR3byBwb2ludGVyc2V0c1xuICogbm8gc2NhbGUgaXMgMSwgYW5kIGdvZXMgZG93biB0byAwIHdoZW4gcGluY2hlZCB0b2dldGhlciwgYW5kIGJpZ2dlciB3aGVuIHBpbmNoZWQgb3V0XG4gKiBAcGFyYW0ge0FycmF5fSBzdGFydCBhcnJheSBvZiBwb2ludGVyc1xuICogQHBhcmFtIHtBcnJheX0gZW5kIGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHNjYWxlXG4gKi9cbmZ1bmN0aW9uIGdldFNjYWxlKHN0YXJ0LCBlbmQpIHtcbiAgICByZXR1cm4gZ2V0RGlzdGFuY2UoZW5kWzBdLCBlbmRbMV0sIFBST1BTX0NMSUVOVF9YWSkgLyBnZXREaXN0YW5jZShzdGFydFswXSwgc3RhcnRbMV0sIFBST1BTX0NMSUVOVF9YWSk7XG59XG5cbnZhciBNT1VTRV9JTlBVVF9NQVAgPSB7XG4gICAgbW91c2Vkb3duOiBJTlBVVF9TVEFSVCxcbiAgICBtb3VzZW1vdmU6IElOUFVUX01PVkUsXG4gICAgbW91c2V1cDogSU5QVVRfRU5EXG59O1xuXG52YXIgTU9VU0VfRUxFTUVOVF9FVkVOVFMgPSAnbW91c2Vkb3duJztcbnZhciBNT1VTRV9XSU5ET1dfRVZFTlRTID0gJ21vdXNlbW92ZSBtb3VzZXVwJztcblxuLyoqXG4gKiBNb3VzZSBldmVudHMgaW5wdXRcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gTW91c2VJbnB1dCgpIHtcbiAgICB0aGlzLmV2RWwgPSBNT1VTRV9FTEVNRU5UX0VWRU5UUztcbiAgICB0aGlzLmV2V2luID0gTU9VU0VfV0lORE9XX0VWRU5UUztcblxuICAgIHRoaXMuYWxsb3cgPSB0cnVlOyAvLyB1c2VkIGJ5IElucHV0LlRvdWNoTW91c2UgdG8gZGlzYWJsZSBtb3VzZSBldmVudHNcbiAgICB0aGlzLnByZXNzZWQgPSBmYWxzZTsgLy8gbW91c2Vkb3duIHN0YXRlXG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KE1vdXNlSW5wdXQsIElucHV0LCB7XG4gICAgLyoqXG4gICAgICogaGFuZGxlIG1vdXNlIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIE1FaGFuZGxlcihldikge1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gTU9VU0VfSU5QVVRfTUFQW2V2LnR5cGVdO1xuXG4gICAgICAgIC8vIG9uIHN0YXJ0IHdlIHdhbnQgdG8gaGF2ZSB0aGUgbGVmdCBtb3VzZSBidXR0b24gZG93blxuICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgZXYuYnV0dG9uID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX01PVkUgJiYgZXYud2hpY2ggIT09IDEpIHtcbiAgICAgICAgICAgIGV2ZW50VHlwZSA9IElOUFVUX0VORDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG1vdXNlIG11c3QgYmUgZG93biwgYW5kIG1vdXNlIGV2ZW50cyBhcmUgYWxsb3dlZCAoc2VlIHRoZSBUb3VjaE1vdXNlIGlucHV0KVxuICAgICAgICBpZiAoIXRoaXMucHJlc3NlZCB8fCAhdGhpcy5hbGxvdykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX0VORCkge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgZXZlbnRUeXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogW2V2XSxcbiAgICAgICAgICAgIGNoYW5nZWRQb2ludGVyczogW2V2XSxcbiAgICAgICAgICAgIHBvaW50ZXJUeXBlOiBJTlBVVF9UWVBFX01PVVNFLFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG52YXIgUE9JTlRFUl9JTlBVVF9NQVAgPSB7XG4gICAgcG9pbnRlcmRvd246IElOUFVUX1NUQVJULFxuICAgIHBvaW50ZXJtb3ZlOiBJTlBVVF9NT1ZFLFxuICAgIHBvaW50ZXJ1cDogSU5QVVRfRU5ELFxuICAgIHBvaW50ZXJjYW5jZWw6IElOUFVUX0NBTkNFTCxcbiAgICBwb2ludGVyb3V0OiBJTlBVVF9DQU5DRUxcbn07XG5cbi8vIGluIElFMTAgdGhlIHBvaW50ZXIgdHlwZXMgaXMgZGVmaW5lZCBhcyBhbiBlbnVtXG52YXIgSUUxMF9QT0lOVEVSX1RZUEVfRU5VTSA9IHtcbiAgICAyOiBJTlBVVF9UWVBFX1RPVUNILFxuICAgIDM6IElOUFVUX1RZUEVfUEVOLFxuICAgIDQ6IElOUFVUX1RZUEVfTU9VU0UsXG4gICAgNTogSU5QVVRfVFlQRV9LSU5FQ1QgLy8gc2VlIGh0dHBzOi8vdHdpdHRlci5jb20vamFjb2Jyb3NzaS9zdGF0dXMvNDgwNTk2NDM4NDg5ODkwODE2XG59O1xuXG52YXIgUE9JTlRFUl9FTEVNRU5UX0VWRU5UUyA9ICdwb2ludGVyZG93bic7XG52YXIgUE9JTlRFUl9XSU5ET1dfRVZFTlRTID0gJ3BvaW50ZXJtb3ZlIHBvaW50ZXJ1cCBwb2ludGVyY2FuY2VsJztcblxuLy8gSUUxMCBoYXMgcHJlZml4ZWQgc3VwcG9ydCwgYW5kIGNhc2Utc2Vuc2l0aXZlXG5pZiAod2luZG93Lk1TUG9pbnRlckV2ZW50ICYmICF3aW5kb3cuUG9pbnRlckV2ZW50KSB7XG4gICAgUE9JTlRFUl9FTEVNRU5UX0VWRU5UUyA9ICdNU1BvaW50ZXJEb3duJztcbiAgICBQT0lOVEVSX1dJTkRPV19FVkVOVFMgPSAnTVNQb2ludGVyTW92ZSBNU1BvaW50ZXJVcCBNU1BvaW50ZXJDYW5jZWwnO1xufVxuXG4vKipcbiAqIFBvaW50ZXIgZXZlbnRzIGlucHV0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIFBvaW50ZXJFdmVudElucHV0KCkge1xuICAgIHRoaXMuZXZFbCA9IFBPSU5URVJfRUxFTUVOVF9FVkVOVFM7XG4gICAgdGhpcy5ldldpbiA9IFBPSU5URVJfV0lORE9XX0VWRU5UUztcblxuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLnN0b3JlID0gKHRoaXMubWFuYWdlci5zZXNzaW9uLnBvaW50ZXJFdmVudHMgPSBbXSk7XG59XG5cbmluaGVyaXQoUG9pbnRlckV2ZW50SW5wdXQsIElucHV0LCB7XG4gICAgLyoqXG4gICAgICogaGFuZGxlIG1vdXNlIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIFBFaGFuZGxlcihldikge1xuICAgICAgICB2YXIgc3RvcmUgPSB0aGlzLnN0b3JlO1xuICAgICAgICB2YXIgcmVtb3ZlUG9pbnRlciA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBldmVudFR5cGVOb3JtYWxpemVkID0gZXYudHlwZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJ21zJywgJycpO1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gUE9JTlRFUl9JTlBVVF9NQVBbZXZlbnRUeXBlTm9ybWFsaXplZF07XG4gICAgICAgIHZhciBwb2ludGVyVHlwZSA9IElFMTBfUE9JTlRFUl9UWVBFX0VOVU1bZXYucG9pbnRlclR5cGVdIHx8IGV2LnBvaW50ZXJUeXBlO1xuXG4gICAgICAgIHZhciBpc1RvdWNoID0gKHBvaW50ZXJUeXBlID09IElOUFVUX1RZUEVfVE9VQ0gpO1xuXG4gICAgICAgIC8vIGdldCBpbmRleCBvZiB0aGUgZXZlbnQgaW4gdGhlIHN0b3JlXG4gICAgICAgIHZhciBzdG9yZUluZGV4ID0gaW5BcnJheShzdG9yZSwgZXYucG9pbnRlcklkLCAncG9pbnRlcklkJyk7XG5cbiAgICAgICAgLy8gc3RhcnQgYW5kIG1vdXNlIG11c3QgYmUgZG93blxuICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgKGV2LmJ1dHRvbiA9PT0gMCB8fCBpc1RvdWNoKSkge1xuICAgICAgICAgICAgaWYgKHN0b3JlSW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgICAgc3RvcmUucHVzaChldik7XG4gICAgICAgICAgICAgICAgc3RvcmVJbmRleCA9IHN0b3JlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgICAgIHJlbW92ZVBvaW50ZXIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaXQgbm90IGZvdW5kLCBzbyB0aGUgcG9pbnRlciBoYXNuJ3QgYmVlbiBkb3duIChzbyBpdCdzIHByb2JhYmx5IGEgaG92ZXIpXG4gICAgICAgIGlmIChzdG9yZUluZGV4IDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBldmVudCBpbiB0aGUgc3RvcmVcbiAgICAgICAgc3RvcmVbc3RvcmVJbmRleF0gPSBldjtcblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgZXZlbnRUeXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogc3RvcmUsXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogcG9pbnRlclR5cGUsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlbW92ZVBvaW50ZXIpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBmcm9tIHRoZSBzdG9yZVxuICAgICAgICAgICAgc3RvcmUuc3BsaWNlKHN0b3JlSW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbnZhciBTSU5HTEVfVE9VQ0hfSU5QVVRfTUFQID0ge1xuICAgIHRvdWNoc3RhcnQ6IElOUFVUX1NUQVJULFxuICAgIHRvdWNobW92ZTogSU5QVVRfTU9WRSxcbiAgICB0b3VjaGVuZDogSU5QVVRfRU5ELFxuICAgIHRvdWNoY2FuY2VsOiBJTlBVVF9DQU5DRUxcbn07XG5cbnZhciBTSU5HTEVfVE9VQ0hfVEFSR0VUX0VWRU5UUyA9ICd0b3VjaHN0YXJ0JztcbnZhciBTSU5HTEVfVE9VQ0hfV0lORE9XX0VWRU5UUyA9ICd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCc7XG5cbi8qKlxuICogVG91Y2ggZXZlbnRzIGlucHV0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIFNpbmdsZVRvdWNoSW5wdXQoKSB7XG4gICAgdGhpcy5ldlRhcmdldCA9IFNJTkdMRV9UT1VDSF9UQVJHRVRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBTSU5HTEVfVE9VQ0hfV0lORE9XX0VWRU5UUztcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcblxuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoU2luZ2xlVG91Y2hJbnB1dCwgSW5wdXQsIHtcbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBURWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBTSU5HTEVfVE9VQ0hfSU5QVVRfTUFQW2V2LnR5cGVdO1xuXG4gICAgICAgIC8vIHNob3VsZCB3ZSBoYW5kbGUgdGhlIHRvdWNoIGV2ZW50cz9cbiAgICAgICAgaWYgKHR5cGUgPT09IElOUFVUX1NUQVJUKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b3VjaGVzID0gbm9ybWFsaXplU2luZ2xlVG91Y2hlcy5jYWxsKHRoaXMsIGV2LCB0eXBlKTtcblxuICAgICAgICAvLyB3aGVuIGRvbmUsIHJlc2V0IHRoZSBzdGFydGVkIHN0YXRlXG4gICAgICAgIGlmICh0eXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkgJiYgdG91Y2hlc1swXS5sZW5ndGggLSB0b3VjaGVzWzFdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgdHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHRvdWNoZXNbMF0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IHRvdWNoZXNbMV0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBAdGhpcyB7VG91Y2hJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICogQHBhcmFtIHtOdW1iZXJ9IHR5cGUgZmxhZ1xuICogQHJldHVybnMge3VuZGVmaW5lZHxBcnJheX0gW2FsbCwgY2hhbmdlZF1cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplU2luZ2xlVG91Y2hlcyhldiwgdHlwZSkge1xuICAgIHZhciBhbGwgPSB0b0FycmF5KGV2LnRvdWNoZXMpO1xuICAgIHZhciBjaGFuZ2VkID0gdG9BcnJheShldi5jaGFuZ2VkVG91Y2hlcyk7XG5cbiAgICBpZiAodHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgIGFsbCA9IHVuaXF1ZUFycmF5KGFsbC5jb25jYXQoY2hhbmdlZCksICdpZGVudGlmaWVyJywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFthbGwsIGNoYW5nZWRdO1xufVxuXG52YXIgVE9VQ0hfSU5QVVRfTUFQID0ge1xuICAgIHRvdWNoc3RhcnQ6IElOUFVUX1NUQVJULFxuICAgIHRvdWNobW92ZTogSU5QVVRfTU9WRSxcbiAgICB0b3VjaGVuZDogSU5QVVRfRU5ELFxuICAgIHRvdWNoY2FuY2VsOiBJTlBVVF9DQU5DRUxcbn07XG5cbnZhciBUT1VDSF9UQVJHRVRfRVZFTlRTID0gJ3RvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIHRvdWNoY2FuY2VsJztcblxuLyoqXG4gKiBNdWx0aS11c2VyIHRvdWNoIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBUb3VjaElucHV0KCkge1xuICAgIHRoaXMuZXZUYXJnZXQgPSBUT1VDSF9UQVJHRVRfRVZFTlRTO1xuICAgIHRoaXMudGFyZ2V0SWRzID0ge307XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFRvdWNoSW5wdXQsIElucHV0LCB7XG4gICAgaGFuZGxlcjogZnVuY3Rpb24gTVRFaGFuZGxlcihldikge1xuICAgICAgICB2YXIgdHlwZSA9IFRPVUNIX0lOUFVUX01BUFtldi50eXBlXTtcbiAgICAgICAgdmFyIHRvdWNoZXMgPSBnZXRUb3VjaGVzLmNhbGwodGhpcywgZXYsIHR5cGUpO1xuICAgICAgICBpZiAoIXRvdWNoZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5tYW5hZ2VyLCB0eXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogdG91Y2hlc1swXSxcbiAgICAgICAgICAgIGNoYW5nZWRQb2ludGVyczogdG91Y2hlc1sxXSxcbiAgICAgICAgICAgIHBvaW50ZXJUeXBlOiBJTlBVVF9UWVBFX1RPVUNILFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIEB0aGlzIHtUb3VjaElucHV0fVxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKiBAcGFyYW0ge051bWJlcn0gdHlwZSBmbGFnXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfEFycmF5fSBbYWxsLCBjaGFuZ2VkXVxuICovXG5mdW5jdGlvbiBnZXRUb3VjaGVzKGV2LCB0eXBlKSB7XG4gICAgdmFyIGFsbFRvdWNoZXMgPSB0b0FycmF5KGV2LnRvdWNoZXMpO1xuICAgIHZhciB0YXJnZXRJZHMgPSB0aGlzLnRhcmdldElkcztcblxuICAgIC8vIHdoZW4gdGhlcmUgaXMgb25seSBvbmUgdG91Y2gsIHRoZSBwcm9jZXNzIGNhbiBiZSBzaW1wbGlmaWVkXG4gICAgaWYgKHR5cGUgJiAoSU5QVVRfU1RBUlQgfCBJTlBVVF9NT1ZFKSAmJiBhbGxUb3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB0YXJnZXRJZHNbYWxsVG91Y2hlc1swXS5pZGVudGlmaWVyXSA9IHRydWU7XG4gICAgICAgIHJldHVybiBbYWxsVG91Y2hlcywgYWxsVG91Y2hlc107XG4gICAgfVxuXG4gICAgdmFyIGksXG4gICAgICAgIHRhcmdldFRvdWNoZXMsXG4gICAgICAgIGNoYW5nZWRUb3VjaGVzID0gdG9BcnJheShldi5jaGFuZ2VkVG91Y2hlcyksXG4gICAgICAgIGNoYW5nZWRUYXJnZXRUb3VjaGVzID0gW10sXG4gICAgICAgIHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuXG4gICAgLy8gZ2V0IHRhcmdldCB0b3VjaGVzIGZyb20gdG91Y2hlc1xuICAgIHRhcmdldFRvdWNoZXMgPSBhbGxUb3VjaGVzLmZpbHRlcihmdW5jdGlvbih0b3VjaCkge1xuICAgICAgICByZXR1cm4gaGFzUGFyZW50KHRvdWNoLnRhcmdldCwgdGFyZ2V0KTtcbiAgICB9KTtcblxuICAgIC8vIGNvbGxlY3QgdG91Y2hlc1xuICAgIGlmICh0eXBlID09PSBJTlBVVF9TVEFSVCkge1xuICAgICAgICBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0YXJnZXRUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFyZ2V0SWRzW3RhcmdldFRvdWNoZXNbaV0uaWRlbnRpZmllcl0gPSB0cnVlO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gZmlsdGVyIGNoYW5nZWQgdG91Y2hlcyB0byBvbmx5IGNvbnRhaW4gdG91Y2hlcyB0aGF0IGV4aXN0IGluIHRoZSBjb2xsZWN0ZWQgdGFyZ2V0IGlkc1xuICAgIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0YXJnZXRJZHNbY2hhbmdlZFRvdWNoZXNbaV0uaWRlbnRpZmllcl0pIHtcbiAgICAgICAgICAgIGNoYW5nZWRUYXJnZXRUb3VjaGVzLnB1c2goY2hhbmdlZFRvdWNoZXNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2xlYW51cCByZW1vdmVkIHRvdWNoZXNcbiAgICAgICAgaWYgKHR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICAgICAgZGVsZXRlIHRhcmdldElkc1tjaGFuZ2VkVG91Y2hlc1tpXS5pZGVudGlmaWVyXTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKCFjaGFuZ2VkVGFyZ2V0VG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICAgIC8vIG1lcmdlIHRhcmdldFRvdWNoZXMgd2l0aCBjaGFuZ2VkVGFyZ2V0VG91Y2hlcyBzbyBpdCBjb250YWlucyBBTEwgdG91Y2hlcywgaW5jbHVkaW5nICdlbmQnIGFuZCAnY2FuY2VsJ1xuICAgICAgICB1bmlxdWVBcnJheSh0YXJnZXRUb3VjaGVzLmNvbmNhdChjaGFuZ2VkVGFyZ2V0VG91Y2hlcyksICdpZGVudGlmaWVyJywgdHJ1ZSksXG4gICAgICAgIGNoYW5nZWRUYXJnZXRUb3VjaGVzXG4gICAgXTtcbn1cblxuLyoqXG4gKiBDb21iaW5lZCB0b3VjaCBhbmQgbW91c2UgaW5wdXRcbiAqXG4gKiBUb3VjaCBoYXMgYSBoaWdoZXIgcHJpb3JpdHkgdGhlbiBtb3VzZSwgYW5kIHdoaWxlIHRvdWNoaW5nIG5vIG1vdXNlIGV2ZW50cyBhcmUgYWxsb3dlZC5cbiAqIFRoaXMgYmVjYXVzZSB0b3VjaCBkZXZpY2VzIGFsc28gZW1pdCBtb3VzZSBldmVudHMgd2hpbGUgZG9pbmcgYSB0b3VjaC5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIFRvdWNoTW91c2VJbnB1dCgpIHtcbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdmFyIGhhbmRsZXIgPSBiaW5kRm4odGhpcy5oYW5kbGVyLCB0aGlzKTtcbiAgICB0aGlzLnRvdWNoID0gbmV3IFRvdWNoSW5wdXQodGhpcy5tYW5hZ2VyLCBoYW5kbGVyKTtcbiAgICB0aGlzLm1vdXNlID0gbmV3IE1vdXNlSW5wdXQodGhpcy5tYW5hZ2VyLCBoYW5kbGVyKTtcbn1cblxuaW5oZXJpdChUb3VjaE1vdXNlSW5wdXQsIElucHV0LCB7XG4gICAgLyoqXG4gICAgICogaGFuZGxlIG1vdXNlIGFuZCB0b3VjaCBldmVudHNcbiAgICAgKiBAcGFyYW0ge0hhbW1lcn0gbWFuYWdlclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dEV2ZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0RGF0YVxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIFRNRWhhbmRsZXIobWFuYWdlciwgaW5wdXRFdmVudCwgaW5wdXREYXRhKSB7XG4gICAgICAgIHZhciBpc1RvdWNoID0gKGlucHV0RGF0YS5wb2ludGVyVHlwZSA9PSBJTlBVVF9UWVBFX1RPVUNIKSxcbiAgICAgICAgICAgIGlzTW91c2UgPSAoaW5wdXREYXRhLnBvaW50ZXJUeXBlID09IElOUFVUX1RZUEVfTU9VU0UpO1xuXG4gICAgICAgIC8vIHdoZW4gd2UncmUgaW4gYSB0b3VjaCBldmVudCwgc28gIGJsb2NrIGFsbCB1cGNvbWluZyBtb3VzZSBldmVudHNcbiAgICAgICAgLy8gbW9zdCBtb2JpbGUgYnJvd3NlciBhbHNvIGVtaXQgbW91c2VldmVudHMsIHJpZ2h0IGFmdGVyIHRvdWNoc3RhcnRcbiAgICAgICAgaWYgKGlzVG91Y2gpIHtcbiAgICAgICAgICAgIHRoaXMubW91c2UuYWxsb3cgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChpc01vdXNlICYmICF0aGlzLm1vdXNlLmFsbG93KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB0aGUgYWxsb3dNb3VzZSB3aGVuIHdlJ3JlIGRvbmVcbiAgICAgICAgaWYgKGlucHV0RXZlbnQgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICAgICAgdGhpcy5tb3VzZS5hbGxvdyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKG1hbmFnZXIsIGlucHV0RXZlbnQsIGlucHV0RGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy50b3VjaC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMubW91c2UuZGVzdHJveSgpO1xuICAgIH1cbn0pO1xuXG52YXIgUFJFRklYRURfVE9VQ0hfQUNUSU9OID0gcHJlZml4ZWQoVEVTVF9FTEVNRU5ULnN0eWxlLCAndG91Y2hBY3Rpb24nKTtcbnZhciBOQVRJVkVfVE9VQ0hfQUNUSU9OID0gUFJFRklYRURfVE9VQ0hfQUNUSU9OICE9PSB1bmRlZmluZWQ7XG5cbi8vIG1hZ2ljYWwgdG91Y2hBY3Rpb24gdmFsdWVcbnZhciBUT1VDSF9BQ1RJT05fQ09NUFVURSA9ICdjb21wdXRlJztcbnZhciBUT1VDSF9BQ1RJT05fQVVUTyA9ICdhdXRvJztcbnZhciBUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OID0gJ21hbmlwdWxhdGlvbic7IC8vIG5vdCBpbXBsZW1lbnRlZFxudmFyIFRPVUNIX0FDVElPTl9OT05FID0gJ25vbmUnO1xudmFyIFRPVUNIX0FDVElPTl9QQU5fWCA9ICdwYW4teCc7XG52YXIgVE9VQ0hfQUNUSU9OX1BBTl9ZID0gJ3Bhbi15JztcblxuLyoqXG4gKiBUb3VjaCBBY3Rpb25cbiAqIHNldHMgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5IG9yIHVzZXMgdGhlIGpzIGFsdGVybmF0aXZlXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRvdWNoQWN0aW9uKG1hbmFnZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLnNldCh2YWx1ZSk7XG59XG5cblRvdWNoQWN0aW9uLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBzZXQgdGhlIHRvdWNoQWN0aW9uIHZhbHVlIG9uIHRoZSBlbGVtZW50IG9yIGVuYWJsZSB0aGUgcG9seWZpbGxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIC8vIGZpbmQgb3V0IHRoZSB0b3VjaC1hY3Rpb24gYnkgdGhlIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIGlmICh2YWx1ZSA9PSBUT1VDSF9BQ1RJT05fQ09NUFVURSkge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLmNvbXB1dGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChOQVRJVkVfVE9VQ0hfQUNUSU9OICYmIHRoaXMubWFuYWdlci5lbGVtZW50LnN0eWxlKSB7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZWxlbWVudC5zdHlsZVtQUkVGSVhFRF9UT1VDSF9BQ1RJT05dID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hY3Rpb25zID0gdmFsdWUudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGp1c3QgcmUtc2V0IHRoZSB0b3VjaEFjdGlvbiB2YWx1ZVxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0KHRoaXMubWFuYWdlci5vcHRpb25zLnRvdWNoQWN0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY29tcHV0ZSB0aGUgdmFsdWUgZm9yIHRoZSB0b3VjaEFjdGlvbiBwcm9wZXJ0eSBiYXNlZCBvbiB0aGUgcmVjb2duaXplcidzIHNldHRpbmdzXG4gICAgICogQHJldHVybnMge1N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBjb21wdXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbXTtcbiAgICAgICAgZWFjaCh0aGlzLm1hbmFnZXIucmVjb2duaXplcnMsIGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgIGlmIChib29sT3JGbihyZWNvZ25pemVyLm9wdGlvbnMuZW5hYmxlLCBbcmVjb2duaXplcl0pKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9ucyA9IGFjdGlvbnMuY29uY2F0KHJlY29nbml6ZXIuZ2V0VG91Y2hBY3Rpb24oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY2xlYW5Ub3VjaEFjdGlvbnMoYWN0aW9ucy5qb2luKCcgJykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgb24gZWFjaCBpbnB1dCBjeWNsZSBhbmQgcHJvdmlkZXMgdGhlIHByZXZlbnRpbmcgb2YgdGhlIGJyb3dzZXIgYmVoYXZpb3JcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICBwcmV2ZW50RGVmYXVsdHM6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIC8vIG5vdCBuZWVkZWQgd2l0aCBuYXRpdmUgc3VwcG9ydCBmb3IgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5XG4gICAgICAgIGlmIChOQVRJVkVfVE9VQ0hfQUNUSU9OKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3JjRXZlbnQgPSBpbnB1dC5zcmNFdmVudDtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGlucHV0Lm9mZnNldERpcmVjdGlvbjtcblxuICAgICAgICAvLyBpZiB0aGUgdG91Y2ggYWN0aW9uIGRpZCBwcmV2ZW50ZWQgb25jZSB0aGlzIHNlc3Npb25cbiAgICAgICAgaWYgKHRoaXMubWFuYWdlci5zZXNzaW9uLnByZXZlbnRlZCkge1xuICAgICAgICAgICAgc3JjRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhY3Rpb25zID0gdGhpcy5hY3Rpb25zO1xuICAgICAgICB2YXIgaGFzTm9uZSA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9OT05FKTtcbiAgICAgICAgdmFyIGhhc1BhblkgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1kpO1xuICAgICAgICB2YXIgaGFzUGFuWCA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWCk7XG5cbiAgICAgICAgaWYgKGhhc05vbmUpIHtcbiAgICAgICAgICAgIC8vZG8gbm90IHByZXZlbnQgZGVmYXVsdHMgaWYgdGhpcyBpcyBhIHRhcCBnZXN0dXJlXG5cbiAgICAgICAgICAgIHZhciBpc1RhcFBvaW50ZXIgPSBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IDE7XG4gICAgICAgICAgICB2YXIgaXNUYXBNb3ZlbWVudCA9IGlucHV0LmRpc3RhbmNlIDwgMjtcbiAgICAgICAgICAgIHZhciBpc1RhcFRvdWNoVGltZSA9IGlucHV0LmRlbHRhVGltZSA8IDI1MDtcblxuICAgICAgICAgICAgaWYgKGlzVGFwUG9pbnRlciAmJiBpc1RhcE1vdmVtZW50ICYmIGlzVGFwVG91Y2hUaW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc1BhblggJiYgaGFzUGFuWSkge1xuICAgICAgICAgICAgLy8gYHBhbi14IHBhbi15YCBtZWFucyBicm93c2VyIGhhbmRsZXMgYWxsIHNjcm9sbGluZy9wYW5uaW5nLCBkbyBub3QgcHJldmVudFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc05vbmUgfHxcbiAgICAgICAgICAgIChoYXNQYW5ZICYmIGRpcmVjdGlvbiAmIERJUkVDVElPTl9IT1JJWk9OVEFMKSB8fFxuICAgICAgICAgICAgKGhhc1BhblggJiYgZGlyZWN0aW9uICYgRElSRUNUSU9OX1ZFUlRJQ0FMKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJldmVudFNyYyhzcmNFdmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY2FsbCBwcmV2ZW50RGVmYXVsdCB0byBwcmV2ZW50IHRoZSBicm93c2VyJ3MgZGVmYXVsdCBiZWhhdmlvciAoc2Nyb2xsaW5nIGluIG1vc3QgY2FzZXMpXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNyY0V2ZW50XG4gICAgICovXG4gICAgcHJldmVudFNyYzogZnVuY3Rpb24oc3JjRXZlbnQpIHtcbiAgICAgICAgdGhpcy5tYW5hZ2VyLnNlc3Npb24ucHJldmVudGVkID0gdHJ1ZTtcbiAgICAgICAgc3JjRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIHdoZW4gdGhlIHRvdWNoQWN0aW9ucyBhcmUgY29sbGVjdGVkIHRoZXkgYXJlIG5vdCBhIHZhbGlkIHZhbHVlLCBzbyB3ZSBuZWVkIHRvIGNsZWFuIHRoaW5ncyB1cC4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFjdGlvbnNcbiAqIEByZXR1cm5zIHsqfVxuICovXG5mdW5jdGlvbiBjbGVhblRvdWNoQWN0aW9ucyhhY3Rpb25zKSB7XG4gICAgLy8gbm9uZVxuICAgIGlmIChpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fTk9ORSkpIHtcbiAgICAgICAgcmV0dXJuIFRPVUNIX0FDVElPTl9OT05FO1xuICAgIH1cblxuICAgIHZhciBoYXNQYW5YID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9YKTtcbiAgICB2YXIgaGFzUGFuWSA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWSk7XG5cbiAgICAvLyBpZiBib3RoIHBhbi14IGFuZCBwYW4teSBhcmUgc2V0IChkaWZmZXJlbnQgcmVjb2duaXplcnNcbiAgICAvLyBmb3IgZGlmZmVyZW50IGRpcmVjdGlvbnMsIGUuZy4gaG9yaXpvbnRhbCBwYW4gYnV0IHZlcnRpY2FsIHN3aXBlPylcbiAgICAvLyB3ZSBuZWVkIG5vbmUgKGFzIG90aGVyd2lzZSB3aXRoIHBhbi14IHBhbi15IGNvbWJpbmVkIG5vbmUgb2YgdGhlc2VcbiAgICAvLyByZWNvZ25pemVycyB3aWxsIHdvcmssIHNpbmNlIHRoZSBicm93c2VyIHdvdWxkIGhhbmRsZSBhbGwgcGFubmluZ1xuICAgIGlmIChoYXNQYW5YICYmIGhhc1BhblkpIHtcbiAgICAgICAgcmV0dXJuIFRPVUNIX0FDVElPTl9OT05FO1xuICAgIH1cblxuICAgIC8vIHBhbi14IE9SIHBhbi15XG4gICAgaWYgKGhhc1BhblggfHwgaGFzUGFuWSkge1xuICAgICAgICByZXR1cm4gaGFzUGFuWCA/IFRPVUNIX0FDVElPTl9QQU5fWCA6IFRPVUNIX0FDVElPTl9QQU5fWTtcbiAgICB9XG5cbiAgICAvLyBtYW5pcHVsYXRpb25cbiAgICBpZiAoaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTikpIHtcbiAgICAgICAgcmV0dXJuIFRPVUNIX0FDVElPTl9NQU5JUFVMQVRJT047XG4gICAgfVxuXG4gICAgcmV0dXJuIFRPVUNIX0FDVElPTl9BVVRPO1xufVxuXG4vKipcbiAqIFJlY29nbml6ZXIgZmxvdyBleHBsYWluZWQ7ICpcbiAqIEFsbCByZWNvZ25pemVycyBoYXZlIHRoZSBpbml0aWFsIHN0YXRlIG9mIFBPU1NJQkxFIHdoZW4gYSBpbnB1dCBzZXNzaW9uIHN0YXJ0cy5cbiAqIFRoZSBkZWZpbml0aW9uIG9mIGEgaW5wdXQgc2Vzc2lvbiBpcyBmcm9tIHRoZSBmaXJzdCBpbnB1dCB1bnRpbCB0aGUgbGFzdCBpbnB1dCwgd2l0aCBhbGwgaXQncyBtb3ZlbWVudCBpbiBpdC4gKlxuICogRXhhbXBsZSBzZXNzaW9uIGZvciBtb3VzZS1pbnB1dDogbW91c2Vkb3duIC0+IG1vdXNlbW92ZSAtPiBtb3VzZXVwXG4gKlxuICogT24gZWFjaCByZWNvZ25pemluZyBjeWNsZSAoc2VlIE1hbmFnZXIucmVjb2duaXplKSB0aGUgLnJlY29nbml6ZSgpIG1ldGhvZCBpcyBleGVjdXRlZFxuICogd2hpY2ggZGV0ZXJtaW5lcyB3aXRoIHN0YXRlIGl0IHNob3VsZCBiZS5cbiAqXG4gKiBJZiB0aGUgcmVjb2duaXplciBoYXMgdGhlIHN0YXRlIEZBSUxFRCwgQ0FOQ0VMTEVEIG9yIFJFQ09HTklaRUQgKGVxdWFscyBFTkRFRCksIGl0IGlzIHJlc2V0IHRvXG4gKiBQT1NTSUJMRSB0byBnaXZlIGl0IGFub3RoZXIgY2hhbmdlIG9uIHRoZSBuZXh0IGN5Y2xlLlxuICpcbiAqICAgICAgICAgICAgICAgUG9zc2libGVcbiAqICAgICAgICAgICAgICAgICAgfFxuICogICAgICAgICAgICArLS0tLS0rLS0tLS0tLS0tLS0tLS0tK1xuICogICAgICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgfFxuICogICAgICArLS0tLS0rLS0tLS0rICAgICAgICAgICAgICAgfFxuICogICAgICB8ICAgICAgICAgICB8ICAgICAgICAgICAgICAgfFxuICogICBGYWlsZWQgICAgICBDYW5jZWxsZWQgICAgICAgICAgfFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICstLS0tLS0tKy0tLS0tLStcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICBSZWNvZ25pemVkICAgICAgIEJlZ2FuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENoYW5nZWRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFbmRlZC9SZWNvZ25pemVkXG4gKi9cbnZhciBTVEFURV9QT1NTSUJMRSA9IDE7XG52YXIgU1RBVEVfQkVHQU4gPSAyO1xudmFyIFNUQVRFX0NIQU5HRUQgPSA0O1xudmFyIFNUQVRFX0VOREVEID0gODtcbnZhciBTVEFURV9SRUNPR05JWkVEID0gU1RBVEVfRU5ERUQ7XG52YXIgU1RBVEVfQ0FOQ0VMTEVEID0gMTY7XG52YXIgU1RBVEVfRkFJTEVEID0gMzI7XG5cbi8qKlxuICogUmVjb2duaXplclxuICogRXZlcnkgcmVjb2duaXplciBuZWVkcyB0byBleHRlbmQgZnJvbSB0aGlzIGNsYXNzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBSZWNvZ25pemVyKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIHRoaXMuZGVmYXVsdHMsIG9wdGlvbnMgfHwge30pO1xuXG4gICAgdGhpcy5pZCA9IHVuaXF1ZUlkKCk7XG5cbiAgICB0aGlzLm1hbmFnZXIgPSBudWxsO1xuXG4gICAgLy8gZGVmYXVsdCBpcyBlbmFibGUgdHJ1ZVxuICAgIHRoaXMub3B0aW9ucy5lbmFibGUgPSBpZlVuZGVmaW5lZCh0aGlzLm9wdGlvbnMuZW5hYmxlLCB0cnVlKTtcblxuICAgIHRoaXMuc3RhdGUgPSBTVEFURV9QT1NTSUJMRTtcblxuICAgIHRoaXMuc2ltdWx0YW5lb3VzID0ge307XG4gICAgdGhpcy5yZXF1aXJlRmFpbCA9IFtdO1xufVxuXG5SZWNvZ25pemVyLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBAdmlydHVhbFxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgZGVmYXVsdHM6IHt9LFxuXG4gICAgLyoqXG4gICAgICogc2V0IG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqIEByZXR1cm4ge1JlY29nbml6ZXJ9XG4gICAgICovXG4gICAgc2V0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIGFzc2lnbih0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8vIGFsc28gdXBkYXRlIHRoZSB0b3VjaEFjdGlvbiwgaW4gY2FzZSBzb21ldGhpbmcgY2hhbmdlZCBhYm91dCB0aGUgZGlyZWN0aW9ucy9lbmFibGVkIHN0YXRlXG4gICAgICAgIHRoaXMubWFuYWdlciAmJiB0aGlzLm1hbmFnZXIudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZWNvZ25pemUgc2ltdWx0YW5lb3VzIHdpdGggYW4gb3RoZXIgcmVjb2duaXplci5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgcmVjb2duaXplV2l0aDogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdyZWNvZ25pemVXaXRoJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNpbXVsdGFuZW91cyA9IHRoaXMuc2ltdWx0YW5lb3VzO1xuICAgICAgICBvdGhlclJlY29nbml6ZXIgPSBnZXRSZWNvZ25pemVyQnlOYW1lSWZNYW5hZ2VyKG90aGVyUmVjb2duaXplciwgdGhpcyk7XG4gICAgICAgIGlmICghc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF0pIHtcbiAgICAgICAgICAgIHNpbXVsdGFuZW91c1tvdGhlclJlY29nbml6ZXIuaWRdID0gb3RoZXJSZWNvZ25pemVyO1xuICAgICAgICAgICAgb3RoZXJSZWNvZ25pemVyLnJlY29nbml6ZVdpdGgodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRyb3AgdGhlIHNpbXVsdGFuZW91cyBsaW5rLiBpdCBkb2VzbnQgcmVtb3ZlIHRoZSBsaW5rIG9uIHRoZSBvdGhlciByZWNvZ25pemVyLlxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBkcm9wUmVjb2duaXplV2l0aDogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdkcm9wUmVjb2duaXplV2l0aCcsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZWNvZ25pemVyIGNhbiBvbmx5IHJ1biB3aGVuIGFuIG90aGVyIGlzIGZhaWxpbmdcbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgcmVxdWlyZUZhaWx1cmU6IGZ1bmN0aW9uKG90aGVyUmVjb2duaXplcikge1xuICAgICAgICBpZiAoaW52b2tlQXJyYXlBcmcob3RoZXJSZWNvZ25pemVyLCAncmVxdWlyZUZhaWx1cmUnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVxdWlyZUZhaWwgPSB0aGlzLnJlcXVpcmVGYWlsO1xuICAgICAgICBvdGhlclJlY29nbml6ZXIgPSBnZXRSZWNvZ25pemVyQnlOYW1lSWZNYW5hZ2VyKG90aGVyUmVjb2duaXplciwgdGhpcyk7XG4gICAgICAgIGlmIChpbkFycmF5KHJlcXVpcmVGYWlsLCBvdGhlclJlY29nbml6ZXIpID09PSAtMSkge1xuICAgICAgICAgICAgcmVxdWlyZUZhaWwucHVzaChvdGhlclJlY29nbml6ZXIpO1xuICAgICAgICAgICAgb3RoZXJSZWNvZ25pemVyLnJlcXVpcmVGYWlsdXJlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBkcm9wIHRoZSByZXF1aXJlRmFpbHVyZSBsaW5rLiBpdCBkb2VzIG5vdCByZW1vdmUgdGhlIGxpbmsgb24gdGhlIG90aGVyIHJlY29nbml6ZXIuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIGRyb3BSZXF1aXJlRmFpbHVyZTogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdkcm9wUmVxdWlyZUZhaWx1cmUnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBvdGhlclJlY29nbml6ZXIgPSBnZXRSZWNvZ25pemVyQnlOYW1lSWZNYW5hZ2VyKG90aGVyUmVjb2duaXplciwgdGhpcyk7XG4gICAgICAgIHZhciBpbmRleCA9IGluQXJyYXkodGhpcy5yZXF1aXJlRmFpbCwgb3RoZXJSZWNvZ25pemVyKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMucmVxdWlyZUZhaWwuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogaGFzIHJlcXVpcmUgZmFpbHVyZXMgYm9vbGVhblxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGhhc1JlcXVpcmVGYWlsdXJlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVpcmVGYWlsLmxlbmd0aCA+IDA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGlmIHRoZSByZWNvZ25pemVyIGNhbiByZWNvZ25pemUgc2ltdWx0YW5lb3VzIHdpdGggYW4gb3RoZXIgcmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAgICovXG4gICAgY2FuUmVjb2duaXplV2l0aDogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFlvdSBzaG91bGQgdXNlIGB0cnlFbWl0YCBpbnN0ZWFkIG9mIGBlbWl0YCBkaXJlY3RseSB0byBjaGVja1xuICAgICAqIHRoYXQgYWxsIHRoZSBuZWVkZWQgcmVjb2duaXplcnMgaGFzIGZhaWxlZCBiZWZvcmUgZW1pdHRpbmcuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gICAgICovXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlO1xuXG4gICAgICAgIGZ1bmN0aW9uIGVtaXQoZXZlbnQpIHtcbiAgICAgICAgICAgIHNlbGYubWFuYWdlci5lbWl0KGV2ZW50LCBpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAncGFuc3RhcnQnIGFuZCAncGFubW92ZSdcbiAgICAgICAgaWYgKHN0YXRlIDwgU1RBVEVfRU5ERUQpIHtcbiAgICAgICAgICAgIGVtaXQoc2VsZi5vcHRpb25zLmV2ZW50ICsgc3RhdGVTdHIoc3RhdGUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVtaXQoc2VsZi5vcHRpb25zLmV2ZW50KTsgLy8gc2ltcGxlICdldmVudE5hbWUnIGV2ZW50c1xuXG4gICAgICAgIGlmIChpbnB1dC5hZGRpdGlvbmFsRXZlbnQpIHsgLy8gYWRkaXRpb25hbCBldmVudChwYW5sZWZ0LCBwYW5yaWdodCwgcGluY2hpbiwgcGluY2hvdXQuLi4pXG4gICAgICAgICAgICBlbWl0KGlucHV0LmFkZGl0aW9uYWxFdmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBwYW5lbmQgYW5kIHBhbmNhbmNlbFxuICAgICAgICBpZiAoc3RhdGUgPj0gU1RBVEVfRU5ERUQpIHtcbiAgICAgICAgICAgIGVtaXQoc2VsZi5vcHRpb25zLmV2ZW50ICsgc3RhdGVTdHIoc3RhdGUpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB0aGF0IGFsbCB0aGUgcmVxdWlyZSBmYWlsdXJlIHJlY29nbml6ZXJzIGhhcyBmYWlsZWQsXG4gICAgICogaWYgdHJ1ZSwgaXQgZW1pdHMgYSBnZXN0dXJlIGV2ZW50LFxuICAgICAqIG90aGVyd2lzZSwgc2V0dXAgdGhlIHN0YXRlIHRvIEZBSUxFRC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICB0cnlFbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpZiAodGhpcy5jYW5FbWl0KCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVtaXQoaW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGl0J3MgZmFpbGluZyBhbnl3YXlcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX0ZBSUxFRDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY2FuIHdlIGVtaXQ/XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgY2FuRW1pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLnJlcXVpcmVGYWlsLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKCEodGhpcy5yZXF1aXJlRmFpbFtpXS5zdGF0ZSAmIChTVEFURV9GQUlMRUQgfCBTVEFURV9QT1NTSUJMRSkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB1cGRhdGUgdGhlIHJlY29nbml6ZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXREYXRhXG4gICAgICovXG4gICAgcmVjb2duaXplOiBmdW5jdGlvbihpbnB1dERhdGEpIHtcbiAgICAgICAgLy8gbWFrZSBhIG5ldyBjb3B5IG9mIHRoZSBpbnB1dERhdGFcbiAgICAgICAgLy8gc28gd2UgY2FuIGNoYW5nZSB0aGUgaW5wdXREYXRhIHdpdGhvdXQgbWVzc2luZyB1cCB0aGUgb3RoZXIgcmVjb2duaXplcnNcbiAgICAgICAgdmFyIGlucHV0RGF0YUNsb25lID0gYXNzaWduKHt9LCBpbnB1dERhdGEpO1xuXG4gICAgICAgIC8vIGlzIGlzIGVuYWJsZWQgYW5kIGFsbG93IHJlY29nbml6aW5nP1xuICAgICAgICBpZiAoIWJvb2xPckZuKHRoaXMub3B0aW9ucy5lbmFibGUsIFt0aGlzLCBpbnB1dERhdGFDbG9uZV0pKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVzZXQgd2hlbiB3ZSd2ZSByZWFjaGVkIHRoZSBlbmRcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgJiAoU1RBVEVfUkVDT0dOSVpFRCB8IFNUQVRFX0NBTkNFTExFRCB8IFNUQVRFX0ZBSUxFRCkpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9QT1NTSUJMRTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB0aGlzLnByb2Nlc3MoaW5wdXREYXRhQ2xvbmUpO1xuXG4gICAgICAgIC8vIHRoZSByZWNvZ25pemVyIGhhcyByZWNvZ25pemVkIGEgZ2VzdHVyZVxuICAgICAgICAvLyBzbyB0cmlnZ2VyIGFuIGV2ZW50XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCB8IFNUQVRFX0VOREVEIHwgU1RBVEVfQ0FOQ0VMTEVEKSkge1xuICAgICAgICAgICAgdGhpcy50cnlFbWl0KGlucHV0RGF0YUNsb25lKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZXR1cm4gdGhlIHN0YXRlIG9mIHRoZSByZWNvZ25pemVyXG4gICAgICogdGhlIGFjdHVhbCByZWNvZ25pemluZyBoYXBwZW5zIGluIHRoaXMgbWV0aG9kXG4gICAgICogQHZpcnR1YWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXREYXRhXG4gICAgICogQHJldHVybnMge0NvbnN0fSBTVEFURVxuICAgICAqL1xuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0RGF0YSkgeyB9LCAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblxuICAgIC8qKlxuICAgICAqIHJldHVybiB0aGUgcHJlZmVycmVkIHRvdWNoLWFjdGlvblxuICAgICAqIEB2aXJ0dWFsXG4gICAgICogQHJldHVybnMge0FycmF5fVxuICAgICAqL1xuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHsgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbGxlZCB3aGVuIHRoZSBnZXN0dXJlIGlzbid0IGFsbG93ZWQgdG8gcmVjb2duaXplXG4gICAgICogbGlrZSB3aGVuIGFub3RoZXIgaXMgYmVpbmcgcmVjb2duaXplZCBvciBpdCBpcyBkaXNhYmxlZFxuICAgICAqIEB2aXJ0dWFsXG4gICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkgeyB9XG59O1xuXG4vKipcbiAqIGdldCBhIHVzYWJsZSBzdHJpbmcsIHVzZWQgYXMgZXZlbnQgcG9zdGZpeFxuICogQHBhcmFtIHtDb25zdH0gc3RhdGVcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0YXRlXG4gKi9cbmZ1bmN0aW9uIHN0YXRlU3RyKHN0YXRlKSB7XG4gICAgaWYgKHN0YXRlICYgU1RBVEVfQ0FOQ0VMTEVEKSB7XG4gICAgICAgIHJldHVybiAnY2FuY2VsJztcbiAgICB9IGVsc2UgaWYgKHN0YXRlICYgU1RBVEVfRU5ERUQpIHtcbiAgICAgICAgcmV0dXJuICdlbmQnO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUgJiBTVEFURV9DSEFOR0VEKSB7XG4gICAgICAgIHJldHVybiAnbW92ZSc7XG4gICAgfSBlbHNlIGlmIChzdGF0ZSAmIFNUQVRFX0JFR0FOKSB7XG4gICAgICAgIHJldHVybiAnc3RhcnQnO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5cbi8qKlxuICogZGlyZWN0aW9uIGNvbnMgdG8gc3RyaW5nXG4gKiBAcGFyYW0ge0NvbnN0fSBkaXJlY3Rpb25cbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGRpcmVjdGlvblN0cihkaXJlY3Rpb24pIHtcbiAgICBpZiAoZGlyZWN0aW9uID09IERJUkVDVElPTl9ET1dOKSB7XG4gICAgICAgIHJldHVybiAnZG93bic7XG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX1VQKSB7XG4gICAgICAgIHJldHVybiAndXAnO1xuICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09IERJUkVDVElPTl9MRUZUKSB7XG4gICAgICAgIHJldHVybiAnbGVmdCc7XG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX1JJR0hUKSB7XG4gICAgICAgIHJldHVybiAncmlnaHQnO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5cbi8qKlxuICogZ2V0IGEgcmVjb2duaXplciBieSBuYW1lIGlmIGl0IGlzIGJvdW5kIHRvIGEgbWFuYWdlclxuICogQHBhcmFtIHtSZWNvZ25pemVyfFN0cmluZ30gb3RoZXJSZWNvZ25pemVyXG4gKiBAcGFyYW0ge1JlY29nbml6ZXJ9IHJlY29nbml6ZXJcbiAqIEByZXR1cm5zIHtSZWNvZ25pemVyfVxuICovXG5mdW5jdGlvbiBnZXRSZWNvZ25pemVyQnlOYW1lSWZNYW5hZ2VyKG90aGVyUmVjb2duaXplciwgcmVjb2duaXplcikge1xuICAgIHZhciBtYW5hZ2VyID0gcmVjb2duaXplci5tYW5hZ2VyO1xuICAgIGlmIChtYW5hZ2VyKSB7XG4gICAgICAgIHJldHVybiBtYW5hZ2VyLmdldChvdGhlclJlY29nbml6ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gb3RoZXJSZWNvZ25pemVyO1xufVxuXG4vKipcbiAqIFRoaXMgcmVjb2duaXplciBpcyBqdXN0IHVzZWQgYXMgYSBiYXNlIGZvciB0aGUgc2ltcGxlIGF0dHJpYnV0ZSByZWNvZ25pemVycy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBBdHRyUmVjb2duaXplcigpIHtcbiAgICBSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoQXR0clJlY29nbml6ZXIsIFJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIEF0dHJSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqIEBkZWZhdWx0IDFcbiAgICAgICAgICovXG4gICAgICAgIHBvaW50ZXJzOiAxXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVzZWQgdG8gY2hlY2sgaWYgaXQgdGhlIHJlY29nbml6ZXIgcmVjZWl2ZXMgdmFsaWQgaW5wdXQsIGxpa2UgaW5wdXQuZGlzdGFuY2UgPiAxMC5cbiAgICAgKiBAbWVtYmVyb2YgQXR0clJlY29nbml6ZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gcmVjb2duaXplZFxuICAgICAqL1xuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9uUG9pbnRlcnMgPSB0aGlzLm9wdGlvbnMucG9pbnRlcnM7XG4gICAgICAgIHJldHVybiBvcHRpb25Qb2ludGVycyA9PT0gMCB8fCBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IG9wdGlvblBvaW50ZXJzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcm9jZXNzIHRoZSBpbnB1dCBhbmQgcmV0dXJuIHRoZSBzdGF0ZSBmb3IgdGhlIHJlY29nbml6ZXJcbiAgICAgKiBAbWVtYmVyb2YgQXR0clJlY29nbml6ZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKiBAcmV0dXJucyB7Kn0gU3RhdGVcbiAgICAgKi9cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gaW5wdXQuZXZlbnRUeXBlO1xuXG4gICAgICAgIHZhciBpc1JlY29nbml6ZWQgPSBzdGF0ZSAmIChTVEFURV9CRUdBTiB8IFNUQVRFX0NIQU5HRUQpO1xuICAgICAgICB2YXIgaXNWYWxpZCA9IHRoaXMuYXR0clRlc3QoaW5wdXQpO1xuXG4gICAgICAgIC8vIG9uIGNhbmNlbCBpbnB1dCBhbmQgd2UndmUgcmVjb2duaXplZCBiZWZvcmUsIHJldHVybiBTVEFURV9DQU5DRUxMRURcbiAgICAgICAgaWYgKGlzUmVjb2duaXplZCAmJiAoZXZlbnRUeXBlICYgSU5QVVRfQ0FOQ0VMIHx8ICFpc1ZhbGlkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlIHwgU1RBVEVfQ0FOQ0VMTEVEO1xuICAgICAgICB9IGVsc2UgaWYgKGlzUmVjb2duaXplZCB8fCBpc1ZhbGlkKSB7XG4gICAgICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfRU5EKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlIHwgU1RBVEVfRU5ERUQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCEoc3RhdGUgJiBTVEFURV9CRUdBTikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gU1RBVEVfQkVHQU47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9DSEFOR0VEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfVxufSk7XG5cbi8qKlxuICogUGFuXG4gKiBSZWNvZ25pemVkIHdoZW4gdGhlIHBvaW50ZXIgaXMgZG93biBhbmQgbW92ZWQgaW4gdGhlIGFsbG93ZWQgZGlyZWN0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBBdHRyUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBQYW5SZWNvZ25pemVyKCkge1xuICAgIEF0dHJSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLnBYID0gbnVsbDtcbiAgICB0aGlzLnBZID0gbnVsbDtcbn1cblxuaW5oZXJpdChQYW5SZWNvZ25pemVyLCBBdHRyUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUGFuUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncGFuJyxcbiAgICAgICAgdGhyZXNob2xkOiAxMCxcbiAgICAgICAgcG9pbnRlcnM6IDEsXG4gICAgICAgIGRpcmVjdGlvbjogRElSRUNUSU9OX0FMTFxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLm9wdGlvbnMuZGlyZWN0aW9uO1xuICAgICAgICB2YXIgYWN0aW9ucyA9IFtdO1xuICAgICAgICBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaChUT1VDSF9BQ1RJT05fUEFOX1kpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fVkVSVElDQUwpIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaChUT1VDSF9BQ1RJT05fUEFOX1gpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY3Rpb25zO1xuICAgIH0sXG5cbiAgICBkaXJlY3Rpb25UZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgdmFyIGhhc01vdmVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIGRpc3RhbmNlID0gaW5wdXQuZGlzdGFuY2U7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBpbnB1dC5kaXJlY3Rpb247XG4gICAgICAgIHZhciB4ID0gaW5wdXQuZGVsdGFYO1xuICAgICAgICB2YXIgeSA9IGlucHV0LmRlbHRhWTtcblxuICAgICAgICAvLyBsb2NrIHRvIGF4aXM/XG4gICAgICAgIGlmICghKGRpcmVjdGlvbiAmIG9wdGlvbnMuZGlyZWN0aW9uKSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSAoeCA9PT0gMCkgPyBESVJFQ1RJT05fTk9ORSA6ICh4IDwgMCkgPyBESVJFQ1RJT05fTEVGVCA6IERJUkVDVElPTl9SSUdIVDtcbiAgICAgICAgICAgICAgICBoYXNNb3ZlZCA9IHggIT0gdGhpcy5wWDtcbiAgICAgICAgICAgICAgICBkaXN0YW5jZSA9IE1hdGguYWJzKGlucHV0LmRlbHRhWCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9ICh5ID09PSAwKSA/IERJUkVDVElPTl9OT05FIDogKHkgPCAwKSA/IERJUkVDVElPTl9VUCA6IERJUkVDVElPTl9ET1dOO1xuICAgICAgICAgICAgICAgIGhhc01vdmVkID0geSAhPSB0aGlzLnBZO1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gTWF0aC5hYnMoaW5wdXQuZGVsdGFZKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpbnB1dC5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgICAgIHJldHVybiBoYXNNb3ZlZCAmJiBkaXN0YW5jZSA+IG9wdGlvbnMudGhyZXNob2xkICYmIGRpcmVjdGlvbiAmIG9wdGlvbnMuZGlyZWN0aW9uO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIEF0dHJSZWNvZ25pemVyLnByb3RvdHlwZS5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgKHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTiB8fCAoISh0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4pICYmIHRoaXMuZGlyZWN0aW9uVGVzdChpbnB1dCkpKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcblxuICAgICAgICB0aGlzLnBYID0gaW5wdXQuZGVsdGFYO1xuICAgICAgICB0aGlzLnBZID0gaW5wdXQuZGVsdGFZO1xuXG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBkaXJlY3Rpb25TdHIoaW5wdXQuZGlyZWN0aW9uKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBpbnB1dC5hZGRpdGlvbmFsRXZlbnQgPSB0aGlzLm9wdGlvbnMuZXZlbnQgKyBkaXJlY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3VwZXIuZW1pdC5jYWxsKHRoaXMsIGlucHV0KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBQaW5jaFxuICogUmVjb2duaXplZCB3aGVuIHR3byBvciBtb3JlIHBvaW50ZXJzIGFyZSBtb3ZpbmcgdG93YXJkICh6b29tLWluKSBvciBhd2F5IGZyb20gZWFjaCBvdGhlciAoem9vbS1vdXQpLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBBdHRyUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBQaW5jaFJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChQaW5jaFJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQaW5jaFJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3BpbmNoJyxcbiAgICAgICAgdGhyZXNob2xkOiAwLFxuICAgICAgICBwb2ludGVyczogMlxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX05PTkVdO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N1cGVyLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICAoTWF0aC5hYnMoaW5wdXQuc2NhbGUgLSAxKSA+IHRoaXMub3B0aW9ucy50aHJlc2hvbGQgfHwgdGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0LnNjYWxlICE9PSAxKSB7XG4gICAgICAgICAgICB2YXIgaW5PdXQgPSBpbnB1dC5zY2FsZSA8IDEgPyAnaW4nIDogJ291dCc7XG4gICAgICAgICAgICBpbnB1dC5hZGRpdGlvbmFsRXZlbnQgPSB0aGlzLm9wdGlvbnMuZXZlbnQgKyBpbk91dDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdXBlci5lbWl0LmNhbGwodGhpcywgaW5wdXQpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFByZXNzXG4gKiBSZWNvZ25pemVkIHdoZW4gdGhlIHBvaW50ZXIgaXMgZG93biBmb3IgeCBtcyB3aXRob3V0IGFueSBtb3ZlbWVudC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBQcmVzc1JlY29nbml6ZXIoKSB7XG4gICAgUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5fdGltZXIgPSBudWxsO1xuICAgIHRoaXMuX2lucHV0ID0gbnVsbDtcbn1cblxuaW5oZXJpdChQcmVzc1JlY29nbml6ZXIsIFJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFByZXNzUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncHJlc3MnLFxuICAgICAgICBwb2ludGVyczogMSxcbiAgICAgICAgdGltZTogMjUxLCAvLyBtaW5pbWFsIHRpbWUgb2YgdGhlIHBvaW50ZXIgdG8gYmUgcHJlc3NlZFxuICAgICAgICB0aHJlc2hvbGQ6IDkgLy8gYSBtaW5pbWFsIG1vdmVtZW50IGlzIG9rLCBidXQga2VlcCBpdCBsb3dcbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9BVVRPXTtcbiAgICB9LFxuXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgIHZhciB2YWxpZFBvaW50ZXJzID0gaW5wdXQucG9pbnRlcnMubGVuZ3RoID09PSBvcHRpb25zLnBvaW50ZXJzO1xuICAgICAgICB2YXIgdmFsaWRNb3ZlbWVudCA9IGlucHV0LmRpc3RhbmNlIDwgb3B0aW9ucy50aHJlc2hvbGQ7XG4gICAgICAgIHZhciB2YWxpZFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPiBvcHRpb25zLnRpbWU7XG5cbiAgICAgICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcblxuICAgICAgICAvLyB3ZSBvbmx5IGFsbG93IGxpdHRsZSBtb3ZlbWVudFxuICAgICAgICAvLyBhbmQgd2UndmUgcmVhY2hlZCBhbiBlbmQgZXZlbnQsIHNvIGEgdGFwIGlzIHBvc3NpYmxlXG4gICAgICAgIGlmICghdmFsaWRNb3ZlbWVudCB8fCAhdmFsaWRQb2ludGVycyB8fCAoaW5wdXQuZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkgJiYgIXZhbGlkVGltZSkpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9TVEFSVCkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0Q29udGV4dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgICAgICAgICB0aGlzLnRyeUVtaXQoKTtcbiAgICAgICAgICAgIH0sIG9wdGlvbnMudGltZSwgdGhpcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfRU5EKSB7XG4gICAgICAgICAgICByZXR1cm4gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBTVEFURV9SRUNPR05JWkVEKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5wdXQgJiYgKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX0VORCkpIHtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMub3B0aW9ucy5ldmVudCArICd1cCcsIGlucHV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2lucHV0LnRpbWVTdGFtcCA9IG5vdygpO1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50LCB0aGlzLl9pbnB1dCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuLyoqXG4gKiBSb3RhdGVcbiAqIFJlY29nbml6ZWQgd2hlbiB0d28gb3IgbW9yZSBwb2ludGVyIGFyZSBtb3ZpbmcgaW4gYSBjaXJjdWxhciBtb3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFJvdGF0ZVJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChSb3RhdGVSZWNvZ25pemVyLCBBdHRyUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUm90YXRlUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncm90YXRlJyxcbiAgICAgICAgdGhyZXNob2xkOiAwLFxuICAgICAgICBwb2ludGVyczogMlxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX05PTkVdO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N1cGVyLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICAoTWF0aC5hYnMoaW5wdXQucm90YXRpb24pID4gdGhpcy5vcHRpb25zLnRocmVzaG9sZCB8fCB0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4pO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFN3aXBlXG4gKiBSZWNvZ25pemVkIHdoZW4gdGhlIHBvaW50ZXIgaXMgbW92aW5nIGZhc3QgKHZlbG9jaXR5KSwgd2l0aCBlbm91Z2ggZGlzdGFuY2UgaW4gdGhlIGFsbG93ZWQgZGlyZWN0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBBdHRyUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBTd2lwZVJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChTd2lwZVJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBTd2lwZVJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3N3aXBlJyxcbiAgICAgICAgdGhyZXNob2xkOiAxMCxcbiAgICAgICAgdmVsb2NpdHk6IDAuMyxcbiAgICAgICAgZGlyZWN0aW9uOiBESVJFQ1RJT05fSE9SSVpPTlRBTCB8IERJUkVDVElPTl9WRVJUSUNBTCxcbiAgICAgICAgcG9pbnRlcnM6IDFcbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gUGFuUmVjb2duaXplci5wcm90b3R5cGUuZ2V0VG91Y2hBY3Rpb24uY2FsbCh0aGlzKTtcbiAgICB9LFxuXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLm9wdGlvbnMuZGlyZWN0aW9uO1xuICAgICAgICB2YXIgdmVsb2NpdHk7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiAmIChESVJFQ1RJT05fSE9SSVpPTlRBTCB8IERJUkVDVElPTl9WRVJUSUNBTCkpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5O1xuICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9IT1JJWk9OVEFMKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IGlucHV0Lm92ZXJhbGxWZWxvY2l0eVg7XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX1ZFUlRJQ0FMKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IGlucHV0Lm92ZXJhbGxWZWxvY2l0eVk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIGRpcmVjdGlvbiAmIGlucHV0Lm9mZnNldERpcmVjdGlvbiAmJlxuICAgICAgICAgICAgaW5wdXQuZGlzdGFuY2UgPiB0aGlzLm9wdGlvbnMudGhyZXNob2xkICYmXG4gICAgICAgICAgICBpbnB1dC5tYXhQb2ludGVycyA9PSB0aGlzLm9wdGlvbnMucG9pbnRlcnMgJiZcbiAgICAgICAgICAgIGFicyh2ZWxvY2l0eSkgPiB0aGlzLm9wdGlvbnMudmVsb2NpdHkgJiYgaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfRU5EO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gZGlyZWN0aW9uU3RyKGlucHV0Lm9mZnNldERpcmVjdGlvbik7XG4gICAgICAgIGlmIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMub3B0aW9ucy5ldmVudCArIGRpcmVjdGlvbiwgaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50LCBpbnB1dCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogQSB0YXAgaXMgZWNvZ25pemVkIHdoZW4gdGhlIHBvaW50ZXIgaXMgZG9pbmcgYSBzbWFsbCB0YXAvY2xpY2suIE11bHRpcGxlIHRhcHMgYXJlIHJlY29nbml6ZWQgaWYgdGhleSBvY2N1clxuICogYmV0d2VlbiB0aGUgZ2l2ZW4gaW50ZXJ2YWwgYW5kIHBvc2l0aW9uLiBUaGUgZGVsYXkgb3B0aW9uIGNhbiBiZSB1c2VkIHRvIHJlY29nbml6ZSBtdWx0aS10YXBzIHdpdGhvdXQgZmlyaW5nXG4gKiBhIHNpbmdsZSB0YXAuXG4gKlxuICogVGhlIGV2ZW50RGF0YSBmcm9tIHRoZSBlbWl0dGVkIGV2ZW50IGNvbnRhaW5zIHRoZSBwcm9wZXJ0eSBgdGFwQ291bnRgLCB3aGljaCBjb250YWlucyB0aGUgYW1vdW50IG9mXG4gKiBtdWx0aS10YXBzIGJlaW5nIHJlY29nbml6ZWQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIFJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gVGFwUmVjb2duaXplcigpIHtcbiAgICBSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAvLyBwcmV2aW91cyB0aW1lIGFuZCBjZW50ZXIsXG4gICAgLy8gdXNlZCBmb3IgdGFwIGNvdW50aW5nXG4gICAgdGhpcy5wVGltZSA9IGZhbHNlO1xuICAgIHRoaXMucENlbnRlciA9IGZhbHNlO1xuXG4gICAgdGhpcy5fdGltZXIgPSBudWxsO1xuICAgIHRoaXMuX2lucHV0ID0gbnVsbDtcbiAgICB0aGlzLmNvdW50ID0gMDtcbn1cblxuaW5oZXJpdChUYXBSZWNvZ25pemVyLCBSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQaW5jaFJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3RhcCcsXG4gICAgICAgIHBvaW50ZXJzOiAxLFxuICAgICAgICB0YXBzOiAxLFxuICAgICAgICBpbnRlcnZhbDogMzAwLCAvLyBtYXggdGltZSBiZXR3ZWVuIHRoZSBtdWx0aS10YXAgdGFwc1xuICAgICAgICB0aW1lOiAyNTAsIC8vIG1heCB0aW1lIG9mIHRoZSBwb2ludGVyIHRvIGJlIGRvd24gKGxpa2UgZmluZ2VyIG9uIHRoZSBzY3JlZW4pXG4gICAgICAgIHRocmVzaG9sZDogOSwgLy8gYSBtaW5pbWFsIG1vdmVtZW50IGlzIG9rLCBidXQga2VlcCBpdCBsb3dcbiAgICAgICAgcG9zVGhyZXNob2xkOiAxMCAvLyBhIG11bHRpLXRhcCBjYW4gYmUgYSBiaXQgb2ZmIHRoZSBpbml0aWFsIHBvc2l0aW9uXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OXTtcbiAgICB9LFxuXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICAgICAgdmFyIHZhbGlkUG9pbnRlcnMgPSBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IG9wdGlvbnMucG9pbnRlcnM7XG4gICAgICAgIHZhciB2YWxpZE1vdmVtZW50ID0gaW5wdXQuZGlzdGFuY2UgPCBvcHRpb25zLnRocmVzaG9sZDtcbiAgICAgICAgdmFyIHZhbGlkVG91Y2hUaW1lID0gaW5wdXQuZGVsdGFUaW1lIDwgb3B0aW9ucy50aW1lO1xuXG4gICAgICAgIHRoaXMucmVzZXQoKTtcblxuICAgICAgICBpZiAoKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX1NUQVJUKSAmJiAodGhpcy5jb3VudCA9PT0gMCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZhaWxUaW1lb3V0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB3ZSBvbmx5IGFsbG93IGxpdHRsZSBtb3ZlbWVudFxuICAgICAgICAvLyBhbmQgd2UndmUgcmVhY2hlZCBhbiBlbmQgZXZlbnQsIHNvIGEgdGFwIGlzIHBvc3NpYmxlXG4gICAgICAgIGlmICh2YWxpZE1vdmVtZW50ICYmIHZhbGlkVG91Y2hUaW1lICYmIHZhbGlkUG9pbnRlcnMpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5ldmVudFR5cGUgIT0gSU5QVVRfRU5EKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFpbFRpbWVvdXQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHZhbGlkSW50ZXJ2YWwgPSB0aGlzLnBUaW1lID8gKGlucHV0LnRpbWVTdGFtcCAtIHRoaXMucFRpbWUgPCBvcHRpb25zLmludGVydmFsKSA6IHRydWU7XG4gICAgICAgICAgICB2YXIgdmFsaWRNdWx0aVRhcCA9ICF0aGlzLnBDZW50ZXIgfHwgZ2V0RGlzdGFuY2UodGhpcy5wQ2VudGVyLCBpbnB1dC5jZW50ZXIpIDwgb3B0aW9ucy5wb3NUaHJlc2hvbGQ7XG5cbiAgICAgICAgICAgIHRoaXMucFRpbWUgPSBpbnB1dC50aW1lU3RhbXA7XG4gICAgICAgICAgICB0aGlzLnBDZW50ZXIgPSBpbnB1dC5jZW50ZXI7XG5cbiAgICAgICAgICAgIGlmICghdmFsaWRNdWx0aVRhcCB8fCAhdmFsaWRJbnRlcnZhbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgPSAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG5cbiAgICAgICAgICAgIC8vIGlmIHRhcCBjb3VudCBtYXRjaGVzIHdlIGhhdmUgcmVjb2duaXplZCBpdCxcbiAgICAgICAgICAgIC8vIGVsc2UgaXQgaGFzIGJlZ2FuIHJlY29nbml6aW5nLi4uXG4gICAgICAgICAgICB2YXIgdGFwQ291bnQgPSB0aGlzLmNvdW50ICUgb3B0aW9ucy50YXBzO1xuICAgICAgICAgICAgaWYgKHRhcENvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gbm8gZmFpbGluZyByZXF1aXJlbWVudHMsIGltbWVkaWF0ZWx5IHRyaWdnZXIgdGhlIHRhcCBldmVudFxuICAgICAgICAgICAgICAgIC8vIG9yIHdhaXQgYXMgbG9uZyBhcyB0aGUgbXVsdGl0YXAgaW50ZXJ2YWwgdG8gdHJpZ2dlclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNSZXF1aXJlRmFpbHVyZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXRDb250ZXh0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1JFQ09HTklaRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyeUVtaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgb3B0aW9ucy5pbnRlcnZhbCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9CRUdBTjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9LFxuXG4gICAgZmFpbFRpbWVvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXRDb250ZXh0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX0ZBSUxFRDtcbiAgICAgICAgfSwgdGhpcy5vcHRpb25zLmludGVydmFsLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT0gU1RBVEVfUkVDT0dOSVpFRCkge1xuICAgICAgICAgICAgdGhpcy5faW5wdXQudGFwQ291bnQgPSB0aGlzLmNvdW50O1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50LCB0aGlzLl9pbnB1dCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuLyoqXG4gKiBTaW1wbGUgd2F5IHRvIGNyZWF0ZSBhIG1hbmFnZXIgd2l0aCBhIGRlZmF1bHQgc2V0IG9mIHJlY29nbml6ZXJzLlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEhhbW1lcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy5yZWNvZ25pemVycyA9IGlmVW5kZWZpbmVkKG9wdGlvbnMucmVjb2duaXplcnMsIEhhbW1lci5kZWZhdWx0cy5wcmVzZXQpO1xuICAgIHJldHVybiBuZXcgTWFuYWdlcihlbGVtZW50LCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBAY29uc3Qge3N0cmluZ31cbiAqL1xuSGFtbWVyLlZFUlNJT04gPSAnMi4wLjYnO1xuXG4vKipcbiAqIGRlZmF1bHQgc2V0dGluZ3NcbiAqIEBuYW1lc3BhY2VcbiAqL1xuSGFtbWVyLmRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIHNldCBpZiBET00gZXZlbnRzIGFyZSBiZWluZyB0cmlnZ2VyZWQuXG4gICAgICogQnV0IHRoaXMgaXMgc2xvd2VyIGFuZCB1bnVzZWQgYnkgc2ltcGxlIGltcGxlbWVudGF0aW9ucywgc28gZGlzYWJsZWQgYnkgZGVmYXVsdC5cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAqL1xuICAgIGRvbUV2ZW50czogZmFsc2UsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgdmFsdWUgZm9yIHRoZSB0b3VjaEFjdGlvbiBwcm9wZXJ0eS9mYWxsYmFjay5cbiAgICAgKiBXaGVuIHNldCB0byBgY29tcHV0ZWAgaXQgd2lsbCBtYWdpY2FsbHkgc2V0IHRoZSBjb3JyZWN0IHZhbHVlIGJhc2VkIG9uIHRoZSBhZGRlZCByZWNvZ25pemVycy5cbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqIEBkZWZhdWx0IGNvbXB1dGVcbiAgICAgKi9cbiAgICB0b3VjaEFjdGlvbjogVE9VQ0hfQUNUSU9OX0NPTVBVVEUsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgICovXG4gICAgZW5hYmxlOiB0cnVlLFxuXG4gICAgLyoqXG4gICAgICogRVhQRVJJTUVOVEFMIEZFQVRVUkUgLS0gY2FuIGJlIHJlbW92ZWQvY2hhbmdlZFxuICAgICAqIENoYW5nZSB0aGUgcGFyZW50IGlucHV0IHRhcmdldCBlbGVtZW50LlxuICAgICAqIElmIE51bGwsIHRoZW4gaXQgaXMgYmVpbmcgc2V0IHRoZSB0byBtYWluIGVsZW1lbnQuXG4gICAgICogQHR5cGUge051bGx8RXZlbnRUYXJnZXR9XG4gICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAqL1xuICAgIGlucHV0VGFyZ2V0OiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogZm9yY2UgYW4gaW5wdXQgY2xhc3NcbiAgICAgKiBAdHlwZSB7TnVsbHxGdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgaW5wdXRDbGFzczogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIERlZmF1bHQgcmVjb2duaXplciBzZXR1cCB3aGVuIGNhbGxpbmcgYEhhbW1lcigpYFxuICAgICAqIFdoZW4gY3JlYXRpbmcgYSBuZXcgTWFuYWdlciB0aGVzZSB3aWxsIGJlIHNraXBwZWQuXG4gICAgICogQHR5cGUge0FycmF5fVxuICAgICAqL1xuICAgIHByZXNldDogW1xuICAgICAgICAvLyBSZWNvZ25pemVyQ2xhc3MsIG9wdGlvbnMsIFtyZWNvZ25pemVXaXRoLCAuLi5dLCBbcmVxdWlyZUZhaWx1cmUsIC4uLl1cbiAgICAgICAgW1JvdGF0ZVJlY29nbml6ZXIsIHtlbmFibGU6IGZhbHNlfV0sXG4gICAgICAgIFtQaW5jaFJlY29nbml6ZXIsIHtlbmFibGU6IGZhbHNlfSwgWydyb3RhdGUnXV0sXG4gICAgICAgIFtTd2lwZVJlY29nbml6ZXIsIHtkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMfV0sXG4gICAgICAgIFtQYW5SZWNvZ25pemVyLCB7ZGlyZWN0aW9uOiBESVJFQ1RJT05fSE9SSVpPTlRBTH0sIFsnc3dpcGUnXV0sXG4gICAgICAgIFtUYXBSZWNvZ25pemVyXSxcbiAgICAgICAgW1RhcFJlY29nbml6ZXIsIHtldmVudDogJ2RvdWJsZXRhcCcsIHRhcHM6IDJ9LCBbJ3RhcCddXSxcbiAgICAgICAgW1ByZXNzUmVjb2duaXplcl1cbiAgICBdLFxuXG4gICAgLyoqXG4gICAgICogU29tZSBDU1MgcHJvcGVydGllcyBjYW4gYmUgdXNlZCB0byBpbXByb3ZlIHRoZSB3b3JraW5nIG9mIEhhbW1lci5cbiAgICAgKiBBZGQgdGhlbSB0byB0aGlzIG1ldGhvZCBhbmQgdGhleSB3aWxsIGJlIHNldCB3aGVuIGNyZWF0aW5nIGEgbmV3IE1hbmFnZXIuXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqL1xuICAgIGNzc1Byb3BzOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNhYmxlcyB0ZXh0IHNlbGVjdGlvbiB0byBpbXByb3ZlIHRoZSBkcmFnZ2luZyBnZXN0dXJlLiBNYWlubHkgZm9yIGRlc2t0b3AgYnJvd3NlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNhYmxlIHRoZSBXaW5kb3dzIFBob25lIGdyaXBwZXJzIHdoZW4gcHJlc3NpbmcgYW4gZWxlbWVudC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB0b3VjaFNlbGVjdDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNhYmxlcyB0aGUgZGVmYXVsdCBjYWxsb3V0IHNob3duIHdoZW4geW91IHRvdWNoIGFuZCBob2xkIGEgdG91Y2ggdGFyZ2V0LlxuICAgICAgICAgKiBPbiBpT1MsIHdoZW4geW91IHRvdWNoIGFuZCBob2xkIGEgdG91Y2ggdGFyZ2V0IHN1Y2ggYXMgYSBsaW5rLCBTYWZhcmkgZGlzcGxheXNcbiAgICAgICAgICogYSBjYWxsb3V0IGNvbnRhaW5pbmcgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGxpbmsuIFRoaXMgcHJvcGVydHkgYWxsb3dzIHlvdSB0byBkaXNhYmxlIHRoYXQgY2FsbG91dC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB0b3VjaENhbGxvdXQ6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3BlY2lmaWVzIHdoZXRoZXIgem9vbWluZyBpcyBlbmFibGVkLiBVc2VkIGJ5IElFMTA+XG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgY29udGVudFpvb21pbmc6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3BlY2lmaWVzIHRoYXQgYW4gZW50aXJlIGVsZW1lbnQgc2hvdWxkIGJlIGRyYWdnYWJsZSBpbnN0ZWFkIG9mIGl0cyBjb250ZW50cy4gTWFpbmx5IGZvciBkZXNrdG9wIGJyb3dzZXJzLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHVzZXJEcmFnOiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE92ZXJyaWRlcyB0aGUgaGlnaGxpZ2h0IGNvbG9yIHNob3duIHdoZW4gdGhlIHVzZXIgdGFwcyBhIGxpbmsgb3IgYSBKYXZhU2NyaXB0XG4gICAgICAgICAqIGNsaWNrYWJsZSBlbGVtZW50IGluIGlPUy4gVGhpcyBwcm9wZXJ0eSBvYmV5cyB0aGUgYWxwaGEgdmFsdWUsIGlmIHNwZWNpZmllZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ3JnYmEoMCwwLDAsMCknXG4gICAgICAgICAqL1xuICAgICAgICB0YXBIaWdobGlnaHRDb2xvcjogJ3JnYmEoMCwwLDAsMCknXG4gICAgfVxufTtcblxudmFyIFNUT1AgPSAxO1xudmFyIEZPUkNFRF9TVE9QID0gMjtcblxuLyoqXG4gKiBNYW5hZ2VyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTWFuYWdlcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gYXNzaWduKHt9LCBIYW1tZXIuZGVmYXVsdHMsIG9wdGlvbnMgfHwge30pO1xuXG4gICAgdGhpcy5vcHRpb25zLmlucHV0VGFyZ2V0ID0gdGhpcy5vcHRpb25zLmlucHV0VGFyZ2V0IHx8IGVsZW1lbnQ7XG5cbiAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gICAgdGhpcy5zZXNzaW9uID0ge307XG4gICAgdGhpcy5yZWNvZ25pemVycyA9IFtdO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLmlucHV0ID0gY3JlYXRlSW5wdXRJbnN0YW5jZSh0aGlzKTtcbiAgICB0aGlzLnRvdWNoQWN0aW9uID0gbmV3IFRvdWNoQWN0aW9uKHRoaXMsIHRoaXMub3B0aW9ucy50b3VjaEFjdGlvbik7XG5cbiAgICB0b2dnbGVDc3NQcm9wcyh0aGlzLCB0cnVlKTtcblxuICAgIGVhY2godGhpcy5vcHRpb25zLnJlY29nbml6ZXJzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciByZWNvZ25pemVyID0gdGhpcy5hZGQobmV3IChpdGVtWzBdKShpdGVtWzFdKSk7XG4gICAgICAgIGl0ZW1bMl0gJiYgcmVjb2duaXplci5yZWNvZ25pemVXaXRoKGl0ZW1bMl0pO1xuICAgICAgICBpdGVtWzNdICYmIHJlY29nbml6ZXIucmVxdWlyZUZhaWx1cmUoaXRlbVszXSk7XG4gICAgfSwgdGhpcyk7XG59XG5cbk1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNldCBvcHRpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7TWFuYWdlcn1cbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gT3B0aW9ucyB0aGF0IG5lZWQgYSBsaXR0bGUgbW9yZSBzZXR1cFxuICAgICAgICBpZiAob3B0aW9ucy50b3VjaEFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnB1dFRhcmdldCkge1xuICAgICAgICAgICAgLy8gQ2xlYW4gdXAgZXhpc3RpbmcgZXZlbnQgbGlzdGVuZXJzIGFuZCByZWluaXRpYWxpemVcbiAgICAgICAgICAgIHRoaXMuaW5wdXQuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC50YXJnZXQgPSBvcHRpb25zLmlucHV0VGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5pbml0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHN0b3AgcmVjb2duaXppbmcgZm9yIHRoaXMgc2Vzc2lvbi5cbiAgICAgKiBUaGlzIHNlc3Npb24gd2lsbCBiZSBkaXNjYXJkZWQsIHdoZW4gYSBuZXcgW2lucHV0XXN0YXJ0IGV2ZW50IGlzIGZpcmVkLlxuICAgICAqIFdoZW4gZm9yY2VkLCB0aGUgcmVjb2duaXplciBjeWNsZSBpcyBzdG9wcGVkIGltbWVkaWF0ZWx5LlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2ZvcmNlXVxuICAgICAqL1xuICAgIHN0b3A6IGZ1bmN0aW9uKGZvcmNlKSB7XG4gICAgICAgIHRoaXMuc2Vzc2lvbi5zdG9wcGVkID0gZm9yY2UgPyBGT1JDRURfU1RPUCA6IFNUT1A7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJ1biB0aGUgcmVjb2duaXplcnMhXG4gICAgICogY2FsbGVkIGJ5IHRoZSBpbnB1dEhhbmRsZXIgZnVuY3Rpb24gb24gZXZlcnkgbW92ZW1lbnQgb2YgdGhlIHBvaW50ZXJzICh0b3VjaGVzKVxuICAgICAqIGl0IHdhbGtzIHRocm91Z2ggYWxsIHRoZSByZWNvZ25pemVycyBhbmQgdHJpZXMgdG8gZGV0ZWN0IHRoZSBnZXN0dXJlIHRoYXQgaXMgYmVpbmcgbWFkZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICByZWNvZ25pemU6IGZ1bmN0aW9uKGlucHV0RGF0YSkge1xuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbjtcbiAgICAgICAgaWYgKHNlc3Npb24uc3RvcHBlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcnVuIHRoZSB0b3VjaC1hY3Rpb24gcG9seWZpbGxcbiAgICAgICAgdGhpcy50b3VjaEFjdGlvbi5wcmV2ZW50RGVmYXVsdHMoaW5wdXREYXRhKTtcblxuICAgICAgICB2YXIgcmVjb2duaXplcjtcbiAgICAgICAgdmFyIHJlY29nbml6ZXJzID0gdGhpcy5yZWNvZ25pemVycztcblxuICAgICAgICAvLyB0aGlzIGhvbGRzIHRoZSByZWNvZ25pemVyIHRoYXQgaXMgYmVpbmcgcmVjb2duaXplZC5cbiAgICAgICAgLy8gc28gdGhlIHJlY29nbml6ZXIncyBzdGF0ZSBuZWVkcyB0byBiZSBCRUdBTiwgQ0hBTkdFRCwgRU5ERUQgb3IgUkVDT0dOSVpFRFxuICAgICAgICAvLyBpZiBubyByZWNvZ25pemVyIGlzIGRldGVjdGluZyBhIHRoaW5nLCBpdCBpcyBzZXQgdG8gYG51bGxgXG4gICAgICAgIHZhciBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyO1xuXG4gICAgICAgIC8vIHJlc2V0IHdoZW4gdGhlIGxhc3QgcmVjb2duaXplciBpcyByZWNvZ25pemVkXG4gICAgICAgIC8vIG9yIHdoZW4gd2UncmUgaW4gYSBuZXcgc2Vzc2lvblxuICAgICAgICBpZiAoIWN1clJlY29nbml6ZXIgfHwgKGN1clJlY29nbml6ZXIgJiYgY3VyUmVjb2duaXplci5zdGF0ZSAmIFNUQVRFX1JFQ09HTklaRUQpKSB7XG4gICAgICAgICAgICBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCByZWNvZ25pemVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlY29nbml6ZXIgPSByZWNvZ25pemVyc1tpXTtcblxuICAgICAgICAgICAgLy8gZmluZCBvdXQgaWYgd2UgYXJlIGFsbG93ZWQgdHJ5IHRvIHJlY29nbml6ZSB0aGUgaW5wdXQgZm9yIHRoaXMgb25lLlxuICAgICAgICAgICAgLy8gMS4gICBhbGxvdyBpZiB0aGUgc2Vzc2lvbiBpcyBOT1QgZm9yY2VkIHN0b3BwZWQgKHNlZSB0aGUgLnN0b3AoKSBtZXRob2QpXG4gICAgICAgICAgICAvLyAyLiAgIGFsbG93IGlmIHdlIHN0aWxsIGhhdmVuJ3QgcmVjb2duaXplZCBhIGdlc3R1cmUgaW4gdGhpcyBzZXNzaW9uLCBvciB0aGUgdGhpcyByZWNvZ25pemVyIGlzIHRoZSBvbmVcbiAgICAgICAgICAgIC8vICAgICAgdGhhdCBpcyBiZWluZyByZWNvZ25pemVkLlxuICAgICAgICAgICAgLy8gMy4gICBhbGxvdyBpZiB0aGUgcmVjb2duaXplciBpcyBhbGxvd2VkIHRvIHJ1biBzaW11bHRhbmVvdXMgd2l0aCB0aGUgY3VycmVudCByZWNvZ25pemVkIHJlY29nbml6ZXIuXG4gICAgICAgICAgICAvLyAgICAgIHRoaXMgY2FuIGJlIHNldHVwIHdpdGggdGhlIGByZWNvZ25pemVXaXRoKClgIG1ldGhvZCBvbiB0aGUgcmVjb2duaXplci5cbiAgICAgICAgICAgIGlmIChzZXNzaW9uLnN0b3BwZWQgIT09IEZPUkNFRF9TVE9QICYmICggLy8gMVxuICAgICAgICAgICAgICAgICAgICAhY3VyUmVjb2duaXplciB8fCByZWNvZ25pemVyID09IGN1clJlY29nbml6ZXIgfHwgLy8gMlxuICAgICAgICAgICAgICAgICAgICByZWNvZ25pemVyLmNhblJlY29nbml6ZVdpdGgoY3VyUmVjb2duaXplcikpKSB7IC8vIDNcbiAgICAgICAgICAgICAgICByZWNvZ25pemVyLnJlY29nbml6ZShpbnB1dERhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWNvZ25pemVyLnJlc2V0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSByZWNvZ25pemVyIGhhcyBiZWVuIHJlY29nbml6aW5nIHRoZSBpbnB1dCBhcyBhIHZhbGlkIGdlc3R1cmUsIHdlIHdhbnQgdG8gc3RvcmUgdGhpcyBvbmUgYXMgdGhlXG4gICAgICAgICAgICAvLyBjdXJyZW50IGFjdGl2ZSByZWNvZ25pemVyLiBidXQgb25seSBpZiB3ZSBkb24ndCBhbHJlYWR5IGhhdmUgYW4gYWN0aXZlIHJlY29nbml6ZXJcbiAgICAgICAgICAgIGlmICghY3VyUmVjb2duaXplciAmJiByZWNvZ25pemVyLnN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCB8IFNUQVRFX0VOREVEKSkge1xuICAgICAgICAgICAgICAgIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXIgPSByZWNvZ25pemVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGdldCBhIHJlY29nbml6ZXIgYnkgaXRzIGV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfFN0cmluZ30gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfE51bGx9XG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChyZWNvZ25pemVyIGluc3RhbmNlb2YgUmVjb2duaXplcikge1xuICAgICAgICAgICAgcmV0dXJuIHJlY29nbml6ZXI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlY29nbml6ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAocmVjb2duaXplcnNbaV0ub3B0aW9ucy5ldmVudCA9PSByZWNvZ25pemVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY29nbml6ZXJzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBhZGQgYSByZWNvZ25pemVyIHRvIHRoZSBtYW5hZ2VyXG4gICAgICogZXhpc3RpbmcgcmVjb2duaXplcnMgd2l0aCB0aGUgc2FtZSBldmVudCBuYW1lIHdpbGwgYmUgcmVtb3ZlZFxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfE1hbmFnZXJ9XG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhyZWNvZ25pemVyLCAnYWRkJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVtb3ZlIGV4aXN0aW5nXG4gICAgICAgIHZhciBleGlzdGluZyA9IHRoaXMuZ2V0KHJlY29nbml6ZXIub3B0aW9ucy5ldmVudCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoZXhpc3RpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWNvZ25pemVycy5wdXNoKHJlY29nbml6ZXIpO1xuICAgICAgICByZWNvZ25pemVyLm1hbmFnZXIgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgIHJldHVybiByZWNvZ25pemVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZW1vdmUgYSByZWNvZ25pemVyIGJ5IG5hbWUgb3IgaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge01hbmFnZXJ9XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhyZWNvZ25pemVyLCAncmVtb3ZlJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjb2duaXplciA9IHRoaXMuZ2V0KHJlY29nbml6ZXIpO1xuXG4gICAgICAgIC8vIGxldCdzIG1ha2Ugc3VyZSB0aGlzIHJlY29nbml6ZXIgZXhpc3RzXG4gICAgICAgIGlmIChyZWNvZ25pemVyKSB7XG4gICAgICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gaW5BcnJheShyZWNvZ25pemVycywgcmVjb2duaXplcik7XG5cbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZWNvZ25pemVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogYmluZCBldmVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudHNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gICAgICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gdGhpc1xuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbihldmVudHMsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcbiAgICAgICAgZWFjaChzcGxpdFN0cihldmVudHMpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdID0gaGFuZGxlcnNbZXZlbnRdIHx8IFtdO1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdW5iaW5kIGV2ZW50LCBsZWF2ZSBlbWl0IGJsYW5rIHRvIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2hhbmRsZXJdXG4gICAgICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gdGhpc1xuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24oZXZlbnRzLCBoYW5kbGVyKSB7XG4gICAgICAgIHZhciBoYW5kbGVycyA9IHRoaXMuaGFuZGxlcnM7XG4gICAgICAgIGVhY2goc3BsaXRTdHIoZXZlbnRzKSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICghaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBoYW5kbGVyc1tldmVudF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhhbmRsZXJzW2V2ZW50XSAmJiBoYW5kbGVyc1tldmVudF0uc3BsaWNlKGluQXJyYXkoaGFuZGxlcnNbZXZlbnRdLCBoYW5kbGVyKSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZW1pdCBldmVudCB0byB0aGUgbGlzdGVuZXJzXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKi9cbiAgICBlbWl0OiBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICAgICAgICAvLyB3ZSBhbHNvIHdhbnQgdG8gdHJpZ2dlciBkb20gZXZlbnRzXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZG9tRXZlbnRzKSB7XG4gICAgICAgICAgICB0cmlnZ2VyRG9tRXZlbnQoZXZlbnQsIGRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm8gaGFuZGxlcnMsIHNvIHNraXAgaXQgYWxsXG4gICAgICAgIHZhciBoYW5kbGVycyA9IHRoaXMuaGFuZGxlcnNbZXZlbnRdICYmIHRoaXMuaGFuZGxlcnNbZXZlbnRdLnNsaWNlKCk7XG4gICAgICAgIGlmICghaGFuZGxlcnMgfHwgIWhhbmRsZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0YS50eXBlID0gZXZlbnQ7XG4gICAgICAgIGRhdGEucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRhdGEuc3JjRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgaGFuZGxlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBoYW5kbGVyc1tpXShkYXRhKTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBkZXN0cm95IHRoZSBtYW5hZ2VyIGFuZCB1bmJpbmRzIGFsbCBldmVudHNcbiAgICAgKiBpdCBkb2Vzbid0IHVuYmluZCBkb20gZXZlbnRzLCB0aGF0IGlzIHRoZSB1c2VyIG93biByZXNwb25zaWJpbGl0eVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgJiYgdG9nZ2xlQ3NzUHJvcHModGhpcywgZmFsc2UpO1xuXG4gICAgICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgICAgICAgdGhpcy5zZXNzaW9uID0ge307XG4gICAgICAgIHRoaXMuaW5wdXQuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgIH1cbn07XG5cbi8qKlxuICogYWRkL3JlbW92ZSB0aGUgY3NzIHByb3BlcnRpZXMgYXMgZGVmaW5lZCBpbiBtYW5hZ2VyLm9wdGlvbnMuY3NzUHJvcHNcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtCb29sZWFufSBhZGRcbiAqL1xuZnVuY3Rpb24gdG9nZ2xlQ3NzUHJvcHMobWFuYWdlciwgYWRkKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgaWYgKCFlbGVtZW50LnN0eWxlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZWFjaChtYW5hZ2VyLm9wdGlvbnMuY3NzUHJvcHMsIGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGVbcHJlZml4ZWQoZWxlbWVudC5zdHlsZSwgbmFtZSldID0gYWRkID8gdmFsdWUgOiAnJztcbiAgICB9KTtcbn1cblxuLyoqXG4gKiB0cmlnZ2VyIGRvbSBldmVudFxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICovXG5mdW5jdGlvbiB0cmlnZ2VyRG9tRXZlbnQoZXZlbnQsIGRhdGEpIHtcbiAgICB2YXIgZ2VzdHVyZUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZ2VzdHVyZUV2ZW50LmluaXRFdmVudChldmVudCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZ2VzdHVyZUV2ZW50Lmdlc3R1cmUgPSBkYXRhO1xuICAgIGRhdGEudGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VzdHVyZUV2ZW50KTtcbn1cblxuYXNzaWduKEhhbW1lciwge1xuICAgIElOUFVUX1NUQVJUOiBJTlBVVF9TVEFSVCxcbiAgICBJTlBVVF9NT1ZFOiBJTlBVVF9NT1ZFLFxuICAgIElOUFVUX0VORDogSU5QVVRfRU5ELFxuICAgIElOUFVUX0NBTkNFTDogSU5QVVRfQ0FOQ0VMLFxuXG4gICAgU1RBVEVfUE9TU0lCTEU6IFNUQVRFX1BPU1NJQkxFLFxuICAgIFNUQVRFX0JFR0FOOiBTVEFURV9CRUdBTixcbiAgICBTVEFURV9DSEFOR0VEOiBTVEFURV9DSEFOR0VELFxuICAgIFNUQVRFX0VOREVEOiBTVEFURV9FTkRFRCxcbiAgICBTVEFURV9SRUNPR05JWkVEOiBTVEFURV9SRUNPR05JWkVELFxuICAgIFNUQVRFX0NBTkNFTExFRDogU1RBVEVfQ0FOQ0VMTEVELFxuICAgIFNUQVRFX0ZBSUxFRDogU1RBVEVfRkFJTEVELFxuXG4gICAgRElSRUNUSU9OX05PTkU6IERJUkVDVElPTl9OT05FLFxuICAgIERJUkVDVElPTl9MRUZUOiBESVJFQ1RJT05fTEVGVCxcbiAgICBESVJFQ1RJT05fUklHSFQ6IERJUkVDVElPTl9SSUdIVCxcbiAgICBESVJFQ1RJT05fVVA6IERJUkVDVElPTl9VUCxcbiAgICBESVJFQ1RJT05fRE9XTjogRElSRUNUSU9OX0RPV04sXG4gICAgRElSRUNUSU9OX0hPUklaT05UQUw6IERJUkVDVElPTl9IT1JJWk9OVEFMLFxuICAgIERJUkVDVElPTl9WRVJUSUNBTDogRElSRUNUSU9OX1ZFUlRJQ0FMLFxuICAgIERJUkVDVElPTl9BTEw6IERJUkVDVElPTl9BTEwsXG5cbiAgICBNYW5hZ2VyOiBNYW5hZ2VyLFxuICAgIElucHV0OiBJbnB1dCxcbiAgICBUb3VjaEFjdGlvbjogVG91Y2hBY3Rpb24sXG5cbiAgICBUb3VjaElucHV0OiBUb3VjaElucHV0LFxuICAgIE1vdXNlSW5wdXQ6IE1vdXNlSW5wdXQsXG4gICAgUG9pbnRlckV2ZW50SW5wdXQ6IFBvaW50ZXJFdmVudElucHV0LFxuICAgIFRvdWNoTW91c2VJbnB1dDogVG91Y2hNb3VzZUlucHV0LFxuICAgIFNpbmdsZVRvdWNoSW5wdXQ6IFNpbmdsZVRvdWNoSW5wdXQsXG5cbiAgICBSZWNvZ25pemVyOiBSZWNvZ25pemVyLFxuICAgIEF0dHJSZWNvZ25pemVyOiBBdHRyUmVjb2duaXplcixcbiAgICBUYXA6IFRhcFJlY29nbml6ZXIsXG4gICAgUGFuOiBQYW5SZWNvZ25pemVyLFxuICAgIFN3aXBlOiBTd2lwZVJlY29nbml6ZXIsXG4gICAgUGluY2g6IFBpbmNoUmVjb2duaXplcixcbiAgICBSb3RhdGU6IFJvdGF0ZVJlY29nbml6ZXIsXG4gICAgUHJlc3M6IFByZXNzUmVjb2duaXplcixcblxuICAgIG9uOiBhZGRFdmVudExpc3RlbmVycyxcbiAgICBvZmY6IHJlbW92ZUV2ZW50TGlzdGVuZXJzLFxuICAgIGVhY2g6IGVhY2gsXG4gICAgbWVyZ2U6IG1lcmdlLFxuICAgIGV4dGVuZDogZXh0ZW5kLFxuICAgIGFzc2lnbjogYXNzaWduLFxuICAgIGluaGVyaXQ6IGluaGVyaXQsXG4gICAgYmluZEZuOiBiaW5kRm4sXG4gICAgcHJlZml4ZWQ6IHByZWZpeGVkXG59KTtcblxuLy8gdGhpcyBwcmV2ZW50cyBlcnJvcnMgd2hlbiBIYW1tZXIgaXMgbG9hZGVkIGluIHRoZSBwcmVzZW5jZSBvZiBhbiBBTURcbi8vICBzdHlsZSBsb2FkZXIgYnV0IGJ5IHNjcmlwdCB0YWcsIG5vdCBieSB0aGUgbG9hZGVyLlxudmFyIGZyZWVHbG9iYWwgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHt9KSk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuZnJlZUdsb2JhbC5IYW1tZXIgPSBIYW1tZXI7XG5cbmlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBIYW1tZXI7XG4gICAgfSk7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhhbW1lcjtcbn0gZWxzZSB7XG4gICAgd2luZG93W2V4cG9ydE5hbWVdID0gSGFtbWVyO1xufVxuXG59KSh3aW5kb3csIGRvY3VtZW50LCAnSGFtbWVyJyk7XG4iLCJ2YXIgcG9zdEdyYXBoaWNzVGVtcGxhdGUgPSByZXF1aXJlKCcuL3BnLXRlbXBsYXRlL3Bvc3RHcmFwaGljc1RlbXBsYXRlLmpzJyk7XG5cbiIsIihmdW5jdGlvbigpIHtcblxuICAgIC8vIEFsbCB1dGlsaXR5IGZ1bmN0aW9ucyBzaG91bGQgYXR0YWNoIHRoZW1zZWx2ZXMgdG8gdGhpcyBvYmplY3QuXG4gICAgdmFyIHV0aWwgPSB7fTtcblxuICAgIC8vIFRoaXMgY29kZSBhc3N1bWVzIGl0IGlzIHJ1bm5pbmcgaW4gYSBicm93c2VyIGNvbnRleHRcbiAgICB3aW5kb3cuVFdQID0gd2luZG93LlRXUCB8fCB7XG4gICAgICAgIE1vZHVsZToge31cbiAgICB9O1xuICAgIHdpbmRvdy5UV1AuTW9kdWxlID0gd2luZG93LlRXUC5Nb2R1bGUgfHwge307XG4gICAgd2luZG93LlRXUC5Nb2R1bGUudXRpbCA9IHV0aWw7XG5cbiAgICBpZiAoIXV0aWwuZ2V0UGFyYW1ldGVycyB8fCB0eXBlb2YgdXRpbC5nZXRQYXJhbWV0ZXJzID09PSAndW5kZWZpbmVkJyl7XG4gICAgICAgIHV0aWwuZ2V0UGFyYW1ldGVycyA9IGZ1bmN0aW9uKHVybCl7XG4gICAgICAgICAgICB2YXIgcGFyYW1MaXN0ID0gW10sXG4gICAgICAgICAgICAgICAgcGFyYW1zID0ge30sXG4gICAgICAgICAgICAgICAga3ZQYWlycyxcbiAgICAgICAgICAgICAgICB0bXA7XG4gICAgICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVybC5pbmRleE9mKCc/JykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtTGlzdCA9IHVybC5zcGxpdCgnPycpWzFdO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW1MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW1MaXN0LmluZGV4T2YoJyYnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGt2UGFpcnMgPSBwYXJhbUxpc3Quc3BsaXQoJyYnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga3ZQYWlycyA9IFtwYXJhbUxpc3RdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYSA9IDA7IGEgPCBrdlBhaXJzLmxlbmd0aDsgYSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGt2UGFpcnNbYV0uaW5kZXhPZignPScpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bXAgPSBrdlBhaXJzW2FdLnNwbGl0KCc9Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtc1t0bXBbMF1dID0gdW5lc2NhcGUodG1wWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0aGUgaGVpZ2h0IG9mIHRoZSBpZnJhbWUgaWYgdGhpcyBwYWdlIGlzIGlmcmFtZSdkLlxuICAgIC8vIE5PVEU6IFRoaXMgKipyZXF1aXJlcyoqIHRoZSBpZnJhbWUncyBzcmMgcHJvcGVydHkgdG8gdXNlIGEgbG9jYXRpb25cbiAgICAvLyB3aXRob3V0IGl0cyBwcm90b2NvbC4gVXNpbmcgYSBwcm90b2NvbCB3aWxsIG5vdCB3b3JrLlxuICAgIC8vXG4gICAgLy8gZS5nLiA8aWZyYW1lIGZyYW1lYm9yZGVyPVwiMFwiIHNjcm9sbGluZz1cIm5vXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OjYwMHB4O1wiIHNyYz1cIi8vd3d3Lndhc2hpbmd0b25wb3N0LmNvbS9ncmFwaGljcy9uYXRpb25hbC9jZW5zdXMtY29tbXV0ZS1tYXAvP3RlbXBsYXRlPWlmcmFtZVwiPjwvaWZyYW1lPlxuICAgIHV0aWwuY2hhbmdlSWZyYW1lSGVpZ2h0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgLy8gTG9jYXRpb24gKndpdGhvdXQqIHByb3RvY29sIGFuZCBzZWFyY2ggcGFyYW1ldGVyc1xuICAgICAgICB2YXIgcGFydGlhbExvY2F0aW9uID0gKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4ucmVwbGFjZSh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wsICcnKSkgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG5cbiAgICAgICAgLy8gQnVpbGQgdXAgYSBzZXJpZXMgb2YgcG9zc2libGUgQ1NTIHNlbGVjdG9yIHN0cmluZ3NcbiAgICAgICAgdmFyIHNlbGVjdG9ycyA9IFtdO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgVVJMIGFzIGl0IGlzIChhZGRpbmcgaW4gdGhlIHNlYXJjaCBwYXJhbWV0ZXJzKVxuICAgICAgICBzZWxlY3RvcnMucHVzaCgnaWZyYW1lW3NyYz1cIicgKyBwYXJ0aWFsTG9jYXRpb24gKyB3aW5kb3cubG9jYXRpb24uc2VhcmNoICsgJ1wiXScpO1xuXG4gICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVbd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmxlbmd0aCAtIDFdID09PSAnLycpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBVUkwgaGFzIGEgdHJhaWxpbmcgc2xhc2gsIGFkZCBhIHZlcnNpb24gd2l0aG91dCBpdFxuICAgICAgICAgICAgLy8gKGFkZGluZyBpbiB0aGUgc2VhcmNoIHBhcmFtZXRlcnMpXG4gICAgICAgICAgICBzZWxlY3RvcnMucHVzaCgnaWZyYW1lW3NyYz1cIicgKyAocGFydGlhbExvY2F0aW9uLnNsaWNlKDAsIC0xKSArIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpICsgJ1wiXScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgdGhlIFVSTCBkb2VzICpub3QqIGhhdmUgYSB0cmFpbGluZyBzbGFzaCwgYWRkIGEgdmVyc2lvbiB3aXRoXG4gICAgICAgICAgICAvLyBpdCAoYWRkaW5nIGluIHRoZSBzZWFyY2ggcGFyYW1ldGVycylcbiAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKCdpZnJhbWVbc3JjPVwiJyArIHBhcnRpYWxMb2NhdGlvbiArICcvJyArIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggKyAnXCJdJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZWFyY2ggZm9yIHRob3NlIHNlbGVjdG9ycyBpbiB0aGUgcGFyZW50IHBhZ2UsIGFuZCBhZGp1c3QgdGhlIGhlaWdodFxuICAgICAgICAvLyBhY2NvcmRpbmdseS5cbiAgICAgICAgdmFyICRpZnJhbWUgPSAkKHdpbmRvdy50b3AuZG9jdW1lbnQpLmZpbmQoc2VsZWN0b3JzLmpvaW4oJywnKSk7XG4gICAgICAgIHZhciBoID0gJCgnYm9keScpLm91dGVySGVpZ2h0KHRydWUpO1xuICAgICAgICAkaWZyYW1lLmNzcyh7J2hlaWdodCcgOiBoICsgJ3B4J30pO1xuICAgIH07XG5cbiAgICAvLyBmcm9tIGh0dHA6Ly9kYXZpZHdhbHNoLm5hbWUvamF2YXNjcmlwdC1kZWJvdW5jZS1mdW5jdGlvblxuICAgIHV0aWwuZGVib3VuY2UgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcbiAgICAgICAgdmFyIHRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghaW1tZWRpYXRlKSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgICAgICAgaWYgKGNhbGxOb3cpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBpZnJhbWUgY29kZVxuICAgICAgICB2YXIgcGFyYW1zID0gdXRpbC5nZXRQYXJhbWV0ZXJzKGRvY3VtZW50LlVSTCk7XG4gICAgICAgIGlmIChwYXJhbXNbJ3RlbXBsYXRlJ10gJiYgcGFyYW1zWyd0ZW1wbGF0ZSddID09PSAnaWZyYW1lJykge1xuICAgICAgICAgICAgLy8gVE9ETyBXaHkgZG8gd2UgbmVlZCB0aGlzPyBOb2JvZHkga25vd3MuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmRvbWFpbiA9ICd3YXNoaW5ndG9ucG9zdC5jb20nO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICQoJ2JvZHknKS5hZGRDbGFzcygnaWZyYW1lJykuc2hvdygpLmNzcygnZGlzcGxheScsJ2Jsb2NrJyk7XG4gICAgICAgICAgICBpZiAocGFyYW1zWydncmFwaGljX2lkJ10pe1xuICAgICAgICAgICAgICAgICQoJyMnICsgcGFyYW1zWydncmFwaGljX2lkJ10pLnNpYmxpbmdzKCkuaGlkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJCgnI3BnY29udGVudCwgLnBnQXJ0aWNsZScpLnNpYmxpbmdzKCkuaGlkZSgpO1xuXG4gICAgICAgICAgICAvLyBDT1JTIGxpbWl0YXRpb25zXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgPT09IHdpbmRvdy50b3AubG9jYXRpb24uaG9zdG5hbWUpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzaXplSWZyYW1lID0gdXRpbC5kZWJvdW5jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWwuY2hhbmdlSWZyYW1lSGVpZ2h0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDI1MCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gcmVzcG9uc2l2ZSBwYXJ0XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gV2h5IDEwMDBtcz8gVGhpcyBpcyBub3QgcmVsaWFibGUuXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbC5jaGFuZ2VJZnJhbWVIZWlnaHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTAwMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCByZXNpemVJZnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0uY2FsbCh0aGlzKSk7XG4iLCJ2YXIgSGFtbWVyID0gcmVxdWlyZSgnaGFtbWVyanMnKTtcblxuKGZ1bmN0aW9uICgkLCB3aW5kb3csIHVuZGVmaW5lZCkge1xuXG4gICAgLypcbiAgICAgKiBleHRlbmQgalF1ZXJ5IGZvciBuaWNlciBzeW50YXggZm9yIHJlbmRlcmluZyBvdXIgbWVudXMgYW5kIGxpc3RzLlxuICAgICAqL1xuICAgIC8vdXBkYXRlIDxsaT5zIGZyb20ganNvblxuXG4gICAgdmFyIF9faXNJRSA9ICQoJ2h0bWwuaWUnKS5sZW5ndGggPyB0cnVlIDogZmFsc2U7XG5cblxuICAgICQuZm4uYXBwZW5kTGlua0l0ZW1zID0gZnVuY3Rpb24obGlua3MsIHN1cnJvdW5kaW5nVGFnKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcztcbiAgICAgICAgc3Vycm91bmRpbmdUYWcgPSBzdXJyb3VuZGluZ1RhZyB8fCBcIjxsaT5cIjtcbiAgICAgICAgJC5lYWNoKGxpbmtzLCBmdW5jdGlvbihpLCBsaW5rKSB7XG4gICAgICAgICAgICB2YXIgYSA9ICQoXCI8YT5cIik7XG4gICAgICAgICAgICBpZiAobGluay50aXRsZSkgeyBhLnRleHQobGluay50aXRsZSk7IH1cbiAgICAgICAgICAgIGlmIChsaW5rLmh0bWwpIHsgYS5odG1sKGxpbmsuaHRtbCk7IH1cbiAgICAgICAgICAgIGlmIChsaW5rLmhyZWYpIHsgYS5hdHRyKFwiaHJlZlwiLCBsaW5rLmhyZWYpOyB9XG4gICAgICAgICAgICBpZiAobGluay5hdHRyKSB7IGEuYXR0cihsaW5rLmF0dHIpOyB9XG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZChcbiAgICAgICAgICAgICAgICAkKHN1cnJvdW5kaW5nVGFnKS5hcHBlbmQoYSkuYWRkQ2xhc3MobGluay5zZWxlY3RlZCA/IFwic2VsZWN0ZWRcIiA6IFwiXCIpXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgICQuZm4udHJhY2tDbGljayA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBlbGVtZW50Lm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbGlua25hbWU7XG4gICAgICAgICAgICB2YXIgbGluayA9ICQodGhpcyk7XG4gICAgICAgICAgICBpZiAoISF3aW5kb3cucyAmJiB0eXBlb2Ygcy5zZW5kRGF0YVRvT21uaXR1cmUgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGxpbmtuYW1lID0gKFwicGJuYXY6XCIgKyB0eXBlICsgXCIgLSBcIiArICAkLnRyaW0obGluay50ZXh0KCkpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHMuc2VuZERhdGFUb09tbml0dXJlKGxpbmtuYW1lLCAnJywge1xuICAgICAgICAgICAgICAgICAgICBcImNoYW5uZWxcIjogcy5jaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICBcInByb3AyOFwiOiBsaW5rbmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgICQuZm4udHJhY2tTaGFyZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcztcbiAgICAgICAgZWxlbWVudC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGxpbmsgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBsaW5rLmF0dHIoXCJkYXRhLXNoYXJlLXR5cGVcIik7XG4gICAgICAgICAgICBpZiAoISF3aW5kb3cucyAmJiB0eXBlb2Ygcy5zZW5kRGF0YVRvT21uaXR1cmUgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlKSB7XG4gICAgICAgICAgICAgICAgcy5zZW5kRGF0YVRvT21uaXR1cmUoJ3NoYXJlLicgKyB0eXBlLCAnZXZlbnQ2JywgeyBlVmFyMjc6IHR5cGUgfSk7IFxuICAgICAgICAgICAgfSAgXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgJC5mbi5tYWtlRHJvcGRvd24gPSBmdW5jdGlvbiAobWVudUVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGNsaWNrRWxlbWVudCA9IHRoaXM7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBvcHRpb25zLmRpc2FibGVkID0gZmFsc2U7XG5cbiAgICAgICAgLy9kZWZhdWx0IGJlaGF2aW9yIGZvciBkcm9wZG93blxuICAgICAgICB2YXIgZG93biA9IG9wdGlvbnMuZG93biB8fCBmdW5jdGlvbiAoX2NsaWNrRWxlbWVudCwgX21lbnVFbGVtZW50KSB7XG4gICAgICAgICAgICBuYXYuY2xvc2VEcm9wZG93bnMoKTtcbiAgICAgICAgICAgIF9jbGlja0VsZW1lbnQuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICAkKFwiLmxlYWRlcmJvYXJkXCIpLmFkZENsYXNzKFwiaGlkZUFkXCIpO1xuICAgICAgICAgICAgdmFyIHdpbmRvd0hlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKSAtIDUwO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmNzcyhcImhlaWdodFwiLFwiXCIpO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmNzcyhcImhlaWdodFwiLCAod2luZG93SGVpZ2h0IDw9IF9tZW51RWxlbWVudC5oZWlnaHQoKSkgPyB3aW5kb3dIZWlnaHQgOiBcImF1dG9cIik7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuY3NzKFwid2lkdGhcIiwgX2NsaWNrRWxlbWVudC5vdXRlcldpZHRoKCkgKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5jc3MoXCJsZWZ0XCIsIF9jbGlja0VsZW1lbnQub2Zmc2V0KCkubGVmdCApO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LnNsaWRlRG93bignZmFzdCcpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB1cCA9IG9wdGlvbnMudXAgfHwgZnVuY3Rpb24gKF9jbGlja0VsZW1lbnQsIF9tZW51RWxlbWVudCkge1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LnNsaWRlVXAoJ2Zhc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX2NsaWNrRWxlbWVudC5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICAgICAkKFwiLmxlYWRlcmJvYXJkXCIpLnJlbW92ZUNsYXNzKFwiaGlkZUFkXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgY2xpY2tFbGVtZW50LmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYoICFvcHRpb25zLmRpc2FibGVkICl7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgLy9ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIC8vQW5kIEkgdXNlZCB0byB0aGluayBpZTkgd2FzIGEgZ29vZCBicm93c2VyLi4uXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQgPyBldmVudC5wcmV2ZW50RGVmYXVsdCgpIDogZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGlmIChtZW51RWxlbWVudC5maW5kKFwibGlcIikubGVuZ3RoID09IDApIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGlmKGNsaWNrRWxlbWVudC5pcyhcIi5hY3RpdmVcIikpe1xuICAgICAgICAgICAgICAgICAgICB1cChjbGlja0VsZW1lbnQsIG1lbnVFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkb3duKGNsaWNrRWxlbWVudCwgbWVudUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZighX19pc0lFKXtcbiAgICAgICAgICAgIHZhciBoYW1tZXJ0aW1lID0gbmV3IEhhbW1lcihjbGlja0VsZW1lbnRbMF0sIHsgcHJldmVudF9tb3VzZWV2ZW50czogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGhhbW1lcnRpbWUub24oXCJ0YXBcIixoYW5kbGVUYXApO1xufVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy9tb3ZlIGhlYWRlciBmZWF0dXJlIG91dHNpZGUgb2YgcGItY29udGFpbmVyLCBzbyB0aGF0IHRoZSBtZW51IHNsaWRpbmcgYW5pbWF0aW9uIGNhbiB3b3JrXG4gICAgLy8gaWYoICQoXCIjcGItcm9vdCAucGItZi1wYWdlLWhlYWRlci12MlwiKS5sZW5ndGggJiYgKCQoXCIjcGItcm9vdCAucGItZi1wYWdlLWhlYWRlci12MlwiKS5zaWJsaW5ncyhcIi5wYi1mZWF0dXJlXCIpLmxlbmd0aCB8fCAkKFwiI3BiLXJvb3QgLnBiLWYtcGFnZS1oZWFkZXItdjJcIikuc2libGluZ3MoXCIucGItY29udGFpbmVyXCIpLmxlbmd0aCkgKSB7XG4gICAgLy8gICAgIChmdW5jdGlvbiAoKSB7XG4gICAgLy8gICAgICAgICB2YXIgJGhlYWRlciA9ICQoXCIucGItZi1wYWdlLWhlYWRlci12MlwiKTtcbiAgICAvLyAgICAgICAgICQoXCIucGItZi1wYWdlLWhlYWRlci12MiBzY3JpcHRcIikucmVtb3ZlKCk7XG4gICAgLy8gICAgICAgICAkKFwiI3BiLXJvb3RcIikuYmVmb3JlKCAkaGVhZGVyICk7XG4gICAgLy8gICAgIH0oKSk7XG4gICAgLy8gfVxuXG4gICAgLy9sb2FkIHRoZSBhZCBhZnRlciB0aGUgaGVhZGVyIGhhcyBiZWVuIG1vdmVkLCBzbyBpdCBkb2Vzbid0IGxvYWQgdHdpY2UuIG5vIGNhbGxiYWNrIG9uIGFkIHNjcmlwdHMsIHNvIGhhdmUgdG8gc2V0IGFuIGludGVydmFsIHRvIGNoZWNrXG4gICAgLy8gaWYoICQoXCIjbmF2LWFkOnZpc2libGVcIikubGVuZ3RoICl7XG4gICAgLy8gICAgIHZhciBhZEludGVydmFsVGltZW91dCA9IDEwOyAvL29ubHkgdHJ5IHRoaXMgZm9yIGZpdmUgc2Vjb25kcywgb3IgZGVhbCB3aXRoIGl0XG4gICAgLy8gICAgIHZhciBhZEludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgICAvLyAgICAgICAgIGlmKCB0eXBlb2YocGxhY2VBZDIpICE9IFwidW5kZWZpbmVkXCIgKXtcbiAgICAvLyAgICAgICAgICAgICAkKFwiI3dwbmlfYWRpXzg4eDMxXCIpLmFwcGVuZChwbGFjZUFkMihjb21tZXJjaWFsTm9kZSwnODh4MzEnLGZhbHNlLCcnKSk7ICAgIFxuICAgIC8vICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoYWRJbnRlcnZhbClcbiAgICAvLyAgICAgICAgIH0gICAgXG4gICAgLy8gICAgICAgICBpZiAoYWRJbnRlcnZhbFRpbWVvdXQgPT0gMCkgY2xlYXJJbnRlcnZhbChhZEludGVydmFsKTtcbiAgICAvLyAgICAgICAgIGFkSW50ZXJ2YWxUaW1lb3V0LS07XG4gICAgLy8gICAgIH0sIDUwMCk7XG4gICAgLy8gfVxuXG4gICAgLy9hZGQgdHJhY2tpbmdcbiAgICAvLyAkKFwiI3NpdGUtbWVudSBhXCIpLnRyYWNrQ2xpY2soXCJtYWluXCIpO1xuICAgIC8vICQoXCIjc2hhcmUtbWVudSBhXCIpLnRyYWNrU2hhcmUoKTtcblxuICAgIC8vYWN0aXZhdGUgZHJvcGRvd25zXG4gICAgJChcIiN3cC1oZWFkZXIgLm5hdi1idG5bZGF0YS1tZW51XVwiKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJkcm9wZG93bi10cmlnZ2VyXCIpO1xuICAgICAgICAkKHRoaXMpLm1ha2VEcm9wZG93biggJChcIiNcIiArICQodGhpcykuZGF0YShcIm1lbnVcIikgKSApO1xuICAgIH0pO1xuXG4gICAgLy9hY3RpdmF0ZSBzaXRlIG1lbnUgd2l0aCBjdXN0b20gYWN0aW9uc1xuICAgICQoXCIjc2l0ZS1tZW51LWJ0blwiKS5tYWtlRHJvcGRvd24oICQoXCIjc2l0ZS1tZW51XCIpLCB7XG4gICAgICAgIGRvd246IGZ1bmN0aW9uKF9jbGlja0VsZW1lbnQsIF9tZW51RWxlbWVudCl7XG4gICAgICAgICAgICBuYXYuY2xvc2VEcm9wZG93bnMoKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5jc3MoXCJoZWlnaHRcIiwgd2luZG93Lm91dGVySGVpZ2h0IC0gNTApO1xuICAgICAgICAgICAgJChcImJvZHlcIikuYWRkQ2xhc3MoICgkKFwiI3BiLXJvb3QgLnBiLWYtcGFnZS1oZWFkZXItdjJcIikubGVuZ3RoKSA/IFwibGVmdC1tZW51XCIgOiBcImxlZnQtbWVudSBsZWZ0LW1lbnUtcGJcIiApO1xuICAgICAgICAgICAgX2NsaWNrRWxlbWVudC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICQoJy5wYkhlYWRlcicpLnRvZ2dsZUNsYXNzKCdub3QtZml4ZWQnKTtcbiAgICAgICAgfSxcbiAgICAgICAgdXA6IGZ1bmN0aW9uKF9jbGlja0VsZW1lbnQsIF9tZW51RWxlbWVudCl7XG4gICAgICAgICAgICAkKFwiYm9keVwiKS5yZW1vdmVDbGFzcyhcImxlZnQtbWVudVwiKS5yZW1vdmVDbGFzcyhcImxlZnQtbWVudS1wYlwiKTtcbiAgICAgICAgICAgIF9jbGlja0VsZW1lbnQucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICAkKCcucGJIZWFkZXInKS50b2dnbGVDbGFzcygnbm90LWZpeGVkJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBoYW1tZXJ0aW1lID0gbmV3IEhhbW1lciggZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaXRlLW1lbnVcIiksIHtcbiAgICAgICAgZHJhZ0xvY2tUb0F4aXM6IHRydWUsXG4gICAgICAgIGRyYWdCbG9ja0hvcml6b250YWw6IHRydWVcbiAgICB9KTtcblxuICAgIGhhbW1lcnRpbWUub24oIFwiZHJhZ2xlZnQgc3dpcGVsZWZ0XCIsIGZ1bmN0aW9uKGV2KXsgXG4gICAgICAgIGV2Lmdlc3R1cmUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy9ldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0ID8gZXYuZ2VzdHVyZS5wcmV2ZW50RGVmYXVsdCgpIDogZXYuZ2VzdHVyZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICBldi5nZXN0dXJlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBpZiggZXYuZ2VzdHVyZS5kaXJlY3Rpb24gPT0gXCJsZWZ0XCIgJiYgJChcImJvZHlcIikuaXMoXCIubGVmdC1tZW51XCIpICl7XG4gICAgICAgICAgICAkKFwiI3NpdGUtbWVudS1idG5cIikuY2xpY2soKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyogc2VhcmNoLXNwZWNpZmljIG1hbmlwdWxhdGlvbiAqL1xuICAgICQoXCIuaW9zICNuYXYtc2VhcmNoLW1vYmlsZSBpbnB1dFwiKS5mb2N1cyhmdW5jdGlvbigpe1xuICAgICAgICAkKFwiaGVhZGVyXCIpLmNzcyhcInBvc2l0aW9uXCIsXCJhYnNvbHV0ZVwiKS5jc3MoXCJ0b3BcIix3aW5kb3cucGFnZVlPZmZzZXQpO1xuICAgIH0pLmJsdXIoZnVuY3Rpb24oKXtcbiAgICAgICAgJChcImhlYWRlclwiKS5jc3MoXCJwb3NpdGlvblwiLFwiZml4ZWRcIikuY3NzKFwidG9wXCIsMCk7XG4gICAgfSk7XG5cbiAgICAvL3RyaWdnZXIgd2luZG93IHJlc2l6ZSB3aGVuIG1vYmlsZSBrZXlib2FyZCBoaWRlc1xuICAgICQoXCIjbmF2LXNlYXJjaC1tb2JpbGUgaW5wdXRcIikuYmx1cihmdW5jdGlvbigpe1xuICAgICAgICAkKCB3aW5kb3cgKS5yZXNpemUoKTtcbiAgICB9KTtcblxuICAgICQoZG9jdW1lbnQpLmtleXVwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gSWYgeW91IHByZXNzIEVTQyB3aGlsZSBpbiB0aGUgc2VhcmNoIGlucHV0LCB5b3Ugc2hvdWxkIHJlbW92ZSBmb2N1cyBmcm9tIHRoZSBpbnB1dFxuICAgICAgICBpZiAoZS5rZXlDb2RlID09IDI3ICYmICQoXCIjbmF2LXNlYXJjaCBpbnB1dFt0eXBlPXRleHRdXCIpLmlzKFwiOmZvY3VzXCIpKSB7XG4gICAgICAgICAgICAkKFwiI25hdi1zZWFyY2ggaW5wdXRbdHlwZT10ZXh0XVwiKS5ibHVyKCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICQoXCIjbmF2LXNlYXJjaCwjbmF2LXNlYXJjaC1tb2JpbGVcIikuc3VibWl0KGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoJCh0aGlzKS5maW5kKCdpbnB1dFt0eXBlPXRleHRdJykudmFsKCkpIHtcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICBzLnNlbmREYXRhVG9PbW5pdHVyZSgnU2VhcmNoIFN1Ym1pdCcsJ2V2ZW50MicseydlVmFyMzgnOiQodGhpcykuZmluZCgnaW5wdXRbdHlwZT10ZXh0XScpLnZhbCgpLCdlVmFyMSc6cy5wYWdlTmFtZX0pO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qXG4gICAgICogQ0xJRU5UIFNJREUgQVBJIGZvciBDVVNUT01JWklORyB0aGUgSEVBREVSXG4gICAgICovXG5cbiAgICAvLyBUaGVyZSBzaG91bGQgb25seSBiZSBvbmUgbmF2aWdhdGlvbiBwZXIgcGFnZS4gU28gb3VyIG5hdmlnYXRpb24gb2JqZWN0IGlzIGEgc2luZ2xldG9uLlxuICAgIC8vIEhlYXZ5IGRlcGVuZGVuY3kgb24galF1ZXJ5XG4gICAgdmFyIGNvcmUgPSB3aW5kb3cud3BfcGIgPSB3aW5kb3cud3BfcGIgfHwge307XG4gICAgdmFyIG5hdiA9IGNvcmUubmF2ID0gY29yZS5uYXYgfHwge307XG4gICAgdmFyIGRlcHJlY2F0ZWQgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIG5hdi5zZXRTZWFyY2ggPSBuYXYuc2hvd1RvcE1lbnUgPSBuYXYuaGlkZVRvcE1lbnUgPSBuYXYuc2hvd1ByaW1hcnlMaW5rcyA9XG4gICAgbmF2LmhpZGVQcmltYXJ5TGlua3MgPSBuYXYuc2hvd0luVGhlTmV3cyA9IG5hdi5oaWRlSW5UaGVOZXdzID0gbmF2LnNob3dBZFNsdWcgPVxuICAgIG5hdi5oaWRlQWRTbHVnID0gbmF2LnNob3dTZWN0aW9uTmFtZSA9IG5hdi5oaWRlU2VjdGlvbk5hbWUgPVxuICAgIG5hdi5zZXRNYWluTWVudSA9IG5hdi5zZXRTZWN0aW9uTWVudSA9IG5hdi5zZXRTZWN0aW9uTmFtZSA9IGRlcHJlY2F0ZWQ7XG5cbiAgICBuYXYuc2hvd0lkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBuYXYucmVuZGVySWRlbnRpdHkoKTtcbiAgICAgICAgc2hvd0lkZW50aXR5ID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgbmF2LmhpZGVJZGVudGl0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChcIiNuYXYtdXNlclwiKS5oaWRlKCk7XG4gICAgICAgICQoXCJuYXYtc2lnbi1pblwiKS5oaWRlKCk7XG4gICAgICAgIHNob3dJZGVudGl0eSA9IGZhbHNlO1xuICAgIH07XG5cbiAgICBuYXYuc2hvd1NlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChcIiNuYXYtc2VhcmNoXCIpLnNob3coKTtcbiAgICB9O1xuXG4gICAgbmF2LmhpZGVTZWFyY2ggPSBmdW5jdGlvbiAoKSB7IFxuICAgICAgICAkKFwiI25hdi1zZWFyY2hcIikuaGlkZSgpOyBcbiAgICB9O1xuXG4gICAgbmF2LnNob3dTdWJzY3JpcHRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoXCIjbmF2LXN1YnNjcmlwdGlvblwiKS5zaG93KCk7XG4gICAgfTtcblxuICAgIG5hdi5oaWRlU3Vic2NyaXB0aW9uID0gZnVuY3Rpb24gKCkgeyBcbiAgICAgICAgJChcIiNuYXYtc3Vic2NyaXB0aW9uXCIpLmhpZGUoKTsgXG4gICAgfTtcbiAgICBcbiAgICB2YXIgc2V0TWVudSA9IGZ1bmN0aW9uIChlbGVtLCBtZW51KSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gJChlbGVtKTtcbiAgICAgICAgZWxlbWVudC5jaGlsZHJlbignbGknKS5yZW1vdmUoKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRMaW5rSXRlbXMobWVudSk7XG4gICAgfTtcblxuICAgIG5hdi5zZXRJZGVudGl0eU1lbnUgPSBmdW5jdGlvbiAobWVudSkge1xuICAgICAgICBzZXRNZW51KFwiI3VzZXItbWVudSB1bFwiLCBtZW51KTtcbiAgICB9O1xuXG4gICAgbmF2LnNldFBhZ2VUaXRsZSA9IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgICAkKCcjbmF2LXBhZ2UtdGl0bGUnKS50ZXh0KG5hbWUpO1xuICAgICAgICAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgndGl0bGUnLCBuYW1lKTtcbiAgICB9O1xuXG4gICAgbmF2LnNldFNoYXJlVXJsID0gZnVuY3Rpb24odXJsKXtcbiAgICAgICAgJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3Blcm1hbGluaycsdXJsKTtcbiAgICB9O1xuXG4gICAgbmF2LnNldFR3aXR0ZXJIYW5kbGUgPSBmdW5jdGlvbihoYW5kbGUpe1xuICAgICAgICBpZigkKCcjc2hhcmUtbWVudSBhW2RhdGEtc2hhcmUtdHlwZT1cIlR3aXR0ZXJcIl0nKS5sZW5ndGgpe1xuICAgICAgICAgICAgJCgnI3NoYXJlLW1lbnUgYVtkYXRhLXNoYXJlLXR5cGU9XCJUd2l0dGVyXCJdJykuZGF0YSgndHdpdHRlci1oYW5kbGUnLCBoYW5kbGUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG5hdi5jbG9zZURyb3Bkb3ducyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCIjd3AtaGVhZGVyIC5kcm9wZG93bi10cmlnZ2VyLmFjdGl2ZVwiKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgJChcIiNcIiskKHRoaXMpLmRhdGEoXCJtZW51XCIpKS5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKFwiLmxlYWRlcmJvYXJkXCIpLnJlbW92ZUNsYXNzKFwiaGlkZUFkXCIpO1xuICAgIH1cblxuXG4gICAgdmFyIHNjcm9sbEV2ZW50cyA9IHt9LFxuICAgICAgICBzY3JvbGxQb3MgPSAkKHRoaXMpLnNjcm9sbFRvcCgpO1xuXG4gICAgdmFyIGZvcmNlT3BlbiA9ICQoXCIjd3AtaGVhZGVyXCIpLmlzKFwiLnN0YXktb3BlblwiKTtcblxuICAgICQod2luZG93KS5zY3JvbGwoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8qIHNob3cgYW5kIGhpZGUgbmF2IG9uIHNjcm9sbCAqL1xuICAgICAgICB2YXIgY3VycmVudFBvcyA9ICQodGhpcykuc2Nyb2xsVG9wKCk7XG4gICAgICAgIGlmICghZm9yY2VPcGVuKSB7ICAgXG5cbiAgICAgICAgICAgIGlmKCAoY3VycmVudFBvcyArIDIwKSA8IHNjcm9sbFBvcyB8fCBjdXJyZW50UG9zID09PSAwICl7XG4gICAgICAgICAgICAgICAgbmF2LnNob3dOYXYoKTtcbiAgICAgICAgICAgICAgICBzY3JvbGxQb3MgPSBjdXJyZW50UG9zO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggKGN1cnJlbnRQb3MgLSAyMCkgPiBzY3JvbGxQb3MgJiYgY3VycmVudFBvcyA+IDUwICl7XG4gICAgICAgICAgICAgICAgbmF2LmhpZGVOYXYoKTtcbiAgICAgICAgICAgICAgICBzY3JvbGxQb3MgPSBjdXJyZW50UG9zO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyogbGlzdGVuIGZvciBzaG93L2hpZGUgdGl0bGUgKi9cblxuICAgICAgICBpZiAoc2Nyb2xsRXZlbnRzLmxlbmd0aCA9PSAwKSByZXR1cm47XG5cbiAgICAgICAgZm9yICh2YXIgaSBpbiBzY3JvbGxFdmVudHMpIHtcbiAgICAgICAgICAgIGlmIChzY3JvbGxFdmVudHMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIGN1cnJlbnRQb3MgPj0gc2Nyb2xsRXZlbnRzW2ldLnRhcmdldFBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbEV2ZW50c1tpXS5kb3duLmNhbGwoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRQb3MgPCBzY3JvbGxFdmVudHNbaV0udGFyZ2V0UG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRXZlbnRzW2ldLnVwLmNhbGwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbigpIHtcbiAgICAgICAgLy9yZW1vdmUgc3RhbmRhcmQgZHJvcGRvd25zXG4gICAgICAgIG5hdi5jbG9zZURyb3Bkb3ducygpO1xuICAgICAgICAvL3Jlc2l6ZSBzaXRlIG1lbnUsIGlmIG9wZW5cbiAgICAgICAgaWYoJChcImJvZHlcIikuaXMoXCIubGVmdC1tZW51XCIpKXtcbiAgICAgICAgICAgICQoXCIjc2l0ZS1tZW51XCIpLmNzcyhcImhlaWdodFwiLCAkKHdpbmRvdykuaGVpZ2h0KCkgLSA1MCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG5hdi5zaG93TmF2ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYoICQoXCIjd3AtaGVhZGVyXCIpLmlzKFwiLmJhci1oaWRkZW5cIikgKXtcbiAgICAgICAgICAgICQoXCIjd3AtaGVhZGVyXCIpLnJlbW92ZUNsYXNzKFwiYmFyLWhpZGRlblwiKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBuYXYuaGlkZU5hdiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmKCAhJChcIiN3cC1oZWFkZXJcIikuaXMoXCIuYmFyLWhpZGRlblwiKSAmJiAhJChcIiN3cC1oZWFkZXIgLm5hdi1idG4uYWN0aXZlXCIpLmxlbmd0aCApe1xuICAgICAgICAgICAgJChcIiN3cC1oZWFkZXJcIikuYWRkQ2xhc3MoXCJiYXItaGlkZGVuXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG5hdi5zaG93VGl0bGVPblNjcm9sbCA9IGZ1bmN0aW9uKCR0YXJnZXQpe1xuICAgICAgICB2YXIgZWxlbWVudCA9ICR0YXJnZXQ7XG4gICAgICAgIHNjcm9sbEV2ZW50c1tcInRpdGxlU2Nyb2xsXCJdID0ge1xuICAgICAgICAgICAgdGFyZ2V0UG9zaXRpb246IGVsZW1lbnQub2Zmc2V0KCkudG9wICsgNTAsXG4gICAgICAgICAgICBkb3duOiBmdW5jdGlvbiAoKSB7IFxuICAgICAgICAgICAgICAgIGlmKCAhJCgnI3dwLWhlYWRlcicpLmlzKFwiLnRpdGxlLW1vZGVcIikgKXtcbiAgICAgICAgICAgICAgICAgICAgJCgnI3dwLWhlYWRlcicpLmFkZENsYXNzKCd0aXRsZS1tb2RlJyk7XG4gICAgICAgICAgICAgICAgICAgICQoXCIjd3AtaGVhZGVyIC5uYXYtbWlkZGxlXCIpLmNzcyggXCJwYWRkaW5nLXJpZ2h0XCIsICAkKFwiI3dwLWhlYWRlciAubmF2LXJpZ2h0XCIpLm91dGVyV2lkdGgoKSApO1xuICAgICAgICAgICAgICAgICAgICBuYXYuY2xvc2VEcm9wZG93bnMoKTtcbiAgICAgICAgICAgICAgICB9ICAgXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXA6IGZ1bmN0aW9uICgpIHsgXG4gICAgICAgICAgICAgICAgaWYoICQoJyN3cC1oZWFkZXInKS5pcyhcIi50aXRsZS1tb2RlXCIpICl7XG4gICAgICAgICAgICAgICAgICAgICQoJyN3cC1oZWFkZXInKS5yZW1vdmVDbGFzcygndGl0bGUtbW9kZScpOyBcbiAgICAgICAgICAgICAgICAgICAgbmF2LmNsb3NlRHJvcGRvd25zKCk7XG4gICAgICAgICAgICAgICAgfSAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBpZiAoICQoJyNuYXYtcGFnZS10aXRsZVtkYXRhLXNob3ctb24tc2Nyb2xsPVwidHJ1ZVwiXScpLmxlbmd0aCApe1xuICAgICAgICB2YXIgJHRhcmdldCA9ICggJChcIi5uYXYtc2Nyb2xsLXRhcmdldFwiKS5sZW5ndGggKSA/ICQoXCIubmF2LXNjcm9sbC10YXJnZXRcIikgOiAkKFwiaDEsIGgyXCIpO1xuICAgICAgICBpZiggJHRhcmdldC5sZW5ndGggKSBuYXYuc2hvd1RpdGxlT25TY3JvbGwoICR0YXJnZXQuZmlyc3QoKSApO1xuICAgIH1cbiAgICAgICAgXG4gICAgbmF2LnJlbmRlclNoYXJlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJHNoYXJlID0gJChcIiNzaGFyZS1tZW51XCIpO1xuICAgICAgICAkZmFjZWJvb2sgPSAkKCdhW2RhdGEtc2hhcmUtdHlwZT1cIkZhY2Vib29rXCJdJywgJHNoYXJlKTtcbiAgICAgICAgJHR3aXR0ZXIgPSAkKCdhW2RhdGEtc2hhcmUtdHlwZT1cIlR3aXR0ZXJcIl0nLCAkc2hhcmUpO1xuICAgICAgICAkbGlua2VkaW4gPSAkKCdhW2RhdGEtc2hhcmUtdHlwZT1cIkxpbmtlZEluXCJdJywgJHNoYXJlKTtcbiAgICAgICAgJGVtYWlsID0gJCgnYVtkYXRhLXNoYXJlLXR5cGU9XCJFbWFpbFwiXScsICRzaGFyZSk7XG4gICAgICAgICRwaW50ZXJlc3QgPSAkKCdhW2RhdGEtc2hhcmUtdHlwZT1cIlBpbnRlcmVzdFwiXScsICRzaGFyZSk7XG5cbiAgICAgICAgaWYgKCRmYWNlYm9vay5sZW5ndGgpe1xuICAgICAgICAgICAgJGZhY2Vib29rLmNsaWNrKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9zaGFyZXIvc2hhcmVyLnBocD91PScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCdwZXJtYWxpbmsnKSApLCcnLCd3aWR0aD02NTgsaGVpZ2h0PTM1NCxzY3JvbGxiYXJzPW5vJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJHR3aXR0ZXIubGVuZ3RoKXtcbiAgICAgICAgICAgICR0d2l0dGVyLmNsaWNrKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICB2YXIgdHdpdHRlckhhbmRsZSA9ICgkKHRoaXMpLmRhdGEoXCJ0d2l0dGVyLWhhbmRsZVwiKSkgPyAgJCh0aGlzKS5kYXRhKFwidHdpdHRlci1oYW5kbGVcIikucmVwbGFjZShcIkBcIixcIlwiKSA6IFwid2FzaGluZ3RvbnBvc3RcIjtcbiAgICAgICAgICAgICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT91cmw9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3Blcm1hbGluaycpICkgKyAnJnRleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3RpdGxlJykgKSArICcmdmlhPScgKyB0d2l0dGVySGFuZGxlICwnJywnd2lkdGg9NTUwLCBoZWlnaHQ9MzUwLCBzY3JvbGxiYXJzPW5vJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJGxpbmtlZGluLmxlbmd0aCl7XG4gICAgICAgICAgICAkbGlua2VkaW4uY2xpY2soZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlP21pbmk9dHJ1ZSZ1cmw9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3Blcm1hbGluaycpICkgKyAnJnRpdGxlPScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCd0aXRsZScpICksJycsJ3dpZHRoPTgzMCxoZWlnaHQ9NDYwLHNjcm9sbGJhcnM9bm8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkZW1haWwubGVuZ3RoKXtcbiAgICAgICAgICAgICRlbWFpbC5jbGljayhmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgd2luZG93Lm9wZW4oJ21haWx0bzo/c3ViamVjdD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgndGl0bGUnKSApICsgJyBmcm9tIFRoZSBXYXNoaW5ndG9uIFBvc3QmYm9keT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgncGVybWFsaW5rJykgKSwnJywnJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZigkcGludGVyZXN0Lmxlbmd0aCl7XG4gICAgICAgICAgICAkcGludGVyZXN0LmNsaWNrKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgICAgIGUuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG4gICAgICAgICAgICAgICAgZS5zZXRBdHRyaWJ1dGUoJ2NoYXJzZXQnLCdVVEYtOCcpO1xuICAgICAgICAgICAgICAgIGUuc2V0QXR0cmlidXRlKCdzcmMnLCdodHRwczovL2Fzc2V0cy5waW50ZXJlc3QuY29tL2pzL3Bpbm1hcmtsZXQuanM/cj0nICsgTWF0aC5yYW5kb20oKSo5OTk5OTk5OSk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgaWYoICQoXCIjc2hhcmUtbWVudVwiKS5sZW5ndGggKXtcbiAgICAgICAgbmF2LnJlbmRlclNoYXJlKCk7XG4gICAgfVxuXG4gICAgdmFyIGlkcDsgLy9wcml2YXRlIHZhcmlhYmxlLiBUaGVyZSBjYW4gYmUgb25seSBvbmUgcHJvdmlkZXIuIFNvIHRoaXMgaXMgYSBzaW5nbGV0b24uXG4gICAgbmF2LmdldElkZW50aXR5UHJvdmlkZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBpZHA7XG4gICAgfTtcbiAgICBuYXYuc2V0SWRlbnRpdHlQcm92aWRlciA9IGZ1bmN0aW9uIChwcm92aWRlcikge1xuICAgICAgICB2YXIgZWYgPSBmdW5jdGlvbiAoKSB7fTsgLy9lbXB0eSBmdW5jdGlvblxuICAgICAgICBpZHAgPSB7fTtcbiAgICAgICAgLy8gd2UnbGwgcGFkIGFueSBtaXNzaW5nIHBvcnRpb24gd2l0aCBlbXB0eSBmdW5jdGlvblxuICAgICAgICBpZHAubmFtZSA9IHByb3ZpZGVyLm5hbWUgfHwgXCJcIjtcbiAgICAgICAgaWRwLmdldFVzZXJJZCA9IHByb3ZpZGVyLmdldFVzZXJJZCB8fCBlZjtcbiAgICAgICAgaWRwLmdldFVzZXJNZW51ID0gcHJvdmlkZXIuZ2V0VXNlck1lbnUgfHwgZWY7XG4gICAgICAgIGlkcC5nZXRTaWduSW5MaW5rID0gcHJvdmlkZXIuZ2V0U2lnbkluTGluayB8fCBlZjtcbiAgICAgICAgaWRwLmdldFJlZ2lzdHJhdGlvbkxpbmsgPSBwcm92aWRlci5nZXRSZWdpc3RyYXRpb25MaW5rIHx8IGVmO1xuICAgICAgICBpZHAuaXNVc2VyTG9nZ2VkSW4gPSBwcm92aWRlci5pc1VzZXJMb2dnZWRJbiB8fCBlZjtcbiAgICAgICAgaWRwLmlzVXNlclN1YnNjcmliZXIgPSBwcm92aWRlci5pc1VzZXJTdWJzY3JpYmVyIHx8IGVmO1xuICAgICAgICBcbiAgICAgICAgaWRwLnJlbmRlciA9IHByb3ZpZGVyLnJlbmRlciB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoaWRwLmlzVXNlckxvZ2dlZEluKCkpIHtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi11c2VyIC51c2VybmFtZVwiKS50ZXh0KGlkcC5nZXRVc2VySWQoKSk7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtdXNlci1tb2JpbGUgYVwiKS50ZXh0KGlkcC5nZXRVc2VySWQoKSk7XG4gICAgICAgICAgICAgICAgbmF2LnNldElkZW50aXR5TWVudShpZHAuZ2V0VXNlck1lbnUoKSk7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtdXNlclwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi11c2VyLW1vYmlsZVwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi11c2VyLW1vYmlsZSBhXCIpLmF0dHIoXCJocmVmXCIsaWRwLmdldFVzZXJNZW51KClbMF1bXCJocmVmXCJdKTtcbiAgICAgICAgICAgICAgICBpZiggaWRwLmlzVXNlclN1YnNjcmliZXIoKSA9PT0gXCIwXCIgKXtcbiAgICAgICAgICAgICAgICAgICAgJChcIiNuYXYtc3Vic2NyaWJlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICAgICAkKFwiI25hdi1zdWJzY3JpYmUtbW9iaWxlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtc2lnbi1pblwiKS5hdHRyKFwiaHJlZlwiLCBpZHAuZ2V0U2lnbkluTGluaygpK1wiJm5pZD10b3BfcGJfc2lnbmluXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXNpZ24taW4tbW9iaWxlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpLmZpbmQoXCJhXCIpLmF0dHIoXCJocmVmXCIsIGlkcC5nZXRTaWduSW5MaW5rKCkrXCImbmlkPXRvcF9wYl9zaWduaW5cIik7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtc3Vic2NyaWJlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXN1YnNjcmliZS1tb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy9sZXQncyByZW5kZXJcbiAgICAgICAgbmF2LnJlbmRlcklkZW50aXR5KCk7XG4gICAgfTtcbiAgICBuYXYucmVuZGVySWRlbnRpdHkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgaWYgKGlkcCkgeyAvLyB0aGUgdXNlciBtaWdodCBub3QgaGF2ZSBjb25maWd1cmVkIGFueSBpZGVudGl0eS4gU28gY2hlY2sgZm9yIGl0LlxuICAgICAgICAgICAgaWRwLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKGlkcCk7XG4gICAgfTtcblxuICAgIC8qXG4gICAgICogVXNpbmcgdGhlIHByaXZkZWQgQVBJLCBzZXQgdXAgdGhlIGRlZmF1bHQgaWRlbnRpdHkgcHJvdmlkZXIgYXMgVFdQXG4gICAgICovXG5cbiAgICAvLyBpZiB0aGUgaWRlbnRpdHkgY29tcG9uZW50IHdlcmUgc2V0IGFzIGhpZGRlbiBmcm9tIFBhZ2VCdWlsZGVyIGFkbWluXG4gICAgLy8gc2V0IGEgZmxhZyBzbyB0aGF0IHdlIGRvbid0IHByb2Nlc3MgbG9naW4gYXQgYWxsXG4gICAgdmFyIHNob3dJZGVudGl0eSA9ICQoXCIjbmF2LXVzZXJcIikuZGF0YShcInNob3ctaWRlbnRpdHlcIik7XG5cbiAgICAvLyBkZWZhdWx0IElkZW50aXR5XG4gICAgdmFyIGN1cnJlbnQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIj9cIilbMF07XG4gICAgdmFyIHR3cElkZW50aXR5ID0ge1xuICAgICAgICBuYW1lOiBcIlRXUFwiLFxuICAgICAgICBnZXRVc2VySWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB1c2VybmFtZSA9IFRXUC5VdGlsLlVzZXIuZ2V0VXNlck5hbWUoKTtcbiAgICAgICAgICAgIHZhciB1c2VyaWQgPSBUV1AuVXRpbC5Vc2VyLmdldFVzZXJJZCgpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB1c2VybmFtZSA9PSBcInN0cmluZ1wiICYmIHVzZXJuYW1lLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlcm5hbWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1c2VyaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGdldFVzZXJNZW51OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHsgXCJ0aXRsZVwiOiBcIlByb2ZpbGVcIiwgXCJocmVmXCI6IFRXUC5zaWduaW4ucHJvZmlsZXVybCArIGN1cnJlbnQgKyAnJnJlZnJlc2g9dHJ1ZScgfSxcbiAgICAgICAgICAgICAgICB7IFwidGl0bGVcIjogXCJMb2cgb3V0XCIsIFwiaHJlZlwiOiBUV1Auc2lnbmluLmxvZ291dHVybF9wYWdlIH1cbiAgICAgICAgICAgIF07XG4gICAgICAgIH0sXG4gICAgICAgIGdldFNpZ25Jbkxpbms6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBUV1Auc2lnbmluLmxvZ2ludXJsX3BhZ2UgKyBjdXJyZW50O1xuICAgICAgICB9LFxuICAgICAgICBnZXRSZWdpc3RyYXRpb25MaW5rOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gVFdQLnNpZ25pbi5yZWdpc3RyYXRpb251cmxfcGFnZSArIGN1cnJlbnQ7XG4gICAgICAgIH0sXG4gICAgICAgIGlzVXNlclN1YnNjcmliZXI6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgc3ViID0gKGRvY3VtZW50LmNvb2tpZS5tYXRjaCgvcnBsc2I9KFswLTldKykvKSkgPyBSZWdFeHAuJDEgOiAnJzsgXG4gICAgICAgICAgICByZXR1cm4gc3ViO1xuICAgICAgICB9LFxuICAgICAgICBpc1VzZXJMb2dnZWRJbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChUV1AuVXRpbC5Vc2VyKSA/IFRXUC5VdGlsLlVzZXIuZ2V0QXV0aGVudGljYXRpb24oKSA6IGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIElmIHdlIGFyZSBzaG93aW5nIGlkZW50aXR5IHRoZW4gc2V0IHRoZSBkZWZhdWx0IGlkZW50aXR5IHByb3ZpZGVyIHRvIFRXUC5cbiAgICAvLyAgIFVzZXIgY2FuIG92ZXJpZGUgdGhpcyB3aGVuZXZlciB0aGV5IHdhbnQuXG4gICAgLy9cbiAgICAvLyBJbiBUV1AsIGlkZW50aXR5IHVzZXIgaW50ZXJmYWNlIG5lZWRzIHRvIHByb2Nlc3NlZCBhZnRlciB0aGUgZmFjdCB0aGF0IGFsbCBvdGhlciBqYXZhc2NyaXB0IGhhcyBiZWVuIGxvYWRlZC5cbiAgICAvLyAgIEJ1dCB0aGUganMgcmVzb3VyY2VzIGFyZSBsb2FkZWQgYXN5bmNocm9ub3VzbHkgYW5kIGl0IGRvZXNuJ3QgaGF2ZSBhbnkgY2FsbGJhY2tzIGhvb2tzLiBTbyB3ZSB3YXRjaCBmb3IgaXQuXG4gICAgaWYgKHNob3dJZGVudGl0eSkge1xuICAgICAgICAvL3RyeSB0byBsb2FkIFRXUCBvbmx5IGlmIHdlIGFyZSBzaG93aW5nIElkZW50aXR5LlxuICAgICAgICB2YXIgaW5pdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAoZnVuY3Rpb24gY2hlY2tUV1AoKSB7XG4gICAgICAgICAgICAvLyBpZiB0aGVyZSdzIGFscmVhZHkgaWRwIHNldCwgdGhlbiBkb24ndCB0cnkgdG8gbG9hZCBUV1AuXG4gICAgICAgICAgICBpZiAoIW5hdi5nZXRJZGVudGl0eVByb3ZpZGVyKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoVFdQICYmIFRXUC5zaWduaW4gJiYgVFdQLlV0aWwpIHsgLy8gbWFrZSBzdXJlIFRXUCBoYXMgYmVlbiBsb2FkZWQuXG4gICAgICAgICAgICAgICAgICAgIG5hdi5zZXRJZGVudGl0eVByb3ZpZGVyKHR3cElkZW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgbmF2LnJlbmRlcklkZW50aXR5KCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICAvLyBhZnRlciAzIHNlY29uZHMsIGlmIFRXUCBpbmRlbnRpdHkgaGFzbid0IGJlZW4gbG9hZGVkLiBMZXQncyBqdXN0IHN0b3AuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgLSBpbml0IDwgMyAqIDEwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIGl0IGhhc24ndCBiZWVuIGxvYWRlZCwgd2Ugd2FpdCBmZXcgbWlsbGlzZWNvbmRzIGFuZCB0cnkgYWdhaW4uXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IGNoZWNrVFdQKCk7IH0sIDIwMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0oKSk7XG4gICAgfVxuXG4gICAgLyogaGFtbWVyLmpzIHRhcCAqL1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlVGFwKGV2KSB7XG4gICAgICAgIGV2Lmdlc3R1cmUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy9ldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0ID8gZXYuZ2VzdHVyZS5wcmV2ZW50RGVmYXVsdCgpIDogZXYuZ2VzdHVyZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICBldi5nZXN0dXJlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAkKGV2Lmdlc3R1cmUudGFyZ2V0KS5jbGljaygpO1xuICAgIH1cblxuICAgIC8qIGEvYiB0ZXN0IGFuZCB0YXJnZXQgKi9cbiAgICAvLyAkKHdpbmRvdy5kb2N1bWVudCkub24oJ2FidGVzdC1yZWFkeScsIGZ1bmN0aW9uKGUsIEFCVCkge1xuXG4gICAgLy8gICAgIGlmICggIXN1cHBvcnRlZENsaWVudCgpICkge1xuICAgIC8vICAgICAgICAgcmV0dXJuO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgYXBwbHlWYXJpYW50RXhwZXJpZW5jZSgnbWFzdEhlYWQyJywgJ2xvZ29MYXJnZScpO1xuXG4gICAgLy8gICAgIGZ1bmN0aW9uIGFwcGx5VmFyaWFudEV4cGVyaWVuY2UoZmVhdHVyZU5hbWUsIHZhcmlhbnROYW1lKSB7XG4gICAgLy8gICAgICAgICB2YXIgZnRyID0gQUJULmdldChmZWF0dXJlTmFtZSk7XG4gICAgLy8gICAgICAgICB2YXIgdHJrID0gZnRyLmlzKHZhcmlhbnROYW1lKTtcbiAgICAgICAgICAgIFxuICAgIC8vICAgICAgICAgdmFyICR0YXJnZXQgPSAkKCdoZWFkZXIuYWJ0LW5vdC1sb2FkZWQsICN3cC10b3BwZXIsIC5wYi1mLXBhZ2UtaGVhZGVyLXYyLCBib2R5Jyk7XG4gICAgLy8gICAgICAgICAkdGFyZ2V0LnJlbW92ZUNsYXNzKCAnYWJ0LW5vdC1sb2FkZWQnICk7XG4gICAgLy8gICAgICAgICAkdGFyZ2V0LmFkZENsYXNzKCAnYWJ0LScgKyBmZWF0dXJlTmFtZSArICctJyArIHZhcmlhbnROYW1lICsgJy0nICsgdHJrICk7XG5cbiAgICAvLyAgICAgICAgIHZhciBmZCA9IG1vbWVudCgpLmZvcm1hdCgnZGRkZCwgTEwnKTtcblxuICAgIC8vICAgICAgICAgJCgnI3dwLXRvcHBlciAudG9wLXRpbWVzdGFtcCcpLnRleHQoZmQpO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgZnVuY3Rpb24gc3VwcG9ydGVkQ2xpZW50KCkge1xuXG4gICAgLy8gICAgICAgICByZXR1cm4gJCgnaHRtbC5kZXNrdG9wJykubGVuZ3RoID4gMCAmJiAkKCdoZWFkZXIuZGFyaycpLmxlbmd0aCA9PSAwO1xuICAgIC8vICAgICB9XG4gICAgLy8gfSk7XG5cbn0oalF1ZXJ5LCB3aW5kb3cpKTtcblxuIiwiLy9Ub3AgU2hhcmUgQmFyIEpTIC0gc3RvbGVuIHN0cmFpZ2h0IGZyb20gXG4oZnVuY3Rpb24oJCl7XG5cbiAgIHZhciBzb2NpYWxUb29scyA9IHtcbiAgICAgICAgbXlSb290IDogJy50b3Atc2hhcmViYXItd3JhcHBlcicsXG5cbiAgICAgICAgaW5pdDpmdW5jdGlvbiAobXlSb290KSB7XG4gICAgICAgICAgICBteVJvb3QgPSBteVJvb3QgfHwgdGhpcy5teVJvb3Q7XG4gICAgICAgICAgICAkKG15Um9vdCkuZWFjaChmdW5jdGlvbihpbmRleCwgbXlSb290RWxlbWVudCl7XG4gICAgICAgICAgICAgICAgbXlSb290RWxlbWVudC5wb3N0U2hhcmUgPSBuZXcgcG9zdFNoYXJlKCk7XG4gICAgICAgICAgICAgICAgbXlSb290RWxlbWVudC5wb3N0U2hhcmUuaW5pdCgkKG15Um9vdEVsZW1lbnQpLCAkKG15Um9vdEVsZW1lbnQpLmRhdGEoJ3Bvc3RzaGFyZScpKTtcbiAgICAgICAgICAgICAgICB2YXIgJHJvb3QgPSAkKG15Um9vdEVsZW1lbnQpLCBcbiAgICAgICAgICAgICAgICAgICAgJGluZGl2aWR1YWxUb29sID0gJCgnLnRvb2w6bm90KC5tb3JlKScsJHJvb3QpLFxuICAgICAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNXcmFwcGVyID0gJCgnLnNvY2lhbC10b29scy13cmFwcGVyJywkcm9vdCksXG4gICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc01vcmVCdG4gPSAkKCcudG9vbC5tb3JlJywkc29jaWFsVG9vbHNXcmFwcGVyKSxcbiAgICAgICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzQWRkaXRpb25hbCA9ICQoJy5zb2NpYWwtdG9vbHMtYWRkaXRpb25hbCcsJHJvb3QpLFxuICAgICAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNVdGlsaXR5ID0gJCgnLnV0aWxpdHktdG9vbHMtd3JhcHBlcicsJHJvb3QpLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9ICh3aW5kb3cuaW5uZXJXaWR0aCA+IDApID8gd2luZG93LmlubmVyV2lkdGggOiBzY3JlZW4ud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGlzTW9iaWxlID0gKG1vYmlsZV9icm93c2VyID09PSAxICYmIHdpZHRoIDwgNDgwKSA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0geydvbW5pdHVyZUV2ZW50JyA6ICdldmVudDYnfTsgICAgICAgICAgXG4gICAgXG4gICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzTW9yZUJ0bi5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJyx0aGlzLGZ1bmN0aW9uKGV2KXsgIFxuICAgICAgICAgICAgICAgICAgICBpZihpc01vYmlsZSl7JHNvY2lhbFRvb2xzVXRpbGl0eS5oaWRlKCdmYXN0Jyk7fTsgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNNb3JlQnRuLmhpZGUoJ2Zhc3QnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc0FkZGl0aW9uYWwuc2hvdygnZmFzdCcsZnVuY3Rpb24oZXYpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy50b29sJywkc29jaWFsVG9vbHNXcmFwcGVyKS5hbmltYXRlKHtcIndpZHRoXCI6NDB9LDI1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3QuYWRkQ2xhc3MoXCJleHBhbmRlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcuc29jaWFsLXRvb2xzJywkc29jaWFsVG9vbHNBZGRpdGlvbmFsKS5hbmltYXRlKHtcIm1hcmdpbi1sZWZ0XCI6MH0sMjUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihpc01vYmlsZSl7JHNvY2lhbFRvb2xzVXRpbGl0eS5zaG93KCdzbG93Jyk7fTsgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7Ly9lbmQgYWRkdGwgc2hvd1xuICAgICAgICAgICAgICAgIH0pOy8vZW5kIG1vcmUgY2xpY2sgXG4gICAgICAgICAgICAgICAgJGluZGl2aWR1YWxUb29sLmJpbmQoe1xuICAgICAgICAgICAgICAgICAgICBjbGljazogZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9ldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LnNlbmREYXRhVG9PbW5pdHVyZSA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2hhcmVUeXBlID0gJCh0aGlzKS5hdHRyKCdjbGFzcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXJlVHlwZSA9ICh0eXBlb2Ygc2hhcmVUeXBlICE9ICd1bmRlZmluZWQnKT9zaGFyZVR5cGUuc3BsaXQoXCIgXCIpWzBdLnRyaW0oKTonJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb21uaXR1cmVWYXJzID0gIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZVZhcjFcIjoodHlwZW9mIHdpbmRvdy5zID09ICdvYmplY3QnKSAmJiBzICYmIHMuZVZhcjEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVWYXIyXCI6KHR5cGVvZiB3aW5kb3cucyA9PSAnb2JqZWN0JykgJiYgcyAmJiBzLmVWYXIyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlVmFyOFwiOih0eXBlb2Ygd2luZG93LnMgPT0gJ29iamVjdCcpICYmIHMgJiYgcy5lVmFyOCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZVZhcjE3XCI6KHR5cGVvZiB3aW5kb3cucyA9PSAnb2JqZWN0JykgJiYgcyAmJiBzLmVWYXIxNyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZVZhcjI3XCI6JydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb21uaXR1cmVWYXJzLmVWYXIyNyA9IHNoYXJlVHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnROYW1lID0gY29uZmlnLm9tbml0dXJlRXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VuZERhdGFUb09tbml0dXJlKCdzaGFyZS4nICsgc2hhcmVUeXBlLGV2ZW50TmFtZSxvbW5pdHVyZVZhcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpe30gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgfVxuICAgIH07ICAgXG5cbiAgIHZhciB0ZXh0UmVzaXplciA9IHtcbiAgICAgICAgY3VyckluY3JlbWVudE1heDo0LFxuICAgICAgICBjdXJySW5jcmVtZW50VW5pdDoyLFxuICAgICAgICBjdXJySW5jcmVtZW50SW5kZXg6MCxcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKG15Um9vdCxyZXNpemVhYmxlRWxlbWVudExpc3QsY2xpY2tFbGVtZW50KSB7XG4gICAgICAgICAgICBteVJvb3QgPSBteVJvb3QgfHwgJyNhcnRpY2xlLWJvZHkgYXJ0aWNsZSwgLnJlbGF0ZWQtc3RvcnknO1xuICAgICAgICAgICAgcmVzaXplYWJsZUVsZW1lbnRMaXN0ID0gcmVzaXplYWJsZUVsZW1lbnRMaXN0IHx8ICdwLCBsaSc7XG4gICAgICAgICAgICBjbGlja0VsZW1lbnQgPSBjbGlja0VsZW1lbnQgfHwgJy50b29sLnRleHRyZXNpemVyJztcbiAgICAgICAgICAgIHRoaXMucm9vdCA9ICQobXlSb290KTtcbiAgICAgICAgICAgIHRoaXMucmVzaXplYWJsZUVsZW1lbnRzID0gJChyZXNpemVhYmxlRWxlbWVudExpc3QsIHRoaXMucm9vdCk7XG5cbiAgICAgICAgICAgIC8vIGFkZCBcIk5leHQgdXBcIiBsYWJsZSB0byB0aGUgcmVzaXphYmxlIGVsZW1lbnQncyBsaXN0XG4gICAgICAgICAgICBpZigkKFwiLnJlbGF0ZWQtc3RvcnlcIikucHJldignaDMnKS5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZWFibGVFbGVtZW50cy5wdXNoKCQoJy5yZWxhdGVkLXN0b3J5JykucHJldignaDMnKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVhYmxlRWxlbWVudHMucHVzaCgkKCcucmVsYXRlZC1zdG9yeSBoNCBhJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJChjbGlja0VsZW1lbnQpLnVuYmluZCgnY2xpY2snKS5vbignY2xpY2snLHRoaXMsdGhpcy5yZXNpemUpO1xuICAgICAgICB9LFxuICAgICAgICByZXNpemU6IGZ1bmN0aW9uIChldmVudCkgeyAgXG4gICAgICAgICAgICB2YXIgY3Vyck9iaiA9IGV2ZW50LmRhdGE7XG4gICAgICAgICAgICBpZiAoY3Vyck9iai5jdXJySW5jcmVtZW50SW5kZXggPT0gY3Vyck9iai5jdXJySW5jcmVtZW50TWF4KSB7XG4gICAgICAgICAgICAgICAgY3Vyck9iai5jdXJySW5jcmVtZW50SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIGN1cnJPYmouY3VyckluY3JlbWVudFVuaXQgPSAoY3Vyck9iai5jdXJySW5jcmVtZW50VW5pdCA9PSAyKT8tMjoyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3Vyck9iai5jdXJySW5jcmVtZW50SW5kZXggPSBjdXJyT2JqLmN1cnJJbmNyZW1lbnRJbmRleCArIDE7XG4gICAgICAgICAgICBjdXJyT2JqLnJlc2l6ZWFibGVFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgZWxtID0gJCh0aGlzKTtcbiAgICAgICAgICAgICAgICBjdXJyU2l6ZT0gcGFyc2VGbG9hdChlbG0uY3NzKCdmb250LXNpemUnKSw1KTtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VyclNpemUgKyBjdXJyT2JqLmN1cnJJbmNyZW1lbnRVbml0O1xuICAgICAgICAgICAgICAgIGVsbS5jc3MoJ2ZvbnQtc2l6ZScsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgd3BfcGIucmVwb3J0KCd0ZXh0cmVzaXplcicsICdyZXNpemVkJywgcmVzdWx0KTtcbiAgICAgICAgICAgIH0pOyBcblxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgIH07XG52YXIgbW9iaWxlX2Jyb3dzZXIgPSBtb2JpbGVfYnJvd3NlciAmJiBtb2JpbGVfYnJvd3NlciA9PT0gMSA/IDEgOiAwO1xuICAgXG4gICB2YXIgcG9zdFNoYXJlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgdGhpcy5pbml0ID0gZnVuY3Rpb24ocm9vdEVsZW1lbnQsIHBvc3RTaGFyZVR5cGVzKSB7XG4gICAgICAgICAgIGlmIChwb3N0U2hhcmVUeXBlcykge1xuICAgICAgICAgICAgICAgcG9zdFNoYXJlVHlwZXMuc3BsaXQoXCIsXCIpLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCwgaW5kZXgpe1xuICAgICAgICAgICAgICAgICAgIHZhciBwb3N0U2hhcmVVcmwgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaG9zdC5pbmRleE9mKCd3YXNoaW5ndG9ucG9zdC5jb20nKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHBvc3RTaGFyZVVybCA9ICdodHRwOi8vcG9zdHNoYXJlLndhc2hpbmd0b25wb3N0LmNvbSc7IC8vcHJvZHVjdGlvbiBvbmx5XG4gICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh3aW5kb3cubG9jYXRpb24uaG9zdC5pbmRleE9mKCdwYi1zdGFnaW5nLmRpZ2l0YWxpbmsuY29tJykgPj0gMCB8fCB3aW5kb3cubG9jYXRpb24uaG9zdC5pbmRleE9mKCdwYi1zdGFnaW5nLndwcHJpdmF0ZS5jb20nKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHBvc3RTaGFyZVVybCA9ICdodHRwOi8vcG9zdHNoYXJlLXN0YWdlLndwcHJpdmF0ZS5jb20nOyAvL3Rlc3RpbmcgcGItc3RhZ2luZ1xuICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHBvc3RTaGFyZVVybCA9ICdodHRwOi8vcG9zdHNoYXJlLWRldi53cHByaXZhdGUuY29tJzsgLy90ZXN0aW5nIHBiLWRldlxuICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICB2YXIgcHJlVGltZXN0YW1wID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICB2YXIgcHJlQnVzaW5lc3NLZXkgPSB3cF9wYi5TdGF0aWNNZXRob2RzLmdldFVuaXF1ZUtleSgxMDAwLCBudWxsLCBwcmVUaW1lc3RhbXApO1xuICAgICAgICAgICAgICAgICAgIHZhciBvYmplY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHNoYXJlVHlwZSA6IGVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcCA6IHByZVRpbWVzdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgICAgYnVzaW5lc3NLZXkgOiBwcmVCdXNpbmVzc0tleSxcbiAgICAgICAgICAgICAgICAgICAgICAgc2hhcmVVcmwgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICB0aW55VXJsIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVkUG9zdFNoYXJlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgIGNsaWVudFV1aWQgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBwb3N0U2hhcmVVcmwgOiBwb3N0U2hhcmVVcmwsXG4gICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICBjYWxsUG9zdFNoYXJlIDogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY2FsbGVkUG9zdFNoYXJlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBfdGhpcy5wb3N0U2hhcmVVcmwrXCIvYXBpL2JrL1wiK190aGlzLmJ1c2luZXNzS2V5K1wiL1wiK190aGlzLmNsaWVudFV1aWQrXCIvXCIrX3RoaXMuc2hhcmVUeXBlK1wiL1wiK190aGlzLnRpbWVzdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2FsbGVkUG9zdFNoYXJlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbGxlZFBvc3RTaGFyZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICBzaGFyZSA6IGZ1bmN0aW9uIChzb2NpYWxVcmwsIHNvY2lhbFVybDIsIHN0eWxlLCBjYWxsYmFja0NvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudGlueVVybCB8fCB0aGlzLnRpbnlVcmwubGVuZ3RoID09IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogXCJodHRwOi8vdGlueXVybC53YXNoaW5ndG9ucG9zdC5jb20vY3JlYXRlLmpzb25wXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBfdGhpcy5zaGFyZVVybCArIFwiP3Bvc3RzaGFyZT1cIitfdGhpcy5idXNpbmVzc0tleVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyb3NzRG9tYWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnRpbnlVcmwgPSBkYXRhLnRpbnlVcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja0NvbnRleHQub3BlbldpbmRvdyhzb2NpYWxVcmwrX3RoaXMudGlueVVybCtzb2NpYWxVcmwyLF90aGlzLnNoYXJlVHlwZSxzdHlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy90aHJvdyBcIlBvc3RTaGFyZSBmYWlsZWQ6IHRpbnlVcmxcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogMjAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrQ29udGV4dC5vcGVuV2luZG93KHNvY2lhbFVybCtfdGhpcy50aW55VXJsK3NvY2lhbFVybDIsX3RoaXMuc2hhcmVUeXBlLHN0eWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgJChyb290RWxlbWVudC5maW5kKCcuJytlbGVtZW50KVswXSkucGFyZW50KClbMF0ucG9zdFNoYXJlID0gJChyb290RWxlbWVudClbMF0ucG9zdFNoYXJlO1xuICAgICAgICAgICAgICAgICAgICQocm9vdEVsZW1lbnQuZmluZCgnLicrZWxlbWVudClbMF0pLnBhcmVudCgpWzBdLnBvc3RTaGFyZU9iamVjdCA9IG9iamVjdDtcbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICB9XG4gICAgICAgfSxcbiAgICAgICBcbiAgICAgICB0aGlzLmNhbGxQb3N0U2hhcmUgPSBmdW5jdGlvbiAoZWxlbWVudCwgZWxlbWVudE9iamVjdCwgc29jaWFsVXJsLCBzaGFyZVVybExvbmcsIHNvY2lhbFVybDIsIHN0eWxlKSB7XG4gICAgICAgICAgIGlmKGVsZW1lbnQgJiYgZWxlbWVudE9iamVjdCAmJiBzb2NpYWxVcmwgJiYgc2hhcmVVcmxMb25nKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNoYXJlVHlwZSA9ICQoZWxlbWVudCkuY2hpbGRyZW4oKS5hdHRyKCdjbGFzcycpO1xuICAgICAgICAgICAgICAgIHNoYXJlVHlwZSA9ICh0eXBlb2Ygc2hhcmVUeXBlICE9ICd1bmRlZmluZWQnKT9zaGFyZVR5cGUuc3BsaXQoXCIgXCIpWzBdLnRyaW0oKTonJztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZighc29jaWFsVXJsMikge1xuICAgICAgICAgICAgICAgICAgICBzb2NpYWxVcmwyID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGNsaWVudFV1aWQgPSAkLmNvb2tpZShcIndhcG9fbG9naW5faWRcIik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxlbWVudE9iamVjdC5jbGllbnRVdWlkID0gY2xpZW50VXVpZDtcbiAgICAgICAgICAgICAgICBpZiAoY2xpZW50VXVpZCAmJiBjbGllbnRVdWlkLmxlbmd0aCA+IDAgJiYgc2hhcmVUeXBlICYmIHNoYXJlVHlwZS5sZW5ndGggPiAwICYmIGVsZW1lbnRPYmplY3Quc2hhcmVUeXBlICYmIHNoYXJlVHlwZS50cmltKCkgPT0gZWxlbWVudE9iamVjdC5zaGFyZVR5cGUudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRPYmplY3Quc2hhcmVVcmwgPSBzaGFyZVVybExvbmc7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRPYmplY3QuY2FsbFBvc3RTaGFyZSgpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50T2JqZWN0LnNoYXJlKHNvY2lhbFVybCwgc29jaWFsVXJsMiwgc3R5bGUsIGVsZW1lbnQucG9zdFNoYXJlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlBvc3RTaGFyZSBmYWlsZWQ6IG5vIGxvZ2dlZCBpbiBVc2VyIG9yIHdyb25nIFNoYXJldHlwZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLnBhcmVudCgpWzBdLnBvc3RTaGFyZU9iamVjdCA9IGVsZW1lbnRPYmplY3Q7XG4gICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICB0aHJvdyBcIlBvc3RTaGFyZSBmYWlsZWQ6IERhdGEgbWlzc2luZ1wiO1xuICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgXG4gICAgICAgIHRoaXMub3BlbldpbmRvdyA9IGZ1bmN0aW9uKHVybCwgbmFtZSwgc3R5bGUpe1xuICAgICAgICAgICAgd2luZG93Lm9wZW4odXJsLCdzaGFyZV8nK25hbWUsc3R5bGUpO1xuICAgICAgICB9XG4gICB9O1xuICAgXG4gICB3aW5kb3cuVFdQID0gd2luZG93LlRXUCB8fCB7fTtcbiAgIFRXUC5Tb2NpYWxUb29scyA9IFRXUC5Tb2NpYWxUb29scyB8fCBzb2NpYWxUb29scztcbiAgIFRXUC5UZXh0UmVzaXplciA9IFRXUC5UZXh0UmVzaXplciB8fCB0ZXh0UmVzaXplcjtcblxuICAgVFdQLlRleHRSZXNpemVyLmluaXQoKTtcbiAgIFRXUC5Tb2NpYWxUb29scy5pbml0KCk7XG5cblxuICAgLypcbiAgICAgKiBQT1BPVVQgY29kZSBmb3IgbGF0ZXIgdmFyICRhcnRpY2xlID0gJCgnI2FydGljbGUtdG9wcGVyJyk7IC8vIFNUQVJUOlxuICAgICAqIFNvY2lhbCBzaGFyZSBwb3Atb3V0IHZhciAkc29jaWFsVG9vbHNNb3JlQnRuID0gJCgnLnNvY2lhbC10b29sc1xuICAgICAqIC5tb3JlJywkYXJ0aWNsZSksICRzb2NpYWxUb29sc1BvcE91dCA9XG4gICAgICogJCgnLnNvY2lhbC10b29scy5wb3Atb3V0JywkYXJ0aWNsZSkgO1xuICAgICAqICRzb2NpYWxUb29sc01vcmVCdG4ub24oJ2NsaWNrJyxmdW5jdGlvbihldil7IHZhciB0YXJnZXRUb3AgPVxuICAgICAqICRzb2NpYWxUb29sc01vcmVCdG4ucG9zaXRpb24oKS50b3AgK1xuICAgICAqICRzb2NpYWxUb29sc01vcmVCdG4ub3V0ZXJIZWlnaHQoKS0xLTE0OyB2YXIgdGFyZ2V0TGVmdCA9XG4gICAgICogJHNvY2lhbFRvb2xzTW9yZUJ0bi5wb3NpdGlvbigpLmxlZnQtMS0zO1xuICAgICAqICRzb2NpYWxUb29sc1BvcE91dC5jc3Moe1widG9wXCI6dGFyZ2V0VG9wLFwibGVmdFwiOnRhcmdldExlZnR9KTtcbiAgICAgKiAkc29jaWFsVG9vbHNQb3BPdXQudG9nZ2xlKCk7IH0pO1xuICAgICAqICRzb2NpYWxUb29sc1BvcE91dC5vbignbW91c2VvdXQnLGZ1bmN0aW9uKGV2KXtcbiAgICAgKiAkc29jaWFsVG9vbHNQb3BPdXQudG9nZ2xlKCk7IH0pOyAvLyBFTkQ6IFNvY2lhbCBzaGFyZSBwb3Atb3V0XG4gICAgICovXG59KShqUXVlcnkpOyIsInZhciBpZnJhbWUgPSByZXF1aXJlKCcuL2lmcmFtZS5qcycpO1xudmFyIHR3aXR0ZXJGb2xsb3dCdXR0b25Nb2R1bGVzID0gcmVxdWlyZSgnLi90d2l0dGVyLWZvbGxvdy5qcycpO1xudmFyIHBiSGVhZGVyTW9kdWxlID0gcmVxdWlyZSgnLi9wYkhlYWRlci5qcycpO1xudmFyIHBiU29jaWFsVG9vbHMgPSByZXF1aXJlKCcuL3BiU29jaWFsVG9vbHMuanMnKTtcblxuLy9BZGRzIHRoZSByZXR1cm4gdXJsIHRvIHRoZSBzdWJzY3JpYmUgYWN0aW9uXG52YXIgc2V0dXBTdWJzY3JpYmVCdG4gPSBmdW5jdGlvbigpe1xuICB2YXIgJHN1YnNjcmliZSA9ICQoJyNuYXYtc3Vic2NyaWJlJyksXG4gICAgaHJlZiA9ICAkc3Vic2NyaWJlLmF0dHIoJ2hyZWYnKSxcbiAgICBwYWdlTG9jYXRpb24gPSB3aW5kb3cuZW5jb2RlVVJJKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICRzdWJzY3JpYmUuYXR0cignaHJlZicsIGhyZWYgKyBwYWdlTG9jYXRpb24pO1xufTtcbi8vRHJvcCBpbiB5b3VyIGluaXQgZmlsZVxuc2V0dXBTdWJzY3JpYmVCdG4oKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEdlbmVyYWxcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xudmFyIGdldE9mZnNldCA9IGZ1bmN0aW9uKGVsKSB7XG4gIGVsID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHJldHVybiB7XG4gICAgbGVmdDogZWwubGVmdCArIHdpbmRvdy5zY3JvbGxYLFxuICAgIHRvcDogZWwudG9wICsgd2luZG93LnNjcm9sbFlcbiAgfVxufVxuXG52YXIgc2h1ZmZsZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gIHZhciBjdXJyZW50SW5kZXggPSBhcnJheS5sZW5ndGgsIHRlbXBvcmFyeVZhbHVlLCByYW5kb21JbmRleDtcblxuICAvLyBXaGlsZSB0aGVyZSByZW1haW4gZWxlbWVudHMgdG8gc2h1ZmZsZS4uLlxuICB3aGlsZSAoMCAhPT0gY3VycmVudEluZGV4KSB7XG5cbiAgICAvLyBQaWNrIGEgcmVtYWluaW5nIGVsZW1lbnQuLi5cbiAgICByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGN1cnJlbnRJbmRleCk7XG4gICAgY3VycmVudEluZGV4IC09IDE7XG5cbiAgICAvLyBBbmQgc3dhcCBpdCB3aXRoIHRoZSBjdXJyZW50IGVsZW1lbnQuXG4gICAgdGVtcG9yYXJ5VmFsdWUgPSBhcnJheVtjdXJyZW50SW5kZXhdO1xuICAgIGFycmF5W2N1cnJlbnRJbmRleF0gPSBhcnJheVtyYW5kb21JbmRleF07XG4gICAgYXJyYXlbcmFuZG9tSW5kZXhdID0gdGVtcG9yYXJ5VmFsdWU7XG4gIH1cblxuICByZXR1cm4gYXJyYXk7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBWYWx1ZXNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC44LCB5OjAuMn0sIHt4OjAuNzgsIHk6MC4xOH0sIHt4OjAuNzQsIHk6MC4yfSwge3g6MC43MiwgeTowLjIxfSwge3g6MC43MSwgeTowLjI0fSwge3g6MC43MywgeTowLjI2fSwge3g6MC43NiwgeTowLjIzfSwge3g6MC43OSwgeTowLjJ9KSxcbiAgbmV3IEFycmF5KHt4OjAuNiwgeTowLjN9LCB7eDowLjU1LCB5OjAuMjJ9LCB7eDowLjYyLCB5OjAuMjR9LCB7eDowLjY4LCB5OjAuMn0sIHt4OjAuNzEsIHk6MC4xOH0sIHt4OjAuNjgsIHk6MC4xNX0sIHt4OjAuNjQsIHk6MC4xOH0sIHt4OjAuNjMsIHk6MC4yMn0sIHt4OjAuNjIsIHk6MC4yNn0sIHt4OjAuNjEsIHk6MC4yOH0pLFxuICBuZXcgQXJyYXkoe3g6MC40OSwgeTowLjE0fSwge3g6MC41NCwgeTowLjE2fSwge3g6MC41NiwgeTowLjE0fSwge3g6MC41NCwgeTowLjE4fSwge3g6MC41NiwgeTowLjIyfSwge3g6MC41MiwgeTowLjE4fSwge3g6MC41LCB5OjAuMTR9LCB7eDowLjQ3LCB5OjAuMTJ9KSxcbiAgbmV3IEFycmF5KHt4OjAuNTUsIHk6MC4zMX0sIHt4OjAuNTgsIHk6MC4yOH0sIHt4OjAuNjQsIHk6MC4yNn0sIHt4OjAuNzIsIHk6MC4yMn0sIHt4OjAuOCwgeTowLjE4fSwge3g6MC43MywgeTowLjIyfSwge3g6MC42OCwgeTowLjI0fSwge3g6MC42MiwgeTowLjI4fSksXG4gIG5ldyBBcnJheSh7eDowLjc1LCB5OjAuMTZ9LCB7eDowLjcyLCB5OjAuMTh9LCB7eDowLjY4LCB5OjAuMjJ9LCB7eDowLjYyLCB5OjAuMjZ9LCB7eDowLjU1LCB5OjAuM30sIHt4OjAuNjIsIHk6MC4yNn0sIHt4OjAuNjgsIHk6MC4yMn0sIHt4OjAuNzIsIHk6MC4xOH0pLFxuICBuZXcgQXJyYXkoe3g6MC44MTI3Njk2Mjg5OTA1MDkxLCB5OjAuMTQ1ODE1MzU4MDY3Mjk5NH0se3g6MC43NjE4NjM2NzU1ODIzOTg2LCB5OjAuMTM3MTg3MjMwMzcxMDA5NX0se3g6MC42OTM3MDE0NjY3ODE3MDg0LCB5OjAuMTM0NTk4NzkyMDYyMTIyNTJ9LHt4OjAuNTg1ODQ5ODcwNTc4MDg0NiwgeTowLjE0MzIyNjkxOTc1ODQxMjQyfSx7eDowLjUxODU1MDQ3NDU0NzAyMzMsIHk6MC4xNjk5NzQxMTU2MTY5MTExNH0se3g6MC41MDk5MjIzNDY4NTA3MzMzLCB5OjAuMjA3OTM3ODc3NDgwNTg2N30se3g6MC41NTk5NjU0ODc0ODkyMTQ4LCB5OjAuMjMyMDk2NjM1MDMwMTk4NDV9LHt4OjAuNjM3NjE4NjM2NzU1ODI0LCB5OjAuMjE0ODQwMzc5NjM3NjE4NjV9LHt4OjAuNzA2NjQzNjU4MzI2MTQzMiwgeTowLjIxMzk3NzU2Njg2Nzk4OTYzfSx7eDowLjc5MDMzNjQ5Njk4MDE1NTMsIHk6MC4yMzU1NDc4ODYxMDg3MTQ0fSx7eDowLjgzOTUxNjgyNDg0OTAwNzgsIHk6MC4yMTEzODkxMjg1NTkxMDI2Nn0se3g6MC44Mzk1MTY4MjQ4NDkwMDc4LCB5OjAuMTkzMjcwMDYwMzk2ODkzODd9KSxcbiAgbmV3IEFycmF5KHt4OjAuNDkwOTQwNDY1OTE4ODk1NiwgeTowLjMxOTI0MDcyNDc2MjcyNjQ3fSx7eDowLjUwMzAxOTg0NDY5MzcwMTQsIHk6MC4yNzg2ODg1MjQ1OTAxNjM5fSx7eDowLjU3NTQ5NjExNzM0MjUzNjcsIHk6MC4xOTkzMDk3NDk3ODQyOTY4fSx7eDowLjYzODQ4MTQ0OTUyNTQ1MjksIHk6MC4xMzgwNTAwNDMxNDA2Mzg0OH0se3g6MC42NzgxNzA4MzY5MjgzODY1LCB5OjAuMDk2NjM1MDMwMTk4NDQ2OTR9LHt4OjAuNzE0NDA4OTczMjUyODA0MiwgeTowLjExMTMwMjg0NzI4MjEzOTc4fSx7eDowLjc0ODA1ODY3MTI2ODMzNDgsIHk6MC4xNzYwMTM4MDUwMDQzMTQwN30se3g6MC44MDUwMDQzMTQwNjM4NDgxLCB5OjAuMjY4MzM0NzcxMzU0NjE2MDN9LHt4OjAuNzkyMDYyMTIyNTE5NDEzMywgeTowLjMyMDEwMzUzNzUzMjM1NTV9LHt4OjAuNjU1NzM3NzA0OTE4MDMyNywgeTowLjMzMDQ1NzI5MDc2NzkwMzM3fSx7eDowLjU0NTI5NzY3MDQwNTUyMiwgeTowLjMxNzUxNTA5OTIyMzQ2ODV9KSxcbiAgbmV3IEFycmF5KHt4OjAuNjA3NDIwMTg5ODE4ODA5MywgeTowLjExMjE2NTY2MDA1MTc2ODc3fSx7eDowLjU4MjM5ODYxOTQ5OTU2ODYsIHk6MC4xNDc1NDA5ODM2MDY1NTczN30se3g6MC41NDYxNjA0ODMxNzUxNTEsIHk6MC4yMjAwMTcyNTYyNTUzOTI2fSx7eDowLjU1MzA2Mjk4NTMzMjE4MjksIHk6MC4zMDg4ODY5NzE1MjcxNzg2fSx7eDowLjY0MTkzMjcwMDYwMzk2ODksIHk6MC4zMDcxNjEzNDU5ODc5MjA2fSx7eDowLjY3MjEzMTE0NzU0MDk4MzYsIHk6MC4yMzcyNzM1MTE2NDc5NzI0fSx7eDowLjY5NjI4OTkwNTA5MDU5NTMsIHk6MC4xNDkyNjY2MDkxNDU4MTUzNX0se3g6MC43NTMyMzU1NDc4ODYxMDg3LCB5OjAuMTQ1ODE1MzU4MDY3Mjk5NH0se3g6MC43MzY4NDIxMDUyNjMxNTc5LCB5OjAuMjg4MTc5NDY1MDU2MDgyODN9LHt4OjAuODAzMjc4Njg4NTI0NTkwMiwgeTowLjMzMzA0NTcyOTA3Njc5MDN9LHt4OjAuODIyMjYwNTY5NDU2NDI4LCB5OjAuMjI2OTE5NzU4NDEyNDI0NX0se3g6MC43Mzk0MzA1NDM1NzIwNDQ5LCB5OjAuMTIwNzkzNzg3NzQ4MDU4Njd9LHt4OjAuNjc4MTcwODM2OTI4Mzg2NSwgeTowLjExODIwNTM0OTQzOTE3MTd9LHt4OjAuNjA1Njk0NTY0Mjc5NTUxNCwgeTowLjEzMTE0NzU0MDk4MzYwNjU2fSksXG4gIG5ldyBBcnJheSh7eDowLjUxNjgyNDg0OTAwNzc2NTMsIHk6MC4yNzAwNjAzOTY4OTM4NzR9LHt4OjAuNTEzMzczNTk3OTI5MjQ5MywgeTowLjE5MDY4MTYyMjA4ODAwNjl9LHt4OjAuNTYyNTUzOTI1Nzk4MTAxOCwgeTowLjEzMTE0NzU0MDk4MzYwNjU2fSx7eDowLjYyODk5MDUwOTA1OTUzNDEsIHk6MC4wOTgzNjA2NTU3Mzc3MDQ5Mn0se3g6MC43MDQwNTUyMjAwMTcyNTYzLCB5OjAuMDkyMzIwOTY2MzUwMzAxOTl9LHt4OjAuNzUxNTA5OTIyMzQ2ODUwOCwgeTowLjEzMTE0NzU0MDk4MzYwNjU2fSx7eDowLjc4OTQ3MzY4NDIxMDUyNjMsIHk6MC4xODcyMzAzNzEwMDk0OTA5NH0se3g6MC44NTMzMjE4MjkxNjMwNzE2LCB5OjAuMjU2MjU1MzkyNTc5ODEwMTd9KSxcbiAgbmV3IEFycmF5KHt4OjAuODI3NDM3NDQ2MDc0MjAxOSwgeTowLjEzODkxMjg1NTkxMDI2NzQ3fSx7eDowLjc2MTAwMDg2MjgxMjc2OTYsIHk6MC4xMDA5NDkwOTQwNDY1OTE4OX0se3g6MC43MDU3ODA4NDU1NTY1MTQyLCB5OjAuMDc2NzkwMzM2NDk2OTgwMTV9LHt4OjAuNjMwNzE2MTM0NTk4NzkyLCB5OjAuMDc1OTI3NTIzNzI3MzUxMTZ9LHt4OjAuNTQ4NzQ4OTIxNDg0MDM4LCB5OjAuMDkxNDU4MTUzNTgwNjczfSx7eDowLjQ5NjExNzM0MjUzNjY2OTU2LCB5OjAuMTMyMDEwMzUzNzUzMjM1NTV9LHt4OjAuNDgwNTg2NzEyNjgzMzQ3NzQsIHk6MC4xNzUxNTA5OTIyMzQ2ODUwOH0se3g6MC41MTA3ODUxNTk2MjAzNjI0LCB5OjAuMjE1NzAzMTkyNDA3MjQ3NjR9LHt4OjAuNTY2ODY3OTg5NjQ2MjQ2NywgeTowLjI1NjI1NTM5MjU3OTgxMDE3fSx7eDowLjY2MDA1MTc2ODc2NjE3NzgsIHk6MC4zMDM3MTAwOTQ5MDk0MDQ2NX0se3g6MC43MzUxMTY0Nzk3MjM4OTk5LCB5OjAuMzA0NTcyOTA3Njc5MDMzNjd9LHt4OjAuNzg0Mjk2ODA3NTkyNzUyMywgeTowLjMyMTgyOTE2MzA3MTYxMzQ3fSx7eDowLjg0MDM3OTYzNzYxODYzNjgsIHk6MC4zMTE0NzU0MDk4MzYwNjU2fSx7eDowLjgzNjA2NTU3Mzc3MDQ5MTgsIHk6MC4xOTU4NTg0OTg3MDU3ODA4NH0pLFxuICBuZXcgQXJyYXkoe3g6MC40Nzk3MjM4OTk5MTM3MTg3LCB5OjAuMzAxOTg0NDY5MzcwMTQ2Njd9LHt4OjAuNDkwOTQwNDY1OTE4ODk1NiwgeTowLjIwNzkzNzg3NzQ4MDU4Njd9LHt4OjAuNTMyMzU1NDc4ODYxMDg3MSwgeTowLjEyNDI0NTAzODgyNjU3NDYzfSx7eDowLjYzOTM0NDI2MjI5NTA4MiwgeTowLjA4ODg2OTcxNTI3MTc4NjAzfSx7eDowLjc3Mzk0MzA1NDM1NzIwNDUsIHk6MC4wOTkyMjM0Njg1MDczMzM5fSx7eDowLjg0NzI4MjEzOTc3NTY2ODcsIHk6MC4xNTQ0NDM0ODU3NjM1ODkzfSx7eDowLjg3MDU3ODA4NDU1NTY1MTQsIHk6MC4yNzA5MjMyMDk2NjM1MDMwM30se3g6MC44NDQ2OTM3MDE0NjY3ODE3LCB5OjAuMzI0NDE3NjAxMzgwNTAwNH0se3g6MC43MjgyMTM5Nzc1NjY4NjgsIHk6MC4zNDU5ODc5MjA2MjEyMjUyfSx7eDowLjUzMjM1NTQ3ODg2MTA4NzEsIHk6MC4zNDA4MTEwNDQwMDM0NTEyNX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC40ODIyODgxMzU1OTMyMjAzNywgeTowLjIwMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDIwNDIzNzI4ODEzNTU5NCwgeTowLjIwNDIzNzI4ODEzNTU5MzIyfSx7eDowLjM3NDY2MTAxNjk0OTE1MjU1LCB5OjAuMjA1OTMyMjAzMzg5ODMwNX0se3g6MC4zMDI2MjcxMTg2NDQwNjc4LCB5OjAuMjA3NjI3MTE4NjQ0MDY3OH0se3g6MC4yODk5MTUyNTQyMzcyODgxNCwgeTowLjIxNTI1NDIzNzI4ODEzNTU5fSx7eDowLjI4NDgzMDUwODQ3NDU3NjMsIHk6MC4yMjc5NjYxMDE2OTQ5MTUyNH0se3g6MC4yODIyODgxMzU1OTMyMjAzNiwgeTowLjI1MTY5NDkxNTI1NDIzNzI2fSx7eDowLjI3NDY2MTAxNjk0OTE1MjU3LCB5OjAuMjY2OTQ5MTUyNTQyMzcyOX0se3g6MC4yNTYwMTY5NDkxNTI1NDI0LCB5OjAuMjY5NDkxNTI1NDIzNzI4ODR9LHt4OjAuMDcyMTE4NjQ0MDY3Nzk2NjMsIHk6MC4yNzIwMzM4OTgzMDUwODQ3M30se3g6MC4wNTUxNjk0OTE1MjU0MjM3MywgeTowLjI4MDUwODQ3NDU3NjI3MTJ9LHt4OjAuMDUwMDg0NzQ1NzYyNzExODY2LCB5OjAuMzAzMzg5ODMwNTA4NDc0NTd9LHt4OjAuMDQ3NTQyMzcyODgxMzU1OTQ2LCB5OjAuNDI0NTc2MjcxMTg2NDQwN30se3g6MC4wNDkyMzcyODgxMzU1OTMyMzUsIHk6MC40OTgzMDUwODQ3NDU3NjI3NH0se3g6MC4wNTY4NjQ0MDY3Nzk2NjEwMiwgeTowLjUxMzU1OTMyMjAzMzg5ODN9LHt4OjAuMDY5NTc2MjcxMTg2NDQwNjgsIHk6MC41MTg2NDQwNjc3OTY2MTAyfSx7eDowLjA5MjQ1NzYyNzExODY0NDA3LCB5OjAuNTIxMTg2NDQwNjc3OTY2Mn0se3g6MC4xMDk0MDY3Nzk2NjEwMTY5NiwgeTowLjUyNjI3MTE4NjQ0MDY3Nzl9LHt4OjAuMTE0NDkxNTI1NDIzNzI4ODMsIHk6MC41NDIzNzI4ODEzNTU5MzIyfSx7eDowLjExNDQ5MTUyNTQyMzcyODgzLCB5OjAuNTU5MzIyMDMzODk4MzA1fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjExLCB5OjAuNjJ9LCB7eDowLjEyLCB5OjAuNjh9LCB7eDowLjEzLCB5OjAuNzJ9LCB7eDowLjE0LCB5OjAuNjh9LCB7eDowLjEzLCB5OjAuNjJ9LCB7eDowLjExLCB5OjAuNn0pLFxuICBuZXcgQXJyYXkoe3g6MC4wOCwgeTowLjZ9LCB7eDowLjA5LCB5OjAuNTh9LCB7eDowLjEsIHk6MC41Mn0sIHt4OjAuMTIsIHk6MC41OH0sIHt4OjAuMTMsIHk6MC42NH0sIHt4OjAuMDksIHk6MC42Mn0pLFxuICBuZXcgQXJyYXkoe3g6MC4xMywgeTowLjY4fSwge3g6MC4xMiwgeTowLjYyfSwge3g6MC4xMSwgeTowLjU4fSwge3g6MC4xMiwgeTowLjU3fSwge3g6MC4xMywgeTowLjU4fSwge3g6MC4xMSwgeTowLjYyfSksXG4gIG5ldyBBcnJheSh7eDowLjEyNzk2NjEwMTY5NDkxNTI2LCB5OjAuNjE5NDkxNTI1NDIzNzI4OH0se3g6MC4xMTk0OTE1MjU0MjM3Mjg4MiwgeTowLjYzMjIwMzM4OTgzMDUwODV9LHt4OjAuMTEwMTY5NDkxNTI1NDIzNzMsIHk6MC42NTQyMzcyODgxMzU1OTMyfSx7eDowLjEsIHk6MC42Nzk2NjEwMTY5NDkxNTI2fSx7eDowLjEwNjc3OTY2MTAxNjk0OTE1LCB5OjAuNzEwMTY5NDkxNTI1NDIzN30se3g6MC4xMzU1OTMyMjAzMzg5ODMwNSwgeTowLjcxMTAxNjk0OTE1MjU0MjN9LHt4OjAuMTQ1NzYyNzExODY0NDA2NzksIHk6MC42ODEzNTU5MzIyMDMzODk5fSx7eDowLjE0NjYxMDE2OTQ5MTUyNTQyLCB5OjAuNjQ1NzYyNzExODY0NDA2OH0se3g6MC4xNDIzNzI4ODEzNTU5MzIyLCB5OjAuNTgyMjAzMzg5ODMwNTA4NX0se3g6MC4xMzM4OTgzMDUwODQ3NDU3NiwgeTowLjU1OTMyMjAzMzg5ODMwNX0se3g6MC4xMDc2MjcxMTg2NDQwNjc3OSwgeTowLjU2Njk0OTE1MjU0MjM3Mjl9LHt4OjAuMTA5MzIyMDMzODk4MzA1MDgsIHk6MC41OTkxNTI1NDIzNzI4ODE0fSksXG4gIG5ldyBBcnJheSh7eDowLjE0NDkxNTI1NDIzNzI4ODEzLCB5OjAuNTc5NjYxMDE2OTQ5MTUyNX0se3g6MC4xNDkxNTI1NDIzNzI4ODEzNiwgeTowLjU2MDE2OTQ5MTUyNTQyMzd9LHt4OjAuMTI3OTY2MTAxNjk0OTE1MjYsIHk6MC41NX0se3g6MC4xMTI3MTE4NjQ0MDY3Nzk2NiwgeTowLjU1Njc3OTY2MTAxNjk0OTJ9LHt4OjAuMTM2NDQwNjc3OTY2MTAxNjgsIHk6MC41OTkxNTI1NDIzNzI4ODE0fSx7eDowLjExNjEwMTY5NDkxNTI1NDI0LCB5OjAuNjI0NTc2MjcxMTg2NDQwN30se3g6MC4xMDMzODk4MzA1MDg0NzQ1NywgeTowLjY2MzU1OTMyMjAzMzg5ODN9LHt4OjAuMTIwMzM4OTgzMDUwODQ3NDYsIHk6MC42NzU0MjM3Mjg4MTM1NTkzfSx7eDowLjE0NTc2MjcxMTg2NDQwNjc5LCB5OjAuNjk0OTE1MjU0MjM3Mjg4Mn0se3g6MC4xMjYyNzExODY0NDA2Nzc5NywgeTowLjcxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuMTA3NjI3MTE4NjQ0MDY3NzksIHk6MC42ODgxMzU1OTMyMjAzMzl9LHt4OjAuMTI0NTc2MjcxMTg2NDQwNjgsIHk6MC42Mjg4MTM1NTkzMjIwMzM5fSx7eDowLjEzODEzNTU5MzIyMDMzODk3LCB5OjAuNTg2NDQwNjc3OTY2MTAxN30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U0ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMTYxODY0NDA2Nzc5NjYxMiwgeTowLjcxMTg2NDQwNjc3OTY2MX0sIHt4OjAuMTEzNjQ0MDY3Nzk2NjEwMTcsIHk6MC43Mzk4MzA1MDg0NzQ1NzYzfSwge3g6MC4xMTM2NDQwNjc3OTY2MTAxNywgeTowLjc1ODQ3NDU3NjI3MTE4NjR9LCB7eDowLjExMzY0NDA2Nzc5NjYxMDE3LCB5OjAuNzcxMTg2NDQwNjc3OTY2Mn0sIHt4OjAuMTEzNjQ0MDY3Nzk2NjEwMTcsIHk6MC43OTE1MjU0MjM3Mjg4MTM1fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTUgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjExLCB5OjAuODJ9LCB7eDowLjEyLCB5OjAuODh9LCB7eDowLjEzLCB5OjAuOTJ9LCB7eDowLjE0LCB5OjAuODh9LCB7eDowLjEzLCB5OjAuODJ9LCB7eDowLjExLCB5OjAuOH0pLFxuICBuZXcgQXJyYXkoe3g6MC4wOCwgeTowLjh9LCB7eDowLjA5LCB5OjAuNzh9LCB7eDowLjEsIHk6MC44Mn0sIHt4OjAuMTIsIHk6MC43OH0sIHt4OjAuMTMsIHk6MC44NH0sIHt4OjAuMDksIHk6MC44Mn0pLFxuICBuZXcgQXJyYXkoe3g6MC4xMywgeTowLjg4fSwge3g6MC4xMiwgeTowLjgyfSwge3g6MC4xMSwgeTowLjc4fSwge3g6MC4xMiwgeTowLjc3fSwge3g6MC4xMywgeTowLjc4fSwge3g6MC4xMSwgeTowLjgyfSksXG4gIG5ldyBBcnJheSh7eDowLjE0NzQ1NzYyNzExODY0NDA3LCB5OjAuNzY5NDkxNTI1NDIzNzI4OH0se3g6MC4xMTY5NDkxNTI1NDIzNzI4OCwgeTowLjc3Mjg4MTM1NTkzMjIwMzR9LHt4OjAuMDk1NzYyNzExODY0NDA2NzgsIHk6MC43ODEzNTU5MzIyMDMzODk4fSx7eDowLjA4NDc0NTc2MjcxMTg2NDQsIHk6MC44MDY3Nzk2NjEwMTY5NDkyfSx7eDowLjEsIHk6MC44MzcyODgxMzU1OTMyMjA0fSx7eDowLjEzMzg5ODMwNTA4NDc0NTc2LCB5OjAuODUzMzg5ODMwNTA4NDc0Nn0se3g6MC4xNTE2OTQ5MTUyNTQyMzcyOCwgeTowLjgzODEzNTU5MzIyMDMzOX0se3g6MC4xNjM1NTkzMjIwMzM4OTgzLCB5OjAuODAyNTQyMzcyODgxMzU1OX0pLFxuICBuZXcgQXJyYXkoe3g6MC4xMTUyNTQyMzcyODgxMzU2LCB5OjAuODUwODQ3NDU3NjI3MTE4N30se3g6MC4wOTA2Nzc5NjYxMDE2OTQ5MiwgeTowLjgyMDMzODk4MzA1MDg0NzR9LHt4OjAuMDk4MzA1MDg0NzQ1NzYyNzIsIHk6MC43OTU3NjI3MTE4NjQ0MDY3fSx7eDowLjExMjcxMTg2NDQwNjc3OTY2LCB5OjAuNzc1NDIzNzI4ODEzNTU5NH0se3g6MC4xMzg5ODMwNTA4NDc0NTc2MywgeTowLjc3OTY2MTAxNjk0OTE1MjZ9LHt4OjAuMTM1NTkzMjIwMzM4OTgzMDUsIHk6MC44MDMzODk4MzA1MDg0NzQ2fSx7eDowLjE0NzQ1NzYyNzExODY0NDA3LCB5OjAuODI3MTE4NjQ0MDY3Nzk2Nn0se3g6MC4xMjYyNzExODY0NDA2Nzc5NywgeTowLjg0OTE1MjU0MjM3Mjg4MTR9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNiA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMTA2OTQ5MTUyNTQyMzcyODcsIHk6MC44MjIwMzM4OTgzMDUwODQ4fSx7eDowLjEwMjcxMTg2NDQwNjc3OTY3LCB5OjAuODM0NzQ1NzYyNzExODY0NH0se3g6MC4xMDY5NDkxNTI1NDIzNzI4NywgeTowLjg0ODMwNTA4NDc0NTc2Mjd9LHt4OjAuMTA3Nzk2NjEwMTY5NDkxNTMsIHk6MC44Nzk2NjEwMTY5NDkxNTI2fSx7eDowLjEwNzc5NjYxMDE2OTQ5MTUzLCB5OjAuOTAzMzg5ODMwNTA4NDc0NX0se3g6MC4xMDc3OTY2MTAxNjk0OTE1MywgeTowLjkyNzk2NjEwMTY5NDkxNTJ9LHt4OjAuMTA5NDkxNTI1NDIzNzI4ODIsIHk6MC45NTUwODQ3NDU3NjI3MTE5fSx7eDowLjExMzcyODgxMzU1OTMyMjAzLCB5OjAuOTcxMTg2NDQwNjc3OTY2MX0se3g6MC4xMjMwNTA4NDc0NTc2MjcxMSwgeTowLjk3ODgxMzU1OTMyMjAzMzh9LHt4OjAuMTQxNjk0OTE1MjU0MjM3MjcsIHk6MC45ODIyMDMzODk4MzA1MDg1fSx7eDowLjE2OTY2MTAxNjk0OTE1MjUzLCB5OjAuOTgzMDUwODQ3NDU3NjI3Mn0se3g6MC4xOTUwODQ3NDU3NjI3MTE5LCB5OjAuOTgzMDUwODQ3NDU3NjI3Mn0se3g6MC4yMjM4OTgzMDUwODQ3NDU3OSwgeTowLjk4MDUwODQ3NDU3NjI3MTJ9LHt4OjAuMjQ1OTMyMjAzMzg5ODMwNTIsIHk6MC45ODA1MDg0NzQ1NzYyNzEyfSx7eDowLjI1ODY0NDA2Nzc5NjYxMDIsIHk6MC45ODM4OTgzMDUwODQ3NDU3fSx7eDowLjI2NDU3NjI3MTE4NjQ0MDY3LCB5OjAuOTg4OTgzMDUwODQ3NDU3Nn0se3g6MC4yNzA1MDg0NzQ1NzYyNzEyLCB5OjEuMDAxNjk0OTE1MjU0MjM3NH0se3g6MC4yNzMwNTA4NDc0NTc2MjcxNCwgeToxLjAyNDU3NjI3MTE4NjQ0MDZ9LHt4OjAuMjc3Mjg4MTM1NTkzMjIwMzUsIHk6MS4wNDE1MjU0MjM3Mjg4MTM2fSx7eDowLjI4NTc2MjcxMTg2NDQwNjc3LCB5OjEuMDQ3NDU3NjI3MTE4NjQ0fSx7eDowLjMwNDQwNjc3OTY2MTAxNywgeToxLjA1fSx7eDowLjM0ODQ3NDU3NjI3MTE4NjQ0LCB5OjEuMDQ5MTUyNTQyMzcyODgxNH0se3g6MC4zODA2Nzc5NjYxMDE2OTQ5LCB5OjEuMDQ5MTUyNTQyMzcyODgxNH0se3g6MC40MDg2NDQwNjc3OTY2MTAyLCB5OjEuMDQ5MTUyNTQyMzcyODgxNH0se3g6MC40MjEzNTU5MzIyMDMzODk4NSwgeToxLjA1NTkzMjIwMzM4OTgzMDR9LHt4OjAuNDI4OTgzMDUwODQ3NDU3NywgeToxLjA2Njk0OTE1MjU0MjM3Mjl9LHt4OjAuNDMwNjc3OTY2MTAxNjk0OTUsIHk6MS4wODgxMzU1OTMyMjAzMzl9LHt4OjAuNDI4OTgzMDUwODQ3NDU3NywgeToxLjExNDQwNjc3OTY2MTAxNjl9LHt4OjAuNDI4MTM1NTkzMjIwMzM5LCB5OjEuMTU1OTMyMjAzMzg5ODMwNX0se3g6MC40MzIzNzI4ODEzNTU5MzIyLCB5OjEuMTkwNjc3OTY2MTAxNjk0OX0se3g6MC40Mjk4MzA1MDg0NzQ1NzYyNywgeToxLjIwNTkzMjIwMzM4OTgzMDV9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuNDEwMTY5NDkxNTI1NDIzNywgeToxLjE4ODEzNTU5MzIyMDMzOX0se3g6MC4zODIyMDMzODk4MzA1MDg1LCB5OjEuMjEwMTY5NDkxNTI1NDIzN30se3g6MC4zNzU0MjM3Mjg4MTM1NTkzNCwgeToxLjI1NTA4NDc0NTc2MjcxMn0se3g6MC4zOTE1MjU0MjM3Mjg4MTM1NSwgeToxLjI5MjM3Mjg4MTM1NTkzMjN9LHt4OjAuNDM3Mjg4MTM1NTkzMjIwMzMsIHk6MS4zMTUyNTQyMzcyODgxMzU1fSx7eDowLjQ3NDU3NjI3MTE4NjQ0MDcsIHk6MS4zMDY3Nzk2NjEwMTY5NDl9LHt4OjAuNSwgeToxLjI3NjI3MTE4NjQ0MDY3OH0se3g6MC41MDU5MzIyMDMzODk4MzA1LCB5OjEuMjMzMDUwODQ3NDU3NjI3Mn0se3g6MC40Njc3OTY2MTAxNjk0OTE1MywgeToxLjE4Mzg5ODMwNTA4NDc0NTh9KSxcbiAgbmV3IEFycmF5KHt4OjAuNDYwMTY5NDkxNTI1NDIzNzUsIHk6MS4yMzcyODgxMzU1OTMyMjA0fSx7eDowLjQ3NjI3MTE4NjQ0MDY3Nzk1LCB5OjEuMjU4NDc0NTc2MjcxMTg2NH0se3g6MC40NzI4ODEzNTU5MzIyMDM0LCB5OjEuMzAwODQ3NDU3NjI3MTE4N30se3g6MC40MjAzMzg5ODMwNTA4NDc0NCwgeToxLjMwODQ3NDU3NjI3MTE4NjV9LHt4OjAuMzg4MTM1NTkzMjIwMzM4OTcsIHk6MS4yNjg2NDQwNjc3OTY2MTAyfSx7eDowLjQwNDIzNzI4ODEzNTU5MzIzLCB5OjEuMjM4MTM1NTkzMjIwMzM5fSx7eDowLjQ1MDg0NzQ1NzYyNzExODY0LCB5OjEuMjYyNzExODY0NDA2Nzc5Nn0se3g6MC40OTQ5MTUyNTQyMzcyODgxNiwgeToxLjI0NDkxNTI1NDIzNzI4OH0se3g6MC41MDg0NzQ1NzYyNzExODY0LCB5OjEuMjE1MjU0MjM3Mjg4MTM1Nn0se3g6MC40Nzk2NjEwMTY5NDkxNTI1MywgeToxLjE4MTM1NTkzMjIwMzM4OTd9KSxcbiAgbmV3IEFycmF5KHt4OjAuNDEyNzExODY0NDA2Nzc5NjUsIHk6MS4xOTIzNzI4ODEzNTU5MzIyfSx7eDowLjQ3Mjg4MTM1NTkzMjIwMzQsIHk6MS4yfSx7eDowLjUwNTkzMjIwMzM4OTgzMDUsIHk6MS4yNDgzMDUwODQ3NDU3NjI2fSx7eDowLjUwMzM4OTgzMDUwODQ3NDUsIHk6MS4yOTQ5MTUyNTQyMzcyODgxfSx7eDowLjQzNzI4ODEzNTU5MzIyMDMzLCB5OjEuM30se3g6MC4zODU1OTMyMjAzMzg5ODMxLCB5OjEuMjg0NzQ1NzYyNzExODY0NH0se3g6MC4zNzYyNzExODY0NDA2NzgsIHk6MS4yNDIzNzI4ODEzNTU5MzIzfSx7eDowLjQyMzcyODgxMzU1OTMyMiwgeToxLjI0NzQ1NzYyNzExODY0NDJ9LHt4OjAuNDY1MjU0MjM3Mjg4MTM1NiwgeToxLjIxOTQ5MTUyNTQyMzcyODl9LHt4OjAuNDE2OTQ5MTUyNTQyMzcyODYsIHk6MS4xODcyODgxMzU1OTMyMjAzfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTggPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjQ4NzQ1NzYyNzExODY0NDA0LCB5OjEuMjUwODQ3NDU3NjI3MTE4N30se3g6MC41MDg2NDQwNjc3OTY2MTAyLCB5OjEuMjUwODQ3NDU3NjI3MTE4N30se3g6MC41MzIzNzI4ODEzNTU5MzIyLCB5OjEuMjQ5MTUyNTQyMzcyODgxM30se3g6MC41NDI1NDIzNzI4ODEzNTYsIHk6MS4yNTE2OTQ5MTUyNTQyMzc0fSx7eDowLjU0OTMyMjAzMzg5ODMwNTEsIHk6MS4yNTg0NzQ1NzYyNzExODY0fSx7eDowLjU1MTg2NDQwNjc3OTY2MSwgeToxLjI3MTE4NjQ0MDY3Nzk2Nn0se3g6MC41NTE4NjQ0MDY3Nzk2NjEsIHk6MS4yODU1OTMyMjAzMzg5ODN9LHt4OjAuNTUxODY0NDA2Nzc5NjYxLCB5OjEuMzEzNTU5MzIyMDMzODk4NH0se3g6MC41NTE4NjQ0MDY3Nzk2NjEsIHk6MS4zNDMyMjAzMzg5ODMwNTA4fSx7eDowLjU1NjEwMTY5NDkxNTI1NDMsIHk6MS4zNTA4NDc0NTc2MjcxMTg2fSx7eDowLjU2MjAzMzg5ODMwNTA4NDgsIHk6MS4zNjQ0MDY3Nzk2NjEwMTY5fSx7eDowLjU3NzI4ODEzNTU5MzIyMDMsIHk6MS4zNjg2NDQwNjc3OTY2MX0se3g6MC41OTU5MzIyMDMzODk4MzA2LCB5OjEuMzY5NDkxNTI1NDIzNzI4OH0se3g6MC42MTAzMzg5ODMwNTA4NDc0LCB5OjEuMzY1MjU0MjM3Mjg4MTM1Nn0se3g6MC42MjA1MDg0NzQ1NzYyNzEyLCB5OjEuMzU4NDc0NTc2MjcxMTg2NX0se3g6MC42MjU1OTMyMjAzMzg5ODMsIHk6MS4zNDU3NjI3MTE4NjQ0MDY5fSx7eDowLjYyODEzNTU5MzIyMDMzOSwgeToxLjMxOTQ5MTUyNTQyMzcyODd9LHt4OjAuNjI3Mjg4MTM1NTkzMjIwNCwgeToxLjI5NTc2MjcxMTg2NDQwNjh9LHt4OjAuNjI0NzQ1NzYyNzExODY0NCwgeToxLjI2NjEwMTY5NDkxNTI1NDF9LHt4OjAuNjIzODk4MzA1MDg0NzQ1OCwgeToxLjIzODEzNTU5MzIyMDMzOX0se3g6MC42Mjg5ODMwNTA4NDc0NTc2LCB5OjEuMjI3MTE4NjQ0MDY3Nzk2Nn0se3g6MC42MjcyODgxMzU1OTMyMjA0LCB5OjEuMjEzNTU5MzIyMDMzODk4M30se3g6MC42MjU1OTMyMjAzMzg5ODMsIHk6MS4yMDE2OTQ5MTUyNTQyMzczfSx7eDowLjYyODk4MzA1MDg0NzQ1NzYsIHk6MS4xOTQwNjc3OTY2MTAxNjk2fSx7eDowLjYzODMwNTA4NDc0NTc2MjgsIHk6MS4xODcyODgxMzU1OTMyMjAzfSx7eDowLjY2OTY2MTAxNjk0OTE1MjYsIHk6MS4xODg5ODMwNTA4NDc0NTc3fSx7eDowLjY5NTkzMjIwMzM4OTgzMDUsIHk6MS4xODcyODgxMzU1OTMyMjAzfSx7eDowLjcxODgxMzU1OTMyMjAzNCwgeToxLjE4NjQ0MDY3Nzk2NjEwMTZ9LHt4OjAuNzMzMjIwMzM4OTgzMDUwOCwgeToxLjE5MjM3Mjg4MTM1NTkzMjJ9LHt4OjAuNzM0OTE1MjU0MjM3Mjg4MSwgeToxLjIwNDIzNzI4ODEzNTU5MzJ9LHt4OjAuNzM0OTE1MjU0MjM3Mjg4MSwgeToxLjIyMjAzMzg5ODMwNTA4NDd9LHt4OjAuNzMxNTI1NDIzNzI4ODEzNiwgeToxLjI2MDE2OTQ5MTUyNTQyMzh9LHt4OjAuNzMwNjc3OTY2MTAxNjk0OSwgeToxLjI5NDA2Nzc5NjYxMDE2OTV9LHt4OjAuNzMzMjIwMzM4OTgzMDUwOCwgeToxLjMxMDE2OTQ5MTUyNTQyMzh9LHt4OjAuNzM0OTE1MjU0MjM3Mjg4MSwgeToxLjMzOTgzMDUwODQ3NDU3NjN9LHt4OjAuNzQwODQ3NDU3NjI3MTE4NywgeToxLjM1NzYyNzExODY0NDA2Nzh9LHt4OjAuNzU2MTAxNjk0OTE1MjU0MywgeToxLjM2MzU1OTMyMjAzMzg5ODR9LHt4OjAuNzg5MTUyNTQyMzcyODgxMywgeToxLjM2NDQwNjc3OTY2MTAxNjl9LHt4OjAuODEzNzI4ODEzNTU5MzIyLCB5OjEuMzYzNTU5MzIyMDMzODk4NH0se3g6MC44MjIyMDMzODk4MzA1MDg0LCB5OjEuMzYxODY0NDA2Nzc5NjYxfSx7eDowLjgzMTUyNTQyMzcyODgxMzYsIHk6MS4zNjc3OTY2MTAxNjk0OTE2fSx7eDowLjg0LCB5OjEuMzgwNTA4NDc0NTc2MjcxMn0se3g6MC44NDE2OTQ5MTUyNTQyMzczLCB5OjEuNDAyNTQyMzcyODgxMzU2fSx7eDowLjgzOTE1MjU0MjM3Mjg4MTQsIHk6MS40Mjk2NjEwMTY5NDkxNTI2fSx7eDowLjg0MTY5NDkxNTI1NDIzNzMsIHk6MS40NTQyMzcyODgxMzU1OTMyfSx7eDowLjgzNzQ1NzYyNzExODY0NDEsIHk6MS40OTE1MjU0MjM3Mjg4MTM2fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTkgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjgwOTQyMzcyODgxMzU1OTMsIHk6MS41MTgwNTkzMjIwMzM4OTgzfSx7eDowLjgyODA2Nzc5NjYxMDE2OTUsIHk6MS41NDE3ODgxMzU1OTMyMjA0fSx7eDowLjg1OTQyMzcyODgxMzU1OTMsIHk6MS41NTUzNDc0NTc2MjcxMTg3fSx7eDowLjg3OTc2MjcxMTg2NDQwNjgsIHk6MS41NDA5NDA2Nzc5NjYxMDE3fSx7eDowLjg4NDg0NzQ1NzYyNzExODYsIHk6MS41MjY1MzM4OTgzMDUwODQ3fSx7eDowLjg3NzIyMDMzODk4MzA1MDksIHk6MS41MDcwNDIzNzI4ODEzNTU4fSx7eDowLjg1NzcyODgxMzU1OTMyMjEsIHk6MS40OTA5NDA2Nzc5NjYxMDE2fSksXG4gIG5ldyBBcnJheSh7eDowLjg2Nzg5ODMwNTA4NDc0NTcsIHk6MS41MzkyNDU3NjI3MTE4NjQzfSx7eDowLjg3NTUyNTQyMzcyODgxMzYsIHk6MS41MjU2ODY0NDA2Nzc5NjZ9LHt4OjAuODU1MTg2NDQwNjc3OTY2MSwgeToxLjUxNDY2OTQ5MTUyNTQyMzd9LHt4OjAuODM2NTQyMzcyODgxMzU1OSwgeToxLjUxNDY2OTQ5MTUyNTQyMzd9LHt4OjAuODI0Njc3OTY2MTAxNjk0OSwgeToxLjUyODIyODgxMzU1OTMyMn0se3g6MC44MTUzNTU5MzIyMDMzODk5LCB5OjEuNTM3NTUwODQ3NDU3NjI3Mn0se3g6MC44MDM0OTE1MjU0MjM3Mjg4LCB5OjEuNTI0ODM4OTgzMDUwODQ3M30se3g6MC44MDg1NzYyNzExODY0NDA3LCB5OjEuNDk3NzIwMzM4OTgzMDUxfSx7eDowLjgzMTQ1NzYyNzExODY0NCwgeToxLjQ5MDA5MzIyMDMzODk4M30se3g6MC44NTYwMzM4OTgzMDUwODQ3LCB5OjEuNTAyODA1MDg0NzQ1NzYyNn0pLFxuICBuZXcgQXJyYXkoe3g6MC44NDUwMTY5NDkxNTI1NDIzLCB5OjEuNDg0MTYxMDE2OTQ5MTUyNn0se3g6MC44NTYwMzM4OTgzMDUwODQ3LCB5OjEuNTAxOTU3NjI3MTE4NjQ0MX0se3g6MC44NjYyMDMzODk4MzA1MDg1LCB5OjEuNTIxNDQ5MTUyNTQyMzcyOH0se3g6MC44NjcwNTA4NDc0NTc2MjcxLCB5OjEuNTM1MDA4NDc0NTc2MjcxfSx7eDowLjg1MDk0OTE1MjU0MjM3MjksIHk6MS41NDE3ODgxMzU1OTMyMjA0fSx7eDowLjgyNzIyMDMzODk4MzA1MDgsIHk6MS41MzU4NTU5MzIyMDMzODk4fSx7eDowLjgwNzcyODgxMzU1OTMyMiwgeToxLjUyMDYwMTY5NDkxNTI1NH0se3g6MC44MTAyNzExODY0NDA2NzgsIHk6MS41MDQ1fSx7eDowLjgzMzE1MjU0MjM3Mjg4MTQsIHk6MS41MDI4MDUwODQ3NDU3NjI2fSx7eDowLjg1MDk0OTE1MjU0MjM3MjksIHk6MS41MTU1MTY5NDkxNTI1NDI0fSx7eDowLjg3MzgzMDUwODQ3NDU3NjIsIHk6MS41MTI5NzQ1NzYyNzExODY0fSx7eDowLjg3MDQ0MDY3Nzk2NjEwMTcsIHk6MS41MDAyNjI3MTE4NjQ0MDY3fSx7eDowLjg1NTE4NjQ0MDY3Nzk2NjEsIHk6MS40OTE3ODgxMzU1OTMyMjAzfSx7eDowLjg0MzMyMjAzMzg5ODMwNTEsIHk6MS40ODMzMTM1NTkzMjIwMzR9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTAgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjgzNjYxMDE2OTQ5MTUyNTQsIHk6MS41MTg2NDQwNjc3OTY2MTAyfSx7eDowLjg0Njc3OTY2MTAxNjk0OTEsIHk6MS41MjQ1NzYyNzExODY0NDA2fSx7eDowLjg0NDIzNzI4ODEzNTU5MzMsIHk6MS41NDQwNjc3OTY2MTAxNjk1fSx7eDowLjg0MTY5NDkxNTI1NDIzNzMsIHk6MS41ODA1MDg0NzQ1NzYyNzEyfSx7eDowLjgzODMwNTA4NDc0NTc2MjcsIHk6MS42MTE4NjQ0MDY3Nzk2NjF9LHt4OjAuODQ0MjM3Mjg4MTM1NTkzMywgeToxLjYzNzI4ODEzNTU5MzIyMDN9LHt4OjAuODQxNjk0OTE1MjU0MjM3MywgeToxLjY1ODQ3NDU3NjI3MTE4NjZ9LHt4OjAuODQ1OTMyMjAzMzg5ODMwNiwgeToxLjY4NTU5MzIyMDMzODk4M30se3g6MC44NDUwODQ3NDU3NjI3MTE5LCB5OjEuNzExMDE2OTQ5MTUyNTQyNH0se3g6MC44NDQyMzcyODgxMzU1OTMzLCB5OjEuNzI5NjYxMDE2OTQ5MTUyNn0se3g6MC44NDE2OTQ5MTUyNTQyMzczLCB5OjEuNzU2Nzc5NjYxMDE2OTQ5fSx7eDowLjgzOTE1MjU0MjM3Mjg4MTQsIHk6MS43NzU0MjM3Mjg4MTM1NTkzfSx7eDowLjg0Njc3OTY2MTAxNjk0OTEsIHk6MS43OTMyMjAzMzg5ODMwNTA4fSx7eDowLjg0Njc3OTY2MTAxNjk0OTEsIHk6MS44MDU5MzIyMDMzODk4MzA0fSx7eDowLjg0Njc3OTY2MTAxNjk0OTEsIHk6MS44MjIwMzM4OTgzMDUwODQ4fSx7eDowLjg0NTA4NDc0NTc2MjcxMTksIHk6MS44NDkxNTI1NDIzNzI4ODE0fSx7eDowLjg0MjU0MjM3Mjg4MTM1NTksIHk6MS44NjYxMDE2OTQ5MTUyNTQyfSx7eDowLjg0MzM4OTgzMDUwODQ3NDYsIHk6MS44ODIyMDMzODk4MzA1MDg0fSx7eDowLjg0NDIzNzI4ODEzNTU5MzMsIHk6MS44OTQ5MTUyNTQyMzcyODgyfSx7eDowLjg0LCB5OjEuOTA1OTMyMjAzMzg5ODMwNX0se3g6MC44MjgxMzU1OTMyMjAzMzksIHk6MS45MTE4NjQ0MDY3Nzk2NjF9LHt4OjAuODEzNzI4ODEzNTU5MzIyLCB5OjEuOTEyNzExODY0NDA2Nzc5OH0se3g6MC43OTc2MjcxMTg2NDQwNjc4LCB5OjEuOTE0NDA2Nzc5NjYxMDE3fSx7eDowLjc4NDkxNTI1NDIzNzI4ODEsIHk6MS45MjExODY0NDA2Nzc5NjYyfSx7eDowLjc3ODk4MzA1MDg0NzQ1NzcsIHk6MS45MzU1OTMyMjAzMzg5ODN9LHt4OjAuNzc3Mjg4MTM1NTkzMjIwMywgeToxLjk1MjU0MjM3Mjg4MTM1Nn0se3g6MC43Nzk4MzA1MDg0NzQ1NzYyLCB5OjIuMDA2Nzc5NjYxMDE2OTQ5fSx7eDowLjc3NDc0NTc2MjcxMTg2NDUsIHk6Mi4wODMwNTA4NDc0NTc2MjczfSx7eDowLjc3NzI4ODEzNTU5MzIyMDMsIHk6Mi4xMTg2NDQwNjc3OTY2MTAzfSx7eDowLjc3NjQ0MDY3Nzk2NjEwMTcsIHk6Mi4xMzY0NDA2Nzc5NjYxMDJ9LHt4OjAuNzY0NTc2MjcxMTg2NDQwNywgeToyLjE0NDkxNTI1NDIzNzI4ODJ9LHt4OjAuNzQ1MDg0NzQ1NzYyNzExOSwgeToyLjE0NzQ1NzYyNzExODY0NH0se3g6MC43MzQ5MTUyNTQyMzcyODgxLCB5OjIuMTQ0OTE1MjU0MjM3Mjg4Mn0se3g6MC43MzA2Nzc5NjYxMDE2OTQ5LCB5OjIuMTM4OTgzMDUwODQ3NDU3NH0se3g6MC43MjIyMDMzODk4MzA1MDg1LCB5OjIuMTUwODQ3NDU3NjI3MTE4Nn0se3g6MC43MTg4MTM1NTkzMjIwMzQsIHk6Mi4xMzcyODgxMzU1OTMyMjA1fSx7eDowLjcxMjAzMzg5ODMwNTA4NDgsIHk6Mi4xNTI1NDIzNzI4ODEzNTZ9LHt4OjAuNzA3Nzk2NjEwMTY5NDkxNiwgeToyLjEzODk4MzA1MDg0NzQ1NzR9LHt4OjAuNzAxMDE2OTQ5MTUyNTQyNCwgeToyLjE1MDg0NzQ1NzYyNzExODZ9LHt4OjAuNjk1OTMyMjAzMzg5ODMwNSwgeToyLjEzNzI4ODEzNTU5MzIyMDV9LHt4OjAuNjkwMDAwMDAwMDAwMDAwMSwgeToyLjE1MzM4OTgzMDUwODQ3NDd9LHt4OjAuNjg1NzYyNzExODY0NDA2NywgeToyLjEzNjQ0MDY3Nzk2NjEwMn0se3g6MC42ODA2Nzc5NjYxMDE2OTUsIHk6Mi4xNTA4NDc0NTc2MjcxMTg2fSx7eDowLjY3NjQ0MDY3Nzk2NjEwMTcsIHk6Mi4xMzY0NDA2Nzc5NjYxMDJ9LHt4OjAuNjY3OTY2MTAxNjk0OTE1MiwgeToyLjE1MjU0MjM3Mjg4MTM1Nn0se3g6MC42NjQ1NzYyNzExODY0NDA3LCB5OjIuMTM3Mjg4MTM1NTkzMjIwNX0se3g6MC42NTM1NTkzMjIwMzM4OTgzLCB5OjIuMTQ1NzYyNzExODY0NDA3fSx7eDowLjYzMzIyMDMzODk4MzA1MDksIHk6Mi4xNDY2MTAxNjk0OTE1MjU2fSx7eDowLjYxODgxMzU1OTMyMjAzMzksIHk6Mi4xNDMyMjAzMzg5ODMwNTF9LHt4OjAuNjEyMDMzODk4MzA1MDg0OCwgeToyLjEyOTY2MTAxNjk0OTE1MjN9LHt4OjAuNjEyMDMzODk4MzA1MDg0OCwgeToyLjExNjEwMTY5NDkxNTI1NDJ9LHt4OjAuNjAxODY0NDA2Nzc5NjYxLCB5OjIuMDk2NjEwMTY5NDkxNTI1M30se3g6MC41OTQyMzcyODgxMzU1OTMzLCB5OjIuMDkwNjc3OTY2MTAxNjk1fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC41ODIzMDUwODQ3NDU3NjI3LCB5OjIuMTA0NTAwMDAwMDAwMDAwM30se3g6MC41NjYyMDMzODk4MzA1MDg0LCB5OjIuMTAwMjYyNzExODY0NDA3fSx7eDowLjU2NzA1MDg0NzQ1NzYyNzEsIHk6Mi4wOTI2MzU1OTMyMjAzMzl9LHt4OjAuNTg3Mzg5ODMwNTA4NDc0NiwgeToyLjA4NjcwMzM4OTgzMDUwODd9LHt4OjAuNjE0NTA4NDc0NTc2MjcxMiwgeToyLjA3NjUzMzg5ODMwNTA4NX0se3g6MC42MzMxNTI1NDIzNzI4ODEzLCB5OjIuMDc0ODM4OTgzMDUwODQ3Nn0se3g6MC42MzY1NDIzNzI4ODEzNTYsIHk6Mi4wODU4NTU5MzIyMDMzOX0se3g6MC42MjEyODgxMzU1OTMyMjAzLCB5OjIuMDk3NzIwMzM4OTgzMDUxfSx7eDowLjU5MTYyNzExODY0NDA2NzgsIHk6Mi4xMDI4MDUwODQ3NDU3NjN9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTIgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjU5ODM4OTgzMDUwODQ3NDYsIHk6Mi4wOTQwNjc3OTY2MTAxNjkzfSx7eDowLjYwOTQwNjc3OTY2MTAxNywgeToyLjEwMDg0NzQ1NzYyNzExODh9LHt4OjAuNjE5NTc2MjcxMTg2NDQwNywgeToyLjEyMDMzODk4MzA1MDg0Nzd9LHt4OjAuNjE5NTc2MjcxMTg2NDQwNywgeToyLjEzMzA1MDg0NzQ1NzYyN30se3g6MC42MjU1MDg0NzQ1NzYyNzEyLCB5OjIuMTQ0MDY3Nzk2NjEwMTY5Nn0se3g6MC42NDUsIHk6Mi4xNDU3NjI3MTE4NjQ0MDd9LHt4OjAuNjYyNzk2NjEwMTY5NDkxNSwgeToyLjE0OTE1MjU0MjM3Mjg4MTJ9LHt4OjAuNjYzNjQ0MDY3Nzk2NjEwMiwgeToyLjE2NTI1NDIzNzI4ODEzNTR9LHt4OjAuNjYwMjU0MjM3Mjg4MTM1NiwgeToyLjE4NDc0NTc2MjcxMTg2NDN9LHt4OjAuNjUyNjI3MTE4NjQ0MDY3OSwgeToyLjIwNTkzMjIwMzM4OTgzMDV9LHt4OjAuNjM0ODMwNTA4NDc0NTc2MywgeToyLjIxMDE2OTQ5MTUyNTQyMzV9LHt4OjAuNjAzNDc0NTc2MjcxMTg2NSwgeToyLjIxMDE2OTQ5MTUyNTQyMzV9LHt4OjAuNTU2MDE2OTQ5MTUyNTQyNCwgeToyLjIwOTMyMjAzMzg5ODMwNTN9LHt4OjAuNTE5NTc2MjcxMTg2NDQwNywgeToyLjIxMjcxMTg2NDQwNjc3OTZ9LHt4OjAuNDgxNDQwNjc3OTY2MTAxNywgeToyLjIxMjcxMTg2NDQwNjc3OTZ9LHt4OjAuNDM5OTE1MjU0MjM3Mjg4MTcsIHk6Mi4yMTEwMTY5NDkxNTI1NDJ9LHt4OjAuNDE2MTg2NDQwNjc3OTY2MiwgeToyLjIwNjc3OTY2MTAxNjk0OTJ9LHt4OjAuNDA0MzIyMDMzODk4MzA1MSwgeToyLjE5OTE1MjU0MjM3Mjg4MTV9LHt4OjAuMzk3NTQyMzcyODgxMzU1OTcsIHk6Mi4xODEzNTU5MzIyMDMzOX0se3g6MC4zOTc1NDIzNzI4ODEzNTU5NywgeToyLjE1NDIzNzI4ODEzNTU5MzN9LHt4OjAuNDAwMDg0NzQ1NzYyNzExOSwgeToyLjEyNzExODY0NDA2Nzc5Njd9LHt4OjAuNDAwMDg0NzQ1NzYyNzExOSwgeToyLjExMDE2OTQ5MTUyNTQyNH0se3g6MC4zODU2Nzc5NjYxMDE2OTQ5LCB5OjIuMTAyNTQyMzcyODgxMzU2fSx7eDowLjM3Mjk2NjEwMTY5NDkxNTMsIHk6Mi4xMTEwMTY5NDkxNTI1NDI2fSx7eDowLjM2ODcyODgxMzU1OTMyMjEsIHk6Mi4wOTY2MTAxNjk0OTE1MjUzfSx7eDowLjM2MTEwMTY5NDkxNTI1NDIzLCB5OjIuMTExMDE2OTQ5MTUyNTQyNn0se3g6MC4zNDkyMzcyODgxMzU1OTMyNCwgeToyLjA5NTc2MjcxMTg2NDQwNjd9LHt4OjAuMzQ5MjM3Mjg4MTM1NTkzMjQsIHk6Mi4xMTAxNjk0OTE1MjU0MjR9LHt4OjAuMzM2NTI1NDIzNzI4ODEzNTYsIHk6Mi4wOTY2MTAxNjk0OTE1MjUzfSx7eDowLjMyOTc0NTc2MjcxMTg2NDQsIHk6Mi4xMTI3MTE4NjQ0MDY3Nzk1fSx7eDowLjMyNDY2MTAxNjk0OTE1MjU2LCB5OjIuMDk2NjEwMTY5NDkxNTI1M30se3g6MC4zMTcwMzM4OTgzMDUwODQ3NywgeToyLjEwNzYyNzExODY0NDA2OH0se3g6MC4zMTAyNTQyMzcyODgxMzU2LCB5OjIuMTAyNTQyMzcyODgxMzU2fSx7eDowLjMwNDMyMjAzMzg5ODMwNTEsIHk6Mi4xMDU5MzIyMDMzODk4MzA0fSx7eDowLjI5NjY5NDkxNTI1NDIzNzMsIHk6Mi4xMTM1NTkzMjIwMzM4OTh9LHt4OjAuMjk1ODQ3NDU3NjI3MTE4NjcsIHk6Mi4xMzA1MDg0NzQ1NzYyNzF9LHt4OjAuMjk1ODQ3NDU3NjI3MTE4NjcsIHk6Mi4xNTA4NDc0NTc2MjcxMTg2fSx7eDowLjI4NzM3Mjg4MTM1NTkzMjIsIHk6Mi4xNjE4NjQ0MDY3Nzk2NjF9LHt4OjAuMjY1MzM4OTgzMDUwODQ3NDcsIHk6Mi4xNjQ0MDY3Nzk2NjEwMTd9LHt4OjAuMjMyMjg4MTM1NTkzMjIwMzcsIHk6Mi4xNjQ0MDY3Nzk2NjEwMTd9LHt4OjAuMjA5NDA2Nzc5NjYxMDE2OTUsIHk6Mi4xNjYxMDE2OTQ5MTUyNTR9LHt4OjAuMTc1NTA4NDc0NTc2MjcxMjIsIHk6Mi4xNjc3OTY2MTAxNjk0OTE0fSx7eDowLjEzNzM3Mjg4MTM1NTkzMjIzLCB5OjIuMTY0NDA2Nzc5NjYxMDE3fSx7eDowLjEwNDMyMjAzMzg5ODMwNTA5LCB5OjIuMTY2MTAxNjk0OTE1MjU0fSx7eDowLjA4NDgzMDUwODQ3NDU3NjI4LCB5OjIuMTY4NjQ0MDY3Nzk2NjF9LHt4OjAuMDc1NTA4NDc0NTc2MjcxMiwgeToyLjE4NDc0NTc2MjcxMTg2NDN9LHt4OjAuMDc1NTA4NDc0NTc2MjcxMiwgeToyLjIwNTkzMjIwMzM4OTgzMDV9LHt4OjAuMDc1NTA4NDc0NTc2MjcxMiwgeToyLjIyODgxMzU1OTMyMjAzMzd9LHt4OjAuMDczODEzNTU5MzIyMDMzOTEsIHk6Mi4yNTUwODQ3NDU3NjI3MTE3fSx7eDowLjA3MzgxMzU1OTMyMjAzMzkxLCB5OjIuMjc3OTY2MTAxNjk0OTE1M30se3g6MC4wNzU1MDg0NzQ1NzYyNzEyLCB5OjIuMjkyMzcyODgxMzU1OTMyfSx7eDowLjA3Mjk2NjEwMTY5NDkxNTI2LCB5OjIuMzE5NDkxNTI1NDIzNzI4N30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMDU0MzM4OTgzMDUwODQ3NDYsIHk6Mi4zNjk3NTQyMzcyODgxMzU3fSx7eDowLjA1MzQ5MTUyNTQyMzcyODgxNCwgeToyLjQxMjEyNzExODY0NDA2OH0se3g6MC4wNjg3NDU3NjI3MTE4NjQ0LCB5OjIuNDMwNzcxMTg2NDQwNjc4fSx7eDowLjA4NDg0NzQ1NzYyNzExODY1LCB5OjIuNDI4MjI4ODEzNTU5MzIyNH0se3g6MC4wOTE2MjcxMTg2NDQwNjc3OSwgeToyLjQwMTExMDE2OTQ5MTUyNn0se3g6MC4wODk5MzIyMDMzODk4MzA1LCB5OjIuMzcyMjk2NjEwMTY5NDkyfSx7eDowLjA3MzgzMDUwODQ3NDU3NjI3LCB5OjIuMzM5MjQ1NzYyNzExODY1fSx7eDowLjA2NDUwODQ3NDU3NjI3MTE4LCB5OjIuMzE4OTA2Nzc5NjYxMDE3fSx7eDowLjA2MDI3MTE4NjQ0MDY3Nzk3LCB5OjIuMzQ3NzIwMzM4OTgzMDUxfSksXG4gIG5ldyBBcnJheSh7eDowLjA2OTU5MzIyMDMzODk4MzA1LCB5OjIuMzQ1MTc3OTY2MTAxNjk1fSx7eDowLjA4MjMwNTA4NDc0NTc2MjcyLCB5OjIuMzU3ODg5ODMwNTA4NDc0Nn0se3g6MC4wODY1NDIzNzI4ODEzNTU5MywgeToyLjM4MjQ2NjEwMTY5NDkxNTZ9LHt4OjAuMDcyOTgzMDUwODQ3NDU3NjMsIHk6Mi4zOTc3MjAzMzg5ODMwNTF9LHt4OjAuMDYwMjcxMTg2NDQwNjc3OTcsIHk6Mi40MTA0MzIyMDMzODk4MzF9LHt4OjAuMDUzNDkxNTI1NDIzNzI4ODE0LCB5OjIuNDIyMjk2NjEwMTY5NDkxNn0se3g6MC4wNjk1OTMyMjAzMzg5ODMwNSwgeToyLjQzNzU1MDg0NzQ1NzYyN30se3g6MC4wODMxNTI1NDIzNzI4ODEzNiwgeToyLjQzNTg1NTkzMjIwMzM5fSx7eDowLjA4NzM4OTgzMDUwODQ3NDU3LCB5OjIuNDI4MjI4ODEzNTU5MzIyNH0se3g6MC4wODgyMzcyODgxMzU1OTMyMSwgeToyLjQxMDQzMjIwMzM4OTgzMX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNCA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMDc0NzQ1NzYyNzExODY0NDEsIHk6Mi4zMjU0MjM3Mjg4MTM1NTk1fSx7eDowLjA5MTY5NDkxNTI1NDIzNzMsIHk6Mi4zMjU0MjM3Mjg4MTM1NTk1fSx7eDowLjExMTE4NjQ0MDY3Nzk2NjExLCB5OjIuMzIxMTg2NDQwNjc3OTY2fSx7eDowLjExODgxMzU1OTMyMjAzMzksIHk6Mi4zMjExODY0NDA2Nzc5NjZ9LHt4OjAuMTI2NDQwNjc3OTY2MTAxNywgeToyLjMyMjg4MTM1NTkzMjIwMzV9LHt4OjAuMTI5ODMwNTA4NDc0NTc2MjgsIHk6Mi4zMjcxMTg2NDQwNjc3OTY0fSx7eDowLjEyOTgzMDUwODQ3NDU3NjI4LCB5OjIuMzM0NzQ1NzYyNzExODY0Nn0se3g6MC4xMjg5ODMwNTA4NDc0NTc2NSwgeToyLjM0ODMwNTA4NDc0NTc2Mjd9LHt4OjAuMTIzMDUwODQ3NDU3NjI3MTEsIHk6Mi4zNzAzMzg5ODMwNTA4NDc3fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE1ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMjk3NjI3MTE4NjQ0MDY4LCB5OjIuMzYyOTc0NTc2MjcxMTg2N30se3g6MC4xMTk1OTMyMjAzMzg5ODMwNSwgeToyLjM3MTQ0OTE1MjU0MjM3M30se3g6MC4xMTI4MTM1NTkzMjIwMzM5LCB5OjIuMzg5MjQ1NzYyNzExODY0Nn0se3g6MC4xMTYyMDMzODk4MzA1MDg0NywgeToyLjQyMjI5NjYxMDE2OTQ5MTZ9LHt4OjAuMTE2MjAzMzg5ODMwNTA4NDcsIHk6Mi40NDM0ODMwNTA4NDc0NTh9LHt4OjAuMTA5NDIzNzI4ODEzNTU5MzIsIHk6Mi40NjQ2Njk0OTE1MjU0MjM3fSx7eDowLjExNjIwMzM4OTgzMDUwODQ3LCB5OjIuNDkwMDkzMjIwMzM4OTgzNH0se3g6MC4xMzE0NTc2MjcxMTg2NDQwNiwgeToyLjQ5NzcyMDMzODk4MzA1MX0se3g6MC4xNDQxNjk0OTE1MjU0MjM3NCwgeToyLjQ3ODIyODgxMzU1OTMyMjJ9LHt4OjAuMTM3Mzg5ODMwNTA4NDc0NiwgeToyLjQ1NTM0NzQ1NzYyNzExOX0pLFxuICBuZXcgQXJyYXkoe3g6MC4xNDA3Nzk2NjEwMTY5NDkxNiwgeToyLjQ5ODU2Nzc5NjYxMDE3fSx7eDowLjEyMDQ0MDY3Nzk2NjEwMTY4LCB5OjIuNDg4Mzk4MzA1MDg0NzQ2fSx7eDowLjExNTM1NTkzMjIwMzM4OTg0LCB5OjIuNDc5OTIzNzI4ODEzNTU5Nn0se3g6MC4xMjQ2Nzc5NjYxMDE2OTQ5MiwgeToyLjQ2MjEyNzExODY0NDA2OH0se3g6MC4xMzkwODQ3NDU3NjI3MTE4NSwgeToyLjQ1NzA0MjM3Mjg4MTM1Nn0se3g6MC4xNDMzMjIwMzM4OTgzMDUwNiwgeToyLjQ0MTc4ODEzNTU5MzIyMDV9LHt4OjAuMTM0LCB5OjIuNDE4OTA2Nzc5NjYxMDE3M30se3g6MC4xMTQ1MDg0NzQ1NzYyNzExOCwgeToyLjQwNzg4OTgzMDUwODQ3NX0se3g6MC4xMTAyNzExODY0NDA2Nzc5NywgeToyLjM4NTg1NTkzMjIwMzM5fSx7eDowLjExODc0NTc2MjcxMTg2NDQyLCB5OjIuMzcyMjk2NjEwMTY5NDkyfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE2ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMjcyODgxMzU1OTMyMjAzMywgeToyLjQ0OTE1MjU0MjM3Mjg4MTV9LHt4OjAuMTMwNjc3OTY2MTAxNjk0OSwgeToyLjQ2MDE2OTQ5MTUyNTQyMzV9LHt4OjAuMTMwNjc3OTY2MTAxNjk0OSwgeToyLjQ3MTE4NjQ0MDY3Nzk2Nn0se3g6MC4xMjY0NDA2Nzc5NjYxMDE3LCB5OjIuNDk2NjEwMTY5NDkxNTI1M30se3g6MC4xMjk4MzA1MDg0NzQ1NzYyOCwgeToyLjUxNDQwNjc3OTY2MTAxNjh9LHt4OjAuMTIwNTA4NDc0NTc2MjcxMTksIHk6Mi41MjI4ODEzNTU5MzIyMDN9LHt4OjAuMTI4OTgzMDUwODQ3NDU3NjUsIHk6Mi41MjcxMTg2NDQwNjc3OTY2fSx7eDowLjEyMjIwMzM4OTgzMDUwODQ4LCB5OjIuNTMxMzU1OTMyMjAzMzg5Nn0se3g6MC4xMjg5ODMwNTA4NDc0NTc2NSwgeToyLjUzMzA1MDg0NzQ1NzYyN30se3g6MC4xMjA1MDg0NzQ1NzYyNzExOSwgeToyLjUzODEzNTU5MzIyMDMzOX0se3g6MC4xMjk4MzA1MDg0NzQ1NzYyOCwgeToyLjU0MDY3Nzk2NjEwMTY5NDd9LHt4OjAuMTIzMDUwODQ3NDU3NjI3MTEsIHk6Mi41NDU3NjI3MTE4NjQ0MDd9LHt4OjAuMTI5ODMwNTA4NDc0NTc2MjgsIHk6Mi41NDkxNTI1NDIzNzI4ODF9LHt4OjAuMTE4ODEzNTU5MzIyMDMzOSwgeToyLjU1NDIzNzI4ODEzNTU5MzN9LHt4OjAuMTI5ODMwNTA4NDc0NTc2MjgsIHk6Mi41NTY3Nzk2NjEwMTY5NDkzfSx7eDowLjEyNDc0NTc2MjcxMTg2NDQsIHk6Mi41NjAxNjk0OTE1MjU0MjM2fSx7eDowLjEyODk4MzA1MDg0NzQ1NzY1LCB5OjIuNTYzNTU5MzIyMDMzODk4NH0se3g6MC4xMjg5ODMwNTA4NDc0NTc2NSwgeToyLjU3Mjg4MTM1NTkzMjIwMzV9LHt4OjAuMTI0NzQ1NzYyNzExODY0NCwgeToyLjU3Nzk2NjEwMTY5NDkxNX0se3g6MC4xMjEzNTU5MzIyMDMzODk4MiwgeToyLjU4MjIwMzM4OTgzMDUwODZ9LHt4OjAuMTA4NjQ0MDY3Nzk2NjEwMTYsIHk6Mi41ODQ3NDU3NjI3MTE4NjQ2fSx7eDowLjA4OTE1MjU0MjM3Mjg4MTM1LCB5OjIuNTg1NTkzMjIwMzM4OTgzfSx7eDowLjA3MTM1NTkzMjIwMzM4OTgzLCB5OjIuNTkyMzcyODgxMzU1OTMyfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE3ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4wNjk1OTMyMjAzMzg5ODMwNSwgeToyLjU5MTc4ODEzNTU5MzIyMDR9LHt4OjAuMDUzNDkxNTI1NDIzNzI4ODE0LCB5OjIuNTY4OTA2Nzc5NjYxMDE3fSx7eDowLjA1MjY0NDA2Nzc5NjYxMDE3LCB5OjIuNTQ0MzMwNTA4NDc0NTc2Nn0se3g6MC4wNjUzNTU5MzIyMDMzODk4MiwgeToyLjUzMjQ2NjEwMTY5NDkxNTV9LHt4OjAuMDg2NTQyMzcyODgxMzU1OTMsIHk6Mi41NDY4NzI4ODEzNTU5MzIzfSx7eDowLjA4NTY5NDkxNTI1NDIzNzMsIHk6Mi41NzA2MDE2OTQ5MTUyNTQ2fSx7eDowLjA2ODc0NTc2MjcxMTg2NDQsIHk6Mi41ODkyNDU3NjI3MTE4NjV9LHt4OjAuMDU5NDIzNzI4ODEzNTU5MzI2LCB5OjIuNjE2MzY0NDA2Nzc5NjYxfSx7eDowLjA1NjAzMzg5ODMwNTA4NDc1LCB5OjIuNjQ4NTY3Nzk2NjEwMTY5N30se3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjY2ODkwNjc3OTY2MTAxNzN9LHt4OjAuMDgzMTUyNTQyMzcyODgxMzYsIHk6Mi42NTc4ODk4MzA1MDg0NzV9LHt4OjAuMDg0ODQ3NDU3NjI3MTE4NjUsIHk6Mi42NDAwOTMyMjAzMzg5ODMzfSx7eDowLjA4MjMwNTA4NDc0NTc2MjcyLCB5OjIuNjI5MDc2MjcxMTg2NDQxfSx7eDowLjA2NjIwMzM4OTgzMDUwODQ3LCB5OjIuNjE0NjY5NDkxNTI1NDI0fSx7eDowLjA2MjgxMzU1OTMyMjAzMzksIHk6Mi41ODQxNjEwMTY5NDkxNTI3fSksXG4gIG5ldyBBcnJheSh7eDowLjA1NzcyODgxMzU1OTMyMjA0LCB5OjIuNTcwNjAxNjk0OTE1MjU0Nn0se3g6MC4wNTc3Mjg4MTM1NTkzMjIwNCwgeToyLjU5MTc4ODEzNTU5MzIyMDR9LHt4OjAuMDcyOTgzMDUwODQ3NDU3NjMsIHk6Mi42MTEyNzk2NjEwMTY5NDkzfSx7eDowLjA4NCwgeToyLjYyNzM4MTM1NTkzMjIwMzV9LHt4OjAuMDg0ODQ3NDU3NjI3MTE4NjUsIHk6Mi42NTI4MDUwODQ3NDU3NjI3fSx7eDowLjA3ODkxNTI1NDIzNzI4ODE0LCB5OjIuNjY4OTA2Nzc5NjYxMDE3M30se3g6MC4wNjExMTg2NDQwNjc3OTY2MTUsIHk6Mi42NjEyNzk2NjEwMTY5NDl9LHt4OjAuMDU3NzI4ODEzNTU5MzIyMDQsIHk6Mi42NDE3ODgxMzU1OTMyMjA3fSx7eDowLjA3ODA2Nzc5NjYxMDE2OTUsIHk6Mi42MTM4MjIwMzM4OTgzMDU0fSx7eDowLjA3NDY3Nzk2NjEwMTY5NDkxLCB5OjIuNTk1MTc3OTY2MTAxNjk1fSx7eDowLjA1ODU3NjI3MTE4NjQ0MDY4LCB5OjIuNTgwNzcxMTg2NDQwNjc4fSx7eDowLjA1NTE4NjQ0MDY3Nzk2NjEsIHk6Mi41NjIxMjcxMTg2NDQwNjh9LHt4OjAuMDU1MTg2NDQwNjc3OTY2MSwgeToyLjU0MTc4ODEzNTU5MzIyMDZ9LHt4OjAuMDcyMTM1NTkzMjIwMzM4OTgsIHk6Mi41MzUwMDg0NzQ1NzYyNzE1fSx7eDowLjA4NDg0NzQ1NzYyNzExODY1LCB5OjIuNTQ5NDE1MjU0MjM3Mjg4M30se3g6MC4wNzM4MzA1MDg0NzQ1NzYyNywgeToyLjU3NTY4NjQ0MDY3Nzk2NjN9LHt4OjAuMDczODMwNTA4NDc0NTc2MjcsIHk6Mi42MjE0NDkxNTI1NDIzNzN9LHt4OjAuMDc5NzYyNzExODY0NDA2NzgsIHk6Mi42MzMzMTM1NTkzMjIwMzQzfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE4ID0gbmV3IEFycmF5KFxuICAvL25ldyBBcnJheSh7eDowLjA3Mjk4MzA1MDg0NzQ1NzYzLCB5OjIuNjU1MzQ3NDU3NjI3MTE4OH0se3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjY3MDYwMTY5NDkxNTI1NDJ9LHt4OjAuMDY0NTA4NDc0NTc2MjcxMTgsIHk6Mi42OTE3ODgxMzU1OTMyMjA1fSx7eDowLjA3NDY3Nzk2NjEwMTY5NDkxLCB5OjIuNjk4NTY3Nzk2NjEwMTY5NX0se3g6MC4wNjQ1MDg0NzQ1NzYyNzExOCwgeToyLjcwMzY1MjU0MjM3Mjg4MTd9LCB7eDowLjA2Nzg5ODMwNTA4NDc0NTc2LCB5OjIuNzYwNjAxNjk0OTE1MjU0M30se3g6MC4wNzk3NjI3MTE4NjQ0MDY3OCwgeToyLjc2ODIyODgxMzU1OTMyMn0se3g6MC4xMDUxODY0NDA2Nzc5NjYxLCB5OjIuNzY4MjI4ODEzNTU5MzIyfSx7eDowLjEzMDYxMDE2OTQ5MTUyNTQzLCB5OjIuNzY4MjI4ODEzNTU5MzIyfSx7eDowLjE1MDk0OTE1MjU0MjM3MjksIHk6Mi43ODE2MTg2NDQwNjc3OTd9LHt4OjAuMTUyNjQ0MDY3Nzk2NjEwMTYsIHk6Mi43OTYwMjU0MjM3Mjg4MTM2fSx7eDowLjE1MzQ5MTUyNTQyMzcyODgsIHk6Mi44MTU1MTY5NDkxNTI1NDI1fSx7eDowLjE1NDMzODk4MzA1MDg0NzQ4LCB5OjIuODQ1MTc3OTY2MTAxNjk1fSx7eDowLjE2MDI3MTE4NjQ0MDY3Nzk1LCB5OjIuODU4NzM3Mjg4MTM1NTkzMn0se3g6MC4xNzYzNzI4ODEzNTU5MzIyLCB5OjIuODUxMjc5NjYxMDE2OTQ5M30se3g6MC4xODMxNTI1NDIzNzI4ODEzNywgeToyLjg0Nzg4OTgzMDUwODQ3NDZ9LHt4OjAuMTg2NTQyMzcyODgxMzU1OTQsIHk6Mi44NTU1MTY5NDkxNTI1NDI3fSx7eDowLjE5MDc3OTY2MTAxNjk0OTE1LCB5OjIuODQ3ODg5ODMwNTA4NDc0Nn0se3g6MC4xOTY3MTE4NjQ0MDY3Nzk2OCwgeToyLjg1MzgyMjAzMzg5ODMwNTR9LHt4OjAuMjAwOTQ5MTUyNTQyMzcyOSwgeToyLjg0NTM0NzQ1NzYyNzExOX0se3g6MC4yMDY4ODEzNTU5MzIyMDM0MSwgeToyLjg1NDY2OTQ5MTUyNTQyNH0se3g6MC4yMTAyNzExODY0NDA2NzgsIHk6Mi44NDQ1MDAwMDAwMDAwMDAzfSx7eDowLjIxNDUwODQ3NDU3NjI3MTIsIHk6Mi44NTQ2Njk0OTE1MjU0MjR9LHt4OjAuMjE5NTkzMjIwMzM4OTgzMDQsIHk6Mi44NDQ1MDAwMDAwMDAwMDAzfSx7eDowLjIyNDY3Nzk2NjEwMTY5NDk0LCB5OjIuODQzODIyMDMzODk4MzA1NH0se3g6MC4yMjgwNjc3OTY2MTAxNjk1MiwgeToyLjg0MzY1MjU0MjM3Mjg4MTZ9LHt4OjAuMjMwNjEwMTY5NDkxNTI1NCwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuMjQ5MjU0MjM3Mjg4MTM1NTYsIHk6Mi44NjA0MzIyMDMzODk4MzA2fSx7eDowLjI4MTQ1NzYyNzExODY0NCwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuMzQ2NzExODY0NDA2Nzc5NjUsIHk6Mi44NTEyNzk2NjEwMTY5NDkzfSx7eDowLjM4OTA4NDc0NTc2MjcxMTg1LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40MDM0OTE1MjU0MjM3Mjg4LCB5OjIuODQ4NzM3Mjg4MTM1NTkzMn0se3g6MC40MDYwMzM4OTgzMDUwODQ3NCwgeToyLjg0NTM0NzQ1NzYyNzExOX0se3g6MC40MTExMTg2NDQwNjc3OTY2LCB5OjIuODU2MzY0NDA2Nzc5NjYxfSx7eDowLjQxNjIwMzM4OTgzMDUwODUsIHk6Mi44NTUzNDc0NTc2MjcxMTl9LHt4OjAuNDE4NzQ1NzYyNzExODY0MzcsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQyNjM3Mjg4MTM1NTkzMjIsIHk6Mi44NTI4MDUwODQ3NDU3NjN9LHt4OjAuNDI4MDY3Nzk2NjEwMTY5NDcsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQzMTQ1NzYyNzExODY0NDA1LCB5OjIuODQzNjUyNTQyMzcyODgxNn0se3g6MC40MzQsIHk6Mi44NTI5NzQ1NzYyNzExODY3fSx7eDowLjQzNCwgeToyLjg0NjE5NDkxNTI1NDIzNzZ9LHt4OjAuNDQxNjI3MTE4NjQ0MDY3OCwgeToyLjg1NjM2NDQwNjc3OTY2MX0se3g6MC40NDUwMTY5NDkxNTI1NDIzNiwgeToyLjg0NTM0NzQ1NzYyNzExOX0se3g6MC40NTAxMDE2OTQ5MTUyNTQyLCB5OjIuODUxMjc5NjYxMDE2OTQ5M30se3g6MC40NjM2NjEwMTY5NDkxNTI1LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40ODQsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQ5NDE2OTQ5MTUyNTQyMzY3LCB5OjIuODY4MDU5MzIyMDMzODk4NH0se3g6MC40OTc1NTkzMjIwMzM4OTgzLCB5OjIuODg3NTUwODQ3NDU3NjI3Mn0se3g6MC40OTc1NTkzMjIwMzM4OTgzLCB5OjIuOTI1Njg2NDQwNjc3OTY2M30se3g6MC40OTY3MTE4NjQ0MDY3Nzk2LCB5OjIuOTUyODA1MDg0NzQ1NzYzfSx7eDowLjQ5NzU1OTMyMjAzMzg5ODMsIHk6Mi45ODA3NzExODY0NDA2NzgzfSwge3g6MC40ODQ4NDc0NTc2MjcxMTg2NywgeTozLjAwMzY1MjU0MjM3Mjg4MTV9LHt4OjAuNDYyODEzNTU5MzIyMDMzOSwgeTozLjAxMjk3NDU3NjI3MTE4NjZ9LHt4OjAuNDQyNDc0NTc2MjcxMTg2NCwgeTozLjAxMzgyMjAzMzg5ODMwNTN9LHt4OjAuNDMyMzA1MDg0NzQ1NzYyNywgeTozLjAxODA1OTMyMjAzMzg5ODN9LHt4OjAuNDI3MjIwMzM4OTgzMDUwODQsIHk6My4wMjkwNzYyNzExODY0NDA3fSx7eDowLjQyNjM3Mjg4MTM1NTkzMjIsIHk6My4wNjI5NzQ1NzYyNzExODY0fSx7eDowLjQyOTc2MjcxMTg2NDQwNjgsIHk6My4xMDExMTAxNjk0OTE1MjU1fSx7eDowLjQyMzgzMDUwODQ3NDU3NjI2LCB5OjMuMTEzODIyMDMzODk4MzA1NH0se3g6MC4zODU2OTQ5MTUyNTQyMzcyNywgeTozLjExODA1OTMyMjAzMzg5ODR9LHt4OjAuMzU2ODgxMzU1OTMyMjAzNCwgeTozLjExNzIxMTg2NDQwNjc3OTd9LHt4OjAuMzQ1ODY0NDA2Nzc5NjYxLCB5OjMuMTA4NzM3Mjg4MTM1NTkzMn0se3g6MC4zNDU4NjQ0MDY3Nzk2NjEsIHk6My4wOTUxNzc5NjYxMDE2OTV9LHt4OjAuMzQzMzIyMDMzODk4MzA1MDcsIHk6My4wMjMxNDQwNjc3OTY2MTA0fSlcbiAgbmV3IEFycmF5KHt4OjAuMDY0NTc2MjcxMTg2NDQwNjcsIHk6Mi42MTM1NTkzMjIwMzM4OTh9LHt4OjAuMDcxMzU1OTMyMjAzMzg5ODMsIHk6Mi42MTg2NDQwNjc3OTY2MTAzfSx7eDowLjA3MTM1NTkzMjIwMzM4OTgzLCB5OjIuNjI3OTY2MTAxNjk0OTE1NH0se3g6MC4wNzA1MDg0NzQ1NzYyNzEyLCB5OjIuNjQ0OTE1MjU0MjM3Mjg4Mn0se3g6MC4wNjcxMTg2NDQwNjc3OTY2MiwgeToyLjY2MjcxMTg2NDQwNjc3OTh9LHt4OjAuMDY4ODEzNTU5MzIyMDMzOTEsIHk6Mi42ODQ3NDU3NjI3MTE4NjQzfSx7eDowLjA2MzcyODgxMzU1OTMyMjA0LCB5OjIuNjk0MDY3Nzk2NjEwMTY5NH0se3g6MC4wNzMwNTA4NDc0NTc2MjcxMiwgeToyLjY5NjYxMDE2OTQ5MTUyNTR9LHt4OjAuMDY1NDIzNzI4ODEzNTU5MzMsIHk6Mi43MDI1NDIzNzI4ODEzNTZ9LHt4OjAuMDczODk4MzA1MDg0NzQ1NzUsIHk6Mi43MDUwODQ3NDU3NjI3MTJ9LHt4OjAuMDY1NDIzNzI4ODEzNTU5MzMsIHk6Mi43MDkzMjIwMzM4OTgzMDUzfSx7eDowLjA3NTU5MzIyMDMzODk4MzA0LCB5OjIuNzEyNzExODY0NDA2Nzc5Nn0se3g6MC4wNjcxMTg2NDQwNjc3OTY2MiwgeToyLjcxOTQ5MTUyNTQyMzcyODZ9LHt4OjAuMDc1NTkzMjIwMzM4OTgzMDQsIHk6Mi43MjExODY0NDA2Nzc5NjZ9LHt4OjAuMDY3OTY2MTAxNjk0OTE1MjUsIHk6Mi43MjU0MjM3Mjg4MTM1NTk0fSx7eDowLjA3NTU5MzIyMDMzODk4MzA0LCB5OjIuNzI3OTY2MTAxNjk0OTE1fSx7eDowLjA2ODgxMzU1OTMyMjAzMzkxLCB5OjIuNzMzMDUwODQ3NDU3NjI3fSx7eDowLjA2OTY2MTAxNjk0OTE1MjU0LCB5OjIuNzQ5MTUyNTQyMzcyODgxM30se3g6MC4wNzA1MDg0NzQ1NzYyNzEyLCB5OjIuNzU4NDc0NTc2MjcxMTg2NH0se3g6MC4wNzU1OTMyMjAzMzg5ODMwNCwgeToyLjc2ODY0NDA2Nzc5NjYxfSx7eDowLjA4MzIyMDMzODk4MzA1MDg1LCB5OjIuNzczNzI4ODEzNTU5MzIyfSx7eDowLjA5NzYyNzExODY0NDA2NzgsIHk6Mi43NzQ1NzYyNzExODY0NDA2fSx7eDowLjExMjAzMzg5ODMwNTA4NDc0LCB5OjIuNzc0NTc2MjcxMTg2NDQwNn0se3g6MC4xMzA2Nzc5NjYxMDE2OTQ5LCB5OjIuNzc0NTc2MjcxMTg2NDQwNn0se3g6MC4xNDUwODQ3NDU3NjI3MTE4NSwgeToyLjc3NjI3MTE4NjQ0MDY3OH0se3g6MC4xNTEwMTY5NDkxNTI1NDIzOCwgeToyLjc4MjIwMzM4OTgzMDUwODN9LHt4OjAuMTU2MTAxNjk0OTE1MjU0MjcsIHk6Mi43OTE1MjU0MjM3Mjg4MTM0fSx7eDowLjE1NjEwMTY5NDkxNTI1NDI3LCB5OjIuODAzMzg5ODMwNTA4NDc0Nn0se3g6MC4xNTUyNTQyMzcyODgxMzU2LCB5OjIuODQzMjIwMzM4OTgzMDUxfSx7eDowLjE2MDMzODk4MzA1MDg0NzQ4LCB5OjIuODU1MDg0NzQ1NzYyNzExOH0se3g6MC4xNjc5NjYxMDE2OTQ5MTUyNywgeToyLjg1OTMyMjAzMzg5ODMwNX0se3g6MC4xNzgxMzU1OTMyMjAzMzksIHk6Mi44NTkzMjIwMzM4OTgzMDV9LHt4OjAuMTg5MTUyNTQyMzcyODgxMzcsIHk6Mi44NjI3MTE4NjQ0MDY3Nzk1fSx7eDowLjE5NDIzNzI4ODEzNTU5MzIsIHk6Mi44NTUwODQ3NDU3NjI3MTE4fSx7eDowLjE5NTkzMjIwMzM4OTgzMDUzLCB5OjIuODYyNzExODY0NDA2Nzc5NX0se3g6MC4xOTg0NzQ1NzYyNzExODY0OCwgeToyLjg1NTkzMjIwMzM4OTgzMDR9LHt4OjAuMjAzNTU5MzIyMDMzODk4MzIsIHk6Mi44NjM1NTkzMjIwMzM4OTh9LHt4OjAuMjA2MTAxNjk0OTE1MjU0MjYsIHk6Mi44NTU5MzIyMDMzODk4MzA0fSx7eDowLjIxMTE4NjQ0MDY3Nzk2NjEsIHk6Mi44NjI3MTE4NjQ0MDY3Nzk1fSx7eDowLjIxMjAzMzg5ODMwNTA4NDczLCB5OjIuODU1MDg0NzQ1NzYyNzExOH0se3g6MC4yMTc5NjYxMDE2OTQ5MTUyNiwgeToyLjg2NDQwNjc3OTY2MTAxN30se3g6MC4yMTg4MTM1NTkzMjIwMzM5LCB5OjIuODU1MDg0NzQ1NzYyNzExOH0se3g6MC4yMjQ3NDU3NjI3MTE4NjQ0MiwgeToyLjg2MjcxMTg2NDQwNjc3OTV9LHt4OjAuMjI2NDQwNjc3OTY2MTAxNzMsIHk6Mi44NTU5MzIyMDMzODk4MzA0fSx7eDowLjIzMTUyNTQyMzcyODgxMzU3LCB5OjIuODYxMDE2OTQ5MTUyNTQyNn0se3g6MC4yMzQwNjc3OTY2MTAxNjk1MiwgeToyLjg1NTkzMjIwMzM4OTgzMDR9LHt4OjAuMjQwODQ3NDU3NjI3MTE4NjgsIHk6Mi44NTg0NzQ1NzYyNzExODY1fSx7eDowLjI1NDQwNjc3OTY2MTAxNjk0LCB5OjIuODYwMTY5NDkxNTI1NDI0fSx7eDowLjI3NzI4ODEzNTU5MzIyMDM1LCB5OjIuODYxODY0NDA2Nzc5NjYxfSx7eDowLjMwNzc5NjYxMDE2OTQ5MTU2LCB5OjIuODYxODY0NDA2Nzc5NjYxfSx7eDowLjMzNDA2Nzc5NjYxMDE2OTUsIHk6Mi44NjE4NjQ0MDY3Nzk2NjF9LHt4OjAuMzYyMDMzODk4MzA1MDg0NzYsIHk6Mi44NjE4NjQ0MDY3Nzk2NjF9LHt4OjAuMzg0MDY3Nzk2NjEwMTY5NSwgeToyLjg2MDE2OTQ5MTUyNTQyNH0se3g6MC40MDEwMTY5NDkxNTI1NDI0LCB5OjIuODU2Nzc5NjYxMDE2OTQ5fSx7eDowLjQwOTQ5MTUyNTQyMzcyODgsIHk6Mi44NjM1NTkzMjIwMzM4OTh9LHt4OjAuNDExMTg2NDQwNjc3OTY2MTcsIHk6Mi44NTUwODQ3NDU3NjI3MTE4fSx7eDowLjQxNzk2NjEwMTY5NDkxNTIsIHk6Mi44NjM1NTkzMjIwMzM4OTh9LHt4OjAuNDIwNTA4NDc0NTc2MjcxMTYsIHk6Mi44NTUwODQ3NDU3NjI3MTE4fSx7eDowLjQyNTU5MzIyMDMzODk4MzA2LCB5OjIuODYyNzExODY0NDA2Nzc5NX0se3g6MC40Mjk4MzA1MDg0NzQ1NzYyNywgeToyLjg1NDIzNzI4ODEzNTU5M30se3g6MC40MzIzNzI4ODEzNTU5MzIyLCB5OjIuODY0NDA2Nzc5NjYxMDE3fSx7eDowLjQzODMwNTA4NDc0NTc2MjcsIHk6Mi44NTU5MzIyMDMzODk4MzA0fSx7eDowLjQ0MTY5NDkxNTI1NDIzNzMsIHk6Mi44NjUyNTQyMzcyODgxMzU2fSx7eDowLjQ0NTkzMjIwMzM4OTgzMDUzLCB5OjIuODU2Nzc5NjYxMDE2OTQ5fSx7eDowLjQ1NTI1NDIzNzI4ODEzNTYzLCB5OjIuODYwMTY5NDkxNTI1NDI0fSx7eDowLjQ3NTU5MzIyMDMzODk4MzEsIHk6Mi44NjE4NjQ0MDY3Nzk2NjF9LHt4OjAuNDg3NDU3NjI3MTE4NjQ0MDQsIHk6Mi44NjE4NjQ0MDY3Nzk2NjF9LHt4OjAuNDkyNTQyMzcyODgxMzU1OTQsIHk6Mi44NjQ0MDY3Nzk2NjEwMTd9LHt4OjAuNDk4NDc0NTc2MjcxMTg2NCwgeToyLjg3Mjg4MTM1NTkzMjIwMzN9LHt4OjAuNTAwMTY5NDkxNTI1NDIzOCwgeToyLjg4NTU5MzIyMDMzODk4M30se3g6MC41MDAxNjk0OTE1MjU0MjM4LCB5OjIuOTA0MjM3Mjg4MTM1NTkzM30se3g6MC41MDAxNjk0OTE1MjU0MjM4LCB5OjIuOTI4ODEzNTU5MzIyMDM0fSx7eDowLjUwMDE2OTQ5MTUyNTQyMzgsIHk6Mi45NTc2MjcxMTg2NDQwNjh9LHt4OjAuNDk4NDc0NTc2MjcxMTg2NCwgeToyLjk2NDQwNjc3OTY2MTAxN30se3g6MC41MDE4NjQ0MDY3Nzk2NjEsIHk6Mi45ODIyMDMzODk4MzA1MDg1fSx7eDowLjUwMTAxNjk0OTE1MjU0MjQsIHk6Mi45OTQ5MTUyNTQyMzcyODgzfSx7eDowLjQ5NDIzNzI4ODEzNTU5MzIsIHk6My4wMDkzMjIwMzM4OTgzMDV9LHt4OjAuNDg4MzA1MDg0NzQ1NzYyNzMsIHk6My4wMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDczMDUwODQ3NDU3NjI3MTUsIHk6My4wMTUyNTQyMzcyODgxMzU1fSx7eDowLjQ1ODY0NDA2Nzc5NjYxMDE2LCB5OjMuMDEyNzExODY0NDA2Nzh9LHt4OjAuNDQ3NjI3MTE4NjQ0MDY3OCwgeTozLjAxNTI1NDIzNzI4ODEzNTV9LHt4OjAuNDQwMDAwMDAwMDAwMDAwMDYsIHk6My4wMTg2NDQwNjc3OTY2MX0se3g6MC40MzU3NjI3MTE4NjQ0MDY3NCwgeTozLjAyMzcyODgxMzU1OTMyMn0se3g6MC40Mjk4MzA1MDg0NzQ1NzYyNywgeTozLjAzMzg5ODMwNTA4NDc0NTd9LHt4OjAuNDMwNjc3OTY2MTAxNjk0OTUsIHk6My4wNDY2MTAxNjk0OTE1MjU1fSx7eDowLjQzMTUyNTQyMzcyODgxMzUzLCB5OjMuMDY2OTQ5MTUyNTQyMzczfSx7eDowLjQzMTUyNTQyMzcyODgxMzUzLCB5OjMuMDg2NDQwNjc3OTY2MTAxNn0se3g6MC40MzIzNzI4ODEzNTU5MzIyLCB5OjMuMTAxNjk0OTE1MjU0MjM3NX0se3g6MC40Mjg5ODMwNTA4NDc0NTc3LCB5OjMuMTExMDE2OTQ5MTUyNTQyNn0se3g6MC40MjEzNTU5MzIyMDMzODk4NSwgeTozLjExNjk0OTE1MjU0MjM3M30se3g6MC40MDUyNTQyMzcyODgxMzU2LCB5OjMuMTE5NDkxNTI1NDIzNzI5fSx7eDowLjM4MjM3Mjg4MTM1NTkzMjIsIHk6My4xMTk0OTE1MjU0MjM3Mjl9LHt4OjAuMzY1NDIzNzI4ODEzNTU5MzMsIHk6My4xMTc3OTY2MTAxNjk0OTE2fSx7eDowLjM1NjEwMTY5NDkxNTI1NDIzLCB5OjMuMTEzNTU5MzIyMDMzODk4fSx7eDowLjM1MTg2NDQwNjc3OTY2MSwgeTozLjEwMjU0MjM3Mjg4MTM1Nn0se3g6MC4zNTEwMTY5NDkxNTI1NDI0LCB5OjMuMDg4OTgzMDUwODQ3NDU3Nn0se3g6MC4zNDkzMjIwMzM4OTgzMDUxLCB5OjMuMDc1NDIzNzI4ODEzNTU5NX0se3g6MC4zNDY3Nzk2NjEwMTY5NDkyLCB5OjMuMDYyNzExODY0NDA2Nzc5N30se3g6MC4zNCwgeTozLjAzMzg5ODMwNTA4NDc0NTd9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTkgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjM0NzU1OTMyMjAzMzg5ODMsIHk6My4wMjQ4Mzg5ODMwNTA4NDc4fSx7eDowLjMzMDYxMDE2OTQ5MTUyNTQsIHk6My4wNDY4NzI4ODEzNTU5MzIzfSx7eDowLjMwNTE4NjQ0MDY3Nzk2NjEsIHk6My4wMjk5MjM3Mjg4MTM1NTk0fSx7eDowLjMwNDMzODk4MzA1MDg0NzQ0LCB5OjIuOTk5NDE1MjU0MjM3Mjg4NX0se3g6MC4zMDY4ODEzNTU5MzIyMDM0LCB5OjIuOTYwNDMyMjAzMzg5ODMwN30se3g6MC4zMjk3NjI3MTE4NjQ0MDY3NSwgeToyLjkzNTAwODQ3NDU3NjI3MTV9LHt4OjAuMzU5NDIzNzI4ODEzNTU5MzMsIHk6Mi45NDI2MzU1OTMyMjAzMzl9LHt4OjAuMzgxNDU3NjI3MTE4NjQ0MDYsIHk6Mi45NjEyNzk2NjEwMTY5NDk0fSx7eDowLjM3MjEzNTU5MzIyMDMzODk2LCB5OjIuOTc2NTMzODk4MzA1MDg1fSx7eDowLjM0NTAxNjk0OTE1MjU0MjQsIHk6Mi45ODMzMTM1NTkzMjIwMzR9LHt4OjAuMzQwNzc5NjYxMDE2OTQ5MSwgeTozLjAwMDI2MjcxMTg2NDQwNjd9LHt4OjAuMzcwNDQwNjc3OTY2MTAxNywgeTozLjAxNTUxNjk0OTE1MjU0MjZ9LHt4OjAuMzc4MDY3Nzk2NjEwMTY5NSwgeTozLjA0MDk0MDY3Nzk2NjEwMn0se3g6MC4zNDkyNTQyMzcyODgxMzU2LCB5OjMuMDUxOTU3NjI3MTE4NjQ0NH0pLCBcbiAgbmV3IEFycmF5KHt4OjAuMzc4OTE1MjU0MjM3Mjg4MSwgeToyLjkzOTI0NTc2MjcxMTg2NDR9LHt4OjAuMzgyMzA1MDg0NzQ1NzYyNywgeToyLjk2Mjk3NDU3NjI3MTE4Njh9LHt4OjAuMzYxMTE4NjQ0MDY3Nzk2NiwgeToyLjk3MzE0NDA2Nzc5NjYxMDZ9LHt4OjAuMzI1NTI1NDIzNzI4ODEzNTUsIHk6Mi45ODQxNjEwMTY5NDkxNTI2fSx7eDowLjMwODU3NjI3MTE4NjQ0MDY1LCB5OjMuMDAyODA1MDg0NzQ1NzYzfSx7eDowLjMzMjMwNTA4NDc0NTc2MjcsIHk6My4wMTM4MjIwMzM4OTgzMDUzfSx7eDowLjM2NjIwMzM4OTgzMDUwODUsIHk6My4wMjMxNDQwNjc3OTY2MTA0fSx7eDowLjM4MDYxMDE2OTQ5MTUyNTQzLCB5OjMuMDQ1MTc3OTY2MTAxNjk1fSx7eDowLjM1MjY0NDA2Nzc5NjYxMDE3LCB5OjMuMDU5NTg0NzQ1NzYyNzEyfSx7eDowLjMwOTQyMzcyODgxMzU1OTMsIHk6My4wNDg1Njc3OTY2MTAxNjk2fSx7eDowLjMxNTM1NTkzMjIwMzM4OTgsIHk6My4wMTYzNjQ0MDY3Nzk2NjEzfSx7eDowLjMzODIzNzI4ODEzNTU5MzIzLCB5OjIuOTk1MTc3OTY2MTAxNjk1fSx7eDowLjM2NjIwMzM4OTgzMDUwODUsIHk6Mi45ODgzOTgzMDUwODQ3NDZ9LHt4OjAuMzUyNjQ0MDY3Nzk2NjEwMTcsIHk6Mi45NjQ2Njk0OTE1MjU0MjM3fSx7eDowLjMxNzA1MDg0NzQ1NzYyNzEsIHk6Mi45NDg1Njc3OTY2MTAxNjk1fSx7eDowLjMzNjU0MjM3Mjg4MTM1NTksIHk6Mi45MzQxNjEwMTY5NDkxNTI4fSx7eDowLjM2NTM1NTkzMjIwMzM4OTgsIHk6Mi45MzkyNDU3NjI3MTE4NjQ0fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIwID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4wNjQ1NzYyNzExODY0NDA2NywgeToyLjYxMzU1OTMyMjAzMzg5OH0se3g6MC4wNzEzNTU5MzIyMDMzODk4MywgeToyLjYxODY0NDA2Nzc5NjYxMDN9LHt4OjAuMDcxMzU1OTMyMjAzMzg5ODMsIHk6Mi42Mjc5NjYxMDE2OTQ5MTU0fSx7eDowLjA3MDUwODQ3NDU3NjI3MTIsIHk6Mi42NDQ5MTUyNTQyMzcyODgyfSx7eDowLjA2NzExODY0NDA2Nzc5NjYyLCB5OjIuNjYyNzExODY0NDA2Nzc5OH0se3g6MC4wNjg4MTM1NTkzMjIwMzM5MSwgeToyLjY4NDc0NTc2MjcxMTg2NDN9LHt4OjAuMDYzNzI4ODEzNTU5MzIyMDQsIHk6Mi42OTQwNjc3OTY2MTAxNjk0fSx7eDowLjA3MzA1MDg0NzQ1NzYyNzEyLCB5OjIuNjk2NjEwMTY5NDkxNTI1NH0se3g6MC4wNjU0MjM3Mjg4MTM1NTkzMywgeToyLjcwMjU0MjM3Mjg4MTM1Nn0se3g6MC4wNzM4OTgzMDUwODQ3NDU3NSwgeToyLjcwNTA4NDc0NTc2MjcxMn0se3g6MC4wNjU0MjM3Mjg4MTM1NTkzMywgeToyLjcwOTMyMjAzMzg5ODMwNTN9LHt4OjAuMDc1NTkzMjIwMzM4OTgzMDQsIHk6Mi43MTI3MTE4NjQ0MDY3Nzk2fSx7eDowLjA2NzExODY0NDA2Nzc5NjYyLCB5OjIuNzE5NDkxNTI1NDIzNzI4Nn0se3g6MC4wNzU1OTMyMjAzMzg5ODMwNCwgeToyLjcyMTE4NjQ0MDY3Nzk2Nn0se3g6MC4wNjc5NjYxMDE2OTQ5MTUyNSwgeToyLjcyNTQyMzcyODgxMzU1OTR9LHt4OjAuMDc1NTkzMjIwMzM4OTgzMDQsIHk6Mi43Mjc5NjYxMDE2OTQ5MTV9LHt4OjAuMDY4ODEzNTU5MzIyMDMzOTEsIHk6Mi43MzMwNTA4NDc0NTc2Mjd9LHt4OjAuMDY5NjYxMDE2OTQ5MTUyNTQsIHk6Mi43NDkxNTI1NDIzNzI4ODEzfSx7eDowLjA3MDUwODQ3NDU3NjI3MTIsIHk6Mi43NTg0NzQ1NzYyNzExODY0fSx7eDowLjA3NTU5MzIyMDMzODk4MzA0LCB5OjIuNzY4NjQ0MDY3Nzk2NjF9LHt4OjAuMDgzMjIwMzM4OTgzMDUwODUsIHk6Mi43NzM3Mjg4MTM1NTkzMjJ9LHt4OjAuMDk3NjI3MTE4NjQ0MDY3OCwgeToyLjc3NDU3NjI3MTE4NjQ0MDZ9LHt4OjAuMTEyMDMzODk4MzA1MDg0NzQsIHk6Mi43NzQ1NzYyNzExODY0NDA2fSx7eDowLjEzMDY3Nzk2NjEwMTY5NDksIHk6Mi43NzQ1NzYyNzExODY0NDA2fSx7eDowLjE0NTA4NDc0NTc2MjcxMTg1LCB5OjIuNzc2MjcxMTg2NDQwNjc4fSx7eDowLjE1MTAxNjk0OTE1MjU0MjM4LCB5OjIuNzgyMjAzMzg5ODMwNTA4M30se3g6MC4xNTYxMDE2OTQ5MTUyNTQyNywgeToyLjc5MTUyNTQyMzcyODgxMzR9LHt4OjAuMTU2MTAxNjk0OTE1MjU0MjcsIHk6Mi44MDMzODk4MzA1MDg0NzQ2fSx7eDowLjE1NTI1NDIzNzI4ODEzNTYsIHk6Mi44NDMyMjAzMzg5ODMwNTF9LHt4OjAuMTYwMzM4OTgzMDUwODQ3NDgsIHk6Mi44NTUwODQ3NDU3NjI3MTE4fSx7eDowLjE2Nzk2NjEwMTY5NDkxNTI3LCB5OjIuODU5MzIyMDMzODk4MzA1fSx7eDowLjE3ODEzNTU5MzIyMDMzOSwgeToyLjg1OTMyMjAzMzg5ODMwNX0se3g6MC4xODkxNTI1NDIzNzI4ODEzNywgeToyLjg2MjcxMTg2NDQwNjc3OTV9LHt4OjAuMTk0MjM3Mjg4MTM1NTkzMiwgeToyLjg1NTA4NDc0NTc2MjcxMTh9LHt4OjAuMTk1OTMyMjAzMzg5ODMwNTMsIHk6Mi44NjI3MTE4NjQ0MDY3Nzk1fSx7eDowLjE5ODQ3NDU3NjI3MTE4NjQ4LCB5OjIuODU1OTMyMjAzMzg5ODMwNH0se3g6MC4yMDM1NTkzMjIwMzM4OTgzMiwgeToyLjg2MzU1OTMyMjAzMzg5OH0se3g6MC4yMDYxMDE2OTQ5MTUyNTQyNiwgeToyLjg1NTkzMjIwMzM4OTgzMDR9LHt4OjAuMjExMTg2NDQwNjc3OTY2MSwgeToyLjg2MjcxMTg2NDQwNjc3OTV9LHt4OjAuMjEyMDMzODk4MzA1MDg0NzMsIHk6Mi44NTUwODQ3NDU3NjI3MTE4fSx7eDowLjIxNzk2NjEwMTY5NDkxNTI2LCB5OjIuODY0NDA2Nzc5NjYxMDE3fSx7eDowLjIxODgxMzU1OTMyMjAzMzksIHk6Mi44NTUwODQ3NDU3NjI3MTE4fSx7eDowLjIyNDc0NTc2MjcxMTg2NDQyLCB5OjIuODYyNzExODY0NDA2Nzc5NX0se3g6MC4yMjY0NDA2Nzc5NjYxMDE3MywgeToyLjg1NTkzMjIwMzM4OTgzMDR9LHt4OjAuMjMxNTI1NDIzNzI4ODEzNTcsIHk6Mi44NjEwMTY5NDkxNTI1NDI2fSx7eDowLjIzNDA2Nzc5NjYxMDE2OTUyLCB5OjIuODU1OTMyMjAzMzg5ODMwNH0se3g6MC4yNDA4NDc0NTc2MjcxMTg2OCwgeToyLjg1ODQ3NDU3NjI3MTE4NjV9LHt4OjAuMjU0NDA2Nzc5NjYxMDE2OTQsIHk6Mi44NjAxNjk0OTE1MjU0MjR9LHt4OjAuMjc3Mjg4MTM1NTkzMjIwMzUsIHk6Mi44NjE4NjQ0MDY3Nzk2NjF9LHt4OjAuMzA3Nzk2NjEwMTY5NDkxNTYsIHk6Mi44NjE4NjQ0MDY3Nzk2NjF9LHt4OjAuMzM0MDY3Nzk2NjEwMTY5NSwgeToyLjg2MTg2NDQwNjc3OTY2MX0se3g6MC4zNjIwMzM4OTgzMDUwODQ3NiwgeToyLjg2MTg2NDQwNjc3OTY2MX0se3g6MC4zODQwNjc3OTY2MTAxNjk1LCB5OjIuODYwMTY5NDkxNTI1NDI0fSx7eDowLjQwMTAxNjk0OTE1MjU0MjQsIHk6Mi44NTY3Nzk2NjEwMTY5NDl9LHt4OjAuNDA5NDkxNTI1NDIzNzI4OCwgeToyLjg2MzU1OTMyMjAzMzg5OH0se3g6MC40MTExODY0NDA2Nzc5NjYxNywgeToyLjg1NTA4NDc0NTc2MjcxMTh9LHt4OjAuNDE3OTY2MTAxNjk0OTE1MiwgeToyLjg2MzU1OTMyMjAzMzg5OH0se3g6MC40MjA1MDg0NzQ1NzYyNzExNiwgeToyLjg1NTA4NDc0NTc2MjcxMTh9LHt4OjAuNDI1NTkzMjIwMzM4OTgzMDYsIHk6Mi44NjI3MTE4NjQ0MDY3Nzk1fSx7eDowLjQyOTgzMDUwODQ3NDU3NjI3LCB5OjIuODU0MjM3Mjg4MTM1NTkzfSx7eDowLjQzMjM3Mjg4MTM1NTkzMjIsIHk6Mi44NjQ0MDY3Nzk2NjEwMTd9LHt4OjAuNDM4MzA1MDg0NzQ1NzYyNywgeToyLjg1NTkzMjIwMzM4OTgzMDR9LHt4OjAuNDQxNjk0OTE1MjU0MjM3MywgeToyLjg2NTI1NDIzNzI4ODEzNTZ9LHt4OjAuNDQ1OTMyMjAzMzg5ODMwNTMsIHk6Mi44NTY3Nzk2NjEwMTY5NDl9LHt4OjAuNDU1MjU0MjM3Mjg4MTM1NjMsIHk6Mi44NjAxNjk0OTE1MjU0MjR9LHt4OjAuNDc1NTkzMjIwMzM4OTgzMSwgeToyLjg2MTg2NDQwNjc3OTY2MX0se3g6MC40ODc0NTc2MjcxMTg2NDQwNCwgeToyLjg2MTg2NDQwNjc3OTY2MX0se3g6MC40OTI1NDIzNzI4ODEzNTU5NCwgeToyLjg2NDQwNjc3OTY2MTAxN30se3g6MC40OTg0NzQ1NzYyNzExODY0LCB5OjIuODcyODgxMzU1OTMyMjAzM30se3g6MC41MDAxNjk0OTE1MjU0MjM4LCB5OjIuODg1NTkzMjIwMzM4OTgzfSx7eDowLjUwMDE2OTQ5MTUyNTQyMzgsIHk6Mi45MDQyMzcyODgxMzU1OTMzfSx7eDowLjUwMDE2OTQ5MTUyNTQyMzgsIHk6Mi45Mjg4MTM1NTkzMjIwMzR9LHt4OjAuNTAwMTY5NDkxNTI1NDIzOCwgeToyLjk1NzYyNzExODY0NDA2OH0se3g6MC40OTg0NzQ1NzYyNzExODY0LCB5OjIuOTY0NDA2Nzc5NjYxMDE3fSx7eDowLjUwMTg2NDQwNjc3OTY2MSwgeToyLjk4MjIwMzM4OTgzMDUwODV9LHt4OjAuNTAxMDE2OTQ5MTUyNTQyNCwgeToyLjk5NDkxNTI1NDIzNzI4ODN9LHt4OjAuNTA4NjQ0MDY3Nzk2NjEwMiwgeTozLjAxMjcxMTg2NDQwNjc4fSx7eDowLjUxNTQyMzcyODgxMzU1OTQsIHk6My4wMTc3OTY2MTAxNjk0OTE1fSx7eDowLjUzNDA2Nzc5NjYxMDE2OTUsIHk6My4wMTQ0MDY3Nzk2NjEwMTY4fSx7eDowLjU0NzYyNzExODY0NDA2NzgsIHk6My4wMTE4NjQ0MDY3Nzk2NjF9LHt4OjAuNTU5NDkxNTI1NDIzNzI4OCwgeTozLjAxNjEwMTY5NDkxNTI1NH0se3g6MC41Njg4MTM1NTkzMjIwMzM5LCB5OjMuMDIyMDMzODk4MzA1MDg1fSx7eDowLjU3MjIwMzM4OTgzMDUwODQsIHk6My4wMzM4OTgzMDUwODQ3NDU3fSx7eDowLjU3MjIwMzM4OTgzMDUwODQsIHk6My4wNDkxNTI1NDIzNzI4ODF9LHt4OjAuNTcxMzU1OTMyMjAzMzg5OSwgeTozLjA3Mjg4MTM1NTkzMjIwMzV9LHt4OjAuNTcxMzU1OTMyMjAzMzg5OSwgeTozLjA4OTgzMDUwODQ3NDU3NjN9LHt4OjAuNTcxMzU1OTMyMjAzMzg5OSwgeTozLjEwNTkzMjIwMzM4OTgzMDR9LHt4OjAuNTc1NTkzMjIwMzM4OTgzMSwgeTozLjExMjcxMTg2NDQwNjc3OTV9LHt4OjAuNTg0OTE1MjU0MjM3Mjg4MiwgeTozLjExNzc5NjYxMDE2OTQ5MTZ9LHt4OjAuNjAyNzExODY0NDA2Nzc5NywgeTozLjExOTQ5MTUyNTQyMzcyOX0se3g6MC42MjMwNTA4NDc0NTc2MjcyLCB5OjMuMTE5NDkxNTI1NDIzNzI5fSx7eDowLjY0NTA4NDc0NTc2MjcxMTksIHk6My4xMTUyNTQyMzcyODgxMzU2fSx7eDowLjY1MDE2OTQ5MTUyNTQyMzcsIHk6My4xMDc2MjcxMTg2NDQwNjh9LHt4OjAuNjUwMTY5NDkxNTI1NDIzNywgeTozLjF9LHt4OjAuNjU1MjU0MjM3Mjg4MTM1NiwgeTozLjA3NTQyMzcyODgxMzU1OTV9LHt4OjAuNjU2OTQ5MTUyNTQyMzcyOCwgeTozLjA1NzYyNzExODY0NDA2OH0se3g6MC42NTg2NDQwNjc3OTY2MTAyLCB5OjMuMDIzNzI4ODEzNTU5MzIyfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIxID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC42MzE0NTc2MjcxMTg2NDQxLCB5OjMuMDQ3NzIwMzM4OTgzMDUxfSx7eDowLjY2NDUwODQ3NDU3NjI3MTIsIHk6My4wNTExMTAxNjk0OTE1MjU3fSx7eDowLjY4NTY5NDkxNTI1NDIzNzMsIHk6My4wNDI2MzU1OTMyMjAzMzkzfSx7eDowLjY4ODIzNzI4ODEzNTU5MzMsIHk6My4wMTU1MTY5NDkxNTI1NDI2fSx7eDowLjY2Nzg5ODMwNTA4NDc0NTgsIHk6Mi45OTAwOTMyMjAzMzg5ODM0fSx7eDowLjY3MTI4ODEzNTU5MzIyMDMsIHk6Mi45Njg5MDY3Nzk2NjEwMTd9LHt4OjAuNjgxNDU3NjI3MTE4NjQ0MSwgeToyLjk1MDI2MjcxMTg2NDQwN30se3g6MC42NjcwNTA4NDc0NTc2MjcxLCB5OjIuOTM0MTYxMDE2OTQ5MTUyOH0se3g6MC42MzgyMzcyODgxMzU1OTMyLCB5OjIuOTM2NzAzMzg5ODMwNTA5fSx7eDowLjYzOTA4NDc0NTc2MjcxMTksIHk6Mi45NTAyNjI3MTE4NjQ0MDd9LHt4OjAuNjEwMjcxMTg2NDQwNjc3OSwgeToyLjk2MjEyNzExODY0NDA2OH0se3g6MC42MDc3Mjg4MTM1NTkzMjIxLCB5OjIuOTg1ODU1OTMyMjAzMzl9LHt4OjAuNjI5NzYyNzExODY0NDA2OCwgeTozLjAwMTk1NzYyNzExODY0NH0se3g6MC42MTUzNTU5MzIyMDMzODk4LCB5OjMuMDMwNzcxMTg2NDQwNjc4fSx7eDowLjYyNTUyNTQyMzcyODgxMzYsIHk6My4wNTQ1fSksXG4gIG5ldyBBcnJheSh7eDowLjY1MjY0NDA2Nzc5NjYxMDEsIHk6Mi45MjkwNzYyNzExODY0NDA2fSx7eDowLjY2OTU5MzIyMDMzODk4MywgeToyLjkzNzU1MDg0NzQ1NzYyN30se3g6MC42NzM4MzA1MDg0NzQ1NzYzLCB5OjIuOTY3MjExODY0NDA2Nzc5OH0se3g6MC42NTg1NzYyNzExODY0NDA3LCB5OjIuOTc2NTMzODk4MzA1MDg1fSx7eDowLjYyODkxNTI1NDIzNzI4ODEsIHk6Mi45OTM0ODMwNTA4NDc0NTc3fSx7eDowLjYxMjgxMzU1OTMyMjAzMzksIHk6My4wMDg3MzcyODgxMzU1OTM2fSx7eDowLjYxMDI3MTE4NjQ0MDY3NzksIHk6My4wMzY3MDMzODk4MzA1MDg1fSx7eDowLjYyNjM3Mjg4MTM1NTkzMjIsIHk6My4wNTAyNjI3MTE4NjQ0MDd9LHt4OjAuNjUzNDkxNTI1NDIzNzI4OCwgeTozLjA1MzY1MjU0MjM3Mjg4MTN9LHt4OjAuNjY5NTkzMjIwMzM4OTgzLCB5OjMuMDQxNzg4MTM1NTkzMjIwNn0se3g6MC42NzU1MjU0MjM3Mjg4MTM1LCB5OjMuMDI0ODM4OTgzMDUwODQ3OH0se3g6MC42NTM0OTE1MjU0MjM3Mjg4LCB5OjMuMDA2MTk0OTE1MjU0MjM3NX0se3g6MC42MjI5ODMwNTA4NDc0NTc2LCB5OjIuOTg2NzAzMzg5ODMwNTA4Nn0se3g6MC42MTYyMDMzODk4MzA1MDg1LCB5OjIuOTU4NzM3Mjg4MTM1NTkzM30se3g6MC42NTM0OTE1MjU0MjM3Mjg4LCB5OjIuOTQzNDgzMDUwODQ3NDU4fSx7eDowLjY1NDMzODk4MzA1MDg0NzUsIHk6Mi45MzY3MDMzODk4MzA1MDl9KVxuKTtcbnZhciBwcmVnbmFudFNlbGVjdGVkID0gZmFsc2U7XG52YXIgbm9uUHJlZ25hbnRTZWxlY3RlZCA9IGZhbHNlO1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEFuaW1hdGlvbnNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xudmFyIGNhbnZhcywgY2FudmFzMiwgY2FudmFzMywgY2FudmFzNCwgY2FudmFzNSwgY29udGV4dCwgY29udGV4dDIsIGNvbnRleHQzLCBjb250ZXh0NCwgY29udGV4dDU7XG52YXIgbW9zcXVpdG9zQXJyYXkgPSBuZXcgQXJyYXkoKVxudmFyIHRvdGFsTW9zcXVpdG9zID0gMTAwO1xudmFyIHN0b3BNYWluID0gZmFsc2U7XG52YXIgY3VycmVudE1vc3F1aXRvUGhhc2UgPSAwO1xudmFyIGN1cnJlbnRQaGFzZSA9IDA7XG52YXIgbW9zcXVpdG9zTGVmdCA9IHRvdGFsTW9zcXVpdG9zO1xudmFyIHByZWduYW50TW9zcXVpdG9zID0gMDtcbnZhciBsZWZ0Q292ZXJHbGFzcywgcmlnaHRDb3ZlckdsYXNzLCBsZWZ0Q292ZXJHbGFzc0hvdmVyLCByaWdodENvdmVyR2xhc3NIb3ZlcjtcbnZhciBob3ZlckJlaGF2aW9ySW1hZ2VzID0gbmV3IEFycmF5KFwiaWNvbjFfaG92ZXIucG5nXCIsXCJpY29uMl9ob3Zlci5wbmdcIixcImljb24zX2hvdmVyLnBuZ1wiLFwiaWNvbjRfaG92ZXIucG5nXCIsXCJpY29uNV9ob3Zlci5wbmdcIixcImljb242X2hvdmVyLnBuZ1wiLFwiaWNvbjdfaG92ZXIucG5nXCIsXCJpY29uOF9ob3Zlci5wbmdcIixcImljb245X2hvdmVyLnBuZ1wiKTtcbnZhciBiZWhhdmlvckltYWdlcyA9IG5ldyBBcnJheShcImljb24xLnBuZ1wiLFwiaWNvbjIucG5nXCIsXCJpY29uMy5wbmdcIixcImljb240LnBuZ1wiLFwiaWNvbjUucG5nXCIsXCJpY29uNi5wbmdcIixcImljb243LnBuZ1wiLFwiaWNvbjgucG5nXCIsXCJpY29uOS5wbmdcIik7XG4vKipcbiAgVGhlIGNhbnZhc0ltYWdlIGNsYXNzIHJlcHJlc2VudHMgYW4gZWxlbWVudCBkcmF3biBvbiB0aGUgY2FudmFzLlxuIFxuICBAY2xhc3MgQ2FudmFzSW1hZ2VcbiAgQGNvbnN0cnVjdG9yXG4qL1xuZnVuY3Rpb24gQ2FudmFzSW1hZ2UoaW1nLCB4LCB5LCBhbmdsZSwgc3BlZWQsIHR5cGUsIGN1cnJlbnRJbWFnZSwgcG9zaXRpb25zQXJyYXkpIHtcbiAgdGhpcy5pbWFnZSA9IGltZztcbiAgdGhpcy54ID0geDtcbiAgdGhpcy55ID0geTtcbiAgdGhpcy54QW1vdW50ID0gMDtcbiAgdGhpcy55QW1vdW50ID0gMDtcbiAgdGhpcy53aWR0aCA9IGltZy53aWR0aDtcbiAgdGhpcy5oZWlnaHQgPSBpbWcuaGVpZ2h0O1xuICB0aGlzLnBvc2l0aW9uID0gMTtcbiAgdGhpcy5hbmdsZSA9IGFuZ2xlO1xuICB0aGlzLnNwZWVkID0gc3BlZWQ7XG4gIHRoaXMudHlwZSA9IHR5cGU7XG4gIHRoaXMuY3VycmVudEltYWdlID0gY3VycmVudEltYWdlO1xuICB0aGlzLmZpcnN0VGltZSA9IGZhbHNlO1xuICB0aGlzLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gIHRoaXMucG9zaXRpb25zQXJyYXkgPSBwb3NpdGlvbnNBcnJheTtcbiAgdGhpcy5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDA7XG4gIHRoaXMuZmxpcHBlZEltYWdlcyA9IG5ldyBBcnJheSgpO1xuICByZXR1cm4gdGhpcztcbn1cbi8vU2V0dXAgcmVxdWVzdCBhbmltYXRpb24gZnJhbWVcbnZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbih0aW1lKSB7XG4gIGlmICghc3RvcE1haW4pIHtcbiAgICBtYWluKHRpbWUpO1xuICB9XG4gIFxuICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25GcmFtZSk7XG59XG52YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lSW5pdGlhbGl6YXRpb24gPSBmdW5jdGlvbigpe1xuICB2YXIgbGFzdFRpbWUgPSAwO1xuICB2YXIgdmVuZG9ycyA9IFsnbXMnLCAnbW96JywgJ3dlYmtpdCcsICdvJ107XG4gIGZvcih2YXIgeCA9IDA7IHggPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKyt4KSB7XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgfVxuIFxuICBpZiAoIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2ssIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xuICAgICAgICB2YXIgaWQgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKTsgfSxcbiAgICAgICAgICB0aW1lVG9DYWxsKTtcbiAgICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9O1xuICB9XG4gXG4gIGlmICghd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgfTtcbiAgfVxufVxuLy9TZXR1cCBtYWluIGxvb3BcbnZhciBzZXR1cE1haW5Mb29wID0gZnVuY3Rpb24oKXtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lSW5pdGlhbGl6YXRpb24oKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZXF1ZXN0QW5pbWF0aW9uRnJhbWUpO1xuICAgICAgY3VycmVudFBoYXNlID0gMTtcbiAgICAgICQoJyNwZ1N0ZXAxIC5wZy1idXR0b24nKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgfSwgMzAwMCk7XG59XG4vL0V4ZWN1dGUgbWFpbiBsb29wXG52YXIgbWFpbiA9IGZ1bmN0aW9uKHRpbWUpe1xuICBjb250ZXh0NS5jbGVhclJlY3QoMCwgMCwgY29udGV4dDUuY2FudmFzLndpZHRoLCBjb250ZXh0NS5jYW52YXMuaGVpZ2h0KTtcbiAgLypzd2l0Y2ggKGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlKSB7XG4gICAgY2FzZSAwOiovXG4gICAgICB2YXIgbGVmdEdsYXNzQ29udHJvbEhvdmVyID0gZmFsc2U7XG4gICAgICBpZiAoKChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIpIHx8IChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPCBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhbGVmdENvdmVyR2xhc3NIb3Zlci54RGlyKSB8fCAobGVmdENvdmVyR2xhc3NIb3Zlci54ID09IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLngpKSAmJiBcbiAgICAgICAgICAgKChsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIpIHx8IChsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgPCBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyKSB8fCAobGVmdENvdmVyR2xhc3NIb3Zlci55ID09IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpKSkge1xuXG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uID0gbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA+PSBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPSBsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiAtIDE7XG4gICAgICAgICAgICBpZiAoY3VycmVudFBoYXNlID4gMjApIHtcbiAgICAgICAgICAgICAgbGVmdEdsYXNzQ29udHJvbEhvdmVyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vY29udGV4dDUuZHJhd0ltYWdlKGxlZnRDb3ZlckdsYXNzSG92ZXIuaW1hZ2VbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50SW1hZ2VdLCBwYXJzZUludChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQobGVmdENvdmVyR2xhc3NIb3Zlci55ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjExMyksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMTMpICogKDQyLjAvMTM1LjApKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmIChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci55ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghbGVmdEdsYXNzQ29udHJvbEhvdmVyKSB7XG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54IC0gbGVmdENvdmVyR2xhc3NIb3Zlci54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgLSBsZWZ0Q292ZXJHbGFzc0hvdmVyLnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogcmlnaHRDb3ZlckdsYXNzSG92ZXIuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSByaWdodENvdmVyR2xhc3NIb3Zlci5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueCA9ICgobGVmdENvdmVyR2xhc3NIb3Zlci54ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIpIHx8IChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPCBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54ICYmICFsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIpIHx8IChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPT0gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gbGVmdENvdmVyR2xhc3NIb3Zlci54IDogKGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggPCBsZWZ0Q292ZXJHbGFzc0hvdmVyLngpID8gbGVmdENvdmVyR2xhc3NIb3Zlci54IC0geEFtb3VudCA6IGxlZnRDb3ZlckdsYXNzSG92ZXIueCArIHhBbW91bnQ7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueSA9ICgobGVmdENvdmVyR2xhc3NIb3Zlci55ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIpIHx8IChsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgPCBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55ICYmICFsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIpIHx8IChsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgPT0gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gbGVmdENvdmVyR2xhc3NIb3Zlci55IDogKGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgPCBsZWZ0Q292ZXJHbGFzc0hvdmVyLnkpID8gbGVmdENvdmVyR2xhc3NIb3Zlci55IC0geUFtb3VudCA6IGxlZnRDb3ZlckdsYXNzSG92ZXIueSArIHlBbW91bnQ7XG5cbiAgICAgICAgLy9jb250ZXh0NS5kcmF3SW1hZ2UocmlnaHRDb3ZlckdsYXNzSG92ZXIuaW1hZ2VbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50SW1hZ2VdLCBwYXJzZUludChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQocmlnaHRDb3ZlckdsYXNzSG92ZXIueSAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMTMpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTEzKSAqICg0Mi4wLzEzNS4wKSkpO1xuICAgICAgfVxuXG4gIHZhciByaWdodEdsYXNzQ29udHJvbEhvdmVyID0gZmFsc2U7XG4gICAgICBpZiAoKChyaWdodENvdmVyR2xhc3NIb3Zlci54ID4gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci54RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzSG92ZXIueCA8IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIXJpZ2h0Q292ZXJHbGFzc0hvdmVyLnhEaXIpIHx8IChyaWdodENvdmVyR2xhc3NIb3Zlci54ID09IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmIFxuICAgICAgICAgICAoKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnlEaXIpIHx8IChyaWdodENvdmVyR2xhc3NIb3Zlci55IDwgcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpcikgfHwgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPT0gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55KSkpIHtcblxuICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPSByaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPj0gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPSByaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gLSAxO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRQaGFzZSA+IDIwKSB7XG4gICAgICAgICAgICAgIHJpZ2h0R2xhc3NDb250cm9sSG92ZXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy9jb250ZXh0NS5kcmF3SW1hZ2UocmlnaHRDb3ZlckdsYXNzSG92ZXIuaW1hZ2VbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudEltYWdlXSwgcGFyc2VJbnQocmlnaHRDb3ZlckdsYXNzSG92ZXIueCAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChyaWdodENvdmVyR2xhc3NIb3Zlci55ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjExMyksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMTMpICogKDQyLjAvMTM1LjApKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmIChyaWdodENvdmVyR2xhc3NIb3Zlci54ID4gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci54RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyaWdodENvdmVyR2xhc3NIb3Zlci55ID4gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci55RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXJpZ2h0R2xhc3NDb250cm9sSG92ZXIpIHtcbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCAtIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMocmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55IC0gcmlnaHRDb3ZlckdsYXNzSG92ZXIueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiByaWdodENvdmVyR2xhc3NIb3Zlci5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gcmlnaHRDb3ZlckdsYXNzSG92ZXIuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogcmlnaHRDb3ZlckdsYXNzSG92ZXIuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueCA9ICgocmlnaHRDb3ZlckdsYXNzSG92ZXIueCA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCAmJiByaWdodENvdmVyR2xhc3NIb3Zlci54RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzSG92ZXIueCA8IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpcikgfHwgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPT0gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSkgPyByaWdodENvdmVyR2xhc3NIb3Zlci54IDogKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCA8IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLngpID8gcmlnaHRDb3ZlckdsYXNzSG92ZXIueCAtIHhBbW91bnQgOiByaWdodENvdmVyR2xhc3NIb3Zlci54ICsgeEFtb3VudDtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueSA9ICgocmlnaHRDb3ZlckdsYXNzSG92ZXIueSA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSAmJiByaWdodENvdmVyR2xhc3NIb3Zlci55RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzSG92ZXIueSA8IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpcikgfHwgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPT0gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55KSkgPyByaWdodENvdmVyR2xhc3NIb3Zlci55IDogKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSA8IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkpID8gcmlnaHRDb3ZlckdsYXNzSG92ZXIueSAtIHlBbW91bnQgOiByaWdodENvdmVyR2xhc3NIb3Zlci55ICsgeUFtb3VudDtcblxuICAgICAgICAvL2NvbnRleHQ1LmRyYXdJbWFnZShyaWdodENvdmVyR2xhc3NIb3Zlci5pbWFnZVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50SW1hZ2VdLCBwYXJzZUludChyaWdodENvdmVyR2xhc3NIb3Zlci54ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTEzKSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjExMykgKiAoNDIuMC8xMzUuMCkpKTtcbiAgICAgIH1cblxuICBjb250ZXh0My5jbGVhclJlY3QoMCwgMCwgY29udGV4dDMuY2FudmFzLndpZHRoLCBjb250ZXh0My5jYW52YXMuaGVpZ2h0KTtcbiAgLypzd2l0Y2ggKGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlKSB7XG4gICAgY2FzZSAwOiovXG4gICAgICB2YXIgbGVmdEdsYXNzQ29udHJvbCA9IGZhbHNlO1xuICAgICAgaWYgKCgobGVmdENvdmVyR2xhc3MueCA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3MueERpcikgfHwgKGxlZnRDb3ZlckdsYXNzLnggPCBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFsZWZ0Q292ZXJHbGFzcy54RGlyKSB8fCAobGVmdENvdmVyR2xhc3MueCA9PSBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLngpKSAmJiBcbiAgICAgICAgICAgKChsZWZ0Q292ZXJHbGFzcy55ID4gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyKSB8fCAobGVmdENvdmVyR2xhc3MueSA8IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWxlZnRDb3ZlckdsYXNzLnlEaXIpIHx8IChsZWZ0Q292ZXJHbGFzcy55ID09IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkpKSB7XG5cbiAgICAgICAgbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID0gbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAobGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID49IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID0gbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uIC0gMTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UGhhc2UgPiAyMCkge1xuICAgICAgICAgICAgICBsZWZ0R2xhc3NDb250cm9sID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQzLmRyYXdJbWFnZShsZWZ0Q292ZXJHbGFzcy5pbWFnZVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50SW1hZ2VdLCBwYXJzZUludChsZWZ0Q292ZXJHbGFzcy54ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGxlZnRDb3ZlckdsYXNzLnkgKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTI1KSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjEyNSkgKiAoMjI0LjAvMTQ5LjApKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmIChsZWZ0Q292ZXJHbGFzcy54ID4gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChsZWZ0Q292ZXJHbGFzcy55ID4gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWxlZnRHbGFzc0NvbnRyb2wpIHtcbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCAtIGxlZnRDb3ZlckdsYXNzLngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMobGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55IC0gbGVmdENvdmVyR2xhc3MueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBsZWZ0Q292ZXJHbGFzcy5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gbGVmdENvdmVyR2xhc3Muc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogbGVmdENvdmVyR2xhc3Muc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGxlZnRDb3ZlckdsYXNzLnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgbGVmdENvdmVyR2xhc3MueCA9ICgobGVmdENvdmVyR2xhc3MueCA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBsZWZ0Q292ZXJHbGFzcy54RGlyKSB8fCAobGVmdENvdmVyR2xhc3MueCA8IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhbGVmdENvdmVyR2xhc3MueERpcikgfHwgKGxlZnRDb3ZlckdsYXNzLnggPT0gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54KSkgPyBsZWZ0Q292ZXJHbGFzcy54IDogKGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCA8IGxlZnRDb3ZlckdsYXNzLngpID8gbGVmdENvdmVyR2xhc3MueCAtIHhBbW91bnQgOiBsZWZ0Q292ZXJHbGFzcy54ICsgeEFtb3VudDtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueSA9ICgobGVmdENvdmVyR2xhc3MueSA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBsZWZ0Q292ZXJHbGFzcy55RGlyKSB8fCAobGVmdENvdmVyR2xhc3MueSA8IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhbGVmdENvdmVyR2xhc3MueURpcikgfHwgKGxlZnRDb3ZlckdsYXNzLnkgPT0gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSkgPyBsZWZ0Q292ZXJHbGFzcy55IDogKGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSA8IGxlZnRDb3ZlckdsYXNzLnkpID8gbGVmdENvdmVyR2xhc3MueSAtIHlBbW91bnQgOiBsZWZ0Q292ZXJHbGFzcy55ICsgeUFtb3VudDtcblxuICAgICAgICBjb250ZXh0My5kcmF3SW1hZ2UobGVmdENvdmVyR2xhc3MuaW1hZ2VbbGVmdENvdmVyR2xhc3MuY3VycmVudEltYWdlXSwgcGFyc2VJbnQobGVmdENvdmVyR2xhc3MueCAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChsZWZ0Q292ZXJHbGFzcy55ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjEyNSksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMjUpICogKDIyNC4wLzE0OS4wKSkpO1xuICAgICAgfVxuICAgIC8qYnJlYWs7XG4gICAgY2FzZSAxOlxuICAgIGJyZWFrO1xuICAgIGNhc2UgMjpcbiAgICBicmVhaztcbiAgfSovXG4gICAgdmFyIHJpZ2h0R2xhc3NDb250cm9sID0gZmFsc2U7XG4gICAgICBpZiAoKChyaWdodENvdmVyR2xhc3MueCA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3MueERpcikgfHwgKHJpZ2h0Q292ZXJHbGFzcy54IDwgcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFyaWdodENvdmVyR2xhc3MueERpcikgfHwgKHJpZ2h0Q292ZXJHbGFzcy54ID09IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgXG4gICAgICAgICAgICgocmlnaHRDb3ZlckdsYXNzLnkgPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIpIHx8IChyaWdodENvdmVyR2xhc3MueSA8IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhcmlnaHRDb3ZlckdsYXNzLnlEaXIpIHx8IChyaWdodENvdmVyR2xhc3MueSA9PSByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkpKSB7XG5cbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID49IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gPSByaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uIC0gMTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UGhhc2UgPiAyMCkge1xuICAgICAgICAgICAgICBsZWZ0R2xhc3NDb250cm9sID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQzLmRyYXdJbWFnZShyaWdodENvdmVyR2xhc3MuaW1hZ2VbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRJbWFnZV0sIHBhcnNlSW50KHJpZ2h0Q292ZXJHbGFzcy54ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KHJpZ2h0Q292ZXJHbGFzcy55ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjEyNSksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMjUpICogKDIyNC4wLzE0OS4wKSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAocmlnaHRDb3ZlckdsYXNzLnggPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyaWdodENvdmVyR2xhc3MueSA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghcmlnaHRHbGFzc0NvbnRyb2wpIHtcbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54IC0gcmlnaHRDb3ZlckdsYXNzLngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMocmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgLSByaWdodENvdmVyR2xhc3MueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiByaWdodENvdmVyR2xhc3Muc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IHJpZ2h0Q292ZXJHbGFzcy5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiByaWdodENvdmVyR2xhc3Muc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IHJpZ2h0Q292ZXJHbGFzcy5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54ID0gKChyaWdodENvdmVyR2xhc3MueCA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54ICYmIHJpZ2h0Q292ZXJHbGFzcy54RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzLnggPCByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhcmlnaHRDb3ZlckdsYXNzLnhEaXIpIHx8IChyaWdodENvdmVyR2xhc3MueCA9PSByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gcmlnaHRDb3ZlckdsYXNzLnggOiAocmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggPCByaWdodENvdmVyR2xhc3MueCkgPyByaWdodENvdmVyR2xhc3MueCAtIHhBbW91bnQgOiByaWdodENvdmVyR2xhc3MueCArIHhBbW91bnQ7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy55ID0gKChyaWdodENvdmVyR2xhc3MueSA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55ICYmIHJpZ2h0Q292ZXJHbGFzcy55RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzLnkgPCByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhcmlnaHRDb3ZlckdsYXNzLnlEaXIpIHx8IChyaWdodENvdmVyR2xhc3MueSA9PSByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gcmlnaHRDb3ZlckdsYXNzLnkgOiAocmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgPCByaWdodENvdmVyR2xhc3MueSkgPyByaWdodENvdmVyR2xhc3MueSAtIHlBbW91bnQgOiByaWdodENvdmVyR2xhc3MueSArIHlBbW91bnQ7XG5cbiAgICAgICAgY29udGV4dDMuZHJhd0ltYWdlKHJpZ2h0Q292ZXJHbGFzcy5pbWFnZVtyaWdodENvdmVyR2xhc3MuY3VycmVudEltYWdlXSwgcGFyc2VJbnQocmlnaHRDb3ZlckdsYXNzLnggKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQocmlnaHRDb3ZlckdsYXNzLnkgKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTI1KSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjEyNSkgKiAoMjI0LjAvMTQ5LjApKSk7XG4gICAgICB9XG4gIC8vIGNsZWFyIHRoZSBjYW52YXNcbiAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY29udGV4dC5jYW52YXMud2lkdGgsIGNvbnRleHQuY2FudmFzLmhlaWdodCk7XG5cbiAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICBzd2l0Y2ggKGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgIGNhc2UgMjpcbiAgICAgIGNhc2UgNDpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTA6XG4gICAgICBjYXNlIDEyOlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTY6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMDpcbiAgICAgIGNhc2UgMjI6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgZWxlbWVudC5jdXJyZW50SW1hZ2UgPSBlbGVtZW50LmN1cnJlbnRJbWFnZSArIDE7XG4gICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRJbWFnZSA+PSBlbGVtZW50LmltYWdlLmxlbmd0aCkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudEltYWdlID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxOlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UzLmxlbmd0aF07XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSBNYXRoLm1heCgwLjA4NixNYXRoLm1pbigwLjEzNSwgYXV4RWxlbWVudC54KSlcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gTWF0aC5tYXgoMC41NTUsTWF0aC5taW4oMC43MTUsIGF1eEVsZW1lbnQueSkpXG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjdXJyZW50UGhhc2UgPSAyO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT0gbW9zcXVpdG9zTGVmdCAtIDEpIHtcbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMSAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxIHNlbGVjdCcpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAyO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTUubGVuZ3RoXTtcblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKX07XG4gICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IE1hdGgubWF4KDAuMDc2LE1hdGgubWluKDAuMTUsIGF1eEVsZW1lbnQueCkpXG4gICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IE1hdGgubWF4KDAuNzgsTWF0aC5taW4oMC44NiwgYXV4RWxlbWVudC55KSlcbiAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjEzIHx8IGF1eEVsZW1lbnQueCA8PSAwLjA4OCkge1xuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMC43OCkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gYXV4RWxlbWVudC55ICsgMC4wMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXV4RWxlbWVudC55ID49IDAuODIpIHtcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IGF1eEVsZW1lbnQueSAtIDAuMDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vZWxlbWVudC54ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICAgICAgICAgIC8vZWxlbWVudC55ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDQ7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjdXJyZW50UGhhc2UgPSAzO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT0gbW9zcXVpdG9zTGVmdCAtIDEpIHtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAyIC5wZy1idXR0b25cIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDJcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTdbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3Lmxlbmd0aF07XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54ID49IDAuNDIgfHwgYXV4RWxlbWVudC54IDw9IDAuMzkpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDEuMjA2NjEwMTY5NDkxNTI2KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjIwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhdXhFbGVtZW50LnkgPj0gMS4yOCkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4yODtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjQ5KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSAwLjQ5XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPD0gMC4zNikge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC4zNlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55ID49IDEuMykge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4zXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS4xOSkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4xOVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgLy9lbGVtZW50LnggPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54O1xuICAgICAgICAgICAgLy9lbGVtZW50LnkgPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55O1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gNjtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICAvL2VsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5Lmxlbmd0aF07XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyIC5wZy1idXR0b24nKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjInKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG5cbiAgICAgICAgICAgICAgJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpLnJlbW92ZUNsYXNzKFwiZGlzYWJsZWQtb3B0aW9uXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5Lmxlbmd0aF07XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjg4NSB8fCBhdXhFbGVtZW50LnggPD0gMC44MDYpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDEuNDg3KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjQ4NztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXV4RWxlbWVudC55ID49IDEuNTU4KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjU1ODtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjg5OCkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC44OTg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPD0gMC43OSkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC43OTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA+PSAxLjU3KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjU3O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDEuNDcpIHtcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IDEuNDc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICAvL2VsZW1lbnQueCA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLng7XG4gICAgICAgICAgICAvL2VsZW1lbnQueSA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA4O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDk6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTFbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT0gbW9zcXVpdG9zTGVmdCAtIDEpIHtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAzIC5wZy1idXR0b25cIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDNcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTEubGVuZ3RoXTtcblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSAtIDAuMDE4LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTA7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTE6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT0gbW9zcXVpdG9zTGVmdCAtIDEpIHtcbiAgICAgICAgICAgICAgJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpLnJlbW92ZUNsYXNzKFwiZGlzYWJsZWQtb3B0aW9uXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzIC5wZy1idXR0b24nKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApIC0gMC4wMX07XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDEyO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEzOlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTVbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApIC0gMC4wMX07XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE0O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE1OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTdbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTY7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTc6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE5Lmxlbmd0aF07XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTg7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTk6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIxLmxlbmd0aF07XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjA7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjE6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vIFRPIERPXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdKVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKHt4OiBlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLnggKyAoKE1hdGgucmFuZG9tKCkgKiAwLjA2NikgLSAwLjAzMyksIHk6IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0ueSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDY2KSAtIDAuMDMzKX0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vZWxlbWVudC54ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICAgICAgICAgIC8vZWxlbWVudC55ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDIyO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIFxuICB9KTtcbn1cbi8vQW5pbWF0ZSBiZWhhdmlvciBlbGVtZW50c1xudmFyIGFuaW1hdGVCZWhhdmlvckVsZW1lbnRzID0gZnVuY3Rpb24oKSB7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VlbnRlclwiLCBcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb246bm90KC5kaXNhYmxlZC1vcHRpb24pXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmICghJCh0aGlzKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICAkKHRoaXMpLmZpbmQoXCJpbWdcIikuYXR0cihcInNyY1wiLCBcImh0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvXCIgKyBob3ZlckJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gIH0pO1xuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlbGVhdmVcIiwgXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKVwiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoISQodGhpcykuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkge1xuICAgICAgJCh0aGlzKS5maW5kKFwiaW1nXCIpLmF0dHIoXCJzcmNcIiwgXCJodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL1wiICsgYmVoYXZpb3JJbWFnZXNbJCh0aGlzKS5hdHRyKFwiZGF0YS1pbmRleFwiKV0pO1xuICAgIH1cbiAgfSk7XG59O1xuLy9BbmltYXRlIHByZWduYW5jeSBlbGVtZW50c1xudmFyIGFuaW1hdGVFbGVtZW50c1ByZWduYW5jeSA9IGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlZW50ZXJcIiwgXCIucGdTdGVwX19wcmVnbmFuY3ktb2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgaWYgKGN1cnJlbnRQaGFzZSA9PSAyMCkge1xuICAgIGlmIChsZWZ0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSAhPSAyKSB7XG4gICAgICBsZWZ0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDFcbiAgICAgIGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuMjkxLHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKX0sIHt4OjAuMjkxLHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKSAtIDAuMDA1fSk7XG4gICAgICBsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzLnggPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzLnkgPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuMjk4LHk6KDM1OTMuMC9jYW52YXMzLndpZHRoKX0sIHt4OjAuMjk4LHk6KDM1OTMuMC9jYW52YXMzLndpZHRoKSAtIDAuMDA1fSk7XG4gICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci54ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzSG92ZXIueSA+IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VsZWF2ZVwiLCBcIi5wZ1N0ZXBfX3ByZWduYW5jeS1va1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgaWYgKGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlICE9IDIpIHtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMFxuICAgICAgbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC4yOTEseTooMzQxNS4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9LCB7eDowLjI5MSx5OigzNDE1LjAvY2FudmFzMy53aWR0aCl9KTtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MueCA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MueSA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC4yOTgseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9LCB7eDowLjI5OCx5OigzNTkzLjAvY2FudmFzMy53aWR0aCl9KTtcbiAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgIGlmIChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci55ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB9KTtcbiAgJChkb2N1bWVudCkub24oXCJtb3VzZWVudGVyXCIsIFwiLnBnU3RlcF9fcHJlZ25hbmN5LWtvXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICBpZiAocmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlICE9IDIpIHtcbiAgICAgIHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDFcbiAgICAgIHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDowLjU5NzUseTooMzQxNS4wL2NhbnZhczMud2lkdGgpfSwge3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKSAtIDAuMDA1fSk7XG4gICAgICByaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgIGlmIChyaWdodENvdmVyR2xhc3MueCA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy55ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuNTk3NSx5OigzNTkzLjAvY2FudmFzMy53aWR0aCl9LCB7eDowLjU5NzUseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9KTtcbiAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzSG92ZXIueCA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzSG92ZXIueSA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpciA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VsZWF2ZVwiLCBcIi5wZ1N0ZXBfX3ByZWduYW5jeS1rb1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSAhPSAyKSB7XG4gICAgICByaWdodENvdmVyR2xhc3MuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAwXG4gICAgICByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKSAtIDAuMDA1fSwge3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKX0pO1xuICAgICAgcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzLnggPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChyaWdodENvdmVyR2xhc3MueSA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDowLjU5NzUseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9LCB7eDowLjU5NzUseTooMzU5My4wL2NhbnZhczMud2lkdGgpfSk7XG4gICAgICByaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICB9XG4gIH0pO1xufVxuLy9TZXR1cCBjYW52YXNcbnZhciBzZXR1cENhbnZhcyA9IGZ1bmN0aW9uKCl7XG4gIGNhbnZhczIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWxlbWVudHNDYW52YXMnKTtcbiAgY2FudmFzMi53aWR0aCA9ICQoJy5wZ0NoYXJ0Jykud2lkdGgoKTtcbiAgY2FudmFzMi5oZWlnaHQgPSAkKCcucGdDaGFydCcpLmhlaWdodCgpICsgMDtcbiAgY2FudmFzMi5zdHlsZS53aWR0aCAgPSBjYW52YXMyLndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczIuc3R5bGUuaGVpZ2h0ID0gY2FudmFzMi5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDIgPSBjYW52YXMyLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQyLmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNhbnZhczMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYW5pbWF0aW9uQ2FudmFzJyk7XG4gIGNhbnZhczMud2lkdGggPSAkKCcucGdDaGFydCcpLndpZHRoKCk7XG4gIGNhbnZhczMuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQnKS5oZWlnaHQoKTtcbiAgY2FudmFzMy5zdHlsZS53aWR0aCAgPSBjYW52YXMzLndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczMuc3R5bGUuaGVpZ2h0ID0gY2FudmFzMy5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDMgPSBjYW52YXMzLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQzLmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb3NxdWl0b3NDYW52YXMnKTtcbiAgY2FudmFzLndpZHRoID0gJCgnLnBnQ2hhcnQnKS53aWR0aCgpO1xuICBjYW52YXMuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQnKS5oZWlnaHQoKTtcbiAgY2FudmFzLnN0eWxlLndpZHRoICA9IGNhbnZhcy53aWR0aC50b1N0cmluZygpICsgXCJweFwiO1xuICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gY2FudmFzLmhlaWdodC50b1N0cmluZygpICsgXCJweFwiO1xuICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5cbiAgY2FudmFzNCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdob3ZlckNhbnZhcycpO1xuICBjYW52YXM0LndpZHRoID0gJCgnLnBnQ2hhcnQnKS53aWR0aCgpO1xuICBjYW52YXM0LmhlaWdodCA9ICQoJy5wZ0NoYXJ0JykuaGVpZ2h0KCk7XG4gIGNhbnZhczQuc3R5bGUud2lkdGggID0gY2FudmFzNC53aWR0aC50b1N0cmluZygpICsgXCJweFwiO1xuICBjYW52YXM0LnN0eWxlLmhlaWdodCA9IGNhbnZhczQuaGVpZ2h0LnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNvbnRleHQ0ID0gY2FudmFzNC5nZXRDb250ZXh0KCcyZCcpO1xuICBjb250ZXh0NC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcblxuICBjYW52YXM1ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dsYXNzQW5pbWF0aW9uQ2FudmFzJyk7XG4gIGNhbnZhczUud2lkdGggPSAkKCcucGdDaGFydCcpLndpZHRoKCk7XG4gIGNhbnZhczUuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQnKS5oZWlnaHQoKTtcbiAgY2FudmFzNS5zdHlsZS53aWR0aCAgPSBjYW52YXM1LndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczUuc3R5bGUuaGVpZ2h0ID0gY2FudmFzNS5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDUgPSBjYW52YXM1LmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQ1LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICBcbiAgY29udGV4dDIuZmlsbFN0eWxlID0gXCIjZjhmOGY4XCI7XG4gIGNvbnRleHQyLmZpbGxSZWN0KDAsIGdldE9mZnNldCgkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxJylbMF0pLnRvcCAtIGdldE9mZnNldCgkKFwiLnBnQXJ0aWNsZVwiKVswXSkudG9wIC0gJCgnI25hdi1iYXInKS5oZWlnaHQoKSwgY2FudmFzMi53aWR0aCwgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLmhlaWdodCgpKTtcbiAgY29udGV4dDIuZmlsbFJlY3QoMCwgZ2V0T2Zmc2V0KCQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjInKVswXSkudG9wIC0gZ2V0T2Zmc2V0KCQoXCIucGdBcnRpY2xlXCIpWzBdKS50b3AgLSAkKCcjbmF2LWJhcicpLmhlaWdodCgpLCBjYW52YXMyLndpZHRoLCAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykuaGVpZ2h0KCkpO1xuICBjb250ZXh0Mi5maWxsUmVjdCgwLCBnZXRPZmZzZXQoJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMycpWzBdKS50b3AgLSBnZXRPZmZzZXQoJChcIi5wZ0FydGljbGVcIilbMF0pLnRvcCAtICQoJyNuYXYtYmFyJykuaGVpZ2h0KCksIGNhbnZhczIud2lkdGgsICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5oZWlnaHQoKSk7XG5cbiAgdmFyIHBpY3R1cmUxID0gbmV3IEltYWdlKCk7XG4gIHBpY3R1cmUxLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dDIuZHJhd0ltYWdlKHBpY3R1cmUxLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC41NSkgLSAoY2FudmFzLndpZHRoICogMC4wNjQpKSwgMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC41NSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjU1KSAqICg1MzYuMC82NTYuMCkpKTtcbiAgICAgIHZhciBwaWN0dXJlMUhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgICBwaWN0dXJlMUhvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZShwaWN0dXJlMUhvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC41NSkgLSAoY2FudmFzLndpZHRoICogMC4wNjQpKSwgMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC41NSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjU1KSAqICg1MzYuMC82NTYuMCkpKTtcbiAgICAgIH0pO1xuICAgICAgcGljdHVyZTFIb3Zlci5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90ZXJyYXJpdW0taG92ZXIucG5nJztcblxuICAgICAgdmFyIHR1YmUxID0gbmV3IEltYWdlKCk7XG4gICAgICB0dWJlMS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTEsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjU1KSAtIChjYW52YXMud2lkdGggKiAwLjA1ODUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMzYwNTEpKSwgMjM1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjM2MDUxKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMzYwNTEpICogKDMwMC4wLzQzMC4wKSkpO1xuICAgICAgfSk7XG4gICAgICB0dWJlMS5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlMS5wbmcnO1xuICB9KTtcbiAgcGljdHVyZTEuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdGVycmFyaXVtLnBuZyc7XG5cbiAgdmFyIHR1YmUyID0gbmV3IEltYWdlKCk7XG4gIHR1YmUyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmUyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjAzNDUpLCA1MzAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTQ2NzIpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC4xNDY3MikgKiAoNjIyLjAvMTc1LjApKSk7XG4gIH0pO1xuICB0dWJlMi5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlMi5wbmcnO1xuXG4gIHZhciB0dWJlMyA9IG5ldyBJbWFnZSgpO1xuICB0dWJlMy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQyLmRyYXdJbWFnZSh0dWJlMywgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4wNTQ1KSwgMTExNSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC44MDczKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuODA3MykgKiAoNTE3LjAvOTYzLjApKSk7XG4gICAgdmFyIHR1YmUzSG92ZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICB0dWJlM0hvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb250ZXh0NC5kcmF3SW1hZ2UodHViZTNIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4wNTQ1KSwgMTExNSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC44MDczKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuODA3MykgKiAoNTE3LjAvOTYzLjApKSk7XG4gICAgfSk7XG4gICAgdHViZTNIb3Zlci5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlMy1ob3Zlci5wbmcnO1xuICB9KTtcbiAgdHViZTMuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTMucG5nJztcblxuICB2YXIgdHViZTUgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTUuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTUsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjgwMTUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMTMzKSksIDIxMjAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuODAxNSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjgwMTUpICogKDUxMC4wLzk1Ni4wKSkpO1xuICAgIFxuICAgIHZhciB0dWJlNUhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTVIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29udGV4dDQuZHJhd0ltYWdlKHR1YmU1SG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjgwMTUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMTMzKSksIDIxMjAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuODAxNSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjgwMTUpICogKDUxMC4wLzk1Ni4wKSkpO1xuICAgIH0pO1xuICAgIHR1YmU1SG92ZXIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTUtaG92ZXIucG5nJzsgIFxuXG4gICAgdmFyIHR1YmU0ID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnRleHQyLmRyYXdJbWFnZSh0dWJlNCwgcGFyc2VJbnQoY2FudmFzLndpZHRoIC0gKGNhbnZhcy53aWR0aCAqIDAuMTM1OCkgLSAoY2FudmFzLndpZHRoICogMC4wOCkpIC0gMywgMTYxOCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMzU4KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTM1OCkgKiAoNjAwLjAvMTYyLjApKSk7XG4gICAgICB2YXIgdHViZTRIb3ZlciA9IG5ldyBJbWFnZSgpO1xuICAgICAgdHViZTRIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb250ZXh0NC5kcmF3SW1hZ2UodHViZTRIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoIC0gKGNhbnZhcy53aWR0aCAqIDAuMTM1OCkgLSAoY2FudmFzLndpZHRoICogMC4wOCkpIC0gMywgMTYxOCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMzU4KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTM1OCkgKiAoNjAwLjAvMTYyLjApKSk7XG4gICAgICB9KTtcbiAgICAgIHR1YmU0SG92ZXIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTQtaG92ZXIucG5nJztcbiAgICB9KTtcbiAgICB0dWJlNC5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlNC5wbmcnO1xuXG4gIH0pO1xuICB0dWJlNS5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlNS5wbmcnOyAgXG5cbiAgdmFyIHR1YmU2ID0gbmV3IEltYWdlKCk7XG4gIHR1YmU2LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmU2LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjAyOCksIDI2MjEsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTM4MyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjEzODMpICogKDU5Mi4wLzE2NS4wKSkpO1xuICAgIHZhciB0dWJlNkhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTZIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29udGV4dDQuZHJhd0ltYWdlKHR1YmU2SG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDI4KSwgMjYyMSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMzgzKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTM4MykgKiAoNTkyLjAvMTY1LjApKSk7XG4gICAgfSk7XG4gICAgdHViZTZIb3Zlci5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlNi1ob3Zlci5wbmcnO1xuICB9KTtcbiAgdHViZTYuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTYucG5nJztcblxuICB2YXIgdHViZTcgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTcsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDYpLCAzMjAwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjY3MDcpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC42NzA3KSAqICg1NTIuMC84MDAuMCkpKTtcbiAgICB2YXIgY292ZXJHbGFzcyA9IG5ldyBJbWFnZSgpO1xuICAgIGNvdmVyR2xhc3MuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnRleHQzLmRyYXdJbWFnZShjb3ZlckdsYXNzLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4yOTEpLCAzNDE1LCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMjUpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTI1KSAqICgyMjQuMC8xNDkuMCkpKTtcbiAgICAgIGNvbnRleHQzLmRyYXdJbWFnZShjb3ZlckdsYXNzLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC41OTc1KSwgMzQxNSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTI1KSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjEyNSkgKiAoMjI0LjAvMTQ5LjApKSk7XG4gICAgICBcbiAgICAgIGxlZnRDb3ZlckdsYXNzID0gbmV3IENhbnZhc0ltYWdlKFtjb3ZlckdsYXNzXSwgMC4yOTEsICgzNDE1LjAvY2FudmFzMy53aWR0aCksIDAsIDAuMDAwNSwgMCwgMCwgbmV3IEFycmF5KHt4OjAuMjkxLHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKX0pKTtcbiAgICAgIHJpZ2h0Q292ZXJHbGFzcyA9IG5ldyBDYW52YXNJbWFnZShbY292ZXJHbGFzc10sIDAuNTk3NSwgKDM0MTUuMC9jYW52YXMzLndpZHRoKSwgMCwgMC4wMDA1LCAwLCAwLCBuZXcgQXJyYXkoe3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKX0pKVxuXG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MgPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVswXS54KSB7XG4gICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzLnkgPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVswXS55KSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChyaWdodENvdmVyR2xhc3MgPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbMF0ueCkge1xuICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy55ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5WzBdLnkpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHZhciB0dWJlN0hvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgICB0dWJlN0hvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZSh0dWJlN0hvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjA2KSwgMzIwMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC42NzA3KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNjcwNykgKiAoNTUyLjAvODAwLjApKSk7XG4gICAgICAgIFxuICAgICAgICBjb3ZlckdsYXNzSG92ZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgY292ZXJHbGFzc0hvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy9jb250ZXh0NS5kcmF3SW1hZ2UoY292ZXJHbGFzc0hvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjI5OCksIDM1OTMsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTEzKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTEzKSAqICg0Mi4wLzEzNS4wKSkpO1xuICAgICAgICAgIC8vY29udGV4dDUuZHJhd0ltYWdlKGNvdmVyR2xhc3NIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC42MDUpLCAzNTkzLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjExMyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjExMykgKiAoNDIuMC8xMzUuMCkpKTtcbiAgICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyID0gbmV3IENhbnZhc0ltYWdlKFtjb3ZlckdsYXNzSG92ZXJdLCAwLjI5OCwgKDM1OTMuMC9jYW52YXMzLndpZHRoKSwgMCwgMC4wMDA1LCAwLCAwLCBuZXcgQXJyYXkoe3g6MC4yOTgseTooMzU5My4wL2NhbnZhczMud2lkdGgpfSkpO1xuICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyID0gbmV3IENhbnZhc0ltYWdlKFtjb3ZlckdsYXNzSG92ZXJdLCAwLjYwNSwgKDM1OTMuMC9jYW52YXMzLndpZHRoKSwgMCwgMC4wMDA1LCAwLCAwLCBuZXcgQXJyYXkoe3g6MC42MDUseTooMzU5My4wL2NhbnZhczMud2lkdGgpfSkpXG4gICAgICAgIH0pO1xuICAgICAgICBjb3ZlckdsYXNzSG92ZXIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvY292ZXItZ2xhc3MtYW5pbWF0ZS5wbmcnO1xuXG4gICAgICB9KTtcbiAgICAgIHR1YmU3SG92ZXIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTctaG92ZXIucG5nJztcbiAgICB9KTtcbiAgICBjb3ZlckdsYXNzLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL2NvdmVyLWdsYXNzLnBuZyc7XG4gIH0pO1xuICB0dWJlNy5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlNy5wbmcnO1xuXG4gIHZhciBjaGFydCA9IG5ldyBJbWFnZSgpO1xuICBjaGFydC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQyLmRyYXdJbWFnZShjaGFydCwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNSkgLSAoY2FudmFzLndpZHRoICogMC43NyAqIDAuNSkpLCAzNzU1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjc3KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNzcpICogKDMxNS4wLzkxMi4wKSkpO1xuICB9KTtcbiAgY2hhcnQuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvbGFzdC1jaGFydC5wbmcnO1xuXG4gIHZhciBjaGFydDIgPSBuZXcgSW1hZ2UoKTtcbiAgY2hhcnQyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dDIuZHJhd0ltYWdlKGNoYXJ0MiwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNSkgLSAoY2FudmFzLndpZHRoICogMC43MDI2ICogMC41KSksIDQwNTUsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuNzAyNiksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjcwMjYpICogKDE4OC4wLzgzOC4wKSkpO1xuICB9KTtcbiAgY2hhcnQyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL2dyYXBoaWMucG5nJztcbn1cbi8vRHJhdyBhbiBpbWFnZSByb3RhdGVkXG52YXIgVE9fUkFESUFOUyA9IE1hdGguUEkvMTgwOyBcbmZ1bmN0aW9uIGRyYXdSb3RhdGVkSW1hZ2UoaW1hZ2UsIHgsIHksIGFuZ2xlLCBhdXhDdHgpIHsgXG4gXG4gIC8vIHNhdmUgdGhlIGN1cnJlbnQgY28tb3JkaW5hdGUgc3lzdGVtIFxuICAvLyBiZWZvcmUgd2Ugc2NyZXcgd2l0aCBpdFxuICBhdXhDdHguc2F2ZSgpOyBcbiBcbiAgLy8gbW92ZSB0byB0aGUgbWlkZGxlIG9mIHdoZXJlIHdlIHdhbnQgdG8gZHJhdyBvdXIgaW1hZ2VcbiAgYXV4Q3R4LnRyYW5zbGF0ZSh4ICsgKGltYWdlLndpZHRoLzIpLCB5ICsgKGltYWdlLmhlaWdodC8yKSk7XG4gXG4gIC8vIHJvdGF0ZSBhcm91bmQgdGhhdCBwb2ludCwgY29udmVydGluZyBvdXIgXG4gIC8vIGFuZ2xlIGZyb20gZGVncmVlcyB0byByYWRpYW5zIFxuICBhdXhDdHgucm90YXRlKGFuZ2xlKTtcbiBcbiAgLy8gZHJhdyBpdCB1cCBhbmQgdG8gdGhlIGxlZnQgYnkgaGFsZiB0aGUgd2lkdGhcbiAgLy8gYW5kIGhlaWdodCBvZiB0aGUgaW1hZ2UgXG4gIGF1eEN0eC5kcmF3SW1hZ2UoaW1hZ2UsIC0oaW1hZ2Uud2lkdGgvMiksIC0oaW1hZ2UuaGVpZ2h0LzIpKTtcbiBcbiAgLy8gYW5kIHJlc3RvcmUgdGhlIGNvLW9yZHMgdG8gaG93IHRoZXkgd2VyZSB3aGVuIHdlIGJlZ2FuXG4gIGF1eEN0eC5yZXN0b3JlKCk7IC8vXG59XG4vL1NldHVwIG1vc3F1aXRvc1xudmFyIHNldHVwTW9zcXVpdG9zID0gZnVuY3Rpb24oKXtcbiAgdmFyIG1vc3F1aXRvID0gbmV3IEltYWdlKCk7XG4gIG1vc3F1aXRvLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy9cbiAgfSk7XG4gIG1vc3F1aXRvLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL21vc3F1aXRvMV9sZWZ0LnBuZyc7XG4gIHZhciBtb3NxdWl0bzIgPSBuZXcgSW1hZ2UoKTtcbiAgbW9zcXVpdG8yLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy9cbiAgfSk7XG4gIG1vc3F1aXRvMi5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy9tb3NxdWl0bzJfbGVmdC5wbmcnO1xuICB2YXIgbW9zcXVpdG9GbGlwcGVkID0gbmV3IEltYWdlKCk7XG4gIG1vc3F1aXRvRmxpcHBlZC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIC8vXG4gIH0pO1xuICBtb3NxdWl0b0ZsaXBwZWQuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvbW9zcXVpdG8xX2xlZnQucG5nJztcbiAgdmFyIG1vc3F1aXRvMkZsaXBwZWQgPSBuZXcgSW1hZ2UoKTtcbiAgbW9zcXVpdG8yRmxpcHBlZC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIC8vXG4gIH0pO1xuICBtb3NxdWl0bzJGbGlwcGVkLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL21vc3F1aXRvMl9sZWZ0LnBuZyc7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3RhbE1vc3F1aXRvczsgaSsrKSB7XG4gICAgXG5cbiAgICBtb3NxdWl0b3NBcnJheS5wdXNoKG5ldyBDYW52YXNJbWFnZShbbW9zcXVpdG8vKiwgbW9zcXVpdG8yKi9dLCAwLCAwLCAwLCAwLjAwMSArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpLCAwLCAwLCBuZXcgQXJyYXkoKSkpO1xuXG4gICAgbW9zcXVpdG9zQXJyYXlbaV0uZmxpcHBlZEltYWdlcyA9IG5ldyBBcnJheShtb3NxdWl0b0ZsaXBwZWQvKiwgbW9zcXVpdG8yRmxpcHBlZCovKTtcbiAgICBcbiAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTFbaSVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEubGVuZ3RoXTtcblxuICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgXG4gICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KSB7XG4gICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50LnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudC55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC41LCBNYXRoLm1pbigwLjg1LCBhdXhFbGVtZW50LngpKTtcbiAgICAgIGF1eEVsZW1lbnQueSA9IE1hdGgubWF4KDAuMSwgTWF0aC5taW4oMC4zLCBhdXhFbGVtZW50LnkpKTtcbiAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMC4xICYmIGF1eEVsZW1lbnQueCA8PSAwLjQ5KSB7XG4gICAgICAgIGF1eEVsZW1lbnQueCA9IGF1eEVsZW1lbnQueCArIDAuMjtcbiAgICAgIH1cbiAgICAgIG1vc3F1aXRvc0FycmF5W2ldLnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICBtb3NxdWl0b3NBcnJheVtpXS5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuICAgIG1vc3F1aXRvc0FycmF5W2ldLnggPSBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheVttb3NxdWl0b3NBcnJheVtpXS5jdXJyZW50UG9zaXRpb25dLng7XG4gICAgbW9zcXVpdG9zQXJyYXlbaV0ueSA9IG1vc3F1aXRvc0FycmF5W2ldLnBvc2l0aW9uc0FycmF5W21vc3F1aXRvc0FycmF5W2ldLmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgIHZhciBuZXh0UG9zaXRpb24gPSBtb3NxdWl0b3NBcnJheVtpXS5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgIGlmIChuZXh0UG9zaXRpb24gPj0gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgIH1cblxuICAgIGlmIChtb3NxdWl0b3NBcnJheVtpXS54ID4gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICBtb3NxdWl0b3NBcnJheVtpXS54RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbW9zcXVpdG9zQXJyYXlbaV0ueERpciA9IHRydWU7XG4gICAgfVxuICAgIGlmIChtb3NxdWl0b3NBcnJheVtpXS55ID4gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICBtb3NxdWl0b3NBcnJheVtpXS55RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbW9zcXVpdG9zQXJyYXlbaV0ueURpciA9IHRydWU7XG4gICAgfVxuICB9XG59XG4vL0RlY2lkZSBuZXh0IHN0ZXAgYWN0aW9uc1xudmFyIGRlY2lkZU5leHRTdGVwID0gZnVuY3Rpb24obmV4dFN0ZXApe1xuICBzd2l0Y2ggKG5leHRTdGVwKSB7XG4gICAgY2FzZSAwOlxuICAgICAgJCgnI3BnU3RlcDEgLnBnLWJ1dHRvbicpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJCgnI3BnU3RlcDEnKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMlswXTtcblxuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTtcbiAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICBzY3JvbGxUb3A6ICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjEnKS5vZmZzZXQoKS50b3BcbiAgICAgIH0sIDcwMDApO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMTpcbiAgICAgIHZhciBhdXhNb3NxdWl0b3NMZWZ0ID0gbW9zcXVpdG9zTGVmdDtcbiAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdCgwLCAyLCBwYXJzZUludCgkKCcjdmlzaXQtY291bnRyeScpLnZhbCgpKSk7XG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaW5kZXggPiBhdXhNb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcblxuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF1baV0pO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZbMF1baV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlswXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDMpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDAzKSovO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gNTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNCArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgJChcIiNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjFcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnUXVlc3Rpb24tY29udGFpbmVyMSBzZWxlY3RcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsVG9wOiAkKCcjcGdTdGVwMicpLm9mZnNldCgpLnRvcFxuICAgICAgfSwgNTAwMCk7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgJCgnI3BnU3RlcDIgLnBnLWJ1dHRvbicpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJChcIiNwZ1N0ZXAyXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF07XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDIpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDIpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA3O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbFRvcDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLm9mZnNldCgpLnRvcFxuICAgICAgfSwgNzAwMCk7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMiAucGctYnV0dG9uJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJykuYWRkQ2xhc3MoXCJkaXNhYmxlZC1vcHRpb25cIik7XG4gICAgICBcbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA5O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbFRvcDogJCgnI3BnU3RlcDMnKS5vZmZzZXQoKS50b3BcbiAgICAgIH0sIDcwMDApO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgNDpcbiAgICAgICQoXCIjcGdTdGVwMyAucGctYnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJChcIiNwZ1N0ZXAzXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyWzBdO1xuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDExO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbFRvcDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMycpLm9mZnNldCgpLnRvcFxuICAgICAgfSwgNzAwMCk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVsyXSkuZmluZChcIi5jaGVja1wiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBtb3NxdWl0b3NMZWZ0IC09IHJldHVybk1vc3F1aXRvc0xlZnQoNCwgMywgISQoJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzFdKS5maW5kKFwicGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSk7XG5cbiAgICAgICAgcHJlZ25hbnRNb3NxdWl0b3MgPSBtb3NxdWl0b3NMZWZ0ICogMC43NTtcblxuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgaWYgKGluZGV4IDwgcHJlZ25hbnRNb3NxdWl0b3MpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOFswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxNztcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNCArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMyAucGctYnV0dG9uJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvbicpLmFkZENsYXNzKFwiZGlzYWJsZWQtb3B0aW9uXCIpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPj0gcHJlZ25hbnRNb3NxdWl0b3MgJiYgaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjBbMF07XG5cbiAgICAgICAgICAgIGN1cnJlbnRQaGFzZSA9IDIwO1xuXG4gICAgICAgICAgICAkKFwiI3BnU3RlcDRcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxOTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNCArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICBzY3JvbGxUb3A6ICQoJyNwZ1N0ZXA0Jykub2Zmc2V0KCkudG9wXG4gICAgICB9LCA3MDAwKTtcbiAgICAgIH0sIDc1MCk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gIH1cbn07XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgU3RlcHNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLy9EZWFscyB3aXRoIHRoZSBzY3JvbGxpbmcgYmV0d2VlbiBzdGVwcyBhbmQgcXVlc3Rpb25zXG52YXIgbWFuYWdlU3RlcHNBY3Rpb24gPSBmdW5jdGlvbigpe1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnU3RlcF9faW5mb19fdGV4dC1hY3Rpb24nLCBmdW5jdGlvbigpe1xuICAgIHZhciBuZXh0U3RlcCA9IHBhcnNlSW50KCQodGhpcykuYXR0cignZGF0YS1zdGVwJykpO1xuICAgIGRlY2lkZU5leHRTdGVwKG5leHRTdGVwKTtcbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCAnc2VsZWN0I3Zpc2l0LWNvdW50cnknLCBmdW5jdGlvbigpe1xuICAgIHZhciBuZXh0U3RlcCA9IHBhcnNlSW50KCQodGhpcykuYXR0cignZGF0YS1zdGVwJykgKyAxKTtcbiAgICBkZWNpZGVOZXh0U3RlcChuZXh0U3RlcCk7XG4gIH0pO1xufTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFF1ZXN0aW9uc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vL0RlYWxzIHdpdGggdGhlIHNjcm9sbGluZyBiZXR3ZWVuIHF1ZXN0aW9uc1xudmFyIG1hbmFnZVF1ZXN0aW9uc1Njcm9sbCA9IGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgJ3NlbGVjdCNob21lLWNvdW50cnknLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV4dFBvc2l0aW9uID0gJCh0aGlzKS5hdHRyKCdkYXRhLXBvcycpLFxuICAgICAgY3VycmVudFN0ZXAgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtc3RlcCcpO1xuXG4gICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2N1cnJlbnRTdGVwXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbY3VycmVudFN0ZXBdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwwLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pO1xuXG4gICAgICBpZiAoY3VycmVudFN0ZXAgPT0gMCAmJiBuZXh0UG9zaXRpb24gPT0gMSkge1xuICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sIHBhcnNlSW50KCQoJyNob21lLWNvdW50cnknKS52YWwoKSkpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDM7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnUXVlc3Rpb24tYWN0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAkKHRoaXMpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgIHZhciBuZXh0UG9zaXRpb24gPSAkKHRoaXMpLmF0dHIoJ2RhdGEtcG9zJyksXG4gICAgICBjdXJyZW50U3RlcCA9ICQodGhpcykuYXR0cignZGF0YS1zdGVwJyk7XG5cbiAgICB2YXIgYXV4Q3VycmVudFN0ZXAgPSBjdXJyZW50U3RlcDtcbiAgICBpZiAobmV4dFBvc2l0aW9uICE9IC0xKSB7XG4gICAgICBcbiAgICAgIGlmIChjdXJyZW50U3RlcCA9PSAzKSB7XG4gICAgICAgIGF1eEN1cnJlbnRTdGVwID0gMjtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2F1eEN1cnJlbnRTdGVwXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwwLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmIChwYXJzZUludChjdXJyZW50U3RlcCkgPT0gMikge1xuICAgICAgICBtb3NxdWl0b3NMZWZ0IC09IHJldHVybk1vc3F1aXRvc0xlZnQocGFyc2VJbnQoY3VycmVudFN0ZXApLCBuZXh0UG9zaXRpb24sIDApXG4gICAgICB9XG4gICAgICBkZWNpZGVOZXh0U3RlcChwYXJzZUludChjdXJyZW50U3RlcCkgKyAxKTtcbiAgICB9XG4gICAgaWYgKGN1cnJlbnRTdGVwID09IDAgJiYgbmV4dFBvc2l0aW9uID09IDEpIHtcbiAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCBwYXJzZUludCgkKCcjaG9tZS1jb3VudHJ5JykudmFsKCkpKTtcblxuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF07XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAzO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChjdXJyZW50U3RlcCA9PSAzICYmIG5leHRQb3NpdGlvbiA9PSAxKSB7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCIuY2hlY2tcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRxdWVzdGlvbldyYXBwZXIgPSAkKCQoJy5wZ1F1ZXN0aW9uLXdyYXBwZXInKVthdXhDdXJyZW50U3RlcF0pLFxuICAgICAgICAkcXVlc3Rpb25Db250YWluZXIgPSAkKCQoJy5wZ1F1ZXN0aW9uLWNvbnRhaW5lcicpW2F1eEN1cnJlbnRTdGVwXSksXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uVmFsdWUgPSAtKCgkcXVlc3Rpb25Db250YWluZXIud2lkdGgoKSAqIG5leHRQb3NpdGlvbikgLyAkcXVlc3Rpb25XcmFwcGVyLndpZHRoKCkpICogMTAwLjAsXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uID0gJ3RyYW5zbGF0ZTNkKCcgKyBuZXdUcmFuc2xhdGlvblZhbHVlICsgJyUsMCwwKSc7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy1tb3otdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygndHJhbnNmb3JtOicsIG5ld1RyYW5zbGF0aW9uKTsvL1xuXG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCAoJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzBdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSA/IDAgOiAoKCQoJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzBdKS5maW5kKFwicGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkgPyAxIDogMikpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTRbMF07XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxMztcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNCArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICAgIH0sIDc1MCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGN1cnJlbnRTdGVwID09IDMgJiYgbmV4dFBvc2l0aW9uID09IDIpIHtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVsxXSkuZmluZChcIi5jaGVja1wiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2F1eEN1cnJlbnRTdGVwXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwwLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pOy8vXG5cbiAgICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sICEkKCQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVsxXSkuZmluZChcInBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIilbMV0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTZbMF07XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxNTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNCArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICAgIH0sIDc1MCk7XG4gICAgfVxuXG4gIH0pO1xufTtcblxuLy9TZWxlY3QgYW4gb3B0aW9uIG9uIHRoZSBzZWNvbmQgcXVlc3Rpb25cbnZhciBzZWxlY3RPcHRpb24gPSBmdW5jdGlvbigpe1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbjpub3QoLmRpc2FibGVkLW9wdGlvbiknLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG4gICAgICAkKHRoaXMpLmZpbmQoXCJpbWdcIikuYXR0cihcInNyY1wiLCBcImh0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvXCIgKyBiZWhhdmlvckltYWdlc1skKHRoaXMpLmF0dHIoXCJkYXRhLWluZGV4XCIpXSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuICAgICAgJCh0aGlzKS5maW5kKFwiaW1nXCIpLmF0dHIoXCJzcmNcIiwgXCJodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL1wiICsgaG92ZXJCZWhhdmlvckltYWdlc1skKHRoaXMpLmF0dHIoXCJkYXRhLWluZGV4XCIpXSk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8vU2VsZWN0IGEgYmluYXJ5IG9wdGlvbiBvbiB0aGUgdGhpcmQgcXVlc3Rpb25cbnZhciBzZWxlY3RCaW5hcnlPcHRpb24gPSBmdW5jdGlvbigpe1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb246bm90KC5kaXNhYmxlZC1vcHRpb24pJywgZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgbmV4dFBvc2l0aW9uID0gJCh0aGlzKS5hdHRyKCdkYXRhLXBvcycpLFxuICAgICAgY3VycmVudFN0ZXAgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtc3RlcCcpO1xuXG4gICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkge1xuICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuICAgICAgLy8gbW92ZSBtb3NxdWl0b3NcbiAgICAgICQodGhpcykucGFyZW50KCkucGFyZW50KCkucGFyZW50KCkuZmluZChcIi5wZy1idXR0b25cIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCh0aGlzKS5wYXJlbnQoKS5maW5kKFwiLnBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIikucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgICQodGhpcykucGFyZW50KCkucGFyZW50KCkucGFyZW50KCkuZmluZChcIi5wZy1idXR0b25cIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U3RlcCA9PSAzICYmIG5leHRQb3NpdGlvbiA9PSAxKSB7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCIuY2hlY2tcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRxdWVzdGlvbldyYXBwZXIgPSAkKCQoJy5wZ1F1ZXN0aW9uLXdyYXBwZXInKVtjdXJyZW50U3RlcCAtIDFdKSxcbiAgICAgICAgJHF1ZXN0aW9uQ29udGFpbmVyID0gJCgkKCcucGdRdWVzdGlvbi1jb250YWluZXInKVtjdXJyZW50U3RlcCAtIDFdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwwLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pOy8vXG5cbiAgICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sICgkKCQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcInBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIilbMF0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpID8gMCA6ICgoJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSA/IDEgOiAyKSk7XG5cbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNFswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDEzO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgIH0pO1xuICAgICAgfSwgNzUwKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY3VycmVudFN0ZXAgPT0gMyAmJiBuZXh0UG9zaXRpb24gPT0gMikge1xuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzFdKS5maW5kKFwiLmNoZWNrXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uVmFsdWUgPSAtKCgkcXVlc3Rpb25Db250YWluZXIud2lkdGgoKSAqIG5leHRQb3NpdGlvbikgLyAkcXVlc3Rpb25XcmFwcGVyLndpZHRoKCkpICogMTAwLjAsXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uID0gJ3RyYW5zbGF0ZTNkKCcgKyBuZXdUcmFuc2xhdGlvblZhbHVlICsgJyUsMCwwKSc7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy1tb3otdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygndHJhbnNmb3JtOicsIG5ld1RyYW5zbGF0aW9uKTsvL1xuXG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCAhJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKTtcblxuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE2WzBdO1xuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTU7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgICB9LCA3NTApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGRlY2lkZU5leHRTdGVwKDUpO1xuICAgIH1cblxuICB9KTtcbn07XG5cbi8vU2VsZWN0IHRoZSBwcmVnbmFuY3kgb3B0aW9uXG52YXIgc2VsZWN0UHJlZ25hbmN5T3B0aW9uID0gZnVuY3Rpb24oKSB7XG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdTdGVwX19wcmVnbmFuY3ktb2snLCBmdW5jdGlvbigpwqB7XG4gICAgaWYgKGN1cnJlbnRQaGFzZSA9PSAyMCkge1xuICAgICAgJCgnLnBnU3RlcF9fcHJlZ25hbmN5LW9rJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdTdGVwX19wcmVnbmFuY3kta28nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIGN1cnJlbnRQaGFzZSA9IDIxO1xuICAgIHByZWduYW50U2VsZWN0ZWQgPSB0cnVlO1xuICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMlxuICAgIGxlZnRDb3ZlckdsYXNzLnNwZWVkID0gMC4wMDE7XG4gICAgbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC4yOTEseTooMzQxNS4wL2NhbnZhczMud2lkdGgpIC0gMC4wNjV9KTtcbiAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuMjk4LHk6KDM1OTMuMC9jYW52YXMzLndpZHRoKSAtIDAuMDY1fSk7XG4gICAgbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgaWYgKGxlZnRDb3ZlckdsYXNzLnggPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLnhEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGxlZnRDb3ZlckdsYXNzLnkgPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci54ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci54RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci54RGlyID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGxlZnRDb3ZlckdsYXNzSG92ZXIueSA+IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueURpciA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueURpciA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIGNlbGwgPSBNYXRoLmZsb29yKDI1ICogKG1vc3F1aXRvc0xlZnQgLyB0b3RhbE1vc3F1aXRvcykpO1xuICAgIHZhciBuZXdYID0gMC4zO1xuICAgIHZhciBuZXdZID0gMy4yMjtcbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNTpcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTI6XG4gICAgICAgIG5ld1ggPSAwLjM7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgMTA6XG4gICAgICBjYXNlIDE0OlxuICAgICAgY2FzZSAxNzpcbiAgICAgICAgbmV3WCA9IDAuNDtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA5OlxuICAgICAgY2FzZSAxNTpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIxOlxuICAgICAgICBuZXdYID0gMC41O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDc6XG4gICAgICBjYXNlIDEzOlxuICAgICAgY2FzZSAxODpcbiAgICAgIGNhc2UgMjI6XG4gICAgICBjYXNlIDI0OlxuICAgICAgICBuZXdYID0gMC42O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgY2FzZSAxNjpcbiAgICAgIGNhc2UgMjA6XG4gICAgICBjYXNlIDIzOlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WCA9IDAuNztcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMjpcbiAgICAgIGNhc2UgNDpcbiAgICAgIGNhc2UgNzpcbiAgICAgIGNhc2UgMTE6XG4gICAgICAgIG5ld1kgPSAzLjM5O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICBjYXNlIDY6XG4gICAgICBjYXNlIDk6XG4gICAgICBjYXNlIDEzOlxuICAgICAgY2FzZSAxNjpcbiAgICAgICAgbmV3WSA9IDMuMzQ3NTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTU6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMDpcbiAgICAgICAgbmV3WSA9IDMuMzA1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDg6XG4gICAgICBjYXNlIDE0OlxuICAgICAgY2FzZSAxOTpcbiAgICAgIGNhc2UgMjI6XG4gICAgICBjYXNlIDIzOlxuICAgICAgICBuZXdZID0gMy4yNjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEyOlxuICAgICAgY2FzZSAxNzpcbiAgICAgIGNhc2UgMjE6XG4gICAgICBjYXNlIDI0OlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WSA9IDMuMjI7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgbmV3UG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6IG5ld1gsIHk6IG5ld1l9KTtcbiAgICBcbiAgICB2YXIgbWFya2VyID0gbmV3IEltYWdlKCk7XG4gICAgbWFya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb250ZXh0NC5kcmF3SW1hZ2UobWFya2VyLCBwYXJzZUludCgobmV3WCAqIGNhbnZhcy53aWR0aCkgLSAoKGNhbnZhcy53aWR0aCAqIDAuMDI0KSAqIDAuNSkpLCBwYXJzZUludCgobmV3WSAqIGNhbnZhcy53aWR0aCkgLSAoKGNhbnZhcy53aWR0aCAqIDAuMDI0KSAqICgzNy4wLzI5LjApICogMC41KSksIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDI0KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMDI0KSAqICgzNy4wLzI5LjApKSk7XG4gICAgfSk7XG4gICAgbWFya2VyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL21hcmtlci5wbmcnO1xuXG4gICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBwcmVnbmFudE1vc3F1aXRvcykge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ld1Bvc2l0aW9uc0FycmF5O1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjE7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDIgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgKE1hdGgucmFuZG9tKCkgKiAxNTAwKSArIDEwMDApO1xuICAgICAgfSk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGNyZWF0ZUNvbmNsdXNpb25zKCk7XG4gICAgICBjcmVhdGVVc2Vyc1N0YXRzKG5ld1gsIG5ld1kpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogJCgnLnBnU3RlcF9fbGFzdC1jaGFydCcpLm9mZnNldCgpLnRvcFxuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0sIDEwMDApO1xuICAgIH0sIDIwMDApO1xuICAgIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdTdGVwX19wcmVnbmFuY3kta28nLCBmdW5jdGlvbigpwqB7XG4gICAgaWYgKGN1cnJlbnRQaGFzZSA9PSAyMCkge1xuICAgICAgJCgnLnBnU3RlcF9fcHJlZ25hbmN5LW9rJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdTdGVwX19wcmVnbmFuY3kta28nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIGN1cnJlbnRQaGFzZSA9IDIxO1xuICAgIG5vblByZWduYW50U2VsZWN0ZWQgPSB0cnVlO1xuICAgIHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDI7XG4gICAgcmlnaHRDb3ZlckdsYXNzLnNwZWVkID0gMC4wMDE7XG4gICAgcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuNTk3NSx5OigzNDE1LjAvY2FudmFzMy53aWR0aCkgLSAwLjA2NX0pO1xuICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuNTk3NSx5OigzNTkzLjAvY2FudmFzMy53aWR0aCkgLSAwLjA2NX0pO1xuICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG5cbiAgICByaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICBpZiAocmlnaHRDb3ZlckdsYXNzLnggPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByaWdodENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgfVxuICAgIGlmIChyaWdodENvdmVyR2xhc3MueSA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICByaWdodENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgIGlmIChyaWdodENvdmVyR2xhc3NIb3Zlci54ID4gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICByaWdodENvdmVyR2xhc3NIb3Zlci54RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgfVxuICAgIGlmIChyaWdodENvdmVyR2xhc3NIb3Zlci55ID4gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICByaWdodENvdmVyR2xhc3NIb3Zlci55RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpciA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIG5ld01vc3F1aXRvc0xlZnRWYWx1ZSA9IE1hdGgubWF4KDUsIG1vc3F1aXRvc0xlZnQgLSAobW9zcXVpdG9zTGVmdCAqIDAuNDUpKTtcblxuICAgIHZhciBjZWxsID0gTWF0aC5mbG9vcigyNSAqIChuZXdNb3NxdWl0b3NMZWZ0VmFsdWUgLyB0b3RhbE1vc3F1aXRvcykpO1xuICAgIHZhciBuZXdYID0gMC4zO1xuICAgIHZhciBuZXdZID0gMy4yMjtcbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNTpcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTI6XG4gICAgICAgIG5ld1ggPSAwLjM7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgMTA6XG4gICAgICBjYXNlIDE0OlxuICAgICAgY2FzZSAxNzpcbiAgICAgICAgbmV3WCA9IDAuNDtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA5OlxuICAgICAgY2FzZSAxNTpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIxOlxuICAgICAgICBuZXdYID0gMC41O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDc6XG4gICAgICBjYXNlIDEzOlxuICAgICAgY2FzZSAxODpcbiAgICAgIGNhc2UgMjI6XG4gICAgICBjYXNlIDI0OlxuICAgICAgICBuZXdYID0gMC42O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgY2FzZSAxNjpcbiAgICAgIGNhc2UgMjA6XG4gICAgICBjYXNlIDIzOlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WCA9IDAuNztcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMjpcbiAgICAgIGNhc2UgNDpcbiAgICAgIGNhc2UgNzpcbiAgICAgIGNhc2UgMTE6XG4gICAgICAgIG5ld1kgPSAzLjM5O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICBjYXNlIDY6XG4gICAgICBjYXNlIDk6XG4gICAgICBjYXNlIDEzOlxuICAgICAgY2FzZSAxNjpcbiAgICAgICAgbmV3WSA9IDMuMzQ3NTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTU6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMDpcbiAgICAgICAgbmV3WSA9IDMuMzA1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDg6XG4gICAgICBjYXNlIDE0OlxuICAgICAgY2FzZSAxOTpcbiAgICAgIGNhc2UgMjI6XG4gICAgICBjYXNlIDIzOlxuICAgICAgICBuZXdZID0gMy4yNjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEyOlxuICAgICAgY2FzZSAxNzpcbiAgICAgIGNhc2UgMjE6XG4gICAgICBjYXNlIDI0OlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WSA9IDMuMjI7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgbmV3UG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6IG5ld1gsIHk6IG5ld1l9KTtcbiAgICBcbiAgICB2YXIgbWFya2VyID0gbmV3IEltYWdlKCk7XG4gICAgbWFya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UobWFya2VyLCBwYXJzZUludCgobmV3WCAqIGNhbnZhcy53aWR0aCkgLSAoKGNhbnZhcy53aWR0aCAqIDAuMDI0KSAqIDAuNSkpLCBwYXJzZUludCgobmV3WSAqIGNhbnZhcy53aWR0aCkgLSAoKGNhbnZhcy53aWR0aCAqIDAuMDI0KSAqICgzNy4wLzI5LjApICogMC41KSksIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDI0KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMDI0KSAqICgzNy4wLzI5LjApKSk7XG4gICAgfSk7XG4gICAgbWFya2VyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL21hcmtlci5wbmcnO1xuICAgIFxuICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4ID49IHByZWduYW50TW9zcXVpdG9zICYmIGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ld1Bvc2l0aW9uc0FycmF5O1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjE7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDIgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgKE1hdGgucmFuZG9tKCkgKiAxNTAwKSArIDEwMDApO1xuICAgICAgfSk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgY3JlYXRlQ29uY2x1c2lvbnMoKTtcbiAgICAgIGNyZWF0ZVVzZXJzU3RhdHMobmV3WCwgbmV3WSk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsVG9wOiAkKCcucGdTdGVwX19sYXN0LWNoYXJ0Jykub2Zmc2V0KCkudG9wXG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSwgMjAwMCk7XG4gICAgfVxuICB9KTtcbn1cblxuLy9SZXR1cm4gbW9zcXVpdG9zIGxlZnQgZGVwZW5kaW5nIG9uIHRoZSBjaG9zZW4gY291bnRyeVxudmFyIHJldHVybk1vc3F1aXRvc0xlZnQgPSBmdW5jdGlvbihzdGVwLCBxdWVzdGlvbiwgb3B0aW9uKXtcbiAgdmFyIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuXG4gIGlmIChzdGVwID09IDApIHtcbiAgICBpZiAocXVlc3Rpb24gPT0gMSkge1xuICAgICAgaWYgKG9wdGlvbiA9PSAxKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAob3B0aW9uID09IDIpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDgwO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocXVlc3Rpb24gPT0gMikge1xuICAgICAgaWYgKG9wdGlvbiA9PSAxKSB7XG4gICAgICAgIGlmIChtb3NxdWl0b3NMZWZ0IDw9IDIwKSB7XG4gICAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IC04MDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAob3B0aW9uID09IDIpIHtcbiAgICAgICAgaWYgKG1vc3F1aXRvc0xlZnQgPD0gMjApIHtcbiAgICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoc3RlcCA9PSAyKSB7XG4gICAgLy9pZiAocXVlc3Rpb24gPT0gMCkge1xuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzBdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDM7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVsxXSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbMl0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzNdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVs0XSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAxO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbNV0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzZdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAxOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVs3XSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAxO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbOF0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IChtb3NxdWl0b3NMZWZ0IDw9IDgwKSA/IDIgOiAxOyBcbiAgICAgIH1cbiAgICAvL31cbiAgfVxuXG4gIGlmIChzdGVwID09IDMpIHtcbiAgICBpZiAocXVlc3Rpb24gPT0gMSkge1xuICAgICAgaWYgKG9wdGlvbiA9PSAwKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAxO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAob3B0aW9uID09IDEpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChxdWVzdGlvbiA9PSAyKSB7XG4gICAgICBpZiAob3B0aW9uID09IDApIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcHRpb24gPT0gMSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHF1ZXN0aW9uID09IDMpIHtcbiAgICAgIGlmIChvcHRpb24gPT0gMCkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSAxKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAxO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdXhNb3NxdWl0b3NMZWZ0O1xufTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIENvbmNsdXNpb25zXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbnZhciBjcmVhdGVDb25jbHVzaW9ucyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29uY2x1c2lvbnNUZXh0ID0gXCJcIjtcblxuICBpZiAocGFyc2VJbnQoJChcIiNob21lLWNvdW50cnlcIikudmFsKCkpID09IDIgJiYgcGFyc2VJbnQoJChcIiN2aXNpdC1jb3VudHJ5XCIpLnZhbCgpKSA9PSAyKSB7XG4gICAgaWYgKCEkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzhdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpIHx8IHByZWduYW50U2VsZWN0ZWQpIHtcbiAgICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPllvdSBkb27igJl0IGxpdmUgaW4gYSBjb3VudHJ5IG5vciBhcmUgeW91IHBsYW5uaW5nIHRvIHRyYXZlbCB0byBhIGNvdW50cnkgYWZmZWN0ZWQgYnkgdGhlIFppa2EgdmlydXMuIFlvdXIgcmlzayBpcyBsb3cgYnV0IHJlbWVtYmVyIHRoYXQgdGhlcmUgaGF2ZSBiZWVuIGNhc2VzIG9mIHNleHVhbCB0cmFuc21pc3Npb24gYnkgcGFydG5lcnMgdGhhdCBnb3QgaW5mZWN0ZWQgaW4gdGhvc2UgYXJlYXMuPC9wPlwiO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPllvdSBkb27igJl0IGxpdmUgaW4gYSBjb3VudHJ5IG5vciBhcmUgeW91IHBsYW5uaW5nIHRvIHRyYXZlbCB0byBhIGNvdW50cnkgYWZmZWN0ZWQgYnkgdGhlIFppa2EgdmlydXMuIFlvdXIgcmlzayBpcyB6ZXJvLjwvcD5cIjtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPHA+WW91IGxpdmUgaW4gYSBjb3VudHJ5IHRoYXQgaXMgYWZmZWN0ZWQgYnkgdGhlIFppa2EgdmlydXMgb3IgeW91IGFyZSBwbGFubmluZyB0byB0cmF2ZWwgdG8gYSBjb3VudHJ5IHRoYXQgaXMuPC9wPlwiO1xuXG4gICAgaWYgKCQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbMV0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikgfHwgJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVsyXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCAkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzVdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpIHx8ICQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbNl0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPldlYXJpbmcgc2hvcnRzIGFuZCBzbGVldmVsZXNzIHNoaXJ0cyB0aGF0IGFyZSBkYXJrIGluIGNvbG9yIGFuZCBrZWVwaW5nIGJ1Y2tldHMgb2Ygd2F0ZXIgb3IgaGF2aW5nIHdhdGVyIGNvbnRhaW5lcnMgbmVhciB5b3VyIGhvdXNlIGNhbiBpbmNyZWFzZSB5b3VyIHJpc2sgb2YgYmVpbmcgYml0dGVuIGJ5IHRoZSBtb3NxdWl0byBhbmQgcmFpc2UgeW91ciBjaGFuY2VzIG9mIGdldHRpbmcgdGhlIHZpcnVzLjwvcD5cIjtcbiAgICB9XG4gICAgaWYgKCQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbM10pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikgfHwgJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVs0XSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCAkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzddKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD5Vc2luZyBpbnNlY3QgcmVwZWxsZW50LCB3ZWFyaW5nIGxpZ2h0IGNvbG9yIGNsb3RoZXMsIGhhdmluZyBwaHlzaWNhbCBiYXJyaWVycyBzdWNoIG1lc2ggc2NyZWVucyBvciB0cmVhdGVkIG5ldHRpbmcgbWF0ZXJpYWxzIG9uIGRvb3JzIGFuZCB3aW5kb3dzLCBvciBzbGVlcGluZyB1bmRlciBtb3NxdWl0byBuZXRzIHdpbGwgYWxsIGRlY3JlYXNlIHlvdXIgcmlzayBvZiBnZXR0aW5nIGJpdHRlbiBieSB0aGUgbW9zcXVpdG8gYW5kIGxvd2VyIHlvdXIgY2hhbmdlcyBvZiBnZXR0aW5nIHRoZSB2aXJ1cy48L3A+XCI7XG4gICAgfVxuXG4gICAgaWYgKG5vblByZWduYW50U2VsZWN0ZWQpIHtcbiAgICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPlppa2EgdmlydXMgaXMgc3ByZWFkIHByaW1hcmlseSB0aHJvdWdoIHRoZSBiaXRlIG9mIGluZmVjdGVkIEFlZGVzIHNwZWNpZXMgbW9zcXVpdG9lcy4gT25seSAyMCUgcGVvcGxlIHdobyBjb250cmFjdCB0aGUgdmlydXMgd2lsbCBldmVuIGRldmVsb3AgYW55IHN5bXB0b21zIGFuZCB0aGUgaWxsbmVzcyBpcyB1c3VhbGx5IG1pbGQsIHdpdGggc3ltcHRvbXMgbGlrZSBmZXZlciwgcmFzaCBvciBqb2ludCBwYWluIHRoYXQgd2lsbCBsYXN0IGEgZmV3IGRheXMuPGJyPjxicj5SZWNlbnRseSBpbiBCcmF6aWwsIGxvY2FsIGhlYWx0aCBhdXRob3JpdGllcyBoYXZlIG9ic2VydmVkIGFuIGluY3JlYXNlIGluIEd1aWxsYWluLUJhcnLDqSBzeW5kcm9tZSwgdGhhdCBjYXVzZXMgcGFyYWx5c2lzLCB3aGljaCBjb2luY2lkZWQgd2l0aCBaaWthIHZpcnVzIGluZmVjdGlvbnMgaW4gdGhlIGdlbmVyYWwgcHVibGljLiBCYXNlZCBvbiBhIGdyb3dpbmcgYm9keSBvZiBwcmVsaW1pbmFyeSByZXNlYXJjaCwgdGhlcmUgaXMgc2NpZW50aWZpYyBjb25zZW5zdXMgdGhhdCBaaWthIHZpcnVzIGlzIGEgY2F1c2Ugb2YgbWljcm9jZXBoYWx5IGFuZCBHdWlsbGFpbi1CYXJyw6kgc3luZHJvbWUuPC9wPlwiO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPlRoZSBaaWthIHZpcnVzIGNhbiBiZSB0cmFuc21pdHRlZCBmcm9tIGluZmVjdGVkIG1vdGhlcnMgdG8gdGhlaXIgZmV0dXNlcyBhbmQgdGhpcyBjYW4gaGFwcGVuIGR1cmluZyBib3RoIHByZWduYW5jeSBvciBhdCBjaGlsZGJpcnRoLiBCYXNlZCBvbiBhIGdyb3dpbmcgYm9keSBvZiBwcmVsaW1pbmFyeSByZXNlYXJjaCwgdGhlcmUgaXMgc2NpZW50aWZpYyBjb25zZW5zdXMgdGhhdCBaaWthIHZpcnVzIGlzIGEgY2F1c2Ugb2YgbWljcm9jZXBoYWx5LCB3aGljaCBpcyBhIGNvbmRpdGlvbiB3aGVyZSBhIGJhYnkgaXMgYm9ybiB3aXRoIGEgc21hbGwgaGVhZCBvciB0aGUgaGVhZCBzdG9wcyBncm93aW5nIGFmdGVyIGJpcnRoLiBCYWJpZXMgd2l0aCBtaWNyb2NlcGhhbHkgY2FuIGRldmVsb3AgZGV2ZWxvcG1lbnRhbCBkaXNhYmlsaXRpZXMuIEVhcmx5IGRpYWdub3NpcyBvZiBtaWNyb2NlcGhhbHkgY2FuIHNvbWV0aW1lcyBiZSBtYWRlIGJ5IGZldGFsIHVsdHJhc291bmQuPGJyPjxicj5QcmVnbmFudCB3b21lbiB3aG8gZGV2ZWxvcCBzeW1wdG9tcyBvZiBaaWthIHZpcnVzIGluZmVjdGlvbiwgc2hvdWxkIHNlZSB0aGVpciBoZWFsdGgtY2FyZSBwcm92aWRlciBmb3IgY2xvc2UgbW9uaXRvcmluZyBvZiB0aGVpciBwcmVnbmFuY3kuIElmIHlvdeKAmXJlIHRyYXZlbGxpbmcgdG8gYSBjb3VudHJ5IGFmZmVjdGVkIGJ5IFppa2EsIHRoZSBXb3JsZCBIZWFsdGggT3JnYW5pemF0aW9uIGlzIGFkdmlzaW5nIHByZWduYW50IHdvbWVuIG5vdCB0byB0cmF2ZWwgdG8gYXJlYXMgb2Ygb25nb2luZyBaaWthIHZpcnVzIHRyYW5zbWlzc2lvbi48L3A+XCI7XG4gICAgfVxuICB9XG5cbiAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPGJyPjxicj5cIjtcblxuICAkKFwiLnBnQ29uY2x1c2lvbnMtZGVzY1wiKS5iZWZvcmUoY29uY2x1c2lvbnNUZXh0KTtcbn1cblxudmFyIGNyZWF0ZVVzZXJzU3RhdHMgPSBmdW5jdGlvbihtYXJrZXJMZWZ0LCBtYXJrZXJUb3ApIHtcbiAgdmFyIHJlc3VsdHMgPSBbMSwgMiwgMSwgMiwgNSwgMywgNiwgMTAsIDEsIDEsIDEsIDEsIDEwLCAxMiwgNSwgMSwgMSwgMTAsIDEyLCAxLCAxLCAxLCAyLCA5LCAxXTtcblxuICB2YXIgbWF4UmVzdWx0cyA9IC0xO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChtYXhSZXN1bHRzIDwgcmVzdWx0c1tpXSkge1xuICAgICAgbWF4UmVzdWx0cyA9IHJlc3VsdHNbaV07XG4gICAgfVxuICB9XG5cbiAgJChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzLW1pZFwiKS5odG1sKHBhcnNlSW50KG1heFJlc3VsdHMgLyAyLjApKTtcbiAgJChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzLW1heFwiKS5odG1sKG1heFJlc3VsdHMpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKykge1xuICAgIGFuaW1hdGVVc2Vyc1N0YXRzKCQoJChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzX19jb2xcIilbcGFyc2VJbnQoaS81KV0pLmZpbmQoXCIucGdTdGVwX191c2Vycy1zdGF0c19fY29sX192YWx1ZVwiKVtpJTVdLCAocmVzdWx0c1tpXSAvIG1heFJlc3VsdHMpICogMTAwLjAsIGkpO1xuICB9XG5cbiAgJChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzLW1hcmtlclwiKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XG5cbiAgaWYgKG1hcmtlckxlZnQgPD0gMC4zKSB7XG4gICAgaWYgKG1hcmtlclRvcCA9PSAzLjM5KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC4yMzVcbiAgICB9XG4gICAgZWxzZSBpZiAobWFya2VyVG9wID09IDMuMzQ3NSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuMjQyNVxuICAgIH1cbiAgICBlbHNlIGlmIChtYXJrZXJUb3AgPT0gMy4zMDUpIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjI1NVxuICAgIH1cbiAgICBlbHNlIGlmIChtYXJrZXJUb3AgPT0gMy4yNjI1KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC4yN1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjI4XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKG1hcmtlckxlZnQgPD0gMC40KSB7XG4gICAgaWYgKG1hcmtlclRvcCA9PSAzLjM5KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC4zNVxuICAgIH1cbiAgICBlbHNlIGlmIChtYXJrZXJUb3AgPT0gMy4zNDc1KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC4zNjVcbiAgICB9XG4gICAgZWxzZSBpZiAobWFya2VyVG9wID09IDMuMzA1KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC4zNzVcbiAgICB9XG4gICAgZWxzZSBpZiAobWFya2VyVG9wID09IDMuMjYyNSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuMzlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC40XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKG1hcmtlckxlZnQgPiAwLjQ3ICYmIG1hcmtlckxlZnQgPCAwLjUzKSB7XG4gICAgaWYgKG1hcmtlclRvcCA9PSAzLjM5KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC40N1xuICAgIH1cbiAgICBlbHNlIGlmIChtYXJrZXJUb3AgPT0gMy4zNDc1KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC40ODI1XG4gICAgfVxuICAgIGVsc2UgaWYgKG1hcmtlclRvcCA9PSAzLjMwNSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNDk1XG4gICAgfVxuICAgIGVsc2UgaWYgKG1hcmtlclRvcCA9PSAzLjI2MjUpIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjUwNVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjUyXG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKG1hcmtlckxlZnQgPD0gMC42KSB7XG4gICAgaWYgKG1hcmtlclRvcCA9PSAzLjM5KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC41OVxuICAgIH1cbiAgICBlbHNlIGlmIChtYXJrZXJUb3AgPT0gMy4zNDc1KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC42XG4gICAgfVxuICAgIGVsc2UgaWYgKG1hcmtlclRvcCA9PSAzLjMwNSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNjFcbiAgICB9XG4gICAgZWxzZSBpZiAobWFya2VyVG9wID09IDMuMjYyNSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNjJcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC42MzVcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKG1hcmtlclRvcCA9PSAzLjM5KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC43MDc1XG4gICAgfVxuICAgIGVsc2UgaWYgKG1hcmtlclRvcCA9PSAzLjM0NzUpIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjcyXG4gICAgfVxuICAgIGVsc2UgaWYgKG1hcmtlclRvcCA9PSAzLjMwNSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNzNcbiAgICB9XG4gICAgZWxzZSBpZiAobWFya2VyVG9wID09IDMuMjYyNSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNzRcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC43NTVcbiAgICB9XG4gIH1cblxuICAkKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWFya2VyXCIpLmNzcyhcImxlZnRcIiwgKG1hcmtlckxlZnQgKiAxMDApICsgXCIlXCIpO1xufTtcblxudmFyIGFuaW1hdGVVc2Vyc1N0YXRzID0gZnVuY3Rpb24oYmFyLCB2YWx1ZSwgaSkge1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGJhci5zdHlsZS5oZWlnaHQgPSB2YWx1ZSArIFwiJVwiO1xuICAgIGJhci5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSBcInNjYWxlWShcIiArIDEgKyBcIilcIjtcbiAgICBiYXIuc3R5bGUudHJhbnNmb3JtID0gXCJzY2FsZVkoXCIgKyAxICsgXCIpXCI7XG4gIH0sIDE1MDAgKyAoaSAqIDEwMCkpO1xufVxuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgLy9TZXQgdXAgbmVlZGVkIGZ1bmN0aW9uc1xuICBtYW5hZ2VRdWVzdGlvbnNTY3JvbGwoKTtcbiAgbWFuYWdlU3RlcHNBY3Rpb24oKTtcbiAgc2VsZWN0T3B0aW9uKCk7XG4gIHNlbGVjdEJpbmFyeU9wdGlvbigpO1xuICBzZWxlY3RQcmVnbmFuY3lPcHRpb24oKTtcbiAgYW5pbWF0ZUVsZW1lbnRzUHJlZ25hbmN5KCk7XG4gIGFuaW1hdGVCZWhhdmlvckVsZW1lbnRzKCk7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgc2V0dXBDYW52YXMoKTtcbiAgICBzZXR1cE1vc3F1aXRvcygpO1xuICB9LCA1MDApO1xuICBzZXR1cE1haW5Mb29wKCk7XG5cbiAgLyokKGRvY3VtZW50KS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zb2xlLmxvZygne3g6JysoKGUucGFnZVgvJChcImNhbnZhc1wiKS53aWR0aCgpKSAtIDAuMTEpICsgJywgeTonICsgKCgoZS5wYWdlWSAtIDU2MSkvJChcImNhbnZhc1wiKS53aWR0aCgpKSkgKyAnfScpO1xuICB9KTsqL1xufSk7XG4iLCJ3aW5kb3cudHd0dHIgPSAoZnVuY3Rpb24gKGQsIHMsIGlkKSB7XG4gIHZhciB0LCBqcywgZmpzID0gZC5nZXRFbGVtZW50c0J5VGFnTmFtZShzKVswXTtcbiAgaWYgKGQuZ2V0RWxlbWVudEJ5SWQoaWQpKSByZXR1cm47XG4gIGpzID0gZC5jcmVhdGVFbGVtZW50KHMpOyBqcy5pZCA9IGlkO1xuICBqcy5zcmM9IFwiaHR0cHM6Ly9wbGF0Zm9ybS50d2l0dGVyLmNvbS93aWRnZXRzLmpzXCI7XG4gIGZqcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShqcywgZmpzKTtcbiAgcmV0dXJuIHdpbmRvdy50d3R0ciB8fCAodCA9IHsgX2U6IFtdLCByZWFkeTogZnVuY3Rpb24gKGYpIHsgdC5fZS5wdXNoKGYpIH0gfSk7XG59KGRvY3VtZW50LCBcInNjcmlwdFwiLCBcInR3aXR0ZXItd2pzXCIpKTsiXX0=
