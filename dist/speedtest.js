(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.SpeedTest = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var EventDispatcher = _interopRequire(require("./EventDispatcher"));

var HttpModule = _interopRequire(require("./Http/HttpModule"));

var LatencyModule = _interopRequire(require("./Http/LatencyModule"));

var BandwidthModule = _interopRequire(require("./Http/BandwidthModule"));

var Timing = _interopRequire(require("./Timing"));

var assign = require("../utils/helpers").assign;

var SpeedTest = (function () {
    function SpeedTest() {
        var options = arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, SpeedTest);

        // Initialize the modules
        this._modules = {};
        this._setModule("latency", new LatencyModule(options))._setModule("upload", new BandwidthModule("upload", options))._setModule("download", new BandwidthModule("download", options));
    }

    _createClass(SpeedTest, {
        isRequesting: {
            value: function isRequesting() {
                var modules = this._modules,
                    requesting = false;

                for (var i in modules) {
                    if (modules.hasOwnProperty(i)) {
                        requesting = requesting || modules[i].isRequesting();
                    }
                }

                return requesting;
            }
        },
        _setModule: {
            value: function _setModule(name, object) {
                var _this = this;

                if (object) {
                    this[name] = this._modules[name] = object.on("_newRequest", function () {
                        return !_this.isRequesting();
                    });
                }

                return this;
            }
        }
    }, {
        _exposeInternalClasses: {

            /**
             * Only for testing purposes! Exposes all the internal classes to the global scope.
             */

            value: function _exposeInternalClasses() {
                assign(window, { EventDispatcher: EventDispatcher, HttpModule: HttpModule, LatencyModule: LatencyModule, BandwidthModule: BandwidthModule, Timing: Timing });
            }
        }
    });

    return SpeedTest;
})();

module.exports = SpeedTest;

},{"../utils/helpers":7,"./EventDispatcher":2,"./Http/BandwidthModule":3,"./Http/HttpModule":4,"./Http/LatencyModule":5,"./Timing":6}],2:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var EventDispatcher = (function () {
    function EventDispatcher() {
        _classCallCheck(this, EventDispatcher);

        // Contains all the event callbacks, organized by event types.
        this._events = {};
    }

    _createClass(EventDispatcher, {
        on: {
            value: function on(eventTypes, callback) {
                var _this = this;

                eventTypes = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

                eventTypes.forEach(function (eventType) {
                    var events = _this._events[eventType] = _this._events[eventType] || [];

                    // If the callback isn't already registered, store it.
                    if (! ~events.indexOf(callback)) {
                        events.push(callback);
                    }
                });

                return this;
            }
        },
        off: {
            value: function off(eventTypes, callback) {
                var _this = this;

                eventTypes = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

                eventTypes.forEach(function (eventType) {
                    var events = _this._events[eventType];

                    // If there is no specified callback, simply delete all the callbacks binded to the provided event type.
                    if (callback == undefined && events) {
                        delete _this._events[eventType];
                    } else {
                        var eventIndex = events ? events.indexOf(callback) : -1;

                        // If the callback is registered, remove it from the array.
                        if (~eventIndex) {
                            events.splice(eventIndex, 1);
                        }
                    }
                });

                return this;
            }
        },
        trigger: {
            value: function trigger(eventType) {
                for (var _len = arguments.length, extraParameters = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    extraParameters[_key - 1] = arguments[_key];
                }

                var events = this._events[eventType] || [];

                // A callback can return a boolean value which will be logically compared to the other callbacks values before
                // being returned by the trigger() method. This allows a callback to send a "signal" to the caller, like
                // cancelling an action.
                var returnValue = true;

                events.forEach(function (callback) {
                    // A callback must explicitly return false if it wants the trigger() method to return false, undefined will
                    // not work. This avoids crappy callbacks to mess up with the triggering system.
                    var value = callback.apply(undefined, extraParameters);
                    value = value !== false ? true : false;

                    returnValue = returnValue && value; // Compare the result of the callback to the actual return value
                });

                return returnValue;
            }
        }
    });

    return EventDispatcher;
})();

