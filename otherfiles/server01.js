
// RMB: I re-wrote the author's demo.php script for node.js

const WebSocketServer = require('ws').Server;

const wss = new WebSocketServer({ port: 5995 });

wss.on('listening', function () {
    console.log("listening on port 5995");
    //console.log("curr clients: ",wss.clients);
});

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

// Usage!

wss.on('connection', function (ws, request, client) {
    ws.on('message', function (charMsg) {
        
        if (charMsg == "hello") {
            ws.send("hello human");
        }
        else if (charMsg == "name") {
            ws.send("I don't have a name");
        }
        else if (charMsg == "age") {
            ws.send("I'm old");
        }
        else if (charMsg == "date") {
            ws.send("today is " + new Date());
        }
        else if (charMsg == "time") {
                sleep(11000).then(() => {
                    // Do something after the sleep!
                    ws.send("the time is " + new Date());

                });
        }
        else if (charMsg == "thanks") {
            ws.send("you're welcome");
        }
        else if (charMsg == "bye") {
            ws.send("have a nice day");
        }
        else {
            ws.send("I don't understand");
        }
    });
});
