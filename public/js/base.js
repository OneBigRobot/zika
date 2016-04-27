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
  //new Array({x:0.48228813559322037, y:0.2016949152542373},{x:0.4204237288135594, y:0.20423728813559322},{x:0.37466101694915255, y:0.2059322033898305},{x:0.3026271186440678, y:0.2076271186440678},{x:0.28991525423728814, y:0.21525423728813559},{x:0.2848305084745763, y:0.22796610169491524},{x:0.28228813559322036, y:0.25169491525423726},{x:0.27466101694915257, y:0.2669491525423729},{x:0.2560169491525424, y:0.26949152542372884},{x:0.07211864406779663, y:0.27203389830508473},{x:0.05516949152542373, y:0.2805084745762712},{x:0.050084745762711866, y:0.30338983050847457},{x:0.047542372881355946, y:0.4245762711864407},{x:0.049237288135593235, y:0.49830508474576274},{x:0.05686440677966102, y:0.5135593220338983},{x:0.06957627118644068, y:0.5186440677966102},{x:0.09245762711864407, y:0.5211864406779662},{x:0.10940677966101696, y:0.5262711864406779},{x:0.11449152542372883, y:0.5423728813559322},{x:0.11449152542372883, y:0.559322033898305})
  new Array({x:0.4938983050847458, y:0.21440677966101696},{x:0.3803389830508474, y:0.21101694915254238},{x:0.348135593220339, y:0.21271186440677967},{x:0.3235593220338983, y:0.21610169491525424},{x:0.3142372881355932, y:0.22033898305084745},{x:0.30830508474576274, y:0.2305084745762712},{x:0.3057627118644068, y:0.2483050847457627},{x:0.30406779661016947, y:0.2627118644067797},{x:0.298135593220339, y:0.27372881355932205},{x:0.2794915254237288, y:0.2830508474576271},{x:0.08627118644067794, y:0.2830508474576271},{x:0.06762711864406779, y:0.288135593220339},{x:0.05830508474576271, y:0.29915254237288136},{x:0.0540677966101695, y:0.5177966101694915},{x:0.06169491525423726, y:0.5372881355932203},{x:0.07610169491525426, y:0.5457627118644067},{x:0.11254237288135593, y:0.5466101694915254},{x:0.1235593220338983, y:0.5533898305084746},{x:0.12610169491525425, y:0.5711864406779661},{x:0.12525423728813562, y:0.588135593220339})
);
mosquitosPositionsPhase3 = new Array(
  new Array({x:0.11, y:0.62}, {x:0.12, y:0.68}, {x:0.13, y:0.72}, {x:0.14, y:0.68}, {x:0.13, y:0.62}, {x:0.11, y:0.6}),
  new Array({x:0.08, y:0.6}, {x:0.09, y:0.58}, {x:0.1, y:0.52}, {x:0.12, y:0.58}, {x:0.13, y:0.64}, {x:0.09, y:0.62}),
  new Array({x:0.13, y:0.68}, {x:0.12, y:0.62}, {x:0.11, y:0.58}, {x:0.12, y:0.57}, {x:0.13, y:0.58}, {x:0.11, y:0.62}),
  new Array({x:0.12796610169491526, y:0.6194915254237288},{x:0.11949152542372882, y:0.6322033898305085},{x:0.11016949152542373, y:0.6542372881355932},{x:0.1, y:0.6796610169491526},{x:0.10677966101694915, y:0.7101694915254237},{x:0.13559322033898305, y:0.7110169491525423},{x:0.14576271186440679, y:0.6813559322033899},{x:0.14661016949152542, y:0.6457627118644068},{x:0.1423728813559322, y:0.5822033898305085},{x:0.13389830508474576, y:0.559322033898305},{x:0.10762711864406779, y:0.5669491525423729},{x:0.10932203389830508, y:0.5991525423728814}),
  new Array({x:0.14491525423728813, y:0.5796610169491525},{x:0.14915254237288136, y:0.5601694915254237},{x:0.12796610169491526, y:0.55},{x:0.11271186440677966, y:0.5567796610169492},{x:0.13644067796610168, y:0.5991525423728814},{x:0.11610169491525424, y:0.6245762711864407},{x:0.10338983050847457, y:0.6635593220338983},{x:0.12033898305084746, y:0.6754237288135593},{x:0.14576271186440679, y:0.6949152542372882},{x:0.12627118644067797, y:0.7152542372881356},{x:0.10762711864406779, y:0.688135593220339},{x:0.12457627118644068, y:0.6288135593220339},{x:0.13813559322033897, y:0.5864406779661017})
);
mosquitosPositionsPhase4 = new Array(
  new Array({x:0.12610169491525425, y:0.7533898305084745},{x:0.12949152542372883, y:0.7745762711864407},{x:0.13033898305084746, y:0.8025423728813559},{x:0.12949152542372883, y:0.8322033898305085})
);
mosquitosPositionsPhase5 = new Array(
  new Array({x:0.11, y:0.82}, {x:0.12, y:0.88}, {x:0.13, y:0.92}, {x:0.14, y:0.88}, {x:0.13, y:0.82}, {x:0.11, y:0.8}),
  new Array({x:0.08, y:0.8}, {x:0.09, y:0.78}, {x:0.1, y:0.82}, {x:0.12, y:0.78}, {x:0.13, y:0.84}, {x:0.09, y:0.82}),
  new Array({x:0.13, y:0.88}, {x:0.12, y:0.82}, {x:0.11, y:0.78}, {x:0.12, y:0.77}, {x:0.13, y:0.78}, {x:0.11, y:0.82}),
  new Array({x:0.14745762711864407, y:0.7694915254237288},{x:0.11694915254237288, y:0.7728813559322034},{x:0.09576271186440678, y:0.7813559322033898},{x:0.0847457627118644, y:0.8067796610169492},{x:0.1, y:0.8372881355932204},{x:0.13389830508474576, y:0.8533898305084746},{x:0.15169491525423728, y:0.838135593220339},{x:0.1635593220338983, y:0.8025423728813559}),
  new Array({x:0.1152542372881356, y:0.8508474576271187},{x:0.09067796610169492, y:0.8203389830508474},{x:0.09830508474576272, y:0.7957627118644067},{x:0.11271186440677966, y:0.7754237288135594},{x:0.13898305084745763, y:0.7796610169491526},{x:0.13559322033898305, y:0.8033898305084746},{x:0.14745762711864407, y:0.8271186440677966},{x:0.12627118644067797, y:0.8491525423728814})
);
mosquitosPositionsPhase6 = new Array(
  new Array({x:0.12949152542372883, y:0.8398305084745763},{x:0.12949152542372883, y:0.8872881355932203},{x:0.13033898305084746, y:0.9330508474576271},{x:0.12949152542372883, y:1.05},{x:0.13457627118644067, y:1.0627118644067797},{x:0.14644067796610172, y:1.0720338983050848},{x:0.27440677966101695, y:1.0686440677966103},{x:0.29135593220338984, y:1.0788135593220338},{x:0.3023728813559322, y:1.0991525423728814},{x:0.3057627118644068, y:1.126271186440678},{x:0.3201694915254237, y:1.1423728813559322},{x:0.4422033898305085, y:1.1415254237288135},{x:0.4616949152542373, y:1.1533898305084747},{x:0.46847457627118644, y:1.1703389830508475},{x:0.46762711864406775, y:1.2686440677966102},{x:0.4710169491525424, y:1.3025423728813559})
);
mosquitosPositionsPhase7 = new Array(
  new Array({x:0.4101694915254237, y:1.188135593220339},{x:0.3822033898305085, y:1.2101694915254237},{x:0.37542372881355934, y:1.255084745762712},{x:0.39152542372881355, y:1.2923728813559323},{x:0.43728813559322033, y:1.3152542372881355},{x:0.4745762711864407, y:1.306779661016949},{x:0.5, y:1.276271186440678},{x:0.5059322033898305, y:1.2330508474576272},{x:0.46779661016949153, y:1.1838983050847458}),
  new Array({x:0.46016949152542375, y:1.2372881355932204},{x:0.47627118644067795, y:1.2584745762711864},{x:0.4728813559322034, y:1.3008474576271187},{x:0.42033898305084744, y:1.3084745762711865},{x:0.38813559322033897, y:1.2686440677966102},{x:0.40423728813559323, y:1.238135593220339},{x:0.45084745762711864, y:1.2627118644067796},{x:0.49491525423728816, y:1.244915254237288},{x:0.5084745762711864, y:1.2152542372881356},{x:0.47966101694915253, y:1.1813559322033897}),
  new Array({x:0.41271186440677965, y:1.1923728813559322},{x:0.4728813559322034, y:1.2},{x:0.5059322033898305, y:1.2483050847457626},{x:0.5033898305084745, y:1.2949152542372881},{x:0.43728813559322033, y:1.3},{x:0.3855932203389831, y:1.2847457627118644},{x:0.376271186440678, y:1.2423728813559323},{x:0.423728813559322, y:1.2474576271186442},{x:0.4652542372881356, y:1.2194915254237289},{x:0.41694915254237286, y:1.1872881355932203})
);
mosquitosPositionsPhase8 = new Array(
  new Array({x:0.5244915254237288, y:1.3542372881355933},{x:0.549915254237288, y:1.352542372881356},{x:0.5770338983050847, y:1.3533898305084746},{x:0.5880508474576271, y:1.3593220338983052},{x:0.5965254237288136, y:1.3703389830508474},{x:0.5956779661016949, y:1.3940677966101696},{x:0.5956779661016949, y:1.4466101694915254},{x:0.5982203389830509, y:1.4627118644067796},{x:0.6058474576271187, y:1.4720338983050847},{x:0.6295762711864408, y:1.4779661016949153},{x:0.6592372881355932, y:1.476271186440678},{x:0.666864406779661, y:1.4677966101694915},{x:0.6727966101694915, y:1.45},{x:0.6727966101694915, y:1.4033898305084747},{x:0.6711016949152542, y:1.3559322033898304},{x:0.6727966101694915, y:1.321186440677966},{x:0.6719491525423729, y:1.3084745762711865},{x:0.6744915254237287, y:1.297457627118644},{x:0.681271186440678, y:1.2872881355932204},{x:0.7075423728813559, y:1.2898305084745763},{x:0.7711016949152543, y:1.2889830508474576},{x:0.7838135593220339, y:1.2923728813559323},{x:0.7880508474576271, y:1.3016949152542372},{x:0.7888983050847458, y:1.3177966101694916},{x:0.7855084745762713, y:1.3559322033898304},{x:0.7880508474576271, y:1.4016949152542373},{x:0.7888983050847458, y:1.4559322033898305},{x:0.7922881355932203, y:1.4652542372881356},{x:0.8024576271186441, y:1.4720338983050847},{x:0.8414406779661017, y:1.476271186440678},{x:0.8804237288135592, y:1.476271186440678},{x:0.8982203389830508, y:1.4872881355932204},{x:0.902457627118644, y:1.5059322033898306},{x:0.9041525423728813, y:1.5703389830508474},{x:0.9033050847457627, y:1.616949152542373})
);
mosquitosPositionsPhase9 = new Array(
  new Array({x:0.8094237288135593, y:1.5180593220338983},{x:0.8280677966101695, y:1.5417881355932204},{x:0.8594237288135593, y:1.5553474576271187},{x:0.8797627118644068, y:1.5409406779661017},{x:0.8848474576271186, y:1.5265338983050847},{x:0.8772203389830509, y:1.5070423728813558},{x:0.8577288135593221, y:1.4909406779661016}),
  new Array({x:0.8678983050847457, y:1.5392457627118643},{x:0.8755254237288136, y:1.525686440677966},{x:0.8551864406779661, y:1.5146694915254237},{x:0.8365423728813559, y:1.5146694915254237},{x:0.8246779661016949, y:1.528228813559322},{x:0.8153559322033899, y:1.5375508474576272},{x:0.8034915254237288, y:1.5248389830508473},{x:0.8085762711864407, y:1.497720338983051},{x:0.831457627118644, y:1.490093220338983},{x:0.8560338983050847, y:1.5028050847457626}),
  new Array({x:0.8450169491525423, y:1.4841610169491526},{x:0.8560338983050847, y:1.5019576271186441},{x:0.8662033898305085, y:1.5214491525423728},{x:0.8670508474576271, y:1.535008474576271},{x:0.8509491525423729, y:1.5417881355932204},{x:0.8272203389830508, y:1.5358559322033898},{x:0.807728813559322, y:1.520601694915254},{x:0.810271186440678, y:1.5045},{x:0.8331525423728814, y:1.5028050847457626},{x:0.8509491525423729, y:1.5155169491525424},{x:0.8738305084745762, y:1.5129745762711864},{x:0.8704406779661017, y:1.5002627118644067},{x:0.8551864406779661, y:1.4917881355932203},{x:0.8433220338983051, y:1.483313559322034})
);
mosquitosPositionsPhase10 = new Array(
  new Array({x:0.9091525423728815, y:1.6372881355932203},{x:0.9108474576271186, y:1.664406779661017},{x:0.9091525423728815, y:1.7084745762711864},{x:0.9057627118644069, y:1.755084745762712},{x:0.9032203389830509, y:1.7779661016949153},{x:0.9167796610169492, y:1.7889830508474576},{x:0.9100000000000001, y:1.8059322033898304},{x:0.9142372881355934, y:1.8364406779661018},{x:0.9116949152542373, y:1.8601694915254237},{x:0.9108474576271186, y:1.8983050847457628},{x:0.9142372881355934, y:1.9466101694915254},{x:0.9100000000000001, y:1.9991525423728813},{x:0.9091525423728815, y:2.048305084745763},{x:0.9100000000000001, y:2.1050847457627118},{x:0.9040677966101696, y:2.130508474576271},{x:0.8930508474576271, y:2.138135593220339},{x:0.8667796610169491, y:2.1389830508474574},{x:0.8481355932203389, y:2.145762711864407},{x:0.8379661016949154, y:2.169491525423729},{x:0.8396610169491525, y:2.357627118644068},{x:0.8354237288135593, y:2.3771186440677967},{x:0.815084745762712, y:2.3847457627118644},{x:0.7913559322033898, y:2.3847457627118644},{x:0.7879661016949153, y:2.3779661016949154},{x:0.781186440677966, y:2.392372881355932},{x:0.7769491525423728, y:2.3771186440677967},{x:0.7701694915254238, y:2.3915254237288135},{x:0.7659322033898306, y:2.378813559322034},{x:0.7583050847457626, y:2.3915254237288135},{x:0.7540677966101694, y:2.3771186440677967},{x:0.7472881355932204, y:2.392372881355932},{x:0.7422033898305085, y:2.3745762711864407},{x:0.7337288135593221, y:2.392372881355932},{x:0.731186440677966, y:2.3771186440677967},{x:0.724406779661017, y:2.392372881355932},{x:0.7193220338983051, y:2.3796610169491523},{x:0.7074576271186441, y:2.385593220338983})
);
mosquitosPositionsPhase11 = new Array(
  new Array({x:0.5823050847457627, y:2.1045000000000003},{x:0.5662033898305084, y:2.100262711864407},{x:0.5670508474576271, y:2.092635593220339},{x:0.5873898305084746, y:2.0867033898305087},{x:0.6145084745762712, y:2.076533898305085},{x:0.6331525423728813, y:2.0748389830508476},{x:0.636542372881356, y:2.08585593220339},{x:0.6212881355932203, y:2.097720338983051},{x:0.5916271186440678, y:2.102805084745763})
);
mosquitosPositionsPhase12 = new Array(
  new Array({x:0.710084745762712, y:2.388135593220339},{x:0.7050000000000001, y:2.4008474576271186},{x:0.7058474576271185, y:2.4127118644067798},{x:0.7041525423728814, y:2.4372881355932203},{x:0.7016101694915253, y:2.4466101694915254},{x:0.6905932203389831, y:2.455084745762712},{x:0.652457627118644, y:2.457627118644068},{x:0.46855932203389833, y:2.4559322033898305},{x:0.4558474576271186, y:2.4559322033898305},{x:0.44398305084745765, y:2.4491525423728815},{x:0.4312711864406779, y:2.4389830508474577},{x:0.4278813559322034, y:2.421186440677966},{x:0.42957627118644065, y:2.364406779661017},{x:0.4177118644067797, y:2.3423728813559324},{x:0.40584745762711866, y:2.338135593220339},{x:0.39737288135593224, y:2.333898305084746},{x:0.3999152542372881, y:2.3466101694915253},{x:0.3846610169491525, y:2.3347457627118646},{x:0.3863559322033899, y:2.347457627118644},{x:0.37364406779661014, y:2.333898305084746},{x:0.3744915254237288, y:2.347457627118644},{x:0.3609322033898305, y:2.335593220338983},{x:0.36432203389830503, y:2.35},{x:0.3507627118644067, y:2.335593220338983},{x:0.3524576271186441, y:2.3491525423728814},{x:0.3388983050847458, y:2.335593220338983},{x:0.3278813559322034, y:2.344915254237288},{x:0.32110169491525425, y:2.3533898305084744},{x:0.3185593220338983, y:2.3686440677966103},{x:0.3185593220338983, y:2.383050847457627},{x:0.3177118644067796, y:2.395762711864407},{x:0.3092372881355932, y:2.402542372881356},{x:0.2897457627118644, y:2.4059322033898307},{x:0.2202542372881356, y:2.406779661016949},{x:0.17703389830508476, y:2.4076271186440676},{x:0.11262711864406777, y:2.4084745762711863},{x:0.09906779661016951, y:2.4127118644067798},{x:0.08889830508474578, y:2.41864406779661},{x:0.08381355932203388, y:2.4347457627118643},{x:0.08466101694915251, y:2.4940677966101696},{x:0.08211864406779662, y:2.5567796610169493})
);
mosquitosPositionsPhase13 = new Array(
  new Array({x:0.05433898305084746, y:2.3697542372881357},{x:0.053491525423728814, y:2.412127118644068},{x:0.0687457627118644, y:2.430771186440678},{x:0.08484745762711865, y:2.4282288135593224},{x:0.09162711864406779, y:2.401110169491526},{x:0.0899322033898305, y:2.372296610169492},{x:0.07383050847457627, y:2.339245762711865},{x:0.06450847457627118, y:2.318906779661017},{x:0.06027118644067797, y:2.347720338983051}),
  new Array({x:0.06959322033898305, y:2.345177966101695},{x:0.08230508474576272, y:2.3578898305084746},{x:0.08654237288135593, y:2.3824661016949156},{x:0.07298305084745763, y:2.397720338983051},{x:0.06027118644067797, y:2.410432203389831},{x:0.053491525423728814, y:2.4222966101694916},{x:0.06959322033898305, y:2.437550847457627},{x:0.08315254237288136, y:2.43585593220339},{x:0.08738983050847457, y:2.4282288135593224},{x:0.08823728813559321, y:2.410432203389831})
);
mosquitosPositionsPhase14 = new Array(
  new Array({x:0.10330508474576272, y:2.5754237288135595},{x:0.12110169491525424, y:2.574576271186441},{x:0.13127118644067798, y:2.574576271186441},{x:0.13805084745762713, y:2.574576271186441},{x:0.14228813559322034, y:2.5762711864406778},{x:0.14567796610169492, y:2.5822033898305086},{x:0.14652542372881355, y:2.594915254237288},{x:0.1439830508474576, y:2.6161016949152542})
);
mosquitosPositionsPhase15 = new Array(
  new Array({x:0.1297627118644068, y:2.3629745762711867},{x:0.11959322033898305, y:2.371449152542373},{x:0.1128135593220339, y:2.3892457627118646},{x:0.11620338983050847, y:2.4222966101694916},{x:0.11620338983050847, y:2.443483050847458},{x:0.10942372881355932, y:2.4646694915254237},{x:0.11620338983050847, y:2.4900932203389834},{x:0.13145762711864406, y:2.497720338983051},{x:0.14416949152542374, y:2.4782288135593222},{x:0.1373898305084746, y:2.455347457627119}),
  new Array({x:0.14077966101694916, y:2.49856779661017},{x:0.12044067796610168, y:2.488398305084746},{x:0.11535593220338984, y:2.4799237288135596},{x:0.12467796610169492, y:2.462127118644068},{x:0.13908474576271185, y:2.457042372881356},{x:0.14332203389830506, y:2.4417881355932205},{x:0.134, y:2.4189067796610173},{x:0.11450847457627118, y:2.407889830508475},{x:0.11027118644067797, y:2.38585593220339},{x:0.11874576271186442, y:2.372296610169492})
);
mosquitosPositionsPhase16 = new Array(
  new Array({x:0.14652542372881355, y:2.711016949152542},{x:0.14652542372881355, y:2.7245762711864407},{x:0.14737288135593218, y:2.7296610169491524},{x:0.14567796610169492, y:2.7415254237288136},{x:0.14567796610169492, y:2.7796610169491527},{x:0.13720338983050845, y:2.788983050847458},{x:0.14567796610169492, y:2.7932203389830508},{x:0.13889830508474577, y:2.797457627118644},{x:0.14567796610169492, y:2.8},{x:0.13805084745762713, y:2.8042372881355933},{x:0.14652542372881355, y:2.807627118644068},{x:0.1397457627118644, y:2.811864406779661},{x:0.14652542372881355, y:2.8177966101694913},{x:0.13889830508474577, y:2.823728813559322},{x:0.1448305084745763, y:2.8262711864406778},{x:0.14059322033898303, y:2.83135593220339},{x:0.14313559322033897, y:2.833898305084746},{x:0.1439830508474576, y:2.8423728813559324},{x:0.1439830508474576, y:2.8466101694915253},{x:0.1397457627118644, y:2.8508474576271188},{x:0.12364406779661014, y:2.8508474576271188},{x:0.10923728813559319, y:2.854237288135593},{x:0.09144067796610167, y:2.8627118644067795})
);
mosquitosPositionsPhase17 = new Array(
  new Array({x:0.06959322033898305, y:2.5917881355932204},{x:0.053491525423728814, y:2.568906779661017},{x:0.05264406779661017, y:2.5443305084745766},{x:0.06535593220338982, y:2.5324661016949155},{x:0.08654237288135593, y:2.5468728813559323},{x:0.0856949152542373, y:2.5706016949152546},{x:0.0687457627118644, y:2.589245762711865},{x:0.059423728813559326, y:2.616364406779661},{x:0.05603389830508475, y:2.6485677966101697},{x:0.07298305084745763, y:2.6689067796610173},{x:0.08315254237288136, y:2.657889830508475},{x:0.08484745762711865, y:2.6400932203389833},{x:0.08230508474576272, y:2.629076271186441},{x:0.06620338983050847, y:2.614669491525424},{x:0.0628135593220339, y:2.5841610169491527}),
  new Array({x:0.05772881355932204, y:2.5706016949152546},{x:0.05772881355932204, y:2.5917881355932204},{x:0.07298305084745763, y:2.6112796610169493},{x:0.084, y:2.6273813559322035},{x:0.08484745762711865, y:2.6528050847457627},{x:0.07891525423728814, y:2.6689067796610173},{x:0.061118644067796615, y:2.661279661016949},{x:0.05772881355932204, y:2.6417881355932207},{x:0.0780677966101695, y:2.6138220338983054},{x:0.07467796610169491, y:2.595177966101695},{x:0.05857627118644068, y:2.580771186440678},{x:0.0551864406779661, y:2.562127118644068},{x:0.0551864406779661, y:2.5417881355932206},{x:0.07213559322033898, y:2.5350084745762715},{x:0.08484745762711865, y:2.5494152542372883},{x:0.07383050847457627, y:2.5756864406779663},{x:0.07383050847457627, y:2.621449152542373},{x:0.07976271186440678, y:2.6333135593220343})
);
mosquitosPositionsPhase18 = new Array(
  //new Array({x:0.07298305084745763, y:2.6553474576271188},{x:0.07298305084745763, y:2.6706016949152542},{x:0.06450847457627118, y:2.6917881355932205},{x:0.07467796610169491, y:2.6985677966101695},{x:0.06450847457627118, y:2.7036525423728817}, {x:0.06789830508474576, y:2.7606016949152543},{x:0.07976271186440678, y:2.768228813559322},{x:0.1051864406779661, y:2.768228813559322},{x:0.13061016949152543, y:2.768228813559322},{x:0.1509491525423729, y:2.781618644067797},{x:0.15264406779661016, y:2.7960254237288136},{x:0.1534915254237288, y:2.8155169491525425},{x:0.15433898305084748, y:2.845177966101695},{x:0.16027118644067795, y:2.8587372881355932},{x:0.1763728813559322, y:2.8512796610169493},{x:0.18315254237288137, y:2.8478898305084746},{x:0.18654237288135594, y:2.8555169491525427},{x:0.19077966101694915, y:2.8478898305084746},{x:0.19671186440677968, y:2.8538220338983054},{x:0.2009491525423729, y:2.845347457627119},{x:0.20688135593220341, y:2.854669491525424},{x:0.210271186440678, y:2.8445000000000003},{x:0.2145084745762712, y:2.854669491525424},{x:0.21959322033898304, y:2.8445000000000003},{x:0.22467796610169494, y:2.8438220338983054},{x:0.22806779661016952, y:2.8436525423728816},{x:0.2306101694915254, y:2.8504322033898306},{x:0.24925423728813556, y:2.8604322033898306},{x:0.281457627118644, y:2.8504322033898306},{x:0.34671186440677965, y:2.8512796610169493},{x:0.38908474576271185, y:2.8504322033898306},{x:0.4034915254237288, y:2.8487372881355932},{x:0.40603389830508474, y:2.845347457627119},{x:0.4111186440677966, y:2.856364406779661},{x:0.4162033898305085, y:2.855347457627119},{x:0.41874576271186437, y:2.8504322033898306},{x:0.4263728813559322, y:2.852805084745763},{x:0.42806779661016947, y:2.8504322033898306},{x:0.43145762711864405, y:2.8436525423728816},{x:0.434, y:2.8529745762711867},{x:0.434, y:2.8461949152542376},{x:0.4416271186440678, y:2.856364406779661},{x:0.44501694915254236, y:2.845347457627119},{x:0.4501016949152542, y:2.8512796610169493},{x:0.4636610169491525, y:2.8504322033898306},{x:0.484, y:2.8504322033898306},{x:0.49416949152542367, y:2.8680593220338984},{x:0.4975593220338983, y:2.8875508474576272},{x:0.4975593220338983, y:2.9256864406779663},{x:0.4967118644067796, y:2.952805084745763},{x:0.4975593220338983, y:2.9807711864406783}, {x:0.48484745762711867, y:3.0036525423728815},{x:0.4628135593220339, y:3.0129745762711866},{x:0.4424745762711864, y:3.0138220338983053},{x:0.4323050847457627, y:3.0180593220338983},{x:0.42722033898305084, y:3.0290762711864407},{x:0.4263728813559322, y:3.0629745762711864},{x:0.4297627118644068, y:3.1011101694915255},{x:0.42383050847457626, y:3.1138220338983054},{x:0.38569491525423727, y:3.1180593220338984},{x:0.3568813559322034, y:3.1172118644067797},{x:0.345864406779661, y:3.1087372881355932},{x:0.345864406779661, y:3.095177966101695},{x:0.34332203389830507, y:3.0231440677966104})
  new Array({x:0.0855084745762712, y:2.889830508474576},{x:0.08296610169491525, y:2.906779661016949},{x:0.08466101694915251, y:2.9169491525423727},{x:0.0855084745762712, y:2.9389830508474577},{x:0.08381355932203388, y:2.9635593220338983},{x:0.07788135593220336, y:2.9703389830508473},{x:0.0855084745762712, y:2.9745762711864407},{x:0.08127118644067793, y:2.977966101694915},{x:0.08466101694915251, y:2.9822033898305085},{x:0.07957627118644067, y:2.9855932203389832},{x:0.08466101694915251, y:2.989830508474576},{x:0.0804237288135593, y:2.9957627118644066},{x:0.08635593220338983, y:2.9991525423728813},{x:0.07872881355932204, y:3.0050847457627117},{x:0.0855084745762712, y:3.0084745762711864},{x:0.0804237288135593, y:3.01271186440678},{x:0.08296610169491525, y:3.023728813559322},{x:0.08296610169491525, y:3.0372881355932204},{x:0.08127118644067793, y:3.0661016949152544},{x:0.08127118644067793, y:3.0940677966101693},{x:0.0855084745762712, y:3.1127118644067795},{x:0.09144067796610167, y:3.1220338983050846},{x:0.10584745762711861, y:3.126271186440678},{x:0.12364406779661014, y:3.1279661016949154},{x:0.13296610169491524, y:3.1415254237288135},{x:0.13381355932203387, y:3.1932203389830507},{x:0.13720338983050845, y:3.2084745762711866},{x:0.14567796610169492, y:3.2135593220338983},{x:0.1566949152542373, y:3.2152542372881356},{x:0.16940677966101692, y:3.211864406779661},{x:0.17618644067796607, y:3.2177966101694917},{x:0.18127118644067797, y:3.2084745762711866},{x:0.18974576271186439, y:3.2177966101694917},{x:0.1914406779661017, y:3.211016949152542},{x:0.19822033898305086, y:3.2161016949152543},{x:0.2033050847457627, y:3.2084745762711866},{x:0.2083898305084746, y:3.216949152542373},{x:0.2126271186440678, y:3.211016949152542},{x:0.22194915254237285, y:3.2161016949152543},{x:0.2685593220338983, y:3.2161016949152543},{x:0.3753389830508474, y:3.2152542372881356},{x:0.38720338983050845, y:3.2152542372881356},{x:0.3948305084745763, y:3.2127118644067796},{x:0.40584745762711866, y:3.2203389830508473},{x:0.41008474576271187, y:3.2093220338983053},{x:0.42025423728813555, y:3.2203389830508473},{x:0.4270338983050847, y:3.2093220338983053},{x:0.4329661016949153, y:3.216949152542373},{x:0.43889830508474575, y:3.2101694915254235},{x:0.4499152542372881, y:3.216949152542373},{x:0.4711016949152543, y:3.2152542372881356},{x:0.48635593220338985, y:3.2177966101694917},{x:0.49483050847457627, y:3.2220338983050847},{x:0.49991525423728816, y:3.23728813559322},{x:0.49991525423728816, y:3.2745762711864406},{x:0.49991525423728816, y:3.3152542372881357},{x:0.4982203389830508, y:3.344915254237288},{x:0.4990677966101695, y:3.3627118644067795}, {x:0.48635593220338985, y:3.3720338983050846},{x:0.46855932203389833, y:3.3796610169491523},{x:0.4566949152542373, y:3.378813559322034},{x:0.440593220338983, y:3.380508474576271},{x:0.4312711864406779, y:3.385593220338983},{x:0.4261864406779661, y:3.3949152542372882},{x:0.42533898305084744, y:3.414406779661017},{x:0.42449152542372875, y:3.4601694915254235},{x:0.42449152542372875, y:3.477966101694915},{x:0.41516949152542376, y:3.488135593220339},{x:0.3897457627118644, y:3.490677966101695},{x:0.3516101694915254, y:3.488135593220339},{x:0.3414406779661017, y:3.4788135593220337},{x:0.3388983050847458, y:3.4677966101694917},{x:0.3388983050847458, y:3.451694915254237},{x:0.3388983050847458, y:3.397457627118644})
);
mosquitosPositionsPhase19 = new Array(
  new Array({x:0.3475593220338983, y:3.0248389830508478},{x:0.3306101694915254, y:3.0468728813559323},{x:0.3051864406779661, y:3.0299237288135594},{x:0.30433898305084744, y:2.9994152542372885},{x:0.3068813559322034, y:2.9604322033898307},{x:0.32976271186440675, y:2.9350084745762715},{x:0.35942372881355933, y:2.942635593220339},{x:0.38145762711864406, y:2.9612796610169494},{x:0.37213559322033896, y:2.976533898305085},{x:0.3450169491525424, y:2.983313559322034},{x:0.3407796610169491, y:3.0002627118644067},{x:0.3704406779661017, y:3.0155169491525426},{x:0.3780677966101695, y:3.040940677966102},{x:0.3492542372881356, y:3.0519576271186444}), 
  new Array({x:0.3789152542372881, y:2.9392457627118644},{x:0.3823050847457627, y:2.9629745762711868},{x:0.3611186440677966, y:2.9731440677966106},{x:0.32552542372881355, y:2.9841610169491526},{x:0.30857627118644065, y:3.002805084745763},{x:0.3323050847457627, y:3.0138220338983053},{x:0.3662033898305085, y:3.0231440677966104},{x:0.38061016949152543, y:3.045177966101695},{x:0.35264406779661017, y:3.059584745762712},{x:0.3094237288135593, y:3.0485677966101696},{x:0.3153559322033898, y:3.0163644067796613},{x:0.33823728813559323, y:2.995177966101695},{x:0.3662033898305085, y:2.988398305084746},{x:0.35264406779661017, y:2.9646694915254237},{x:0.3170508474576271, y:2.9485677966101695},{x:0.3365423728813559, y:2.9341610169491528},{x:0.3653559322033898, y:2.9392457627118644})
);
mosquitosPositionsPhase20 = new Array(
  new Array({x:0.0855084745762712, y:2.889830508474576},{x:0.08296610169491525, y:2.906779661016949},{x:0.08466101694915251, y:2.9169491525423727},{x:0.0855084745762712, y:2.9389830508474577},{x:0.08381355932203388, y:2.9635593220338983},{x:0.07788135593220336, y:2.9703389830508473},{x:0.0855084745762712, y:2.9745762711864407},{x:0.08127118644067793, y:2.977966101694915},{x:0.08466101694915251, y:2.9822033898305085},{x:0.07957627118644067, y:2.9855932203389832},{x:0.08466101694915251, y:2.989830508474576},{x:0.0804237288135593, y:2.9957627118644066},{x:0.08635593220338983, y:2.9991525423728813},{x:0.07872881355932204, y:3.0050847457627117},{x:0.0855084745762712, y:3.0084745762711864},{x:0.0804237288135593, y:3.01271186440678},{x:0.08296610169491525, y:3.023728813559322},{x:0.08296610169491525, y:3.0372881355932204},{x:0.08127118644067793, y:3.0661016949152544},{x:0.08127118644067793, y:3.0940677966101693},{x:0.0855084745762712, y:3.1127118644067795},{x:0.09144067796610167, y:3.1220338983050846},{x:0.10584745762711861, y:3.126271186440678},{x:0.12364406779661014, y:3.1279661016949154},{x:0.13296610169491524, y:3.1415254237288135},{x:0.13381355932203387, y:3.1932203389830507},{x:0.13720338983050845, y:3.2084745762711866},{x:0.14567796610169492, y:3.2135593220338983},{x:0.1566949152542373, y:3.2152542372881356},{x:0.16940677966101692, y:3.211864406779661},{x:0.17618644067796607, y:3.2177966101694917},{x:0.18127118644067797, y:3.2084745762711866},{x:0.18974576271186439, y:3.2177966101694917},{x:0.1914406779661017, y:3.211016949152542},{x:0.19822033898305086, y:3.2161016949152543},{x:0.2033050847457627, y:3.2084745762711866},{x:0.2083898305084746, y:3.216949152542373},{x:0.2126271186440678, y:3.211016949152542},{x:0.22194915254237285, y:3.2161016949152543},{x:0.2685593220338983, y:3.2161016949152543},{x:0.3753389830508474, y:3.2152542372881356},{x:0.38720338983050845, y:3.2152542372881356},{x:0.3948305084745763, y:3.2127118644067796},{x:0.40584745762711866, y:3.2203389830508473},{x:0.41008474576271187, y:3.2093220338983053},{x:0.42025423728813555, y:3.2203389830508473},{x:0.4270338983050847, y:3.2093220338983053},{x:0.4329661016949153, y:3.216949152542373},{x:0.43889830508474575, y:3.2101694915254235},{x:0.4499152542372881, y:3.216949152542373},{x:0.4711016949152543, y:3.2152542372881356},{x:0.48635593220338985, y:3.2177966101694917},{x:0.49483050847457627, y:3.2220338983050847},{x:0.49991525423728816, y:3.23728813559322},{x:0.49991525423728816, y:3.2745762711864406},{x:0.49991525423728816, y:3.3152542372881357},{x:0.4982203389830508, y:3.344915254237288},{x:0.4990677966101695, y:3.3627118644067795}, {x:0.5066949152542373, y:3.3754237288135593},{x:0.5321186440677965, y:3.3779661016949154},{x:0.5558474576271186, y:3.378813559322034},{x:0.5694067796610169, y:3.3838983050847458},{x:0.5761864406779662, y:3.3949152542372882},{x:0.5761864406779662, y:3.411864406779661},{x:0.5761864406779662, y:3.4627118644067796},{x:0.5761864406779662, y:3.477118644067797},{x:0.5821186440677966, y:3.483050847457627},{x:0.5897457627118643, y:3.4889830508474575},{x:0.6185593220338983, y:3.490677966101695},{x:0.6516101694915255, y:3.4889830508474575},{x:0.6575423728813559, y:3.480508474576271},{x:0.6600847457627119, y:3.4694915254237286},{x:0.6583898305084745, y:3.450847457627119},{x:0.6685593220338983, y:3.3796610169491523})
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
var tabletTreshold = 900;
var mobileTreshold = 600;
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
  if (currentPhase == 20 || currentPhase == 21) {
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
              auxElement.x = Math.max(0.086,Math.min(0.135, auxElement.x)) + 0.01;
              auxElement.y = Math.max(0.555,Math.min(0.715, auxElement.y)) + 0.04;
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
              auxElement.x = Math.max(0.076,Math.min(0.15, auxElement.x)) + 0.01;
              auxElement.y = Math.max(0.81,Math.min(0.86, auxElement.y)) + 0.05;
              if (auxElement.x >= 0.14 || auxElement.x <= 0.087) {
                if (auxElement.y <= 0.82) {
                  auxElement.y = auxElement.y + 0.04;
                }
                else if (auxElement.y >= 0.83) {
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
              $("#pgStep2 .pg-button").attr("disabled", "disabled");
              $("#pgStep2").attr("disabled", "disabled");

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
                auxElement.x = auxElement.x + 0.057;
                auxElement.y = auxElement.y + 0.115;
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
              $("#pgStep3 .pg-button").attr("disabled", "disabled");
              $("#pgStep3").attr("disabled", "disabled");

              $(".pgQuestion__body__binary-option").removeClass("disabled-option");
              $('#pgQuestion-container3 .pg-button').removeAttr("disabled");
              $('#pgQuestion-container3').removeAttr("disabled");
            }

            var auxPositionsArray = mosquitosPositionsPhase13[index%mosquitosPositionsPhase13.length];

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0) + 0.005, y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.01 + 0.275};
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
              var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0) + 0.005, y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.01 + 0.275};
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
              var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0) + 0.005, y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) + 0.275};
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
              var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) + 0.35};
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
              var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) + 0.35};
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
      $("#left-glass-cover, #left-glass-cover-mid").animate({
        marginTop: "-" + ($("#left-glass-cover").height() * 0.001) + "px"
      }, 200);

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
      $("#left-glass-cover, #left-glass-cover-mid").animate({
        marginTop: "0px"
      }, 200);
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
      $("#right-glass-cover, #right-glass-cover-mid").animate({
        marginTop: "-" + ($("#right-glass-cover").height() * 0.001) + "px"
      }, 200);
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
      $("#right-glass-cover, #right-glass-cover-mid").animate({
        marginTop: "0px"
      }, 200);
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
  canvas2.width = $('.pgChart-wrapper').width();
  canvas2.height = $('.pgChart-wrapper').height() + 0;
  canvas2.style.width  = canvas2.width.toString() + "px";
  canvas2.style.height = canvas2.height.toString() + "px";
  context2 = canvas2.getContext('2d');
  context2.imageSmoothingEnabled = false;

  canvas3 = document.getElementById('animationCanvas');
  canvas3.width = $('.pgChart-wrapper').width();
  canvas3.height = $('.pgChart-wrapper').height();
  canvas3.style.width  = canvas3.width.toString() + "px";
  canvas3.style.height = canvas3.height.toString() + "px";
  context3 = canvas3.getContext('2d');
  context3.imageSmoothingEnabled = false;

  canvas = document.getElementById('mosquitosCanvas');
  canvas.width = $('.pgChart-wrapper').width();
  canvas.height = $('.pgChart-wrapper').height();
  canvas.style.width  = canvas.width.toString() + "px";
  canvas.style.height = canvas.height.toString() + "px";
  context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;

  canvas4 = document.getElementById('hoverCanvas');
  canvas4.width = $('.pgChart-wrapper').width();
  canvas4.height = $('.pgChart-wrapper').height();
  canvas4.style.width  = canvas4.width.toString() + "px";
  canvas4.style.height = canvas4.height.toString() + "px";
  context4 = canvas4.getContext('2d');
  context4.imageSmoothingEnabled = false;

  canvas5 = document.getElementById('glassAnimationCanvas');
  canvas5.width = $('.pgChart-wrapper').width();
  canvas5.height = $('.pgChart-wrapper').height();
  canvas5.style.width  = canvas5.width.toString() + "px";
  canvas5.style.height = canvas5.height.toString() + "px";
  context5 = canvas5.getContext('2d');
  context5.imageSmoothingEnabled = false;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context2.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context3.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context4.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context5.clearRect(0, 0, context5.canvas.width, context5.canvas.height);
  
  context2.fillStyle = "#f8f8f8";
  if ($(".pgArticle").width() < tabletTreshold) {
    /*context2.fillRect($('#pgQuestion-container1').position().left, 0, $(".pgArticle").width(), canvas2.height);
    context2.fillRect($('#pgQuestion-container2').position().left, 0, $(".pgArticle").width(), canvas2.height);
    context2.fillRect($('#pgQuestion-container3').position().left, 0, $(".pgArticle").width(), canvas2.height);*/
  }
  else {
    context2.fillRect(0, getOffset($('#pgQuestion-container1')[0]).top - getOffset($(".pgArticle")[0]).top - $('#nav-bar').height(), canvas2.width, $('#pgQuestion-container1').height());
    context2.fillRect(0, getOffset($('#pgQuestion-container2')[0]).top - getOffset($(".pgArticle")[0]).top - $('#nav-bar').height(), canvas2.width, $('#pgQuestion-container2').height());
    context2.fillRect(0, getOffset($('#pgQuestion-container3')[0]).top - getOffset($(".pgArticle")[0]).top - $('#nav-bar').height(), canvas2.width, $('#pgQuestion-container3').height());
  }

  var picture1 = new Image();
  picture1.addEventListener('load', function () {
    if ($(".pgArticle").width() < tabletTreshold) {
      //context2.drawImage(picture1, parseInt($(".pgArticle").width() - ($(".pgArticle").width() * 0.55) - ($(".pgArticle").width() * 0.064)), 0, parseInt($(".pgArticle").width() * 0.55), parseInt(($(".pgArticle").width() * 0.55) * (536.0/656.0)));
    }
    else {
      context2.drawImage(picture1, parseInt(canvas.width - (canvas.width * 0.55) - (canvas.width * 0.064)), 0, parseInt(canvas.width * 0.55), parseInt((canvas.width * 0.55) * (536.0/656.0)));
    }
      var picture1Hover = new Image();
      picture1Hover.addEventListener('load', function () {
        if ($(".pgArticle").width() < tabletTreshold) {
          //context4.drawImage(picture1Hover, parseInt($(".pgArticle").width() - ($(".pgArticle").width() * 0.55) - ($(".pgArticle").width() * 0.064)), 0, parseInt($(".pgArticle").width() * 0.55), parseInt(($(".pgArticle").width() * 0.55) * (536.0/656.0)));
        }
        else {
          context4.drawImage(picture1Hover, parseInt(canvas.width - (canvas.width * 0.55) - (canvas.width * 0.064)), 0, parseInt(canvas.width * 0.55), parseInt((canvas.width * 0.55) * (536.0/656.0)));
        }
        context4.drawImage(picture1Hover, parseInt(canvas.width - (canvas.width * 0.55) - (canvas.width * 0.064)), 0, parseInt(canvas.width * 0.55), parseInt((canvas.width * 0.55) * (536.0/656.0)));
      });
      picture1Hover.src = 'http://yowlu.com/wapo/images/terrarium-hover.png';

      var tube1 = new Image();
      tube1.addEventListener('load', function () {
        if ($(".pgArticle").width() < tabletTreshold) {
          //context2.drawImage(tube1, parseInt($(".pgArticle").width() - ($(".pgArticle").width() * 0.55) - ($(".pgArticle").width() * 0.0585) - ($(".pgArticle").width() * 0.36051)), parseInt(($(".pgArticle").width() * 0.36051) * (300.0/430.0)) * 0.55, parseInt($(".pgArticle").width() * 0.36051), parseInt(($(".pgArticle").width() * 0.36051) * (300.0/430.0)));
        }
        else {
          context2.drawImage(tube1, parseInt(canvas.width - (canvas.width * 0.55) - (canvas.width * 0.0585) - (canvas.width * 0.36051)), 235, parseInt(canvas.width * 0.36051), parseInt((canvas.width * 0.36051) * (300.0/430.0)));
        }
      });
      tube1.src = 'http://yowlu.com/wapo/images/tube1.png';
  });
  picture1.src = 'http://yowlu.com/wapo/images/terrarium.png';

  var tube2 = new Image();
  tube2.addEventListener('load', function () {
    if ($(".pgArticle").width() < tabletTreshold) {
    }
    else {
      context2.drawImage(tube2, parseInt(canvas.width * 0.0345), 530, parseInt(canvas.width * 0.14672), parseInt((canvas.width * 0.14672) * (622.0/175.0)));
    }
  });
  tube2.src = 'http://yowlu.com/wapo/images/tube2.png';

  var tube3 = new Image();
  tube3.addEventListener('load', function () {
    if ($(".pgArticle").width() < tabletTreshold) {
    }
    else {
      context2.drawImage(tube3, parseInt(canvas.width * 0.0545), 1115, parseInt(canvas.width * 0.8073), parseInt((canvas.width * 0.8073) * (517.0/963.0)));
    }
    var tube3Hover = new Image();
    tube3Hover.addEventListener('load', function () {
      if ($(".pgArticle").width() < tabletTreshold) {
      }
      else {
        context4.drawImage(tube3Hover, parseInt(canvas.width * 0.0545), 1115, parseInt(canvas.width * 0.8073), parseInt((canvas.width * 0.8073) * (517.0/963.0)));
      }
    });
    tube3Hover.src = 'http://yowlu.com/wapo/images/tube3-hover.png';
  });
  tube3.src = 'http://yowlu.com/wapo/images/tube3.png';

  var tube5 = new Image();
  tube5.addEventListener('load', function () {
    if ($(".pgArticle").width() < tabletTreshold) {
    }
    else {
      context2.drawImage(tube5, parseInt(canvas.width - (canvas.width * 0.8015) - (canvas.width * 0.133)), 2120, parseInt(canvas.width * 0.8015), parseInt((canvas.width * 0.8015) * (510.0/956.0)));
    }

    var tube5Hover = new Image();
    tube5Hover.addEventListener('load', function () {
      if ($(".pgArticle").width() < tabletTreshold) {
      }
      else {
        context4.drawImage(tube5Hover, parseInt(canvas.width - (canvas.width * 0.8015) - (canvas.width * 0.133)), 2120, parseInt(canvas.width * 0.8015), parseInt((canvas.width * 0.8015) * (510.0/956.0)));
      }
    });
    tube5Hover.src = 'http://yowlu.com/wapo/images/tube5-hover.png';  

    var tube4 = new Image();
    tube4.addEventListener('load', function () {
      if ($(".pgArticle").width() < tabletTreshold) {
      }
      else {
        context2.drawImage(tube4, parseInt(canvas.width - (canvas.width * 0.1358) - (canvas.width * 0.08)) - 3, 1618, parseInt(canvas.width * 0.1358), parseInt((canvas.width * 0.1358) * (600.0/162.0)));
      }
      var tube4Hover = new Image();
      tube4Hover.addEventListener('load', function () {
        if ($(".pgArticle").width() < tabletTreshold) {
        }
        else {
          context4.drawImage(tube4Hover, parseInt(canvas.width - (canvas.width * 0.1358) - (canvas.width * 0.08)) - 3, 1618, parseInt(canvas.width * 0.1358), parseInt((canvas.width * 0.1358) * (600.0/162.0)));
        }
      });
      tube4Hover.src = 'http://yowlu.com/wapo/images/tube4-hover.png';
    });
    tube4.src = 'http://yowlu.com/wapo/images/tube4.png';

  });
  tube5.src = 'http://yowlu.com/wapo/images/tube5.png';  

  var tube6 = new Image();
  tube6.addEventListener('load', function () {
    if ($(".pgArticle").width() < tabletTreshold) {
    }
    else {
      context2.drawImage(tube6, parseInt(canvas.width * 0.028), 2621, parseInt(canvas.width * 0.1383), parseInt((canvas.width * 0.1383) * (592.0/165.0)));
    }
    var tube6Hover = new Image();
    tube6Hover.addEventListener('load', function () {
      if ($(".pgArticle").width() < tabletTreshold) {
      }
      else {
        context4.drawImage(tube6Hover, parseInt(canvas.width * 0.028), 2621, parseInt(canvas.width * 0.1383), parseInt((canvas.width * 0.1383) * (592.0/165.0)));
      }
    });
    tube6Hover.src = 'http://yowlu.com/wapo/images/tube6-hover.png';
  });
  tube6.src = 'http://yowlu.com/wapo/images/tube6.png';

  var tube7 = new Image();
  tube7.addEventListener('load', function () {
    if ($(".pgArticle").width() < tabletTreshold) {
    }
    else {
      context2.drawImage(tube7, parseInt(canvas.width * 0.06), 3200, parseInt(canvas.width * 0.6707), parseInt((canvas.width * 0.6707) * (552.0/800.0)));
    }
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
      auxElement.x = Math.max(0.51, Math.min(0.95, auxElement.x)) + 0.02;
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
          element.speed = 0.007 + (Math.random() * 0.001);
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
      
      if ($(".pgArticle").width() < tabletTreshold) {
        $('.pgChart').animate({
          scrollLeft: $('#pgQuestion-container1').offset().left
        }, 7000);
      }
      else {
        $('html, body').animate({
          scrollTop: $('#pgQuestion-container1').offset().top
        }, 4000);
      }
      
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
              for (var i = 0; i < mosquitosPositionsPhase8[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase8[0][i]);
              }
            }
            else {
              element.positionsArray = new Array();
              for (var i = 0; i < mosquitosPositionsPhase6[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase6[0][i]);
              }
              for (var i = 0; i < mosquitosPositionsPhase8[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase8[0][i]);
              }
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x /*+ (((Math.random() * 0.1) - 0.05) * 0.0003)*/;
              element2.y = element2.y /*+ (((Math.random() * 0.1) - 0.05) * 0.0003)*/;
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 7;
            element.speed = 0.007 + (Math.random() * 0.001);
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
      $("#pgStep2 .pg-button").removeAttr("disabled");
      $("#pgStep2").removeAttr("disabled");

      if ($(".pgArticle").width() < tabletTreshold) {
        $('.pgChart').animate({
          scrollLeft: $('#pgStep2').position().left
        }, 5000, function() {
          setTimeout(function() {
            $('.pgChart').animate({
              scrollLeft: $('#pgQuestion-container2').position().left
            }, 5000);
          }, 3000);
        });
      }
      else {
        $('html, body').animate({
          scrollTop: $('#pgStep2').offset().top
        }, 5000);
      }
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
            element.speed = 0.007 + (Math.random() * 0.001);
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
      $("#pgStep3 .pg-button").removeAttr("disabled");
      $("#pgStep3").removeAttr("disabled");
      
      mosquitosArray.forEach(function(element,index,array){
        if (index < mosquitosLeft) {
          setTimeout(function() {
            // add delay
            element.positionsArray = new Array();

            for (var i = 0; i < mosquitosPositionsPhase10[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase10[0][i]);
              }
              for (var i = 0; i < mosquitosPositionsPhase12[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase12[0][i]);
              }

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 11;
            element.speed = 0.007 + (Math.random() * 0.001);
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
      
      if ($(".pgArticle").width() < tabletTreshold) {
        $('.pgChart').animate({
          scrollLeft: $('#pgStep3').position().left
        }, 7000, function() {
          setTimeout(function() {
            $('.pgChart').animate({
              scrollLeft: $('#pgQuestion-container3').position().left
            }, 5000);
          }, 3000);
        });
      }
      else {
        $('html, body').animate({
          scrollTop: $('#pgStep3').offset().top
        }, 7000);
      }
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
            element.speed = 0.007 + (Math.random() * 0.001);
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
      $($('#pgQuestion-wrapper3 .pgQuestion')[2]).find(".pgQuestion__body__answer").css("opacity", "1.0");

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
            element.speed = 0.007 + (Math.random() * 0.001);
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
            element.speed = 0.007 + (Math.random() * 0.001);
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
      
      if ($(".pgArticle").width() < tabletTreshold) {
        $('.pgChart').animate({
          scrollLeft: $('#pgStep4').position().left
        }, 7000, function() {
        });
      }
      else {
        $('html, body').animate({
          scrollTop: $('#pgStep4').offset().top
        }, 7000);
      }
      }, 1750);
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
            element.speed = 0.007 + (Math.random() * 0.001);
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
            element.speed = 0.007 + (Math.random() * 0.001);
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
      $($('#pgQuestion-wrapper3 .pgQuestion')[0]).find(".pgQuestion__body__answer").css("opacity", "1.0");

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
            element.speed = 0.007 + (Math.random() * 0.001);
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
      }, 1750);
    }
    else if (currentStep == 3 && nextPosition == 2) {
      $($('#pgQuestion-wrapper3 .pgQuestion')[1]).find(".check").css("opacity", "1.0");
      $($('#pgQuestion-wrapper3 .pgQuestion')[1]).find(".pgQuestion__body__answer").css("opacity", "1.0");

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
            element.speed = 0.007 + (Math.random() * 0.001);
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
      }, 1750);
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
      $($('#pgQuestion-wrapper3 .pgQuestion')[0]).find(".pgQuestion__body__answer").css("opacity", "1.0");

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
            element.speed = 0.007 + (Math.random() * 0.001);
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
      }, 1750);
    }
    else if (currentStep == 3 && nextPosition == 2) {
      $($('#pgQuestion-wrapper3 .pgQuestion')[1]).find(".check").css("opacity", "1.0");
      $($('#pgQuestion-wrapper3 .pgQuestion')[1]).find(".pgQuestion__body__answer").css("opacity", "1.0");

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
            element.speed = 0.007 + (Math.random() * 0.001);
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
      }, 1750);
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
      $("#left-glass-cover, #left-glass-cover-mid").animate({
        marginTop: "-" + ($("#left-glass-cover").height() * 0.01) + "px"
      }, 200);
      $('.pgStep__pregnancy-ok').attr("disabled", "disabled");
      $('.pgStep__pregnancy-ko').attr("disabled", "disabled");
      currentPhase = 21;
    pregnantSelected = true;

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
        newY = 0;
      break;
      case 3:
      case 6:
      case 9:
      case 13:
      case 16:
        newY = 3.3475;
        newY = 5;
      break;
      case 5:
      case 10:
      case 15:
      case 18:
      case 20:
        newY = 3.305;
        newY = 10;
      break;
      case 8:
      case 14:
      case 19:
      case 22:
      case 23:
        newY = 3.2625;
        newY = 15;
      break;
      case 12:
      case 17:
      case 21:
      case 24:
      case 25:
        newY = 3.22;
        newY = 20;
      break;
    }

    $('.pgStep__last-chart-marker').css("opacity", 1.0);
    markerMarginTop = (20 - newY);

    if ($(".pgChart").width() > 1180) {
      markerMarginTop = (20 - newY) * (1180 / $(".pgChart").width());
    }
    $('.pgStep__last-chart-marker').css("margin-top",  markerMarginTop+ "vw");
    $('.pgStep__last-chart-marker').css("left",  (newX * 100) + "%");

    markerPos = $('.pgStep__last-chart-marker').position();

    var newPositionsArray = new Array({x: markerPos.left / canvas.width, y: ((markerPos.top + parseInt($('.pgStep__last-chart-marker').css("margin-top"))) + $('.pgStep__last-chart-marker').height()) / canvas.width});
    
    mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < pregnantMosquitos) {
            element.positionsArray = newPositionsArray;

            element.currentPosition = 0;
            element.currentMosquitoPhase = 21;
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
        }, (Math.random() * 1500) + 1000);
      });
    setTimeout(function() {
      createConclusions(cell);
      createUsersStats(newX, newY, cell);
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
      $("#right-glass-cover, #right-glass-cover-mid").animate({
        marginTop: "-" + ($("#right-glass-cover").height() * 0.01) + "px"
      }, 200);
      $('.pgStep__pregnancy-ok').attr("disabled", "disabled");
      $('.pgStep__pregnancy-ko').attr("disabled", "disabled");
      currentPhase = 21;
    nonPregnantSelected = true;
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
        newY = 0;
      break;
      case 3:
      case 6:
      case 9:
      case 13:
      case 16:
        newY = 3.3475;
        newY = 5;
      break;
      case 5:
      case 10:
      case 15:
      case 18:
      case 20:
        newY = 3.305;
        newY = 10;
      break;
      case 8:
      case 14:
      case 19:
      case 22:
      case 23:
        newY = 3.2625;
        newY = 15;
      break;
      case 12:
      case 17:
      case 21:
      case 24:
      case 25:
        newY = 3.22;
        newY = 20;
      break;
    }

    $('.pgStep__last-chart-marker').css("opacity", 1.0);
    markerMarginTop = (20 - newY);

    if ($(".pgChart").width() > 1180) {
      markerMarginTop = (20 - newY) * (1180 / $(".pgChart").width());
    }
    $('.pgStep__last-chart-marker').css("margin-top",  markerMarginTop+ "vw");
    $('.pgStep__last-chart-marker').css("left",  (newX * 100) + "%");

    markerPos = $('.pgStep__last-chart-marker').position();

    var newPositionsArray = new Array({x: markerPos.left / canvas.width, y: ((markerPos.top + parseInt($('.pgStep__last-chart-marker').css("margin-top"))) + $('.pgStep__last-chart-marker').height()) / canvas.width});

    mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index >= pregnantMosquitos && index < mosquitosLeft) {
            element.positionsArray = newPositionsArray;

            element.currentPosition = 0;
            element.currentMosquitoPhase = 21;
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
        }, (Math.random() * 1500) + 1000);
      });

    setTimeout(function() {
      createConclusions(cell);
      createUsersStats(newX, newY, cell);
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
      else if (option == 2 || option == 4) {
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
      else if (option == 2 || option == 4) {
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
var createConclusions = function(cell) {
  var conclusionsText = "<h4><b>You have a ";

  //You have a low/mid/high risk of contracting the Zika virus, and (but) the consequences would be mild/ could be serious/
  if (cell <= 10) {
    conclusionsText += "low";
  }
  else if (cell <= 19) {
    conclusionsText += "mid";
  }
  else {
    conclusionsText += "high";
  }

  conclusionsText += " risk of contracting the Zika virus, and (but) the consequences "

  if (cell <= 10) {
    conclusionsText += "would be mild.";
  }
  else if (cell <= 19) {
    conclusionsText += "would be mild.";
  }
  else {
    conclusionsText += "could be serious.";
  }

  conclusionsText += "</b></h4>";

  if(parseInt($("#home-country").val()) == 4 || parseInt($("#visit-country").val()) == 4) {
    conclusionsText += "<p>You live in the United States or you are planning to travel to the United States. Research shows that some states will be affected by the Zika virus in the coming weeks.</p>"
  }

  if ((parseInt($("#home-country").val()) == 2 && parseInt($("#visit-country").val()) == 2) || ((parseInt($("#home-country").val()) == 4 && parseInt($("#visit-country").val()) == 4))) {
    if (!$($(".pgQuestion__body__option")[8]).hasClass("selected") || pregnantSelected) {
      conclusionsText += "<p>You don’t live in a country nor are you planning to travel to a country affected by the Zika virus. <b>Your risk is low</b> but remember that there have been <b>cases of sexual transmission</b> by partners that got infected in those areas.</p>";
    }
    else {
      conclusionsText += "<p>You don’t live in a country nor are you planning to travel to a country affected by the Zika virus. <b>Your risk is zero.<b></p>";
    }
  }
  else {
    conclusionsText += "<p>You live in a country that is affected by the Zika virus or you are planning to travel to a country that is.</p>";

    if ($($(".pgQuestion__body__option")[1]).hasClass("selected") || $($(".pgQuestion__body__option")[2]).hasClass("selected") || $($(".pgQuestion__body__option")[5]).hasClass("selected") || $($(".pgQuestion__body__option")[6]).hasClass("selected")) {
      conclusionsText += "<p>Wearing shorts and sleeveless shirts that are dark in color and keeping buckets of water or having water containers near your house can <b>increase your risk of being bitten by the mosquito and raise your chances of getting the virus.</b></p>";
    }
    if ($($(".pgQuestion__body__option")[3]).hasClass("selected") || $($(".pgQuestion__body__option")[4]).hasClass("selected") || $($(".pgQuestion__body__option")[7]).hasClass("selected")) {
      conclusionsText += "<p>Using insect repellent, wearing light color clothes, having physical barriers such mesh screens or treated netting materials on doors and windows, or sleeping under mosquito nets will all <b>decrease your risk of getting bitten by the mosquito and lower your changes of getting the virus.</b></p>";
    }

    if (nonPregnantSelected) {
      conclusionsText += "<p>Zika virus is spread primarily through the bite of infected Aedes species mosquitoes. <b>Only 20% people who contract the virus will even develop any symptoms and the illness is usually mild</b>, with symptoms like fever, rash or joint pain that will last a few days.<br><br>Recently in Brazil, local health authorities have observed an increase in Guillain-Barré syndrome, that causes paralysis, which coincided with Zika virus infections in the general public. Based on a growing body of preliminary research, there is scientific consensus that Zika virus is a cause of microcephaly and Guillain-Barré syndrome.</p>";
    }
    else {
      conclusionsText += "<p><b>The Zika virus can be transmitted from infected mothers to their fetuses</b> and this can happen during both pregnancy or at childbirth. Based on a growing body of preliminary research, <b>there is scientific consensus that Zika virus is a cause of microcephaly</b>, which is a condition where a baby is born with a small head or the head stops growing after birth. Babies with microcephaly can develop developmental disabilities. Early diagnosis of microcephaly can sometimes be made by fetal ultrasound.<br><br><b>Pregnant women who develop symptoms of Zika virus infection, should see their health-care provider for close monitoring of their pregnancy.</b> If you’re travelling to a country affected by Zika, the World Health Organization is advising pregnant women not to travel to areas of ongoing Zika virus transmission.</p>";
    }
  }

  conclusionsText += "<br><br>";

  $(".pgConclusions-desc").before(conclusionsText);
}

var createUsersStats = function(markerLeft, markerTop, cell) {
  var results = [1, 2, 1, 2, 5, 3, 6, 10, 1, 1, 1, 1, 10, 12, 5, 1, 1, 10, 12, 1, 1, 1, 2, 9, 1];

  var maxResults = -1;

  for (var i = 0; i < results.length; i++) {
    if (maxResults < results[i]) {
      maxResults = results[i];
    }
  }

  $($('.pgStep__users-stats-row-value')[0]).css("left", "0%");
  $($('.pgStep__users-stats-row-value')[1]).css("left", "45%");
  $($('.pgStep__users-stats-row-value')[2]).css("left", "75%");
  $($('.pgStep__users-stats-row-value')[3]).css("left", "0%");
  $($('.pgStep__users-stats-row-value')[4]).css("left", "40%");
  $($('.pgStep__users-stats-row-value')[5]).css("left", "80%");

  $($('.pgStep__users-stats-row-value')[0]).css("width", "45%");
  $($('.pgStep__users-stats-row-value')[1]).css("width", "30%");
  $($('.pgStep__users-stats-row-value')[2]).css("width", "25%");
  $($('.pgStep__users-stats-row-value')[3]).css("width", "40%");
  $($('.pgStep__users-stats-row-value')[4]).css("width", "40%");
  $($('.pgStep__users-stats-row-value')[5]).css("width", "20%");

  $($('.pgStep__users-stats-text-row-value')[0]).css("left", "0%");
  $($('.pgStep__users-stats-text-row-value')[1]).css("left", "45%");
  $($('.pgStep__users-stats-text-row-value')[2]).css("left", "75%");
  $($('.pgStep__users-stats-text-row-value')[3]).css("left", "0%");
  $($('.pgStep__users-stats-text-row-value')[4]).css("left", "40%");
  $($('.pgStep__users-stats-text-row-value')[5]).css("left", "80%");

  $($('.pgStep__users-stats-text-row-value')[0]).css("width", "45%");
  $($('.pgStep__users-stats-text-row-value')[1]).css("width", "30%");
  $($('.pgStep__users-stats-text-row-value')[2]).css("width", "25%");
  $($('.pgStep__users-stats-text-row-value')[3]).css("width", "40%");
  $($('.pgStep__users-stats-text-row-value')[4]).css("width", "40%");
  $($('.pgStep__users-stats-text-row-value')[5]).css("width", "20%");

  $($('.pgStep__users-stats-text-row-value')[0]).html("LOW " + 45 + "%");
  $($('.pgStep__users-stats-text-row-value')[1]).html("MEDIUM " + 30 + "%");
  $($('.pgStep__users-stats-text-row-value')[2]).html("HIGH " + 25 + "%");
  $($('.pgStep__users-stats-text-row-value')[3]).html("LOW " + 40 + "%");
  $($('.pgStep__users-stats-text-row-value')[4]).html("MEDIUM " + 40 + "%");
  $($('.pgStep__users-stats-text-row-value')[5]).html("HIGH " + 20 + "%");

  $(".pgStep__users-stats-text-row-value").css("opacity", "1.0");

  for (var i = 0; i < results.length; i++) {
    animateUsersStats($($(".pgStep__users-stats__col")[parseInt(i/5)]).find(".pgStep__users-stats__col__value")[i%5], (results[i] / maxResults) * 100.0, i);
  }

  $(".pgStep__users-stats-marker").css("opacity", 1.0);

  switch (markerLeft) {
    case 0.3:
      markerLeft = 0.125;
    break;
    case 0.4:
      markerLeft = 0.375;
    break;
    case 0.5:
      markerLeft = 0.5;
    break;
    case 0.6:
      markerLeft = 0.625;
    break;
    case 0.7:
      markerLeft = 0.875;
    break;
  }

  $($(".pgStep__users-stats-marker")[0]).css("left", (markerLeft * 100) + "%");

  var offsetX = 2.5;

  if (markerTop > 10) {
    offsetX = -2.5;
  }
  else if (markerTop > 10) {
    offsetX = 2.5;
  }
  else {
    offsetX = 0;
  }

  $($(".pgStep__users-stats-marker")[1]).css("left", ((((markerTop + offsetX) * 5))) + "%");

  $('.pgConclusions-sharebar-wrapper').css("visibility", "visible");
  $('.pgConclusions-sharebar-wrapper a[data-service="facebook"]').click(function() {
    var risk = "";

    if (cell <= 10) {
      risk = "low";
    }
    else if (cell <= 19) {
      risk = "mid";
    }
    else {
      risk = "high";
    }

    var url = window.location.href;
    var text = "I did the Zika test in the Washington Post and got that I have a "+risk+" risk of getting the virus. Assess your risk in " + url;

    window.open('https://www.facebook.com/sharer/sharer.php?u=' + url,'share_facebook','width=658,height=354,scrollbars=no');
  });
  $('.pgConclusions-sharebar-wrapper a[data-service="twitter"]').click(function() {
    var risk = "";

    if (cell <= 10) {
      risk = "low";
    }
    else if (cell <= 19) {
      risk = "mid";
    }
    else {
      risk = "high";
    }

    var url = window.location.href;
    var text = "I did the Zika test in the @washingtonpost and got that I have a "+ risk +" risk of getting the virus. Assess your risk at " + url;
    window.open('https://twitter.com/share?text=' + text ,'share_twitter','width=550, height=350, scrollbars=no');
  });

};

var animateUsersStats = function(bar, value, i) {
  setTimeout(function() {
    bar.style.height = value + "%";
    bar.style.webkitTransform = "scaleY(" + 1 + ")";
    bar.style.transform = "scaleY(" + 1 + ")";
  }, 1500 + (i * 100));
}

/**
  FunciÃ³n de reescalado
  
  @method resize
*/

rtime = new Date(1, 1, 2000, 12, 00, 00);
timeout = false;
delta = 2;
var scrollLeft = 0;
var oldWidth = 0;
var markerMarginTop = -1;

$(window).on("resize", function() {
    rtime = new Date();
    if (timeout === false) {
        timeout = true;
        scrollLeft = $(".pgChart").scrollLeft();
        oldWidth = $(".pgArticle").width();
        setTimeout(resizeend, delta);
    }

    // 

    if ($(".pgChart").width() < 1180) {
      $(".pgStep__last-chart-marker").css("margin-top", markerMarginTop + "vw");
    }

    if ($(".pgChart").width() > 1180 && markerMarginTop != -1) {
      $(".pgStep__last-chart-marker").css("margin-top", parseInt($(".pgStep__last-chart-marker").css("margin-top")) + "px")
    } 
    //setupCanvas();
});

function resizeend() {
    if (new Date() - rtime < delta) {
        setTimeout(main.resizeend, delta);
    } else {
      timeout = false;
      setupCanvas(); 
      if ($(".pgArticle").width() < tabletTreshold) {
        $(".pgChart").scrollLeft(($(".pgArticle").width() / oldWidth) * scrollLeft);
      }
    }
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
    console.log('{x:'+((e.pageX/$("canvas").width()) - 0.195) + ', y:' + (((e.pageY - 564)/$("canvas").width())) + '}');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGFtbWVyanMvaGFtbWVyLmpzIiwic3JjL2pzL2Jhc2UuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvaWZyYW1lLmpzIiwic3JjL2pzL3BnLXRlbXBsYXRlL3BiSGVhZGVyLmpzIiwic3JjL2pzL3BnLXRlbXBsYXRlL3BiU29jaWFsVG9vbHMuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvcG9zdEdyYXBoaWNzVGVtcGxhdGUuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvdHdpdHRlci1mb2xsb3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Z0ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohIEhhbW1lci5KUyAtIHYyLjAuNiAtIDIwMTUtMTItMjNcbiAqIGh0dHA6Ly9oYW1tZXJqcy5naXRodWIuaW8vXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEpvcmlrIFRhbmdlbGRlcjtcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSAgbGljZW5zZSAqL1xuKGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQsIGV4cG9ydE5hbWUsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbnZhciBWRU5ET1JfUFJFRklYRVMgPSBbJycsICd3ZWJraXQnLCAnTW96JywgJ01TJywgJ21zJywgJ28nXTtcbnZhciBURVNUX0VMRU1FTlQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxudmFyIFRZUEVfRlVOQ1RJT04gPSAnZnVuY3Rpb24nO1xuXG52YXIgcm91bmQgPSBNYXRoLnJvdW5kO1xudmFyIGFicyA9IE1hdGguYWJzO1xudmFyIG5vdyA9IERhdGUubm93O1xuXG4vKipcbiAqIHNldCBhIHRpbWVvdXQgd2l0aCBhIGdpdmVuIHNjb3BlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVvdXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBzZXRUaW1lb3V0Q29udGV4dChmbiwgdGltZW91dCwgY29udGV4dCkge1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGJpbmRGbihmbiwgY29udGV4dCksIHRpbWVvdXQpO1xufVxuXG4vKipcbiAqIGlmIHRoZSBhcmd1bWVudCBpcyBhbiBhcnJheSwgd2Ugd2FudCB0byBleGVjdXRlIHRoZSBmbiBvbiBlYWNoIGVudHJ5XG4gKiBpZiBpdCBhaW50IGFuIGFycmF5IHdlIGRvbid0IHdhbnQgdG8gZG8gYSB0aGluZy5cbiAqIHRoaXMgaXMgdXNlZCBieSBhbGwgdGhlIG1ldGhvZHMgdGhhdCBhY2NlcHQgYSBzaW5nbGUgYW5kIGFycmF5IGFyZ3VtZW50LlxuICogQHBhcmFtIHsqfEFycmF5fSBhcmdcbiAqIEBwYXJhbSB7U3RyaW5nfSBmblxuICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XVxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGludm9rZUFycmF5QXJnKGFyZywgZm4sIGNvbnRleHQpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG4gICAgICAgIGVhY2goYXJnLCBjb250ZXh0W2ZuXSwgY29udGV4dCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogd2FsayBvYmplY3RzIGFuZCBhcnJheXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICovXG5mdW5jdGlvbiBlYWNoKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgaTtcblxuICAgIGlmICghb2JqKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAob2JqLmZvckVhY2gpIHtcbiAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IG9iai5sZW5ndGgpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpIGluIG9iaikge1xuICAgICAgICAgICAgb2JqLmhhc093blByb3BlcnR5KGkpICYmIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIHdyYXAgYSBtZXRob2Qgd2l0aCBhIGRlcHJlY2F0aW9uIHdhcm5pbmcgYW5kIHN0YWNrIHRyYWNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICogQHJldHVybnMge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbiB3cmFwcGluZyB0aGUgc3VwcGxpZWQgbWV0aG9kLlxuICovXG5mdW5jdGlvbiBkZXByZWNhdGUobWV0aG9kLCBuYW1lLCBtZXNzYWdlKSB7XG4gICAgdmFyIGRlcHJlY2F0aW9uTWVzc2FnZSA9ICdERVBSRUNBVEVEIE1FVEhPRDogJyArIG5hbWUgKyAnXFxuJyArIG1lc3NhZ2UgKyAnIEFUIFxcbic7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZSA9IG5ldyBFcnJvcignZ2V0LXN0YWNrLXRyYWNlJyk7XG4gICAgICAgIHZhciBzdGFjayA9IGUgJiYgZS5zdGFjayA/IGUuc3RhY2sucmVwbGFjZSgvXlteXFwoXSs/W1xcbiRdL2dtLCAnJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9eXFxzK2F0XFxzKy9nbSwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSgvXk9iamVjdC48YW5vbnltb3VzPlxccypcXCgvZ20sICd7YW5vbnltb3VzfSgpQCcpIDogJ1Vua25vd24gU3RhY2sgVHJhY2UnO1xuXG4gICAgICAgIHZhciBsb2cgPSB3aW5kb3cuY29uc29sZSAmJiAod2luZG93LmNvbnNvbGUud2FybiB8fCB3aW5kb3cuY29uc29sZS5sb2cpO1xuICAgICAgICBpZiAobG9nKSB7XG4gICAgICAgICAgICBsb2cuY2FsbCh3aW5kb3cuY29uc29sZSwgZGVwcmVjYXRpb25NZXNzYWdlLCBzdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1ldGhvZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8qKlxuICogZXh0ZW5kIG9iamVjdC5cbiAqIG1lYW5zIHRoYXQgcHJvcGVydGllcyBpbiBkZXN0IHdpbGwgYmUgb3ZlcndyaXR0ZW4gYnkgdGhlIG9uZXMgaW4gc3JjLlxuICogQHBhcmFtIHtPYmplY3R9IHRhcmdldFxuICogQHBhcmFtIHsuLi5PYmplY3R9IG9iamVjdHNfdG9fYXNzaWduXG4gKiBAcmV0dXJucyB7T2JqZWN0fSB0YXJnZXRcbiAqL1xudmFyIGFzc2lnbjtcbmlmICh0eXBlb2YgT2JqZWN0LmFzc2lnbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQpIHtcbiAgICAgICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkIHx8IHRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb3V0cHV0ID0gT2JqZWN0KHRhcmdldCk7XG4gICAgICAgIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcbiAgICAgICAgICAgIGlmIChzb3VyY2UgIT09IHVuZGVmaW5lZCAmJiBzb3VyY2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBuZXh0S2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KG5leHRLZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRbbmV4dEtleV0gPSBzb3VyY2VbbmV4dEtleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xufSBlbHNlIHtcbiAgICBhc3NpZ24gPSBPYmplY3QuYXNzaWduO1xufVxuXG4vKipcbiAqIGV4dGVuZCBvYmplY3QuXG4gKiBtZWFucyB0aGF0IHByb3BlcnRpZXMgaW4gZGVzdCB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IHRoZSBvbmVzIGluIHNyYy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkZXN0XG4gKiBAcGFyYW0ge09iamVjdH0gc3JjXG4gKiBAcGFyYW0ge0Jvb2xlYW49ZmFsc2V9IFttZXJnZV1cbiAqIEByZXR1cm5zIHtPYmplY3R9IGRlc3RcbiAqL1xudmFyIGV4dGVuZCA9IGRlcHJlY2F0ZShmdW5jdGlvbiBleHRlbmQoZGVzdCwgc3JjLCBtZXJnZSkge1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc3JjKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBrZXlzLmxlbmd0aCkge1xuICAgICAgICBpZiAoIW1lcmdlIHx8IChtZXJnZSAmJiBkZXN0W2tleXNbaV1dID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICBkZXN0W2tleXNbaV1dID0gc3JjW2tleXNbaV1dO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgcmV0dXJuIGRlc3Q7XG59LCAnZXh0ZW5kJywgJ1VzZSBgYXNzaWduYC4nKTtcblxuLyoqXG4gKiBtZXJnZSB0aGUgdmFsdWVzIGZyb20gc3JjIGluIHRoZSBkZXN0LlxuICogbWVhbnMgdGhhdCBwcm9wZXJ0aWVzIHRoYXQgZXhpc3QgaW4gZGVzdCB3aWxsIG5vdCBiZSBvdmVyd3JpdHRlbiBieSBzcmNcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZXN0XG4gKiBAcGFyYW0ge09iamVjdH0gc3JjXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBkZXN0XG4gKi9cbnZhciBtZXJnZSA9IGRlcHJlY2F0ZShmdW5jdGlvbiBtZXJnZShkZXN0LCBzcmMpIHtcbiAgICByZXR1cm4gZXh0ZW5kKGRlc3QsIHNyYywgdHJ1ZSk7XG59LCAnbWVyZ2UnLCAnVXNlIGBhc3NpZ25gLicpO1xuXG4vKipcbiAqIHNpbXBsZSBjbGFzcyBpbmhlcml0YW5jZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2hpbGRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGJhc2VcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllc11cbiAqL1xuZnVuY3Rpb24gaW5oZXJpdChjaGlsZCwgYmFzZSwgcHJvcGVydGllcykge1xuICAgIHZhciBiYXNlUCA9IGJhc2UucHJvdG90eXBlLFxuICAgICAgICBjaGlsZFA7XG5cbiAgICBjaGlsZFAgPSBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGJhc2VQKTtcbiAgICBjaGlsZFAuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgICBjaGlsZFAuX3N1cGVyID0gYmFzZVA7XG5cbiAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICBhc3NpZ24oY2hpbGRQLCBwcm9wZXJ0aWVzKTtcbiAgICB9XG59XG5cbi8qKlxuICogc2ltcGxlIGZ1bmN0aW9uIGJpbmRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICogQHJldHVybnMge0Z1bmN0aW9ufVxuICovXG5mdW5jdGlvbiBiaW5kRm4oZm4sIGNvbnRleHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gYm91bmRGbigpIHtcbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBsZXQgYSBib29sZWFuIHZhbHVlIGFsc28gYmUgYSBmdW5jdGlvbiB0aGF0IG11c3QgcmV0dXJuIGEgYm9vbGVhblxuICogdGhpcyBmaXJzdCBpdGVtIGluIGFyZ3Mgd2lsbCBiZSB1c2VkIGFzIHRoZSBjb250ZXh0XG4gKiBAcGFyYW0ge0Jvb2xlYW58RnVuY3Rpb259IHZhbFxuICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gYm9vbE9yRm4odmFsLCBhcmdzKSB7XG4gICAgaWYgKHR5cGVvZiB2YWwgPT0gVFlQRV9GVU5DVElPTikge1xuICAgICAgICByZXR1cm4gdmFsLmFwcGx5KGFyZ3MgPyBhcmdzWzBdIHx8IHVuZGVmaW5lZCA6IHVuZGVmaW5lZCwgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiB2YWw7XG59XG5cbi8qKlxuICogdXNlIHRoZSB2YWwyIHdoZW4gdmFsMSBpcyB1bmRlZmluZWRcbiAqIEBwYXJhbSB7Kn0gdmFsMVxuICogQHBhcmFtIHsqfSB2YWwyXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gaWZVbmRlZmluZWQodmFsMSwgdmFsMikge1xuICAgIHJldHVybiAodmFsMSA9PT0gdW5kZWZpbmVkKSA/IHZhbDIgOiB2YWwxO1xufVxuXG4vKipcbiAqIGFkZEV2ZW50TGlzdGVuZXIgd2l0aCBtdWx0aXBsZSBldmVudHMgYXQgb25jZVxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0XG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAqL1xuZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcnModGFyZ2V0LCB0eXBlcywgaGFuZGxlcikge1xuICAgIGVhY2goc3BsaXRTdHIodHlwZXMpLCBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiByZW1vdmVFdmVudExpc3RlbmVyIHdpdGggbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2VcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXJzKHRhcmdldCwgdHlwZXMsIGhhbmRsZXIpIHtcbiAgICBlYWNoKHNwbGl0U3RyKHR5cGVzKSwgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogZmluZCBpZiBhIG5vZGUgaXMgaW4gdGhlIGdpdmVuIHBhcmVudFxuICogQG1ldGhvZCBoYXNQYXJlbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGVcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHBhcmVudFxuICogQHJldHVybiB7Qm9vbGVhbn0gZm91bmRcbiAqL1xuZnVuY3Rpb24gaGFzUGFyZW50KG5vZGUsIHBhcmVudCkge1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlID09IHBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIHNtYWxsIGluZGV4T2Ygd3JhcHBlclxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHBhcmFtIHtTdHJpbmd9IGZpbmRcbiAqIEByZXR1cm5zIHtCb29sZWFufSBmb3VuZFxuICovXG5mdW5jdGlvbiBpblN0cihzdHIsIGZpbmQpIHtcbiAgICByZXR1cm4gc3RyLmluZGV4T2YoZmluZCkgPiAtMTtcbn1cblxuLyoqXG4gKiBzcGxpdCBzdHJpbmcgb24gd2hpdGVzcGFjZVxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybnMge0FycmF5fSB3b3Jkc1xuICovXG5mdW5jdGlvbiBzcGxpdFN0cihzdHIpIHtcbiAgICByZXR1cm4gc3RyLnRyaW0oKS5zcGxpdCgvXFxzKy9nKTtcbn1cblxuLyoqXG4gKiBmaW5kIGlmIGEgYXJyYXkgY29udGFpbnMgdGhlIG9iamVjdCB1c2luZyBpbmRleE9mIG9yIGEgc2ltcGxlIHBvbHlGaWxsXG4gKiBAcGFyYW0ge0FycmF5fSBzcmNcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaW5kXG4gKiBAcGFyYW0ge1N0cmluZ30gW2ZpbmRCeUtleV1cbiAqIEByZXR1cm4ge0Jvb2xlYW58TnVtYmVyfSBmYWxzZSB3aGVuIG5vdCBmb3VuZCwgb3IgdGhlIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGluQXJyYXkoc3JjLCBmaW5kLCBmaW5kQnlLZXkpIHtcbiAgICBpZiAoc3JjLmluZGV4T2YgJiYgIWZpbmRCeUtleSkge1xuICAgICAgICByZXR1cm4gc3JjLmluZGV4T2YoZmluZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHNyYy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICgoZmluZEJ5S2V5ICYmIHNyY1tpXVtmaW5kQnlLZXldID09IGZpbmQpIHx8ICghZmluZEJ5S2V5ICYmIHNyY1tpXSA9PT0gZmluZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxufVxuXG4vKipcbiAqIGNvbnZlcnQgYXJyYXktbGlrZSBvYmplY3RzIHRvIHJlYWwgYXJyYXlzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHRvQXJyYXkob2JqKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG9iaiwgMCk7XG59XG5cbi8qKlxuICogdW5pcXVlIGFycmF5IHdpdGggb2JqZWN0cyBiYXNlZCBvbiBhIGtleSAobGlrZSAnaWQnKSBvciBqdXN0IGJ5IHRoZSBhcnJheSdzIHZhbHVlXG4gKiBAcGFyYW0ge0FycmF5fSBzcmMgW3tpZDoxfSx7aWQ6Mn0se2lkOjF9XVxuICogQHBhcmFtIHtTdHJpbmd9IFtrZXldXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtzb3J0PUZhbHNlXVxuICogQHJldHVybnMge0FycmF5fSBbe2lkOjF9LHtpZDoyfV1cbiAqL1xuZnVuY3Rpb24gdW5pcXVlQXJyYXkoc3JjLCBrZXksIHNvcnQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICB3aGlsZSAoaSA8IHNyYy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIHZhbCA9IGtleSA/IHNyY1tpXVtrZXldIDogc3JjW2ldO1xuICAgICAgICBpZiAoaW5BcnJheSh2YWx1ZXMsIHZhbCkgPCAwKSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goc3JjW2ldKTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZXNbaV0gPSB2YWw7XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICBpZiAoc29ydCkge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuc29ydCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuc29ydChmdW5jdGlvbiBzb3J0VW5pcXVlQXJyYXkoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhW2tleV0gPiBiW2tleV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xufVxuXG4vKipcbiAqIGdldCB0aGUgcHJlZml4ZWQgcHJvcGVydHlcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICogQHJldHVybnMge1N0cmluZ3xVbmRlZmluZWR9IHByZWZpeGVkXG4gKi9cbmZ1bmN0aW9uIHByZWZpeGVkKG9iaiwgcHJvcGVydHkpIHtcbiAgICB2YXIgcHJlZml4LCBwcm9wO1xuICAgIHZhciBjYW1lbFByb3AgPSBwcm9wZXJ0eVswXS50b1VwcGVyQ2FzZSgpICsgcHJvcGVydHkuc2xpY2UoMSk7XG5cbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBWRU5ET1JfUFJFRklYRVMubGVuZ3RoKSB7XG4gICAgICAgIHByZWZpeCA9IFZFTkRPUl9QUkVGSVhFU1tpXTtcbiAgICAgICAgcHJvcCA9IChwcmVmaXgpID8gcHJlZml4ICsgY2FtZWxQcm9wIDogcHJvcGVydHk7XG5cbiAgICAgICAgaWYgKHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvcDtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogZ2V0IGEgdW5pcXVlIGlkXG4gKiBAcmV0dXJucyB7bnVtYmVyfSB1bmlxdWVJZFxuICovXG52YXIgX3VuaXF1ZUlkID0gMTtcbmZ1bmN0aW9uIHVuaXF1ZUlkKCkge1xuICAgIHJldHVybiBfdW5pcXVlSWQrKztcbn1cblxuLyoqXG4gKiBnZXQgdGhlIHdpbmRvdyBvYmplY3Qgb2YgYW4gZWxlbWVudFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHJldHVybnMge0RvY3VtZW50Vmlld3xXaW5kb3d9XG4gKi9cbmZ1bmN0aW9uIGdldFdpbmRvd0ZvckVsZW1lbnQoZWxlbWVudCkge1xuICAgIHZhciBkb2MgPSBlbGVtZW50Lm93bmVyRG9jdW1lbnQgfHwgZWxlbWVudDtcbiAgICByZXR1cm4gKGRvYy5kZWZhdWx0VmlldyB8fCBkb2MucGFyZW50V2luZG93IHx8IHdpbmRvdyk7XG59XG5cbnZhciBNT0JJTEVfUkVHRVggPSAvbW9iaWxlfHRhYmxldHxpcChhZHxob25lfG9kKXxhbmRyb2lkL2k7XG5cbnZhciBTVVBQT1JUX1RPVUNIID0gKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdyk7XG52YXIgU1VQUE9SVF9QT0lOVEVSX0VWRU5UUyA9IHByZWZpeGVkKHdpbmRvdywgJ1BvaW50ZXJFdmVudCcpICE9PSB1bmRlZmluZWQ7XG52YXIgU1VQUE9SVF9PTkxZX1RPVUNIID0gU1VQUE9SVF9UT1VDSCAmJiBNT0JJTEVfUkVHRVgudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxudmFyIElOUFVUX1RZUEVfVE9VQ0ggPSAndG91Y2gnO1xudmFyIElOUFVUX1RZUEVfUEVOID0gJ3Blbic7XG52YXIgSU5QVVRfVFlQRV9NT1VTRSA9ICdtb3VzZSc7XG52YXIgSU5QVVRfVFlQRV9LSU5FQ1QgPSAna2luZWN0JztcblxudmFyIENPTVBVVEVfSU5URVJWQUwgPSAyNTtcblxudmFyIElOUFVUX1NUQVJUID0gMTtcbnZhciBJTlBVVF9NT1ZFID0gMjtcbnZhciBJTlBVVF9FTkQgPSA0O1xudmFyIElOUFVUX0NBTkNFTCA9IDg7XG5cbnZhciBESVJFQ1RJT05fTk9ORSA9IDE7XG52YXIgRElSRUNUSU9OX0xFRlQgPSAyO1xudmFyIERJUkVDVElPTl9SSUdIVCA9IDQ7XG52YXIgRElSRUNUSU9OX1VQID0gODtcbnZhciBESVJFQ1RJT05fRE9XTiA9IDE2O1xuXG52YXIgRElSRUNUSU9OX0hPUklaT05UQUwgPSBESVJFQ1RJT05fTEVGVCB8IERJUkVDVElPTl9SSUdIVDtcbnZhciBESVJFQ1RJT05fVkVSVElDQUwgPSBESVJFQ1RJT05fVVAgfCBESVJFQ1RJT05fRE9XTjtcbnZhciBESVJFQ1RJT05fQUxMID0gRElSRUNUSU9OX0hPUklaT05UQUwgfCBESVJFQ1RJT05fVkVSVElDQUw7XG5cbnZhciBQUk9QU19YWSA9IFsneCcsICd5J107XG52YXIgUFJPUFNfQ0xJRU5UX1hZID0gWydjbGllbnRYJywgJ2NsaWVudFknXTtcblxuLyoqXG4gKiBjcmVhdGUgbmV3IGlucHV0IHR5cGUgbWFuYWdlclxuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge0lucHV0fVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIElucHV0KG1hbmFnZXIsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMubWFuYWdlciA9IG1hbmFnZXI7XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIHRoaXMuZWxlbWVudCA9IG1hbmFnZXIuZWxlbWVudDtcbiAgICB0aGlzLnRhcmdldCA9IG1hbmFnZXIub3B0aW9ucy5pbnB1dFRhcmdldDtcblxuICAgIC8vIHNtYWxsZXIgd3JhcHBlciBhcm91bmQgdGhlIGhhbmRsZXIsIGZvciB0aGUgc2NvcGUgYW5kIHRoZSBlbmFibGVkIHN0YXRlIG9mIHRoZSBtYW5hZ2VyLFxuICAgIC8vIHNvIHdoZW4gZGlzYWJsZWQgdGhlIGlucHV0IGV2ZW50cyBhcmUgY29tcGxldGVseSBieXBhc3NlZC5cbiAgICB0aGlzLmRvbUhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgICAgICBpZiAoYm9vbE9yRm4obWFuYWdlci5vcHRpb25zLmVuYWJsZSwgW21hbmFnZXJdKSkge1xuICAgICAgICAgICAgc2VsZi5oYW5kbGVyKGV2KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmluaXQoKTtcblxufVxuXG5JbnB1dC5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogc2hvdWxkIGhhbmRsZSB0aGUgaW5wdXRFdmVudCBkYXRhIGFuZCB0cmlnZ2VyIHRoZSBjYWxsYmFja1xuICAgICAqIEB2aXJ0dWFsXG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24oKSB7IH0sXG5cbiAgICAvKipcbiAgICAgKiBiaW5kIHRoZSBldmVudHNcbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5ldkVsICYmIGFkZEV2ZW50TGlzdGVuZXJzKHRoaXMuZWxlbWVudCwgdGhpcy5ldkVsLCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgICAgICB0aGlzLmV2VGFyZ2V0ICYmIGFkZEV2ZW50TGlzdGVuZXJzKHRoaXMudGFyZ2V0LCB0aGlzLmV2VGFyZ2V0LCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgICAgICB0aGlzLmV2V2luICYmIGFkZEV2ZW50TGlzdGVuZXJzKGdldFdpbmRvd0ZvckVsZW1lbnQodGhpcy5lbGVtZW50KSwgdGhpcy5ldldpbiwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdW5iaW5kIHRoZSBldmVudHNcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5ldkVsICYmIHJlbW92ZUV2ZW50TGlzdGVuZXJzKHRoaXMuZWxlbWVudCwgdGhpcy5ldkVsLCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgICAgICB0aGlzLmV2VGFyZ2V0ICYmIHJlbW92ZUV2ZW50TGlzdGVuZXJzKHRoaXMudGFyZ2V0LCB0aGlzLmV2VGFyZ2V0LCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgICAgICB0aGlzLmV2V2luICYmIHJlbW92ZUV2ZW50TGlzdGVuZXJzKGdldFdpbmRvd0ZvckVsZW1lbnQodGhpcy5lbGVtZW50KSwgdGhpcy5ldldpbiwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIGNyZWF0ZSBuZXcgaW5wdXQgdHlwZSBtYW5hZ2VyXG4gKiBjYWxsZWQgYnkgdGhlIE1hbmFnZXIgY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7SGFtbWVyfSBtYW5hZ2VyXG4gKiBAcmV0dXJucyB7SW5wdXR9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUlucHV0SW5zdGFuY2UobWFuYWdlcikge1xuICAgIHZhciBUeXBlO1xuICAgIHZhciBpbnB1dENsYXNzID0gbWFuYWdlci5vcHRpb25zLmlucHV0Q2xhc3M7XG5cbiAgICBpZiAoaW5wdXRDbGFzcykge1xuICAgICAgICBUeXBlID0gaW5wdXRDbGFzcztcbiAgICB9IGVsc2UgaWYgKFNVUFBPUlRfUE9JTlRFUl9FVkVOVFMpIHtcbiAgICAgICAgVHlwZSA9IFBvaW50ZXJFdmVudElucHV0O1xuICAgIH0gZWxzZSBpZiAoU1VQUE9SVF9PTkxZX1RPVUNIKSB7XG4gICAgICAgIFR5cGUgPSBUb3VjaElucHV0O1xuICAgIH0gZWxzZSBpZiAoIVNVUFBPUlRfVE9VQ0gpIHtcbiAgICAgICAgVHlwZSA9IE1vdXNlSW5wdXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgVHlwZSA9IFRvdWNoTW91c2VJbnB1dDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyAoVHlwZSkobWFuYWdlciwgaW5wdXRIYW5kbGVyKTtcbn1cblxuLyoqXG4gKiBoYW5kbGUgaW5wdXQgZXZlbnRzXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFR5cGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICovXG5mdW5jdGlvbiBpbnB1dEhhbmRsZXIobWFuYWdlciwgZXZlbnRUeXBlLCBpbnB1dCkge1xuICAgIHZhciBwb2ludGVyc0xlbiA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aDtcbiAgICB2YXIgY2hhbmdlZFBvaW50ZXJzTGVuID0gaW5wdXQuY2hhbmdlZFBvaW50ZXJzLmxlbmd0aDtcbiAgICB2YXIgaXNGaXJzdCA9IChldmVudFR5cGUgJiBJTlBVVF9TVEFSVCAmJiAocG9pbnRlcnNMZW4gLSBjaGFuZ2VkUG9pbnRlcnNMZW4gPT09IDApKTtcbiAgICB2YXIgaXNGaW5hbCA9IChldmVudFR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSAmJiAocG9pbnRlcnNMZW4gLSBjaGFuZ2VkUG9pbnRlcnNMZW4gPT09IDApKTtcblxuICAgIGlucHV0LmlzRmlyc3QgPSAhIWlzRmlyc3Q7XG4gICAgaW5wdXQuaXNGaW5hbCA9ICEhaXNGaW5hbDtcblxuICAgIGlmIChpc0ZpcnN0KSB7XG4gICAgICAgIG1hbmFnZXIuc2Vzc2lvbiA9IHt9O1xuICAgIH1cblxuICAgIC8vIHNvdXJjZSBldmVudCBpcyB0aGUgbm9ybWFsaXplZCB2YWx1ZSBvZiB0aGUgZG9tRXZlbnRzXG4gICAgLy8gbGlrZSAndG91Y2hzdGFydCwgbW91c2V1cCwgcG9pbnRlcmRvd24nXG4gICAgaW5wdXQuZXZlbnRUeXBlID0gZXZlbnRUeXBlO1xuXG4gICAgLy8gY29tcHV0ZSBzY2FsZSwgcm90YXRpb24gZXRjXG4gICAgY29tcHV0ZUlucHV0RGF0YShtYW5hZ2VyLCBpbnB1dCk7XG5cbiAgICAvLyBlbWl0IHNlY3JldCBldmVudFxuICAgIG1hbmFnZXIuZW1pdCgnaGFtbWVyLmlucHV0JywgaW5wdXQpO1xuXG4gICAgbWFuYWdlci5yZWNvZ25pemUoaW5wdXQpO1xuICAgIG1hbmFnZXIuc2Vzc2lvbi5wcmV2SW5wdXQgPSBpbnB1dDtcbn1cblxuLyoqXG4gKiBleHRlbmQgdGhlIGRhdGEgd2l0aCBzb21lIHVzYWJsZSBwcm9wZXJ0aWVzIGxpa2Ugc2NhbGUsIHJvdGF0ZSwgdmVsb2NpdHkgZXRjXG4gKiBAcGFyYW0ge09iamVjdH0gbWFuYWdlclxuICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVJbnB1dERhdGEobWFuYWdlciwgaW5wdXQpIHtcbiAgICB2YXIgc2Vzc2lvbiA9IG1hbmFnZXIuc2Vzc2lvbjtcbiAgICB2YXIgcG9pbnRlcnMgPSBpbnB1dC5wb2ludGVycztcbiAgICB2YXIgcG9pbnRlcnNMZW5ndGggPSBwb2ludGVycy5sZW5ndGg7XG5cbiAgICAvLyBzdG9yZSB0aGUgZmlyc3QgaW5wdXQgdG8gY2FsY3VsYXRlIHRoZSBkaXN0YW5jZSBhbmQgZGlyZWN0aW9uXG4gICAgaWYgKCFzZXNzaW9uLmZpcnN0SW5wdXQpIHtcbiAgICAgICAgc2Vzc2lvbi5maXJzdElucHV0ID0gc2ltcGxlQ2xvbmVJbnB1dERhdGEoaW5wdXQpO1xuICAgIH1cblxuICAgIC8vIHRvIGNvbXB1dGUgc2NhbGUgYW5kIHJvdGF0aW9uIHdlIG5lZWQgdG8gc3RvcmUgdGhlIG11bHRpcGxlIHRvdWNoZXNcbiAgICBpZiAocG9pbnRlcnNMZW5ndGggPiAxICYmICFzZXNzaW9uLmZpcnN0TXVsdGlwbGUpIHtcbiAgICAgICAgc2Vzc2lvbi5maXJzdE11bHRpcGxlID0gc2ltcGxlQ2xvbmVJbnB1dERhdGEoaW5wdXQpO1xuICAgIH0gZWxzZSBpZiAocG9pbnRlcnNMZW5ndGggPT09IDEpIHtcbiAgICAgICAgc2Vzc2lvbi5maXJzdE11bHRpcGxlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGZpcnN0SW5wdXQgPSBzZXNzaW9uLmZpcnN0SW5wdXQ7XG4gICAgdmFyIGZpcnN0TXVsdGlwbGUgPSBzZXNzaW9uLmZpcnN0TXVsdGlwbGU7XG4gICAgdmFyIG9mZnNldENlbnRlciA9IGZpcnN0TXVsdGlwbGUgPyBmaXJzdE11bHRpcGxlLmNlbnRlciA6IGZpcnN0SW5wdXQuY2VudGVyO1xuXG4gICAgdmFyIGNlbnRlciA9IGlucHV0LmNlbnRlciA9IGdldENlbnRlcihwb2ludGVycyk7XG4gICAgaW5wdXQudGltZVN0YW1wID0gbm93KCk7XG4gICAgaW5wdXQuZGVsdGFUaW1lID0gaW5wdXQudGltZVN0YW1wIC0gZmlyc3RJbnB1dC50aW1lU3RhbXA7XG5cbiAgICBpbnB1dC5hbmdsZSA9IGdldEFuZ2xlKG9mZnNldENlbnRlciwgY2VudGVyKTtcbiAgICBpbnB1dC5kaXN0YW5jZSA9IGdldERpc3RhbmNlKG9mZnNldENlbnRlciwgY2VudGVyKTtcblxuICAgIGNvbXB1dGVEZWx0YVhZKHNlc3Npb24sIGlucHV0KTtcbiAgICBpbnB1dC5vZmZzZXREaXJlY3Rpb24gPSBnZXREaXJlY3Rpb24oaW5wdXQuZGVsdGFYLCBpbnB1dC5kZWx0YVkpO1xuXG4gICAgdmFyIG92ZXJhbGxWZWxvY2l0eSA9IGdldFZlbG9jaXR5KGlucHV0LmRlbHRhVGltZSwgaW5wdXQuZGVsdGFYLCBpbnB1dC5kZWx0YVkpO1xuICAgIGlucHV0Lm92ZXJhbGxWZWxvY2l0eVggPSBvdmVyYWxsVmVsb2NpdHkueDtcbiAgICBpbnB1dC5vdmVyYWxsVmVsb2NpdHlZID0gb3ZlcmFsbFZlbG9jaXR5Lnk7XG4gICAgaW5wdXQub3ZlcmFsbFZlbG9jaXR5ID0gKGFicyhvdmVyYWxsVmVsb2NpdHkueCkgPiBhYnMob3ZlcmFsbFZlbG9jaXR5LnkpKSA/IG92ZXJhbGxWZWxvY2l0eS54IDogb3ZlcmFsbFZlbG9jaXR5Lnk7XG5cbiAgICBpbnB1dC5zY2FsZSA9IGZpcnN0TXVsdGlwbGUgPyBnZXRTY2FsZShmaXJzdE11bHRpcGxlLnBvaW50ZXJzLCBwb2ludGVycykgOiAxO1xuICAgIGlucHV0LnJvdGF0aW9uID0gZmlyc3RNdWx0aXBsZSA/IGdldFJvdGF0aW9uKGZpcnN0TXVsdGlwbGUucG9pbnRlcnMsIHBvaW50ZXJzKSA6IDA7XG5cbiAgICBpbnB1dC5tYXhQb2ludGVycyA9ICFzZXNzaW9uLnByZXZJbnB1dCA/IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA6ICgoaW5wdXQucG9pbnRlcnMubGVuZ3RoID5cbiAgICAgICAgc2Vzc2lvbi5wcmV2SW5wdXQubWF4UG9pbnRlcnMpID8gaW5wdXQucG9pbnRlcnMubGVuZ3RoIDogc2Vzc2lvbi5wcmV2SW5wdXQubWF4UG9pbnRlcnMpO1xuXG4gICAgY29tcHV0ZUludGVydmFsSW5wdXREYXRhKHNlc3Npb24sIGlucHV0KTtcblxuICAgIC8vIGZpbmQgdGhlIGNvcnJlY3QgdGFyZ2V0XG4gICAgdmFyIHRhcmdldCA9IG1hbmFnZXIuZWxlbWVudDtcbiAgICBpZiAoaGFzUGFyZW50KGlucHV0LnNyY0V2ZW50LnRhcmdldCwgdGFyZ2V0KSkge1xuICAgICAgICB0YXJnZXQgPSBpbnB1dC5zcmNFdmVudC50YXJnZXQ7XG4gICAgfVxuICAgIGlucHV0LnRhcmdldCA9IHRhcmdldDtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZURlbHRhWFkoc2Vzc2lvbiwgaW5wdXQpIHtcbiAgICB2YXIgY2VudGVyID0gaW5wdXQuY2VudGVyO1xuICAgIHZhciBvZmZzZXQgPSBzZXNzaW9uLm9mZnNldERlbHRhIHx8IHt9O1xuICAgIHZhciBwcmV2RGVsdGEgPSBzZXNzaW9uLnByZXZEZWx0YSB8fCB7fTtcbiAgICB2YXIgcHJldklucHV0ID0gc2Vzc2lvbi5wcmV2SW5wdXQgfHwge307XG5cbiAgICBpZiAoaW5wdXQuZXZlbnRUeXBlID09PSBJTlBVVF9TVEFSVCB8fCBwcmV2SW5wdXQuZXZlbnRUeXBlID09PSBJTlBVVF9FTkQpIHtcbiAgICAgICAgcHJldkRlbHRhID0gc2Vzc2lvbi5wcmV2RGVsdGEgPSB7XG4gICAgICAgICAgICB4OiBwcmV2SW5wdXQuZGVsdGFYIHx8IDAsXG4gICAgICAgICAgICB5OiBwcmV2SW5wdXQuZGVsdGFZIHx8IDBcbiAgICAgICAgfTtcblxuICAgICAgICBvZmZzZXQgPSBzZXNzaW9uLm9mZnNldERlbHRhID0ge1xuICAgICAgICAgICAgeDogY2VudGVyLngsXG4gICAgICAgICAgICB5OiBjZW50ZXIueVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlucHV0LmRlbHRhWCA9IHByZXZEZWx0YS54ICsgKGNlbnRlci54IC0gb2Zmc2V0LngpO1xuICAgIGlucHV0LmRlbHRhWSA9IHByZXZEZWx0YS55ICsgKGNlbnRlci55IC0gb2Zmc2V0LnkpO1xufVxuXG4vKipcbiAqIHZlbG9jaXR5IGlzIGNhbGN1bGF0ZWQgZXZlcnkgeCBtc1xuICogQHBhcmFtIHtPYmplY3R9IHNlc3Npb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICovXG5mdW5jdGlvbiBjb21wdXRlSW50ZXJ2YWxJbnB1dERhdGEoc2Vzc2lvbiwgaW5wdXQpIHtcbiAgICB2YXIgbGFzdCA9IHNlc3Npb24ubGFzdEludGVydmFsIHx8IGlucHV0LFxuICAgICAgICBkZWx0YVRpbWUgPSBpbnB1dC50aW1lU3RhbXAgLSBsYXN0LnRpbWVTdGFtcCxcbiAgICAgICAgdmVsb2NpdHksIHZlbG9jaXR5WCwgdmVsb2NpdHlZLCBkaXJlY3Rpb247XG5cbiAgICBpZiAoaW5wdXQuZXZlbnRUeXBlICE9IElOUFVUX0NBTkNFTCAmJiAoZGVsdGFUaW1lID4gQ09NUFVURV9JTlRFUlZBTCB8fCBsYXN0LnZlbG9jaXR5ID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAgIHZhciBkZWx0YVggPSBpbnB1dC5kZWx0YVggLSBsYXN0LmRlbHRhWDtcbiAgICAgICAgdmFyIGRlbHRhWSA9IGlucHV0LmRlbHRhWSAtIGxhc3QuZGVsdGFZO1xuXG4gICAgICAgIHZhciB2ID0gZ2V0VmVsb2NpdHkoZGVsdGFUaW1lLCBkZWx0YVgsIGRlbHRhWSk7XG4gICAgICAgIHZlbG9jaXR5WCA9IHYueDtcbiAgICAgICAgdmVsb2NpdHlZID0gdi55O1xuICAgICAgICB2ZWxvY2l0eSA9IChhYnModi54KSA+IGFicyh2LnkpKSA/IHYueCA6IHYueTtcbiAgICAgICAgZGlyZWN0aW9uID0gZ2V0RGlyZWN0aW9uKGRlbHRhWCwgZGVsdGFZKTtcblxuICAgICAgICBzZXNzaW9uLmxhc3RJbnRlcnZhbCA9IGlucHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHVzZSBsYXRlc3QgdmVsb2NpdHkgaW5mbyBpZiBpdCBkb2Vzbid0IG92ZXJ0YWtlIGEgbWluaW11bSBwZXJpb2RcbiAgICAgICAgdmVsb2NpdHkgPSBsYXN0LnZlbG9jaXR5O1xuICAgICAgICB2ZWxvY2l0eVggPSBsYXN0LnZlbG9jaXR5WDtcbiAgICAgICAgdmVsb2NpdHlZID0gbGFzdC52ZWxvY2l0eVk7XG4gICAgICAgIGRpcmVjdGlvbiA9IGxhc3QuZGlyZWN0aW9uO1xuICAgIH1cblxuICAgIGlucHV0LnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgaW5wdXQudmVsb2NpdHlYID0gdmVsb2NpdHlYO1xuICAgIGlucHV0LnZlbG9jaXR5WSA9IHZlbG9jaXR5WTtcbiAgICBpbnB1dC5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG59XG5cbi8qKlxuICogY3JlYXRlIGEgc2ltcGxlIGNsb25lIGZyb20gdGhlIGlucHV0IHVzZWQgZm9yIHN0b3JhZ2Ugb2YgZmlyc3RJbnB1dCBhbmQgZmlyc3RNdWx0aXBsZVxuICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gKiBAcmV0dXJucyB7T2JqZWN0fSBjbG9uZWRJbnB1dERhdGFcbiAqL1xuZnVuY3Rpb24gc2ltcGxlQ2xvbmVJbnB1dERhdGEoaW5wdXQpIHtcbiAgICAvLyBtYWtlIGEgc2ltcGxlIGNvcHkgb2YgdGhlIHBvaW50ZXJzIGJlY2F1c2Ugd2Ugd2lsbCBnZXQgYSByZWZlcmVuY2UgaWYgd2UgZG9uJ3RcbiAgICAvLyB3ZSBvbmx5IG5lZWQgY2xpZW50WFkgZm9yIHRoZSBjYWxjdWxhdGlvbnNcbiAgICB2YXIgcG9pbnRlcnMgPSBbXTtcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBpbnB1dC5wb2ludGVycy5sZW5ndGgpIHtcbiAgICAgICAgcG9pbnRlcnNbaV0gPSB7XG4gICAgICAgICAgICBjbGllbnRYOiByb3VuZChpbnB1dC5wb2ludGVyc1tpXS5jbGllbnRYKSxcbiAgICAgICAgICAgIGNsaWVudFk6IHJvdW5kKGlucHV0LnBvaW50ZXJzW2ldLmNsaWVudFkpXG4gICAgICAgIH07XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0aW1lU3RhbXA6IG5vdygpLFxuICAgICAgICBwb2ludGVyczogcG9pbnRlcnMsXG4gICAgICAgIGNlbnRlcjogZ2V0Q2VudGVyKHBvaW50ZXJzKSxcbiAgICAgICAgZGVsdGFYOiBpbnB1dC5kZWx0YVgsXG4gICAgICAgIGRlbHRhWTogaW5wdXQuZGVsdGFZXG4gICAgfTtcbn1cblxuLyoqXG4gKiBnZXQgdGhlIGNlbnRlciBvZiBhbGwgdGhlIHBvaW50ZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBwb2ludGVyc1xuICogQHJldHVybiB7T2JqZWN0fSBjZW50ZXIgY29udGFpbnMgYHhgIGFuZCBgeWAgcHJvcGVydGllc1xuICovXG5mdW5jdGlvbiBnZXRDZW50ZXIocG9pbnRlcnMpIHtcbiAgICB2YXIgcG9pbnRlcnNMZW5ndGggPSBwb2ludGVycy5sZW5ndGg7XG5cbiAgICAvLyBubyBuZWVkIHRvIGxvb3Agd2hlbiBvbmx5IG9uZSB0b3VjaFxuICAgIGlmIChwb2ludGVyc0xlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogcm91bmQocG9pbnRlcnNbMF0uY2xpZW50WCksXG4gICAgICAgICAgICB5OiByb3VuZChwb2ludGVyc1swXS5jbGllbnRZKVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciB4ID0gMCwgeSA9IDAsIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgcG9pbnRlcnNMZW5ndGgpIHtcbiAgICAgICAgeCArPSBwb2ludGVyc1tpXS5jbGllbnRYO1xuICAgICAgICB5ICs9IHBvaW50ZXJzW2ldLmNsaWVudFk7XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB4OiByb3VuZCh4IC8gcG9pbnRlcnNMZW5ndGgpLFxuICAgICAgICB5OiByb3VuZCh5IC8gcG9pbnRlcnNMZW5ndGgpXG4gICAgfTtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgdGhlIHZlbG9jaXR5IGJldHdlZW4gdHdvIHBvaW50cy4gdW5pdCBpcyBpbiBweCBwZXIgbXMuXG4gKiBAcGFyYW0ge051bWJlcn0gZGVsdGFUaW1lXG4gKiBAcGFyYW0ge051bWJlcn0geFxuICogQHBhcmFtIHtOdW1iZXJ9IHlcbiAqIEByZXR1cm4ge09iamVjdH0gdmVsb2NpdHkgYHhgIGFuZCBgeWBcbiAqL1xuZnVuY3Rpb24gZ2V0VmVsb2NpdHkoZGVsdGFUaW1lLCB4LCB5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogeCAvIGRlbHRhVGltZSB8fCAwLFxuICAgICAgICB5OiB5IC8gZGVsdGFUaW1lIHx8IDBcbiAgICB9O1xufVxuXG4vKipcbiAqIGdldCB0aGUgZGlyZWN0aW9uIGJldHdlZW4gdHdvIHBvaW50c1xuICogQHBhcmFtIHtOdW1iZXJ9IHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB5XG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGRpcmVjdGlvblxuICovXG5mdW5jdGlvbiBnZXREaXJlY3Rpb24oeCwgeSkge1xuICAgIGlmICh4ID09PSB5KSB7XG4gICAgICAgIHJldHVybiBESVJFQ1RJT05fTk9ORTtcbiAgICB9XG5cbiAgICBpZiAoYWJzKHgpID49IGFicyh5KSkge1xuICAgICAgICByZXR1cm4geCA8IDAgPyBESVJFQ1RJT05fTEVGVCA6IERJUkVDVElPTl9SSUdIVDtcbiAgICB9XG4gICAgcmV0dXJuIHkgPCAwID8gRElSRUNUSU9OX1VQIDogRElSRUNUSU9OX0RPV047XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSBhYnNvbHV0ZSBkaXN0YW5jZSBiZXR3ZWVuIHR3byBwb2ludHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBwMSB7eCwgeX1cbiAqIEBwYXJhbSB7T2JqZWN0fSBwMiB7eCwgeX1cbiAqIEBwYXJhbSB7QXJyYXl9IFtwcm9wc10gY29udGFpbmluZyB4IGFuZCB5IGtleXNcbiAqIEByZXR1cm4ge051bWJlcn0gZGlzdGFuY2VcbiAqL1xuZnVuY3Rpb24gZ2V0RGlzdGFuY2UocDEsIHAyLCBwcm9wcykge1xuICAgIGlmICghcHJvcHMpIHtcbiAgICAgICAgcHJvcHMgPSBQUk9QU19YWTtcbiAgICB9XG4gICAgdmFyIHggPSBwMltwcm9wc1swXV0gLSBwMVtwcm9wc1swXV0sXG4gICAgICAgIHkgPSBwMltwcm9wc1sxXV0gLSBwMVtwcm9wc1sxXV07XG5cbiAgICByZXR1cm4gTWF0aC5zcXJ0KCh4ICogeCkgKyAoeSAqIHkpKTtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgdGhlIGFuZ2xlIGJldHdlZW4gdHdvIGNvb3JkaW5hdGVzXG4gKiBAcGFyYW0ge09iamVjdH0gcDFcbiAqIEBwYXJhbSB7T2JqZWN0fSBwMlxuICogQHBhcmFtIHtBcnJheX0gW3Byb3BzXSBjb250YWluaW5nIHggYW5kIHkga2V5c1xuICogQHJldHVybiB7TnVtYmVyfSBhbmdsZVxuICovXG5mdW5jdGlvbiBnZXRBbmdsZShwMSwgcDIsIHByb3BzKSB7XG4gICAgaWYgKCFwcm9wcykge1xuICAgICAgICBwcm9wcyA9IFBST1BTX1hZO1xuICAgIH1cbiAgICB2YXIgeCA9IHAyW3Byb3BzWzBdXSAtIHAxW3Byb3BzWzBdXSxcbiAgICAgICAgeSA9IHAyW3Byb3BzWzFdXSAtIHAxW3Byb3BzWzFdXTtcbiAgICByZXR1cm4gTWF0aC5hdGFuMih5LCB4KSAqIDE4MCAvIE1hdGguUEk7XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSByb3RhdGlvbiBkZWdyZWVzIGJldHdlZW4gdHdvIHBvaW50ZXJzZXRzXG4gKiBAcGFyYW0ge0FycmF5fSBzdGFydCBhcnJheSBvZiBwb2ludGVyc1xuICogQHBhcmFtIHtBcnJheX0gZW5kIGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHJvdGF0aW9uXG4gKi9cbmZ1bmN0aW9uIGdldFJvdGF0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICByZXR1cm4gZ2V0QW5nbGUoZW5kWzFdLCBlbmRbMF0sIFBST1BTX0NMSUVOVF9YWSkgKyBnZXRBbmdsZShzdGFydFsxXSwgc3RhcnRbMF0sIFBST1BTX0NMSUVOVF9YWSk7XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSBzY2FsZSBmYWN0b3IgYmV0d2VlbiB0d28gcG9pbnRlcnNldHNcbiAqIG5vIHNjYWxlIGlzIDEsIGFuZCBnb2VzIGRvd24gdG8gMCB3aGVuIHBpbmNoZWQgdG9nZXRoZXIsIGFuZCBiaWdnZXIgd2hlbiBwaW5jaGVkIG91dFxuICogQHBhcmFtIHtBcnJheX0gc3RhcnQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IGVuZCBhcnJheSBvZiBwb2ludGVyc1xuICogQHJldHVybiB7TnVtYmVyfSBzY2FsZVxuICovXG5mdW5jdGlvbiBnZXRTY2FsZShzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuIGdldERpc3RhbmNlKGVuZFswXSwgZW5kWzFdLCBQUk9QU19DTElFTlRfWFkpIC8gZ2V0RGlzdGFuY2Uoc3RhcnRbMF0sIHN0YXJ0WzFdLCBQUk9QU19DTElFTlRfWFkpO1xufVxuXG52YXIgTU9VU0VfSU5QVVRfTUFQID0ge1xuICAgIG1vdXNlZG93bjogSU5QVVRfU1RBUlQsXG4gICAgbW91c2Vtb3ZlOiBJTlBVVF9NT1ZFLFxuICAgIG1vdXNldXA6IElOUFVUX0VORFxufTtcblxudmFyIE1PVVNFX0VMRU1FTlRfRVZFTlRTID0gJ21vdXNlZG93bic7XG52YXIgTU9VU0VfV0lORE9XX0VWRU5UUyA9ICdtb3VzZW1vdmUgbW91c2V1cCc7XG5cbi8qKlxuICogTW91c2UgZXZlbnRzIGlucHV0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIE1vdXNlSW5wdXQoKSB7XG4gICAgdGhpcy5ldkVsID0gTU9VU0VfRUxFTUVOVF9FVkVOVFM7XG4gICAgdGhpcy5ldldpbiA9IE1PVVNFX1dJTkRPV19FVkVOVFM7XG5cbiAgICB0aGlzLmFsbG93ID0gdHJ1ZTsgLy8gdXNlZCBieSBJbnB1dC5Ub3VjaE1vdXNlIHRvIGRpc2FibGUgbW91c2UgZXZlbnRzXG4gICAgdGhpcy5wcmVzc2VkID0gZmFsc2U7IC8vIG1vdXNlZG93biBzdGF0ZVxuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChNb3VzZUlucHV0LCBJbnB1dCwge1xuICAgIC8qKlxuICAgICAqIGhhbmRsZSBtb3VzZSBldmVudHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBNRWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IE1PVVNFX0lOUFVUX01BUFtldi50eXBlXTtcblxuICAgICAgICAvLyBvbiBzdGFydCB3ZSB3YW50IHRvIGhhdmUgdGhlIGxlZnQgbW91c2UgYnV0dG9uIGRvd25cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUICYmIGV2LmJ1dHRvbiA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9NT1ZFICYmIGV2LndoaWNoICE9PSAxKSB7XG4gICAgICAgICAgICBldmVudFR5cGUgPSBJTlBVVF9FTkQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtb3VzZSBtdXN0IGJlIGRvd24sIGFuZCBtb3VzZSBldmVudHMgYXJlIGFsbG93ZWQgKHNlZSB0aGUgVG91Y2hNb3VzZSBpbnB1dClcbiAgICAgICAgaWYgKCF0aGlzLnByZXNzZWQgfHwgIXRoaXMuYWxsb3cpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIGV2ZW50VHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9NT1VTRSxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxudmFyIFBPSU5URVJfSU5QVVRfTUFQID0ge1xuICAgIHBvaW50ZXJkb3duOiBJTlBVVF9TVEFSVCxcbiAgICBwb2ludGVybW92ZTogSU5QVVRfTU9WRSxcbiAgICBwb2ludGVydXA6IElOUFVUX0VORCxcbiAgICBwb2ludGVyY2FuY2VsOiBJTlBVVF9DQU5DRUwsXG4gICAgcG9pbnRlcm91dDogSU5QVVRfQ0FOQ0VMXG59O1xuXG4vLyBpbiBJRTEwIHRoZSBwb2ludGVyIHR5cGVzIGlzIGRlZmluZWQgYXMgYW4gZW51bVxudmFyIElFMTBfUE9JTlRFUl9UWVBFX0VOVU0gPSB7XG4gICAgMjogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAzOiBJTlBVVF9UWVBFX1BFTixcbiAgICA0OiBJTlBVVF9UWVBFX01PVVNFLFxuICAgIDU6IElOUFVUX1RZUEVfS0lORUNUIC8vIHNlZSBodHRwczovL3R3aXR0ZXIuY29tL2phY29icm9zc2kvc3RhdHVzLzQ4MDU5NjQzODQ4OTg5MDgxNlxufTtcblxudmFyIFBPSU5URVJfRUxFTUVOVF9FVkVOVFMgPSAncG9pbnRlcmRvd24nO1xudmFyIFBPSU5URVJfV0lORE9XX0VWRU5UUyA9ICdwb2ludGVybW92ZSBwb2ludGVydXAgcG9pbnRlcmNhbmNlbCc7XG5cbi8vIElFMTAgaGFzIHByZWZpeGVkIHN1cHBvcnQsIGFuZCBjYXNlLXNlbnNpdGl2ZVxuaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudCAmJiAhd2luZG93LlBvaW50ZXJFdmVudCkge1xuICAgIFBPSU5URVJfRUxFTUVOVF9FVkVOVFMgPSAnTVNQb2ludGVyRG93bic7XG4gICAgUE9JTlRFUl9XSU5ET1dfRVZFTlRTID0gJ01TUG9pbnRlck1vdmUgTVNQb2ludGVyVXAgTVNQb2ludGVyQ2FuY2VsJztcbn1cblxuLyoqXG4gKiBQb2ludGVyIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBQb2ludGVyRXZlbnRJbnB1dCgpIHtcbiAgICB0aGlzLmV2RWwgPSBQT0lOVEVSX0VMRU1FTlRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBQT0lOVEVSX1dJTkRPV19FVkVOVFM7XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5zdG9yZSA9ICh0aGlzLm1hbmFnZXIuc2Vzc2lvbi5wb2ludGVyRXZlbnRzID0gW10pO1xufVxuXG5pbmhlcml0KFBvaW50ZXJFdmVudElucHV0LCBJbnB1dCwge1xuICAgIC8qKlxuICAgICAqIGhhbmRsZSBtb3VzZSBldmVudHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBQRWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHN0b3JlID0gdGhpcy5zdG9yZTtcbiAgICAgICAgdmFyIHJlbW92ZVBvaW50ZXIgPSBmYWxzZTtcblxuICAgICAgICB2YXIgZXZlbnRUeXBlTm9ybWFsaXplZCA9IGV2LnR5cGUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCdtcycsICcnKTtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IFBPSU5URVJfSU5QVVRfTUFQW2V2ZW50VHlwZU5vcm1hbGl6ZWRdO1xuICAgICAgICB2YXIgcG9pbnRlclR5cGUgPSBJRTEwX1BPSU5URVJfVFlQRV9FTlVNW2V2LnBvaW50ZXJUeXBlXSB8fCBldi5wb2ludGVyVHlwZTtcblxuICAgICAgICB2YXIgaXNUb3VjaCA9IChwb2ludGVyVHlwZSA9PSBJTlBVVF9UWVBFX1RPVUNIKTtcblxuICAgICAgICAvLyBnZXQgaW5kZXggb2YgdGhlIGV2ZW50IGluIHRoZSBzdG9yZVxuICAgICAgICB2YXIgc3RvcmVJbmRleCA9IGluQXJyYXkoc3RvcmUsIGV2LnBvaW50ZXJJZCwgJ3BvaW50ZXJJZCcpO1xuXG4gICAgICAgIC8vIHN0YXJ0IGFuZCBtb3VzZSBtdXN0IGJlIGRvd25cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUICYmIChldi5idXR0b24gPT09IDAgfHwgaXNUb3VjaCkpIHtcbiAgICAgICAgICAgIGlmIChzdG9yZUluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgIHN0b3JlLnB1c2goZXYpO1xuICAgICAgICAgICAgICAgIHN0b3JlSW5kZXggPSBzdG9yZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgICAgICByZW1vdmVQb2ludGVyID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGl0IG5vdCBmb3VuZCwgc28gdGhlIHBvaW50ZXIgaGFzbid0IGJlZW4gZG93biAoc28gaXQncyBwcm9iYWJseSBhIGhvdmVyKVxuICAgICAgICBpZiAoc3RvcmVJbmRleCA8IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgZXZlbnQgaW4gdGhlIHN0b3JlXG4gICAgICAgIHN0b3JlW3N0b3JlSW5kZXhdID0gZXY7XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIGV2ZW50VHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHN0b3JlLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiBbZXZdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IHBvaW50ZXJUeXBlLFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZW1vdmVQb2ludGVyKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgZnJvbSB0aGUgc3RvcmVcbiAgICAgICAgICAgIHN0b3JlLnNwbGljZShzdG9yZUluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG52YXIgU0lOR0xFX1RPVUNIX0lOUFVUX01BUCA9IHtcbiAgICB0b3VjaHN0YXJ0OiBJTlBVVF9TVEFSVCxcbiAgICB0b3VjaG1vdmU6IElOUFVUX01PVkUsXG4gICAgdG91Y2hlbmQ6IElOUFVUX0VORCxcbiAgICB0b3VjaGNhbmNlbDogSU5QVVRfQ0FOQ0VMXG59O1xuXG52YXIgU0lOR0xFX1RPVUNIX1RBUkdFVF9FVkVOVFMgPSAndG91Y2hzdGFydCc7XG52YXIgU0lOR0xFX1RPVUNIX1dJTkRPV19FVkVOVFMgPSAndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnO1xuXG4vKipcbiAqIFRvdWNoIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBTaW5nbGVUb3VjaElucHV0KCkge1xuICAgIHRoaXMuZXZUYXJnZXQgPSBTSU5HTEVfVE9VQ0hfVEFSR0VUX0VWRU5UUztcbiAgICB0aGlzLmV2V2luID0gU0lOR0xFX1RPVUNIX1dJTkRPV19FVkVOVFM7XG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFNpbmdsZVRvdWNoSW5wdXQsIElucHV0LCB7XG4gICAgaGFuZGxlcjogZnVuY3Rpb24gVEVoYW5kbGVyKGV2KSB7XG4gICAgICAgIHZhciB0eXBlID0gU0lOR0xFX1RPVUNIX0lOUFVUX01BUFtldi50eXBlXTtcblxuICAgICAgICAvLyBzaG91bGQgd2UgaGFuZGxlIHRoZSB0b3VjaCBldmVudHM/XG4gICAgICAgIGlmICh0eXBlID09PSBJTlBVVF9TVEFSVCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG91Y2hlcyA9IG5vcm1hbGl6ZVNpbmdsZVRvdWNoZXMuY2FsbCh0aGlzLCBldiwgdHlwZSk7XG5cbiAgICAgICAgLy8gd2hlbiBkb25lLCByZXNldCB0aGUgc3RhcnRlZCBzdGF0ZVxuICAgICAgICBpZiAodHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpICYmIHRvdWNoZXNbMF0ubGVuZ3RoIC0gdG91Y2hlc1sxXS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIHR5cGUsIHtcbiAgICAgICAgICAgIHBvaW50ZXJzOiB0b3VjaGVzWzBdLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiB0b3VjaGVzWzFdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IElOUFVUX1RZUEVfVE9VQ0gsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogQHRoaXMge1RvdWNoSW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqIEBwYXJhbSB7TnVtYmVyfSB0eXBlIGZsYWdcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8QXJyYXl9IFthbGwsIGNoYW5nZWRdXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNpbmdsZVRvdWNoZXMoZXYsIHR5cGUpIHtcbiAgICB2YXIgYWxsID0gdG9BcnJheShldi50b3VjaGVzKTtcbiAgICB2YXIgY2hhbmdlZCA9IHRvQXJyYXkoZXYuY2hhbmdlZFRvdWNoZXMpO1xuXG4gICAgaWYgKHR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICBhbGwgPSB1bmlxdWVBcnJheShhbGwuY29uY2F0KGNoYW5nZWQpLCAnaWRlbnRpZmllcicsIHRydWUpO1xuICAgIH1cblxuICAgIHJldHVybiBbYWxsLCBjaGFuZ2VkXTtcbn1cblxudmFyIFRPVUNIX0lOUFVUX01BUCA9IHtcbiAgICB0b3VjaHN0YXJ0OiBJTlBVVF9TVEFSVCxcbiAgICB0b3VjaG1vdmU6IElOUFVUX01PVkUsXG4gICAgdG91Y2hlbmQ6IElOUFVUX0VORCxcbiAgICB0b3VjaGNhbmNlbDogSU5QVVRfQ0FOQ0VMXG59O1xuXG52YXIgVE9VQ0hfVEFSR0VUX0VWRU5UUyA9ICd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCc7XG5cbi8qKlxuICogTXVsdGktdXNlciB0b3VjaCBldmVudHMgaW5wdXRcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gVG91Y2hJbnB1dCgpIHtcbiAgICB0aGlzLmV2VGFyZ2V0ID0gVE9VQ0hfVEFSR0VUX0VWRU5UUztcbiAgICB0aGlzLnRhcmdldElkcyA9IHt9O1xuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChUb3VjaElucHV0LCBJbnB1dCwge1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIE1URWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBUT1VDSF9JTlBVVF9NQVBbZXYudHlwZV07XG4gICAgICAgIHZhciB0b3VjaGVzID0gZ2V0VG91Y2hlcy5jYWxsKHRoaXMsIGV2LCB0eXBlKTtcbiAgICAgICAgaWYgKCF0b3VjaGVzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgdHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHRvdWNoZXNbMF0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IHRvdWNoZXNbMV0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBAdGhpcyB7VG91Y2hJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICogQHBhcmFtIHtOdW1iZXJ9IHR5cGUgZmxhZ1xuICogQHJldHVybnMge3VuZGVmaW5lZHxBcnJheX0gW2FsbCwgY2hhbmdlZF1cbiAqL1xuZnVuY3Rpb24gZ2V0VG91Y2hlcyhldiwgdHlwZSkge1xuICAgIHZhciBhbGxUb3VjaGVzID0gdG9BcnJheShldi50b3VjaGVzKTtcbiAgICB2YXIgdGFyZ2V0SWRzID0gdGhpcy50YXJnZXRJZHM7XG5cbiAgICAvLyB3aGVuIHRoZXJlIGlzIG9ubHkgb25lIHRvdWNoLCB0aGUgcHJvY2VzcyBjYW4gYmUgc2ltcGxpZmllZFxuICAgIGlmICh0eXBlICYgKElOUFVUX1NUQVJUIHwgSU5QVVRfTU9WRSkgJiYgYWxsVG91Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdGFyZ2V0SWRzW2FsbFRvdWNoZXNbMF0uaWRlbnRpZmllcl0gPSB0cnVlO1xuICAgICAgICByZXR1cm4gW2FsbFRvdWNoZXMsIGFsbFRvdWNoZXNdO1xuICAgIH1cblxuICAgIHZhciBpLFxuICAgICAgICB0YXJnZXRUb3VjaGVzLFxuICAgICAgICBjaGFuZ2VkVG91Y2hlcyA9IHRvQXJyYXkoZXYuY2hhbmdlZFRvdWNoZXMpLFxuICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlcyA9IFtdLFxuICAgICAgICB0YXJnZXQgPSB0aGlzLnRhcmdldDtcblxuICAgIC8vIGdldCB0YXJnZXQgdG91Y2hlcyBmcm9tIHRvdWNoZXNcbiAgICB0YXJnZXRUb3VjaGVzID0gYWxsVG91Y2hlcy5maWx0ZXIoZnVuY3Rpb24odG91Y2gpIHtcbiAgICAgICAgcmV0dXJuIGhhc1BhcmVudCh0b3VjaC50YXJnZXQsIHRhcmdldCk7XG4gICAgfSk7XG5cbiAgICAvLyBjb2xsZWN0IHRvdWNoZXNcbiAgICBpZiAodHlwZSA9PT0gSU5QVVRfU1RBUlQpIHtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGFyZ2V0VG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRhcmdldElkc1t0YXJnZXRUb3VjaGVzW2ldLmlkZW50aWZpZXJdID0gdHJ1ZTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGZpbHRlciBjaGFuZ2VkIHRvdWNoZXMgdG8gb25seSBjb250YWluIHRvdWNoZXMgdGhhdCBleGlzdCBpbiB0aGUgY29sbGVjdGVkIHRhcmdldCBpZHNcbiAgICBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICBpZiAodGFyZ2V0SWRzW2NoYW5nZWRUb3VjaGVzW2ldLmlkZW50aWZpZXJdKSB7XG4gICAgICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlcy5wdXNoKGNoYW5nZWRUb3VjaGVzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFudXAgcmVtb3ZlZCB0b3VjaGVzXG4gICAgICAgIGlmICh0eXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0YXJnZXRJZHNbY2hhbmdlZFRvdWNoZXNbaV0uaWRlbnRpZmllcl07XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIGlmICghY2hhbmdlZFRhcmdldFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAgICAvLyBtZXJnZSB0YXJnZXRUb3VjaGVzIHdpdGggY2hhbmdlZFRhcmdldFRvdWNoZXMgc28gaXQgY29udGFpbnMgQUxMIHRvdWNoZXMsIGluY2x1ZGluZyAnZW5kJyBhbmQgJ2NhbmNlbCdcbiAgICAgICAgdW5pcXVlQXJyYXkodGFyZ2V0VG91Y2hlcy5jb25jYXQoY2hhbmdlZFRhcmdldFRvdWNoZXMpLCAnaWRlbnRpZmllcicsIHRydWUpLFxuICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlc1xuICAgIF07XG59XG5cbi8qKlxuICogQ29tYmluZWQgdG91Y2ggYW5kIG1vdXNlIGlucHV0XG4gKlxuICogVG91Y2ggaGFzIGEgaGlnaGVyIHByaW9yaXR5IHRoZW4gbW91c2UsIGFuZCB3aGlsZSB0b3VjaGluZyBubyBtb3VzZSBldmVudHMgYXJlIGFsbG93ZWQuXG4gKiBUaGlzIGJlY2F1c2UgdG91Y2ggZGV2aWNlcyBhbHNvIGVtaXQgbW91c2UgZXZlbnRzIHdoaWxlIGRvaW5nIGEgdG91Y2guXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBUb3VjaE1vdXNlSW5wdXQoKSB7XG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHZhciBoYW5kbGVyID0gYmluZEZuKHRoaXMuaGFuZGxlciwgdGhpcyk7XG4gICAgdGhpcy50b3VjaCA9IG5ldyBUb3VjaElucHV0KHRoaXMubWFuYWdlciwgaGFuZGxlcik7XG4gICAgdGhpcy5tb3VzZSA9IG5ldyBNb3VzZUlucHV0KHRoaXMubWFuYWdlciwgaGFuZGxlcik7XG59XG5cbmluaGVyaXQoVG91Y2hNb3VzZUlucHV0LCBJbnB1dCwge1xuICAgIC8qKlxuICAgICAqIGhhbmRsZSBtb3VzZSBhbmQgdG91Y2ggZXZlbnRzXG4gICAgICogQHBhcmFtIHtIYW1tZXJ9IG1hbmFnZXJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXRFdmVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBUTUVoYW5kbGVyKG1hbmFnZXIsIGlucHV0RXZlbnQsIGlucHV0RGF0YSkge1xuICAgICAgICB2YXIgaXNUb3VjaCA9IChpbnB1dERhdGEucG9pbnRlclR5cGUgPT0gSU5QVVRfVFlQRV9UT1VDSCksXG4gICAgICAgICAgICBpc01vdXNlID0gKGlucHV0RGF0YS5wb2ludGVyVHlwZSA9PSBJTlBVVF9UWVBFX01PVVNFKTtcblxuICAgICAgICAvLyB3aGVuIHdlJ3JlIGluIGEgdG91Y2ggZXZlbnQsIHNvICBibG9jayBhbGwgdXBjb21pbmcgbW91c2UgZXZlbnRzXG4gICAgICAgIC8vIG1vc3QgbW9iaWxlIGJyb3dzZXIgYWxzbyBlbWl0IG1vdXNlZXZlbnRzLCByaWdodCBhZnRlciB0b3VjaHN0YXJ0XG4gICAgICAgIGlmIChpc1RvdWNoKSB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlLmFsbG93ID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNNb3VzZSAmJiAhdGhpcy5tb3VzZS5hbGxvdykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVzZXQgdGhlIGFsbG93TW91c2Ugd2hlbiB3ZSdyZSBkb25lXG4gICAgICAgIGlmIChpbnB1dEV2ZW50ICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgICAgIHRoaXMubW91c2UuYWxsb3cgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayhtYW5hZ2VyLCBpbnB1dEV2ZW50LCBpbnB1dERhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZW1vdmUgdGhlIGV2ZW50IGxpc3RlbmVyc1xuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMudG91Y2guZGVzdHJveSgpO1xuICAgICAgICB0aGlzLm1vdXNlLmRlc3Ryb3koKTtcbiAgICB9XG59KTtcblxudmFyIFBSRUZJWEVEX1RPVUNIX0FDVElPTiA9IHByZWZpeGVkKFRFU1RfRUxFTUVOVC5zdHlsZSwgJ3RvdWNoQWN0aW9uJyk7XG52YXIgTkFUSVZFX1RPVUNIX0FDVElPTiA9IFBSRUZJWEVEX1RPVUNIX0FDVElPTiAhPT0gdW5kZWZpbmVkO1xuXG4vLyBtYWdpY2FsIHRvdWNoQWN0aW9uIHZhbHVlXG52YXIgVE9VQ0hfQUNUSU9OX0NPTVBVVEUgPSAnY29tcHV0ZSc7XG52YXIgVE9VQ0hfQUNUSU9OX0FVVE8gPSAnYXV0byc7XG52YXIgVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTiA9ICdtYW5pcHVsYXRpb24nOyAvLyBub3QgaW1wbGVtZW50ZWRcbnZhciBUT1VDSF9BQ1RJT05fTk9ORSA9ICdub25lJztcbnZhciBUT1VDSF9BQ1RJT05fUEFOX1ggPSAncGFuLXgnO1xudmFyIFRPVUNIX0FDVElPTl9QQU5fWSA9ICdwYW4teSc7XG5cbi8qKlxuICogVG91Y2ggQWN0aW9uXG4gKiBzZXRzIHRoZSB0b3VjaEFjdGlvbiBwcm9wZXJ0eSBvciB1c2VzIHRoZSBqcyBhbHRlcm5hdGl2ZVxuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUb3VjaEFjdGlvbihtYW5hZ2VyLCB2YWx1ZSkge1xuICAgIHRoaXMubWFuYWdlciA9IG1hbmFnZXI7XG4gICAgdGhpcy5zZXQodmFsdWUpO1xufVxuXG5Ub3VjaEFjdGlvbi5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogc2V0IHRoZSB0b3VjaEFjdGlvbiB2YWx1ZSBvbiB0aGUgZWxlbWVudCBvciBlbmFibGUgdGhlIHBvbHlmaWxsXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAvLyBmaW5kIG91dCB0aGUgdG91Y2gtYWN0aW9uIGJ5IHRoZSBldmVudCBoYW5kbGVyc1xuICAgICAgICBpZiAodmFsdWUgPT0gVE9VQ0hfQUNUSU9OX0NPTVBVVEUpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdGhpcy5jb21wdXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoTkFUSVZFX1RPVUNIX0FDVElPTiAmJiB0aGlzLm1hbmFnZXIuZWxlbWVudC5zdHlsZSkge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVsZW1lbnQuc3R5bGVbUFJFRklYRURfVE9VQ0hfQUNUSU9OXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWN0aW9ucyA9IHZhbHVlLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBqdXN0IHJlLXNldCB0aGUgdG91Y2hBY3Rpb24gdmFsdWVcbiAgICAgKi9cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldCh0aGlzLm1hbmFnZXIub3B0aW9ucy50b3VjaEFjdGlvbik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNvbXB1dGUgdGhlIHZhbHVlIGZvciB0aGUgdG91Y2hBY3Rpb24gcHJvcGVydHkgYmFzZWQgb24gdGhlIHJlY29nbml6ZXIncyBzZXR0aW5nc1xuICAgICAqIEByZXR1cm5zIHtTdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgY29tcHV0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhY3Rpb25zID0gW107XG4gICAgICAgIGVhY2godGhpcy5tYW5hZ2VyLnJlY29nbml6ZXJzLCBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgICAgICBpZiAoYm9vbE9yRm4ocmVjb2duaXplci5vcHRpb25zLmVuYWJsZSwgW3JlY29nbml6ZXJdKSkge1xuICAgICAgICAgICAgICAgIGFjdGlvbnMgPSBhY3Rpb25zLmNvbmNhdChyZWNvZ25pemVyLmdldFRvdWNoQWN0aW9uKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGNsZWFuVG91Y2hBY3Rpb25zKGFjdGlvbnMuam9pbignICcpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdGhpcyBtZXRob2QgaXMgY2FsbGVkIG9uIGVhY2ggaW5wdXQgY3ljbGUgYW5kIHByb3ZpZGVzIHRoZSBwcmV2ZW50aW5nIG9mIHRoZSBicm93c2VyIGJlaGF2aW9yXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gICAgICovXG4gICAgcHJldmVudERlZmF1bHRzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICAvLyBub3QgbmVlZGVkIHdpdGggbmF0aXZlIHN1cHBvcnQgZm9yIHRoZSB0b3VjaEFjdGlvbiBwcm9wZXJ0eVxuICAgICAgICBpZiAoTkFUSVZFX1RPVUNIX0FDVElPTikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNyY0V2ZW50ID0gaW5wdXQuc3JjRXZlbnQ7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBpbnB1dC5vZmZzZXREaXJlY3Rpb247XG5cbiAgICAgICAgLy8gaWYgdGhlIHRvdWNoIGFjdGlvbiBkaWQgcHJldmVudGVkIG9uY2UgdGhpcyBzZXNzaW9uXG4gICAgICAgIGlmICh0aGlzLm1hbmFnZXIuc2Vzc2lvbi5wcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgIHNyY0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucztcbiAgICAgICAgdmFyIGhhc05vbmUgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fTk9ORSk7XG4gICAgICAgIHZhciBoYXNQYW5ZID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9ZKTtcbiAgICAgICAgdmFyIGhhc1BhblggPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1gpO1xuXG4gICAgICAgIGlmIChoYXNOb25lKSB7XG4gICAgICAgICAgICAvL2RvIG5vdCBwcmV2ZW50IGRlZmF1bHRzIGlmIHRoaXMgaXMgYSB0YXAgZ2VzdHVyZVxuXG4gICAgICAgICAgICB2YXIgaXNUYXBQb2ludGVyID0gaW5wdXQucG9pbnRlcnMubGVuZ3RoID09PSAxO1xuICAgICAgICAgICAgdmFyIGlzVGFwTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IDI7XG4gICAgICAgICAgICB2YXIgaXNUYXBUb3VjaFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPCAyNTA7XG5cbiAgICAgICAgICAgIGlmIChpc1RhcFBvaW50ZXIgJiYgaXNUYXBNb3ZlbWVudCAmJiBpc1RhcFRvdWNoVGltZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNQYW5YICYmIGhhc1BhblkpIHtcbiAgICAgICAgICAgIC8vIGBwYW4teCBwYW4teWAgbWVhbnMgYnJvd3NlciBoYW5kbGVzIGFsbCBzY3JvbGxpbmcvcGFubmluZywgZG8gbm90IHByZXZlbnRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNOb25lIHx8XG4gICAgICAgICAgICAoaGFzUGFuWSAmJiBkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkgfHxcbiAgICAgICAgICAgIChoYXNQYW5YICYmIGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZlbnRTcmMoc3JjRXZlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbGwgcHJldmVudERlZmF1bHQgdG8gcHJldmVudCB0aGUgYnJvd3NlcidzIGRlZmF1bHQgYmVoYXZpb3IgKHNjcm9sbGluZyBpbiBtb3N0IGNhc2VzKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcmNFdmVudFxuICAgICAqL1xuICAgIHByZXZlbnRTcmM6IGZ1bmN0aW9uKHNyY0V2ZW50KSB7XG4gICAgICAgIHRoaXMubWFuYWdlci5zZXNzaW9uLnByZXZlbnRlZCA9IHRydWU7XG4gICAgICAgIHNyY0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiB3aGVuIHRoZSB0b3VjaEFjdGlvbnMgYXJlIGNvbGxlY3RlZCB0aGV5IGFyZSBub3QgYSB2YWxpZCB2YWx1ZSwgc28gd2UgbmVlZCB0byBjbGVhbiB0aGluZ3MgdXAuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb25zXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gY2xlYW5Ub3VjaEFjdGlvbnMoYWN0aW9ucykge1xuICAgIC8vIG5vbmVcbiAgICBpZiAoaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX05PTkUpKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTk9ORTtcbiAgICB9XG5cbiAgICB2YXIgaGFzUGFuWCA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWCk7XG4gICAgdmFyIGhhc1BhblkgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1kpO1xuXG4gICAgLy8gaWYgYm90aCBwYW4teCBhbmQgcGFuLXkgYXJlIHNldCAoZGlmZmVyZW50IHJlY29nbml6ZXJzXG4gICAgLy8gZm9yIGRpZmZlcmVudCBkaXJlY3Rpb25zLCBlLmcuIGhvcml6b250YWwgcGFuIGJ1dCB2ZXJ0aWNhbCBzd2lwZT8pXG4gICAgLy8gd2UgbmVlZCBub25lIChhcyBvdGhlcndpc2Ugd2l0aCBwYW4teCBwYW4teSBjb21iaW5lZCBub25lIG9mIHRoZXNlXG4gICAgLy8gcmVjb2duaXplcnMgd2lsbCB3b3JrLCBzaW5jZSB0aGUgYnJvd3NlciB3b3VsZCBoYW5kbGUgYWxsIHBhbm5pbmdcbiAgICBpZiAoaGFzUGFuWCAmJiBoYXNQYW5ZKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTk9ORTtcbiAgICB9XG5cbiAgICAvLyBwYW4teCBPUiBwYW4teVxuICAgIGlmIChoYXNQYW5YIHx8IGhhc1BhblkpIHtcbiAgICAgICAgcmV0dXJuIGhhc1BhblggPyBUT1VDSF9BQ1RJT05fUEFOX1ggOiBUT1VDSF9BQ1RJT05fUEFOX1k7XG4gICAgfVxuXG4gICAgLy8gbWFuaXB1bGF0aW9uXG4gICAgaWYgKGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9NQU5JUFVMQVRJT04pKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OO1xuICAgIH1cblxuICAgIHJldHVybiBUT1VDSF9BQ1RJT05fQVVUTztcbn1cblxuLyoqXG4gKiBSZWNvZ25pemVyIGZsb3cgZXhwbGFpbmVkOyAqXG4gKiBBbGwgcmVjb2duaXplcnMgaGF2ZSB0aGUgaW5pdGlhbCBzdGF0ZSBvZiBQT1NTSUJMRSB3aGVuIGEgaW5wdXQgc2Vzc2lvbiBzdGFydHMuXG4gKiBUaGUgZGVmaW5pdGlvbiBvZiBhIGlucHV0IHNlc3Npb24gaXMgZnJvbSB0aGUgZmlyc3QgaW5wdXQgdW50aWwgdGhlIGxhc3QgaW5wdXQsIHdpdGggYWxsIGl0J3MgbW92ZW1lbnQgaW4gaXQuICpcbiAqIEV4YW1wbGUgc2Vzc2lvbiBmb3IgbW91c2UtaW5wdXQ6IG1vdXNlZG93biAtPiBtb3VzZW1vdmUgLT4gbW91c2V1cFxuICpcbiAqIE9uIGVhY2ggcmVjb2duaXppbmcgY3ljbGUgKHNlZSBNYW5hZ2VyLnJlY29nbml6ZSkgdGhlIC5yZWNvZ25pemUoKSBtZXRob2QgaXMgZXhlY3V0ZWRcbiAqIHdoaWNoIGRldGVybWluZXMgd2l0aCBzdGF0ZSBpdCBzaG91bGQgYmUuXG4gKlxuICogSWYgdGhlIHJlY29nbml6ZXIgaGFzIHRoZSBzdGF0ZSBGQUlMRUQsIENBTkNFTExFRCBvciBSRUNPR05JWkVEIChlcXVhbHMgRU5ERUQpLCBpdCBpcyByZXNldCB0b1xuICogUE9TU0lCTEUgdG8gZ2l2ZSBpdCBhbm90aGVyIGNoYW5nZSBvbiB0aGUgbmV4dCBjeWNsZS5cbiAqXG4gKiAgICAgICAgICAgICAgIFBvc3NpYmxlXG4gKiAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgKy0tLS0tKy0tLS0tLS0tLS0tLS0tLStcbiAqICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgKy0tLS0tKy0tLS0tKyAgICAgICAgICAgICAgIHxcbiAqICAgICAgfCAgICAgICAgICAgfCAgICAgICAgICAgICAgIHxcbiAqICAgRmFpbGVkICAgICAgQ2FuY2VsbGVkICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICArLS0tLS0tLSstLS0tLS0rXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgfFxuICogICAgICAgICAgICAgICAgICAgICAgUmVjb2duaXplZCAgICAgICBCZWdhblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDaGFuZ2VkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRW5kZWQvUmVjb2duaXplZFxuICovXG52YXIgU1RBVEVfUE9TU0lCTEUgPSAxO1xudmFyIFNUQVRFX0JFR0FOID0gMjtcbnZhciBTVEFURV9DSEFOR0VEID0gNDtcbnZhciBTVEFURV9FTkRFRCA9IDg7XG52YXIgU1RBVEVfUkVDT0dOSVpFRCA9IFNUQVRFX0VOREVEO1xudmFyIFNUQVRFX0NBTkNFTExFRCA9IDE2O1xudmFyIFNUQVRFX0ZBSUxFRCA9IDMyO1xuXG4vKipcbiAqIFJlY29nbml6ZXJcbiAqIEV2ZXJ5IHJlY29nbml6ZXIgbmVlZHMgdG8gZXh0ZW5kIGZyb20gdGhpcyBjbGFzcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gUmVjb2duaXplcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gYXNzaWduKHt9LCB0aGlzLmRlZmF1bHRzLCBvcHRpb25zIHx8IHt9KTtcblxuICAgIHRoaXMuaWQgPSB1bmlxdWVJZCgpO1xuXG4gICAgdGhpcy5tYW5hZ2VyID0gbnVsbDtcblxuICAgIC8vIGRlZmF1bHQgaXMgZW5hYmxlIHRydWVcbiAgICB0aGlzLm9wdGlvbnMuZW5hYmxlID0gaWZVbmRlZmluZWQodGhpcy5vcHRpb25zLmVuYWJsZSwgdHJ1ZSk7XG5cbiAgICB0aGlzLnN0YXRlID0gU1RBVEVfUE9TU0lCTEU7XG5cbiAgICB0aGlzLnNpbXVsdGFuZW91cyA9IHt9O1xuICAgIHRoaXMucmVxdWlyZUZhaWwgPSBbXTtcbn1cblxuUmVjb2duaXplci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogQHZpcnR1YWxcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7fSxcblxuICAgIC8qKlxuICAgICAqIHNldCBvcHRpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtSZWNvZ25pemVyfVxuICAgICAqL1xuICAgIHNldDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBhc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAvLyBhbHNvIHVwZGF0ZSB0aGUgdG91Y2hBY3Rpb24sIGluIGNhc2Ugc29tZXRoaW5nIGNoYW5nZWQgYWJvdXQgdGhlIGRpcmVjdGlvbnMvZW5hYmxlZCBzdGF0ZVxuICAgICAgICB0aGlzLm1hbmFnZXIgJiYgdGhpcy5tYW5hZ2VyLnRvdWNoQWN0aW9uLnVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmVjb2duaXplIHNpbXVsdGFuZW91cyB3aXRoIGFuIG90aGVyIHJlY29nbml6ZXIuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIHJlY29nbml6ZVdpdGg6IGZ1bmN0aW9uKG90aGVyUmVjb2duaXplcikge1xuICAgICAgICBpZiAoaW52b2tlQXJyYXlBcmcob3RoZXJSZWNvZ25pemVyLCAncmVjb2duaXplV2l0aCcsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzaW11bHRhbmVvdXMgPSB0aGlzLnNpbXVsdGFuZW91cztcbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICBpZiAoIXNpbXVsdGFuZW91c1tvdGhlclJlY29nbml6ZXIuaWRdKSB7XG4gICAgICAgICAgICBzaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXSA9IG90aGVyUmVjb2duaXplcjtcbiAgICAgICAgICAgIG90aGVyUmVjb2duaXplci5yZWNvZ25pemVXaXRoKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBkcm9wIHRoZSBzaW11bHRhbmVvdXMgbGluay4gaXQgZG9lc250IHJlbW92ZSB0aGUgbGluayBvbiB0aGUgb3RoZXIgcmVjb2duaXplci5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgZHJvcFJlY29nbml6ZVdpdGg6IGZ1bmN0aW9uKG90aGVyUmVjb2duaXplcikge1xuICAgICAgICBpZiAoaW52b2tlQXJyYXlBcmcob3RoZXJSZWNvZ25pemVyLCAnZHJvcFJlY29nbml6ZVdpdGgnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBvdGhlclJlY29nbml6ZXIgPSBnZXRSZWNvZ25pemVyQnlOYW1lSWZNYW5hZ2VyKG90aGVyUmVjb2duaXplciwgdGhpcyk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNpbXVsdGFuZW91c1tvdGhlclJlY29nbml6ZXIuaWRdO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmVjb2duaXplciBjYW4gb25seSBydW4gd2hlbiBhbiBvdGhlciBpcyBmYWlsaW5nXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIHJlcXVpcmVGYWlsdXJlOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ3JlcXVpcmVGYWlsdXJlJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlcXVpcmVGYWlsID0gdGhpcy5yZXF1aXJlRmFpbDtcbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICBpZiAoaW5BcnJheShyZXF1aXJlRmFpbCwgb3RoZXJSZWNvZ25pemVyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJlcXVpcmVGYWlsLnB1c2gob3RoZXJSZWNvZ25pemVyKTtcbiAgICAgICAgICAgIG90aGVyUmVjb2duaXplci5yZXF1aXJlRmFpbHVyZSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZHJvcCB0aGUgcmVxdWlyZUZhaWx1cmUgbGluay4gaXQgZG9lcyBub3QgcmVtb3ZlIHRoZSBsaW5rIG9uIHRoZSBvdGhlciByZWNvZ25pemVyLlxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBkcm9wUmVxdWlyZUZhaWx1cmU6IGZ1bmN0aW9uKG90aGVyUmVjb2duaXplcikge1xuICAgICAgICBpZiAoaW52b2tlQXJyYXlBcmcob3RoZXJSZWNvZ25pemVyLCAnZHJvcFJlcXVpcmVGYWlsdXJlJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICB2YXIgaW5kZXggPSBpbkFycmF5KHRoaXMucmVxdWlyZUZhaWwsIG90aGVyUmVjb2duaXplcik7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnJlcXVpcmVGYWlsLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGhhcyByZXF1aXJlIGZhaWx1cmVzIGJvb2xlYW5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBoYXNSZXF1aXJlRmFpbHVyZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1aXJlRmFpbC5sZW5ndGggPiAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBpZiB0aGUgcmVjb2duaXplciBjYW4gcmVjb2duaXplIHNpbXVsdGFuZW91cyB3aXRoIGFuIG90aGVyIHJlY29nbml6ZXJcbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgICAqL1xuICAgIGNhblJlY29nbml6ZVdpdGg6IGZ1bmN0aW9uKG90aGVyUmVjb2duaXplcikge1xuICAgICAgICByZXR1cm4gISF0aGlzLnNpbXVsdGFuZW91c1tvdGhlclJlY29nbml6ZXIuaWRdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBZb3Ugc2hvdWxkIHVzZSBgdHJ5RW1pdGAgaW5zdGVhZCBvZiBgZW1pdGAgZGlyZWN0bHkgdG8gY2hlY2tcbiAgICAgKiB0aGF0IGFsbCB0aGUgbmVlZGVkIHJlY29nbml6ZXJzIGhhcyBmYWlsZWQgYmVmb3JlIGVtaXR0aW5nLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqL1xuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5zdGF0ZTtcblxuICAgICAgICBmdW5jdGlvbiBlbWl0KGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLm1hbmFnZXIuZW1pdChldmVudCwgaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gJ3BhbnN0YXJ0JyBhbmQgJ3Bhbm1vdmUnXG4gICAgICAgIGlmIChzdGF0ZSA8IFNUQVRFX0VOREVEKSB7XG4gICAgICAgICAgICBlbWl0KHNlbGYub3B0aW9ucy5ldmVudCArIHN0YXRlU3RyKHN0YXRlKSk7XG4gICAgICAgIH1cblxuICAgICAgICBlbWl0KHNlbGYub3B0aW9ucy5ldmVudCk7IC8vIHNpbXBsZSAnZXZlbnROYW1lJyBldmVudHNcblxuICAgICAgICBpZiAoaW5wdXQuYWRkaXRpb25hbEV2ZW50KSB7IC8vIGFkZGl0aW9uYWwgZXZlbnQocGFubGVmdCwgcGFucmlnaHQsIHBpbmNoaW4sIHBpbmNob3V0Li4uKVxuICAgICAgICAgICAgZW1pdChpbnB1dC5hZGRpdGlvbmFsRXZlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcGFuZW5kIGFuZCBwYW5jYW5jZWxcbiAgICAgICAgaWYgKHN0YXRlID49IFNUQVRFX0VOREVEKSB7XG4gICAgICAgICAgICBlbWl0KHNlbGYub3B0aW9ucy5ldmVudCArIHN0YXRlU3RyKHN0YXRlKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgdGhhdCBhbGwgdGhlIHJlcXVpcmUgZmFpbHVyZSByZWNvZ25pemVycyBoYXMgZmFpbGVkLFxuICAgICAqIGlmIHRydWUsIGl0IGVtaXRzIGEgZ2VzdHVyZSBldmVudCxcbiAgICAgKiBvdGhlcndpc2UsIHNldHVwIHRoZSBzdGF0ZSB0byBGQUlMRUQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gICAgICovXG4gICAgdHJ5RW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FuRW1pdCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbWl0KGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpdCdzIGZhaWxpbmcgYW55d2F5XG4gICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbiB3ZSBlbWl0P1xuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGNhbkVtaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5yZXF1aXJlRmFpbC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICghKHRoaXMucmVxdWlyZUZhaWxbaV0uc3RhdGUgJiAoU1RBVEVfRkFJTEVEIHwgU1RBVEVfUE9TU0lCTEUpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdXBkYXRlIHRoZSByZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0RGF0YVxuICAgICAqL1xuICAgIHJlY29nbml6ZTogZnVuY3Rpb24oaW5wdXREYXRhKSB7XG4gICAgICAgIC8vIG1ha2UgYSBuZXcgY29weSBvZiB0aGUgaW5wdXREYXRhXG4gICAgICAgIC8vIHNvIHdlIGNhbiBjaGFuZ2UgdGhlIGlucHV0RGF0YSB3aXRob3V0IG1lc3NpbmcgdXAgdGhlIG90aGVyIHJlY29nbml6ZXJzXG4gICAgICAgIHZhciBpbnB1dERhdGFDbG9uZSA9IGFzc2lnbih7fSwgaW5wdXREYXRhKTtcblxuICAgICAgICAvLyBpcyBpcyBlbmFibGVkIGFuZCBhbGxvdyByZWNvZ25pemluZz9cbiAgICAgICAgaWYgKCFib29sT3JGbih0aGlzLm9wdGlvbnMuZW5hYmxlLCBbdGhpcywgaW5wdXREYXRhQ2xvbmVdKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX0ZBSUxFRDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlc2V0IHdoZW4gd2UndmUgcmVhY2hlZCB0aGUgZW5kXG4gICAgICAgIGlmICh0aGlzLnN0YXRlICYgKFNUQVRFX1JFQ09HTklaRUQgfCBTVEFURV9DQU5DRUxMRUQgfCBTVEFURV9GQUlMRUQpKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfUE9TU0lCTEU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXRlID0gdGhpcy5wcm9jZXNzKGlucHV0RGF0YUNsb25lKTtcblxuICAgICAgICAvLyB0aGUgcmVjb2duaXplciBoYXMgcmVjb2duaXplZCBhIGdlc3R1cmVcbiAgICAgICAgLy8gc28gdHJpZ2dlciBhbiBldmVudFxuICAgICAgICBpZiAodGhpcy5zdGF0ZSAmIChTVEFURV9CRUdBTiB8IFNUQVRFX0NIQU5HRUQgfCBTVEFURV9FTkRFRCB8IFNUQVRFX0NBTkNFTExFRCkpIHtcbiAgICAgICAgICAgIHRoaXMudHJ5RW1pdChpbnB1dERhdGFDbG9uZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmV0dXJuIHRoZSBzdGF0ZSBvZiB0aGUgcmVjb2duaXplclxuICAgICAqIHRoZSBhY3R1YWwgcmVjb2duaXppbmcgaGFwcGVucyBpbiB0aGlzIG1ldGhvZFxuICAgICAqIEB2aXJ0dWFsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0RGF0YVxuICAgICAqIEByZXR1cm5zIHtDb25zdH0gU1RBVEVcbiAgICAgKi9cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dERhdGEpIHsgfSwgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cbiAgICAvKipcbiAgICAgKiByZXR1cm4gdGhlIHByZWZlcnJlZCB0b3VjaC1hY3Rpb25cbiAgICAgKiBAdmlydHVhbFxuICAgICAqIEByZXR1cm5zIHtBcnJheX1cbiAgICAgKi9cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7IH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxsZWQgd2hlbiB0aGUgZ2VzdHVyZSBpc24ndCBhbGxvd2VkIHRvIHJlY29nbml6ZVxuICAgICAqIGxpa2Ugd2hlbiBhbm90aGVyIGlzIGJlaW5nIHJlY29nbml6ZWQgb3IgaXQgaXMgZGlzYWJsZWRcbiAgICAgKiBAdmlydHVhbFxuICAgICAqL1xuICAgIHJlc2V0OiBmdW5jdGlvbigpIHsgfVxufTtcblxuLyoqXG4gKiBnZXQgYSB1c2FibGUgc3RyaW5nLCB1c2VkIGFzIGV2ZW50IHBvc3RmaXhcbiAqIEBwYXJhbSB7Q29uc3R9IHN0YXRlXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdGF0ZVxuICovXG5mdW5jdGlvbiBzdGF0ZVN0cihzdGF0ZSkge1xuICAgIGlmIChzdGF0ZSAmIFNUQVRFX0NBTkNFTExFRCkge1xuICAgICAgICByZXR1cm4gJ2NhbmNlbCc7XG4gICAgfSBlbHNlIGlmIChzdGF0ZSAmIFNUQVRFX0VOREVEKSB7XG4gICAgICAgIHJldHVybiAnZW5kJztcbiAgICB9IGVsc2UgaWYgKHN0YXRlICYgU1RBVEVfQ0hBTkdFRCkge1xuICAgICAgICByZXR1cm4gJ21vdmUnO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUgJiBTVEFURV9CRUdBTikge1xuICAgICAgICByZXR1cm4gJ3N0YXJ0JztcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG4vKipcbiAqIGRpcmVjdGlvbiBjb25zIHRvIHN0cmluZ1xuICogQHBhcmFtIHtDb25zdH0gZGlyZWN0aW9uXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBkaXJlY3Rpb25TdHIoZGlyZWN0aW9uKSB7XG4gICAgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fRE9XTikge1xuICAgICAgICByZXR1cm4gJ2Rvd24nO1xuICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09IERJUkVDVElPTl9VUCkge1xuICAgICAgICByZXR1cm4gJ3VwJztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fTEVGVCkge1xuICAgICAgICByZXR1cm4gJ2xlZnQnO1xuICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09IERJUkVDVElPTl9SSUdIVCkge1xuICAgICAgICByZXR1cm4gJ3JpZ2h0JztcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG4vKipcbiAqIGdldCBhIHJlY29nbml6ZXIgYnkgbmFtZSBpZiBpdCBpcyBib3VuZCB0byBhIG1hbmFnZXJcbiAqIEBwYXJhbSB7UmVjb2duaXplcnxTdHJpbmd9IG90aGVyUmVjb2duaXplclxuICogQHBhcmFtIHtSZWNvZ25pemVyfSByZWNvZ25pemVyXG4gKiBAcmV0dXJucyB7UmVjb2duaXplcn1cbiAqL1xuZnVuY3Rpb24gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHJlY29nbml6ZXIpIHtcbiAgICB2YXIgbWFuYWdlciA9IHJlY29nbml6ZXIubWFuYWdlcjtcbiAgICBpZiAobWFuYWdlcikge1xuICAgICAgICByZXR1cm4gbWFuYWdlci5nZXQob3RoZXJSZWNvZ25pemVyKTtcbiAgICB9XG4gICAgcmV0dXJuIG90aGVyUmVjb2duaXplcjtcbn1cblxuLyoqXG4gKiBUaGlzIHJlY29nbml6ZXIgaXMganVzdCB1c2VkIGFzIGEgYmFzZSBmb3IgdGhlIHNpbXBsZSBhdHRyaWJ1dGUgcmVjb2duaXplcnMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIFJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gQXR0clJlY29nbml6ZXIoKSB7XG4gICAgUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KEF0dHJSZWNvZ25pemVyLCBSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKiBAZGVmYXVsdCAxXG4gICAgICAgICAqL1xuICAgICAgICBwb2ludGVyczogMVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIGNoZWNrIGlmIGl0IHRoZSByZWNvZ25pemVyIHJlY2VpdmVzIHZhbGlkIGlucHV0LCBsaWtlIGlucHV0LmRpc3RhbmNlID4gMTAuXG4gICAgICogQG1lbWJlcm9mIEF0dHJSZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IHJlY29nbml6ZWRcbiAgICAgKi9cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIG9wdGlvblBvaW50ZXJzID0gdGhpcy5vcHRpb25zLnBvaW50ZXJzO1xuICAgICAgICByZXR1cm4gb3B0aW9uUG9pbnRlcnMgPT09IDAgfHwgaW5wdXQucG9pbnRlcnMubGVuZ3RoID09PSBvcHRpb25Qb2ludGVycztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJvY2VzcyB0aGUgaW5wdXQgYW5kIHJldHVybiB0aGUgc3RhdGUgZm9yIHRoZSByZWNvZ25pemVyXG4gICAgICogQG1lbWJlcm9mIEF0dHJSZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gICAgICogQHJldHVybnMgeyp9IFN0YXRlXG4gICAgICovXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IGlucHV0LmV2ZW50VHlwZTtcblxuICAgICAgICB2YXIgaXNSZWNvZ25pemVkID0gc3RhdGUgJiAoU1RBVEVfQkVHQU4gfCBTVEFURV9DSEFOR0VEKTtcbiAgICAgICAgdmFyIGlzVmFsaWQgPSB0aGlzLmF0dHJUZXN0KGlucHV0KTtcblxuICAgICAgICAvLyBvbiBjYW5jZWwgaW5wdXQgYW5kIHdlJ3ZlIHJlY29nbml6ZWQgYmVmb3JlLCByZXR1cm4gU1RBVEVfQ0FOQ0VMTEVEXG4gICAgICAgIGlmIChpc1JlY29nbml6ZWQgJiYgKGV2ZW50VHlwZSAmIElOUFVUX0NBTkNFTCB8fCAhaXNWYWxpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZSB8IFNUQVRFX0NBTkNFTExFRDtcbiAgICAgICAgfSBlbHNlIGlmIChpc1JlY29nbml6ZWQgfHwgaXNWYWxpZCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX0VORCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZSB8IFNUQVRFX0VOREVEO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghKHN0YXRlICYgU1RBVEVfQkVHQU4pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFNUQVRFX0JFR0FOO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlIHwgU1RBVEVfQ0hBTkdFRDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFBhblxuICogUmVjb2duaXplZCB3aGVuIHRoZSBwb2ludGVyIGlzIGRvd24gYW5kIG1vdmVkIGluIHRoZSBhbGxvd2VkIGRpcmVjdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUGFuUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5wWCA9IG51bGw7XG4gICAgdGhpcy5wWSA9IG51bGw7XG59XG5cbmluaGVyaXQoUGFuUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBhblJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3BhbicsXG4gICAgICAgIHRocmVzaG9sZDogMTAsXG4gICAgICAgIHBvaW50ZXJzOiAxLFxuICAgICAgICBkaXJlY3Rpb246IERJUkVDVElPTl9BTExcbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5vcHRpb25zLmRpcmVjdGlvbjtcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbXTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9IT1JJWk9OVEFMKSB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goVE9VQ0hfQUNUSU9OX1BBTl9ZKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX1ZFUlRJQ0FMKSB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goVE9VQ0hfQUNUSU9OX1BBTl9YKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aW9ucztcbiAgICB9LFxuXG4gICAgZGlyZWN0aW9uVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgIHZhciBoYXNNb3ZlZCA9IHRydWU7XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IGlucHV0LmRpc3RhbmNlO1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gaW5wdXQuZGlyZWN0aW9uO1xuICAgICAgICB2YXIgeCA9IGlucHV0LmRlbHRhWDtcbiAgICAgICAgdmFyIHkgPSBpbnB1dC5kZWx0YVk7XG5cbiAgICAgICAgLy8gbG9jayB0byBheGlzP1xuICAgICAgICBpZiAoIShkaXJlY3Rpb24gJiBvcHRpb25zLmRpcmVjdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmRpcmVjdGlvbiAmIERJUkVDVElPTl9IT1JJWk9OVEFMKSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gKHggPT09IDApID8gRElSRUNUSU9OX05PTkUgOiAoeCA8IDApID8gRElSRUNUSU9OX0xFRlQgOiBESVJFQ1RJT05fUklHSFQ7XG4gICAgICAgICAgICAgICAgaGFzTW92ZWQgPSB4ICE9IHRoaXMucFg7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgPSBNYXRoLmFicyhpbnB1dC5kZWx0YVgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSAoeSA9PT0gMCkgPyBESVJFQ1RJT05fTk9ORSA6ICh5IDwgMCkgPyBESVJFQ1RJT05fVVAgOiBESVJFQ1RJT05fRE9XTjtcbiAgICAgICAgICAgICAgICBoYXNNb3ZlZCA9IHkgIT0gdGhpcy5wWTtcbiAgICAgICAgICAgICAgICBkaXN0YW5jZSA9IE1hdGguYWJzKGlucHV0LmRlbHRhWSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaW5wdXQuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgICAgICByZXR1cm4gaGFzTW92ZWQgJiYgZGlzdGFuY2UgPiBvcHRpb25zLnRocmVzaG9sZCAmJiBkaXJlY3Rpb24gJiBvcHRpb25zLmRpcmVjdGlvbjtcbiAgICB9LFxuXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBBdHRyUmVjb2duaXplci5wcm90b3R5cGUuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgICh0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4gfHwgKCEodGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOKSAmJiB0aGlzLmRpcmVjdGlvblRlc3QoaW5wdXQpKSk7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG5cbiAgICAgICAgdGhpcy5wWCA9IGlucHV0LmRlbHRhWDtcbiAgICAgICAgdGhpcy5wWSA9IGlucHV0LmRlbHRhWTtcblxuICAgICAgICB2YXIgZGlyZWN0aW9uID0gZGlyZWN0aW9uU3RyKGlucHV0LmRpcmVjdGlvbik7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgaW5wdXQuYWRkaXRpb25hbEV2ZW50ID0gdGhpcy5vcHRpb25zLmV2ZW50ICsgZGlyZWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N1cGVyLmVtaXQuY2FsbCh0aGlzLCBpbnB1dCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogUGluY2hcbiAqIFJlY29nbml6ZWQgd2hlbiB0d28gb3IgbW9yZSBwb2ludGVycyBhcmUgbW92aW5nIHRvd2FyZCAoem9vbS1pbikgb3IgYXdheSBmcm9tIGVhY2ggb3RoZXIgKHpvb20tb3V0KS5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUGluY2hSZWNvZ25pemVyKCkge1xuICAgIEF0dHJSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoUGluY2hSZWNvZ25pemVyLCBBdHRyUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUGluY2hSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwaW5jaCcsXG4gICAgICAgIHRocmVzaG9sZDogMCxcbiAgICAgICAgcG9pbnRlcnM6IDJcbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9OT05FXTtcbiAgICB9LFxuXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBlci5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgKE1hdGguYWJzKGlucHV0LnNjYWxlIC0gMSkgPiB0aGlzLm9wdGlvbnMudGhyZXNob2xkIHx8IHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTik7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmIChpbnB1dC5zY2FsZSAhPT0gMSkge1xuICAgICAgICAgICAgdmFyIGluT3V0ID0gaW5wdXQuc2NhbGUgPCAxID8gJ2luJyA6ICdvdXQnO1xuICAgICAgICAgICAgaW5wdXQuYWRkaXRpb25hbEV2ZW50ID0gdGhpcy5vcHRpb25zLmV2ZW50ICsgaW5PdXQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3VwZXIuZW1pdC5jYWxsKHRoaXMsIGlucHV0KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBQcmVzc1xuICogUmVjb2duaXplZCB3aGVuIHRoZSBwb2ludGVyIGlzIGRvd24gZm9yIHggbXMgd2l0aG91dCBhbnkgbW92ZW1lbnQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIFJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUHJlc3NSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuX3RpbWVyID0gbnVsbDtcbiAgICB0aGlzLl9pbnB1dCA9IG51bGw7XG59XG5cbmluaGVyaXQoUHJlc3NSZWNvZ25pemVyLCBSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQcmVzc1JlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3ByZXNzJyxcbiAgICAgICAgcG9pbnRlcnM6IDEsXG4gICAgICAgIHRpbWU6IDI1MSwgLy8gbWluaW1hbCB0aW1lIG9mIHRoZSBwb2ludGVyIHRvIGJlIHByZXNzZWRcbiAgICAgICAgdGhyZXNob2xkOiA5IC8vIGEgbWluaW1hbCBtb3ZlbWVudCBpcyBvaywgYnV0IGtlZXAgaXQgbG93XG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fQVVUT107XG4gICAgfSxcblxuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICB2YXIgdmFsaWRQb2ludGVycyA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgdmFyIHZhbGlkTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IG9wdGlvbnMudGhyZXNob2xkO1xuICAgICAgICB2YXIgdmFsaWRUaW1lID0gaW5wdXQuZGVsdGFUaW1lID4gb3B0aW9ucy50aW1lO1xuXG4gICAgICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG5cbiAgICAgICAgLy8gd2Ugb25seSBhbGxvdyBsaXR0bGUgbW92ZW1lbnRcbiAgICAgICAgLy8gYW5kIHdlJ3ZlIHJlYWNoZWQgYW4gZW5kIGV2ZW50LCBzbyBhIHRhcCBpcyBwb3NzaWJsZVxuICAgICAgICBpZiAoIXZhbGlkTW92ZW1lbnQgfHwgIXZhbGlkUG9pbnRlcnMgfHwgKGlucHV0LmV2ZW50VHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpICYmICF2YWxpZFRpbWUpKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1JFQ09HTklaRUQ7XG4gICAgICAgICAgICAgICAgdGhpcy50cnlFbWl0KCk7XG4gICAgICAgICAgICB9LCBvcHRpb25zLnRpbWUsIHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX0VORCkge1xuICAgICAgICAgICAgcmV0dXJuIFNUQVRFX1JFQ09HTklaRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPT0gU1RBVEVfUkVDT0dOSVpFRCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlucHV0ICYmIChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQpKSB7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQgKyAndXAnLCBpbnB1dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC50aW1lU3RhbXAgPSBub3coKTtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMub3B0aW9ucy5ldmVudCwgdGhpcy5faW5wdXQpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbi8qKlxuICogUm90YXRlXG4gKiBSZWNvZ25pemVkIHdoZW4gdHdvIG9yIG1vcmUgcG9pbnRlciBhcmUgbW92aW5nIGluIGEgY2lyY3VsYXIgbW90aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBBdHRyUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBSb3RhdGVSZWNvZ25pemVyKCkge1xuICAgIEF0dHJSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoUm90YXRlUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFJvdGF0ZVJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3JvdGF0ZScsXG4gICAgICAgIHRocmVzaG9sZDogMCxcbiAgICAgICAgcG9pbnRlcnM6IDJcbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9OT05FXTtcbiAgICB9LFxuXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBlci5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgKE1hdGguYWJzKGlucHV0LnJvdGF0aW9uKSA+IHRoaXMub3B0aW9ucy50aHJlc2hvbGQgfHwgdGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOKTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBTd2lwZVxuICogUmVjb2duaXplZCB3aGVuIHRoZSBwb2ludGVyIGlzIG1vdmluZyBmYXN0ICh2ZWxvY2l0eSksIHdpdGggZW5vdWdoIGRpc3RhbmNlIGluIHRoZSBhbGxvd2VkIGRpcmVjdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gU3dpcGVSZWNvZ25pemVyKCkge1xuICAgIEF0dHJSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoU3dpcGVSZWNvZ25pemVyLCBBdHRyUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgU3dpcGVSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdzd2lwZScsXG4gICAgICAgIHRocmVzaG9sZDogMTAsXG4gICAgICAgIHZlbG9jaXR5OiAwLjMsXG4gICAgICAgIGRpcmVjdGlvbjogRElSRUNUSU9OX0hPUklaT05UQUwgfCBESVJFQ1RJT05fVkVSVElDQUwsXG4gICAgICAgIHBvaW50ZXJzOiAxXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFBhblJlY29nbml6ZXIucHJvdG90eXBlLmdldFRvdWNoQWN0aW9uLmNhbGwodGhpcyk7XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5vcHRpb25zLmRpcmVjdGlvbjtcbiAgICAgICAgdmFyIHZlbG9jaXR5O1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gJiAoRElSRUNUSU9OX0hPUklaT05UQUwgfCBESVJFQ1RJT05fVkVSVElDQUwpKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IGlucHV0Lm92ZXJhbGxWZWxvY2l0eTtcbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBpbnB1dC5vdmVyYWxsVmVsb2NpdHlYO1xuICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBpbnB1dC5vdmVyYWxsVmVsb2NpdHlZO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3N1cGVyLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICBkaXJlY3Rpb24gJiBpbnB1dC5vZmZzZXREaXJlY3Rpb24gJiZcbiAgICAgICAgICAgIGlucHV0LmRpc3RhbmNlID4gdGhpcy5vcHRpb25zLnRocmVzaG9sZCAmJlxuICAgICAgICAgICAgaW5wdXQubWF4UG9pbnRlcnMgPT0gdGhpcy5vcHRpb25zLnBvaW50ZXJzICYmXG4gICAgICAgICAgICBhYnModmVsb2NpdHkpID4gdGhpcy5vcHRpb25zLnZlbG9jaXR5ICYmIGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX0VORDtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGRpcmVjdGlvblN0cihpbnB1dC5vZmZzZXREaXJlY3Rpb24pO1xuICAgICAgICBpZiAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQgKyBkaXJlY3Rpb24sIGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMub3B0aW9ucy5ldmVudCwgaW5wdXQpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIEEgdGFwIGlzIGVjb2duaXplZCB3aGVuIHRoZSBwb2ludGVyIGlzIGRvaW5nIGEgc21hbGwgdGFwL2NsaWNrLiBNdWx0aXBsZSB0YXBzIGFyZSByZWNvZ25pemVkIGlmIHRoZXkgb2NjdXJcbiAqIGJldHdlZW4gdGhlIGdpdmVuIGludGVydmFsIGFuZCBwb3NpdGlvbi4gVGhlIGRlbGF5IG9wdGlvbiBjYW4gYmUgdXNlZCB0byByZWNvZ25pemUgbXVsdGktdGFwcyB3aXRob3V0IGZpcmluZ1xuICogYSBzaW5nbGUgdGFwLlxuICpcbiAqIFRoZSBldmVudERhdGEgZnJvbSB0aGUgZW1pdHRlZCBldmVudCBjb250YWlucyB0aGUgcHJvcGVydHkgYHRhcENvdW50YCwgd2hpY2ggY29udGFpbnMgdGhlIGFtb3VudCBvZlxuICogbXVsdGktdGFwcyBiZWluZyByZWNvZ25pemVkLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFRhcFJlY29nbml6ZXIoKSB7XG4gICAgUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgLy8gcHJldmlvdXMgdGltZSBhbmQgY2VudGVyLFxuICAgIC8vIHVzZWQgZm9yIHRhcCBjb3VudGluZ1xuICAgIHRoaXMucFRpbWUgPSBmYWxzZTtcbiAgICB0aGlzLnBDZW50ZXIgPSBmYWxzZTtcblxuICAgIHRoaXMuX3RpbWVyID0gbnVsbDtcbiAgICB0aGlzLl9pbnB1dCA9IG51bGw7XG4gICAgdGhpcy5jb3VudCA9IDA7XG59XG5cbmluaGVyaXQoVGFwUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUGluY2hSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICd0YXAnLFxuICAgICAgICBwb2ludGVyczogMSxcbiAgICAgICAgdGFwczogMSxcbiAgICAgICAgaW50ZXJ2YWw6IDMwMCwgLy8gbWF4IHRpbWUgYmV0d2VlbiB0aGUgbXVsdGktdGFwIHRhcHNcbiAgICAgICAgdGltZTogMjUwLCAvLyBtYXggdGltZSBvZiB0aGUgcG9pbnRlciB0byBiZSBkb3duIChsaWtlIGZpbmdlciBvbiB0aGUgc2NyZWVuKVxuICAgICAgICB0aHJlc2hvbGQ6IDksIC8vIGEgbWluaW1hbCBtb3ZlbWVudCBpcyBvaywgYnV0IGtlZXAgaXQgbG93XG4gICAgICAgIHBvc1RocmVzaG9sZDogMTAgLy8gYSBtdWx0aS10YXAgY2FuIGJlIGEgYml0IG9mZiB0aGUgaW5pdGlhbCBwb3NpdGlvblxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTl07XG4gICAgfSxcblxuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG4gICAgICAgIHZhciB2YWxpZFBvaW50ZXJzID0gaW5wdXQucG9pbnRlcnMubGVuZ3RoID09PSBvcHRpb25zLnBvaW50ZXJzO1xuICAgICAgICB2YXIgdmFsaWRNb3ZlbWVudCA9IGlucHV0LmRpc3RhbmNlIDwgb3B0aW9ucy50aHJlc2hvbGQ7XG4gICAgICAgIHZhciB2YWxpZFRvdWNoVGltZSA9IGlucHV0LmRlbHRhVGltZSA8IG9wdGlvbnMudGltZTtcblxuICAgICAgICB0aGlzLnJlc2V0KCk7XG5cbiAgICAgICAgaWYgKChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9TVEFSVCkgJiYgKHRoaXMuY291bnQgPT09IDApKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mYWlsVGltZW91dCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2Ugb25seSBhbGxvdyBsaXR0bGUgbW92ZW1lbnRcbiAgICAgICAgLy8gYW5kIHdlJ3ZlIHJlYWNoZWQgYW4gZW5kIGV2ZW50LCBzbyBhIHRhcCBpcyBwb3NzaWJsZVxuICAgICAgICBpZiAodmFsaWRNb3ZlbWVudCAmJiB2YWxpZFRvdWNoVGltZSAmJiB2YWxpZFBvaW50ZXJzKSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQuZXZlbnRUeXBlICE9IElOUFVUX0VORCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZhaWxUaW1lb3V0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB2YWxpZEludGVydmFsID0gdGhpcy5wVGltZSA/IChpbnB1dC50aW1lU3RhbXAgLSB0aGlzLnBUaW1lIDwgb3B0aW9ucy5pbnRlcnZhbCkgOiB0cnVlO1xuICAgICAgICAgICAgdmFyIHZhbGlkTXVsdGlUYXAgPSAhdGhpcy5wQ2VudGVyIHx8IGdldERpc3RhbmNlKHRoaXMucENlbnRlciwgaW5wdXQuY2VudGVyKSA8IG9wdGlvbnMucG9zVGhyZXNob2xkO1xuXG4gICAgICAgICAgICB0aGlzLnBUaW1lID0gaW5wdXQudGltZVN0YW1wO1xuICAgICAgICAgICAgdGhpcy5wQ2VudGVyID0gaW5wdXQuY2VudGVyO1xuXG4gICAgICAgICAgICBpZiAoIXZhbGlkTXVsdGlUYXAgfHwgIXZhbGlkSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50ID0gMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCArPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuXG4gICAgICAgICAgICAvLyBpZiB0YXAgY291bnQgbWF0Y2hlcyB3ZSBoYXZlIHJlY29nbml6ZWQgaXQsXG4gICAgICAgICAgICAvLyBlbHNlIGl0IGhhcyBiZWdhbiByZWNvZ25pemluZy4uLlxuICAgICAgICAgICAgdmFyIHRhcENvdW50ID0gdGhpcy5jb3VudCAlIG9wdGlvbnMudGFwcztcbiAgICAgICAgICAgIGlmICh0YXBDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIG5vIGZhaWxpbmcgcmVxdWlyZW1lbnRzLCBpbW1lZGlhdGVseSB0cmlnZ2VyIHRoZSB0YXAgZXZlbnRcbiAgICAgICAgICAgICAgICAvLyBvciB3YWl0IGFzIGxvbmcgYXMgdGhlIG11bHRpdGFwIGludGVydmFsIHRvIHRyaWdnZXJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaGFzUmVxdWlyZUZhaWx1cmVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFNUQVRFX1JFQ09HTklaRUQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0Q29udGV4dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cnlFbWl0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMuaW50ZXJ2YWwsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU1RBVEVfQkVHQU47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIGZhaWxUaW1lb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0Q29udGV4dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9GQUlMRUQ7XG4gICAgICAgIH0sIHRoaXMub3B0aW9ucy5pbnRlcnZhbCwgdGhpcyk7XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlID09IFNUQVRFX1JFQ09HTklaRUQpIHtcbiAgICAgICAgICAgIHRoaXMuX2lucHV0LnRhcENvdW50ID0gdGhpcy5jb3VudDtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMub3B0aW9ucy5ldmVudCwgdGhpcy5faW5wdXQpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbi8qKlxuICogU2ltcGxlIHdheSB0byBjcmVhdGUgYSBtYW5hZ2VyIHdpdGggYSBkZWZhdWx0IHNldCBvZiByZWNvZ25pemVycy5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBIYW1tZXIoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIG9wdGlvbnMucmVjb2duaXplcnMgPSBpZlVuZGVmaW5lZChvcHRpb25zLnJlY29nbml6ZXJzLCBIYW1tZXIuZGVmYXVsdHMucHJlc2V0KTtcbiAgICByZXR1cm4gbmV3IE1hbmFnZXIoZWxlbWVudCwgb3B0aW9ucyk7XG59XG5cbi8qKlxuICogQGNvbnN0IHtzdHJpbmd9XG4gKi9cbkhhbW1lci5WRVJTSU9OID0gJzIuMC42JztcblxuLyoqXG4gKiBkZWZhdWx0IHNldHRpbmdzXG4gKiBAbmFtZXNwYWNlXG4gKi9cbkhhbW1lci5kZWZhdWx0cyA9IHtcbiAgICAvKipcbiAgICAgKiBzZXQgaWYgRE9NIGV2ZW50cyBhcmUgYmVpbmcgdHJpZ2dlcmVkLlxuICAgICAqIEJ1dCB0aGlzIGlzIHNsb3dlciBhbmQgdW51c2VkIGJ5IHNpbXBsZSBpbXBsZW1lbnRhdGlvbnMsIHNvIGRpc2FibGVkIGJ5IGRlZmF1bHQuXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgKi9cbiAgICBkb21FdmVudHM6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogVGhlIHZhbHVlIGZvciB0aGUgdG91Y2hBY3Rpb24gcHJvcGVydHkvZmFsbGJhY2suXG4gICAgICogV2hlbiBzZXQgdG8gYGNvbXB1dGVgIGl0IHdpbGwgbWFnaWNhbGx5IHNldCB0aGUgY29ycmVjdCB2YWx1ZSBiYXNlZCBvbiB0aGUgYWRkZWQgcmVjb2duaXplcnMuXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKiBAZGVmYXVsdCBjb21wdXRlXG4gICAgICovXG4gICAgdG91Y2hBY3Rpb246IFRPVUNIX0FDVElPTl9DT01QVVRFLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICogQGRlZmF1bHQgdHJ1ZVxuICAgICAqL1xuICAgIGVuYWJsZTogdHJ1ZSxcblxuICAgIC8qKlxuICAgICAqIEVYUEVSSU1FTlRBTCBGRUFUVVJFIC0tIGNhbiBiZSByZW1vdmVkL2NoYW5nZWRcbiAgICAgKiBDaGFuZ2UgdGhlIHBhcmVudCBpbnB1dCB0YXJnZXQgZWxlbWVudC5cbiAgICAgKiBJZiBOdWxsLCB0aGVuIGl0IGlzIGJlaW5nIHNldCB0aGUgdG8gbWFpbiBlbGVtZW50LlxuICAgICAqIEB0eXBlIHtOdWxsfEV2ZW50VGFyZ2V0fVxuICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgKi9cbiAgICBpbnB1dFRhcmdldDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIGZvcmNlIGFuIGlucHV0IGNsYXNzXG4gICAgICogQHR5cGUge051bGx8RnVuY3Rpb259XG4gICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAqL1xuICAgIGlucHV0Q2xhc3M6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBEZWZhdWx0IHJlY29nbml6ZXIgc2V0dXAgd2hlbiBjYWxsaW5nIGBIYW1tZXIoKWBcbiAgICAgKiBXaGVuIGNyZWF0aW5nIGEgbmV3IE1hbmFnZXIgdGhlc2Ugd2lsbCBiZSBza2lwcGVkLlxuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cbiAgICBwcmVzZXQ6IFtcbiAgICAgICAgLy8gUmVjb2duaXplckNsYXNzLCBvcHRpb25zLCBbcmVjb2duaXplV2l0aCwgLi4uXSwgW3JlcXVpcmVGYWlsdXJlLCAuLi5dXG4gICAgICAgIFtSb3RhdGVSZWNvZ25pemVyLCB7ZW5hYmxlOiBmYWxzZX1dLFxuICAgICAgICBbUGluY2hSZWNvZ25pemVyLCB7ZW5hYmxlOiBmYWxzZX0sIFsncm90YXRlJ11dLFxuICAgICAgICBbU3dpcGVSZWNvZ25pemVyLCB7ZGlyZWN0aW9uOiBESVJFQ1RJT05fSE9SSVpPTlRBTH1dLFxuICAgICAgICBbUGFuUmVjb2duaXplciwge2RpcmVjdGlvbjogRElSRUNUSU9OX0hPUklaT05UQUx9LCBbJ3N3aXBlJ11dLFxuICAgICAgICBbVGFwUmVjb2duaXplcl0sXG4gICAgICAgIFtUYXBSZWNvZ25pemVyLCB7ZXZlbnQ6ICdkb3VibGV0YXAnLCB0YXBzOiAyfSwgWyd0YXAnXV0sXG4gICAgICAgIFtQcmVzc1JlY29nbml6ZXJdXG4gICAgXSxcblxuICAgIC8qKlxuICAgICAqIFNvbWUgQ1NTIHByb3BlcnRpZXMgY2FuIGJlIHVzZWQgdG8gaW1wcm92ZSB0aGUgd29ya2luZyBvZiBIYW1tZXIuXG4gICAgICogQWRkIHRoZW0gdG8gdGhpcyBtZXRob2QgYW5kIHRoZXkgd2lsbCBiZSBzZXQgd2hlbiBjcmVhdGluZyBhIG5ldyBNYW5hZ2VyLlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKi9cbiAgICBjc3NQcm9wczoge1xuICAgICAgICAvKipcbiAgICAgICAgICogRGlzYWJsZXMgdGV4dCBzZWxlY3Rpb24gdG8gaW1wcm92ZSB0aGUgZHJhZ2dpbmcgZ2VzdHVyZS4gTWFpbmx5IGZvciBkZXNrdG9wIGJyb3dzZXJzLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHVzZXJTZWxlY3Q6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzYWJsZSB0aGUgV2luZG93cyBQaG9uZSBncmlwcGVycyB3aGVuIHByZXNzaW5nIGFuIGVsZW1lbnQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdG91Y2hTZWxlY3Q6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzYWJsZXMgdGhlIGRlZmF1bHQgY2FsbG91dCBzaG93biB3aGVuIHlvdSB0b3VjaCBhbmQgaG9sZCBhIHRvdWNoIHRhcmdldC5cbiAgICAgICAgICogT24gaU9TLCB3aGVuIHlvdSB0b3VjaCBhbmQgaG9sZCBhIHRvdWNoIHRhcmdldCBzdWNoIGFzIGEgbGluaywgU2FmYXJpIGRpc3BsYXlzXG4gICAgICAgICAqIGEgY2FsbG91dCBjb250YWluaW5nIGluZm9ybWF0aW9uIGFib3V0IHRoZSBsaW5rLiBUaGlzIHByb3BlcnR5IGFsbG93cyB5b3UgdG8gZGlzYWJsZSB0aGF0IGNhbGxvdXQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdG91Y2hDYWxsb3V0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNwZWNpZmllcyB3aGV0aGVyIHpvb21pbmcgaXMgZW5hYmxlZC4gVXNlZCBieSBJRTEwPlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIGNvbnRlbnRab29taW5nOiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNwZWNpZmllcyB0aGF0IGFuIGVudGlyZSBlbGVtZW50IHNob3VsZCBiZSBkcmFnZ2FibGUgaW5zdGVhZCBvZiBpdHMgY29udGVudHMuIE1haW5seSBmb3IgZGVza3RvcCBicm93c2Vycy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB1c2VyRHJhZzogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPdmVycmlkZXMgdGhlIGhpZ2hsaWdodCBjb2xvciBzaG93biB3aGVuIHRoZSB1c2VyIHRhcHMgYSBsaW5rIG9yIGEgSmF2YVNjcmlwdFxuICAgICAgICAgKiBjbGlja2FibGUgZWxlbWVudCBpbiBpT1MuIFRoaXMgcHJvcGVydHkgb2JleXMgdGhlIGFscGhhIHZhbHVlLCBpZiBzcGVjaWZpZWQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdyZ2JhKDAsMCwwLDApJ1xuICAgICAgICAgKi9cbiAgICAgICAgdGFwSGlnaGxpZ2h0Q29sb3I6ICdyZ2JhKDAsMCwwLDApJ1xuICAgIH1cbn07XG5cbnZhciBTVE9QID0gMTtcbnZhciBGT1JDRURfU1RPUCA9IDI7XG5cbi8qKlxuICogTWFuYWdlclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1hbmFnZXIoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgSGFtbWVyLmRlZmF1bHRzLCBvcHRpb25zIHx8IHt9KTtcblxuICAgIHRoaXMub3B0aW9ucy5pbnB1dFRhcmdldCA9IHRoaXMub3B0aW9ucy5pbnB1dFRhcmdldCB8fCBlbGVtZW50O1xuXG4gICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICAgIHRoaXMuc2Vzc2lvbiA9IHt9O1xuICAgIHRoaXMucmVjb2duaXplcnMgPSBbXTtcblxuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5pbnB1dCA9IGNyZWF0ZUlucHV0SW5zdGFuY2UodGhpcyk7XG4gICAgdGhpcy50b3VjaEFjdGlvbiA9IG5ldyBUb3VjaEFjdGlvbih0aGlzLCB0aGlzLm9wdGlvbnMudG91Y2hBY3Rpb24pO1xuXG4gICAgdG9nZ2xlQ3NzUHJvcHModGhpcywgdHJ1ZSk7XG5cbiAgICBlYWNoKHRoaXMub3B0aW9ucy5yZWNvZ25pemVycywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICB2YXIgcmVjb2duaXplciA9IHRoaXMuYWRkKG5ldyAoaXRlbVswXSkoaXRlbVsxXSkpO1xuICAgICAgICBpdGVtWzJdICYmIHJlY29nbml6ZXIucmVjb2duaXplV2l0aChpdGVtWzJdKTtcbiAgICAgICAgaXRlbVszXSAmJiByZWNvZ25pemVyLnJlcXVpcmVGYWlsdXJlKGl0ZW1bM10pO1xuICAgIH0sIHRoaXMpO1xufVxuXG5NYW5hZ2VyLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBzZXQgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICogQHJldHVybnMge01hbmFnZXJ9XG4gICAgICovXG4gICAgc2V0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIGFzc2lnbih0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8vIE9wdGlvbnMgdGhhdCBuZWVkIGEgbGl0dGxlIG1vcmUgc2V0dXBcbiAgICAgICAgaWYgKG9wdGlvbnMudG91Y2hBY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW5wdXRUYXJnZXQpIHtcbiAgICAgICAgICAgIC8vIENsZWFuIHVwIGV4aXN0aW5nIGV2ZW50IGxpc3RlbmVycyBhbmQgcmVpbml0aWFsaXplXG4gICAgICAgICAgICB0aGlzLmlucHV0LmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQudGFyZ2V0ID0gb3B0aW9ucy5pbnB1dFRhcmdldDtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQuaW5pdCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzdG9wIHJlY29nbml6aW5nIGZvciB0aGlzIHNlc3Npb24uXG4gICAgICogVGhpcyBzZXNzaW9uIHdpbGwgYmUgZGlzY2FyZGVkLCB3aGVuIGEgbmV3IFtpbnB1dF1zdGFydCBldmVudCBpcyBmaXJlZC5cbiAgICAgKiBXaGVuIGZvcmNlZCwgdGhlIHJlY29nbml6ZXIgY3ljbGUgaXMgc3RvcHBlZCBpbW1lZGlhdGVseS5cbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtmb3JjZV1cbiAgICAgKi9cbiAgICBzdG9wOiBmdW5jdGlvbihmb3JjZSkge1xuICAgICAgICB0aGlzLnNlc3Npb24uc3RvcHBlZCA9IGZvcmNlID8gRk9SQ0VEX1NUT1AgOiBTVE9QO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBydW4gdGhlIHJlY29nbml6ZXJzIVxuICAgICAqIGNhbGxlZCBieSB0aGUgaW5wdXRIYW5kbGVyIGZ1bmN0aW9uIG9uIGV2ZXJ5IG1vdmVtZW50IG9mIHRoZSBwb2ludGVycyAodG91Y2hlcylcbiAgICAgKiBpdCB3YWxrcyB0aHJvdWdoIGFsbCB0aGUgcmVjb2duaXplcnMgYW5kIHRyaWVzIHRvIGRldGVjdCB0aGUgZ2VzdHVyZSB0aGF0IGlzIGJlaW5nIG1hZGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXREYXRhXG4gICAgICovXG4gICAgcmVjb2duaXplOiBmdW5jdGlvbihpbnB1dERhdGEpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb247XG4gICAgICAgIGlmIChzZXNzaW9uLnN0b3BwZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJ1biB0aGUgdG91Y2gtYWN0aW9uIHBvbHlmaWxsXG4gICAgICAgIHRoaXMudG91Y2hBY3Rpb24ucHJldmVudERlZmF1bHRzKGlucHV0RGF0YSk7XG5cbiAgICAgICAgdmFyIHJlY29nbml6ZXI7XG4gICAgICAgIHZhciByZWNvZ25pemVycyA9IHRoaXMucmVjb2duaXplcnM7XG5cbiAgICAgICAgLy8gdGhpcyBob2xkcyB0aGUgcmVjb2duaXplciB0aGF0IGlzIGJlaW5nIHJlY29nbml6ZWQuXG4gICAgICAgIC8vIHNvIHRoZSByZWNvZ25pemVyJ3Mgc3RhdGUgbmVlZHMgdG8gYmUgQkVHQU4sIENIQU5HRUQsIEVOREVEIG9yIFJFQ09HTklaRURcbiAgICAgICAgLy8gaWYgbm8gcmVjb2duaXplciBpcyBkZXRlY3RpbmcgYSB0aGluZywgaXQgaXMgc2V0IHRvIGBudWxsYFxuICAgICAgICB2YXIgY3VyUmVjb2duaXplciA9IHNlc3Npb24uY3VyUmVjb2duaXplcjtcblxuICAgICAgICAvLyByZXNldCB3aGVuIHRoZSBsYXN0IHJlY29nbml6ZXIgaXMgcmVjb2duaXplZFxuICAgICAgICAvLyBvciB3aGVuIHdlJ3JlIGluIGEgbmV3IHNlc3Npb25cbiAgICAgICAgaWYgKCFjdXJSZWNvZ25pemVyIHx8IChjdXJSZWNvZ25pemVyICYmIGN1clJlY29nbml6ZXIuc3RhdGUgJiBTVEFURV9SRUNPR05JWkVEKSkge1xuICAgICAgICAgICAgY3VyUmVjb2duaXplciA9IHNlc3Npb24uY3VyUmVjb2duaXplciA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgcmVjb2duaXplcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZWNvZ25pemVyID0gcmVjb2duaXplcnNbaV07XG5cbiAgICAgICAgICAgIC8vIGZpbmQgb3V0IGlmIHdlIGFyZSBhbGxvd2VkIHRyeSB0byByZWNvZ25pemUgdGhlIGlucHV0IGZvciB0aGlzIG9uZS5cbiAgICAgICAgICAgIC8vIDEuICAgYWxsb3cgaWYgdGhlIHNlc3Npb24gaXMgTk9UIGZvcmNlZCBzdG9wcGVkIChzZWUgdGhlIC5zdG9wKCkgbWV0aG9kKVxuICAgICAgICAgICAgLy8gMi4gICBhbGxvdyBpZiB3ZSBzdGlsbCBoYXZlbid0IHJlY29nbml6ZWQgYSBnZXN0dXJlIGluIHRoaXMgc2Vzc2lvbiwgb3IgdGhlIHRoaXMgcmVjb2duaXplciBpcyB0aGUgb25lXG4gICAgICAgICAgICAvLyAgICAgIHRoYXQgaXMgYmVpbmcgcmVjb2duaXplZC5cbiAgICAgICAgICAgIC8vIDMuICAgYWxsb3cgaWYgdGhlIHJlY29nbml6ZXIgaXMgYWxsb3dlZCB0byBydW4gc2ltdWx0YW5lb3VzIHdpdGggdGhlIGN1cnJlbnQgcmVjb2duaXplZCByZWNvZ25pemVyLlxuICAgICAgICAgICAgLy8gICAgICB0aGlzIGNhbiBiZSBzZXR1cCB3aXRoIHRoZSBgcmVjb2duaXplV2l0aCgpYCBtZXRob2Qgb24gdGhlIHJlY29nbml6ZXIuXG4gICAgICAgICAgICBpZiAoc2Vzc2lvbi5zdG9wcGVkICE9PSBGT1JDRURfU1RPUCAmJiAoIC8vIDFcbiAgICAgICAgICAgICAgICAgICAgIWN1clJlY29nbml6ZXIgfHwgcmVjb2duaXplciA9PSBjdXJSZWNvZ25pemVyIHx8IC8vIDJcbiAgICAgICAgICAgICAgICAgICAgcmVjb2duaXplci5jYW5SZWNvZ25pemVXaXRoKGN1clJlY29nbml6ZXIpKSkgeyAvLyAzXG4gICAgICAgICAgICAgICAgcmVjb2duaXplci5yZWNvZ25pemUoaW5wdXREYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVjb2duaXplci5yZXNldCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGUgcmVjb2duaXplciBoYXMgYmVlbiByZWNvZ25pemluZyB0aGUgaW5wdXQgYXMgYSB2YWxpZCBnZXN0dXJlLCB3ZSB3YW50IHRvIHN0b3JlIHRoaXMgb25lIGFzIHRoZVxuICAgICAgICAgICAgLy8gY3VycmVudCBhY3RpdmUgcmVjb2duaXplci4gYnV0IG9ubHkgaWYgd2UgZG9uJ3QgYWxyZWFkeSBoYXZlIGFuIGFjdGl2ZSByZWNvZ25pemVyXG4gICAgICAgICAgICBpZiAoIWN1clJlY29nbml6ZXIgJiYgcmVjb2duaXplci5zdGF0ZSAmIChTVEFURV9CRUdBTiB8IFNUQVRFX0NIQU5HRUQgfCBTVEFURV9FTkRFRCkpIHtcbiAgICAgICAgICAgICAgICBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyID0gcmVjb2duaXplcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBnZXQgYSByZWNvZ25pemVyIGJ5IGl0cyBldmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcnxTdHJpbmd9IHJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcnxOdWxsfVxuICAgICAqL1xuICAgIGdldDogZnVuY3Rpb24ocmVjb2duaXplcikge1xuICAgICAgICBpZiAocmVjb2duaXplciBpbnN0YW5jZW9mIFJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiByZWNvZ25pemVyO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlY29nbml6ZXJzID0gdGhpcy5yZWNvZ25pemVycztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWNvZ25pemVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHJlY29nbml6ZXJzW2ldLm9wdGlvbnMuZXZlbnQgPT0gcmVjb2duaXplcikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWNvZ25pemVyc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogYWRkIGEgcmVjb2duaXplciB0byB0aGUgbWFuYWdlclxuICAgICAqIGV4aXN0aW5nIHJlY29nbml6ZXJzIHdpdGggdGhlIHNhbWUgZXZlbnQgbmFtZSB3aWxsIGJlIHJlbW92ZWRcbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IHJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcnxNYW5hZ2VyfVxuICAgICAqL1xuICAgIGFkZDogZnVuY3Rpb24ocmVjb2duaXplcikge1xuICAgICAgICBpZiAoaW52b2tlQXJyYXlBcmcocmVjb2duaXplciwgJ2FkZCcsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlbW92ZSBleGlzdGluZ1xuICAgICAgICB2YXIgZXhpc3RpbmcgPSB0aGlzLmdldChyZWNvZ25pemVyLm9wdGlvbnMuZXZlbnQpO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGV4aXN0aW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVjb2duaXplcnMucHVzaChyZWNvZ25pemVyKTtcbiAgICAgICAgcmVjb2duaXplci5tYW5hZ2VyID0gdGhpcztcblxuICAgICAgICB0aGlzLnRvdWNoQWN0aW9uLnVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gcmVjb2duaXplcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmVtb3ZlIGEgcmVjb2duaXplciBieSBuYW1lIG9yIGluc3RhbmNlXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfFN0cmluZ30gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtNYW5hZ2VyfVxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24ocmVjb2duaXplcikge1xuICAgICAgICBpZiAoaW52b2tlQXJyYXlBcmcocmVjb2duaXplciwgJ3JlbW92ZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJlY29nbml6ZXIgPSB0aGlzLmdldChyZWNvZ25pemVyKTtcblxuICAgICAgICAvLyBsZXQncyBtYWtlIHN1cmUgdGhpcyByZWNvZ25pemVyIGV4aXN0c1xuICAgICAgICBpZiAocmVjb2duaXplcikge1xuICAgICAgICAgICAgdmFyIHJlY29nbml6ZXJzID0gdGhpcy5yZWNvZ25pemVycztcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGluQXJyYXkocmVjb2duaXplcnMsIHJlY29nbml6ZXIpO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmVjb2duaXplcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRvdWNoQWN0aW9uLnVwZGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGJpbmQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICAgICAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24oZXZlbnRzLCBoYW5kbGVyKSB7XG4gICAgICAgIHZhciBoYW5kbGVycyA9IHRoaXMuaGFuZGxlcnM7XG4gICAgICAgIGVhY2goc3BsaXRTdHIoZXZlbnRzKSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2V2ZW50XSA9IGhhbmRsZXJzW2V2ZW50XSB8fCBbXTtcbiAgICAgICAgICAgIGhhbmRsZXJzW2V2ZW50XS5wdXNoKGhhbmRsZXIpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVuYmluZCBldmVudCwgbGVhdmUgZW1pdCBibGFuayB0byByZW1vdmUgYWxsIGhhbmRsZXJzXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50c1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtoYW5kbGVyXVxuICAgICAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uKGV2ZW50cywgaGFuZGxlcikge1xuICAgICAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLmhhbmRsZXJzO1xuICAgICAgICBlYWNoKHNwbGl0U3RyKGV2ZW50cyksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgaGFuZGxlcnNbZXZlbnRdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyc1tldmVudF0gJiYgaGFuZGxlcnNbZXZlbnRdLnNwbGljZShpbkFycmF5KGhhbmRsZXJzW2V2ZW50XSwgaGFuZGxlciksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGVtaXQgZXZlbnQgdG8gdGhlIGxpc3RlbmVyc1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICovXG4gICAgZW1pdDogZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgLy8gd2UgYWxzbyB3YW50IHRvIHRyaWdnZXIgZG9tIGV2ZW50c1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRvbUV2ZW50cykge1xuICAgICAgICAgICAgdHJpZ2dlckRvbUV2ZW50KGV2ZW50LCBkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vIGhhbmRsZXJzLCBzbyBza2lwIGl0IGFsbFxuICAgICAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLmhhbmRsZXJzW2V2ZW50XSAmJiB0aGlzLmhhbmRsZXJzW2V2ZW50XS5zbGljZSgpO1xuICAgICAgICBpZiAoIWhhbmRsZXJzIHx8ICFoYW5kbGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRhdGEudHlwZSA9IGV2ZW50O1xuICAgICAgICBkYXRhLnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkYXRhLnNyY0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IGhhbmRsZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgaGFuZGxlcnNbaV0oZGF0YSk7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZGVzdHJveSB0aGUgbWFuYWdlciBhbmQgdW5iaW5kcyBhbGwgZXZlbnRzXG4gICAgICogaXQgZG9lc24ndCB1bmJpbmQgZG9tIGV2ZW50cywgdGhhdCBpcyB0aGUgdXNlciBvd24gcmVzcG9uc2liaWxpdHlcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ICYmIHRvZ2dsZUNzc1Byb3BzKHRoaXMsIGZhbHNlKTtcblxuICAgICAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gICAgICAgIHRoaXMuc2Vzc2lvbiA9IHt9O1xuICAgICAgICB0aGlzLmlucHV0LmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICB9XG59O1xuXG4vKipcbiAqIGFkZC9yZW1vdmUgdGhlIGNzcyBwcm9wZXJ0aWVzIGFzIGRlZmluZWQgaW4gbWFuYWdlci5vcHRpb25zLmNzc1Byb3BzXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gYWRkXG4gKi9cbmZ1bmN0aW9uIHRvZ2dsZUNzc1Byb3BzKG1hbmFnZXIsIGFkZCkge1xuICAgIHZhciBlbGVtZW50ID0gbWFuYWdlci5lbGVtZW50O1xuICAgIGlmICghZWxlbWVudC5zdHlsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGVhY2gobWFuYWdlci5vcHRpb25zLmNzc1Byb3BzLCBmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICBlbGVtZW50LnN0eWxlW3ByZWZpeGVkKGVsZW1lbnQuc3R5bGUsIG5hbWUpXSA9IGFkZCA/IHZhbHVlIDogJyc7XG4gICAgfSk7XG59XG5cbi8qKlxuICogdHJpZ2dlciBkb20gZXZlbnRcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAqL1xuZnVuY3Rpb24gdHJpZ2dlckRvbUV2ZW50KGV2ZW50LCBkYXRhKSB7XG4gICAgdmFyIGdlc3R1cmVFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGdlc3R1cmVFdmVudC5pbml0RXZlbnQoZXZlbnQsIHRydWUsIHRydWUpO1xuICAgIGdlc3R1cmVFdmVudC5nZXN0dXJlID0gZGF0YTtcbiAgICBkYXRhLnRhcmdldC5kaXNwYXRjaEV2ZW50KGdlc3R1cmVFdmVudCk7XG59XG5cbmFzc2lnbihIYW1tZXIsIHtcbiAgICBJTlBVVF9TVEFSVDogSU5QVVRfU1RBUlQsXG4gICAgSU5QVVRfTU9WRTogSU5QVVRfTU9WRSxcbiAgICBJTlBVVF9FTkQ6IElOUFVUX0VORCxcbiAgICBJTlBVVF9DQU5DRUw6IElOUFVUX0NBTkNFTCxcblxuICAgIFNUQVRFX1BPU1NJQkxFOiBTVEFURV9QT1NTSUJMRSxcbiAgICBTVEFURV9CRUdBTjogU1RBVEVfQkVHQU4sXG4gICAgU1RBVEVfQ0hBTkdFRDogU1RBVEVfQ0hBTkdFRCxcbiAgICBTVEFURV9FTkRFRDogU1RBVEVfRU5ERUQsXG4gICAgU1RBVEVfUkVDT0dOSVpFRDogU1RBVEVfUkVDT0dOSVpFRCxcbiAgICBTVEFURV9DQU5DRUxMRUQ6IFNUQVRFX0NBTkNFTExFRCxcbiAgICBTVEFURV9GQUlMRUQ6IFNUQVRFX0ZBSUxFRCxcblxuICAgIERJUkVDVElPTl9OT05FOiBESVJFQ1RJT05fTk9ORSxcbiAgICBESVJFQ1RJT05fTEVGVDogRElSRUNUSU9OX0xFRlQsXG4gICAgRElSRUNUSU9OX1JJR0hUOiBESVJFQ1RJT05fUklHSFQsXG4gICAgRElSRUNUSU9OX1VQOiBESVJFQ1RJT05fVVAsXG4gICAgRElSRUNUSU9OX0RPV046IERJUkVDVElPTl9ET1dOLFxuICAgIERJUkVDVElPTl9IT1JJWk9OVEFMOiBESVJFQ1RJT05fSE9SSVpPTlRBTCxcbiAgICBESVJFQ1RJT05fVkVSVElDQUw6IERJUkVDVElPTl9WRVJUSUNBTCxcbiAgICBESVJFQ1RJT05fQUxMOiBESVJFQ1RJT05fQUxMLFxuXG4gICAgTWFuYWdlcjogTWFuYWdlcixcbiAgICBJbnB1dDogSW5wdXQsXG4gICAgVG91Y2hBY3Rpb246IFRvdWNoQWN0aW9uLFxuXG4gICAgVG91Y2hJbnB1dDogVG91Y2hJbnB1dCxcbiAgICBNb3VzZUlucHV0OiBNb3VzZUlucHV0LFxuICAgIFBvaW50ZXJFdmVudElucHV0OiBQb2ludGVyRXZlbnRJbnB1dCxcbiAgICBUb3VjaE1vdXNlSW5wdXQ6IFRvdWNoTW91c2VJbnB1dCxcbiAgICBTaW5nbGVUb3VjaElucHV0OiBTaW5nbGVUb3VjaElucHV0LFxuXG4gICAgUmVjb2duaXplcjogUmVjb2duaXplcixcbiAgICBBdHRyUmVjb2duaXplcjogQXR0clJlY29nbml6ZXIsXG4gICAgVGFwOiBUYXBSZWNvZ25pemVyLFxuICAgIFBhbjogUGFuUmVjb2duaXplcixcbiAgICBTd2lwZTogU3dpcGVSZWNvZ25pemVyLFxuICAgIFBpbmNoOiBQaW5jaFJlY29nbml6ZXIsXG4gICAgUm90YXRlOiBSb3RhdGVSZWNvZ25pemVyLFxuICAgIFByZXNzOiBQcmVzc1JlY29nbml6ZXIsXG5cbiAgICBvbjogYWRkRXZlbnRMaXN0ZW5lcnMsXG4gICAgb2ZmOiByZW1vdmVFdmVudExpc3RlbmVycyxcbiAgICBlYWNoOiBlYWNoLFxuICAgIG1lcmdlOiBtZXJnZSxcbiAgICBleHRlbmQ6IGV4dGVuZCxcbiAgICBhc3NpZ246IGFzc2lnbixcbiAgICBpbmhlcml0OiBpbmhlcml0LFxuICAgIGJpbmRGbjogYmluZEZuLFxuICAgIHByZWZpeGVkOiBwcmVmaXhlZFxufSk7XG5cbi8vIHRoaXMgcHJldmVudHMgZXJyb3JzIHdoZW4gSGFtbWVyIGlzIGxvYWRlZCBpbiB0aGUgcHJlc2VuY2Ugb2YgYW4gQU1EXG4vLyAgc3R5bGUgbG9hZGVyIGJ1dCBieSBzY3JpcHQgdGFnLCBub3QgYnkgdGhlIGxvYWRlci5cbnZhciBmcmVlR2xvYmFsID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyA/IHNlbGYgOiB7fSkpOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbmZyZWVHbG9iYWwuSGFtbWVyID0gSGFtbWVyO1xuXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gSGFtbWVyO1xuICAgIH0pO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBIYW1tZXI7XG59IGVsc2Uge1xuICAgIHdpbmRvd1tleHBvcnROYW1lXSA9IEhhbW1lcjtcbn1cblxufSkod2luZG93LCBkb2N1bWVudCwgJ0hhbW1lcicpO1xuIiwidmFyIHBvc3RHcmFwaGljc1RlbXBsYXRlID0gcmVxdWlyZSgnLi9wZy10ZW1wbGF0ZS9wb3N0R3JhcGhpY3NUZW1wbGF0ZS5qcycpO1xuXG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBBbGwgdXRpbGl0eSBmdW5jdGlvbnMgc2hvdWxkIGF0dGFjaCB0aGVtc2VsdmVzIHRvIHRoaXMgb2JqZWN0LlxuICAgIHZhciB1dGlsID0ge307XG5cbiAgICAvLyBUaGlzIGNvZGUgYXNzdW1lcyBpdCBpcyBydW5uaW5nIGluIGEgYnJvd3NlciBjb250ZXh0XG4gICAgd2luZG93LlRXUCA9IHdpbmRvdy5UV1AgfHwge1xuICAgICAgICBNb2R1bGU6IHt9XG4gICAgfTtcbiAgICB3aW5kb3cuVFdQLk1vZHVsZSA9IHdpbmRvdy5UV1AuTW9kdWxlIHx8IHt9O1xuICAgIHdpbmRvdy5UV1AuTW9kdWxlLnV0aWwgPSB1dGlsO1xuXG4gICAgaWYgKCF1dGlsLmdldFBhcmFtZXRlcnMgfHwgdHlwZW9mIHV0aWwuZ2V0UGFyYW1ldGVycyA9PT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICB1dGlsLmdldFBhcmFtZXRlcnMgPSBmdW5jdGlvbih1cmwpe1xuICAgICAgICAgICAgdmFyIHBhcmFtTGlzdCA9IFtdLFxuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHt9LFxuICAgICAgICAgICAgICAgIGt2UGFpcnMsXG4gICAgICAgICAgICAgICAgdG1wO1xuICAgICAgICAgICAgaWYgKHVybCkge1xuICAgICAgICAgICAgICAgIGlmICh1cmwuaW5kZXhPZignPycpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbUxpc3QgPSB1cmwuc3BsaXQoJz8nKVsxXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmFtTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmFtTGlzdC5pbmRleE9mKCcmJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrdlBhaXJzID0gcGFyYW1MaXN0LnNwbGl0KCcmJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGt2UGFpcnMgPSBbcGFyYW1MaXN0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGEgPSAwOyBhIDwga3ZQYWlycy5sZW5ndGg7IGErKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrdlBhaXJzW2FdLmluZGV4T2YoJz0nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG1wID0ga3ZQYWlyc1thXS5zcGxpdCgnPScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXNbdG1wWzBdXSA9IHVuZXNjYXBlKHRtcFsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIGhlaWdodCBvZiB0aGUgaWZyYW1lIGlmIHRoaXMgcGFnZSBpcyBpZnJhbWUnZC5cbiAgICAvLyBOT1RFOiBUaGlzICoqcmVxdWlyZXMqKiB0aGUgaWZyYW1lJ3Mgc3JjIHByb3BlcnR5IHRvIHVzZSBhIGxvY2F0aW9uXG4gICAgLy8gd2l0aG91dCBpdHMgcHJvdG9jb2wuIFVzaW5nIGEgcHJvdG9jb2wgd2lsbCBub3Qgd29yay5cbiAgICAvL1xuICAgIC8vIGUuZy4gPGlmcmFtZSBmcmFtZWJvcmRlcj1cIjBcIiBzY3JvbGxpbmc9XCJub1wiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDo2MDBweDtcIiBzcmM9XCIvL3d3dy53YXNoaW5ndG9ucG9zdC5jb20vZ3JhcGhpY3MvbmF0aW9uYWwvY2Vuc3VzLWNvbW11dGUtbWFwLz90ZW1wbGF0ZT1pZnJhbWVcIj48L2lmcmFtZT5cbiAgICB1dGlsLmNoYW5nZUlmcmFtZUhlaWdodCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vIExvY2F0aW9uICp3aXRob3V0KiBwcm90b2NvbCBhbmQgc2VhcmNoIHBhcmFtZXRlcnNcbiAgICAgICAgdmFyIHBhcnRpYWxMb2NhdGlvbiA9ICh3aW5kb3cubG9jYXRpb24ub3JpZ2luLnJlcGxhY2Uod2luZG93LmxvY2F0aW9uLnByb3RvY29sLCAnJykpICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuXG4gICAgICAgIC8vIEJ1aWxkIHVwIGEgc2VyaWVzIG9mIHBvc3NpYmxlIENTUyBzZWxlY3RvciBzdHJpbmdzXG4gICAgICAgIHZhciBzZWxlY3RvcnMgPSBbXTtcblxuICAgICAgICAvLyBBZGQgdGhlIFVSTCBhcyBpdCBpcyAoYWRkaW5nIGluIHRoZSBzZWFyY2ggcGFyYW1ldGVycylcbiAgICAgICAgc2VsZWN0b3JzLnB1c2goJ2lmcmFtZVtzcmM9XCInICsgcGFydGlhbExvY2F0aW9uICsgd2luZG93LmxvY2F0aW9uLnNlYXJjaCArICdcIl0nKTtcblxuICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lW3dpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5sZW5ndGggLSAxXSA9PT0gJy8nKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgVVJMIGhhcyBhIHRyYWlsaW5nIHNsYXNoLCBhZGQgYSB2ZXJzaW9uIHdpdGhvdXQgaXRcbiAgICAgICAgICAgIC8vIChhZGRpbmcgaW4gdGhlIHNlYXJjaCBwYXJhbWV0ZXJzKVxuICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2goJ2lmcmFtZVtzcmM9XCInICsgKHBhcnRpYWxMb2NhdGlvbi5zbGljZSgwLCAtMSkgKyB3aW5kb3cubG9jYXRpb24uc2VhcmNoKSArICdcIl0nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBVUkwgZG9lcyAqbm90KiBoYXZlIGEgdHJhaWxpbmcgc2xhc2gsIGFkZCBhIHZlcnNpb24gd2l0aFxuICAgICAgICAgICAgLy8gaXQgKGFkZGluZyBpbiB0aGUgc2VhcmNoIHBhcmFtZXRlcnMpXG4gICAgICAgICAgICBzZWxlY3RvcnMucHVzaCgnaWZyYW1lW3NyYz1cIicgKyBwYXJ0aWFsTG9jYXRpb24gKyAnLycgKyB3aW5kb3cubG9jYXRpb24uc2VhcmNoICsgJ1wiXScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2VhcmNoIGZvciB0aG9zZSBzZWxlY3RvcnMgaW4gdGhlIHBhcmVudCBwYWdlLCBhbmQgYWRqdXN0IHRoZSBoZWlnaHRcbiAgICAgICAgLy8gYWNjb3JkaW5nbHkuXG4gICAgICAgIHZhciAkaWZyYW1lID0gJCh3aW5kb3cudG9wLmRvY3VtZW50KS5maW5kKHNlbGVjdG9ycy5qb2luKCcsJykpO1xuICAgICAgICB2YXIgaCA9ICQoJ2JvZHknKS5vdXRlckhlaWdodCh0cnVlKTtcbiAgICAgICAgJGlmcmFtZS5jc3MoeydoZWlnaHQnIDogaCArICdweCd9KTtcbiAgICB9O1xuXG4gICAgLy8gZnJvbSBodHRwOi8vZGF2aWR3YWxzaC5uYW1lL2phdmFzY3JpcHQtZGVib3VuY2UtZnVuY3Rpb25cbiAgICB1dGlsLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgICAgIHZhciB0aW1lb3V0O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoIWltbWVkaWF0ZSkgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgICAgICAgIGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gaWZyYW1lIGNvZGVcbiAgICAgICAgdmFyIHBhcmFtcyA9IHV0aWwuZ2V0UGFyYW1ldGVycyhkb2N1bWVudC5VUkwpO1xuICAgICAgICBpZiAocGFyYW1zWyd0ZW1wbGF0ZSddICYmIHBhcmFtc1sndGVtcGxhdGUnXSA9PT0gJ2lmcmFtZScpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gV2h5IGRvIHdlIG5lZWQgdGhpcz8gTm9ib2R5IGtub3dzLlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5kb21haW4gPSAnd2FzaGluZ3RvbnBvc3QuY29tJztcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ2lmcmFtZScpLnNob3coKS5jc3MoJ2Rpc3BsYXknLCdibG9jaycpO1xuICAgICAgICAgICAgaWYgKHBhcmFtc1snZ3JhcGhpY19pZCddKXtcbiAgICAgICAgICAgICAgICAkKCcjJyArIHBhcmFtc1snZ3JhcGhpY19pZCddKS5zaWJsaW5ncygpLmhpZGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQoJyNwZ2NvbnRlbnQsIC5wZ0FydGljbGUnKS5zaWJsaW5ncygpLmhpZGUoKTtcblxuICAgICAgICAgICAgLy8gQ09SUyBsaW1pdGF0aW9uc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSB3aW5kb3cudG9wLmxvY2F0aW9uLmhvc3RuYW1lKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc2l6ZUlmcmFtZSA9IHV0aWwuZGVib3VuY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlsLmNoYW5nZUlmcmFtZUhlaWdodCgpO1xuICAgICAgICAgICAgICAgICAgICB9LCAyNTApO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlc3BvbnNpdmUgcGFydFxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIFdoeSAxMDAwbXM/IFRoaXMgaXMgbm90IHJlbGlhYmxlLlxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWwuY2hhbmdlSWZyYW1lSGVpZ2h0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDEwMDApO1xuXG4gICAgICAgICAgICAgICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgcmVzaXplSWZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG59LmNhbGwodGhpcykpO1xuIiwidmFyIEhhbW1lciA9IHJlcXVpcmUoJ2hhbW1lcmpzJyk7XG5cbihmdW5jdGlvbiAoJCwgd2luZG93LCB1bmRlZmluZWQpIHtcblxuICAgIC8qXG4gICAgICogZXh0ZW5kIGpRdWVyeSBmb3IgbmljZXIgc3ludGF4IGZvciByZW5kZXJpbmcgb3VyIG1lbnVzIGFuZCBsaXN0cy5cbiAgICAgKi9cbiAgICAvL3VwZGF0ZSA8bGk+cyBmcm9tIGpzb25cblxuICAgIHZhciBfX2lzSUUgPSAkKCdodG1sLmllJykubGVuZ3RoID8gdHJ1ZSA6IGZhbHNlO1xuXG5cbiAgICAkLmZuLmFwcGVuZExpbmtJdGVtcyA9IGZ1bmN0aW9uKGxpbmtzLCBzdXJyb3VuZGluZ1RhZykge1xuICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIHN1cnJvdW5kaW5nVGFnID0gc3Vycm91bmRpbmdUYWcgfHwgXCI8bGk+XCI7XG4gICAgICAgICQuZWFjaChsaW5rcywgZnVuY3Rpb24oaSwgbGluaykge1xuICAgICAgICAgICAgdmFyIGEgPSAkKFwiPGE+XCIpO1xuICAgICAgICAgICAgaWYgKGxpbmsudGl0bGUpIHsgYS50ZXh0KGxpbmsudGl0bGUpOyB9XG4gICAgICAgICAgICBpZiAobGluay5odG1sKSB7IGEuaHRtbChsaW5rLmh0bWwpOyB9XG4gICAgICAgICAgICBpZiAobGluay5ocmVmKSB7IGEuYXR0cihcImhyZWZcIiwgbGluay5ocmVmKTsgfVxuICAgICAgICAgICAgaWYgKGxpbmsuYXR0cikgeyBhLmF0dHIobGluay5hdHRyKTsgfVxuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoXG4gICAgICAgICAgICAgICAgJChzdXJyb3VuZGluZ1RhZykuYXBwZW5kKGEpLmFkZENsYXNzKGxpbmsuc2VsZWN0ZWQgPyBcInNlbGVjdGVkXCIgOiBcIlwiKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAkLmZuLnRyYWNrQ2xpY2sgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcztcbiAgICAgICAgZWxlbWVudC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGxpbmtuYW1lO1xuICAgICAgICAgICAgdmFyIGxpbmsgPSAkKHRoaXMpO1xuICAgICAgICAgICAgaWYgKCEhd2luZG93LnMgJiYgdHlwZW9mIHMuc2VuZERhdGFUb09tbml0dXJlID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBsaW5rbmFtZSA9IChcInBibmF2OlwiICsgdHlwZSArIFwiIC0gXCIgKyAgJC50cmltKGxpbmsudGV4dCgpKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBzLnNlbmREYXRhVG9PbW5pdHVyZShsaW5rbmFtZSwgJycsIHtcbiAgICAgICAgICAgICAgICAgICAgXCJjaGFubmVsXCI6IHMuY2hhbm5lbCxcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9wMjhcIjogbGlua25hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAkLmZuLnRyYWNrU2hhcmUgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIGVsZW1lbnQub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBsaW5rID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciB0eXBlID0gbGluay5hdHRyKFwiZGF0YS1zaGFyZS10eXBlXCIpO1xuICAgICAgICAgICAgaWYgKCEhd2luZG93LnMgJiYgdHlwZW9mIHMuc2VuZERhdGFUb09tbml0dXJlID09ICdmdW5jdGlvbicgJiYgdHlwZSkge1xuICAgICAgICAgICAgICAgIHMuc2VuZERhdGFUb09tbml0dXJlKCdzaGFyZS4nICsgdHlwZSwgJ2V2ZW50NicsIHsgZVZhcjI3OiB0eXBlIH0pOyBcbiAgICAgICAgICAgIH0gIFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgICQuZm4ubWFrZURyb3Bkb3duID0gZnVuY3Rpb24gKG1lbnVFbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBjbGlja0VsZW1lbnQgPSB0aGlzO1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgb3B0aW9ucy5kaXNhYmxlZCA9IGZhbHNlO1xuXG4gICAgICAgIC8vZGVmYXVsdCBiZWhhdmlvciBmb3IgZHJvcGRvd25cbiAgICAgICAgdmFyIGRvd24gPSBvcHRpb25zLmRvd24gfHwgZnVuY3Rpb24gKF9jbGlja0VsZW1lbnQsIF9tZW51RWxlbWVudCkge1xuICAgICAgICAgICAgbmF2LmNsb3NlRHJvcGRvd25zKCk7XG4gICAgICAgICAgICBfY2xpY2tFbGVtZW50LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgJChcIi5sZWFkZXJib2FyZFwiKS5hZGRDbGFzcyhcImhpZGVBZFwiKTtcbiAgICAgICAgICAgIHZhciB3aW5kb3dIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSA1MDtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5jc3MoXCJoZWlnaHRcIixcIlwiKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5jc3MoXCJoZWlnaHRcIiwgKHdpbmRvd0hlaWdodCA8PSBfbWVudUVsZW1lbnQuaGVpZ2h0KCkpID8gd2luZG93SGVpZ2h0IDogXCJhdXRvXCIpO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmNzcyhcIndpZHRoXCIsIF9jbGlja0VsZW1lbnQub3V0ZXJXaWR0aCgpICk7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuY3NzKFwibGVmdFwiLCBfY2xpY2tFbGVtZW50Lm9mZnNldCgpLmxlZnQgKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5zbGlkZURvd24oJ2Zhc3QnKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdXAgPSBvcHRpb25zLnVwIHx8IGZ1bmN0aW9uIChfY2xpY2tFbGVtZW50LCBfbWVudUVsZW1lbnQpIHtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5zbGlkZVVwKCdmYXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9jbGlja0VsZW1lbnQucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICAgICAgJChcIi5sZWFkZXJib2FyZFwiKS5yZW1vdmVDbGFzcyhcImhpZGVBZFwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNsaWNrRWxlbWVudC5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmKCAhb3B0aW9ucy5kaXNhYmxlZCApe1xuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIC8vZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAvL0FuZCBJIHVzZWQgdG8gdGhpbmsgaWU5IHdhcyBhIGdvb2QgYnJvd3Nlci4uLlxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0ID8gZXZlbnQucHJldmVudERlZmF1bHQoKSA6IGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpZiAobWVudUVsZW1lbnQuZmluZChcImxpXCIpLmxlbmd0aCA9PSAwKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBpZihjbGlja0VsZW1lbnQuaXMoXCIuYWN0aXZlXCIpKXtcbiAgICAgICAgICAgICAgICAgICAgdXAoY2xpY2tFbGVtZW50LCBtZW51RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZG93bihjbGlja0VsZW1lbnQsIG1lbnVFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvcHRpb25zLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYoIV9faXNJRSl7XG4gICAgICAgICAgICB2YXIgaGFtbWVydGltZSA9IG5ldyBIYW1tZXIoY2xpY2tFbGVtZW50WzBdLCB7IHByZXZlbnRfbW91c2VldmVudHM6IHRydWUgfSk7XG4gICAgICAgICAgICBoYW1tZXJ0aW1lLm9uKFwidGFwXCIsaGFuZGxlVGFwKTtcbn1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8vbW92ZSBoZWFkZXIgZmVhdHVyZSBvdXRzaWRlIG9mIHBiLWNvbnRhaW5lciwgc28gdGhhdCB0aGUgbWVudSBzbGlkaW5nIGFuaW1hdGlvbiBjYW4gd29ya1xuICAgIC8vIGlmKCAkKFwiI3BiLXJvb3QgLnBiLWYtcGFnZS1oZWFkZXItdjJcIikubGVuZ3RoICYmICgkKFwiI3BiLXJvb3QgLnBiLWYtcGFnZS1oZWFkZXItdjJcIikuc2libGluZ3MoXCIucGItZmVhdHVyZVwiKS5sZW5ndGggfHwgJChcIiNwYi1yb290IC5wYi1mLXBhZ2UtaGVhZGVyLXYyXCIpLnNpYmxpbmdzKFwiLnBiLWNvbnRhaW5lclwiKS5sZW5ndGgpICkge1xuICAgIC8vICAgICAoZnVuY3Rpb24gKCkge1xuICAgIC8vICAgICAgICAgdmFyICRoZWFkZXIgPSAkKFwiLnBiLWYtcGFnZS1oZWFkZXItdjJcIik7XG4gICAgLy8gICAgICAgICAkKFwiLnBiLWYtcGFnZS1oZWFkZXItdjIgc2NyaXB0XCIpLnJlbW92ZSgpO1xuICAgIC8vICAgICAgICAgJChcIiNwYi1yb290XCIpLmJlZm9yZSggJGhlYWRlciApO1xuICAgIC8vICAgICB9KCkpO1xuICAgIC8vIH1cblxuICAgIC8vbG9hZCB0aGUgYWQgYWZ0ZXIgdGhlIGhlYWRlciBoYXMgYmVlbiBtb3ZlZCwgc28gaXQgZG9lc24ndCBsb2FkIHR3aWNlLiBubyBjYWxsYmFjayBvbiBhZCBzY3JpcHRzLCBzbyBoYXZlIHRvIHNldCBhbiBpbnRlcnZhbCB0byBjaGVja1xuICAgIC8vIGlmKCAkKFwiI25hdi1hZDp2aXNpYmxlXCIpLmxlbmd0aCApe1xuICAgIC8vICAgICB2YXIgYWRJbnRlcnZhbFRpbWVvdXQgPSAxMDsgLy9vbmx5IHRyeSB0aGlzIGZvciBmaXZlIHNlY29uZHMsIG9yIGRlYWwgd2l0aCBpdFxuICAgIC8vICAgICB2YXIgYWRJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgLy8gICAgICAgICBpZiggdHlwZW9mKHBsYWNlQWQyKSAhPSBcInVuZGVmaW5lZFwiICl7XG4gICAgLy8gICAgICAgICAgICAgJChcIiN3cG5pX2FkaV84OHgzMVwiKS5hcHBlbmQocGxhY2VBZDIoY29tbWVyY2lhbE5vZGUsJzg4eDMxJyxmYWxzZSwnJykpOyAgICBcbiAgICAvLyAgICAgICAgICAgICBjbGVhckludGVydmFsKGFkSW50ZXJ2YWwpXG4gICAgLy8gICAgICAgICB9ICAgIFxuICAgIC8vICAgICAgICAgaWYgKGFkSW50ZXJ2YWxUaW1lb3V0ID09IDApIGNsZWFySW50ZXJ2YWwoYWRJbnRlcnZhbCk7XG4gICAgLy8gICAgICAgICBhZEludGVydmFsVGltZW91dC0tO1xuICAgIC8vICAgICB9LCA1MDApO1xuICAgIC8vIH1cblxuICAgIC8vYWRkIHRyYWNraW5nXG4gICAgLy8gJChcIiNzaXRlLW1lbnUgYVwiKS50cmFja0NsaWNrKFwibWFpblwiKTtcbiAgICAvLyAkKFwiI3NoYXJlLW1lbnUgYVwiKS50cmFja1NoYXJlKCk7XG5cbiAgICAvL2FjdGl2YXRlIGRyb3Bkb3duc1xuICAgICQoXCIjd3AtaGVhZGVyIC5uYXYtYnRuW2RhdGEtbWVudV1cIikuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwiZHJvcGRvd24tdHJpZ2dlclwiKTtcbiAgICAgICAgJCh0aGlzKS5tYWtlRHJvcGRvd24oICQoXCIjXCIgKyAkKHRoaXMpLmRhdGEoXCJtZW51XCIpICkgKTtcbiAgICB9KTtcblxuICAgIC8vYWN0aXZhdGUgc2l0ZSBtZW51IHdpdGggY3VzdG9tIGFjdGlvbnNcbiAgICAkKFwiI3NpdGUtbWVudS1idG5cIikubWFrZURyb3Bkb3duKCAkKFwiI3NpdGUtbWVudVwiKSwge1xuICAgICAgICBkb3duOiBmdW5jdGlvbihfY2xpY2tFbGVtZW50LCBfbWVudUVsZW1lbnQpe1xuICAgICAgICAgICAgbmF2LmNsb3NlRHJvcGRvd25zKCk7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuY3NzKFwiaGVpZ2h0XCIsIHdpbmRvdy5vdXRlckhlaWdodCAtIDUwKTtcbiAgICAgICAgICAgICQoXCJib2R5XCIpLmFkZENsYXNzKCAoJChcIiNwYi1yb290IC5wYi1mLXBhZ2UtaGVhZGVyLXYyXCIpLmxlbmd0aCkgPyBcImxlZnQtbWVudVwiIDogXCJsZWZ0LW1lbnUgbGVmdC1tZW51LXBiXCIgKTtcbiAgICAgICAgICAgIF9jbGlja0VsZW1lbnQuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICAkKCcucGJIZWFkZXInKS50b2dnbGVDbGFzcygnbm90LWZpeGVkJyk7XG4gICAgICAgIH0sXG4gICAgICAgIHVwOiBmdW5jdGlvbihfY2xpY2tFbGVtZW50LCBfbWVudUVsZW1lbnQpe1xuICAgICAgICAgICAgJChcImJvZHlcIikucmVtb3ZlQ2xhc3MoXCJsZWZ0LW1lbnVcIikucmVtb3ZlQ2xhc3MoXCJsZWZ0LW1lbnUtcGJcIik7XG4gICAgICAgICAgICBfY2xpY2tFbGVtZW50LnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgJCgnLnBiSGVhZGVyJykudG9nZ2xlQ2xhc3MoJ25vdC1maXhlZCcpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgaGFtbWVydGltZSA9IG5ldyBIYW1tZXIoIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2l0ZS1tZW51XCIpLCB7XG4gICAgICAgIGRyYWdMb2NrVG9BeGlzOiB0cnVlLFxuICAgICAgICBkcmFnQmxvY2tIb3Jpem9udGFsOiB0cnVlXG4gICAgfSk7XG5cbiAgICBoYW1tZXJ0aW1lLm9uKCBcImRyYWdsZWZ0IHN3aXBlbGVmdFwiLCBmdW5jdGlvbihldil7IFxuICAgICAgICBldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vZXYuZ2VzdHVyZS5wcmV2ZW50RGVmYXVsdCA/IGV2Lmdlc3R1cmUucHJldmVudERlZmF1bHQoKSA6IGV2Lmdlc3R1cmUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgZXYuZ2VzdHVyZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgaWYoIGV2Lmdlc3R1cmUuZGlyZWN0aW9uID09IFwibGVmdFwiICYmICQoXCJib2R5XCIpLmlzKFwiLmxlZnQtbWVudVwiKSApe1xuICAgICAgICAgICAgJChcIiNzaXRlLW1lbnUtYnRuXCIpLmNsaWNrKCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qIHNlYXJjaC1zcGVjaWZpYyBtYW5pcHVsYXRpb24gKi9cbiAgICAkKFwiLmlvcyAjbmF2LXNlYXJjaC1tb2JpbGUgaW5wdXRcIikuZm9jdXMoZnVuY3Rpb24oKXtcbiAgICAgICAgJChcImhlYWRlclwiKS5jc3MoXCJwb3NpdGlvblwiLFwiYWJzb2x1dGVcIikuY3NzKFwidG9wXCIsd2luZG93LnBhZ2VZT2Zmc2V0KTtcbiAgICB9KS5ibHVyKGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCJoZWFkZXJcIikuY3NzKFwicG9zaXRpb25cIixcImZpeGVkXCIpLmNzcyhcInRvcFwiLDApO1xuICAgIH0pO1xuXG4gICAgLy90cmlnZ2VyIHdpbmRvdyByZXNpemUgd2hlbiBtb2JpbGUga2V5Ym9hcmQgaGlkZXNcbiAgICAkKFwiI25hdi1zZWFyY2gtbW9iaWxlIGlucHV0XCIpLmJsdXIoZnVuY3Rpb24oKXtcbiAgICAgICAgJCggd2luZG93ICkucmVzaXplKCk7XG4gICAgfSk7XG5cbiAgICAkKGRvY3VtZW50KS5rZXl1cChmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIElmIHlvdSBwcmVzcyBFU0Mgd2hpbGUgaW4gdGhlIHNlYXJjaCBpbnB1dCwgeW91IHNob3VsZCByZW1vdmUgZm9jdXMgZnJvbSB0aGUgaW5wdXRcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PSAyNyAmJiAkKFwiI25hdi1zZWFyY2ggaW5wdXRbdHlwZT10ZXh0XVwiKS5pcyhcIjpmb2N1c1wiKSkge1xuICAgICAgICAgICAgJChcIiNuYXYtc2VhcmNoIGlucHV0W3R5cGU9dGV4dF1cIikuYmx1cigpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkKFwiI25hdi1zZWFyY2gsI25hdi1zZWFyY2gtbW9iaWxlXCIpLnN1Ym1pdChmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKCQodGhpcykuZmluZCgnaW5wdXRbdHlwZT10ZXh0XScpLnZhbCgpKSB7XG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgcy5zZW5kRGF0YVRvT21uaXR1cmUoJ1NlYXJjaCBTdWJtaXQnLCdldmVudDInLHsnZVZhcjM4JzokKHRoaXMpLmZpbmQoJ2lucHV0W3R5cGU9dGV4dF0nKS52YWwoKSwnZVZhcjEnOnMucGFnZU5hbWV9KTtcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge31cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKlxuICAgICAqIENMSUVOVCBTSURFIEFQSSBmb3IgQ1VTVE9NSVpJTkcgdGhlIEhFQURFUlxuICAgICAqL1xuXG4gICAgLy8gVGhlcmUgc2hvdWxkIG9ubHkgYmUgb25lIG5hdmlnYXRpb24gcGVyIHBhZ2UuIFNvIG91ciBuYXZpZ2F0aW9uIG9iamVjdCBpcyBhIHNpbmdsZXRvbi5cbiAgICAvLyBIZWF2eSBkZXBlbmRlbmN5IG9uIGpRdWVyeVxuICAgIHZhciBjb3JlID0gd2luZG93LndwX3BiID0gd2luZG93LndwX3BiIHx8IHt9O1xuICAgIHZhciBuYXYgPSBjb3JlLm5hdiA9IGNvcmUubmF2IHx8IHt9O1xuICAgIHZhciBkZXByZWNhdGVkID0gZnVuY3Rpb24gKCkge307XG5cbiAgICBuYXYuc2V0U2VhcmNoID0gbmF2LnNob3dUb3BNZW51ID0gbmF2LmhpZGVUb3BNZW51ID0gbmF2LnNob3dQcmltYXJ5TGlua3MgPVxuICAgIG5hdi5oaWRlUHJpbWFyeUxpbmtzID0gbmF2LnNob3dJblRoZU5ld3MgPSBuYXYuaGlkZUluVGhlTmV3cyA9IG5hdi5zaG93QWRTbHVnID1cbiAgICBuYXYuaGlkZUFkU2x1ZyA9IG5hdi5zaG93U2VjdGlvbk5hbWUgPSBuYXYuaGlkZVNlY3Rpb25OYW1lID1cbiAgICBuYXYuc2V0TWFpbk1lbnUgPSBuYXYuc2V0U2VjdGlvbk1lbnUgPSBuYXYuc2V0U2VjdGlvbk5hbWUgPSBkZXByZWNhdGVkO1xuXG4gICAgbmF2LnNob3dJZGVudGl0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbmF2LnJlbmRlcklkZW50aXR5KCk7XG4gICAgICAgIHNob3dJZGVudGl0eSA9IHRydWU7XG4gICAgfTtcblxuICAgIG5hdi5oaWRlSWRlbnRpdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoXCIjbmF2LXVzZXJcIikuaGlkZSgpO1xuICAgICAgICAkKFwibmF2LXNpZ24taW5cIikuaGlkZSgpO1xuICAgICAgICBzaG93SWRlbnRpdHkgPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgbmF2LnNob3dTZWFyY2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoXCIjbmF2LXNlYXJjaFwiKS5zaG93KCk7XG4gICAgfTtcblxuICAgIG5hdi5oaWRlU2VhcmNoID0gZnVuY3Rpb24gKCkgeyBcbiAgICAgICAgJChcIiNuYXYtc2VhcmNoXCIpLmhpZGUoKTsgXG4gICAgfTtcblxuICAgIG5hdi5zaG93U3Vic2NyaXB0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkKFwiI25hdi1zdWJzY3JpcHRpb25cIikuc2hvdygpO1xuICAgIH07XG5cbiAgICBuYXYuaGlkZVN1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uICgpIHsgXG4gICAgICAgICQoXCIjbmF2LXN1YnNjcmlwdGlvblwiKS5oaWRlKCk7IFxuICAgIH07XG4gICAgXG4gICAgdmFyIHNldE1lbnUgPSBmdW5jdGlvbiAoZWxlbSwgbWVudSkge1xuICAgICAgICB2YXIgZWxlbWVudCA9ICQoZWxlbSk7XG4gICAgICAgIGVsZW1lbnQuY2hpbGRyZW4oJ2xpJykucmVtb3ZlKCk7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kTGlua0l0ZW1zKG1lbnUpO1xuICAgIH07XG5cbiAgICBuYXYuc2V0SWRlbnRpdHlNZW51ID0gZnVuY3Rpb24gKG1lbnUpIHtcbiAgICAgICAgc2V0TWVudShcIiN1c2VyLW1lbnUgdWxcIiwgbWVudSk7XG4gICAgfTtcblxuICAgIG5hdi5zZXRQYWdlVGl0bGUgPSBmdW5jdGlvbihuYW1lKXtcbiAgICAgICAgJCgnI25hdi1wYWdlLXRpdGxlJykudGV4dChuYW1lKTtcbiAgICAgICAgJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3RpdGxlJywgbmFtZSk7XG4gICAgfTtcblxuICAgIG5hdi5zZXRTaGFyZVVybCA9IGZ1bmN0aW9uKHVybCl7XG4gICAgICAgICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCdwZXJtYWxpbmsnLHVybCk7XG4gICAgfTtcblxuICAgIG5hdi5zZXRUd2l0dGVySGFuZGxlID0gZnVuY3Rpb24oaGFuZGxlKXtcbiAgICAgICAgaWYoJCgnI3NoYXJlLW1lbnUgYVtkYXRhLXNoYXJlLXR5cGU9XCJUd2l0dGVyXCJdJykubGVuZ3RoKXtcbiAgICAgICAgICAgICQoJyNzaGFyZS1tZW51IGFbZGF0YS1zaGFyZS10eXBlPVwiVHdpdHRlclwiXScpLmRhdGEoJ3R3aXR0ZXItaGFuZGxlJywgaGFuZGxlKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBuYXYuY2xvc2VEcm9wZG93bnMgPSBmdW5jdGlvbigpe1xuICAgICAgICAkKFwiI3dwLWhlYWRlciAuZHJvcGRvd24tdHJpZ2dlci5hY3RpdmVcIikuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICQoXCIjXCIrJCh0aGlzKS5kYXRhKFwibWVudVwiKSkuaGlkZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgJChcIi5sZWFkZXJib2FyZFwiKS5yZW1vdmVDbGFzcyhcImhpZGVBZFwiKTtcbiAgICB9XG5cblxuICAgIHZhciBzY3JvbGxFdmVudHMgPSB7fSxcbiAgICAgICAgc2Nyb2xsUG9zID0gJCh0aGlzKS5zY3JvbGxUb3AoKTtcblxuICAgIHZhciBmb3JjZU9wZW4gPSAkKFwiI3dwLWhlYWRlclwiKS5pcyhcIi5zdGF5LW9wZW5cIik7XG5cbiAgICAkKHdpbmRvdykuc2Nyb2xsKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvKiBzaG93IGFuZCBoaWRlIG5hdiBvbiBzY3JvbGwgKi9cbiAgICAgICAgdmFyIGN1cnJlbnRQb3MgPSAkKHRoaXMpLnNjcm9sbFRvcCgpO1xuICAgICAgICBpZiAoIWZvcmNlT3BlbikgeyAgIFxuXG4gICAgICAgICAgICBpZiggKGN1cnJlbnRQb3MgKyAyMCkgPCBzY3JvbGxQb3MgfHwgY3VycmVudFBvcyA9PT0gMCApe1xuICAgICAgICAgICAgICAgIG5hdi5zaG93TmF2KCk7XG4gICAgICAgICAgICAgICAgc2Nyb2xsUG9zID0gY3VycmVudFBvcztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIChjdXJyZW50UG9zIC0gMjApID4gc2Nyb2xsUG9zICYmIGN1cnJlbnRQb3MgPiA1MCApe1xuICAgICAgICAgICAgICAgIG5hdi5oaWRlTmF2KCk7XG4gICAgICAgICAgICAgICAgc2Nyb2xsUG9zID0gY3VycmVudFBvcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qIGxpc3RlbiBmb3Igc2hvdy9oaWRlIHRpdGxlICovXG5cbiAgICAgICAgaWYgKHNjcm9sbEV2ZW50cy5sZW5ndGggPT0gMCkgcmV0dXJuO1xuXG4gICAgICAgIGZvciAodmFyIGkgaW4gc2Nyb2xsRXZlbnRzKSB7XG4gICAgICAgICAgICBpZiAoc2Nyb2xsRXZlbnRzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBjdXJyZW50UG9zID49IHNjcm9sbEV2ZW50c1tpXS50YXJnZXRQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxFdmVudHNbaV0uZG93bi5jYWxsKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50UG9zIDwgc2Nyb2xsRXZlbnRzW2ldLnRhcmdldFBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbEV2ZW50c1tpXS51cC5jYWxsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vcmVtb3ZlIHN0YW5kYXJkIGRyb3Bkb3duc1xuICAgICAgICBuYXYuY2xvc2VEcm9wZG93bnMoKTtcbiAgICAgICAgLy9yZXNpemUgc2l0ZSBtZW51LCBpZiBvcGVuXG4gICAgICAgIGlmKCQoXCJib2R5XCIpLmlzKFwiLmxlZnQtbWVudVwiKSl7XG4gICAgICAgICAgICAkKFwiI3NpdGUtbWVudVwiKS5jc3MoXCJoZWlnaHRcIiwgJCh3aW5kb3cpLmhlaWdodCgpIC0gNTApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBuYXYuc2hvd05hdiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmKCAkKFwiI3dwLWhlYWRlclwiKS5pcyhcIi5iYXItaGlkZGVuXCIpICl7XG4gICAgICAgICAgICAkKFwiI3dwLWhlYWRlclwiKS5yZW1vdmVDbGFzcyhcImJhci1oaWRkZW5cIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbmF2LmhpZGVOYXYgPSBmdW5jdGlvbigpe1xuICAgICAgICBpZiggISQoXCIjd3AtaGVhZGVyXCIpLmlzKFwiLmJhci1oaWRkZW5cIikgJiYgISQoXCIjd3AtaGVhZGVyIC5uYXYtYnRuLmFjdGl2ZVwiKS5sZW5ndGggKXtcbiAgICAgICAgICAgICQoXCIjd3AtaGVhZGVyXCIpLmFkZENsYXNzKFwiYmFyLWhpZGRlblwiKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBuYXYuc2hvd1RpdGxlT25TY3JvbGwgPSBmdW5jdGlvbigkdGFyZ2V0KXtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSAkdGFyZ2V0O1xuICAgICAgICBzY3JvbGxFdmVudHNbXCJ0aXRsZVNjcm9sbFwiXSA9IHtcbiAgICAgICAgICAgIHRhcmdldFBvc2l0aW9uOiBlbGVtZW50Lm9mZnNldCgpLnRvcCArIDUwLFxuICAgICAgICAgICAgZG93bjogZnVuY3Rpb24gKCkgeyBcbiAgICAgICAgICAgICAgICBpZiggISQoJyN3cC1oZWFkZXInKS5pcyhcIi50aXRsZS1tb2RlXCIpICl7XG4gICAgICAgICAgICAgICAgICAgICQoJyN3cC1oZWFkZXInKS5hZGRDbGFzcygndGl0bGUtbW9kZScpO1xuICAgICAgICAgICAgICAgICAgICAkKFwiI3dwLWhlYWRlciAubmF2LW1pZGRsZVwiKS5jc3MoIFwicGFkZGluZy1yaWdodFwiLCAgJChcIiN3cC1oZWFkZXIgLm5hdi1yaWdodFwiKS5vdXRlcldpZHRoKCkgKTtcbiAgICAgICAgICAgICAgICAgICAgbmF2LmNsb3NlRHJvcGRvd25zKCk7XG4gICAgICAgICAgICAgICAgfSAgIFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwOiBmdW5jdGlvbiAoKSB7IFxuICAgICAgICAgICAgICAgIGlmKCAkKCcjd3AtaGVhZGVyJykuaXMoXCIudGl0bGUtbW9kZVwiKSApe1xuICAgICAgICAgICAgICAgICAgICAkKCcjd3AtaGVhZGVyJykucmVtb3ZlQ2xhc3MoJ3RpdGxlLW1vZGUnKTsgXG4gICAgICAgICAgICAgICAgICAgIG5hdi5jbG9zZURyb3Bkb3ducygpO1xuICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgaWYgKCAkKCcjbmF2LXBhZ2UtdGl0bGVbZGF0YS1zaG93LW9uLXNjcm9sbD1cInRydWVcIl0nKS5sZW5ndGggKXtcbiAgICAgICAgdmFyICR0YXJnZXQgPSAoICQoXCIubmF2LXNjcm9sbC10YXJnZXRcIikubGVuZ3RoICkgPyAkKFwiLm5hdi1zY3JvbGwtdGFyZ2V0XCIpIDogJChcImgxLCBoMlwiKTtcbiAgICAgICAgaWYoICR0YXJnZXQubGVuZ3RoICkgbmF2LnNob3dUaXRsZU9uU2Nyb2xsKCAkdGFyZ2V0LmZpcnN0KCkgKTtcbiAgICB9XG4gICAgICAgIFxuICAgIG5hdi5yZW5kZXJTaGFyZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRzaGFyZSA9ICQoXCIjc2hhcmUtbWVudVwiKTtcbiAgICAgICAgJGZhY2Vib29rID0gJCgnYVtkYXRhLXNoYXJlLXR5cGU9XCJGYWNlYm9va1wiXScsICRzaGFyZSk7XG4gICAgICAgICR0d2l0dGVyID0gJCgnYVtkYXRhLXNoYXJlLXR5cGU9XCJUd2l0dGVyXCJdJywgJHNoYXJlKTtcbiAgICAgICAgJGxpbmtlZGluID0gJCgnYVtkYXRhLXNoYXJlLXR5cGU9XCJMaW5rZWRJblwiXScsICRzaGFyZSk7XG4gICAgICAgICRlbWFpbCA9ICQoJ2FbZGF0YS1zaGFyZS10eXBlPVwiRW1haWxcIl0nLCAkc2hhcmUpO1xuICAgICAgICAkcGludGVyZXN0ID0gJCgnYVtkYXRhLXNoYXJlLXR5cGU9XCJQaW50ZXJlc3RcIl0nLCAkc2hhcmUpO1xuXG4gICAgICAgIGlmICgkZmFjZWJvb2subGVuZ3RoKXtcbiAgICAgICAgICAgICRmYWNlYm9vay5jbGljayhmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyL3NoYXJlci5waHA/dT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgncGVybWFsaW5rJykgKSwnJywnd2lkdGg9NjU4LGhlaWdodD0zNTQsc2Nyb2xsYmFycz1ubycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCR0d2l0dGVyLmxlbmd0aCl7XG4gICAgICAgICAgICAkdHdpdHRlci5jbGljayhmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgdmFyIHR3aXR0ZXJIYW5kbGUgPSAoJCh0aGlzKS5kYXRhKFwidHdpdHRlci1oYW5kbGVcIikpID8gICQodGhpcykuZGF0YShcInR3aXR0ZXItaGFuZGxlXCIpLnJlcGxhY2UoXCJAXCIsXCJcIikgOiBcIndhc2hpbmd0b25wb3N0XCI7XG4gICAgICAgICAgICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vdHdpdHRlci5jb20vc2hhcmU/dXJsPScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCdwZXJtYWxpbmsnKSApICsgJyZ0ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCd0aXRsZScpICkgKyAnJnZpYT0nICsgdHdpdHRlckhhbmRsZSAsJycsJ3dpZHRoPTU1MCwgaGVpZ2h0PTM1MCwgc2Nyb2xsYmFycz1ubycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCRsaW5rZWRpbi5sZW5ndGgpe1xuICAgICAgICAgICAgJGxpbmtlZGluLmNsaWNrKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly93d3cubGlua2VkaW4uY29tL3NoYXJlQXJ0aWNsZT9taW5pPXRydWUmdXJsPScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCdwZXJtYWxpbmsnKSApICsgJyZ0aXRsZT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgndGl0bGUnKSApLCcnLCd3aWR0aD04MzAsaGVpZ2h0PTQ2MCxzY3JvbGxiYXJzPW5vJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJGVtYWlsLmxlbmd0aCl7XG4gICAgICAgICAgICAkZW1haWwuY2xpY2soZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgIHdpbmRvdy5vcGVuKCdtYWlsdG86P3N1YmplY3Q9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3RpdGxlJykgKSArICcgZnJvbSBUaGUgV2FzaGluZ3RvbiBQb3N0JmJvZHk9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3Blcm1hbGluaycpICksJycsJycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoJHBpbnRlcmVzdC5sZW5ndGgpe1xuICAgICAgICAgICAgJHBpbnRlcmVzdC5jbGljayhmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgICAgICAgICBlLnNldEF0dHJpYnV0ZSgndHlwZScsJ3RleHQvamF2YXNjcmlwdCcpO1xuICAgICAgICAgICAgICAgIGUuc2V0QXR0cmlidXRlKCdjaGFyc2V0JywnVVRGLTgnKTtcbiAgICAgICAgICAgICAgICBlLnNldEF0dHJpYnV0ZSgnc3JjJywnaHR0cHM6Ly9hc3NldHMucGludGVyZXN0LmNvbS9qcy9waW5tYXJrbGV0LmpzP3I9JyArIE1hdGgucmFuZG9tKCkqOTk5OTk5OTkpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIGlmKCAkKFwiI3NoYXJlLW1lbnVcIikubGVuZ3RoICl7XG4gICAgICAgIG5hdi5yZW5kZXJTaGFyZSgpO1xuICAgIH1cblxuICAgIHZhciBpZHA7IC8vcHJpdmF0ZSB2YXJpYWJsZS4gVGhlcmUgY2FuIGJlIG9ubHkgb25lIHByb3ZpZGVyLiBTbyB0aGlzIGlzIGEgc2luZ2xldG9uLlxuICAgIG5hdi5nZXRJZGVudGl0eVByb3ZpZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gaWRwO1xuICAgIH07XG4gICAgbmF2LnNldElkZW50aXR5UHJvdmlkZXIgPSBmdW5jdGlvbiAocHJvdmlkZXIpIHtcbiAgICAgICAgdmFyIGVmID0gZnVuY3Rpb24gKCkge307IC8vZW1wdHkgZnVuY3Rpb25cbiAgICAgICAgaWRwID0ge307XG4gICAgICAgIC8vIHdlJ2xsIHBhZCBhbnkgbWlzc2luZyBwb3J0aW9uIHdpdGggZW1wdHkgZnVuY3Rpb25cbiAgICAgICAgaWRwLm5hbWUgPSBwcm92aWRlci5uYW1lIHx8IFwiXCI7XG4gICAgICAgIGlkcC5nZXRVc2VySWQgPSBwcm92aWRlci5nZXRVc2VySWQgfHwgZWY7XG4gICAgICAgIGlkcC5nZXRVc2VyTWVudSA9IHByb3ZpZGVyLmdldFVzZXJNZW51IHx8IGVmO1xuICAgICAgICBpZHAuZ2V0U2lnbkluTGluayA9IHByb3ZpZGVyLmdldFNpZ25JbkxpbmsgfHwgZWY7XG4gICAgICAgIGlkcC5nZXRSZWdpc3RyYXRpb25MaW5rID0gcHJvdmlkZXIuZ2V0UmVnaXN0cmF0aW9uTGluayB8fCBlZjtcbiAgICAgICAgaWRwLmlzVXNlckxvZ2dlZEluID0gcHJvdmlkZXIuaXNVc2VyTG9nZ2VkSW4gfHwgZWY7XG4gICAgICAgIGlkcC5pc1VzZXJTdWJzY3JpYmVyID0gcHJvdmlkZXIuaXNVc2VyU3Vic2NyaWJlciB8fCBlZjtcbiAgICAgICAgXG4gICAgICAgIGlkcC5yZW5kZXIgPSBwcm92aWRlci5yZW5kZXIgfHwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGlkcC5pc1VzZXJMb2dnZWRJbigpKSB7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtdXNlciAudXNlcm5hbWVcIikudGV4dChpZHAuZ2V0VXNlcklkKCkpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXVzZXItbW9iaWxlIGFcIikudGV4dChpZHAuZ2V0VXNlcklkKCkpO1xuICAgICAgICAgICAgICAgIG5hdi5zZXRJZGVudGl0eU1lbnUoaWRwLmdldFVzZXJNZW51KCkpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXVzZXJcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtdXNlci1tb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtdXNlci1tb2JpbGUgYVwiKS5hdHRyKFwiaHJlZlwiLGlkcC5nZXRVc2VyTWVudSgpWzBdW1wiaHJlZlwiXSk7XG4gICAgICAgICAgICAgICAgaWYoIGlkcC5pc1VzZXJTdWJzY3JpYmVyKCkgPT09IFwiMFwiICl7XG4gICAgICAgICAgICAgICAgICAgICQoXCIjbmF2LXN1YnNjcmliZVwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICAgICAgJChcIiNuYXYtc3Vic2NyaWJlLW1vYmlsZVwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXNpZ24taW5cIikuYXR0cihcImhyZWZcIiwgaWRwLmdldFNpZ25JbkxpbmsoKStcIiZuaWQ9dG9wX3BiX3NpZ25pblwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi1zaWduLWluLW1vYmlsZVwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKS5maW5kKFwiYVwiKS5hdHRyKFwiaHJlZlwiLCBpZHAuZ2V0U2lnbkluTGluaygpK1wiJm5pZD10b3BfcGJfc2lnbmluXCIpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXN1YnNjcmliZVwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi1zdWJzY3JpYmUtbW9iaWxlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vbGV0J3MgcmVuZGVyXG4gICAgICAgIG5hdi5yZW5kZXJJZGVudGl0eSgpO1xuICAgIH07XG4gICAgbmF2LnJlbmRlcklkZW50aXR5ID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge307XG4gICAgICAgIGlmIChpZHApIHsgLy8gdGhlIHVzZXIgbWlnaHQgbm90IGhhdmUgY29uZmlndXJlZCBhbnkgaWRlbnRpdHkuIFNvIGNoZWNrIGZvciBpdC5cbiAgICAgICAgICAgIGlkcC5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhpZHApO1xuICAgIH07XG5cbiAgICAvKlxuICAgICAqIFVzaW5nIHRoZSBwcml2ZGVkIEFQSSwgc2V0IHVwIHRoZSBkZWZhdWx0IGlkZW50aXR5IHByb3ZpZGVyIGFzIFRXUFxuICAgICAqL1xuXG4gICAgLy8gaWYgdGhlIGlkZW50aXR5IGNvbXBvbmVudCB3ZXJlIHNldCBhcyBoaWRkZW4gZnJvbSBQYWdlQnVpbGRlciBhZG1pblxuICAgIC8vIHNldCBhIGZsYWcgc28gdGhhdCB3ZSBkb24ndCBwcm9jZXNzIGxvZ2luIGF0IGFsbFxuICAgIHZhciBzaG93SWRlbnRpdHkgPSAkKFwiI25hdi11c2VyXCIpLmRhdGEoXCJzaG93LWlkZW50aXR5XCIpO1xuXG4gICAgLy8gZGVmYXVsdCBJZGVudGl0eVxuICAgIHZhciBjdXJyZW50ID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoXCI/XCIpWzBdO1xuICAgIHZhciB0d3BJZGVudGl0eSA9IHtcbiAgICAgICAgbmFtZTogXCJUV1BcIixcbiAgICAgICAgZ2V0VXNlcklkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdXNlcm5hbWUgPSBUV1AuVXRpbC5Vc2VyLmdldFVzZXJOYW1lKCk7XG4gICAgICAgICAgICB2YXIgdXNlcmlkID0gVFdQLlV0aWwuVXNlci5nZXRVc2VySWQoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdXNlcm5hbWUgPT0gXCJzdHJpbmdcIiAmJiB1c2VybmFtZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJuYW1lO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlcmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBnZXRVc2VyTWVudTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICB7IFwidGl0bGVcIjogXCJQcm9maWxlXCIsIFwiaHJlZlwiOiBUV1Auc2lnbmluLnByb2ZpbGV1cmwgKyBjdXJyZW50ICsgJyZyZWZyZXNoPXRydWUnIH0sXG4gICAgICAgICAgICAgICAgeyBcInRpdGxlXCI6IFwiTG9nIG91dFwiLCBcImhyZWZcIjogVFdQLnNpZ25pbi5sb2dvdXR1cmxfcGFnZSB9XG4gICAgICAgICAgICBdO1xuICAgICAgICB9LFxuICAgICAgICBnZXRTaWduSW5MaW5rOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gVFdQLnNpZ25pbi5sb2dpbnVybF9wYWdlICsgY3VycmVudDtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0UmVnaXN0cmF0aW9uTGluazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFRXUC5zaWduaW4ucmVnaXN0cmF0aW9udXJsX3BhZ2UgKyBjdXJyZW50O1xuICAgICAgICB9LFxuICAgICAgICBpc1VzZXJTdWJzY3JpYmVyOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgIHN1YiA9IChkb2N1bWVudC5jb29raWUubWF0Y2goL3JwbHNiPShbMC05XSspLykpID8gUmVnRXhwLiQxIDogJyc7IFxuICAgICAgICAgICAgcmV0dXJuIHN1YjtcbiAgICAgICAgfSxcbiAgICAgICAgaXNVc2VyTG9nZ2VkSW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoVFdQLlV0aWwuVXNlcikgPyBUV1AuVXRpbC5Vc2VyLmdldEF1dGhlbnRpY2F0aW9uKCkgOiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBJZiB3ZSBhcmUgc2hvd2luZyBpZGVudGl0eSB0aGVuIHNldCB0aGUgZGVmYXVsdCBpZGVudGl0eSBwcm92aWRlciB0byBUV1AuXG4gICAgLy8gICBVc2VyIGNhbiBvdmVyaWRlIHRoaXMgd2hlbmV2ZXIgdGhleSB3YW50LlxuICAgIC8vXG4gICAgLy8gSW4gVFdQLCBpZGVudGl0eSB1c2VyIGludGVyZmFjZSBuZWVkcyB0byBwcm9jZXNzZWQgYWZ0ZXIgdGhlIGZhY3QgdGhhdCBhbGwgb3RoZXIgamF2YXNjcmlwdCBoYXMgYmVlbiBsb2FkZWQuXG4gICAgLy8gICBCdXQgdGhlIGpzIHJlc291cmNlcyBhcmUgbG9hZGVkIGFzeW5jaHJvbm91c2x5IGFuZCBpdCBkb2Vzbid0IGhhdmUgYW55IGNhbGxiYWNrcyBob29rcy4gU28gd2Ugd2F0Y2ggZm9yIGl0LlxuICAgIGlmIChzaG93SWRlbnRpdHkpIHtcbiAgICAgICAgLy90cnkgdG8gbG9hZCBUV1Agb25seSBpZiB3ZSBhcmUgc2hvd2luZyBJZGVudGl0eS5cbiAgICAgICAgdmFyIGluaXQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgKGZ1bmN0aW9uIGNoZWNrVFdQKCkge1xuICAgICAgICAgICAgLy8gaWYgdGhlcmUncyBhbHJlYWR5IGlkcCBzZXQsIHRoZW4gZG9uJ3QgdHJ5IHRvIGxvYWQgVFdQLlxuICAgICAgICAgICAgaWYgKCFuYXYuZ2V0SWRlbnRpdHlQcm92aWRlcigpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFRXUCAmJiBUV1Auc2lnbmluICYmIFRXUC5VdGlsKSB7IC8vIG1ha2Ugc3VyZSBUV1AgaGFzIGJlZW4gbG9hZGVkLlxuICAgICAgICAgICAgICAgICAgICBuYXYuc2V0SWRlbnRpdHlQcm92aWRlcih0d3BJZGVudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIG5hdi5yZW5kZXJJZGVudGl0eSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWZ0ZXIgMyBzZWNvbmRzLCBpZiBUV1AgaW5kZW50aXR5IGhhc24ndCBiZWVuIGxvYWRlZC4gTGV0J3MganVzdCBzdG9wLlxuICAgICAgICAgICAgICAgICAgICBpZiAobm93IC0gaW5pdCA8IDMgKiAxMDAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiBpdCBoYXNuJ3QgYmVlbiBsb2FkZWQsIHdlIHdhaXQgZmV3IG1pbGxpc2Vjb25kcyBhbmQgdHJ5IGFnYWluLlxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBjaGVja1RXUCgpOyB9LCAyMDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KCkpO1xuICAgIH1cblxuICAgIC8qIGhhbW1lci5qcyB0YXAgKi9cblxuICAgIGZ1bmN0aW9uIGhhbmRsZVRhcChldikge1xuICAgICAgICBldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vZXYuZ2VzdHVyZS5wcmV2ZW50RGVmYXVsdCA/IGV2Lmdlc3R1cmUucHJldmVudERlZmF1bHQoKSA6IGV2Lmdlc3R1cmUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgZXYuZ2VzdHVyZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgJChldi5nZXN0dXJlLnRhcmdldCkuY2xpY2soKTtcbiAgICB9XG5cbiAgICAvKiBhL2IgdGVzdCBhbmQgdGFyZ2V0ICovXG4gICAgLy8gJCh3aW5kb3cuZG9jdW1lbnQpLm9uKCdhYnRlc3QtcmVhZHknLCBmdW5jdGlvbihlLCBBQlQpIHtcblxuICAgIC8vICAgICBpZiAoICFzdXBwb3J0ZWRDbGllbnQoKSApIHtcbiAgICAvLyAgICAgICAgIHJldHVybjtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIGFwcGx5VmFyaWFudEV4cGVyaWVuY2UoJ21hc3RIZWFkMicsICdsb2dvTGFyZ2UnKTtcblxuICAgIC8vICAgICBmdW5jdGlvbiBhcHBseVZhcmlhbnRFeHBlcmllbmNlKGZlYXR1cmVOYW1lLCB2YXJpYW50TmFtZSkge1xuICAgIC8vICAgICAgICAgdmFyIGZ0ciA9IEFCVC5nZXQoZmVhdHVyZU5hbWUpO1xuICAgIC8vICAgICAgICAgdmFyIHRyayA9IGZ0ci5pcyh2YXJpYW50TmFtZSk7XG4gICAgICAgICAgICBcbiAgICAvLyAgICAgICAgIHZhciAkdGFyZ2V0ID0gJCgnaGVhZGVyLmFidC1ub3QtbG9hZGVkLCAjd3AtdG9wcGVyLCAucGItZi1wYWdlLWhlYWRlci12MiwgYm9keScpO1xuICAgIC8vICAgICAgICAgJHRhcmdldC5yZW1vdmVDbGFzcyggJ2FidC1ub3QtbG9hZGVkJyApO1xuICAgIC8vICAgICAgICAgJHRhcmdldC5hZGRDbGFzcyggJ2FidC0nICsgZmVhdHVyZU5hbWUgKyAnLScgKyB2YXJpYW50TmFtZSArICctJyArIHRyayApO1xuXG4gICAgLy8gICAgICAgICB2YXIgZmQgPSBtb21lbnQoKS5mb3JtYXQoJ2RkZGQsIExMJyk7XG5cbiAgICAvLyAgICAgICAgICQoJyN3cC10b3BwZXIgLnRvcC10aW1lc3RhbXAnKS50ZXh0KGZkKTtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIGZ1bmN0aW9uIHN1cHBvcnRlZENsaWVudCgpIHtcblxuICAgIC8vICAgICAgICAgcmV0dXJuICQoJ2h0bWwuZGVza3RvcCcpLmxlbmd0aCA+IDAgJiYgJCgnaGVhZGVyLmRhcmsnKS5sZW5ndGggPT0gMDtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0pO1xuXG59KGpRdWVyeSwgd2luZG93KSk7XG5cbiIsIi8vVG9wIFNoYXJlIEJhciBKUyAtIHN0b2xlbiBzdHJhaWdodCBmcm9tIFxuKGZ1bmN0aW9uKCQpe1xuXG4gICB2YXIgc29jaWFsVG9vbHMgPSB7XG4gICAgICAgIG15Um9vdCA6ICcudG9wLXNoYXJlYmFyLXdyYXBwZXInLFxuXG4gICAgICAgIGluaXQ6ZnVuY3Rpb24gKG15Um9vdCkge1xuICAgICAgICAgICAgbXlSb290ID0gbXlSb290IHx8IHRoaXMubXlSb290O1xuICAgICAgICAgICAgJChteVJvb3QpLmVhY2goZnVuY3Rpb24oaW5kZXgsIG15Um9vdEVsZW1lbnQpe1xuICAgICAgICAgICAgICAgIG15Um9vdEVsZW1lbnQucG9zdFNoYXJlID0gbmV3IHBvc3RTaGFyZSgpO1xuICAgICAgICAgICAgICAgIG15Um9vdEVsZW1lbnQucG9zdFNoYXJlLmluaXQoJChteVJvb3RFbGVtZW50KSwgJChteVJvb3RFbGVtZW50KS5kYXRhKCdwb3N0c2hhcmUnKSk7XG4gICAgICAgICAgICAgICAgdmFyICRyb290ID0gJChteVJvb3RFbGVtZW50KSwgXG4gICAgICAgICAgICAgICAgICAgICRpbmRpdmlkdWFsVG9vbCA9ICQoJy50b29sOm5vdCgubW9yZSknLCRyb290KSxcbiAgICAgICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzV3JhcHBlciA9ICQoJy5zb2NpYWwtdG9vbHMtd3JhcHBlcicsJHJvb3QpLFxuICAgICAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNNb3JlQnRuID0gJCgnLnRvb2wubW9yZScsJHNvY2lhbFRvb2xzV3JhcHBlciksXG4gICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc0FkZGl0aW9uYWwgPSAkKCcuc29jaWFsLXRvb2xzLWFkZGl0aW9uYWwnLCRyb290KSxcbiAgICAgICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzVXRpbGl0eSA9ICQoJy51dGlsaXR5LXRvb2xzLXdyYXBwZXInLCRyb290KSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSAod2luZG93LmlubmVyV2lkdGggPiAwKSA/IHdpbmRvdy5pbm5lcldpZHRoIDogc2NyZWVuLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICBpc01vYmlsZSA9IChtb2JpbGVfYnJvd3NlciA9PT0gMSAmJiB3aWR0aCA8IDQ4MCkgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IHsnb21uaXR1cmVFdmVudCcgOiAnZXZlbnQ2J307ICAgICAgICAgIFxuICAgIFxuICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc01vcmVCdG4ub2ZmKCdjbGljaycpLm9uKCdjbGljaycsdGhpcyxmdW5jdGlvbihldil7ICBcbiAgICAgICAgICAgICAgICAgICAgaWYoaXNNb2JpbGUpeyRzb2NpYWxUb29sc1V0aWxpdHkuaGlkZSgnZmFzdCcpO307ICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzTW9yZUJ0bi5oaWRlKCdmYXN0Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNBZGRpdGlvbmFsLnNob3coJ2Zhc3QnLGZ1bmN0aW9uKGV2KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcudG9vbCcsJHNvY2lhbFRvb2xzV3JhcHBlcikuYW5pbWF0ZSh7XCJ3aWR0aFwiOjQwfSwyNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290LmFkZENsYXNzKFwiZXhwYW5kZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLnNvY2lhbC10b29scycsJHNvY2lhbFRvb2xzQWRkaXRpb25hbCkuYW5pbWF0ZSh7XCJtYXJnaW4tbGVmdFwiOjB9LDI1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoaXNNb2JpbGUpeyRzb2NpYWxUb29sc1V0aWxpdHkuc2hvdygnc2xvdycpO307ICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pOy8vZW5kIGFkZHRsIHNob3dcbiAgICAgICAgICAgICAgICB9KTsvL2VuZCBtb3JlIGNsaWNrIFxuICAgICAgICAgICAgICAgICRpbmRpdmlkdWFsVG9vbC5iaW5kKHtcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5zZW5kRGF0YVRvT21uaXR1cmUgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNoYXJlVHlwZSA9ICQodGhpcykuYXR0cignY2xhc3MnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFyZVR5cGUgPSAodHlwZW9mIHNoYXJlVHlwZSAhPSAndW5kZWZpbmVkJyk/c2hhcmVUeXBlLnNwbGl0KFwiIFwiKVswXS50cmltKCk6Jyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9tbml0dXJlVmFycyA9ICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVWYXIxXCI6KHR5cGVvZiB3aW5kb3cucyA9PSAnb2JqZWN0JykgJiYgcyAmJiBzLmVWYXIxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlVmFyMlwiOih0eXBlb2Ygd2luZG93LnMgPT0gJ29iamVjdCcpICYmIHMgJiYgcy5lVmFyMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZVZhcjhcIjoodHlwZW9mIHdpbmRvdy5zID09ICdvYmplY3QnKSAmJiBzICYmIHMuZVZhcjgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVWYXIxN1wiOih0eXBlb2Ygd2luZG93LnMgPT0gJ29iamVjdCcpICYmIHMgJiYgcy5lVmFyMTcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVWYXIyN1wiOicnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9tbml0dXJlVmFycy5lVmFyMjcgPSBzaGFyZVR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV2ZW50TmFtZSA9IGNvbmZpZy5vbW5pdHVyZUV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbmREYXRhVG9PbW5pdHVyZSgnc2hhcmUuJyArIHNoYXJlVHlwZSxldmVudE5hbWUsb21uaXR1cmVWYXJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKXt9ICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgIH1cbiAgICB9OyAgIFxuXG4gICB2YXIgdGV4dFJlc2l6ZXIgPSB7XG4gICAgICAgIGN1cnJJbmNyZW1lbnRNYXg6NCxcbiAgICAgICAgY3VyckluY3JlbWVudFVuaXQ6MixcbiAgICAgICAgY3VyckluY3JlbWVudEluZGV4OjAsXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uIChteVJvb3QscmVzaXplYWJsZUVsZW1lbnRMaXN0LGNsaWNrRWxlbWVudCkge1xuICAgICAgICAgICAgbXlSb290ID0gbXlSb290IHx8ICcjYXJ0aWNsZS1ib2R5IGFydGljbGUsIC5yZWxhdGVkLXN0b3J5JztcbiAgICAgICAgICAgIHJlc2l6ZWFibGVFbGVtZW50TGlzdCA9IHJlc2l6ZWFibGVFbGVtZW50TGlzdCB8fCAncCwgbGknO1xuICAgICAgICAgICAgY2xpY2tFbGVtZW50ID0gY2xpY2tFbGVtZW50IHx8ICcudG9vbC50ZXh0cmVzaXplcic7XG4gICAgICAgICAgICB0aGlzLnJvb3QgPSAkKG15Um9vdCk7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZWFibGVFbGVtZW50cyA9ICQocmVzaXplYWJsZUVsZW1lbnRMaXN0LCB0aGlzLnJvb3QpO1xuXG4gICAgICAgICAgICAvLyBhZGQgXCJOZXh0IHVwXCIgbGFibGUgdG8gdGhlIHJlc2l6YWJsZSBlbGVtZW50J3MgbGlzdFxuICAgICAgICAgICAgaWYoJChcIi5yZWxhdGVkLXN0b3J5XCIpLnByZXYoJ2gzJykubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVhYmxlRWxlbWVudHMucHVzaCgkKCcucmVsYXRlZC1zdG9yeScpLnByZXYoJ2gzJykpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplYWJsZUVsZW1lbnRzLnB1c2goJCgnLnJlbGF0ZWQtc3RvcnkgaDQgYScpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQoY2xpY2tFbGVtZW50KS51bmJpbmQoJ2NsaWNrJykub24oJ2NsaWNrJyx0aGlzLHRoaXMucmVzaXplKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVzaXplOiBmdW5jdGlvbiAoZXZlbnQpIHsgIFxuICAgICAgICAgICAgdmFyIGN1cnJPYmogPSBldmVudC5kYXRhO1xuICAgICAgICAgICAgaWYgKGN1cnJPYmouY3VyckluY3JlbWVudEluZGV4ID09IGN1cnJPYmouY3VyckluY3JlbWVudE1heCkge1xuICAgICAgICAgICAgICAgIGN1cnJPYmouY3VyckluY3JlbWVudEluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICBjdXJyT2JqLmN1cnJJbmNyZW1lbnRVbml0ID0gKGN1cnJPYmouY3VyckluY3JlbWVudFVuaXQgPT0gMik/LTI6MjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJPYmouY3VyckluY3JlbWVudEluZGV4ID0gY3Vyck9iai5jdXJySW5jcmVtZW50SW5kZXggKyAxO1xuICAgICAgICAgICAgY3Vyck9iai5yZXNpemVhYmxlRWxlbWVudHMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGVsbSA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgY3VyclNpemU9IHBhcnNlRmxvYXQoZWxtLmNzcygnZm9udC1zaXplJyksNSk7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGN1cnJTaXplICsgY3Vyck9iai5jdXJySW5jcmVtZW50VW5pdDtcbiAgICAgICAgICAgICAgICBlbG0uY3NzKCdmb250LXNpemUnLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIHdwX3BiLnJlcG9ydCgndGV4dHJlc2l6ZXInLCAncmVzaXplZCcsIHJlc3VsdCk7XG4gICAgICAgICAgICB9KTsgXG5cbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICB9O1xudmFyIG1vYmlsZV9icm93c2VyID0gbW9iaWxlX2Jyb3dzZXIgJiYgbW9iaWxlX2Jyb3dzZXIgPT09IDEgPyAxIDogMDtcbiAgIFxuICAgdmFyIHBvc3RTaGFyZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKHJvb3RFbGVtZW50LCBwb3N0U2hhcmVUeXBlcykge1xuICAgICAgICAgICBpZiAocG9zdFNoYXJlVHlwZXMpIHtcbiAgICAgICAgICAgICAgIHBvc3RTaGFyZVR5cGVzLnNwbGl0KFwiLFwiKS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsIGluZGV4KXtcbiAgICAgICAgICAgICAgICAgICB2YXIgcG9zdFNoYXJlVXJsID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhvc3QuaW5kZXhPZignd2FzaGluZ3RvbnBvc3QuY29tJykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICBwb3N0U2hhcmVVcmwgPSAnaHR0cDovL3Bvc3RzaGFyZS53YXNoaW5ndG9ucG9zdC5jb20nOyAvL3Byb2R1Y3Rpb24gb25seVxuICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAod2luZG93LmxvY2F0aW9uLmhvc3QuaW5kZXhPZigncGItc3RhZ2luZy5kaWdpdGFsaW5rLmNvbScpID49IDAgfHwgd2luZG93LmxvY2F0aW9uLmhvc3QuaW5kZXhPZigncGItc3RhZ2luZy53cHByaXZhdGUuY29tJykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICBwb3N0U2hhcmVVcmwgPSAnaHR0cDovL3Bvc3RzaGFyZS1zdGFnZS53cHByaXZhdGUuY29tJzsgLy90ZXN0aW5nIHBiLXN0YWdpbmdcbiAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICBwb3N0U2hhcmVVcmwgPSAnaHR0cDovL3Bvc3RzaGFyZS1kZXYud3Bwcml2YXRlLmNvbSc7IC8vdGVzdGluZyBwYi1kZXZcbiAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgdmFyIHByZVRpbWVzdGFtcCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgdmFyIHByZUJ1c2luZXNzS2V5ID0gd3BfcGIuU3RhdGljTWV0aG9kcy5nZXRVbmlxdWVLZXkoMTAwMCwgbnVsbCwgcHJlVGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgICAgICB2YXIgb2JqZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICBzaGFyZVR5cGUgOiBlbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXAgOiBwcmVUaW1lc3RhbXAsXG4gICAgICAgICAgICAgICAgICAgICAgIGJ1c2luZXNzS2V5IDogcHJlQnVzaW5lc3NLZXksXG4gICAgICAgICAgICAgICAgICAgICAgIHNoYXJlVXJsIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgdGlueVVybCA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZFBvc3RTaGFyZSA6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICBjbGllbnRVdWlkIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgcG9zdFNoYXJlVXJsIDogcG9zdFNoYXJlVXJsLFxuICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgY2FsbFBvc3RTaGFyZSA6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNhbGxlZFBvc3RTaGFyZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogX3RoaXMucG9zdFNoYXJlVXJsK1wiL2FwaS9iay9cIitfdGhpcy5idXNpbmVzc0tleStcIi9cIitfdGhpcy5jbGllbnRVdWlkK1wiL1wiK190aGlzLnNoYXJlVHlwZStcIi9cIitfdGhpcy50aW1lc3RhbXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luYzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmNhbGxlZFBvc3RTaGFyZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxsZWRQb3N0U2hhcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgc2hhcmUgOiBmdW5jdGlvbiAoc29jaWFsVXJsLCBzb2NpYWxVcmwyLCBzdHlsZSwgY2FsbGJhY2tDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnRpbnlVcmwgfHwgdGhpcy50aW55VXJsLmxlbmd0aCA9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IFwiaHR0cDovL3Rpbnl1cmwud2FzaGluZ3RvbnBvc3QuY29tL2NyZWF0ZS5qc29ucFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luYzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogX3RoaXMuc2hhcmVVcmwgKyBcIj9wb3N0c2hhcmU9XCIrX3RoaXMuYnVzaW5lc3NLZXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcm9zc0RvbWFpbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy50aW55VXJsID0gZGF0YS50aW55VXJsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tDb250ZXh0Lm9wZW5XaW5kb3coc29jaWFsVXJsK190aGlzLnRpbnlVcmwrc29jaWFsVXJsMixfdGhpcy5zaGFyZVR5cGUsc3R5bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhyb3cgXCJQb3N0U2hhcmUgZmFpbGVkOiB0aW55VXJsXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDIwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja0NvbnRleHQub3BlbldpbmRvdyhzb2NpYWxVcmwrX3RoaXMudGlueVVybCtzb2NpYWxVcmwyLF90aGlzLnNoYXJlVHlwZSxzdHlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICQocm9vdEVsZW1lbnQuZmluZCgnLicrZWxlbWVudClbMF0pLnBhcmVudCgpWzBdLnBvc3RTaGFyZSA9ICQocm9vdEVsZW1lbnQpWzBdLnBvc3RTaGFyZTtcbiAgICAgICAgICAgICAgICAgICAkKHJvb3RFbGVtZW50LmZpbmQoJy4nK2VsZW1lbnQpWzBdKS5wYXJlbnQoKVswXS5wb3N0U2hhcmVPYmplY3QgPSBvYmplY3Q7XG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfVxuICAgICAgIH0sXG4gICAgICAgXG4gICAgICAgdGhpcy5jYWxsUG9zdFNoYXJlID0gZnVuY3Rpb24gKGVsZW1lbnQsIGVsZW1lbnRPYmplY3QsIHNvY2lhbFVybCwgc2hhcmVVcmxMb25nLCBzb2NpYWxVcmwyLCBzdHlsZSkge1xuICAgICAgICAgICBpZihlbGVtZW50ICYmIGVsZW1lbnRPYmplY3QgJiYgc29jaWFsVXJsICYmIHNoYXJlVXJsTG9uZykge1xuICAgICAgICAgICAgICAgIHZhciBzaGFyZVR5cGUgPSAkKGVsZW1lbnQpLmNoaWxkcmVuKCkuYXR0cignY2xhc3MnKTtcbiAgICAgICAgICAgICAgICBzaGFyZVR5cGUgPSAodHlwZW9mIHNoYXJlVHlwZSAhPSAndW5kZWZpbmVkJyk/c2hhcmVUeXBlLnNwbGl0KFwiIFwiKVswXS50cmltKCk6Jyc7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYoIXNvY2lhbFVybDIpIHtcbiAgICAgICAgICAgICAgICAgICAgc29jaWFsVXJsMiA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBjbGllbnRVdWlkID0gJC5jb29raWUoXCJ3YXBvX2xvZ2luX2lkXCIpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsZW1lbnRPYmplY3QuY2xpZW50VXVpZCA9IGNsaWVudFV1aWQ7XG4gICAgICAgICAgICAgICAgaWYgKGNsaWVudFV1aWQgJiYgY2xpZW50VXVpZC5sZW5ndGggPiAwICYmIHNoYXJlVHlwZSAmJiBzaGFyZVR5cGUubGVuZ3RoID4gMCAmJiBlbGVtZW50T2JqZWN0LnNoYXJlVHlwZSAmJiBzaGFyZVR5cGUudHJpbSgpID09IGVsZW1lbnRPYmplY3Quc2hhcmVUeXBlLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50T2JqZWN0LnNoYXJlVXJsID0gc2hhcmVVcmxMb25nO1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50T2JqZWN0LmNhbGxQb3N0U2hhcmUoKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudE9iamVjdC5zaGFyZShzb2NpYWxVcmwsIHNvY2lhbFVybDIsIHN0eWxlLCBlbGVtZW50LnBvc3RTaGFyZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJQb3N0U2hhcmUgZmFpbGVkOiBubyBsb2dnZWQgaW4gVXNlciBvciB3cm9uZyBTaGFyZXR5cGVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5wYXJlbnQoKVswXS5wb3N0U2hhcmVPYmplY3QgPSBlbGVtZW50T2JqZWN0O1xuICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgdGhyb3cgXCJQb3N0U2hhcmUgZmFpbGVkOiBEYXRhIG1pc3NpbmdcIjtcbiAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgIFxuICAgICAgICB0aGlzLm9wZW5XaW5kb3cgPSBmdW5jdGlvbih1cmwsIG5hbWUsIHN0eWxlKXtcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKHVybCwnc2hhcmVfJytuYW1lLHN0eWxlKTtcbiAgICAgICAgfVxuICAgfTtcbiAgIFxuICAgd2luZG93LlRXUCA9IHdpbmRvdy5UV1AgfHwge307XG4gICBUV1AuU29jaWFsVG9vbHMgPSBUV1AuU29jaWFsVG9vbHMgfHwgc29jaWFsVG9vbHM7XG4gICBUV1AuVGV4dFJlc2l6ZXIgPSBUV1AuVGV4dFJlc2l6ZXIgfHwgdGV4dFJlc2l6ZXI7XG5cbiAgIFRXUC5UZXh0UmVzaXplci5pbml0KCk7XG4gICBUV1AuU29jaWFsVG9vbHMuaW5pdCgpO1xuXG5cbiAgIC8qXG4gICAgICogUE9QT1VUIGNvZGUgZm9yIGxhdGVyIHZhciAkYXJ0aWNsZSA9ICQoJyNhcnRpY2xlLXRvcHBlcicpOyAvLyBTVEFSVDpcbiAgICAgKiBTb2NpYWwgc2hhcmUgcG9wLW91dCB2YXIgJHNvY2lhbFRvb2xzTW9yZUJ0biA9ICQoJy5zb2NpYWwtdG9vbHNcbiAgICAgKiAubW9yZScsJGFydGljbGUpLCAkc29jaWFsVG9vbHNQb3BPdXQgPVxuICAgICAqICQoJy5zb2NpYWwtdG9vbHMucG9wLW91dCcsJGFydGljbGUpIDtcbiAgICAgKiAkc29jaWFsVG9vbHNNb3JlQnRuLm9uKCdjbGljaycsZnVuY3Rpb24oZXYpeyB2YXIgdGFyZ2V0VG9wID1cbiAgICAgKiAkc29jaWFsVG9vbHNNb3JlQnRuLnBvc2l0aW9uKCkudG9wICtcbiAgICAgKiAkc29jaWFsVG9vbHNNb3JlQnRuLm91dGVySGVpZ2h0KCktMS0xNDsgdmFyIHRhcmdldExlZnQgPVxuICAgICAqICRzb2NpYWxUb29sc01vcmVCdG4ucG9zaXRpb24oKS5sZWZ0LTEtMztcbiAgICAgKiAkc29jaWFsVG9vbHNQb3BPdXQuY3NzKHtcInRvcFwiOnRhcmdldFRvcCxcImxlZnRcIjp0YXJnZXRMZWZ0fSk7XG4gICAgICogJHNvY2lhbFRvb2xzUG9wT3V0LnRvZ2dsZSgpOyB9KTtcbiAgICAgKiAkc29jaWFsVG9vbHNQb3BPdXQub24oJ21vdXNlb3V0JyxmdW5jdGlvbihldil7XG4gICAgICogJHNvY2lhbFRvb2xzUG9wT3V0LnRvZ2dsZSgpOyB9KTsgLy8gRU5EOiBTb2NpYWwgc2hhcmUgcG9wLW91dFxuICAgICAqL1xufSkoalF1ZXJ5KTsiLCJ2YXIgaWZyYW1lID0gcmVxdWlyZSgnLi9pZnJhbWUuanMnKTtcbnZhciB0d2l0dGVyRm9sbG93QnV0dG9uTW9kdWxlcyA9IHJlcXVpcmUoJy4vdHdpdHRlci1mb2xsb3cuanMnKTtcbnZhciBwYkhlYWRlck1vZHVsZSA9IHJlcXVpcmUoJy4vcGJIZWFkZXIuanMnKTtcbnZhciBwYlNvY2lhbFRvb2xzID0gcmVxdWlyZSgnLi9wYlNvY2lhbFRvb2xzLmpzJyk7XG5cbi8vQWRkcyB0aGUgcmV0dXJuIHVybCB0byB0aGUgc3Vic2NyaWJlIGFjdGlvblxudmFyIHNldHVwU3Vic2NyaWJlQnRuID0gZnVuY3Rpb24oKXtcbiAgdmFyICRzdWJzY3JpYmUgPSAkKCcjbmF2LXN1YnNjcmliZScpLFxuICAgIGhyZWYgPSAgJHN1YnNjcmliZS5hdHRyKCdocmVmJyksXG4gICAgcGFnZUxvY2F0aW9uID0gd2luZG93LmVuY29kZVVSSSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAkc3Vic2NyaWJlLmF0dHIoJ2hyZWYnLCBocmVmICsgcGFnZUxvY2F0aW9uKTtcbn07XG4vL0Ryb3AgaW4geW91ciBpbml0IGZpbGVcbnNldHVwU3Vic2NyaWJlQnRuKCk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBHZW5lcmFsXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbnZhciBnZXRPZmZzZXQgPSBmdW5jdGlvbihlbCkge1xuICBlbCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICByZXR1cm4ge1xuICAgIGxlZnQ6IGVsLmxlZnQgKyB3aW5kb3cuc2Nyb2xsWCxcbiAgICB0b3A6IGVsLnRvcCArIHdpbmRvdy5zY3JvbGxZXG4gIH1cbn1cblxudmFyIHNodWZmbGUgPSBmdW5jdGlvbihhcnJheSkge1xuICB2YXIgY3VycmVudEluZGV4ID0gYXJyYXkubGVuZ3RoLCB0ZW1wb3JhcnlWYWx1ZSwgcmFuZG9tSW5kZXg7XG5cbiAgLy8gV2hpbGUgdGhlcmUgcmVtYWluIGVsZW1lbnRzIHRvIHNodWZmbGUuLi5cbiAgd2hpbGUgKDAgIT09IGN1cnJlbnRJbmRleCkge1xuXG4gICAgLy8gUGljayBhIHJlbWFpbmluZyBlbGVtZW50Li4uXG4gICAgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjdXJyZW50SW5kZXgpO1xuICAgIGN1cnJlbnRJbmRleCAtPSAxO1xuXG4gICAgLy8gQW5kIHN3YXAgaXQgd2l0aCB0aGUgY3VycmVudCBlbGVtZW50LlxuICAgIHRlbXBvcmFyeVZhbHVlID0gYXJyYXlbY3VycmVudEluZGV4XTtcbiAgICBhcnJheVtjdXJyZW50SW5kZXhdID0gYXJyYXlbcmFuZG9tSW5kZXhdO1xuICAgIGFycmF5W3JhbmRvbUluZGV4XSA9IHRlbXBvcmFyeVZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgVmFsdWVzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuOCwgeTowLjJ9LCB7eDowLjc4LCB5OjAuMTh9LCB7eDowLjc0LCB5OjAuMn0sIHt4OjAuNzIsIHk6MC4yMX0sIHt4OjAuNzEsIHk6MC4yNH0sIHt4OjAuNzMsIHk6MC4yNn0sIHt4OjAuNzYsIHk6MC4yM30sIHt4OjAuNzksIHk6MC4yfSksXG4gIG5ldyBBcnJheSh7eDowLjYsIHk6MC4zfSwge3g6MC41NSwgeTowLjIyfSwge3g6MC42MiwgeTowLjI0fSwge3g6MC42OCwgeTowLjJ9LCB7eDowLjcxLCB5OjAuMTh9LCB7eDowLjY4LCB5OjAuMTV9LCB7eDowLjY0LCB5OjAuMTh9LCB7eDowLjYzLCB5OjAuMjJ9LCB7eDowLjYyLCB5OjAuMjZ9LCB7eDowLjYxLCB5OjAuMjh9KSxcbiAgbmV3IEFycmF5KHt4OjAuNDksIHk6MC4xNH0sIHt4OjAuNTQsIHk6MC4xNn0sIHt4OjAuNTYsIHk6MC4xNH0sIHt4OjAuNTQsIHk6MC4xOH0sIHt4OjAuNTYsIHk6MC4yMn0sIHt4OjAuNTIsIHk6MC4xOH0sIHt4OjAuNSwgeTowLjE0fSwge3g6MC40NywgeTowLjEyfSksXG4gIG5ldyBBcnJheSh7eDowLjU1LCB5OjAuMzF9LCB7eDowLjU4LCB5OjAuMjh9LCB7eDowLjY0LCB5OjAuMjZ9LCB7eDowLjcyLCB5OjAuMjJ9LCB7eDowLjgsIHk6MC4xOH0sIHt4OjAuNzMsIHk6MC4yMn0sIHt4OjAuNjgsIHk6MC4yNH0sIHt4OjAuNjIsIHk6MC4yOH0pLFxuICBuZXcgQXJyYXkoe3g6MC43NSwgeTowLjE2fSwge3g6MC43MiwgeTowLjE4fSwge3g6MC42OCwgeTowLjIyfSwge3g6MC42MiwgeTowLjI2fSwge3g6MC41NSwgeTowLjN9LCB7eDowLjYyLCB5OjAuMjZ9LCB7eDowLjY4LCB5OjAuMjJ9LCB7eDowLjcyLCB5OjAuMTh9KSxcbiAgbmV3IEFycmF5KHt4OjAuODEyNzY5NjI4OTkwNTA5MSwgeTowLjE0NTgxNTM1ODA2NzI5OTR9LHt4OjAuNzYxODYzNjc1NTgyMzk4NiwgeTowLjEzNzE4NzIzMDM3MTAwOTV9LHt4OjAuNjkzNzAxNDY2NzgxNzA4NCwgeTowLjEzNDU5ODc5MjA2MjEyMjUyfSx7eDowLjU4NTg0OTg3MDU3ODA4NDYsIHk6MC4xNDMyMjY5MTk3NTg0MTI0Mn0se3g6MC41MTg1NTA0NzQ1NDcwMjMzLCB5OjAuMTY5OTc0MTE1NjE2OTExMTR9LHt4OjAuNTA5OTIyMzQ2ODUwNzMzMywgeTowLjIwNzkzNzg3NzQ4MDU4Njd9LHt4OjAuNTU5OTY1NDg3NDg5MjE0OCwgeTowLjIzMjA5NjYzNTAzMDE5ODQ1fSx7eDowLjYzNzYxODYzNjc1NTgyNCwgeTowLjIxNDg0MDM3OTYzNzYxODY1fSx7eDowLjcwNjY0MzY1ODMyNjE0MzIsIHk6MC4yMTM5Nzc1NjY4Njc5ODk2M30se3g6MC43OTAzMzY0OTY5ODAxNTUzLCB5OjAuMjM1NTQ3ODg2MTA4NzE0NH0se3g6MC44Mzk1MTY4MjQ4NDkwMDc4LCB5OjAuMjExMzg5MTI4NTU5MTAyNjZ9LHt4OjAuODM5NTE2ODI0ODQ5MDA3OCwgeTowLjE5MzI3MDA2MDM5Njg5Mzg3fSksXG4gIG5ldyBBcnJheSh7eDowLjQ5MDk0MDQ2NTkxODg5NTYsIHk6MC4zMTkyNDA3MjQ3NjI3MjY0N30se3g6MC41MDMwMTk4NDQ2OTM3MDE0LCB5OjAuMjc4Njg4NTI0NTkwMTYzOX0se3g6MC41NzU0OTYxMTczNDI1MzY3LCB5OjAuMTk5MzA5NzQ5Nzg0Mjk2OH0se3g6MC42Mzg0ODE0NDk1MjU0NTI5LCB5OjAuMTM4MDUwMDQzMTQwNjM4NDh9LHt4OjAuNjc4MTcwODM2OTI4Mzg2NSwgeTowLjA5NjYzNTAzMDE5ODQ0Njk0fSx7eDowLjcxNDQwODk3MzI1MjgwNDIsIHk6MC4xMTEzMDI4NDcyODIxMzk3OH0se3g6MC43NDgwNTg2NzEyNjgzMzQ4LCB5OjAuMTc2MDEzODA1MDA0MzE0MDd9LHt4OjAuODA1MDA0MzE0MDYzODQ4MSwgeTowLjI2ODMzNDc3MTM1NDYxNjAzfSx7eDowLjc5MjA2MjEyMjUxOTQxMzMsIHk6MC4zMjAxMDM1Mzc1MzIzNTU1fSx7eDowLjY1NTczNzcwNDkxODAzMjcsIHk6MC4zMzA0NTcyOTA3Njc5MDMzN30se3g6MC41NDUyOTc2NzA0MDU1MjIsIHk6MC4zMTc1MTUwOTkyMjM0Njg1fSksXG4gIG5ldyBBcnJheSh7eDowLjYwNzQyMDE4OTgxODgwOTMsIHk6MC4xMTIxNjU2NjAwNTE3Njg3N30se3g6MC41ODIzOTg2MTk0OTk1Njg2LCB5OjAuMTQ3NTQwOTgzNjA2NTU3Mzd9LHt4OjAuNTQ2MTYwNDgzMTc1MTUxLCB5OjAuMjIwMDE3MjU2MjU1MzkyNn0se3g6MC41NTMwNjI5ODUzMzIxODI5LCB5OjAuMzA4ODg2OTcxNTI3MTc4Nn0se3g6MC42NDE5MzI3MDA2MDM5Njg5LCB5OjAuMzA3MTYxMzQ1OTg3OTIwNn0se3g6MC42NzIxMzExNDc1NDA5ODM2LCB5OjAuMjM3MjczNTExNjQ3OTcyNH0se3g6MC42OTYyODk5MDUwOTA1OTUzLCB5OjAuMTQ5MjY2NjA5MTQ1ODE1MzV9LHt4OjAuNzUzMjM1NTQ3ODg2MTA4NywgeTowLjE0NTgxNTM1ODA2NzI5OTR9LHt4OjAuNzM2ODQyMTA1MjYzMTU3OSwgeTowLjI4ODE3OTQ2NTA1NjA4MjgzfSx7eDowLjgwMzI3ODY4ODUyNDU5MDIsIHk6MC4zMzMwNDU3MjkwNzY3OTAzfSx7eDowLjgyMjI2MDU2OTQ1NjQyOCwgeTowLjIyNjkxOTc1ODQxMjQyNDV9LHt4OjAuNzM5NDMwNTQzNTcyMDQ0OSwgeTowLjEyMDc5Mzc4Nzc0ODA1ODY3fSx7eDowLjY3ODE3MDgzNjkyODM4NjUsIHk6MC4xMTgyMDUzNDk0MzkxNzE3fSx7eDowLjYwNTY5NDU2NDI3OTU1MTQsIHk6MC4xMzExNDc1NDA5ODM2MDY1Nn0pLFxuICBuZXcgQXJyYXkoe3g6MC41MTY4MjQ4NDkwMDc3NjUzLCB5OjAuMjcwMDYwMzk2ODkzODc0fSx7eDowLjUxMzM3MzU5NzkyOTI0OTMsIHk6MC4xOTA2ODE2MjIwODgwMDY5fSx7eDowLjU2MjU1MzkyNTc5ODEwMTgsIHk6MC4xMzExNDc1NDA5ODM2MDY1Nn0se3g6MC42Mjg5OTA1MDkwNTk1MzQxLCB5OjAuMDk4MzYwNjU1NzM3NzA0OTJ9LHt4OjAuNzA0MDU1MjIwMDE3MjU2MywgeTowLjA5MjMyMDk2NjM1MDMwMTk5fSx7eDowLjc1MTUwOTkyMjM0Njg1MDgsIHk6MC4xMzExNDc1NDA5ODM2MDY1Nn0se3g6MC43ODk0NzM2ODQyMTA1MjYzLCB5OjAuMTg3MjMwMzcxMDA5NDkwOTR9LHt4OjAuODUzMzIxODI5MTYzMDcxNiwgeTowLjI1NjI1NTM5MjU3OTgxMDE3fSksXG4gIG5ldyBBcnJheSh7eDowLjgyNzQzNzQ0NjA3NDIwMTksIHk6MC4xMzg5MTI4NTU5MTAyNjc0N30se3g6MC43NjEwMDA4NjI4MTI3Njk2LCB5OjAuMTAwOTQ5MDk0MDQ2NTkxODl9LHt4OjAuNzA1NzgwODQ1NTU2NTE0MiwgeTowLjA3Njc5MDMzNjQ5Njk4MDE1fSx7eDowLjYzMDcxNjEzNDU5ODc5MiwgeTowLjA3NTkyNzUyMzcyNzM1MTE2fSx7eDowLjU0ODc0ODkyMTQ4NDAzOCwgeTowLjA5MTQ1ODE1MzU4MDY3M30se3g6MC40OTYxMTczNDI1MzY2Njk1NiwgeTowLjEzMjAxMDM1Mzc1MzIzNTU1fSx7eDowLjQ4MDU4NjcxMjY4MzM0Nzc0LCB5OjAuMTc1MTUwOTkyMjM0Njg1MDh9LHt4OjAuNTEwNzg1MTU5NjIwMzYyNCwgeTowLjIxNTcwMzE5MjQwNzI0NzY0fSx7eDowLjU2Njg2Nzk4OTY0NjI0NjcsIHk6MC4yNTYyNTUzOTI1Nzk4MTAxN30se3g6MC42NjAwNTE3Njg3NjYxNzc4LCB5OjAuMzAzNzEwMDk0OTA5NDA0NjV9LHt4OjAuNzM1MTE2NDc5NzIzODk5OSwgeTowLjMwNDU3MjkwNzY3OTAzMzY3fSx7eDowLjc4NDI5NjgwNzU5Mjc1MjMsIHk6MC4zMjE4MjkxNjMwNzE2MTM0N30se3g6MC44NDAzNzk2Mzc2MTg2MzY4LCB5OjAuMzExNDc1NDA5ODM2MDY1Nn0se3g6MC44MzYwNjU1NzM3NzA0OTE4LCB5OjAuMTk1ODU4NDk4NzA1NzgwODR9KSxcbiAgbmV3IEFycmF5KHt4OjAuNDc5NzIzODk5OTEzNzE4NywgeTowLjMwMTk4NDQ2OTM3MDE0NjY3fSx7eDowLjQ5MDk0MDQ2NTkxODg5NTYsIHk6MC4yMDc5Mzc4Nzc0ODA1ODY3fSx7eDowLjUzMjM1NTQ3ODg2MTA4NzEsIHk6MC4xMjQyNDUwMzg4MjY1NzQ2M30se3g6MC42MzkzNDQyNjIyOTUwODIsIHk6MC4wODg4Njk3MTUyNzE3ODYwM30se3g6MC43NzM5NDMwNTQzNTcyMDQ1LCB5OjAuMDk5MjIzNDY4NTA3MzMzOX0se3g6MC44NDcyODIxMzk3NzU2Njg3LCB5OjAuMTU0NDQzNDg1NzYzNTg5M30se3g6MC44NzA1NzgwODQ1NTU2NTE0LCB5OjAuMjcwOTIzMjA5NjYzNTAzMDN9LHt4OjAuODQ0NjkzNzAxNDY2NzgxNywgeTowLjMyNDQxNzYwMTM4MDUwMDR9LHt4OjAuNzI4MjEzOTc3NTY2ODY4LCB5OjAuMzQ1OTg3OTIwNjIxMjI1Mn0se3g6MC41MzIzNTU0Nzg4NjEwODcxLCB5OjAuMzQwODExMDQ0MDAzNDUxMjV9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMiA9IG5ldyBBcnJheShcbiAgLy9uZXcgQXJyYXkoe3g6MC40ODIyODgxMzU1OTMyMjAzNywgeTowLjIwMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDIwNDIzNzI4ODEzNTU5NCwgeTowLjIwNDIzNzI4ODEzNTU5MzIyfSx7eDowLjM3NDY2MTAxNjk0OTE1MjU1LCB5OjAuMjA1OTMyMjAzMzg5ODMwNX0se3g6MC4zMDI2MjcxMTg2NDQwNjc4LCB5OjAuMjA3NjI3MTE4NjQ0MDY3OH0se3g6MC4yODk5MTUyNTQyMzcyODgxNCwgeTowLjIxNTI1NDIzNzI4ODEzNTU5fSx7eDowLjI4NDgzMDUwODQ3NDU3NjMsIHk6MC4yMjc5NjYxMDE2OTQ5MTUyNH0se3g6MC4yODIyODgxMzU1OTMyMjAzNiwgeTowLjI1MTY5NDkxNTI1NDIzNzI2fSx7eDowLjI3NDY2MTAxNjk0OTE1MjU3LCB5OjAuMjY2OTQ5MTUyNTQyMzcyOX0se3g6MC4yNTYwMTY5NDkxNTI1NDI0LCB5OjAuMjY5NDkxNTI1NDIzNzI4ODR9LHt4OjAuMDcyMTE4NjQ0MDY3Nzk2NjMsIHk6MC4yNzIwMzM4OTgzMDUwODQ3M30se3g6MC4wNTUxNjk0OTE1MjU0MjM3MywgeTowLjI4MDUwODQ3NDU3NjI3MTJ9LHt4OjAuMDUwMDg0NzQ1NzYyNzExODY2LCB5OjAuMzAzMzg5ODMwNTA4NDc0NTd9LHt4OjAuMDQ3NTQyMzcyODgxMzU1OTQ2LCB5OjAuNDI0NTc2MjcxMTg2NDQwN30se3g6MC4wNDkyMzcyODgxMzU1OTMyMzUsIHk6MC40OTgzMDUwODQ3NDU3NjI3NH0se3g6MC4wNTY4NjQ0MDY3Nzk2NjEwMiwgeTowLjUxMzU1OTMyMjAzMzg5ODN9LHt4OjAuMDY5NTc2MjcxMTg2NDQwNjgsIHk6MC41MTg2NDQwNjc3OTY2MTAyfSx7eDowLjA5MjQ1NzYyNzExODY0NDA3LCB5OjAuNTIxMTg2NDQwNjc3OTY2Mn0se3g6MC4xMDk0MDY3Nzk2NjEwMTY5NiwgeTowLjUyNjI3MTE4NjQ0MDY3Nzl9LHt4OjAuMTE0NDkxNTI1NDIzNzI4ODMsIHk6MC41NDIzNzI4ODEzNTU5MzIyfSx7eDowLjExNDQ5MTUyNTQyMzcyODgzLCB5OjAuNTU5MzIyMDMzODk4MzA1fSlcbiAgbmV3IEFycmF5KHt4OjAuNDkzODk4MzA1MDg0NzQ1OCwgeTowLjIxNDQwNjc3OTY2MTAxNjk2fSx7eDowLjM4MDMzODk4MzA1MDg0NzQsIHk6MC4yMTEwMTY5NDkxNTI1NDIzOH0se3g6MC4zNDgxMzU1OTMyMjAzMzksIHk6MC4yMTI3MTE4NjQ0MDY3Nzk2N30se3g6MC4zMjM1NTkzMjIwMzM4OTgzLCB5OjAuMjE2MTAxNjk0OTE1MjU0MjR9LHt4OjAuMzE0MjM3Mjg4MTM1NTkzMiwgeTowLjIyMDMzODk4MzA1MDg0NzQ1fSx7eDowLjMwODMwNTA4NDc0NTc2Mjc0LCB5OjAuMjMwNTA4NDc0NTc2MjcxMn0se3g6MC4zMDU3NjI3MTE4NjQ0MDY4LCB5OjAuMjQ4MzA1MDg0NzQ1NzYyN30se3g6MC4zMDQwNjc3OTY2MTAxNjk0NywgeTowLjI2MjcxMTg2NDQwNjc3OTd9LHt4OjAuMjk4MTM1NTkzMjIwMzM5LCB5OjAuMjczNzI4ODEzNTU5MzIyMDV9LHt4OjAuMjc5NDkxNTI1NDIzNzI4OCwgeTowLjI4MzA1MDg0NzQ1NzYyNzF9LHt4OjAuMDg2MjcxMTg2NDQwNjc3OTQsIHk6MC4yODMwNTA4NDc0NTc2MjcxfSx7eDowLjA2NzYyNzExODY0NDA2Nzc5LCB5OjAuMjg4MTM1NTkzMjIwMzM5fSx7eDowLjA1ODMwNTA4NDc0NTc2MjcxLCB5OjAuMjk5MTUyNTQyMzcyODgxMzZ9LHt4OjAuMDU0MDY3Nzk2NjEwMTY5NSwgeTowLjUxNzc5NjYxMDE2OTQ5MTV9LHt4OjAuMDYxNjk0OTE1MjU0MjM3MjYsIHk6MC41MzcyODgxMzU1OTMyMjAzfSx7eDowLjA3NjEwMTY5NDkxNTI1NDI2LCB5OjAuNTQ1NzYyNzExODY0NDA2N30se3g6MC4xMTI1NDIzNzI4ODEzNTU5MywgeTowLjU0NjYxMDE2OTQ5MTUyNTR9LHt4OjAuMTIzNTU5MzIyMDMzODk4MywgeTowLjU1MzM4OTgzMDUwODQ3NDZ9LHt4OjAuMTI2MTAxNjk0OTE1MjU0MjUsIHk6MC41NzExODY0NDA2Nzc5NjYxfSx7eDowLjEyNTI1NDIzNzI4ODEzNTYyLCB5OjAuNTg4MTM1NTkzMjIwMzM5fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjExLCB5OjAuNjJ9LCB7eDowLjEyLCB5OjAuNjh9LCB7eDowLjEzLCB5OjAuNzJ9LCB7eDowLjE0LCB5OjAuNjh9LCB7eDowLjEzLCB5OjAuNjJ9LCB7eDowLjExLCB5OjAuNn0pLFxuICBuZXcgQXJyYXkoe3g6MC4wOCwgeTowLjZ9LCB7eDowLjA5LCB5OjAuNTh9LCB7eDowLjEsIHk6MC41Mn0sIHt4OjAuMTIsIHk6MC41OH0sIHt4OjAuMTMsIHk6MC42NH0sIHt4OjAuMDksIHk6MC42Mn0pLFxuICBuZXcgQXJyYXkoe3g6MC4xMywgeTowLjY4fSwge3g6MC4xMiwgeTowLjYyfSwge3g6MC4xMSwgeTowLjU4fSwge3g6MC4xMiwgeTowLjU3fSwge3g6MC4xMywgeTowLjU4fSwge3g6MC4xMSwgeTowLjYyfSksXG4gIG5ldyBBcnJheSh7eDowLjEyNzk2NjEwMTY5NDkxNTI2LCB5OjAuNjE5NDkxNTI1NDIzNzI4OH0se3g6MC4xMTk0OTE1MjU0MjM3Mjg4MiwgeTowLjYzMjIwMzM4OTgzMDUwODV9LHt4OjAuMTEwMTY5NDkxNTI1NDIzNzMsIHk6MC42NTQyMzcyODgxMzU1OTMyfSx7eDowLjEsIHk6MC42Nzk2NjEwMTY5NDkxNTI2fSx7eDowLjEwNjc3OTY2MTAxNjk0OTE1LCB5OjAuNzEwMTY5NDkxNTI1NDIzN30se3g6MC4xMzU1OTMyMjAzMzg5ODMwNSwgeTowLjcxMTAxNjk0OTE1MjU0MjN9LHt4OjAuMTQ1NzYyNzExODY0NDA2NzksIHk6MC42ODEzNTU5MzIyMDMzODk5fSx7eDowLjE0NjYxMDE2OTQ5MTUyNTQyLCB5OjAuNjQ1NzYyNzExODY0NDA2OH0se3g6MC4xNDIzNzI4ODEzNTU5MzIyLCB5OjAuNTgyMjAzMzg5ODMwNTA4NX0se3g6MC4xMzM4OTgzMDUwODQ3NDU3NiwgeTowLjU1OTMyMjAzMzg5ODMwNX0se3g6MC4xMDc2MjcxMTg2NDQwNjc3OSwgeTowLjU2Njk0OTE1MjU0MjM3Mjl9LHt4OjAuMTA5MzIyMDMzODk4MzA1MDgsIHk6MC41OTkxNTI1NDIzNzI4ODE0fSksXG4gIG5ldyBBcnJheSh7eDowLjE0NDkxNTI1NDIzNzI4ODEzLCB5OjAuNTc5NjYxMDE2OTQ5MTUyNX0se3g6MC4xNDkxNTI1NDIzNzI4ODEzNiwgeTowLjU2MDE2OTQ5MTUyNTQyMzd9LHt4OjAuMTI3OTY2MTAxNjk0OTE1MjYsIHk6MC41NX0se3g6MC4xMTI3MTE4NjQ0MDY3Nzk2NiwgeTowLjU1Njc3OTY2MTAxNjk0OTJ9LHt4OjAuMTM2NDQwNjc3OTY2MTAxNjgsIHk6MC41OTkxNTI1NDIzNzI4ODE0fSx7eDowLjExNjEwMTY5NDkxNTI1NDI0LCB5OjAuNjI0NTc2MjcxMTg2NDQwN30se3g6MC4xMDMzODk4MzA1MDg0NzQ1NywgeTowLjY2MzU1OTMyMjAzMzg5ODN9LHt4OjAuMTIwMzM4OTgzMDUwODQ3NDYsIHk6MC42NzU0MjM3Mjg4MTM1NTkzfSx7eDowLjE0NTc2MjcxMTg2NDQwNjc5LCB5OjAuNjk0OTE1MjU0MjM3Mjg4Mn0se3g6MC4xMjYyNzExODY0NDA2Nzc5NywgeTowLjcxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuMTA3NjI3MTE4NjQ0MDY3NzksIHk6MC42ODgxMzU1OTMyMjAzMzl9LHt4OjAuMTI0NTc2MjcxMTg2NDQwNjgsIHk6MC42Mjg4MTM1NTkzMjIwMzM5fSx7eDowLjEzODEzNTU5MzIyMDMzODk3LCB5OjAuNTg2NDQwNjc3OTY2MTAxN30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U0ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMjYxMDE2OTQ5MTUyNTQyNSwgeTowLjc1MzM4OTgzMDUwODQ3NDV9LHt4OjAuMTI5NDkxNTI1NDIzNzI4ODMsIHk6MC43NzQ1NzYyNzExODY0NDA3fSx7eDowLjEzMDMzODk4MzA1MDg0NzQ2LCB5OjAuODAyNTQyMzcyODgxMzU1OX0se3g6MC4xMjk0OTE1MjU0MjM3Mjg4MywgeTowLjgzMjIwMzM4OTgzMDUwODV9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMTEsIHk6MC44Mn0sIHt4OjAuMTIsIHk6MC44OH0sIHt4OjAuMTMsIHk6MC45Mn0sIHt4OjAuMTQsIHk6MC44OH0sIHt4OjAuMTMsIHk6MC44Mn0sIHt4OjAuMTEsIHk6MC44fSksXG4gIG5ldyBBcnJheSh7eDowLjA4LCB5OjAuOH0sIHt4OjAuMDksIHk6MC43OH0sIHt4OjAuMSwgeTowLjgyfSwge3g6MC4xMiwgeTowLjc4fSwge3g6MC4xMywgeTowLjg0fSwge3g6MC4wOSwgeTowLjgyfSksXG4gIG5ldyBBcnJheSh7eDowLjEzLCB5OjAuODh9LCB7eDowLjEyLCB5OjAuODJ9LCB7eDowLjExLCB5OjAuNzh9LCB7eDowLjEyLCB5OjAuNzd9LCB7eDowLjEzLCB5OjAuNzh9LCB7eDowLjExLCB5OjAuODJ9KSxcbiAgbmV3IEFycmF5KHt4OjAuMTQ3NDU3NjI3MTE4NjQ0MDcsIHk6MC43Njk0OTE1MjU0MjM3Mjg4fSx7eDowLjExNjk0OTE1MjU0MjM3Mjg4LCB5OjAuNzcyODgxMzU1OTMyMjAzNH0se3g6MC4wOTU3NjI3MTE4NjQ0MDY3OCwgeTowLjc4MTM1NTkzMjIwMzM4OTh9LHt4OjAuMDg0NzQ1NzYyNzExODY0NCwgeTowLjgwNjc3OTY2MTAxNjk0OTJ9LHt4OjAuMSwgeTowLjgzNzI4ODEzNTU5MzIyMDR9LHt4OjAuMTMzODk4MzA1MDg0NzQ1NzYsIHk6MC44NTMzODk4MzA1MDg0NzQ2fSx7eDowLjE1MTY5NDkxNTI1NDIzNzI4LCB5OjAuODM4MTM1NTkzMjIwMzM5fSx7eDowLjE2MzU1OTMyMjAzMzg5ODMsIHk6MC44MDI1NDIzNzI4ODEzNTU5fSksXG4gIG5ldyBBcnJheSh7eDowLjExNTI1NDIzNzI4ODEzNTYsIHk6MC44NTA4NDc0NTc2MjcxMTg3fSx7eDowLjA5MDY3Nzk2NjEwMTY5NDkyLCB5OjAuODIwMzM4OTgzMDUwODQ3NH0se3g6MC4wOTgzMDUwODQ3NDU3NjI3MiwgeTowLjc5NTc2MjcxMTg2NDQwNjd9LHt4OjAuMTEyNzExODY0NDA2Nzc5NjYsIHk6MC43NzU0MjM3Mjg4MTM1NTk0fSx7eDowLjEzODk4MzA1MDg0NzQ1NzYzLCB5OjAuNzc5NjYxMDE2OTQ5MTUyNn0se3g6MC4xMzU1OTMyMjAzMzg5ODMwNSwgeTowLjgwMzM4OTgzMDUwODQ3NDZ9LHt4OjAuMTQ3NDU3NjI3MTE4NjQ0MDcsIHk6MC44MjcxMTg2NDQwNjc3OTY2fSx7eDowLjEyNjI3MTE4NjQ0MDY3Nzk3LCB5OjAuODQ5MTUyNTQyMzcyODgxNH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMjk0OTE1MjU0MjM3Mjg4MywgeTowLjgzOTgzMDUwODQ3NDU3NjN9LHt4OjAuMTI5NDkxNTI1NDIzNzI4ODMsIHk6MC44ODcyODgxMzU1OTMyMjAzfSx7eDowLjEzMDMzODk4MzA1MDg0NzQ2LCB5OjAuOTMzMDUwODQ3NDU3NjI3MX0se3g6MC4xMjk0OTE1MjU0MjM3Mjg4MywgeToxLjA1fSx7eDowLjEzNDU3NjI3MTE4NjQ0MDY3LCB5OjEuMDYyNzExODY0NDA2Nzc5N30se3g6MC4xNDY0NDA2Nzc5NjYxMDE3MiwgeToxLjA3MjAzMzg5ODMwNTA4NDh9LHt4OjAuMjc0NDA2Nzc5NjYxMDE2OTUsIHk6MS4wNjg2NDQwNjc3OTY2MTAzfSx7eDowLjI5MTM1NTkzMjIwMzM4OTg0LCB5OjEuMDc4ODEzNTU5MzIyMDMzOH0se3g6MC4zMDIzNzI4ODEzNTU5MzIyLCB5OjEuMDk5MTUyNTQyMzcyODgxNH0se3g6MC4zMDU3NjI3MTE4NjQ0MDY4LCB5OjEuMTI2MjcxMTg2NDQwNjc4fSx7eDowLjMyMDE2OTQ5MTUyNTQyMzcsIHk6MS4xNDIzNzI4ODEzNTU5MzIyfSx7eDowLjQ0MjIwMzM4OTgzMDUwODUsIHk6MS4xNDE1MjU0MjM3Mjg4MTM1fSx7eDowLjQ2MTY5NDkxNTI1NDIzNzMsIHk6MS4xNTMzODk4MzA1MDg0NzQ3fSx7eDowLjQ2ODQ3NDU3NjI3MTE4NjQ0LCB5OjEuMTcwMzM4OTgzMDUwODQ3NX0se3g6MC40Njc2MjcxMTg2NDQwNjc3NSwgeToxLjI2ODY0NDA2Nzc5NjYxMDJ9LHt4OjAuNDcxMDE2OTQ5MTUyNTQyNCwgeToxLjMwMjU0MjM3Mjg4MTM1NTl9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuNDEwMTY5NDkxNTI1NDIzNywgeToxLjE4ODEzNTU5MzIyMDMzOX0se3g6MC4zODIyMDMzODk4MzA1MDg1LCB5OjEuMjEwMTY5NDkxNTI1NDIzN30se3g6MC4zNzU0MjM3Mjg4MTM1NTkzNCwgeToxLjI1NTA4NDc0NTc2MjcxMn0se3g6MC4zOTE1MjU0MjM3Mjg4MTM1NSwgeToxLjI5MjM3Mjg4MTM1NTkzMjN9LHt4OjAuNDM3Mjg4MTM1NTkzMjIwMzMsIHk6MS4zMTUyNTQyMzcyODgxMzU1fSx7eDowLjQ3NDU3NjI3MTE4NjQ0MDcsIHk6MS4zMDY3Nzk2NjEwMTY5NDl9LHt4OjAuNSwgeToxLjI3NjI3MTE4NjQ0MDY3OH0se3g6MC41MDU5MzIyMDMzODk4MzA1LCB5OjEuMjMzMDUwODQ3NDU3NjI3Mn0se3g6MC40Njc3OTY2MTAxNjk0OTE1MywgeToxLjE4Mzg5ODMwNTA4NDc0NTh9KSxcbiAgbmV3IEFycmF5KHt4OjAuNDYwMTY5NDkxNTI1NDIzNzUsIHk6MS4yMzcyODgxMzU1OTMyMjA0fSx7eDowLjQ3NjI3MTE4NjQ0MDY3Nzk1LCB5OjEuMjU4NDc0NTc2MjcxMTg2NH0se3g6MC40NzI4ODEzNTU5MzIyMDM0LCB5OjEuMzAwODQ3NDU3NjI3MTE4N30se3g6MC40MjAzMzg5ODMwNTA4NDc0NCwgeToxLjMwODQ3NDU3NjI3MTE4NjV9LHt4OjAuMzg4MTM1NTkzMjIwMzM4OTcsIHk6MS4yNjg2NDQwNjc3OTY2MTAyfSx7eDowLjQwNDIzNzI4ODEzNTU5MzIzLCB5OjEuMjM4MTM1NTkzMjIwMzM5fSx7eDowLjQ1MDg0NzQ1NzYyNzExODY0LCB5OjEuMjYyNzExODY0NDA2Nzc5Nn0se3g6MC40OTQ5MTUyNTQyMzcyODgxNiwgeToxLjI0NDkxNTI1NDIzNzI4OH0se3g6MC41MDg0NzQ1NzYyNzExODY0LCB5OjEuMjE1MjU0MjM3Mjg4MTM1Nn0se3g6MC40Nzk2NjEwMTY5NDkxNTI1MywgeToxLjE4MTM1NTkzMjIwMzM4OTd9KSxcbiAgbmV3IEFycmF5KHt4OjAuNDEyNzExODY0NDA2Nzc5NjUsIHk6MS4xOTIzNzI4ODEzNTU5MzIyfSx7eDowLjQ3Mjg4MTM1NTkzMjIwMzQsIHk6MS4yfSx7eDowLjUwNTkzMjIwMzM4OTgzMDUsIHk6MS4yNDgzMDUwODQ3NDU3NjI2fSx7eDowLjUwMzM4OTgzMDUwODQ3NDUsIHk6MS4yOTQ5MTUyNTQyMzcyODgxfSx7eDowLjQzNzI4ODEzNTU5MzIyMDMzLCB5OjEuM30se3g6MC4zODU1OTMyMjAzMzg5ODMxLCB5OjEuMjg0NzQ1NzYyNzExODY0NH0se3g6MC4zNzYyNzExODY0NDA2NzgsIHk6MS4yNDIzNzI4ODEzNTU5MzIzfSx7eDowLjQyMzcyODgxMzU1OTMyMiwgeToxLjI0NzQ1NzYyNzExODY0NDJ9LHt4OjAuNDY1MjU0MjM3Mjg4MTM1NiwgeToxLjIxOTQ5MTUyNTQyMzcyODl9LHt4OjAuNDE2OTQ5MTUyNTQyMzcyODYsIHk6MS4xODcyODgxMzU1OTMyMjAzfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTggPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjUyNDQ5MTUyNTQyMzcyODgsIHk6MS4zNTQyMzcyODgxMzU1OTMzfSx7eDowLjU0OTkxNTI1NDIzNzI4OCwgeToxLjM1MjU0MjM3Mjg4MTM1Nn0se3g6MC41NzcwMzM4OTgzMDUwODQ3LCB5OjEuMzUzMzg5ODMwNTA4NDc0Nn0se3g6MC41ODgwNTA4NDc0NTc2MjcxLCB5OjEuMzU5MzIyMDMzODk4MzA1Mn0se3g6MC41OTY1MjU0MjM3Mjg4MTM2LCB5OjEuMzcwMzM4OTgzMDUwODQ3NH0se3g6MC41OTU2Nzc5NjYxMDE2OTQ5LCB5OjEuMzk0MDY3Nzk2NjEwMTY5Nn0se3g6MC41OTU2Nzc5NjYxMDE2OTQ5LCB5OjEuNDQ2NjEwMTY5NDkxNTI1NH0se3g6MC41OTgyMjAzMzg5ODMwNTA5LCB5OjEuNDYyNzExODY0NDA2Nzc5Nn0se3g6MC42MDU4NDc0NTc2MjcxMTg3LCB5OjEuNDcyMDMzODk4MzA1MDg0N30se3g6MC42Mjk1NzYyNzExODY0NDA4LCB5OjEuNDc3OTY2MTAxNjk0OTE1M30se3g6MC42NTkyMzcyODgxMzU1OTMyLCB5OjEuNDc2MjcxMTg2NDQwNjc4fSx7eDowLjY2Njg2NDQwNjc3OTY2MSwgeToxLjQ2Nzc5NjYxMDE2OTQ5MTV9LHt4OjAuNjcyNzk2NjEwMTY5NDkxNSwgeToxLjQ1fSx7eDowLjY3Mjc5NjYxMDE2OTQ5MTUsIHk6MS40MDMzODk4MzA1MDg0NzQ3fSx7eDowLjY3MTEwMTY5NDkxNTI1NDIsIHk6MS4zNTU5MzIyMDMzODk4MzA0fSx7eDowLjY3Mjc5NjYxMDE2OTQ5MTUsIHk6MS4zMjExODY0NDA2Nzc5NjZ9LHt4OjAuNjcxOTQ5MTUyNTQyMzcyOSwgeToxLjMwODQ3NDU3NjI3MTE4NjV9LHt4OjAuNjc0NDkxNTI1NDIzNzI4NywgeToxLjI5NzQ1NzYyNzExODY0NH0se3g6MC42ODEyNzExODY0NDA2NzgsIHk6MS4yODcyODgxMzU1OTMyMjA0fSx7eDowLjcwNzU0MjM3Mjg4MTM1NTksIHk6MS4yODk4MzA1MDg0NzQ1NzYzfSx7eDowLjc3MTEwMTY5NDkxNTI1NDMsIHk6MS4yODg5ODMwNTA4NDc0NTc2fSx7eDowLjc4MzgxMzU1OTMyMjAzMzksIHk6MS4yOTIzNzI4ODEzNTU5MzIzfSx7eDowLjc4ODA1MDg0NzQ1NzYyNzEsIHk6MS4zMDE2OTQ5MTUyNTQyMzcyfSx7eDowLjc4ODg5ODMwNTA4NDc0NTgsIHk6MS4zMTc3OTY2MTAxNjk0OTE2fSx7eDowLjc4NTUwODQ3NDU3NjI3MTMsIHk6MS4zNTU5MzIyMDMzODk4MzA0fSx7eDowLjc4ODA1MDg0NzQ1NzYyNzEsIHk6MS40MDE2OTQ5MTUyNTQyMzczfSx7eDowLjc4ODg5ODMwNTA4NDc0NTgsIHk6MS40NTU5MzIyMDMzODk4MzA1fSx7eDowLjc5MjI4ODEzNTU5MzIyMDMsIHk6MS40NjUyNTQyMzcyODgxMzU2fSx7eDowLjgwMjQ1NzYyNzExODY0NDEsIHk6MS40NzIwMzM4OTgzMDUwODQ3fSx7eDowLjg0MTQ0MDY3Nzk2NjEwMTcsIHk6MS40NzYyNzExODY0NDA2Nzh9LHt4OjAuODgwNDIzNzI4ODEzNTU5MiwgeToxLjQ3NjI3MTE4NjQ0MDY3OH0se3g6MC44OTgyMjAzMzg5ODMwNTA4LCB5OjEuNDg3Mjg4MTM1NTkzMjIwNH0se3g6MC45MDI0NTc2MjcxMTg2NDQsIHk6MS41MDU5MzIyMDMzODk4MzA2fSx7eDowLjkwNDE1MjU0MjM3Mjg4MTMsIHk6MS41NzAzMzg5ODMwNTA4NDc0fSx7eDowLjkwMzMwNTA4NDc0NTc2MjcsIHk6MS42MTY5NDkxNTI1NDIzNzN9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuODA5NDIzNzI4ODEzNTU5MywgeToxLjUxODA1OTMyMjAzMzg5ODN9LHt4OjAuODI4MDY3Nzk2NjEwMTY5NSwgeToxLjU0MTc4ODEzNTU5MzIyMDR9LHt4OjAuODU5NDIzNzI4ODEzNTU5MywgeToxLjU1NTM0NzQ1NzYyNzExODd9LHt4OjAuODc5NzYyNzExODY0NDA2OCwgeToxLjU0MDk0MDY3Nzk2NjEwMTd9LHt4OjAuODg0ODQ3NDU3NjI3MTE4NiwgeToxLjUyNjUzMzg5ODMwNTA4NDd9LHt4OjAuODc3MjIwMzM4OTgzMDUwOSwgeToxLjUwNzA0MjM3Mjg4MTM1NTh9LHt4OjAuODU3NzI4ODEzNTU5MzIyMSwgeToxLjQ5MDk0MDY3Nzk2NjEwMTZ9KSxcbiAgbmV3IEFycmF5KHt4OjAuODY3ODk4MzA1MDg0NzQ1NywgeToxLjUzOTI0NTc2MjcxMTg2NDN9LHt4OjAuODc1NTI1NDIzNzI4ODEzNiwgeToxLjUyNTY4NjQ0MDY3Nzk2Nn0se3g6MC44NTUxODY0NDA2Nzc5NjYxLCB5OjEuNTE0NjY5NDkxNTI1NDIzN30se3g6MC44MzY1NDIzNzI4ODEzNTU5LCB5OjEuNTE0NjY5NDkxNTI1NDIzN30se3g6MC44MjQ2Nzc5NjYxMDE2OTQ5LCB5OjEuNTI4MjI4ODEzNTU5MzIyfSx7eDowLjgxNTM1NTkzMjIwMzM4OTksIHk6MS41Mzc1NTA4NDc0NTc2MjcyfSx7eDowLjgwMzQ5MTUyNTQyMzcyODgsIHk6MS41MjQ4Mzg5ODMwNTA4NDczfSx7eDowLjgwODU3NjI3MTE4NjQ0MDcsIHk6MS40OTc3MjAzMzg5ODMwNTF9LHt4OjAuODMxNDU3NjI3MTE4NjQ0LCB5OjEuNDkwMDkzMjIwMzM4OTgzfSx7eDowLjg1NjAzMzg5ODMwNTA4NDcsIHk6MS41MDI4MDUwODQ3NDU3NjI2fSksXG4gIG5ldyBBcnJheSh7eDowLjg0NTAxNjk0OTE1MjU0MjMsIHk6MS40ODQxNjEwMTY5NDkxNTI2fSx7eDowLjg1NjAzMzg5ODMwNTA4NDcsIHk6MS41MDE5NTc2MjcxMTg2NDQxfSx7eDowLjg2NjIwMzM4OTgzMDUwODUsIHk6MS41MjE0NDkxNTI1NDIzNzI4fSx7eDowLjg2NzA1MDg0NzQ1NzYyNzEsIHk6MS41MzUwMDg0NzQ1NzYyNzF9LHt4OjAuODUwOTQ5MTUyNTQyMzcyOSwgeToxLjU0MTc4ODEzNTU5MzIyMDR9LHt4OjAuODI3MjIwMzM4OTgzMDUwOCwgeToxLjUzNTg1NTkzMjIwMzM4OTh9LHt4OjAuODA3NzI4ODEzNTU5MzIyLCB5OjEuNTIwNjAxNjk0OTE1MjU0fSx7eDowLjgxMDI3MTE4NjQ0MDY3OCwgeToxLjUwNDV9LHt4OjAuODMzMTUyNTQyMzcyODgxNCwgeToxLjUwMjgwNTA4NDc0NTc2MjZ9LHt4OjAuODUwOTQ5MTUyNTQyMzcyOSwgeToxLjUxNTUxNjk0OTE1MjU0MjR9LHt4OjAuODczODMwNTA4NDc0NTc2MiwgeToxLjUxMjk3NDU3NjI3MTE4NjR9LHt4OjAuODcwNDQwNjc3OTY2MTAxNywgeToxLjUwMDI2MjcxMTg2NDQwNjd9LHt4OjAuODU1MTg2NDQwNjc3OTY2MSwgeToxLjQ5MTc4ODEzNTU5MzIyMDN9LHt4OjAuODQzMzIyMDMzODk4MzA1MSwgeToxLjQ4MzMxMzU1OTMyMjAzNH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMCA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuOTA5MTUyNTQyMzcyODgxNSwgeToxLjYzNzI4ODEzNTU5MzIyMDN9LHt4OjAuOTEwODQ3NDU3NjI3MTE4NiwgeToxLjY2NDQwNjc3OTY2MTAxN30se3g6MC45MDkxNTI1NDIzNzI4ODE1LCB5OjEuNzA4NDc0NTc2MjcxMTg2NH0se3g6MC45MDU3NjI3MTE4NjQ0MDY5LCB5OjEuNzU1MDg0NzQ1NzYyNzEyfSx7eDowLjkwMzIyMDMzODk4MzA1MDksIHk6MS43Nzc5NjYxMDE2OTQ5MTUzfSx7eDowLjkxNjc3OTY2MTAxNjk0OTIsIHk6MS43ODg5ODMwNTA4NDc0NTc2fSx7eDowLjkxMDAwMDAwMDAwMDAwMDEsIHk6MS44MDU5MzIyMDMzODk4MzA0fSx7eDowLjkxNDIzNzI4ODEzNTU5MzQsIHk6MS44MzY0NDA2Nzc5NjYxMDE4fSx7eDowLjkxMTY5NDkxNTI1NDIzNzMsIHk6MS44NjAxNjk0OTE1MjU0MjM3fSx7eDowLjkxMDg0NzQ1NzYyNzExODYsIHk6MS44OTgzMDUwODQ3NDU3NjI4fSx7eDowLjkxNDIzNzI4ODEzNTU5MzQsIHk6MS45NDY2MTAxNjk0OTE1MjU0fSx7eDowLjkxMDAwMDAwMDAwMDAwMDEsIHk6MS45OTkxNTI1NDIzNzI4ODEzfSx7eDowLjkwOTE1MjU0MjM3Mjg4MTUsIHk6Mi4wNDgzMDUwODQ3NDU3NjN9LHt4OjAuOTEwMDAwMDAwMDAwMDAwMSwgeToyLjEwNTA4NDc0NTc2MjcxMTh9LHt4OjAuOTA0MDY3Nzk2NjEwMTY5NiwgeToyLjEzMDUwODQ3NDU3NjI3MX0se3g6MC44OTMwNTA4NDc0NTc2MjcxLCB5OjIuMTM4MTM1NTkzMjIwMzM5fSx7eDowLjg2Njc3OTY2MTAxNjk0OTEsIHk6Mi4xMzg5ODMwNTA4NDc0NTc0fSx7eDowLjg0ODEzNTU5MzIyMDMzODksIHk6Mi4xNDU3NjI3MTE4NjQ0MDd9LHt4OjAuODM3OTY2MTAxNjk0OTE1NCwgeToyLjE2OTQ5MTUyNTQyMzcyOX0se3g6MC44Mzk2NjEwMTY5NDkxNTI1LCB5OjIuMzU3NjI3MTE4NjQ0MDY4fSx7eDowLjgzNTQyMzcyODgxMzU1OTMsIHk6Mi4zNzcxMTg2NDQwNjc3OTY3fSx7eDowLjgxNTA4NDc0NTc2MjcxMiwgeToyLjM4NDc0NTc2MjcxMTg2NDR9LHt4OjAuNzkxMzU1OTMyMjAzMzg5OCwgeToyLjM4NDc0NTc2MjcxMTg2NDR9LHt4OjAuNzg3OTY2MTAxNjk0OTE1MywgeToyLjM3Nzk2NjEwMTY5NDkxNTR9LHt4OjAuNzgxMTg2NDQwNjc3OTY2LCB5OjIuMzkyMzcyODgxMzU1OTMyfSx7eDowLjc3Njk0OTE1MjU0MjM3MjgsIHk6Mi4zNzcxMTg2NDQwNjc3OTY3fSx7eDowLjc3MDE2OTQ5MTUyNTQyMzgsIHk6Mi4zOTE1MjU0MjM3Mjg4MTM1fSx7eDowLjc2NTkzMjIwMzM4OTgzMDYsIHk6Mi4zNzg4MTM1NTkzMjIwMzR9LHt4OjAuNzU4MzA1MDg0NzQ1NzYyNiwgeToyLjM5MTUyNTQyMzcyODgxMzV9LHt4OjAuNzU0MDY3Nzk2NjEwMTY5NCwgeToyLjM3NzExODY0NDA2Nzc5Njd9LHt4OjAuNzQ3Mjg4MTM1NTkzMjIwNCwgeToyLjM5MjM3Mjg4MTM1NTkzMn0se3g6MC43NDIyMDMzODk4MzA1MDg1LCB5OjIuMzc0NTc2MjcxMTg2NDQwN30se3g6MC43MzM3Mjg4MTM1NTkzMjIxLCB5OjIuMzkyMzcyODgxMzU1OTMyfSx7eDowLjczMTE4NjQ0MDY3Nzk2NiwgeToyLjM3NzExODY0NDA2Nzc5Njd9LHt4OjAuNzI0NDA2Nzc5NjYxMDE3LCB5OjIuMzkyMzcyODgxMzU1OTMyfSx7eDowLjcxOTMyMjAzMzg5ODMwNTEsIHk6Mi4zNzk2NjEwMTY5NDkxNTIzfSx7eDowLjcwNzQ1NzYyNzExODY0NDEsIHk6Mi4zODU1OTMyMjAzMzg5ODN9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTEgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjU4MjMwNTA4NDc0NTc2MjcsIHk6Mi4xMDQ1MDAwMDAwMDAwMDAzfSx7eDowLjU2NjIwMzM4OTgzMDUwODQsIHk6Mi4xMDAyNjI3MTE4NjQ0MDd9LHt4OjAuNTY3MDUwODQ3NDU3NjI3MSwgeToyLjA5MjYzNTU5MzIyMDMzOX0se3g6MC41ODczODk4MzA1MDg0NzQ2LCB5OjIuMDg2NzAzMzg5ODMwNTA4N30se3g6MC42MTQ1MDg0NzQ1NzYyNzEyLCB5OjIuMDc2NTMzODk4MzA1MDg1fSx7eDowLjYzMzE1MjU0MjM3Mjg4MTMsIHk6Mi4wNzQ4Mzg5ODMwNTA4NDc2fSx7eDowLjYzNjU0MjM3Mjg4MTM1NiwgeToyLjA4NTg1NTkzMjIwMzM5fSx7eDowLjYyMTI4ODEzNTU5MzIyMDMsIHk6Mi4wOTc3MjAzMzg5ODMwNTF9LHt4OjAuNTkxNjI3MTE4NjQ0MDY3OCwgeToyLjEwMjgwNTA4NDc0NTc2M30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMiA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuNzEwMDg0NzQ1NzYyNzEyLCB5OjIuMzg4MTM1NTkzMjIwMzM5fSx7eDowLjcwNTAwMDAwMDAwMDAwMDEsIHk6Mi40MDA4NDc0NTc2MjcxMTg2fSx7eDowLjcwNTg0NzQ1NzYyNzExODUsIHk6Mi40MTI3MTE4NjQ0MDY3Nzk4fSx7eDowLjcwNDE1MjU0MjM3Mjg4MTQsIHk6Mi40MzcyODgxMzU1OTMyMjAzfSx7eDowLjcwMTYxMDE2OTQ5MTUyNTMsIHk6Mi40NDY2MTAxNjk0OTE1MjU0fSx7eDowLjY5MDU5MzIyMDMzODk4MzEsIHk6Mi40NTUwODQ3NDU3NjI3MTJ9LHt4OjAuNjUyNDU3NjI3MTE4NjQ0LCB5OjIuNDU3NjI3MTE4NjQ0MDY4fSx7eDowLjQ2ODU1OTMyMjAzMzg5ODMzLCB5OjIuNDU1OTMyMjAzMzg5ODMwNX0se3g6MC40NTU4NDc0NTc2MjcxMTg2LCB5OjIuNDU1OTMyMjAzMzg5ODMwNX0se3g6MC40NDM5ODMwNTA4NDc0NTc2NSwgeToyLjQ0OTE1MjU0MjM3Mjg4MTV9LHt4OjAuNDMxMjcxMTg2NDQwNjc3OSwgeToyLjQzODk4MzA1MDg0NzQ1Nzd9LHt4OjAuNDI3ODgxMzU1OTMyMjAzNCwgeToyLjQyMTE4NjQ0MDY3Nzk2Nn0se3g6MC40Mjk1NzYyNzExODY0NDA2NSwgeToyLjM2NDQwNjc3OTY2MTAxN30se3g6MC40MTc3MTE4NjQ0MDY3Nzk3LCB5OjIuMzQyMzcyODgxMzU1OTMyNH0se3g6MC40MDU4NDc0NTc2MjcxMTg2NiwgeToyLjMzODEzNTU5MzIyMDMzOX0se3g6MC4zOTczNzI4ODEzNTU5MzIyNCwgeToyLjMzMzg5ODMwNTA4NDc0Nn0se3g6MC4zOTk5MTUyNTQyMzcyODgxLCB5OjIuMzQ2NjEwMTY5NDkxNTI1M30se3g6MC4zODQ2NjEwMTY5NDkxNTI1LCB5OjIuMzM0NzQ1NzYyNzExODY0Nn0se3g6MC4zODYzNTU5MzIyMDMzODk5LCB5OjIuMzQ3NDU3NjI3MTE4NjQ0fSx7eDowLjM3MzY0NDA2Nzc5NjYxMDE0LCB5OjIuMzMzODk4MzA1MDg0NzQ2fSx7eDowLjM3NDQ5MTUyNTQyMzcyODgsIHk6Mi4zNDc0NTc2MjcxMTg2NDR9LHt4OjAuMzYwOTMyMjAzMzg5ODMwNSwgeToyLjMzNTU5MzIyMDMzODk4M30se3g6MC4zNjQzMjIwMzM4OTgzMDUwMywgeToyLjM1fSx7eDowLjM1MDc2MjcxMTg2NDQwNjcsIHk6Mi4zMzU1OTMyMjAzMzg5ODN9LHt4OjAuMzUyNDU3NjI3MTE4NjQ0MSwgeToyLjM0OTE1MjU0MjM3Mjg4MTR9LHt4OjAuMzM4ODk4MzA1MDg0NzQ1OCwgeToyLjMzNTU5MzIyMDMzODk4M30se3g6MC4zMjc4ODEzNTU5MzIyMDM0LCB5OjIuMzQ0OTE1MjU0MjM3Mjg4fSx7eDowLjMyMTEwMTY5NDkxNTI1NDI1LCB5OjIuMzUzMzg5ODMwNTA4NDc0NH0se3g6MC4zMTg1NTkzMjIwMzM4OTgzLCB5OjIuMzY4NjQ0MDY3Nzk2NjEwM30se3g6MC4zMTg1NTkzMjIwMzM4OTgzLCB5OjIuMzgzMDUwODQ3NDU3NjI3fSx7eDowLjMxNzcxMTg2NDQwNjc3OTYsIHk6Mi4zOTU3NjI3MTE4NjQ0MDd9LHt4OjAuMzA5MjM3Mjg4MTM1NTkzMiwgeToyLjQwMjU0MjM3Mjg4MTM1Nn0se3g6MC4yODk3NDU3NjI3MTE4NjQ0LCB5OjIuNDA1OTMyMjAzMzg5ODMwN30se3g6MC4yMjAyNTQyMzcyODgxMzU2LCB5OjIuNDA2Nzc5NjYxMDE2OTQ5fSx7eDowLjE3NzAzMzg5ODMwNTA4NDc2LCB5OjIuNDA3NjI3MTE4NjQ0MDY3Nn0se3g6MC4xMTI2MjcxMTg2NDQwNjc3NywgeToyLjQwODQ3NDU3NjI3MTE4NjN9LHt4OjAuMDk5MDY3Nzk2NjEwMTY5NTEsIHk6Mi40MTI3MTE4NjQ0MDY3Nzk4fSx7eDowLjA4ODg5ODMwNTA4NDc0NTc4LCB5OjIuNDE4NjQ0MDY3Nzk2NjF9LHt4OjAuMDgzODEzNTU5MzIyMDMzODgsIHk6Mi40MzQ3NDU3NjI3MTE4NjQzfSx7eDowLjA4NDY2MTAxNjk0OTE1MjUxLCB5OjIuNDk0MDY3Nzk2NjEwMTY5Nn0se3g6MC4wODIxMTg2NDQwNjc3OTY2MiwgeToyLjU1Njc3OTY2MTAxNjk0OTN9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjA1NDMzODk4MzA1MDg0NzQ2LCB5OjIuMzY5NzU0MjM3Mjg4MTM1N30se3g6MC4wNTM0OTE1MjU0MjM3Mjg4MTQsIHk6Mi40MTIxMjcxMTg2NDQwNjh9LHt4OjAuMDY4NzQ1NzYyNzExODY0NCwgeToyLjQzMDc3MTE4NjQ0MDY3OH0se3g6MC4wODQ4NDc0NTc2MjcxMTg2NSwgeToyLjQyODIyODgxMzU1OTMyMjR9LHt4OjAuMDkxNjI3MTE4NjQ0MDY3NzksIHk6Mi40MDExMTAxNjk0OTE1MjZ9LHt4OjAuMDg5OTMyMjAzMzg5ODMwNSwgeToyLjM3MjI5NjYxMDE2OTQ5Mn0se3g6MC4wNzM4MzA1MDg0NzQ1NzYyNywgeToyLjMzOTI0NTc2MjcxMTg2NX0se3g6MC4wNjQ1MDg0NzQ1NzYyNzExOCwgeToyLjMxODkwNjc3OTY2MTAxN30se3g6MC4wNjAyNzExODY0NDA2Nzc5NywgeToyLjM0NzcyMDMzODk4MzA1MX0pLFxuICBuZXcgQXJyYXkoe3g6MC4wNjk1OTMyMjAzMzg5ODMwNSwgeToyLjM0NTE3Nzk2NjEwMTY5NX0se3g6MC4wODIzMDUwODQ3NDU3NjI3MiwgeToyLjM1Nzg4OTgzMDUwODQ3NDZ9LHt4OjAuMDg2NTQyMzcyODgxMzU1OTMsIHk6Mi4zODI0NjYxMDE2OTQ5MTU2fSx7eDowLjA3Mjk4MzA1MDg0NzQ1NzYzLCB5OjIuMzk3NzIwMzM4OTgzMDUxfSx7eDowLjA2MDI3MTE4NjQ0MDY3Nzk3LCB5OjIuNDEwNDMyMjAzMzg5ODMxfSx7eDowLjA1MzQ5MTUyNTQyMzcyODgxNCwgeToyLjQyMjI5NjYxMDE2OTQ5MTZ9LHt4OjAuMDY5NTkzMjIwMzM4OTgzMDUsIHk6Mi40Mzc1NTA4NDc0NTc2Mjd9LHt4OjAuMDgzMTUyNTQyMzcyODgxMzYsIHk6Mi40MzU4NTU5MzIyMDMzOX0se3g6MC4wODczODk4MzA1MDg0NzQ1NywgeToyLjQyODIyODgxMzU1OTMyMjR9LHt4OjAuMDg4MjM3Mjg4MTM1NTkzMjEsIHk6Mi40MTA0MzIyMDMzODk4MzF9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTQgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjEwMzMwNTA4NDc0NTc2MjcyLCB5OjIuNTc1NDIzNzI4ODEzNTU5NX0se3g6MC4xMjExMDE2OTQ5MTUyNTQyNCwgeToyLjU3NDU3NjI3MTE4NjQ0MX0se3g6MC4xMzEyNzExODY0NDA2Nzc5OCwgeToyLjU3NDU3NjI3MTE4NjQ0MX0se3g6MC4xMzgwNTA4NDc0NTc2MjcxMywgeToyLjU3NDU3NjI3MTE4NjQ0MX0se3g6MC4xNDIyODgxMzU1OTMyMjAzNCwgeToyLjU3NjI3MTE4NjQ0MDY3Nzh9LHt4OjAuMTQ1Njc3OTY2MTAxNjk0OTIsIHk6Mi41ODIyMDMzODk4MzA1MDg2fSx7eDowLjE0NjUyNTQyMzcyODgxMzU1LCB5OjIuNTk0OTE1MjU0MjM3Mjg4fSx7eDowLjE0Mzk4MzA1MDg0NzQ1NzYsIHk6Mi42MTYxMDE2OTQ5MTUyNTQyfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE1ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMjk3NjI3MTE4NjQ0MDY4LCB5OjIuMzYyOTc0NTc2MjcxMTg2N30se3g6MC4xMTk1OTMyMjAzMzg5ODMwNSwgeToyLjM3MTQ0OTE1MjU0MjM3M30se3g6MC4xMTI4MTM1NTkzMjIwMzM5LCB5OjIuMzg5MjQ1NzYyNzExODY0Nn0se3g6MC4xMTYyMDMzODk4MzA1MDg0NywgeToyLjQyMjI5NjYxMDE2OTQ5MTZ9LHt4OjAuMTE2MjAzMzg5ODMwNTA4NDcsIHk6Mi40NDM0ODMwNTA4NDc0NTh9LHt4OjAuMTA5NDIzNzI4ODEzNTU5MzIsIHk6Mi40NjQ2Njk0OTE1MjU0MjM3fSx7eDowLjExNjIwMzM4OTgzMDUwODQ3LCB5OjIuNDkwMDkzMjIwMzM4OTgzNH0se3g6MC4xMzE0NTc2MjcxMTg2NDQwNiwgeToyLjQ5NzcyMDMzODk4MzA1MX0se3g6MC4xNDQxNjk0OTE1MjU0MjM3NCwgeToyLjQ3ODIyODgxMzU1OTMyMjJ9LHt4OjAuMTM3Mzg5ODMwNTA4NDc0NiwgeToyLjQ1NTM0NzQ1NzYyNzExOX0pLFxuICBuZXcgQXJyYXkoe3g6MC4xNDA3Nzk2NjEwMTY5NDkxNiwgeToyLjQ5ODU2Nzc5NjYxMDE3fSx7eDowLjEyMDQ0MDY3Nzk2NjEwMTY4LCB5OjIuNDg4Mzk4MzA1MDg0NzQ2fSx7eDowLjExNTM1NTkzMjIwMzM4OTg0LCB5OjIuNDc5OTIzNzI4ODEzNTU5Nn0se3g6MC4xMjQ2Nzc5NjYxMDE2OTQ5MiwgeToyLjQ2MjEyNzExODY0NDA2OH0se3g6MC4xMzkwODQ3NDU3NjI3MTE4NSwgeToyLjQ1NzA0MjM3Mjg4MTM1Nn0se3g6MC4xNDMzMjIwMzM4OTgzMDUwNiwgeToyLjQ0MTc4ODEzNTU5MzIyMDV9LHt4OjAuMTM0LCB5OjIuNDE4OTA2Nzc5NjYxMDE3M30se3g6MC4xMTQ1MDg0NzQ1NzYyNzExOCwgeToyLjQwNzg4OTgzMDUwODQ3NX0se3g6MC4xMTAyNzExODY0NDA2Nzc5NywgeToyLjM4NTg1NTkzMjIwMzM5fSx7eDowLjExODc0NTc2MjcxMTg2NDQyLCB5OjIuMzcyMjk2NjEwMTY5NDkyfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE2ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xNDY1MjU0MjM3Mjg4MTM1NSwgeToyLjcxMTAxNjk0OTE1MjU0Mn0se3g6MC4xNDY1MjU0MjM3Mjg4MTM1NSwgeToyLjcyNDU3NjI3MTE4NjQ0MDd9LHt4OjAuMTQ3MzcyODgxMzU1OTMyMTgsIHk6Mi43Mjk2NjEwMTY5NDkxNTI0fSx7eDowLjE0NTY3Nzk2NjEwMTY5NDkyLCB5OjIuNzQxNTI1NDIzNzI4ODEzNn0se3g6MC4xNDU2Nzc5NjYxMDE2OTQ5MiwgeToyLjc3OTY2MTAxNjk0OTE1Mjd9LHt4OjAuMTM3MjAzMzg5ODMwNTA4NDUsIHk6Mi43ODg5ODMwNTA4NDc0NTh9LHt4OjAuMTQ1Njc3OTY2MTAxNjk0OTIsIHk6Mi43OTMyMjAzMzg5ODMwNTA4fSx7eDowLjEzODg5ODMwNTA4NDc0NTc3LCB5OjIuNzk3NDU3NjI3MTE4NjQ0fSx7eDowLjE0NTY3Nzk2NjEwMTY5NDkyLCB5OjIuOH0se3g6MC4xMzgwNTA4NDc0NTc2MjcxMywgeToyLjgwNDIzNzI4ODEzNTU5MzN9LHt4OjAuMTQ2NTI1NDIzNzI4ODEzNTUsIHk6Mi44MDc2MjcxMTg2NDQwNjh9LHt4OjAuMTM5NzQ1NzYyNzExODY0NCwgeToyLjgxMTg2NDQwNjc3OTY2MX0se3g6MC4xNDY1MjU0MjM3Mjg4MTM1NSwgeToyLjgxNzc5NjYxMDE2OTQ5MTN9LHt4OjAuMTM4ODk4MzA1MDg0NzQ1NzcsIHk6Mi44MjM3Mjg4MTM1NTkzMjJ9LHt4OjAuMTQ0ODMwNTA4NDc0NTc2MywgeToyLjgyNjI3MTE4NjQ0MDY3Nzh9LHt4OjAuMTQwNTkzMjIwMzM4OTgzMDMsIHk6Mi44MzEzNTU5MzIyMDMzOX0se3g6MC4xNDMxMzU1OTMyMjAzMzg5NywgeToyLjgzMzg5ODMwNTA4NDc0Nn0se3g6MC4xNDM5ODMwNTA4NDc0NTc2LCB5OjIuODQyMzcyODgxMzU1OTMyNH0se3g6MC4xNDM5ODMwNTA4NDc0NTc2LCB5OjIuODQ2NjEwMTY5NDkxNTI1M30se3g6MC4xMzk3NDU3NjI3MTE4NjQ0LCB5OjIuODUwODQ3NDU3NjI3MTE4OH0se3g6MC4xMjM2NDQwNjc3OTY2MTAxNCwgeToyLjg1MDg0NzQ1NzYyNzExODh9LHt4OjAuMTA5MjM3Mjg4MTM1NTkzMTksIHk6Mi44NTQyMzcyODgxMzU1OTN9LHt4OjAuMDkxNDQwNjc3OTY2MTAxNjcsIHk6Mi44NjI3MTE4NjQ0MDY3Nzk1fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE3ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4wNjk1OTMyMjAzMzg5ODMwNSwgeToyLjU5MTc4ODEzNTU5MzIyMDR9LHt4OjAuMDUzNDkxNTI1NDIzNzI4ODE0LCB5OjIuNTY4OTA2Nzc5NjYxMDE3fSx7eDowLjA1MjY0NDA2Nzc5NjYxMDE3LCB5OjIuNTQ0MzMwNTA4NDc0NTc2Nn0se3g6MC4wNjUzNTU5MzIyMDMzODk4MiwgeToyLjUzMjQ2NjEwMTY5NDkxNTV9LHt4OjAuMDg2NTQyMzcyODgxMzU1OTMsIHk6Mi41NDY4NzI4ODEzNTU5MzIzfSx7eDowLjA4NTY5NDkxNTI1NDIzNzMsIHk6Mi41NzA2MDE2OTQ5MTUyNTQ2fSx7eDowLjA2ODc0NTc2MjcxMTg2NDQsIHk6Mi41ODkyNDU3NjI3MTE4NjV9LHt4OjAuMDU5NDIzNzI4ODEzNTU5MzI2LCB5OjIuNjE2MzY0NDA2Nzc5NjYxfSx7eDowLjA1NjAzMzg5ODMwNTA4NDc1LCB5OjIuNjQ4NTY3Nzk2NjEwMTY5N30se3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjY2ODkwNjc3OTY2MTAxNzN9LHt4OjAuMDgzMTUyNTQyMzcyODgxMzYsIHk6Mi42NTc4ODk4MzA1MDg0NzV9LHt4OjAuMDg0ODQ3NDU3NjI3MTE4NjUsIHk6Mi42NDAwOTMyMjAzMzg5ODMzfSx7eDowLjA4MjMwNTA4NDc0NTc2MjcyLCB5OjIuNjI5MDc2MjcxMTg2NDQxfSx7eDowLjA2NjIwMzM4OTgzMDUwODQ3LCB5OjIuNjE0NjY5NDkxNTI1NDI0fSx7eDowLjA2MjgxMzU1OTMyMjAzMzksIHk6Mi41ODQxNjEwMTY5NDkxNTI3fSksXG4gIG5ldyBBcnJheSh7eDowLjA1NzcyODgxMzU1OTMyMjA0LCB5OjIuNTcwNjAxNjk0OTE1MjU0Nn0se3g6MC4wNTc3Mjg4MTM1NTkzMjIwNCwgeToyLjU5MTc4ODEzNTU5MzIyMDR9LHt4OjAuMDcyOTgzMDUwODQ3NDU3NjMsIHk6Mi42MTEyNzk2NjEwMTY5NDkzfSx7eDowLjA4NCwgeToyLjYyNzM4MTM1NTkzMjIwMzV9LHt4OjAuMDg0ODQ3NDU3NjI3MTE4NjUsIHk6Mi42NTI4MDUwODQ3NDU3NjI3fSx7eDowLjA3ODkxNTI1NDIzNzI4ODE0LCB5OjIuNjY4OTA2Nzc5NjYxMDE3M30se3g6MC4wNjExMTg2NDQwNjc3OTY2MTUsIHk6Mi42NjEyNzk2NjEwMTY5NDl9LHt4OjAuMDU3NzI4ODEzNTU5MzIyMDQsIHk6Mi42NDE3ODgxMzU1OTMyMjA3fSx7eDowLjA3ODA2Nzc5NjYxMDE2OTUsIHk6Mi42MTM4MjIwMzM4OTgzMDU0fSx7eDowLjA3NDY3Nzk2NjEwMTY5NDkxLCB5OjIuNTk1MTc3OTY2MTAxNjk1fSx7eDowLjA1ODU3NjI3MTE4NjQ0MDY4LCB5OjIuNTgwNzcxMTg2NDQwNjc4fSx7eDowLjA1NTE4NjQ0MDY3Nzk2NjEsIHk6Mi41NjIxMjcxMTg2NDQwNjh9LHt4OjAuMDU1MTg2NDQwNjc3OTY2MSwgeToyLjU0MTc4ODEzNTU5MzIyMDZ9LHt4OjAuMDcyMTM1NTkzMjIwMzM4OTgsIHk6Mi41MzUwMDg0NzQ1NzYyNzE1fSx7eDowLjA4NDg0NzQ1NzYyNzExODY1LCB5OjIuNTQ5NDE1MjU0MjM3Mjg4M30se3g6MC4wNzM4MzA1MDg0NzQ1NzYyNywgeToyLjU3NTY4NjQ0MDY3Nzk2NjN9LHt4OjAuMDczODMwNTA4NDc0NTc2MjcsIHk6Mi42MjE0NDkxNTI1NDIzNzN9LHt4OjAuMDc5NzYyNzExODY0NDA2NzgsIHk6Mi42MzMzMTM1NTkzMjIwMzQzfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE4ID0gbmV3IEFycmF5KFxuICAvL25ldyBBcnJheSh7eDowLjA3Mjk4MzA1MDg0NzQ1NzYzLCB5OjIuNjU1MzQ3NDU3NjI3MTE4OH0se3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjY3MDYwMTY5NDkxNTI1NDJ9LHt4OjAuMDY0NTA4NDc0NTc2MjcxMTgsIHk6Mi42OTE3ODgxMzU1OTMyMjA1fSx7eDowLjA3NDY3Nzk2NjEwMTY5NDkxLCB5OjIuNjk4NTY3Nzk2NjEwMTY5NX0se3g6MC4wNjQ1MDg0NzQ1NzYyNzExOCwgeToyLjcwMzY1MjU0MjM3Mjg4MTd9LCB7eDowLjA2Nzg5ODMwNTA4NDc0NTc2LCB5OjIuNzYwNjAxNjk0OTE1MjU0M30se3g6MC4wNzk3NjI3MTE4NjQ0MDY3OCwgeToyLjc2ODIyODgxMzU1OTMyMn0se3g6MC4xMDUxODY0NDA2Nzc5NjYxLCB5OjIuNzY4MjI4ODEzNTU5MzIyfSx7eDowLjEzMDYxMDE2OTQ5MTUyNTQzLCB5OjIuNzY4MjI4ODEzNTU5MzIyfSx7eDowLjE1MDk0OTE1MjU0MjM3MjksIHk6Mi43ODE2MTg2NDQwNjc3OTd9LHt4OjAuMTUyNjQ0MDY3Nzk2NjEwMTYsIHk6Mi43OTYwMjU0MjM3Mjg4MTM2fSx7eDowLjE1MzQ5MTUyNTQyMzcyODgsIHk6Mi44MTU1MTY5NDkxNTI1NDI1fSx7eDowLjE1NDMzODk4MzA1MDg0NzQ4LCB5OjIuODQ1MTc3OTY2MTAxNjk1fSx7eDowLjE2MDI3MTE4NjQ0MDY3Nzk1LCB5OjIuODU4NzM3Mjg4MTM1NTkzMn0se3g6MC4xNzYzNzI4ODEzNTU5MzIyLCB5OjIuODUxMjc5NjYxMDE2OTQ5M30se3g6MC4xODMxNTI1NDIzNzI4ODEzNywgeToyLjg0Nzg4OTgzMDUwODQ3NDZ9LHt4OjAuMTg2NTQyMzcyODgxMzU1OTQsIHk6Mi44NTU1MTY5NDkxNTI1NDI3fSx7eDowLjE5MDc3OTY2MTAxNjk0OTE1LCB5OjIuODQ3ODg5ODMwNTA4NDc0Nn0se3g6MC4xOTY3MTE4NjQ0MDY3Nzk2OCwgeToyLjg1MzgyMjAzMzg5ODMwNTR9LHt4OjAuMjAwOTQ5MTUyNTQyMzcyOSwgeToyLjg0NTM0NzQ1NzYyNzExOX0se3g6MC4yMDY4ODEzNTU5MzIyMDM0MSwgeToyLjg1NDY2OTQ5MTUyNTQyNH0se3g6MC4yMTAyNzExODY0NDA2NzgsIHk6Mi44NDQ1MDAwMDAwMDAwMDAzfSx7eDowLjIxNDUwODQ3NDU3NjI3MTIsIHk6Mi44NTQ2Njk0OTE1MjU0MjR9LHt4OjAuMjE5NTkzMjIwMzM4OTgzMDQsIHk6Mi44NDQ1MDAwMDAwMDAwMDAzfSx7eDowLjIyNDY3Nzk2NjEwMTY5NDk0LCB5OjIuODQzODIyMDMzODk4MzA1NH0se3g6MC4yMjgwNjc3OTY2MTAxNjk1MiwgeToyLjg0MzY1MjU0MjM3Mjg4MTZ9LHt4OjAuMjMwNjEwMTY5NDkxNTI1NCwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuMjQ5MjU0MjM3Mjg4MTM1NTYsIHk6Mi44NjA0MzIyMDMzODk4MzA2fSx7eDowLjI4MTQ1NzYyNzExODY0NCwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuMzQ2NzExODY0NDA2Nzc5NjUsIHk6Mi44NTEyNzk2NjEwMTY5NDkzfSx7eDowLjM4OTA4NDc0NTc2MjcxMTg1LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40MDM0OTE1MjU0MjM3Mjg4LCB5OjIuODQ4NzM3Mjg4MTM1NTkzMn0se3g6MC40MDYwMzM4OTgzMDUwODQ3NCwgeToyLjg0NTM0NzQ1NzYyNzExOX0se3g6MC40MTExMTg2NDQwNjc3OTY2LCB5OjIuODU2MzY0NDA2Nzc5NjYxfSx7eDowLjQxNjIwMzM4OTgzMDUwODUsIHk6Mi44NTUzNDc0NTc2MjcxMTl9LHt4OjAuNDE4NzQ1NzYyNzExODY0MzcsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQyNjM3Mjg4MTM1NTkzMjIsIHk6Mi44NTI4MDUwODQ3NDU3NjN9LHt4OjAuNDI4MDY3Nzk2NjEwMTY5NDcsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQzMTQ1NzYyNzExODY0NDA1LCB5OjIuODQzNjUyNTQyMzcyODgxNn0se3g6MC40MzQsIHk6Mi44NTI5NzQ1NzYyNzExODY3fSx7eDowLjQzNCwgeToyLjg0NjE5NDkxNTI1NDIzNzZ9LHt4OjAuNDQxNjI3MTE4NjQ0MDY3OCwgeToyLjg1NjM2NDQwNjc3OTY2MX0se3g6MC40NDUwMTY5NDkxNTI1NDIzNiwgeToyLjg0NTM0NzQ1NzYyNzExOX0se3g6MC40NTAxMDE2OTQ5MTUyNTQyLCB5OjIuODUxMjc5NjYxMDE2OTQ5M30se3g6MC40NjM2NjEwMTY5NDkxNTI1LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40ODQsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQ5NDE2OTQ5MTUyNTQyMzY3LCB5OjIuODY4MDU5MzIyMDMzODk4NH0se3g6MC40OTc1NTkzMjIwMzM4OTgzLCB5OjIuODg3NTUwODQ3NDU3NjI3Mn0se3g6MC40OTc1NTkzMjIwMzM4OTgzLCB5OjIuOTI1Njg2NDQwNjc3OTY2M30se3g6MC40OTY3MTE4NjQ0MDY3Nzk2LCB5OjIuOTUyODA1MDg0NzQ1NzYzfSx7eDowLjQ5NzU1OTMyMjAzMzg5ODMsIHk6Mi45ODA3NzExODY0NDA2NzgzfSwge3g6MC40ODQ4NDc0NTc2MjcxMTg2NywgeTozLjAwMzY1MjU0MjM3Mjg4MTV9LHt4OjAuNDYyODEzNTU5MzIyMDMzOSwgeTozLjAxMjk3NDU3NjI3MTE4NjZ9LHt4OjAuNDQyNDc0NTc2MjcxMTg2NCwgeTozLjAxMzgyMjAzMzg5ODMwNTN9LHt4OjAuNDMyMzA1MDg0NzQ1NzYyNywgeTozLjAxODA1OTMyMjAzMzg5ODN9LHt4OjAuNDI3MjIwMzM4OTgzMDUwODQsIHk6My4wMjkwNzYyNzExODY0NDA3fSx7eDowLjQyNjM3Mjg4MTM1NTkzMjIsIHk6My4wNjI5NzQ1NzYyNzExODY0fSx7eDowLjQyOTc2MjcxMTg2NDQwNjgsIHk6My4xMDExMTAxNjk0OTE1MjU1fSx7eDowLjQyMzgzMDUwODQ3NDU3NjI2LCB5OjMuMTEzODIyMDMzODk4MzA1NH0se3g6MC4zODU2OTQ5MTUyNTQyMzcyNywgeTozLjExODA1OTMyMjAzMzg5ODR9LHt4OjAuMzU2ODgxMzU1OTMyMjAzNCwgeTozLjExNzIxMTg2NDQwNjc3OTd9LHt4OjAuMzQ1ODY0NDA2Nzc5NjYxLCB5OjMuMTA4NzM3Mjg4MTM1NTkzMn0se3g6MC4zNDU4NjQ0MDY3Nzk2NjEsIHk6My4wOTUxNzc5NjYxMDE2OTV9LHt4OjAuMzQzMzIyMDMzODk4MzA1MDcsIHk6My4wMjMxNDQwNjc3OTY2MTA0fSlcbiAgbmV3IEFycmF5KHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeToyLjg4OTgzMDUwODQ3NDU3Nn0se3g6MC4wODI5NjYxMDE2OTQ5MTUyNSwgeToyLjkwNjc3OTY2MTAxNjk0OX0se3g6MC4wODQ2NjEwMTY5NDkxNTI1MSwgeToyLjkxNjk0OTE1MjU0MjM3Mjd9LHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeToyLjkzODk4MzA1MDg0NzQ1Nzd9LHt4OjAuMDgzODEzNTU5MzIyMDMzODgsIHk6Mi45NjM1NTkzMjIwMzM4OTgzfSx7eDowLjA3Nzg4MTM1NTkzMjIwMzM2LCB5OjIuOTcwMzM4OTgzMDUwODQ3M30se3g6MC4wODU1MDg0NzQ1NzYyNzEyLCB5OjIuOTc0NTc2MjcxMTg2NDQwN30se3g6MC4wODEyNzExODY0NDA2Nzc5MywgeToyLjk3Nzk2NjEwMTY5NDkxNX0se3g6MC4wODQ2NjEwMTY5NDkxNTI1MSwgeToyLjk4MjIwMzM4OTgzMDUwODV9LHt4OjAuMDc5NTc2MjcxMTg2NDQwNjcsIHk6Mi45ODU1OTMyMjAzMzg5ODMyfSx7eDowLjA4NDY2MTAxNjk0OTE1MjUxLCB5OjIuOTg5ODMwNTA4NDc0NTc2fSx7eDowLjA4MDQyMzcyODgxMzU1OTMsIHk6Mi45OTU3NjI3MTE4NjQ0MDY2fSx7eDowLjA4NjM1NTkzMjIwMzM4OTgzLCB5OjIuOTk5MTUyNTQyMzcyODgxM30se3g6MC4wNzg3Mjg4MTM1NTkzMjIwNCwgeTozLjAwNTA4NDc0NTc2MjcxMTd9LHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeTozLjAwODQ3NDU3NjI3MTE4NjR9LHt4OjAuMDgwNDIzNzI4ODEzNTU5MywgeTozLjAxMjcxMTg2NDQwNjc4fSx7eDowLjA4Mjk2NjEwMTY5NDkxNTI1LCB5OjMuMDIzNzI4ODEzNTU5MzIyfSx7eDowLjA4Mjk2NjEwMTY5NDkxNTI1LCB5OjMuMDM3Mjg4MTM1NTkzMjIwNH0se3g6MC4wODEyNzExODY0NDA2Nzc5MywgeTozLjA2NjEwMTY5NDkxNTI1NDR9LHt4OjAuMDgxMjcxMTg2NDQwNjc3OTMsIHk6My4wOTQwNjc3OTY2MTAxNjkzfSx7eDowLjA4NTUwODQ3NDU3NjI3MTIsIHk6My4xMTI3MTE4NjQ0MDY3Nzk1fSx7eDowLjA5MTQ0MDY3Nzk2NjEwMTY3LCB5OjMuMTIyMDMzODk4MzA1MDg0Nn0se3g6MC4xMDU4NDc0NTc2MjcxMTg2MSwgeTozLjEyNjI3MTE4NjQ0MDY3OH0se3g6MC4xMjM2NDQwNjc3OTY2MTAxNCwgeTozLjEyNzk2NjEwMTY5NDkxNTR9LHt4OjAuMTMyOTY2MTAxNjk0OTE1MjQsIHk6My4xNDE1MjU0MjM3Mjg4MTM1fSx7eDowLjEzMzgxMzU1OTMyMjAzMzg3LCB5OjMuMTkzMjIwMzM4OTgzMDUwN30se3g6MC4xMzcyMDMzODk4MzA1MDg0NSwgeTozLjIwODQ3NDU3NjI3MTE4NjZ9LHt4OjAuMTQ1Njc3OTY2MTAxNjk0OTIsIHk6My4yMTM1NTkzMjIwMzM4OTgzfSx7eDowLjE1NjY5NDkxNTI1NDIzNzMsIHk6My4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjE2OTQwNjc3OTY2MTAxNjkyLCB5OjMuMjExODY0NDA2Nzc5NjYxfSx7eDowLjE3NjE4NjQ0MDY3Nzk2NjA3LCB5OjMuMjE3Nzk2NjEwMTY5NDkxN30se3g6MC4xODEyNzExODY0NDA2Nzc5NywgeTozLjIwODQ3NDU3NjI3MTE4NjZ9LHt4OjAuMTg5NzQ1NzYyNzExODY0MzksIHk6My4yMTc3OTY2MTAxNjk0OTE3fSx7eDowLjE5MTQ0MDY3Nzk2NjEwMTcsIHk6My4yMTEwMTY5NDkxNTI1NDJ9LHt4OjAuMTk4MjIwMzM4OTgzMDUwODYsIHk6My4yMTYxMDE2OTQ5MTUyNTQzfSx7eDowLjIwMzMwNTA4NDc0NTc2MjcsIHk6My4yMDg0NzQ1NzYyNzExODY2fSx7eDowLjIwODM4OTgzMDUwODQ3NDYsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuMjEyNjI3MTE4NjQ0MDY3OCwgeTozLjIxMTAxNjk0OTE1MjU0Mn0se3g6MC4yMjE5NDkxNTI1NDIzNzI4NSwgeTozLjIxNjEwMTY5NDkxNTI1NDN9LHt4OjAuMjY4NTU5MzIyMDMzODk4MywgeTozLjIxNjEwMTY5NDkxNTI1NDN9LHt4OjAuMzc1MzM4OTgzMDUwODQ3NCwgeTozLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuMzg3MjAzMzg5ODMwNTA4NDUsIHk6My4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjM5NDgzMDUwODQ3NDU3NjMsIHk6My4yMTI3MTE4NjQ0MDY3Nzk2fSx7eDowLjQwNTg0NzQ1NzYyNzExODY2LCB5OjMuMjIwMzM4OTgzMDUwODQ3M30se3g6MC40MTAwODQ3NDU3NjI3MTE4NywgeTozLjIwOTMyMjAzMzg5ODMwNTN9LHt4OjAuNDIwMjU0MjM3Mjg4MTM1NTUsIHk6My4yMjAzMzg5ODMwNTA4NDczfSx7eDowLjQyNzAzMzg5ODMwNTA4NDcsIHk6My4yMDkzMjIwMzM4OTgzMDUzfSx7eDowLjQzMjk2NjEwMTY5NDkxNTMsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDM4ODk4MzA1MDg0NzQ1NzUsIHk6My4yMTAxNjk0OTE1MjU0MjM1fSx7eDowLjQ0OTkxNTI1NDIzNzI4ODEsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDcxMTAxNjk0OTE1MjU0MywgeTozLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuNDg2MzU1OTMyMjAzMzg5ODUsIHk6My4yMTc3OTY2MTAxNjk0OTE3fSx7eDowLjQ5NDgzMDUwODQ3NDU3NjI3LCB5OjMuMjIyMDMzODk4MzA1MDg0N30se3g6MC40OTk5MTUyNTQyMzcyODgxNiwgeTozLjIzNzI4ODEzNTU5MzIyfSx7eDowLjQ5OTkxNTI1NDIzNzI4ODE2LCB5OjMuMjc0NTc2MjcxMTg2NDQwNn0se3g6MC40OTk5MTUyNTQyMzcyODgxNiwgeTozLjMxNTI1NDIzNzI4ODEzNTd9LHt4OjAuNDk4MjIwMzM4OTgzMDUwOCwgeTozLjM0NDkxNTI1NDIzNzI4OH0se3g6MC40OTkwNjc3OTY2MTAxNjk1LCB5OjMuMzYyNzExODY0NDA2Nzc5NX0sIHt4OjAuNDg2MzU1OTMyMjAzMzg5ODUsIHk6My4zNzIwMzM4OTgzMDUwODQ2fSx7eDowLjQ2ODU1OTMyMjAzMzg5ODMzLCB5OjMuMzc5NjYxMDE2OTQ5MTUyM30se3g6MC40NTY2OTQ5MTUyNTQyMzczLCB5OjMuMzc4ODEzNTU5MzIyMDM0fSx7eDowLjQ0MDU5MzIyMDMzODk4MywgeTozLjM4MDUwODQ3NDU3NjI3MX0se3g6MC40MzEyNzExODY0NDA2Nzc5LCB5OjMuMzg1NTkzMjIwMzM4OTgzfSx7eDowLjQyNjE4NjQ0MDY3Nzk2NjEsIHk6My4zOTQ5MTUyNTQyMzcyODgyfSx7eDowLjQyNTMzODk4MzA1MDg0NzQ0LCB5OjMuNDE0NDA2Nzc5NjYxMDE3fSx7eDowLjQyNDQ5MTUyNTQyMzcyODc1LCB5OjMuNDYwMTY5NDkxNTI1NDIzNX0se3g6MC40MjQ0OTE1MjU0MjM3Mjg3NSwgeTozLjQ3Nzk2NjEwMTY5NDkxNX0se3g6MC40MTUxNjk0OTE1MjU0MjM3NiwgeTozLjQ4ODEzNTU5MzIyMDMzOX0se3g6MC4zODk3NDU3NjI3MTE4NjQ0LCB5OjMuNDkwNjc3OTY2MTAxNjk1fSx7eDowLjM1MTYxMDE2OTQ5MTUyNTQsIHk6My40ODgxMzU1OTMyMjAzMzl9LHt4OjAuMzQxNDQwNjc3OTY2MTAxNywgeTozLjQ3ODgxMzU1OTMyMjAzMzd9LHt4OjAuMzM4ODk4MzA1MDg0NzQ1OCwgeTozLjQ2Nzc5NjYxMDE2OTQ5MTd9LHt4OjAuMzM4ODk4MzA1MDg0NzQ1OCwgeTozLjQ1MTY5NDkxNTI1NDIzN30se3g6MC4zMzg4OTgzMDUwODQ3NDU4LCB5OjMuMzk3NDU3NjI3MTE4NjQ0fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE5ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4zNDc1NTkzMjIwMzM4OTgzLCB5OjMuMDI0ODM4OTgzMDUwODQ3OH0se3g6MC4zMzA2MTAxNjk0OTE1MjU0LCB5OjMuMDQ2ODcyODgxMzU1OTMyM30se3g6MC4zMDUxODY0NDA2Nzc5NjYxLCB5OjMuMDI5OTIzNzI4ODEzNTU5NH0se3g6MC4zMDQzMzg5ODMwNTA4NDc0NCwgeToyLjk5OTQxNTI1NDIzNzI4ODV9LHt4OjAuMzA2ODgxMzU1OTMyMjAzNCwgeToyLjk2MDQzMjIwMzM4OTgzMDd9LHt4OjAuMzI5NzYyNzExODY0NDA2NzUsIHk6Mi45MzUwMDg0NzQ1NzYyNzE1fSx7eDowLjM1OTQyMzcyODgxMzU1OTMzLCB5OjIuOTQyNjM1NTkzMjIwMzM5fSx7eDowLjM4MTQ1NzYyNzExODY0NDA2LCB5OjIuOTYxMjc5NjYxMDE2OTQ5NH0se3g6MC4zNzIxMzU1OTMyMjAzMzg5NiwgeToyLjk3NjUzMzg5ODMwNTA4NX0se3g6MC4zNDUwMTY5NDkxNTI1NDI0LCB5OjIuOTgzMzEzNTU5MzIyMDM0fSx7eDowLjM0MDc3OTY2MTAxNjk0OTEsIHk6My4wMDAyNjI3MTE4NjQ0MDY3fSx7eDowLjM3MDQ0MDY3Nzk2NjEwMTcsIHk6My4wMTU1MTY5NDkxNTI1NDI2fSx7eDowLjM3ODA2Nzc5NjYxMDE2OTUsIHk6My4wNDA5NDA2Nzc5NjYxMDJ9LHt4OjAuMzQ5MjU0MjM3Mjg4MTM1NiwgeTozLjA1MTk1NzYyNzExODY0NDR9KSwgXG4gIG5ldyBBcnJheSh7eDowLjM3ODkxNTI1NDIzNzI4ODEsIHk6Mi45MzkyNDU3NjI3MTE4NjQ0fSx7eDowLjM4MjMwNTA4NDc0NTc2MjcsIHk6Mi45NjI5NzQ1NzYyNzExODY4fSx7eDowLjM2MTExODY0NDA2Nzc5NjYsIHk6Mi45NzMxNDQwNjc3OTY2MTA2fSx7eDowLjMyNTUyNTQyMzcyODgxMzU1LCB5OjIuOTg0MTYxMDE2OTQ5MTUyNn0se3g6MC4zMDg1NzYyNzExODY0NDA2NSwgeTozLjAwMjgwNTA4NDc0NTc2M30se3g6MC4zMzIzMDUwODQ3NDU3NjI3LCB5OjMuMDEzODIyMDMzODk4MzA1M30se3g6MC4zNjYyMDMzODk4MzA1MDg1LCB5OjMuMDIzMTQ0MDY3Nzk2NjEwNH0se3g6MC4zODA2MTAxNjk0OTE1MjU0MywgeTozLjA0NTE3Nzk2NjEwMTY5NX0se3g6MC4zNTI2NDQwNjc3OTY2MTAxNywgeTozLjA1OTU4NDc0NTc2MjcxMn0se3g6MC4zMDk0MjM3Mjg4MTM1NTkzLCB5OjMuMDQ4NTY3Nzk2NjEwMTY5Nn0se3g6MC4zMTUzNTU5MzIyMDMzODk4LCB5OjMuMDE2MzY0NDA2Nzc5NjYxM30se3g6MC4zMzgyMzcyODgxMzU1OTMyMywgeToyLjk5NTE3Nzk2NjEwMTY5NX0se3g6MC4zNjYyMDMzODk4MzA1MDg1LCB5OjIuOTg4Mzk4MzA1MDg0NzQ2fSx7eDowLjM1MjY0NDA2Nzc5NjYxMDE3LCB5OjIuOTY0NjY5NDkxNTI1NDIzN30se3g6MC4zMTcwNTA4NDc0NTc2MjcxLCB5OjIuOTQ4NTY3Nzk2NjEwMTY5NX0se3g6MC4zMzY1NDIzNzI4ODEzNTU5LCB5OjIuOTM0MTYxMDE2OTQ5MTUyOH0se3g6MC4zNjUzNTU5MzIyMDMzODk4LCB5OjIuOTM5MjQ1NzYyNzExODY0NH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMCA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeToyLjg4OTgzMDUwODQ3NDU3Nn0se3g6MC4wODI5NjYxMDE2OTQ5MTUyNSwgeToyLjkwNjc3OTY2MTAxNjk0OX0se3g6MC4wODQ2NjEwMTY5NDkxNTI1MSwgeToyLjkxNjk0OTE1MjU0MjM3Mjd9LHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeToyLjkzODk4MzA1MDg0NzQ1Nzd9LHt4OjAuMDgzODEzNTU5MzIyMDMzODgsIHk6Mi45NjM1NTkzMjIwMzM4OTgzfSx7eDowLjA3Nzg4MTM1NTkzMjIwMzM2LCB5OjIuOTcwMzM4OTgzMDUwODQ3M30se3g6MC4wODU1MDg0NzQ1NzYyNzEyLCB5OjIuOTc0NTc2MjcxMTg2NDQwN30se3g6MC4wODEyNzExODY0NDA2Nzc5MywgeToyLjk3Nzk2NjEwMTY5NDkxNX0se3g6MC4wODQ2NjEwMTY5NDkxNTI1MSwgeToyLjk4MjIwMzM4OTgzMDUwODV9LHt4OjAuMDc5NTc2MjcxMTg2NDQwNjcsIHk6Mi45ODU1OTMyMjAzMzg5ODMyfSx7eDowLjA4NDY2MTAxNjk0OTE1MjUxLCB5OjIuOTg5ODMwNTA4NDc0NTc2fSx7eDowLjA4MDQyMzcyODgxMzU1OTMsIHk6Mi45OTU3NjI3MTE4NjQ0MDY2fSx7eDowLjA4NjM1NTkzMjIwMzM4OTgzLCB5OjIuOTk5MTUyNTQyMzcyODgxM30se3g6MC4wNzg3Mjg4MTM1NTkzMjIwNCwgeTozLjAwNTA4NDc0NTc2MjcxMTd9LHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeTozLjAwODQ3NDU3NjI3MTE4NjR9LHt4OjAuMDgwNDIzNzI4ODEzNTU5MywgeTozLjAxMjcxMTg2NDQwNjc4fSx7eDowLjA4Mjk2NjEwMTY5NDkxNTI1LCB5OjMuMDIzNzI4ODEzNTU5MzIyfSx7eDowLjA4Mjk2NjEwMTY5NDkxNTI1LCB5OjMuMDM3Mjg4MTM1NTkzMjIwNH0se3g6MC4wODEyNzExODY0NDA2Nzc5MywgeTozLjA2NjEwMTY5NDkxNTI1NDR9LHt4OjAuMDgxMjcxMTg2NDQwNjc3OTMsIHk6My4wOTQwNjc3OTY2MTAxNjkzfSx7eDowLjA4NTUwODQ3NDU3NjI3MTIsIHk6My4xMTI3MTE4NjQ0MDY3Nzk1fSx7eDowLjA5MTQ0MDY3Nzk2NjEwMTY3LCB5OjMuMTIyMDMzODk4MzA1MDg0Nn0se3g6MC4xMDU4NDc0NTc2MjcxMTg2MSwgeTozLjEyNjI3MTE4NjQ0MDY3OH0se3g6MC4xMjM2NDQwNjc3OTY2MTAxNCwgeTozLjEyNzk2NjEwMTY5NDkxNTR9LHt4OjAuMTMyOTY2MTAxNjk0OTE1MjQsIHk6My4xNDE1MjU0MjM3Mjg4MTM1fSx7eDowLjEzMzgxMzU1OTMyMjAzMzg3LCB5OjMuMTkzMjIwMzM4OTgzMDUwN30se3g6MC4xMzcyMDMzODk4MzA1MDg0NSwgeTozLjIwODQ3NDU3NjI3MTE4NjZ9LHt4OjAuMTQ1Njc3OTY2MTAxNjk0OTIsIHk6My4yMTM1NTkzMjIwMzM4OTgzfSx7eDowLjE1NjY5NDkxNTI1NDIzNzMsIHk6My4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjE2OTQwNjc3OTY2MTAxNjkyLCB5OjMuMjExODY0NDA2Nzc5NjYxfSx7eDowLjE3NjE4NjQ0MDY3Nzk2NjA3LCB5OjMuMjE3Nzk2NjEwMTY5NDkxN30se3g6MC4xODEyNzExODY0NDA2Nzc5NywgeTozLjIwODQ3NDU3NjI3MTE4NjZ9LHt4OjAuMTg5NzQ1NzYyNzExODY0MzksIHk6My4yMTc3OTY2MTAxNjk0OTE3fSx7eDowLjE5MTQ0MDY3Nzk2NjEwMTcsIHk6My4yMTEwMTY5NDkxNTI1NDJ9LHt4OjAuMTk4MjIwMzM4OTgzMDUwODYsIHk6My4yMTYxMDE2OTQ5MTUyNTQzfSx7eDowLjIwMzMwNTA4NDc0NTc2MjcsIHk6My4yMDg0NzQ1NzYyNzExODY2fSx7eDowLjIwODM4OTgzMDUwODQ3NDYsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuMjEyNjI3MTE4NjQ0MDY3OCwgeTozLjIxMTAxNjk0OTE1MjU0Mn0se3g6MC4yMjE5NDkxNTI1NDIzNzI4NSwgeTozLjIxNjEwMTY5NDkxNTI1NDN9LHt4OjAuMjY4NTU5MzIyMDMzODk4MywgeTozLjIxNjEwMTY5NDkxNTI1NDN9LHt4OjAuMzc1MzM4OTgzMDUwODQ3NCwgeTozLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuMzg3MjAzMzg5ODMwNTA4NDUsIHk6My4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjM5NDgzMDUwODQ3NDU3NjMsIHk6My4yMTI3MTE4NjQ0MDY3Nzk2fSx7eDowLjQwNTg0NzQ1NzYyNzExODY2LCB5OjMuMjIwMzM4OTgzMDUwODQ3M30se3g6MC40MTAwODQ3NDU3NjI3MTE4NywgeTozLjIwOTMyMjAzMzg5ODMwNTN9LHt4OjAuNDIwMjU0MjM3Mjg4MTM1NTUsIHk6My4yMjAzMzg5ODMwNTA4NDczfSx7eDowLjQyNzAzMzg5ODMwNTA4NDcsIHk6My4yMDkzMjIwMzM4OTgzMDUzfSx7eDowLjQzMjk2NjEwMTY5NDkxNTMsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDM4ODk4MzA1MDg0NzQ1NzUsIHk6My4yMTAxNjk0OTE1MjU0MjM1fSx7eDowLjQ0OTkxNTI1NDIzNzI4ODEsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDcxMTAxNjk0OTE1MjU0MywgeTozLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuNDg2MzU1OTMyMjAzMzg5ODUsIHk6My4yMTc3OTY2MTAxNjk0OTE3fSx7eDowLjQ5NDgzMDUwODQ3NDU3NjI3LCB5OjMuMjIyMDMzODk4MzA1MDg0N30se3g6MC40OTk5MTUyNTQyMzcyODgxNiwgeTozLjIzNzI4ODEzNTU5MzIyfSx7eDowLjQ5OTkxNTI1NDIzNzI4ODE2LCB5OjMuMjc0NTc2MjcxMTg2NDQwNn0se3g6MC40OTk5MTUyNTQyMzcyODgxNiwgeTozLjMxNTI1NDIzNzI4ODEzNTd9LHt4OjAuNDk4MjIwMzM4OTgzMDUwOCwgeTozLjM0NDkxNTI1NDIzNzI4OH0se3g6MC40OTkwNjc3OTY2MTAxNjk1LCB5OjMuMzYyNzExODY0NDA2Nzc5NX0sIHt4OjAuNTA2Njk0OTE1MjU0MjM3MywgeTozLjM3NTQyMzcyODgxMzU1OTN9LHt4OjAuNTMyMTE4NjQ0MDY3Nzk2NSwgeTozLjM3Nzk2NjEwMTY5NDkxNTR9LHt4OjAuNTU1ODQ3NDU3NjI3MTE4NiwgeTozLjM3ODgxMzU1OTMyMjAzNH0se3g6MC41Njk0MDY3Nzk2NjEwMTY5LCB5OjMuMzgzODk4MzA1MDg0NzQ1OH0se3g6MC41NzYxODY0NDA2Nzc5NjYyLCB5OjMuMzk0OTE1MjU0MjM3Mjg4Mn0se3g6MC41NzYxODY0NDA2Nzc5NjYyLCB5OjMuNDExODY0NDA2Nzc5NjYxfSx7eDowLjU3NjE4NjQ0MDY3Nzk2NjIsIHk6My40NjI3MTE4NjQ0MDY3Nzk2fSx7eDowLjU3NjE4NjQ0MDY3Nzk2NjIsIHk6My40NzcxMTg2NDQwNjc3OTd9LHt4OjAuNTgyMTE4NjQ0MDY3Nzk2NiwgeTozLjQ4MzA1MDg0NzQ1NzYyN30se3g6MC41ODk3NDU3NjI3MTE4NjQzLCB5OjMuNDg4OTgzMDUwODQ3NDU3NX0se3g6MC42MTg1NTkzMjIwMzM4OTgzLCB5OjMuNDkwNjc3OTY2MTAxNjk1fSx7eDowLjY1MTYxMDE2OTQ5MTUyNTUsIHk6My40ODg5ODMwNTA4NDc0NTc1fSx7eDowLjY1NzU0MjM3Mjg4MTM1NTksIHk6My40ODA1MDg0NzQ1NzYyNzF9LHt4OjAuNjYwMDg0NzQ1NzYyNzExOSwgeTozLjQ2OTQ5MTUyNTQyMzcyODZ9LHt4OjAuNjU4Mzg5ODMwNTA4NDc0NSwgeTozLjQ1MDg0NzQ1NzYyNzExOX0se3g6MC42Njg1NTkzMjIwMzM4OTgzLCB5OjMuMzc5NjYxMDE2OTQ5MTUyM30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuNjMxNDU3NjI3MTE4NjQ0MSwgeTozLjA0NzcyMDMzODk4MzA1MX0se3g6MC42NjQ1MDg0NzQ1NzYyNzEyLCB5OjMuMDUxMTEwMTY5NDkxNTI1N30se3g6MC42ODU2OTQ5MTUyNTQyMzczLCB5OjMuMDQyNjM1NTkzMjIwMzM5M30se3g6MC42ODgyMzcyODgxMzU1OTMzLCB5OjMuMDE1NTE2OTQ5MTUyNTQyNn0se3g6MC42Njc4OTgzMDUwODQ3NDU4LCB5OjIuOTkwMDkzMjIwMzM4OTgzNH0se3g6MC42NzEyODgxMzU1OTMyMjAzLCB5OjIuOTY4OTA2Nzc5NjYxMDE3fSx7eDowLjY4MTQ1NzYyNzExODY0NDEsIHk6Mi45NTAyNjI3MTE4NjQ0MDd9LHt4OjAuNjY3MDUwODQ3NDU3NjI3MSwgeToyLjkzNDE2MTAxNjk0OTE1Mjh9LHt4OjAuNjM4MjM3Mjg4MTM1NTkzMiwgeToyLjkzNjcwMzM4OTgzMDUwOX0se3g6MC42MzkwODQ3NDU3NjI3MTE5LCB5OjIuOTUwMjYyNzExODY0NDA3fSx7eDowLjYxMDI3MTE4NjQ0MDY3NzksIHk6Mi45NjIxMjcxMTg2NDQwNjh9LHt4OjAuNjA3NzI4ODEzNTU5MzIyMSwgeToyLjk4NTg1NTkzMjIwMzM5fSx7eDowLjYyOTc2MjcxMTg2NDQwNjgsIHk6My4wMDE5NTc2MjcxMTg2NDR9LHt4OjAuNjE1MzU1OTMyMjAzMzg5OCwgeTozLjAzMDc3MTE4NjQ0MDY3OH0se3g6MC42MjU1MjU0MjM3Mjg4MTM2LCB5OjMuMDU0NX0pLFxuICBuZXcgQXJyYXkoe3g6MC42NTI2NDQwNjc3OTY2MTAxLCB5OjIuOTI5MDc2MjcxMTg2NDQwNn0se3g6MC42Njk1OTMyMjAzMzg5ODMsIHk6Mi45Mzc1NTA4NDc0NTc2Mjd9LHt4OjAuNjczODMwNTA4NDc0NTc2MywgeToyLjk2NzIxMTg2NDQwNjc3OTh9LHt4OjAuNjU4NTc2MjcxMTg2NDQwNywgeToyLjk3NjUzMzg5ODMwNTA4NX0se3g6MC42Mjg5MTUyNTQyMzcyODgxLCB5OjIuOTkzNDgzMDUwODQ3NDU3N30se3g6MC42MTI4MTM1NTkzMjIwMzM5LCB5OjMuMDA4NzM3Mjg4MTM1NTkzNn0se3g6MC42MTAyNzExODY0NDA2Nzc5LCB5OjMuMDM2NzAzMzg5ODMwNTA4NX0se3g6MC42MjYzNzI4ODEzNTU5MzIyLCB5OjMuMDUwMjYyNzExODY0NDA3fSx7eDowLjY1MzQ5MTUyNTQyMzcyODgsIHk6My4wNTM2NTI1NDIzNzI4ODEzfSx7eDowLjY2OTU5MzIyMDMzODk4MywgeTozLjA0MTc4ODEzNTU5MzIyMDZ9LHt4OjAuNjc1NTI1NDIzNzI4ODEzNSwgeTozLjAyNDgzODk4MzA1MDg0Nzh9LHt4OjAuNjUzNDkxNTI1NDIzNzI4OCwgeTozLjAwNjE5NDkxNTI1NDIzNzV9LHt4OjAuNjIyOTgzMDUwODQ3NDU3NiwgeToyLjk4NjcwMzM4OTgzMDUwODZ9LHt4OjAuNjE2MjAzMzg5ODMwNTA4NSwgeToyLjk1ODczNzI4ODEzNTU5MzN9LHt4OjAuNjUzNDkxNTI1NDIzNzI4OCwgeToyLjk0MzQ4MzA1MDg0NzQ1OH0se3g6MC42NTQzMzg5ODMwNTA4NDc1LCB5OjIuOTM2NzAzMzg5ODMwNTA5fSlcbik7XG52YXIgcHJlZ25hbnRTZWxlY3RlZCA9IGZhbHNlO1xudmFyIG5vblByZWduYW50U2VsZWN0ZWQgPSBmYWxzZTtcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBBbmltYXRpb25zXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbnZhciBjYW52YXMsIGNhbnZhczIsIGNhbnZhczMsIGNhbnZhczQsIGNhbnZhczUsIGNvbnRleHQsIGNvbnRleHQyLCBjb250ZXh0MywgY29udGV4dDQsIGNvbnRleHQ1O1xudmFyIG1vc3F1aXRvc0FycmF5ID0gbmV3IEFycmF5KClcbnZhciB0b3RhbE1vc3F1aXRvcyA9IDEwMDtcbnZhciBzdG9wTWFpbiA9IGZhbHNlO1xudmFyIGN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMDtcbnZhciBjdXJyZW50UGhhc2UgPSAwO1xudmFyIG1vc3F1aXRvc0xlZnQgPSB0b3RhbE1vc3F1aXRvcztcbnZhciBwcmVnbmFudE1vc3F1aXRvcyA9IDA7XG52YXIgbGVmdENvdmVyR2xhc3MsIHJpZ2h0Q292ZXJHbGFzcywgbGVmdENvdmVyR2xhc3NIb3ZlciwgcmlnaHRDb3ZlckdsYXNzSG92ZXI7XG52YXIgaG92ZXJCZWhhdmlvckltYWdlcyA9IG5ldyBBcnJheShcImljb24xX2hvdmVyLnBuZ1wiLFwiaWNvbjJfaG92ZXIucG5nXCIsXCJpY29uM19ob3Zlci5wbmdcIixcImljb240X2hvdmVyLnBuZ1wiLFwiaWNvbjVfaG92ZXIucG5nXCIsXCJpY29uNl9ob3Zlci5wbmdcIixcImljb243X2hvdmVyLnBuZ1wiLFwiaWNvbjhfaG92ZXIucG5nXCIsXCJpY29uOV9ob3Zlci5wbmdcIik7XG52YXIgYmVoYXZpb3JJbWFnZXMgPSBuZXcgQXJyYXkoXCJpY29uMS5wbmdcIixcImljb24yLnBuZ1wiLFwiaWNvbjMucG5nXCIsXCJpY29uNC5wbmdcIixcImljb241LnBuZ1wiLFwiaWNvbjYucG5nXCIsXCJpY29uNy5wbmdcIixcImljb244LnBuZ1wiLFwiaWNvbjkucG5nXCIpO1xudmFyIHRhYmxldFRyZXNob2xkID0gOTAwO1xudmFyIG1vYmlsZVRyZXNob2xkID0gNjAwO1xuLyoqXG4gIFRoZSBjYW52YXNJbWFnZSBjbGFzcyByZXByZXNlbnRzIGFuIGVsZW1lbnQgZHJhd24gb24gdGhlIGNhbnZhcy5cbiBcbiAgQGNsYXNzIENhbnZhc0ltYWdlXG4gIEBjb25zdHJ1Y3RvclxuKi9cbmZ1bmN0aW9uIENhbnZhc0ltYWdlKGltZywgeCwgeSwgYW5nbGUsIHNwZWVkLCB0eXBlLCBjdXJyZW50SW1hZ2UsIHBvc2l0aW9uc0FycmF5KSB7XG4gIHRoaXMuaW1hZ2UgPSBpbWc7XG4gIHRoaXMueCA9IHg7XG4gIHRoaXMueSA9IHk7XG4gIHRoaXMueEFtb3VudCA9IDA7XG4gIHRoaXMueUFtb3VudCA9IDA7XG4gIHRoaXMud2lkdGggPSBpbWcud2lkdGg7XG4gIHRoaXMuaGVpZ2h0ID0gaW1nLmhlaWdodDtcbiAgdGhpcy5wb3NpdGlvbiA9IDE7XG4gIHRoaXMuYW5nbGUgPSBhbmdsZTtcbiAgdGhpcy5zcGVlZCA9IHNwZWVkO1xuICB0aGlzLnR5cGUgPSB0eXBlO1xuICB0aGlzLmN1cnJlbnRJbWFnZSA9IGN1cnJlbnRJbWFnZTtcbiAgdGhpcy5maXJzdFRpbWUgPSBmYWxzZTtcbiAgdGhpcy5jdXJyZW50UG9zaXRpb24gPSAwO1xuICB0aGlzLnBvc2l0aW9uc0FycmF5ID0gcG9zaXRpb25zQXJyYXk7XG4gIHRoaXMuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAwO1xuICB0aGlzLmZsaXBwZWRJbWFnZXMgPSBuZXcgQXJyYXkoKTtcbiAgcmV0dXJuIHRoaXM7XG59XG4vL1NldHVwIHJlcXVlc3QgYW5pbWF0aW9uIGZyYW1lXG52YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24odGltZSkge1xuICBpZiAoIXN0b3BNYWluKSB7XG4gICAgbWFpbih0aW1lKTtcbiAgfVxuICBcbiAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZXF1ZXN0QW5pbWF0aW9uRnJhbWUpO1xufVxudmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZUluaXRpYWxpemF0aW9uID0gZnVuY3Rpb24oKXtcbiAgdmFyIGxhc3RUaW1lID0gMDtcbiAgdmFyIHZlbmRvcnMgPSBbJ21zJywgJ21veicsICd3ZWJraXQnLCAnbyddO1xuICBmb3IodmFyIHggPSAwOyB4IDwgdmVuZG9ycy5sZW5ndGggJiYgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsreCkge1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdmVuZG9yc1t4XSsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gIH1cbiBcbiAgaWYgKCF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgdGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKTtcbiAgICAgICAgdmFyIGlkID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7IH0sXG4gICAgICAgICAgdGltZVRvQ2FsbCk7XG4gICAgICAgIGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfTtcbiAgfVxuIFxuICBpZiAoIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICBjbGVhclRpbWVvdXQoaWQpO1xuICAgIH07XG4gIH1cbn1cbi8vU2V0dXAgbWFpbiBsb29wXG52YXIgc2V0dXBNYWluTG9vcCA9IGZ1bmN0aW9uKCl7XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZUluaXRpYWxpemF0aW9uKCk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcbiAgICAgIGN1cnJlbnRQaGFzZSA9IDE7XG4gICAgICAkKCcjcGdTdGVwMSAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgIH0sIDMwMDApO1xufVxuLy9FeGVjdXRlIG1haW4gbG9vcFxudmFyIG1haW4gPSBmdW5jdGlvbih0aW1lKXtcbiAgaWYgKGN1cnJlbnRQaGFzZSA9PSAyMCB8fCBjdXJyZW50UGhhc2UgPT0gMjEpIHtcbiAgY29udGV4dDUuY2xlYXJSZWN0KDAsIDAsIGNvbnRleHQ1LmNhbnZhcy53aWR0aCwgY29udGV4dDUuY2FudmFzLmhlaWdodCk7XG4gIC8qc3dpdGNoIChsZWZ0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSkge1xuICAgIGNhc2UgMDoqL1xuICAgICAgdmFyIGxlZnRHbGFzc0NvbnRyb2xIb3ZlciA9IGZhbHNlO1xuICAgICAgaWYgKCgobGVmdENvdmVyR2xhc3NIb3Zlci54ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci54RGlyKSB8fCAobGVmdENvdmVyR2xhc3NIb3Zlci54IDwgbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWxlZnRDb3ZlckdsYXNzSG92ZXIueERpcikgfHwgKGxlZnRDb3ZlckdsYXNzSG92ZXIueCA9PSBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgXG4gICAgICAgICAgICgobGVmdENvdmVyR2xhc3NIb3Zlci55ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyKSB8fCAobGVmdENvdmVyR2xhc3NIb3Zlci55IDwgbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWxlZnRDb3ZlckdsYXNzSG92ZXIueURpcikgfHwgKGxlZnRDb3ZlckdsYXNzSG92ZXIueSA9PSBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55KSkpIHtcblxuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IGxlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPj0gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uID0gbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gLSAxO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRQaGFzZSA+IDIwKSB7XG4gICAgICAgICAgICAgIGxlZnRHbGFzc0NvbnRyb2xIb3ZlciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvL2NvbnRleHQ1LmRyYXdJbWFnZShsZWZ0Q292ZXJHbGFzc0hvdmVyLmltYWdlW2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudEltYWdlXSwgcGFyc2VJbnQobGVmdENvdmVyR2xhc3NIb3Zlci54ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGxlZnRDb3ZlckdsYXNzSG92ZXIueSAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMTMpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTEzKSAqICg0Mi4wLzEzNS4wKSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci54ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci54RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci54RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzSG92ZXIueSA+IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueURpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueURpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWxlZnRHbGFzc0NvbnRyb2xIb3Zlcikge1xuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMobGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCAtIGxlZnRDb3ZlckdsYXNzSG92ZXIueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55IC0gbGVmdENvdmVyR2xhc3NIb3Zlci55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSByaWdodENvdmVyR2xhc3NIb3Zlci5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiByaWdodENvdmVyR2xhc3NIb3Zlci5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gcmlnaHRDb3ZlckdsYXNzSG92ZXIuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPSAoKGxlZnRDb3ZlckdsYXNzSG92ZXIueCA+IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggJiYgbGVmdENvdmVyR2xhc3NIb3Zlci54RGlyKSB8fCAobGVmdENvdmVyR2xhc3NIb3Zlci54IDwgbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhbGVmdENvdmVyR2xhc3NIb3Zlci54RGlyKSB8fCAobGVmdENvdmVyR2xhc3NIb3Zlci54ID09IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLngpKSA/IGxlZnRDb3ZlckdsYXNzSG92ZXIueCA6IChsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54IDwgbGVmdENvdmVyR2xhc3NIb3Zlci54KSA/IGxlZnRDb3ZlckdsYXNzSG92ZXIueCAtIHhBbW91bnQgOiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnggKyB4QW1vdW50O1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgPSAoKGxlZnRDb3ZlckdsYXNzSG92ZXIueSA+IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgJiYgbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyKSB8fCAobGVmdENvdmVyR2xhc3NIb3Zlci55IDwgbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyKSB8fCAobGVmdENvdmVyR2xhc3NIb3Zlci55ID09IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGxlZnRDb3ZlckdsYXNzSG92ZXIueSA6IChsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55IDwgbGVmdENvdmVyR2xhc3NIb3Zlci55KSA/IGxlZnRDb3ZlckdsYXNzSG92ZXIueSAtIHlBbW91bnQgOiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgKyB5QW1vdW50O1xuXG4gICAgICAgIC8vY29udGV4dDUuZHJhd0ltYWdlKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmltYWdlW2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudEltYWdlXSwgcGFyc2VJbnQobGVmdENvdmVyR2xhc3NIb3Zlci54ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTEzKSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjExMykgKiAoNDIuMC8xMzUuMCkpKTtcbiAgICAgIH1cblxuICB2YXIgcmlnaHRHbGFzc0NvbnRyb2xIb3ZlciA9IGZhbHNlO1xuICAgICAgaWYgKCgocmlnaHRDb3ZlckdsYXNzSG92ZXIueCA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpcikgfHwgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPCByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFyaWdodENvdmVyR2xhc3NIb3Zlci54RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzSG92ZXIueCA9PSByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLngpKSAmJiBcbiAgICAgICAgICAgKChyaWdodENvdmVyR2xhc3NIb3Zlci55ID4gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci55RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzSG92ZXIueSA8IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIXJpZ2h0Q292ZXJHbGFzc0hvdmVyLnlEaXIpIHx8IChyaWdodENvdmVyR2xhc3NIb3Zlci55ID09IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkpKSB7XG5cbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uID0gcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAocmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uID49IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uID0gcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uIC0gMTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UGhhc2UgPiAyMCkge1xuICAgICAgICAgICAgICByaWdodEdsYXNzQ29udHJvbEhvdmVyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vY29udGV4dDUuZHJhd0ltYWdlKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmltYWdlW3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRJbWFnZV0sIHBhcnNlSW50KHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQocmlnaHRDb3ZlckdsYXNzSG92ZXIueSAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMTMpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTEzKSAqICg0Mi4wLzEzNS4wKSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAocmlnaHRDb3ZlckdsYXNzSG92ZXIueCA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmlnaHRDb3ZlckdsYXNzSG92ZXIueSA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFyaWdodEdsYXNzQ29udHJvbEhvdmVyKSB7XG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhyaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggLSByaWdodENvdmVyR2xhc3NIb3Zlci54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSAtIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogcmlnaHRDb3ZlckdsYXNzSG92ZXIuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSByaWdodENvdmVyR2xhc3NIb3Zlci5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPSAoKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggJiYgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpcikgfHwgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPCByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggJiYgIXJpZ2h0Q292ZXJHbGFzc0hvdmVyLnhEaXIpIHx8IChyaWdodENvdmVyR2xhc3NIb3Zlci54ID09IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gcmlnaHRDb3ZlckdsYXNzSG92ZXIueCA6IChyaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggPCByaWdodENvdmVyR2xhc3NIb3Zlci54KSA/IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggLSB4QW1vdW50IDogcmlnaHRDb3ZlckdsYXNzSG92ZXIueCArIHhBbW91bnQ7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPSAoKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgJiYgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpcikgfHwgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPCByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgJiYgIXJpZ2h0Q292ZXJHbGFzc0hvdmVyLnlEaXIpIHx8IChyaWdodENvdmVyR2xhc3NIb3Zlci55ID09IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gcmlnaHRDb3ZlckdsYXNzSG92ZXIueSA6IChyaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgPCByaWdodENvdmVyR2xhc3NIb3Zlci55KSA/IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgLSB5QW1vdW50IDogcmlnaHRDb3ZlckdsYXNzSG92ZXIueSArIHlBbW91bnQ7XG5cbiAgICAgICAgLy9jb250ZXh0NS5kcmF3SW1hZ2UocmlnaHRDb3ZlckdsYXNzSG92ZXIuaW1hZ2VbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudEltYWdlXSwgcGFyc2VJbnQocmlnaHRDb3ZlckdsYXNzSG92ZXIueCAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChyaWdodENvdmVyR2xhc3NIb3Zlci55ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjExMyksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMTMpICogKDQyLjAvMTM1LjApKSk7XG4gICAgICB9XG5cbiAgY29udGV4dDMuY2xlYXJSZWN0KDAsIDAsIGNvbnRleHQzLmNhbnZhcy53aWR0aCwgY29udGV4dDMuY2FudmFzLmhlaWdodCk7XG4gIC8qc3dpdGNoIChsZWZ0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSkge1xuICAgIGNhc2UgMDoqL1xuICAgICAgdmFyIGxlZnRHbGFzc0NvbnRyb2wgPSBmYWxzZTtcbiAgICAgIGlmICgoKGxlZnRDb3ZlckdsYXNzLnggPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzLnhEaXIpIHx8IChsZWZ0Q292ZXJHbGFzcy54IDwgbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhbGVmdENvdmVyR2xhc3MueERpcikgfHwgKGxlZnRDb3ZlckdsYXNzLnggPT0gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgXG4gICAgICAgICAgICgobGVmdENvdmVyR2xhc3MueSA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3MueURpcikgfHwgKGxlZnRDb3ZlckdsYXNzLnkgPCBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFsZWZ0Q292ZXJHbGFzcy55RGlyKSB8fCAobGVmdENvdmVyR2xhc3MueSA9PSBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpKSkge1xuXG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA+PSBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiAtIDE7XG4gICAgICAgICAgICBpZiAoY3VycmVudFBoYXNlID4gMjApIHtcbiAgICAgICAgICAgICAgbGVmdEdsYXNzQ29udHJvbCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZXh0My5kcmF3SW1hZ2UobGVmdENvdmVyR2xhc3MuaW1hZ2VbbGVmdENvdmVyR2xhc3MuY3VycmVudEltYWdlXSwgcGFyc2VJbnQobGVmdENvdmVyR2xhc3MueCAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChsZWZ0Q292ZXJHbGFzcy55ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjEyNSksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMjUpICogKDIyNC4wLzE0OS4wKSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAobGVmdENvdmVyR2xhc3MueCA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobGVmdENvdmVyR2xhc3MueSA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFsZWZ0R2xhc3NDb250cm9sKSB7XG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggLSBsZWZ0Q292ZXJHbGFzcy54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSAtIGxlZnRDb3ZlckdsYXNzLnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogbGVmdENvdmVyR2xhc3Muc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGxlZnRDb3ZlckdsYXNzLnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGxlZnRDb3ZlckdsYXNzLnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBsZWZ0Q292ZXJHbGFzcy5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnggPSAoKGxlZnRDb3ZlckdsYXNzLnggPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggJiYgbGVmdENvdmVyR2xhc3MueERpcikgfHwgKGxlZnRDb3ZlckdsYXNzLnggPCBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggJiYgIWxlZnRDb3ZlckdsYXNzLnhEaXIpIHx8IChsZWZ0Q292ZXJHbGFzcy54ID09IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gbGVmdENvdmVyR2xhc3MueCA6IChsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggPCBsZWZ0Q292ZXJHbGFzcy54KSA/IGxlZnRDb3ZlckdsYXNzLnggLSB4QW1vdW50IDogbGVmdENvdmVyR2xhc3MueCArIHhBbW91bnQ7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnkgPSAoKGxlZnRDb3ZlckdsYXNzLnkgPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgJiYgbGVmdENvdmVyR2xhc3MueURpcikgfHwgKGxlZnRDb3ZlckdsYXNzLnkgPCBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWxlZnRDb3ZlckdsYXNzLnlEaXIpIHx8IChsZWZ0Q292ZXJHbGFzcy55ID09IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gbGVmdENvdmVyR2xhc3MueSA6IChsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgPCBsZWZ0Q292ZXJHbGFzcy55KSA/IGxlZnRDb3ZlckdsYXNzLnkgLSB5QW1vdW50IDogbGVmdENvdmVyR2xhc3MueSArIHlBbW91bnQ7XG5cbiAgICAgICAgY29udGV4dDMuZHJhd0ltYWdlKGxlZnRDb3ZlckdsYXNzLmltYWdlW2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRJbWFnZV0sIHBhcnNlSW50KGxlZnRDb3ZlckdsYXNzLnggKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQobGVmdENvdmVyR2xhc3MueSAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMjUpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTI1KSAqICgyMjQuMC8xNDkuMCkpKTtcbiAgICAgIH1cbiAgICAvKmJyZWFrO1xuICAgIGNhc2UgMTpcbiAgICBicmVhaztcbiAgICBjYXNlIDI6XG4gICAgYnJlYWs7XG4gIH0qL1xuICAgIHZhciByaWdodEdsYXNzQ29udHJvbCA9IGZhbHNlO1xuICAgICAgaWYgKCgocmlnaHRDb3ZlckdsYXNzLnggPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIpIHx8IChyaWdodENvdmVyR2xhc3MueCA8IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhcmlnaHRDb3ZlckdsYXNzLnhEaXIpIHx8IChyaWdodENvdmVyR2xhc3MueCA9PSByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmIFxuICAgICAgICAgICAoKHJpZ2h0Q292ZXJHbGFzcy55ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzLnkgPCByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIXJpZ2h0Q292ZXJHbGFzcy55RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzLnkgPT0gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpKSkge1xuXG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gPSByaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAocmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA+PSByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID0gcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiAtIDE7XG4gICAgICAgICAgICBpZiAoY3VycmVudFBoYXNlID4gMjApIHtcbiAgICAgICAgICAgICAgbGVmdEdsYXNzQ29udHJvbCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZXh0My5kcmF3SW1hZ2UocmlnaHRDb3ZlckdsYXNzLmltYWdlW3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50SW1hZ2VdLCBwYXJzZUludChyaWdodENvdmVyR2xhc3MueCAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChyaWdodENvdmVyR2xhc3MueSAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMjUpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTI1KSAqICgyMjQuMC8xNDkuMCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy54ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmlnaHRDb3ZlckdsYXNzLnkgPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXJpZ2h0R2xhc3NDb250cm9sKSB7XG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhyaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCAtIHJpZ2h0Q292ZXJHbGFzcy54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55IC0gcmlnaHRDb3ZlckdsYXNzLnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogcmlnaHRDb3ZlckdsYXNzLnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSByaWdodENvdmVyR2xhc3Muc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogcmlnaHRDb3ZlckdsYXNzLnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSByaWdodENvdmVyR2xhc3Muc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICByaWdodENvdmVyR2xhc3MueCA9ICgocmlnaHRDb3ZlckdsYXNzLnggPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCAmJiByaWdodENvdmVyR2xhc3MueERpcikgfHwgKHJpZ2h0Q292ZXJHbGFzcy54IDwgcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggJiYgIXJpZ2h0Q292ZXJHbGFzcy54RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzLnggPT0gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLngpKSA/IHJpZ2h0Q292ZXJHbGFzcy54IDogKHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54IDwgcmlnaHRDb3ZlckdsYXNzLngpID8gcmlnaHRDb3ZlckdsYXNzLnggLSB4QW1vdW50IDogcmlnaHRDb3ZlckdsYXNzLnggKyB4QW1vdW50O1xuICAgICAgICByaWdodENvdmVyR2xhc3MueSA9ICgocmlnaHRDb3ZlckdsYXNzLnkgPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSAmJiByaWdodENvdmVyR2xhc3MueURpcikgfHwgKHJpZ2h0Q292ZXJHbGFzcy55IDwgcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgJiYgIXJpZ2h0Q292ZXJHbGFzcy55RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzLnkgPT0gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpKSA/IHJpZ2h0Q292ZXJHbGFzcy55IDogKHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55IDwgcmlnaHRDb3ZlckdsYXNzLnkpID8gcmlnaHRDb3ZlckdsYXNzLnkgLSB5QW1vdW50IDogcmlnaHRDb3ZlckdsYXNzLnkgKyB5QW1vdW50O1xuXG4gICAgICAgIGNvbnRleHQzLmRyYXdJbWFnZShyaWdodENvdmVyR2xhc3MuaW1hZ2VbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRJbWFnZV0sIHBhcnNlSW50KHJpZ2h0Q292ZXJHbGFzcy54ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KHJpZ2h0Q292ZXJHbGFzcy55ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjEyNSksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMjUpICogKDIyNC4wLzE0OS4wKSkpO1xuICAgICAgfVxuXG4gICAgfVxuICAvLyBjbGVhciB0aGUgY2FudmFzXG4gIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNvbnRleHQuY2FudmFzLndpZHRoLCBjb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuXG4gIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgc3dpdGNoIChlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICBjYXNlIDI6XG4gICAgICBjYXNlIDQ6XG4gICAgICBjYXNlIDY6XG4gICAgICBjYXNlIDg6XG4gICAgICBjYXNlIDEwOlxuICAgICAgY2FzZSAxMjpcbiAgICAgIGNhc2UgMTQ6XG4gICAgICBjYXNlIDE2OlxuICAgICAgY2FzZSAxODpcbiAgICAgIGNhc2UgMjA6XG4gICAgICBjYXNlIDIyOlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIGVsZW1lbnQuY3VycmVudEltYWdlID0gZWxlbWVudC5jdXJyZW50SW1hZ2UgKyAxO1xuICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50SW1hZ2UgPj0gZWxlbWVudC5pbWFnZS5sZW5ndGgpIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRJbWFnZSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UzW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC4wODYsTWF0aC5taW4oMC4xMzUsIGF1eEVsZW1lbnQueCkpICsgMC4wMTtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gTWF0aC5tYXgoMC41NTUsTWF0aC5taW4oMC43MTUsIGF1eEVsZW1lbnQueSkpICsgMC4wNDtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGN1cnJlbnRQaGFzZSA9IDI7XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxIC5wZy1idXR0b24nKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjEgc2VsZWN0JykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDI7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U1W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC4wNzYsTWF0aC5taW4oMC4xNSwgYXV4RWxlbWVudC54KSkgKyAwLjAxO1xuICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBNYXRoLm1heCgwLjgxLE1hdGgubWluKDAuODYsIGF1eEVsZW1lbnQueSkpICsgMC4wNTtcbiAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjE0IHx8IGF1eEVsZW1lbnQueCA8PSAwLjA4Nykge1xuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMC44Mikge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gYXV4RWxlbWVudC55ICsgMC4wNDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXV4RWxlbWVudC55ID49IDAuODMpIHtcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IGF1eEVsZW1lbnQueSAtIDAuMDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vZWxlbWVudC54ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICAgICAgICAgIC8vZWxlbWVudC55ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDQ7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjdXJyZW50UGhhc2UgPSAzO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT0gbW9zcXVpdG9zTGVmdCAtIDEpIHtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAyIC5wZy1idXR0b25cIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDJcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTdbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3Lmxlbmd0aF07XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54ID49IDAuNDIgfHwgYXV4RWxlbWVudC54IDw9IDAuMzkpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDEuMjA2NjEwMTY5NDkxNTI2KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjIwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhdXhFbGVtZW50LnkgPj0gMS4yOCkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4yODtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjQ5KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSAwLjQ5XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPD0gMC4zNikge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC4zNlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55ID49IDEuMykge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4zXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS4xOSkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4xOVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgLy9lbGVtZW50LnggPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54O1xuICAgICAgICAgICAgLy9lbGVtZW50LnkgPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55O1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gNjtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICAvL2VsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5Lmxlbmd0aF07XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDIgLnBnLWJ1dHRvblwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAyXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuXG4gICAgICAgICAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjIgLnBnLWJ1dHRvbicpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcblxuICAgICAgICAgICAgICAkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJykucmVtb3ZlQ2xhc3MoXCJkaXNhYmxlZC1vcHRpb25cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTkubGVuZ3RoXTtcblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54ID49IDAuODg1IHx8IGF1eEVsZW1lbnQueCA8PSAwLjgwNikge1xuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS40ODcpIHtcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IDEuNDg3O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhdXhFbGVtZW50LnkgPj0gMS41NTgpIHtcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IDEuNTU4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54ID49IDAuODk4KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSAwLjg5ODtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA8PSAwLjc5KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSAwLjc5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55ID49IDEuNTcpIHtcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IDEuNTc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS40Nykge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS40NztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gYXV4RWxlbWVudC54ICsgMC4wNTc7XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gYXV4RWxlbWVudC55ICsgMC4xMTU7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vZWxlbWVudC54ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICAgICAgICAgIC8vZWxlbWVudC55ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDg7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgOTpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgLy9lbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExLmxlbmd0aF07XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDMgLnBnLWJ1dHRvblwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwM1wiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTFbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApIC0gMC4wMTgsIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxMDtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxMTpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgLy9lbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxM1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEzLmxlbmd0aF07XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDMgLnBnLWJ1dHRvblwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAzXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuXG4gICAgICAgICAgICAgICQoXCIucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKS5yZW1vdmVDbGFzcyhcImRpc2FibGVkLW9wdGlvblwiKTtcbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMyAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEzW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTMubGVuZ3RoXTtcblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSkgKiAxLjApICsgMC4wMDUsIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApIC0gMC4wMSArIDAuMjc1fTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTI7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTM6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE1Lmxlbmd0aF07XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpICogMS4wKSArIDAuMDA1LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSAtIDAuMDEgKyAwLjI3NX07XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE0O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE1OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTdbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCkgKyAwLjAwNSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCkgKyAwLjI3NX07XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE2O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE3OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTlbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSArIDAuMzV9O1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxODtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxOTpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIxW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjEubGVuZ3RoXTtcblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCkgKyAwLjM1fTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjA7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjE6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vIFRPIERPXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdKVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKHt4OiBlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLnggKyAoKE1hdGgucmFuZG9tKCkgKiAwLjA2NikgLSAwLjAzMyksIHk6IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0ueSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDY2KSAtIDAuMDMzKX0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vZWxlbWVudC54ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICAgICAgICAgIC8vZWxlbWVudC55ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDIyO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIFxuICB9KTtcbn1cbi8vQW5pbWF0ZSBiZWhhdmlvciBlbGVtZW50c1xudmFyIGFuaW1hdGVCZWhhdmlvckVsZW1lbnRzID0gZnVuY3Rpb24oKSB7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VlbnRlclwiLCBcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb246bm90KC5kaXNhYmxlZC1vcHRpb24pXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmICghJCh0aGlzKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICAkKHRoaXMpLmZpbmQoXCJpbWdcIikuYXR0cihcInNyY1wiLCBcImh0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvXCIgKyBob3ZlckJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gIH0pO1xuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlbGVhdmVcIiwgXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKVwiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoISQodGhpcykuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkge1xuICAgICAgJCh0aGlzKS5maW5kKFwiaW1nXCIpLmF0dHIoXCJzcmNcIiwgXCJodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL1wiICsgYmVoYXZpb3JJbWFnZXNbJCh0aGlzKS5hdHRyKFwiZGF0YS1pbmRleFwiKV0pO1xuICAgIH1cbiAgfSk7XG59O1xuLy9BbmltYXRlIHByZWduYW5jeSBlbGVtZW50c1xudmFyIGFuaW1hdGVFbGVtZW50c1ByZWduYW5jeSA9IGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlZW50ZXJcIiwgXCIucGdTdGVwX19wcmVnbmFuY3ktb2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgaWYgKGN1cnJlbnRQaGFzZSA9PSAyMCkge1xuICAgICAgJChcIiNsZWZ0LWdsYXNzLWNvdmVyLCAjbGVmdC1nbGFzcy1jb3Zlci1taWRcIikuYW5pbWF0ZSh7XG4gICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNsZWZ0LWdsYXNzLWNvdmVyXCIpLmhlaWdodCgpICogMC4wMDEpICsgXCJweFwiXG4gICAgICB9LCAyMDApO1xuXG4gICAgaWYgKGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlICE9IDIpIHtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMVxuICAgICAgbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC4yOTEseTooMzQxNS4wL2NhbnZhczMud2lkdGgpfSwge3g6MC4yOTEseTooMzQxNS4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9KTtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MueCA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MueSA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC4yOTgseTooMzU5My4wL2NhbnZhczMud2lkdGgpfSwge3g6MC4yOTgseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9KTtcbiAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgIGlmIChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci55ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB9KTtcbiAgJChkb2N1bWVudCkub24oXCJtb3VzZWxlYXZlXCIsIFwiLnBnU3RlcF9fcHJlZ25hbmN5LW9rXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICAgICQoXCIjbGVmdC1nbGFzcy1jb3ZlciwgI2xlZnQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICBtYXJnaW5Ub3A6IFwiMHB4XCJcbiAgICAgIH0sIDIwMCk7XG4gICAgaWYgKGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlICE9IDIpIHtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMFxuICAgICAgbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC4yOTEseTooMzQxNS4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9LCB7eDowLjI5MSx5OigzNDE1LjAvY2FudmFzMy53aWR0aCl9KTtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MueCA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MueSA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC4yOTgseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9LCB7eDowLjI5OCx5OigzNTkzLjAvY2FudmFzMy53aWR0aCl9KTtcbiAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgIGlmIChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci55ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB9KTtcbiAgJChkb2N1bWVudCkub24oXCJtb3VzZWVudGVyXCIsIFwiLnBnU3RlcF9fcHJlZ25hbmN5LWtvXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXIsICNyaWdodC1nbGFzcy1jb3Zlci1taWRcIikuYW5pbWF0ZSh7XG4gICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNyaWdodC1nbGFzcy1jb3ZlclwiKS5oZWlnaHQoKSAqIDAuMDAxKSArIFwicHhcIlxuICAgICAgfSwgMjAwKTtcbiAgICBpZiAocmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlICE9IDIpIHtcbiAgICAgIHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDFcbiAgICAgIHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDowLjU5NzUseTooMzQxNS4wL2NhbnZhczMud2lkdGgpfSwge3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKSAtIDAuMDA1fSk7XG4gICAgICByaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgIGlmIChyaWdodENvdmVyR2xhc3MueCA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy55ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuNTk3NSx5OigzNTkzLjAvY2FudmFzMy53aWR0aCl9LCB7eDowLjU5NzUseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9KTtcbiAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzSG92ZXIueCA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzSG92ZXIueSA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpciA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VsZWF2ZVwiLCBcIi5wZ1N0ZXBfX3ByZWduYW5jeS1rb1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgICAkKFwiI3JpZ2h0LWdsYXNzLWNvdmVyLCAjcmlnaHQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICBtYXJnaW5Ub3A6IFwiMHB4XCJcbiAgICAgIH0sIDIwMCk7XG4gICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSAhPSAyKSB7XG4gICAgICByaWdodENvdmVyR2xhc3MuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAwXG4gICAgICByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKSAtIDAuMDA1fSwge3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKX0pO1xuICAgICAgcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzLnggPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChyaWdodENvdmVyR2xhc3MueSA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDowLjU5NzUseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9LCB7eDowLjU5NzUseTooMzU5My4wL2NhbnZhczMud2lkdGgpfSk7XG4gICAgICByaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICB9XG4gIH0pO1xufVxuLy9TZXR1cCBjYW52YXNcbnZhciBzZXR1cENhbnZhcyA9IGZ1bmN0aW9uKCl7XG4gIGNhbnZhczIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWxlbWVudHNDYW52YXMnKTtcbiAgY2FudmFzMi53aWR0aCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS53aWR0aCgpO1xuICBjYW52YXMyLmhlaWdodCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS5oZWlnaHQoKSArIDA7XG4gIGNhbnZhczIuc3R5bGUud2lkdGggID0gY2FudmFzMi53aWR0aC50b1N0cmluZygpICsgXCJweFwiO1xuICBjYW52YXMyLnN0eWxlLmhlaWdodCA9IGNhbnZhczIuaGVpZ2h0LnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNvbnRleHQyID0gY2FudmFzMi5nZXRDb250ZXh0KCcyZCcpO1xuICBjb250ZXh0Mi5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcblxuICBjYW52YXMzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FuaW1hdGlvbkNhbnZhcycpO1xuICBjYW52YXMzLndpZHRoID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLndpZHRoKCk7XG4gIGNhbnZhczMuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLmhlaWdodCgpO1xuICBjYW52YXMzLnN0eWxlLndpZHRoICA9IGNhbnZhczMud2lkdGgudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY2FudmFzMy5zdHlsZS5oZWlnaHQgPSBjYW52YXMzLmhlaWdodC50b1N0cmluZygpICsgXCJweFwiO1xuICBjb250ZXh0MyA9IGNhbnZhczMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY29udGV4dDMuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5cbiAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vc3F1aXRvc0NhbnZhcycpO1xuICBjYW52YXMud2lkdGggPSAkKCcucGdDaGFydC13cmFwcGVyJykud2lkdGgoKTtcbiAgY2FudmFzLmhlaWdodCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS5oZWlnaHQoKTtcbiAgY2FudmFzLnN0eWxlLndpZHRoICA9IGNhbnZhcy53aWR0aC50b1N0cmluZygpICsgXCJweFwiO1xuICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gY2FudmFzLmhlaWdodC50b1N0cmluZygpICsgXCJweFwiO1xuICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5cbiAgY2FudmFzNCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdob3ZlckNhbnZhcycpO1xuICBjYW52YXM0LndpZHRoID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLndpZHRoKCk7XG4gIGNhbnZhczQuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLmhlaWdodCgpO1xuICBjYW52YXM0LnN0eWxlLndpZHRoICA9IGNhbnZhczQud2lkdGgudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY2FudmFzNC5zdHlsZS5oZWlnaHQgPSBjYW52YXM0LmhlaWdodC50b1N0cmluZygpICsgXCJweFwiO1xuICBjb250ZXh0NCA9IGNhbnZhczQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY29udGV4dDQuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5cbiAgY2FudmFzNSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnbGFzc0FuaW1hdGlvbkNhbnZhcycpO1xuICBjYW52YXM1LndpZHRoID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLndpZHRoKCk7XG4gIGNhbnZhczUuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLmhlaWdodCgpO1xuICBjYW52YXM1LnN0eWxlLndpZHRoICA9IGNhbnZhczUud2lkdGgudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY2FudmFzNS5zdHlsZS5oZWlnaHQgPSBjYW52YXM1LmhlaWdodC50b1N0cmluZygpICsgXCJweFwiO1xuICBjb250ZXh0NSA9IGNhbnZhczUuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY29udGV4dDUuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5cbiAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY29udGV4dC5jYW52YXMud2lkdGgsIGNvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gIGNvbnRleHQyLmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0LmNhbnZhcy53aWR0aCwgY29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgY29udGV4dDMuY2xlYXJSZWN0KDAsIDAsIGNvbnRleHQuY2FudmFzLndpZHRoLCBjb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICBjb250ZXh0NC5jbGVhclJlY3QoMCwgMCwgY29udGV4dC5jYW52YXMud2lkdGgsIGNvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gIGNvbnRleHQ1LmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0NS5jYW52YXMud2lkdGgsIGNvbnRleHQ1LmNhbnZhcy5oZWlnaHQpO1xuICBcbiAgY29udGV4dDIuZmlsbFN0eWxlID0gXCIjZjhmOGY4XCI7XG4gIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAvKmNvbnRleHQyLmZpbGxSZWN0KCQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjEnKS5wb3NpdGlvbigpLmxlZnQsIDAsICQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCksIGNhbnZhczIuaGVpZ2h0KTtcbiAgICBjb250ZXh0Mi5maWxsUmVjdCgkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykucG9zaXRpb24oKS5sZWZ0LCAwLCAkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpLCBjYW52YXMyLmhlaWdodCk7XG4gICAgY29udGV4dDIuZmlsbFJlY3QoJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMycpLnBvc2l0aW9uKCkubGVmdCwgMCwgJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSwgY2FudmFzMi5oZWlnaHQpOyovXG4gIH1cbiAgZWxzZSB7XG4gICAgY29udGV4dDIuZmlsbFJlY3QoMCwgZ2V0T2Zmc2V0KCQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjEnKVswXSkudG9wIC0gZ2V0T2Zmc2V0KCQoXCIucGdBcnRpY2xlXCIpWzBdKS50b3AgLSAkKCcjbmF2LWJhcicpLmhlaWdodCgpLCBjYW52YXMyLndpZHRoLCAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxJykuaGVpZ2h0KCkpO1xuICAgIGNvbnRleHQyLmZpbGxSZWN0KDAsIGdldE9mZnNldCgkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJylbMF0pLnRvcCAtIGdldE9mZnNldCgkKFwiLnBnQXJ0aWNsZVwiKVswXSkudG9wIC0gJCgnI25hdi1iYXInKS5oZWlnaHQoKSwgY2FudmFzMi53aWR0aCwgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLmhlaWdodCgpKTtcbiAgICBjb250ZXh0Mi5maWxsUmVjdCgwLCBnZXRPZmZzZXQoJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMycpWzBdKS50b3AgLSBnZXRPZmZzZXQoJChcIi5wZ0FydGljbGVcIilbMF0pLnRvcCAtICQoJyNuYXYtYmFyJykuaGVpZ2h0KCksIGNhbnZhczIud2lkdGgsICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5oZWlnaHQoKSk7XG4gIH1cblxuICB2YXIgcGljdHVyZTEgPSBuZXcgSW1hZ2UoKTtcbiAgcGljdHVyZTEuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAvL2NvbnRleHQyLmRyYXdJbWFnZShwaWN0dXJlMSwgcGFyc2VJbnQoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAtICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC41NSkgLSAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAqIDAuMDY0KSksIDAsIHBhcnNlSW50KCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjU1KSwgcGFyc2VJbnQoKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjU1KSAqICg1MzYuMC82NTYuMCkpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UocGljdHVyZTEsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjU1KSAtIChjYW52YXMud2lkdGggKiAwLjA2NCkpLCAwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjU1KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNTUpICogKDUzNi4wLzY1Ni4wKSkpO1xuICAgIH1cbiAgICAgIHZhciBwaWN0dXJlMUhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgICBwaWN0dXJlMUhvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAvL2NvbnRleHQ0LmRyYXdJbWFnZShwaWN0dXJlMUhvdmVyLCBwYXJzZUludCgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIC0gKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjU1KSAtICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC4wNjQpKSwgMCwgcGFyc2VJbnQoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAqIDAuNTUpLCBwYXJzZUludCgoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAqIDAuNTUpICogKDUzNi4wLzY1Ni4wKSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZShwaWN0dXJlMUhvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC41NSkgLSAoY2FudmFzLndpZHRoICogMC4wNjQpKSwgMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC41NSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjU1KSAqICg1MzYuMC82NTYuMCkpKTtcbiAgICAgICAgfVxuICAgICAgICBjb250ZXh0NC5kcmF3SW1hZ2UocGljdHVyZTFIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoIC0gKGNhbnZhcy53aWR0aCAqIDAuNTUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMDY0KSksIDAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuNTUpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC41NSkgKiAoNTM2LjAvNjU2LjApKSk7XG4gICAgICB9KTtcbiAgICAgIHBpY3R1cmUxSG92ZXIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdGVycmFyaXVtLWhvdmVyLnBuZyc7XG5cbiAgICAgIHZhciB0dWJlMSA9IG5ldyBJbWFnZSgpO1xuICAgICAgdHViZTEuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIC8vY29udGV4dDIuZHJhd0ltYWdlKHR1YmUxLCBwYXJzZUludCgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIC0gKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjU1KSAtICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC4wNTg1KSAtICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC4zNjA1MSkpLCBwYXJzZUludCgoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAqIDAuMzYwNTEpICogKDMwMC4wLzQzMC4wKSkgKiAwLjU1LCBwYXJzZUludCgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC4zNjA1MSksIHBhcnNlSW50KCgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC4zNjA1MSkgKiAoMzAwLjAvNDMwLjApKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmUxLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC41NSkgLSAoY2FudmFzLndpZHRoICogMC4wNTg1KSAtIChjYW52YXMud2lkdGggKiAwLjM2MDUxKSksIDIzNSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4zNjA1MSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjM2MDUxKSAqICgzMDAuMC80MzAuMCkpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0dWJlMS5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlMS5wbmcnO1xuICB9KTtcbiAgcGljdHVyZTEuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdGVycmFyaXVtLnBuZyc7XG5cbiAgdmFyIHR1YmUyID0gbmV3IEltYWdlKCk7XG4gIHR1YmUyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnRleHQyLmRyYXdJbWFnZSh0dWJlMiwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4wMzQ1KSwgNTMwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjE0NjcyKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTQ2NzIpICogKDYyMi4wLzE3NS4wKSkpO1xuICAgIH1cbiAgfSk7XG4gIHR1YmUyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL3R1YmUyLnBuZyc7XG5cbiAgdmFyIHR1YmUzID0gbmV3IEltYWdlKCk7XG4gIHR1YmUzLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnRleHQyLmRyYXdJbWFnZSh0dWJlMywgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4wNTQ1KSwgMTExNSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC44MDczKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuODA3MykgKiAoNTE3LjAvOTYzLjApKSk7XG4gICAgfVxuICAgIHZhciB0dWJlM0hvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTNIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZSh0dWJlM0hvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjA1NDUpLCAxMTE1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjgwNzMpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC44MDczKSAqICg1MTcuMC85NjMuMCkpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0dWJlM0hvdmVyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL3R1YmUzLWhvdmVyLnBuZyc7XG4gIH0pO1xuICB0dWJlMy5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlMy5wbmcnO1xuXG4gIHZhciB0dWJlNSA9IG5ldyBJbWFnZSgpO1xuICB0dWJlNS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTUsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjgwMTUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMTMzKSksIDIxMjAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuODAxNSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjgwMTUpICogKDUxMC4wLzk1Ni4wKSkpO1xuICAgIH1cblxuICAgIHZhciB0dWJlNUhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTVIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZSh0dWJlNUhvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC44MDE1KSAtIChjYW52YXMud2lkdGggKiAwLjEzMykpLCAyMTIwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjgwMTUpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC44MDE1KSAqICg1MTAuMC85NTYuMCkpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0dWJlNUhvdmVyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL3R1YmU1LWhvdmVyLnBuZyc7ICBcblxuICAgIHZhciB0dWJlNCA9IG5ldyBJbWFnZSgpO1xuICAgIHR1YmU0LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmU0LCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC4xMzU4KSAtIChjYW52YXMud2lkdGggKiAwLjA4KSkgLSAzLCAxNjE4LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjEzNTgpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC4xMzU4KSAqICg2MDAuMC8xNjIuMCkpKTtcbiAgICAgIH1cbiAgICAgIHZhciB0dWJlNEhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgICB0dWJlNEhvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0NC5kcmF3SW1hZ2UodHViZTRIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoIC0gKGNhbnZhcy53aWR0aCAqIDAuMTM1OCkgLSAoY2FudmFzLndpZHRoICogMC4wOCkpIC0gMywgMTYxOCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMzU4KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTM1OCkgKiAoNjAwLjAvMTYyLjApKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdHViZTRIb3Zlci5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlNC1ob3Zlci5wbmcnO1xuICAgIH0pO1xuICAgIHR1YmU0LnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL3R1YmU0LnBuZyc7XG5cbiAgfSk7XG4gIHR1YmU1LnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL3R1YmU1LnBuZyc7ICBcblxuICB2YXIgdHViZTYgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTYuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmU2LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjAyOCksIDI2MjEsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTM4MyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjEzODMpICogKDU5Mi4wLzE2NS4wKSkpO1xuICAgIH1cbiAgICB2YXIgdHViZTZIb3ZlciA9IG5ldyBJbWFnZSgpO1xuICAgIHR1YmU2SG92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb250ZXh0NC5kcmF3SW1hZ2UodHViZTZIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4wMjgpLCAyNjIxLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjEzODMpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC4xMzgzKSAqICg1OTIuMC8xNjUuMCkpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0dWJlNkhvdmVyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL3R1YmU2LWhvdmVyLnBuZyc7XG4gIH0pO1xuICB0dWJlNi5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlNi5wbmcnO1xuXG4gIHZhciB0dWJlNyA9IG5ldyBJbWFnZSgpO1xuICB0dWJlNy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTcsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDYpLCAzMjAwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjY3MDcpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC42NzA3KSAqICg1NTIuMC84MDAuMCkpKTtcbiAgICB9XG4gICAgdmFyIGNvdmVyR2xhc3MgPSBuZXcgSW1hZ2UoKTtcbiAgICBjb3ZlckdsYXNzLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb250ZXh0My5kcmF3SW1hZ2UoY292ZXJHbGFzcywgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMjkxKSwgMzQxNSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTI1KSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjEyNSkgKiAoMjI0LjAvMTQ5LjApKSk7XG4gICAgICBjb250ZXh0My5kcmF3SW1hZ2UoY292ZXJHbGFzcywgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuNTk3NSksIDM0MTUsIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjEyNSksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMjUpICogKDIyNC4wLzE0OS4wKSkpO1xuICAgICAgXG4gICAgICBsZWZ0Q292ZXJHbGFzcyA9IG5ldyBDYW52YXNJbWFnZShbY292ZXJHbGFzc10sIDAuMjkxLCAoMzQxNS4wL2NhbnZhczMud2lkdGgpLCAwLCAwLjAwMDUsIDAsIDAsIG5ldyBBcnJheSh7eDowLjI5MSx5OigzNDE1LjAvY2FudmFzMy53aWR0aCl9KSk7XG4gICAgICByaWdodENvdmVyR2xhc3MgPSBuZXcgQ2FudmFzSW1hZ2UoW2NvdmVyR2xhc3NdLCAwLjU5NzUsICgzNDE1LjAvY2FudmFzMy53aWR0aCksIDAsIDAuMDAwNSwgMCwgMCwgbmV3IEFycmF5KHt4OjAuNTk3NSx5OigzNDE1LjAvY2FudmFzMy53aWR0aCl9KSlcblxuICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzID4gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbMF0ueCkge1xuICAgICAgIGxlZnRDb3ZlckdsYXNzLnhEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsZWZ0Q292ZXJHbGFzcy55ID4gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbMF0ueSkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5WzBdLngpIHtcbiAgICAgICByaWdodENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChyaWdodENvdmVyR2xhc3MueSA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVswXS55KSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgdHViZTdIb3ZlciA9IG5ldyBJbWFnZSgpO1xuICAgICAgdHViZTdIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb250ZXh0NC5kcmF3SW1hZ2UodHViZTdIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4wNiksIDMyMDAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuNjcwNyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjY3MDcpICogKDU1Mi4wLzgwMC4wKSkpO1xuICAgICAgICBcbiAgICAgICAgY292ZXJHbGFzc0hvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGNvdmVyR2xhc3NIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8vY29udGV4dDUuZHJhd0ltYWdlKGNvdmVyR2xhc3NIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4yOTgpLCAzNTkzLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjExMyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjExMykgKiAoNDIuMC8xMzUuMCkpKTtcbiAgICAgICAgICAvL2NvbnRleHQ1LmRyYXdJbWFnZShjb3ZlckdsYXNzSG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuNjA1KSwgMzU5MywgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMTMpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC4xMTMpICogKDQyLjAvMTM1LjApKSk7XG4gICAgICAgICAgbGVmdENvdmVyR2xhc3NIb3ZlciA9IG5ldyBDYW52YXNJbWFnZShbY292ZXJHbGFzc0hvdmVyXSwgMC4yOTgsICgzNTkzLjAvY2FudmFzMy53aWR0aCksIDAsIDAuMDAwNSwgMCwgMCwgbmV3IEFycmF5KHt4OjAuMjk4LHk6KDM1OTMuMC9jYW52YXMzLndpZHRoKX0pKTtcbiAgICAgICAgICByaWdodENvdmVyR2xhc3NIb3ZlciA9IG5ldyBDYW52YXNJbWFnZShbY292ZXJHbGFzc0hvdmVyXSwgMC42MDUsICgzNTkzLjAvY2FudmFzMy53aWR0aCksIDAsIDAuMDAwNSwgMCwgMCwgbmV3IEFycmF5KHt4OjAuNjA1LHk6KDM1OTMuMC9jYW52YXMzLndpZHRoKX0pKVxuICAgICAgICB9KTtcbiAgICAgICAgY292ZXJHbGFzc0hvdmVyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL2NvdmVyLWdsYXNzLWFuaW1hdGUucG5nJztcblxuICAgICAgfSk7XG4gICAgICB0dWJlN0hvdmVyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL3R1YmU3LWhvdmVyLnBuZyc7XG4gICAgfSk7XG4gICAgY292ZXJHbGFzcy5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy9jb3Zlci1nbGFzcy5wbmcnO1xuICB9KTtcbiAgdHViZTcuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTcucG5nJztcblxuICB2YXIgY2hhcnQgPSBuZXcgSW1hZ2UoKTtcbiAgY2hhcnQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBjb250ZXh0Mi5kcmF3SW1hZ2UoY2hhcnQsIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjUpIC0gKGNhbnZhcy53aWR0aCAqIDAuNzcgKiAwLjUpKSwgMzc1NSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC43NyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjc3KSAqICgzMTUuMC85MTIuMCkpKTtcbiAgfSk7XG4gIGNoYXJ0LnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL2xhc3QtY2hhcnQucG5nJztcblxuICB2YXIgY2hhcnQyID0gbmV3IEltYWdlKCk7XG4gIGNoYXJ0Mi5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQyLmRyYXdJbWFnZShjaGFydDIsIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjUpIC0gKGNhbnZhcy53aWR0aCAqIDAuNzAyNiAqIDAuNSkpLCA0MDU1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjcwMjYpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC43MDI2KSAqICgxODguMC84MzguMCkpKTtcbiAgfSk7XG4gIGNoYXJ0Mi5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy9ncmFwaGljLnBuZyc7XG59XG4vL0RyYXcgYW4gaW1hZ2Ugcm90YXRlZFxudmFyIFRPX1JBRElBTlMgPSBNYXRoLlBJLzE4MDsgXG5mdW5jdGlvbiBkcmF3Um90YXRlZEltYWdlKGltYWdlLCB4LCB5LCBhbmdsZSwgYXV4Q3R4KSB7IFxuIFxuICAvLyBzYXZlIHRoZSBjdXJyZW50IGNvLW9yZGluYXRlIHN5c3RlbSBcbiAgLy8gYmVmb3JlIHdlIHNjcmV3IHdpdGggaXRcbiAgYXV4Q3R4LnNhdmUoKTsgXG4gXG4gIC8vIG1vdmUgdG8gdGhlIG1pZGRsZSBvZiB3aGVyZSB3ZSB3YW50IHRvIGRyYXcgb3VyIGltYWdlXG4gIGF1eEN0eC50cmFuc2xhdGUoeCArIChpbWFnZS53aWR0aC8yKSwgeSArIChpbWFnZS5oZWlnaHQvMikpO1xuIFxuICAvLyByb3RhdGUgYXJvdW5kIHRoYXQgcG9pbnQsIGNvbnZlcnRpbmcgb3VyIFxuICAvLyBhbmdsZSBmcm9tIGRlZ3JlZXMgdG8gcmFkaWFucyBcbiAgYXV4Q3R4LnJvdGF0ZShhbmdsZSk7XG4gXG4gIC8vIGRyYXcgaXQgdXAgYW5kIHRvIHRoZSBsZWZ0IGJ5IGhhbGYgdGhlIHdpZHRoXG4gIC8vIGFuZCBoZWlnaHQgb2YgdGhlIGltYWdlIFxuICBhdXhDdHguZHJhd0ltYWdlKGltYWdlLCAtKGltYWdlLndpZHRoLzIpLCAtKGltYWdlLmhlaWdodC8yKSk7XG4gXG4gIC8vIGFuZCByZXN0b3JlIHRoZSBjby1vcmRzIHRvIGhvdyB0aGV5IHdlcmUgd2hlbiB3ZSBiZWdhblxuICBhdXhDdHgucmVzdG9yZSgpOyAvL1xufVxuLy9TZXR1cCBtb3NxdWl0b3NcbnZhciBzZXR1cE1vc3F1aXRvcyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBtb3NxdWl0byA9IG5ldyBJbWFnZSgpO1xuICBtb3NxdWl0by5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIC8vXG4gIH0pO1xuICBtb3NxdWl0by5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy9tb3NxdWl0bzFfbGVmdC5wbmcnO1xuICB2YXIgbW9zcXVpdG8yID0gbmV3IEltYWdlKCk7XG4gIG1vc3F1aXRvMi5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIC8vXG4gIH0pO1xuICBtb3NxdWl0bzIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvbW9zcXVpdG8yX2xlZnQucG5nJztcbiAgdmFyIG1vc3F1aXRvRmxpcHBlZCA9IG5ldyBJbWFnZSgpO1xuICBtb3NxdWl0b0ZsaXBwZWQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAvL1xuICB9KTtcbiAgbW9zcXVpdG9GbGlwcGVkLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL21vc3F1aXRvMV9sZWZ0LnBuZyc7XG4gIHZhciBtb3NxdWl0bzJGbGlwcGVkID0gbmV3IEltYWdlKCk7XG4gIG1vc3F1aXRvMkZsaXBwZWQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAvL1xuICB9KTtcbiAgbW9zcXVpdG8yRmxpcHBlZC5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy9tb3NxdWl0bzJfbGVmdC5wbmcnO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG90YWxNb3NxdWl0b3M7IGkrKykge1xuICAgIFxuXG4gICAgbW9zcXVpdG9zQXJyYXkucHVzaChuZXcgQ2FudmFzSW1hZ2UoW21vc3F1aXRvLyosIG1vc3F1aXRvMiovXSwgMCwgMCwgMCwgMC4wMDEgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSwgMCwgMCwgbmV3IEFycmF5KCkpKTtcblxuICAgIG1vc3F1aXRvc0FycmF5W2ldLmZsaXBwZWRJbWFnZXMgPSBuZXcgQXJyYXkobW9zcXVpdG9GbGlwcGVkLyosIG1vc3F1aXRvMkZsaXBwZWQqLyk7XG4gICAgXG4gICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxW2klbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxLmxlbmd0aF07XG5cbiAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgIFxuICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSkge1xuICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudC54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCksIHk6IGVsZW1lbnQueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApfTtcbiAgICAgIGF1eEVsZW1lbnQueCA9IE1hdGgubWF4KDAuNTEsIE1hdGgubWluKDAuOTUsIGF1eEVsZW1lbnQueCkpICsgMC4wMjtcbiAgICAgIGF1eEVsZW1lbnQueSA9IE1hdGgubWF4KDAuMSwgTWF0aC5taW4oMC4zLCBhdXhFbGVtZW50LnkpKTtcbiAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMC4xICYmIGF1eEVsZW1lbnQueCA8PSAwLjQ5KSB7XG4gICAgICAgIGF1eEVsZW1lbnQueCA9IGF1eEVsZW1lbnQueCArIDAuMjtcbiAgICAgIH1cbiAgICAgIG1vc3F1aXRvc0FycmF5W2ldLnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICBtb3NxdWl0b3NBcnJheVtpXS5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuICAgIG1vc3F1aXRvc0FycmF5W2ldLnggPSBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheVttb3NxdWl0b3NBcnJheVtpXS5jdXJyZW50UG9zaXRpb25dLng7XG4gICAgbW9zcXVpdG9zQXJyYXlbaV0ueSA9IG1vc3F1aXRvc0FycmF5W2ldLnBvc2l0aW9uc0FycmF5W21vc3F1aXRvc0FycmF5W2ldLmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgIHZhciBuZXh0UG9zaXRpb24gPSBtb3NxdWl0b3NBcnJheVtpXS5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgIGlmIChuZXh0UG9zaXRpb24gPj0gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgIH1cblxuICAgIGlmIChtb3NxdWl0b3NBcnJheVtpXS54ID4gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICBtb3NxdWl0b3NBcnJheVtpXS54RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbW9zcXVpdG9zQXJyYXlbaV0ueERpciA9IHRydWU7XG4gICAgfVxuICAgIGlmIChtb3NxdWl0b3NBcnJheVtpXS55ID4gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICBtb3NxdWl0b3NBcnJheVtpXS55RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbW9zcXVpdG9zQXJyYXlbaV0ueURpciA9IHRydWU7XG4gICAgfVxuICB9XG59XG4vL0RlY2lkZSBuZXh0IHN0ZXAgYWN0aW9uc1xudmFyIGRlY2lkZU5leHRTdGVwID0gZnVuY3Rpb24obmV4dFN0ZXApe1xuICBzd2l0Y2ggKG5leHRTdGVwKSB7XG4gICAgY2FzZSAwOlxuICAgICAgJCgnI3BnU3RlcDEgLnBnLWJ1dHRvbicpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJCgnI3BnU3RlcDEnKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMlswXTtcblxuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTtcbiAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbExlZnQ6ICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjEnKS5vZmZzZXQoKS5sZWZ0XG4gICAgICAgIH0sIDcwMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxUb3A6ICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjEnKS5vZmZzZXQoKS50b3BcbiAgICAgICAgfSwgNDAwMCk7XG4gICAgICB9XG4gICAgICBcbiAgICBicmVhaztcbiAgICBjYXNlIDE6XG4gICAgICB2YXIgYXV4TW9zcXVpdG9zTGVmdCA9IG1vc3F1aXRvc0xlZnQ7XG4gICAgICBtb3NxdWl0b3NMZWZ0IC09IHJldHVybk1vc3F1aXRvc0xlZnQoMCwgMiwgcGFyc2VJbnQoJCgnI3Zpc2l0LWNvdW50cnknKS52YWwoKSkpO1xuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGluZGV4ID4gYXV4TW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG5cbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U0WzBdW2ldKTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2WzBdW2ldKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF1baV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZbMF1baV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFswXVtpXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDMpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDAzKSovO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gNztcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgJChcIiNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjFcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnUXVlc3Rpb24tY29udGFpbmVyMSBzZWxlY3RcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnU3RlcDIgLnBnLWJ1dHRvblwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnU3RlcDJcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuXG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsTGVmdDogJCgnI3BnU3RlcDInKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgfSwgNTAwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgIHNjcm9sbExlZnQ6ICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjInKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgICAgIH0sIDUwMDApO1xuICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsVG9wOiAkKCcjcGdTdGVwMicpLm9mZnNldCgpLnRvcFxuICAgICAgICB9LCA1MDAwKTtcbiAgICAgIH1cbiAgICBicmVhaztcbiAgICBjYXNlIDI6XG4gICAgICAkKCcjcGdTdGVwMiAucGctYnV0dG9uJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnU3RlcDJcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMikqLztcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMikqLztcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDc7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsVG9wOiAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykub2Zmc2V0KCkudG9wXG4gICAgICB9LCA3MDAwKTtcbiAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyIC5wZy1idXR0b24nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjInKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKS5hZGRDbGFzcyhcImRpc2FibGVkLW9wdGlvblwiKTtcbiAgICAgICQoXCIjcGdTdGVwMyAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoXCIjcGdTdGVwM1wiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICBcbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEwWzBdW2ldKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTJbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMlswXVtpXSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxMTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbExlZnQ6ICQoJyNwZ1N0ZXAzJykucG9zaXRpb24oKS5sZWZ0XG4gICAgICAgIH0sIDcwMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykucG9zaXRpb24oKS5sZWZ0XG4gICAgICAgICAgICB9LCA1MDAwKTtcbiAgICAgICAgICB9LCAzMDAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogJCgnI3BnU3RlcDMnKS5vZmZzZXQoKS50b3BcbiAgICAgICAgfSwgNzAwMCk7XG4gICAgICB9XG4gICAgYnJlYWs7XG4gICAgY2FzZSA0OlxuICAgICAgJChcIiNwZ1N0ZXAzIC5wZy1idXR0b25cIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnU3RlcDNcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTJbMF07XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTE7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsVG9wOiAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykub2Zmc2V0KCkudG9wXG4gICAgICB9LCA3MDAwKTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzJdKS5maW5kKFwiLmNoZWNrXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMl0pLmZpbmQoXCIucGdRdWVzdGlvbl9fYm9keV9fYW5zd2VyXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdCg0LCAzLCAhJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKTtcblxuICAgICAgICBwcmVnbmFudE1vc3F1aXRvcyA9IG1vc3F1aXRvc0xlZnQgKiAwLjc1O1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBwcmVnbmFudE1vc3F1aXRvcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE4WzBdO1xuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE3O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA3ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzIC5wZy1idXR0b24nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoJy5wZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uJykuYWRkQ2xhc3MoXCJkaXNhYmxlZC1vcHRpb25cIik7XG5cbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIGlmIChpbmRleCA+PSBwcmVnbmFudE1vc3F1aXRvcyAmJiBpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMFswXTtcblxuICAgICAgICAgICAgY3VycmVudFBoYXNlID0gMjA7XG5cbiAgICAgICAgICAgICQoXCIjcGdTdGVwNFwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE5O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA3ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsTGVmdDogJCgnI3BnU3RlcDQnKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgfSwgNzAwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxUb3A6ICQoJyNwZ1N0ZXA0Jykub2Zmc2V0KCkudG9wXG4gICAgICAgIH0sIDcwMDApO1xuICAgICAgfVxuICAgICAgfSwgMTc1MCk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gIH1cbn07XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgU3RlcHNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLy9EZWFscyB3aXRoIHRoZSBzY3JvbGxpbmcgYmV0d2VlbiBzdGVwcyBhbmQgcXVlc3Rpb25zXG52YXIgbWFuYWdlU3RlcHNBY3Rpb24gPSBmdW5jdGlvbigpe1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnU3RlcF9faW5mb19fdGV4dC1hY3Rpb24nLCBmdW5jdGlvbigpe1xuICAgIHZhciBuZXh0U3RlcCA9IHBhcnNlSW50KCQodGhpcykuYXR0cignZGF0YS1zdGVwJykpO1xuICAgIGRlY2lkZU5leHRTdGVwKG5leHRTdGVwKTtcbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCAnc2VsZWN0I3Zpc2l0LWNvdW50cnknLCBmdW5jdGlvbigpe1xuICAgIHZhciBuZXh0U3RlcCA9IHBhcnNlSW50KCQodGhpcykuYXR0cignZGF0YS1zdGVwJykgKyAxKTtcbiAgICBkZWNpZGVOZXh0U3RlcChuZXh0U3RlcCk7XG4gIH0pO1xufTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFF1ZXN0aW9uc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vL0RlYWxzIHdpdGggdGhlIHNjcm9sbGluZyBiZXR3ZWVuIHF1ZXN0aW9uc1xudmFyIG1hbmFnZVF1ZXN0aW9uc1Njcm9sbCA9IGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgJ3NlbGVjdCNob21lLWNvdW50cnknLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV4dFBvc2l0aW9uID0gJCh0aGlzKS5hdHRyKCdkYXRhLXBvcycpLFxuICAgICAgY3VycmVudFN0ZXAgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtc3RlcCcpO1xuXG4gICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2N1cnJlbnRTdGVwXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbY3VycmVudFN0ZXBdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwwLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pO1xuXG4gICAgICBpZiAoY3VycmVudFN0ZXAgPT0gMCAmJiBuZXh0UG9zaXRpb24gPT0gMSkge1xuICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sIHBhcnNlSW50KCQoJyNob21lLWNvdW50cnknKS52YWwoKSkpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDM7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnUXVlc3Rpb24tYWN0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAkKHRoaXMpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgIHZhciBuZXh0UG9zaXRpb24gPSAkKHRoaXMpLmF0dHIoJ2RhdGEtcG9zJyksXG4gICAgICBjdXJyZW50U3RlcCA9ICQodGhpcykuYXR0cignZGF0YS1zdGVwJyk7XG5cbiAgICB2YXIgYXV4Q3VycmVudFN0ZXAgPSBjdXJyZW50U3RlcDtcbiAgICBpZiAobmV4dFBvc2l0aW9uICE9IC0xKSB7XG4gICAgICBcbiAgICAgIGlmIChjdXJyZW50U3RlcCA9PSAzKSB7XG4gICAgICAgIGF1eEN1cnJlbnRTdGVwID0gMjtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2F1eEN1cnJlbnRTdGVwXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwwLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmIChwYXJzZUludChjdXJyZW50U3RlcCkgPT0gMikge1xuICAgICAgICBtb3NxdWl0b3NMZWZ0IC09IHJldHVybk1vc3F1aXRvc0xlZnQocGFyc2VJbnQoY3VycmVudFN0ZXApLCBuZXh0UG9zaXRpb24sIDApXG4gICAgICB9XG4gICAgICBkZWNpZGVOZXh0U3RlcChwYXJzZUludChjdXJyZW50U3RlcCkgKyAxKTtcbiAgICB9XG4gICAgaWYgKGN1cnJlbnRTdGVwID09IDAgJiYgbmV4dFBvc2l0aW9uID09IDEpIHtcbiAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCBwYXJzZUludCgkKCcjaG9tZS1jb3VudHJ5JykudmFsKCkpKTtcblxuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF07XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAzO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA3ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChjdXJyZW50U3RlcCA9PSAzICYmIG5leHRQb3NpdGlvbiA9PSAxKSB7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCIuY2hlY2tcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcIi5wZ1F1ZXN0aW9uX19ib2R5X19hbnN3ZXJcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRxdWVzdGlvbldyYXBwZXIgPSAkKCQoJy5wZ1F1ZXN0aW9uLXdyYXBwZXInKVthdXhDdXJyZW50U3RlcF0pLFxuICAgICAgICAkcXVlc3Rpb25Db250YWluZXIgPSAkKCQoJy5wZ1F1ZXN0aW9uLWNvbnRhaW5lcicpW2F1eEN1cnJlbnRTdGVwXSksXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uVmFsdWUgPSAtKCgkcXVlc3Rpb25Db250YWluZXIud2lkdGgoKSAqIG5leHRQb3NpdGlvbikgLyAkcXVlc3Rpb25XcmFwcGVyLndpZHRoKCkpICogMTAwLjAsXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uID0gJ3RyYW5zbGF0ZTNkKCcgKyBuZXdUcmFuc2xhdGlvblZhbHVlICsgJyUsMCwwKSc7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy1tb3otdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygndHJhbnNmb3JtOicsIG5ld1RyYW5zbGF0aW9uKTsvL1xuXG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCAoJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzBdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSA/IDAgOiAoKCQoJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzBdKS5maW5kKFwicGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkgPyAxIDogMikpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTRbMF07XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxMztcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICAgIH0sIDE3NTApO1xuICAgIH1cbiAgICBlbHNlIGlmIChjdXJyZW50U3RlcCA9PSAzICYmIG5leHRQb3NpdGlvbiA9PSAyKSB7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCIuY2hlY2tcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVsxXSkuZmluZChcIi5wZ1F1ZXN0aW9uX19ib2R5X19hbnN3ZXJcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRxdWVzdGlvbldyYXBwZXIgPSAkKCQoJy5wZ1F1ZXN0aW9uLXdyYXBwZXInKVthdXhDdXJyZW50U3RlcF0pLFxuICAgICAgICAkcXVlc3Rpb25Db250YWluZXIgPSAkKCQoJy5wZ1F1ZXN0aW9uLWNvbnRhaW5lcicpW2F1eEN1cnJlbnRTdGVwXSksXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uVmFsdWUgPSAtKCgkcXVlc3Rpb25Db250YWluZXIud2lkdGgoKSAqIG5leHRQb3NpdGlvbikgLyAkcXVlc3Rpb25XcmFwcGVyLndpZHRoKCkpICogMTAwLjAsXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uID0gJ3RyYW5zbGF0ZTNkKCcgKyBuZXdUcmFuc2xhdGlvblZhbHVlICsgJyUsMCwwKSc7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy1tb3otdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygndHJhbnNmb3JtOicsIG5ld1RyYW5zbGF0aW9uKTsvL1xuXG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCAhJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKTtcblxuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE2WzBdO1xuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTU7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgICB9LCAxNzUwKTtcbiAgICB9XG5cbiAgfSk7XG59O1xuXG4vL1NlbGVjdCBhbiBvcHRpb24gb24gdGhlIHNlY29uZCBxdWVzdGlvblxudmFyIHNlbGVjdE9wdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKScsIGZ1bmN0aW9uKCkge1xuICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgICQodGhpcykuZmluZChcImltZ1wiKS5hdHRyKFwic3JjXCIsIFwiaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy9cIiArIGJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAkKHRoaXMpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG4gICAgICAkKHRoaXMpLmZpbmQoXCJpbWdcIikuYXR0cihcInNyY1wiLCBcImh0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvXCIgKyBob3ZlckJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLy9TZWxlY3QgYSBiaW5hcnkgb3B0aW9uIG9uIHRoZSB0aGlyZCBxdWVzdGlvblxudmFyIHNlbGVjdEJpbmFyeU9wdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvbjpub3QoLmRpc2FibGVkLW9wdGlvbiknLCBmdW5jdGlvbigpIHtcblxuICAgIHZhciBuZXh0UG9zaXRpb24gPSAkKHRoaXMpLmF0dHIoJ2RhdGEtcG9zJyksXG4gICAgICBjdXJyZW50U3RlcCA9ICQodGhpcykuYXR0cignZGF0YS1zdGVwJyk7XG5cbiAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG4gICAgICAvLyBtb3ZlIG1vc3F1aXRvc1xuICAgICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKFwiLnBnLWJ1dHRvblwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAkKHRoaXMpLnBhcmVudCgpLmZpbmQoXCIucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuICAgICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKFwiLnBnLWJ1dHRvblwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTdGVwID09IDMgJiYgbmV4dFBvc2l0aW9uID09IDEpIHtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcIi5jaGVja1wiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzBdKS5maW5kKFwiLnBnUXVlc3Rpb25fX2JvZHlfX2Fuc3dlclwiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2N1cnJlbnRTdGVwIC0gMV0pLFxuICAgICAgICAkcXVlc3Rpb25Db250YWluZXIgPSAkKCQoJy5wZ1F1ZXN0aW9uLWNvbnRhaW5lcicpW2N1cnJlbnRTdGVwIC0gMV0pLFxuICAgICAgICBuZXdUcmFuc2xhdGlvblZhbHVlID0gLSgoJHF1ZXN0aW9uQ29udGFpbmVyLndpZHRoKCkgKiBuZXh0UG9zaXRpb24pIC8gJHF1ZXN0aW9uV3JhcHBlci53aWR0aCgpKSAqIDEwMC4wLFxuICAgICAgICBuZXdUcmFuc2xhdGlvbiA9ICd0cmFuc2xhdGUzZCgnICsgbmV3VHJhbnNsYXRpb25WYWx1ZSArICclLDAsMCknO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctbW96LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJ3RyYW5zZm9ybTonLCBuZXdUcmFuc2xhdGlvbik7Ly9cblxuICAgICAgICBtb3NxdWl0b3NMZWZ0IC09IHJldHVybk1vc3F1aXRvc0xlZnQoY3VycmVudFN0ZXAsIG5leHRQb3NpdGlvbiwgKCQoJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzBdKS5maW5kKFwicGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKVswXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkgPyAwIDogKCgkKCQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcInBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIilbMV0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpID8gMSA6IDIpKTtcblxuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE0WzBdO1xuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTM7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgICB9LCAxNzUwKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY3VycmVudFN0ZXAgPT0gMyAmJiBuZXh0UG9zaXRpb24gPT0gMikge1xuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzFdKS5maW5kKFwiLmNoZWNrXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCIucGdRdWVzdGlvbl9fYm9keV9fYW5zd2VyXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uVmFsdWUgPSAtKCgkcXVlc3Rpb25Db250YWluZXIud2lkdGgoKSAqIG5leHRQb3NpdGlvbikgLyAkcXVlc3Rpb25XcmFwcGVyLndpZHRoKCkpICogMTAwLjAsXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uID0gJ3RyYW5zbGF0ZTNkKCcgKyBuZXdUcmFuc2xhdGlvblZhbHVlICsgJyUsMCwwKSc7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy1tb3otdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygndHJhbnNmb3JtOicsIG5ld1RyYW5zbGF0aW9uKTsvL1xuXG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCAhJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKTtcblxuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE2WzBdO1xuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTU7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgICB9LCAxNzUwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBkZWNpZGVOZXh0U3RlcCg1KTtcbiAgICB9XG5cbiAgfSk7XG59O1xuXG4vL1NlbGVjdCB0aGUgcHJlZ25hbmN5IG9wdGlvblxudmFyIHNlbGVjdFByZWduYW5jeU9wdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnU3RlcF9fcHJlZ25hbmN5LW9rJywgZnVuY3Rpb24oKcKge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICAgICQoXCIjbGVmdC1nbGFzcy1jb3ZlciwgI2xlZnQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICBtYXJnaW5Ub3A6IFwiLVwiICsgKCQoXCIjbGVmdC1nbGFzcy1jb3ZlclwiKS5oZWlnaHQoKSAqIDAuMDEpICsgXCJweFwiXG4gICAgICB9LCAyMDApO1xuICAgICAgJCgnLnBnU3RlcF9fcHJlZ25hbmN5LW9rJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdTdGVwX19wcmVnbmFuY3kta28nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIGN1cnJlbnRQaGFzZSA9IDIxO1xuICAgIHByZWduYW50U2VsZWN0ZWQgPSB0cnVlO1xuXG4gICAgdmFyIGNlbGwgPSBNYXRoLmZsb29yKDI1ICogKG1vc3F1aXRvc0xlZnQgLyB0b3RhbE1vc3F1aXRvcykpO1xuICAgIHZhciBuZXdYID0gMC4zO1xuICAgIHZhciBuZXdZID0gMy4yMjtcbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNTpcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTI6XG4gICAgICAgIG5ld1ggPSAwLjM7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgMTA6XG4gICAgICBjYXNlIDE0OlxuICAgICAgY2FzZSAxNzpcbiAgICAgICAgbmV3WCA9IDAuNDtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA5OlxuICAgICAgY2FzZSAxNTpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIxOlxuICAgICAgICBuZXdYID0gMC41O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDc6XG4gICAgICBjYXNlIDEzOlxuICAgICAgY2FzZSAxODpcbiAgICAgIGNhc2UgMjI6XG4gICAgICBjYXNlIDI0OlxuICAgICAgICBuZXdYID0gMC42O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgY2FzZSAxNjpcbiAgICAgIGNhc2UgMjA6XG4gICAgICBjYXNlIDIzOlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WCA9IDAuNztcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMjpcbiAgICAgIGNhc2UgNDpcbiAgICAgIGNhc2UgNzpcbiAgICAgIGNhc2UgMTE6XG4gICAgICAgIG5ld1kgPSAzLjM5O1xuICAgICAgICBuZXdZID0gMDtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgY2FzZSA2OlxuICAgICAgY2FzZSA5OlxuICAgICAgY2FzZSAxMzpcbiAgICAgIGNhc2UgMTY6XG4gICAgICAgIG5ld1kgPSAzLjM0NzU7XG4gICAgICAgIG5ld1kgPSA1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDU6XG4gICAgICBjYXNlIDEwOlxuICAgICAgY2FzZSAxNTpcbiAgICAgIGNhc2UgMTg6XG4gICAgICBjYXNlIDIwOlxuICAgICAgICBuZXdZID0gMy4zMDU7XG4gICAgICAgIG5ld1kgPSAxMDtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA4OlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIyOlxuICAgICAgY2FzZSAyMzpcbiAgICAgICAgbmV3WSA9IDMuMjYyNTtcbiAgICAgICAgbmV3WSA9IDE1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEyOlxuICAgICAgY2FzZSAxNzpcbiAgICAgIGNhc2UgMjE6XG4gICAgICBjYXNlIDI0OlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WSA9IDMuMjI7XG4gICAgICAgIG5ld1kgPSAyMDtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xuICAgIG1hcmtlck1hcmdpblRvcCA9ICgyMCAtIG5ld1kpO1xuXG4gICAgaWYgKCQoXCIucGdDaGFydFwiKS53aWR0aCgpID4gMTE4MCnCoHtcbiAgICAgIG1hcmtlck1hcmdpblRvcCA9ICgyMCAtIG5ld1kpICogKDExODAgLyAkKFwiLnBnQ2hhcnRcIikud2lkdGgoKSk7XG4gICAgfVxuICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwibWFyZ2luLXRvcFwiLCAgbWFya2VyTWFyZ2luVG9wKyBcInZ3XCIpO1xuICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwibGVmdFwiLCAgKG5ld1ggKiAxMDApICsgXCIlXCIpO1xuXG4gICAgbWFya2VyUG9zID0gJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5wb3NpdGlvbigpO1xuXG4gICAgdmFyIG5ld1Bvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OiBtYXJrZXJQb3MubGVmdCAvIGNhbnZhcy53aWR0aCwgeTogKChtYXJrZXJQb3MudG9wICsgcGFyc2VJbnQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJtYXJnaW4tdG9wXCIpKSkgKyAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmhlaWdodCgpKSAvIGNhbnZhcy53aWR0aH0pO1xuICAgIFxuICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgcHJlZ25hbnRNb3NxdWl0b3MpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXdQb3NpdGlvbnNBcnJheTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDIxO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIChNYXRoLnJhbmRvbSgpICogMTUwMCkgKyAxMDAwKTtcbiAgICAgIH0pO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBjcmVhdGVDb25jbHVzaW9ucyhjZWxsKTtcbiAgICAgIGNyZWF0ZVVzZXJzU3RhdHMobmV3WCwgbmV3WSwgY2VsbCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsVG9wOiAkKCcucGdTdGVwX19sYXN0LWNoYXJ0Jykub2Zmc2V0KCkudG9wXG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSwgMjAwMCk7XG4gICAgfVxuICB9KTtcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5wZ1N0ZXBfX3ByZWduYW5jeS1rbycsIGZ1bmN0aW9uKCnCoHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgICAkKFwiI3JpZ2h0LWdsYXNzLWNvdmVyLCAjcmlnaHQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICBtYXJnaW5Ub3A6IFwiLVwiICsgKCQoXCIjcmlnaHQtZ2xhc3MtY292ZXJcIikuaGVpZ2h0KCkgKiAwLjAxKSArIFwicHhcIlxuICAgICAgfSwgMjAwKTtcbiAgICAgICQoJy5wZ1N0ZXBfX3ByZWduYW5jeS1vaycpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJCgnLnBnU3RlcF9fcHJlZ25hbmN5LWtvJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICBjdXJyZW50UGhhc2UgPSAyMTtcbiAgICBub25QcmVnbmFudFNlbGVjdGVkID0gdHJ1ZTtcbiAgICB2YXIgbmV3TW9zcXVpdG9zTGVmdFZhbHVlID0gTWF0aC5tYXgoNSwgbW9zcXVpdG9zTGVmdCAtIChtb3NxdWl0b3NMZWZ0ICogMC40NSkpO1xuXG4gICAgdmFyIGNlbGwgPSBNYXRoLmZsb29yKDI1ICogKG5ld01vc3F1aXRvc0xlZnRWYWx1ZSAvIHRvdGFsTW9zcXVpdG9zKSk7XG4gICAgXG4gICAgdmFyIG5ld1ggPSAwLjM7XG4gICAgdmFyIG5ld1kgPSAzLjIyO1xuICAgIHN3aXRjaCAoY2VsbCkge1xuICAgICAgY2FzZSAxOlxuICAgICAgY2FzZSAzOlxuICAgICAgY2FzZSA1OlxuICAgICAgY2FzZSA4OlxuICAgICAgY2FzZSAxMjpcbiAgICAgICAgbmV3WCA9IDAuMztcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgY2FzZSA2OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTQ6XG4gICAgICBjYXNlIDE3OlxuICAgICAgICBuZXdYID0gMC40O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQ6XG4gICAgICBjYXNlIDk6XG4gICAgICBjYXNlIDE1OlxuICAgICAgY2FzZSAxOTpcbiAgICAgIGNhc2UgMjE6XG4gICAgICAgIG5ld1ggPSAwLjU7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNzpcbiAgICAgIGNhc2UgMTM6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMjpcbiAgICAgIGNhc2UgMjQ6XG4gICAgICAgIG5ld1ggPSAwLjY7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTE6XG4gICAgICBjYXNlIDE2OlxuICAgICAgY2FzZSAyMDpcbiAgICAgIGNhc2UgMjM6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBuZXdYID0gMC43O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHN3aXRjaCAoY2VsbCkge1xuICAgICAgY2FzZSAxOlxuICAgICAgY2FzZSAyOlxuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA3OlxuICAgICAgY2FzZSAxMTpcbiAgICAgICAgbmV3WSA9IDMuMzk7XG4gICAgICAgIG5ld1kgPSAwO1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICBjYXNlIDY6XG4gICAgICBjYXNlIDk6XG4gICAgICBjYXNlIDEzOlxuICAgICAgY2FzZSAxNjpcbiAgICAgICAgbmV3WSA9IDMuMzQ3NTtcbiAgICAgICAgbmV3WSA9IDU7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgIGNhc2UgMTA6XG4gICAgICBjYXNlIDE1OlxuICAgICAgY2FzZSAxODpcbiAgICAgIGNhc2UgMjA6XG4gICAgICAgIG5ld1kgPSAzLjMwNTtcbiAgICAgICAgbmV3WSA9IDEwO1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDg6XG4gICAgICBjYXNlIDE0OlxuICAgICAgY2FzZSAxOTpcbiAgICAgIGNhc2UgMjI6XG4gICAgICBjYXNlIDIzOlxuICAgICAgICBuZXdZID0gMy4yNjI1O1xuICAgICAgICBuZXdZID0gMTU7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTI6XG4gICAgICBjYXNlIDE3OlxuICAgICAgY2FzZSAyMTpcbiAgICAgIGNhc2UgMjQ6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBuZXdZID0gMy4yMjtcbiAgICAgICAgbmV3WSA9IDIwO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XG4gICAgbWFya2VyTWFyZ2luVG9wID0gKDIwIC0gbmV3WSk7XG5cbiAgICBpZiAoJChcIi5wZ0NoYXJ0XCIpLndpZHRoKCkgPiAxMTgwKcKge1xuICAgICAgbWFya2VyTWFyZ2luVG9wID0gKDIwIC0gbmV3WSkgKiAoMTE4MCAvICQoXCIucGdDaGFydFwiKS53aWR0aCgpKTtcbiAgICB9XG4gICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJtYXJnaW4tdG9wXCIsICBtYXJrZXJNYXJnaW5Ub3ArIFwidndcIik7XG4gICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJsZWZ0XCIsICAobmV3WCAqIDEwMCkgKyBcIiVcIik7XG5cbiAgICBtYXJrZXJQb3MgPSAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLnBvc2l0aW9uKCk7XG5cbiAgICB2YXIgbmV3UG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6IG1hcmtlclBvcy5sZWZ0IC8gY2FudmFzLndpZHRoLCB5OiAoKG1hcmtlclBvcy50b3AgKyBwYXJzZUludCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcIm1hcmdpbi10b3BcIikpKSArICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuaGVpZ2h0KCkpIC8gY2FudmFzLndpZHRofSk7XG5cbiAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA+PSBwcmVnbmFudE1vc3F1aXRvcyAmJiBpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXdQb3NpdGlvbnNBcnJheTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDIxO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIChNYXRoLnJhbmRvbSgpICogMTUwMCkgKyAxMDAwKTtcbiAgICAgIH0pO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGNyZWF0ZUNvbmNsdXNpb25zKGNlbGwpO1xuICAgICAgY3JlYXRlVXNlcnNTdGF0cyhuZXdYLCBuZXdZLCBjZWxsKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxUb3A6ICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQnKS5vZmZzZXQoKS50b3BcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9LCAyMDAwKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vL1JldHVybiBtb3NxdWl0b3MgbGVmdCBkZXBlbmRpbmcgb24gdGhlIGNob3NlbiBjb3VudHJ5XG52YXIgcmV0dXJuTW9zcXVpdG9zTGVmdCA9IGZ1bmN0aW9uKHN0ZXAsIHF1ZXN0aW9uLCBvcHRpb24pe1xuICB2YXIgYXV4TW9zcXVpdG9zTGVmdCA9IDA7XG5cbiAgaWYgKHN0ZXAgPT0gMCkge1xuICAgIGlmIChxdWVzdGlvbiA9PSAxKSB7XG4gICAgICBpZiAob3B0aW9uID09IDEpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcHRpb24gPT0gMiB8fCBvcHRpb24gPT0gNCkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gODA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChxdWVzdGlvbiA9PSAyKSB7XG4gICAgICBpZiAob3B0aW9uID09IDEpIHtcbiAgICAgICAgaWYgKG1vc3F1aXRvc0xlZnQgPD0gMjApIHtcbiAgICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gLTgwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcHRpb24gPT0gMiB8fCBvcHRpb24gPT0gNCkge1xuICAgICAgICBpZiAobW9zcXVpdG9zTGVmdCA8PSAyMCkge1xuICAgICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChzdGVwID09IDIpIHtcbiAgICAvL2lmIChxdWVzdGlvbiA9PSAwKSB7XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbMF0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMztcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzFdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAxOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVsyXSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbM10pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzRdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVs1XSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbNl0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzddKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVs4XSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gKG1vc3F1aXRvc0xlZnQgPD0gODApID8gMiA6IDE7IFxuICAgICAgfVxuICAgIC8vfVxuICB9XG5cbiAgaWYgKHN0ZXAgPT0gMykge1xuICAgIGlmIChxdWVzdGlvbiA9PSAxKSB7XG4gICAgICBpZiAob3B0aW9uID09IDApIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDE7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcHRpb24gPT0gMSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHF1ZXN0aW9uID09IDIpIHtcbiAgICAgIGlmIChvcHRpb24gPT0gMCkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSAxKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAxO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocXVlc3Rpb24gPT0gMykge1xuICAgICAgaWYgKG9wdGlvbiA9PSAwKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAob3B0aW9uID09IDEpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF1eE1vc3F1aXRvc0xlZnQ7XG59O1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uY2x1c2lvbnNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xudmFyIGNyZWF0ZUNvbmNsdXNpb25zID0gZnVuY3Rpb24oY2VsbCkge1xuICB2YXIgY29uY2x1c2lvbnNUZXh0ID0gXCI8aDQ+PGI+WW91IGhhdmUgYSBcIjtcblxuICAvL1lvdSBoYXZlIGEgbG93L21pZC9oaWdoIHJpc2sgb2YgY29udHJhY3RpbmcgdGhlIFppa2EgdmlydXMsIGFuZCAoYnV0KSB0aGUgY29uc2VxdWVuY2VzIHdvdWxkIGJlIG1pbGQvIGNvdWxkIGJlIHNlcmlvdXMvXG4gIGlmIChjZWxsIDw9IDEwKSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwibG93XCI7XG4gIH1cbiAgZWxzZSBpZiAoY2VsbCA8PSAxOSkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIm1pZFwiO1xuICB9XG4gIGVsc2Uge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcImhpZ2hcIjtcbiAgfVxuXG4gIGNvbmNsdXNpb25zVGV4dCArPSBcIiByaXNrIG9mIGNvbnRyYWN0aW5nIHRoZSBaaWthIHZpcnVzLCBhbmQgKGJ1dCkgdGhlIGNvbnNlcXVlbmNlcyBcIlxuXG4gIGlmIChjZWxsIDw9IDEwKSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwid291bGQgYmUgbWlsZC5cIjtcbiAgfVxuICBlbHNlIGlmIChjZWxsIDw9IDE5KSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwid291bGQgYmUgbWlsZC5cIjtcbiAgfVxuICBlbHNlIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCJjb3VsZCBiZSBzZXJpb3VzLlwiO1xuICB9XG5cbiAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPC9iPjwvaDQ+XCI7XG5cbiAgaWYocGFyc2VJbnQoJChcIiNob21lLWNvdW50cnlcIikudmFsKCkpID09IDQgfHwgcGFyc2VJbnQoJChcIiN2aXNpdC1jb3VudHJ5XCIpLnZhbCgpKSA9PSA0KSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPHA+WW91IGxpdmUgaW4gdGhlIFVuaXRlZCBTdGF0ZXMgb3IgeW91IGFyZSBwbGFubmluZyB0byB0cmF2ZWwgdG8gdGhlIFVuaXRlZCBTdGF0ZXMuIFJlc2VhcmNoIHNob3dzIHRoYXQgc29tZSBzdGF0ZXMgd2lsbCBiZSBhZmZlY3RlZCBieSB0aGUgWmlrYSB2aXJ1cyBpbiB0aGUgY29taW5nIHdlZWtzLjwvcD5cIlxuICB9XG5cbiAgaWYgKChwYXJzZUludCgkKFwiI2hvbWUtY291bnRyeVwiKS52YWwoKSkgPT0gMiAmJiBwYXJzZUludCgkKFwiI3Zpc2l0LWNvdW50cnlcIikudmFsKCkpID09IDIpIHx8ICgocGFyc2VJbnQoJChcIiNob21lLWNvdW50cnlcIikudmFsKCkpID09IDQgJiYgcGFyc2VJbnQoJChcIiN2aXNpdC1jb3VudHJ5XCIpLnZhbCgpKSA9PSA0KSkpIHtcbiAgICBpZiAoISQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbOF0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikgfHwgcHJlZ25hbnRTZWxlY3RlZCkge1xuICAgICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPHA+WW91IGRvbuKAmXQgbGl2ZSBpbiBhIGNvdW50cnkgbm9yIGFyZSB5b3UgcGxhbm5pbmcgdG8gdHJhdmVsIHRvIGEgY291bnRyeSBhZmZlY3RlZCBieSB0aGUgWmlrYSB2aXJ1cy4gPGI+WW91ciByaXNrIGlzIGxvdzwvYj4gYnV0IHJlbWVtYmVyIHRoYXQgdGhlcmUgaGF2ZSBiZWVuIDxiPmNhc2VzIG9mIHNleHVhbCB0cmFuc21pc3Npb248L2I+IGJ5IHBhcnRuZXJzIHRoYXQgZ290IGluZmVjdGVkIGluIHRob3NlIGFyZWFzLjwvcD5cIjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD5Zb3UgZG9u4oCZdCBsaXZlIGluIGEgY291bnRyeSBub3IgYXJlIHlvdSBwbGFubmluZyB0byB0cmF2ZWwgdG8gYSBjb3VudHJ5IGFmZmVjdGVkIGJ5IHRoZSBaaWthIHZpcnVzLiA8Yj5Zb3VyIHJpc2sgaXMgemVyby48Yj48L3A+XCI7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPllvdSBsaXZlIGluIGEgY291bnRyeSB0aGF0IGlzIGFmZmVjdGVkIGJ5IHRoZSBaaWthIHZpcnVzIG9yIHlvdSBhcmUgcGxhbm5pbmcgdG8gdHJhdmVsIHRvIGEgY291bnRyeSB0aGF0IGlzLjwvcD5cIjtcblxuICAgIGlmICgkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpIHx8ICQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbMl0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikgfHwgJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVs1XSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCAkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzZdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD5XZWFyaW5nIHNob3J0cyBhbmQgc2xlZXZlbGVzcyBzaGlydHMgdGhhdCBhcmUgZGFyayBpbiBjb2xvciBhbmQga2VlcGluZyBidWNrZXRzIG9mIHdhdGVyIG9yIGhhdmluZyB3YXRlciBjb250YWluZXJzIG5lYXIgeW91ciBob3VzZSBjYW4gPGI+aW5jcmVhc2UgeW91ciByaXNrIG9mIGJlaW5nIGJpdHRlbiBieSB0aGUgbW9zcXVpdG8gYW5kIHJhaXNlIHlvdXIgY2hhbmNlcyBvZiBnZXR0aW5nIHRoZSB2aXJ1cy48L2I+PC9wPlwiO1xuICAgIH1cbiAgICBpZiAoJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVszXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCAkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzRdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpIHx8ICQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbN10pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPlVzaW5nIGluc2VjdCByZXBlbGxlbnQsIHdlYXJpbmcgbGlnaHQgY29sb3IgY2xvdGhlcywgaGF2aW5nIHBoeXNpY2FsIGJhcnJpZXJzIHN1Y2ggbWVzaCBzY3JlZW5zIG9yIHRyZWF0ZWQgbmV0dGluZyBtYXRlcmlhbHMgb24gZG9vcnMgYW5kIHdpbmRvd3MsIG9yIHNsZWVwaW5nIHVuZGVyIG1vc3F1aXRvIG5ldHMgd2lsbCBhbGwgPGI+ZGVjcmVhc2UgeW91ciByaXNrIG9mIGdldHRpbmcgYml0dGVuIGJ5IHRoZSBtb3NxdWl0byBhbmQgbG93ZXIgeW91ciBjaGFuZ2VzIG9mIGdldHRpbmcgdGhlIHZpcnVzLjwvYj48L3A+XCI7XG4gICAgfVxuXG4gICAgaWYgKG5vblByZWduYW50U2VsZWN0ZWQpIHtcbiAgICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPlppa2EgdmlydXMgaXMgc3ByZWFkIHByaW1hcmlseSB0aHJvdWdoIHRoZSBiaXRlIG9mIGluZmVjdGVkIEFlZGVzIHNwZWNpZXMgbW9zcXVpdG9lcy4gPGI+T25seSAyMCUgcGVvcGxlIHdobyBjb250cmFjdCB0aGUgdmlydXMgd2lsbCBldmVuIGRldmVsb3AgYW55IHN5bXB0b21zIGFuZCB0aGUgaWxsbmVzcyBpcyB1c3VhbGx5IG1pbGQ8L2I+LCB3aXRoIHN5bXB0b21zIGxpa2UgZmV2ZXIsIHJhc2ggb3Igam9pbnQgcGFpbiB0aGF0IHdpbGwgbGFzdCBhIGZldyBkYXlzLjxicj48YnI+UmVjZW50bHkgaW4gQnJhemlsLCBsb2NhbCBoZWFsdGggYXV0aG9yaXRpZXMgaGF2ZSBvYnNlcnZlZCBhbiBpbmNyZWFzZSBpbiBHdWlsbGFpbi1CYXJyw6kgc3luZHJvbWUsIHRoYXQgY2F1c2VzIHBhcmFseXNpcywgd2hpY2ggY29pbmNpZGVkIHdpdGggWmlrYSB2aXJ1cyBpbmZlY3Rpb25zIGluIHRoZSBnZW5lcmFsIHB1YmxpYy4gQmFzZWQgb24gYSBncm93aW5nIGJvZHkgb2YgcHJlbGltaW5hcnkgcmVzZWFyY2gsIHRoZXJlIGlzIHNjaWVudGlmaWMgY29uc2Vuc3VzIHRoYXQgWmlrYSB2aXJ1cyBpcyBhIGNhdXNlIG9mIG1pY3JvY2VwaGFseSBhbmQgR3VpbGxhaW4tQmFycsOpIHN5bmRyb21lLjwvcD5cIjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD48Yj5UaGUgWmlrYSB2aXJ1cyBjYW4gYmUgdHJhbnNtaXR0ZWQgZnJvbSBpbmZlY3RlZCBtb3RoZXJzIHRvIHRoZWlyIGZldHVzZXM8L2I+IGFuZCB0aGlzIGNhbiBoYXBwZW4gZHVyaW5nIGJvdGggcHJlZ25hbmN5IG9yIGF0IGNoaWxkYmlydGguIEJhc2VkIG9uIGEgZ3Jvd2luZyBib2R5IG9mIHByZWxpbWluYXJ5IHJlc2VhcmNoLCA8Yj50aGVyZSBpcyBzY2llbnRpZmljIGNvbnNlbnN1cyB0aGF0IFppa2EgdmlydXMgaXMgYSBjYXVzZSBvZiBtaWNyb2NlcGhhbHk8L2I+LCB3aGljaCBpcyBhIGNvbmRpdGlvbiB3aGVyZSBhIGJhYnkgaXMgYm9ybiB3aXRoIGEgc21hbGwgaGVhZCBvciB0aGUgaGVhZCBzdG9wcyBncm93aW5nIGFmdGVyIGJpcnRoLiBCYWJpZXMgd2l0aCBtaWNyb2NlcGhhbHkgY2FuIGRldmVsb3AgZGV2ZWxvcG1lbnRhbCBkaXNhYmlsaXRpZXMuIEVhcmx5IGRpYWdub3NpcyBvZiBtaWNyb2NlcGhhbHkgY2FuIHNvbWV0aW1lcyBiZSBtYWRlIGJ5IGZldGFsIHVsdHJhc291bmQuPGJyPjxicj48Yj5QcmVnbmFudCB3b21lbiB3aG8gZGV2ZWxvcCBzeW1wdG9tcyBvZiBaaWthIHZpcnVzIGluZmVjdGlvbiwgc2hvdWxkIHNlZSB0aGVpciBoZWFsdGgtY2FyZSBwcm92aWRlciBmb3IgY2xvc2UgbW9uaXRvcmluZyBvZiB0aGVpciBwcmVnbmFuY3kuPC9iPiBJZiB5b3XigJlyZSB0cmF2ZWxsaW5nIHRvIGEgY291bnRyeSBhZmZlY3RlZCBieSBaaWthLCB0aGUgV29ybGQgSGVhbHRoIE9yZ2FuaXphdGlvbiBpcyBhZHZpc2luZyBwcmVnbmFudCB3b21lbiBub3QgdG8gdHJhdmVsIHRvIGFyZWFzIG9mIG9uZ29pbmcgWmlrYSB2aXJ1cyB0cmFuc21pc3Npb24uPC9wPlwiO1xuICAgIH1cbiAgfVxuXG4gIGNvbmNsdXNpb25zVGV4dCArPSBcIjxicj48YnI+XCI7XG5cbiAgJChcIi5wZ0NvbmNsdXNpb25zLWRlc2NcIikuYmVmb3JlKGNvbmNsdXNpb25zVGV4dCk7XG59XG5cbnZhciBjcmVhdGVVc2Vyc1N0YXRzID0gZnVuY3Rpb24obWFya2VyTGVmdCwgbWFya2VyVG9wLCBjZWxsKSB7XG4gIHZhciByZXN1bHRzID0gWzEsIDIsIDEsIDIsIDUsIDMsIDYsIDEwLCAxLCAxLCAxLCAxLCAxMCwgMTIsIDUsIDEsIDEsIDEwLCAxMiwgMSwgMSwgMSwgMiwgOSwgMV07XG5cbiAgdmFyIG1heFJlc3VsdHMgPSAtMTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAobWF4UmVzdWx0cyA8IHJlc3VsdHNbaV0pIHtcbiAgICAgIG1heFJlc3VsdHMgPSByZXN1bHRzW2ldO1xuICAgIH1cbiAgfVxuXG4gICQoJCgnLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbMF0pLmNzcyhcImxlZnRcIiwgXCIwJVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVsxXSkuY3NzKFwibGVmdFwiLCBcIjQ1JVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVsyXSkuY3NzKFwibGVmdFwiLCBcIjc1JVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVszXSkuY3NzKFwibGVmdFwiLCBcIjAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzRdKS5jc3MoXCJsZWZ0XCIsIFwiNDAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzVdKS5jc3MoXCJsZWZ0XCIsIFwiODAlXCIpO1xuXG4gICQoJCgnLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbMF0pLmNzcyhcIndpZHRoXCIsIFwiNDUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzFdKS5jc3MoXCJ3aWR0aFwiLCBcIjMwJVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVsyXSkuY3NzKFwid2lkdGhcIiwgXCIyNSVcIik7XG4gICQoJCgnLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbM10pLmNzcyhcIndpZHRoXCIsIFwiNDAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzRdKS5jc3MoXCJ3aWR0aFwiLCBcIjQwJVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs1XSkuY3NzKFwid2lkdGhcIiwgXCIyMCVcIik7XG5cbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzBdKS5jc3MoXCJsZWZ0XCIsIFwiMCVcIik7XG4gICQoJCgnLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVsxXSkuY3NzKFwibGVmdFwiLCBcIjQ1JVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzJdKS5jc3MoXCJsZWZ0XCIsIFwiNzUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbM10pLmNzcyhcImxlZnRcIiwgXCIwJVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzRdKS5jc3MoXCJsZWZ0XCIsIFwiNDAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNV0pLmNzcyhcImxlZnRcIiwgXCI4MCVcIik7XG5cbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzBdKS5jc3MoXCJ3aWR0aFwiLCBcIjQ1JVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzFdKS5jc3MoXCJ3aWR0aFwiLCBcIjMwJVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzJdKS5jc3MoXCJ3aWR0aFwiLCBcIjI1JVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzNdKS5jc3MoXCJ3aWR0aFwiLCBcIjQwJVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzRdKS5jc3MoXCJ3aWR0aFwiLCBcIjQwJVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzVdKS5jc3MoXCJ3aWR0aFwiLCBcIjIwJVwiKTtcblxuICAkKCQoJy5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMF0pLmh0bWwoXCJMT1cgXCIgKyA0NSArIFwiJVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzFdKS5odG1sKFwiTUVESVVNIFwiICsgMzAgKyBcIiVcIik7XG4gICQoJCgnLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVsyXSkuaHRtbChcIkhJR0ggXCIgKyAyNSArIFwiJVwiKTtcbiAgJCgkKCcucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzNdKS5odG1sKFwiTE9XIFwiICsgNDAgKyBcIiVcIik7XG4gICQoJCgnLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVs0XSkuaHRtbChcIk1FRElVTSBcIiArIDQwICsgXCIlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNV0pLmh0bWwoXCJISUdIIFwiICsgMjAgKyBcIiVcIik7XG5cbiAgJChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgYW5pbWF0ZVVzZXJzU3RhdHMoJCgkKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHNfX2NvbFwiKVtwYXJzZUludChpLzUpXSkuZmluZChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzX19jb2xfX3ZhbHVlXCIpW2klNV0sIChyZXN1bHRzW2ldIC8gbWF4UmVzdWx0cykgKiAxMDAuMCwgaSk7XG4gIH1cblxuICAkKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWFya2VyXCIpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcblxuICBzd2l0Y2ggKG1hcmtlckxlZnQpIHtcbiAgICBjYXNlIDAuMzpcbiAgICAgIG1hcmtlckxlZnQgPSAwLjEyNTtcbiAgICBicmVhaztcbiAgICBjYXNlIDAuNDpcbiAgICAgIG1hcmtlckxlZnQgPSAwLjM3NTtcbiAgICBicmVhaztcbiAgICBjYXNlIDAuNTpcbiAgICAgIG1hcmtlckxlZnQgPSAwLjU7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAwLjY6XG4gICAgICBtYXJrZXJMZWZ0ID0gMC42MjU7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAwLjc6XG4gICAgICBtYXJrZXJMZWZ0ID0gMC44NzU7XG4gICAgYnJlYWs7XG4gIH1cblxuICAkKCQoXCIucGdTdGVwX191c2Vycy1zdGF0cy1tYXJrZXJcIilbMF0pLmNzcyhcImxlZnRcIiwgKG1hcmtlckxlZnQgKiAxMDApICsgXCIlXCIpO1xuXG4gIHZhciBvZmZzZXRYID0gMi41O1xuXG4gIGlmIChtYXJrZXJUb3AgPiAxMCkge1xuICAgIG9mZnNldFggPSAtMi41O1xuICB9XG4gIGVsc2UgaWYgKG1hcmtlclRvcCA+IDEwKSB7XG4gICAgb2Zmc2V0WCA9IDIuNTtcbiAgfVxuICBlbHNlIHtcbiAgICBvZmZzZXRYID0gMDtcbiAgfVxuXG4gICQoJChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzLW1hcmtlclwiKVsxXSkuY3NzKFwibGVmdFwiLCAoKCgobWFya2VyVG9wICsgb2Zmc2V0WCkgKiA1KSkpICsgXCIlXCIpO1xuXG4gICQoJy5wZ0NvbmNsdXNpb25zLXNoYXJlYmFyLXdyYXBwZXInKS5jc3MoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKTtcbiAgJCgnLnBnQ29uY2x1c2lvbnMtc2hhcmViYXItd3JhcHBlciBhW2RhdGEtc2VydmljZT1cImZhY2Vib29rXCJdJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJpc2sgPSBcIlwiO1xuXG4gICAgaWYgKGNlbGwgPD0gMTApIHtcbiAgICAgIHJpc2sgPSBcImxvd1wiO1xuICAgIH1cbiAgICBlbHNlIGlmIChjZWxsIDw9IDE5KSB7XG4gICAgICByaXNrID0gXCJtaWRcIjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByaXNrID0gXCJoaWdoXCI7XG4gICAgfVxuXG4gICAgdmFyIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgIHZhciB0ZXh0ID0gXCJJIGRpZCB0aGUgWmlrYSB0ZXN0IGluIHRoZSBXYXNoaW5ndG9uIFBvc3QgYW5kIGdvdCB0aGF0IEkgaGF2ZSBhIFwiK3Jpc2srXCIgcmlzayBvZiBnZXR0aW5nIHRoZSB2aXJ1cy4gQXNzZXNzIHlvdXIgcmlzayBpbiBcIiArIHVybDtcblxuICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyL3NoYXJlci5waHA/dT0nICsgdXJsLCdzaGFyZV9mYWNlYm9vaycsJ3dpZHRoPTY1OCxoZWlnaHQ9MzU0LHNjcm9sbGJhcnM9bm8nKTtcbiAgfSk7XG4gICQoJy5wZ0NvbmNsdXNpb25zLXNoYXJlYmFyLXdyYXBwZXIgYVtkYXRhLXNlcnZpY2U9XCJ0d2l0dGVyXCJdJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJpc2sgPSBcIlwiO1xuXG4gICAgaWYgKGNlbGwgPD0gMTApIHtcbiAgICAgIHJpc2sgPSBcImxvd1wiO1xuICAgIH1cbiAgICBlbHNlIGlmIChjZWxsIDw9IDE5KSB7XG4gICAgICByaXNrID0gXCJtaWRcIjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByaXNrID0gXCJoaWdoXCI7XG4gICAgfVxuXG4gICAgdmFyIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgIHZhciB0ZXh0ID0gXCJJIGRpZCB0aGUgWmlrYSB0ZXN0IGluIHRoZSBAd2FzaGluZ3RvbnBvc3QgYW5kIGdvdCB0aGF0IEkgaGF2ZSBhIFwiKyByaXNrICtcIiByaXNrIG9mIGdldHRpbmcgdGhlIHZpcnVzLiBBc3Nlc3MgeW91ciByaXNrIGF0IFwiICsgdXJsO1xuICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3R3aXR0ZXIuY29tL3NoYXJlP3RleHQ9JyArIHRleHQgLCdzaGFyZV90d2l0dGVyJywnd2lkdGg9NTUwLCBoZWlnaHQ9MzUwLCBzY3JvbGxiYXJzPW5vJyk7XG4gIH0pO1xuXG59O1xuXG52YXIgYW5pbWF0ZVVzZXJzU3RhdHMgPSBmdW5jdGlvbihiYXIsIHZhbHVlLCBpKSB7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgYmFyLnN0eWxlLmhlaWdodCA9IHZhbHVlICsgXCIlXCI7XG4gICAgYmFyLnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9IFwic2NhbGVZKFwiICsgMSArIFwiKVwiO1xuICAgIGJhci5zdHlsZS50cmFuc2Zvcm0gPSBcInNjYWxlWShcIiArIDEgKyBcIilcIjtcbiAgfSwgMTUwMCArIChpICogMTAwKSk7XG59XG5cbi8qKlxuICBGdW5jacODwrNuIGRlIHJlZXNjYWxhZG9cbiAgXG4gIEBtZXRob2QgcmVzaXplXG4qL1xuXG5ydGltZSA9IG5ldyBEYXRlKDEsIDEsIDIwMDAsIDEyLCAwMCwgMDApO1xudGltZW91dCA9IGZhbHNlO1xuZGVsdGEgPSAyO1xudmFyIHNjcm9sbExlZnQgPSAwO1xudmFyIG9sZFdpZHRoID0gMDtcbnZhciBtYXJrZXJNYXJnaW5Ub3AgPSAtMTtcblxuJCh3aW5kb3cpLm9uKFwicmVzaXplXCIsIGZ1bmN0aW9uKCkge1xuICAgIHJ0aW1lID0gbmV3IERhdGUoKTtcbiAgICBpZiAodGltZW91dCA9PT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHRydWU7XG4gICAgICAgIHNjcm9sbExlZnQgPSAkKFwiLnBnQ2hhcnRcIikuc2Nyb2xsTGVmdCgpO1xuICAgICAgICBvbGRXaWR0aCA9ICQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCk7XG4gICAgICAgIHNldFRpbWVvdXQocmVzaXplZW5kLCBkZWx0YSk7XG4gICAgfVxuXG4gICAgLy8gXG5cbiAgICBpZiAoJChcIi5wZ0NoYXJ0XCIpLndpZHRoKCkgPCAxMTgwKSB7XG4gICAgICAkKFwiLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXJcIikuY3NzKFwibWFyZ2luLXRvcFwiLCBtYXJrZXJNYXJnaW5Ub3AgKyBcInZ3XCIpO1xuICAgIH1cblxuICAgIGlmICgkKFwiLnBnQ2hhcnRcIikud2lkdGgoKSA+IDExODAgJiYgbWFya2VyTWFyZ2luVG9wICE9IC0xKSB7XG4gICAgICAkKFwiLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXJcIikuY3NzKFwibWFyZ2luLXRvcFwiLCBwYXJzZUludCgkKFwiLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXJcIikuY3NzKFwibWFyZ2luLXRvcFwiKSkgKyBcInB4XCIpXG4gICAgfSBcbiAgICAvL3NldHVwQ2FudmFzKCk7XG59KTtcblxuZnVuY3Rpb24gcmVzaXplZW5kKCkge1xuICAgIGlmIChuZXcgRGF0ZSgpIC0gcnRpbWUgPCBkZWx0YSkge1xuICAgICAgICBzZXRUaW1lb3V0KG1haW4ucmVzaXplZW5kLCBkZWx0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRpbWVvdXQgPSBmYWxzZTtcbiAgICAgIHNldHVwQ2FudmFzKCk7IFxuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAkKFwiLnBnQ2hhcnRcIikuc2Nyb2xsTGVmdCgoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAvIG9sZFdpZHRoKSAqIHNjcm9sbExlZnQpO1xuICAgICAgfVxuICAgIH1cbn1cblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gIC8vU2V0IHVwIG5lZWRlZCBmdW5jdGlvbnNcbiAgbWFuYWdlUXVlc3Rpb25zU2Nyb2xsKCk7XG4gIG1hbmFnZVN0ZXBzQWN0aW9uKCk7XG4gIHNlbGVjdE9wdGlvbigpO1xuICBzZWxlY3RCaW5hcnlPcHRpb24oKTtcbiAgc2VsZWN0UHJlZ25hbmN5T3B0aW9uKCk7XG4gIGFuaW1hdGVFbGVtZW50c1ByZWduYW5jeSgpO1xuICBhbmltYXRlQmVoYXZpb3JFbGVtZW50cygpO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIHNldHVwQ2FudmFzKCk7XG4gICAgc2V0dXBNb3NxdWl0b3MoKTtcbiAgfSwgNTAwKTtcbiAgc2V0dXBNYWluTG9vcCgpO1xuXG4gIC8qJChkb2N1bWVudCkub24oXCJjbGlja1wiLCBmdW5jdGlvbihlKSB7XG4gICAgY29uc29sZS5sb2coJ3t4OicrKChlLnBhZ2VYLyQoXCJjYW52YXNcIikud2lkdGgoKSkgLSAwLjE5NSkgKyAnLCB5OicgKyAoKChlLnBhZ2VZIC0gNTY0KS8kKFwiY2FudmFzXCIpLndpZHRoKCkpKSArICd9Jyk7XG4gIH0pOyovXG59KTtcbiIsIndpbmRvdy50d3R0ciA9IChmdW5jdGlvbiAoZCwgcywgaWQpIHtcbiAgdmFyIHQsIGpzLCBmanMgPSBkLmdldEVsZW1lbnRzQnlUYWdOYW1lKHMpWzBdO1xuICBpZiAoZC5nZXRFbGVtZW50QnlJZChpZCkpIHJldHVybjtcbiAganMgPSBkLmNyZWF0ZUVsZW1lbnQocyk7IGpzLmlkID0gaWQ7XG4gIGpzLnNyYz0gXCJodHRwczovL3BsYXRmb3JtLnR3aXR0ZXIuY29tL3dpZGdldHMuanNcIjtcbiAgZmpzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGpzLCBmanMpO1xuICByZXR1cm4gd2luZG93LnR3dHRyIHx8ICh0ID0geyBfZTogW10sIHJlYWR5OiBmdW5jdGlvbiAoZikgeyB0Ll9lLnB1c2goZikgfSB9KTtcbn0oZG9jdW1lbnQsIFwic2NyaXB0XCIsIFwidHdpdHRlci13anNcIikpOyJdfQ==