module.exports = EventDispatcher;

},{}],3:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var HttpModule = _interopRequire(require("./HttpModule"));

var Timing = _interopRequire(require("../Timing"));

var _utilsHelpers = require("../../utils/helpers");

var assign = _utilsHelpers.assign;
var defer = _utilsHelpers.defer;

var BandwidthModule = (function (_HttpModule) {
    function BandwidthModule(loadingType) {
        var _this = this;

        var options = arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, BandwidthModule);

        // Instanciate the parent
        loadingType = ~["upload", "download"].indexOf(loadingType) ? loadingType : "download";

        options = assign({
            dataSize: {
                upload: 2 * 1024 * 1024, // 2 MB
                download: 10 * 1024 * 1024, // 10 MB
                multiplier: 2
            }
        }, options);

        _get(Object.getPrototypeOf(BandwidthModule.prototype), "constructor", this).call(this, loadingType, options);

        // Define the object properties
        this._loadingType = loadingType;

        this._intendedEnd = false;
        this._isRestarting = false;

        this._lastLoadedValue = null;
        this._speedRecords = [];
        this._avgSpeed = null;

        this._requestID = 0;
        this._progressID = 0;

        this._started = false;
        this._firstProgress = true;
        this._deferredProgress;

        // Unique labels for each request, exclusively used to make measures.
        this._timingLabels = {
            start: null,
            progress: null,
            end: null,
            measure: null
        };

        // Bind to XHR events
        this.on("xhr-upload-loadstart", function () {
            return Timing.mark(_this._timingLabels.start);
        });
        this.on("xhr-readystatechange", function (xhr) {
            if (!_this._started && xhr.readyState == XMLHttpRequest.LOADING) {
                Timing.mark(_this._timingLabels.start);
                _this._started = true;
            }
        });

        var eventsPrefix = loadingType == "upload" ? "xhr-upload" : "xhr";

        this.on("" + eventsPrefix + "-progress", function (xhr, event) {
            return _this._progress(event);
        });
        this.on("" + eventsPrefix + "-timeout", function () {
            return _this._timeout();
        });
        this.on("" + eventsPrefix + "-loadend", function () {
            return _this._end();
        });
    }

    _inherits(BandwidthModule, _HttpModule);

    _createClass(BandwidthModule, {
        start: {
            value: function start() {
                var loadingType = this._loadingType,
                    dataSize = this._options.dataSize,
                    reqID = this._requestID++;

                this._intendedEnd = false;
                this._lastLoadedValue = null;
                this._speedRecords = [];
                this._started = false;
                this._firstProgress = true;
                this._deferredProgress = defer();

                // Trigger the start event
                if (!this._isRestarting) {
                    this.trigger("start", loadingType == "upload" ? dataSize.upload : dataSize.download);
                }

                // Create unique timing labels for the new request
                var labels = this._timingLabels;
                labels.start = "" + loadingType + "-" + reqID + "-start";
                labels.progress = "" + loadingType + "-" + reqID + "-progress";
                labels.end = "" + loadingType + "-" + reqID + "-end";
                labels.measure = "" + loadingType + "-" + reqID + "-measure";

                // Generate some random data to upload to the server. Here we're using a Blob instead of an ArrayBuffer because
                // of a bug in Chrome (tested in v33.0.1750.146), causing a freeze of the page while trying to directly upload
                // an ArrayBuffer (through an ArrayBufferView). The freeze lasts nearly 4.5s for 10MB of data. Using a Blob
                // seems to solve the problem.
                var blob = loadingType == "upload" ? new Blob([new ArrayBuffer(dataSize.upload)]) : null;

                var type = loadingType == "download" ? "GET" : "POST";

                // Initiate and send a new request
                this._newRequest(type, {
                    size: dataSize.download
                })._sendRequest(blob);
            }
        },
        abort: {
            value: function abort() {
                this._intendedEnd = true;
                return this._abort();
            }
        },
        _progress: {
            value: function _progress(event) {
                var _this = this;

                // Ignore the first progress event, it generally contributes to get incoherent values.
                if (this._firstProgress) {
                    return this._firstProgress = false;
                } // Execute the previous progress trigger
                this._deferredProgress.run();

                var labels = this._timingLabels,
                    progressID = this._progressID++,
                    markLabel = "" + labels.progress + "-" + progressID,
                    loaded = event.loaded;

                Timing.mark(markLabel);

                // Measure the average speed (B/s) since the request started
                var avgMeasure = Timing.measure("" + labels.measure + "-avg-" + progressID, labels.start, markLabel),
                    avgSpeed = loaded / avgMeasure * 1000;

                var instantSpeed;

                if (!this._lastLoadedValue) {
                    // We are executing the first progress event of the current request
                    instantSpeed = avgSpeed; // The instant speed of the first progress event is equal to the average one
                } else {
                    // Measure the instant speed (B/s), which defines the speed between two progress events.
                    var instantMeasure = Timing.measure("" + labels.measure + "-instant-" + progressID,
                    // Set the mark of the previous progress event as the starting point
                    "" + labels.progress + "-" + (progressID - 1), markLabel);
                    instantSpeed = (loaded - this._lastLoadedValue) / instantMeasure * 1000;
                }

                // Save the `loaded` property of the event for the next progress event
                this._lastLoadedValue = loaded;

                // Defer measures saving and event triggering, this allows to cancel the last progress event, which can generate
                // incoherent values.
                this._deferredProgress = defer(function () {
                    _this._avgSpeed = avgSpeed;
                    _this._speedRecords.push(instantSpeed);

                    _this.trigger("progress", avgSpeed, instantSpeed);
                });
            }
        },
        _timeout: {
            value: function _timeout() {
                this._intendedEnd = true;
            }
        },
        _end: {
            value: function _end() {
                // A timeout or an abort occured, bypass the further requests and trigger the "end" event.
                if (this._intendedEnd) {
                    this._isRestarting = false;
                    this.trigger("end", this._avgSpeed, this._speedRecords);
                }

                // The request ended to early, restart it with an increased data size.
                else {
                    var loadingType = this._loadingType,
                        dataSize = this._options.dataSize;

                    dataSize.upload *= dataSize.multiplier;
                    dataSize.download *= dataSize.multiplier;

                    this.trigger("restart", loadingType == "upload" ? dataSize.upload : dataSize.download);

                    this._isRestarting = true;
                    this.start();
                }
            }
        }
    });

    return BandwidthModule;
})(HttpModule);

