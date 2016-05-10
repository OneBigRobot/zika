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
      case 21:
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
        alert("ss");
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
            else {mos
              element.yDir = true;
            }

            element.currentMosquitoPhase = 22;
            element.speed = 0.0001;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGFtbWVyanMvaGFtbWVyLmpzIiwic3JjL2pzL2Jhc2UuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvaWZyYW1lLmpzIiwic3JjL2pzL3BnLXRlbXBsYXRlL3BiSGVhZGVyLmpzIiwic3JjL2pzL3BnLXRlbXBsYXRlL3BiU29jaWFsVG9vbHMuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvcG9zdEdyYXBoaWNzVGVtcGxhdGUuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvdHdpdHRlci1mb2xsb3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Z0ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ242SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiEgSGFtbWVyLkpTIC0gdjIuMC42IC0gMjAxNS0xMi0yM1xuICogaHR0cDovL2hhbW1lcmpzLmdpdGh1Yi5pby9cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgSm9yaWsgVGFuZ2VsZGVyO1xuICogTGljZW5zZWQgdW5kZXIgdGhlICBsaWNlbnNlICovXG4oZnVuY3Rpb24od2luZG93LCBkb2N1bWVudCwgZXhwb3J0TmFtZSwgdW5kZWZpbmVkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxudmFyIFZFTkRPUl9QUkVGSVhFUyA9IFsnJywgJ3dlYmtpdCcsICdNb3onLCAnTVMnLCAnbXMnLCAnbyddO1xudmFyIFRFU1RfRUxFTUVOVCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG52YXIgVFlQRV9GVU5DVElPTiA9ICdmdW5jdGlvbic7XG5cbnZhciByb3VuZCA9IE1hdGgucm91bmQ7XG52YXIgYWJzID0gTWF0aC5hYnM7XG52YXIgbm93ID0gRGF0ZS5ub3c7XG5cbi8qKlxuICogc2V0IGEgdGltZW91dCB3aXRoIGEgZ2l2ZW4gc2NvcGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge051bWJlcn0gdGltZW91dFxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIHNldFRpbWVvdXRDb250ZXh0KGZuLCB0aW1lb3V0LCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoYmluZEZuKGZuLCBjb250ZXh0KSwgdGltZW91dCk7XG59XG5cbi8qKlxuICogaWYgdGhlIGFyZ3VtZW50IGlzIGFuIGFycmF5LCB3ZSB3YW50IHRvIGV4ZWN1dGUgdGhlIGZuIG9uIGVhY2ggZW50cnlcbiAqIGlmIGl0IGFpbnQgYW4gYXJyYXkgd2UgZG9uJ3Qgd2FudCB0byBkbyBhIHRoaW5nLlxuICogdGhpcyBpcyB1c2VkIGJ5IGFsbCB0aGUgbWV0aG9kcyB0aGF0IGFjY2VwdCBhIHNpbmdsZSBhbmQgYXJyYXkgYXJndW1lbnQuXG4gKiBAcGFyYW0geyp8QXJyYXl9IGFyZ1xuICogQHBhcmFtIHtTdHJpbmd9IGZuXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaW52b2tlQXJyYXlBcmcoYXJnLCBmbiwgY29udGV4dCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgICAgZWFjaChhcmcsIGNvbnRleHRbZm5dLCBjb250ZXh0KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiB3YWxrIG9iamVjdHMgYW5kIGFycmF5c1xuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGVhY2gob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBpO1xuXG4gICAgaWYgKCFvYmopIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChvYmouZm9yRWFjaCkge1xuICAgICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgb2JqLmxlbmd0aCkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgaW4gb2JqKSB7XG4gICAgICAgICAgICBvYmouaGFzT3duUHJvcGVydHkoaSkgJiYgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogd3JhcCBhIG1ldGhvZCB3aXRoIGEgZGVwcmVjYXRpb24gd2FybmluZyBhbmQgc3RhY2sgdHJhY2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uIHdyYXBwaW5nIHRoZSBzdXBwbGllZCBtZXRob2QuXG4gKi9cbmZ1bmN0aW9uIGRlcHJlY2F0ZShtZXRob2QsIG5hbWUsIG1lc3NhZ2UpIHtcbiAgICB2YXIgZGVwcmVjYXRpb25NZXNzYWdlID0gJ0RFUFJFQ0FURUQgTUVUSE9EOiAnICsgbmFtZSArICdcXG4nICsgbWVzc2FnZSArICcgQVQgXFxuJztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlID0gbmV3IEVycm9yKCdnZXQtc3RhY2stdHJhY2UnKTtcbiAgICAgICAgdmFyIHN0YWNrID0gZSAmJiBlLnN0YWNrID8gZS5zdGFjay5yZXBsYWNlKC9eW15cXChdKz9bXFxuJF0vZ20sICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL15cXHMrYXRcXHMrL2dtLCAnJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9eT2JqZWN0Ljxhbm9ueW1vdXM+XFxzKlxcKC9nbSwgJ3thbm9ueW1vdXN9KClAJykgOiAnVW5rbm93biBTdGFjayBUcmFjZSc7XG5cbiAgICAgICAgdmFyIGxvZyA9IHdpbmRvdy5jb25zb2xlICYmICh3aW5kb3cuY29uc29sZS53YXJuIHx8IHdpbmRvdy5jb25zb2xlLmxvZyk7XG4gICAgICAgIGlmIChsb2cpIHtcbiAgICAgICAgICAgIGxvZy5jYWxsKHdpbmRvdy5jb25zb2xlLCBkZXByZWNhdGlvbk1lc3NhZ2UsIHN0YWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBleHRlbmQgb2JqZWN0LlxuICogbWVhbnMgdGhhdCBwcm9wZXJ0aWVzIGluIGRlc3Qgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSB0aGUgb25lcyBpbiBzcmMuXG4gKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0XG4gKiBAcGFyYW0gey4uLk9iamVjdH0gb2JqZWN0c190b19hc3NpZ25cbiAqIEByZXR1cm5zIHtPYmplY3R9IHRhcmdldFxuICovXG52YXIgYXNzaWduO1xuaWYgKHR5cGVvZiBPYmplY3QuYXNzaWduICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKHRhcmdldCkge1xuICAgICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQgfHwgdGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvdXRwdXQgPSBPYmplY3QodGFyZ2V0KTtcbiAgICAgICAgZm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKHNvdXJjZSAhPT0gdW5kZWZpbmVkICYmIHNvdXJjZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG5leHRLZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkobmV4dEtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFtuZXh0S2V5XSA9IHNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG59IGVsc2Uge1xuICAgIGFzc2lnbiA9IE9iamVjdC5hc3NpZ247XG59XG5cbi8qKlxuICogZXh0ZW5kIG9iamVjdC5cbiAqIG1lYW5zIHRoYXQgcHJvcGVydGllcyBpbiBkZXN0IHdpbGwgYmUgb3ZlcndyaXR0ZW4gYnkgdGhlIG9uZXMgaW4gc3JjLlxuICogQHBhcmFtIHtPYmplY3R9IGRlc3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBzcmNcbiAqIEBwYXJhbSB7Qm9vbGVhbj1mYWxzZX0gW21lcmdlXVxuICogQHJldHVybnMge09iamVjdH0gZGVzdFxuICovXG52YXIgZXh0ZW5kID0gZGVwcmVjYXRlKGZ1bmN0aW9uIGV4dGVuZChkZXN0LCBzcmMsIG1lcmdlKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhzcmMpO1xuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGtleXMubGVuZ3RoKSB7XG4gICAgICAgIGlmICghbWVyZ2UgfHwgKG1lcmdlICYmIGRlc3Rba2V5c1tpXV0gPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIGRlc3Rba2V5c1tpXV0gPSBzcmNba2V5c1tpXV07XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbn0sICdleHRlbmQnLCAnVXNlIGBhc3NpZ25gLicpO1xuXG4vKipcbiAqIG1lcmdlIHRoZSB2YWx1ZXMgZnJvbSBzcmMgaW4gdGhlIGRlc3QuXG4gKiBtZWFucyB0aGF0IHByb3BlcnRpZXMgdGhhdCBleGlzdCBpbiBkZXN0IHdpbGwgbm90IGJlIG92ZXJ3cml0dGVuIGJ5IHNyY1xuICogQHBhcmFtIHtPYmplY3R9IGRlc3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBzcmNcbiAqIEByZXR1cm5zIHtPYmplY3R9IGRlc3RcbiAqL1xudmFyIG1lcmdlID0gZGVwcmVjYXRlKGZ1bmN0aW9uIG1lcmdlKGRlc3QsIHNyYykge1xuICAgIHJldHVybiBleHRlbmQoZGVzdCwgc3JjLCB0cnVlKTtcbn0sICdtZXJnZScsICdVc2UgYGFzc2lnbmAuJyk7XG5cbi8qKlxuICogc2ltcGxlIGNsYXNzIGluaGVyaXRhbmNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjaGlsZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gYmFzZVxuICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzXVxuICovXG5mdW5jdGlvbiBpbmhlcml0KGNoaWxkLCBiYXNlLCBwcm9wZXJ0aWVzKSB7XG4gICAgdmFyIGJhc2VQID0gYmFzZS5wcm90b3R5cGUsXG4gICAgICAgIGNoaWxkUDtcblxuICAgIGNoaWxkUCA9IGNoaWxkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoYmFzZVApO1xuICAgIGNoaWxkUC5jb25zdHJ1Y3RvciA9IGNoaWxkO1xuICAgIGNoaWxkUC5fc3VwZXIgPSBiYXNlUDtcblxuICAgIGlmIChwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGFzc2lnbihjaGlsZFAsIHByb3BlcnRpZXMpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBzaW1wbGUgZnVuY3Rpb24gYmluZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGJpbmRGbihmbiwgY29udGV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbiBib3VuZEZuKCkge1xuICAgICAgICByZXR1cm4gZm4uYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIGxldCBhIGJvb2xlYW4gdmFsdWUgYWxzbyBiZSBhIGZ1bmN0aW9uIHRoYXQgbXVzdCByZXR1cm4gYSBib29sZWFuXG4gKiB0aGlzIGZpcnN0IGl0ZW0gaW4gYXJncyB3aWxsIGJlIHVzZWQgYXMgdGhlIGNvbnRleHRcbiAqIEBwYXJhbSB7Qm9vbGVhbnxGdW5jdGlvbn0gdmFsXG4gKiBAcGFyYW0ge0FycmF5fSBbYXJnc11cbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5mdW5jdGlvbiBib29sT3JGbih2YWwsIGFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIHZhbCA9PSBUWVBFX0ZVTkNUSU9OKSB7XG4gICAgICAgIHJldHVybiB2YWwuYXBwbHkoYXJncyA/IGFyZ3NbMF0gfHwgdW5kZWZpbmVkIDogdW5kZWZpbmVkLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbDtcbn1cblxuLyoqXG4gKiB1c2UgdGhlIHZhbDIgd2hlbiB2YWwxIGlzIHVuZGVmaW5lZFxuICogQHBhcmFtIHsqfSB2YWwxXG4gKiBAcGFyYW0geyp9IHZhbDJcbiAqIEByZXR1cm5zIHsqfVxuICovXG5mdW5jdGlvbiBpZlVuZGVmaW5lZCh2YWwxLCB2YWwyKSB7XG4gICAgcmV0dXJuICh2YWwxID09PSB1bmRlZmluZWQpID8gdmFsMiA6IHZhbDE7XG59XG5cbi8qKlxuICogYWRkRXZlbnRMaXN0ZW5lciB3aXRoIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXRcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICovXG5mdW5jdGlvbiBhZGRFdmVudExpc3RlbmVycyh0YXJnZXQsIHR5cGVzLCBoYW5kbGVyKSB7XG4gICAgZWFjaChzcGxpdFN0cih0eXBlcyksIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIHJlbW92ZUV2ZW50TGlzdGVuZXIgd2l0aCBtdWx0aXBsZSBldmVudHMgYXQgb25jZVxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0XG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAqL1xuZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcnModGFyZ2V0LCB0eXBlcywgaGFuZGxlcikge1xuICAgIGVhY2goc3BsaXRTdHIodHlwZXMpLCBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBmaW5kIGlmIGEgbm9kZSBpcyBpbiB0aGUgZ2l2ZW4gcGFyZW50XG4gKiBAbWV0aG9kIGhhc1BhcmVudFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZVxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gcGFyZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufSBmb3VuZFxuICovXG5mdW5jdGlvbiBoYXNQYXJlbnQobm9kZSwgcGFyZW50KSB7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogc21hbGwgaW5kZXhPZiB3cmFwcGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICogQHJldHVybnMge0Jvb2xlYW59IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIGluU3RyKHN0ciwgZmluZCkge1xuICAgIHJldHVybiBzdHIuaW5kZXhPZihmaW5kKSA+IC0xO1xufVxuXG4vKipcbiAqIHNwbGl0IHN0cmluZyBvbiB3aGl0ZXNwYWNlXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJucyB7QXJyYXl9IHdvcmRzXG4gKi9cbmZ1bmN0aW9uIHNwbGl0U3RyKHN0cikge1xuICAgIHJldHVybiBzdHIudHJpbSgpLnNwbGl0KC9cXHMrL2cpO1xufVxuXG4vKipcbiAqIGZpbmQgaWYgYSBhcnJheSBjb250YWlucyB0aGUgb2JqZWN0IHVzaW5nIGluZGV4T2Ygb3IgYSBzaW1wbGUgcG9seUZpbGxcbiAqIEBwYXJhbSB7QXJyYXl9IHNyY1xuICogQHBhcmFtIHtTdHJpbmd9IGZpbmRcbiAqIEBwYXJhbSB7U3RyaW5nfSBbZmluZEJ5S2V5XVxuICogQHJldHVybiB7Qm9vbGVhbnxOdW1iZXJ9IGZhbHNlIHdoZW4gbm90IGZvdW5kLCBvciB0aGUgaW5kZXhcbiAqL1xuZnVuY3Rpb24gaW5BcnJheShzcmMsIGZpbmQsIGZpbmRCeUtleSkge1xuICAgIGlmIChzcmMuaW5kZXhPZiAmJiAhZmluZEJ5S2V5KSB7XG4gICAgICAgIHJldHVybiBzcmMuaW5kZXhPZihmaW5kKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgc3JjLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKChmaW5kQnlLZXkgJiYgc3JjW2ldW2ZpbmRCeUtleV0gPT0gZmluZCkgfHwgKCFmaW5kQnlLZXkgJiYgc3JjW2ldID09PSBmaW5kKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG59XG5cbi8qKlxuICogY29udmVydCBhcnJheS1saWtlIG9iamVjdHMgdG8gcmVhbCBhcnJheXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuZnVuY3Rpb24gdG9BcnJheShvYmopIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqLCAwKTtcbn1cblxuLyoqXG4gKiB1bmlxdWUgYXJyYXkgd2l0aCBvYmplY3RzIGJhc2VkIG9uIGEga2V5IChsaWtlICdpZCcpIG9yIGp1c3QgYnkgdGhlIGFycmF5J3MgdmFsdWVcbiAqIEBwYXJhbSB7QXJyYXl9IHNyYyBbe2lkOjF9LHtpZDoyfSx7aWQ6MX1dXG4gKiBAcGFyYW0ge1N0cmluZ30gW2tleV1cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW3NvcnQ9RmFsc2VdXG4gKiBAcmV0dXJucyB7QXJyYXl9IFt7aWQ6MX0se2lkOjJ9XVxuICovXG5mdW5jdGlvbiB1bmlxdWVBcnJheShzcmMsIGtleSwgc29ydCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgIHZhciBpID0gMDtcblxuICAgIHdoaWxlIChpIDwgc3JjLmxlbmd0aCkge1xuICAgICAgICB2YXIgdmFsID0ga2V5ID8gc3JjW2ldW2tleV0gOiBzcmNbaV07XG4gICAgICAgIGlmIChpbkFycmF5KHZhbHVlcywgdmFsKSA8IDApIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChzcmNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlc1tpXSA9IHZhbDtcbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIGlmIChzb3J0KSB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5zb3J0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5zb3J0KGZ1bmN0aW9uIHNvcnRVbmlxdWVBcnJheShhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFba2V5XSA+IGJba2V5XTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKlxuICogZ2V0IHRoZSBwcmVmaXhlZCBwcm9wZXJ0eVxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5XG4gKiBAcmV0dXJucyB7U3RyaW5nfFVuZGVmaW5lZH0gcHJlZml4ZWRcbiAqL1xuZnVuY3Rpb24gcHJlZml4ZWQob2JqLCBwcm9wZXJ0eSkge1xuICAgIHZhciBwcmVmaXgsIHByb3A7XG4gICAgdmFyIGNhbWVsUHJvcCA9IHByb3BlcnR5WzBdLnRvVXBwZXJDYXNlKCkgKyBwcm9wZXJ0eS5zbGljZSgxKTtcblxuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoaSA8IFZFTkRPUl9QUkVGSVhFUy5sZW5ndGgpIHtcbiAgICAgICAgcHJlZml4ID0gVkVORE9SX1BSRUZJWEVTW2ldO1xuICAgICAgICBwcm9wID0gKHByZWZpeCkgPyBwcmVmaXggKyBjYW1lbFByb3AgOiBwcm9wZXJ0eTtcblxuICAgICAgICBpZiAocHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9wO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBnZXQgYSB1bmlxdWUgaWRcbiAqIEByZXR1cm5zIHtudW1iZXJ9IHVuaXF1ZUlkXG4gKi9cbnZhciBfdW5pcXVlSWQgPSAxO1xuZnVuY3Rpb24gdW5pcXVlSWQoKSB7XG4gICAgcmV0dXJuIF91bmlxdWVJZCsrO1xufVxuXG4vKipcbiAqIGdldCB0aGUgd2luZG93IG9iamVjdCBvZiBhbiBlbGVtZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcmV0dXJucyB7RG9jdW1lbnRWaWV3fFdpbmRvd31cbiAqL1xuZnVuY3Rpb24gZ2V0V2luZG93Rm9yRWxlbWVudChlbGVtZW50KSB7XG4gICAgdmFyIGRvYyA9IGVsZW1lbnQub3duZXJEb2N1bWVudCB8fCBlbGVtZW50O1xuICAgIHJldHVybiAoZG9jLmRlZmF1bHRWaWV3IHx8IGRvYy5wYXJlbnRXaW5kb3cgfHwgd2luZG93KTtcbn1cblxudmFyIE1PQklMRV9SRUdFWCA9IC9tb2JpbGV8dGFibGV0fGlwKGFkfGhvbmV8b2QpfGFuZHJvaWQvaTtcblxudmFyIFNVUFBPUlRfVE9VQ0ggPSAoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KTtcbnZhciBTVVBQT1JUX1BPSU5URVJfRVZFTlRTID0gcHJlZml4ZWQod2luZG93LCAnUG9pbnRlckV2ZW50JykgIT09IHVuZGVmaW5lZDtcbnZhciBTVVBQT1JUX09OTFlfVE9VQ0ggPSBTVVBQT1JUX1RPVUNIICYmIE1PQklMRV9SRUdFWC50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG52YXIgSU5QVVRfVFlQRV9UT1VDSCA9ICd0b3VjaCc7XG52YXIgSU5QVVRfVFlQRV9QRU4gPSAncGVuJztcbnZhciBJTlBVVF9UWVBFX01PVVNFID0gJ21vdXNlJztcbnZhciBJTlBVVF9UWVBFX0tJTkVDVCA9ICdraW5lY3QnO1xuXG52YXIgQ09NUFVURV9JTlRFUlZBTCA9IDI1O1xuXG52YXIgSU5QVVRfU1RBUlQgPSAxO1xudmFyIElOUFVUX01PVkUgPSAyO1xudmFyIElOUFVUX0VORCA9IDQ7XG52YXIgSU5QVVRfQ0FOQ0VMID0gODtcblxudmFyIERJUkVDVElPTl9OT05FID0gMTtcbnZhciBESVJFQ1RJT05fTEVGVCA9IDI7XG52YXIgRElSRUNUSU9OX1JJR0hUID0gNDtcbnZhciBESVJFQ1RJT05fVVAgPSA4O1xudmFyIERJUkVDVElPTl9ET1dOID0gMTY7XG5cbnZhciBESVJFQ1RJT05fSE9SSVpPTlRBTCA9IERJUkVDVElPTl9MRUZUIHwgRElSRUNUSU9OX1JJR0hUO1xudmFyIERJUkVDVElPTl9WRVJUSUNBTCA9IERJUkVDVElPTl9VUCB8IERJUkVDVElPTl9ET1dOO1xudmFyIERJUkVDVElPTl9BTEwgPSBESVJFQ1RJT05fSE9SSVpPTlRBTCB8IERJUkVDVElPTl9WRVJUSUNBTDtcblxudmFyIFBST1BTX1hZID0gWyd4JywgJ3knXTtcbnZhciBQUk9QU19DTElFTlRfWFkgPSBbJ2NsaWVudFgnLCAnY2xpZW50WSddO1xuXG4vKipcbiAqIGNyZWF0ZSBuZXcgaW5wdXQgdHlwZSBtYW5hZ2VyXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJucyB7SW5wdXR9XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSW5wdXQobWFuYWdlciwgY2FsbGJhY2spIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgdGhpcy5lbGVtZW50ID0gbWFuYWdlci5lbGVtZW50O1xuICAgIHRoaXMudGFyZ2V0ID0gbWFuYWdlci5vcHRpb25zLmlucHV0VGFyZ2V0O1xuXG4gICAgLy8gc21hbGxlciB3cmFwcGVyIGFyb3VuZCB0aGUgaGFuZGxlciwgZm9yIHRoZSBzY29wZSBhbmQgdGhlIGVuYWJsZWQgc3RhdGUgb2YgdGhlIG1hbmFnZXIsXG4gICAgLy8gc28gd2hlbiBkaXNhYmxlZCB0aGUgaW5wdXQgZXZlbnRzIGFyZSBjb21wbGV0ZWx5IGJ5cGFzc2VkLlxuICAgIHRoaXMuZG9tSGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmIChib29sT3JGbihtYW5hZ2VyLm9wdGlvbnMuZW5hYmxlLCBbbWFuYWdlcl0pKSB7XG4gICAgICAgICAgICBzZWxmLmhhbmRsZXIoZXYpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdCgpO1xuXG59XG5cbklucHV0LnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBzaG91bGQgaGFuZGxlIHRoZSBpbnB1dEV2ZW50IGRhdGEgYW5kIHRyaWdnZXIgdGhlIGNhbGxiYWNrXG4gICAgICogQHZpcnR1YWxcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHsgfSxcblxuICAgIC8qKlxuICAgICAqIGJpbmQgdGhlIGV2ZW50c1xuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmV2RWwgJiYgYWRkRXZlbnRMaXN0ZW5lcnModGhpcy5lbGVtZW50LCB0aGlzLmV2RWwsIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgICAgIHRoaXMuZXZUYXJnZXQgJiYgYWRkRXZlbnRMaXN0ZW5lcnModGhpcy50YXJnZXQsIHRoaXMuZXZUYXJnZXQsIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgICAgIHRoaXMuZXZXaW4gJiYgYWRkRXZlbnRMaXN0ZW5lcnMoZ2V0V2luZG93Rm9yRWxlbWVudCh0aGlzLmVsZW1lbnQpLCB0aGlzLmV2V2luLCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB1bmJpbmQgdGhlIGV2ZW50c1xuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmV2RWwgJiYgcmVtb3ZlRXZlbnRMaXN0ZW5lcnModGhpcy5lbGVtZW50LCB0aGlzLmV2RWwsIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgICAgIHRoaXMuZXZUYXJnZXQgJiYgcmVtb3ZlRXZlbnRMaXN0ZW5lcnModGhpcy50YXJnZXQsIHRoaXMuZXZUYXJnZXQsIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgICAgIHRoaXMuZXZXaW4gJiYgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZ2V0V2luZG93Rm9yRWxlbWVudCh0aGlzLmVsZW1lbnQpLCB0aGlzLmV2V2luLCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgIH1cbn07XG5cbi8qKlxuICogY3JlYXRlIG5ldyBpbnB1dCB0eXBlIG1hbmFnZXJcbiAqIGNhbGxlZCBieSB0aGUgTWFuYWdlciBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtIYW1tZXJ9IG1hbmFnZXJcbiAqIEByZXR1cm5zIHtJbnB1dH1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlSW5wdXRJbnN0YW5jZShtYW5hZ2VyKSB7XG4gICAgdmFyIFR5cGU7XG4gICAgdmFyIGlucHV0Q2xhc3MgPSBtYW5hZ2VyLm9wdGlvbnMuaW5wdXRDbGFzcztcblxuICAgIGlmIChpbnB1dENsYXNzKSB7XG4gICAgICAgIFR5cGUgPSBpbnB1dENsYXNzO1xuICAgIH0gZWxzZSBpZiAoU1VQUE9SVF9QT0lOVEVSX0VWRU5UUykge1xuICAgICAgICBUeXBlID0gUG9pbnRlckV2ZW50SW5wdXQ7XG4gICAgfSBlbHNlIGlmIChTVVBQT1JUX09OTFlfVE9VQ0gpIHtcbiAgICAgICAgVHlwZSA9IFRvdWNoSW5wdXQ7XG4gICAgfSBlbHNlIGlmICghU1VQUE9SVF9UT1VDSCkge1xuICAgICAgICBUeXBlID0gTW91c2VJbnB1dDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBUeXBlID0gVG91Y2hNb3VzZUlucHV0O1xuICAgIH1cbiAgICByZXR1cm4gbmV3IChUeXBlKShtYW5hZ2VyLCBpbnB1dEhhbmRsZXIpO1xufVxuXG4vKipcbiAqIGhhbmRsZSBpbnB1dCBldmVudHNcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50VHlwZVxuICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gKi9cbmZ1bmN0aW9uIGlucHV0SGFuZGxlcihtYW5hZ2VyLCBldmVudFR5cGUsIGlucHV0KSB7XG4gICAgdmFyIHBvaW50ZXJzTGVuID0gaW5wdXQucG9pbnRlcnMubGVuZ3RoO1xuICAgIHZhciBjaGFuZ2VkUG9pbnRlcnNMZW4gPSBpbnB1dC5jaGFuZ2VkUG9pbnRlcnMubGVuZ3RoO1xuICAgIHZhciBpc0ZpcnN0ID0gKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUICYmIChwb2ludGVyc0xlbiAtIGNoYW5nZWRQb2ludGVyc0xlbiA9PT0gMCkpO1xuICAgIHZhciBpc0ZpbmFsID0gKGV2ZW50VHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpICYmIChwb2ludGVyc0xlbiAtIGNoYW5nZWRQb2ludGVyc0xlbiA9PT0gMCkpO1xuXG4gICAgaW5wdXQuaXNGaXJzdCA9ICEhaXNGaXJzdDtcbiAgICBpbnB1dC5pc0ZpbmFsID0gISFpc0ZpbmFsO1xuXG4gICAgaWYgKGlzRmlyc3QpIHtcbiAgICAgICAgbWFuYWdlci5zZXNzaW9uID0ge307XG4gICAgfVxuXG4gICAgLy8gc291cmNlIGV2ZW50IGlzIHRoZSBub3JtYWxpemVkIHZhbHVlIG9mIHRoZSBkb21FdmVudHNcbiAgICAvLyBsaWtlICd0b3VjaHN0YXJ0LCBtb3VzZXVwLCBwb2ludGVyZG93bidcbiAgICBpbnB1dC5ldmVudFR5cGUgPSBldmVudFR5cGU7XG5cbiAgICAvLyBjb21wdXRlIHNjYWxlLCByb3RhdGlvbiBldGNcbiAgICBjb21wdXRlSW5wdXREYXRhKG1hbmFnZXIsIGlucHV0KTtcblxuICAgIC8vIGVtaXQgc2VjcmV0IGV2ZW50XG4gICAgbWFuYWdlci5lbWl0KCdoYW1tZXIuaW5wdXQnLCBpbnB1dCk7XG5cbiAgICBtYW5hZ2VyLnJlY29nbml6ZShpbnB1dCk7XG4gICAgbWFuYWdlci5zZXNzaW9uLnByZXZJbnB1dCA9IGlucHV0O1xufVxuXG4vKipcbiAqIGV4dGVuZCB0aGUgZGF0YSB3aXRoIHNvbWUgdXNhYmxlIHByb3BlcnRpZXMgbGlrZSBzY2FsZSwgcm90YXRlLCB2ZWxvY2l0eSBldGNcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYW5hZ2VyXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUlucHV0RGF0YShtYW5hZ2VyLCBpbnB1dCkge1xuICAgIHZhciBzZXNzaW9uID0gbWFuYWdlci5zZXNzaW9uO1xuICAgIHZhciBwb2ludGVycyA9IGlucHV0LnBvaW50ZXJzO1xuICAgIHZhciBwb2ludGVyc0xlbmd0aCA9IHBvaW50ZXJzLmxlbmd0aDtcblxuICAgIC8vIHN0b3JlIHRoZSBmaXJzdCBpbnB1dCB0byBjYWxjdWxhdGUgdGhlIGRpc3RhbmNlIGFuZCBkaXJlY3Rpb25cbiAgICBpZiAoIXNlc3Npb24uZmlyc3RJbnB1dCkge1xuICAgICAgICBzZXNzaW9uLmZpcnN0SW5wdXQgPSBzaW1wbGVDbG9uZUlucHV0RGF0YShpbnB1dCk7XG4gICAgfVxuXG4gICAgLy8gdG8gY29tcHV0ZSBzY2FsZSBhbmQgcm90YXRpb24gd2UgbmVlZCB0byBzdG9yZSB0aGUgbXVsdGlwbGUgdG91Y2hlc1xuICAgIGlmIChwb2ludGVyc0xlbmd0aCA+IDEgJiYgIXNlc3Npb24uZmlyc3RNdWx0aXBsZSkge1xuICAgICAgICBzZXNzaW9uLmZpcnN0TXVsdGlwbGUgPSBzaW1wbGVDbG9uZUlucHV0RGF0YShpbnB1dCk7XG4gICAgfSBlbHNlIGlmIChwb2ludGVyc0xlbmd0aCA9PT0gMSkge1xuICAgICAgICBzZXNzaW9uLmZpcnN0TXVsdGlwbGUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZmlyc3RJbnB1dCA9IHNlc3Npb24uZmlyc3RJbnB1dDtcbiAgICB2YXIgZmlyc3RNdWx0aXBsZSA9IHNlc3Npb24uZmlyc3RNdWx0aXBsZTtcbiAgICB2YXIgb2Zmc2V0Q2VudGVyID0gZmlyc3RNdWx0aXBsZSA/IGZpcnN0TXVsdGlwbGUuY2VudGVyIDogZmlyc3RJbnB1dC5jZW50ZXI7XG5cbiAgICB2YXIgY2VudGVyID0gaW5wdXQuY2VudGVyID0gZ2V0Q2VudGVyKHBvaW50ZXJzKTtcbiAgICBpbnB1dC50aW1lU3RhbXAgPSBub3coKTtcbiAgICBpbnB1dC5kZWx0YVRpbWUgPSBpbnB1dC50aW1lU3RhbXAgLSBmaXJzdElucHV0LnRpbWVTdGFtcDtcblxuICAgIGlucHV0LmFuZ2xlID0gZ2V0QW5nbGUob2Zmc2V0Q2VudGVyLCBjZW50ZXIpO1xuICAgIGlucHV0LmRpc3RhbmNlID0gZ2V0RGlzdGFuY2Uob2Zmc2V0Q2VudGVyLCBjZW50ZXIpO1xuXG4gICAgY29tcHV0ZURlbHRhWFkoc2Vzc2lvbiwgaW5wdXQpO1xuICAgIGlucHV0Lm9mZnNldERpcmVjdGlvbiA9IGdldERpcmVjdGlvbihpbnB1dC5kZWx0YVgsIGlucHV0LmRlbHRhWSk7XG5cbiAgICB2YXIgb3ZlcmFsbFZlbG9jaXR5ID0gZ2V0VmVsb2NpdHkoaW5wdXQuZGVsdGFUaW1lLCBpbnB1dC5kZWx0YVgsIGlucHV0LmRlbHRhWSk7XG4gICAgaW5wdXQub3ZlcmFsbFZlbG9jaXR5WCA9IG92ZXJhbGxWZWxvY2l0eS54O1xuICAgIGlucHV0Lm92ZXJhbGxWZWxvY2l0eVkgPSBvdmVyYWxsVmVsb2NpdHkueTtcbiAgICBpbnB1dC5vdmVyYWxsVmVsb2NpdHkgPSAoYWJzKG92ZXJhbGxWZWxvY2l0eS54KSA+IGFicyhvdmVyYWxsVmVsb2NpdHkueSkpID8gb3ZlcmFsbFZlbG9jaXR5LnggOiBvdmVyYWxsVmVsb2NpdHkueTtcblxuICAgIGlucHV0LnNjYWxlID0gZmlyc3RNdWx0aXBsZSA/IGdldFNjYWxlKGZpcnN0TXVsdGlwbGUucG9pbnRlcnMsIHBvaW50ZXJzKSA6IDE7XG4gICAgaW5wdXQucm90YXRpb24gPSBmaXJzdE11bHRpcGxlID8gZ2V0Um90YXRpb24oZmlyc3RNdWx0aXBsZS5wb2ludGVycywgcG9pbnRlcnMpIDogMDtcblxuICAgIGlucHV0Lm1heFBvaW50ZXJzID0gIXNlc3Npb24ucHJldklucHV0ID8gaW5wdXQucG9pbnRlcnMubGVuZ3RoIDogKChpbnB1dC5wb2ludGVycy5sZW5ndGggPlxuICAgICAgICBzZXNzaW9uLnByZXZJbnB1dC5tYXhQb2ludGVycykgPyBpbnB1dC5wb2ludGVycy5sZW5ndGggOiBzZXNzaW9uLnByZXZJbnB1dC5tYXhQb2ludGVycyk7XG5cbiAgICBjb21wdXRlSW50ZXJ2YWxJbnB1dERhdGEoc2Vzc2lvbiwgaW5wdXQpO1xuXG4gICAgLy8gZmluZCB0aGUgY29ycmVjdCB0YXJnZXRcbiAgICB2YXIgdGFyZ2V0ID0gbWFuYWdlci5lbGVtZW50O1xuICAgIGlmIChoYXNQYXJlbnQoaW5wdXQuc3JjRXZlbnQudGFyZ2V0LCB0YXJnZXQpKSB7XG4gICAgICAgIHRhcmdldCA9IGlucHV0LnNyY0V2ZW50LnRhcmdldDtcbiAgICB9XG4gICAgaW5wdXQudGFyZ2V0ID0gdGFyZ2V0O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRGVsdGFYWShzZXNzaW9uLCBpbnB1dCkge1xuICAgIHZhciBjZW50ZXIgPSBpbnB1dC5jZW50ZXI7XG4gICAgdmFyIG9mZnNldCA9IHNlc3Npb24ub2Zmc2V0RGVsdGEgfHwge307XG4gICAgdmFyIHByZXZEZWx0YSA9IHNlc3Npb24ucHJldkRlbHRhIHx8IHt9O1xuICAgIHZhciBwcmV2SW5wdXQgPSBzZXNzaW9uLnByZXZJbnB1dCB8fCB7fTtcblxuICAgIGlmIChpbnB1dC5ldmVudFR5cGUgPT09IElOUFVUX1NUQVJUIHx8IHByZXZJbnB1dC5ldmVudFR5cGUgPT09IElOUFVUX0VORCkge1xuICAgICAgICBwcmV2RGVsdGEgPSBzZXNzaW9uLnByZXZEZWx0YSA9IHtcbiAgICAgICAgICAgIHg6IHByZXZJbnB1dC5kZWx0YVggfHwgMCxcbiAgICAgICAgICAgIHk6IHByZXZJbnB1dC5kZWx0YVkgfHwgMFxuICAgICAgICB9O1xuXG4gICAgICAgIG9mZnNldCA9IHNlc3Npb24ub2Zmc2V0RGVsdGEgPSB7XG4gICAgICAgICAgICB4OiBjZW50ZXIueCxcbiAgICAgICAgICAgIHk6IGNlbnRlci55XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaW5wdXQuZGVsdGFYID0gcHJldkRlbHRhLnggKyAoY2VudGVyLnggLSBvZmZzZXQueCk7XG4gICAgaW5wdXQuZGVsdGFZID0gcHJldkRlbHRhLnkgKyAoY2VudGVyLnkgLSBvZmZzZXQueSk7XG59XG5cbi8qKlxuICogdmVsb2NpdHkgaXMgY2FsY3VsYXRlZCBldmVyeSB4IG1zXG4gKiBAcGFyYW0ge09iamVjdH0gc2Vzc2lvblxuICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVJbnRlcnZhbElucHV0RGF0YShzZXNzaW9uLCBpbnB1dCkge1xuICAgIHZhciBsYXN0ID0gc2Vzc2lvbi5sYXN0SW50ZXJ2YWwgfHwgaW5wdXQsXG4gICAgICAgIGRlbHRhVGltZSA9IGlucHV0LnRpbWVTdGFtcCAtIGxhc3QudGltZVN0YW1wLFxuICAgICAgICB2ZWxvY2l0eSwgdmVsb2NpdHlYLCB2ZWxvY2l0eVksIGRpcmVjdGlvbjtcblxuICAgIGlmIChpbnB1dC5ldmVudFR5cGUgIT0gSU5QVVRfQ0FOQ0VMICYmIChkZWx0YVRpbWUgPiBDT01QVVRFX0lOVEVSVkFMIHx8IGxhc3QudmVsb2NpdHkgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgdmFyIGRlbHRhWCA9IGlucHV0LmRlbHRhWCAtIGxhc3QuZGVsdGFYO1xuICAgICAgICB2YXIgZGVsdGFZID0gaW5wdXQuZGVsdGFZIC0gbGFzdC5kZWx0YVk7XG5cbiAgICAgICAgdmFyIHYgPSBnZXRWZWxvY2l0eShkZWx0YVRpbWUsIGRlbHRhWCwgZGVsdGFZKTtcbiAgICAgICAgdmVsb2NpdHlYID0gdi54O1xuICAgICAgICB2ZWxvY2l0eVkgPSB2Lnk7XG4gICAgICAgIHZlbG9jaXR5ID0gKGFicyh2LngpID4gYWJzKHYueSkpID8gdi54IDogdi55O1xuICAgICAgICBkaXJlY3Rpb24gPSBnZXREaXJlY3Rpb24oZGVsdGFYLCBkZWx0YVkpO1xuXG4gICAgICAgIHNlc3Npb24ubGFzdEludGVydmFsID0gaW5wdXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdXNlIGxhdGVzdCB2ZWxvY2l0eSBpbmZvIGlmIGl0IGRvZXNuJ3Qgb3ZlcnRha2UgYSBtaW5pbXVtIHBlcmlvZFxuICAgICAgICB2ZWxvY2l0eSA9IGxhc3QudmVsb2NpdHk7XG4gICAgICAgIHZlbG9jaXR5WCA9IGxhc3QudmVsb2NpdHlYO1xuICAgICAgICB2ZWxvY2l0eVkgPSBsYXN0LnZlbG9jaXR5WTtcbiAgICAgICAgZGlyZWN0aW9uID0gbGFzdC5kaXJlY3Rpb247XG4gICAgfVxuXG4gICAgaW5wdXQudmVsb2NpdHkgPSB2ZWxvY2l0eTtcbiAgICBpbnB1dC52ZWxvY2l0eVggPSB2ZWxvY2l0eVg7XG4gICAgaW5wdXQudmVsb2NpdHlZID0gdmVsb2NpdHlZO1xuICAgIGlucHV0LmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbn1cblxuLyoqXG4gKiBjcmVhdGUgYSBzaW1wbGUgY2xvbmUgZnJvbSB0aGUgaW5wdXQgdXNlZCBmb3Igc3RvcmFnZSBvZiBmaXJzdElucHV0IGFuZCBmaXJzdE11bHRpcGxlXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqIEByZXR1cm5zIHtPYmplY3R9IGNsb25lZElucHV0RGF0YVxuICovXG5mdW5jdGlvbiBzaW1wbGVDbG9uZUlucHV0RGF0YShpbnB1dCkge1xuICAgIC8vIG1ha2UgYSBzaW1wbGUgY29weSBvZiB0aGUgcG9pbnRlcnMgYmVjYXVzZSB3ZSB3aWxsIGdldCBhIHJlZmVyZW5jZSBpZiB3ZSBkb24ndFxuICAgIC8vIHdlIG9ubHkgbmVlZCBjbGllbnRYWSBmb3IgdGhlIGNhbGN1bGF0aW9uc1xuICAgIHZhciBwb2ludGVycyA9IFtdO1xuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGlucHV0LnBvaW50ZXJzLmxlbmd0aCkge1xuICAgICAgICBwb2ludGVyc1tpXSA9IHtcbiAgICAgICAgICAgIGNsaWVudFg6IHJvdW5kKGlucHV0LnBvaW50ZXJzW2ldLmNsaWVudFgpLFxuICAgICAgICAgICAgY2xpZW50WTogcm91bmQoaW5wdXQucG9pbnRlcnNbaV0uY2xpZW50WSlcbiAgICAgICAgfTtcbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHRpbWVTdGFtcDogbm93KCksXG4gICAgICAgIHBvaW50ZXJzOiBwb2ludGVycyxcbiAgICAgICAgY2VudGVyOiBnZXRDZW50ZXIocG9pbnRlcnMpLFxuICAgICAgICBkZWx0YVg6IGlucHV0LmRlbHRhWCxcbiAgICAgICAgZGVsdGFZOiBpbnB1dC5kZWx0YVlcbiAgICB9O1xufVxuXG4vKipcbiAqIGdldCB0aGUgY2VudGVyIG9mIGFsbCB0aGUgcG9pbnRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IHBvaW50ZXJzXG4gKiBAcmV0dXJuIHtPYmplY3R9IGNlbnRlciBjb250YWlucyBgeGAgYW5kIGB5YCBwcm9wZXJ0aWVzXG4gKi9cbmZ1bmN0aW9uIGdldENlbnRlcihwb2ludGVycykge1xuICAgIHZhciBwb2ludGVyc0xlbmd0aCA9IHBvaW50ZXJzLmxlbmd0aDtcblxuICAgIC8vIG5vIG5lZWQgdG8gbG9vcCB3aGVuIG9ubHkgb25lIHRvdWNoXG4gICAgaWYgKHBvaW50ZXJzTGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiByb3VuZChwb2ludGVyc1swXS5jbGllbnRYKSxcbiAgICAgICAgICAgIHk6IHJvdW5kKHBvaW50ZXJzWzBdLmNsaWVudFkpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHggPSAwLCB5ID0gMCwgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBwb2ludGVyc0xlbmd0aCkge1xuICAgICAgICB4ICs9IHBvaW50ZXJzW2ldLmNsaWVudFg7XG4gICAgICAgIHkgKz0gcG9pbnRlcnNbaV0uY2xpZW50WTtcbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHJvdW5kKHggLyBwb2ludGVyc0xlbmd0aCksXG4gICAgICAgIHk6IHJvdW5kKHkgLyBwb2ludGVyc0xlbmd0aClcbiAgICB9O1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgdmVsb2NpdHkgYmV0d2VlbiB0d28gcG9pbnRzLiB1bml0IGlzIGluIHB4IHBlciBtcy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVRpbWVcbiAqIEBwYXJhbSB7TnVtYmVyfSB4XG4gKiBAcGFyYW0ge051bWJlcn0geVxuICogQHJldHVybiB7T2JqZWN0fSB2ZWxvY2l0eSBgeGAgYW5kIGB5YFxuICovXG5mdW5jdGlvbiBnZXRWZWxvY2l0eShkZWx0YVRpbWUsIHgsIHkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB4OiB4IC8gZGVsdGFUaW1lIHx8IDAsXG4gICAgICAgIHk6IHkgLyBkZWx0YVRpbWUgfHwgMFxuICAgIH07XG59XG5cbi8qKlxuICogZ2V0IHRoZSBkaXJlY3Rpb24gYmV0d2VlbiB0d28gcG9pbnRzXG4gKiBAcGFyYW0ge051bWJlcn0geFxuICogQHBhcmFtIHtOdW1iZXJ9IHlcbiAqIEByZXR1cm4ge051bWJlcn0gZGlyZWN0aW9uXG4gKi9cbmZ1bmN0aW9uIGdldERpcmVjdGlvbih4LCB5KSB7XG4gICAgaWYgKHggPT09IHkpIHtcbiAgICAgICAgcmV0dXJuIERJUkVDVElPTl9OT05FO1xuICAgIH1cblxuICAgIGlmIChhYnMoeCkgPj0gYWJzKHkpKSB7XG4gICAgICAgIHJldHVybiB4IDwgMCA/IERJUkVDVElPTl9MRUZUIDogRElSRUNUSU9OX1JJR0hUO1xuICAgIH1cbiAgICByZXR1cm4geSA8IDAgPyBESVJFQ1RJT05fVVAgOiBESVJFQ1RJT05fRE9XTjtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgdGhlIGFic29sdXRlIGRpc3RhbmNlIGJldHdlZW4gdHdvIHBvaW50c1xuICogQHBhcmFtIHtPYmplY3R9IHAxIHt4LCB5fVxuICogQHBhcmFtIHtPYmplY3R9IHAyIHt4LCB5fVxuICogQHBhcmFtIHtBcnJheX0gW3Byb3BzXSBjb250YWluaW5nIHggYW5kIHkga2V5c1xuICogQHJldHVybiB7TnVtYmVyfSBkaXN0YW5jZVxuICovXG5mdW5jdGlvbiBnZXREaXN0YW5jZShwMSwgcDIsIHByb3BzKSB7XG4gICAgaWYgKCFwcm9wcykge1xuICAgICAgICBwcm9wcyA9IFBST1BTX1hZO1xuICAgIH1cbiAgICB2YXIgeCA9IHAyW3Byb3BzWzBdXSAtIHAxW3Byb3BzWzBdXSxcbiAgICAgICAgeSA9IHAyW3Byb3BzWzFdXSAtIHAxW3Byb3BzWzFdXTtcblxuICAgIHJldHVybiBNYXRoLnNxcnQoKHggKiB4KSArICh5ICogeSkpO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgYW5nbGUgYmV0d2VlbiB0d28gY29vcmRpbmF0ZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBwMVxuICogQHBhcmFtIHtPYmplY3R9IHAyXG4gKiBAcGFyYW0ge0FycmF5fSBbcHJvcHNdIGNvbnRhaW5pbmcgeCBhbmQgeSBrZXlzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGFuZ2xlXG4gKi9cbmZ1bmN0aW9uIGdldEFuZ2xlKHAxLCBwMiwgcHJvcHMpIHtcbiAgICBpZiAoIXByb3BzKSB7XG4gICAgICAgIHByb3BzID0gUFJPUFNfWFk7XG4gICAgfVxuICAgIHZhciB4ID0gcDJbcHJvcHNbMF1dIC0gcDFbcHJvcHNbMF1dLFxuICAgICAgICB5ID0gcDJbcHJvcHNbMV1dIC0gcDFbcHJvcHNbMV1dO1xuICAgIHJldHVybiBNYXRoLmF0YW4yKHksIHgpICogMTgwIC8gTWF0aC5QSTtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgdGhlIHJvdGF0aW9uIGRlZ3JlZXMgYmV0d2VlbiB0d28gcG9pbnRlcnNldHNcbiAqIEBwYXJhbSB7QXJyYXl9IHN0YXJ0IGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBlbmQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEByZXR1cm4ge051bWJlcn0gcm90YXRpb25cbiAqL1xuZnVuY3Rpb24gZ2V0Um90YXRpb24oc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiBnZXRBbmdsZShlbmRbMV0sIGVuZFswXSwgUFJPUFNfQ0xJRU5UX1hZKSArIGdldEFuZ2xlKHN0YXJ0WzFdLCBzdGFydFswXSwgUFJPUFNfQ0xJRU5UX1hZKTtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgdGhlIHNjYWxlIGZhY3RvciBiZXR3ZWVuIHR3byBwb2ludGVyc2V0c1xuICogbm8gc2NhbGUgaXMgMSwgYW5kIGdvZXMgZG93biB0byAwIHdoZW4gcGluY2hlZCB0b2dldGhlciwgYW5kIGJpZ2dlciB3aGVuIHBpbmNoZWQgb3V0XG4gKiBAcGFyYW0ge0FycmF5fSBzdGFydCBhcnJheSBvZiBwb2ludGVyc1xuICogQHBhcmFtIHtBcnJheX0gZW5kIGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHNjYWxlXG4gKi9cbmZ1bmN0aW9uIGdldFNjYWxlKHN0YXJ0LCBlbmQpIHtcbiAgICByZXR1cm4gZ2V0RGlzdGFuY2UoZW5kWzBdLCBlbmRbMV0sIFBST1BTX0NMSUVOVF9YWSkgLyBnZXREaXN0YW5jZShzdGFydFswXSwgc3RhcnRbMV0sIFBST1BTX0NMSUVOVF9YWSk7XG59XG5cbnZhciBNT1VTRV9JTlBVVF9NQVAgPSB7XG4gICAgbW91c2Vkb3duOiBJTlBVVF9TVEFSVCxcbiAgICBtb3VzZW1vdmU6IElOUFVUX01PVkUsXG4gICAgbW91c2V1cDogSU5QVVRfRU5EXG59O1xuXG52YXIgTU9VU0VfRUxFTUVOVF9FVkVOVFMgPSAnbW91c2Vkb3duJztcbnZhciBNT1VTRV9XSU5ET1dfRVZFTlRTID0gJ21vdXNlbW92ZSBtb3VzZXVwJztcblxuLyoqXG4gKiBNb3VzZSBldmVudHMgaW5wdXRcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gTW91c2VJbnB1dCgpIHtcbiAgICB0aGlzLmV2RWwgPSBNT1VTRV9FTEVNRU5UX0VWRU5UUztcbiAgICB0aGlzLmV2V2luID0gTU9VU0VfV0lORE9XX0VWRU5UUztcblxuICAgIHRoaXMuYWxsb3cgPSB0cnVlOyAvLyB1c2VkIGJ5IElucHV0LlRvdWNoTW91c2UgdG8gZGlzYWJsZSBtb3VzZSBldmVudHNcbiAgICB0aGlzLnByZXNzZWQgPSBmYWxzZTsgLy8gbW91c2Vkb3duIHN0YXRlXG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KE1vdXNlSW5wdXQsIElucHV0LCB7XG4gICAgLyoqXG4gICAgICogaGFuZGxlIG1vdXNlIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIE1FaGFuZGxlcihldikge1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gTU9VU0VfSU5QVVRfTUFQW2V2LnR5cGVdO1xuXG4gICAgICAgIC8vIG9uIHN0YXJ0IHdlIHdhbnQgdG8gaGF2ZSB0aGUgbGVmdCBtb3VzZSBidXR0b24gZG93blxuICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgZXYuYnV0dG9uID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX01PVkUgJiYgZXYud2hpY2ggIT09IDEpIHtcbiAgICAgICAgICAgIGV2ZW50VHlwZSA9IElOUFVUX0VORDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG1vdXNlIG11c3QgYmUgZG93biwgYW5kIG1vdXNlIGV2ZW50cyBhcmUgYWxsb3dlZCAoc2VlIHRoZSBUb3VjaE1vdXNlIGlucHV0KVxuICAgICAgICBpZiAoIXRoaXMucHJlc3NlZCB8fCAhdGhpcy5hbGxvdykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX0VORCkge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgZXZlbnRUeXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogW2V2XSxcbiAgICAgICAgICAgIGNoYW5nZWRQb2ludGVyczogW2V2XSxcbiAgICAgICAgICAgIHBvaW50ZXJUeXBlOiBJTlBVVF9UWVBFX01PVVNFLFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG52YXIgUE9JTlRFUl9JTlBVVF9NQVAgPSB7XG4gICAgcG9pbnRlcmRvd246IElOUFVUX1NUQVJULFxuICAgIHBvaW50ZXJtb3ZlOiBJTlBVVF9NT1ZFLFxuICAgIHBvaW50ZXJ1cDogSU5QVVRfRU5ELFxuICAgIHBvaW50ZXJjYW5jZWw6IElOUFVUX0NBTkNFTCxcbiAgICBwb2ludGVyb3V0OiBJTlBVVF9DQU5DRUxcbn07XG5cbi8vIGluIElFMTAgdGhlIHBvaW50ZXIgdHlwZXMgaXMgZGVmaW5lZCBhcyBhbiBlbnVtXG52YXIgSUUxMF9QT0lOVEVSX1RZUEVfRU5VTSA9IHtcbiAgICAyOiBJTlBVVF9UWVBFX1RPVUNILFxuICAgIDM6IElOUFVUX1RZUEVfUEVOLFxuICAgIDQ6IElOUFVUX1RZUEVfTU9VU0UsXG4gICAgNTogSU5QVVRfVFlQRV9LSU5FQ1QgLy8gc2VlIGh0dHBzOi8vdHdpdHRlci5jb20vamFjb2Jyb3NzaS9zdGF0dXMvNDgwNTk2NDM4NDg5ODkwODE2XG59O1xuXG52YXIgUE9JTlRFUl9FTEVNRU5UX0VWRU5UUyA9ICdwb2ludGVyZG93bic7XG52YXIgUE9JTlRFUl9XSU5ET1dfRVZFTlRTID0gJ3BvaW50ZXJtb3ZlIHBvaW50ZXJ1cCBwb2ludGVyY2FuY2VsJztcblxuLy8gSUUxMCBoYXMgcHJlZml4ZWQgc3VwcG9ydCwgYW5kIGNhc2Utc2Vuc2l0aXZlXG5pZiAod2luZG93Lk1TUG9pbnRlckV2ZW50ICYmICF3aW5kb3cuUG9pbnRlckV2ZW50KSB7XG4gICAgUE9JTlRFUl9FTEVNRU5UX0VWRU5UUyA9ICdNU1BvaW50ZXJEb3duJztcbiAgICBQT0lOVEVSX1dJTkRPV19FVkVOVFMgPSAnTVNQb2ludGVyTW92ZSBNU1BvaW50ZXJVcCBNU1BvaW50ZXJDYW5jZWwnO1xufVxuXG4vKipcbiAqIFBvaW50ZXIgZXZlbnRzIGlucHV0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIFBvaW50ZXJFdmVudElucHV0KCkge1xuICAgIHRoaXMuZXZFbCA9IFBPSU5URVJfRUxFTUVOVF9FVkVOVFM7XG4gICAgdGhpcy5ldldpbiA9IFBPSU5URVJfV0lORE9XX0VWRU5UUztcblxuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLnN0b3JlID0gKHRoaXMubWFuYWdlci5zZXNzaW9uLnBvaW50ZXJFdmVudHMgPSBbXSk7XG59XG5cbmluaGVyaXQoUG9pbnRlckV2ZW50SW5wdXQsIElucHV0LCB7XG4gICAgLyoqXG4gICAgICogaGFuZGxlIG1vdXNlIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIFBFaGFuZGxlcihldikge1xuICAgICAgICB2YXIgc3RvcmUgPSB0aGlzLnN0b3JlO1xuICAgICAgICB2YXIgcmVtb3ZlUG9pbnRlciA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBldmVudFR5cGVOb3JtYWxpemVkID0gZXYudHlwZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJ21zJywgJycpO1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gUE9JTlRFUl9JTlBVVF9NQVBbZXZlbnRUeXBlTm9ybWFsaXplZF07XG4gICAgICAgIHZhciBwb2ludGVyVHlwZSA9IElFMTBfUE9JTlRFUl9UWVBFX0VOVU1bZXYucG9pbnRlclR5cGVdIHx8IGV2LnBvaW50ZXJUeXBlO1xuXG4gICAgICAgIHZhciBpc1RvdWNoID0gKHBvaW50ZXJUeXBlID09IElOUFVUX1RZUEVfVE9VQ0gpO1xuXG4gICAgICAgIC8vIGdldCBpbmRleCBvZiB0aGUgZXZlbnQgaW4gdGhlIHN0b3JlXG4gICAgICAgIHZhciBzdG9yZUluZGV4ID0gaW5BcnJheShzdG9yZSwgZXYucG9pbnRlcklkLCAncG9pbnRlcklkJyk7XG5cbiAgICAgICAgLy8gc3RhcnQgYW5kIG1vdXNlIG11c3QgYmUgZG93blxuICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgKGV2LmJ1dHRvbiA9PT0gMCB8fCBpc1RvdWNoKSkge1xuICAgICAgICAgICAgaWYgKHN0b3JlSW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgICAgc3RvcmUucHVzaChldik7XG4gICAgICAgICAgICAgICAgc3RvcmVJbmRleCA9IHN0b3JlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgICAgIHJlbW92ZVBvaW50ZXIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaXQgbm90IGZvdW5kLCBzbyB0aGUgcG9pbnRlciBoYXNuJ3QgYmVlbiBkb3duIChzbyBpdCdzIHByb2JhYmx5IGEgaG92ZXIpXG4gICAgICAgIGlmIChzdG9yZUluZGV4IDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBldmVudCBpbiB0aGUgc3RvcmVcbiAgICAgICAgc3RvcmVbc3RvcmVJbmRleF0gPSBldjtcblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgZXZlbnRUeXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogc3RvcmUsXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogcG9pbnRlclR5cGUsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlbW92ZVBvaW50ZXIpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBmcm9tIHRoZSBzdG9yZVxuICAgICAgICAgICAgc3RvcmUuc3BsaWNlKHN0b3JlSW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbnZhciBTSU5HTEVfVE9VQ0hfSU5QVVRfTUFQID0ge1xuICAgIHRvdWNoc3RhcnQ6IElOUFVUX1NUQVJULFxuICAgIHRvdWNobW92ZTogSU5QVVRfTU9WRSxcbiAgICB0b3VjaGVuZDogSU5QVVRfRU5ELFxuICAgIHRvdWNoY2FuY2VsOiBJTlBVVF9DQU5DRUxcbn07XG5cbnZhciBTSU5HTEVfVE9VQ0hfVEFSR0VUX0VWRU5UUyA9ICd0b3VjaHN0YXJ0JztcbnZhciBTSU5HTEVfVE9VQ0hfV0lORE9XX0VWRU5UUyA9ICd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCc7XG5cbi8qKlxuICogVG91Y2ggZXZlbnRzIGlucHV0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIFNpbmdsZVRvdWNoSW5wdXQoKSB7XG4gICAgdGhpcy5ldlRhcmdldCA9IFNJTkdMRV9UT1VDSF9UQVJHRVRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBTSU5HTEVfVE9VQ0hfV0lORE9XX0VWRU5UUztcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcblxuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoU2luZ2xlVG91Y2hJbnB1dCwgSW5wdXQsIHtcbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBURWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBTSU5HTEVfVE9VQ0hfSU5QVVRfTUFQW2V2LnR5cGVdO1xuXG4gICAgICAgIC8vIHNob3VsZCB3ZSBoYW5kbGUgdGhlIHRvdWNoIGV2ZW50cz9cbiAgICAgICAgaWYgKHR5cGUgPT09IElOUFVUX1NUQVJUKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b3VjaGVzID0gbm9ybWFsaXplU2luZ2xlVG91Y2hlcy5jYWxsKHRoaXMsIGV2LCB0eXBlKTtcblxuICAgICAgICAvLyB3aGVuIGRvbmUsIHJlc2V0IHRoZSBzdGFydGVkIHN0YXRlXG4gICAgICAgIGlmICh0eXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkgJiYgdG91Y2hlc1swXS5sZW5ndGggLSB0b3VjaGVzWzFdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgdHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHRvdWNoZXNbMF0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IHRvdWNoZXNbMV0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBAdGhpcyB7VG91Y2hJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICogQHBhcmFtIHtOdW1iZXJ9IHR5cGUgZmxhZ1xuICogQHJldHVybnMge3VuZGVmaW5lZHxBcnJheX0gW2FsbCwgY2hhbmdlZF1cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplU2luZ2xlVG91Y2hlcyhldiwgdHlwZSkge1xuICAgIHZhciBhbGwgPSB0b0FycmF5KGV2LnRvdWNoZXMpO1xuICAgIHZhciBjaGFuZ2VkID0gdG9BcnJheShldi5jaGFuZ2VkVG91Y2hlcyk7XG5cbiAgICBpZiAodHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgIGFsbCA9IHVuaXF1ZUFycmF5KGFsbC5jb25jYXQoY2hhbmdlZCksICdpZGVudGlmaWVyJywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFthbGwsIGNoYW5nZWRdO1xufVxuXG52YXIgVE9VQ0hfSU5QVVRfTUFQID0ge1xuICAgIHRvdWNoc3RhcnQ6IElOUFVUX1NUQVJULFxuICAgIHRvdWNobW92ZTogSU5QVVRfTU9WRSxcbiAgICB0b3VjaGVuZDogSU5QVVRfRU5ELFxuICAgIHRvdWNoY2FuY2VsOiBJTlBVVF9DQU5DRUxcbn07XG5cbnZhciBUT1VDSF9UQVJHRVRfRVZFTlRTID0gJ3RvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIHRvdWNoY2FuY2VsJztcblxuLyoqXG4gKiBNdWx0aS11c2VyIHRvdWNoIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBUb3VjaElucHV0KCkge1xuICAgIHRoaXMuZXZUYXJnZXQgPSBUT1VDSF9UQVJHRVRfRVZFTlRTO1xuICAgIHRoaXMudGFyZ2V0SWRzID0ge307XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFRvdWNoSW5wdXQsIElucHV0LCB7XG4gICAgaGFuZGxlcjogZnVuY3Rpb24gTVRFaGFuZGxlcihldikge1xuICAgICAgICB2YXIgdHlwZSA9IFRPVUNIX0lOUFVUX01BUFtldi50eXBlXTtcbiAgICAgICAgdmFyIHRvdWNoZXMgPSBnZXRUb3VjaGVzLmNhbGwodGhpcywgZXYsIHR5cGUpO1xuICAgICAgICBpZiAoIXRvdWNoZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5tYW5hZ2VyLCB0eXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogdG91Y2hlc1swXSxcbiAgICAgICAgICAgIGNoYW5nZWRQb2ludGVyczogdG91Y2hlc1sxXSxcbiAgICAgICAgICAgIHBvaW50ZXJUeXBlOiBJTlBVVF9UWVBFX1RPVUNILFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIEB0aGlzIHtUb3VjaElucHV0fVxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKiBAcGFyYW0ge051bWJlcn0gdHlwZSBmbGFnXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfEFycmF5fSBbYWxsLCBjaGFuZ2VkXVxuICovXG5mdW5jdGlvbiBnZXRUb3VjaGVzKGV2LCB0eXBlKSB7XG4gICAgdmFyIGFsbFRvdWNoZXMgPSB0b0FycmF5KGV2LnRvdWNoZXMpO1xuICAgIHZhciB0YXJnZXRJZHMgPSB0aGlzLnRhcmdldElkcztcblxuICAgIC8vIHdoZW4gdGhlcmUgaXMgb25seSBvbmUgdG91Y2gsIHRoZSBwcm9jZXNzIGNhbiBiZSBzaW1wbGlmaWVkXG4gICAgaWYgKHR5cGUgJiAoSU5QVVRfU1RBUlQgfCBJTlBVVF9NT1ZFKSAmJiBhbGxUb3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB0YXJnZXRJZHNbYWxsVG91Y2hlc1swXS5pZGVudGlmaWVyXSA9IHRydWU7XG4gICAgICAgIHJldHVybiBbYWxsVG91Y2hlcywgYWxsVG91Y2hlc107XG4gICAgfVxuXG4gICAgdmFyIGksXG4gICAgICAgIHRhcmdldFRvdWNoZXMsXG4gICAgICAgIGNoYW5nZWRUb3VjaGVzID0gdG9BcnJheShldi5jaGFuZ2VkVG91Y2hlcyksXG4gICAgICAgIGNoYW5nZWRUYXJnZXRUb3VjaGVzID0gW10sXG4gICAgICAgIHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuXG4gICAgLy8gZ2V0IHRhcmdldCB0b3VjaGVzIGZyb20gdG91Y2hlc1xuICAgIHRhcmdldFRvdWNoZXMgPSBhbGxUb3VjaGVzLmZpbHRlcihmdW5jdGlvbih0b3VjaCkge1xuICAgICAgICByZXR1cm4gaGFzUGFyZW50KHRvdWNoLnRhcmdldCwgdGFyZ2V0KTtcbiAgICB9KTtcblxuICAgIC8vIGNvbGxlY3QgdG91Y2hlc1xuICAgIGlmICh0eXBlID09PSBJTlBVVF9TVEFSVCkge1xuICAgICAgICBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0YXJnZXRUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFyZ2V0SWRzW3RhcmdldFRvdWNoZXNbaV0uaWRlbnRpZmllcl0gPSB0cnVlO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gZmlsdGVyIGNoYW5nZWQgdG91Y2hlcyB0byBvbmx5IGNvbnRhaW4gdG91Y2hlcyB0aGF0IGV4aXN0IGluIHRoZSBjb2xsZWN0ZWQgdGFyZ2V0IGlkc1xuICAgIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0YXJnZXRJZHNbY2hhbmdlZFRvdWNoZXNbaV0uaWRlbnRpZmllcl0pIHtcbiAgICAgICAgICAgIGNoYW5nZWRUYXJnZXRUb3VjaGVzLnB1c2goY2hhbmdlZFRvdWNoZXNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2xlYW51cCByZW1vdmVkIHRvdWNoZXNcbiAgICAgICAgaWYgKHR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICAgICAgZGVsZXRlIHRhcmdldElkc1tjaGFuZ2VkVG91Y2hlc1tpXS5pZGVudGlmaWVyXTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKCFjaGFuZ2VkVGFyZ2V0VG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICAgIC8vIG1lcmdlIHRhcmdldFRvdWNoZXMgd2l0aCBjaGFuZ2VkVGFyZ2V0VG91Y2hlcyBzbyBpdCBjb250YWlucyBBTEwgdG91Y2hlcywgaW5jbHVkaW5nICdlbmQnIGFuZCAnY2FuY2VsJ1xuICAgICAgICB1bmlxdWVBcnJheSh0YXJnZXRUb3VjaGVzLmNvbmNhdChjaGFuZ2VkVGFyZ2V0VG91Y2hlcyksICdpZGVudGlmaWVyJywgdHJ1ZSksXG4gICAgICAgIGNoYW5nZWRUYXJnZXRUb3VjaGVzXG4gICAgXTtcbn1cblxuLyoqXG4gKiBDb21iaW5lZCB0b3VjaCBhbmQgbW91c2UgaW5wdXRcbiAqXG4gKiBUb3VjaCBoYXMgYSBoaWdoZXIgcHJpb3JpdHkgdGhlbiBtb3VzZSwgYW5kIHdoaWxlIHRvdWNoaW5nIG5vIG1vdXNlIGV2ZW50cyBhcmUgYWxsb3dlZC5cbiAqIFRoaXMgYmVjYXVzZSB0b3VjaCBkZXZpY2VzIGFsc28gZW1pdCBtb3VzZSBldmVudHMgd2hpbGUgZG9pbmcgYSB0b3VjaC5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIFRvdWNoTW91c2VJbnB1dCgpIHtcbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdmFyIGhhbmRsZXIgPSBiaW5kRm4odGhpcy5oYW5kbGVyLCB0aGlzKTtcbiAgICB0aGlzLnRvdWNoID0gbmV3IFRvdWNoSW5wdXQodGhpcy5tYW5hZ2VyLCBoYW5kbGVyKTtcbiAgICB0aGlzLm1vdXNlID0gbmV3IE1vdXNlSW5wdXQodGhpcy5tYW5hZ2VyLCBoYW5kbGVyKTtcbn1cblxuaW5oZXJpdChUb3VjaE1vdXNlSW5wdXQsIElucHV0LCB7XG4gICAgLyoqXG4gICAgICogaGFuZGxlIG1vdXNlIGFuZCB0b3VjaCBldmVudHNcbiAgICAgKiBAcGFyYW0ge0hhbW1lcn0gbWFuYWdlclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dEV2ZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0RGF0YVxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIFRNRWhhbmRsZXIobWFuYWdlciwgaW5wdXRFdmVudCwgaW5wdXREYXRhKSB7XG4gICAgICAgIHZhciBpc1RvdWNoID0gKGlucHV0RGF0YS5wb2ludGVyVHlwZSA9PSBJTlBVVF9UWVBFX1RPVUNIKSxcbiAgICAgICAgICAgIGlzTW91c2UgPSAoaW5wdXREYXRhLnBvaW50ZXJUeXBlID09IElOUFVUX1RZUEVfTU9VU0UpO1xuXG4gICAgICAgIC8vIHdoZW4gd2UncmUgaW4gYSB0b3VjaCBldmVudCwgc28gIGJsb2NrIGFsbCB1cGNvbWluZyBtb3VzZSBldmVudHNcbiAgICAgICAgLy8gbW9zdCBtb2JpbGUgYnJvd3NlciBhbHNvIGVtaXQgbW91c2VldmVudHMsIHJpZ2h0IGFmdGVyIHRvdWNoc3RhcnRcbiAgICAgICAgaWYgKGlzVG91Y2gpIHtcbiAgICAgICAgICAgIHRoaXMubW91c2UuYWxsb3cgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChpc01vdXNlICYmICF0aGlzLm1vdXNlLmFsbG93KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB0aGUgYWxsb3dNb3VzZSB3aGVuIHdlJ3JlIGRvbmVcbiAgICAgICAgaWYgKGlucHV0RXZlbnQgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICAgICAgdGhpcy5tb3VzZS5hbGxvdyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKG1hbmFnZXIsIGlucHV0RXZlbnQsIGlucHV0RGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy50b3VjaC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMubW91c2UuZGVzdHJveSgpO1xuICAgIH1cbn0pO1xuXG52YXIgUFJFRklYRURfVE9VQ0hfQUNUSU9OID0gcHJlZml4ZWQoVEVTVF9FTEVNRU5ULnN0eWxlLCAndG91Y2hBY3Rpb24nKTtcbnZhciBOQVRJVkVfVE9VQ0hfQUNUSU9OID0gUFJFRklYRURfVE9VQ0hfQUNUSU9OICE9PSB1bmRlZmluZWQ7XG5cbi8vIG1hZ2ljYWwgdG91Y2hBY3Rpb24gdmFsdWVcbnZhciBUT1VDSF9BQ1RJT05fQ09NUFVURSA9ICdjb21wdXRlJztcbnZhciBUT1VDSF9BQ1RJT05fQVVUTyA9ICdhdXRvJztcbnZhciBUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OID0gJ21hbmlwdWxhdGlvbic7IC8vIG5vdCBpbXBsZW1lbnRlZFxudmFyIFRPVUNIX0FDVElPTl9OT05FID0gJ25vbmUnO1xudmFyIFRPVUNIX0FDVElPTl9QQU5fWCA9ICdwYW4teCc7XG52YXIgVE9VQ0hfQUNUSU9OX1BBTl9ZID0gJ3Bhbi15JztcblxuLyoqXG4gKiBUb3VjaCBBY3Rpb25cbiAqIHNldHMgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5IG9yIHVzZXMgdGhlIGpzIGFsdGVybmF0aXZlXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRvdWNoQWN0aW9uKG1hbmFnZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLnNldCh2YWx1ZSk7XG59XG5cblRvdWNoQWN0aW9uLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBzZXQgdGhlIHRvdWNoQWN0aW9uIHZhbHVlIG9uIHRoZSBlbGVtZW50IG9yIGVuYWJsZSB0aGUgcG9seWZpbGxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIC8vIGZpbmQgb3V0IHRoZSB0b3VjaC1hY3Rpb24gYnkgdGhlIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIGlmICh2YWx1ZSA9PSBUT1VDSF9BQ1RJT05fQ09NUFVURSkge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLmNvbXB1dGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChOQVRJVkVfVE9VQ0hfQUNUSU9OICYmIHRoaXMubWFuYWdlci5lbGVtZW50LnN0eWxlKSB7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZWxlbWVudC5zdHlsZVtQUkVGSVhFRF9UT1VDSF9BQ1RJT05dID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hY3Rpb25zID0gdmFsdWUudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGp1c3QgcmUtc2V0IHRoZSB0b3VjaEFjdGlvbiB2YWx1ZVxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0KHRoaXMubWFuYWdlci5vcHRpb25zLnRvdWNoQWN0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY29tcHV0ZSB0aGUgdmFsdWUgZm9yIHRoZSB0b3VjaEFjdGlvbiBwcm9wZXJ0eSBiYXNlZCBvbiB0aGUgcmVjb2duaXplcidzIHNldHRpbmdzXG4gICAgICogQHJldHVybnMge1N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBjb21wdXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbXTtcbiAgICAgICAgZWFjaCh0aGlzLm1hbmFnZXIucmVjb2duaXplcnMsIGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgIGlmIChib29sT3JGbihyZWNvZ25pemVyLm9wdGlvbnMuZW5hYmxlLCBbcmVjb2duaXplcl0pKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9ucyA9IGFjdGlvbnMuY29uY2F0KHJlY29nbml6ZXIuZ2V0VG91Y2hBY3Rpb24oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY2xlYW5Ub3VjaEFjdGlvbnMoYWN0aW9ucy5qb2luKCcgJykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgb24gZWFjaCBpbnB1dCBjeWNsZSBhbmQgcHJvdmlkZXMgdGhlIHByZXZlbnRpbmcgb2YgdGhlIGJyb3dzZXIgYmVoYXZpb3JcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICBwcmV2ZW50RGVmYXVsdHM6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIC8vIG5vdCBuZWVkZWQgd2l0aCBuYXRpdmUgc3VwcG9ydCBmb3IgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5XG4gICAgICAgIGlmIChOQVRJVkVfVE9VQ0hfQUNUSU9OKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3JjRXZlbnQgPSBpbnB1dC5zcmNFdmVudDtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGlucHV0Lm9mZnNldERpcmVjdGlvbjtcblxuICAgICAgICAvLyBpZiB0aGUgdG91Y2ggYWN0aW9uIGRpZCBwcmV2ZW50ZWQgb25jZSB0aGlzIHNlc3Npb25cbiAgICAgICAgaWYgKHRoaXMubWFuYWdlci5zZXNzaW9uLnByZXZlbnRlZCkge1xuICAgICAgICAgICAgc3JjRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhY3Rpb25zID0gdGhpcy5hY3Rpb25zO1xuICAgICAgICB2YXIgaGFzTm9uZSA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9OT05FKTtcbiAgICAgICAgdmFyIGhhc1BhblkgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1kpO1xuICAgICAgICB2YXIgaGFzUGFuWCA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWCk7XG5cbiAgICAgICAgaWYgKGhhc05vbmUpIHtcbiAgICAgICAgICAgIC8vZG8gbm90IHByZXZlbnQgZGVmYXVsdHMgaWYgdGhpcyBpcyBhIHRhcCBnZXN0dXJlXG5cbiAgICAgICAgICAgIHZhciBpc1RhcFBvaW50ZXIgPSBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IDE7XG4gICAgICAgICAgICB2YXIgaXNUYXBNb3ZlbWVudCA9IGlucHV0LmRpc3RhbmNlIDwgMjtcbiAgICAgICAgICAgIHZhciBpc1RhcFRvdWNoVGltZSA9IGlucHV0LmRlbHRhVGltZSA8IDI1MDtcblxuICAgICAgICAgICAgaWYgKGlzVGFwUG9pbnRlciAmJiBpc1RhcE1vdmVtZW50ICYmIGlzVGFwVG91Y2hUaW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc1BhblggJiYgaGFzUGFuWSkge1xuICAgICAgICAgICAgLy8gYHBhbi14IHBhbi15YCBtZWFucyBicm93c2VyIGhhbmRsZXMgYWxsIHNjcm9sbGluZy9wYW5uaW5nLCBkbyBub3QgcHJldmVudFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc05vbmUgfHxcbiAgICAgICAgICAgIChoYXNQYW5ZICYmIGRpcmVjdGlvbiAmIERJUkVDVElPTl9IT1JJWk9OVEFMKSB8fFxuICAgICAgICAgICAgKGhhc1BhblggJiYgZGlyZWN0aW9uICYgRElSRUNUSU9OX1ZFUlRJQ0FMKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJldmVudFNyYyhzcmNFdmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY2FsbCBwcmV2ZW50RGVmYXVsdCB0byBwcmV2ZW50IHRoZSBicm93c2VyJ3MgZGVmYXVsdCBiZWhhdmlvciAoc2Nyb2xsaW5nIGluIG1vc3QgY2FzZXMpXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNyY0V2ZW50XG4gICAgICovXG4gICAgcHJldmVudFNyYzogZnVuY3Rpb24oc3JjRXZlbnQpIHtcbiAgICAgICAgdGhpcy5tYW5hZ2VyLnNlc3Npb24ucHJldmVudGVkID0gdHJ1ZTtcbiAgICAgICAgc3JjRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIHdoZW4gdGhlIHRvdWNoQWN0aW9ucyBhcmUgY29sbGVjdGVkIHRoZXkgYXJlIG5vdCBhIHZhbGlkIHZhbHVlLCBzbyB3ZSBuZWVkIHRvIGNsZWFuIHRoaW5ncyB1cC4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFjdGlvbnNcbiAqIEByZXR1cm5zIHsqfVxuICovXG5mdW5jdGlvbiBjbGVhblRvdWNoQWN0aW9ucyhhY3Rpb25zKSB7XG4gICAgLy8gbm9uZVxuICAgIGlmIChpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fTk9ORSkpIHtcbiAgICAgICAgcmV0dXJuIFRPVUNIX0FDVElPTl9OT05FO1xuICAgIH1cblxuICAgIHZhciBoYXNQYW5YID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9YKTtcbiAgICB2YXIgaGFzUGFuWSA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWSk7XG5cbiAgICAvLyBpZiBib3RoIHBhbi14IGFuZCBwYW4teSBhcmUgc2V0IChkaWZmZXJlbnQgcmVjb2duaXplcnNcbiAgICAvLyBmb3IgZGlmZmVyZW50IGRpcmVjdGlvbnMsIGUuZy4gaG9yaXpvbnRhbCBwYW4gYnV0IHZlcnRpY2FsIHN3aXBlPylcbiAgICAvLyB3ZSBuZWVkIG5vbmUgKGFzIG90aGVyd2lzZSB3aXRoIHBhbi14IHBhbi15IGNvbWJpbmVkIG5vbmUgb2YgdGhlc2VcbiAgICAvLyByZWNvZ25pemVycyB3aWxsIHdvcmssIHNpbmNlIHRoZSBicm93c2VyIHdvdWxkIGhhbmRsZSBhbGwgcGFubmluZ1xuICAgIGlmIChoYXNQYW5YICYmIGhhc1BhblkpIHtcbiAgICAgICAgcmV0dXJuIFRPVUNIX0FDVElPTl9OT05FO1xuICAgIH1cblxuICAgIC8vIHBhbi14IE9SIHBhbi15XG4gICAgaWYgKGhhc1BhblggfHwgaGFzUGFuWSkge1xuICAgICAgICByZXR1cm4gaGFzUGFuWCA/IFRPVUNIX0FDVElPTl9QQU5fWCA6IFRPVUNIX0FDVElPTl9QQU5fWTtcbiAgICB9XG5cbiAgICAvLyBtYW5pcHVsYXRpb25cbiAgICBpZiAoaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTikpIHtcbiAgICAgICAgcmV0dXJuIFRPVUNIX0FDVElPTl9NQU5JUFVMQVRJT047XG4gICAgfVxuXG4gICAgcmV0dXJuIFRPVUNIX0FDVElPTl9BVVRPO1xufVxuXG4vKipcbiAqIFJlY29nbml6ZXIgZmxvdyBleHBsYWluZWQ7ICpcbiAqIEFsbCByZWNvZ25pemVycyBoYXZlIHRoZSBpbml0aWFsIHN0YXRlIG9mIFBPU1NJQkxFIHdoZW4gYSBpbnB1dCBzZXNzaW9uIHN0YXJ0cy5cbiAqIFRoZSBkZWZpbml0aW9uIG9mIGEgaW5wdXQgc2Vzc2lvbiBpcyBmcm9tIHRoZSBmaXJzdCBpbnB1dCB1bnRpbCB0aGUgbGFzdCBpbnB1dCwgd2l0aCBhbGwgaXQncyBtb3ZlbWVudCBpbiBpdC4gKlxuICogRXhhbXBsZSBzZXNzaW9uIGZvciBtb3VzZS1pbnB1dDogbW91c2Vkb3duIC0+IG1vdXNlbW92ZSAtPiBtb3VzZXVwXG4gKlxuICogT24gZWFjaCByZWNvZ25pemluZyBjeWNsZSAoc2VlIE1hbmFnZXIucmVjb2duaXplKSB0aGUgLnJlY29nbml6ZSgpIG1ldGhvZCBpcyBleGVjdXRlZFxuICogd2hpY2ggZGV0ZXJtaW5lcyB3aXRoIHN0YXRlIGl0IHNob3VsZCBiZS5cbiAqXG4gKiBJZiB0aGUgcmVjb2duaXplciBoYXMgdGhlIHN0YXRlIEZBSUxFRCwgQ0FOQ0VMTEVEIG9yIFJFQ09HTklaRUQgKGVxdWFscyBFTkRFRCksIGl0IGlzIHJlc2V0IHRvXG4gKiBQT1NTSUJMRSB0byBnaXZlIGl0IGFub3RoZXIgY2hhbmdlIG9uIHRoZSBuZXh0IGN5Y2xlLlxuICpcbiAqICAgICAgICAgICAgICAgUG9zc2libGVcbiAqICAgICAgICAgICAgICAgICAgfFxuICogICAgICAgICAgICArLS0tLS0rLS0tLS0tLS0tLS0tLS0tK1xuICogICAgICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgfFxuICogICAgICArLS0tLS0rLS0tLS0rICAgICAgICAgICAgICAgfFxuICogICAgICB8ICAgICAgICAgICB8ICAgICAgICAgICAgICAgfFxuICogICBGYWlsZWQgICAgICBDYW5jZWxsZWQgICAgICAgICAgfFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICstLS0tLS0tKy0tLS0tLStcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICBSZWNvZ25pemVkICAgICAgIEJlZ2FuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENoYW5nZWRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFbmRlZC9SZWNvZ25pemVkXG4gKi9cbnZhciBTVEFURV9QT1NTSUJMRSA9IDE7XG52YXIgU1RBVEVfQkVHQU4gPSAyO1xudmFyIFNUQVRFX0NIQU5HRUQgPSA0O1xudmFyIFNUQVRFX0VOREVEID0gODtcbnZhciBTVEFURV9SRUNPR05JWkVEID0gU1RBVEVfRU5ERUQ7XG52YXIgU1RBVEVfQ0FOQ0VMTEVEID0gMTY7XG52YXIgU1RBVEVfRkFJTEVEID0gMzI7XG5cbi8qKlxuICogUmVjb2duaXplclxuICogRXZlcnkgcmVjb2duaXplciBuZWVkcyB0byBleHRlbmQgZnJvbSB0aGlzIGNsYXNzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBSZWNvZ25pemVyKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIHRoaXMuZGVmYXVsdHMsIG9wdGlvbnMgfHwge30pO1xuXG4gICAgdGhpcy5pZCA9IHVuaXF1ZUlkKCk7XG5cbiAgICB0aGlzLm1hbmFnZXIgPSBudWxsO1xuXG4gICAgLy8gZGVmYXVsdCBpcyBlbmFibGUgdHJ1ZVxuICAgIHRoaXMub3B0aW9ucy5lbmFibGUgPSBpZlVuZGVmaW5lZCh0aGlzLm9wdGlvbnMuZW5hYmxlLCB0cnVlKTtcblxuICAgIHRoaXMuc3RhdGUgPSBTVEFURV9QT1NTSUJMRTtcblxuICAgIHRoaXMuc2ltdWx0YW5lb3VzID0ge307XG4gICAgdGhpcy5yZXF1aXJlRmFpbCA9IFtdO1xufVxuXG5SZWNvZ25pemVyLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBAdmlydHVhbFxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgZGVmYXVsdHM6IHt9LFxuXG4gICAgLyoqXG4gICAgICogc2V0IG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqIEByZXR1cm4ge1JlY29nbml6ZXJ9XG4gICAgICovXG4gICAgc2V0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIGFzc2lnbih0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8vIGFsc28gdXBkYXRlIHRoZSB0b3VjaEFjdGlvbiwgaW4gY2FzZSBzb21ldGhpbmcgY2hhbmdlZCBhYm91dCB0aGUgZGlyZWN0aW9ucy9lbmFibGVkIHN0YXRlXG4gICAgICAgIHRoaXMubWFuYWdlciAmJiB0aGlzLm1hbmFnZXIudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZWNvZ25pemUgc2ltdWx0YW5lb3VzIHdpdGggYW4gb3RoZXIgcmVjb2duaXplci5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgcmVjb2duaXplV2l0aDogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdyZWNvZ25pemVXaXRoJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNpbXVsdGFuZW91cyA9IHRoaXMuc2ltdWx0YW5lb3VzO1xuICAgICAgICBvdGhlclJlY29nbml6ZXIgPSBnZXRSZWNvZ25pemVyQnlOYW1lSWZNYW5hZ2VyKG90aGVyUmVjb2duaXplciwgdGhpcyk7XG4gICAgICAgIGlmICghc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF0pIHtcbiAgICAgICAgICAgIHNpbXVsdGFuZW91c1tvdGhlclJlY29nbml6ZXIuaWRdID0gb3RoZXJSZWNvZ25pemVyO1xuICAgICAgICAgICAgb3RoZXJSZWNvZ25pemVyLnJlY29nbml6ZVdpdGgodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRyb3AgdGhlIHNpbXVsdGFuZW91cyBsaW5rLiBpdCBkb2VzbnQgcmVtb3ZlIHRoZSBsaW5rIG9uIHRoZSBvdGhlciByZWNvZ25pemVyLlxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBkcm9wUmVjb2duaXplV2l0aDogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdkcm9wUmVjb2duaXplV2l0aCcsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZWNvZ25pemVyIGNhbiBvbmx5IHJ1biB3aGVuIGFuIG90aGVyIGlzIGZhaWxpbmdcbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgcmVxdWlyZUZhaWx1cmU6IGZ1bmN0aW9uKG90aGVyUmVjb2duaXplcikge1xuICAgICAgICBpZiAoaW52b2tlQXJyYXlBcmcob3RoZXJSZWNvZ25pemVyLCAncmVxdWlyZUZhaWx1cmUnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVxdWlyZUZhaWwgPSB0aGlzLnJlcXVpcmVGYWlsO1xuICAgICAgICBvdGhlclJlY29nbml6ZXIgPSBnZXRSZWNvZ25pemVyQnlOYW1lSWZNYW5hZ2VyKG90aGVyUmVjb2duaXplciwgdGhpcyk7XG4gICAgICAgIGlmIChpbkFycmF5KHJlcXVpcmVGYWlsLCBvdGhlclJlY29nbml6ZXIpID09PSAtMSkge1xuICAgICAgICAgICAgcmVxdWlyZUZhaWwucHVzaChvdGhlclJlY29nbml6ZXIpO1xuICAgICAgICAgICAgb3RoZXJSZWNvZ25pemVyLnJlcXVpcmVGYWlsdXJlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBkcm9wIHRoZSByZXF1aXJlRmFpbHVyZSBsaW5rLiBpdCBkb2VzIG5vdCByZW1vdmUgdGhlIGxpbmsgb24gdGhlIG90aGVyIHJlY29nbml6ZXIuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIGRyb3BSZXF1aXJlRmFpbHVyZTogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdkcm9wUmVxdWlyZUZhaWx1cmUnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBvdGhlclJlY29nbml6ZXIgPSBnZXRSZWNvZ25pemVyQnlOYW1lSWZNYW5hZ2VyKG90aGVyUmVjb2duaXplciwgdGhpcyk7XG4gICAgICAgIHZhciBpbmRleCA9IGluQXJyYXkodGhpcy5yZXF1aXJlRmFpbCwgb3RoZXJSZWNvZ25pemVyKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMucmVxdWlyZUZhaWwuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogaGFzIHJlcXVpcmUgZmFpbHVyZXMgYm9vbGVhblxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGhhc1JlcXVpcmVGYWlsdXJlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVpcmVGYWlsLmxlbmd0aCA+IDA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGlmIHRoZSByZWNvZ25pemVyIGNhbiByZWNvZ25pemUgc2ltdWx0YW5lb3VzIHdpdGggYW4gb3RoZXIgcmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAgICovXG4gICAgY2FuUmVjb2duaXplV2l0aDogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFlvdSBzaG91bGQgdXNlIGB0cnlFbWl0YCBpbnN0ZWFkIG9mIGBlbWl0YCBkaXJlY3RseSB0byBjaGVja1xuICAgICAqIHRoYXQgYWxsIHRoZSBuZWVkZWQgcmVjb2duaXplcnMgaGFzIGZhaWxlZCBiZWZvcmUgZW1pdHRpbmcuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gICAgICovXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlO1xuXG4gICAgICAgIGZ1bmN0aW9uIGVtaXQoZXZlbnQpIHtcbiAgICAgICAgICAgIHNlbGYubWFuYWdlci5lbWl0KGV2ZW50LCBpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAncGFuc3RhcnQnIGFuZCAncGFubW92ZSdcbiAgICAgICAgaWYgKHN0YXRlIDwgU1RBVEVfRU5ERUQpIHtcbiAgICAgICAgICAgIGVtaXQoc2VsZi5vcHRpb25zLmV2ZW50ICsgc3RhdGVTdHIoc3RhdGUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVtaXQoc2VsZi5vcHRpb25zLmV2ZW50KTsgLy8gc2ltcGxlICdldmVudE5hbWUnIGV2ZW50c1xuXG4gICAgICAgIGlmIChpbnB1dC5hZGRpdGlvbmFsRXZlbnQpIHsgLy8gYWRkaXRpb25hbCBldmVudChwYW5sZWZ0LCBwYW5yaWdodCwgcGluY2hpbiwgcGluY2hvdXQuLi4pXG4gICAgICAgICAgICBlbWl0KGlucHV0LmFkZGl0aW9uYWxFdmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBwYW5lbmQgYW5kIHBhbmNhbmNlbFxuICAgICAgICBpZiAoc3RhdGUgPj0gU1RBVEVfRU5ERUQpIHtcbiAgICAgICAgICAgIGVtaXQoc2VsZi5vcHRpb25zLmV2ZW50ICsgc3RhdGVTdHIoc3RhdGUpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB0aGF0IGFsbCB0aGUgcmVxdWlyZSBmYWlsdXJlIHJlY29nbml6ZXJzIGhhcyBmYWlsZWQsXG4gICAgICogaWYgdHJ1ZSwgaXQgZW1pdHMgYSBnZXN0dXJlIGV2ZW50LFxuICAgICAqIG90aGVyd2lzZSwgc2V0dXAgdGhlIHN0YXRlIHRvIEZBSUxFRC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICB0cnlFbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpZiAodGhpcy5jYW5FbWl0KCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVtaXQoaW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGl0J3MgZmFpbGluZyBhbnl3YXlcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX0ZBSUxFRDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY2FuIHdlIGVtaXQ/XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgY2FuRW1pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLnJlcXVpcmVGYWlsLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKCEodGhpcy5yZXF1aXJlRmFpbFtpXS5zdGF0ZSAmIChTVEFURV9GQUlMRUQgfCBTVEFURV9QT1NTSUJMRSkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB1cGRhdGUgdGhlIHJlY29nbml6ZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXREYXRhXG4gICAgICovXG4gICAgcmVjb2duaXplOiBmdW5jdGlvbihpbnB1dERhdGEpIHtcbiAgICAgICAgLy8gbWFrZSBhIG5ldyBjb3B5IG9mIHRoZSBpbnB1dERhdGFcbiAgICAgICAgLy8gc28gd2UgY2FuIGNoYW5nZSB0aGUgaW5wdXREYXRhIHdpdGhvdXQgbWVzc2luZyB1cCB0aGUgb3RoZXIgcmVjb2duaXplcnNcbiAgICAgICAgdmFyIGlucHV0RGF0YUNsb25lID0gYXNzaWduKHt9LCBpbnB1dERhdGEpO1xuXG4gICAgICAgIC8vIGlzIGlzIGVuYWJsZWQgYW5kIGFsbG93IHJlY29nbml6aW5nP1xuICAgICAgICBpZiAoIWJvb2xPckZuKHRoaXMub3B0aW9ucy5lbmFibGUsIFt0aGlzLCBpbnB1dERhdGFDbG9uZV0pKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVzZXQgd2hlbiB3ZSd2ZSByZWFjaGVkIHRoZSBlbmRcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgJiAoU1RBVEVfUkVDT0dOSVpFRCB8IFNUQVRFX0NBTkNFTExFRCB8IFNUQVRFX0ZBSUxFRCkpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9QT1NTSUJMRTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB0aGlzLnByb2Nlc3MoaW5wdXREYXRhQ2xvbmUpO1xuXG4gICAgICAgIC8vIHRoZSByZWNvZ25pemVyIGhhcyByZWNvZ25pemVkIGEgZ2VzdHVyZVxuICAgICAgICAvLyBzbyB0cmlnZ2VyIGFuIGV2ZW50XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCB8IFNUQVRFX0VOREVEIHwgU1RBVEVfQ0FOQ0VMTEVEKSkge1xuICAgICAgICAgICAgdGhpcy50cnlFbWl0KGlucHV0RGF0YUNsb25lKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZXR1cm4gdGhlIHN0YXRlIG9mIHRoZSByZWNvZ25pemVyXG4gICAgICogdGhlIGFjdHVhbCByZWNvZ25pemluZyBoYXBwZW5zIGluIHRoaXMgbWV0aG9kXG4gICAgICogQHZpcnR1YWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXREYXRhXG4gICAgICogQHJldHVybnMge0NvbnN0fSBTVEFURVxuICAgICAqL1xuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0RGF0YSkgeyB9LCAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblxuICAgIC8qKlxuICAgICAqIHJldHVybiB0aGUgcHJlZmVycmVkIHRvdWNoLWFjdGlvblxuICAgICAqIEB2aXJ0dWFsXG4gICAgICogQHJldHVybnMge0FycmF5fVxuICAgICAqL1xuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHsgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbGxlZCB3aGVuIHRoZSBnZXN0dXJlIGlzbid0IGFsbG93ZWQgdG8gcmVjb2duaXplXG4gICAgICogbGlrZSB3aGVuIGFub3RoZXIgaXMgYmVpbmcgcmVjb2duaXplZCBvciBpdCBpcyBkaXNhYmxlZFxuICAgICAqIEB2aXJ0dWFsXG4gICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkgeyB9XG59O1xuXG4vKipcbiAqIGdldCBhIHVzYWJsZSBzdHJpbmcsIHVzZWQgYXMgZXZlbnQgcG9zdGZpeFxuICogQHBhcmFtIHtDb25zdH0gc3RhdGVcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0YXRlXG4gKi9cbmZ1bmN0aW9uIHN0YXRlU3RyKHN0YXRlKSB7XG4gICAgaWYgKHN0YXRlICYgU1RBVEVfQ0FOQ0VMTEVEKSB7XG4gICAgICAgIHJldHVybiAnY2FuY2VsJztcbiAgICB9IGVsc2UgaWYgKHN0YXRlICYgU1RBVEVfRU5ERUQpIHtcbiAgICAgICAgcmV0dXJuICdlbmQnO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUgJiBTVEFURV9DSEFOR0VEKSB7XG4gICAgICAgIHJldHVybiAnbW92ZSc7XG4gICAgfSBlbHNlIGlmIChzdGF0ZSAmIFNUQVRFX0JFR0FOKSB7XG4gICAgICAgIHJldHVybiAnc3RhcnQnO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5cbi8qKlxuICogZGlyZWN0aW9uIGNvbnMgdG8gc3RyaW5nXG4gKiBAcGFyYW0ge0NvbnN0fSBkaXJlY3Rpb25cbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGRpcmVjdGlvblN0cihkaXJlY3Rpb24pIHtcbiAgICBpZiAoZGlyZWN0aW9uID09IERJUkVDVElPTl9ET1dOKSB7XG4gICAgICAgIHJldHVybiAnZG93bic7XG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX1VQKSB7XG4gICAgICAgIHJldHVybiAndXAnO1xuICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09IERJUkVDVElPTl9MRUZUKSB7XG4gICAgICAgIHJldHVybiAnbGVmdCc7XG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX1JJR0hUKSB7XG4gICAgICAgIHJldHVybiAncmlnaHQnO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5cbi8qKlxuICogZ2V0IGEgcmVjb2duaXplciBieSBuYW1lIGlmIGl0IGlzIGJvdW5kIHRvIGEgbWFuYWdlclxuICogQHBhcmFtIHtSZWNvZ25pemVyfFN0cmluZ30gb3RoZXJSZWNvZ25pemVyXG4gKiBAcGFyYW0ge1JlY29nbml6ZXJ9IHJlY29nbml6ZXJcbiAqIEByZXR1cm5zIHtSZWNvZ25pemVyfVxuICovXG5mdW5jdGlvbiBnZXRSZWNvZ25pemVyQnlOYW1lSWZNYW5hZ2VyKG90aGVyUmVjb2duaXplciwgcmVjb2duaXplcikge1xuICAgIHZhciBtYW5hZ2VyID0gcmVjb2duaXplci5tYW5hZ2VyO1xuICAgIGlmIChtYW5hZ2VyKSB7XG4gICAgICAgIHJldHVybiBtYW5hZ2VyLmdldChvdGhlclJlY29nbml6ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gb3RoZXJSZWNvZ25pemVyO1xufVxuXG4vKipcbiAqIFRoaXMgcmVjb2duaXplciBpcyBqdXN0IHVzZWQgYXMgYSBiYXNlIGZvciB0aGUgc2ltcGxlIGF0dHJpYnV0ZSByZWNvZ25pemVycy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBBdHRyUmVjb2duaXplcigpIHtcbiAgICBSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoQXR0clJlY29nbml6ZXIsIFJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIEF0dHJSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqIEBkZWZhdWx0IDFcbiAgICAgICAgICovXG4gICAgICAgIHBvaW50ZXJzOiAxXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVzZWQgdG8gY2hlY2sgaWYgaXQgdGhlIHJlY29nbml6ZXIgcmVjZWl2ZXMgdmFsaWQgaW5wdXQsIGxpa2UgaW5wdXQuZGlzdGFuY2UgPiAxMC5cbiAgICAgKiBAbWVtYmVyb2YgQXR0clJlY29nbml6ZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gcmVjb2duaXplZFxuICAgICAqL1xuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9uUG9pbnRlcnMgPSB0aGlzLm9wdGlvbnMucG9pbnRlcnM7XG4gICAgICAgIHJldHVybiBvcHRpb25Qb2ludGVycyA9PT0gMCB8fCBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IG9wdGlvblBvaW50ZXJzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcm9jZXNzIHRoZSBpbnB1dCBhbmQgcmV0dXJuIHRoZSBzdGF0ZSBmb3IgdGhlIHJlY29nbml6ZXJcbiAgICAgKiBAbWVtYmVyb2YgQXR0clJlY29nbml6ZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKiBAcmV0dXJucyB7Kn0gU3RhdGVcbiAgICAgKi9cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gaW5wdXQuZXZlbnRUeXBlO1xuXG4gICAgICAgIHZhciBpc1JlY29nbml6ZWQgPSBzdGF0ZSAmIChTVEFURV9CRUdBTiB8IFNUQVRFX0NIQU5HRUQpO1xuICAgICAgICB2YXIgaXNWYWxpZCA9IHRoaXMuYXR0clRlc3QoaW5wdXQpO1xuXG4gICAgICAgIC8vIG9uIGNhbmNlbCBpbnB1dCBhbmQgd2UndmUgcmVjb2duaXplZCBiZWZvcmUsIHJldHVybiBTVEFURV9DQU5DRUxMRURcbiAgICAgICAgaWYgKGlzUmVjb2duaXplZCAmJiAoZXZlbnRUeXBlICYgSU5QVVRfQ0FOQ0VMIHx8ICFpc1ZhbGlkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlIHwgU1RBVEVfQ0FOQ0VMTEVEO1xuICAgICAgICB9IGVsc2UgaWYgKGlzUmVjb2duaXplZCB8fCBpc1ZhbGlkKSB7XG4gICAgICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfRU5EKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlIHwgU1RBVEVfRU5ERUQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCEoc3RhdGUgJiBTVEFURV9CRUdBTikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gU1RBVEVfQkVHQU47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9DSEFOR0VEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfVxufSk7XG5cbi8qKlxuICogUGFuXG4gKiBSZWNvZ25pemVkIHdoZW4gdGhlIHBvaW50ZXIgaXMgZG93biBhbmQgbW92ZWQgaW4gdGhlIGFsbG93ZWQgZGlyZWN0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBBdHRyUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBQYW5SZWNvZ25pemVyKCkge1xuICAgIEF0dHJSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLnBYID0gbnVsbDtcbiAgICB0aGlzLnBZID0gbnVsbDtcbn1cblxuaW5oZXJpdChQYW5SZWNvZ25pemVyLCBBdHRyUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUGFuUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncGFuJyxcbiAgICAgICAgdGhyZXNob2xkOiAxMCxcbiAgICAgICAgcG9pbnRlcnM6IDEsXG4gICAgICAgIGRpcmVjdGlvbjogRElSRUNUSU9OX0FMTFxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLm9wdGlvbnMuZGlyZWN0aW9uO1xuICAgICAgICB2YXIgYWN0aW9ucyA9IFtdO1xuICAgICAgICBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaChUT1VDSF9BQ1RJT05fUEFOX1kpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fVkVSVElDQUwpIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaChUT1VDSF9BQ1RJT05fUEFOX1gpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY3Rpb25zO1xuICAgIH0sXG5cbiAgICBkaXJlY3Rpb25UZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgdmFyIGhhc01vdmVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIGRpc3RhbmNlID0gaW5wdXQuZGlzdGFuY2U7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBpbnB1dC5kaXJlY3Rpb247XG4gICAgICAgIHZhciB4ID0gaW5wdXQuZGVsdGFYO1xuICAgICAgICB2YXIgeSA9IGlucHV0LmRlbHRhWTtcblxuICAgICAgICAvLyBsb2NrIHRvIGF4aXM/XG4gICAgICAgIGlmICghKGRpcmVjdGlvbiAmIG9wdGlvbnMuZGlyZWN0aW9uKSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSAoeCA9PT0gMCkgPyBESVJFQ1RJT05fTk9ORSA6ICh4IDwgMCkgPyBESVJFQ1RJT05fTEVGVCA6IERJUkVDVElPTl9SSUdIVDtcbiAgICAgICAgICAgICAgICBoYXNNb3ZlZCA9IHggIT0gdGhpcy5wWDtcbiAgICAgICAgICAgICAgICBkaXN0YW5jZSA9IE1hdGguYWJzKGlucHV0LmRlbHRhWCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9ICh5ID09PSAwKSA/IERJUkVDVElPTl9OT05FIDogKHkgPCAwKSA/IERJUkVDVElPTl9VUCA6IERJUkVDVElPTl9ET1dOO1xuICAgICAgICAgICAgICAgIGhhc01vdmVkID0geSAhPSB0aGlzLnBZO1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gTWF0aC5hYnMoaW5wdXQuZGVsdGFZKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpbnB1dC5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgICAgIHJldHVybiBoYXNNb3ZlZCAmJiBkaXN0YW5jZSA+IG9wdGlvbnMudGhyZXNob2xkICYmIGRpcmVjdGlvbiAmIG9wdGlvbnMuZGlyZWN0aW9uO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIEF0dHJSZWNvZ25pemVyLnByb3RvdHlwZS5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgKHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTiB8fCAoISh0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4pICYmIHRoaXMuZGlyZWN0aW9uVGVzdChpbnB1dCkpKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcblxuICAgICAgICB0aGlzLnBYID0gaW5wdXQuZGVsdGFYO1xuICAgICAgICB0aGlzLnBZID0gaW5wdXQuZGVsdGFZO1xuXG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBkaXJlY3Rpb25TdHIoaW5wdXQuZGlyZWN0aW9uKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBpbnB1dC5hZGRpdGlvbmFsRXZlbnQgPSB0aGlzLm9wdGlvbnMuZXZlbnQgKyBkaXJlY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3VwZXIuZW1pdC5jYWxsKHRoaXMsIGlucHV0KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBQaW5jaFxuICogUmVjb2duaXplZCB3aGVuIHR3byBvciBtb3JlIHBvaW50ZXJzIGFyZSBtb3ZpbmcgdG93YXJkICh6b29tLWluKSBvciBhd2F5IGZyb20gZWFjaCBvdGhlciAoem9vbS1vdXQpLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBBdHRyUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBQaW5jaFJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChQaW5jaFJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQaW5jaFJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3BpbmNoJyxcbiAgICAgICAgdGhyZXNob2xkOiAwLFxuICAgICAgICBwb2ludGVyczogMlxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX05PTkVdO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N1cGVyLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICAoTWF0aC5hYnMoaW5wdXQuc2NhbGUgLSAxKSA+IHRoaXMub3B0aW9ucy50aHJlc2hvbGQgfHwgdGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0LnNjYWxlICE9PSAxKSB7XG4gICAgICAgICAgICB2YXIgaW5PdXQgPSBpbnB1dC5zY2FsZSA8IDEgPyAnaW4nIDogJ291dCc7XG4gICAgICAgICAgICBpbnB1dC5hZGRpdGlvbmFsRXZlbnQgPSB0aGlzLm9wdGlvbnMuZXZlbnQgKyBpbk91dDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdXBlci5lbWl0LmNhbGwodGhpcywgaW5wdXQpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFByZXNzXG4gKiBSZWNvZ25pemVkIHdoZW4gdGhlIHBvaW50ZXIgaXMgZG93biBmb3IgeCBtcyB3aXRob3V0IGFueSBtb3ZlbWVudC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBQcmVzc1JlY29nbml6ZXIoKSB7XG4gICAgUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5fdGltZXIgPSBudWxsO1xuICAgIHRoaXMuX2lucHV0ID0gbnVsbDtcbn1cblxuaW5oZXJpdChQcmVzc1JlY29nbml6ZXIsIFJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFByZXNzUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncHJlc3MnLFxuICAgICAgICBwb2ludGVyczogMSxcbiAgICAgICAgdGltZTogMjUxLCAvLyBtaW5pbWFsIHRpbWUgb2YgdGhlIHBvaW50ZXIgdG8gYmUgcHJlc3NlZFxuICAgICAgICB0aHJlc2hvbGQ6IDkgLy8gYSBtaW5pbWFsIG1vdmVtZW50IGlzIG9rLCBidXQga2VlcCBpdCBsb3dcbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9BVVRPXTtcbiAgICB9LFxuXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgIHZhciB2YWxpZFBvaW50ZXJzID0gaW5wdXQucG9pbnRlcnMubGVuZ3RoID09PSBvcHRpb25zLnBvaW50ZXJzO1xuICAgICAgICB2YXIgdmFsaWRNb3ZlbWVudCA9IGlucHV0LmRpc3RhbmNlIDwgb3B0aW9ucy50aHJlc2hvbGQ7XG4gICAgICAgIHZhciB2YWxpZFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPiBvcHRpb25zLnRpbWU7XG5cbiAgICAgICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcblxuICAgICAgICAvLyB3ZSBvbmx5IGFsbG93IGxpdHRsZSBtb3ZlbWVudFxuICAgICAgICAvLyBhbmQgd2UndmUgcmVhY2hlZCBhbiBlbmQgZXZlbnQsIHNvIGEgdGFwIGlzIHBvc3NpYmxlXG4gICAgICAgIGlmICghdmFsaWRNb3ZlbWVudCB8fCAhdmFsaWRQb2ludGVycyB8fCAoaW5wdXQuZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkgJiYgIXZhbGlkVGltZSkpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9TVEFSVCkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0Q29udGV4dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgICAgICAgICB0aGlzLnRyeUVtaXQoKTtcbiAgICAgICAgICAgIH0sIG9wdGlvbnMudGltZSwgdGhpcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfRU5EKSB7XG4gICAgICAgICAgICByZXR1cm4gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBTVEFURV9SRUNPR05JWkVEKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5wdXQgJiYgKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX0VORCkpIHtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMub3B0aW9ucy5ldmVudCArICd1cCcsIGlucHV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2lucHV0LnRpbWVTdGFtcCA9IG5vdygpO1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50LCB0aGlzLl9pbnB1dCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuLyoqXG4gKiBSb3RhdGVcbiAqIFJlY29nbml6ZWQgd2hlbiB0d28gb3IgbW9yZSBwb2ludGVyIGFyZSBtb3ZpbmcgaW4gYSBjaXJjdWxhciBtb3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFJvdGF0ZVJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChSb3RhdGVSZWNvZ25pemVyLCBBdHRyUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUm90YXRlUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncm90YXRlJyxcbiAgICAgICAgdGhyZXNob2xkOiAwLFxuICAgICAgICBwb2ludGVyczogMlxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX05PTkVdO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N1cGVyLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICAoTWF0aC5hYnMoaW5wdXQucm90YXRpb24pID4gdGhpcy5vcHRpb25zLnRocmVzaG9sZCB8fCB0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4pO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFN3aXBlXG4gKiBSZWNvZ25pemVkIHdoZW4gdGhlIHBvaW50ZXIgaXMgbW92aW5nIGZhc3QgKHZlbG9jaXR5KSwgd2l0aCBlbm91Z2ggZGlzdGFuY2UgaW4gdGhlIGFsbG93ZWQgZGlyZWN0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBBdHRyUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBTd2lwZVJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChTd2lwZVJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBTd2lwZVJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3N3aXBlJyxcbiAgICAgICAgdGhyZXNob2xkOiAxMCxcbiAgICAgICAgdmVsb2NpdHk6IDAuMyxcbiAgICAgICAgZGlyZWN0aW9uOiBESVJFQ1RJT05fSE9SSVpPTlRBTCB8IERJUkVDVElPTl9WRVJUSUNBTCxcbiAgICAgICAgcG9pbnRlcnM6IDFcbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gUGFuUmVjb2duaXplci5wcm90b3R5cGUuZ2V0VG91Y2hBY3Rpb24uY2FsbCh0aGlzKTtcbiAgICB9LFxuXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLm9wdGlvbnMuZGlyZWN0aW9uO1xuICAgICAgICB2YXIgdmVsb2NpdHk7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiAmIChESVJFQ1RJT05fSE9SSVpPTlRBTCB8IERJUkVDVElPTl9WRVJUSUNBTCkpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5O1xuICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9IT1JJWk9OVEFMKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IGlucHV0Lm92ZXJhbGxWZWxvY2l0eVg7XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX1ZFUlRJQ0FMKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IGlucHV0Lm92ZXJhbGxWZWxvY2l0eVk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIGRpcmVjdGlvbiAmIGlucHV0Lm9mZnNldERpcmVjdGlvbiAmJlxuICAgICAgICAgICAgaW5wdXQuZGlzdGFuY2UgPiB0aGlzLm9wdGlvbnMudGhyZXNob2xkICYmXG4gICAgICAgICAgICBpbnB1dC5tYXhQb2ludGVycyA9PSB0aGlzLm9wdGlvbnMucG9pbnRlcnMgJiZcbiAgICAgICAgICAgIGFicyh2ZWxvY2l0eSkgPiB0aGlzLm9wdGlvbnMudmVsb2NpdHkgJiYgaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfRU5EO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gZGlyZWN0aW9uU3RyKGlucHV0Lm9mZnNldERpcmVjdGlvbik7XG4gICAgICAgIGlmIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMub3B0aW9ucy5ldmVudCArIGRpcmVjdGlvbiwgaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50LCBpbnB1dCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogQSB0YXAgaXMgZWNvZ25pemVkIHdoZW4gdGhlIHBvaW50ZXIgaXMgZG9pbmcgYSBzbWFsbCB0YXAvY2xpY2suIE11bHRpcGxlIHRhcHMgYXJlIHJlY29nbml6ZWQgaWYgdGhleSBvY2N1clxuICogYmV0d2VlbiB0aGUgZ2l2ZW4gaW50ZXJ2YWwgYW5kIHBvc2l0aW9uLiBUaGUgZGVsYXkgb3B0aW9uIGNhbiBiZSB1c2VkIHRvIHJlY29nbml6ZSBtdWx0aS10YXBzIHdpdGhvdXQgZmlyaW5nXG4gKiBhIHNpbmdsZSB0YXAuXG4gKlxuICogVGhlIGV2ZW50RGF0YSBmcm9tIHRoZSBlbWl0dGVkIGV2ZW50IGNvbnRhaW5zIHRoZSBwcm9wZXJ0eSBgdGFwQ291bnRgLCB3aGljaCBjb250YWlucyB0aGUgYW1vdW50IG9mXG4gKiBtdWx0aS10YXBzIGJlaW5nIHJlY29nbml6ZWQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIFJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gVGFwUmVjb2duaXplcigpIHtcbiAgICBSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAvLyBwcmV2aW91cyB0aW1lIGFuZCBjZW50ZXIsXG4gICAgLy8gdXNlZCBmb3IgdGFwIGNvdW50aW5nXG4gICAgdGhpcy5wVGltZSA9IGZhbHNlO1xuICAgIHRoaXMucENlbnRlciA9IGZhbHNlO1xuXG4gICAgdGhpcy5fdGltZXIgPSBudWxsO1xuICAgIHRoaXMuX2lucHV0ID0gbnVsbDtcbiAgICB0aGlzLmNvdW50ID0gMDtcbn1cblxuaW5oZXJpdChUYXBSZWNvZ25pemVyLCBSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQaW5jaFJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3RhcCcsXG4gICAgICAgIHBvaW50ZXJzOiAxLFxuICAgICAgICB0YXBzOiAxLFxuICAgICAgICBpbnRlcnZhbDogMzAwLCAvLyBtYXggdGltZSBiZXR3ZWVuIHRoZSBtdWx0aS10YXAgdGFwc1xuICAgICAgICB0aW1lOiAyNTAsIC8vIG1heCB0aW1lIG9mIHRoZSBwb2ludGVyIHRvIGJlIGRvd24gKGxpa2UgZmluZ2VyIG9uIHRoZSBzY3JlZW4pXG4gICAgICAgIHRocmVzaG9sZDogOSwgLy8gYSBtaW5pbWFsIG1vdmVtZW50IGlzIG9rLCBidXQga2VlcCBpdCBsb3dcbiAgICAgICAgcG9zVGhyZXNob2xkOiAxMCAvLyBhIG11bHRpLXRhcCBjYW4gYmUgYSBiaXQgb2ZmIHRoZSBpbml0aWFsIHBvc2l0aW9uXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OXTtcbiAgICB9LFxuXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICAgICAgdmFyIHZhbGlkUG9pbnRlcnMgPSBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IG9wdGlvbnMucG9pbnRlcnM7XG4gICAgICAgIHZhciB2YWxpZE1vdmVtZW50ID0gaW5wdXQuZGlzdGFuY2UgPCBvcHRpb25zLnRocmVzaG9sZDtcbiAgICAgICAgdmFyIHZhbGlkVG91Y2hUaW1lID0gaW5wdXQuZGVsdGFUaW1lIDwgb3B0aW9ucy50aW1lO1xuXG4gICAgICAgIHRoaXMucmVzZXQoKTtcblxuICAgICAgICBpZiAoKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX1NUQVJUKSAmJiAodGhpcy5jb3VudCA9PT0gMCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZhaWxUaW1lb3V0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB3ZSBvbmx5IGFsbG93IGxpdHRsZSBtb3ZlbWVudFxuICAgICAgICAvLyBhbmQgd2UndmUgcmVhY2hlZCBhbiBlbmQgZXZlbnQsIHNvIGEgdGFwIGlzIHBvc3NpYmxlXG4gICAgICAgIGlmICh2YWxpZE1vdmVtZW50ICYmIHZhbGlkVG91Y2hUaW1lICYmIHZhbGlkUG9pbnRlcnMpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5ldmVudFR5cGUgIT0gSU5QVVRfRU5EKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFpbFRpbWVvdXQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHZhbGlkSW50ZXJ2YWwgPSB0aGlzLnBUaW1lID8gKGlucHV0LnRpbWVTdGFtcCAtIHRoaXMucFRpbWUgPCBvcHRpb25zLmludGVydmFsKSA6IHRydWU7XG4gICAgICAgICAgICB2YXIgdmFsaWRNdWx0aVRhcCA9ICF0aGlzLnBDZW50ZXIgfHwgZ2V0RGlzdGFuY2UodGhpcy5wQ2VudGVyLCBpbnB1dC5jZW50ZXIpIDwgb3B0aW9ucy5wb3NUaHJlc2hvbGQ7XG5cbiAgICAgICAgICAgIHRoaXMucFRpbWUgPSBpbnB1dC50aW1lU3RhbXA7XG4gICAgICAgICAgICB0aGlzLnBDZW50ZXIgPSBpbnB1dC5jZW50ZXI7XG5cbiAgICAgICAgICAgIGlmICghdmFsaWRNdWx0aVRhcCB8fCAhdmFsaWRJbnRlcnZhbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgPSAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG5cbiAgICAgICAgICAgIC8vIGlmIHRhcCBjb3VudCBtYXRjaGVzIHdlIGhhdmUgcmVjb2duaXplZCBpdCxcbiAgICAgICAgICAgIC8vIGVsc2UgaXQgaGFzIGJlZ2FuIHJlY29nbml6aW5nLi4uXG4gICAgICAgICAgICB2YXIgdGFwQ291bnQgPSB0aGlzLmNvdW50ICUgb3B0aW9ucy50YXBzO1xuICAgICAgICAgICAgaWYgKHRhcENvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gbm8gZmFpbGluZyByZXF1aXJlbWVudHMsIGltbWVkaWF0ZWx5IHRyaWdnZXIgdGhlIHRhcCBldmVudFxuICAgICAgICAgICAgICAgIC8vIG9yIHdhaXQgYXMgbG9uZyBhcyB0aGUgbXVsdGl0YXAgaW50ZXJ2YWwgdG8gdHJpZ2dlclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNSZXF1aXJlRmFpbHVyZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXRDb250ZXh0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1JFQ09HTklaRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyeUVtaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgb3B0aW9ucy5pbnRlcnZhbCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9CRUdBTjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9LFxuXG4gICAgZmFpbFRpbWVvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXRDb250ZXh0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX0ZBSUxFRDtcbiAgICAgICAgfSwgdGhpcy5vcHRpb25zLmludGVydmFsLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT0gU1RBVEVfUkVDT0dOSVpFRCkge1xuICAgICAgICAgICAgdGhpcy5faW5wdXQudGFwQ291bnQgPSB0aGlzLmNvdW50O1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50LCB0aGlzLl9pbnB1dCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuLyoqXG4gKiBTaW1wbGUgd2F5IHRvIGNyZWF0ZSBhIG1hbmFnZXIgd2l0aCBhIGRlZmF1bHQgc2V0IG9mIHJlY29nbml6ZXJzLlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEhhbW1lcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy5yZWNvZ25pemVycyA9IGlmVW5kZWZpbmVkKG9wdGlvbnMucmVjb2duaXplcnMsIEhhbW1lci5kZWZhdWx0cy5wcmVzZXQpO1xuICAgIHJldHVybiBuZXcgTWFuYWdlcihlbGVtZW50LCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBAY29uc3Qge3N0cmluZ31cbiAqL1xuSGFtbWVyLlZFUlNJT04gPSAnMi4wLjYnO1xuXG4vKipcbiAqIGRlZmF1bHQgc2V0dGluZ3NcbiAqIEBuYW1lc3BhY2VcbiAqL1xuSGFtbWVyLmRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIHNldCBpZiBET00gZXZlbnRzIGFyZSBiZWluZyB0cmlnZ2VyZWQuXG4gICAgICogQnV0IHRoaXMgaXMgc2xvd2VyIGFuZCB1bnVzZWQgYnkgc2ltcGxlIGltcGxlbWVudGF0aW9ucywgc28gZGlzYWJsZWQgYnkgZGVmYXVsdC5cbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAqL1xuICAgIGRvbUV2ZW50czogZmFsc2UsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgdmFsdWUgZm9yIHRoZSB0b3VjaEFjdGlvbiBwcm9wZXJ0eS9mYWxsYmFjay5cbiAgICAgKiBXaGVuIHNldCB0byBgY29tcHV0ZWAgaXQgd2lsbCBtYWdpY2FsbHkgc2V0IHRoZSBjb3JyZWN0IHZhbHVlIGJhc2VkIG9uIHRoZSBhZGRlZCByZWNvZ25pemVycy5cbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqIEBkZWZhdWx0IGNvbXB1dGVcbiAgICAgKi9cbiAgICB0b3VjaEFjdGlvbjogVE9VQ0hfQUNUSU9OX0NPTVBVVEUsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgICovXG4gICAgZW5hYmxlOiB0cnVlLFxuXG4gICAgLyoqXG4gICAgICogRVhQRVJJTUVOVEFMIEZFQVRVUkUgLS0gY2FuIGJlIHJlbW92ZWQvY2hhbmdlZFxuICAgICAqIENoYW5nZSB0aGUgcGFyZW50IGlucHV0IHRhcmdldCBlbGVtZW50LlxuICAgICAqIElmIE51bGwsIHRoZW4gaXQgaXMgYmVpbmcgc2V0IHRoZSB0byBtYWluIGVsZW1lbnQuXG4gICAgICogQHR5cGUge051bGx8RXZlbnRUYXJnZXR9XG4gICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAqL1xuICAgIGlucHV0VGFyZ2V0OiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogZm9yY2UgYW4gaW5wdXQgY2xhc3NcbiAgICAgKiBAdHlwZSB7TnVsbHxGdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgaW5wdXRDbGFzczogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIERlZmF1bHQgcmVjb2duaXplciBzZXR1cCB3aGVuIGNhbGxpbmcgYEhhbW1lcigpYFxuICAgICAqIFdoZW4gY3JlYXRpbmcgYSBuZXcgTWFuYWdlciB0aGVzZSB3aWxsIGJlIHNraXBwZWQuXG4gICAgICogQHR5cGUge0FycmF5fVxuICAgICAqL1xuICAgIHByZXNldDogW1xuICAgICAgICAvLyBSZWNvZ25pemVyQ2xhc3MsIG9wdGlvbnMsIFtyZWNvZ25pemVXaXRoLCAuLi5dLCBbcmVxdWlyZUZhaWx1cmUsIC4uLl1cbiAgICAgICAgW1JvdGF0ZVJlY29nbml6ZXIsIHtlbmFibGU6IGZhbHNlfV0sXG4gICAgICAgIFtQaW5jaFJlY29nbml6ZXIsIHtlbmFibGU6IGZhbHNlfSwgWydyb3RhdGUnXV0sXG4gICAgICAgIFtTd2lwZVJlY29nbml6ZXIsIHtkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMfV0sXG4gICAgICAgIFtQYW5SZWNvZ25pemVyLCB7ZGlyZWN0aW9uOiBESVJFQ1RJT05fSE9SSVpPTlRBTH0sIFsnc3dpcGUnXV0sXG4gICAgICAgIFtUYXBSZWNvZ25pemVyXSxcbiAgICAgICAgW1RhcFJlY29nbml6ZXIsIHtldmVudDogJ2RvdWJsZXRhcCcsIHRhcHM6IDJ9LCBbJ3RhcCddXSxcbiAgICAgICAgW1ByZXNzUmVjb2duaXplcl1cbiAgICBdLFxuXG4gICAgLyoqXG4gICAgICogU29tZSBDU1MgcHJvcGVydGllcyBjYW4gYmUgdXNlZCB0byBpbXByb3ZlIHRoZSB3b3JraW5nIG9mIEhhbW1lci5cbiAgICAgKiBBZGQgdGhlbSB0byB0aGlzIG1ldGhvZCBhbmQgdGhleSB3aWxsIGJlIHNldCB3aGVuIGNyZWF0aW5nIGEgbmV3IE1hbmFnZXIuXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqL1xuICAgIGNzc1Byb3BzOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNhYmxlcyB0ZXh0IHNlbGVjdGlvbiB0byBpbXByb3ZlIHRoZSBkcmFnZ2luZyBnZXN0dXJlLiBNYWlubHkgZm9yIGRlc2t0b3AgYnJvd3NlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNhYmxlIHRoZSBXaW5kb3dzIFBob25lIGdyaXBwZXJzIHdoZW4gcHJlc3NpbmcgYW4gZWxlbWVudC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB0b3VjaFNlbGVjdDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNhYmxlcyB0aGUgZGVmYXVsdCBjYWxsb3V0IHNob3duIHdoZW4geW91IHRvdWNoIGFuZCBob2xkIGEgdG91Y2ggdGFyZ2V0LlxuICAgICAgICAgKiBPbiBpT1MsIHdoZW4geW91IHRvdWNoIGFuZCBob2xkIGEgdG91Y2ggdGFyZ2V0IHN1Y2ggYXMgYSBsaW5rLCBTYWZhcmkgZGlzcGxheXNcbiAgICAgICAgICogYSBjYWxsb3V0IGNvbnRhaW5pbmcgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGxpbmsuIFRoaXMgcHJvcGVydHkgYWxsb3dzIHlvdSB0byBkaXNhYmxlIHRoYXQgY2FsbG91dC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB0b3VjaENhbGxvdXQ6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3BlY2lmaWVzIHdoZXRoZXIgem9vbWluZyBpcyBlbmFibGVkLiBVc2VkIGJ5IElFMTA+XG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgY29udGVudFpvb21pbmc6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3BlY2lmaWVzIHRoYXQgYW4gZW50aXJlIGVsZW1lbnQgc2hvdWxkIGJlIGRyYWdnYWJsZSBpbnN0ZWFkIG9mIGl0cyBjb250ZW50cy4gTWFpbmx5IGZvciBkZXNrdG9wIGJyb3dzZXJzLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHVzZXJEcmFnOiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE92ZXJyaWRlcyB0aGUgaGlnaGxpZ2h0IGNvbG9yIHNob3duIHdoZW4gdGhlIHVzZXIgdGFwcyBhIGxpbmsgb3IgYSBKYXZhU2NyaXB0XG4gICAgICAgICAqIGNsaWNrYWJsZSBlbGVtZW50IGluIGlPUy4gVGhpcyBwcm9wZXJ0eSBvYmV5cyB0aGUgYWxwaGEgdmFsdWUsIGlmIHNwZWNpZmllZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ3JnYmEoMCwwLDAsMCknXG4gICAgICAgICAqL1xuICAgICAgICB0YXBIaWdobGlnaHRDb2xvcjogJ3JnYmEoMCwwLDAsMCknXG4gICAgfVxufTtcblxudmFyIFNUT1AgPSAxO1xudmFyIEZPUkNFRF9TVE9QID0gMjtcblxuLyoqXG4gKiBNYW5hZ2VyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTWFuYWdlcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gYXNzaWduKHt9LCBIYW1tZXIuZGVmYXVsdHMsIG9wdGlvbnMgfHwge30pO1xuXG4gICAgdGhpcy5vcHRpb25zLmlucHV0VGFyZ2V0ID0gdGhpcy5vcHRpb25zLmlucHV0VGFyZ2V0IHx8IGVsZW1lbnQ7XG5cbiAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gICAgdGhpcy5zZXNzaW9uID0ge307XG4gICAgdGhpcy5yZWNvZ25pemVycyA9IFtdO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLmlucHV0ID0gY3JlYXRlSW5wdXRJbnN0YW5jZSh0aGlzKTtcbiAgICB0aGlzLnRvdWNoQWN0aW9uID0gbmV3IFRvdWNoQWN0aW9uKHRoaXMsIHRoaXMub3B0aW9ucy50b3VjaEFjdGlvbik7XG5cbiAgICB0b2dnbGVDc3NQcm9wcyh0aGlzLCB0cnVlKTtcblxuICAgIGVhY2godGhpcy5vcHRpb25zLnJlY29nbml6ZXJzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciByZWNvZ25pemVyID0gdGhpcy5hZGQobmV3IChpdGVtWzBdKShpdGVtWzFdKSk7XG4gICAgICAgIGl0ZW1bMl0gJiYgcmVjb2duaXplci5yZWNvZ25pemVXaXRoKGl0ZW1bMl0pO1xuICAgICAgICBpdGVtWzNdICYmIHJlY29nbml6ZXIucmVxdWlyZUZhaWx1cmUoaXRlbVszXSk7XG4gICAgfSwgdGhpcyk7XG59XG5cbk1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNldCBvcHRpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7TWFuYWdlcn1cbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gT3B0aW9ucyB0aGF0IG5lZWQgYSBsaXR0bGUgbW9yZSBzZXR1cFxuICAgICAgICBpZiAob3B0aW9ucy50b3VjaEFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnB1dFRhcmdldCkge1xuICAgICAgICAgICAgLy8gQ2xlYW4gdXAgZXhpc3RpbmcgZXZlbnQgbGlzdGVuZXJzIGFuZCByZWluaXRpYWxpemVcbiAgICAgICAgICAgIHRoaXMuaW5wdXQuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC50YXJnZXQgPSBvcHRpb25zLmlucHV0VGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5pbml0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHN0b3AgcmVjb2duaXppbmcgZm9yIHRoaXMgc2Vzc2lvbi5cbiAgICAgKiBUaGlzIHNlc3Npb24gd2lsbCBiZSBkaXNjYXJkZWQsIHdoZW4gYSBuZXcgW2lucHV0XXN0YXJ0IGV2ZW50IGlzIGZpcmVkLlxuICAgICAqIFdoZW4gZm9yY2VkLCB0aGUgcmVjb2duaXplciBjeWNsZSBpcyBzdG9wcGVkIGltbWVkaWF0ZWx5LlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2ZvcmNlXVxuICAgICAqL1xuICAgIHN0b3A6IGZ1bmN0aW9uKGZvcmNlKSB7XG4gICAgICAgIHRoaXMuc2Vzc2lvbi5zdG9wcGVkID0gZm9yY2UgPyBGT1JDRURfU1RPUCA6IFNUT1A7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJ1biB0aGUgcmVjb2duaXplcnMhXG4gICAgICogY2FsbGVkIGJ5IHRoZSBpbnB1dEhhbmRsZXIgZnVuY3Rpb24gb24gZXZlcnkgbW92ZW1lbnQgb2YgdGhlIHBvaW50ZXJzICh0b3VjaGVzKVxuICAgICAqIGl0IHdhbGtzIHRocm91Z2ggYWxsIHRoZSByZWNvZ25pemVycyBhbmQgdHJpZXMgdG8gZGV0ZWN0IHRoZSBnZXN0dXJlIHRoYXQgaXMgYmVpbmcgbWFkZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICByZWNvZ25pemU6IGZ1bmN0aW9uKGlucHV0RGF0YSkge1xuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbjtcbiAgICAgICAgaWYgKHNlc3Npb24uc3RvcHBlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcnVuIHRoZSB0b3VjaC1hY3Rpb24gcG9seWZpbGxcbiAgICAgICAgdGhpcy50b3VjaEFjdGlvbi5wcmV2ZW50RGVmYXVsdHMoaW5wdXREYXRhKTtcblxuICAgICAgICB2YXIgcmVjb2duaXplcjtcbiAgICAgICAgdmFyIHJlY29nbml6ZXJzID0gdGhpcy5yZWNvZ25pemVycztcblxuICAgICAgICAvLyB0aGlzIGhvbGRzIHRoZSByZWNvZ25pemVyIHRoYXQgaXMgYmVpbmcgcmVjb2duaXplZC5cbiAgICAgICAgLy8gc28gdGhlIHJlY29nbml6ZXIncyBzdGF0ZSBuZWVkcyB0byBiZSBCRUdBTiwgQ0hBTkdFRCwgRU5ERUQgb3IgUkVDT0dOSVpFRFxuICAgICAgICAvLyBpZiBubyByZWNvZ25pemVyIGlzIGRldGVjdGluZyBhIHRoaW5nLCBpdCBpcyBzZXQgdG8gYG51bGxgXG4gICAgICAgIHZhciBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyO1xuXG4gICAgICAgIC8vIHJlc2V0IHdoZW4gdGhlIGxhc3QgcmVjb2duaXplciBpcyByZWNvZ25pemVkXG4gICAgICAgIC8vIG9yIHdoZW4gd2UncmUgaW4gYSBuZXcgc2Vzc2lvblxuICAgICAgICBpZiAoIWN1clJlY29nbml6ZXIgfHwgKGN1clJlY29nbml6ZXIgJiYgY3VyUmVjb2duaXplci5zdGF0ZSAmIFNUQVRFX1JFQ09HTklaRUQpKSB7XG4gICAgICAgICAgICBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCByZWNvZ25pemVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlY29nbml6ZXIgPSByZWNvZ25pemVyc1tpXTtcblxuICAgICAgICAgICAgLy8gZmluZCBvdXQgaWYgd2UgYXJlIGFsbG93ZWQgdHJ5IHRvIHJlY29nbml6ZSB0aGUgaW5wdXQgZm9yIHRoaXMgb25lLlxuICAgICAgICAgICAgLy8gMS4gICBhbGxvdyBpZiB0aGUgc2Vzc2lvbiBpcyBOT1QgZm9yY2VkIHN0b3BwZWQgKHNlZSB0aGUgLnN0b3AoKSBtZXRob2QpXG4gICAgICAgICAgICAvLyAyLiAgIGFsbG93IGlmIHdlIHN0aWxsIGhhdmVuJ3QgcmVjb2duaXplZCBhIGdlc3R1cmUgaW4gdGhpcyBzZXNzaW9uLCBvciB0aGUgdGhpcyByZWNvZ25pemVyIGlzIHRoZSBvbmVcbiAgICAgICAgICAgIC8vICAgICAgdGhhdCBpcyBiZWluZyByZWNvZ25pemVkLlxuICAgICAgICAgICAgLy8gMy4gICBhbGxvdyBpZiB0aGUgcmVjb2duaXplciBpcyBhbGxvd2VkIHRvIHJ1biBzaW11bHRhbmVvdXMgd2l0aCB0aGUgY3VycmVudCByZWNvZ25pemVkIHJlY29nbml6ZXIuXG4gICAgICAgICAgICAvLyAgICAgIHRoaXMgY2FuIGJlIHNldHVwIHdpdGggdGhlIGByZWNvZ25pemVXaXRoKClgIG1ldGhvZCBvbiB0aGUgcmVjb2duaXplci5cbiAgICAgICAgICAgIGlmIChzZXNzaW9uLnN0b3BwZWQgIT09IEZPUkNFRF9TVE9QICYmICggLy8gMVxuICAgICAgICAgICAgICAgICAgICAhY3VyUmVjb2duaXplciB8fCByZWNvZ25pemVyID09IGN1clJlY29nbml6ZXIgfHwgLy8gMlxuICAgICAgICAgICAgICAgICAgICByZWNvZ25pemVyLmNhblJlY29nbml6ZVdpdGgoY3VyUmVjb2duaXplcikpKSB7IC8vIDNcbiAgICAgICAgICAgICAgICByZWNvZ25pemVyLnJlY29nbml6ZShpbnB1dERhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWNvZ25pemVyLnJlc2V0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSByZWNvZ25pemVyIGhhcyBiZWVuIHJlY29nbml6aW5nIHRoZSBpbnB1dCBhcyBhIHZhbGlkIGdlc3R1cmUsIHdlIHdhbnQgdG8gc3RvcmUgdGhpcyBvbmUgYXMgdGhlXG4gICAgICAgICAgICAvLyBjdXJyZW50IGFjdGl2ZSByZWNvZ25pemVyLiBidXQgb25seSBpZiB3ZSBkb24ndCBhbHJlYWR5IGhhdmUgYW4gYWN0aXZlIHJlY29nbml6ZXJcbiAgICAgICAgICAgIGlmICghY3VyUmVjb2duaXplciAmJiByZWNvZ25pemVyLnN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCB8IFNUQVRFX0VOREVEKSkge1xuICAgICAgICAgICAgICAgIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXIgPSByZWNvZ25pemVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGdldCBhIHJlY29nbml6ZXIgYnkgaXRzIGV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfFN0cmluZ30gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfE51bGx9XG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChyZWNvZ25pemVyIGluc3RhbmNlb2YgUmVjb2duaXplcikge1xuICAgICAgICAgICAgcmV0dXJuIHJlY29nbml6ZXI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlY29nbml6ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAocmVjb2duaXplcnNbaV0ub3B0aW9ucy5ldmVudCA9PSByZWNvZ25pemVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY29nbml6ZXJzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBhZGQgYSByZWNvZ25pemVyIHRvIHRoZSBtYW5hZ2VyXG4gICAgICogZXhpc3RpbmcgcmVjb2duaXplcnMgd2l0aCB0aGUgc2FtZSBldmVudCBuYW1lIHdpbGwgYmUgcmVtb3ZlZFxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfE1hbmFnZXJ9XG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhyZWNvZ25pemVyLCAnYWRkJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVtb3ZlIGV4aXN0aW5nXG4gICAgICAgIHZhciBleGlzdGluZyA9IHRoaXMuZ2V0KHJlY29nbml6ZXIub3B0aW9ucy5ldmVudCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoZXhpc3RpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWNvZ25pemVycy5wdXNoKHJlY29nbml6ZXIpO1xuICAgICAgICByZWNvZ25pemVyLm1hbmFnZXIgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgIHJldHVybiByZWNvZ25pemVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZW1vdmUgYSByZWNvZ25pemVyIGJ5IG5hbWUgb3IgaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge01hbmFnZXJ9XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhyZWNvZ25pemVyLCAncmVtb3ZlJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjb2duaXplciA9IHRoaXMuZ2V0KHJlY29nbml6ZXIpO1xuXG4gICAgICAgIC8vIGxldCdzIG1ha2Ugc3VyZSB0aGlzIHJlY29nbml6ZXIgZXhpc3RzXG4gICAgICAgIGlmIChyZWNvZ25pemVyKSB7XG4gICAgICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gaW5BcnJheShyZWNvZ25pemVycywgcmVjb2duaXplcik7XG5cbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZWNvZ25pemVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogYmluZCBldmVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudHNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gICAgICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gdGhpc1xuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbihldmVudHMsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcbiAgICAgICAgZWFjaChzcGxpdFN0cihldmVudHMpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdID0gaGFuZGxlcnNbZXZlbnRdIHx8IFtdO1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdW5iaW5kIGV2ZW50LCBsZWF2ZSBlbWl0IGJsYW5rIHRvIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2hhbmRsZXJdXG4gICAgICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gdGhpc1xuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24oZXZlbnRzLCBoYW5kbGVyKSB7XG4gICAgICAgIHZhciBoYW5kbGVycyA9IHRoaXMuaGFuZGxlcnM7XG4gICAgICAgIGVhY2goc3BsaXRTdHIoZXZlbnRzKSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICghaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBoYW5kbGVyc1tldmVudF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhhbmRsZXJzW2V2ZW50XSAmJiBoYW5kbGVyc1tldmVudF0uc3BsaWNlKGluQXJyYXkoaGFuZGxlcnNbZXZlbnRdLCBoYW5kbGVyKSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZW1pdCBldmVudCB0byB0aGUgbGlzdGVuZXJzXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKi9cbiAgICBlbWl0OiBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICAgICAgICAvLyB3ZSBhbHNvIHdhbnQgdG8gdHJpZ2dlciBkb20gZXZlbnRzXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZG9tRXZlbnRzKSB7XG4gICAgICAgICAgICB0cmlnZ2VyRG9tRXZlbnQoZXZlbnQsIGRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm8gaGFuZGxlcnMsIHNvIHNraXAgaXQgYWxsXG4gICAgICAgIHZhciBoYW5kbGVycyA9IHRoaXMuaGFuZGxlcnNbZXZlbnRdICYmIHRoaXMuaGFuZGxlcnNbZXZlbnRdLnNsaWNlKCk7XG4gICAgICAgIGlmICghaGFuZGxlcnMgfHwgIWhhbmRsZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0YS50eXBlID0gZXZlbnQ7XG4gICAgICAgIGRhdGEucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRhdGEuc3JjRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgaGFuZGxlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBoYW5kbGVyc1tpXShkYXRhKTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBkZXN0cm95IHRoZSBtYW5hZ2VyIGFuZCB1bmJpbmRzIGFsbCBldmVudHNcbiAgICAgKiBpdCBkb2Vzbid0IHVuYmluZCBkb20gZXZlbnRzLCB0aGF0IGlzIHRoZSB1c2VyIG93biByZXNwb25zaWJpbGl0eVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgJiYgdG9nZ2xlQ3NzUHJvcHModGhpcywgZmFsc2UpO1xuXG4gICAgICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgICAgICAgdGhpcy5zZXNzaW9uID0ge307XG4gICAgICAgIHRoaXMuaW5wdXQuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgIH1cbn07XG5cbi8qKlxuICogYWRkL3JlbW92ZSB0aGUgY3NzIHByb3BlcnRpZXMgYXMgZGVmaW5lZCBpbiBtYW5hZ2VyLm9wdGlvbnMuY3NzUHJvcHNcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtCb29sZWFufSBhZGRcbiAqL1xuZnVuY3Rpb24gdG9nZ2xlQ3NzUHJvcHMobWFuYWdlciwgYWRkKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgaWYgKCFlbGVtZW50LnN0eWxlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZWFjaChtYW5hZ2VyLm9wdGlvbnMuY3NzUHJvcHMsIGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGVbcHJlZml4ZWQoZWxlbWVudC5zdHlsZSwgbmFtZSldID0gYWRkID8gdmFsdWUgOiAnJztcbiAgICB9KTtcbn1cblxuLyoqXG4gKiB0cmlnZ2VyIGRvbSBldmVudFxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICovXG5mdW5jdGlvbiB0cmlnZ2VyRG9tRXZlbnQoZXZlbnQsIGRhdGEpIHtcbiAgICB2YXIgZ2VzdHVyZUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZ2VzdHVyZUV2ZW50LmluaXRFdmVudChldmVudCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZ2VzdHVyZUV2ZW50Lmdlc3R1cmUgPSBkYXRhO1xuICAgIGRhdGEudGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VzdHVyZUV2ZW50KTtcbn1cblxuYXNzaWduKEhhbW1lciwge1xuICAgIElOUFVUX1NUQVJUOiBJTlBVVF9TVEFSVCxcbiAgICBJTlBVVF9NT1ZFOiBJTlBVVF9NT1ZFLFxuICAgIElOUFVUX0VORDogSU5QVVRfRU5ELFxuICAgIElOUFVUX0NBTkNFTDogSU5QVVRfQ0FOQ0VMLFxuXG4gICAgU1RBVEVfUE9TU0lCTEU6IFNUQVRFX1BPU1NJQkxFLFxuICAgIFNUQVRFX0JFR0FOOiBTVEFURV9CRUdBTixcbiAgICBTVEFURV9DSEFOR0VEOiBTVEFURV9DSEFOR0VELFxuICAgIFNUQVRFX0VOREVEOiBTVEFURV9FTkRFRCxcbiAgICBTVEFURV9SRUNPR05JWkVEOiBTVEFURV9SRUNPR05JWkVELFxuICAgIFNUQVRFX0NBTkNFTExFRDogU1RBVEVfQ0FOQ0VMTEVELFxuICAgIFNUQVRFX0ZBSUxFRDogU1RBVEVfRkFJTEVELFxuXG4gICAgRElSRUNUSU9OX05PTkU6IERJUkVDVElPTl9OT05FLFxuICAgIERJUkVDVElPTl9MRUZUOiBESVJFQ1RJT05fTEVGVCxcbiAgICBESVJFQ1RJT05fUklHSFQ6IERJUkVDVElPTl9SSUdIVCxcbiAgICBESVJFQ1RJT05fVVA6IERJUkVDVElPTl9VUCxcbiAgICBESVJFQ1RJT05fRE9XTjogRElSRUNUSU9OX0RPV04sXG4gICAgRElSRUNUSU9OX0hPUklaT05UQUw6IERJUkVDVElPTl9IT1JJWk9OVEFMLFxuICAgIERJUkVDVElPTl9WRVJUSUNBTDogRElSRUNUSU9OX1ZFUlRJQ0FMLFxuICAgIERJUkVDVElPTl9BTEw6IERJUkVDVElPTl9BTEwsXG5cbiAgICBNYW5hZ2VyOiBNYW5hZ2VyLFxuICAgIElucHV0OiBJbnB1dCxcbiAgICBUb3VjaEFjdGlvbjogVG91Y2hBY3Rpb24sXG5cbiAgICBUb3VjaElucHV0OiBUb3VjaElucHV0LFxuICAgIE1vdXNlSW5wdXQ6IE1vdXNlSW5wdXQsXG4gICAgUG9pbnRlckV2ZW50SW5wdXQ6IFBvaW50ZXJFdmVudElucHV0LFxuICAgIFRvdWNoTW91c2VJbnB1dDogVG91Y2hNb3VzZUlucHV0LFxuICAgIFNpbmdsZVRvdWNoSW5wdXQ6IFNpbmdsZVRvdWNoSW5wdXQsXG5cbiAgICBSZWNvZ25pemVyOiBSZWNvZ25pemVyLFxuICAgIEF0dHJSZWNvZ25pemVyOiBBdHRyUmVjb2duaXplcixcbiAgICBUYXA6IFRhcFJlY29nbml6ZXIsXG4gICAgUGFuOiBQYW5SZWNvZ25pemVyLFxuICAgIFN3aXBlOiBTd2lwZVJlY29nbml6ZXIsXG4gICAgUGluY2g6IFBpbmNoUmVjb2duaXplcixcbiAgICBSb3RhdGU6IFJvdGF0ZVJlY29nbml6ZXIsXG4gICAgUHJlc3M6IFByZXNzUmVjb2duaXplcixcblxuICAgIG9uOiBhZGRFdmVudExpc3RlbmVycyxcbiAgICBvZmY6IHJlbW92ZUV2ZW50TGlzdGVuZXJzLFxuICAgIGVhY2g6IGVhY2gsXG4gICAgbWVyZ2U6IG1lcmdlLFxuICAgIGV4dGVuZDogZXh0ZW5kLFxuICAgIGFzc2lnbjogYXNzaWduLFxuICAgIGluaGVyaXQ6IGluaGVyaXQsXG4gICAgYmluZEZuOiBiaW5kRm4sXG4gICAgcHJlZml4ZWQ6IHByZWZpeGVkXG59KTtcblxuLy8gdGhpcyBwcmV2ZW50cyBlcnJvcnMgd2hlbiBIYW1tZXIgaXMgbG9hZGVkIGluIHRoZSBwcmVzZW5jZSBvZiBhbiBBTURcbi8vICBzdHlsZSBsb2FkZXIgYnV0IGJ5IHNjcmlwdCB0YWcsIG5vdCBieSB0aGUgbG9hZGVyLlxudmFyIGZyZWVHbG9iYWwgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHt9KSk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuZnJlZUdsb2JhbC5IYW1tZXIgPSBIYW1tZXI7XG5cbmlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBIYW1tZXI7XG4gICAgfSk7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhhbW1lcjtcbn0gZWxzZSB7XG4gICAgd2luZG93W2V4cG9ydE5hbWVdID0gSGFtbWVyO1xufVxuXG59KSh3aW5kb3csIGRvY3VtZW50LCAnSGFtbWVyJyk7XG4iLCJ2YXIgcG9zdEdyYXBoaWNzVGVtcGxhdGUgPSByZXF1aXJlKCcuL3BnLXRlbXBsYXRlL3Bvc3RHcmFwaGljc1RlbXBsYXRlLmpzJyk7XG5cbiIsIihmdW5jdGlvbigpIHtcblxuICAgIC8vIEFsbCB1dGlsaXR5IGZ1bmN0aW9ucyBzaG91bGQgYXR0YWNoIHRoZW1zZWx2ZXMgdG8gdGhpcyBvYmplY3QuXG4gICAgdmFyIHV0aWwgPSB7fTtcblxuICAgIC8vIFRoaXMgY29kZSBhc3N1bWVzIGl0IGlzIHJ1bm5pbmcgaW4gYSBicm93c2VyIGNvbnRleHRcbiAgICB3aW5kb3cuVFdQID0gd2luZG93LlRXUCB8fCB7XG4gICAgICAgIE1vZHVsZToge31cbiAgICB9O1xuICAgIHdpbmRvdy5UV1AuTW9kdWxlID0gd2luZG93LlRXUC5Nb2R1bGUgfHwge307XG4gICAgd2luZG93LlRXUC5Nb2R1bGUudXRpbCA9IHV0aWw7XG5cbiAgICBpZiAoIXV0aWwuZ2V0UGFyYW1ldGVycyB8fCB0eXBlb2YgdXRpbC5nZXRQYXJhbWV0ZXJzID09PSAndW5kZWZpbmVkJyl7XG4gICAgICAgIHV0aWwuZ2V0UGFyYW1ldGVycyA9IGZ1bmN0aW9uKHVybCl7XG4gICAgICAgICAgICB2YXIgcGFyYW1MaXN0ID0gW10sXG4gICAgICAgICAgICAgICAgcGFyYW1zID0ge30sXG4gICAgICAgICAgICAgICAga3ZQYWlycyxcbiAgICAgICAgICAgICAgICB0bXA7XG4gICAgICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVybC5pbmRleE9mKCc/JykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtTGlzdCA9IHVybC5zcGxpdCgnPycpWzFdO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW1MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW1MaXN0LmluZGV4T2YoJyYnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGt2UGFpcnMgPSBwYXJhbUxpc3Quc3BsaXQoJyYnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga3ZQYWlycyA9IFtwYXJhbUxpc3RdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYSA9IDA7IGEgPCBrdlBhaXJzLmxlbmd0aDsgYSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGt2UGFpcnNbYV0uaW5kZXhPZignPScpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bXAgPSBrdlBhaXJzW2FdLnNwbGl0KCc9Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtc1t0bXBbMF1dID0gdW5lc2NhcGUodG1wWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0aGUgaGVpZ2h0IG9mIHRoZSBpZnJhbWUgaWYgdGhpcyBwYWdlIGlzIGlmcmFtZSdkLlxuICAgIC8vIE5PVEU6IFRoaXMgKipyZXF1aXJlcyoqIHRoZSBpZnJhbWUncyBzcmMgcHJvcGVydHkgdG8gdXNlIGEgbG9jYXRpb25cbiAgICAvLyB3aXRob3V0IGl0cyBwcm90b2NvbC4gVXNpbmcgYSBwcm90b2NvbCB3aWxsIG5vdCB3b3JrLlxuICAgIC8vXG4gICAgLy8gZS5nLiA8aWZyYW1lIGZyYW1lYm9yZGVyPVwiMFwiIHNjcm9sbGluZz1cIm5vXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OjYwMHB4O1wiIHNyYz1cIi8vd3d3Lndhc2hpbmd0b25wb3N0LmNvbS9ncmFwaGljcy9uYXRpb25hbC9jZW5zdXMtY29tbXV0ZS1tYXAvP3RlbXBsYXRlPWlmcmFtZVwiPjwvaWZyYW1lPlxuICAgIHV0aWwuY2hhbmdlSWZyYW1lSGVpZ2h0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgLy8gTG9jYXRpb24gKndpdGhvdXQqIHByb3RvY29sIGFuZCBzZWFyY2ggcGFyYW1ldGVyc1xuICAgICAgICB2YXIgcGFydGlhbExvY2F0aW9uID0gKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4ucmVwbGFjZSh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wsICcnKSkgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG5cbiAgICAgICAgLy8gQnVpbGQgdXAgYSBzZXJpZXMgb2YgcG9zc2libGUgQ1NTIHNlbGVjdG9yIHN0cmluZ3NcbiAgICAgICAgdmFyIHNlbGVjdG9ycyA9IFtdO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgVVJMIGFzIGl0IGlzIChhZGRpbmcgaW4gdGhlIHNlYXJjaCBwYXJhbWV0ZXJzKVxuICAgICAgICBzZWxlY3RvcnMucHVzaCgnaWZyYW1lW3NyYz1cIicgKyBwYXJ0aWFsTG9jYXRpb24gKyB3aW5kb3cubG9jYXRpb24uc2VhcmNoICsgJ1wiXScpO1xuXG4gICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVbd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmxlbmd0aCAtIDFdID09PSAnLycpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBVUkwgaGFzIGEgdHJhaWxpbmcgc2xhc2gsIGFkZCBhIHZlcnNpb24gd2l0aG91dCBpdFxuICAgICAgICAgICAgLy8gKGFkZGluZyBpbiB0aGUgc2VhcmNoIHBhcmFtZXRlcnMpXG4gICAgICAgICAgICBzZWxlY3RvcnMucHVzaCgnaWZyYW1lW3NyYz1cIicgKyAocGFydGlhbExvY2F0aW9uLnNsaWNlKDAsIC0xKSArIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpICsgJ1wiXScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgdGhlIFVSTCBkb2VzICpub3QqIGhhdmUgYSB0cmFpbGluZyBzbGFzaCwgYWRkIGEgdmVyc2lvbiB3aXRoXG4gICAgICAgICAgICAvLyBpdCAoYWRkaW5nIGluIHRoZSBzZWFyY2ggcGFyYW1ldGVycylcbiAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKCdpZnJhbWVbc3JjPVwiJyArIHBhcnRpYWxMb2NhdGlvbiArICcvJyArIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggKyAnXCJdJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZWFyY2ggZm9yIHRob3NlIHNlbGVjdG9ycyBpbiB0aGUgcGFyZW50IHBhZ2UsIGFuZCBhZGp1c3QgdGhlIGhlaWdodFxuICAgICAgICAvLyBhY2NvcmRpbmdseS5cbiAgICAgICAgdmFyICRpZnJhbWUgPSAkKHdpbmRvdy50b3AuZG9jdW1lbnQpLmZpbmQoc2VsZWN0b3JzLmpvaW4oJywnKSk7XG4gICAgICAgIHZhciBoID0gJCgnYm9keScpLm91dGVySGVpZ2h0KHRydWUpO1xuICAgICAgICAkaWZyYW1lLmNzcyh7J2hlaWdodCcgOiBoICsgJ3B4J30pO1xuICAgIH07XG5cbiAgICAvLyBmcm9tIGh0dHA6Ly9kYXZpZHdhbHNoLm5hbWUvamF2YXNjcmlwdC1kZWJvdW5jZS1mdW5jdGlvblxuICAgIHV0aWwuZGVib3VuY2UgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcbiAgICAgICAgdmFyIHRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghaW1tZWRpYXRlKSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgICAgICAgaWYgKGNhbGxOb3cpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBpZnJhbWUgY29kZVxuICAgICAgICB2YXIgcGFyYW1zID0gdXRpbC5nZXRQYXJhbWV0ZXJzKGRvY3VtZW50LlVSTCk7XG4gICAgICAgIGlmIChwYXJhbXNbJ3RlbXBsYXRlJ10gJiYgcGFyYW1zWyd0ZW1wbGF0ZSddID09PSAnaWZyYW1lJykge1xuICAgICAgICAgICAgLy8gVE9ETyBXaHkgZG8gd2UgbmVlZCB0aGlzPyBOb2JvZHkga25vd3MuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmRvbWFpbiA9ICd3YXNoaW5ndG9ucG9zdC5jb20nO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICQoJ2JvZHknKS5hZGRDbGFzcygnaWZyYW1lJykuc2hvdygpLmNzcygnZGlzcGxheScsJ2Jsb2NrJyk7XG4gICAgICAgICAgICBpZiAocGFyYW1zWydncmFwaGljX2lkJ10pe1xuICAgICAgICAgICAgICAgICQoJyMnICsgcGFyYW1zWydncmFwaGljX2lkJ10pLnNpYmxpbmdzKCkuaGlkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJCgnI3BnY29udGVudCwgLnBnQXJ0aWNsZScpLnNpYmxpbmdzKCkuaGlkZSgpO1xuXG4gICAgICAgICAgICAvLyBDT1JTIGxpbWl0YXRpb25zXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgPT09IHdpbmRvdy50b3AubG9jYXRpb24uaG9zdG5hbWUpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzaXplSWZyYW1lID0gdXRpbC5kZWJvdW5jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWwuY2hhbmdlSWZyYW1lSGVpZ2h0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDI1MCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gcmVzcG9uc2l2ZSBwYXJ0XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gV2h5IDEwMDBtcz8gVGhpcyBpcyBub3QgcmVsaWFibGUuXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbC5jaGFuZ2VJZnJhbWVIZWlnaHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTAwMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCByZXNpemVJZnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0uY2FsbCh0aGlzKSk7XG4iLCJ2YXIgSGFtbWVyID0gcmVxdWlyZSgnaGFtbWVyanMnKTtcblxuKGZ1bmN0aW9uICgkLCB3aW5kb3csIHVuZGVmaW5lZCkge1xuXG4gICAgLypcbiAgICAgKiBleHRlbmQgalF1ZXJ5IGZvciBuaWNlciBzeW50YXggZm9yIHJlbmRlcmluZyBvdXIgbWVudXMgYW5kIGxpc3RzLlxuICAgICAqL1xuICAgIC8vdXBkYXRlIDxsaT5zIGZyb20ganNvblxuXG4gICAgdmFyIF9faXNJRSA9ICQoJ2h0bWwuaWUnKS5sZW5ndGggPyB0cnVlIDogZmFsc2U7XG5cblxuICAgICQuZm4uYXBwZW5kTGlua0l0ZW1zID0gZnVuY3Rpb24obGlua3MsIHN1cnJvdW5kaW5nVGFnKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcztcbiAgICAgICAgc3Vycm91bmRpbmdUYWcgPSBzdXJyb3VuZGluZ1RhZyB8fCBcIjxsaT5cIjtcbiAgICAgICAgJC5lYWNoKGxpbmtzLCBmdW5jdGlvbihpLCBsaW5rKSB7XG4gICAgICAgICAgICB2YXIgYSA9ICQoXCI8YT5cIik7XG4gICAgICAgICAgICBpZiAobGluay50aXRsZSkgeyBhLnRleHQobGluay50aXRsZSk7IH1cbiAgICAgICAgICAgIGlmIChsaW5rLmh0bWwpIHsgYS5odG1sKGxpbmsuaHRtbCk7IH1cbiAgICAgICAgICAgIGlmIChsaW5rLmhyZWYpIHsgYS5hdHRyKFwiaHJlZlwiLCBsaW5rLmhyZWYpOyB9XG4gICAgICAgICAgICBpZiAobGluay5hdHRyKSB7IGEuYXR0cihsaW5rLmF0dHIpOyB9XG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZChcbiAgICAgICAgICAgICAgICAkKHN1cnJvdW5kaW5nVGFnKS5hcHBlbmQoYSkuYWRkQ2xhc3MobGluay5zZWxlY3RlZCA/IFwic2VsZWN0ZWRcIiA6IFwiXCIpXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgICQuZm4udHJhY2tDbGljayA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBlbGVtZW50Lm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbGlua25hbWU7XG4gICAgICAgICAgICB2YXIgbGluayA9ICQodGhpcyk7XG4gICAgICAgICAgICBpZiAoISF3aW5kb3cucyAmJiB0eXBlb2Ygcy5zZW5kRGF0YVRvT21uaXR1cmUgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGxpbmtuYW1lID0gKFwicGJuYXY6XCIgKyB0eXBlICsgXCIgLSBcIiArICAkLnRyaW0obGluay50ZXh0KCkpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHMuc2VuZERhdGFUb09tbml0dXJlKGxpbmtuYW1lLCAnJywge1xuICAgICAgICAgICAgICAgICAgICBcImNoYW5uZWxcIjogcy5jaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICBcInByb3AyOFwiOiBsaW5rbmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgICQuZm4udHJhY2tTaGFyZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcztcbiAgICAgICAgZWxlbWVudC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGxpbmsgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBsaW5rLmF0dHIoXCJkYXRhLXNoYXJlLXR5cGVcIik7XG4gICAgICAgICAgICBpZiAoISF3aW5kb3cucyAmJiB0eXBlb2Ygcy5zZW5kRGF0YVRvT21uaXR1cmUgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlKSB7XG4gICAgICAgICAgICAgICAgcy5zZW5kRGF0YVRvT21uaXR1cmUoJ3NoYXJlLicgKyB0eXBlLCAnZXZlbnQ2JywgeyBlVmFyMjc6IHR5cGUgfSk7IFxuICAgICAgICAgICAgfSAgXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgJC5mbi5tYWtlRHJvcGRvd24gPSBmdW5jdGlvbiAobWVudUVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGNsaWNrRWxlbWVudCA9IHRoaXM7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBvcHRpb25zLmRpc2FibGVkID0gZmFsc2U7XG5cbiAgICAgICAgLy9kZWZhdWx0IGJlaGF2aW9yIGZvciBkcm9wZG93blxuICAgICAgICB2YXIgZG93biA9IG9wdGlvbnMuZG93biB8fCBmdW5jdGlvbiAoX2NsaWNrRWxlbWVudCwgX21lbnVFbGVtZW50KSB7XG4gICAgICAgICAgICBuYXYuY2xvc2VEcm9wZG93bnMoKTtcbiAgICAgICAgICAgIF9jbGlja0VsZW1lbnQuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICAkKFwiLmxlYWRlcmJvYXJkXCIpLmFkZENsYXNzKFwiaGlkZUFkXCIpO1xuICAgICAgICAgICAgdmFyIHdpbmRvd0hlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKSAtIDUwO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmNzcyhcImhlaWdodFwiLFwiXCIpO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmNzcyhcImhlaWdodFwiLCAod2luZG93SGVpZ2h0IDw9IF9tZW51RWxlbWVudC5oZWlnaHQoKSkgPyB3aW5kb3dIZWlnaHQgOiBcImF1dG9cIik7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuY3NzKFwid2lkdGhcIiwgX2NsaWNrRWxlbWVudC5vdXRlcldpZHRoKCkgKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5jc3MoXCJsZWZ0XCIsIF9jbGlja0VsZW1lbnQub2Zmc2V0KCkubGVmdCApO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LnNsaWRlRG93bignZmFzdCcpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB1cCA9IG9wdGlvbnMudXAgfHwgZnVuY3Rpb24gKF9jbGlja0VsZW1lbnQsIF9tZW51RWxlbWVudCkge1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LnNsaWRlVXAoJ2Zhc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX2NsaWNrRWxlbWVudC5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICAgICAkKFwiLmxlYWRlcmJvYXJkXCIpLnJlbW92ZUNsYXNzKFwiaGlkZUFkXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgY2xpY2tFbGVtZW50LmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYoICFvcHRpb25zLmRpc2FibGVkICl7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgLy9ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIC8vQW5kIEkgdXNlZCB0byB0aGluayBpZTkgd2FzIGEgZ29vZCBicm93c2VyLi4uXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQgPyBldmVudC5wcmV2ZW50RGVmYXVsdCgpIDogZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGlmIChtZW51RWxlbWVudC5maW5kKFwibGlcIikubGVuZ3RoID09IDApIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGlmKGNsaWNrRWxlbWVudC5pcyhcIi5hY3RpdmVcIikpe1xuICAgICAgICAgICAgICAgICAgICB1cChjbGlja0VsZW1lbnQsIG1lbnVFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkb3duKGNsaWNrRWxlbWVudCwgbWVudUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZighX19pc0lFKXtcbiAgICAgICAgICAgIHZhciBoYW1tZXJ0aW1lID0gbmV3IEhhbW1lcihjbGlja0VsZW1lbnRbMF0sIHsgcHJldmVudF9tb3VzZWV2ZW50czogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGhhbW1lcnRpbWUub24oXCJ0YXBcIixoYW5kbGVUYXApO1xufVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy9tb3ZlIGhlYWRlciBmZWF0dXJlIG91dHNpZGUgb2YgcGItY29udGFpbmVyLCBzbyB0aGF0IHRoZSBtZW51IHNsaWRpbmcgYW5pbWF0aW9uIGNhbiB3b3JrXG4gICAgLy8gaWYoICQoXCIjcGItcm9vdCAucGItZi1wYWdlLWhlYWRlci12MlwiKS5sZW5ndGggJiYgKCQoXCIjcGItcm9vdCAucGItZi1wYWdlLWhlYWRlci12MlwiKS5zaWJsaW5ncyhcIi5wYi1mZWF0dXJlXCIpLmxlbmd0aCB8fCAkKFwiI3BiLXJvb3QgLnBiLWYtcGFnZS1oZWFkZXItdjJcIikuc2libGluZ3MoXCIucGItY29udGFpbmVyXCIpLmxlbmd0aCkgKSB7XG4gICAgLy8gICAgIChmdW5jdGlvbiAoKSB7XG4gICAgLy8gICAgICAgICB2YXIgJGhlYWRlciA9ICQoXCIucGItZi1wYWdlLWhlYWRlci12MlwiKTtcbiAgICAvLyAgICAgICAgICQoXCIucGItZi1wYWdlLWhlYWRlci12MiBzY3JpcHRcIikucmVtb3ZlKCk7XG4gICAgLy8gICAgICAgICAkKFwiI3BiLXJvb3RcIikuYmVmb3JlKCAkaGVhZGVyICk7XG4gICAgLy8gICAgIH0oKSk7XG4gICAgLy8gfVxuXG4gICAgLy9sb2FkIHRoZSBhZCBhZnRlciB0aGUgaGVhZGVyIGhhcyBiZWVuIG1vdmVkLCBzbyBpdCBkb2Vzbid0IGxvYWQgdHdpY2UuIG5vIGNhbGxiYWNrIG9uIGFkIHNjcmlwdHMsIHNvIGhhdmUgdG8gc2V0IGFuIGludGVydmFsIHRvIGNoZWNrXG4gICAgLy8gaWYoICQoXCIjbmF2LWFkOnZpc2libGVcIikubGVuZ3RoICl7XG4gICAgLy8gICAgIHZhciBhZEludGVydmFsVGltZW91dCA9IDEwOyAvL29ubHkgdHJ5IHRoaXMgZm9yIGZpdmUgc2Vjb25kcywgb3IgZGVhbCB3aXRoIGl0XG4gICAgLy8gICAgIHZhciBhZEludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgICAvLyAgICAgICAgIGlmKCB0eXBlb2YocGxhY2VBZDIpICE9IFwidW5kZWZpbmVkXCIgKXtcbiAgICAvLyAgICAgICAgICAgICAkKFwiI3dwbmlfYWRpXzg4eDMxXCIpLmFwcGVuZChwbGFjZUFkMihjb21tZXJjaWFsTm9kZSwnODh4MzEnLGZhbHNlLCcnKSk7ICAgIFxuICAgIC8vICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoYWRJbnRlcnZhbClcbiAgICAvLyAgICAgICAgIH0gICAgXG4gICAgLy8gICAgICAgICBpZiAoYWRJbnRlcnZhbFRpbWVvdXQgPT0gMCkgY2xlYXJJbnRlcnZhbChhZEludGVydmFsKTtcbiAgICAvLyAgICAgICAgIGFkSW50ZXJ2YWxUaW1lb3V0LS07XG4gICAgLy8gICAgIH0sIDUwMCk7XG4gICAgLy8gfVxuXG4gICAgLy9hZGQgdHJhY2tpbmdcbiAgICAvLyAkKFwiI3NpdGUtbWVudSBhXCIpLnRyYWNrQ2xpY2soXCJtYWluXCIpO1xuICAgIC8vICQoXCIjc2hhcmUtbWVudSBhXCIpLnRyYWNrU2hhcmUoKTtcblxuICAgIC8vYWN0aXZhdGUgZHJvcGRvd25zXG4gICAgJChcIiN3cC1oZWFkZXIgLm5hdi1idG5bZGF0YS1tZW51XVwiKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJkcm9wZG93bi10cmlnZ2VyXCIpO1xuICAgICAgICAkKHRoaXMpLm1ha2VEcm9wZG93biggJChcIiNcIiArICQodGhpcykuZGF0YShcIm1lbnVcIikgKSApO1xuICAgIH0pO1xuXG4gICAgLy9hY3RpdmF0ZSBzaXRlIG1lbnUgd2l0aCBjdXN0b20gYWN0aW9uc1xuICAgICQoXCIjc2l0ZS1tZW51LWJ0blwiKS5tYWtlRHJvcGRvd24oICQoXCIjc2l0ZS1tZW51XCIpLCB7XG4gICAgICAgIGRvd246IGZ1bmN0aW9uKF9jbGlja0VsZW1lbnQsIF9tZW51RWxlbWVudCl7XG4gICAgICAgICAgICBuYXYuY2xvc2VEcm9wZG93bnMoKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5jc3MoXCJoZWlnaHRcIiwgd2luZG93Lm91dGVySGVpZ2h0IC0gNTApO1xuICAgICAgICAgICAgJChcImJvZHlcIikuYWRkQ2xhc3MoICgkKFwiI3BiLXJvb3QgLnBiLWYtcGFnZS1oZWFkZXItdjJcIikubGVuZ3RoKSA/IFwibGVmdC1tZW51XCIgOiBcImxlZnQtbWVudSBsZWZ0LW1lbnUtcGJcIiApO1xuICAgICAgICAgICAgX2NsaWNrRWxlbWVudC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICQoJy5wYkhlYWRlcicpLnRvZ2dsZUNsYXNzKCdub3QtZml4ZWQnKTtcbiAgICAgICAgfSxcbiAgICAgICAgdXA6IGZ1bmN0aW9uKF9jbGlja0VsZW1lbnQsIF9tZW51RWxlbWVudCl7XG4gICAgICAgICAgICAkKFwiYm9keVwiKS5yZW1vdmVDbGFzcyhcImxlZnQtbWVudVwiKS5yZW1vdmVDbGFzcyhcImxlZnQtbWVudS1wYlwiKTtcbiAgICAgICAgICAgIF9jbGlja0VsZW1lbnQucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICAkKCcucGJIZWFkZXInKS50b2dnbGVDbGFzcygnbm90LWZpeGVkJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBoYW1tZXJ0aW1lID0gbmV3IEhhbW1lciggZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaXRlLW1lbnVcIiksIHtcbiAgICAgICAgZHJhZ0xvY2tUb0F4aXM6IHRydWUsXG4gICAgICAgIGRyYWdCbG9ja0hvcml6b250YWw6IHRydWVcbiAgICB9KTtcblxuICAgIGhhbW1lcnRpbWUub24oIFwiZHJhZ2xlZnQgc3dpcGVsZWZ0XCIsIGZ1bmN0aW9uKGV2KXsgXG4gICAgICAgIGV2Lmdlc3R1cmUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy9ldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0ID8gZXYuZ2VzdHVyZS5wcmV2ZW50RGVmYXVsdCgpIDogZXYuZ2VzdHVyZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICBldi5nZXN0dXJlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBpZiggZXYuZ2VzdHVyZS5kaXJlY3Rpb24gPT0gXCJsZWZ0XCIgJiYgJChcImJvZHlcIikuaXMoXCIubGVmdC1tZW51XCIpICl7XG4gICAgICAgICAgICAkKFwiI3NpdGUtbWVudS1idG5cIikuY2xpY2soKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyogc2VhcmNoLXNwZWNpZmljIG1hbmlwdWxhdGlvbiAqL1xuICAgICQoXCIuaW9zICNuYXYtc2VhcmNoLW1vYmlsZSBpbnB1dFwiKS5mb2N1cyhmdW5jdGlvbigpe1xuICAgICAgICAkKFwiaGVhZGVyXCIpLmNzcyhcInBvc2l0aW9uXCIsXCJhYnNvbHV0ZVwiKS5jc3MoXCJ0b3BcIix3aW5kb3cucGFnZVlPZmZzZXQpO1xuICAgIH0pLmJsdXIoZnVuY3Rpb24oKXtcbiAgICAgICAgJChcImhlYWRlclwiKS5jc3MoXCJwb3NpdGlvblwiLFwiZml4ZWRcIikuY3NzKFwidG9wXCIsMCk7XG4gICAgfSk7XG5cbiAgICAvL3RyaWdnZXIgd2luZG93IHJlc2l6ZSB3aGVuIG1vYmlsZSBrZXlib2FyZCBoaWRlc1xuICAgICQoXCIjbmF2LXNlYXJjaC1tb2JpbGUgaW5wdXRcIikuYmx1cihmdW5jdGlvbigpe1xuICAgICAgICAkKCB3aW5kb3cgKS5yZXNpemUoKTtcbiAgICB9KTtcblxuICAgICQoZG9jdW1lbnQpLmtleXVwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gSWYgeW91IHByZXNzIEVTQyB3aGlsZSBpbiB0aGUgc2VhcmNoIGlucHV0LCB5b3Ugc2hvdWxkIHJlbW92ZSBmb2N1cyBmcm9tIHRoZSBpbnB1dFxuICAgICAgICBpZiAoZS5rZXlDb2RlID09IDI3ICYmICQoXCIjbmF2LXNlYXJjaCBpbnB1dFt0eXBlPXRleHRdXCIpLmlzKFwiOmZvY3VzXCIpKSB7XG4gICAgICAgICAgICAkKFwiI25hdi1zZWFyY2ggaW5wdXRbdHlwZT10ZXh0XVwiKS5ibHVyKCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICQoXCIjbmF2LXNlYXJjaCwjbmF2LXNlYXJjaC1tb2JpbGVcIikuc3VibWl0KGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoJCh0aGlzKS5maW5kKCdpbnB1dFt0eXBlPXRleHRdJykudmFsKCkpIHtcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICBzLnNlbmREYXRhVG9PbW5pdHVyZSgnU2VhcmNoIFN1Ym1pdCcsJ2V2ZW50MicseydlVmFyMzgnOiQodGhpcykuZmluZCgnaW5wdXRbdHlwZT10ZXh0XScpLnZhbCgpLCdlVmFyMSc6cy5wYWdlTmFtZX0pO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qXG4gICAgICogQ0xJRU5UIFNJREUgQVBJIGZvciBDVVNUT01JWklORyB0aGUgSEVBREVSXG4gICAgICovXG5cbiAgICAvLyBUaGVyZSBzaG91bGQgb25seSBiZSBvbmUgbmF2aWdhdGlvbiBwZXIgcGFnZS4gU28gb3VyIG5hdmlnYXRpb24gb2JqZWN0IGlzIGEgc2luZ2xldG9uLlxuICAgIC8vIEhlYXZ5IGRlcGVuZGVuY3kgb24galF1ZXJ5XG4gICAgdmFyIGNvcmUgPSB3aW5kb3cud3BfcGIgPSB3aW5kb3cud3BfcGIgfHwge307XG4gICAgdmFyIG5hdiA9IGNvcmUubmF2ID0gY29yZS5uYXYgfHwge307XG4gICAgdmFyIGRlcHJlY2F0ZWQgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIG5hdi5zZXRTZWFyY2ggPSBuYXYuc2hvd1RvcE1lbnUgPSBuYXYuaGlkZVRvcE1lbnUgPSBuYXYuc2hvd1ByaW1hcnlMaW5rcyA9XG4gICAgbmF2LmhpZGVQcmltYXJ5TGlua3MgPSBuYXYuc2hvd0luVGhlTmV3cyA9IG5hdi5oaWRlSW5UaGVOZXdzID0gbmF2LnNob3dBZFNsdWcgPVxuICAgIG5hdi5oaWRlQWRTbHVnID0gbmF2LnNob3dTZWN0aW9uTmFtZSA9IG5hdi5oaWRlU2VjdGlvbk5hbWUgPVxuICAgIG5hdi5zZXRNYWluTWVudSA9IG5hdi5zZXRTZWN0aW9uTWVudSA9IG5hdi5zZXRTZWN0aW9uTmFtZSA9IGRlcHJlY2F0ZWQ7XG5cbiAgICBuYXYuc2hvd0lkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBuYXYucmVuZGVySWRlbnRpdHkoKTtcbiAgICAgICAgc2hvd0lkZW50aXR5ID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgbmF2LmhpZGVJZGVudGl0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChcIiNuYXYtdXNlclwiKS5oaWRlKCk7XG4gICAgICAgICQoXCJuYXYtc2lnbi1pblwiKS5oaWRlKCk7XG4gICAgICAgIHNob3dJZGVudGl0eSA9IGZhbHNlO1xuICAgIH07XG5cbiAgICBuYXYuc2hvd1NlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChcIiNuYXYtc2VhcmNoXCIpLnNob3coKTtcbiAgICB9O1xuXG4gICAgbmF2LmhpZGVTZWFyY2ggPSBmdW5jdGlvbiAoKSB7IFxuICAgICAgICAkKFwiI25hdi1zZWFyY2hcIikuaGlkZSgpOyBcbiAgICB9O1xuXG4gICAgbmF2LnNob3dTdWJzY3JpcHRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoXCIjbmF2LXN1YnNjcmlwdGlvblwiKS5zaG93KCk7XG4gICAgfTtcblxuICAgIG5hdi5oaWRlU3Vic2NyaXB0aW9uID0gZnVuY3Rpb24gKCkgeyBcbiAgICAgICAgJChcIiNuYXYtc3Vic2NyaXB0aW9uXCIpLmhpZGUoKTsgXG4gICAgfTtcbiAgICBcbiAgICB2YXIgc2V0TWVudSA9IGZ1bmN0aW9uIChlbGVtLCBtZW51KSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gJChlbGVtKTtcbiAgICAgICAgZWxlbWVudC5jaGlsZHJlbignbGknKS5yZW1vdmUoKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRMaW5rSXRlbXMobWVudSk7XG4gICAgfTtcblxuICAgIG5hdi5zZXRJZGVudGl0eU1lbnUgPSBmdW5jdGlvbiAobWVudSkge1xuICAgICAgICBzZXRNZW51KFwiI3VzZXItbWVudSB1bFwiLCBtZW51KTtcbiAgICB9O1xuXG4gICAgbmF2LnNldFBhZ2VUaXRsZSA9IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgICAkKCcjbmF2LXBhZ2UtdGl0bGUnKS50ZXh0KG5hbWUpO1xuICAgICAgICAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgndGl0bGUnLCBuYW1lKTtcbiAgICB9O1xuXG4gICAgbmF2LnNldFNoYXJlVXJsID0gZnVuY3Rpb24odXJsKXtcbiAgICAgICAgJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3Blcm1hbGluaycsdXJsKTtcbiAgICB9O1xuXG4gICAgbmF2LnNldFR3aXR0ZXJIYW5kbGUgPSBmdW5jdGlvbihoYW5kbGUpe1xuICAgICAgICBpZigkKCcjc2hhcmUtbWVudSBhW2RhdGEtc2hhcmUtdHlwZT1cIlR3aXR0ZXJcIl0nKS5sZW5ndGgpe1xuICAgICAgICAgICAgJCgnI3NoYXJlLW1lbnUgYVtkYXRhLXNoYXJlLXR5cGU9XCJUd2l0dGVyXCJdJykuZGF0YSgndHdpdHRlci1oYW5kbGUnLCBoYW5kbGUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG5hdi5jbG9zZURyb3Bkb3ducyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCIjd3AtaGVhZGVyIC5kcm9wZG93bi10cmlnZ2VyLmFjdGl2ZVwiKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgJChcIiNcIiskKHRoaXMpLmRhdGEoXCJtZW51XCIpKS5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKFwiLmxlYWRlcmJvYXJkXCIpLnJlbW92ZUNsYXNzKFwiaGlkZUFkXCIpO1xuICAgIH1cblxuXG4gICAgdmFyIHNjcm9sbEV2ZW50cyA9IHt9LFxuICAgICAgICBzY3JvbGxQb3MgPSAkKHRoaXMpLnNjcm9sbFRvcCgpO1xuXG4gICAgdmFyIGZvcmNlT3BlbiA9ICQoXCIjd3AtaGVhZGVyXCIpLmlzKFwiLnN0YXktb3BlblwiKTtcblxuICAgICQod2luZG93KS5zY3JvbGwoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8qIHNob3cgYW5kIGhpZGUgbmF2IG9uIHNjcm9sbCAqL1xuICAgICAgICB2YXIgY3VycmVudFBvcyA9ICQodGhpcykuc2Nyb2xsVG9wKCk7XG4gICAgICAgIGlmICghZm9yY2VPcGVuKSB7ICAgXG5cbiAgICAgICAgICAgIGlmKCAoY3VycmVudFBvcyArIDIwKSA8IHNjcm9sbFBvcyB8fCBjdXJyZW50UG9zID09PSAwICl7XG4gICAgICAgICAgICAgICAgbmF2LnNob3dOYXYoKTtcbiAgICAgICAgICAgICAgICBzY3JvbGxQb3MgPSBjdXJyZW50UG9zO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggKGN1cnJlbnRQb3MgLSAyMCkgPiBzY3JvbGxQb3MgJiYgY3VycmVudFBvcyA+IDUwICl7XG4gICAgICAgICAgICAgICAgbmF2LmhpZGVOYXYoKTtcbiAgICAgICAgICAgICAgICBzY3JvbGxQb3MgPSBjdXJyZW50UG9zO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyogbGlzdGVuIGZvciBzaG93L2hpZGUgdGl0bGUgKi9cblxuICAgICAgICBpZiAoc2Nyb2xsRXZlbnRzLmxlbmd0aCA9PSAwKSByZXR1cm47XG5cbiAgICAgICAgZm9yICh2YXIgaSBpbiBzY3JvbGxFdmVudHMpIHtcbiAgICAgICAgICAgIGlmIChzY3JvbGxFdmVudHMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIGN1cnJlbnRQb3MgPj0gc2Nyb2xsRXZlbnRzW2ldLnRhcmdldFBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbEV2ZW50c1tpXS5kb3duLmNhbGwoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRQb3MgPCBzY3JvbGxFdmVudHNbaV0udGFyZ2V0UG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRXZlbnRzW2ldLnVwLmNhbGwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbigpIHtcbiAgICAgICAgLy9yZW1vdmUgc3RhbmRhcmQgZHJvcGRvd25zXG4gICAgICAgIG5hdi5jbG9zZURyb3Bkb3ducygpO1xuICAgICAgICAvL3Jlc2l6ZSBzaXRlIG1lbnUsIGlmIG9wZW5cbiAgICAgICAgaWYoJChcImJvZHlcIikuaXMoXCIubGVmdC1tZW51XCIpKXtcbiAgICAgICAgICAgICQoXCIjc2l0ZS1tZW51XCIpLmNzcyhcImhlaWdodFwiLCAkKHdpbmRvdykuaGVpZ2h0KCkgLSA1MCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG5hdi5zaG93TmF2ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYoICQoXCIjd3AtaGVhZGVyXCIpLmlzKFwiLmJhci1oaWRkZW5cIikgKXtcbiAgICAgICAgICAgICQoXCIjd3AtaGVhZGVyXCIpLnJlbW92ZUNsYXNzKFwiYmFyLWhpZGRlblwiKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBuYXYuaGlkZU5hdiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmKCAhJChcIiN3cC1oZWFkZXJcIikuaXMoXCIuYmFyLWhpZGRlblwiKSAmJiAhJChcIiN3cC1oZWFkZXIgLm5hdi1idG4uYWN0aXZlXCIpLmxlbmd0aCApe1xuICAgICAgICAgICAgJChcIiN3cC1oZWFkZXJcIikuYWRkQ2xhc3MoXCJiYXItaGlkZGVuXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG5hdi5zaG93VGl0bGVPblNjcm9sbCA9IGZ1bmN0aW9uKCR0YXJnZXQpe1xuICAgICAgICB2YXIgZWxlbWVudCA9ICR0YXJnZXQ7XG4gICAgICAgIHNjcm9sbEV2ZW50c1tcInRpdGxlU2Nyb2xsXCJdID0ge1xuICAgICAgICAgICAgdGFyZ2V0UG9zaXRpb246IGVsZW1lbnQub2Zmc2V0KCkudG9wICsgNTAsXG4gICAgICAgICAgICBkb3duOiBmdW5jdGlvbiAoKSB7IFxuICAgICAgICAgICAgICAgIGlmKCAhJCgnI3dwLWhlYWRlcicpLmlzKFwiLnRpdGxlLW1vZGVcIikgKXtcbiAgICAgICAgICAgICAgICAgICAgJCgnI3dwLWhlYWRlcicpLmFkZENsYXNzKCd0aXRsZS1tb2RlJyk7XG4gICAgICAgICAgICAgICAgICAgICQoXCIjd3AtaGVhZGVyIC5uYXYtbWlkZGxlXCIpLmNzcyggXCJwYWRkaW5nLXJpZ2h0XCIsICAkKFwiI3dwLWhlYWRlciAubmF2LXJpZ2h0XCIpLm91dGVyV2lkdGgoKSApO1xuICAgICAgICAgICAgICAgICAgICBuYXYuY2xvc2VEcm9wZG93bnMoKTtcbiAgICAgICAgICAgICAgICB9ICAgXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXA6IGZ1bmN0aW9uICgpIHsgXG4gICAgICAgICAgICAgICAgaWYoICQoJyN3cC1oZWFkZXInKS5pcyhcIi50aXRsZS1tb2RlXCIpICl7XG4gICAgICAgICAgICAgICAgICAgICQoJyN3cC1oZWFkZXInKS5yZW1vdmVDbGFzcygndGl0bGUtbW9kZScpOyBcbiAgICAgICAgICAgICAgICAgICAgbmF2LmNsb3NlRHJvcGRvd25zKCk7XG4gICAgICAgICAgICAgICAgfSAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBpZiAoICQoJyNuYXYtcGFnZS10aXRsZVtkYXRhLXNob3ctb24tc2Nyb2xsPVwidHJ1ZVwiXScpLmxlbmd0aCApe1xuICAgICAgICB2YXIgJHRhcmdldCA9ICggJChcIi5uYXYtc2Nyb2xsLXRhcmdldFwiKS5sZW5ndGggKSA/ICQoXCIubmF2LXNjcm9sbC10YXJnZXRcIikgOiAkKFwiaDEsIGgyXCIpO1xuICAgICAgICBpZiggJHRhcmdldC5sZW5ndGggKSBuYXYuc2hvd1RpdGxlT25TY3JvbGwoICR0YXJnZXQuZmlyc3QoKSApO1xuICAgIH1cbiAgICAgICAgXG4gICAgbmF2LnJlbmRlclNoYXJlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJHNoYXJlID0gJChcIiNzaGFyZS1tZW51XCIpO1xuICAgICAgICAkZmFjZWJvb2sgPSAkKCdhW2RhdGEtc2hhcmUtdHlwZT1cIkZhY2Vib29rXCJdJywgJHNoYXJlKTtcbiAgICAgICAgJHR3aXR0ZXIgPSAkKCdhW2RhdGEtc2hhcmUtdHlwZT1cIlR3aXR0ZXJcIl0nLCAkc2hhcmUpO1xuICAgICAgICAkbGlua2VkaW4gPSAkKCdhW2RhdGEtc2hhcmUtdHlwZT1cIkxpbmtlZEluXCJdJywgJHNoYXJlKTtcbiAgICAgICAgJGVtYWlsID0gJCgnYVtkYXRhLXNoYXJlLXR5cGU9XCJFbWFpbFwiXScsICRzaGFyZSk7XG4gICAgICAgICRwaW50ZXJlc3QgPSAkKCdhW2RhdGEtc2hhcmUtdHlwZT1cIlBpbnRlcmVzdFwiXScsICRzaGFyZSk7XG5cbiAgICAgICAgaWYgKCRmYWNlYm9vay5sZW5ndGgpe1xuICAgICAgICAgICAgJGZhY2Vib29rLmNsaWNrKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9zaGFyZXIvc2hhcmVyLnBocD91PScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCdwZXJtYWxpbmsnKSApLCcnLCd3aWR0aD02NTgsaGVpZ2h0PTM1NCxzY3JvbGxiYXJzPW5vJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJHR3aXR0ZXIubGVuZ3RoKXtcbiAgICAgICAgICAgICR0d2l0dGVyLmNsaWNrKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICB2YXIgdHdpdHRlckhhbmRsZSA9ICgkKHRoaXMpLmRhdGEoXCJ0d2l0dGVyLWhhbmRsZVwiKSkgPyAgJCh0aGlzKS5kYXRhKFwidHdpdHRlci1oYW5kbGVcIikucmVwbGFjZShcIkBcIixcIlwiKSA6IFwid2FzaGluZ3RvbnBvc3RcIjtcbiAgICAgICAgICAgICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT91cmw9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3Blcm1hbGluaycpICkgKyAnJnRleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3RpdGxlJykgKSArICcmdmlhPScgKyB0d2l0dGVySGFuZGxlICwnJywnd2lkdGg9NTUwLCBoZWlnaHQ9MzUwLCBzY3JvbGxiYXJzPW5vJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJGxpbmtlZGluLmxlbmd0aCl7XG4gICAgICAgICAgICAkbGlua2VkaW4uY2xpY2soZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlP21pbmk9dHJ1ZSZ1cmw9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3Blcm1hbGluaycpICkgKyAnJnRpdGxlPScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCd0aXRsZScpICksJycsJ3dpZHRoPTgzMCxoZWlnaHQ9NDYwLHNjcm9sbGJhcnM9bm8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkZW1haWwubGVuZ3RoKXtcbiAgICAgICAgICAgICRlbWFpbC5jbGljayhmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgd2luZG93Lm9wZW4oJ21haWx0bzo/c3ViamVjdD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgndGl0bGUnKSApICsgJyBmcm9tIFRoZSBXYXNoaW5ndG9uIFBvc3QmYm9keT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgncGVybWFsaW5rJykgKSwnJywnJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZigkcGludGVyZXN0Lmxlbmd0aCl7XG4gICAgICAgICAgICAkcGludGVyZXN0LmNsaWNrKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgICAgIGUuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG4gICAgICAgICAgICAgICAgZS5zZXRBdHRyaWJ1dGUoJ2NoYXJzZXQnLCdVVEYtOCcpO1xuICAgICAgICAgICAgICAgIGUuc2V0QXR0cmlidXRlKCdzcmMnLCdodHRwczovL2Fzc2V0cy5waW50ZXJlc3QuY29tL2pzL3Bpbm1hcmtsZXQuanM/cj0nICsgTWF0aC5yYW5kb20oKSo5OTk5OTk5OSk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgaWYoICQoXCIjc2hhcmUtbWVudVwiKS5sZW5ndGggKXtcbiAgICAgICAgbmF2LnJlbmRlclNoYXJlKCk7XG4gICAgfVxuXG4gICAgdmFyIGlkcDsgLy9wcml2YXRlIHZhcmlhYmxlLiBUaGVyZSBjYW4gYmUgb25seSBvbmUgcHJvdmlkZXIuIFNvIHRoaXMgaXMgYSBzaW5nbGV0b24uXG4gICAgbmF2LmdldElkZW50aXR5UHJvdmlkZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBpZHA7XG4gICAgfTtcbiAgICBuYXYuc2V0SWRlbnRpdHlQcm92aWRlciA9IGZ1bmN0aW9uIChwcm92aWRlcikge1xuICAgICAgICB2YXIgZWYgPSBmdW5jdGlvbiAoKSB7fTsgLy9lbXB0eSBmdW5jdGlvblxuICAgICAgICBpZHAgPSB7fTtcbiAgICAgICAgLy8gd2UnbGwgcGFkIGFueSBtaXNzaW5nIHBvcnRpb24gd2l0aCBlbXB0eSBmdW5jdGlvblxuICAgICAgICBpZHAubmFtZSA9IHByb3ZpZGVyLm5hbWUgfHwgXCJcIjtcbiAgICAgICAgaWRwLmdldFVzZXJJZCA9IHByb3ZpZGVyLmdldFVzZXJJZCB8fCBlZjtcbiAgICAgICAgaWRwLmdldFVzZXJNZW51ID0gcHJvdmlkZXIuZ2V0VXNlck1lbnUgfHwgZWY7XG4gICAgICAgIGlkcC5nZXRTaWduSW5MaW5rID0gcHJvdmlkZXIuZ2V0U2lnbkluTGluayB8fCBlZjtcbiAgICAgICAgaWRwLmdldFJlZ2lzdHJhdGlvbkxpbmsgPSBwcm92aWRlci5nZXRSZWdpc3RyYXRpb25MaW5rIHx8IGVmO1xuICAgICAgICBpZHAuaXNVc2VyTG9nZ2VkSW4gPSBwcm92aWRlci5pc1VzZXJMb2dnZWRJbiB8fCBlZjtcbiAgICAgICAgaWRwLmlzVXNlclN1YnNjcmliZXIgPSBwcm92aWRlci5pc1VzZXJTdWJzY3JpYmVyIHx8IGVmO1xuICAgICAgICBcbiAgICAgICAgaWRwLnJlbmRlciA9IHByb3ZpZGVyLnJlbmRlciB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoaWRwLmlzVXNlckxvZ2dlZEluKCkpIHtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi11c2VyIC51c2VybmFtZVwiKS50ZXh0KGlkcC5nZXRVc2VySWQoKSk7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtdXNlci1tb2JpbGUgYVwiKS50ZXh0KGlkcC5nZXRVc2VySWQoKSk7XG4gICAgICAgICAgICAgICAgbmF2LnNldElkZW50aXR5TWVudShpZHAuZ2V0VXNlck1lbnUoKSk7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtdXNlclwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi11c2VyLW1vYmlsZVwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi11c2VyLW1vYmlsZSBhXCIpLmF0dHIoXCJocmVmXCIsaWRwLmdldFVzZXJNZW51KClbMF1bXCJocmVmXCJdKTtcbiAgICAgICAgICAgICAgICBpZiggaWRwLmlzVXNlclN1YnNjcmliZXIoKSA9PT0gXCIwXCIgKXtcbiAgICAgICAgICAgICAgICAgICAgJChcIiNuYXYtc3Vic2NyaWJlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICAgICAkKFwiI25hdi1zdWJzY3JpYmUtbW9iaWxlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtc2lnbi1pblwiKS5hdHRyKFwiaHJlZlwiLCBpZHAuZ2V0U2lnbkluTGluaygpK1wiJm5pZD10b3BfcGJfc2lnbmluXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXNpZ24taW4tbW9iaWxlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpLmZpbmQoXCJhXCIpLmF0dHIoXCJocmVmXCIsIGlkcC5nZXRTaWduSW5MaW5rKCkrXCImbmlkPXRvcF9wYl9zaWduaW5cIik7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtc3Vic2NyaWJlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXN1YnNjcmliZS1tb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy9sZXQncyByZW5kZXJcbiAgICAgICAgbmF2LnJlbmRlcklkZW50aXR5KCk7XG4gICAgfTtcbiAgICBuYXYucmVuZGVySWRlbnRpdHkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgaWYgKGlkcCkgeyAvLyB0aGUgdXNlciBtaWdodCBub3QgaGF2ZSBjb25maWd1cmVkIGFueSBpZGVudGl0eS4gU28gY2hlY2sgZm9yIGl0LlxuICAgICAgICAgICAgaWRwLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKGlkcCk7XG4gICAgfTtcblxuICAgIC8qXG4gICAgICogVXNpbmcgdGhlIHByaXZkZWQgQVBJLCBzZXQgdXAgdGhlIGRlZmF1bHQgaWRlbnRpdHkgcHJvdmlkZXIgYXMgVFdQXG4gICAgICovXG5cbiAgICAvLyBpZiB0aGUgaWRlbnRpdHkgY29tcG9uZW50IHdlcmUgc2V0IGFzIGhpZGRlbiBmcm9tIFBhZ2VCdWlsZGVyIGFkbWluXG4gICAgLy8gc2V0IGEgZmxhZyBzbyB0aGF0IHdlIGRvbid0IHByb2Nlc3MgbG9naW4gYXQgYWxsXG4gICAgdmFyIHNob3dJZGVudGl0eSA9ICQoXCIjbmF2LXVzZXJcIikuZGF0YShcInNob3ctaWRlbnRpdHlcIik7XG5cbiAgICAvLyBkZWZhdWx0IElkZW50aXR5XG4gICAgdmFyIGN1cnJlbnQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIj9cIilbMF07XG4gICAgdmFyIHR3cElkZW50aXR5ID0ge1xuICAgICAgICBuYW1lOiBcIlRXUFwiLFxuICAgICAgICBnZXRVc2VySWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB1c2VybmFtZSA9IFRXUC5VdGlsLlVzZXIuZ2V0VXNlck5hbWUoKTtcbiAgICAgICAgICAgIHZhciB1c2VyaWQgPSBUV1AuVXRpbC5Vc2VyLmdldFVzZXJJZCgpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB1c2VybmFtZSA9PSBcInN0cmluZ1wiICYmIHVzZXJuYW1lLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlcm5hbWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1c2VyaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGdldFVzZXJNZW51OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHsgXCJ0aXRsZVwiOiBcIlByb2ZpbGVcIiwgXCJocmVmXCI6IFRXUC5zaWduaW4ucHJvZmlsZXVybCArIGN1cnJlbnQgKyAnJnJlZnJlc2g9dHJ1ZScgfSxcbiAgICAgICAgICAgICAgICB7IFwidGl0bGVcIjogXCJMb2cgb3V0XCIsIFwiaHJlZlwiOiBUV1Auc2lnbmluLmxvZ291dHVybF9wYWdlIH1cbiAgICAgICAgICAgIF07XG4gICAgICAgIH0sXG4gICAgICAgIGdldFNpZ25Jbkxpbms6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBUV1Auc2lnbmluLmxvZ2ludXJsX3BhZ2UgKyBjdXJyZW50O1xuICAgICAgICB9LFxuICAgICAgICBnZXRSZWdpc3RyYXRpb25MaW5rOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gVFdQLnNpZ25pbi5yZWdpc3RyYXRpb251cmxfcGFnZSArIGN1cnJlbnQ7XG4gICAgICAgIH0sXG4gICAgICAgIGlzVXNlclN1YnNjcmliZXI6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgc3ViID0gKGRvY3VtZW50LmNvb2tpZS5tYXRjaCgvcnBsc2I9KFswLTldKykvKSkgPyBSZWdFeHAuJDEgOiAnJzsgXG4gICAgICAgICAgICByZXR1cm4gc3ViO1xuICAgICAgICB9LFxuICAgICAgICBpc1VzZXJMb2dnZWRJbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChUV1AuVXRpbC5Vc2VyKSA/IFRXUC5VdGlsLlVzZXIuZ2V0QXV0aGVudGljYXRpb24oKSA6IGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIElmIHdlIGFyZSBzaG93aW5nIGlkZW50aXR5IHRoZW4gc2V0IHRoZSBkZWZhdWx0IGlkZW50aXR5IHByb3ZpZGVyIHRvIFRXUC5cbiAgICAvLyAgIFVzZXIgY2FuIG92ZXJpZGUgdGhpcyB3aGVuZXZlciB0aGV5IHdhbnQuXG4gICAgLy9cbiAgICAvLyBJbiBUV1AsIGlkZW50aXR5IHVzZXIgaW50ZXJmYWNlIG5lZWRzIHRvIHByb2Nlc3NlZCBhZnRlciB0aGUgZmFjdCB0aGF0IGFsbCBvdGhlciBqYXZhc2NyaXB0IGhhcyBiZWVuIGxvYWRlZC5cbiAgICAvLyAgIEJ1dCB0aGUganMgcmVzb3VyY2VzIGFyZSBsb2FkZWQgYXN5bmNocm9ub3VzbHkgYW5kIGl0IGRvZXNuJ3QgaGF2ZSBhbnkgY2FsbGJhY2tzIGhvb2tzLiBTbyB3ZSB3YXRjaCBmb3IgaXQuXG4gICAgaWYgKHNob3dJZGVudGl0eSkge1xuICAgICAgICAvL3RyeSB0byBsb2FkIFRXUCBvbmx5IGlmIHdlIGFyZSBzaG93aW5nIElkZW50aXR5LlxuICAgICAgICB2YXIgaW5pdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAoZnVuY3Rpb24gY2hlY2tUV1AoKSB7XG4gICAgICAgICAgICAvLyBpZiB0aGVyZSdzIGFscmVhZHkgaWRwIHNldCwgdGhlbiBkb24ndCB0cnkgdG8gbG9hZCBUV1AuXG4gICAgICAgICAgICBpZiAoIW5hdi5nZXRJZGVudGl0eVByb3ZpZGVyKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoVFdQICYmIFRXUC5zaWduaW4gJiYgVFdQLlV0aWwpIHsgLy8gbWFrZSBzdXJlIFRXUCBoYXMgYmVlbiBsb2FkZWQuXG4gICAgICAgICAgICAgICAgICAgIG5hdi5zZXRJZGVudGl0eVByb3ZpZGVyKHR3cElkZW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgbmF2LnJlbmRlcklkZW50aXR5KCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICAvLyBhZnRlciAzIHNlY29uZHMsIGlmIFRXUCBpbmRlbnRpdHkgaGFzbid0IGJlZW4gbG9hZGVkLiBMZXQncyBqdXN0IHN0b3AuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgLSBpbml0IDwgMyAqIDEwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIGl0IGhhc24ndCBiZWVuIGxvYWRlZCwgd2Ugd2FpdCBmZXcgbWlsbGlzZWNvbmRzIGFuZCB0cnkgYWdhaW4uXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IGNoZWNrVFdQKCk7IH0sIDIwMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0oKSk7XG4gICAgfVxuXG4gICAgLyogaGFtbWVyLmpzIHRhcCAqL1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlVGFwKGV2KSB7XG4gICAgICAgIGV2Lmdlc3R1cmUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy9ldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0ID8gZXYuZ2VzdHVyZS5wcmV2ZW50RGVmYXVsdCgpIDogZXYuZ2VzdHVyZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICBldi5nZXN0dXJlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAkKGV2Lmdlc3R1cmUudGFyZ2V0KS5jbGljaygpO1xuICAgIH1cblxuICAgIC8qIGEvYiB0ZXN0IGFuZCB0YXJnZXQgKi9cbiAgICAvLyAkKHdpbmRvdy5kb2N1bWVudCkub24oJ2FidGVzdC1yZWFkeScsIGZ1bmN0aW9uKGUsIEFCVCkge1xuXG4gICAgLy8gICAgIGlmICggIXN1cHBvcnRlZENsaWVudCgpICkge1xuICAgIC8vICAgICAgICAgcmV0dXJuO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgYXBwbHlWYXJpYW50RXhwZXJpZW5jZSgnbWFzdEhlYWQyJywgJ2xvZ29MYXJnZScpO1xuXG4gICAgLy8gICAgIGZ1bmN0aW9uIGFwcGx5VmFyaWFudEV4cGVyaWVuY2UoZmVhdHVyZU5hbWUsIHZhcmlhbnROYW1lKSB7XG4gICAgLy8gICAgICAgICB2YXIgZnRyID0gQUJULmdldChmZWF0dXJlTmFtZSk7XG4gICAgLy8gICAgICAgICB2YXIgdHJrID0gZnRyLmlzKHZhcmlhbnROYW1lKTtcbiAgICAgICAgICAgIFxuICAgIC8vICAgICAgICAgdmFyICR0YXJnZXQgPSAkKCdoZWFkZXIuYWJ0LW5vdC1sb2FkZWQsICN3cC10b3BwZXIsIC5wYi1mLXBhZ2UtaGVhZGVyLXYyLCBib2R5Jyk7XG4gICAgLy8gICAgICAgICAkdGFyZ2V0LnJlbW92ZUNsYXNzKCAnYWJ0LW5vdC1sb2FkZWQnICk7XG4gICAgLy8gICAgICAgICAkdGFyZ2V0LmFkZENsYXNzKCAnYWJ0LScgKyBmZWF0dXJlTmFtZSArICctJyArIHZhcmlhbnROYW1lICsgJy0nICsgdHJrICk7XG5cbiAgICAvLyAgICAgICAgIHZhciBmZCA9IG1vbWVudCgpLmZvcm1hdCgnZGRkZCwgTEwnKTtcblxuICAgIC8vICAgICAgICAgJCgnI3dwLXRvcHBlciAudG9wLXRpbWVzdGFtcCcpLnRleHQoZmQpO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgZnVuY3Rpb24gc3VwcG9ydGVkQ2xpZW50KCkge1xuXG4gICAgLy8gICAgICAgICByZXR1cm4gJCgnaHRtbC5kZXNrdG9wJykubGVuZ3RoID4gMCAmJiAkKCdoZWFkZXIuZGFyaycpLmxlbmd0aCA9PSAwO1xuICAgIC8vICAgICB9XG4gICAgLy8gfSk7XG5cbn0oalF1ZXJ5LCB3aW5kb3cpKTtcblxuIiwiLy9Ub3AgU2hhcmUgQmFyIEpTIC0gc3RvbGVuIHN0cmFpZ2h0IGZyb20gXG4oZnVuY3Rpb24oJCl7XG5cbiAgIHZhciBzb2NpYWxUb29scyA9IHtcbiAgICAgICAgbXlSb290IDogJy50b3Atc2hhcmViYXItd3JhcHBlcicsXG5cbiAgICAgICAgaW5pdDpmdW5jdGlvbiAobXlSb290KSB7XG4gICAgICAgICAgICBteVJvb3QgPSBteVJvb3QgfHwgdGhpcy5teVJvb3Q7XG4gICAgICAgICAgICAkKG15Um9vdCkuZWFjaChmdW5jdGlvbihpbmRleCwgbXlSb290RWxlbWVudCl7XG4gICAgICAgICAgICAgICAgbXlSb290RWxlbWVudC5wb3N0U2hhcmUgPSBuZXcgcG9zdFNoYXJlKCk7XG4gICAgICAgICAgICAgICAgbXlSb290RWxlbWVudC5wb3N0U2hhcmUuaW5pdCgkKG15Um9vdEVsZW1lbnQpLCAkKG15Um9vdEVsZW1lbnQpLmRhdGEoJ3Bvc3RzaGFyZScpKTtcbiAgICAgICAgICAgICAgICB2YXIgJHJvb3QgPSAkKG15Um9vdEVsZW1lbnQpLCBcbiAgICAgICAgICAgICAgICAgICAgJGluZGl2aWR1YWxUb29sID0gJCgnLnRvb2w6bm90KC5tb3JlKScsJHJvb3QpLFxuICAgICAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNXcmFwcGVyID0gJCgnLnNvY2lhbC10b29scy13cmFwcGVyJywkcm9vdCksXG4gICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc01vcmVCdG4gPSAkKCcudG9vbC5tb3JlJywkc29jaWFsVG9vbHNXcmFwcGVyKSxcbiAgICAgICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzQWRkaXRpb25hbCA9ICQoJy5zb2NpYWwtdG9vbHMtYWRkaXRpb25hbCcsJHJvb3QpLFxuICAgICAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNVdGlsaXR5ID0gJCgnLnV0aWxpdHktdG9vbHMtd3JhcHBlcicsJHJvb3QpLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9ICh3aW5kb3cuaW5uZXJXaWR0aCA+IDApID8gd2luZG93LmlubmVyV2lkdGggOiBzY3JlZW4ud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGlzTW9iaWxlID0gKG1vYmlsZV9icm93c2VyID09PSAxICYmIHdpZHRoIDwgNDgwKSA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0geydvbW5pdHVyZUV2ZW50JyA6ICdldmVudDYnfTsgICAgICAgICAgXG4gICAgXG4gICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzTW9yZUJ0bi5vZmYoJ2NsaWNrJykub24oJ2NsaWNrJyx0aGlzLGZ1bmN0aW9uKGV2KXsgIFxuICAgICAgICAgICAgICAgICAgICBpZihpc01vYmlsZSl7JHNvY2lhbFRvb2xzVXRpbGl0eS5oaWRlKCdmYXN0Jyk7fTsgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNNb3JlQnRuLmhpZGUoJ2Zhc3QnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc0FkZGl0aW9uYWwuc2hvdygnZmFzdCcsZnVuY3Rpb24oZXYpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy50b29sJywkc29jaWFsVG9vbHNXcmFwcGVyKS5hbmltYXRlKHtcIndpZHRoXCI6NDB9LDI1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3QuYWRkQ2xhc3MoXCJleHBhbmRlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcuc29jaWFsLXRvb2xzJywkc29jaWFsVG9vbHNBZGRpdGlvbmFsKS5hbmltYXRlKHtcIm1hcmdpbi1sZWZ0XCI6MH0sMjUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihpc01vYmlsZSl7JHNvY2lhbFRvb2xzVXRpbGl0eS5zaG93KCdzbG93Jyk7fTsgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7Ly9lbmQgYWRkdGwgc2hvd1xuICAgICAgICAgICAgICAgIH0pOy8vZW5kIG1vcmUgY2xpY2sgXG4gICAgICAgICAgICAgICAgJGluZGl2aWR1YWxUb29sLmJpbmQoe1xuICAgICAgICAgICAgICAgICAgICBjbGljazogZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9ldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LnNlbmREYXRhVG9PbW5pdHVyZSA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2hhcmVUeXBlID0gJCh0aGlzKS5hdHRyKCdjbGFzcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXJlVHlwZSA9ICh0eXBlb2Ygc2hhcmVUeXBlICE9ICd1bmRlZmluZWQnKT9zaGFyZVR5cGUuc3BsaXQoXCIgXCIpWzBdLnRyaW0oKTonJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb21uaXR1cmVWYXJzID0gIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZVZhcjFcIjoodHlwZW9mIHdpbmRvdy5zID09ICdvYmplY3QnKSAmJiBzICYmIHMuZVZhcjEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVWYXIyXCI6KHR5cGVvZiB3aW5kb3cucyA9PSAnb2JqZWN0JykgJiYgcyAmJiBzLmVWYXIyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlVmFyOFwiOih0eXBlb2Ygd2luZG93LnMgPT0gJ29iamVjdCcpICYmIHMgJiYgcy5lVmFyOCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZVZhcjE3XCI6KHR5cGVvZiB3aW5kb3cucyA9PSAnb2JqZWN0JykgJiYgcyAmJiBzLmVWYXIxNyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZVZhcjI3XCI6JydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb21uaXR1cmVWYXJzLmVWYXIyNyA9IHNoYXJlVHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnROYW1lID0gY29uZmlnLm9tbml0dXJlRXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VuZERhdGFUb09tbml0dXJlKCdzaGFyZS4nICsgc2hhcmVUeXBlLGV2ZW50TmFtZSxvbW5pdHVyZVZhcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpe30gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgfVxuICAgIH07ICAgXG5cbiAgIHZhciB0ZXh0UmVzaXplciA9IHtcbiAgICAgICAgY3VyckluY3JlbWVudE1heDo0LFxuICAgICAgICBjdXJySW5jcmVtZW50VW5pdDoyLFxuICAgICAgICBjdXJySW5jcmVtZW50SW5kZXg6MCxcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKG15Um9vdCxyZXNpemVhYmxlRWxlbWVudExpc3QsY2xpY2tFbGVtZW50KSB7XG4gICAgICAgICAgICBteVJvb3QgPSBteVJvb3QgfHwgJyNhcnRpY2xlLWJvZHkgYXJ0aWNsZSwgLnJlbGF0ZWQtc3RvcnknO1xuICAgICAgICAgICAgcmVzaXplYWJsZUVsZW1lbnRMaXN0ID0gcmVzaXplYWJsZUVsZW1lbnRMaXN0IHx8ICdwLCBsaSc7XG4gICAgICAgICAgICBjbGlja0VsZW1lbnQgPSBjbGlja0VsZW1lbnQgfHwgJy50b29sLnRleHRyZXNpemVyJztcbiAgICAgICAgICAgIHRoaXMucm9vdCA9ICQobXlSb290KTtcbiAgICAgICAgICAgIHRoaXMucmVzaXplYWJsZUVsZW1lbnRzID0gJChyZXNpemVhYmxlRWxlbWVudExpc3QsIHRoaXMucm9vdCk7XG5cbiAgICAgICAgICAgIC8vIGFkZCBcIk5leHQgdXBcIiBsYWJsZSB0byB0aGUgcmVzaXphYmxlIGVsZW1lbnQncyBsaXN0XG4gICAgICAgICAgICBpZigkKFwiLnJlbGF0ZWQtc3RvcnlcIikucHJldignaDMnKS5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZWFibGVFbGVtZW50cy5wdXNoKCQoJy5yZWxhdGVkLXN0b3J5JykucHJldignaDMnKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVhYmxlRWxlbWVudHMucHVzaCgkKCcucmVsYXRlZC1zdG9yeSBoNCBhJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJChjbGlja0VsZW1lbnQpLnVuYmluZCgnY2xpY2snKS5vbignY2xpY2snLHRoaXMsdGhpcy5yZXNpemUpO1xuICAgICAgICB9LFxuICAgICAgICByZXNpemU6IGZ1bmN0aW9uIChldmVudCkgeyAgXG4gICAgICAgICAgICB2YXIgY3Vyck9iaiA9IGV2ZW50LmRhdGE7XG4gICAgICAgICAgICBpZiAoY3Vyck9iai5jdXJySW5jcmVtZW50SW5kZXggPT0gY3Vyck9iai5jdXJySW5jcmVtZW50TWF4KSB7XG4gICAgICAgICAgICAgICAgY3Vyck9iai5jdXJySW5jcmVtZW50SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIGN1cnJPYmouY3VyckluY3JlbWVudFVuaXQgPSAoY3Vyck9iai5jdXJySW5jcmVtZW50VW5pdCA9PSAyKT8tMjoyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3Vyck9iai5jdXJySW5jcmVtZW50SW5kZXggPSBjdXJyT2JqLmN1cnJJbmNyZW1lbnRJbmRleCArIDE7XG4gICAgICAgICAgICBjdXJyT2JqLnJlc2l6ZWFibGVFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgZWxtID0gJCh0aGlzKTtcbiAgICAgICAgICAgICAgICBjdXJyU2l6ZT0gcGFyc2VGbG9hdChlbG0uY3NzKCdmb250LXNpemUnKSw1KTtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VyclNpemUgKyBjdXJyT2JqLmN1cnJJbmNyZW1lbnRVbml0O1xuICAgICAgICAgICAgICAgIGVsbS5jc3MoJ2ZvbnQtc2l6ZScsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgd3BfcGIucmVwb3J0KCd0ZXh0cmVzaXplcicsICdyZXNpemVkJywgcmVzdWx0KTtcbiAgICAgICAgICAgIH0pOyBcblxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgIH07XG52YXIgbW9iaWxlX2Jyb3dzZXIgPSBtb2JpbGVfYnJvd3NlciAmJiBtb2JpbGVfYnJvd3NlciA9PT0gMSA/IDEgOiAwO1xuICAgXG4gICB2YXIgcG9zdFNoYXJlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgdGhpcy5pbml0ID0gZnVuY3Rpb24ocm9vdEVsZW1lbnQsIHBvc3RTaGFyZVR5cGVzKSB7XG4gICAgICAgICAgIGlmIChwb3N0U2hhcmVUeXBlcykge1xuICAgICAgICAgICAgICAgcG9zdFNoYXJlVHlwZXMuc3BsaXQoXCIsXCIpLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCwgaW5kZXgpe1xuICAgICAgICAgICAgICAgICAgIHZhciBwb3N0U2hhcmVVcmwgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaG9zdC5pbmRleE9mKCd3YXNoaW5ndG9ucG9zdC5jb20nKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHBvc3RTaGFyZVVybCA9ICdodHRwOi8vcG9zdHNoYXJlLndhc2hpbmd0b25wb3N0LmNvbSc7IC8vcHJvZHVjdGlvbiBvbmx5XG4gICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh3aW5kb3cubG9jYXRpb24uaG9zdC5pbmRleE9mKCdwYi1zdGFnaW5nLmRpZ2l0YWxpbmsuY29tJykgPj0gMCB8fCB3aW5kb3cubG9jYXRpb24uaG9zdC5pbmRleE9mKCdwYi1zdGFnaW5nLndwcHJpdmF0ZS5jb20nKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHBvc3RTaGFyZVVybCA9ICdodHRwOi8vcG9zdHNoYXJlLXN0YWdlLndwcHJpdmF0ZS5jb20nOyAvL3Rlc3RpbmcgcGItc3RhZ2luZ1xuICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHBvc3RTaGFyZVVybCA9ICdodHRwOi8vcG9zdHNoYXJlLWRldi53cHByaXZhdGUuY29tJzsgLy90ZXN0aW5nIHBiLWRldlxuICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICB2YXIgcHJlVGltZXN0YW1wID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICB2YXIgcHJlQnVzaW5lc3NLZXkgPSB3cF9wYi5TdGF0aWNNZXRob2RzLmdldFVuaXF1ZUtleSgxMDAwLCBudWxsLCBwcmVUaW1lc3RhbXApO1xuICAgICAgICAgICAgICAgICAgIHZhciBvYmplY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHNoYXJlVHlwZSA6IGVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcCA6IHByZVRpbWVzdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgICAgYnVzaW5lc3NLZXkgOiBwcmVCdXNpbmVzc0tleSxcbiAgICAgICAgICAgICAgICAgICAgICAgc2hhcmVVcmwgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICB0aW55VXJsIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVkUG9zdFNoYXJlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgIGNsaWVudFV1aWQgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBwb3N0U2hhcmVVcmwgOiBwb3N0U2hhcmVVcmwsXG4gICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICBjYWxsUG9zdFNoYXJlIDogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY2FsbGVkUG9zdFNoYXJlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBfdGhpcy5wb3N0U2hhcmVVcmwrXCIvYXBpL2JrL1wiK190aGlzLmJ1c2luZXNzS2V5K1wiL1wiK190aGlzLmNsaWVudFV1aWQrXCIvXCIrX3RoaXMuc2hhcmVUeXBlK1wiL1wiK190aGlzLnRpbWVzdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2FsbGVkUG9zdFNoYXJlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbGxlZFBvc3RTaGFyZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICBzaGFyZSA6IGZ1bmN0aW9uIChzb2NpYWxVcmwsIHNvY2lhbFVybDIsIHN0eWxlLCBjYWxsYmFja0NvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudGlueVVybCB8fCB0aGlzLnRpbnlVcmwubGVuZ3RoID09IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogXCJodHRwOi8vdGlueXVybC53YXNoaW5ndG9ucG9zdC5jb20vY3JlYXRlLmpzb25wXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBfdGhpcy5zaGFyZVVybCArIFwiP3Bvc3RzaGFyZT1cIitfdGhpcy5idXNpbmVzc0tleVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyb3NzRG9tYWluOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnRpbnlVcmwgPSBkYXRhLnRpbnlVcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja0NvbnRleHQub3BlbldpbmRvdyhzb2NpYWxVcmwrX3RoaXMudGlueVVybCtzb2NpYWxVcmwyLF90aGlzLnNoYXJlVHlwZSxzdHlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy90aHJvdyBcIlBvc3RTaGFyZSBmYWlsZWQ6IHRpbnlVcmxcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogMjAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrQ29udGV4dC5vcGVuV2luZG93KHNvY2lhbFVybCtfdGhpcy50aW55VXJsK3NvY2lhbFVybDIsX3RoaXMuc2hhcmVUeXBlLHN0eWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgJChyb290RWxlbWVudC5maW5kKCcuJytlbGVtZW50KVswXSkucGFyZW50KClbMF0ucG9zdFNoYXJlID0gJChyb290RWxlbWVudClbMF0ucG9zdFNoYXJlO1xuICAgICAgICAgICAgICAgICAgICQocm9vdEVsZW1lbnQuZmluZCgnLicrZWxlbWVudClbMF0pLnBhcmVudCgpWzBdLnBvc3RTaGFyZU9iamVjdCA9IG9iamVjdDtcbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICB9XG4gICAgICAgfSxcbiAgICAgICBcbiAgICAgICB0aGlzLmNhbGxQb3N0U2hhcmUgPSBmdW5jdGlvbiAoZWxlbWVudCwgZWxlbWVudE9iamVjdCwgc29jaWFsVXJsLCBzaGFyZVVybExvbmcsIHNvY2lhbFVybDIsIHN0eWxlKSB7XG4gICAgICAgICAgIGlmKGVsZW1lbnQgJiYgZWxlbWVudE9iamVjdCAmJiBzb2NpYWxVcmwgJiYgc2hhcmVVcmxMb25nKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNoYXJlVHlwZSA9ICQoZWxlbWVudCkuY2hpbGRyZW4oKS5hdHRyKCdjbGFzcycpO1xuICAgICAgICAgICAgICAgIHNoYXJlVHlwZSA9ICh0eXBlb2Ygc2hhcmVUeXBlICE9ICd1bmRlZmluZWQnKT9zaGFyZVR5cGUuc3BsaXQoXCIgXCIpWzBdLnRyaW0oKTonJztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZighc29jaWFsVXJsMikge1xuICAgICAgICAgICAgICAgICAgICBzb2NpYWxVcmwyID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGNsaWVudFV1aWQgPSAkLmNvb2tpZShcIndhcG9fbG9naW5faWRcIik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxlbWVudE9iamVjdC5jbGllbnRVdWlkID0gY2xpZW50VXVpZDtcbiAgICAgICAgICAgICAgICBpZiAoY2xpZW50VXVpZCAmJiBjbGllbnRVdWlkLmxlbmd0aCA+IDAgJiYgc2hhcmVUeXBlICYmIHNoYXJlVHlwZS5sZW5ndGggPiAwICYmIGVsZW1lbnRPYmplY3Quc2hhcmVUeXBlICYmIHNoYXJlVHlwZS50cmltKCkgPT0gZWxlbWVudE9iamVjdC5zaGFyZVR5cGUudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRPYmplY3Quc2hhcmVVcmwgPSBzaGFyZVVybExvbmc7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRPYmplY3QuY2FsbFBvc3RTaGFyZSgpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50T2JqZWN0LnNoYXJlKHNvY2lhbFVybCwgc29jaWFsVXJsMiwgc3R5bGUsIGVsZW1lbnQucG9zdFNoYXJlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlBvc3RTaGFyZSBmYWlsZWQ6IG5vIGxvZ2dlZCBpbiBVc2VyIG9yIHdyb25nIFNoYXJldHlwZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLnBhcmVudCgpWzBdLnBvc3RTaGFyZU9iamVjdCA9IGVsZW1lbnRPYmplY3Q7XG4gICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICB0aHJvdyBcIlBvc3RTaGFyZSBmYWlsZWQ6IERhdGEgbWlzc2luZ1wiO1xuICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgXG4gICAgICAgIHRoaXMub3BlbldpbmRvdyA9IGZ1bmN0aW9uKHVybCwgbmFtZSwgc3R5bGUpe1xuICAgICAgICAgICAgd2luZG93Lm9wZW4odXJsLCdzaGFyZV8nK25hbWUsc3R5bGUpO1xuICAgICAgICB9XG4gICB9O1xuICAgXG4gICB3aW5kb3cuVFdQID0gd2luZG93LlRXUCB8fCB7fTtcbiAgIFRXUC5Tb2NpYWxUb29scyA9IFRXUC5Tb2NpYWxUb29scyB8fCBzb2NpYWxUb29scztcbiAgIFRXUC5UZXh0UmVzaXplciA9IFRXUC5UZXh0UmVzaXplciB8fCB0ZXh0UmVzaXplcjtcblxuICAgVFdQLlRleHRSZXNpemVyLmluaXQoKTtcbiAgIFRXUC5Tb2NpYWxUb29scy5pbml0KCk7XG5cblxuICAgLypcbiAgICAgKiBQT1BPVVQgY29kZSBmb3IgbGF0ZXIgdmFyICRhcnRpY2xlID0gJCgnI2FydGljbGUtdG9wcGVyJyk7IC8vIFNUQVJUOlxuICAgICAqIFNvY2lhbCBzaGFyZSBwb3Atb3V0IHZhciAkc29jaWFsVG9vbHNNb3JlQnRuID0gJCgnLnNvY2lhbC10b29sc1xuICAgICAqIC5tb3JlJywkYXJ0aWNsZSksICRzb2NpYWxUb29sc1BvcE91dCA9XG4gICAgICogJCgnLnNvY2lhbC10b29scy5wb3Atb3V0JywkYXJ0aWNsZSkgO1xuICAgICAqICRzb2NpYWxUb29sc01vcmVCdG4ub24oJ2NsaWNrJyxmdW5jdGlvbihldil7IHZhciB0YXJnZXRUb3AgPVxuICAgICAqICRzb2NpYWxUb29sc01vcmVCdG4ucG9zaXRpb24oKS50b3AgK1xuICAgICAqICRzb2NpYWxUb29sc01vcmVCdG4ub3V0ZXJIZWlnaHQoKS0xLTE0OyB2YXIgdGFyZ2V0TGVmdCA9XG4gICAgICogJHNvY2lhbFRvb2xzTW9yZUJ0bi5wb3NpdGlvbigpLmxlZnQtMS0zO1xuICAgICAqICRzb2NpYWxUb29sc1BvcE91dC5jc3Moe1widG9wXCI6dGFyZ2V0VG9wLFwibGVmdFwiOnRhcmdldExlZnR9KTtcbiAgICAgKiAkc29jaWFsVG9vbHNQb3BPdXQudG9nZ2xlKCk7IH0pO1xuICAgICAqICRzb2NpYWxUb29sc1BvcE91dC5vbignbW91c2VvdXQnLGZ1bmN0aW9uKGV2KXtcbiAgICAgKiAkc29jaWFsVG9vbHNQb3BPdXQudG9nZ2xlKCk7IH0pOyAvLyBFTkQ6IFNvY2lhbCBzaGFyZSBwb3Atb3V0XG4gICAgICovXG59KShqUXVlcnkpOyIsInZhciBpZnJhbWUgPSByZXF1aXJlKCcuL2lmcmFtZS5qcycpO1xudmFyIHR3aXR0ZXJGb2xsb3dCdXR0b25Nb2R1bGVzID0gcmVxdWlyZSgnLi90d2l0dGVyLWZvbGxvdy5qcycpO1xudmFyIHBiSGVhZGVyTW9kdWxlID0gcmVxdWlyZSgnLi9wYkhlYWRlci5qcycpO1xudmFyIHBiU29jaWFsVG9vbHMgPSByZXF1aXJlKCcuL3BiU29jaWFsVG9vbHMuanMnKTtcblxuLy9BZGRzIHRoZSByZXR1cm4gdXJsIHRvIHRoZSBzdWJzY3JpYmUgYWN0aW9uXG52YXIgc2V0dXBTdWJzY3JpYmVCdG4gPSBmdW5jdGlvbigpe1xuICB2YXIgJHN1YnNjcmliZSA9ICQoJyNuYXYtc3Vic2NyaWJlJyksXG4gICAgaHJlZiA9ICAkc3Vic2NyaWJlLmF0dHIoJ2hyZWYnKSxcbiAgICBwYWdlTG9jYXRpb24gPSB3aW5kb3cuZW5jb2RlVVJJKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICRzdWJzY3JpYmUuYXR0cignaHJlZicsIGhyZWYgKyBwYWdlTG9jYXRpb24pO1xufTtcbi8vRHJvcCBpbiB5b3VyIGluaXQgZmlsZVxuc2V0dXBTdWJzY3JpYmVCdG4oKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEdlbmVyYWxcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xudmFyIGdldE9mZnNldCA9IGZ1bmN0aW9uKGVsKSB7XG4gIGVsID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHJldHVybiB7XG4gICAgbGVmdDogZWwubGVmdCArIHdpbmRvdy5zY3JvbGxYLFxuICAgIHRvcDogZWwudG9wICsgd2luZG93LnNjcm9sbFlcbiAgfVxufVxuXG52YXIgc2h1ZmZsZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gIHZhciBjdXJyZW50SW5kZXggPSBhcnJheS5sZW5ndGgsIHRlbXBvcmFyeVZhbHVlLCByYW5kb21JbmRleDtcblxuICAvLyBXaGlsZSB0aGVyZSByZW1haW4gZWxlbWVudHMgdG8gc2h1ZmZsZS4uLlxuICB3aGlsZSAoMCAhPT0gY3VycmVudEluZGV4KSB7XG5cbiAgICAvLyBQaWNrIGEgcmVtYWluaW5nIGVsZW1lbnQuLi5cbiAgICByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGN1cnJlbnRJbmRleCk7XG4gICAgY3VycmVudEluZGV4IC09IDE7XG5cbiAgICAvLyBBbmQgc3dhcCBpdCB3aXRoIHRoZSBjdXJyZW50IGVsZW1lbnQuXG4gICAgdGVtcG9yYXJ5VmFsdWUgPSBhcnJheVtjdXJyZW50SW5kZXhdO1xuICAgIGFycmF5W2N1cnJlbnRJbmRleF0gPSBhcnJheVtyYW5kb21JbmRleF07XG4gICAgYXJyYXlbcmFuZG9tSW5kZXhdID0gdGVtcG9yYXJ5VmFsdWU7XG4gIH1cblxuICByZXR1cm4gYXJyYXk7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBWYWx1ZXNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC44LCB5OjAuMn0sIHt4OjAuNzgsIHk6MC4xOH0sIHt4OjAuNzQsIHk6MC4yfSwge3g6MC43MiwgeTowLjIxfSwge3g6MC43MSwgeTowLjI0fSwge3g6MC43MywgeTowLjI2fSwge3g6MC43NiwgeTowLjIzfSwge3g6MC43OSwgeTowLjJ9KSxcbiAgbmV3IEFycmF5KHt4OjAuNiwgeTowLjN9LCB7eDowLjU1LCB5OjAuMjJ9LCB7eDowLjYyLCB5OjAuMjR9LCB7eDowLjY4LCB5OjAuMn0sIHt4OjAuNzEsIHk6MC4xOH0sIHt4OjAuNjgsIHk6MC4xNX0sIHt4OjAuNjQsIHk6MC4xOH0sIHt4OjAuNjMsIHk6MC4yMn0sIHt4OjAuNjIsIHk6MC4yNn0sIHt4OjAuNjEsIHk6MC4yOH0pLFxuICBuZXcgQXJyYXkoe3g6MC40OSwgeTowLjE0fSwge3g6MC41NCwgeTowLjE2fSwge3g6MC41NiwgeTowLjE0fSwge3g6MC41NCwgeTowLjE4fSwge3g6MC41NiwgeTowLjIyfSwge3g6MC41MiwgeTowLjE4fSwge3g6MC41LCB5OjAuMTR9LCB7eDowLjQ3LCB5OjAuMTJ9KSxcbiAgbmV3IEFycmF5KHt4OjAuNTUsIHk6MC4zMX0sIHt4OjAuNTgsIHk6MC4yOH0sIHt4OjAuNjQsIHk6MC4yNn0sIHt4OjAuNzIsIHk6MC4yMn0sIHt4OjAuOCwgeTowLjE4fSwge3g6MC43MywgeTowLjIyfSwge3g6MC42OCwgeTowLjI0fSwge3g6MC42MiwgeTowLjI4fSksXG4gIG5ldyBBcnJheSh7eDowLjc1LCB5OjAuMTZ9LCB7eDowLjcyLCB5OjAuMTh9LCB7eDowLjY4LCB5OjAuMjJ9LCB7eDowLjYyLCB5OjAuMjZ9LCB7eDowLjU1LCB5OjAuM30sIHt4OjAuNjIsIHk6MC4yNn0sIHt4OjAuNjgsIHk6MC4yMn0sIHt4OjAuNzIsIHk6MC4xOH0pLFxuICBuZXcgQXJyYXkoe3g6MC44MTI3Njk2Mjg5OTA1MDkxLCB5OjAuMTQ1ODE1MzU4MDY3Mjk5NH0se3g6MC43NjE4NjM2NzU1ODIzOTg2LCB5OjAuMTM3MTg3MjMwMzcxMDA5NX0se3g6MC42OTM3MDE0NjY3ODE3MDg0LCB5OjAuMTM0NTk4NzkyMDYyMTIyNTJ9LHt4OjAuNTg1ODQ5ODcwNTc4MDg0NiwgeTowLjE0MzIyNjkxOTc1ODQxMjQyfSx7eDowLjUxODU1MDQ3NDU0NzAyMzMsIHk6MC4xNjk5NzQxMTU2MTY5MTExNH0se3g6MC41MDk5MjIzNDY4NTA3MzMzLCB5OjAuMjA3OTM3ODc3NDgwNTg2N30se3g6MC41NTk5NjU0ODc0ODkyMTQ4LCB5OjAuMjMyMDk2NjM1MDMwMTk4NDV9LHt4OjAuNjM3NjE4NjM2NzU1ODI0LCB5OjAuMjE0ODQwMzc5NjM3NjE4NjV9LHt4OjAuNzA2NjQzNjU4MzI2MTQzMiwgeTowLjIxMzk3NzU2Njg2Nzk4OTYzfSx7eDowLjc5MDMzNjQ5Njk4MDE1NTMsIHk6MC4yMzU1NDc4ODYxMDg3MTQ0fSx7eDowLjgzOTUxNjgyNDg0OTAwNzgsIHk6MC4yMTEzODkxMjg1NTkxMDI2Nn0se3g6MC44Mzk1MTY4MjQ4NDkwMDc4LCB5OjAuMTkzMjcwMDYwMzk2ODkzODd9KSxcbiAgbmV3IEFycmF5KHt4OjAuNDkwOTQwNDY1OTE4ODk1NiwgeTowLjMxOTI0MDcyNDc2MjcyNjQ3fSx7eDowLjUwMzAxOTg0NDY5MzcwMTQsIHk6MC4yNzg2ODg1MjQ1OTAxNjM5fSx7eDowLjU3NTQ5NjExNzM0MjUzNjcsIHk6MC4xOTkzMDk3NDk3ODQyOTY4fSx7eDowLjYzODQ4MTQ0OTUyNTQ1MjksIHk6MC4xMzgwNTAwNDMxNDA2Mzg0OH0se3g6MC42NzgxNzA4MzY5MjgzODY1LCB5OjAuMDk2NjM1MDMwMTk4NDQ2OTR9LHt4OjAuNzE0NDA4OTczMjUyODA0MiwgeTowLjExMTMwMjg0NzI4MjEzOTc4fSx7eDowLjc0ODA1ODY3MTI2ODMzNDgsIHk6MC4xNzYwMTM4MDUwMDQzMTQwN30se3g6MC44MDUwMDQzMTQwNjM4NDgxLCB5OjAuMjY4MzM0NzcxMzU0NjE2MDN9LHt4OjAuNzkyMDYyMTIyNTE5NDEzMywgeTowLjMyMDEwMzUzNzUzMjM1NTV9LHt4OjAuNjU1NzM3NzA0OTE4MDMyNywgeTowLjMzMDQ1NzI5MDc2NzkwMzM3fSx7eDowLjU0NTI5NzY3MDQwNTUyMiwgeTowLjMxNzUxNTA5OTIyMzQ2ODV9KSxcbiAgbmV3IEFycmF5KHt4OjAuNjA3NDIwMTg5ODE4ODA5MywgeTowLjExMjE2NTY2MDA1MTc2ODc3fSx7eDowLjU4MjM5ODYxOTQ5OTU2ODYsIHk6MC4xNDc1NDA5ODM2MDY1NTczN30se3g6MC41NDYxNjA0ODMxNzUxNTEsIHk6MC4yMjAwMTcyNTYyNTUzOTI2fSx7eDowLjU1MzA2Mjk4NTMzMjE4MjksIHk6MC4zMDg4ODY5NzE1MjcxNzg2fSx7eDowLjY0MTkzMjcwMDYwMzk2ODksIHk6MC4zMDcxNjEzNDU5ODc5MjA2fSx7eDowLjY3MjEzMTE0NzU0MDk4MzYsIHk6MC4yMzcyNzM1MTE2NDc5NzI0fSx7eDowLjY5NjI4OTkwNTA5MDU5NTMsIHk6MC4xNDkyNjY2MDkxNDU4MTUzNX0se3g6MC43NTMyMzU1NDc4ODYxMDg3LCB5OjAuMTQ1ODE1MzU4MDY3Mjk5NH0se3g6MC43MzY4NDIxMDUyNjMxNTc5LCB5OjAuMjg4MTc5NDY1MDU2MDgyODN9LHt4OjAuODAzMjc4Njg4NTI0NTkwMiwgeTowLjMzMzA0NTcyOTA3Njc5MDN9LHt4OjAuODIyMjYwNTY5NDU2NDI4LCB5OjAuMjI2OTE5NzU4NDEyNDI0NX0se3g6MC43Mzk0MzA1NDM1NzIwNDQ5LCB5OjAuMTIwNzkzNzg3NzQ4MDU4Njd9LHt4OjAuNjc4MTcwODM2OTI4Mzg2NSwgeTowLjExODIwNTM0OTQzOTE3MTd9LHt4OjAuNjA1Njk0NTY0Mjc5NTUxNCwgeTowLjEzMTE0NzU0MDk4MzYwNjU2fSksXG4gIG5ldyBBcnJheSh7eDowLjUxNjgyNDg0OTAwNzc2NTMsIHk6MC4yNzAwNjAzOTY4OTM4NzR9LHt4OjAuNTEzMzczNTk3OTI5MjQ5MywgeTowLjE5MDY4MTYyMjA4ODAwNjl9LHt4OjAuNTYyNTUzOTI1Nzk4MTAxOCwgeTowLjEzMTE0NzU0MDk4MzYwNjU2fSx7eDowLjYyODk5MDUwOTA1OTUzNDEsIHk6MC4wOTgzNjA2NTU3Mzc3MDQ5Mn0se3g6MC43MDQwNTUyMjAwMTcyNTYzLCB5OjAuMDkyMzIwOTY2MzUwMzAxOTl9LHt4OjAuNzUxNTA5OTIyMzQ2ODUwOCwgeTowLjEzMTE0NzU0MDk4MzYwNjU2fSx7eDowLjc4OTQ3MzY4NDIxMDUyNjMsIHk6MC4xODcyMzAzNzEwMDk0OTA5NH0se3g6MC44NTMzMjE4MjkxNjMwNzE2LCB5OjAuMjU2MjU1MzkyNTc5ODEwMTd9KSxcbiAgbmV3IEFycmF5KHt4OjAuODI3NDM3NDQ2MDc0MjAxOSwgeTowLjEzODkxMjg1NTkxMDI2NzQ3fSx7eDowLjc2MTAwMDg2MjgxMjc2OTYsIHk6MC4xMDA5NDkwOTQwNDY1OTE4OX0se3g6MC43MDU3ODA4NDU1NTY1MTQyLCB5OjAuMDc2NzkwMzM2NDk2OTgwMTV9LHt4OjAuNjMwNzE2MTM0NTk4NzkyLCB5OjAuMDc1OTI3NTIzNzI3MzUxMTZ9LHt4OjAuNTQ4NzQ4OTIxNDg0MDM4LCB5OjAuMDkxNDU4MTUzNTgwNjczfSx7eDowLjQ5NjExNzM0MjUzNjY2OTU2LCB5OjAuMTMyMDEwMzUzNzUzMjM1NTV9LHt4OjAuNDgwNTg2NzEyNjgzMzQ3NzQsIHk6MC4xNzUxNTA5OTIyMzQ2ODUwOH0se3g6MC41MTA3ODUxNTk2MjAzNjI0LCB5OjAuMjE1NzAzMTkyNDA3MjQ3NjR9LHt4OjAuNTY2ODY3OTg5NjQ2MjQ2NywgeTowLjI1NjI1NTM5MjU3OTgxMDE3fSx7eDowLjY2MDA1MTc2ODc2NjE3NzgsIHk6MC4zMDM3MTAwOTQ5MDk0MDQ2NX0se3g6MC43MzUxMTY0Nzk3MjM4OTk5LCB5OjAuMzA0NTcyOTA3Njc5MDMzNjd9LHt4OjAuNzg0Mjk2ODA3NTkyNzUyMywgeTowLjMyMTgyOTE2MzA3MTYxMzQ3fSx7eDowLjg0MDM3OTYzNzYxODYzNjgsIHk6MC4zMTE0NzU0MDk4MzYwNjU2fSx7eDowLjgzNjA2NTU3Mzc3MDQ5MTgsIHk6MC4xOTU4NTg0OTg3MDU3ODA4NH0pLFxuICBuZXcgQXJyYXkoe3g6MC40Nzk3MjM4OTk5MTM3MTg3LCB5OjAuMzAxOTg0NDY5MzcwMTQ2Njd9LHt4OjAuNDkwOTQwNDY1OTE4ODk1NiwgeTowLjIwNzkzNzg3NzQ4MDU4Njd9LHt4OjAuNTMyMzU1NDc4ODYxMDg3MSwgeTowLjEyNDI0NTAzODgyNjU3NDYzfSx7eDowLjYzOTM0NDI2MjI5NTA4MiwgeTowLjA4ODg2OTcxNTI3MTc4NjAzfSx7eDowLjc3Mzk0MzA1NDM1NzIwNDUsIHk6MC4wOTkyMjM0Njg1MDczMzM5fSx7eDowLjg0NzI4MjEzOTc3NTY2ODcsIHk6MC4xNTQ0NDM0ODU3NjM1ODkzfSx7eDowLjg3MDU3ODA4NDU1NTY1MTQsIHk6MC4yNzA5MjMyMDk2NjM1MDMwM30se3g6MC44NDQ2OTM3MDE0NjY3ODE3LCB5OjAuMzI0NDE3NjAxMzgwNTAwNH0se3g6MC43MjgyMTM5Nzc1NjY4NjgsIHk6MC4zNDU5ODc5MjA2MjEyMjUyfSx7eDowLjUzMjM1NTQ3ODg2MTA4NzEsIHk6MC4zNDA4MTEwNDQwMDM0NTEyNX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyID0gbmV3IEFycmF5KFxuICAvL25ldyBBcnJheSh7eDowLjQ4MjI4ODEzNTU5MzIyMDM3LCB5OjAuMjAxNjk0OTE1MjU0MjM3M30se3g6MC40MjA0MjM3Mjg4MTM1NTk0LCB5OjAuMjA0MjM3Mjg4MTM1NTkzMjJ9LHt4OjAuMzc0NjYxMDE2OTQ5MTUyNTUsIHk6MC4yMDU5MzIyMDMzODk4MzA1fSx7eDowLjMwMjYyNzExODY0NDA2NzgsIHk6MC4yMDc2MjcxMTg2NDQwNjc4fSx7eDowLjI4OTkxNTI1NDIzNzI4ODE0LCB5OjAuMjE1MjU0MjM3Mjg4MTM1NTl9LHt4OjAuMjg0ODMwNTA4NDc0NTc2MywgeTowLjIyNzk2NjEwMTY5NDkxNTI0fSx7eDowLjI4MjI4ODEzNTU5MzIyMDM2LCB5OjAuMjUxNjk0OTE1MjU0MjM3MjZ9LHt4OjAuMjc0NjYxMDE2OTQ5MTUyNTcsIHk6MC4yNjY5NDkxNTI1NDIzNzI5fSx7eDowLjI1NjAxNjk0OTE1MjU0MjQsIHk6MC4yNjk0OTE1MjU0MjM3Mjg4NH0se3g6MC4wNzIxMTg2NDQwNjc3OTY2MywgeTowLjI3MjAzMzg5ODMwNTA4NDczfSx7eDowLjA1NTE2OTQ5MTUyNTQyMzczLCB5OjAuMjgwNTA4NDc0NTc2MjcxMn0se3g6MC4wNTAwODQ3NDU3NjI3MTE4NjYsIHk6MC4zMDMzODk4MzA1MDg0NzQ1N30se3g6MC4wNDc1NDIzNzI4ODEzNTU5NDYsIHk6MC40MjQ1NzYyNzExODY0NDA3fSx7eDowLjA0OTIzNzI4ODEzNTU5MzIzNSwgeTowLjQ5ODMwNTA4NDc0NTc2Mjc0fSx7eDowLjA1Njg2NDQwNjc3OTY2MTAyLCB5OjAuNTEzNTU5MzIyMDMzODk4M30se3g6MC4wNjk1NzYyNzExODY0NDA2OCwgeTowLjUxODY0NDA2Nzc5NjYxMDJ9LHt4OjAuMDkyNDU3NjI3MTE4NjQ0MDcsIHk6MC41MjExODY0NDA2Nzc5NjYyfSx7eDowLjEwOTQwNjc3OTY2MTAxNjk2LCB5OjAuNTI2MjcxMTg2NDQwNjc3OX0se3g6MC4xMTQ0OTE1MjU0MjM3Mjg4MywgeTowLjU0MjM3Mjg4MTM1NTkzMjJ9LHt4OjAuMTE0NDkxNTI1NDIzNzI4ODMsIHk6MC41NTkzMjIwMzM4OTgzMDV9KVxuICBuZXcgQXJyYXkoe3g6MC40OTM4OTgzMDUwODQ3NDU4LCB5OjAuMjE0NDA2Nzc5NjYxMDE2OTZ9LHt4OjAuMzgwMzM4OTgzMDUwODQ3NCwgeTowLjIxMTAxNjk0OTE1MjU0MjM4fSx7eDowLjM0ODEzNTU5MzIyMDMzOSwgeTowLjIxMjcxMTg2NDQwNjc3OTY3fSx7eDowLjMyMzU1OTMyMjAzMzg5ODMsIHk6MC4yMTYxMDE2OTQ5MTUyNTQyNH0se3g6MC4zMTQyMzcyODgxMzU1OTMyLCB5OjAuMjIwMzM4OTgzMDUwODQ3NDV9LHt4OjAuMzA4MzA1MDg0NzQ1NzYyNzQsIHk6MC4yMzA1MDg0NzQ1NzYyNzEyfSx7eDowLjMwNTc2MjcxMTg2NDQwNjgsIHk6MC4yNDgzMDUwODQ3NDU3NjI3fSx7eDowLjMwNDA2Nzc5NjYxMDE2OTQ3LCB5OjAuMjYyNzExODY0NDA2Nzc5N30se3g6MC4yOTgxMzU1OTMyMjAzMzksIHk6MC4yNzM3Mjg4MTM1NTkzMjIwNX0se3g6MC4yNzk0OTE1MjU0MjM3Mjg4LCB5OjAuMjgzMDUwODQ3NDU3NjI3MX0se3g6MC4wODYyNzExODY0NDA2Nzc5NCwgeTowLjI4MzA1MDg0NzQ1NzYyNzF9LHt4OjAuMDY3NjI3MTE4NjQ0MDY3NzksIHk6MC4yODgxMzU1OTMyMjAzMzl9LHt4OjAuMDU4MzA1MDg0NzQ1NzYyNzEsIHk6MC4yOTkxNTI1NDIzNzI4ODEzNn0se3g6MC4wNTQwNjc3OTY2MTAxNjk1LCB5OjAuNTE3Nzk2NjEwMTY5NDkxNX0se3g6MC4wNjE2OTQ5MTUyNTQyMzcyNiwgeTowLjUzNzI4ODEzNTU5MzIyMDN9LHt4OjAuMDc2MTAxNjk0OTE1MjU0MjYsIHk6MC41NDU3NjI3MTE4NjQ0MDY3fSx7eDowLjExMjU0MjM3Mjg4MTM1NTkzLCB5OjAuNTQ2NjEwMTY5NDkxNTI1NH0se3g6MC4xMjM1NTkzMjIwMzM4OTgzLCB5OjAuNTUzMzg5ODMwNTA4NDc0Nn0se3g6MC4xMjYxMDE2OTQ5MTUyNTQyNSwgeTowLjU3MTE4NjQ0MDY3Nzk2NjF9LHt4OjAuMTI1MjU0MjM3Mjg4MTM1NjIsIHk6MC41ODgxMzU1OTMyMjAzMzl9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMlMgPSBuZXcgQXJyYXkoXG4gIC8vbmV3IEFycmF5KHt4OjAuNDgyMjg4MTM1NTkzMjIwMzcsIHk6MC4yMDE2OTQ5MTUyNTQyMzczfSx7eDowLjQyMDQyMzcyODgxMzU1OTQsIHk6MC4yMDQyMzcyODgxMzU1OTMyMn0se3g6MC4zNzQ2NjEwMTY5NDkxNTI1NSwgeTowLjIwNTkzMjIwMzM4OTgzMDV9LHt4OjAuMzAyNjI3MTE4NjQ0MDY3OCwgeTowLjIwNzYyNzExODY0NDA2Nzh9LHt4OjAuMjg5OTE1MjU0MjM3Mjg4MTQsIHk6MC4yMTUyNTQyMzcyODgxMzU1OX0se3g6MC4yODQ4MzA1MDg0NzQ1NzYzLCB5OjAuMjI3OTY2MTAxNjk0OTE1MjR9LHt4OjAuMjgyMjg4MTM1NTkzMjIwMzYsIHk6MC4yNTE2OTQ5MTUyNTQyMzcyNn0se3g6MC4yNzQ2NjEwMTY5NDkxNTI1NywgeTowLjI2Njk0OTE1MjU0MjM3Mjl9LHt4OjAuMjU2MDE2OTQ5MTUyNTQyNCwgeTowLjI2OTQ5MTUyNTQyMzcyODg0fSx7eDowLjA3MjExODY0NDA2Nzc5NjYzLCB5OjAuMjcyMDMzODk4MzA1MDg0NzN9LHt4OjAuMDU1MTY5NDkxNTI1NDIzNzMsIHk6MC4yODA1MDg0NzQ1NzYyNzEyfSx7eDowLjA1MDA4NDc0NTc2MjcxMTg2NiwgeTowLjMwMzM4OTgzMDUwODQ3NDU3fSx7eDowLjA0NzU0MjM3Mjg4MTM1NTk0NiwgeTowLjQyNDU3NjI3MTE4NjQ0MDd9LHt4OjAuMDQ5MjM3Mjg4MTM1NTkzMjM1LCB5OjAuNDk4MzA1MDg0NzQ1NzYyNzR9LHt4OjAuMDU2ODY0NDA2Nzc5NjYxMDIsIHk6MC41MTM1NTkzMjIwMzM4OTgzfSx7eDowLjA2OTU3NjI3MTE4NjQ0MDY4LCB5OjAuNTE4NjQ0MDY3Nzk2NjEwMn0se3g6MC4wOTI0NTc2MjcxMTg2NDQwNywgeTowLjUyMTE4NjQ0MDY3Nzk2NjJ9LHt4OjAuMTA5NDA2Nzc5NjYxMDE2OTYsIHk6MC41MjYyNzExODY0NDA2Nzc5fSx7eDowLjExNDQ5MTUyNTQyMzcyODgzLCB5OjAuNTQyMzcyODgxMzU1OTMyMn0se3g6MC4xMTQ0OTE1MjU0MjM3Mjg4MywgeTowLjU1OTMyMjAzMzg5ODMwNX0pXG4gIG5ldyBBcnJheSh7eDowLjUwMTMxOTI2MTIxMzcyMDMsIHk6MC40ODA4NzA3MTI0MDEwNTU0fSx7eDowLjQ0NzIyOTU1MTQ1MTE4NzMsIHk6MC40NzgyMzIxODk5NzM2MTQ4fSx7eDowLjM4OTE4MjA1ODA0NzQ5MzQsIHk6MC40NzY5MTI5Mjg3NTk4OTQ0NH0se3g6MC4zMTY2MjI2OTEyOTI4NzYsIHk6MC40NzI5NTUxNDUxMTg3MzM1fSx7eDowLjI5NDE5NTI1MDY1OTYzMDYsIHk6MC40ODIxODk5NzM2MTQ3NzU3fSx7eDowLjI3ODM2NDExNjA5NDk4NjgsIHk6MC41MDcyNTU5MzY2NzU0NjE4fSx7eDowLjI3ODM2NDExNjA5NDk4NjgsIHk6MC41MjcwNDQ4NTQ4ODEyNjY1fSx7eDowLjI3MTc2NzgxMDAyNjM4NTIsIHk6MC41NDk0NzIyOTU1MTQ1MTE4fSx7eDowLjIxODk5NzM2MTQ3NzU3MjU3LCB5OjAuNTU2MDY4NjAxNTgzMTEzNH0se3g6MC4wNDIyMTYzNTg4MzkwNTAxMywgeTowLjU1MjExMDgxNzk0MTk1MjV9LHt4OjAuMDI1MDY1OTYzMDYwNjg2MDE1LCB5OjAuNTYyNjY0OTA3NjUxNzE1MX0se3g6MC4wMTMxOTI2MTIxMzcyMDMxNjcsIHk6MC41ODM3NzMwODcwNzEyNDAxfSx7eDowLjAxMDU1NDA4OTcwOTc2MjUzMywgeTowLjYzNzg2Mjc5NjgzMzc3MzF9LHt4OjAuMDE1ODMxMTM0NTY0NjQzOCwgeTowLjY4MDA3OTE1NTY3MjgyMzJ9LHt4OjAuMDM0MzAwNzkxNTU2NzI4MjMsIHk6MC42ODQwMzY5MzkzMTM5ODQxfSx7eDowLjE1OTYzMDYwNjg2MDE1ODMxLCB5OjAuNjg2Njc1NDYxNzQxNDI0OH0se3g6MC4xNzQxNDI0ODAyMTEwODE4LCB5OjAuNjk1OTEwMjkwMjM3NDY3fSx7eDowLjE4NjAxNTgzMTEzNDU2NDY2LCB5OjAuNzExNzQxNDI0ODAyMTEwOH0se3g6MC4xODk5NzM2MTQ3NzU3MjU1OCwgeTowLjczMTUzMDM0MzAwNzkxNTV9LHt4OjAuMjA0NDg1NDg4MTI2NjQ5MDcsIHk6MC43NDQ3MjI5NTUxNDUxMTg4fSx7eDowLjczNzQ2NzAxODQ2OTY1NywgeTowLjc0NDcyMjk1NTE0NTExODh9LHt4OjAuOTQ1OTEwMjkwMjM3NDY3LCB5OjAuNzV9LHt4OjEuMTE2MDk0OTg2ODA3Mzg4LCB5OjAuNzQ2MDQyMjE2MzU4ODM5fSx7eDoxLjE3OTQxOTUyNTA2NTk2MzEsIHk6MC43MzU0ODgxMjY2NDkwNzY1fSx7eDoxLjE4OTk3MzYxNDc3NTcyNTYsIHk6MC43MTcwMTg0Njk2NTY5OTIxfSx7eDoxLjE4OTk3MzYxNDc3NTcyNTYsIHk6MC42NzM0ODI4NDk2MDQyMjE3fSx7eDoxLjE4NzMzNTA5MjM0ODI4NSwgeTowLjYyMDcxMjQwMTA1NTQwODl9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMTEsIHk6MC42Mn0sIHt4OjAuMTIsIHk6MC42OH0sIHt4OjAuMTMsIHk6MC43Mn0sIHt4OjAuMTQsIHk6MC42OH0sIHt4OjAuMTMsIHk6MC42Mn0sIHt4OjAuMTEsIHk6MC42fSksXG4gIG5ldyBBcnJheSh7eDowLjA4LCB5OjAuNn0sIHt4OjAuMDksIHk6MC41OH0sIHt4OjAuMSwgeTowLjUyfSwge3g6MC4xMiwgeTowLjU4fSwge3g6MC4xMywgeTowLjY0fSwge3g6MC4wOSwgeTowLjYyfSksXG4gIG5ldyBBcnJheSh7eDowLjEzLCB5OjAuNjh9LCB7eDowLjEyLCB5OjAuNjJ9LCB7eDowLjExLCB5OjAuNTh9LCB7eDowLjEyLCB5OjAuNTd9LCB7eDowLjEzLCB5OjAuNTh9LCB7eDowLjExLCB5OjAuNjJ9KSxcbiAgbmV3IEFycmF5KHt4OjAuMTI3OTY2MTAxNjk0OTE1MjYsIHk6MC42MTk0OTE1MjU0MjM3Mjg4fSx7eDowLjExOTQ5MTUyNTQyMzcyODgyLCB5OjAuNjMyMjAzMzg5ODMwNTA4NX0se3g6MC4xMTAxNjk0OTE1MjU0MjM3MywgeTowLjY1NDIzNzI4ODEzNTU5MzJ9LHt4OjAuMSwgeTowLjY3OTY2MTAxNjk0OTE1MjZ9LHt4OjAuMTA2Nzc5NjYxMDE2OTQ5MTUsIHk6MC43MTAxNjk0OTE1MjU0MjM3fSx7eDowLjEzNTU5MzIyMDMzODk4MzA1LCB5OjAuNzExMDE2OTQ5MTUyNTQyM30se3g6MC4xNDU3NjI3MTE4NjQ0MDY3OSwgeTowLjY4MTM1NTkzMjIwMzM4OTl9LHt4OjAuMTQ2NjEwMTY5NDkxNTI1NDIsIHk6MC42NDU3NjI3MTE4NjQ0MDY4fSx7eDowLjE0MjM3Mjg4MTM1NTkzMjIsIHk6MC41ODIyMDMzODk4MzA1MDg1fSx7eDowLjEzMzg5ODMwNTA4NDc0NTc2LCB5OjAuNTU5MzIyMDMzODk4MzA1fSx7eDowLjEwNzYyNzExODY0NDA2Nzc5LCB5OjAuNTY2OTQ5MTUyNTQyMzcyOX0se3g6MC4xMDkzMjIwMzM4OTgzMDUwOCwgeTowLjU5OTE1MjU0MjM3Mjg4MTR9KSxcbiAgbmV3IEFycmF5KHt4OjAuMTQ0OTE1MjU0MjM3Mjg4MTMsIHk6MC41Nzk2NjEwMTY5NDkxNTI1fSx7eDowLjE0OTE1MjU0MjM3Mjg4MTM2LCB5OjAuNTYwMTY5NDkxNTI1NDIzN30se3g6MC4xMjc5NjYxMDE2OTQ5MTUyNiwgeTowLjU1fSx7eDowLjExMjcxMTg2NDQwNjc3OTY2LCB5OjAuNTU2Nzc5NjYxMDE2OTQ5Mn0se3g6MC4xMzY0NDA2Nzc5NjYxMDE2OCwgeTowLjU5OTE1MjU0MjM3Mjg4MTR9LHt4OjAuMTE2MTAxNjk0OTE1MjU0MjQsIHk6MC42MjQ1NzYyNzExODY0NDA3fSx7eDowLjEwMzM4OTgzMDUwODQ3NDU3LCB5OjAuNjYzNTU5MzIyMDMzODk4M30se3g6MC4xMjAzMzg5ODMwNTA4NDc0NiwgeTowLjY3NTQyMzcyODgxMzU1OTN9LHt4OjAuMTQ1NzYyNzExODY0NDA2NzksIHk6MC42OTQ5MTUyNTQyMzcyODgyfSx7eDowLjEyNjI3MTE4NjQ0MDY3Nzk3LCB5OjAuNzE1MjU0MjM3Mjg4MTM1Nn0se3g6MC4xMDc2MjcxMTg2NDQwNjc3OSwgeTowLjY4ODEzNTU5MzIyMDMzOX0se3g6MC4xMjQ1NzYyNzExODY0NDA2OCwgeTowLjYyODgxMzU1OTMyMjAzMzl9LHt4OjAuMTM4MTM1NTkzMjIwMzM4OTcsIHk6MC41ODY0NDA2Nzc5NjYxMDE3fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTNTID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MS4xNjg0MjEwNTI2MzE1NzksIHk6MC42MjY5NzM2ODQyMTA1MjYzfSx7eDoxLjIsIHk6MC42MjY5NzM2ODQyMTA1MjYzfSx7eDoxLjIyNSwgeTowLjYxMjV9LHt4OjEuMjAyNjMxNTc4OTQ3MzY4NSwgeTowLjYwNTkyMTA1MjYzMTU3ODl9LHt4OjEuMTcxMDUyNjMxNTc4OTQ3MywgeTowLjYwNDYwNTI2MzE1Nzg5NDh9LHt4OjEuMTU5MjEwNTI2MzE1Nzg5NSwgeTowLjU5MDEzMTU3ODk0NzM2ODV9LHt4OjEuMjA1MjYzMTU3ODk0NzM2OCwgeTowLjU4ODgxNTc4OTQ3MzY4NDJ9LHt4OjEuMjIzNjg0MjEwNTI2MzE1NywgeTowLjU3NDM0MjEwNTI2MzE1Nzl9LHt4OjEuMjE5NzM2ODQyMTA1MjYzMiwgeTowLjU2MjV9LHt4OjEuMTk0NzM2ODQyMTA1MjYzLCB5OjAuNTU0NjA1MjYzMTU3ODk0N30se3g6MS4xNzEwNTI2MzE1Nzg5NDczLCB5OjAuNTYxMTg0MjEwNTI2MzE1OH0se3g6MS4xNjk3MzY4NDIxMDUyNjMyLCB5OjAuNTc5NjA1MjYzMTU3ODk0N30se3g6MS4yMjIzNjg0MjEwNTI2MzE1LCB5OjAuNTg4ODE1Nzg5NDczNjg0Mn0se3g6MS4yMTU3ODk0NzM2ODQyMTA1LCB5OjAuNjA5ODY4NDIxMDUyNjMxNn0se3g6MS4xOTIxMDUyNjMxNTc4OTQ4LCB5OjAuNjIwMzk0NzM2ODQyMTA1Mn0pLFxuICBuZXcgQXJyYXkoe3g6MS4yMTQ0NzM2ODQyMTA1MjY0LCB5OjAuNjE3NzYzMTU3ODk0NzM2OH0se3g6MS4yMjc2MzE1Nzg5NDczNjg0LCB5OjAuNTY5MDc4OTQ3MzY4NDIxfSx7eDoxLjIwNTI2MzE1Nzg5NDczNjgsIHk6MC41NTk4Njg0MjEwNTI2MzE2fSx7eDoxLjE3MTA1MjYzMTU3ODk0NzMsIHk6MC41NzE3MTA1MjYzMTU3ODk0fSx7eDoxLjE1NTI2MzE1Nzg5NDczNjgsIHk6MC42MDA2NTc4OTQ3MzY4NDIxfSx7eDoxLjE2NzEwNTI2MzE1Nzg5NDYsIHk6MC42MjU2NTc4OTQ3MzY4NDIxfSx7eDoxLjIsIHk6MC42MjMwMjYzMTU3ODk0NzM3fSx7eDoxLjIxNzEwNTI2MzE1Nzg5NDcsIHk6MC41OTkzNDIxMDUyNjMxNTc5fSx7eDoxLjIwNzg5NDczNjg0MjEwNTQsIHk6MC41ODIyMzY4NDIxMDUyNjMyfSx7eDoxLjE3ODk0NzM2ODQyMTA1MjUsIHk6MC41ODQ4Njg0MjEwNTI2MzE2fSx7eDoxLjE3MTA1MjYzMTU3ODk0NzMsIHk6MC42MDg1NTI2MzE1Nzg5NDczfSx7eDoxLjE5MDc4OTQ3MzY4NDIxMDYsIHk6MC42MTY0NDczNjg0MjEwNTI2fSx7eDoxLjIyMTA1MjYzMTU3ODk0NzQsIHk6MC42MTY0NDczNjg0MjEwNTI2fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTQgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjEyNjEwMTY5NDkxNTI1NDI1LCB5OjAuNzUzMzg5ODMwNTA4NDc0NX0se3g6MC4xMjk0OTE1MjU0MjM3Mjg4MywgeTowLjc3NDU3NjI3MTE4NjQ0MDd9LHt4OjAuMTMwMzM4OTgzMDUwODQ3NDYsIHk6MC44MDI1NDIzNzI4ODEzNTU5fSx7eDowLjEyOTQ5MTUyNTQyMzcyODgzLCB5OjAuODMyMjAzMzg5ODMwNTA4NX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U0UyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjEuMTkzMjY2ODMyOTE3NzA1NiwgeTowLjU0NjEzNDY2MzM0MTY0NTh9LHt4OjEuMTkwNzczMDY3MzMxNjcwOCwgeTowLjUyNzQzMTQyMTQ0NjM4NH0se3g6MS4xOTA3NzMwNjczMzE2NzA4LCB5OjAuNTAzNzQwNjQ4Mzc5MDUyNH0se3g6MS4xOTQ1MTM3MTU3MTA3MjMzLCB5OjAuNDg2Mjg0Mjg5Mjc2ODA4fSx7eDoxLjE5MzI2NjgzMjkxNzcwNTYsIHk6MC40NzI1Njg1Nzg1NTM2MTU5NX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U1ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMSwgeTowLjgyfSwge3g6MC4xMiwgeTowLjg4fSwge3g6MC4xMywgeTowLjkyfSwge3g6MC4xNCwgeTowLjg4fSwge3g6MC4xMywgeTowLjgyfSwge3g6MC4xMSwgeTowLjh9KSxcbiAgbmV3IEFycmF5KHt4OjAuMDgsIHk6MC44fSwge3g6MC4wOSwgeTowLjc4fSwge3g6MC4xLCB5OjAuODJ9LCB7eDowLjEyLCB5OjAuNzh9LCB7eDowLjEzLCB5OjAuODR9LCB7eDowLjA5LCB5OjAuODJ9KSxcbiAgbmV3IEFycmF5KHt4OjAuMTMsIHk6MC44OH0sIHt4OjAuMTIsIHk6MC44Mn0sIHt4OjAuMTEsIHk6MC43OH0sIHt4OjAuMTIsIHk6MC43N30sIHt4OjAuMTMsIHk6MC43OH0sIHt4OjAuMTEsIHk6MC44Mn0pLFxuICBuZXcgQXJyYXkoe3g6MC4xNDc0NTc2MjcxMTg2NDQwNywgeTowLjc2OTQ5MTUyNTQyMzcyODh9LHt4OjAuMTE2OTQ5MTUyNTQyMzcyODgsIHk6MC43NzI4ODEzNTU5MzIyMDM0fSx7eDowLjA5NTc2MjcxMTg2NDQwNjc4LCB5OjAuNzgxMzU1OTMyMjAzMzg5OH0se3g6MC4wODQ3NDU3NjI3MTE4NjQ0LCB5OjAuODA2Nzc5NjYxMDE2OTQ5Mn0se3g6MC4xLCB5OjAuODM3Mjg4MTM1NTkzMjIwNH0se3g6MC4xMzM4OTgzMDUwODQ3NDU3NiwgeTowLjg1MzM4OTgzMDUwODQ3NDZ9LHt4OjAuMTUxNjk0OTE1MjU0MjM3MjgsIHk6MC44MzgxMzU1OTMyMjAzMzl9LHt4OjAuMTYzNTU5MzIyMDMzODk4MywgeTowLjgwMjU0MjM3Mjg4MTM1NTl9KSxcbiAgbmV3IEFycmF5KHt4OjAuMTE1MjU0MjM3Mjg4MTM1NiwgeTowLjg1MDg0NzQ1NzYyNzExODd9LHt4OjAuMDkwNjc3OTY2MTAxNjk0OTIsIHk6MC44MjAzMzg5ODMwNTA4NDc0fSx7eDowLjA5ODMwNTA4NDc0NTc2MjcyLCB5OjAuNzk1NzYyNzExODY0NDA2N30se3g6MC4xMTI3MTE4NjQ0MDY3Nzk2NiwgeTowLjc3NTQyMzcyODgxMzU1OTR9LHt4OjAuMTM4OTgzMDUwODQ3NDU3NjMsIHk6MC43Nzk2NjEwMTY5NDkxNTI2fSx7eDowLjEzNTU5MzIyMDMzODk4MzA1LCB5OjAuODAzMzg5ODMwNTA4NDc0Nn0se3g6MC4xNDc0NTc2MjcxMTg2NDQwNywgeTowLjgyNzExODY0NDA2Nzc5NjZ9LHt4OjAuMTI2MjcxMTg2NDQwNjc3OTcsIHk6MC44NDkxNTI1NDIzNzI4ODE0fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTVTID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MS4xNzcwNTczNTY2MDg0Nzg4LCB5OjAuNDczODE1NDYxMzQ2NjMzNDR9LHt4OjEuMTY5NTc2MDU5ODUwMzc0MiwgeTowLjQ2MTM0NjYzMzQxNjQ1ODl9LHt4OjEuMTc0NTYzNTkxMDIyNDQ0LCB5OjAuNDI4OTI3NjgwNzk4MDA1fSx7eDoxLjIwMDc0ODEyOTY3NTgxMDUsIHk6MC40MTI3MTgyMDQ0ODg3NzgwNX0se3g6MS4yMDk0NzYzMDkyMjY5MzI3LCB5OjAuMzkwMjc0MzE0MjE0NDYzODV9LHt4OjEuMjA5NDc2MzA5MjI2OTMyNywgeTowLjM2OTA3NzMwNjczMzE2NzF9LHt4OjEuMjAzMjQxODk1MjYxODQ1MywgeTowLjM1MTYyMDk0NzYzMDkyMjd9LHt4OjEuMTk1NzYwNTk4NTAzNzQwNywgeTowLjMzNTQxMTQ3MTMyMTY5NTc0fSx7eDoxLjE4NDUzODY1MzM2NjU4MzYsIHk6MC4zMzA0MjM5NDAxNDk2MjU5NX0se3g6MS4xNzMzMTY3MDgyMjk0MjY1LCB5OjAuMzQ5MTI3MTgyMDQ0ODg3OH0se3g6MS4xODA3OTgwMDQ5ODc1MzEsIHk6MC4zNjc4MzA0MjM5NDAxNDk2NH0se3g6MS4xOTU3NjA1OTg1MDM3NDA3LCB5OjAuNDAxNDk2MjU5MzUxNjIwOX0se3g6MS4xODQ1Mzg2NTMzNjY1ODM2LCB5OjAuNDIxNDQ2Mzg0MDM5OTAwMjZ9LHt4OjEuMTk1NzYwNTk4NTAzNzQwNywgeTowLjQ2MDA5OTc1MDYyMzQ0MTR9LHt4OjEuMTgwNzk4MDA0OTg3NTMxLCB5OjAuNDczODE1NDYxMzQ2NjMzNDR9KSxcbiAgbmV3IEFycmF5KHt4OjEuMjA5NDc2MzA5MjI2OTMyNywgeTowLjMwOTIyNjkzMjY2ODMyOTJ9LHt4OjEuMTg0NTM4NjUzMzY2NTgzNiwgeTowLjMxNDIxNDQ2Mzg0MDM5OX0se3g6MS4xNzMzMTY3MDgyMjk0MjY1LCB5OjAuMzM2NjU4MzU0MTE0NzEzMjN9LHt4OjEuMTg0NTM4NjUzMzY2NTgzNiwgeTowLjM1Nzg1NTM2MTU5NjAxfSx7eDoxLjE5MzI2NjgzMjkxNzcwNTYsIHk6MC4zNzc4MDU0ODYyODQyODkzfSx7eDoxLjE3OTU1MTEyMjE5NDUxMzYsIHk6MC40MDUyMzY5MDc3MzA2NzMzM30se3g6MS4xNjQ1ODg1Mjg2NzgzMDQyLCB5OjAuNDMyNjY4MzI5MTc3MDU3MzN9LHt4OjEuMTY0NTg4NTI4Njc4MzA0MiwgeTowLjQ1ODg1Mjg2NzgzMDQyMzk1fSx7eDoxLjE3ODMwNDIzOTQwMTQ5NjIsIHk6MC40ODEyOTY3NTgxMDQ3MzgxNX0se3g6MS4xOTgyNTQzNjQwODk3NzU2LCB5OjAuNDgxMjk2NzU4MTA0NzM4MTV9LHt4OjEuMjA1NzM1NjYwODQ3ODgwMiwgeTowLjQ1NzYwNTk4NTAzNzQwNjQ2fSx7eDoxLjE5NTc2MDU5ODUwMzc0MDcsIHk6MC40MTM5NjUwODcyODE3OTU1fSx7eDoxLjIwMzI0MTg5NTI2MTg0NTMsIHk6MC4zNjE1OTYwMDk5NzUwNjIzNn0se3g6MS4yMDgyMjk0MjY0MzM5MTUzLCB5OjAuMzIyOTQyNjQzMzkxNTIxMn0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMjk0OTE1MjU0MjM3Mjg4MywgeTowLjgzOTgzMDUwODQ3NDU3NjN9LHt4OjAuMTI5NDkxNTI1NDIzNzI4ODMsIHk6MC44ODcyODgxMzU1OTMyMjAzfSx7eDowLjEzMDMzODk4MzA1MDg0NzQ2LCB5OjAuOTMzMDUwODQ3NDU3NjI3MX0se3g6MC4xMjk0OTE1MjU0MjM3Mjg4MywgeToxLjA1fSx7eDowLjEzNDU3NjI3MTE4NjQ0MDY3LCB5OjEuMDYyNzExODY0NDA2Nzc5N30se3g6MC4xNDY0NDA2Nzc5NjYxMDE3MiwgeToxLjA3MjAzMzg5ODMwNTA4NDh9LHt4OjAuMjc0NDA2Nzc5NjYxMDE2OTUsIHk6MS4wNjg2NDQwNjc3OTY2MTAzfSx7eDowLjI5MTM1NTkzMjIwMzM4OTg0LCB5OjEuMDc4ODEzNTU5MzIyMDMzOH0se3g6MC4zMDIzNzI4ODEzNTU5MzIyLCB5OjEuMDk5MTUyNTQyMzcyODgxNH0se3g6MC4zMDU3NjI3MTE4NjQ0MDY4LCB5OjEuMTI2MjcxMTg2NDQwNjc4fSx7eDowLjMyMDE2OTQ5MTUyNTQyMzcsIHk6MS4xNDIzNzI4ODEzNTU5MzIyfSx7eDowLjQ0MjIwMzM4OTgzMDUwODUsIHk6MS4xNDE1MjU0MjM3Mjg4MTM1fSx7eDowLjQ2MTY5NDkxNTI1NDIzNzMsIHk6MS4xNTMzODk4MzA1MDg0NzQ3fSx7eDowLjQ2ODQ3NDU3NjI3MTE4NjQ0LCB5OjEuMTcwMzM4OTgzMDUwODQ3NX0se3g6MC40Njc2MjcxMTg2NDQwNjc3NSwgeToxLjI2ODY0NDA2Nzc5NjYxMDJ9LHt4OjAuNDcxMDE2OTQ5MTUyNTQyNCwgeToxLjMwMjU0MjM3Mjg4MTM1NTl9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDoxLjE4NTc4NTUzNjE1OTYwMSwgeTowLjI2MTg0NTM4NjUzMzY2NTg1fSx7eDoxLjE4MjA0NDg4Nzc4MDU0ODcsIHk6MC4yNDE4OTUyNjE4NDUzODY1NH0se3g6MS4xNjQ1ODg1Mjg2NzgzMDQyLCB5OjAuMjMxOTIwMTk5NTAxMjQ2ODd9LHt4OjEuMTQ4Mzc5MDUyMzY5MDc3MywgeTowLjIyOTQyNjQzMzkxNTIxMTk3fSx7eDoxLjEyNDY4ODI3OTMwMTc0NTYsIHk6MC4yMzMxNjcwODIyOTQyNjQzM30se3g6MS4xMTcyMDY5ODI1NDM2NDA4LCB5OjAuMjIxOTQ1MTM3MTU3MTA3MjN9LHt4OjEuMTEzNDY2MzM0MTY0NTg4NSwgeTowLjE4ODI3OTMwMTc0NTYzNTl9LHt4OjEuMTEyMjE5NDUxMzcxNTcxLCB5OjAuMTQ5NjI1OTM1MTYyMDk0Nzd9LHt4OjEuMTEzNDY2MzM0MTY0NTg4NSwgeTowLjA5NDc2MzA5MjI2OTMyNjY4fSx7eDoxLjEyMDk0NzYzMDkyMjY5MzMsIHk6MC4wNzg1NTM2MTU5NjAwOTk3Nn0se3g6MS4xNDMzOTE1MjExOTcwMDc0LCB5OjAuMDY5ODI1NDM2NDA4OTc3NTV9LHt4OjEuMjMzMTY3MDgyMjk0MjY0NCwgeTowLjA2NjA4NDc4ODAyOTkyNTE5fSx7eDoxLjQ4NjI4NDI4OTI3NjgwOCwgeTowLjA2NjA4NDc4ODAyOTkyNTE5fSx7eDoxLjUwNzQ4MTI5Njc1ODEwNDgsIHk6MC4wNzEwNzIzMTkyMDE5OTUwMX0se3g6MS41MTc0NTYzNTkxMDIyNDQzLCB5OjAuMDgxMDQ3MzgxNTQ2MTM0Njd9LHt4OjEuNTE5OTUwMTI0Njg4Mjc5NCwgeTowLjEwMjI0NDM4OTAyNzQzMTQyfSx7eDoxLjUzMTE3MjA2OTgyNTQzNjMsIHk6MC4xMTQ3MTMyMTY5NTc2MDU5OX0se3g6MS41Nzg1NTM2MTU5NjAwOTk3LCB5OjAuMTIyMTk0NTEzNzE1NzEwNzJ9LHt4OjEuODgxNTQ2MTM0NjYzMzQxOCwgeTowLjEyMDk0NzYzMDkyMjY5MzI3fSx7eDoyLjEzMzQxNjQ1ODg1Mjg2NzcsIHk6MC4xMTg0NTM4NjUzMzY2NTgzNn0se3g6Mi4xNjMzNDE2NDU4ODUyODcsIHk6MC4xMjU5MzUxNjIwOTQ3NjMxfSx7eDoyLjE3MjA2OTgyNTQzNjQwOSwgeTowLjE0MzM5MTUyMTE5NzAwNzV9LHt4OjIuMTcyMDY5ODI1NDM2NDA5LCB5OjAuMTU3MTA3MjMxOTIwMTk5NX0se3g6Mi4xOTk1MDEyNDY4ODI3OTMsIHk6MC4xNzcwNTczNTY2MDg0Nzg4fSx7eDoyLjMyNTQzNjQwODk3NzU1NiwgeTowLjE3NTgxMDQ3MzgxNTQ2MTM2fSx7eDoyLjM1MTYyMDk0NzYzMDkyMjcsIHk6MC4xODU3ODU1MzYxNTk2MDF9LHt4OjIuMzYwMzQ5MTI3MTgyMDQ0NywgeTowLjIwMTk5NTAxMjQ2ODgyNzkyfSx7eDoyLjM2MTU5NjAwOTk3NTA2MiwgeTowLjIzMzE2NzA4MjI5NDI2NDMzfSx7eDoyLjM3NjU1ODYwMzQ5MTI3MiwgeTowLjI1MzExNzIwNjk4MjU0MzY0fSx7eDoyLjQwMzk5MDAyNDkzNzY1NiwgeTowLjI1ODEwNDczODE1NDYxMzV9LHt4OjIuNTA0OTg3NTMxMTcyMDY5NywgeTowLjI1MzExNzIwNjk4MjU0MzY0fSx7eDoyLjUyNzQzMTQyMTQ0NjM4NCwgeTowLjI2NTU4NjAzNDkxMjcxODJ9LHt4OjIuNTM4NjUzMzY2NTgzNTQxMywgeTowLjI4MDU0ODYyODQyODkyNzd9LHt4OjIuNTM5OTAwMjQ5Mzc2NTU5LCB5OjAuMzYxNTk2MDA5OTc1MDYyMzZ9LHt4OjIuNTM5OTAwMjQ5Mzc2NTU5LCB5OjAuNDgyNTQzNjQwODk3NzU1Nn0se3g6Mi41NTIzNjkwNzczMDY3MzMsIHk6MC41NTYxMDk3MjU2ODU3ODU1fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTcgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjQxMDE2OTQ5MTUyNTQyMzcsIHk6MS4xODgxMzU1OTMyMjAzMzl9LHt4OjAuMzgyMjAzMzg5ODMwNTA4NSwgeToxLjIxMDE2OTQ5MTUyNTQyMzd9LHt4OjAuMzc1NDIzNzI4ODEzNTU5MzQsIHk6MS4yNTUwODQ3NDU3NjI3MTJ9LHt4OjAuMzkxNTI1NDIzNzI4ODEzNTUsIHk6MS4yOTIzNzI4ODEzNTU5MzIzfSx7eDowLjQzNzI4ODEzNTU5MzIyMDMzLCB5OjEuMzE1MjU0MjM3Mjg4MTM1NX0se3g6MC40NzQ1NzYyNzExODY0NDA3LCB5OjEuMzA2Nzc5NjYxMDE2OTQ5fSx7eDowLjUsIHk6MS4yNzYyNzExODY0NDA2Nzh9LHt4OjAuNTA1OTMyMjAzMzg5ODMwNSwgeToxLjIzMzA1MDg0NzQ1NzYyNzJ9LHt4OjAuNDY3Nzk2NjEwMTY5NDkxNTMsIHk6MS4xODM4OTgzMDUwODQ3NDU4fSksXG4gIG5ldyBBcnJheSh7eDowLjQ2MDE2OTQ5MTUyNTQyMzc1LCB5OjEuMjM3Mjg4MTM1NTkzMjIwNH0se3g6MC40NzYyNzExODY0NDA2Nzc5NSwgeToxLjI1ODQ3NDU3NjI3MTE4NjR9LHt4OjAuNDcyODgxMzU1OTMyMjAzNCwgeToxLjMwMDg0NzQ1NzYyNzExODd9LHt4OjAuNDIwMzM4OTgzMDUwODQ3NDQsIHk6MS4zMDg0NzQ1NzYyNzExODY1fSx7eDowLjM4ODEzNTU5MzIyMDMzODk3LCB5OjEuMjY4NjQ0MDY3Nzk2NjEwMn0se3g6MC40MDQyMzcyODgxMzU1OTMyMywgeToxLjIzODEzNTU5MzIyMDMzOX0se3g6MC40NTA4NDc0NTc2MjcxMTg2NCwgeToxLjI2MjcxMTg2NDQwNjc3OTZ9LHt4OjAuNDk0OTE1MjU0MjM3Mjg4MTYsIHk6MS4yNDQ5MTUyNTQyMzcyODh9LHt4OjAuNTA4NDc0NTc2MjcxMTg2NCwgeToxLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuNDc5NjYxMDE2OTQ5MTUyNTMsIHk6MS4xODEzNTU5MzIyMDMzODk3fSksXG4gIG5ldyBBcnJheSh7eDowLjQxMjcxMTg2NDQwNjc3OTY1LCB5OjEuMTkyMzcyODgxMzU1OTMyMn0se3g6MC40NzI4ODEzNTU5MzIyMDM0LCB5OjEuMn0se3g6MC41MDU5MzIyMDMzODk4MzA1LCB5OjEuMjQ4MzA1MDg0NzQ1NzYyNn0se3g6MC41MDMzODk4MzA1MDg0NzQ1LCB5OjEuMjk0OTE1MjU0MjM3Mjg4MX0se3g6MC40MzcyODgxMzU1OTMyMjAzMywgeToxLjN9LHt4OjAuMzg1NTkzMjIwMzM4OTgzMSwgeToxLjI4NDc0NTc2MjcxMTg2NDR9LHt4OjAuMzc2MjcxMTg2NDQwNjc4LCB5OjEuMjQyMzcyODgxMzU1OTMyM30se3g6MC40MjM3Mjg4MTM1NTkzMjIsIHk6MS4yNDc0NTc2MjcxMTg2NDQyfSx7eDowLjQ2NTI1NDIzNzI4ODEzNTYsIHk6MS4yMTk0OTE1MjU0MjM3Mjg5fSx7eDowLjQxNjk0OTE1MjU0MjM3Mjg2LCB5OjEuMTg3Mjg4MTM1NTkzMjIwM30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3UyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjIuNTMwNzc5NzUzNzYxOTcsIHk6MC41MzAwOTU3NTkyMzM5MjYyfSx7eDoyLjUwNjE1NTk1MDc1MjM5NCwgeTowLjU0OTI0NzYwNjAxOTE1MTl9LHt4OjIuNDg4MzcyMDkzMDIzMjU2LCB5OjAuNTg0ODE1MzIxNDc3NDI4Mn0se3g6Mi40ODgzNzIwOTMwMjMyNTYsIHk6MC42MjAzODMwMzY5MzU3MDQ1fSx7eDoyLjUwNzUyMzkzOTgwODQ4MTcsIHk6MC42NDUwMDY4Mzk5NDUyODA0fSx7eDoyLjU0NTgyNzYzMzM3ODkzMywgeTowLjY1MDQ3ODc5NjE2OTYzMDd9LHt4OjIuNTcxODE5NDI1NDQ0NTk2NSwgeTowLjYzODE2Njg5NDY2NDg0Mjd9LHt4OjIuNTg0MTMxMzI2OTQ5Mzg0LCB5OjAuNTk3MTI3MjIyOTgyMjE2MX0se3g6Mi41Nzg2NTkzNzA3MjUwMzQzLCB5OjAuNTUzMzUxNTczMTg3NDE0NX0se3g6Mi41NDk5MzE2MDA1NDcxOTU1LCB5OjAuNTQ2NTExNjI3OTA2OTc2N30se3g6Mi41MTk4MzU4NDEzMTMyNjkzLCB5OjAuNTU4ODIzNTI5NDExNzY0N30se3g6Mi41NDU4Mjc2MzMzNzg5MzMsIHk6MC41Nzc5NzUzNzYxOTY5OTA1fSx7eDoyLjU1NDAzNTU2NzcxNTQ1ODUsIHk6MC42MjU4NTQ5OTMxNjAwNTQ4fSx7eDoyLjUyMjU3MTgxOTQyNTQ0NDUsIHk6MC42Mzk1MzQ4ODM3MjA5MzAzfSx7eDoyLjQ4MjkwMDEzNjc5ODkwNTQsIHk6MC42MjAzODMwMzY5MzU3MDQ1fSx7eDoyLjQ5MTEwODA3MTEzNTQzMSwgeTowLjU5NTc1OTIzMzkyNjEyODZ9LHt4OjIuNTYwODc1NTEyOTk1ODk2LCB5OjAuNTk1NzU5MjMzOTI2MTI4Nn0se3g6Mi41NjA4NzU1MTI5OTU4OTYsIHk6MC41NjQyOTU0ODU2MzYxMTQ5fSx7eDoyLjUzNjI1MTcwOTk4NjMyLCB5OjAuNTY0Mjk1NDg1NjM2MTE0OX0se3g6Mi40OTUyMTIwMzgzMDM2OTM1LCB5OjAuNTYwMTkxNTE4NDY3ODUyM30se3g6Mi41MTk4MzU4NDEzMTMyNjkzLCB5OjAuNTMyODMxNzM3MzQ2MTAxMn0se3g6Mi41NzE4MTk0MjU0NDQ1OTY1LCB5OjAuNTU0NzE5NTYyMjQzNTAyfSx7eDoyLjU3MTgxOTQyNTQ0NDU5NjUsIHk6MC41OTg0OTUyMTIwMzgzMDM3fSx7eDoyLjUzMDc3OTc1Mzc2MTk3LCB5OjAuNjIxNzUxMDI1OTkxNzkyMX0se3g6Mi41NTY3NzE1NDU4Mjc2MzMsIHk6MC42NTg2ODY3MzA1MDYxNTZ9LHt4OjIuNTg5NjAzMjgzMTczNzM0NiwgeTowLjYzNDA2MjkyNzQ5NjU4fSx7eDoyLjU3NDU1NTQwMzU1Njc3MTcsIHk6MC42MDk0MzkxMjQ0ODcwMDQxfSx7eDoyLjUxNzA5OTg2MzIwMTA5NDYsIHk6MC41OTQzOTEyNDQ4NzAwNDF9LHt4OjIuNTIyNTcxODE5NDI1NDQ0NSwgeTowLjU1ODgyMzUyOTQxMTc2NDd9LHt4OjIuNTQzMDkxNjU1MjY2NzU3NywgeTowLjU1MzM1MTU3MzE4NzQxNDV9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOCA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuNTI0NDkxNTI1NDIzNzI4OCwgeToxLjM1NDIzNzI4ODEzNTU5MzN9LHt4OjAuNTQ5OTE1MjU0MjM3Mjg4LCB5OjEuMzUyNTQyMzcyODgxMzU2fSx7eDowLjU3NzAzMzg5ODMwNTA4NDcsIHk6MS4zNTMzODk4MzA1MDg0NzQ2fSx7eDowLjU4ODA1MDg0NzQ1NzYyNzEsIHk6MS4zNTkzMjIwMzM4OTgzMDUyfSx7eDowLjU5NjUyNTQyMzcyODgxMzYsIHk6MS4zNzAzMzg5ODMwNTA4NDc0fSx7eDowLjU5NTY3Nzk2NjEwMTY5NDksIHk6MS4zOTQwNjc3OTY2MTAxNjk2fSx7eDowLjU5NTY3Nzk2NjEwMTY5NDksIHk6MS40NDY2MTAxNjk0OTE1MjU0fSx7eDowLjU5ODIyMDMzODk4MzA1MDksIHk6MS40NjI3MTE4NjQ0MDY3Nzk2fSx7eDowLjYwNTg0NzQ1NzYyNzExODcsIHk6MS40NzIwMzM4OTgzMDUwODQ3fSx7eDowLjYyOTU3NjI3MTE4NjQ0MDgsIHk6MS40Nzc5NjYxMDE2OTQ5MTUzfSx7eDowLjY1OTIzNzI4ODEzNTU5MzIsIHk6MS40NzYyNzExODY0NDA2Nzh9LHt4OjAuNjY2ODY0NDA2Nzc5NjYxLCB5OjEuNDY3Nzk2NjEwMTY5NDkxNX0se3g6MC42NzI3OTY2MTAxNjk0OTE1LCB5OjEuNDV9LHt4OjAuNjcyNzk2NjEwMTY5NDkxNSwgeToxLjQwMzM4OTgzMDUwODQ3NDd9LHt4OjAuNjcxMTAxNjk0OTE1MjU0MiwgeToxLjM1NTkzMjIwMzM4OTgzMDR9LHt4OjAuNjcyNzk2NjEwMTY5NDkxNSwgeToxLjMyMTE4NjQ0MDY3Nzk2Nn0se3g6MC42NzE5NDkxNTI1NDIzNzI5LCB5OjEuMzA4NDc0NTc2MjcxMTg2NX0se3g6MC42NzQ0OTE1MjU0MjM3Mjg3LCB5OjEuMjk3NDU3NjI3MTE4NjQ0fSx7eDowLjY4MTI3MTE4NjQ0MDY3OCwgeToxLjI4NzI4ODEzNTU5MzIyMDR9LHt4OjAuNzA3NTQyMzcyODgxMzU1OSwgeToxLjI4OTgzMDUwODQ3NDU3NjN9LHt4OjAuNzcxMTAxNjk0OTE1MjU0MywgeToxLjI4ODk4MzA1MDg0NzQ1NzZ9LHt4OjAuNzgzODEzNTU5MzIyMDMzOSwgeToxLjI5MjM3Mjg4MTM1NTkzMjN9LHt4OjAuNzg4MDUwODQ3NDU3NjI3MSwgeToxLjMwMTY5NDkxNTI1NDIzNzJ9LHt4OjAuNzg4ODk4MzA1MDg0NzQ1OCwgeToxLjMxNzc5NjYxMDE2OTQ5MTZ9LHt4OjAuNzg1NTA4NDc0NTc2MjcxMywgeToxLjM1NTkzMjIwMzM4OTgzMDR9LHt4OjAuNzg4MDUwODQ3NDU3NjI3MSwgeToxLjQwMTY5NDkxNTI1NDIzNzN9LHt4OjAuNzg4ODk4MzA1MDg0NzQ1OCwgeToxLjQ1NTkzMjIwMzM4OTgzMDV9LHt4OjAuNzkyMjg4MTM1NTkzMjIwMywgeToxLjQ2NTI1NDIzNzI4ODEzNTZ9LHt4OjAuODAyNDU3NjI3MTE4NjQ0MSwgeToxLjQ3MjAzMzg5ODMwNTA4NDd9LHt4OjAuODQxNDQwNjc3OTY2MTAxNywgeToxLjQ3NjI3MTE4NjQ0MDY3OH0se3g6MC44ODA0MjM3Mjg4MTM1NTkyLCB5OjEuNDc2MjcxMTg2NDQwNjc4fSx7eDowLjg5ODIyMDMzODk4MzA1MDgsIHk6MS40ODcyODgxMzU1OTMyMjA0fSx7eDowLjkwMjQ1NzYyNzExODY0NCwgeToxLjUwNTkzMjIwMzM4OTgzMDZ9LHt4OjAuOTA0MTUyNTQyMzcyODgxMywgeToxLjU3MDMzODk4MzA1MDg0NzR9LHt4OjAuOTAzMzA1MDg0NzQ1NzYyNywgeToxLjYxNjk0OTE1MjU0MjM3M30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4UyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjIuNTk3MjU2ODU3ODU1MzYxNiwgeTowLjU5MTAyMjQ0Mzg5MDI3NDR9LHt4OjIuNjMzNDE2NDU4ODUyODY3NywgeTowLjU5MjI2OTMyNjY4MzI5MTh9LHt4OjIuNjY0NTg4NTI4Njc4MzA0NCwgeTowLjU4OTc3NTU2MTA5NzI1Njh9LHt4OjIuNjc3MDU3MzU2NjA4NDc4OCwgeTowLjYwNTk4NTAzNzQwNjQ4Mzh9LHt4OjIuNjgzMjkxNzcwNTczNTY2LCB5OjAuNjQwODk3NzU1NjEwOTcyNn0se3g6Mi42ODIwNDQ4ODc3ODA1NDg1LCB5OjAuNjc5NTUxMTIyMTk0NTEzN30se3g6Mi42ODIwNDQ4ODc3ODA1NDg1LCB5OjAuNzA0NDg4Nzc4MDU0ODYyOX0se3g6Mi42ODcwMzI0MTg5NTI2MTgyLCB5OjAuNzE0NDYzODQwMzk5MDAyNX0se3g6Mi42OTU3NjA1OTg1MDM3NDA3LCB5OjAuNzIzMTkyMDE5OTUwMTI0N30se3g6Mi43MzMxNjcwODIyOTQyNjQsIHk6MC43Mjk0MjY0MzM5MTUyMTJ9LHt4OjIuNzUzMTE3MjA2OTgyNTQzNiwgeTowLjcyNTY4NTc4NTUzNjE1OTZ9LHt4OjIuNzYzMDkyMjY5MzI2NjgzNSwgeTowLjcxODIwNDQ4ODc3ODA1NDl9LHt4OjIuNzY5MzI2NjgzMjkxNzcwNywgeTowLjcwMzI0MTg5NTI2MTg0NTR9LHt4OjIuNzY5MzI2NjgzMjkxNzcwNywgeTowLjY2NTgzNTQxMTQ3MTMyMTd9LHt4OjIuNzcwNTczNTY2MDg0Nzg4LCB5OjAuNjMyMTY5NTc2MDU5ODUwNH0se3g6Mi43NzE4MjA0NDg4Nzc4MDU1LCB5OjAuNTY4NTc4NTUzNjE1OTYwMX0se3g6Mi43NzA1NzM1NjYwODQ3ODgsIHk6MC41NDM2NDA4OTc3NTU2MTF9LHt4OjIuNzcwNTczNTY2MDg0Nzg4LCB5OjAuNTIyNDQzODkwMjc0MzE0M30se3g6Mi43NzU1NjEwOTcyNTY4NTgsIHk6MC41MTQ5NjI1OTM1MTYyMDk0fSx7eDoyLjc5MTc3MDU3MzU2NjA4NSwgeTowLjUxNDk2MjU5MzUxNjIwOTR9LHt4OjIuODYwMzQ5MTI3MTgyMDQ0NywgeTowLjUxNDk2MjU5MzUxNjIwOTR9LHt4OjIuODkxNTIxMTk3MDA3NDgxNCwgeTowLjUxOTk1MDEyNDY4ODI3OTN9LHt4OjIuODk2NTA4NzI4MTc5NTUxLCB5OjAuNTM4NjUzMzY2NTgzNTQxMX0se3g6Mi44OTkwMDI0OTM3NjU1ODYsIHk6MC41NzczMDY3MzMxNjcwODIzfSx7eDoyLjkwMTQ5NjI1OTM1MTYyMSwgeTowLjYzMDkyMjY5MzI2NjgzMjl9LHt4OjIuODk3NzU1NjEwOTcyNTY4NiwgeTowLjY1MDg3MjgxNzk1NTExMjJ9LHt4OjIuODk3NzU1NjEwOTcyNTY4NiwgeTowLjY4MzI5MTc3MDU3MzU2Nn0se3g6Mi45MDI3NDMxNDIxNDQ2Mzg0LCB5OjAuNzE0NDYzODQwMzk5MDAyNX0se3g6Mi45MTY0NTg4NTI4Njc4MzA2LCB5OjAuNzI0NDM4OTAyNzQzMTQyMn0se3g6Mi45NDYzODQwMzk5MDAyNDk0LCB5OjAuNzI0NDM4OTAyNzQzMTQyMn0se3g6My4yMDE5OTUwMTI0Njg4MjgsIHk6MC43MjMxOTIwMTk5NTAxMjQ3fSx7eDozLjcyODE3OTU1MTEyMjE5NDUsIHk6MC43MjA2OTgyNTQzNjQwODk3fSx7eDozLjk0NjM4NDAzOTkwMDI0OTQsIHk6MC43MjMxOTIwMTk5NTAxMjQ3fSx7eDozLjk2NTA4NzI4MTc5NTUxMTQsIHk6MC43MTk0NTEzNzE1NzEwNzIzfSx7eDozLjk4NTAzNzQwNjQ4Mzc5MDMsIHk6MC43MDU3MzU2NjA4NDc4ODAzfSx7eDozLjk4ODc3ODA1NDg2Mjg0MywgeTowLjY4ODI3OTMwMTc0NTYzNTl9LHt4OjMuOTkyNTE4NzAzMjQxODk1NCwgeTowLjY1OTYwMDk5NzUwNjIzNDV9LHt4OjMuOTkyNTE4NzAzMjQxODk1NCwgeTowLjYzOTY1MDg3MjgxNzk1NTF9LHt4OjMuOTg2Mjg0Mjg5Mjc2ODA4LCB5OjAuNjIyMTk0NTEzNzE1NzEwOH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC44MDk0MjM3Mjg4MTM1NTkzLCB5OjEuNTE4MDU5MzIyMDMzODk4M30se3g6MC44MjgwNjc3OTY2MTAxNjk1LCB5OjEuNTQxNzg4MTM1NTkzMjIwNH0se3g6MC44NTk0MjM3Mjg4MTM1NTkzLCB5OjEuNTU1MzQ3NDU3NjI3MTE4N30se3g6MC44Nzk3NjI3MTE4NjQ0MDY4LCB5OjEuNTQwOTQwNjc3OTY2MTAxN30se3g6MC44ODQ4NDc0NTc2MjcxMTg2LCB5OjEuNTI2NTMzODk4MzA1MDg0N30se3g6MC44NzcyMjAzMzg5ODMwNTA5LCB5OjEuNTA3MDQyMzcyODgxMzU1OH0se3g6MC44NTc3Mjg4MTM1NTkzMjIxLCB5OjEuNDkwOTQwNjc3OTY2MTAxNn0pLFxuICBuZXcgQXJyYXkoe3g6MC44Njc4OTgzMDUwODQ3NDU3LCB5OjEuNTM5MjQ1NzYyNzExODY0M30se3g6MC44NzU1MjU0MjM3Mjg4MTM2LCB5OjEuNTI1Njg2NDQwNjc3OTY2fSx7eDowLjg1NTE4NjQ0MDY3Nzk2NjEsIHk6MS41MTQ2Njk0OTE1MjU0MjM3fSx7eDowLjgzNjU0MjM3Mjg4MTM1NTksIHk6MS41MTQ2Njk0OTE1MjU0MjM3fSx7eDowLjgyNDY3Nzk2NjEwMTY5NDksIHk6MS41MjgyMjg4MTM1NTkzMjJ9LHt4OjAuODE1MzU1OTMyMjAzMzg5OSwgeToxLjUzNzU1MDg0NzQ1NzYyNzJ9LHt4OjAuODAzNDkxNTI1NDIzNzI4OCwgeToxLjUyNDgzODk4MzA1MDg0NzN9LHt4OjAuODA4NTc2MjcxMTg2NDQwNywgeToxLjQ5NzcyMDMzODk4MzA1MX0se3g6MC44MzE0NTc2MjcxMTg2NDQsIHk6MS40OTAwOTMyMjAzMzg5ODN9LHt4OjAuODU2MDMzODk4MzA1MDg0NywgeToxLjUwMjgwNTA4NDc0NTc2MjZ9KSxcbiAgbmV3IEFycmF5KHt4OjAuODQ1MDE2OTQ5MTUyNTQyMywgeToxLjQ4NDE2MTAxNjk0OTE1MjZ9LHt4OjAuODU2MDMzODk4MzA1MDg0NywgeToxLjUwMTk1NzYyNzExODY0NDF9LHt4OjAuODY2MjAzMzg5ODMwNTA4NSwgeToxLjUyMTQ0OTE1MjU0MjM3Mjh9LHt4OjAuODY3MDUwODQ3NDU3NjI3MSwgeToxLjUzNTAwODQ3NDU3NjI3MX0se3g6MC44NTA5NDkxNTI1NDIzNzI5LCB5OjEuNTQxNzg4MTM1NTkzMjIwNH0se3g6MC44MjcyMjAzMzg5ODMwNTA4LCB5OjEuNTM1ODU1OTMyMjAzMzg5OH0se3g6MC44MDc3Mjg4MTM1NTkzMjIsIHk6MS41MjA2MDE2OTQ5MTUyNTR9LHt4OjAuODEwMjcxMTg2NDQwNjc4LCB5OjEuNTA0NX0se3g6MC44MzMxNTI1NDIzNzI4ODE0LCB5OjEuNTAyODA1MDg0NzQ1NzYyNn0se3g6MC44NTA5NDkxNTI1NDIzNzI5LCB5OjEuNTE1NTE2OTQ5MTUyNTQyNH0se3g6MC44NzM4MzA1MDg0NzQ1NzYyLCB5OjEuNTEyOTc0NTc2MjcxMTg2NH0se3g6MC44NzA0NDA2Nzc5NjYxMDE3LCB5OjEuNTAwMjYyNzExODY0NDA2N30se3g6MC44NTUxODY0NDA2Nzc5NjYxLCB5OjEuNDkxNzg4MTM1NTkzMjIwM30se3g6MC44NDMzMjIwMzM4OTgzMDUxLCB5OjEuNDgzMzEzNTU5MzIyMDM0fSlcbik7XG5cbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDozLjk4ODM1NTE2NzM5NDQ2OSwgeTowLjYyNDQ1NDE0ODQ3MTYxNTd9LHt4OjMuOTYwNjk4Njg5OTU2MzMyLCB5OjAuNjMwMjc2NTY0Nzc0MzgxM30se3g6My45NDc1OTgyNTMyNzUxMDksIHk6MC42Mjg4MjA5NjA2OTg2OX0se3g6My45NDkwNTM4NTczNTA4MDA3LCB5OjAuNjE0MjY0OTE5OTQxNzc1OH0se3g6My45ODEwNzcxNDcwMTYwMTIsIHk6MC41ODk1MTk2NTA2NTUwMjE5fSx7eDo0LCB5OjAuNjE0MjY0OTE5OTQxNzc1OH0se3g6NC4wMjYyMDA4NzMzNjI0NDYsIHk6MC42MjQ0NTQxNDg0NzE2MTU3fSx7eDo0LjAyNjIwMDg3MzM2MjQ0NiwgeTowLjYxNDI2NDkxOTk0MTc3NTh9LHt4OjQuMDE0NTU2MDQwNzU2OTE0LCB5OjAuNjA0MDc1NjkxNDExOTM2fSx7eDozLjk5MTI2NjM3NTU0NTg1MTcsIHk6MC42MTcxNzYxMjgwOTMxNTg3fSx7eDozLjk3Mzc5OTEyNjYzNzU1NDcsIHk6MC42MzE3MzIxNjg4NTAwNzI4fSksXG4gIG5ldyBBcnJheSh7eDozLjk5NDE3NzU4MzY5NzIzNCwgeTowLjYzMDI3NjU2NDc3NDM4MTN9LHt4OjQuMDE4OTIyODUyOTgzOTg4LCB5OjAuNjIyOTk4NTQ0Mzk1OTI0M30se3g6NC4wMjkxMTIwODE1MTM4MjgsIHk6MC42NDA0NjU3OTMzMDQyMjEzfSx7eDo0LjAxNjAxMTY0NDgzMjYwNiwgeTowLjY1MzU2NjIyOTk4NTQ0NH0se3g6My45NzgxNjU5Mzg4NjQ2MjksIHk6MC42NTkzODg2NDYyODgyMDk2fSx7eDozLjk1NDg3NjI3MzY1MzU2NiwgeTowLjY1MjExMDYyNTkwOTc1MjZ9LHt4OjMuOTQ0Njg3MDQ1MTIzNzI2LCB5OjAuNjI3MzY1MzU2NjIyOTk4NX0se3g6My45NDQ2ODcwNDUxMjM3MjYsIHk6MC42MTI4MDkzMTU4NjYwODQ0fSx7eDozLjk1Nzc4NzQ4MTgwNDk0OSwgeTowLjYwMjYyMDA4NzMzNjI0NDV9LHt4OjMuOTg4MzU1MTY3Mzk0NDY5LCB5OjAuNjA2OTg2ODk5NTYzMzE4N30se3g6NC4wMTg5MjI4NTI5ODM5ODgsIHk6MC42MjE1NDI5NDAzMjAyMzI5fSx7eDo0LjAyMTgzNDA2MTEzNTM3MiwgeTowLjYwODQ0MjUwMzYzOTAxMDJ9LHt4OjQuMDA0MzY2ODEyMjI3MDc0LCB5OjAuNTkzODg2NDYyODgyMDk2MX0se3g6My45Nzk2MjE1NDI5NDAzMiwgeTowLjYwMTE2NDQ4MzI2MDU1MzJ9LHt4OjMuOTYyMTU0Mjk0MDMyMDIzLCB5OjAuNTkwOTc1MjU0NzMwNzEzMn0se3g6My45OTQxNzc1ODM2OTcyMzQsIHk6MC41OTY3OTc2NzEwMzM0Nzg5fSx7eDo0LjAwODczMzYyNDQ1NDE0OCwgeTowLjYzMTczMjE2ODg1MDA3Mjh9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTAgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjkwOTE1MjU0MjM3Mjg4MTUsIHk6MS42MzcyODgxMzU1OTMyMjAzfSx7eDowLjkxMDg0NzQ1NzYyNzExODYsIHk6MS42NjQ0MDY3Nzk2NjEwMTd9LHt4OjAuOTA5MTUyNTQyMzcyODgxNSwgeToxLjcwODQ3NDU3NjI3MTE4NjR9LHt4OjAuOTA1NzYyNzExODY0NDA2OSwgeToxLjc1NTA4NDc0NTc2MjcxMn0se3g6MC45MDMyMjAzMzg5ODMwNTA5LCB5OjEuNzc3OTY2MTAxNjk0OTE1M30se3g6MC45MTY3Nzk2NjEwMTY5NDkyLCB5OjEuNzg4OTgzMDUwODQ3NDU3Nn0se3g6MC45MTAwMDAwMDAwMDAwMDAxLCB5OjEuODA1OTMyMjAzMzg5ODMwNH0se3g6MC45MTQyMzcyODgxMzU1OTM0LCB5OjEuODM2NDQwNjc3OTY2MTAxOH0se3g6MC45MTE2OTQ5MTUyNTQyMzczLCB5OjEuODYwMTY5NDkxNTI1NDIzN30se3g6MC45MTA4NDc0NTc2MjcxMTg2LCB5OjEuODk4MzA1MDg0NzQ1NzYyOH0se3g6MC45MTQyMzcyODgxMzU1OTM0LCB5OjEuOTQ2NjEwMTY5NDkxNTI1NH0se3g6MC45MTAwMDAwMDAwMDAwMDAxLCB5OjEuOTk5MTUyNTQyMzcyODgxM30se3g6MC45MDkxNTI1NDIzNzI4ODE1LCB5OjIuMDQ4MzA1MDg0NzQ1NzYzfSx7eDowLjkxMDAwMDAwMDAwMDAwMDEsIHk6Mi4xMDUwODQ3NDU3NjI3MTE4fSx7eDowLjkwNDA2Nzc5NjYxMDE2OTYsIHk6Mi4xMzA1MDg0NzQ1NzYyNzF9LHt4OjAuODkzMDUwODQ3NDU3NjI3MSwgeToyLjEzODEzNTU5MzIyMDMzOX0se3g6MC44NjY3Nzk2NjEwMTY5NDkxLCB5OjIuMTM4OTgzMDUwODQ3NDU3NH0se3g6MC44NDgxMzU1OTMyMjAzMzg5LCB5OjIuMTQ1NzYyNzExODY0NDA3fSx7eDowLjgzNzk2NjEwMTY5NDkxNTQsIHk6Mi4xNjk0OTE1MjU0MjM3Mjl9LHt4OjAuODM5NjYxMDE2OTQ5MTUyNSwgeToyLjM1NzYyNzExODY0NDA2OH0se3g6MC44MzU0MjM3Mjg4MTM1NTkzLCB5OjIuMzc3MTE4NjQ0MDY3Nzk2N30se3g6MC44MTUwODQ3NDU3NjI3MTIsIHk6Mi4zODQ3NDU3NjI3MTE4NjQ0fSx7eDowLjc5MTM1NTkzMjIwMzM4OTgsIHk6Mi4zODQ3NDU3NjI3MTE4NjQ0fSx7eDowLjc4Nzk2NjEwMTY5NDkxNTMsIHk6Mi4zNzc5NjYxMDE2OTQ5MTU0fSx7eDowLjc4MTE4NjQ0MDY3Nzk2NiwgeToyLjM5MjM3Mjg4MTM1NTkzMn0se3g6MC43NzY5NDkxNTI1NDIzNzI4LCB5OjIuMzc3MTE4NjQ0MDY3Nzk2N30se3g6MC43NzAxNjk0OTE1MjU0MjM4LCB5OjIuMzkxNTI1NDIzNzI4ODEzNX0se3g6MC43NjU5MzIyMDMzODk4MzA2LCB5OjIuMzc4ODEzNTU5MzIyMDM0fSx7eDowLjc1ODMwNTA4NDc0NTc2MjYsIHk6Mi4zOTE1MjU0MjM3Mjg4MTM1fSx7eDowLjc1NDA2Nzc5NjYxMDE2OTQsIHk6Mi4zNzcxMTg2NDQwNjc3OTY3fSx7eDowLjc0NzI4ODEzNTU5MzIyMDQsIHk6Mi4zOTIzNzI4ODEzNTU5MzJ9LHt4OjAuNzQyMjAzMzg5ODMwNTA4NSwgeToyLjM3NDU3NjI3MTE4NjQ0MDd9LHt4OjAuNzMzNzI4ODEzNTU5MzIyMSwgeToyLjM5MjM3Mjg4MTM1NTkzMn0se3g6MC43MzExODY0NDA2Nzc5NjYsIHk6Mi4zNzcxMTg2NDQwNjc3OTY3fSx7eDowLjcyNDQwNjc3OTY2MTAxNywgeToyLjM5MjM3Mjg4MTM1NTkzMn0se3g6MC43MTkzMjIwMzM4OTgzMDUxLCB5OjIuMzc5NjYxMDE2OTQ5MTUyM30se3g6MC43MDc0NTc2MjcxMTg2NDQxLCB5OjIuMzg1NTkzMjIwMzM4OTgzfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEwUyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjMuOTg4MzU1MTY3Mzk0NDY5LCB5OjAuNTgwNzg2MDI2MjAwODczNH0se3g6My45ODY4OTk1NjMzMTg3NzcsIHk6MC41NjkxNDExOTM1OTUzNDIxfSx7eDozLjk4Njg5OTU2MzMxODc3NywgeTowLjU1MTY3Mzk0NDY4NzA0NTF9LHt4OjMuOTgzOTg4MzU1MTY3Mzk0NywgeTowLjUyMTEwNjI1OTA5NzUyNTV9LHt4OjMuOTgzOTg4MzU1MTY3Mzk0NywgeTowLjQ3NzQzODEzNjgyNjc4MzF9LHt4OjMuOTgzOTg4MzU1MTY3Mzk0NywgeTowLjQzOTU5MjQzMDg1ODgwNjR9LHt4OjMuOTgzOTg4MzU1MTY3Mzk0NywgeTowLjM2NjgxMjIyNzA3NDIzNTgzfSx7eDozLjk4Mzk4ODM1NTE2NzM5NDcsIHk6MC4zMDQyMjEyNTE4MTk1MDUxfSx7eDozLjk4MjUzMjc1MTA5MTcwMywgeTowLjI1MTgxOTUwNTA5NDYxNDI2fSx7eDozLjk4MTA3NzE0NzAxNjAxMiwgeTowLjE4MDQ5NDkwNTM4NTczNTF9LHt4OjMuOTgyNTMyNzUxMDkxNzAzLCB5OjAuMTMzOTE1NTc0OTYzNjA5OX0se3g6My45ODgzNTUxNjczOTQ0NjksIHk6MC4xMTkzNTk1MzQyMDY2OTU3N30se3g6NCwgeTowLjExMjA4MTUxMzgyODIzODcyfSx7eDo0LjAzNjM5MDEwMTg5MjI4NiwgeTowLjExMjA4MTUxMzgyODIzODcyfSx7eDo0LjA4MDA1ODIyNDE2MzAyOCwgeTowLjEwNzcxNDcwMTYwMTE2NDQ5fSx7eDo0LjEwMzM0Nzg4OTM3NDA5LCB5OjAuMTEyMDgxNTEzODI4MjM4NzJ9LHt4OjQuMTIyMjcwNzQyMzU4MDc4LCB5OjAuMTIyMjcwNzQyMzU4MDc4Nn0se3g6NC4xMzEwMDQzNjY4MTIyMjcsIHk6MC4xNDk5MjcyMTk3OTYyMTU0M30se3g6NC4xMzI0NTk5NzA4ODc5MTgsIHk6MC4zODcxOTA2ODQxMzM5MTU1NX0se3g6NC4xMjk1NDg3NjI3MzY1MzYsIHk6MC42MTU3MjA1MjQwMTc0NjcyfSx7eDo0LjEzMzkxNTU3NDk2MzYxLCB5OjAuNjQ3NzQzODEzNjgyNjc4M30se3g6NC4xMzk3Mzc5OTEyNjYzNzYsIHk6MC42NTY0Nzc0MzgxMzY4MjY4fSx7eDo0LjE2MDExNjQ0ODMyNjA1NSwgeTowLjY2Mzc1NTQ1ODUxNTI4Mzh9LHt4OjQuMjUwMzYzOTAxMDE4OTIzLCB5OjAuNjYzNzU1NDU4NTE1MjgzOH0se3g6NC4zMzkxNTU3NDk2MzYwOTksIHk6MC42NjIyOTk4NTQ0Mzk1OTI0fSx7eDo0LjQxOTIxMzk3Mzc5OTEyNywgeTowLjY2NTIxMTA2MjU5MDk3NTN9LHt4OjQuNDU0MTQ4NDcxNjE1NzIxLCB5OjAuNjU5Mzg4NjQ2Mjg4MjA5Nn0se3g6NC40NTk5NzA4ODc5MTg0ODY1LCB5OjAuNjQxOTIxMzk3Mzc5OTEyN30se3g6NC40NjE0MjY0OTE5OTQxNzcsIHk6MC42MjAwODczMzYyNDQ1NDE1fSx7eDo0LjQ2NDMzNzcwMDE0NTU2MSwgeTowLjYwMTE2NDQ4MzI2MDU1MzJ9LHt4OjQuNDgzMjYwNTUzMTI5NTQ5LCB5OjAuNTkwOTc1MjU0NzMwNzEzMn0se3g6NC41MjgzODQyNzk0NzU5ODMsIHk6MC41OTI0MzA4NTg4MDY0MDQ3fSx7eDo0LjU2NDc3NDM4MTM2ODI2NzUsIHk6MC41OTI0MzA4NTg4MDY0MDQ3fSx7eDo0LjU4MDc4NjAyNjIwMDg3MywgeTowLjU5OTcwODg3OTE4NDg2MTd9LHt4OjQuNTgwNzg2MDI2MjAwODczLCB5OjAuNjI1OTA5NzUyNTQ3MzA3Mn0se3g6NC41ODA3ODYwMjYyMDA4NzMsIHk6MC42NzM5NDQ2ODcwNDUxMjM4fSx7eDo0LjU4NjYwODQ0MjUwMzYzOSwgeTowLjcwNDUxMjM3MjYzNDY0MzR9LHt4OjQuNjA5ODk4MTA3NzE0NzAxLCB5OjAuNzExNzkwMzkzMDEzMTAwNH0se3g6NC44Mzg0Mjc5NDc1OTgyNTM1LCB5OjAuNzEwMzM0Nzg4OTM3NDA5fSx7eDo0Ljg3NDgxODA0OTQ5MDUzOCwgeTowLjcxMDMzNDc4ODkzNzQwOX0se3g6NC44ODA2NDA0NjU3OTMzMDQsIHk6MC43MDU5Njc5NzY3MTAzMzQ4fSx7eDo0Ljg4NjQ2Mjg4MjA5NjA3LCB5OjAuNjkyODY3NTQwMDI5MTEyMX0se3g6NC44ODY0NjI4ODIwOTYwNywgeTowLjY2OTU3Nzg3NDgxODA0OTV9LHt4OjQuODkwODI5Njk0MzIzMTQ0LCB5OjAuNjU1MDIxODM0MDYxMTM1M30se3g6NC44OTY2NTIxMTA2MjU5MSwgeTowLjY0NjI4ODIwOTYwNjk4Njl9LHt4OjQuOTAzOTMwMTMxMDA0MzY3LCB5OjAuNjM5MDEwMTg5MjI4NTI5OH0sIHt4OjQuODk4NzY4ODA5ODQ5NTIxLCB5OjAuNjQzNjM4ODUwODg5MTkyOX0se3g6NC44ODM3MjA5MzAyMzI1NTgsIHk6MC42NDIyNzA4NjE4MzMxMDUzfSx7eDo0Ljg2MzIwMTA5NDM5MTI0NSwgeTowLjYzNjc5ODkwNTYwODc1NTJ9LHt4OjQuODQ2Nzg1MjI1NzE4MTk0LCB5OjAuNjI1ODU0OTkzMTYwMDU0OH0se3g6NC44NDgxNTMyMTQ3NzQyODIsIHk6MC42MTQ5MTEwODA3MTEzNTQ0fSx7eDo0Ljg0MTMxMzI2OTQ5Mzg0NCwgeTowLjU4ODkxOTI4ODY0NTY5MDl9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTEgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjU4MjMwNTA4NDc0NTc2MjcsIHk6Mi4xMDQ1MDAwMDAwMDAwMDAzfSx7eDowLjU2NjIwMzM4OTgzMDUwODQsIHk6Mi4xMDAyNjI3MTE4NjQ0MDd9LHt4OjAuNTY3MDUwODQ3NDU3NjI3MSwgeToyLjA5MjYzNTU5MzIyMDMzOX0se3g6MC41ODczODk4MzA1MDg0NzQ2LCB5OjIuMDg2NzAzMzg5ODMwNTA4N30se3g6MC42MTQ1MDg0NzQ1NzYyNzEyLCB5OjIuMDc2NTMzODk4MzA1MDg1fSx7eDowLjYzMzE1MjU0MjM3Mjg4MTMsIHk6Mi4wNzQ4Mzg5ODMwNTA4NDc2fSx7eDowLjYzNjU0MjM3Mjg4MTM1NiwgeToyLjA4NTg1NTkzMjIwMzM5fSx7eDowLjYyMTI4ODEzNTU5MzIyMDMsIHk6Mi4wOTc3MjAzMzg5ODMwNTF9LHt4OjAuNTkxNjI3MTE4NjQ0MDY3OCwgeToyLjEwMjgwNTA4NDc0NTc2M30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDo0Ljc3NzAxNzc4Mzg1NzcyOSwgeTowLjYwMjU5OTE3OTIwNjU2NjR9LHt4OjQuNzkwNjk3Njc0NDE4NjA0LCB5OjAuNjAyNTk5MTc5MjA2NTY2NH0se3g6NC44MTEyMTc1MTAyNTk5MTgsIHk6MC41OTU3NTkyMzM5MjYxMjg2fSx7eDo0LjgzMzEwNTMzNTE1NzMxODUsIHk6MC41ODg5MTkyODg2NDU2OTA5fSx7eDo0Ljg0OTUyMTIwMzgzMDM3LCB5OjAuNTgwNzExMzU0MzA5MTY1NX0se3g6NC44NjQ1NjkwODM0NDczMzIsIHk6MC41NzI1MDM0MTk5NzI2NDAyfSx7eDo0Ljg2NDU2OTA4MzQ0NzMzMiwgeTowLjU2MjkyNzQ5NjU4MDAyNzR9LHt4OjQuODU0OTkzMTYwMDU0NzE5LCB5OjAuNTYxNTU5NTA3NTIzOTM5OH0se3g6NC44MjkwMDEzNjc5ODkwNTYsIHk6MC41NjgzOTk0NTI4MDQzNzc1fSx7eDo0LjgwNDM3NzU2NDk3OTQ4LCB5OjAuNTc1MjM5Mzk4MDg0ODE1M30se3g6NC43OTA2OTc2NzQ0MTg2MDQsIHk6MC41ODIwNzkzNDMzNjUyNTMxfSx7eDo0Ljc3ODM4NTc3MjkxMzgxNywgeTowLjU5MDI4NzI3NzcwMTc3ODR9LHt4OjQuNzc4Mzg1NzcyOTEzODE3LCB5OjAuNTk4NDk1MjEyMDM4MzAzN30se3g6NC43OTYxNjk2MzA2NDI5NTUsIHk6MC41OTQzOTEyNDQ4NzAwNDF9LHt4OjQuODAwMjczNTk3ODExMjE3LCB5OjAuNTg2MTgzMzEwNTMzNTE1N30se3g6NC44MTI1ODU0OTkzMTYwMDYsIHk6MC41NzM4NzE0MDkwMjg3Mjc4fSx7eDo0LjgyMjE2MTQyMjcwODYxOSwgeTowLjU3MjUwMzQxOTk3MjY0MDJ9LHt4OjQuODQ1NDE3MjM2NjYyMTA3LCB5OjAuNTY1NjYzNDc0NjkyMjAyNX0se3g6NC44NTQ5OTMxNjAwNTQ3MTksIHk6MC41NzI1MDM0MTk5NzI2NDAyfSx7eDo0LjgzMzEwNTMzNTE1NzMxODUsIHk6MC41OTAyODcyNzc3MDE3Nzg0fSx7eDo0Ljc4NjU5MzcwNzI1MDM0MiwgeTowLjYwMjU5OTE3OTIwNjU2NjR9LHt4OjQuNzc1NjQ5Nzk0ODAxNjQyLCB5OjAuNTk0MzkxMjQ0ODcwMDQxfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC43MTAwODQ3NDU3NjI3MTIsIHk6Mi4zODgxMzU1OTMyMjAzMzl9LHt4OjAuNzA1MDAwMDAwMDAwMDAwMSwgeToyLjQwMDg0NzQ1NzYyNzExODZ9LHt4OjAuNzA1ODQ3NDU3NjI3MTE4NSwgeToyLjQxMjcxMTg2NDQwNjc3OTh9LHt4OjAuNzA0MTUyNTQyMzcyODgxNCwgeToyLjQzNzI4ODEzNTU5MzIyMDN9LHt4OjAuNzAxNjEwMTY5NDkxNTI1MywgeToyLjQ0NjYxMDE2OTQ5MTUyNTR9LHt4OjAuNjkwNTkzMjIwMzM4OTgzMSwgeToyLjQ1NTA4NDc0NTc2MjcxMn0se3g6MC42NTI0NTc2MjcxMTg2NDQsIHk6Mi40NTc2MjcxMTg2NDQwNjh9LHt4OjAuNDY4NTU5MzIyMDMzODk4MzMsIHk6Mi40NTU5MzIyMDMzODk4MzA1fSx7eDowLjQ1NTg0NzQ1NzYyNzExODYsIHk6Mi40NTU5MzIyMDMzODk4MzA1fSx7eDowLjQ0Mzk4MzA1MDg0NzQ1NzY1LCB5OjIuNDQ5MTUyNTQyMzcyODgxNX0se3g6MC40MzEyNzExODY0NDA2Nzc5LCB5OjIuNDM4OTgzMDUwODQ3NDU3N30se3g6MC40Mjc4ODEzNTU5MzIyMDM0LCB5OjIuNDIxMTg2NDQwNjc3OTY2fSx7eDowLjQyOTU3NjI3MTE4NjQ0MDY1LCB5OjIuMzY0NDA2Nzc5NjYxMDE3fSx7eDowLjQxNzcxMTg2NDQwNjc3OTcsIHk6Mi4zNDIzNzI4ODEzNTU5MzI0fSx7eDowLjQwNTg0NzQ1NzYyNzExODY2LCB5OjIuMzM4MTM1NTkzMjIwMzM5fSx7eDowLjM5NzM3Mjg4MTM1NTkzMjI0LCB5OjIuMzMzODk4MzA1MDg0NzQ2fSx7eDowLjM5OTkxNTI1NDIzNzI4ODEsIHk6Mi4zNDY2MTAxNjk0OTE1MjUzfSx7eDowLjM4NDY2MTAxNjk0OTE1MjUsIHk6Mi4zMzQ3NDU3NjI3MTE4NjQ2fSx7eDowLjM4NjM1NTkzMjIwMzM4OTksIHk6Mi4zNDc0NTc2MjcxMTg2NDR9LHt4OjAuMzczNjQ0MDY3Nzk2NjEwMTQsIHk6Mi4zMzM4OTgzMDUwODQ3NDZ9LHt4OjAuMzc0NDkxNTI1NDIzNzI4OCwgeToyLjM0NzQ1NzYyNzExODY0NH0se3g6MC4zNjA5MzIyMDMzODk4MzA1LCB5OjIuMzM1NTkzMjIwMzM4OTgzfSx7eDowLjM2NDMyMjAzMzg5ODMwNTAzLCB5OjIuMzV9LHt4OjAuMzUwNzYyNzExODY0NDA2NywgeToyLjMzNTU5MzIyMDMzODk4M30se3g6MC4zNTI0NTc2MjcxMTg2NDQxLCB5OjIuMzQ5MTUyNTQyMzcyODgxNH0se3g6MC4zMzg4OTgzMDUwODQ3NDU4LCB5OjIuMzM1NTkzMjIwMzM4OTgzfSx7eDowLjMyNzg4MTM1NTkzMjIwMzQsIHk6Mi4zNDQ5MTUyNTQyMzcyODh9LHt4OjAuMzIxMTAxNjk0OTE1MjU0MjUsIHk6Mi4zNTMzODk4MzA1MDg0NzQ0fSx7eDowLjMxODU1OTMyMjAzMzg5ODMsIHk6Mi4zNjg2NDQwNjc3OTY2MTAzfSx7eDowLjMxODU1OTMyMjAzMzg5ODMsIHk6Mi4zODMwNTA4NDc0NTc2Mjd9LHt4OjAuMzE3NzExODY0NDA2Nzc5NiwgeToyLjM5NTc2MjcxMTg2NDQwN30se3g6MC4zMDkyMzcyODgxMzU1OTMyLCB5OjIuNDAyNTQyMzcyODgxMzU2fSx7eDowLjI4OTc0NTc2MjcxMTg2NDQsIHk6Mi40MDU5MzIyMDMzODk4MzA3fSx7eDowLjIyMDI1NDIzNzI4ODEzNTYsIHk6Mi40MDY3Nzk2NjEwMTY5NDl9LHt4OjAuMTc3MDMzODk4MzA1MDg0NzYsIHk6Mi40MDc2MjcxMTg2NDQwNjc2fSx7eDowLjExMjYyNzExODY0NDA2Nzc3LCB5OjIuNDA4NDc0NTc2MjcxMTg2M30se3g6MC4wOTkwNjc3OTY2MTAxNjk1MSwgeToyLjQxMjcxMTg2NDQwNjc3OTh9LHt4OjAuMDg4ODk4MzA1MDg0NzQ1NzgsIHk6Mi40MTg2NDQwNjc3OTY2MX0se3g6MC4wODM4MTM1NTkzMjIwMzM4OCwgeToyLjQzNDc0NTc2MjcxMTg2NDN9LHt4OjAuMDg0NjYxMDE2OTQ5MTUyNTEsIHk6Mi40OTQwNjc3OTY2MTAxNjk2fSx7eDowLjA4MjExODY0NDA2Nzc5NjYyLCB5OjIuNTU2Nzc5NjYxMDE2OTQ5M30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMlMgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDo0Ljg0MTMxMzI2OTQ5Mzg0NCwgeTowLjU4ODkxOTI4ODY0NTY5MDl9LHt4OjQuODQ4MTUzMjE0Nzc0MjgyLCB5OjAuNjE0OTExMDgwNzExMzU0NH0se3g6NC44NDY3ODUyMjU3MTgxOTQsIHk6MC42MjU4NTQ5OTMxNjAwNTQ4fSx7eDo0Ljg2MzIwMTA5NDM5MTI0NSwgeTowLjYzNjc5ODkwNTYwODc1NTJ9LHt4OjQuODgzNzIwOTMwMjMyNTU4LCB5OjAuNjQyMjcwODYxODMzMTA1M30se3g6NC44OTg3Njg4MDk4NDk1MjEsIHk6MC42NDM2Mzg4NTA4ODkxOTI5fSwge3g6NC45MDI0NzQ1MjY5Mjg2NzYsIHk6MC42MzkwMTAxODkyMjg1Mjk4fSx7eDo0LjkxOTk0MTc3NTgzNjk3MiwgeTowLjYzOTAxMDE4OTIyODUyOTh9LHt4OjQuOTQ5MDUzODU3MzUwOCwgeTowLjYzNzU1NDU4NTE1MjgzODV9LHt4OjQuOTk3MDg4NzkxODQ4NjE3NSwgeTowLjYzNDY0MzM3NzAwMTQ1NTZ9LHt4OjUuMDIxODM0MDYxMTM1MzcyLCB5OjAuNjM3NTU0NTg1MTUyODM4NX0se3g6NS4wMzM0Nzg4OTM3NDA5MDIsIHk6MC42NDYyODgyMDk2MDY5ODY5fSx7eDo1LjA0NTEyMzcyNjM0NjQzNCwgeTowLjY2MDg0NDI1MDM2MzkwMX0se3g6NS4wNDUxMjM3MjYzNDY0MzQsIHk6MC42ODQxMzM5MTU1NzQ5NjM2fSx7eDo1LjA0NTEyMzcyNjM0NjQzNCwgeTowLjc0MzgxMzY4MjY3ODMxMTV9LHt4OjUuMDQzNjY4MTIyMjcwNzQyLCB5OjAuNzg0NTcwNTk2Nzk3NjcxfSx7eDo1LjA0OTQ5MDUzODU3MzUwOCwgeTowLjc5NzY3MTAzMzQ3ODg5Mzh9LHt4OjUuMDU5Njc5NzY3MTAzMzQ4LCB5OjAuODA0OTQ5MDUzODU3MzUwOH0se3g6NS4xMDE4OTIyODUyOTgzOTg2LCB5OjAuODA0OTQ5MDUzODU3MzUwOH0se3g6NS4xMzM5MTU1NzQ5NjM2MSwgeTowLjgwMDU4MjI0MTYzMDI3NjZ9LHt4OjUuMTQxMTkzNTk1MzQyMDY3LCB5OjAuNzkzMzA0MjIxMjUxODE5NX0se3g6NS4xNDI2NDkxOTk0MTc3NTgsIHk6MC43NzAwMTQ1NTYwNDA3NTY5fSx7eDo1LjE0NTU2MDQwNzU2OTE0MSwgeTowLjc0MzgxMzY4MjY3ODMxMTV9LHt4OjUuMTQyNjQ5MTk5NDE3NzU4LCB5OjAuNzMzNjI0NDU0MTQ4NDcxN30se3g6NS4xNTEzODI4MjM4NzE5MDcsIHk6MC43MjYzNDY0MzM3NzAwMTQ1fSx7eDo1LjE0MjY0OTE5OTQxNzc1OCwgeTowLjcyMDUyNDAxNzQ2NzI0ODl9LHt4OjUuMTQ4NDcxNjE1NzIwNTI0LCB5OjAuNzEzMjQ1OTk3MDg4NzkxOX0se3g6NS4xMzUzNzExNzkwMzkzMDIsIHk6MC43MDQ1MTIzNzI2MzQ2NDM0fSx7eDo1LjE1MTM4MjgyMzg3MTkwNywgeTowLjcwMTYwMTE2NDQ4MzI2MDZ9LHt4OjUuMTM2ODI2NzgzMTE0OTkyNSwgeTowLjY5NTc3ODc0ODE4MDQ5NDl9LHt4OjUuMTQ3MDE2MDExNjQ0ODMyNSwgeTowLjY4ODUwMDcyNzgwMjAzNzl9LHt4OjUuMTM5NzM3OTkxMjY2Mzc2LCB5OjAuNjgxMjIyNzA3NDIzNTgwOH0se3g6NS4xMzk3Mzc5OTEyNjYzNzYsIHk6MC42NTc5MzMwNDIyMTI1MTgyfSx7eDo1LjE0NDEwNDgwMzQ5MzQ1LCB5OjAuNjE3MTc2MTI4MDkzMTU4N30se3g6NS4xNDI2NDkxOTk0MTc3NTgsIHk6MC41Nzc4NzQ4MTgwNDk0OTA2fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEzID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4wNTQzMzg5ODMwNTA4NDc0NiwgeToyLjM2OTc1NDIzNzI4ODEzNTd9LHt4OjAuMDUzNDkxNTI1NDIzNzI4ODE0LCB5OjIuNDEyMTI3MTE4NjQ0MDY4fSx7eDowLjA2ODc0NTc2MjcxMTg2NDQsIHk6Mi40MzA3NzExODY0NDA2Nzh9LHt4OjAuMDg0ODQ3NDU3NjI3MTE4NjUsIHk6Mi40MjgyMjg4MTM1NTkzMjI0fSx7eDowLjA5MTYyNzExODY0NDA2Nzc5LCB5OjIuNDAxMTEwMTY5NDkxNTI2fSx7eDowLjA4OTkzMjIwMzM4OTgzMDUsIHk6Mi4zNzIyOTY2MTAxNjk0OTJ9LHt4OjAuMDczODMwNTA4NDc0NTc2MjcsIHk6Mi4zMzkyNDU3NjI3MTE4NjV9LHt4OjAuMDY0NTA4NDc0NTc2MjcxMTgsIHk6Mi4zMTg5MDY3Nzk2NjEwMTd9LHt4OjAuMDYwMjcxMTg2NDQwNjc3OTcsIHk6Mi4zNDc3MjAzMzg5ODMwNTF9KSxcbiAgbmV3IEFycmF5KHt4OjAuMDY5NTkzMjIwMzM4OTgzMDUsIHk6Mi4zNDUxNzc5NjYxMDE2OTV9LHt4OjAuMDgyMzA1MDg0NzQ1NzYyNzIsIHk6Mi4zNTc4ODk4MzA1MDg0NzQ2fSx7eDowLjA4NjU0MjM3Mjg4MTM1NTkzLCB5OjIuMzgyNDY2MTAxNjk0OTE1Nn0se3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjM5NzcyMDMzODk4MzA1MX0se3g6MC4wNjAyNzExODY0NDA2Nzc5NywgeToyLjQxMDQzMjIwMzM4OTgzMX0se3g6MC4wNTM0OTE1MjU0MjM3Mjg4MTQsIHk6Mi40MjIyOTY2MTAxNjk0OTE2fSx7eDowLjA2OTU5MzIyMDMzODk4MzA1LCB5OjIuNDM3NTUwODQ3NDU3NjI3fSx7eDowLjA4MzE1MjU0MjM3Mjg4MTM2LCB5OjIuNDM1ODU1OTMyMjAzMzl9LHt4OjAuMDg3Mzg5ODMwNTA4NDc0NTcsIHk6Mi40MjgyMjg4MTM1NTkzMjI0fSx7eDowLjA4ODIzNzI4ODEzNTU5MzIxLCB5OjIuNDEwNDMyMjAzMzg5ODMxfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEzUyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjUuMTQ1NTYwNDA3NTY5MTQxLCB5OjAuNTkyNDMwODU4ODA2NDA0N30se3g6NS4xNjE1NzIwNTI0MDE3NDY1LCB5OjAuNTc3ODc0ODE4MDQ5NDkwNn0se3g6NS4xNjQ0ODMyNjA1NTMxMywgeTowLjU1NDU4NTE1MjgzODQyNzl9LHt4OjUuMTU0Mjk0MDMyMDIzMjksIHk6MC41MzU2NjIyOTk4NTQ0Mzk2fSx7eDo1LjEyNjYzNzU1NDU4NTE1MywgeTowLjUyOTgzOTg4MzU1MTY3NH0se3g6NS4xMjY2Mzc1NTQ1ODUxNTMsIHk6MC41MTIzNzI2MzQ2NDMzNzd9LHt4OjUuMTMzOTE1NTc0OTYzNjEsIHk6MC40OTYzNjA5ODk4MTA3NzE1fSx7eDo1LjE1NzIwNTI0MDE3NDY3MiwgeTowLjUwMDcyNzgwMjAzNzg0NTd9LHt4OjUuMTU4NjYwODQ0MjUwMzY0LCB5OjAuNTE1MjgzODQyNzk0NzU5OH0se3g6NS4xNDQxMDQ4MDM0OTM0NSwgeTowLjUzODU3MzUwODAwNTgyMjR9LHt4OjUuMTI2NjM3NTU0NTg1MTUzLCB5OjAuNTYwNDA3NTY5MTQxMTkzNn0se3g6NS4xMjk1NDg3NjI3MzY1MzYsIHk6MC41ODA3ODYwMjYyMDA4NzM0fSx7eDo1LjE1MTM4MjgyMzg3MTkwNywgeTowLjU4OTUxOTY1MDY1NTAyMTl9LHt4OjUuMTQ4NDcxNjE1NzIwNTI0LCB5OjAuNjA4NDQyNTAzNjM5MDEwMn0se3g6NS4xMjA4MTUxMzgyODIzODcsIHk6MC42MDExNjQ0ODMyNjA1NTMyfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE0ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMDMzMDUwODQ3NDU3NjI3MiwgeToyLjU3NTQyMzcyODgxMzU1OTV9LHt4OjAuMTIxMTAxNjk0OTE1MjU0MjQsIHk6Mi41NzQ1NzYyNzExODY0NDF9LHt4OjAuMTMxMjcxMTg2NDQwNjc3OTgsIHk6Mi41NzQ1NzYyNzExODY0NDF9LHt4OjAuMTM4MDUwODQ3NDU3NjI3MTMsIHk6Mi41NzQ1NzYyNzExODY0NDF9LHt4OjAuMTQyMjg4MTM1NTkzMjIwMzQsIHk6Mi41NzYyNzExODY0NDA2Nzc4fSx7eDowLjE0NTY3Nzk2NjEwMTY5NDkyLCB5OjIuNTgyMjAzMzg5ODMwNTA4Nn0se3g6MC4xNDY1MjU0MjM3Mjg4MTM1NSwgeToyLjU5NDkxNTI1NDIzNzI4OH0se3g6MC4xNDM5ODMwNTA4NDc0NTc2LCB5OjIuNjE2MTAxNjk0OTE1MjU0Mn0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNFMgPSBuZXcgQXJyYXkoXG4gIC8vbmV3IEFycmF5KHt4OjUuMTQ5OTI3MjE5Nzk2MjE2LCB5OjAuNTYwNDA3NTY5MTQxMTkzNn0se3g6NS4xODA0OTQ5MDUzODU3MzUsIHk6MC41NjA0MDc1NjkxNDExOTM2fSx7eDo1LjIwMjMyODk2NjUyMTEwNiwgeTowLjU1MzEyOTU0ODc2MjczNjZ9LHt4OjUuMjA1MjQwMTc0NjcyNDg5LCB5OjAuNTUzMTI5NTQ4NzYyNzM2Nn0se3g6NS4yMDgxNTEzODI4MjM4NzIsIHk6MC41NDg3NjI3MzY1MzU2NjIzfSx7eDo1LjIxMTA2MjU5MDk3NTI1NSwgeTowLjU0MDAyOTExMjA4MTUxMzh9LHt4OjUuMjA1MjQwMTc0NjcyNDg5LCB5OjAuNTM1NjYyMjk5ODU0NDM5Nn0se3g6NS4yMTM5NzM3OTkxMjY2MzgsIHk6MC41MzEyOTU0ODc2MjczNjUzfSx7eDo1LjIwNTI0MDE3NDY3MjQ4OSwgeTowLjUyNjkyODY3NTQwMDI5MTF9LHt4OjUuMjEyNTE4MTk1MDUwOTQ2LCB5OjAuNTIxMTA2MjU5MDk3NTI1NX0se3g6NS4yMDUyNDAxNzQ2NzI0ODksIHk6MC41MTgxOTUwNTA5NDYxNDI2fSx7eDo1LjIxMjUxODE5NTA1MDk0NiwgeTowLjUxNTI4Mzg0Mjc5NDc1OTh9LHt4OjUuMjAzNzg0NTcwNTk2Nzk4LCB5OjAuNTA4MDA1ODIyNDE2MzAyOH0se3g6NS4yMTM5NzM3OTkxMjY2MzgsIHk6MC40OTQ5MDUzODU3MzUwODAxfSx7eDo1LjE5Nzk2MjE1NDI5NDAzMiwgeTowLjQ4NjE3MTc2MTI4MDkzMTZ9LHt4OjUuMjEyNTE4MTk1MDUwOTQ2LCB5OjAuNDc0NTI2OTI4Njc1NDAwM30se3g6NS4yMTI1MTgxOTUwNTA5NDYsIHk6MC40NTI2OTI4Njc1NDAwMjkxM30se3g6NS4yMDk2MDY5ODY4OTk1NjMsIHk6MC40MDkwMjQ3NDUyNjkyODY3fSlcbiAgbmV3IEFycmF5KHt4OjUuMTU3MzMwMTU0OTQ2MzY1LCB5OjAuNTY0OTU4MjgzNjcxMDM3fSx7eDo1LjE3NjQwMDQ3Njc1ODA0NiwgeTowLjU2MTM4MjU5ODMzMTM0Njh9LHt4OjUuMTkxODk1MTEzMjMwMDM2LCB5OjAuNTUzMDM5MzMyNTM4NzM2Nn0se3g6NS4yMDAyMzgzNzkwMjI2NDYsIHk6MC41NTQyMzEyMjc2NTE5NjY2fSx7eDo1LjIwNjE5Nzg1NDU4ODc5NywgeTowLjU1MTg0NzQzNzQyNTUwNjZ9LHt4OjUuMjEwOTY1NDM1MDQxNzE2LCB5OjAuNTQxMTIwMzgxNDA2NDM2M30se3g6NS4yMDYxOTc4NTQ1ODg3OTcsIHk6MC41MzE1ODUyMjA1MDA1OTZ9LHt4OjUuMjEyMTU3MzMwMTU0OTQ2LCB5OjAuNTI4MDA5NTM1MTYwOTA1OX0se3g6NS4yMDUwMDU5NTk0NzU1NjYsIHk6MC41MjQ0MzM4NDk4MjEyMTU4fSx7eDo1LjIxMDk2NTQzNTA0MTcxNiwgeTowLjUyMDg1ODE2NDQ4MTUyNTd9LHt4OjUuMjA3Mzg5NzQ5NzAyMDI2LCB5OjAuNTE0ODk4Njg4OTE1Mzc1NX0se3g6NS4yMTQ1NDExMjAzODE0MDcsIHk6MC41MDg5MzkyMTMzNDkyMjUzfSx7eDo1LjIwNjE5Nzg1NDU4ODc5NywgeTowLjUwNDE3MTYzMjg5NjMwNTJ9LHt4OjUuMjEwOTY1NDM1MDQxNzE2LCB5OjAuNDk4MjEyMTU3MzMwMTU0OTV9LHt4OjUuMjA3Mzg5NzQ5NzAyMDI2LCB5OjAuNDk0NjM2NDcxOTkwNDY0ODR9LHt4OjUuMjEzMzQ5MjI1MjY4MTc3LCB5OjAuNDkyMjUyNjgxNzY0MDA0OH0se3g6NS4yMDYxOTc4NTQ1ODg3OTcsIHk6MC40ODg2NzY5OTY0MjQzMTQ2N30se3g6NS4yMTA5NjU0MzUwNDE3MTYsIHk6MC40ODE1MjU2MjU3NDQ5MzQ0Nn0se3g6NS4yMTIxNTczMzAxNTQ5NDYsIHk6MC40Njk2MDY2NzQ2MTI2MzQxfSx7eDo1LjIxNDU0MTEyMDM4MTQwNywgeTowLjQzMTQ2NjAzMDk4OTI3Mjk0fSx7eDo1LjIwOTc3MzUzOTkyODQ4NiwgeTowLjQxMzU4NzYwNDI5MDgyMjR9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTUgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjEyOTc2MjcxMTg2NDQwNjgsIHk6Mi4zNjI5NzQ1NzYyNzExODY3fSx7eDowLjExOTU5MzIyMDMzODk4MzA1LCB5OjIuMzcxNDQ5MTUyNTQyMzczfSx7eDowLjExMjgxMzU1OTMyMjAzMzksIHk6Mi4zODkyNDU3NjI3MTE4NjQ2fSx7eDowLjExNjIwMzM4OTgzMDUwODQ3LCB5OjIuNDIyMjk2NjEwMTY5NDkxNn0se3g6MC4xMTYyMDMzODk4MzA1MDg0NywgeToyLjQ0MzQ4MzA1MDg0NzQ1OH0se3g6MC4xMDk0MjM3Mjg4MTM1NTkzMiwgeToyLjQ2NDY2OTQ5MTUyNTQyMzd9LHt4OjAuMTE2MjAzMzg5ODMwNTA4NDcsIHk6Mi40OTAwOTMyMjAzMzg5ODM0fSx7eDowLjEzMTQ1NzYyNzExODY0NDA2LCB5OjIuNDk3NzIwMzM4OTgzMDUxfSx7eDowLjE0NDE2OTQ5MTUyNTQyMzc0LCB5OjIuNDc4MjI4ODEzNTU5MzIyMn0se3g6MC4xMzczODk4MzA1MDg0NzQ2LCB5OjIuNDU1MzQ3NDU3NjI3MTE5fSksXG4gIG5ldyBBcnJheSh7eDowLjE0MDc3OTY2MTAxNjk0OTE2LCB5OjIuNDk4NTY3Nzk2NjEwMTd9LHt4OjAuMTIwNDQwNjc3OTY2MTAxNjgsIHk6Mi40ODgzOTgzMDUwODQ3NDZ9LHt4OjAuMTE1MzU1OTMyMjAzMzg5ODQsIHk6Mi40Nzk5MjM3Mjg4MTM1NTk2fSx7eDowLjEyNDY3Nzk2NjEwMTY5NDkyLCB5OjIuNDYyMTI3MTE4NjQ0MDY4fSx7eDowLjEzOTA4NDc0NTc2MjcxMTg1LCB5OjIuNDU3MDQyMzcyODgxMzU2fSx7eDowLjE0MzMyMjAzMzg5ODMwNTA2LCB5OjIuNDQxNzg4MTM1NTkzMjIwNX0se3g6MC4xMzQsIHk6Mi40MTg5MDY3Nzk2NjEwMTczfSx7eDowLjExNDUwODQ3NDU3NjI3MTE4LCB5OjIuNDA3ODg5ODMwNTA4NDc1fSx7eDowLjExMDI3MTE4NjQ0MDY3Nzk3LCB5OjIuMzg1ODU1OTMyMjAzMzl9LHt4OjAuMTE4NzQ1NzYyNzExODY0NDIsIHk6Mi4zNzIyOTY2MTAxNjk0OTJ9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTVTID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6NS4yMDM3ODQ1NzA1OTY3OTgsIHk6MC4zOTU5MjQzMDg1ODgwNjQwNH0se3g6NS4xOTY1MDY1NTAyMTgzNDA1LCB5OjAuMzgxMzY4MjY3ODMxMTQ5OX0se3g6NS4yMDY2OTU3Nzg3NDgxODA1LCB5OjAuMzY4MjY3ODMxMTQ5OTI3Mn0se3g6NS4yMTk3OTYyMTU0Mjk0MDMsIHk6MC4zNjY4MTIyMjcwNzQyMzU4M30se3g6NS4yMjg1Mjk4Mzk4ODM1NTIsIHk6MC4zNTIyNTYxODYzMTczMjE3fSx7eDo1LjIyNTYxODYzMTczMjE2OSwgeTowLjM0MjA2Njk1Nzc4NzQ4MTh9LHt4OjUuMjA4MTUxMzgyODIzODcyLCB5OjAuMzMxODc3NzI5MjU3NjQxOX0se3g6NS4yMDA4NzMzNjI0NDU0MTUsIHk6MC4zMjAyMzI4OTY2NTIxMTA2M30se3g6NS4yMDIzMjg5NjY1MjExMDYsIHk6MC4zMDEzMTAwNDM2NjgxMjIyNX0se3g6NS4yMTI1MTgxOTUwNTA5NDYsIHk6MC4yOTU0ODc2MjczNjUzNTY2fSx7eDo1LjIyODUyOTgzOTg4MzU1MiwgeTowLjMwNTY3Njg1NTg5NTE5NjV9LHt4OjUuMjI0MTYzMDI3NjU2NDc3LCB5OjAuMzI0NTk5NzA4ODc5MTg0OX0se3g6NS4yMDgxNTEzODI4MjM4NzIsIHk6MC4zMjg5NjY1MjExMDYyNTkxfSx7eDo1LjE5NTA1MDk0NjE0MjY0OSwgeTowLjM0OTM0NDk3ODE2NTkzODg1fSx7eDo1LjIyMjcwNzQyMzU4MDc4NiwgeTowLjM2ODI2NzgzMTE0OTkyNzJ9LHt4OjUuMjE2ODg1MDA3Mjc4MDIsIHk6MC40MDAyOTExMjA4MTUxMzgzfSx7eDo1LjE5Nzk2MjE1NDI5NDAzMiwgeTowLjQxNDg0NzE2MTU3MjA1MjR9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTYgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjE0NjUyNTQyMzcyODgxMzU1LCB5OjIuNzExMDE2OTQ5MTUyNTQyfSx7eDowLjE0NjUyNTQyMzcyODgxMzU1LCB5OjIuNzI0NTc2MjcxMTg2NDQwN30se3g6MC4xNDczNzI4ODEzNTU5MzIxOCwgeToyLjcyOTY2MTAxNjk0OTE1MjR9LHt4OjAuMTQ1Njc3OTY2MTAxNjk0OTIsIHk6Mi43NDE1MjU0MjM3Mjg4MTM2fSx7eDowLjE0NTY3Nzk2NjEwMTY5NDkyLCB5OjIuNzc5NjYxMDE2OTQ5MTUyN30se3g6MC4xMzcyMDMzODk4MzA1MDg0NSwgeToyLjc4ODk4MzA1MDg0NzQ1OH0se3g6MC4xNDU2Nzc5NjYxMDE2OTQ5MiwgeToyLjc5MzIyMDMzODk4MzA1MDh9LHt4OjAuMTM4ODk4MzA1MDg0NzQ1NzcsIHk6Mi43OTc0NTc2MjcxMTg2NDR9LHt4OjAuMTQ1Njc3OTY2MTAxNjk0OTIsIHk6Mi44fSx7eDowLjEzODA1MDg0NzQ1NzYyNzEzLCB5OjIuODA0MjM3Mjg4MTM1NTkzM30se3g6MC4xNDY1MjU0MjM3Mjg4MTM1NSwgeToyLjgwNzYyNzExODY0NDA2OH0se3g6MC4xMzk3NDU3NjI3MTE4NjQ0LCB5OjIuODExODY0NDA2Nzc5NjYxfSx7eDowLjE0NjUyNTQyMzcyODgxMzU1LCB5OjIuODE3Nzk2NjEwMTY5NDkxM30se3g6MC4xMzg4OTgzMDUwODQ3NDU3NywgeToyLjgyMzcyODgxMzU1OTMyMn0se3g6MC4xNDQ4MzA1MDg0NzQ1NzYzLCB5OjIuODI2MjcxMTg2NDQwNjc3OH0se3g6MC4xNDA1OTMyMjAzMzg5ODMwMywgeToyLjgzMTM1NTkzMjIwMzM5fSx7eDowLjE0MzEzNTU5MzIyMDMzODk3LCB5OjIuODMzODk4MzA1MDg0NzQ2fSx7eDowLjE0Mzk4MzA1MDg0NzQ1NzYsIHk6Mi44NDIzNzI4ODEzNTU5MzI0fSx7eDowLjE0Mzk4MzA1MDg0NzQ1NzYsIHk6Mi44NDY2MTAxNjk0OTE1MjUzfSx7eDowLjEzOTc0NTc2MjcxMTg2NDQsIHk6Mi44NTA4NDc0NTc2MjcxMTg4fSx7eDowLjEyMzY0NDA2Nzc5NjYxMDE0LCB5OjIuODUwODQ3NDU3NjI3MTE4OH0se3g6MC4xMDkyMzcyODgxMzU1OTMxOSwgeToyLjg1NDIzNzI4ODEzNTU5M30se3g6MC4wOTE0NDA2Nzc5NjYxMDE2NywgeToyLjg2MjcxMTg2NDQwNjc3OTV9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTZTID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6NS4yMTEwNjI1OTA5NzUyNTUsIHk6MC4yOTExMjA4MTUxMzgyODIzNn0se3g6NS4yMTM5NzM3OTkxMjY2MzgsIHk6MC4yNzgwMjAzNzg0NTcwNTk3fSx7eDo1LjIxMjUxODE5NTA1MDk0NiwgeTowLjI2NDkxOTk0MTc3NTgzN30se3g6NS4yMTI1MTgxOTUwNTA5NDYsIHk6MC4yNTQ3MzA3MTMyNDU5OTcxfSx7eDo1LjIwOTYwNjk4Njg5OTU2MywgeTowLjI1MDM2MzkwMTAxODkyMjg2fSx7eDo1LjE5OTQxNzc1ODM2OTcyNCwgeTowLjI0NTk5NzA4ODc5MTg0ODYyfSx7eDo1LjE5MDY4NDEzMzkxNTU3NSwgeTowLjI0NTk5NzA4ODc5MTg0ODYyfSx7eDo1LjE2ODg1MDA3Mjc4MDIwNCwgeTowLjI0NTk5NzA4ODc5MTg0ODYyfSx7eDo1LjEzODI4MjM4NzE5MDY4NCwgeTowLjI3ODAyMDM3ODQ1NzA1OTd9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTcgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjA2OTU5MzIyMDMzODk4MzA1LCB5OjIuNTkxNzg4MTM1NTkzMjIwNH0se3g6MC4wNTM0OTE1MjU0MjM3Mjg4MTQsIHk6Mi41Njg5MDY3Nzk2NjEwMTd9LHt4OjAuMDUyNjQ0MDY3Nzk2NjEwMTcsIHk6Mi41NDQzMzA1MDg0NzQ1NzY2fSx7eDowLjA2NTM1NTkzMjIwMzM4OTgyLCB5OjIuNTMyNDY2MTAxNjk0OTE1NX0se3g6MC4wODY1NDIzNzI4ODEzNTU5MywgeToyLjU0Njg3Mjg4MTM1NTkzMjN9LHt4OjAuMDg1Njk0OTE1MjU0MjM3MywgeToyLjU3MDYwMTY5NDkxNTI1NDZ9LHt4OjAuMDY4NzQ1NzYyNzExODY0NCwgeToyLjU4OTI0NTc2MjcxMTg2NX0se3g6MC4wNTk0MjM3Mjg4MTM1NTkzMjYsIHk6Mi42MTYzNjQ0MDY3Nzk2NjF9LHt4OjAuMDU2MDMzODk4MzA1MDg0NzUsIHk6Mi42NDg1Njc3OTY2MTAxNjk3fSx7eDowLjA3Mjk4MzA1MDg0NzQ1NzYzLCB5OjIuNjY4OTA2Nzc5NjYxMDE3M30se3g6MC4wODMxNTI1NDIzNzI4ODEzNiwgeToyLjY1Nzg4OTgzMDUwODQ3NX0se3g6MC4wODQ4NDc0NTc2MjcxMTg2NSwgeToyLjY0MDA5MzIyMDMzODk4MzN9LHt4OjAuMDgyMzA1MDg0NzQ1NzYyNzIsIHk6Mi42MjkwNzYyNzExODY0NDF9LHt4OjAuMDY2MjAzMzg5ODMwNTA4NDcsIHk6Mi42MTQ2Njk0OTE1MjU0MjR9LHt4OjAuMDYyODEzNTU5MzIyMDMzOSwgeToyLjU4NDE2MTAxNjk0OTE1Mjd9KSxcbiAgbmV3IEFycmF5KHt4OjAuMDU3NzI4ODEzNTU5MzIyMDQsIHk6Mi41NzA2MDE2OTQ5MTUyNTQ2fSx7eDowLjA1NzcyODgxMzU1OTMyMjA0LCB5OjIuNTkxNzg4MTM1NTkzMjIwNH0se3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjYxMTI3OTY2MTAxNjk0OTN9LHt4OjAuMDg0LCB5OjIuNjI3MzgxMzU1OTMyMjAzNX0se3g6MC4wODQ4NDc0NTc2MjcxMTg2NSwgeToyLjY1MjgwNTA4NDc0NTc2Mjd9LHt4OjAuMDc4OTE1MjU0MjM3Mjg4MTQsIHk6Mi42Njg5MDY3Nzk2NjEwMTczfSx7eDowLjA2MTExODY0NDA2Nzc5NjYxNSwgeToyLjY2MTI3OTY2MTAxNjk0OX0se3g6MC4wNTc3Mjg4MTM1NTkzMjIwNCwgeToyLjY0MTc4ODEzNTU5MzIyMDd9LHt4OjAuMDc4MDY3Nzk2NjEwMTY5NSwgeToyLjYxMzgyMjAzMzg5ODMwNTR9LHt4OjAuMDc0Njc3OTY2MTAxNjk0OTEsIHk6Mi41OTUxNzc5NjYxMDE2OTV9LHt4OjAuMDU4NTc2MjcxMTg2NDQwNjgsIHk6Mi41ODA3NzExODY0NDA2Nzh9LHt4OjAuMDU1MTg2NDQwNjc3OTY2MSwgeToyLjU2MjEyNzExODY0NDA2OH0se3g6MC4wNTUxODY0NDA2Nzc5NjYxLCB5OjIuNTQxNzg4MTM1NTkzMjIwNn0se3g6MC4wNzIxMzU1OTMyMjAzMzg5OCwgeToyLjUzNTAwODQ3NDU3NjI3MTV9LHt4OjAuMDg0ODQ3NDU3NjI3MTE4NjUsIHk6Mi41NDk0MTUyNTQyMzcyODgzfSx7eDowLjA3MzgzMDUwODQ3NDU3NjI3LCB5OjIuNTc1Njg2NDQwNjc3OTY2M30se3g6MC4wNzM4MzA1MDg0NzQ1NzYyNywgeToyLjYyMTQ0OTE1MjU0MjM3M30se3g6MC4wNzk3NjI3MTE4NjQ0MDY3OCwgeToyLjYzMzMxMzU1OTMyMjAzNDN9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTdTID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6NS4xNDcwMTYwMTE2NDQ4MzI1LCB5OjAuMjQ3NDUyNjkyODY3NTQwMDR9LHt4OjUuMTMyNDU5OTcwODg3OTE4LCB5OjAuMjY3ODMxMTQ5OTI3MjE5OH0se3g6NS4xMzY4MjY3ODMxMTQ5OTI1LCB5OjAuMjk2OTQzMjMxNDQxMDQ4MDZ9LHt4OjUuMTU0Mjk0MDMyMDIzMjksIHk6MC4zMjE2ODg1MDA3Mjc4MDIwM30se3g6NS4xNTEzODI4MjM4NzE5MDcsIHk6MC4zNTY2MjI5OTg1NDQzOTU5NH0se3g6NS4xMzEwMDQzNjY4MTIyMjcsIHk6MC4zNTIyNTYxODYzMTczMjE3fSx7eDo1LjEzMjQ1OTk3MDg4NzkxOCwgeTowLjMyMTY4ODUwMDcyNzgwMjAzfSx7eDo1LjE1MjgzODQyNzk0NzU5OCwgeTowLjI5MjU3NjQxOTIxMzk3Mzh9LHt4OjUuMTUyODM4NDI3OTQ3NTk4LCB5OjAuMjUwMzYzOTAxMDE4OTIyODZ9LHt4OjUuMTMzOTE1NTc0OTYzNjEsIHk6MC4yNDAxNzQ2NzI0ODkwODI5N30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOCA9IG5ldyBBcnJheShcbiAgLy9uZXcgQXJyYXkoe3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjY1NTM0NzQ1NzYyNzExODh9LHt4OjAuMDcyOTgzMDUwODQ3NDU3NjMsIHk6Mi42NzA2MDE2OTQ5MTUyNTQyfSx7eDowLjA2NDUwODQ3NDU3NjI3MTE4LCB5OjIuNjkxNzg4MTM1NTkzMjIwNX0se3g6MC4wNzQ2Nzc5NjYxMDE2OTQ5MSwgeToyLjY5ODU2Nzc5NjYxMDE2OTV9LHt4OjAuMDY0NTA4NDc0NTc2MjcxMTgsIHk6Mi43MDM2NTI1NDIzNzI4ODE3fSwge3g6MC4wNjc4OTgzMDUwODQ3NDU3NiwgeToyLjc2MDYwMTY5NDkxNTI1NDN9LHt4OjAuMDc5NzYyNzExODY0NDA2NzgsIHk6Mi43NjgyMjg4MTM1NTkzMjJ9LHt4OjAuMTA1MTg2NDQwNjc3OTY2MSwgeToyLjc2ODIyODgxMzU1OTMyMn0se3g6MC4xMzA2MTAxNjk0OTE1MjU0MywgeToyLjc2ODIyODgxMzU1OTMyMn0se3g6MC4xNTA5NDkxNTI1NDIzNzI5LCB5OjIuNzgxNjE4NjQ0MDY3Nzk3fSx7eDowLjE1MjY0NDA2Nzc5NjYxMDE2LCB5OjIuNzk2MDI1NDIzNzI4ODEzNn0se3g6MC4xNTM0OTE1MjU0MjM3Mjg4LCB5OjIuODE1NTE2OTQ5MTUyNTQyNX0se3g6MC4xNTQzMzg5ODMwNTA4NDc0OCwgeToyLjg0NTE3Nzk2NjEwMTY5NX0se3g6MC4xNjAyNzExODY0NDA2Nzc5NSwgeToyLjg1ODczNzI4ODEzNTU5MzJ9LHt4OjAuMTc2MzcyODgxMzU1OTMyMiwgeToyLjg1MTI3OTY2MTAxNjk0OTN9LHt4OjAuMTgzMTUyNTQyMzcyODgxMzcsIHk6Mi44NDc4ODk4MzA1MDg0NzQ2fSx7eDowLjE4NjU0MjM3Mjg4MTM1NTk0LCB5OjIuODU1NTE2OTQ5MTUyNTQyN30se3g6MC4xOTA3Nzk2NjEwMTY5NDkxNSwgeToyLjg0Nzg4OTgzMDUwODQ3NDZ9LHt4OjAuMTk2NzExODY0NDA2Nzc5NjgsIHk6Mi44NTM4MjIwMzM4OTgzMDU0fSx7eDowLjIwMDk0OTE1MjU0MjM3MjksIHk6Mi44NDUzNDc0NTc2MjcxMTl9LHt4OjAuMjA2ODgxMzU1OTMyMjAzNDEsIHk6Mi44NTQ2Njk0OTE1MjU0MjR9LHt4OjAuMjEwMjcxMTg2NDQwNjc4LCB5OjIuODQ0NTAwMDAwMDAwMDAwM30se3g6MC4yMTQ1MDg0NzQ1NzYyNzEyLCB5OjIuODU0NjY5NDkxNTI1NDI0fSx7eDowLjIxOTU5MzIyMDMzODk4MzA0LCB5OjIuODQ0NTAwMDAwMDAwMDAwM30se3g6MC4yMjQ2Nzc5NjYxMDE2OTQ5NCwgeToyLjg0MzgyMjAzMzg5ODMwNTR9LHt4OjAuMjI4MDY3Nzk2NjEwMTY5NTIsIHk6Mi44NDM2NTI1NDIzNzI4ODE2fSx7eDowLjIzMDYxMDE2OTQ5MTUyNTQsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjI0OTI1NDIzNzI4ODEzNTU2LCB5OjIuODYwNDMyMjAzMzg5ODMwNn0se3g6MC4yODE0NTc2MjcxMTg2NDQsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjM0NjcxMTg2NDQwNjc3OTY1LCB5OjIuODUxMjc5NjYxMDE2OTQ5M30se3g6MC4zODkwODQ3NDU3NjI3MTE4NSwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuNDAzNDkxNTI1NDIzNzI4OCwgeToyLjg0ODczNzI4ODEzNTU5MzJ9LHt4OjAuNDA2MDMzODk4MzA1MDg0NzQsIHk6Mi44NDUzNDc0NTc2MjcxMTl9LHt4OjAuNDExMTE4NjQ0MDY3Nzk2NiwgeToyLjg1NjM2NDQwNjc3OTY2MX0se3g6MC40MTYyMDMzODk4MzA1MDg1LCB5OjIuODU1MzQ3NDU3NjI3MTE5fSx7eDowLjQxODc0NTc2MjcxMTg2NDM3LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40MjYzNzI4ODEzNTU5MzIyLCB5OjIuODUyODA1MDg0NzQ1NzYzfSx7eDowLjQyODA2Nzc5NjYxMDE2OTQ3LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40MzE0NTc2MjcxMTg2NDQwNSwgeToyLjg0MzY1MjU0MjM3Mjg4MTZ9LHt4OjAuNDM0LCB5OjIuODUyOTc0NTc2MjcxMTg2N30se3g6MC40MzQsIHk6Mi44NDYxOTQ5MTUyNTQyMzc2fSx7eDowLjQ0MTYyNzExODY0NDA2NzgsIHk6Mi44NTYzNjQ0MDY3Nzk2NjF9LHt4OjAuNDQ1MDE2OTQ5MTUyNTQyMzYsIHk6Mi44NDUzNDc0NTc2MjcxMTl9LHt4OjAuNDUwMTAxNjk0OTE1MjU0MiwgeToyLjg1MTI3OTY2MTAxNjk0OTN9LHt4OjAuNDYzNjYxMDE2OTQ5MTUyNSwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuNDg0LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC40OTQxNjk0OTE1MjU0MjM2NywgeToyLjg2ODA1OTMyMjAzMzg5ODR9LHt4OjAuNDk3NTU5MzIyMDMzODk4MywgeToyLjg4NzU1MDg0NzQ1NzYyNzJ9LHt4OjAuNDk3NTU5MzIyMDMzODk4MywgeToyLjkyNTY4NjQ0MDY3Nzk2NjN9LHt4OjAuNDk2NzExODY0NDA2Nzc5NiwgeToyLjk1MjgwNTA4NDc0NTc2M30se3g6MC40OTc1NTkzMjIwMzM4OTgzLCB5OjIuOTgwNzcxMTg2NDQwNjc4M30sIHt4OjAuNDg0ODQ3NDU3NjI3MTE4NjcsIHk6My4wMDM2NTI1NDIzNzI4ODE1fSx7eDowLjQ2MjgxMzU1OTMyMjAzMzksIHk6My4wMTI5NzQ1NzYyNzExODY2fSx7eDowLjQ0MjQ3NDU3NjI3MTE4NjQsIHk6My4wMTM4MjIwMzM4OTgzMDUzfSx7eDowLjQzMjMwNTA4NDc0NTc2MjcsIHk6My4wMTgwNTkzMjIwMzM4OTgzfSx7eDowLjQyNzIyMDMzODk4MzA1MDg0LCB5OjMuMDI5MDc2MjcxMTg2NDQwN30se3g6MC40MjYzNzI4ODEzNTU5MzIyLCB5OjMuMDYyOTc0NTc2MjcxMTg2NH0se3g6MC40Mjk3NjI3MTE4NjQ0MDY4LCB5OjMuMTAxMTEwMTY5NDkxNTI1NX0se3g6MC40MjM4MzA1MDg0NzQ1NzYyNiwgeTozLjExMzgyMjAzMzg5ODMwNTR9LHt4OjAuMzg1Njk0OTE1MjU0MjM3MjcsIHk6My4xMTgwNTkzMjIwMzM4OTg0fSx7eDowLjM1Njg4MTM1NTkzMjIwMzQsIHk6My4xMTcyMTE4NjQ0MDY3Nzk3fSx7eDowLjM0NTg2NDQwNjc3OTY2MSwgeTozLjEwODczNzI4ODEzNTU5MzJ9LHt4OjAuMzQ1ODY0NDA2Nzc5NjYxLCB5OjMuMDk1MTc3OTY2MTAxNjk1fSx7eDowLjM0MzMyMjAzMzg5ODMwNTA3LCB5OjMuMDIzMTQ0MDY3Nzk2NjEwNH0pXG4gIG5ldyBBcnJheSh7eDowLjA4NTUwODQ3NDU3NjI3MTIsIHk6Mi44ODk4MzA1MDg0NzQ1NzZ9LHt4OjAuMDgyOTY2MTAxNjk0OTE1MjUsIHk6Mi45MDY3Nzk2NjEwMTY5NDl9LHt4OjAuMDg0NjYxMDE2OTQ5MTUyNTEsIHk6Mi45MTY5NDkxNTI1NDIzNzI3fSx7eDowLjA4NTUwODQ3NDU3NjI3MTIsIHk6Mi45Mzg5ODMwNTA4NDc0NTc3fSx7eDowLjA4MzgxMzU1OTMyMjAzMzg4LCB5OjIuOTYzNTU5MzIyMDMzODk4M30se3g6MC4wNzc4ODEzNTU5MzIyMDMzNiwgeToyLjk3MDMzODk4MzA1MDg0NzN9LHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeToyLjk3NDU3NjI3MTE4NjQ0MDd9LHt4OjAuMDgxMjcxMTg2NDQwNjc3OTMsIHk6Mi45Nzc5NjYxMDE2OTQ5MTV9LHt4OjAuMDg0NjYxMDE2OTQ5MTUyNTEsIHk6Mi45ODIyMDMzODk4MzA1MDg1fSx7eDowLjA3OTU3NjI3MTE4NjQ0MDY3LCB5OjIuOTg1NTkzMjIwMzM4OTgzMn0se3g6MC4wODQ2NjEwMTY5NDkxNTI1MSwgeToyLjk4OTgzMDUwODQ3NDU3Nn0se3g6MC4wODA0MjM3Mjg4MTM1NTkzLCB5OjIuOTk1NzYyNzExODY0NDA2Nn0se3g6MC4wODYzNTU5MzIyMDMzODk4MywgeToyLjk5OTE1MjU0MjM3Mjg4MTN9LHt4OjAuMDc4NzI4ODEzNTU5MzIyMDQsIHk6My4wMDUwODQ3NDU3NjI3MTE3fSx7eDowLjA4NTUwODQ3NDU3NjI3MTIsIHk6My4wMDg0NzQ1NzYyNzExODY0fSx7eDowLjA4MDQyMzcyODgxMzU1OTMsIHk6My4wMTI3MTE4NjQ0MDY3OH0se3g6MC4wODI5NjYxMDE2OTQ5MTUyNSwgeTozLjAyMzcyODgxMzU1OTMyMn0se3g6MC4wODI5NjYxMDE2OTQ5MTUyNSwgeTozLjAzNzI4ODEzNTU5MzIyMDR9LHt4OjAuMDgxMjcxMTg2NDQwNjc3OTMsIHk6My4wNjYxMDE2OTQ5MTUyNTQ0fSx7eDowLjA4MTI3MTE4NjQ0MDY3NzkzLCB5OjMuMDk0MDY3Nzk2NjEwMTY5M30se3g6MC4wODU1MDg0NzQ1NzYyNzEyLCB5OjMuMTEyNzExODY0NDA2Nzc5NX0se3g6MC4wOTE0NDA2Nzc5NjYxMDE2NywgeTozLjEyMjAzMzg5ODMwNTA4NDZ9LHt4OjAuMTA1ODQ3NDU3NjI3MTE4NjEsIHk6My4xMjYyNzExODY0NDA2Nzh9LHt4OjAuMTIzNjQ0MDY3Nzk2NjEwMTQsIHk6My4xMjc5NjYxMDE2OTQ5MTU0fSx7eDowLjEzMjk2NjEwMTY5NDkxNTI0LCB5OjMuMTQxNTI1NDIzNzI4ODEzNX0se3g6MC4xMzM4MTM1NTkzMjIwMzM4NywgeTozLjE5MzIyMDMzODk4MzA1MDd9LHt4OjAuMTM3MjAzMzg5ODMwNTA4NDUsIHk6My4yMDg0NzQ1NzYyNzExODY2fSx7eDowLjE0NTY3Nzk2NjEwMTY5NDkyLCB5OjMuMjEzNTU5MzIyMDMzODk4M30se3g6MC4xNTY2OTQ5MTUyNTQyMzczLCB5OjMuMjE1MjU0MjM3Mjg4MTM1Nn0se3g6MC4xNjk0MDY3Nzk2NjEwMTY5MiwgeTozLjIxMTg2NDQwNjc3OTY2MX0se3g6MC4xNzYxODY0NDA2Nzc5NjYwNywgeTozLjIxNzc5NjYxMDE2OTQ5MTd9LHt4OjAuMTgxMjcxMTg2NDQwNjc3OTcsIHk6My4yMDg0NzQ1NzYyNzExODY2fSx7eDowLjE4OTc0NTc2MjcxMTg2NDM5LCB5OjMuMjE3Nzk2NjEwMTY5NDkxN30se3g6MC4xOTE0NDA2Nzc5NjYxMDE3LCB5OjMuMjExMDE2OTQ5MTUyNTQyfSx7eDowLjE5ODIyMDMzODk4MzA1MDg2LCB5OjMuMjE2MTAxNjk0OTE1MjU0M30se3g6MC4yMDMzMDUwODQ3NDU3NjI3LCB5OjMuMjA4NDc0NTc2MjcxMTg2Nn0se3g6MC4yMDgzODk4MzA1MDg0NzQ2LCB5OjMuMjE2OTQ5MTUyNTQyMzczfSx7eDowLjIxMjYyNzExODY0NDA2NzgsIHk6My4yMTEwMTY5NDkxNTI1NDJ9LHt4OjAuMjIxOTQ5MTUyNTQyMzcyODUsIHk6My4yMTYxMDE2OTQ5MTUyNTQzfSx7eDowLjI2ODU1OTMyMjAzMzg5ODMsIHk6My4yMTYxMDE2OTQ5MTUyNTQzfSx7eDowLjM3NTMzODk4MzA1MDg0NzQsIHk6My4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjM4NzIwMzM4OTgzMDUwODQ1LCB5OjMuMjE1MjU0MjM3Mjg4MTM1Nn0se3g6MC4zOTQ4MzA1MDg0NzQ1NzYzLCB5OjMuMjEyNzExODY0NDA2Nzc5Nn0se3g6MC40MDU4NDc0NTc2MjcxMTg2NiwgeTozLjIyMDMzODk4MzA1MDg0NzN9LHt4OjAuNDEwMDg0NzQ1NzYyNzExODcsIHk6My4yMDkzMjIwMzM4OTgzMDUzfSx7eDowLjQyMDI1NDIzNzI4ODEzNTU1LCB5OjMuMjIwMzM4OTgzMDUwODQ3M30se3g6MC40MjcwMzM4OTgzMDUwODQ3LCB5OjMuMjA5MzIyMDMzODk4MzA1M30se3g6MC40MzI5NjYxMDE2OTQ5MTUzLCB5OjMuMjE2OTQ5MTUyNTQyMzczfSx7eDowLjQzODg5ODMwNTA4NDc0NTc1LCB5OjMuMjEwMTY5NDkxNTI1NDIzNX0se3g6MC40NDk5MTUyNTQyMzcyODgxLCB5OjMuMjE2OTQ5MTUyNTQyMzczfSx7eDowLjQ3MTEwMTY5NDkxNTI1NDMsIHk6My4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjQ4NjM1NTkzMjIwMzM4OTg1LCB5OjMuMjE3Nzk2NjEwMTY5NDkxN30se3g6MC40OTQ4MzA1MDg0NzQ1NzYyNywgeTozLjIyMjAzMzg5ODMwNTA4NDd9LHt4OjAuNDk5OTE1MjU0MjM3Mjg4MTYsIHk6My4yMzcyODgxMzU1OTMyMn0se3g6MC40OTk5MTUyNTQyMzcyODgxNiwgeTozLjI3NDU3NjI3MTE4NjQ0MDZ9LHt4OjAuNDk5OTE1MjU0MjM3Mjg4MTYsIHk6My4zMTUyNTQyMzcyODgxMzU3fSx7eDowLjQ5ODIyMDMzODk4MzA1MDgsIHk6My4zNDQ5MTUyNTQyMzcyODh9LHt4OjAuNDk5MDY3Nzk2NjEwMTY5NSwgeTozLjM2MjcxMTg2NDQwNjc3OTV9LCB7eDowLjQ4NjM1NTkzMjIwMzM4OTg1LCB5OjMuMzcyMDMzODk4MzA1MDg0Nn0se3g6MC40Njg1NTkzMjIwMzM4OTgzMywgeTozLjM3OTY2MTAxNjk0OTE1MjN9LHt4OjAuNDU2Njk0OTE1MjU0MjM3MywgeTozLjM3ODgxMzU1OTMyMjAzNH0se3g6MC40NDA1OTMyMjAzMzg5ODMsIHk6My4zODA1MDg0NzQ1NzYyNzF9LHt4OjAuNDMxMjcxMTg2NDQwNjc3OSwgeTozLjM4NTU5MzIyMDMzODk4M30se3g6MC40MjYxODY0NDA2Nzc5NjYxLCB5OjMuMzk0OTE1MjU0MjM3Mjg4Mn0se3g6MC40MjUzMzg5ODMwNTA4NDc0NCwgeTozLjQxNDQwNjc3OTY2MTAxN30se3g6MC40MjQ0OTE1MjU0MjM3Mjg3NSwgeTozLjQ2MDE2OTQ5MTUyNTQyMzV9LHt4OjAuNDI0NDkxNTI1NDIzNzI4NzUsIHk6My40Nzc5NjYxMDE2OTQ5MTV9LHt4OjAuNDE1MTY5NDkxNTI1NDIzNzYsIHk6My40ODgxMzU1OTMyMjAzMzl9LHt4OjAuMzg5NzQ1NzYyNzExODY0NCwgeTozLjQ5MDY3Nzk2NjEwMTY5NX0se3g6MC4zNTE2MTAxNjk0OTE1MjU0LCB5OjMuNDg4MTM1NTkzMjIwMzM5fSx7eDowLjM0MTQ0MDY3Nzk2NjEwMTcsIHk6My40Nzg4MTM1NTkzMjIwMzM3fSx7eDowLjMzODg5ODMwNTA4NDc0NTgsIHk6My40Njc3OTY2MTAxNjk0OTE3fSx7eDowLjMzODg5ODMwNTA4NDc0NTgsIHk6My40NTE2OTQ5MTUyNTQyMzd9LHt4OjAuMzM4ODk4MzA1MDg0NzQ1OCwgeTozLjM5NzQ1NzYyNzExODY0NH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOFMgPSBuZXcgQXJyYXkoXG4gIC8vbmV3IEFycmF5KHt4OjAuMDcyOTgzMDUwODQ3NDU3NjMsIHk6Mi42NTUzNDc0NTc2MjcxMTg4fSx7eDowLjA3Mjk4MzA1MDg0NzQ1NzYzLCB5OjIuNjcwNjAxNjk0OTE1MjU0Mn0se3g6MC4wNjQ1MDg0NzQ1NzYyNzExOCwgeToyLjY5MTc4ODEzNTU5MzIyMDV9LHt4OjAuMDc0Njc3OTY2MTAxNjk0OTEsIHk6Mi42OTg1Njc3OTY2MTAxNjk1fSx7eDowLjA2NDUwODQ3NDU3NjI3MTE4LCB5OjIuNzAzNjUyNTQyMzcyODgxN30sIHt4OjAuMDY3ODk4MzA1MDg0NzQ1NzYsIHk6Mi43NjA2MDE2OTQ5MTUyNTQzfSx7eDowLjA3OTc2MjcxMTg2NDQwNjc4LCB5OjIuNzY4MjI4ODEzNTU5MzIyfSx7eDowLjEwNTE4NjQ0MDY3Nzk2NjEsIHk6Mi43NjgyMjg4MTM1NTkzMjJ9LHt4OjAuMTMwNjEwMTY5NDkxNTI1NDMsIHk6Mi43NjgyMjg4MTM1NTkzMjJ9LHt4OjAuMTUwOTQ5MTUyNTQyMzcyOSwgeToyLjc4MTYxODY0NDA2Nzc5N30se3g6MC4xNTI2NDQwNjc3OTY2MTAxNiwgeToyLjc5NjAyNTQyMzcyODgxMzZ9LHt4OjAuMTUzNDkxNTI1NDIzNzI4OCwgeToyLjgxNTUxNjk0OTE1MjU0MjV9LHt4OjAuMTU0MzM4OTgzMDUwODQ3NDgsIHk6Mi44NDUxNzc5NjYxMDE2OTV9LHt4OjAuMTYwMjcxMTg2NDQwNjc3OTUsIHk6Mi44NTg3MzcyODgxMzU1OTMyfSx7eDowLjE3NjM3Mjg4MTM1NTkzMjIsIHk6Mi44NTEyNzk2NjEwMTY5NDkzfSx7eDowLjE4MzE1MjU0MjM3Mjg4MTM3LCB5OjIuODQ3ODg5ODMwNTA4NDc0Nn0se3g6MC4xODY1NDIzNzI4ODEzNTU5NCwgeToyLjg1NTUxNjk0OTE1MjU0Mjd9LHt4OjAuMTkwNzc5NjYxMDE2OTQ5MTUsIHk6Mi44NDc4ODk4MzA1MDg0NzQ2fSx7eDowLjE5NjcxMTg2NDQwNjc3OTY4LCB5OjIuODUzODIyMDMzODk4MzA1NH0se3g6MC4yMDA5NDkxNTI1NDIzNzI5LCB5OjIuODQ1MzQ3NDU3NjI3MTE5fSx7eDowLjIwNjg4MTM1NTkzMjIwMzQxLCB5OjIuODU0NjY5NDkxNTI1NDI0fSx7eDowLjIxMDI3MTE4NjQ0MDY3OCwgeToyLjg0NDUwMDAwMDAwMDAwMDN9LHt4OjAuMjE0NTA4NDc0NTc2MjcxMiwgeToyLjg1NDY2OTQ5MTUyNTQyNH0se3g6MC4yMTk1OTMyMjAzMzg5ODMwNCwgeToyLjg0NDUwMDAwMDAwMDAwMDN9LHt4OjAuMjI0Njc3OTY2MTAxNjk0OTQsIHk6Mi44NDM4MjIwMzM4OTgzMDU0fSx7eDowLjIyODA2Nzc5NjYxMDE2OTUyLCB5OjIuODQzNjUyNTQyMzcyODgxNn0se3g6MC4yMzA2MTAxNjk0OTE1MjU0LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC4yNDkyNTQyMzcyODgxMzU1NiwgeToyLjg2MDQzMjIwMzM4OTgzMDZ9LHt4OjAuMjgxNDU3NjI3MTE4NjQ0LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC4zNDY3MTE4NjQ0MDY3Nzk2NSwgeToyLjg1MTI3OTY2MTAxNjk0OTN9LHt4OjAuMzg5MDg0NzQ1NzYyNzExODUsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQwMzQ5MTUyNTQyMzcyODgsIHk6Mi44NDg3MzcyODgxMzU1OTMyfSx7eDowLjQwNjAzMzg5ODMwNTA4NDc0LCB5OjIuODQ1MzQ3NDU3NjI3MTE5fSx7eDowLjQxMTExODY0NDA2Nzc5NjYsIHk6Mi44NTYzNjQ0MDY3Nzk2NjF9LHt4OjAuNDE2MjAzMzg5ODMwNTA4NSwgeToyLjg1NTM0NzQ1NzYyNzExOX0se3g6MC40MTg3NDU3NjI3MTE4NjQzNywgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuNDI2MzcyODgxMzU1OTMyMiwgeToyLjg1MjgwNTA4NDc0NTc2M30se3g6MC40MjgwNjc3OTY2MTAxNjk0NywgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuNDMxNDU3NjI3MTE4NjQ0MDUsIHk6Mi44NDM2NTI1NDIzNzI4ODE2fSx7eDowLjQzNCwgeToyLjg1Mjk3NDU3NjI3MTE4Njd9LHt4OjAuNDM0LCB5OjIuODQ2MTk0OTE1MjU0MjM3Nn0se3g6MC40NDE2MjcxMTg2NDQwNjc4LCB5OjIuODU2MzY0NDA2Nzc5NjYxfSx7eDowLjQ0NTAxNjk0OTE1MjU0MjM2LCB5OjIuODQ1MzQ3NDU3NjI3MTE5fSx7eDowLjQ1MDEwMTY5NDkxNTI1NDIsIHk6Mi44NTEyNzk2NjEwMTY5NDkzfSx7eDowLjQ2MzY2MTAxNjk0OTE1MjUsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQ4NCwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuNDk0MTY5NDkxNTI1NDIzNjcsIHk6Mi44NjgwNTkzMjIwMzM4OTg0fSx7eDowLjQ5NzU1OTMyMjAzMzg5ODMsIHk6Mi44ODc1NTA4NDc0NTc2MjcyfSx7eDowLjQ5NzU1OTMyMjAzMzg5ODMsIHk6Mi45MjU2ODY0NDA2Nzc5NjYzfSx7eDowLjQ5NjcxMTg2NDQwNjc3OTYsIHk6Mi45NTI4MDUwODQ3NDU3NjN9LHt4OjAuNDk3NTU5MzIyMDMzODk4MywgeToyLjk4MDc3MTE4NjQ0MDY3ODN9LCB7eDowLjQ4NDg0NzQ1NzYyNzExODY3LCB5OjMuMDAzNjUyNTQyMzcyODgxNX0se3g6MC40NjI4MTM1NTkzMjIwMzM5LCB5OjMuMDEyOTc0NTc2MjcxMTg2Nn0se3g6MC40NDI0NzQ1NzYyNzExODY0LCB5OjMuMDEzODIyMDMzODk4MzA1M30se3g6MC40MzIzMDUwODQ3NDU3NjI3LCB5OjMuMDE4MDU5MzIyMDMzODk4M30se3g6MC40MjcyMjAzMzg5ODMwNTA4NCwgeTozLjAyOTA3NjI3MTE4NjQ0MDd9LHt4OjAuNDI2MzcyODgxMzU1OTMyMiwgeTozLjA2Mjk3NDU3NjI3MTE4NjR9LHt4OjAuNDI5NzYyNzExODY0NDA2OCwgeTozLjEwMTExMDE2OTQ5MTUyNTV9LHt4OjAuNDIzODMwNTA4NDc0NTc2MjYsIHk6My4xMTM4MjIwMzM4OTgzMDU0fSx7eDowLjM4NTY5NDkxNTI1NDIzNzI3LCB5OjMuMTE4MDU5MzIyMDMzODk4NH0se3g6MC4zNTY4ODEzNTU5MzIyMDM0LCB5OjMuMTE3MjExODY0NDA2Nzc5N30se3g6MC4zNDU4NjQ0MDY3Nzk2NjEsIHk6My4xMDg3MzcyODgxMzU1OTMyfSx7eDowLjM0NTg2NDQwNjc3OTY2MSwgeTozLjA5NTE3Nzk2NjEwMTY5NX0se3g6MC4zNDMzMjIwMzM4OTgzMDUwNywgeTozLjAyMzE0NDA2Nzc5NjYxMDR9KVxuICAvL25ldyBBcnJheSh7eDo1LjE0MTE5MzU5NTM0MjA2NywgeTowLjIyNTYxODYzMTczMjE2ODg0fSx7eDo1LjE0MTE5MzU5NTM0MjA2NywgeTowLjIwOTYwNjk4Njg5OTU2MzN9LHt4OjUuMTM4MjgyMzg3MTkwNjg0LCB5OjAuMTkyMTM5NzM3OTkxMjY2Mzh9LHt4OjUuMTM5NzM3OTkxMjY2Mzc2LCB5OjAuMTYwMTE2NDQ4MzI2MDU1MzJ9LHt4OjUuMTM5NzM3OTkxMjY2Mzc2LCB5OjAuMTMxMDA0MzY2ODEyMjI3MDd9LHt4OjUuMTQyNjQ5MTk5NDE3NzU4LCB5OjAuMTEyMDgxNTEzODI4MjM4NzJ9LHt4OjUuMTU1NzQ5NjM2MDk4OTgxLCB5OjAuMTAzMzQ3ODg5Mzc0MDkwMjR9LHt4OjUuMTg2MzE3MzIxNjg4NTAxLCB5OjAuMTAxODkyMjg1Mjk4Mzk4ODN9LHt4OjUuNTA1MDk0NjE0MjY0OTE5NSwgeTowLjEwMTg5MjI4NTI5ODM5ODgzfSx7eDo1LjkzNzQwOTAyNDc0NTI2OTUsIHk6MC4wOTg5ODEwNzcxNDcwMTYwMX0se3g6NS45ODI1MzI3NTEwOTE3MDM1LCB5OjAuMTAzMzQ3ODg5Mzc0MDkwMjR9LHt4OjUuOTk3MDg4NzkxODQ4NjE3NSwgeTowLjEwMDQzNjY4MTIyMjcwNzQyfSx7eDo2LjAwMjkxMTIwODE1MTM4MjUsIHk6MC4wODQ0MjUwMzYzOTAxMDE4OX0se3g6Ni4wMDI5MTEyMDgxNTEzODI1LCB5OjAuMDU4MjI0MTYzMDI3NjU2NDh9LHt4OjYuMDA1ODIyNDE2MzAyNzY2LCB5OjAuMDM2MzkwMTAxODkyMjg1Mjk1fSx7eDo2LjAxMzEwMDQzNjY4MTIyMiwgeTowLjAyNzY1NjQ3NzQzODEzNjgyOH0se3g6Ni4wMzA1Njc2ODU1ODk1MiwgeTowLjAyMzI4OTY2NTIxMTA2MjU5Mn0se3g6Ni4xOTc5NjIxNTQyOTQwMzIsIHk6MC4wMjYyMDA4NzMzNjI0NDU0MTN9LHt4OjYuMjE5Nzk2MjE1NDI5NDAzLCB5OjAuMDMzNDc4ODkzNzQwOTAyNDc0fSx7eDo2LjIyODUyOTgzOTg4MzU1MiwgeTowLjA1Mzg1NzM1MDgwMDU4MjI0NX0se3g6Ni4yMjU2MTg2MzE3MzIxNjksIHk6MC4yOTY5NDMyMzE0NDEwNDgwNn0se3g6Ni4yMzcyNjM0NjQzMzc3LCB5OjAuMzE3MzIxNjg4NTAwNzI3OH0se3g6Ni4yNTQ3MzA3MTMyNDU5OTcsIHk6MC4zMTg3NzcyOTI1NzY0MTkyNH0se3g6Ni4yNzgwMjAzNzg0NTcwNiwgeTowLjMyODk2NjUyMTEwNjI1OTF9LHt4OjYuMjgwOTMxNTg2NjA4NDQyNSwgeTowLjM1NjYyMjk5ODU0NDM5NTk0fSx7eDo2LjI4NTI5ODM5ODgzNTUxNywgeTowLjQwNDY1NzkzMzA0MjIxMjU0fSx7eDo2LjMwMjc2NTY0Nzc0MzgxNCwgeTowLjQxNDg0NzE2MTU3MjA1MjR9LHt4OjYuMzE4Nzc3MjkyNTc2NDE5LCB5OjAuNDE2MzAyNzY1NjQ3NzQzOH0se3g6Ni4zMjc1MTA5MTcwMzA1NjgsIHk6MC40MjA2Njk1Nzc4NzQ4MTgwN30se3g6Ni4zMzMzMzMzMzMzMzMzMzMsIHk6MC40MTMzOTE1NTc0OTYzNjF9LHt4OjYuMzQyMDY2OTU3Nzg3NDgyLCB5OjAuNDIwNjY5NTc3ODc0ODE4MDd9LHt4OjYuMzUyMjU2MTg2MzE3MzIxLCB5OjAuNDE2MzAyNzY1NjQ3NzQzOH0se3g6Ni4zNjA5ODk4MTA3NzE0NywgeTowLjQyMzU4MDc4NjAyNjIwMDg2fSx7eDo2LjM2OTcyMzQzNTIyNTYxOSwgeTowLjQxMzM5MTU1NzQ5NjM2MX0se3g6Ni4zODI4MjM4NzE5MDY4NDEsIHk6MC40MTkyMTM5NzM3OTkxMjY2fSx7eDo2LjU1ODk1MTk2NTA2NTUwMywgeTowLjQxOTIxMzk3Mzc5OTEyNjZ9LHt4OjYuNTc0OTYzNjA5ODk4MTA3NSwgeTowLjQyMjEyNTE4MTk1MDUwOTQ2fSx7eDo2LjU4MjI0MTYzMDI3NjU2NSwgeTowLjQxMTkzNTk1MzQyMDY2OTZ9LHt4OjYuNTk1MzQyMDY2OTU3Nzg3LCB5OjAuNDI2NDkxOTk0MTc3NTgzN30se3g6Ni41OTk3MDg4NzkxODQ4NjE1LCB5OjAuNDE0ODQ3MTYxNTcyMDUyNH0se3g6Ni42MTI4MDkzMTU4NjYwODUsIHk6MC40MjUwMzYzOTAxMDE4OTIyNn0se3g6Ni42MjAwODczMzYyNDQ1NDEsIHk6MC40MTQ4NDcxNjE1NzIwNTI0fSx7eDo2LjYzNzU1NDU4NTE1MjgzOSwgeTowLjQxNzc1ODM2OTcyMzQzNTJ9LHt4OjYuNjY2NjY2NjY2NjY2NjY3LCB5OjAuNDIyMTI1MTgxOTUwNTA5NDZ9LHt4OjYuNjg1NTg5NTE5NjUwNjU1LCB5OjAuNDM1MjI1NjE4NjMxNzMyMTV9LHt4OjYuNjg3MDQ1MTIzNzI2MzQ3LCB5OjAuNDgxODA0OTQ5MDUzODU3MzV9LHt4OjYuNjg4NTAwNzI3ODAyMDM4LCB5OjAuNTMxMjk1NDg3NjI3MzY1M30se3g6Ni42ODg1MDA3Mjc4MDIwMzgsIHk6MC41NTc0OTYzNjA5ODk4MTA4fSx7eDo2LjY4ODUwMDcyNzgwMjAzOCwgeTowLjU3Nzg3NDgxODA0OTQ5MDZ9LHt4OjYuNjc4MzExNDk5MjcyMTk4LCB5OjAuNTk1MzQyMDY2OTU3Nzg3NX0se3g6Ni42NTc5MzMwNDIyMTI1MTgsIHk6MC42MDExNjQ0ODMyNjA1NTMyfSx7eDo2LjY0MTkyMTM5NzM3OTkxMywgeTowLjU5ODI1MzI3NTEwOTE3MDN9LHt4OjYuNjI3MzY1MzU2NjIyOTk5LCB5OjAuNTk4MjUzMjc1MTA5MTcwM30se3g6Ni42MTg2MzE3MzIxNjg4NSwgeTowLjYwNTUzMTI5NTQ4NzYyNzR9LHt4OjYuNjExMzUzNzExNzkwMzkzLCB5OjAuNjE3MTc2MTI4MDkzMTU4N30se3g6Ni42MDg0NDI1MDM2MzkwMSwgeTowLjY0Nzc0MzgxMzY4MjY3ODN9LHt4OjYuNjA4NDQyNTAzNjM5MDEsIHk6MC42ODQxMzM5MTU1NzQ5NjM2fSx7eDo2LjYwODQ0MjUwMzYzOTAxLCB5OjAuNzA4ODc5MTg0ODYxNzE3Nn0se3g6Ni41OTk3MDg4NzkxODQ4NjE1LCB5OjAuNzE2MTU3MjA1MjQwMTc0N30se3g6Ni41Njc2ODU1ODk1MTk2NTEsIHk6MC43MTc2MTI4MDkzMTU4NjYxfSx7eDo2LjUzNzExNzkwMzkzMDEzMSwgeTowLjcxOTA2ODQxMzM5MTU1NzV9LHt4OjYuNTIxMTA2MjU5MDk3NTI1LCB5OjAuNzE5MDY4NDEzMzkxNTU3NX0se3g6Ni41MTgxOTUwNTA5NDYxNDMsIHk6MC43MDU5Njc5NzY3MTAzMzQ4fSx7eDo2LjUxMzgyODIzODcxOTA2OSwgeTowLjY5NDMyMzE0NDEwNDgwMzR9LHt4OjYuNTEzODI4MjM4NzE5MDY5LCB5OjAuNjc2ODU1ODk1MTk2NTA2Nn0se3g6Ni41MTIzNzI2MzQ2NDMzNzcsIHk6MC42MjU5MDk3NTI1NDczMDcyfSlcbiAgLy9uZXcgQXJyYXkoe3g6NS4xNDE2NDY0ODkxMDQxMTYsIHk6MC4yMjc2MDI5MDU1NjkwMDcyNX0se3g6NS4xNDA0MzU4MzUzNTEwOSwgeTowLjIxMDY1Mzc1MzAyNjYzNDR9LHt4OjUuMTQwNDM1ODM1MzUxMDksIHk6MC4xOTk3NTc4NjkyNDkzOTQ2OH0se3g6NS4xMzkyMjUxODE1OTgwNjI1LCB5OjAuMTc5MTc2NzU1NDQ3OTQxOX0se3g6NS4xMzkyMjUxODE1OTgwNjI1LCB5OjAuMTU2MTc0MzM0MTQwNDM1ODN9LHt4OjUuMTM5MjI1MTgxNTk4MDYyNSwgeTowLjEzODAxNDUyNzg0NTAzNjMyfSx7eDo1LjEzOTIyNTE4MTU5ODA2MjUsIHk6MC4xMjQ2OTczMzY1NjE3NDMzNH0se3g6NS4xNDA0MzU4MzUzNTEwOSwgeTowLjExNjIyMjc2MDI5MDU1Njl9LHt4OjUuMTQ0MDY3Nzk2NjEwMTY5NiwgeTowLjExMDE2OTQ5MTUyNTQyMzczfSx7eDo1LjE0ODkxMDQxMTYyMjI3NiwgeTowLjEwNTMyNjg3NjUxMzMxNzJ9LHt4OjUuMTU2MTc0MzM0MTQwNDM2LCB5OjAuMTAxNjk0OTE1MjU0MjM3M30se3g6NS4xNzU1NDQ3OTQxODg4NjIsIHk6MC4wOTkyNzM2MDc3NDgxODQwMX0se3g6NS4yMDcwMjE3OTE3Njc1NTUsIHk6MC4xMDA0ODQyNjE1MDEyMTA2NX0se3g6NS41MjMwMDI0MjEzMDc1MDYsIHk6MC4xMDA0ODQyNjE1MDEyMTA2NX0se3g6NS45MTc2NzU1NDQ3OTQxODg0LCB5OjAuMTAwNDg0MjYxNTAxMjEwNjV9LHt4OjUuOTg1NDcyMTU0OTYzNjgxLCB5OjAuMDk5MjczNjA3NzQ4MTg0MDF9LHt4OjUuOTk2MzY4MDM4NzQwOTIsIHk6MC4wOTQ0MzA5OTI3MzYwNzc0OH0se3g6Ni4wMDEyMTA2NTM3NTMwMjYsIHk6MC4wODU5NTY0MTY0NjQ4OTEwNH0se3g6Ni4wMDM2MzE5NjEyNTkwOCwgeTowLjA2OTAwNzI2MzkyMjUxODE2fSx7eDo2LjAwMzYzMTk2MTI1OTA4LCB5OjAuMDU1NjkwMDcyNjM5MjI1MTh9LHt4OjYuMDAyNDIxMzA3NTA2MDUzNSwgeTowLjAzNzUzMDI2NjM0MzgyNTY3fSx7eDo2LjAwNzI2MzkyMjUxODE2LCB5OjAuMDMwMjY2MzQzODI1NjY1ODZ9LHt4OjYuMDEyMTA2NTM3NTMwMjY3LCB5OjAuMDIxNzkxNzY3NTU0NDc5NDE3fSx7eDo2LjAyOTA1NTY5MDA3MjYzOTUsIHk6MC4wMjA1ODExMTM4MDE0NTI3ODR9LHt4OjYuMjA1ODExMTM4MDE0NTI3NiwgeTowLjAyNDIxMzA3NTA2MDUzMjY4N30se3g6Ni4yMTkxMjgzMjkyOTc4MjEsIHk6MC4wMjkwNTU2OTAwNzI2MzkyMjd9LHt4OjYuMjI2MzkyMjUxODE1OTgsIHk6MC4wNDM1ODM1MzUxMDg5NTg4MzV9LHt4OjYuMjMwMDI0MjEzMDc1MDYxLCB5OjAuMTIzNDg2NjgyODA4NzE2N30se3g6Ni4yMjYzOTIyNTE4MTU5OCwgeTowLjI5NjYxMDE2OTQ5MTUyNTR9LHt4OjYuMjMyNDQ1NTIwNTgxMTE0LCB5OjAuMzA5OTI3MzYwNzc0ODE4NH0se3g6Ni4yNDMzNDE0MDQzNTgzNTQsIHk6MC4zMTg0MDE5MzcwNDYwMDQ4M30se3g6Ni4yNTQyMzcyODgxMzU1OTMsIHk6MC4zMTg0MDE5MzcwNDYwMDQ4M30se3g6Ni4yNjg3NjUxMzMxNzE5MTMsIHk6MC4zMTk2MTI1OTA3OTkwMzE1fSx7eDo2LjI3ODQ1MDM2MzE5NjEyNiwgeTowLjMyNTY2NTg1OTU2NDE2NDY2fSx7eDo2LjI4MzI5Mjk3ODIwODIzMiwgeTowLjM0MjYxNTAxMjEwNjUzNzU1fSx7eDo2LjI4NDUwMzYzMTk2MTI1OSwgeTowLjM3NDA5MjAwOTY4NTIzMDA0fSx7eDo2LjI4MzI5Mjk3ODIwODIzMiwgeTowLjM5NzA5NDQzMDk5MjczNjA2fSx7eDo2LjI5MTc2NzU1NDQ3OTQxOSwgeTowLjQxMjgzMjkyOTc4MjA4MjN9LHt4OjYuMzA2Mjk1Mzk5NTE1NzM4LCB5OjAuNDE2NDY0ODkxMDQxMTYyMjR9LHt4OjYuMzE3MTkxMjgzMjkyOTc5LCB5OjAuNDE2NDY0ODkxMDQxMTYyMjR9LHt4OjYuMzI1NjY1ODU5NTY0MTY1LCB5OjAuNDE4ODg2MTk4NTQ3MjE1NX0se3g6Ni4zMzA1MDg0NzQ1NzYyNzEsIHk6MC40MTE2MjIyNzYwMjkwNTU3fSx7eDo2LjMzNDE0MDQzNTgzNTM1MTUsIHk6MC40MTc2NzU1NDQ3OTQxODg4NH0se3g6Ni4zMzg5ODMwNTA4NDc0NTgsIHk6MC40MTE2MjIyNzYwMjkwNTU3fSx7eDo2LjM0MjYxNTAxMjEwNjUzNywgeTowLjQxNzY3NTU0NDc5NDE4ODg0fSx7eDo2LjM0NjI0Njk3MzM2NTYxNywgeTowLjQxMjgzMjkyOTc4MjA4MjN9LHt4OjYuMzUyMzAwMjQyMTMwNzUxLCB5OjAuNDE2NDY0ODkxMDQxMTYyMjR9LHt4OjYuMzU1OTMyMjAzMzg5ODMwNCwgeTowLjQxMDQxMTYyMjI3NjAyOTA2fSx7eDo2LjM1NzE0Mjg1NzE0Mjg1NywgeTowLjQxODg4NjE5ODU0NzIxNTV9LHt4OjYuMzYxOTg1NDcyMTU0OTY0LCB5OjAuNDEyODMyOTI5NzgyMDgyM30se3g6Ni4zNjkyNDkzOTQ2NzMxMjM1LCB5OjAuNDIyNTE4MTU5ODA2Mjk1NH0se3g6Ni4zNzQwOTIwMDk2ODUyMywgeTowLjQxNTI1NDIzNzI4ODEzNTZ9LHt4OjYuMzkxMDQxMTYyMjI3NjAzLCB5OjAuNDE4ODg2MTk4NTQ3MjE1NX0se3g6Ni41NjI5NTM5OTUxNTczODUsIHk6MC40MTg4ODYxOTg1NDcyMTU1fSx7eDo2LjU3OTkwMzE0NzY5OTc1OCwgeTowLjQxNDA0MzU4MzUzNTEwODk1fSx7eDo2LjU4NTk1NjQxNjQ2NDg5MSwgeTowLjQyMjUxODE1OTgwNjI5NTR9LHt4OjYuNTkwNzk5MDMxNDc2OTk3NSwgeTowLjQxMTYyMjI3NjAyOTA1NTd9LHt4OjYuNTk0NDMwOTkyNzM2MDc3LCB5OjAuNDE4ODg2MTk4NTQ3MjE1NX0se3g6Ni41OTgwNjI5NTM5OTUxNTcsIHk6MC40MTE2MjIyNzYwMjkwNTU3fSx7eDo2LjYwMjkwNTU2OTAwNzI2NCwgeTowLjQxNjQ2NDg5MTA0MTE2MjI0fSx7eDo2LjYwNzc0ODE4NDAxOTM3LCB5OjAuNDEyODMyOTI5NzgyMDgyM30se3g6Ni42MTEzODAxNDUyNzg0NSwgeTowLjQxODg4NjE5ODU0NzIxNTV9LHt4OjYuNjE2MjIyNzYwMjkwNTU3LCB5OjAuNDExNjIyMjc2MDI5MDU1N30se3g6Ni42MjEwNjUzNzUzMDI2NjMsIHk6MC40MjAwOTY4NTIzMDAyNDIxM30se3g6Ni42MjM0ODY2ODI4MDg3MTcsIHk6MC40MTUyNTQyMzcyODgxMzU2fSx7eDo2LjY0Mjg1NzE0Mjg1NzE0MywgeTowLjQxNzY3NTU0NDc5NDE4ODg0fSx7eDo2LjY2MjIyNzYwMjkwNTU2OSwgeTowLjQyMDA5Njg1MjMwMDI0MjEzfSx7eDo2LjY3NDMzNDE0MDQzNTgzNSwgeTowLjQyMjUxODE1OTgwNjI5NTR9LHt4OjYuNjgyODA4NzE2NzA3MDIxLCB5OjAuNDI5NzgyMDgyMzI0NDU1Mn0se3g6Ni42OTAwNzI2MzkyMjUxODIsIHk6MC40NDkxNTI1NDIzNzI4ODE0fSx7eDo2LjY4NzY1MTMzMTcxOTEyOCwgeTowLjUwMTIxMDY1Mzc1MzAyNjZ9LHt4OjYuNjg2NDQwNjc3OTY2MTAyLCB5OjAuNTU4MTExMzgwMTQ1Mjc4NX0se3g6Ni42ODY0NDA2Nzc5NjYxMDIsIHk6MC41NzM4NDk4Nzg5MzQ2MjQ3fSx7eDo2LjY4NDAxOTM3MDQ2MDA0OSwgeTowLjU5MjAwOTY4NTIzMDAyNDJ9LHt4OjYuNjQ1Mjc4NDUwMzYzMTk2LCB5OjAuNTk4MDYyOTUzOTk1MTU3NH0se3g6Ni42Mjk1Mzk5NTE1NzM4NSwgeTowLjYwMDQ4NDI2MTUwMTIxMDd9LHt4OjYuNjIxMDY1Mzc1MzAyNjYzLCB5OjAuNjAwNDg0MjYxNTAxMjEwN30se3g6Ni42MTI1OTA3OTkwMzE0NzcsIHk6MC42MDg5NTg4Mzc3NzIzOTcxfSx7eDo2LjYwNzc0ODE4NDAxOTM3LCB5OjAuNjIzNDg2NjgyODA4NzE2N30se3g6Ni42MDY1Mzc1MzAyNjYzNDQsIHk6MC42NDc2OTk3NTc4NjkyNDk0fSx7eDo2LjYwNDExNjIyMjc2MDI5MDUsIHk6MC42NzQzMzQxNDA0MzU4MzU0fSx7eDo2LjYwNTMyNjg3NjUxMzMxNywgeTowLjY5MjQ5Mzk0NjczMTIzNDl9LHt4OjYuNjA1MzI2ODc2NTEzMzE3LCB5OjAuNzA4MjMyNDQ1NTIwNTgxMX0se3g6Ni41OTkyNzM2MDc3NDgxODQsIHk6MC43MTc5MTc2NzU1NDQ3OTQyfSx7eDo2LjU4OTU4ODM3NzcyMzk3MSwgeTowLjcxNzkxNzY3NTU0NDc5NDJ9LHt4OjYuNTcwMjE3OTE3Njc1NTQ1LCB5OjAuNzE5MTI4MzI5Mjk3ODIwOH0se3g6Ni41NDcyMTU0OTYzNjgwMzksIHk6MC43MjAzMzg5ODMwNTA4NDc0fSx7eDo2LjUyMzAwMjQyMTMwNzUwNiwgeTowLjcxNzkxNzY3NTU0NDc5NDJ9LHt4OjYuNTE2OTQ5MTUyNTQyMzczLCB5OjAuNzExODY0NDA2Nzc5NjYxfSx7eDo2LjUxMjEwNjUzNzUzMDI2NywgeTowLjY5OTc1Nzg2OTI0OTM5NDZ9LHt4OjYuNTA5Njg1MjMwMDI0MjEzLCB5OjAuNjc1NTQ0Nzk0MTg4ODYxOX0se3g6Ni41MDk2ODUyMzAwMjQyMTMsIHk6MC42NTM3NTMwMjY2MzQzODI2fSlcbiAgbmV3IEFycmF5KHt4OjUuMTQwMjg3NzY5Nzg0MTcyLCB5OjAuMjI3ODE3NzQ1ODAzMzU3M30se3g6NS4xMzkwODg3MjkwMTY3ODcsIHk6MC4yMDYyMzUwMTE5OTA0MDc2N30se3g6NS4xMzkwODg3MjkwMTY3ODcsIHk6MC4xODgyNDk0MDA0Nzk2MTYzfSx7eDo1LjEzNjY5MDY0NzQ4MjAxNCwgeTowLjE2NDI2ODU4NTEzMTg5NDV9LHt4OjUuMTM2NjkwNjQ3NDgyMDE0LCB5OjAuMTQ3NDgyMDE0Mzg4NDg5Mn0se3g6NS4xMzc4ODk2ODgyNDk0LCB5OjAuMTI5NDk2NDAyODc3Njk3ODR9LHt4OjUuMTQwMjg3NzY5Nzg0MTcyLCB5OjAuMTE3NTA1OTk1MjAzODM2OTR9LHt4OjUuMTQyNjg1ODUxMzE4OTQ0LCB5OjAuMTEwMzExNzUwNTk5NTIwMzh9LHt4OjUuMTQ5ODgwMDk1OTIzMjYyLCB5OjAuMTA0MzE2NTQ2NzYyNTg5OTN9LHt4OjUuMTYxODcwNTAzNTk3MTIzLCB5OjAuMDk5NTIwMzgzNjkzMDQ1NTd9LHt4OjUuMTk5MDQwNzY3Mzg2MDkxLCB5OjAuMDk1OTIzMjYxMzkwODg3Mjl9LHt4OjUuOTgwODE1MzQ3NzIxODIzLCB5OjAuMDk5NTIwMzgzNjkzMDQ1NTd9LHt4OjUuOTk1MjAzODM2OTMwNDU2LCB5OjAuMDkzNTI1MTc5ODU2MTE1MTF9LHt4OjUuOTk4ODAwOTU5MjMyNjEzNSwgeTowLjA4NzUyOTk3NjAxOTE4NDY1fSx7eDo2LjAwMTE5OTA0MDc2NzM4NjUsIHk6MC4wNzU1Mzk1NjgzNDUzMjM3NH0se3g6Ni4wMDExOTkwNDA3NjczODY1LCB5OjAuMDYxMTUxMDc5MTM2NjkwNjV9LHt4OjYuMDAyMzk4MDgxNTM0NzcyLCB5OjAuMDQzMTY1NDY3NjI1ODk5Mjh9LHt4OjYuMDAyMzk4MDgxNTM0NzcyLCB5OjAuMDM3MTcwMjYzNzg4OTY4ODJ9LHt4OjYuMDA0Nzk2MTYzMDY5NTQ0LCB5OjAuMDMyMzc0MTAwNzE5NDI0NDZ9LHt4OjYuMDA5NTkyMzI2MTM5MDg5LCB5OjAuMDI2Mzc4ODk2ODgyNDk0MDA0fSx7eDo2LjAxNzk4NTYxMTUxMDc5MiwgeTowLjAyMTU4MjczMzgxMjk0OTY0fSx7eDo2LjAzMzU3MzE0MTQ4NjgxLCB5OjAuMDE5MTg0NjUyMjc4MTc3NDU3fSx7eDo2LjE5OTA0MDc2NzM4NjA5MSwgeTowLjAyMTU4MjczMzgxMjk0OTY0fSx7eDo2LjIxMzQyOTI1NjU5NDcyNCwgeTowLjAyNjM3ODg5Njg4MjQ5NDAwNH0se3g6Ni4yMjU0MTk2NjQyNjg1ODU1LCB5OjAuMDM4MzY5MzA0NTU2MzU0OTF9LHt4OjYuMjMwMjE1ODI3MzM4MTMsIHk6MC4wNTUxNTU4NzUyOTk3NjAxOX0se3g6Ni4yMzI2MTM5MDg4NzI5MDIsIHk6MC4yMjMwMjE1ODI3MzM4MTI5NX0se3g6Ni4yMzE0MTQ4NjgxMDU1MTU1LCB5OjAuMjM1MDExOTkwNDA3NjczODd9LHt4OjYuMjMyNjEzOTA4ODcyOTAyLCB5OjAuMjQyMjA2MjM1MDExOTkwNH0se3g6Ni4yMzk4MDgxNTM0NzcyMTg1LCB5OjAuMjQ4MjAxNDM4ODQ4OTIwODd9LHt4OjYuMjUyOTk3NjAxOTE4NDY1LCB5OjAuMjUyOTk3NjAxOTE4NDY1Mn0se3g6Ni4yNjQ5ODgwMDk1OTIzMjYsIHk6MC4yNTI5OTc2MDE5MTg0NjUyfSx7eDo2LjI3NTc3OTM3NjQ5ODgwMSwgeTowLjI1NTM5NTY4MzQ1MzIzNzQzfSx7eDo2LjI4Mjk3MzYyMTEwMzExNzUsIHk6MC4yNjQ5ODgwMDk1OTIzMjYxNn0se3g6Ni4yODc3Njk3ODQxNzI2NjIsIHk6MC4yODA1NzU1Mzk1NjgzNDUzfSx7eDo2LjI4NjU3MDc0MzQwNTI3NiwgeTowLjMzMjEzNDI5MjU2NTk0NzIzfSx7eDo2LjI5MjU2NTk0NzI0MjIwNiwgeTowLjM0NTMyMzc0MTAwNzE5NDI2fSx7eDo2LjMwOTM1MjUxNzk4NTYxMSwgeTowLjM1MDExOTkwNDA3NjczODZ9LHt4OjYuMzIwMTQzODg0ODkyMDg3LCB5OjAuMzQ2NTIyNzgxNzc0NTgwMzV9LHt4OjYuMzI2MTM5MDg4NzI5MDE2NSwgeTowLjM1MTMxODk0NDg0NDEyNDd9LHt4OjYuMzMzMzMzMzMzMzMzMzMzLCB5OjAuMzQ0MTI0NzAwMjM5ODA4Mn0se3g6Ni4zMzU3MzE0MTQ4NjgxMDUsIHk6MC4zNTAxMTk5MDQwNzY3Mzg2fSx7eDo2LjM0MTcyNjYxODcwNTAzNiwgeTowLjM0NTMyMzc0MTAwNzE5NDI2fSx7eDo2LjM0NjUyMjc4MTc3NDU4LCB5OjAuMzUxMzE4OTQ0ODQ0MTI0N30se3g6Ni4zNTI1MTc5ODU2MTE1MSwgeTowLjM0MDUyNzU3NzkzNzY0OTl9LHt4OjYuMzU2MTE1MTA3OTEzNjY5LCB5OjAuMzUwMTE5OTA0MDc2NzM4Nn0se3g6Ni4zNjMzMDkzNTI1MTc5ODYsIHk6MC4zNDA1Mjc1Nzc5Mzc2NDk5fSx7eDo2LjM2ODEwNTUxNTU4NzUzLCB5OjAuMzQ3NzIxODIyNTQxOTY2NDN9LHt4OjYuMzc0MTAwNzE5NDI0NDYxLCB5OjAuMzM5MzI4NTM3MTcwMjYzOH0se3g6Ni4zODQ4OTIwODYzMzA5MzUsIHk6MC4zNDg5MjA4NjMzMDkzNTI1fSx7eDo2LjU2NDc0ODIwMTQzODg0ODUsIHk6MC4zNDg5MjA4NjMzMDkzNTI1fSx7eDo2LjU4MDMzNTczMTQxNDg2OCwgeTowLjM0NDEyNDcwMDIzOTgwODJ9LHt4OjYuNTg3NTI5OTc2MDE5MTg0NiwgeTowLjM1MTMxODk0NDg0NDEyNDd9LHt4OjYuNTkyMzI2MTM5MDg4NzI5LCB5OjAuMzQxNzI2NjE4NzA1MDM1OTZ9LHt4OjYuNTk4MzIxMzQyOTI1NjYsIHk6MC4zNDg5MjA4NjMzMDkzNTI1fSx7eDo2LjYxMDMxMTc1MDU5OTUyMSwgeTowLjM0MDUyNzU3NzkzNzY0OTl9LHt4OjYuNjE1MTA3OTEzNjY5MDY1LCB5OjAuMzQ1MzIzNzQxMDA3MTk0MjZ9LHt4OjYuNjI0NzAwMjM5ODA4MTU0LCB5OjAuMzQxNzI2NjE4NzA1MDM1OTZ9LHt4OjYuNjMzMDkzNTI1MTc5ODU2LCB5OjAuMzUxMzE4OTQ0ODQ0MTI0N30se3g6Ni42NzAyNjM3ODg5Njg4MjUsIHk6MC4zNTM3MTcwMjYzNzg4OTY5fSx7eDo2LjY4NDY1MjI3ODE3NzQ1OCwgeTowLjM2MDkxMTI3MDk4MzIxMzR9LHt4OjYuNjg5NDQ4NDQxMjQ3MDAyLCB5OjAuMzgwMDk1OTIzMjYxMzkwOX0se3g6Ni42ODcwNTAzNTk3MTIyMywgeTowLjQzMTY1NDY3NjI1ODk5Mjh9LHt4OjYuNjg3MDUwMzU5NzEyMjMsIHk6MC40NzcyMTgyMjU0MTk2NjQyNH0se3g6Ni42ODk0NDg0NDEyNDcwMDIsIHk6MC41MTU1ODc1Mjk5NzYwMTkyfSx7eDo2LjY4NDY1MjI3ODE3NzQ1OCwgeTowLjUyNjM3ODg5Njg4MjQ5NH0se3g6Ni42NDUwODM5MzI4NTM3MTc1LCB5OjAuNTI4Nzc2OTc4NDE3MjY2Mn0se3g6Ni42MzA2OTU0NDM2NDUwODQsIHk6MC41Mjg3NzY5Nzg0MTcyNjYyfSx7eDo2LjYyMTEwMzExNzUwNTk5NSwgeTowLjUzMTE3NTA1OTk1MjAzODR9LHt4OjYuNjEzOTA4ODcyOTAxNjc4LCB5OjAuNTM1OTcxMjIzMDIxNTgyN30se3g6Ni42MDY3MTQ2MjgyOTczNjIsIHk6MC41NDY3NjI1ODk5MjgwNTc2fSx7eDo2LjYwNDMxNjU0Njc2MjU5LCB5OjAuNTYyMzUwMTE5OTA0MDc2N30se3g6Ni42MDQzMTY1NDY3NjI1OSwgeTowLjU4OTkyODA1NzU1Mzk1Njh9LHt4OjYuNjA0MzE2NTQ2NzYyNTksIHk6MC42MTc1MDU5OTUyMDM4Mzd9LHt4OjYuNjA2NzE0NjI4Mjk3MzYyLCB5OjAuNjM2NjkwNjQ3NDgyMDE0NH0se3g6Ni42MDE5MTg0NjUyMjc4MTgsIHk6MC42NDYyODI5NzM2MjExMDMxfSx7eDo2LjU5MjMyNjEzOTA4ODcyOSwgeTowLjY1MTA3OTEzNjY5MDY0NzR9LHt4OjYuNTY4MzQ1MzIzNzQxMDA3LCB5OjAuNjUxMDc5MTM2NjkwNjQ3NH0se3g6Ni41NDMxNjU0Njc2MjU4OTksIHk6MC42NDg2ODEwNTUxNTU4NzUzfSx7eDo2LjUyNzU3NzkzNzY0OTg4LCB5OjAuNjQyNjg1ODUxMzE4OTQ0OH0se3g6Ni41MTY3ODY1NzA3NDM0MDUsIHk6MC42MjU4OTkyODA1NzU1Mzk2fSx7eDo2LjUxNDM4ODQ4OTIwODYzMywgeTowLjU5NDcyNDIyMDYyMzUwMTJ9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTkgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjM0NzU1OTMyMjAzMzg5ODMsIHk6My4wMjQ4Mzg5ODMwNTA4NDc4fSx7eDowLjMzMDYxMDE2OTQ5MTUyNTQsIHk6My4wNDY4NzI4ODEzNTU5MzIzfSx7eDowLjMwNTE4NjQ0MDY3Nzk2NjEsIHk6My4wMjk5MjM3Mjg4MTM1NTk0fSx7eDowLjMwNDMzODk4MzA1MDg0NzQ0LCB5OjIuOTk5NDE1MjU0MjM3Mjg4NX0se3g6MC4zMDY4ODEzNTU5MzIyMDM0LCB5OjIuOTYwNDMyMjAzMzg5ODMwN30se3g6MC4zMjk3NjI3MTE4NjQ0MDY3NSwgeToyLjkzNTAwODQ3NDU3NjI3MTV9LHt4OjAuMzU5NDIzNzI4ODEzNTU5MzMsIHk6Mi45NDI2MzU1OTMyMjAzMzl9LHt4OjAuMzgxNDU3NjI3MTE4NjQ0MDYsIHk6Mi45NjEyNzk2NjEwMTY5NDk0fSx7eDowLjM3MjEzNTU5MzIyMDMzODk2LCB5OjIuOTc2NTMzODk4MzA1MDg1fSx7eDowLjM0NTAxNjk0OTE1MjU0MjQsIHk6Mi45ODMzMTM1NTkzMjIwMzR9LHt4OjAuMzQwNzc5NjYxMDE2OTQ5MSwgeTozLjAwMDI2MjcxMTg2NDQwNjd9LHt4OjAuMzcwNDQwNjc3OTY2MTAxNywgeTozLjAxNTUxNjk0OTE1MjU0MjZ9LHt4OjAuMzc4MDY3Nzk2NjEwMTY5NSwgeTozLjA0MDk0MDY3Nzk2NjEwMn0se3g6MC4zNDkyNTQyMzcyODgxMzU2LCB5OjMuMDUxOTU3NjI3MTE4NjQ0NH0pLCBcbiAgbmV3IEFycmF5KHt4OjAuMzc4OTE1MjU0MjM3Mjg4MSwgeToyLjkzOTI0NTc2MjcxMTg2NDR9LHt4OjAuMzgyMzA1MDg0NzQ1NzYyNywgeToyLjk2Mjk3NDU3NjI3MTE4Njh9LHt4OjAuMzYxMTE4NjQ0MDY3Nzk2NiwgeToyLjk3MzE0NDA2Nzc5NjYxMDZ9LHt4OjAuMzI1NTI1NDIzNzI4ODEzNTUsIHk6Mi45ODQxNjEwMTY5NDkxNTI2fSx7eDowLjMwODU3NjI3MTE4NjQ0MDY1LCB5OjMuMDAyODA1MDg0NzQ1NzYzfSx7eDowLjMzMjMwNTA4NDc0NTc2MjcsIHk6My4wMTM4MjIwMzM4OTgzMDUzfSx7eDowLjM2NjIwMzM4OTgzMDUwODUsIHk6My4wMjMxNDQwNjc3OTY2MTA0fSx7eDowLjM4MDYxMDE2OTQ5MTUyNTQzLCB5OjMuMDQ1MTc3OTY2MTAxNjk1fSx7eDowLjM1MjY0NDA2Nzc5NjYxMDE3LCB5OjMuMDU5NTg0NzQ1NzYyNzEyfSx7eDowLjMwOTQyMzcyODgxMzU1OTMsIHk6My4wNDg1Njc3OTY2MTAxNjk2fSx7eDowLjMxNTM1NTkzMjIwMzM4OTgsIHk6My4wMTYzNjQ0MDY3Nzk2NjEzfSx7eDowLjMzODIzNzI4ODEzNTU5MzIzLCB5OjIuOTk1MTc3OTY2MTAxNjk1fSx7eDowLjM2NjIwMzM4OTgzMDUwODUsIHk6Mi45ODgzOTgzMDUwODQ3NDZ9LHt4OjAuMzUyNjQ0MDY3Nzk2NjEwMTcsIHk6Mi45NjQ2Njk0OTE1MjU0MjM3fSx7eDowLjMxNzA1MDg0NzQ1NzYyNzEsIHk6Mi45NDg1Njc3OTY2MTAxNjk1fSx7eDowLjMzNjU0MjM3Mjg4MTM1NTksIHk6Mi45MzQxNjEwMTY5NDkxNTI4fSx7eDowLjM2NTM1NTkzMjIwMzM4OTgsIHk6Mi45MzkyNDU3NjI3MTE4NjQ0fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE5UyA9IG5ldyBBcnJheShcbiAgLy9uZXcgQXJyYXkoe3g6Ni41MTA5MTcwMzA1Njc2ODUsIHk6MC42NzY4NTU4OTUxOTY1MDY2fSx7eDo2LjQ5OTI3MjE5Nzk2MjE1NSwgeTowLjY2MjI5OTg1NDQzOTU5MjR9LHt4OjYuNDkwNTM4NTczNTA4MDA1NCwgeTowLjY1MjExMDYyNTkwOTc1MjZ9LHt4OjYuNDkwNTM4NTczNTA4MDA1NCwgeTowLjYyMTU0Mjk0MDMyMDIzMjl9LHt4OjYuNTA2NTUwMjE4MzQwNjExLCB5OjAuNjIwMDg3MzM2MjQ0NTQxNX0se3g6Ni41MTgxOTUwNTA5NDYxNDMsIHk6MC42MjU5MDk3NTI1NDczMDcyfSx7eDo2LjUxODE5NTA1MDk0NjE0MywgeTowLjY1MDY1NTAyMTgzNDA2MTF9LHt4OjYuNTAyMTgzNDA2MTEzNTM3LCB5OjAuNjU5Mzg4NjQ2Mjg4MjA5Nn0se3g6Ni41MTUyODM4NDI3OTQ3NTk1LCB5OjAuNjc2ODU1ODk1MTk2NTA2Nn0se3g6Ni41MTIzNzI2MzQ2NDMzNzcsIHk6MC42MjE1NDI5NDAzMjAyMzI5fSx7eDo2LjUwNTA5NDYxNDI2NDkxOTUsIHk6MC42MDU1MzEyOTU0ODc2Mjc0fSlcbiAgbmV3IEFycmF5KHt4OjYuNDk1NzI2NDk1NzI2NDk2LCB5OjAuNTk3MDY5NTk3MDY5NTk3MX0se3g6Ni40Nzc0MTE0Nzc0MTE0Nzc1LCB5OjAuNTc5OTc1NTc5OTc1NTh9LHt4OjYuNDcwMDg1NDcwMDg1NDcsIHk6MC41NTMxMTM1NTMxMTM1NTMxfSx7eDo2LjQ2ODg2NDQ2ODg2NDQ2OSwgeTowLjUyMjU4ODUyMjU4ODUyMjZ9LHt4OjYuNDczNzQ4NDczNzQ4NDc0LCB5OjAuNDg1OTU4NDg1OTU4NDg1OTV9LHt4OjYuNDkyMDYzNDkyMDYzNDkyLCB5OjAuNDcxMzA2NDcxMzA2NDcxM30se3g6Ni41MTg5MjU1MTg5MjU1MTksIHk6MC40NjUyMDE0NjUyMDE0NjUyfSx7eDo2LjU0MzM0NTU0MzM0NTU0MywgeTowLjQ3MjUyNzQ3MjUyNzQ3MjV9LHt4OjYuNTU1NTU1NTU1NTU1NTU1LCB5OjAuNTA0MjczNTA0MjczNTA0M30se3g6Ni41NTMxMTM1NTMxMTM1NTMsIHk6MC41NTE4OTI1NTE4OTI1NTE5fSx7eDo2LjU0NTc4NzU0NTc4NzU0NiwgeTowLjU4MzYzODU4MzYzODU4Mzd9LHt4OjYuNTA2NzE1NTA2NzE1NTA3LCB5OjAuNTc4NzU0NTc4NzU0NTc4OH0se3g6Ni41MDY3MTU1MDY3MTU1MDcsIHk6MC41NDcwMDg1NDcwMDg1NDcxfSx7eDo2LjUzMjM1NjUzMjM1NjUzMiwgeTowLjUyMjU4ODUyMjU4ODUyMjZ9LHt4OjYuNTI2MjUxNTI2MjUxNTI2LCB5OjAuNDgxMDc0NDgxMDc0NDgxMX0se3g6Ni40ODcxNzk0ODcxNzk0ODcsIHk6MC40Nzc0MTE0Nzc0MTE0Nzc0NH0se3g6Ni40NzEzMDY0NzEzMDY0NzEsIHk6MC40OTY5NDc0OTY5NDc0OTY5Nn0se3g6Ni41MDQyNzM1MDQyNzM1MDQsIHk6MC40OTkzODk0OTkzODk0OTk0fSx7eDo2LjUzNzI0MDUzNzI0MDUzNywgeTowLjUyODY5MzUyODY5MzUyODd9LHt4OjYuNTE1MjYyNTE1MjYyNTE1LCB5OjAuNTQ3MDA4NTQ3MDA4NTQ3MX0se3g6Ni40Nzc0MTE0Nzc0MTE0Nzc1LCB5OjAuNTUzMTEzNTUzMTEzNTUzMX0se3g6Ni40NzQ5Njk0NzQ5Njk0NzUsIHk6MC41ODQ4NTk1ODQ4NTk1ODQ5fSx7eDo2LjUxNjQ4MzUxNjQ4MzUxNiwgeTowLjU3ODc1NDU3ODc1NDU3ODh9LHt4OjYuNTUwNjcxNTUwNjcxNTUwNSwgeTowLjU4MzYzODU4MzYzODU4Mzd9LHt4OjYuNTI1MDMwNTI1MDMwNTI1LCB5OjAuNjA0Mzk1NjA0Mzk1NjA0NH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMCA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeToyLjg4OTgzMDUwODQ3NDU3Nn0se3g6MC4wODI5NjYxMDE2OTQ5MTUyNSwgeToyLjkwNjc3OTY2MTAxNjk0OX0se3g6MC4wODQ2NjEwMTY5NDkxNTI1MSwgeToyLjkxNjk0OTE1MjU0MjM3Mjd9LHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeToyLjkzODk4MzA1MDg0NzQ1Nzd9LHt4OjAuMDgzODEzNTU5MzIyMDMzODgsIHk6Mi45NjM1NTkzMjIwMzM4OTgzfSx7eDowLjA3Nzg4MTM1NTkzMjIwMzM2LCB5OjIuOTcwMzM4OTgzMDUwODQ3M30se3g6MC4wODU1MDg0NzQ1NzYyNzEyLCB5OjIuOTc0NTc2MjcxMTg2NDQwN30se3g6MC4wODEyNzExODY0NDA2Nzc5MywgeToyLjk3Nzk2NjEwMTY5NDkxNX0se3g6MC4wODQ2NjEwMTY5NDkxNTI1MSwgeToyLjk4MjIwMzM4OTgzMDUwODV9LHt4OjAuMDc5NTc2MjcxMTg2NDQwNjcsIHk6Mi45ODU1OTMyMjAzMzg5ODMyfSx7eDowLjA4NDY2MTAxNjk0OTE1MjUxLCB5OjIuOTg5ODMwNTA4NDc0NTc2fSx7eDowLjA4MDQyMzcyODgxMzU1OTMsIHk6Mi45OTU3NjI3MTE4NjQ0MDY2fSx7eDowLjA4NjM1NTkzMjIwMzM4OTgzLCB5OjIuOTk5MTUyNTQyMzcyODgxM30se3g6MC4wNzg3Mjg4MTM1NTkzMjIwNCwgeTozLjAwNTA4NDc0NTc2MjcxMTd9LHt4OjAuMDg1NTA4NDc0NTc2MjcxMiwgeTozLjAwODQ3NDU3NjI3MTE4NjR9LHt4OjAuMDgwNDIzNzI4ODEzNTU5MywgeTozLjAxMjcxMTg2NDQwNjc4fSx7eDowLjA4Mjk2NjEwMTY5NDkxNTI1LCB5OjMuMDIzNzI4ODEzNTU5MzIyfSx7eDowLjA4Mjk2NjEwMTY5NDkxNTI1LCB5OjMuMDM3Mjg4MTM1NTkzMjIwNH0se3g6MC4wODEyNzExODY0NDA2Nzc5MywgeTozLjA2NjEwMTY5NDkxNTI1NDR9LHt4OjAuMDgxMjcxMTg2NDQwNjc3OTMsIHk6My4wOTQwNjc3OTY2MTAxNjkzfSx7eDowLjA4NTUwODQ3NDU3NjI3MTIsIHk6My4xMTI3MTE4NjQ0MDY3Nzk1fSx7eDowLjA5MTQ0MDY3Nzk2NjEwMTY3LCB5OjMuMTIyMDMzODk4MzA1MDg0Nn0se3g6MC4xMDU4NDc0NTc2MjcxMTg2MSwgeTozLjEyNjI3MTE4NjQ0MDY3OH0se3g6MC4xMjM2NDQwNjc3OTY2MTAxNCwgeTozLjEyNzk2NjEwMTY5NDkxNTR9LHt4OjAuMTMyOTY2MTAxNjk0OTE1MjQsIHk6My4xNDE1MjU0MjM3Mjg4MTM1fSx7eDowLjEzMzgxMzU1OTMyMjAzMzg3LCB5OjMuMTkzMjIwMzM4OTgzMDUwN30se3g6MC4xMzcyMDMzODk4MzA1MDg0NSwgeTozLjIwODQ3NDU3NjI3MTE4NjZ9LHt4OjAuMTQ1Njc3OTY2MTAxNjk0OTIsIHk6My4yMTM1NTkzMjIwMzM4OTgzfSx7eDowLjE1NjY5NDkxNTI1NDIzNzMsIHk6My4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjE2OTQwNjc3OTY2MTAxNjkyLCB5OjMuMjExODY0NDA2Nzc5NjYxfSx7eDowLjE3NjE4NjQ0MDY3Nzk2NjA3LCB5OjMuMjE3Nzk2NjEwMTY5NDkxN30se3g6MC4xODEyNzExODY0NDA2Nzc5NywgeTozLjIwODQ3NDU3NjI3MTE4NjZ9LHt4OjAuMTg5NzQ1NzYyNzExODY0MzksIHk6My4yMTc3OTY2MTAxNjk0OTE3fSx7eDowLjE5MTQ0MDY3Nzk2NjEwMTcsIHk6My4yMTEwMTY5NDkxNTI1NDJ9LHt4OjAuMTk4MjIwMzM4OTgzMDUwODYsIHk6My4yMTYxMDE2OTQ5MTUyNTQzfSx7eDowLjIwMzMwNTA4NDc0NTc2MjcsIHk6My4yMDg0NzQ1NzYyNzExODY2fSx7eDowLjIwODM4OTgzMDUwODQ3NDYsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuMjEyNjI3MTE4NjQ0MDY3OCwgeTozLjIxMTAxNjk0OTE1MjU0Mn0se3g6MC4yMjE5NDkxNTI1NDIzNzI4NSwgeTozLjIxNjEwMTY5NDkxNTI1NDN9LHt4OjAuMjY4NTU5MzIyMDMzODk4MywgeTozLjIxNjEwMTY5NDkxNTI1NDN9LHt4OjAuMzc1MzM4OTgzMDUwODQ3NCwgeTozLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuMzg3MjAzMzg5ODMwNTA4NDUsIHk6My4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjM5NDgzMDUwODQ3NDU3NjMsIHk6My4yMTI3MTE4NjQ0MDY3Nzk2fSx7eDowLjQwNTg0NzQ1NzYyNzExODY2LCB5OjMuMjIwMzM4OTgzMDUwODQ3M30se3g6MC40MTAwODQ3NDU3NjI3MTE4NywgeTozLjIwOTMyMjAzMzg5ODMwNTN9LHt4OjAuNDIwMjU0MjM3Mjg4MTM1NTUsIHk6My4yMjAzMzg5ODMwNTA4NDczfSx7eDowLjQyNzAzMzg5ODMwNTA4NDcsIHk6My4yMDkzMjIwMzM4OTgzMDUzfSx7eDowLjQzMjk2NjEwMTY5NDkxNTMsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDM4ODk4MzA1MDg0NzQ1NzUsIHk6My4yMTAxNjk0OTE1MjU0MjM1fSx7eDowLjQ0OTkxNTI1NDIzNzI4ODEsIHk6My4yMTY5NDkxNTI1NDIzNzN9LHt4OjAuNDcxMTAxNjk0OTE1MjU0MywgeTozLjIxNTI1NDIzNzI4ODEzNTZ9LHt4OjAuNDg2MzU1OTMyMjAzMzg5ODUsIHk6My4yMTc3OTY2MTAxNjk0OTE3fSx7eDowLjQ5NDgzMDUwODQ3NDU3NjI3LCB5OjMuMjIyMDMzODk4MzA1MDg0N30se3g6MC40OTk5MTUyNTQyMzcyODgxNiwgeTozLjIzNzI4ODEzNTU5MzIyfSx7eDowLjQ5OTkxNTI1NDIzNzI4ODE2LCB5OjMuMjc0NTc2MjcxMTg2NDQwNn0se3g6MC40OTk5MTUyNTQyMzcyODgxNiwgeTozLjMxNTI1NDIzNzI4ODEzNTd9LHt4OjAuNDk4MjIwMzM4OTgzMDUwOCwgeTozLjM0NDkxNTI1NDIzNzI4OH0se3g6MC40OTkwNjc3OTY2MTAxNjk1LCB5OjMuMzYyNzExODY0NDA2Nzc5NX0sIHt4OjAuNTA2Njk0OTE1MjU0MjM3MywgeTozLjM3NTQyMzcyODgxMzU1OTN9LHt4OjAuNTMyMTE4NjQ0MDY3Nzk2NSwgeTozLjM3Nzk2NjEwMTY5NDkxNTR9LHt4OjAuNTU1ODQ3NDU3NjI3MTE4NiwgeTozLjM3ODgxMzU1OTMyMjAzNH0se3g6MC41Njk0MDY3Nzk2NjEwMTY5LCB5OjMuMzgzODk4MzA1MDg0NzQ1OH0se3g6MC41NzYxODY0NDA2Nzc5NjYyLCB5OjMuMzk0OTE1MjU0MjM3Mjg4Mn0se3g6MC41NzYxODY0NDA2Nzc5NjYyLCB5OjMuNDExODY0NDA2Nzc5NjYxfSx7eDowLjU3NjE4NjQ0MDY3Nzk2NjIsIHk6My40NjI3MTE4NjQ0MDY3Nzk2fSx7eDowLjU3NjE4NjQ0MDY3Nzk2NjIsIHk6My40NzcxMTg2NDQwNjc3OTd9LHt4OjAuNTgyMTE4NjQ0MDY3Nzk2NiwgeTozLjQ4MzA1MDg0NzQ1NzYyN30se3g6MC41ODk3NDU3NjI3MTE4NjQzLCB5OjMuNDg4OTgzMDUwODQ3NDU3NX0se3g6MC42MTg1NTkzMjIwMzM4OTgzLCB5OjMuNDkwNjc3OTY2MTAxNjk1fSx7eDowLjY1MTYxMDE2OTQ5MTUyNTUsIHk6My40ODg5ODMwNTA4NDc0NTc1fSx7eDowLjY1NzU0MjM3Mjg4MTM1NTksIHk6My40ODA1MDg0NzQ1NzYyNzF9LHt4OjAuNjYwMDg0NzQ1NzYyNzExOSwgeTozLjQ2OTQ5MTUyNTQyMzcyODZ9LHt4OjAuNjU4Mzg5ODMwNTA4NDc0NSwgeTozLjQ1MDg0NzQ1NzYyNzExOX0se3g6MC42Njg1NTkzMjIwMzM4OTgzLCB5OjMuMzc5NjYxMDE2OTQ5MTUyM30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMFMgPSBuZXcgQXJyYXkoXG4gIC8vbmV3IEFycmF5KHt4OjUuMTQxMTkzNTk1MzQyMDY3LCB5OjAuMjI1NjE4NjMxNzMyMTY4ODR9LHt4OjUuMTQxMTkzNTk1MzQyMDY3LCB5OjAuMjA5NjA2OTg2ODk5NTYzM30se3g6NS4xMzgyODIzODcxOTA2ODQsIHk6MC4xOTIxMzk3Mzc5OTEyNjYzOH0se3g6NS4xMzk3Mzc5OTEyNjYzNzYsIHk6MC4xNjAxMTY0NDgzMjYwNTUzMn0se3g6NS4xMzk3Mzc5OTEyNjYzNzYsIHk6MC4xMzEwMDQzNjY4MTIyMjcwN30se3g6NS4xNDI2NDkxOTk0MTc3NTgsIHk6MC4xMTIwODE1MTM4MjgyMzg3Mn0se3g6NS4xNTU3NDk2MzYwOTg5ODEsIHk6MC4xMDMzNDc4ODkzNzQwOTAyNH0se3g6NS4xODYzMTczMjE2ODg1MDEsIHk6MC4xMDE4OTIyODUyOTgzOTg4M30se3g6NS41MDUwOTQ2MTQyNjQ5MTk1LCB5OjAuMTAxODkyMjg1Mjk4Mzk4ODN9LHt4OjUuOTM3NDA5MDI0NzQ1MjY5NSwgeTowLjA5ODk4MTA3NzE0NzAxNjAxfSx7eDo1Ljk4MjUzMjc1MTA5MTcwMzUsIHk6MC4xMDMzNDc4ODkzNzQwOTAyNH0se3g6NS45OTcwODg3OTE4NDg2MTc1LCB5OjAuMTAwNDM2NjgxMjIyNzA3NDJ9LHt4OjYuMDAyOTExMjA4MTUxMzgyNSwgeTowLjA4NDQyNTAzNjM5MDEwMTg5fSx7eDo2LjAwMjkxMTIwODE1MTM4MjUsIHk6MC4wNTgyMjQxNjMwMjc2NTY0OH0se3g6Ni4wMDU4MjI0MTYzMDI3NjYsIHk6MC4wMzYzOTAxMDE4OTIyODUyOTV9LHt4OjYuMDEzMTAwNDM2NjgxMjIyLCB5OjAuMDI3NjU2NDc3NDM4MTM2ODI4fSx7eDo2LjAzMDU2NzY4NTU4OTUyLCB5OjAuMDIzMjg5NjY1MjExMDYyNTkyfSx7eDo2LjE5Nzk2MjE1NDI5NDAzMiwgeTowLjAyNjIwMDg3MzM2MjQ0NTQxM30se3g6Ni4yMTk3OTYyMTU0Mjk0MDMsIHk6MC4wMzM0Nzg4OTM3NDA5MDI0NzR9LHt4OjYuMjI4NTI5ODM5ODgzNTUyLCB5OjAuMDUzODU3MzUwODAwNTgyMjQ1fSx7eDo2LjIyNTYxODYzMTczMjE2OSwgeTowLjI5Njk0MzIzMTQ0MTA0ODA2fSx7eDo2LjIzNzI2MzQ2NDMzNzcsIHk6MC4zMTczMjE2ODg1MDA3Mjc4fSx7eDo2LjI1NDczMDcxMzI0NTk5NywgeTowLjMxODc3NzI5MjU3NjQxOTI0fSx7eDo2LjI3ODAyMDM3ODQ1NzA2LCB5OjAuMzI4OTY2NTIxMTA2MjU5MX0se3g6Ni4yODA5MzE1ODY2MDg0NDI1LCB5OjAuMzU2NjIyOTk4NTQ0Mzk1OTR9LHt4OjYuMjg1Mjk4Mzk4ODM1NTE3LCB5OjAuNDA0NjU3OTMzMDQyMjEyNTR9LHt4OjYuMzAyNzY1NjQ3NzQzODE0LCB5OjAuNDE0ODQ3MTYxNTcyMDUyNH0se3g6Ni4zMTg3NzcyOTI1NzY0MTksIHk6MC40MTYzMDI3NjU2NDc3NDM4fSx7eDo2LjMyNzUxMDkxNzAzMDU2OCwgeTowLjQyMDY2OTU3Nzg3NDgxODA3fSx7eDo2LjMzMzMzMzMzMzMzMzMzMywgeTowLjQxMzM5MTU1NzQ5NjM2MX0se3g6Ni4zNDIwNjY5NTc3ODc0ODIsIHk6MC40MjA2Njk1Nzc4NzQ4MTgwN30se3g6Ni4zNTIyNTYxODYzMTczMjEsIHk6MC40MTYzMDI3NjU2NDc3NDM4fSx7eDo2LjM2MDk4OTgxMDc3MTQ3LCB5OjAuNDIzNTgwNzg2MDI2MjAwODZ9LHt4OjYuMzY5NzIzNDM1MjI1NjE5LCB5OjAuNDEzMzkxNTU3NDk2MzYxfSx7eDo2LjM4MjgyMzg3MTkwNjg0MSwgeTowLjQxOTIxMzk3Mzc5OTEyNjZ9LHt4OjYuNTU4OTUxOTY1MDY1NTAzLCB5OjAuNDE5MjEzOTczNzk5MTI2Nn0se3g6Ni41NzQ5NjM2MDk4OTgxMDc1LCB5OjAuNDIyMTI1MTgxOTUwNTA5NDZ9LHt4OjYuNTgyMjQxNjMwMjc2NTY1LCB5OjAuNDExOTM1OTUzNDIwNjY5Nn0se3g6Ni41OTUzNDIwNjY5NTc3ODcsIHk6MC40MjY0OTE5OTQxNzc1ODM3fSx7eDo2LjU5OTcwODg3OTE4NDg2MTUsIHk6MC40MTQ4NDcxNjE1NzIwNTI0fSx7eDo2LjYxMjgwOTMxNTg2NjA4NSwgeTowLjQyNTAzNjM5MDEwMTg5MjI2fSx7eDo2LjYyMDA4NzMzNjI0NDU0MSwgeTowLjQxNDg0NzE2MTU3MjA1MjR9LHt4OjYuNjM3NTU0NTg1MTUyODM5LCB5OjAuNDE3NzU4MzY5NzIzNDM1Mn0se3g6Ni42NjY2NjY2NjY2NjY2NjcsIHk6MC40MjIxMjUxODE5NTA1MDk0Nn0se3g6Ni42ODU1ODk1MTk2NTA2NTUsIHk6MC40MzUyMjU2MTg2MzE3MzIxNX0se3g6Ni42ODcwNDUxMjM3MjYzNDcsIHk6MC40ODE4MDQ5NDkwNTM4NTczNX0se3g6Ni42ODg1MDA3Mjc4MDIwMzgsIHk6MC41MzEyOTU0ODc2MjczNjUzfSx7eDo2LjY4ODUwMDcyNzgwMjAzOCwgeTowLjU1NzQ5NjM2MDk4OTgxMDh9LHt4OjYuNjg4NTAwNzI3ODAyMDM4LCB5OjAuNTc3ODc0ODE4MDQ5NDkwNn0se3g6Ni42OTcyMzQzNTIyNTYxODYsIHk6MC41OTA5NzUyNTQ3MzA3MTMyfSx7eDo2LjcxMzI0NTk5NzA4ODc5MiwgeTowLjYwMjYyMDA4NzMzNjI0NDV9LHt4OjYuNzM5NDQ2ODcwNDUxMjM3LCB5OjAuNTk5NzA4ODc5MTg0ODYxN30se3g6Ni43NTk4MjUzMjc1MTA5MTcsIHk6MC42MDI2MjAwODczMzYyNDQ1fSx7eDo2Ljc3MjkyNTc2NDE5MjE0LCB5OjAuNjE0MjY0OTE5OTQxNzc1OH0se3g6Ni43NzQzODEzNjgyNjc4MzEsIHk6MC42NTA2NTUwMjE4MzQwNjExfSx7eDo2Ljc3NDM4MTM2ODI2NzgzMSwgeTowLjcwNDUxMjM3MjYzNDY0MzR9LHt4OjYuNzc4NzQ4MTgwNDk0OTA1NSwgeTowLjcyMDUyNDAxNzQ2NzI0ODl9LHt4OjYuNzk0NzU5ODI1MzI3NTExLCB5OjAuNzIxOTc5NjIxNTQyOTQwNH0se3g6Ni44MzY5NzIzNDM1MjI1NjIsIHk6MC43MjE5Nzk2MjE1NDI5NDA0fSx7eDo2Ljg1ODgwNjQwNDY1NzkzMywgeTowLjcxNjE1NzIwNTI0MDE3NDd9LHt4OjYuODY2MDg0NDI1MDM2MzksIHk6MC43MTMyNDU5OTcwODg3OTE5fSx7eDo2Ljg2NzU0MDAyOTExMjA4MiwgeTowLjcwMTYwMTE2NDQ4MzI2MDZ9LHt4OjYuODcxOTA2ODQxMzM5MTU2LCB5OjAuNjc1NDAwMjkxMTIwODE1MX0se3g6Ni44NzE5MDY4NDEzMzkxNTYsIHk6MC42Mjg4MjA5NjA2OTg2OX0pXG4gIC8vbmV3IEFycmF5KHt4OjUuMTQxNjQ2NDg5MTA0MTE2LCB5OjAuMjI3NjAyOTA1NTY5MDA3MjV9LHt4OjUuMTQwNDM1ODM1MzUxMDksIHk6MC4yMTA2NTM3NTMwMjY2MzQ0fSx7eDo1LjE0MDQzNTgzNTM1MTA5LCB5OjAuMTk5NzU3ODY5MjQ5Mzk0Njh9LHt4OjUuMTM5MjI1MTgxNTk4MDYyNSwgeTowLjE3OTE3Njc1NTQ0Nzk0MTl9LHt4OjUuMTM5MjI1MTgxNTk4MDYyNSwgeTowLjE1NjE3NDMzNDE0MDQzNTgzfSx7eDo1LjEzOTIyNTE4MTU5ODA2MjUsIHk6MC4xMzgwMTQ1Mjc4NDUwMzYzMn0se3g6NS4xMzkyMjUxODE1OTgwNjI1LCB5OjAuMTI0Njk3MzM2NTYxNzQzMzR9LHt4OjUuMTQwNDM1ODM1MzUxMDksIHk6MC4xMTYyMjI3NjAyOTA1NTY5fSx7eDo1LjE0NDA2Nzc5NjYxMDE2OTYsIHk6MC4xMTAxNjk0OTE1MjU0MjM3M30se3g6NS4xNDg5MTA0MTE2MjIyNzYsIHk6MC4xMDUzMjY4NzY1MTMzMTcyfSx7eDo1LjE1NjE3NDMzNDE0MDQzNiwgeTowLjEwMTY5NDkxNTI1NDIzNzN9LHt4OjUuMTc1NTQ0Nzk0MTg4ODYyLCB5OjAuMDk5MjczNjA3NzQ4MTg0MDF9LHt4OjUuMjA3MDIxNzkxNzY3NTU1LCB5OjAuMTAwNDg0MjYxNTAxMjEwNjV9LHt4OjUuNTIzMDAyNDIxMzA3NTA2LCB5OjAuMTAwNDg0MjYxNTAxMjEwNjV9LHt4OjUuOTE3Njc1NTQ0Nzk0MTg4NCwgeTowLjEwMDQ4NDI2MTUwMTIxMDY1fSx7eDo1Ljk4NTQ3MjE1NDk2MzY4MSwgeTowLjA5OTI3MzYwNzc0ODE4NDAxfSx7eDo1Ljk5NjM2ODAzODc0MDkyLCB5OjAuMDk0NDMwOTkyNzM2MDc3NDh9LHt4OjYuMDAxMjEwNjUzNzUzMDI2LCB5OjAuMDg1OTU2NDE2NDY0ODkxMDR9LHt4OjYuMDAzNjMxOTYxMjU5MDgsIHk6MC4wNjkwMDcyNjM5MjI1MTgxNn0se3g6Ni4wMDM2MzE5NjEyNTkwOCwgeTowLjA1NTY5MDA3MjYzOTIyNTE4fSx7eDo2LjAwMjQyMTMwNzUwNjA1MzUsIHk6MC4wMzc1MzAyNjYzNDM4MjU2N30se3g6Ni4wMDcyNjM5MjI1MTgxNiwgeTowLjAzMDI2NjM0MzgyNTY2NTg2fSx7eDo2LjAxMjEwNjUzNzUzMDI2NywgeTowLjAyMTc5MTc2NzU1NDQ3OTQxN30se3g6Ni4wMjkwNTU2OTAwNzI2Mzk1LCB5OjAuMDIwNTgxMTEzODAxNDUyNzg0fSx7eDo2LjIwNTgxMTEzODAxNDUyNzYsIHk6MC4wMjQyMTMwNzUwNjA1MzI2ODd9LHt4OjYuMjE5MTI4MzI5Mjk3ODIxLCB5OjAuMDI5MDU1NjkwMDcyNjM5MjI3fSx7eDo2LjIyNjM5MjI1MTgxNTk4LCB5OjAuMDQzNTgzNTM1MTA4OTU4ODM1fSx7eDo2LjIzMDAyNDIxMzA3NTA2MSwgeTowLjEyMzQ4NjY4MjgwODcxNjd9LHt4OjYuMjI2MzkyMjUxODE1OTgsIHk6MC4yOTY2MTAxNjk0OTE1MjU0fSx7eDo2LjIzMjQ0NTUyMDU4MTExNCwgeTowLjMwOTkyNzM2MDc3NDgxODR9LHt4OjYuMjQzMzQxNDA0MzU4MzU0LCB5OjAuMzE4NDAxOTM3MDQ2MDA0ODN9LHt4OjYuMjU0MjM3Mjg4MTM1NTkzLCB5OjAuMzE4NDAxOTM3MDQ2MDA0ODN9LHt4OjYuMjY4NzY1MTMzMTcxOTEzLCB5OjAuMzE5NjEyNTkwNzk5MDMxNX0se3g6Ni4yNzg0NTAzNjMxOTYxMjYsIHk6MC4zMjU2NjU4NTk1NjQxNjQ2Nn0se3g6Ni4yODMyOTI5NzgyMDgyMzIsIHk6MC4zNDI2MTUwMTIxMDY1Mzc1NX0se3g6Ni4yODQ1MDM2MzE5NjEyNTksIHk6MC4zNzQwOTIwMDk2ODUyMzAwNH0se3g6Ni4yODMyOTI5NzgyMDgyMzIsIHk6MC4zOTcwOTQ0MzA5OTI3MzYwNn0se3g6Ni4yOTE3Njc1NTQ0Nzk0MTksIHk6MC40MTI4MzI5Mjk3ODIwODIzfSx7eDo2LjMwNjI5NTM5OTUxNTczOCwgeTowLjQxNjQ2NDg5MTA0MTE2MjI0fSx7eDo2LjMxNzE5MTI4MzI5Mjk3OSwgeTowLjQxNjQ2NDg5MTA0MTE2MjI0fSx7eDo2LjMyNTY2NTg1OTU2NDE2NSwgeTowLjQxODg4NjE5ODU0NzIxNTV9LHt4OjYuMzMwNTA4NDc0NTc2MjcxLCB5OjAuNDExNjIyMjc2MDI5MDU1N30se3g6Ni4zMzQxNDA0MzU4MzUzNTE1LCB5OjAuNDE3Njc1NTQ0Nzk0MTg4ODR9LHt4OjYuMzM4OTgzMDUwODQ3NDU4LCB5OjAuNDExNjIyMjc2MDI5MDU1N30se3g6Ni4zNDI2MTUwMTIxMDY1MzcsIHk6MC40MTc2NzU1NDQ3OTQxODg4NH0se3g6Ni4zNDYyNDY5NzMzNjU2MTcsIHk6MC40MTI4MzI5Mjk3ODIwODIzfSx7eDo2LjM1MjMwMDI0MjEzMDc1MSwgeTowLjQxNjQ2NDg5MTA0MTE2MjI0fSx7eDo2LjM1NTkzMjIwMzM4OTgzMDQsIHk6MC40MTA0MTE2MjIyNzYwMjkwNn0se3g6Ni4zNTcxNDI4NTcxNDI4NTcsIHk6MC40MTg4ODYxOTg1NDcyMTU1fSx7eDo2LjM2MTk4NTQ3MjE1NDk2NCwgeTowLjQxMjgzMjkyOTc4MjA4MjN9LHt4OjYuMzY5MjQ5Mzk0NjczMTIzNSwgeTowLjQyMjUxODE1OTgwNjI5NTR9LHt4OjYuMzc0MDkyMDA5Njg1MjMsIHk6MC40MTUyNTQyMzcyODgxMzU2fSx7eDo2LjM5MTA0MTE2MjIyNzYwMywgeTowLjQxODg4NjE5ODU0NzIxNTV9LHt4OjYuNTYyOTUzOTk1MTU3Mzg1LCB5OjAuNDE4ODg2MTk4NTQ3MjE1NX0se3g6Ni41Nzk5MDMxNDc2OTk3NTgsIHk6MC40MTQwNDM1ODM1MzUxMDg5NX0se3g6Ni41ODU5NTY0MTY0NjQ4OTEsIHk6MC40MjI1MTgxNTk4MDYyOTU0fSx7eDo2LjU5MDc5OTAzMTQ3Njk5NzUsIHk6MC40MTE2MjIyNzYwMjkwNTU3fSx7eDo2LjU5NDQzMDk5MjczNjA3NywgeTowLjQxODg4NjE5ODU0NzIxNTV9LHt4OjYuNTk4MDYyOTUzOTk1MTU3LCB5OjAuNDExNjIyMjc2MDI5MDU1N30se3g6Ni42MDI5MDU1NjkwMDcyNjQsIHk6MC40MTY0NjQ4OTEwNDExNjIyNH0se3g6Ni42MDc3NDgxODQwMTkzNywgeTowLjQxMjgzMjkyOTc4MjA4MjN9LHt4OjYuNjExMzgwMTQ1Mjc4NDUsIHk6MC40MTg4ODYxOTg1NDcyMTU1fSx7eDo2LjYxNjIyMjc2MDI5MDU1NywgeTowLjQxMTYyMjI3NjAyOTA1NTd9LHt4OjYuNjIxMDY1Mzc1MzAyNjYzLCB5OjAuNDIwMDk2ODUyMzAwMjQyMTN9LHt4OjYuNjIzNDg2NjgyODA4NzE3LCB5OjAuNDE1MjU0MjM3Mjg4MTM1Nn0se3g6Ni42NDI4NTcxNDI4NTcxNDMsIHk6MC40MTc2NzU1NDQ3OTQxODg4NH0se3g6Ni42NjIyMjc2MDI5MDU1NjksIHk6MC40MjAwOTY4NTIzMDAyNDIxM30se3g6Ni42NzQzMzQxNDA0MzU4MzUsIHk6MC40MjI1MTgxNTk4MDYyOTU0fSx7eDo2LjY4MjgwODcxNjcwNzAyMSwgeTowLjQyOTc4MjA4MjMyNDQ1NTJ9LHt4OjYuNjkwMDcyNjM5MjI1MTgyLCB5OjAuNDQ5MTUyNTQyMzcyODgxNH0se3g6Ni42ODc2NTEzMzE3MTkxMjgsIHk6MC41MDEyMTA2NTM3NTMwMjY2fSx7eDo2LjY4NjQ0MDY3Nzk2NjEwMiwgeTowLjU1ODExMTM4MDE0NTI3ODV9LHt4OjYuNjg2NDQwNjc3OTY2MTAyLCB5OjAuNTczODQ5ODc4OTM0NjI0N30se3g6Ni42ODg4NjE5ODU0NzIxNTUsIHk6MC41ODQ3NDU3NjI3MTE4NjQ0fSx7eDo2LjcwMzM4OTgzMDUwODQ3NSwgeTowLjU5Njg1MjMwMDI0MjEzMDh9LHt4OjYuNzI2MzkyMjUxODE1OTgsIHk6MC42MDA0ODQyNjE1MDEyMTA3fSx7eDo2Ljc0NTc2MjcxMTg2NDQwNywgeTowLjYwMDQ4NDI2MTUwMTIxMDd9LHt4OjYuNzYyNzExODY0NDA2Nzc5LCB5OjAuNjAyOTA1NTY5MDA3MjYzOX0se3g6Ni43Njk5NzU3ODY5MjQ5MzksIHk6MC42MTI1OTA3OTkwMzE0Nzd9LHt4OjYuNzc2MDI5MDU1NjkwMDcyLCB5OjAuNjI0Njk3MzM2NTYxNzQzM30se3g6Ni43NzYwMjkwNTU2OTAwNzIsIHk6MC42NDA0MzU4MzUzNTEwODk2fSx7eDo2Ljc3NjAyOTA1NTY5MDA3MiwgeTowLjY2NDY0ODkxMDQxMTYyMjN9LHt4OjYuNzczNjA3NzQ4MTg0MDIsIHk6MC42ODI4MDg3MTY3MDcwMjE4fSx7eDo2Ljc3MzYwNzc0ODE4NDAyLCB5OjAuNzAwOTY4NTIzMDAyNDIxM30se3g6Ni43ODA4NzE2NzA3MDIxNzksIHk6MC43MTMwNzUwNjA1MzI2ODc3fSx7eDo2Ljc5MTc2NzU1NDQ3OTQxOSwgeTowLjcxNzkxNzY3NTU0NDc5NDJ9LHt4OjYuODExMTM4MDE0NTI3ODQ1LCB5OjAuNzIwMzM4OTgzMDUwODQ3NH0se3g6Ni44MzI5Mjk3ODIwODIzMjQsIHk6MC43MjAzMzg5ODMwNTA4NDc0fSx7eDo2Ljg1MTA4OTU4ODM3NzcyNCwgeTowLjcxOTEyODMyOTI5NzgyMDh9LHt4OjYuODU5NTY0MTY0NjQ4OTEsIHk6MC43MTU0OTYzNjgwMzg3NDF9LHt4OjYuODY2ODI4MDg3MTY3MDcsIHk6MC43MDMzODk4MzA1MDg0NzQ2fSx7eDo2Ljg3MDQ2MDA0ODQyNjE1LCB5OjAuNjUyNTQyMzcyODgxMzU2fSlcbiAgbmV3IEFycmF5KHt4OjUuMTQwMjg3NzY5Nzg0MTcyLCB5OjAuMjI3ODE3NzQ1ODAzMzU3M30se3g6NS4xMzkwODg3MjkwMTY3ODcsIHk6MC4yMDYyMzUwMTE5OTA0MDc2N30se3g6NS4xMzkwODg3MjkwMTY3ODcsIHk6MC4xODgyNDk0MDA0Nzk2MTYzfSx7eDo1LjEzNjY5MDY0NzQ4MjAxNCwgeTowLjE2NDI2ODU4NTEzMTg5NDV9LHt4OjUuMTM2NjkwNjQ3NDgyMDE0LCB5OjAuMTQ3NDgyMDE0Mzg4NDg5Mn0se3g6NS4xMzc4ODk2ODgyNDk0LCB5OjAuMTI5NDk2NDAyODc3Njk3ODR9LHt4OjUuMTQwMjg3NzY5Nzg0MTcyLCB5OjAuMTE3NTA1OTk1MjAzODM2OTR9LHt4OjUuMTQyNjg1ODUxMzE4OTQ0LCB5OjAuMTEwMzExNzUwNTk5NTIwMzh9LHt4OjUuMTQ5ODgwMDk1OTIzMjYyLCB5OjAuMTA0MzE2NTQ2NzYyNTg5OTN9LHt4OjUuMTYxODcwNTAzNTk3MTIzLCB5OjAuMDk5NTIwMzgzNjkzMDQ1NTd9LHt4OjUuMTk5MDQwNzY3Mzg2MDkxLCB5OjAuMDk1OTIzMjYxMzkwODg3Mjl9LHt4OjUuOTgwODE1MzQ3NzIxODIzLCB5OjAuMDk5NTIwMzgzNjkzMDQ1NTd9LHt4OjUuOTk1MjAzODM2OTMwNDU2LCB5OjAuMDkzNTI1MTc5ODU2MTE1MTF9LHt4OjUuOTk4ODAwOTU5MjMyNjEzNSwgeTowLjA4NzUyOTk3NjAxOTE4NDY1fSx7eDo2LjAwMTE5OTA0MDc2NzM4NjUsIHk6MC4wNzU1Mzk1NjgzNDUzMjM3NH0se3g6Ni4wMDExOTkwNDA3NjczODY1LCB5OjAuMDYxMTUxMDc5MTM2NjkwNjV9LHt4OjYuMDAyMzk4MDgxNTM0NzcyLCB5OjAuMDQzMTY1NDY3NjI1ODk5Mjh9LHt4OjYuMDAyMzk4MDgxNTM0NzcyLCB5OjAuMDM3MTcwMjYzNzg4OTY4ODJ9LHt4OjYuMDA0Nzk2MTYzMDY5NTQ0LCB5OjAuMDMyMzc0MTAwNzE5NDI0NDZ9LHt4OjYuMDA5NTkyMzI2MTM5MDg5LCB5OjAuMDI2Mzc4ODk2ODgyNDk0MDA0fSx7eDo2LjAxNzk4NTYxMTUxMDc5MiwgeTowLjAyMTU4MjczMzgxMjk0OTY0fSx7eDo2LjAzMzU3MzE0MTQ4NjgxLCB5OjAuMDE5MTg0NjUyMjc4MTc3NDU3fSx7eDo2LjE5OTA0MDc2NzM4NjA5MSwgeTowLjAyMTU4MjczMzgxMjk0OTY0fSx7eDo2LjIxMzQyOTI1NjU5NDcyNCwgeTowLjAyNjM3ODg5Njg4MjQ5NDAwNH0se3g6Ni4yMjU0MTk2NjQyNjg1ODU1LCB5OjAuMDM4MzY5MzA0NTU2MzU0OTF9LHt4OjYuMjMwMjE1ODI3MzM4MTMsIHk6MC4wNTUxNTU4NzUyOTk3NjAxOX0se3g6Ni4yMzI2MTM5MDg4NzI5MDIsIHk6MC4yMjMwMjE1ODI3MzM4MTI5NX0se3g6Ni4yMzE0MTQ4NjgxMDU1MTU1LCB5OjAuMjM1MDExOTkwNDA3NjczODd9LHt4OjYuMjMyNjEzOTA4ODcyOTAyLCB5OjAuMjQyMjA2MjM1MDExOTkwNH0se3g6Ni4yMzk4MDgxNTM0NzcyMTg1LCB5OjAuMjQ4MjAxNDM4ODQ4OTIwODd9LHt4OjYuMjUyOTk3NjAxOTE4NDY1LCB5OjAuMjUyOTk3NjAxOTE4NDY1Mn0se3g6Ni4yNjQ5ODgwMDk1OTIzMjYsIHk6MC4yNTI5OTc2MDE5MTg0NjUyfSx7eDo2LjI3NTc3OTM3NjQ5ODgwMSwgeTowLjI1NTM5NTY4MzQ1MzIzNzQzfSx7eDo2LjI4Mjk3MzYyMTEwMzExNzUsIHk6MC4yNjQ5ODgwMDk1OTIzMjYxNn0se3g6Ni4yODc3Njk3ODQxNzI2NjIsIHk6MC4yODA1NzU1Mzk1NjgzNDUzfSx7eDo2LjI4NjU3MDc0MzQwNTI3NiwgeTowLjMzMjEzNDI5MjU2NTk0NzIzfSx7eDo2LjI5MjU2NTk0NzI0MjIwNiwgeTowLjM0NTMyMzc0MTAwNzE5NDI2fSx7eDo2LjMwOTM1MjUxNzk4NTYxMSwgeTowLjM1MDExOTkwNDA3NjczODZ9LHt4OjYuMzIwMTQzODg0ODkyMDg3LCB5OjAuMzQ2NTIyNzgxNzc0NTgwMzV9LHt4OjYuMzI2MTM5MDg4NzI5MDE2NSwgeTowLjM1MTMxODk0NDg0NDEyNDd9LHt4OjYuMzMzMzMzMzMzMzMzMzMzLCB5OjAuMzQ0MTI0NzAwMjM5ODA4Mn0se3g6Ni4zMzU3MzE0MTQ4NjgxMDUsIHk6MC4zNTAxMTk5MDQwNzY3Mzg2fSx7eDo2LjM0MTcyNjYxODcwNTAzNiwgeTowLjM0NTMyMzc0MTAwNzE5NDI2fSx7eDo2LjM0NjUyMjc4MTc3NDU4LCB5OjAuMzUxMzE4OTQ0ODQ0MTI0N30se3g6Ni4zNTI1MTc5ODU2MTE1MSwgeTowLjM0MDUyNzU3NzkzNzY0OTl9LHt4OjYuMzU2MTE1MTA3OTEzNjY5LCB5OjAuMzUwMTE5OTA0MDc2NzM4Nn0se3g6Ni4zNjMzMDkzNTI1MTc5ODYsIHk6MC4zNDA1Mjc1Nzc5Mzc2NDk5fSx7eDo2LjM2ODEwNTUxNTU4NzUzLCB5OjAuMzQ3NzIxODIyNTQxOTY2NDN9LHt4OjYuMzc0MTAwNzE5NDI0NDYxLCB5OjAuMzM5MzI4NTM3MTcwMjYzOH0se3g6Ni4zODQ4OTIwODYzMzA5MzUsIHk6MC4zNDg5MjA4NjMzMDkzNTI1fSx7eDo2LjU2NDc0ODIwMTQzODg0ODUsIHk6MC4zNDg5MjA4NjMzMDkzNTI1fSx7eDo2LjU4MDMzNTczMTQxNDg2OCwgeTowLjM0NDEyNDcwMDIzOTgwODJ9LHt4OjYuNTg3NTI5OTc2MDE5MTg0NiwgeTowLjM1MTMxODk0NDg0NDEyNDd9LHt4OjYuNTkyMzI2MTM5MDg4NzI5LCB5OjAuMzQxNzI2NjE4NzA1MDM1OTZ9LHt4OjYuNTk4MzIxMzQyOTI1NjYsIHk6MC4zNDg5MjA4NjMzMDkzNTI1fSx7eDo2LjYxMDMxMTc1MDU5OTUyMSwgeTowLjM0MDUyNzU3NzkzNzY0OTl9LHt4OjYuNjE1MTA3OTEzNjY5MDY1LCB5OjAuMzQ1MzIzNzQxMDA3MTk0MjZ9LHt4OjYuNjI0NzAwMjM5ODA4MTU0LCB5OjAuMzQxNzI2NjE4NzA1MDM1OTZ9LHt4OjYuNjMzMDkzNTI1MTc5ODU2LCB5OjAuMzUxMzE4OTQ0ODQ0MTI0N30se3g6Ni42NzAyNjM3ODg5Njg4MjUsIHk6MC4zNTM3MTcwMjYzNzg4OTY5fSx7eDo2LjY4NDY1MjI3ODE3NzQ1OCwgeTowLjM2MDkxMTI3MDk4MzIxMzR9LHt4OjYuNjg5NDQ4NDQxMjQ3MDAyLCB5OjAuMzgwMDk1OTIzMjYxMzkwOX0se3g6Ni42ODcwNTAzNTk3MTIyMywgeTowLjQzMTY1NDY3NjI1ODk5Mjh9LHt4OjYuNjg3MDUwMzU5NzEyMjMsIHk6MC40NzcyMTgyMjU0MTk2NjQyNH0se3g6Ni42ODk0NDg0NDEyNDcwMDIsIHk6MC41MTU1ODc1Mjk5NzYwMTkyfSx7eDo2LjY4ODI0OTQwMDQ3OTYxNjUsIHk6MC41MjE1ODI3MzM4MTI5NDk2fSx7eDo2LjcyNzgxNzc0NTgwMzM1OCwgeTowLjUzMjM3NDEwMDcxOTQyNDV9LHt4OjYuNzUyOTk3NjAxOTE4NDY1LCB5OjAuNTI5OTc2MDE5MTg0NjUyM30se3g6Ni43Njk3ODQxNzI2NjE4NywgeTowLjUzNTk3MTIyMzAyMTU4Mjd9LHt4OjYuNzc5Mzc2NDk4ODAwOTU5LCB5OjAuNTU3NTUzOTU2ODM0NTMyM30se3g6Ni43NzkzNzY0OTg4MDA5NTksIHk6MC41OTExMjcwOTgzMjEzNDI5fSx7eDo2Ljc3OTM3NjQ5ODgwMDk1OSwgeTowLjYzNTQ5MTYwNjcxNDYyODN9LHt4OjYuNzg2NTcwNzQzNDA1Mjc2LCB5OjAuNjQ5ODgwMDk1OTIzMjYxM30se3g6Ni44MDQ1NTYzNTQ5MTYwNjcsIHk6MC42NTM0NzcyMTgyMjU0MTk3fSx7eDo2LjgyOTczNjIxMTAzMTE3NSwgeTowLjY1MzQ3NzIxODIyNTQxOTd9LHt4OjYuODQ4OTIwODYzMzA5MzUzLCB5OjAuNjQ4NjgxMDU1MTU1ODc1M30se3g6Ni44NjMzMDkzNTI1MTc5ODYsIHk6MC42MzA2OTU0NDM2NDUwODM5fSx7eDo2Ljg2NjkwNjQ3NDgyMDE0NCwgeTowLjU5ODMyMTM0MjkyNTY1OTV9KVxuKVxubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuNjMxNDU3NjI3MTE4NjQ0MSwgeTozLjA0NzcyMDMzODk4MzA1MX0se3g6MC42NjQ1MDg0NzQ1NzYyNzEyLCB5OjMuMDUxMTEwMTY5NDkxNTI1N30se3g6MC42ODU2OTQ5MTUyNTQyMzczLCB5OjMuMDQyNjM1NTkzMjIwMzM5M30se3g6MC42ODgyMzcyODgxMzU1OTMzLCB5OjMuMDE1NTE2OTQ5MTUyNTQyNn0se3g6MC42Njc4OTgzMDUwODQ3NDU4LCB5OjIuOTkwMDkzMjIwMzM4OTgzNH0se3g6MC42NzEyODgxMzU1OTMyMjAzLCB5OjIuOTY4OTA2Nzc5NjYxMDE3fSx7eDowLjY4MTQ1NzYyNzExODY0NDEsIHk6Mi45NTAyNjI3MTE4NjQ0MDd9LHt4OjAuNjY3MDUwODQ3NDU3NjI3MSwgeToyLjkzNDE2MTAxNjk0OTE1Mjh9LHt4OjAuNjM4MjM3Mjg4MTM1NTkzMiwgeToyLjkzNjcwMzM4OTgzMDUwOX0se3g6MC42MzkwODQ3NDU3NjI3MTE5LCB5OjIuOTUwMjYyNzExODY0NDA3fSx7eDowLjYxMDI3MTE4NjQ0MDY3NzksIHk6Mi45NjIxMjcxMTg2NDQwNjh9LHt4OjAuNjA3NzI4ODEzNTU5MzIyMSwgeToyLjk4NTg1NTkzMjIwMzM5fSx7eDowLjYyOTc2MjcxMTg2NDQwNjgsIHk6My4wMDE5NTc2MjcxMTg2NDR9LHt4OjAuNjE1MzU1OTMyMjAzMzg5OCwgeTozLjAzMDc3MTE4NjQ0MDY3OH0se3g6MC42MjU1MjU0MjM3Mjg4MTM2LCB5OjMuMDU0NX0pLFxuICBuZXcgQXJyYXkoe3g6MC42NTI2NDQwNjc3OTY2MTAxLCB5OjIuOTI5MDc2MjcxMTg2NDQwNn0se3g6MC42Njk1OTMyMjAzMzg5ODMsIHk6Mi45Mzc1NTA4NDc0NTc2Mjd9LHt4OjAuNjczODMwNTA4NDc0NTc2MywgeToyLjk2NzIxMTg2NDQwNjc3OTh9LHt4OjAuNjU4NTc2MjcxMTg2NDQwNywgeToyLjk3NjUzMzg5ODMwNTA4NX0se3g6MC42Mjg5MTUyNTQyMzcyODgxLCB5OjIuOTkzNDgzMDUwODQ3NDU3N30se3g6MC42MTI4MTM1NTkzMjIwMzM5LCB5OjMuMDA4NzM3Mjg4MTM1NTkzNn0se3g6MC42MTAyNzExODY0NDA2Nzc5LCB5OjMuMDM2NzAzMzg5ODMwNTA4NX0se3g6MC42MjYzNzI4ODEzNTU5MzIyLCB5OjMuMDUwMjYyNzExODY0NDA3fSx7eDowLjY1MzQ5MTUyNTQyMzcyODgsIHk6My4wNTM2NTI1NDIzNzI4ODEzfSx7eDowLjY2OTU5MzIyMDMzODk4MywgeTozLjA0MTc4ODEzNTU5MzIyMDZ9LHt4OjAuNjc1NTI1NDIzNzI4ODEzNSwgeTozLjAyNDgzODk4MzA1MDg0Nzh9LHt4OjAuNjUzNDkxNTI1NDIzNzI4OCwgeTozLjAwNjE5NDkxNTI1NDIzNzV9LHt4OjAuNjIyOTgzMDUwODQ3NDU3NiwgeToyLjk4NjcwMzM4OTgzMDUwODZ9LHt4OjAuNjE2MjAzMzg5ODMwNTA4NSwgeToyLjk1ODczNzI4ODEzNTU5MzN9LHt4OjAuNjUzNDkxNTI1NDIzNzI4OCwgeToyLjk0MzQ4MzA1MDg0NzQ1OH0se3g6MC42NTQzMzg5ODMwNTA4NDc1LCB5OjIuOTM2NzAzMzg5ODMwNTA5fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIxUyA9IG5ldyBBcnJheShcbiAgLy9uZXcgQXJyYXkoe3g6Ni44NjE3MTc2MTI4MDkzMTYsIHk6MC42NjgxMjIyNzA3NDIzNTgxfSx7eDo2Ljg0NzE2MTU3MjA1MjQwMiwgeTowLjY1NjQ3NzQzODEzNjgyNjh9LHt4OjYuODUxNTI4Mzg0Mjc5NDc2LCB5OjAuNjMzMTg3NzcyOTI1NzY0Mn0se3g6Ni44NzE5MDY4NDEzMzkxNTYsIHk6MC42MzAyNzY1NjQ3NzQzODEzfSx7eDo2Ljg3MTkwNjg0MTMzOTE1NiwgeTowLjU5OTcwODg3OTE4NDg2MTd9LHt4OjYuODQxMzM5MTU1NzQ5NjM2LCB5OjAuNTk5NzA4ODc5MTg0ODYxN30se3g6Ni44NDEzMzkxNTU3NDk2MzYsIHk6MC42MjczNjUzNTY2MjI5OTg1fSx7eDo2Ljg3MzM2MjQ0NTQxNDg0NywgeTowLjY0MTkyMTM5NzM3OTkxMjd9LHt4OjYuODY3NTQwMDI5MTEyMDgyLCB5OjAuNjcyNDg5MDgyOTY5NDMyM30pXG4gIG5ldyBBcnJheSh7eDo2Ljg2OTM1Mjg2OTM1Mjg2OSwgeTowLjU5NzA2OTU5NzA2OTU5NzF9LHt4OjYuODg2NDQ2ODg2NDQ2ODg3LCB5OjAuNTgyNDE3NTgyNDE3NTgyNX0se3g6Ni44OTc0MzU4OTc0MzU4OTgsIHk6MC41NjY1NDQ1NjY1NDQ1NjY1fSx7eDo2LjkxMjA4NzkxMjA4NzkxMiwgeTowLjUyOTkxNDUyOTkxNDUyOTl9LHt4OjYuOTEzMzA4OTEzMzA4OTE0LCB5OjAuNTA2NzE1NTA2NzE1NTA2N30se3g6Ni45MTMzMDg5MTMzMDg5MTQsIHk6MC40ODQ3Mzc0ODQ3Mzc0ODQ3NH0se3g6Ni45MDQ3NjE5MDQ3NjE5MDUsIHk6MC40Njg4NjQ0Njg4NjQ0Njg4Nn0se3g6Ni44ODc2Njc4ODc2Njc4ODgsIHk6MC40NTc4NzU0NTc4NzU0NTc4Nn0se3g6Ni44NjMyNDc4NjMyNDc4NjMsIHk6MC40NTc4NzU0NTc4NzU0NTc4Nn0se3g6Ni44NDczNzQ4NDczNzQ4NDcsIHk6MC40NjI3NTk0NjI3NTk0NjI4fSx7eDo2LjgyNzgzODgyNzgzODgyOCwgeTowLjQ3OTg1MzQ3OTg1MzQ3OTg3fSx7eDo2LjgyNzgzODgyNzgzODgyOCwgeTowLjQ5OTM4OTQ5OTM4OTQ5OTR9LHt4OjYuODU5NTg0ODU5NTg0ODU5LCB5OjAuNTEyODIwNTEyODIwNTEyOH0se3g6Ni44NzkxMjA4NzkxMjA4Nzk2LCB5OjAuNTI1MDMwNTI1MDMwNTI1fSx7eDo2Ljg2OTM1Mjg2OTM1Mjg2OSwgeTowLjUzOTY4MjUzOTY4MjUzOTd9LHt4OjYuODM2Mzg1ODM2Mzg1ODM2LCB5OjAuNTQ1Nzg3NTQ1Nzg3NTQ1N30se3g6Ni44MjQxNzU4MjQxNzU4MjQsIHk6MC41NjY1NDQ1NjY1NDQ1NjY1fSx7eDo2LjgyNDE3NTgyNDE3NTgyNCwgeTowLjU4NDg1OTU4NDg1OTU4NDl9LHt4OjYuODQxMjY5ODQxMjY5ODQxLCB5OjAuNTg5NzQzNTg5NzQzNTg5OH0se3g6Ni44NjMyNDc4NjMyNDc4NjMsIHk6MC41Njc3NjU1Njc3NjU1Njc3fSx7eDo2Ljg0OTgxNjg0OTgxNjg0OTUsIHk6MC41NDIxMjQ1NDIxMjQ1NDIxfSx7eDo2Ljg0OTgxNjg0OTgxNjg0OTUsIHk6MC41MjM4MDk1MjM4MDk1MjM4fSx7eDo2Ljg2NjkxMDg2NjkxMDg2NjUsIHk6MC41MTE1OTk1MTE1OTk1MTE2fSx7eDo2Ljg4Mjc4Mzg4Mjc4Mzg4MywgeTowLjUxNjQ4MzUxNjQ4MzUxNjV9LHt4OjYuODkzNzcyODkzNzcyODk0LCB5OjAuNTM5NjgyNTM5NjgyNTM5N30se3g6Ni44OTEzMzA4OTEzMzA4OTIsIHk6MC41NTc5OTc1NTc5OTc1NTh9LHt4OjYuODcxNzk0ODcxNzk0ODcxLCB5OjAuNTY3NzY1NTY3NzY1NTY3N30se3g6Ni44ODAzNDE4ODAzNDE4ODEsIHk6MC42MDMxNzQ2MDMxNzQ2MDMxfSx7eDo2LjkwOTY0NTkwOTY0NTkxLCB5OjAuNjAxOTUzNjAxOTUzNjAxOX0se3g6Ni45MDk2NDU5MDk2NDU5MSwgeTowLjU4MzYzODU4MzYzODU4Mzd9LHt4OjYuOTAxMDk4OTAxMDk4OTAxNSwgeTowLjU3MjY0OTU3MjY0OTU3MjZ9LHt4OjYuODc3ODk5ODc3ODk5ODc4LCB5OjAuNTc3NTMzNTc3NTMzNTc3NX0pXG4pO1xudmFyIHByZWduYW50U2VsZWN0ZWQgPSBmYWxzZTtcbnZhciBub25QcmVnbmFudFNlbGVjdGVkID0gZmFsc2U7XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQW5pbWF0aW9uc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG52YXIgY2FudmFzLCBjYW52YXMyLCBjYW52YXMzLCBjYW52YXM0LCBjYW52YXM1LCBjb250ZXh0LCBjb250ZXh0MiwgY29udGV4dDMsIGNvbnRleHQ0LCBjb250ZXh0NTtcbnZhciBtb3NxdWl0b3NBcnJheSA9IG5ldyBBcnJheSgpXG52YXIgdG90YWxNb3NxdWl0b3MgPSAxMDA7XG52YXIgc3RvcE1haW4gPSBmYWxzZTtcbnZhciBjdXJyZW50TW9zcXVpdG9QaGFzZSA9IDA7XG52YXIgY3VycmVudFBoYXNlID0gMDtcbnZhciBtb3NxdWl0b3NMZWZ0ID0gdG90YWxNb3NxdWl0b3M7XG52YXIgcHJlZ25hbnRNb3NxdWl0b3MgPSAwO1xudmFyIGxlZnRDb3ZlckdsYXNzLCByaWdodENvdmVyR2xhc3MsIGxlZnRDb3ZlckdsYXNzSG92ZXIsIHJpZ2h0Q292ZXJHbGFzc0hvdmVyO1xudmFyIGhvdmVyQmVoYXZpb3JJbWFnZXNEZXNrdG9wID0gbmV3IEFycmF5KFwiaWNvbjFfaG92ZXIucG5nXCIsXCJpY29uMl9ob3Zlci5wbmdcIixcImljb24zX2hvdmVyLnBuZ1wiLFwiaWNvbjRfaG92ZXIucG5nXCIsXCJpY29uNV9ob3Zlci5wbmdcIixcImljb242X2hvdmVyLnBuZ1wiLFwiaWNvbjdfaG92ZXIucG5nXCIsXCJpY29uOF9ob3Zlci5wbmdcIixcImljb245X2hvdmVyLnBuZ1wiKTtcbnZhciBiZWhhdmlvckltYWdlc0Rlc2t0b3AgPSBuZXcgQXJyYXkoXCJpY29uMS5wbmdcIixcImljb24yLnBuZ1wiLFwiaWNvbjMucG5nXCIsXCJpY29uNC5wbmdcIixcImljb241LnBuZ1wiLFwiaWNvbjYucG5nXCIsXCJpY29uNy5wbmdcIixcImljb244LnBuZ1wiLFwiaWNvbjkucG5nXCIpO1xudmFyIGhvdmVyQmVoYXZpb3JJbWFnZXNNb2JpbGUgPSBuZXcgQXJyYXkoXCJpY29uMW1vYmlsZV9ob3Zlci5wbmdcIixcImljb24ybW9iaWxlX2hvdmVyLnBuZ1wiLFwiaWNvbjNtb2JpbGVfaG92ZXIucG5nXCIsXCJpY29uNG1vYmlsZV9ob3Zlci5wbmdcIixcImljb241bW9iaWxlX2hvdmVyLnBuZ1wiLFwiaWNvbjZtb2JpbGVfaG92ZXIucG5nXCIsXCJpY29uN21vYmlsZV9ob3Zlci5wbmdcIixcImljb244bW9iaWxlX2hvdmVyLnBuZ1wiLFwiaWNvbjltb2JpbGVfaG92ZXIucG5nXCIpO1xudmFyIGJlaGF2aW9ySW1hZ2VzTW9iaWxlID0gbmV3IEFycmF5KFwiaWNvbjFtb2JpbGUucG5nXCIsXCJpY29uMm1vYmlsZS5wbmdcIixcImljb24zbW9iaWxlLnBuZ1wiLFwiaWNvbjRtb2JpbGUucG5nXCIsXCJpY29uNW1vYmlsZS5wbmdcIixcImljb242bW9iaWxlLnBuZ1wiLFwiaWNvbjdtb2JpbGUucG5nXCIsXCJpY29uOG1vYmlsZS5wbmdcIixcImljb245bW9iaWxlLnBuZ1wiKTtcbnZhciBob3ZlckJlaGF2aW9ySW1hZ2VzID0gaG92ZXJCZWhhdmlvckltYWdlc0Rlc2t0b3A7XG52YXIgYmVoYXZpb3JJbWFnZXMgPSBiZWhhdmlvckltYWdlc0Rlc2t0b3A7XG52YXIgdGFibGV0VHJlc2hvbGQgPSAzNTQ7Ly85NTc7XG52YXIgbW9iaWxlVHJlc2hvbGQgPSA2MDA7XG52YXIgY2VsbCA9IDA7XG5cbmlmKChtb2JpbGVfYnJvd3NlciA9PSAxKSYmKGlwYWRfYnJvd3NlciA9PSAwKSlcbntcbiAgaWYod2luZG93LmlubmVySGVpZ2h0ID4gd2luZG93LmlubmVyV2lkdGgpe1xuICAgIGhvdmVyQmVoYXZpb3JJbWFnZXMgPSBob3ZlckJlaGF2aW9ySW1hZ2VzTW9iaWxlO1xuICAgIGJlaGF2aW9ySW1hZ2VzID0gYmVoYXZpb3JJbWFnZXNNb2JpbGU7XG4gIH1lbHNle1xuICAgIHRhYmxldFRyZXNob2xkID0gMzAwMDtcbiAgICBob3ZlckJlaGF2aW9ySW1hZ2VzID0gaG92ZXJCZWhhdmlvckltYWdlc0Rlc2t0b3A7XG4gICAgYmVoYXZpb3JJbWFnZXMgPSBiZWhhdmlvckltYWdlc0Rlc2t0b3A7XG4gIH1cbn1cblxuY2hhbmdlSWNvbnMoKTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJvcmllbnRhdGlvbmNoYW5nZVwiLCBmdW5jdGlvbigpIHtcbiAgLy8gQW5ub3VuY2UgdGhlIG5ldyBvcmllbnRhdGlvbiBudW1iZXJcbiAgaWYod2luZG93Lm9yaWVudGF0aW9uPT0wKVxuICB7XG4gICAgdGFibGV0VHJlc2hvbGQgPSAzNTQ7XG4gICAgaG92ZXJCZWhhdmlvckltYWdlcyA9IGhvdmVyQmVoYXZpb3JJbWFnZXNNb2JpbGU7XG4gICAgYmVoYXZpb3JJbWFnZXMgPSBiZWhhdmlvckltYWdlc01vYmlsZTtcbiAgfWVsc2V7XG4gICAgdGFibGV0VHJlc2hvbGQgPSAzMDAwO1xuICAgIGhvdmVyQmVoYXZpb3JJbWFnZXMgPSBob3ZlckJlaGF2aW9ySW1hZ2VzRGVza3RvcDtcbiAgICBiZWhhdmlvckltYWdlcyA9IGJlaGF2aW9ySW1hZ2VzRGVza3RvcDtcbiAgfVxuXG4gIGNoYW5nZUljb25zKCk7XG59LCBmYWxzZSk7XG5cbmZ1bmN0aW9uIGNoYW5nZUljb25zKClcbntcbiAgZm9yKGk9MDtpPGJlaGF2aW9ySW1hZ2VzLmxlbmd0aDtpKyspXG4gIHtcbiAgICAgICQoJyNpY29uJytpKS5hdHRyKFwic3JjXCIsIFwiLi9pbWFnZXMvXCIgKyBiZWhhdmlvckltYWdlc1tpXSk7XG4gIH1cbn1cbi8qKlxuICBUaGUgY2FudmFzSW1hZ2UgY2xhc3MgcmVwcmVzZW50cyBhbiBlbGVtZW50IGRyYXduIG9uIHRoZSBjYW52YXMuXG4gXG4gIEBjbGFzcyBDYW52YXNJbWFnZVxuICBAY29uc3RydWN0b3JcbiovXG5mdW5jdGlvbiBDYW52YXNJbWFnZShpbWcsIHgsIHksIGFuZ2xlLCBzcGVlZCwgdHlwZSwgY3VycmVudEltYWdlLCBwb3NpdGlvbnNBcnJheSkge1xuICB0aGlzLmltYWdlID0gaW1nO1xuICB0aGlzLnggPSB4O1xuICB0aGlzLnkgPSB5O1xuICB0aGlzLnhBbW91bnQgPSAwO1xuICB0aGlzLnlBbW91bnQgPSAwO1xuICB0aGlzLndpZHRoID0gaW1nLndpZHRoO1xuICB0aGlzLmhlaWdodCA9IGltZy5oZWlnaHQ7XG4gIHRoaXMucG9zaXRpb24gPSAxO1xuICB0aGlzLmFuZ2xlID0gYW5nbGU7XG4gIHRoaXMuc3BlZWQgPSBzcGVlZDtcbiAgdGhpcy50eXBlID0gdHlwZTtcbiAgdGhpcy5jdXJyZW50SW1hZ2UgPSBjdXJyZW50SW1hZ2U7XG4gIHRoaXMuZmlyc3RUaW1lID0gZmFsc2U7XG4gIHRoaXMuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgdGhpcy5wb3NpdGlvbnNBcnJheSA9IHBvc2l0aW9uc0FycmF5O1xuICB0aGlzLmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMDtcbiAgdGhpcy5mbGlwcGVkSW1hZ2VzID0gbmV3IEFycmF5KCk7XG4gIHJldHVybiB0aGlzO1xufVxuLy9TZXR1cCByZXF1ZXN0IGFuaW1hdGlvbiBmcmFtZVxudmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgaWYgKCFzdG9wTWFpbikge1xuICAgIG1haW4odGltZSk7XG4gIH1cbiAgXG4gIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcbn1cbnZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVJbml0aWFsaXphdGlvbiA9IGZ1bmN0aW9uKCl7XG4gIHZhciBsYXN0VGltZSA9IDA7XG4gIHZhciB2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXTtcbiAgZm9yKHZhciB4ID0gMDsgeCA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK3gpIHtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICB9XG4gXG4gIGlmICghd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaywgZWxlbWVudCkge1xuICAgICAgICB2YXIgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSk7XG4gICAgICAgIHZhciBpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpOyB9LFxuICAgICAgICAgIHRpbWVUb0NhbGwpO1xuICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH07XG4gIH1cbiBcbiAgaWYgKCF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICB9O1xuICB9XG59XG4vL1NldHVwIG1haW4gbG9vcFxudmFyIHNldHVwTWFpbkxvb3AgPSBmdW5jdGlvbigpe1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWVJbml0aWFsaXphdGlvbigpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25GcmFtZSk7XG4gICAgICBjdXJyZW50UGhhc2UgPSAxO1xuXG4gICAgICAkKCcjcGdTdGVwMSAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgIH0sIDE1MDApO1xufVxuLy9FeGVjdXRlIG1haW4gbG9vcFxudmFyIG1haW4gPSBmdW5jdGlvbih0aW1lKXtcbiAgLy8gY2xlYXIgdGhlIGNhbnZhc1xuICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0LmNhbnZhcy53aWR0aCwgY29udGV4dC5jYW52YXMuaGVpZ2h0KTtcblxuICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgIHN3aXRjaCAoZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSkge1xuICAgICAgY2FzZSAwOlxuICAgICAgY2FzZSAyOlxuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA2OlxuICAgICAgY2FzZSA4OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTI6XG4gICAgICBjYXNlIDE0OlxuICAgICAgY2FzZSAxNjpcbiAgICAgIGNhc2UgMTg6XG4gICAgICBjYXNlIDIwOlxuICAgICAgY2FzZSAyMTpcbiAgICAgIGNhc2UgMjI6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgZWxlbWVudC5jdXJyZW50SW1hZ2UgPSBlbGVtZW50LmN1cnJlbnRJbWFnZSArIDE7XG4gICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRJbWFnZSA+PSBlbGVtZW50LmltYWdlLmxlbmd0aCkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudEltYWdlID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIHZhciB3TXVsdGlwbGllciA9IDEuMDtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIHdNdWx0aXBsaWVyID0gMC4xMjU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9PSAyMikge1xuXG4gICAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiAoIDE2LjAvMTIuMCkgKiB3TXVsdGlwbGllcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogKCAxNi4wLzEyLjApICogd011bHRpcGxpZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqICggMTYuMC8xMi4wKSAqIHdNdWx0aXBsaWVyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiAoIDE2LjAvMTIuMCkgKiB3TXVsdGlwbGllcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTNTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlM1MubGVuZ3RoXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UzLmxlbmd0aF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IE1hdGgubWF4KDAuMDg2LE1hdGgubWluKDAuMTM1LCBhdXhFbGVtZW50LngpKSArIDAuMDE7XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gTWF0aC5tYXgoMC41NTUsTWF0aC5taW4oMC43MTUsIGF1eEVsZW1lbnQueSkpICsgMC4wNDtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjdXJyZW50UGhhc2UgPSAyO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT0gbW9zcXVpdG9zTGVmdCAtIDEpIHtcbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMSAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxIHNlbGVjdCcpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAyO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB2YXIgd011bHRpcGxpZXIgPSAxLjA7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB3TXVsdGlwbGllciA9IDAuMTI1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB3ID0gdyAqIDAuMTI1O1xuXG4gICAgICAgIHZhciB3TXVsdGlwbGllciA9IDEuMDtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIHdNdWx0aXBsaWVyID0gMC4xMjU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiAoIDE2LjAvMTIuMCkgKiB3TXVsdGlwbGllcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogKCAxNi4wLzEyLjApICogd011bHRpcGxpZXIpO1xuICAgICAgICB9Ki9cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTVbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U1Lmxlbmd0aF07XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTVTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNVMubGVuZ3RoXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGVsZW1lbnQyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKX07XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC4wNzYsTWF0aC5taW4oMC4xNSwgYXV4RWxlbWVudC54KSkgKyAwLjAxO1xuICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IE1hdGgubWF4KDAuODEsTWF0aC5taW4oMC44NiwgYXV4RWxlbWVudC55KSkgKyAwLjA1O1xuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC4xNCB8fCBhdXhFbGVtZW50LnggPD0gMC4wODcpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMC44Mikge1xuICAgICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBhdXhFbGVtZW50LnkgKyAwLjA0O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYXV4RWxlbWVudC55ID49IDAuODMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gYXV4RWxlbWVudC55IC0gMC4wMjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICAvL2VsZW1lbnQueCA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLng7XG4gICAgICAgICAgICAvL2VsZW1lbnQueSA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA0O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB2YXIgd011bHRpcGxpZXIgPSAxLjA7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB3TXVsdGlwbGllciA9IDAuMTI1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDU6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY3VycmVudFBoYXNlID0gMztcblxuICAgICAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwMiAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAyXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3U1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTdTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54ID49IDAuNDIgfHwgYXV4RWxlbWVudC54IDw9IDAuMzkpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDEuMjA2NjEwMTY5NDkxNTI2KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjIwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhdXhFbGVtZW50LnkgPj0gMS4yOCkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4yODtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjQ5KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSAwLjQ5XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPD0gMC4zNikge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC4zNlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55ID49IDEuMykge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4zXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS4xOSkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4xOVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICAvL2VsZW1lbnQueCA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLng7XG4gICAgICAgICAgICAvL2VsZW1lbnQueSA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA2O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB2YXIgd011bHRpcGxpZXIgPSAxLjA7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB3TXVsdGlwbGllciA9IDAuMTI1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDc6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTkubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwMiAucGctYnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDJcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMiAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuXG4gICAgICAgICAgICAgICQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKS5yZW1vdmVDbGFzcyhcImRpc2FibGVkLW9wdGlvblwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5U1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5U1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKX07XG4gICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjg4NSB8fCBhdXhFbGVtZW50LnggPD0gMC44MDYpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS40ODcpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS40ODc7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBlbHNlIGlmIChhdXhFbGVtZW50LnkgPj0gMS41NTgpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS41NTg7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC44OTgpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC44OTg7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54IDw9IDAuNzkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC43OTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPj0gMS41Nykge1xuICAgICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjU3O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA8PSAxLjQ3KSB7XG4gICAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IDEuNDc7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSBhdXhFbGVtZW50LnggKyAwLjA1NztcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IGF1eEVsZW1lbnQueSArIDAuMTE1O1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgLy9lbGVtZW50LnggPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54O1xuICAgICAgICAgICAgLy9lbGVtZW50LnkgPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55O1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gODtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcbiAgICAgICAgdmFyIHdNdWx0aXBsaWVyID0gMS4wO1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgd011bHRpcGxpZXIgPSAwLjEyNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA5OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICAvL2VsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTEubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwMyAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAzXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExLmxlbmd0aF07XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExU1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExUy5sZW5ndGhdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApIC0gMC4wMTgsIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTA7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG4gICAgICAgIHZhciB3TXVsdGlwbGllciA9IDEuMDtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIHdNdWx0aXBsaWVyID0gMC4xMjU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTE6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT0gbW9zcXVpdG9zTGVmdCAtIDEpIHtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAzIC5wZy1idXR0b25cIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwM1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICAgICAgICAgICAkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIikucmVtb3ZlQ2xhc3MoXCJkaXNhYmxlZC1vcHRpb25cIik7XG4gICAgICAgICAgICAgIC8vJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMyAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEzW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTMubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpICogMS4wKSArIDAuMDA1LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSAtIDAuMDEgKyAwLjI3NX07XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxMjtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcbiAgICAgICAgdmFyIHdNdWx0aXBsaWVyID0gMS4wO1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgd011bHRpcGxpZXIgPSAwLjEyNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxMzpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE1W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTUubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTVTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTVTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpICogMS4wKSArIDAuMDA1LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSAtIDAuMDEgKyAwLjI3NX07XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxNDtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcbiAgICAgICAgdmFyIHdNdWx0aXBsaWVyID0gMS4wO1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgd011bHRpcGxpZXIgPSAwLjEyNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNTpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE3W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTcubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTdTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTdTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpICogMS4wKSArIDAuMDA1LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSArIDAuMjc1fTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE2O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB2YXIgd011bHRpcGxpZXIgPSAxLjA7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB3TXVsdGlwbGllciA9IDAuMTI1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE3OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTlbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOVNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOVMubGVuZ3RoXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgLy9lbGVtZW50Mi55ID0gZWxlbWVudDIueSAtIDAuMDA1O1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApICsgMC4zN307XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxODtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcbiAgICAgICAgdmFyIHdNdWx0aXBsaWVyID0gMS4wO1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgd011bHRpcGxpZXIgPSAwLjEyNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgZWxlbWVudC55ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxOTpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIxW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjEubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIC8vZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgLSAwLjAwNTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSArIDAuMzd9O1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjA7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG4gICAgICAgIHZhciB3TXVsdGlwbGllciA9IDEuMDtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIHdNdWx0aXBsaWVyID0gMC4xMjU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjE6XG4gICAgICAgIGFsZXJ0KFwic3NcIik7XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vIFRPIERPXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdKVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKHt4OiBlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLnggKyAoKE1hdGgucmFuZG9tKCkgKiAwLjA2NikgLSAwLjAzMyksIHk6IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0ueSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDY2KSAtIDAuMDMzKX0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vZWxlbWVudC54ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICAgICAgICAgIC8vZWxlbWVudC55ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHttb3NcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDIyO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAwMTtcblxuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuICAgICAgICB2YXIgd011bHRpcGxpZXIgPSAxLjA7XG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB3TXVsdGlwbGllciA9IDAuMTI1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIChlbGVtZW50LnggKiBjYW52YXMud2lkdGgpICogd011bHRpcGxpZXIsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIsIHcgKiB3TXVsdGlwbGllciAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCAqIHdNdWx0aXBsaWVyLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGggKiB3TXVsdGlwbGllciwgdyAqIHdNdWx0aXBsaWVyLCB3ICogd011bHRpcGxpZXIgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gIH0pO1xufVxuLy9BbmltYXRlIGJlaGF2aW9yIGVsZW1lbnRzXG52YXIgYW5pbWF0ZUJlaGF2aW9yRWxlbWVudHMgPSBmdW5jdGlvbigpIHtcbiAgJChkb2N1bWVudCkub24oXCJtb3VzZWVudGVyXCIsIFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbjpub3QoLmRpc2FibGVkLW9wdGlvbilcIiwgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEkKHRoaXMpLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgICQodGhpcykuZmluZChcImltZ1wiKS5hdHRyKFwic3JjXCIsIFwiLi9pbWFnZXMvXCIgKyBob3ZlckJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gIH0pO1xuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlbGVhdmVcIiwgXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKVwiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoISQodGhpcykuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkge1xuICAgICAgJCh0aGlzKS5maW5kKFwiaW1nXCIpLmF0dHIoXCJzcmNcIiwgXCIuL2ltYWdlcy9cIiArIGJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gIH0pO1xufTtcbi8vQW5pbWF0ZSBwcmVnbmFuY3kgZWxlbWVudHNcbnZhciBhbmltYXRlRWxlbWVudHNQcmVnbmFuY3kgPSBmdW5jdGlvbigpIHtcbiAgJChkb2N1bWVudCkub24oXCJtb3VzZWVudGVyXCIsIFwiLnBnU3RlcF9fcHJlZ25hbmN5LW9rXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJChcIiNsZWZ0LWdsYXNzLWNvdmVyLWhvcml6b250YWwsICNsZWZ0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNsZWZ0LWdsYXNzLWNvdmVyLWhvcml6b250YWxcIikud2lkdGgoKSAqIDAuMDAxKSArIFwicHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoXCIjbGVmdC1nbGFzcy1jb3ZlciwgI2xlZnQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNsZWZ0LWdsYXNzLWNvdmVyXCIpLmhlaWdodCgpICogMC4wMDEpICsgXCJweFwiXG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgJChkb2N1bWVudCkub24oXCJtb3VzZWxlYXZlXCIsIFwiLnBnU3RlcF9fcHJlZ25hbmN5LW9rXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJChcIiNsZWZ0LWdsYXNzLWNvdmVyLWhvcml6b250YWwsICNsZWZ0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIwcHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoXCIjbGVmdC1nbGFzcy1jb3ZlciwgI2xlZnQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIwcHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VlbnRlclwiLCBcIi5wZ1N0ZXBfX3ByZWduYW5jeS1rb1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXItaG9yaXpvbnRhbCwgI3JpZ2h0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNyaWdodC1nbGFzcy1jb3Zlci1ob3Jpem9udGFsXCIpLndpZHRoKCkgKiAwLjAwMSkgKyBcInB4XCJcbiAgICAgICAgfSwgMjAwKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAkKFwiI3JpZ2h0LWdsYXNzLWNvdmVyLCAjcmlnaHQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNyaWdodC1nbGFzcy1jb3ZlclwiKS5oZWlnaHQoKSAqIDAuMDAxKSArIFwicHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgIFxuICAgIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VsZWF2ZVwiLCBcIi5wZ1N0ZXBfX3ByZWduYW5jeS1rb1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXItaG9yaXpvbnRhbCwgI3JpZ2h0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIwcHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXIsICNyaWdodC1nbGFzcy1jb3Zlci1taWRcIikuYW5pbWF0ZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIjBweFwiXG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cbi8vU2V0dXAgY2FudmFzXG52YXIgc2V0dXBDYW52YXMgPSBmdW5jdGlvbigpe1xuICBjYW52YXMyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VsZW1lbnRzQ2FudmFzJyk7XG4gIGNhbnZhczIud2lkdGggPSAkKCcucGdDaGFydC13cmFwcGVyJykud2lkdGgoKTtcbiAgY2FudmFzMi5oZWlnaHQgPSAkKCcucGdDaGFydC13cmFwcGVyJykuaGVpZ2h0KCkgKyAwO1xuICBjYW52YXMyLnN0eWxlLndpZHRoICA9IGNhbnZhczIud2lkdGgudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY2FudmFzMi5zdHlsZS5oZWlnaHQgPSBjYW52YXMyLmhlaWdodC50b1N0cmluZygpICsgXCJweFwiO1xuICBjb250ZXh0MiA9IGNhbnZhczIuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY29udGV4dDIuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5cbiAgY2FudmFzMyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhbmltYXRpb25DYW52YXMnKTtcbiAgY2FudmFzMy53aWR0aCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS53aWR0aCgpO1xuICBjYW52YXMzLmhlaWdodCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS5oZWlnaHQoKTtcbiAgY2FudmFzMy5zdHlsZS53aWR0aCAgPSBjYW52YXMzLndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczMuc3R5bGUuaGVpZ2h0ID0gY2FudmFzMy5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDMgPSBjYW52YXMzLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQzLmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb3NxdWl0b3NDYW52YXMnKTtcbiAgY2FudmFzLndpZHRoID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLndpZHRoKCk7XG4gIGNhbnZhcy5oZWlnaHQgPSAkKCcucGdDaGFydC13cmFwcGVyJykuaGVpZ2h0KCk7XG4gIGNhbnZhcy5zdHlsZS53aWR0aCAgPSBjYW52YXMud2lkdGgudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBjb250ZXh0LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNhbnZhczQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaG92ZXJDYW52YXMnKTtcbiAgY2FudmFzNC53aWR0aCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS53aWR0aCgpO1xuICBjYW52YXM0LmhlaWdodCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS5oZWlnaHQoKTtcbiAgY2FudmFzNC5zdHlsZS53aWR0aCAgPSBjYW52YXM0LndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczQuc3R5bGUuaGVpZ2h0ID0gY2FudmFzNC5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDQgPSBjYW52YXM0LmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQ0LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNhbnZhczUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2xhc3NBbmltYXRpb25DYW52YXMnKTtcbiAgY2FudmFzNS53aWR0aCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS53aWR0aCgpO1xuICBjYW52YXM1LmhlaWdodCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS5oZWlnaHQoKTtcbiAgY2FudmFzNS5zdHlsZS53aWR0aCAgPSBjYW52YXM1LndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczUuc3R5bGUuaGVpZ2h0ID0gY2FudmFzNS5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDUgPSBjYW52YXM1LmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQ1LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNvbnRleHQuY2FudmFzLndpZHRoLCBjb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICBjb250ZXh0Mi5jbGVhclJlY3QoMCwgMCwgY29udGV4dC5jYW52YXMud2lkdGgsIGNvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gIGNvbnRleHQzLmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0LmNhbnZhcy53aWR0aCwgY29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgY29udGV4dDQuY2xlYXJSZWN0KDAsIDAsIGNvbnRleHQuY2FudmFzLndpZHRoLCBjb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICBjb250ZXh0NS5jbGVhclJlY3QoMCwgMCwgY29udGV4dDUuY2FudmFzLndpZHRoLCBjb250ZXh0NS5jYW52YXMuaGVpZ2h0KTtcbiAgXG4gIGNvbnRleHQyLmZpbGxTdHlsZSA9IFwiI2Y4ZjhmOFwiO1xuICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgLypjb250ZXh0Mi5maWxsUmVjdCgkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxJykucG9zaXRpb24oKS5sZWZ0LCAwLCAkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpLCBjYW52YXMyLmhlaWdodCk7XG4gICAgY29udGV4dDIuZmlsbFJlY3QoJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLnBvc2l0aW9uKCkubGVmdCwgMCwgJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSwgY2FudmFzMi5oZWlnaHQpO1xuICAgIGNvbnRleHQyLmZpbGxSZWN0KCQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5wb3NpdGlvbigpLmxlZnQsIDAsICQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCksIGNhbnZhczIuaGVpZ2h0KTsqL1xuICB9XG4gIGVsc2Uge1xuICAgIGNvbnRleHQyLmZpbGxSZWN0KDAsIGdldE9mZnNldCgkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxJylbMF0pLnRvcCAtIGdldE9mZnNldCgkKFwiLnBnQXJ0aWNsZVwiKVswXSkudG9wIC0gJCgnI25hdi1iYXInKS5oZWlnaHQoKSwgY2FudmFzMi53aWR0aCwgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLmhlaWdodCgpKTtcbiAgICBjb250ZXh0Mi5maWxsUmVjdCgwLCBnZXRPZmZzZXQoJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpWzBdKS50b3AgLSBnZXRPZmZzZXQoJChcIi5wZ0FydGljbGVcIilbMF0pLnRvcCAtICQoJyNuYXYtYmFyJykuaGVpZ2h0KCksIGNhbnZhczIud2lkdGgsICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjInKS5oZWlnaHQoKSk7XG4gICAgY29udGV4dDIuZmlsbFJlY3QoMCwgZ2V0T2Zmc2V0KCQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKVswXSkudG9wIC0gZ2V0T2Zmc2V0KCQoXCIucGdBcnRpY2xlXCIpWzBdKS50b3AgLSAkKCcjbmF2LWJhcicpLmhlaWdodCgpLCBjYW52YXMyLndpZHRoLCAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykuaGVpZ2h0KCkpO1xuICB9XG5cbiAgdmFyIHBpY3R1cmUxID0gbmV3IEltYWdlKCk7XG4gIHBpY3R1cmUxLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgLy9jb250ZXh0Mi5kcmF3SW1hZ2UocGljdHVyZTEsIHBhcnNlSW50KCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgLSAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAqIDAuNTUpIC0gKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjA2NCkpLCAwLCBwYXJzZUludCgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC41NSksIHBhcnNlSW50KCgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC41NSkgKiAoNTM2LjAvNjU2LjApKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHBpY3R1cmUxLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC41NSkgLSAoY2FudmFzLndpZHRoICogMC4wNjQpKSwgMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC41NSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjU1KSAqICg1MzYuMC82NTYuMCkpKTtcbiAgICB9XG4gICAgICB2YXIgcGljdHVyZTFIb3ZlciA9IG5ldyBJbWFnZSgpO1xuICAgICAgcGljdHVyZTFIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgLy9jb250ZXh0NC5kcmF3SW1hZ2UocGljdHVyZTFIb3ZlciwgcGFyc2VJbnQoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAtICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC41NSkgLSAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAqIDAuMDY0KSksIDAsIHBhcnNlSW50KCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjU1KSwgcGFyc2VJbnQoKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjU1KSAqICg1MzYuMC82NTYuMCkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0NC5kcmF3SW1hZ2UocGljdHVyZTFIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoIC0gKGNhbnZhcy53aWR0aCAqIDAuNTUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMDY0KSksIDAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuNTUpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC41NSkgKiAoNTM2LjAvNjU2LjApKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29udGV4dDQuZHJhd0ltYWdlKHBpY3R1cmUxSG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjU1KSAtIChjYW52YXMud2lkdGggKiAwLjA2NCkpLCAwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjU1KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNTUpICogKDUzNi4wLzY1Ni4wKSkpO1xuICAgICAgfSk7XG4gICAgICBwaWN0dXJlMUhvdmVyLnNyYyA9ICcuL2ltYWdlcy90ZXJyYXJpdW0taG92ZXIucG5nJztcblxuICAgICAgdmFyIHR1YmUxID0gbmV3IEltYWdlKCk7XG4gICAgICB0dWJlMS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgLy9jb250ZXh0Mi5kcmF3SW1hZ2UodHViZTEsIHBhcnNlSW50KCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgLSAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSAqIDAuNTUpIC0gKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjA1ODUpIC0gKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjM2MDUxKSksIHBhcnNlSW50KCgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpICogMC4zNjA1MSkgKiAoMzAwLjAvNDMwLjApKSAqIDAuNTUsIHBhcnNlSW50KCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjM2MDUxKSwgcGFyc2VJbnQoKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgKiAwLjM2MDUxKSAqICgzMDAuMC80MzAuMCkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTEsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjU1KSAtIChjYW52YXMud2lkdGggKiAwLjA1ODUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMzYwNTEpKSwgMjM1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjM2MDUxKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMzYwNTEpICogKDMwMC4wLzQzMC4wKSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHR1YmUxLnNyYyA9ICcuL2ltYWdlcy90dWJlMS5wbmcnO1xuICB9KTtcbiAgcGljdHVyZTEuc3JjID0gJy4vaW1hZ2VzL3RlcnJhcml1bS5wbmcnO1xuXG4gIHZhciB0dWJlMiA9IG5ldyBJbWFnZSgpO1xuICB0dWJlMi5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDM0NSksIDUzMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xNDY3MiksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjE0NjcyKSAqICg2MjIuMC8xNzUuMCkpKTtcbiAgICB9XG4gIH0pO1xuICB0dWJlMi5zcmMgPSAnLi9pbWFnZXMvdHViZTIucG5nJztcblxuICB2YXIgdHViZTMgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTMuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmUzLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjA1NDUpLCAxMTE1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjgwNzMpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC44MDczKSAqICg1MTcuMC85NjMuMCkpKTtcbiAgICB9XG4gICAgdmFyIHR1YmUzSG92ZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICB0dWJlM0hvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29udGV4dDQuZHJhd0ltYWdlKHR1YmUzSG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDU0NSksIDExMTUsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuODA3MyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjgwNzMpICogKDUxNy4wLzk2My4wKSkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHR1YmUzSG92ZXIuc3JjID0gJy4vaW1hZ2VzL3R1YmUzLWhvdmVyLnBuZyc7XG4gIH0pO1xuICB0dWJlMy5zcmMgPSAnLi9pbWFnZXMvdHViZTMucG5nJztcblxuICB2YXIgdHViZTUgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTUuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmU1LCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC44MDE1KSAtIChjYW52YXMud2lkdGggKiAwLjEzMykpLCAyMTIwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjgwMTUpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC44MDE1KSAqICg1MTAuMC85NTYuMCkpKTtcbiAgICB9XG5cbiAgICB2YXIgdHViZTVIb3ZlciA9IG5ldyBJbWFnZSgpO1xuICAgIHR1YmU1SG92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb250ZXh0NC5kcmF3SW1hZ2UodHViZTVIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoIC0gKGNhbnZhcy53aWR0aCAqIDAuODAxNSkgLSAoY2FudmFzLndpZHRoICogMC4xMzMpKSwgMjEyMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC44MDE1KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuODAxNSkgKiAoNTEwLjAvOTU2LjApKSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdHViZTVIb3Zlci5zcmMgPSAnLi9pbWFnZXMvdHViZTUtaG92ZXIucG5nJzsgIFxuXG4gICAgdmFyIHR1YmU0ID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTQsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjEzNTgpIC0gKGNhbnZhcy53aWR0aCAqIDAuMDgpKSAtIDMsIDE2MTgsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTM1OCksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjEzNTgpICogKDYwMC4wLzE2Mi4wKSkpO1xuICAgICAgfVxuICAgICAgdmFyIHR1YmU0SG92ZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIHR1YmU0SG92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZSh0dWJlNEhvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC4xMzU4KSAtIChjYW52YXMud2lkdGggKiAwLjA4KSkgLSAzLCAxNjE4LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjEzNTgpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC4xMzU4KSAqICg2MDAuMC8xNjIuMCkpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0dWJlNEhvdmVyLnNyYyA9ICcuL2ltYWdlcy90dWJlNC1ob3Zlci5wbmcnO1xuICAgIH0pO1xuICAgIHR1YmU0LnNyYyA9ICcuL2ltYWdlcy90dWJlNC5wbmcnO1xuXG4gIH0pO1xuICB0dWJlNS5zcmMgPSAnLi9pbWFnZXMvdHViZTUucG5nJzsgIFxuXG4gIHZhciB0dWJlNiA9IG5ldyBJbWFnZSgpO1xuICB0dWJlNi5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTYsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDI4KSwgMjYyMSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMzgzKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTM4MykgKiAoNTkyLjAvMTY1LjApKSk7XG4gICAgfVxuICAgIHZhciB0dWJlNkhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTZIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZSh0dWJlNkhvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjAyOCksIDI2MjEsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTM4MyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjEzODMpICogKDU5Mi4wLzE2NS4wKSkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHR1YmU2SG92ZXIuc3JjID0gJy4vaW1hZ2VzL3R1YmU2LWhvdmVyLnBuZyc7XG4gIH0pO1xuICB0dWJlNi5zcmMgPSAnLi9pbWFnZXMvdHViZTYucG5nJztcblxuICB2YXIgdHViZTcgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmU3LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjA2KSwgMzIwMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC42NzA3KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNjcwNykgKiAoNTUyLjAvODAwLjApKSk7XG4gICAgfVxuICAgIHZhciBjb3ZlckdsYXNzID0gbmV3IEltYWdlKCk7XG4gICAgY292ZXJHbGFzcy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29udGV4dDMuZHJhd0ltYWdlKGNvdmVyR2xhc3MsIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjI5MSksIDM0MTUsIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjEyNSksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMjUpICogKDIyNC4wLzE0OS4wKSkpO1xuICAgICAgY29udGV4dDMuZHJhd0ltYWdlKGNvdmVyR2xhc3MsIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjU5NzUpLCAzNDE1LCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMjUpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTI1KSAqICgyMjQuMC8xNDkuMCkpKTtcbiAgICAgIFxuICAgICAgbGVmdENvdmVyR2xhc3MgPSBuZXcgQ2FudmFzSW1hZ2UoW2NvdmVyR2xhc3NdLCAwLjI5MSwgKDM0MTUuMC9jYW52YXMzLndpZHRoKSwgMCwgMC4wMDA1LCAwLCAwLCBuZXcgQXJyYXkoe3g6MC4yOTEseTooMzQxNS4wL2NhbnZhczMud2lkdGgpfSkpO1xuICAgICAgcmlnaHRDb3ZlckdsYXNzID0gbmV3IENhbnZhc0ltYWdlKFtjb3ZlckdsYXNzXSwgMC41OTc1LCAoMzQxNS4wL2NhbnZhczMud2lkdGgpLCAwLCAwLjAwMDUsIDAsIDAsIG5ldyBBcnJheSh7eDowLjU5NzUseTooMzQxNS4wL2NhbnZhczMud2lkdGgpfSkpXG5cbiAgICAgIGlmIChsZWZ0Q292ZXJHbGFzcyA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5WzBdLngpIHtcbiAgICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MueSA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5WzBdLnkpIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzcyA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVswXS54KSB7XG4gICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzLnkgPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbMF0ueSkge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHR1YmU3SG92ZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIHR1YmU3SG92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29udGV4dDQuZHJhd0ltYWdlKHR1YmU3SG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDYpLCAzMjAwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjY3MDcpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC42NzA3KSAqICg1NTIuMC84MDAuMCkpKTtcbiAgICAgICAgXG4gICAgICAgIGNvdmVyR2xhc3NIb3ZlciA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBjb3ZlckdsYXNzSG92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvL2NvbnRleHQ1LmRyYXdJbWFnZShjb3ZlckdsYXNzSG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMjk4KSwgMzU5MywgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMTMpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC4xMTMpICogKDQyLjAvMTM1LjApKSk7XG4gICAgICAgICAgLy9jb250ZXh0NS5kcmF3SW1hZ2UoY292ZXJHbGFzc0hvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjYwNSksIDM1OTMsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTEzKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTEzKSAqICg0Mi4wLzEzNS4wKSkpO1xuICAgICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIgPSBuZXcgQ2FudmFzSW1hZ2UoW2NvdmVyR2xhc3NIb3Zlcl0sIDAuMjk4LCAoMzU5My4wL2NhbnZhczMud2lkdGgpLCAwLCAwLjAwMDUsIDAsIDAsIG5ldyBBcnJheSh7eDowLjI5OCx5OigzNTkzLjAvY2FudmFzMy53aWR0aCl9KSk7XG4gICAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIgPSBuZXcgQ2FudmFzSW1hZ2UoW2NvdmVyR2xhc3NIb3Zlcl0sIDAuNjA1LCAoMzU5My4wL2NhbnZhczMud2lkdGgpLCAwLCAwLjAwMDUsIDAsIDAsIG5ldyBBcnJheSh7eDowLjYwNSx5OigzNTkzLjAvY2FudmFzMy53aWR0aCl9KSlcbiAgICAgICAgfSk7XG4gICAgICAgIGNvdmVyR2xhc3NIb3Zlci5zcmMgPSAnLi9pbWFnZXMvY292ZXItZ2xhc3MtYW5pbWF0ZS5wbmcnO1xuXG4gICAgICB9KTtcbiAgICAgIHR1YmU3SG92ZXIuc3JjID0gJy4vaW1hZ2VzL3R1YmU3LWhvdmVyLnBuZyc7XG4gICAgfSk7XG4gICAgY292ZXJHbGFzcy5zcmMgPSAnLi9pbWFnZXMvY292ZXItZ2xhc3MucG5nJztcbiAgfSk7XG4gIHR1YmU3LnNyYyA9ICcuL2ltYWdlcy90dWJlNy5wbmcnO1xuXG4gIHZhciBjaGFydCA9IG5ldyBJbWFnZSgpO1xuICBjaGFydC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQyLmRyYXdJbWFnZShjaGFydCwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNSkgLSAoY2FudmFzLndpZHRoICogMC43NyAqIDAuNSkpLCAzNzU1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjc3KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNzcpICogKDMxNS4wLzkxMi4wKSkpO1xuICB9KTtcbiAgY2hhcnQuc3JjID0gJy4vaW1hZ2VzL2xhc3QtY2hhcnQucG5nJztcblxuICB2YXIgY2hhcnQyID0gbmV3IEltYWdlKCk7XG4gIGNoYXJ0Mi5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQyLmRyYXdJbWFnZShjaGFydDIsIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjUpIC0gKGNhbnZhcy53aWR0aCAqIDAuNzAyNiAqIDAuNSkpLCA0MDU1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjcwMjYpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC43MDI2KSAqICgxODguMC84MzguMCkpKTtcbiAgfSk7XG4gIGNoYXJ0Mi5zcmMgPSAnLi9pbWFnZXMvZ3JhcGhpYy5wbmcnO1xufVxuLy9EcmF3IGFuIGltYWdlIHJvdGF0ZWRcbnZhciBUT19SQURJQU5TID0gTWF0aC5QSS8xODA7IFxuZnVuY3Rpb24gZHJhd1JvdGF0ZWRJbWFnZShpbWFnZSwgeCwgeSwgYW5nbGUsIGF1eEN0eCkgeyBcbiBcbiAgLy8gc2F2ZSB0aGUgY3VycmVudCBjby1vcmRpbmF0ZSBzeXN0ZW0gXG4gIC8vIGJlZm9yZSB3ZSBzY3JldyB3aXRoIGl0XG4gIGF1eEN0eC5zYXZlKCk7IFxuIFxuICAvLyBtb3ZlIHRvIHRoZSBtaWRkbGUgb2Ygd2hlcmUgd2Ugd2FudCB0byBkcmF3IG91ciBpbWFnZVxuICBhdXhDdHgudHJhbnNsYXRlKHggKyAoaW1hZ2Uud2lkdGgvMiksIHkgKyAoaW1hZ2UuaGVpZ2h0LzIpKTtcbiBcbiAgLy8gcm90YXRlIGFyb3VuZCB0aGF0IHBvaW50LCBjb252ZXJ0aW5nIG91ciBcbiAgLy8gYW5nbGUgZnJvbSBkZWdyZWVzIHRvIHJhZGlhbnMgXG4gIGF1eEN0eC5yb3RhdGUoYW5nbGUpO1xuIFxuICAvLyBkcmF3IGl0IHVwIGFuZCB0byB0aGUgbGVmdCBieSBoYWxmIHRoZSB3aWR0aFxuICAvLyBhbmQgaGVpZ2h0IG9mIHRoZSBpbWFnZSBcbiAgYXV4Q3R4LmRyYXdJbWFnZShpbWFnZSwgLShpbWFnZS53aWR0aC8yKSwgLShpbWFnZS5oZWlnaHQvMikpO1xuIFxuICAvLyBhbmQgcmVzdG9yZSB0aGUgY28tb3JkcyB0byBob3cgdGhleSB3ZXJlIHdoZW4gd2UgYmVnYW5cbiAgYXV4Q3R4LnJlc3RvcmUoKTsgLy9cbn1cbi8vU2V0dXAgbW9zcXVpdG9zXG52YXIgc2V0dXBNb3NxdWl0b3MgPSBmdW5jdGlvbigpIHtcbiAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vc3F1aXRvc0NhbnZhcycpO1xuXG4gIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICBjYW52YXMud2lkdGggPSAkKCcuaG9yaXpvbnRhbC1iYWNrZ3JvdW5kIGltZycpLndpZHRoKCk7XG4gICAgY2FudmFzLmhlaWdodCA9ICQoJy5ob3Jpem9udGFsLWJhY2tncm91bmQgaW1nJykuaGVpZ2h0KCk7XG4gICAgY2FudmFzLnN0eWxlLndpZHRoICA9IGNhbnZhcy53aWR0aC50b1N0cmluZygpICsgXCJweFwiO1xuICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBjYW52YXMuaGVpZ2h0LnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIH1cbiAgZWxzZSB7XG4gICAgY2FudmFzLndpZHRoID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLndpZHRoKCk7XG4gICAgY2FudmFzLmhlaWdodCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS5oZWlnaHQoKTtcbiAgICBjYW52YXMuc3R5bGUud2lkdGggID0gY2FudmFzLndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgfVxuXG4gIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY29udGV4dC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcblxuICB2YXIgbW9zcXVpdG8gPSBuZXcgSW1hZ2UoKTtcbiAgbW9zcXVpdG8uYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAvL1xuICB9KTtcbiAgbW9zcXVpdG8uc3JjID0gJy4vaW1hZ2VzL21vc3F1aXRvMV9sZWZ0LnBuZyc7XG4gIHZhciBtb3NxdWl0bzIgPSBuZXcgSW1hZ2UoKTtcbiAgbW9zcXVpdG8yLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy9cbiAgfSk7XG4gIG1vc3F1aXRvMi5zcmMgPSAnLi9pbWFnZXMvbW9zcXVpdG8yX2xlZnQucG5nJztcbiAgdmFyIG1vc3F1aXRvRmxpcHBlZCA9IG5ldyBJbWFnZSgpO1xuICBtb3NxdWl0b0ZsaXBwZWQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAvL1xuICB9KTtcbiAgbW9zcXVpdG9GbGlwcGVkLnNyYyA9ICcuL2ltYWdlcy9tb3NxdWl0bzFfbGVmdC5wbmcnO1xuICB2YXIgbW9zcXVpdG8yRmxpcHBlZCA9IG5ldyBJbWFnZSgpO1xuICBtb3NxdWl0bzJGbGlwcGVkLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy9cbiAgfSk7XG4gIG1vc3F1aXRvMkZsaXBwZWQuc3JjID0gJy4vaW1hZ2VzL21vc3F1aXRvMl9sZWZ0LnBuZyc7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3RhbE1vc3F1aXRvczsgaSsrKSB7XG4gICAgXG5cbiAgICBtb3NxdWl0b3NBcnJheS5wdXNoKG5ldyBDYW52YXNJbWFnZShbbW9zcXVpdG8vKiwgbW9zcXVpdG8yKi9dLCAwLCAwLCAwLCAwLjAwMSArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpLCAwLCAwLCBuZXcgQXJyYXkoKSkpO1xuXG4gICAgbW9zcXVpdG9zQXJyYXlbaV0uZmxpcHBlZEltYWdlcyA9IG5ldyBBcnJheShtb3NxdWl0b0ZsaXBwZWQvKiwgbW9zcXVpdG8yRmxpcHBlZCovKTtcbiAgICBcbiAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTFbaSVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEubGVuZ3RoXTtcblxuICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgXG4gICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KSB7XG4gICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50LnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudC55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC41MSwgTWF0aC5taW4oMC45NSwgYXV4RWxlbWVudC54KSkgKyAwLjAyO1xuICAgICAgYXV4RWxlbWVudC55ID0gTWF0aC5tYXgoMC4xLCBNYXRoLm1pbigwLjMsIGF1eEVsZW1lbnQueSkpO1xuXG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgIGF1eEVsZW1lbnQueCA9IGF1eEVsZW1lbnQueDtcbiAgICAgICAgYXV4RWxlbWVudC55ID0gYXV4RWxlbWVudC55ICsgMC4yNztcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDAuMSAmJiBhdXhFbGVtZW50LnggPD0gMC40OSkge1xuICAgICAgICAgIGF1eEVsZW1lbnQueCA9IGF1eEVsZW1lbnQueCArIDAuMjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICB9KTtcblxuICAgIG1vc3F1aXRvc0FycmF5W2ldLmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1vc3F1aXRvc0FycmF5W2ldLnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG4gICAgbW9zcXVpdG9zQXJyYXlbaV0ueCA9IG1vc3F1aXRvc0FycmF5W2ldLnBvc2l0aW9uc0FycmF5W21vc3F1aXRvc0FycmF5W2ldLmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICBtb3NxdWl0b3NBcnJheVtpXS55ID0gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXlbbW9zcXVpdG9zQXJyYXlbaV0uY3VycmVudFBvc2l0aW9uXS55O1xuXG4gICAgdmFyIG5leHRQb3NpdGlvbiA9IG1vc3F1aXRvc0FycmF5W2ldLmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgaWYgKG5leHRQb3NpdGlvbiA+PSBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgfVxuXG4gICAgaWYgKG1vc3F1aXRvc0FycmF5W2ldLnggPiBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgIG1vc3F1aXRvc0FycmF5W2ldLnhEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtb3NxdWl0b3NBcnJheVtpXS54RGlyID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKG1vc3F1aXRvc0FycmF5W2ldLnkgPiBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgIG1vc3F1aXRvc0FycmF5W2ldLnlEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtb3NxdWl0b3NBcnJheVtpXS55RGlyID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cbi8vRGVjaWRlIG5leHQgc3RlcCBhY3Rpb25zXG52YXIgZGVjaWRlTmV4dFN0ZXAgPSBmdW5jdGlvbihuZXh0U3RlcCl7XG4gIHN3aXRjaCAobmV4dFN0ZXApIHtcbiAgICBjYXNlIDA6XG4gICAgICAkKCcjcGdTdGVwMSAucGctYnV0dG9uJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcjcGdTdGVwMScpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyU1swXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyWzBdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTtcbiAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDEwKTtcbiAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogNTAwKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsTGVmdDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLm9mZnNldCgpLmxlZnRcbiAgICAgICAgfSwgMjAwMCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLm9mZnNldCgpLnRvcFxuICAgICAgICB9LCAyMDAwKTtcbiAgICAgIH1cbiAgICAgIFxuICAgIGJyZWFrO1xuICAgIGNhc2UgMTpcbiAgICBcbiAgICAgIHZhciBhdXhNb3NxdWl0b3NMZWZ0ID0gbW9zcXVpdG9zTGVmdDtcbiAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdCgwLCAyLCBwYXJzZUludCgkKCcjdmlzaXQtY291bnRyeScpLnZhbCgpKSk7XG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaW5kZXggPiBhdXhNb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U0U1swXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFNbMF1baV0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZTWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2U1swXVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA1O1xuICAgICAgICAgICAgICAgIC8qZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThTWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4U1swXVtpXSk7XG4gICAgICAgICAgICAgICAgfSovXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF1baV0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZbMF1baV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFswXVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA3O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2U1swXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlNbMF1baV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKmZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4U1swXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFNbMF1baV0pO1xuICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA1O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2WzBdW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF1baV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gNztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDMpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDAzKSovO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMTUpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgJChcIiNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjFcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnUXVlc3Rpb24tY29udGFpbmVyMSBzZWxlY3RcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAvLyQoXCIjcGdTdGVwMiAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoXCIjcGdTdGVwMlwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG5cbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJCgnLnBnQ2hhcnQnKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdTdGVwMicpLnBvc2l0aW9uKCkubGVmdFxuICAgICAgICB9LCAzMDAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAvKnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykucG9zaXRpb24oKS5sZWZ0XG4gICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICB9LCAzMDAwKTsqL1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsVG9wOiAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykub2Zmc2V0KCkudG9wXG4gICAgICAgIH0sIDMwMDApO1xuICAgICAgfVxuICAgIGJyZWFrO1xuICAgIGNhc2UgMjpcbiAgICAgICQoJyNwZ1N0ZXAyIC5wZy1idXR0b24nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoXCIjcGdTdGVwMlwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThTWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDIpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDIpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA3O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA3ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAxMCk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJCgnLnBnQ2hhcnQnKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgc2Nyb2xsTGVmdDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLnBvc2l0aW9uKCkubGVmdFxuICAgICAgICAgICAgfSwgMjUwMCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLm9mZnNldCgpLnRvcFxuICAgICAgICB9LCAyNTAwKTtcbiAgICAgIH1cbiAgICBicmVhaztcbiAgICBjYXNlIDM6XG5cbiAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjIgLnBnLWJ1dHRvbicpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpLmFkZENsYXNzKFwiZGlzYWJsZWQtb3B0aW9uXCIpO1xuICAgICAgLy8kKFwiI3BnU3RlcDMgLnBnLWJ1dHRvblwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnU3RlcDNcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFNbMF1baV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8qZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyU1swXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyU1swXVtpXSk7XG4gICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gOTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTBbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFswXVtpXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTJbMF1baV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMjApO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbExlZnQ6ICQoJyNwZ1N0ZXAzJykucG9zaXRpb24oKS5sZWZ0XG4gICAgICAgIH0sIDEwMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIC8qc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgIHNjcm9sbExlZnQ6ICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICAgIH0sIDMwMDApOyovXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG5cbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMycpLm9mZnNldCgpLnRvcFxuICAgICAgICB9LCAyNTAwKTtcbiAgICAgIH1cbiAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICAkKFwiI3BnU3RlcDMgLnBnLWJ1dHRvblwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoXCIjcGdTdGVwM1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTJTWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxMTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMTApO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJCgnLnBnQ2hhcnQnKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykucG9zaXRpb24oKS5sZWZ0XG4gICAgICAgIH0sIDI1MDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxUb3A6ICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5vZmZzZXQoKS50b3BcbiAgICAgICAgfSwgMjUwMCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdCg0LCAzLCAhJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKTtcblxuICAgICAgICBwcmVnbmFudE1vc3F1aXRvcyA9IG1vc3F1aXRvc0xlZnQgKiAwLjc1O1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBwcmVnbmFudE1vc3F1aXRvcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMThTWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE4WzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxNztcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMyAucGctYnV0dG9uJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvbicpLmFkZENsYXNzKFwiZGlzYWJsZWQtb3B0aW9uXCIpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPj0gcHJlZ25hbnRNb3NxdWl0b3MgJiYgaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjBbMF07XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjBTWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdXJyZW50UGhhc2UgPSAyMDtcblxuICAgICAgICAgICAgJChcIiNwZ1N0ZXA0XCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuXG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE5O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA3ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgc2Nyb2xsTGVmdDogJCgnI3BnU3RlcDQnKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgfSwgMjUwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxUb3A6ICQoJyNwZ1N0ZXA0Jykub2Zmc2V0KCkudG9wXG4gICAgICAgIH0sIDI1MDApO1xuICAgICAgfVxuICAgICAgfSwgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkgPyAwIDogMzI1MCk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gIH1cbn07XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgU3RlcHNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLy9EZWFscyB3aXRoIHRoZSBzY3JvbGxpbmcgYmV0d2VlbiBzdGVwcyBhbmQgcXVlc3Rpb25zXG52YXIgbWFuYWdlU3RlcHNBY3Rpb24gPSBmdW5jdGlvbigpe1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnU3RlcF9faW5mb19fdGV4dC1hY3Rpb24nLCBmdW5jdGlvbigpe1xuICAgIHZhciBuZXh0U3RlcCA9IHBhcnNlSW50KCQodGhpcykuYXR0cignZGF0YS1zdGVwJykpO1xuICAgIGRlY2lkZU5leHRTdGVwKG5leHRTdGVwKTtcbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCAnc2VsZWN0I3Zpc2l0LWNvdW50cnknLCBmdW5jdGlvbigpe1xuICAgIHZhciBuZXh0U3RlcCA9IHBhcnNlSW50KCQodGhpcykuYXR0cignZGF0YS1zdGVwJykgKyAxKTtcbiAgICBkZWNpZGVOZXh0U3RlcChuZXh0U3RlcCk7XG4gIH0pO1xufTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFF1ZXN0aW9uc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vL0RlYWxzIHdpdGggdGhlIHNjcm9sbGluZyBiZXR3ZWVuIHF1ZXN0aW9uc1xudmFyIG1hbmFnZVF1ZXN0aW9uc1Njcm9sbCA9IGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgJ3NlbGVjdCNob21lLWNvdW50cnknLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV4dFBvc2l0aW9uID0gJCh0aGlzKS5hdHRyKCdkYXRhLXBvcycpLFxuICAgICAgY3VycmVudFN0ZXAgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtc3RlcCcpO1xuXG4gICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2N1cnJlbnRTdGVwXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbY3VycmVudFN0ZXBdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwtNTAlLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pO1xuXG4gICAgICBpZiAoY3VycmVudFN0ZXAgPT0gMCAmJiBuZXh0UG9zaXRpb24gPT0gMSkge1xuICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sIHBhcnNlSW50KCQoJyNob21lLWNvdW50cnknKS52YWwoKSkpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRTWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMztcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdRdWVzdGlvbi1hY3Rpb24nLCBmdW5jdGlvbigpe1xuICAgICQodGhpcykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgdmFyIG5leHRQb3NpdGlvbiA9ICQodGhpcykuYXR0cignZGF0YS1wb3MnKSxcbiAgICAgIGN1cnJlbnRTdGVwID0gJCh0aGlzKS5hdHRyKCdkYXRhLXN0ZXAnKTtcblxuICAgIHZhciBhdXhDdXJyZW50U3RlcCA9IGN1cnJlbnRTdGVwO1xuICAgIGlmIChuZXh0UG9zaXRpb24gIT0gLTEpIHtcbiAgICAgIFxuICAgICAgaWYgKGN1cnJlbnRTdGVwID09IDMpIHtcbiAgICAgICAgYXV4Q3VycmVudFN0ZXAgPSAyO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgJHF1ZXN0aW9uQ29udGFpbmVyID0gJCgkKCcucGdRdWVzdGlvbi1jb250YWluZXInKVthdXhDdXJyZW50U3RlcF0pLFxuICAgICAgICBuZXdUcmFuc2xhdGlvblZhbHVlID0gLSgoJHF1ZXN0aW9uQ29udGFpbmVyLndpZHRoKCkgKiBuZXh0UG9zaXRpb24pIC8gJHF1ZXN0aW9uV3JhcHBlci53aWR0aCgpKSAqIDEwMC4wLFxuICAgICAgICBuZXdUcmFuc2xhdGlvbiA9ICd0cmFuc2xhdGUzZCgnICsgbmV3VHJhbnNsYXRpb25WYWx1ZSArICclLC01MCUsMCknO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctbW96LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJ3RyYW5zZm9ybTonLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKHBhcnNlSW50KGN1cnJlbnRTdGVwKSA9PSAyKSB7XG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChwYXJzZUludChjdXJyZW50U3RlcCksIG5leHRQb3NpdGlvbiwgMClcbiAgICAgIH1cbiAgICAgIGRlY2lkZU5leHRTdGVwKHBhcnNlSW50KGN1cnJlbnRTdGVwKSArIDEpO1xuICAgIH1cbiAgICBpZiAoY3VycmVudFN0ZXAgPT0gMCAmJiBuZXh0UG9zaXRpb24gPT0gMSkge1xuICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sIHBhcnNlSW50KCQoJyNob21lLWNvdW50cnknKS52YWwoKSkpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDM7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGN1cnJlbnRTdGVwID09IDMgJiYgbmV4dFBvc2l0aW9uID09IDEpIHtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcIi5jaGVja1wiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzBdKS5maW5kKFwiLnBnUXVlc3Rpb25fX2JvZHlfX2Fuc3dlclwiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2F1eEN1cnJlbnRTdGVwXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwtNTAlLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pOy8vXG5cbiAgICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sICgkKCQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcInBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIilbMF0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpID8gMCA6ICgoJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSA/IDEgOiAyKSk7XG5cbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNFswXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNFNbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTM7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgICB9LCAwKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY3VycmVudFN0ZXAgPT0gMyAmJiBuZXh0UG9zaXRpb24gPT0gMikge1xuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzFdKS5maW5kKFwiLmNoZWNrXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCIucGdRdWVzdGlvbl9fYm9keV9fYW5zd2VyXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgJHF1ZXN0aW9uQ29udGFpbmVyID0gJCgkKCcucGdRdWVzdGlvbi1jb250YWluZXInKVthdXhDdXJyZW50U3RlcF0pLFxuICAgICAgICBuZXdUcmFuc2xhdGlvblZhbHVlID0gLSgoJHF1ZXN0aW9uQ29udGFpbmVyLndpZHRoKCkgKiBuZXh0UG9zaXRpb24pIC8gJHF1ZXN0aW9uV3JhcHBlci53aWR0aCgpKSAqIDEwMC4wLFxuICAgICAgICBuZXdUcmFuc2xhdGlvbiA9ICd0cmFuc2xhdGUzZCgnICsgbmV3VHJhbnNsYXRpb25WYWx1ZSArICclLC01MCUsMCknO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctbW96LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJ3RyYW5zZm9ybTonLCBuZXdUcmFuc2xhdGlvbik7Ly9cblxuICAgICAgICBtb3NxdWl0b3NMZWZ0IC09IHJldHVybk1vc3F1aXRvc0xlZnQoY3VycmVudFN0ZXAsIG5leHRQb3NpdGlvbiwgISQoJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzFdKS5maW5kKFwicGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSk7XG5cbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNlswXTtcblxuICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNlNbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTU7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDcgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgICB9LCAwKTtcbiAgICB9XG5cbiAgfSk7XG59O1xuXG4vL1NlbGVjdCBhbiBvcHRpb24gb24gdGhlIHNlY29uZCBxdWVzdGlvblxudmFyIHNlbGVjdE9wdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKScsIGZ1bmN0aW9uKCkge1xuICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgICQodGhpcykuZmluZChcImltZ1wiKS5hdHRyKFwic3JjXCIsIFwiLi9pbWFnZXMvXCIgKyBiZWhhdmlvckltYWdlc1skKHRoaXMpLmF0dHIoXCJkYXRhLWluZGV4XCIpXSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuICAgICAgJCh0aGlzKS5maW5kKFwiaW1nXCIpLmF0dHIoXCJzcmNcIiwgXCIuL2ltYWdlcy9cIiArIGhvdmVyQmVoYXZpb3JJbWFnZXNbJCh0aGlzKS5hdHRyKFwiZGF0YS1pbmRleFwiKV0pO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vL1NlbGVjdCBhIGJpbmFyeSBvcHRpb24gb24gdGhlIHRoaXJkIHF1ZXN0aW9uXG52YXIgc2VsZWN0QmluYXJ5T3B0aW9uID0gZnVuY3Rpb24oKXtcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5wZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKScsIGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIG5leHRQb3NpdGlvbiA9ICQodGhpcykuYXR0cignZGF0YS1wb3MnKSxcbiAgICAgIGN1cnJlbnRTdGVwID0gJCh0aGlzKS5hdHRyKCdkYXRhLXN0ZXAnKTtcbiAgIFxuICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgIC8vIG1vdmUgbW9zcXVpdG9zXG4gICAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoXCIucGctYnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICQodGhpcykucGFyZW50KCkuZmluZChcIi5wZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG4gICAgICAkKHRoaXMpLnBhcmVudCgpLmZpbmQoXCIucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKS5hZGRDbGFzcyhcImRpc2FibGVkLW9wdGlvblwiKTtcbiAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgICQodGhpcykucGFyZW50KCkucGFyZW50KCkucGFyZW50KCkuZmluZChcIi5wZy1idXR0b25cIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U3RlcCA9PSAzICYmIG5leHRQb3NpdGlvbiA9PSAxKSB7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCIuY2hlY2tcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcIi5wZ1F1ZXN0aW9uX19ib2R5X19hbnN3ZXJcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPj0gdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uVmFsdWUgPSAtKCgkcXVlc3Rpb25Db250YWluZXIud2lkdGgoKSAqIG5leHRQb3NpdGlvbikgLyAkcXVlc3Rpb25XcmFwcGVyLndpZHRoKCkpICogMTAwLjAsXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uID0gJ3RyYW5zbGF0ZTNkKCcgKyBuZXdUcmFuc2xhdGlvblZhbHVlICsgJyUsLTUwJSwwKSc7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy1tb3otdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygndHJhbnNmb3JtOicsIG5ld1RyYW5zbGF0aW9uKTsvL1xuXG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCAoJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzBdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSA/IDAgOiAoKCQoJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzBdKS5maW5kKFwicGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkgPyAxIDogMikpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTRbMF07XG5cbiAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTRTWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDEzO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA3ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgIH0pO1xuICAgICAgfSwgMzI1MCk7XG4gICAgfVxuICAgIFxuICAgIH1cbiAgICBlbHNlIGlmIChjdXJyZW50U3RlcCA9PSAzICYmIG5leHRQb3NpdGlvbiA9PSAyKSB7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCIuY2hlY2tcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVsxXSkuZmluZChcIi5wZ1F1ZXN0aW9uX19ib2R5X19hbnN3ZXJcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPj0gdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbY3VycmVudFN0ZXAgLSAxXSksXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uVmFsdWUgPSAtKCgkcXVlc3Rpb25Db250YWluZXIud2lkdGgoKSAqIG5leHRQb3NpdGlvbikgLyAkcXVlc3Rpb25XcmFwcGVyLndpZHRoKCkpICogMTAwLjAsXG4gICAgICAgIG5ld1RyYW5zbGF0aW9uID0gJ3RyYW5zbGF0ZTNkKCcgKyBuZXdUcmFuc2xhdGlvblZhbHVlICsgJyUsLTUwJSwwKSc7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy1tb3otdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygndHJhbnNmb3JtOicsIG5ld1RyYW5zbGF0aW9uKTsvL1xuXG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChjdXJyZW50U3RlcCwgbmV4dFBvc2l0aW9uLCAhJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKTtcblxuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE2WzBdO1xuXG4gICAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE2U1swXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxNTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNyArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICAgIH0sIDMyNTApO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVsyXSkuZmluZChcIi5jaGVja1wiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzJdKS5maW5kKFwiLnBnUXVlc3Rpb25fX2JvZHlfX2Fuc3dlclwiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPj0gdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgZGVjaWRlTmV4dFN0ZXAoNSk7XG4gICAgICB9XG4gICAgfVxuXG4gIH0pO1xufTtcblxudmFyIG5ld1ggPSAwLjM7XG4gICAgdmFyIG5ld1hTID0gMC4yNTtcbiAgICB2YXIgbmV3WSA9IDMuMjI7XG4gICAgdmFyIG5ld1JlYWxZID0gMDtcbiAgICB2YXIgbmV3WVMgPSAyO1xuXG4vL1NlbGVjdCB0aGUgcHJlZ25hbmN5IG9wdGlvblxudmFyIHNlbGVjdFByZWduYW5jeU9wdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnBnU3RlcF9fcHJlZ25hbmN5LW9rJywgZnVuY3Rpb24oKcKge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgJChcIiNsZWZ0LWdsYXNzLWNvdmVyLWhvcml6b250YWwsICNsZWZ0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpbkxlZnQ6IFwiLVwiICsgKCQoXCIjbGVmdC1nbGFzcy1jb3Zlci1ob3Jpem9udGFsXCIpLndpZHRoKCkgKiAwLjAxKSArIFwicHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoXCIjbGVmdC1nbGFzcy1jb3ZlciwgI2xlZnQtZ2xhc3MtY292ZXItbWlkXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNsZWZ0LWdsYXNzLWNvdmVyXCIpLmhlaWdodCgpICogMC4wMSkgKyBcInB4XCJcbiAgICAgICAgfSwgMjAwKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgJCgnLnBnU3RlcF9fcHJlZ25hbmN5LW9rJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdTdGVwX19wcmVnbmFuY3kta28nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIGN1cnJlbnRQaGFzZSA9IDIxO1xuICAgIHByZWduYW50U2VsZWN0ZWQgPSB0cnVlO1xuXG4gICAgY2VsbCA9IE1hdGguY2VpbCgyNSAqIChtb3NxdWl0b3NMZWZ0IC8gdG90YWxNb3NxdWl0b3MpKTtcbiAgICBcbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNTpcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTI6XG4gICAgICAgIG5ld1ggPSAwLjMxNTtcbiAgICAgICAgbmV3WFMgPSAwLjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICBjYXNlIDY6XG4gICAgICBjYXNlIDEwOlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTc6XG4gICAgICAgIG5ld1ggPSAwLjQwNTtcbiAgICAgICAgbmV3WFMgPSAwLjM3NTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA5OlxuICAgICAgY2FzZSAxNTpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIxOlxuICAgICAgICBuZXdYID0gMC41O1xuICAgICAgICBuZXdYUyA9IDAuNTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3OlxuICAgICAgY2FzZSAxMzpcbiAgICAgIGNhc2UgMTg6XG4gICAgICBjYXNlIDIyOlxuICAgICAgY2FzZSAyNDpcbiAgICAgICAgbmV3WCA9IDAuNTk1O1xuICAgICAgICBuZXdYUyA9IDAuNjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgY2FzZSAxNjpcbiAgICAgIGNhc2UgMjA6XG4gICAgICBjYXNlIDIzOlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WCA9IDAuNjg1O1xuICAgICAgICBuZXdYUyA9IDAuNzU7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgc3dpdGNoIChjZWxsKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICBjYXNlIDI6XG4gICAgICBjYXNlIDQ6XG4gICAgICBjYXNlIDc6XG4gICAgICBjYXNlIDExOlxuICAgICAgICBuZXdZID0gMy4zOTtcbiAgICAgICAgbmV3WSA9IDA7XG4gICAgICAgIG5ld1JlYWxZID0gMTk7XG4gICAgICAgIG5ld1lTID0gNzI7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgOTpcbiAgICAgIGNhc2UgMTM6XG4gICAgICBjYXNlIDE2OlxuICAgICAgICBuZXdZID0gMy4zNDc1O1xuICAgICAgICBuZXdZID0gNTtcbiAgICAgICAgbmV3UmVhbFkgPSAxMztcbiAgICAgICAgbmV3WVMgPSA1MjtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTU6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMDpcbiAgICAgICAgbmV3WSA9IDMuMzA1O1xuICAgICAgICBuZXdZID0gMTA7XG4gICAgICAgIG5ld1JlYWxZID0gODtcbiAgICAgICAgbmV3WVMgPSAzMjtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA4OlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIyOlxuICAgICAgY2FzZSAyMzpcbiAgICAgICAgbmV3WSA9IDMuMjYyNTtcbiAgICAgICAgbmV3WSA9IDE1O1xuICAgICAgICBuZXdSZWFsWSA9IDQ7XG4gICAgICAgIG5ld1lTID0gMTc7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTI6XG4gICAgICBjYXNlIDE3OlxuICAgICAgY2FzZSAyMTpcbiAgICAgIGNhc2UgMjQ6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBuZXdZID0gMy4yMjtcbiAgICAgICAgbmV3WSA9IDIwO1xuICAgICAgICBuZXdSZWFsWSA9IC0xO1xuICAgICAgICBuZXdZUyA9IDI7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcbiAgICBtYXJrZXJNYXJnaW5Ub3AgPSAoMjAgLSBuZXdZKTtcblxuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwidG9wXCIsIG5ld1lTKyBcIiVcIik7XG4gICAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcImxlZnRcIiwgIChuZXdYUyAqIDEwMCkgKyBcIiVcIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJtYXJnaW4tdG9wXCIsICBuZXdSZWFsWSsgXCIlXCIpO1xuICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJsZWZ0XCIsICBwYXJzZUludChuZXdYICogMTAwKSArIFwiJVwiKTtcbiAgICB9XG5cbiAgICBtYXJrZXJQb3MgPSAkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLnBvc2l0aW9uKCk7XG5cbiAgICB2YXIgbmV3UG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6IG1hcmtlclBvcy5sZWZ0IC8gY2FudmFzLndpZHRoLCB5OiAoKG1hcmtlclBvcy50b3AgKyBwYXJzZUludCgkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcIm1hcmdpbi10b3BcIikpKSArICQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQnKS5wb3NpdGlvbigpLnRvcCArICQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuaGVpZ2h0KCkpIC8gY2FudmFzLndpZHRofSk7XG5cblxuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgIG1hcmtlclBvcyA9ICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykucG9zaXRpb24oKTtcbiAgICAgIG5ld1Bvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OiAoKG1hcmtlclBvcy5sZWZ0ICsgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXInKS5wb3NpdGlvbigpLmxlZnQgKyBwYXJzZUludCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlcicpLmNzcyhcIm1hcmdpbi1sZWZ0XCIpKSkgLyAwLjEyNSApIC8gY2FudmFzLndpZHRoLCB5OiAoKCAobWFya2VyUG9zLnRvcCArICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuaGVpZ2h0KCkgKyBwYXJzZUludCgkKFwiLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXJcIikuY3NzKFwibWFyZ2luLXRvcFwiKSkgKSArICgoJChcIiNtb3NxdWl0b3NDYW52YXNcIikuaGVpZ2h0KCkgLSAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlcicpLmhlaWdodCgpKSAvIDIuMCkgKSAvIDAuMTI1KSAvIGNhbnZhcy53aWR0aH0pO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8PSA3MzYgJiYgJChcIiNob3Jpem9udGFsLWNvbmNsdXNpb25zLWJ1dHRvblwiKS5jc3MoXCJkaXNwbGF5XCIpID09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcucGdDb25jbHVzaW9ucycpLnBvc2l0aW9uKCkubGVmdFxuICAgICAgICAgICAgfSwgMjUwMCk7XG4gICAgICAgICAgfVxuICAgICAgfSwgNDAwMCk7XG4gICAgfVxuXG4gICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBwcmVnbmFudE1vc3F1aXRvcykge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ld1Bvc2l0aW9uc0FycmF5O1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjE7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgKE1hdGgucmFuZG9tKCkgKiAxNTAwKSArIDEwMDApO1xuICAgICAgfSk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGNyZWF0ZUNvbmNsdXNpb25zKGNlbGwpO1xuICAgICAgY3JlYXRlVXNlcnNTdGF0cyhuZXdYLCBuZXdZLCBjZWxsKTtcbiAgICAgIC8vc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdTdGVwX19sYXN0LWNoYXJ0JykucG9zaXRpb24oKS5sZWZ0ICsgKCQoJyNwZ1N0ZXA0Jykud2lkdGgoKSAvIDIpXG4gICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgICAgc2Nyb2xsVG9wOiAkKFwiLnBnU3RlcF9fbGFzdC1jaGFydFwiKS5wb3NpdGlvbigpLnRvcCArICgkKCcjcGdTdGVwNCcpLmhlaWdodCgpIC8gMiApXG4gICAgICAgICAgICAvL3Njcm9sbFRvcDogJChcIi5wZ0NvbmNsdXNpb25zXCIpLm9mZnNldCgpLnRvcCAtICgkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0JykuaGVpZ2h0KCkgKiAyLjApXG4gICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH1cbiAgICAgIC8vfSwgMTAwMCk7XG4gICAgfSwgMCk7XG4gICAgfVxuICB9KTtcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5wZ1N0ZXBfX3ByZWduYW5jeS1rbycsIGZ1bmN0aW9uKCnCoHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXItaG9yaXpvbnRhbCwgI3JpZ2h0LWdsYXNzLWNvdmVyLW1pZC1ob3Jpem9udGFsXCIpLmFuaW1hdGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCItXCIgKyAoJChcIiNyaWdodC1nbGFzcy1jb3Zlci1ob3Jpem9udGFsXCIpLndpZHRoKCkgKiAwLjAxKSArIFwicHhcIlxuICAgICAgICB9LCAyMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoXCIjcmlnaHQtZ2xhc3MtY292ZXIsICNyaWdodC1nbGFzcy1jb3Zlci1taWRcIikuYW5pbWF0ZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi1cIiArICgkKFwiI3JpZ2h0LWdsYXNzLWNvdmVyXCIpLmhlaWdodCgpICogMC4wMSkgKyBcInB4XCJcbiAgICAgICAgfSwgMjAwKTtcbiAgICAgIH1cbiAgICAgICQoJy5wZ1N0ZXBfX3ByZWduYW5jeS1vaycpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJCgnLnBnU3RlcF9fcHJlZ25hbmN5LWtvJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICBjdXJyZW50UGhhc2UgPSAyMTtcbiAgICBub25QcmVnbmFudFNlbGVjdGVkID0gdHJ1ZTtcbiAgICB2YXIgbmV3TW9zcXVpdG9zTGVmdFZhbHVlID0gTWF0aC5tYXgoNSwgbW9zcXVpdG9zTGVmdCAtIChtb3NxdWl0b3NMZWZ0ICogMC40NSkpO1xuXG4gICAgY2VsbCA9IE1hdGguY2VpbCgyNSAqIChuZXdNb3NxdWl0b3NMZWZ0VmFsdWUgLyB0b3RhbE1vc3F1aXRvcykpO1xuICAgIFxuICAgIGNlbGwgPSBNYXRoLmNlaWwoMjUgKiAobW9zcXVpdG9zTGVmdCAvIHRvdGFsTW9zcXVpdG9zKSk7XG5cbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNTpcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTI6XG4gICAgICAgIG5ld1ggPSAwLjMxNTtcbiAgICAgICAgbmV3WFMgPSAwLjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICBjYXNlIDY6XG4gICAgICBjYXNlIDEwOlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTc6XG4gICAgICAgIG5ld1ggPSAwLjQwNTtcbiAgICAgICAgbmV3WFMgPSAwLjM3NTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA5OlxuICAgICAgY2FzZSAxNTpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIxOlxuICAgICAgICBuZXdYID0gMC41O1xuICAgICAgICBuZXdYUyA9IDAuNTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3OlxuICAgICAgY2FzZSAxMzpcbiAgICAgIGNhc2UgMTg6XG4gICAgICBjYXNlIDIyOlxuICAgICAgY2FzZSAyNDpcbiAgICAgICAgbmV3WCA9IDAuNTk1O1xuICAgICAgICBuZXdYUyA9IDAuNjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgY2FzZSAxNjpcbiAgICAgIGNhc2UgMjA6XG4gICAgICBjYXNlIDIzOlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WCA9IDAuNjg1O1xuICAgICAgICBuZXdYUyA9IDAuNzU7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgc3dpdGNoIChjZWxsKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICBjYXNlIDI6XG4gICAgICBjYXNlIDQ6XG4gICAgICBjYXNlIDc6XG4gICAgICBjYXNlIDExOlxuICAgICAgICBuZXdZID0gMy4zOTtcbiAgICAgICAgbmV3WSA9IDA7XG4gICAgICAgIG5ld1JlYWxZID0gMTk7XG4gICAgICAgIG5ld1lTID0gNzI7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgOTpcbiAgICAgIGNhc2UgMTM6XG4gICAgICBjYXNlIDE2OlxuICAgICAgICBuZXdZID0gMy4zNDc1O1xuICAgICAgICBuZXdZID0gNTtcbiAgICAgICAgbmV3UmVhbFkgPSAxMztcbiAgICAgICAgbmV3WVMgPSA1MjtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTU6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMDpcbiAgICAgICAgbmV3WSA9IDMuMzA1O1xuICAgICAgICBuZXdZID0gMTA7XG4gICAgICAgIG5ld1JlYWxZID0gODtcbiAgICAgICAgbmV3WVMgPSAzMjtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA4OlxuICAgICAgY2FzZSAxNDpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIyOlxuICAgICAgY2FzZSAyMzpcbiAgICAgICAgbmV3WSA9IDMuMjYyNTtcbiAgICAgICAgbmV3WSA9IDE1O1xuICAgICAgICBuZXdSZWFsWSA9IDQ7XG4gICAgICAgIG5ld1lTID0gMTc7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTI6XG4gICAgICBjYXNlIDE3OlxuICAgICAgY2FzZSAyMTpcbiAgICAgIGNhc2UgMjQ6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBuZXdZID0gMy4yMjtcbiAgICAgICAgbmV3WSA9IDIwO1xuICAgICAgICBuZXdSZWFsWSA9IC0xO1xuICAgICAgICBuZXdZUyA9IDI7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcbiAgICBtYXJrZXJNYXJnaW5Ub3AgPSAoMjAgLSBuZXdZKTtcblxuICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwidG9wXCIsIG5ld1lTKyBcIiVcIik7XG4gICAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcImxlZnRcIiwgIChuZXdYUyAqIDEwMCkgKyBcIiVcIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJtYXJnaW4tdG9wXCIsICBuZXdSZWFsWSsgXCIlXCIpO1xuICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJsZWZ0XCIsICAobmV3WCAqIDEwMCkgKyBcIiVcIik7XG4gICAgfVxuXG4gICAgbWFya2VyUG9zID0gJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5wb3NpdGlvbigpO1xuXG4gICAgdmFyIG5ld1Bvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OiBtYXJrZXJQb3MubGVmdCAvIGNhbnZhcy53aWR0aCwgeTogKChtYXJrZXJQb3MudG9wICsgcGFyc2VJbnQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJtYXJnaW4tdG9wXCIpKSkgKyAkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0JykucG9zaXRpb24oKS50b3AgKyAkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmhlaWdodCgpKSAvIGNhbnZhcy53aWR0aH0pO1xuXG5cbiAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICBtYXJrZXJQb3MgPSAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLnBvc2l0aW9uKCk7XG4gICAgICBuZXdQb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDogKChtYXJrZXJQb3MubGVmdCArICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyJykucG9zaXRpb24oKS5sZWZ0ICsgcGFyc2VJbnQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXInKS5jc3MoXCJtYXJnaW4tbGVmdFwiKSkpIC8gMC4xMjUgKSAvIGNhbnZhcy53aWR0aCwgeTogKCggKG1hcmtlclBvcy50b3AgKyAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmhlaWdodCgpICsgcGFyc2VJbnQoJChcIi5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyXCIpLmNzcyhcIm1hcmdpbi10b3BcIikpICkgKyAoKCQoXCIjbW9zcXVpdG9zQ2FudmFzXCIpLmhlaWdodCgpIC0gJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXInKS5oZWlnaHQoKSkgLyAyLjApICkgLyAwLjEyNSkgLyBjYW52YXMud2lkdGh9KTtcbiAgICBcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPD0gNzM2ICYmICQoXCIjaG9yaXpvbnRhbC1jb25jbHVzaW9ucy1idXR0b25cIikuY3NzKFwiZGlzcGxheVwiKSA9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgJCgnLnBnQ2hhcnQnKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgc2Nyb2xsTGVmdDogJCgnLnBnQ29uY2x1c2lvbnMnKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgICAgIH0sIDI1MDApO1xuICAgICAgICAgIH1cbiAgICAgIH0sIDQwMDApO1xuICAgIH1cblxuICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4ID49IHByZWduYW50TW9zcXVpdG9zICYmIGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ld1Bvc2l0aW9uc0FycmF5O1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjE7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgKE1hdGgucmFuZG9tKCkgKiAxNTAwKSArIDEwMDApO1xuICAgICAgfSk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgY3JlYXRlQ29uY2x1c2lvbnMoY2VsbCk7XG4gICAgICBjcmVhdGVVc2Vyc1N0YXRzKG5ld1gsIG5ld1ksIGNlbGwpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcjcGdTdGVwNCcpLnBvc2l0aW9uKCkubGVmdCArICgkKCcjcGdTdGVwNCcpLndpZHRoKCkgLyAyLjApXG4gICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgICAgLy9zY3JvbGxUb3A6ICQoXCIucGdDb25jbHVzaW9uc1wiKS5vZmZzZXQoKS50b3AgLSAoJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydCcpLmhlaWdodCgpICogMi4wKVxuICAgICAgICAgICAgc2Nyb2xsVG9wOiAkKFwiLnBnU3RlcF9fbGFzdC1jaGFydFwiKS5wb3NpdGlvbigpLnRvcCArICgkKCcjcGdTdGVwNCcpLmhlaWdodCgpIC8gMiApXG4gICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDEwMDApO1xuICAgIH0sIDApO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vUmV0dXJuIG1vc3F1aXRvcyBsZWZ0IGRlcGVuZGluZyBvbiB0aGUgY2hvc2VuIGNvdW50cnlcbnZhciByZXR1cm5Nb3NxdWl0b3NMZWZ0ID0gZnVuY3Rpb24oc3RlcCwgcXVlc3Rpb24sIG9wdGlvbil7XG4gIHZhciBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcblxuICBpZiAoc3RlcCA9PSAwKSB7XG4gICAgaWYgKHF1ZXN0aW9uID09IDEpIHtcbiAgICAgIGlmIChvcHRpb24gPT0gMSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSAyKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSA4MDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSA0KXtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDc1O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocXVlc3Rpb24gPT0gMikge1xuICAgICAgaWYgKG9wdGlvbiA9PSAxKSB7XG4gICAgICAgIGlmIChtb3NxdWl0b3NMZWZ0IDw9IDI1KSB7XG4gICAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IC01MDsvL1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcHRpb24gPT0gMiB8fCBvcHRpb24gPT0gNCkge1xuICAgICAgICBpZiAobW9zcXVpdG9zTGVmdCA8PSAyNSkge1xuICAgICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSA1O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChzdGVwID09IDIpIHtcbiAgICAvL2lmIChxdWVzdGlvbiA9PSAwKSB7XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbMF0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMztcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzFdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAxOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVsyXSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbM10pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzRdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVs1XSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbNl0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzddKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVs4XSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gKG1vc3F1aXRvc0xlZnQgPD0gODApID8gMiA6IDE7IFxuICAgICAgfVxuICAgIC8vfVxuICB9XG5cbiAgaWYgKHN0ZXAgPT0gMykge1xuICAgIGlmIChxdWVzdGlvbiA9PSAxKSB7XG4gICAgICBpZiAob3B0aW9uID09IDApIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDE7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcHRpb24gPT0gMSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHF1ZXN0aW9uID09IDIpIHtcbiAgICAgIGlmIChvcHRpb24gPT0gMCkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSAxKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocXVlc3Rpb24gPT0gMykge1xuICAgICAgaWYgKG9wdGlvbiA9PSAwKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAob3B0aW9uID09IDEpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF1eE1vc3F1aXRvc0xlZnQ7XG59O1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uY2x1c2lvbnNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xudmFyIGNyZWF0ZUNvbmNsdXNpb25zID0gZnVuY3Rpb24oY2VsbCkge1xuICB2YXIgY29uY2x1c2lvbnNUZXh0ID0gJzxoNCBjbGFzcz1cInBnQ29uY2x1c2lvbnNfX21haW4tY29uY2x1c2lvblwiPjxiPllvdSBoYXZlIGEgJztcblxuICBpZiAoY2VsbCA8PSAxMCkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcImxvd1wiO1xuICB9XG4gIGVsc2UgaWYgKGNlbGwgPD0gMTkpIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCJtaWRcIjtcbiAgfVxuICBlbHNlIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCJoaWdoXCI7XG4gIH1cblxuICBjb25jbHVzaW9uc1RleHQgKz0gXCIgcmlzayBvZiBjb250cmFjdGluZyB0aGUgWmlrYSB2aXJ1cywgYW5kIHRoZSBjb25zZXF1ZW5jZXMgXCJcblxuICBpZiAoY2VsbCA8PSAxMCkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIndvdWxkIGJlIG1pbGQuXCI7XG4gIH1cbiAgZWxzZSBpZiAoY2VsbCA8PSAxOSkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIndvdWxkIGJlIG1pbGQuXCI7XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiY291bGQgYmUgc2VyaW91cy5cIjtcbiAgfVxuXG4gIGNvbmNsdXNpb25zVGV4dCArPSBcIjwvYj48L2g0PlwiO1xuXG4gIGlmKHBhcnNlSW50KCQoXCIjaG9tZS1jb3VudHJ5XCIpLnZhbCgpKSA9PSA0IHx8IHBhcnNlSW50KCQoXCIjdmlzaXQtY291bnRyeVwiKS52YWwoKSkgPT0gNCkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPllvdSBsaXZlIGluIHRoZSBVbml0ZWQgU3RhdGVzIG9yIHlvdSBhcmUgcGxhbm5pbmcgdG8gdHJhdmVsIHRvIHRoZSBVbml0ZWQgU3RhdGVzLiBSZXNlYXJjaCBzaG93cyB0aGF0IHNvbWUgc3RhdGVzIHdpbGwgYmUgYWZmZWN0ZWQgYnkgdGhlIFppa2EgdmlydXMgaW4gdGhlIGNvbWluZyB3ZWVrcy48L3A+XCJcbiAgfWVsc2UgaWYgKHBhcnNlSW50KCQoXCIjaG9tZS1jb3VudHJ5XCIpLnZhbCgpKSA9PSAyICYmIHBhcnNlSW50KCQoXCIjdmlzaXQtY291bnRyeVwiKS52YWwoKSkgPT0gMikge1xuICAgIGlmICghJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVs4XSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCBwcmVnbmFudFNlbGVjdGVkKSB7XG4gICAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD5Zb3UgZG9u4oCZdCBsaXZlIGluIGEgY291bnRyeSBub3IgYXJlIHlvdSBwbGFubmluZyB0byB0cmF2ZWwgdG8gYSBjb3VudHJ5IGFmZmVjdGVkIGJ5IHRoZSBaaWthIHZpcnVzLiA8Yj5Zb3VyIHJpc2sgaXMgbG93PC9iPiBidXQgcmVtZW1iZXIgdGhhdCB0aGVyZSBoYXZlIGJlZW4gPGI+Y2FzZXMgb2Ygc2V4dWFsIHRyYW5zbWlzc2lvbjwvYj4gYnkgcGFydG5lcnMgdGhhdCBnb3QgaW5mZWN0ZWQgaW4gdGhvc2UgYXJlYXMuPC9wPlwiO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPllvdSBkb27igJl0IGxpdmUgaW4gYSBjb3VudHJ5IG5vciBhcmUgeW91IHBsYW5uaW5nIHRvIHRyYXZlbCB0byBhIGNvdW50cnkgYWZmZWN0ZWQgYnkgdGhlIFppa2EgdmlydXMuIDxiPllvdXIgcmlzayBpcyB6ZXJvLjxiPjwvcD5cIjtcbiAgICB9XG4gIH1cbiAgZWxzZSBpZighKHBhcnNlSW50KCQoXCIjaG9tZS1jb3VudHJ5XCIpLnZhbCgpKSA9PSA0ICYmIHBhcnNlSW50KCQoXCIjdmlzaXQtY291bnRyeVwiKS52YWwoKSkgPT0gNCkpIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD5Zb3UgbGl2ZSBpbiBhIGNvdW50cnkgdGhhdCBpcyBhZmZlY3RlZCBieSB0aGUgWmlrYSB2aXJ1cyBvciB5b3UgYXJlIHBsYW5uaW5nIHRvIHRyYXZlbCB0byBhIGNvdW50cnkgdGhhdCBpcy48L3A+XCI7XG4gIH1cblxuICBpZiAoJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCAkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzJdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpIHx8ICQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbNV0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikgfHwgJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVs2XSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPldlYXJpbmcgc2hvcnRzIGFuZCBzbGVldmVsZXNzIHNoaXJ0cyB0aGF0IGFyZSBkYXJrIGluIGNvbG9yIGFuZCBrZWVwaW5nIGJ1Y2tldHMgb2Ygd2F0ZXIgb3IgaGF2aW5nIHdhdGVyIGNvbnRhaW5lcnMgbmVhciB5b3VyIGhvdXNlIGNhbiA8Yj5pbmNyZWFzZSB5b3VyIHJpc2sgb2YgYmVpbmcgYml0dGVuIGJ5IHRoZSBtb3NxdWl0byBhbmQgcmFpc2UgeW91ciBjaGFuY2VzIG9mIGdldHRpbmcgdGhlIHZpcnVzLjwvYj48L3A+XCI7XG4gIH1cbiAgaWYgKCQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbM10pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikgfHwgJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVs0XSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCAkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzddKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPHA+VXNpbmcgaW5zZWN0IHJlcGVsbGVudCwgd2VhcmluZyBsaWdodCBjb2xvciBjbG90aGVzLCBoYXZpbmcgcGh5c2ljYWwgYmFycmllcnMgc3VjaCBtZXNoIHNjcmVlbnMgb3IgdHJlYXRlZCBuZXR0aW5nIG1hdGVyaWFscyBvbiBkb29ycyBhbmQgd2luZG93cywgb3Igc2xlZXBpbmcgdW5kZXIgbW9zcXVpdG8gbmV0cyB3aWxsIGFsbCA8Yj5kZWNyZWFzZSB5b3VyIHJpc2sgb2YgZ2V0dGluZyBiaXR0ZW4gYnkgdGhlIG1vc3F1aXRvIGFuZCBsb3dlciB5b3VyIGNoYW5nZXMgb2YgZ2V0dGluZyB0aGUgdmlydXMuPC9iPjwvcD5cIjtcbiAgfVxuXG4gIGlmIChub25QcmVnbmFudFNlbGVjdGVkKSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPHA+WmlrYSB2aXJ1cyBpcyBzcHJlYWQgcHJpbWFyaWx5IHRocm91Z2ggdGhlIGJpdGUgb2YgaW5mZWN0ZWQgQWVkZXMgc3BlY2llcyBtb3NxdWl0b2VzLiA8Yj5Pbmx5IDIwJSBwZW9wbGUgd2hvIGNvbnRyYWN0IHRoZSB2aXJ1cyB3aWxsIGV2ZW4gZGV2ZWxvcCBhbnkgc3ltcHRvbXMgYW5kIHRoZSBpbGxuZXNzIGlzIHVzdWFsbHkgbWlsZDwvYj4sIHdpdGggc3ltcHRvbXMgbGlrZSBmZXZlciwgcmFzaCBvciBqb2ludCBwYWluIHRoYXQgd2lsbCBsYXN0IGEgZmV3IGRheXMuPGJyPjxicj5SZWNlbnRseSBpbiBCcmF6aWwsIGxvY2FsIGhlYWx0aCBhdXRob3JpdGllcyBoYXZlIG9ic2VydmVkIGFuIGluY3JlYXNlIGluIEd1aWxsYWluLUJhcnLDqSBzeW5kcm9tZSwgdGhhdCBjYXVzZXMgcGFyYWx5c2lzLCB3aGljaCBjb2luY2lkZWQgd2l0aCBaaWthIHZpcnVzIGluZmVjdGlvbnMgaW4gdGhlIGdlbmVyYWwgcHVibGljLiBCYXNlZCBvbiBhIGdyb3dpbmcgYm9keSBvZiBwcmVsaW1pbmFyeSByZXNlYXJjaCwgdGhlcmUgaXMgc2NpZW50aWZpYyBjb25zZW5zdXMgdGhhdCBaaWthIHZpcnVzIGlzIGEgY2F1c2Ugb2YgbWljcm9jZXBoYWx5IGFuZCBHdWlsbGFpbi1CYXJyw6kgc3luZHJvbWUuPC9wPlwiO1xuICB9XG4gIGVsc2Uge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPjxiPlRoZSBaaWthIHZpcnVzIGNhbiBiZSB0cmFuc21pdHRlZCBmcm9tIGluZmVjdGVkIG1vdGhlcnMgdG8gdGhlaXIgZmV0dXNlczwvYj4gYW5kIHRoaXMgY2FuIGhhcHBlbiBkdXJpbmcgYm90aCBwcmVnbmFuY3kgb3IgYXQgY2hpbGRiaXJ0aC4gQmFzZWQgb24gYSBncm93aW5nIGJvZHkgb2YgcHJlbGltaW5hcnkgcmVzZWFyY2gsIDxiPnRoZXJlIGlzIHNjaWVudGlmaWMgY29uc2Vuc3VzIHRoYXQgWmlrYSB2aXJ1cyBpcyBhIGNhdXNlIG9mIG1pY3JvY2VwaGFseTwvYj4sIHdoaWNoIGlzIGEgY29uZGl0aW9uIHdoZXJlIGEgYmFieSBpcyBib3JuIHdpdGggYSBzbWFsbCBoZWFkIG9yIHRoZSBoZWFkIHN0b3BzIGdyb3dpbmcgYWZ0ZXIgYmlydGguIEJhYmllcyB3aXRoIG1pY3JvY2VwaGFseSBjYW4gZGV2ZWxvcCBkZXZlbG9wbWVudGFsIGRpc2FiaWxpdGllcy4gRWFybHkgZGlhZ25vc2lzIG9mIG1pY3JvY2VwaGFseSBjYW4gc29tZXRpbWVzIGJlIG1hZGUgYnkgZmV0YWwgdWx0cmFzb3VuZC48YnI+PGJyPjxiPlByZWduYW50IHdvbWVuIHdobyBkZXZlbG9wIHN5bXB0b21zIG9mIFppa2EgdmlydXMgaW5mZWN0aW9uLCBzaG91bGQgc2VlIHRoZWlyIGhlYWx0aC1jYXJlIHByb3ZpZGVyIGZvciBjbG9zZSBtb25pdG9yaW5nIG9mIHRoZWlyIHByZWduYW5jeS48L2I+IElmIHlvdeKAmXJlIHRyYXZlbGxpbmcgdG8gYSBjb3VudHJ5IGFmZmVjdGVkIGJ5IFppa2EsIHRoZSBXb3JsZCBIZWFsdGggT3JnYW5pemF0aW9uIGlzIGFkdmlzaW5nIHByZWduYW50IHdvbWVuIG5vdCB0byB0cmF2ZWwgdG8gYXJlYXMgb2Ygb25nb2luZyBaaWthIHZpcnVzIHRyYW5zbWlzc2lvbi48L3A+XCI7XG4gIH1cblxuICBjb25jbHVzaW9uc1RleHQgKz0gXCI8YnI+PGJyPlwiO1xuXG4gICQoXCIucGdDb25jbHVzaW9ucy1kZXNjXCIpLmJlZm9yZShjb25jbHVzaW9uc1RleHQpO1xuXG4gICQoXCIucGdDb25jbHVzaW9ucy1kZXNjLCAucGdDb25jbHVzaW9ucyBoNFwiKS5jc3MoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG59XG5cbnZhciBjcmVhdGVVc2Vyc1N0YXRzID0gZnVuY3Rpb24obWFya2VyTGVmdCwgbWFya2VyVG9wLCBjZWxsKSB7XG4gIHZhciByZXN1bHRzID0gWzEsIDIsIDEsIDIsIDUsIDMsIDYsIDEwLCAxLCAxLCAxLCAxLCAxMCwgMTIsIDUsIDEsIDEsIDEwLCAxMiwgMSwgMSwgMSwgMiwgOSwgMV07XG5cbiAgdmFyIG1heFJlc3VsdHMgPSAtMTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAobWF4UmVzdWx0cyA8IHJlc3VsdHNbaV0pIHtcbiAgICAgIG1heFJlc3VsdHMgPSByZXN1bHRzW2ldO1xuICAgIH1cbiAgfVxuXG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbMF0pLmNzcyhcImxlZnRcIiwgXCIwJVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVswXSkuY3NzKFwibGVmdFwiLCBcIjAlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzFdKS5jc3MoXCJsZWZ0XCIsIFwiNjAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzFdKS5jc3MoXCJsZWZ0XCIsIFwiNjAlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzJdKS5jc3MoXCJsZWZ0XCIsIFwiNzUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzJdKS5jc3MoXCJsZWZ0XCIsIFwiNzUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzNdKS5jc3MoXCJsZWZ0XCIsIFwiMCVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbM10pLmNzcyhcImxlZnRcIiwgXCIwJVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs0XSkuY3NzKFwibGVmdFwiLCBcIjU1JVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs0XSkuY3NzKFwibGVmdFwiLCBcIjU1JVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs1XSkuY3NzKFwibGVmdFwiLCBcIjcwJVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs1XSkuY3NzKFwibGVmdFwiLCBcIjcwJVwiKTtcblxuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzBdKS5jc3MoXCJ3aWR0aFwiLCBcIjYwJVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVswXSkuY3NzKFwid2lkdGhcIiwgXCI2MCVcIik7XG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbMV0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzFdKS5jc3MoXCJ3aWR0aFwiLCBcIjE1JVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVsyXSkuY3NzKFwid2lkdGhcIiwgXCIyNSVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbMl0pLmNzcyhcIndpZHRoXCIsIFwiMjUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzNdKS5jc3MoXCJ3aWR0aFwiLCBcIjU1JVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVszXSkuY3NzKFwid2lkdGhcIiwgXCI1NSVcIik7XG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbNF0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXJvdy12YWx1ZScpWzRdKS5jc3MoXCJ3aWR0aFwiLCBcIjE1JVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy1yb3ctdmFsdWUnKVs1XSkuY3NzKFwid2lkdGhcIiwgXCIzMCVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtcm93LXZhbHVlJylbNV0pLmNzcyhcIndpZHRoXCIsIFwiMzAlXCIpO1xuXG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVswXSkuY3NzKFwibGVmdFwiLCBcIjAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMF0pLmNzcyhcImxlZnRcIiwgXCIwJVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzFdKS5jc3MoXCJsZWZ0XCIsIFwiNjAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMV0pLmNzcyhcImxlZnRcIiwgXCI2MCVcIik7XG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVsyXSkuY3NzKFwibGVmdFwiLCBcIjc1JVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzJdKS5jc3MoXCJsZWZ0XCIsIFwiNzUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbM10pLmNzcyhcImxlZnRcIiwgXCIwJVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzNdKS5jc3MoXCJsZWZ0XCIsIFwiMCVcIik7XG4gICQoJCgnI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVs0XSkuY3NzKFwibGVmdFwiLCBcIjU1JVwiKTtcbiAgJCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzRdKS5jc3MoXCJsZWZ0XCIsIFwiNTUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNV0pLmNzcyhcImxlZnRcIiwgXCI3MCVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVs1XSkuY3NzKFwibGVmdFwiLCBcIjcwJVwiKTtcblxuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMF0pLmNzcyhcIndpZHRoXCIsIFwiNjAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMF0pLmNzcyhcIndpZHRoXCIsIFwiNjAlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMV0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMV0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMl0pLmNzcyhcIndpZHRoXCIsIFwiMjUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMl0pLmNzcyhcIndpZHRoXCIsIFwiMjUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbM10pLmNzcyhcIndpZHRoXCIsIFwiNTUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbM10pLmNzcyhcIndpZHRoXCIsIFwiNTUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNF0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNF0pLmNzcyhcIndpZHRoXCIsIFwiMTUlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNV0pLmNzcyhcIndpZHRoXCIsIFwiMzAlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNV0pLmNzcyhcIndpZHRoXCIsIFwiMzAlXCIpO1xuXG4gIHZhciBtZWRpdW1Xb3JkID0gXCJNRURJVU0gXCI7XG4gIGlmICgkKHdpbmRvdykud2lkdGgoKSA8IDUyMCkge1xuICAgIG1lZGl1bVdvcmQgPSBcIk1FRCBcIlxuICB9XG5cbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzBdKS5odG1sKFwiTE9XIFwiICsgNjAgKyBcIiVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVswXSkuaHRtbChcIkxPVyBcIiArIDYwICsgXCIlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMV0pLmh0bWwobWVkaXVtV29yZCArIDE1ICsgXCIlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMV0pLmh0bWwobWVkaXVtV29yZCArIDE1ICsgXCIlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbMl0pLmh0bWwoXCJISUdIIFwiICsgMjUgKyBcIiVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVsyXSkuaHRtbChcIkhJR0ggXCIgKyAyNSArIFwiJVwiKTtcbiAgJCgkKCcjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZScpWzNdKS5odG1sKFwiTE9XIFwiICsgNTUgKyBcIiVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVszXSkuaHRtbChcIkxPVyBcIiArIDU1ICsgXCIlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNF0pLmh0bWwobWVkaXVtV29yZCArIDE1ICsgXCIlXCIpO1xuICAkKCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNF0pLmh0bWwobWVkaXVtV29yZCArIDE1ICsgXCIlXCIpO1xuICAkKCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlJylbNV0pLmh0bWwoXCJISUdIIFwiICsgMzAgKyBcIiVcIik7XG4gICQoJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWUnKVs1XSkuaHRtbChcIkhJR0ggXCIgKyAzMCArIFwiJVwiKTtcblxuICAkKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHMtdGV4dC1yb3ctdmFsdWVcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAkKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWFya2VyXCIpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcbiAgJChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzLW1hcmtlclwiKS5jc3MoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cbiAgc3dpdGNoIChtYXJrZXJMZWZ0KSB7XG4gICAgY2FzZSAwLjMxNTpcbiAgICAgIHN3aXRjaCAobWFya2VyVG9wKSB7XG4gICAgICAgIGNhc2UgMjA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICogMC41O1xuICAgICAgICAgIG1hcmtlclRvcCA9IDcwICsgKDMwICogMC41KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTU6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICogMC41O1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC44NzUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNjAgKiAwLjU7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCAqIDAuNTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA1NSArICgxNSAqIDAuMTI1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNjAgKiAwLjU7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKiAwLjU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGJyZWFrO1xuICAgIGNhc2UgMC40MDU6XG4gICAgICBzd2l0Y2ggKG1hcmtlclRvcCkge1xuICAgICAgICBjYXNlIDIwOlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuMTI1KTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA3MCArICgzMCAqIDAuNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE1OlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuMTI1KTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA1NSArICgxNSAqIDAuODc1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC4xMjUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC41KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNjAgKyAoMTUgKiAwLjEyNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjEyNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC4xMjUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICogMC41O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBicmVhaztcbiAgICBjYXNlIDAuNTpcbiAgICAgIHN3aXRjaCAobWFya2VyVG9wKSB7XG4gICAgICAgIGNhc2UgMjA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC41KTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA3MCArICgzMCAqIDAuNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE1OlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjg3NSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDEwOlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjEyNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC41KTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA1NSAqIDAuNTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgYnJlYWs7XG4gICAgY2FzZSAwLjU5NTpcbiAgICAgIHN3aXRjaCAobWFya2VyVG9wKSB7XG4gICAgICAgIGNhc2UgMjA6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC44NzUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDcwICsgKDMwICogMC41KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTU6XG4gICAgICAgICAgbWFya2VyTGVmdCA9IDYwICsgKDE1ICogMC44NzUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC44NzUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNjAgKyAoMTUgKiAwLjg3NSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKyAoMTUgKiAwLjUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA2MCArICgxNSAqIDAuODc1KTtcbiAgICAgICAgICBtYXJrZXJUb3AgPSA1NSArICgxNSAqIDAuMTI1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNjAgKyAoMTUgKiAwLjg3NSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKiAwLjU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGJyZWFrO1xuICAgIGNhc2UgMC42ODU6XG4gICAgICBzd2l0Y2ggKG1hcmtlclRvcCkge1xuICAgICAgICBjYXNlIDIwOlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA3NSArICgyNSAqIDAuNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNzAgKyAoMzAgKiAwLjUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxNTpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNzUgKyAoMjUgKiAwLjUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC44NzUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNzUgKyAoMjUgKiAwLjUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC41KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICBtYXJrZXJMZWZ0ID0gNzUgKyAoMjUgKiAwLjUpO1xuICAgICAgICAgIG1hcmtlclRvcCA9IDU1ICsgKDE1ICogMC4xMjUpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgIG1hcmtlckxlZnQgPSA3NSArICgyNSAqIDAuNSk7XG4gICAgICAgICAgbWFya2VyVG9wID0gNTUgKiAwLjU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGJyZWFrO1xuICB9XG5cbiAgJCgkKFwiI3BnU3RlcDQgLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWFya2VyXCIpWzBdKS5jc3MoXCJsZWZ0XCIsIHBhcnNlSW50KG1hcmtlckxlZnQpICsgXCIlXCIpO1xuICAkKCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1tYXJrZXJcIilbMF0pLmNzcyhcImxlZnRcIiwgcGFyc2VJbnQobWFya2VyTGVmdCkgKyBcIiVcIik7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAkKCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1tYXJrZXJcIilbMF0pLmNzcyhcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcbiAgfSwgMTAwKTtcblxuICB2YXIgb2Zmc2V0WCA9IDIuNTtcblxuICBpZiAobWFya2VyVG9wID4gMTApIHtcbiAgICBvZmZzZXRYID0gLTIuNTtcbiAgfVxuICBlbHNlIGlmIChtYXJrZXJUb3AgPiAxMCkge1xuICAgIG9mZnNldFggPSAyLjU7XG4gIH1cbiAgZWxzZSB7XG4gICAgb2Zmc2V0WCA9IDA7XG4gIH1cblxuICBvZmZzZXRYID0gMDtcblxuICAkKCQoXCIjcGdTdGVwNCAucGdTdGVwX191c2Vycy1zdGF0cy1tYXJrZXJcIilbMV0pLmNzcyhcImxlZnRcIiwgcGFyc2VJbnQobWFya2VyVG9wKSArIFwiJVwiKTtcbiAgJCgkKFwiLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWFya2VyXCIpWzFdKS5jc3MoXCJsZWZ0XCIsIHBhcnNlSW50KG1hcmtlclRvcCkgKyBcIiVcIik7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAkKCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy1tYXJrZXJcIilbMV0pLmNzcyhcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcbiAgfSwgMTAwKTtcblxuICAkKFwiI2hvcml6b250YWwtY29uY2x1c2lvbnMtYnV0dG9uIC5wZy1idXR0b25cIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAkKGRvY3VtZW50KS5vbihcImNsaWNrXCIsICcjaG9yaXpvbnRhbC1jb25jbHVzaW9ucy1idXR0b24gLnBnLWJ1dHRvbjpub3QoW2Rpc2FibGVkPVwiZGlzYWJsZWRcIl0pJywgZnVuY3Rpb24oKSB7XG4gICAgJCgnLnBnQ2hhcnQnKS5hbmltYXRlKHtcbiAgICAgIHNjcm9sbExlZnQ6ICQoJyNwZ1N0ZXA0JykucG9zaXRpb24oKS5sZWZ0ICsgKCQoJyNwZ1N0ZXA0Jykud2lkdGgoKSAqIDIuMClcbiAgICB9LCAyMDAwKTtcbiAgfSk7XG5cbiAgJCgnLnBnQ29uY2x1c2lvbnMtc2hhcmViYXItd3JhcHBlcicpLmNzcyhcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xuICAkKCcucGdDb25jbHVzaW9ucy1zaGFyZWJhci13cmFwcGVyIGFbZGF0YS1zZXJ2aWNlPVwiZmFjZWJvb2tcIl0nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICB2YXIgcmlzayA9IFwiXCI7XG5cbiAgICBpZiAoY2VsbCA8PSAxMCkge1xuICAgICAgcmlzayA9IFwibG93XCI7XG4gICAgfVxuICAgIGVsc2UgaWYgKGNlbGwgPD0gMTkpIHtcbiAgICAgIHJpc2sgPSBcIm1pZFwiO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJpc2sgPSBcImhpZ2hcIjtcbiAgICB9XG5cbiAgICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgdmFyIHRleHQgPSBcIkkgZGlkIHRoZSBaaWthIHRlc3QgaW4gdGhlIFdhc2hpbmd0b24gUG9zdCBhbmQgZ290IHRoYXQgSSBoYXZlIGEgXCIrcmlzaytcIiByaXNrIG9mIGdldHRpbmcgdGhlIHZpcnVzLiBBc3Nlc3MgeW91ciByaXNrIGluIFwiICsgdXJsO1xuXG4gICAgRkIudWkoe1xuICAgICAgbWV0aG9kOiAnc2hhcmUnLFxuICAgICAgaHJlZjogdXJsLFxuICAgICAgcXVvdGU6IHRleHRcbiAgICB9LCBmdW5jdGlvbihyZXNwb25zZSl7fSk7XG5cbiAgfSk7XG4gICQoJy5wZ0NvbmNsdXNpb25zLXNoYXJlYmFyLXdyYXBwZXIgYVtkYXRhLXNlcnZpY2U9XCJ0d2l0dGVyXCJdJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJpc2sgPSBcIlwiO1xuXG4gICAgaWYgKGNlbGwgPD0gMTApIHtcbiAgICAgIHJpc2sgPSBcImxvd1wiO1xuICAgIH1cbiAgICBlbHNlIGlmIChjZWxsIDw9IDE5KSB7XG4gICAgICByaXNrID0gXCJtaWRcIjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByaXNrID0gXCJoaWdoXCI7XG4gICAgfVxuXG4gICAgdmFyIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgIHZhciB0ZXh0ID0gXCJJIGRpZCB0aGUgWmlrYSB0ZXN0IGluIHRoZSBAd2FzaGluZ3RvbnBvc3QgYW5kIGdvdCB0aGF0IEkgaGF2ZSBhIFwiKyByaXNrICtcIiByaXNrIG9mIGdldHRpbmcgdGhlIHZpcnVzLiBBc3Nlc3MgeW91ciByaXNrIGF0IFwiICsgdXJsO1xuICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3R3aXR0ZXIuY29tL3NoYXJlP3RleHQ9JyArIHRleHQgLCdzaGFyZV90d2l0dGVyJywnd2lkdGg9NTUwLCBoZWlnaHQ9MzUwLCBzY3JvbGxiYXJzPW5vJyk7XG4gIH0pO1xuXG59O1xuXG4vKipcbiAgRnVuY2lvbiBkZSByZWVzY2FsYWRvXG4gIFxuICBAbWV0aG9kIHJlc2l6ZVxuKi9cblxucnRpbWUgPSBuZXcgRGF0ZSgxLCAxLCAyMDAwLCAxMiwgMDAsIDAwKTtcbnRpbWVvdXQgPSBmYWxzZTtcbmRlbHRhID0gMjtcbnZhciBzY3JvbGxMZWZ0ID0gMDtcbnZhciBvbGRXaWR0aCA9IDA7XG52YXIgbWFya2VyTWFyZ2luVG9wID0gLTE7XG52YXIgaXNEZXNrdG9wU2l6ZSA9IHRydWU7XG5cbiQod2luZG93KS5vbihcInJlc2l6ZVwiLCBmdW5jdGlvbigpIHtcbiAgICBydGltZSA9IG5ldyBEYXRlKCk7XG4gICAgaWYgKHRpbWVvdXQgPT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSB0cnVlO1xuICAgICAgICBzY3JvbGxMZWZ0ID0gJChcIi5wZ0NoYXJ0XCIpLnNjcm9sbExlZnQoKTtcbiAgICAgICAgb2xkV2lkdGggPSAkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpO1xuICAgICAgICBzZXRUaW1lb3V0KHJlc2l6ZWVuZCwgZGVsdGEpO1xuICAgIH1cblxuICAgIGlmIChpc0Rlc2t0b3BTaXplICYmICQod2luZG93KS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQgKyAyMCkge1xuICAgICAgaXNEZXNrdG9wU2l6ZSA9IGZhbHNlO1xuICAgICAgdXBkYXRlTW9zcXVpdG9zUGF0aHMoKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIWlzRGVza3RvcFNpemUgJiYgJCh3aW5kb3cpLndpZHRoKCkgPj0gdGFibGV0VHJlc2hvbGQgKyAyMCkge1xuICAgICAgaXNEZXNrdG9wU2l6ZSA9IHRydWU7XG4gICAgICB1cGRhdGVNb3NxdWl0b3NQYXRocygpO1xuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiByZXNpemVlbmQoKSB7XG4gICAgaWYgKG5ldyBEYXRlKCkgLSBydGltZSA8IGRlbHRhKSB7XG4gICAgICAgIHNldFRpbWVvdXQobWFpbi5yZXNpemVlbmQsIGRlbHRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZW91dCA9IGZhbHNlO1xuICAgICAgLy9zZXR1cENhbnZhcygpOyBcbiAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgY2FudmFzLndpZHRoID0gJCgnLmhvcml6b250YWwtYmFja2dyb3VuZCBpbWcnKS53aWR0aCgpO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gJCgnLmhvcml6b250YWwtYmFja2dyb3VuZCBpbWcnKS5oZWlnaHQoKTtcbiAgICAgICAgY2FudmFzLnN0eWxlLndpZHRoICA9IGNhbnZhcy53aWR0aC50b1N0cmluZygpICsgXCJweFwiO1xuICAgICAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gY2FudmFzLmhlaWdodC50b1N0cmluZygpICsgXCJweFwiO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNhbnZhcy53aWR0aCA9ICQoJy5wZ0NoYXJ0LXdyYXBwZXInKS53aWR0aCgpO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQtd3JhcHBlcicpLmhlaWdodCgpO1xuICAgICAgICBjYW52YXMuc3R5bGUud2lkdGggID0gY2FudmFzLndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gICAgICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBjYW52YXMuaGVpZ2h0LnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gICAgICB9XG5cbiAgICAgIGlmICgkKHdpbmRvdykud2lkdGgoKSA8IDUyMCkge1xuICAgICAgICAkKCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZVwiKVsxXSkuaHRtbChcIk1FRCAxNSVcIik7XG4gICAgICAgICQoJChcIi5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlXCIpWzVdKS5odG1sKFwiTUVEIDE1JVwiKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAkKCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX191c2Vycy1zdGF0cy10ZXh0LXJvdy12YWx1ZVwiKVsxXSkuaHRtbChcIk1FRElVTSAxNSVcIik7XG4gICAgICAgICQoJChcIi5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyIC5wZ1N0ZXBfX3VzZXJzLXN0YXRzLXRleHQtcm93LXZhbHVlXCIpWzVdKS5odG1sKFwiTUVESVVNIDE1JVwiKTtcbiAgICAgIH1cbiAgICB9XG59XG5cbnZhciB1cGRhdGVNb3NxdWl0b3NQYXRocyA9IGZ1bmN0aW9uKCkge1xuICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0LmNhbnZhcy53aWR0aCwgY29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICBzd2l0Y2ggKGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTFbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxLmxlbmd0aF07XG5cbiAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgIFxuICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC41MSwgTWF0aC5taW4oMC45NSwgYXV4RWxlbWVudC54KSkgKyAwLjAyO1xuICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gTWF0aC5tYXgoMC4xLCBNYXRoLm1pbigwLjMsIGF1eEVsZW1lbnQueSkpO1xuXG4gICAgICAgICAgICBpZiAoIWlzRGVza3RvcFNpemUpIHtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gYXV4RWxlbWVudC54O1xuICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBhdXhFbGVtZW50LnkgKyAwLjI3O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMC4xICYmIGF1eEVsZW1lbnQueCA8PSAwLjQ5KSB7XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gYXV4RWxlbWVudC54ICsgMC4yO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMlNbMF07XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMlswXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoISgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UzU1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTNTLmxlbmd0aF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UzW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMy5sZW5ndGhdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSBNYXRoLm1heCgwLjA4NixNYXRoLm1pbigwLjEzNSwgYXV4RWxlbWVudC54KSkgKyAwLjAxO1xuICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IE1hdGgubWF4KDAuNTU1LE1hdGgubWluKDAuNzE1LCBhdXhFbGVtZW50LnkpKSArIDAuMDQ7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFNbMF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQ6XG4gICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U1W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNS5sZW5ndGhdO1xuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNVNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U1Uy5sZW5ndGhdO1xuICAgICAgICB9XG5cbiAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApfTtcbiAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IE1hdGgubWF4KDAuMDc2LE1hdGgubWluKDAuMTUsIGF1eEVsZW1lbnQueCkpICsgMC4wMTtcbiAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IE1hdGgubWF4KDAuODEsTWF0aC5taW4oMC44NiwgYXV4RWxlbWVudC55KSkgKyAwLjA1O1xuICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjE0IHx8IGF1eEVsZW1lbnQueCA8PSAwLjA4Nykge1xuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDAuODIpIHtcbiAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBhdXhFbGVtZW50LnkgKyAwLjA0O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2UgaWYgKGF1eEVsZW1lbnQueSA+PSAwLjgzKSB7XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gYXV4RWxlbWVudC55IC0gMC4wMjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA2OlxuICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgIGN1cnJlbnRQaGFzZSA9IDM7XG5cbiAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgJChcIiNwZ1N0ZXAyIC5wZy1idXR0b25cIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICQoXCIjcGdTdGVwMlwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTdbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3Lmxlbmd0aF07XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3U1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTdTLmxlbmd0aF07XG4gICAgICAgIH1cblxuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApfTtcbiAgICAgICAgICBpZiAoYXV4RWxlbWVudC54ID49IDAuNDIgfHwgYXV4RWxlbWVudC54IDw9IDAuMzkpIHtcbiAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS4yMDY2MTAxNjk0OTE1MjYpIHtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4yMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGF1eEVsZW1lbnQueSA+PSAxLjI4KSB7XG4gICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IDEuMjg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC40OSkge1xuICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSAwLjQ5XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54IDw9IDAuMzYpIHtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gMC4zNlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA+PSAxLjMpIHtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4zXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDEuMTkpIHtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS4xOVxuICAgICAgICAgICAgfVxuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNzpcbiAgICAgICAgaWYgKGluZGV4ID4gYXV4TW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFNbMF1baV0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2U1swXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2U1swXVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFNbMF1baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U0WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF1baV0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZbMF1baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFswXVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlNbMF1baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThTWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThTWzBdW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2WzBdW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF1baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDMpKi87XG4gICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDMpKi87XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDg6XG4gICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTkubGVuZ3RoXTtcblxuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVMubGVuZ3RoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTlTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVMubGVuZ3RoXTtcbiAgICAgICAgfVxuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC44ODUgfHwgYXV4RWxlbWVudC54IDw9IDAuODA2KSB7XG4gICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS40ODcpIHtcbiAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjQ4NztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIGlmIChhdXhFbGVtZW50LnkgPj0gMS41NTgpIHtcbiAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjU1ODtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA+PSAwLjg5OCkge1xuICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IDAuODk4O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPD0gMC43OSkge1xuICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IDAuNzk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA+PSAxLjU3KSB7XG4gICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS41NztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC55IDw9IDEuNDcpIHtcbiAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjQ3O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IGF1eEVsZW1lbnQueCArIDAuMDU3O1xuICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBhdXhFbGVtZW50LnkgKyAwLjExNTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDk6XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTA6XG4gICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgXG4gICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICQoXCIjcGdTdGVwMyAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAkKFwiI3BnU3RlcDNcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExLmxlbmd0aF07XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVMubGVuZ3RoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGVsZW1lbnQyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSAtIDAuMDE4LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEwU1swXVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMlNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyU1swXVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTBbMF1baV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTJbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyWzBdW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTI6XG4gICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgXG4gICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICQoXCIjcGdTdGVwMyAucGctYnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgICAgICQoXCIjcGdTdGVwM1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICAgICAgICQoXCIucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKS5yZW1vdmVDbGFzcyhcImRpc2FibGVkLW9wdGlvblwiKTtcbiAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzIC5wZy1idXR0b24nKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMycpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMy5sZW5ndGhdO1xuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNTLmxlbmd0aF07XG4gICAgICAgIH1cblxuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpICogMS4wKSArIDAuMDA1LCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKSAtIDAuMDEgKyAwLjI3NX07XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxMzpcbiAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE0WzBdO1xuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNFNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNDpcbiAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE1Lmxlbmd0aF07XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNVNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNVMubGVuZ3RoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGVsZW1lbnQyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSkgKiAxLjApICsgMC4wMDUsIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApIC0gMC4wMSArIDAuMjc1fTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE1OlxuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNlswXTtcblxuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTZTWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTY6XG4gICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcblxuICAgICAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE3W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTcubGVuZ3RoXTtcblxuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE3U1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE3Uy5sZW5ndGhdO1xuICAgICAgICB9XG5cbiAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goZWxlbWVudDIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCkgKyAwLjAwNSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCkgKyAwLjI3NX07XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNzpcbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE4U1swXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOFswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxODpcbiAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTlbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOS5sZW5ndGhdO1xuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTlTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTlTLmxlbmd0aF07XG4gICAgICAgIH1cblxuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIC8vZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgLSAwLjAwNTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApICsgMC4zN307XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxOTpcbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjBbMF07XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIwU1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyMDpcbiAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuXG4gICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMS5sZW5ndGhdO1xuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFTW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjFTLmxlbmd0aF07XG4gICAgICAgIH1cblxuICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICAgIC8vZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgLSAwLjAwNTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChlbGVtZW50Mik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApICsgMC4zN307XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyMTpcbiAgICAgICAgbWFya2VyTWFyZ2luVG9wID0gKDIwIC0gbmV3WSk7XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwidG9wXCIsIG5ld1lTKyBcIiVcIik7XG4gICAgICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJsZWZ0XCIsICAobmV3WFMgKiAxMDApICsgXCIlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwibWFyZ2luLXRvcFwiLCAgbmV3UmVhbFkrIFwiJVwiKTtcbiAgICAgICAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcImxlZnRcIiwgIChuZXdYICogMTAwKSArIFwiJVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNyZWF0ZVVzZXJzU3RhdHMobmV3WCwgbmV3WSwgY2VsbCk7XG5cbiAgICAgICAgbWFya2VyUG9zID0gJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5wb3NpdGlvbigpO1xuXG4gICAgICAgIHZhciBuZXdQb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDogbWFya2VyUG9zLmxlZnQgLyBjYW52YXMud2lkdGgsIHk6ICgobWFya2VyUG9zLnRvcCArIHBhcnNlSW50KCQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwibWFyZ2luLXRvcFwiKSkpICsgJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydCcpLnBvc2l0aW9uKCkudG9wICsgJCgnI3BnU3RlcDQgLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5oZWlnaHQoKSkgLyBjYW52YXMud2lkdGh9KTtcblxuXG4gICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDwgdGFibGV0VHJlc2hvbGQpIHtcbiAgICAgICAgICBtYXJrZXJQb3MgPSAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlciAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLnBvc2l0aW9uKCk7XG4gICAgICAgICAgbmV3UG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6ICgobWFya2VyUG9zLmxlZnQgKyAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlcicpLnBvc2l0aW9uKCkubGVmdCArIHBhcnNlSW50KCQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyJykuY3NzKFwibWFyZ2luLWxlZnRcIikpKSAvIDAuMTI1ICkgLyBjYW52YXMud2lkdGgsIHk6ICgoIChtYXJrZXJQb3MudG9wICsgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5oZWlnaHQoKSArIHBhcnNlSW50KCQoXCIucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlclwiKS5jc3MoXCJtYXJnaW4tdG9wXCIpKSApICsgKCgkKFwiI21vc3F1aXRvc0NhbnZhc1wiKS5oZWlnaHQoKSAtICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtaG9yaXpvbnRhbC13cmFwcGVyJykuaGVpZ2h0KCkpIC8gMi4wKSApIC8gMC4xMjUpIC8gY2FudmFzLndpZHRofSk7XG4gICAgICAgICAgXG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPD0gNzM2ICYmICQoXCIjaG9yaXpvbnRhbC1jb25jbHVzaW9ucy1idXR0b25cIikuY3NzKFwiZGlzcGxheVwiKSA9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgICQoJy5wZ0NoYXJ0JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgICBzY3JvbGxMZWZ0OiAkKCcucGdDb25jbHVzaW9ucycpLnBvc2l0aW9uKCkubGVmdFxuICAgICAgICAgICAgICAgIH0sIDI1MDApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSwgMzAwMCk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyMjpcbiAgICAgICAgLy8gMjFcbiAgICAgICAgbWFya2VyTWFyZ2luVG9wID0gKDIwIC0gbmV3WSk7XG5cbiAgICAgICAgaWYgKCQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCkgPCB0YWJsZXRUcmVzaG9sZCkge1xuICAgICAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwidG9wXCIsIG5ld1lTKyBcIiVcIik7XG4gICAgICAgICAgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5jc3MoXCJsZWZ0XCIsICAobmV3WFMgKiAxMDApICsgXCIlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuY3NzKFwibWFyZ2luLXRvcFwiLCAgbmV3UmVhbFkrIFwiJVwiKTtcbiAgICAgICAgICAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcImxlZnRcIiwgIChuZXdYICogMTAwKSArIFwiJVwiKTtcbiAgICAgICAgfVxuICAgICAgICBjcmVhdGVVc2Vyc1N0YXRzKG5ld1gsIG5ld1ksIGNlbGwpO1xuXG4gICAgICAgIG1hcmtlclBvcyA9ICQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykucG9zaXRpb24oKTtcblxuICAgICAgICB2YXIgbmV3UG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6IG1hcmtlclBvcy5sZWZ0IC8gY2FudmFzLndpZHRoLCB5OiAoKG1hcmtlclBvcy50b3AgKyBwYXJzZUludCgkKCcjcGdTdGVwNCAucGdTdGVwX19sYXN0LWNoYXJ0LW1hcmtlcicpLmNzcyhcIm1hcmdpbi10b3BcIikpKSArICQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQnKS5wb3NpdGlvbigpLnRvcCArICQoJyNwZ1N0ZXA0IC5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuaGVpZ2h0KCkpIC8gY2FudmFzLndpZHRofSk7XG5cblxuICAgICAgICBpZiAoJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSA8IHRhYmxldFRyZXNob2xkKSB7XG4gICAgICAgICAgbWFya2VyUG9zID0gJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXIgLnBnU3RlcF9fbGFzdC1jaGFydC1tYXJrZXInKS5wb3NpdGlvbigpO1xuICAgICAgICAgIG5ld1Bvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OiAoKG1hcmtlclBvcy5sZWZ0ICsgJCgnLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXInKS5wb3NpdGlvbigpLmxlZnQgKyBwYXJzZUludCgkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlcicpLmNzcyhcIm1hcmdpbi1sZWZ0XCIpKSkgLyAwLjEyNSApIC8gY2FudmFzLndpZHRoLCB5OiAoKCAobWFya2VyUG9zLnRvcCArICQoJy5wZ1N0ZXBfX2xhc3QtY2hhcnQtbWFya2VyJykuaGVpZ2h0KCkgKyBwYXJzZUludCgkKFwiLnBnU3RlcF9fbGFzdC1jaGFydC1ob3Jpem9udGFsLXdyYXBwZXJcIikuY3NzKFwibWFyZ2luLXRvcFwiKSkgKSArICgoJChcIiNtb3NxdWl0b3NDYW52YXNcIikuaGVpZ2h0KCkgLSAkKCcucGdTdGVwX19sYXN0LWNoYXJ0LWhvcml6b250YWwtd3JhcHBlcicpLmhlaWdodCgpKSAvIDIuMCkgKSAvIDAuMTI1KSAvIGNhbnZhcy53aWR0aH0pO1xuICAgICAgICAgIFxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGlmICgkKFwiLnBnQXJ0aWNsZVwiKS53aWR0aCgpIDw9IDczNiAmJiAkKFwiI2hvcml6b250YWwtY29uY2x1c2lvbnMtYnV0dG9uXCIpLmNzcyhcImRpc3BsYXlcIikgPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICAkKCcucGdDaGFydCcpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVmdDogJCgnLnBnQ29uY2x1c2lvbnMnKS5wb3NpdGlvbigpLmxlZnRcbiAgICAgICAgICAgICAgICB9LCAyNTAwKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheShlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSlcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyBpKyspIHtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaCh7eDogZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXS54ICsgKChNYXRoLnJhbmRvbSgpICogMC4wNjYpIC0gMC4wMzMpLCB5OiBlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLnkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjA2NikgLSAwLjAzMyl9KTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG4gICAgZWxlbWVudC54ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICBlbGVtZW50LnkgPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55O1xuXG4gICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgIH1cblxuICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG59XG5cbnZhciBIID0gJChcIi5wZ0FydGljbGVcIikud2lkdGgoKSxcbiBTID0gJChcIi5wZ0NoYXJ0XCIpLnNjcm9sbExlZnQoKSxcbiBQID0gUy9IO1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgaWYgKCQod2luZG93KS53aWR0aCgpID49IHRhYmxldFRyZXNob2xkICsgMjApIHtcbiAgICBpc0Rlc2t0b3BTaXplID0gdHJ1ZTtcbiAgfVxuICBlbHNlIHtcbiAgICBpc0Rlc2t0b3BTaXplID0gZmFsc2U7XG4gIH1cbiAgJChcIi5wZ0NoYXJ0XCIpLnNjcm9sbChmdW5jdGlvbigpIHtcbiAgICBTID0gJChcIi5wZ0NoYXJ0XCIpLnNjcm9sbExlZnQoKTtcbiAgICBQID0gUy9IO1xuICB9KTtcblxuICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uKCkge1xuICAgICAgSCA9ICQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCk7XG4gICAgICAkKFwiLnBnQ2hhcnRcIikuc2Nyb2xsTGVmdChQKkgpO1xuICAgICAgJCgnI3Jlc2l6ZS13YXJuaW5nJykuY3NzKFwid2lkdGhcIiwgJChcIi5wZ0NoYXJ0XCIpLndpZHRoKCkgKyBcInB4XCIpO1xuICAgICAgJCgnI3Jlc2l6ZS13YXJuaW5nJykuY3NzKFwiaGVpZ2h0XCIsICQoXCIucGdDaGFydFwiKS5oZWlnaHQoKSArIFwicHhcIik7XG4gIH0pO1xuXG4gICQoJyNyZXNpemUtd2FybmluZycpLmNzcyhcIndpZHRoXCIsICQoXCIucGdDaGFydFwiKS53aWR0aCgpICsgXCJweFwiKTtcbiAgJCgnI3Jlc2l6ZS13YXJuaW5nJykuY3NzKFwiaGVpZ2h0XCIsICQoXCIucGdDaGFydFwiKS5oZWlnaHQoKSArIFwicHhcIik7XG5cbiAgLy9TZXQgdXAgbmVlZGVkIGZ1bmN0aW9uc1xuICBtYW5hZ2VRdWVzdGlvbnNTY3JvbGwoKTtcbiAgbWFuYWdlU3RlcHNBY3Rpb24oKTtcbiAgc2VsZWN0T3B0aW9uKCk7XG4gIHNlbGVjdEJpbmFyeU9wdGlvbigpO1xuICBzZWxlY3RQcmVnbmFuY3lPcHRpb24oKTtcbiAgYW5pbWF0ZUVsZW1lbnRzUHJlZ25hbmN5KCk7XG4gIGFuaW1hdGVCZWhhdmlvckVsZW1lbnRzKCk7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgLy9zZXR1cENhbnZhcygpO1xuICAgIHNldHVwTW9zcXVpdG9zKCk7XG4gICAgSCA9ICQoXCIucGdBcnRpY2xlXCIpLndpZHRoKCk7XG4gICAgUyA9ICQoXCIucGdDaGFydFwiKS5zY3JvbGxMZWZ0KCk7XG4gICAgUCA9IFMvSDtcbiAgfSwgNTAwKTtcbiAgc2V0dXBNYWluTG9vcCgpO1xuXG4gIC8qJChkb2N1bWVudCkub24oXCJjbGlja1wiLCBmdW5jdGlvbihlKSB7XG4gICAgLy9jb25zb2xlLmxvZygne3g6JysoKGUucGFnZVgvJChcImNhbnZhc1wiKS53aWR0aCgpKSAtIDAuMTk1KSArICcsIHk6JyArICgoKGUucGFnZVkgLSA1NjQpLyQoXCJjYW52YXNcIikud2lkdGgoKSkpICsgJ30nKTtcbiAgICB2YXIgeCA9IGUucGFnZVggLSAkKCcjbW9zcXVpdG9zQ2FudmFzJykub2Zmc2V0KCkubGVmdDtcbiAgICB2YXIgeSA9IGUucGFnZVkgLSAkKCcjbW9zcXVpdG9zQ2FudmFzJykub2Zmc2V0KCkudG9wO1xuXG4gICAgY29uc29sZS5sb2coJ3t4OicrKCgoeCAvIDAuMTI1KS8kKFwiY2FudmFzXCIpLndpZHRoKCkpKSArICcsIHk6JyArICgoKHkgLyAwLjEyNSkvJChcImNhbnZhc1wiKS53aWR0aCgpKSkgKyAnfScpO1xuICB9KTsqL1xufSk7XG4iLCJ3aW5kb3cudHd0dHIgPSAoZnVuY3Rpb24gKGQsIHMsIGlkKSB7XG4gIHZhciB0LCBqcywgZmpzID0gZC5nZXRFbGVtZW50c0J5VGFnTmFtZShzKVswXTtcbiAgaWYgKGQuZ2V0RWxlbWVudEJ5SWQoaWQpKSByZXR1cm47XG4gIGpzID0gZC5jcmVhdGVFbGVtZW50KHMpOyBqcy5pZCA9IGlkO1xuICBqcy5zcmM9IFwiaHR0cHM6Ly9wbGF0Zm9ybS50d2l0dGVyLmNvbS93aWRnZXRzLmpzXCI7XG4gIGZqcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShqcywgZmpzKTtcbiAgcmV0dXJuIHdpbmRvdy50d3R0ciB8fCAodCA9IHsgX2U6IFtdLCByZWFkeTogZnVuY3Rpb24gKGYpIHsgdC5fZS5wdXNoKGYpIH0gfSk7XG59KGRvY3VtZW50LCBcInNjcmlwdFwiLCBcInR3aXR0ZXItd2pzXCIpKTsiXX0=
