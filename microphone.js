(function(ns) {

if (!swfobject.hasFlashPlayerVersion("10.0.0")) {
    if (typeof console != "undefined") {
        console.error("Flash Player >= 10.0.0 is required");
    }
}

function Microphone() { }

function defaultLoader(flash, embedCallback) {
    var container = document.createElement("div");
    container.style.position = "absolute";
    container.appendChild(flash);
    document.body.appendChild(container);
    embedCallback();
};

var classMethods = {
    enable: function() {
        Microphone.flash.__enable();
    },
    disable: function() {
        Microphone.flash.__disable()
    },
    ondata: function(handler) {
        Microphone.dataHandlers.push(handler);
    },
    onready: function(handler) {
        if (Microphone.flash) {
            handler();
            return;
        }
        Microphone.readyHandlers.push(handler);
    },
    initialize: function(options) {
        if (Microphone.flash) return;
        if (!document.body) {
            swfobject.addDomLoadEvent(function() {
                Microphone.initialize(options);
            });
            return;
        }
        options = options || {};
        options["swfLocation"] = options["swfLocation"] || "MicrophoneMain.swf";
        options["domId"] = options["domId"] || "__microphoneFlash__";
        options["loader"] = options["loader"] || defaultLoader;

        var flash = document.createElement("div");
        flash.id = options["domId"];

        options["loader"](flash, function() {
            Microphone.flash = flash;
            swfobject.embedSWF(
                options["swfLocation"],
                options["domId"],
                "215",
                "138",
                "10.0.0",
                null,
                { namespace: typeof NS_MICROPHONE != "undefined"
                    ? NS_MICROPHONE + ".Microphone"
                    : "Microphone" },
                { hasPriority: true, allowScriptAccess: "always" },
                null,
                function(e) {
                    Microphone.log("Embed " +
                        (e.success ? "succeeded" : "failed"));
                }
            );
        });
    },
    log: function(msg, obj, method) {
        if (!Microphone.debug || !window.console) {
            return;
        }
        method = method || "log";
        console[method]("[Microphone] " + msg);
        if (typeof obj != "undefined") {
            console[method](obj);
        }
    }
};

var flashEventHandlers = {
    __onFlashInitialized: function() {
        Microphone.initialized = true;
        Microphone.flash = document.getElementById(Microphone.flash.id);
        setTimeout(function() {
            Microphone.log("Initialized and ready");
            Microphone.flash.__setDebug(Microphone.debug);
            Microphone.flash.__initialize();
            for (var i = 0; i < Microphone.readyHandlers.length; i++) {
                readyHandlers[i]();
            }
        }, 0);
    },
    __onLog: function(msg) {
        Microphone.log(msg);
    },
    __onQueuedSamples: function(framesLength) {
        setTimeout(function() {
            var data = Microphone.flash.__receiveFrames();
            for (var i = 0; i < Microphone.dataHandlers.length; i++) {
                var handler = Microphone.dataHandlers[i];
                handler(data);
            }
        }, 0);
    }
};

for (var name in classMethods) {
    Microphone[name] = classMethods[name];
}

for (var name in flashEventHandlers) {
    Microphone[name] = flashEventHandlers[name];
}

Microphone.debug = false;
Microphone.readyHandlers = [];
Microphone.dataHandlers = [];

ns.Microphone = Microphone;

})(typeof NS_MICROPHONE != "undefined" ? this[NS_MICROPHONE] : this);