module.exports = BandwidthModule;

},{"../../utils/helpers":7,"../Timing":6,"./HttpModule":4}],4:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slice = Array.prototype.slice;

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var EventDispatcher = _interopRequire(require("../EventDispatcher"));

var assign = require("../../utils/helpers").assign;

var HttpModule = (function (_EventDispatcher) {
    function HttpModule(moduleName) {
        var _this = this;

        var options = arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, HttpModule);

        _get(Object.getPrototypeOf(HttpModule.prototype), "constructor", this).call(this);

        options = assign({
            endpoint: "./speedtest.php",
            delay: 8000
        }, options);

        // Define the object properties
        this._options = options;
        this._moduleName = moduleName;
        this._xhr = null;
        this._lastURLToken = null;

        this._requestingOverridden = false;
        this._requesting = false;

        // Each time a request starts or ends, set the requesting value unless it has been overridden with the
        // _setRequesting() method.
        this.on(["xhr-loadstart", "xhr-upload-loadstart"], function () {
            if (!_this._requestingOverridden) {
                _this._requesting = true;
            }
        });

        this.on(["xhr-loadend", "xhr-upload-loadend"], function () {
            if (!_this._requestingOverridden) {
                _this._requesting = false;
            }
        });
    }

    _inherits(HttpModule, _EventDispatcher);

    _createClass(HttpModule, {
        isRequesting: {
            value: function isRequesting() {
                return this._requesting;
            }
        },
        _newRequest: {
            value: function _newRequest(httpMethod, queryParams) {
                // Check if a callback binded to the "_newRequest" event returns false, if it's the case, cancel the request
                // creation. If the requesting status has been overridden, there's no need to cancel the request since the user
                // should know what he's doing.
                if (!this.trigger("_newRequest") && !this._requestingOverridden) {
                    console.warn("To ensure accurate measures, you can only make one request at a time.");
                    return this;
                }

                var options = this._options,
                    xhr = new XMLHttpRequest(),
                    validHttpMethods = ["GET", "POST"];

                // Prepare the new request.
                if (! ~validHttpMethods.indexOf(httpMethod)) {
                    console.warn("The HTTP method must be GET or POST.");
                    return this;
                }

                queryParams = queryParams || {};

                // Generate an URL token to avoid any caching issues. This token will also allow to identify the request in the
                // Resource Timing entries.
                var tokenSuffix = new Date().getTime();
                this._lastURLToken = "speedtest-" + tokenSuffix;

                // Append the query parameters
                var url = options.endpoint;
                url += ~url.indexOf("?") ? "&" : "?";
                url += "module=" + this._moduleName;

                Object.keys(queryParams).forEach(function (param) {
                    var value = encodeURIComponent(queryParams[param]);
                    url += "&" + param + "=" + value;
                });

                url += "&" + this._lastURLToken;

                xhr.open(httpMethod, url);

                // Define the timeout of the request
                xhr.timeout = options.delay;

                // Abort the previous request if it hasn't been sent
                if (this._xhr && this._xhr.readyState == XMLHttpRequest.OPENED) {
                    this._xhr.abort();
                }

                // Replace the old request by the new one
                this._xhr = xhr;

                // Bind all the XHR events
                var self = this,
                    eventTypes = ["loadstart", "progress", "abort", "error", "load", "timeout", "loadend", "readystatechange"];

                eventTypes.forEach(function (eventType) {
                    xhr.addEventListener(eventType, function () {
                        // A last progress event can be triggered once a request has timed out, ignore it.
                        if (eventType == "progress" && !self._requesting) {
                            return;
                        }

                        self.trigger.apply(self, ["xhr-" + eventType, xhr].concat(_slice.call(arguments)));
                    });

                    // The XMLHttpRequestUpload interface supports all the above event types except the "readystatechange" one
                    if (eventType != "readystatechange") {
                        xhr.upload.addEventListener(eventType, function () {
                            self.trigger.apply(self, ["xhr-upload-" + eventType, xhr].concat(_slice.call(arguments)));
                        });
                    }
                });

                return this;
            }
        },
        _sendRequest: {
            value: function _sendRequest(data) {
                if (this._xhr && this._xhr.readyState == XMLHttpRequest.OPENED) {
                    this._xhr.send(typeof data != "undefined" ? data : null);
                } else {
                    console.warn("A request must have been created before it can be sent.");
                }

                return this;
            }
        },
        _abort: {
            value: function _abort() {
                if (this._xhr) {
                    this._xhr.abort();
                }

                return this;
            }
        },
        _getTimingEntry: {
            value: function _getTimingEntry(callback) {
                // The Resource Timing entries aren't immediately available once the 'load' event is triggered by an
                // XMLHttpRequest, we must wait for another process tick to check for a refreshed list.
                setTimeout((function (lastURLToken) {
                    return function () {
                        // Filter the timing entries to return only the one concerned by the last request made
                        var entries = performance.getEntriesByType("resource").filter(function (entry) {
                            return ~entry.name.indexOf(lastURLToken);
                        });

                        // Return the entry through the callback
                        typeof callback == "function" && callback(entries.length ? entries[0] : null);
                    };
                })(this._lastURLToken), 0);

                return this;
            }
        },
        _setRequesting: {
            value: function _setRequesting(value) {
                this._requestingOverridden = true;
                this._requesting = value;
            }
        }
    });

    return HttpModule;
})(EventDispatcher);

