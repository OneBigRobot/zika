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
      $("#pgStep2 .pg-button").removeAttr("disabled");
      $("#pgStep2").removeAttr("disabled");

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
      createConclusions(cell);
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
      createConclusions(cell);
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

  if (parseInt($("#home-country").val()) == 2 && parseInt($("#visit-country").val()) == 2) {
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

var createUsersStats = function(markerLeft, markerTop) {
  var results = [1, 2, 1, 2, 5, 3, 6, 10, 1, 1, 1, 1, 10, 12, 5, 1, 1, 10, 12, 1, 1, 1, 2, 9, 1];

  var maxResults = -1;

  for (var i = 0; i < results.length; i++) {
    if (maxResults < results[i]) {
      maxResults = results[i];
    }
  }

  $(".pgStep__users-stats-mid").html(parseInt(maxResults / 2.0)+"%");
  $(".pgStep__users-stats-max").html(maxResults+"%");

  $(".pgStep__users-stats-min").css("opacity", "1.0");
  $(".pgStep__users-stats-mid").css("opacity", "1.0");
  $(".pgStep__users-stats-max").css("opacity", "1.0");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGFtbWVyanMvaGFtbWVyLmpzIiwic3JjL2pzL2Jhc2UuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvaWZyYW1lLmpzIiwic3JjL2pzL3BnLXRlbXBsYXRlL3BiSGVhZGVyLmpzIiwic3JjL2pzL3BnLXRlbXBsYXRlL3BiU29jaWFsVG9vbHMuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvcG9zdEdyYXBoaWNzVGVtcGxhdGUuanMiLCJzcmMvanMvcGctdGVtcGxhdGUvdHdpdHRlci1mb2xsb3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Z0ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qISBIYW1tZXIuSlMgLSB2Mi4wLjYgLSAyMDE1LTEyLTIzXG4gKiBodHRwOi8vaGFtbWVyanMuZ2l0aHViLmlvL1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBKb3JpayBUYW5nZWxkZXI7XG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgIGxpY2Vuc2UgKi9cbihmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50LCBleHBvcnROYW1lLCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG52YXIgVkVORE9SX1BSRUZJWEVTID0gWycnLCAnd2Via2l0JywgJ01veicsICdNUycsICdtcycsICdvJ107XG52YXIgVEVTVF9FTEVNRU5UID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbnZhciBUWVBFX0ZVTkNUSU9OID0gJ2Z1bmN0aW9uJztcblxudmFyIHJvdW5kID0gTWF0aC5yb3VuZDtcbnZhciBhYnMgPSBNYXRoLmFicztcbnZhciBub3cgPSBEYXRlLm5vdztcblxuLyoqXG4gKiBzZXQgYSB0aW1lb3V0IHdpdGggYSBnaXZlbiBzY29wZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lb3V0XG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gc2V0VGltZW91dENvbnRleHQoZm4sIHRpbWVvdXQsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gc2V0VGltZW91dChiaW5kRm4oZm4sIGNvbnRleHQpLCB0aW1lb3V0KTtcbn1cblxuLyoqXG4gKiBpZiB0aGUgYXJndW1lbnQgaXMgYW4gYXJyYXksIHdlIHdhbnQgdG8gZXhlY3V0ZSB0aGUgZm4gb24gZWFjaCBlbnRyeVxuICogaWYgaXQgYWludCBhbiBhcnJheSB3ZSBkb24ndCB3YW50IHRvIGRvIGEgdGhpbmcuXG4gKiB0aGlzIGlzIHVzZWQgYnkgYWxsIHRoZSBtZXRob2RzIHRoYXQgYWNjZXB0IGEgc2luZ2xlIGFuZCBhcnJheSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7KnxBcnJheX0gYXJnXG4gKiBAcGFyYW0ge1N0cmluZ30gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF1cbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5mdW5jdGlvbiBpbnZva2VBcnJheUFyZyhhcmcsIGZuLCBjb250ZXh0KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICBlYWNoKGFyZywgY29udGV4dFtmbl0sIGNvbnRleHQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIHdhbGsgb2JqZWN0cyBhbmQgYXJyYXlzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRvclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gZWFjaChvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIGk7XG5cbiAgICBpZiAoIW9iaikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG9iai5mb3JFYWNoKSB7XG4gICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSBpbiBvYmopIHtcbiAgICAgICAgICAgIG9iai5oYXNPd25Qcm9wZXJ0eShpKSAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiB3cmFwIGEgbWV0aG9kIHdpdGggYSBkZXByZWNhdGlvbiB3YXJuaW5nIGFuZCBzdGFjayB0cmFjZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gd3JhcHBpbmcgdGhlIHN1cHBsaWVkIG1ldGhvZC5cbiAqL1xuZnVuY3Rpb24gZGVwcmVjYXRlKG1ldGhvZCwgbmFtZSwgbWVzc2FnZSkge1xuICAgIHZhciBkZXByZWNhdGlvbk1lc3NhZ2UgPSAnREVQUkVDQVRFRCBNRVRIT0Q6ICcgKyBuYW1lICsgJ1xcbicgKyBtZXNzYWdlICsgJyBBVCBcXG4nO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGUgPSBuZXcgRXJyb3IoJ2dldC1zdGFjay10cmFjZScpO1xuICAgICAgICB2YXIgc3RhY2sgPSBlICYmIGUuc3RhY2sgPyBlLnN0YWNrLnJlcGxhY2UoL15bXlxcKF0rP1tcXG4kXS9nbSwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSgvXlxccythdFxccysvZ20sICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL15PYmplY3QuPGFub255bW91cz5cXHMqXFwoL2dtLCAne2Fub255bW91c30oKUAnKSA6ICdVbmtub3duIFN0YWNrIFRyYWNlJztcblxuICAgICAgICB2YXIgbG9nID0gd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLndhcm4gfHwgd2luZG93LmNvbnNvbGUubG9nKTtcbiAgICAgICAgaWYgKGxvZykge1xuICAgICAgICAgICAgbG9nLmNhbGwod2luZG93LmNvbnNvbGUsIGRlcHJlY2F0aW9uTWVzc2FnZSwgc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIGV4dGVuZCBvYmplY3QuXG4gKiBtZWFucyB0aGF0IHByb3BlcnRpZXMgaW4gZGVzdCB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IHRoZSBvbmVzIGluIHNyYy5cbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBvYmplY3RzX3RvX2Fzc2lnblxuICogQHJldHVybnMge09iamVjdH0gdGFyZ2V0XG4gKi9cbnZhciBhc3NpZ247XG5pZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT09ICdmdW5jdGlvbicpIHtcbiAgICBhc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0KSB7XG4gICAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCB8fCB0YXJnZXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG91dHB1dCA9IE9iamVjdCh0YXJnZXQpO1xuICAgICAgICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbmV4dEtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShuZXh0S2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0W25leHRLZXldID0gc291cmNlW25leHRLZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgYXNzaWduID0gT2JqZWN0LmFzc2lnbjtcbn1cblxuLyoqXG4gKiBleHRlbmQgb2JqZWN0LlxuICogbWVhbnMgdGhhdCBwcm9wZXJ0aWVzIGluIGRlc3Qgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSB0aGUgb25lcyBpbiBzcmMuXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICogQHBhcmFtIHtCb29sZWFuPWZhbHNlfSBbbWVyZ2VdXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBkZXN0XG4gKi9cbnZhciBleHRlbmQgPSBkZXByZWNhdGUoZnVuY3Rpb24gZXh0ZW5kKGRlc3QsIHNyYywgbWVyZ2UpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHNyYyk7XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwga2V5cy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCFtZXJnZSB8fCAobWVyZ2UgJiYgZGVzdFtrZXlzW2ldXSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgZGVzdFtrZXlzW2ldXSA9IHNyY1trZXlzW2ldXTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xufSwgJ2V4dGVuZCcsICdVc2UgYGFzc2lnbmAuJyk7XG5cbi8qKlxuICogbWVyZ2UgdGhlIHZhbHVlcyBmcm9tIHNyYyBpbiB0aGUgZGVzdC5cbiAqIG1lYW5zIHRoYXQgcHJvcGVydGllcyB0aGF0IGV4aXN0IGluIGRlc3Qgd2lsbCBub3QgYmUgb3ZlcndyaXR0ZW4gYnkgc3JjXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICogQHJldHVybnMge09iamVjdH0gZGVzdFxuICovXG52YXIgbWVyZ2UgPSBkZXByZWNhdGUoZnVuY3Rpb24gbWVyZ2UoZGVzdCwgc3JjKSB7XG4gICAgcmV0dXJuIGV4dGVuZChkZXN0LCBzcmMsIHRydWUpO1xufSwgJ21lcmdlJywgJ1VzZSBgYXNzaWduYC4nKTtcblxuLyoqXG4gKiBzaW1wbGUgY2xhc3MgaW5oZXJpdGFuY2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNoaWxkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBiYXNlXG4gKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXNdXG4gKi9cbmZ1bmN0aW9uIGluaGVyaXQoY2hpbGQsIGJhc2UsIHByb3BlcnRpZXMpIHtcbiAgICB2YXIgYmFzZVAgPSBiYXNlLnByb3RvdHlwZSxcbiAgICAgICAgY2hpbGRQO1xuXG4gICAgY2hpbGRQID0gY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShiYXNlUCk7XG4gICAgY2hpbGRQLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gICAgY2hpbGRQLl9zdXBlciA9IGJhc2VQO1xuXG4gICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgYXNzaWduKGNoaWxkUCwgcHJvcGVydGllcyk7XG4gICAgfVxufVxuXG4vKipcbiAqIHNpbXBsZSBmdW5jdGlvbiBiaW5kXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAqL1xuZnVuY3Rpb24gYmluZEZuKGZuLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGJvdW5kRm4oKSB7XG4gICAgICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8qKlxuICogbGV0IGEgYm9vbGVhbiB2YWx1ZSBhbHNvIGJlIGEgZnVuY3Rpb24gdGhhdCBtdXN0IHJldHVybiBhIGJvb2xlYW5cbiAqIHRoaXMgZmlyc3QgaXRlbSBpbiBhcmdzIHdpbGwgYmUgdXNlZCBhcyB0aGUgY29udGV4dFxuICogQHBhcmFtIHtCb29sZWFufEZ1bmN0aW9ufSB2YWxcbiAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXVxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGJvb2xPckZuKHZhbCwgYXJncykge1xuICAgIGlmICh0eXBlb2YgdmFsID09IFRZUEVfRlVOQ1RJT04pIHtcbiAgICAgICAgcmV0dXJuIHZhbC5hcHBseShhcmdzID8gYXJnc1swXSB8fCB1bmRlZmluZWQgOiB1bmRlZmluZWQsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsO1xufVxuXG4vKipcbiAqIHVzZSB0aGUgdmFsMiB3aGVuIHZhbDEgaXMgdW5kZWZpbmVkXG4gKiBAcGFyYW0geyp9IHZhbDFcbiAqIEBwYXJhbSB7Kn0gdmFsMlxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGlmVW5kZWZpbmVkKHZhbDEsIHZhbDIpIHtcbiAgICByZXR1cm4gKHZhbDEgPT09IHVuZGVmaW5lZCkgPyB2YWwyIDogdmFsMTtcbn1cblxuLyoqXG4gKiBhZGRFdmVudExpc3RlbmVyIHdpdGggbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2VcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gKi9cbmZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJzKHRhcmdldCwgdHlwZXMsIGhhbmRsZXIpIHtcbiAgICBlYWNoKHNwbGl0U3RyKHR5cGVzKSwgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogcmVtb3ZlRXZlbnRMaXN0ZW5lciB3aXRoIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXRcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICovXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycyh0YXJnZXQsIHR5cGVzLCBoYW5kbGVyKSB7XG4gICAgZWFjaChzcGxpdFN0cih0eXBlcyksIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIGZpbmQgaWYgYSBub2RlIGlzIGluIHRoZSBnaXZlbiBwYXJlbnRcbiAqIEBtZXRob2QgaGFzUGFyZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBwYXJlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIGhhc1BhcmVudChub2RlLCBwYXJlbnQpIHtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBzbWFsbCBpbmRleE9mIHdyYXBwZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaW5kXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gZm91bmRcbiAqL1xuZnVuY3Rpb24gaW5TdHIoc3RyLCBmaW5kKSB7XG4gICAgcmV0dXJuIHN0ci5pbmRleE9mKGZpbmQpID4gLTE7XG59XG5cbi8qKlxuICogc3BsaXQgc3RyaW5nIG9uIHdoaXRlc3BhY2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtBcnJheX0gd29yZHNcbiAqL1xuZnVuY3Rpb24gc3BsaXRTdHIoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci50cmltKCkuc3BsaXQoL1xccysvZyk7XG59XG5cbi8qKlxuICogZmluZCBpZiBhIGFycmF5IGNvbnRhaW5zIHRoZSBvYmplY3QgdXNpbmcgaW5kZXhPZiBvciBhIHNpbXBsZSBwb2x5RmlsbFxuICogQHBhcmFtIHtBcnJheX0gc3JjXG4gKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICogQHBhcmFtIHtTdHJpbmd9IFtmaW5kQnlLZXldXG4gKiBAcmV0dXJuIHtCb29sZWFufE51bWJlcn0gZmFsc2Ugd2hlbiBub3QgZm91bmQsIG9yIHRoZSBpbmRleFxuICovXG5mdW5jdGlvbiBpbkFycmF5KHNyYywgZmluZCwgZmluZEJ5S2V5KSB7XG4gICAgaWYgKHNyYy5pbmRleE9mICYmICFmaW5kQnlLZXkpIHtcbiAgICAgICAgcmV0dXJuIHNyYy5pbmRleE9mKGZpbmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBzcmMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoKGZpbmRCeUtleSAmJiBzcmNbaV1bZmluZEJ5S2V5XSA9PSBmaW5kKSB8fCAoIWZpbmRCeUtleSAmJiBzcmNbaV0gPT09IGZpbmQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbn1cblxuLyoqXG4gKiBjb252ZXJ0IGFycmF5LWxpa2Ugb2JqZWN0cyB0byByZWFsIGFycmF5c1xuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybnMge0FycmF5fVxuICovXG5mdW5jdGlvbiB0b0FycmF5KG9iaikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmosIDApO1xufVxuXG4vKipcbiAqIHVuaXF1ZSBhcnJheSB3aXRoIG9iamVjdHMgYmFzZWQgb24gYSBrZXkgKGxpa2UgJ2lkJykgb3IganVzdCBieSB0aGUgYXJyYXkncyB2YWx1ZVxuICogQHBhcmFtIHtBcnJheX0gc3JjIFt7aWQ6MX0se2lkOjJ9LHtpZDoxfV1cbiAqIEBwYXJhbSB7U3RyaW5nfSBba2V5XVxuICogQHBhcmFtIHtCb29sZWFufSBbc29ydD1GYWxzZV1cbiAqIEByZXR1cm5zIHtBcnJheX0gW3tpZDoxfSx7aWQ6Mn1dXG4gKi9cbmZ1bmN0aW9uIHVuaXF1ZUFycmF5KHNyYywga2V5LCBzb3J0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgdmFsdWVzID0gW107XG4gICAgdmFyIGkgPSAwO1xuXG4gICAgd2hpbGUgKGkgPCBzcmMubGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWwgPSBrZXkgPyBzcmNbaV1ba2V5XSA6IHNyY1tpXTtcbiAgICAgICAgaWYgKGluQXJyYXkodmFsdWVzLCB2YWwpIDwgMCkge1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHNyY1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWVzW2ldID0gdmFsO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHNvcnQpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNvcnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNvcnQoZnVuY3Rpb24gc29ydFVuaXF1ZUFycmF5KGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYVtrZXldID4gYltrZXldO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBnZXQgdGhlIHByZWZpeGVkIHByb3BlcnR5XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlcbiAqIEByZXR1cm5zIHtTdHJpbmd8VW5kZWZpbmVkfSBwcmVmaXhlZFxuICovXG5mdW5jdGlvbiBwcmVmaXhlZChvYmosIHByb3BlcnR5KSB7XG4gICAgdmFyIHByZWZpeCwgcHJvcDtcbiAgICB2YXIgY2FtZWxQcm9wID0gcHJvcGVydHlbMF0udG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnNsaWNlKDEpO1xuXG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgVkVORE9SX1BSRUZJWEVTLmxlbmd0aCkge1xuICAgICAgICBwcmVmaXggPSBWRU5ET1JfUFJFRklYRVNbaV07XG4gICAgICAgIHByb3AgPSAocHJlZml4KSA/IHByZWZpeCArIGNhbWVsUHJvcCA6IHByb3BlcnR5O1xuXG4gICAgICAgIGlmIChwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIGdldCBhIHVuaXF1ZSBpZFxuICogQHJldHVybnMge251bWJlcn0gdW5pcXVlSWRcbiAqL1xudmFyIF91bmlxdWVJZCA9IDE7XG5mdW5jdGlvbiB1bmlxdWVJZCgpIHtcbiAgICByZXR1cm4gX3VuaXF1ZUlkKys7XG59XG5cbi8qKlxuICogZ2V0IHRoZSB3aW5kb3cgb2JqZWN0IG9mIGFuIGVsZW1lbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEByZXR1cm5zIHtEb2N1bWVudFZpZXd8V2luZG93fVxuICovXG5mdW5jdGlvbiBnZXRXaW5kb3dGb3JFbGVtZW50KGVsZW1lbnQpIHtcbiAgICB2YXIgZG9jID0gZWxlbWVudC5vd25lckRvY3VtZW50IHx8IGVsZW1lbnQ7XG4gICAgcmV0dXJuIChkb2MuZGVmYXVsdFZpZXcgfHwgZG9jLnBhcmVudFdpbmRvdyB8fCB3aW5kb3cpO1xufVxuXG52YXIgTU9CSUxFX1JFR0VYID0gL21vYmlsZXx0YWJsZXR8aXAoYWR8aG9uZXxvZCl8YW5kcm9pZC9pO1xuXG52YXIgU1VQUE9SVF9UT1VDSCA9ICgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpO1xudmFyIFNVUFBPUlRfUE9JTlRFUl9FVkVOVFMgPSBwcmVmaXhlZCh3aW5kb3csICdQb2ludGVyRXZlbnQnKSAhPT0gdW5kZWZpbmVkO1xudmFyIFNVUFBPUlRfT05MWV9UT1VDSCA9IFNVUFBPUlRfVE9VQ0ggJiYgTU9CSUxFX1JFR0VYLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cbnZhciBJTlBVVF9UWVBFX1RPVUNIID0gJ3RvdWNoJztcbnZhciBJTlBVVF9UWVBFX1BFTiA9ICdwZW4nO1xudmFyIElOUFVUX1RZUEVfTU9VU0UgPSAnbW91c2UnO1xudmFyIElOUFVUX1RZUEVfS0lORUNUID0gJ2tpbmVjdCc7XG5cbnZhciBDT01QVVRFX0lOVEVSVkFMID0gMjU7XG5cbnZhciBJTlBVVF9TVEFSVCA9IDE7XG52YXIgSU5QVVRfTU9WRSA9IDI7XG52YXIgSU5QVVRfRU5EID0gNDtcbnZhciBJTlBVVF9DQU5DRUwgPSA4O1xuXG52YXIgRElSRUNUSU9OX05PTkUgPSAxO1xudmFyIERJUkVDVElPTl9MRUZUID0gMjtcbnZhciBESVJFQ1RJT05fUklHSFQgPSA0O1xudmFyIERJUkVDVElPTl9VUCA9IDg7XG52YXIgRElSRUNUSU9OX0RPV04gPSAxNjtcblxudmFyIERJUkVDVElPTl9IT1JJWk9OVEFMID0gRElSRUNUSU9OX0xFRlQgfCBESVJFQ1RJT05fUklHSFQ7XG52YXIgRElSRUNUSU9OX1ZFUlRJQ0FMID0gRElSRUNUSU9OX1VQIHwgRElSRUNUSU9OX0RPV047XG52YXIgRElSRUNUSU9OX0FMTCA9IERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMO1xuXG52YXIgUFJPUFNfWFkgPSBbJ3gnLCAneSddO1xudmFyIFBST1BTX0NMSUVOVF9YWSA9IFsnY2xpZW50WCcsICdjbGllbnRZJ107XG5cbi8qKlxuICogY3JlYXRlIG5ldyBpbnB1dCB0eXBlIG1hbmFnZXJcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtJbnB1dH1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBJbnB1dChtYW5hZ2VyLCBjYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICB0aGlzLmVsZW1lbnQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgdGhpcy50YXJnZXQgPSBtYW5hZ2VyLm9wdGlvbnMuaW5wdXRUYXJnZXQ7XG5cbiAgICAvLyBzbWFsbGVyIHdyYXBwZXIgYXJvdW5kIHRoZSBoYW5kbGVyLCBmb3IgdGhlIHNjb3BlIGFuZCB0aGUgZW5hYmxlZCBzdGF0ZSBvZiB0aGUgbWFuYWdlcixcbiAgICAvLyBzbyB3aGVuIGRpc2FibGVkIHRoZSBpbnB1dCBldmVudHMgYXJlIGNvbXBsZXRlbHkgYnlwYXNzZWQuXG4gICAgdGhpcy5kb21IYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKGJvb2xPckZuKG1hbmFnZXIub3B0aW9ucy5lbmFibGUsIFttYW5hZ2VyXSkpIHtcbiAgICAgICAgICAgIHNlbGYuaGFuZGxlcihldik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5pbml0KCk7XG5cbn1cblxuSW5wdXQucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNob3VsZCBoYW5kbGUgdGhlIGlucHV0RXZlbnQgZGF0YSBhbmQgdHJpZ2dlciB0aGUgY2FsbGJhY2tcbiAgICAgKiBAdmlydHVhbFxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkgeyB9LFxuXG4gICAgLyoqXG4gICAgICogYmluZCB0aGUgZXZlbnRzXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZXZFbCAmJiBhZGRFdmVudExpc3RlbmVycyh0aGlzLmVsZW1lbnQsIHRoaXMuZXZFbCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldlRhcmdldCAmJiBhZGRFdmVudExpc3RlbmVycyh0aGlzLnRhcmdldCwgdGhpcy5ldlRhcmdldCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldldpbiAmJiBhZGRFdmVudExpc3RlbmVycyhnZXRXaW5kb3dGb3JFbGVtZW50KHRoaXMuZWxlbWVudCksIHRoaXMuZXZXaW4sIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVuYmluZCB0aGUgZXZlbnRzXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZXZFbCAmJiByZW1vdmVFdmVudExpc3RlbmVycyh0aGlzLmVsZW1lbnQsIHRoaXMuZXZFbCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldlRhcmdldCAmJiByZW1vdmVFdmVudExpc3RlbmVycyh0aGlzLnRhcmdldCwgdGhpcy5ldlRhcmdldCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldldpbiAmJiByZW1vdmVFdmVudExpc3RlbmVycyhnZXRXaW5kb3dGb3JFbGVtZW50KHRoaXMuZWxlbWVudCksIHRoaXMuZXZXaW4sIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBjcmVhdGUgbmV3IGlucHV0IHR5cGUgbWFuYWdlclxuICogY2FsbGVkIGJ5IHRoZSBNYW5hZ2VyIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0hhbW1lcn0gbWFuYWdlclxuICogQHJldHVybnMge0lucHV0fVxuICovXG5mdW5jdGlvbiBjcmVhdGVJbnB1dEluc3RhbmNlKG1hbmFnZXIpIHtcbiAgICB2YXIgVHlwZTtcbiAgICB2YXIgaW5wdXRDbGFzcyA9IG1hbmFnZXIub3B0aW9ucy5pbnB1dENsYXNzO1xuXG4gICAgaWYgKGlucHV0Q2xhc3MpIHtcbiAgICAgICAgVHlwZSA9IGlucHV0Q2xhc3M7XG4gICAgfSBlbHNlIGlmIChTVVBQT1JUX1BPSU5URVJfRVZFTlRTKSB7XG4gICAgICAgIFR5cGUgPSBQb2ludGVyRXZlbnRJbnB1dDtcbiAgICB9IGVsc2UgaWYgKFNVUFBPUlRfT05MWV9UT1VDSCkge1xuICAgICAgICBUeXBlID0gVG91Y2hJbnB1dDtcbiAgICB9IGVsc2UgaWYgKCFTVVBQT1JUX1RPVUNIKSB7XG4gICAgICAgIFR5cGUgPSBNb3VzZUlucHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIFR5cGUgPSBUb3VjaE1vdXNlSW5wdXQ7XG4gICAgfVxuICAgIHJldHVybiBuZXcgKFR5cGUpKG1hbmFnZXIsIGlucHV0SGFuZGxlcik7XG59XG5cbi8qKlxuICogaGFuZGxlIGlucHV0IGV2ZW50c1xuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRUeXBlXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gaW5wdXRIYW5kbGVyKG1hbmFnZXIsIGV2ZW50VHlwZSwgaW5wdXQpIHtcbiAgICB2YXIgcG9pbnRlcnNMZW4gPSBpbnB1dC5wb2ludGVycy5sZW5ndGg7XG4gICAgdmFyIGNoYW5nZWRQb2ludGVyc0xlbiA9IGlucHV0LmNoYW5nZWRQb2ludGVycy5sZW5ndGg7XG4gICAgdmFyIGlzRmlyc3QgPSAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgKHBvaW50ZXJzTGVuIC0gY2hhbmdlZFBvaW50ZXJzTGVuID09PSAwKSk7XG4gICAgdmFyIGlzRmluYWwgPSAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkgJiYgKHBvaW50ZXJzTGVuIC0gY2hhbmdlZFBvaW50ZXJzTGVuID09PSAwKSk7XG5cbiAgICBpbnB1dC5pc0ZpcnN0ID0gISFpc0ZpcnN0O1xuICAgIGlucHV0LmlzRmluYWwgPSAhIWlzRmluYWw7XG5cbiAgICBpZiAoaXNGaXJzdCkge1xuICAgICAgICBtYW5hZ2VyLnNlc3Npb24gPSB7fTtcbiAgICB9XG5cbiAgICAvLyBzb3VyY2UgZXZlbnQgaXMgdGhlIG5vcm1hbGl6ZWQgdmFsdWUgb2YgdGhlIGRvbUV2ZW50c1xuICAgIC8vIGxpa2UgJ3RvdWNoc3RhcnQsIG1vdXNldXAsIHBvaW50ZXJkb3duJ1xuICAgIGlucHV0LmV2ZW50VHlwZSA9IGV2ZW50VHlwZTtcblxuICAgIC8vIGNvbXB1dGUgc2NhbGUsIHJvdGF0aW9uIGV0Y1xuICAgIGNvbXB1dGVJbnB1dERhdGEobWFuYWdlciwgaW5wdXQpO1xuXG4gICAgLy8gZW1pdCBzZWNyZXQgZXZlbnRcbiAgICBtYW5hZ2VyLmVtaXQoJ2hhbW1lci5pbnB1dCcsIGlucHV0KTtcblxuICAgIG1hbmFnZXIucmVjb2duaXplKGlucHV0KTtcbiAgICBtYW5hZ2VyLnNlc3Npb24ucHJldklucHV0ID0gaW5wdXQ7XG59XG5cbi8qKlxuICogZXh0ZW5kIHRoZSBkYXRhIHdpdGggc29tZSB1c2FibGUgcHJvcGVydGllcyBsaWtlIHNjYWxlLCByb3RhdGUsIHZlbG9jaXR5IGV0Y1xuICogQHBhcmFtIHtPYmplY3R9IG1hbmFnZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICovXG5mdW5jdGlvbiBjb21wdXRlSW5wdXREYXRhKG1hbmFnZXIsIGlucHV0KSB7XG4gICAgdmFyIHNlc3Npb24gPSBtYW5hZ2VyLnNlc3Npb247XG4gICAgdmFyIHBvaW50ZXJzID0gaW5wdXQucG9pbnRlcnM7XG4gICAgdmFyIHBvaW50ZXJzTGVuZ3RoID0gcG9pbnRlcnMubGVuZ3RoO1xuXG4gICAgLy8gc3RvcmUgdGhlIGZpcnN0IGlucHV0IHRvIGNhbGN1bGF0ZSB0aGUgZGlzdGFuY2UgYW5kIGRpcmVjdGlvblxuICAgIGlmICghc2Vzc2lvbi5maXJzdElucHV0KSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RJbnB1dCA9IHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KTtcbiAgICB9XG5cbiAgICAvLyB0byBjb21wdXRlIHNjYWxlIGFuZCByb3RhdGlvbiB3ZSBuZWVkIHRvIHN0b3JlIHRoZSBtdWx0aXBsZSB0b3VjaGVzXG4gICAgaWYgKHBvaW50ZXJzTGVuZ3RoID4gMSAmJiAhc2Vzc2lvbi5maXJzdE11bHRpcGxlKSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RNdWx0aXBsZSA9IHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KTtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXJzTGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RNdWx0aXBsZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaXJzdElucHV0ID0gc2Vzc2lvbi5maXJzdElucHV0O1xuICAgIHZhciBmaXJzdE11bHRpcGxlID0gc2Vzc2lvbi5maXJzdE11bHRpcGxlO1xuICAgIHZhciBvZmZzZXRDZW50ZXIgPSBmaXJzdE11bHRpcGxlID8gZmlyc3RNdWx0aXBsZS5jZW50ZXIgOiBmaXJzdElucHV0LmNlbnRlcjtcblxuICAgIHZhciBjZW50ZXIgPSBpbnB1dC5jZW50ZXIgPSBnZXRDZW50ZXIocG9pbnRlcnMpO1xuICAgIGlucHV0LnRpbWVTdGFtcCA9IG5vdygpO1xuICAgIGlucHV0LmRlbHRhVGltZSA9IGlucHV0LnRpbWVTdGFtcCAtIGZpcnN0SW5wdXQudGltZVN0YW1wO1xuXG4gICAgaW5wdXQuYW5nbGUgPSBnZXRBbmdsZShvZmZzZXRDZW50ZXIsIGNlbnRlcik7XG4gICAgaW5wdXQuZGlzdGFuY2UgPSBnZXREaXN0YW5jZShvZmZzZXRDZW50ZXIsIGNlbnRlcik7XG5cbiAgICBjb21wdXRlRGVsdGFYWShzZXNzaW9uLCBpbnB1dCk7XG4gICAgaW5wdXQub2Zmc2V0RGlyZWN0aW9uID0gZ2V0RGlyZWN0aW9uKGlucHV0LmRlbHRhWCwgaW5wdXQuZGVsdGFZKTtcblxuICAgIHZhciBvdmVyYWxsVmVsb2NpdHkgPSBnZXRWZWxvY2l0eShpbnB1dC5kZWx0YVRpbWUsIGlucHV0LmRlbHRhWCwgaW5wdXQuZGVsdGFZKTtcbiAgICBpbnB1dC5vdmVyYWxsVmVsb2NpdHlYID0gb3ZlcmFsbFZlbG9jaXR5Lng7XG4gICAgaW5wdXQub3ZlcmFsbFZlbG9jaXR5WSA9IG92ZXJhbGxWZWxvY2l0eS55O1xuICAgIGlucHV0Lm92ZXJhbGxWZWxvY2l0eSA9IChhYnMob3ZlcmFsbFZlbG9jaXR5LngpID4gYWJzKG92ZXJhbGxWZWxvY2l0eS55KSkgPyBvdmVyYWxsVmVsb2NpdHkueCA6IG92ZXJhbGxWZWxvY2l0eS55O1xuXG4gICAgaW5wdXQuc2NhbGUgPSBmaXJzdE11bHRpcGxlID8gZ2V0U2NhbGUoZmlyc3RNdWx0aXBsZS5wb2ludGVycywgcG9pbnRlcnMpIDogMTtcbiAgICBpbnB1dC5yb3RhdGlvbiA9IGZpcnN0TXVsdGlwbGUgPyBnZXRSb3RhdGlvbihmaXJzdE11bHRpcGxlLnBvaW50ZXJzLCBwb2ludGVycykgOiAwO1xuXG4gICAgaW5wdXQubWF4UG9pbnRlcnMgPSAhc2Vzc2lvbi5wcmV2SW5wdXQgPyBpbnB1dC5wb2ludGVycy5sZW5ndGggOiAoKGlucHV0LnBvaW50ZXJzLmxlbmd0aCA+XG4gICAgICAgIHNlc3Npb24ucHJldklucHV0Lm1heFBvaW50ZXJzKSA/IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA6IHNlc3Npb24ucHJldklucHV0Lm1heFBvaW50ZXJzKTtcblxuICAgIGNvbXB1dGVJbnRlcnZhbElucHV0RGF0YShzZXNzaW9uLCBpbnB1dCk7XG5cbiAgICAvLyBmaW5kIHRoZSBjb3JyZWN0IHRhcmdldFxuICAgIHZhciB0YXJnZXQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgaWYgKGhhc1BhcmVudChpbnB1dC5zcmNFdmVudC50YXJnZXQsIHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0ID0gaW5wdXQuc3JjRXZlbnQudGFyZ2V0O1xuICAgIH1cbiAgICBpbnB1dC50YXJnZXQgPSB0YXJnZXQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVEZWx0YVhZKHNlc3Npb24sIGlucHV0KSB7XG4gICAgdmFyIGNlbnRlciA9IGlucHV0LmNlbnRlcjtcbiAgICB2YXIgb2Zmc2V0ID0gc2Vzc2lvbi5vZmZzZXREZWx0YSB8fCB7fTtcbiAgICB2YXIgcHJldkRlbHRhID0gc2Vzc2lvbi5wcmV2RGVsdGEgfHwge307XG4gICAgdmFyIHByZXZJbnB1dCA9IHNlc3Npb24ucHJldklucHV0IHx8IHt9O1xuXG4gICAgaWYgKGlucHV0LmV2ZW50VHlwZSA9PT0gSU5QVVRfU1RBUlQgfHwgcHJldklucHV0LmV2ZW50VHlwZSA9PT0gSU5QVVRfRU5EKSB7XG4gICAgICAgIHByZXZEZWx0YSA9IHNlc3Npb24ucHJldkRlbHRhID0ge1xuICAgICAgICAgICAgeDogcHJldklucHV0LmRlbHRhWCB8fCAwLFxuICAgICAgICAgICAgeTogcHJldklucHV0LmRlbHRhWSB8fCAwXG4gICAgICAgIH07XG5cbiAgICAgICAgb2Zmc2V0ID0gc2Vzc2lvbi5vZmZzZXREZWx0YSA9IHtcbiAgICAgICAgICAgIHg6IGNlbnRlci54LFxuICAgICAgICAgICAgeTogY2VudGVyLnlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpbnB1dC5kZWx0YVggPSBwcmV2RGVsdGEueCArIChjZW50ZXIueCAtIG9mZnNldC54KTtcbiAgICBpbnB1dC5kZWx0YVkgPSBwcmV2RGVsdGEueSArIChjZW50ZXIueSAtIG9mZnNldC55KTtcbn1cblxuLyoqXG4gKiB2ZWxvY2l0eSBpcyBjYWxjdWxhdGVkIGV2ZXJ5IHggbXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBzZXNzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUludGVydmFsSW5wdXREYXRhKHNlc3Npb24sIGlucHV0KSB7XG4gICAgdmFyIGxhc3QgPSBzZXNzaW9uLmxhc3RJbnRlcnZhbCB8fCBpbnB1dCxcbiAgICAgICAgZGVsdGFUaW1lID0gaW5wdXQudGltZVN0YW1wIC0gbGFzdC50aW1lU3RhbXAsXG4gICAgICAgIHZlbG9jaXR5LCB2ZWxvY2l0eVgsIHZlbG9jaXR5WSwgZGlyZWN0aW9uO1xuXG4gICAgaWYgKGlucHV0LmV2ZW50VHlwZSAhPSBJTlBVVF9DQU5DRUwgJiYgKGRlbHRhVGltZSA+IENPTVBVVEVfSU5URVJWQUwgfHwgbGFzdC52ZWxvY2l0eSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICB2YXIgZGVsdGFYID0gaW5wdXQuZGVsdGFYIC0gbGFzdC5kZWx0YVg7XG4gICAgICAgIHZhciBkZWx0YVkgPSBpbnB1dC5kZWx0YVkgLSBsYXN0LmRlbHRhWTtcblxuICAgICAgICB2YXIgdiA9IGdldFZlbG9jaXR5KGRlbHRhVGltZSwgZGVsdGFYLCBkZWx0YVkpO1xuICAgICAgICB2ZWxvY2l0eVggPSB2Lng7XG4gICAgICAgIHZlbG9jaXR5WSA9IHYueTtcbiAgICAgICAgdmVsb2NpdHkgPSAoYWJzKHYueCkgPiBhYnModi55KSkgPyB2LnggOiB2Lnk7XG4gICAgICAgIGRpcmVjdGlvbiA9IGdldERpcmVjdGlvbihkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICAgICAgc2Vzc2lvbi5sYXN0SW50ZXJ2YWwgPSBpbnB1dDtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1c2UgbGF0ZXN0IHZlbG9jaXR5IGluZm8gaWYgaXQgZG9lc24ndCBvdmVydGFrZSBhIG1pbmltdW0gcGVyaW9kXG4gICAgICAgIHZlbG9jaXR5ID0gbGFzdC52ZWxvY2l0eTtcbiAgICAgICAgdmVsb2NpdHlYID0gbGFzdC52ZWxvY2l0eVg7XG4gICAgICAgIHZlbG9jaXR5WSA9IGxhc3QudmVsb2NpdHlZO1xuICAgICAgICBkaXJlY3Rpb24gPSBsYXN0LmRpcmVjdGlvbjtcbiAgICB9XG5cbiAgICBpbnB1dC52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgIGlucHV0LnZlbG9jaXR5WCA9IHZlbG9jaXR5WDtcbiAgICBpbnB1dC52ZWxvY2l0eVkgPSB2ZWxvY2l0eVk7XG4gICAgaW5wdXQuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xufVxuXG4vKipcbiAqIGNyZWF0ZSBhIHNpbXBsZSBjbG9uZSBmcm9tIHRoZSBpbnB1dCB1c2VkIGZvciBzdG9yYWdlIG9mIGZpcnN0SW5wdXQgYW5kIGZpcnN0TXVsdGlwbGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICogQHJldHVybnMge09iamVjdH0gY2xvbmVkSW5wdXREYXRhXG4gKi9cbmZ1bmN0aW9uIHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KSB7XG4gICAgLy8gbWFrZSBhIHNpbXBsZSBjb3B5IG9mIHRoZSBwb2ludGVycyBiZWNhdXNlIHdlIHdpbGwgZ2V0IGEgcmVmZXJlbmNlIGlmIHdlIGRvbid0XG4gICAgLy8gd2Ugb25seSBuZWVkIGNsaWVudFhZIGZvciB0aGUgY2FsY3VsYXRpb25zXG4gICAgdmFyIHBvaW50ZXJzID0gW107XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgaW5wdXQucG9pbnRlcnMubGVuZ3RoKSB7XG4gICAgICAgIHBvaW50ZXJzW2ldID0ge1xuICAgICAgICAgICAgY2xpZW50WDogcm91bmQoaW5wdXQucG9pbnRlcnNbaV0uY2xpZW50WCksXG4gICAgICAgICAgICBjbGllbnRZOiByb3VuZChpbnB1dC5wb2ludGVyc1tpXS5jbGllbnRZKVxuICAgICAgICB9O1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGltZVN0YW1wOiBub3coKSxcbiAgICAgICAgcG9pbnRlcnM6IHBvaW50ZXJzLFxuICAgICAgICBjZW50ZXI6IGdldENlbnRlcihwb2ludGVycyksXG4gICAgICAgIGRlbHRhWDogaW5wdXQuZGVsdGFYLFxuICAgICAgICBkZWx0YVk6IGlucHV0LmRlbHRhWVxuICAgIH07XG59XG5cbi8qKlxuICogZ2V0IHRoZSBjZW50ZXIgb2YgYWxsIHRoZSBwb2ludGVyc1xuICogQHBhcmFtIHtBcnJheX0gcG9pbnRlcnNcbiAqIEByZXR1cm4ge09iamVjdH0gY2VudGVyIGNvbnRhaW5zIGB4YCBhbmQgYHlgIHByb3BlcnRpZXNcbiAqL1xuZnVuY3Rpb24gZ2V0Q2VudGVyKHBvaW50ZXJzKSB7XG4gICAgdmFyIHBvaW50ZXJzTGVuZ3RoID0gcG9pbnRlcnMubGVuZ3RoO1xuXG4gICAgLy8gbm8gbmVlZCB0byBsb29wIHdoZW4gb25seSBvbmUgdG91Y2hcbiAgICBpZiAocG9pbnRlcnNMZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHJvdW5kKHBvaW50ZXJzWzBdLmNsaWVudFgpLFxuICAgICAgICAgICAgeTogcm91bmQocG9pbnRlcnNbMF0uY2xpZW50WSlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgeCA9IDAsIHkgPSAwLCBpID0gMDtcbiAgICB3aGlsZSAoaSA8IHBvaW50ZXJzTGVuZ3RoKSB7XG4gICAgICAgIHggKz0gcG9pbnRlcnNbaV0uY2xpZW50WDtcbiAgICAgICAgeSArPSBwb2ludGVyc1tpXS5jbGllbnRZO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogcm91bmQoeCAvIHBvaW50ZXJzTGVuZ3RoKSxcbiAgICAgICAgeTogcm91bmQoeSAvIHBvaW50ZXJzTGVuZ3RoKVxuICAgIH07XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSB2ZWxvY2l0eSBiZXR3ZWVuIHR3byBwb2ludHMuIHVuaXQgaXMgaW4gcHggcGVyIG1zLlxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhVGltZVxuICogQHBhcmFtIHtOdW1iZXJ9IHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB5XG4gKiBAcmV0dXJuIHtPYmplY3R9IHZlbG9jaXR5IGB4YCBhbmQgYHlgXG4gKi9cbmZ1bmN0aW9uIGdldFZlbG9jaXR5KGRlbHRhVGltZSwgeCwgeSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHggLyBkZWx0YVRpbWUgfHwgMCxcbiAgICAgICAgeTogeSAvIGRlbHRhVGltZSB8fCAwXG4gICAgfTtcbn1cblxuLyoqXG4gKiBnZXQgdGhlIGRpcmVjdGlvbiBiZXR3ZWVuIHR3byBwb2ludHNcbiAqIEBwYXJhbSB7TnVtYmVyfSB4XG4gKiBAcGFyYW0ge051bWJlcn0geVxuICogQHJldHVybiB7TnVtYmVyfSBkaXJlY3Rpb25cbiAqL1xuZnVuY3Rpb24gZ2V0RGlyZWN0aW9uKHgsIHkpIHtcbiAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICByZXR1cm4gRElSRUNUSU9OX05PTkU7XG4gICAgfVxuXG4gICAgaWYgKGFicyh4KSA+PSBhYnMoeSkpIHtcbiAgICAgICAgcmV0dXJuIHggPCAwID8gRElSRUNUSU9OX0xFRlQgOiBESVJFQ1RJT05fUklHSFQ7XG4gICAgfVxuICAgIHJldHVybiB5IDwgMCA/IERJUkVDVElPTl9VUCA6IERJUkVDVElPTl9ET1dOO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgYWJzb2x1dGUgZGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gcDEge3gsIHl9XG4gKiBAcGFyYW0ge09iamVjdH0gcDIge3gsIHl9XG4gKiBAcGFyYW0ge0FycmF5fSBbcHJvcHNdIGNvbnRhaW5pbmcgeCBhbmQgeSBrZXlzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGRpc3RhbmNlXG4gKi9cbmZ1bmN0aW9uIGdldERpc3RhbmNlKHAxLCBwMiwgcHJvcHMpIHtcbiAgICBpZiAoIXByb3BzKSB7XG4gICAgICAgIHByb3BzID0gUFJPUFNfWFk7XG4gICAgfVxuICAgIHZhciB4ID0gcDJbcHJvcHNbMF1dIC0gcDFbcHJvcHNbMF1dLFxuICAgICAgICB5ID0gcDJbcHJvcHNbMV1dIC0gcDFbcHJvcHNbMV1dO1xuXG4gICAgcmV0dXJuIE1hdGguc3FydCgoeCAqIHgpICsgKHkgKiB5KSk7XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byBjb29yZGluYXRlc1xuICogQHBhcmFtIHtPYmplY3R9IHAxXG4gKiBAcGFyYW0ge09iamVjdH0gcDJcbiAqIEBwYXJhbSB7QXJyYXl9IFtwcm9wc10gY29udGFpbmluZyB4IGFuZCB5IGtleXNcbiAqIEByZXR1cm4ge051bWJlcn0gYW5nbGVcbiAqL1xuZnVuY3Rpb24gZ2V0QW5nbGUocDEsIHAyLCBwcm9wcykge1xuICAgIGlmICghcHJvcHMpIHtcbiAgICAgICAgcHJvcHMgPSBQUk9QU19YWTtcbiAgICB9XG4gICAgdmFyIHggPSBwMltwcm9wc1swXV0gLSBwMVtwcm9wc1swXV0sXG4gICAgICAgIHkgPSBwMltwcm9wc1sxXV0gLSBwMVtwcm9wc1sxXV07XG4gICAgcmV0dXJuIE1hdGguYXRhbjIoeSwgeCkgKiAxODAgLyBNYXRoLlBJO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgcm90YXRpb24gZGVncmVlcyBiZXR3ZWVuIHR3byBwb2ludGVyc2V0c1xuICogQHBhcmFtIHtBcnJheX0gc3RhcnQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IGVuZCBhcnJheSBvZiBwb2ludGVyc1xuICogQHJldHVybiB7TnVtYmVyfSByb3RhdGlvblxuICovXG5mdW5jdGlvbiBnZXRSb3RhdGlvbihzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuIGdldEFuZ2xlKGVuZFsxXSwgZW5kWzBdLCBQUk9QU19DTElFTlRfWFkpICsgZ2V0QW5nbGUoc3RhcnRbMV0sIHN0YXJ0WzBdLCBQUk9QU19DTElFTlRfWFkpO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgc2NhbGUgZmFjdG9yIGJldHdlZW4gdHdvIHBvaW50ZXJzZXRzXG4gKiBubyBzY2FsZSBpcyAxLCBhbmQgZ29lcyBkb3duIHRvIDAgd2hlbiBwaW5jaGVkIHRvZ2V0aGVyLCBhbmQgYmlnZ2VyIHdoZW4gcGluY2hlZCBvdXRcbiAqIEBwYXJhbSB7QXJyYXl9IHN0YXJ0IGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBlbmQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEByZXR1cm4ge051bWJlcn0gc2NhbGVcbiAqL1xuZnVuY3Rpb24gZ2V0U2NhbGUoc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiBnZXREaXN0YW5jZShlbmRbMF0sIGVuZFsxXSwgUFJPUFNfQ0xJRU5UX1hZKSAvIGdldERpc3RhbmNlKHN0YXJ0WzBdLCBzdGFydFsxXSwgUFJPUFNfQ0xJRU5UX1hZKTtcbn1cblxudmFyIE1PVVNFX0lOUFVUX01BUCA9IHtcbiAgICBtb3VzZWRvd246IElOUFVUX1NUQVJULFxuICAgIG1vdXNlbW92ZTogSU5QVVRfTU9WRSxcbiAgICBtb3VzZXVwOiBJTlBVVF9FTkRcbn07XG5cbnZhciBNT1VTRV9FTEVNRU5UX0VWRU5UUyA9ICdtb3VzZWRvd24nO1xudmFyIE1PVVNFX1dJTkRPV19FVkVOVFMgPSAnbW91c2Vtb3ZlIG1vdXNldXAnO1xuXG4vKipcbiAqIE1vdXNlIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBNb3VzZUlucHV0KCkge1xuICAgIHRoaXMuZXZFbCA9IE1PVVNFX0VMRU1FTlRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBNT1VTRV9XSU5ET1dfRVZFTlRTO1xuXG4gICAgdGhpcy5hbGxvdyA9IHRydWU7IC8vIHVzZWQgYnkgSW5wdXQuVG91Y2hNb3VzZSB0byBkaXNhYmxlIG1vdXNlIGV2ZW50c1xuICAgIHRoaXMucHJlc3NlZCA9IGZhbHNlOyAvLyBtb3VzZWRvd24gc3RhdGVcblxuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoTW91c2VJbnB1dCwgSW5wdXQsIHtcbiAgICAvKipcbiAgICAgKiBoYW5kbGUgbW91c2UgZXZlbnRzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gTUVoYW5kbGVyKGV2KSB7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBNT1VTRV9JTlBVVF9NQVBbZXYudHlwZV07XG5cbiAgICAgICAgLy8gb24gc3RhcnQgd2Ugd2FudCB0byBoYXZlIHRoZSBsZWZ0IG1vdXNlIGJ1dHRvbiBkb3duXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9TVEFSVCAmJiBldi5idXR0b24gPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfTU9WRSAmJiBldi53aGljaCAhPT0gMSkge1xuICAgICAgICAgICAgZXZlbnRUeXBlID0gSU5QVVRfRU5EO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbW91c2UgbXVzdCBiZSBkb3duLCBhbmQgbW91c2UgZXZlbnRzIGFyZSBhbGxvd2VkIChzZWUgdGhlIFRvdWNoTW91c2UgaW5wdXQpXG4gICAgICAgIGlmICghdGhpcy5wcmVzc2VkIHx8ICF0aGlzLmFsbG93KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfRU5EKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5tYW5hZ2VyLCBldmVudFR5cGUsIHtcbiAgICAgICAgICAgIHBvaW50ZXJzOiBbZXZdLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiBbZXZdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IElOUFVUX1RZUEVfTU9VU0UsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbnZhciBQT0lOVEVSX0lOUFVUX01BUCA9IHtcbiAgICBwb2ludGVyZG93bjogSU5QVVRfU1RBUlQsXG4gICAgcG9pbnRlcm1vdmU6IElOUFVUX01PVkUsXG4gICAgcG9pbnRlcnVwOiBJTlBVVF9FTkQsXG4gICAgcG9pbnRlcmNhbmNlbDogSU5QVVRfQ0FOQ0VMLFxuICAgIHBvaW50ZXJvdXQ6IElOUFVUX0NBTkNFTFxufTtcblxuLy8gaW4gSUUxMCB0aGUgcG9pbnRlciB0eXBlcyBpcyBkZWZpbmVkIGFzIGFuIGVudW1cbnZhciBJRTEwX1BPSU5URVJfVFlQRV9FTlVNID0ge1xuICAgIDI6IElOUFVUX1RZUEVfVE9VQ0gsXG4gICAgMzogSU5QVVRfVFlQRV9QRU4sXG4gICAgNDogSU5QVVRfVFlQRV9NT1VTRSxcbiAgICA1OiBJTlBVVF9UWVBFX0tJTkVDVCAvLyBzZWUgaHR0cHM6Ly90d2l0dGVyLmNvbS9qYWNvYnJvc3NpL3N0YXR1cy80ODA1OTY0Mzg0ODk4OTA4MTZcbn07XG5cbnZhciBQT0lOVEVSX0VMRU1FTlRfRVZFTlRTID0gJ3BvaW50ZXJkb3duJztcbnZhciBQT0lOVEVSX1dJTkRPV19FVkVOVFMgPSAncG9pbnRlcm1vdmUgcG9pbnRlcnVwIHBvaW50ZXJjYW5jZWwnO1xuXG4vLyBJRTEwIGhhcyBwcmVmaXhlZCBzdXBwb3J0LCBhbmQgY2FzZS1zZW5zaXRpdmVcbmlmICh3aW5kb3cuTVNQb2ludGVyRXZlbnQgJiYgIXdpbmRvdy5Qb2ludGVyRXZlbnQpIHtcbiAgICBQT0lOVEVSX0VMRU1FTlRfRVZFTlRTID0gJ01TUG9pbnRlckRvd24nO1xuICAgIFBPSU5URVJfV0lORE9XX0VWRU5UUyA9ICdNU1BvaW50ZXJNb3ZlIE1TUG9pbnRlclVwIE1TUG9pbnRlckNhbmNlbCc7XG59XG5cbi8qKlxuICogUG9pbnRlciBldmVudHMgaW5wdXRcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gUG9pbnRlckV2ZW50SW5wdXQoKSB7XG4gICAgdGhpcy5ldkVsID0gUE9JTlRFUl9FTEVNRU5UX0VWRU5UUztcbiAgICB0aGlzLmV2V2luID0gUE9JTlRFUl9XSU5ET1dfRVZFTlRTO1xuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuc3RvcmUgPSAodGhpcy5tYW5hZ2VyLnNlc3Npb24ucG9pbnRlckV2ZW50cyA9IFtdKTtcbn1cblxuaW5oZXJpdChQb2ludGVyRXZlbnRJbnB1dCwgSW5wdXQsIHtcbiAgICAvKipcbiAgICAgKiBoYW5kbGUgbW91c2UgZXZlbnRzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gUEVoYW5kbGVyKGV2KSB7XG4gICAgICAgIHZhciBzdG9yZSA9IHRoaXMuc3RvcmU7XG4gICAgICAgIHZhciByZW1vdmVQb2ludGVyID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGV2ZW50VHlwZU5vcm1hbGl6ZWQgPSBldi50eXBlLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnbXMnLCAnJyk7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBQT0lOVEVSX0lOUFVUX01BUFtldmVudFR5cGVOb3JtYWxpemVkXTtcbiAgICAgICAgdmFyIHBvaW50ZXJUeXBlID0gSUUxMF9QT0lOVEVSX1RZUEVfRU5VTVtldi5wb2ludGVyVHlwZV0gfHwgZXYucG9pbnRlclR5cGU7XG5cbiAgICAgICAgdmFyIGlzVG91Y2ggPSAocG9pbnRlclR5cGUgPT0gSU5QVVRfVFlQRV9UT1VDSCk7XG5cbiAgICAgICAgLy8gZ2V0IGluZGV4IG9mIHRoZSBldmVudCBpbiB0aGUgc3RvcmVcbiAgICAgICAgdmFyIHN0b3JlSW5kZXggPSBpbkFycmF5KHN0b3JlLCBldi5wb2ludGVySWQsICdwb2ludGVySWQnKTtcblxuICAgICAgICAvLyBzdGFydCBhbmQgbW91c2UgbXVzdCBiZSBkb3duXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9TVEFSVCAmJiAoZXYuYnV0dG9uID09PSAwIHx8IGlzVG91Y2gpKSB7XG4gICAgICAgICAgICBpZiAoc3RvcmVJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICBzdG9yZS5wdXNoKGV2KTtcbiAgICAgICAgICAgICAgICBzdG9yZUluZGV4ID0gc3RvcmUubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChldmVudFR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICAgICAgcmVtb3ZlUG9pbnRlciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpdCBub3QgZm91bmQsIHNvIHRoZSBwb2ludGVyIGhhc24ndCBiZWVuIGRvd24gKHNvIGl0J3MgcHJvYmFibHkgYSBob3ZlcilcbiAgICAgICAgaWYgKHN0b3JlSW5kZXggPCAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB1cGRhdGUgdGhlIGV2ZW50IGluIHRoZSBzdG9yZVxuICAgICAgICBzdG9yZVtzdG9yZUluZGV4XSA9IGV2O1xuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5tYW5hZ2VyLCBldmVudFR5cGUsIHtcbiAgICAgICAgICAgIHBvaW50ZXJzOiBzdG9yZSxcbiAgICAgICAgICAgIGNoYW5nZWRQb2ludGVyczogW2V2XSxcbiAgICAgICAgICAgIHBvaW50ZXJUeXBlOiBwb2ludGVyVHlwZSxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVtb3ZlUG9pbnRlcikge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIGZyb20gdGhlIHN0b3JlXG4gICAgICAgICAgICBzdG9yZS5zcGxpY2Uoc3RvcmVJbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxudmFyIFNJTkdMRV9UT1VDSF9JTlBVVF9NQVAgPSB7XG4gICAgdG91Y2hzdGFydDogSU5QVVRfU1RBUlQsXG4gICAgdG91Y2htb3ZlOiBJTlBVVF9NT1ZFLFxuICAgIHRvdWNoZW5kOiBJTlBVVF9FTkQsXG4gICAgdG91Y2hjYW5jZWw6IElOUFVUX0NBTkNFTFxufTtcblxudmFyIFNJTkdMRV9UT1VDSF9UQVJHRVRfRVZFTlRTID0gJ3RvdWNoc3RhcnQnO1xudmFyIFNJTkdMRV9UT1VDSF9XSU5ET1dfRVZFTlRTID0gJ3RvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIHRvdWNoY2FuY2VsJztcblxuLyoqXG4gKiBUb3VjaCBldmVudHMgaW5wdXRcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gU2luZ2xlVG91Y2hJbnB1dCgpIHtcbiAgICB0aGlzLmV2VGFyZ2V0ID0gU0lOR0xFX1RPVUNIX1RBUkdFVF9FVkVOVFM7XG4gICAgdGhpcy5ldldpbiA9IFNJTkdMRV9UT1VDSF9XSU5ET1dfRVZFTlRTO1xuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChTaW5nbGVUb3VjaElucHV0LCBJbnB1dCwge1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIFRFaGFuZGxlcihldikge1xuICAgICAgICB2YXIgdHlwZSA9IFNJTkdMRV9UT1VDSF9JTlBVVF9NQVBbZXYudHlwZV07XG5cbiAgICAgICAgLy8gc2hvdWxkIHdlIGhhbmRsZSB0aGUgdG91Y2ggZXZlbnRzP1xuICAgICAgICBpZiAodHlwZSA9PT0gSU5QVVRfU1RBUlQpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuc3RhcnRlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRvdWNoZXMgPSBub3JtYWxpemVTaW5nbGVUb3VjaGVzLmNhbGwodGhpcywgZXYsIHR5cGUpO1xuXG4gICAgICAgIC8vIHdoZW4gZG9uZSwgcmVzZXQgdGhlIHN0YXJ0ZWQgc3RhdGVcbiAgICAgICAgaWYgKHR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSAmJiB0b3VjaGVzWzBdLmxlbmd0aCAtIHRvdWNoZXNbMV0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5tYW5hZ2VyLCB0eXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogdG91Y2hlc1swXSxcbiAgICAgICAgICAgIGNoYW5nZWRQb2ludGVyczogdG91Y2hlc1sxXSxcbiAgICAgICAgICAgIHBvaW50ZXJUeXBlOiBJTlBVVF9UWVBFX1RPVUNILFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIEB0aGlzIHtUb3VjaElucHV0fVxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKiBAcGFyYW0ge051bWJlcn0gdHlwZSBmbGFnXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfEFycmF5fSBbYWxsLCBjaGFuZ2VkXVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTaW5nbGVUb3VjaGVzKGV2LCB0eXBlKSB7XG4gICAgdmFyIGFsbCA9IHRvQXJyYXkoZXYudG91Y2hlcyk7XG4gICAgdmFyIGNoYW5nZWQgPSB0b0FycmF5KGV2LmNoYW5nZWRUb3VjaGVzKTtcblxuICAgIGlmICh0eXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgYWxsID0gdW5pcXVlQXJyYXkoYWxsLmNvbmNhdChjaGFuZ2VkKSwgJ2lkZW50aWZpZXInLCB0cnVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW2FsbCwgY2hhbmdlZF07XG59XG5cbnZhciBUT1VDSF9JTlBVVF9NQVAgPSB7XG4gICAgdG91Y2hzdGFydDogSU5QVVRfU1RBUlQsXG4gICAgdG91Y2htb3ZlOiBJTlBVVF9NT1ZFLFxuICAgIHRvdWNoZW5kOiBJTlBVVF9FTkQsXG4gICAgdG91Y2hjYW5jZWw6IElOUFVUX0NBTkNFTFxufTtcblxudmFyIFRPVUNIX1RBUkdFVF9FVkVOVFMgPSAndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnO1xuXG4vKipcbiAqIE11bHRpLXVzZXIgdG91Y2ggZXZlbnRzIGlucHV0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIFRvdWNoSW5wdXQoKSB7XG4gICAgdGhpcy5ldlRhcmdldCA9IFRPVUNIX1RBUkdFVF9FVkVOVFM7XG4gICAgdGhpcy50YXJnZXRJZHMgPSB7fTtcblxuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoVG91Y2hJbnB1dCwgSW5wdXQsIHtcbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBNVEVoYW5kbGVyKGV2KSB7XG4gICAgICAgIHZhciB0eXBlID0gVE9VQ0hfSU5QVVRfTUFQW2V2LnR5cGVdO1xuICAgICAgICB2YXIgdG91Y2hlcyA9IGdldFRvdWNoZXMuY2FsbCh0aGlzLCBldiwgdHlwZSk7XG4gICAgICAgIGlmICghdG91Y2hlcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIHR5cGUsIHtcbiAgICAgICAgICAgIHBvaW50ZXJzOiB0b3VjaGVzWzBdLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiB0b3VjaGVzWzFdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IElOUFVUX1RZUEVfVE9VQ0gsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogQHRoaXMge1RvdWNoSW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqIEBwYXJhbSB7TnVtYmVyfSB0eXBlIGZsYWdcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8QXJyYXl9IFthbGwsIGNoYW5nZWRdXG4gKi9cbmZ1bmN0aW9uIGdldFRvdWNoZXMoZXYsIHR5cGUpIHtcbiAgICB2YXIgYWxsVG91Y2hlcyA9IHRvQXJyYXkoZXYudG91Y2hlcyk7XG4gICAgdmFyIHRhcmdldElkcyA9IHRoaXMudGFyZ2V0SWRzO1xuXG4gICAgLy8gd2hlbiB0aGVyZSBpcyBvbmx5IG9uZSB0b3VjaCwgdGhlIHByb2Nlc3MgY2FuIGJlIHNpbXBsaWZpZWRcbiAgICBpZiAodHlwZSAmIChJTlBVVF9TVEFSVCB8IElOUFVUX01PVkUpICYmIGFsbFRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHRhcmdldElkc1thbGxUb3VjaGVzWzBdLmlkZW50aWZpZXJdID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIFthbGxUb3VjaGVzLCBhbGxUb3VjaGVzXTtcbiAgICB9XG5cbiAgICB2YXIgaSxcbiAgICAgICAgdGFyZ2V0VG91Y2hlcyxcbiAgICAgICAgY2hhbmdlZFRvdWNoZXMgPSB0b0FycmF5KGV2LmNoYW5nZWRUb3VjaGVzKSxcbiAgICAgICAgY2hhbmdlZFRhcmdldFRvdWNoZXMgPSBbXSxcbiAgICAgICAgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG5cbiAgICAvLyBnZXQgdGFyZ2V0IHRvdWNoZXMgZnJvbSB0b3VjaGVzXG4gICAgdGFyZ2V0VG91Y2hlcyA9IGFsbFRvdWNoZXMuZmlsdGVyKGZ1bmN0aW9uKHRvdWNoKSB7XG4gICAgICAgIHJldHVybiBoYXNQYXJlbnQodG91Y2gudGFyZ2V0LCB0YXJnZXQpO1xuICAgIH0pO1xuXG4gICAgLy8gY29sbGVjdCB0b3VjaGVzXG4gICAgaWYgKHR5cGUgPT09IElOUFVUX1NUQVJUKSB7XG4gICAgICAgIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRhcmdldFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0YXJnZXRJZHNbdGFyZ2V0VG91Y2hlc1tpXS5pZGVudGlmaWVyXSA9IHRydWU7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBmaWx0ZXIgY2hhbmdlZCB0b3VjaGVzIHRvIG9ubHkgY29udGFpbiB0b3VjaGVzIHRoYXQgZXhpc3QgaW4gdGhlIGNvbGxlY3RlZCB0YXJnZXQgaWRzXG4gICAgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBjaGFuZ2VkVG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHRhcmdldElkc1tjaGFuZ2VkVG91Y2hlc1tpXS5pZGVudGlmaWVyXSkge1xuICAgICAgICAgICAgY2hhbmdlZFRhcmdldFRvdWNoZXMucHVzaChjaGFuZ2VkVG91Y2hlc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjbGVhbnVwIHJlbW92ZWQgdG91Y2hlc1xuICAgICAgICBpZiAodHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgICAgICBkZWxldGUgdGFyZ2V0SWRzW2NoYW5nZWRUb3VjaGVzW2ldLmlkZW50aWZpZXJdO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICBpZiAoIWNoYW5nZWRUYXJnZXRUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgICAgLy8gbWVyZ2UgdGFyZ2V0VG91Y2hlcyB3aXRoIGNoYW5nZWRUYXJnZXRUb3VjaGVzIHNvIGl0IGNvbnRhaW5zIEFMTCB0b3VjaGVzLCBpbmNsdWRpbmcgJ2VuZCcgYW5kICdjYW5jZWwnXG4gICAgICAgIHVuaXF1ZUFycmF5KHRhcmdldFRvdWNoZXMuY29uY2F0KGNoYW5nZWRUYXJnZXRUb3VjaGVzKSwgJ2lkZW50aWZpZXInLCB0cnVlKSxcbiAgICAgICAgY2hhbmdlZFRhcmdldFRvdWNoZXNcbiAgICBdO1xufVxuXG4vKipcbiAqIENvbWJpbmVkIHRvdWNoIGFuZCBtb3VzZSBpbnB1dFxuICpcbiAqIFRvdWNoIGhhcyBhIGhpZ2hlciBwcmlvcml0eSB0aGVuIG1vdXNlLCBhbmQgd2hpbGUgdG91Y2hpbmcgbm8gbW91c2UgZXZlbnRzIGFyZSBhbGxvd2VkLlxuICogVGhpcyBiZWNhdXNlIHRvdWNoIGRldmljZXMgYWxzbyBlbWl0IG1vdXNlIGV2ZW50cyB3aGlsZSBkb2luZyBhIHRvdWNoLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gVG91Y2hNb3VzZUlucHV0KCkge1xuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB2YXIgaGFuZGxlciA9IGJpbmRGbih0aGlzLmhhbmRsZXIsIHRoaXMpO1xuICAgIHRoaXMudG91Y2ggPSBuZXcgVG91Y2hJbnB1dCh0aGlzLm1hbmFnZXIsIGhhbmRsZXIpO1xuICAgIHRoaXMubW91c2UgPSBuZXcgTW91c2VJbnB1dCh0aGlzLm1hbmFnZXIsIGhhbmRsZXIpO1xufVxuXG5pbmhlcml0KFRvdWNoTW91c2VJbnB1dCwgSW5wdXQsIHtcbiAgICAvKipcbiAgICAgKiBoYW5kbGUgbW91c2UgYW5kIHRvdWNoIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7SGFtbWVyfSBtYW5hZ2VyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlucHV0RXZlbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXREYXRhXG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gVE1FaGFuZGxlcihtYW5hZ2VyLCBpbnB1dEV2ZW50LCBpbnB1dERhdGEpIHtcbiAgICAgICAgdmFyIGlzVG91Y2ggPSAoaW5wdXREYXRhLnBvaW50ZXJUeXBlID09IElOUFVUX1RZUEVfVE9VQ0gpLFxuICAgICAgICAgICAgaXNNb3VzZSA9IChpbnB1dERhdGEucG9pbnRlclR5cGUgPT0gSU5QVVRfVFlQRV9NT1VTRSk7XG5cbiAgICAgICAgLy8gd2hlbiB3ZSdyZSBpbiBhIHRvdWNoIGV2ZW50LCBzbyAgYmxvY2sgYWxsIHVwY29taW5nIG1vdXNlIGV2ZW50c1xuICAgICAgICAvLyBtb3N0IG1vYmlsZSBicm93c2VyIGFsc28gZW1pdCBtb3VzZWV2ZW50cywgcmlnaHQgYWZ0ZXIgdG91Y2hzdGFydFxuICAgICAgICBpZiAoaXNUb3VjaCkge1xuICAgICAgICAgICAgdGhpcy5tb3VzZS5hbGxvdyA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTW91c2UgJiYgIXRoaXMubW91c2UuYWxsb3cpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlc2V0IHRoZSBhbGxvd01vdXNlIHdoZW4gd2UncmUgZG9uZVxuICAgICAgICBpZiAoaW5wdXRFdmVudCAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlLmFsbG93ID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sobWFuYWdlciwgaW5wdXRFdmVudCwgaW5wdXREYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmVtb3ZlIHRoZSBldmVudCBsaXN0ZW5lcnNcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgICAgICB0aGlzLnRvdWNoLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5tb3VzZS5kZXN0cm95KCk7XG4gICAgfVxufSk7XG5cbnZhciBQUkVGSVhFRF9UT1VDSF9BQ1RJT04gPSBwcmVmaXhlZChURVNUX0VMRU1FTlQuc3R5bGUsICd0b3VjaEFjdGlvbicpO1xudmFyIE5BVElWRV9UT1VDSF9BQ1RJT04gPSBQUkVGSVhFRF9UT1VDSF9BQ1RJT04gIT09IHVuZGVmaW5lZDtcblxuLy8gbWFnaWNhbCB0b3VjaEFjdGlvbiB2YWx1ZVxudmFyIFRPVUNIX0FDVElPTl9DT01QVVRFID0gJ2NvbXB1dGUnO1xudmFyIFRPVUNIX0FDVElPTl9BVVRPID0gJ2F1dG8nO1xudmFyIFRPVUNIX0FDVElPTl9NQU5JUFVMQVRJT04gPSAnbWFuaXB1bGF0aW9uJzsgLy8gbm90IGltcGxlbWVudGVkXG52YXIgVE9VQ0hfQUNUSU9OX05PTkUgPSAnbm9uZSc7XG52YXIgVE9VQ0hfQUNUSU9OX1BBTl9YID0gJ3Bhbi14JztcbnZhciBUT1VDSF9BQ1RJT05fUEFOX1kgPSAncGFuLXknO1xuXG4vKipcbiAqIFRvdWNoIEFjdGlvblxuICogc2V0cyB0aGUgdG91Y2hBY3Rpb24gcHJvcGVydHkgb3IgdXNlcyB0aGUganMgYWx0ZXJuYXRpdmVcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVG91Y2hBY3Rpb24obWFuYWdlciwgdmFsdWUpIHtcbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuc2V0KHZhbHVlKTtcbn1cblxuVG91Y2hBY3Rpb24ucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNldCB0aGUgdG91Y2hBY3Rpb24gdmFsdWUgb24gdGhlIGVsZW1lbnQgb3IgZW5hYmxlIHRoZSBwb2x5ZmlsbFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgLy8gZmluZCBvdXQgdGhlIHRvdWNoLWFjdGlvbiBieSB0aGUgZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgaWYgKHZhbHVlID09IFRPVUNIX0FDVElPTl9DT01QVVRFKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMuY29tcHV0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE5BVElWRV9UT1VDSF9BQ1RJT04gJiYgdGhpcy5tYW5hZ2VyLmVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbGVtZW50LnN0eWxlW1BSRUZJWEVEX1RPVUNIX0FDVElPTl0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFjdGlvbnMgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICoganVzdCByZS1zZXQgdGhlIHRvdWNoQWN0aW9uIHZhbHVlXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXQodGhpcy5tYW5hZ2VyLm9wdGlvbnMudG91Y2hBY3Rpb24pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjb21wdXRlIHRoZSB2YWx1ZSBmb3IgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5IGJhc2VkIG9uIHRoZSByZWNvZ25pemVyJ3Mgc2V0dGluZ3NcbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIGNvbXB1dGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYWN0aW9ucyA9IFtdO1xuICAgICAgICBlYWNoKHRoaXMubWFuYWdlci5yZWNvZ25pemVycywgZnVuY3Rpb24ocmVjb2duaXplcikge1xuICAgICAgICAgICAgaWYgKGJvb2xPckZuKHJlY29nbml6ZXIub3B0aW9ucy5lbmFibGUsIFtyZWNvZ25pemVyXSkpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zID0gYWN0aW9ucy5jb25jYXQocmVjb2duaXplci5nZXRUb3VjaEFjdGlvbigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjbGVhblRvdWNoQWN0aW9ucyhhY3Rpb25zLmpvaW4oJyAnKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHRoaXMgbWV0aG9kIGlzIGNhbGxlZCBvbiBlYWNoIGlucHV0IGN5Y2xlIGFuZCBwcm92aWRlcyB0aGUgcHJldmVudGluZyBvZiB0aGUgYnJvd3NlciBiZWhhdmlvclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqL1xuICAgIHByZXZlbnREZWZhdWx0czogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgLy8gbm90IG5lZWRlZCB3aXRoIG5hdGl2ZSBzdXBwb3J0IGZvciB0aGUgdG91Y2hBY3Rpb24gcHJvcGVydHlcbiAgICAgICAgaWYgKE5BVElWRV9UT1VDSF9BQ1RJT04pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzcmNFdmVudCA9IGlucHV0LnNyY0V2ZW50O1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gaW5wdXQub2Zmc2V0RGlyZWN0aW9uO1xuXG4gICAgICAgIC8vIGlmIHRoZSB0b3VjaCBhY3Rpb24gZGlkIHByZXZlbnRlZCBvbmNlIHRoaXMgc2Vzc2lvblxuICAgICAgICBpZiAodGhpcy5tYW5hZ2VyLnNlc3Npb24ucHJldmVudGVkKSB7XG4gICAgICAgICAgICBzcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XG4gICAgICAgIHZhciBoYXNOb25lID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX05PTkUpO1xuICAgICAgICB2YXIgaGFzUGFuWSA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWSk7XG4gICAgICAgIHZhciBoYXNQYW5YID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9YKTtcblxuICAgICAgICBpZiAoaGFzTm9uZSkge1xuICAgICAgICAgICAgLy9kbyBub3QgcHJldmVudCBkZWZhdWx0cyBpZiB0aGlzIGlzIGEgdGFwIGdlc3R1cmVcblxuICAgICAgICAgICAgdmFyIGlzVGFwUG9pbnRlciA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gMTtcbiAgICAgICAgICAgIHZhciBpc1RhcE1vdmVtZW50ID0gaW5wdXQuZGlzdGFuY2UgPCAyO1xuICAgICAgICAgICAgdmFyIGlzVGFwVG91Y2hUaW1lID0gaW5wdXQuZGVsdGFUaW1lIDwgMjUwO1xuXG4gICAgICAgICAgICBpZiAoaXNUYXBQb2ludGVyICYmIGlzVGFwTW92ZW1lbnQgJiYgaXNUYXBUb3VjaFRpbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFzUGFuWCAmJiBoYXNQYW5ZKSB7XG4gICAgICAgICAgICAvLyBgcGFuLXggcGFuLXlgIG1lYW5zIGJyb3dzZXIgaGFuZGxlcyBhbGwgc2Nyb2xsaW5nL3Bhbm5pbmcsIGRvIG5vdCBwcmV2ZW50XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFzTm9uZSB8fFxuICAgICAgICAgICAgKGhhc1BhblkgJiYgZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHx8XG4gICAgICAgICAgICAoaGFzUGFuWCAmJiBkaXJlY3Rpb24gJiBESVJFQ1RJT05fVkVSVElDQUwpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcmV2ZW50U3JjKHNyY0V2ZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxsIHByZXZlbnREZWZhdWx0IHRvIHByZXZlbnQgdGhlIGJyb3dzZXIncyBkZWZhdWx0IGJlaGF2aW9yIChzY3JvbGxpbmcgaW4gbW9zdCBjYXNlcylcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3JjRXZlbnRcbiAgICAgKi9cbiAgICBwcmV2ZW50U3JjOiBmdW5jdGlvbihzcmNFdmVudCkge1xuICAgICAgICB0aGlzLm1hbmFnZXIuc2Vzc2lvbi5wcmV2ZW50ZWQgPSB0cnVlO1xuICAgICAgICBzcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogd2hlbiB0aGUgdG91Y2hBY3Rpb25zIGFyZSBjb2xsZWN0ZWQgdGhleSBhcmUgbm90IGEgdmFsaWQgdmFsdWUsIHNvIHdlIG5lZWQgdG8gY2xlYW4gdGhpbmdzIHVwLiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gYWN0aW9uc1xuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGNsZWFuVG91Y2hBY3Rpb25zKGFjdGlvbnMpIHtcbiAgICAvLyBub25lXG4gICAgaWYgKGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9OT05FKSkge1xuICAgICAgICByZXR1cm4gVE9VQ0hfQUNUSU9OX05PTkU7XG4gICAgfVxuXG4gICAgdmFyIGhhc1BhblggPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1gpO1xuICAgIHZhciBoYXNQYW5ZID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9ZKTtcblxuICAgIC8vIGlmIGJvdGggcGFuLXggYW5kIHBhbi15IGFyZSBzZXQgKGRpZmZlcmVudCByZWNvZ25pemVyc1xuICAgIC8vIGZvciBkaWZmZXJlbnQgZGlyZWN0aW9ucywgZS5nLiBob3Jpem9udGFsIHBhbiBidXQgdmVydGljYWwgc3dpcGU/KVxuICAgIC8vIHdlIG5lZWQgbm9uZSAoYXMgb3RoZXJ3aXNlIHdpdGggcGFuLXggcGFuLXkgY29tYmluZWQgbm9uZSBvZiB0aGVzZVxuICAgIC8vIHJlY29nbml6ZXJzIHdpbGwgd29yaywgc2luY2UgdGhlIGJyb3dzZXIgd291bGQgaGFuZGxlIGFsbCBwYW5uaW5nXG4gICAgaWYgKGhhc1BhblggJiYgaGFzUGFuWSkge1xuICAgICAgICByZXR1cm4gVE9VQ0hfQUNUSU9OX05PTkU7XG4gICAgfVxuXG4gICAgLy8gcGFuLXggT1IgcGFuLXlcbiAgICBpZiAoaGFzUGFuWCB8fCBoYXNQYW5ZKSB7XG4gICAgICAgIHJldHVybiBoYXNQYW5YID8gVE9VQ0hfQUNUSU9OX1BBTl9YIDogVE9VQ0hfQUNUSU9OX1BBTl9ZO1xuICAgIH1cblxuICAgIC8vIG1hbmlwdWxhdGlvblxuICAgIGlmIChpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OKSkge1xuICAgICAgICByZXR1cm4gVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTjtcbiAgICB9XG5cbiAgICByZXR1cm4gVE9VQ0hfQUNUSU9OX0FVVE87XG59XG5cbi8qKlxuICogUmVjb2duaXplciBmbG93IGV4cGxhaW5lZDsgKlxuICogQWxsIHJlY29nbml6ZXJzIGhhdmUgdGhlIGluaXRpYWwgc3RhdGUgb2YgUE9TU0lCTEUgd2hlbiBhIGlucHV0IHNlc3Npb24gc3RhcnRzLlxuICogVGhlIGRlZmluaXRpb24gb2YgYSBpbnB1dCBzZXNzaW9uIGlzIGZyb20gdGhlIGZpcnN0IGlucHV0IHVudGlsIHRoZSBsYXN0IGlucHV0LCB3aXRoIGFsbCBpdCdzIG1vdmVtZW50IGluIGl0LiAqXG4gKiBFeGFtcGxlIHNlc3Npb24gZm9yIG1vdXNlLWlucHV0OiBtb3VzZWRvd24gLT4gbW91c2Vtb3ZlIC0+IG1vdXNldXBcbiAqXG4gKiBPbiBlYWNoIHJlY29nbml6aW5nIGN5Y2xlIChzZWUgTWFuYWdlci5yZWNvZ25pemUpIHRoZSAucmVjb2duaXplKCkgbWV0aG9kIGlzIGV4ZWN1dGVkXG4gKiB3aGljaCBkZXRlcm1pbmVzIHdpdGggc3RhdGUgaXQgc2hvdWxkIGJlLlxuICpcbiAqIElmIHRoZSByZWNvZ25pemVyIGhhcyB0aGUgc3RhdGUgRkFJTEVELCBDQU5DRUxMRUQgb3IgUkVDT0dOSVpFRCAoZXF1YWxzIEVOREVEKSwgaXQgaXMgcmVzZXQgdG9cbiAqIFBPU1NJQkxFIHRvIGdpdmUgaXQgYW5vdGhlciBjaGFuZ2Ugb24gdGhlIG5leHQgY3ljbGUuXG4gKlxuICogICAgICAgICAgICAgICBQb3NzaWJsZVxuICogICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICstLS0tLSstLS0tLS0tLS0tLS0tLS0rXG4gKiAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICstLS0tLSstLS0tLSsgICAgICAgICAgICAgICB8XG4gKiAgICAgIHwgICAgICAgICAgIHwgICAgICAgICAgICAgICB8XG4gKiAgIEZhaWxlZCAgICAgIENhbmNlbGxlZCAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgKy0tLS0tLS0rLS0tLS0tK1xuICogICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgIFJlY29nbml6ZWQgICAgICAgQmVnYW5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2hhbmdlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVuZGVkL1JlY29nbml6ZWRcbiAqL1xudmFyIFNUQVRFX1BPU1NJQkxFID0gMTtcbnZhciBTVEFURV9CRUdBTiA9IDI7XG52YXIgU1RBVEVfQ0hBTkdFRCA9IDQ7XG52YXIgU1RBVEVfRU5ERUQgPSA4O1xudmFyIFNUQVRFX1JFQ09HTklaRUQgPSBTVEFURV9FTkRFRDtcbnZhciBTVEFURV9DQU5DRUxMRUQgPSAxNjtcbnZhciBTVEFURV9GQUlMRUQgPSAzMjtcblxuLyoqXG4gKiBSZWNvZ25pemVyXG4gKiBFdmVyeSByZWNvZ25pemVyIG5lZWRzIHRvIGV4dGVuZCBmcm9tIHRoaXMgY2xhc3MuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIFJlY29nbml6ZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgdGhpcy5kZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICB0aGlzLmlkID0gdW5pcXVlSWQoKTtcblxuICAgIHRoaXMubWFuYWdlciA9IG51bGw7XG5cbiAgICAvLyBkZWZhdWx0IGlzIGVuYWJsZSB0cnVlXG4gICAgdGhpcy5vcHRpb25zLmVuYWJsZSA9IGlmVW5kZWZpbmVkKHRoaXMub3B0aW9ucy5lbmFibGUsIHRydWUpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1BPU1NJQkxFO1xuXG4gICAgdGhpcy5zaW11bHRhbmVvdXMgPSB7fTtcbiAgICB0aGlzLnJlcXVpcmVGYWlsID0gW107XG59XG5cblJlY29nbml6ZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIEB2aXJ0dWFsXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBkZWZhdWx0czoge30sXG5cbiAgICAvKipcbiAgICAgKiBzZXQgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICogQHJldHVybiB7UmVjb2duaXplcn1cbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gYWxzbyB1cGRhdGUgdGhlIHRvdWNoQWN0aW9uLCBpbiBjYXNlIHNvbWV0aGluZyBjaGFuZ2VkIGFib3V0IHRoZSBkaXJlY3Rpb25zL2VuYWJsZWQgc3RhdGVcbiAgICAgICAgdGhpcy5tYW5hZ2VyICYmIHRoaXMubWFuYWdlci50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlY29nbml6ZSBzaW11bHRhbmVvdXMgd2l0aCBhbiBvdGhlciByZWNvZ25pemVyLlxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICByZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ3JlY29nbml6ZVdpdGgnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2ltdWx0YW5lb3VzID0gdGhpcy5zaW11bHRhbmVvdXM7XG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgaWYgKCFzaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXSkge1xuICAgICAgICAgICAgc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF0gPSBvdGhlclJlY29nbml6ZXI7XG4gICAgICAgICAgICBvdGhlclJlY29nbml6ZXIucmVjb2duaXplV2l0aCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZHJvcCB0aGUgc2ltdWx0YW5lb3VzIGxpbmsuIGl0IGRvZXNudCByZW1vdmUgdGhlIGxpbmsgb24gdGhlIG90aGVyIHJlY29nbml6ZXIuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIGRyb3BSZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ2Ryb3BSZWNvZ25pemVXaXRoJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICBkZWxldGUgdGhpcy5zaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlY29nbml6ZXIgY2FuIG9ubHkgcnVuIHdoZW4gYW4gb3RoZXIgaXMgZmFpbGluZ1xuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICByZXF1aXJlRmFpbHVyZTogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdyZXF1aXJlRmFpbHVyZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1aXJlRmFpbCA9IHRoaXMucmVxdWlyZUZhaWw7XG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgaWYgKGluQXJyYXkocmVxdWlyZUZhaWwsIG90aGVyUmVjb2duaXplcikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXF1aXJlRmFpbC5wdXNoKG90aGVyUmVjb2duaXplcik7XG4gICAgICAgICAgICBvdGhlclJlY29nbml6ZXIucmVxdWlyZUZhaWx1cmUodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRyb3AgdGhlIHJlcXVpcmVGYWlsdXJlIGxpbmsuIGl0IGRvZXMgbm90IHJlbW92ZSB0aGUgbGluayBvbiB0aGUgb3RoZXIgcmVjb2duaXplci5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgZHJvcFJlcXVpcmVGYWlsdXJlOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ2Ryb3BSZXF1aXJlRmFpbHVyZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgdmFyIGluZGV4ID0gaW5BcnJheSh0aGlzLnJlcXVpcmVGYWlsLCBvdGhlclJlY29nbml6ZXIpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5yZXF1aXJlRmFpbC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBoYXMgcmVxdWlyZSBmYWlsdXJlcyBib29sZWFuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaGFzUmVxdWlyZUZhaWx1cmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVxdWlyZUZhaWwubGVuZ3RoID4gMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogaWYgdGhlIHJlY29nbml6ZXIgY2FuIHJlY29nbml6ZSBzaW11bHRhbmVvdXMgd2l0aCBhbiBvdGhlciByZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5SZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5zaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogWW91IHNob3VsZCB1c2UgYHRyeUVtaXRgIGluc3RlYWQgb2YgYGVtaXRgIGRpcmVjdGx5IHRvIGNoZWNrXG4gICAgICogdGhhdCBhbGwgdGhlIG5lZWRlZCByZWNvZ25pemVycyBoYXMgZmFpbGVkIGJlZm9yZSBlbWl0dGluZy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cbiAgICAgICAgZnVuY3Rpb24gZW1pdChldmVudCkge1xuICAgICAgICAgICAgc2VsZi5tYW5hZ2VyLmVtaXQoZXZlbnQsIGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vICdwYW5zdGFydCcgYW5kICdwYW5tb3ZlJ1xuICAgICAgICBpZiAoc3RhdGUgPCBTVEFURV9FTkRFRCkge1xuICAgICAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQgKyBzdGF0ZVN0cihzdGF0ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQpOyAvLyBzaW1wbGUgJ2V2ZW50TmFtZScgZXZlbnRzXG5cbiAgICAgICAgaWYgKGlucHV0LmFkZGl0aW9uYWxFdmVudCkgeyAvLyBhZGRpdGlvbmFsIGV2ZW50KHBhbmxlZnQsIHBhbnJpZ2h0LCBwaW5jaGluLCBwaW5jaG91dC4uLilcbiAgICAgICAgICAgIGVtaXQoaW5wdXQuYWRkaXRpb25hbEV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBhbmVuZCBhbmQgcGFuY2FuY2VsXG4gICAgICAgIGlmIChzdGF0ZSA+PSBTVEFURV9FTkRFRCkge1xuICAgICAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQgKyBzdGF0ZVN0cihzdGF0ZSkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoYXQgYWxsIHRoZSByZXF1aXJlIGZhaWx1cmUgcmVjb2duaXplcnMgaGFzIGZhaWxlZCxcbiAgICAgKiBpZiB0cnVlLCBpdCBlbWl0cyBhIGdlc3R1cmUgZXZlbnQsXG4gICAgICogb3RoZXJ3aXNlLCBzZXR1cCB0aGUgc3RhdGUgdG8gRkFJTEVELlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqL1xuICAgIHRyeUVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmICh0aGlzLmNhbkVtaXQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW1pdChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaXQncyBmYWlsaW5nIGFueXdheVxuICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYW4gd2UgZW1pdD9cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5FbWl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMucmVxdWlyZUZhaWwubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoISh0aGlzLnJlcXVpcmVGYWlsW2ldLnN0YXRlICYgKFNUQVRFX0ZBSUxFRCB8IFNUQVRFX1BPU1NJQkxFKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVwZGF0ZSB0aGUgcmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICByZWNvZ25pemU6IGZ1bmN0aW9uKGlucHV0RGF0YSkge1xuICAgICAgICAvLyBtYWtlIGEgbmV3IGNvcHkgb2YgdGhlIGlucHV0RGF0YVxuICAgICAgICAvLyBzbyB3ZSBjYW4gY2hhbmdlIHRoZSBpbnB1dERhdGEgd2l0aG91dCBtZXNzaW5nIHVwIHRoZSBvdGhlciByZWNvZ25pemVyc1xuICAgICAgICB2YXIgaW5wdXREYXRhQ2xvbmUgPSBhc3NpZ24oe30sIGlucHV0RGF0YSk7XG5cbiAgICAgICAgLy8gaXMgaXMgZW5hYmxlZCBhbmQgYWxsb3cgcmVjb2duaXppbmc/XG4gICAgICAgIGlmICghYm9vbE9yRm4odGhpcy5vcHRpb25zLmVuYWJsZSwgW3RoaXMsIGlucHV0RGF0YUNsb25lXSkpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9GQUlMRUQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB3aGVuIHdlJ3ZlIHJlYWNoZWQgdGhlIGVuZFxuICAgICAgICBpZiAodGhpcy5zdGF0ZSAmIChTVEFURV9SRUNPR05JWkVEIHwgU1RBVEVfQ0FOQ0VMTEVEIHwgU1RBVEVfRkFJTEVEKSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1BPU1NJQkxFO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMucHJvY2VzcyhpbnB1dERhdGFDbG9uZSk7XG5cbiAgICAgICAgLy8gdGhlIHJlY29nbml6ZXIgaGFzIHJlY29nbml6ZWQgYSBnZXN0dXJlXG4gICAgICAgIC8vIHNvIHRyaWdnZXIgYW4gZXZlbnRcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgJiAoU1RBVEVfQkVHQU4gfCBTVEFURV9DSEFOR0VEIHwgU1RBVEVfRU5ERUQgfCBTVEFURV9DQU5DRUxMRUQpKSB7XG4gICAgICAgICAgICB0aGlzLnRyeUVtaXQoaW5wdXREYXRhQ2xvbmUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJldHVybiB0aGUgc3RhdGUgb2YgdGhlIHJlY29nbml6ZXJcbiAgICAgKiB0aGUgYWN0dWFsIHJlY29nbml6aW5nIGhhcHBlbnMgaW4gdGhpcyBtZXRob2RcbiAgICAgKiBAdmlydHVhbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKiBAcmV0dXJucyB7Q29uc3R9IFNUQVRFXG4gICAgICovXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXREYXRhKSB7IH0sIC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG4gICAgLyoqXG4gICAgICogcmV0dXJuIHRoZSBwcmVmZXJyZWQgdG91Y2gtYWN0aW9uXG4gICAgICogQHZpcnR1YWxcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICovXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkgeyB9LFxuXG4gICAgLyoqXG4gICAgICogY2FsbGVkIHdoZW4gdGhlIGdlc3R1cmUgaXNuJ3QgYWxsb3dlZCB0byByZWNvZ25pemVcbiAgICAgKiBsaWtlIHdoZW4gYW5vdGhlciBpcyBiZWluZyByZWNvZ25pemVkIG9yIGl0IGlzIGRpc2FibGVkXG4gICAgICogQHZpcnR1YWxcbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24oKSB7IH1cbn07XG5cbi8qKlxuICogZ2V0IGEgdXNhYmxlIHN0cmluZywgdXNlZCBhcyBldmVudCBwb3N0Zml4XG4gKiBAcGFyYW0ge0NvbnN0fSBzdGF0ZVxuICogQHJldHVybnMge1N0cmluZ30gc3RhdGVcbiAqL1xuZnVuY3Rpb24gc3RhdGVTdHIoc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUgJiBTVEFURV9DQU5DRUxMRUQpIHtcbiAgICAgICAgcmV0dXJuICdjYW5jZWwnO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUgJiBTVEFURV9FTkRFRCkge1xuICAgICAgICByZXR1cm4gJ2VuZCc7XG4gICAgfSBlbHNlIGlmIChzdGF0ZSAmIFNUQVRFX0NIQU5HRUQpIHtcbiAgICAgICAgcmV0dXJuICdtb3ZlJztcbiAgICB9IGVsc2UgaWYgKHN0YXRlICYgU1RBVEVfQkVHQU4pIHtcbiAgICAgICAgcmV0dXJuICdzdGFydCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBkaXJlY3Rpb24gY29ucyB0byBzdHJpbmdcbiAqIEBwYXJhbSB7Q29uc3R9IGRpcmVjdGlvblxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZGlyZWN0aW9uU3RyKGRpcmVjdGlvbikge1xuICAgIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX0RPV04pIHtcbiAgICAgICAgcmV0dXJuICdkb3duJztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fVVApIHtcbiAgICAgICAgcmV0dXJuICd1cCc7XG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX0xFRlQpIHtcbiAgICAgICAgcmV0dXJuICdsZWZ0JztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fUklHSFQpIHtcbiAgICAgICAgcmV0dXJuICdyaWdodCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBnZXQgYSByZWNvZ25pemVyIGJ5IG5hbWUgaWYgaXQgaXMgYm91bmQgdG8gYSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSBvdGhlclJlY29nbml6ZXJcbiAqIEBwYXJhbSB7UmVjb2duaXplcn0gcmVjb2duaXplclxuICogQHJldHVybnMge1JlY29nbml6ZXJ9XG4gKi9cbmZ1bmN0aW9uIGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCByZWNvZ25pemVyKSB7XG4gICAgdmFyIG1hbmFnZXIgPSByZWNvZ25pemVyLm1hbmFnZXI7XG4gICAgaWYgKG1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuIG1hbmFnZXIuZ2V0KG90aGVyUmVjb2duaXplcik7XG4gICAgfVxuICAgIHJldHVybiBvdGhlclJlY29nbml6ZXI7XG59XG5cbi8qKlxuICogVGhpcyByZWNvZ25pemVyIGlzIGp1c3QgdXNlZCBhcyBhIGJhc2UgZm9yIHRoZSBzaW1wbGUgYXR0cmlidXRlIHJlY29nbml6ZXJzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIEF0dHJSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChBdHRyUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgQXR0clJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMVxuICAgICAgICAgKi9cbiAgICAgICAgcG9pbnRlcnM6IDFcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byBjaGVjayBpZiBpdCB0aGUgcmVjb2duaXplciByZWNlaXZlcyB2YWxpZCBpbnB1dCwgbGlrZSBpbnB1dC5kaXN0YW5jZSA+IDEwLlxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSByZWNvZ25pemVkXG4gICAgICovXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25Qb2ludGVycyA9IHRoaXMub3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgcmV0dXJuIG9wdGlvblBvaW50ZXJzID09PSAwIHx8IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9uUG9pbnRlcnM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByb2Nlc3MgdGhlIGlucHV0IGFuZCByZXR1cm4gdGhlIHN0YXRlIGZvciB0aGUgcmVjb2duaXplclxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqIEByZXR1cm5zIHsqfSBTdGF0ZVxuICAgICAqL1xuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBpbnB1dC5ldmVudFR5cGU7XG5cbiAgICAgICAgdmFyIGlzUmVjb2duaXplZCA9IHN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCk7XG4gICAgICAgIHZhciBpc1ZhbGlkID0gdGhpcy5hdHRyVGVzdChpbnB1dCk7XG5cbiAgICAgICAgLy8gb24gY2FuY2VsIGlucHV0IGFuZCB3ZSd2ZSByZWNvZ25pemVkIGJlZm9yZSwgcmV0dXJuIFNUQVRFX0NBTkNFTExFRFxuICAgICAgICBpZiAoaXNSZWNvZ25pemVkICYmIChldmVudFR5cGUgJiBJTlBVVF9DQU5DRUwgfHwgIWlzVmFsaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9DQU5DRUxMRUQ7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNSZWNvZ25pemVkIHx8IGlzVmFsaWQpIHtcbiAgICAgICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9FTkRFRDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIShzdGF0ZSAmIFNUQVRFX0JFR0FOKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9CRUdBTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdGF0ZSB8IFNUQVRFX0NIQU5HRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBQYW5cbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb3duIGFuZCBtb3ZlZCBpbiB0aGUgYWxsb3dlZCBkaXJlY3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFBhblJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMucFggPSBudWxsO1xuICAgIHRoaXMucFkgPSBudWxsO1xufVxuXG5pbmhlcml0KFBhblJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQYW5SZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwYW4nLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICBwb2ludGVyczogMSxcbiAgICAgICAgZGlyZWN0aW9uOiBESVJFQ1RJT05fQUxMXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5kaXJlY3Rpb247XG4gICAgICAgIHZhciBhY3Rpb25zID0gW107XG4gICAgICAgIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFRPVUNIX0FDVElPTl9QQU5fWSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFRPVUNIX0FDVElPTl9QQU5fWCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjdGlvbnM7XG4gICAgfSxcblxuICAgIGRpcmVjdGlvblRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICB2YXIgaGFzTW92ZWQgPSB0cnVlO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBpbnB1dC5kaXN0YW5jZTtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGlucHV0LmRpcmVjdGlvbjtcbiAgICAgICAgdmFyIHggPSBpbnB1dC5kZWx0YVg7XG4gICAgICAgIHZhciB5ID0gaW5wdXQuZGVsdGFZO1xuXG4gICAgICAgIC8vIGxvY2sgdG8gYXhpcz9cbiAgICAgICAgaWYgKCEoZGlyZWN0aW9uICYgb3B0aW9ucy5kaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5kaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9ICh4ID09PSAwKSA/IERJUkVDVElPTl9OT05FIDogKHggPCAwKSA/IERJUkVDVElPTl9MRUZUIDogRElSRUNUSU9OX1JJR0hUO1xuICAgICAgICAgICAgICAgIGhhc01vdmVkID0geCAhPSB0aGlzLnBYO1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gTWF0aC5hYnMoaW5wdXQuZGVsdGFYKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gKHkgPT09IDApID8gRElSRUNUSU9OX05PTkUgOiAoeSA8IDApID8gRElSRUNUSU9OX1VQIDogRElSRUNUSU9OX0RPV047XG4gICAgICAgICAgICAgICAgaGFzTW92ZWQgPSB5ICE9IHRoaXMucFk7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgPSBNYXRoLmFicyhpbnB1dC5kZWx0YVkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlucHV0LmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgcmV0dXJuIGhhc01vdmVkICYmIGRpc3RhbmNlID4gb3B0aW9ucy50aHJlc2hvbGQgJiYgZGlyZWN0aW9uICYgb3B0aW9ucy5kaXJlY3Rpb247XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gQXR0clJlY29nbml6ZXIucHJvdG90eXBlLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICAodGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOIHx8ICghKHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTikgJiYgdGhpcy5kaXJlY3Rpb25UZXN0KGlucHV0KSkpO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuXG4gICAgICAgIHRoaXMucFggPSBpbnB1dC5kZWx0YVg7XG4gICAgICAgIHRoaXMucFkgPSBpbnB1dC5kZWx0YVk7XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGRpcmVjdGlvblN0cihpbnB1dC5kaXJlY3Rpb24pO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGlucHV0LmFkZGl0aW9uYWxFdmVudCA9IHRoaXMub3B0aW9ucy5ldmVudCArIGRpcmVjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdXBlci5lbWl0LmNhbGwodGhpcywgaW5wdXQpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFBpbmNoXG4gKiBSZWNvZ25pemVkIHdoZW4gdHdvIG9yIG1vcmUgcG9pbnRlcnMgYXJlIG1vdmluZyB0b3dhcmQgKHpvb20taW4pIG9yIGF3YXkgZnJvbSBlYWNoIG90aGVyICh6b29tLW91dCkuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFBpbmNoUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFBpbmNoUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBpbmNoUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncGluY2gnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgICAgIHBvaW50ZXJzOiAyXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTk9ORV07XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIChNYXRoLmFicyhpbnB1dC5zY2FsZSAtIDEpID4gdGhpcy5vcHRpb25zLnRocmVzaG9sZCB8fCB0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4pO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQuc2NhbGUgIT09IDEpIHtcbiAgICAgICAgICAgIHZhciBpbk91dCA9IGlucHV0LnNjYWxlIDwgMSA/ICdpbicgOiAnb3V0JztcbiAgICAgICAgICAgIGlucHV0LmFkZGl0aW9uYWxFdmVudCA9IHRoaXMub3B0aW9ucy5ldmVudCArIGluT3V0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N1cGVyLmVtaXQuY2FsbCh0aGlzLCBpbnB1dCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogUHJlc3NcbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb3duIGZvciB4IG1zIHdpdGhvdXQgYW55IG1vdmVtZW50LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFByZXNzUmVjb2duaXplcigpIHtcbiAgICBSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xufVxuXG5pbmhlcml0KFByZXNzUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUHJlc3NSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwcmVzcycsXG4gICAgICAgIHBvaW50ZXJzOiAxLFxuICAgICAgICB0aW1lOiAyNTEsIC8vIG1pbmltYWwgdGltZSBvZiB0aGUgcG9pbnRlciB0byBiZSBwcmVzc2VkXG4gICAgICAgIHRocmVzaG9sZDogOSAvLyBhIG1pbmltYWwgbW92ZW1lbnQgaXMgb2ssIGJ1dCBrZWVwIGl0IGxvd1xuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX0FVVE9dO1xuICAgIH0sXG5cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgdmFyIHZhbGlkUG9pbnRlcnMgPSBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IG9wdGlvbnMucG9pbnRlcnM7XG4gICAgICAgIHZhciB2YWxpZE1vdmVtZW50ID0gaW5wdXQuZGlzdGFuY2UgPCBvcHRpb25zLnRocmVzaG9sZDtcbiAgICAgICAgdmFyIHZhbGlkVGltZSA9IGlucHV0LmRlbHRhVGltZSA+IG9wdGlvbnMudGltZTtcblxuICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuXG4gICAgICAgIC8vIHdlIG9ubHkgYWxsb3cgbGl0dGxlIG1vdmVtZW50XG4gICAgICAgIC8vIGFuZCB3ZSd2ZSByZWFjaGVkIGFuIGVuZCBldmVudCwgc28gYSB0YXAgaXMgcG9zc2libGVcbiAgICAgICAgaWYgKCF2YWxpZE1vdmVtZW50IHx8ICF2YWxpZFBvaW50ZXJzIHx8IChpbnB1dC5ldmVudFR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSAmJiAhdmFsaWRUaW1lKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX1NUQVJUKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXRDb250ZXh0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgIHRoaXMudHJ5RW1pdCgpO1xuICAgICAgICAgICAgfSwgb3B0aW9ucy50aW1lLCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgIHJldHVybiBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFNUQVRFX1JFQ09HTklaRUQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbnB1dCAmJiAoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfRU5EKSkge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50ICsgJ3VwJywgaW5wdXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faW5wdXQudGltZVN0YW1wID0gbm93KCk7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIHRoaXMuX2lucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFJvdGF0ZVxuICogUmVjb2duaXplZCB3aGVuIHR3byBvciBtb3JlIHBvaW50ZXIgYXJlIG1vdmluZyBpbiBhIGNpcmN1bGFyIG1vdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUm90YXRlUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFJvdGF0ZVJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBSb3RhdGVSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdyb3RhdGUnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgICAgIHBvaW50ZXJzOiAyXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTk9ORV07XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIChNYXRoLmFicyhpbnB1dC5yb3RhdGlvbikgPiB0aGlzLm9wdGlvbnMudGhyZXNob2xkIHx8IHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTik7XG4gICAgfVxufSk7XG5cbi8qKlxuICogU3dpcGVcbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgZmFzdCAodmVsb2NpdHkpLCB3aXRoIGVub3VnaCBkaXN0YW5jZSBpbiB0aGUgYWxsb3dlZCBkaXJlY3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFN3aXBlUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFN3aXBlUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFN3aXBlUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAnc3dpcGUnLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICB2ZWxvY2l0eTogMC4zLFxuICAgICAgICBkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMLFxuICAgICAgICBwb2ludGVyczogMVxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBQYW5SZWNvZ25pemVyLnByb3RvdHlwZS5nZXRUb3VjaEFjdGlvbi5jYWxsKHRoaXMpO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5kaXJlY3Rpb247XG4gICAgICAgIHZhciB2ZWxvY2l0eTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uICYgKERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMKSkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBpbnB1dC5vdmVyYWxsVmVsb2NpdHk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5WDtcbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fVkVSVElDQUwpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5WTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBlci5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgZGlyZWN0aW9uICYgaW5wdXQub2Zmc2V0RGlyZWN0aW9uICYmXG4gICAgICAgICAgICBpbnB1dC5kaXN0YW5jZSA+IHRoaXMub3B0aW9ucy50aHJlc2hvbGQgJiZcbiAgICAgICAgICAgIGlucHV0Lm1heFBvaW50ZXJzID09IHRoaXMub3B0aW9ucy5wb2ludGVycyAmJlxuICAgICAgICAgICAgYWJzKHZlbG9jaXR5KSA+IHRoaXMub3B0aW9ucy52ZWxvY2l0eSAmJiBpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQ7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBkaXJlY3Rpb25TdHIoaW5wdXQub2Zmc2V0RGlyZWN0aW9uKTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50ICsgZGlyZWN0aW9uLCBpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIGlucHV0KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBBIHRhcCBpcyBlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb2luZyBhIHNtYWxsIHRhcC9jbGljay4gTXVsdGlwbGUgdGFwcyBhcmUgcmVjb2duaXplZCBpZiB0aGV5IG9jY3VyXG4gKiBiZXR3ZWVuIHRoZSBnaXZlbiBpbnRlcnZhbCBhbmQgcG9zaXRpb24uIFRoZSBkZWxheSBvcHRpb24gY2FuIGJlIHVzZWQgdG8gcmVjb2duaXplIG11bHRpLXRhcHMgd2l0aG91dCBmaXJpbmdcbiAqIGEgc2luZ2xlIHRhcC5cbiAqXG4gKiBUaGUgZXZlbnREYXRhIGZyb20gdGhlIGVtaXR0ZWQgZXZlbnQgY29udGFpbnMgdGhlIHByb3BlcnR5IGB0YXBDb3VudGAsIHdoaWNoIGNvbnRhaW5zIHRoZSBhbW91bnQgb2ZcbiAqIG11bHRpLXRhcHMgYmVpbmcgcmVjb2duaXplZC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBUYXBSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIC8vIHByZXZpb3VzIHRpbWUgYW5kIGNlbnRlcixcbiAgICAvLyB1c2VkIGZvciB0YXAgY291bnRpbmdcbiAgICB0aGlzLnBUaW1lID0gZmFsc2U7XG4gICAgdGhpcy5wQ2VudGVyID0gZmFsc2U7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xuICAgIHRoaXMuY291bnQgPSAwO1xufVxuXG5pbmhlcml0KFRhcFJlY29nbml6ZXIsIFJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBpbmNoUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAndGFwJyxcbiAgICAgICAgcG9pbnRlcnM6IDEsXG4gICAgICAgIHRhcHM6IDEsXG4gICAgICAgIGludGVydmFsOiAzMDAsIC8vIG1heCB0aW1lIGJldHdlZW4gdGhlIG11bHRpLXRhcCB0YXBzXG4gICAgICAgIHRpbWU6IDI1MCwgLy8gbWF4IHRpbWUgb2YgdGhlIHBvaW50ZXIgdG8gYmUgZG93biAobGlrZSBmaW5nZXIgb24gdGhlIHNjcmVlbilcbiAgICAgICAgdGhyZXNob2xkOiA5LCAvLyBhIG1pbmltYWwgbW92ZW1lbnQgaXMgb2ssIGJ1dCBrZWVwIGl0IGxvd1xuICAgICAgICBwb3NUaHJlc2hvbGQ6IDEwIC8vIGEgbXVsdGktdGFwIGNhbiBiZSBhIGJpdCBvZmYgdGhlIGluaXRpYWwgcG9zaXRpb25cbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9NQU5JUFVMQVRJT05dO1xuICAgIH0sXG5cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuICAgICAgICB2YXIgdmFsaWRQb2ludGVycyA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgdmFyIHZhbGlkTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IG9wdGlvbnMudGhyZXNob2xkO1xuICAgICAgICB2YXIgdmFsaWRUb3VjaFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPCBvcHRpb25zLnRpbWU7XG5cbiAgICAgICAgdGhpcy5yZXNldCgpO1xuXG4gICAgICAgIGlmICgoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQpICYmICh0aGlzLmNvdW50ID09PSAwKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFpbFRpbWVvdXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlIG9ubHkgYWxsb3cgbGl0dGxlIG1vdmVtZW50XG4gICAgICAgIC8vIGFuZCB3ZSd2ZSByZWFjaGVkIGFuIGVuZCBldmVudCwgc28gYSB0YXAgaXMgcG9zc2libGVcbiAgICAgICAgaWYgKHZhbGlkTW92ZW1lbnQgJiYgdmFsaWRUb3VjaFRpbWUgJiYgdmFsaWRQb2ludGVycykge1xuICAgICAgICAgICAgaWYgKGlucHV0LmV2ZW50VHlwZSAhPSBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWlsVGltZW91dCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdmFsaWRJbnRlcnZhbCA9IHRoaXMucFRpbWUgPyAoaW5wdXQudGltZVN0YW1wIC0gdGhpcy5wVGltZSA8IG9wdGlvbnMuaW50ZXJ2YWwpIDogdHJ1ZTtcbiAgICAgICAgICAgIHZhciB2YWxpZE11bHRpVGFwID0gIXRoaXMucENlbnRlciB8fCBnZXREaXN0YW5jZSh0aGlzLnBDZW50ZXIsIGlucHV0LmNlbnRlcikgPCBvcHRpb25zLnBvc1RocmVzaG9sZDtcblxuICAgICAgICAgICAgdGhpcy5wVGltZSA9IGlucHV0LnRpbWVTdGFtcDtcbiAgICAgICAgICAgIHRoaXMucENlbnRlciA9IGlucHV0LmNlbnRlcjtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZE11bHRpVGFwIHx8ICF2YWxpZEludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9IDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcblxuICAgICAgICAgICAgLy8gaWYgdGFwIGNvdW50IG1hdGNoZXMgd2UgaGF2ZSByZWNvZ25pemVkIGl0LFxuICAgICAgICAgICAgLy8gZWxzZSBpdCBoYXMgYmVnYW4gcmVjb2duaXppbmcuLi5cbiAgICAgICAgICAgIHZhciB0YXBDb3VudCA9IHRoaXMuY291bnQgJSBvcHRpb25zLnRhcHM7XG4gICAgICAgICAgICBpZiAodGFwQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBubyBmYWlsaW5nIHJlcXVpcmVtZW50cywgaW1tZWRpYXRlbHkgdHJpZ2dlciB0aGUgdGFwIGV2ZW50XG4gICAgICAgICAgICAgICAgLy8gb3Igd2FpdCBhcyBsb25nIGFzIHRoZSBtdWx0aXRhcCBpbnRlcnZhbCB0byB0cmlnZ2VyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmhhc1JlcXVpcmVGYWlsdXJlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJ5RW1pdCgpO1xuICAgICAgICAgICAgICAgICAgICB9LCBvcHRpb25zLmludGVydmFsLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFNUQVRFX0JFR0FOO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICBmYWlsVGltZW91dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgICAgICB9LCB0aGlzLm9wdGlvbnMuaW50ZXJ2YWwsIHRoaXMpO1xuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBTVEFURV9SRUNPR05JWkVEKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC50YXBDb3VudCA9IHRoaXMuY291bnQ7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIHRoaXMuX2lucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFNpbXBsZSB3YXkgdG8gY3JlYXRlIGEgbWFuYWdlciB3aXRoIGEgZGVmYXVsdCBzZXQgb2YgcmVjb2duaXplcnMuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSGFtbWVyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLnJlY29nbml6ZXJzID0gaWZVbmRlZmluZWQob3B0aW9ucy5yZWNvZ25pemVycywgSGFtbWVyLmRlZmF1bHRzLnByZXNldCk7XG4gICAgcmV0dXJuIG5ldyBNYW5hZ2VyKGVsZW1lbnQsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEBjb25zdCB7c3RyaW5nfVxuICovXG5IYW1tZXIuVkVSU0lPTiA9ICcyLjAuNic7XG5cbi8qKlxuICogZGVmYXVsdCBzZXR0aW5nc1xuICogQG5hbWVzcGFjZVxuICovXG5IYW1tZXIuZGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogc2V0IGlmIERPTSBldmVudHMgYXJlIGJlaW5nIHRyaWdnZXJlZC5cbiAgICAgKiBCdXQgdGhpcyBpcyBzbG93ZXIgYW5kIHVudXNlZCBieSBzaW1wbGUgaW1wbGVtZW50YXRpb25zLCBzbyBkaXNhYmxlZCBieSBkZWZhdWx0LlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICovXG4gICAgZG9tRXZlbnRzOiBmYWxzZSxcblxuICAgIC8qKlxuICAgICAqIFRoZSB2YWx1ZSBmb3IgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5L2ZhbGxiYWNrLlxuICAgICAqIFdoZW4gc2V0IHRvIGBjb21wdXRlYCBpdCB3aWxsIG1hZ2ljYWxseSBzZXQgdGhlIGNvcnJlY3QgdmFsdWUgYmFzZWQgb24gdGhlIGFkZGVkIHJlY29nbml6ZXJzLlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICogQGRlZmF1bHQgY29tcHV0ZVxuICAgICAqL1xuICAgIHRvdWNoQWN0aW9uOiBUT1VDSF9BQ1RJT05fQ09NUFVURSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBkZWZhdWx0IHRydWVcbiAgICAgKi9cbiAgICBlbmFibGU6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBFWFBFUklNRU5UQUwgRkVBVFVSRSAtLSBjYW4gYmUgcmVtb3ZlZC9jaGFuZ2VkXG4gICAgICogQ2hhbmdlIHRoZSBwYXJlbnQgaW5wdXQgdGFyZ2V0IGVsZW1lbnQuXG4gICAgICogSWYgTnVsbCwgdGhlbiBpdCBpcyBiZWluZyBzZXQgdGhlIHRvIG1haW4gZWxlbWVudC5cbiAgICAgKiBAdHlwZSB7TnVsbHxFdmVudFRhcmdldH1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgaW5wdXRUYXJnZXQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBmb3JjZSBhbiBpbnB1dCBjbGFzc1xuICAgICAqIEB0eXBlIHtOdWxsfEZ1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgKi9cbiAgICBpbnB1dENsYXNzOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCByZWNvZ25pemVyIHNldHVwIHdoZW4gY2FsbGluZyBgSGFtbWVyKClgXG4gICAgICogV2hlbiBjcmVhdGluZyBhIG5ldyBNYW5hZ2VyIHRoZXNlIHdpbGwgYmUgc2tpcHBlZC5cbiAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICovXG4gICAgcHJlc2V0OiBbXG4gICAgICAgIC8vIFJlY29nbml6ZXJDbGFzcywgb3B0aW9ucywgW3JlY29nbml6ZVdpdGgsIC4uLl0sIFtyZXF1aXJlRmFpbHVyZSwgLi4uXVxuICAgICAgICBbUm90YXRlUmVjb2duaXplciwge2VuYWJsZTogZmFsc2V9XSxcbiAgICAgICAgW1BpbmNoUmVjb2duaXplciwge2VuYWJsZTogZmFsc2V9LCBbJ3JvdGF0ZSddXSxcbiAgICAgICAgW1N3aXBlUmVjb2duaXplciwge2RpcmVjdGlvbjogRElSRUNUSU9OX0hPUklaT05UQUx9XSxcbiAgICAgICAgW1BhblJlY29nbml6ZXIsIHtkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMfSwgWydzd2lwZSddXSxcbiAgICAgICAgW1RhcFJlY29nbml6ZXJdLFxuICAgICAgICBbVGFwUmVjb2duaXplciwge2V2ZW50OiAnZG91YmxldGFwJywgdGFwczogMn0sIFsndGFwJ11dLFxuICAgICAgICBbUHJlc3NSZWNvZ25pemVyXVxuICAgIF0sXG5cbiAgICAvKipcbiAgICAgKiBTb21lIENTUyBwcm9wZXJ0aWVzIGNhbiBiZSB1c2VkIHRvIGltcHJvdmUgdGhlIHdvcmtpbmcgb2YgSGFtbWVyLlxuICAgICAqIEFkZCB0aGVtIHRvIHRoaXMgbWV0aG9kIGFuZCB0aGV5IHdpbGwgYmUgc2V0IHdoZW4gY3JlYXRpbmcgYSBuZXcgTWFuYWdlci5cbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICovXG4gICAgY3NzUHJvcHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRleHQgc2VsZWN0aW9uIHRvIGltcHJvdmUgdGhlIGRyYWdnaW5nIGdlc3R1cmUuIE1haW5seSBmb3IgZGVza3RvcCBicm93c2Vycy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGUgdGhlIFdpbmRvd3MgUGhvbmUgZ3JpcHBlcnMgd2hlbiBwcmVzc2luZyBhbiBlbGVtZW50LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRoZSBkZWZhdWx0IGNhbGxvdXQgc2hvd24gd2hlbiB5b3UgdG91Y2ggYW5kIGhvbGQgYSB0b3VjaCB0YXJnZXQuXG4gICAgICAgICAqIE9uIGlPUywgd2hlbiB5b3UgdG91Y2ggYW5kIGhvbGQgYSB0b3VjaCB0YXJnZXQgc3VjaCBhcyBhIGxpbmssIFNhZmFyaSBkaXNwbGF5c1xuICAgICAgICAgKiBhIGNhbGxvdXQgY29udGFpbmluZyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbGluay4gVGhpcyBwcm9wZXJ0eSBhbGxvd3MgeW91IHRvIGRpc2FibGUgdGhhdCBjYWxsb3V0LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoQ2FsbG91dDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgd2hldGhlciB6b29taW5nIGlzIGVuYWJsZWQuIFVzZWQgYnkgSUUxMD5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICBjb250ZW50Wm9vbWluZzogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgdGhhdCBhbiBlbnRpcmUgZWxlbWVudCBzaG91bGQgYmUgZHJhZ2dhYmxlIGluc3RlYWQgb2YgaXRzIGNvbnRlbnRzLiBNYWlubHkgZm9yIGRlc2t0b3AgYnJvd3NlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdXNlckRyYWc6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3ZlcnJpZGVzIHRoZSBoaWdobGlnaHQgY29sb3Igc2hvd24gd2hlbiB0aGUgdXNlciB0YXBzIGEgbGluayBvciBhIEphdmFTY3JpcHRcbiAgICAgICAgICogY2xpY2thYmxlIGVsZW1lbnQgaW4gaU9TLiBUaGlzIHByb3BlcnR5IG9iZXlzIHRoZSBhbHBoYSB2YWx1ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAncmdiYSgwLDAsMCwwKSdcbiAgICAgICAgICovXG4gICAgICAgIHRhcEhpZ2hsaWdodENvbG9yOiAncmdiYSgwLDAsMCwwKSdcbiAgICB9XG59O1xuXG52YXIgU1RPUCA9IDE7XG52YXIgRk9SQ0VEX1NUT1AgPSAyO1xuXG4vKipcbiAqIE1hbmFnZXJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNYW5hZ2VyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIEhhbW1lci5kZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICB0aGlzLm9wdGlvbnMuaW5wdXRUYXJnZXQgPSB0aGlzLm9wdGlvbnMuaW5wdXRUYXJnZXQgfHwgZWxlbWVudDtcblxuICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLnNlc3Npb24gPSB7fTtcbiAgICB0aGlzLnJlY29nbml6ZXJzID0gW107XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMuaW5wdXQgPSBjcmVhdGVJbnB1dEluc3RhbmNlKHRoaXMpO1xuICAgIHRoaXMudG91Y2hBY3Rpb24gPSBuZXcgVG91Y2hBY3Rpb24odGhpcywgdGhpcy5vcHRpb25zLnRvdWNoQWN0aW9uKTtcblxuICAgIHRvZ2dsZUNzc1Byb3BzKHRoaXMsIHRydWUpO1xuXG4gICAgZWFjaCh0aGlzLm9wdGlvbnMucmVjb2duaXplcnMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFyIHJlY29nbml6ZXIgPSB0aGlzLmFkZChuZXcgKGl0ZW1bMF0pKGl0ZW1bMV0pKTtcbiAgICAgICAgaXRlbVsyXSAmJiByZWNvZ25pemVyLnJlY29nbml6ZVdpdGgoaXRlbVsyXSk7XG4gICAgICAgIGl0ZW1bM10gJiYgcmVjb2duaXplci5yZXF1aXJlRmFpbHVyZShpdGVtWzNdKTtcbiAgICB9LCB0aGlzKTtcbn1cblxuTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogc2V0IG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHtNYW5hZ2VyfVxuICAgICAqL1xuICAgIHNldDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBhc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAvLyBPcHRpb25zIHRoYXQgbmVlZCBhIGxpdHRsZSBtb3JlIHNldHVwXG4gICAgICAgIGlmIChvcHRpb25zLnRvdWNoQWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoQWN0aW9uLnVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmlucHV0VGFyZ2V0KSB7XG4gICAgICAgICAgICAvLyBDbGVhbiB1cCBleGlzdGluZyBldmVudCBsaXN0ZW5lcnMgYW5kIHJlaW5pdGlhbGl6ZVxuICAgICAgICAgICAgdGhpcy5pbnB1dC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnRhcmdldCA9IG9wdGlvbnMuaW5wdXRUYXJnZXQ7XG4gICAgICAgICAgICB0aGlzLmlucHV0LmluaXQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogc3RvcCByZWNvZ25pemluZyBmb3IgdGhpcyBzZXNzaW9uLlxuICAgICAqIFRoaXMgc2Vzc2lvbiB3aWxsIGJlIGRpc2NhcmRlZCwgd2hlbiBhIG5ldyBbaW5wdXRdc3RhcnQgZXZlbnQgaXMgZmlyZWQuXG4gICAgICogV2hlbiBmb3JjZWQsIHRoZSByZWNvZ25pemVyIGN5Y2xlIGlzIHN0b3BwZWQgaW1tZWRpYXRlbHkuXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBbZm9yY2VdXG4gICAgICovXG4gICAgc3RvcDogZnVuY3Rpb24oZm9yY2UpIHtcbiAgICAgICAgdGhpcy5zZXNzaW9uLnN0b3BwZWQgPSBmb3JjZSA/IEZPUkNFRF9TVE9QIDogU1RPUDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcnVuIHRoZSByZWNvZ25pemVycyFcbiAgICAgKiBjYWxsZWQgYnkgdGhlIGlucHV0SGFuZGxlciBmdW5jdGlvbiBvbiBldmVyeSBtb3ZlbWVudCBvZiB0aGUgcG9pbnRlcnMgKHRvdWNoZXMpXG4gICAgICogaXQgd2Fsa3MgdGhyb3VnaCBhbGwgdGhlIHJlY29nbml6ZXJzIGFuZCB0cmllcyB0byBkZXRlY3QgdGhlIGdlc3R1cmUgdGhhdCBpcyBiZWluZyBtYWRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0RGF0YVxuICAgICAqL1xuICAgIHJlY29nbml6ZTogZnVuY3Rpb24oaW5wdXREYXRhKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5zZXNzaW9uO1xuICAgICAgICBpZiAoc2Vzc2lvbi5zdG9wcGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBydW4gdGhlIHRvdWNoLWFjdGlvbiBwb2x5ZmlsbFxuICAgICAgICB0aGlzLnRvdWNoQWN0aW9uLnByZXZlbnREZWZhdWx0cyhpbnB1dERhdGEpO1xuXG4gICAgICAgIHZhciByZWNvZ25pemVyO1xuICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuXG4gICAgICAgIC8vIHRoaXMgaG9sZHMgdGhlIHJlY29nbml6ZXIgdGhhdCBpcyBiZWluZyByZWNvZ25pemVkLlxuICAgICAgICAvLyBzbyB0aGUgcmVjb2duaXplcidzIHN0YXRlIG5lZWRzIHRvIGJlIEJFR0FOLCBDSEFOR0VELCBFTkRFRCBvciBSRUNPR05JWkVEXG4gICAgICAgIC8vIGlmIG5vIHJlY29nbml6ZXIgaXMgZGV0ZWN0aW5nIGEgdGhpbmcsIGl0IGlzIHNldCB0byBgbnVsbGBcbiAgICAgICAgdmFyIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXI7XG5cbiAgICAgICAgLy8gcmVzZXQgd2hlbiB0aGUgbGFzdCByZWNvZ25pemVyIGlzIHJlY29nbml6ZWRcbiAgICAgICAgLy8gb3Igd2hlbiB3ZSdyZSBpbiBhIG5ldyBzZXNzaW9uXG4gICAgICAgIGlmICghY3VyUmVjb2duaXplciB8fCAoY3VyUmVjb2duaXplciAmJiBjdXJSZWNvZ25pemVyLnN0YXRlICYgU1RBVEVfUkVDT0dOSVpFRCkpIHtcbiAgICAgICAgICAgIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHJlY29nbml6ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmVjb2duaXplciA9IHJlY29nbml6ZXJzW2ldO1xuXG4gICAgICAgICAgICAvLyBmaW5kIG91dCBpZiB3ZSBhcmUgYWxsb3dlZCB0cnkgdG8gcmVjb2duaXplIHRoZSBpbnB1dCBmb3IgdGhpcyBvbmUuXG4gICAgICAgICAgICAvLyAxLiAgIGFsbG93IGlmIHRoZSBzZXNzaW9uIGlzIE5PVCBmb3JjZWQgc3RvcHBlZCAoc2VlIHRoZSAuc3RvcCgpIG1ldGhvZClcbiAgICAgICAgICAgIC8vIDIuICAgYWxsb3cgaWYgd2Ugc3RpbGwgaGF2ZW4ndCByZWNvZ25pemVkIGEgZ2VzdHVyZSBpbiB0aGlzIHNlc3Npb24sIG9yIHRoZSB0aGlzIHJlY29nbml6ZXIgaXMgdGhlIG9uZVxuICAgICAgICAgICAgLy8gICAgICB0aGF0IGlzIGJlaW5nIHJlY29nbml6ZWQuXG4gICAgICAgICAgICAvLyAzLiAgIGFsbG93IGlmIHRoZSByZWNvZ25pemVyIGlzIGFsbG93ZWQgdG8gcnVuIHNpbXVsdGFuZW91cyB3aXRoIHRoZSBjdXJyZW50IHJlY29nbml6ZWQgcmVjb2duaXplci5cbiAgICAgICAgICAgIC8vICAgICAgdGhpcyBjYW4gYmUgc2V0dXAgd2l0aCB0aGUgYHJlY29nbml6ZVdpdGgoKWAgbWV0aG9kIG9uIHRoZSByZWNvZ25pemVyLlxuICAgICAgICAgICAgaWYgKHNlc3Npb24uc3RvcHBlZCAhPT0gRk9SQ0VEX1NUT1AgJiYgKCAvLyAxXG4gICAgICAgICAgICAgICAgICAgICFjdXJSZWNvZ25pemVyIHx8IHJlY29nbml6ZXIgPT0gY3VyUmVjb2duaXplciB8fCAvLyAyXG4gICAgICAgICAgICAgICAgICAgIHJlY29nbml6ZXIuY2FuUmVjb2duaXplV2l0aChjdXJSZWNvZ25pemVyKSkpIHsgLy8gM1xuICAgICAgICAgICAgICAgIHJlY29nbml6ZXIucmVjb2duaXplKGlucHV0RGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlY29nbml6ZXIucmVzZXQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhlIHJlY29nbml6ZXIgaGFzIGJlZW4gcmVjb2duaXppbmcgdGhlIGlucHV0IGFzIGEgdmFsaWQgZ2VzdHVyZSwgd2Ugd2FudCB0byBzdG9yZSB0aGlzIG9uZSBhcyB0aGVcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgYWN0aXZlIHJlY29nbml6ZXIuIGJ1dCBvbmx5IGlmIHdlIGRvbid0IGFscmVhZHkgaGF2ZSBhbiBhY3RpdmUgcmVjb2duaXplclxuICAgICAgICAgICAgaWYgKCFjdXJSZWNvZ25pemVyICYmIHJlY29nbml6ZXIuc3RhdGUgJiAoU1RBVEVfQkVHQU4gfCBTVEFURV9DSEFOR0VEIHwgU1RBVEVfRU5ERUQpKSB7XG4gICAgICAgICAgICAgICAgY3VyUmVjb2duaXplciA9IHNlc3Npb24uY3VyUmVjb2duaXplciA9IHJlY29nbml6ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZ2V0IGEgcmVjb2duaXplciBieSBpdHMgZXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ8TnVsbH1cbiAgICAgKi9cbiAgICBnZXQ6IGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKHJlY29nbml6ZXIgaW5zdGFuY2VvZiBSZWNvZ25pemVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVjb2duaXplcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZWNvZ25pemVycyA9IHRoaXMucmVjb2duaXplcnM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVjb2duaXplcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChyZWNvZ25pemVyc1tpXS5vcHRpb25zLmV2ZW50ID09IHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjb2duaXplcnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGFkZCBhIHJlY29nbml6ZXIgdG8gdGhlIG1hbmFnZXJcbiAgICAgKiBleGlzdGluZyByZWNvZ25pemVycyB3aXRoIHRoZSBzYW1lIGV2ZW50IG5hbWUgd2lsbCBiZSByZW1vdmVkXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ8TWFuYWdlcn1cbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKHJlY29nbml6ZXIsICdhZGQnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZW1vdmUgZXhpc3RpbmdcbiAgICAgICAgdmFyIGV4aXN0aW5nID0gdGhpcy5nZXQocmVjb2duaXplci5vcHRpb25zLmV2ZW50KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShleGlzdGluZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlY29nbml6ZXJzLnB1c2gocmVjb2duaXplcik7XG4gICAgICAgIHJlY29nbml6ZXIubWFuYWdlciA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHJlY29nbml6ZXI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSBhIHJlY29nbml6ZXIgYnkgbmFtZSBvciBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcnxTdHJpbmd9IHJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7TWFuYWdlcn1cbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKHJlY29nbml6ZXIsICdyZW1vdmUnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZWNvZ25pemVyID0gdGhpcy5nZXQocmVjb2duaXplcik7XG5cbiAgICAgICAgLy8gbGV0J3MgbWFrZSBzdXJlIHRoaXMgcmVjb2duaXplciBleGlzdHNcbiAgICAgICAgaWYgKHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgIHZhciByZWNvZ25pemVycyA9IHRoaXMucmVjb2duaXplcnM7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBpbkFycmF5KHJlY29nbml6ZXJzLCByZWNvZ25pemVyKTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlY29nbml6ZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBiaW5kIGV2ZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50c1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICAgKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uKGV2ZW50cywgaGFuZGxlcikge1xuICAgICAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLmhhbmRsZXJzO1xuICAgICAgICBlYWNoKHNwbGl0U3RyKGV2ZW50cyksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBoYW5kbGVyc1tldmVudF0gPSBoYW5kbGVyc1tldmVudF0gfHwgW107XG4gICAgICAgICAgICBoYW5kbGVyc1tldmVudF0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB1bmJpbmQgZXZlbnQsIGxlYXZlIGVtaXQgYmxhbmsgdG8gcmVtb3ZlIGFsbCBoYW5kbGVyc1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudHNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbaGFuZGxlcl1cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbihldmVudHMsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcbiAgICAgICAgZWFjaChzcGxpdFN0cihldmVudHMpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGhhbmRsZXJzW2V2ZW50XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdICYmIGhhbmRsZXJzW2V2ZW50XS5zcGxpY2UoaW5BcnJheShoYW5kbGVyc1tldmVudF0sIGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBlbWl0IGV2ZW50IHRvIHRoZSBsaXN0ZW5lcnNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqL1xuICAgIGVtaXQ6IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgIC8vIHdlIGFsc28gd2FudCB0byB0cmlnZ2VyIGRvbSBldmVudHNcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kb21FdmVudHMpIHtcbiAgICAgICAgICAgIHRyaWdnZXJEb21FdmVudChldmVudCwgZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBubyBoYW5kbGVycywgc28gc2tpcCBpdCBhbGxcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVyc1tldmVudF0gJiYgdGhpcy5oYW5kbGVyc1tldmVudF0uc2xpY2UoKTtcbiAgICAgICAgaWYgKCFoYW5kbGVycyB8fCAhaGFuZGxlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLnR5cGUgPSBldmVudDtcbiAgICAgICAgZGF0YS5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGF0YS5zcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBoYW5kbGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldKGRhdGEpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRlc3Ryb3kgdGhlIG1hbmFnZXIgYW5kIHVuYmluZHMgYWxsIGV2ZW50c1xuICAgICAqIGl0IGRvZXNuJ3QgdW5iaW5kIGRvbSBldmVudHMsIHRoYXQgaXMgdGhlIHVzZXIgb3duIHJlc3BvbnNpYmlsaXR5XG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCAmJiB0b2dnbGVDc3NQcm9wcyh0aGlzLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICAgICAgICB0aGlzLnNlc3Npb24gPSB7fTtcbiAgICAgICAgdGhpcy5pbnB1dC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgfVxufTtcblxuLyoqXG4gKiBhZGQvcmVtb3ZlIHRoZSBjc3MgcHJvcGVydGllcyBhcyBkZWZpbmVkIGluIG1hbmFnZXIub3B0aW9ucy5jc3NQcm9wc1xuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGFkZFxuICovXG5mdW5jdGlvbiB0b2dnbGVDc3NQcm9wcyhtYW5hZ2VyLCBhZGQpIHtcbiAgICB2YXIgZWxlbWVudCA9IG1hbmFnZXIuZWxlbWVudDtcbiAgICBpZiAoIWVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlYWNoKG1hbmFnZXIub3B0aW9ucy5jc3NQcm9wcywgZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgZWxlbWVudC5zdHlsZVtwcmVmaXhlZChlbGVtZW50LnN0eWxlLCBuYW1lKV0gPSBhZGQgPyB2YWx1ZSA6ICcnO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIHRyaWdnZXIgZG9tIGV2ZW50XG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gKi9cbmZ1bmN0aW9uIHRyaWdnZXJEb21FdmVudChldmVudCwgZGF0YSkge1xuICAgIHZhciBnZXN0dXJlRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBnZXN0dXJlRXZlbnQuaW5pdEV2ZW50KGV2ZW50LCB0cnVlLCB0cnVlKTtcbiAgICBnZXN0dXJlRXZlbnQuZ2VzdHVyZSA9IGRhdGE7XG4gICAgZGF0YS50YXJnZXQuZGlzcGF0Y2hFdmVudChnZXN0dXJlRXZlbnQpO1xufVxuXG5hc3NpZ24oSGFtbWVyLCB7XG4gICAgSU5QVVRfU1RBUlQ6IElOUFVUX1NUQVJULFxuICAgIElOUFVUX01PVkU6IElOUFVUX01PVkUsXG4gICAgSU5QVVRfRU5EOiBJTlBVVF9FTkQsXG4gICAgSU5QVVRfQ0FOQ0VMOiBJTlBVVF9DQU5DRUwsXG5cbiAgICBTVEFURV9QT1NTSUJMRTogU1RBVEVfUE9TU0lCTEUsXG4gICAgU1RBVEVfQkVHQU46IFNUQVRFX0JFR0FOLFxuICAgIFNUQVRFX0NIQU5HRUQ6IFNUQVRFX0NIQU5HRUQsXG4gICAgU1RBVEVfRU5ERUQ6IFNUQVRFX0VOREVELFxuICAgIFNUQVRFX1JFQ09HTklaRUQ6IFNUQVRFX1JFQ09HTklaRUQsXG4gICAgU1RBVEVfQ0FOQ0VMTEVEOiBTVEFURV9DQU5DRUxMRUQsXG4gICAgU1RBVEVfRkFJTEVEOiBTVEFURV9GQUlMRUQsXG5cbiAgICBESVJFQ1RJT05fTk9ORTogRElSRUNUSU9OX05PTkUsXG4gICAgRElSRUNUSU9OX0xFRlQ6IERJUkVDVElPTl9MRUZULFxuICAgIERJUkVDVElPTl9SSUdIVDogRElSRUNUSU9OX1JJR0hULFxuICAgIERJUkVDVElPTl9VUDogRElSRUNUSU9OX1VQLFxuICAgIERJUkVDVElPTl9ET1dOOiBESVJFQ1RJT05fRE9XTixcbiAgICBESVJFQ1RJT05fSE9SSVpPTlRBTDogRElSRUNUSU9OX0hPUklaT05UQUwsXG4gICAgRElSRUNUSU9OX1ZFUlRJQ0FMOiBESVJFQ1RJT05fVkVSVElDQUwsXG4gICAgRElSRUNUSU9OX0FMTDogRElSRUNUSU9OX0FMTCxcblxuICAgIE1hbmFnZXI6IE1hbmFnZXIsXG4gICAgSW5wdXQ6IElucHV0LFxuICAgIFRvdWNoQWN0aW9uOiBUb3VjaEFjdGlvbixcblxuICAgIFRvdWNoSW5wdXQ6IFRvdWNoSW5wdXQsXG4gICAgTW91c2VJbnB1dDogTW91c2VJbnB1dCxcbiAgICBQb2ludGVyRXZlbnRJbnB1dDogUG9pbnRlckV2ZW50SW5wdXQsXG4gICAgVG91Y2hNb3VzZUlucHV0OiBUb3VjaE1vdXNlSW5wdXQsXG4gICAgU2luZ2xlVG91Y2hJbnB1dDogU2luZ2xlVG91Y2hJbnB1dCxcblxuICAgIFJlY29nbml6ZXI6IFJlY29nbml6ZXIsXG4gICAgQXR0clJlY29nbml6ZXI6IEF0dHJSZWNvZ25pemVyLFxuICAgIFRhcDogVGFwUmVjb2duaXplcixcbiAgICBQYW46IFBhblJlY29nbml6ZXIsXG4gICAgU3dpcGU6IFN3aXBlUmVjb2duaXplcixcbiAgICBQaW5jaDogUGluY2hSZWNvZ25pemVyLFxuICAgIFJvdGF0ZTogUm90YXRlUmVjb2duaXplcixcbiAgICBQcmVzczogUHJlc3NSZWNvZ25pemVyLFxuXG4gICAgb246IGFkZEV2ZW50TGlzdGVuZXJzLFxuICAgIG9mZjogcmVtb3ZlRXZlbnRMaXN0ZW5lcnMsXG4gICAgZWFjaDogZWFjaCxcbiAgICBtZXJnZTogbWVyZ2UsXG4gICAgZXh0ZW5kOiBleHRlbmQsXG4gICAgYXNzaWduOiBhc3NpZ24sXG4gICAgaW5oZXJpdDogaW5oZXJpdCxcbiAgICBiaW5kRm46IGJpbmRGbixcbiAgICBwcmVmaXhlZDogcHJlZml4ZWRcbn0pO1xuXG4vLyB0aGlzIHByZXZlbnRzIGVycm9ycyB3aGVuIEhhbW1lciBpcyBsb2FkZWQgaW4gdGhlIHByZXNlbmNlIG9mIGFuIEFNRFxuLy8gIHN0eWxlIGxvYWRlciBidXQgYnkgc2NyaXB0IHRhZywgbm90IGJ5IHRoZSBsb2FkZXIuXG52YXIgZnJlZUdsb2JhbCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6ICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDoge30pKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5mcmVlR2xvYmFsLkhhbW1lciA9IEhhbW1lcjtcblxuaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEhhbW1lcjtcbiAgICB9KTtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gSGFtbWVyO1xufSBlbHNlIHtcbiAgICB3aW5kb3dbZXhwb3J0TmFtZV0gPSBIYW1tZXI7XG59XG5cbn0pKHdpbmRvdywgZG9jdW1lbnQsICdIYW1tZXInKTtcbiIsInZhciBwb3N0R3JhcGhpY3NUZW1wbGF0ZSA9IHJlcXVpcmUoJy4vcGctdGVtcGxhdGUvcG9zdEdyYXBoaWNzVGVtcGxhdGUuanMnKTtcblxuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gQWxsIHV0aWxpdHkgZnVuY3Rpb25zIHNob3VsZCBhdHRhY2ggdGhlbXNlbHZlcyB0byB0aGlzIG9iamVjdC5cbiAgICB2YXIgdXRpbCA9IHt9O1xuXG4gICAgLy8gVGhpcyBjb2RlIGFzc3VtZXMgaXQgaXMgcnVubmluZyBpbiBhIGJyb3dzZXIgY29udGV4dFxuICAgIHdpbmRvdy5UV1AgPSB3aW5kb3cuVFdQIHx8IHtcbiAgICAgICAgTW9kdWxlOiB7fVxuICAgIH07XG4gICAgd2luZG93LlRXUC5Nb2R1bGUgPSB3aW5kb3cuVFdQLk1vZHVsZSB8fCB7fTtcbiAgICB3aW5kb3cuVFdQLk1vZHVsZS51dGlsID0gdXRpbDtcblxuICAgIGlmICghdXRpbC5nZXRQYXJhbWV0ZXJzIHx8IHR5cGVvZiB1dGlsLmdldFBhcmFtZXRlcnMgPT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgdXRpbC5nZXRQYXJhbWV0ZXJzID0gZnVuY3Rpb24odXJsKXtcbiAgICAgICAgICAgIHZhciBwYXJhbUxpc3QgPSBbXSxcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB7fSxcbiAgICAgICAgICAgICAgICBrdlBhaXJzLFxuICAgICAgICAgICAgICAgIHRtcDtcbiAgICAgICAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgICAgICAgICBpZiAodXJsLmluZGV4T2YoJz8nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1MaXN0ID0gdXJsLnNwbGl0KCc/JylbMV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbUxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbUxpc3QuaW5kZXhPZignJicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga3ZQYWlycyA9IHBhcmFtTGlzdC5zcGxpdCgnJicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrdlBhaXJzID0gW3BhcmFtTGlzdF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhID0gMDsgYSA8IGt2UGFpcnMubGVuZ3RoOyBhKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa3ZQYWlyc1thXS5pbmRleE9mKCc9JykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRtcCA9IGt2UGFpcnNbYV0uc3BsaXQoJz0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zW3RtcFswXV0gPSB1bmVzY2FwZSh0bXBbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBoZWlnaHQgb2YgdGhlIGlmcmFtZSBpZiB0aGlzIHBhZ2UgaXMgaWZyYW1lJ2QuXG4gICAgLy8gTk9URTogVGhpcyAqKnJlcXVpcmVzKiogdGhlIGlmcmFtZSdzIHNyYyBwcm9wZXJ0eSB0byB1c2UgYSBsb2NhdGlvblxuICAgIC8vIHdpdGhvdXQgaXRzIHByb3RvY29sLiBVc2luZyBhIHByb3RvY29sIHdpbGwgbm90IHdvcmsuXG4gICAgLy9cbiAgICAvLyBlLmcuIDxpZnJhbWUgZnJhbWVib3JkZXI9XCIwXCIgc2Nyb2xsaW5nPVwibm9cIiBzdHlsZT1cIndpZHRoOiAxMDAlOyBoZWlnaHQ6NjAwcHg7XCIgc3JjPVwiLy93d3cud2FzaGluZ3RvbnBvc3QuY29tL2dyYXBoaWNzL25hdGlvbmFsL2NlbnN1cy1jb21tdXRlLW1hcC8/dGVtcGxhdGU9aWZyYW1lXCI+PC9pZnJhbWU+XG4gICAgdXRpbC5jaGFuZ2VJZnJhbWVIZWlnaHQgPSBmdW5jdGlvbigpe1xuICAgICAgICAvLyBMb2NhdGlvbiAqd2l0aG91dCogcHJvdG9jb2wgYW5kIHNlYXJjaCBwYXJhbWV0ZXJzXG4gICAgICAgIHZhciBwYXJ0aWFsTG9jYXRpb24gPSAod2luZG93LmxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCwgJycpKSArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcblxuICAgICAgICAvLyBCdWlsZCB1cCBhIHNlcmllcyBvZiBwb3NzaWJsZSBDU1Mgc2VsZWN0b3Igc3RyaW5nc1xuICAgICAgICB2YXIgc2VsZWN0b3JzID0gW107XG5cbiAgICAgICAgLy8gQWRkIHRoZSBVUkwgYXMgaXQgaXMgKGFkZGluZyBpbiB0aGUgc2VhcmNoIHBhcmFtZXRlcnMpXG4gICAgICAgIHNlbGVjdG9ycy5wdXNoKCdpZnJhbWVbc3JjPVwiJyArIHBhcnRpYWxMb2NhdGlvbiArIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggKyAnXCJdJyk7XG5cbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZVt3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUubGVuZ3RoIC0gMV0gPT09ICcvJykge1xuICAgICAgICAgICAgLy8gSWYgdGhlIFVSTCBoYXMgYSB0cmFpbGluZyBzbGFzaCwgYWRkIGEgdmVyc2lvbiB3aXRob3V0IGl0XG4gICAgICAgICAgICAvLyAoYWRkaW5nIGluIHRoZSBzZWFyY2ggcGFyYW1ldGVycylcbiAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKCdpZnJhbWVbc3JjPVwiJyArIChwYXJ0aWFsTG9jYXRpb24uc2xpY2UoMCwgLTEpICsgd2luZG93LmxvY2F0aW9uLnNlYXJjaCkgKyAnXCJdJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgVVJMIGRvZXMgKm5vdCogaGF2ZSBhIHRyYWlsaW5nIHNsYXNoLCBhZGQgYSB2ZXJzaW9uIHdpdGhcbiAgICAgICAgICAgIC8vIGl0IChhZGRpbmcgaW4gdGhlIHNlYXJjaCBwYXJhbWV0ZXJzKVxuICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2goJ2lmcmFtZVtzcmM9XCInICsgcGFydGlhbExvY2F0aW9uICsgJy8nICsgd2luZG93LmxvY2F0aW9uLnNlYXJjaCArICdcIl0nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNlYXJjaCBmb3IgdGhvc2Ugc2VsZWN0b3JzIGluIHRoZSBwYXJlbnQgcGFnZSwgYW5kIGFkanVzdCB0aGUgaGVpZ2h0XG4gICAgICAgIC8vIGFjY29yZGluZ2x5LlxuICAgICAgICB2YXIgJGlmcmFtZSA9ICQod2luZG93LnRvcC5kb2N1bWVudCkuZmluZChzZWxlY3RvcnMuam9pbignLCcpKTtcbiAgICAgICAgdmFyIGggPSAkKCdib2R5Jykub3V0ZXJIZWlnaHQodHJ1ZSk7XG4gICAgICAgICRpZnJhbWUuY3NzKHsnaGVpZ2h0JyA6IGggKyAncHgnfSk7XG4gICAgfTtcblxuICAgIC8vIGZyb20gaHR0cDovL2Rhdmlkd2Fsc2gubmFtZS9qYXZhc2NyaXB0LWRlYm91bmNlLWZ1bmN0aW9uXG4gICAgdXRpbC5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgICAgICB2YXIgdGltZW91dDtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICAgICAgICBpZiAoY2FsbE5vdykgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGlmcmFtZSBjb2RlXG4gICAgICAgIHZhciBwYXJhbXMgPSB1dGlsLmdldFBhcmFtZXRlcnMoZG9jdW1lbnQuVVJMKTtcbiAgICAgICAgaWYgKHBhcmFtc1sndGVtcGxhdGUnXSAmJiBwYXJhbXNbJ3RlbXBsYXRlJ10gPT09ICdpZnJhbWUnKSB7XG4gICAgICAgICAgICAvLyBUT0RPIFdoeSBkbyB3ZSBuZWVkIHRoaXM/IE5vYm9keSBrbm93cy5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZG9tYWluID0gJ3dhc2hpbmd0b25wb3N0LmNvbSc7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdpZnJhbWUnKS5zaG93KCkuY3NzKCdkaXNwbGF5JywnYmxvY2snKTtcbiAgICAgICAgICAgIGlmIChwYXJhbXNbJ2dyYXBoaWNfaWQnXSl7XG4gICAgICAgICAgICAgICAgJCgnIycgKyBwYXJhbXNbJ2dyYXBoaWNfaWQnXSkuc2libGluZ3MoKS5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKCcjcGdjb250ZW50LCAucGdBcnRpY2xlJykuc2libGluZ3MoKS5oaWRlKCk7XG5cbiAgICAgICAgICAgIC8vIENPUlMgbGltaXRhdGlvbnNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gd2luZG93LnRvcC5sb2NhdGlvbi5ob3N0bmFtZSl7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNpemVJZnJhbWUgPSB1dGlsLmRlYm91bmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbC5jaGFuZ2VJZnJhbWVIZWlnaHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMjUwKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyByZXNwb25zaXZlIHBhcnRcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyBXaHkgMTAwMG1zPyBUaGlzIGlzIG5vdCByZWxpYWJsZS5cbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlsLmNoYW5nZUlmcmFtZUhlaWdodCgpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxMDAwKTtcblxuICAgICAgICAgICAgICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHJlc2l6ZUlmcmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxufS5jYWxsKHRoaXMpKTtcbiIsInZhciBIYW1tZXIgPSByZXF1aXJlKCdoYW1tZXJqcycpO1xuXG4oZnVuY3Rpb24gKCQsIHdpbmRvdywgdW5kZWZpbmVkKSB7XG5cbiAgICAvKlxuICAgICAqIGV4dGVuZCBqUXVlcnkgZm9yIG5pY2VyIHN5bnRheCBmb3IgcmVuZGVyaW5nIG91ciBtZW51cyBhbmQgbGlzdHMuXG4gICAgICovXG4gICAgLy91cGRhdGUgPGxpPnMgZnJvbSBqc29uXG5cbiAgICB2YXIgX19pc0lFID0gJCgnaHRtbC5pZScpLmxlbmd0aCA/IHRydWUgOiBmYWxzZTtcblxuXG4gICAgJC5mbi5hcHBlbmRMaW5rSXRlbXMgPSBmdW5jdGlvbihsaW5rcywgc3Vycm91bmRpbmdUYWcpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBzdXJyb3VuZGluZ1RhZyA9IHN1cnJvdW5kaW5nVGFnIHx8IFwiPGxpPlwiO1xuICAgICAgICAkLmVhY2gobGlua3MsIGZ1bmN0aW9uKGksIGxpbmspIHtcbiAgICAgICAgICAgIHZhciBhID0gJChcIjxhPlwiKTtcbiAgICAgICAgICAgIGlmIChsaW5rLnRpdGxlKSB7IGEudGV4dChsaW5rLnRpdGxlKTsgfVxuICAgICAgICAgICAgaWYgKGxpbmsuaHRtbCkgeyBhLmh0bWwobGluay5odG1sKTsgfVxuICAgICAgICAgICAgaWYgKGxpbmsuaHJlZikgeyBhLmF0dHIoXCJocmVmXCIsIGxpbmsuaHJlZik7IH1cbiAgICAgICAgICAgIGlmIChsaW5rLmF0dHIpIHsgYS5hdHRyKGxpbmsuYXR0cik7IH1cbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKFxuICAgICAgICAgICAgICAgICQoc3Vycm91bmRpbmdUYWcpLmFwcGVuZChhKS5hZGRDbGFzcyhsaW5rLnNlbGVjdGVkID8gXCJzZWxlY3RlZFwiIDogXCJcIilcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgJC5mbi50cmFja0NsaWNrID0gZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIGVsZW1lbnQub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBsaW5rbmFtZTtcbiAgICAgICAgICAgIHZhciBsaW5rID0gJCh0aGlzKTtcbiAgICAgICAgICAgIGlmICghIXdpbmRvdy5zICYmIHR5cGVvZiBzLnNlbmREYXRhVG9PbW5pdHVyZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgbGlua25hbWUgPSAoXCJwYm5hdjpcIiArIHR5cGUgKyBcIiAtIFwiICsgICQudHJpbShsaW5rLnRleHQoKSkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgcy5zZW5kRGF0YVRvT21uaXR1cmUobGlua25hbWUsICcnLCB7XG4gICAgICAgICAgICAgICAgICAgIFwiY2hhbm5lbFwiOiBzLmNoYW5uZWwsXG4gICAgICAgICAgICAgICAgICAgIFwicHJvcDI4XCI6IGxpbmtuYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgJC5mbi50cmFja1NoYXJlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBlbGVtZW50Lm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbGluayA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgdHlwZSA9IGxpbmsuYXR0cihcImRhdGEtc2hhcmUtdHlwZVwiKTtcbiAgICAgICAgICAgIGlmICghIXdpbmRvdy5zICYmIHR5cGVvZiBzLnNlbmREYXRhVG9PbW5pdHVyZSA9PSAnZnVuY3Rpb24nICYmIHR5cGUpIHtcbiAgICAgICAgICAgICAgICBzLnNlbmREYXRhVG9PbW5pdHVyZSgnc2hhcmUuJyArIHR5cGUsICdldmVudDYnLCB7IGVWYXIyNzogdHlwZSB9KTsgXG4gICAgICAgICAgICB9ICBcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAkLmZuLm1ha2VEcm9wZG93biA9IGZ1bmN0aW9uIChtZW51RWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgICB2YXIgY2xpY2tFbGVtZW50ID0gdGhpcztcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIG9wdGlvbnMuZGlzYWJsZWQgPSBmYWxzZTtcblxuICAgICAgICAvL2RlZmF1bHQgYmVoYXZpb3IgZm9yIGRyb3Bkb3duXG4gICAgICAgIHZhciBkb3duID0gb3B0aW9ucy5kb3duIHx8IGZ1bmN0aW9uIChfY2xpY2tFbGVtZW50LCBfbWVudUVsZW1lbnQpIHtcbiAgICAgICAgICAgIG5hdi5jbG9zZURyb3Bkb3ducygpO1xuICAgICAgICAgICAgX2NsaWNrRWxlbWVudC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICQoXCIubGVhZGVyYm9hcmRcIikuYWRkQ2xhc3MoXCJoaWRlQWRcIik7XG4gICAgICAgICAgICB2YXIgd2luZG93SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gNTA7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuY3NzKFwiaGVpZ2h0XCIsXCJcIik7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuY3NzKFwiaGVpZ2h0XCIsICh3aW5kb3dIZWlnaHQgPD0gX21lbnVFbGVtZW50LmhlaWdodCgpKSA/IHdpbmRvd0hlaWdodCA6IFwiYXV0b1wiKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5jc3MoXCJ3aWR0aFwiLCBfY2xpY2tFbGVtZW50Lm91dGVyV2lkdGgoKSApO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmNzcyhcImxlZnRcIiwgX2NsaWNrRWxlbWVudC5vZmZzZXQoKS5sZWZ0ICk7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuc2xpZGVEb3duKCdmYXN0Jyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHVwID0gb3B0aW9ucy51cCB8fCBmdW5jdGlvbiAoX2NsaWNrRWxlbWVudCwgX21lbnVFbGVtZW50KSB7XG4gICAgICAgICAgICBfbWVudUVsZW1lbnQuc2xpZGVVcCgnZmFzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfY2xpY2tFbGVtZW50LnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgICAgICQoXCIubGVhZGVyYm9hcmRcIikucmVtb3ZlQ2xhc3MoXCJoaWRlQWRcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBjbGlja0VsZW1lbnQuY2xpY2soZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiggIW9wdGlvbnMuZGlzYWJsZWQgKXtcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAvL2V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgLy9BbmQgSSB1c2VkIHRvIHRoaW5rIGllOSB3YXMgYSBnb29kIGJyb3dzZXIuLi5cbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCA/IGV2ZW50LnByZXZlbnREZWZhdWx0KCkgOiBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1lbnVFbGVtZW50LmZpbmQoXCJsaVwiKS5sZW5ndGggPT0gMCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYoY2xpY2tFbGVtZW50LmlzKFwiLmFjdGl2ZVwiKSl7XG4gICAgICAgICAgICAgICAgICAgIHVwKGNsaWNrRWxlbWVudCwgbWVudUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRvd24oY2xpY2tFbGVtZW50LCBtZW51RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmKCFfX2lzSUUpe1xuICAgICAgICAgICAgdmFyIGhhbW1lcnRpbWUgPSBuZXcgSGFtbWVyKGNsaWNrRWxlbWVudFswXSwgeyBwcmV2ZW50X21vdXNlZXZlbnRzOiB0cnVlIH0pO1xuICAgICAgICAgICAgaGFtbWVydGltZS5vbihcInRhcFwiLGhhbmRsZVRhcCk7XG59XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvL21vdmUgaGVhZGVyIGZlYXR1cmUgb3V0c2lkZSBvZiBwYi1jb250YWluZXIsIHNvIHRoYXQgdGhlIG1lbnUgc2xpZGluZyBhbmltYXRpb24gY2FuIHdvcmtcbiAgICAvLyBpZiggJChcIiNwYi1yb290IC5wYi1mLXBhZ2UtaGVhZGVyLXYyXCIpLmxlbmd0aCAmJiAoJChcIiNwYi1yb290IC5wYi1mLXBhZ2UtaGVhZGVyLXYyXCIpLnNpYmxpbmdzKFwiLnBiLWZlYXR1cmVcIikubGVuZ3RoIHx8ICQoXCIjcGItcm9vdCAucGItZi1wYWdlLWhlYWRlci12MlwiKS5zaWJsaW5ncyhcIi5wYi1jb250YWluZXJcIikubGVuZ3RoKSApIHtcbiAgICAvLyAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgICAgICAgIHZhciAkaGVhZGVyID0gJChcIi5wYi1mLXBhZ2UtaGVhZGVyLXYyXCIpO1xuICAgIC8vICAgICAgICAgJChcIi5wYi1mLXBhZ2UtaGVhZGVyLXYyIHNjcmlwdFwiKS5yZW1vdmUoKTtcbiAgICAvLyAgICAgICAgICQoXCIjcGItcm9vdFwiKS5iZWZvcmUoICRoZWFkZXIgKTtcbiAgICAvLyAgICAgfSgpKTtcbiAgICAvLyB9XG5cbiAgICAvL2xvYWQgdGhlIGFkIGFmdGVyIHRoZSBoZWFkZXIgaGFzIGJlZW4gbW92ZWQsIHNvIGl0IGRvZXNuJ3QgbG9hZCB0d2ljZS4gbm8gY2FsbGJhY2sgb24gYWQgc2NyaXB0cywgc28gaGF2ZSB0byBzZXQgYW4gaW50ZXJ2YWwgdG8gY2hlY2tcbiAgICAvLyBpZiggJChcIiNuYXYtYWQ6dmlzaWJsZVwiKS5sZW5ndGggKXtcbiAgICAvLyAgICAgdmFyIGFkSW50ZXJ2YWxUaW1lb3V0ID0gMTA7IC8vb25seSB0cnkgdGhpcyBmb3IgZml2ZSBzZWNvbmRzLCBvciBkZWFsIHdpdGggaXRcbiAgICAvLyAgICAgdmFyIGFkSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuICAgIC8vICAgICAgICAgaWYoIHR5cGVvZihwbGFjZUFkMikgIT0gXCJ1bmRlZmluZWRcIiApe1xuICAgIC8vICAgICAgICAgICAgICQoXCIjd3BuaV9hZGlfODh4MzFcIikuYXBwZW5kKHBsYWNlQWQyKGNvbW1lcmNpYWxOb2RlLCc4OHgzMScsZmFsc2UsJycpKTsgICAgXG4gICAgLy8gICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChhZEludGVydmFsKVxuICAgIC8vICAgICAgICAgfSAgICBcbiAgICAvLyAgICAgICAgIGlmIChhZEludGVydmFsVGltZW91dCA9PSAwKSBjbGVhckludGVydmFsKGFkSW50ZXJ2YWwpO1xuICAgIC8vICAgICAgICAgYWRJbnRlcnZhbFRpbWVvdXQtLTtcbiAgICAvLyAgICAgfSwgNTAwKTtcbiAgICAvLyB9XG5cbiAgICAvL2FkZCB0cmFja2luZ1xuICAgIC8vICQoXCIjc2l0ZS1tZW51IGFcIikudHJhY2tDbGljayhcIm1haW5cIik7XG4gICAgLy8gJChcIiNzaGFyZS1tZW51IGFcIikudHJhY2tTaGFyZSgpO1xuXG4gICAgLy9hY3RpdmF0ZSBkcm9wZG93bnNcbiAgICAkKFwiI3dwLWhlYWRlciAubmF2LWJ0bltkYXRhLW1lbnVdXCIpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcImRyb3Bkb3duLXRyaWdnZXJcIik7XG4gICAgICAgICQodGhpcykubWFrZURyb3Bkb3duKCAkKFwiI1wiICsgJCh0aGlzKS5kYXRhKFwibWVudVwiKSApICk7XG4gICAgfSk7XG5cbiAgICAvL2FjdGl2YXRlIHNpdGUgbWVudSB3aXRoIGN1c3RvbSBhY3Rpb25zXG4gICAgJChcIiNzaXRlLW1lbnUtYnRuXCIpLm1ha2VEcm9wZG93biggJChcIiNzaXRlLW1lbnVcIiksIHtcbiAgICAgICAgZG93bjogZnVuY3Rpb24oX2NsaWNrRWxlbWVudCwgX21lbnVFbGVtZW50KXtcbiAgICAgICAgICAgIG5hdi5jbG9zZURyb3Bkb3ducygpO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmNzcyhcImhlaWdodFwiLCB3aW5kb3cub3V0ZXJIZWlnaHQgLSA1MCk7XG4gICAgICAgICAgICAkKFwiYm9keVwiKS5hZGRDbGFzcyggKCQoXCIjcGItcm9vdCAucGItZi1wYWdlLWhlYWRlci12MlwiKS5sZW5ndGgpID8gXCJsZWZ0LW1lbnVcIiA6IFwibGVmdC1tZW51IGxlZnQtbWVudS1wYlwiICk7XG4gICAgICAgICAgICBfY2xpY2tFbGVtZW50LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgX21lbnVFbGVtZW50LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgJCgnLnBiSGVhZGVyJykudG9nZ2xlQ2xhc3MoJ25vdC1maXhlZCcpO1xuICAgICAgICB9LFxuICAgICAgICB1cDogZnVuY3Rpb24oX2NsaWNrRWxlbWVudCwgX21lbnVFbGVtZW50KXtcbiAgICAgICAgICAgICQoXCJib2R5XCIpLnJlbW92ZUNsYXNzKFwibGVmdC1tZW51XCIpLnJlbW92ZUNsYXNzKFwibGVmdC1tZW51LXBiXCIpO1xuICAgICAgICAgICAgX2NsaWNrRWxlbWVudC5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIF9tZW51RWxlbWVudC5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICQoJy5wYkhlYWRlcicpLnRvZ2dsZUNsYXNzKCdub3QtZml4ZWQnKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGhhbW1lcnRpbWUgPSBuZXcgSGFtbWVyKCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNpdGUtbWVudVwiKSwge1xuICAgICAgICBkcmFnTG9ja1RvQXhpczogdHJ1ZSxcbiAgICAgICAgZHJhZ0Jsb2NrSG9yaXpvbnRhbDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgaGFtbWVydGltZS5vbiggXCJkcmFnbGVmdCBzd2lwZWxlZnRcIiwgZnVuY3Rpb24oZXYpeyBcbiAgICAgICAgZXYuZ2VzdHVyZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvL2V2Lmdlc3R1cmUucHJldmVudERlZmF1bHQgPyBldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0KCkgOiBldi5nZXN0dXJlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIGV2Lmdlc3R1cmUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmKCBldi5nZXN0dXJlLmRpcmVjdGlvbiA9PSBcImxlZnRcIiAmJiAkKFwiYm9keVwiKS5pcyhcIi5sZWZ0LW1lbnVcIikgKXtcbiAgICAgICAgICAgICQoXCIjc2l0ZS1tZW51LWJ0blwiKS5jbGljaygpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKiBzZWFyY2gtc3BlY2lmaWMgbWFuaXB1bGF0aW9uICovXG4gICAgJChcIi5pb3MgI25hdi1zZWFyY2gtbW9iaWxlIGlucHV0XCIpLmZvY3VzKGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCJoZWFkZXJcIikuY3NzKFwicG9zaXRpb25cIixcImFic29sdXRlXCIpLmNzcyhcInRvcFwiLHdpbmRvdy5wYWdlWU9mZnNldCk7XG4gICAgfSkuYmx1cihmdW5jdGlvbigpe1xuICAgICAgICAkKFwiaGVhZGVyXCIpLmNzcyhcInBvc2l0aW9uXCIsXCJmaXhlZFwiKS5jc3MoXCJ0b3BcIiwwKTtcbiAgICB9KTtcblxuICAgIC8vdHJpZ2dlciB3aW5kb3cgcmVzaXplIHdoZW4gbW9iaWxlIGtleWJvYXJkIGhpZGVzXG4gICAgJChcIiNuYXYtc2VhcmNoLW1vYmlsZSBpbnB1dFwiKS5ibHVyKGZ1bmN0aW9uKCl7XG4gICAgICAgICQoIHdpbmRvdyApLnJlc2l6ZSgpO1xuICAgIH0pO1xuXG4gICAgJChkb2N1bWVudCkua2V5dXAoZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBJZiB5b3UgcHJlc3MgRVNDIHdoaWxlIGluIHRoZSBzZWFyY2ggaW5wdXQsIHlvdSBzaG91bGQgcmVtb3ZlIGZvY3VzIGZyb20gdGhlIGlucHV0XG4gICAgICAgIGlmIChlLmtleUNvZGUgPT0gMjcgJiYgJChcIiNuYXYtc2VhcmNoIGlucHV0W3R5cGU9dGV4dF1cIikuaXMoXCI6Zm9jdXNcIikpIHtcbiAgICAgICAgICAgICQoXCIjbmF2LXNlYXJjaCBpbnB1dFt0eXBlPXRleHRdXCIpLmJsdXIoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJChcIiNuYXYtc2VhcmNoLCNuYXYtc2VhcmNoLW1vYmlsZVwiKS5zdWJtaXQoZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKHRoaXMpLmZpbmQoJ2lucHV0W3R5cGU9dGV4dF0nKS52YWwoKSkge1xuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgIHMuc2VuZERhdGFUb09tbml0dXJlKCdTZWFyY2ggU3VibWl0JywnZXZlbnQyJyx7J2VWYXIzOCc6JCh0aGlzKS5maW5kKCdpbnB1dFt0eXBlPXRleHRdJykudmFsKCksJ2VWYXIxJzpzLnBhZ2VOYW1lfSk7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHt9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLypcbiAgICAgKiBDTElFTlQgU0lERSBBUEkgZm9yIENVU1RPTUlaSU5HIHRoZSBIRUFERVJcbiAgICAgKi9cblxuICAgIC8vIFRoZXJlIHNob3VsZCBvbmx5IGJlIG9uZSBuYXZpZ2F0aW9uIHBlciBwYWdlLiBTbyBvdXIgbmF2aWdhdGlvbiBvYmplY3QgaXMgYSBzaW5nbGV0b24uXG4gICAgLy8gSGVhdnkgZGVwZW5kZW5jeSBvbiBqUXVlcnlcbiAgICB2YXIgY29yZSA9IHdpbmRvdy53cF9wYiA9IHdpbmRvdy53cF9wYiB8fCB7fTtcbiAgICB2YXIgbmF2ID0gY29yZS5uYXYgPSBjb3JlLm5hdiB8fCB7fTtcbiAgICB2YXIgZGVwcmVjYXRlZCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgbmF2LnNldFNlYXJjaCA9IG5hdi5zaG93VG9wTWVudSA9IG5hdi5oaWRlVG9wTWVudSA9IG5hdi5zaG93UHJpbWFyeUxpbmtzID1cbiAgICBuYXYuaGlkZVByaW1hcnlMaW5rcyA9IG5hdi5zaG93SW5UaGVOZXdzID0gbmF2LmhpZGVJblRoZU5ld3MgPSBuYXYuc2hvd0FkU2x1ZyA9XG4gICAgbmF2LmhpZGVBZFNsdWcgPSBuYXYuc2hvd1NlY3Rpb25OYW1lID0gbmF2LmhpZGVTZWN0aW9uTmFtZSA9XG4gICAgbmF2LnNldE1haW5NZW51ID0gbmF2LnNldFNlY3Rpb25NZW51ID0gbmF2LnNldFNlY3Rpb25OYW1lID0gZGVwcmVjYXRlZDtcblxuICAgIG5hdi5zaG93SWRlbnRpdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG5hdi5yZW5kZXJJZGVudGl0eSgpO1xuICAgICAgICBzaG93SWRlbnRpdHkgPSB0cnVlO1xuICAgIH07XG5cbiAgICBuYXYuaGlkZUlkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkKFwiI25hdi11c2VyXCIpLmhpZGUoKTtcbiAgICAgICAgJChcIm5hdi1zaWduLWluXCIpLmhpZGUoKTtcbiAgICAgICAgc2hvd0lkZW50aXR5ID0gZmFsc2U7XG4gICAgfTtcblxuICAgIG5hdi5zaG93U2VhcmNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkKFwiI25hdi1zZWFyY2hcIikuc2hvdygpO1xuICAgIH07XG5cbiAgICBuYXYuaGlkZVNlYXJjaCA9IGZ1bmN0aW9uICgpIHsgXG4gICAgICAgICQoXCIjbmF2LXNlYXJjaFwiKS5oaWRlKCk7IFxuICAgIH07XG5cbiAgICBuYXYuc2hvd1N1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChcIiNuYXYtc3Vic2NyaXB0aW9uXCIpLnNob3coKTtcbiAgICB9O1xuXG4gICAgbmF2LmhpZGVTdWJzY3JpcHRpb24gPSBmdW5jdGlvbiAoKSB7IFxuICAgICAgICAkKFwiI25hdi1zdWJzY3JpcHRpb25cIikuaGlkZSgpOyBcbiAgICB9O1xuICAgIFxuICAgIHZhciBzZXRNZW51ID0gZnVuY3Rpb24gKGVsZW0sIG1lbnUpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSAkKGVsZW0pO1xuICAgICAgICBlbGVtZW50LmNoaWxkcmVuKCdsaScpLnJlbW92ZSgpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZExpbmtJdGVtcyhtZW51KTtcbiAgICB9O1xuXG4gICAgbmF2LnNldElkZW50aXR5TWVudSA9IGZ1bmN0aW9uIChtZW51KSB7XG4gICAgICAgIHNldE1lbnUoXCIjdXNlci1tZW51IHVsXCIsIG1lbnUpO1xuICAgIH07XG5cbiAgICBuYXYuc2V0UGFnZVRpdGxlID0gZnVuY3Rpb24obmFtZSl7XG4gICAgICAgICQoJyNuYXYtcGFnZS10aXRsZScpLnRleHQobmFtZSk7XG4gICAgICAgICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCd0aXRsZScsIG5hbWUpO1xuICAgIH07XG5cbiAgICBuYXYuc2V0U2hhcmVVcmwgPSBmdW5jdGlvbih1cmwpe1xuICAgICAgICAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgncGVybWFsaW5rJyx1cmwpO1xuICAgIH07XG5cbiAgICBuYXYuc2V0VHdpdHRlckhhbmRsZSA9IGZ1bmN0aW9uKGhhbmRsZSl7XG4gICAgICAgIGlmKCQoJyNzaGFyZS1tZW51IGFbZGF0YS1zaGFyZS10eXBlPVwiVHdpdHRlclwiXScpLmxlbmd0aCl7XG4gICAgICAgICAgICAkKCcjc2hhcmUtbWVudSBhW2RhdGEtc2hhcmUtdHlwZT1cIlR3aXR0ZXJcIl0nKS5kYXRhKCd0d2l0dGVyLWhhbmRsZScsIGhhbmRsZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbmF2LmNsb3NlRHJvcGRvd25zID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJChcIiN3cC1oZWFkZXIgLmRyb3Bkb3duLXRyaWdnZXIuYWN0aXZlXCIpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICAkKFwiI1wiKyQodGhpcykuZGF0YShcIm1lbnVcIikpLmhpZGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoXCIubGVhZGVyYm9hcmRcIikucmVtb3ZlQ2xhc3MoXCJoaWRlQWRcIik7XG4gICAgfVxuXG5cbiAgICB2YXIgc2Nyb2xsRXZlbnRzID0ge30sXG4gICAgICAgIHNjcm9sbFBvcyA9ICQodGhpcykuc2Nyb2xsVG9wKCk7XG5cbiAgICB2YXIgZm9yY2VPcGVuID0gJChcIiN3cC1oZWFkZXJcIikuaXMoXCIuc3RheS1vcGVuXCIpO1xuXG4gICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLyogc2hvdyBhbmQgaGlkZSBuYXYgb24gc2Nyb2xsICovXG4gICAgICAgIHZhciBjdXJyZW50UG9zID0gJCh0aGlzKS5zY3JvbGxUb3AoKTtcbiAgICAgICAgaWYgKCFmb3JjZU9wZW4pIHsgICBcblxuICAgICAgICAgICAgaWYoIChjdXJyZW50UG9zICsgMjApIDwgc2Nyb2xsUG9zIHx8IGN1cnJlbnRQb3MgPT09IDAgKXtcbiAgICAgICAgICAgICAgICBuYXYuc2hvd05hdigpO1xuICAgICAgICAgICAgICAgIHNjcm9sbFBvcyA9IGN1cnJlbnRQb3M7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCAoY3VycmVudFBvcyAtIDIwKSA+IHNjcm9sbFBvcyAmJiBjdXJyZW50UG9zID4gNTAgKXtcbiAgICAgICAgICAgICAgICBuYXYuaGlkZU5hdigpO1xuICAgICAgICAgICAgICAgIHNjcm9sbFBvcyA9IGN1cnJlbnRQb3M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBsaXN0ZW4gZm9yIHNob3cvaGlkZSB0aXRsZSAqL1xuXG4gICAgICAgIGlmIChzY3JvbGxFdmVudHMubGVuZ3RoID09IDApIHJldHVybjtcblxuICAgICAgICBmb3IgKHZhciBpIGluIHNjcm9sbEV2ZW50cykge1xuICAgICAgICAgICAgaWYgKHNjcm9sbEV2ZW50cy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGlmICggY3VycmVudFBvcyA+PSBzY3JvbGxFdmVudHNbaV0udGFyZ2V0UG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRXZlbnRzW2ldLmRvd24uY2FsbCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudFBvcyA8IHNjcm9sbEV2ZW50c1tpXS50YXJnZXRQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxFdmVudHNbaV0udXAuY2FsbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uKCkge1xuICAgICAgICAvL3JlbW92ZSBzdGFuZGFyZCBkcm9wZG93bnNcbiAgICAgICAgbmF2LmNsb3NlRHJvcGRvd25zKCk7XG4gICAgICAgIC8vcmVzaXplIHNpdGUgbWVudSwgaWYgb3BlblxuICAgICAgICBpZigkKFwiYm9keVwiKS5pcyhcIi5sZWZ0LW1lbnVcIikpe1xuICAgICAgICAgICAgJChcIiNzaXRlLW1lbnVcIikuY3NzKFwiaGVpZ2h0XCIsICQod2luZG93KS5oZWlnaHQoKSAtIDUwKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgbmF2LnNob3dOYXYgPSBmdW5jdGlvbigpe1xuICAgICAgICBpZiggJChcIiN3cC1oZWFkZXJcIikuaXMoXCIuYmFyLWhpZGRlblwiKSApe1xuICAgICAgICAgICAgJChcIiN3cC1oZWFkZXJcIikucmVtb3ZlQ2xhc3MoXCJiYXItaGlkZGVuXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG5hdi5oaWRlTmF2ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYoICEkKFwiI3dwLWhlYWRlclwiKS5pcyhcIi5iYXItaGlkZGVuXCIpICYmICEkKFwiI3dwLWhlYWRlciAubmF2LWJ0bi5hY3RpdmVcIikubGVuZ3RoICl7XG4gICAgICAgICAgICAkKFwiI3dwLWhlYWRlclwiKS5hZGRDbGFzcyhcImJhci1oaWRkZW5cIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbmF2LnNob3dUaXRsZU9uU2Nyb2xsID0gZnVuY3Rpb24oJHRhcmdldCl7XG4gICAgICAgIHZhciBlbGVtZW50ID0gJHRhcmdldDtcbiAgICAgICAgc2Nyb2xsRXZlbnRzW1widGl0bGVTY3JvbGxcIl0gPSB7XG4gICAgICAgICAgICB0YXJnZXRQb3NpdGlvbjogZWxlbWVudC5vZmZzZXQoKS50b3AgKyA1MCxcbiAgICAgICAgICAgIGRvd246IGZ1bmN0aW9uICgpIHsgXG4gICAgICAgICAgICAgICAgaWYoICEkKCcjd3AtaGVhZGVyJykuaXMoXCIudGl0bGUtbW9kZVwiKSApe1xuICAgICAgICAgICAgICAgICAgICAkKCcjd3AtaGVhZGVyJykuYWRkQ2xhc3MoJ3RpdGxlLW1vZGUnKTtcbiAgICAgICAgICAgICAgICAgICAgJChcIiN3cC1oZWFkZXIgLm5hdi1taWRkbGVcIikuY3NzKCBcInBhZGRpbmctcmlnaHRcIiwgICQoXCIjd3AtaGVhZGVyIC5uYXYtcmlnaHRcIikub3V0ZXJXaWR0aCgpICk7XG4gICAgICAgICAgICAgICAgICAgIG5hdi5jbG9zZURyb3Bkb3ducygpO1xuICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cDogZnVuY3Rpb24gKCkgeyBcbiAgICAgICAgICAgICAgICBpZiggJCgnI3dwLWhlYWRlcicpLmlzKFwiLnRpdGxlLW1vZGVcIikgKXtcbiAgICAgICAgICAgICAgICAgICAgJCgnI3dwLWhlYWRlcicpLnJlbW92ZUNsYXNzKCd0aXRsZS1tb2RlJyk7IFxuICAgICAgICAgICAgICAgICAgICBuYXYuY2xvc2VEcm9wZG93bnMoKTtcbiAgICAgICAgICAgICAgICB9ICAgXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGlmICggJCgnI25hdi1wYWdlLXRpdGxlW2RhdGEtc2hvdy1vbi1zY3JvbGw9XCJ0cnVlXCJdJykubGVuZ3RoICl7XG4gICAgICAgIHZhciAkdGFyZ2V0ID0gKCAkKFwiLm5hdi1zY3JvbGwtdGFyZ2V0XCIpLmxlbmd0aCApID8gJChcIi5uYXYtc2Nyb2xsLXRhcmdldFwiKSA6ICQoXCJoMSwgaDJcIik7XG4gICAgICAgIGlmKCAkdGFyZ2V0Lmxlbmd0aCApIG5hdi5zaG93VGl0bGVPblNjcm9sbCggJHRhcmdldC5maXJzdCgpICk7XG4gICAgfVxuICAgICAgICBcbiAgICBuYXYucmVuZGVyU2hhcmUgPSBmdW5jdGlvbigpe1xuICAgICAgICAkc2hhcmUgPSAkKFwiI3NoYXJlLW1lbnVcIik7XG4gICAgICAgICRmYWNlYm9vayA9ICQoJ2FbZGF0YS1zaGFyZS10eXBlPVwiRmFjZWJvb2tcIl0nLCAkc2hhcmUpO1xuICAgICAgICAkdHdpdHRlciA9ICQoJ2FbZGF0YS1zaGFyZS10eXBlPVwiVHdpdHRlclwiXScsICRzaGFyZSk7XG4gICAgICAgICRsaW5rZWRpbiA9ICQoJ2FbZGF0YS1zaGFyZS10eXBlPVwiTGlua2VkSW5cIl0nLCAkc2hhcmUpO1xuICAgICAgICAkZW1haWwgPSAkKCdhW2RhdGEtc2hhcmUtdHlwZT1cIkVtYWlsXCJdJywgJHNoYXJlKTtcbiAgICAgICAgJHBpbnRlcmVzdCA9ICQoJ2FbZGF0YS1zaGFyZS10eXBlPVwiUGludGVyZXN0XCJdJywgJHNoYXJlKTtcblxuICAgICAgICBpZiAoJGZhY2Vib29rLmxlbmd0aCl7XG4gICAgICAgICAgICAkZmFjZWJvb2suY2xpY2soZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL3NoYXJlci9zaGFyZXIucGhwP3U9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3Blcm1hbGluaycpICksJycsJ3dpZHRoPTY1OCxoZWlnaHQ9MzU0LHNjcm9sbGJhcnM9bm8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkdHdpdHRlci5sZW5ndGgpe1xuICAgICAgICAgICAgJHR3aXR0ZXIuY2xpY2soZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgIHZhciB0d2l0dGVySGFuZGxlID0gKCQodGhpcykuZGF0YShcInR3aXR0ZXItaGFuZGxlXCIpKSA/ICAkKHRoaXMpLmRhdGEoXCJ0d2l0dGVyLWhhbmRsZVwiKS5yZXBsYWNlKFwiQFwiLFwiXCIpIDogXCJ3YXNoaW5ndG9ucG9zdFwiO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3R3aXR0ZXIuY29tL3NoYXJlP3VybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgncGVybWFsaW5rJykgKSArICcmdGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgndGl0bGUnKSApICsgJyZ2aWE9JyArIHR3aXR0ZXJIYW5kbGUgLCcnLCd3aWR0aD01NTAsIGhlaWdodD0zNTAsIHNjcm9sbGJhcnM9bm8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkbGlua2VkaW4ubGVuZ3RoKXtcbiAgICAgICAgICAgICRsaW5rZWRpbi5jbGljayhmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9zaGFyZUFydGljbGU/bWluaT10cnVlJnVybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCAkKFwiI3NoYXJlLW1lbnVcIikuZGF0YSgncGVybWFsaW5rJykgKSArICcmdGl0bGU9JyArIGVuY29kZVVSSUNvbXBvbmVudCggJChcIiNzaGFyZS1tZW51XCIpLmRhdGEoJ3RpdGxlJykgKSwnJywnd2lkdGg9ODMwLGhlaWdodD00NjAsc2Nyb2xsYmFycz1ubycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCRlbWFpbC5sZW5ndGgpe1xuICAgICAgICAgICAgJGVtYWlsLmNsaWNrKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICB3aW5kb3cub3BlbignbWFpbHRvOj9zdWJqZWN0PScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCd0aXRsZScpICkgKyAnIGZyb20gVGhlIFdhc2hpbmd0b24gUG9zdCZib2R5PScgKyBlbmNvZGVVUklDb21wb25lbnQoICQoXCIjc2hhcmUtbWVudVwiKS5kYXRhKCdwZXJtYWxpbmsnKSApLCcnLCcnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCRwaW50ZXJlc3QubGVuZ3RoKXtcbiAgICAgICAgICAgICRwaW50ZXJlc3QuY2xpY2soZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICAgICAgICAgZS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCd0ZXh0L2phdmFzY3JpcHQnKTtcbiAgICAgICAgICAgICAgICBlLnNldEF0dHJpYnV0ZSgnY2hhcnNldCcsJ1VURi04Jyk7XG4gICAgICAgICAgICAgICAgZS5zZXRBdHRyaWJ1dGUoJ3NyYycsJ2h0dHBzOi8vYXNzZXRzLnBpbnRlcmVzdC5jb20vanMvcGlubWFya2xldC5qcz9yPScgKyBNYXRoLnJhbmRvbSgpKjk5OTk5OTk5KTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBpZiggJChcIiNzaGFyZS1tZW51XCIpLmxlbmd0aCApe1xuICAgICAgICBuYXYucmVuZGVyU2hhcmUoKTtcbiAgICB9XG5cbiAgICB2YXIgaWRwOyAvL3ByaXZhdGUgdmFyaWFibGUuIFRoZXJlIGNhbiBiZSBvbmx5IG9uZSBwcm92aWRlci4gU28gdGhpcyBpcyBhIHNpbmdsZXRvbi5cbiAgICBuYXYuZ2V0SWRlbnRpdHlQcm92aWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGlkcDtcbiAgICB9O1xuICAgIG5hdi5zZXRJZGVudGl0eVByb3ZpZGVyID0gZnVuY3Rpb24gKHByb3ZpZGVyKSB7XG4gICAgICAgIHZhciBlZiA9IGZ1bmN0aW9uICgpIHt9OyAvL2VtcHR5IGZ1bmN0aW9uXG4gICAgICAgIGlkcCA9IHt9O1xuICAgICAgICAvLyB3ZSdsbCBwYWQgYW55IG1pc3NpbmcgcG9ydGlvbiB3aXRoIGVtcHR5IGZ1bmN0aW9uXG4gICAgICAgIGlkcC5uYW1lID0gcHJvdmlkZXIubmFtZSB8fCBcIlwiO1xuICAgICAgICBpZHAuZ2V0VXNlcklkID0gcHJvdmlkZXIuZ2V0VXNlcklkIHx8IGVmO1xuICAgICAgICBpZHAuZ2V0VXNlck1lbnUgPSBwcm92aWRlci5nZXRVc2VyTWVudSB8fCBlZjtcbiAgICAgICAgaWRwLmdldFNpZ25JbkxpbmsgPSBwcm92aWRlci5nZXRTaWduSW5MaW5rIHx8IGVmO1xuICAgICAgICBpZHAuZ2V0UmVnaXN0cmF0aW9uTGluayA9IHByb3ZpZGVyLmdldFJlZ2lzdHJhdGlvbkxpbmsgfHwgZWY7XG4gICAgICAgIGlkcC5pc1VzZXJMb2dnZWRJbiA9IHByb3ZpZGVyLmlzVXNlckxvZ2dlZEluIHx8IGVmO1xuICAgICAgICBpZHAuaXNVc2VyU3Vic2NyaWJlciA9IHByb3ZpZGVyLmlzVXNlclN1YnNjcmliZXIgfHwgZWY7XG4gICAgICAgIFxuICAgICAgICBpZHAucmVuZGVyID0gcHJvdmlkZXIucmVuZGVyIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChpZHAuaXNVc2VyTG9nZ2VkSW4oKSkge1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXVzZXIgLnVzZXJuYW1lXCIpLnRleHQoaWRwLmdldFVzZXJJZCgpKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi11c2VyLW1vYmlsZSBhXCIpLnRleHQoaWRwLmdldFVzZXJJZCgpKTtcbiAgICAgICAgICAgICAgICBuYXYuc2V0SWRlbnRpdHlNZW51KGlkcC5nZXRVc2VyTWVudSgpKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi11c2VyXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXVzZXItbW9iaWxlXCIpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICQoXCIjbmF2LXVzZXItbW9iaWxlIGFcIikuYXR0cihcImhyZWZcIixpZHAuZ2V0VXNlck1lbnUoKVswXVtcImhyZWZcIl0pO1xuICAgICAgICAgICAgICAgIGlmKCBpZHAuaXNVc2VyU3Vic2NyaWJlcigpID09PSBcIjBcIiApe1xuICAgICAgICAgICAgICAgICAgICAkKFwiI25hdi1zdWJzY3JpYmVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgICAgICQoXCIjbmF2LXN1YnNjcmliZS1tb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi1zaWduLWluXCIpLmF0dHIoXCJocmVmXCIsIGlkcC5nZXRTaWduSW5MaW5rKCkrXCImbmlkPXRvcF9wYl9zaWduaW5cIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtc2lnbi1pbi1tb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIikuZmluZChcImFcIikuYXR0cihcImhyZWZcIiwgaWRwLmdldFNpZ25JbkxpbmsoKStcIiZuaWQ9dG9wX3BiX3NpZ25pblwiKTtcbiAgICAgICAgICAgICAgICAkKFwiI25hdi1zdWJzY3JpYmVcIikucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgJChcIiNuYXYtc3Vic2NyaWJlLW1vYmlsZVwiKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvL2xldCdzIHJlbmRlclxuICAgICAgICBuYXYucmVuZGVySWRlbnRpdHkoKTtcbiAgICB9O1xuICAgIG5hdi5yZW5kZXJJZGVudGl0eSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICBpZiAoaWRwKSB7IC8vIHRoZSB1c2VyIG1pZ2h0IG5vdCBoYXZlIGNvbmZpZ3VyZWQgYW55IGlkZW50aXR5LiBTbyBjaGVjayBmb3IgaXQuXG4gICAgICAgICAgICBpZHAucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2soaWRwKTtcbiAgICB9O1xuXG4gICAgLypcbiAgICAgKiBVc2luZyB0aGUgcHJpdmRlZCBBUEksIHNldCB1cCB0aGUgZGVmYXVsdCBpZGVudGl0eSBwcm92aWRlciBhcyBUV1BcbiAgICAgKi9cblxuICAgIC8vIGlmIHRoZSBpZGVudGl0eSBjb21wb25lbnQgd2VyZSBzZXQgYXMgaGlkZGVuIGZyb20gUGFnZUJ1aWxkZXIgYWRtaW5cbiAgICAvLyBzZXQgYSBmbGFnIHNvIHRoYXQgd2UgZG9uJ3QgcHJvY2VzcyBsb2dpbiBhdCBhbGxcbiAgICB2YXIgc2hvd0lkZW50aXR5ID0gJChcIiNuYXYtdXNlclwiKS5kYXRhKFwic2hvdy1pZGVudGl0eVwiKTtcblxuICAgIC8vIGRlZmF1bHQgSWRlbnRpdHlcbiAgICB2YXIgY3VycmVudCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiP1wiKVswXTtcbiAgICB2YXIgdHdwSWRlbnRpdHkgPSB7XG4gICAgICAgIG5hbWU6IFwiVFdQXCIsXG4gICAgICAgIGdldFVzZXJJZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHVzZXJuYW1lID0gVFdQLlV0aWwuVXNlci5nZXRVc2VyTmFtZSgpO1xuICAgICAgICAgICAgdmFyIHVzZXJpZCA9IFRXUC5VdGlsLlVzZXIuZ2V0VXNlcklkKCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHVzZXJuYW1lID09IFwic3RyaW5nXCIgJiYgdXNlcm5hbWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1c2VybmFtZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ2V0VXNlck1lbnU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgeyBcInRpdGxlXCI6IFwiUHJvZmlsZVwiLCBcImhyZWZcIjogVFdQLnNpZ25pbi5wcm9maWxldXJsICsgY3VycmVudCArICcmcmVmcmVzaD10cnVlJyB9LFxuICAgICAgICAgICAgICAgIHsgXCJ0aXRsZVwiOiBcIkxvZyBvdXRcIiwgXCJocmVmXCI6IFRXUC5zaWduaW4ubG9nb3V0dXJsX3BhZ2UgfVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0U2lnbkluTGluazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFRXUC5zaWduaW4ubG9naW51cmxfcGFnZSArIGN1cnJlbnQ7XG4gICAgICAgIH0sXG4gICAgICAgIGdldFJlZ2lzdHJhdGlvbkxpbms6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBUV1Auc2lnbmluLnJlZ2lzdHJhdGlvbnVybF9wYWdlICsgY3VycmVudDtcbiAgICAgICAgfSxcbiAgICAgICAgaXNVc2VyU3Vic2NyaWJlcjogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICBzdWIgPSAoZG9jdW1lbnQuY29va2llLm1hdGNoKC9ycGxzYj0oWzAtOV0rKS8pKSA/IFJlZ0V4cC4kMSA6ICcnOyBcbiAgICAgICAgICAgIHJldHVybiBzdWI7XG4gICAgICAgIH0sXG4gICAgICAgIGlzVXNlckxvZ2dlZEluOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKFRXUC5VdGlsLlVzZXIpID8gVFdQLlV0aWwuVXNlci5nZXRBdXRoZW50aWNhdGlvbigpIDogZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gSWYgd2UgYXJlIHNob3dpbmcgaWRlbnRpdHkgdGhlbiBzZXQgdGhlIGRlZmF1bHQgaWRlbnRpdHkgcHJvdmlkZXIgdG8gVFdQLlxuICAgIC8vICAgVXNlciBjYW4gb3ZlcmlkZSB0aGlzIHdoZW5ldmVyIHRoZXkgd2FudC5cbiAgICAvL1xuICAgIC8vIEluIFRXUCwgaWRlbnRpdHkgdXNlciBpbnRlcmZhY2UgbmVlZHMgdG8gcHJvY2Vzc2VkIGFmdGVyIHRoZSBmYWN0IHRoYXQgYWxsIG90aGVyIGphdmFzY3JpcHQgaGFzIGJlZW4gbG9hZGVkLlxuICAgIC8vICAgQnV0IHRoZSBqcyByZXNvdXJjZXMgYXJlIGxvYWRlZCBhc3luY2hyb25vdXNseSBhbmQgaXQgZG9lc24ndCBoYXZlIGFueSBjYWxsYmFja3MgaG9va3MuIFNvIHdlIHdhdGNoIGZvciBpdC5cbiAgICBpZiAoc2hvd0lkZW50aXR5KSB7XG4gICAgICAgIC8vdHJ5IHRvIGxvYWQgVFdQIG9ubHkgaWYgd2UgYXJlIHNob3dpbmcgSWRlbnRpdHkuXG4gICAgICAgIHZhciBpbml0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIChmdW5jdGlvbiBjaGVja1RXUCgpIHtcbiAgICAgICAgICAgIC8vIGlmIHRoZXJlJ3MgYWxyZWFkeSBpZHAgc2V0LCB0aGVuIGRvbid0IHRyeSB0byBsb2FkIFRXUC5cbiAgICAgICAgICAgIGlmICghbmF2LmdldElkZW50aXR5UHJvdmlkZXIoKSkge1xuICAgICAgICAgICAgICAgIGlmIChUV1AgJiYgVFdQLnNpZ25pbiAmJiBUV1AuVXRpbCkgeyAvLyBtYWtlIHN1cmUgVFdQIGhhcyBiZWVuIGxvYWRlZC5cbiAgICAgICAgICAgICAgICAgICAgbmF2LnNldElkZW50aXR5UHJvdmlkZXIodHdwSWRlbnRpdHkpO1xuICAgICAgICAgICAgICAgICAgICBuYXYucmVuZGVySWRlbnRpdHkoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFmdGVyIDMgc2Vjb25kcywgaWYgVFdQIGluZGVudGl0eSBoYXNuJ3QgYmVlbiBsb2FkZWQuIExldCdzIGp1c3Qgc3RvcC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdyAtIGluaXQgPCAzICogMTAwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgaXQgaGFzbid0IGJlZW4gbG9hZGVkLCB3ZSB3YWl0IGZldyBtaWxsaXNlY29uZHMgYW5kIHRyeSBhZ2Fpbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgY2hlY2tUV1AoKTsgfSwgMjAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSgpKTtcbiAgICB9XG5cbiAgICAvKiBoYW1tZXIuanMgdGFwICovXG5cbiAgICBmdW5jdGlvbiBoYW5kbGVUYXAoZXYpIHtcbiAgICAgICAgZXYuZ2VzdHVyZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvL2V2Lmdlc3R1cmUucHJldmVudERlZmF1bHQgPyBldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0KCkgOiBldi5nZXN0dXJlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIGV2Lmdlc3R1cmUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICQoZXYuZ2VzdHVyZS50YXJnZXQpLmNsaWNrKCk7XG4gICAgfVxuXG4gICAgLyogYS9iIHRlc3QgYW5kIHRhcmdldCAqL1xuICAgIC8vICQod2luZG93LmRvY3VtZW50KS5vbignYWJ0ZXN0LXJlYWR5JywgZnVuY3Rpb24oZSwgQUJUKSB7XG5cbiAgICAvLyAgICAgaWYgKCAhc3VwcG9ydGVkQ2xpZW50KCkgKSB7XG4gICAgLy8gICAgICAgICByZXR1cm47XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBhcHBseVZhcmlhbnRFeHBlcmllbmNlKCdtYXN0SGVhZDInLCAnbG9nb0xhcmdlJyk7XG5cbiAgICAvLyAgICAgZnVuY3Rpb24gYXBwbHlWYXJpYW50RXhwZXJpZW5jZShmZWF0dXJlTmFtZSwgdmFyaWFudE5hbWUpIHtcbiAgICAvLyAgICAgICAgIHZhciBmdHIgPSBBQlQuZ2V0KGZlYXR1cmVOYW1lKTtcbiAgICAvLyAgICAgICAgIHZhciB0cmsgPSBmdHIuaXModmFyaWFudE5hbWUpO1xuICAgICAgICAgICAgXG4gICAgLy8gICAgICAgICB2YXIgJHRhcmdldCA9ICQoJ2hlYWRlci5hYnQtbm90LWxvYWRlZCwgI3dwLXRvcHBlciwgLnBiLWYtcGFnZS1oZWFkZXItdjIsIGJvZHknKTtcbiAgICAvLyAgICAgICAgICR0YXJnZXQucmVtb3ZlQ2xhc3MoICdhYnQtbm90LWxvYWRlZCcgKTtcbiAgICAvLyAgICAgICAgICR0YXJnZXQuYWRkQ2xhc3MoICdhYnQtJyArIGZlYXR1cmVOYW1lICsgJy0nICsgdmFyaWFudE5hbWUgKyAnLScgKyB0cmsgKTtcblxuICAgIC8vICAgICAgICAgdmFyIGZkID0gbW9tZW50KCkuZm9ybWF0KCdkZGRkLCBMTCcpO1xuXG4gICAgLy8gICAgICAgICAkKCcjd3AtdG9wcGVyIC50b3AtdGltZXN0YW1wJykudGV4dChmZCk7XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBmdW5jdGlvbiBzdXBwb3J0ZWRDbGllbnQoKSB7XG5cbiAgICAvLyAgICAgICAgIHJldHVybiAkKCdodG1sLmRlc2t0b3AnKS5sZW5ndGggPiAwICYmICQoJ2hlYWRlci5kYXJrJykubGVuZ3RoID09IDA7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9KTtcblxufShqUXVlcnksIHdpbmRvdykpO1xuXG4iLCIvL1RvcCBTaGFyZSBCYXIgSlMgLSBzdG9sZW4gc3RyYWlnaHQgZnJvbSBcbihmdW5jdGlvbigkKXtcblxuICAgdmFyIHNvY2lhbFRvb2xzID0ge1xuICAgICAgICBteVJvb3QgOiAnLnRvcC1zaGFyZWJhci13cmFwcGVyJyxcblxuICAgICAgICBpbml0OmZ1bmN0aW9uIChteVJvb3QpIHtcbiAgICAgICAgICAgIG15Um9vdCA9IG15Um9vdCB8fCB0aGlzLm15Um9vdDtcbiAgICAgICAgICAgICQobXlSb290KS5lYWNoKGZ1bmN0aW9uKGluZGV4LCBteVJvb3RFbGVtZW50KXtcbiAgICAgICAgICAgICAgICBteVJvb3RFbGVtZW50LnBvc3RTaGFyZSA9IG5ldyBwb3N0U2hhcmUoKTtcbiAgICAgICAgICAgICAgICBteVJvb3RFbGVtZW50LnBvc3RTaGFyZS5pbml0KCQobXlSb290RWxlbWVudCksICQobXlSb290RWxlbWVudCkuZGF0YSgncG9zdHNoYXJlJykpO1xuICAgICAgICAgICAgICAgIHZhciAkcm9vdCA9ICQobXlSb290RWxlbWVudCksIFxuICAgICAgICAgICAgICAgICAgICAkaW5kaXZpZHVhbFRvb2wgPSAkKCcudG9vbDpub3QoLm1vcmUpJywkcm9vdCksXG4gICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc1dyYXBwZXIgPSAkKCcuc29jaWFsLXRvb2xzLXdyYXBwZXInLCRyb290KSxcbiAgICAgICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzTW9yZUJ0biA9ICQoJy50b29sLm1vcmUnLCRzb2NpYWxUb29sc1dyYXBwZXIpLFxuICAgICAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNBZGRpdGlvbmFsID0gJCgnLnNvY2lhbC10b29scy1hZGRpdGlvbmFsJywkcm9vdCksXG4gICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc1V0aWxpdHkgPSAkKCcudXRpbGl0eS10b29scy13cmFwcGVyJywkcm9vdCksXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gKHdpbmRvdy5pbm5lcldpZHRoID4gMCkgPyB3aW5kb3cuaW5uZXJXaWR0aCA6IHNjcmVlbi53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaXNNb2JpbGUgPSAobW9iaWxlX2Jyb3dzZXIgPT09IDEgJiYgd2lkdGggPCA0ODApID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSB7J29tbml0dXJlRXZlbnQnIDogJ2V2ZW50Nid9OyAgICAgICAgICBcbiAgICBcbiAgICAgICAgICAgICAgICAkc29jaWFsVG9vbHNNb3JlQnRuLm9mZignY2xpY2snKS5vbignY2xpY2snLHRoaXMsZnVuY3Rpb24oZXYpeyAgXG4gICAgICAgICAgICAgICAgICAgIGlmKGlzTW9iaWxlKXskc29jaWFsVG9vbHNVdGlsaXR5LmhpZGUoJ2Zhc3QnKTt9OyAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICRzb2NpYWxUb29sc01vcmVCdG4uaGlkZSgnZmFzdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNvY2lhbFRvb2xzQWRkaXRpb25hbC5zaG93KCdmYXN0JyxmdW5jdGlvbihldil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLnRvb2wnLCRzb2NpYWxUb29sc1dyYXBwZXIpLmFuaW1hdGUoe1wid2lkdGhcIjo0MH0sMjUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdC5hZGRDbGFzcyhcImV4cGFuZGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5zb2NpYWwtdG9vbHMnLCRzb2NpYWxUb29sc0FkZGl0aW9uYWwpLmFuaW1hdGUoe1wibWFyZ2luLWxlZnRcIjowfSwyNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGlzTW9iaWxlKXskc29jaWFsVG9vbHNVdGlsaXR5LnNob3coJ3Nsb3cnKTt9OyAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTsvL2VuZCBhZGR0bCBzaG93XG4gICAgICAgICAgICAgICAgfSk7Ly9lbmQgbW9yZSBjbGljayBcbiAgICAgICAgICAgICAgICAkaW5kaXZpZHVhbFRvb2wuYmluZCh7XG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2V2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuc2VuZERhdGFUb09tbml0dXJlID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaGFyZVR5cGUgPSAkKHRoaXMpLmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcmVUeXBlID0gKHR5cGVvZiBzaGFyZVR5cGUgIT0gJ3VuZGVmaW5lZCcpP3NoYXJlVHlwZS5zcGxpdChcIiBcIilbMF0udHJpbSgpOicnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbW5pdHVyZVZhcnMgPSAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlVmFyMVwiOih0eXBlb2Ygd2luZG93LnMgPT0gJ29iamVjdCcpICYmIHMgJiYgcy5lVmFyMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZVZhcjJcIjoodHlwZW9mIHdpbmRvdy5zID09ICdvYmplY3QnKSAmJiBzICYmIHMuZVZhcjIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVWYXI4XCI6KHR5cGVvZiB3aW5kb3cucyA9PSAnb2JqZWN0JykgJiYgcyAmJiBzLmVWYXI4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlVmFyMTdcIjoodHlwZW9mIHdpbmRvdy5zID09ICdvYmplY3QnKSAmJiBzICYmIHMuZVZhcjE3LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlVmFyMjdcIjonJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbW5pdHVyZVZhcnMuZVZhcjI3ID0gc2hhcmVUeXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBldmVudE5hbWUgPSBjb25maWcub21uaXR1cmVFdmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZW5kRGF0YVRvT21uaXR1cmUoJ3NoYXJlLicgKyBzaGFyZVR5cGUsZXZlbnROYW1lLG9tbml0dXJlVmFycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSl7fSAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICB9XG4gICAgfTsgICBcblxuICAgdmFyIHRleHRSZXNpemVyID0ge1xuICAgICAgICBjdXJySW5jcmVtZW50TWF4OjQsXG4gICAgICAgIGN1cnJJbmNyZW1lbnRVbml0OjIsXG4gICAgICAgIGN1cnJJbmNyZW1lbnRJbmRleDowLFxuICAgICAgICBpbml0OiBmdW5jdGlvbiAobXlSb290LHJlc2l6ZWFibGVFbGVtZW50TGlzdCxjbGlja0VsZW1lbnQpIHtcbiAgICAgICAgICAgIG15Um9vdCA9IG15Um9vdCB8fCAnI2FydGljbGUtYm9keSBhcnRpY2xlLCAucmVsYXRlZC1zdG9yeSc7XG4gICAgICAgICAgICByZXNpemVhYmxlRWxlbWVudExpc3QgPSByZXNpemVhYmxlRWxlbWVudExpc3QgfHwgJ3AsIGxpJztcbiAgICAgICAgICAgIGNsaWNrRWxlbWVudCA9IGNsaWNrRWxlbWVudCB8fCAnLnRvb2wudGV4dHJlc2l6ZXInO1xuICAgICAgICAgICAgdGhpcy5yb290ID0gJChteVJvb3QpO1xuICAgICAgICAgICAgdGhpcy5yZXNpemVhYmxlRWxlbWVudHMgPSAkKHJlc2l6ZWFibGVFbGVtZW50TGlzdCwgdGhpcy5yb290KTtcblxuICAgICAgICAgICAgLy8gYWRkIFwiTmV4dCB1cFwiIGxhYmxlIHRvIHRoZSByZXNpemFibGUgZWxlbWVudCdzIGxpc3RcbiAgICAgICAgICAgIGlmKCQoXCIucmVsYXRlZC1zdG9yeVwiKS5wcmV2KCdoMycpLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplYWJsZUVsZW1lbnRzLnB1c2goJCgnLnJlbGF0ZWQtc3RvcnknKS5wcmV2KCdoMycpKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZWFibGVFbGVtZW50cy5wdXNoKCQoJy5yZWxhdGVkLXN0b3J5IGg0IGEnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKGNsaWNrRWxlbWVudCkudW5iaW5kKCdjbGljaycpLm9uKCdjbGljaycsdGhpcyx0aGlzLnJlc2l6ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKGV2ZW50KSB7ICBcbiAgICAgICAgICAgIHZhciBjdXJyT2JqID0gZXZlbnQuZGF0YTtcbiAgICAgICAgICAgIGlmIChjdXJyT2JqLmN1cnJJbmNyZW1lbnRJbmRleCA9PSBjdXJyT2JqLmN1cnJJbmNyZW1lbnRNYXgpIHtcbiAgICAgICAgICAgICAgICBjdXJyT2JqLmN1cnJJbmNyZW1lbnRJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgY3Vyck9iai5jdXJySW5jcmVtZW50VW5pdCA9IChjdXJyT2JqLmN1cnJJbmNyZW1lbnRVbml0ID09IDIpPy0yOjI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyT2JqLmN1cnJJbmNyZW1lbnRJbmRleCA9IGN1cnJPYmouY3VyckluY3JlbWVudEluZGV4ICsgMTtcbiAgICAgICAgICAgIGN1cnJPYmoucmVzaXplYWJsZUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBlbG0gPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgIGN1cnJTaXplPSBwYXJzZUZsb2F0KGVsbS5jc3MoJ2ZvbnQtc2l6ZScpLDUpO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBjdXJyU2l6ZSArIGN1cnJPYmouY3VyckluY3JlbWVudFVuaXQ7XG4gICAgICAgICAgICAgICAgZWxtLmNzcygnZm9udC1zaXplJywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICB3cF9wYi5yZXBvcnQoJ3RleHRyZXNpemVyJywgJ3Jlc2l6ZWQnLCByZXN1bHQpO1xuICAgICAgICAgICAgfSk7IFxuXG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgfTtcbnZhciBtb2JpbGVfYnJvd3NlciA9IG1vYmlsZV9icm93c2VyICYmIG1vYmlsZV9icm93c2VyID09PSAxID8gMSA6IDA7XG4gICBcbiAgIHZhciBwb3N0U2hhcmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICB0aGlzLmluaXQgPSBmdW5jdGlvbihyb290RWxlbWVudCwgcG9zdFNoYXJlVHlwZXMpIHtcbiAgICAgICAgICAgaWYgKHBvc3RTaGFyZVR5cGVzKSB7XG4gICAgICAgICAgICAgICBwb3N0U2hhcmVUeXBlcy5zcGxpdChcIixcIikuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LCBpbmRleCl7XG4gICAgICAgICAgICAgICAgICAgdmFyIHBvc3RTaGFyZVVybCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ob3N0LmluZGV4T2YoJ3dhc2hpbmd0b25wb3N0LmNvbScpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcG9zdFNoYXJlVXJsID0gJ2h0dHA6Ly9wb3N0c2hhcmUud2FzaGluZ3RvbnBvc3QuY29tJzsgLy9wcm9kdWN0aW9uIG9ubHlcbiAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHdpbmRvdy5sb2NhdGlvbi5ob3N0LmluZGV4T2YoJ3BiLXN0YWdpbmcuZGlnaXRhbGluay5jb20nKSA+PSAwIHx8IHdpbmRvdy5sb2NhdGlvbi5ob3N0LmluZGV4T2YoJ3BiLXN0YWdpbmcud3Bwcml2YXRlLmNvbScpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcG9zdFNoYXJlVXJsID0gJ2h0dHA6Ly9wb3N0c2hhcmUtc3RhZ2Uud3Bwcml2YXRlLmNvbSc7IC8vdGVzdGluZyBwYi1zdGFnaW5nXG4gICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcG9zdFNoYXJlVXJsID0gJ2h0dHA6Ly9wb3N0c2hhcmUtZGV2LndwcHJpdmF0ZS5jb20nOyAvL3Rlc3RpbmcgcGItZGV2XG4gICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgIHZhciBwcmVUaW1lc3RhbXAgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgIHZhciBwcmVCdXNpbmVzc0tleSA9IHdwX3BiLlN0YXRpY01ldGhvZHMuZ2V0VW5pcXVlS2V5KDEwMDAsIG51bGwsIHByZVRpbWVzdGFtcCk7XG4gICAgICAgICAgICAgICAgICAgdmFyIG9iamVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgc2hhcmVUeXBlIDogZWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wIDogcHJlVGltZXN0YW1wLFxuICAgICAgICAgICAgICAgICAgICAgICBidXNpbmVzc0tleSA6IHByZUJ1c2luZXNzS2V5LFxuICAgICAgICAgICAgICAgICAgICAgICBzaGFyZVVybCA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHRpbnlVcmwgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBjYWxsZWRQb3N0U2hhcmUgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50VXVpZCA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHBvc3RTaGFyZVVybCA6IHBvc3RTaGFyZVVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgIGNhbGxQb3N0U2hhcmUgOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5jYWxsZWRQb3N0U2hhcmUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IF90aGlzLnBvc3RTaGFyZVVybCtcIi9hcGkvYmsvXCIrX3RoaXMuYnVzaW5lc3NLZXkrXCIvXCIrX3RoaXMuY2xpZW50VXVpZCtcIi9cIitfdGhpcy5zaGFyZVR5cGUrXCIvXCIrX3RoaXMudGltZXN0YW1wLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5jYWxsZWRQb3N0U2hhcmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsbGVkUG9zdFNoYXJlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgIHNoYXJlIDogZnVuY3Rpb24gKHNvY2lhbFVybCwgc29jaWFsVXJsMiwgc3R5bGUsIGNhbGxiYWNrQ29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy50aW55VXJsIHx8IHRoaXMudGlueVVybC5sZW5ndGggPT0gMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBcImh0dHA6Ly90aW55dXJsLndhc2hpbmd0b25wb3N0LmNvbS9jcmVhdGUuanNvbnBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IF90aGlzLnNoYXJlVXJsICsgXCI/cG9zdHNoYXJlPVwiK190aGlzLmJ1c2luZXNzS2V5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMudGlueVVybCA9IGRhdGEudGlueVVybDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrQ29udGV4dC5vcGVuV2luZG93KHNvY2lhbFVybCtfdGhpcy50aW55VXJsK3NvY2lhbFVybDIsX3RoaXMuc2hhcmVUeXBlLHN0eWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3Rocm93IFwiUG9zdFNoYXJlIGZhaWxlZDogdGlueVVybFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiAyMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tDb250ZXh0Lm9wZW5XaW5kb3coc29jaWFsVXJsK190aGlzLnRpbnlVcmwrc29jaWFsVXJsMixfdGhpcy5zaGFyZVR5cGUsc3R5bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAkKHJvb3RFbGVtZW50LmZpbmQoJy4nK2VsZW1lbnQpWzBdKS5wYXJlbnQoKVswXS5wb3N0U2hhcmUgPSAkKHJvb3RFbGVtZW50KVswXS5wb3N0U2hhcmU7XG4gICAgICAgICAgICAgICAgICAgJChyb290RWxlbWVudC5maW5kKCcuJytlbGVtZW50KVswXSkucGFyZW50KClbMF0ucG9zdFNoYXJlT2JqZWN0ID0gb2JqZWN0O1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgIH1cbiAgICAgICB9LFxuICAgICAgIFxuICAgICAgIHRoaXMuY2FsbFBvc3RTaGFyZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBlbGVtZW50T2JqZWN0LCBzb2NpYWxVcmwsIHNoYXJlVXJsTG9uZywgc29jaWFsVXJsMiwgc3R5bGUpIHtcbiAgICAgICAgICAgaWYoZWxlbWVudCAmJiBlbGVtZW50T2JqZWN0ICYmIHNvY2lhbFVybCAmJiBzaGFyZVVybExvbmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2hhcmVUeXBlID0gJChlbGVtZW50KS5jaGlsZHJlbigpLmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgICAgICAgICAgc2hhcmVUeXBlID0gKHR5cGVvZiBzaGFyZVR5cGUgIT0gJ3VuZGVmaW5lZCcpP3NoYXJlVHlwZS5zcGxpdChcIiBcIilbMF0udHJpbSgpOicnO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmKCFzb2NpYWxVcmwyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNvY2lhbFVybDIgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgY2xpZW50VXVpZCA9ICQuY29va2llKFwid2Fwb19sb2dpbl9pZFwiKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbGVtZW50T2JqZWN0LmNsaWVudFV1aWQgPSBjbGllbnRVdWlkO1xuICAgICAgICAgICAgICAgIGlmIChjbGllbnRVdWlkICYmIGNsaWVudFV1aWQubGVuZ3RoID4gMCAmJiBzaGFyZVR5cGUgJiYgc2hhcmVUeXBlLmxlbmd0aCA+IDAgJiYgZWxlbWVudE9iamVjdC5zaGFyZVR5cGUgJiYgc2hhcmVUeXBlLnRyaW0oKSA9PSBlbGVtZW50T2JqZWN0LnNoYXJlVHlwZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudE9iamVjdC5zaGFyZVVybCA9IHNoYXJlVXJsTG9uZztcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudE9iamVjdC5jYWxsUG9zdFNoYXJlKCk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRPYmplY3Quc2hhcmUoc29jaWFsVXJsLCBzb2NpYWxVcmwyLCBzdHlsZSwgZWxlbWVudC5wb3N0U2hhcmUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiUG9zdFNoYXJlIGZhaWxlZDogbm8gbG9nZ2VkIGluIFVzZXIgb3Igd3JvbmcgU2hhcmV0eXBlXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkucGFyZW50KClbMF0ucG9zdFNoYXJlT2JqZWN0ID0gZWxlbWVudE9iamVjdDtcbiAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgIHRocm93IFwiUG9zdFNoYXJlIGZhaWxlZDogRGF0YSBtaXNzaW5nXCI7XG4gICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICBcbiAgICAgICAgdGhpcy5vcGVuV2luZG93ID0gZnVuY3Rpb24odXJsLCBuYW1lLCBzdHlsZSl7XG4gICAgICAgICAgICB3aW5kb3cub3Blbih1cmwsJ3NoYXJlXycrbmFtZSxzdHlsZSk7XG4gICAgICAgIH1cbiAgIH07XG4gICBcbiAgIHdpbmRvdy5UV1AgPSB3aW5kb3cuVFdQIHx8IHt9O1xuICAgVFdQLlNvY2lhbFRvb2xzID0gVFdQLlNvY2lhbFRvb2xzIHx8IHNvY2lhbFRvb2xzO1xuICAgVFdQLlRleHRSZXNpemVyID0gVFdQLlRleHRSZXNpemVyIHx8IHRleHRSZXNpemVyO1xuXG4gICBUV1AuVGV4dFJlc2l6ZXIuaW5pdCgpO1xuICAgVFdQLlNvY2lhbFRvb2xzLmluaXQoKTtcblxuXG4gICAvKlxuICAgICAqIFBPUE9VVCBjb2RlIGZvciBsYXRlciB2YXIgJGFydGljbGUgPSAkKCcjYXJ0aWNsZS10b3BwZXInKTsgLy8gU1RBUlQ6XG4gICAgICogU29jaWFsIHNoYXJlIHBvcC1vdXQgdmFyICRzb2NpYWxUb29sc01vcmVCdG4gPSAkKCcuc29jaWFsLXRvb2xzXG4gICAgICogLm1vcmUnLCRhcnRpY2xlKSwgJHNvY2lhbFRvb2xzUG9wT3V0ID1cbiAgICAgKiAkKCcuc29jaWFsLXRvb2xzLnBvcC1vdXQnLCRhcnRpY2xlKSA7XG4gICAgICogJHNvY2lhbFRvb2xzTW9yZUJ0bi5vbignY2xpY2snLGZ1bmN0aW9uKGV2KXsgdmFyIHRhcmdldFRvcCA9XG4gICAgICogJHNvY2lhbFRvb2xzTW9yZUJ0bi5wb3NpdGlvbigpLnRvcCArXG4gICAgICogJHNvY2lhbFRvb2xzTW9yZUJ0bi5vdXRlckhlaWdodCgpLTEtMTQ7IHZhciB0YXJnZXRMZWZ0ID1cbiAgICAgKiAkc29jaWFsVG9vbHNNb3JlQnRuLnBvc2l0aW9uKCkubGVmdC0xLTM7XG4gICAgICogJHNvY2lhbFRvb2xzUG9wT3V0LmNzcyh7XCJ0b3BcIjp0YXJnZXRUb3AsXCJsZWZ0XCI6dGFyZ2V0TGVmdH0pO1xuICAgICAqICRzb2NpYWxUb29sc1BvcE91dC50b2dnbGUoKTsgfSk7XG4gICAgICogJHNvY2lhbFRvb2xzUG9wT3V0Lm9uKCdtb3VzZW91dCcsZnVuY3Rpb24oZXYpe1xuICAgICAqICRzb2NpYWxUb29sc1BvcE91dC50b2dnbGUoKTsgfSk7IC8vIEVORDogU29jaWFsIHNoYXJlIHBvcC1vdXRcbiAgICAgKi9cbn0pKGpRdWVyeSk7IiwidmFyIGlmcmFtZSA9IHJlcXVpcmUoJy4vaWZyYW1lLmpzJyk7XG52YXIgdHdpdHRlckZvbGxvd0J1dHRvbk1vZHVsZXMgPSByZXF1aXJlKCcuL3R3aXR0ZXItZm9sbG93LmpzJyk7XG52YXIgcGJIZWFkZXJNb2R1bGUgPSByZXF1aXJlKCcuL3BiSGVhZGVyLmpzJyk7XG52YXIgcGJTb2NpYWxUb29scyA9IHJlcXVpcmUoJy4vcGJTb2NpYWxUb29scy5qcycpO1xuXG4vL0FkZHMgdGhlIHJldHVybiB1cmwgdG8gdGhlIHN1YnNjcmliZSBhY3Rpb25cbnZhciBzZXR1cFN1YnNjcmliZUJ0biA9IGZ1bmN0aW9uKCl7XG4gIHZhciAkc3Vic2NyaWJlID0gJCgnI25hdi1zdWJzY3JpYmUnKSxcbiAgICBocmVmID0gICRzdWJzY3JpYmUuYXR0cignaHJlZicpLFxuICAgIHBhZ2VMb2NhdGlvbiA9IHdpbmRvdy5lbmNvZGVVUkkod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgJHN1YnNjcmliZS5hdHRyKCdocmVmJywgaHJlZiArIHBhZ2VMb2NhdGlvbik7XG59O1xuLy9Ecm9wIGluIHlvdXIgaW5pdCBmaWxlXG5zZXR1cFN1YnNjcmliZUJ0bigpO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgR2VuZXJhbFxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG52YXIgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWwpIHtcbiAgZWwgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIHtcbiAgICBsZWZ0OiBlbC5sZWZ0ICsgd2luZG93LnNjcm9sbFgsXG4gICAgdG9wOiBlbC50b3AgKyB3aW5kb3cuc2Nyb2xsWVxuICB9XG59XG5cbnZhciBzaHVmZmxlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgdmFyIGN1cnJlbnRJbmRleCA9IGFycmF5Lmxlbmd0aCwgdGVtcG9yYXJ5VmFsdWUsIHJhbmRvbUluZGV4O1xuXG4gIC8vIFdoaWxlIHRoZXJlIHJlbWFpbiBlbGVtZW50cyB0byBzaHVmZmxlLi4uXG4gIHdoaWxlICgwICE9PSBjdXJyZW50SW5kZXgpIHtcblxuICAgIC8vIFBpY2sgYSByZW1haW5pbmcgZWxlbWVudC4uLlxuICAgIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY3VycmVudEluZGV4KTtcbiAgICBjdXJyZW50SW5kZXggLT0gMTtcblxuICAgIC8vIEFuZCBzd2FwIGl0IHdpdGggdGhlIGN1cnJlbnQgZWxlbWVudC5cbiAgICB0ZW1wb3JhcnlWYWx1ZSA9IGFycmF5W2N1cnJlbnRJbmRleF07XG4gICAgYXJyYXlbY3VycmVudEluZGV4XSA9IGFycmF5W3JhbmRvbUluZGV4XTtcbiAgICBhcnJheVtyYW5kb21JbmRleF0gPSB0ZW1wb3JhcnlWYWx1ZTtcbiAgfVxuXG4gIHJldHVybiBhcnJheTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFZhbHVlc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjgsIHk6MC4yfSwge3g6MC43OCwgeTowLjE4fSwge3g6MC43NCwgeTowLjJ9LCB7eDowLjcyLCB5OjAuMjF9LCB7eDowLjcxLCB5OjAuMjR9LCB7eDowLjczLCB5OjAuMjZ9LCB7eDowLjc2LCB5OjAuMjN9LCB7eDowLjc5LCB5OjAuMn0pLFxuICBuZXcgQXJyYXkoe3g6MC42LCB5OjAuM30sIHt4OjAuNTUsIHk6MC4yMn0sIHt4OjAuNjIsIHk6MC4yNH0sIHt4OjAuNjgsIHk6MC4yfSwge3g6MC43MSwgeTowLjE4fSwge3g6MC42OCwgeTowLjE1fSwge3g6MC42NCwgeTowLjE4fSwge3g6MC42MywgeTowLjIyfSwge3g6MC42MiwgeTowLjI2fSwge3g6MC42MSwgeTowLjI4fSksXG4gIG5ldyBBcnJheSh7eDowLjQ5LCB5OjAuMTR9LCB7eDowLjU0LCB5OjAuMTZ9LCB7eDowLjU2LCB5OjAuMTR9LCB7eDowLjU0LCB5OjAuMTh9LCB7eDowLjU2LCB5OjAuMjJ9LCB7eDowLjUyLCB5OjAuMTh9LCB7eDowLjUsIHk6MC4xNH0sIHt4OjAuNDcsIHk6MC4xMn0pLFxuICBuZXcgQXJyYXkoe3g6MC41NSwgeTowLjMxfSwge3g6MC41OCwgeTowLjI4fSwge3g6MC42NCwgeTowLjI2fSwge3g6MC43MiwgeTowLjIyfSwge3g6MC44LCB5OjAuMTh9LCB7eDowLjczLCB5OjAuMjJ9LCB7eDowLjY4LCB5OjAuMjR9LCB7eDowLjYyLCB5OjAuMjh9KSxcbiAgbmV3IEFycmF5KHt4OjAuNzUsIHk6MC4xNn0sIHt4OjAuNzIsIHk6MC4xOH0sIHt4OjAuNjgsIHk6MC4yMn0sIHt4OjAuNjIsIHk6MC4yNn0sIHt4OjAuNTUsIHk6MC4zfSwge3g6MC42MiwgeTowLjI2fSwge3g6MC42OCwgeTowLjIyfSwge3g6MC43MiwgeTowLjE4fSksXG4gIG5ldyBBcnJheSh7eDowLjgxMjc2OTYyODk5MDUwOTEsIHk6MC4xNDU4MTUzNTgwNjcyOTk0fSx7eDowLjc2MTg2MzY3NTU4MjM5ODYsIHk6MC4xMzcxODcyMzAzNzEwMDk1fSx7eDowLjY5MzcwMTQ2Njc4MTcwODQsIHk6MC4xMzQ1OTg3OTIwNjIxMjI1Mn0se3g6MC41ODU4NDk4NzA1NzgwODQ2LCB5OjAuMTQzMjI2OTE5NzU4NDEyNDJ9LHt4OjAuNTE4NTUwNDc0NTQ3MDIzMywgeTowLjE2OTk3NDExNTYxNjkxMTE0fSx7eDowLjUwOTkyMjM0Njg1MDczMzMsIHk6MC4yMDc5Mzc4Nzc0ODA1ODY3fSx7eDowLjU1OTk2NTQ4NzQ4OTIxNDgsIHk6MC4yMzIwOTY2MzUwMzAxOTg0NX0se3g6MC42Mzc2MTg2MzY3NTU4MjQsIHk6MC4yMTQ4NDAzNzk2Mzc2MTg2NX0se3g6MC43MDY2NDM2NTgzMjYxNDMyLCB5OjAuMjEzOTc3NTY2ODY3OTg5NjN9LHt4OjAuNzkwMzM2NDk2OTgwMTU1MywgeTowLjIzNTU0Nzg4NjEwODcxNDR9LHt4OjAuODM5NTE2ODI0ODQ5MDA3OCwgeTowLjIxMTM4OTEyODU1OTEwMjY2fSx7eDowLjgzOTUxNjgyNDg0OTAwNzgsIHk6MC4xOTMyNzAwNjAzOTY4OTM4N30pLFxuICBuZXcgQXJyYXkoe3g6MC40OTA5NDA0NjU5MTg4OTU2LCB5OjAuMzE5MjQwNzI0NzYyNzI2NDd9LHt4OjAuNTAzMDE5ODQ0NjkzNzAxNCwgeTowLjI3ODY4ODUyNDU5MDE2Mzl9LHt4OjAuNTc1NDk2MTE3MzQyNTM2NywgeTowLjE5OTMwOTc0OTc4NDI5Njh9LHt4OjAuNjM4NDgxNDQ5NTI1NDUyOSwgeTowLjEzODA1MDA0MzE0MDYzODQ4fSx7eDowLjY3ODE3MDgzNjkyODM4NjUsIHk6MC4wOTY2MzUwMzAxOTg0NDY5NH0se3g6MC43MTQ0MDg5NzMyNTI4MDQyLCB5OjAuMTExMzAyODQ3MjgyMTM5Nzh9LHt4OjAuNzQ4MDU4NjcxMjY4MzM0OCwgeTowLjE3NjAxMzgwNTAwNDMxNDA3fSx7eDowLjgwNTAwNDMxNDA2Mzg0ODEsIHk6MC4yNjgzMzQ3NzEzNTQ2MTYwM30se3g6MC43OTIwNjIxMjI1MTk0MTMzLCB5OjAuMzIwMTAzNTM3NTMyMzU1NX0se3g6MC42NTU3Mzc3MDQ5MTgwMzI3LCB5OjAuMzMwNDU3MjkwNzY3OTAzMzd9LHt4OjAuNTQ1Mjk3NjcwNDA1NTIyLCB5OjAuMzE3NTE1MDk5MjIzNDY4NX0pLFxuICBuZXcgQXJyYXkoe3g6MC42MDc0MjAxODk4MTg4MDkzLCB5OjAuMTEyMTY1NjYwMDUxNzY4Nzd9LHt4OjAuNTgyMzk4NjE5NDk5NTY4NiwgeTowLjE0NzU0MDk4MzYwNjU1NzM3fSx7eDowLjU0NjE2MDQ4MzE3NTE1MSwgeTowLjIyMDAxNzI1NjI1NTM5MjZ9LHt4OjAuNTUzMDYyOTg1MzMyMTgyOSwgeTowLjMwODg4Njk3MTUyNzE3ODZ9LHt4OjAuNjQxOTMyNzAwNjAzOTY4OSwgeTowLjMwNzE2MTM0NTk4NzkyMDZ9LHt4OjAuNjcyMTMxMTQ3NTQwOTgzNiwgeTowLjIzNzI3MzUxMTY0Nzk3MjR9LHt4OjAuNjk2Mjg5OTA1MDkwNTk1MywgeTowLjE0OTI2NjYwOTE0NTgxNTM1fSx7eDowLjc1MzIzNTU0Nzg4NjEwODcsIHk6MC4xNDU4MTUzNTgwNjcyOTk0fSx7eDowLjczNjg0MjEwNTI2MzE1NzksIHk6MC4yODgxNzk0NjUwNTYwODI4M30se3g6MC44MDMyNzg2ODg1MjQ1OTAyLCB5OjAuMzMzMDQ1NzI5MDc2NzkwM30se3g6MC44MjIyNjA1Njk0NTY0MjgsIHk6MC4yMjY5MTk3NTg0MTI0MjQ1fSx7eDowLjczOTQzMDU0MzU3MjA0NDksIHk6MC4xMjA3OTM3ODc3NDgwNTg2N30se3g6MC42NzgxNzA4MzY5MjgzODY1LCB5OjAuMTE4MjA1MzQ5NDM5MTcxN30se3g6MC42MDU2OTQ1NjQyNzk1NTE0LCB5OjAuMTMxMTQ3NTQwOTgzNjA2NTZ9KSxcbiAgbmV3IEFycmF5KHt4OjAuNTE2ODI0ODQ5MDA3NzY1MywgeTowLjI3MDA2MDM5Njg5Mzg3NH0se3g6MC41MTMzNzM1OTc5MjkyNDkzLCB5OjAuMTkwNjgxNjIyMDg4MDA2OX0se3g6MC41NjI1NTM5MjU3OTgxMDE4LCB5OjAuMTMxMTQ3NTQwOTgzNjA2NTZ9LHt4OjAuNjI4OTkwNTA5MDU5NTM0MSwgeTowLjA5ODM2MDY1NTczNzcwNDkyfSx7eDowLjcwNDA1NTIyMDAxNzI1NjMsIHk6MC4wOTIzMjA5NjYzNTAzMDE5OX0se3g6MC43NTE1MDk5MjIzNDY4NTA4LCB5OjAuMTMxMTQ3NTQwOTgzNjA2NTZ9LHt4OjAuNzg5NDczNjg0MjEwNTI2MywgeTowLjE4NzIzMDM3MTAwOTQ5MDk0fSx7eDowLjg1MzMyMTgyOTE2MzA3MTYsIHk6MC4yNTYyNTUzOTI1Nzk4MTAxN30pLFxuICBuZXcgQXJyYXkoe3g6MC44Mjc0Mzc0NDYwNzQyMDE5LCB5OjAuMTM4OTEyODU1OTEwMjY3NDd9LHt4OjAuNzYxMDAwODYyODEyNzY5NiwgeTowLjEwMDk0OTA5NDA0NjU5MTg5fSx7eDowLjcwNTc4MDg0NTU1NjUxNDIsIHk6MC4wNzY3OTAzMzY0OTY5ODAxNX0se3g6MC42MzA3MTYxMzQ1OTg3OTIsIHk6MC4wNzU5Mjc1MjM3MjczNTExNn0se3g6MC41NDg3NDg5MjE0ODQwMzgsIHk6MC4wOTE0NTgxNTM1ODA2NzN9LHt4OjAuNDk2MTE3MzQyNTM2NjY5NTYsIHk6MC4xMzIwMTAzNTM3NTMyMzU1NX0se3g6MC40ODA1ODY3MTI2ODMzNDc3NCwgeTowLjE3NTE1MDk5MjIzNDY4NTA4fSx7eDowLjUxMDc4NTE1OTYyMDM2MjQsIHk6MC4yMTU3MDMxOTI0MDcyNDc2NH0se3g6MC41NjY4Njc5ODk2NDYyNDY3LCB5OjAuMjU2MjU1MzkyNTc5ODEwMTd9LHt4OjAuNjYwMDUxNzY4NzY2MTc3OCwgeTowLjMwMzcxMDA5NDkwOTQwNDY1fSx7eDowLjczNTExNjQ3OTcyMzg5OTksIHk6MC4zMDQ1NzI5MDc2NzkwMzM2N30se3g6MC43ODQyOTY4MDc1OTI3NTIzLCB5OjAuMzIxODI5MTYzMDcxNjEzNDd9LHt4OjAuODQwMzc5NjM3NjE4NjM2OCwgeTowLjMxMTQ3NTQwOTgzNjA2NTZ9LHt4OjAuODM2MDY1NTczNzcwNDkxOCwgeTowLjE5NTg1ODQ5ODcwNTc4MDg0fSksXG4gIG5ldyBBcnJheSh7eDowLjQ3OTcyMzg5OTkxMzcxODcsIHk6MC4zMDE5ODQ0NjkzNzAxNDY2N30se3g6MC40OTA5NDA0NjU5MTg4OTU2LCB5OjAuMjA3OTM3ODc3NDgwNTg2N30se3g6MC41MzIzNTU0Nzg4NjEwODcxLCB5OjAuMTI0MjQ1MDM4ODI2NTc0NjN9LHt4OjAuNjM5MzQ0MjYyMjk1MDgyLCB5OjAuMDg4ODY5NzE1MjcxNzg2MDN9LHt4OjAuNzczOTQzMDU0MzU3MjA0NSwgeTowLjA5OTIyMzQ2ODUwNzMzMzl9LHt4OjAuODQ3MjgyMTM5Nzc1NjY4NywgeTowLjE1NDQ0MzQ4NTc2MzU4OTN9LHt4OjAuODcwNTc4MDg0NTU1NjUxNCwgeTowLjI3MDkyMzIwOTY2MzUwMzAzfSx7eDowLjg0NDY5MzcwMTQ2Njc4MTcsIHk6MC4zMjQ0MTc2MDEzODA1MDA0fSx7eDowLjcyODIxMzk3NzU2Njg2OCwgeTowLjM0NTk4NzkyMDYyMTIyNTJ9LHt4OjAuNTMyMzU1NDc4ODYxMDg3MSwgeTowLjM0MDgxMTA0NDAwMzQ1MTI1fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjQ4MjI4ODEzNTU5MzIyMDM3LCB5OjAuMjAxNjk0OTE1MjU0MjM3M30se3g6MC40MjA0MjM3Mjg4MTM1NTk0LCB5OjAuMjA0MjM3Mjg4MTM1NTkzMjJ9LHt4OjAuMzc0NjYxMDE2OTQ5MTUyNTUsIHk6MC4yMDU5MzIyMDMzODk4MzA1fSx7eDowLjMwMjYyNzExODY0NDA2NzgsIHk6MC4yMDc2MjcxMTg2NDQwNjc4fSx7eDowLjI4OTkxNTI1NDIzNzI4ODE0LCB5OjAuMjE1MjU0MjM3Mjg4MTM1NTl9LHt4OjAuMjg0ODMwNTA4NDc0NTc2MywgeTowLjIyNzk2NjEwMTY5NDkxNTI0fSx7eDowLjI4MjI4ODEzNTU5MzIyMDM2LCB5OjAuMjUxNjk0OTE1MjU0MjM3MjZ9LHt4OjAuMjc0NjYxMDE2OTQ5MTUyNTcsIHk6MC4yNjY5NDkxNTI1NDIzNzI5fSx7eDowLjI1NjAxNjk0OTE1MjU0MjQsIHk6MC4yNjk0OTE1MjU0MjM3Mjg4NH0se3g6MC4wNzIxMTg2NDQwNjc3OTY2MywgeTowLjI3MjAzMzg5ODMwNTA4NDczfSx7eDowLjA1NTE2OTQ5MTUyNTQyMzczLCB5OjAuMjgwNTA4NDc0NTc2MjcxMn0se3g6MC4wNTAwODQ3NDU3NjI3MTE4NjYsIHk6MC4zMDMzODk4MzA1MDg0NzQ1N30se3g6MC4wNDc1NDIzNzI4ODEzNTU5NDYsIHk6MC40MjQ1NzYyNzExODY0NDA3fSx7eDowLjA0OTIzNzI4ODEzNTU5MzIzNSwgeTowLjQ5ODMwNTA4NDc0NTc2Mjc0fSx7eDowLjA1Njg2NDQwNjc3OTY2MTAyLCB5OjAuNTEzNTU5MzIyMDMzODk4M30se3g6MC4wNjk1NzYyNzExODY0NDA2OCwgeTowLjUxODY0NDA2Nzc5NjYxMDJ9LHt4OjAuMDkyNDU3NjI3MTE4NjQ0MDcsIHk6MC41MjExODY0NDA2Nzc5NjYyfSx7eDowLjEwOTQwNjc3OTY2MTAxNjk2LCB5OjAuNTI2MjcxMTg2NDQwNjc3OX0se3g6MC4xMTQ0OTE1MjU0MjM3Mjg4MywgeTowLjU0MjM3Mjg4MTM1NTkzMjJ9LHt4OjAuMTE0NDkxNTI1NDIzNzI4ODMsIHk6MC41NTkzMjIwMzM4OTgzMDV9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMyA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMTEsIHk6MC42Mn0sIHt4OjAuMTIsIHk6MC42OH0sIHt4OjAuMTMsIHk6MC43Mn0sIHt4OjAuMTQsIHk6MC42OH0sIHt4OjAuMTMsIHk6MC42Mn0sIHt4OjAuMTEsIHk6MC42fSksXG4gIG5ldyBBcnJheSh7eDowLjA4LCB5OjAuNn0sIHt4OjAuMDksIHk6MC41OH0sIHt4OjAuMSwgeTowLjUyfSwge3g6MC4xMiwgeTowLjU4fSwge3g6MC4xMywgeTowLjY0fSwge3g6MC4wOSwgeTowLjYyfSksXG4gIG5ldyBBcnJheSh7eDowLjEzLCB5OjAuNjh9LCB7eDowLjEyLCB5OjAuNjJ9LCB7eDowLjExLCB5OjAuNTh9LCB7eDowLjEyLCB5OjAuNTd9LCB7eDowLjEzLCB5OjAuNTh9LCB7eDowLjExLCB5OjAuNjJ9KSxcbiAgbmV3IEFycmF5KHt4OjAuMTI3OTY2MTAxNjk0OTE1MjYsIHk6MC42MTk0OTE1MjU0MjM3Mjg4fSx7eDowLjExOTQ5MTUyNTQyMzcyODgyLCB5OjAuNjMyMjAzMzg5ODMwNTA4NX0se3g6MC4xMTAxNjk0OTE1MjU0MjM3MywgeTowLjY1NDIzNzI4ODEzNTU5MzJ9LHt4OjAuMSwgeTowLjY3OTY2MTAxNjk0OTE1MjZ9LHt4OjAuMTA2Nzc5NjYxMDE2OTQ5MTUsIHk6MC43MTAxNjk0OTE1MjU0MjM3fSx7eDowLjEzNTU5MzIyMDMzODk4MzA1LCB5OjAuNzExMDE2OTQ5MTUyNTQyM30se3g6MC4xNDU3NjI3MTE4NjQ0MDY3OSwgeTowLjY4MTM1NTkzMjIwMzM4OTl9LHt4OjAuMTQ2NjEwMTY5NDkxNTI1NDIsIHk6MC42NDU3NjI3MTE4NjQ0MDY4fSx7eDowLjE0MjM3Mjg4MTM1NTkzMjIsIHk6MC41ODIyMDMzODk4MzA1MDg1fSx7eDowLjEzMzg5ODMwNTA4NDc0NTc2LCB5OjAuNTU5MzIyMDMzODk4MzA1fSx7eDowLjEwNzYyNzExODY0NDA2Nzc5LCB5OjAuNTY2OTQ5MTUyNTQyMzcyOX0se3g6MC4xMDkzMjIwMzM4OTgzMDUwOCwgeTowLjU5OTE1MjU0MjM3Mjg4MTR9KSxcbiAgbmV3IEFycmF5KHt4OjAuMTQ0OTE1MjU0MjM3Mjg4MTMsIHk6MC41Nzk2NjEwMTY5NDkxNTI1fSx7eDowLjE0OTE1MjU0MjM3Mjg4MTM2LCB5OjAuNTYwMTY5NDkxNTI1NDIzN30se3g6MC4xMjc5NjYxMDE2OTQ5MTUyNiwgeTowLjU1fSx7eDowLjExMjcxMTg2NDQwNjc3OTY2LCB5OjAuNTU2Nzc5NjYxMDE2OTQ5Mn0se3g6MC4xMzY0NDA2Nzc5NjYxMDE2OCwgeTowLjU5OTE1MjU0MjM3Mjg4MTR9LHt4OjAuMTE2MTAxNjk0OTE1MjU0MjQsIHk6MC42MjQ1NzYyNzExODY0NDA3fSx7eDowLjEwMzM4OTgzMDUwODQ3NDU3LCB5OjAuNjYzNTU5MzIyMDMzODk4M30se3g6MC4xMjAzMzg5ODMwNTA4NDc0NiwgeTowLjY3NTQyMzcyODgxMzU1OTN9LHt4OjAuMTQ1NzYyNzExODY0NDA2NzksIHk6MC42OTQ5MTUyNTQyMzcyODgyfSx7eDowLjEyNjI3MTE4NjQ0MDY3Nzk3LCB5OjAuNzE1MjU0MjM3Mjg4MTM1Nn0se3g6MC4xMDc2MjcxMTg2NDQwNjc3OSwgeTowLjY4ODEzNTU5MzIyMDMzOX0se3g6MC4xMjQ1NzYyNzExODY0NDA2OCwgeTowLjYyODgxMzU1OTMyMjAzMzl9LHt4OjAuMTM4MTM1NTkzMjIwMzM4OTcsIHk6MC41ODY0NDA2Nzc5NjYxMDE3fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTQgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjExNjE4NjQ0MDY3Nzk2NjEyLCB5OjAuNzExODY0NDA2Nzc5NjYxfSwge3g6MC4xMTM2NDQwNjc3OTY2MTAxNywgeTowLjczOTgzMDUwODQ3NDU3NjN9LCB7eDowLjExMzY0NDA2Nzc5NjYxMDE3LCB5OjAuNzU4NDc0NTc2MjcxMTg2NH0sIHt4OjAuMTEzNjQ0MDY3Nzk2NjEwMTcsIHk6MC43NzExODY0NDA2Nzc5NjYyfSwge3g6MC4xMTM2NDQwNjc3OTY2MTAxNywgeTowLjc5MTUyNTQyMzcyODgxMzV9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMTEsIHk6MC44Mn0sIHt4OjAuMTIsIHk6MC44OH0sIHt4OjAuMTMsIHk6MC45Mn0sIHt4OjAuMTQsIHk6MC44OH0sIHt4OjAuMTMsIHk6MC44Mn0sIHt4OjAuMTEsIHk6MC44fSksXG4gIG5ldyBBcnJheSh7eDowLjA4LCB5OjAuOH0sIHt4OjAuMDksIHk6MC43OH0sIHt4OjAuMSwgeTowLjgyfSwge3g6MC4xMiwgeTowLjc4fSwge3g6MC4xMywgeTowLjg0fSwge3g6MC4wOSwgeTowLjgyfSksXG4gIG5ldyBBcnJheSh7eDowLjEzLCB5OjAuODh9LCB7eDowLjEyLCB5OjAuODJ9LCB7eDowLjExLCB5OjAuNzh9LCB7eDowLjEyLCB5OjAuNzd9LCB7eDowLjEzLCB5OjAuNzh9LCB7eDowLjExLCB5OjAuODJ9KSxcbiAgbmV3IEFycmF5KHt4OjAuMTQ3NDU3NjI3MTE4NjQ0MDcsIHk6MC43Njk0OTE1MjU0MjM3Mjg4fSx7eDowLjExNjk0OTE1MjU0MjM3Mjg4LCB5OjAuNzcyODgxMzU1OTMyMjAzNH0se3g6MC4wOTU3NjI3MTE4NjQ0MDY3OCwgeTowLjc4MTM1NTkzMjIwMzM4OTh9LHt4OjAuMDg0NzQ1NzYyNzExODY0NCwgeTowLjgwNjc3OTY2MTAxNjk0OTJ9LHt4OjAuMSwgeTowLjgzNzI4ODEzNTU5MzIyMDR9LHt4OjAuMTMzODk4MzA1MDg0NzQ1NzYsIHk6MC44NTMzODk4MzA1MDg0NzQ2fSx7eDowLjE1MTY5NDkxNTI1NDIzNzI4LCB5OjAuODM4MTM1NTkzMjIwMzM5fSx7eDowLjE2MzU1OTMyMjAzMzg5ODMsIHk6MC44MDI1NDIzNzI4ODEzNTU5fSksXG4gIG5ldyBBcnJheSh7eDowLjExNTI1NDIzNzI4ODEzNTYsIHk6MC44NTA4NDc0NTc2MjcxMTg3fSx7eDowLjA5MDY3Nzk2NjEwMTY5NDkyLCB5OjAuODIwMzM4OTgzMDUwODQ3NH0se3g6MC4wOTgzMDUwODQ3NDU3NjI3MiwgeTowLjc5NTc2MjcxMTg2NDQwNjd9LHt4OjAuMTEyNzExODY0NDA2Nzc5NjYsIHk6MC43NzU0MjM3Mjg4MTM1NTk0fSx7eDowLjEzODk4MzA1MDg0NzQ1NzYzLCB5OjAuNzc5NjYxMDE2OTQ5MTUyNn0se3g6MC4xMzU1OTMyMjAzMzg5ODMwNSwgeTowLjgwMzM4OTgzMDUwODQ3NDZ9LHt4OjAuMTQ3NDU3NjI3MTE4NjQ0MDcsIHk6MC44MjcxMTg2NDQwNjc3OTY2fSx7eDowLjEyNjI3MTE4NjQ0MDY3Nzk3LCB5OjAuODQ5MTUyNTQyMzcyODgxNH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4xMDY5NDkxNTI1NDIzNzI4NywgeTowLjgyMjAzMzg5ODMwNTA4NDh9LHt4OjAuMTAyNzExODY0NDA2Nzc5NjcsIHk6MC44MzQ3NDU3NjI3MTE4NjQ0fSx7eDowLjEwNjk0OTE1MjU0MjM3Mjg3LCB5OjAuODQ4MzA1MDg0NzQ1NzYyN30se3g6MC4xMDc3OTY2MTAxNjk0OTE1MywgeTowLjg3OTY2MTAxNjk0OTE1MjZ9LHt4OjAuMTA3Nzk2NjEwMTY5NDkxNTMsIHk6MC45MDMzODk4MzA1MDg0NzQ1fSx7eDowLjEwNzc5NjYxMDE2OTQ5MTUzLCB5OjAuOTI3OTY2MTAxNjk0OTE1Mn0se3g6MC4xMDk0OTE1MjU0MjM3Mjg4MiwgeTowLjk1NTA4NDc0NTc2MjcxMTl9LHt4OjAuMTEzNzI4ODEzNTU5MzIyMDMsIHk6MC45NzExODY0NDA2Nzc5NjYxfSx7eDowLjEyMzA1MDg0NzQ1NzYyNzExLCB5OjAuOTc4ODEzNTU5MzIyMDMzOH0se3g6MC4xNDE2OTQ5MTUyNTQyMzcyNywgeTowLjk4MjIwMzM4OTgzMDUwODV9LHt4OjAuMTY5NjYxMDE2OTQ5MTUyNTMsIHk6MC45ODMwNTA4NDc0NTc2MjcyfSx7eDowLjE5NTA4NDc0NTc2MjcxMTksIHk6MC45ODMwNTA4NDc0NTc2MjcyfSx7eDowLjIyMzg5ODMwNTA4NDc0NTc5LCB5OjAuOTgwNTA4NDc0NTc2MjcxMn0se3g6MC4yNDU5MzIyMDMzODk4MzA1MiwgeTowLjk4MDUwODQ3NDU3NjI3MTJ9LHt4OjAuMjU4NjQ0MDY3Nzk2NjEwMiwgeTowLjk4Mzg5ODMwNTA4NDc0NTd9LHt4OjAuMjY0NTc2MjcxMTg2NDQwNjcsIHk6MC45ODg5ODMwNTA4NDc0NTc2fSx7eDowLjI3MDUwODQ3NDU3NjI3MTIsIHk6MS4wMDE2OTQ5MTUyNTQyMzc0fSx7eDowLjI3MzA1MDg0NzQ1NzYyNzE0LCB5OjEuMDI0NTc2MjcxMTg2NDQwNn0se3g6MC4yNzcyODgxMzU1OTMyMjAzNSwgeToxLjA0MTUyNTQyMzcyODgxMzZ9LHt4OjAuMjg1NzYyNzExODY0NDA2NzcsIHk6MS4wNDc0NTc2MjcxMTg2NDR9LHt4OjAuMzA0NDA2Nzc5NjYxMDE3LCB5OjEuMDV9LHt4OjAuMzQ4NDc0NTc2MjcxMTg2NDQsIHk6MS4wNDkxNTI1NDIzNzI4ODE0fSx7eDowLjM4MDY3Nzk2NjEwMTY5NDksIHk6MS4wNDkxNTI1NDIzNzI4ODE0fSx7eDowLjQwODY0NDA2Nzc5NjYxMDIsIHk6MS4wNDkxNTI1NDIzNzI4ODE0fSx7eDowLjQyMTM1NTkzMjIwMzM4OTg1LCB5OjEuMDU1OTMyMjAzMzg5ODMwNH0se3g6MC40Mjg5ODMwNTA4NDc0NTc3LCB5OjEuMDY2OTQ5MTUyNTQyMzcyOX0se3g6MC40MzA2Nzc5NjYxMDE2OTQ5NSwgeToxLjA4ODEzNTU5MzIyMDMzOX0se3g6MC40Mjg5ODMwNTA4NDc0NTc3LCB5OjEuMTE0NDA2Nzc5NjYxMDE2OX0se3g6MC40MjgxMzU1OTMyMjAzMzksIHk6MS4xNTU5MzIyMDMzODk4MzA1fSx7eDowLjQzMjM3Mjg4MTM1NTkzMjIsIHk6MS4xOTA2Nzc5NjYxMDE2OTQ5fSx7eDowLjQyOTgzMDUwODQ3NDU3NjI3LCB5OjEuMjA1OTMyMjAzMzg5ODMwNX0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2U3ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC40MTAxNjk0OTE1MjU0MjM3LCB5OjEuMTg4MTM1NTkzMjIwMzM5fSx7eDowLjM4MjIwMzM4OTgzMDUwODUsIHk6MS4yMTAxNjk0OTE1MjU0MjM3fSx7eDowLjM3NTQyMzcyODgxMzU1OTM0LCB5OjEuMjU1MDg0NzQ1NzYyNzEyfSx7eDowLjM5MTUyNTQyMzcyODgxMzU1LCB5OjEuMjkyMzcyODgxMzU1OTMyM30se3g6MC40MzcyODgxMzU1OTMyMjAzMywgeToxLjMxNTI1NDIzNzI4ODEzNTV9LHt4OjAuNDc0NTc2MjcxMTg2NDQwNywgeToxLjMwNjc3OTY2MTAxNjk0OX0se3g6MC41LCB5OjEuMjc2MjcxMTg2NDQwNjc4fSx7eDowLjUwNTkzMjIwMzM4OTgzMDUsIHk6MS4yMzMwNTA4NDc0NTc2MjcyfSx7eDowLjQ2Nzc5NjYxMDE2OTQ5MTUzLCB5OjEuMTgzODk4MzA1MDg0NzQ1OH0pLFxuICBuZXcgQXJyYXkoe3g6MC40NjAxNjk0OTE1MjU0MjM3NSwgeToxLjIzNzI4ODEzNTU5MzIyMDR9LHt4OjAuNDc2MjcxMTg2NDQwNjc3OTUsIHk6MS4yNTg0NzQ1NzYyNzExODY0fSx7eDowLjQ3Mjg4MTM1NTkzMjIwMzQsIHk6MS4zMDA4NDc0NTc2MjcxMTg3fSx7eDowLjQyMDMzODk4MzA1MDg0NzQ0LCB5OjEuMzA4NDc0NTc2MjcxMTg2NX0se3g6MC4zODgxMzU1OTMyMjAzMzg5NywgeToxLjI2ODY0NDA2Nzc5NjYxMDJ9LHt4OjAuNDA0MjM3Mjg4MTM1NTkzMjMsIHk6MS4yMzgxMzU1OTMyMjAzMzl9LHt4OjAuNDUwODQ3NDU3NjI3MTE4NjQsIHk6MS4yNjI3MTE4NjQ0MDY3Nzk2fSx7eDowLjQ5NDkxNTI1NDIzNzI4ODE2LCB5OjEuMjQ0OTE1MjU0MjM3Mjg4fSx7eDowLjUwODQ3NDU3NjI3MTE4NjQsIHk6MS4yMTUyNTQyMzcyODgxMzU2fSx7eDowLjQ3OTY2MTAxNjk0OTE1MjUzLCB5OjEuMTgxMzU1OTMyMjAzMzg5N30pLFxuICBuZXcgQXJyYXkoe3g6MC40MTI3MTE4NjQ0MDY3Nzk2NSwgeToxLjE5MjM3Mjg4MTM1NTkzMjJ9LHt4OjAuNDcyODgxMzU1OTMyMjAzNCwgeToxLjJ9LHt4OjAuNTA1OTMyMjAzMzg5ODMwNSwgeToxLjI0ODMwNTA4NDc0NTc2MjZ9LHt4OjAuNTAzMzg5ODMwNTA4NDc0NSwgeToxLjI5NDkxNTI1NDIzNzI4ODF9LHt4OjAuNDM3Mjg4MTM1NTkzMjIwMzMsIHk6MS4zfSx7eDowLjM4NTU5MzIyMDMzODk4MzEsIHk6MS4yODQ3NDU3NjI3MTE4NjQ0fSx7eDowLjM3NjI3MTE4NjQ0MDY3OCwgeToxLjI0MjM3Mjg4MTM1NTkzMjN9LHt4OjAuNDIzNzI4ODEzNTU5MzIyLCB5OjEuMjQ3NDU3NjI3MTE4NjQ0Mn0se3g6MC40NjUyNTQyMzcyODgxMzU2LCB5OjEuMjE5NDkxNTI1NDIzNzI4OX0se3g6MC40MTY5NDkxNTI1NDIzNzI4NiwgeToxLjE4NzI4ODEzNTU5MzIyMDN9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOCA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuNDg3NDU3NjI3MTE4NjQ0MDQsIHk6MS4yNTA4NDc0NTc2MjcxMTg3fSx7eDowLjUwODY0NDA2Nzc5NjYxMDIsIHk6MS4yNTA4NDc0NTc2MjcxMTg3fSx7eDowLjUzMjM3Mjg4MTM1NTkzMjIsIHk6MS4yNDkxNTI1NDIzNzI4ODEzfSx7eDowLjU0MjU0MjM3Mjg4MTM1NiwgeToxLjI1MTY5NDkxNTI1NDIzNzR9LHt4OjAuNTQ5MzIyMDMzODk4MzA1MSwgeToxLjI1ODQ3NDU3NjI3MTE4NjR9LHt4OjAuNTUxODY0NDA2Nzc5NjYxLCB5OjEuMjcxMTg2NDQwNjc3OTY2fSx7eDowLjU1MTg2NDQwNjc3OTY2MSwgeToxLjI4NTU5MzIyMDMzODk4M30se3g6MC41NTE4NjQ0MDY3Nzk2NjEsIHk6MS4zMTM1NTkzMjIwMzM4OTg0fSx7eDowLjU1MTg2NDQwNjc3OTY2MSwgeToxLjM0MzIyMDMzODk4MzA1MDh9LHt4OjAuNTU2MTAxNjk0OTE1MjU0MywgeToxLjM1MDg0NzQ1NzYyNzExODZ9LHt4OjAuNTYyMDMzODk4MzA1MDg0OCwgeToxLjM2NDQwNjc3OTY2MTAxNjl9LHt4OjAuNTc3Mjg4MTM1NTkzMjIwMywgeToxLjM2ODY0NDA2Nzc5NjYxfSx7eDowLjU5NTkzMjIwMzM4OTgzMDYsIHk6MS4zNjk0OTE1MjU0MjM3Mjg4fSx7eDowLjYxMDMzODk4MzA1MDg0NzQsIHk6MS4zNjUyNTQyMzcyODgxMzU2fSx7eDowLjYyMDUwODQ3NDU3NjI3MTIsIHk6MS4zNTg0NzQ1NzYyNzExODY1fSx7eDowLjYyNTU5MzIyMDMzODk4MywgeToxLjM0NTc2MjcxMTg2NDQwNjl9LHt4OjAuNjI4MTM1NTkzMjIwMzM5LCB5OjEuMzE5NDkxNTI1NDIzNzI4N30se3g6MC42MjcyODgxMzU1OTMyMjA0LCB5OjEuMjk1NzYyNzExODY0NDA2OH0se3g6MC42MjQ3NDU3NjI3MTE4NjQ0LCB5OjEuMjY2MTAxNjk0OTE1MjU0MX0se3g6MC42MjM4OTgzMDUwODQ3NDU4LCB5OjEuMjM4MTM1NTkzMjIwMzM5fSx7eDowLjYyODk4MzA1MDg0NzQ1NzYsIHk6MS4yMjcxMTg2NDQwNjc3OTY2fSx7eDowLjYyNzI4ODEzNTU5MzIyMDQsIHk6MS4yMTM1NTkzMjIwMzM4OTgzfSx7eDowLjYyNTU5MzIyMDMzODk4MywgeToxLjIwMTY5NDkxNTI1NDIzNzN9LHt4OjAuNjI4OTgzMDUwODQ3NDU3NiwgeToxLjE5NDA2Nzc5NjYxMDE2OTZ9LHt4OjAuNjM4MzA1MDg0NzQ1NzYyOCwgeToxLjE4NzI4ODEzNTU5MzIyMDN9LHt4OjAuNjY5NjYxMDE2OTQ5MTUyNiwgeToxLjE4ODk4MzA1MDg0NzQ1Nzd9LHt4OjAuNjk1OTMyMjAzMzg5ODMwNSwgeToxLjE4NzI4ODEzNTU5MzIyMDN9LHt4OjAuNzE4ODEzNTU5MzIyMDM0LCB5OjEuMTg2NDQwNjc3OTY2MTAxNn0se3g6MC43MzMyMjAzMzg5ODMwNTA4LCB5OjEuMTkyMzcyODgxMzU1OTMyMn0se3g6MC43MzQ5MTUyNTQyMzcyODgxLCB5OjEuMjA0MjM3Mjg4MTM1NTkzMn0se3g6MC43MzQ5MTUyNTQyMzcyODgxLCB5OjEuMjIyMDMzODk4MzA1MDg0N30se3g6MC43MzE1MjU0MjM3Mjg4MTM2LCB5OjEuMjYwMTY5NDkxNTI1NDIzOH0se3g6MC43MzA2Nzc5NjYxMDE2OTQ5LCB5OjEuMjk0MDY3Nzk2NjEwMTY5NX0se3g6MC43MzMyMjAzMzg5ODMwNTA4LCB5OjEuMzEwMTY5NDkxNTI1NDIzOH0se3g6MC43MzQ5MTUyNTQyMzcyODgxLCB5OjEuMzM5ODMwNTA4NDc0NTc2M30se3g6MC43NDA4NDc0NTc2MjcxMTg3LCB5OjEuMzU3NjI3MTE4NjQ0MDY3OH0se3g6MC43NTYxMDE2OTQ5MTUyNTQzLCB5OjEuMzYzNTU5MzIyMDMzODk4NH0se3g6MC43ODkxNTI1NDIzNzI4ODEzLCB5OjEuMzY0NDA2Nzc5NjYxMDE2OX0se3g6MC44MTM3Mjg4MTM1NTkzMjIsIHk6MS4zNjM1NTkzMjIwMzM4OTg0fSx7eDowLjgyMjIwMzM4OTgzMDUwODQsIHk6MS4zNjE4NjQ0MDY3Nzk2NjF9LHt4OjAuODMxNTI1NDIzNzI4ODEzNiwgeToxLjM2Nzc5NjYxMDE2OTQ5MTZ9LHt4OjAuODQsIHk6MS4zODA1MDg0NzQ1NzYyNzEyfSx7eDowLjg0MTY5NDkxNTI1NDIzNzMsIHk6MS40MDI1NDIzNzI4ODEzNTZ9LHt4OjAuODM5MTUyNTQyMzcyODgxNCwgeToxLjQyOTY2MTAxNjk0OTE1MjZ9LHt4OjAuODQxNjk0OTE1MjU0MjM3MywgeToxLjQ1NDIzNzI4ODEzNTU5MzJ9LHt4OjAuODM3NDU3NjI3MTE4NjQ0MSwgeToxLjQ5MTUyNTQyMzcyODgxMzZ9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuODA5NDIzNzI4ODEzNTU5MywgeToxLjUxODA1OTMyMjAzMzg5ODN9LHt4OjAuODI4MDY3Nzk2NjEwMTY5NSwgeToxLjU0MTc4ODEzNTU5MzIyMDR9LHt4OjAuODU5NDIzNzI4ODEzNTU5MywgeToxLjU1NTM0NzQ1NzYyNzExODd9LHt4OjAuODc5NzYyNzExODY0NDA2OCwgeToxLjU0MDk0MDY3Nzk2NjEwMTd9LHt4OjAuODg0ODQ3NDU3NjI3MTE4NiwgeToxLjUyNjUzMzg5ODMwNTA4NDd9LHt4OjAuODc3MjIwMzM4OTgzMDUwOSwgeToxLjUwNzA0MjM3Mjg4MTM1NTh9LHt4OjAuODU3NzI4ODEzNTU5MzIyMSwgeToxLjQ5MDk0MDY3Nzk2NjEwMTZ9KSxcbiAgbmV3IEFycmF5KHt4OjAuODY3ODk4MzA1MDg0NzQ1NywgeToxLjUzOTI0NTc2MjcxMTg2NDN9LHt4OjAuODc1NTI1NDIzNzI4ODEzNiwgeToxLjUyNTY4NjQ0MDY3Nzk2Nn0se3g6MC44NTUxODY0NDA2Nzc5NjYxLCB5OjEuNTE0NjY5NDkxNTI1NDIzN30se3g6MC44MzY1NDIzNzI4ODEzNTU5LCB5OjEuNTE0NjY5NDkxNTI1NDIzN30se3g6MC44MjQ2Nzc5NjYxMDE2OTQ5LCB5OjEuNTI4MjI4ODEzNTU5MzIyfSx7eDowLjgxNTM1NTkzMjIwMzM4OTksIHk6MS41Mzc1NTA4NDc0NTc2MjcyfSx7eDowLjgwMzQ5MTUyNTQyMzcyODgsIHk6MS41MjQ4Mzg5ODMwNTA4NDczfSx7eDowLjgwODU3NjI3MTE4NjQ0MDcsIHk6MS40OTc3MjAzMzg5ODMwNTF9LHt4OjAuODMxNDU3NjI3MTE4NjQ0LCB5OjEuNDkwMDkzMjIwMzM4OTgzfSx7eDowLjg1NjAzMzg5ODMwNTA4NDcsIHk6MS41MDI4MDUwODQ3NDU3NjI2fSksXG4gIG5ldyBBcnJheSh7eDowLjg0NTAxNjk0OTE1MjU0MjMsIHk6MS40ODQxNjEwMTY5NDkxNTI2fSx7eDowLjg1NjAzMzg5ODMwNTA4NDcsIHk6MS41MDE5NTc2MjcxMTg2NDQxfSx7eDowLjg2NjIwMzM4OTgzMDUwODUsIHk6MS41MjE0NDkxNTI1NDIzNzI4fSx7eDowLjg2NzA1MDg0NzQ1NzYyNzEsIHk6MS41MzUwMDg0NzQ1NzYyNzF9LHt4OjAuODUwOTQ5MTUyNTQyMzcyOSwgeToxLjU0MTc4ODEzNTU5MzIyMDR9LHt4OjAuODI3MjIwMzM4OTgzMDUwOCwgeToxLjUzNTg1NTkzMjIwMzM4OTh9LHt4OjAuODA3NzI4ODEzNTU5MzIyLCB5OjEuNTIwNjAxNjk0OTE1MjU0fSx7eDowLjgxMDI3MTE4NjQ0MDY3OCwgeToxLjUwNDV9LHt4OjAuODMzMTUyNTQyMzcyODgxNCwgeToxLjUwMjgwNTA4NDc0NTc2MjZ9LHt4OjAuODUwOTQ5MTUyNTQyMzcyOSwgeToxLjUxNTUxNjk0OTE1MjU0MjR9LHt4OjAuODczODMwNTA4NDc0NTc2MiwgeToxLjUxMjk3NDU3NjI3MTE4NjR9LHt4OjAuODcwNDQwNjc3OTY2MTAxNywgeToxLjUwMDI2MjcxMTg2NDQwNjd9LHt4OjAuODU1MTg2NDQwNjc3OTY2MSwgeToxLjQ5MTc4ODEzNTU5MzIyMDN9LHt4OjAuODQzMzIyMDMzODk4MzA1MSwgeToxLjQ4MzMxMzU1OTMyMjAzNH0pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMCA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuODM2NjEwMTY5NDkxNTI1NCwgeToxLjUxODY0NDA2Nzc5NjYxMDJ9LHt4OjAuODQ2Nzc5NjYxMDE2OTQ5MSwgeToxLjUyNDU3NjI3MTE4NjQ0MDZ9LHt4OjAuODQ0MjM3Mjg4MTM1NTkzMywgeToxLjU0NDA2Nzc5NjYxMDE2OTV9LHt4OjAuODQxNjk0OTE1MjU0MjM3MywgeToxLjU4MDUwODQ3NDU3NjI3MTJ9LHt4OjAuODM4MzA1MDg0NzQ1NzYyNywgeToxLjYxMTg2NDQwNjc3OTY2MX0se3g6MC44NDQyMzcyODgxMzU1OTMzLCB5OjEuNjM3Mjg4MTM1NTkzMjIwM30se3g6MC44NDE2OTQ5MTUyNTQyMzczLCB5OjEuNjU4NDc0NTc2MjcxMTg2Nn0se3g6MC44NDU5MzIyMDMzODk4MzA2LCB5OjEuNjg1NTkzMjIwMzM4OTgzfSx7eDowLjg0NTA4NDc0NTc2MjcxMTksIHk6MS43MTEwMTY5NDkxNTI1NDI0fSx7eDowLjg0NDIzNzI4ODEzNTU5MzMsIHk6MS43Mjk2NjEwMTY5NDkxNTI2fSx7eDowLjg0MTY5NDkxNTI1NDIzNzMsIHk6MS43NTY3Nzk2NjEwMTY5NDl9LHt4OjAuODM5MTUyNTQyMzcyODgxNCwgeToxLjc3NTQyMzcyODgxMzU1OTN9LHt4OjAuODQ2Nzc5NjYxMDE2OTQ5MSwgeToxLjc5MzIyMDMzODk4MzA1MDh9LHt4OjAuODQ2Nzc5NjYxMDE2OTQ5MSwgeToxLjgwNTkzMjIwMzM4OTgzMDR9LHt4OjAuODQ2Nzc5NjYxMDE2OTQ5MSwgeToxLjgyMjAzMzg5ODMwNTA4NDh9LHt4OjAuODQ1MDg0NzQ1NzYyNzExOSwgeToxLjg0OTE1MjU0MjM3Mjg4MTR9LHt4OjAuODQyNTQyMzcyODgxMzU1OSwgeToxLjg2NjEwMTY5NDkxNTI1NDJ9LHt4OjAuODQzMzg5ODMwNTA4NDc0NiwgeToxLjg4MjIwMzM4OTgzMDUwODR9LHt4OjAuODQ0MjM3Mjg4MTM1NTkzMywgeToxLjg5NDkxNTI1NDIzNzI4ODJ9LHt4OjAuODQsIHk6MS45MDU5MzIyMDMzODk4MzA1fSx7eDowLjgyODEzNTU5MzIyMDMzOSwgeToxLjkxMTg2NDQwNjc3OTY2MX0se3g6MC44MTM3Mjg4MTM1NTkzMjIsIHk6MS45MTI3MTE4NjQ0MDY3Nzk4fSx7eDowLjc5NzYyNzExODY0NDA2NzgsIHk6MS45MTQ0MDY3Nzk2NjEwMTd9LHt4OjAuNzg0OTE1MjU0MjM3Mjg4MSwgeToxLjkyMTE4NjQ0MDY3Nzk2NjJ9LHt4OjAuNzc4OTgzMDUwODQ3NDU3NywgeToxLjkzNTU5MzIyMDMzODk4M30se3g6MC43NzcyODgxMzU1OTMyMjAzLCB5OjEuOTUyNTQyMzcyODgxMzU2fSx7eDowLjc3OTgzMDUwODQ3NDU3NjIsIHk6Mi4wMDY3Nzk2NjEwMTY5NDl9LHt4OjAuNzc0NzQ1NzYyNzExODY0NSwgeToyLjA4MzA1MDg0NzQ1NzYyNzN9LHt4OjAuNzc3Mjg4MTM1NTkzMjIwMywgeToyLjExODY0NDA2Nzc5NjYxMDN9LHt4OjAuNzc2NDQwNjc3OTY2MTAxNywgeToyLjEzNjQ0MDY3Nzk2NjEwMn0se3g6MC43NjQ1NzYyNzExODY0NDA3LCB5OjIuMTQ0OTE1MjU0MjM3Mjg4Mn0se3g6MC43NDUwODQ3NDU3NjI3MTE5LCB5OjIuMTQ3NDU3NjI3MTE4NjQ0fSx7eDowLjczNDkxNTI1NDIzNzI4ODEsIHk6Mi4xNDQ5MTUyNTQyMzcyODgyfSx7eDowLjczMDY3Nzk2NjEwMTY5NDksIHk6Mi4xMzg5ODMwNTA4NDc0NTc0fSx7eDowLjcyMjIwMzM4OTgzMDUwODUsIHk6Mi4xNTA4NDc0NTc2MjcxMTg2fSx7eDowLjcxODgxMzU1OTMyMjAzNCwgeToyLjEzNzI4ODEzNTU5MzIyMDV9LHt4OjAuNzEyMDMzODk4MzA1MDg0OCwgeToyLjE1MjU0MjM3Mjg4MTM1Nn0se3g6MC43MDc3OTY2MTAxNjk0OTE2LCB5OjIuMTM4OTgzMDUwODQ3NDU3NH0se3g6MC43MDEwMTY5NDkxNTI1NDI0LCB5OjIuMTUwODQ3NDU3NjI3MTE4Nn0se3g6MC42OTU5MzIyMDMzODk4MzA1LCB5OjIuMTM3Mjg4MTM1NTkzMjIwNX0se3g6MC42OTAwMDAwMDAwMDAwMDAxLCB5OjIuMTUzMzg5ODMwNTA4NDc0N30se3g6MC42ODU3NjI3MTE4NjQ0MDY3LCB5OjIuMTM2NDQwNjc3OTY2MTAyfSx7eDowLjY4MDY3Nzk2NjEwMTY5NSwgeToyLjE1MDg0NzQ1NzYyNzExODZ9LHt4OjAuNjc2NDQwNjc3OTY2MTAxNywgeToyLjEzNjQ0MDY3Nzk2NjEwMn0se3g6MC42Njc5NjYxMDE2OTQ5MTUyLCB5OjIuMTUyNTQyMzcyODgxMzU2fSx7eDowLjY2NDU3NjI3MTE4NjQ0MDcsIHk6Mi4xMzcyODgxMzU1OTMyMjA1fSx7eDowLjY1MzU1OTMyMjAzMzg5ODMsIHk6Mi4xNDU3NjI3MTE4NjQ0MDd9LHt4OjAuNjMzMjIwMzM4OTgzMDUwOSwgeToyLjE0NjYxMDE2OTQ5MTUyNTZ9LHt4OjAuNjE4ODEzNTU5MzIyMDMzOSwgeToyLjE0MzIyMDMzODk4MzA1MX0se3g6MC42MTIwMzM4OTgzMDUwODQ4LCB5OjIuMTI5NjYxMDE2OTQ5MTUyM30se3g6MC42MTIwMzM4OTgzMDUwODQ4LCB5OjIuMTE2MTAxNjk0OTE1MjU0Mn0se3g6MC42MDE4NjQ0MDY3Nzk2NjEsIHk6Mi4wOTY2MTAxNjk0OTE1MjUzfSx7eDowLjU5NDIzNzI4ODEzNTU5MzMsIHk6Mi4wOTA2Nzc5NjYxMDE2OTV9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTEgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjU4MjMwNTA4NDc0NTc2MjcsIHk6Mi4xMDQ1MDAwMDAwMDAwMDAzfSx7eDowLjU2NjIwMzM4OTgzMDUwODQsIHk6Mi4xMDAyNjI3MTE4NjQ0MDd9LHt4OjAuNTY3MDUwODQ3NDU3NjI3MSwgeToyLjA5MjYzNTU5MzIyMDMzOX0se3g6MC41ODczODk4MzA1MDg0NzQ2LCB5OjIuMDg2NzAzMzg5ODMwNTA4N30se3g6MC42MTQ1MDg0NzQ1NzYyNzEyLCB5OjIuMDc2NTMzODk4MzA1MDg1fSx7eDowLjYzMzE1MjU0MjM3Mjg4MTMsIHk6Mi4wNzQ4Mzg5ODMwNTA4NDc2fSx7eDowLjYzNjU0MjM3Mjg4MTM1NiwgeToyLjA4NTg1NTkzMjIwMzM5fSx7eDowLjYyMTI4ODEzNTU5MzIyMDMsIHk6Mi4wOTc3MjAzMzg5ODMwNTF9LHt4OjAuNTkxNjI3MTE4NjQ0MDY3OCwgeToyLjEwMjgwNTA4NDc0NTc2M30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMiA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuNTk4Mzg5ODMwNTA4NDc0NiwgeToyLjA5NDA2Nzc5NjYxMDE2OTN9LHt4OjAuNjA5NDA2Nzc5NjYxMDE3LCB5OjIuMTAwODQ3NDU3NjI3MTE4OH0se3g6MC42MTk1NzYyNzExODY0NDA3LCB5OjIuMTIwMzM4OTgzMDUwODQ3N30se3g6MC42MTk1NzYyNzExODY0NDA3LCB5OjIuMTMzMDUwODQ3NDU3NjI3fSx7eDowLjYyNTUwODQ3NDU3NjI3MTIsIHk6Mi4xNDQwNjc3OTY2MTAxNjk2fSx7eDowLjY0NSwgeToyLjE0NTc2MjcxMTg2NDQwN30se3g6MC42NjI3OTY2MTAxNjk0OTE1LCB5OjIuMTQ5MTUyNTQyMzcyODgxMn0se3g6MC42NjM2NDQwNjc3OTY2MTAyLCB5OjIuMTY1MjU0MjM3Mjg4MTM1NH0se3g6MC42NjAyNTQyMzcyODgxMzU2LCB5OjIuMTg0NzQ1NzYyNzExODY0M30se3g6MC42NTI2MjcxMTg2NDQwNjc5LCB5OjIuMjA1OTMyMjAzMzg5ODMwNX0se3g6MC42MzQ4MzA1MDg0NzQ1NzYzLCB5OjIuMjEwMTY5NDkxNTI1NDIzNX0se3g6MC42MDM0NzQ1NzYyNzExODY1LCB5OjIuMjEwMTY5NDkxNTI1NDIzNX0se3g6MC41NTYwMTY5NDkxNTI1NDI0LCB5OjIuMjA5MzIyMDMzODk4MzA1M30se3g6MC41MTk1NzYyNzExODY0NDA3LCB5OjIuMjEyNzExODY0NDA2Nzc5Nn0se3g6MC40ODE0NDA2Nzc5NjYxMDE3LCB5OjIuMjEyNzExODY0NDA2Nzc5Nn0se3g6MC40Mzk5MTUyNTQyMzcyODgxNywgeToyLjIxMTAxNjk0OTE1MjU0Mn0se3g6MC40MTYxODY0NDA2Nzc5NjYyLCB5OjIuMjA2Nzc5NjYxMDE2OTQ5Mn0se3g6MC40MDQzMjIwMzM4OTgzMDUxLCB5OjIuMTk5MTUyNTQyMzcyODgxNX0se3g6MC4zOTc1NDIzNzI4ODEzNTU5NywgeToyLjE4MTM1NTkzMjIwMzM5fSx7eDowLjM5NzU0MjM3Mjg4MTM1NTk3LCB5OjIuMTU0MjM3Mjg4MTM1NTkzM30se3g6MC40MDAwODQ3NDU3NjI3MTE5LCB5OjIuMTI3MTE4NjQ0MDY3Nzk2N30se3g6MC40MDAwODQ3NDU3NjI3MTE5LCB5OjIuMTEwMTY5NDkxNTI1NDI0fSx7eDowLjM4NTY3Nzk2NjEwMTY5NDksIHk6Mi4xMDI1NDIzNzI4ODEzNTZ9LHt4OjAuMzcyOTY2MTAxNjk0OTE1MywgeToyLjExMTAxNjk0OTE1MjU0MjZ9LHt4OjAuMzY4NzI4ODEzNTU5MzIyMSwgeToyLjA5NjYxMDE2OTQ5MTUyNTN9LHt4OjAuMzYxMTAxNjk0OTE1MjU0MjMsIHk6Mi4xMTEwMTY5NDkxNTI1NDI2fSx7eDowLjM0OTIzNzI4ODEzNTU5MzI0LCB5OjIuMDk1NzYyNzExODY0NDA2N30se3g6MC4zNDkyMzcyODgxMzU1OTMyNCwgeToyLjExMDE2OTQ5MTUyNTQyNH0se3g6MC4zMzY1MjU0MjM3Mjg4MTM1NiwgeToyLjA5NjYxMDE2OTQ5MTUyNTN9LHt4OjAuMzI5NzQ1NzYyNzExODY0NCwgeToyLjExMjcxMTg2NDQwNjc3OTV9LHt4OjAuMzI0NjYxMDE2OTQ5MTUyNTYsIHk6Mi4wOTY2MTAxNjk0OTE1MjUzfSx7eDowLjMxNzAzMzg5ODMwNTA4NDc3LCB5OjIuMTA3NjI3MTE4NjQ0MDY4fSx7eDowLjMxMDI1NDIzNzI4ODEzNTYsIHk6Mi4xMDI1NDIzNzI4ODEzNTZ9LHt4OjAuMzA0MzIyMDMzODk4MzA1MSwgeToyLjEwNTkzMjIwMzM4OTgzMDR9LHt4OjAuMjk2Njk0OTE1MjU0MjM3MywgeToyLjExMzU1OTMyMjAzMzg5OH0se3g6MC4yOTU4NDc0NTc2MjcxMTg2NywgeToyLjEzMDUwODQ3NDU3NjI3MX0se3g6MC4yOTU4NDc0NTc2MjcxMTg2NywgeToyLjE1MDg0NzQ1NzYyNzExODZ9LHt4OjAuMjg3MzcyODgxMzU1OTMyMiwgeToyLjE2MTg2NDQwNjc3OTY2MX0se3g6MC4yNjUzMzg5ODMwNTA4NDc0NywgeToyLjE2NDQwNjc3OTY2MTAxN30se3g6MC4yMzIyODgxMzU1OTMyMjAzNywgeToyLjE2NDQwNjc3OTY2MTAxN30se3g6MC4yMDk0MDY3Nzk2NjEwMTY5NSwgeToyLjE2NjEwMTY5NDkxNTI1NH0se3g6MC4xNzU1MDg0NzQ1NzYyNzEyMiwgeToyLjE2Nzc5NjYxMDE2OTQ5MTR9LHt4OjAuMTM3MzcyODgxMzU1OTMyMjMsIHk6Mi4xNjQ0MDY3Nzk2NjEwMTd9LHt4OjAuMTA0MzIyMDMzODk4MzA1MDksIHk6Mi4xNjYxMDE2OTQ5MTUyNTR9LHt4OjAuMDg0ODMwNTA4NDc0NTc2MjgsIHk6Mi4xNjg2NDQwNjc3OTY2MX0se3g6MC4wNzU1MDg0NzQ1NzYyNzEyLCB5OjIuMTg0NzQ1NzYyNzExODY0M30se3g6MC4wNzU1MDg0NzQ1NzYyNzEyLCB5OjIuMjA1OTMyMjAzMzg5ODMwNX0se3g6MC4wNzU1MDg0NzQ1NzYyNzEyLCB5OjIuMjI4ODEzNTU5MzIyMDMzN30se3g6MC4wNzM4MTM1NTkzMjIwMzM5MSwgeToyLjI1NTA4NDc0NTc2MjcxMTd9LHt4OjAuMDczODEzNTU5MzIyMDMzOTEsIHk6Mi4yNzc5NjYxMDE2OTQ5MTUzfSx7eDowLjA3NTUwODQ3NDU3NjI3MTIsIHk6Mi4yOTIzNzI4ODEzNTU5MzJ9LHt4OjAuMDcyOTY2MTAxNjk0OTE1MjYsIHk6Mi4zMTk0OTE1MjU0MjM3Mjg3fSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEzID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4wNTQzMzg5ODMwNTA4NDc0NiwgeToyLjM2OTc1NDIzNzI4ODEzNTd9LHt4OjAuMDUzNDkxNTI1NDIzNzI4ODE0LCB5OjIuNDEyMTI3MTE4NjQ0MDY4fSx7eDowLjA2ODc0NTc2MjcxMTg2NDQsIHk6Mi40MzA3NzExODY0NDA2Nzh9LHt4OjAuMDg0ODQ3NDU3NjI3MTE4NjUsIHk6Mi40MjgyMjg4MTM1NTkzMjI0fSx7eDowLjA5MTYyNzExODY0NDA2Nzc5LCB5OjIuNDAxMTEwMTY5NDkxNTI2fSx7eDowLjA4OTkzMjIwMzM4OTgzMDUsIHk6Mi4zNzIyOTY2MTAxNjk0OTJ9LHt4OjAuMDczODMwNTA4NDc0NTc2MjcsIHk6Mi4zMzkyNDU3NjI3MTE4NjV9LHt4OjAuMDY0NTA4NDc0NTc2MjcxMTgsIHk6Mi4zMTg5MDY3Nzk2NjEwMTd9LHt4OjAuMDYwMjcxMTg2NDQwNjc3OTcsIHk6Mi4zNDc3MjAzMzg5ODMwNTF9KSxcbiAgbmV3IEFycmF5KHt4OjAuMDY5NTkzMjIwMzM4OTgzMDUsIHk6Mi4zNDUxNzc5NjYxMDE2OTV9LHt4OjAuMDgyMzA1MDg0NzQ1NzYyNzIsIHk6Mi4zNTc4ODk4MzA1MDg0NzQ2fSx7eDowLjA4NjU0MjM3Mjg4MTM1NTkzLCB5OjIuMzgyNDY2MTAxNjk0OTE1Nn0se3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjM5NzcyMDMzODk4MzA1MX0se3g6MC4wNjAyNzExODY0NDA2Nzc5NywgeToyLjQxMDQzMjIwMzM4OTgzMX0se3g6MC4wNTM0OTE1MjU0MjM3Mjg4MTQsIHk6Mi40MjIyOTY2MTAxNjk0OTE2fSx7eDowLjA2OTU5MzIyMDMzODk4MzA1LCB5OjIuNDM3NTUwODQ3NDU3NjI3fSx7eDowLjA4MzE1MjU0MjM3Mjg4MTM2LCB5OjIuNDM1ODU1OTMyMjAzMzl9LHt4OjAuMDg3Mzg5ODMwNTA4NDc0NTcsIHk6Mi40MjgyMjg4MTM1NTkzMjI0fSx7eDowLjA4ODIzNzI4ODEzNTU5MzIxLCB5OjIuNDEwNDMyMjAzMzg5ODMxfSlcbik7XG5tb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE0ID0gbmV3IEFycmF5KFxuICBuZXcgQXJyYXkoe3g6MC4wNzQ3NDU3NjI3MTE4NjQ0MSwgeToyLjMyNTQyMzcyODgxMzU1OTV9LHt4OjAuMDkxNjk0OTE1MjU0MjM3MywgeToyLjMyNTQyMzcyODgxMzU1OTV9LHt4OjAuMTExMTg2NDQwNjc3OTY2MTEsIHk6Mi4zMjExODY0NDA2Nzc5NjZ9LHt4OjAuMTE4ODEzNTU5MzIyMDMzOSwgeToyLjMyMTE4NjQ0MDY3Nzk2Nn0se3g6MC4xMjY0NDA2Nzc5NjYxMDE3LCB5OjIuMzIyODgxMzU1OTMyMjAzNX0se3g6MC4xMjk4MzA1MDg0NzQ1NzYyOCwgeToyLjMyNzExODY0NDA2Nzc5NjR9LHt4OjAuMTI5ODMwNTA4NDc0NTc2MjgsIHk6Mi4zMzQ3NDU3NjI3MTE4NjQ2fSx7eDowLjEyODk4MzA1MDg0NzQ1NzY1LCB5OjIuMzQ4MzA1MDg0NzQ1NzYyN30se3g6MC4xMjMwNTA4NDc0NTc2MjcxMSwgeToyLjM3MDMzODk4MzA1MDg0Nzd9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTUgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjEyOTc2MjcxMTg2NDQwNjgsIHk6Mi4zNjI5NzQ1NzYyNzExODY3fSx7eDowLjExOTU5MzIyMDMzODk4MzA1LCB5OjIuMzcxNDQ5MTUyNTQyMzczfSx7eDowLjExMjgxMzU1OTMyMjAzMzksIHk6Mi4zODkyNDU3NjI3MTE4NjQ2fSx7eDowLjExNjIwMzM4OTgzMDUwODQ3LCB5OjIuNDIyMjk2NjEwMTY5NDkxNn0se3g6MC4xMTYyMDMzODk4MzA1MDg0NywgeToyLjQ0MzQ4MzA1MDg0NzQ1OH0se3g6MC4xMDk0MjM3Mjg4MTM1NTkzMiwgeToyLjQ2NDY2OTQ5MTUyNTQyMzd9LHt4OjAuMTE2MjAzMzg5ODMwNTA4NDcsIHk6Mi40OTAwOTMyMjAzMzg5ODM0fSx7eDowLjEzMTQ1NzYyNzExODY0NDA2LCB5OjIuNDk3NzIwMzM4OTgzMDUxfSx7eDowLjE0NDE2OTQ5MTUyNTQyMzc0LCB5OjIuNDc4MjI4ODEzNTU5MzIyMn0se3g6MC4xMzczODk4MzA1MDg0NzQ2LCB5OjIuNDU1MzQ3NDU3NjI3MTE5fSksXG4gIG5ldyBBcnJheSh7eDowLjE0MDc3OTY2MTAxNjk0OTE2LCB5OjIuNDk4NTY3Nzk2NjEwMTd9LHt4OjAuMTIwNDQwNjc3OTY2MTAxNjgsIHk6Mi40ODgzOTgzMDUwODQ3NDZ9LHt4OjAuMTE1MzU1OTMyMjAzMzg5ODQsIHk6Mi40Nzk5MjM3Mjg4MTM1NTk2fSx7eDowLjEyNDY3Nzk2NjEwMTY5NDkyLCB5OjIuNDYyMTI3MTE4NjQ0MDY4fSx7eDowLjEzOTA4NDc0NTc2MjcxMTg1LCB5OjIuNDU3MDQyMzcyODgxMzU2fSx7eDowLjE0MzMyMjAzMzg5ODMwNTA2LCB5OjIuNDQxNzg4MTM1NTkzMjIwNX0se3g6MC4xMzQsIHk6Mi40MTg5MDY3Nzk2NjEwMTczfSx7eDowLjExNDUwODQ3NDU3NjI3MTE4LCB5OjIuNDA3ODg5ODMwNTA4NDc1fSx7eDowLjExMDI3MTE4NjQ0MDY3Nzk3LCB5OjIuMzg1ODU1OTMyMjAzMzl9LHt4OjAuMTE4NzQ1NzYyNzExODY0NDIsIHk6Mi4zNzIyOTY2MTAxNjk0OTJ9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTYgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjEyNzI4ODEzNTU5MzIyMDMzLCB5OjIuNDQ5MTUyNTQyMzcyODgxNX0se3g6MC4xMzA2Nzc5NjYxMDE2OTQ5LCB5OjIuNDYwMTY5NDkxNTI1NDIzNX0se3g6MC4xMzA2Nzc5NjYxMDE2OTQ5LCB5OjIuNDcxMTg2NDQwNjc3OTY2fSx7eDowLjEyNjQ0MDY3Nzk2NjEwMTcsIHk6Mi40OTY2MTAxNjk0OTE1MjUzfSx7eDowLjEyOTgzMDUwODQ3NDU3NjI4LCB5OjIuNTE0NDA2Nzc5NjYxMDE2OH0se3g6MC4xMjA1MDg0NzQ1NzYyNzExOSwgeToyLjUyMjg4MTM1NTkzMjIwM30se3g6MC4xMjg5ODMwNTA4NDc0NTc2NSwgeToyLjUyNzExODY0NDA2Nzc5NjZ9LHt4OjAuMTIyMjAzMzg5ODMwNTA4NDgsIHk6Mi41MzEzNTU5MzIyMDMzODk2fSx7eDowLjEyODk4MzA1MDg0NzQ1NzY1LCB5OjIuNTMzMDUwODQ3NDU3NjI3fSx7eDowLjEyMDUwODQ3NDU3NjI3MTE5LCB5OjIuNTM4MTM1NTkzMjIwMzM5fSx7eDowLjEyOTgzMDUwODQ3NDU3NjI4LCB5OjIuNTQwNjc3OTY2MTAxNjk0N30se3g6MC4xMjMwNTA4NDc0NTc2MjcxMSwgeToyLjU0NTc2MjcxMTg2NDQwN30se3g6MC4xMjk4MzA1MDg0NzQ1NzYyOCwgeToyLjU0OTE1MjU0MjM3Mjg4MX0se3g6MC4xMTg4MTM1NTkzMjIwMzM5LCB5OjIuNTU0MjM3Mjg4MTM1NTkzM30se3g6MC4xMjk4MzA1MDg0NzQ1NzYyOCwgeToyLjU1Njc3OTY2MTAxNjk0OTN9LHt4OjAuMTI0NzQ1NzYyNzExODY0NCwgeToyLjU2MDE2OTQ5MTUyNTQyMzZ9LHt4OjAuMTI4OTgzMDUwODQ3NDU3NjUsIHk6Mi41NjM1NTkzMjIwMzM4OTg0fSx7eDowLjEyODk4MzA1MDg0NzQ1NzY1LCB5OjIuNTcyODgxMzU1OTMyMjAzNX0se3g6MC4xMjQ3NDU3NjI3MTE4NjQ0LCB5OjIuNTc3OTY2MTAxNjk0OTE1fSx7eDowLjEyMTM1NTkzMjIwMzM4OTgyLCB5OjIuNTgyMjAzMzg5ODMwNTA4Nn0se3g6MC4xMDg2NDQwNjc3OTY2MTAxNiwgeToyLjU4NDc0NTc2MjcxMTg2NDZ9LHt4OjAuMDg5MTUyNTQyMzcyODgxMzUsIHk6Mi41ODU1OTMyMjAzMzg5ODN9LHt4OjAuMDcxMzU1OTMyMjAzMzg5ODMsIHk6Mi41OTIzNzI4ODEzNTU5MzJ9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTcgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjA2OTU5MzIyMDMzODk4MzA1LCB5OjIuNTkxNzg4MTM1NTkzMjIwNH0se3g6MC4wNTM0OTE1MjU0MjM3Mjg4MTQsIHk6Mi41Njg5MDY3Nzk2NjEwMTd9LHt4OjAuMDUyNjQ0MDY3Nzk2NjEwMTcsIHk6Mi41NDQzMzA1MDg0NzQ1NzY2fSx7eDowLjA2NTM1NTkzMjIwMzM4OTgyLCB5OjIuNTMyNDY2MTAxNjk0OTE1NX0se3g6MC4wODY1NDIzNzI4ODEzNTU5MywgeToyLjU0Njg3Mjg4MTM1NTkzMjN9LHt4OjAuMDg1Njk0OTE1MjU0MjM3MywgeToyLjU3MDYwMTY5NDkxNTI1NDZ9LHt4OjAuMDY4NzQ1NzYyNzExODY0NCwgeToyLjU4OTI0NTc2MjcxMTg2NX0se3g6MC4wNTk0MjM3Mjg4MTM1NTkzMjYsIHk6Mi42MTYzNjQ0MDY3Nzk2NjF9LHt4OjAuMDU2MDMzODk4MzA1MDg0NzUsIHk6Mi42NDg1Njc3OTY2MTAxNjk3fSx7eDowLjA3Mjk4MzA1MDg0NzQ1NzYzLCB5OjIuNjY4OTA2Nzc5NjYxMDE3M30se3g6MC4wODMxNTI1NDIzNzI4ODEzNiwgeToyLjY1Nzg4OTgzMDUwODQ3NX0se3g6MC4wODQ4NDc0NTc2MjcxMTg2NSwgeToyLjY0MDA5MzIyMDMzODk4MzN9LHt4OjAuMDgyMzA1MDg0NzQ1NzYyNzIsIHk6Mi42MjkwNzYyNzExODY0NDF9LHt4OjAuMDY2MjAzMzg5ODMwNTA4NDcsIHk6Mi42MTQ2Njk0OTE1MjU0MjR9LHt4OjAuMDYyODEzNTU5MzIyMDMzOSwgeToyLjU4NDE2MTAxNjk0OTE1Mjd9KSxcbiAgbmV3IEFycmF5KHt4OjAuMDU3NzI4ODEzNTU5MzIyMDQsIHk6Mi41NzA2MDE2OTQ5MTUyNTQ2fSx7eDowLjA1NzcyODgxMzU1OTMyMjA0LCB5OjIuNTkxNzg4MTM1NTkzMjIwNH0se3g6MC4wNzI5ODMwNTA4NDc0NTc2MywgeToyLjYxMTI3OTY2MTAxNjk0OTN9LHt4OjAuMDg0LCB5OjIuNjI3MzgxMzU1OTMyMjAzNX0se3g6MC4wODQ4NDc0NTc2MjcxMTg2NSwgeToyLjY1MjgwNTA4NDc0NTc2Mjd9LHt4OjAuMDc4OTE1MjU0MjM3Mjg4MTQsIHk6Mi42Njg5MDY3Nzk2NjEwMTczfSx7eDowLjA2MTExODY0NDA2Nzc5NjYxNSwgeToyLjY2MTI3OTY2MTAxNjk0OX0se3g6MC4wNTc3Mjg4MTM1NTkzMjIwNCwgeToyLjY0MTc4ODEzNTU5MzIyMDd9LHt4OjAuMDc4MDY3Nzk2NjEwMTY5NSwgeToyLjYxMzgyMjAzMzg5ODMwNTR9LHt4OjAuMDc0Njc3OTY2MTAxNjk0OTEsIHk6Mi41OTUxNzc5NjYxMDE2OTV9LHt4OjAuMDU4NTc2MjcxMTg2NDQwNjgsIHk6Mi41ODA3NzExODY0NDA2Nzh9LHt4OjAuMDU1MTg2NDQwNjc3OTY2MSwgeToyLjU2MjEyNzExODY0NDA2OH0se3g6MC4wNTUxODY0NDA2Nzc5NjYxLCB5OjIuNTQxNzg4MTM1NTkzMjIwNn0se3g6MC4wNzIxMzU1OTMyMjAzMzg5OCwgeToyLjUzNTAwODQ3NDU3NjI3MTV9LHt4OjAuMDg0ODQ3NDU3NjI3MTE4NjUsIHk6Mi41NDk0MTUyNTQyMzcyODgzfSx7eDowLjA3MzgzMDUwODQ3NDU3NjI3LCB5OjIuNTc1Njg2NDQwNjc3OTY2M30se3g6MC4wNzM4MzA1MDg0NzQ1NzYyNywgeToyLjYyMTQ0OTE1MjU0MjM3M30se3g6MC4wNzk3NjI3MTE4NjQ0MDY3OCwgeToyLjYzMzMxMzU1OTMyMjAzNDN9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTggPSBuZXcgQXJyYXkoXG4gIC8vbmV3IEFycmF5KHt4OjAuMDcyOTgzMDUwODQ3NDU3NjMsIHk6Mi42NTUzNDc0NTc2MjcxMTg4fSx7eDowLjA3Mjk4MzA1MDg0NzQ1NzYzLCB5OjIuNjcwNjAxNjk0OTE1MjU0Mn0se3g6MC4wNjQ1MDg0NzQ1NzYyNzExOCwgeToyLjY5MTc4ODEzNTU5MzIyMDV9LHt4OjAuMDc0Njc3OTY2MTAxNjk0OTEsIHk6Mi42OTg1Njc3OTY2MTAxNjk1fSx7eDowLjA2NDUwODQ3NDU3NjI3MTE4LCB5OjIuNzAzNjUyNTQyMzcyODgxN30sIHt4OjAuMDY3ODk4MzA1MDg0NzQ1NzYsIHk6Mi43NjA2MDE2OTQ5MTUyNTQzfSx7eDowLjA3OTc2MjcxMTg2NDQwNjc4LCB5OjIuNzY4MjI4ODEzNTU5MzIyfSx7eDowLjEwNTE4NjQ0MDY3Nzk2NjEsIHk6Mi43NjgyMjg4MTM1NTkzMjJ9LHt4OjAuMTMwNjEwMTY5NDkxNTI1NDMsIHk6Mi43NjgyMjg4MTM1NTkzMjJ9LHt4OjAuMTUwOTQ5MTUyNTQyMzcyOSwgeToyLjc4MTYxODY0NDA2Nzc5N30se3g6MC4xNTI2NDQwNjc3OTY2MTAxNiwgeToyLjc5NjAyNTQyMzcyODgxMzZ9LHt4OjAuMTUzNDkxNTI1NDIzNzI4OCwgeToyLjgxNTUxNjk0OTE1MjU0MjV9LHt4OjAuMTU0MzM4OTgzMDUwODQ3NDgsIHk6Mi44NDUxNzc5NjYxMDE2OTV9LHt4OjAuMTYwMjcxMTg2NDQwNjc3OTUsIHk6Mi44NTg3MzcyODgxMzU1OTMyfSx7eDowLjE3NjM3Mjg4MTM1NTkzMjIsIHk6Mi44NTEyNzk2NjEwMTY5NDkzfSx7eDowLjE4MzE1MjU0MjM3Mjg4MTM3LCB5OjIuODQ3ODg5ODMwNTA4NDc0Nn0se3g6MC4xODY1NDIzNzI4ODEzNTU5NCwgeToyLjg1NTUxNjk0OTE1MjU0Mjd9LHt4OjAuMTkwNzc5NjYxMDE2OTQ5MTUsIHk6Mi44NDc4ODk4MzA1MDg0NzQ2fSx7eDowLjE5NjcxMTg2NDQwNjc3OTY4LCB5OjIuODUzODIyMDMzODk4MzA1NH0se3g6MC4yMDA5NDkxNTI1NDIzNzI5LCB5OjIuODQ1MzQ3NDU3NjI3MTE5fSx7eDowLjIwNjg4MTM1NTkzMjIwMzQxLCB5OjIuODU0NjY5NDkxNTI1NDI0fSx7eDowLjIxMDI3MTE4NjQ0MDY3OCwgeToyLjg0NDUwMDAwMDAwMDAwMDN9LHt4OjAuMjE0NTA4NDc0NTc2MjcxMiwgeToyLjg1NDY2OTQ5MTUyNTQyNH0se3g6MC4yMTk1OTMyMjAzMzg5ODMwNCwgeToyLjg0NDUwMDAwMDAwMDAwMDN9LHt4OjAuMjI0Njc3OTY2MTAxNjk0OTQsIHk6Mi44NDM4MjIwMzM4OTgzMDU0fSx7eDowLjIyODA2Nzc5NjYxMDE2OTUyLCB5OjIuODQzNjUyNTQyMzcyODgxNn0se3g6MC4yMzA2MTAxNjk0OTE1MjU0LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC4yNDkyNTQyMzcyODgxMzU1NiwgeToyLjg2MDQzMjIwMzM4OTgzMDZ9LHt4OjAuMjgxNDU3NjI3MTE4NjQ0LCB5OjIuODUwNDMyMjAzMzg5ODMwNn0se3g6MC4zNDY3MTE4NjQ0MDY3Nzk2NSwgeToyLjg1MTI3OTY2MTAxNjk0OTN9LHt4OjAuMzg5MDg0NzQ1NzYyNzExODUsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQwMzQ5MTUyNTQyMzcyODgsIHk6Mi44NDg3MzcyODgxMzU1OTMyfSx7eDowLjQwNjAzMzg5ODMwNTA4NDc0LCB5OjIuODQ1MzQ3NDU3NjI3MTE5fSx7eDowLjQxMTExODY0NDA2Nzc5NjYsIHk6Mi44NTYzNjQ0MDY3Nzk2NjF9LHt4OjAuNDE2MjAzMzg5ODMwNTA4NSwgeToyLjg1NTM0NzQ1NzYyNzExOX0se3g6MC40MTg3NDU3NjI3MTE4NjQzNywgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuNDI2MzcyODgxMzU1OTMyMiwgeToyLjg1MjgwNTA4NDc0NTc2M30se3g6MC40MjgwNjc3OTY2MTAxNjk0NywgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuNDMxNDU3NjI3MTE4NjQ0MDUsIHk6Mi44NDM2NTI1NDIzNzI4ODE2fSx7eDowLjQzNCwgeToyLjg1Mjk3NDU3NjI3MTE4Njd9LHt4OjAuNDM0LCB5OjIuODQ2MTk0OTE1MjU0MjM3Nn0se3g6MC40NDE2MjcxMTg2NDQwNjc4LCB5OjIuODU2MzY0NDA2Nzc5NjYxfSx7eDowLjQ0NTAxNjk0OTE1MjU0MjM2LCB5OjIuODQ1MzQ3NDU3NjI3MTE5fSx7eDowLjQ1MDEwMTY5NDkxNTI1NDIsIHk6Mi44NTEyNzk2NjEwMTY5NDkzfSx7eDowLjQ2MzY2MTAxNjk0OTE1MjUsIHk6Mi44NTA0MzIyMDMzODk4MzA2fSx7eDowLjQ4NCwgeToyLjg1MDQzMjIwMzM4OTgzMDZ9LHt4OjAuNDk0MTY5NDkxNTI1NDIzNjcsIHk6Mi44NjgwNTkzMjIwMzM4OTg0fSx7eDowLjQ5NzU1OTMyMjAzMzg5ODMsIHk6Mi44ODc1NTA4NDc0NTc2MjcyfSx7eDowLjQ5NzU1OTMyMjAzMzg5ODMsIHk6Mi45MjU2ODY0NDA2Nzc5NjYzfSx7eDowLjQ5NjcxMTg2NDQwNjc3OTYsIHk6Mi45NTI4MDUwODQ3NDU3NjN9LHt4OjAuNDk3NTU5MzIyMDMzODk4MywgeToyLjk4MDc3MTE4NjQ0MDY3ODN9LCB7eDowLjQ4NDg0NzQ1NzYyNzExODY3LCB5OjMuMDAzNjUyNTQyMzcyODgxNX0se3g6MC40NjI4MTM1NTkzMjIwMzM5LCB5OjMuMDEyOTc0NTc2MjcxMTg2Nn0se3g6MC40NDI0NzQ1NzYyNzExODY0LCB5OjMuMDEzODIyMDMzODk4MzA1M30se3g6MC40MzIzMDUwODQ3NDU3NjI3LCB5OjMuMDE4MDU5MzIyMDMzODk4M30se3g6MC40MjcyMjAzMzg5ODMwNTA4NCwgeTozLjAyOTA3NjI3MTE4NjQ0MDd9LHt4OjAuNDI2MzcyODgxMzU1OTMyMiwgeTozLjA2Mjk3NDU3NjI3MTE4NjR9LHt4OjAuNDI5NzYyNzExODY0NDA2OCwgeTozLjEwMTExMDE2OTQ5MTUyNTV9LHt4OjAuNDIzODMwNTA4NDc0NTc2MjYsIHk6My4xMTM4MjIwMzM4OTgzMDU0fSx7eDowLjM4NTY5NDkxNTI1NDIzNzI3LCB5OjMuMTE4MDU5MzIyMDMzODk4NH0se3g6MC4zNTY4ODEzNTU5MzIyMDM0LCB5OjMuMTE3MjExODY0NDA2Nzc5N30se3g6MC4zNDU4NjQ0MDY3Nzk2NjEsIHk6My4xMDg3MzcyODgxMzU1OTMyfSx7eDowLjM0NTg2NDQwNjc3OTY2MSwgeTozLjA5NTE3Nzk2NjEwMTY5NX0se3g6MC4zNDMzMjIwMzM4OTgzMDUwNywgeTozLjAyMzE0NDA2Nzc5NjYxMDR9KVxuICBuZXcgQXJyYXkoe3g6MC4wNjQ1NzYyNzExODY0NDA2NywgeToyLjYxMzU1OTMyMjAzMzg5OH0se3g6MC4wNzEzNTU5MzIyMDMzODk4MywgeToyLjYxODY0NDA2Nzc5NjYxMDN9LHt4OjAuMDcxMzU1OTMyMjAzMzg5ODMsIHk6Mi42Mjc5NjYxMDE2OTQ5MTU0fSx7eDowLjA3MDUwODQ3NDU3NjI3MTIsIHk6Mi42NDQ5MTUyNTQyMzcyODgyfSx7eDowLjA2NzExODY0NDA2Nzc5NjYyLCB5OjIuNjYyNzExODY0NDA2Nzc5OH0se3g6MC4wNjg4MTM1NTkzMjIwMzM5MSwgeToyLjY4NDc0NTc2MjcxMTg2NDN9LHt4OjAuMDYzNzI4ODEzNTU5MzIyMDQsIHk6Mi42OTQwNjc3OTY2MTAxNjk0fSx7eDowLjA3MzA1MDg0NzQ1NzYyNzEyLCB5OjIuNjk2NjEwMTY5NDkxNTI1NH0se3g6MC4wNjU0MjM3Mjg4MTM1NTkzMywgeToyLjcwMjU0MjM3Mjg4MTM1Nn0se3g6MC4wNzM4OTgzMDUwODQ3NDU3NSwgeToyLjcwNTA4NDc0NTc2MjcxMn0se3g6MC4wNjU0MjM3Mjg4MTM1NTkzMywgeToyLjcwOTMyMjAzMzg5ODMwNTN9LHt4OjAuMDc1NTkzMjIwMzM4OTgzMDQsIHk6Mi43MTI3MTE4NjQ0MDY3Nzk2fSx7eDowLjA2NzExODY0NDA2Nzc5NjYyLCB5OjIuNzE5NDkxNTI1NDIzNzI4Nn0se3g6MC4wNzU1OTMyMjAzMzg5ODMwNCwgeToyLjcyMTE4NjQ0MDY3Nzk2Nn0se3g6MC4wNjc5NjYxMDE2OTQ5MTUyNSwgeToyLjcyNTQyMzcyODgxMzU1OTR9LHt4OjAuMDc1NTkzMjIwMzM4OTgzMDQsIHk6Mi43Mjc5NjYxMDE2OTQ5MTV9LHt4OjAuMDY4ODEzNTU5MzIyMDMzOTEsIHk6Mi43MzMwNTA4NDc0NTc2Mjd9LHt4OjAuMDY5NjYxMDE2OTQ5MTUyNTQsIHk6Mi43NDkxNTI1NDIzNzI4ODEzfSx7eDowLjA3MDUwODQ3NDU3NjI3MTIsIHk6Mi43NTg0NzQ1NzYyNzExODY0fSx7eDowLjA3NTU5MzIyMDMzODk4MzA0LCB5OjIuNzY4NjQ0MDY3Nzk2NjF9LHt4OjAuMDgzMjIwMzM4OTgzMDUwODUsIHk6Mi43NzM3Mjg4MTM1NTkzMjJ9LHt4OjAuMDk3NjI3MTE4NjQ0MDY3OCwgeToyLjc3NDU3NjI3MTE4NjQ0MDZ9LHt4OjAuMTEyMDMzODk4MzA1MDg0NzQsIHk6Mi43NzQ1NzYyNzExODY0NDA2fSx7eDowLjEzMDY3Nzk2NjEwMTY5NDksIHk6Mi43NzQ1NzYyNzExODY0NDA2fSx7eDowLjE0NTA4NDc0NTc2MjcxMTg1LCB5OjIuNzc2MjcxMTg2NDQwNjc4fSx7eDowLjE1MTAxNjk0OTE1MjU0MjM4LCB5OjIuNzgyMjAzMzg5ODMwNTA4M30se3g6MC4xNTYxMDE2OTQ5MTUyNTQyNywgeToyLjc5MTUyNTQyMzcyODgxMzR9LHt4OjAuMTU2MTAxNjk0OTE1MjU0MjcsIHk6Mi44MDMzODk4MzA1MDg0NzQ2fSx7eDowLjE1NTI1NDIzNzI4ODEzNTYsIHk6Mi44NDMyMjAzMzg5ODMwNTF9LHt4OjAuMTYwMzM4OTgzMDUwODQ3NDgsIHk6Mi44NTUwODQ3NDU3NjI3MTE4fSx7eDowLjE2Nzk2NjEwMTY5NDkxNTI3LCB5OjIuODU5MzIyMDMzODk4MzA1fSx7eDowLjE3ODEzNTU5MzIyMDMzOSwgeToyLjg1OTMyMjAzMzg5ODMwNX0se3g6MC4xODkxNTI1NDIzNzI4ODEzNywgeToyLjg2MjcxMTg2NDQwNjc3OTV9LHt4OjAuMTk0MjM3Mjg4MTM1NTkzMiwgeToyLjg1NTA4NDc0NTc2MjcxMTh9LHt4OjAuMTk1OTMyMjAzMzg5ODMwNTMsIHk6Mi44NjI3MTE4NjQ0MDY3Nzk1fSx7eDowLjE5ODQ3NDU3NjI3MTE4NjQ4LCB5OjIuODU1OTMyMjAzMzg5ODMwNH0se3g6MC4yMDM1NTkzMjIwMzM4OTgzMiwgeToyLjg2MzU1OTMyMjAzMzg5OH0se3g6MC4yMDYxMDE2OTQ5MTUyNTQyNiwgeToyLjg1NTkzMjIwMzM4OTgzMDR9LHt4OjAuMjExMTg2NDQwNjc3OTY2MSwgeToyLjg2MjcxMTg2NDQwNjc3OTV9LHt4OjAuMjEyMDMzODk4MzA1MDg0NzMsIHk6Mi44NTUwODQ3NDU3NjI3MTE4fSx7eDowLjIxNzk2NjEwMTY5NDkxNTI2LCB5OjIuODY0NDA2Nzc5NjYxMDE3fSx7eDowLjIxODgxMzU1OTMyMjAzMzksIHk6Mi44NTUwODQ3NDU3NjI3MTE4fSx7eDowLjIyNDc0NTc2MjcxMTg2NDQyLCB5OjIuODYyNzExODY0NDA2Nzc5NX0se3g6MC4yMjY0NDA2Nzc5NjYxMDE3MywgeToyLjg1NTkzMjIwMzM4OTgzMDR9LHt4OjAuMjMxNTI1NDIzNzI4ODEzNTcsIHk6Mi44NjEwMTY5NDkxNTI1NDI2fSx7eDowLjIzNDA2Nzc5NjYxMDE2OTUyLCB5OjIuODU1OTMyMjAzMzg5ODMwNH0se3g6MC4yNDA4NDc0NTc2MjcxMTg2OCwgeToyLjg1ODQ3NDU3NjI3MTE4NjV9LHt4OjAuMjU0NDA2Nzc5NjYxMDE2OTQsIHk6Mi44NjAxNjk0OTE1MjU0MjR9LHt4OjAuMjc3Mjg4MTM1NTkzMjIwMzUsIHk6Mi44NjE4NjQ0MDY3Nzk2NjF9LHt4OjAuMzA3Nzk2NjEwMTY5NDkxNTYsIHk6Mi44NjE4NjQ0MDY3Nzk2NjF9LHt4OjAuMzM0MDY3Nzk2NjEwMTY5NSwgeToyLjg2MTg2NDQwNjc3OTY2MX0se3g6MC4zNjIwMzM4OTgzMDUwODQ3NiwgeToyLjg2MTg2NDQwNjc3OTY2MX0se3g6MC4zODQwNjc3OTY2MTAxNjk1LCB5OjIuODYwMTY5NDkxNTI1NDI0fSx7eDowLjQwMTAxNjk0OTE1MjU0MjQsIHk6Mi44NTY3Nzk2NjEwMTY5NDl9LHt4OjAuNDA5NDkxNTI1NDIzNzI4OCwgeToyLjg2MzU1OTMyMjAzMzg5OH0se3g6MC40MTExODY0NDA2Nzc5NjYxNywgeToyLjg1NTA4NDc0NTc2MjcxMTh9LHt4OjAuNDE3OTY2MTAxNjk0OTE1MiwgeToyLjg2MzU1OTMyMjAzMzg5OH0se3g6MC40MjA1MDg0NzQ1NzYyNzExNiwgeToyLjg1NTA4NDc0NTc2MjcxMTh9LHt4OjAuNDI1NTkzMjIwMzM4OTgzMDYsIHk6Mi44NjI3MTE4NjQ0MDY3Nzk1fSx7eDowLjQyOTgzMDUwODQ3NDU3NjI3LCB5OjIuODU0MjM3Mjg4MTM1NTkzfSx7eDowLjQzMjM3Mjg4MTM1NTkzMjIsIHk6Mi44NjQ0MDY3Nzk2NjEwMTd9LHt4OjAuNDM4MzA1MDg0NzQ1NzYyNywgeToyLjg1NTkzMjIwMzM4OTgzMDR9LHt4OjAuNDQxNjk0OTE1MjU0MjM3MywgeToyLjg2NTI1NDIzNzI4ODEzNTZ9LHt4OjAuNDQ1OTMyMjAzMzg5ODMwNTMsIHk6Mi44NTY3Nzk2NjEwMTY5NDl9LHt4OjAuNDU1MjU0MjM3Mjg4MTM1NjMsIHk6Mi44NjAxNjk0OTE1MjU0MjR9LHt4OjAuNDc1NTkzMjIwMzM4OTgzMSwgeToyLjg2MTg2NDQwNjc3OTY2MX0se3g6MC40ODc0NTc2MjcxMTg2NDQwNCwgeToyLjg2MTg2NDQwNjc3OTY2MX0se3g6MC40OTI1NDIzNzI4ODEzNTU5NCwgeToyLjg2NDQwNjc3OTY2MTAxN30se3g6MC40OTg0NzQ1NzYyNzExODY0LCB5OjIuODcyODgxMzU1OTMyMjAzM30se3g6MC41MDAxNjk0OTE1MjU0MjM4LCB5OjIuODg1NTkzMjIwMzM4OTgzfSx7eDowLjUwMDE2OTQ5MTUyNTQyMzgsIHk6Mi45MDQyMzcyODgxMzU1OTMzfSx7eDowLjUwMDE2OTQ5MTUyNTQyMzgsIHk6Mi45Mjg4MTM1NTkzMjIwMzR9LHt4OjAuNTAwMTY5NDkxNTI1NDIzOCwgeToyLjk1NzYyNzExODY0NDA2OH0se3g6MC40OTg0NzQ1NzYyNzExODY0LCB5OjIuOTY0NDA2Nzc5NjYxMDE3fSx7eDowLjUwMTg2NDQwNjc3OTY2MSwgeToyLjk4MjIwMzM4OTgzMDUwODV9LHt4OjAuNTAxMDE2OTQ5MTUyNTQyNCwgeToyLjk5NDkxNTI1NDIzNzI4ODN9LHt4OjAuNDk0MjM3Mjg4MTM1NTkzMiwgeTozLjAwOTMyMjAzMzg5ODMwNX0se3g6MC40ODgzMDUwODQ3NDU3NjI3MywgeTozLjAxNjk0OTE1MjU0MjM3M30se3g6MC40NzMwNTA4NDc0NTc2MjcxNSwgeTozLjAxNTI1NDIzNzI4ODEzNTV9LHt4OjAuNDU4NjQ0MDY3Nzk2NjEwMTYsIHk6My4wMTI3MTE4NjQ0MDY3OH0se3g6MC40NDc2MjcxMTg2NDQwNjc4LCB5OjMuMDE1MjU0MjM3Mjg4MTM1NX0se3g6MC40NDAwMDAwMDAwMDAwMDAwNiwgeTozLjAxODY0NDA2Nzc5NjYxfSx7eDowLjQzNTc2MjcxMTg2NDQwNjc0LCB5OjMuMDIzNzI4ODEzNTU5MzIyfSx7eDowLjQyOTgzMDUwODQ3NDU3NjI3LCB5OjMuMDMzODk4MzA1MDg0NzQ1N30se3g6MC40MzA2Nzc5NjYxMDE2OTQ5NSwgeTozLjA0NjYxMDE2OTQ5MTUyNTV9LHt4OjAuNDMxNTI1NDIzNzI4ODEzNTMsIHk6My4wNjY5NDkxNTI1NDIzNzN9LHt4OjAuNDMxNTI1NDIzNzI4ODEzNTMsIHk6My4wODY0NDA2Nzc5NjYxMDE2fSx7eDowLjQzMjM3Mjg4MTM1NTkzMjIsIHk6My4xMDE2OTQ5MTUyNTQyMzc1fSx7eDowLjQyODk4MzA1MDg0NzQ1NzcsIHk6My4xMTEwMTY5NDkxNTI1NDI2fSx7eDowLjQyMTM1NTkzMjIwMzM4OTg1LCB5OjMuMTE2OTQ5MTUyNTQyMzczfSx7eDowLjQwNTI1NDIzNzI4ODEzNTYsIHk6My4xMTk0OTE1MjU0MjM3Mjl9LHt4OjAuMzgyMzcyODgxMzU1OTMyMiwgeTozLjExOTQ5MTUyNTQyMzcyOX0se3g6MC4zNjU0MjM3Mjg4MTM1NTkzMywgeTozLjExNzc5NjYxMDE2OTQ5MTZ9LHt4OjAuMzU2MTAxNjk0OTE1MjU0MjMsIHk6My4xMTM1NTkzMjIwMzM4OTh9LHt4OjAuMzUxODY0NDA2Nzc5NjYxLCB5OjMuMTAyNTQyMzcyODgxMzU2fSx7eDowLjM1MTAxNjk0OTE1MjU0MjQsIHk6My4wODg5ODMwNTA4NDc0NTc2fSx7eDowLjM0OTMyMjAzMzg5ODMwNTEsIHk6My4wNzU0MjM3Mjg4MTM1NTk1fSx7eDowLjM0Njc3OTY2MTAxNjk0OTIsIHk6My4wNjI3MTE4NjQ0MDY3Nzk3fSx7eDowLjM0LCB5OjMuMDMzODk4MzA1MDg0NzQ1N30pXG4pO1xubW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOSA9IG5ldyBBcnJheShcbiAgbmV3IEFycmF5KHt4OjAuMzQ3NTU5MzIyMDMzODk4MywgeTozLjAyNDgzODk4MzA1MDg0Nzh9LHt4OjAuMzMwNjEwMTY5NDkxNTI1NCwgeTozLjA0Njg3Mjg4MTM1NTkzMjN9LHt4OjAuMzA1MTg2NDQwNjc3OTY2MSwgeTozLjAyOTkyMzcyODgxMzU1OTR9LHt4OjAuMzA0MzM4OTgzMDUwODQ3NDQsIHk6Mi45OTk0MTUyNTQyMzcyODg1fSx7eDowLjMwNjg4MTM1NTkzMjIwMzQsIHk6Mi45NjA0MzIyMDMzODk4MzA3fSx7eDowLjMyOTc2MjcxMTg2NDQwNjc1LCB5OjIuOTM1MDA4NDc0NTc2MjcxNX0se3g6MC4zNTk0MjM3Mjg4MTM1NTkzMywgeToyLjk0MjYzNTU5MzIyMDMzOX0se3g6MC4zODE0NTc2MjcxMTg2NDQwNiwgeToyLjk2MTI3OTY2MTAxNjk0OTR9LHt4OjAuMzcyMTM1NTkzMjIwMzM4OTYsIHk6Mi45NzY1MzM4OTgzMDUwODV9LHt4OjAuMzQ1MDE2OTQ5MTUyNTQyNCwgeToyLjk4MzMxMzU1OTMyMjAzNH0se3g6MC4zNDA3Nzk2NjEwMTY5NDkxLCB5OjMuMDAwMjYyNzExODY0NDA2N30se3g6MC4zNzA0NDA2Nzc5NjYxMDE3LCB5OjMuMDE1NTE2OTQ5MTUyNTQyNn0se3g6MC4zNzgwNjc3OTY2MTAxNjk1LCB5OjMuMDQwOTQwNjc3OTY2MTAyfSx7eDowLjM0OTI1NDIzNzI4ODEzNTYsIHk6My4wNTE5NTc2MjcxMTg2NDQ0fSksIFxuICBuZXcgQXJyYXkoe3g6MC4zNzg5MTUyNTQyMzcyODgxLCB5OjIuOTM5MjQ1NzYyNzExODY0NH0se3g6MC4zODIzMDUwODQ3NDU3NjI3LCB5OjIuOTYyOTc0NTc2MjcxMTg2OH0se3g6MC4zNjExMTg2NDQwNjc3OTY2LCB5OjIuOTczMTQ0MDY3Nzk2NjEwNn0se3g6MC4zMjU1MjU0MjM3Mjg4MTM1NSwgeToyLjk4NDE2MTAxNjk0OTE1MjZ9LHt4OjAuMzA4NTc2MjcxMTg2NDQwNjUsIHk6My4wMDI4MDUwODQ3NDU3NjN9LHt4OjAuMzMyMzA1MDg0NzQ1NzYyNywgeTozLjAxMzgyMjAzMzg5ODMwNTN9LHt4OjAuMzY2MjAzMzg5ODMwNTA4NSwgeTozLjAyMzE0NDA2Nzc5NjYxMDR9LHt4OjAuMzgwNjEwMTY5NDkxNTI1NDMsIHk6My4wNDUxNzc5NjYxMDE2OTV9LHt4OjAuMzUyNjQ0MDY3Nzk2NjEwMTcsIHk6My4wNTk1ODQ3NDU3NjI3MTJ9LHt4OjAuMzA5NDIzNzI4ODEzNTU5MywgeTozLjA0ODU2Nzc5NjYxMDE2OTZ9LHt4OjAuMzE1MzU1OTMyMjAzMzg5OCwgeTozLjAxNjM2NDQwNjc3OTY2MTN9LHt4OjAuMzM4MjM3Mjg4MTM1NTkzMjMsIHk6Mi45OTUxNzc5NjYxMDE2OTV9LHt4OjAuMzY2MjAzMzg5ODMwNTA4NSwgeToyLjk4ODM5ODMwNTA4NDc0Nn0se3g6MC4zNTI2NDQwNjc3OTY2MTAxNywgeToyLjk2NDY2OTQ5MTUyNTQyMzd9LHt4OjAuMzE3MDUwODQ3NDU3NjI3MSwgeToyLjk0ODU2Nzc5NjYxMDE2OTV9LHt4OjAuMzM2NTQyMzcyODgxMzU1OSwgeToyLjkzNDE2MTAxNjk0OTE1Mjh9LHt4OjAuMzY1MzU1OTMyMjAzMzg5OCwgeToyLjkzOTI0NTc2MjcxMTg2NDR9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjAgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjA2NDU3NjI3MTE4NjQ0MDY3LCB5OjIuNjEzNTU5MzIyMDMzODk4fSx7eDowLjA3MTM1NTkzMjIwMzM4OTgzLCB5OjIuNjE4NjQ0MDY3Nzk2NjEwM30se3g6MC4wNzEzNTU5MzIyMDMzODk4MywgeToyLjYyNzk2NjEwMTY5NDkxNTR9LHt4OjAuMDcwNTA4NDc0NTc2MjcxMiwgeToyLjY0NDkxNTI1NDIzNzI4ODJ9LHt4OjAuMDY3MTE4NjQ0MDY3Nzk2NjIsIHk6Mi42NjI3MTE4NjQ0MDY3Nzk4fSx7eDowLjA2ODgxMzU1OTMyMjAzMzkxLCB5OjIuNjg0NzQ1NzYyNzExODY0M30se3g6MC4wNjM3Mjg4MTM1NTkzMjIwNCwgeToyLjY5NDA2Nzc5NjYxMDE2OTR9LHt4OjAuMDczMDUwODQ3NDU3NjI3MTIsIHk6Mi42OTY2MTAxNjk0OTE1MjU0fSx7eDowLjA2NTQyMzcyODgxMzU1OTMzLCB5OjIuNzAyNTQyMzcyODgxMzU2fSx7eDowLjA3Mzg5ODMwNTA4NDc0NTc1LCB5OjIuNzA1MDg0NzQ1NzYyNzEyfSx7eDowLjA2NTQyMzcyODgxMzU1OTMzLCB5OjIuNzA5MzIyMDMzODk4MzA1M30se3g6MC4wNzU1OTMyMjAzMzg5ODMwNCwgeToyLjcxMjcxMTg2NDQwNjc3OTZ9LHt4OjAuMDY3MTE4NjQ0MDY3Nzk2NjIsIHk6Mi43MTk0OTE1MjU0MjM3Mjg2fSx7eDowLjA3NTU5MzIyMDMzODk4MzA0LCB5OjIuNzIxMTg2NDQwNjc3OTY2fSx7eDowLjA2Nzk2NjEwMTY5NDkxNTI1LCB5OjIuNzI1NDIzNzI4ODEzNTU5NH0se3g6MC4wNzU1OTMyMjAzMzg5ODMwNCwgeToyLjcyNzk2NjEwMTY5NDkxNX0se3g6MC4wNjg4MTM1NTkzMjIwMzM5MSwgeToyLjczMzA1MDg0NzQ1NzYyN30se3g6MC4wNjk2NjEwMTY5NDkxNTI1NCwgeToyLjc0OTE1MjU0MjM3Mjg4MTN9LHt4OjAuMDcwNTA4NDc0NTc2MjcxMiwgeToyLjc1ODQ3NDU3NjI3MTE4NjR9LHt4OjAuMDc1NTkzMjIwMzM4OTgzMDQsIHk6Mi43Njg2NDQwNjc3OTY2MX0se3g6MC4wODMyMjAzMzg5ODMwNTA4NSwgeToyLjc3MzcyODgxMzU1OTMyMn0se3g6MC4wOTc2MjcxMTg2NDQwNjc4LCB5OjIuNzc0NTc2MjcxMTg2NDQwNn0se3g6MC4xMTIwMzM4OTgzMDUwODQ3NCwgeToyLjc3NDU3NjI3MTE4NjQ0MDZ9LHt4OjAuMTMwNjc3OTY2MTAxNjk0OSwgeToyLjc3NDU3NjI3MTE4NjQ0MDZ9LHt4OjAuMTQ1MDg0NzQ1NzYyNzExODUsIHk6Mi43NzYyNzExODY0NDA2Nzh9LHt4OjAuMTUxMDE2OTQ5MTUyNTQyMzgsIHk6Mi43ODIyMDMzODk4MzA1MDgzfSx7eDowLjE1NjEwMTY5NDkxNTI1NDI3LCB5OjIuNzkxNTI1NDIzNzI4ODEzNH0se3g6MC4xNTYxMDE2OTQ5MTUyNTQyNywgeToyLjgwMzM4OTgzMDUwODQ3NDZ9LHt4OjAuMTU1MjU0MjM3Mjg4MTM1NiwgeToyLjg0MzIyMDMzODk4MzA1MX0se3g6MC4xNjAzMzg5ODMwNTA4NDc0OCwgeToyLjg1NTA4NDc0NTc2MjcxMTh9LHt4OjAuMTY3OTY2MTAxNjk0OTE1MjcsIHk6Mi44NTkzMjIwMzM4OTgzMDV9LHt4OjAuMTc4MTM1NTkzMjIwMzM5LCB5OjIuODU5MzIyMDMzODk4MzA1fSx7eDowLjE4OTE1MjU0MjM3Mjg4MTM3LCB5OjIuODYyNzExODY0NDA2Nzc5NX0se3g6MC4xOTQyMzcyODgxMzU1OTMyLCB5OjIuODU1MDg0NzQ1NzYyNzExOH0se3g6MC4xOTU5MzIyMDMzODk4MzA1MywgeToyLjg2MjcxMTg2NDQwNjc3OTV9LHt4OjAuMTk4NDc0NTc2MjcxMTg2NDgsIHk6Mi44NTU5MzIyMDMzODk4MzA0fSx7eDowLjIwMzU1OTMyMjAzMzg5ODMyLCB5OjIuODYzNTU5MzIyMDMzODk4fSx7eDowLjIwNjEwMTY5NDkxNTI1NDI2LCB5OjIuODU1OTMyMjAzMzg5ODMwNH0se3g6MC4yMTExODY0NDA2Nzc5NjYxLCB5OjIuODYyNzExODY0NDA2Nzc5NX0se3g6MC4yMTIwMzM4OTgzMDUwODQ3MywgeToyLjg1NTA4NDc0NTc2MjcxMTh9LHt4OjAuMjE3OTY2MTAxNjk0OTE1MjYsIHk6Mi44NjQ0MDY3Nzk2NjEwMTd9LHt4OjAuMjE4ODEzNTU5MzIyMDMzOSwgeToyLjg1NTA4NDc0NTc2MjcxMTh9LHt4OjAuMjI0NzQ1NzYyNzExODY0NDIsIHk6Mi44NjI3MTE4NjQ0MDY3Nzk1fSx7eDowLjIyNjQ0MDY3Nzk2NjEwMTczLCB5OjIuODU1OTMyMjAzMzg5ODMwNH0se3g6MC4yMzE1MjU0MjM3Mjg4MTM1NywgeToyLjg2MTAxNjk0OTE1MjU0MjZ9LHt4OjAuMjM0MDY3Nzk2NjEwMTY5NTIsIHk6Mi44NTU5MzIyMDMzODk4MzA0fSx7eDowLjI0MDg0NzQ1NzYyNzExODY4LCB5OjIuODU4NDc0NTc2MjcxMTg2NX0se3g6MC4yNTQ0MDY3Nzk2NjEwMTY5NCwgeToyLjg2MDE2OTQ5MTUyNTQyNH0se3g6MC4yNzcyODgxMzU1OTMyMjAzNSwgeToyLjg2MTg2NDQwNjc3OTY2MX0se3g6MC4zMDc3OTY2MTAxNjk0OTE1NiwgeToyLjg2MTg2NDQwNjc3OTY2MX0se3g6MC4zMzQwNjc3OTY2MTAxNjk1LCB5OjIuODYxODY0NDA2Nzc5NjYxfSx7eDowLjM2MjAzMzg5ODMwNTA4NDc2LCB5OjIuODYxODY0NDA2Nzc5NjYxfSx7eDowLjM4NDA2Nzc5NjYxMDE2OTUsIHk6Mi44NjAxNjk0OTE1MjU0MjR9LHt4OjAuNDAxMDE2OTQ5MTUyNTQyNCwgeToyLjg1Njc3OTY2MTAxNjk0OX0se3g6MC40MDk0OTE1MjU0MjM3Mjg4LCB5OjIuODYzNTU5MzIyMDMzODk4fSx7eDowLjQxMTE4NjQ0MDY3Nzk2NjE3LCB5OjIuODU1MDg0NzQ1NzYyNzExOH0se3g6MC40MTc5NjYxMDE2OTQ5MTUyLCB5OjIuODYzNTU5MzIyMDMzODk4fSx7eDowLjQyMDUwODQ3NDU3NjI3MTE2LCB5OjIuODU1MDg0NzQ1NzYyNzExOH0se3g6MC40MjU1OTMyMjAzMzg5ODMwNiwgeToyLjg2MjcxMTg2NDQwNjc3OTV9LHt4OjAuNDI5ODMwNTA4NDc0NTc2MjcsIHk6Mi44NTQyMzcyODgxMzU1OTN9LHt4OjAuNDMyMzcyODgxMzU1OTMyMiwgeToyLjg2NDQwNjc3OTY2MTAxN30se3g6MC40MzgzMDUwODQ3NDU3NjI3LCB5OjIuODU1OTMyMjAzMzg5ODMwNH0se3g6MC40NDE2OTQ5MTUyNTQyMzczLCB5OjIuODY1MjU0MjM3Mjg4MTM1Nn0se3g6MC40NDU5MzIyMDMzODk4MzA1MywgeToyLjg1Njc3OTY2MTAxNjk0OX0se3g6MC40NTUyNTQyMzcyODgxMzU2MywgeToyLjg2MDE2OTQ5MTUyNTQyNH0se3g6MC40NzU1OTMyMjAzMzg5ODMxLCB5OjIuODYxODY0NDA2Nzc5NjYxfSx7eDowLjQ4NzQ1NzYyNzExODY0NDA0LCB5OjIuODYxODY0NDA2Nzc5NjYxfSx7eDowLjQ5MjU0MjM3Mjg4MTM1NTk0LCB5OjIuODY0NDA2Nzc5NjYxMDE3fSx7eDowLjQ5ODQ3NDU3NjI3MTE4NjQsIHk6Mi44NzI4ODEzNTU5MzIyMDMzfSx7eDowLjUwMDE2OTQ5MTUyNTQyMzgsIHk6Mi44ODU1OTMyMjAzMzg5ODN9LHt4OjAuNTAwMTY5NDkxNTI1NDIzOCwgeToyLjkwNDIzNzI4ODEzNTU5MzN9LHt4OjAuNTAwMTY5NDkxNTI1NDIzOCwgeToyLjkyODgxMzU1OTMyMjAzNH0se3g6MC41MDAxNjk0OTE1MjU0MjM4LCB5OjIuOTU3NjI3MTE4NjQ0MDY4fSx7eDowLjQ5ODQ3NDU3NjI3MTE4NjQsIHk6Mi45NjQ0MDY3Nzk2NjEwMTd9LHt4OjAuNTAxODY0NDA2Nzc5NjYxLCB5OjIuOTgyMjAzMzg5ODMwNTA4NX0se3g6MC41MDEwMTY5NDkxNTI1NDI0LCB5OjIuOTk0OTE1MjU0MjM3Mjg4M30se3g6MC41MDg2NDQwNjc3OTY2MTAyLCB5OjMuMDEyNzExODY0NDA2Nzh9LHt4OjAuNTE1NDIzNzI4ODEzNTU5NCwgeTozLjAxNzc5NjYxMDE2OTQ5MTV9LHt4OjAuNTM0MDY3Nzk2NjEwMTY5NSwgeTozLjAxNDQwNjc3OTY2MTAxNjh9LHt4OjAuNTQ3NjI3MTE4NjQ0MDY3OCwgeTozLjAxMTg2NDQwNjc3OTY2MX0se3g6MC41NTk0OTE1MjU0MjM3Mjg4LCB5OjMuMDE2MTAxNjk0OTE1MjU0fSx7eDowLjU2ODgxMzU1OTMyMjAzMzksIHk6My4wMjIwMzM4OTgzMDUwODV9LHt4OjAuNTcyMjAzMzg5ODMwNTA4NCwgeTozLjAzMzg5ODMwNTA4NDc0NTd9LHt4OjAuNTcyMjAzMzg5ODMwNTA4NCwgeTozLjA0OTE1MjU0MjM3Mjg4MX0se3g6MC41NzEzNTU5MzIyMDMzODk5LCB5OjMuMDcyODgxMzU1OTMyMjAzNX0se3g6MC41NzEzNTU5MzIyMDMzODk5LCB5OjMuMDg5ODMwNTA4NDc0NTc2M30se3g6MC41NzEzNTU5MzIyMDMzODk5LCB5OjMuMTA1OTMyMjAzMzg5ODMwNH0se3g6MC41NzU1OTMyMjAzMzg5ODMxLCB5OjMuMTEyNzExODY0NDA2Nzc5NX0se3g6MC41ODQ5MTUyNTQyMzcyODgyLCB5OjMuMTE3Nzk2NjEwMTY5NDkxNn0se3g6MC42MDI3MTE4NjQ0MDY3Nzk3LCB5OjMuMTE5NDkxNTI1NDIzNzI5fSx7eDowLjYyMzA1MDg0NzQ1NzYyNzIsIHk6My4xMTk0OTE1MjU0MjM3Mjl9LHt4OjAuNjQ1MDg0NzQ1NzYyNzExOSwgeTozLjExNTI1NDIzNzI4ODEzNTZ9LHt4OjAuNjUwMTY5NDkxNTI1NDIzNywgeTozLjEwNzYyNzExODY0NDA2OH0se3g6MC42NTAxNjk0OTE1MjU0MjM3LCB5OjMuMX0se3g6MC42NTUyNTQyMzcyODgxMzU2LCB5OjMuMDc1NDIzNzI4ODEzNTU5NX0se3g6MC42NTY5NDkxNTI1NDIzNzI4LCB5OjMuMDU3NjI3MTE4NjQ0MDY4fSx7eDowLjY1ODY0NDA2Nzc5NjYxMDIsIHk6My4wMjM3Mjg4MTM1NTkzMjJ9KVxuKTtcbm1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMjEgPSBuZXcgQXJyYXkoXG4gIG5ldyBBcnJheSh7eDowLjYzMTQ1NzYyNzExODY0NDEsIHk6My4wNDc3MjAzMzg5ODMwNTF9LHt4OjAuNjY0NTA4NDc0NTc2MjcxMiwgeTozLjA1MTExMDE2OTQ5MTUyNTd9LHt4OjAuNjg1Njk0OTE1MjU0MjM3MywgeTozLjA0MjYzNTU5MzIyMDMzOTN9LHt4OjAuNjg4MjM3Mjg4MTM1NTkzMywgeTozLjAxNTUxNjk0OTE1MjU0MjZ9LHt4OjAuNjY3ODk4MzA1MDg0NzQ1OCwgeToyLjk5MDA5MzIyMDMzODk4MzR9LHt4OjAuNjcxMjg4MTM1NTkzMjIwMywgeToyLjk2ODkwNjc3OTY2MTAxN30se3g6MC42ODE0NTc2MjcxMTg2NDQxLCB5OjIuOTUwMjYyNzExODY0NDA3fSx7eDowLjY2NzA1MDg0NzQ1NzYyNzEsIHk6Mi45MzQxNjEwMTY5NDkxNTI4fSx7eDowLjYzODIzNzI4ODEzNTU5MzIsIHk6Mi45MzY3MDMzODk4MzA1MDl9LHt4OjAuNjM5MDg0NzQ1NzYyNzExOSwgeToyLjk1MDI2MjcxMTg2NDQwN30se3g6MC42MTAyNzExODY0NDA2Nzc5LCB5OjIuOTYyMTI3MTE4NjQ0MDY4fSx7eDowLjYwNzcyODgxMzU1OTMyMjEsIHk6Mi45ODU4NTU5MzIyMDMzOX0se3g6MC42Mjk3NjI3MTE4NjQ0MDY4LCB5OjMuMDAxOTU3NjI3MTE4NjQ0fSx7eDowLjYxNTM1NTkzMjIwMzM4OTgsIHk6My4wMzA3NzExODY0NDA2Nzh9LHt4OjAuNjI1NTI1NDIzNzI4ODEzNiwgeTozLjA1NDV9KSxcbiAgbmV3IEFycmF5KHt4OjAuNjUyNjQ0MDY3Nzk2NjEwMSwgeToyLjkyOTA3NjI3MTE4NjQ0MDZ9LHt4OjAuNjY5NTkzMjIwMzM4OTgzLCB5OjIuOTM3NTUwODQ3NDU3NjI3fSx7eDowLjY3MzgzMDUwODQ3NDU3NjMsIHk6Mi45NjcyMTE4NjQ0MDY3Nzk4fSx7eDowLjY1ODU3NjI3MTE4NjQ0MDcsIHk6Mi45NzY1MzM4OTgzMDUwODV9LHt4OjAuNjI4OTE1MjU0MjM3Mjg4MSwgeToyLjk5MzQ4MzA1MDg0NzQ1Nzd9LHt4OjAuNjEyODEzNTU5MzIyMDMzOSwgeTozLjAwODczNzI4ODEzNTU5MzZ9LHt4OjAuNjEwMjcxMTg2NDQwNjc3OSwgeTozLjAzNjcwMzM4OTgzMDUwODV9LHt4OjAuNjI2MzcyODgxMzU1OTMyMiwgeTozLjA1MDI2MjcxMTg2NDQwN30se3g6MC42NTM0OTE1MjU0MjM3Mjg4LCB5OjMuMDUzNjUyNTQyMzcyODgxM30se3g6MC42Njk1OTMyMjAzMzg5ODMsIHk6My4wNDE3ODgxMzU1OTMyMjA2fSx7eDowLjY3NTUyNTQyMzcyODgxMzUsIHk6My4wMjQ4Mzg5ODMwNTA4NDc4fSx7eDowLjY1MzQ5MTUyNTQyMzcyODgsIHk6My4wMDYxOTQ5MTUyNTQyMzc1fSx7eDowLjYyMjk4MzA1MDg0NzQ1NzYsIHk6Mi45ODY3MDMzODk4MzA1MDg2fSx7eDowLjYxNjIwMzM4OTgzMDUwODUsIHk6Mi45NTg3MzcyODgxMzU1OTMzfSx7eDowLjY1MzQ5MTUyNTQyMzcyODgsIHk6Mi45NDM0ODMwNTA4NDc0NTh9LHt4OjAuNjU0MzM4OTgzMDUwODQ3NSwgeToyLjkzNjcwMzM4OTgzMDUwOX0pXG4pO1xudmFyIHByZWduYW50U2VsZWN0ZWQgPSBmYWxzZTtcbnZhciBub25QcmVnbmFudFNlbGVjdGVkID0gZmFsc2U7XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQW5pbWF0aW9uc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG52YXIgY2FudmFzLCBjYW52YXMyLCBjYW52YXMzLCBjYW52YXM0LCBjYW52YXM1LCBjb250ZXh0LCBjb250ZXh0MiwgY29udGV4dDMsIGNvbnRleHQ0LCBjb250ZXh0NTtcbnZhciBtb3NxdWl0b3NBcnJheSA9IG5ldyBBcnJheSgpXG52YXIgdG90YWxNb3NxdWl0b3MgPSAxMDA7XG52YXIgc3RvcE1haW4gPSBmYWxzZTtcbnZhciBjdXJyZW50TW9zcXVpdG9QaGFzZSA9IDA7XG52YXIgY3VycmVudFBoYXNlID0gMDtcbnZhciBtb3NxdWl0b3NMZWZ0ID0gdG90YWxNb3NxdWl0b3M7XG52YXIgcHJlZ25hbnRNb3NxdWl0b3MgPSAwO1xudmFyIGxlZnRDb3ZlckdsYXNzLCByaWdodENvdmVyR2xhc3MsIGxlZnRDb3ZlckdsYXNzSG92ZXIsIHJpZ2h0Q292ZXJHbGFzc0hvdmVyO1xudmFyIGhvdmVyQmVoYXZpb3JJbWFnZXMgPSBuZXcgQXJyYXkoXCJpY29uMV9ob3Zlci5wbmdcIixcImljb24yX2hvdmVyLnBuZ1wiLFwiaWNvbjNfaG92ZXIucG5nXCIsXCJpY29uNF9ob3Zlci5wbmdcIixcImljb241X2hvdmVyLnBuZ1wiLFwiaWNvbjZfaG92ZXIucG5nXCIsXCJpY29uN19ob3Zlci5wbmdcIixcImljb244X2hvdmVyLnBuZ1wiLFwiaWNvbjlfaG92ZXIucG5nXCIpO1xudmFyIGJlaGF2aW9ySW1hZ2VzID0gbmV3IEFycmF5KFwiaWNvbjEucG5nXCIsXCJpY29uMi5wbmdcIixcImljb24zLnBuZ1wiLFwiaWNvbjQucG5nXCIsXCJpY29uNS5wbmdcIixcImljb242LnBuZ1wiLFwiaWNvbjcucG5nXCIsXCJpY29uOC5wbmdcIixcImljb245LnBuZ1wiKTtcbi8qKlxuICBUaGUgY2FudmFzSW1hZ2UgY2xhc3MgcmVwcmVzZW50cyBhbiBlbGVtZW50IGRyYXduIG9uIHRoZSBjYW52YXMuXG4gXG4gIEBjbGFzcyBDYW52YXNJbWFnZVxuICBAY29uc3RydWN0b3JcbiovXG5mdW5jdGlvbiBDYW52YXNJbWFnZShpbWcsIHgsIHksIGFuZ2xlLCBzcGVlZCwgdHlwZSwgY3VycmVudEltYWdlLCBwb3NpdGlvbnNBcnJheSkge1xuICB0aGlzLmltYWdlID0gaW1nO1xuICB0aGlzLnggPSB4O1xuICB0aGlzLnkgPSB5O1xuICB0aGlzLnhBbW91bnQgPSAwO1xuICB0aGlzLnlBbW91bnQgPSAwO1xuICB0aGlzLndpZHRoID0gaW1nLndpZHRoO1xuICB0aGlzLmhlaWdodCA9IGltZy5oZWlnaHQ7XG4gIHRoaXMucG9zaXRpb24gPSAxO1xuICB0aGlzLmFuZ2xlID0gYW5nbGU7XG4gIHRoaXMuc3BlZWQgPSBzcGVlZDtcbiAgdGhpcy50eXBlID0gdHlwZTtcbiAgdGhpcy5jdXJyZW50SW1hZ2UgPSBjdXJyZW50SW1hZ2U7XG4gIHRoaXMuZmlyc3RUaW1lID0gZmFsc2U7XG4gIHRoaXMuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgdGhpcy5wb3NpdGlvbnNBcnJheSA9IHBvc2l0aW9uc0FycmF5O1xuICB0aGlzLmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMDtcbiAgdGhpcy5mbGlwcGVkSW1hZ2VzID0gbmV3IEFycmF5KCk7XG4gIHJldHVybiB0aGlzO1xufVxuLy9TZXR1cCByZXF1ZXN0IGFuaW1hdGlvbiBmcmFtZVxudmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgaWYgKCFzdG9wTWFpbikge1xuICAgIG1haW4odGltZSk7XG4gIH1cbiAgXG4gIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcbn1cbnZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVJbml0aWFsaXphdGlvbiA9IGZ1bmN0aW9uKCl7XG4gIHZhciBsYXN0VGltZSA9IDA7XG4gIHZhciB2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXTtcbiAgZm9yKHZhciB4ID0gMDsgeCA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK3gpIHtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1t4XSsnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICB9XG4gXG4gIGlmICghd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaywgZWxlbWVudCkge1xuICAgICAgICB2YXIgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSk7XG4gICAgICAgIHZhciBpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpOyB9LFxuICAgICAgICAgIHRpbWVUb0NhbGwpO1xuICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH07XG4gIH1cbiBcbiAgaWYgKCF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICB9O1xuICB9XG59XG4vL1NldHVwIG1haW4gbG9vcFxudmFyIHNldHVwTWFpbkxvb3AgPSBmdW5jdGlvbigpe1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWVJbml0aWFsaXphdGlvbigpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25GcmFtZSk7XG4gICAgICBjdXJyZW50UGhhc2UgPSAxO1xuICAgICAgJCgnI3BnU3RlcDEgLnBnLWJ1dHRvbicpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICB9LCAzMDAwKTtcbn1cbi8vRXhlY3V0ZSBtYWluIGxvb3BcbnZhciBtYWluID0gZnVuY3Rpb24odGltZSl7XG4gIGlmIChjdXJyZW50UGhhc2UgPT0gMjAgfHwgY3VycmVudFBoYXNlID09IDIxKSB7XG4gIGNvbnRleHQ1LmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0NS5jYW52YXMud2lkdGgsIGNvbnRleHQ1LmNhbnZhcy5oZWlnaHQpO1xuICAvKnN3aXRjaCAobGVmdENvdmVyR2xhc3MuY3VycmVudE1vc3F1aXRvUGhhc2UpIHtcbiAgICBjYXNlIDA6Ki9cbiAgICAgIHZhciBsZWZ0R2xhc3NDb250cm9sSG92ZXIgPSBmYWxzZTtcbiAgICAgIGlmICgoKGxlZnRDb3ZlckdsYXNzSG92ZXIueCA+IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpcikgfHwgKGxlZnRDb3ZlckdsYXNzSG92ZXIueCA8IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIpIHx8IChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPT0gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmIFxuICAgICAgICAgICAoKGxlZnRDb3ZlckdsYXNzSG92ZXIueSA+IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueURpcikgfHwgKGxlZnRDb3ZlckdsYXNzSG92ZXIueSA8IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIpIHx8IChsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgPT0gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkpKSB7XG5cbiAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPSBsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uID49IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IGxlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uIC0gMTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UGhhc2UgPiAyMCkge1xuICAgICAgICAgICAgICBsZWZ0R2xhc3NDb250cm9sSG92ZXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy9jb250ZXh0NS5kcmF3SW1hZ2UobGVmdENvdmVyR2xhc3NIb3Zlci5pbWFnZVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRJbWFnZV0sIHBhcnNlSW50KGxlZnRDb3ZlckdsYXNzSG92ZXIueCAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTEzKSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjExMykgKiAoNDIuMC8xMzUuMCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzSG92ZXIueCA+IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFsZWZ0R2xhc3NDb250cm9sSG92ZXIpIHtcbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggLSBsZWZ0Q292ZXJHbGFzc0hvdmVyLngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMobGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSAtIGxlZnRDb3ZlckdsYXNzSG92ZXIueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiByaWdodENvdmVyR2xhc3NIb3Zlci5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gcmlnaHRDb3ZlckdsYXNzSG92ZXIuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogcmlnaHRDb3ZlckdsYXNzSG92ZXIuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci54ID0gKChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54ICYmIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpcikgfHwgKGxlZnRDb3ZlckdsYXNzSG92ZXIueCA8IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggJiYgIWxlZnRDb3ZlckdsYXNzSG92ZXIueERpcikgfHwgKGxlZnRDb3ZlckdsYXNzSG92ZXIueCA9PSBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSkgPyBsZWZ0Q292ZXJHbGFzc0hvdmVyLnggOiAobGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCA8IGxlZnRDb3ZlckdsYXNzSG92ZXIueCkgPyBsZWZ0Q292ZXJHbGFzc0hvdmVyLnggLSB4QW1vdW50IDogbGVmdENvdmVyR2xhc3NIb3Zlci54ICsgeEFtb3VudDtcbiAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci55ID0gKChsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55ICYmIGxlZnRDb3ZlckdsYXNzSG92ZXIueURpcikgfHwgKGxlZnRDb3ZlckdsYXNzSG92ZXIueSA8IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWxlZnRDb3ZlckdsYXNzSG92ZXIueURpcikgfHwgKGxlZnRDb3ZlckdsYXNzSG92ZXIueSA9PSBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55KSkgPyBsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgOiAobGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSA8IGxlZnRDb3ZlckdsYXNzSG92ZXIueSkgPyBsZWZ0Q292ZXJHbGFzc0hvdmVyLnkgLSB5QW1vdW50IDogbGVmdENvdmVyR2xhc3NIb3Zlci55ICsgeUFtb3VudDtcblxuICAgICAgICAvL2NvbnRleHQ1LmRyYXdJbWFnZShyaWdodENvdmVyR2xhc3NIb3Zlci5pbWFnZVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRJbWFnZV0sIHBhcnNlSW50KGxlZnRDb3ZlckdsYXNzSG92ZXIueCAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChyaWdodENvdmVyR2xhc3NIb3Zlci55ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGNhbnZhczMud2lkdGggKiAwLjExMyksIHBhcnNlSW50KChjYW52YXMzLndpZHRoICogMC4xMTMpICogKDQyLjAvMTM1LjApKSk7XG4gICAgICB9XG5cbiAgdmFyIHJpZ2h0R2xhc3NDb250cm9sSG92ZXIgPSBmYWxzZTtcbiAgICAgIGlmICgoKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnhEaXIpIHx8IChyaWdodENvdmVyR2xhc3NIb3Zlci54IDwgcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpcikgfHwgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPT0gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgXG4gICAgICAgICAgICgocmlnaHRDb3ZlckdsYXNzSG92ZXIueSA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpcikgfHwgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPCByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFyaWdodENvdmVyR2xhc3NIb3Zlci55RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzSG92ZXIueSA9PSByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpKSkge1xuXG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA+PSByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiAtIDE7XG4gICAgICAgICAgICBpZiAoY3VycmVudFBoYXNlID4gMjApIHtcbiAgICAgICAgICAgICAgcmlnaHRHbGFzc0NvbnRyb2xIb3ZlciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvL2NvbnRleHQ1LmRyYXdJbWFnZShyaWdodENvdmVyR2xhc3NIb3Zlci5pbWFnZVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50SW1hZ2VdLCBwYXJzZUludChyaWdodENvdmVyR2xhc3NIb3Zlci54ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTEzKSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjExMykgKiAoNDIuMC8xMzUuMCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci54RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci55RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghcmlnaHRHbGFzc0NvbnRyb2xIb3Zlcikge1xuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMocmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54IC0gcmlnaHRDb3ZlckdsYXNzSG92ZXIueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhyaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkgLSByaWdodENvdmVyR2xhc3NIb3Zlci55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSByaWdodENvdmVyR2xhc3NIb3Zlci5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiByaWdodENvdmVyR2xhc3NIb3Zlci5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gcmlnaHRDb3ZlckdsYXNzSG92ZXIuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci54ID0gKChyaWdodENvdmVyR2xhc3NIb3Zlci54ID4gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54ICYmIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnhEaXIpIHx8IChyaWdodENvdmVyR2xhc3NIb3Zlci54IDwgcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54ICYmICFyaWdodENvdmVyR2xhc3NIb3Zlci54RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzSG92ZXIueCA9PSByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLngpKSA/IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggOiAocmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54IDwgcmlnaHRDb3ZlckdsYXNzSG92ZXIueCkgPyByaWdodENvdmVyR2xhc3NIb3Zlci54IC0geEFtb3VudCA6IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggKyB4QW1vdW50O1xuICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci55ID0gKChyaWdodENvdmVyR2xhc3NIb3Zlci55ID4gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55ICYmIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnlEaXIpIHx8IChyaWdodENvdmVyR2xhc3NIb3Zlci55IDwgcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55ICYmICFyaWdodENvdmVyR2xhc3NIb3Zlci55RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzSG92ZXIueSA9PSByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpKSA/IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgOiAocmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55IDwgcmlnaHRDb3ZlckdsYXNzSG92ZXIueSkgPyByaWdodENvdmVyR2xhc3NIb3Zlci55IC0geUFtb3VudCA6IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgKyB5QW1vdW50O1xuXG4gICAgICAgIC8vY29udGV4dDUuZHJhd0ltYWdlKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmltYWdlW3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRJbWFnZV0sIHBhcnNlSW50KHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQocmlnaHRDb3ZlckdsYXNzSG92ZXIueSAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMTMpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTEzKSAqICg0Mi4wLzEzNS4wKSkpO1xuICAgICAgfVxuXG4gIGNvbnRleHQzLmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0My5jYW52YXMud2lkdGgsIGNvbnRleHQzLmNhbnZhcy5oZWlnaHQpO1xuICAvKnN3aXRjaCAobGVmdENvdmVyR2xhc3MuY3VycmVudE1vc3F1aXRvUGhhc2UpIHtcbiAgICBjYXNlIDA6Ki9cbiAgICAgIHZhciBsZWZ0R2xhc3NDb250cm9sID0gZmFsc2U7XG4gICAgICBpZiAoKChsZWZ0Q292ZXJHbGFzcy54ID4gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyKSB8fCAobGVmdENvdmVyR2xhc3MueCA8IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWxlZnRDb3ZlckdsYXNzLnhEaXIpIHx8IChsZWZ0Q292ZXJHbGFzcy54ID09IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmIFxuICAgICAgICAgICAoKGxlZnRDb3ZlckdsYXNzLnkgPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIpIHx8IChsZWZ0Q292ZXJHbGFzcy55IDwgbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhbGVmdENvdmVyR2xhc3MueURpcikgfHwgKGxlZnRDb3ZlckdsYXNzLnkgPT0gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSkpIHtcblxuICAgICAgICBsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gPSBsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gPj0gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gPSBsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gLSAxO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRQaGFzZSA+IDIwKSB7XG4gICAgICAgICAgICAgIGxlZnRHbGFzc0NvbnRyb2wgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dDMuZHJhd0ltYWdlKGxlZnRDb3ZlckdsYXNzLmltYWdlW2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRJbWFnZV0sIHBhcnNlSW50KGxlZnRDb3ZlckdsYXNzLnggKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQobGVmdENvdmVyR2xhc3MueSAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMjUpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTI1KSAqICgyMjQuMC8xNDkuMCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzLnggPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzLnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzLnkgPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghbGVmdEdsYXNzQ29udHJvbCkge1xuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMobGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54IC0gbGVmdENvdmVyR2xhc3MueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgLSBsZWZ0Q292ZXJHbGFzcy55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGxlZnRDb3ZlckdsYXNzLnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBsZWZ0Q292ZXJHbGFzcy5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBsZWZ0Q292ZXJHbGFzcy5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gbGVmdENvdmVyR2xhc3Muc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBsZWZ0Q292ZXJHbGFzcy54ID0gKChsZWZ0Q292ZXJHbGFzcy54ID4gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54ICYmIGxlZnRDb3ZlckdsYXNzLnhEaXIpIHx8IChsZWZ0Q292ZXJHbGFzcy54IDwgbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54ICYmICFsZWZ0Q292ZXJHbGFzcy54RGlyKSB8fCAobGVmdENvdmVyR2xhc3MueCA9PSBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLngpKSA/IGxlZnRDb3ZlckdsYXNzLnggOiAobGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54IDwgbGVmdENvdmVyR2xhc3MueCkgPyBsZWZ0Q292ZXJHbGFzcy54IC0geEFtb3VudCA6IGxlZnRDb3ZlckdsYXNzLnggKyB4QW1vdW50O1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy55ID0gKChsZWZ0Q292ZXJHbGFzcy55ID4gbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55ICYmIGxlZnRDb3ZlckdsYXNzLnlEaXIpIHx8IChsZWZ0Q292ZXJHbGFzcy55IDwgbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55ICYmICFsZWZ0Q292ZXJHbGFzcy55RGlyKSB8fCAobGVmdENvdmVyR2xhc3MueSA9PSBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGxlZnRDb3ZlckdsYXNzLnkgOiAobGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55IDwgbGVmdENvdmVyR2xhc3MueSkgPyBsZWZ0Q292ZXJHbGFzcy55IC0geUFtb3VudCA6IGxlZnRDb3ZlckdsYXNzLnkgKyB5QW1vdW50O1xuXG4gICAgICAgIGNvbnRleHQzLmRyYXdJbWFnZShsZWZ0Q292ZXJHbGFzcy5pbWFnZVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50SW1hZ2VdLCBwYXJzZUludChsZWZ0Q292ZXJHbGFzcy54ICogY2FudmFzMy53aWR0aCksIHBhcnNlSW50KGxlZnRDb3ZlckdsYXNzLnkgKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTI1KSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjEyNSkgKiAoMjI0LjAvMTQ5LjApKSk7XG4gICAgICB9XG4gICAgLypicmVhaztcbiAgICBjYXNlIDE6XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgIGJyZWFrO1xuICB9Ki9cbiAgICB2YXIgcmlnaHRHbGFzc0NvbnRyb2wgPSBmYWxzZTtcbiAgICAgIGlmICgoKHJpZ2h0Q292ZXJHbGFzcy54ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzLnggPCByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIXJpZ2h0Q292ZXJHbGFzcy54RGlyKSB8fCAocmlnaHRDb3ZlckdsYXNzLnggPT0gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLngpKSAmJiBcbiAgICAgICAgICAgKChyaWdodENvdmVyR2xhc3MueSA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3MueURpcikgfHwgKHJpZ2h0Q292ZXJHbGFzcy55IDwgcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFyaWdodENvdmVyR2xhc3MueURpcikgfHwgKHJpZ2h0Q292ZXJHbGFzcy55ID09IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSkpIHtcblxuICAgICAgICByaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID0gcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gPj0gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gLSAxO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRQaGFzZSA+IDIwKSB7XG4gICAgICAgICAgICAgIGxlZnRHbGFzc0NvbnRyb2wgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dDMuZHJhd0ltYWdlKHJpZ2h0Q292ZXJHbGFzcy5pbWFnZVtyaWdodENvdmVyR2xhc3MuY3VycmVudEltYWdlXSwgcGFyc2VJbnQocmlnaHRDb3ZlckdsYXNzLnggKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQocmlnaHRDb3ZlckdsYXNzLnkgKiBjYW52YXMzLndpZHRoKSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTI1KSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjEyNSkgKiAoMjI0LjAvMTQ5LjApKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmIChyaWdodENvdmVyR2xhc3MueCA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICByaWdodENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy55ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFyaWdodEdsYXNzQ29udHJvbCkge1xuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMocmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggLSByaWdodENvdmVyR2xhc3MueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhyaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSAtIHJpZ2h0Q292ZXJHbGFzcy55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIHJpZ2h0Q292ZXJHbGFzcy5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gcmlnaHRDb3ZlckdsYXNzLnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIHJpZ2h0Q292ZXJHbGFzcy5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gcmlnaHRDb3ZlckdsYXNzLnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnggPSAoKHJpZ2h0Q292ZXJHbGFzcy54ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnggJiYgcmlnaHRDb3ZlckdsYXNzLnhEaXIpIHx8IChyaWdodENvdmVyR2xhc3MueCA8IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54ICYmICFyaWdodENvdmVyR2xhc3MueERpcikgfHwgKHJpZ2h0Q292ZXJHbGFzcy54ID09IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54KSkgPyByaWdodENvdmVyR2xhc3MueCA6IChyaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCA8IHJpZ2h0Q292ZXJHbGFzcy54KSA/IHJpZ2h0Q292ZXJHbGFzcy54IC0geEFtb3VudCA6IHJpZ2h0Q292ZXJHbGFzcy54ICsgeEFtb3VudDtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnkgPSAoKHJpZ2h0Q292ZXJHbGFzcy55ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkgJiYgcmlnaHRDb3ZlckdsYXNzLnlEaXIpIHx8IChyaWdodENvdmVyR2xhc3MueSA8IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55ICYmICFyaWdodENvdmVyR2xhc3MueURpcikgfHwgKHJpZ2h0Q292ZXJHbGFzcy55ID09IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSkgPyByaWdodENvdmVyR2xhc3MueSA6IChyaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSA8IHJpZ2h0Q292ZXJHbGFzcy55KSA/IHJpZ2h0Q292ZXJHbGFzcy55IC0geUFtb3VudCA6IHJpZ2h0Q292ZXJHbGFzcy55ICsgeUFtb3VudDtcblxuICAgICAgICBjb250ZXh0My5kcmF3SW1hZ2UocmlnaHRDb3ZlckdsYXNzLmltYWdlW3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50SW1hZ2VdLCBwYXJzZUludChyaWdodENvdmVyR2xhc3MueCAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChyaWdodENvdmVyR2xhc3MueSAqIGNhbnZhczMud2lkdGgpLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMjUpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTI1KSAqICgyMjQuMC8xNDkuMCkpKTtcbiAgICAgIH1cblxuICAgIH1cbiAgLy8gY2xlYXIgdGhlIGNhbnZhc1xuICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjb250ZXh0LmNhbnZhcy53aWR0aCwgY29udGV4dC5jYW52YXMuaGVpZ2h0KTtcblxuICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgIHN3aXRjaCAoZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSkge1xuICAgICAgY2FzZSAwOlxuICAgICAgY2FzZSAyOlxuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA2OlxuICAgICAgY2FzZSA4OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTI6XG4gICAgICBjYXNlIDE0OlxuICAgICAgY2FzZSAxNjpcbiAgICAgIGNhc2UgMTg6XG4gICAgICBjYXNlIDIwOlxuICAgICAgY2FzZSAyMjpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkpIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICBlbGVtZW50LmN1cnJlbnRJbWFnZSA9IGVsZW1lbnQuY3VycmVudEltYWdlICsgMTtcbiAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudEltYWdlID49IGVsZW1lbnQuaW1hZ2UubGVuZ3RoKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50SW1hZ2UgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlM1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTMubGVuZ3RoXTtcblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKX07XG4gICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IE1hdGgubWF4KDAuMDg2LE1hdGgubWluKDAuMTM1LCBhdXhFbGVtZW50LngpKVxuICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBNYXRoLm1heCgwLjU1NSxNYXRoLm1pbigwLjcxNSwgYXV4RWxlbWVudC55KSlcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGN1cnJlbnRQaGFzZSA9IDI7XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxIC5wZy1idXR0b24nKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjEgc2VsZWN0JykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDI7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaWYgKCgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgJiYgIFxuICAgICAgICAgICAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiZcbiAgICAgICAgICAgICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpICkge1xuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgIGlmIChlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U1W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC4wNzYsTWF0aC5taW4oMC4xNSwgYXV4RWxlbWVudC54KSlcbiAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gTWF0aC5tYXgoMC43OCxNYXRoLm1pbigwLjg2LCBhdXhFbGVtZW50LnkpKVxuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54ID49IDAuMTMgfHwgYXV4RWxlbWVudC54IDw9IDAuMDg4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA8PSAwLjc4KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSBhdXhFbGVtZW50LnkgKyAwLjAyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhdXhFbGVtZW50LnkgPj0gMC44Mikge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gYXV4RWxlbWVudC55IC0gMC4wMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgLy9lbGVtZW50LnggPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54O1xuICAgICAgICAgICAgLy9lbGVtZW50LnkgPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55O1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gNDtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGN1cnJlbnRQaGFzZSA9IDM7XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PSBtb3NxdWl0b3NMZWZ0IC0gMSkge1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDIgLnBnLWJ1dHRvblwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwMlwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlN1tpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTcubGVuZ3RoXTtcblxuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkgPSBzaHVmZmxlKGF1eFBvc2l0aW9uc0FycmF5KTtcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKX07XG4gICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC40MiB8fCBhdXhFbGVtZW50LnggPD0gMC4zOSkge1xuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMS4yMDY2MTAxNjk0OTE1MjYpIHtcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueSA9IDEuMjA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGF1eEVsZW1lbnQueSA+PSAxLjI4KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjI4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54ID49IDAuNDkpIHtcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IDAuNDlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueCA8PSAwLjM2KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnggPSAwLjM2XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPj0gMS4zKSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA8PSAxLjE5KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjE5XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICAvL2VsZW1lbnQueCA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLng7XG4gICAgICAgICAgICAvL2VsZW1lbnQueSA9IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnk7XG5cbiAgICAgICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgICBpZiAobmV4dFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA2O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDc6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTkubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwMiAucGctYnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDJcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICAgICAgICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMiAucGctYnV0dG9uJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuXG4gICAgICAgICAgICAgICQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKS5yZW1vdmVDbGFzcyhcImRpc2FibGVkLW9wdGlvblwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U5W2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApLCB5OiBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMDEpIC0gMC4wMDUpICogMS4wKX07XG4gICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC44ODUgfHwgYXV4RWxlbWVudC54IDw9IDAuODA2KSB7XG4gICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA8PSAxLjQ4Nykge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS40ODc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGF1eEVsZW1lbnQueSA+PSAxLjU1OCkge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS41NTg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnggPj0gMC44OTgpIHtcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IDAuODk4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXV4RWxlbWVudC54IDw9IDAuNzkpIHtcbiAgICAgICAgICAgICAgICAgIGF1eEVsZW1lbnQueCA9IDAuNzk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdXhFbGVtZW50LnkgPj0gMS41Nykge1xuICAgICAgICAgICAgICAgICAgYXV4RWxlbWVudC55ID0gMS41NztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGF1eEVsZW1lbnQueSA8PSAxLjQ3KSB7XG4gICAgICAgICAgICAgICAgICBhdXhFbGVtZW50LnkgPSAxLjQ3O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgLy9lbGVtZW50LnggPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54O1xuICAgICAgICAgICAgLy9lbGVtZW50LnkgPSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55O1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gODtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IC0gZWxlbWVudC54KTtcbiAgICAgICAgdmFyIHl2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgLSBlbGVtZW50LnkpO1xuICAgICAgICB2YXIgeEFtb3VudCA9IDA7XG4gICAgICAgIHZhciB5QW1vdW50ID0gMDtcblxuICAgICAgICBpZiAoeHZhbHVlIDwgeXZhbHVlKSB7XG4gICAgICAgICAgeEFtb3VudCA9ICh4dmFsdWUgLyB5dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB5QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB5QW1vdW50ID0gKHl2YWx1ZSAvIHh2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHhBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC54ID0gKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgIWVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSkgPyBlbGVtZW50LnggOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCA8IGVsZW1lbnQueCkgPyBlbGVtZW50LnggLSB4QW1vdW50IDogZWxlbWVudC54ICsgeEFtb3VudDtcbiAgICAgICAgZWxlbWVudC55ID0gKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmIGVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgPyBlbGVtZW50LnkgOiAoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSA8IGVsZW1lbnQueSkgPyBlbGVtZW50LnkgLSB5QW1vdW50IDogZWxlbWVudC55ICsgeUFtb3VudDtcblxuICAgICAgICB2YXIgdyA9IChjYW52YXMud2lkdGggKiAwLjAxKSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDAxKSAtIDAuMDAwNSlcblxuICAgICAgICBpZiAoZWxlbWVudC54RGlyKSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5mbGlwcGVkSW1hZ2VzW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuaW1hZ2VbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA5OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICAvL2VsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTEubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwMyAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgICAgJChcIiNwZ1N0ZXAzXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTExLmxlbmd0aF07XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCkgLSAwLjAxOCwgeTogZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpICogMS4wKX07XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDEwO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICAvL2VsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEzW2luZGV4JW1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTMubGVuZ3RoXTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ID09IG1vc3F1aXRvc0xlZnQgLSAxKSB7XG4gICAgICAgICAgICAgICQoXCIjcGdTdGVwMyAucGctYnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgICAkKFwiI3BnU3RlcDNcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICAgICAgICAgICAgJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpLnJlbW92ZUNsYXNzKFwiZGlzYWJsZWQtb3B0aW9uXCIpO1xuICAgICAgICAgICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzIC5wZy1idXR0b24nKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTNbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApIC0gMC4wMX07XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDEyO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEzOlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTVbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNS5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApIC0gMC4wMX07XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChhdXhFbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE0O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE1OlxuICAgICAgICBpZiAoKChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmXG4gICAgICAgICAgICAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSAmJiAgXG4gICAgICAgICAgICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJlxuICAgICAgICAgICAgIWVsZW1lbnQueURpcikgfHwgKGVsZW1lbnQueSA9PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSkgKSB7XG4gICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiArIDE7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID49IGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG5cbiAgICAgICAgICAgIHZhciBhdXhQb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTdbaW5kZXglbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNy5sZW5ndGhdO1xuXG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheSA9IHNodWZmbGUoYXV4UG9zaXRpb25zQXJyYXkpO1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIHZhciBhdXhFbGVtZW50ID0ge3g6IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTY7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTc6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxOVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE5Lmxlbmd0aF07XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTg7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTk6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcblxuICAgICAgICAgICAgdmFyIGF1eFBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMVtpbmRleCVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTIxLmxlbmd0aF07XG5cbiAgICAgICAgICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBhdXhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgdmFyIGF1eEVsZW1lbnQgPSB7eDogZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjAxKSAtIDAuMDA1KSAqIDEuMCksIHk6IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4wMSkgLSAwLjAwNSkgKiAxLjApfTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKGF1eEVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgbmV4dFBvc2l0aW9uID0gZWxlbWVudC5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgICAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA+PSBlbGVtZW50LnBvc2l0aW9uc0FycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W25leHRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjA7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDE7XG4gICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeHZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAtIGVsZW1lbnQueCk7XG4gICAgICAgIHZhciB5dmFsdWUgPSBNYXRoLmFicyhlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IC0gZWxlbWVudC55KTtcbiAgICAgICAgdmFyIHhBbW91bnQgPSAwO1xuICAgICAgICB2YXIgeUFtb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHh2YWx1ZSA8IHl2YWx1ZSkge1xuICAgICAgICAgIHhBbW91bnQgPSAoeHZhbHVlIC8geXZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeUFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgeUFtb3VudCA9ICh5dmFsdWUgLyB4dmFsdWUpICogZWxlbWVudC5zcGVlZDtcbiAgICAgICAgICB4QW1vdW50ID0gZWxlbWVudC5zcGVlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQueCA9ICgoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiBlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54ICYmICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpID8gZWxlbWVudC54IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggPCBlbGVtZW50LngpID8gZWxlbWVudC54IC0geEFtb3VudCA6IGVsZW1lbnQueCArIHhBbW91bnQ7XG4gICAgICAgIGVsZW1lbnQueSA9ICgoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmICFlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkpID8gZWxlbWVudC55IDogKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgPCBlbGVtZW50LnkpID8gZWxlbWVudC55IC0geUFtb3VudCA6IGVsZW1lbnQueSArIHlBbW91bnQ7XG5cbiAgICAgICAgdmFyIHcgPSAoY2FudmFzLndpZHRoICogMC4wMSkgKyAoKE1hdGgucmFuZG9tKCkgKiAwLjAwMSkgLSAwLjAwMDUpXG5cbiAgICAgICAgaWYgKGVsZW1lbnQueERpcikge1xuICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGVsZW1lbnQuZmxpcHBlZEltYWdlc1tlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmltYWdlW2VsZW1lbnQuY3VycmVudEltYWdlXSwgZWxlbWVudC54ICogY2FudmFzLndpZHRoLCBlbGVtZW50LnkgKiBjYW52YXMud2lkdGgsIHcsIHcgKiAoIDE2LjAvMTIuMCkpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjE6XG4gICAgICAgIGlmICgoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgIGVsZW1lbnQueERpcikgfHwgKGVsZW1lbnQueCA8IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiZcbiAgICAgICAgICAgICFlbGVtZW50LnhEaXIpIHx8IChlbGVtZW50LnggPT0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkpICYmICBcbiAgICAgICAgICAgKChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICBlbGVtZW50LnlEaXIpIHx8IChlbGVtZW50LnkgPCBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55ICYmXG4gICAgICAgICAgICAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSApIHtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIC8vIFRPIERPXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0sZWxlbWVudC5wb3NpdGlvbnNBcnJheVswXSxlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdKVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyBpKyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKHt4OiBlbGVtZW50LnBvc2l0aW9uc0FycmF5WzBdLnggKyAoKE1hdGgucmFuZG9tKCkgKiAwLjA2NikgLSAwLjAzMyksIHk6IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbMF0ueSArICgoTWF0aC5yYW5kb20oKSAqIDAuMDY2KSAtIDAuMDMzKX0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnQucG9zaXRpb25zQXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vZWxlbWVudC54ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueDtcbiAgICAgICAgICAgIC8vZWxlbWVudC55ID0gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgICAgICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IGVsZW1lbnQuY3VycmVudFBvc2l0aW9uICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0UG9zaXRpb24gPj0gZWxlbWVudC5wb3NpdGlvbnNBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtuZXh0UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDIyO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHh2YWx1ZSA9IE1hdGguYWJzKGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggLSBlbGVtZW50LngpO1xuICAgICAgICB2YXIgeXZhbHVlID0gTWF0aC5hYnMoZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAtIGVsZW1lbnQueSk7XG4gICAgICAgIHZhciB4QW1vdW50ID0gMDtcbiAgICAgICAgdmFyIHlBbW91bnQgPSAwO1xuXG4gICAgICAgIGlmICh4dmFsdWUgPCB5dmFsdWUpIHtcbiAgICAgICAgICB4QW1vdW50ID0gKHh2YWx1ZSAvIHl2YWx1ZSkgKiBlbGVtZW50LnNwZWVkO1xuICAgICAgICAgIHlBbW91bnQgPSBlbGVtZW50LnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHlBbW91bnQgPSAoeXZhbHVlIC8geHZhbHVlKSAqIGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgICAgeEFtb3VudCA9IGVsZW1lbnQuc3BlZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnggPSAoKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnggJiYgZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCAmJiAhZWxlbWVudC54RGlyKSB8fCAoZWxlbWVudC54ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpKSA/IGVsZW1lbnQueCA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54IDwgZWxlbWVudC54KSA/IGVsZW1lbnQueCAtIHhBbW91bnQgOiBlbGVtZW50LnggKyB4QW1vdW50O1xuICAgICAgICBlbGVtZW50LnkgPSAoKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkgJiYgZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55IDwgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSAmJiAhZWxlbWVudC55RGlyKSB8fCAoZWxlbWVudC55ID09IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpKSA/IGVsZW1lbnQueSA6IChlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55IDwgZWxlbWVudC55KSA/IGVsZW1lbnQueSAtIHlBbW91bnQgOiBlbGVtZW50LnkgKyB5QW1vdW50O1xuXG4gICAgICAgIHZhciB3ID0gKGNhbnZhcy53aWR0aCAqIDAuMDEpICsgKChNYXRoLnJhbmRvbSgpICogMC4wMDEpIC0gMC4wMDA1KVxuXG4gICAgICAgIGlmIChlbGVtZW50LnhEaXIpIHtcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShlbGVtZW50LmZsaXBwZWRJbWFnZXNbZWxlbWVudC5jdXJyZW50SW1hZ2VdLCBlbGVtZW50LnggKiBjYW52YXMud2lkdGgsIGVsZW1lbnQueSAqIGNhbnZhcy53aWR0aCwgdywgdyAqICggMTYuMC8xMi4wKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoZWxlbWVudC5pbWFnZVtlbGVtZW50LmN1cnJlbnRJbWFnZV0sIGVsZW1lbnQueCAqIGNhbnZhcy53aWR0aCwgZWxlbWVudC55ICogY2FudmFzLndpZHRoLCB3LCB3ICogKCAxNi4wLzEyLjApKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIFxuICB9KTtcbn1cbi8vQW5pbWF0ZSBiZWhhdmlvciBlbGVtZW50c1xudmFyIGFuaW1hdGVCZWhhdmlvckVsZW1lbnRzID0gZnVuY3Rpb24oKSB7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VlbnRlclwiLCBcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb246bm90KC5kaXNhYmxlZC1vcHRpb24pXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmICghJCh0aGlzKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICAkKHRoaXMpLmZpbmQoXCJpbWdcIikuYXR0cihcInNyY1wiLCBcImh0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvXCIgKyBob3ZlckJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gIH0pO1xuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlbGVhdmVcIiwgXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKVwiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoISQodGhpcykuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkge1xuICAgICAgJCh0aGlzKS5maW5kKFwiaW1nXCIpLmF0dHIoXCJzcmNcIiwgXCJodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL1wiICsgYmVoYXZpb3JJbWFnZXNbJCh0aGlzKS5hdHRyKFwiZGF0YS1pbmRleFwiKV0pO1xuICAgIH1cbiAgfSk7XG59O1xuLy9BbmltYXRlIHByZWduYW5jeSBlbGVtZW50c1xudmFyIGFuaW1hdGVFbGVtZW50c1ByZWduYW5jeSA9IGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlZW50ZXJcIiwgXCIucGdTdGVwX19wcmVnbmFuY3ktb2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgaWYgKGN1cnJlbnRQaGFzZSA9PSAyMCkge1xuICAgIGlmIChsZWZ0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSAhPSAyKSB7XG4gICAgICBsZWZ0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDFcbiAgICAgIGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuMjkxLHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKX0sIHt4OjAuMjkxLHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKSAtIDAuMDA1fSk7XG4gICAgICBsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzLnggPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzLnkgPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuMjk4LHk6KDM1OTMuMC9jYW52YXMzLndpZHRoKX0sIHt4OjAuMjk4LHk6KDM1OTMuMC9jYW52YXMzLndpZHRoKSAtIDAuMDA1fSk7XG4gICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci54ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzSG92ZXIueSA+IGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbbGVmdENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VsZWF2ZVwiLCBcIi5wZ1N0ZXBfX3ByZWduYW5jeS1va1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgaWYgKGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlICE9IDIpIHtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMFxuICAgICAgbGVmdENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC4yOTEseTooMzQxNS4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9LCB7eDowLjI5MSx5OigzNDE1LjAvY2FudmFzMy53aWR0aCl9KTtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MueCA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MueSA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC4yOTgseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9LCB7eDowLjI5OCx5OigzNTkzLjAvY2FudmFzMy53aWR0aCl9KTtcbiAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgIGlmIChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci55ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB9KTtcbiAgJChkb2N1bWVudCkub24oXCJtb3VzZWVudGVyXCIsIFwiLnBnU3RlcF9fcHJlZ25hbmN5LWtvXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmIChjdXJyZW50UGhhc2UgPT0gMjApIHtcbiAgICBpZiAocmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRNb3NxdWl0b1BoYXNlICE9IDIpIHtcbiAgICAgIHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDFcbiAgICAgIHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDowLjU5NzUseTooMzQxNS4wL2NhbnZhczMud2lkdGgpfSwge3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKSAtIDAuMDA1fSk7XG4gICAgICByaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgIGlmIChyaWdodENvdmVyR2xhc3MueCA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy55ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzcy5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuNTk3NSx5OigzNTkzLjAvY2FudmFzMy53aWR0aCl9LCB7eDowLjU5NzUseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9KTtcbiAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzSG92ZXIueCA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzSG92ZXIueSA+IHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W3JpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICByaWdodENvdmVyR2xhc3NIb3Zlci55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpciA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKFwibW91c2VsZWF2ZVwiLCBcIi5wZ1N0ZXBfX3ByZWduYW5jeS1rb1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSAhPSAyKSB7XG4gICAgICByaWdodENvdmVyR2xhc3MuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAwXG4gICAgICByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKSAtIDAuMDA1fSwge3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKX0pO1xuICAgICAgcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICBpZiAocmlnaHRDb3ZlckdsYXNzLnggPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChyaWdodENvdmVyR2xhc3MueSA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDowLjU5NzUseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wMDV9LCB7eDowLjU5NzUseTooMzU5My4wL2NhbnZhczMud2lkdGgpfSk7XG4gICAgICByaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnggPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnkgPiByaWdodENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnlEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICB9XG4gIH0pO1xufVxuLy9TZXR1cCBjYW52YXNcbnZhciBzZXR1cENhbnZhcyA9IGZ1bmN0aW9uKCl7XG4gIGNhbnZhczIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWxlbWVudHNDYW52YXMnKTtcbiAgY2FudmFzMi53aWR0aCA9ICQoJy5wZ0NoYXJ0Jykud2lkdGgoKTtcbiAgY2FudmFzMi5oZWlnaHQgPSAkKCcucGdDaGFydCcpLmhlaWdodCgpICsgMDtcbiAgY2FudmFzMi5zdHlsZS53aWR0aCAgPSBjYW52YXMyLndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczIuc3R5bGUuaGVpZ2h0ID0gY2FudmFzMi5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDIgPSBjYW52YXMyLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQyLmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNhbnZhczMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYW5pbWF0aW9uQ2FudmFzJyk7XG4gIGNhbnZhczMud2lkdGggPSAkKCcucGdDaGFydCcpLndpZHRoKCk7XG4gIGNhbnZhczMuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQnKS5oZWlnaHQoKTtcbiAgY2FudmFzMy5zdHlsZS53aWR0aCAgPSBjYW52YXMzLndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczMuc3R5bGUuaGVpZ2h0ID0gY2FudmFzMy5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDMgPSBjYW52YXMzLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQzLmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb3NxdWl0b3NDYW52YXMnKTtcbiAgY2FudmFzLndpZHRoID0gJCgnLnBnQ2hhcnQnKS53aWR0aCgpO1xuICBjYW52YXMuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQnKS5oZWlnaHQoKTtcbiAgY2FudmFzLnN0eWxlLndpZHRoICA9IGNhbnZhcy53aWR0aC50b1N0cmluZygpICsgXCJweFwiO1xuICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gY2FudmFzLmhlaWdodC50b1N0cmluZygpICsgXCJweFwiO1xuICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5cbiAgY2FudmFzNCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdob3ZlckNhbnZhcycpO1xuICBjYW52YXM0LndpZHRoID0gJCgnLnBnQ2hhcnQnKS53aWR0aCgpO1xuICBjYW52YXM0LmhlaWdodCA9ICQoJy5wZ0NoYXJ0JykuaGVpZ2h0KCk7XG4gIGNhbnZhczQuc3R5bGUud2lkdGggID0gY2FudmFzNC53aWR0aC50b1N0cmluZygpICsgXCJweFwiO1xuICBjYW52YXM0LnN0eWxlLmhlaWdodCA9IGNhbnZhczQuaGVpZ2h0LnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNvbnRleHQ0ID0gY2FudmFzNC5nZXRDb250ZXh0KCcyZCcpO1xuICBjb250ZXh0NC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcblxuICBjYW52YXM1ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dsYXNzQW5pbWF0aW9uQ2FudmFzJyk7XG4gIGNhbnZhczUud2lkdGggPSAkKCcucGdDaGFydCcpLndpZHRoKCk7XG4gIGNhbnZhczUuaGVpZ2h0ID0gJCgnLnBnQ2hhcnQnKS5oZWlnaHQoKTtcbiAgY2FudmFzNS5zdHlsZS53aWR0aCAgPSBjYW52YXM1LndpZHRoLnRvU3RyaW5nKCkgKyBcInB4XCI7XG4gIGNhbnZhczUuc3R5bGUuaGVpZ2h0ID0gY2FudmFzNS5oZWlnaHQudG9TdHJpbmcoKSArIFwicHhcIjtcbiAgY29udGV4dDUgPSBjYW52YXM1LmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQ1LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICBcbiAgY29udGV4dDIuZmlsbFN0eWxlID0gXCIjZjhmOGY4XCI7XG4gIGNvbnRleHQyLmZpbGxSZWN0KDAsIGdldE9mZnNldCgkKCcjcGdRdWVzdGlvbi1jb250YWluZXIxJylbMF0pLnRvcCAtIGdldE9mZnNldCgkKFwiLnBnQXJ0aWNsZVwiKVswXSkudG9wIC0gJCgnI25hdi1iYXInKS5oZWlnaHQoKSwgY2FudmFzMi53aWR0aCwgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMScpLmhlaWdodCgpKTtcbiAgY29udGV4dDIuZmlsbFJlY3QoMCwgZ2V0T2Zmc2V0KCQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjInKVswXSkudG9wIC0gZ2V0T2Zmc2V0KCQoXCIucGdBcnRpY2xlXCIpWzBdKS50b3AgLSAkKCcjbmF2LWJhcicpLmhlaWdodCgpLCBjYW52YXMyLndpZHRoLCAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykuaGVpZ2h0KCkpO1xuICBjb250ZXh0Mi5maWxsUmVjdCgwLCBnZXRPZmZzZXQoJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMycpWzBdKS50b3AgLSBnZXRPZmZzZXQoJChcIi5wZ0FydGljbGVcIilbMF0pLnRvcCAtICQoJyNuYXYtYmFyJykuaGVpZ2h0KCksIGNhbnZhczIud2lkdGgsICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5oZWlnaHQoKSk7XG5cbiAgdmFyIHBpY3R1cmUxID0gbmV3IEltYWdlKCk7XG4gIHBpY3R1cmUxLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dDIuZHJhd0ltYWdlKHBpY3R1cmUxLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC41NSkgLSAoY2FudmFzLndpZHRoICogMC4wNjQpKSwgMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC41NSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjU1KSAqICg1MzYuMC82NTYuMCkpKTtcbiAgICAgIHZhciBwaWN0dXJlMUhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgICBwaWN0dXJlMUhvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZShwaWN0dXJlMUhvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggLSAoY2FudmFzLndpZHRoICogMC41NSkgLSAoY2FudmFzLndpZHRoICogMC4wNjQpKSwgMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC41NSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjU1KSAqICg1MzYuMC82NTYuMCkpKTtcbiAgICAgIH0pO1xuICAgICAgcGljdHVyZTFIb3Zlci5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90ZXJyYXJpdW0taG92ZXIucG5nJztcblxuICAgICAgdmFyIHR1YmUxID0gbmV3IEltYWdlKCk7XG4gICAgICB0dWJlMS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTEsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjU1KSAtIChjYW52YXMud2lkdGggKiAwLjA1ODUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMzYwNTEpKSwgMjM1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjM2MDUxKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMzYwNTEpICogKDMwMC4wLzQzMC4wKSkpO1xuICAgICAgfSk7XG4gICAgICB0dWJlMS5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlMS5wbmcnO1xuICB9KTtcbiAgcGljdHVyZTEuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdGVycmFyaXVtLnBuZyc7XG5cbiAgdmFyIHR1YmUyID0gbmV3IEltYWdlKCk7XG4gIHR1YmUyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmUyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjAzNDUpLCA1MzAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTQ2NzIpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC4xNDY3MikgKiAoNjIyLjAvMTc1LjApKSk7XG4gIH0pO1xuICB0dWJlMi5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlMi5wbmcnO1xuXG4gIHZhciB0dWJlMyA9IG5ldyBJbWFnZSgpO1xuICB0dWJlMy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQyLmRyYXdJbWFnZSh0dWJlMywgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4wNTQ1KSwgMTExNSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC44MDczKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuODA3MykgKiAoNTE3LjAvOTYzLjApKSk7XG4gICAgdmFyIHR1YmUzSG92ZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICB0dWJlM0hvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb250ZXh0NC5kcmF3SW1hZ2UodHViZTNIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4wNTQ1KSwgMTExNSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC44MDczKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuODA3MykgKiAoNTE3LjAvOTYzLjApKSk7XG4gICAgfSk7XG4gICAgdHViZTNIb3Zlci5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlMy1ob3Zlci5wbmcnO1xuICB9KTtcbiAgdHViZTMuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTMucG5nJztcblxuICB2YXIgdHViZTUgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTUuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTUsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjgwMTUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMTMzKSksIDIxMjAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuODAxNSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjgwMTUpICogKDUxMC4wLzk1Ni4wKSkpO1xuICAgIFxuICAgIHZhciB0dWJlNUhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTVIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29udGV4dDQuZHJhd0ltYWdlKHR1YmU1SG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAtIChjYW52YXMud2lkdGggKiAwLjgwMTUpIC0gKGNhbnZhcy53aWR0aCAqIDAuMTMzKSksIDIxMjAsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuODAxNSksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjgwMTUpICogKDUxMC4wLzk1Ni4wKSkpO1xuICAgIH0pO1xuICAgIHR1YmU1SG92ZXIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTUtaG92ZXIucG5nJzsgIFxuXG4gICAgdmFyIHR1YmU0ID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnRleHQyLmRyYXdJbWFnZSh0dWJlNCwgcGFyc2VJbnQoY2FudmFzLndpZHRoIC0gKGNhbnZhcy53aWR0aCAqIDAuMTM1OCkgLSAoY2FudmFzLndpZHRoICogMC4wOCkpIC0gMywgMTYxOCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMzU4KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTM1OCkgKiAoNjAwLjAvMTYyLjApKSk7XG4gICAgICB2YXIgdHViZTRIb3ZlciA9IG5ldyBJbWFnZSgpO1xuICAgICAgdHViZTRIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb250ZXh0NC5kcmF3SW1hZ2UodHViZTRIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoIC0gKGNhbnZhcy53aWR0aCAqIDAuMTM1OCkgLSAoY2FudmFzLndpZHRoICogMC4wOCkpIC0gMywgMTYxOCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMzU4KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTM1OCkgKiAoNjAwLjAvMTYyLjApKSk7XG4gICAgICB9KTtcbiAgICAgIHR1YmU0SG92ZXIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTQtaG92ZXIucG5nJztcbiAgICB9KTtcbiAgICB0dWJlNC5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlNC5wbmcnO1xuXG4gIH0pO1xuICB0dWJlNS5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlNS5wbmcnOyAgXG5cbiAgdmFyIHR1YmU2ID0gbmV3IEltYWdlKCk7XG4gIHR1YmU2LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dDIuZHJhd0ltYWdlKHR1YmU2LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjAyOCksIDI2MjEsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTM4MyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjEzODMpICogKDU5Mi4wLzE2NS4wKSkpO1xuICAgIHZhciB0dWJlNkhvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgdHViZTZIb3Zlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29udGV4dDQuZHJhd0ltYWdlKHR1YmU2SG92ZXIsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDI4KSwgMjYyMSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4xMzgzKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTM4MykgKiAoNTkyLjAvMTY1LjApKSk7XG4gICAgfSk7XG4gICAgdHViZTZIb3Zlci5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlNi1ob3Zlci5wbmcnO1xuICB9KTtcbiAgdHViZTYuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTYucG5nJztcblxuICB2YXIgdHViZTcgPSBuZXcgSW1hZ2UoKTtcbiAgdHViZTcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBjb250ZXh0Mi5kcmF3SW1hZ2UodHViZTcsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDYpLCAzMjAwLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjY3MDcpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC42NzA3KSAqICg1NTIuMC84MDAuMCkpKTtcbiAgICB2YXIgY292ZXJHbGFzcyA9IG5ldyBJbWFnZSgpO1xuICAgIGNvdmVyR2xhc3MuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnRleHQzLmRyYXdJbWFnZShjb3ZlckdsYXNzLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4yOTEpLCAzNDE1LCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC4xMjUpLCBwYXJzZUludCgoY2FudmFzMy53aWR0aCAqIDAuMTI1KSAqICgyMjQuMC8xNDkuMCkpKTtcbiAgICAgIGNvbnRleHQzLmRyYXdJbWFnZShjb3ZlckdsYXNzLCBwYXJzZUludChjYW52YXMzLndpZHRoICogMC41OTc1KSwgMzQxNSwgcGFyc2VJbnQoY2FudmFzMy53aWR0aCAqIDAuMTI1KSwgcGFyc2VJbnQoKGNhbnZhczMud2lkdGggKiAwLjEyNSkgKiAoMjI0LjAvMTQ5LjApKSk7XG4gICAgICBcbiAgICAgIGxlZnRDb3ZlckdsYXNzID0gbmV3IENhbnZhc0ltYWdlKFtjb3ZlckdsYXNzXSwgMC4yOTEsICgzNDE1LjAvY2FudmFzMy53aWR0aCksIDAsIDAuMDAwNSwgMCwgMCwgbmV3IEFycmF5KHt4OjAuMjkxLHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKX0pKTtcbiAgICAgIHJpZ2h0Q292ZXJHbGFzcyA9IG5ldyBDYW52YXNJbWFnZShbY292ZXJHbGFzc10sIDAuNTk3NSwgKDM0MTUuMC9jYW52YXMzLndpZHRoKSwgMCwgMC4wMDA1LCAwLCAwLCBuZXcgQXJyYXkoe3g6MC41OTc1LHk6KDM0MTUuMC9jYW52YXMzLndpZHRoKX0pKVxuXG4gICAgICBpZiAobGVmdENvdmVyR2xhc3MgPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVswXS54KSB7XG4gICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxlZnRDb3ZlckdsYXNzLnkgPiBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVswXS55KSB7XG4gICAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZWZ0Q292ZXJHbGFzcy55RGlyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChyaWdodENvdmVyR2xhc3MgPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbMF0ueCkge1xuICAgICAgIHJpZ2h0Q292ZXJHbGFzcy54RGlyID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHJpZ2h0Q292ZXJHbGFzcy55ID4gcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5WzBdLnkpIHtcbiAgICAgICAgcmlnaHRDb3ZlckdsYXNzLnlEaXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByaWdodENvdmVyR2xhc3MueURpciA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHZhciB0dWJlN0hvdmVyID0gbmV3IEltYWdlKCk7XG4gICAgICB0dWJlN0hvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZSh0dWJlN0hvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjA2KSwgMzIwMCwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC42NzA3KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNjcwNykgKiAoNTUyLjAvODAwLjApKSk7XG4gICAgICAgIFxuICAgICAgICBjb3ZlckdsYXNzSG92ZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgY292ZXJHbGFzc0hvdmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy9jb250ZXh0NS5kcmF3SW1hZ2UoY292ZXJHbGFzc0hvdmVyLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjI5OCksIDM1OTMsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMTEzKSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMTEzKSAqICg0Mi4wLzEzNS4wKSkpO1xuICAgICAgICAgIC8vY29udGV4dDUuZHJhd0ltYWdlKGNvdmVyR2xhc3NIb3ZlciwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC42MDUpLCAzNTkzLCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjExMyksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjExMykgKiAoNDIuMC8xMzUuMCkpKTtcbiAgICAgICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyID0gbmV3IENhbnZhc0ltYWdlKFtjb3ZlckdsYXNzSG92ZXJdLCAwLjI5OCwgKDM1OTMuMC9jYW52YXMzLndpZHRoKSwgMCwgMC4wMDA1LCAwLCAwLCBuZXcgQXJyYXkoe3g6MC4yOTgseTooMzU5My4wL2NhbnZhczMud2lkdGgpfSkpO1xuICAgICAgICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyID0gbmV3IENhbnZhc0ltYWdlKFtjb3ZlckdsYXNzSG92ZXJdLCAwLjYwNSwgKDM1OTMuMC9jYW52YXMzLndpZHRoKSwgMCwgMC4wMDA1LCAwLCAwLCBuZXcgQXJyYXkoe3g6MC42MDUseTooMzU5My4wL2NhbnZhczMud2lkdGgpfSkpXG4gICAgICAgIH0pO1xuICAgICAgICBjb3ZlckdsYXNzSG92ZXIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvY292ZXItZ2xhc3MtYW5pbWF0ZS5wbmcnO1xuXG4gICAgICB9KTtcbiAgICAgIHR1YmU3SG92ZXIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvdHViZTctaG92ZXIucG5nJztcbiAgICB9KTtcbiAgICBjb3ZlckdsYXNzLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL2NvdmVyLWdsYXNzLnBuZyc7XG4gIH0pO1xuICB0dWJlNy5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy90dWJlNy5wbmcnO1xuXG4gIHZhciBjaGFydCA9IG5ldyBJbWFnZSgpO1xuICBjaGFydC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQyLmRyYXdJbWFnZShjaGFydCwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNSkgLSAoY2FudmFzLndpZHRoICogMC43NyAqIDAuNSkpLCAzNzU1LCBwYXJzZUludChjYW52YXMud2lkdGggKiAwLjc3KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNzcpICogKDMxNS4wLzkxMi4wKSkpO1xuICB9KTtcbiAgY2hhcnQuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvbGFzdC1jaGFydC5wbmcnO1xuXG4gIHZhciBjaGFydDIgPSBuZXcgSW1hZ2UoKTtcbiAgY2hhcnQyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dDIuZHJhd0ltYWdlKGNoYXJ0MiwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuNSkgLSAoY2FudmFzLndpZHRoICogMC43MDI2ICogMC41KSksIDQwNTUsIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuNzAyNiksIHBhcnNlSW50KChjYW52YXMud2lkdGggKiAwLjcwMjYpICogKDE4OC4wLzgzOC4wKSkpO1xuICB9KTtcbiAgY2hhcnQyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL2dyYXBoaWMucG5nJztcbn1cbi8vRHJhdyBhbiBpbWFnZSByb3RhdGVkXG52YXIgVE9fUkFESUFOUyA9IE1hdGguUEkvMTgwOyBcbmZ1bmN0aW9uIGRyYXdSb3RhdGVkSW1hZ2UoaW1hZ2UsIHgsIHksIGFuZ2xlLCBhdXhDdHgpIHsgXG4gXG4gIC8vIHNhdmUgdGhlIGN1cnJlbnQgY28tb3JkaW5hdGUgc3lzdGVtIFxuICAvLyBiZWZvcmUgd2Ugc2NyZXcgd2l0aCBpdFxuICBhdXhDdHguc2F2ZSgpOyBcbiBcbiAgLy8gbW92ZSB0byB0aGUgbWlkZGxlIG9mIHdoZXJlIHdlIHdhbnQgdG8gZHJhdyBvdXIgaW1hZ2VcbiAgYXV4Q3R4LnRyYW5zbGF0ZSh4ICsgKGltYWdlLndpZHRoLzIpLCB5ICsgKGltYWdlLmhlaWdodC8yKSk7XG4gXG4gIC8vIHJvdGF0ZSBhcm91bmQgdGhhdCBwb2ludCwgY29udmVydGluZyBvdXIgXG4gIC8vIGFuZ2xlIGZyb20gZGVncmVlcyB0byByYWRpYW5zIFxuICBhdXhDdHgucm90YXRlKGFuZ2xlKTtcbiBcbiAgLy8gZHJhdyBpdCB1cCBhbmQgdG8gdGhlIGxlZnQgYnkgaGFsZiB0aGUgd2lkdGhcbiAgLy8gYW5kIGhlaWdodCBvZiB0aGUgaW1hZ2UgXG4gIGF1eEN0eC5kcmF3SW1hZ2UoaW1hZ2UsIC0oaW1hZ2Uud2lkdGgvMiksIC0oaW1hZ2UuaGVpZ2h0LzIpKTtcbiBcbiAgLy8gYW5kIHJlc3RvcmUgdGhlIGNvLW9yZHMgdG8gaG93IHRoZXkgd2VyZSB3aGVuIHdlIGJlZ2FuXG4gIGF1eEN0eC5yZXN0b3JlKCk7IC8vXG59XG4vL1NldHVwIG1vc3F1aXRvc1xudmFyIHNldHVwTW9zcXVpdG9zID0gZnVuY3Rpb24oKXtcbiAgdmFyIG1vc3F1aXRvID0gbmV3IEltYWdlKCk7XG4gIG1vc3F1aXRvLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy9cbiAgfSk7XG4gIG1vc3F1aXRvLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL21vc3F1aXRvMV9sZWZ0LnBuZyc7XG4gIHZhciBtb3NxdWl0bzIgPSBuZXcgSW1hZ2UoKTtcbiAgbW9zcXVpdG8yLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy9cbiAgfSk7XG4gIG1vc3F1aXRvMi5zcmMgPSAnaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy9tb3NxdWl0bzJfbGVmdC5wbmcnO1xuICB2YXIgbW9zcXVpdG9GbGlwcGVkID0gbmV3IEltYWdlKCk7XG4gIG1vc3F1aXRvRmxpcHBlZC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIC8vXG4gIH0pO1xuICBtb3NxdWl0b0ZsaXBwZWQuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvbW9zcXVpdG8xX2xlZnQucG5nJztcbiAgdmFyIG1vc3F1aXRvMkZsaXBwZWQgPSBuZXcgSW1hZ2UoKTtcbiAgbW9zcXVpdG8yRmxpcHBlZC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIC8vXG4gIH0pO1xuICBtb3NxdWl0bzJGbGlwcGVkLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL21vc3F1aXRvMl9sZWZ0LnBuZyc7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3RhbE1vc3F1aXRvczsgaSsrKSB7XG4gICAgXG5cbiAgICBtb3NxdWl0b3NBcnJheS5wdXNoKG5ldyBDYW52YXNJbWFnZShbbW9zcXVpdG8vKiwgbW9zcXVpdG8yKi9dLCAwLCAwLCAwLCAwLjAwMSArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpLCAwLCAwLCBuZXcgQXJyYXkoKSkpO1xuXG4gICAgbW9zcXVpdG9zQXJyYXlbaV0uZmxpcHBlZEltYWdlcyA9IG5ldyBBcnJheShtb3NxdWl0b0ZsaXBwZWQvKiwgbW9zcXVpdG8yRmxpcHBlZCovKTtcbiAgICBcbiAgICB2YXIgYXV4UG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTFbaSVtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEubGVuZ3RoXTtcblxuICAgIGF1eFBvc2l0aW9uc0FycmF5ID0gc2h1ZmZsZShhdXhQb3NpdGlvbnNBcnJheSk7XG4gICAgXG4gICAgYXV4UG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KSB7XG4gICAgICB2YXIgYXV4RWxlbWVudCA9IHt4OiBlbGVtZW50LnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMS4wKSwgeTogZWxlbWVudC55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDEuMCl9O1xuICAgICAgYXV4RWxlbWVudC54ID0gTWF0aC5tYXgoMC41LCBNYXRoLm1pbigwLjg1LCBhdXhFbGVtZW50LngpKTtcbiAgICAgIGF1eEVsZW1lbnQueSA9IE1hdGgubWF4KDAuMSwgTWF0aC5taW4oMC4zLCBhdXhFbGVtZW50LnkpKTtcbiAgICAgIGlmIChhdXhFbGVtZW50LnkgPD0gMC4xICYmIGF1eEVsZW1lbnQueCA8PSAwLjQ5KSB7XG4gICAgICAgIGF1eEVsZW1lbnQueCA9IGF1eEVsZW1lbnQueCArIDAuMjtcbiAgICAgIH1cbiAgICAgIG1vc3F1aXRvc0FycmF5W2ldLnBvc2l0aW9uc0FycmF5LnB1c2goYXV4RWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICBtb3NxdWl0b3NBcnJheVtpXS5jdXJyZW50UG9zaXRpb24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheS5sZW5ndGgpO1xuICAgIG1vc3F1aXRvc0FycmF5W2ldLnggPSBtb3NxdWl0b3NBcnJheVtpXS5wb3NpdGlvbnNBcnJheVttb3NxdWl0b3NBcnJheVtpXS5jdXJyZW50UG9zaXRpb25dLng7XG4gICAgbW9zcXVpdG9zQXJyYXlbaV0ueSA9IG1vc3F1aXRvc0FycmF5W2ldLnBvc2l0aW9uc0FycmF5W21vc3F1aXRvc0FycmF5W2ldLmN1cnJlbnRQb3NpdGlvbl0ueTtcblxuICAgIHZhciBuZXh0UG9zaXRpb24gPSBtb3NxdWl0b3NBcnJheVtpXS5jdXJyZW50UG9zaXRpb24gKyAxO1xuICAgIGlmIChuZXh0UG9zaXRpb24gPj0gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXkubGVuZ3RoKSB7XG4gICAgICBuZXh0UG9zaXRpb24gPSAwO1xuICAgIH1cblxuICAgIGlmIChtb3NxdWl0b3NBcnJheVtpXS54ID4gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS54KSB7XG4gICAgICBtb3NxdWl0b3NBcnJheVtpXS54RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbW9zcXVpdG9zQXJyYXlbaV0ueERpciA9IHRydWU7XG4gICAgfVxuICAgIGlmIChtb3NxdWl0b3NBcnJheVtpXS55ID4gbW9zcXVpdG9zQXJyYXlbaV0ucG9zaXRpb25zQXJyYXlbbmV4dFBvc2l0aW9uXS55KSB7XG4gICAgICBtb3NxdWl0b3NBcnJheVtpXS55RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbW9zcXVpdG9zQXJyYXlbaV0ueURpciA9IHRydWU7XG4gICAgfVxuICB9XG59XG4vL0RlY2lkZSBuZXh0IHN0ZXAgYWN0aW9uc1xudmFyIGRlY2lkZU5leHRTdGVwID0gZnVuY3Rpb24obmV4dFN0ZXApe1xuICBzd2l0Y2ggKG5leHRTdGVwKSB7XG4gICAgY2FzZSAwOlxuICAgICAgJCgnI3BnU3RlcDEgLnBnLWJ1dHRvbicpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJCgnI3BnU3RlcDEnKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMlswXTtcblxuICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTtcbiAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICBzY3JvbGxUb3A6ICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjEnKS5vZmZzZXQoKS50b3BcbiAgICAgIH0sIDcwMDApO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMTpcbiAgICAgIHZhciBhdXhNb3NxdWl0b3NMZWZ0ID0gbW9zcXVpdG9zTGVmdDtcbiAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdCgwLCAyLCBwYXJzZUludCgkKCcjdmlzaXQtY291bnRyeScpLnZhbCgpKSk7XG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaW5kZXggPiBhdXhNb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoKTtcblxuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTRbMF1baV0pO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlswXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkucHVzaChtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTZbMF1baV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlOFswXVtpXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U2WzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNlswXVtpXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2U4WzBdW2ldKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCAvKisgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwMykqLztcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgLyorICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDMpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA3O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAkKFwiI3BnUXVlc3Rpb24tY29udGFpbmVyMVwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoXCIjcGdRdWVzdGlvbi1jb250YWluZXIxIHNlbGVjdFwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoXCIjcGdTdGVwMiAucGctYnV0dG9uXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoXCIjcGdTdGVwMlwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG5cbiAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsVG9wOiAkKCcjcGdTdGVwMicpLm9mZnNldCgpLnRvcFxuICAgICAgfSwgNTAwMCk7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgJCgnI3BnU3RlcDIgLnBnLWJ1dHRvbicpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgJChcIiNwZ1N0ZXAyXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZThbMF07XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDIpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55IC8qKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDIpKi87XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSA3O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbFRvcDogJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMicpLm9mZnNldCgpLnRvcFxuICAgICAgfSwgNzAwMCk7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgJCgnI3BnUXVlc3Rpb24tY29udGFpbmVyMiAucGctYnV0dG9uJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIyJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJykuYWRkQ2xhc3MoXCJkaXNhYmxlZC1vcHRpb25cIik7XG4gICAgICAkKFwiI3BnU3RlcDMgLnBnLWJ1dHRvblwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnU3RlcDNcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgICAgXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSgpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTBbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LnB1c2gobW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxMFswXVtpXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTEyWzBdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5wdXNoKG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTJbMF1baV0pO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTE7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsVG9wOiAkKCcjcGdTdGVwMycpLm9mZnNldCgpLnRvcFxuICAgICAgfSwgNzAwMCk7XG4gICAgYnJlYWs7XG4gICAgY2FzZSA0OlxuICAgICAgJChcIiNwZ1N0ZXAzIC5wZy1idXR0b25cIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKFwiI3BnU3RlcDNcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTJbMF07XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDMpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTE7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsVG9wOiAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzJykub2Zmc2V0KCkudG9wXG4gICAgICB9LCA3MDAwKTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzJdKS5maW5kKFwiLmNoZWNrXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdCg0LCAzLCAhJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKTtcblxuICAgICAgICBwcmVnbmFudE1vc3F1aXRvcyA9IG1vc3F1aXRvc0xlZnQgKiAwLjc1O1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBpZiAoaW5kZXggPCBwcmVnbmFudE1vc3F1aXRvcykge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE4WzBdO1xuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE3O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAkKCcjcGdRdWVzdGlvbi1jb250YWluZXIzIC5wZy1idXR0b24nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoJyNwZ1F1ZXN0aW9uLWNvbnRhaW5lcjMnKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoJy5wZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uJykuYWRkQ2xhc3MoXCJkaXNhYmxlZC1vcHRpb25cIik7XG5cbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIGlmIChpbmRleCA+PSBwcmVnbmFudE1vc3F1aXRvcyAmJiBpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UyMFswXTtcblxuICAgICAgICAgICAgY3VycmVudFBoYXNlID0gMjA7XG5cbiAgICAgICAgICAgICQoXCIjcGdTdGVwNFwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAzKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE5O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbFRvcDogJCgnI3BnU3RlcDQnKS5vZmZzZXQoKS50b3BcbiAgICAgIH0sIDcwMDApO1xuICAgICAgfSwgNzUwKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgfVxufTtcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBTdGVwc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vL0RlYWxzIHdpdGggdGhlIHNjcm9sbGluZyBiZXR3ZWVuIHN0ZXBzIGFuZCBxdWVzdGlvbnNcbnZhciBtYW5hZ2VTdGVwc0FjdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdTdGVwX19pbmZvX190ZXh0LWFjdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIG5leHRTdGVwID0gcGFyc2VJbnQoJCh0aGlzKS5hdHRyKCdkYXRhLXN0ZXAnKSk7XG4gICAgZGVjaWRlTmV4dFN0ZXAobmV4dFN0ZXApO1xuICB9KTtcbiAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsICdzZWxlY3QjdmlzaXQtY291bnRyeScsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIG5leHRTdGVwID0gcGFyc2VJbnQoJCh0aGlzKS5hdHRyKCdkYXRhLXN0ZXAnKSArIDEpO1xuICAgIGRlY2lkZU5leHRTdGVwKG5leHRTdGVwKTtcbiAgfSk7XG59O1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgUXVlc3Rpb25zXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8vRGVhbHMgd2l0aCB0aGUgc2Nyb2xsaW5nIGJldHdlZW4gcXVlc3Rpb25zXG52YXIgbWFuYWdlUXVlc3Rpb25zU2Nyb2xsID0gZnVuY3Rpb24oKSB7XG4gICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCAnc2VsZWN0I2hvbWUtY291bnRyeScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXh0UG9zaXRpb24gPSAkKHRoaXMpLmF0dHIoJ2RhdGEtcG9zJyksXG4gICAgICBjdXJyZW50U3RlcCA9ICQodGhpcykuYXR0cignZGF0YS1zdGVwJyk7XG5cbiAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbY3VycmVudFN0ZXBdKSxcbiAgICAgICAgJHF1ZXN0aW9uQ29udGFpbmVyID0gJCgkKCcucGdRdWVzdGlvbi1jb250YWluZXInKVtjdXJyZW50U3RlcF0pLFxuICAgICAgICBuZXdUcmFuc2xhdGlvblZhbHVlID0gLSgoJHF1ZXN0aW9uQ29udGFpbmVyLndpZHRoKCkgKiBuZXh0UG9zaXRpb24pIC8gJHF1ZXN0aW9uV3JhcHBlci53aWR0aCgpKSAqIDEwMC4wLFxuICAgICAgICBuZXdUcmFuc2xhdGlvbiA9ICd0cmFuc2xhdGUzZCgnICsgbmV3VHJhbnNsYXRpb25WYWx1ZSArICclLDAsMCknO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctbW96LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJ3RyYW5zZm9ybTonLCBuZXdUcmFuc2xhdGlvbik7XG5cbiAgICAgIGlmIChjdXJyZW50U3RlcCA9PSAwICYmIG5leHRQb3NpdGlvbiA9PSAxKSB7XG4gICAgICBtb3NxdWl0b3NMZWZ0IC09IHJldHVybk1vc3F1aXRvc0xlZnQoY3VycmVudFN0ZXAsIG5leHRQb3NpdGlvbiwgcGFyc2VJbnQoJCgnI2hvbWUtY291bnRyeScpLnZhbCgpKSk7XG5cbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2U0WzBdO1xuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMztcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNCArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdRdWVzdGlvbi1hY3Rpb24nLCBmdW5jdGlvbigpe1xuICAgICQodGhpcykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgdmFyIG5leHRQb3NpdGlvbiA9ICQodGhpcykuYXR0cignZGF0YS1wb3MnKSxcbiAgICAgIGN1cnJlbnRTdGVwID0gJCh0aGlzKS5hdHRyKCdkYXRhLXN0ZXAnKTtcblxuICAgIHZhciBhdXhDdXJyZW50U3RlcCA9IGN1cnJlbnRTdGVwO1xuICAgIGlmIChuZXh0UG9zaXRpb24gIT0gLTEpIHtcbiAgICAgIFxuICAgICAgaWYgKGN1cnJlbnRTdGVwID09IDMpIHtcbiAgICAgICAgYXV4Q3VycmVudFN0ZXAgPSAyO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgJHF1ZXN0aW9uQ29udGFpbmVyID0gJCgkKCcucGdRdWVzdGlvbi1jb250YWluZXInKVthdXhDdXJyZW50U3RlcF0pLFxuICAgICAgICBuZXdUcmFuc2xhdGlvblZhbHVlID0gLSgoJHF1ZXN0aW9uQ29udGFpbmVyLndpZHRoKCkgKiBuZXh0UG9zaXRpb24pIC8gJHF1ZXN0aW9uV3JhcHBlci53aWR0aCgpKSAqIDEwMC4wLFxuICAgICAgICBuZXdUcmFuc2xhdGlvbiA9ICd0cmFuc2xhdGUzZCgnICsgbmV3VHJhbnNsYXRpb25WYWx1ZSArICclLDAsMCknO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctbW96LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJ3RyYW5zZm9ybTonLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKHBhcnNlSW50KGN1cnJlbnRTdGVwKSA9PSAyKSB7XG4gICAgICAgIG1vc3F1aXRvc0xlZnQgLT0gcmV0dXJuTW9zcXVpdG9zTGVmdChwYXJzZUludChjdXJyZW50U3RlcCksIG5leHRQb3NpdGlvbiwgMClcbiAgICAgIH1cbiAgICAgIGRlY2lkZU5leHRTdGVwKHBhcnNlSW50KGN1cnJlbnRTdGVwKSArIDEpO1xuICAgIH1cbiAgICBpZiAoY3VycmVudFN0ZXAgPT0gMCAmJiBuZXh0UG9zaXRpb24gPT0gMSkge1xuICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sIHBhcnNlSW50KCQoJyNob21lLWNvdW50cnknKS52YWwoKSkpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlNFswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDM7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGN1cnJlbnRTdGVwID09IDMgJiYgbmV4dFBvc2l0aW9uID09IDEpIHtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcIi5jaGVja1wiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2F1eEN1cnJlbnRTdGVwXSksXG4gICAgICAgICRxdWVzdGlvbkNvbnRhaW5lciA9ICQoJCgnLnBnUXVlc3Rpb24tY29udGFpbmVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwwLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pOy8vXG5cbiAgICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sICgkKCQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcInBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIilbMF0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpID8gMCA6ICgoJCgkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMF0pLmZpbmQoXCJwZ1F1ZXN0aW9uX19ib2R5X19iaW5hcnktb3B0aW9uXCIpWzFdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSA/IDEgOiAyKSk7XG5cbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNFswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDEzO1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgIH0pO1xuICAgICAgfSwgNzUwKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY3VycmVudFN0ZXAgPT0gMyAmJiBuZXh0UG9zaXRpb24gPT0gMikge1xuICAgICAgJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzFdKS5maW5kKFwiLmNoZWNrXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcXVlc3Rpb25XcmFwcGVyID0gJCgkKCcucGdRdWVzdGlvbi13cmFwcGVyJylbYXV4Q3VycmVudFN0ZXBdKSxcbiAgICAgICAgJHF1ZXN0aW9uQ29udGFpbmVyID0gJCgkKCcucGdRdWVzdGlvbi1jb250YWluZXInKVthdXhDdXJyZW50U3RlcF0pLFxuICAgICAgICBuZXdUcmFuc2xhdGlvblZhbHVlID0gLSgoJHF1ZXN0aW9uQ29udGFpbmVyLndpZHRoKCkgKiBuZXh0UG9zaXRpb24pIC8gJHF1ZXN0aW9uV3JhcHBlci53aWR0aCgpKSAqIDEwMC4wLFxuICAgICAgICBuZXdUcmFuc2xhdGlvbiA9ICd0cmFuc2xhdGUzZCgnICsgbmV3VHJhbnNsYXRpb25WYWx1ZSArICclLDAsMCknO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctbW96LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJ3RyYW5zZm9ybTonLCBuZXdUcmFuc2xhdGlvbik7Ly9cblxuICAgICAgICBtb3NxdWl0b3NMZWZ0IC09IHJldHVybk1vc3F1aXRvc0xlZnQoY3VycmVudFN0ZXAsIG5leHRQb3NpdGlvbiwgISQoJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzFdKS5maW5kKFwicGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSk7XG5cbiAgICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgLy8gYWRkIGRlbGF5XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbW9zcXVpdG9zUG9zaXRpb25zUGhhc2UxNlswXTtcblxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQyLGluZGV4MixhcnJheTIpIHtcbiAgICAgICAgICAgICAgZWxlbWVudDIueCA9IGVsZW1lbnQyLnggKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudDIueSA9IGVsZW1lbnQyLnkgKyAoKChNYXRoLnJhbmRvbSgpICogMC4xKSAtIDAuMDUpICogMC4wMDA3KTtcbiAgICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheVtpbmRleDJdID0gZWxlbWVudDI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgICAgICAgICAgZWxlbWVudC5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDE1O1xuICAgICAgICAgICAgZWxlbWVudC5zcGVlZCA9IDAuMDA0ICsgKE1hdGgucmFuZG9tKCkgKiAwLjAwMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC54ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnhEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQueSA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLnkpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC55RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgIH0pO1xuICAgICAgfSwgNzUwKTtcbiAgICB9XG5cbiAgfSk7XG59O1xuXG4vL1NlbGVjdCBhbiBvcHRpb24gb24gdGhlIHNlY29uZCBxdWVzdGlvblxudmFyIHNlbGVjdE9wdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uOm5vdCguZGlzYWJsZWQtb3B0aW9uKScsIGZ1bmN0aW9uKCkge1xuICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgICQodGhpcykuZmluZChcImltZ1wiKS5hdHRyKFwic3JjXCIsIFwiaHR0cDovL3lvd2x1LmNvbS93YXBvL2ltYWdlcy9cIiArIGJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAkKHRoaXMpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG4gICAgICAkKHRoaXMpLmZpbmQoXCJpbWdcIikuYXR0cihcInNyY1wiLCBcImh0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvXCIgKyBob3ZlckJlaGF2aW9ySW1hZ2VzWyQodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIildKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLy9TZWxlY3QgYSBiaW5hcnkgb3B0aW9uIG9uIHRoZSB0aGlyZCBxdWVzdGlvblxudmFyIHNlbGVjdEJpbmFyeU9wdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvbjpub3QoLmRpc2FibGVkLW9wdGlvbiknLCBmdW5jdGlvbigpIHtcblxuICAgIHZhciBuZXh0UG9zaXRpb24gPSAkKHRoaXMpLmF0dHIoJ2RhdGEtcG9zJyksXG4gICAgICBjdXJyZW50U3RlcCA9ICQodGhpcykuYXR0cignZGF0YS1zdGVwJyk7XG5cbiAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG4gICAgICAvLyBtb3ZlIG1vc3F1aXRvc1xuICAgICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKFwiLnBnLWJ1dHRvblwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAkKHRoaXMpLnBhcmVudCgpLmZpbmQoXCIucGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuICAgICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKFwiLnBnLWJ1dHRvblwiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTdGVwID09IDMgJiYgbmV4dFBvc2l0aW9uID09IDEpIHtcbiAgICAgICQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcIi5jaGVja1wiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHF1ZXN0aW9uV3JhcHBlciA9ICQoJCgnLnBnUXVlc3Rpb24td3JhcHBlcicpW2N1cnJlbnRTdGVwIC0gMV0pLFxuICAgICAgICAkcXVlc3Rpb25Db250YWluZXIgPSAkKCQoJy5wZ1F1ZXN0aW9uLWNvbnRhaW5lcicpW2N1cnJlbnRTdGVwIC0gMV0pLFxuICAgICAgICBuZXdUcmFuc2xhdGlvblZhbHVlID0gLSgoJHF1ZXN0aW9uQ29udGFpbmVyLndpZHRoKCkgKiBuZXh0UG9zaXRpb24pIC8gJHF1ZXN0aW9uV3JhcHBlci53aWR0aCgpKSAqIDEwMC4wLFxuICAgICAgICBuZXdUcmFuc2xhdGlvbiA9ICd0cmFuc2xhdGUzZCgnICsgbmV3VHJhbnNsYXRpb25WYWx1ZSArICclLDAsMCknO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCctbW96LXRyYW5zZm9ybScsIG5ld1RyYW5zbGF0aW9uKTtcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJ3RyYW5zZm9ybTonLCBuZXdUcmFuc2xhdGlvbik7Ly9cblxuICAgICAgICBtb3NxdWl0b3NMZWZ0IC09IHJldHVybk1vc3F1aXRvc0xlZnQoY3VycmVudFN0ZXAsIG5leHRQb3NpdGlvbiwgKCQoJCgkKCcjcGdRdWVzdGlvbi13cmFwcGVyMyAucGdRdWVzdGlvbicpWzBdKS5maW5kKFwicGdRdWVzdGlvbl9fYm9keV9fYmluYXJ5LW9wdGlvblwiKVswXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkgPyAwIDogKCgkKCQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVswXSkuZmluZChcInBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIilbMV0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpID8gMSA6IDIpKTtcblxuICAgICAgbW9zcXVpdG9zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LGluZGV4LGFycmF5KXtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBtb3NxdWl0b3NMZWZ0KSB7XG4gICAgICAgICAgICAvLyBhZGQgZGVsYXlcbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkgPSBtb3NxdWl0b3NQb3NpdGlvbnNQaGFzZTE0WzBdO1xuXG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudDIsaW5kZXgyLGFycmF5Mikge1xuICAgICAgICAgICAgICBlbGVtZW50Mi54ID0gZWxlbWVudDIueCArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50Mi55ID0gZWxlbWVudDIueSArICgoKE1hdGgucmFuZG9tKCkgKiAwLjEpIC0gMC4wNSkgKiAwLjAwMDcpO1xuICAgICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2luZGV4Ml0gPSBlbGVtZW50MjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMTM7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDQgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgTWF0aC5yYW5kb20oKSAqIDE1MDApO1xuICAgICAgfSk7XG4gICAgICB9LCA3NTApO1xuICAgIH1cbiAgICBlbHNlIGlmIChjdXJyZW50U3RlcCA9PSAzICYmIG5leHRQb3NpdGlvbiA9PSAyKSB7XG4gICAgICAkKCQoJyNwZ1F1ZXN0aW9uLXdyYXBwZXIzIC5wZ1F1ZXN0aW9uJylbMV0pLmZpbmQoXCIuY2hlY2tcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRxdWVzdGlvbldyYXBwZXIgPSAkKCQoJy5wZ1F1ZXN0aW9uLXdyYXBwZXInKVtjdXJyZW50U3RlcCAtIDFdKSxcbiAgICAgICAgJHF1ZXN0aW9uQ29udGFpbmVyID0gJCgkKCcucGdRdWVzdGlvbi1jb250YWluZXInKVtjdXJyZW50U3RlcCAtIDFdKSxcbiAgICAgICAgbmV3VHJhbnNsYXRpb25WYWx1ZSA9IC0oKCRxdWVzdGlvbkNvbnRhaW5lci53aWR0aCgpICogbmV4dFBvc2l0aW9uKSAvICRxdWVzdGlvbldyYXBwZXIud2lkdGgoKSkgKiAxMDAuMCxcbiAgICAgICAgbmV3VHJhbnNsYXRpb24gPSAndHJhbnNsYXRlM2QoJyArIG5ld1RyYW5zbGF0aW9uVmFsdWUgKyAnJSwwLDApJztcbiAgICAgICAgJHF1ZXN0aW9uV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgbmV3VHJhbnNsYXRpb24pO1xuICAgICAgICAkcXVlc3Rpb25XcmFwcGVyLmNzcygnLW1vei10cmFuc2Zvcm0nLCBuZXdUcmFuc2xhdGlvbik7XG4gICAgICAgICRxdWVzdGlvbldyYXBwZXIuY3NzKCd0cmFuc2Zvcm06JywgbmV3VHJhbnNsYXRpb24pOy8vXG5cbiAgICAgICAgbW9zcXVpdG9zTGVmdCAtPSByZXR1cm5Nb3NxdWl0b3NMZWZ0KGN1cnJlbnRTdGVwLCBuZXh0UG9zaXRpb24sICEkKCQoJCgnI3BnUXVlc3Rpb24td3JhcHBlcjMgLnBnUXVlc3Rpb24nKVsxXSkuZmluZChcInBnUXVlc3Rpb25fX2JvZHlfX2JpbmFyeS1vcHRpb25cIilbMV0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikpO1xuXG4gICAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IG1vc3F1aXRvc0xlZnQpIHtcbiAgICAgICAgICAgIC8vIGFkZCBkZWxheVxuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG1vc3F1aXRvc1Bvc2l0aW9uc1BoYXNlMTZbMF07XG5cbiAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50MixpbmRleDIsYXJyYXkyKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnggPSBlbGVtZW50Mi54ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQyLnkgPSBlbGVtZW50Mi55ICsgKCgoTWF0aC5yYW5kb20oKSAqIDAuMSkgLSAwLjA1KSAqIDAuMDAwNyk7XG4gICAgICAgICAgICAgIGVsZW1lbnQucG9zaXRpb25zQXJyYXlbaW5kZXgyXSA9IGVsZW1lbnQyO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAxNTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwNCArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCBNYXRoLnJhbmRvbSgpICogMTUwMCk7XG4gICAgICB9KTtcbiAgICAgIH0sIDc1MCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZGVjaWRlTmV4dFN0ZXAoNSk7XG4gICAgfVxuXG4gIH0pO1xufTtcblxuLy9TZWxlY3QgdGhlIHByZWduYW5jeSBvcHRpb25cbnZhciBzZWxlY3RQcmVnbmFuY3lPcHRpb24gPSBmdW5jdGlvbigpIHtcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5wZ1N0ZXBfX3ByZWduYW5jeS1vaycsIGZ1bmN0aW9uKCnCoHtcbiAgICBpZiAoY3VycmVudFBoYXNlID09IDIwKSB7XG4gICAgICAkKCcucGdTdGVwX19wcmVnbmFuY3ktb2snKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgICQoJy5wZ1N0ZXBfX3ByZWduYW5jeS1rbycpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICAgY3VycmVudFBoYXNlID0gMjE7XG4gICAgcHJlZ25hbnRTZWxlY3RlZCA9IHRydWU7XG4gICAgbGVmdENvdmVyR2xhc3MuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAyXG4gICAgbGVmdENvdmVyR2xhc3Muc3BlZWQgPSAwLjAwMTtcbiAgICBsZWZ0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDowLjI5MSx5OigzNDE1LjAvY2FudmFzMy53aWR0aCkgLSAwLjA2NX0pO1xuICAgIGxlZnRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6MC4yOTgseTooMzU5My4wL2NhbnZhczMud2lkdGgpIC0gMC4wNjV9KTtcbiAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgbGVmdENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICBpZiAobGVmdENvdmVyR2xhc3MueCA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgbGVmdENvdmVyR2xhc3MueERpciA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLnhEaXIgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAobGVmdENvdmVyR2xhc3MueSA+IGxlZnRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgbGVmdENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGxlZnRDb3ZlckdsYXNzLnlEaXIgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChsZWZ0Q292ZXJHbGFzc0hvdmVyLnggPiBsZWZ0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5W2xlZnRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBsZWZ0Q292ZXJHbGFzc0hvdmVyLnhEaXIgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAobGVmdENvdmVyR2xhc3NIb3Zlci55ID4gbGVmdENvdmVyR2xhc3NIb3Zlci5wb3NpdGlvbnNBcnJheVtsZWZ0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbGVmdENvdmVyR2xhc3NIb3Zlci55RGlyID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB2YXIgY2VsbCA9IE1hdGguZmxvb3IoMjUgKiAobW9zcXVpdG9zTGVmdCAvIHRvdGFsTW9zcXVpdG9zKSk7XG4gICAgdmFyIG5ld1ggPSAwLjM7XG4gICAgdmFyIG5ld1kgPSAzLjIyO1xuICAgIHN3aXRjaCAoY2VsbCkge1xuICAgICAgY2FzZSAxOlxuICAgICAgY2FzZSAzOlxuICAgICAgY2FzZSA1OlxuICAgICAgY2FzZSA4OlxuICAgICAgY2FzZSAxMjpcbiAgICAgICAgbmV3WCA9IDAuMztcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgY2FzZSA2OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTQ6XG4gICAgICBjYXNlIDE3OlxuICAgICAgICBuZXdYID0gMC40O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQ6XG4gICAgICBjYXNlIDk6XG4gICAgICBjYXNlIDE1OlxuICAgICAgY2FzZSAxOTpcbiAgICAgIGNhc2UgMjE6XG4gICAgICAgIG5ld1ggPSAwLjU7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNzpcbiAgICAgIGNhc2UgMTM6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMjpcbiAgICAgIGNhc2UgMjQ6XG4gICAgICAgIG5ld1ggPSAwLjY7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTE6XG4gICAgICBjYXNlIDE2OlxuICAgICAgY2FzZSAyMDpcbiAgICAgIGNhc2UgMjM6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBuZXdYID0gMC43O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHN3aXRjaCAoY2VsbCkge1xuICAgICAgY2FzZSAxOlxuICAgICAgY2FzZSAyOlxuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA3OlxuICAgICAgY2FzZSAxMTpcbiAgICAgICAgbmV3WSA9IDMuMzk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgOTpcbiAgICAgIGNhc2UgMTM6XG4gICAgICBjYXNlIDE2OlxuICAgICAgICBuZXdZID0gMy4zNDc1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDU6XG4gICAgICBjYXNlIDEwOlxuICAgICAgY2FzZSAxNTpcbiAgICAgIGNhc2UgMTg6XG4gICAgICBjYXNlIDIwOlxuICAgICAgICBuZXdZID0gMy4zMDU7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTQ6XG4gICAgICBjYXNlIDE5OlxuICAgICAgY2FzZSAyMjpcbiAgICAgIGNhc2UgMjM6XG4gICAgICAgIG5ld1kgPSAzLjI2MjU7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMTI6XG4gICAgICBjYXNlIDE3OlxuICAgICAgY2FzZSAyMTpcbiAgICAgIGNhc2UgMjQ6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBuZXdZID0gMy4yMjtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBuZXdQb3NpdGlvbnNBcnJheSA9IG5ldyBBcnJheSh7eDogbmV3WCwgeTogbmV3WX0pO1xuICAgIFxuICAgIHZhciBtYXJrZXIgPSBuZXcgSW1hZ2UoKTtcbiAgICBtYXJrZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnRleHQ0LmRyYXdJbWFnZShtYXJrZXIsIHBhcnNlSW50KChuZXdYICogY2FudmFzLndpZHRoKSAtICgoY2FudmFzLndpZHRoICogMC4wMjQpICogMC41KSksIHBhcnNlSW50KChuZXdZICogY2FudmFzLndpZHRoKSAtICgoY2FudmFzLndpZHRoICogMC4wMjQpICogKDM3LjAvMjkuMCkgKiAwLjUpKSwgcGFyc2VJbnQoY2FudmFzLndpZHRoICogMC4wMjQpLCBwYXJzZUludCgoY2FudmFzLndpZHRoICogMC4wMjQpICogKDM3LjAvMjkuMCkpKTtcbiAgICB9KTtcbiAgICBtYXJrZXIuc3JjID0gJ2h0dHA6Ly95b3dsdS5jb20vd2Fwby9pbWFnZXMvbWFya2VyLnBuZyc7XG5cbiAgICBtb3NxdWl0b3NBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgsYXJyYXkpe1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IHByZWduYW50TW9zcXVpdG9zKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBvc2l0aW9uc0FycmF5ID0gbmV3UG9zaXRpb25zQXJyYXk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICAgICAgICAgIGVsZW1lbnQuY3VycmVudE1vc3F1aXRvUGhhc2UgPSAyMTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3BlZWQgPSAwLjAwMiArIChNYXRoLnJhbmRvbSgpICogMC4wMDEpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQueCA+IGVsZW1lbnQucG9zaXRpb25zQXJyYXlbZWxlbWVudC5jdXJyZW50UG9zaXRpb25dLngpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC54RGlyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LnkgPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueURpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCAoTWF0aC5yYW5kb20oKSAqIDE1MDApICsgMTAwMCk7XG4gICAgICB9KTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgY3JlYXRlQ29uY2x1c2lvbnMoY2VsbCk7XG4gICAgICBjcmVhdGVVc2Vyc1N0YXRzKG5ld1gsIG5ld1kpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogJCgnLnBnU3RlcF9fbGFzdC1jaGFydCcpLm9mZnNldCgpLnRvcFxuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0sIDEwMDApO1xuICAgIH0sIDIwMDApO1xuICAgIH1cbiAgfSk7XG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucGdTdGVwX19wcmVnbmFuY3kta28nLCBmdW5jdGlvbigpwqB7XG4gICAgaWYgKGN1cnJlbnRQaGFzZSA9PSAyMCkge1xuICAgICAgJCgnLnBnU3RlcF9fcHJlZ25hbmN5LW9rJykuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAkKCcucGdTdGVwX19wcmVnbmFuY3kta28nKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAgIGN1cnJlbnRQaGFzZSA9IDIxO1xuICAgIG5vblByZWduYW50U2VsZWN0ZWQgPSB0cnVlO1xuICAgIHJpZ2h0Q292ZXJHbGFzcy5jdXJyZW50TW9zcXVpdG9QaGFzZSA9IDI7XG4gICAgcmlnaHRDb3ZlckdsYXNzLnNwZWVkID0gMC4wMDE7XG4gICAgcmlnaHRDb3ZlckdsYXNzLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuNTk3NSx5OigzNDE1LjAvY2FudmFzMy53aWR0aCkgLSAwLjA2NX0pO1xuICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLnBvc2l0aW9uc0FycmF5ID0gbmV3IEFycmF5KHt4OjAuNTk3NSx5OigzNTkzLjAvY2FudmFzMy53aWR0aCkgLSAwLjA2NX0pO1xuICAgIHJpZ2h0Q292ZXJHbGFzc0hvdmVyLmN1cnJlbnRQb3NpdGlvbiA9IDA7XG5cbiAgICByaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uID0gMDtcbiAgICBpZiAocmlnaHRDb3ZlckdsYXNzLnggPiByaWdodENvdmVyR2xhc3MucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzLmN1cnJlbnRQb3NpdGlvbl0ueCkge1xuICAgICAgcmlnaHRDb3ZlckdsYXNzLnhEaXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByaWdodENvdmVyR2xhc3MueERpciA9IHRydWU7XG4gICAgfVxuICAgIGlmIChyaWdodENvdmVyR2xhc3MueSA+IHJpZ2h0Q292ZXJHbGFzcy5wb3NpdGlvbnNBcnJheVtyaWdodENvdmVyR2xhc3MuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICByaWdodENvdmVyR2xhc3MueURpciA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJpZ2h0Q292ZXJHbGFzcy55RGlyID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByaWdodENvdmVyR2xhc3NIb3Zlci5jdXJyZW50UG9zaXRpb24gPSAwO1xuICAgIGlmIChyaWdodENvdmVyR2xhc3NIb3Zlci54ID4gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICByaWdodENvdmVyR2xhc3NIb3Zlci54RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueERpciA9IHRydWU7XG4gICAgfVxuICAgIGlmIChyaWdodENvdmVyR2xhc3NIb3Zlci55ID4gcmlnaHRDb3ZlckdsYXNzSG92ZXIucG9zaXRpb25zQXJyYXlbcmlnaHRDb3ZlckdsYXNzSG92ZXIuY3VycmVudFBvc2l0aW9uXS55KSB7XG4gICAgICByaWdodENvdmVyR2xhc3NIb3Zlci55RGlyID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmlnaHRDb3ZlckdsYXNzSG92ZXIueURpciA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIG5ld01vc3F1aXRvc0xlZnRWYWx1ZSA9IE1hdGgubWF4KDUsIG1vc3F1aXRvc0xlZnQgLSAobW9zcXVpdG9zTGVmdCAqIDAuNDUpKTtcblxuICAgIHZhciBjZWxsID0gTWF0aC5mbG9vcigyNSAqIChuZXdNb3NxdWl0b3NMZWZ0VmFsdWUgLyB0b3RhbE1vc3F1aXRvcykpO1xuICAgIHZhciBuZXdYID0gMC4zO1xuICAgIHZhciBuZXdZID0gMy4yMjtcbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMzpcbiAgICAgIGNhc2UgNTpcbiAgICAgIGNhc2UgODpcbiAgICAgIGNhc2UgMTI6XG4gICAgICAgIG5ld1ggPSAwLjM7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgIGNhc2UgNjpcbiAgICAgIGNhc2UgMTA6XG4gICAgICBjYXNlIDE0OlxuICAgICAgY2FzZSAxNzpcbiAgICAgICAgbmV3WCA9IDAuNDtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgY2FzZSA5OlxuICAgICAgY2FzZSAxNTpcbiAgICAgIGNhc2UgMTk6XG4gICAgICBjYXNlIDIxOlxuICAgICAgICBuZXdYID0gMC41O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDc6XG4gICAgICBjYXNlIDEzOlxuICAgICAgY2FzZSAxODpcbiAgICAgIGNhc2UgMjI6XG4gICAgICBjYXNlIDI0OlxuICAgICAgICBuZXdYID0gMC42O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDExOlxuICAgICAgY2FzZSAxNjpcbiAgICAgIGNhc2UgMjA6XG4gICAgICBjYXNlIDIzOlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WCA9IDAuNztcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgIGNhc2UgMjpcbiAgICAgIGNhc2UgNDpcbiAgICAgIGNhc2UgNzpcbiAgICAgIGNhc2UgMTE6XG4gICAgICAgIG5ld1kgPSAzLjM5O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICBjYXNlIDY6XG4gICAgICBjYXNlIDk6XG4gICAgICBjYXNlIDEzOlxuICAgICAgY2FzZSAxNjpcbiAgICAgICAgbmV3WSA9IDMuMzQ3NTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgY2FzZSAxMDpcbiAgICAgIGNhc2UgMTU6XG4gICAgICBjYXNlIDE4OlxuICAgICAgY2FzZSAyMDpcbiAgICAgICAgbmV3WSA9IDMuMzA1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDg6XG4gICAgICBjYXNlIDE0OlxuICAgICAgY2FzZSAxOTpcbiAgICAgIGNhc2UgMjI6XG4gICAgICBjYXNlIDIzOlxuICAgICAgICBuZXdZID0gMy4yNjI1O1xuICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEyOlxuICAgICAgY2FzZSAxNzpcbiAgICAgIGNhc2UgMjE6XG4gICAgICBjYXNlIDI0OlxuICAgICAgY2FzZSAyNTpcbiAgICAgICAgbmV3WSA9IDMuMjI7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgbmV3UG9zaXRpb25zQXJyYXkgPSBuZXcgQXJyYXkoe3g6IG5ld1gsIHk6IG5ld1l9KTtcbiAgICBcbiAgICB2YXIgbWFya2VyID0gbmV3IEltYWdlKCk7XG4gICAgbWFya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb250ZXh0Mi5kcmF3SW1hZ2UobWFya2VyLCBwYXJzZUludCgobmV3WCAqIGNhbnZhcy53aWR0aCkgLSAoKGNhbnZhcy53aWR0aCAqIDAuMDI0KSAqIDAuNSkpLCBwYXJzZUludCgobmV3WSAqIGNhbnZhcy53aWR0aCkgLSAoKGNhbnZhcy53aWR0aCAqIDAuMDI0KSAqICgzNy4wLzI5LjApICogMC41KSksIHBhcnNlSW50KGNhbnZhcy53aWR0aCAqIDAuMDI0KSwgcGFyc2VJbnQoKGNhbnZhcy53aWR0aCAqIDAuMDI0KSAqICgzNy4wLzI5LjApKSk7XG4gICAgfSk7XG4gICAgbWFya2VyLnNyYyA9ICdodHRwOi8veW93bHUuY29tL3dhcG8vaW1hZ2VzL21hcmtlci5wbmcnO1xuICAgIFxuICAgIG1vc3F1aXRvc0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCxpbmRleCxhcnJheSl7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluZGV4ID49IHByZWduYW50TW9zcXVpdG9zICYmIGluZGV4IDwgbW9zcXVpdG9zTGVmdCkge1xuICAgICAgICAgICAgZWxlbWVudC5wb3NpdGlvbnNBcnJheSA9IG5ld1Bvc2l0aW9uc0FycmF5O1xuXG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRQb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICBlbGVtZW50LmN1cnJlbnRNb3NxdWl0b1BoYXNlID0gMjE7XG4gICAgICAgICAgICBlbGVtZW50LnNwZWVkID0gMC4wMDIgKyAoTWF0aC5yYW5kb20oKSAqIDAuMDAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnggPiBlbGVtZW50LnBvc2l0aW9uc0FycmF5W2VsZW1lbnQuY3VycmVudFBvc2l0aW9uXS54KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQueERpciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudC55ID4gZWxlbWVudC5wb3NpdGlvbnNBcnJheVtlbGVtZW50LmN1cnJlbnRQb3NpdGlvbl0ueSkge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlbGVtZW50LnlEaXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgKE1hdGgucmFuZG9tKCkgKiAxNTAwKSArIDEwMDApO1xuICAgICAgfSk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgY3JlYXRlQ29uY2x1c2lvbnMoY2VsbCk7XG4gICAgICBjcmVhdGVVc2Vyc1N0YXRzKG5ld1gsIG5ld1kpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogJCgnLnBnU3RlcF9fbGFzdC1jaGFydCcpLm9mZnNldCgpLnRvcFxuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0sIDEwMDApO1xuICAgIH0sIDIwMDApO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vUmV0dXJuIG1vc3F1aXRvcyBsZWZ0IGRlcGVuZGluZyBvbiB0aGUgY2hvc2VuIGNvdW50cnlcbnZhciByZXR1cm5Nb3NxdWl0b3NMZWZ0ID0gZnVuY3Rpb24oc3RlcCwgcXVlc3Rpb24sIG9wdGlvbil7XG4gIHZhciBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcblxuICBpZiAoc3RlcCA9PSAwKSB7XG4gICAgaWYgKHF1ZXN0aW9uID09IDEpIHtcbiAgICAgIGlmIChvcHRpb24gPT0gMSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSAyKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSA4MDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHF1ZXN0aW9uID09IDIpIHtcbiAgICAgIGlmIChvcHRpb24gPT0gMSkge1xuICAgICAgICBpZiAobW9zcXVpdG9zTGVmdCA8PSAyMCkge1xuICAgICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAtODA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSAyKSB7XG4gICAgICAgIGlmIChtb3NxdWl0b3NMZWZ0IDw9IDIwKSB7XG4gICAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHN0ZXAgPT0gMikge1xuICAgIC8vaWYgKHF1ZXN0aW9uID09IDApIHtcbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVswXSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAzO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbMV0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDE7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzJdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAxOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVszXSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAxO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMDsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbNF0pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzVdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAxOyBcbiAgICAgIH1cbiAgICAgIGlmICgkKCQoJy5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb24nKVs2XSkuaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTsgXG4gICAgICB9XG4gICAgICBpZiAoJCgkKCcucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uJylbN10pLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgKz0gMTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7IFxuICAgICAgfVxuICAgICAgaWYgKCQoJCgnLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvbicpWzhdKS5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ICs9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCArPSAobW9zcXVpdG9zTGVmdCA8PSA4MCkgPyAyIDogMTsgXG4gICAgICB9XG4gICAgLy99XG4gIH1cblxuICBpZiAoc3RlcCA9PSAzKSB7XG4gICAgaWYgKHF1ZXN0aW9uID09IDEpIHtcbiAgICAgIGlmIChvcHRpb24gPT0gMCkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wdGlvbiA9PSAxKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocXVlc3Rpb24gPT0gMikge1xuICAgICAgaWYgKG9wdGlvbiA9PSAwKSB7XG4gICAgICAgIGF1eE1vc3F1aXRvc0xlZnQgPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAob3B0aW9uID09IDEpIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChxdWVzdGlvbiA9PSAzKSB7XG4gICAgICBpZiAob3B0aW9uID09IDApIHtcbiAgICAgICAgYXV4TW9zcXVpdG9zTGVmdCA9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcHRpb24gPT0gMSkge1xuICAgICAgICBhdXhNb3NxdWl0b3NMZWZ0ID0gMTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXV4TW9zcXVpdG9zTGVmdDtcbn07XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25jbHVzaW9uc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG52YXIgY3JlYXRlQ29uY2x1c2lvbnMgPSBmdW5jdGlvbihjZWxsKSB7XG4gIHZhciBjb25jbHVzaW9uc1RleHQgPSBcIjxoND48Yj5Zb3UgaGF2ZSBhIFwiO1xuXG4gIC8vWW91IGhhdmUgYSBsb3cvbWlkL2hpZ2ggcmlzayBvZiBjb250cmFjdGluZyB0aGUgWmlrYSB2aXJ1cywgYW5kIChidXQpIHRoZSBjb25zZXF1ZW5jZXMgd291bGQgYmUgbWlsZC8gY291bGQgYmUgc2VyaW91cy9cbiAgaWYgKGNlbGwgPD0gMTApIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCJsb3dcIjtcbiAgfVxuICBlbHNlIGlmIChjZWxsIDw9IDE5KSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwibWlkXCI7XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiaGlnaFwiO1xuICB9XG5cbiAgY29uY2x1c2lvbnNUZXh0ICs9IFwiIHJpc2sgb2YgY29udHJhY3RpbmcgdGhlIFppa2EgdmlydXMsIGFuZCAoYnV0KSB0aGUgY29uc2VxdWVuY2VzIFwiXG5cbiAgaWYgKGNlbGwgPD0gMTApIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCJ3b3VsZCBiZSBtaWxkLlwiO1xuICB9XG4gIGVsc2UgaWYgKGNlbGwgPD0gMTkpIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCJ3b3VsZCBiZSBtaWxkLlwiO1xuICB9XG4gIGVsc2Uge1xuICAgIGNvbmNsdXNpb25zVGV4dCArPSBcImNvdWxkIGJlIHNlcmlvdXMuXCI7XG4gIH1cblxuICBjb25jbHVzaW9uc1RleHQgKz0gXCI8L2I+PC9oND5cIjtcblxuICBpZiAocGFyc2VJbnQoJChcIiNob21lLWNvdW50cnlcIikudmFsKCkpID09IDIgJiYgcGFyc2VJbnQoJChcIiN2aXNpdC1jb3VudHJ5XCIpLnZhbCgpKSA9PSAyKSB7XG4gICAgaWYgKCEkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzhdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpIHx8IHByZWduYW50U2VsZWN0ZWQpIHtcbiAgICAgIGNvbmNsdXNpb25zVGV4dCArPSBcIjxwPllvdSBkb27igJl0IGxpdmUgaW4gYSBjb3VudHJ5IG5vciBhcmUgeW91IHBsYW5uaW5nIHRvIHRyYXZlbCB0byBhIGNvdW50cnkgYWZmZWN0ZWQgYnkgdGhlIFppa2EgdmlydXMuIDxiPllvdXIgcmlzayBpcyBsb3c8L2I+IGJ1dCByZW1lbWJlciB0aGF0IHRoZXJlIGhhdmUgYmVlbiA8Yj5jYXNlcyBvZiBzZXh1YWwgdHJhbnNtaXNzaW9uPC9iPiBieSBwYXJ0bmVycyB0aGF0IGdvdCBpbmZlY3RlZCBpbiB0aG9zZSBhcmVhcy48L3A+XCI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPHA+WW91IGRvbuKAmXQgbGl2ZSBpbiBhIGNvdW50cnkgbm9yIGFyZSB5b3UgcGxhbm5pbmcgdG8gdHJhdmVsIHRvIGEgY291bnRyeSBhZmZlY3RlZCBieSB0aGUgWmlrYSB2aXJ1cy4gPGI+WW91ciByaXNrIGlzIHplcm8uPGI+PC9wPlwiO1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD5Zb3UgbGl2ZSBpbiBhIGNvdW50cnkgdGhhdCBpcyBhZmZlY3RlZCBieSB0aGUgWmlrYSB2aXJ1cyBvciB5b3UgYXJlIHBsYW5uaW5nIHRvIHRyYXZlbCB0byBhIGNvdW50cnkgdGhhdCBpcy48L3A+XCI7XG5cbiAgICBpZiAoJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVsxXSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCAkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzJdKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpIHx8ICQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbNV0pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikgfHwgJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVs2XSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkge1xuICAgICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPHA+V2VhcmluZyBzaG9ydHMgYW5kIHNsZWV2ZWxlc3Mgc2hpcnRzIHRoYXQgYXJlIGRhcmsgaW4gY29sb3IgYW5kIGtlZXBpbmcgYnVja2V0cyBvZiB3YXRlciBvciBoYXZpbmcgd2F0ZXIgY29udGFpbmVycyBuZWFyIHlvdXIgaG91c2UgY2FuIDxiPmluY3JlYXNlIHlvdXIgcmlzayBvZiBiZWluZyBiaXR0ZW4gYnkgdGhlIG1vc3F1aXRvIGFuZCByYWlzZSB5b3VyIGNoYW5jZXMgb2YgZ2V0dGluZyB0aGUgdmlydXMuPC9iPjwvcD5cIjtcbiAgICB9XG4gICAgaWYgKCQoJChcIi5wZ1F1ZXN0aW9uX19ib2R5X19vcHRpb25cIilbM10pLmhhc0NsYXNzKFwic2VsZWN0ZWRcIikgfHwgJCgkKFwiLnBnUXVlc3Rpb25fX2JvZHlfX29wdGlvblwiKVs0XSkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSB8fCAkKCQoXCIucGdRdWVzdGlvbl9fYm9keV9fb3B0aW9uXCIpWzddKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD5Vc2luZyBpbnNlY3QgcmVwZWxsZW50LCB3ZWFyaW5nIGxpZ2h0IGNvbG9yIGNsb3RoZXMsIGhhdmluZyBwaHlzaWNhbCBiYXJyaWVycyBzdWNoIG1lc2ggc2NyZWVucyBvciB0cmVhdGVkIG5ldHRpbmcgbWF0ZXJpYWxzIG9uIGRvb3JzIGFuZCB3aW5kb3dzLCBvciBzbGVlcGluZyB1bmRlciBtb3NxdWl0byBuZXRzIHdpbGwgYWxsIDxiPmRlY3JlYXNlIHlvdXIgcmlzayBvZiBnZXR0aW5nIGJpdHRlbiBieSB0aGUgbW9zcXVpdG8gYW5kIGxvd2VyIHlvdXIgY2hhbmdlcyBvZiBnZXR0aW5nIHRoZSB2aXJ1cy48L2I+PC9wPlwiO1xuICAgIH1cblxuICAgIGlmIChub25QcmVnbmFudFNlbGVjdGVkKSB7XG4gICAgICBjb25jbHVzaW9uc1RleHQgKz0gXCI8cD5aaWthIHZpcnVzIGlzIHNwcmVhZCBwcmltYXJpbHkgdGhyb3VnaCB0aGUgYml0ZSBvZiBpbmZlY3RlZCBBZWRlcyBzcGVjaWVzIG1vc3F1aXRvZXMuIDxiPk9ubHkgMjAlIHBlb3BsZSB3aG8gY29udHJhY3QgdGhlIHZpcnVzIHdpbGwgZXZlbiBkZXZlbG9wIGFueSBzeW1wdG9tcyBhbmQgdGhlIGlsbG5lc3MgaXMgdXN1YWxseSBtaWxkPC9iPiwgd2l0aCBzeW1wdG9tcyBsaWtlIGZldmVyLCByYXNoIG9yIGpvaW50IHBhaW4gdGhhdCB3aWxsIGxhc3QgYSBmZXcgZGF5cy48YnI+PGJyPlJlY2VudGx5IGluIEJyYXppbCwgbG9jYWwgaGVhbHRoIGF1dGhvcml0aWVzIGhhdmUgb2JzZXJ2ZWQgYW4gaW5jcmVhc2UgaW4gR3VpbGxhaW4tQmFycsOpIHN5bmRyb21lLCB0aGF0IGNhdXNlcyBwYXJhbHlzaXMsIHdoaWNoIGNvaW5jaWRlZCB3aXRoIFppa2EgdmlydXMgaW5mZWN0aW9ucyBpbiB0aGUgZ2VuZXJhbCBwdWJsaWMuIEJhc2VkIG9uIGEgZ3Jvd2luZyBib2R5IG9mIHByZWxpbWluYXJ5IHJlc2VhcmNoLCB0aGVyZSBpcyBzY2llbnRpZmljIGNvbnNlbnN1cyB0aGF0IFppa2EgdmlydXMgaXMgYSBjYXVzZSBvZiBtaWNyb2NlcGhhbHkgYW5kIEd1aWxsYWluLUJhcnLDqSBzeW5kcm9tZS48L3A+XCI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uY2x1c2lvbnNUZXh0ICs9IFwiPHA+PGI+VGhlIFppa2EgdmlydXMgY2FuIGJlIHRyYW5zbWl0dGVkIGZyb20gaW5mZWN0ZWQgbW90aGVycyB0byB0aGVpciBmZXR1c2VzPC9iPiBhbmQgdGhpcyBjYW4gaGFwcGVuIGR1cmluZyBib3RoIHByZWduYW5jeSBvciBhdCBjaGlsZGJpcnRoLiBCYXNlZCBvbiBhIGdyb3dpbmcgYm9keSBvZiBwcmVsaW1pbmFyeSByZXNlYXJjaCwgPGI+dGhlcmUgaXMgc2NpZW50aWZpYyBjb25zZW5zdXMgdGhhdCBaaWthIHZpcnVzIGlzIGEgY2F1c2Ugb2YgbWljcm9jZXBoYWx5PC9iPiwgd2hpY2ggaXMgYSBjb25kaXRpb24gd2hlcmUgYSBiYWJ5IGlzIGJvcm4gd2l0aCBhIHNtYWxsIGhlYWQgb3IgdGhlIGhlYWQgc3RvcHMgZ3Jvd2luZyBhZnRlciBiaXJ0aC4gQmFiaWVzIHdpdGggbWljcm9jZXBoYWx5IGNhbiBkZXZlbG9wIGRldmVsb3BtZW50YWwgZGlzYWJpbGl0aWVzLiBFYXJseSBkaWFnbm9zaXMgb2YgbWljcm9jZXBoYWx5IGNhbiBzb21ldGltZXMgYmUgbWFkZSBieSBmZXRhbCB1bHRyYXNvdW5kLjxicj48YnI+PGI+UHJlZ25hbnQgd29tZW4gd2hvIGRldmVsb3Agc3ltcHRvbXMgb2YgWmlrYSB2aXJ1cyBpbmZlY3Rpb24sIHNob3VsZCBzZWUgdGhlaXIgaGVhbHRoLWNhcmUgcHJvdmlkZXIgZm9yIGNsb3NlIG1vbml0b3Jpbmcgb2YgdGhlaXIgcHJlZ25hbmN5LjwvYj4gSWYgeW914oCZcmUgdHJhdmVsbGluZyB0byBhIGNvdW50cnkgYWZmZWN0ZWQgYnkgWmlrYSwgdGhlIFdvcmxkIEhlYWx0aCBPcmdhbml6YXRpb24gaXMgYWR2aXNpbmcgcHJlZ25hbnQgd29tZW4gbm90IHRvIHRyYXZlbCB0byBhcmVhcyBvZiBvbmdvaW5nIFppa2EgdmlydXMgdHJhbnNtaXNzaW9uLjwvcD5cIjtcbiAgICB9XG4gIH1cblxuICBjb25jbHVzaW9uc1RleHQgKz0gXCI8YnI+PGJyPlwiO1xuXG4gICQoXCIucGdDb25jbHVzaW9ucy1kZXNjXCIpLmJlZm9yZShjb25jbHVzaW9uc1RleHQpO1xufVxuXG52YXIgY3JlYXRlVXNlcnNTdGF0cyA9IGZ1bmN0aW9uKG1hcmtlckxlZnQsIG1hcmtlclRvcCkge1xuICB2YXIgcmVzdWx0cyA9IFsxLCAyLCAxLCAyLCA1LCAzLCA2LCAxMCwgMSwgMSwgMSwgMSwgMTAsIDEyLCA1LCAxLCAxLCAxMCwgMTIsIDEsIDEsIDEsIDIsIDksIDFdO1xuXG4gIHZhciBtYXhSZXN1bHRzID0gLTE7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKG1heFJlc3VsdHMgPCByZXN1bHRzW2ldKSB7XG4gICAgICBtYXhSZXN1bHRzID0gcmVzdWx0c1tpXTtcbiAgICB9XG4gIH1cblxuICAkKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWlkXCIpLmh0bWwocGFyc2VJbnQobWF4UmVzdWx0cyAvIDIuMCkrXCIlXCIpO1xuICAkKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWF4XCIpLmh0bWwobWF4UmVzdWx0cytcIiVcIik7XG5cbiAgJChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzLW1pblwiKS5jc3MoXCJvcGFjaXR5XCIsIFwiMS4wXCIpO1xuICAkKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHMtbWlkXCIpLmNzcyhcIm9wYWNpdHlcIiwgXCIxLjBcIik7XG4gICQoXCIucGdTdGVwX191c2Vycy1zdGF0cy1tYXhcIikuY3NzKFwib3BhY2l0eVwiLCBcIjEuMFwiKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcbiAgICBhbmltYXRlVXNlcnNTdGF0cygkKCQoXCIucGdTdGVwX191c2Vycy1zdGF0c19fY29sXCIpW3BhcnNlSW50KGkvNSldKS5maW5kKFwiLnBnU3RlcF9fdXNlcnMtc3RhdHNfX2NvbF9fdmFsdWVcIilbaSU1XSwgKHJlc3VsdHNbaV0gLyBtYXhSZXN1bHRzKSAqIDEwMC4wLCBpKTtcbiAgfVxuXG4gICQoXCIucGdTdGVwX191c2Vycy1zdGF0cy1tYXJrZXJcIikuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xuXG4gIGlmIChtYXJrZXJMZWZ0IDw9IDAuMykge1xuICAgIGlmIChtYXJrZXJUb3AgPT0gMy4zOSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuMjM1XG4gICAgfVxuICAgIGVsc2UgaWYgKG1hcmtlclRvcCA9PSAzLjM0NzUpIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjI0MjVcbiAgICB9XG4gICAgZWxzZSBpZiAobWFya2VyVG9wID09IDMuMzA1KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC4yNTVcbiAgICB9XG4gICAgZWxzZSBpZiAobWFya2VyVG9wID09IDMuMjYyNSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuMjdcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC4yOFxuICAgIH1cbiAgfVxuICBlbHNlIGlmIChtYXJrZXJMZWZ0IDw9IDAuNCkge1xuICAgIGlmIChtYXJrZXJUb3AgPT0gMy4zOSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuMzVcbiAgICB9XG4gICAgZWxzZSBpZiAobWFya2VyVG9wID09IDMuMzQ3NSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuMzY1XG4gICAgfVxuICAgIGVsc2UgaWYgKG1hcmtlclRvcCA9PSAzLjMwNSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuMzc1XG4gICAgfVxuICAgIGVsc2UgaWYgKG1hcmtlclRvcCA9PSAzLjI2MjUpIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjM5XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNFxuICAgIH1cbiAgfVxuICBlbHNlIGlmIChtYXJrZXJMZWZ0ID4gMC40NyAmJiBtYXJrZXJMZWZ0IDwgMC41Mykge1xuICAgIGlmIChtYXJrZXJUb3AgPT0gMy4zOSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNDdcbiAgICB9XG4gICAgZWxzZSBpZiAobWFya2VyVG9wID09IDMuMzQ3NSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNDgyNVxuICAgIH1cbiAgICBlbHNlIGlmIChtYXJrZXJUb3AgPT0gMy4zMDUpIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjQ5NVxuICAgIH1cbiAgICBlbHNlIGlmIChtYXJrZXJUb3AgPT0gMy4yNjI1KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC41MDVcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC41MlxuICAgIH1cbiAgfVxuICBlbHNlIGlmIChtYXJrZXJMZWZ0IDw9IDAuNikge1xuICAgIGlmIChtYXJrZXJUb3AgPT0gMy4zOSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNTlcbiAgICB9XG4gICAgZWxzZSBpZiAobWFya2VyVG9wID09IDMuMzQ3NSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNlxuICAgIH1cbiAgICBlbHNlIGlmIChtYXJrZXJUb3AgPT0gMy4zMDUpIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjYxXG4gICAgfVxuICAgIGVsc2UgaWYgKG1hcmtlclRvcCA9PSAzLjI2MjUpIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjYyXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNjM1XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGlmIChtYXJrZXJUb3AgPT0gMy4zOSkge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNzA3NVxuICAgIH1cbiAgICBlbHNlIGlmIChtYXJrZXJUb3AgPT0gMy4zNDc1KSB7XG4gICAgICBtYXJrZXJMZWZ0ID0gMC43MlxuICAgIH1cbiAgICBlbHNlIGlmIChtYXJrZXJUb3AgPT0gMy4zMDUpIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjczXG4gICAgfVxuICAgIGVsc2UgaWYgKG1hcmtlclRvcCA9PSAzLjI2MjUpIHtcbiAgICAgIG1hcmtlckxlZnQgPSAwLjc0XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbWFya2VyTGVmdCA9IDAuNzU1XG4gICAgfVxuICB9XG5cbiAgJChcIi5wZ1N0ZXBfX3VzZXJzLXN0YXRzLW1hcmtlclwiKS5jc3MoXCJsZWZ0XCIsIChtYXJrZXJMZWZ0ICogMTAwKSArIFwiJVwiKTtcbn07XG5cbnZhciBhbmltYXRlVXNlcnNTdGF0cyA9IGZ1bmN0aW9uKGJhciwgdmFsdWUsIGkpIHtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBiYXIuc3R5bGUuaGVpZ2h0ID0gdmFsdWUgKyBcIiVcIjtcbiAgICBiYXIuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gXCJzY2FsZVkoXCIgKyAxICsgXCIpXCI7XG4gICAgYmFyLnN0eWxlLnRyYW5zZm9ybSA9IFwic2NhbGVZKFwiICsgMSArIFwiKVwiO1xuICB9LCAxNTAwICsgKGkgKiAxMDApKTtcbn1cblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gIC8vU2V0IHVwIG5lZWRlZCBmdW5jdGlvbnNcbiAgbWFuYWdlUXVlc3Rpb25zU2Nyb2xsKCk7XG4gIG1hbmFnZVN0ZXBzQWN0aW9uKCk7XG4gIHNlbGVjdE9wdGlvbigpO1xuICBzZWxlY3RCaW5hcnlPcHRpb24oKTtcbiAgc2VsZWN0UHJlZ25hbmN5T3B0aW9uKCk7XG4gIGFuaW1hdGVFbGVtZW50c1ByZWduYW5jeSgpO1xuICBhbmltYXRlQmVoYXZpb3JFbGVtZW50cygpO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIHNldHVwQ2FudmFzKCk7XG4gICAgc2V0dXBNb3NxdWl0b3MoKTtcbiAgfSwgNTAwKTtcbiAgc2V0dXBNYWluTG9vcCgpO1xuXG4gIC8qJChkb2N1bWVudCkub24oXCJjbGlja1wiLCBmdW5jdGlvbihlKSB7XG4gICAgY29uc29sZS5sb2coJ3t4OicrKChlLnBhZ2VYLyQoXCJjYW52YXNcIikud2lkdGgoKSkgLSAwLjExKSArICcsIHk6JyArICgoKGUucGFnZVkgLSA1NjEpLyQoXCJjYW52YXNcIikud2lkdGgoKSkpICsgJ30nKTtcbiAgfSk7Ki9cbn0pO1xuIiwid2luZG93LnR3dHRyID0gKGZ1bmN0aW9uIChkLCBzLCBpZCkge1xuICB2YXIgdCwganMsIGZqcyA9IGQuZ2V0RWxlbWVudHNCeVRhZ05hbWUocylbMF07XG4gIGlmIChkLmdldEVsZW1lbnRCeUlkKGlkKSkgcmV0dXJuO1xuICBqcyA9IGQuY3JlYXRlRWxlbWVudChzKTsganMuaWQgPSBpZDtcbiAganMuc3JjPSBcImh0dHBzOi8vcGxhdGZvcm0udHdpdHRlci5jb20vd2lkZ2V0cy5qc1wiO1xuICBmanMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoanMsIGZqcyk7XG4gIHJldHVybiB3aW5kb3cudHd0dHIgfHwgKHQgPSB7IF9lOiBbXSwgcmVhZHk6IGZ1bmN0aW9uIChmKSB7IHQuX2UucHVzaChmKSB9IH0pO1xufShkb2N1bWVudCwgXCJzY3JpcHRcIiwgXCJ0d2l0dGVyLXdqc1wiKSk7Il19
