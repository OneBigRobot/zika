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
mosquitosPositionsPhase2S = new Array(
  //new Array({x:0.48228813559322037, y:0.2016949152542373},{x:0.4204237288135594, y:0.20423728813559322},{x:0.37466101694915255, y:0.2059322033898305},{x:0.3026271186440678, y:0.2076271186440678},{x:0.28991525423728814, y:0.21525423728813559},{x:0.2848305084745763, y:0.22796610169491524},{x:0.28228813559322036, y:0.25169491525423726},{x:0.27466101694915257, y:0.2669491525423729},{x:0.2560169491525424, y:0.26949152542372884},{x:0.07211864406779663, y:0.27203389830508473},{x:0.05516949152542373, y:0.2805084745762712},{x:0.050084745762711866, y:0.30338983050847457},{x:0.047542372881355946, y:0.4245762711864407},{x:0.049237288135593235, y:0.49830508474576274},{x:0.05686440677966102, y:0.5135593220338983},{x:0.06957627118644068, y:0.5186440677966102},{x:0.09245762711864407, y:0.5211864406779662},{x:0.10940677966101696, y:0.5262711864406779},{x:0.11449152542372883, y:0.5423728813559322},{x:0.11449152542372883, y:0.559322033898305})
  new Array({x:0.5013192612137203, y:0.4808707124010554},{x:0.4472295514511873, y:0.4782321899736148},{x:0.3891820580474934, y:0.47691292875989444},{x:0.316622691292876, y:0.4729551451187335},{x:0.2941952506596306, y:0.4821899736147757},{x:0.2783641160949868, y:0.5072559366754618},{x:0.2783641160949868, y:0.5270448548812665},{x:0.2717678100263852, y:0.5494722955145118},{x:0.21899736147757257, y:0.5560686015831134},{x:0.04221635883905013, y:0.5521108179419525},{x:0.025065963060686015, y:0.5626649076517151},{x:0.013192612137203167, y:0.5837730870712401},{x:0.010554089709762533, y:0.6378627968337731},{x:0.0158311345646438, y:0.6800791556728232},{x:0.03430079155672823, y:0.6840369393139841},{x:0.15963060686015831, y:0.6866754617414248},{x:0.1741424802110818, y:0.695910290237467},{x:0.18601583113456466, y:0.7117414248021108},{x:0.18997361477572558, y:0.7315303430079155},{x:0.20448548812664907, y:0.7447229551451188},{x:0.737467018469657, y:0.7447229551451188},{x:0.945910290237467, y:0.75},{x:1.116094986807388, y:0.746042216358839},{x:1.1794195250659631, y:0.7354881266490765},{x:1.1899736147757256, y:0.7170184696569921},{x:1.1899736147757256, y:0.6734828496042217},{x:1.187335092348285, y:0.6207124010554089})
);
mosquitosPositionsPhase3 = new Array(
  new Array({x:0.11, y:0.62}, {x:0.12, y:0.68}, {x:0.13, y:0.72}, {x:0.14, y:0.68}, {x:0.13, y:0.62}, {x:0.11, y:0.6}),
  new Array({x:0.08, y:0.6}, {x:0.09, y:0.58}, {x:0.1, y:0.52}, {x:0.12, y:0.58}, {x:0.13, y:0.64}, {x:0.09, y:0.62}),
  new Array({x:0.13, y:0.68}, {x:0.12, y:0.62}, {x:0.11, y:0.58}, {x:0.12, y:0.57}, {x:0.13, y:0.58}, {x:0.11, y:0.62}),
  new Array({x:0.12796610169491526, y:0.6194915254237288},{x:0.11949152542372882, y:0.6322033898305085},{x:0.11016949152542373, y:0.6542372881355932},{x:0.1, y:0.6796610169491526},{x:0.10677966101694915, y:0.7101694915254237},{x:0.13559322033898305, y:0.7110169491525423},{x:0.14576271186440679, y:0.6813559322033899},{x:0.14661016949152542, y:0.6457627118644068},{x:0.1423728813559322, y:0.5822033898305085},{x:0.13389830508474576, y:0.559322033898305},{x:0.10762711864406779, y:0.5669491525423729},{x:0.10932203389830508, y:0.5991525423728814}),
  new Array({x:0.14491525423728813, y:0.5796610169491525},{x:0.14915254237288136, y:0.5601694915254237},{x:0.12796610169491526, y:0.55},{x:0.11271186440677966, y:0.5567796610169492},{x:0.13644067796610168, y:0.5991525423728814},{x:0.11610169491525424, y:0.6245762711864407},{x:0.10338983050847457, y:0.6635593220338983},{x:0.12033898305084746, y:0.6754237288135593},{x:0.14576271186440679, y:0.6949152542372882},{x:0.12627118644067797, y:0.7152542372881356},{x:0.10762711864406779, y:0.688135593220339},{x:0.12457627118644068, y:0.6288135593220339},{x:0.13813559322033897, y:0.5864406779661017})
);
mosquitosPositionsPhase3S = new Array(
  new Array({x:1.168421052631579, y:0.6269736842105263},{x:1.2, y:0.6269736842105263},{x:1.225, y:0.6125},{x:1.2026315789473685, y:0.6059210526315789},{x:1.1710526315789473, y:0.6046052631578948},{x:1.1592105263157895, y:0.5901315789473685},{x:1.2052631578947368, y:0.5888157894736842},{x:1.2236842105263157, y:0.5743421052631579},{x:1.2197368421052632, y:0.5625},{x:1.194736842105263, y:0.5546052631578947},{x:1.1710526315789473, y:0.5611842105263158},{x:1.1697368421052632, y:0.5796052631578947},{x:1.2223684210526315, y:0.5888157894736842},{x:1.2157894736842105, y:0.6098684210526316},{x:1.1921052631578948, y:0.6203947368421052}),
  new Array({x:1.2144736842105264, y:0.6177631578947368},{x:1.2276315789473684, y:0.569078947368421},{x:1.2052631578947368, y:0.5598684210526316},{x:1.1710526315789473, y:0.5717105263157894},{x:1.1552631578947368, y:0.6006578947368421},{x:1.1671052631578946, y:0.6256578947368421},{x:1.2, y:0.6230263157894737},{x:1.2171052631578947, y:0.5993421052631579},{x:1.2078947368421054, y:0.5822368421052632},{x:1.1789473684210525, y:0.5848684210526316},{x:1.1710526315789473, y:0.6085526315789473},{x:1.1907894736842106, y:0.6164473684210526},{x:1.2210526315789474, y:0.6164473684210526})
);
mosquitosPositionsPhase4 = new Array(
  new Array({x:0.12610169491525425, y:0.7533898305084745},{x:0.12949152542372883, y:0.7745762711864407},{x:0.13033898305084746, y:0.8025423728813559},{x:0.12949152542372883, y:0.8322033898305085})
);
mosquitosPositionsPhase4S = new Array(
  new Array({x:1.1932668329177056, y:0.5461346633416458},{x:1.1907730673316708, y:0.527431421446384},{x:1.1907730673316708, y:0.5037406483790524},{x:1.1945137157107233, y:0.486284289276808},{x:1.1932668329177056, y:0.47256857855361595})
);
mosquitosPositionsPhase5 = new Array(
  new Array({x:0.11, y:0.82}, {x:0.12, y:0.88}, {x:0.13, y:0.92}, {x:0.14, y:0.88}, {x:0.13, y:0.82}, {x:0.11, y:0.8}),
  new Array({x:0.08, y:0.8}, {x:0.09, y:0.78}, {x:0.1, y:0.82}, {x:0.12, y:0.78}, {x:0.13, y:0.84}, {x:0.09, y:0.82}),
  new Array({x:0.13, y:0.88}, {x:0.12, y:0.82}, {x:0.11, y:0.78}, {x:0.12, y:0.77}, {x:0.13, y:0.78}, {x:0.11, y:0.82}),
  new Array({x:0.14745762711864407, y:0.7694915254237288},{x:0.11694915254237288, y:0.7728813559322034},{x:0.09576271186440678, y:0.7813559322033898},{x:0.0847457627118644, y:0.8067796610169492},{x:0.1, y:0.8372881355932204},{x:0.13389830508474576, y:0.8533898305084746},{x:0.15169491525423728, y:0.838135593220339},{x:0.1635593220338983, y:0.8025423728813559}),
  new Array({x:0.1152542372881356, y:0.8508474576271187},{x:0.09067796610169492, y:0.8203389830508474},{x:0.09830508474576272, y:0.7957627118644067},{x:0.11271186440677966, y:0.7754237288135594},{x:0.13898305084745763, y:0.7796610169491526},{x:0.13559322033898305, y:0.8033898305084746},{x:0.14745762711864407, y:0.8271186440677966},{x:0.12627118644067797, y:0.8491525423728814})
);
mosquitosPositionsPhase5S = new Array(
  new Array({x:1.1770573566084788, y:0.47381546134663344},{x:1.1695760598503742, y:0.4613466334164589},{x:1.174563591022444, y:0.428927680798005},{x:1.2007481296758105, y:0.41271820448877805},{x:1.2094763092269327, y:0.39027431421446385},{x:1.2094763092269327, y:0.3690773067331671},{x:1.2032418952618453, y:0.3516209476309227},{x:1.1957605985037407, y:0.33541147132169574},{x:1.1845386533665836, y:0.33042394014962595},{x:1.1733167082294265, y:0.3491271820448878},{x:1.180798004987531, y:0.36783042394014964},{x:1.1957605985037407, y:0.4014962593516209},{x:1.1845386533665836, y:0.42144638403990026},{x:1.1957605985037407, y:0.4600997506234414},{x:1.180798004987531, y:0.47381546134663344}),
  new Array({x:1.2094763092269327, y:0.3092269326683292},{x:1.1845386533665836, y:0.314214463840399},{x:1.1733167082294265, y:0.33665835411471323},{x:1.1845386533665836, y:0.35785536159601},{x:1.1932668329177056, y:0.3778054862842893},{x:1.1795511221945136, y:0.40523690773067333},{x:1.1645885286783042, y:0.43266832917705733},{x:1.1645885286783042, y:0.45885286783042395},{x:1.1783042394014962, y:0.48129675810473815},{x:1.1982543640897756, y:0.48129675810473815},{x:1.2057356608478802, y:0.45760598503740646},{x:1.1957605985037407, y:0.4139650872817955},{x:1.2032418952618453, y:0.36159600997506236},{x:1.2082294264339153, y:0.3229426433915212})
);
mosquitosPositionsPhase6 = new Array(
  new Array({x:0.12949152542372883, y:0.8398305084745763},{x:0.12949152542372883, y:0.8872881355932203},{x:0.13033898305084746, y:0.9330508474576271},{x:0.12949152542372883, y:1.05},{x:0.13457627118644067, y:1.0627118644067797},{x:0.14644067796610172, y:1.0720338983050848},{x:0.27440677966101695, y:1.0686440677966103},{x:0.29135593220338984, y:1.0788135593220338},{x:0.3023728813559322, y:1.0991525423728814},{x:0.3057627118644068, y:1.126271186440678},{x:0.3201694915254237, y:1.1423728813559322},{x:0.4422033898305085, y:1.1415254237288135},{x:0.4616949152542373, y:1.1533898305084747},{x:0.46847457627118644, y:1.1703389830508475},{x:0.46762711864406775, y:1.2686440677966102},{x:0.4710169491525424, y:1.3025423728813559})
);
mosquitosPositionsPhase6S = new Array(
  new Array({x:1.185785536159601, y:0.26184538653366585},{x:1.1820448877805487, y:0.24189526184538654},{x:1.1645885286783042, y:0.23192019950124687},{x:1.1483790523690773, y:0.22942643391521197},{x:1.1246882793017456, y:0.23316708229426433},{x:1.1172069825436408, y:0.22194513715710723},{x:1.1134663341645885, y:0.1882793017456359},{x:1.112219451371571, y:0.14962593516209477},{x:1.1134663341645885, y:0.09476309226932668},{x:1.1209476309226933, y:0.07855361596009976},{x:1.1433915211970074, y:0.06982543640897755},{x:1.2331670822942644, y:0.06608478802992519},{x:1.486284289276808, y:0.06608478802992519},{x:1.5074812967581048, y:0.07107231920199501},{x:1.5174563591022443, y:0.08104738154613467},{x:1.5199501246882794, y:0.10224438902743142},{x:1.5311720698254363, y:0.11471321695760599},{x:1.5785536159600997, y:0.12219451371571072},{x:1.8815461346633418, y:0.12094763092269327},{x:2.1334164588528677, y:0.11845386533665836},{x:2.163341645885287, y:0.1259351620947631},{x:2.172069825436409, y:0.1433915211970075},{x:2.172069825436409, y:0.1571072319201995},{x:2.199501246882793, y:0.1770573566084788},{x:2.325436408977556, y:0.17581047381546136},{x:2.3516209476309227, y:0.185785536159601},{x:2.3603491271820447, y:0.20199501246882792},{x:2.361596009975062, y:0.23316708229426433},{x:2.376558603491272, y:0.25311720698254364},{x:2.403990024937656, y:0.2581047381546135},{x:2.5049875311720697, y:0.25311720698254364},{x:2.527431421446384, y:0.2655860349127182},{x:2.5386533665835413, y:0.2805486284289277},{x:2.539900249376559, y:0.36159600997506236},{x:2.539900249376559, y:0.4825436408977556},{x:2.552369077306733, y:0.5561097256857855})
);
mosquitosPositionsPhase7 = new Array(
  new Array({x:0.4101694915254237, y:1.188135593220339},{x:0.3822033898305085, y:1.2101694915254237},{x:0.37542372881355934, y:1.255084745762712},{x:0.39152542372881355, y:1.2923728813559323},{x:0.43728813559322033, y:1.3152542372881355},{x:0.4745762711864407, y:1.306779661016949},{x:0.5, y:1.276271186440678},{x:0.5059322033898305, y:1.2330508474576272},{x:0.46779661016949153, y:1.1838983050847458}),
  new Array({x:0.46016949152542375, y:1.2372881355932204},{x:0.47627118644067795, y:1.2584745762711864},{x:0.4728813559322034, y:1.3008474576271187},{x:0.42033898305084744, y:1.3084745762711865},{x:0.38813559322033897, y:1.2686440677966102},{x:0.40423728813559323, y:1.238135593220339},{x:0.45084745762711864, y:1.2627118644067796},{x:0.49491525423728816, y:1.244915254237288},{x:0.5084745762711864, y:1.2152542372881356},{x:0.47966101694915253, y:1.1813559322033897}),
  new Array({x:0.41271186440677965, y:1.1923728813559322},{x:0.4728813559322034, y:1.2},{x:0.5059322033898305, y:1.2483050847457626},{x:0.5033898305084745, y:1.2949152542372881},{x:0.43728813559322033, y:1.3},{x:0.3855932203389831, y:1.2847457627118644},{x:0.376271186440678, y:1.2423728813559323},{x:0.423728813559322, y:1.2474576271186442},{x:0.4652542372881356, y:1.2194915254237289},{x:0.41694915254237286, y:1.1872881355932203})
);
mosquitosPositionsPhase7S = new Array(
  new Array({x:2.53077975376197, y:0.5300957592339262},{x:2.506155950752394, y:0.5492476060191519},{x:2.488372093023256, y:0.5848153214774282},{x:2.488372093023256, y:0.6203830369357045},{x:2.5075239398084817, y:0.6450068399452804},{x:2.545827633378933, y:0.6504787961696307},{x:2.5718194254445965, y:0.6381668946648427},{x:2.584131326949384, y:0.5971272229822161},{x:2.5786593707250343, y:0.5533515731874145},{x:2.5499316005471955, y:0.5465116279069767},{x:2.5198358413132693, y:0.5588235294117647},{x:2.545827633378933, y:0.5779753761969905},{x:2.5540355677154585, y:0.6258549931600548},{x:2.5225718194254445, y:0.6395348837209303},{x:2.4829001367989054, y:0.6203830369357045},{x:2.491108071135431, y:0.5957592339261286},{x:2.560875512995896, y:0.5957592339261286},{x:2.560875512995896, y:0.5642954856361149},{x:2.53625170998632, y:0.5642954856361149},{x:2.4952120383036935, y:0.5601915184678523},{x:2.5198358413132693, y:0.5328317373461012},{x:2.5718194254445965, y:0.554719562243502},{x:2.5718194254445965, y:0.5984952120383037},{x:2.53077975376197, y:0.6217510259917921},{x:2.556771545827633, y:0.658686730506156},{x:2.5896032831737346, y:0.63406292749658},{x:2.5745554035567717, y:0.6094391244870041},{x:2.5170998632010946, y:0.594391244870041},{x:2.5225718194254445, y:0.5588235294117647},{x:2.5430916552667577, y:0.5533515731874145})
);
mosquitosPositionsPhase8 = new Array(
  new Array({x:0.5244915254237288, y:1.3542372881355933},{x:0.549915254237288, y:1.352542372881356},{x:0.5770338983050847, y:1.3533898305084746},{x:0.5880508474576271, y:1.3593220338983052},{x:0.5965254237288136, y:1.3703389830508474},{x:0.5956779661016949, y:1.3940677966101696},{x:0.5956779661016949, y:1.4466101694915254},{x:0.5982203389830509, y:1.4627118644067796},{x:0.6058474576271187, y:1.4720338983050847},{x:0.6295762711864408, y:1.4779661016949153},{x:0.6592372881355932, y:1.476271186440678},{x:0.666864406779661, y:1.4677966101694915},{x:0.6727966101694915, y:1.45},{x:0.6727966101694915, y:1.4033898305084747},{x:0.6711016949152542, y:1.3559322033898304},{x:0.6727966101694915, y:1.321186440677966},{x:0.6719491525423729, y:1.3084745762711865},{x:0.6744915254237287, y:1.297457627118644},{x:0.681271186440678, y:1.2872881355932204},{x:0.7075423728813559, y:1.2898305084745763},{x:0.7711016949152543, y:1.2889830508474576},{x:0.7838135593220339, y:1.2923728813559323},{x:0.7880508474576271, y:1.3016949152542372},{x:0.7888983050847458, y:1.3177966101694916},{x:0.7855084745762713, y:1.3559322033898304},{x:0.7880508474576271, y:1.4016949152542373},{x:0.7888983050847458, y:1.4559322033898305},{x:0.7922881355932203, y:1.4652542372881356},{x:0.8024576271186441, y:1.4720338983050847},{x:0.8414406779661017, y:1.476271186440678},{x:0.8804237288135592, y:1.476271186440678},{x:0.8982203389830508, y:1.4872881355932204},{x:0.902457627118644, y:1.5059322033898306},{x:0.9041525423728813, y:1.5703389830508474},{x:0.9033050847457627, y:1.616949152542373})
);
mosquitosPositionsPhase8S = new Array(
  new Array({x:2.5972568578553616, y:0.5910224438902744},{x:2.6334164588528677, y:0.5922693266832918},{x:2.6645885286783044, y:0.5897755610972568},{x:2.6770573566084788, y:0.6059850374064838},{x:2.683291770573566, y:0.6408977556109726},{x:2.6820448877805485, y:0.6795511221945137},{x:2.6820448877805485, y:0.7044887780548629},{x:2.6870324189526182, y:0.7144638403990025},{x:2.6957605985037407, y:0.7231920199501247},{x:2.733167082294264, y:0.729426433915212},{x:2.7531172069825436, y:0.7256857855361596},{x:2.7630922693266835, y:0.7182044887780549},{x:2.7693266832917707, y:0.7032418952618454},{x:2.7693266832917707, y:0.6658354114713217},{x:2.770573566084788, y:0.6321695760598504},{x:2.7718204488778055, y:0.5685785536159601},{x:2.770573566084788, y:0.543640897755611},{x:2.770573566084788, y:0.5224438902743143},{x:2.775561097256858, y:0.5149625935162094},{x:2.791770573566085, y:0.5149625935162094},{x:2.8603491271820447, y:0.5149625935162094},{x:2.8915211970074814, y:0.5199501246882793},{x:2.896508728179551, y:0.5386533665835411},{x:2.899002493765586, y:0.5773067331670823},{x:2.901496259351621, y:0.6309226932668329},{x:2.8977556109725686, y:0.6508728179551122},{x:2.8977556109725686, y:0.683291770573566},{x:2.9027431421446384, y:0.7144638403990025},{x:2.9164588528678306, y:0.7244389027431422},{x:2.9463840399002494, y:0.7244389027431422},{x:3.201995012468828, y:0.7231920199501247},{x:3.7281795511221945, y:0.7206982543640897},{x:3.9463840399002494, y:0.7231920199501247},{x:3.9650872817955114, y:0.7194513715710723},{x:3.9850374064837903, y:0.7057356608478803},{x:3.988778054862843, y:0.6882793017456359},{x:3.9925187032418954, y:0.6596009975062345},{x:3.9925187032418954, y:0.6396508728179551},{x:3.986284289276808, y:0.6221945137157108})
);
mosquitosPositionsPhase9 = new Array(
  new Array({x:0.8094237288135593, y:1.5180593220338983},{x:0.8280677966101695, y:1.5417881355932204},{x:0.8594237288135593, y:1.5553474576271187},{x:0.8797627118644068, y:1.5409406779661017},{x:0.8848474576271186, y:1.5265338983050847},{x:0.8772203389830509, y:1.5070423728813558},{x:0.8577288135593221, y:1.4909406779661016}),
  new Array({x:0.8678983050847457, y:1.5392457627118643},{x:0.8755254237288136, y:1.525686440677966},{x:0.8551864406779661, y:1.5146694915254237},{x:0.8365423728813559, y:1.5146694915254237},{x:0.8246779661016949, y:1.528228813559322},{x:0.8153559322033899, y:1.5375508474576272},{x:0.8034915254237288, y:1.5248389830508473},{x:0.8085762711864407, y:1.497720338983051},{x:0.831457627118644, y:1.490093220338983},{x:0.8560338983050847, y:1.5028050847457626}),
  new Array({x:0.8450169491525423, y:1.4841610169491526},{x:0.8560338983050847, y:1.5019576271186441},{x:0.8662033898305085, y:1.5214491525423728},{x:0.8670508474576271, y:1.535008474576271},{x:0.8509491525423729, y:1.5417881355932204},{x:0.8272203389830508, y:1.5358559322033898},{x:0.807728813559322, y:1.520601694915254},{x:0.810271186440678, y:1.5045},{x:0.8331525423728814, y:1.5028050847457626},{x:0.8509491525423729, y:1.5155169491525424},{x:0.8738305084745762, y:1.5129745762711864},{x:0.8704406779661017, y:1.5002627118644067},{x:0.8551864406779661, y:1.4917881355932203},{x:0.8433220338983051, y:1.483313559322034})
);

mosquitosPositionsPhase9S = new Array(
  new Array({x:3.988355167394469, y:0.6244541484716157},{x:3.960698689956332, y:0.6302765647743813},{x:3.947598253275109, y:0.62882096069869},{x:3.9490538573508007, y:0.6142649199417758},{x:3.981077147016012, y:0.5895196506550219},{x:4, y:0.6142649199417758},{x:4.026200873362446, y:0.6244541484716157},{x:4.026200873362446, y:0.6142649199417758},{x:4.014556040756914, y:0.604075691411936},{x:3.9912663755458517, y:0.6171761280931587},{x:3.9737991266375547, y:0.6317321688500728}),
  new Array({x:3.994177583697234, y:0.6302765647743813},{x:4.018922852983988, y:0.6229985443959243},{x:4.029112081513828, y:0.6404657933042213},{x:4.016011644832606, y:0.653566229985444},{x:3.978165938864629, y:0.6593886462882096},{x:3.954876273653566, y:0.6521106259097526},{x:3.944687045123726, y:0.6273653566229985},{x:3.944687045123726, y:0.6128093158660844},{x:3.957787481804949, y:0.6026200873362445},{x:3.988355167394469, y:0.6069868995633187},{x:4.018922852983988, y:0.6215429403202329},{x:4.021834061135372, y:0.6084425036390102},{x:4.004366812227074, y:0.5938864628820961},{x:3.97962154294032, y:0.6011644832605532},{x:3.962154294032023, y:0.5909752547307132},{x:3.994177583697234, y:0.5967976710334789},{x:4.008733624454148, y:0.6317321688500728})
);
mosquitosPositionsPhase10 = new Array(
  new Array({x:0.9091525423728815, y:1.6372881355932203},{x:0.9108474576271186, y:1.664406779661017},{x:0.9091525423728815, y:1.7084745762711864},{x:0.9057627118644069, y:1.755084745762712},{x:0.9032203389830509, y:1.7779661016949153},{x:0.9167796610169492, y:1.7889830508474576},{x:0.9100000000000001, y:1.8059322033898304},{x:0.9142372881355934, y:1.8364406779661018},{x:0.9116949152542373, y:1.8601694915254237},{x:0.9108474576271186, y:1.8983050847457628},{x:0.9142372881355934, y:1.9466101694915254},{x:0.9100000000000001, y:1.9991525423728813},{x:0.9091525423728815, y:2.048305084745763},{x:0.9100000000000001, y:2.1050847457627118},{x:0.9040677966101696, y:2.130508474576271},{x:0.8930508474576271, y:2.138135593220339},{x:0.8667796610169491, y:2.1389830508474574},{x:0.8481355932203389, y:2.145762711864407},{x:0.8379661016949154, y:2.169491525423729},{x:0.8396610169491525, y:2.357627118644068},{x:0.8354237288135593, y:2.3771186440677967},{x:0.815084745762712, y:2.3847457627118644},{x:0.7913559322033898, y:2.3847457627118644},{x:0.7879661016949153, y:2.3779661016949154},{x:0.781186440677966, y:2.392372881355932},{x:0.7769491525423728, y:2.3771186440677967},{x:0.7701694915254238, y:2.3915254237288135},{x:0.7659322033898306, y:2.378813559322034},{x:0.7583050847457626, y:2.3915254237288135},{x:0.7540677966101694, y:2.3771186440677967},{x:0.7472881355932204, y:2.392372881355932},{x:0.7422033898305085, y:2.3745762711864407},{x:0.7337288135593221, y:2.392372881355932},{x:0.731186440677966, y:2.3771186440677967},{x:0.724406779661017, y:2.392372881355932},{x:0.7193220338983051, y:2.3796610169491523},{x:0.7074576271186441, y:2.385593220338983})
);
mosquitosPositionsPhase10S = new Array(
  new Array({x:3.988355167394469, y:0.5807860262008734},{x:3.986899563318777, y:0.5691411935953421},{x:3.986899563318777, y:0.5516739446870451},{x:3.9839883551673947, y:0.5211062590975255},{x:3.9839883551673947, y:0.4774381368267831},{x:3.9839883551673947, y:0.4395924308588064},{x:3.9839883551673947, y:0.36681222707423583},{x:3.9839883551673947, y:0.3042212518195051},{x:3.982532751091703, y:0.25181950509461426},{x:3.981077147016012, y:0.1804949053857351},{x:3.982532751091703, y:0.1339155749636099},{x:3.988355167394469, y:0.11935953420669577},{x:4, y:0.11208151382823872},{x:4.036390101892286, y:0.11208151382823872},{x:4.080058224163028, y:0.10771470160116449},{x:4.10334788937409, y:0.11208151382823872},{x:4.122270742358078, y:0.1222707423580786},{x:4.131004366812227, y:0.14992721979621543},{x:4.132459970887918, y:0.38719068413391555},{x:4.129548762736536, y:0.6157205240174672},{x:4.13391557496361, y:0.6477438136826783},{x:4.139737991266376, y:0.6564774381368268},{x:4.160116448326055, y:0.6637554585152838},{x:4.250363901018923, y:0.6637554585152838},{x:4.339155749636099, y:0.6622998544395924},{x:4.419213973799127, y:0.6652110625909753},{x:4.454148471615721, y:0.6593886462882096},{x:4.4599708879184865, y:0.6419213973799127},{x:4.461426491994177, y:0.6200873362445415},{x:4.464337700145561, y:0.6011644832605532},{x:4.483260553129549, y:0.5909752547307132},{x:4.528384279475983, y:0.5924308588064047},{x:4.5647743813682675, y:0.5924308588064047},{x:4.580786026200873, y:0.5997088791848617},{x:4.580786026200873, y:0.6259097525473072},{x:4.580786026200873, y:0.6739446870451238},{x:4.586608442503639, y:0.7045123726346434},{x:4.609898107714701, y:0.7117903930131004},{x:4.8384279475982535, y:0.710334788937409},{x:4.874818049490538, y:0.710334788937409},{x:4.880640465793304, y:0.7059679767103348},{x:4.88646288209607, y:0.6928675400291121},{x:4.88646288209607, y:0.6695778748180495},{x:4.890829694323144, y:0.6550218340611353},{x:4.89665211062591, y:0.6462882096069869},{x:4.903930131004367, y:0.6390101892285298}, {x:4.898768809849521, y:0.6436388508891929},{x:4.883720930232558, y:0.6422708618331053},{x:4.863201094391245, y:0.6367989056087552},{x:4.846785225718194, y:0.6258549931600548},{x:4.848153214774282, y:0.6149110807113544},{x:4.841313269493844, y:0.5889192886456909})
);
mosquitosPositionsPhase11 = new Array(
  new Array({x:0.5823050847457627, y:2.1045000000000003},{x:0.5662033898305084, y:2.100262711864407},{x:0.5670508474576271, y:2.092635593220339},{x:0.5873898305084746, y:2.0867033898305087},{x:0.6145084745762712, y:2.076533898305085},{x:0.6331525423728813, y:2.0748389830508476},{x:0.636542372881356, y:2.08585593220339},{x:0.6212881355932203, y:2.097720338983051},{x:0.5916271186440678, y:2.102805084745763})
);
mosquitosPositionsPhase11S = new Array(
  new Array({x:4.777017783857729, y:0.6025991792065664},{x:4.790697674418604, y:0.6025991792065664},{x:4.811217510259918, y:0.5957592339261286},{x:4.8331053351573185, y:0.5889192886456909},{x:4.84952120383037, y:0.5807113543091655},{x:4.864569083447332, y:0.5725034199726402},{x:4.864569083447332, y:0.5629274965800274},{x:4.854993160054719, y:0.5615595075239398},{x:4.829001367989056, y:0.5683994528043775},{x:4.80437756497948, y:0.5752393980848153},{x:4.790697674418604, y:0.5820793433652531},{x:4.778385772913817, y:0.5902872777017784},{x:4.778385772913817, y:0.5984952120383037},{x:4.796169630642955, y:0.594391244870041},{x:4.800273597811217, y:0.5861833105335157},{x:4.812585499316006, y:0.5738714090287278},{x:4.822161422708619, y:0.5725034199726402},{x:4.845417236662107, y:0.5656634746922025},{x:4.854993160054719, y:0.5725034199726402},{x:4.8331053351573185, y:0.5902872777017784},{x:4.786593707250342, y:0.6025991792065664},{x:4.775649794801642, y:0.594391244870041})
);
mosquitosPositionsPhase12 = new Array(
  new Array({x:0.710084745762712, y:2.388135593220339},{x:0.7050000000000001, y:2.4008474576271186},{x:0.7058474576271185, y:2.4127118644067798},{x:0.7041525423728814, y:2.4372881355932203},{x:0.7016101694915253, y:2.4466101694915254},{x:0.6905932203389831, y:2.455084745762712},{x:0.652457627118644, y:2.457627118644068},{x:0.46855932203389833, y:2.4559322033898305},{x:0.4558474576271186, y:2.4559322033898305},{x:0.44398305084745765, y:2.4491525423728815},{x:0.4312711864406779, y:2.4389830508474577},{x:0.4278813559322034, y:2.421186440677966},{x:0.42957627118644065, y:2.364406779661017},{x:0.4177118644067797, y:2.3423728813559324},{x:0.40584745762711866, y:2.338135593220339},{x:0.39737288135593224, y:2.333898305084746},{x:0.3999152542372881, y:2.3466101694915253},{x:0.3846610169491525, y:2.3347457627118646},{x:0.3863559322033899, y:2.347457627118644},{x:0.37364406779661014, y:2.333898305084746},{x:0.3744915254237288, y:2.347457627118644},{x:0.3609322033898305, y:2.335593220338983},{x:0.36432203389830503, y:2.35},{x:0.3507627118644067, y:2.335593220338983},{x:0.3524576271186441, y:2.3491525423728814},{x:0.3388983050847458, y:2.335593220338983},{x:0.3278813559322034, y:2.344915254237288},{x:0.32110169491525425, y:2.3533898305084744},{x:0.3185593220338983, y:2.3686440677966103},{x:0.3185593220338983, y:2.383050847457627},{x:0.3177118644067796, y:2.395762711864407},{x:0.3092372881355932, y:2.402542372881356},{x:0.2897457627118644, y:2.4059322033898307},{x:0.2202542372881356, y:2.406779661016949},{x:0.17703389830508476, y:2.4076271186440676},{x:0.11262711864406777, y:2.4084745762711863},{x:0.09906779661016951, y:2.4127118644067798},{x:0.08889830508474578, y:2.41864406779661},{x:0.08381355932203388, y:2.4347457627118643},{x:0.08466101694915251, y:2.4940677966101696},{x:0.08211864406779662, y:2.5567796610169493})
);
mosquitosPositionsPhase12S = new Array(
  new Array({x:4.841313269493844, y:0.5889192886456909},{x:4.848153214774282, y:0.6149110807113544},{x:4.846785225718194, y:0.6258549931600548},{x:4.863201094391245, y:0.6367989056087552},{x:4.883720930232558, y:0.6422708618331053},{x:4.898768809849521, y:0.6436388508891929}, {x:4.902474526928676, y:0.6390101892285298},{x:4.919941775836972, y:0.6390101892285298},{x:4.9490538573508, y:0.6375545851528385},{x:4.9970887918486175, y:0.6346433770014556},{x:5.021834061135372, y:0.6375545851528385},{x:5.033478893740902, y:0.6462882096069869},{x:5.045123726346434, y:0.660844250363901},{x:5.045123726346434, y:0.6841339155749636},{x:5.045123726346434, y:0.7438136826783115},{x:5.043668122270742, y:0.784570596797671},{x:5.049490538573508, y:0.7976710334788938},{x:5.059679767103348, y:0.8049490538573508},{x:5.1018922852983986, y:0.8049490538573508},{x:5.13391557496361, y:0.8005822416302766},{x:5.141193595342067, y:0.7933042212518195},{x:5.142649199417758, y:0.7700145560407569},{x:5.145560407569141, y:0.7438136826783115},{x:5.142649199417758, y:0.7336244541484717},{x:5.151382823871907, y:0.7263464337700145},{x:5.142649199417758, y:0.7205240174672489},{x:5.148471615720524, y:0.7132459970887919},{x:5.135371179039302, y:0.7045123726346434},{x:5.151382823871907, y:0.7016011644832606},{x:5.1368267831149925, y:0.6957787481804949},{x:5.1470160116448325, y:0.6885007278020379},{x:5.139737991266376, y:0.6812227074235808},{x:5.139737991266376, y:0.6579330422125182},{x:5.14410480349345, y:0.6171761280931587},{x:5.142649199417758, y:0.5778748180494906})
);
mosquitosPositionsPhase13 = new Array(
  new Array({x:0.05433898305084746, y:2.3697542372881357},{x:0.053491525423728814, y:2.412127118644068},{x:0.0687457627118644, y:2.430771186440678},{x:0.08484745762711865, y:2.4282288135593224},{x:0.09162711864406779, y:2.401110169491526},{x:0.0899322033898305, y:2.372296610169492},{x:0.07383050847457627, y:2.339245762711865},{x:0.06450847457627118, y:2.318906779661017},{x:0.06027118644067797, y:2.347720338983051}),
  new Array({x:0.06959322033898305, y:2.345177966101695},{x:0.08230508474576272, y:2.3578898305084746},{x:0.08654237288135593, y:2.3824661016949156},{x:0.07298305084745763, y:2.397720338983051},{x:0.06027118644067797, y:2.410432203389831},{x:0.053491525423728814, y:2.4222966101694916},{x:0.06959322033898305, y:2.437550847457627},{x:0.08315254237288136, y:2.43585593220339},{x:0.08738983050847457, y:2.4282288135593224},{x:0.08823728813559321, y:2.410432203389831})
);
mosquitosPositionsPhase13S = new Array(
  new Array({x:5.145560407569141, y:0.5924308588064047},{x:5.1615720524017465, y:0.5778748180494906},{x:5.16448326055313, y:0.5545851528384279},{x:5.15429403202329, y:0.5356622998544396},{x:5.126637554585153, y:0.529839883551674},{x:5.126637554585153, y:0.512372634643377},{x:5.13391557496361, y:0.4963609898107715},{x:5.157205240174672, y:0.5007278020378457},{x:5.158660844250364, y:0.5152838427947598},{x:5.14410480349345, y:0.5385735080058224},{x:5.126637554585153, y:0.5604075691411936},{x:5.129548762736536, y:0.5807860262008734},{x:5.151382823871907, y:0.5895196506550219},{x:5.148471615720524, y:0.6084425036390102},{x:5.120815138282387, y:0.6011644832605532})
);
mosquitosPositionsPhase14 = new Array(
  new Array({x:0.10330508474576272, y:2.5754237288135595},{x:0.12110169491525424, y:2.574576271186441},{x:0.13127118644067798, y:2.574576271186441},{x:0.13805084745762713, y:2.574576271186441},{x:0.14228813559322034, y:2.5762711864406778},{x:0.14567796610169492, y:2.5822033898305086},{x:0.14652542372881355, y:2.594915254237288},{x:0.1439830508474576, y:2.6161016949152542})
);
mosquitosPositionsPhase14S = new Array(
  //new Array({x:5.149927219796216, y:0.5604075691411936},{x:5.180494905385735, y:0.5604075691411936},{x:5.202328966521106, y:0.5531295487627366},{x:5.205240174672489, y:0.5531295487627366},{x:5.208151382823872, y:0.5487627365356623},{x:5.211062590975255, y:0.5400291120815138},{x:5.205240174672489, y:0.5356622998544396},{x:5.213973799126638, y:0.5312954876273653},{x:5.205240174672489, y:0.5269286754002911},{x:5.212518195050946, y:0.5211062590975255},{x:5.205240174672489, y:0.5181950509461426},{x:5.212518195050946, y:0.5152838427947598},{x:5.203784570596798, y:0.5080058224163028},{x:5.213973799126638, y:0.4949053857350801},{x:5.197962154294032, y:0.4861717612809316},{x:5.212518195050946, y:0.4745269286754003},{x:5.212518195050946, y:0.45269286754002913},{x:5.209606986899563, y:0.4090247452692867})
  new Array({x:5.157330154946365, y:0.564958283671037},{x:5.176400476758046, y:0.5613825983313468},{x:5.191895113230036, y:0.5530393325387366},{x:5.200238379022646, y:0.5542312276519666},{x:5.206197854588797, y:0.5518474374255066},{x:5.210965435041716, y:0.5411203814064363},{x:5.206197854588797, y:0.531585220500596},{x:5.212157330154946, y:0.5280095351609059},{x:5.205005959475566, y:0.5244338498212158},{x:5.210965435041716, y:0.5208581644815257},{x:5.207389749702026, y:0.5148986889153755},{x:5.214541120381407, y:0.5089392133492253},{x:5.206197854588797, y:0.5041716328963052},{x:5.210965435041716, y:0.49821215733015495},{x:5.207389749702026, y:0.49463647199046484},{x:5.213349225268177, y:0.4922526817640048},{x:5.206197854588797, y:0.48867699642431467},{x:5.210965435041716, y:0.48152562574493446},{x:5.212157330154946, y:0.4696066746126341},{x:5.214541120381407, y:0.43146603098927294},{x:5.209773539928486, y:0.4135876042908224})
);
mosquitosPositionsPhase15 = new Array(
  new Array({x:0.1297627118644068, y:2.3629745762711867},{x:0.11959322033898305, y:2.371449152542373},{x:0.1128135593220339, y:2.3892457627118646},{x:0.11620338983050847, y:2.4222966101694916},{x:0.11620338983050847, y:2.443483050847458},{x:0.10942372881355932, y:2.4646694915254237},{x:0.11620338983050847, y:2.4900932203389834},{x:0.13145762711864406, y:2.497720338983051},{x:0.14416949152542374, y:2.4782288135593222},{x:0.1373898305084746, y:2.455347457627119}),
  new Array({x:0.14077966101694916, y:2.49856779661017},{x:0.12044067796610168, y:2.488398305084746},{x:0.11535593220338984, y:2.4799237288135596},{x:0.12467796610169492, y:2.462127118644068},{x:0.13908474576271185, y:2.457042372881356},{x:0.14332203389830506, y:2.4417881355932205},{x:0.134, y:2.4189067796610173},{x:0.11450847457627118, y:2.407889830508475},{x:0.11027118644067797, y:2.38585593220339},{x:0.11874576271186442, y:2.372296610169492})
);
mosquitosPositionsPhase15S = new Array(
  new Array({x:5.203784570596798, y:0.39592430858806404},{x:5.1965065502183405, y:0.3813682678311499},{x:5.2066957787481805, y:0.3682678311499272},{x:5.219796215429403, y:0.36681222707423583},{x:5.228529839883552, y:0.3522561863173217},{x:5.225618631732169, y:0.3420669577874818},{x:5.208151382823872, y:0.3318777292576419},{x:5.200873362445415, y:0.32023289665211063},{x:5.202328966521106, y:0.30131004366812225},{x:5.212518195050946, y:0.2954876273653566},{x:5.228529839883552, y:0.3056768558951965},{x:5.224163027656477, y:0.3245997088791849},{x:5.208151382823872, y:0.3289665211062591},{x:5.195050946142649, y:0.34934497816593885},{x:5.222707423580786, y:0.3682678311499272},{x:5.21688500727802, y:0.4002911208151383},{x:5.197962154294032, y:0.4148471615720524})
);
mosquitosPositionsPhase16 = new Array(
  new Array({x:0.14652542372881355, y:2.711016949152542},{x:0.14652542372881355, y:2.7245762711864407},{x:0.14737288135593218, y:2.7296610169491524},{x:0.14567796610169492, y:2.7415254237288136},{x:0.14567796610169492, y:2.7796610169491527},{x:0.13720338983050845, y:2.788983050847458},{x:0.14567796610169492, y:2.7932203389830508},{x:0.13889830508474577, y:2.797457627118644},{x:0.14567796610169492, y:2.8},{x:0.13805084745762713, y:2.8042372881355933},{x:0.14652542372881355, y:2.807627118644068},{x:0.1397457627118644, y:2.811864406779661},{x:0.14652542372881355, y:2.8177966101694913},{x:0.13889830508474577, y:2.823728813559322},{x:0.1448305084745763, y:2.8262711864406778},{x:0.14059322033898303, y:2.83135593220339},{x:0.14313559322033897, y:2.833898305084746},{x:0.1439830508474576, y:2.8423728813559324},{x:0.1439830508474576, y:2.8466101694915253},{x:0.1397457627118644, y:2.8508474576271188},{x:0.12364406779661014, y:2.8508474576271188},{x:0.10923728813559319, y:2.854237288135593},{x:0.09144067796610167, y:2.8627118644067795})
);
mosquitosPositionsPhase16S = new Array(
  new Array({x:5.211062590975255, y:0.29112081513828236},{x:5.213973799126638, y:0.2780203784570597},{x:5.212518195050946, y:0.264919941775837},{x:5.212518195050946, y:0.2547307132459971},{x:5.209606986899563, y:0.25036390101892286},{x:5.199417758369724, y:0.24599708879184862},{x:5.190684133915575, y:0.24599708879184862},{x:5.168850072780204, y:0.24599708879184862},{x:5.138282387190684, y:0.2780203784570597})
);
mosquitosPositionsPhase17 = new Array(
  new Array({x:0.06959322033898305, y:2.5917881355932204},{x:0.053491525423728814, y:2.568906779661017},{x:0.05264406779661017, y:2.5443305084745766},{x:0.06535593220338982, y:2.5324661016949155},{x:0.08654237288135593, y:2.5468728813559323},{x:0.0856949152542373, y:2.5706016949152546},{x:0.0687457627118644, y:2.589245762711865},{x:0.059423728813559326, y:2.616364406779661},{x:0.05603389830508475, y:2.6485677966101697},{x:0.07298305084745763, y:2.6689067796610173},{x:0.08315254237288136, y:2.657889830508475},{x:0.08484745762711865, y:2.6400932203389833},{x:0.08230508474576272, y:2.629076271186441},{x:0.06620338983050847, y:2.614669491525424},{x:0.0628135593220339, y:2.5841610169491527}),
  new Array({x:0.05772881355932204, y:2.5706016949152546},{x:0.05772881355932204, y:2.5917881355932204},{x:0.07298305084745763, y:2.6112796610169493},{x:0.084, y:2.6273813559322035},{x:0.08484745762711865, y:2.6528050847457627},{x:0.07891525423728814, y:2.6689067796610173},{x:0.061118644067796615, y:2.661279661016949},{x:0.05772881355932204, y:2.6417881355932207},{x:0.0780677966101695, y:2.6138220338983054},{x:0.07467796610169491, y:2.595177966101695},{x:0.05857627118644068, y:2.580771186440678},{x:0.0551864406779661, y:2.562127118644068},{x:0.0551864406779661, y:2.5417881355932206},{x:0.07213559322033898, y:2.5350084745762715},{x:0.08484745762711865, y:2.5494152542372883},{x:0.07383050847457627, y:2.5756864406779663},{x:0.07383050847457627, y:2.621449152542373},{x:0.07976271186440678, y:2.6333135593220343})
);
mosquitosPositionsPhase17S = new Array(
  new Array({x:5.1470160116448325, y:0.24745269286754004},{x:5.132459970887918, y:0.2678311499272198},{x:5.1368267831149925, y:0.29694323144104806},{x:5.15429403202329, y:0.32168850072780203},{x:5.151382823871907, y:0.35662299854439594},{x:5.131004366812227, y:0.3522561863173217},{x:5.132459970887918, y:0.32168850072780203},{x:5.152838427947598, y:0.2925764192139738},{x:5.152838427947598, y:0.25036390101892286},{x:5.13391557496361, y:0.24017467248908297})
);
mosquitosPositionsPhase18 = new Array(
  //new Array({x:0.07298305084745763, y:2.6553474576271188},{x:0.07298305084745763, y:2.6706016949152542},{x:0.06450847457627118, y:2.6917881355932205},{x:0.07467796610169491, y:2.6985677966101695},{x:0.06450847457627118, y:2.7036525423728817}, {x:0.06789830508474576, y:2.7606016949152543},{x:0.07976271186440678, y:2.768228813559322},{x:0.1051864406779661, y:2.768228813559322},{x:0.13061016949152543, y:2.768228813559322},{x:0.1509491525423729, y:2.781618644067797},{x:0.15264406779661016, y:2.7960254237288136},{x:0.1534915254237288, y:2.8155169491525425},{x:0.15433898305084748, y:2.845177966101695},{x:0.16027118644067795, y:2.8587372881355932},{x:0.1763728813559322, y:2.8512796610169493},{x:0.18315254237288137, y:2.8478898305084746},{x:0.18654237288135594, y:2.8555169491525427},{x:0.19077966101694915, y:2.8478898305084746},{x:0.19671186440677968, y:2.8538220338983054},{x:0.2009491525423729, y:2.845347457627119},{x:0.20688135593220341, y:2.854669491525424},{x:0.210271186440678, y:2.8445000000000003},{x:0.2145084745762712, y:2.854669491525424},{x:0.21959322033898304, y:2.8445000000000003},{x:0.22467796610169494, y:2.8438220338983054},{x:0.22806779661016952, y:2.8436525423728816},{x:0.2306101694915254, y:2.8504322033898306},{x:0.24925423728813556, y:2.8604322033898306},{x:0.281457627118644, y:2.8504322033898306},{x:0.34671186440677965, y:2.8512796610169493},{x:0.38908474576271185, y:2.8504322033898306},{x:0.4034915254237288, y:2.8487372881355932},{x:0.40603389830508474, y:2.845347457627119},{x:0.4111186440677966, y:2.856364406779661},{x:0.4162033898305085, y:2.855347457627119},{x:0.41874576271186437, y:2.8504322033898306},{x:0.4263728813559322, y:2.852805084745763},{x:0.42806779661016947, y:2.8504322033898306},{x:0.43145762711864405, y:2.8436525423728816},{x:0.434, y:2.8529745762711867},{x:0.434, y:2.8461949152542376},{x:0.4416271186440678, y:2.856364406779661},{x:0.44501694915254236, y:2.845347457627119},{x:0.4501016949152542, y:2.8512796610169493},{x:0.4636610169491525, y:2.8504322033898306},{x:0.484, y:2.8504322033898306},{x:0.49416949152542367, y:2.8680593220338984},{x:0.4975593220338983, y:2.8875508474576272},{x:0.4975593220338983, y:2.9256864406779663},{x:0.4967118644067796, y:2.952805084745763},{x:0.4975593220338983, y:2.9807711864406783}, {x:0.48484745762711867, y:3.0036525423728815},{x:0.4628135593220339, y:3.0129745762711866},{x:0.4424745762711864, y:3.0138220338983053},{x:0.4323050847457627, y:3.0180593220338983},{x:0.42722033898305084, y:3.0290762711864407},{x:0.4263728813559322, y:3.0629745762711864},{x:0.4297627118644068, y:3.1011101694915255},{x:0.42383050847457626, y:3.1138220338983054},{x:0.38569491525423727, y:3.1180593220338984},{x:0.3568813559322034, y:3.1172118644067797},{x:0.345864406779661, y:3.1087372881355932},{x:0.345864406779661, y:3.095177966101695},{x:0.34332203389830507, y:3.0231440677966104})
  new Array({x:0.0855084745762712, y:2.889830508474576},{x:0.08296610169491525, y:2.906779661016949},{x:0.08466101694915251, y:2.9169491525423727},{x:0.0855084745762712, y:2.9389830508474577},{x:0.08381355932203388, y:2.9635593220338983},{x:0.07788135593220336, y:2.9703389830508473},{x:0.0855084745762712, y:2.9745762711864407},{x:0.08127118644067793, y:2.977966101694915},{x:0.08466101694915251, y:2.9822033898305085},{x:0.07957627118644067, y:2.9855932203389832},{x:0.08466101694915251, y:2.989830508474576},{x:0.0804237288135593, y:2.9957627118644066},{x:0.08635593220338983, y:2.9991525423728813},{x:0.07872881355932204, y:3.0050847457627117},{x:0.0855084745762712, y:3.0084745762711864},{x:0.0804237288135593, y:3.01271186440678},{x:0.08296610169491525, y:3.023728813559322},{x:0.08296610169491525, y:3.0372881355932204},{x:0.08127118644067793, y:3.0661016949152544},{x:0.08127118644067793, y:3.0940677966101693},{x:0.0855084745762712, y:3.1127118644067795},{x:0.09144067796610167, y:3.1220338983050846},{x:0.10584745762711861, y:3.126271186440678},{x:0.12364406779661014, y:3.1279661016949154},{x:0.13296610169491524, y:3.1415254237288135},{x:0.13381355932203387, y:3.1932203389830507},{x:0.13720338983050845, y:3.2084745762711866},{x:0.14567796610169492, y:3.2135593220338983},{x:0.1566949152542373, y:3.2152542372881356},{x:0.16940677966101692, y:3.211864406779661},{x:0.17618644067796607, y:3.2177966101694917},{x:0.18127118644067797, y:3.2084745762711866},{x:0.18974576271186439, y:3.2177966101694917},{x:0.1914406779661017, y:3.211016949152542},{x:0.19822033898305086, y:3.2161016949152543},{x:0.2033050847457627, y:3.2084745762711866},{x:0.2083898305084746, y:3.216949152542373},{x:0.2126271186440678, y:3.211016949152542},{x:0.22194915254237285, y:3.2161016949152543},{x:0.2685593220338983, y:3.2161016949152543},{x:0.3753389830508474, y:3.2152542372881356},{x:0.38720338983050845, y:3.2152542372881356},{x:0.3948305084745763, y:3.2127118644067796},{x:0.40584745762711866, y:3.2203389830508473},{x:0.41008474576271187, y:3.2093220338983053},{x:0.42025423728813555, y:3.2203389830508473},{x:0.4270338983050847, y:3.2093220338983053},{x:0.4329661016949153, y:3.216949152542373},{x:0.43889830508474575, y:3.2101694915254235},{x:0.4499152542372881, y:3.216949152542373},{x:0.4711016949152543, y:3.2152542372881356},{x:0.48635593220338985, y:3.2177966101694917},{x:0.49483050847457627, y:3.2220338983050847},{x:0.49991525423728816, y:3.23728813559322},{x:0.49991525423728816, y:3.2745762711864406},{x:0.49991525423728816, y:3.3152542372881357},{x:0.4982203389830508, y:3.344915254237288},{x:0.4990677966101695, y:3.3627118644067795}, {x:0.48635593220338985, y:3.3720338983050846},{x:0.46855932203389833, y:3.3796610169491523},{x:0.4566949152542373, y:3.378813559322034},{x:0.440593220338983, y:3.380508474576271},{x:0.4312711864406779, y:3.385593220338983},{x:0.4261864406779661, y:3.3949152542372882},{x:0.42533898305084744, y:3.414406779661017},{x:0.42449152542372875, y:3.4601694915254235},{x:0.42449152542372875, y:3.477966101694915},{x:0.41516949152542376, y:3.488135593220339},{x:0.3897457627118644, y:3.490677966101695},{x:0.3516101694915254, y:3.488135593220339},{x:0.3414406779661017, y:3.4788135593220337},{x:0.3388983050847458, y:3.4677966101694917},{x:0.3388983050847458, y:3.451694915254237},{x:0.3388983050847458, y:3.397457627118644})
);
mosquitosPositionsPhase18S = new Array(
  //new Array({x:0.07298305084745763, y:2.6553474576271188},{x:0.07298305084745763, y:2.6706016949152542},{x:0.06450847457627118, y:2.6917881355932205},{x:0.07467796610169491, y:2.6985677966101695},{x:0.06450847457627118, y:2.7036525423728817}, {x:0.06789830508474576, y:2.7606016949152543},{x:0.07976271186440678, y:2.768228813559322},{x:0.1051864406779661, y:2.768228813559322},{x:0.13061016949152543, y:2.768228813559322},{x:0.1509491525423729, y:2.781618644067797},{x:0.15264406779661016, y:2.7960254237288136},{x:0.1534915254237288, y:2.8155169491525425},{x:0.15433898305084748, y:2.845177966101695},{x:0.16027118644067795, y:2.8587372881355932},{x:0.1763728813559322, y:2.8512796610169493},{x:0.18315254237288137, y:2.8478898305084746},{x:0.18654237288135594, y:2.8555169491525427},{x:0.19077966101694915, y:2.8478898305084746},{x:0.19671186440677968, y:2.8538220338983054},{x:0.2009491525423729, y:2.845347457627119},{x:0.20688135593220341, y:2.854669491525424},{x:0.210271186440678, y:2.8445000000000003},{x:0.2145084745762712, y:2.854669491525424},{x:0.21959322033898304, y:2.8445000000000003},{x:0.22467796610169494, y:2.8438220338983054},{x:0.22806779661016952, y:2.8436525423728816},{x:0.2306101694915254, y:2.8504322033898306},{x:0.24925423728813556, y:2.8604322033898306},{x:0.281457627118644, y:2.8504322033898306},{x:0.34671186440677965, y:2.8512796610169493},{x:0.38908474576271185, y:2.8504322033898306},{x:0.4034915254237288, y:2.8487372881355932},{x:0.40603389830508474, y:2.845347457627119},{x:0.4111186440677966, y:2.856364406779661},{x:0.4162033898305085, y:2.855347457627119},{x:0.41874576271186437, y:2.8504322033898306},{x:0.4263728813559322, y:2.852805084745763},{x:0.42806779661016947, y:2.8504322033898306},{x:0.43145762711864405, y:2.8436525423728816},{x:0.434, y:2.8529745762711867},{x:0.434, y:2.8461949152542376},{x:0.4416271186440678, y:2.856364406779661},{x:0.44501694915254236, y:2.845347457627119},{x:0.4501016949152542, y:2.8512796610169493},{x:0.4636610169491525, y:2.8504322033898306},{x:0.484, y:2.8504322033898306},{x:0.49416949152542367, y:2.8680593220338984},{x:0.4975593220338983, y:2.8875508474576272},{x:0.4975593220338983, y:2.9256864406779663},{x:0.4967118644067796, y:2.952805084745763},{x:0.4975593220338983, y:2.9807711864406783}, {x:0.48484745762711867, y:3.0036525423728815},{x:0.4628135593220339, y:3.0129745762711866},{x:0.4424745762711864, y:3.0138220338983053},{x:0.4323050847457627, y:3.0180593220338983},{x:0.42722033898305084, y:3.0290762711864407},{x:0.4263728813559322, y:3.0629745762711864},{x:0.4297627118644068, y:3.1011101694915255},{x:0.42383050847457626, y:3.1138220338983054},{x:0.38569491525423727, y:3.1180593220338984},{x:0.3568813559322034, y:3.1172118644067797},{x:0.345864406779661, y:3.1087372881355932},{x:0.345864406779661, y:3.095177966101695},{x:0.34332203389830507, y:3.0231440677966104})
  //new Array({x:5.141193595342067, y:0.22561863173216884},{x:5.141193595342067, y:0.2096069868995633},{x:5.138282387190684, y:0.19213973799126638},{x:5.139737991266376, y:0.16011644832605532},{x:5.139737991266376, y:0.13100436681222707},{x:5.142649199417758, y:0.11208151382823872},{x:5.155749636098981, y:0.10334788937409024},{x:5.186317321688501, y:0.10189228529839883},{x:5.5050946142649195, y:0.10189228529839883},{x:5.9374090247452695, y:0.09898107714701601},{x:5.9825327510917035, y:0.10334788937409024},{x:5.9970887918486175, y:0.10043668122270742},{x:6.0029112081513825, y:0.08442503639010189},{x:6.0029112081513825, y:0.05822416302765648},{x:6.005822416302766, y:0.036390101892285295},{x:6.013100436681222, y:0.027656477438136828},{x:6.03056768558952, y:0.023289665211062592},{x:6.197962154294032, y:0.026200873362445413},{x:6.219796215429403, y:0.033478893740902474},{x:6.228529839883552, y:0.053857350800582245},{x:6.225618631732169, y:0.29694323144104806},{x:6.2372634643377, y:0.3173216885007278},{x:6.254730713245997, y:0.31877729257641924},{x:6.27802037845706, y:0.3289665211062591},{x:6.2809315866084425, y:0.35662299854439594},{x:6.285298398835517, y:0.40465793304221254},{x:6.302765647743814, y:0.4148471615720524},{x:6.318777292576419, y:0.4163027656477438},{x:6.327510917030568, y:0.42066957787481807},{x:6.333333333333333, y:0.413391557496361},{x:6.342066957787482, y:0.42066957787481807},{x:6.352256186317321, y:0.4163027656477438},{x:6.36098981077147, y:0.42358078602620086},{x:6.369723435225619, y:0.413391557496361},{x:6.382823871906841, y:0.4192139737991266},{x:6.558951965065503, y:0.4192139737991266},{x:6.5749636098981075, y:0.42212518195050946},{x:6.582241630276565, y:0.4119359534206696},{x:6.595342066957787, y:0.4264919941775837},{x:6.5997088791848615, y:0.4148471615720524},{x:6.612809315866085, y:0.42503639010189226},{x:6.620087336244541, y:0.4148471615720524},{x:6.637554585152839, y:0.4177583697234352},{x:6.666666666666667, y:0.42212518195050946},{x:6.685589519650655, y:0.43522561863173215},{x:6.687045123726347, y:0.48180494905385735},{x:6.688500727802038, y:0.5312954876273653},{x:6.688500727802038, y:0.5574963609898108},{x:6.688500727802038, y:0.5778748180494906},{x:6.678311499272198, y:0.5953420669577875},{x:6.657933042212518, y:0.6011644832605532},{x:6.641921397379913, y:0.5982532751091703},{x:6.627365356622999, y:0.5982532751091703},{x:6.61863173216885, y:0.6055312954876274},{x:6.611353711790393, y:0.6171761280931587},{x:6.60844250363901, y:0.6477438136826783},{x:6.60844250363901, y:0.6841339155749636},{x:6.60844250363901, y:0.7088791848617176},{x:6.5997088791848615, y:0.7161572052401747},{x:6.567685589519651, y:0.7176128093158661},{x:6.537117903930131, y:0.7190684133915575},{x:6.521106259097525, y:0.7190684133915575},{x:6.518195050946143, y:0.7059679767103348},{x:6.513828238719069, y:0.6943231441048034},{x:6.513828238719069, y:0.6768558951965066},{x:6.512372634643377, y:0.6259097525473072})
  //new Array({x:5.141646489104116, y:0.22760290556900725},{x:5.14043583535109, y:0.2106537530266344},{x:5.14043583535109, y:0.19975786924939468},{x:5.1392251815980625, y:0.1791767554479419},{x:5.1392251815980625, y:0.15617433414043583},{x:5.1392251815980625, y:0.13801452784503632},{x:5.1392251815980625, y:0.12469733656174334},{x:5.14043583535109, y:0.1162227602905569},{x:5.1440677966101696, y:0.11016949152542373},{x:5.148910411622276, y:0.1053268765133172},{x:5.156174334140436, y:0.1016949152542373},{x:5.175544794188862, y:0.09927360774818401},{x:5.207021791767555, y:0.10048426150121065},{x:5.523002421307506, y:0.10048426150121065},{x:5.9176755447941884, y:0.10048426150121065},{x:5.985472154963681, y:0.09927360774818401},{x:5.99636803874092, y:0.09443099273607748},{x:6.001210653753026, y:0.08595641646489104},{x:6.00363196125908, y:0.06900726392251816},{x:6.00363196125908, y:0.05569007263922518},{x:6.0024213075060535, y:0.03753026634382567},{x:6.00726392251816, y:0.03026634382566586},{x:6.012106537530267, y:0.021791767554479417},{x:6.0290556900726395, y:0.020581113801452784},{x:6.2058111380145276, y:0.024213075060532687},{x:6.219128329297821, y:0.029055690072639227},{x:6.22639225181598, y:0.043583535108958835},{x:6.230024213075061, y:0.1234866828087167},{x:6.22639225181598, y:0.2966101694915254},{x:6.232445520581114, y:0.3099273607748184},{x:6.243341404358354, y:0.31840193704600483},{x:6.254237288135593, y:0.31840193704600483},{x:6.268765133171913, y:0.3196125907990315},{x:6.278450363196126, y:0.32566585956416466},{x:6.283292978208232, y:0.34261501210653755},{x:6.284503631961259, y:0.37409200968523004},{x:6.283292978208232, y:0.39709443099273606},{x:6.291767554479419, y:0.4128329297820823},{x:6.306295399515738, y:0.41646489104116224},{x:6.317191283292979, y:0.41646489104116224},{x:6.325665859564165, y:0.4188861985472155},{x:6.330508474576271, y:0.4116222760290557},{x:6.3341404358353515, y:0.41767554479418884},{x:6.338983050847458, y:0.4116222760290557},{x:6.342615012106537, y:0.41767554479418884},{x:6.346246973365617, y:0.4128329297820823},{x:6.352300242130751, y:0.41646489104116224},{x:6.3559322033898304, y:0.41041162227602906},{x:6.357142857142857, y:0.4188861985472155},{x:6.361985472154964, y:0.4128329297820823},{x:6.3692493946731235, y:0.4225181598062954},{x:6.37409200968523, y:0.4152542372881356},{x:6.391041162227603, y:0.4188861985472155},{x:6.562953995157385, y:0.4188861985472155},{x:6.579903147699758, y:0.41404358353510895},{x:6.585956416464891, y:0.4225181598062954},{x:6.5907990314769975, y:0.4116222760290557},{x:6.594430992736077, y:0.4188861985472155},{x:6.598062953995157, y:0.4116222760290557},{x:6.602905569007264, y:0.41646489104116224},{x:6.60774818401937, y:0.4128329297820823},{x:6.61138014527845, y:0.4188861985472155},{x:6.616222760290557, y:0.4116222760290557},{x:6.621065375302663, y:0.42009685230024213},{x:6.623486682808717, y:0.4152542372881356},{x:6.642857142857143, y:0.41767554479418884},{x:6.662227602905569, y:0.42009685230024213},{x:6.674334140435835, y:0.4225181598062954},{x:6.682808716707021, y:0.4297820823244552},{x:6.690072639225182, y:0.4491525423728814},{x:6.687651331719128, y:0.5012106537530266},{x:6.686440677966102, y:0.5581113801452785},{x:6.686440677966102, y:0.5738498789346247},{x:6.684019370460049, y:0.5920096852300242},{x:6.645278450363196, y:0.5980629539951574},{x:6.62953995157385, y:0.6004842615012107},{x:6.621065375302663, y:0.6004842615012107},{x:6.612590799031477, y:0.6089588377723971},{x:6.60774818401937, y:0.6234866828087167},{x:6.606537530266344, y:0.6476997578692494},{x:6.6041162227602905, y:0.6743341404358354},{x:6.605326876513317, y:0.6924939467312349},{x:6.605326876513317, y:0.7082324455205811},{x:6.599273607748184, y:0.7179176755447942},{x:6.589588377723971, y:0.7179176755447942},{x:6.570217917675545, y:0.7191283292978208},{x:6.547215496368039, y:0.7203389830508474},{x:6.523002421307506, y:0.7179176755447942},{x:6.516949152542373, y:0.711864406779661},{x:6.512106537530267, y:0.6997578692493946},{x:6.509685230024213, y:0.6755447941888619},{x:6.509685230024213, y:0.6537530266343826})
  new Array({x:5.140287769784172, y:0.2278177458033573},{x:5.139088729016787, y:0.20623501199040767},{x:5.139088729016787, y:0.1882494004796163},{x:5.136690647482014, y:0.1642685851318945},{x:5.136690647482014, y:0.1474820143884892},{x:5.1378896882494, y:0.12949640287769784},{x:5.140287769784172, y:0.11750599520383694},{x:5.142685851318944, y:0.11031175059952038},{x:5.149880095923262, y:0.10431654676258993},{x:5.161870503597123, y:0.09952038369304557},{x:5.199040767386091, y:0.09592326139088729},{x:5.980815347721823, y:0.09952038369304557},{x:5.995203836930456, y:0.09352517985611511},{x:5.9988009592326135, y:0.08752997601918465},{x:6.0011990407673865, y:0.07553956834532374},{x:6.0011990407673865, y:0.06115107913669065},{x:6.002398081534772, y:0.04316546762589928},{x:6.002398081534772, y:0.03717026378896882},{x:6.004796163069544, y:0.03237410071942446},{x:6.009592326139089, y:0.026378896882494004},{x:6.017985611510792, y:0.02158273381294964},{x:6.03357314148681, y:0.019184652278177457},{x:6.199040767386091, y:0.02158273381294964},{x:6.213429256594724, y:0.026378896882494004},{x:6.2254196642685855, y:0.03836930455635491},{x:6.23021582733813, y:0.05515587529976019},{x:6.232613908872902, y:0.22302158273381295},{x:6.2314148681055155, y:0.23501199040767387},{x:6.232613908872902, y:0.2422062350119904},{x:6.2398081534772185, y:0.24820143884892087},{x:6.252997601918465, y:0.2529976019184652},{x:6.264988009592326, y:0.2529976019184652},{x:6.275779376498801, y:0.25539568345323743},{x:6.2829736211031175, y:0.26498800959232616},{x:6.287769784172662, y:0.2805755395683453},{x:6.286570743405276, y:0.33213429256594723},{x:6.292565947242206, y:0.34532374100719426},{x:6.309352517985611, y:0.3501199040767386},{x:6.320143884892087, y:0.34652278177458035},{x:6.3261390887290165, y:0.3513189448441247},{x:6.333333333333333, y:0.3441247002398082},{x:6.335731414868105, y:0.3501199040767386},{x:6.341726618705036, y:0.34532374100719426},{x:6.34652278177458, y:0.3513189448441247},{x:6.35251798561151, y:0.3405275779376499},{x:6.356115107913669, y:0.3501199040767386},{x:6.363309352517986, y:0.3405275779376499},{x:6.36810551558753, y:0.34772182254196643},{x:6.374100719424461, y:0.3393285371702638},{x:6.384892086330935, y:0.3489208633093525},{x:6.5647482014388485, y:0.3489208633093525},{x:6.580335731414868, y:0.3441247002398082},{x:6.5875299760191846, y:0.3513189448441247},{x:6.592326139088729, y:0.34172661870503596},{x:6.59832134292566, y:0.3489208633093525},{x:6.610311750599521, y:0.3405275779376499},{x:6.615107913669065, y:0.34532374100719426},{x:6.624700239808154, y:0.34172661870503596},{x:6.633093525179856, y:0.3513189448441247},{x:6.670263788968825, y:0.3537170263788969},{x:6.684652278177458, y:0.3609112709832134},{x:6.689448441247002, y:0.3800959232613909},{x:6.68705035971223, y:0.4316546762589928},{x:6.68705035971223, y:0.47721822541966424},{x:6.689448441247002, y:0.5155875299760192},{x:6.684652278177458, y:0.526378896882494},{x:6.6450839328537175, y:0.5287769784172662},{x:6.630695443645084, y:0.5287769784172662},{x:6.621103117505995, y:0.5311750599520384},{x:6.613908872901678, y:0.5359712230215827},{x:6.606714628297362, y:0.5467625899280576},{x:6.60431654676259, y:0.5623501199040767},{x:6.60431654676259, y:0.5899280575539568},{x:6.60431654676259, y:0.617505995203837},{x:6.606714628297362, y:0.6366906474820144},{x:6.601918465227818, y:0.6462829736211031},{x:6.592326139088729, y:0.6510791366906474},{x:6.568345323741007, y:0.6510791366906474},{x:6.543165467625899, y:0.6486810551558753},{x:6.52757793764988, y:0.6426858513189448},{x:6.516786570743405, y:0.6258992805755396},{x:6.514388489208633, y:0.5947242206235012})
);
mosquitosPositionsPhase19 = new Array(
  new Array({x:0.3475593220338983, y:3.0248389830508478},{x:0.3306101694915254, y:3.0468728813559323},{x:0.3051864406779661, y:3.0299237288135594},{x:0.30433898305084744, y:2.9994152542372885},{x:0.3068813559322034, y:2.9604322033898307},{x:0.32976271186440675, y:2.9350084745762715},{x:0.35942372881355933, y:2.942635593220339},{x:0.38145762711864406, y:2.9612796610169494},{x:0.37213559322033896, y:2.976533898305085},{x:0.3450169491525424, y:2.983313559322034},{x:0.3407796610169491, y:3.0002627118644067},{x:0.3704406779661017, y:3.0155169491525426},{x:0.3780677966101695, y:3.040940677966102},{x:0.3492542372881356, y:3.0519576271186444}), 
  new Array({x:0.3789152542372881, y:2.9392457627118644},{x:0.3823050847457627, y:2.9629745762711868},{x:0.3611186440677966, y:2.9731440677966106},{x:0.32552542372881355, y:2.9841610169491526},{x:0.30857627118644065, y:3.002805084745763},{x:0.3323050847457627, y:3.0138220338983053},{x:0.3662033898305085, y:3.0231440677966104},{x:0.38061016949152543, y:3.045177966101695},{x:0.35264406779661017, y:3.059584745762712},{x:0.3094237288135593, y:3.0485677966101696},{x:0.3153559322033898, y:3.0163644067796613},{x:0.33823728813559323, y:2.995177966101695},{x:0.3662033898305085, y:2.988398305084746},{x:0.35264406779661017, y:2.9646694915254237},{x:0.3170508474576271, y:2.9485677966101695},{x:0.3365423728813559, y:2.9341610169491528},{x:0.3653559322033898, y:2.9392457627118644})
);
mosquitosPositionsPhase19S = new Array(
  //new Array({x:6.510917030567685, y:0.6768558951965066},{x:6.499272197962155, y:0.6622998544395924},{x:6.4905385735080054, y:0.6521106259097526},{x:6.4905385735080054, y:0.6215429403202329},{x:6.506550218340611, y:0.6200873362445415},{x:6.518195050946143, y:0.6259097525473072},{x:6.518195050946143, y:0.6506550218340611},{x:6.502183406113537, y:0.6593886462882096},{x:6.5152838427947595, y:0.6768558951965066},{x:6.512372634643377, y:0.6215429403202329},{x:6.5050946142649195, y:0.6055312954876274})
  new Array({x:6.495726495726496, y:0.5970695970695971},{x:6.4774114774114775, y:0.57997557997558},{x:6.47008547008547, y:0.5531135531135531},{x:6.468864468864469, y:0.5225885225885226},{x:6.473748473748474, y:0.48595848595848595},{x:6.492063492063492, y:0.4713064713064713},{x:6.518925518925519, y:0.4652014652014652},{x:6.543345543345543, y:0.4725274725274725},{x:6.555555555555555, y:0.5042735042735043},{x:6.553113553113553, y:0.5518925518925519},{x:6.545787545787546, y:0.5836385836385837},{x:6.506715506715507, y:0.5787545787545788},{x:6.506715506715507, y:0.5470085470085471},{x:6.532356532356532, y:0.5225885225885226},{x:6.526251526251526, y:0.4810744810744811},{x:6.487179487179487, y:0.47741147741147744},{x:6.471306471306471, y:0.49694749694749696},{x:6.504273504273504, y:0.4993894993894994},{x:6.537240537240537, y:0.5286935286935287},{x:6.515262515262515, y:0.5470085470085471},{x:6.4774114774114775, y:0.5531135531135531},{x:6.474969474969475, y:0.5848595848595849},{x:6.516483516483516, y:0.5787545787545788},{x:6.5506715506715505, y:0.5836385836385837},{x:6.525030525030525, y:0.6043956043956044})
);
mosquitosPositionsPhase20 = new Array(
  new Array({x:0.0855084745762712, y:2.889830508474576},{x:0.08296610169491525, y:2.906779661016949},{x:0.08466101694915251, y:2.9169491525423727},{x:0.0855084745762712, y:2.9389830508474577},{x:0.08381355932203388, y:2.9635593220338983},{x:0.07788135593220336, y:2.9703389830508473},{x:0.0855084745762712, y:2.9745762711864407},{x:0.08127118644067793, y:2.977966101694915},{x:0.08466101694915251, y:2.9822033898305085},{x:0.07957627118644067, y:2.9855932203389832},{x:0.08466101694915251, y:2.989830508474576},{x:0.0804237288135593, y:2.9957627118644066},{x:0.08635593220338983, y:2.9991525423728813},{x:0.07872881355932204, y:3.0050847457627117},{x:0.0855084745762712, y:3.0084745762711864},{x:0.0804237288135593, y:3.01271186440678},{x:0.08296610169491525, y:3.023728813559322},{x:0.08296610169491525, y:3.0372881355932204},{x:0.08127118644067793, y:3.0661016949152544},{x:0.08127118644067793, y:3.0940677966101693},{x:0.0855084745762712, y:3.1127118644067795},{x:0.09144067796610167, y:3.1220338983050846},{x:0.10584745762711861, y:3.126271186440678},{x:0.12364406779661014, y:3.1279661016949154},{x:0.13296610169491524, y:3.1415254237288135},{x:0.13381355932203387, y:3.1932203389830507},{x:0.13720338983050845, y:3.2084745762711866},{x:0.14567796610169492, y:3.2135593220338983},{x:0.1566949152542373, y:3.2152542372881356},{x:0.16940677966101692, y:3.211864406779661},{x:0.17618644067796607, y:3.2177966101694917},{x:0.18127118644067797, y:3.2084745762711866},{x:0.18974576271186439, y:3.2177966101694917},{x:0.1914406779661017, y:3.211016949152542},{x:0.19822033898305086, y:3.2161016949152543},{x:0.2033050847457627, y:3.2084745762711866},{x:0.2083898305084746, y:3.216949152542373},{x:0.2126271186440678, y:3.211016949152542},{x:0.22194915254237285, y:3.2161016949152543},{x:0.2685593220338983, y:3.2161016949152543},{x:0.3753389830508474, y:3.2152542372881356},{x:0.38720338983050845, y:3.2152542372881356},{x:0.3948305084745763, y:3.2127118644067796},{x:0.40584745762711866, y:3.2203389830508473},{x:0.41008474576271187, y:3.2093220338983053},{x:0.42025423728813555, y:3.2203389830508473},{x:0.4270338983050847, y:3.2093220338983053},{x:0.4329661016949153, y:3.216949152542373},{x:0.43889830508474575, y:3.2101694915254235},{x:0.4499152542372881, y:3.216949152542373},{x:0.4711016949152543, y:3.2152542372881356},{x:0.48635593220338985, y:3.2177966101694917},{x:0.49483050847457627, y:3.2220338983050847},{x:0.49991525423728816, y:3.23728813559322},{x:0.49991525423728816, y:3.2745762711864406},{x:0.49991525423728816, y:3.3152542372881357},{x:0.4982203389830508, y:3.344915254237288},{x:0.4990677966101695, y:3.3627118644067795}, {x:0.5066949152542373, y:3.3754237288135593},{x:0.5321186440677965, y:3.3779661016949154},{x:0.5558474576271186, y:3.378813559322034},{x:0.5694067796610169, y:3.3838983050847458},{x:0.5761864406779662, y:3.3949152542372882},{x:0.5761864406779662, y:3.411864406779661},{x:0.5761864406779662, y:3.4627118644067796},{x:0.5761864406779662, y:3.477118644067797},{x:0.5821186440677966, y:3.483050847457627},{x:0.5897457627118643, y:3.4889830508474575},{x:0.6185593220338983, y:3.490677966101695},{x:0.6516101694915255, y:3.4889830508474575},{x:0.6575423728813559, y:3.480508474576271},{x:0.6600847457627119, y:3.4694915254237286},{x:0.6583898305084745, y:3.450847457627119},{x:0.6685593220338983, y:3.3796610169491523})
);
mosquitosPositionsPhase20S = new Array(
  //new Array({x:5.141193595342067, y:0.22561863173216884},{x:5.141193595342067, y:0.2096069868995633},{x:5.138282387190684, y:0.19213973799126638},{x:5.139737991266376, y:0.16011644832605532},{x:5.139737991266376, y:0.13100436681222707},{x:5.142649199417758, y:0.11208151382823872},{x:5.155749636098981, y:0.10334788937409024},{x:5.186317321688501, y:0.10189228529839883},{x:5.5050946142649195, y:0.10189228529839883},{x:5.9374090247452695, y:0.09898107714701601},{x:5.9825327510917035, y:0.10334788937409024},{x:5.9970887918486175, y:0.10043668122270742},{x:6.0029112081513825, y:0.08442503639010189},{x:6.0029112081513825, y:0.05822416302765648},{x:6.005822416302766, y:0.036390101892285295},{x:6.013100436681222, y:0.027656477438136828},{x:6.03056768558952, y:0.023289665211062592},{x:6.197962154294032, y:0.026200873362445413},{x:6.219796215429403, y:0.033478893740902474},{x:6.228529839883552, y:0.053857350800582245},{x:6.225618631732169, y:0.29694323144104806},{x:6.2372634643377, y:0.3173216885007278},{x:6.254730713245997, y:0.31877729257641924},{x:6.27802037845706, y:0.3289665211062591},{x:6.2809315866084425, y:0.35662299854439594},{x:6.285298398835517, y:0.40465793304221254},{x:6.302765647743814, y:0.4148471615720524},{x:6.318777292576419, y:0.4163027656477438},{x:6.327510917030568, y:0.42066957787481807},{x:6.333333333333333, y:0.413391557496361},{x:6.342066957787482, y:0.42066957787481807},{x:6.352256186317321, y:0.4163027656477438},{x:6.36098981077147, y:0.42358078602620086},{x:6.369723435225619, y:0.413391557496361},{x:6.382823871906841, y:0.4192139737991266},{x:6.558951965065503, y:0.4192139737991266},{x:6.5749636098981075, y:0.42212518195050946},{x:6.582241630276565, y:0.4119359534206696},{x:6.595342066957787, y:0.4264919941775837},{x:6.5997088791848615, y:0.4148471615720524},{x:6.612809315866085, y:0.42503639010189226},{x:6.620087336244541, y:0.4148471615720524},{x:6.637554585152839, y:0.4177583697234352},{x:6.666666666666667, y:0.42212518195050946},{x:6.685589519650655, y:0.43522561863173215},{x:6.687045123726347, y:0.48180494905385735},{x:6.688500727802038, y:0.5312954876273653},{x:6.688500727802038, y:0.5574963609898108},{x:6.688500727802038, y:0.5778748180494906},{x:6.697234352256186, y:0.5909752547307132},{x:6.713245997088792, y:0.6026200873362445},{x:6.739446870451237, y:0.5997088791848617},{x:6.759825327510917, y:0.6026200873362445},{x:6.77292576419214, y:0.6142649199417758},{x:6.774381368267831, y:0.6506550218340611},{x:6.774381368267831, y:0.7045123726346434},{x:6.7787481804949055, y:0.7205240174672489},{x:6.794759825327511, y:0.7219796215429404},{x:6.836972343522562, y:0.7219796215429404},{x:6.858806404657933, y:0.7161572052401747},{x:6.86608442503639, y:0.7132459970887919},{x:6.867540029112082, y:0.7016011644832606},{x:6.871906841339156, y:0.6754002911208151},{x:6.871906841339156, y:0.62882096069869})
  //new Array({x:5.141646489104116, y:0.22760290556900725},{x:5.14043583535109, y:0.2106537530266344},{x:5.14043583535109, y:0.19975786924939468},{x:5.1392251815980625, y:0.1791767554479419},{x:5.1392251815980625, y:0.15617433414043583},{x:5.1392251815980625, y:0.13801452784503632},{x:5.1392251815980625, y:0.12469733656174334},{x:5.14043583535109, y:0.1162227602905569},{x:5.1440677966101696, y:0.11016949152542373},{x:5.148910411622276, y:0.1053268765133172},{x:5.156174334140436, y:0.1016949152542373},{x:5.175544794188862, y:0.09927360774818401},{x:5.207021791767555, y:0.10048426150121065},{x:5.523002421307506, y:0.10048426150121065},{x:5.9176755447941884, y:0.10048426150121065},{x:5.985472154963681, y:0.09927360774818401},{x:5.99636803874092, y:0.09443099273607748},{x:6.001210653753026, y:0.08595641646489104},{x:6.00363196125908, y:0.06900726392251816},{x:6.00363196125908, y:0.05569007263922518},{x:6.0024213075060535, y:0.03753026634382567},{x:6.00726392251816, y:0.03026634382566586},{x:6.012106537530267, y:0.021791767554479417},{x:6.0290556900726395, y:0.020581113801452784},{x:6.2058111380145276, y:0.024213075060532687},{x:6.219128329297821, y:0.029055690072639227},{x:6.22639225181598, y:0.043583535108958835},{x:6.230024213075061, y:0.1234866828087167},{x:6.22639225181598, y:0.2966101694915254},{x:6.232445520581114, y:0.3099273607748184},{x:6.243341404358354, y:0.31840193704600483},{x:6.254237288135593, y:0.31840193704600483},{x:6.268765133171913, y:0.3196125907990315},{x:6.278450363196126, y:0.32566585956416466},{x:6.283292978208232, y:0.34261501210653755},{x:6.284503631961259, y:0.37409200968523004},{x:6.283292978208232, y:0.39709443099273606},{x:6.291767554479419, y:0.4128329297820823},{x:6.306295399515738, y:0.41646489104116224},{x:6.317191283292979, y:0.41646489104116224},{x:6.325665859564165, y:0.4188861985472155},{x:6.330508474576271, y:0.4116222760290557},{x:6.3341404358353515, y:0.41767554479418884},{x:6.338983050847458, y:0.4116222760290557},{x:6.342615012106537, y:0.41767554479418884},{x:6.346246973365617, y:0.4128329297820823},{x:6.352300242130751, y:0.41646489104116224},{x:6.3559322033898304, y:0.41041162227602906},{x:6.357142857142857, y:0.4188861985472155},{x:6.361985472154964, y:0.4128329297820823},{x:6.3692493946731235, y:0.4225181598062954},{x:6.37409200968523, y:0.4152542372881356},{x:6.391041162227603, y:0.4188861985472155},{x:6.562953995157385, y:0.4188861985472155},{x:6.579903147699758, y:0.41404358353510895},{x:6.585956416464891, y:0.4225181598062954},{x:6.5907990314769975, y:0.4116222760290557},{x:6.594430992736077, y:0.4188861985472155},{x:6.598062953995157, y:0.4116222760290557},{x:6.602905569007264, y:0.41646489104116224},{x:6.60774818401937, y:0.4128329297820823},{x:6.61138014527845, y:0.4188861985472155},{x:6.616222760290557, y:0.4116222760290557},{x:6.621065375302663, y:0.42009685230024213},{x:6.623486682808717, y:0.4152542372881356},{x:6.642857142857143, y:0.41767554479418884},{x:6.662227602905569, y:0.42009685230024213},{x:6.674334140435835, y:0.4225181598062954},{x:6.682808716707021, y:0.4297820823244552},{x:6.690072639225182, y:0.4491525423728814},{x:6.687651331719128, y:0.5012106537530266},{x:6.686440677966102, y:0.5581113801452785},{x:6.686440677966102, y:0.5738498789346247},{x:6.688861985472155, y:0.5847457627118644},{x:6.703389830508475, y:0.5968523002421308},{x:6.72639225181598, y:0.6004842615012107},{x:6.745762711864407, y:0.6004842615012107},{x:6.762711864406779, y:0.6029055690072639},{x:6.769975786924939, y:0.612590799031477},{x:6.776029055690072, y:0.6246973365617433},{x:6.776029055690072, y:0.6404358353510896},{x:6.776029055690072, y:0.6646489104116223},{x:6.77360774818402, y:0.6828087167070218},{x:6.77360774818402, y:0.7009685230024213},{x:6.780871670702179, y:0.7130750605326877},{x:6.791767554479419, y:0.7179176755447942},{x:6.811138014527845, y:0.7203389830508474},{x:6.832929782082324, y:0.7203389830508474},{x:6.851089588377724, y:0.7191283292978208},{x:6.85956416464891, y:0.715496368038741},{x:6.86682808716707, y:0.7033898305084746},{x:6.87046004842615, y:0.652542372881356})
  new Array({x:5.140287769784172, y:0.2278177458033573},{x:5.139088729016787, y:0.20623501199040767},{x:5.139088729016787, y:0.1882494004796163},{x:5.136690647482014, y:0.1642685851318945},{x:5.136690647482014, y:0.1474820143884892},{x:5.1378896882494, y:0.12949640287769784},{x:5.140287769784172, y:0.11750599520383694},{x:5.142685851318944, y:0.11031175059952038},{x:5.149880095923262, y:0.10431654676258993},{x:5.161870503597123, y:0.09952038369304557},{x:5.199040767386091, y:0.09592326139088729},{x:5.980815347721823, y:0.09952038369304557},{x:5.995203836930456, y:0.09352517985611511},{x:5.9988009592326135, y:0.08752997601918465},{x:6.0011990407673865, y:0.07553956834532374},{x:6.0011990407673865, y:0.06115107913669065},{x:6.002398081534772, y:0.04316546762589928},{x:6.002398081534772, y:0.03717026378896882},{x:6.004796163069544, y:0.03237410071942446},{x:6.009592326139089, y:0.026378896882494004},{x:6.017985611510792, y:0.02158273381294964},{x:6.03357314148681, y:0.019184652278177457},{x:6.199040767386091, y:0.02158273381294964},{x:6.213429256594724, y:0.026378896882494004},{x:6.2254196642685855, y:0.03836930455635491},{x:6.23021582733813, y:0.05515587529976019},{x:6.232613908872902, y:0.22302158273381295},{x:6.2314148681055155, y:0.23501199040767387},{x:6.232613908872902, y:0.2422062350119904},{x:6.2398081534772185, y:0.24820143884892087},{x:6.252997601918465, y:0.2529976019184652},{x:6.264988009592326, y:0.2529976019184652},{x:6.275779376498801, y:0.25539568345323743},{x:6.2829736211031175, y:0.26498800959232616},{x:6.287769784172662, y:0.2805755395683453},{x:6.286570743405276, y:0.33213429256594723},{x:6.292565947242206, y:0.34532374100719426},{x:6.309352517985611, y:0.3501199040767386},{x:6.320143884892087, y:0.34652278177458035},{x:6.3261390887290165, y:0.3513189448441247},{x:6.333333333333333, y:0.3441247002398082},{x:6.335731414868105, y:0.3501199040767386},{x:6.341726618705036, y:0.34532374100719426},{x:6.34652278177458, y:0.3513189448441247},{x:6.35251798561151, y:0.3405275779376499},{x:6.356115107913669, y:0.3501199040767386},{x:6.363309352517986, y:0.3405275779376499},{x:6.36810551558753, y:0.34772182254196643},{x:6.374100719424461, y:0.3393285371702638},{x:6.384892086330935, y:0.3489208633093525},{x:6.5647482014388485, y:0.3489208633093525},{x:6.580335731414868, y:0.3441247002398082},{x:6.5875299760191846, y:0.3513189448441247},{x:6.592326139088729, y:0.34172661870503596},{x:6.59832134292566, y:0.3489208633093525},{x:6.610311750599521, y:0.3405275779376499},{x:6.615107913669065, y:0.34532374100719426},{x:6.624700239808154, y:0.34172661870503596},{x:6.633093525179856, y:0.3513189448441247},{x:6.670263788968825, y:0.3537170263788969},{x:6.684652278177458, y:0.3609112709832134},{x:6.689448441247002, y:0.3800959232613909},{x:6.68705035971223, y:0.4316546762589928},{x:6.68705035971223, y:0.47721822541966424},{x:6.689448441247002, y:0.5155875299760192},{x:6.6882494004796165, y:0.5215827338129496},{x:6.727817745803358, y:0.5323741007194245},{x:6.752997601918465, y:0.5299760191846523},{x:6.76978417266187, y:0.5359712230215827},{x:6.779376498800959, y:0.5575539568345323},{x:6.779376498800959, y:0.5911270983213429},{x:6.779376498800959, y:0.6354916067146283},{x:6.786570743405276, y:0.6498800959232613},{x:6.804556354916067, y:0.6534772182254197},{x:6.829736211031175, y:0.6534772182254197},{x:6.848920863309353, y:0.6486810551558753},{x:6.863309352517986, y:0.6306954436450839},{x:6.866906474820144, y:0.5983213429256595})
)
mosquitosPositionsPhase21 = new Array(
  new Array({x:0.6314576271186441, y:3.047720338983051},{x:0.6645084745762712, y:3.0511101694915257},{x:0.6856949152542373, y:3.0426355932203393},{x:0.6882372881355933, y:3.0155169491525426},{x:0.6678983050847458, y:2.9900932203389834},{x:0.6712881355932203, y:2.968906779661017},{x:0.6814576271186441, y:2.950262711864407},{x:0.6670508474576271, y:2.9341610169491528},{x:0.6382372881355932, y:2.936703389830509},{x:0.6390847457627119, y:2.950262711864407},{x:0.6102711864406779, y:2.962127118644068},{x:0.6077288135593221, y:2.98585593220339},{x:0.6297627118644068, y:3.001957627118644},{x:0.6153559322033898, y:3.030771186440678},{x:0.6255254237288136, y:3.0545}),
  new Array({x:0.6526440677966101, y:2.9290762711864406},{x:0.669593220338983, y:2.937550847457627},{x:0.6738305084745763, y:2.9672118644067798},{x:0.6585762711864407, y:2.976533898305085},{x:0.6289152542372881, y:2.9934830508474577},{x:0.6128135593220339, y:3.0087372881355936},{x:0.6102711864406779, y:3.0367033898305085},{x:0.6263728813559322, y:3.050262711864407},{x:0.6534915254237288, y:3.0536525423728813},{x:0.669593220338983, y:3.0417881355932206},{x:0.6755254237288135, y:3.0248389830508478},{x:0.6534915254237288, y:3.0061949152542375},{x:0.6229830508474576, y:2.9867033898305086},{x:0.6162033898305085, y:2.9587372881355933},{x:0.6534915254237288, y:2.943483050847458},{x:0.6543389830508475, y:2.936703389830509})
);
mosquitosPositionsPhase21S = new Array(
  //new Array({x:6.861717612809316, y:0.6681222707423581},{x:6.847161572052402, y:0.6564774381368268},{x:6.851528384279476, y:0.6331877729257642},{x:6.871906841339156, y:0.6302765647743813},{x:6.871906841339156, y:0.5997088791848617},{x:6.841339155749636, y:0.5997088791848617},{x:6.841339155749636, y:0.6273653566229985},{x:6.873362445414847, y:0.6419213973799127},{x:6.867540029112082, y:0.6724890829694323})
  new Array({x:6.869352869352869, y:0.5970695970695971},{x:6.886446886446887, y:0.5824175824175825},{x:6.897435897435898, y:0.5665445665445665},{x:6.912087912087912, y:0.5299145299145299},{x:6.913308913308914, y:0.5067155067155067},{x:6.913308913308914, y:0.48473748473748474},{x:6.904761904761905, y:0.46886446886446886},{x:6.887667887667888, y:0.45787545787545786},{x:6.863247863247863, y:0.45787545787545786},{x:6.847374847374847, y:0.4627594627594628},{x:6.827838827838828, y:0.47985347985347987},{x:6.827838827838828, y:0.4993894993894994},{x:6.859584859584859, y:0.5128205128205128},{x:6.8791208791208796, y:0.525030525030525},{x:6.869352869352869, y:0.5396825396825397},{x:6.836385836385836, y:0.5457875457875457},{x:6.824175824175824, y:0.5665445665445665},{x:6.824175824175824, y:0.5848595848595849},{x:6.841269841269841, y:0.5897435897435898},{x:6.863247863247863, y:0.5677655677655677},{x:6.8498168498168495, y:0.5421245421245421},{x:6.8498168498168495, y:0.5238095238095238},{x:6.8669108669108665, y:0.5115995115995116},{x:6.882783882783883, y:0.5164835164835165},{x:6.893772893772894, y:0.5396825396825397},{x:6.891330891330892, y:0.557997557997558},{x:6.871794871794871, y:0.5677655677655677},{x:6.880341880341881, y:0.6031746031746031},{x:6.90964590964591, y:0.6019536019536019},{x:6.90964590964591, y:0.5836385836385837},{x:6.9010989010989015, y:0.5726495726495726},{x:6.877899877899878, y:0.5775335775335775})
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
var hoverBehaviorImagesDesktop = new Array("icon1_hover.png","icon2_hover.png","icon3_hover.png","icon4_hover.png","icon5_hover.png","icon6_hover.png","icon7_hover.png","icon8_hover.png","icon9_hover.png");
var behaviorImagesDesktop = new Array("icon1.png","icon2.png","icon3.png","icon4.png","icon5.png","icon6.png","icon7.png","icon8.png","icon9.png");
var hoverBehaviorImagesMobile = new Array("icon1mobile_hover.png","icon2mobile_hover.png","icon3mobile_hover.png","icon4mobile_hover.png","icon5mobile_hover.png","icon6mobile_hover.png","icon7mobile_hover.png","icon8mobile_hover.png","icon9mobile_hover.png");
var behaviorImagesMobile = new Array("icon1mobile.png","icon2mobile.png","icon3mobile.png","icon4mobile.png","icon5mobile.png","icon6mobile.png","icon7mobile.png","icon8mobile.png","icon9mobile.png");
var hoverBehaviorImages = hoverBehaviorImagesDesktop;
var behaviorImages = behaviorImagesDesktop;
var tabletTreshold = 354;//957;
var mobileTreshold = 600;
var cell = 0;

if((mobile_browser == 1)&&(ipad_browser == 0))
{
  if(window.innerHeight > window.innerWidth){
    hoverBehaviorImages = hoverBehaviorImagesMobile;
    behaviorImages = behaviorImagesMobile;
  }else{
    tabletTreshold = 3000;
    hoverBehaviorImages = hoverBehaviorImagesDesktop;
    behaviorImages = behaviorImagesDesktop;
  }
}
if(ipad_browser == 1)
{
  tabletTreshold = 3000;
}
if(mobile_browser == 0)
{
  $('#pgStep2 .pgStep__info').hide();
  $('#pgStep3 .pgStep__info').hide();
}

changeIcons();

window.addEventListener("orientationchange", function() {
  // Announce the new orientation number
  if(window.orientation==0)
  {
    tabletTreshold = 354;
    hoverBehaviorImages = hoverBehaviorImagesMobile;
    behaviorImages = behaviorImagesMobile;
  }else{
    tabletTreshold = 3000;
    hoverBehaviorImages = hoverBehaviorImagesDesktop;
    behaviorImages = behaviorImagesDesktop;
  }

  changeIcons();
}, false);

function changeIcons()
{
  for(i=0;i<behaviorImages.length;i++)
  {
      $('#icon'+i).attr("src", "./images/" + behaviorImages[i]);
  }
}
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
    }, 1500);
}
//Execute main loop
var main = function(time){
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

        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.currentMosquitoPhase == 22) {

          if (element.xDir) {
            context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * ( 16.0/12.0) * wMultiplier);
          }
          else {
            context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * ( 16.0/12.0) * wMultiplier);
          }
        }
        else {
          if (element.xDir) {
            context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * ( 16.0/12.0) * wMultiplier);
          }
          else {
            context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * ( 16.0/12.0) * wMultiplier);
          }
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

            if ($(".pgArticle").width() < tabletTreshold) {
              var auxPositionsArray = mosquitosPositionsPhase3S[index%mosquitosPositionsPhase3S.length];
            }
            else {
              var auxPositionsArray = mosquitosPositionsPhase3[index%mosquitosPositionsPhase3.length];
            }
            
            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray.push(element2);
              }
              else {
                var auxElement = {x: element2.x + (((Math.random() * 0.1) - 0.05) * 1.0), y: element2.y + (((Math.random() * 0.1) - 0.05) * 1.0)};
                auxElement.x = Math.max(0.086,Math.min(0.135, auxElement.x)) + 0.01;
                auxElement.y = Math.max(0.555,Math.min(0.715, auxElement.y)) + 0.04;
                element.positionsArray.push(auxElement);
              }
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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }

        /*var xvalue = Math.abs(element.positionsArray[element.currentPosition].x - element.x);
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
        w = w * 0.125;

        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * ( 16.0/12.0) * wMultiplier);
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * ( 16.0/12.0) * wMultiplier);
        }*/
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

            if ($(".pgArticle").width() < tabletTreshold) {
              auxPositionsArray = mosquitosPositionsPhase5S[index%mosquitosPositionsPhase5S.length];
            }

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray.push(element2);
              }
              else {
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
              }
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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
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

            if ($(".pgArticle").width() < tabletTreshold) {
              auxPositionsArray = mosquitosPositionsPhase7S[index%mosquitosPositionsPhase7S.length];
            }

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray.push(element2);
              }
              else {
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
              }
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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
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

            if ($(".pgArticle").width() < tabletTreshold) {
              auxPositionsArray = mosquitosPositionsPhase9S[index%mosquitosPositionsPhase9S.length];
            }

            if ($(".pgArticle").width() < tabletTreshold) {
              var auxPositionsArray = mosquitosPositionsPhase9S[index%mosquitosPositionsPhase9S.length];
            }
            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray.push(element2);
              }
              else {
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
              }
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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
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

            if ($(".pgArticle").width() < tabletTreshold) {
              auxPositionsArray = mosquitosPositionsPhase11S[index%mosquitosPositionsPhase11S.length];
            }

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray.push(element2);
              }
              else {
                var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.018, y: element2.y + (((Math.random() * 0.001) - 0.0005) * 1.0)};
                element.positionsArray.push(auxElement);
              }
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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
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
              //$('#pgQuestion-container3 .pg-button').removeAttr("disabled");
              $('#pgQuestion-container3').removeAttr("disabled");
            }

            var auxPositionsArray = mosquitosPositionsPhase13[index%mosquitosPositionsPhase13.length];

            if ($(".pgArticle").width() < tabletTreshold) {
              auxPositionsArray = mosquitosPositionsPhase13S[index%mosquitosPositionsPhase13S.length];
            }

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray.push(element2);
              }
              else {
                var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0) + 0.005, y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.01 + 0.275};
                element.positionsArray.push(auxElement);
              }
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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
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

            if ($(".pgArticle").width() < tabletTreshold) {
              auxPositionsArray = mosquitosPositionsPhase15S[index%mosquitosPositionsPhase15S.length];
            }

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray.push(element2);
              }
              else {
                var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0) + 0.005, y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.01 + 0.275};
                element.positionsArray.push(auxElement);
              }
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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
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

            if ($(".pgArticle").width() < tabletTreshold) {
              auxPositionsArray = mosquitosPositionsPhase17S[index%mosquitosPositionsPhase17S.length];
            }

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray.push(element2);
              }
              else {
                var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0) + 0.005, y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) + 0.275};
                element.positionsArray.push(auxElement);
              }
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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
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

            if ($(".pgArticle").width() < tabletTreshold) {
              auxPositionsArray = mosquitosPositionsPhase19S[index%mosquitosPositionsPhase19S.length];
            }

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                //element2.y = element2.y - 0.005;
                element.positionsArray.push(element2);
              }
              else {
                var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) + 0.37};
                element.positionsArray.push(auxElement);
              }
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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
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

            if ($(".pgArticle").width() < tabletTreshold) {
              auxPositionsArray = mosquitosPositionsPhase21S[index%mosquitosPositionsPhase21S.length];
            }

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                //element2.y = element2.y - 0.005;
                element.positionsArray.push(element2);
              }
              else {
                var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) + 0.37};
                element.positionsArray.push(auxElement);
              }
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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
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
            element.speed = 0.0003;

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
        var wMultiplier = 1.0;
        if ($(".pgArticle").width() < tabletTreshold) {
          wMultiplier = 0.125;
        }

        if (element.xDir) {
          context.drawImage(element.flippedImages[element.currentImage], (element.x * canvas.width) * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
        else {
          context.drawImage(element.image[element.currentImage], element.x * canvas.width * wMultiplier, element.y * canvas.width * wMultiplier, w * wMultiplier, w * wMultiplier * ( 16.0/12.0));
        }
      break;
    }
    
  });
}
//Animate behavior elements
var animateBehaviorElements = function() {
  $(document).on("mouseenter", ".pgQuestion__body__option:not(.disabled-option)", function() {
    if (!$(this).hasClass("selected")) {
      $(this).find("img").attr("src", "./images/" + hoverBehaviorImages[$(this).attr("data-index")]);
    }
  });
  $(document).on("mouseleave", ".pgQuestion__body__option:not(.disabled-option)", function() {
    if (!$(this).hasClass("selected")) {
      $(this).find("img").attr("src", "./images/" + behaviorImages[$(this).attr("data-index")]);
    }
  });
};
//Animate pregnancy elements
var animateElementsPregnancy = function() {
  $(document).on("mouseenter", ".pgStep__pregnancy-ok", function() {
    if (currentPhase == 20) {
      if ($(".pgArticle").width() < tabletTreshold) {
        $("#left-glass-cover-horizontal, #left-glass-cover-mid-horizontal").animate({
          marginTop: "-" + ($("#left-glass-cover-horizontal").width() * 0.001) + "px"
        }, 200);
      }
      else {
        $("#left-glass-cover, #left-glass-cover-mid").animate({
          marginTop: "-" + ($("#left-glass-cover").height() * 0.001) + "px"
        }, 200);
      }
    }
  });
  $(document).on("mouseleave", ".pgStep__pregnancy-ok", function() {
    if (currentPhase == 20) {
      if ($(".pgArticle").width() < tabletTreshold) {
        $("#left-glass-cover-horizontal, #left-glass-cover-mid-horizontal").animate({
          marginTop: "0px"
        }, 200);
      }
      else {
        $("#left-glass-cover, #left-glass-cover-mid").animate({
          marginTop: "0px"
        }, 200);
      }
    }
  });
  $(document).on("mouseenter", ".pgStep__pregnancy-ko", function() {
    if (currentPhase == 20) {
      if ($(".pgArticle").width() < tabletTreshold) {
        $("#right-glass-cover-horizontal, #right-glass-cover-mid-horizontal").animate({
          marginTop: "-" + ($("#right-glass-cover-horizontal").width() * 0.001) + "px"
        }, 200);
      }
      else {
        $("#right-glass-cover, #right-glass-cover-mid").animate({
          marginTop: "-" + ($("#right-glass-cover").height() * 0.001) + "px"
        }, 200);
      }
    
    }
  });
  $(document).on("mouseleave", ".pgStep__pregnancy-ko", function() {
    if (currentPhase == 20) {
      if ($(".pgArticle").width() < tabletTreshold) {
        $("#right-glass-cover-horizontal, #right-glass-cover-mid-horizontal").animate({
          marginTop: "0px"
        }, 200);
      }
      else {
        $("#right-glass-cover, #right-glass-cover-mid").animate({
          marginTop: "0px"
        }, 200);
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
      picture1Hover.src = './images/terrarium-hover.png';

      var tube1 = new Image();
      tube1.addEventListener('load', function () {
        if ($(".pgArticle").width() < tabletTreshold) {
          //context2.drawImage(tube1, parseInt($(".pgArticle").width() - ($(".pgArticle").width() * 0.55) - ($(".pgArticle").width() * 0.0585) - ($(".pgArticle").width() * 0.36051)), parseInt(($(".pgArticle").width() * 0.36051) * (300.0/430.0)) * 0.55, parseInt($(".pgArticle").width() * 0.36051), parseInt(($(".pgArticle").width() * 0.36051) * (300.0/430.0)));
        }
        else {
          context2.drawImage(tube1, parseInt(canvas.width - (canvas.width * 0.55) - (canvas.width * 0.0585) - (canvas.width * 0.36051)), 235, parseInt(canvas.width * 0.36051), parseInt((canvas.width * 0.36051) * (300.0/430.0)));
        }
      });
      tube1.src = './images/tube1.png';
  });
  picture1.src = './images/terrarium.png';

  var tube2 = new Image();
  tube2.addEventListener('load', function () {
    if ($(".pgArticle").width() < tabletTreshold) {
    }
    else {
      context2.drawImage(tube2, parseInt(canvas.width * 0.0345), 530, parseInt(canvas.width * 0.14672), parseInt((canvas.width * 0.14672) * (622.0/175.0)));
    }
  });
  tube2.src = './images/tube2.png';

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
    tube3Hover.src = './images/tube3-hover.png';
  });
  tube3.src = './images/tube3.png';

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
    tube5Hover.src = './images/tube5-hover.png';  

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
      tube4Hover.src = './images/tube4-hover.png';
    });
    tube4.src = './images/tube4.png';

  });
  tube5.src = './images/tube5.png';  

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
    tube6Hover.src = './images/tube6-hover.png';
  });
  tube6.src = './images/tube6.png';

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
        coverGlassHover.src = './images/cover-glass-animate.png';

      });
      tube7Hover.src = './images/tube7-hover.png';
    });
    coverGlass.src = './images/cover-glass.png';
  });
  tube7.src = './images/tube7.png';

  var chart = new Image();
  chart.addEventListener('load', function () {
    context2.drawImage(chart, parseInt((canvas.width * 0.5) - (canvas.width * 0.77 * 0.5)), 3755, parseInt(canvas.width * 0.77), parseInt((canvas.width * 0.77) * (315.0/912.0)));
  });
  chart.src = './images/last-chart.png';

  var chart2 = new Image();
  chart2.addEventListener('load', function () {
    context2.drawImage(chart2, parseInt((canvas.width * 0.5) - (canvas.width * 0.7026 * 0.5)), 4055, parseInt(canvas.width * 0.7026), parseInt((canvas.width * 0.7026) * (188.0/838.0)));
  });
  chart2.src = './images/graphic.png';
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
var setupMosquitos = function() {
  canvas = document.getElementById('mosquitosCanvas');

  if ($(".pgArticle").width() < tabletTreshold) {
    canvas.width = $('.horizontal-background img').width();
    canvas.height = $('.horizontal-background img').height();
    canvas.style.width  = canvas.width.toString() + "px";
    canvas.style.height = canvas.height.toString() + "px";
  }
  else {
    canvas.width = $('.pgChart-wrapper').width();
    canvas.height = $('.pgChart-wrapper').height();
    canvas.style.width  = canvas.width.toString() + "px";
    canvas.style.height = canvas.height.toString() + "px";
  }

  context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;

  var mosquito = new Image();
  mosquito.addEventListener('load', function () {
    //
  });
  mosquito.src = './images/mosquito1_left.png';
  var mosquito2 = new Image();
  mosquito2.addEventListener('load', function () {
    //
  });
  mosquito2.src = './images/mosquito2_left.png';
  var mosquitoFlipped = new Image();
  mosquitoFlipped.addEventListener('load', function () {
    //
  });
  mosquitoFlipped.src = './images/mosquito1_left.png';
  var mosquito2Flipped = new Image();
  mosquito2Flipped.addEventListener('load', function () {
    //
  });
  mosquito2Flipped.src = './images/mosquito2_left.png';

  for (var i = 0; i < totalMosquitos; i++) {
    

    mosquitosArray.push(new CanvasImage([mosquito/*, mosquito2*/], 0, 0, 0, 0.001 + (Math.random() * 0.001), 0, 0, new Array()));

    mosquitosArray[i].flippedImages = new Array(mosquitoFlipped/*, mosquito2Flipped*/);
    
    var auxPositionsArray = mosquitosPositionsPhase1[i%mosquitosPositionsPhase1.length];

    auxPositionsArray = shuffle(auxPositionsArray);
    
    auxPositionsArray.forEach(function(element,index,array) {
      var auxElement = {x: element.x + (((Math.random() * 0.1) - 0.05) * 1.0), y: element.y + (((Math.random() * 0.1) - 0.05) * 1.0)};
      auxElement.x = Math.max(0.51, Math.min(0.95, auxElement.x)) + 0.02;
      auxElement.y = Math.max(0.1, Math.min(0.3, auxElement.y));

      if ($(".pgArticle").width() < tabletTreshold) {
        auxElement.x = auxElement.x;
        auxElement.y = auxElement.y + 0.27;
      }
      else {
        if (auxElement.y <= 0.1 && auxElement.x <= 0.49) {
          auxElement.x = auxElement.x + 0.2;
        }
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
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray = mosquitosPositionsPhase2S[0];
          }
          else {
            element.positionsArray = mosquitosPositionsPhase2[0];
          }

          if (!($(".pgArticle").width() < tabletTreshold)) {
            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
              element.positionsArray[index2] = element2;
            });
          }

          element.currentPosition = 0;
          element.currentMosquitoPhase = 1;
          element.speed = 0.007 + (Math.random() * 0.010);
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
        }, Math.random() * 500);
      });
      
      if ($(".pgArticle").width() < tabletTreshold) {
        $('.pgChart').animate({
          scrollLeft: $('#pgQuestion-container1').offset().left
        }, 2000);
      }
      else {
        $('html, body').animate({
          scrollTop: $('#pgQuestion-container1').offset().top
        }, 2000);
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
              if ($(".pgArticle").width() < tabletTreshold) {
                for (var i = 0; i < mosquitosPositionsPhase4S[0].length; i++) {
                  element.positionsArray.push(mosquitosPositionsPhase4S[0][i]);
                };
                for (var i = 0; i < mosquitosPositionsPhase6S[0].length; i++) {
                  element.positionsArray.push(mosquitosPositionsPhase6S[0][i]);
                }
                element.currentMosquitoPhase = 5;
                /*for (var i = 0; i < mosquitosPositionsPhase8S[0].length; i++) {
                  element.positionsArray.push(mosquitosPositionsPhase8S[0][i]);
                }*/
              }
              else {
                for (var i = 0; i < mosquitosPositionsPhase4[0].length; i++) {
                  element.positionsArray.push(mosquitosPositionsPhase4[0][i]);
                };
                for (var i = 0; i < mosquitosPositionsPhase6[0].length; i++) {
                  element.positionsArray.push(mosquitosPositionsPhase6[0][i]);
                }
                for (var i = 0; i < mosquitosPositionsPhase8[0].length; i++) {
                  element.positionsArray.push(mosquitosPositionsPhase8[0][i]);
                }
                element.currentMosquitoPhase = 7;
              }
              
            }
            else {
              element.positionsArray = new Array();
              if ($(".pgArticle").width() < tabletTreshold) {
                for (var i = 0; i < mosquitosPositionsPhase6S[0].length; i++) {
                  element.positionsArray.push(mosquitosPositionsPhase6S[0][i]);
                }
                /*for (var i = 0; i < mosquitosPositionsPhase8S[0].length; i++) {
                  element.positionsArray.push(mosquitosPositionsPhase8S[0][i]);
                }*/
                element.currentMosquitoPhase = 5;
              }
              else {
                for (var i = 0; i < mosquitosPositionsPhase6[0].length; i++) {
                  element.positionsArray.push(mosquitosPositionsPhase6[0][i]);
                }
                for (var i = 0; i < mosquitosPositionsPhase8[0].length; i++) {
                  element.positionsArray.push(mosquitosPositionsPhase8[0][i]);
                }
                element.currentMosquitoPhase = 7;
              }
              
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x /*+ (((Math.random() * 0.1) - 0.05) * 0.0003)*/;
              element2.y = element2.y /*+ (((Math.random() * 0.1) - 0.05) * 0.0003)*/;
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            
            element.speed = 0.007 + (Math.random() * 0.015);
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
      //$("#pgStep2 .pg-button").removeAttr("disabled");
      $("#pgStep2").removeAttr("disabled");

      if ($(".pgArticle").width() < tabletTreshold) {
        $('.pgChart').animate({
          scrollLeft: $('#pgStep2').position().left
        }, 3000, function() {
          /*setTimeout(function() {
            $('.pgChart').animate({
              scrollLeft: $('#pgQuestion-container2').position().left
            }, 2000);
          }, 3000);*/
        });
      }
      else {
        $('html, body').animate({
          scrollTop: $('#pgQuestion-container2').offset().top
        }, 3000);
      }
    break;
    case 2:
      $('#pgStep2 .pg-button').attr("disabled", "disabled");
      $("#pgStep2").attr("disabled", "disabled");
      mosquitosArray.forEach(function(element,index,array){
        if (index < mosquitosLeft) {
          setTimeout(function() {
            // add delay
            if ($(".pgArticle").width() < tabletTreshold) {
              element.positionsArray = mosquitosPositionsPhase8S[0];
            }
            else {
              element.positionsArray = mosquitosPositionsPhase8[0];
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x /*+ (((Math.random() * 0.1) - 0.05) * 0.002)*/;
              element2.y = element2.y /*+ (((Math.random() * 0.1) - 0.05) * 0.002)*/;
              element.positionsArray[index2] = element2;
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 7;
            element.speed = 0.007 + (Math.random() * 0.010);
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
              scrollLeft: $('#pgQuestion-container2').position().left
            }, 2500);
      }
      else {
        $('html, body').animate({
          scrollTop: $('#pgQuestion-container2').offset().top
        }, 2500);
      }
    break;
    case 3:

      $('#pgQuestion-container2 .pg-button').attr("disabled", "disabled");
      $('#pgQuestion-container2').attr("disabled", "disabled");
      $('.pgQuestion__body__option').addClass("disabled-option");
      //$("#pgStep3 .pg-button").removeAttr("disabled");
      $("#pgStep3").removeAttr("disabled");
      
      mosquitosArray.forEach(function(element,index,array){
        if (index < mosquitosLeft) {
          setTimeout(function() {
            // add delay
            element.positionsArray = new Array();

            if ($(".pgArticle").width() < tabletTreshold) {
              for (var i = 0; i < mosquitosPositionsPhase10S[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase10S[0][i]);
              }
              /*for (var i = 0; i < mosquitosPositionsPhase12S[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase12S[0][i]);
              }*/
              element.currentMosquitoPhase = 9;
            }
            else {
              for (var i = 0; i < mosquitosPositionsPhase10[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase10[0][i]);
              }
              for (var i = 0; i < mosquitosPositionsPhase12[0].length; i++) {
                element.positionsArray.push(mosquitosPositionsPhase12[0][i]);
              }
              element.currentMosquitoPhase = 11;
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray[index2] = element2;
              }
              else {
                element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
                element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
                element.positionsArray[index2] = element2;
              }
            });

            element.currentPosition = 0;
            
            element.speed = 0.007 + (Math.random() * 0.020);
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
        }, 1000, function() {
          /*setTimeout(function() {
            $('.pgChart').animate({
              scrollLeft: $('#pgQuestion-container3').position().left
            }, 3000);
          }, 3000);*/
        });
      }
      else {

        $('html, body').animate({
          scrollTop: $('#pgQuestion-container3').offset().top
        }, 2500);
      }
    break;
    case 4:
      $("#pgStep3 .pg-button").attr("disabled", "disabled");
      $("#pgStep3").attr("disabled", "disabled");
      mosquitosArray.forEach(function(element,index,array){
        if (index < mosquitosLeft) {
          setTimeout(function() {
            // add delay

            if ($(".pgArticle").width() < tabletTreshold) {
              element.positionsArray = mosquitosPositionsPhase12S[0];
            }
            else {
              element.positionsArray = mosquitosPositionsPhase12[0];
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray[index2] = element2;
              }
              else {
                element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
                element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
                element.positionsArray[index2] = element2;
              }
            });

            element.currentPosition = 0;
            element.currentMosquitoPhase = 11;
            element.speed = 0.007 + (Math.random() * 0.010);
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
          scrollLeft: $('#pgQuestion-container3').position().left
        }, 2500);
      }
      else {
        $('html, body').animate({
          scrollTop: $('#pgQuestion-container3').offset().top
        }, 2500);
      }
      break;
      case 5:
      setTimeout(function() {
        mosquitosLeft -= returnMosquitosLeft(4, 3, !$($($('#pgQuestion-wrapper3 .pgQuestion')[1]).find("pgQuestion__body__binary-option")[1]).hasClass("selected"));

        pregnantMosquitos = mosquitosLeft * 0.75;

      mosquitosArray.forEach(function(element,index,array){
        if (index < pregnantMosquitos) {
          setTimeout(function() {
            // add delay
            if ($(".pgArticle").width() < tabletTreshold) {
              element.positionsArray = mosquitosPositionsPhase18S[0];
            }
            else {
              element.positionsArray = mosquitosPositionsPhase18[0];
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray[index2] = element2;
              }
              else {
                element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
                element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
                element.positionsArray[index2] = element2;
              }
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

            if ($(".pgArticle").width() < tabletTreshold) {
              element.positionsArray = mosquitosPositionsPhase20S[0];
            }

            currentPhase = 20;

            $("#pgStep4").removeAttr("disabled", "disabled");


            element.positionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray[index2] = element2;
              }
              else {
                element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
                element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
                element.positionsArray[index2] = element2;
              }
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
        }, 2500, function() {
        });
      }
      else {
        $('html, body').animate({
          scrollTop: $('#pgStep4').offset().top
        }, 2500);
      }
      }, ($(".pgArticle").width() < tabletTreshold) ? 0 : 3250);
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
        newTranslation = 'translate3d(' + newTranslationValue + '%,-50%,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);

      if (currentStep == 0 && nextPosition == 1) {
      mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, parseInt($('#home-country').val()));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay

            if ($(".pgArticle").width() < tabletTreshold) {
              element.positionsArray = mosquitosPositionsPhase4S[0];
            }
            else {
              element.positionsArray = mosquitosPositionsPhase4[0];
            }

            if ($(".pgArticle").width() < tabletTreshold) {
              element.positionsArray.forEach(function(element2,index2,array2) {
                element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
                element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
                element.positionsArray[index2] = element2;
              });
            }

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
        newTranslation = 'translate3d(' + newTranslationValue + '%,-50%,0)';
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
        newTranslation = 'translate3d(' + newTranslationValue + '%,-50%,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);//

        mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, ($($($('#pgQuestion-wrapper3 .pgQuestion')[0]).find("pgQuestion__body__binary-option")[0]).hasClass("selected")) ? 0 : (($($($('#pgQuestion-wrapper3 .pgQuestion')[0]).find("pgQuestion__body__binary-option")[1]).hasClass("selected")) ? 1 : 2));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay
            element.positionsArray = mosquitosPositionsPhase14[0];

            if ($(".pgArticle").width() < tabletTreshold) {
              element.positionsArray = mosquitosPositionsPhase14S[0];
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray[index2] = element2;
              }
              else {
                element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
                element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
                element.positionsArray[index2] = element2;
              }
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
      }, 0);
    }
    else if (currentStep == 3 && nextPosition == 2) {
      $($('#pgQuestion-wrapper3 .pgQuestion')[1]).find(".check").css("opacity", "1.0");
      $($('#pgQuestion-wrapper3 .pgQuestion')[1]).find(".pgQuestion__body__answer").css("opacity", "1.0");

      setTimeout(function() {
        var $questionWrapper = $($('.pgQuestion-wrapper')[auxCurrentStep]),
        $questionContainer = $($('.pgQuestion-container')[auxCurrentStep]),
        newTranslationValue = -(($questionContainer.width() * nextPosition) / $questionWrapper.width()) * 100.0,
        newTranslation = 'translate3d(' + newTranslationValue + '%,-50%,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);//

        mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, !$($($('#pgQuestion-wrapper3 .pgQuestion')[1]).find("pgQuestion__body__binary-option")[1]).hasClass("selected"));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay
            element.positionsArray = mosquitosPositionsPhase16[0];

            if ($(".pgArticle").width() < tabletTreshold) {
              element.positionsArray = mosquitosPositionsPhase16S[0];
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray[index2] = element2;
              }
              else {
                element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
                element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
                element.positionsArray[index2] = element2;
              }
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
      }, 0);
    }

  });
};

//Select an option on the second question
var selectOption = function(){
  $(document).on('click', '.pgQuestion__body__option:not(.disabled-option)', function() {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $(this).find("img").attr("src", "./images/" + behaviorImages[$(this).attr("data-index")]);
    }
    else {
      $(this).addClass("selected");
      $(this).find("img").attr("src", "./images/" + hoverBehaviorImages[$(this).attr("data-index")]);
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
      $(this).parent().find(".pgQuestion__body__binary-option").addClass("disabled-option");
      $(this).addClass("selected");
      $(this).parent().parent().parent().find(".pg-button").removeAttr("disabled");
    }

    if (currentStep == 3 && nextPosition == 1) {
      $($('#pgQuestion-wrapper3 .pgQuestion')[0]).find(".check").css("opacity", "1.0");
      $($('#pgQuestion-wrapper3 .pgQuestion')[0]).find(".pgQuestion__body__answer").css("opacity", "1.0");

      if ($(".pgArticle").width() >= tabletTreshold) {
      setTimeout(function() {
        var $questionWrapper = $($('.pgQuestion-wrapper')[currentStep - 1]),
        $questionContainer = $($('.pgQuestion-container')[currentStep - 1]),
        newTranslationValue = -(($questionContainer.width() * nextPosition) / $questionWrapper.width()) * 100.0,
        newTranslation = 'translate3d(' + newTranslationValue + '%,-50%,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);//

        mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, ($($($('#pgQuestion-wrapper3 .pgQuestion')[0]).find("pgQuestion__body__binary-option")[0]).hasClass("selected")) ? 0 : (($($($('#pgQuestion-wrapper3 .pgQuestion')[0]).find("pgQuestion__body__binary-option")[1]).hasClass("selected")) ? 1 : 2));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay
            element.positionsArray = mosquitosPositionsPhase14[0];

            if ($(".pgArticle").width() < tabletTreshold) {
              element.positionsArray = mosquitosPositionsPhase14S[0];
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray[index2] = element2;
              }
              else {
                element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
                element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
                element.positionsArray[index2] = element2;
              }
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
      }, 3250);
    }
    
    }
    else if (currentStep == 3 && nextPosition == 2) {
      $($('#pgQuestion-wrapper3 .pgQuestion')[1]).find(".check").css("opacity", "1.0");
      $($('#pgQuestion-wrapper3 .pgQuestion')[1]).find(".pgQuestion__body__answer").css("opacity", "1.0");

      if ($(".pgArticle").width() >= tabletTreshold) {
      setTimeout(function() {
        var $questionWrapper = $($('.pgQuestion-wrapper')[currentStep - 1]),
        $questionContainer = $($('.pgQuestion-container')[currentStep - 1]),
        newTranslationValue = -(($questionContainer.width() * nextPosition) / $questionWrapper.width()) * 100.0,
        newTranslation = 'translate3d(' + newTranslationValue + '%,-50%,0)';
        $questionWrapper.css('-webkit-transform', newTranslation);
        $questionWrapper.css('-moz-transform', newTranslation);
        $questionWrapper.css('transform:', newTranslation);//

        mosquitosLeft -= returnMosquitosLeft(currentStep, nextPosition, !$($($('#pgQuestion-wrapper3 .pgQuestion')[1]).find("pgQuestion__body__binary-option")[1]).hasClass("selected"));

      mosquitosArray.forEach(function(element,index,array){
        setTimeout(function() {
          if (index < mosquitosLeft) {
            // add delay
            element.positionsArray = mosquitosPositionsPhase16[0];

            if ($(".pgArticle").width() < tabletTreshold) {
              element.positionsArray = mosquitosPositionsPhase16S[0];
            }

            element.positionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray[index2] = element2;
              }
              else {
                element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
                element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
                element.positionsArray[index2] = element2;
              }
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
      }, 3250);
      }
    }
    else {
      $($('#pgQuestion-wrapper3 .pgQuestion')[2]).find(".check").css("opacity", "1.0");
      $($('#pgQuestion-wrapper3 .pgQuestion')[2]).find(".pgQuestion__body__answer").css("opacity", "1.0");
      if ($(".pgArticle").width() >= tabletTreshold) {
        decideNextStep(5);
      }
    }

  });
};

var newX = 0.3;
    var newXS = 0.25;
    var newY = 3.22;
    var newRealY = 0;
    var newYS = 2;

//Select the pregnancy option
var selectPregnancyOption = function() {
  $(document).on('click', '.pgStep__pregnancy-ok', function() {
    if (currentPhase == 20) {
      if ($(".pgArticle").width() < tabletTreshold) {
        $("#left-glass-cover-horizontal, #left-glass-cover-mid-horizontal").animate({
          marginLeft: "-" + ($("#left-glass-cover-horizontal").width() * 0.01) + "px"
        }, 200);
      }
      else {
        $("#left-glass-cover, #left-glass-cover-mid").animate({
          marginTop: "-" + ($("#left-glass-cover").height() * 0.01) + "px"
        }, 200);
      }
      
      $('.pgStep__pregnancy-ok').attr("disabled", "disabled");
      $('.pgStep__pregnancy-ko').attr("disabled", "disabled");
      currentPhase = 21;
    pregnantSelected = true;

    cell = Math.ceil(25 * (mosquitosLeft / totalMosquitos));
    
    switch (cell) {
      case 1:
      case 3:
      case 5:
      case 8:
      case 12:
        newX = 0.315;
        newXS = 0.25;
      break;
      case 2:
      case 6:
      case 10:
      case 14:
      case 17:
        newX = 0.405;
        newXS = 0.375;
      break;
      case 4:
      case 9:
      case 15:
      case 19:
      case 21:
        newX = 0.5;
        newXS = 0.5;
      break;
      case 7:
      case 13:
      case 18:
      case 22:
      case 24:
        newX = 0.595;
        newXS = 0.625;
      break;
      case 11:
      case 16:
      case 20:
      case 23:
      case 25:
        newX = 0.685;
        newXS = 0.75;
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
        newRealY = 19;
        newYS = 72;
      break;
      case 3:
      case 6:
      case 9:
      case 13:
      case 16:
        newY = 3.3475;
        newY = 5;
        newRealY = 13;
        newYS = 52;
      break;
      case 5:
      case 10:
      case 15:
      case 18:
      case 20:
        newY = 3.305;
        newY = 10;
        newRealY = 8;
        newYS = 32;
      break;
      case 8:
      case 14:
      case 19:
      case 22:
      case 23:
        newY = 3.2625;
        newY = 15;
        newRealY = 4;
        newYS = 17;
      break;
      case 12:
      case 17:
      case 21:
      case 24:
      case 25:
        newY = 3.22;
        newY = 20;
        newRealY = -1;
        newYS = 2;
      break;
    }

    $('.pgStep__last-chart-marker').css("opacity", 1.0);
    markerMarginTop = (20 - newY);

    if ($(".pgArticle").width() < tabletTreshold) {
      $('.pgStep__last-chart-marker').css("top", newYS+ "%");
      $('.pgStep__last-chart-marker').css("left",  (newXS * 100) + "%");
    }
    else {
      $('.pgStep__last-chart-marker').css("margin-top",  newRealY+ "%");
      $('.pgStep__last-chart-marker').css("left",  parseInt(newX * 100) + "%");
    }

    markerPos = $('#pgStep4 .pgStep__last-chart-marker').position();

    var newPositionsArray = new Array({x: markerPos.left / canvas.width, y: ((markerPos.top + parseInt($('#pgStep4 .pgStep__last-chart-marker').css("margin-top"))) + $('#pgStep4 .pgStep__last-chart').position().top + $('#pgStep4 .pgStep__last-chart-marker').height()) / canvas.width});


    if ($(".pgArticle").width() < tabletTreshold) {
      markerPos = $('.pgStep__last-chart-horizontal-wrapper .pgStep__last-chart-marker').position();
      newPositionsArray = new Array({x: ((markerPos.left + $('.pgStep__last-chart-horizontal-wrapper').position().left + parseInt($('.pgStep__last-chart-horizontal-wrapper').css("margin-left"))) / 0.125 ) / canvas.width, y: (( (markerPos.top + $('.pgStep__last-chart-marker').height() + parseInt($(".pgStep__last-chart-horizontal-wrapper").css("margin-top")) ) + (($("#mosquitosCanvas").height() - $('.pgStep__last-chart-horizontal-wrapper').height()) / 2.0) ) / 0.125) / canvas.width});
      setTimeout(function() {
          if ($(".pgArticle").width() <= 736 && $("#horizontal-conclusions-button").css("display") == "none") {
            $('.pgChart').animate({
              scrollLeft: $('.pgConclusions').position().left
            }, 2500);
          }
      }, 4000);
    }

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
      //setTimeout(function() {
        if ($(".pgArticle").width() < tabletTreshold) {
          $('.pgChart').animate({
            scrollLeft: $('#pgStep__last-chart').position().left + ($('#pgStep4').width() / 2)
          }, 1000);
        }
        else {
          $('html, body').animate({
            scrollTop: $(".pgStep__last-chart").position().top + ($('#pgStep4').height() / 2 )
            //scrollTop: $(".pgConclusions").offset().top - ($('#pgStep4 .pgStep__last-chart').height() * 2.0)
          }, 1000);
        }
      //}, 1000);
    }, 0);
    }
  });
  $(document).on('click', '.pgStep__pregnancy-ko', function() {
    if (currentPhase == 20) {
      if ($(".pgArticle").width() < tabletTreshold) {
        $("#right-glass-cover-horizontal, #right-glass-cover-mid-horizontal").animate({
          marginTop: "-" + ($("#right-glass-cover-horizontal").width() * 0.01) + "px"
        }, 200);
      }
      else {
        $("#right-glass-cover, #right-glass-cover-mid").animate({
          marginTop: "-" + ($("#right-glass-cover").height() * 0.01) + "px"
        }, 200);
      }
      $('.pgStep__pregnancy-ok').attr("disabled", "disabled");
      $('.pgStep__pregnancy-ko').attr("disabled", "disabled");
      currentPhase = 21;
    nonPregnantSelected = true;
    var newMosquitosLeftValue = Math.max(5, mosquitosLeft - (mosquitosLeft * 0.45));

    cell = Math.ceil(25 * (newMosquitosLeftValue / totalMosquitos));
    
    cell = Math.ceil(25 * (mosquitosLeft / totalMosquitos));

    switch (cell) {
      case 1:
      case 3:
      case 5:
      case 8:
      case 12:
        newX = 0.315;
        newXS = 0.25;
      break;
      case 2:
      case 6:
      case 10:
      case 14:
      case 17:
        newX = 0.405;
        newXS = 0.375;
      break;
      case 4:
      case 9:
      case 15:
      case 19:
      case 21:
        newX = 0.5;
        newXS = 0.5;
      break;
      case 7:
      case 13:
      case 18:
      case 22:
      case 24:
        newX = 0.595;
        newXS = 0.625;
      break;
      case 11:
      case 16:
      case 20:
      case 23:
      case 25:
        newX = 0.685;
        newXS = 0.75;
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
        newRealY = 19;
        newYS = 72;
      break;
      case 3:
      case 6:
      case 9:
      case 13:
      case 16:
        newY = 3.3475;
        newY = 5;
        newRealY = 13;
        newYS = 52;
      break;
      case 5:
      case 10:
      case 15:
      case 18:
      case 20:
        newY = 3.305;
        newY = 10;
        newRealY = 8;
        newYS = 32;
      break;
      case 8:
      case 14:
      case 19:
      case 22:
      case 23:
        newY = 3.2625;
        newY = 15;
        newRealY = 4;
        newYS = 17;
      break;
      case 12:
      case 17:
      case 21:
      case 24:
      case 25:
        newY = 3.22;
        newY = 20;
        newRealY = -1;
        newYS = 2;
      break;
    }

    $('.pgStep__last-chart-marker').css("opacity", 1.0);
    markerMarginTop = (20 - newY);

    if ($(".pgArticle").width() < tabletTreshold) {
      $('.pgStep__last-chart-marker').css("top", newYS+ "%");
      $('.pgStep__last-chart-marker').css("left",  (newXS * 100) + "%");
    }
    else {
      $('.pgStep__last-chart-marker').css("margin-top",  newRealY+ "%");
      $('.pgStep__last-chart-marker').css("left",  (newX * 100) + "%");
    }

    markerPos = $('#pgStep4 .pgStep__last-chart-marker').position();

    var newPositionsArray = new Array({x: markerPos.left / canvas.width, y: ((markerPos.top + parseInt($('#pgStep4 .pgStep__last-chart-marker').css("margin-top"))) + $('#pgStep4 .pgStep__last-chart').position().top + $('#pgStep4 .pgStep__last-chart-marker').height()) / canvas.width});


    if ($(".pgArticle").width() < tabletTreshold) {
      markerPos = $('.pgStep__last-chart-horizontal-wrapper .pgStep__last-chart-marker').position();
      newPositionsArray = new Array({x: ((markerPos.left + $('.pgStep__last-chart-horizontal-wrapper').position().left + parseInt($('.pgStep__last-chart-horizontal-wrapper').css("margin-left"))) / 0.125 ) / canvas.width, y: (( (markerPos.top + $('.pgStep__last-chart-marker').height() + parseInt($(".pgStep__last-chart-horizontal-wrapper").css("margin-top")) ) + (($("#mosquitosCanvas").height() - $('.pgStep__last-chart-horizontal-wrapper').height()) / 2.0) ) / 0.125) / canvas.width});
    
      setTimeout(function() {
          if ($(".pgArticle").width() <= 736 && $("#horizontal-conclusions-button").css("display") == "none") {
            $('.pgChart').animate({
              scrollLeft: $('.pgConclusions').position().left
            }, 2500);
          }
      }, 4000);
    }

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
        if ($(".pgArticle").width() < tabletTreshold) {
          $('.pgChart').animate({
            scrollLeft: $('#pgStep4').position().left + ($('#pgStep4').width() / 2.0)
          }, 1000);
        }
        else {
          $('html, body').animate({
            //scrollTop: $(".pgConclusions").offset().top - ($('#pgStep4 .pgStep__last-chart').height() * 2.0)
            scrollTop: $(".pgStep__last-chart").position().top + ($('#pgStep4').height() / 2 )
          }, 1000);
        }
      }, 1000);
    }, 0);
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
      else if (option == 4){
        auxMosquitosLeft = 75;
      }
    }
    if (question == 2) {
      if (option == 1) {
        if (mosquitosLeft <= 25) {
          auxMosquitosLeft = -50;//
        }
        else {
          auxMosquitosLeft = 0;
        }
      }
      else if (option == 2 || option == 4) {
        if (mosquitosLeft <= 25) {
          auxMosquitosLeft = 0;
        }
        else {
          auxMosquitosLeft = 5;
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
        auxMosquitosLeft = 1;
      }
      else if (option == 1) {
        auxMosquitosLeft = 0;
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
  var conclusionsText = '<h4 class="pgConclusions__main-conclusion"><b>You have a ';

  if (cell <= 10) {
    conclusionsText += "low";
  }
  else if (cell <= 19) {
    conclusionsText += "mid";
  }
  else {
    conclusionsText += "high";
  }

  conclusionsText += " risk of contracting the Zika virus, and the consequences "

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
  }else if (parseInt($("#home-country").val()) == 2 && parseInt($("#visit-country").val()) == 2) {
    if (!$($(".pgQuestion__body__option")[8]).hasClass("selected") || pregnantSelected) {
      conclusionsText += "<p>You don’t live in a country nor are you planning to travel to a country affected by the Zika virus. <b>Your risk is low</b> but remember that there have been <b>cases of sexual transmission</b> by partners that got infected in those areas.</p>";
    }
    else {
      conclusionsText += "<p>You don’t live in a country nor are you planning to travel to a country affected by the Zika virus. <b>Your risk is zero.<b></p>";
    }
  }
  else if(!(parseInt($("#home-country").val()) == 4 && parseInt($("#visit-country").val()) == 4)) {
    conclusionsText += "<p>You live in a country that is affected by the Zika virus or you are planning to travel to a country that is.</p>";
  }

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

  conclusionsText += "<br><br>";

  $(".pgConclusions-desc").before(conclusionsText);

  $(".pgConclusions-desc, .pgConclusions h4").css("display", "block");
}

var createUsersStats = function(markerLeft, markerTop, cell) {
  var results = [1, 2, 1, 2, 5, 3, 6, 10, 1, 1, 1, 1, 10, 12, 5, 1, 1, 10, 12, 1, 1, 1, 2, 9, 1];

  var maxResults = -1;

  for (var i = 0; i < results.length; i++) {
    if (maxResults < results[i]) {
      maxResults = results[i];
    }
  }

  $($('#pgStep4 .pgStep__users-stats-row-value')[0]).css("left", "0%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[0]).css("left", "0%");
  $($('#pgStep4 .pgStep__users-stats-row-value')[1]).css("left", "60%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[1]).css("left", "60%");
  $($('#pgStep4 .pgStep__users-stats-row-value')[2]).css("left", "75%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[2]).css("left", "75%");
  $($('#pgStep4 .pgStep__users-stats-row-value')[3]).css("left", "0%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[3]).css("left", "0%");
  $($('#pgStep4 .pgStep__users-stats-row-value')[4]).css("left", "55%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[4]).css("left", "55%");
  $($('#pgStep4 .pgStep__users-stats-row-value')[5]).css("left", "70%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[5]).css("left", "70%");

  $($('#pgStep4 .pgStep__users-stats-row-value')[0]).css("width", "60%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[0]).css("width", "60%");
  $($('#pgStep4 .pgStep__users-stats-row-value')[1]).css("width", "15%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[1]).css("width", "15%");
  $($('#pgStep4 .pgStep__users-stats-row-value')[2]).css("width", "25%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[2]).css("width", "25%");
  $($('#pgStep4 .pgStep__users-stats-row-value')[3]).css("width", "55%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[3]).css("width", "55%");
  $($('#pgStep4 .pgStep__users-stats-row-value')[4]).css("width", "15%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[4]).css("width", "15%");
  $($('#pgStep4 .pgStep__users-stats-row-value')[5]).css("width", "30%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-row-value')[5]).css("width", "30%");

  $($('#pgStep4 .pgStep__users-stats-text-row-value')[0]).css("left", "0%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[0]).css("left", "0%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[1]).css("left", "60%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[1]).css("left", "60%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[2]).css("left", "75%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[2]).css("left", "75%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[3]).css("left", "0%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[3]).css("left", "0%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[4]).css("left", "55%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[4]).css("left", "55%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[5]).css("left", "70%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[5]).css("left", "70%");

  $($('#pgStep4 .pgStep__users-stats-text-row-value')[0]).css("width", "60%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[0]).css("width", "60%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[1]).css("width", "15%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[1]).css("width", "15%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[2]).css("width", "25%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[2]).css("width", "25%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[3]).css("width", "55%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[3]).css("width", "55%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[4]).css("width", "15%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[4]).css("width", "15%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[5]).css("width", "30%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[5]).css("width", "30%");

  var mediumWord = "MEDIUM ";
  if ($(window).width() < 520) {
    mediumWord = "MED "
  }

  $($('#pgStep4 .pgStep__users-stats-text-row-value')[0]).html("LOW " + 60 + "%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[0]).html("LOW " + 60 + "%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[1]).html(mediumWord + 15 + "%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[1]).html(mediumWord + 15 + "%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[2]).html("HIGH " + 25 + "%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[2]).html("HIGH " + 25 + "%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[3]).html("LOW " + 55 + "%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[3]).html("LOW " + 55 + "%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[4]).html(mediumWord + 15 + "%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[4]).html(mediumWord + 15 + "%");
  $($('#pgStep4 .pgStep__users-stats-text-row-value')[5]).html("HIGH " + 30 + "%");
  $($('.pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value')[5]).html("HIGH " + 30 + "%");

  $(".pgStep__users-stats-text-row-value").css("opacity", "1.0");

  $(".pgStep__users-stats-marker").css("opacity", 1.0);
  $(".pgStep__users-stats-marker").css("display", "block");

  switch (markerLeft) {
    case 0.315:
      switch (markerTop) {
        case 20:
          markerLeft = 60 * 0.5;
          markerTop = 70 + (30 * 0.5);
        break;
        case 15:
          markerLeft = 60 * 0.5;
          markerTop = 55 + (15 * 0.875);
        break;
        case 10:
          markerLeft = 60 * 0.5;
          markerTop = 55 + (15 * 0.5);
        break;
        case 5:
          markerLeft = 60 * 0.5;
          markerTop = 55 + (15 * 0.125);
        break;
        case 0:
          markerLeft = 60 * 0.5;
          markerTop = 55 * 0.5;
        break;
      }
    break;
    case 0.405:
      switch (markerTop) {
        case 20:
          markerLeft = 60 + (15 * 0.125);
          markerTop = 70 + (30 * 0.5);
        break;
        case 15:
          markerLeft = 60 + (15 * 0.125);
          markerTop = 55 + (15 * 0.875);
        break;
        case 10:
          markerLeft = 60 + (15 * 0.125);
          markerTop = 55 + (15 * 0.5);
        break;
        case 5:
          markerLeft = 60 + (15 * 0.125);
          markerTop = 55 + (15 * 0.125);
        break;
        case 0:
          markerLeft = 60 + (15 * 0.125);
          markerTop = 55 * 0.5;
        break;
      }
    break;
    case 0.5:
      switch (markerTop) {
        case 20:
          markerLeft = 60 + (15 * 0.5);
          markerTop = 70 + (30 * 0.5);
        break;
        case 15:
          markerLeft = 60 + (15 * 0.5);
          markerTop = 55 + (15 * 0.875);
        break;
        case 10:
          markerLeft = 60 + (15 * 0.5);
          markerTop = 55 + (15 * 0.5);
        break;
        case 5:
          markerLeft = 60 + (15 * 0.5);
          markerTop = 55 + (15 * 0.125);
        break;
        case 0:
          markerLeft = 60 + (15 * 0.5);
          markerTop = 55 * 0.5;
        break;
      }
    break;
    case 0.595:
      switch (markerTop) {
        case 20:
          markerLeft = 60 + (15 * 0.875);
          markerTop = 70 + (30 * 0.5);
        break;
        case 15:
          markerLeft = 60 + (15 * 0.875);
          markerTop = 55 + (15 * 0.875);
        break;
        case 10:
          markerLeft = 60 + (15 * 0.875);
          markerTop = 55 + (15 * 0.5);
        break;
        case 5:
          markerLeft = 60 + (15 * 0.875);
          markerTop = 55 + (15 * 0.125);
        break;
        case 0:
          markerLeft = 60 + (15 * 0.875);
          markerTop = 55 * 0.5;
        break;
      }
    break;
    case 0.685:
      switch (markerTop) {
        case 20:
          markerLeft = 75 + (25 * 0.5);
          markerTop = 70 + (30 * 0.5);
        break;
        case 15:
          markerLeft = 75 + (25 * 0.5);
          markerTop = 55 + (15 * 0.875);
        break;
        case 10:
          markerLeft = 75 + (25 * 0.5);
          markerTop = 55 + (15 * 0.5);
        break;
        case 5:
          markerLeft = 75 + (25 * 0.5);
          markerTop = 55 + (15 * 0.125);
        break;
        case 0:
          markerLeft = 75 + (25 * 0.5);
          markerTop = 55 * 0.5;
        break;
      }
    break;
  }

  $($("#pgStep4 .pgStep__users-stats-marker")[0]).css("left", parseInt(markerLeft) + "%");
  $($(".pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-marker")[0]).css("left", parseInt(markerLeft) + "%");

  setTimeout(function() {
    $($(".pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-marker")[0]).css("display", "block");
  }, 100);

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

  offsetX = 0;

  $($("#pgStep4 .pgStep__users-stats-marker")[1]).css("left", parseInt(markerTop) + "%");
  $($(".pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-marker")[1]).css("left", parseInt(markerTop) + "%");

  setTimeout(function() {
    $($(".pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-marker")[1]).css("display", "block");
  }, 100);

  $("#horizontal-conclusions-button .pg-button").removeAttr("disabled");
  $(document).on("click", '#horizontal-conclusions-button .pg-button:not([disabled="disabled"])', function() {
    $('.pgChart').animate({
      scrollLeft: $('#pgStep4').position().left + ($('#pgStep4').width() * 2.0)
    }, 2000);
  });

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

    FB.ui({
      method: 'share',
      href: url,
      quote: text
    }, function(response){});

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

/**
  Funcion de reescalado
  
  @method resize
*/

rtime = new Date(1, 1, 2000, 12, 00, 00);
timeout = false;
delta = 2;
var scrollLeft = 0;
var oldWidth = 0;
var markerMarginTop = -1;
var isDesktopSize = true;

$(window).on("resize", function() {
    rtime = new Date();
    if (timeout === false) {
        timeout = true;
        scrollLeft = $(".pgChart").scrollLeft();
        oldWidth = $(".pgArticle").width();
        setTimeout(resizeend, delta);
    }

    if (isDesktopSize && $(window).width() < tabletTreshold + 20) {
      isDesktopSize = false;
      updateMosquitosPaths();
    }
    else if (!isDesktopSize && $(window).width() >= tabletTreshold + 20) {
      isDesktopSize = true;
      updateMosquitosPaths();
    }
});

function resizeend() {
    if (new Date() - rtime < delta) {
        setTimeout(main.resizeend, delta);
    } else {
      timeout = false;
      //setupCanvas(); 
      if ($(".pgArticle").width() < tabletTreshold) {
        canvas.width = $('.horizontal-background img').width();
        canvas.height = $('.horizontal-background img').height();
        canvas.style.width  = canvas.width.toString() + "px";
        canvas.style.height = canvas.height.toString() + "px";
      }
      else {
        canvas.width = $('.pgChart-wrapper').width();
        canvas.height = $('.pgChart-wrapper').height();
        canvas.style.width  = canvas.width.toString() + "px";
        canvas.style.height = canvas.height.toString() + "px";
      }

      if ($(window).width() < 520) {
        $($(".pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value")[1]).html("MED 15%");
        $($(".pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value")[5]).html("MED 15%");
      }
      else {
        $($(".pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value")[1]).html("MEDIUM 15%");
        $($(".pgStep__last-chart-horizontal-wrapper .pgStep__users-stats-text-row-value")[5]).html("MEDIUM 15%");
      }
    }
}

var updateMosquitosPaths = function() {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  mosquitosArray.forEach(function(element,index,array){
    switch (element.currentMosquitoPhase) {
      case 0:
        element.positionsArray = new Array();
        var auxPositionsArray = mosquitosPositionsPhase1[index%mosquitosPositionsPhase1.length];

          auxPositionsArray = shuffle(auxPositionsArray);
          
          auxPositionsArray.forEach(function(element2,index2,array2) {
            var auxElement = {x: element2.x + (((Math.random() * 0.1) - 0.05) * 1.0), y: element2.y + (((Math.random() * 0.1) - 0.05) * 1.0)};
            auxElement.x = Math.max(0.51, Math.min(0.95, auxElement.x)) + 0.02;
            auxElement.y = Math.max(0.1, Math.min(0.3, auxElement.y));

            if (!isDesktopSize) {
              auxElement.x = auxElement.x;
              auxElement.y = auxElement.y + 0.27;
            }
            else {
              if (auxElement.y <= 0.1 && auxElement.x <= 0.49) {
                auxElement.x = auxElement.x + 0.2;
              }
            }
            element.positionsArray.push(auxElement);
          });
      break;
      case 1:
        if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray = mosquitosPositionsPhase2S[0];
          }
          else {
            element.positionsArray = mosquitosPositionsPhase2[0];
          }

          if (!($(".pgArticle").width() < tabletTreshold)) {
            element.positionsArray.forEach(function(element2,index2,array2) {
              element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
              element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
              element.positionsArray[index2] = element2;
            });
          }
      break;
      case 2:
         if ($(".pgArticle").width() < tabletTreshold) {
              var auxPositionsArray = mosquitosPositionsPhase3S[index%mosquitosPositionsPhase3S.length];
            }
            else {
              var auxPositionsArray = mosquitosPositionsPhase3[index%mosquitosPositionsPhase3.length];
            }

            auxPositionsArray = shuffle(auxPositionsArray);
            element.positionsArray = new Array();
            auxPositionsArray.forEach(function(element2,index2,array2) {
              if ($(".pgArticle").width() < tabletTreshold) {
                element.positionsArray.push(element2);
              }
              else {
                var auxElement = {x: element2.x + (((Math.random() * 0.1) - 0.05) * 1.0), y: element2.y + (((Math.random() * 0.1) - 0.05) * 1.0)};
                auxElement.x = Math.max(0.086,Math.min(0.135, auxElement.x)) + 0.01;
                auxElement.y = Math.max(0.555,Math.min(0.715, auxElement.y)) + 0.04;
                element.positionsArray.push(auxElement);
              }
            });
      break;
      case 3:
        if ($(".pgArticle").width() < tabletTreshold) {
          element.positionsArray = mosquitosPositionsPhase4S[0];
        }
        else {
          element.positionsArray = mosquitosPositionsPhase4[0];
        }

        if ($(".pgArticle").width() < tabletTreshold) {
          element.positionsArray.forEach(function(element2,index2,array2) {
            element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
            element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
            element.positionsArray[index2] = element2;
          });
        }
      break;
      case 4:
        element.currentPosition = 0;
        var auxPositionsArray = mosquitosPositionsPhase5[index%mosquitosPositionsPhase5.length];

        if ($(".pgArticle").width() < tabletTreshold) {
          auxPositionsArray = mosquitosPositionsPhase5S[index%mosquitosPositionsPhase5S.length];
        }

        auxPositionsArray = shuffle(auxPositionsArray);
        element.positionsArray = new Array();
        auxPositionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray.push(element2);
          }
          else {
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
          }
        });
      break;
      case 5:
      break;
      case 6:
        element.currentPosition = 0;
        currentPhase = 3;

        if (index == mosquitosLeft - 1) {
          $("#pgStep2 .pg-button").removeAttr("disabled");
          $("#pgStep2").removeAttr("disabled");
        }

        var auxPositionsArray = mosquitosPositionsPhase7[index%mosquitosPositionsPhase7.length];

        if ($(".pgArticle").width() < tabletTreshold) {
          auxPositionsArray = mosquitosPositionsPhase7S[index%mosquitosPositionsPhase7S.length];
        }

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
      break;
      case 7:
        if (index > auxMosquitosLeft) {
          element.positionsArray = new Array();
          if ($(".pgArticle").width() < tabletTreshold) {
            for (var i = 0; i < mosquitosPositionsPhase4S[0].length; i++) {
              element.positionsArray.push(mosquitosPositionsPhase4S[0][i]);
            };
            for (var i = 0; i < mosquitosPositionsPhase6S[0].length; i++) {
              element.positionsArray.push(mosquitosPositionsPhase6S[0][i]);
            }
            for (var i = 0; i < mosquitosPositionsPhase8S[0].length; i++) {
              element.positionsArray.push(mosquitosPositionsPhase8S[0][i]);
            }
          }
          else {
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
        }
        else {
          element.positionsArray = new Array();
          if ($(".pgArticle").width() < tabletTreshold) {
            for (var i = 0; i < mosquitosPositionsPhase6S[0].length; i++) {
              element.positionsArray.push(mosquitosPositionsPhase6S[0][i]);
            }
            for (var i = 0; i < mosquitosPositionsPhase8S[0].length; i++) {
              element.positionsArray.push(mosquitosPositionsPhase8S[0][i]);
            }
          }
          else {
            for (var i = 0; i < mosquitosPositionsPhase6[0].length; i++) {
              element.positionsArray.push(mosquitosPositionsPhase6[0][i]);
            }
            for (var i = 0; i < mosquitosPositionsPhase8[0].length; i++) {
              element.positionsArray.push(mosquitosPositionsPhase8[0][i]);
            }
          }
          
        }

        element.positionsArray.forEach(function(element2,index2,array2) {
          element2.x = element2.x /*+ (((Math.random() * 0.1) - 0.05) * 0.0003)*/;
          element2.y = element2.y /*+ (((Math.random() * 0.1) - 0.05) * 0.0003)*/;
          element.positionsArray[index2] = element2;
        });
      break;
      case 8:
        var auxPositionsArray = mosquitosPositionsPhase9[index%mosquitosPositionsPhase9.length];

        if ($(".pgArticle").width() < tabletTreshold) {
          auxPositionsArray = mosquitosPositionsPhase9S[index%mosquitosPositionsPhase9S.length];
        }

        if ($(".pgArticle").width() < tabletTreshold) {
          var auxPositionsArray = mosquitosPositionsPhase9S[index%mosquitosPositionsPhase9S.length];
        }
        auxPositionsArray = shuffle(auxPositionsArray);
        element.positionsArray = new Array();
        auxPositionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray.push(element2);
          }
          else {
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
          }
        });
      break;
      case 9:
      break;
      case 10:
        element.currentPosition = 0;
        
        if (index == mosquitosLeft - 1) {
          $("#pgStep3 .pg-button").removeAttr("disabled");
          $("#pgStep3").removeAttr("disabled");
        }

        var auxPositionsArray = mosquitosPositionsPhase11[index%mosquitosPositionsPhase11.length];

        if ($(".pgArticle").width() < tabletTreshold) {
          auxPositionsArray = mosquitosPositionsPhase11S[index%mosquitosPositionsPhase11S.length];
        }

        auxPositionsArray = shuffle(auxPositionsArray);
        element.positionsArray = new Array();
        auxPositionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray.push(element2);
          }
          else {
            var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.018, y: element2.y + (((Math.random() * 0.001) - 0.0005) * 1.0)};
            element.positionsArray.push(auxElement);
          }
        });
      break;
      case 11:
        element.positionsArray = new Array();

        if ($(".pgArticle").width() < tabletTreshold) {
          for (var i = 0; i < mosquitosPositionsPhase10S[0].length; i++) {
            element.positionsArray.push(mosquitosPositionsPhase10S[0][i]);
          }
          for (var i = 0; i < mosquitosPositionsPhase12S[0].length; i++) {
            element.positionsArray.push(mosquitosPositionsPhase12S[0][i]);
          }
        }
        else {
          for (var i = 0; i < mosquitosPositionsPhase10[0].length; i++) {
            element.positionsArray.push(mosquitosPositionsPhase10[0][i]);
          }
          for (var i = 0; i < mosquitosPositionsPhase12[0].length; i++) {
            element.positionsArray.push(mosquitosPositionsPhase12[0][i]);
          }
        }

        element.positionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray[index2] = element2;
          }
          else {
            element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
            element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
            element.positionsArray[index2] = element2;
          }
        });
      break;
      case 12:
        element.currentPosition = 0;
        
        if (index == mosquitosLeft - 1) {
          $("#pgStep3 .pg-button").attr("disabled", "disabled");
          $("#pgStep3").attr("disabled", "disabled");

          $(".pgQuestion__body__binary-option").removeClass("disabled-option");
          $('#pgQuestion-container3 .pg-button').removeAttr("disabled");
          $('#pgQuestion-container3').removeAttr("disabled");
        }

        var auxPositionsArray = mosquitosPositionsPhase13[index%mosquitosPositionsPhase13.length];

        if ($(".pgArticle").width() < tabletTreshold) {
          auxPositionsArray = mosquitosPositionsPhase13S[index%mosquitosPositionsPhase13S.length];
        }

        auxPositionsArray = shuffle(auxPositionsArray);
        element.positionsArray = new Array();
        auxPositionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray.push(element2);
          }
          else {
            var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0) + 0.005, y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.01 + 0.275};
            element.positionsArray.push(auxElement);
          }
        });
      break;
      case 13:
        // add delay
        element.positionsArray = mosquitosPositionsPhase14[0];

        if ($(".pgArticle").width() < tabletTreshold) {
          element.positionsArray = mosquitosPositionsPhase14S[0];
        }

        element.positionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray[index2] = element2;
          }
          else {
            element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
            element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
            element.positionsArray[index2] = element2;
          }
        });
      break;
      case 14:
        var auxPositionsArray = mosquitosPositionsPhase15[index%mosquitosPositionsPhase15.length];

        if ($(".pgArticle").width() < tabletTreshold) {
          auxPositionsArray = mosquitosPositionsPhase15S[index%mosquitosPositionsPhase15S.length];
        }

        auxPositionsArray = shuffle(auxPositionsArray);
        element.positionsArray = new Array();
        auxPositionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray.push(element2);
          }
          else {
            var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0) + 0.005, y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) - 0.01 + 0.275};
            element.positionsArray.push(auxElement);
          }
        });
      break;
      case 15:
        element.positionsArray = mosquitosPositionsPhase16[0];

        if ($(".pgArticle").width() < tabletTreshold) {
          element.positionsArray = mosquitosPositionsPhase16S[0];
        }

        element.positionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray[index2] = element2;
          }
          else {
            element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.0007);
            element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.0007);
            element.positionsArray[index2] = element2;
          }
        });
      break;
      case 16:
        element.currentPosition = 0;

        var auxPositionsArray = mosquitosPositionsPhase17[index%mosquitosPositionsPhase17.length];

        if ($(".pgArticle").width() < tabletTreshold) {
          auxPositionsArray = mosquitosPositionsPhase17S[index%mosquitosPositionsPhase17S.length];
        }

        auxPositionsArray = shuffle(auxPositionsArray);
        element.positionsArray = new Array();
        auxPositionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray.push(element2);
          }
          else {
            var auxElement = {x: element2.x + (((Math.random() * 0.001) - 0.0005) * 1.0) + 0.005, y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) + 0.275};
            element.positionsArray.push(auxElement);
          }
        });
      break;
      case 17:
        if ($(".pgArticle").width() < tabletTreshold) {
          element.positionsArray = mosquitosPositionsPhase18S[0];
        }
        else {
          element.positionsArray = mosquitosPositionsPhase18[0];
        }

        element.positionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray[index2] = element2;
          }
          else {
            element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
            element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
            element.positionsArray[index2] = element2;
          }
        });
      break;
      case 18:
        element.currentPosition = 0;

        var auxPositionsArray = mosquitosPositionsPhase19[index%mosquitosPositionsPhase19.length];

        if ($(".pgArticle").width() < tabletTreshold) {
          auxPositionsArray = mosquitosPositionsPhase19S[index%mosquitosPositionsPhase19S.length];
        }

        auxPositionsArray = shuffle(auxPositionsArray);
        element.positionsArray = new Array();
        auxPositionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            //element2.y = element2.y - 0.005;
            element.positionsArray.push(element2);
          }
          else {
            var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) + 0.37};
            element.positionsArray.push(auxElement);
          }
        });
      break;
      case 19:
        element.positionsArray = mosquitosPositionsPhase20[0];

        if ($(".pgArticle").width() < tabletTreshold) {
          element.positionsArray = mosquitosPositionsPhase20S[0];
        }

        element.positionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            element.positionsArray[index2] = element2;
          }
          else {
            element2.x = element2.x + (((Math.random() * 0.1) - 0.05) * 0.003);
            element2.y = element2.y + (((Math.random() * 0.1) - 0.05) * 0.003);
            element.positionsArray[index2] = element2;
          }
        });
      break;
      case 20:
        element.currentPosition = 0;

        var auxPositionsArray = mosquitosPositionsPhase21[index%mosquitosPositionsPhase21.length];

        if ($(".pgArticle").width() < tabletTreshold) {
          auxPositionsArray = mosquitosPositionsPhase21S[index%mosquitosPositionsPhase21S.length];
        }

        auxPositionsArray = shuffle(auxPositionsArray);
        element.positionsArray = new Array();
        auxPositionsArray.forEach(function(element2,index2,array2) {
          if ($(".pgArticle").width() < tabletTreshold) {
            //element2.y = element2.y - 0.005;
            element.positionsArray.push(element2);
          }
          else {
            var auxElement = {x: element2.x + (((Math.random() * 0.01) - 0.005) * 1.0), y: element2.y + (((Math.random() * 0.01) - 0.005) * 1.0) + 0.37};
            element.positionsArray.push(auxElement);
          }
        });
      break;
      case 21:
        markerMarginTop = (20 - newY);

        if ($(".pgArticle").width() < tabletTreshold) {
          $('.pgStep__last-chart-marker').css("top", newYS+ "%");
          $('.pgStep__last-chart-marker').css("left",  (newXS * 100) + "%");
        }
        else {
          $('.pgStep__last-chart-marker').css("margin-top",  newRealY+ "%");
          $('.pgStep__last-chart-marker').css("left",  (newX * 100) + "%");
        }

        createUsersStats(newX, newY, cell);

        markerPos = $('#pgStep4 .pgStep__last-chart-marker').position();

        var newPositionsArray = new Array({x: markerPos.left / canvas.width, y: ((markerPos.top + parseInt($('#pgStep4 .pgStep__last-chart-marker').css("margin-top"))) + $('#pgStep4 .pgStep__last-chart').position().top + $('#pgStep4 .pgStep__last-chart-marker').height()) / canvas.width});


        if ($(".pgArticle").width() < tabletTreshold) {
          markerPos = $('.pgStep__last-chart-horizontal-wrapper .pgStep__last-chart-marker').position();
          newPositionsArray = new Array({x: ((markerPos.left + $('.pgStep__last-chart-horizontal-wrapper').position().left + parseInt($('.pgStep__last-chart-horizontal-wrapper').css("margin-left"))) / 0.125 ) / canvas.width, y: (( (markerPos.top + $('.pgStep__last-chart-marker').height() + parseInt($(".pgStep__last-chart-horizontal-wrapper").css("margin-top")) ) + (($("#mosquitosCanvas").height() - $('.pgStep__last-chart-horizontal-wrapper').height()) / 2.0) ) / 0.125) / canvas.width});
          
          setTimeout(function() {
              if ($(".pgArticle").width() <= 736 && $("#horizontal-conclusions-button").css("display") == "none") {
                $('.pgChart').animate({
                  scrollLeft: $('.pgConclusions').position().left
                }, 2500);
              }
          }, 3000);
        }
      break;
      case 22:
        // 21
        markerMarginTop = (20 - newY);

        if ($(".pgArticle").width() < tabletTreshold) {
          $('.pgStep__last-chart-marker').css("top", newYS+ "%");
          $('.pgStep__last-chart-marker').css("left",  (newXS * 100) + "%");
        }
        else {
          $('.pgStep__last-chart-marker').css("margin-top",  newRealY+ "%");
          $('.pgStep__last-chart-marker').css("left",  (newX * 100) + "%");
        }
        createUsersStats(newX, newY, cell);

        markerPos = $('#pgStep4 .pgStep__last-chart-marker').position();

        var newPositionsArray = new Array({x: markerPos.left / canvas.width, y: ((markerPos.top + parseInt($('#pgStep4 .pgStep__last-chart-marker').css("margin-top"))) + $('#pgStep4 .pgStep__last-chart').position().top + $('#pgStep4 .pgStep__last-chart-marker').height()) / canvas.width});


        if ($(".pgArticle").width() < tabletTreshold) {
          markerPos = $('.pgStep__last-chart-horizontal-wrapper .pgStep__last-chart-marker').position();
          newPositionsArray = new Array({x: ((markerPos.left + $('.pgStep__last-chart-horizontal-wrapper').position().left + parseInt($('.pgStep__last-chart-horizontal-wrapper').css("margin-left"))) / 0.125 ) / canvas.width, y: (( (markerPos.top + $('.pgStep__last-chart-marker').height() + parseInt($(".pgStep__last-chart-horizontal-wrapper").css("margin-top")) ) + (($("#mosquitosCanvas").height() - $('.pgStep__last-chart-horizontal-wrapper').height()) / 2.0) ) / 0.125) / canvas.width});
          
          setTimeout(function() {
              if ($(".pgArticle").width() <= 736 && $("#horizontal-conclusions-button").css("display") == "none") {
                $('.pgChart').animate({
                  scrollLeft: $('.pgConclusions').position().left
                }, 2500);
              }
          }, 3000);
        }

        element.positionsArray = new Array(element.positionsArray[0],element.positionsArray[0],element.positionsArray[0],element.positionsArray[0],element.positionsArray[0], element.positionsArray[0],element.positionsArray[0],element.positionsArray[0],element.positionsArray[0],element.positionsArray[0])

        for (var i = 0; i < 20; i++) {
            element.positionsArray.push({x: element.positionsArray[0].x + ((Math.random() * 0.066) - 0.033), y: element.positionsArray[0].y + ((Math.random() * 0.066) - 0.033)});
        }
      break;
    }

    element.currentPosition = Math.floor(Math.random() * element.positionsArray.length);
    element.x = element.positionsArray[element.currentPosition].x;
    element.y = element.positionsArray[element.currentPosition].y;

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
  });
}

var H = $(".pgArticle").width(),
 S = $(".pgChart").scrollLeft(),
 P = S/H;

$(document).ready(function() {
  if ($(window).width() >= tabletTreshold + 20) {
    isDesktopSize = true;
  }
  else {
    isDesktopSize = false;
  }
  $(".pgChart").scroll(function() {
    S = $(".pgChart").scrollLeft();
    P = S/H;
  });

  $(window).resize(function() {
      H = $(".pgArticle").width();
      $(".pgChart").scrollLeft(P*H);
      $('#resize-warning').css("width", $(".pgChart").width() + "px");
      $('#resize-warning').css("height", $(".pgChart").height() + "px");
  });

  $('#resize-warning').css("width", $(".pgChart").width() + "px");
  $('#resize-warning').css("height", $(".pgChart").height() + "px");

  //Set up needed functions
  manageQuestionsScroll();
  manageStepsAction();
  selectOption();
  selectBinaryOption();
  selectPregnancyOption();
  animateElementsPregnancy();
  animateBehaviorElements();
  setTimeout(function() {
    //setupCanvas();
    setupMosquitos();
    H = $(".pgArticle").width();
    S = $(".pgChart").scrollLeft();
    P = S/H;
  }, 500);
  setupMainLoop();

  /*$(document).on("click", function(e) {
    //console.log('{x:'+((e.pageX/$("canvas").width()) - 0.195) + ', y:' + (((e.pageY - 564)/$("canvas").width())) + '}');
    var x = e.pageX - $('#mosquitosCanvas').offset().left;
    var y = e.pageY - $('#mosquitosCanvas').offset().top;

    console.log('{x:'+(((x / 0.125)/$("canvas").width())) + ', y:' + (((y / 0.125)/$("canvas").width())) + '}');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGFtbWVyanMvaGFtbWVyLmpzIiwic3JjL2pzL2Jhc2UuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvaWZyYW1lLmpzIiwic3JjL2pzL3BnLXRlbXBsYXRlL3BiSGVhZGVyLmpzIiwic3JjL2pzL3BnLXRlbXBsYXRlL3BiU29jaWFsVG9vbHMuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvcG9zdEdyYXBoaWNzVGVtcGxhdGUuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvdHdpdHRlci1mb2xsb3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Z0ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMTZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qISBIYW1tZXIuSlMgLSB2Mi4wLjYgLSAyMDE1LTEyLTIzXG4gKiBodHRwOi8vaGFtbWVyanMuZ2l0aHViLmlvL1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBKb3JpayBUYW5nZWxkZXI7XG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgIGxpY2Vuc2UgKi9cbihmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50LCBleHBvcnROYW1lLCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG52YXIgVkVORE9SX1BSRUZJWEVTID0gWycnLCAnd2Via2l0JywgJ01veicsICdNUycsICdtcycsICdvJ107XG52YXIgVEVTVF9FTEVNRU5UID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbnZhciBUWVBFX0ZVTkNUSU9OID0gJ2Z1bmN0aW9uJztcblxudmFyIHJvdW5kID0gTWF0aC5yb3VuZDtcbnZhciBhYnMgPSBNYXRoLmFicztcbnZhciBub3cgPSBEYXRlLm5vdztcblxuLyoqXG4gKiBzZXQgYSB0aW1lb3V0IHdpdGggYSBnaXZlbiBzY29wZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lb3V0XG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gc2V0VGltZW91dENvbnRleHQoZm4sIHRpbWVvdXQsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gc2V0VGltZW91dChiaW5kRm4oZm4sIGNvbnRleHQpLCB0aW1lb3V0KTtcbn1cblxuLyoqXG4gKiBpZiB0aGUgYXJndW1lbnQgaXMgYW4gYXJyYXksIHdlIHdhbnQgdG8gZXhlY3V0ZSB0aGUgZm4gb24gZWFjaCBlbnRyeVxuICogaWYgaXQgYWludCBhbiBhcnJheSB3ZSBkb24ndCB3YW50IHRvIGRvIGEgdGhpbmcuXG4gKiB0aGlzIGlzIHVzZWQgYnkgYWxsIHRoZSBtZXRob2RzIHRoYXQgYWNjZXB0IGEgc2luZ2xlIGFuZCBhcnJheSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7KnxBcnJheX0gYXJnXG4gKiBAcGFyYW0ge1N0cmluZ30gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF1cbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5mdW5jdGlvbiBpbnZva2VBcnJheUFyZyhhcmcsIGZuLCBjb250ZXh0KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICBlYWNoKGFyZywgY29udGV4dFtmbl0sIGNvbnRleHQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIHdhbGsgb2JqZWN0cyBhbmQgYXJyYXlzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRvclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gZWFjaChvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIGk7XG5cbiAgICBpZiAoIW9iaikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG9iai5mb3JFYWNoKSB7XG4gICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSBpbiBvYmopIHtcbiAgICAgICAgICAgIG9iai5oYXNPd25Qcm9wZXJ0eShpKSAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiB3cmFwIGEgbWV0aG9kIHdpdGggYSBkZXByZWNhdGlvbiB3YXJuaW5nIGFuZCBzdGFjayB0cmFjZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gd3JhcHBpbmcgdGhlIHN1cHBsaWVkIG1ldGhvZC5cbiAqL1xuZnVuY3Rpb24gZGVwcmVjYXRlKG1ldGhvZCwgbmFtZSwgbWVzc2FnZSkge1xuICAgIHZhciBkZXByZWNhdGlvbk1lc3NhZ2UgPSAnREVQUkVDQVRFRCBNRVRIT0Q6ICcgKyBuYW1lICsgJ1xcbicgKyBtZXNzYWdlICsgJyBBVCBcXG4nO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGUgPSBuZXcgRXJyb3IoJ2dldC1zdGFjay10cmFjZScpO1xuICAgICAgICB2YXIgc3RhY2sgPSBlICYmIGUuc3RhY2sgPyBlLnN0YWNrLnJlcGxhY2UoL15bXlxcKF0rP1tcXG4kXS9nbSwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSgvXlxccythdFxccysvZ20sICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL15PYmplY3QuPGFub255bW91cz5cXHMqXFwoL2dtLCAne2Fub255bW91c30oKUAnKSA6ICdVbmtub3duIFN0YWNrIFRyYWNlJztcblxuICAgICAgICB2YXIgbG9nID0gd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLndhcm4gfHwgd2luZG93LmNvbnNvbGUubG9nKTtcbiAgICAgICAgaWYgKGxvZykge1xuICAgICAgICAgICAgbG9nLmNhbGwod2luZG93LmNvbnNvbGUsIGRlcHJlY2F0aW9uTWVzc2FnZSwgc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIGV4dGVuZCBvYmplY3QuXG4gKiBtZWFucyB0aGF0IHByb3BlcnRpZXMgaW4gZGVzdCB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IHRoZSBvbmVzIGluIHNyYy5cbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBvYmplY3RzX3RvX2Fzc2lnblxuICogQHJldHVybnMge09iamVjdH0gdGFyZ2V0XG4gKi9cbnZhciBhc3NpZ247XG5pZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT09ICdmdW5jdGlvbicpIHtcbiAgICBhc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0KSB7XG4gICAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCB8fCB0YXJnZXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG91dHB1dCA9IE9iamVjdCh0YXJnZXQpO1xuICAgICAgICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbmV4dEtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShuZXh0S2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0W25leHRLZXldID0gc291cmNlW25leHRLZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgYXNzaWduID0gT2JqZWN0LmFzc2lnbjtcbn1cblxuLyoqXG4gKiBleHRlbmQgb2JqZWN0LlxuICogbWVhbnMgdGhhdCBwcm9wZXJ0aWVzIGluIGRlc3Qgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSB0aGUgb25lcyBpbiBzcmMuXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICogQHBhcmFtIHtCb29sZWFuPWZhbHNlfSBbbWVyZ2VdXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBkZXN0XG4gKi9cbnZhciBleHRlbmQgPSBkZXByZWNhdGUoZnVuY3Rpb24gZXh0ZW5kKGRlc3QsIHNyYywgbWVyZ2UpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHNyYyk7XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwga2V5cy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCFtZXJnZSB8fCAobWVyZ2UgJiYgZGVzdFtrZXlzW2ldXSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgZGVzdFtrZXlzW2ldXSA9IHNyY1trZXlzW2ldXTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xufSwgJ2V4dGVuZCcsICdVc2UgYGFzc2lnbmAuJyk7XG5cbi8qKlxuICogbWVyZ2UgdGhlIHZhbHVlcyBmcm9tIHNyYyBpbiB0aGUgZGVzdC5cbiAqIG1lYW5zIHRoYXQgcHJvcGVydGllcyB0aGF0IGV4aXN0IGluIGRlc3Qgd2lsbCBub3QgYmUgb3ZlcndyaXR0ZW4gYnkgc3JjXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICogQHJldHVybnMge09iamVjdH0gZGVzdFxuICovXG52YXIgbWVyZ2UgPSBkZXByZWNhdGUoZnVuY3Rpb24gbWVyZ2UoZGVzdCwgc3JjKSB7XG4gICAgcmV0dXJuIGV4dGVuZChkZXN0LCBzcmMsIHRydWUpO1xufSwgJ21lcmdlJywgJ1VzZSBgYXNzaWduYC4nKTtcblxuLyoqXG4gKiBzaW1wbGUgY2xhc3MgaW5oZXJpdGFuY2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNoaWxkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBiYXNlXG4gKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXNdXG4gKi9cbmZ1bmN0aW9uIGluaGVyaXQoY2hpbGQsIGJhc2UsIHByb3BlcnRpZXMpIHtcbiAgICB2YXIgYmFzZVAgPSBiYXNlLnByb3RvdHlwZSxcbiAgICAgICAgY2hpbGRQO1xuXG4gICAgY2hpbGRQID0gY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShiYXNlUCk7XG4gICAgY2hpbGRQLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gICAgY2hpbGRQLl9zdXBlciA9IGJhc2VQO1xuXG4gICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgYXNzaWduKGNoaWxkUCwgcHJvcGVydGllcyk7XG4gICAgfVxufVxuXG4vKipcbiAqIHNpbXBsZSBmdW5jdGlvbiBiaW5kXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAqL1xuZnVuY3Rpb24gYmluZEZuKGZuLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGJvdW5kRm4oKSB7XG4gICAgICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8qKlxuICogbGV0IGEgYm9vbGVhbiB2YWx1ZSBhbHNvIGJlIGEgZnVuY3Rpb24gdGhhdCBtdXN0IHJldHVybiBhIGJvb2xlYW5cbiAqIHRoaXMgZmlyc3QgaXRlbSBpbiBhcmdzIHdpbGwgYmUgdXNlZCBhcyB0aGUgY29udGV4dFxuICogQHBhcmFtIHtCb29sZWFufEZ1bmN0aW9ufSB2YWxcbiAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXVxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGJvb2xPckZuKHZhbCwgYXJncykge1xuICAgIGlmICh0eXBlb2YgdmFsID09IFRZUEVfRlVOQ1RJT04pIHtcbiAgICAgICAgcmV0dXJuIHZhbC5hcHBseShhcmdzID8gYXJnc1swXSB8fCB1bmRlZmluZWQgOiB1bmRlZmluZWQsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsO1xufVxuXG4vKipcbiAqIHVzZSB0aGUgdmFsMiB3aGVuIHZhbDEgaXMgdW5kZWZpbmVkXG4gKiBAcGFyYW0geyp9IHZhbDFcbiAqIEBwYXJhbSB7Kn0gdmFsMlxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGlmVW5kZWZpbmVkKHZhbDEsIHZhbDIpIHtcbiAgICByZXR1cm4gKHZhbDEgPT09IHVuZGVmaW5lZCkgPyB2YWwyIDogdmFsMTtcbn1cblxuLyoqXG4gKiBhZGRFdmVudExpc3RlbmVyIHdpdGggbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2VcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gKi9cbmZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJzKHRhcmdldCwgdHlwZXMsIGhhbmRsZXIpIHtcbiAgICBlYWNoKHNwbGl0U3RyKHR5cGVzKSwgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogcmVtb3ZlRXZlbnRMaXN0ZW5lciB3aXRoIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXRcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICovXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycyh0YXJnZXQsIHR5cGVzLCBoYW5kbGVyKSB7XG4gICAgZWFjaChzcGxpdFN0cih0eXBlcyksIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIGZpbmQgaWYgYSBub2RlIGlzIGluIHRoZSBnaXZlbiBwYXJlbnRcbiAqIEBtZXRob2QgaGFzUGFyZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBwYXJlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIGhhc1BhcmVudChub2RlLCBwYXJlbnQpIHtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBzbWFsbCBpbmRleE9mIHdyYXBwZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaW5kXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gZm91bmRcbiAqL1xuZnVuY3Rpb24gaW5TdHIoc3RyLCBmaW5kKSB7XG4gICAgcmV0dXJuIHN0ci5pbmRleE9mKGZpbmQpID4gLTE7XG59XG5cbi8qKlxuICogc3BsaXQgc3RyaW5nIG9uIHdoaXRlc3BhY2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtBcnJheX0gd29yZHNcbiAqL1xuZnVuY3Rpb24gc3BsaXRTdHIoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci50cmltKCkuc3BsaXQoL1xccysvZyk7XG59XG5cbi8qKlxuICogZmluZCBpZiBhIGFycmF5IGNvbnRhaW5zIHRoZSBvYmplY3QgdXNpbmcgaW5kZXhPZiBvciBhIHNpbXBsZSBwb2x5RmlsbFxuICogQHBhcmFtIHtBcnJheX0gc3JjXG4gKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICogQHBhcmFtIHtTdHJpbmd9IFtmaW5kQnlLZXldXG4gKiBAcmV0dXJuIHtCb29sZWFufE51bWJlcn0gZmFsc2Ugd2hlbiBub3QgZm91bmQsIG9yIHRoZSBpbmRleFxuICovXG5mdW5jdGlvbiBpbkFycmF5KHNyYywgZmluZCwgZmluZEJ5S2V5KSB7XG4gICAgaWYgKHNyYy5pbmRleE9mICYmICFmaW5kQnlLZXkpIHtcbiAgICAgICAgcmV0dXJuIHNyYy5pbmRleE9mKGZpbmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBzcmMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoKGZpbmRCeUtleSAmJiBzcmNbaV1bZmluZEJ5S2V5XSA9PSBmaW5kKSB8fCAoIWZpbmRCeUtleSAmJiBzcmNbaV0gPT09IGZpbmQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbn1cblxuLyoqXG4gKiBjb252ZXJ0IGFycmF5LWxpa2Ugb2JqZWN0cyB0byByZWFsIGFycmF5c1xuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybnMge0FycmF5fVxuICovXG5mdW5jdGlvbiB0b0FycmF5KG9iaikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmosIDApO1xufVxuXG4vKipcbiAqIHVuaXF1ZSBhcnJheSB3aXRoIG9iamVjdHMgYmFzZWQgb24gYSBrZXkgKGxpa2UgJ2lkJykgb3IganVzdCBieSB0aGUgYXJyYXkncyB2YWx1ZVxuICogQHBhcmFtIHtBcnJheX0gc3JjIFt7aWQ6MX0se2lkOjJ9LHtpZDoxfV1cbiAqIEBwYXJhbSB7U3RyaW5nfSBba2V5XVxuICogQHBhcmFtIHtCb29sZWFufSBbc29ydD1GYWxzZV1cbiAqIEByZXR1cm5zIHtBcnJheX0gW3tpZDoxfSx7aWQ6Mn1dXG4gKi9cbmZ1bmN0aW9uIHVuaXF1ZUFycmF5KHNyYywga2V5LCBzb3J0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgdmFsdWVzID0gW107XG4gICAgdmFyIGkgPSAwO1xuXG4gICAgd2hpbGUgKGkgPCBzcmMubGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWwgPSBrZXkgPyBzcmNbaV1ba2V5XSA6IHNyY1tpXTtcbiAgICAgICAgaWYgKGluQXJyYXkodmFsdWVzLCB2YWwpIDwgMCkge1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHNyY1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWVzW2ldID0gdmFsO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHNvcnQpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNvcnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNvcnQoZnVuY3Rpb24gc29ydFVuaXF1ZUFycmF5KGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYVtrZXldID4gYltrZXldO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBnZXQgdGhlIHByZWZpeGVkIHByb3BlcnR5XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlcbiAqIEByZXR1cm5zIHtTdHJpbmd8VW5kZWZpbmVkfSBwcmVmaXhlZFxuICovXG5mdW5jdGlvbiBwcmVmaXhlZChvYmosIHByb3BlcnR5KSB7XG4gICAgdmFyIHByZWZpeCwgcHJvcDtcbiAgICB2YXIgY2FtZWxQcm9wID0gcHJvcGVydHlbMF0udG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnNsaWNlKDEpO1xuXG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgVkVORE9SX1BSRUZJWEVTLmxlbmd0aCkge1xuICAgICAgICBwcmVmaXggPSBWRU5ET1JfUFJFRklYRVNbaV07XG4gICAgICAgIHByb3AgPSAocHJlZml4KSA/IHByZWZpeCArIGNhbWVsUHJvcCA6IHByb3BlcnR5O1xuXG4gICAgICAgIGlmIChwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIGdldCBhIHVuaXF1ZSBpZFxuICogQHJldHVybnMge251bWJlcn0gdW5pcXVlSWRcbiAqL1xudmFyIF91bmlxdWVJZCA9IDE7XG5mdW5jdGlvbiB1bmlxdWVJZCgpIHtcbiAgICByZXR1cm4gX3VuaXF1ZUlkKys7XG59XG5cbi8qKlxuICogZ2V0IHRoZSB3aW5kb3cgb2JqZWN0IG9mIGFuIGVsZW1lbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEByZXR1cm5zIHtEb2N1bWVudFZpZXd8V2luZG93fVxuICovXG5mdW5jdGlvbiBnZXRXaW5kb3dGb3JFbGVtZW50KGVsZW1lbnQpIHtcbiAgICB2YXIgZG9jID0gZWxlbWVudC5vd25lckRvY3VtZW50IHx8IGVsZW1lbnQ7XG4gICAgcmV0dXJuIChkb2MuZGVmYXVsdFZpZXcgfHwgZG9jLnBhcmVudFdpbmRvdyB8fCB3aW5kb3cpO1xufVxuXG52YXIgTU9CSUxFX1JFR0VYID0gL21vYmlsZXx0YWJsZXR8aXAoYWR8aG9uZXxvZCl8YW5kcm9pZC9pO1xuXG52YXIgU1VQUE9SVF9UT1VDSCA9ICgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpO1xudmFyIFNVUFBPUlRfUE9JTlRFUl9FVkVOVFMgPSBwcmVmaXhlZCh3aW5kb3csICdQb2ludGVyRXZlbnQnKSAhPT0gdW5kZWZpbmVkO1xudmFyIFNVUFBPUlRfT05MWV9UT1VDSCA9IFNVUFBPUlRfVE9VQ0ggJiYgTU9CSUxFX1JFR0VYLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cbnZhciBJTlBVVF9UWVBFX1RPVUNIID0gJ3RvdWNoJztcbnZhciBJTlBVVF9UWVBFX1BFTiA9ICdwZW4nO1xudmFyIElOUFVUX1RZUEVfTU9VU0UgPSAnbW91c2UnO1xudmFyIElOUFVUX1RZUEVfS0lORUNUID0gJ2tpbmVjdCc7XG5cbnZhciBDT01QVVRFX0lOVEVSVkFMID0gMjU7XG5cbnZhciBJTlBVVF9TVEFSVCA9IDE7XG52YXIgSU5QVVRfTU9WRSA9IDI7XG52YXIgSU5QVVRfRU5EID0gNDtcbnZhciBJTlBVVF9DQU5DRUwgPSA4O1xuXG52YXIgRElSRUNUSU9OX05PTkUgPSAxO1xudmFyIERJUkVDVElPTl9MRUZUID0gMjtcbnZhciBESVJFQ1RJT05fUklHSFQgPSA0O1xudmFyIERJUkVDVElPTl9VUCA9IDg7XG52YXIgRElSRUNUSU9OX0RPV04gPSAxNjtcblxudmFyIERJUkVDVElPTl9IT1JJWk9OVEFMID0gRElSRUNUSU9OX0xFRlQgfCBESVJFQ1RJT05fUklHSFQ7XG52YXIgRElSRUNUSU9OX1ZFUlRJQ0FMID0gRElSRUNUSU9OX1VQIHwgRElSRUNUSU9OX0RPV047XG52YXIgRElSRUNUSU9OX0FMTCA9IERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMO1xuXG52YXIgUFJPUFNfWFkgPSBbJ3gnLCAneSddO1xudmFyIFBST1BTX0NMSUVOVF9YWSA9IFsnY2xpZW50WCcsICdjbGllbnRZJ107XG5cbi8qKlxuICogY3JlYXRlIG5ldyBpbnB1dCB0eXBlIG1hbmFnZXJcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtJbnB1dH1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBJbnB1dChtYW5hZ2VyLCBjYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICB0aGlzLmVsZW1lbnQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgdGhpcy50YXJnZXQgPSBtYW5hZ2VyLm9wdGlvbnMuaW5wdXRUYXJnZXQ7XG5cbiAgICAvLyBzbWFsbGVyIHdyYXBwZXIgYXJvdW5kIHRoZSBoYW5kbGVyLCBmb3IgdGhlIHNjb3BlIGFuZCB0aGUgZW5hYmxlZCBzdGF0ZSBvZiB0aGUgbWFuYWdlcixcbiAgICAvLyBzbyB3aGVuIGRpc2FibGVkIHRoZSBpbnB1dCBldmVudHMgYXJlIGNvbXBsZXRlbHkgYnlwYXNzZWQuXG4gICAgdGhpcy5kb21IYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKGJvb2xPckZuKG1hbmFnZXIub3B0aW9ucy5lbmFibGUsIFttYW5hZ2VyXSkpIHtcbiAgICAgICAgICAgIHNlbGYuaGFuZGxlcihldik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5pbml0KCk7XG5cbn1cblxuSW5wdXQucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNob3VsZCBoYW5kbGUgdGhlIGlucHV0RXZlbnQgZGF0YSBhbmQgdHJpZ2dlciB0aGUgY2FsbGJhY2tcbiAgICAgKiBAdmlydHVhbFxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkgeyB9LFxuXG4gICAgLyoqXG4gICAgICogYmluZCB0aGUgZXZlbnRzXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZXZFbCAmJiBhZGRFdmVudExpc3RlbmVycyh0aGlzLmVsZW1lbnQsIHRoaXMuZXZFbCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldlRhcmdldCAmJiBhZGRFdmVudExpc3RlbmVycyh0aGlzLnRhcmdldCwgdGhpcy5ldlRhcmdldCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldldpbiAmJiBhZGRFdmVudExpc3RlbmVycyhnZXRXaW5kb3dGb3JFbGVtZW50KHRoaXMuZWxlbWVudCksIHRoaXMuZXZXaW4sIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVuYmluZCB0aGUgZXZlbnRzXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZXZFbCAmJiByZW1vdmVFdmVudExpc3RlbmVycyh0aGlzLmVsZW1lbnQsIHRoaXMuZXZFbCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldlRhcmdldCAmJiByZW1vdmVFdmVudExpc3RlbmVycyh0aGlzLnRhcmdldCwgdGhpcy5ldlRhcmdldCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldldpbiAmJiByZW1vdmVFdmVudExpc3RlbmVycyhnZXRXaW5kb3dGb3JFbGVtZW50KHRoaXMuZWxlbWVudCksIHRoaXMuZXZXaW4sIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBjcmVhdGUgbmV3IGlucHV0IHR5cGUgbWFuYWdlclxuICogY2FsbGVkIGJ5IHRoZSBNYW5hZ2VyIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0hhbW1lcn0gbWFuYWdlclxuICogQHJldHVybnMge0lucHV0fVxuICovXG5mdW5jdGlvbiBjcmVhdGVJbnB1dEluc3RhbmNlKG1hbmFnZXIpIHtcbiAgICB2YXIgVHlwZTtcbiAgICB2YXIgaW5wdXRDbGFzcyA9IG1hbmFnZXIub3B0aW9ucy5pbnB1dENsYXNzO1xuXG4gICAgaWYgKGlucHV0Q2xhc3MpIHtcbiAgICAgICAgVHlwZSA9IGlucHV0Q2xhc3M7XG4gICAgfSBlbHNlIGlmIChTVVBQT1JUX1BPSU5URVJfRVZFTlRTKSB7XG4gICAgICAgIFR5cGUgPSBQb2ludGVyRXZlbnRJbnB1dDtcbiAgICB9IGVsc2UgaWYgKFNVUFBPUlRfT05MWV9UT1VDSCkge1xuICAgICAgICBUeXBlID0gVG91Y2hJbnB1dDtcbiAgICB9IGVsc2UgaWYgKCFTVVBQT1JUX1RPVUNIKSB7XG4gICAgICAgIFR5cGUgPSBNb3VzZUlucHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIFR5cGUgPSBUb3VjaE1vdXNlSW5wdXQ7XG4gICAgfVxuICAgIHJldHVybiBuZXcgKFR5cGUpKG1hbmFnZXIsIGlucHV0SGFuZGxlcik7XG59XG5cbi8qKlxuICogaGFuZGxlIGlucHV0IGV2ZW50c1xuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRUeXBlXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gaW5wdXRIYW5kbGVyKG1hbmFnZXIsIGV2ZW50VHlwZSwgaW5wdXQpIHtcbiAgICB2YXIgcG9pbnRlcnNMZW4gPSBpbnB1dC5wb2ludGVycy5sZW5ndGg7XG4gICAgdmFyIGNoYW5nZWRQb2ludGVyc0xlbiA9IGlucHV0LmNoYW5nZWRQb2ludGVycy5sZW5ndGg7XG4gICAgdmFyIGlzRmlyc3QgPSAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgKHBvaW50ZXJzTGVuIC0gY2hhbmdlZFBvaW50ZXJzTGVuID09PSAwKSk7XG4gICAgdmFyIGlzRmluYWwgPSAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkgJiYgKHBvaW50ZXJzTGVuIC0gY2hhbmdlZFBvaW50ZXJzTGVuID09PSAwKSk7XG5cbiAgICBpbnB1dC5pc0ZpcnN0ID0gISFpc0ZpcnN0O1xuICAgIGlucHV0LmlzRmluYWwgPSAhIWlzRmluYWw7XG5cbiAgICBpZiAoaXNGaXJzdCkge1xuICAgICAgICBtYW5hZ2VyLnNlc3Npb24gPSB7fTtcbiAgICB9XG5cbiAgICAvLyBzb3VyY2UgZXZlbnQgaXMgdGhlIG5vcm1hbGl6ZWQgdmFsdWUgb2YgdGhlIGRvbUV2ZW50c1xuICAgIC8vIGxpa2UgJ3RvdWNoc3RhcnQsIG1vdXNldXAsIHBvaW50ZXJkb3duJ1xuICAgIGlucHV0LmV2ZW50VHlwZSA9IGV2ZW50VHlwZTtcblxuICAgIC8vIGNvbXB1dGUgc2NhbGUsIHJvdGF0aW9uIGV0Y1xuICAgIGNvbXB1dGVJbnB1dERhdGEobWFuYWdlciwgaW5wdXQpO1xuXG4gICAgLy8gZW1pdCBzZWNyZXQgZXZlbnRcbiAgICBtYW5hZ2VyLmVtaXQoJ2hhbW1lci5pbnB1dCcsIGlucHV0KTtcblxuICAgIG1hbmFnZXIucmVjb2duaXplKGlucHV0KTtcbiAgICBtYW5hZ2VyLnNlc3Npb24ucHJldklucHV0ID0gaW5wdXQ7XG59XG5cbi8qKlxuICogZXh0ZW5kIHRoZSBkYXRhIHdpdGggc29tZSB1c2FibGUgcHJvcGVydGllcyBsaWtlIHNjYWxlLCByb3RhdGUsIHZlbG9jaXR5IGV0Y1xuICogQHBhcmFtIHtPYmplY3R9IG1hbmFnZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICovXG5mdW5jdGlvbiBjb21wdXRlSW5wdXREYXRhKG1hbmFnZXIsIGlucHV0KSB7XG4gICAgdmFyIHNlc3Npb24gPSBtYW5hZ2VyLnNlc3Npb247XG4gICAgdmFyIHBvaW50ZXJzID0gaW5wdXQucG9pbnRlcnM7XG4gICAgdmFyIHBvaW50ZXJzTGVuZ3RoID0gcG9pbnRlcnMubGVuZ3RoO1xuXG4gICAgLy8gc3RvcmUgdGhlIGZpcnN0IGlucHV0IHRvIGNhbGN1bGF0ZSB0aGUgZGlzdGFuY2UgYW5kIGRpcmVjdGlvblxuICAgIGlmICghc2Vzc2lvbi5maXJzdElucHV0KSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RJbnB1dCA9IHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KTtcbiAgICB9XG5cbiAgICAvLyB0byBjb21wdXRlIHNjYWxlIGFuZCByb3RhdGlvbiB3ZSBuZWVkIHRvIHN0b3JlIHRoZSBtdWx0aXBsZSB0b3VjaGVzXG4gICAgaWYgKHBvaW50ZXJzTGVuZ3RoID4gMSAmJiAhc2Vzc2lvbi5maXJzdE11bHRpcGxlKSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RNdWx0aXBsZSA9IHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KTtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXJzTGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RNdWx0aXBsZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaXJzdElucHV0ID0gc2Vzc2lvbi5maXJzdElucHV0O1xuICAgIHZhciBmaXJzdE11bHRpcGxlID0gc2Vzc2lvbi5maXJzdE11bHRpcGxlO1xuICAgIHZhciBvZmZzZXRDZW50ZXIgPSBmaXJzdE11bHRpcGxlID8gZmlyc3RNdWx0aXBsZS5jZW50ZXIgOiBmaXJzdElucHV0LmNlbnRlcjtcblxuICAgIHZhciBjZW50ZXIgPSBpbnB1dC5jZW50ZXIgPSBnZXRDZW50ZXIocG9pbnRlcnMpO1xuICAgIGlucHV0LnRpbWVTdGFtcCA9IG5vdygpO1xuICAgIGlucHV0LmRlbHRhVGltZSA9IGlucHV0LnRpbWVTdGFtcCAtIGZpcnN0SW5wdXQudGltZVN0YW1wO1xuXG4gICAgaW5wdXQuYW5nbGUgPSBnZXRBbmdsZShvZmZzZXRDZW50ZXIsIGNlbnRlcik7XG4gICAgaW5wdXQuZGlzdGFuY2UgPSBnZXREaXN0YW5jZShvZmZzZXRDZW50ZXIsIGNlbnRlcik7XG5cbiAgICBjb21wdXRlRGVsdGFYWShzZXNzaW9uLCBpbnB1dCk7XG4gICAgaW5wdXQub2Zmc2V0RGlyZWN0aW9uID0gZ2V0RGlyZWN0aW9uKGlucHV0LmRlbHRhWCwgaW5wdXQuZGVsdGFZKTtcblxuICAgIHZhciBvdmVyYWxsVmVsb2NpdHkgPSBnZXRWZWxvY2l0eShpbnB1dC5kZWx0YVRpbWUsIGlucHV0LmRlbHRhWCwgaW5wdXQuZGVsdGFZKTtcbiAgICBpbnB1dC5vdmVyYWxsVmVsb2NpdHlYID0gb3ZlcmFsbFZlbG9jaXR5Lng7XG4gICAgaW5wdXQub3ZlcmFsbFZlbG9jaXR5WSA9IG92ZXJhbGxWZWxvY2l0eS55O1xuICAgIGlucHV0Lm92ZXJhbGxWZWxvY2l0eSA9IChhYnMob3ZlcmFsbFZlbG9jaXR5LngpID4gYWJzKG92ZXJhbGxWZWxvY2l0eS55KSkgPyBvdmVyYWxsVmVsb2NpdHkueCA6IG92ZXJhbGxWZWxvY2l0eS55O1xuXG4gICAgaW5wdXQuc2NhbGUgPSBmaXJzdE11bHRpcGxlID8gZ2V0U2NhbGUoZmlyc3RNdWx0aXBsZS5wb2ludGVycywgcG9pbnRlcnMpIDogMTtcbiAgICBpbnB1dC5yb3RhdGlvbiA9IGZpcnN0TXVsdGlwbGUgPyBnZXRSb3RhdGlvbihmaXJzdE11bHRpcGxlLnBvaW50ZXJzLCBwb2ludGVycykgOiAwO1xuXG4gICAgaW5wdXQubWF4UG9pbnRlcnMgPSAhc2Vzc2lvbi5wcmV2SW5wdXQgPyBpbnB1dC5wb2ludGVycy5sZW5ndGggOiAoKGlucHV0LnBvaW50ZXJzLmxlbmd0aCA+XG4gICAgICAgIHNlc3Npb24ucHJldklucHV0Lm1heFBvaW50ZXJzKSA/IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA6IHNlc3Npb24ucHJldklucHV0Lm1heFBvaW50ZXJzKTtcblxuICAgIGNvbXB1dGVJbnRlcnZhbElucHV0RGF0YShzZXNzaW9uLCBpbnB1dCk7XG5cbiAgICAvLyBmaW5kIHRoZSBjb3JyZWN0IHRhcmdldFxuICAgIHZhciB0YXJnZXQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgaWYgKGhhc1BhcmVudChpbnB1dC5zcmNFdmVudC50YXJnZXQsIHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0ID0gaW5wdXQuc3JjRXZlbnQudGFyZ2V0O1xuICAgIH1cbiAgICBpbnB1dC50YXJnZXQgPSB0YXJnZXQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVEZWx0YVhZKHNlc3Npb24sIGlucHV0KSB7XG4gICAgdmFyIGNlbnRlciA9IGlucHV0LmNlbnRlcjtcbiAgICB2YXIgb2Zmc2V0ID0gc2Vzc2lvbi5vZmZzZXREZWx0YSB8fCB7fTtcbiAgICB2YXIgcHJldkRlbHRhID0gc2Vzc2lvbi5wcmV2RGVsdGEgfHwge307XG4gICAgdmFyIHByZXZJbnB1dCA9IHNlc3Npb24ucHJldklucHV0IHx8IHt9O1xuXG4gICAgaWYgKGlucHV0LmV2ZW50VHlwZSA9PT0gSU5QVVRfU1RBUlQgfHwgcHJldklucHV0LmV2ZW50VHlwZSA9PT0gSU5QVVRfRU5EKSB7XG4gICAgICAgIHByZXZEZWx0YSA9IHNlc3Npb24ucHJldkRlbHRhID0ge1xuICAgICAgICAgICAgeDogcHJldklucHV0LmRlbHRhWCB8fCAwLFxuICAgICAgICAgICAgeTogcHJldklucHV0LmRlbHRhWSB8fCAwXG4gICAgICAgIH07XG5cbiAgICAgICAgb2Zmc2V0ID0gc2Vzc2lvbi5vZmZzZXREZWx0YSA9IHtcbiAgICAgICAgICAgIHg6IGNlbnRlci54LFxuICAgICAgICAgICAgeTogY2VudGVyLnlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpbnB1dC5kZWx0YVggPSBwcmV2RGVsdGEueCArIChjZW50ZXIueCAtIG9mZnNldC54KTtcbiAgICBpbnB1dC5kZWx0YVkgPSBwcmV2RGVsdGEueSArIChjZW50ZXIueSAtIG9mZnNldC55KTtcbn1cblxuLyoqXG4gKiB2ZWxvY2l0eSBpcyBjYWxjdWxhdGVkIGV2ZXJ5IHggbXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBzZXNzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUludGVydmFsSW5wdXREYXRhKHNlc3Npb24sIGlucHV0KSB7XG4gICAgdmFyIGxhc3QgPSBzZXNzaW9uLmxhc3RJbnRlcnZhbCB8fCBpbnB1dCxcbiAgICAgICAgZGVsdGFUaW1lID0gaW5wdXQudGltZVN0YW1wIC0gbGFzdC50aW1lU3RhbXAsXG4gICAgICAgIHZlbG9jaXR5LCB2ZWxvY2l0eVgsIHZlbG9jaXR5WSwgZGlyZWN0aW9uO1xuXG4gICAgaWYgKGlucHV0LmV2ZW50VHlwZSAhPSBJTlBVVF9DQU5DRUwgJiYgKGRlbHRhVGltZSA+IENPTVBVVEVfSU5URVJWQUwgfHwgbGFzdC52ZWxvY2l0eSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICB2YXIgZGVsdGFYID0gaW5wdXQuZGVsdGFYIC0gbGFzdC5kZWx0YVg7XG4gICAgICAgIHZhciBkZWx0YVkgPSBpbnB1dC5kZWx0YVkgLSBsYXN0LmRlbHRhWTtcblxuICAgICAgICB2YXIgdiA9IGdldFZlbG9jaXR5KGRlbHRhVGltZSwgZGVsdGFYLCBkZWx0YVkpO1xuICAgICAgICB2ZWxvY2l0eVggPSB2Lng7XG4gICAgICAgIHZlbG9jaXR5WSA9IHYueTtcbiAgICAgICAgdmVsb2NpdHkgPSAoYWJzKHYueCkgPiBhYnModi55KSkgPyB2LnggOiB2Lnk7XG4gICAgICAgIGRpcmVjdGlvbiA9IGdldERpcmVjdGlvbihkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICAgICAgc2Vzc2lvbi5sYXN0SW50ZXJ2YWwgPSBpbnB1dDtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1c2UgbGF0ZXN0IHZlbG9jaXR5IGluZm8gaWYgaXQgZG9lc24ndCBvdmVydGFrZSBhIG1pbmltdW0gcGVyaW9kXG4gICAgICAgIHZlbG9jaXR5ID0gbGFzdC52ZWxvY2l0eTtcbiAgICAgICAgdmVsb2NpdHlYID0gbGFzdC52ZWxvY2l0eVg7XG4gICAgICAgIHZlbG9jaXR5WSA9IGxhc3QudmVsb2NpdHlZO1xuICAgICAgICBkaXJlY3Rpb24gPSBsYXN0LmRpcmVjdGlvbjtcbiAgICB9XG5cbiAgICBpbnB1dC52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgIGlucHV0LnZlbG9jaXR5WCA9IHZlbG9jaXR5WDtcbiAgICBpbnB1dC52ZWxvY2l0eVkgPSB2ZWxvY2l0eVk7XG4gICAgaW5wdXQuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xufVxuXG4vKipcbiAqIGNyZWF0ZSBhIHNpbXBsZSBjbG9uZSBmcm9tIHRoZSBpbnB1dCB1c2VkIGZvciBzdG9yYWdlIG9mIGZpcnN0SW5wdXQgYW5kIGZpcnN0TXVsdGlwbGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICogQHJldHVybnMge09iamVjdH0gY2xvbmVkSW5wdXREYXRhXG4gKi9cbmZ1bmN0aW9uIHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KSB7XG4gICAgLy8gbWFrZSBhIHNpbXBsZSBjb3B5IG9mIHRoZSBwb2ludGVycyBiZWNhdXNlIHdlIHdpbGwgZ2V0IGEgcmVmZXJlbmNlIGlmIHdlIGRvbid0XG4gICAgLy8gd2Ugb25seSBuZWVkIGNsaWVudFhZIGZvciB0aGUgY2FsY3VsYXRpb25zXG4gICAgdmFyIHBvaW50ZXJzID0gW107XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgaW5wdXQucG9pbnRlcnMubGVuZ3RoKSB7XG4gICAgICAgIHBvaW50ZXJzW2ldID0ge1xuICAgICAgICAgICAgY2xpZW50WDogcm91bmQoaW5wdXQucG9pbnRlcnNbaV0uY2xpZW50WCksXG4gICAgICAgICAgICBjbGllbnRZOiByb3VuZChpbnB1dC5wb2ludGVyc1tpXS5jbGllbnRZKVxuICAgICAgICB9O1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGltZVN0YW1wOiBub3coKSxcbiAgICAgICAgcG9pbnRlcnM6IHBvaW50ZXJzLFxuICAgICAgICBjZW50ZXI6IGdldENlbnRlcihwb2ludGVycyksXG4gICAgICAgIGRlbHRhWDogaW5wdXQuZGVsdGFYLFxuICAgICAgICBkZWx0YVk6IGlucHV0LmRlbHRhWVxuICAgIH07XG59XG5cbi8qKlxuICogZ2V0IHRoZSBjZW50ZXIgb2YgYWxsIHRoZSBwb2ludGVyc1xuICogQHBhcmFtIHtBcnJheX0gcG9pbnRlcnNcbiAqIEByZXR1cm4ge09iamVjdH0gY2VudGVyIGNvbnRhaW5zIGB4YCBhbmQgYHlgIHByb3BlcnRpZXNcbiAqL1xuZnVuY3Rpb24gZ2V0Q2VudGVyKHBvaW50ZXJzKSB7XG4gICAgdmFyIHBvaW50ZXJzTGVuZ3RoID0gcG9pbnRlcnMubGVuZ3RoO1xuXG4gICAgLy8gbm8gbmVlZCB0byBsb29wIHdoZW4gb25seSBvbmUgdG91Y2hcbiAgICBpZiAocG9pbnRlcnNMZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHJvdW5kKHBvaW50ZXJzWzBdLmNsaWVudFgpLFxuICAgICAgICAgICAgeTogcm91bmQocG9pbnRlcnNbMF0uY2xpZW50WSlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgeCA9IDAsIHkgPSAwLCBpID0gMDtcbiAgICB3aGlsZSAoaSA8IHBvaW50ZXJzTGVuZ3RoKSB7XG4gICAgICAgIHggKz0gcG9pbnRlcnNbaV0uY2xpZW50WDtcbiAgICAgICAgeSArPSBwb2ludGVyc1tpXS5jbGllbnRZO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogcm91bmQoeCAvIHBvaW50ZXJzTGVuZ3RoKSxcbiAgICAgICAgeTogcm91bmQoeSAvIHBvaW50ZXJzTGVuZ3RoKVxuICAgIH07XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSB2ZWxvY2l0eSBiZXR3ZWVuIHR3byBwb2ludHMuIHVuaXQgaXMgaW4gcHggcGVyIG1zLlxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhVGltZVxuICogQHBhcmFtIHtOdW1iZXJ9IHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB5XG4gKiBAcmV0dXJuIHtPYmplY3R9IHZlbG9jaXR5IGB4YCBhbmQgYHlgXG4gKi9cbmZ1bmN0aW9uIGdldFZlbG9jaXR5KGRlbHRhVGltZSwgeCwgeSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHggLyBkZWx0YVRpbWUgfHwgMCxcbiAgICAgICAgeTogeSAvIGRlbHRhVGltZSB8fCAwXG4gICAgfTtcbn1cblxuLyoqXG4gKiBnZXQgdGhlIGRpcmVjdGlvbiBiZXR3ZWVuIHR3byBwb2ludHNcbiAqIEBwYXJhbSB7TnVtYmVyfSB4XG4gKiBAcGFyYW0ge051bWJlcn0geVxuICogQHJldHVybiB7TnVtYmVyfSBkaXJlY3Rpb25cbiAqL1xuZnVuY3Rpb24gZ2V0RGlyZWN0aW9uKHgsIHkpIHtcbiAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICByZXR1cm4gRElSRUNUSU9OX05PTkU7XG4gICAgfVxuXG4gICAgaWYgKGFicyh4KSA+PSBhYnMoeSkpIHtcbiAgICAgICAgcmV0dXJuIHggPCAwID8gRElSRUNUSU9OX0xFRlQgOiBESVJFQ1RJT05fUklHSFQ7XG4gICAgfVxuICAgIHJldHVybiB5IDwgMCA/IERJUkVDVElPTl9VUCA6IERJUkVDVElPTl9ET1dOO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgYWJzb2x1dGUgZGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gcDEge3gsIHl9XG4gKiBAcGFyYW0ge09iamVjdH0gcDIge3gsIHl9XG4gKiBAcGFyYW0ge0FycmF5fSBbcHJvcHNdIGNvbnRhaW5pbmcgeCBhbmQgeSBrZXlzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGRpc3RhbmNlXG4gKi9cbmZ1bmN0aW9uIGdldERpc3RhbmNlKHAxLCBwMiwgcHJvcHMpIHtcbiAgICBpZiAoIXByb3BzKSB7XG4gICAgICAgIHByb3BzID0gUFJPUFNfWFk7XG4gICAgfVxuICAgIHZhciB4ID0gcDJbcHJvcHNbMF1dIC0gcDFbcHJvcHNbMF1dLFxuICAgICAgICB5ID0gcDJbcHJvcHNbMV1dIC0gcDFbcHJvcHNbMV1dO1xuXG4gICAgcmV0dXJuIE1hdGguc3FydCgoeCAqIHgpICsgKHkgKiB5KSk7XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byBjb29yZGluYXRlc1xuICogQHBhcmFtIHtPYmplY3R9IHAxXG4gKiBAcGFyYW0ge09iamVjdH0gcDJcbiAqIEBwYXJhbSB7QXJyYXl9IFtwcm9wc10gY29udGFpbmluZyB4IGFuZCB5IGtleXNcbiAqIEByZXR1cm4ge051bWJlcn0gYW5nbGVcbiAqL1xuZnVuY3Rpb24gZ2V0QW5nbGUocDEsIHAyLCBwcm9wcykge1xuICAgIGlmICghcHJvcHMpIHtcbiAgICAgICAgcHJvcHMgPSBQUk9QU19YWTtcbiAgICB9XG4gICAgdmFyIHggPSBwMltwcm9wc1swXV0gLSBwMVtwcm9wc1swXV0sXG4gICAgICAgIHkgPSBwMltwcm9wc1sxXV0gLSBwMVtwcm9wc1sxXV07XG4gICAgcmV0dXJuIE1hdGguYXRhbjIoeSwgeCkgKiAxODAgLyBNYXRoLlBJO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgcm90YXRpb24gZGVncmVlcyBiZXR3ZWVuIHR3byBwb2ludGVyc2V0c1xuICogQHBhcmFtIHtBcnJheX0gc3RhcnQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IGVuZCBhcnJheSBvZiBwb2ludGVyc1xuICogQHJldHVybiB7TnVtYmVyfSByb3RhdGlvblxuICovXG5mdW5jdGlvbiBnZXRSb3RhdGlvbihzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuIGdldEFuZ2xlKGVuZFsxXSwgZW5kWzBdLCBQUk9QU19DTElFTlRfWFkpICsgZ2V0QW5nbGUoc3RhcnRbMV0sIHN0YXJ0WzBdLCBQUk9QU19DTElFTlRfWFkpO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgc2NhbGUgZmFjdG9yIGJldHdlZW4gdHdvIHBvaW50ZXJzZXRzXG4gKiBubyBzY2FsZSBpcyAxLCBhbmQgZ29lcyBkb3duIHRvIDAgd2hlbiBwaW5jaGVkIHRvZ2V0aGVyLCBhbmQgYmlnZ2VyIHdoZW4gcGluY2hlZCBvdXRcbiAqIEBwYXJhbSB7QXJyYXl9IHN0YXJ0IGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBlbmQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEByZXR1cm4ge051bWJlcn0gc2NhbGVcbiAqL1xuZnVuY3Rpb24gZ2V0U2NhbGUoc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiBnZXREaXN0YW5jZShlbmRbMF0sIGVuZFsxXSwgUFJPUFNfQ0xJRU5UX1hZKSAvIGdldERpc3RhbmNlKHN0YXJ0WzBdLCBzdGFydFsxXSwgUFJPUFNfQ0xJRU5UX1hZKTtcbn1cblxudmFyIE1PVVNFX0lOUFVUX01BUCA9IHtcbiAgICBtb3VzZWRvd246IElOUFVUX1NUQVJULFxuICAgIG1vdXNlbW92ZTogSU5QVVRfTU9WRSxcbiAgICBtb3VzZXVwOiBJTlBVVF9FTkRcbn07XG5cbnZhciBNT1VTRV9FTEVNRU5UX0VWRU5UUyA9ICdtb3VzZWRvd24nO1xudmFyIE1PVVNFX1dJTkRPV19FVkVOVFMgPSAnbW91c2Vtb3ZlIG1vdXNldXAnO1xuXG4vKipcbiAqIE1vdXNlIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBNb3VzZUlucHV0KCkge1xuICAgIHRoaXMuZXZFbCA9IE1PVVNFX0VMRU1FTlRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBNT1VTRV9XSU5ET1dfRVZFTlRTO1xuXG4gICAgdGhpcy5hbGxvdyA9IHRydWU7IC8vIHVzZWQgYnkgSW5wdXQuVG91Y2hNb3VzZSB0byBkaXNhYmxlIG1vdXNlIGV2ZW50c1xuICAgIHRoaXMucHJlc3NlZCA9IGZhbHNlOyAvLyBtb3VzZWRvd24gc3RhdGVcblxuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoTW91c2VJbnB1dCwgSW5wdXQsIHtcbiAgICAvKipcbiAgICAgKiBoYW5kbGUgbW91c2UgZXZlbnRzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gTUVoYW5kbGVyKGV2KSB7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBNT1VTRV9JTlBVVF9NQVBbZXYudHlwZV07XG5cbiAgICAgICAgLy8gb24gc3RhcnQgd2Ugd2FudCB0byBoYXZlIHRoZSBsZWZ0IG1vdXNlIGJ1dHRvbiBkb3duXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9TVEFSVCAmJiBldi5idXR0b24gPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfTU9WRSAmJiBldi53aGljaCAhPT0gMSkge1xuICAgICAgICAgICAgZXZlbnRUeXBlID0gSU5QVVRfRU5EO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbW91c2UgbXVzdCBiZSBkb3duLCBhbmQgbW91c2UgZXZlbnRzIGFyZSBhbGxvd2VkIChzZWUgdGhlIFRvdWNoTW91c2UgaW5wdXQpXG4gICAgICAgIGlmICghdGhpcy5wcmVzc2VkIHx8ICF0aGlzLmFsbG93KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfRU5EKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5tYW5hZ2VyLCBldmVudFR5cGUsIHtcbiAgICAgICAgICAgIHBvaW50ZXJzOiBbZXZdLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiBbZXZdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IElOUFVUX1RZUEVfTU9VU0UsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbnZhciBQT0lOVEVSX0lOUFVUX01BUCA9IHtcbiAgICBwb2ludGVyZG93bjogSU5QVVRfU1RBUlQsXG4gICAgcG9pbnRlcm1vdmU6IElOUFVUX01PVkUsXG4gICAgcG9pbnRlcnVwOiBJTlBVVF9FTkQsXG4gICAgcG9pbnRlcmNhbmNlbDogSU5QVVRfQ0FOQ0VMLFxuICAgIHBvaW50ZXJvdXQ6IElOUFVUX0NBTkNFTFxufTtcblxuLy8gaW4gSUUxMCB0aGUgcG9pbnRlciB0eXBlcyBpcyBkZWZpbmVkIGFzIGFuIGVudW1cbnZhciBJRTEwX1BPSU5URVJfVFlQRV9FTlVNID0ge1xuICAgIDI6IElOUFVUX1RZUEVfVE9VQ0gsXG4gICAgMzogSU5QVVRfVFlQRV9QRU4sXG4gICAgNDogSU5QVVRfVFlQRV9NT1VTRSxcbiAgICA1OiBJTlBVVF9UWVBFX0tJTkVDVCAvLyBzZWUgaHR0cHM6Ly90d2l0dGVyLmNvbS9qYWNvYnJvc3NpL3N0YXR1cy80ODA1OTY0Mzg0ODk4OTA4MTZcbn07XG5cbnZhciBQT0lOVEVSX0VMRU1FTlRfRVZFTlRTID0gJ3BvaW50ZXJkb3duJztcbnZhciBQT0lOVEVSX1dJTkRPV19FVkVOVFMgPSAncG9pbnRlcm1vdmUgcG9pbnRlcnVwIHBvaW50ZXJjYW5jZWwnO1xuXG4vLyBJRTEwIGhhcyBwcmVmaXhlZCBzdXBwb3J0LCBhbmQgY2FzZS1zZW5zaXRpdmVcbmlmICh3aW5kb3cuTVNQb2ludGVyRXZlbnQgJiYgIXdpbmRvdy5Qb2ludGVyRXZlbnQpIHtcbiAgICBQT0lOVEVSX0VMRU1FTlRfRVZFTlRTID0gJ01TUG9pbnRlckRvd24nO1xuICAgIFBPSU5URVJfV0lORE9XX0VWRU5UUyA9ICdNU1BvaW50ZXJNb3ZlIE1TUG9pbnRlclVwIE1TUG9pbnRlckNhbmNlbCc7XG59XG5cbi8qKlxuICogUG9pbnRlciBldmVudHMgaW5wdXRcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gUG9pbnRlckV2ZW50SW5wdXQoKSB7XG4gICAgdGhpcy5ldkVsID0gUE9JTlRFUl9FTEVNRU5UX0VWRU5UUztcbiAgICB0aGlzLmV2V2luID0gUE9JTlRFUl9XSU5ET1dfRVZFTlRTO1xuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuc3RvcmUgPSAodGhpcy5tYW5hZ2VyLnNlc3Npb24ucG9pbnRlckV2ZW50cyA9IFtdKTtcbn1cblxuaW5oZXJpdChQb2ludGVyRXZlbnRJbnB1dCwgSW5wdXQsIHtcbiAgICAvKipcbiAgICAgKiBoYW5kbGUgbW91c2UgZXZlbnRzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gUEVoYW5kbGVyKGV2KSB7XG4gICAgICAgIHZhciBzdG9yZSA9IHRoaXMuc3RvcmU7XG4gICAgICAgIHZhciByZW1vdmVQb2ludGVyID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGV2ZW50VHlwZU5vcm1hbGl6ZWQgPSBldi50eXBlLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnbXMnLCAnJyk7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBQT0lOVEVSX0lOUFVUX01BUFtldmVudFR5cGVOb3JtYWxpemVkXTtcbiAgICAgICAgdmFyIHBvaW50ZXJUeXBlID0gSUUxMF9QT0lOVEVSX1RZUEVfRU5VTVtldi5wb2ludGVyVHlwZV0gfHwgZXYucG9pbnRlclR5cGU7XG5cbiAgICAgICAgdmFyIGlzVG91Y2ggPSAocG9pbnRlclR5cGUgPT0gSU5QVVRfVFlQRV9UT1VDSCk7XG5cbiAgICAgICAgLy8gZ2V0IGluZGV4IG9mIHRoZSBldmVudCBpbiB0aGUgc3RvcmVcbiAgICAgICAgdmFyIHN0b3JlSW5kZXggPSBpbkFycmF5KHN0b3JlLCBldi5wb2ludGVySWQsICdwb2ludGVySWQnKTtcblxuICAgICAgICAvLyBzdGFydCBhbmQgbW91c2UgbXVzdCBiZSBkb3duXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9TVEFSVCAmJiAoZXYuYnV0dG9uID09PSAwIHx8IGlzVG91Y2gpKSB7XG4gICAgICAgICAgICBpZiAoc3RvcmVJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICBzdG9yZS5wdXNoKGV2KTtcbiAgICAgICAgICAgICAgICBzdG9yZUluZGV4ID0gc3RvcmUubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChldmVudFR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICAgICAgcmVtb3ZlUG9pbnRlciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpdCBub3QgZm91bmQsIHNvIHRoZSBwb2ludGVyIGhhc24ndCBiZWVuIGRvd24gKHNvIGl0J3MgcHJvYmFibHkgYSBob3ZlcilcbiAgICAgICAgaWYgKHN0b3JlSW5kZXggPCAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB1cGRhdGUgdGhlIGV2ZW50IGluIHRoZSBzdG9yZVxuICAgICAgICBzdG9yZVtzdG9yZUluZGV4XSA9IGV2O1xuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5tYW5hZ2VyLCBldmVudFR5cGUsIHtcbiAgICAgICAgICAgIHBvaW50ZXJzOiBzdG9yZSxcbiAgICAgICAgICAgIGNoYW5nZWRQb2ludGVyczogW2V2XSxcbiAgICAgICAgICAgIHBvaW50ZXJUeXBlOiBwb2ludGVyVHlwZSxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVtb3ZlUG9pbnRlcikge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIGZyb20gdGhlIHN0b3JlXG4gICAgICAgICAgICBzdG9yZS5zcGxpY2Uoc3RvcmVJbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxudmFyIFNJTkdMRV9UT1VDSF9JTlBVVF9NQVAgPSB7XG4gICAgdG91Y2hzdGFydDogSU5QVVRfU1RBUlQsXG4gICAgdG91Y2htb3ZlOiBJTlBVVF9NT1ZFLFxuICAgIHRvdWNoZW5kOiBJTlBVVF9FTkQsXG4gICAgdG91Y2hjYW5jZWw6IElOUFVUX0NBTkNFTFxufTtcblxudmFyIFNJTkdMRV9UT1VDSF9UQVJHRVRfRVZFTlRTID0gJ3RvdWNoc3RhcnQnO1xudmFyIFNJTkdMRV9UT1VDSF9XSU5ET1dfRVZFTlRTID0gJ3RvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIHRvdWNoY2FuY2VsJztcblxuLyoqXG4gKiBUb3VjaCBldmVudHMgaW5wdXRcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gU2luZ2xlVG91Y2hJbnB1dCgpIHtcbiAgICB0aGlzLmV2VGFyZ2V0ID0gU0lOR0xFX1RPVUNIX1RBUkdFVF9FVkVOVFM7XG4gICAgdGhpcy5ldldpbiA9IFNJTkdMRV9UT1VDSF9XSU5ET1dfRVZFTlRTO1xuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChTaW5nbGVUb3VjaElucHV0LCBJbnB1dCwge1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIFRFaGFuZGxlcihldikge1xuICAgICAgICB2YXIgdHlwZSA9IFNJTkdMRV9UT1VDSF9JTlBVVF9NQVBbZXYudHlwZV07XG5cbiAgICAgICAgLy8gc2hvdWxkIHdlIGhhbmRsZSB0aGUgdG91Y2ggZXZlbnRzP1xuICAgICAgICBpZiAodHlwZSA9PT0gSU5QVVRfU1RBUlQpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuc3RhcnRlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRvdWNoZXMgPSBub3JtYWxpemVTaW5nbGVUb3VjaGVzLmNhbGwodGhpcywgZXYsIHR5cGUpO1xuXG4gICAgICAgIC8vIHdoZW4gZG9uZSwgcmVzZXQgdGhlIHN0YXJ0ZWQgc3RhdGVcbiAgICAgICAgaWYgKHR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSAmJiB0b3VjaGVzWzBdLmxlbmd0aCAtIHRvdWNoZXNbMV0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5tYW5hZ2VyLCB0eXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogdG91Y2hlc1swXSxcbiAgICAgICAgICAgIGNoYW5nZWRQb2ludGVyczogdG91Y2hlc1sxXSxcbiAgICAgICAgICAgIHBvaW50ZXJUeXBlOiBJTlBVVF9UWVBFX1RPVUNILFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIEB0aGlzIHtUb3VjaElucHV0fVxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKiBAcGFyYW0ge051bWJlcn0gdHlwZSBmbGFnXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfEFycmF5fSBbYWxsLCBjaGFuZ2VkXVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTaW5nbGVUb3VjaGVzKGV2LCB0eXBlKSB7XG4gICAgdmFyIGFsbCA9IHRvQXJyYXkoZXYudG91Y2hlcyk7XG4gICAgdmFyIGNoYW5nZWQgPSB0b0FycmF5KGV2LmNoYW5nZWRUb3VjaGVzKTtcblxuICAgIGlmICh0eXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgYWxsID0gdW5pcXVlQXJyYXkoYWxsLmNvbmNhdChjaGFuZ2VkKSwgJ2lkZW50aWZpZXInLCB0cnVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW2FsbCwgY2hhbmdlZF07XG59XG5cbnZhciBUT1VDSF9JTlBVVF9NQVAgPSB7XG4gICAgdG91Y2hzdGFydDogSU5QVVRfU1RBUlQsXG4gICAgdG91Y2htb3ZlOiBJTlBVVF9NT1ZFLFxuICAgIHRvdWNoZW5kOiBJTlBVVF9FTkQsXG4gICAgdG91Y2hjYW5jZWw6IElOUFVUX0NBTkNFTFxufTtcblxudmFyIFRPVUNIX1RBUkdFVF9FVkVOVFMgPSAndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnO1xuXG4vKipcbiAqIE11bHRpLXVzZXIgdG91Y2ggZXZlbnRzIGlucHV0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIFRvdWNoSW5wdXQoKSB7XG4gICAgdGhpcy5ldlRhcmdldCA9IFRPVUNIX1RBUkdFVF9FVkVOVFM7XG4gICAgdGhpcy50YXJnZXRJZHMgPSB7fTtcblxuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoVG91Y2hJbnB1dCwgSW5wdXQsIHtcbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBNVEVoYW5kbGVyKGV2KSB7XG4gICAgICAgIHZhciB0eXBlID0gVE9VQ0hfSU5QVVRfTUFQW2V2LnR5cGVdO1xuICAgICAgICB2YXIgdG91Y2hlcyA9IGdldFRvdWNoZXMuY2FsbCh0aGlzLCBldiwgdHlwZSk7XG4gICAgICAgIGlmICghdG91Y2hlcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIHR5cGUsIHtcbiAgICAgICAgICAgIHBvaW50ZXJzOiB0b3VjaGVzWzBdLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiB0b3VjaGVzWzFdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IElOUFVUX1RZUEVfVE9VQ0gsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogQHRoaXMge1RvdWNoSW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqIEBwYXJhbSB7TnVtYmVyfSB0eXBlIGZsYWdcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8QXJyYXl9IFthbGwsIGNoYW5nZWRdXG4gKi9cbmZ1bmN0aW9uIGdldFRvdWNoZXMoZXYsIHR5cGUpIHtcbiAgICB2YXIgYWxsVG91Y2hlcyA9IHRvQXJyYXkoZXYudG91Y2hlcyk7XG4gICAgdmFyIHRhcmdldElkcyA9IHRoaXMudGFyZ2V0SWRzO1xuXG4gICAgLy8gd2hlbiB0aGVyZSBpcyBvbmx5IG9uZSB0b3VjaCwgdGhlIHByb2Nlc3MgY2FuIGJlIHNpbXBsaWZpZWRcbiAgICBpZiAodHlwZSAmIChJTlBVVF9TVEFSVCB8IElOUFVUX01PVkUpICYmIGFsbFRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHRhcmdldElkc1thbGxUb3VjaGVzWzBdLmlkZW50aWZpZXJdID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIFthbGxUb3VjaGVzLCBhbGxUb3VjaGVzXTtcbiAgICB9XG5cbiAgICB2YXIgaSxcbiAgICAgICAgdGFyZ2V0VG91Y2hlcyxcbiAgICAgICAgY2hhbmdlZFRvdWNoZXMgPSB0b0FycmF5KGV2LmNoYW5nZWRUb3VjaGVzKSxcbiAgICAgICAgY2hhbmdlZFRhcmdldFRvdWNoZXMgPSBbXSxcbiAgICAgICAgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG5cbiAgICAvLyBnZXQgdGFyZ2V0IHRvdWNoZXMgZnJvbSB0b3VjaGVzXG4gICAgdGFyZ2V0VG91Y2hlcyA9IGFsbFRvdWNoZXMuZmlsdGVyKGZ1bmN0aW9uKHRvdWNoKSB7XG4gICAgICAgIHJldHVybiBoYXNQYXJlbnQodG91Y2gudGFyZ2V0LCB0YXJnZXQpO1xuICAgIH0pO1xuXG4gICAgLy8gY29sbGVjdCB0b3VjaGVzXG4gICAgaWYgKHR5cGUgPT09IElOUFVUX1NUQVJUKSB7XG4gICAgICAgIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRhcmdldFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0YXJnZXRJZHNbdGFyZ2V0VG91Y2hlc1tpXS5pZGVudGlmaWVyXSA9IHRydWU7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBmaWx0ZXIgY2hhbmdlZCB0b3VjaGVzIHRvIG9ubHkgY29udGFpbiB0b3VjaGVzIHRoYXQgZXhpc3QgaW4gdGhlIGNvbGxlY3RlZCB0YXJnZXQgaWRzXG4gICAgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBjaGFuZ2VkVG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHRhcmdldElkc1tjaGFuZ2VkVG91Y2hlc1tpXS5pZGVudGlmaWVyXSkge1xuICAgICAgICAgICAgY2hhbmdlZFRhcmdldFRvdWNoZXMucHVzaChjaGFuZ2VkVG91Y2hlc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjbGVhbnVwIHJlbW92ZWQgdG91Y2hlc1xuICAgICAgICBpZiAodHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgICAgICBkZWxldGUgdGFyZ2V0SWRzW2NoYW5nZWRUb3VjaGVzW2ldLmlkZW50aWZpZXJdO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICBpZiAoIWNoYW5nZWRUYXJnZXRUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgICAgLy8gbWVyZ2UgdGFyZ2V0VG91Y2hlcyB3aXRoIGNoYW5nZWRUYXJnZXRUb3VjaGVzIHNvIGl0IGNvbnRhaW5zIEFMTCB0b3VjaGVzLCBpbmNsdWRpbmcgJ2VuZCcgYW5kICdjYW5jZWwnXG4gICAgICAgIHVuaXF1ZUFycmF5KHRhcmdldFRvdWNoZXMuY29uY2F0KGNoYW5nZWRUYXJnZXRUb3VjaGVzKSwgJ2lkZW50aWZpZXInLCB0cnVlKSxcbiAgICAgICAgY2hhbmdlZFRhcmdldFRvdWNoZXNcbiAgICBdO1xufVxuXG4vKipcbiAqIENvbWJpbmVkIHRvdWNoIGFuZCBtb3VzZSBpbnB1dFxuICpcbiAqIFRvdWNoIGhhcyBhIGhpZ2hlciBwcmlvcml0eSB0aGVuIG1vdXNlLCBhbmQgd2hpbGUgdG91Y2hpbmcgbm8gbW91c2UgZXZlbnRzIGFyZSBhbGxvd2VkLlxuICogVGhpcyBiZWNhdXNlIHRvdWNoIGRldmljZXMgYWxzbyBlbWl0IG1vdXNlIGV2ZW50cyB3aGlsZSBkb2luZyBhIHRvdWNoLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gVG91Y2hNb3VzZUlucHV0KCkge1xuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB2YXIgaGFuZGxlciA9IGJpbmRGbih0aGlzLmhhbmRsZXIsIHRoaXMpO1xuICAgIHRoaXMudG91Y2ggPSBuZXcgVG91Y2hJbnB1dCh0aGlzLm1hbmFnZXIsIGhhbmRsZXIpO1xuICAgIHRoaXMubW91c2UgPSBuZXcgTW91c2VJbnB1dCh0aGlzLm1hbmFnZXIsIGhhbmRsZXIpO1xufVxuXG5pbmhlcml0KFRvdWNoTW91c2VJbnB1dCwgSW5wdXQsIHtcbiAgICAvKipcbiAgICAgKiBoYW5kbGUgbW91c2UgYW5kIHRvdWNoIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7SGFtbWVyfSBtYW5hZ2VyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlucHV0RXZlbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXREYXRhXG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gVE1FaGFuZGxlcihtYW5hZ2VyLCBpbnB1dEV2ZW50LCBpbnB1dERhdGEpIHtcbiAgICAgICAgdmFyIGlzVG91Y2ggPSAoaW5wdXREYXRhLnBvaW50ZXJUeXBlID09IElOUFVUX1RZUEVfVE9VQ0gpLFxuICAgICAgICAgICAgaXNNb3VzZSA9IChpbnB1dERhdGEucG9pbnRlclR5cGUgPT0gSU5QVVRfVFlQRV9NT1VTRSk7XG5cbiAgICAgICAgLy8gd2hlbiB3ZSdyZSBpbiBhIHRvdWNoIGV2ZW50LCBzbyAgYmxvY2sgYWxsIHVwY29taW5nIG1vdXNlIGV2ZW50c1xuICAgICAgICAvLyBtb3N0IG1vYmlsZSBicm93c2VyIGFsc28gZW1pdCBtb3VzZWV2ZW50cywgcmlnaHQgYWZ0ZXIgdG91Y2hzdGFydFxuICAgICAgICBpZiAoaXNUb3VjaCkge1xuICAgICAgICAgICAgdGhpcy5tb3VzZS5hbGxvdyA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTW91c2UgJiYgIXRoaXMubW91c2UuYWxsb3cpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlc2V0IHRoZSBhbGxvd01vdXNlIHdoZW4gd2UncmUgZG9uZVxuICAgICAgICBpZiAoaW5wdXRFdmVudCAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlLmFsbG93ID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sobWFuYWdlciwgaW5wdXRFdmVudCwgaW5wdXREYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmVtb3ZlIHRoZSBldmVudCBsaXN0ZW5lcnNcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgICAgICB0aGlzLnRvdWNoLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5tb3VzZS5kZXN0cm95KCk7XG4gICAgfVxufSk7XG5cbnZhciBQUkVGSVhFRF9UT1VDSF9BQ1RJT04gPSBwcmVmaXhlZChURVNUX0VMRU1FTlQuc3R5bGUsICd0b3VjaEFjdGlvbicpO1xudmFyIE5BVElWRV9UT1VDSF9BQ1RJT04gPSBQUkVGSVhFRF9UT1VDSF9BQ1RJT04gIT09IHVuZGVmaW5lZDtcblxuLy8gbWFnaWNhbCB0b3VjaEFjdGlvbiB2YWx1ZVxudmFyIFRPVUNIX0FDVElPTl9DT01QVVRFID0gJ2NvbXB1dGUnO1xudmFyIFRPVUNIX0FDVElPTl9BVVRPID0gJ2F1dG8nO1xudmFyIFRPVUNIX0FDVElPTl9NQU5JUFVMQVRJT04gPSAnbWFuaXB1bGF0aW9uJzsgLy8gbm90IGltcGxlbWVudGVkXG52YXIgVE9VQ0hfQUNUSU9OX05PTkUgPSAnbm9uZSc7XG52YXIgVE9VQ0hfQUNUSU9OX1BBTl9YID0gJ3Bhbi14JztcbnZhciBUT1VDSF9BQ1RJT05fUEFOX1kgPSAncGFuLXknO1xuXG4vKipcbiAqIFRvdWNoIEFjdGlvblxuICogc2V0cyB0aGUgdG91Y2hBY3Rpb24gcHJvcGVydHkgb3IgdXNlcyB0aGUganMgYWx0ZXJuYXRpdmVcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVG91Y2hBY3Rpb24obWFuYWdlciwgdmFsdWUpIHtcbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuc2V0KHZhbHVlKTtcbn1cblxuVG91Y2hBY3Rpb24ucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNldCB0aGUgdG91Y2hBY3Rpb24gdmFsdWUgb24gdGhlIGVsZW1lbnQgb3IgZW5hYmxlIHRoZSBwb2x5ZmlsbFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgLy8gZmluZCBvdXQgdGhlIHRvdWNoLWFjdGlvbiBieSB0aGUgZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgaWYgKHZhbHVlID09IFRPVUNIX0FDVElPTl9DT01QVVRFKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMuY29tcHV0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE5BVElWRV9UT1VDSF9BQ1RJT04gJiYgdGhpcy5tYW5hZ2VyLmVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbGVtZW50LnN0eWxlW1BSRUZJWEVEX1RPVUNIX0FDVElPTl0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFjdGlvbnMgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICoganVzdCByZS1zZXQgdGhlIHRvdWNoQWN0aW9uIHZhbHVlXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXQodGhpcy5tYW5hZ2VyLm9wdGlvbnMudG91Y2hBY3Rpb24pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjb21wdXRlIHRoZSB2YWx1ZSBmb3IgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5IGJhc2VkIG9uIHRoZSByZWNvZ25pemVyJ3Mgc2V0dGluZ3NcbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIGNvbXB1dGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYWN0aW9ucyA9IFtdO1xuICAgICAgICBlYWNoKHRoaXMubWFuYWdlci5yZWNvZ25pemVycywgZnVuY3Rpb24ocmVjb2duaXplcikge1xuICAgICAgICAgICAgaWYgKGJvb2xPckZuKHJlY29nbml6ZXIub3B0aW9ucy5lbmFibGUsIFtyZWNvZ25pemVyXSkpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zID0gYWN0aW9ucy5jb25jYXQocmVjb2duaXplci5nZXRUb3VjaEFjdGlvbigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjbGVhblRvdWNoQWN0aW9ucyhhY3Rpb25zLmpvaW4oJyAnKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHRoaXMgbWV0aG9kIGlzIGNhbGxlZCBvbiBlYWNoIGlucHV0IGN5Y2xlIGFuZCBwcm92aWRlcyB0aGUgcHJldmVudGluZyBvZiB0aGUgYnJvd3NlciBiZWhhdmlvclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqL1xuICAgIHByZXZlbnREZWZhdWx0czogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgLy8gbm90IG5lZWRlZCB3aXRoIG5hdGl2ZSBzdXBwb3J0IGZvciB0aGUgdG91Y2hBY3Rpb24gcHJvcGVydHlcbiAgICAgICAgaWYgKE5BVElWRV9UT1VDSF9BQ1RJT04pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzcmNFdmVudCA9IGlucHV0LnNyY0V2ZW50O1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gaW5wdXQub2Zmc2V0RGlyZWN0aW9uO1xuXG4gICAgICAgIC8vIGlmIHRoZSB0b3VjaCBhY3Rpb24gZGlkIHByZXZlbnRlZCBvbmNlIHRoaXMgc2Vzc2lvblxuICAgICAgICBpZiAodGhpcy5tYW5hZ2VyLnNlc3Npb24ucHJldmVudGVkKSB7XG4gICAgICAgICAgICBzcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XG4gICAgICAgIHZhciBoYXNOb25lID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX05PTkUpO1xuICAgICAgICB2YXIgaGFzUGFuWSA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWSk7XG4gICAgICAgIHZhciBoYXNQYW5YID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9YKTtcblxuICAgICAgICBpZiAoaGFzTm9uZSkge1xuICAgICAgICAgICAgLy9kbyBub3QgcHJldmVudCBkZWZhdWx0cyBpZiB0aGlzIGlzIGEgdGFwIGdlc3R1cmVcblxuICAgICAgICAgICAgdmFyIGlzVGFwUG9pbnRlciA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gMTtcbiAgICAgICAgICAgIHZhciBpc1RhcE1vdmVtZW50ID0gaW5wdXQuZGlzdGFuY2UgPCAyO1xuICAgICAgICAgICAgdmFyIGlzVGFwVG91Y2hUaW1lID0gaW5wdXQuZGVsdGFUaW1lIDwgMjUwO1xuXG4gICAgICAgICAgICBpZiAoaXNUYXBQb2ludGVyICYmIGlzVGFwTW92ZW1lbnQgJiYgaXNUYXBUb3VjaFRpbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFzUGFuWCAmJiBoYXNQYW5ZKSB7XG4gICAgICAgICAgICAvLyBgcGFuLXggcGFuLXlgIG1lYW5zIGJyb3dzZXIgaGFuZGxlcyBhbGwgc2Nyb2xsaW5nL3Bhbm5pbmcsIGRvIG5vdCBwcmV2ZW50XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFzTm9uZSB8fFxuICAgICAgICAgICAgKGhhc1BhblkgJiYgZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHx8XG4gICAgICAgICAgICAoaGFzUGFuWCAmJiBkaXJlY3Rpb24gJiBESVJFQ1RJT05fVkVSVElDQUwpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcmV2ZW50U3JjKHNyY0V2ZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxsIHByZXZlbnREZWZhdWx0IHRvIHByZXZlbnQgdGhlIGJyb3dzZXIncyBkZWZhdWx0IGJlaGF2aW9yIChzY3JvbGxpbmcgaW4gbW9zdCBjYXNlcylcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3JjRXZlbnRcbiAgICAgKi9cbiAgICBwcmV2ZW50U3JjOiBmdW5jdGlvbihzcmNFdmVudCkge1xuICAgICAgICB0aGlzLm1hbmFnZXIuc2Vzc2lvbi5wcmV2ZW50ZWQgPSB0cnVlO1xuICAgICAgICBzcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogd2hlbiB0aGUgdG91Y2hBY3Rpb25zIGFyZSBjb2xsZWN0ZWQgdGhleSBhcmUgbm90IGEgdmFsaWQgdmFsdWUsIHNvIHdlIG5lZWQgdG8gY2xlYW4gdGhpbmdzIHVwLiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gYWN0aW9uc1xuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGNsZWFuVG91Y2hBY3Rpb25zKGFjdGlvbnMpIHtcbiAgICAvLyBub25lXG4gICAgaWYgKGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9OT05FKSkge1xuICAgICAgICByZXR1cm4gVE9VQ0hfQUNUSU9OX05PTkU7XG4gICAgfVxuXG4gICAgdmFyIGhhc1BhblggPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1gpO1xuICAgIHZhciBoYXNQYW5ZID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9ZKTtcblxuICAgIC8vIGlmIGJvdGggcGFuLXggYW5kIHBhbi15IGFyZSBzZXQgKGRpZmZlcmVudCByZWNvZ25pemVyc1xuICAgIC8vIGZvciBkaWZmZXJlbnQgZGlyZWN0aW9ucywgZS5nLiBob3Jpem9udGFsIHBhbiBidXQgdmVydGljYWwgc3dpcGU/KVxuICAgIC8vIHdlIG5lZWQgbm9uZSAoYXMgb3RoZXJ3aXNlIHdpdGggcGFuLXggcGFuLXkgY29tYmluZWQgbm9uZSBvZiB0aGVzZVxuICAgIC8vIHJlY29nbml6ZXJzIHdpbGwgd29yaywgc2luY2UgdGhlIGJyb3dzZXIgd291bGQgaGFuZGxlIGFsbCBwYW5uaW5nXG4gICAgaWYgKGhhc1BhblggJiYgaGFzUGFuWSkge1xuICAgICAgICByZXR1cm4gVE9VQ0hfQUNUSU9OX05PTkU7XG4gICAgfVxuXG4gICAgLy8gcGFuLXggT1IgcGFuLXlcbiAgICBpZiAoaGFzUGFuWCB8fCBoYXNQYW5ZKSB7XG4gICAgICAgIHJldHVybiBoYXNQYW5YID8gVE9VQ0hfQUNUSU9OX1BBTl9YIDogVE9VQ0hfQUNUSU9OX1BBTl9ZO1xuICAgIH1cblxuICAgIC8vIG1hbmlwdWxhdGlvblxuICAgIGlmIChpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OKSkge1xuICAgICAgICByZXR1cm4gVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTjtcbiAgICB9XG5cbiAgICByZXR1cm4gVE9VQ0hfQUNUSU9OX0FVVE87XG59XG5cbi8qKlxuICogUmVjb2duaXplciBmbG93IGV4cGxhaW5lZDsgKlxuICogQWxsIHJlY29nbml6ZXJzIGhhdmUgdGhlIGluaXRpYWwgc3RhdGUgb2YgUE9TU0lCTEUgd2hlbiBhIGlucHV0IHNlc3Npb24gc3RhcnRzLlxuICogVGhlIGRlZmluaXRpb24gb2YgYSBpbnB1dCBzZXNzaW9uIGlzIGZyb20gdGhlIGZpcnN0IGlucHV0IHVudGlsIHRoZSBsYXN0IGlucHV0LCB3aXRoIGFsbCBpdCdzIG1vdmVtZW50IGluIGl0LiAqXG4gKiBFeGFtcGxlIHNlc3Npb24gZm9yIG1vdXNlLWlucHV0OiBtb3VzZWRvd24gLT4gbW91c2Vtb3ZlIC0+IG1vdXNldXBcbiAqXG4gKiBPbiBlYWNoIHJlY29nbml6aW5nIGN5Y2xlIChzZWUgTWFuYWdlci5yZWNvZ25pemUpIHRoZSAucmVjb2duaXplKCkgbWV0aG9kIGlzIGV4ZWN1dGVkXG4gKiB3aGljaCBkZXRlcm1pbmVzIHdpdGggc3RhdGUgaXQgc2hvdWxkIGJlLlxuICpcbiAqIElmIHRoZSByZWNvZ25pemVyIGhhcyB0aGUgc3RhdGUgRkFJTEVELCBDQU5DRUxMRUQgb3IgUkVDT0dOSVpFRCAoZXF1YWxzIEVOREVEKSwgaXQgaXMgcmVzZXQgdG9cbiAqIFBPU1NJQkxFIHRvIGdpdmUgaXQgYW5vdGhlciBjaGFuZ2Ugb24gdGhlIG5leHQgY3ljbGUuXG4gKlxuICogICAgICAgICAgICAgICBQb3NzaWJsZVxuICogICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICstLS0tLSstLS0tLS0tLS0tLS0tLS0rXG4gKiAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICstLS0tLSstLS0tLSsgICAgICAgICAgICAgICB8XG4gKiAgICAgIHwgICAgICAgICAgIHwgICAgICAgICAgICAgICB8XG4gKiAgIEZhaWxlZCAgICAgIENhbmNlbGxlZCAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgKy0tLS0tLS0rLS0tLS0tK1xuICogICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgIFJlY29nbml6ZWQgICAgICAgQmVnYW5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2hhbmdlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVuZGVkL1JlY29nbml6ZWRcbiAqL1xudmFyIFNUQVRFX1BPU1NJQkxFID0gMTtcbnZhciBTVEFURV9CRUdBTiA9IDI7XG52YXIgU1RBVEVfQ0hBTkdFRCA9IDQ7XG52YXIgU1RBVEVfRU5ERUQgPSA4O1xudmFyIFNUQVRFX1JFQ09HTklaRUQgPSBTVEFURV9FTkRFRDtcbnZhciBTVEFURV9DQU5DRUxMRUQgPSAxNjtcbnZhciBTVEFURV9GQUlMRUQgPSAzMjtcblxuLyoqXG4gKiBSZWNvZ25pemVyXG4gKiBFdmVyeSByZWNvZ25pemVyIG5lZWRzIHRvIGV4dGVuZCBmcm9tIHRoaXMgY2xhc3MuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIFJlY29nbml6ZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgdGhpcy5kZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICB0aGlzLmlkID0gdW5pcXVlSWQoKTtcblxuICAgIHRoaXMubWFuYWdlciA9IG51bGw7XG5cbiAgICAvLyBkZWZhdWx0IGlzIGVuYWJsZSB0cnVlXG4gICAgdGhpcy5vcHRpb25zLmVuYWJsZSA9IGlmVW5kZWZpbmVkKHRoaXMub3B0aW9ucy5lbmFibGUsIHRydWUpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1BPU1NJQkxFO1xuXG4gICAgdGhpcy5zaW11bHRhbmVvdXMgPSB7fTtcbiAgICB0aGlzLnJlcXVpcmVGYWlsID0gW107XG59XG5cblJlY29nbml6ZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIEB2aXJ0dWFsXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBkZWZhdWx0czoge30sXG5cbiAgICAvKipcbiAgICAgKiBzZXQgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICogQHJldHVybiB7UmVjb2duaXplcn1cbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gYWxzbyB1cGRhdGUgdGhlIHRvdWNoQWN0aW9uLCBpbiBjYXNlIHNvbWV0aGluZyBjaGFuZ2VkIGFib3V0IHRoZSBkaXJlY3Rpb25zL2VuYWJsZWQgc3RhdGVcbiAgICAgICAgdGhpcy5tYW5hZ2VyICYmIHRoaXMubWFuYWdlci50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlY29nbml6ZSBzaW11bHRhbmVvdXMgd2l0aCBhbiBvdGhlciByZWNvZ25pemVyLlxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICByZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ3JlY29nbml6ZVdpdGgnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2ltdWx0YW5lb3VzID0gdGhpcy5zaW11bHRhbmVvdXM7XG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgaWYgKCFzaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXSkge1xuICAgICAgICAgICAgc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF0gPSBvdGhlclJlY29nbml6ZXI7XG4gICAgICAgICAgICBvdGhlclJlY29nbml6ZXIucmVjb2duaXplV2l0aCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZHJvcCB0aGUgc2ltdWx0YW5lb3VzIGxpbmsuIGl0IGRvZXNudCByZW1vdmUgdGhlIGxpbmsgb24gdGhlIG90aGVyIHJlY29nbml6ZXIuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIGRyb3BSZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ2Ryb3BSZWNvZ25pemVXaXRoJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICBkZWxldGUgdGhpcy5zaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlY29nbml6ZXIgY2FuIG9ubHkgcnVuIHdoZW4gYW4gb3RoZXIgaXMgZmFpbGluZ1xuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICByZXF1aXJlRmFpbHVyZTogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdyZXF1aXJlRmFpbHVyZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1aXJlRmFpbCA9IHRoaXMucmVxdWlyZUZhaWw7XG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgaWYgKGluQXJyYXkocmVxdWlyZUZhaWwsIG90aGVyUmVjb2duaXplcikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXF1aXJlRmFpbC5wdXNoKG90aGVyUmVjb2duaXplcik7XG4gICAgICAgICAgICBvdGhlclJlY29nbml6ZXIucmVxdWlyZUZhaWx1cmUodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRyb3AgdGhlIHJlcXVpcmVGYWlsdXJlIGxpbmsuIGl0IGRvZXMgbm90IHJlbW92ZSB0aGUgbGluayBvbiB0aGUgb3RoZXIgcmVjb2duaXplci5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgZHJvcFJlcXVpcmVGYWlsdXJlOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ2Ryb3BSZXF1aXJlRmFpbHVyZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgdmFyIGluZGV4ID0gaW5BcnJheSh0aGlzLnJlcXVpcmVGYWlsLCBvdGhlclJlY29nbml6ZXIpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5yZXF1aXJlRmFpbC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBoYXMgcmVxdWlyZSBmYWlsdXJlcyBib29sZWFuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaGFzUmVxdWlyZUZhaWx1cmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVxdWlyZUZhaWwubGVuZ3RoID4gMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogaWYgdGhlIHJlY29nbml6ZXIgY2FuIHJlY29nbml6ZSBzaW11bHRhbmVvdXMgd2l0aCBhbiBvdGhlciByZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5SZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5zaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogWW91IHNob3VsZCB1c2UgYHRyeUVtaXRgIGluc3RlYWQgb2YgYGVtaXRgIGRpcmVjdGx5IHRvIGNoZWNrXG4gICAgICogdGhhdCBhbGwgdGhlIG5lZWRlZCByZWNvZ25pemVycyBoYXMgZmFpbGVkIGJlZm9yZSBlbWl0dGluZy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cbiAgICAgICAgZnVuY3Rpb24gZW1pdChldmVudCkge1xuICAgICAgICAgICAgc2VsZi5tYW5hZ2VyLmVtaXQoZXZlbnQsIGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vICdwYW5zdGFydCcgYW5kICdwYW5tb3ZlJ1xuICAgICAgICBpZiAoc3RhdGUgPCBTVEFURV9FTkRFRCkge1xuICAgICAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQgKyBzdGF0ZVN0cihzdGF0ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQpOyAvLyBzaW1wbGUgJ2V2ZW50TmFtZScgZXZlbnRzXG5cbiAgICAgICAgaWYgKGlucHV0LmFkZGl0aW9uYWxFdmVudCkgeyAvLyBhZGRpdGlvbmFsIGV2ZW50KHBhbmxlZnQsIHBhbnJpZ2h0LCBwaW5jaGluLCBwaW5jaG91dC4uLilcbiAgICAgICAgICAgIGVtaXQoaW5wdXQuYWRkaXRpb25hbEV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBhbmVuZCBhbmQgcGFuY2FuY2VsXG4gICAgICAgIGlmIChzdGF0ZSA+PSBTVEFURV9FTkRFRCkge1xuICAgICAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQgKyBzdGF0ZVN0cihzdGF0ZSkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoYXQgYWxsIHRoZSByZXF1aXJlIGZhaWx1cmUgcmVjb2duaXplcnMgaGFzIGZhaWxlZCxcbiAgICAgKiBpZiB0cnVlLCBpdCBlbWl0cyBhIGdlc3R1cmUgZXZlbnQsXG4gICAgICogb3RoZXJ3aXNlLCBzZXR1cCB0aGUgc3RhdGUgdG8gRkFJTEVELlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqL1xuICAgIHRyeUVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmICh0aGlzLmNhbkVtaXQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW1pdChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaXQncyBmYWlsaW5nIGFueXdheVxuICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYW4gd2UgZW1pdD9cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5FbWl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMucmVxdWlyZUZhaWwubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoISh0aGlzLnJlcXVpcmVGYWlsW2ldLnN0YXRlICYgKFNUQVRFX0ZBSUxFRCB8IFNUQVRFX1BPU1NJQkxFKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVwZGF0ZSB0aGUgcmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICByZWNvZ25pemU6IGZ1bmN0aW9uKGlucHV0RGF0YSkge1xuICAgICAgICAvLyBtYWtlIGEgbmV3IGNvcHkgb2YgdGhlIGlucHV0RGF0YVxuICAgICAgICAvLyBzbyB3ZSBjYW4gY2hhbmdlIHRoZSBpbnB1dERhdGEgd2l0aG91dCBtZXNzaW5nIHVwIHRoZSBvdGhlciByZWNvZ25pemVyc1xuICAgICAgICB2YXIgaW5wdXREYXRhQ2xvbmUgPSBhc3NpZ24oe30sIGlucHV0RGF0YSk7XG5cbiAgICAgICAgLy8gaXMgaXMgZW5hYmxlZCBhbmQgYWxsb3cgcmVjb2duaXppbmc/XG4gICAgICAgIGlmICghYm9vbE9yRm4odGhpcy5vcHRpb25zLmVuYWJsZSwgW3RoaXMsIGlucHV0RGF0YUNsb25lXSkpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9GQUlMRUQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB3aGVuIHdlJ3ZlIHJlYWNoZWQgdGhlIGVuZFxuICAgICAgICBpZiAodGhpcy5zdGF0ZSAmIChTVEFURV9SRUNPR05JWkVEIHwgU1RBVEVfQ0FOQ0VMTEVEIHwgU1RBVEVfRkFJTEVEKSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1BPU1NJQkxFO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMucHJvY2VzcyhpbnB1dERhdGFDbG9uZSk7XG5cbiAgICAgICAgLy8gdGhlIHJlY29nbml6ZXIgaGFzIHJlY29nbml6ZWQgYSBnZXN0dXJlXG4gICAgICAgIC8vIHNvIHRyaWdnZXIgYW4gZXZlbnRcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgJiAoU1RBVEVfQkVHQU4gfCBTVEFURV9DSEFOR0VEIHwgU1RBVEVfRU5ERUQgfCBTVEFURV9DQU5DRUxMRUQpKSB7XG4gICAgICAgICAgICB0aGlzLnRyeUVtaXQoaW5wdXREYXRhQ2xvbmUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJldHVybiB0aGUgc3RhdGUgb2YgdGhlIHJlY29nbml6ZXJcbiAgICAgKiB0aGUgYWN0dWFsIHJlY29nbml6aW5nIGhhcHBlbnMgaW4gdGhpcyBtZXRob2RcbiAgICAgKiBAdmlydHVhbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKiBAcmV0dXJucyB7Q29uc3R9IFNUQVRFXG4gICAgICovXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXREYXRhKSB7IH0sIC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG4gICAgLyoqXG4gICAgICogcmV0dXJuIHRoZSBwcmVmZXJyZWQgdG91Y2gtYWN0aW9uXG4gICAgICogQHZpcnR1YWxcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICovXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkgeyB9LFxuXG4gICAgLyoqXG4gICAgICogY2FsbGVkIHdoZW4gdGhlIGdlc3R1cmUgaXNuJ3QgYWxsb3dlZCB0byByZWNvZ25pemVcbiAgICAgKiBsaWtlIHdoZW4gYW5vdGhlciBpcyBiZWluZyByZWNvZ25pemVkIG9yIGl0IGlzIGRpc2FibGVkXG4gICAgICogQHZpcnR1YWxcbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24oKSB7IH1cbn07XG5cbi8qKlxuICogZ2V0IGEgdXNhYmxlIHN0cmluZywgdXNlZCBhcyBldmVudCBwb3N0Zml4XG4gKiBAcGFyYW0ge0NvbnN0fSBzdGF0ZVxuICogQHJldHVybnMge1N0cmluZ30gc3RhdGVcbiAqL1xuZnVuY3Rpb24gc3RhdGVTdHIoc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUgJiBTVEFURV9DQU5DRUxMRUQpIHtcbiAgICAgICAgcmV0dXJuICdjYW5jZWwnO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUgJiBTVEFURV9FTkRFRCkge1xuICAgICAgICByZXR1cm4gJ2VuZCc7XG4gICAgfSBlbHNlIGlmIChzdGF0ZSAmIFNUQVRFX0NIQU5HRUQpIHtcbiAgICAgICAgcmV0dXJuICdtb3ZlJztcbiAgICB9IGVsc2UgaWYgKHN0YXRlICYgU1RBVEVfQkVHQU4pIHtcbiAgICAgICAgcmV0dXJuICdzdGFydCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBkaXJlY3Rpb24gY29ucyB0byBzdHJpbmdcbiAqIEBwYXJhbSB7Q29uc3R9IGRpcmVjdGlvblxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZGlyZWN0aW9uU3RyKGRpcmVjdGlvbikge1xuICAgIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX0RPV04pIHtcbiAgICAgICAgcmV0dXJuICdkb3duJztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fVVApIHtcbiAgICAgICAgcmV0dXJuICd1cCc7XG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX0xFRlQpIHtcbiAgICAgICAgcmV0dXJuICdsZWZ0JztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fUklHSFQpIHtcbiAgICAgICAgcmV0dXJuICdyaWdodCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBnZXQgYSByZWNvZ25pemVyIGJ5IG5hbWUgaWYgaXQgaXMgYm91bmQgdG8gYSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSBvdGhlclJlY29nbml6ZXJcbiAqIEBwYXJhbSB7UmVjb2duaXplcn0gcmVjb2duaXplclxuICogQHJldHVybnMge1JlY29nbml6ZXJ9XG4gKi9cbmZ1bmN0aW9uIGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCByZWNvZ25pemVyKSB7XG4gICAgdmFyIG1hbmFnZXIgPSByZWNvZ25pemVyLm1hbmFnZXI7XG4gICAgaWYgKG1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuIG1hbmFnZXIuZ2V0KG90aGVyUmVjb2duaXplcik7XG4gICAgfVxuICAgIHJldHVybiBvdGhlclJlY29nbml6ZXI7XG59XG5cbi8qKlxuICogVGhpcyByZWNvZ25pemVyIGlzIGp1c3QgdXNlZCBhcyBhIGJhc2UgZm9yIHRoZSBzaW1wbGUgYXR0cmlidXRlIHJlY29nbml6ZXJzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIEF0dHJSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChBdHRyUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgQXR0clJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMVxuICAgICAgICAgKi9cbiAgICAgICAgcG9pbnRlcnM6IDFcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byBjaGVjayBpZiBpdCB0aGUgcmVjb2duaXplciByZWNlaXZlcyB2YWxpZCBpbnB1dCwgbGlrZSBpbnB1dC5kaXN0YW5jZSA+IDEwLlxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSByZWNvZ25pemVkXG4gICAgICovXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25Qb2ludGVycyA9IHRoaXMub3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgcmV0dXJuIG9wdGlvblBvaW50ZXJzID09PSAwIHx8IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9uUG9pbnRlcnM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByb2Nlc3MgdGhlIGlucHV0IGFuZCByZXR1cm4gdGhlIHN0YXRlIGZvciB0aGUgcmVjb2duaXplclxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqIEByZXR1cm5zIHsqfSBTdGF0ZVxuICAgICAqL1xuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBpbnB1dC5ldmVudFR5cGU7XG5cbiAgICAgICAgdmFyIGlzUmVjb2duaXplZCA9IHN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCk7XG4gICAgICAgIHZhciBpc1ZhbGlkID0gdGhpcy5hdHRyVGVzdChpbnB1dCk7XG5cbiAgICAgICAgLy8gb24gY2FuY2VsIGlucHV0IGFuZCB3ZSd2ZSByZWNvZ25pemVkIGJlZm9yZSwgcmV0dXJuIFNUQVRFX0NBTkNFTExFRFxuICAgICAgICBpZiAoaXNSZWNvZ25pemVkICYmIChldmVudFR5cGUgJiBJTlBVVF9DQU5DRUwgfHwgIWlzVmFsaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9DQU5DRUxMRUQ7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNSZWNvZ25pemVkIHx8IGlzVmFsaWQpIHtcbiAgICAgICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9FTkRFRDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIShzdGF0ZSAmIFNUQVRFX0JFR0FOKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9CRUdBTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdGF0ZSB8IFNUQVRFX0NIQU5HRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBQYW5cbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb3duIGFuZCBtb3ZlZCBpbiB0aGUgYWxsb3dlZCBkaXJlY3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFBhblJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMucFggPSBudWxsO1xuICAgIHRoaXMucFkgPSBudWxsO1xufVxuXG5pbmhlcml0KFBhblJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQYW5SZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwYW4nLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICBwb2ludGVyczogMSxcbiAgICAgICAgZGlyZWN0aW9uOiBESVJFQ1RJT05fQUxMXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5kaXJlY3Rpb247XG4gICAgICAgIHZhciBhY3Rpb25zID0gW107XG4gICAgICAgIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFRPVUNIX0FDVElPTl9QQU5fWSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFRPVUNIX0FDVElPTl9QQU5fWCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjdGlvbnM7XG4gICAgfSxcblxuICAgIGRpcmVjdGlvblRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICB2YXIgaGFzTW92ZWQgPSB0cnVlO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBpbnB1dC5kaXN0YW5jZTtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGlucHV0LmRpcmVjdGlvbjtcbiAgICAgICAgdmFyIHggPSBpbnB1dC5kZWx0YVg7XG4gICAgICAgIHZhciB5ID0gaW5wdXQuZGVsdGFZO1xuXG4gICAgICAgIC8vIGxvY2sgdG8gYXhpcz9cbiAgICAgICAgaWYgKCEoZGlyZWN0aW9uICYgb3B0aW9ucy5kaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5kaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9ICh4ID09PSAwKSA/IERJUkVDVElPTl9OT05FIDogKHggPCAwKSA/IERJUkVDVElPTl9MRUZUIDogRElSRUNUSU9OX1JJR0hUO1xuICAgICAgICAgICAgICAgIGhhc01vdmVkID0geCAhPSB0aGlzLnBYO1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gTWF0aC5hYnMoaW5wdXQuZGVsdGFYKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gKHkgPT09IDApID8gRElSRUNUSU9OX05PTkUgOiAoeSA8IDApID8gRElSRUNUSU9OX1VQIDogRElSRUNUSU9OX0RPV047XG4gICAgICAgICAgICAgICAgaGFzTW92ZWQgPSB5ICE9IHRoaXMucFk7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgPSBNYXRoLmFicyhpbnB1dC5kZWx0YVkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlucHV0LmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgcmV0dXJuIGhhc01vdmVkICYmIGRpc3RhbmNlID4gb3B0aW9ucy50aHJlc2hvbGQgJiYgZGlyZWN0aW9uICYgb3B0aW9ucy5kaXJlY3Rpb247XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gQXR0clJlY29nbml6ZXIucHJvdG90eXBlLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICAodGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOIHx8ICghKHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTikgJiYgdGhpcy5kaXJlY3Rpb25UZXN0KGlucHV0KSkpO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuXG4gICAgICAgIHRoaXMucFggPSBpbnB1dC5kZWx0YVg7XG4gICAgICAgIHRoaXMucFkgPSBpbnB1dC5kZWx0YVk7XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGRpcmVjdGlvblN0cihpbnB1dC5kaXJlY3Rpb24pO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGlucHV0LmFkZGl0aW9uYWxFdmVudCA9IHRoaXMub3B0aW9ucy5ldmVudCArIGRpcmVjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdXBlci5lbWl0LmNhbGwodGhpcywgaW5wdXQpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFBpbmNoXG4gKiBSZWNvZ25pemVkIHdoZW4gdHdvIG9yIG1vcmUgcG9pbnRlcnMgYXJlIG1vdmluZyB0b3dhcmQgKHpvb20taW4pIG9yIGF3YXkgZnJvbSBlYWNoIG90aGVyICh6b29tLW91dCkuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFBpbmNoUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFBpbmNoUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBpbmNoUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncGluY2gnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgICAgIHBvaW50ZXJzOiAyXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTk9ORV07XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIChNYXRoLmFicyhpbnB1dC5zY2FsZSAtIDEpID4gdGhpcy5vcHRpb25zLnRocmVzaG9sZCB8fCB0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4pO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQuc2NhbGUgIT09IDEpIHtcbiAgICAgICAgICAgIHZhciBpbk91dCA9IGlucHV0LnNjYWxlIDwgMSA/ICdpbicgOiAnb3V0JztcbiAgICAgICAgICAgIGlucHV0LmFkZGl0aW9uYWxFdmVudCA9IHRoaXMub3B0aW9ucy5ldmVudCArIGluT3V0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N1cGVyLmVtaXQuY2FsbCh0aGlzLCBpbnB1dCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogUHJlc3NcbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb3duIGZvciB4IG1zIHdpdGhvdXQgYW55IG1vdmVtZW50LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFByZXNzUmVjb2duaXplcigpIHtcbiAgICBSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xufVxuXG5pbmhlcml0KFByZXNzUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUHJlc3NSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwcmVzcycsXG4gICAgICAgIHBvaW50ZXJzOiAxLFxuICAgICAgICB0aW1lOiAyNTEsIC8vIG1pbmltYWwgdGltZSBvZiB0aGUgcG9pbnRlciB0byBiZSBwcmVzc2VkXG4gICAgICAgIHRocmVzaG9sZDogOSAvLyBhIG1pbmltYWwgbW92ZW1lbnQgaXMgb2ssIGJ1dCBrZWVwIGl0IGxvd1xuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX0FVVE9dO1xuICAgIH0sXG5cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgdmFyIHZhbGlkUG9pbnRlcnMgPSBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IG9wdGlvbnMucG9pbnRlcnM7XG4gICAgICAgIHZhciB2YWxpZE1vdmVtZW50ID0gaW5wdXQuZGlzdGFuY2UgPCBvcHRpb25zLnRocmVzaG9sZDtcbiAgICAgICAgdmFyIHZhbGlkVGltZSA9IGlucHV0LmRlbHRhVGltZSA+IG9wdGlvbnMudGltZTtcblxuICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuXG4gICAgICAgIC8vIHdlIG9ubHkgYWxsb3cgbGl0dGxlIG1vdmVtZW50XG4gICAgICAgIC8vIGFuZCB3ZSd2ZSByZWFjaGVkIGFuIGVuZCBldmVudCwgc28gYSB0YXAgaXMgcG9zc2libGVcbiAgICAgICAgaWYgKCF2YWxpZE1vdmVtZW50IHx8ICF2YWxpZFBvaW50ZXJzIHx8IChpbnB1dC5ldmVudFR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSAmJiAhdmFsaWRUaW1lKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX1NUQVJUKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXRDb250ZXh0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgIHRoaXMudHJ5RW1pdCgpO1xuICAgICAgICAgICAgfSwgb3B0aW9ucy50aW1lLCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgIHJldHVybiBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFNUQVRFX1JFQ09HTklaRUQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbnB1dCAmJiAoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfRU5EKSkge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50ICsgJ3VwJywgaW5wdXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faW5wdXQudGltZVN0YW1wID0gbm93KCk7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIHRoaXMuX2lucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFJvdGF0ZVxuICogUmVjb2duaXplZCB3aGVuIHR3byBvciBtb3JlIHBvaW50ZXIgYXJlIG1vdmluZyBpbiBhIGNpcmN1bGFyIG1vdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUm90YXRlUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFJvdGF0ZVJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBSb3RhdGVSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdyb3RhdGUnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgICAgIHBvaW50ZXJzOiAyXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTk9ORV07XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIChNYXRoLmFicyhpbnB1dC5yb3RhdGlvbikgPiB0aGlzLm9wdGlvbnMudGhyZXNob2xkIHx8IHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTik7XG4gICAgfVxufSk7XG5cbi8qKlxuICogU3dpcGVcbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgZmFzdCAodmVsb2NpdHkpLCB3aXRoIGVub3VnaCBkaXN0YW5jZSBpbiB0aGUgYWxsb3dlZCBkaXJlY3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFN3aXBlUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFN3aXBlUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFN3aXBlUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAnc3dpcGUnLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICB2ZWxvY2l0eTogMC4zLFxuICAgICAgICBkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMLFxuICAgICAgICBwb2ludGVyczogMVxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBQYW5SZWNvZ25pemVyLnByb3RvdHlwZS5nZXRUb3VjaEFjdGlvbi5jYWxsKHRoaXMpO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5kaXJlY3Rpb247XG4gICAgICAgIHZhciB2ZWxvY2l0eTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uICYgKERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMKSkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBpbnB1dC5vdmVyYWxsVmVsb2NpdHk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5WDtcbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fVkVSVElDQUwpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5WTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBlci5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgZGlyZWN0aW9uICYgaW5wdXQub2Zmc2V0RGlyZWN0aW9uICYmXG4gICAgICAgICAgICBpbnB1dC5kaXN0YW5jZSA+IHRoaXMub3B0aW9ucy50aHJlc2hvbGQgJiZcbiAgICAgICAgICAgIGlucHV0Lm1heFBvaW50ZXJzID09IHRoaXMub3B0aW9ucy5wb2ludGVycyAmJlxuICAgICAgICAgICAgYWJzKHZlbG9jaXR5KSA+IHRoaXMub3B0aW9ucy52ZWxvY2l0eSAmJiBpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQ7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBkaXJlY3Rpb25TdHIoaW5wdXQub2Zmc2V0RGlyZWN0aW9uKTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50ICsgZGlyZWN0aW9uLCBpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIGlucHV0KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBBIHRhcCBpcyBlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb2luZyBhIHNtYWxsIHRhcC9jbGljay4gTXVsdGlwbGUgdGFwcyBhcmUgcmVjb2duaXplZCBpZiB0aGV5IG9jY3VyXG4gKiBiZXR3ZWVuIHRoZSBnaXZlbiBpbnRlcnZhbCBhbmQgcG9zaXRpb24uIFRoZSBkZWxheSBvcHRpb24gY2FuIGJlIHVzZWQgdG8gcmVjb2duaXplIG11bHRpLXRhcHMgd2l0aG91dCBmaXJpbmdcbiAqIGEgc2luZ2xlIHRhcC5cbiAqXG4gKiBUaGUgZXZlbnREYXRhIGZyb20gdGhlIGVtaXR0ZWQgZXZlbnQgY29udGFpbnMgdGhlIHByb3BlcnR5IGB0YXBDb3VudGAsIHdoaWNoIGNvbnRhaW5zIHRoZSBhbW91bnQgb2ZcbiAqIG11bHRpLXRhcHMgYmVpbmcgcmVjb2duaXplZC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBUYXBSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIC8vIHByZXZpb3VzIHRpbWUgYW5kIGNlbnRlcixcbiAgICAvLyB1c2VkIGZvciB0YXAgY291bnRpbmdcbiAgICB0aGlzLnBUaW1lID0gZmFsc2U7XG4gICAgdGhpcy5wQ2VudGVyID0gZmFsc2U7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xuICAgIHRoaXMuY291bnQgPSAwO1xufVxuXG5pbmhlcml0KFRhcFJlY29nbml6ZXIsIFJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBpbmNoUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAndGFwJyxcbiAgICAgICAgcG9pbnRlcnM6IDEsXG4gICAgICAgIHRhcHM6IDEsXG4gICAgICAgIGludGVydmFsOiAzMDAsIC8vIG1heCB0aW1lIGJldHdlZW4gdGhlIG11bHRpLXRhcCB0YXBzXG4gICAgICAgIHRpbWU6IDI1MCwgLy8gbWF4IHRpbWUgb2YgdGhlIHBvaW50ZXIgdG8gYmUgZG93biAobGlrZSBmaW5nZXIgb24gdGhlIHNjcmVlbilcbiAgICAgICAgdGhyZXNob2xkOiA5LCAvLyBhIG1pbmltYWwgbW92ZW1lbnQgaXMgb2ssIGJ1dCBrZWVwIGl0IGxvd1xuICAgICAgICBwb3NUaHJlc2hvbGQ6IDEwIC8vIGEgbXVsdGktdGFwIGNhbiBiZSBhIGJpdCBvZmYgdGhlIGluaXRpYWwgcG9zaXRpb25cbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9NQU5JUFVMQVRJT05dO1xuICAgIH0sXG5cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuICAgICAgICB2YXIgdmFsaWRQb2ludGVycyA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgdmFyIHZhbGlkTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IG9wdGlvbnMudGhyZXNob2xkO1xuICAgICAgICB2YXIgdmFsaWRUb3VjaFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPCBvcHRpb25zLnRpbWU7XG5cbiAgICAgICAgdGhpcy5yZXNldCgpO1xuXG4gICAgICAgIGlmICgoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQpICYmICh0aGlzLmNvdW50ID09PSAwKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFpbFRpbWVvdXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlIG9ubHkgYWxsb3cgbGl0dGxlIG1vdmVtZW50XG4gICAgICAgIC8vIGFuZCB3ZSd2ZSByZWFjaGVkIGFuIGVuZCBldmVudCwgc28gYSB0YXAgaXMgcG9zc2libGVcbiAgICAgICAgaWYgKHZhbGlkTW92ZW1lbnQgJiYgdmFsaWRUb3VjaFRpbWUgJiYgdmFsaWRQb2ludGVycykge1xuICAgICAgICAgICAgaWYgKGlucHV0LmV2ZW50VHlwZSAhPSBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWlsVGltZW91dCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdmFsaWRJbnRlcnZhbCA9IHRoaXMucFRpbWUgPyAoaW5wdXQudGltZVN0YW1wIC0gdGhpcy5wVGltZSA8IG9wdGlvbnMuaW50ZXJ2YWwpIDogdHJ1ZTtcbiAgICAgICAgICAgIHZhciB2YWxpZE11bHRpVGFwID0gIXRoaXMucENlbnRlciB8fCBnZXREaXN0YW5jZSh0aGlzLnBDZW50ZXIsIGlucHV0LmNlbnRlcikgPCBvcHRpb25zLnBvc1RocmVzaG9sZDtcblxuICAgICAgICAgICAgdGhpcy5wVGltZSA9IGlucHV0LnRpbWVTdGFtcDtcbiAgICAgICAgICAgIHRoaXMucENlbnRlciA9IGlucHV0LmNlbnRlcjtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZE11bHRpVGFwIHx8ICF2YWxpZEludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9IDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcblxuICAgICAgICAgICAgLy8gaWYgdGFwIGNvdW50IG1hdGNoZXMgd2UgaGF2ZSByZWNvZ25pemVkIGl0LFxuICAgICAgICAgICAgLy8gZWxzZSBpdCBoYXMgYmVnYW4gcmVjb2duaXppbmcuLi5cbiAgICAgICAgICAgIHZhciB0YXBDb3VudCA9IHRoaXMuY291bnQgJSBvcHRpb25zLnRhcHM7XG4gICAgICAgICAgICBpZiAodGFwQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBubyBmYWlsaW5nIHJlcXVpcmVtZW50cywgaW1tZWRpYXRlbHkgdHJpZ2dlciB0aGUgdGFwIGV2ZW50XG4gICAgICAgICAgICAgICAgLy8gb3Igd2FpdCBhcyBsb25nIGFzIHRoZSBtdWx0aXRhcCBpbnRlcnZhbCB0byB0cmlnZ2VyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmhhc1JlcXVpcmVGYWlsdXJlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJ5RW1pdCgpO1xuICAgICAgICAgICAgICAgICAgICB9LCBvcHRpb25zLmludGVydmFsLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFNUQVRFX0JFR0FOO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICBmYWlsVGltZW91dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgICAgICB9LCB0aGlzLm9wdGlvbnMuaW50ZXJ2YWwsIHRoaXMpO1xuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBTVEFURV9SRUNPR05JWkVEKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC50YXBDb3VudCA9IHRoaXMuY291bnQ7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIHRoaXMuX2lucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFNpbXBsZSB3YXkgdG8gY3JlYXRlIGEgbWFuYWdlciB3aXRoIGEgZGVmYXVsdCBzZXQgb2YgcmVjb2duaXplcnMuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSGFtbWVyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLnJlY29nbml6ZXJzID0gaWZVbmRlZmluZWQob3B0aW9ucy5yZWNvZ25pemVycywgSGFtbWVyLmRlZmF1bHRzLnByZXNldCk7XG4gICAgcmV0dXJuIG5ldyBNYW5hZ2VyKGVsZW1lbnQsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEBjb25zdCB7c3RyaW5nfVxuICovXG5IYW1tZXIuVkVSU0lPTiA9ICcyLjAuNic7XG5cbi8qKlxuICogZGVmYXVsdCBzZXR0aW5nc1xuICogQG5hbWVzcGFjZVxuICovXG5IYW1tZXIuZGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogc2V0IGlmIERPTSBldmVudHMgYXJlIGJlaW5nIHRyaWdnZXJlZC5cbiAgICAgKiBCdXQgdGhpcyBpcyBzbG93ZXIgYW5kIHVudXNlZCBieSBzaW1wbGUgaW1wbGVtZW50YXRpb25zLCBzbyBkaXNhYmxlZCBieSBkZWZhdWx0LlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICovXG4gICAgZG9tRXZlbnRzOiBmYWxzZSxcblxuICAgIC8qKlxuICAgICAqIFRoZSB2YWx1ZSBmb3IgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5L2ZhbGxiYWNrLlxuICAgICAqIFdoZW4gc2V0IHRvIGBjb21wdXRlYCBpdCB3aWxsIG1hZ2ljYWxseSBzZXQgdGhlIGNvcnJlY3QgdmFsdWUgYmFzZWQgb24gdGhlIGFkZGVkIHJlY29nbml6ZXJzLlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICogQGRlZmF1bHQgY29tcHV0ZVxuICAgICAqL1xuICAgIHRvdWNoQWN0aW9uOiBUT1VDSF9BQ1RJT05fQ09NUFVURSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBkZWZhdWx0IHRydWVcbiAgICAgKi9cbiAgICBlbmFibGU6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBFWFBFUklNRU5UQUwgRkVBVFVSRSAtLSBjYW4gYmUgcmVtb3ZlZC9jaGFuZ2VkXG4gICAgICogQ2hhbmdlIHRoZSBwYXJlbnQgaW5wdXQgdGFyZ2V0IGVsZW1lbnQuXG4gICAgICogSWYgTnVsbCwgdGhlbiBpdCBpcyBiZWluZyBzZXQgdGhlIHRvIG1haW4gZWxlbWVudC5cbiAgICAgKiBAdHlwZSB7TnVsbHxFdmVudFRhcmdldH1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgaW5wdXRUYXJnZXQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBmb3JjZSBhbiBpbnB1dCBjbGFzc1xuICAgICAqIEB0eXBlIHtOdWxsfEZ1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgKi9cbiAgICBpbnB1dENsYXNzOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCByZWNvZ25pemVyIHNldHVwIHdoZW4gY2FsbGluZyBgSGFtbWVyKClgXG4gICAgICogV2hlbiBjcmVhdGluZyBhIG5ldyBNYW5hZ2VyIHRoZXNlIHdpbGwgYmUgc2tpcHBlZC5cbiAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICovXG4gICAgcHJlc2V0OiBbXG4gICAgICAgIC8vIFJlY29nbml6ZXJDbGFzcywgb3B0aW9ucywgW3JlY29nbml6ZVdpdGgsIC4uLl0sIFtyZXF1aXJlRmFpbHVyZSwgLi4uXVxuICAgICAgICBbUm90YXRlUmVjb2duaXplciwge2VuYWJsZTogZmFsc2V9XSxcbiAgICAgICAgW1BpbmNoUmVjb2duaXplciwge2VuYWJsZTogZmFsc2V9LCBbJ3JvdGF0ZSddXSxcbiAgICAgICAgW1N3aXBlUmVjb2duaXplciwge2RpcmVjdGlvbjogRElSRUNUSU9OX0hPUklaT05UQUx9XSxcbiAgICAgICAgW1BhblJlY29nbml6ZXIsIHtkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMfSwgWydzd2lwZSddXSxcbiAgICAgICAgW1RhcFJlY29nbml6ZXJdLFxuICAgICAgICBbVGFwUmVjb2duaXplciwge2V2ZW50OiAnZG91YmxldGFwJywgdGFwczogMn0sIFsndGFwJ11dLFxuICAgICAgICBbUHJlc3NSZWNvZ25pemVyXVxuICAgIF0sXG5cbiAgICAvKipcbiAgICAgKiBTb21lIENTUyBwcm9wZXJ0aWVzIGNhbiBiZSB1c2VkIHRvIGltcHJvdmUgdGhlIHdvcmtpbmcgb2YgSGFtbWVyLlxuICAgICAqIEFkZCB0aGVtIHRvIHRoaXMgbWV0aG9kIGFuZCB0aGV5IHdpbGwgYmUgc2V0IHdoZW4gY3JlYXRpbmcgYSBuZXcgTWFuYWdlci5cbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICovXG4gICAgY3NzUHJvcHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRleHQgc2VsZWN0aW9uIHRvIGltcHJvdmUgdGhlIGRyYWdnaW5nIGdlc3R1cmUuIE1haW5seSBmb3IgZGVza3RvcCBicm93c2Vycy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGUgdGhlIFdpbmRvd3MgUGhvbmUgZ3JpcHBlcnMgd2hlbiBwcmVzc2luZyBhbiBlbGVtZW50LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRoZSBkZWZhdWx0IGNhbGxvdXQgc2hvd24gd2hlbiB5b3UgdG91Y2ggYW5kIGhvbGQgYSB0b3VjaCB0YXJnZXQuXG4gICAgICAgICAqIE9uIGlPUywgd2hlbiB5b3UgdG91Y2ggYW5kIGhvbGQgYSB0b3VjaCB0YXJnZXQgc3VjaCBhcyBhIGxpbmssIFNhZmFyaSBkaXNwbGF5c1xuICAgICAgICAgKiBhIGNhbGxvdXQgY29udGFpbmluZyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbGluay4gVGhpcyBwcm9wZXJ0eSBhbGxvd3MgeW91IHRvIGRpc2FibGUgdGhhdCBjYWxsb3V0LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoQ2FsbG91dDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgd2hldGhlciB6b29taW5nIGlzIGVuYWJsZWQuIFVzZWQgYnkgSUUxMD5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICBjb250ZW50Wm9vbWluZzogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgdGhhdCBhbiBlbnRpcmUgZWxlbWVudCBzaG91bGQgYmUgZHJhZ2dhYmxlIGluc3RlYWQgb2YgaXRzIGNvbnRlbnRzLiBNYWlubHkgZm9yIGRlc2t0b3AgYnJvd3NlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdXNlckRyYWc6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3ZlcnJpZGVzIHRoZSBoaWdobGlnaHQgY29sb3Igc2hvd24gd2hlbiB0aGUgdXNlciB0YXBzIGEgbGluayBvciBhIEphdmFTY3JpcHRcbiAgICAgICAgICogY2xpY2thYmxlIGVsZW1lbnQgaW4gaU9TLiBUaGlzIHByb3BlcnR5IG9iZXlzIHRoZSBhbHBoYSB2YWx1ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAncmdiYSgwLDAsMCwwKSdcbiAgICAgICAgICovXG4gICAgICAgIHRhcEhpZ2hsaWdodENvbG9yOiAncmdiYSgwLDAsMCwwKSdcbiAgICB9XG59O1xuXG52YXIgU1RPUCA9IDE7XG52YXIgRk9SQ0VEX1NUT1AgPSAyO1xuXG4vKipcbiAqIE1hbmFnZXJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNYW5hZ2VyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIEhhbW1lci5kZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICB0aGlzLm9wdGlvbnMuaW5wdXRUYXJnZXQgPSB0aGlzLm9wdGlvbnMuaW5wdXRUYXJnZXQgfHwgZWxlbWVudDtcblxuICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLnNlc3Npb24gPSB7fTtcbiAgICB0aGlzLnJlY29nbml6ZXJzID0gW107XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMuaW5wdXQgPSBjcmVhdGVJbnB1dEluc3RhbmNlKHRoaXMpO1xuICAgIHRoaXMudG91Y2hBY3Rpb24gPSBuZXcgVG91Y2hBY3Rpb24odGhpcywgdGhpcy5vcHRpb25zLnRvdWNoQWN0aW9uKTtcblxuICAgIHRvZ2dsZUNzc1Byb3BzKHRoaXMsIHRydWUpO1xuXG4gICAgZWFjaCh0aGlzLm9wdGlvbnMucmVjb2duaXplcnMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFyIHJlY29nbml6ZXIgPSB0aGlzLmFkZChuZXcgKGl0ZW1bMF0pKGl0ZW1bMV0pKTtcbiAgICAgICAgaXRlbVsyXSAmJiByZWNvZ25pemVyLnJlY29nbml6ZVdpdGgoaXRlbVsyXSk7XG4gICAgICAgIGl0ZW1bM10gJiYgcmVjb2duaXplci5yZXF1aXJlRmFpbHVyZShpdGVtWzNdKTtcbiAgICB9LCB0aGlzKTtcbn1cblxuTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogc2V0IG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHtNYW5hZ2VyfVxuICAgICAqL1xuICAgIHNldDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBhc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAvLyBPcHRpb25zIHRoYXQgbmVlZCBhIGxpdHRsZSBtb3JlIHNldHVwXG4gICAgICAgIGlmIChvcHRpb25zLnRvdWNoQWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoQWN0aW9uLnVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmlucHV0VGFyZ2V0KSB7XG4gICAgICAgICAgICAvLyBDbGVhbiB1cCBleGlzdGluZyBldmVudCBsaXN0ZW5lcnMgYW5kIHJlaW5pdGlhbGl6ZVxuICAgICAgICAgICAgdGhpcy5pbnB1dC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnRhcmdldCA9IG9wdGlvbnMuaW5wdXRUYXJnZXQ7XG4gICAgICAgICAgICB0aGlzLmlucHV0LmluaXQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogc3RvcCByZWNvZ25pemluZyBmb3IgdGhpcyBzZXNzaW9uLlxuICAgICAqIFRoaXMgc2Vzc2lvbiB3aWxsIGJlIGRpc2NhcmRlZCwgd2hlbiBhIG5ldyBbaW5wdXRdc3RhcnQgZXZlbnQgaXMgZmlyZWQuXG4gICAgICogV2hlbiBmb3JjZWQsIHRoZSByZWNvZ25pemVyIGN5Y2xlIGlzIHN0b3BwZWQgaW1tZWRpYXRlbHkuXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBbZm9yY2VdXG4gICAgICovXG4gICAgc3RvcDogZnVuY3Rpb24oZm9yY2UpIHtcbiAgICAgICAgdGhpcy5zZXNzaW9uLnN0b3BwZWQgPSBmb3JjZSA/IEZPUkNFRF9TVE9QIDogU1RPUDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcnVuIHRoZSByZWNvZ25pemVycyFcbiAgICAgKiBjYWxsZWQgYnkgdGhlIGlucHV0SGFuZGxlciBmdW5jdGlvbiBvbiBldmVyeSBtb3ZlbWVudCBvZiB0aGUgcG9pbnRlcnMgKHRvdWNoZXMpXG4gICAgICogaXQgd2Fsa3MgdGhyb3VnaCBhbGwgdGhlIHJlY29nbml6ZXJzIGFuZCB0cmllcyB0byBkZXRlY3QgdGhlIGdlc3R1cmUgdGhhdCBpcyBiZWluZyBtYWRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0RGF0YVxuICAgICAqL1xuICAgIHJlY29nbml6ZTogZnVuY3Rpb24oaW5wdXREYXRhKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5zZXNzaW9uO1xuICAgICAgICBpZiAoc2Vzc2lvbi5zdG9wcGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBydW4gdGhlIHRvdWNoLWFjdGlvbiBwb2x5ZmlsbFxuICAgICAgICB0aGlzLnRvdWNoQWN0aW9uLnByZXZlbnREZWZhdWx0cyhpbnB1dERhdGEpO1xuXG4gICAgICAgIHZhciByZWNvZ25pemVyO1xuICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuXG4gICAgICAgIC8vIHRoaXMgaG9sZHMgdGhlIHJlY29nbml6ZXIgdGhhdCBpcyBiZWluZyByZWNvZ25pemVkLlxuICAgICAgICAvLyBzbyB0aGUgcmVjb2duaXplcidzIHN0YXRlIG5lZWRzIHRvIGJlIEJFR0FOLCBDSEFOR0VELCBFTkRFRCBvciBSRUNPR05JWkVEXG4gICAgICAgIC8vIGlmIG5vIHJlY29nbml6ZXIgaXMgZGV0ZWN0aW5nIGEgdGhpbmcsIGl0IGlzIHNldCB0byBgbnVsbGBcbiAgICAgICAgdmFyIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXI7XG5cbiAgICAgICAgLy8gcmVzZXQgd2hlbiB0aGUgbGFzdCByZWNvZ25pemVyIGlzIHJlY29nbml6ZWRcbiAgICAgICAgLy8gb3Igd2hlbiB3ZSdyZSBpbiBhIG5ldyBzZXNzaW9uXG4gICAgICAgIGlmICghY3VyUmVjb2duaXplciB8fCAoY3VyUmVjb2duaXplciAmJiBjdXJSZWNvZ25pemVyLnN0YXRlICYgU1RBVEVfUkVDT0dOSVpFRCkpIHtcbiAgICAgICAgICAgIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHJlY29nbml6ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmVjb2duaXplciA9IHJlY29nbml6ZXJzW2ldO1xuXG4gICAgICAgICAgICAvLyBmaW5kIG91dCBpZiB3ZSBhcmUgYWxsb3dlZCB0cnkgdG8gcmVjb2duaXplIHRoZSBpbnB1dCBmb3IgdGhpcyBvbmUuXG4gICAgICAgICAgICAvLyAxLiAgIGFsbG93IGlmIHRoZSBzZXNzaW9uIGlzIE5PVCBmb3JjZWQgc3RvcHBlZCAoc2VlIHRoZSAuc3RvcCgpIG1ldGhvZClcbiAgICAgICAgICAgIC8vIDIuICAgYWxsb3cgaWYgd2Ugc3RpbGwgaGF2ZW4ndCByZWNvZ25pemVkIGEgZ2VzdHVyZSBpbiB0aGlzIHNlc3Npb24sIG9yIHRoZSB0aGlzIHJlY29nbml6ZXIgaXMgdGhlIG9uZVxuICAgICAgICAgICAgLy8gICAgICB0aGF0IGlzIGJlaW5nIHJlY29nbml6ZWQuXG4gICAgICAgICAgICAvLyAzLiAgIGFsbG93IGlmIHRoZSByZWNvZ25pemVyIGlzIGFsbG93ZWQgdG8gcnVuIHNpbXVsdGFuZW91cyB3aXRoIHRoZSBjdXJyZW50IHJlY29nbml6ZWQgcmVjb2duaXplci5cbiAgICAgICAgICAgIC8vICAgICAgdGhpcyBjYW4gYmUgc2V0dXAgd2l0aCB0aGUgYHJlY29nbml6ZVdpdGgoKWAgbWV0aG9kIG9uIHRoZSByZWNvZ25pemVyLlxuICAgICAgICAgICAgaWYgKHNlc3Npb24uc3RvcHBlZCAhPT0gRk9SQ0VEX1NUT1AgJiYgKCAvLyAxXG4gICAgICAgICAgICAgICAgICAgICFjdXJSZWNvZ25pemVyIHx8IHJlY29nbml6ZXIgPT0gY3VyUmVjb2duaXplciB8fCAvLyAyXG4gICAgICAgICAgICAgICAgICAgIHJlY29nbml6ZXIuY2FuUmVjb2duaXplV2l0aChjdXJSZWNvZ25pemVyKSkpIHsgLy8gM1xuICAgICAgICAgICAgICAgIHJlY29nbml6ZXIucmVjb2duaXplKGlucHV0RGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlY29nbml6ZXIucmVzZXQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhlIHJlY29nbml6ZXIgaGFzIGJlZW4gcmVjb2duaXppbmcgdGhlIGlucHV0IGFzIGEgdmFsaWQgZ2VzdHVyZSwgd2Ugd2FudCB0byBzdG9yZSB0aGlzIG9uZSBhcyB0aGVcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgYWN0aXZlIHJlY29nbml6ZXIuIGJ1dCBvbmx5IGlmIHdlIGRvbid0IGFscmVhZHkgaGF2ZSBhbiBhY3RpdmUgcmVjb2duaXplclxuICAgICAgICAgICAgaWYgKCFjdXJSZWNvZ25pemVyICYmIHJlY29nbml6ZXIuc3RhdGUgJiAoU1RBVEVfQkVHQU4gfCBTVEFURV9DSEFOR0VEIHwgU1RBVEVfRU5ERUQpKSB7XG4gICAgICAgICAgICAgICAgY3VyUmVjb2duaXplciA9IHNlc3Npb24uY3VyUmVjb2duaXplciA9IHJlY29nbml6ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZ2V0IGEgcmVjb2duaXplciBieSBpdHMgZXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ8TnVsbH1cbiAgICAgKi9cbiAgICBnZXQ6IGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKHJlY29nbml6ZXIgaW5zdGFuY2VvZiBSZWNvZ25pemVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVjb2duaXplcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZWNvZ25pemVycyA9IHRoaXMucmVjb2duaXplcnM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVjb2duaXplcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChyZWNvZ25pemVyc1tpXS5vcHRpb25zLmV2ZW50ID09IHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjb2duaXplcnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGFkZCBhIHJlY29nbml6ZXIgdG8gdGhlIG1hbmFnZXJcbiAgICAgKiBleGlzdGluZyByZWNvZ25pemVycyB3aXRoIHRoZSBzYW1lIGV2ZW50IG5hbWUgd2lsbCBiZSByZW1vdmVkXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ8TWFuYWdlcn1cbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKHJlY29nbml6ZXIsICdhZGQnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZW1vdmUgZXhpc3RpbmdcbiAgICAgICAgdmFyIGV4aXN0aW5nID0gdGhpcy5nZXQocmVjb2duaXplci5vcHRpb25zLmV2ZW50KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShleGlzdGluZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlY29nbml6ZXJzLnB1c2gocmVjb2duaXplcik7XG4gICAgICAgIHJlY29nbml6ZXIubWFuYWdlciA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHJlY29nbml6ZXI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSBhIHJlY29nbml6ZXIgYnkgbmFtZSBvciBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcnxTdHJpbmd9IHJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7TWFuYWdlcn1cbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKHJlY29nbml6ZXIsICdyZW1vdmUnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZWNvZ25pemVyID0gdGhpcy5nZXQocmVjb2duaXplcik7XG5cbiAgICAgICAgLy8gbGV0J3MgbWFrZSBzdXJlIHRoaXMgcmVjb2duaXplciBleGlzdHNcbiAgICAgICAgaWYgKHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgIHZhciByZWNvZ25pemVycyA9IHRoaXMucmVjb2duaXplcnM7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBpbkFycmF5KHJlY29nbml6ZXJzLCByZWNvZ25pemVyKTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlY29nbml6ZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBiaW5kIGV2ZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50c1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICAgKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uKGV2ZW50cywgaGFuZGxlcikge1xuICAgICAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLmhhbmRsZXJzO1xuICAgICAgICBlYWNoKHNwbGl0U3RyKGV2ZW50cyksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBoYW5kbGVyc1tldmVudF0gPSBoYW5kbGVyc1tldmVudF0gfHwgW107XG4gICAgICAgICAgICBoYW5kbGVyc1tldmVudF0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB1bmJpbmQgZXZlbnQsIGxlYXZlIGVtaXQgYmxhbmsgdG8gcmVtb3ZlIGFsbCBoYW5kbGVyc1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudHNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbaGFuZGxlcl1cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbihldmVudHMsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcbiAgICAgICAgZWFjaChzcGxpdFN0cihldmVudHMpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGhhbmRsZXJzW2V2ZW50XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdICYmIGhhbmRsZXJzW2V2ZW50XS5zcGxpY2UoaW5BcnJheShoYW5kbGVyc1tldmVudF0sIGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBlbWl0IGV2ZW50IHRvIHRoZSBsaXN0ZW5lcnNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqL1xuICAgIGVtaXQ6IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgIC8vIHdlIGFsc28gd2FudCB0byB0cmlnZ2VyIGRvbSBldmVudHNcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kb21FdmVudHMpIHtcbiAgICAgICAgICAgIHRyaWdnZXJEb21FdmVudChldmVudCwgZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBubyBoYW5kbGVycywgc28gc2tpcCBpdCBhbGxcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVyc1tldmVudF0gJiYgdGhpcy5oYW5kbGVyc1tldmVudF0uc2xpY2UoKTtcbiAgICAgICAgaWYgKCFoYW5kbGVycyB8fCAhaGFuZGxlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLnR5cGUgPSBldmVudDtcbiAgICAgICAgZGF0YS5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGF0YS5zcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBoYW5kbGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldKGRhdGEpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRlc3Ryb3kgdGhlIG1hbmFnZXIgYW5kIHVuYmluZHMgYWxsIGV2ZW50c1xuICAgICAqIGl0IGRvZXNuJ3QgdW5iaW5kIGRvbSBldmVudHMsIHRoYXQgaXMgdGhlIHVzZXIgb3duIHJlc3BvbnNpYmlsaXR5XG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCAmJiB0b2dnbGVDc3NQcm9wcyh0aGlzLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICAgICAgICB0aGlzLnNlc3Npb24gPSB7fTtcbiAgICAgICAgdGhpcy5pbnB1dC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgfVxufTtcblxuLyoqXG4gKiBhZGQvcmVtb3ZlIHRoZSBjc3MgcHJvcGVydGllcyBhcyBkZWZpbmVkIGluIG1hbmFnZXIub3B0aW9ucy5jc3NQcm9wc1xuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGFkZFxuICovXG5mdW5jdGlvbiB0b2dnbGVDc3NQcm9wcyhtYW5hZ2VyLCBhZGQpIHtcbiAgICB2YXIgZWxlbWVudCA9IG1hbmFnZXIuZWxlbWVudDtcbiAgICBpZiAoIWVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlYWNoKG1hbmFnZXIub3B0aW9ucy5jc3NQcm9wcywgZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgZWxlbWVudC5zdHlsZVtwcmVmaXhlZChlbGVtZW50LnN0eWxlLCBuYW1lKV0gPSBhZGQgPyB2YWx1ZSA6ICcnO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIHRyaWdnZXIgZG9tIGV2ZW50XG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gKi9cbmZ1bmN0aW9uIHRyaWdnZXJEb21FdmVudChldmVudCwgZGF0YSkge1xuICAgIHZhciBnZXN0dXJlRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBnZXN0dXJlRXZlbnQuaW5pdEV2ZW50KGV2ZW50LCB0cnVlLCB0cnVlKTtcbiAgICBnZXN0dXJlRXZlbnQuZ2VzdHVyZSA9IGRhdGE7XG4gICAgZGF0YS50YXJnZXQuZGlzcGF0Y2hFdmVudChnZXN0dXJlRXZlbnQpO1xufVxuXG5hc3NpZ24oSGFtbWVyLCB7XG4gICAgSU5QVVRfU1RBUlQ6IElOUFVUX1NUQVJULFxuICAgIElOUFVUX01PVkU6IElOUFVUX01PVkUsXG4gICAgSU5QVVRfRU5EOiBJTlBVVF9FTkQsXG4gICAgSU5QVVRfQ0FOQ0VMOiBJTlBVVF9DQU5DRUwsXG5cbiAgICBTVEFURV9QT1NTSUJMRTogU1RBVEVfUE9TU0lCTEUsXG4gICAgU1RBVEVfQkVHQU46IFNUQVRFX0JFR0FOLFxuICAgIFNUQVRFX0NIQU5HRUQ6IFNUQVRFX0NIQU5HRUQsXG4gICAgU1RBVEVfRU5ERUQ6IFNUQVRFX0VOREVELFxuICAgIFNUQVRFX1JFQ09HTklaRUQ6IFNUQVRFX1JFQ09HTklaRUQsXG4gICAgU1RBVEVfQ0FOQ0VMTEVEOiBTVEFURV9DQU5DRUxMRUQsXG4gICAgU1RBVEVfRkFJTEVEOiBTVEFURV9GQUlMRUQsXG5cbiAgICBESVJFQ1RJT05fTk9ORTogRElSRUNUSU9OX05PTkUsXG4gICAgRElSRUNUSU9OX0xFRlQ6IERJUkVDVElPTl9MRUZULFxuICAgIERJUkVDVElPTl9SSUdIVDogRElSRUNUSU9OX1JJR0hULFxuICAgIERJUkVDVElPTl9VUDogRElSRUNUSU9OX1VQLFxuICAgIERJUkVDVElPTl9ET1dOOiBESVJFQ1RJT05fRE9XTixcbiAgICBESVJFQ1RJT05fSE9SSVpPTlRBTDogRElSRUNUSU9OX0hPUklaT05UQUwsXG4gICAgRElSRUNUSU9OX1ZFUlRJQ0FMOiBESVJFQ1RJT05fVkVSVElDQUwsXG4gICAgRElSRUNUSU9OX0FMTDogRElSRUNUSU9OX0FMTCxcblxuICAgIE1hbmFnZXI6IE1hbmFnZXIsXG4gICAgSW5wdXQ6IElucHV0LFxuICAgIFRvdWNoQWN0aW9uOiBUb3VjaEFjdGlvbixcblxuICAgIFRvdWNoSW5wdXQ6IFRvdWNoSW5wdXQsXG4gICAgTW91c2VJbnB1dDogTW91c2VJbnB1dCxcbiAgICBQb2ludGVyRXZlbnRJbnB1dDogUG9pbnRlckV2ZW50SW5wdXQsXG4gICAgVG91Y2hNb3VzZUlucHV0OiBUb3VjaE1vdXNlSW5wdXQsXG4gICAgU2luZ2xlVG91Y2hJbnB1dDogU2luZ2xlVG91Y2hJbnB1dCxcblxuICAgIFJlY29nbml6ZXI6IFJlY29nbml6ZXIsXG4gICAgQXR0clJlY29nbml6ZXI6IEF0dHJSZWNvZ25pemVyLFxuICAgIFRhcDogVGFwUmVjb2duaXplcixcbiAgICBQYW46IFBhblJlY29nbml6ZXIsXG4gICAgU3dpcGU6IFN3aXBlUmVjb2duaXplcixcbiAgICBQaW5jaDogUGluY2hSZWNvZ25pemVyLFxuICAgIFJvdGF0ZTogUm90YXRlUmVjb2duaXplcixcbiAgICBQcmVzczogUHJlc3NSZWNvZ25pemVyLFxuXG4gICAgb246IGFkZEV2ZW50TGlzdGVuZXJzLFxuICAgIG9mZjogcmVtb3ZlRXZlbnRMaXN0ZW5lcnMsXG4gICAgZWFjaDogZWFjaCxcbiAgICBtZXJnZTogbWVyZ2UsXG4gICAgZXh0ZW5kOiBleHRlbmQsXG4gICAgYXNzaWduOiBhc3NpZ24sXG4gICAgaW5oZXJpdDogaW5oZXJpdCxcbiAgICBiaW5kRm46IGJpbmRGbixcbiAgICBwcmVmaXhlZDogcHJlZml4ZWRcbn0pO1xuXG4vLyB0aGlzIHByZXZlbnRzIGVycm9ycyB3aGVuIEhhbW1lciBpcyBsb2FkZWQgaW4gdGhlIHByZXNlbmNlIG9mIGFuIEFNRFxuLy8gIHN0eWxlIGxvYWRlciBidXQgYnkgc2NyaXB0IHRhZywgbm90IGJ5IHRoZSBsb2FkZXIuXG52YXIgZnJlZUdsb2JhbCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6ICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDoge30pKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5mcmVlR2xvYmFsLkhhbW1lciA9IEhhbW1lcjtcblxuaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEhhbW1lcjtcbiAgICB9KTtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gSGFtbWVyO1xufSBlbHNlIHtcbiAgICB3aW5kb3dbZXhwb3J0TmFtZV0gPSBIYW1tZXI7XG59XG5cbn0pKHdpbmRvdywgZG9jdW1lbnQsICdIYW1tZXInKTtcbiIsInZhciBwb3N0R3JhcGhpY3NUZW1wbGF0ZSA9IHJlcXVpcmUoJy4vcGctdGVtcGxhdGUvcG9zdEdyYXBoaWNzVGVtcGxhdGUuanMnKTtcblxuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gQWxsIHV0aWxpdHkgZnVuY3Rpb25zIHNob3VsZCBhdHRhY2ggdGhlbXNlbHZlcyB0byB0aGlzIG9iamVjdC5cbiAgICB2YXIgdXRpbCA9IHt9O1xuXG4gICAgLy8gVGhpcyBjb2RlIGFzc3VtZXMgaXQgaXMgcnVubmluZyBpbiBhIGJyb3dzZXIgY29udGV4dFxuICAgIHdpbmRvdy5UV1AgPSB3aW5kb3cuVFdQIHx8IHtcbiAgICAgICAgTW9kdWxlOiB7fVxuICAgIH07XG4gICAgd2luZG93LlRXUC5Nb2R1bGUgPSB3aW5kb3cuVFdQLk1vZHVsZSB8fCB7fTtcbiAgICB3aW5kb3cuVFdQLk1vZHVsZS51dGlsID0gdXRpbDtcblxuICAgIGlmICghdXRpbC5nZXRQYXJhbWV0ZXJzIHx8IHR5cGVvZiB1dGlsLmdldFBhcmFtZXRlcnMgPT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgdXRpbC5nZXRQYXJhbWV0ZXJzID0gZnVuY3Rpb24odXJsKXtcbiAgICAgICAgICAgIHZhciBwYXJhbUxpc3QgPSBbXSxcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB7fSxcbiAgICAgICAgICAgICAgICBrdlBhaXJzLFxuICAgICAgICAgICAgICAgIHRtcDtcbiAgICAgICAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgICAgICAgICBpZiAodXJsLmluZGV4T2YoJz8nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1MaXN0ID0gdXJsLnNwbGl0KCc/JylbMV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbUxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbUxpc3QuaW5kZXhPZignJicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga3ZQYWlycyA9IHBhcmFtTGlzdC5zcGxpdCgnJicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrdlBhaXJzID0gW3BhcmFtTGlzdF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhID0gMDsgYSA8IGt2UGFpcnMubGVuZ3RoOyBhKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa3ZQYWlyc1thXS5pbmRleE9mKCc9JykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRtcCA9IGt2UGFpcnNbYV0uc3BsaXQoJz0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zW3RtcFswXV0gPSB1bmVzY2FwZSh0bXBbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBoZWlnaHQgb2YgdGhlIGlmcmFtZSBpZiB0aGlzIHBhZ2UgaXMgaWZyYW1lJ2QuXG4gICAgLy8gTk9URTogVGhpcyAqKnJlcXVpcmVzKiogdGhlIGlmcmFtZSdzIHNyYyBwcm9wZXJ0eSB0byB1c2UgYSBsb2NhdGlvblxuICAgIC8vIHdpdGhvdXQgaXRzIHByb3RvY29sLiBVc2luZyBhIHByb3RvY29sIHdpbGwgbm90IHdvcmsuXG4gICAgLy9cbiAgICAvLyBlLmcuIDxpZnJhbWUgZnJhbWVib3JkZXI9XCIwXCIgc2Nyb2xsaW5nPVwibm9cIiBzdHlsZT1cIndpZHRoOiAxMDAlOyBoZWlnaHQ6NjAwcHg7XCIgc3JjPVwiLy93d3cud2FzaGluZ3RvbnBvc3QuY29tL2dyYXBoaWNzL25hdGlvbmFsL2NlbnN1cy1jb21tdXRlLW1hcC8/dGVtcGxhdGU9aWZyYW1lXCI+PC9pZnJhbWU+XG4gICAgdXRpbC5jaGFuZ2VJZnJhbWVIZWlnaHQgPSBmdW5jdGlvbigpe1xuICAgICAgICAvLyBMb2NhdGlvbiAqd2l0aG91dCogcHJvdG9jb2wgYW5kIHNlYXJjaCBwYXJhbWV0ZXJzXG4gICAgICAgIHZhciBwYXJ0aWFsTG9jYXRpb24gPSAod2luZG93LmxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCwgJycpKSArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcblxuICAgICAgICAvLyBCdWlsZCB1cCBhIHNlcmllcyBvZiBwb3NzaWJsZSBDU1Mgc2VsZWN0b3Igc3RyaW5nc1xuICAgICAgICB2YXIgc2VsZWN0b3JzID0gW107XG5cbiAgICAgICAgLy8gQWRkIHRoZSBVUkwgYXMgaXQgaXMgKGFkZGluZyBpbiB0aGUgc2VhcmNoIHBhcmFtZXRlcnMpXG4gICAgICAgIHNlbGVjdG9ycy5wdXNoKCdpZnJhbWVbc3JjPVwiJyArIHBhcnRpYWxMb2NhdGlvbiArIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggKyAnXCJdJyk7XG5cbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZVt3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUubGVuZ3RoIC0gMV0gPT09ICcvJykge1xuICAgICAgICAgICAgLy8gSWYgdGhlIFVSTCBoYXMgYSB0cmFpbGluZyBzbGFzaCwgYWRkIGEgdmVyc2lvbiB3aXRob3V0IGl0XG4gICAgICAgICAgICAvLyAoYWRkaW5nIGluIHRoZSBzZWFyY2ggcGFyYW1ldGVycylcbiAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKCdpZnJhbWVbc3JjPVwiJyArIChwYXJ0aWFsTG9jYXRpb24uc2xpY2UoMCwgLTEpICsgd2luZG93LmxvY2F0aW9uLnNlYXJjaCkgKyAnXCJdJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgVVJMIGRvZXMgKm5vdCogaGF2ZSBhIHRyYWlsaW5nIHNsYXNoLCBhZGQgYSB2ZXJzaW9uIHdpdGhcbiAgICAgICAgICAgIC8vIGl0IChhZGRpbmcgaW4gdGhlIHNlYXJjaCBwYXJhbWV0ZXJzKVxuICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2goJ2lmcmFtZVtzcmM9XCInICsgcGFydGlhbExvY2F0aW9uICsgJy8nICsgd2luZG93LmxvY2F0aW9uLnNlYXJjaCArICdcIl0nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNlYXJjaCBmb3IgdGhvc2Ugc2VsZWN0b3JzIGluIHRoZSBwYXJlbnQgcGFnZSwgYW5kIGFkanVzdCB0aGUgaGVpZ2h0XG4gICAgICAgIC8vIGFjY29yZGluZ2x5LlxuICAgICAgICB2YXIgJGlmcmFtZSA9ICQod2luZG93LnRvcC5kb2N1bWVudCkuZmluZChzZWxlY3RvcnMuam9pbignLCcpKTtcbiAgICAgICAgdmFyIGggPSAkKCdib2R5Jykub3V0ZXJIZWlnaHQodHJ1ZSk7XG4gICAgICAgICRpZnJhbWUuY3NzKHsnaGVpZ2h0JyA6IGggKyAncHgnfSk7XG4gICAgfTtcblxuICAgIC8vIGZyb20gaHR0cDovL2Rhdmlkd2Fsc2gubmFtZS9qYXZhc2NyaXB0LWRlYm91bmNlLWZ1bmN0aW9uXG4gICAgdXRpbC5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgICAgICB2YXIgdGltZW91dDtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICAgICAgICBpZiAoY2FsbE5vdykgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGlmcmFtZSBjb2RlXG4gICAgICAgIHZhciBwYXJhbXMgPSB1dGlsLmdldFBhcmFtZXRlcnMoZG9jdW1lbnQuVVJMKTtcbiAgICAgICAgaWYgKHBhcmFtc1sndGVtcGxhdGUnXSAmJiBwYXJhbXNbJ3RlbXBsYXRlJ10gPT09ICdpZnJhbWUnKSB7XG4gICAgICAgICAgICAvLyBUT0RPIFdoeSBkbyB3ZSBuZWVkIHRoaXM/IE5vYm9keSBrbm93cy5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZG9tYWluID0gJ3dhc2hpbmd0b25wb3N0LmNvbSc7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdpZnJhbWUnKS5zaG93KCkuY3NzKCdkaXNwbGF5JywnYmxvY2snKTtcbiAgICAgICAgICAgIGlmIChwYXJhbXNbJ2dyYXBoaWNfaWQnXSl7XG4gICAgICAgICAgICAgICAgJCgnIycgKyBwYXJhbXNbJ2dyYXBoaWNfaWQnXSkuc2libGluZ3MoKS5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKCcjcGdjb250ZW50LCAucGdBcnRpY2xlJykuc2libGluZ3MoKS5oaWRlKCk7XG5cbiAgICAgICAgICAgIC8vIENPUlMgbGltaXRhdGlvbnNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gd2luZG93LnRvcC5sb2NhdGlvbi5ob3N0bmFtZSl7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNpemVJZnJhbWUgPSB1dGlsLmRlYm91bmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbC5jaGFuZ2VJZnJhbWVIZWlnaHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMjUwKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyByZXNwb25zaXZlIHBhcnRcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyBXaHkgMTAwMG1zPyBUaGlzIGlzIG5vdCByZWxpYWJsZS5cbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlsLmNoYW5nZUlmcmFtZUhlaWdodCgpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxMDAwKTtcblxuICAgICAgICAgICAgICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHJlc2l6ZUlmcmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxufS5jYWxsKHRoaXMpKTtcbiIsInZhciBIYW1tZXIgPSByZXF1aXJlKCdoYW1tZXJqcycpO1xuXG4oZnVuY3Rpb24gKCQsIHdpbmRvdywgdW5kZWZpbmVkKSB7XG5cbiAgICAvKlxuICAgICAqIGV4dGVuZCBqUXVlcnkgZm9yIG5pY2VyIHN5bnRheCBmb3IgcmVuZGVyaW5nIG91ciBtZW51cyBhbmQgbGlzdHMuXG4gICAgICovXG4gICAgLy91cGRhdGUgPGxpPnMgZnJvbSBqc29uXG5cbiAgICB2YXIgX19pc0lFID0gJCgnaHRtbC5pZScpLmxlbmd0aCA/IHRydWUgOiBmYWxzZTtcblxuXG4gICAgJC5mbi5hcHBlbmRMaW5rSXRlbXMgPSBmdW5jdGlvbihsaW5rcywgc3Vycm91bmRpbmdUYWcpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBzdXJyb3VuZGluZ1RhZyA9IHN1cnJvdW5kaW5nVGFnIHx8IFwiPGxpPlwiO1xuICAgICAgICAkLmVhY2gobGlua3MsIGZ1bmN0aW9uKGksIGxpbmspIHtcbiAgICAgICAgICAgIHZhciBhID0gJChcIjxhPlwiKTtcbiAgICAgICAgICAgIGlmIChsaW5rLnRpdGxlKSB7IGEudGV4dChsaW5rLnRpdGxlKTsgfVxuICAgICAgICAgICAgaWYgKGxpbmsuaHRtbCkgeyBhLmh0bWwobGluay5odG1sKTsgfVxuICAgICAgICAgICAgaWYgKGxpbmsuaHJlZikgeyBhLmF0dHIoXCJocmVmXCIsIGxpbmsuaHJlZik7IH1cbiAgICAgICAgICAgIGlmIChsaW5rLmF0dHIpIHsgYS5hdHRyKGxpbmsuYXR0cik7IH1cbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKFxuICAgICAgICAgICAgICAgICQoc3Vycm91bmRpbmdUYWcpLmFwcGVuZChhKS5hZGRDbGFzcyhsaW5rLnNlbGVjdGVkID8gXCJzZWxlY3RlZFwiIDogXCJcIilcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgJC5mbi50cmFja0NsaWNrID0gZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIGVsZW1lbnQub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBsaW5rbmFtZTtcbiAgICAgICAgICAgIHZhciBsaW5rID0gJCh0aGlzKTtcbiAgICAgICAgICAgIGlmICghIXdpbmRvdy5zICYmIHR5cGVvZiBzLnNlbmREYXRhVG9PbW5pdHVyZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgbGlua25hbWUgPSAoXCJwYm5hdjpcIiArIHR5cGUgKyBcIiAtIFwiICsgICQudHJpbShsaW5rLnRleHQoKSkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgcy5zZW5kRGF0YVRvT21uaXR1cmUobGlua25hbWUsICcnLCB7XG4gICAgICAgICAgICAgICAgICAgIFwiY2hhbm5lbFwiOiBzLmNoYW5uZWwsXG4gICAgICAgICAgICAgICAgICAgIFwicHJvcDI4XCI6IGxpbmtuYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgJC5mbi50cmFja1NoYXJlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBlbGVtZW50Lm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbGluayA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgdHlwZSA9IGxpbmsuYXR0cihcImRhdGEtc2hhcmUtdHlwZVwiKTtcbiAgICAgICAgICAgIGlmICghIXdpbmRvdy5zICYmIHR5cGVvZiBzLnNlbmREYXRhVG9PbW5pdHVyZSA9PSAnZnVuY3Rpb24nICYmIHR5cGUpIHtcbiAgICAgICAgICAgICAgICBzLnNlbmREYXRhVG9PbW5pdHVyZSgnc2hhcmUuJyArIHR5cGUsICdldmVudDYnLCB7IGVWYXIyNzogdHlwZSB9KTsgXG4gICAgICAgICAgICB9ICBcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAkLmZuLm1ha2VEcm9wZG93biA9IGZ1bmN0aW9uIChtZW51RWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgICB2YXIgY2xpY2tFbGVtZW50ID0gdGhpcztcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIG9wdGlvbnMuZGlzYWJsZWQgPSBmYWxzZTtcblxuICAgICAgICAvL2RlZmF1bHQgYmVoYXZpb3IgZm9yIGRyb3Bkb3duXG4gICAgICAgIHZhciBkb3duID0gb3B0aW9ucy5kb3duIHx8IGZ1bmN0aW9uIChfY2xpY2tFbGVtZW50LCBfbWVudUVsZW1lbnQpIHtcbiAgICAgICAgICAgIG5hdi5jbG9zZURyb3Bkb3ducygpO1xuICAgICAgICAgICAgX2NsaWNrRWxlbWVudC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICQoXCIubGVhZGVyYm9hcmRcIikuYWRkQ2xhc3MoXCJoaWRlQWRcIik7XG4gICAgICAgICAgICB2YXIgd2luZG93SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gNTA7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuY3NzKFwiaGVpZ2h0XCIsXCJcIik7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuY3NzKFwiaGVpZ2h0XCIsICh3aW5kb3dIZWlnaHQgPD0gX21lbnVFbGVtZW50LmhlaWdodCgpKSA/IHdpbmRvd0hlaWdodCA6IFwiYXV0b1wiKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5jc3MoXCJ3aWR0aFwiLCBfY2xpY2tFbGVtZW50Lm91dGVyV2lkdGgoKSApO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmNzcyhcImxlZnRcIiwgX2NsaWNrRWxlbWVudC5vZmZzZXQoKS5sZWZ0ICk7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuc2xpZGVEb3duKCdmYXN0Jyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHVwID0gb3B0aW9ucy51cCB8fCBmdW5jdGlvbiAoX2NsaWNrRWxlbWVudCwgX21lbnVFbGVtZW50KSB7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuc2xpZGVVcCgnZmFzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfY2xpY2tFbGVtZW50LnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgICAgICQoXCIubGVhZGVyYm9hcmRcIikucmVtb3ZlQ2xhc3MoXCJoaWRlQWRcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBjbGlja0VsZW1lbnQuY2xpY2soZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiggIW9wdGlvbnMuZGlzYWJsZWQgKXtcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAvL2V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgLy9BbmQgSSB1c2VkIHRvIHRoaW5rIGllOSB3YXMgYSBnb29kIGJyb3dzZXIuLi5cbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCA/IGV2ZW50LnByZXZlbnREZWZhdWx0KCkgOiBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1lbnVFbGVtZW50LmZpbmQoXCJsaVwiKS5sZW5ndGggPT0gMCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYoY2xpY2tFbGVtZW50LmlzKFwiLmFjdGl2ZVwiKSl7XG4gICAgICAgICAgICAgICAgICAgIHVwKGNsaWNrRWxlbWVudCwgbWVudUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRvd24oY2xpY2tFbGVtZW50LCBtZW51RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmKCFfX2lzSUUpe1xuICAgICAgICAgICAgdmFyIGhhbW1lcnRpbWUgPSBuZXcgSGFtbWVyKGNsaWNrRWxlbWVudFswXSwgeyBwcmV2ZW50X21vdXNlZXZlbnRzOiB0cnVlIH0pO1xuICAgICAgICAgICAgaGFtbWVydGltZS5vbihcInRhcFwiLGhhbmRsZVRhcCk7XG59XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvL21vdmUgaGVhZGVyIGZlYXR1cmUgb3V0c2lkZSBvZiBwYi1jb250YWluZXIsIHNvIHRoYXQgdGhlIG1lbnUgc2xpZGluZyBhbmltYXRpb24gY2FuIHdvcmtcbiAgICAvLyBpZiggJChcIiNwYi1yb290IC5wYi1mLXBhZ2UtaGVhZGVyLXYyXCIpLmxlbmd0aCAmJiAoJChcIiNwYi1yb290IC5wYi1mLXBhZ2UtaGVhZGVyLXYyXCIpLnNpYmxpbmdzKFwiLnBiLWZlYXR1cmVcIikubGVuZ3RoIHx8ICQoXCIjcGItcm9vdCAucGItZi1wYWdlLWhlYWRlci12MlwiKS5zaWJsaW5ncyhcIi5wYi1jb250YWluZXJcIikubGVuZ3RoKSApIHtcbiAgICAvLyAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgICAgICAgIHZhciAkaGVhZGVyID0gJChcIi5wYi1mLXBhZ2UtaGVhZGVyLXYyXCIpO1xuICAgIC8vICAgICAgICAgJChcIi5wYi1mLXBhZ2UtaGVhZGVyLXYyIHNjcmlwdFwiKS5yZW1vdmUoKTtcbiAgICAvLyAgICAgICAgICQoXCIjcGItcm9vdFwiKS5iZWZvcmUoICRoZWFkZXIgKTtcbiAgICAvLyAgICAgfSgpKTtcbiAgICAvLyB9XG5cbiAgICAvL2xvYWQgdGhlIGFkIGFmdGVyIHRoZSBoZWFkZXIgaGFzIGJlZW4gbW92ZWQsIHNvIGl0IGRvZXNuJ3QgbG9hZCB0d2ljZS4gbm8gY2FsbGJhY2sgb24gYWQgc2NyaXB0cywgc28gaGF2ZSB0byBzZXQgYW4gaW50ZXJ2YWwgdG8gY2hlY2tcbiAgICAvLyBpZiggJChcIiNuYXYtYWQ6dmlzaWJsZVwiKS5sZW5ndGggKXtcbiAgICAvLyAgICAgdmFyIGFkSW50ZXJ2YWxUaW1lb3V0ID0gMTA7IC8vb25seSB0cnkgdGhpcyBmb3IgZml2ZSBzZWNvbmRzLCBvciBkZWFsIHdpdGggaXRcbiAgICAvLyAgICAgdmFyIGFkSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuICAgIC8vICAgICAgICAgaWYoIHR5cGVvZihwbGFjZUFkMikgIT0gXCJ1bmRlZmluZWRcIiApe1xuICAgIC8vICAgICAgICAgICAgICQoXCIjd3BuaV9hZGlfODh4MzFcIikuYXBwZW5kKHBsYWNlQWQyKGNvbW1lcmNpYWxOb2RlLCc4OHgzMScsZmFsc2UsJycpKTsgICAgXG4gICAgLy8gICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChhZEludGVydmFsKVxuICAgIC8vICAgICAgICAgfSAgICBcbiAgICAvLyAgICAgICAgIGlmIChhZEludGVydmFsVGltZW91dCA9PSAwKSBjbGVhckludGVydmFsKGFkSW50ZXJ2YWwpO1xuICAgIC8vICAgICAgICAgYWRJbnRlcnZhbFRpbWVvdXQtLTtcbiAgICAvLyAgICAgfSwgNTAwKTtcbiAgICAvLyB9XG5cbiAgICAvL2FkZCB0cmFja2luZ1xuICAgIC8vICQoXCIjc2l0ZS1tZW51IGFcIikudHJhY2tDbGljayhcIm1haW5cIik7XG4gICAgLy8gJChcIiNzaGFyZS1tZW51IGFcIikudHJhY2tTaGFyZSgpO1xuXG4gICAgLy9hY3RpdmF0ZSBkcm9wZG93bnNcbiAgICAkKFwiI3dwLWhlYWRlciAubmF2LWJ0bltkYXRhLW1lbnVdXCIpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcImRyb3Bkb3duLXRyaWdnZXJcIik7XG4gICAgICAgICQodGhpcykubWFrZURyb3Bkb3duKCAkKFwiI1wiICsgJCh0aGlzKS5kYXRhKFwibWVudVwiKSApICk7XG4gICAgfSk7XG5cbiAgICAvL2FjdGl2YXRlIHNpdGUgbWVudSB3aXRoIGN1c3RvbSBhY3Rpb25zXG4gICAgJChcIiNzaXRlLW1lbnUtYnRuXCIpLm1ha2VEcm9wZG93biggJChcIiNzaXRlLW1lbnVcIiksIHtcbiAgICAgICAgZG93bjogZnVuY3Rpb24oX2NsaWNrRWxlbWVudCwgX21lbnVFbGVtZW50KXtcbiAgICAgICAgICAgIG5hdi5jbG9zZURyb3Bkb3ducygpO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmNzcyhcImhlaWdodFwiLCB3aW5kb3cub3V0ZXJIZWlnaHQgLSA1MCk7XG4gICAgICAgICAgICAkKFwiYm9keVwiKS5hZGRDbGFzcyggKCQoXCIjcGItcm9vdCAucGItZi1wYWdlLWhlYWRlci12MlwiKS5sZW5ndGgpID8gXCJsZWZ0LW1lbnVcIiA6IFwibGVmdC1tZW51IGxlZnQtbWVudS1wYlwiICk7XG4gICAgICAgICAgICBfY2xpY2tFbGVtZW50LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgJCgnLnBiSGVhZGVyJykudG9nZ2xlQ2xhc3MoJ25vdC1maXhlZCcpO1xuICAgICAgICB9LFxuICAgICAgICB1cDogZnVuY3Rpb24oX2NsaWNrRWxlbWVudCwgX21lbnVFbGVtZW50KXtcbiAgICAgICAgICAgICQoXCJib2R5XCIpLnJlbW92ZUNsYXNzKFwibGVmdC1tZW51XCIpLnJlbW92ZUNsYXNzKFwibGVmdC1tZW51LXBiXCIpO1xuICAgICAgICAgICAgX2NsaWNrRWxlbWVudC5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICQoJy5wYkhlYWRlcicpLnRvZ2dsZUNsYXNzKCdub3QtZml4ZWQnKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGhhbW1lcnRpbWUgPSBuZXcgSGFtbWVyKCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNpdGUtbWVudVwiKSwge1xuICAgICAgICBkcmFnTG9ja1RvQXhpczogdHJ1ZSxcbiAgICAgICAgZHJhZ0Jsb2NrSG9yaXpvbnRhbDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgaGFtbWVydGltZS5vbiggXCJkcmFnbGVmdCBzd2lwZWxlZnRcIiwgZnVuY3Rpb24oZXYpeyBcbiAgICAgICAgZXYuZ2VzdHVyZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvL2V2Lmdlc3R1cmUucHJldmVudERlZmF1bHQgPyBldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0KCkgOiBldi5nZXN0dXJlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIGV2Lmdlc3R1cmUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmKCBldi5nZXN0dXJlLmRpcmVjdGlvbiA9PSBcImxlZnRcIiAmJiAkKFwiYm9keVwiKS5pcyhcIi5sZWZ0LW1lbnVcIikgKXtcbiAgICAgICAgICAgICQoXCIjc2l0ZS1tZW51LWJ0blwiKS5jbGljaygpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKiBzZWFyY2gtc3BlY2lmaWMgbWFuaXB1bGF0aW9uICovXG4gICAgJChcIi5pb3MgI25hdi1zZWFyY2gtbW9iaWxlIGlucHV0XCIpLmZvY3VzKGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCJoZWFkZXJcIikuY3NzKFwicG9zaXRpb25cIixcImFic29sdXRlXCIpLmNzcyhcInRvcFwiLHdpbmRvdy5wYWdlWU9mZnNldCk7XG4gICAgfSkuYmx1cihmdW5jdGlvbigpe1xuICAgICAgICAkKFwiaGVhZGVyXCIpLmNzcyhcInBvc2l0aW9uXCIsXCJmaXhlZFwiKS5jc3MoXCJ0b3BcIiwwKTtcbiAgICB9KTtcblxuICAgIC8vdHJpZ2dlciB3aW5kb3cgcmVzaXplIHdoZW4gbW9iaWxlIGtleWJvYXJkIGhpZGVzXG4gICAgJChcIiNuYXYtc2VhcmNoLW1vYmlsZSBpbnB1dFwiKS5ibHVyKGZ1bmN0aW9uKCl7XG4gICAgICAgICQoIHdpbmRvdyApLnJlc2l6ZSgpO1xuICAgIH0pO1xuXG4gICAgJChkb2N1bWVudCkua2V5dXAoZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBJZiB5b3UgcHJlc3MgRVNDIHdoaWxlIGluIHRoZSBzZWFyY2ggaW5wdXQsIHlvdSBzaG91bGQgcmVtb3ZlIGZvY3VzIGZyb20gdGhlIGlucHV0XG4gICAgICAgIGlmIChlLmtleUNvZGUgPT0gMjcgJiYgJChcIiNuYXYtc2VhcmNoIGlucHV0W3R5cGU9dGV4dF1cIikuaXMoXCI6Zm9jdXNcIikpIHtcbiAgICAgICAgICAgICQoXCIjbmF2LXNlYXJjaCBpbnB1dFt0eXBlPXRleHRdXCIpLmJsdXIoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJChcIiNuYXYtc2VhcmNoLCNuYXYtc2VhcmNoLW1vYmlsZVwiKS5zdWJtaXQoZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKHRoaXMpLmZpbmQoJ2lucHV0W3R5cGU9dGV4dF0nKS52YWwoKSkge1xuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgIHMuc2VuZERhdGFUb09tbml0dXJlKCdTZWFyY2ggU3VibWl0JywnZXZlbnQyJyx7J2VWYXIzOCc6JCh0aGlzKS5maW5kKCdpbnB1dFt0eXBlPXRleHRdJykudmFsKCksJ2VWYXIxJzpzLnBhZ2VOYW1lfSk7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHt9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLypcbiAgICAgKiBDTElFTlQgU0lERSBBUEkgZm9yIENVU1RPTUlaSU5HIHRoZSBIRUFERVJcbiAgICAgKi9cblxuICAgIC8vIFRoZXJlIHNob3VsZCBvbmx5IGJlIG9uZSBuYXZpZ2F0aW9uIHBlciBwYWdlLiBTbyBvdXIgbmF2aWdhdGlvbiBvYmplY3QgaXMgYSBzaW5nbGV0b24uXG4gICAgLy8gSGVhdnkgZGVwZW5kZW5jeSBvbiBqUXVlcnlcbiAgICB2YXIgY29yZSA9IHdpbmRvdy53cF9wYiA9IHdpbmRvdy53cF9wYiB8fCB7fTtcbiAgICB2YXIgbmF2ID0gY29yZS5uYXYgPSBjb3JlLm5hdiB8fCB7fTtcbiAgICB2YXIgZGVwcmVjYXRlZCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgbmF2LnNldFNlYXJjaCA9IG5hdi5zaG93VG9wTWVudSA9IG5hdi5oaWRlVG9wTWVudSA9IG5hdi5zaG93UHJpbWFyeUxpbmtzID1cbiAgICBuYXYuaGlkZVByaW1hcnlMaW5rcyA9IG5hdi5zaG93SW5UaGVOZXdzID0gbmF2LmhpZGVJblRoZU5ld3MgPSBuYXYuc2hvd0FkU2x1ZyA9XG4gICAgbmF2LmhpZGVBZFNsdWcgPSBuYXYuc2hvd1NlY3Rpb25OYW1lID0gbmF2LmhpZGVTZWN0aW9uTmFtZSA9XG4gICAgbmF2LnNldE1haW5NZW51ID0gbmF2LnNldFNlY3Rpb25NZW51ID0gbmF2LnNldFNlY3Rpb25OYW1lID0gZGVwcmVjYXRlZDtcblxuICAgIG5hdi5zaG93SWRlbnRpdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG5hdi5yZW5kZXJJZGVudGl0eSgpO1xuICAgICAgICBzaG93SWRlbnRpdHkgPSB0cnVlO1xuICAgIH07XG5cbiAgICBuYXYuaGlkZUlkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkKFwiI25hdi11c2VyXCIpLmhpZGUoKTtcbiAgICAgICAgJChcIm5hdi1zaWduLWluXCIpLmhpZGUoKTtcbiAgICAgICAgc2hvd0lkZW50aXR5ID0gZmFsc2U7XG4gICAgfTtcblxuICAgIG5hdi5zaG93U2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkKFwiI25hdi1zZWFyY2hcIikuc2hvdygpO1xuICAgIH07XG5cbiAgICBuYXYuaGlkZVNlYXJjaCA9IGZ1bmN0aW9uICgpIHsgXG4gICAgICAgICQoXCIjbmF2LXNlYXJjaFwiKS5oaWRlKCk7IFxuICAgIH07XG5cbiAgICBuYXYuc2hvd1N1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChcIiNuYXYtc3Vic2NyaXB0aW9uXCIpLnNob3coKTtcbiAgICB9O1xuXG4gICAgbmF2LmhpZGVTdWJzY3JpcHRpb24gPSBmdW5jdGlvbiAoKSB7IFxuICAgICAgICAkKFwiI25hdi1zdWJzY3JpcHRpb25cIikuaGlkZSgpOyBcbiAgICB9O1xuICAgIFxuICAgIHZhciBzZXRNZW51ID0gZnVuY3Rpb24gKGVsZW0sIG1lbnUpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSAkKGVsZW0pO1xuICAgICAgICBlbGVtZW50LmNoaWxkcmVuKCdsaScpLnJlbW92ZSgpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZExpbmtJdGVtcyhtZW51KTtcbiAgICB9O1xuXG4gICAgbmF2LnNldElkZW50aXR5TWVudSA9IGZ1bmN0aW9uIChtZW51KSB7XG4gICAgICAgIHNldE1lbnUoXCIjdXNlci1tZW51IHVsXCIsIG1lbnUpO1xuICAgIH07XG5cbiAgICBuYXYuc2V0UGFnZVRpdGxlID0gZnVuY3Rpb24obmFtZSl7XG4gICAgICAgICQoJyNuYXYtcGFnZS10aXRsZScpLnRleHQobmFtZSk7XG4gICAgICAgICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCd0aXRsZScsIG5hbWUpO1xuICAgIH07XG5cbiAgICBuYXYuc2V0U2hhcmVVcmwgPSBmdW5jdGlvbih1cmwpe1xuICAgICAgICAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgncGVybWFsaW5rJyx1cmwpO1xuICAgIH07XG5cbiAgICBuYXYuc2V0VHdpdHRlckhhbmRsZSA9IGZ1bmN0aW9uKGhhbmRsZSl7XG4gICAgICAgIGlmKCQoJyNzaGFyZS1tZW51IGFbZGF0YS1zaGFyZS10eXBlPVwiVHdpdHRlclwiXScpLmxlbmd0aCl7XG4gICAgICAgICAgICAkKCcjc2hhcmUtbWVudSBhW2RhdGEtc2hhcmUtdHlwZT1cIlR3aXR0ZXJcIl0nKS5kYXRhKCd0d2l0dGVyLWhhbmRsZScsIGhhbmRsZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbmF2LmNsb3NlRHJvcGRvd25zID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJChcIiN3cC1oZWFkZXIgLmRyb3Bkb3duLXRyaWdnZXIuYWN0aXZlXCIpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICAkKFwiI1wiKyQodGhpcykuZGF0YShcIm1lbnVcIikpLmhpZGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoXCIubGVhZGVyYm9hcmRcIikucmVtb3ZlQ2xhc3MoXCJoaWRlQWRcIik7XG4gICAgfVxuXG5cbiAgICB2YXIgc2Nyb2xsRXZlbnRzID0ge30sXG4gICAgICAgIHNjcm9sbFBvcyA9ICQodGhpcykuc2Nyb2xsVG9wKCk7XG5cbiAgICB2YXIgZm9yY2VPcGVuID0gJChcIiN3cC1oZWFkZXJcIikuaXMoXCIuc3RheS1vcGVuXCIpO1xuXG4gICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLyogc2hvdyBhbmQgaGlkZSBuYXYgb24gc2Nyb2xsICovXG4gICAgICAgIHZhciBjdXJyZW50UG9zID0gJCh0aGlzKS5zY3JvbGxUb3AoKTtcbiAgICAgICAgaWYgKCFmb3JjZU9wZW4pIHsgICBcblxuICAgICAgICAgICAgaWYoIChjdXJyZW50UG9zICsgMjApIDwgc2Nyb2xsUG9zIHx8IGN1cnJlbnRQb3MgPT09IDAgKXtcbiAgICAgICAgICAgICAgICBuYXYuc2hvd05hdigpO1xuICAgICAgICAgICAgICAgIHNjcm9sbFBvcyA9IGN1cnJlbnRQb3M7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCAoY3VycmVudFBvcyAtIDIwKSA+IHNjcm9sbFBvcyAmJiBjdXJyZW50UG9zID4gNTAgKXtcbiAgICAgICAgICAgICAgICBuYXYuaGlkZU5hdigpO1xuICAgICAgICAgICAgICAgIHNjcm9sbFBvcyA9IGN1cnJlbnRQb3M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBsaXN0ZW4gZm9yIHNob3cvaGlkZSB0aXRsZSAqL1xuXG4gICAgICAgIGlmIChzY3JvbGxFdmVudHMubGVuZ3RoID09IDApIHJldHVybjtcblxuICAgICAgICBmb3IgKHZhciBpIGluIHNjcm9sbEV2ZW50cykge1xuICAgICAgICAgICAgaWYgKHNjcm9sbEV2ZW50cy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGlmICggY3VycmVudFBvcyA+PSBzY3JvbGxFdmVudHNbaV0udGFyZ2V0UG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRXZlbnRzW2ldLmRvd24uY2FsbCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudFBvcyA8IHNjcm9sbEV2ZW50c1tpXS50YXJnZXRQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxFdmVudHNbaV0udXAuY2FsbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uKCkge1xuICAgICAgICAvL3JlbW92ZSBzdGFuZGFyZCBkcm9wZG93bnNcbiAgICAgICAgbmF2LmNsb3NlRHJvcGRvd25zKCk7XG4gICAgICAgIC8vcmVzaXplIHNpdGUgbWVudSwgaWYgb3BlblxuICAgICAgICBpZigkKFwiYm9keVwiKS5pcyhcIi5sZWZ0LW1lbnVcIikpe1xuICAgICAgICAgICAgJChcIiNzaXRlLW1lbnVcIikuY3NzKFwiaGVpZ2h0XCIsICQod2luZG93KS5oZWlnaHQoKSAtIDUwKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgbmF2LnNob3dOYXYgPSBmdW5jdGlvbigpe1xuICAgICAgICBpZiggJChcIiN3cC1oZWFkZXJcIikuaXMoXCIuYmFyLWhpZGRlblwiKSApe1xuICAgICAgICAgICAgJChcIiN3cC1oZWFkZXJcIikucmVtb3ZlQ2xhc3MoXCJiYXItaGlkZGVuXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG5hdi5oaWRlTmF2ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYoICEkKFwiI3dwLWhlYWRlclwiKS5pcyhcIi5iYXItaGlkZGVuXCIpICYmICEkKFwiI3dwLWhlYWRlciAubmF2LWJ0bi5hY3RpdmVcIikubGVuZ3RoICl7XG4gICAgICAgICAgICAkKFwiI3dwLWhlYWRlclwiKS5hZGRDbGFzcyhcImJhci1oaWRkZW5cIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbmF2LnNob3dUaXRsZU9uU2Nyb2xsID0gZnVuY3Rpb24oJHRhcmdldCl7XG4gICAgICAgIHZhciBlbGVtZW50ID0gJHRhcmdldDtcbiAgICAgICAgc2Nyb2xsRXZlbnRzW1widGl0bGVTY3JvbGxcIl0gPSB7XG4gICAgICAgICAgICB0YXJnZXRQb3NpdGlvbjogZWxlbWVudC5vZmZzZXQoKS50b3AgKyA1MCxcbiAgICAgICAgICAgIGRvd246IGZ1bmN0aW9uICgpIHsgXG4gICAgICAgICAgICAgICAgaWYoICEkKCcjd3AtaGVhZGVyJykuaXMoXCIudGl0bGUtbW9kZVwiKSApe1xuICAgICAgICAgICAgICAgICAgICAkKCcjd3AtaGVhZGVyJykuYWRkQ2xhc3MoJ3RpdGxlLW1vZGUnKTtcbiAgICAgICAgICAgICAgICAgICAgJChcIiN3cC1oZWFkZXIgLm5hdi1taWRkbGVcIikuY3NzKCBcInBhZGRpbmctcmlnaHRcIiwgICQoXCIjd3AtaGVhZGVyIC5uYXYtcmlnaHRcIikub3V0ZXJXaWR0aCgpICk7XG4gICAgICAgICAgICAgICAgICAgIG5hdi5jbG9zZURyb3Bkb3ducygpO1xuICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cDogZnVuY3Rpb24gKCkgeyBcbiAgICAgICAgICAgICAgICBpZiggJCgnI3dwLWhlYWRlcicpLmlzKFwiLnRpdGxlLW1vZGVcIikgKXtcbiAgICAgICAgICAgICAgICAgICAgJCgnI3dwLWhlYWRlcicpLnJlbW92ZUNsYXNzKCd0aXRsZS1tb2RlJyk7IFxuICAgICAgICAgICAgICAgICAgICBuYXYuY2xvc2VEcm9wZG93bnMoKTtcbiAgICAgICAgICAgICAgICB9ICAgXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGlmICggJCgnI25hdi1wYWdlLXRpdGxlW2RhdGEtc2hvdy1vbi1zY3JvbGw9XCJ0cnVlXCJdJykubGVuZ3RoICl7XG4gICAgICAgIHZhciAkdGFyZ2V0ID0gKCAkKFwiLm5hdi1zY3JvbGwtdGFyZ2V0XCIpLmxlbmd0aCApID8gJChcIi5uYXYtc2Nyb2xsLXRhcmdldFwiKSA6ICQoXCJoMSwgaDJcIik7XG4gICAgICAgIGlmKCAkdGFyZ2V0Lmxlbmd0aCApIG5hdi5zaG93VGl0bGVPblNjcm9sbCggJHRhcmdldC5maXJzdCgpICk7XG4gICAgfVxuICAgICAgICBcbiAgICBuYXYucmVuZGVyU2hhcmUgPSBmdW5jdGlvbigpe1xuICAgICAgICAkc2hhcmUgPSAkKFwiI3NoYXJlLW1lbnVcIik7XG4gICAgICAgICRmYWNlYm9vayA9ICQoJ2FbZGF0YS1zaGFyZS10eXBlPVwiRmFjZWJvb2tcIl0nLCAkc2hhcmUpO1xuICAgICAgICAkdHdpdHRlciA9ICQoJ2FbZGF0YS1zaGFyZS10eXBlPVwiVHdpdHRlclwiXScsICRzaGFyZSk7XG4gICAgICAgICRsaW5rZWRpbiA9ICQoJ2FbZGF0YS1zaGFyZS10eXBlPVwiTGlua2VkSW5cIl0nLCAkc2hhcmUpO1xuICAgICAgICAkZW1haWwgPSAkKCdhW2RhdGEtc2hhcmUtdHlwZT1cIkVtYWlsXCJdJywgJHNoYXJlKTtcbiAgICAgICAgJHBpbnRlcmVzdCA9ICQoJ2FbZGF0YS1zaGFyZS10eXBlPVwiUGludGVyZXN0XCJdJywgJHNoYXJlKTtcblxuICAgICAgICBpZiAoJGZhY2Vib29rLmxlbmd0aCl7XG4gICAgICAgICAgICAkZmFjZWJvb2suY2xpY2soZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL3NoYXJlci9zaGFyZXIucGhwP3U9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3Blcm1hbGluaycpICksJycsJ3dpZHRoPTY1OCxoZWlnaHQ9MzU0LHNjcm9sbGJhcnM9bm8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkdHdpdHRlci5sZW5ndGgpe1xuICAgICAgICAgICAgJHR3aXR0ZXIuY2xpY2soZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgIHZhciB0d2l0dGVySGFuZGxlID0gKCQodGhpcykuZGF0YShcInR3aXR0ZXItaGFuZGxlXCIpKSA/ICAkKHRoaXMpLmRhdGEoXCJ0d2l0dGVyLWhhbmRsZVwiKS5yZXBsYWNlKFwiQFwiLFwiXCIpIDogXCJ3YXNoaW5ndG9ucG9zdFwiO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3R3aXR0ZXIuY29tL3NoYXJlP3VybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgncGVybWFsaW5rJykgKSArICcmdGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgndGl0bGUnKSApICsgJyZ2aWE9JyArIHR3aXR0ZXJIYW5kbGUgLCcnLCd3aWR0aD01NTAsIGhlaWdodD0zNTAsIHNjcm9sbGJhcnM9bm8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkbGlua2VkaW4ubGVuZ3RoKXtcbiAgICAgICAgICAgICRsaW5rZWRpbi5jbGljayhmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9zaGFyZUFydGljbGU/bWluaT10cnVlJnVybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgncGVybWFsaW5rJykgKSArICcmdGl0bGU9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3RpdGxlJykgKSwnJywnd2lkdGg9ODMwLGhlaWdodD00NjAsc2Nyb2xsYmFycz1ubycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCRlbWFpbC5sZW5ndGgpe1xuICAgICAgICAgICAgJGVtYWlsLmNsaWNrKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICB3aW5kb3cub3BlbignbWFpbHRvOj9zdWJqZWN0PScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCd0aXRsZScpICkgKyAnIGZyb20gVGhlIFdhc2hpbmd0b24gUG9zdCZib2R5PScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCdwZXJtYWxpbmsnKSApLCcnLCcnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCRwaW50ZXJlc3QubGVuZ3RoKXtcbiAgICAgICAgICAgICRwaW50ZXJlc3QuY2xpY2soZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICAgICAgICAgZS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCd0ZXh0L2phdmFzY3JpcHQnKTtcbiAgICAgICAgICAgICAgICBlLnNldEF0dHJpYnV0ZSgnY2hhcnNldCcsJ1VURi04Jyk7XG4gICAgICAgICAgICAgICAgZS5zZXRBdHRyaWJ1dGUoJ3NyYycsJ2h0dHBzOi8vYXNzZXRzLnBpbnRlcmVzdC5jb20vanMvcGlubWFya2xldC5qcz9yPScgKyBNYXRoLnJhbmRvbSgpKjk5OTk5OTk5KTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBpZiggJChcIiNzaGFyZS1tZW51XCIpLmxlbmd0aCApe1xuICAgICAgICBuYXYucmVuZGVyU2hhcmUoKTtcbiAgICB9XG5cbiAgICB2YXIgaWRwOyAvL3ByaXZhdGUgdmFyaWFibGUuIFRoZXJlIGNhbiBiZSBvbmx5IG9uZSBwcm92aWRlci4gU28gdGhpcyBpcyBhIHNpbmdsZXRvbi5cbiAgICBuYXYuZ2V0SWRlbnRpdHlQcm92aWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGlkcDtcbiAgICB9O1xuICAgIG5hdi5zZXRJZGVudGl0eVByb3ZpZGVyID0gZnVuY3Rpb24gKHByb3ZpZGVyKSB7XG4gICAgICAgIHZhciBlZiA9IGZ1bmN0aW9uICgpIHt9OyAvL2VtcHR5IGZ1bmN0aW9uXG4gICAgICAgIGlkcCA9IHt9O1xuICAgICAgICAvLyB3ZSdsbCBwYWQgYW55IG1pc3NpbmcgcG9ydGlvbiB3aXRoIGVtcHR5IGZ1bmN0aW9uXG4gICAgICAgIGlkcC5uYW1lID0gcHJvdmlkZXIubmFtZSB8fCBcIlwiO1xuICAgICAgICBpZHAuZ2V0VXNlcklkID0gcHJvdmlkZXIuZ2V0VXNlcklkIHx8IGVmO1xuICAgICAgICBpZHAuZ2V0VXNlck1lbnUgPSBwcm92aWRlci5nZXRVc2VyTWVudSB8fCBlZjtcbiAgICAgICAgaWRwLmdldFNpZ25JbkxpbmsgPSBwcm92aWRlci5nZXRTaWduSW5MaW5rIHx8IGVmO1xuICAgICAgICBpZHAuZ2V0UmVnaXN0cmF0aW9uTGluayA9IHByb3ZpZGVyLmdldFJlZ2lzdHJhdGlvbkxpbmsgfHwgZWY7XG4gICAgICAgIGlkcC5pc1VzZXJMb2dnZWRJbiA9IHByb3ZpZGVyLmlzVXNlckxvZ2dlZEluIHx8IGVmO1xuICAgICAgICBpZHAuaXNVc2VyU3Vic2NyaWJlciA9IHByb3ZpZGVyLmlzVXNlclN1YnNjcmliZXIgfHwgZWY7XG4gICAgICAgIFxuICAgICAgICBpZHAucmVuZGVyID0gcHJvdmlkZXIucmVuZGVyIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChpZHAuaXNVc2VyTG9nZ2VkSW4oKSkge1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXVzZXIgLnVzZXJuYW1lXCIpLnRleHQoaWRwLmdldFVzZXJJZCgpKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi11c2VyLW1vYmlsZSBhXCIpLnRleHQoaWRwLmdldFVzZXJJZCgpKTtcbiAgICAgICAgICAgICAgICBuYXYuc2V0SWRlbnRpdHlNZW51KGlkcC5nZXRVc2VyTWVudSgpKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi11c2VyXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXVzZXItbW9iaWxlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXVzZXItbW9iaWxlIGFcIikuYXR0cihcImhyZWZcIixpZHAuZ2V0VXNlck1lbnUoKVswXVtcImhyZWZcIl0pO1xuICAgICAgICAgICAgICAgIGlmKCBpZHAuaXNVc2VyU3Vic2NyaWJlcigpID09PSBcIjBcIiApe1xuICAgICAgICAgICAgICAgICAgICAkKFwiI25hdi1zdWJzY3JpYmVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgICAgICQoXCIjbmF2LXN1YnNjcmliZS1tb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi1zaWduLWluXCIpLmF0dHIoXCJocmVmXCIsIGlkcC5nZXRTaWduSW5MaW5rKCkrXCImbmlkPXRvcF9wYl9zaWduaW5cIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtc2lnbi1pbi1tb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIikuZmluZChcImFcIikuYXR0cihcImhyZWZcIiwgaWRwLmdldFNpZ25JbkxpbmsoKStcIiZuaWQ9dG9wX3BiX3NpZ25pblwiKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi1zdWJzY3JpYmVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtc3Vic2NyaWJlLW1vYmlsZVwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvL2xldCdzIHJlbmRlclxuICAgICAgICBuYXYucmVuZGVySWRlbnRpdHkoKTtcbiAgICB9O1xuICAgIG5hdi5yZW5kZXJJZGVudGl0eSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICBpZiAoaWRwKSB7IC8vIHRoZSB1c2VyIG1pZ2h0IG5vdCBoYXZlIGNvbmZpZ3VyZWQgYW55IGlkZW50aXR5LiBTbyBjaGVjayBmb3IgaXQuXG4gICAgICAgICAgICBpZHAucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2soaWRwKTtcbiAgICB9O1xuXG4gICAgLypcbiAgICAgKiBVc2luZyB0aGUgcHJpdmRlZCBBUEksIHNldCB1cCB0aGUgZGVmYXVsdCBpZGVudGl0eSBwcm92aWRlciBhcyBUV1BcbiAgICAgKi9cblxuICAgIC8vIGlmIHRoZSBpZGVudGl0eSBjb21wb25lbnQgd2VyZSBzZXQgYXMgaGlkZGVuIGZyb20gUGFnZUJ1aWxkZXIgYWRtaW5cbiAgICAvLyBzZXQgYSBmbGFnIHNvIHRoYXQgd2UgZG9uJ3QgcHJvY2VzcyBsb2dpbiBhdCBhbGxcbiAgICB2YXIgc2hvd0lkZW50aXR5ID0gJChcIiNuYXYtdXNlclwiKS5kYXRhKFwic2hvdy1pZGVudGl0eVwiKTtcblxuICAgIC8vIGRlZmF1bHQgSWRlbnRpdHlcbiAgICB2YXIgY3VycmVudCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiP1wiKVswXTtcbiAgICB2YXIgdHdwSWRlbnRpdHkgPSB7XG4gICAgICAgIG5hbWU6IFwiVFdQXCIsXG4gICAgICAgIGdldFVzZXJJZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHVzZXJuYW1lID0gVFdQLlV0aWwuVXNlci5nZXRVc2VyTmFtZSgpO1xuICAgICAgICAgICAgdmFyIHVzZXJpZCA9IFRXUC5VdGlsLlVzZXIuZ2V0VXNlcklkKCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHVzZXJuYW1lID09IFwic3RyaW5nXCIgJiYgdXNlcm5hbWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1c2VybmFtZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ2V0VXNlck1lbnU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgeyBcInRpdGxlXCI6IFwiUHJvZmlsZVwiLCBcImhyZWZcIjogVFdQLnNpZ25pbi5wcm9maWxldXJsICsgY3VycmVudCArICcmcmVmcmVzaD10cnVlJyB9LFxuICAgICAgICAgICAgICAgIHsgXCJ0aXRsZVwiOiBcIkxvZyBvdXRcIiwgXCJocmVmXCI6IFRXUC5zaWduaW4ubG9nb3V0dXJsX3BhZ2UgfVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0U2lnbkluTGluazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFRXUC5zaWduaW4ubG9naW51cmxfcGFnZSArIGN1cnJlbnQ7XG4gICAgICAgIH0sXG4gICAgICAgIGdldFJlZ2lzdHJhdGlvbkxpbms6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBUV1Auc2lnbmluLnJlZ2lzdHJhdGlvbnVybF9wYWdlICsgY3VycmVudDtcbiAgICAgICAgfSxcbiAgICAgICAgaXNVc2VyU3Vic2NyaWJlcjogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICBzdWIgPSAoZG9jdW1lbnQuY29va2llLm1hdGNoKC9ycGxzYj0oWzAtOV0rKS8pKSA/IFJlZ0V4cC4kMSA6ICcnOyBcbiAgICAgICAgICAgIHJldHVybiBzdWI7XG4gICAgICAgIH0sXG4gICAgICAgIGlzVXNlckxvZ2dlZEluOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKFRXUC5VdGlsLlVzZXIpID8gVFdQLlV0aWwuVXNlci5nZXRBdXRoZW50aWNhdGlvbigpIDogZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gSWYgd2UgYXJlIHNob3dpbmcgaWRlbnRpdHkgdGhlbiBzZXQgdGhlIGRlZmF1bHQgaWRlbnRpdHkgcHJvdmlkZXIgdG8gVFdQLlxuICAgIC8vICAgVXNlciBjYW4gb3ZlcmlkZSB0aGlzIHdoZW5ldmVyIHRoZXkgd2FudC5cbiAgICAvL1xuICAgIC8vIEluIFRXUCwgaWRlbnRpdHkgdXNlciBpbnRlcmZhY2UgbmVlZHMgdG8gcHJvY2Vzc2VkIGFmdGVyIHRoZSBmYWN0IHRoYXQgYWxsIG90aGVyIGphdmFzY3JpcHQgaGFzIGJlZW4gbG9hZGVkLlxuICAgIC8vICAgQnV0IHRoZSBqcyByZXNvdXJjZXMgYXJlIGxvYWRlZCBhc3luY2hyb25vdXNseSBhbmQgaXQgZG9lc24ndCBoYXZlIGFueSBjYWxsYmFja3MgaG9va3MuIFNvIHdlIHdhdGNoIGZvciBpdC5cbiAgICBpZiAoc2hvd0lkZW50aXR5KSB7XG4gICAgICAgIC8vdHJ5IHRvIGxvYWQgVFdQIG9ubHkgaWYgd2UgYXJlIHNob3dpbmcgSWRlbnRpdHkuXG4gICAgICAgIHZhciBpbml0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIChmdW5jdGlvbiBjaGVja1RXUCgpIHtcbiAgICAgICAgICAgIC8vIGlmIHRoZXJlJ3MgYWxyZWFkeSBpZHAgc2V0LCB0aGVuIGRvbid0IHRyeSB0byBsb2FkIFRXUC5cbiAgICAgICAgICAgIGlmICghbmF2LmdldElkZW50aXR5UHJvdmlkZXIoKSkge1xuICAgICAgICAgICAgICAgIGlmIChUV1AgJiYgVFdQLnNpZ25pbiAmJiBUV1AuVXRpbCkgeyAvLyBtYWtlIHN1cmUgVFdQIGhhcyBiZWVuIGxvYWRlZC5cbiAgICAgICAgICAgICAgICAgICAgbmF2LnNldElkZW50aXR5UHJvdmlkZXIodHdwSWRlbnRpdHkpO1xuICAgICAgICAgICAgICAgICAgICBuYXYucmVuZGVySWRlbnRpdHkoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFmdGVyIDMgc2Vjb25kcywgaWYgVFdQIGluZGVudGl0eSBoYXNuJ3QgYmVlbiBsb2FkZWQuIExldCdzIGp1c3Qgc3RvcC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdyAtIGluaXQgPCAzICogMTAwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgaXQgaGFzbid0IGJlZW4gbG9hZGVkLCB3ZSB3YWl0IGZldyBtaWxsaXNlY29uZHMgYW5kIHRyeSBhZ2Fpbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgY2hlY2tUV1AoKTsgfSwgMjAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSgpKTtcbiAgICB9XG5cbiAgICAvKiBoYW1tZXIuanMgdGFwICovXG5cbiAgICBmdW5jdGlvbiBoYW5kbGVUYXAoZXYpIHtcbiAgICAgICAgZXYuZ2VzdHVyZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvL2V2Lmdlc3R1cmUucHJldmVudERlZmF1bHQgPyBldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0KCkgOiBldi5nZXN0dXJlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIGV2Lmdlc3R1cmUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICQoZXYuZ2VzdHVyZS50YXJnZXQpLmNsaWNrKCk7XG4gICAgfVxuXG4gICAgLyogYS9iIHRlc3QgYW5kIHRhcmdldCAqL1xuICAgIC8vICQod2luZG93LmRvY3VtZW50KS5vbignYWJ0ZXN0LXJlYWR5JywgZnVuY3Rpb24oZSwgQUJUKSB7XG5cbiAgICAvLyAgICAgaWYgKCAhc3VwcG9ydGVkQ2xpZW50KCkgKSB7XG4gICAgLy8gICAgICAgICByZXR1cm47XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBhcHBseVZhcmlhbnRFeHBlcmllbmNlKCdtYXN0SGVhZDInLCAnbG9nb0xhcmdlJyk7XG5cbiAgICAvLyAgICAgZnVuY3Rpb24gYXBwbHlWYXJpYW50RXhwZXJpZW5jZShmZWF0dXJlTmFtZSwgdmFyaWFudE5hbWUpIHtcbiAgICAvLyAgICAgICAgIHZhciBmdHIgPSBBQlQuZ2V0KGZlYXR1cmVOYW1lKTtcbiAgICAvLyAgICAgICAgIHZhciB0cmsgPSBmdHIuaXModmFyaWFudE5hbWUpO1xuICAgICAgICAgICAgXG4gICAgLy8gICAgICAgICB2YXIgJHRhcmdldCA9ICQoJ2hlYWRlci5hYnQtbm90LWxvYWRlZCwgI3dwLXRvcHBlciwgLnBiLWYtcGFnZS1oZWFkZXItdjIsIGJvZHknKTtcbiAgICAvLyAgICAgICAgICR0YXJnZXQucmVtb3ZlQ2xhc3MoICdhYnQtbm90LWxvYWRlZCcgKTtcbiAgICAvLyAgICAgICAgICR0YXJnZXQuYWRkQ2xhc3MoICdhYnQtJyArIGZlYXR1cmVOYW1lICsgJy0nICsgdmFyaWFudE5hbWUgKyAnLScgKyB0cmsgKTtcblxuICAgIC8vICAgICAgICAgdmFyIGZkID0gbW9tZW50KCkuZm9ybWF0KCdkZGRkLCBMTCcpO1xuXG4gICAgLy8gICAgICAgICAkKCcjd3AtdG9wcGVyIC50b3AtdGltZXN0YW1wJykudGV4dChmZCk7XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBmdW5jdGlvbiBzdXBwb3J0ZWRDbGllbnQoKSB7XG5cbiAgICAvLyAgICAgICAgIHJldHVybiAkKCdodG1sLmRlc2t0b3AnKS5sZW5ndGggPiAwICYmICQoJ2hlYWRlci5kYXJrJykubGVuZ3RoID09IDA7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9KTtcblxufShqUXVlcnksIHdpbmRvdykpO1xuXG4iLCIvL1RvcCBTaGFyZSBCYXIgSlMgLSBzdG9sZW4gc3RyYWlnaHQgZnJvbSBcbihmdW5jdGlvbigkKXtcblxuICAgdmFyIHNvY2lhbFRvb2xzID0ge1xuICAgICAgICBteVJvb3QgOiAnLnRvcC1zaGFyZWJhci13cmFwcGVyJyxcblxuICAgICAgICBpbml0OmZ1bmN0aW9uIChteVJvb3QpIHtcbiAgICAgICAgICAgIG15Um9vdCA9IG15Um9vdCB8fCB0aGlzLm15Um9vdDtcbiAgICAgICAgICAgICQobXlSb290KS5lYWNoKGZ1bmN0aW9uKGluZGV4LCBteVJvb3RFbGVtZW50KXtcbiAgICAgICAgICAgICAgICBteVJvb3RFbGVtZW50LnBvc3RTaGFyZSA9IG5ldyBwb3N0U2hhcmUoKTtcbiAgICAgICAgICAgICAgICBteVJvb3RFbGVtZW50LnBvc3RTaGFyZS5pbml0KCQobXlSb290RWxlbWVudCksICQobXlSb290RWxlbWVudCkuZGF0YSgncG9zdHNoYXJlJykpO1xuICAgICAgICAgICAgICAgIHZhciAkcm9vdCA9ICQobXlSb290RWxlbWVudCksIFxuICAgICAgICAgICAgICAgICAgICAkaW5kaXZpZHVhbFRvb2wgPSAkKCcudG9vbDpub3QoLm1vcmUpJywkcm9vdCksXG4gICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc1dyYXBwZXIgPSAkKCcuc29jaWFsLXRvb2xzLXdyYXBwZXInLCRyb290KSxcbiAgICAgICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzTW9yZUJ0biA9ICQoJy50b29sLm1vcmUnLCRzb2NpYWxUb29sc1dyYXBwZXIpLFxuICAgICAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNBZGRpdGlvbmFsID0gJCgnLnNvY2lhbC10b29scy1hZGRpdGlvbmFsJywkcm9vdCksXG4gICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc1V0aWxpdHkgPSAkKCcudXRpbGl0eS10b29scy13cmFwcGVyJywkcm9vdCksXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gKHdpbmRvdy5pbm5lcldpZHRoID4gMCkgPyB3aW5kb3cuaW5uZXJXaWR0aCA6IHNjcmVlbi53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaXNNb2JpbGUgPSAobW9iaWxlX2Jyb3dzZXIgPT09IDEgJiYgd2lkdGggPCA0ODApID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSB7J29tbml0dXJlRXZlbnQnIDogJ2V2ZW50Nid9OyAgICAgICAgICBcbiAgICBcbiAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNNb3JlQnRuLm9mZignY2xpY2snKS5vbignY2xpY2snLHRoaXMsZnVuY3Rpb24oZXYpeyAgXG4gICAgICAgICAgICAgICAgICAgIGlmKGlzTW9iaWxlKXskc29jaWFsVG9vbHNVdGlsaXR5LmhpZGUoJ2Zhc3QnKTt9OyAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc01vcmVCdG4uaGlkZSgnZmFzdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzQWRkaXRpb25hbC5zaG93KCdmYXN0JyxmdW5jdGlvbihldil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLnRvb2wnLCRzb2NpYWxUb29sc1dyYXBwZXIpLmFuaW1hdGUoe1wid2lkdGhcIjo0MH0sMjUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdC5hZGRDbGFzcyhcImV4cGFuZGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5zb2NpYWwtdG9vbHMnLCRzb2NpYWxUb29sc0FkZGl0aW9uYWwpLmFuaW1hdGUoe1wibWFyZ2luLWxlZnRcIjowfSwyNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGlzTW9iaWxlKXskc29jaWFsVG9vbHNVdGlsaXR5LnNob3coJ3Nsb3cnKTt9OyAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTsvL2VuZCBhZGR0bCBzaG93XG4gICAgICAgICAgICAgICAgfSk7Ly9lbmQgbW9yZSBjbGljayBcbiAgICAgICAgICAgICAgICAkaW5kaXZpZHVhbFRvb2wuYmluZCh7XG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2V2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuc2VuZERhdGFUb09tbml0dXJlID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaGFyZVR5cGUgPSAkKHRoaXMpLmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcmVUeXBlID0gKHR5cGVvZiBzaGFyZVR5cGUgIT0gJ3VuZGVmaW5lZCcpP3NoYXJlVHlwZS5zcGxpdChcIiBcIilbMF0udHJpbSgpOicnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbW5pdHVyZVZhcnMgPSAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlVmFyMVwiOih0eXBlb2Ygd2luZG93LnMgPT0gJ29iamVjdCcpICYmIHMgJiYgcy5lVmFyMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZVZhcjJcIjoodHlwZW9mIHdpbmRvdy5zID09ICdvYmplY3QnKSAmJiBzICYmIHMuZVZhcjIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVWYXI4XCI6KHR5cGVvZiB3aW5kb3cucyA9PSAnb2JqZWN0JykgJiYgcyAmJiBzLmVWYXI4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlVmFyMTdcIjoodHlwZW9mIHdpbmRvdy5zID09ICdvYmplY3QnKSAmJiBzICYmIHMuZVZhcjE3LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlVmFyMjdcIjonJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbW5pdHVyZVZhcnMuZVZhcjI3ID0gc2hhcmVUeXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBldmVudE5hbWUgPSBjb25maWcub21uaXR1cmVFdmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZW5kRGF0YVRvT21uaXR1cmUoJ3NoYXJlLicgKyBzaGFyZVR5cGUsZXZlbnROYW1lLG9tbml0dXJlVmFycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSl7fSAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICB9XG4gICAgfTsgICBcblxuICAgdmFyIHRleHRSZXNpemVyID0ge1xuICAgICAgICBjdXJySW5jcmVtZW50TWF4OjQsXG4gICAgICAgIGN1cnJJbmNyZW1lbnRVbml0OjIsXG4gICAgICAgIGN1cnJJbmNyZW1lbnRJbmRleDowLFxuICAgICAgICBpbml0OiBmdW5jdGlvbiAobXlSb290LHJlc2l6ZWFibGVFbGVtZW50TGlzdCxjbGlja0VsZW1lbnQpIHtcbiAgICAgICAgICAgIG15Um9vdCA9IG15Um9vdCB8fCAnI2FydGljbGUtYm9keSBhcnRpY2xlLCAucmVsYXRlZC1zdG9yeSc7XG4gICAgICAgICAgICByZXNpemVhYmxlRWxlbWVudExpc3QgPSByZXNpemVhYmxlRWxlbWVudExpc3QgfHwgJ3AsIGxpJztcbiAgICAgICAgICAgIGNsaWNrRWxlbWVudCA9IGNsaWNrRWxlbWVudCB8fCAnLnRvb2wudGV4dHJlc2l6ZXInO1xuICAgICAgICAgICAgdGhpcy5yb290ID0gJChteVJvb3QpO1xuICAgICAgICAgICAgdGhpcy5yZXNpemVhYmxlRWxlbWVudHMgPSAkKHJlc2l6ZWFibGVFbGVtZW50TGlzdCwgdGhpcy5yb290KTtcblxuICAgICAgICAgICAgLy8gYWRkIFwiTmV4dCB1cFwiIGxhYmxlIHRvIHRoZSByZXNpemFibGUgZWxlbWVudCdzIGxpc3RcbiAgICAgICAgICAgIGlmKCQoXCIucmVsYXRlZC1zdG9yeVwiKS5wcmV2KCdoMycpLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplYWJsZUVsZW1lbnRzLnB1c2goJCgnLnJlbGF0ZWQtc3RvcnknKS5wcmV2KCdoMycpKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZWFibGVFbGVtZW50cy5wdXNoKCQoJy5yZWxhdGVkLXN0b3J5IGg0IGEnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKGNsaWNrRWxlbWVudCkudW5iaW5kKCdjbGljaycpLm9uKCdjbGljaycsdGhpcyx0aGlzLnJlc2l6ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKGV2ZW50KSB7ICBcbiAgICAgICAgICAgIHZhciBjdXJyT2JqID0gZXZlbnQuZGF0YTtcbiAgICAgICAgICAgIGlmIChjdXJyT2JqLmN1cnJJbmNyZW1lbnRJbmRleCA9PSBjdXJyT2JqLmN1cnJJbmNyZW1lbnRNYXgpIHtcbiAgICAgICAgICAgICAgICBjdXJyT2JqLmN1cnJJbmNyZW1lbnRJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgY3Vyck9iai5jdXJySW5jcmVtZW50VW5pdCA9IChjdXJyT2JqLmN1cnJJbmNyZW1lbnRVbml0ID09IDIpPy0yOjI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyT2JqLmN1cnJJbmNyZW1lbnRJbmRleCA9IGN1cnJPYmouY3VyckluY3JlbWVudEluZGV4ICsgMTtcbiAgICAgICAgICAgIGN1cnJPYmoucmVzaXplYWJsZUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBlbG0gPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgIGN1cnJTaXplPSBwYXJzZUZsb2F0KGVsbS5jc3MoJ2ZvbnQtc2l6ZScpLDUpO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBjdXJyU2l6ZSArIGN1cnJPYmouY3VyckluY3JlbWVudFVuaXQ7XG4gICAgICAgICAgICAgICAgZWxtLmNzcygnZm9udC1zaXplJywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICB3cF9wYi5yZXBvcnQoJ3RleHRyZXNpemVyJywgJ3Jlc2l6ZWQnLCByZXN1bHQpO1xuICAgICAgICAgICAgfSk7IFxuXG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgfTtcbnZhciBtb2JpbGVfYnJvd3NlciA9IG1vYmlsZV9icm93c2VyICYmIG1vYmlsZV9icm93c2VyID09PSAxID8gMSA6IDA7XG4gICBcbiAgIHZhciBwb3N0U2hhcmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICB0aGlzLmluaXQgPSBmdW5jdGlvbihyb290RWxlbWVudCwgcG9zdFNoYXJlVHlwZXMpIHtcbiAgICAgICAgICAgaWYgKHBvc3RTaGFyZVR5cGVzKSB7XG4gICAgICAgICAgICAgICBwb3N0U2hhcmVUeXBlcy5zcGxpdChcIixcIikuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LCBpbmRleCl7XG4gICAgICAgICAgICAgICAgICAgdmFyIHBvc3RTaGFyZVVybCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ob3N0LmluZGV4T2YoJ3dhc2hpbmd0b25wb3N0LmNvbScpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcG9zdFNoYXJlVXJsID0gJ2h0dHA6Ly9wb3N0c2hhcmUud2FzaGluZ3RvbnBvc3QuY29tJzsgLy9wcm9kdWN0aW9uIG9ubHlcbiAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHdpbmRvdy5sb2NhdGlvbi5ob3N0LmluZGV4T2YoJ3BiLXN0YWdpbmcuZGlnaXRhbGluay5jb20nKSA+PSAwIHx8IHdpbmRvdy5sb2NhdGlvbi5ob3N0LmluZGV4T2YoJ3BiLXN0YWdpbmcud3Bwcml2YXRlLmNvbScpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcG9zdFNoYXJlVXJsID0gJ2h0dHA6Ly9wb3N0c2hhcmUtc3RhZ2Uud3Bwcml2YXRlLmNvbSc7IC8vdGVzdGluZyBwYi1zdGFnaW5nXG4gICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcG9zdFNoYXJlVXJsID0gJ2h0dHA6Ly9wb3N0c2hhcmUtZGV2LndwcHJpdmF0ZS5jb20nOyAvL3Rlc3RpbmcgcGItZGV2XG4gICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgIHZhciBwcmVUaW1lc3RhbXAgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgIHZhciBwcmVCdXNpbmVzc0tleSA9IHdwX3BiLlN0YXRpY01ldGhvZHMuZ2V0VW5pcXVlS2V5KDEwMDAsIG51bGwsIHByZVRpbWVzdGFtcCk7XG4gICAgICAgICAgICAgICAgICAgdmFyIG9iamVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgc2hhcmVUeXBlIDogZWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wIDogcHJlVGltZXN0YW1wLFxuICAgICAgICAgICAgICAgICAgICAgICBidXNpbmVzc0tleSA6IHByZUJ1c2luZXNzS2V5LFxuICAgICAgICAgICAgICAgICAgICAgICBzaGFyZVVybCA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHRpbnlVcmwgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBjYWxsZWRQb3N0U2hhcmUgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50VXVpZCA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHBvc3RTaGFyZVVybCA6IHBvc3RTaGFyZVVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgIGNhbGxQb3N0U2hhcmUgOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5jYWxsZWRQb3N0U2hhcmUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IF90aGlzLnBvc3RTaGFyZVVybCtcIi9hcGkvYmsvXCIrX3RoaXMuYnVzaW5lc3NLZXkrXCIvXCIrX3RoaXMuY2xpZW50VXVpZCtcIi9cIitfdGhpcy5zaGFyZVR5cGUrXCIvXCIrX3RoaXMudGltZXN0YW1wLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5jYWxsZWRQb3N0U2hhcmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsbGVkUG9zdFNoYXJlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgIHNoYXJlIDogZnVuY3Rpb24gKHNvY2lhbFVybCwgc29jaWFsVXJsMiwgc3R5bGUsIGNhbGxiYWNrQ29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy50aW55VXJsIHx8IHRoaXMudGlueVVybC5sZW5ndGggPT0gMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBcImh0dHA6Ly90aW55dXJsLndhc2hpbmd0b25wb3N0LmNvbS9jcmVhdGUuanNvbnBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IF90aGlzLnNoYXJlVXJsICsgXCI/cG9zdHNoYXJlPVwiK190aGlzLmJ1c2luZXNzS2V5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMudGlueVVybCA9IGRhdGEudGlueVVybDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrQ29udGV4dC5vcGVuV2luZG93KHNvY2lhbFVybCtfdGhpcy50aW55VXJsK3NvY2lhbFVybDIsX3RoaXMuc2hhcmVUeXBlLHN0eWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3Rocm93IFwiUG9zdFNoYXJlIGZhaWxlZDogdGlueVVybFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiAyMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tDb250ZXh0Lm9wZW5XaW5kb3coc29jaWFsVXJsK190aGlzLnRpbnlVcmwrc29jaWFsVXJsMixfdGhpcy5zaGFyZVR5cGUsc3R5bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAkKHJvb3RFbGVtZW50LmZpbmQoJy4nK2VsZW1lbnQpWzBdKS5wYXJlbnQoKVswXS5wb3N0U2hhcmUgPSAkKHJvb3RFbGVtZW50KVswXS5wb3N0U2hhcmU7XG4gICAgICAgICAgICAgICAgICAgJChyb290RWxlbWVudC5maW5kKCcuJytlbGVtZW50KVswXSkucGFyZW50KClbMF0ucG9zdFNoYXJlT2JqZWN0ID0gb2JqZWN0O1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgIH1cbiAgICAgICB9LFxuICAgICAgIFxuICAgICAgIHRoaXMuY2FsbFBvc3RTaGFyZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBlbGVtZW50T2JqZWN0LCBzb2NpYWxVcmwsIHNoYXJlVXJsTG9uZywgc29jaWFsVXJsMiwgc3R5bGUpIHtcbiAgICAgICAgICAgaWYoZWxlbWVudCAmJiBlbGVtZW50T2JqZWN0ICYmIHNvY2lhbFVybCAmJiBzaGFyZVVybExvbmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2hhcmVUeXBlID0gJChlbGVtZW50KS5jaGlsZHJlbigpLmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgICAgICAgICAgc2hhcmVUeXBlID0gKHR5cGVvZiBzaGFyZVR5cGUgIT0gJ3VuZGVmaW5lZCcpP3NoYXJlVHlwZS5zcGxpdChcIiBcIilbMF0udHJpbSgpOicnO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmKCFzb2NpYWxVcmwyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNvY2lhbFVybDIgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgY2xpZW50VXVpZCA9ICQuY29va2llKFwid2Fwb19sb2dpbl9pZFwiKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbGVtZW50T2JqZWN0LmNsaWVudFV1aWQgPSBjbGllbnRVdWlkO1xuICAgICAgICAgICAgICAgIGlmIChjbGllbnRVdWlkICYmIGNsaWVudFV1aWQubGVuZ3RoID4gMCAmJiBzaGFyZVR5cGUgJiYgc2hhcmVUeXBlLmxlbmd0aCA+IDAgJiYgZWxlbWVudE9iamVjdC5zaGFyZVR5cGUgJiYgc2hhcmVUeXBlLnRyaW0oKSA9PSBlbGVtZW50T2JqZWN0LnNoYXJlVHlwZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudE9iamVjdC5zaGFyZVVybCA9IHNoYXJlVXJsTG9uZztcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudE9iamVjdC5jYWxsUG9zdFNoYXJlKCk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRPYmplY3Quc2hhcmUoc29jaWFsVXJsLCBzb2NpYWxVcmwyLCBzdHlsZSwgZWxlbWVudC5wb3N0U2hhcmUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiUG9zdFNoYXJlIGZhaWxlZDogbm8gbG9nZ2VkIGluIFVzZXIgb3Igd3JvbmcgU2hhcmV0eXBlXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkucGFyZW50KClbMF0ucG9zdFNoYXJlT2JqZWN0ID0gZWxlbWVudE9iamVjdDtcbiAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgIHRocm93IFwiUG9zdFNoYXJlIGZhaWxlZDogRGF0YSBtaXNzaW5nXCI7XG4gICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICBcbiAgICAgICAgdGhpcy5vcGVuV2luZG93ID0gZnVuY3Rpb24odXJsLCBuYW1lLCBzdHlsZSl7XG4gICAgICAgICAgICB3aW5kb3cub3Blbih1cmwsJ3NoYXJlXycrbmFtZSxzdHlsZSk7XG4gICAgICAgIH1cbiAgIH07XG4gICBcbiAgIHdpbmRvdy5UV1AgPSB3aW5kb3cuVFdQIHx8IHt9O1xuICAgVFdQLlNvY2lhbFRvb2xzID0gVFdQLlNvY2lhbFRvb2xzIHx8IHNvY2lhbFRvb2xzO1xuICAgVFdQLlRleHRSZXNpemVyID0gVFdQLlRleHRSZXNpemVyIHx8IHRleHRSZXNpemVyO1xuXG4gICBUV1AuVGV4dFJlc2l6ZXIuaW5pdCgpO1xuICAgVFdQLlNvY2lhbFRvb2xzLmluaXQoKTtcblxuXG4gICAvKlxuICAgICAqIFBPUE9VVCBjb2RlIGZvciBsYXRlciB2YXIgJGFydGljbGUgPSAkKCcjYXJ0aWNsZS10b3BwZXInKTsgLy8gU1RBUlQ6XG4gICAgICogU29jaWFsIHNoYXJlIHBvcC1vdXQgdmFyICRzb2NpYWxUb29sc01vcmVCdG4gPSAkKCcuc29jaWFsLXRvb2xzXG4gICAgICogLm1vcmUnLCRhcnRpY2xlKSwgJHNvY2lhbFRvb2xzUG9wT3V0ID1cbiAgICAgKiAkKCcuc29jaWFsLXRvb2xzLnBvcC1vdXQnLCRhcnRpY2xlKSA7XG4gICAgICogJHNvY2lhbFRvb2xzTW9yZUJ0bi5vbignY2xpY2snLGZ1bmN0aW9uKGV2KXsgdmFyIHRhcmdldFRvcCA9XG4gICAgICogJHNvY2lhbFRvb2xzTW9yZUJ0bi5wb3NpdGlvbigpLnRvcCArXG4gICAgICogJHNvY2lhbFRvb2xzTW9yZUJ0bi5vdXRlckhlaWdodCgpLTEtMTQ7IHZhciB0YXJnZXRMZWZ0ID1cbiAgICAgKiAkc29jaWFsVG9vbHNNb3JlQnRuLnBvc2l0aW9uKCkubGVmdC0xLTM7XG4gICAgICogJHNvY2lhbFRvb2xzUG9wT3V0LmNzcyh7XCJ0b3BcIjp0YXJnZXRUb3AsXCJsZWZ0XCI6dGFyZ2V0TGVmdH0pO1xuICAgICAqICRzb2NpYWxUb29sc1BvcE91dC50b2dnbGUoKTsgfSk7XG4gICAgICogJHNvY2lhbFRvb2xzUG9wT3V0Lm9uKCdtb3VzZW91dCcsZnVuY3Rpb24oZXYpe1xuICAgICAqICRzb2NpYWxUb29sc1BvcE91dC50b2dnbGUoKTsgfSk7IC8vIEVORDogU29jaWFsIHNoYXJlIHBvcC1vdXRcbiAgICAgKi9cbn0pKGpRdWVyeSk7IiwidmFyIGlmcmFtZSA9IHJlcXVpcmUoJy4vaWZyYW1lLmpzJyk7XG52YXIgdHdpdHRlckZvbGxvd0J1dHRvbk1vZHVsZXMgPSByZXF1aXJlKCcuL3R3aXR0ZXItZm9sbG93LmpzJyk7XG52YXIgcGJIZWFkZXJNb2R1bGUgPSByZXF1aXJlKCcuL3BiSGVhZGVyLmpzJyk7XG52YXIgcGJTb2NpYWxUb29scyA9IHJlcXVpcmUoJy4vcGJTb2NpYWxUb29scy5qcycpO1xuXG4vL0FkZHMgdGhlIHJldHVybiB1cmwgdG8gdGhlIHN1YnNjcmliZSBhY3Rpb25cbnZhciBzZXR1cFN1YnNjcmliZUJ0biA9IGZ1bmN0aW9uKCl7XG4gIHZhciAkc3Vic2NyaWJlID0gJCgnI25hdi1zdWJzY3JpYmUnKSxcbiAgICBocmVmID0gICRzdWJzY3JpYmUuYXR0cignaHJlZicpLFxuICAgIHBhZ2VMb2NhdGlvbiA9IHdpbmRvdy5lbmNvZGVVUkkod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgJHN1YnNjcmliZS5hdHRyKCdocmVmJywgaHJlZiArIHBhZ2VMb2NhdGlvbik7XG59O1xuLy9Ecm9wIGluIHlvdXIgaW5pdCBmaWxlXG5zZXR1cFN1YnNjcmliZUJ0bigpO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgR2VuZXJhbFxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG52YXIgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWwpIHtcbiAgZWwgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIHtcbiAgICBsZWZ0OiBlbC5sZWZ0ICsgd2luZG93LnNjcm9sbFgsXG4gICAgdG9wOiBlbC50b3AgKyB3aW5kb3cuc2Nyb2xsWVxuICB9XG59XG5cbnZhciBzaHVmZmxlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgdmFyIGN1cnJlbnRJbmRleCA9IGFycmF5Lmxlbmd0aCwgdGVtcG9yYXJ5VmFsdWUsIHJhbmRvbUluZGV4O1xuXG4gIC8vIFdoaWxlIHRoZXJlIHJlbWFpbiBlbGVtZW50cyB0byBzaHVmZmxlLi4uXG4gIHdoaWxlICgwICE9PSBjdXJyZW50SW5kZXgpIHtcblxuICAgIC8vIFBpY2sgYSByZW1haW5pbmcgZWxlbWVudC4uLlxuICAgIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY3VycmVudEluZGV4KTtcbiAgICBjdXJyZW50SW5kZXggLT0gMTtcblxuICAgIC8vIEFuZCBzd2FwIGl0IHdpdGggdGhlIGN1cnJlbnQgZWxlbWVudC5cbiAgICB0ZW1wb3JhcnlWYWx1ZSA9IGFycmF5W2N1cnJlbnRJbmRleF07XG4gICAgYXJyYXlbY3VycmVudEluZGV4XSA9IGFycmF5W3JhbmRvbUluZGV4XTtcbiAgICBhcnJheVtyYW5kb21JbmRleF0gPSB0ZW1wb3JhcnlWYWx1ZTtcbiAgfVxuXG4gIHJldHVybiBhcnJheTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFZhbHVlc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjgsIHk6MC4yfSwge3g6MC43OCwgeTowLjE4fSwge3g6MC43NCwgeTowLjJ9LCB7eDowLjcyLCB5OjAuMjF9LCB7eDowLjcxLCB5OjAuMjR9LCB7eDowLjczLCB5OjAuMjZ9LCB7eDowLjc2LCB5OjAuMjN9LCB7eDowLjc5LCB5OjAuMn0pLFxuICBuZXcgQXJyYXkoe3g6MC42LCB5OjAuM30sIHt4OjAuNTUsIHk6MC4yMn0sIHt4OjAuNjIsIHk6MC4yNH0sIHt4OjAuNjgsIHk6MC4yfSwge3g6MC43MSwgeTowLjE4fSwge3g6MC42OCwgeTowLjE1fSwge3g6MC42NCwgeTowLjE4fSwge3g6MC42MywgeTowLjIyfSwge3g6MC42MiwgeTowLjI2fSwge3g6MC42MSwgeTowLjI4fSksXG4gIG5ldyBBcnJheSh7eDowLjQ5LCB5OjAuMTR9LCB7eDowLjU0LCB5OjAuMTZ9LCB7eDowLjU2LCB5OjAuMTR9LCB7eDowLjU0LCB5OjAuMTh9LCB7eDowLjU2LCB5OjAuMjJ9LCB7eDowLjUyLCB5OjAuMTh9LCB7eDowLjUsIHk6MC4xNH0sIHt4OjAuNDcsIHk6MC4xMn0pLFxuICBuZXcgQXJyYXkoe3g6MC41NSwgeTowLjMxfSwge3g6MC41OCwgeTowLjI4fSwge3g6MC42NCwgeTowLjI2fSwge3g6MC43MiwgeTowLjIyfSwge3g6MC44LCB5OjAuMTh9LCB7eDowLjczLCB5OjAuMjJ9LCB7eDowLjY4LCB5OjAuMjR9LCB7eDowLjYyLCB5OjAuMjh9KSxcbiAgbmV3IEFycmF5KHt4OjAuNzUsIHk6MC4xNn0sIHt4OjAuNzIsIHk6MC4xOH0sIHt4OjAuNjgsIHk6MC4yMn0sIHt4OjAuNjIsIHk6MC4yNn0sIHt4OjAuNTUsIHk6MC4zfSwge3g6MC42MiwgeTowLjI2fSwge3g6MC42OCwgeTowLjIyfSwge3g6MC43MiwgeTowLjE4fSksXG4gIG5ldyBBcnJheSh7eDowLjgxMjc2OTYyODk5MDUwOTEsIHk6MC4xNDU4MTUzNTgwNjcyOTk0fSx7eDowLjc2MTg2MzY3NTU4MjM5ODYsIHk6MC4xMzcxODcyMzAzNzEwMDk1fSx7eDowLjY5MzcwMTQ2Njc4MTcwODQsIHk6MC4xMzQ1OTg3OTIwNjIxMjI1Mn0se3g6MC41ODU4NDk4NzA1NzgwODQ2LCB5OjAuMTQzMjI2OTE5NzU4NDEyNDJ9LHt4OjAuNTE4NTUwNDc0NTQ3MDIzMywgeTowLjE2OTk3NDExNTYxNjkxMTE0fSx7eDowLjUwOTkyMjM0Njg1MDczMzMsIHk6MC4yMDc5Mzc4Nzc0ODA1ODY3fSx7eDowLjU1OTk2NTQ4NzQ4OTIxNDgsIHk6MC4yMzIwOTY2MzUwMzAxOTg0NX0se3g6MC42Mzc2MTg2MzY3NTU4MjQsIHk6MC4yMTQ4NDAzNzk2Mzc2MTg2NX0se3g6MC43MDY2NDM2NTgzMjYxNDMyLCB5OjAuMjEzOTc3NTY2ODY3OTg5NjN9LHt4OjAuNzkwMzM2NDk2OTgwMTU1MywgeTowLjIzNTU0Nzg4NjEwODcxNDR9LHt4OjAuODM5NTE2ODI0ODQ5MDA3OCwgeTowLjIxMTM4OTEyODU1OTEwMjY2fSx7eDowLjgzOTUxNjgyNDg0OTAwNzgsIHk6MC4xOTMyNzAwNjAzOTY4OTM4N30pLFxuICBuZXcgQXJyYXkoe3g6MC40OTA5NDA0NjU5MTg4OTU2LCB5OjAuMzE5MjQwNzI0NzYyNzI2NDd9LHt4OjAuNTAzMDE5ODQ0NjkzNzAxNCwgeTowLjI3ODY4ODUyNDU5MDE2Mzl9LHt4OjAuNTc1NDk2MTE3MzQyNTM2NywgeTowLjE5OTMwOTc0OTc4NDI5Njh9LHt4OjAuNjM4NDgxNDQ5NTI1NDUyOSwgeTowLjEzODA1MDA0MzE0MDYzODQ4fSx7eDowLjY3ODE3MDgzNjkyODM4NjUsIHk6MC4wOTY2MzUwMzAxOTg0NDY5NH0se3g6MC43MTQ0MDg5NzMyNTI4MDQyLCB5OjAuMTExMzAyODQ3MjgyMTM5Nzh9LHt4OjAuNzQ4MDU4NjcxMjY4MzM0OCwgeTowLjE3NjAxMzgwNTAwNDMxNDA3fSx7eDowLjgwNTAwNDMxNDA2Mzg0ODEsIHk6MC4yNjgzMzQ3NzEzNTQ2MTYwM30se3g6MC43OTIwNjIxMjI1MTk0MTMzLCB5OjAuMzIwMTAzNTM3NTMyMzU1NX0se3g6MC42NTU3Mzc3MDQ5MTgwMzI3LCB5OjAuMzMwNDU3MjkwNzY3OTAzMzd9LHt4OjAuNTQ1Mjk3NjcwNDA1NTIyLCB5OjAuMzE3NTE1MDk5MjIzNDY4NX0pLFxuICBuZXcgQXJyYXkoe3g6MC42MDc0MjAxODk4MTg4MDkzLCB5OjAuMTEyMTY1NjYwMDUxNzY4Nzd9LHt4OjAuNTgyMzk4NjE5NDk5NTY4NiwgeTowLjE0NzU0MDk4MzYwNjU1NzM3fSx7eDowLjU0NjE2MDQ4MzE3NTE1MSwgeTowLjIyMDAxNzI1NjI1NTM5MjZ9LHt4OjAuNTUzMDYyOTg1MzMyMTgyOSwgeTowLjMwODg4Njk3MTUyNzE3ODZ9LHt4OjAuNjQxOTMyNzAwNjAzOTY4OSwgeTowLjMwNzE2MTM0NTk4NzkyMDZ9LHt4OjAuNjcyMTMxMTQ3NTQwOTgzNiwgeTowLjIzNzI3MzUxMTY0Nzk3MjR9LHt4OjAuNjk2Mjg5OTA1MDkwNTk1MywgeTowLjE0OTI2NjYwOTE0NTgxNTM1fSx7eDowLjc1MzIzNTU0Nzg4NjEwODcsIHk6MC4xNDU4MTUzNTgwNjcyOTk0fSx7eDowLjczNjg0MjEwNTI2MzE1NzksIHk6MC4yODgxNzk0NjUwNTYwODI4M30se3g6MC44MDMyNzg2ODg1MjQ1OTAyLCB5OjAuMzMzMDQ1NzI5MDc2NzkwM30se3g6MC44MjIyNjA1Njk0NTY0MjgsIHk6MC4yMjY5MTk3NTg0MTI0MjQ1fSx7eDowLjczOTQzMDU0MzU3MjA0NDksIHk6MC4xMjA3OTM3ODc3NDgwNTg2N30se3g6MC42NzgxNzA4MzY5MjgzODY1LCB5OjAuMTE4MjA1MzQ5NDM5MTcxN30se3g6MC42MDU2OTQ1NjQyNzk1NTE0LCB5OjAuMTMxMTQ3NTQwOTgzNjA2NTZ9KSxcbiAgbmV3IEFycmF5KHt4OjAuNTE2ODI0ODQ5MDA3NzY1MywgeTowLjI3MDA2MDM5Njg5Mzg3NH0se3g6MC41MTMzNzM1OTc5MjkyNDkzLCB5OjAuMTkwNjgxNjIyMDg4MDA2OX0se3g6MC41NjI1NTM5MjU3OTgxMDE4LCB5OjAuMTMxMTQ3NTQwOTgzNjA2NTZ9LHt4OjAuNjI4OTkwNTA5MDU5NTM0MSwgeTowLjA5ODM2MDY1NTczNzcwNDkyfSx7eDowLjcwNDA1NTIyMDAxNzI1NjMsIHk6MC4wOTIzMjA5NjYzNTAzMDE5OX0se3g6MC43NTE1MDk5MjIzNDY4NTA4LCB5OjAuMTMxMTQ3NTQwOTgzNjA2NTZ9LHt4OjAuNzg5NDczNjg0MjEwNTI2MywgeTowLjE4NzIzMDM3MTAwOTQ5MDk0fSx7eDowLjg1MzMyMTgyOTE2MzA3MTYsIHk6MC4yNTYyNTUzOTI1Nzk4MTAxN30pLFxuICBuZXcgQXJyYXkoe3g6MC44Mjc0Mzc0NDYwNzQyMDE5LCB5OjAuMTM4OTEyODU1OTEwMjY3NDd9LHt4OjAuNzYxMDAwODYyODEyNzY5NiwgeTowLjEwMDk0OTA5NDA0NjU5MTg5fSx7eDowLjcwNTc4MDg0NTU1NjUxNDIsIHk6MC4wNzY3OTAzMzY0OTY5ODAxNX0se3g6MC42MzA3MTYxMzQ1OTg3OTIsIHk6MC4wNzU5Mjc1MjM3MjczNTExNn0se3g6MC41NDg3NDg5MjE0ODQwMzgsIHk6MC4wOTE0NTgxNTM1ODA2NzN9LHt4OjAuNDk2MTE3MzQyNTM2NjY5NTYsIHk6MC4xMzIwMTAzNTM3NTMyMzU1NX0se3g6MC40ODA1ODY3MTI2ODMzNDc3NCwgeTowLjE3NTE1MDk5MjIzNDY4NTA4fSx7eDowLjUxMDc4NTE1OTYyMDM2MjQsIHk6MC4yMTU3MDMxOTI0MDcyNDc2NH0se3g6MC41NjY4Njc5ODk2NDYyNDY3LCB5OjAuMjU2MjU1MzkyNTc5ODEwMTd9LHt4OjAuNjYwMDUxNzY4NzY2MTc3OCwgeTowLjMwMzcxMDA5NDkwOTQwNDY1fSx7eDowLjczNTExNjQ3OTcyMzg5OTksIHk6MC4zMDQ1NzI5MDc2NzkwMzM2N30se3g6MC43ODQyOTY4MDc1OTI3NTIzLCB5OjAuMzIxODI5MTYzMDcxNjEzNDd9LHt4OjAuODQwMzc5NjM3NjE4NjM2OCwgeTowLjMxMTQ3NTQwOTgzNjA2NTZ9LHt4OjAuODM2MDY1NTczNzcwNDkxOCwgeTowLjE5NTg1ODQ5ODcwNTc4MDg0fSksXG4gIG5ldyBBcnJheSh7eDowLjQ3OTcyMzg5OTkxMzcxODcsIHk6MC4zMDE5ODQ0NjkzNzAxNDY2N30se3g6MC40OTA5NDA0NjU5MTg4OTU2LCB5OjAuMjA3OTM3ODc3NDgwNTg2N30se3g6MC41MzIzNTU0Nzg4NjEwODcxLCB5OjAuMTI0MjQ1MDM4ODI2NTc0NjN9LHt4OjAuNjM5MzQ0MjYyMjk1MDgyLCB5OjAuMDg4ODY5NzE1MjcxNzg2MDN9LHt4OjAuNzczOTQzMDU0MzU3MjA0NSwgeTowLjA5OTIyMzQ2ODUwNzMzMzl9LHt4OjAuODQ3MjgyMTM5Nzc1NjY4NywgeTowLjE1NDQ0MzQ4NTc2MzU4OTN9LHt4OjAuODcwNTc4MDg0NTU1NjUxNCwgeTowLjI3MDkyMzIwOTY2MzUwMzAzfSx7eDowLjg0NDY5MzcwMTQ2Njc4MTcsIHk6MC4zMjQ0MTc2MDEzODA1MDA0fSx7eDowLjcyODIxMzk3NzU2Njg2OCwgeTowLjM0NTk4NzkyMDYyMTIyNTJ9LHt4OjAuNTMyMzU1NDc4ODYxMDg3MSwgeTowLjM0MDgxMTA0NDAwMzQ1MTI1fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIgPSBuZXcgQXJyYXkoXG4gIC8vbmV3IEFycmF5KHt4OjAuNDgyMjg4MTM1NTkzMjIwMzcsIHk6MC4yMDE2OTQ5MTUyNTQyMzczfSx7eDowLjQyMDQyMzcyODgxMzU1OTQsIHk6MC4yMDQyMzcyODgxMzU1OTMyMn0se3g6MC4zNzQ2NjEwMTY5NDkxNTI1NSwgeTowLjIwNTkzMjIwMzM4OTgzMDV9LHt4OjAuMzAyNjI3MTE4NjQ0MDY3OCwgeTowLjIwNzYyNzExODY0NDA2Nzh9LHt4OjAuMjg5OTE1MjU0MjM3Mjg4MTQsIHk6MC4yMTUyNTQyMzcyODgxMzU1OX0se3g6MC4yODQ4MzA1MDg0NzQ1NzYzLCB5OjAuMjI3OTY2MTAxNjk0OTE1MjR9LHt4OjAuMjgyMjg4MTM1NTkzMjIwMzYsIHk6MC4yNTE2OTQ5MTUyNTQyMzcyNn0se3g6MC4yNzQ2NjEwMTY5NDkxNTI1NywgeTowLjI2Njk0OTE1MjU0MjM3Mjl9LHt4OjAuMjU2MDE2OTQ5MTUyNTQyNCwgeTowLjI2OTQ5MTUyNTQyMzcyODg0fSx7eDowLjA3MjExODY0NDA2Nzc5NjYzLCB5OjAuMjcyMDMzODk4MzA1MDg0NzN9LHt4OjAuMDU1MTY5NDkxNTI1NDIzNzMsIHk6MC4yODA1MDg0NzQ1NzYyNzEyfSx7eDowLjA1MDA4NDc0NTc2MjcxMTg2NiwgeTowLjMwMzM4OTgzMDUwODQ3NDU3fSx7eDowLjA0NzU0MjM3Mjg4MTM1NTk0NiwgeTowLjQyNDU3NjI3MTE4NjQ0MDd9LHt4OjAuMDQ5MjM3Mjg4MTM1NTkzMjM1LCB5OjAuNDk4MzA1MDg0NzQ1NzYyNzR9LHt4OjAuMDU2ODY0NDA2Nzc5NjYxMDIsIHk6MC41MTM1NTkzMjIwMzM4OTgzfSx7eDowLjA2OTU3NjI3MTE4NjQ0MDY4LCB5OjAuNTE4NjQ0MDY3Nzk2NjEwMn0se3g6MC4wOTI0NTc2MjcxMTg2NDQwNywgeTowLjUyMTE4NjQ0MDY3Nzk2NjJ9LHt4OjAuMTA5NDA2Nzc5NjYxMDE2OTYsIHk6MC41MjYyNzExODY0NDA2Nzc5fSx7eDowLjExNDQ5MTUyNTQyMzcyODgzLCB5OjAuNTQyMzcyODgxMzU1OTMyMn0se3g6MC4xMTQ0OTE1MjU0MjM3Mjg4MywgeTowLjU1OTMyMjAzMzg5ODMwNX0pXG4gIG5ldyBBcnJheSh7eDowLjQ5Mzg5ODMwNTA4NDc0NTgsIHk6MC4yMTQ0MDY3Nzk2NjEwMTY5Nn0se3g6MC4zODAzMzg5ODMwNTA4NDc0LCB5OjAuMjExMDE2OTQ5MTUyNTQyMzh9LHt4OjAuMzQ4MTM1NTkzMjIwMzM5LCB5OjAuMjEyNzExODY0NDA2Nzc5Njd9LHt4OjAuMzIzNTU5MzIyMDMzODk4MywgeTowLjIxNjEwMTY5NDkxNTI1NDI0fSx7eDowLjMxNDIzNzI4ODEzNTU5MzIsIHk6MC4yMjAzMzg5ODMwNTA4NDc0NX0se3g6MC4zMDgzMDUwODQ3NDU3NjI3NCwgeTowLjIzMDUwODQ3NDU3NjI3MTJ9LHt4OjAuMzA1NzYyNzExODY0NDA2OCwgeTowLjI0ODMwNTA4NDc0NTc2Mjd9LHt4OjAuMzA0MDY3Nzk2NjEwMTY5NDcsIHk6MC4yNjI3MTE4NjQ0MDY3Nzk3fSx7eDowLjI5ODEzNTU5MzIyMDMzOSwgeTowLjI3MzcyODgxMzU1OTMyMjA1fSx7eDowLjI3OTQ5MTUyNTQyMzcyODgsIHk6MC4yODMwNTA4NDc0NTc2MjcxfSx7eDowLjA4NjI3MTE4NjQ0MDY3Nzk0LCB5OjAuMjgzMDUwODQ3NDU3NjI3MX0se3g6MC4wNjc2MjcxMTg2NDQwNjc3OSwgeTowLjI4ODEzNTU5MzIyMDMzOX0se3g6MC4wNTgzMDUwODQ3NDU3NjI3MSwgeTowLjI5OTE1MjU0MjM3Mjg4MTM2fSx7eDowLjA1NDA2Nzc5NjYxMDE2OTUsIHk6MC41MTc3OTY2MTAxNjk0OTE1fSx7eDowLjA2MTY5NDkxNTI1NDIzNzI2LCB5OjAuNTM3Mjg4MTM1NTkzMjIwM30se3g6MC4wNzYxMDE2OTQ5MTUyNTQyNiwgeTowLjU0NTc2MjcxMTg2NDQwNjd9LHt4OjAuMTEyNTQyMzcyODgxMzU1OTMsIHk6MC41NDY2MTAxNjk0OTE1MjU0fSx7eDowLjEyMzU1OTMyMjAzMzg5ODMsIHk6MC41NTMzODk4MzA1MDg0NzQ2fSx7eDowLjEyNjEwMTY5NDkxNTI1NDI1LCB5OjAuNTcxMTg2NDQwNjc3OTY2MX0se3g6MC4xMjUyNTQyMzcyODgxMzU2MiwgeTowLjU4ODEzNTU5MzIyMDMzOX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyUyA9IG5ldyBBcnJheShcbiAgLy9uZXcgQXJyYXkoe3g6MC40ODIyODgxMzU1OTMyMjAzNywgeTowLjIwMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDIwNDIzNzI4ODEzNTU5NCwgeTowLjIwNDIzNzI4ODEzNTU5MzIyfSx7eDowLjM3NDY2MTAxNjk0OTE1MjU1LCB5OjAuMjA1OTMyMjAzMzg5ODMwNX0se3g6MC4zMDI2MjcxMTg2NDQwNjc4LCB5OjAuMjA3NjI3MTE4NjQ0MDY3OH0se3g6MC4yODk5MTUyNTQyMzcyODgxNCwgeTowLjIxNTI1NDIzNzI4ODEzNTU5fSx7eDowLjI4NDgzMDUwODQ3NDU3NjMsIHk6MC4yMjc5NjYxMDE2OTQ5MTUyNH0se3g6MC4yODIyODgxMzU1OTMyMjAzNiwgeTowLjI1MTY5NDkxNTI1NDIzNzI2fSx7eDowLjI3NDY2MTAxNjk0OTE1MjU3LCB5OjAuMjY2OTQ5MTUyNTQyMzcyOX0se3g6MC4yNTYwMTY5NDkxNTI1NDI0LCB5OjAuMjY5NDkxNTI1NDIzNzI4ODR9LHt4OjAuMDcyMTE4NjQ0MDY3Nzk2NjMsIHk6MC4yNzIwMzM4OTgzMDUwODQ3M30se3g6MC4wNTUxNjk0OTE1MjU0MjM3MywgeTowLjI4MDUwODQ3NDU3NjI3MTJ9LHt4OjAuMDUwMDg0NzQ1NzYyNzExODY2LCB5OjAuMzAzMzg5ODMwNTA4NDc0NTd9LHt4OjAuMDQ3NTQyMzcyODgxMzU1OTQ2LCB5OjAuNDI0NTc2MjcxMTg2NDQwN30se3g6MC4wNDkyMzcyODgxMzU1OTMyMzUsIHk6MC40OTgzMDUwODQ3NDU3NjI3NH0se3g6MC4wNTY4NjQ0MDY3Nzk2NjEwMiwgeTowLjUxMzU1OTMyMjAzMzg5ODN9LHt4OjAuMDY5NTc2MjcxMTg2NDQwNjgsIHk6MC41MTg2NDQwNjc3OTY2MTAyfSx7eDowLjA5MjQ1NzYyNzExODY0NDA3LCB5OjAuNTIxMTg2NDQwNjc3OTY2Mn0se3g6MC4xMDk0MDY3Nzk2NjEwMTY5NiwgeTowLjUyNjI3MTE4NjQ0MDY3Nzl9LHt4OjAuMTE0NDkxNTI1NDIzNzI4ODMsIHk6MC41NDIzNzI4ODEzNTU5MzIyfSx7eDowLjExNDQ5MTUyNTQyMzcyODgzLCB5OjAuNTU5MzIyMDMzODk4MzA1fSlcbiAgbmV3IEFycmF5KHt4OjAuNTAxMzE5MjYxMjEzNzIwMywgeTowLjQ4MDg3MDcxMjQwMTA1NTR9LHt4OjAuNDQ3MjI5NTUxNDUxMTg3MywgeTowLjQ3ODIzMjE4OTk3MzYxNDh9LHt4OjAuMzg5MTgyMDU4MDQ3NDkzNCwgeTowLjQ3NjkxMjkyODc1OTg5NDQ0fSx7eDowLjMxNjYyMjY5MTI5Mjg3NiwgeTowLjQ3Mjk1NTE0NTExODczMzV9LHt4OjAuMjk0MTk1MjUwNjU5NjMwNiwgeTowLjQ4MjE4OTk3MzYxNDc3NTd9LHt4OjAuMjc4MzY0MTE2MDk0OTg2OCwgeTowLjUwNzI1NTkzNjY3NTQ2MTh9LHt4OjAuMjc4MzY0MTE2MDk0OTg2OCwgeTowLjUyNzA0NDg1NDg4MTI2NjV9LHt4OjAuMjcxNzY3ODEwMDI2Mzg1MiwgeTowLjU0OTQ3MjI5NTUxNDUxMTh9LHt4OjAuMjE4OTk3MzYxNDc3NTcyNTcsIHk6MC41NTYwNjg2MDE1ODMxMTM0fSx7eDowLjA0MjIxNjM1ODgzOTA1MDEzLCB5OjAuNTUyMTEwODE3OTQxOTUyNX0se3g6MC4wMjUwNjU5NjMwNjA2ODYwMTUsIHk6MC41NjI2NjQ5MDc2NTE3MTUxfSx7eDowLjAxMzE5MjYxMjEzNzIwMzE2NywgeTowLjU4Mzc3MzA4NzA3MTI0MDF9LHt4OjAuMDEwNTU0MDg5NzA5NzYyNTMzLCB5OjAuNjM3ODYyNzk2ODMzNzczMX0se3g6MC4wMTU4MzExMzQ1NjQ2NDM4LCB5OjAuNjgwMDc5MTU1NjcyODIzMn0se3g6MC4wMzQzMDA3OTE1NTY3MjgyMywgeTowLjY4NDAzNjkzOTMxMzk4NDF9LHt4OjAuMTU5NjMwNjA2ODYwMTU4MzEsIHk6MC42ODY2NzU0NjE3NDE0MjQ4fSx7eDowLjE3NDE0MjQ4MDIxMTA4MTgsIHk6MC42OTU5MTAyOTAyMzc0Njd9LHt4OjAuMTg2MDE1ODMxMTM0NTY0NjYsIHk6MC43MTE3NDE0MjQ4MDIxMTA4fSx7eDowLjE4OTk3MzYxNDc3NTcyNTU4LCB5OjAuNzMxNTMwMzQzMDA3OTE1NX0se3g6MC4yMDQ0ODU0ODgxMjY2NDkwNywgeTowLjc0NDcyMjk1NTE0NTExODh9LHt4OjAuNzM3NDY3MDE4NDY5NjU3LCB5OjAuNzQ0NzIyOTU1MTQ1MTE4OH0se3g6MC45NDU5MTAyOTAyMzc0NjcsIHk6MC43NX0se3g6MS4xMTYwOTQ5ODY4MDczODgsIHk6MC43NDYwNDIyMTYzNTg4Mzl9LHt4OjEuMTc5NDE5NTI1MDY1OTYzMSwgeTowLjczNTQ4ODEyNjY0OTA3NjV9LHt4OjEuMTg5OTczNjE0Nzc1NzI1NiwgeTowLjcxNzAxODQ2OTY1Njk5MjF9LHt4OjEuMTg5OTczNjE0Nzc1NzI1NiwgeTowLjY3MzQ4Mjg0OTYwNDIyMTd9LHt4OjEuMTg3MzM1MDkyMzQ4Mjg1LCB5OjAuNjIwNzEyNDAxMDU1NDA4OX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UzID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMSwgeTowLjYyfSwge3g6MC4xMiwgeTowLjY4fSwge3g6MC4xMywgeTowLjcyfSwge3g6MC4xNCwgeTowLjY4fSwge3g6MC4xMywgeTowLjYyfSwge3g6MC4xMSwgeTowLjZ9KSxcbiAgbmV3IEFycmF5KHt4OjAuMDgsIHk6MC42fSwge3g6MC4wOSwgeTowLjU4fSwge3g6MC4xLCB5OjAuNTJ9LCB7eDowLjEyLCB5OjAuNTh9LCB7eDowLjEzLCB5OjAuNjR9LCB7eDowLjA5LCB5OjAuNjJ9KSxcbiAgbmV3IEFycmF5KHt4OjAuMTMsIHk6MC42OH0sIHt4OjAuMTIsIHk6MC42Mn0sIHt4OjAuMTEsIHk6MC41OH0sIHt4OjAuMTIsIHk6MC41N30sIHt4OjAuMTMsIHk6MC41OH0sIHt4OjAuMTEsIHk6MC42Mn0pLFxuICBuZXcgQXJyYXkoe3g6MC4xMjc5NjYxMDE2OTQ5MTUyNiwgeTowLjYxOTQ5MTUyNTQyMzcyODh9LHt4OjAuMTE5NDkxNTI1NDIzNzI4ODIsIHk6MC42MzIyMDMzODk4MzA1MDg1fSx7eDowLjExMDE2OTQ5MTUyNTQyMzczLCB5OjAuNjU0MjM3Mjg4MTM1NTkzMn0se3g6MC4xLCB5OjAuNjc5NjYxMDE2OTQ5MTUyNn0se3g6MC4xMDY3Nzk2NjEwMTY5NDkxNSwgeTowLjcxMDE2OTQ5MTUyNTQyMzd9LHt4OjAuMTM1NTkzMjIwMzM4OTgzMDUsIHk6MC43MTEwMTY5NDkxNTI1NDIzfSx7eDowLjE0NTc2MjcxMTg2NDQwNjc5LCB5OjAuNjgxMzU1OTMyMjAzMzg5OX0se3g6MC4xNDY2MTAxNjk0OTE1MjU0MiwgeTowLjY0NTc2MjcxMTg2NDQwNjh9LHt4OjAuMTQyMzcyODgxMzU1OTMyMiwgeTowLjU4MjIwMzM4OTgzMDUwODV9LHt4OjAuMTMzODk4MzA1MDg0NzQ1NzYsIHk6MC41NTkzMjIwMzM4OTgzMDV9LHt4OjAuMTA3NjI3MTE4NjQ0MDY3NzksIHk6MC41NjY5NDkxNTI1NDIzNzI5fSx7eDowLjEwOTMyMjAzMzg5ODMwNTA4LCB5OjAuNTk5MTUyNTQyMzcyODgxNH0pLFxuICBuZXcgQXJyYXkoe3g6MC4xNDQ5MTUyNTQyMzcyODgxMywgeTowLjU3OTY2MTAxNjk0OTE1MjV9LHt4OjAuMTQ5MTUyNTQyMzcyODgxMzYsIHk6MC41NjAxNjk0OTE1MjU0MjM3fSx7eDowLjEyNzk2NjEwMTY5NDkxNTI2LCB5OjAuNTV9LHt4OjAuMTEyNzExODY0NDA2Nzc5NjYsIHk6MC41NTY3Nzk2NjEwMTY5NDkyfSx7eDowLjEzNjQ0MDY3Nzk2NjEwMTY4LCB5OjAuNTk5MTUyNTQyMzcyODgxNH0se3g6MC4xMTYxMDE2OTQ5MTUyNTQyNCwgeTowLjYyNDU3NjI3MTE4NjQ0MDd9LHt4OjAuMTAzMzg5ODMwNTA4NDc0NTcsIHk6MC42NjM1NTkzMjIwMzM4OTgzfSx7eDowLjEyMDMzODk4MzA1MDg0NzQ2LCB5OjAuNjc1NDIzNzI4ODEzNTU5M30se3g6MC4xNDU3NjI3MTE4NjQ0MDY3OSwgeTowLjY5NDkxNTI1NDIzNzI4ODJ9LHt4OjAuMTI2MjcxMTg2NDQwNjc3OTcsIHk6MC43MTUyNTQyMzcyODgxMzU2fSx7eDowLjEwNzYyNzExODY0NDA2Nzc5LCB5OjAuNjg4MTM1NTkzMjIwMzM5fSx7eDowLjEyNDU3NjI3MTE4NjQ0MDY4LCB5OjAuNjI4ODEzNTU5MzIyMDMzOX0se3g6MC4xMzgxMzU1OTMyMjAzMzg5NywgeTowLjU4NjQ0MDY3Nzk2NjEwMTd9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlM1MgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDoxLjE2ODQyMTA1MjYzMTU3OSwgeTowLjYyNjk3MzY4NDIxMDUyNjN9LHt4OjEuMiwgeTowLjYyNjk3MzY4NDIxMDUyNjN9LHt4OjEuMjI1LCB5OjAuNjEyNX0se3g6MS4yMDI2MzE1Nzg5NDczNjg1LCB5OjAuNjA1OTIxMDUyNjMxNTc4OX0se3g6MS4xNzEwNTI2MzE1Nzg5NDczLCB5OjAuNjA0NjA1MjYzMTU3ODk0OH0se3g6MS4xNTkyMTA1MjYzMTU3ODk1LCB5OjAuNTkwMTMxNTc4OTQ3MzY4NX0se3g6MS4yMDUyNjMxNTc4OTQ3MzY4LCB5OjAuNTg4ODE1Nzg5NDczNjg0Mn0se3g6MS4yMjM2ODQyMTA1MjYzMTU3LCB5OjAuNTc0MzQyMTA1MjYzMTU3OX0se3g6MS4yMTk3MzY4NDIxMDUyNjMyLCB5OjAuNTYyNX0se3g6MS4xOTQ3MzY4NDIxMDUyNjMsIHk6MC41NTQ2MDUyNjMxNTc4OTQ3fSx7eDoxLjE3MTA1MjYzMTU3ODk0NzMsIHk6MC41NjExODQyMTA1MjYzMTU4fSx7eDoxLjE2OTczNjg0MjEwNTI2MzIsIHk6MC41Nzk2MDUyNjMxNTc4OTQ3fSx7eDoxLjIyMjM2ODQyMTA1MjYzMTUsIHk6MC41ODg4MTU3ODk0NzM2ODQyfSx7eDoxLjIxNTc4OTQ3MzY4NDIxMDUsIHk6MC42MDk4Njg0MjEwNTI2MzE2fSx7eDoxLjE5MjEwNTI2MzE1Nzg5NDgsIHk6MC42MjAzOTQ3MzY4NDIxMDUyfSksXG4gIG5ldyBBcnJheSh7eDoxLjIxNDQ3MzY4NDIxMDUyNjQsIHk6MC42MTc3NjMxNTc4OTQ3MzY4fSx7eDoxLjIyNzYzMTU3ODk0NzM2ODQsIHk6MC41NjkwNzg5NDczNjg0MjF9LHt4OjEuMjA1MjYzMTU3ODk0NzM2OCwgeTowLjU1OTg2ODQyMTA1MjYzMTZ9LHt4OjEuMTcxMDUyNjMxNTc4OTQ3MywgeTowLjU3MTcxMDUyNjMxNTc4OTR9LHt4OjEuMTU1MjYzMTU3ODk0NzM2OCwgeTowLjYwMDY1Nzg5NDczNjg0MjF9LHt4OjEuMTY3MTA1MjYzMTU3ODk0NiwgeTowLjYyNTY1Nzg5NDczNjg0MjF9LHt4OjEuMiwgeTowLjYyMzAyNjMxNTc4OTQ3Mzd9LHt4OjEuMjE3MTA1MjYzMTU3ODk0NywgeTowLjU5OTM0MjEwNTI2MzE1Nzl9LHt4OjEuMjA3ODk0NzM2ODQyMTA1NCwgeTowLjU4MjIzNjg0MjEwNTI2MzJ9LHt4OjEuMTc4OTQ3MzY4NDIxMDUyNSwgeTowLjU4NDg2ODQyMTA1MjYzMTZ9LHt4OjEuMTcxMDUyNjMxNTc4OTQ3MywgeTowLjYwODU1MjYzMTU3ODk0NzN9LHt4OjEuMTkwNzg5NDczNjg0MjEwNiwgeTowLjYxNjQ0NzM2ODQyMTA1MjZ9LHt4OjEuMjIxMDUyNjMxNTc4OTQ3NCwgeTowLjYxNjQ0NzM2ODQyMTA1MjZ9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNCA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMTI2MTAxNjk0OTE1MjU0MjUsIHk6MC43NTMzODk4MzA1MDg0NzQ1fSx7eDowLjEyOTQ5MTUyNTQyMzcyODgzLCB5OjAuNzc0NTc2MjcxMTg2NDQwN30se3g6MC4xMzAzMzg5ODMwNTA4NDc0NiwgeTowLjgwMjU0MjM3Mjg4MTM1NTl9LHt4OjAuMTI5NDkxNTI1NDIzNzI4ODMsIHk6MC44MzIyMDMzODk4MzA1MDg1fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRTID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MS4xOTMyNjY4MzI5MTc3MDU2LCB5OjAuNTQ2MTM0NjYzMzQxNjQ1OH0se3g6MS4xOTA3NzMwNjczMzE2NzA4LCB5OjAuNTI3NDMxNDIxNDQ2Mzg0fSx7eDoxLjE5MDc3MzA2NzMzMTY3MDgsIHk6MC41MDM3NDA2NDgzNzkwNTI0fSx7eDoxLjE5NDUxMzcxNTcxMDcyMzMsIHk6MC40ODYyODQyODkyNzY4MDh9LHt4OjEuMTkzMjY2ODMyOTE3NzA1NiwgeTowLjQ3MjU2ODU3ODU1MzYxNTk1fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTUgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjExLCB5OjAuODJ9LCB7eDowLjEyLCB5OjAuODh9LCB7eDowLjEzLCB5OjAuOTJ9LCB7eDowLjE0LCB5OjAuODh9LCB7eDowLjEzLCB5OjAuODJ9LCB7eDowLjExLCB5OjAuOH0pLFxuICBuZXcgQXJyYXkoe3g6MC4wOCwgeTowLjh9LCB7eDowLjA5LCB5OjAuNzh9LCB7eDowLjEsIHk6MC44Mn0sIHt4OjAuMTIsIHk6MC43OH0sIHt4OjAuMTMsIHk6MC44NH0sIHt4OjAuMDksIHk6MC44Mn0pLFxuICBuZXcgQXJyYXkoe3g6MC4xMywgeTowLjg4fSwge3g6MC4xMiwgeTowLjgyfSwge3g6MC4xMSwgeTowLjc4fSwge3g6MC4xMiwgeTowLjc3fSwge3g6MC4xMywgeTowLjc4fSwge3g6MC4xMSwgeTowLjgyfSksXG4gIG5ldyBBcnJheSh7eDowLjE0NzQ1NzYyNzExODY0NDA3LCB5OjAuNzY5NDkxNTI1NDIzNzI4OH0se3g6MC4xMTY5NDkxNTI1NDIzNzI4OCwgeTowLjc3Mjg4MTM1NTkzMjIwMzR9LHt4OjAuMDk1NzYyNzExODY0NDA2NzgsIHk6MC43ODEzNTU5MzIyMDMzODk4fSx7eDowLjA4NDc0NTc2MjcxMTg2NDQsIHk6MC44MDY3Nzk2NjEwMTY5NDkyfSx7eDowLjEsIHk6MC44MzcyODgxMzU1OTMyMjA0fSx7eDowLjEzMzg5ODMwNTA4NDc0NTc2LCB5OjAuODUzMzg5ODMwNTA4NDc0Nn0se3g6MC4xNTE2OTQ5MTUyNTQyMzcyOCwgeTowLjgzODEzNTU5MzIyMDMzOX0se3g6MC4xNjM1NTkzMjIwMzM4OTgzLCB5OjAuODAyNTQyMzcyODgxMzU1OX0pLFxuICBuZXcgQXJyYXkoe3g6MC4xMTUyNTQyMzcyODgxMzU2LCB5OjAuODUwODQ3NDU3NjI3MTE4N30se3g6MC4wOTA2Nzc5NjYxMDE2OTQ5MiwgeTowLjgyMDMzODk4MzA1MDg0NzR9LHt4OjAuMDk4MzA1MDg0NzQ1NzYyNzIsIHk6MC43OTU3NjI3MTE4NjQ0MDY3fSx7eDowLjExMjcxMTg2NDQwNjc3OTY2LCB5OjAuNzc1NDIzNzI4ODEzNTU5NH0se3g6MC4xMzg5ODMwNTA4NDc0NTc2MywgeTowLjc3OTY2MTAxNjk0OTE1MjZ9LHt4OjAuMTM1NTkzMjIwMzM4OTgzMDUsIHk6MC44MDMzODk4MzA1MDg0NzQ2fSx7eDowLjE0NzQ1NzYyNzExODY0NDA3LCB5OjAuODI3MTE4NjQ0MDY3Nzk2Nn0se3g6MC4xMjYyNzExODY0NDA2Nzc5NywgeTowLjg0OTE1MjU0MjM3Mjg4MTR9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNVMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDoxLjE3NzA1NzM1NjYwODQ3ODgsIHk6MC40NzM4MTU0NjEzNDY2MzM0NH0se3g6MS4xNjk1NzYwNTk4NTAzNzQyLCB5OjAuNDYxMzQ2NjMzNDE2NDU4OX0se3g6MS4xNzQ1NjM1OTEwMjI0NDQsIHk6MC40Mjg5Mjc2ODA3OTgwMDV9LHt4OjEuMjAwNzQ4MTI5Njc1ODEwNSwgeTowLjQxMjcxODIwNDQ4ODc3ODA1fSx7eDoxLjIwOTQ3NjMwOTIyNjkzMjcsIHk6MC4zOTAyNzQzMTQyMTQ0NjM4NX0se3g6MS4yMDk0NzYzMDkyMjY5MzI3LCB5OjAuMzY5MDc3MzA2NzMzMTY3MX0se3g6MS4yMDMyNDE4OTUyNjE4NDUzLCB5OjAuMzUxNjIwOTQ3NjMwOTIyN30se3g6MS4xOTU3NjA1OTg1MDM3NDA3LCB5OjAuMzM1NDExNDcxMzIxNjk1NzR9LHt4OjEuMTg0NTM4NjUzMzY2NTgzNiwgeTowLjMzMDQyMzk0MDE0OTYyNTk1fSx7eDoxLjE3MzMxNjcwODIyOTQyNjUsIHk6MC4zNDkxMjcxODIwNDQ4ODc4fSx7eDoxLjE4MDc5ODAwNDk4NzUzMSwgeTowLjM2NzgzMDQyMzk0MDE0OTY0fSx7eDoxLjE5NTc2MDU5ODUwMzc0MDcsIHk6MC40MDE0OTYyNTkzNTE2MjA5fSx7eDoxLjE4NDUzODY1MzM2NjU4MzYsIHk6MC40MjE0NDYzODQwMzk5MDAyNn0se3g6MS4xOTU3NjA1OTg1MDM3NDA3LCB5OjAuNDYwMDk5NzUwNjIzNDQxNH0se3g6MS4xODA3OTgwMDQ5ODc1MzEsIHk6MC40NzM4MTU0NjEzNDY2MzM0NH0pLFxuICBuZXcgQXJyYXkoe3g6MS4yMDk0NzYzMDkyMjY5MzI3LCB5OjAuMzA5MjI2OTMyNjY4MzI5Mn0se3g6MS4xODQ1Mzg2NTMzNjY1ODM2LCB5OjAuMzE0MjE0NDYzODQwMzk5fSx7eDoxLjE3MzMxNjcwODIyOTQyNjUsIHk6MC4zMzY2NTgzNTQxMTQ3MTMyM30se3g6MS4xODQ1Mzg2NTMzNjY1ODM2LCB5OjAuMzU3ODU1MzYxNTk2MDF9LHt4OjEuMTkzMjY2ODMyOTE3NzA1NiwgeTowLjM3NzgwNTQ4NjI4NDI4OTN9LHt4OjEuMTc5NTUxMTIyMTk0NTEzNiwgeTowLjQwNTIzNjkwNzczMDY3MzMzfSx7eDoxLjE2NDU4ODUyODY3ODMwNDIsIHk6MC40MzI2NjgzMjkxNzcwNTczM30se3g6MS4xNjQ1ODg1Mjg2NzgzMDQyLCB5OjAuNDU4ODUyODY3ODMwNDIzOTV9LHt4OjEuMTc4MzA0MjM5NDAxNDk2MiwgeTowLjQ4MTI5Njc1ODEwNDczODE1fSx7eDoxLjE5ODI1NDM2NDA4OTc3NTYsIHk6MC40ODEyOTY3NTgxMDQ3MzgxNX0se3g6MS4yMDU3MzU2NjA4NDc4ODAyLCB5OjAuNDU3NjA1OTg1MDM3NDA2NDZ9LHt4OjEuMTk1NzYwNTk4NTAzNzQwNywgeTowLjQxMzk2NTA4NzI4MTc5NTV9LHt4OjEuMjAzMjQxODk1MjYxODQ1MywgeTowLjM2MTU5NjAwOTk3NTA2MjM2fSx7eDoxLjIwODIyOTQyNjQzMzkxNTMsIHk6MC4zMjI5NDI2NDMzOTE1MjEyfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTYgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjEyOTQ5MTUyNTQyMzcyODgzLCB5OjAuODM5ODMwNTA4NDc0NTc2M30se3g6MC4xMjk0OTE1MjU0MjM3Mjg4MywgeTowLjg4NzI4ODEzNTU5MzIyMDN9LHt4OjAuMTMwMzM4OTgzMDUwODQ3NDYsIHk6MC45MzMwNTA4NDc0NTc2MjcxfSx7eDowLjEyOTQ5MTUyNTQyMzcyODgzLCB5OjEuMDV9LHt4OjAuMTM0NTc2MjcxMTg2NDQwNjcsIHk6MS4wNjI3MTE4NjQ0MDY3Nzk3fSx7eDowLjE0NjQ0MDY3Nzk2NjEwMTcyLCB5OjEuMDcyMDMzODk4MzA1MDg0OH0se3g6MC4yNzQ0MDY3Nzk2NjEwMTY5NSwgeToxLjA2ODY0NDA2Nzc5NjYxMDN9LHt4OjAuMjkxMzU1OTMyMjAzMzg5ODQsIHk6MS4wNzg4MTM1NTkzMjIwMzM4fSx7eDowLjMwMjM3Mjg4MTM1NTkzMjIsIHk6MS4wOTkxNTI1NDIzNzI4ODE0fSx7eDowLjMwNTc2MjcxMTg2NDQwNjgsIHk6MS4xMjYyNzExODY0NDA2Nzh9LHt4OjAuMzIwMTY5NDkxNTI1NDIzNywgeToxLjE0MjM3Mjg4MTM1NTkzMjJ9LHt4OjAuNDQyMjAzMzg5ODMwNTA4NSwgeToxLjE0MTUyNTQyMzcyODgxMzV9LHt4OjAuNDYxNjk0OTE1MjU0MjM3MywgeToxLjE1MzM4OTgzMDUwODQ3NDd9LHt4OjAuNDY4NDc0NTc2MjcxMTg2NDQsIHk6MS4xNzAzMzg5ODMwNTA4NDc1fSx7eDowLjQ2NzYyNzExODY0NDA2Nzc1LCB5OjEuMjY4NjQ0MDY3Nzk2NjEwMn0se3g6MC40NzEwMTY5NDkxNTI1NDI0LCB5OjEuMzAyNTQyMzcyODgxMzU1OX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2UyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjEuMTg1Nzg1NTM2MTU5NjAxLCB5OjAuMjYxODQ1Mzg2NTMzNjY1ODV9LHt4OjEuMTgyMDQ0ODg3NzgwNTQ4NywgeTowLjI0MTg5NTI2MTg0NTM4NjU0fSx7eDoxLjE2NDU4ODUyODY3ODMwNDIsIHk6MC4yMzE5MjAxOTk1MDEyNDY4N30se3g6MS4xNDgzNzkwNTIzNjkwNzczLCB5OjAuMjI5NDI2NDMzOTE1MjExOTd9LHt4OjEuMTI0Njg4Mjc5MzAxNzQ1NiwgeTowLjIzMzE2NzA4MjI5NDI2NDMzfSx7eDoxLjExNzIwNjk4MjU0MzY0MDgsIHk6MC4yMjE5NDUxMzcxNTcxMDcyM30se3g6MS4xMTM0NjYzMzQxNjQ1ODg1LCB5OjAuMTg4Mjc5MzAxNzQ1NjM1OX0se3g6MS4xMTIyMTk0NTEzNzE1NzEsIHk6MC4xNDk2MjU5MzUxNjIwOTQ3N30se3g6MS4xMTM0NjYzMzQxNjQ1ODg1LCB5OjAuMDk0NzYzMDkyMjY5MzI2Njh9LHt4OjEuMTIwOTQ3NjMwOTIyNjkzMywgeTowLjA3ODU1MzYxNTk2MDA5OTc2fSx7eDoxLjE0MzM5MTUyMTE5NzAwNzQsIHk6MC4wNjk4MjU0MzY0MDg5Nzc1NX0se3g6MS4yMzMxNjcwODIyOTQyNjQ0LCB5OjAuMDY2MDg0Nzg4MDI5OTI1MTl9LHt4OjEuNDg2Mjg0Mjg5Mjc2ODA4LCB5OjAuMDY2MDg0Nzg4MDI5OTI1MTl9LHt4OjEuNTA3NDgxMjk2NzU4MTA0OCwgeTowLjA3MTA3MjMxOTIwMTk5NTAxfSx7eDoxLjUxNzQ1NjM1OTEwMjI0NDMsIHk6MC4wODEwNDczODE1NDYxMzQ2N30se3g6MS41MTk5NTAxMjQ2ODgyNzk0LCB5OjAuMTAyMjQ0Mzg5MDI3NDMxNDJ9LHt4OjEuNTMxMTcyMDY5ODI1NDM2MywgeTowLjExNDcxMzIxNjk1NzYwNTk5fSx7eDoxLjU3ODU1MzYxNTk2MDA5OTcsIHk6MC4xMjIxOTQ1MTM3MTU3MTA3Mn0se3g6MS44ODE1NDYxMzQ2NjMzNDE4LCB5OjAuMTIwOTQ3NjMwOTIyNjkzMjd9LHt4OjIuMTMzNDE2NDU4ODUyODY3NywgeTowLjExODQ1Mzg2NTMzNjY1ODM2fSx7eDoyLjE2MzM0MTY0NTg4NTI4NywgeTowLjEyNTkzNTE2MjA5NDc2MzF9LHt4OjIuMTcyMDY5ODI1NDM2NDA5LCB5OjAuMTQzMzkxNTIxMTk3MDA3NX0se3g6Mi4xNzIwNjk4MjU0MzY0MDksIHk6MC4xNTcxMDcyMzE5MjAxOTk1fSx7eDoyLjE5OTUwMTI0Njg4Mjc5MywgeTowLjE3NzA1NzM1NjYwODQ3ODh9LHt4OjIuMzI1NDM2NDA4OTc3NTU2LCB5OjAuMTc1ODEwNDczODE1NDYxMzZ9LHt4OjIuMzUxNjIwOTQ3NjMwOTIyNywgeTowLjE4NTc4NTUzNjE1OTYwMX0se3g6Mi4zNjAzNDkxMjcxODIwNDQ3LCB5OjAuMjAxOTk1MDEyNDY4ODI3OTJ9LHt4OjIuMzYxNTk2MDA5OTc1MDYyLCB5OjAuMjMzMTY3MDgyMjk0MjY0MzN9LHt4OjIuMzc2NTU4NjAzNDkxMjcyLCB5OjAuMjUzMTE3MjA2OTgyNTQzNjR9LHt4OjIuNDAzOTkwMDI0OTM3NjU2LCB5OjAuMjU4MTA0NzM4MTU0NjEzNX0se3g6Mi41MDQ5ODc1MzExNzIwNjk3LCB5OjAuMjUzMTE3MjA2OTgyNTQzNjR9LHt4OjIuNTI3NDMxNDIxNDQ2Mzg0LCB5OjAuMjY1NTg2MDM0OTEyNzE4Mn0se3g6Mi41Mzg2NTMzNjY1ODM1NDEzLCB5OjAuMjgwNTQ4NjI4NDI4OTI3N30se3g6Mi41Mzk5MDAyNDkzNzY1NTksIHk6MC4zNjE1OTYwMDk5NzUwNjIzNn0se3g6Mi41Mzk5MDAyNDkzNzY1NTksIHk6MC40ODI1NDM2NDA4OTc3NTU2fSx7eDoyLjU1MjM2OTA3NzMwNjczMywgeTowLjU1NjEwOTcyNTY4NTc4NTV9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuNDEwMTY5NDkxNTI1NDIzNywgeToxLjE4ODEzNTU5MzIyMDMzOX0se3g6MC4zODIyMDMzODk4MzA1MDg1LCB5OjEuMjEwMTY5NDkxNTI1NDIzN30se3g6MC4zNzU0MjM3Mjg4MTM1NTkzNCwgeToxLjI1NTA4NDc0NTc2MjcxMn0se3g6MC4zOTE1MjU0MjM3Mjg4MTM1NSwgeToxLjI5MjM3Mjg4MTM1NTkzMjN9LHt4OjAuNDM3Mjg4MTM1NTkzMjIwMzMsIHk6MS4zMTUyNTQyMzcyODgxMzU1fSx7eDowLjQ3NDU3NjI3MTE4NjQ0MDcsIHk6MS4zMDY3Nzk2NjEwMTY5NDl9LHt4OjAuNSwgeToxLjI3NjI3MTE4NjQ0MDY3OH0se3g6MC41MDU5MzIyMDMzODk4MzA1LCB5OjEuMjMzMDUwODQ3NDU3NjI3Mn0se3g6MC40Njc3OTY2MTAxNjk0OTE1MywgeToxLjE4Mzg5ODMwNTA4NDc0NTh9KSxcbiAgbmV3IEFycmF5KHt4OjAuNDYwMTY5NDkxNTI1NDIzNzUsIHk6MS4yMzcyODgxMzU1OTMyMjA0fSx7eDowLjQ3NjI3MTE4NjQ0MDY3Nzk1LCB5OjEuMjU4NDc0NTc2MjcxMTg2NH0se3g6MC40NzI4ODEzNTU5MzIyMDM0LCB5OjEuMzAwODQ3NDU3NjI3MTE4N30se3g6MC40MjAzMzg5ODMwNTA4NDc0NCwgeToxLjMwODQ3NDU3NjI3MTE4NjV9LHt4OjAuMzg4MTM1NTkzMjIwMzM4OTcsIHk6MS4yNjg2NDQwNjc3OTY2MTAyfSx7eDowLjQwNDIzNzI4ODEzNTU5MzIzLCB5OjEuMjM4MTM1NTkzMjIwMzM5fSx7eDowLjQ1MDg0NzQ1NzYyNzExODY0LCB5OjEuMjYyNzExODY0NDA2Nzc5Nn0se3g6MC40OTQ5MTUyNTQyMzcyODgxNiwgeToxLjI0NDkxNTI1NDIzNzI4OH0se3g6MC41MDg0NzQ1NzYyNzExODY0LCB5OjEuMjE1MjU0MjM3Mjg4MTM1Nn0se3g6MC40Nzk2NjEwMTY5NDkxNTI1MywgeToxLjE4MTM1NTkzMjIwMzM4OTd9KSxcbiAgbmV3IEFycmF5KHt4OjAuNDEyNzExODY0NDA2Nzc5NjUsIHk6MS4xOTIzNzI4ODEzNTU5MzIyfSx7eDowLjQ3Mjg4MTM1NTkzMjIwMzQsIHk6MS4yfSx7eDowLjUwNTkzMjIwMzM4OTgzMDUsIHk6MS4yNDgzMDUwODQ3NDU3NjI2fSx7eDowLjUwMzM4OTgzMDUwODQ3NDUsIHk6MS4yOTQ5MTUyNTQyMzcyODgxfSx7eDowLjQzNzI4ODEzNTU5MzIyMDMzLCB5OjEuM30se3g6MC4zODU1OTMyMjAzMzg5ODMxLCB5OjEuMjg0NzQ1NzYyNzExODY0NH0se3g6MC4zNzYyNzExODY0NDA2NzgsIHk6MS4yNDIzNzI4ODEzNTU5MzIzfSx7eDowLjQyMzcyODgxMzU1OTMyMiwgeToxLjI0NzQ1NzYyNzExODY0NDJ9LHt4OjAuNDY1MjU0MjM3Mjg4MTM1NiwgeToxLjIxOTQ5MTUyNTQyMzcyODl9LHt4OjAuNDE2OTQ5MTUyNTQyMzcyODYsIHk6MS4xODcyODgxMzU1OTMyMjAzfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTdTID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6Mi41MzA3Nzk3NTM3NjE5NywgeTowLjUzMDA5NTc1OTIzMzkyNjJ9LHt4OjIuNTA2MTU1OTUwNzUyMzk0LCB5OjAuNTQ5MjQ3NjA2MDE5MTUxOX0se3g6Mi40ODgzNzIwOTMwMjMyNTYsIHk6MC41ODQ4MTUzMjE0Nzc0MjgyfSx7eDoyLjQ4ODM3MjA5MzAyMzI1NiwgeTowLjYyMDM4MzAzNjkzNTcwNDV9LHt4OjIuNTA3NTIzOTM5ODA4NDgxNywgeTowLjY0NTAwNjgzOTk0NTI4MDR9LHt4OjIuNTQ1ODI3NjMzMzc4OTMzLCB5OjAuNjUwNDc4Nzk2MTY5NjMwN30se3g6Mi41NzE4MTk0MjU0NDQ1OTY1LCB5OjAuNjM4MTY2ODk0NjY0ODQyN30se3g6Mi41ODQxMzEzMjY5NDkzODQsIHk6MC41OTcxMjcyMjI5ODIyMTYxfSx7eDoyLjU3ODY1OTM3MDcyNTAzNDMsIHk6MC41NTMzNTE1NzMxODc0MTQ1fSx7eDoyLjU0OTkzMTYwMDU0NzE5NTUsIHk6MC41NDY1MTE2Mjc5MDY5NzY3fSx7eDoyLjUxOTgzNTg0MTMxMzI2OTMsIHk6MC41NTg4MjM1Mjk0MTE3NjQ3fSx7eDoyLjU0NTgyNzYzMzM3ODkzMywgeTowLjU3Nzk3NTM3NjE5Njk5MDV9LHt4OjIuNTU0MDM1NTY3NzE1NDU4NSwgeTowLjYyNTg1NDk5MzE2MDA1NDh9LHt4OjIuNTIyNTcxODE5NDI1NDQ0NSwgeTowLjYzOTUzNDg4MzcyMDkzMDN9LHt4OjIuNDgyOTAwMTM2Nzk4OTA1NCwgeTowLjYyMDM4MzAzNjkzNTcwNDV9LHt4OjIuNDkxMTA4MDcxMTM1NDMxLCB5OjAuNTk1NzU5MjMzOTI2MTI4Nn0se3g6Mi41NjA4NzU1MTI5OTU4OTYsIHk6MC41OTU3NTkyMzM5MjYxMjg2fSx7eDoyLjU2MDg3NTUxMjk5NTg5NiwgeTowLjU2NDI5NTQ4NTYzNjExNDl9LHt4OjIuNTM2MjUxNzA5OTg2MzIsIHk6MC41NjQyOTU0ODU2MzYxMTQ5fSx7eDoyLjQ5NTIxMjAzODMwMzY5MzUsIHk6MC41NjAxOTE1MTg0Njc4NTIzfSx7eDoyLjUxOTgzNTg0MTMxMzI2OTMsIHk6MC41MzI4MzE3MzczNDYxMDEyfSx7eDoyLjU3MTgxOTQyNTQ0NDU5NjUsIHk6MC41NTQ3MTk1NjIyNDM1MDJ9LHt4OjIuNTcxODE5NDI1NDQ0NTk2NSwgeTowLjU5ODQ5NTIxMjAzODMwMzd9LHt4OjIuNTMwNzc5NzUzNzYxOTcsIHk6MC42MjE3NTEwMjU5OTE3OTIxfSx7eDoyLjU1Njc3MTU0NTgyNzYzMywgeTowLjY1ODY4NjczMDUwNjE1Nn0se3g6Mi41ODk2MDMyODMxNzM3MzQ2LCB5OjAuNjM0MDYyOTI3NDk2NTh9LHt4OjIuNTc0NTU1NDAzNTU2NzcxNywgeTowLjYwOTQzOTEyNDQ4NzAwNDF9LHt4OjIuNTE3MDk5ODYzMjAxMDk0NiwgeTowLjU5NDM5MTI0NDg3MDA0MX0se3g6Mi41MjI1NzE4MTk0MjU0NDQ1LCB5OjAuNTU4ODIzNTI5NDExNzY0N30se3g6Mi41NDMwOTE2NTUyNjY3NTc3LCB5OjAuNTUzMzUxNTczMTg3NDE0NX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC41MjQ0OTE1MjU0MjM3Mjg4LCB5OjEuMzU0MjM3Mjg4MTM1NTkzM30se3g6MC41NDk5MTUyNTQyMzcyODgsIHk6MS4zNTI1NDIzNzI4ODEzNTZ9LHt4OjAuNTc3MDMzODk4MzA1MDg0NywgeToxLjM1MzM4OTgzMDUwODQ3NDZ9LHt4OjAuNTg4MDUwODQ3NDU3NjI3MSwgeToxLjM1OTMyMjAzMzg5ODMwNTJ9LHt4OjAuNTk2NTI1NDIzNzI4ODEzNiwgeToxLjM3MDMzODk4MzA1MDg0NzR9LHt4OjAuNTk1Njc3OTY2MTAxNjk0OSwgeToxLjM5NDA2Nzc5NjYxMDE2OTZ9LHt4OjAuNTk1Njc3OTY2MTAxNjk0OSwgeToxLjQ0NjYxMDE2OTQ5MTUyNTR9LHt4OjAuNTk4MjIwMzM4OTgzMDUwOSwgeToxLjQ2MjcxMTg2NDQwNjc3OTZ9LHt4OjAuNjA1ODQ3NDU3NjI3MTE4NywgeToxLjQ3MjAzMzg5ODMwNTA4NDd9LHt4OjAuNjI5NTc2MjcxMTg2NDQwOCwgeToxLjQ3Nzk2NjEwMTY5NDkxNTN9LHt4OjAuNjU5MjM3Mjg4MTM1NTkzMiwgeToxLjQ3NjI3MTE4NjQ0MDY3OH0se3g6MC42NjY4NjQ0MDY3Nzk2NjEsIHk6MS40Njc3OTY2MTAxNjk0OTE1fSx7eDowLjY3Mjc5NjYxMDE2OTQ5MTUsIHk6MS40NX0se3g6MC42NzI3OTY2MTAxNjk0OTE1LCB5OjEuNDAzMzg5ODMwNTA4NDc0N30se3g6MC42NzExMDE2OTQ5MTUyNTQyLCB5OjEuMzU1OTMyMjAzMzg5ODMwNH0se3g6MC42NzI3OTY2MTAxNjk0OTE1LCB5OjEuMzIxMTg2NDQwNjc3OTY2fSx7eDowLjY3MTk0OTE1MjU0MjM3MjksIHk6MS4zMDg0NzQ1NzYyNzExODY1fSx7eDowLjY3NDQ5MTUyNTQyMzcyODcsIHk6MS4yOTc0NTc2MjcxMTg2NDR9LHt4OjAuNjgxMjcxMTg2NDQwNjc4LCB5OjEuMjg3Mjg4MTM1NTkzMjIwNH0se3g6MC43MDc1NDIzNzI4ODEzNTU5LCB5OjEuMjg5ODMwNTA4NDc0NTc2M30se3g6MC43NzExMDE2OTQ5MTUyNTQzLCB5OjEuMjg4OTgzMDUwODQ3NDU3Nn0se3g6MC43ODM4MTM1NTkzMjIwMzM5LCB5OjEuMjkyMzcyODgxMzU1OTMyM30se3g6MC43ODgwNTA4NDc0NTc2MjcxLCB5OjEuMzAxNjk0OTE1MjU0MjM3Mn0se3g6MC43ODg4OTgzMDUwODQ3NDU4LCB5OjEuMzE3Nzk2NjEwMTY5NDkxNn0se3g6MC43ODU1MDg0NzQ1NzYyNzEzLCB5OjEuMzU1OTMyMjAzMzg5ODMwNH0se3g6MC43ODgwNTA4NDc0NTc2MjcxLCB5OjEuNDAxNjk0OTE1MjU0MjM3M30se3g6MC43ODg4OTgzMDUwODQ3NDU4LCB5OjEuNDU1OTMyMjAzMzg5ODMwNX0se3g6MC43OTIyODgxMzU1OTMyMjAzLCB5OjEuNDY1MjU0MjM3Mjg4MTM1Nn0se3g6MC44MDI0NTc2MjcxMTg2NDQxLCB5OjEuNDcyMDMzODk4MzA1MDg0N30se3g6MC44NDE0NDA2Nzc5NjYxMDE3LCB5OjEuNDc2MjcxMTg2NDQwNjc4fSx7eDowLjg4MDQyMzcyODgxMzU1OTIsIHk6MS40NzYyNzExODY0NDA2Nzh9LHt4OjAuODk4MjIwMzM4OTgzMDUwOCwgeToxLjQ4NzI4ODEzNTU5MzIyMDR9LHt4OjAuOTAyNDU3NjI3MTE4NjQ0LCB5OjEuNTA1OTMyMjAzMzg5ODMwNn0se3g6MC45MDQxNTI1NDIzNzI4ODEzLCB5OjEuNTcwMzM4OTgzMDUwODQ3NH0se3g6MC45MDMzMDUwODQ3NDU3NjI3LCB5OjEuNjE2OTQ5MTUyNTQyMzczfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThTID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6Mi41OTcyNTY4NTc4NTUzNjE2LCB5OjAuNTkxMDIyNDQzODkwMjc0NH0se3g6Mi42MzM0MTY0NTg4NTI4Njc3LCB5OjAuNTkyMjY5MzI2NjgzMjkxOH0se3g6Mi42NjQ1ODg1Mjg2NzgzMDQ0LCB5OjAuNTg5Nzc1NTYxMDk3MjU2OH0se3g6Mi42NzcwNTczNTY2MDg0Nzg4LCB5OjAuNjA1OTg1MDM3NDA2NDgzOH0se3g6Mi42ODMyOTE3NzA1NzM1NjYsIHk6MC42NDA4OTc3NTU2MTA5NzI2fSx7eDoyLjY4MjA0NDg4Nzc4MDU0ODUsIHk6MC42Nzk1NTExMjIxOTQ1MTM3fSx7eDoyLjY4MjA0NDg4Nzc4MDU0ODUsIHk6MC43MDQ0ODg3NzgwNTQ4NjI5fSx7eDoyLjY4NzAzMjQxODk1MjYxODIsIHk6MC43MTQ0NjM4NDAzOTkwMDI1fSx7eDoyLjY5NTc2MDU5ODUwMzc0MDcsIHk6MC43MjMxOTIwMTk5NTAxMjQ3fSx7eDoyLjczMzE2NzA4MjI5NDI2NCwgeTowLjcyOTQyNjQzMzkxNTIxMn0se3g6Mi43NTMxMTcyMDY5ODI1NDM2LCB5OjAuNzI1Njg1Nzg1NTM2MTU5Nn0se3g6Mi43NjMwOTIyNjkzMjY2ODM1LCB5OjAuNzE4MjA0NDg4Nzc4MDU0OX0se3g6Mi43NjkzMjY2ODMyOTE3NzA3LCB5OjAuNzAzMjQxODk1MjYxODQ1NH0se3g6Mi43NjkzMjY2ODMyOTE3NzA3LCB5OjAuNjY1ODM1NDExNDcxMzIxN30se3g6Mi43NzA1NzM1NjYwODQ3ODgsIHk6MC42MzIxNjk1NzYwNTk4NTA0fSx7eDoyLjc3MTgyMDQ0ODg3NzgwNTUsIHk6MC41Njg1Nzg1NTM2MTU5NjAxfSx7eDoyLjc3MDU3MzU2NjA4NDc4OCwgeTowLjU0MzY0MDg5Nzc1NTYxMX0se3g6Mi43NzA1NzM1NjYwODQ3ODgsIHk6MC41MjI0NDM4OTAyNzQzMTQzfSx7eDoyLjc3NTU2MTA5NzI1Njg1OCwgeTowLjUxNDk2MjU5MzUxNjIwOTR9LHt4OjIuNzkxNzcwNTczNTY2MDg1LCB5OjAuNTE0OTYyNTkzNTE2MjA5NH0se3g6Mi44NjAzNDkxMjcxODIwNDQ3LCB5OjAuNTE0OTYyNTkzNTE2MjA5NH0se3g6Mi44OTE1MjExOTcwMDc0ODE0LCB5OjAuNTE5OTUwMTI0Njg4Mjc5M30se3g6Mi44OTY1MDg3MjgxNzk1NTEsIHk6MC41Mzg2NTMzNjY1ODM1NDExfSx7eDoyLjg5OTAwMjQ5Mzc2NTU4NiwgeTowLjU3NzMwNjczMzE2NzA4MjN9LHt4OjIuOTAxNDk2MjU5MzUxNjIxLCB5OjAuNjMwOTIyNjkzMjY2ODMyOX0se3g6Mi44OTc3NTU2MTA5NzI1Njg2LCB5OjAuNjUwODcyODE3OTU1MTEyMn0se3g6Mi44OTc3NTU2MTA5NzI1Njg2LCB5OjAuNjgzMjkxNzcwNTczNTY2fSx7eDoyLjkwMjc0MzE0MjE0NDYzODQsIHk6MC43MTQ0NjM4NDAzOTkwMDI1fSx7eDoyLjkxNjQ1ODg1Mjg2NzgzMDYsIHk6MC43MjQ0Mzg5MDI3NDMxNDIyfSx7eDoyLjk0NjM4NDAzOTkwMDI0OTQsIHk6MC43MjQ0Mzg5MDI3NDMxNDIyfSx7eDozLjIwMTk5NTAxMjQ2ODgyOCwgeTowLjcyMzE5MjAxOTk1MDEyNDd9LHt4OjMuNzI4MTc5NTUxMTIyMTk0NSwgeTowLjcyMDY5ODI1NDM2NDA4OTd9LHt4OjMuOTQ2Mzg0MDM5OTAwMjQ5NCwgeTowLjcyMzE5MjAxOTk1MDEyNDd9LHt4OjMuOTY1MDg3MjgxNzk1NTExNCwgeTowLjcxOTQ1MTM3MTU3MTA3MjN9LHt4OjMuOTg1MDM3NDA2NDgzNzkwMywgeTowLjcwNTczNTY2MDg0Nzg4MDN9LHt4OjMuOTg4Nzc4MDU0ODYyODQzLCB5OjAuNjg4Mjc5MzAxNzQ1NjM1OX0se3g6My45OTI1MTg3MDMyNDE4OTU0LCB5OjAuNjU5NjAwOTk3NTA2MjM0NX0se3g6My45OTI1MTg3MDMyNDE4OTU0LCB5OjAuNjM5NjUwODcyODE3OTU1MX0se3g6My45ODYyODQyODkyNzY4MDgsIHk6MC42MjIxOTQ1MTM3MTU3MTA4fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTkgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjgwOTQyMzcyODgxMzU1OTMsIHk6MS41MTgwNTkzMjIwMzM4OTgzfSx7eDowLjgyODA2Nzc5NjYxMDE2OTUsIHk6MS41NDE3ODgxMzU1OTMyMjA0fSx7eDowLjg1OTQyMzcyODgxMzU1OTMsIHk6MS41NTUzNDc0NTc2MjcxMTg3fSx7eDowLjg3OTc2MjcxMTg2NDQwNjgsIHk6MS41NDA5NDA2Nzc5NjYxMDE3fSx7eDowLjg4NDg0NzQ1NzYyNzExODYsIHk6MS41MjY1MzM4OTgzMDUwODQ3fSx7eDowLjg3NzIyMDMzODk4MzA1MDksIHk6MS41MDcwNDIzNzI4ODEzNTU4fSx7eDowLjg1NzcyODgxMzU1OTMyMjEsIHk6MS40OTA5NDA2Nzc5NjYxMDE2fSksXG4gIG5ldyBBcnJheSh7eDowLjg2Nzg5ODMwNTA4NDc0NTcsIHk6MS41MzkyNDU3NjI3MTE4NjQzfSx7eDowLjg3NTUyNTQyMzcyODgxMzYsIHk6MS41MjU2ODY0NDA2Nzc5NjZ9LHt4OjAuODU1MTg2NDQwNjc3OTY2MSwgeToxLjUxNDY2OTQ5MTUyNTQyMzd9LHt4OjAuODM2NTQyMzcyODgxMzU1OSwgeToxLjUxNDY2OTQ5MTUyNTQyMzd9LHt4OjAuODI0Njc3OTY2MTAxNjk0OSwgeToxLjUyODIyODgxMzU1OTMyMn0se3g6MC44MTUzNTU5MzIyMDMzODk5LCB5OjEuNTM3NTUwODQ3NDU3NjI3Mn0se3g6MC44MDM0OTE1MjU0MjM3Mjg4LCB5OjEuNTI0ODM4OTgzMDUwODQ3M30se3g6MC44MDg1NzYyNzExODY0NDA3LCB5OjEuNDk3NzIwMzM4OTgzMDUxfSx7eDowLjgzMTQ1NzYyNzExODY0NCwgeToxLjQ5MDA5MzIyMDMzODk4M30se3g6MC44NTYwMzM4OTgzMDUwODQ3LCB5OjEuNTAyODA1MDg0NzQ1NzYyNn0pLFxuICBuZXcgQXJyYXkoe3g6MC44NDUwMTY5NDkxNTI1NDIzLCB5OjEuNDg0MTYxMDE2OTQ5MTUyNn0se3g6MC44NTYwMzM4OTgzMDUwODQ3LCB5OjEuNTAxOTU3NjI3MTE4NjQ0MX0se3g6MC44NjYyMDMzODk4MzA1MDg1LCB5OjEuNTIxNDQ5MTUyNTQyMzcyOH0se3g6MC44NjcwNTA4NDc0NTc2MjcxLCB5OjEuNTM1MDA4NDc0NTc2MjcxfSx7eDowLjg1MDk0OTE1MjU0MjM3MjksIHk6MS41NDE3ODgxMzU1OTMyMjA0fSx7eDowLjgyNzIyMDMzODk4MzA1MDgsIHk6MS41MzU4NTU5MzIyMDMzODk4fSx7eDowLjgwNzcyODgxMzU1OTMyMiwgeToxLjUyMDYwMTY5NDkxNTI1NH0se3g6MC44MTAyNzExODY0NDA2NzgsIHk6MS41MDQ1fSx7eDowLjgzMzE1MjU0MjM3Mjg4MTQsIHk6MS41MDI4MDUwODQ3NDU3NjI2fSx7eDowLjg1MDk0OTE1MjU0MjM3MjksIHk6MS41MTU1MTY5NDkxNTI1NDI0fSx7eDowLjg3MzgzMDUwODQ3NDU3NjIsIHk6MS41MTI5NzQ1NzYyNzExODY0fSx7eDowLjg3MDQ0MDY3Nzk2NjEwMTcsIHk6MS41MDAyNjI3MTE4NjQ0MDY3fSx7eDowLjg1NTE4NjQ0MDY3Nzk2NjEsIHk6MS40OTE3ODgxMzU1OTMyMjAzfSx7eDowLjg0MzMyMjAzMzg5ODMwNTEsIHk6MS40ODMzMTM1NTkzMjIwMzR9KVxuKTtcblxubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5UyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjMuOTg4MzU1MTY3Mzk0NDY5LCB5OjAuNjI0NDU0MTQ4NDcxNjE1N30se3g6My45NjA2OTg2ODk5NTYzMzIsIHk6MC42MzAyNzY1NjQ3NzQzODEzfSx7eDozLjk0NzU5ODI1MzI3NTEwOSwgeTowLjYyODgyMDk2MDY5ODY5fSx7eDozLjk0OTA1Mzg1NzM1MDgwMDcsIHk6MC42MTQyNjQ5MTk5NDE3NzU4fSx7eDozLjk4MTA3NzE0NzAxNjAxMiwgeTowLjU4OTUxOTY1MDY1NTAyMTl9LHt4OjQsIHk6MC42MTQyNjQ5MTk5NDE3NzU4fSx7eDo0LjAyNjIwMDg3MzM2MjQ0NiwgeTowLjYyNDQ1NDE0ODQ3MTYxNTd9LHt4OjQuMDI2MjAwODczMzYyNDQ2LCB5OjAuNjE0MjY0OTE5OTQxNzc1OH0se3g6NC4wMTQ1NTYwNDA3NTY5MTQsIHk6MC42MDQwNzU2OTE0MTE5MzZ9LHt4OjMuOTkxMjY2Mzc1NTQ1ODUxNywgeTowLjYxNzE3NjEyODA5MzE1ODd9LHt4OjMuOTczNzk5MTI2NjM3NTU0NywgeTowLjYzMTczMjE2ODg1MDA3Mjh9KSxcbiAgbmV3IEFycmF5KHt4OjMuOTk0MTc3NTgzNjk3MjM0LCB5OjAuNjMwMjc2NTY0Nzc0MzgxM30se3g6NC4wMTg5MjI4NTI5ODM5ODgsIHk6MC42MjI5OTg1NDQzOTU5MjQzfSx7eDo0LjAyOTExMjA4MTUxMzgyOCwgeTowLjY0MDQ2NTc5MzMwNDIyMTN9LHt4OjQuMDE2MDExNjQ0ODMyNjA2LCB5OjAuNjUzNTY2MjI5OTg1NDQ0fSx7eDozLjk3ODE2NTkzODg2NDYyOSwgeTowLjY1OTM4ODY0NjI4ODIwOTZ9LHt4OjMuOTU0ODc2MjczNjUzNTY2LCB5OjAuNjUyMTEwNjI1OTA5NzUyNn0se3g6My45NDQ2ODcwNDUxMjM3MjYsIHk6MC42MjczNjUzNTY2MjI5OTg1fSx7eDozLjk0NDY4NzA0NTEyMzcyNiwgeTowLjYxMjgwOTMxNTg2NjA4NDR9LHt4OjMuOTU3Nzg3NDgxODA0OTQ5LCB5OjAuNjAyNjIwMDg3MzM2MjQ0NX0se3g6My45ODgzNTUxNjczOTQ0NjksIHk6MC42MDY5ODY4OTk1NjMzMTg3fSx7eDo0LjAxODkyMjg1Mjk4Mzk4OCwgeTowLjYyMTU0Mjk0MDMyMDIzMjl9LHt4OjQuMDIxODM0MDYxMTM1MzcyLCB5OjAuNjA4NDQyNTAzNjM5MDEwMn0se3g6NC4wMDQzNjY4MTIyMjcwNzQsIHk6MC41OTM4ODY0NjI4ODIwOTYxfSx7eDozLjk3OTYyMTU0Mjk0MDMyLCB5OjAuNjAxMTY0NDgzMjYwNTUzMn0se3g6My45NjIxNTQyOTQwMzIwMjMsIHk6MC41OTA5NzUyNTQ3MzA3MTMyfSx7eDozLjk5NDE3NzU4MzY5NzIzNCwgeTowLjU5Njc5NzY3MTAzMzQ3ODl9LHt4OjQuMDA4NzMzNjI0NDU0MTQ4LCB5OjAuNjMxNzMyMTY4ODUwMDcyOH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMCA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuOTA5MTUyNTQyMzcyODgxNSwgeToxLjYzNzI4ODEzNTU5MzIyMDN9LHt4OjAuOTEwODQ3NDU3NjI3MTE4NiwgeToxLjY2NDQwNjc3OTY2MTAxN30se3g6MC45MDkxNTI1NDIzNzI4ODE1LCB5OjEuNzA4NDc0NTc2MjcxMTg2NH0se3g6MC45MDU3NjI3MTE4NjQ0MDY5LCB5OjEuNzU1MDg0NzQ1NzYyNzEyfSx7eDowLjkwMzIyMDMzODk4MzA1MDksIHk6MS43Nzc5NjYxMDE2OTQ5MTUzfSx7eDowLjkxNjc3OTY2MTAxNjk0OTIsIHk6MS43ODg5ODMwNTA4NDc0NTc2fSx7eDowLjkxMDAwMDAwMDAwMDAwMDEsIHk6MS44MDU5MzIyMDMzODk4MzA0fSx7eDowLjkxNDIzNzI4ODEzNTU5MzQsIHk6MS44MzY0NDA2Nzc5NjYxMDE4fSx7eDowLjkxMTY5NDkxNTI1NDIzNzMsIHk6MS44NjAxNjk0OTE1MjU0MjM3fSx7eDowLjkxMDg0NzQ1NzYyNzExODYsIHk6MS44OTgzMDUwODQ3NDU3NjI4fSx7eDowLjkxNDIzNzI4ODEzNTU5MzQsIHk6MS45NDY2MTAxNjk0OTE1MjU0fSx7eDowLjkxMDAwMDAwMDAwMDAwMDEsIHk6MS45OTkxNTI1NDIzNzI4ODEzfSx7eDowLjkwOTE1MjU0MjM3Mjg4MTUsIHk6Mi4wNDgzMDUwODQ3NDU3NjN9LHt4OjAuOTEwMDAwMDAwMDAwMDAwMSwgeToyLjEwNTA4NDc0NTc2MjcxMTh9LHt4OjAuOTA0MDY3Nzk2NjEwMTY5NiwgeToyLjEzMDUwODQ3NDU3NjI3MX0se3g6MC44OTMwNTA4NDc0NTc2MjcxLCB5OjIuMTM4MTM1NTkzMjIwMzM5fSx7eDowLjg2Njc3OTY2MTAxNjk0OTEsIHk6Mi4xMzg5ODMwNTA4NDc0NTc0fSx7eDowLjg0ODEzNTU5MzIyMDMzODksIHk6Mi4xNDU3NjI3MTE4NjQ0MDd9LHt4OjAuODM3OTY2MTAxNjk0OTE1NCwgeToyLjE2OTQ5MTUyNTQyMzcyOX0se3g6MC44Mzk2NjEwMTY5NDkxNTI1LCB5OjIuMzU3NjI3MTE4NjQ0MDY4fSx7eDowLjgzNTQyMzcyODgxMzU1OTMsIHk6Mi4zNzcxMTg2NDQwNjc3OTY3fSx7eDowLjgxNTA4NDc0NTc2MjcxMiwgeToyLjM4NDc0NTc2MjcxMTg2NDR9LHt4OjAuNzkxMzU1OTMyMjAzMzg5OCwgeToyLjM4NDc0NTc2MjcxMTg2NDR9LHt4OjAuNzg3OTY2MTAxNjk0OTE1MywgeToyLjM3Nzk2NjEwMTY5NDkxNTR9LHt4OjAuNzgxMTg2NDQwNjc3OTY2LCB5OjIuMzkyMzcyODgxMzU1OTMyfSx7eDowLjc3Njk0OTE1MjU0MjM3MjgsIHk6Mi4zNzcxMTg2NDQwNjc3OTY3fSx7eDowLjc3MDE2OTQ5MTUyNTQyMzgsIHk6Mi4zOTE1MjU0MjM3Mjg4MTM1fSx7eDowLjc2NTkzMjIwMzM4OTgzMDYsIHk6Mi4zNzg4MTM1NTkzMjIwMzR9LHt4OjAuNzU4MzA1MDg0NzQ1NzYyNiwgeToyLjM5MTUyNTQyMzcyODgxMzV9LHt4OjAuNzU0MDY3Nzk2NjEwMTY5NCwgeToyLjM3NzExODY0NDA2Nzc5Njd9LHt4OjAuNzQ3Mjg4MTM1NTkzMjIwNCwgeToyLjM5MjM3Mjg4MTM1NTkzMn0se3g6MC43NDIyMDMzODk4MzA1MDg1LCB5OjIuMzc0NTc2MjcxMTg2NDQwN30se3g6MC43MzM3Mjg4MTM1NTkzMjIxLCB5OjIuMzkyMzcyODgxMzU1OTMyfSx7eDowLjczMTE4NjQ0MDY3Nzk2NiwgeToyLjM3NzExODY0NDA2Nzc5Njd9LHt4OjAuNzI0NDA2Nzc5NjYxMDE3LCB5OjIuMzkyMzcyODgxMzU1OTMyfSx7eDowLjcxOTMyMjAzMzg5ODMwNTEsIHk6Mi4zNzk2NjEwMTY5NDkxNTIzfSx7eDowLjcwNzQ1NzYyNzExODY0NDEsIHk6Mi4zODU1OTMyMjAzMzg5ODN9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTBTID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6My45ODgzNTUxNjczOTQ0NjksIHk6MC41ODA3ODYwMjYyMDA4NzM0fSx7eDozLjk4Njg5OTU2MzMxODc3NywgeTowLjU2OTE0MTE5MzU5NTM0MjF9LHt4OjMuOTg2ODk5NTYzMzE4Nzc3LCB5OjAuNTUxNjczOTQ0Njg3MDQ1MX0se3g6My45ODM5ODgzNTUxNjczOTQ3LCB5OjAuNTIxMTA2MjU5MDk3NTI1NX0se3g6My45ODM5ODgzNTUxNjczOTQ3LCB5OjAuNDc3NDM4MTM2ODI2NzgzMX0se3g6My45ODM5ODgzNTUxNjczOTQ3LCB5OjAuNDM5NTkyNDMwODU4ODA2NH0se3g6My45ODM5ODgzNTUxNjczOTQ3LCB5OjAuMzY2ODEyMjI3MDc0MjM1ODN9LHt4OjMuOTgzOTg4MzU1MTY3Mzk0NywgeTowLjMwNDIyMTI1MTgxOTUwNTF9LHt4OjMuOTgyNTMyNzUxMDkxNzAzLCB5OjAuMjUxODE5NTA1MDk0NjE0MjZ9LHt4OjMuOTgxMDc3MTQ3MDE2MDEyLCB5OjAuMTgwNDk0OTA1Mzg1NzM1MX0se3g6My45ODI1MzI3NTEwOTE3MDMsIHk6MC4xMzM5MTU1NzQ5NjM2MDk5fSx7eDozLjk4ODM1NTE2NzM5NDQ2OSwgeTowLjExOTM1OTUzNDIwNjY5NTc3fSx7eDo0LCB5OjAuMTEyMDgxNTEzODI4MjM4NzJ9LHt4OjQuMDM2MzkwMTAxODkyMjg2LCB5OjAuMTEyMDgxNTEzODI4MjM4NzJ9LHt4OjQuMDgwMDU4MjI0MTYzMDI4LCB5OjAuMTA3NzE0NzAxNjAxMTY0NDl9LHt4OjQuMTAzMzQ3ODg5Mzc0MDksIHk6MC4xMTIwODE1MTM4MjgyMzg3Mn0se3g6NC4xMjIyNzA3NDIzNTgwNzgsIHk6MC4xMjIyNzA3NDIzNTgwNzg2fSx7eDo0LjEzMTAwNDM2NjgxMjIyNywgeTowLjE0OTkyNzIxOTc5NjIxNTQzfSx7eDo0LjEzMjQ1OTk3MDg4NzkxOCwgeTowLjM4NzE5MDY4NDEzMzkxNTU1fSx7eDo0LjEyOTU0ODc2MjczNjUzNiwgeTowLjYxNTcyMDUyNDAxNzQ2NzJ9LHt4OjQuMTMzOTE1NTc0OTYzNjEsIHk6MC42NDc3NDM4MTM2ODI2NzgzfSx7eDo0LjEzOTczNzk5MTI2NjM3NiwgeTowLjY1NjQ3NzQzODEzNjgyNjh9LHt4OjQuMTYwMTE2NDQ4MzI2MDU1LCB5OjAuNjYzNzU1NDU4NTE1MjgzOH0se3g6NC4yNTAzNjM5MDEwMTg5MjMsIHk6MC42NjM3NTU0NTg1MTUyODM4fSx7eDo0LjMzOTE1NTc0OTYzNjA5OSwgeTowLjY2MjI5OTg1NDQzOTU5MjR9LHt4OjQuNDE5MjEzOTczNzk5MTI3LCB5OjAuNjY1MjExMDYyNTkwOTc1M30se3g6NC40NTQxNDg0NzE2MTU3MjEsIHk6MC42NTkzODg2NDYyODgyMDk2fSx7eDo0LjQ1OTk3MDg4NzkxODQ4NjUsIHk6MC42NDE5MjEzOTczNzk5MTI3fSx7eDo0LjQ2MTQyNjQ5MTk5NDE3NywgeTowLjYyMDA4NzMzNjI0NDU0MTV9LHt4OjQuNDY0MzM3NzAwMTQ1NTYxLCB5OjAuNjAxMTY0NDgzMjYwNTUzMn0se3g6NC40ODMyNjA1NTMxMjk1NDksIHk6MC41OTA5NzUyNTQ3MzA3MTMyfSx7eDo0LjUyODM4NDI3OTQ3NTk4MywgeTowLjU5MjQzMDg1ODgwNjQwNDd9LHt4OjQuNTY0Nzc0MzgxMzY4MjY3NSwgeTowLjU5MjQzMDg1ODgwNjQwNDd9LHt4OjQuNTgwNzg2MDI2MjAwODczLCB5OjAuNTk5NzA4ODc5MTg0ODYxN30se3g6NC41ODA3ODYwMjYyMDA4NzMsIHk6MC42MjU5MDk3NTI1NDczMDcyfSx7eDo0LjU4MDc4NjAyNjIwMDg3MywgeTowLjY3Mzk0NDY4NzA0NTEyMzh9LHt4OjQuNTg2NjA4NDQyNTAzNjM5LCB5OjAuNzA0NTEyMzcyNjM0NjQzNH0se3g6NC42MDk4OTgxMDc3MTQ3MDEsIHk6MC43MTE3OTAzOTMwMTMxMDA0fSx7eDo0LjgzODQyNzk0NzU5ODI1MzUsIHk6MC43MTAzMzQ3ODg5Mzc0MDl9LHt4OjQuODc0ODE4MDQ5NDkwNTM4LCB5OjAuNzEwMzM0Nzg4OTM3NDA5fSx7eDo0Ljg4MDY0MDQ2NTc5MzMwNCwgeTowLjcwNTk2Nzk3NjcxMDMzNDh9LHt4OjQuODg2NDYyODgyMDk2MDcsIHk6MC42OTI4Njc1NDAwMjkxMTIxfSx7eDo0Ljg4NjQ2Mjg4MjA5NjA3LCB5OjAuNjY5NTc3ODc0ODE4MDQ5NX0se3g6NC44OTA4Mjk2OTQzMjMxNDQsIHk6MC42NTUwMjE4MzQwNjExMzUzfSx7eDo0Ljg5NjY1MjExMDYyNTkxLCB5OjAuNjQ2Mjg4MjA5NjA2OTg2OX0se3g6NC45MDM5MzAxMzEwMDQzNjcsIHk6MC42MzkwMTAxODkyMjg1Mjk4fSwge3g6NC44OTg3Njg4MDk4NDk1MjEsIHk6MC42NDM2Mzg4NTA4ODkxOTI5fSx7eDo0Ljg4MzcyMDkzMDIzMjU1OCwgeTowLjY0MjI3MDg2MTgzMzEwNTN9LHt4OjQuODYzMjAxMDk0MzkxMjQ1LCB5OjAuNjM2Nzk4OTA1NjA4NzU1Mn0se3g6NC44NDY3ODUyMjU3MTgxOTQsIHk6MC42MjU4NTQ5OTMxNjAwNTQ4fSx7eDo0Ljg0ODE1MzIxNDc3NDI4MiwgeTowLjYxNDkxMTA4MDcxMTM1NDR9LHt4OjQuODQxMzEzMjY5NDkzODQ0LCB5OjAuNTg4OTE5Mjg4NjQ1NjkwOX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuNTgyMzA1MDg0NzQ1NzYyNywgeToyLjEwNDUwMDAwMDAwMDAwMDN9LHt4OjAuNTY2MjAzMzg5ODMwNTA4NCwgeToyLjEwMDI2MjcxMTg2NDQwN30se3g6MC41NjcwNTA4NDc0NTc2MjcxLCB5OjIuMDkyNjM1NTkzMjIwMzM5fSx7eDowLjU4NzM4OTgzMDUwODQ3NDYsIHk6Mi4wODY3MDMzODk4MzA1MDg3fSx7eDowLjYxNDUwODQ3NDU3NjI3MTIsIHk6Mi4wNzY1MzM4OTgzMDUwODV9LHt4OjAuNjMzMTUyNTQyMzcyODgxMywgeToyLjA3NDgzODk4MzA1MDg0NzZ9LHt4OjAuNjM2NTQyMzcyODgxMzU2LCB5OjIuMDg1ODU1OTMyMjAzMzl9LHt4OjAuNjIxMjg4MTM1NTkzMjIwMywgeToyLjA5NzcyMDMzODk4MzA1MX0se3g6MC41OTE2MjcxMTg2NDQwNjc4LCB5OjIuMTAyODA1MDg0NzQ1NzYzfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExUyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjQuNzc3MDE3NzgzODU3NzI5LCB5OjAuNjAyNTk5MTc5MjA2NTY2NH0se3g6NC43OTA2OTc2NzQ0MTg2MDQsIHk6MC42MDI1OTkxNzkyMDY1NjY0fSx7eDo0LjgxMTIxNzUxMDI1OTkxOCwgeTowLjU5NTc1OTIzMzkyNjEyODZ9LHt4OjQuODMzMTA1MzM1MTU3MzE4NSwgeTowLjU4ODkxOTI4ODY0NTY5MDl9LHt4OjQuODQ5NTIxMjAzODMwMzcsIHk6MC41ODA3MTEzNTQzMDkxNjU1fSx7eDo0Ljg2NDU2OTA4MzQ0NzMzMiwgeTowLjU3MjUwMzQxOTk3MjY0MDJ9LHt4OjQuODY0NTY5MDgzNDQ3MzMyLCB5OjAuNTYyOTI3NDk2NTgwMDI3NH0se3g6NC44NTQ5OTMxNjAwNTQ3MTksIHk6MC41NjE1NTk1MDc1MjM5Mzk4fSx7eDo0LjgyOTAwMTM2Nzk4OTA1NiwgeTowLjU2ODM5OTQ1MjgwNDM3NzV9LHt4OjQuODA0Mzc3NTY0OTc5NDgsIHk6MC41NzUyMzkzOTgwODQ4MTUzfSx7eDo0Ljc5MDY5NzY3NDQxODYwNCwgeTowLjU4MjA3OTM0MzM2NTI1MzF9LHt4OjQuNzc4Mzg1NzcyOTEzODE3LCB5OjAuNTkwMjg3Mjc3NzAxNzc4NH0se3g6NC43NzgzODU3NzI5MTM4MTcsIHk6MC41OTg0OTUyMTIwMzgzMDM3fSx7eDo0Ljc5NjE2OTYzMDY0Mjk1NSwgeTowLjU5NDM5MTI0NDg3MDA0MX0se3g6NC44MDAyNzM1OTc4MTEyMTcsIHk6MC41ODYxODMzMTA1MzM1MTU3fSx7eDo0LjgxMjU4NTQ5OTMxNjAwNiwgeTowLjU3Mzg3MTQwOTAyODcyNzh9LHt4OjQuODIyMTYxNDIyNzA4NjE5LCB5OjAuNTcyNTAzNDE5OTcyNjQwMn0se3g6NC44NDU0MTcyMzY2NjIxMDcsIHk6MC41NjU2NjM0NzQ2OTIyMDI1fSx7eDo0Ljg1NDk5MzE2MDA1NDcxOSwgeTowLjU3MjUwMzQxOTk3MjY0MDJ9LHt4OjQuODMzMTA1MzM1MTU3MzE4NSwgeTowLjU5MDI4NzI3NzcwMTc3ODR9LHt4OjQuNzg2NTkzNzA3MjUwMzQyLCB5OjAuNjAyNTk5MTc5MjA2NTY2NH0se3g6NC43NzU2NDk3OTQ4MDE2NDIsIHk6MC41OTQzOTEyNDQ4NzAwNDF9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTIgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjcxMDA4NDc0NTc2MjcxMiwgeToyLjM4ODEzNTU5MzIyMDMzOX0se3g6MC43MDUwMDAwMDAwMDAwMDAxLCB5OjIuNDAwODQ3NDU3NjI3MTE4Nn0se3g6MC43MDU4NDc0NTc2MjcxMTg1LCB5OjIuNDEyNzExODY0NDA2Nzc5OH0se3g6MC43MDQxNTI1NDIzNzI4ODE0LCB5OjIuNDM3Mjg4MTM1NTkzMjIwM30se3g6MC43MDE2MTAxNjk0OTE1MjUzLCB5OjIuNDQ2NjEwMTY5NDkxNTI1NH0se3g6MC42OTA1OTMyMjAzMzg5ODMxLCB5OjIuNDU1MDg0NzQ1NzYyNzEyfSx7eDowLjY1MjQ1NzYyNzExODY0NCwgeToyLjQ1NzYyNzExODY0NDA2OH0se3g6MC40Njg1NTkzMjIwMzM4OTgzMywgeToyLjQ1NTkzMjIwMzM4OTgzMDV9LHt4OjAuNDU1ODQ3NDU3NjI3MTE4NiwgeToyLjQ1NTkzMjIwMzM4OTgzMDV9LHt4OjAuNDQzOTgzMDUwODQ3NDU3NjUsIHk6Mi40NDkxNTI1NDIzNzI4ODE1fSx7eDowLjQzMTI3MTE4NjQ0MDY3NzksIHk6Mi40Mzg5ODMwNTA4NDc0NTc3fSx7eDowLjQyNzg4MTM1NTkzMjIwMzQsIHk6Mi40MjExODY0NDA2Nzc5NjZ9LHt4OjAuNDI5NTc2MjcxMTg2NDQwNjUsIHk6Mi4zNjQ0MDY3Nzk2NjEwMTd9LHt4OjAuNDE3NzExODY0NDA2Nzc5NywgeToyLjM0MjM3Mjg4MTM1NTkzMjR9LHt4OjAuNDA1ODQ3NDU3NjI3MTE4NjYsIHk6Mi4zMzgxMzU1OTMyMjAzMzl9LHt4OjAuMzk3MzcyODgxMzU1OTMyMjQsIHk6Mi4zMzM4OTgzMDUwODQ3NDZ9LHt4OjAuMzk5OTE1MjU0MjM3Mjg4MSwgeToyLjM0NjYxMDE2OTQ5MTUyNTN9LHt4OjAuMzg0NjYxMDE2OTQ5MTUyNSwgeToyLjMzNDc0NTc2MjcxMTg2NDZ9LHt4OjAuMzg2MzU1OTMyMjAzMzg5OSwgeToyLjM0NzQ1NzYyNzExODY0NH0se3g6MC4zNzM2NDQwNjc3OTY2MTAxNCwgeToyLjMzMzg5ODMwNTA4NDc0Nn0se3g6MC4zNzQ0OTE1MjU0MjM3Mjg4LCB5OjIuMzQ3NDU3NjI3MTE4NjQ0fSx7eDowLjM2MDkzMjIwMzM4OTgzMDUsIHk6Mi4zMzU1OTMyMjAzMzg5ODN9LHt4OjAuMzY0MzIyMDMzODk4MzA1MDMsIHk6Mi4zNX0se3g6MC4zNTA3NjI3MTE4NjQ0MDY3LCB5OjIuMzM1NTkzMjIwMzM4OTgzfSx7eDowLjM1MjQ1NzYyNzExODY0NDEsIHk6Mi4zNDkxNTI1NDIzNzI4ODE0fSx7eDowLjMzODg5ODMwNTA4NDc0NTgsIHk6Mi4zMzU1OTMyMjAzMzg5ODN9LHt4OjAuMzI3ODgxMzU1OTMyMjAzNCwgeToyLjM0NDkxNTI1NDIzNzI4OH0se3g6MC4zMjExMDE2OTQ5MTUyNTQyNSwgeToyLjM1MzM4OTgzMDUwODQ3NDR9LHt4OjAuMzE4NTU5MzIyMDMzODk4MywgeToyLjM2ODY0NDA2Nzc5NjYxMDN9LHt4OjAuMzE4NTU5MzIyMDMzODk4MywgeToyLjM4MzA1MDg0NzQ1NzYyN30se3g6MC4zMTc3MTE4NjQ0MDY3Nzk2LCB5OjIuMzk1NzYyNzExODY0NDA3fSx7eDowLjMwOTIzNzI4ODEzNTU5MzIsIHk6Mi40MDI1NDIzNzI4ODEzNTZ9LHt4OjAuMjg5NzQ1NzYyNzExODY0NCwgeToyLjQwNTkzMjIwMzM4OTgzMDd9LHt4OjAuMjIwMjU0MjM3Mjg4MTM1NiwgeToyLjQwNjc3OTY2MTAxNjk0OX0se3g6MC4xNzcwMzM4OTgzMDUwODQ3NiwgeToyLjQwNzYyNzExODY0NDA2NzZ9LHt4OjAuMTEyNjI3MTE4NjQ0MDY3NzcsIHk6Mi40MDg0NzQ1NzYyNzExODYzfSx7eDowLjA5OTA2Nzc5NjYxMDE2OTUxLCB5OjIuNDEyNzExODY0NDA2Nzc5OH0se3g6MC4wODg4OTgzMDUwODQ3NDU3OCwgeToyLjQxODY0NDA2Nzc5NjYxfSx7eDowLjA4MzgxMzU1OTMyMjAzMzg4LCB5OjIuNDM0NzQ1NzYyNzExODY0M30se3g6MC4wODQ2NjEwMTY5NDkxNTI1MSwgeToyLjQ5NDA2Nzc5NjYxMDE2OTZ9LHt4OjAuMDgyMTE4NjQ0MDY3Nzk2NjIsIHk6Mi41NTY3Nzk2NjEwMTY5NDkzfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyUyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjQuODQxMzEzMjY5NDkzODQ0LCB5OjAuNTg4OTE5Mjg4NjQ1NjkwOX0se3g6NC44NDgxNTMyMTQ3NzQyODIsIHk6MC42MTQ5MTEwODA3MTEzNTQ0fSx7eDo0Ljg0Njc4NTIyNTcxODE5NCwgeTowLjYyNTg1NDk5MzE2MDA1NDh9LHt4OjQuODYzMjAxMDk0MzkxMjQ1LCB5OjAuNjM2Nzk4OTA1NjA4NzU1Mn0se3g6NC44ODM3MjA5MzAyMzI1NTgsIHk6MC42NDIyNzA4NjE4MzMxMDUzfSx7eDo0Ljg5ODc2ODgwOTg0OTUyMSwgeTowLjY0MzYzODg1MDg4OTE5Mjl9LCB7eDo0LjkwMjQ3NDUyNjkyODY3NiwgeTowLjYzOTAxMDE4OTIyODUyOTh9LHt4OjQuOTE5OTQxNzc1ODM2OTcyLCB5OjAuNjM5MDEwMTg5MjI4NTI5OH0se3g6NC45NDkwNTM4NTczNTA4LCB5OjAuNjM3NTU0NTg1MTUyODM4NX0se3g6NC45OTcwODg3OTE4NDg2MTc1LCB5OjAuNjM0NjQzMzc3MDAxNDU1Nn0se3g6NS4wMjE4MzQwNjExMzUzNzIsIHk6MC42Mzc1NTQ1ODUxNTI4Mzg1fSx7eDo1LjAzMzQ3ODg5Mzc0MDkwMiwgeTowLjY0NjI4ODIwOTYwNjk4Njl9LHt4OjUuMDQ1MTIzNzI2MzQ2NDM0LCB5OjAuNjYwODQ0MjUwMzYzOTAxfSx7eDo1LjA0NTEyMzcyNjM0NjQzNCwgeTowLjY4NDEzMzkxNTU3NDk2MzZ9LHt4OjUuMDQ1MTIzNzI2MzQ2NDM0LCB5OjAuNzQzODEzNjgyNjc4MzExNX0se3g6NS4wNDM2NjgxMjIyNzA3NDIsIHk6MC43ODQ1NzA1OTY3OTc2NzF9LHt4OjUuMDQ5NDkwNTM4NTczNTA4LCB5OjAuNzk3NjcxMDMzNDc4ODkzOH0se3g6NS4wNTk2Nzk3NjcxMDMzNDgsIHk6MC44MDQ5NDkwNTM4NTczNTA4fSx7eDo1LjEwMTg5MjI4NTI5ODM5ODYsIHk6MC44MDQ5NDkwNTM4NTczNTA4fSx7eDo1LjEzMzkxNTU3NDk2MzYxLCB5OjAuODAwNTgyMjQxNjMwMjc2Nn0se3g6NS4xNDExOTM1OTUzNDIwNjcsIHk6MC43OTMzMDQyMjEyNTE4MTk1fSx7eDo1LjE0MjY0OTE5OTQxNzc1OCwgeTowLjc3MDAxNDU1NjA0MDc1Njl9LHt4OjUuMTQ1NTYwNDA3NTY5MTQxLCB5OjAuNzQzODEzNjgyNjc4MzExNX0se3g6NS4xNDI2NDkxOTk0MTc3NTgsIHk6MC43MzM2MjQ0NTQxNDg0NzE3fSx7eDo1LjE1MTM4MjgyMzg3MTkwNywgeTowLjcyNjM0NjQzMzc3MDAxNDV9LHt4OjUuMTQyNjQ5MTk5NDE3NzU4LCB5OjAuNzIwNTI0MDE3NDY3MjQ4OX0se3g6NS4xNDg0NzE2MTU3MjA1MjQsIHk6MC43MTMyNDU5OTcwODg3OTE5fSx7eDo1LjEzNTM3MTE3OTAzOTMwMiwgeTowLjcwNDUxMjM3MjYzNDY0MzR9LHt4OjUuMTUxMzgyODIzODcxOTA3LCB5OjAuNzAxNjAxMTY0NDgzMjYwNn0se3g6NS4xMzY4MjY3ODMxMTQ5OTI1LCB5OjAuNjk1Nzc4NzQ4MTgwNDk0OX0se3g6NS4xNDcwMTYwMTE2NDQ4MzI1LCB5OjAuNjg4NTAwNzI3ODAyMDM3OX0se3g6NS4xMzk3Mzc5OTEyNjYzNzYsIHk6MC42ODEyMjI3MDc0MjM1ODA4fSx7eDo1LjEzOTczNzk5MTI2NjM3NiwgeTowLjY1NzkzMzA0MjIxMjUxODJ9LHt4OjUuMTQ0MTA0ODAzNDkzNDUsIHk6MC42MTcxNzYxMjgwOTMxNTg3fSx7eDo1LjE0MjY0OTE5OTQxNzc1OCwgeTowLjU3Nzg3NDgxODA0OTQ5MDZ9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjA1NDMzODk4MzA1MDg0NzQ2LCB5OjIuMzY5NzU0MjM3Mjg4MTM1N30se3g6MC4wNTM0OTE1MjU0MjM3Mjg4MTQsIHk6Mi40MTIxMjcxMTg2NDQwNjh9LHt4OjAuMDY4NzQ1NzYyNzExODY0NCwgeToyLjQzMDc3MTE4NjQ0MDY3OH0se3g6MC4wODQ4NDc0NTc2MjcxMTg2NSwgeToyLjQyODIyODgxMzU1OTMyMjR9LHt4OjAuMDkxNjI3MTE4NjQ0MDY3NzksIHk6Mi40MDExMTAxNjk0OTE1MjZ9LHt4OjAuMDg5OTMyMjAzMzg5ODMwNSwgeToyLjM3MjI5NjYxMDE2OTQ5Mn0se3g6MC4wNzM4MzA1MDg0NzQ1NzYyNywgeToyLjMzOTI0NTc2MjcxMTg2NX0se3g6MC4wNjQ1MDg0NzQ1NzYyNzExOCwgeToyLjMxODkwNjc3OTY2MTAxN30se3g6MC4wNjAyNzExODY0NDA2Nzc5NywgeToyLjM0NzcyMDMzODk4MzA1MX0pLFxuICBuZXcgQXJyYXkoe3g6MC4wNjk1OTMyMjAzMzg5ODMwNSwgeToyLjM0NTE3Nzk2NjEwMTY5NX0se3g6MC4wODIzMDUwODQ3NDU3NjI3MiwgeToyLjM1Nzg4OTgzMDUwODQ3NDZ9LHt4OjAuMDg2NTQyMzcyODgxMzU1OTMsIHk6Mi4zODI0NjYxMDE2OTQ5MTU2fSx7eDowLjA3Mjk4MzA1MDg0NzQ1NzYzLCB5OjIuMzk3NzIwMzM4OTgzMDUxfSx7eDowLjA2MDI3MTE4NjQ0MDY3Nzk3LCB5OjIuNDEwNDMyMjAzMzg5ODMxfSx7eDowLjA1MzQ5MTUyNTQyMzcyODgxNCwgeToyLjQyMjI5NjYxMDE2OTQ5MTZ9LHt4OjAuMDY5NTkzMjIwMzM4OTgzMDUsIHk6Mi40Mzc1NTA4NDc0NTc2Mjd9LHt4OjAuMDgzMTUyNTQyMzcyODgxMzYsIHk6Mi40MzU4NTU5MzIyMDMzOX0se3g6MC4wODczODk4MzA1MDg0NzQ1NywgeToyLjQyODIyODgxMzU1OTMyMjR9LHt4OjAuMDg4MjM3Mjg4MTM1NTkzMjEsIHk6Mi40MTA0MzIyMDMzODk4MzF9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNTID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6NS4xNDU1NjA0MDc1NjkxNDEsIHk6MC41OTI0MzA4NTg4MDY0MDQ3fSx7eDo1LjE2MTU3MjA1MjQwMTc0NjUsIHk6MC41Nzc4NzQ4MTgwNDk0OTA2fSx7eDo1LjE2NDQ4MzI2MDU1MzEzLCB5OjAuNTU0NTg1MTUyODM4NDI3OX0se3g6NS4xNTQyOTQwMzIwMjMyOSwgeTowLjUzNTY2MjI5OTg1NDQzOTZ9LHt4OjUuMTI2NjM3NTU0NTg1MTUzLCB5OjAuNTI5ODM5ODgzNTUxNjc0fSx7eDo1LjEyNjYzNzU1NDU4NTE1MywgeTowLjUxMjM3MjYzNDY0MzM3N30se3g6NS4xMzM5MTU1NzQ5NjM2MSwgeTowLjQ5NjM2MDk4OTgxMDc3MTV9LHt4OjUuMTU3MjA1MjQwMTc0NjcyLCB5OjAuNTAwNzI3ODAyMDM3ODQ1N30se3g6NS4xNTg2NjA4NDQyNTAzNjQsIHk6MC41MTUyODM4NDI3OTQ3NTk4fSx7eDo1LjE0NDEwNDgwMzQ5MzQ1LCB5OjAuNTM4NTczNTA4MDA1ODIyNH0se3g6NS4xMjY2Mzc1NTQ1ODUxNTMsIHk6MC41NjA0MDc1NjkxNDExOTM2fSx7eDo1LjEyOTU0ODc2MjczNjUzNiwgeTowLjU4MDc4NjAyNjIwMDg3MzR9LHt4OjUuMTUxMzgyODIzODcxOTA3LCB5OjAuNTg5NTE5NjUwNjU1MDIxOX0se3g6NS4xNDg0NzE2MTU3MjA1MjQsIHk6MC42MDg0NDI1MDM2MzkwMTAyfSx7eDo1LjEyMDgxNTEzODI4MjM4NywgeTowLjYwMTE2NDQ4MzI2MDU1MzJ9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTQgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjEwMzMwNTA4NDc0NTc2MjcyLCB5OjIuNTc1NDIzNzI4ODEzNTU5NX0se3g6MC4xMjExMDE2OTQ5MTUyNTQyNCwgeToyLjU3NDU3NjI3MTE4NjQ0MX0se3g6MC4xMzEyNzExODY0NDA2Nzc5OCwgeToyLjU3NDU3NjI3MTE4NjQ0MX0se3g6MC4xMzgwNTA4NDc0NTc2MjcxMywgeToyLjU3NDU3NjI3MTE4NjQ0MX0se3g6MC4xNDIyODgxMzU1OTMyMjAzNCwgeToyLjU3NjI3MTE4NjQ0MDY3Nzh9LHt4OjAuMTQ1Njc3OTY2MTAxNjk0OTIsIHk6Mi41ODIyMDMzODk4MzA1MDg2fSx7eDowLjE0NjUyNTQyMzcyODgxMzU1LCB5OjIuNTk0OTE1MjU0MjM3Mjg4fSx7eDowLjE0Mzk4MzA1MDg0NzQ1NzYsIHk6Mi42MTYxMDE2OTQ5MTUyNTQyfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE0UyA9IG5ldyBBcnJheShcbiAgLy9uZXcgQXJyYXkoe3g6NS4xNDk5MjcyMTk3OTYyMTYsIHk6MC41NjA0MDc1NjkxNDExOTM2fSx7eDo1LjE4MDQ5NDkwNTM4NTczNSwgeTowLjU2MDQwNzU2OTE0MTE5MzZ9LHt4OjUuMjAyMzI4OTY2NTIxMTA2LCB5OjAuNTUzMTI5NTQ4NzYyNzM2Nn0se3g6NS4yMDUyNDAxNzQ2NzI0ODksIHk6MC41NTMxMjk1NDg3NjI3MzY2fSx7eDo1LjIwODE1MTM4MjgyMzg3MiwgeTowLjU0ODc2MjczNjUzNTY2MjN9LHt4OjUuMjExMDYyNTkwOTc1MjU1LCB5OjAuNTQwMDI5MTEyMDgxNTEzOH0se3g6NS4yMDUyNDAxNzQ2NzI0ODksIHk6MC41MzU2NjIyOTk4NTQ0Mzk2fSx7eDo1LjIxMzk3Mzc5OTEyNjYzOCwgeTowLjUzMTI5NTQ4NzYyNzM2NTN9LHt4OjUuMjA1MjQwMTc0NjcyNDg5LCB5OjAuNTI2OTI4Njc1NDAwMjkxMX0se3g6NS4yMTI1MTgxOTUwNTA5NDYsIHk6MC41MjExMDYyNTkwOTc1MjU1fSx7eDo1LjIwNTI0MDE3NDY3MjQ4OSwgeTowLjUxODE5NTA1MDk0NjE0MjZ9LHt4OjUuMjEyNTE4MTk1MDUwOTQ2LCB5OjAuNTE1MjgzODQyNzk0NzU5OH0se3g6NS4yMDM3ODQ1NzA1OTY3OTgsIHk6MC41MDgwMDU4MjI0MTYzMDI4fSx7eDo1LjIxMzk3Mzc5OTEyNjYzOCwgeTowLjQ5NDkwNTM4NTczNTA4MDF9LHt4OjUuMTk3OTYyMTU0Mjk0MDMyLCB5OjAuNDg2MTcxNzYxMjgwOTMxNn0se3g6NS4yMTI1MTgxOTUwNTA5NDYsIHk6MC40NzQ1MjY5Mjg2NzU0MDAzfSx7eDo1LjIxMjUxODE5NTA1MDk0NiwgeTowLjQ1MjY5Mjg2NzU0MDAyOTEzfSx7eDo1LjIwOTYwNjk4Njg5OTU2MywgeTowLjQwOTAyNDc0NTI2OTI4Njd9KVxuICBuZXcgQXJyYXkoe3g6NS4xNTczMzAxNTQ5NDYzNjUsIHk6MC41NjQ5NTgyODM2NzEwMzd9LHt4OjUuMTc2NDAwNDc2NzU4MDQ2LCB5OjAuNTYxMzgyNTk4MzMxMzQ2OH0se3g6NS4xOTE4OTUxMTMyMzAwMzYsIHk6MC41NTMwMzkzMzI1Mzg3MzY2fSx7eDo1LjIwMDIzODM3OTAyMjY0NiwgeTowLjU1NDIzMTIyNzY1MTk2NjZ9LHt4OjUuMjA2MTk3ODU0NTg4Nzk3LCB5OjAuNTUxODQ3NDM3NDI1NTA2Nn0se3g6NS4yMTA5NjU0MzUwNDE3MTYsIHk6MC41NDExMjAzODE0MDY0MzYzfSx7eDo1LjIwNjE5Nzg1NDU4ODc5NywgeTowLjUzMTU4NTIyMDUwMDU5Nn0se3g6NS4yMTIxNTczMzAxNTQ5NDYsIHk6MC41MjgwMDk1MzUxNjA5MDU5fSx7eDo1LjIwNTAwNTk1OTQ3NTU2NiwgeTowLjUyNDQzMzg0OTgyMTIxNTh9LHt4OjUuMjEwOTY1NDM1MDQxNzE2LCB5OjAuNTIwODU4MTY0NDgxNTI1N30se3g6NS4yMDczODk3NDk3MDIwMjYsIHk6MC41MTQ4OTg2ODg5MTUzNzU1fSx7eDo1LjIxNDU0MTEyMDM4MTQwNywgeTowLjUwODkzOTIxMzM0OTIyNTN9LHt4OjUuMjA2MTk3ODU0NTg4Nzk3LCB5OjAuNTA0MTcxNjMyODk2MzA1Mn0se3g6NS4yMTA5NjU0MzUwNDE3MTYsIHk6MC40OTgyMTIxNTczMzAxNTQ5NX0se3g6NS4yMDczODk3NDk3MDIwMjYsIHk6MC40OTQ2MzY0NzE5OTA0NjQ4NH0se3g6NS4yMTMzNDkyMjUyNjgxNzcsIHk6MC40OTIyNTI2ODE3NjQwMDQ4fSx7eDo1LjIwNjE5Nzg1NDU4ODc5NywgeTowLjQ4ODY3Njk5NjQyNDMxNDY3fSx7eDo1LjIxMDk2NTQzNTA0MTcxNiwgeTowLjQ4MTUyNTYyNTc0NDkzNDQ2fSx7eDo1LjIxMjE1NzMzMDE1NDk0NiwgeTowLjQ2OTYwNjY3NDYxMjYzNDF9LHt4OjUuMjE0NTQxMTIwMzgxNDA3LCB5OjAuNDMxNDY2MDMwOTg5MjcyOTR9LHt4OjUuMjA5NzczNTM5OTI4NDg2LCB5OjAuNDEzNTg3NjA0MjkwODIyNH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMTI5NzYyNzExODY0NDA2OCwgeToyLjM2Mjk3NDU3NjI3MTE4Njd9LHt4OjAuMTE5NTkzMjIwMzM4OTgzMDUsIHk6Mi4zNzE0NDkxNTI1NDIzNzN9LHt4OjAuMTEyODEzNTU5MzIyMDMzOSwgeToyLjM4OTI0NTc2MjcxMTg2NDZ9LHt4OjAuMTE2MjAzMzg5ODMwNTA4NDcsIHk6Mi40MjIyOTY2MTAxNjk0OTE2fSx7eDowLjExNjIwMzM4OTgzMDUwODQ3LCB5OjIuNDQzNDgzMDUwODQ3NDU4fSx7eDowLjEwOTQyMzcyODgxMzU1OTMyLCB5OjIuNDY0NjY5NDkxNTI1NDIzN30se3g6MC4xMTYyMDMzODk4MzA1MDg0NywgeToyLjQ5MDA5MzIyMDMzODk4MzR9LHt4OjAuMTMxNDU3NjI3MTE4NjQ0MDYsIHk6Mi40OTc3MjAzMzg5ODMwNTF9LHt4OjAuMTQ0MTY5NDkxNTI1NDIzNzQsIHk6Mi40NzgyMjg4MTM1NTkzMjIyfSx7eDowLjEzNzM4OTgzMDUwODQ3NDYsIHk6Mi40NTUzNDc0NTc2MjcxMTl9KSxcbiAgbmV3IEFycmF5KHt4OjAuMTQwNzc5NjYxMDE2OTQ5MTYsIHk6Mi40OTg1Njc3OTY2MTAxN30se3g6MC4xMjA0NDA2Nzc5NjYxMDE2OCwgeToyLjQ4ODM5ODMwNTA4NDc0Nn0se3g6MC4xMTUzNTU5MzIyMDMzODk4NCwgeToyLjQ3OTkyMzcyODgxMzU1OTZ9LHt4OjAuMTI0Njc3OTY2MTAxNjk0OTIsIHk6Mi40NjIxMjcxMTg2NDQwNjh9LHt4OjAuMTM5MDg0NzQ1NzYyNzExODUsIHk6Mi40NTcwNDIzNzI4ODEzNTZ9LHt4OjAuMTQzMzIyMDMzODk4MzA1MDYsIHk6Mi40NDE3ODgxMzU1OTMyMjA1fSx7eDowLjEzNCwgeToyLjQxODkwNjc3OTY2MTAxNzN9LHt4OjAuMTE0NTA4NDc0NTc2MjcxMTgsIHk6Mi40MDc4ODk4MzA1MDg0NzV9LHt4OjAuMTEwMjcxMTg2NDQwNjc3OTcsIHk6Mi4zODU4NTU5MzIyMDMzOX0se3g6MC4xMTg3NDU3NjI3MTE4NjQ0MiwgeToyLjM3MjI5NjYxMDE2OTQ5Mn0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNVMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDo1LjIwMzc4NDU3MDU5Njc5OCwgeTowLjM5NTkyNDMwODU4ODA2NDA0fSx7eDo1LjE5NjUwNjU1MDIxODM0MDUsIHk6MC4zODEzNjgyNjc4MzExNDk5fSx7eDo1LjIwNjY5NTc3ODc0ODE4MDUsIHk6MC4zNjgyNjc4MzExNDk5MjcyfSx7eDo1LjIxOTc5NjIxNTQyOTQwMywgeTowLjM2NjgxMjIyNzA3NDIzNTgzfSx7eDo1LjIyODUyOTgzOTg4MzU1MiwgeTowLjM1MjI1NjE4NjMxNzMyMTd9LHt4OjUuMjI1NjE4NjMxNzMyMTY5LCB5OjAuMzQyMDY2OTU3Nzg3NDgxOH0se3g6NS4yMDgxNTEzODI4MjM4NzIsIHk6MC4zMzE4Nzc3MjkyNTc2NDE5fSx7eDo1LjIwMDg3MzM2MjQ0NTQxNSwgeTowLjMyMDIzMjg5NjY1MjExMDYzfSx7eDo1LjIwMjMyODk2NjUyMTEwNiwgeTowLjMwMTMxMDA0MzY2ODEyMjI1fSx7eDo1LjIxMjUxODE5NTA1MDk0NiwgeTowLjI5NTQ4NzYyNzM2NTM1NjZ9LHt4OjUuMjI4NTI5ODM5ODgzNTUyLCB5OjAuMzA1Njc2ODU1ODk1MTk2NX0se3g6NS4yMjQxNjMwMjc2NTY0NzcsIHk6MC4zMjQ1OTk3MDg4NzkxODQ5fSx7eDo1LjIwODE1MTM4MjgyMzg3MiwgeTowLjMyODk2NjUyMTEwNjI1OTF9LHt4OjUuMTk1MDUwOTQ2MTQyNjQ5LCB5OjAuMzQ5MzQ0OTc4MTY1OTM4ODV9LHt4OjUuMjIyNzA3NDIzNTgwNzg2LCB5OjAuMzY4MjY3ODMxMTQ5OTI3Mn0se3g6NS4yMTY4ODUwMDcyNzgwMiwgeTowLjQwMDI5MTEyMDgxNTEzODN9LHt4OjUuMTk3OTYyMTU0Mjk0MDMyLCB5OjAuNDE0ODQ3MTYxNTcyMDUyNH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNiA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMTQ2NTI1NDIzNzI4ODEzNTUsIHk6Mi43MTEwMTY5NDkxNTI1NDJ9LHt4OjAuMTQ2NTI1NDIzNzI4ODEzNTUsIHk6Mi43MjQ1NzYyNzExODY0NDA3fSx7eDowLjE0NzM3Mjg4MTM1NTkzMjE4LCB5OjIuNzI5NjYxMDE2OTQ5MTUyNH0se3g6MC4xNDU2Nzc5NjYxMDE2OTQ5MiwgeToyLjc0MTUyNTQyMzcyODgxMzZ9LHt4OjAuMTQ1Njc3OTY2MTAxNjk0OTIsIHk6Mi43Nzk2NjEwMTY5NDkxNTI3fSx7eDowLjEzNzIwMzM4OTgzMDUwODQ1LCB5OjIuNzg4OTgzMDUwODQ3NDU4fSx7eDowLjE0NTY3Nzk2NjEwMTY5NDkyLCB5OjIuNzkzMjIwMzM4OTgzMDUwOH0se3g6MC4xMzg4OTgzMDUwODQ3NDU3NywgeToyLjc5NzQ1NzYyNzExODY0NH0se3g6MC4xNDU2Nzc5NjYxMDE2OTQ5MiwgeToyLjh9LHt4OjAuMTM4MDUwODQ3NDU3NjI3MTMsIHk6Mi44MDQyMzcyODgxMzU1OTMzfSx7eDowLjE0NjUyNTQyMzcyODgxMzU1LCB5OjIuODA3NjI3MTE4NjQ0MDY4fSx7eDowLjEzOTc0NTc2MjcxMTg2NDQsIHk6Mi44MTE4NjQ0MDY3Nzk2NjF9LHt4OjAuMTQ2NTI1NDIzNzI4ODEzNTUsIHk6Mi44MTc3OTY2MTAxNjk0OTEzfSx7eDowLjEzODg5ODMwNTA4NDc0NTc3LCB5OjIuODIzNzI4ODEzNTU5MzIyfSx7eDowLjE0NDgzMDUwODQ3NDU3NjMsIHk6Mi44MjYyNzExODY0NDA2Nzc4fSx7eDowLjE0MDU5MzIyMDMzODk4MzAzLCB5OjIuODMxMzU1OTMyMjAzMzl9LHt4OjAuMTQzMTM1NTkzMjIwMzM4OTcsIHk6Mi44MzM4OTgzMDUwODQ3NDZ9LHt4OjAuMTQzOTgzMDUwODQ3NDU3NiwgeToyLjg0MjM3Mjg4MTM1NTkzMjR9LHt4OjAuMTQzOTgzMDUwODQ3NDU3NiwgeToyLjg0NjYxMDE2OTQ5MTUyNTN9LHt4OjAuMTM5NzQ1NzYyNzExODY0NCwgeToyLjg1MDg0NzQ1NzYyNzExODh9LHt4OjAuMTIzNjQ0MDY3Nzk2NjEwMTQsIHk6Mi44NTA4NDc0NTc2MjcxMTg4fSx7eDowLjEwOTIzNzI4ODEzNTU5MzE5LCB5OjIuODU0MjM3Mjg4MTM1NTkzfSx7eDowLjA5MTQ0MDY3Nzk2NjEwMTY3LCB5OjIuODYyNzExODY0NDA2Nzc5NX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNlMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDo1LjIxMTA2MjU5MDk3NTI1NSwgeTowLjI5MTEyMDgxNTEzODI4MjM2fSx7eDo1LjIxMzk3Mzc5OTEyNjYzOCwgeTowLjI3ODAyMDM3ODQ1NzA1OTd9LHt4OjUuMjEyNTE4MTk1MDUwOTQ2LCB5OjAuMjY0OTE5OTQxNzc1ODM3fSx7eDo1LjIxMjUxODE5NTA1MDk0NiwgeTowLjI1NDczMDcxMzI0NTk5NzF9LHt4OjUuMjA5NjA2OTg2ODk5NTYzLCB5OjAuMjUwMzYzOTAxMDE4OTIyODZ9LHt4OjUuMTk5NDE3NzU4MzY5NzI0LCB5OjAuMjQ1OTk3MDg4NzkxODQ4NjJ9LHt4OjUuMTkwNjg0MTMzOTE1NTc1LCB5OjAuMjQ1OTk3MDg4NzkxODQ4NjJ9LHt4OjUuMTY4ODUwMDcyNzgwMjA0LCB5OjAuMjQ1OTk3MDg4NzkxODQ4NjJ9LHt4OjUuMTM4MjgyMzg3MTkwNjg0LCB5OjAuMjc4MDIwMzc4NDU3MDU5N30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMDY5NTkzMjIwMzM4OTgzMDUsIHk6Mi41OTE3ODgxMzU1OTMyMjA0fSx7eDowLjA1MzQ5MTUyNTQyMzcyODgxNCwgeToyLjU2ODkwNjc3OTY2MTAxN30se3g6MC4wNTI2NDQwNjc3OTY2MTAxNywgeToyLjU0NDMzMDUwODQ3NDU3NjZ9LHt4OjAuMDY1MzU1OTMyMjAzMzg5ODIsIHk6Mi41MzI0NjYxMDE2OTQ5MTU1fSx7eDowLjA4NjU0MjM3Mjg4MTM1NTkzLCB5OjIuNTQ2ODcyODgxMzU1OTMyM30se3g6MC4wODU2OTQ5MTUyNTQyMzczLCB5OjIuNTcwNjAxNjk0OTE1MjU0Nn0se3g6MC4wNjg3NDU3NjI3MTE4NjQ0LCB5OjIuNTg5MjQ1NzYyNzExODY1fSx7eDowLjA1OTQyMzcyODgxMzU1OTMyNiwgeToyLjYxNjM2NDQwNjc3OTY2MX0se3g6MC4wNTYwMzM4OTgzMDUwODQ3NSwgeToyLjY0ODU2Nzc5NjYxMDE2OTd9LHt4OjAuMDcyOTgzMDUwODQ3NDU3NjMsIHk6Mi42Njg5MDY3Nzk2NjEwMTczfSx7eDowLjA4MzE1MjU0MjM3Mjg4MTM2LCB5OjIuNjU3ODg5ODMwNTA4NDc1fSx7eDowLjA4NDg0NzQ1NzYyNzExODY1LCB5OjIuNjQwMDkzMjIwMzM4OTgzM30se3g6MC4wODIzMDUwODQ3NDU3NjI3MiwgeToyLjYyOTA3NjI3MTE4NjQ0MX0se3g6MC4wNjYyMDMzODk4MzA1MDg0NywgeToyLjYxNDY2OTQ5MTUyNTQyNH0se3g6MC4wNjI4MTM1NTkzMjIwMzM5LCB5OjIuNTg0MTYxMDE2OTQ5MTUyN30pLFxuICBuZXcgQXJyYXkoe3g6MC4wNTc3Mjg4MTM1NTkzMjIwNCwgeToyLjU3MDYwMTY5NDkxNTI1NDZ9LHt4OjAuMDU3NzI4ODEzNTU5MzIyMDQsIHk6Mi41OTE3ODgxMzU1OTMyMjA0fSx7eDowLjA3Mjk4MzA1MDg0NzQ1NzYzLCB5OjIuNjExMjc5NjYxMDE2OTQ5M30se3g6MC4wODQsIHk6Mi42MjczODEzNTU5MzIyMDM1fSx7eDowLjA4NDg0NzQ1NzYyNzExODY1LCB5OjIuNjUyODA1MDg0NzQ1NzYyN30se3g6MC4wNzg5MTUyNTQyMzcyODgxNCwgeToyLjY2ODkwNjc3OTY2MTAxNzN9LHt4OjAuMDYxMTE4NjQ0MDY3Nzk2NjE1LCB5OjIuNjYxMjc5NjYxMDE2OTQ5fSx7eDowLjA1NzcyODgxMzU1OTMyMjA0LCB5OjIuNjQxNzg4MTM1NTkzMjIwN30se3g6MC4wNzgwNjc3OTY2MTAxNjk1LCB5OjIuNjEzODIyMDMzODk4MzA1NH0se3g6MC4wNzQ2Nzc5NjYxMDE2OTQ5MSwgeToyLjU5NTE3Nzk2NjEwMTY5NX0se3g6MC4wNTg1NzYyNzExODY0NDA2OCwgeToyLjU4MDc3MTE4NjQ0MDY3OH0se3g6MC4wNTUxODY0NDA2Nzc5NjYxLCB5OjIuNTYyMTI3MTE4NjQ0MDY4fSx7eDowLjA1NTE4NjQ0MDY3Nzk2NjEsIHk6Mi41NDE3ODgxMzU1OTMyMjA2fSx7eDowLjA3MjEzNTU5MzIyMDMzODk4LCB5OjIuNTM1MDA4NDc0NTc2MjcxNX0se3g6MC4wODQ4NDc0NTc2MjcxMTg2NSwgeToyLjU0OTQxNTI1NDIzNzI4ODN9LHt4OjAuMDczODMwNTA4NDc0NTc2MjcsIHk6Mi41NzU2ODY0NDA2Nzc5NjYzfSx7eDowLjA3MzgzMDUwODQ3NDU3NjI3LCB5OjIuNjIxNDQ5MTUyNTQyMzczfSx7eDowLjA3OTc2MjcxMTg2NDQwNjc4LCB5OjIuNjMzMzEzNTU5MzIyMDM0M30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxN1MgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDo1LjE0NzAxNjAxMTY0NDgzMjUsIHk6MC4yNDc0NTI2OTI4Njc1NDAwNH0se3g6NS4xMzI0NTk5NzA4ODc5MTgsIHk6MC4yNjc4MzExNDk5MjcyMTk4fSx7eDo1LjEzNjgyNjc4MzExNDk5MjUsIHk6MC4yOTY5NDMyMzE0NDEwNDgwNn0se3g6NS4xNTQyOTQwMzIwMjMyOSwgeTowLjMyMTY4ODUwMDcyNzgwMjAzfSx7eDo1LjE1MTM4MjgyMzg3MTkwNywgeTowLjM1NjYyMjk5ODU0NDM5NTk0fSx7eDo1LjEzMTAwNDM2NjgxMjIyNywgeTowLjM1MjI1NjE4NjMxNzMyMTd9LHt4OjUuMTMyNDU5OTcwODg3OTE4LCB5OjAuMzIxNjg4NTAwNzI3ODAyMDN9LHt4OjUuMTUyODM4NDI3OTQ3NTk4LCB5OjAuMjkyNTc2NDE5MjEzOTczOH0se3g6NS4xNTI4Mzg0Mjc5NDc1OTgsIHk6MC4yNTAzNjM5MDEwMTg5MjI4Nn0se3g6NS4xMzM5MTU1NzQ5NjM2MSwgeTowLjI0MDE3NDY3MjQ4OTA4Mjk3fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE4ID0gbmV3IEFycmF5KFxuICAvL25ldyBBcnJheSh7eDowLjA3Mjk4MzA1MDg0NzQ1NzYzLCB5OjIuNjU1MzQ3NDU3NjI3MTE4OH0se3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjY3MDYwMTY5NDkxNTI1NDJ9LHt4OjAuMDY0NTA4NDc0NTc2MjcxMTgsIHk6Mi42OTE3ODgxMzU1OTMyMjA1fSx7eDowLjA3NDY3Nzk2NjEwMTY5NDkxLCB5OjIuNjk4NTY3Nzk2NjEwMTY5NX0se3g6MC4wNjQ1MDg0NzQ1NzYyNzExOCwgeToyLjcwMzY1MjU0MjM3Mjg4MTd9LCB7eDowLjA2Nzg5ODMwNTA4NDc0NTc2LCB5OjIuNzYwNjAxNjk0OTE1MjU0M30se3g6MC4wNzk3NjI3MTE4NjQ0MDY3OCwgeToyLjc2ODIyODgxMzU1OTMyMn0se3g6MC4xMDUxODY0NDA2Nzc5NjYxLCB5OjIuNzY4MjI4ODEzNTU5MzIyfSx7eDowLjEzMDYxMDE2OTQ5MTUyNTQzLCB5OjIuNzY4MjI4ODEzNTU5MzIyfSx7eDowLjE1MDk0OTE1MjU0MjM3MjksIHk6Mi43ODE2MTg2NDQwNjc3OTd9LHt4OjAuMTUyNjQ0MDY3Nzk2NjEwMTYsIHk6Mi43OTYwMjU0MjM3Mjg4MTM2fSx7eDowLjE1MzQ5MTUyNTQyMzcyODgsIHk6Mi44MTU1MTY5NDkxNTI1NDI1fSx7eDowLjE1NDMzODk4MzA1MDg0NzQ4LCB5OjIuODQ1MTc3OTY2MTAxNjk1fSx7eDowLjE2MDI3MTE4NjQ0MDY3Nzk1LCB5OjIuODU4NzM3Mjg4MTM1NTkzMn0se3g6MC4xNzYzNzI4ODEzNTU5MzIyLCB5OjIuODUxMjc5NjYxMDE2OTQ5M30se3g6MC4xODMxNTI1NDIzNzI4ODEzNywgeToyLjg0Nzg4OTgzMDUwODQ3NDZ9LHt4OjAuMTg2NTQyMzcyODgxMzU1OTQsIHk6Mi44NTU1MTY5NDkxNTI1NDI3fSx7eDowLjE5MDc3OTY2MTAxNjk0OTE1LCB5OjIuODQ3ODg5ODMwNTA4NDc0Nn0se3g6MC4xOTY3MTE4NjQ0MDY3Nzk2OCwgeToyLjg1MzgyMjAzMzg5ODMwNTR9LHt4OjAuMjAwOTQ5MTUyNTQyMzcyOSwgeToyLjg0NTM0NzQ1NzYyNzExOX0se3g6MC4yMDY4ODEzNTU5MzIyMDM0MSwgeToyLjg1NDY2OTQ5MTUyNTQyNH0se3g6MC4yMTAyNzExODY0NDA2NzgsIHk6Mi44NDQ1MDAwMDAwMDAwMDAzfSx7eDowLjIxNDUwODQ3NDU3NjI3MTIsIHk6Mi44NTQ2Njk0OTE1MjU0MjR9LHt4OjAuMjE5NTkzMjIwMzM4OTgzMDQsIHk6Mi44NDQ1MDAwMDAwMDAwMDAzfSx7eDowLjIyNDY3Nzk2NjEwMTY5NDk0LCB5OjIuODQzODIyMDMzODk4MzA1NH0se3g6MC4yMjgwNjc3OTY2MTAxNjk1MiwgeToyLjg0MzY1MjU0MjM3Mjg4MTZ9LHt4OjAuMjMwNjEwMTY5NDkxNTI1NCwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuMjQ5MjU0MjM3Mjg4MTM1NTYsIHk6Mi44NjA0MzIyMDMzODk4MzA2fSx7eDowLjI4MTQ1NzYyNzExODY0NCwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuMzQ2NzExODY0NDA2Nzc5NjUsIHk6Mi44NTEyNzk2NjEwMTY5NDkzfSx7eDowLjM4OTA4NDc0NTc2MjcxMTg1LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40MDM0OTE1MjU0MjM3Mjg4LCB5OjIuODQ4NzM3Mjg4MTM1NTkzMn0se3g6MC40MDYwMzM4OTgzMDUwODQ3NCwgeToyLjg0NTM0NzQ1NzYyNzExOX0se3g6MC40MTExMTg2NDQwNjc3OTY2LCB5OjIuODU2MzY0NDA2Nzc5NjYxfSx7eDowLjQxNjIwMzM4OTgzMDUwODUsIHk6Mi44NTUzNDc0NTc2MjcxMTl9LHt4OjAuNDE4NzQ1NzYyNzExODY0MzcsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQyNjM3Mjg4MTM1NTkzMjIsIHk6Mi44NTI4MDUwODQ3NDU3NjN9LHt4OjAuNDI4MDY3Nzk2NjEwMTY5NDcsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQzMTQ1NzYyNzExODY0NDA1LCB5OjIuODQzNjUyNTQyMzcyODgxNn0se3g6MC40MzQsIHk6Mi44NTI5NzQ1NzYyNzExODY3fSx7eDowLjQzNCwgeToyLjg0NjE5NDkxNTI1NDIzNzZ9LHt4OjAuNDQxNjI3MTE4NjQ0MDY3OCwgeToyLjg1NjM2NDQwNjc3OTY2MX0se3g6MC40NDUwMTY5NDkxNTI1NDIzNiwgeToyLjg0NTM0NzQ1NzYyNzExOX0se3g6MC40NTAxMDE2OTQ5MTUyNTQyLCB5OjIuODUxMjc5NjYxMDE2OTQ5M30se3g6MC40NjM2NjEwMTY5NDkxNTI1LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40ODQsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQ5NDE2OTQ5MTUyNTQyMzY3LCB5OjIuODY4MDU5MzIyMDMzODk4NH0se3g6MC40OTc1NTkzMjIwMzM4OTgzLCB5OjIuODg3NTUwODQ3NDU3NjI3Mn0se3g6MC40OTc1NTkzMjIwMzM4OTgzLCB5OjIuOTI1Njg2NDQwNjc3OTY2M30se3g6MC40OTY3MTE4NjQ0MDY3Nzk2LCB5OjIuOTUyODA1MDg0NzQ1NzYzfSx7eDowLjQ5NzU1OTMyMjAzMzg5ODMsIHk6Mi45ODA3NzExODY0NDA2NzgzfSwge3g6MC40ODQ4NDc0NTc2MjcxMTg2NywgeTozLjAwMzY1MjU0MjM3Mjg4MTV9LHt4OjAuNDYyODEzNTU5MzIyMDMzOSwgeTozLjAxMjk3NDU3NjI3MTE4NjZ9LHt4OjAuNDQyNDc0NTc2MjcxMTg2NCwgeTozLjAxMzgyMjAzMzg5ODMwNTN9LHt4OjAuNDMyMzA1MDg0NzQ1NzYyNywgeTozLjAxODA1OTMyMjAzMzg5ODN9LHt4OjAuNDI3MjIwMzM4OTgzMDUwODQsIHk6My4wMjkwNzYyNzExODY0NDA3fSx7eDowLjQyNjM3Mjg4MTM1NTkzMjIsIHk6My4wNjI5NzQ1NzYyNzExODY0fSx7eDowLjQyOTc2MjcxMTg2NDQwNjgsIHk6My4xMDExMTAxNjk0OTE1MjU1fSx7eDowLjQyMzgzMDUwODQ3NDU3NjI2LCB5OjMuMTEzODIyMDMzODk4MzA1NH0se3g6MC4zODU2OTQ5MTUyNTQyMzcyNywgeTozLjExODA1OTMyMjAzMzg5ODR9LHt4OjAuMzU2ODgxMzU1OTMyMjAzNCwgeTozLjExNzIxMTg2NDQwNjc3OTd9LHt4OjAuMzQ1ODY0NDA2Nzc5NjYxLCB5OjMuMTA4NzM3Mjg4MTM1NTkzMn0se3g6MC4zNDU4NjQ0MDY3Nzk2NjEsIHk6My4wOTUxNzc5NjYxMDE2OTV9LHt4OjAuMzQzMzIyMDMzODk4MzA1MDcsIHk6My4wMjMxNDQwNjc3OTY2MTA0fSlcbiAgbmV3IEFycmF5KHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeToyLjg4OTgzMDUwODQ3NDU3Nn0se3g6MC4wODI5NjYxMDE2OTQ5MTUyNSwgeToyLjkwNjc3OTY2MTAxNjk0OX0se3g6MC4wODQ2NjEwMTY5NDkxNTI1MSwgeToyLjkxNjk0OTE1MjU0MjM3Mjd9LHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeToyLjkzODk4MzA1MDg0NzQ1Nzd9LHt4OjAuMDgzODEzNTU5MzIyMDMzODgsIHk6Mi45NjM1NTkzMjIwMzM4OTgzfSx7eDowLjA3Nzg4MTM1NTkzMjIwMzM2LCB5OjIuOTcwMzM4OTgzMDUwODQ3M30se3g6MC4wODU1MDg0NzQ1NzYyNzEyLCB5OjIuOTc0NTc2MjcxMTg2NDQwN30se3g6MC4wODEyNzExODY0NDA2Nzc5MywgeToyLjk3Nzk2NjEwMTY5NDkxNX0se3g6MC4wODQ2NjEwMTY5NDkxNTI1MSwgeToyLjk4MjIwMzM4OTgzMDUwODV9LHt4OjAuMDc5NTc2MjcxMTg2NDQwNjcsIHk6Mi45ODU1OTMyMjAzMzg5ODMyfSx7eDowLjA4NDY2MTAxNjk0OTE1MjUxLCB5OjIuOTg5ODMwNTA4NDc0NTc2fSx7eDowLjA4MDQyMzcyODgxMzU1OTMsIHk6Mi45OTU3NjI3MTE4NjQ0MDY2fSx7eDowLjA4NjM1NTkzMjIwMzM4OTgzLCB5OjIuOTk5MTUyNTQyMzcyODgxM30se3g6MC4wNzg3Mjg4MTM1NTkzMjIwNCwgeTozLjAwNTA4NDc0NTc2MjcxMTd9LHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeTozLjAwODQ3NDU3NjI3MTE4NjR9LHt4OjAuMDgwNDIzNzI4ODEzNTU5MywgeTozLjAxMjcxMTg2NDQwNjc4fSx7eDowLjA4Mjk2NjEwMTY5NDkxNTI1LCB5OjMuMDIzNzI4ODEzNTU5MzIyfSx7eDowLjA4Mjk2NjEwMTY5NDkxNTI1LCB5OjMuMDM3Mjg4MTM1NTkzMjIwNH0se3g6MC4wODEyNzExODY0NDA2Nzc5MywgeTozLjA2NjEwMTY5NDkxNTI1NDR9LHt4OjAuMDgxMjcxMTg2NDQwNjc3OTMsIHk6My4wOTQwNjc3OTY2MTAxNjkzfSx7eDowLjA4NTUwODQ3NDU3NjI3MTIsIHk6My4xMTI3MTE4NjQ0MDY3Nzk1fSx7eDowLjA5MTQ0MDY3Nzk2NjEwMTY3LCB5OjMuMTIyMDMzODk4MzA1MDg0Nn0se3g6MC4xMDU4NDc0NTc2MjcxMTg2MSwgeTozLjEyNjI3MTE4NjQ0MDY3OH0se3g6MC4xMjM2NDQwNjc3OTY2MTAxNCwgeTozLjEyNzk2NjEwMTY5NDkxNTR9LHt4OjAuMTMyOTY2MTAxNjk0OTE1MjQsIHk6My4xNDE1MjU0MjM3Mjg4MTM1fSx7eDowLjEzMzgxMzU1OTMyMjAzMzg3LCB5OjMuMTkzMjIwMzM4OTgzMDUwN30se3g6MC4xMzcyMDMzODk4MzA1MDg0NSwgeTozLjIwODQ3NDU3NjI3MTE4NjZ9LHt4OjAuMTQ1Njc3OTY2MTAxNjk0OTIsIHk6My4yMTM1NTkzMjIwMzM4OTgzfSx7eDowLjE1NjY5NDkxNTI1NDIzNzMsIHk6My4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjE2OTQwNjc3OTY2MTAxNjkyLCB5OjMuMjExODY0NDA2Nzc5NjYxfSx7eDowLjE3NjE4NjQ0MDY3Nzk2NjA3LCB5OjMuMjE3Nzk2NjEwMTY5NDkxN30se3g6MC4xODEyNzExODY0NDA2Nzc5NywgeTozLjIwODQ3NDU3NjI3MTE4NjZ9LHt4OjAuMTg5NzQ1NzYyNzExODY0MzksIHk6My4yMTc3OTY2MTAxNjk0OTE3fSx7eDowLjE5MTQ0MDY3Nzk2NjEwMTcsIHk6My4yMTEwMTY5NDkxNTI1NDJ9LHt4OjAuMTk4MjIwMzM4OTgzMDUwODYsIHk6My4yMTYxMDE2OTQ5MTUyNTQzfSx7eDowLjIwMzMwNTA4NDc0NTc2MjcsIHk6My4yMDg0NzQ1NzYyNzExODY2fSx7eDowLjIwODM4OTgzMDUwODQ3NDYsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuMjEyNjI3MTE4NjQ0MDY3OCwgeTozLjIxMTAxNjk0OTE1MjU0Mn0se3g6MC4yMjE5NDkxNTI1NDIzNzI4NSwgeTozLjIxNjEwMTY5NDkxNTI1NDN9LHt4OjAuMjY4NTU5MzIyMDMzODk4MywgeTozLjIxNjEwMTY5NDkxNTI1NDN9LHt4OjAuMzc1MzM4OTgzMDUwODQ3NCwgeTozLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuMzg3MjAzMzg5ODMwNTA4NDUsIHk6My4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjM5NDgzMDUwODQ3NDU3NjMsIHk6My4yMTI3MTE4NjQ0MDY3Nzk2fSx7eDowLjQwNTg0NzQ1NzYyNzExODY2LCB5OjMuMjIwMzM4OTgzMDUwODQ3M30se3g6MC40MTAwODQ3NDU3NjI3MTE4NywgeTozLjIwOTMyMjAzMzg5ODMwNTN9LHt4OjAuNDIwMjU0MjM3Mjg4MTM1NTUsIHk6My4yMjAzMzg5ODMwNTA4NDczfSx7eDowLjQyNzAzMzg5ODMwNTA4NDcsIHk6My4yMDkzMjIwMzM4OTgzMDUzfSx7eDowLjQzMjk2NjEwMTY5NDkxNTMsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDM4ODk4MzA1MDg0NzQ1NzUsIHk6My4yMTAxNjk0OTE1MjU0MjM1fSx7eDowLjQ0OTkxNTI1NDIzNzI4ODEsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDcxMTAxNjk0OTE1MjU0MywgeTozLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuNDg2MzU1OTMyMjAzMzg5ODUsIHk6My4yMTc3OTY2MTAxNjk0OTE3fSx7eDowLjQ5NDgzMDUwODQ3NDU3NjI3LCB5OjMuMjIyMDMzODk4MzA1MDg0N30se3g6MC40OTk5MTUyNTQyMzcyODgxNiwgeTozLjIzNzI4ODEzNTU5MzIyfSx7eDowLjQ5OTkxNTI1NDIzNzI4ODE2LCB5OjMuMjc0NTc2MjcxMTg2NDQwNn0se3g6MC40OTk5MTUyNTQyMzcyODgxNiwgeTozLjMxNTI1NDIzNzI4ODEzNTd9LHt4OjAuNDk4MjIwMzM4OTgzMDUwOCwgeTozLjM0NDkxNTI1NDIzNzI4OH0se3g6MC40OTkwNjc3OTY2MTAxNjk1LCB5OjMuMzYyNzExODY0NDA2Nzc5NX0sIHt4OjAuNDg2MzU1OTMyMjAzMzg5ODUsIHk6My4zNzIwMzM4OTgzMDUwODQ2fSx7eDowLjQ2ODU1OTMyMjAzMzg5ODMzLCB5OjMuMzc5NjYxMDE2OTQ5MTUyM30se3g6MC40NTY2OTQ5MTUyNTQyMzczLCB5OjMuMzc4ODEzNTU5MzIyMDM0fSx7eDowLjQ0MDU5MzIyMDMzODk4MywgeTozLjM4MDUwODQ3NDU3NjI3MX0se3g6MC40MzEyNzExODY0NDA2Nzc5LCB5OjMuMzg1NTkzMjIwMzM4OTgzfSx7eDowLjQyNjE4NjQ0MDY3Nzk2NjEsIHk6My4zOTQ5MTUyNTQyMzcyODgyfSx7eDowLjQyNTMzODk4MzA1MDg0NzQ0LCB5OjMuNDE0NDA2Nzc5NjYxMDE3fSx7eDowLjQyNDQ5MTUyNTQyMzcyODc1LCB5OjMuNDYwMTY5NDkxNTI1NDIzNX0se3g6MC40MjQ0OTE1MjU0MjM3Mjg3NSwgeTozLjQ3Nzk2NjEwMTY5NDkxNX0se3g6MC40MTUxNjk0OTE1MjU0MjM3NiwgeTozLjQ4ODEzNTU5MzIyMDMzOX0se3g6MC4zODk3NDU3NjI3MTE4NjQ0LCB5OjMuNDkwNjc3OTY2MTAxNjk1fSx7eDowLjM1MTYxMDE2OTQ5MTUyNTQsIHk6My40ODgxMzU1OTMyMjAzMzl9LHt4OjAuMzQxNDQwNjc3OTY2MTAxNywgeTozLjQ3ODgxMzU1OTMyMjAzMzd9LHt4OjAuMzM4ODk4MzA1MDg0NzQ1OCwgeTozLjQ2Nzc5NjYxMDE2OTQ5MTd9LHt4OjAuMzM4ODk4MzA1MDg0NzQ1OCwgeTozLjQ1MTY5NDkxNTI1NDIzN30se3g6MC4zMzg4OTgzMDUwODQ3NDU4LCB5OjMuMzk3NDU3NjI3MTE4NjQ0fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE4UyA9IG5ldyBBcnJheShcbiAgLy9uZXcgQXJyYXkoe3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjY1NTM0NzQ1NzYyNzExODh9LHt4OjAuMDcyOTgzMDUwODQ3NDU3NjMsIHk6Mi42NzA2MDE2OTQ5MTUyNTQyfSx7eDowLjA2NDUwODQ3NDU3NjI3MTE4LCB5OjIuNjkxNzg4MTM1NTkzMjIwNX0se3g6MC4wNzQ2Nzc5NjYxMDE2OTQ5MSwgeToyLjY5ODU2Nzc5NjYxMDE2OTV9LHt4OjAuMDY0NTA4NDc0NTc2MjcxMTgsIHk6Mi43MDM2NTI1NDIzNzI4ODE3fSwge3g6MC4wNjc4OTgzMDUwODQ3NDU3NiwgeToyLjc2MDYwMTY5NDkxNTI1NDN9LHt4OjAuMDc5NzYyNzExODY0NDA2NzgsIHk6Mi43NjgyMjg4MTM1NTkzMjJ9LHt4OjAuMTA1MTg2NDQwNjc3OTY2MSwgeToyLjc2ODIyODgxMzU1OTMyMn0se3g6MC4xMzA2MTAxNjk0OTE1MjU0MywgeToyLjc2ODIyODgxMzU1OTMyMn0se3g6MC4xNTA5NDkxNTI1NDIzNzI5LCB5OjIuNzgxNjE4NjQ0MDY3Nzk3fSx7eDowLjE1MjY0NDA2Nzc5NjYxMDE2LCB5OjIuNzk2MDI1NDIzNzI4ODEzNn0se3g6MC4xNTM0OTE1MjU0MjM3Mjg4LCB5OjIuODE1NTE2OTQ5MTUyNTQyNX0se3g6MC4xNTQzMzg5ODMwNTA4NDc0OCwgeToyLjg0NTE3Nzk2NjEwMTY5NX0se3g6MC4xNjAyNzExODY0NDA2Nzc5NSwgeToyLjg1ODczNzI4ODEzNTU5MzJ9LHt4OjAuMTc2MzcyODgxMzU1OTMyMiwgeToyLjg1MTI3OTY2MTAxNjk0OTN9LHt4OjAuMTgzMTUyNTQyMzcyODgxMzcsIHk6Mi44NDc4ODk4MzA1MDg0NzQ2fSx7eDowLjE4NjU0MjM3Mjg4MTM1NTk0LCB5OjIuODU1NTE2OTQ5MTUyNTQyN30se3g6MC4xOTA3Nzk2NjEwMTY5NDkxNSwgeToyLjg0Nzg4OTgzMDUwODQ3NDZ9LHt4OjAuMTk2NzExODY0NDA2Nzc5NjgsIHk6Mi44NTM4MjIwMzM4OTgzMDU0fSx7eDowLjIwMDk0OTE1MjU0MjM3MjksIHk6Mi44NDUzNDc0NTc2MjcxMTl9LHt4OjAuMjA2ODgxMzU1OTMyMjAzNDEsIHk6Mi44NTQ2Njk0OTE1MjU0MjR9LHt4OjAuMjEwMjcxMTg2NDQwNjc4LCB5OjIuODQ0NTAwMDAwMDAwMDAwM30se3g6MC4yMTQ1MDg0NzQ1NzYyNzEyLCB5OjIuODU0NjY5NDkxNTI1NDI0fSx7eDowLjIxOTU5MzIyMDMzODk4MzA0LCB5OjIuODQ0NTAwMDAwMDAwMDAwM30se3g6MC4yMjQ2Nzc5NjYxMDE2OTQ5NCwgeToyLjg0MzgyMjAzMzg5ODMwNTR9LHt4OjAuMjI4MDY3Nzk2NjEwMTY5NTIsIHk6Mi44NDM2NTI1NDIzNzI4ODE2fSx7eDowLjIzMDYxMDE2OTQ5MTUyNTQsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjI0OTI1NDIzNzI4ODEzNTU2LCB5OjIuODYwNDMyMjAzMzg5ODMwNn0se3g6MC4yODE0NTc2MjcxMTg2NDQsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjM0NjcxMTg2NDQwNjc3OTY1LCB5OjIuODUxMjc5NjYxMDE2OTQ5M30se3g6MC4zODkwODQ3NDU3NjI3MTE4NSwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuNDAzNDkxNTI1NDIzNzI4OCwgeToyLjg0ODczNzI4ODEzNTU5MzJ9LHt4OjAuNDA2MDMzODk4MzA1MDg0NzQsIHk6Mi44NDUzNDc0NTc2MjcxMTl9LHt4OjAuNDExMTE4NjQ0MDY3Nzk2NiwgeToyLjg1NjM2NDQwNjc3OTY2MX0se3g6MC40MTYyMDMzODk4MzA1MDg1LCB5OjIuODU1MzQ3NDU3NjI3MTE5fSx7eDowLjQxODc0NTc2MjcxMTg2NDM3LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40MjYzNzI4ODEzNTU5MzIyLCB5OjIuODUyODA1MDg0NzQ1NzYzfSx7eDowLjQyODA2Nzc5NjYxMDE2OTQ3LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40MzE0NTc2MjcxMTg2NDQwNSwgeToyLjg0MzY1MjU0MjM3Mjg4MTZ9LHt4OjAuNDM0LCB5OjIuODUyOTc0NTc2MjcxMTg2N30se3g6MC40MzQsIHk6Mi44NDYxOTQ5MTUyNTQyMzc2fSx7eDowLjQ0MTYyNzExODY0NDA2NzgsIHk6Mi44NTYzNjQ0MDY3Nzk2NjF9LHt4OjAuNDQ1MDE2OTQ5MTUyNTQyMzYsIHk6Mi44NDUzNDc0NTc2MjcxMTl9LHt4OjAuNDUwMTAxNjk0OTE1MjU0MiwgeToyLjg1MTI3OTY2MTAxNjk0OTN9LHt4OjAuNDYzNjYxMDE2OTQ5MTUyNSwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuNDg0LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40OTQxNjk0OTE1MjU0MjM2NywgeToyLjg2ODA1OTMyMjAzMzg5ODR9LHt4OjAuNDk3NTU5MzIyMDMzODk4MywgeToyLjg4NzU1MDg0NzQ1NzYyNzJ9LHt4OjAuNDk3NTU5MzIyMDMzODk4MywgeToyLjkyNTY4NjQ0MDY3Nzk2NjN9LHt4OjAuNDk2NzExODY0NDA2Nzc5NiwgeToyLjk1MjgwNTA4NDc0NTc2M30se3g6MC40OTc1NTkzMjIwMzM4OTgzLCB5OjIuOTgwNzcxMTg2NDQwNjc4M30sIHt4OjAuNDg0ODQ3NDU3NjI3MTE4NjcsIHk6My4wMDM2NTI1NDIzNzI4ODE1fSx7eDowLjQ2MjgxMzU1OTMyMjAzMzksIHk6My4wMTI5NzQ1NzYyNzExODY2fSx7eDowLjQ0MjQ3NDU3NjI3MTE4NjQsIHk6My4wMTM4MjIwMzM4OTgzMDUzfSx7eDowLjQzMjMwNTA4NDc0NTc2MjcsIHk6My4wMTgwNTkzMjIwMzM4OTgzfSx7eDowLjQyNzIyMDMzODk4MzA1MDg0LCB5OjMuMDI5MDc2MjcxMTg2NDQwN30se3g6MC40MjYzNzI4ODEzNTU5MzIyLCB5OjMuMDYyOTc0NTc2MjcxMTg2NH0se3g6MC40Mjk3NjI3MTE4NjQ0MDY4LCB5OjMuMTAxMTEwMTY5NDkxNTI1NX0se3g6MC40MjM4MzA1MDg0NzQ1NzYyNiwgeTozLjExMzgyMjAzMzg5ODMwNTR9LHt4OjAuMzg1Njk0OTE1MjU0MjM3MjcsIHk6My4xMTgwNTkzMjIwMzM4OTg0fSx7eDowLjM1Njg4MTM1NTkzMjIwMzQsIHk6My4xMTcyMTE4NjQ0MDY3Nzk3fSx7eDowLjM0NTg2NDQwNjc3OTY2MSwgeTozLjEwODczNzI4ODEzNTU5MzJ9LHt4OjAuMzQ1ODY0NDA2Nzc5NjYxLCB5OjMuMDk1MTc3OTY2MTAxNjk1fSx7eDowLjM0MzMyMjAzMzg5ODMwNTA3LCB5OjMuMDIzMTQ0MDY3Nzk2NjEwNH0pXG4gIC8vbmV3IEFycmF5KHt4OjUuMTQxMTkzNTk1MzQyMDY3LCB5OjAuMjI1NjE4NjMxNzMyMTY4ODR9LHt4OjUuMTQxMTkzNTk1MzQyMDY3LCB5OjAuMjA5NjA2OTg2ODk5NTYzM30se3g6NS4xMzgyODIzODcxOTA2ODQsIHk6MC4xOTIxMzk3Mzc5OTEyNjYzOH0se3g6NS4xMzk3Mzc5OTEyNjYzNzYsIHk6MC4xNjAxMTY0NDgzMjYwNTUzMn0se3g6NS4xMzk3Mzc5OTEyNjYzNzYsIHk6MC4xMzEwMDQzNjY4MTIyMjcwN30se3g6NS4xNDI2NDkxOTk0MTc3NTgsIHk6MC4xMTIwODE1MTM4MjgyMzg3Mn0se3g6NS4xNTU3NDk2MzYwOTg5ODEsIHk6MC4xMDMzNDc4ODkzNzQwOTAyNH0se3g6NS4xODYzMTczMjE2ODg1MDEsIHk6MC4xMDE4OTIyODUyOTgzOTg4M30se3g6NS41MDUwOTQ2MTQyNjQ5MTk1LCB5OjAuMTAxODkyMjg1Mjk4Mzk4ODN9LHt4OjUuOTM3NDA5MDI0NzQ1MjY5NSwgeTowLjA5ODk4MTA3NzE0NzAxNjAxfSx7eDo1Ljk4MjUzMjc1MTA5MTcwMzUsIHk6MC4xMDMzNDc4ODkzNzQwOTAyNH0se3g6NS45OTcwODg3OTE4NDg2MTc1LCB5OjAuMTAwNDM2NjgxMjIyNzA3NDJ9LHt4OjYuMDAyOTExMjA4MTUxMzgyNSwgeTowLjA4NDQyNTAzNjM5MDEwMTg5fSx7eDo2LjAwMjkxMTIwODE1MTM4MjUsIHk6MC4wNTgyMjQxNjMwMjc2NTY0OH0se3g6Ni4wMDU4MjI0MTYzMDI3NjYsIHk6MC4wMzYzOTAxMDE4OTIyODUyOTV9LHt4OjYuMDEzMTAwNDM2NjgxMjIyLCB5OjAuMDI3NjU2NDc3NDM4MTM2ODI4fSx7eDo2LjAzMDU2NzY4NTU4OTUyLCB5OjAuMDIzMjg5NjY1MjExMDYyNTkyfSx7eDo2LjE5Nzk2MjE1NDI5NDAzMiwgeTowLjAyNjIwMDg3MzM2MjQ0NTQxM30se3g6Ni4yMTk3OTYyMTU0Mjk0MDMsIHk6MC4wMzM0Nzg4OTM3NDA5MDI0NzR9LHt4OjYuMjI4NTI5ODM5ODgzNTUyLCB5OjAuMDUzODU3MzUwODAwNTgyMjQ1fSx7eDo2LjIyNTYxODYzMTczMjE2OSwgeTowLjI5Njk0MzIzMTQ0MTA0ODA2fSx7eDo2LjIzNzI2MzQ2NDMzNzcsIHk6MC4zMTczMjE2ODg1MDA3Mjc4fSx7eDo2LjI1NDczMDcxMzI0NTk5NywgeTowLjMxODc3NzI5MjU3NjQxOTI0fSx7eDo2LjI3ODAyMDM3ODQ1NzA2LCB5OjAuMzI4OTY2NTIxMTA2MjU5MX0se3g6Ni4yODA5MzE1ODY2MDg0NDI1LCB5OjAuMzU2NjIyOTk4NTQ0Mzk1OTR9LHt4OjYuMjg1Mjk4Mzk4ODM1NTE3LCB5OjAuNDA0NjU3OTMzMDQyMjEyNTR9LHt4OjYuMzAyNzY1NjQ3NzQzODE0LCB5OjAuNDE0ODQ3MTYxNTcyMDUyNH0se3g6Ni4zMTg3NzcyOTI1NzY0MTksIHk6MC40MTYzMDI3NjU2NDc3NDM4fSx7eDo2LjMyNzUxMDkxNzAzMDU2OCwgeTowLjQyMDY2OTU3Nzg3NDgxODA3fSx7eDo2LjMzMzMzMzMzMzMzMzMzMywgeTowLjQxMzM5MTU1NzQ5NjM2MX0se3g6Ni4zNDIwNjY5NTc3ODc0ODIsIHk6MC40MjA2Njk1Nzc4NzQ4MTgwN30se3g6Ni4zNTIyNTYxODYzMTczMjEsIHk6MC40MTYzMDI3NjU2NDc3NDM4fSx7eDo2LjM2MDk4OTgxMDc3MTQ3LCB5OjAuNDIzNTgwNzg2MDI2MjAwODZ9LHt4OjYuMzY5NzIzNDM1MjI1NjE5LCB5OjAuNDEzMzkxNTU3NDk2MzYxfSx7eDo2LjM4MjgyMzg3MTkwNjg0MSwgeTowLjQxOTIxMzk3Mzc5OTEyNjZ9LHt4OjYuNTU4OTUxOTY1MDY1NTAzLCB5OjAuNDE5MjEzOTczNzk5MTI2Nn0se3g6Ni41NzQ5NjM2MDk4OTgxMDc1LCB5OjAuNDIyMTI1MTgxOTUwNTA5NDZ9LHt4OjYuNTgyMjQxNjMwMjc2NTY1LCB5OjAuNDExOTM1OTUzNDIwNjY5Nn0se3g6Ni41OTUzNDIwNjY5NTc3ODcsIHk6MC40MjY0OTE5OTQxNzc1ODM3fSx7eDo2LjU5OTcwODg3OTE4NDg2MTUsIHk6MC40MTQ4NDcxNjE1NzIwNTI0fSx7eDo2LjYxMjgwOTMxNTg2NjA4NSwgeTowLjQyNTAzNjM5MDEwMTg5MjI2fSx7eDo2LjYyMDA4NzMzNjI0NDU0MSwgeTowLjQxNDg0NzE2MTU3MjA1MjR9LHt4OjYuNjM3NTU0NTg1MTUyODM5LCB5OjAuNDE3NzU4MzY5NzIzNDM1Mn0se3g6Ni42NjY2NjY2NjY2NjY2NjcsIHk6MC40MjIxMjUxODE5NTA1MDk0Nn0se3g6Ni42ODU1ODk1MTk2NTA2NTUsIHk6MC40MzUyMjU2MTg2MzE3MzIxNX0se3g6Ni42ODcwNDUxMjM3MjYzNDcsIHk6MC40ODE4MDQ5NDkwNTM4NTczNX0se3g6Ni42ODg1MDA3Mjc4MDIwMzgsIHk6MC41MzEyOTU0ODc2MjczNjUzfSx7eDo2LjY4ODUwMDcyNzgwMjAzOCwgeTowLjU1NzQ5NjM2MDk4OTgxMDh9LHt4OjYuNjg4NTAwNzI3ODAyMDM4LCB5OjAuNTc3ODc0ODE4MDQ5NDkwNn0se3g6Ni42NzgzMTE0OTkyNzIxOTgsIHk6MC41OTUzNDIwNjY5NTc3ODc1fSx7eDo2LjY1NzkzMzA0MjIxMjUxOCwgeTowLjYwMTE2NDQ4MzI2MDU1MzJ9LHt4OjYuNjQxOTIxMzk3Mzc5OTEzLCB5OjAuNTk4MjUzMjc1MTA5MTcwM30se3g6Ni42MjczNjUzNTY2MjI5OTksIHk6MC41OTgyNTMyNzUxMDkxNzAzfSx7eDo2LjYxODYzMTczMjE2ODg1LCB5OjAuNjA1NTMxMjk1NDg3NjI3NH0se3g6Ni42MTEzNTM3MTE3OTAzOTMsIHk6MC42MTcxNzYxMjgwOTMxNTg3fSx7eDo2LjYwODQ0MjUwMzYzOTAxLCB5OjAuNjQ3NzQzODEzNjgyNjc4M30se3g6Ni42MDg0NDI1MDM2MzkwMSwgeTowLjY4NDEzMzkxNTU3NDk2MzZ9LHt4OjYuNjA4NDQyNTAzNjM5MDEsIHk6MC43MDg4NzkxODQ4NjE3MTc2fSx7eDo2LjU5OTcwODg3OTE4NDg2MTUsIHk6MC43MTYxNTcyMDUyNDAxNzQ3fSx7eDo2LjU2NzY4NTU4OTUxOTY1MSwgeTowLjcxNzYxMjgwOTMxNTg2NjF9LHt4OjYuNTM3MTE3OTAzOTMwMTMxLCB5OjAuNzE5MDY4NDEzMzkxNTU3NX0se3g6Ni41MjExMDYyNTkwOTc1MjUsIHk6MC43MTkwNjg0MTMzOTE1NTc1fSx7eDo2LjUxODE5NTA1MDk0NjE0MywgeTowLjcwNTk2Nzk3NjcxMDMzNDh9LHt4OjYuNTEzODI4MjM4NzE5MDY5LCB5OjAuNjk0MzIzMTQ0MTA0ODAzNH0se3g6Ni41MTM4MjgyMzg3MTkwNjksIHk6MC42NzY4NTU4OTUxOTY1MDY2fSx7eDo2LjUxMjM3MjYzNDY0MzM3NywgeTowLjYyNTkwOTc1MjU0NzMwNzJ9KVxuICAvL25ldyBBcnJheSh7eDo1LjE0MTY0NjQ4OTEwNDExNiwgeTowLjIyNzYwMjkwNTU2OTAwNzI1fSx7eDo1LjE0MDQzNTgzNTM1MTA5LCB5OjAuMjEwNjUzNzUzMDI2NjM0NH0se3g6NS4xNDA0MzU4MzUzNTEwOSwgeTowLjE5OTc1Nzg2OTI0OTM5NDY4fSx7eDo1LjEzOTIyNTE4MTU5ODA2MjUsIHk6MC4xNzkxNzY3NTU0NDc5NDE5fSx7eDo1LjEzOTIyNTE4MTU5ODA2MjUsIHk6MC4xNTYxNzQzMzQxNDA0MzU4M30se3g6NS4xMzkyMjUxODE1OTgwNjI1LCB5OjAuMTM4MDE0NTI3ODQ1MDM2MzJ9LHt4OjUuMTM5MjI1MTgxNTk4MDYyNSwgeTowLjEyNDY5NzMzNjU2MTc0MzM0fSx7eDo1LjE0MDQzNTgzNTM1MTA5LCB5OjAuMTE2MjIyNzYwMjkwNTU2OX0se3g6NS4xNDQwNjc3OTY2MTAxNjk2LCB5OjAuMTEwMTY5NDkxNTI1NDIzNzN9LHt4OjUuMTQ4OTEwNDExNjIyMjc2LCB5OjAuMTA1MzI2ODc2NTEzMzE3Mn0se3g6NS4xNTYxNzQzMzQxNDA0MzYsIHk6MC4xMDE2OTQ5MTUyNTQyMzczfSx7eDo1LjE3NTU0NDc5NDE4ODg2MiwgeTowLjA5OTI3MzYwNzc0ODE4NDAxfSx7eDo1LjIwNzAyMTc5MTc2NzU1NSwgeTowLjEwMDQ4NDI2MTUwMTIxMDY1fSx7eDo1LjUyMzAwMjQyMTMwNzUwNiwgeTowLjEwMDQ4NDI2MTUwMTIxMDY1fSx7eDo1LjkxNzY3NTU0NDc5NDE4ODQsIHk6MC4xMDA0ODQyNjE1MDEyMTA2NX0se3g6NS45ODU0NzIxNTQ5NjM2ODEsIHk6MC4wOTkyNzM2MDc3NDgxODQwMX0se3g6NS45OTYzNjgwMzg3NDA5MiwgeTowLjA5NDQzMDk5MjczNjA3NzQ4fSx7eDo2LjAwMTIxMDY1Mzc1MzAyNiwgeTowLjA4NTk1NjQxNjQ2NDg5MTA0fSx7eDo2LjAwMzYzMTk2MTI1OTA4LCB5OjAuMDY5MDA3MjYzOTIyNTE4MTZ9LHt4OjYuMDAzNjMxOTYxMjU5MDgsIHk6MC4wNTU2OTAwNzI2MzkyMjUxOH0se3g6Ni4wMDI0MjEzMDc1MDYwNTM1LCB5OjAuMDM3NTMwMjY2MzQzODI1Njd9LHt4OjYuMDA3MjYzOTIyNTE4MTYsIHk6MC4wMzAyNjYzNDM4MjU2NjU4Nn0se3g6Ni4wMTIxMDY1Mzc1MzAyNjcsIHk6MC4wMjE3OTE3Njc1NTQ0Nzk0MTd9LHt4OjYuMDI5MDU1NjkwMDcyNjM5NSwgeTowLjAyMDU4MTExMzgwMTQ1Mjc4NH0se3g6Ni4yMDU4MTExMzgwMTQ1Mjc2LCB5OjAuMDI0MjEzMDc1MDYwNTMyNjg3fSx7eDo2LjIxOTEyODMyOTI5NzgyMSwgeTowLjAyOTA1NTY5MDA3MjYzOTIyN30se3g6Ni4yMjYzOTIyNTE4MTU5OCwgeTowLjA0MzU4MzUzNTEwODk1ODgzNX0se3g6Ni4yMzAwMjQyMTMwNzUwNjEsIHk6MC4xMjM0ODY2ODI4MDg3MTY3fSx7eDo2LjIyNjM5MjI1MTgxNTk4LCB5OjAuMjk2NjEwMTY5NDkxNTI1NH0se3g6Ni4yMzI0NDU1MjA1ODExMTQsIHk6MC4zMDk5MjczNjA3NzQ4MTg0fSx7eDo2LjI0MzM0MTQwNDM1ODM1NCwgeTowLjMxODQwMTkzNzA0NjAwNDgzfSx7eDo2LjI1NDIzNzI4ODEzNTU5MywgeTowLjMxODQwMTkzNzA0NjAwNDgzfSx7eDo2LjI2ODc2NTEzMzE3MTkxMywgeTowLjMxOTYxMjU5MDc5OTAzMTV9LHt4OjYuMjc4NDUwMzYzMTk2MTI2LCB5OjAuMzI1NjY1ODU5NTY0MTY0NjZ9LHt4OjYuMjgzMjkyOTc4MjA4MjMyLCB5OjAuMzQyNjE1MDEyMTA2NTM3NTV9LHt4OjYuMjg0NTAzNjMxOTYxMjU5LCB5OjAuMzc0MDkyMDA5Njg1MjMwMDR9LHt4OjYuMjgzMjkyOTc4MjA4MjMyLCB5OjAuMzk3MDk0NDMwOTkyNzM2MDZ9LHt4OjYuMjkxNzY3NTU0NDc5NDE5LCB5OjAuNDEyODMyOTI5NzgyMDgyM30se3g6Ni4zMDYyOTUzOTk1MTU3MzgsIHk6MC40MTY0NjQ4OTEwNDExNjIyNH0se3g6Ni4zMTcxOTEyODMyOTI5NzksIHk6MC40MTY0NjQ4OTEwNDExNjIyNH0se3g6Ni4zMjU2NjU4NTk1NjQxNjUsIHk6MC40MTg4ODYxOTg1NDcyMTU1fSx7eDo2LjMzMDUwODQ3NDU3NjI3MSwgeTowLjQxMTYyMjI3NjAyOTA1NTd9LHt4OjYuMzM0MTQwNDM1ODM1MzUxNSwgeTowLjQxNzY3NTU0NDc5NDE4ODg0fSx7eDo2LjMzODk4MzA1MDg0NzQ1OCwgeTowLjQxMTYyMjI3NjAyOTA1NTd9LHt4OjYuMzQyNjE1MDEyMTA2NTM3LCB5OjAuNDE3Njc1NTQ0Nzk0MTg4ODR9LHt4OjYuMzQ2MjQ2OTczMzY1NjE3LCB5OjAuNDEyODMyOTI5NzgyMDgyM30se3g6Ni4zNTIzMDAyNDIxMzA3NTEsIHk6MC40MTY0NjQ4OTEwNDExNjIyNH0se3g6Ni4zNTU5MzIyMDMzODk4MzA0LCB5OjAuNDEwNDExNjIyMjc2MDI5MDZ9LHt4OjYuMzU3MTQyODU3MTQyODU3LCB5OjAuNDE4ODg2MTk4NTQ3MjE1NX0se3g6Ni4zNjE5ODU0NzIxNTQ5NjQsIHk6MC40MTI4MzI5Mjk3ODIwODIzfSx7eDo2LjM2OTI0OTM5NDY3MzEyMzUsIHk6MC40MjI1MTgxNTk4MDYyOTU0fSx7eDo2LjM3NDA5MjAwOTY4NTIzLCB5OjAuNDE1MjU0MjM3Mjg4MTM1Nn0se3g6Ni4zOTEwNDExNjIyMjc2MDMsIHk6MC40MTg4ODYxOTg1NDcyMTU1fSx7eDo2LjU2Mjk1Mzk5NTE1NzM4NSwgeTowLjQxODg4NjE5ODU0NzIxNTV9LHt4OjYuNTc5OTAzMTQ3Njk5NzU4LCB5OjAuNDE0MDQzNTgzNTM1MTA4OTV9LHt4OjYuNTg1OTU2NDE2NDY0ODkxLCB5OjAuNDIyNTE4MTU5ODA2Mjk1NH0se3g6Ni41OTA3OTkwMzE0NzY5OTc1LCB5OjAuNDExNjIyMjc2MDI5MDU1N30se3g6Ni41OTQ0MzA5OTI3MzYwNzcsIHk6MC40MTg4ODYxOTg1NDcyMTU1fSx7eDo2LjU5ODA2Mjk1Mzk5NTE1NywgeTowLjQxMTYyMjI3NjAyOTA1NTd9LHt4OjYuNjAyOTA1NTY5MDA3MjY0LCB5OjAuNDE2NDY0ODkxMDQxMTYyMjR9LHt4OjYuNjA3NzQ4MTg0MDE5MzcsIHk6MC40MTI4MzI5Mjk3ODIwODIzfSx7eDo2LjYxMTM4MDE0NTI3ODQ1LCB5OjAuNDE4ODg2MTk4NTQ3MjE1NX0se3g6Ni42MTYyMjI3NjAyOTA1NTcsIHk6MC40MTE2MjIyNzYwMjkwNTU3fSx7eDo2LjYyMTA2NTM3NTMwMjY2MywgeTowLjQyMDA5Njg1MjMwMDI0MjEzfSx7eDo2LjYyMzQ4NjY4MjgwODcxNywgeTowLjQxNTI1NDIzNzI4ODEzNTZ9LHt4OjYuNjQyODU3MTQyODU3MTQzLCB5OjAuNDE3Njc1NTQ0Nzk0MTg4ODR9LHt4OjYuNjYyMjI3NjAyOTA1NTY5LCB5OjAuNDIwMDk2ODUyMzAwMjQyMTN9LHt4OjYuNjc0MzM0MTQwNDM1ODM1LCB5OjAuNDIyNTE4MTU5ODA2Mjk1NH0se3g6Ni42ODI4MDg3MTY3MDcwMjEsIHk6MC40Mjk3ODIwODIzMjQ0NTUyfSx7eDo2LjY5MDA3MjYzOTIyNTE4MiwgeTowLjQ0OTE1MjU0MjM3Mjg4MTR9LHt4OjYuNjg3NjUxMzMxNzE5MTI4LCB5OjAuNTAxMjEwNjUzNzUzMDI2Nn0se3g6Ni42ODY0NDA2Nzc5NjYxMDIsIHk6MC41NTgxMTEzODAxNDUyNzg1fSx7eDo2LjY4NjQ0MDY3Nzk2NjEwMiwgeTowLjU3Mzg0OTg3ODkzNDYyNDd9LHt4OjYuNjg0MDE5MzcwNDYwMDQ5LCB5OjAuNTkyMDA5Njg1MjMwMDI0Mn0se3g6Ni42NDUyNzg0NTAzNjMxOTYsIHk6MC41OTgwNjI5NTM5OTUxNTc0fSx7eDo2LjYyOTUzOTk1MTU3Mzg1LCB5OjAuNjAwNDg0MjYxNTAxMjEwN30se3g6Ni42MjEwNjUzNzUzMDI2NjMsIHk6MC42MDA0ODQyNjE1MDEyMTA3fSx7eDo2LjYxMjU5MDc5OTAzMTQ3NywgeTowLjYwODk1ODgzNzc3MjM5NzF9LHt4OjYuNjA3NzQ4MTg0MDE5MzcsIHk6MC42MjM0ODY2ODI4MDg3MTY3fSx7eDo2LjYwNjUzNzUzMDI2NjM0NCwgeTowLjY0NzY5OTc1Nzg2OTI0OTR9LHt4OjYuNjA0MTE2MjIyNzYwMjkwNSwgeTowLjY3NDMzNDE0MDQzNTgzNTR9LHt4OjYuNjA1MzI2ODc2NTEzMzE3LCB5OjAuNjkyNDkzOTQ2NzMxMjM0OX0se3g6Ni42MDUzMjY4NzY1MTMzMTcsIHk6MC43MDgyMzI0NDU1MjA1ODExfSx7eDo2LjU5OTI3MzYwNzc0ODE4NCwgeTowLjcxNzkxNzY3NTU0NDc5NDJ9LHt4OjYuNTg5NTg4Mzc3NzIzOTcxLCB5OjAuNzE3OTE3Njc1NTQ0Nzk0Mn0se3g6Ni41NzAyMTc5MTc2NzU1NDUsIHk6MC43MTkxMjgzMjkyOTc4MjA4fSx7eDo2LjU0NzIxNTQ5NjM2ODAzOSwgeTowLjcyMDMzODk4MzA1MDg0NzR9LHt4OjYuNTIzMDAyNDIxMzA3NTA2LCB5OjAuNzE3OTE3Njc1NTQ0Nzk0Mn0se3g6Ni41MTY5NDkxNTI1NDIzNzMsIHk6MC43MTE4NjQ0MDY3Nzk2NjF9LHt4OjYuNTEyMTA2NTM3NTMwMjY3LCB5OjAuNjk5NzU3ODY5MjQ5Mzk0Nn0se3g6Ni41MDk2ODUyMzAwMjQyMTMsIHk6MC42NzU1NDQ3OTQxODg4NjE5fSx7eDo2LjUwOTY4NTIzMDAyNDIxMywgeTowLjY1Mzc1MzAyNjYzNDM4MjZ9KVxuICBuZXcgQXJyYXkoe3g6NS4xNDAyODc3Njk3ODQxNzIsIHk6MC4yMjc4MTc3NDU4MDMzNTczfSx7eDo1LjEzOTA4ODcyOTAxNjc4NywgeTowLjIwNjIzNTAxMTk5MDQwNzY3fSx7eDo1LjEzOTA4ODcyOTAxNjc4NywgeTowLjE4ODI0OTQwMDQ3OTYxNjN9LHt4OjUuMTM2NjkwNjQ3NDgyMDE0LCB5OjAuMTY0MjY4NTg1MTMxODk0NX0se3g6NS4xMzY2OTA2NDc0ODIwMTQsIHk6MC4xNDc0ODIwMTQzODg0ODkyfSx7eDo1LjEzNzg4OTY4ODI0OTQsIHk6MC4xMjk0OTY0MDI4Nzc2OTc4NH0se3g6NS4xNDAyODc3Njk3ODQxNzIsIHk6MC4xMTc1MDU5OTUyMDM4MzY5NH0se3g6NS4xNDI2ODU4NTEzMTg5NDQsIHk6MC4xMTAzMTE3NTA1OTk1MjAzOH0se3g6NS4xNDk4ODAwOTU5MjMyNjIsIHk6MC4xMDQzMTY1NDY3NjI1ODk5M30se3g6NS4xNjE4NzA1MDM1OTcxMjMsIHk6MC4wOTk1MjAzODM2OTMwNDU1N30se3g6NS4xOTkwNDA3NjczODYwOTEsIHk6MC4wOTU5MjMyNjEzOTA4ODcyOX0se3g6NS45ODA4MTUzNDc3MjE4MjMsIHk6MC4wOTk1MjAzODM2OTMwNDU1N30se3g6NS45OTUyMDM4MzY5MzA0NTYsIHk6MC4wOTM1MjUxNzk4NTYxMTUxMX0se3g6NS45OTg4MDA5NTkyMzI2MTM1LCB5OjAuMDg3NTI5OTc2MDE5MTg0NjV9LHt4OjYuMDAxMTk5MDQwNzY3Mzg2NSwgeTowLjA3NTUzOTU2ODM0NTMyMzc0fSx7eDo2LjAwMTE5OTA0MDc2NzM4NjUsIHk6MC4wNjExNTEwNzkxMzY2OTA2NX0se3g6Ni4wMDIzOTgwODE1MzQ3NzIsIHk6MC4wNDMxNjU0Njc2MjU4OTkyOH0se3g6Ni4wMDIzOTgwODE1MzQ3NzIsIHk6MC4wMzcxNzAyNjM3ODg5Njg4Mn0se3g6Ni4wMDQ3OTYxNjMwNjk1NDQsIHk6MC4wMzIzNzQxMDA3MTk0MjQ0Nn0se3g6Ni4wMDk1OTIzMjYxMzkwODksIHk6MC4wMjYzNzg4OTY4ODI0OTQwMDR9LHt4OjYuMDE3OTg1NjExNTEwNzkyLCB5OjAuMDIxNTgyNzMzODEyOTQ5NjR9LHt4OjYuMDMzNTczMTQxNDg2ODEsIHk6MC4wMTkxODQ2NTIyNzgxNzc0NTd9LHt4OjYuMTk5MDQwNzY3Mzg2MDkxLCB5OjAuMDIxNTgyNzMzODEyOTQ5NjR9LHt4OjYuMjEzNDI5MjU2NTk0NzI0LCB5OjAuMDI2Mzc4ODk2ODgyNDk0MDA0fSx7eDo2LjIyNTQxOTY2NDI2ODU4NTUsIHk6MC4wMzgzNjkzMDQ1NTYzNTQ5MX0se3g6Ni4yMzAyMTU4MjczMzgxMywgeTowLjA1NTE1NTg3NTI5OTc2MDE5fSx7eDo2LjIzMjYxMzkwODg3MjkwMiwgeTowLjIyMzAyMTU4MjczMzgxMjk1fSx7eDo2LjIzMTQxNDg2ODEwNTUxNTUsIHk6MC4yMzUwMTE5OTA0MDc2NzM4N30se3g6Ni4yMzI2MTM5MDg4NzI5MDIsIHk6MC4yNDIyMDYyMzUwMTE5OTA0fSx7eDo2LjIzOTgwODE1MzQ3NzIxODUsIHk6MC4yNDgyMDE0Mzg4NDg5MjA4N30se3g6Ni4yNTI5OTc2MDE5MTg0NjUsIHk6MC4yNTI5OTc2MDE5MTg0NjUyfSx7eDo2LjI2NDk4ODAwOTU5MjMyNiwgeTowLjI1Mjk5NzYwMTkxODQ2NTJ9LHt4OjYuMjc1Nzc5Mzc2NDk4ODAxLCB5OjAuMjU1Mzk1NjgzNDUzMjM3NDN9LHt4OjYuMjgyOTczNjIxMTAzMTE3NSwgeTowLjI2NDk4ODAwOTU5MjMyNjE2fSx7eDo2LjI4Nzc2OTc4NDE3MjY2MiwgeTowLjI4MDU3NTUzOTU2ODM0NTN9LHt4OjYuMjg2NTcwNzQzNDA1Mjc2LCB5OjAuMzMyMTM0MjkyNTY1OTQ3MjN9LHt4OjYuMjkyNTY1OTQ3MjQyMjA2LCB5OjAuMzQ1MzIzNzQxMDA3MTk0MjZ9LHt4OjYuMzA5MzUyNTE3OTg1NjExLCB5OjAuMzUwMTE5OTA0MDc2NzM4Nn0se3g6Ni4zMjAxNDM4ODQ4OTIwODcsIHk6MC4zNDY1MjI3ODE3NzQ1ODAzNX0se3g6Ni4zMjYxMzkwODg3MjkwMTY1LCB5OjAuMzUxMzE4OTQ0ODQ0MTI0N30se3g6Ni4zMzMzMzMzMzMzMzMzMzMsIHk6MC4zNDQxMjQ3MDAyMzk4MDgyfSx7eDo2LjMzNTczMTQxNDg2ODEwNSwgeTowLjM1MDExOTkwNDA3NjczODZ9LHt4OjYuMzQxNzI2NjE4NzA1MDM2LCB5OjAuMzQ1MzIzNzQxMDA3MTk0MjZ9LHt4OjYuMzQ2NTIyNzgxNzc0NTgsIHk6MC4zNTEzMTg5NDQ4NDQxMjQ3fSx7eDo2LjM1MjUxNzk4NTYxMTUxLCB5OjAuMzQwNTI3NTc3OTM3NjQ5OX0se3g6Ni4zNTYxMTUxMDc5MTM2NjksIHk6MC4zNTAxMTk5MDQwNzY3Mzg2fSx7eDo2LjM2MzMwOTM1MjUxNzk4NiwgeTowLjM0MDUyNzU3NzkzNzY0OTl9LHt4OjYuMzY4MTA1NTE1NTg3NTMsIHk6MC4zNDc3MjE4MjI1NDE5NjY0M30se3g6Ni4zNzQxMDA3MTk0MjQ0NjEsIHk6MC4zMzkzMjg1MzcxNzAyNjM4fSx7eDo2LjM4NDg5MjA4NjMzMDkzNSwgeTowLjM0ODkyMDg2MzMwOTM1MjV9LHt4OjYuNTY0NzQ4MjAxNDM4ODQ4NSwgeTowLjM0ODkyMDg2MzMwOTM1MjV9LHt4OjYuNTgwMzM1NzMxNDE0ODY4LCB5OjAuMzQ0MTI0NzAwMjM5ODA4Mn0se3g6Ni41ODc1Mjk5NzYwMTkxODQ2LCB5OjAuMzUxMzE4OTQ0ODQ0MTI0N30se3g6Ni41OTIzMjYxMzkwODg3MjksIHk6MC4zNDE3MjY2MTg3MDUwMzU5Nn0se3g6Ni41OTgzMjEzNDI5MjU2NiwgeTowLjM0ODkyMDg2MzMwOTM1MjV9LHt4OjYuNjEwMzExNzUwNTk5NTIxLCB5OjAuMzQwNTI3NTc3OTM3NjQ5OX0se3g6Ni42MTUxMDc5MTM2NjkwNjUsIHk6MC4zNDUzMjM3NDEwMDcxOTQyNn0se3g6Ni42MjQ3MDAyMzk4MDgxNTQsIHk6MC4zNDE3MjY2MTg3MDUwMzU5Nn0se3g6Ni42MzMwOTM1MjUxNzk4NTYsIHk6MC4zNTEzMTg5NDQ4NDQxMjQ3fSx7eDo2LjY3MDI2Mzc4ODk2ODgyNSwgeTowLjM1MzcxNzAyNjM3ODg5Njl9LHt4OjYuNjg0NjUyMjc4MTc3NDU4LCB5OjAuMzYwOTExMjcwOTgzMjEzNH0se3g6Ni42ODk0NDg0NDEyNDcwMDIsIHk6MC4zODAwOTU5MjMyNjEzOTA5fSx7eDo2LjY4NzA1MDM1OTcxMjIzLCB5OjAuNDMxNjU0Njc2MjU4OTkyOH0se3g6Ni42ODcwNTAzNTk3MTIyMywgeTowLjQ3NzIxODIyNTQxOTY2NDI0fSx7eDo2LjY4OTQ0ODQ0MTI0NzAwMiwgeTowLjUxNTU4NzUyOTk3NjAxOTJ9LHt4OjYuNjg0NjUyMjc4MTc3NDU4LCB5OjAuNTI2Mzc4ODk2ODgyNDk0fSx7eDo2LjY0NTA4MzkzMjg1MzcxNzUsIHk6MC41Mjg3NzY5Nzg0MTcyNjYyfSx7eDo2LjYzMDY5NTQ0MzY0NTA4NCwgeTowLjUyODc3Njk3ODQxNzI2NjJ9LHt4OjYuNjIxMTAzMTE3NTA1OTk1LCB5OjAuNTMxMTc1MDU5OTUyMDM4NH0se3g6Ni42MTM5MDg4NzI5MDE2NzgsIHk6MC41MzU5NzEyMjMwMjE1ODI3fSx7eDo2LjYwNjcxNDYyODI5NzM2MiwgeTowLjU0Njc2MjU4OTkyODA1NzZ9LHt4OjYuNjA0MzE2NTQ2NzYyNTksIHk6MC41NjIzNTAxMTk5MDQwNzY3fSx7eDo2LjYwNDMxNjU0Njc2MjU5LCB5OjAuNTg5OTI4MDU3NTUzOTU2OH0se3g6Ni42MDQzMTY1NDY3NjI1OSwgeTowLjYxNzUwNTk5NTIwMzgzN30se3g6Ni42MDY3MTQ2MjgyOTczNjIsIHk6MC42MzY2OTA2NDc0ODIwMTQ0fSx7eDo2LjYwMTkxODQ2NTIyNzgxOCwgeTowLjY0NjI4Mjk3MzYyMTEwMzF9LHt4OjYuNTkyMzI2MTM5MDg4NzI5LCB5OjAuNjUxMDc5MTM2NjkwNjQ3NH0se3g6Ni41NjgzNDUzMjM3NDEwMDcsIHk6MC42NTEwNzkxMzY2OTA2NDc0fSx7eDo2LjU0MzE2NTQ2NzYyNTg5OSwgeTowLjY0ODY4MTA1NTE1NTg3NTN9LHt4OjYuNTI3NTc3OTM3NjQ5ODgsIHk6MC42NDI2ODU4NTEzMTg5NDQ4fSx7eDo2LjUxNjc4NjU3MDc0MzQwNSwgeTowLjYyNTg5OTI4MDU3NTUzOTZ9LHt4OjYuNTE0Mzg4NDg5MjA4NjMzLCB5OjAuNTk0NzI0MjIwNjIzNTAxMn0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMzQ3NTU5MzIyMDMzODk4MywgeTozLjAyNDgzODk4MzA1MDg0Nzh9LHt4OjAuMzMwNjEwMTY5NDkxNTI1NCwgeTozLjA0Njg3Mjg4MTM1NTkzMjN9LHt4OjAuMzA1MTg2NDQwNjc3OTY2MSwgeTozLjAyOTkyMzcyODgxMzU1OTR9LHt4OjAuMzA0MzM4OTgzMDUwODQ3NDQsIHk6Mi45OTk0MTUyNTQyMzcyODg1fSx7eDowLjMwNjg4MTM1NTkzMjIwMzQsIHk6Mi45NjA0MzIyMDMzODk4MzA3fSx7eDowLjMyOTc2MjcxMTg2NDQwNjc1LCB5OjIuOTM1MDA4NDc0NTc2MjcxNX0se3g6MC4zNTk0MjM3Mjg4MTM1NTkzMywgeToyLjk0MjYzNTU5MzIyMDMzOX0se3g6MC4zODE0NTc2MjcxMTg2NDQwNiwgeToyLjk2MTI3OTY2MTAxNjk0OTR9LHt4OjAuMzcyMTM1NTkzMjIwMzM4OTYsIHk6Mi45NzY1MzM4OTgzMDUwODV9LHt4OjAuMzQ1MDE2OTQ5MTUyNTQyNCwgeToyLjk4MzMxMzU1OTMyMjAzNH0se3g6MC4zNDA3Nzk2NjEwMTY5NDkxLCB5OjMuMDAwMjYyNzExODY0NDA2N30se3g6MC4zNzA0NDA2Nzc5NjYxMDE3LCB5OjMuMDE1NTE2OTQ5MTUyNTQyNn0se3g6MC4zNzgwNjc3OTY2MTAxNjk1LCB5OjMuMDQwOTQwNjc3OTY2MTAyfSx7eDowLjM0OTI1NDIzNzI4ODEzNTYsIHk6My4wNTE5NTc2MjcxMTg2NDQ0fSksIFxuICBuZXcgQXJyYXkoe3g6MC4zNzg5MTUyNTQyMzcyODgxLCB5OjIuOTM5MjQ1NzYyNzExODY0NH0se3g6MC4zODIzMDUwODQ3NDU3NjI3LCB5OjIuOTYyOTc0NTc2MjcxMTg2OH0se3g6MC4zNjExMTg2NDQwNjc3OTY2LCB5OjIuOTczMTQ0MDY3Nzk2NjEwNn0se3g6MC4zMjU1MjU0MjM3Mjg4MTM1NSwgeToyLjk4NDE2MTAxNjk0OTE1MjZ9LHt4OjAuMzA4NTc2MjcxMTg2NDQwNjUsIHk6My4wMDI4MDUwODQ3NDU3NjN9LHt4OjAuMzMyMzA1MDg0NzQ1NzYyNywgeTozLjAxMzgyMjAzMzg5ODMwNTN9LHt4OjAuMzY2MjAzMzg5ODMwNTA4NSwgeTozLjAyMzE0NDA2Nzc5NjYxMDR9LHt4OjAuMzgwNjEwMTY5NDkxNTI1NDMsIHk6My4wNDUxNzc5NjYxMDE2OTV9LHt4OjAuMzUyNjQ0MDY3Nzk2NjEwMTcsIHk6My4wNTk1ODQ3NDU3NjI3MTJ9LHt4OjAuMzA5NDIzNzI4ODEzNTU5MywgeTozLjA0ODU2Nzc5NjYxMDE2OTZ9LHt4OjAuMzE1MzU1OTMyMjAzMzg5OCwgeTozLjAxNjM2NDQwNjc3OTY2MTN9LHt4OjAuMzM4MjM3Mjg4MTM1NTkzMjMsIHk6Mi45OTUxNzc5NjYxMDE2OTV9LHt4OjAuMzY2MjAzMzg5ODMwNTA4NSwgeToyLjk4ODM5ODMwNTA4NDc0Nn0se3g6MC4zNTI2NDQwNjc3OTY2MTAxNywgeToyLjk2NDY2OTQ5MTUyNTQyMzd9LHt4OjAuMzE3MDUwODQ3NDU3NjI3MSwgeToyLjk0ODU2Nzc5NjYxMDE2OTV9LHt4OjAuMzM2NTQyMzcyODgxMzU1OSwgeToyLjkzNDE2MTAxNjk0OTE1Mjh9LHt4OjAuMzY1MzU1OTMyMjAzMzg5OCwgeToyLjkzOTI0NTc2MjcxMTg2NDR9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTlTID0gbmV3IEFycmF5KFxuICAvL25ldyBBcnJheSh7eDo2LjUxMDkxNzAzMDU2NzY4NSwgeTowLjY3Njg1NTg5NTE5NjUwNjZ9LHt4OjYuNDk5MjcyMTk3OTYyMTU1LCB5OjAuNjYyMjk5ODU0NDM5NTkyNH0se3g6Ni40OTA1Mzg1NzM1MDgwMDU0LCB5OjAuNjUyMTEwNjI1OTA5NzUyNn0se3g6Ni40OTA1Mzg1NzM1MDgwMDU0LCB5OjAuNjIxNTQyOTQwMzIwMjMyOX0se3g6Ni41MDY1NTAyMTgzNDA2MTEsIHk6MC42MjAwODczMzYyNDQ1NDE1fSx7eDo2LjUxODE5NTA1MDk0NjE0MywgeTowLjYyNTkwOTc1MjU0NzMwNzJ9LHt4OjYuNTE4MTk1MDUwOTQ2MTQzLCB5OjAuNjUwNjU1MDIxODM0MDYxMX0se3g6Ni41MDIxODM0MDYxMTM1MzcsIHk6MC42NTkzODg2NDYyODgyMDk2fSx7eDo2LjUxNTI4Mzg0Mjc5NDc1OTUsIHk6MC42NzY4NTU4OTUxOTY1MDY2fSx7eDo2LjUxMjM3MjYzNDY0MzM3NywgeTowLjYyMTU0Mjk0MDMyMDIzMjl9LHt4OjYuNTA1MDk0NjE0MjY0OTE5NSwgeTowLjYwNTUzMTI5NTQ4NzYyNzR9KVxuICBuZXcgQXJyYXkoe3g6Ni40OTU3MjY0OTU3MjY0OTYsIHk6MC41OTcwNjk1OTcwNjk1OTcxfSx7eDo2LjQ3NzQxMTQ3NzQxMTQ3NzUsIHk6MC41Nzk5NzU1Nzk5NzU1OH0se3g6Ni40NzAwODU0NzAwODU0NywgeTowLjU1MzExMzU1MzExMzU1MzF9LHt4OjYuNDY4ODY0NDY4ODY0NDY5LCB5OjAuNTIyNTg4NTIyNTg4NTIyNn0se3g6Ni40NzM3NDg0NzM3NDg0NzQsIHk6MC40ODU5NTg0ODU5NTg0ODU5NX0se3g6Ni40OTIwNjM0OTIwNjM0OTIsIHk6MC40NzEzMDY0NzEzMDY0NzEzfSx7eDo2LjUxODkyNTUxODkyNTUxOSwgeTowLjQ2NTIwMTQ2NTIwMTQ2NTJ9LHt4OjYuNTQzMzQ1NTQzMzQ1NTQzLCB5OjAuNDcyNTI3NDcyNTI3NDcyNX0se3g6Ni41NTU1NTU1NTU1NTU1NTUsIHk6MC41MDQyNzM1MDQyNzM1MDQzfSx7eDo2LjU1MzExMzU1MzExMzU1MywgeTowLjU1MTg5MjU1MTg5MjU1MTl9LHt4OjYuNTQ1Nzg3NTQ1Nzg3NTQ2LCB5OjAuNTgzNjM4NTgzNjM4NTgzN30se3g6Ni41MDY3MTU1MDY3MTU1MDcsIHk6MC41Nzg3NTQ1Nzg3NTQ1Nzg4fSx7eDo2LjUwNjcxNTUwNjcxNTUwNywgeTowLjU0NzAwODU0NzAwODU0NzF9LHt4OjYuNTMyMzU2NTMyMzU2NTMyLCB5OjAuNTIyNTg4NTIyNTg4NTIyNn0se3g6Ni41MjYyNTE1MjYyNTE1MjYsIHk6MC40ODEwNzQ0ODEwNzQ0ODExfSx7eDo2LjQ4NzE3OTQ4NzE3OTQ4NywgeTowLjQ3NzQxMTQ3NzQxMTQ3NzQ0fSx7eDo2LjQ3MTMwNjQ3MTMwNjQ3MSwgeTowLjQ5Njk0NzQ5Njk0NzQ5Njk2fSx7eDo2LjUwNDI3MzUwNDI3MzUwNCwgeTowLjQ5OTM4OTQ5OTM4OTQ5OTR9LHt4OjYuNTM3MjQwNTM3MjQwNTM3LCB5OjAuNTI4NjkzNTI4NjkzNTI4N30se3g6Ni41MTUyNjI1MTUyNjI1MTUsIHk6MC41NDcwMDg1NDcwMDg1NDcxfSx7eDo2LjQ3NzQxMTQ3NzQxMTQ3NzUsIHk6MC41NTMxMTM1NTMxMTM1NTMxfSx7eDo2LjQ3NDk2OTQ3NDk2OTQ3NSwgeTowLjU4NDg1OTU4NDg1OTU4NDl9LHt4OjYuNTE2NDgzNTE2NDgzNTE2LCB5OjAuNTc4NzU0NTc4NzU0NTc4OH0se3g6Ni41NTA2NzE1NTA2NzE1NTA1LCB5OjAuNTgzNjM4NTgzNjM4NTgzN30se3g6Ni41MjUwMzA1MjUwMzA1MjUsIHk6MC42MDQzOTU2MDQzOTU2MDQ0fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIwID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4wODU1MDg0NzQ1NzYyNzEyLCB5OjIuODg5ODMwNTA4NDc0NTc2fSx7eDowLjA4Mjk2NjEwMTY5NDkxNTI1LCB5OjIuOTA2Nzc5NjYxMDE2OTQ5fSx7eDowLjA4NDY2MTAxNjk0OTE1MjUxLCB5OjIuOTE2OTQ5MTUyNTQyMzcyN30se3g6MC4wODU1MDg0NzQ1NzYyNzEyLCB5OjIuOTM4OTgzMDUwODQ3NDU3N30se3g6MC4wODM4MTM1NTkzMjIwMzM4OCwgeToyLjk2MzU1OTMyMjAzMzg5ODN9LHt4OjAuMDc3ODgxMzU1OTMyMjAzMzYsIHk6Mi45NzAzMzg5ODMwNTA4NDczfSx7eDowLjA4NTUwODQ3NDU3NjI3MTIsIHk6Mi45NzQ1NzYyNzExODY0NDA3fSx7eDowLjA4MTI3MTE4NjQ0MDY3NzkzLCB5OjIuOTc3OTY2MTAxNjk0OTE1fSx7eDowLjA4NDY2MTAxNjk0OTE1MjUxLCB5OjIuOTgyMjAzMzg5ODMwNTA4NX0se3g6MC4wNzk1NzYyNzExODY0NDA2NywgeToyLjk4NTU5MzIyMDMzODk4MzJ9LHt4OjAuMDg0NjYxMDE2OTQ5MTUyNTEsIHk6Mi45ODk4MzA1MDg0NzQ1NzZ9LHt4OjAuMDgwNDIzNzI4ODEzNTU5MywgeToyLjk5NTc2MjcxMTg2NDQwNjZ9LHt4OjAuMDg2MzU1OTMyMjAzMzg5ODMsIHk6Mi45OTkxNTI1NDIzNzI4ODEzfSx7eDowLjA3ODcyODgxMzU1OTMyMjA0LCB5OjMuMDA1MDg0NzQ1NzYyNzExN30se3g6MC4wODU1MDg0NzQ1NzYyNzEyLCB5OjMuMDA4NDc0NTc2MjcxMTg2NH0se3g6MC4wODA0MjM3Mjg4MTM1NTkzLCB5OjMuMDEyNzExODY0NDA2Nzh9LHt4OjAuMDgyOTY2MTAxNjk0OTE1MjUsIHk6My4wMjM3Mjg4MTM1NTkzMjJ9LHt4OjAuMDgyOTY2MTAxNjk0OTE1MjUsIHk6My4wMzcyODgxMzU1OTMyMjA0fSx7eDowLjA4MTI3MTE4NjQ0MDY3NzkzLCB5OjMuMDY2MTAxNjk0OTE1MjU0NH0se3g6MC4wODEyNzExODY0NDA2Nzc5MywgeTozLjA5NDA2Nzc5NjYxMDE2OTN9LHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeTozLjExMjcxMTg2NDQwNjc3OTV9LHt4OjAuMDkxNDQwNjc3OTY2MTAxNjcsIHk6My4xMjIwMzM4OTgzMDUwODQ2fSx7eDowLjEwNTg0NzQ1NzYyNzExODYxLCB5OjMuMTI2MjcxMTg2NDQwNjc4fSx7eDowLjEyMzY0NDA2Nzc5NjYxMDE0LCB5OjMuMTI3OTY2MTAxNjk0OTE1NH0se3g6MC4xMzI5NjYxMDE2OTQ5MTUyNCwgeTozLjE0MTUyNTQyMzcyODgxMzV9LHt4OjAuMTMzODEzNTU5MzIyMDMzODcsIHk6My4xOTMyMjAzMzg5ODMwNTA3fSx7eDowLjEzNzIwMzM4OTgzMDUwODQ1LCB5OjMuMjA4NDc0NTc2MjcxMTg2Nn0se3g6MC4xNDU2Nzc5NjYxMDE2OTQ5MiwgeTozLjIxMzU1OTMyMjAzMzg5ODN9LHt4OjAuMTU2Njk0OTE1MjU0MjM3MywgeTozLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuMTY5NDA2Nzc5NjYxMDE2OTIsIHk6My4yMTE4NjQ0MDY3Nzk2NjF9LHt4OjAuMTc2MTg2NDQwNjc3OTY2MDcsIHk6My4yMTc3OTY2MTAxNjk0OTE3fSx7eDowLjE4MTI3MTE4NjQ0MDY3Nzk3LCB5OjMuMjA4NDc0NTc2MjcxMTg2Nn0se3g6MC4xODk3NDU3NjI3MTE4NjQzOSwgeTozLjIxNzc5NjYxMDE2OTQ5MTd9LHt4OjAuMTkxNDQwNjc3OTY2MTAxNywgeTozLjIxMTAxNjk0OTE1MjU0Mn0se3g6MC4xOTgyMjAzMzg5ODMwNTA4NiwgeTozLjIxNjEwMTY5NDkxNTI1NDN9LHt4OjAuMjAzMzA1MDg0NzQ1NzYyNywgeTozLjIwODQ3NDU3NjI3MTE4NjZ9LHt4OjAuMjA4Mzg5ODMwNTA4NDc0NiwgeTozLjIxNjk0OTE1MjU0MjM3M30se3g6MC4yMTI2MjcxMTg2NDQwNjc4LCB5OjMuMjExMDE2OTQ5MTUyNTQyfSx7eDowLjIyMTk0OTE1MjU0MjM3Mjg1LCB5OjMuMjE2MTAxNjk0OTE1MjU0M30se3g6MC4yNjg1NTkzMjIwMzM4OTgzLCB5OjMuMjE2MTAxNjk0OTE1MjU0M30se3g6MC4zNzUzMzg5ODMwNTA4NDc0LCB5OjMuMjE1MjU0MjM3Mjg4MTM1Nn0se3g6MC4zODcyMDMzODk4MzA1MDg0NSwgeTozLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuMzk0ODMwNTA4NDc0NTc2MywgeTozLjIxMjcxMTg2NDQwNjc3OTZ9LHt4OjAuNDA1ODQ3NDU3NjI3MTE4NjYsIHk6My4yMjAzMzg5ODMwNTA4NDczfSx7eDowLjQxMDA4NDc0NTc2MjcxMTg3LCB5OjMuMjA5MzIyMDMzODk4MzA1M30se3g6MC40MjAyNTQyMzcyODgxMzU1NSwgeTozLjIyMDMzODk4MzA1MDg0NzN9LHt4OjAuNDI3MDMzODk4MzA1MDg0NywgeTozLjIwOTMyMjAzMzg5ODMwNTN9LHt4OjAuNDMyOTY2MTAxNjk0OTE1MywgeTozLjIxNjk0OTE1MjU0MjM3M30se3g6MC40Mzg4OTgzMDUwODQ3NDU3NSwgeTozLjIxMDE2OTQ5MTUyNTQyMzV9LHt4OjAuNDQ5OTE1MjU0MjM3Mjg4MSwgeTozLjIxNjk0OTE1MjU0MjM3M30se3g6MC40NzExMDE2OTQ5MTUyNTQzLCB5OjMuMjE1MjU0MjM3Mjg4MTM1Nn0se3g6MC40ODYzNTU5MzIyMDMzODk4NSwgeTozLjIxNzc5NjYxMDE2OTQ5MTd9LHt4OjAuNDk0ODMwNTA4NDc0NTc2MjcsIHk6My4yMjIwMzM4OTgzMDUwODQ3fSx7eDowLjQ5OTkxNTI1NDIzNzI4ODE2LCB5OjMuMjM3Mjg4MTM1NTkzMjJ9LHt4OjAuNDk5OTE1MjU0MjM3Mjg4MTYsIHk6My4yNzQ1NzYyNzExODY0NDA2fSx7eDowLjQ5OTkxNTI1NDIzNzI4ODE2LCB5OjMuMzE1MjU0MjM3Mjg4MTM1N30se3g6MC40OTgyMjAzMzg5ODMwNTA4LCB5OjMuMzQ0OTE1MjU0MjM3Mjg4fSx7eDowLjQ5OTA2Nzc5NjYxMDE2OTUsIHk6My4zNjI3MTE4NjQ0MDY3Nzk1fSwge3g6MC41MDY2OTQ5MTUyNTQyMzczLCB5OjMuMzc1NDIzNzI4ODEzNTU5M30se3g6MC41MzIxMTg2NDQwNjc3OTY1LCB5OjMuMzc3OTY2MTAxNjk0OTE1NH0se3g6MC41NTU4NDc0NTc2MjcxMTg2LCB5OjMuMzc4ODEzNTU5MzIyMDM0fSx7eDowLjU2OTQwNjc3OTY2MTAxNjksIHk6My4zODM4OTgzMDUwODQ3NDU4fSx7eDowLjU3NjE4NjQ0MDY3Nzk2NjIsIHk6My4zOTQ5MTUyNTQyMzcyODgyfSx7eDowLjU3NjE4NjQ0MDY3Nzk2NjIsIHk6My40MTE4NjQ0MDY3Nzk2NjF9LHt4OjAuNTc2MTg2NDQwNjc3OTY2MiwgeTozLjQ2MjcxMTg2NDQwNjc3OTZ9LHt4OjAuNTc2MTg2NDQwNjc3OTY2MiwgeTozLjQ3NzExODY0NDA2Nzc5N30se3g6MC41ODIxMTg2NDQwNjc3OTY2LCB5OjMuNDgzMDUwODQ3NDU3NjI3fSx7eDowLjU4OTc0NTc2MjcxMTg2NDMsIHk6My40ODg5ODMwNTA4NDc0NTc1fSx7eDowLjYxODU1OTMyMjAzMzg5ODMsIHk6My40OTA2Nzc5NjYxMDE2OTV9LHt4OjAuNjUxNjEwMTY5NDkxNTI1NSwgeTozLjQ4ODk4MzA1MDg0NzQ1NzV9LHt4OjAuNjU3NTQyMzcyODgxMzU1OSwgeTozLjQ4MDUwODQ3NDU3NjI3MX0se3g6MC42NjAwODQ3NDU3NjI3MTE5LCB5OjMuNDY5NDkxNTI1NDIzNzI4Nn0se3g6MC42NTgzODk4MzA1MDg0NzQ1LCB5OjMuNDUwODQ3NDU3NjI3MTE5fSx7eDowLjY2ODU1OTMyMjAzMzg5ODMsIHk6My4zNzk2NjEwMTY5NDkxNTIzfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIwUyA9IG5ldyBBcnJheShcbiAgLy9uZXcgQXJyYXkoe3g6NS4xNDExOTM1OTUzNDIwNjcsIHk6MC4yMjU2MTg2MzE3MzIxNjg4NH0se3g6NS4xNDExOTM1OTUzNDIwNjcsIHk6MC4yMDk2MDY5ODY4OTk1NjMzfSx7eDo1LjEzODI4MjM4NzE5MDY4NCwgeTowLjE5MjEzOTczNzk5MTI2NjM4fSx7eDo1LjEzOTczNzk5MTI2NjM3NiwgeTowLjE2MDExNjQ0ODMyNjA1NTMyfSx7eDo1LjEzOTczNzk5MTI2NjM3NiwgeTowLjEzMTAwNDM2NjgxMjIyNzA3fSx7eDo1LjE0MjY0OTE5OTQxNzc1OCwgeTowLjExMjA4MTUxMzgyODIzODcyfSx7eDo1LjE1NTc0OTYzNjA5ODk4MSwgeTowLjEwMzM0Nzg4OTM3NDA5MDI0fSx7eDo1LjE4NjMxNzMyMTY4ODUwMSwgeTowLjEwMTg5MjI4NTI5ODM5ODgzfSx7eDo1LjUwNTA5NDYxNDI2NDkxOTUsIHk6MC4xMDE4OTIyODUyOTgzOTg4M30se3g6NS45Mzc0MDkwMjQ3NDUyNjk1LCB5OjAuMDk4OTgxMDc3MTQ3MDE2MDF9LHt4OjUuOTgyNTMyNzUxMDkxNzAzNSwgeTowLjEwMzM0Nzg4OTM3NDA5MDI0fSx7eDo1Ljk5NzA4ODc5MTg0ODYxNzUsIHk6MC4xMDA0MzY2ODEyMjI3MDc0Mn0se3g6Ni4wMDI5MTEyMDgxNTEzODI1LCB5OjAuMDg0NDI1MDM2MzkwMTAxODl9LHt4OjYuMDAyOTExMjA4MTUxMzgyNSwgeTowLjA1ODIyNDE2MzAyNzY1NjQ4fSx7eDo2LjAwNTgyMjQxNjMwMjc2NiwgeTowLjAzNjM5MDEwMTg5MjI4NTI5NX0se3g6Ni4wMTMxMDA0MzY2ODEyMjIsIHk6MC4wMjc2NTY0Nzc0MzgxMzY4Mjh9LHt4OjYuMDMwNTY3Njg1NTg5NTIsIHk6MC4wMjMyODk2NjUyMTEwNjI1OTJ9LHt4OjYuMTk3OTYyMTU0Mjk0MDMyLCB5OjAuMDI2MjAwODczMzYyNDQ1NDEzfSx7eDo2LjIxOTc5NjIxNTQyOTQwMywgeTowLjAzMzQ3ODg5Mzc0MDkwMjQ3NH0se3g6Ni4yMjg1Mjk4Mzk4ODM1NTIsIHk6MC4wNTM4NTczNTA4MDA1ODIyNDV9LHt4OjYuMjI1NjE4NjMxNzMyMTY5LCB5OjAuMjk2OTQzMjMxNDQxMDQ4MDZ9LHt4OjYuMjM3MjYzNDY0MzM3NywgeTowLjMxNzMyMTY4ODUwMDcyNzh9LHt4OjYuMjU0NzMwNzEzMjQ1OTk3LCB5OjAuMzE4Nzc3MjkyNTc2NDE5MjR9LHt4OjYuMjc4MDIwMzc4NDU3MDYsIHk6MC4zMjg5NjY1MjExMDYyNTkxfSx7eDo2LjI4MDkzMTU4NjYwODQ0MjUsIHk6MC4zNTY2MjI5OTg1NDQzOTU5NH0se3g6Ni4yODUyOTgzOTg4MzU1MTcsIHk6MC40MDQ2NTc5MzMwNDIyMTI1NH0se3g6Ni4zMDI3NjU2NDc3NDM4MTQsIHk6MC40MTQ4NDcxNjE1NzIwNTI0fSx7eDo2LjMxODc3NzI5MjU3NjQxOSwgeTowLjQxNjMwMjc2NTY0Nzc0Mzh9LHt4OjYuMzI3NTEwOTE3MDMwNTY4LCB5OjAuNDIwNjY5NTc3ODc0ODE4MDd9LHt4OjYuMzMzMzMzMzMzMzMzMzMzLCB5OjAuNDEzMzkxNTU3NDk2MzYxfSx7eDo2LjM0MjA2Njk1Nzc4NzQ4MiwgeTowLjQyMDY2OTU3Nzg3NDgxODA3fSx7eDo2LjM1MjI1NjE4NjMxNzMyMSwgeTowLjQxNjMwMjc2NTY0Nzc0Mzh9LHt4OjYuMzYwOTg5ODEwNzcxNDcsIHk6MC40MjM1ODA3ODYwMjYyMDA4Nn0se3g6Ni4zNjk3MjM0MzUyMjU2MTksIHk6MC40MTMzOTE1NTc0OTYzNjF9LHt4OjYuMzgyODIzODcxOTA2ODQxLCB5OjAuNDE5MjEzOTczNzk5MTI2Nn0se3g6Ni41NTg5NTE5NjUwNjU1MDMsIHk6MC40MTkyMTM5NzM3OTkxMjY2fSx7eDo2LjU3NDk2MzYwOTg5ODEwNzUsIHk6MC40MjIxMjUxODE5NTA1MDk0Nn0se3g6Ni41ODIyNDE2MzAyNzY1NjUsIHk6MC40MTE5MzU5NTM0MjA2Njk2fSx7eDo2LjU5NTM0MjA2Njk1Nzc4NywgeTowLjQyNjQ5MTk5NDE3NzU4Mzd9LHt4OjYuNTk5NzA4ODc5MTg0ODYxNSwgeTowLjQxNDg0NzE2MTU3MjA1MjR9LHt4OjYuNjEyODA5MzE1ODY2MDg1LCB5OjAuNDI1MDM2MzkwMTAxODkyMjZ9LHt4OjYuNjIwMDg3MzM2MjQ0NTQxLCB5OjAuNDE0ODQ3MTYxNTcyMDUyNH0se3g6Ni42Mzc1NTQ1ODUxNTI4MzksIHk6MC40MTc3NTgzNjk3MjM0MzUyfSx7eDo2LjY2NjY2NjY2NjY2NjY2NywgeTowLjQyMjEyNTE4MTk1MDUwOTQ2fSx7eDo2LjY4NTU4OTUxOTY1MDY1NSwgeTowLjQzNTIyNTYxODYzMTczMjE1fSx7eDo2LjY4NzA0NTEyMzcyNjM0NywgeTowLjQ4MTgwNDk0OTA1Mzg1NzM1fSx7eDo2LjY4ODUwMDcyNzgwMjAzOCwgeTowLjUzMTI5NTQ4NzYyNzM2NTN9LHt4OjYuNjg4NTAwNzI3ODAyMDM4LCB5OjAuNTU3NDk2MzYwOTg5ODEwOH0se3g6Ni42ODg1MDA3Mjc4MDIwMzgsIHk6MC41Nzc4NzQ4MTgwNDk0OTA2fSx7eDo2LjY5NzIzNDM1MjI1NjE4NiwgeTowLjU5MDk3NTI1NDczMDcxMzJ9LHt4OjYuNzEzMjQ1OTk3MDg4NzkyLCB5OjAuNjAyNjIwMDg3MzM2MjQ0NX0se3g6Ni43Mzk0NDY4NzA0NTEyMzcsIHk6MC41OTk3MDg4NzkxODQ4NjE3fSx7eDo2Ljc1OTgyNTMyNzUxMDkxNywgeTowLjYwMjYyMDA4NzMzNjI0NDV9LHt4OjYuNzcyOTI1NzY0MTkyMTQsIHk6MC42MTQyNjQ5MTk5NDE3NzU4fSx7eDo2Ljc3NDM4MTM2ODI2NzgzMSwgeTowLjY1MDY1NTAyMTgzNDA2MTF9LHt4OjYuNzc0MzgxMzY4MjY3ODMxLCB5OjAuNzA0NTEyMzcyNjM0NjQzNH0se3g6Ni43Nzg3NDgxODA0OTQ5MDU1LCB5OjAuNzIwNTI0MDE3NDY3MjQ4OX0se3g6Ni43OTQ3NTk4MjUzMjc1MTEsIHk6MC43MjE5Nzk2MjE1NDI5NDA0fSx7eDo2LjgzNjk3MjM0MzUyMjU2MiwgeTowLjcyMTk3OTYyMTU0Mjk0MDR9LHt4OjYuODU4ODA2NDA0NjU3OTMzLCB5OjAuNzE2MTU3MjA1MjQwMTc0N30se3g6Ni44NjYwODQ0MjUwMzYzOSwgeTowLjcxMzI0NTk5NzA4ODc5MTl9LHt4OjYuODY3NTQwMDI5MTEyMDgyLCB5OjAuNzAxNjAxMTY0NDgzMjYwNn0se3g6Ni44NzE5MDY4NDEzMzkxNTYsIHk6MC42NzU0MDAyOTExMjA4MTUxfSx7eDo2Ljg3MTkwNjg0MTMzOTE1NiwgeTowLjYyODgyMDk2MDY5ODY5fSlcbiAgLy9uZXcgQXJyYXkoe3g6NS4xNDE2NDY0ODkxMDQxMTYsIHk6MC4yMjc2MDI5MDU1NjkwMDcyNX0se3g6NS4xNDA0MzU4MzUzNTEwOSwgeTowLjIxMDY1Mzc1MzAyNjYzNDR9LHt4OjUuMTQwNDM1ODM1MzUxMDksIHk6MC4xOTk3NTc4NjkyNDkzOTQ2OH0se3g6NS4xMzkyMjUxODE1OTgwNjI1LCB5OjAuMTc5MTc2NzU1NDQ3OTQxOX0se3g6NS4xMzkyMjUxODE1OTgwNjI1LCB5OjAuMTU2MTc0MzM0MTQwNDM1ODN9LHt4OjUuMTM5MjI1MTgxNTk4MDYyNSwgeTowLjEzODAxNDUyNzg0NTAzNjMyfSx7eDo1LjEzOTIyNTE4MTU5ODA2MjUsIHk6MC4xMjQ2OTczMzY1NjE3NDMzNH0se3g6NS4xNDA0MzU4MzUzNTEwOSwgeTowLjExNjIyMjc2MDI5MDU1Njl9LHt4OjUuMTQ0MDY3Nzk2NjEwMTY5NiwgeTowLjExMDE2OTQ5MTUyNTQyMzczfSx7eDo1LjE0ODkxMDQxMTYyMjI3NiwgeTowLjEwNTMyNjg3NjUxMzMxNzJ9LHt4OjUuMTU2MTc0MzM0MTQwNDM2LCB5OjAuMTAxNjk0OTE1MjU0MjM3M30se3g6NS4xNzU1NDQ3OTQxODg4NjIsIHk6MC4wOTkyNzM2MDc3NDgxODQwMX0se3g6NS4yMDcwMjE3OTE3Njc1NTUsIHk6MC4xMDA0ODQyNjE1MDEyMTA2NX0se3g6NS41MjMwMDI0MjEzMDc1MDYsIHk6MC4xMDA0ODQyNjE1MDEyMTA2NX0se3g6NS45MTc2NzU1NDQ3OTQxODg0LCB5OjAuMTAwNDg0MjYxNTAxMjEwNjV9LHt4OjUuOTg1NDcyMTU0OTYzNjgxLCB5OjAuMDk5MjczNjA3NzQ4MTg0MDF9LHt4OjUuOTk2MzY4MDM4NzQwOTIsIHk6MC4wOTQ0MzA5OTI3MzYwNzc0OH0se3g6Ni4wMDEyMTA2NTM3NTMwMjYsIHk6MC4wODU5NTY0MTY0NjQ4OTEwNH0se3g6Ni4wMDM2MzE5NjEyNTkwOCwgeTowLjA2OTAwNzI2MzkyMjUxODE2fSx7eDo2LjAwMzYzMTk2MTI1OTA4LCB5OjAuMDU1NjkwMDcyNjM5MjI1MTh9LHt4OjYuMDAyNDIxMzA3NTA2MDUzNSwgeTowLjAzNzUzMDI2NjM0MzgyNTY3fSx7eDo2LjAwNzI2MzkyMjUxODE2LCB5OjAuMDMwMjY2MzQzODI1NjY1ODZ9LHt4OjYuMDEyMTA2NTM3NTMwMjY3LCB5OjAuMDIxNzkxNzY3NTU0NDc5NDE3fSx7eDo2LjAyOTA1NTY5MDA3MjYzOTUsIHk6MC4wMjA1ODExMTM4MDE0NTI3ODR9LHt4OjYuMjA1ODExMTM4MDE0NTI3NiwgeTowLjAyNDIxMzA3NTA2MDUzMjY4N30se3g6Ni4yMTkxMjgzMjkyOTc4MjEsIHk6MC4wMjkwNTU2OTAwNzI2MzkyMjd9LHt4OjYuMjI2MzkyMjUxODE1OTgsIHk6MC4wNDM1ODM1MzUxMDg5NTg4MzV9LHt4OjYuMjMwMDI0MjEzMDc1MDYxLCB5OjAuMTIzNDg2NjgyODA4NzE2N30se3g6Ni4yMjYzOTIyNTE4MTU5OCwgeTowLjI5NjYxMDE2OTQ5MTUyNTR9LHt4OjYuMjMyNDQ1NTIwNTgxMTE0LCB5OjAuMzA5OTI3MzYwNzc0ODE4NH0se3g6Ni4yNDMzNDE0MDQzNTgzNTQsIHk6MC4zMTg0MDE5MzcwNDYwMDQ4M30se3g6Ni4yNTQyMzcyODgxMzU1OTMsIHk6MC4zMTg0MDE5MzcwNDYwMDQ4M30se3g6Ni4yNjg3NjUxMzMxNzE5MTMsIHk6MC4zMTk2MTI1OTA3OTkwMzE1fSx7eDo2LjI3ODQ1MDM2MzE5NjEyNiwgeTowLjMyNTY2NTg1OTU2NDE2NDY2fSx7eDo2LjI4MzI5Mjk3ODIwODIzMiwgeTowLjM0MjYxNTAxMjEwNjUzNzU1fSx7eDo2LjI4NDUwMzYzMTk2MTI1OSwgeTowLjM3NDA5MjAwOTY4NTIzMDA0fSx7eDo2LjI4MzI5Mjk3ODIwODIzMiwgeTowLjM5NzA5NDQzMDk5MjczNjA2fSx7eDo2LjI5MTc2NzU1NDQ3OTQxOSwgeTowLjQxMjgzMjkyOTc4MjA4MjN9LHt4OjYuMzA2Mjk1Mzk5NTE1NzM4LCB5OjAuNDE2NDY0ODkxMDQxMTYyMjR9LHt4OjYuMzE3MTkxMjgzMjkyOTc5LCB5OjAuNDE2NDY0ODkxMDQxMTYyMjR9LHt4OjYuMzI1NjY1ODU5NTY0MTY1LCB5OjAuNDE4ODg2MTk4NTQ3MjE1NX0se3g6Ni4zMzA1MDg0NzQ1NzYyNzEsIHk6MC40MTE2MjIyNzYwMjkwNTU3fSx7eDo2LjMzNDE0MDQzNTgzNTM1MTUsIHk6MC40MTc2NzU1NDQ3OTQxODg4NH0se3g6Ni4zMzg5ODMwNTA4NDc0NTgsIHk6MC40MTE2MjIyNzYwMjkwNTU3fSx7eDo2LjM0MjYxNTAxMjEwNjUzNywgeTowLjQxNzY3NTU0NDc5NDE4ODg0fSx7eDo2LjM0NjI0Njk3MzM2NTYxNywgeTowLjQxMjgzMjkyOTc4MjA4MjN9LHt4OjYuMzUyMzAwMjQyMTMwNzUxLCB5OjAuNDE2NDY0ODkxMDQxMTYyMjR9LHt4OjYuMzU1OTMyMjAzMzg5ODMwNCwgeTowLjQxMDQxMTYyMjI3NjAyOTA2fSx7eDo2LjM1NzE0Mjg1NzE0Mjg1NywgeTowLjQxODg4NjE5ODU0NzIxNTV9LHt4OjYuMzYxOTg1NDcyMTU0OTY0LCB5OjAuNDEyODMyOTI5NzgyMDgyM30se3g6Ni4zNjkyNDkzOTQ2NzMxMjM1LCB5OjAuNDIyNTE4MTU5ODA2Mjk1NH0se3g6Ni4zNzQwOTIwMDk2ODUyMywgeTowLjQxNTI1NDIzNzI4ODEzNTZ9LHt4OjYuMzkxMDQxMTYyMjI3NjAzLCB5OjAuNDE4ODg2MTk4NTQ3MjE1NX0se3g6Ni41NjI5NTM5OTUxNTczODUsIHk6MC40MTg4ODYxOTg1NDcyMTU1fSx7eDo2LjU3OTkwMzE0NzY5OTc1OCwgeTowLjQxNDA0MzU4MzUzNTEwODk1fSx7eDo2LjU4NTk1NjQxNjQ2NDg5MSwgeTowLjQyMjUxODE1OTgwNjI5NTR9LHt4OjYuNTkwNzk5MDMxNDc2OTk3NSwgeTowLjQxMTYyMjI3NjAyOTA1NTd9LHt4OjYuNTk0NDMwOTkyNzM2MDc3LCB5OjAuNDE4ODg2MTk4NTQ3MjE1NX0se3g6Ni41OTgwNjI5NTM5OTUxNTcsIHk6MC40MTE2MjIyNzYwMjkwNTU3fSx7eDo2LjYwMjkwNTU2OTAwNzI2NCwgeTowLjQxNjQ2NDg5MTA0MTE2MjI0fSx7eDo2LjYwNzc0ODE4NDAxOTM3LCB5OjAuNDEyODMyOTI5NzgyMDgyM30se3g6Ni42MTEzODAxNDUyNzg0NSwgeTowLjQxODg4NjE5ODU0NzIxNTV9LHt4OjYuNjE2MjIyNzYwMjkwNTU3LCB5OjAuNDExNjIyMjc2MDI5MDU1N30se3g6Ni42MjEwNjUzNzUzMDI2NjMsIHk6MC40MjAwOTY4NTIzMDAyNDIxM30se3g6Ni42MjM0ODY2ODI4MDg3MTcsIHk6MC40MTUyNTQyMzcyODgxMzU2fSx7eDo2LjY0Mjg1NzE0Mjg1NzE0MywgeTowLjQxNzY3NTU0NDc5NDE4ODg0fSx7eDo2LjY2MjIyNzYwMjkwNTU2OSwgeTowLjQyMDA5Njg1MjMwMDI0MjEzfSx7eDo2LjY3NDMzNDE0MDQzNTgzNSwgeTowLjQyMjUxODE1OTgwNjI5NTR9LHt4OjYuNjgyODA4NzE2NzA3MDIxLCB5OjAuNDI5NzgyMDgyMzI0NDU1Mn0se3g6Ni42OTAwNzI2MzkyMjUxODIsIHk6MC40NDkxNTI1NDIzNzI4ODE0fSx7eDo2LjY4NzY1MTMzMTcxOTEyOCwgeTowLjUwMTIxMDY1Mzc1MzAyNjZ9LHt4OjYuNjg2NDQwNjc3OTY2MTAyLCB5OjAuNTU4MTExMzgwMTQ1Mjc4NX0se3g6Ni42ODY0NDA2Nzc5NjYxMDIsIHk6MC41NzM4NDk4Nzg5MzQ2MjQ3fSx7eDo2LjY4ODg2MTk4NTQ3MjE1NSwgeTowLjU4NDc0NTc2MjcxMTg2NDR9LHt4OjYuNzAzMzg5ODMwNTA4NDc1LCB5OjAuNTk2ODUyMzAwMjQyMTMwOH0se3g6Ni43MjYzOTIyNTE4MTU5OCwgeTowLjYwMDQ4NDI2MTUwMTIxMDd9LHt4OjYuNzQ1NzYyNzExODY0NDA3LCB5OjAuNjAwNDg0MjYxNTAxMjEwN30se3g6Ni43NjI3MTE4NjQ0MDY3NzksIHk6MC42MDI5MDU1NjkwMDcyNjM5fSx7eDo2Ljc2OTk3NTc4NjkyNDkzOSwgeTowLjYxMjU5MDc5OTAzMTQ3N30se3g6Ni43NzYwMjkwNTU2OTAwNzIsIHk6MC42MjQ2OTczMzY1NjE3NDMzfSx7eDo2Ljc3NjAyOTA1NTY5MDA3MiwgeTowLjY0MDQzNTgzNTM1MTA4OTZ9LHt4OjYuNzc2MDI5MDU1NjkwMDcyLCB5OjAuNjY0NjQ4OTEwNDExNjIyM30se3g6Ni43NzM2MDc3NDgxODQwMiwgeTowLjY4MjgwODcxNjcwNzAyMTh9LHt4OjYuNzczNjA3NzQ4MTg0MDIsIHk6MC43MDA5Njg1MjMwMDI0MjEzfSx7eDo2Ljc4MDg3MTY3MDcwMjE3OSwgeTowLjcxMzA3NTA2MDUzMjY4Nzd9LHt4OjYuNzkxNzY3NTU0NDc5NDE5LCB5OjAuNzE3OTE3Njc1NTQ0Nzk0Mn0se3g6Ni44MTExMzgwMTQ1Mjc4NDUsIHk6MC43MjAzMzg5ODMwNTA4NDc0fSx7eDo2LjgzMjkyOTc4MjA4MjMyNCwgeTowLjcyMDMzODk4MzA1MDg0NzR9LHt4OjYuODUxMDg5NTg4Mzc3NzI0LCB5OjAuNzE5MTI4MzI5Mjk3ODIwOH0se3g6Ni44NTk1NjQxNjQ2NDg5MSwgeTowLjcxNTQ5NjM2ODAzODc0MX0se3g6Ni44NjY4MjgwODcxNjcwNywgeTowLjcwMzM4OTgzMDUwODQ3NDZ9LHt4OjYuODcwNDYwMDQ4NDI2MTUsIHk6MC42NTI1NDIzNzI4ODEzNTZ9KVxuICBuZXcgQXJyYXkoe3g6NS4xNDAyODc3Njk3ODQxNzIsIHk6MC4yMjc4MTc3NDU4MDMzNTczfSx7eDo1LjEzOTA4ODcyOTAxNjc4NywgeTowLjIwNjIzNTAxMTk5MDQwNzY3fSx7eDo1LjEzOTA4ODcyOTAxNjc4NywgeTowLjE4ODI0OTQwMDQ3OTYxNjN9LHt4OjUuMTM2NjkwNjQ3NDgyMDE0LCB5OjAuMTY0MjY4NTg1MTMxODk0NX0se3g6NS4xMzY2OTA2NDc0ODIwMTQsIHk6MC4xNDc0ODIwMTQzODg0ODkyfSx7eDo1LjEzNzg4OTY4ODI0OTQsIHk6MC4xMjk0OTY0MDI4Nzc2OTc4NH0se3g6NS4xNDAyODc3Njk3ODQxNzIsIHk6MC4xMTc1MDU5OTUyMDM4MzY5NH0se3g6NS4xNDI2ODU4NTEzMTg5NDQsIHk6MC4xMTAzMTE3NTA1OTk1MjAzOH0se3g6NS4xNDk4ODAwOTU5MjMyNjIsIHk6MC4xMDQzMTY1NDY3NjI1ODk5M30se3g6NS4xNjE4NzA1MDM1OTcxMjMsIHk6MC4wOTk1MjAzODM2OTMwNDU1N30se3g6NS4xOTkwNDA3NjczODYwOTEsIHk6MC4wOTU5MjMyNjEzOTA4ODcyOX0se3g6NS45ODA4MTUzNDc3MjE4MjMsIHk6MC4wOTk1MjAzODM2OTMwNDU1N30se3g6NS45OTUyMDM4MzY5MzA0NTYsIHk6MC4wOTM1MjUxNzk4NTYxMTUxMX0se3g6NS45OTg4MDA5NTkyMzI2MTM1LCB5OjAuMDg3NTI5OTc2MDE5MTg0NjV9LHt4OjYuMDAxMTk5MDQwNzY3Mzg2NSwgeTowLjA3NTUzOTU2ODM0NTMyMzc0fSx7eDo2LjAwMTE5OTA0MDc2NzM4NjUsIHk6MC4wNjExNTEwNzkxMzY2OTA2NX0se3g6Ni4wMDIzOTgwODE1MzQ3NzIsIHk6MC4wNDMxNjU0Njc2MjU4OTkyOH0se3g6Ni4wMDIzOTgwODE1MzQ3NzIsIHk6MC4wMzcxNzAyNjM3ODg5Njg4Mn0se3g6Ni4wMDQ3OTYxNjMwNjk1NDQsIHk6MC4wMzIzNzQxMDA3MTk0MjQ0Nn0se3g6Ni4wMDk1OTIzMjYxMzkwODksIHk6MC4wMjYzNzg4OTY4ODI0OTQwMDR9LHt4OjYuMDE3OTg1NjExNTEwNzkyLCB5OjAuMDIxNTgyNzMzODEyOTQ5NjR9LHt4OjYuMDMzNTczMTQxNDg2ODEsIHk6MC4wMTkxODQ2NTIyNzgxNzc0NTd9LHt4OjYuMTk5MDQwNzY3Mzg2MDkxLCB5OjAuMDIxNTgyNzMzODEyOTQ5NjR9LHt4OjYuMjEzNDI5MjU2NTk0NzI0LCB5OjAuMDI2Mzc4ODk2ODgyNDk0MDA0fSx7eDo2LjIyNTQxOTY2NDI2ODU4NTUsIHk6MC4wMzgzNjkzMDQ1NTYzNTQ5MX0se3g6Ni4yMzAyMTU4MjczMzgxMywgeTowLjA1NTE1NTg3NTI5OTc2MDE5fSx7eDo2LjIzMjYxMzkwODg3MjkwMiwgeTowLjIyMzAyMTU4MjczMzgxMjk1fSx7eDo2LjIzMTQxNDg2ODEwNTUxNTUsIHk6MC4yMzUwMTE5OTA0MDc2NzM4N30se3g6Ni4yMzI2MTM5MDg4NzI5MDIsIHk6MC4yNDIyMDYyMzUwMTE5OTA0fSx7eDo2LjIzOTgwODE1MzQ3NzIxODUsIHk6MC4yNDgyMDE0Mzg4NDg5MjA4N30se3g6Ni4yNTI5OTc2MDE5MTg0NjUsIHk6MC4yNTI5OTc2MDE5MTg0NjUyfSx7eDo2LjI2NDk4ODAwOTU5MjMyNiwgeTowLjI1Mjk5NzYwMTkxODQ2NTJ9LHt4OjYuMjc1Nzc5Mzc2NDk4ODAxLCB5OjAuMjU1Mzk1NjgzNDUzMjM3NDN9LHt4OjYuMjgyOTczNjIxMTAzMTE3NSwgeTowLjI2NDk4ODAwOTU5MjMyNjE2fSx7eDo2LjI4Nzc2OTc4NDE3MjY2MiwgeTowLjI4MDU3NTUzOTU2ODM0NTN9LHt4OjYuMjg2NTcwNzQzNDA1Mjc2LCB5OjAuMzMyMTM0MjkyNTY1OTQ3MjN9LHt4OjYuMjkyNTY1OTQ3MjQyMjA2LCB5OjAuMzQ1MzIzNzQxMDA3MTk0MjZ9LHt4OjYuMzA5MzUyNTE3OTg1NjExLCB5OjAuMzUwMTE5OTA0MDc2NzM4Nn0se3g6Ni4zMjAxNDM4ODQ4OTIwODcsIHk6MC4zNDY1MjI3ODE3NzQ1ODAzNX0se3g6Ni4zMjYxMzkwODg3MjkwMTY1LCB5OjAuMzUxMzE4OTQ0ODQ0MTI0N30se3g6Ni4zMzMzMzMzMzMzMzMzMzMsIHk6MC4zNDQxMjQ3MDAyMzk4MDgyfSx7eDo2LjMzNTczMTQxNDg2ODEwNSwgeTowLjM1MDExOTkwNDA3NjczODZ9LHt4OjYuMzQxNzI2NjE4NzA1MDM2LCB5OjAuMzQ1MzIzNzQxMDA3MTk0MjZ9LHt4OjYuMzQ2NTIyNzgxNzc0NTgsIHk6MC4zNTEzMTg5NDQ4NDQxMjQ3fSx7eDo2LjM1MjUxNzk4NTYxMTUxLCB5OjAuMzQwNTI3NTc3OTM3NjQ5OX0se3g6Ni4zNTYxMTUxMDc5MTM2NjksIHk6MC4zNTAxMTk5MDQwNzY3Mzg2fSx7eDo2LjM2MzMwOTM1MjUxNzk4NiwgeTowLjM0MDUyNzU3NzkzNzY0OTl9LHt4OjYuMzY4MTA1NTE1NTg3NTMsIHk6MC4zNDc3MjE4MjI1NDE5NjY0M30se3g6Ni4zNzQxMDA3MTk0MjQ0NjEsIHk6MC4zMzkzMjg1MzcxNzAyNjM4fSx7eDo2LjM4NDg5MjA4NjMzMDkzNSwgeTowLjM0ODkyMDg2MzMwOTM1MjV9LHt4OjYuNTY0NzQ4MjAxNDM4ODQ4NSwgeTowLjM0ODkyMDg2MzMwOTM1MjV9LHt4OjYuNTgwMzM1NzMxNDE0ODY4LCB5OjAuMzQ0MTI0NzAwMjM5ODA4Mn0se3g6Ni41ODc1Mjk5NzYwMTkxODQ2LCB5OjAuMzUxMzE4OTQ0ODQ0MTI0N30se3g6Ni41OTIzMjYxMzkwODg3MjksIHk6MC4zNDE3MjY2MTg3MDUwMzU5Nn0se3g6Ni41OTgzMjEzNDI5MjU2NiwgeTowLjM0ODkyMDg2MzMwOTM1MjV9LHt4OjYuNjEwMzExNzUwNTk5NTIxLCB5OjAuMzQwNTI3NTc3OTM3NjQ5OX0se3g6Ni42MTUxMDc5MTM2NjkwNjUsIHk6MC4zNDUzMjM3NDEwMDcxOTQyNn0se3g6Ni42MjQ3MDAyMzk4MDgxNTQsIHk6MC4zNDE3MjY2MTg3MDUwMzU5Nn0se3g6Ni42MzMwOTM1MjUxNzk4NTYsIHk6MC4zNTEzMTg5NDQ4NDQxMjQ3fSx7eDo2LjY3MDI2Mzc4ODk2ODgyNSwgeTowLjM1MzcxNzAyNjM3ODg5Njl9LHt4OjYuNjg0NjUyMjc4MTc3NDU4LCB5OjAuMzYwOTExMjcwOTgzMjEzNH0se3g6Ni42ODk0NDg0NDEyNDcwMDIsIHk6MC4zODAwOTU5MjMyNjEzOTA5fSx7eDo2LjY4NzA1MDM1OTcxMjIzLCB5OjAuNDMxNjU0Njc2MjU4OTkyOH0se3g6Ni42ODcwNTAzNTk3MTIyMywgeTowLjQ3NzIxODIyNTQxOTY2NDI0fSx7eDo2LjY4OTQ0ODQ0MTI0NzAwMiwgeTowLjUxNTU4NzUyOTk3NjAxOTJ9LHt4OjYuNjg4MjQ5NDAwNDc5NjE2NSwgeTowLjUyMTU4MjczMzgxMjk0OTZ9LHt4OjYuNzI3ODE3NzQ1ODAzMzU4LCB5OjAuNTMyMzc0MTAwNzE5NDI0NX0se3g6Ni43NTI5OTc2MDE5MTg0NjUsIHk6MC41Mjk5NzYwMTkxODQ2NTIzfSx7eDo2Ljc2OTc4NDE3MjY2MTg3LCB5OjAuNTM1OTcxMjIzMDIxNTgyN30se3g6Ni43NzkzNzY0OTg4MDA5NTksIHk6MC41NTc1NTM5NTY4MzQ1MzIzfSx7eDo2Ljc3OTM3NjQ5ODgwMDk1OSwgeTowLjU5MTEyNzA5ODMyMTM0Mjl9LHt4OjYuNzc5Mzc2NDk4ODAwOTU5LCB5OjAuNjM1NDkxNjA2NzE0NjI4M30se3g6Ni43ODY1NzA3NDM0MDUyNzYsIHk6MC42NDk4ODAwOTU5MjMyNjEzfSx7eDo2LjgwNDU1NjM1NDkxNjA2NywgeTowLjY1MzQ3NzIxODIyNTQxOTd9LHt4OjYuODI5NzM2MjExMDMxMTc1LCB5OjAuNjUzNDc3MjE4MjI1NDE5N30se3g6Ni44NDg5MjA4NjMzMDkzNTMsIHk6MC42NDg2ODEwNTUxNTU4NzUzfSx7eDo2Ljg2MzMwOTM1MjUxNzk4NiwgeTowLjYzMDY5NTQ0MzY0NTA4Mzl9LHt4OjYuODY2OTA2NDc0ODIwMTQ0LCB5OjAuNTk4MzIxMzQyOTI1NjU5NX0pXG4pXG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIxID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC42MzE0NTc2MjcxMTg2NDQxLCB5OjMuMDQ3NzIwMzM4OTgzMDUxfSx7eDowLjY2NDUwODQ3NDU3NjI3MTIsIHk6My4wNTExMTAxNjk0OTE1MjU3fSx7eDowLjY4NTY5NDkxNTI1NDIzNzMsIHk6My4wNDI2MzU1OTMyMjAzMzkzfSx7eDowLjY4ODIzNzI4ODEzNTU5MzMsIHk6My4wMTU1MTY5NDkxNTI1NDI2fSx7eDowLjY2Nzg5ODMwNTA4NDc0NTgsIHk6Mi45OTAwOTMyMjAzMzg5ODM0fSx7eDowLjY3MTI4ODEzNTU5MzIyMDMsIHk6Mi45Njg5MDY3Nzk2NjEwMTd9LHt4OjAuNjgxNDU3NjI3MTE4NjQ0MSwgeToyLjk1MDI2MjcxMTg2NDQwN30se3g6MC42NjcwNTA4NDc0NTc2MjcxLCB5OjIuOTM0MTYxMDE2OTQ5MTUyOH0se3g6MC42MzgyMzcyODgxMzU1OTMyLCB5OjIuOTM2NzAzMzg5ODMwNTA5fSx7eDowLjYzOTA4NDc0NTc2MjcxMTksIHk6Mi45NTAyNjI3MTE4NjQ0MDd9LHt4OjAuNjEwMjcxMTg2NDQwNjc3OSwgeToyLjk2MjEyNzExODY0NDA2OH0se3g6MC42MDc3Mjg4MTM1NTkzMjIxLCB5OjIuOTg1ODU1OTMyMjAzMzl9LHt4OjAuNjI5NzYyNzExODY0NDA2OCwgeTozLjAwMTk1NzYyNzExODY0NH0se3g6MC42MTUzNTU5MzIyMDMzODk4LCB5OjMuMDMwNzcxMTg2NDQwNjc4fSx7eDowLjYyNTUyNTQyMzcyODgxMzYsIHk6My4wNTQ1fSksXG4gIG5ldyBBcnJheSh7eDowLjY1MjY0NDA2Nzc5NjYxMDEsIHk6Mi45MjkwNzYyNzExODY0NDA2fSx7eDowLjY2OTU5MzIyMDMzODk4MywgeToyLjkzNzU1MDg0NzQ1NzYyN30se3g6MC42NzM4MzA1MDg0NzQ1NzYzLCB5OjIuOTY3MjExODY0NDA2Nzc5OH0se3g6MC42NTg1NzYyNzExODY0NDA3LCB5OjIuOTc2NTMzODk4MzA1MDg1fSx7eDowLjYyODkxNTI1NDIzNzI4ODEsIHk6Mi45OTM0ODMwNTA4NDc0NTc3fSx7eDowLjYxMjgxMzU1OTMyMjAzMzksIHk6My4wMDg3MzcyODgxMzU1OTM2fSx7eDowLjYxMDI3MTE4NjQ0MDY3NzksIHk6My4wMzY3MDMzODk4MzA1MDg1fSx7eDowLjYyNjM3Mjg4MTM1NTkzMjIsIHk6My4wNTAyNjI3MTE4NjQ0MDd9LHt4OjAuNjUzNDkxNTI1NDIzNzI4OCwgeTozLjA1MzY1MjU0MjM3Mjg4MTN9LHt4OjAuNjY5NTkzMjIwMzM4OTgzLCB5OjMuMDQxNzg4MTM1NTkzMjIwNn0se3g6MC42NzU1MjU0MjM3Mjg4MTM1LCB5OjMuMDI0ODM4OTgzMDUwODQ3OH0se3g6MC42NTM0OTE1MjU0MjM3Mjg4LCB5OjMuMDA2MTk0OTE1MjU0MjM3NX0se3g6MC42MjI5ODMwNTA4NDc0NTc2LCB5OjIuOTg2NzAzMzg5ODMwNTA4Nn0se3g6MC42MTYyMDMzODk4MzA1MDg1LCB5OjIuOTU4NzM3Mjg4MTM1NTkzM30se3g6MC42NTM0OTE1MjU0MjM3Mjg4LCB5OjIuOTQzNDgzMDUwODQ3NDU4fSx7eDowLjY1NDMzODk4MzA1MDg0NzUsIHk6Mi45MzY3MDMzODk4MzA1MDl9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFTID0gbmV3IEFycmF5KFxuICAvL25ldyBBcnJheSh7eDo2Ljg2MTcxNzYxMjgwOTMxNiwgeTowLjY2ODEyMjI3MDc0MjM1ODF9LHt4OjYuODQ3MTYxNTcyMDUyNDAyLCB5OjAuNjU2NDc3NDM4MTM2ODI2OH0se3g6Ni44NTE1MjgzODQyNzk0NzYsIHk6MC42MzMxODc3NzI5MjU3NjQyfSx7eDo2Ljg3MTkwNjg0MTMzOTE1NiwgeTowLjYzMDI3NjU2NDc3NDM4MTN9LHt4OjYuODcxOTA2ODQxMzM5MTU2LCB5OjAuNTk5NzA4ODc5MTg0ODYxN30se3g6Ni44NDEzMzkxNTU3NDk2MzYsIHk6MC41OTk3MDg4NzkxODQ4NjE3fSx7eDo2Ljg0MTMzOTE1NTc0OTYzNiwgeTowLjYyNzM2NTM1NjYyMjk5ODV9LHt4OjYuODczMzYyNDQ1NDE0ODQ3LCB5OjAuNjQxOTIxMzk3Mzc5OTEyN30se3g6Ni44Njc1NDAwMjkxMTIwODIsIHk6MC42NzI0ODkwODI5Njk0MzIzfSlcbiAgbmV3IEFycmF5KHt4OjYuODY5MzUyODY5MzUyODY5LCB5OjAuNTk3MDY5NTk3MDY5NTk3MX0se3g6Ni44ODY0NDY4ODY0NDY4ODcsIHk6MC41ODI0MTc1ODI0MTc1ODI1fSx7eDo2Ljg5NzQzNTg5NzQzNTg5OCwgeTowLjU2NjU0NDU2NjU0NDU2NjV9LHt4OjYuOTEyMDg3OTEyMDg3OTEyLCB5OjAuNTI5OTE0NTI5OTE0NTI5OX0se3g6Ni45MTMzMDg5MTMzMDg5MTQsIHk6MC41MDY3MTU1MDY3MTU1MDY3fSx7eDo2LjkxMzMwODkxMzMwODkxNCwgeTowLjQ4NDczNzQ4NDczNzQ4NDc0fSx7eDo2LjkwNDc2MTkwNDc2MTkwNSwgeTowLjQ2ODg2NDQ2ODg2NDQ2ODg2fSx7eDo2Ljg4NzY2Nzg4NzY2Nzg4OCwgeTowLjQ1Nzg3NTQ1Nzg3NTQ1Nzg2fSx7eDo2Ljg2MzI0Nzg2MzI0Nzg2MywgeTowLjQ1Nzg3NTQ1Nzg3NTQ1Nzg2fSx7eDo2Ljg0NzM3NDg0NzM3NDg0NywgeTowLjQ2Mjc1OTQ2Mjc1OTQ2Mjh9LHt4OjYuODI3ODM4ODI3ODM4ODI4LCB5OjAuNDc5ODUzNDc5ODUzNDc5ODd9LHt4OjYuODI3ODM4ODI3ODM4ODI4LCB5OjAuNDk5Mzg5NDk5Mzg5NDk5NH0se3g6Ni44NTk1ODQ4NTk1ODQ4NTksIHk6MC41MTI4MjA1MTI4MjA1MTI4fSx7eDo2Ljg3OTEyMDg3OTEyMDg3OTYsIHk6MC41MjUwMzA1MjUwMzA1MjV9LHt4OjYuODY5MzUyODY5MzUyODY5LCB5OjAuNTM5NjgyNTM5NjgyNTM5N30se3g6Ni44MzYzODU4MzYzODU4MzYsIHk6MC41NDU3ODc1NDU3ODc1NDU3fSx7eDo2LjgyNDE3NTgyNDE3NTgyNCwgeTowLjU2NjU0NDU2NjU0NDU2NjV9LHt4OjYuODI0MTc1ODI0MTc1ODI0LCB5OjAuNTg0ODU5NTg0ODU5NTg0OX0se3g6Ni44NDEyNjk4NDEyNjk4NDEsIHk6MC41ODk3NDM1ODk3NDM1ODk4fSx7eDo2Ljg2MzI0Nzg2MzI0Nzg2MywgeTowLjU2Nzc2NTU2Nzc2NTU2Nzd9LHt4OjYuODQ5ODE2ODQ5ODE2ODQ5NSwgeTowLjU0MjEyNDU0MjEyNDU0MjF9LHt4OjYuODQ5ODE2ODQ5ODE2ODQ5NSwgeTowLjUyMzgwOTUyMzgwOTUyMzh9LHt4OjYuODY2OTEwODY2OTEwODY2NSwgeTowLjUxMTU5OTUxMTU5OTUxMTZ9LHt4OjYuODgyNzgzODgyNzgzODgzLCB5OjAuNTE2NDgzNTE2NDgzNTE2NX0se3g6Ni44OTM3NzI4OTM3NzI4OTQsIHk6MC41Mzk2ODI1Mzk2ODI1Mzk3fSx7eDo2Ljg5MTMzMDg5MTMzMDg5MiwgeTowLjU1Nzk5NzU1Nzk5NzU1OH0se3g6Ni44NzE3OTQ4NzE3OTQ4NzEsIHk6MC41Njc3NjU1Njc3NjU1Njc3fSx7eDo2Ljg4MDM0MTg4MDM0MTg4MSwgeTowLjYwMzE3NDYwMzE3NDYwMzF9LHt4OjYuOTA5NjQ1OTA5NjQ1OTEsIHk6MC42MDE5NTM2MDE5NTM2MDE5fSx7eDo2LjkwOTY0NTkwOTY0NTkxLCB5OjAuNTgzNjM4NTgzNjM4NTgzN30se3g6Ni45MDEwOTg5MDEwOTg5MDE1LCB5OjAuNTcyNjQ5NTcyNjQ5NTcyNn0se3g6Ni44Nzc4OTk4Nzc4OTk4NzgsIHk6MC41Nzc1MzM1Nzc1MzM1Nzc1fSlcbik7XG52YXIgcHJlZ25hbnRTZWxlY3RlZCA9IGZhbHNlO1xudmFyIG5vblByZWduYW50U2VsZWN0ZWQgPSBmYWxzZTtcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBBbmltYXRpb25zXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbnZhciBjYW52YXMsIGNhbnZhczIsIGNhbnZhczMsIGNhbnZhczQsIGNhbnZhczUsIGNvbnRleHQsIGNvbnRleHQyLCBjb250ZXh0MywgY29udGV4dDQsIGNvbnRleHQ1O1xudmFyIG1vc3F1aXRvc0FycmF5ID0gbmV3IEFycmF5KClcbnZhciB0b3RhbE1vc3F1aXRvcyA9IDEwMDtcbnZhciBzdG9wTWFpbiA9IGZhbHNlO1xudmFyIGN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMDtcbnZhciBjdXJyZW50UGhhc2UgPSAwO1xudmFyIG1vc3F1aXRvc0xlZnQgPSB0b3RhbE1vc3F1aXRvcztcbnZhciBwcmVnbmFudE1vc3F1aXRvcyA9IDA7XG52YXIgbGVmdENvdmVyR2xhc3MsIHJpZ2h0Q292ZXJHbGFzcywgbGVmdENvdmVyR2xhc3NIb3ZlciwgcmlnaHRDb3ZlckdsYXNzSG92ZXI7XG52YXIgaG92ZXJCZWhhdmlvckltYWdlc0Rlc2t0b3AgPSBuZXcgQXJyYXkoXCJpY29uMV9ob3Zlci5wbmdcIixcImljb24yX2hvdmVyLnBuZ1wiLFwiaWNvbjNfaG92ZXIucG5nXCIsXCJpY29uNF9ob3Zlci5wbmdcIixcImljb241X2hvdmVyLnBuZ1wiLFwiaWNvbjZfaG92ZXIucG5nXCIsXCJpY29uN19ob3Zlci5wbmdcIixcImljb244X2hvdmVyLnBuZ1wiLFwiaWNvbjlfaG92ZXIucG5nXCIpO1xudmFyIGJlaGF2aW9ySW1hZ2VzRGVza3RvcCA9IG5ldyBBcnJheShcImljb24xLnBuZ1wiLFwiaWNvbjIucG5nXCIsXCJpY29uMy5wbmdcIixcImljb240LnBuZ1wiLFwiaWNvbjUucG5nXCIsXCJpY29uNi5wbmdcIixcImljb243LnBuZ1wiLFwiaWNvbjgucG5nXCIsXCJpY29uOS5wbmdcIik7XG52YXIgaG92ZXJCZWhhdmlvckltYWdlc01vYmlsZSA9IG5ldyBBcnJheShcImljb24xbW9iaWxlX2hvdmVyLnBuZ1wiLFwiaWNvbjJtb2JpbGVfaG92ZXIucG5nXCIsXCJpY29uM21vYmlsZV9ob3Zlci5wbmdcIixcImljb240bW9iaWxlX2hvdmVyLnBuZ1wiLFwiaWNvbjVtb2JpbGVfaG92ZXIucG5nXCIsXCJpY29uNm1vYmlsZV9ob3Zlci5wbmdcIixcImljb243bW9iaWxlX2hvdmVyLnBuZ1wiLFwiaWNvbjhtb2JpbGVfaG92ZXIucG5nXCIsXCJpY29uOW1vYmlsZV9ob3Zlci5wbmdcIik7XG52YXIgYmVoYXZpb3JJbWFnZXNNb2JpbGUgPSBuZXcgQXJyYXkoXCJpY29uMW1vYmlsZS5wbmdcIixcImljb24ybW9iaWxlLnBuZ1wiLFwiaWNvbjNtb2JpbGUucG5nXCIsXCJpY29uNG1vYmlsZS5wbmdcIixcImljb241bW9iaWxlLnBuZ1wiLFwiaWNvbjZtb2JpbGUucG5nXCIsXCJpY29uN21vYmlsZS5wbmdcIixcImljb244bW9iaWxlLnBuZ1wiLFwiaWNvbjltb2JpbGUucG5nXCIpO1xudmFyIGhvdmVyQmVoYXZpb3JJbWFnZXMgPSBob3ZlckJlaGF2aW9ySW1hZ2VzRGVza3RvcDtcbnZhciBiZWhhdmlvckltYWdlcyA9IGJlaGF2aW9ySW1hZ2VzRGVza3RvcDtcbnZhciB0YWJsZXRUcmVzaG9sZCA9IDM1NDsvLzk1NztcbnZhciBtb2JpbGVUcmVzaG9sZCA9IDYwMDtcbnZhciBjZWxsID0gMDtcblxuaWYoKG1vYmlsZV9icm93c2VyID09IDEpJiYoaXBhZF9icm93c2VyID09IDApKVxue1xuICBpZih3aW5kb3cuaW5uZXJIZWlnaHQgPiB3aW5kb3cuaW5uZXJXaWR0aCl7XG4gICAgaG92ZXJCZWhhdmlvckltYWdlcyA9IGhvdmVyQmVoYXZpb3JJbWFnZXNNb2JpbGU7XG4gICAgYmVoYXZpb3JJbWFnZXMgPSBiZWhhdmlvckltYWdlc01vYmlsZTtcbiAgfWVsc2V7XG4gICAgdGFibGV0VHJlc2hvbGQgPSAzMDAwO1xuICAgIGhvdmVyQmVoYXZpb3JJbWFnZXMgPSBob3ZlckJlaGF2aW9ySW1hZ2VzRGVza3RvcDtcbiAgICBiZWhhdmlvckltYWdlcyA9IGJlaGF2aW9ySW1hZ2VzRGVza3RvcDtcbiAgfVxufVxuaWYoaXBhZF9icm93c2VyID09IDEpXG57XG4gIHRhYmxldFRyZXNob2xkID0gMzAwMDtcbn1cbmlmKG1vYmlsZV9icm93c2VyID09IDApXG57XG4gICQoJyNwZ1N0ZXAyIC5wZ1N0ZXBfX2luZm8nKS5oaWRlKCk7XG4gICQoJyNwZ1N0ZXAzIC5wZ1N0ZXBfX2luZm8nKS5oaWRlKCk7XG59XG5cbmNoYW5nZUljb25zKCk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwib3JpZW50YXRpb25jaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XG4gIC8vIEFubm91bmNlIHRoZSBuZXcgb3JpZW50YXRpb24gbnVtYmVyXG4gIGlmKHdpbmRvdy5vcmllbnRhdGlvbj09MClcbiAge1xuICAgIHRhYmxldFRyZXNob2xkID0gMzU0O1xuICAgIGhvdmVyQmVoYXZpb3JJbWFnZXMgPSBob3ZlckJlaGF2aW9ySW1hZ2VzTW9iaWxlO1xuICAgIGJlaGF2aW9ySW1hZ2VzID0gYmVoYXZpb3JJbWFnZXNNb2JpbGU7XG4gIH1lbHNle1xuICAgIHRhYmxldFRyZXNob2xkID0gMzAwMDtcbiAgICBob3ZlckJlaGF2aW9ySW1hZ2VzID0gaG92ZXJCZWhhdmlvckltYWdlc0Rlc2t0b3A7XG4gICAgYmVoYXZpb3JJbWFnZXMgPSBiZWhhdmlvckltYWdlc0Rlc2t0b3A7XG4gIH1cblxuICBjaGFuZ2VJY29ucygpO1xufSwgZmFsc2UpO1xuXG5mdW5jdGlvbiBjaGFuZ2VJY29ucygpXG57XG4gIGZvcihpPTA7aTxiZWhhdmlvckltYWdlcy5sZW5ndGg7aSsrKVxuICB7XG4gICAgICAkKCcjaWNvbicraSkuYXR0cihcInNyY1wiLCBcIi4vaW1hZ2VzL1wiICsgYmVoYXZpb3JJbWFnZXNbaV0pO1xuICB9XG59XG4vKipcbiAgVGhlIGNhbnZhc0ltYWdlIGNsYXNzIHJlcHJlc2VudHMgYW4gZWxlbWVudCBkcmF3biBvbiB0aGUgY2FudmFzLlxuIFxuICBAY2xhc3MgQ2FudmFzSW1hZ2VcbiAgQGNvbnN0cnVjdG9yXG4qL1xuZnVuY3Rpb24gQ2FudmFzSW1hZ2UoaW1nLCB4LCB5LCBhbmdsZSwgc3BlZWQsIHR5cGUsIGN1cnJlbnRJbWFnZSwgcG9zaXRpb25zQXJyYXkpIHtcbiAgdGhpcy5pbWFnZSA9IGltZztcbiAgdGhpcy54ID0geDtcbiAgdGhpcy55ID0geTtcbiAgdGhpcy54QW1vdW50ID0gMDtcbiAgdGhpcy55QW1vdW50ID0gMDtcbiAgdGhpcy53aWR0aCA9IGltZy53aWR0aDtcbiAgdGhpcy5oZWlnaHQgPSBpbWcuaGVpZ2h0O1xuICB0aGlzLnBvc2l0aW9uID0gMTtcbiAgdGhpcy5hbmdsZSA9IGFuZ2xlO1xuICB0aGlzLnNwZWVkID0gc3BlZWQ7XG4gIHRoaXMudHlwZSA9IHR5cGU7XG4gIHRoaXMuY3VycmVudEltYWdlID0gY3VycmVudEltYWdlO1xuICB0aGlzLmZpcnN0VGltZSA9IGZhbHNlO1xuICB0aGlzLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gIHRoaXMucG9zaXRpb25zQXJyYXkgPSBwb3NpdGlvbnNBcnJheTtcbiAgdGhpcy5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDA7XG4gIHRoaXMuZmxpcHBlZEltYWdlcyA9IG5ldyBBcnJheSgpO1xuICByZXR1cm4gdGhpcztcbn1cbi8vU2V0dXAgcmVxdWVzdCBhbmltYXRpb24gZnJhbWVcbnZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbih0aW1lKSB7XG4gIGlmICghc3RvcE1haW4pIHtcbiAgICBtYWluKHRpbWUpO1xuICB9XG4gIFxuICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25GcmFtZSk7XG59XG52YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lSW5pdGlhbGl6YXRpb24gPSBmdW5jdGlvbigpe1xuICB2YXIgbGFzdFRpbWUgPSAwO1xuICB2YXIgdmVuZG9ycyA9IFsnbXMnLCAnbW96JywgJ3dlYmtpdCcsICdvJ107XG4gIGZvcih2YXIgeCA9IDA7IHggPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKyt4KSB7XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgfVxuIFxuICBpZiAoIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2ssIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xuICAgICAgICB2YXIgaWQgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKTsgfSxcbiAgICAgICAgICB0aW1lVG9DYWxsKTtcbiAgICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9O1xuICB9XG4gXG4gIGlmICghd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgfTtcbiAgfVxufVxuLy9TZXR1cCBtYWluIGxvb3BcbnZhciBzZXR1cE1haW5Mb29wID0gZnVuY3Rpb24oKXtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lSW5pdGlhbGl6YXRpb24oKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZXF1ZXN0QW5pbWF0aW9uRnJhbWUpO1xuICAgICAgY3VycmVudFBoYXNlID0gMTtcblxuICAgICAgJCgnI3BnU3RlcDEgLnBnLWJ1dHRvbicpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICB9LCAxNTAwKTtcbn1cbi8vRXhlY3V0ZSBtYWluIGxvb3BcbnZhciBtYWluID0gZnVuY3Rpb24odGltZSl7XG4gIC8vIGNsZWFyIHRoZSBjYW52YXNcbiAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY29udGV4dC5jYW52YXMud2lkdGgsIGNvbnRleHQuY2FudmFzLmhlaWdodCk7XG5cbiAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICBzd2l0Y2ggKGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgIGNhc2UgMjpcbiAgICAgIGNhc2UgNDpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTA6XG4gICAgICBjYXNlIDEyOlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTY6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMDpcbiAgICAgIGNhc2UgMjI6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgZWxlbWVudC5jdXJyZW50SW1hZ2UgPSBlbGVtZW50LmN1cnJlbnRJbWFnZSArIDE7XG4gICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRJbWFnZSA+PSBlbGVtZW50LmltYWdlLmxlbmd0aCkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudEltYWdlID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIHZhciB3TXVsdGlwbGllciA9IDEuMDtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIHdNdWx0aXBsaWVyID0gMC4xMjU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9PSAyMikge1xuXG4gICAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiAoIDE2LjAvMTIuMCkgKiB3TXVsdGlwbGllcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogKCAxNi4wLzEyLjApICogd011bHRpcGxpZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqICggMTYuMC8xMi4wKSAqIHdNdWx0aXBsaWVyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiAoIDE2LjAvMTIuMCkgKiB3TXVsdGlwbGllcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTNTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlM1MubGVuZ3RoXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UzLmxlbmd0aF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IE1hdGgubWF4KDAuMDg2LE1hdGgubWluKDAuMTM1LCBhdXhFbGVtZW50LngpKSArIDAuMDE7XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gTWF0aC5tYXgoMC41NTUsTWF0aC5taW4oMC43MTUsIGF1eEVsZW1lbnQueSkpICsgMC4wNDtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjdXJyZW50UGhhc2UgPSAyO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT0gbW9zcXVpdG9zTGVmdCAtIDEpIHtcbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMSAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxIHNlbGVjdCcpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAyO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB2YXIgd011bHRpcGxpZXIgPSAxLjA7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB3TXVsdGlwbGllciA9IDAuMTI1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB3ID0gdyAqIDAuMTI1O1xuXG4gICAgICAgIHZhciB3TXVsdGlwbGllciA9IDEuMDtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIHdNdWx0aXBsaWVyID0gMC4xMjU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiAoIDE2LjAvMTIuMCkgKiB3TXVsdGlwbGllcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogKCAxNi4wLzEyLjApICogd011bHRpcGxpZXIpO1xuICAgICAgICB9Ki9cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTVbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U1Lmxlbmd0aF07XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTVTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNVMubGVuZ3RoXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGVsZW1lbnQyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKX07XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC4wNzYsTWF0aC5taW4oMC4xNSwgYXV4RWxlbWVudC54KSkgKyAwLjAxO1xuICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IE1hdGgubWF4KDAuODEsTWF0aC5taW4oMC44NiwgYXV4RWxlbWVudC55KSkgKyAwLjA1O1xuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC4xNCB8fCBhdXhFbGVtZW50LnggPD0gMC4wODcpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMC44Mikge1xuICAgICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBhdXhFbGVtZW50LnkgKyAwLjA0O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYXV4RWxlbWVudC55ID49IDAuODMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gYXV4RWxlbWVudC55IC0gMC4wMjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICAvL2VsZW1lbnQueCA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLng7XG4gICAgICAgICAgICAvL2VsZW1lbnQueSA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA0O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB2YXIgd011bHRpcGxpZXIgPSAxLjA7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB3TXVsdGlwbGllciA9IDAuMTI1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDU6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY3VycmVudFBoYXNlID0gMztcblxuICAgICAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwMiAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAyXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3U1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTdTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54ID49IDAuNDIgfHwgYXV4RWxlbWVudC54IDw9IDAuMzkpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDEuMjA2NjEwMTY5NDkxNTI2KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjIwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhdXhFbGVtZW50LnkgPj0gMS4yOCkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4yODtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjQ5KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSAwLjQ5XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPD0gMC4zNikge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC4zNlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55ID49IDEuMykge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4zXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS4xOSkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4xOVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICAvL2VsZW1lbnQueCA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLng7XG4gICAgICAgICAgICAvL2VsZW1lbnQueSA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA2O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB2YXIgd011bHRpcGxpZXIgPSAxLjA7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB3TXVsdGlwbGllciA9IDAuMTI1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDc6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTkubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwMiAucGctYnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDJcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMiAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuXG4gICAgICAgICAgICAgICQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKS5yZW1vdmVDbGFzcyhcImRpc2FibGVkLW9wdGlvblwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5U1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5U1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKX07XG4gICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjg4NSB8fCBhdXhFbGVtZW50LnggPD0gMC44MDYpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS40ODcpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS40ODc7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBlbHNlIGlmIChhdXhFbGVtZW50LnkgPj0gMS41NTgpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS41NTg7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC44OTgpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC44OTg7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54IDw9IDAuNzkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC43OTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPj0gMS41Nykge1xuICAgICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjU3O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA8PSAxLjQ3KSB7XG4gICAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IDEuNDc7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSBhdXhFbGVtZW50LnggKyAwLjA1NztcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IGF1eEVsZW1lbnQueSArIDAuMTE1O1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgLy9lbGVtZW50LnggPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54O1xuICAgICAgICAgICAgLy9lbGVtZW50LnkgPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55O1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gODtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcbiAgICAgICAgdmFyIHdNdWx0aXBsaWVyID0gMS4wO1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgd011bHRpcGxpZXIgPSAwLjEyNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA5OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICAvL2VsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTEubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwMyAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAzXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExLmxlbmd0aF07XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExU1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExUy5sZW5ndGhdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApIC0gMC4wMTgsIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTA7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG4gICAgICAgIHZhciB3TXVsdGlwbGllciA9IDEuMDtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIHdNdWx0aXBsaWVyID0gMC4xMjU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTE6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT0gbW9zcXVpdG9zTGVmdCAtIDEpIHtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAzIC5wZy1idXR0b25cIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwM1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICAgICAgICAgICAkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIikucmVtb3ZlQ2xhc3MoXCJkaXNhYmxlZC1vcHRpb25cIik7XG4gICAgICAgICAgICAgIC8vJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMyAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEzW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTMubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpICogMS4wKSArIDAuMDA1LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSAtIDAuMDEgKyAwLjI3NX07XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxMjtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcbiAgICAgICAgdmFyIHdNdWx0aXBsaWVyID0gMS4wO1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgd011bHRpcGxpZXIgPSAwLjEyNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxMzpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE1W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTUubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTVTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTVTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpICogMS4wKSArIDAuMDA1LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSAtIDAuMDEgKyAwLjI3NX07XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxNDtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcbiAgICAgICAgdmFyIHdNdWx0aXBsaWVyID0gMS4wO1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgd011bHRpcGxpZXIgPSAwLjEyNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNTpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE3W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTcubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTdTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTdTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpICogMS4wKSArIDAuMDA1LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSArIDAuMjc1fTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE2O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB2YXIgd011bHRpcGxpZXIgPSAxLjA7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB3TXVsdGlwbGllciA9IDAuMTI1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE3OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTlbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOVNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOVMubGVuZ3RoXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgLy9lbGVtZW50Mi55ID0gZWxlbWVudDIueSAtIDAuMDA1O1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApICsgMC4zN307XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxODtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcbiAgICAgICAgdmFyIHdNdWx0aXBsaWVyID0gMS4wO1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgd011bHRpcGxpZXIgPSAwLjEyNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxOTpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIxW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjEubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIC8vZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgLSAwLjAwNTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSArIDAuMzd9O1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjA7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG4gICAgICAgIHZhciB3TXVsdGlwbGllciA9IDEuMDtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIHdNdWx0aXBsaWVyID0gMC4xMjU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjE6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vIFRPIERPXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdKVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKHt4OiBlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLnggKyAoKE1hdGgucmFuZG9tKCkgKiAwLjA2NikgLSAwLjAzMyksIHk6IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0ueSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDY2KSAtIDAuMDMzKX0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vZWxlbWVudC54ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICAgICAgICAgIC8vZWxlbWVudC55ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDIyO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAwMztcblxuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB2YXIgd011bHRpcGxpZXIgPSAxLjA7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB3TXVsdGlwbGllciA9IDAuMTI1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIChlbGVtZW50LnggKiBjYW52YXMud2lkdGgpICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gIH0pO1xufVxuLy9BbmltYXRlIGJlaGF2aW9yIGVsZW1lbnRzXG52YXIgYW5pbWF0ZUJlaGF2aW9yRWxlbWVudHMgPSBmdW5jdGlvbigpIHtcbiAgJChkb2N1bWVudCkub24oXCJtb3VzZWVudGVyXCIsIFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbjpub3QoLmRpc2FibGVkLW9wdGlvbilcIiwgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEkKHRoaXMpLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgICQodGhpcykuZmluZChcImltZ1wiKS5hdHRyKFwic3JjXCIsIFwiLi9pbWFnZXMvXCIgKyBob3ZlckJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gIH0pO1xuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlbGVhdmVcIiwgXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKVwiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoISQodGhpcykuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkge1xuICAgICAgJCh0aGlzKS5maW5kKFwiaW1nXCIpLmF0dHIoXCJzcmNcIiwgXCIuL2ltYWdlcy9cIiArIGJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gIH0pO1xufTtcbi8vQW5pbWF0ZSBwcmVnbmFuY3kgZWxlbWVudHNcbnZhciBhbmltYXRlRWxlbWVudHNQcmVnbmFuY3kgPSBmdW5jdGlvbigpIHtcbiAgJChkb2N1bWVudCkub24oXCJtb3VzZWVudGVyXCIsIFwiLnBnU3RlcF9fcHJlZ25hbmN5LW9rXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJChcIiNsZWZ0LWdsYXNzLWNvdmVyLWhvcml6b250YWwsICNsZWZ0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNsZWZ0LWdsYXNzLWNvdmVyLWhvcml6b250YWxcIikud2lkdGgoKSAqIDAuMDAxKSArIFwicHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoXCIjbGVmdC1nbGFzcy1jb3ZlciwgI2xlZnQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNsZWZ0LWdsYXNzLWNvdmVyXCIpLmhlaWdodCgpICogMC4wMDEpICsgXCJweFwiXG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgJChkb2N1bWVudCkub24oXCJtb3VzZWxlYXZlXCIsIFwiLnBnU3RlcF9fcHJlZ25hbmN5LW9rXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJChcIiNsZWZ0LWdsYXNzLWNvdmVyLWhvcml6b250YWwsICNsZWZ0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIwcHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoXCIjbGVmdC1nbGFzcy1jb3ZlciwgI2xlZnQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIwcHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VlbnRlclwiLCBcIi5wZ1N0ZXBfX3ByZWduYW5jeS1rb1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXItaG9yaXpvbnRhbCwgI3JpZ2h0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNyaWdodC1nbGFzcy1jb3Zlci1ob3Jpem9udGFsXCIpLndpZHRoKCkgKiAwLjAwMSkgKyBcInB4XCJcbiAgICAgICAgfSwgMjAwKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAkKFwiI3JpZ2h0LWdsYXNzLWNvdmVyLCAjcmlnaHQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNyaWdodC1nbGFzcy1jb3ZlclwiKS5oZWlnaHQoKSAqIDAuMDAxKSArIFwicHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgIFxuICAgIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VsZWF2ZVwiLCBcIi5wZ1N0ZXBfX3ByZWduYW5jeS1rb1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXItaG9yaXpvbnRhbCwgI3JpZ2h0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIwcHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXIsICNyaWdodC1nbGFzcy1jb3Zlci1taWRcIikuYW5pbWF0ZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIjBweFwiXG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cbi8vU2V0dXAgY2FudmFzXG52YXIgc2V0dXBDYW52YXMgPSBmdW5jdGlvbigpe1xuICBjYW52YXMyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VsZW1lbnRzQ2FudmFzJyk7XG4gIGNhbnZhczIud2lkdGggPSAkKCcucGdDaGFydC13cmFwcGVyJykud2lkdGgoKTtcbiAgY2FudmFzMi5oZWlnaHQgPSAkKCcucGdDaGFydC13cmFwcGVyJykuaGVpZ2h0KCkgKyAwO1xuICBjYW52YXMyLnN0eWxlLndpZHRoICA9IGNhbnZhczIud2lkdGgudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY2FudmFzMi5zdHlsZS5oZWlnaHQgPSBjYW52YXMyLmhlaWdodC50b1N0cmluZygpICsgXCJweFwiO1xuICBjb250ZXh0MiA9IGNhbnZhczIuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY29udGV4dDIuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5cbiAgY2FudmFzMyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhbmltYXRpb25DYW52YXMnKTtcbiAgY2FudmFzMy53aWR0aCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS53aWR0aCgpO1xuICBjYW52YXMzLmhlaWdodCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS5oZWlnaHQoKTtcbiAgY2FudmFzMy5zdHlsZS53aWR0aCAgPSBjYW52YXMzLndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczMuc3R5bGUuaGVpZ2h0ID0gY2FudmFzMy5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDMgPSBjYW52YXMzLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQzLmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb3NxdWl0b3NDYW52YXMnKTtcbiAgY2FudmFzLndpZHRoID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLndpZHRoKCk7XG4gIGNhbnZhcy5oZWlnaHQgPSAkKCcucGdDaGFydC13cmFwcGVyJykuaGVpZ2h0KCk7XG4gIGNhbnZhcy5zdHlsZS53aWR0aCAgPSBjYW52YXMud2lkdGgudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBjb250ZXh0LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNhbnZhczQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaG92ZXJDYW52YXMnKTtcbiAgY2FudmFzNC53aWR0aCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS53aWR0aCgpO1xuICBjYW52YXM0LmhlaWdodCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS5oZWlnaHQoKTtcbiAgY2FudmFzNC5zdHlsZS53aWR0aCAgPSBjYW52YXM0LndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczQuc3R5bGUuaGVpZ2h0ID0gY2FudmFzNC5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDQgPSBjYW52YXM0LmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQ0LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNhbnZhczUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2xhc3NBbmltYXRpb25DYW52YXMnKTtcbiAgY2FudmFzNS53aWR0aCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS53aWR0aCgpO1xuICBjYW52YXM1LmhlaWdodCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS5oZWlnaHQoKTtcbiAgY2FudmFzNS5zdHlsZS53aWR0aCAgPSBjYW52YXM1LndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczUuc3R5bGUuaGVpZ2h0ID0gY2FudmFzNS5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDUgPSBjYW52YXM1LmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQ1LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNvbnRleHQuY2FudmFzLndpZHRoLCBjb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICBjb250ZXh0Mi5jbGVhclJlY3QoMCwgMCwgY29udGV4dC5jYW52YXMud2lkdGgsIGNvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gIGNvbnRleHQzLmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0LmNhbnZhcy53aWR0aCwgY29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgY29udGV4dDQuY2xlYXJSZWN0KDAsIDAsIGNvbnRleHQuY2FudmFzLndpZHRoLCBjb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICBjb250ZXh0NS5jbGVhclJlY3QoMCwgMCwgY29udGV4dDUuY2FudmFzLndpZHRoLCBjb250ZXh0NS5jYW52YXMuaGVpZ2h0KTtcbiAgXG4gIGNvbnRleHQyLmZpbGxTdHlsZSA9IFwiI2Y4ZjhmOFwiO1xuICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgLypjb250ZXh0Mi5maWxsUmVjdCgkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxJykucG9zaXRpb24oKS5sZWZ0LCAwLCAkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpLCBjYW52YXMyLmhlaWdodCk7XG4gICAgY29udGV4dDIuZmlsbFJlY3QoJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLnBvc2l0aW9uKCkubGVmdCwgMCwgJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSwgY2FudmFzMi5oZWlnaHQpO1xuICAgIGNvbnRleHQyLmZpbGxSZWN0KCQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5wb3NpdGlvbigpLmxlZnQsIDAsICQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCksIGNhbnZhczIuaGVpZ2h0KTsqL1xuICB9XG4gIGVsc2Uge1xuICAgIGNvbnRleHQyLmZpbGxSZWN0KDAsIGdldE9mZnNldCgkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxJylbMF0pLnRvcCAtIGdldE9mZnNldCgkKFwiLnBnQXJ0aWNsZVwiKVswXSkudG9wIC0gJCgnI25hdi1iYXInKS5oZWlnaHQoKSwgY2FudmFzMi53aWR0aCwgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLmhlaWdodCgpKTtcbiAgICBjb250ZXh0Mi5maWxsUmVjdCgwLCBnZXRPZmZzZXQoJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpWzBdKS50b3AgLSBnZXRPZmZzZXQoJChcIi5wZ0FydGljbGVcIilbMF0pLnRvcCAtICQoJyNuYXYtYmFyJykuaGVpZ2h0KCksIGNhbnZhczIud2lkdGgsICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjInKS5oZWlnaHQoKSk7XG4gICAgY29udGV4dDIuZmlsbFJlY3QoMCwgZ2V0T2Zmc2V0KCQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKVswXSkudG9wIC0gZ2V0T2Zmc2V0KCQoXCIucGdBcnRpY2xlXCIpWzBdKS50b3AgLSAkKCcjbmF2LWJhcicpLmhlaWdodCgpLCBjYW52YXMyLndpZHRoLCAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykuaGVpZ2h0KCkpO1xuICB9XG5cbiAgdmFyIHBpY3R1cmUxID0gbmV3IEltYWdlKCk7XG4gIHBpY3R1cmUxLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgLy9jb250ZXh0Mi5kcmF3SW1hZ2UocGljdHVyZTEsIHBhcnNlSW50KCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgLSAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAqIDAuNTUpIC0gKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjA2NCkpLCAwLCBwYXJzZUludCgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC41NSksIHBhcnNlSW50KCgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC41NSkgKiAoNTM2LjAvNjU2LjApKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHBpY3R1cmUxLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC41NSkgLSAoY2FudmFzLndpZHRoICogMC4wNjQpKSwgMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC41NSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjU1KSAqICg1MzYuMC82NTYuMCkpKTtcbiAgICB9XG4gICAgICB2YXIgcGljdHVyZTFIb3ZlciA9IG5ldyBJbWFnZSgpO1xuICAgICAgcGljdHVyZTFIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgLy9jb250ZXh0NC5kcmF3SW1hZ2UocGljdHVyZTFIb3ZlciwgcGFyc2VJbnQoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAtICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC41NSkgLSAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAqIDAuMDY0KSksIDAsIHBhcnNlSW50KCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjU1KSwgcGFyc2VJbnQoKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjU1KSAqICg1MzYuMC82NTYuMCkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0NC5kcmF3SW1hZ2UocGljdHVyZTFIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoIC0gKGNhbnZhcy53aWR0aCAqIDAuNTUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMDY0KSksIDAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuNTUpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC41NSkgKiAoNTM2LjAvNjU2LjApKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29udGV4dDQuZHJhd0ltYWdlKHBpY3R1cmUxSG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjU1KSAtIChjYW52YXMud2lkdGggKiAwLjA2NCkpLCAwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjU1KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNTUpICogKDUzNi4wLzY1Ni4wKSkpO1xuICAgICAgfSk7XG4gICAgICBwaWN0dXJlMUhvdmVyLnNyYyA9ICcuL2ltYWdlcy90ZXJyYXJpdW0taG92ZXIucG5nJztcblxuICAgICAgdmFyIHR1YmUxID0gbmV3IEltYWdlKCk7XG4gICAgICB0dWJlMS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgLy9jb250ZXh0Mi5kcmF3SW1hZ2UodHViZTEsIHBhcnNlSW50KCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgLSAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAqIDAuNTUpIC0gKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjA1ODUpIC0gKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjM2MDUxKSksIHBhcnNlSW50KCgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC4zNjA1MSkgKiAoMzAwLjAvNDMwLjApKSAqIDAuNTUsIHBhcnNlSW50KCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjM2MDUxKSwgcGFyc2VJbnQoKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjM2MDUxKSAqICgzMDAuMC80MzAuMCkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTEsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjU1KSAtIChjYW52YXMud2lkdGggKiAwLjA1ODUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMzYwNTEpKSwgMjM1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjM2MDUxKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMzYwNTEpICogKDMwMC4wLzQzMC4wKSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHR1YmUxLnNyYyA9ICcuL2ltYWdlcy90dWJlMS5wbmcnO1xuICB9KTtcbiAgcGljdHVyZTEuc3JjID0gJy4vaW1hZ2VzL3RlcnJhcml1bS5wbmcnO1xuXG4gIHZhciB0dWJlMiA9IG5ldyBJbWFnZSgpO1xuICB0dWJlMi5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDM0NSksIDUzMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xNDY3MiksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjE0NjcyKSAqICg2MjIuMC8xNzUuMCkpKTtcbiAgICB9XG4gIH0pO1xuICB0dWJlMi5zcmMgPSAnLi9pbWFnZXMvdHViZTIucG5nJztcblxuICB2YXIgdHViZTMgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTMuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmUzLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjA1NDUpLCAxMTE1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjgwNzMpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC44MDczKSAqICg1MTcuMC85NjMuMCkpKTtcbiAgICB9XG4gICAgdmFyIHR1YmUzSG92ZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICB0dWJlM0hvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29udGV4dDQuZHJhd0ltYWdlKHR1YmUzSG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDU0NSksIDExMTUsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuODA3MyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjgwNzMpICogKDUxNy4wLzk2My4wKSkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHR1YmUzSG92ZXIuc3JjID0gJy4vaW1hZ2VzL3R1YmUzLWhvdmVyLnBuZyc7XG4gIH0pO1xuICB0dWJlMy5zcmMgPSAnLi9pbWFnZXMvdHViZTMucG5nJztcblxuICB2YXIgdHViZTUgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTUuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmU1LCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC44MDE1KSAtIChjYW52YXMud2lkdGggKiAwLjEzMykpLCAyMTIwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjgwMTUpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC44MDE1KSAqICg1MTAuMC85NTYuMCkpKTtcbiAgICB9XG5cbiAgICB2YXIgdHViZTVIb3ZlciA9IG5ldyBJbWFnZSgpO1xuICAgIHR1YmU1SG92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb250ZXh0NC5kcmF3SW1hZ2UodHViZTVIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoIC0gKGNhbnZhcy53aWR0aCAqIDAuODAxNSkgLSAoY2FudmFzLndpZHRoICogMC4xMzMpKSwgMjEyMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC44MDE1KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuODAxNSkgKiAoNTEwLjAvOTU2LjApKSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdHViZTVIb3Zlci5zcmMgPSAnLi9pbWFnZXMvdHViZTUtaG92ZXIucG5nJzsgIFxuXG4gICAgdmFyIHR1YmU0ID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTQsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjEzNTgpIC0gKGNhbnZhcy53aWR0aCAqIDAuMDgpKSAtIDMsIDE2MTgsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTM1OCksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjEzNTgpICogKDYwMC4wLzE2Mi4wKSkpO1xuICAgICAgfVxuICAgICAgdmFyIHR1YmU0SG92ZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIHR1YmU0SG92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZSh0dWJlNEhvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC4xMzU4KSAtIChjYW52YXMud2lkdGggKiAwLjA4KSkgLSAzLCAxNjE4LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjEzNTgpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC4xMzU4KSAqICg2MDAuMC8xNjIuMCkpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0dWJlNEhvdmVyLnNyYyA9ICcuL2ltYWdlcy90dWJlNC1ob3Zlci5wbmcnO1xuICAgIH0pO1xuICAgIHR1YmU0LnNyYyA9ICcuL2ltYWdlcy90dWJlNC5wbmcnO1xuXG4gIH0pO1xuICB0dWJlNS5zcmMgPSAnLi9pbWFnZXMvdHViZTUucG5nJzsgIFxuXG4gIHZhciB0dWJlNiA9IG5ldyBJbWFnZSgpO1xuICB0dWJlNi5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTYsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDI4KSwgMjYyMSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMzgzKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTM4MykgKiAoNTkyLjAvMTY1LjApKSk7XG4gICAgfVxuICAgIHZhciB0dWJlNkhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTZIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZSh0dWJlNkhvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjAyOCksIDI2MjEsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTM4MyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjEzODMpICogKDU5Mi4wLzE2NS4wKSkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHR1YmU2SG92ZXIuc3JjID0gJy4vaW1hZ2VzL3R1YmU2LWhvdmVyLnBuZyc7XG4gIH0pO1xuICB0dWJlNi5zcmMgPSAnLi9pbWFnZXMvdHViZTYucG5nJztcblxuICB2YXIgdHViZTcgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmU3LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjA2KSwgMzIwMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC42NzA3KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNjcwNykgKiAoNTUyLjAvODAwLjApKSk7XG4gICAgfVxuICAgIHZhciBjb3ZlckdsYXNzID0gbmV3IEltYWdlKCk7XG4gICAgY292ZXJHbGFzcy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29udGV4dDMuZHJhd0ltYWdlKGNvdmVyR2xhc3MsIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjI5MSksIDM0MTUsIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjEyNSksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMjUpICogKDIyNC4wLzE0OS4wKSkpO1xuICAgICAgY29udGV4dDMuZHJhd0ltYWdlKGNvdmVyR2xhc3MsIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjU5NzUpLCAzNDE1LCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMjUpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTI1KSAqICgyMjQuMC8xNDkuMCkpKTtcbiAgICAgIFxuICAgICAgbGVmdENvdmVyR2xhc3MgPSBuZXcgQ2FudmFzSW1hZ2UoW2NvdmVyR2xhc3NdLCAwLjI5MSwgKDM0MTUuMC9jYW52YXMzLndpZHRoKSwgMCwgMC4wMDA1LCAwLCAwLCBuZXcgQXJyYXkoe3g6MC4yOTEseTooMzQxNS4wL2NhbnZhczMud2lkdGgpfSkpO1xuICAgICAgcmlnaHRDb3ZlckdsYXNzID0gbmV3IENhbnZhc0ltYWdlKFtjb3ZlckdsYXNzXSwgMC41OTc1LCAoMzQxNS4wL2NhbnZhczMud2lkdGgpLCAwLCAwLjAwMDUsIDAsIDAsIG5ldyBBcnJheSh7eDowLjU5NzUseTooMzQxNS4wL2NhbnZhczMud2lkdGgpfSkpXG5cbiAgICAgIGlmIChsZWZ0Q292ZXJHbGFzcyA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5WzBdLngpIHtcbiAgICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MueSA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5WzBdLnkpIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzcyA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVswXS54KSB7XG4gICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzLnkgPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbMF0ueSkge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHR1YmU3SG92ZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIHR1YmU3SG92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29udGV4dDQuZHJhd0ltYWdlKHR1YmU3SG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDYpLCAzMjAwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjY3MDcpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC42NzA3KSAqICg1NTIuMC84MDAuMCkpKTtcbiAgICAgICAgXG4gICAgICAgIGNvdmVyR2xhc3NIb3ZlciA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBjb3ZlckdsYXNzSG92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvL2NvbnRleHQ1LmRyYXdJbWFnZShjb3ZlckdsYXNzSG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMjk4KSwgMzU5MywgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMTMpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC4xMTMpICogKDQyLjAvMTM1LjApKSk7XG4gICAgICAgICAgLy9jb250ZXh0NS5kcmF3SW1hZ2UoY292ZXJHbGFzc0hvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjYwNSksIDM1OTMsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTEzKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTEzKSAqICg0Mi4wLzEzNS4wKSkpO1xuICAgICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIgPSBuZXcgQ2FudmFzSW1hZ2UoW2NvdmVyR2xhc3NIb3Zlcl0sIDAuMjk4LCAoMzU5My4wL2NhbnZhczMud2lkdGgpLCAwLCAwLjAwMDUsIDAsIDAsIG5ldyBBcnJheSh7eDowLjI5OCx5OigzNTkzLjAvY2FudmFzMy53aWR0aCl9KSk7XG4gICAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIgPSBuZXcgQ2FudmFzSW1hZ2UoW2NvdmVyR2xhc3NIb3Zlcl0sIDAuNjA1LCAoMzU5My4wL2NhbnZhczMud2lkdGgpLCAwLCAwLjAwMDUsIDAsIDAsIG5ldyBBcnJheSh7eDowLjYwNSx5OigzNTkzLjAvY2FudmFzMy53aWR0aCl9KSlcbiAgICAgICAgfSk7XG4gICAgICAgIGNvdmVyR2xhc3NIb3Zlci5zcmMgPSAnLi9pbWFnZXMvY292ZXItZ2xhc3MtYW5pbWF0ZS5wbmcnO1xuXG4gICAgICB9KTtcbiAgICAgIHR1YmU3SG92ZXIuc3JjID0gJy4vaW1hZ2VzL3R1YmU3LWhvdmVyLnBuZyc7XG4gICAgfSk7XG4gICAgY292ZXJHbGFzcy5zcmMgPSAnLi9pbWFnZXMvY292ZXItZ2xhc3MucG5nJztcbiAgfSk7XG4gIHR1YmU3LnNyYyA9ICcuL2ltYWdlcy90dWJlNy5wbmcnO1xuXG4gIHZhciBjaGFydCA9IG5ldyBJbWFnZSgpO1xuICBjaGFydC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQyLmRyYXdJbWFnZShjaGFydCwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNSkgLSAoY2FudmFzLndpZHRoICogMC43NyAqIDAuNSkpLCAzNzU1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjc3KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNzcpICogKDMxNS4wLzkxMi4wKSkpO1xuICB9KTtcbiAgY2hhcnQuc3JjID0gJy4vaW1hZ2VzL2xhc3QtY2hhcnQucG5nJztcblxuICB2YXIgY2hhcnQyID0gbmV3IEltYWdlKCk7XG4gIGNoYXJ0Mi5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQyLmRyYXdJbWFnZShjaGFydDIsIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjUpIC0gKGNhbnZhcy53aWR0aCAqIDAuNzAyNiAqIDAuNSkpLCA0MDU1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjcwMjYpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC43MDI2KSAqICgxODguMC84MzguMCkpKTtcbiAgfSk7XG4gIGNoYXJ0Mi5zcmMgPSAnLi9pbWFnZXMvZ3JhcGhpYy5wbmcnO1xufVxuLy9EcmF3IGFuIGltYWdlIHJvdGF0ZWRcbnZhciBUT19SQURJQU5TID0gTWF0aC5QSS8xODA7IFxuZnVuY3Rpb24gZHJhd1JvdGF0ZWRJbWFnZShpbWFnZSwgeCwgeSwgYW5nbGUsIGF1eEN0eCkgeyBcbiBcbiAgLy8gc2F2ZSB0aGUgY3VycmVudCBjby1vcmRpbmF0ZSBzeXN0ZW0gXG4gIC8vIGJlZm9yZSB3ZSBzY3JldyB3aXRoIGl0XG4gIGF1eEN0eC5zYXZlKCk7IFxuIFxuICAvLyBtb3ZlIHRvIHRoZSBtaWRkbGUgb2Ygd2hlcmUgd2Ugd2FudCB0byBkcmF3IG91ciBpbWFnZVxuICBhdXhDdHgudHJhbnNsYXRlKHggKyAoaW1hZ2Uud2lkdGgvMiksIHkgKyAoaW1hZ2UuaGVpZ2h0LzIpKTtcbiBcbiAgLy8gcm90YXRlIGFyb3VuZCB0aGF0IHBvaW50LCBjb252ZXJ0aW5nIG91ciBcbiAgLy8gYW5nbGUgZnJvbSBkZWdyZWVzIHRvIHJhZGlhbnMgXG4gIGF1eEN0eC5yb3RhdGUoYW5nbGUpO1xuIFxuICAvLyBkcmF3IGl0IHVwIGFuZCB0byB0aGUgbGVmdCBieSBoYWxmIHRoZSB3aWR0aFxuICAvLyBhbmQgaGVpZ2h0IG9mIHRoZSBpbWFnZSBcbiAgYXV4Q3R4LmRyYXdJbWFnZShpbWFnZSwgLShpbWFnZS53aWR0aC8yKSwgLShpbWFnZS5oZWlnaHQvMikpO1xuIFxuICAvLyBhbmQgcmVzdG9yZSB0aGUgY28tb3JkcyB0byBob3cgdGhleSB3ZXJlIHdoZW4gd2UgYmVnYW5cbiAgYXV4Q3R4LnJlc3RvcmUoKTsgLy9cbn1cbi8vU2V0dXAgbW9zcXVpdG9zXG52YXIgc2V0dXBNb3NxdWl0b3MgPSBmdW5jdGlvbigpIHtcbiAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vc3F1aXRvc0NhbnZhcycpO1xuXG4gIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICBjYW52YXMud2lkdGggPSAkKCcuaG9yaXpvbnRhbC1iYWNrZ3JvdW5kIGltZycpLndpZHRoKCk7XG4gICAgY2FudmFzLmhlaWdodCA9ICQoJy5ob3Jpem9udGFsLWJhY2tncm91bmQgaW1nJykuaGVpZ2h0KCk7XG4gICAgY2FudmFzLnN0eWxlLndpZHRoICA9IGNhbnZhcy53aWR0aC50b1N0cmluZygpICsgXCJweFwiO1xuICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBjYW52YXMuaGVpZ2h0LnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIH1cbiAgZWxzZSB7XG4gICAgY2FudmFzLndpZHRoID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLndpZHRoKCk7XG4gICAgY2FudmFzLmhlaWdodCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS5oZWlnaHQoKTtcbiAgICBjYW52YXMuc3R5bGUud2lkdGggID0gY2FudmFzLndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgfVxuXG4gIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY29udGV4dC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcblxuICB2YXIgbW9zcXVpdG8gPSBuZXcgSW1hZ2UoKTtcbiAgbW9zcXVpdG8uYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAvL1xuICB9KTtcbiAgbW9zcXVpdG8uc3JjID0gJy4vaW1hZ2VzL21vc3F1aXRvMV9sZWZ0LnBuZyc7XG4gIHZhciBtb3NxdWl0bzIgPSBuZXcgSW1hZ2UoKTtcbiAgbW9zcXVpdG8yLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy9cbiAgfSk7XG4gIG1vc3F1aXRvMi5zcmMgPSAnLi9pbWFnZXMvbW9zcXVpdG8yX2xlZnQucG5nJztcbiAgdmFyIG1vc3F1aXRvRmxpcHBlZCA9IG5ldyBJbWFnZSgpO1xuICBtb3NxdWl0b0ZsaXBwZWQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAvL1xuICB9KTtcbiAgbW9zcXVpdG9GbGlwcGVkLnNyYyA9ICcuL2ltYWdlcy9tb3NxdWl0bzFfbGVmdC5wbmcnO1xuICB2YXIgbW9zcXVpdG8yRmxpcHBlZCA9IG5ldyBJbWFnZSgpO1xuICBtb3NxdWl0bzJGbGlwcGVkLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy9cbiAgfSk7XG4gIG1vc3F1aXRvMkZsaXBwZWQuc3JjID0gJy4vaW1hZ2VzL21vc3F1aXRvMl9sZWZ0LnBuZyc7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3RhbE1vc3F1aXRvczsgaSsrKSB7XG4gICAgXG5cbiAgICBtb3NxdWl0b3NBcnJheS5wdXNoKG5ldyBDYW52YXNJbWFnZShbbW9zcXVpdG8vKiwgbW9zcXVpdG8yKi9dLCAwLCAwLCAwLCAwLjAwMSArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpLCAwLCAwLCBuZXcgQXJyYXkoKSkpO1xuXG4gICAgbW9zcXVpdG9zQXJyYXlbaV0uZmxpcHBlZEltYWdlcyA9IG5ldyBBcnJheShtb3NxdWl0b0ZsaXBwZWQvKiwgbW9zcXVpdG8yRmxpcHBlZCovKTtcbiAgICBcbiAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTFbaSVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEubGVuZ3RoXTtcblxuICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgXG4gICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KSB7XG4gICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50LnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudC55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC41MSwgTWF0aC5taW4oMC45NSwgYXV4RWxlbWVudC54KSkgKyAwLjAyO1xuICAgICAgYXV4RWxlbWVudC55ID0gTWF0aC5tYXgoMC4xLCBNYXRoLm1pbigwLjMsIGF1eEVsZW1lbnQueSkpO1xuXG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgIGF1eEVsZW1lbnQueCA9IGF1eEVsZW1lbnQueDtcbiAgICAgICAgYXV4RWxlbWVudC55ID0gYXV4RWxlbWVudC55ICsgMC4yNztcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDAuMSAmJiBhdXhFbGVtZW50LnggPD0gMC40OSkge1xuICAgICAgICAgIGF1eEVsZW1lbnQueCA9IGF1eEVsZW1lbnQueCArIDAuMjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICB9KTtcblxuICAgIG1vc3F1aXRvc0FycmF5W2ldLmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1vc3F1aXRvc0FycmF5W2ldLnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG4gICAgbW9zcXVpdG9zQXJyYXlbaV0ueCA9IG1vc3F1aXRvc0FycmF5W2ldLnBvc2l0aW9uc0FycmF5W21vc3F1aXRvc0FycmF5W2ldLmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICBtb3NxdWl0b3NBcnJheVtpXS55ID0gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXlbbW9zcXVpdG9zQXJyYXlbaV0uY3VycmVudFBvc2l0aW9uXS55O1xuXG4gICAgdmFyIG5leHRQb3NpdGlvbiA9IG1vc3F1aXRvc0FycmF5W2ldLmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgaWYgKG5leHRQb3NpdGlvbiA+PSBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgfVxuXG4gICAgaWYgKG1vc3F1aXRvc0FycmF5W2ldLnggPiBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgIG1vc3F1aXRvc0FycmF5W2ldLnhEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtb3NxdWl0b3NBcnJheVtpXS54RGlyID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKG1vc3F1aXRvc0FycmF5W2ldLnkgPiBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgIG1vc3F1aXRvc0FycmF5W2ldLnlEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtb3NxdWl0b3NBcnJheVtpXS55RGlyID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cbi8vRGVjaWRlIG5leHQgc3RlcCBhY3Rpb25zXG52YXIgZGVjaWRlTmV4dFN0ZXAgPSBmdW5jdGlvbihuZXh0U3RlcCl7XG4gIHN3aXRjaCAobmV4dFN0ZXApIHtcbiAgICBjYXNlIDA6XG4gICAgICAkKCcjcGdTdGVwMSAucGctYnV0dG9uJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcjcGdTdGVwMScpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyU1swXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyWzBdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTtcbiAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDEwKTtcbiAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogNTAwKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsTGVmdDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLm9mZnNldCgpLmxlZnRcbiAgICAgICAgfSwgMjAwMCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLm9mZnNldCgpLnRvcFxuICAgICAgICB9LCAyMDAwKTtcbiAgICAgIH1cbiAgICAgIFxuICAgIGJyZWFrO1xuICAgIGNhc2UgMTpcbiAgICBcbiAgICAgIHZhciBhdXhNb3NxdWl0b3NMZWZ0ID0gbW9zcXVpdG9zTGVmdDtcbiAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdCgwLCAyLCBwYXJzZUludCgkKCcjdmlzaXQtY291bnRyeScpLnZhbCgpKSk7XG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaW5kZXggPiBhdXhNb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U0U1swXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFNbMF1baV0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZTWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2U1swXVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA1O1xuICAgICAgICAgICAgICAgIC8qZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThTWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4U1swXVtpXSk7XG4gICAgICAgICAgICAgICAgfSovXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF1baV0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZbMF1baV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFswXVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA3O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2U1swXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlNbMF1baV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKmZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4U1swXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFNbMF1baV0pO1xuICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA1O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2WzBdW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF1baV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gNztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDMpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDAzKSovO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMTUpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgJChcIiNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjFcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnUXVlc3Rpb24tY29udGFpbmVyMSBzZWxlY3RcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAvLyQoXCIjcGdTdGVwMiAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoXCIjcGdTdGVwMlwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG5cbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJCgnLnBnQ2hhcnQnKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdTdGVwMicpLnBvc2l0aW9uKCkubGVmdFxuICAgICAgICB9LCAzMDAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAvKnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykucG9zaXRpb24oKS5sZWZ0XG4gICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICB9LCAzMDAwKTsqL1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsVG9wOiAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykub2Zmc2V0KCkudG9wXG4gICAgICAgIH0sIDMwMDApO1xuICAgICAgfVxuICAgIGJyZWFrO1xuICAgIGNhc2UgMjpcbiAgICAgICQoJyNwZ1N0ZXAyIC5wZy1idXR0b24nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoXCIjcGdTdGVwMlwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThTWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDIpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDIpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA3O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA3ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAxMCk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJCgnLnBnQ2hhcnQnKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgc2Nyb2xsTGVmdDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLnBvc2l0aW9uKCkubGVmdFxuICAgICAgICAgICAgfSwgMjUwMCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLm9mZnNldCgpLnRvcFxuICAgICAgICB9LCAyNTAwKTtcbiAgICAgIH1cbiAgICBicmVhaztcbiAgICBjYXNlIDM6XG5cbiAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjIgLnBnLWJ1dHRvbicpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpLmFkZENsYXNzKFwiZGlzYWJsZWQtb3B0aW9uXCIpO1xuICAgICAgLy8kKFwiI3BnU3RlcDMgLnBnLWJ1dHRvblwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnU3RlcDNcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFNbMF1baV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8qZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyU1swXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyU1swXVtpXSk7XG4gICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gOTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTBbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFswXVtpXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTJbMF1baV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMjApO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbExlZnQ6ICQoJyNwZ1N0ZXAzJykucG9zaXRpb24oKS5sZWZ0XG4gICAgICAgIH0sIDEwMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIC8qc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgIHNjcm9sbExlZnQ6ICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICAgIH0sIDMwMDApOyovXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG5cbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMycpLm9mZnNldCgpLnRvcFxuICAgICAgICB9LCAyNTAwKTtcbiAgICAgIH1cbiAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICAkKFwiI3BnU3RlcDMgLnBnLWJ1dHRvblwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoXCIjcGdTdGVwM1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTJTWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxMTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMTApO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJCgnLnBnQ2hhcnQnKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykucG9zaXRpb24oKS5sZWZ0XG4gICAgICAgIH0sIDI1MDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxUb3A6ICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5vZmZzZXQoKS50b3BcbiAgICAgICAgfSwgMjUwMCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdCg0LCAzLCAhJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKTtcblxuICAgICAgICBwcmVnbmFudE1vc3F1aXRvcyA9IG1vc3F1aXRvc0xlZnQgKiAwLjc1O1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBwcmVnbmFudE1vc3F1aXRvcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMThTWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE4WzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxNztcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMyAucGctYnV0dG9uJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvbicpLmFkZENsYXNzKFwiZGlzYWJsZWQtb3B0aW9uXCIpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPj0gcHJlZ25hbnRNb3NxdWl0b3MgJiYgaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjBbMF07XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjBTWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdXJyZW50UGhhc2UgPSAyMDtcblxuICAgICAgICAgICAgJChcIiNwZ1N0ZXA0XCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuXG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE5O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA3ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsTGVmdDogJCgnI3BnU3RlcDQnKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgfSwgMjUwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxUb3A6ICQoJyNwZ1N0ZXA0Jykub2Zmc2V0KCkudG9wXG4gICAgICAgIH0sIDI1MDApO1xuICAgICAgfVxuICAgICAgfSwgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkgPyAwIDogMzI1MCk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gIH1cbn07XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgU3RlcHNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLy9EZWFscyB3aXRoIHRoZSBzY3JvbGxpbmcgYmV0d2VlbiBzdGVwcyBhbmQgcXVlc3Rpb25zXG52YXIgbWFuYWdlU3RlcHNBY3Rpb24gPSBmdW5jdGlvbigpe1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnU3RlcF9faW5mb19fdGV4dC1hY3Rpb24nLCBmdW5jdGlvbigpe1xuICAgIHZhciBuZXh0U3RlcCA9IHBhcnNlSW50KCQodGhpcykuYXR0cignZGF0YS1zdGVwJykpO1xuICAgIGRlY2lkZU5leHRTdGVwKG5leHRTdGVwKTtcbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCAnc2VsZWN0I3Zpc2l0LWNvdW50cnknLCBmdW5jdGlvbigpe1xuICAgIHZhciBuZXh0U3RlcCA9IHBhcnNlSW50KCQodGhpcykuYXR0cignZGF0YS1zdGVwJykgKyAxKTtcbiAgICBkZWNpZGVOZXh0U3RlcChuZXh0U3RlcCk7XG4gIH0pO1xufTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFF1ZXN0aW9uc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vL0RlYWxzIHdpdGggdGhlIHNjcm9sbGluZyBiZXR3ZWVuIHF1ZXN0aW9uc1xudmFyIG1hbmFnZVF1ZXN0aW9uc1Njcm9sbCA9IGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgJ3NlbGVjdCNob21lLWNvdW50cnknLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV4dFBvc2l0aW9uID0gJCh0aGlzKS5hdHRyKCdkYXRhLXBvcycpLFxuICAgICAgY3VycmVudFN0ZXAgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtc3RlcCcpO1xuXG4gICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2N1cnJlbnRTdGVwXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbY3VycmVudFN0ZXBdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwtNTAlLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pO1xuXG4gICAgICBpZiAoY3VycmVudFN0ZXAgPT0gMCAmJiBuZXh0UG9zaXRpb24gPT0gMSkge1xuICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sIHBhcnNlSW50KCQoJyNob21lLWNvdW50cnknKS52YWwoKSkpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRTWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMztcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdRdWVzdGlvbi1hY3Rpb24nLCBmdW5jdGlvbigpe1xuICAgICQodGhpcykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgdmFyIG5leHRQb3NpdGlvbiA9ICQodGhpcykuYXR0cignZGF0YS1wb3MnKSxcbiAgICAgIGN1cnJlbnRTdGVwID0gJCh0aGlzKS5hdHRyKCdkYXRhLXN0ZXAnKTtcblxuICAgIHZhciBhdXhDdXJyZW50U3RlcCA9IGN1cnJlbnRTdGVwO1xuICAgIGlmIChuZXh0UG9zaXRpb24gIT0gLTEpIHtcbiAgICAgIFxuICAgICAgaWYgKGN1cnJlbnRTdGVwID09IDMpIHtcbiAgICAgICAgYXV4Q3VycmVudFN0ZXAgPSAyO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgJHF1ZXN0aW9uQ29udGFpbmVyID0gJCgkKCcucGdRdWVzdGlvbi1jb250YWluZXInKVthdXhDdXJyZW50U3RlcF0pLFxuICAgICAgICBuZXdUcmFuc2xhdGlvblZhbHVlID0gLSgoJHF1ZXN0aW9uQ29udGFpbmVyLndpZHRoKCkgKiBuZXh0UG9zaXRpb24pIC8gJHF1ZXN0aW9uV3JhcHBlci53aWR0aCgpKSAqIDEwMC4wLFxuICAgICAgICBuZXdUcmFuc2xhdGlvbiA9ICd0cmFuc2xhdGUzZCgnICsgbmV3VHJhbnNsYXRpb25WYWx1ZSArICclLC01MCUsMCknO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctbW96LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJ3RyYW5zZm9ybTonLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKHBhcnNlSW50KGN1cnJlbnRTdGVwKSA9PSAyKSB7XG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChwYXJzZUludChjdXJyZW50U3RlcCksIG5leHRQb3NpdGlvbiwgMClcbiAgICAgIH1cbiAgICAgIGRlY2lkZU5leHRTdGVwKHBhcnNlSW50KGN1cnJlbnRTdGVwKSArIDEpO1xuICAgIH1cbiAgICBpZiAoY3VycmVudFN0ZXAgPT0gMCAmJiBuZXh0UG9zaXRpb24gPT0gMSkge1xuICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sIHBhcnNlSW50KCQoJyNob21lLWNvdW50cnknKS52YWwoKSkpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDM7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGN1cnJlbnRTdGVwID09IDMgJiYgbmV4dFBvc2l0aW9uID09IDEpIHtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcIi5jaGVja1wiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzBdKS5maW5kKFwiLnBnUXVlc3Rpb25fX2JvZHlfX2Fuc3dlclwiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2F1eEN1cnJlbnRTdGVwXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwtNTAlLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pOy8vXG5cbiAgICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sICgkKCQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcInBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIilbMF0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpID8gMCA6ICgoJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSA/IDEgOiAyKSk7XG5cbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNFswXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNFNbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTM7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgICB9LCAwKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY3VycmVudFN0ZXAgPT0gMyAmJiBuZXh0UG9zaXRpb24gPT0gMikge1xuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzFdKS5maW5kKFwiLmNoZWNrXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCIucGdRdWVzdGlvbl9fYm9keV9fYW5zd2VyXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgJHF1ZXN0aW9uQ29udGFpbmVyID0gJCgkKCcucGdRdWVzdGlvbi1jb250YWluZXInKVthdXhDdXJyZW50U3RlcF0pLFxuICAgICAgICBuZXdUcmFuc2xhdGlvblZhbHVlID0gLSgoJHF1ZXN0aW9uQ29udGFpbmVyLndpZHRoKCkgKiBuZXh0UG9zaXRpb24pIC8gJHF1ZXN0aW9uV3JhcHBlci53aWR0aCgpKSAqIDEwMC4wLFxuICAgICAgICBuZXdUcmFuc2xhdGlvbiA9ICd0cmFuc2xhdGUzZCgnICsgbmV3VHJhbnNsYXRpb25WYWx1ZSArICclLC01MCUsMCknO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctbW96LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJ3RyYW5zZm9ybTonLCBuZXdUcmFuc2xhdGlvbik7Ly9cblxuICAgICAgICBtb3NxdWl0b3NMZWZ0IC09IHJldHVybk1vc3F1aXRvc0xlZnQoY3VycmVudFN0ZXAsIG5leHRQb3NpdGlvbiwgISQoJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzFdKS5maW5kKFwicGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSk7XG5cbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNlswXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNlNbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTU7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgICB9LCAwKTtcbiAgICB9XG5cbiAgfSk7XG59O1xuXG4vL1NlbGVjdCBhbiBvcHRpb24gb24gdGhlIHNlY29uZCBxdWVzdGlvblxudmFyIHNlbGVjdE9wdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKScsIGZ1bmN0aW9uKCkge1xuICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgICQodGhpcykuZmluZChcImltZ1wiKS5hdHRyKFwic3JjXCIsIFwiLi9pbWFnZXMvXCIgKyBiZWhhdmlvckltYWdlc1skKHRoaXMpLmF0dHIoXCJkYXRhLWluZGV4XCIpXSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuICAgICAgJCh0aGlzKS5maW5kKFwiaW1nXCIpLmF0dHIoXCJzcmNcIiwgXCIuL2ltYWdlcy9cIiArIGhvdmVyQmVoYXZpb3JJbWFnZXNbJCh0aGlzKS5hdHRyKFwiZGF0YS1pbmRleFwiKV0pO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vL1NlbGVjdCBhIGJpbmFyeSBvcHRpb24gb24gdGhlIHRoaXJkIHF1ZXN0aW9uXG52YXIgc2VsZWN0QmluYXJ5T3B0aW9uID0gZnVuY3Rpb24oKXtcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5wZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKScsIGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIG5leHRQb3NpdGlvbiA9ICQodGhpcykuYXR0cignZGF0YS1wb3MnKSxcbiAgICAgIGN1cnJlbnRTdGVwID0gJCh0aGlzKS5hdHRyKCdkYXRhLXN0ZXAnKTtcbiAgIFxuICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgIC8vIG1vdmUgbW9zcXVpdG9zXG4gICAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoXCIucGctYnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICQodGhpcykucGFyZW50KCkuZmluZChcIi5wZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG4gICAgICAkKHRoaXMpLnBhcmVudCgpLmZpbmQoXCIucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKS5hZGRDbGFzcyhcImRpc2FibGVkLW9wdGlvblwiKTtcbiAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgICQodGhpcykucGFyZW50KCkucGFyZW50KCkucGFyZW50KCkuZmluZChcIi5wZy1idXR0b25cIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U3RlcCA9PSAzICYmIG5leHRQb3NpdGlvbiA9PSAxKSB7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCIuY2hlY2tcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcIi5wZ1F1ZXN0aW9uX19ib2R5X19hbnN3ZXJcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPj0gdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uVmFsdWUgPSAtKCgkcXVlc3Rpb25Db250YWluZXIud2lkdGgoKSAqIG5leHRQb3NpdGlvbikgLyAkcXVlc3Rpb25XcmFwcGVyLndpZHRoKCkpICogMTAwLjAsXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uID0gJ3RyYW5zbGF0ZTNkKCcgKyBuZXdUcmFuc2xhdGlvblZhbHVlICsgJyUsLTUwJSwwKSc7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy1tb3otdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygndHJhbnNmb3JtOicsIG5ld1RyYW5zbGF0aW9uKTsvL1xuXG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCAoJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzBdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSA/IDAgOiAoKCQoJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzBdKS5maW5kKFwicGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkgPyAxIDogMikpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTRbMF07XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTRTWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDEzO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA3ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgIH0pO1xuICAgICAgfSwgMzI1MCk7XG4gICAgfVxuICAgIFxuICAgIH1cbiAgICBlbHNlIGlmIChjdXJyZW50U3RlcCA9PSAzICYmIG5leHRQb3NpdGlvbiA9PSAyKSB7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCIuY2hlY2tcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVsxXSkuZmluZChcIi5wZ1F1ZXN0aW9uX19ib2R5X19hbnN3ZXJcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPj0gdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uVmFsdWUgPSAtKCgkcXVlc3Rpb25Db250YWluZXIud2lkdGgoKSAqIG5leHRQb3NpdGlvbikgLyAkcXVlc3Rpb25XcmFwcGVyLndpZHRoKCkpICogMTAwLjAsXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uID0gJ3RyYW5zbGF0ZTNkKCcgKyBuZXdUcmFuc2xhdGlvblZhbHVlICsgJyUsLTUwJSwwKSc7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy1tb3otdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygndHJhbnNmb3JtOicsIG5ld1RyYW5zbGF0aW9uKTsvL1xuXG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCAhJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKTtcblxuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE2WzBdO1xuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE2U1swXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxNTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICAgIH0sIDMyNTApO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVsyXSkuZmluZChcIi5jaGVja1wiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzJdKS5maW5kKFwiLnBnUXVlc3Rpb25fX2JvZHlfX2Fuc3dlclwiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPj0gdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgZGVjaWRlTmV4dFN0ZXAoNSk7XG4gICAgICB9XG4gICAgfVxuXG4gIH0pO1xufTtcblxudmFyIG5ld1ggPSAwLjM7XG4gICAgdmFyIG5ld1hTID0gMC4yNTtcbiAgICB2YXIgbmV3WSA9IDMuMjI7XG4gICAgdmFyIG5ld1JlYWxZID0gMDtcbiAgICB2YXIgbmV3WVMgPSAyO1xuXG4vL1NlbGVjdCB0aGUgcHJlZ25hbmN5IG9wdGlvblxudmFyIHNlbGVjdFByZWduYW5jeU9wdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnU3RlcF9fcHJlZ25hbmN5LW9rJywgZnVuY3Rpb24oKcKge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJChcIiNsZWZ0LWdsYXNzLWNvdmVyLWhvcml6b250YWwsICNsZWZ0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpbkxlZnQ6IFwiLVwiICsgKCQoXCIjbGVmdC1nbGFzcy1jb3Zlci1ob3Jpem9udGFsXCIpLndpZHRoKCkgKiAwLjAxKSArIFwicHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoXCIjbGVmdC1nbGFzcy1jb3ZlciwgI2xlZnQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNsZWZ0LWdsYXNzLWNvdmVyXCIpLmhlaWdodCgpICogMC4wMSkgKyBcInB4XCJcbiAgICAgICAgfSwgMjAwKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgJCgnLnBnU3RlcF9fcHJlZ25hbmN5LW9rJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdTdGVwX19wcmVnbmFuY3kta28nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIGN1cnJlbnRQaGFzZSA9IDIxO1xuICAgIHByZWduYW50U2VsZWN0ZWQgPSB0cnVlO1xuXG4gICAgY2VsbCA9IE1hdGguY2VpbCgyNSAqIChtb3NxdWl0b3NMZWZ0IC8gdG90YWxNb3NxdWl0b3MpKTtcbiAgICBcbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNTpcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTI6XG4gICAgICAgIG5ld1ggPSAwLjMxNTtcbiAgICAgICAgbmV3WFMgPSAwLjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICBjYXNlIDY6XG4gICAgICBjYXNlIDEwOlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTc6XG4gICAgICAgIG5ld1ggPSAwLjQwNTtcbiAgICAgICAgbmV3WFMgPSAwLjM3NTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA5OlxuICAgICAgY2FzZSAxNTpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIxOlxuICAgICAgICBuZXdYID0gMC41O1xuICAgICAgICBuZXdYUyA9IDAuNTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3OlxuICAgICAgY2FzZSAxMzpcbiAgICAgIGNhc2UgMTg6XG4gICAgICBjYXNlIDIyOlxuICAgICAgY2FzZSAyNDpcbiAgICAgICAgbmV3WCA9IDAuNTk1O1xuICAgICAgICBuZXdYUyA9IDAuNjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgY2FzZSAxNjpcbiAgICAgIGNhc2UgMjA6XG4gICAgICBjYXNlIDIzOlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WCA9IDAuNjg1O1xuICAgICAgICBuZXdYUyA9IDAuNzU7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgc3dpdGNoIChjZWxsKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICBjYXNlIDI6XG4gICAgICBjYXNlIDQ6XG4gICAgICBjYXNlIDc6XG4gICAgICBjYXNlIDExOlxuICAgICAgICBuZXdZID0gMy4zOTtcbiAgICAgICAgbmV3WSA9IDA7XG4gICAgICAgIG5ld1JlYWxZID0gMTk7XG4gICAgICAgIG5ld1lTID0gNzI7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgOTpcbiAgICAgIGNhc2UgMTM6XG4gICAgICBjYXNlIDE2OlxuICAgICAgICBuZXdZID0gMy4zNDc1O1xuICAgICAgICBuZXdZID0gNTtcbiAgICAgICAgbmV3UmVhbFkgPSAxMztcbiAgICAgICAgbmV3WVMgPSA1MjtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTU6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMDpcbiAgICAgICAgbmV3WSA9IDMuMzA1O1xuICAgICAgICBuZXdZID0gMTA7XG4gICAgICAgIG5ld1JlYWxZID0gODtcbiAgICAgICAgbmV3WVMgPSAzMjtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA4OlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIyOlxuICAgICAgY2FzZSAyMzpcbiAgICAgICAgbmV3WSA9IDMuMjYyNTtcbiAgICAgICAgbmV3WSA9IDE1O1xuICAgICAgICBuZXdSZWFsWSA9IDQ7XG4gICAgICAgIG5ld1lTID0gMTc7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTI6XG4gICAgICBjYXNlIDE3OlxuICAgICAgY2FzZSAyMTpcbiAgICAgIGNhc2UgMjQ6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBuZXdZID0gMy4yMjtcbiAgICAgICAgbmV3WSA9IDIwO1xuICAgICAgICBuZXdSZWFsWSA9IC0xO1xuICAgICAgICBuZXdZUyA9IDI7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcbiAgICBtYXJrZXJNYXJnaW5Ub3AgPSAoMjAgLSBuZXdZKTtcblxuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwidG9wXCIsIG5ld1lTKyBcIiVcIik7XG4gICAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcImxlZnRcIiwgIChuZXdYUyAqIDEwMCkgKyBcIiVcIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJtYXJnaW4tdG9wXCIsICBuZXdSZWFsWSsgXCIlXCIpO1xuICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJsZWZ0XCIsICBwYXJzZUludChuZXdYICogMTAwKSArIFwiJVwiKTtcbiAgICB9XG5cbiAgICBtYXJrZXJQb3MgPSAkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLnBvc2l0aW9uKCk7XG5cbiAgICB2YXIgbmV3UG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6IG1hcmtlclBvcy5sZWZ0IC8gY2FudmFzLndpZHRoLCB5OiAoKG1hcmtlclBvcy50b3AgKyBwYXJzZUludCgkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcIm1hcmdpbi10b3BcIikpKSArICQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQnKS5wb3NpdGlvbigpLnRvcCArICQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuaGVpZ2h0KCkpIC8gY2FudmFzLndpZHRofSk7XG5cblxuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIG1hcmtlclBvcyA9ICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykucG9zaXRpb24oKTtcbiAgICAgIG5ld1Bvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OiAoKG1hcmtlclBvcy5sZWZ0ICsgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXInKS5wb3NpdGlvbigpLmxlZnQgKyBwYXJzZUludCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlcicpLmNzcyhcIm1hcmdpbi1sZWZ0XCIpKSkgLyAwLjEyNSApIC8gY2FudmFzLndpZHRoLCB5OiAoKCAobWFya2VyUG9zLnRvcCArICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuaGVpZ2h0KCkgKyBwYXJzZUludCgkKFwiLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXJcIikuY3NzKFwibWFyZ2luLXRvcFwiKSkgKSArICgoJChcIiNtb3NxdWl0b3NDYW52YXNcIikuaGVpZ2h0KCkgLSAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlcicpLmhlaWdodCgpKSAvIDIuMCkgKSAvIDAuMTI1KSAvIGNhbnZhcy53aWR0aH0pO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8PSA3MzYgJiYgJChcIiNob3Jpem9udGFsLWNvbmNsdXNpb25zLWJ1dHRvblwiKS5jc3MoXCJkaXNwbGF5XCIpID09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcucGdDb25jbHVzaW9ucycpLnBvc2l0aW9uKCkubGVmdFxuICAgICAgICAgICAgfSwgMjUwMCk7XG4gICAgICAgICAgfVxuICAgICAgfSwgNDAwMCk7XG4gICAgfVxuXG4gICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBwcmVnbmFudE1vc3F1aXRvcykge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ld1Bvc2l0aW9uc0FycmF5O1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjE7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgKE1hdGgucmFuZG9tKCkgKiAxNTAwKSArIDEwMDApO1xuICAgICAgfSk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGNyZWF0ZUNvbmNsdXNpb25zKGNlbGwpO1xuICAgICAgY3JlYXRlVXNlcnNTdGF0cyhuZXdYLCBuZXdZLCBjZWxsKTtcbiAgICAgIC8vc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdTdGVwX19sYXN0LWNoYXJ0JykucG9zaXRpb24oKS5sZWZ0ICsgKCQoJyNwZ1N0ZXA0Jykud2lkdGgoKSAvIDIpXG4gICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgICAgc2Nyb2xsVG9wOiAkKFwiLnBnU3RlcF9fbGFzdC1jaGFydFwiKS5wb3NpdGlvbigpLnRvcCArICgkKCcjcGdTdGVwNCcpLmhlaWdodCgpIC8gMiApXG4gICAgICAgICAgICAvL3Njcm9sbFRvcDogJChcIi5wZ0NvbmNsdXNpb25zXCIpLm9mZnNldCgpLnRvcCAtICgkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0JykuaGVpZ2h0KCkgKiAyLjApXG4gICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH1cbiAgICAgIC8vfSwgMTAwMCk7XG4gICAgfSwgMCk7XG4gICAgfVxuICB9KTtcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5wZ1N0ZXBfX3ByZWduYW5jeS1rbycsIGZ1bmN0aW9uKCnCoHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXItaG9yaXpvbnRhbCwgI3JpZ2h0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNyaWdodC1nbGFzcy1jb3Zlci1ob3Jpem9udGFsXCIpLndpZHRoKCkgKiAwLjAxKSArIFwicHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXIsICNyaWdodC1nbGFzcy1jb3Zlci1taWRcIikuYW5pbWF0ZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi1cIiArICgkKFwiI3JpZ2h0LWdsYXNzLWNvdmVyXCIpLmhlaWdodCgpICogMC4wMSkgKyBcInB4XCJcbiAgICAgICAgfSwgMjAwKTtcbiAgICAgIH1cbiAgICAgICQoJy5wZ1N0ZXBfX3ByZWduYW5jeS1vaycpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJCgnLnBnU3RlcF9fcHJlZ25hbmN5LWtvJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICBjdXJyZW50UGhhc2UgPSAyMTtcbiAgICBub25QcmVnbmFudFNlbGVjdGVkID0gdHJ1ZTtcbiAgICB2YXIgbmV3TW9zcXVpdG9zTGVmdFZhbHVlID0gTWF0aC5tYXgoNSwgbW9zcXVpdG9zTGVmdCAtIChtb3NxdWl0b3NMZWZ0ICogMC40NSkpO1xuXG4gICAgY2VsbCA9IE1hdGguY2VpbCgyNSAqIChuZXdNb3NxdWl0b3NMZWZ0VmFsdWUgLyB0b3RhbE1vc3F1aXRvcykpO1xuICAgIFxuICAgIGNlbGwgPSBNYXRoLmNlaWwoMjUgKiAobW9zcXVpdG9zTGVmdCAvIHRvdGFsTW9zcXVpdG9zKSk7XG5cbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNTpcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTI6XG4gICAgICAgIG5ld1ggPSAwLjMxNTtcbiAgICAgICAgbmV3WFMgPSAwLjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICBjYXNlIDY6XG4gICAgICBjYXNlIDEwOlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTc6XG4gICAgICAgIG5ld1ggPSAwLjQwNTtcbiAgICAgICAgbmV3WFMgPSAwLjM3NTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA5OlxuICAgICAgY2FzZSAxNTpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIxOlxuICAgICAgICBuZXdYID0gMC41O1xuICAgICAgICBuZXdYUyA9IDAuNTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3OlxuICAgICAgY2FzZSAxMzpcbiAgICAgIGNhc2UgMTg6XG4gICAgICBjYXNlIDIyOlxuICAgICAgY2FzZSAyNDpcbiAgICAgICAgbmV3WCA9IDAuNTk1O1xuICAgICAgICBuZXdYUyA9IDAuNjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgY2FzZSAxNjpcbiAgICAgIGNhc2UgMjA6XG4gICAgICBjYXNlIDIzOlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WCA9IDAuNjg1O1xuICAgICAgICBuZXdYUyA9IDAuNzU7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgc3dpdGNoIChjZWxsKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICBjYXNlIDI6XG4gICAgICBjYXNlIDQ6XG4gICAgICBjYXNlIDc6XG4gICAgICBjYXNlIDExOlxuICAgICAgICBuZXdZID0gMy4zOTtcbiAgICAgICAgbmV3WSA9IDA7XG4gICAgICAgIG5ld1JlYWxZID0gMTk7XG4gICAgICAgIG5ld1lTID0gNzI7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgOTpcbiAgICAgIGNhc2UgMTM6XG4gICAgICBjYXNlIDE2OlxuICAgICAgICBuZXdZID0gMy4zNDc1O1xuICAgICAgICBuZXdZID0gNTtcbiAgICAgICAgbmV3UmVhbFkgPSAxMztcbiAgICAgICAgbmV3WVMgPSA1MjtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTU6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMDpcbiAgICAgICAgbmV3WSA9IDMuMzA1O1xuICAgICAgICBuZXdZID0gMTA7XG4gICAgICAgIG5ld1JlYWxZID0gODtcbiAgICAgICAgbmV3WVMgPSAzMjtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA4OlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIyOlxuICAgICAgY2FzZSAyMzpcbiAgICAgICAgbmV3WSA9IDMuMjYyNTtcbiAgICAgICAgbmV3WSA9IDE1O1xuICAgICAgICBuZXdSZWFsWSA9IDQ7XG4gICAgICAgIG5ld1lTID0gMTc7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTI6XG4gICAgICBjYXNlIDE3OlxuICAgICAgY2FzZSAyMTpcbiAgICAgIGNhc2UgMjQ6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBuZXdZID0gMy4yMjtcbiAgICAgICAgbmV3WSA9IDIwO1xuICAgICAgICBuZXdSZWFsWSA9IC0xO1xuICAgICAgICBuZXdZUyA9IDI7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcbiAgICBtYXJrZXJNYXJnaW5Ub3AgPSAoMjAgLSBuZXdZKTtcblxuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwidG9wXCIsIG5ld1lTKyBcIiVcIik7XG4gICAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcImxlZnRcIiwgIChuZXdYUyAqIDEwMCkgKyBcIiVcIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJtYXJnaW4tdG9wXCIsICBuZXdSZWFsWSsgXCIlXCIpO1xuICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJsZWZ0XCIsICAobmV3WCAqIDEwMCkgKyBcIiVcIik7XG4gICAgfVxuXG4gICAgbWFya2VyUG9zID0gJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5wb3NpdGlvbigpO1xuXG4gICAgdmFyIG5ld1Bvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OiBtYXJrZXJQb3MubGVmdCAvIGNhbnZhcy53aWR0aCwgeTogKChtYXJrZXJQb3MudG9wICsgcGFyc2VJbnQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJtYXJnaW4tdG9wXCIpKSkgKyAkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0JykucG9zaXRpb24oKS50b3AgKyAkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmhlaWdodCgpKSAvIGNhbnZhcy53aWR0aH0pO1xuXG5cbiAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICBtYXJrZXJQb3MgPSAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLnBvc2l0aW9uKCk7XG4gICAgICBuZXdQb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDogKChtYXJrZXJQb3MubGVmdCArICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyJykucG9zaXRpb24oKS5sZWZ0ICsgcGFyc2VJbnQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXInKS5jc3MoXCJtYXJnaW4tbGVmdFwiKSkpIC8gMC4xMjUgKSAvIGNhbnZhcy53aWR0aCwgeTogKCggKG1hcmtlclBvcy50b3AgKyAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmhlaWdodCgpICsgcGFyc2VJbnQoJChcIi5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyXCIpLmNzcyhcIm1hcmdpbi10b3BcIikpICkgKyAoKCQoXCIjbW9zcXVpdG9zQ2FudmFzXCIpLmhlaWdodCgpIC0gJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXInKS5oZWlnaHQoKSkgLyAyLjApICkgLyAwLjEyNSkgLyBjYW52YXMud2lkdGh9KTtcbiAgICBcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPD0gNzM2ICYmICQoXCIjaG9yaXpvbnRhbC1jb25jbHVzaW9ucy1idXR0b25cIikuY3NzKFwiZGlzcGxheVwiKSA9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgJCgnLnBnQ2hhcnQnKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgc2Nyb2xsTGVmdDogJCgnLnBnQ29uY2x1c2lvbnMnKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgICAgIH0sIDI1MDApO1xuICAgICAgICAgIH1cbiAgICAgIH0sIDQwMDApO1xuICAgIH1cblxuICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4ID49IHByZWduYW50TW9zcXVpdG9zICYmIGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ld1Bvc2l0aW9uc0FycmF5O1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjE7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgKE1hdGgucmFuZG9tKCkgKiAxNTAwKSArIDEwMDApO1xuICAgICAgfSk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgY3JlYXRlQ29uY2x1c2lvbnMoY2VsbCk7XG4gICAgICBjcmVhdGVVc2Vyc1N0YXRzKG5ld1gsIG5ld1ksIGNlbGwpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdTdGVwNCcpLnBvc2l0aW9uKCkubGVmdCArICgkKCcjcGdTdGVwNCcpLndpZHRoKCkgLyAyLjApXG4gICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgICAgLy9zY3JvbGxUb3A6ICQoXCIucGdDb25jbHVzaW9uc1wiKS5vZmZzZXQoKS50b3AgLSAoJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydCcpLmhlaWdodCgpICogMi4wKVxuICAgICAgICAgICAgc2Nyb2xsVG9wOiAkKFwiLnBnU3RlcF9fbGFzdC1jaGFydFwiKS5wb3NpdGlvbigpLnRvcCArICgkKCcjcGdTdGVwNCcpLmhlaWdodCgpIC8gMiApXG4gICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDEwMDApO1xuICAgIH0sIDApO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vUmV0dXJuIG1vc3F1aXRvcyBsZWZ0IGRlcGVuZGluZyBvbiB0aGUgY2hvc2VuIGNvdW50cnlcbnZhciByZXR1cm5Nb3NxdWl0b3NMZWZ0ID0gZnVuY3Rpb24oc3RlcCwgcXVlc3Rpb24sIG9wdGlvbil7XG4gIHZhciBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcblxuICBpZiAoc3RlcCA9PSAwKSB7XG4gICAgaWYgKHF1ZXN0aW9uID09IDEpIHtcbiAgICAgIGlmIChvcHRpb24gPT0gMSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSAyKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSA4MDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSA0KXtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDc1O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocXVlc3Rpb24gPT0gMikge1xuICAgICAgaWYgKG9wdGlvbiA9PSAxKSB7XG4gICAgICAgIGlmIChtb3NxdWl0b3NMZWZ0IDw9IDI1KSB7XG4gICAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IC01MDsvL1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcHRpb24gPT0gMiB8fCBvcHRpb24gPT0gNCkge1xuICAgICAgICBpZiAobW9zcXVpdG9zTGVmdCA8PSAyNSkge1xuICAgICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSA1O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChzdGVwID09IDIpIHtcbiAgICAvL2lmIChxdWVzdGlvbiA9PSAwKSB7XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbMF0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMztcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzFdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAxOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVsyXSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbM10pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzRdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVs1XSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbNl0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzddKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVs4XSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gKG1vc3F1aXRvc0xlZnQgPD0gODApID8gMiA6IDE7IFxuICAgICAgfVxuICAgIC8vfVxuICB9XG5cbiAgaWYgKHN0ZXAgPT0gMykge1xuICAgIGlmIChxdWVzdGlvbiA9PSAxKSB7XG4gICAgICBpZiAob3B0aW9uID09IDApIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDE7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcHRpb24gPT0gMSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHF1ZXN0aW9uID09IDIpIHtcbiAgICAgIGlmIChvcHRpb24gPT0gMCkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSAxKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocXVlc3Rpb24gPT0gMykge1xuICAgICAgaWYgKG9wdGlvbiA9PSAwKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAob3B0aW9uID09IDEpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF1eE1vc3F1aXRvc0xlZnQ7XG59O1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uY2x1c2lvbnNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xudmFyIGNyZWF0ZUNvbmNsdXNpb25zID0gZnVuY3Rpb24oY2VsbCkge1xuICB2YXIgY29uY2x1c2lvbnNUZXh0ID0gJzxoNCBjbGFzcz1cInBnQ29uY2x1c2lvbnNfX21haW4tY29uY2x1c2lvblwiPjxiPllvdSBoYXZlIGEgJztcblxuICBpZiAoY2VsbCA8PSAxMCkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcImxvd1wiO1xuICB9XG4gIGVsc2UgaWYgKGNlbGwgPD0gMTkpIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCJtaWRcIjtcbiAgfVxuICBlbHNlIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCJoaWdoXCI7XG4gIH1cblxuICBjb25jbHVzaW9uc1RleHQgKz0gXCIgcmlzayBvZiBjb250cmFjdGluZyB0aGUgWmlrYSB2aXJ1cywgYW5kIHRoZSBjb25zZXF1ZW5jZXMgXCJcblxuICBpZiAoY2VsbCA8PSAxMCkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIndvdWxkIGJlIG1pbGQuXCI7XG4gIH1cbiAgZWxzZSBpZiAoY2VsbCA8PSAxOSkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIndvdWxkIGJlIG1pbGQuXCI7XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiY291bGQgYmUgc2VyaW91cy5cIjtcbiAgfVxuXG4gIGNvbmNsdXNpb25zVGV4dCArPSBcIjwvYj48L2g0PlwiO1xuXG4gIGlmKHBhcnNlSW50KCQoXCIjaG9tZS1jb3VudHJ5XCIpLnZhbCgpKSA9PSA0IHx8IHBhcnNlSW50KCQoXCIjdmlzaXQtY291bnRyeVwiKS52YWwoKSkgPT0gNCkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPllvdSBsaXZlIGluIHRoZSBVbml0ZWQgU3RhdGVzIG9yIHlvdSBhcmUgcGxhbm5pbmcgdG8gdHJhdmVsIHRvIHRoZSBVbml0ZWQgU3RhdGVzLiBSZXNlYXJjaCBzaG93cyB0aGF0IHNvbWUgc3RhdGVzIHdpbGwgYmUgYWZmZWN0ZWQgYnkgdGhlIFppa2EgdmlydXMgaW4gdGhlIGNvbWluZyB3ZWVrcy48L3A+XCJcbiAgfWVsc2UgaWYgKHBhcnNlSW50KCQoXCIjaG9tZS1jb3VudHJ5XCIpLnZhbCgpKSA9PSAyICYmIHBhcnNlSW50KCQoXCIjdmlzaXQtY291bnRyeVwiKS52YWwoKSkgPT0gMikge1xuICAgIGlmICghJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVs4XSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCBwcmVnbmFudFNlbGVjdGVkKSB7XG4gICAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD5Zb3UgZG9u4oCZdCBsaXZlIGluIGEgY291bnRyeSBub3IgYXJlIHlvdSBwbGFubmluZyB0byB0cmF2ZWwgdG8gYSBjb3VudHJ5IGFmZmVjdGVkIGJ5IHRoZSBaaWthIHZpcnVzLiA8Yj5Zb3VyIHJpc2sgaXMgbG93PC9iPiBidXQgcmVtZW1iZXIgdGhhdCB0aGVyZSBoYXZlIGJlZW4gPGI+Y2FzZXMgb2Ygc2V4dWFsIHRyYW5zbWlzc2lvbjwvYj4gYnkgcGFydG5lcnMgdGhhdCBnb3QgaW5mZWN0ZWQgaW4gdGhvc2UgYXJlYXMuPC9wPlwiO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPllvdSBkb27igJl0IGxpdmUgaW4gYSBjb3VudHJ5IG5vciBhcmUgeW91IHBsYW5uaW5nIHRvIHRyYXZlbCB0byBhIGNvdW50cnkgYWZmZWN0ZWQgYnkgdGhlIFppa2EgdmlydXMuIDxiPllvdXIgcmlzayBpcyB6ZXJvLjxiPjwvcD5cIjtcbiAgICB9XG4gIH1cbiAgZWxzZSBpZighKHBhcnNlSW50KCQoXCIjaG9tZS1jb3VudHJ5XCIpLnZhbCgpKSA9PSA0ICYmIHBhcnNlSW50KCQoXCIjdmlzaXQtY291bnRyeVwiKS52YWwoKSkgPT0gNCkpIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD5Zb3UgbGl2ZSBpbiBhIGNvdW50cnkgdGhhdCBpcyBhZmZlY3RlZCBieSB0aGUgWmlrYSB2aXJ1cyBvciB5b3UgYXJlIHBsYW5uaW5nIHRvIHRyYXZlbCB0byBhIGNvdW50cnkgdGhhdCBpcy48L3A+XCI7XG4gIH1cblxuICBpZiAoJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCAkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzJdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpIHx8ICQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbNV0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikgfHwgJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVs2XSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPldlYXJpbmcgc2hvcnRzIGFuZCBzbGVldmVsZXNzIHNoaXJ0cyB0aGF0IGFyZSBkYXJrIGluIGNvbG9yIGFuZCBrZWVwaW5nIGJ1Y2tldHMgb2Ygd2F0ZXIgb3IgaGF2aW5nIHdhdGVyIGNvbnRhaW5lcnMgbmVhciB5b3VyIGhvdXNlIGNhbiA8Yj5pbmNyZWFzZSB5b3VyIHJpc2sgb2YgYmVpbmcgYml0dGVuIGJ5IHRoZSBtb3NxdWl0byBhbmQgcmFpc2UgeW91ciBjaGFuY2VzIG9mIGdldHRpbmcgdGhlIHZpcnVzLjwvYj48L3A+XCI7XG4gIH1cbiAgaWYgKCQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbM10pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikgfHwgJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVs0XSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCAkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzddKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPHA+VXNpbmcgaW5zZWN0IHJlcGVsbGVudCwgd2VhcmluZyBsaWdodCBjb2xvciBjbG90aGVzLCBoYXZpbmcgcGh5c2ljYWwgYmFycmllcnMgc3VjaCBtZXNoIHNjcmVlbnMgb3IgdHJlYXRlZCBuZXR0aW5nIG1hdGVyaWFscyBvbiBkb29ycyBhbmQgd2luZG93cywgb3Igc2xlZXBpbmcgdW5kZXIgbW9zcXVpdG8gbmV0cyB3aWxsIGFsbCA8Yj5kZWNyZWFzZSB5b3VyIHJpc2sgb2YgZ2V0dGluZyBiaXR0ZW4gYnkgdGhlIG1vc3F1aXRvIGFuZCBsb3dlciB5b3VyIGNoYW5nZXMgb2YgZ2V0dGluZyB0aGUgdmlydXMuPC9iPjwvcD5cIjtcbiAgfVxuXG4gIGlmIChub25QcmVnbmFudFNlbGVjdGVkKSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPHA+WmlrYSB2aXJ1cyBpcyBzcHJlYWQgcHJpbWFyaWx5IHRocm91Z2ggdGhlIGJpdGUgb2YgaW5mZWN0ZWQgQWVkZXMgc3BlY2llcyBtb3NxdWl0b2VzLiA8Yj5Pbmx5IDIwJSBwZW9wbGUgd2hvIGNvbnRyYWN0IHRoZSB2aXJ1cyB3aWxsIGV2ZW4gZGV2ZWxvcCBhbnkgc3ltcHRvbXMgYW5kIHRoZSBpbGxuZXNzIGlzIHVzdWFsbHkgbWlsZDwvYj4sIHdpdGggc3ltcHRvbXMgbGlrZSBmZXZlciwgcmFzaCBvciBqb2ludCBwYWluIHRoYXQgd2lsbCBsYXN0IGEgZmV3IGRheXMuPGJyPjxicj5SZWNlbnRseSBpbiBCcmF6aWwsIGxvY2FsIGhlYWx0aCBhdXRob3JpdGllcyBoYXZlIG9ic2VydmVkIGFuIGluY3JlYXNlIGluIEd1aWxsYWluLUJhcnLDqSBzeW5kcm9tZSwgdGhhdCBjYXVzZXMgcGFyYWx5c2lzLCB3aGljaCBjb2luY2lkZWQgd2l0aCBaaWthIHZpcnVzIGluZmVjdGlvbnMgaW4gdGhlIGdlbmVyYWwgcHVibGljLiBCYXNlZCBvbiBhIGdyb3dpbmcgYm9keSBvZiBwcmVsaW1pbmFyeSByZXNlYXJjaCwgdGhlcmUgaXMgc2NpZW50aWZpYyBjb25zZW5zdXMgdGhhdCBaaWthIHZpcnVzIGlzIGEgY2F1c2Ugb2YgbWljcm9jZXBoYWx5IGFuZCBHdWlsbGFpbi1CYXJyw6kgc3luZHJvbWUuPC9wPlwiO1xuICB9XG4gIGVsc2Uge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPjxiPlRoZSBaaWthIHZpcnVzIGNhbiBiZSB0cmFuc21pdHRlZCBmcm9tIGluZmVjdGVkIG1vdGhlcnMgdG8gdGhlaXIgZmV0dXNlczwvYj4gYW5kIHRoaXMgY2FuIGhhcHBlbiBkdXJpbmcgYm90aCBwcmVnbmFuY3kgb3IgYXQgY2hpbGRiaXJ0aC4gQmFzZWQgb24gYSBncm93aW5nIGJvZHkgb2YgcHJlbGltaW5hcnkgcmVzZWFyY2gsIDxiPnRoZXJlIGlzIHNjaWVudGlmaWMgY29uc2Vuc3VzIHRoYXQgWmlrYSB2aXJ1cyBpcyBhIGNhdXNlIG9mIG1pY3JvY2VwaGFseTwvYj4sIHdoaWNoIGlzIGEgY29uZGl0aW9uIHdoZXJlIGEgYmFieSBpcyBib3JuIHdpdGggYSBzbWFsbCBoZWFkIG9yIHRoZSBoZWFkIHN0b3BzIGdyb3dpbmcgYWZ0ZXIgYmlydGguIEJhYmllcyB3aXRoIG1pY3JvY2VwaGFseSBjYW4gZGV2ZWxvcCBkZXZlbG9wbWVudGFsIGRpc2FiaWxpdGllcy4gRWFybHkgZGlhZ25vc2lzIG9mIG1pY3JvY2VwaGFseSBjYW4gc29tZXRpbWVzIGJlIG1hZGUgYnkgZmV0YWwgdWx0cmFzb3VuZC48YnI+PGJyPjxiPlByZWduYW50IHdvbWVuIHdobyBkZXZlbG9wIHN5bXB0b21zIG9mIFppa2EgdmlydXMgaW5mZWN0aW9uLCBzaG91bGQgc2VlIHRoZWlyIGhlYWx0aC1jYXJlIHByb3ZpZGVyIGZvciBjbG9zZSBtb25pdG9yaW5nIG9mIHRoZWlyIHByZWduYW5jeS48L2I+IElmIHlvdeKAmXJlIHRyYXZlbGxpbmcgdG8gYSBjb3VudHJ5IGFmZmVjdGVkIGJ5IFppa2EsIHRoZSBXb3JsZCBIZWFsdGggT3JnYW5pemF0aW9uIGlzIGFkdmlzaW5nIHByZWduYW50IHdvbWVuIG5vdCB0byB0cmF2ZWwgdG8gYXJlYXMgb2Ygb25nb2luZyBaaWthIHZpcnVzIHRyYW5zbWlzc2lvbi48L3A+XCI7XG4gIH1cblxuICBjb25jbHVzaW9uc1RleHQgKz0gXCI8YnI+PGJyPlwiO1xuXG4gICQoXCIucGdDb25jbHVzaW9ucy1kZXNjXCIpLmJlZm9yZShjb25jbHVzaW9uc1RleHQpO1xuXG4gICQoXCIucGdDb25jbHVzaW9ucy1kZXNjLCAucGdDb25jbHVzaW9ucyBoNFwiKS5jc3MoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG59XG5cbnZhciBjcmVhdGVVc2Vyc1N0YXRzID0gZnVuY3Rpb24obWFya2VyTGVmdCwgbWFya2VyVG9wLCBjZWxsKSB7XG4gIHZhciByZXN1bHRzID0gWzEsIDIsIDEsIDIsIDUsIDMsIDYsIDEwLCAxLCAxLCAxLCAxLCAxMCwgMTIsIDUsIDEsIDEsIDEwLCAxMiwgMSwgMSwgMSwgMiwgOSwgMV07XG5cbiAgdmFyIG1heFJlc3VsdHMgPSAtMTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAobWF4UmVzdWx0cyA8IHJlc3VsdHNbaV0pIHtcbiAgICAgIG1heFJlc3VsdHMgPSByZXN1bHRzW2ldO1xuICAgIH1cbiAgfVxuXG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbMF0pLmNzcyhcImxlZnRcIiwgXCIwJVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVswXSkuY3NzKFwibGVmdFwiLCBcIjAlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzFdKS5jc3MoXCJsZWZ0XCIsIFwiNjAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzFdKS5jc3MoXCJsZWZ0XCIsIFwiNjAlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzJdKS5jc3MoXCJsZWZ0XCIsIFwiNzUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzJdKS5jc3MoXCJsZWZ0XCIsIFwiNzUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzNdKS5jc3MoXCJsZWZ0XCIsIFwiMCVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbM10pLmNzcyhcImxlZnRcIiwgXCIwJVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs0XSkuY3NzKFwibGVmdFwiLCBcIjU1JVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs0XSkuY3NzKFwibGVmdFwiLCBcIjU1JVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs1XSkuY3NzKFwibGVmdFwiLCBcIjcwJVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs1XSkuY3NzKFwibGVmdFwiLCBcIjcwJVwiKTtcblxuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzBdKS5jc3MoXCJ3aWR0aFwiLCBcIjYwJVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVswXSkuY3NzKFwid2lkdGhcIiwgXCI2MCVcIik7XG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbMV0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzFdKS5jc3MoXCJ3aWR0aFwiLCBcIjE1JVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVsyXSkuY3NzKFwid2lkdGhcIiwgXCIyNSVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbMl0pLmNzcyhcIndpZHRoXCIsIFwiMjUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzNdKS5jc3MoXCJ3aWR0aFwiLCBcIjU1JVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVszXSkuY3NzKFwid2lkdGhcIiwgXCI1NSVcIik7XG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbNF0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzRdKS5jc3MoXCJ3aWR0aFwiLCBcIjE1JVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs1XSkuY3NzKFwid2lkdGhcIiwgXCIzMCVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbNV0pLmNzcyhcIndpZHRoXCIsIFwiMzAlXCIpO1xuXG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVswXSkuY3NzKFwibGVmdFwiLCBcIjAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMF0pLmNzcyhcImxlZnRcIiwgXCIwJVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzFdKS5jc3MoXCJsZWZ0XCIsIFwiNjAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMV0pLmNzcyhcImxlZnRcIiwgXCI2MCVcIik7XG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVsyXSkuY3NzKFwibGVmdFwiLCBcIjc1JVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzJdKS5jc3MoXCJsZWZ0XCIsIFwiNzUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbM10pLmNzcyhcImxlZnRcIiwgXCIwJVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzNdKS5jc3MoXCJsZWZ0XCIsIFwiMCVcIik7XG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVs0XSkuY3NzKFwibGVmdFwiLCBcIjU1JVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzRdKS5jc3MoXCJsZWZ0XCIsIFwiNTUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNV0pLmNzcyhcImxlZnRcIiwgXCI3MCVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVs1XSkuY3NzKFwibGVmdFwiLCBcIjcwJVwiKTtcblxuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMF0pLmNzcyhcIndpZHRoXCIsIFwiNjAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMF0pLmNzcyhcIndpZHRoXCIsIFwiNjAlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMV0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMV0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMl0pLmNzcyhcIndpZHRoXCIsIFwiMjUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMl0pLmNzcyhcIndpZHRoXCIsIFwiMjUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbM10pLmNzcyhcIndpZHRoXCIsIFwiNTUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbM10pLmNzcyhcIndpZHRoXCIsIFwiNTUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNF0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNF0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNV0pLmNzcyhcIndpZHRoXCIsIFwiMzAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNV0pLmNzcyhcIndpZHRoXCIsIFwiMzAlXCIpO1xuXG4gIHZhciBtZWRpdW1Xb3JkID0gXCJNRURJVU0gXCI7XG4gIGlmICgkKHdpbmRvdykud2lkdGgoKSA8IDUyMCkge1xuICAgIG1lZGl1bVdvcmQgPSBcIk1FRCBcIlxuICB9XG5cbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzBdKS5odG1sKFwiTE9XIFwiICsgNjAgKyBcIiVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVswXSkuaHRtbChcIkxPVyBcIiArIDYwICsgXCIlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMV0pLmh0bWwobWVkaXVtV29yZCArIDE1ICsgXCIlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMV0pLmh0bWwobWVkaXVtV29yZCArIDE1ICsgXCIlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMl0pLmh0bWwoXCJISUdIIFwiICsgMjUgKyBcIiVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVsyXSkuaHRtbChcIkhJR0ggXCIgKyAyNSArIFwiJVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzNdKS5odG1sKFwiTE9XIFwiICsgNTUgKyBcIiVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVszXSkuaHRtbChcIkxPVyBcIiArIDU1ICsgXCIlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNF0pLmh0bWwobWVkaXVtV29yZCArIDE1ICsgXCIlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNF0pLmh0bWwobWVkaXVtV29yZCArIDE1ICsgXCIlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNV0pLmh0bWwoXCJISUdIIFwiICsgMzAgKyBcIiVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVs1XSkuaHRtbChcIkhJR0ggXCIgKyAzMCArIFwiJVwiKTtcblxuICAkKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWVcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAkKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWFya2VyXCIpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcbiAgJChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzLW1hcmtlclwiKS5jc3MoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cbiAgc3dpdGNoIChtYXJrZXJMZWZ0KSB7XG4gICAgY2FzZSAwLjMxNTpcbiAgICAgIHN3aXRjaCAobWFya2VyVG9wKSB7XG4gICAgICAgIGNhc2UgMjA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICogMC41O1xuICAgICAgICAgIG1hcmtlclRvcCA9IDcwICsgKDMwICogMC41KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTU6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICogMC41O1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC44NzUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNjAgKiAwLjU7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCAqIDAuNTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA1NSArICgxNSAqIDAuMTI1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNjAgKiAwLjU7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKiAwLjU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGJyZWFrO1xuICAgIGNhc2UgMC40MDU6XG4gICAgICBzd2l0Y2ggKG1hcmtlclRvcCkge1xuICAgICAgICBjYXNlIDIwOlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuMTI1KTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA3MCArICgzMCAqIDAuNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE1OlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuMTI1KTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA1NSArICgxNSAqIDAuODc1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC4xMjUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC41KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNjAgKyAoMTUgKiAwLjEyNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjEyNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC4xMjUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICogMC41O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBicmVhaztcbiAgICBjYXNlIDAuNTpcbiAgICAgIHN3aXRjaCAobWFya2VyVG9wKSB7XG4gICAgICAgIGNhc2UgMjA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC41KTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA3MCArICgzMCAqIDAuNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE1OlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjg3NSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDEwOlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjEyNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC41KTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA1NSAqIDAuNTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgYnJlYWs7XG4gICAgY2FzZSAwLjU5NTpcbiAgICAgIHN3aXRjaCAobWFya2VyVG9wKSB7XG4gICAgICAgIGNhc2UgMjA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC44NzUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDcwICsgKDMwICogMC41KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTU6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC44NzUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC44NzUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNjAgKyAoMTUgKiAwLjg3NSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuODc1KTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA1NSArICgxNSAqIDAuMTI1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNjAgKyAoMTUgKiAwLjg3NSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKiAwLjU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGJyZWFrO1xuICAgIGNhc2UgMC42ODU6XG4gICAgICBzd2l0Y2ggKG1hcmtlclRvcCkge1xuICAgICAgICBjYXNlIDIwOlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA3NSArICgyNSAqIDAuNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNzAgKyAoMzAgKiAwLjUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxNTpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNzUgKyAoMjUgKiAwLjUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC44NzUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNzUgKyAoMjUgKiAwLjUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC41KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNzUgKyAoMjUgKiAwLjUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC4xMjUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA3NSArICgyNSAqIDAuNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKiAwLjU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGJyZWFrO1xuICB9XG5cbiAgJCgkKFwiI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWFya2VyXCIpWzBdKS5jc3MoXCJsZWZ0XCIsIHBhcnNlSW50KG1hcmtlckxlZnQpICsgXCIlXCIpO1xuICAkKCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1tYXJrZXJcIilbMF0pLmNzcyhcImxlZnRcIiwgcGFyc2VJbnQobWFya2VyTGVmdCkgKyBcIiVcIik7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAkKCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1tYXJrZXJcIilbMF0pLmNzcyhcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcbiAgfSwgMTAwKTtcblxuICB2YXIgb2Zmc2V0WCA9IDIuNTtcblxuICBpZiAobWFya2VyVG9wID4gMTApIHtcbiAgICBvZmZzZXRYID0gLTIuNTtcbiAgfVxuICBlbHNlIGlmIChtYXJrZXJUb3AgPiAxMCkge1xuICAgIG9mZnNldFggPSAyLjU7XG4gIH1cbiAgZWxzZSB7XG4gICAgb2Zmc2V0WCA9IDA7XG4gIH1cblxuICBvZmZzZXRYID0gMDtcblxuICAkKCQoXCIjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy1tYXJrZXJcIilbMV0pLmNzcyhcImxlZnRcIiwgcGFyc2VJbnQobWFya2VyVG9wKSArIFwiJVwiKTtcbiAgJCgkKFwiLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWFya2VyXCIpWzFdKS5jc3MoXCJsZWZ0XCIsIHBhcnNlSW50KG1hcmtlclRvcCkgKyBcIiVcIik7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAkKCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1tYXJrZXJcIilbMV0pLmNzcyhcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcbiAgfSwgMTAwKTtcblxuICAkKFwiI2hvcml6b250YWwtY29uY2x1c2lvbnMtYnV0dG9uIC5wZy1idXR0b25cIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAkKGRvY3VtZW50KS5vbihcImNsaWNrXCIsICcjaG9yaXpvbnRhbC1jb25jbHVzaW9ucy1idXR0b24gLnBnLWJ1dHRvbjpub3QoW2Rpc2FibGVkPVwiZGlzYWJsZWRcIl0pJywgZnVuY3Rpb24oKSB7XG4gICAgJCgnLnBnQ2hhcnQnKS5hbmltYXRlKHtcbiAgICAgIHNjcm9sbExlZnQ6ICQoJyNwZ1N0ZXA0JykucG9zaXRpb24oKS5sZWZ0ICsgKCQoJyNwZ1N0ZXA0Jykud2lkdGgoKSAqIDIuMClcbiAgICB9LCAyMDAwKTtcbiAgfSk7XG5cbiAgJCgnLnBnQ29uY2x1c2lvbnMtc2hhcmViYXItd3JhcHBlcicpLmNzcyhcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xuICAkKCcucGdDb25jbHVzaW9ucy1zaGFyZWJhci13cmFwcGVyIGFbZGF0YS1zZXJ2aWNlPVwiZmFjZWJvb2tcIl0nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICB2YXIgcmlzayA9IFwiXCI7XG5cbiAgICBpZiAoY2VsbCA8PSAxMCkge1xuICAgICAgcmlzayA9IFwibG93XCI7XG4gICAgfVxuICAgIGVsc2UgaWYgKGNlbGwgPD0gMTkpIHtcbiAgICAgIHJpc2sgPSBcIm1pZFwiO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJpc2sgPSBcImhpZ2hcIjtcbiAgICB9XG5cbiAgICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgdmFyIHRleHQgPSBcIkkgZGlkIHRoZSBaaWthIHRlc3QgaW4gdGhlIFdhc2hpbmd0b24gUG9zdCBhbmQgZ290IHRoYXQgSSBoYXZlIGEgXCIrcmlzaytcIiByaXNrIG9mIGdldHRpbmcgdGhlIHZpcnVzLiBBc3Nlc3MgeW91ciByaXNrIGluIFwiICsgdXJsO1xuXG4gICAgRkIudWkoe1xuICAgICAgbWV0aG9kOiAnc2hhcmUnLFxuICAgICAgaHJlZjogdXJsLFxuICAgICAgcXVvdGU6IHRleHRcbiAgICB9LCBmdW5jdGlvbihyZXNwb25zZSl7fSk7XG5cbiAgfSk7XG4gICQoJy5wZ0NvbmNsdXNpb25zLXNoYXJlYmFyLXdyYXBwZXIgYVtkYXRhLXNlcnZpY2U9XCJ0d2l0dGVyXCJdJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJpc2sgPSBcIlwiO1xuXG4gICAgaWYgKGNlbGwgPD0gMTApIHtcbiAgICAgIHJpc2sgPSBcImxvd1wiO1xuICAgIH1cbiAgICBlbHNlIGlmIChjZWxsIDw9IDE5KSB7XG4gICAgICByaXNrID0gXCJtaWRcIjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByaXNrID0gXCJoaWdoXCI7XG4gICAgfVxuXG4gICAgdmFyIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgIHZhciB0ZXh0ID0gXCJJIGRpZCB0aGUgWmlrYSB0ZXN0IGluIHRoZSBAd2FzaGluZ3RvbnBvc3QgYW5kIGdvdCB0aGF0IEkgaGF2ZSBhIFwiKyByaXNrICtcIiByaXNrIG9mIGdldHRpbmcgdGhlIHZpcnVzLiBBc3Nlc3MgeW91ciByaXNrIGF0IFwiICsgdXJsO1xuICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3R3aXR0ZXIuY29tL3NoYXJlP3RleHQ9JyArIHRleHQgLCdzaGFyZV90d2l0dGVyJywnd2lkdGg9NTUwLCBoZWlnaHQ9MzUwLCBzY3JvbGxiYXJzPW5vJyk7XG4gIH0pO1xuXG59O1xuXG4vKipcbiAgRnVuY2lvbiBkZSByZWVzY2FsYWRvXG4gIFxuICBAbWV0aG9kIHJlc2l6ZVxuKi9cblxucnRpbWUgPSBuZXcgRGF0ZSgxLCAxLCAyMDAwLCAxMiwgMDAsIDAwKTtcbnRpbWVvdXQgPSBmYWxzZTtcbmRlbHRhID0gMjtcbnZhciBzY3JvbGxMZWZ0ID0gMDtcbnZhciBvbGRXaWR0aCA9IDA7XG52YXIgbWFya2VyTWFyZ2luVG9wID0gLTE7XG52YXIgaXNEZXNrdG9wU2l6ZSA9IHRydWU7XG5cbiQod2luZG93KS5vbihcInJlc2l6ZVwiLCBmdW5jdGlvbigpIHtcbiAgICBydGltZSA9IG5ldyBEYXRlKCk7XG4gICAgaWYgKHRpbWVvdXQgPT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSB0cnVlO1xuICAgICAgICBzY3JvbGxMZWZ0ID0gJChcIi5wZ0NoYXJ0XCIpLnNjcm9sbExlZnQoKTtcbiAgICAgICAgb2xkV2lkdGggPSAkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpO1xuICAgICAgICBzZXRUaW1lb3V0KHJlc2l6ZWVuZCwgZGVsdGEpO1xuICAgIH1cblxuICAgIGlmIChpc0Rlc2t0b3BTaXplICYmICQod2luZG93KS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQgKyAyMCkge1xuICAgICAgaXNEZXNrdG9wU2l6ZSA9IGZhbHNlO1xuICAgICAgdXBkYXRlTW9zcXVpdG9zUGF0aHMoKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIWlzRGVza3RvcFNpemUgJiYgJCh3aW5kb3cpLndpZHRoKCkgPj0gdGFibGV0VHJlc2hvbGQgKyAyMCkge1xuICAgICAgaXNEZXNrdG9wU2l6ZSA9IHRydWU7XG4gICAgICB1cGRhdGVNb3NxdWl0b3NQYXRocygpO1xuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiByZXNpemVlbmQoKSB7XG4gICAgaWYgKG5ldyBEYXRlKCkgLSBydGltZSA8IGRlbHRhKSB7XG4gICAgICAgIHNldFRpbWVvdXQobWFpbi5yZXNpemVlbmQsIGRlbHRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZW91dCA9IGZhbHNlO1xuICAgICAgLy9zZXR1cENhbnZhcygpOyBcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgY2FudmFzLndpZHRoID0gJCgnLmhvcml6b250YWwtYmFja2dyb3VuZCBpbWcnKS53aWR0aCgpO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gJCgnLmhvcml6b250YWwtYmFja2dyb3VuZCBpbWcnKS5oZWlnaHQoKTtcbiAgICAgICAgY2FudmFzLnN0eWxlLndpZHRoICA9IGNhbnZhcy53aWR0aC50b1N0cmluZygpICsgXCJweFwiO1xuICAgICAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gY2FudmFzLmhlaWdodC50b1N0cmluZygpICsgXCJweFwiO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNhbnZhcy53aWR0aCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS53aWR0aCgpO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLmhlaWdodCgpO1xuICAgICAgICBjYW52YXMuc3R5bGUud2lkdGggID0gY2FudmFzLndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gICAgICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBjYW52YXMuaGVpZ2h0LnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gICAgICB9XG5cbiAgICAgIGlmICgkKHdpbmRvdykud2lkdGgoKSA8IDUyMCkge1xuICAgICAgICAkKCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZVwiKVsxXSkuaHRtbChcIk1FRCAxNSVcIik7XG4gICAgICAgICQoJChcIi5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlXCIpWzVdKS5odG1sKFwiTUVEIDE1JVwiKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAkKCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZVwiKVsxXSkuaHRtbChcIk1FRElVTSAxNSVcIik7XG4gICAgICAgICQoJChcIi5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlXCIpWzVdKS5odG1sKFwiTUVESVVNIDE1JVwiKTtcbiAgICAgIH1cbiAgICB9XG59XG5cbnZhciB1cGRhdGVNb3NxdWl0b3NQYXRocyA9IGZ1bmN0aW9uKCkge1xuICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0LmNhbnZhcy53aWR0aCwgY29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICBzd2l0Y2ggKGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTFbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxLmxlbmd0aF07XG5cbiAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgIFxuICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC41MSwgTWF0aC5taW4oMC45NSwgYXV4RWxlbWVudC54KSkgKyAwLjAyO1xuICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gTWF0aC5tYXgoMC4xLCBNYXRoLm1pbigwLjMsIGF1eEVsZW1lbnQueSkpO1xuXG4gICAgICAgICAgICBpZiAoIWlzRGVza3RvcFNpemUpIHtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gYXV4RWxlbWVudC54O1xuICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBhdXhFbGVtZW50LnkgKyAwLjI3O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMC4xICYmIGF1eEVsZW1lbnQueCA8PSAwLjQ5KSB7XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gYXV4RWxlbWVudC54ICsgMC4yO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMlNbMF07XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMlswXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoISgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UzU1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTNTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UzW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMy5sZW5ndGhdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSBNYXRoLm1heCgwLjA4NixNYXRoLm1pbigwLjEzNSwgYXV4RWxlbWVudC54KSkgKyAwLjAxO1xuICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IE1hdGgubWF4KDAuNTU1LE1hdGgubWluKDAuNzE1LCBhdXhFbGVtZW50LnkpKSArIDAuMDQ7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFNbMF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQ6XG4gICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U1W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNS5sZW5ndGhdO1xuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNVNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U1Uy5sZW5ndGhdO1xuICAgICAgICB9XG5cbiAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApfTtcbiAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IE1hdGgubWF4KDAuMDc2LE1hdGgubWluKDAuMTUsIGF1eEVsZW1lbnQueCkpICsgMC4wMTtcbiAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IE1hdGgubWF4KDAuODEsTWF0aC5taW4oMC44NiwgYXV4RWxlbWVudC55KSkgKyAwLjA1O1xuICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjE0IHx8IGF1eEVsZW1lbnQueCA8PSAwLjA4Nykge1xuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDAuODIpIHtcbiAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBhdXhFbGVtZW50LnkgKyAwLjA0O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2UgaWYgKGF1eEVsZW1lbnQueSA+PSAwLjgzKSB7XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gYXV4RWxlbWVudC55IC0gMC4wMjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA2OlxuICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgIGN1cnJlbnRQaGFzZSA9IDM7XG5cbiAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgJChcIiNwZ1N0ZXAyIC5wZy1idXR0b25cIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICQoXCIjcGdTdGVwMlwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTdbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3Lmxlbmd0aF07XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3U1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTdTLmxlbmd0aF07XG4gICAgICAgIH1cblxuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApfTtcbiAgICAgICAgICBpZiAoYXV4RWxlbWVudC54ID49IDAuNDIgfHwgYXV4RWxlbWVudC54IDw9IDAuMzkpIHtcbiAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS4yMDY2MTAxNjk0OTE1MjYpIHtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4yMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGF1eEVsZW1lbnQueSA+PSAxLjI4KSB7XG4gICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IDEuMjg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC40OSkge1xuICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSAwLjQ5XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54IDw9IDAuMzYpIHtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC4zNlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA+PSAxLjMpIHtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4zXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDEuMTkpIHtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4xOVxuICAgICAgICAgICAgfVxuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNzpcbiAgICAgICAgaWYgKGluZGV4ID4gYXV4TW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFNbMF1baV0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2U1swXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2U1swXVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFNbMF1baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U0WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF1baV0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZbMF1baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFswXVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlNbMF1baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThTWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThTWzBdW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2WzBdW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF1baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDMpKi87XG4gICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDMpKi87XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDg6XG4gICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTkubGVuZ3RoXTtcblxuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVMubGVuZ3RoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVMubGVuZ3RoXTtcbiAgICAgICAgfVxuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC44ODUgfHwgYXV4RWxlbWVudC54IDw9IDAuODA2KSB7XG4gICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS40ODcpIHtcbiAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjQ4NztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIGlmIChhdXhFbGVtZW50LnkgPj0gMS41NTgpIHtcbiAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjU1ODtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjg5OCkge1xuICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IDAuODk4O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPD0gMC43OSkge1xuICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IDAuNzk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA+PSAxLjU3KSB7XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS41NztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDEuNDcpIHtcbiAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjQ3O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IGF1eEVsZW1lbnQueCArIDAuMDU3O1xuICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBhdXhFbGVtZW50LnkgKyAwLjExNTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDk6XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTA6XG4gICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgXG4gICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICQoXCIjcGdTdGVwMyAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAkKFwiI3BnU3RlcDNcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExLmxlbmd0aF07XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVMubGVuZ3RoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGVsZW1lbnQyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSAtIDAuMDE4LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEwU1swXVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMlNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyU1swXVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTBbMF1baV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTJbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyWzBdW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTI6XG4gICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgXG4gICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICQoXCIjcGdTdGVwMyAucGctYnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgICAgICQoXCIjcGdTdGVwM1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICAgICAgICQoXCIucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKS5yZW1vdmVDbGFzcyhcImRpc2FibGVkLW9wdGlvblwiKTtcbiAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzIC5wZy1idXR0b24nKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMycpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMy5sZW5ndGhdO1xuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNTLmxlbmd0aF07XG4gICAgICAgIH1cblxuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpICogMS4wKSArIDAuMDA1LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSAtIDAuMDEgKyAwLjI3NX07XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxMzpcbiAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE0WzBdO1xuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNFNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNDpcbiAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE1Lmxlbmd0aF07XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNVNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNVMubGVuZ3RoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGVsZW1lbnQyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSkgKiAxLjApICsgMC4wMDUsIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApIC0gMC4wMSArIDAuMjc1fTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE1OlxuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNlswXTtcblxuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTZTWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTY6XG4gICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcblxuICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE3W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTcubGVuZ3RoXTtcblxuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE3U1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE3Uy5sZW5ndGhdO1xuICAgICAgICB9XG5cbiAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCkgKyAwLjAwNSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCkgKyAwLjI3NX07XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNzpcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE4U1swXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOFswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxODpcbiAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTlbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOS5sZW5ndGhdO1xuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTlTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTlTLmxlbmd0aF07XG4gICAgICAgIH1cblxuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIC8vZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgLSAwLjAwNTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApICsgMC4zN307XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxOTpcbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjBbMF07XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIwU1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyMDpcbiAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMS5sZW5ndGhdO1xuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFTLmxlbmd0aF07XG4gICAgICAgIH1cblxuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIC8vZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgLSAwLjAwNTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApICsgMC4zN307XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyMTpcbiAgICAgICAgbWFya2VyTWFyZ2luVG9wID0gKDIwIC0gbmV3WSk7XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwidG9wXCIsIG5ld1lTKyBcIiVcIik7XG4gICAgICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJsZWZ0XCIsICAobmV3WFMgKiAxMDApICsgXCIlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwibWFyZ2luLXRvcFwiLCAgbmV3UmVhbFkrIFwiJVwiKTtcbiAgICAgICAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcImxlZnRcIiwgIChuZXdYICogMTAwKSArIFwiJVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNyZWF0ZVVzZXJzU3RhdHMobmV3WCwgbmV3WSwgY2VsbCk7XG5cbiAgICAgICAgbWFya2VyUG9zID0gJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5wb3NpdGlvbigpO1xuXG4gICAgICAgIHZhciBuZXdQb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDogbWFya2VyUG9zLmxlZnQgLyBjYW52YXMud2lkdGgsIHk6ICgobWFya2VyUG9zLnRvcCArIHBhcnNlSW50KCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwibWFyZ2luLXRvcFwiKSkpICsgJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydCcpLnBvc2l0aW9uKCkudG9wICsgJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5oZWlnaHQoKSkgLyBjYW52YXMud2lkdGh9KTtcblxuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBtYXJrZXJQb3MgPSAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLnBvc2l0aW9uKCk7XG4gICAgICAgICAgbmV3UG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6ICgobWFya2VyUG9zLmxlZnQgKyAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlcicpLnBvc2l0aW9uKCkubGVmdCArIHBhcnNlSW50KCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyJykuY3NzKFwibWFyZ2luLWxlZnRcIikpKSAvIDAuMTI1ICkgLyBjYW52YXMud2lkdGgsIHk6ICgoIChtYXJrZXJQb3MudG9wICsgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5oZWlnaHQoKSArIHBhcnNlSW50KCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlclwiKS5jc3MoXCJtYXJnaW4tdG9wXCIpKSApICsgKCgkKFwiI21vc3F1aXRvc0NhbnZhc1wiKS5oZWlnaHQoKSAtICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyJykuaGVpZ2h0KCkpIC8gMi4wKSApIC8gMC4xMjUpIC8gY2FudmFzLndpZHRofSk7XG4gICAgICAgICAgXG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPD0gNzM2ICYmICQoXCIjaG9yaXpvbnRhbC1jb25jbHVzaW9ucy1idXR0b25cIikuY3NzKFwiZGlzcGxheVwiKSA9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcucGdDb25jbHVzaW9ucycpLnBvc2l0aW9uKCkubGVmdFxuICAgICAgICAgICAgICAgIH0sIDI1MDApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSwgMzAwMCk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyMjpcbiAgICAgICAgLy8gMjFcbiAgICAgICAgbWFya2VyTWFyZ2luVG9wID0gKDIwIC0gbmV3WSk7XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwidG9wXCIsIG5ld1lTKyBcIiVcIik7XG4gICAgICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJsZWZ0XCIsICAobmV3WFMgKiAxMDApICsgXCIlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwibWFyZ2luLXRvcFwiLCAgbmV3UmVhbFkrIFwiJVwiKTtcbiAgICAgICAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcImxlZnRcIiwgIChuZXdYICogMTAwKSArIFwiJVwiKTtcbiAgICAgICAgfVxuICAgICAgICBjcmVhdGVVc2Vyc1N0YXRzKG5ld1gsIG5ld1ksIGNlbGwpO1xuXG4gICAgICAgIG1hcmtlclBvcyA9ICQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykucG9zaXRpb24oKTtcblxuICAgICAgICB2YXIgbmV3UG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6IG1hcmtlclBvcy5sZWZ0IC8gY2FudmFzLndpZHRoLCB5OiAoKG1hcmtlclBvcy50b3AgKyBwYXJzZUludCgkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcIm1hcmdpbi10b3BcIikpKSArICQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQnKS5wb3NpdGlvbigpLnRvcCArICQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuaGVpZ2h0KCkpIC8gY2FudmFzLndpZHRofSk7XG5cblxuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgbWFya2VyUG9zID0gJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5wb3NpdGlvbigpO1xuICAgICAgICAgIG5ld1Bvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OiAoKG1hcmtlclBvcy5sZWZ0ICsgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXInKS5wb3NpdGlvbigpLmxlZnQgKyBwYXJzZUludCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlcicpLmNzcyhcIm1hcmdpbi1sZWZ0XCIpKSkgLyAwLjEyNSApIC8gY2FudmFzLndpZHRoLCB5OiAoKCAobWFya2VyUG9zLnRvcCArICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuaGVpZ2h0KCkgKyBwYXJzZUludCgkKFwiLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXJcIikuY3NzKFwibWFyZ2luLXRvcFwiKSkgKSArICgoJChcIiNtb3NxdWl0b3NDYW52YXNcIikuaGVpZ2h0KCkgLSAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlcicpLmhlaWdodCgpKSAvIDIuMCkgKSAvIDAuMTI1KSAvIGNhbnZhcy53aWR0aH0pO1xuICAgICAgICAgIFxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDw9IDczNiAmJiAkKFwiI2hvcml6b250YWwtY29uY2x1c2lvbnMtYnV0dG9uXCIpLmNzcyhcImRpc3BsYXlcIikgPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVmdDogJCgnLnBnQ29uY2x1c2lvbnMnKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgICAgICAgICB9LCAyNTAwKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheShlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSlcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyBpKyspIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaCh7eDogZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXS54ICsgKChNYXRoLnJhbmRvbSgpICogMC4wNjYpIC0gMC4wMzMpLCB5OiBlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLnkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjA2NikgLSAwLjAzMyl9KTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG4gICAgZWxlbWVudC54ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICBlbGVtZW50LnkgPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55O1xuXG4gICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgIH1cblxuICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG59XG5cbnZhciBIID0gJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSxcbiBTID0gJChcIi5wZ0NoYXJ0XCIpLnNjcm9sbExlZnQoKSxcbiBQID0gUy9IO1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgaWYgKCQod2luZG93KS53aWR0aCgpID49IHRhYmxldFRyZXNob2xkICsgMjApIHtcbiAgICBpc0Rlc2t0b3BTaXplID0gdHJ1ZTtcbiAgfVxuICBlbHNlIHtcbiAgICBpc0Rlc2t0b3BTaXplID0gZmFsc2U7XG4gIH1cbiAgJChcIi5wZ0NoYXJ0XCIpLnNjcm9sbChmdW5jdGlvbigpIHtcbiAgICBTID0gJChcIi5wZ0NoYXJ0XCIpLnNjcm9sbExlZnQoKTtcbiAgICBQID0gUy9IO1xuICB9KTtcblxuICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uKCkge1xuICAgICAgSCA9ICQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCk7XG4gICAgICAkKFwiLnBnQ2hhcnRcIikuc2Nyb2xsTGVmdChQKkgpO1xuICAgICAgJCgnI3Jlc2l6ZS13YXJuaW5nJykuY3NzKFwid2lkdGhcIiwgJChcIi5wZ0NoYXJ0XCIpLndpZHRoKCkgKyBcInB4XCIpO1xuICAgICAgJCgnI3Jlc2l6ZS13YXJuaW5nJykuY3NzKFwiaGVpZ2h0XCIsICQoXCIucGdDaGFydFwiKS5oZWlnaHQoKSArIFwicHhcIik7XG4gIH0pO1xuXG4gICQoJyNyZXNpemUtd2FybmluZycpLmNzcyhcIndpZHRoXCIsICQoXCIucGdDaGFydFwiKS53aWR0aCgpICsgXCJweFwiKTtcbiAgJCgnI3Jlc2l6ZS13YXJuaW5nJykuY3NzKFwiaGVpZ2h0XCIsICQoXCIucGdDaGFydFwiKS5oZWlnaHQoKSArIFwicHhcIik7XG5cbiAgLy9TZXQgdXAgbmVlZGVkIGZ1bmN0aW9uc1xuICBtYW5hZ2VRdWVzdGlvbnNTY3JvbGwoKTtcbiAgbWFuYWdlU3RlcHNBY3Rpb24oKTtcbiAgc2VsZWN0T3B0aW9uKCk7XG4gIHNlbGVjdEJpbmFyeU9wdGlvbigpO1xuICBzZWxlY3RQcmVnbmFuY3lPcHRpb24oKTtcbiAgYW5pbWF0ZUVsZW1lbnRzUHJlZ25hbmN5KCk7XG4gIGFuaW1hdGVCZWhhdmlvckVsZW1lbnRzKCk7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgLy9zZXR1cENhbnZhcygpO1xuICAgIHNldHVwTW9zcXVpdG9zKCk7XG4gICAgSCA9ICQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCk7XG4gICAgUyA9ICQoXCIucGdDaGFydFwiKS5zY3JvbGxMZWZ0KCk7XG4gICAgUCA9IFMvSDtcbiAgfSwgNTAwKTtcbiAgc2V0dXBNYWluTG9vcCgpO1xuXG4gIC8qJChkb2N1bWVudCkub24oXCJjbGlja1wiLCBmdW5jdGlvbihlKSB7XG4gICAgLy9jb25zb2xlLmxvZygne3g6JysoKGUucGFnZVgvJChcImNhbnZhc1wiKS53aWR0aCgpKSAtIDAuMTk1KSArICcsIHk6JyArICgoKGUucGFnZVkgLSA1NjQpLyQoXCJjYW52YXNcIikud2lkdGgoKSkpICsgJ30nKTtcbiAgICB2YXIgeCA9IGUucGFnZVggLSAkKCcjbW9zcXVpdG9zQ2FudmFzJykub2Zmc2V0KCkubGVmdDtcbiAgICB2YXIgeSA9IGUucGFnZVkgLSAkKCcjbW9zcXVpdG9zQ2FudmFzJykub2Zmc2V0KCkudG9wO1xuXG4gICAgY29uc29sZS5sb2coJ3t4OicrKCgoeCAvIDAuMTI1KS8kKFwiY2FudmFzXCIpLndpZHRoKCkpKSArICcsIHk6JyArICgoKHkgLyAwLjEyNSkvJChcImNhbnZhc1wiKS53aWR0aCgpKSkgKyAnfScpO1xuICB9KTsqL1xufSk7XG4iLCJ3aW5kb3cudHd0dHIgPSAoZnVuY3Rpb24gKGQsIHMsIGlkKSB7XG4gIHZhciB0LCBqcywgZmpzID0gZC5nZXRFbGVtZW50c0J5VGFnTmFtZShzKVswXTtcbiAgaWYgKGQuZ2V0RWxlbWVudEJ5SWQoaWQpKSByZXR1cm47XG4gIGpzID0gZC5jcmVhdGVFbGVtZW50KHMpOyBqcy5pZCA9IGlkO1xuICBqcy5zcmM9IFwiaHR0cHM6Ly9wbGF0Zm9ybS50d2l0dGVyLmNvbS93aWRnZXRzLmpzXCI7XG4gIGZqcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShqcywgZmpzKTtcbiAgcmV0dXJuIHdpbmRvdy50d3R0ciB8fCAodCA9IHsgX2U6IFtdLCByZWFkeTogZnVuY3Rpb24gKGYpIHsgdC5fZS5wdXNoKGYpIH0gfSk7XG59KGRvY3VtZW50LCBcInNjcmlwdFwiLCBcInR3aXR0ZXItd2pzXCIpKTsiXX0=