module.exports = HttpModule;

},{"../../utils/helpers":7,"../EventDispatcher":2}],5:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var HttpModule = _interopRequire(require("./HttpModule"));

var Timing = _interopRequire(require("../Timing"));

var assign = require("../../utils/helpers").assign;

var LatencyModule = (function (_HttpModule) {
    function LatencyModule() {
        var _this = this;

        var options = arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, LatencyModule);

        options = assign({
            latency: {
                measures: 5,
                attempts: 3
            }
        }, options, {
            delay: 0 // We dont want any timeout during a latency calculation
        });

        _get(Object.getPrototypeOf(LatencyModule.prototype), "constructor", this).call(this, "latency", options);

        // Define the object properties
        this._requestsLeft = 0;
        this._attemptsLeft = 0;

        this._latencies = [];
        this._requestID = 0;

        // Unique labels for each request, exclusively used to make measures.
        this._timingLabels = {
            start: null,
            end: null,
            measure: null
        };

        // Measure the latency with the Resource Timing API once the request is finished
        if (Timing.supportsResourceTiming()) {
            this.on("xhr-load", function () {
                return _this._measure();
            });
        }

        // If the browser doesn't support the Resource Timing API, we fallback on a Datetime solution.
        else {
            // Set a mark when the request starts
            this.on("xhr-loadstart", function () {
                return Timing.mark(_this._timingLabels.start);
            });

            // Then make a measure with the previous mark
            this.on("xhr-readystatechange", function (xhr) {
                return _this._measure(xhr);
            });
        }
    }

    _inherits(LatencyModule, _HttpModule);

    _createClass(LatencyModule, {
        start: {
            value: function start() {
                // Set the number of requests required to establish the network latency. If the browser doesn't support the
                // Resource Timing API, add a request that will be ignored to avoid a longer request due to a possible
                // DNS/whatever fetch.
                var _options$latency = this._options.latency;
                var measures = _options$latency.measures;
                var attempts = _options$latency.attempts;

                this._requestsLeft = measures;
                this._attemptsLeft = attempts * measures;

                if (!Timing.supportsResourceTiming()) {
                    this._requestsLeft++;
                    this._attemptsLeft++;
                }

                // Override the requesting value since a complete latency request consists off multiple ones
                this._setRequesting(true);

                this._latencies = [];
                this._nextRequest();

                return this;
            }
        },
        _nextRequest: {
            value: function _nextRequest() {
                var _this = this;

                var retry = arguments[0] === undefined ? false : arguments[0];

                var reqID = this._requestID++;
                var requestsLeft = retry ? this._requestsLeft : this._requestsLeft--;

                if (this._attemptsLeft-- && (requestsLeft || retry)) {
                    // Create unique timing labels for the new request
                    var labels = this._timingLabels;
                    labels.start = "latency-" + reqID + "-start";
                    labels.end = "latency-" + reqID + "-end";
                    labels.measure = "latency-" + reqID + "-measure";

                    // Create the new request and send it
                    this._newRequest("GET")._sendRequest();
                } else {
                    // All the requests are finished, set the requesting status to false.
                    this._setRequesting(false);

                    // If all the requests have been executed, calculate the average latency. Since the _getTimingEntry() method
                    // is asynchronous, wait for the next process tick to execute the _end() method, to be sure that all the
                    // latencies have been retrieved.
                    setTimeout(function () {
                        return _this._end();
                    }, 0);
                }
            }
        },
        _measure: {
            value: function _measure() {
                var _this = this;

                var xhr = arguments[0] === undefined ? null : arguments[0];

                // With Resource Timing API
                if (!xhr) {
                    this._getTimingEntry(function (entry) {
                        // The latency calculation differs between an HTTP and an HTTPS connection
                        // See: http://www.w3.org/TR/resource-timing/#processing-model
                        var latency = !entry.secureConnectionStart ? entry.connectEnd - entry.connectStart : entry.secureConnectionStart - entry.connectStart;

                        if (latency) _this._latencies.push(latency);
                        _this._nextRequest(!latency);
                    });
                }

                // Without Resource Timing API
                else if (this._requestsLeft < this._options.latency.measures) {

                    // Measure and save the latency if the headers have been received
                    if (xhr.readyState == XMLHttpRequest.HEADERS_RECEIVED) {
                        var labels = this._timingLabels;

                        Timing.mark(labels.end);
                        var latency = Timing.measure(labels.measure, labels.start, labels.end);

                        if (latency) this._latencies.push(latency);

                        // Abort the current request before we run a new one
                        this._abort();
                        this._nextRequest(!latency);
                    }
                }

                // Ignore the first request when using the XHR states. See the comments in the start() method for explanations.
                else {
                    this._nextRequest();
                }
            }
        },
        _end: {
            value: function _end() {
                var latencies = this._latencies;

                // Get the average latency
                var avgLatency = latencies.reduce(function (a, b) {
                    return a + b;
                }, 0) / (latencies.length || 1);
                avgLatency = avgLatency || null;

                // If there is not enough measures, display a warning.
                if (latencies.length < this._options.latency.measures) {
                    var _options$latency = this._options.latency;
                    var measures = _options$latency.measures;
                    var attempts = _options$latency.attempts;

                    console.warn(["An insufficient number of measures have been processed, this could be due to your web server using", "persistant connections or to your client options (measures: " + measures + ", attempts: " + attempts + ")"].join(" "));
                }

                // Trigger the "end" event with the average latency and the latency list as parameters
                this.trigger("end", avgLatency, latencies);
            }
        }
    });

    return LatencyModule;
})(HttpModule);

