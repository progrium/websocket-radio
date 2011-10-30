var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');

var listeners = [];

// 1. Echo sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.1.min.js"};

var sockjs_listen = sockjs.createServer(sockjs_opts);

sockjs_listen.on('connection', function(conn) {
    console.log("Connected listener");
    listeners.push(conn);
});

sockjs_listen.on('close', function(conn) {
    if ((index = listeners.indexOf(conn)) > -1) {
        listeners.splice(index, 1);
    }
});

var sockjs_broadcast = sockjs.createServer(sockjs_opts);
sockjs_broadcast.on('connection', function(conn) {
    console.log("Connected broadcaster");
    conn.on('data', function(message) {
        console.log("Broadcasting " + message.length + " bytes");
        for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            listener.write(message);
        }
    });
});

// 2. Static files server
var static_directory = new node_static.Server(__dirname);

// 3. Usual http stuff
var server = http.createServer();
server.addListener('request', function(req, res) { static_directory.serve(req, res); });
server.addListener('upgrade', function(req,res){ res.end(); });

sockjs_broadcast.installHandlers(server, {prefix:'[/]broadcast'});
sockjs_listen.installHandlers(server, {prefix:'[/]music'});

console.log(' [*] Listening on 0.0.0.0:9999' );
server.listen(9999, '0.0.0.0');
