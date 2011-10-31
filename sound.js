(function(ns) {

if (!swfobject.hasFlashPlayerVersion("10.0.0")) {
    if (typeof console != "undefined") {
        console.error("Flash Player >= 10.0.0 is required");
    }
}

function Sound(url) {
    this.id = Sound.nextId++;
    Sound.items[this.id] = this;
    this.create();
}

Sound.prototype = {
    create: function() {
        var id = this.id;
        Sound.queue(function() {
            Sound.flash.__create(id);
        });
    },
    buffer: function(bytes) {
        var id = this.id;
        Sound.queue(function() {
            Sound.flash.__buffer(id, bytes);
        });
    },
    play: function(startTime, loops) {
        startTime = startTime || 0;
        loops = loops || 0;
        var id = this.id;
        Sound.queue(function() {
            Sound.flash.__play(id, startTime, loops);
        });
    },
    load: function(url) {
        var id = this.id;
        Sound.queue(function() {
            Sound.flash.__load(id, url);
        });
    },
    stop: function() {
        var id = this.id;
        Sound.queue(function() {
            Sound.flash.__stop(id);
        });
    },
    destroy: function() {
        var id = this.id;
        Sound.queue(function() {
            Sound.flash.__destroy(id);
            delete Sound.items[id];
        });
    }
}

var classMethods = {
    initialize: function (options) {
        options = options || {};
        options["swfLocation"] = options["swfLocation"] || "SoundMain.swf";
        options["domId"] = options["domId"] || "__soundFlash__";

        if (Sound.flash) return;
        if (!document.body) {
            try {
                window.addEventListener("load", function() {
                    Sound.initialize(options);    
                }, false);
            } catch(e) {
                window.attachEvent("onload", function() {
                    Sound.initialize(options);
                });
            }
            return;
        }

        var flash = document.createElement("div");
        flash.id = options["domId"];
        document.body.appendChild(flash);
        Sound.flash = flash;
        swfobject.embedSWF(
            options["swfLocation"],
            options["domId"],
            "1",
            "1",
            "10.0.0",
            null,
            { namespace: typeof NS_SOUND != "undefined" ? NS_SOUND + ".Sound"
                                                        : "Sound" },
            { hasPriority: true, allowScriptAccess: "always" },
            null,
            function(e) {
                Sound.log("Embed " +
                    (e.success ? "succeeded" : "failed"));
            }
        );
    },
    log: function(msg, obj, method) {
        if (!Sound.debug || !window.console) {
            return;
        }
        method = method || "log";
        console[method]("[Sound] " + msg);
        if (typeof obj != "undefined") {
            console[method](obj);
        }
    },
    queue: function(task) {
        if (Sound.initialized) {
            task();
        } else {
            Sound.tasks.push(task);
        }
    }
};

var flashEventHandlers = {
    __onFlashInitialized: function() {
        Sound.initialized = true;
        Sound.flash = document.getElementById(Sound.flash.id);
        setTimeout(function() {
            Sound.flash.__setDebug(Sound.debug);
            Sound.log("Initialized and ready");
            for (var i = 0; i < Sound.tasks.length; i++) {
                Sound.tasks[i]();
            }
        }, 0);
    },
    __onLog: function(msg) {
        Sound.log(msg);
    }
};

for (var name in classMethods) {
    Sound[name] = classMethods[name];
}

for (var name in flashEventHandlers) {
    Sound[name] = flashEventHandlers[name];
}

Sound.nextId = 0;
Sound.debug = false;
Sound.tasks = [];
Sound.items = {};

ns.Sound = Sound;

})(typeof NS_SOUND != "undefined" ? this[NS_SOUND] : this);