module.exports = LatencyModule;

},{"../../utils/helpers":7,"../Timing":6,"./HttpModule":4}],6:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Timing = (function () {
    function Timing() {
        _classCallCheck(this, Timing);

        this._marks = {};
        this._measures = {};

        // Does the browser support the following APIs?
        this._support = {
            performance: !!window.performance,
            userTiming: window.performance && performance.mark,
            resourceTiming: window.performance && typeof performance.getEntriesByType == "function" && performance.timing
        };
    }

    _createClass(Timing, {
        mark: {
            value: function mark(label) {
                var support = this._support,
                    marks = this._marks;

                if (support.userTiming) {
                    performance.mark(label);
                } else if (support.performance) {
                    marks[label] = performance.now();
                } else {
                    marks[label] = new Date().getTime();
                }

                return this;
            }
        },
        measure: {
            value: function measure(measureLabel, markLabelA, markLabelB) {
                var support = this._support,
                    marks = this._marks,
                    measures = this._measures;

                if (typeof measures[measureLabel] == "undefined") {
                    if (support.userTiming) {
                        performance.measure(measureLabel, markLabelA, markLabelB);
                        measures[measureLabel] = performance.getEntriesByName(measureLabel)[0].duration;
                    } else {
                        measures[measureLabel] = marks[markLabelB] - marks[markLabelA];
                    }
                }

                return measures[measureLabel];
            }
        },
        supportsResourceTiming: {
            value: function supportsResourceTiming() {
                return this._support.resourceTiming;
            }
        }
    });

    return Timing;
})();

module.exports = new Timing();

},{}],7:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports.isObject = isObject;
exports.assign = assign;
exports.defer = defer;
Object.defineProperty(exports, "__esModule", {
    value: true
});

function isObject(obj) {
    return obj != undefined && obj != null && typeof obj.valueOf() == "object";
}

function assign() {
    for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        sources[_key - 1] = arguments[_key];
    }

    var target = arguments[0] === undefined ? {} : arguments[0];

    sources.forEach(function (source) {
        Object.keys(source).forEach(function (key) {
            var value = source[key];
            target[key] = isObject(value) ? assign(target[key], value) : value;
        });
    });

    return target;
}

function defer() {
    var cb = arguments[0] === undefined ? function () {} : arguments[0];

    return new ((function () {
        var _class = function () {
            _classCallCheck(this, _class);

            this.cb = cb;
        };

        _createClass(_class, {
            run: {
                value: function run() {
                    if (this.cb) this.cb();
                    delete this.cb;
                }
            }
        });

        return _class;
    })())();
}

},{}]},{},[1])(1)
});


//# sourceMappingURL=speedtest.js.map