#!/usr/bin/node

const JSONdb = require("simple-json-db");
const db = new JSONdb("/root/cloudComputing/database.json");
//const db = new JSONdb("/root/cloudComputing/temp.json");

const WebSocketServer = require("ws").Server;
const WebSocket = require("ws").WebSocket;
var fs = require("fs");
var userFile = "accounts2.txt";

const users = new Map();
const clients = new Map();
var authClients = [];
// Socket to talk to other sever
const wsNode = new WebSocketServer({
  port: 8001
});
// socket for client
const wss = new WebSocketServer({
  port: 5995
});

var array = fs.readFileSync(userFile).toString().split("\n");
var leng = array.length;
console.log(leng);
for (let i = 0; i < leng - 1; i++) {
  if (i % 2 == 1) {
    db.set(array[i - 1], []);
    users.set(array[i - 1], array[i]);
  }
}
db.sync();
///////////////////// Inter server communication //////////////////////////////

// Listen for connection from server 1
wsNode.on("listening", function () {
  console.log("listening on port 8001");
});

//
////////// Handle incoming messages ///////////////
wsNode.on("connection", (node) => {
  console.log("connection to port 8001");
  /// INDIVIDUAL CONNECTIONS //
  node.on("message", function (charMsg) {
    var charString = String(charMsg);
    charString = charString.toLowerCase();
    console.log("message from server 1" + charString);
    var obj = JSON.parse(charMsg)
    for (const key in obj) {
      if (db.has(key)) {
        var ar = obj[key]
        console.log(ar.length)
        console.log(`key ${key} and val ${obj[key]}`)
      }
    }

  });
});

//////////////// NO CODE NEEDED HERE
// Server 1 is on port 8000
const serverNode = new WebSocket("ws://139.177.205.73:8000");
serverNode.on("open", function open() {
  //	serverNode.send('something');
});
serverNode.on("message", function message(data) {
  console.log("received: %s", data);
});

////////////////////END INTER SERVER COMMUNICATION //////////////////////////////////////////////

// Listen for connections from clients //
wss.on("listening", function () {
  console.log("listening on port 5995");
  //console.log("curr clients: ",wss.clients);
});

// CLIENT WEBSERVER
wss.on("connection", (ws) => {
  const id = uuidv4();
  const loggedIn = false;
  var user = "";
  var password = "";
  const metadata = {
    id,
    loggedIn,
    user,
    password
  };
  var waitingForPass = false;
  var tries = 3;
  clients.set(ws, metadata);
  var writing = false

  /// INDIVIDUAL CONNECTIONS //
  ws.on("message", function (charMsg) {
    const metadata = clients.get(ws);
    console.log(metadata);
    var charString = String(charMsg);
    charString = charString.toLowerCase();
    var newUser = charString.substring(0, 1);
    var addUser = false;
    /// detect add user option. 
    if (newUser == ",") {
      addUser = true;
    }
    console.log("add " + addUser);
    console.log("char string " + charString);
    /// LOGIN THRESHHOLD - USE IF NO CURRENT USER LOGGED IN //
    if (metadata.loggedIn == false) {
      //// ADD NEW USER if no user logged in////
      if (addUser == true) {
        addUser = false;
        funcaddUser(metadata, charString, ws);
      }
      /// USER IN SYSTEM, ADD PASSWORD
      else if (users.has(charString) && waitingForPass == false) {
        ws.send("send Password");
        metadata.user = charString;
        var userid = users.get(charString);
        metadata.password = userid;
        waitingForPass = true;
      } else if (waitingForPass == true) {
        if (charString == metadata.password) {
          metadata.loggedIn = true;
          authClients.push(metadata.id);
          ws.send("logged");
          waitingForPass = false;
        } else {
          if (tries > 0) {
            ws.send(`${tries} tries to login are left...`);
            tries -= 1;
          } else {
            ws.send("Closing");
            ws.close();
          }
        }
      } else {
        ws.send("LOGIN");
      }
      /////////////////////////////////////////////////////////////////////
      /////////////////////// NOW LOGGED IN ///////////////////////////////
      ///////////////////////////////////////////////////////////////////////
    } else {
      if (addUser == true) {
        addUser = false;
        funcaddUser(metadata, charString, ws);
        console.log("Adding new user")
      }
      var key = metadata.user
      if (writing == true) {
        var key = metadata.user
        if (db.has(key)) {
          //ws.send(JSON.stringify(db.JSON()));
          var value = db.get(key)
          value.push(charString)
          db.set(key,value)
          ws.send(`writing data to user: ${key}`)
        }

        
        writing = false

      } else if (charString == "read") {
        ws.send(`Data for user: ${key}`)
        if (db.has(key)) {
          var value = db.get(key)
          ws.send(`${value}`)
        } else {
          ws.send("No Data Set yet")

        }

      } else if (charString == "write") {
        ws.send("Send data to write to file:");
        writing = true
      } else if (charString == "delete") {
        if (db.has(key)) {
          db.set(key, [])
          ws.send(`Data deleted for ${key}`)
        } else {
          ws.send("User to delete not Present")
        }

      } else if (charString == "exit") {
        // IF client exits we need to call a sync function.
        serverNode.send(JSON.stringify(db.JSON()))
        ws.send("Closing");
        ws.close();
      } else {
        ws.send("3. DELETE");
        ws.send("2. WRITE");
        ws.send("1. READ");
        ws.send("Menu:\n");
        ws.send(`Your User ID is -->${metadata.id}\n`);
      }
    }
  });
});

function funcaddUser(metadata, charString, ws) {
  var myArray;
  var p, u;
  var subcharString = charString.substring(1);
  console.log(subcharString);
  myArray = subcharString.split(",");
  // new user
  u = myArray[0];
  // new password
  p = myArray[1];
  console.log(`u: ${u} p ${p}`);
  metadata.user = u;
  metadata.password = p;
  metadata.loggedIn = false;
  metadata.id = uuidv4();
  // add user to database
  db.set(u,[]);
  if (users.has(u)) {
    ws.send(`User: ${u} already added`);
  } else {
    users.set(u, p);
    ws.send(`Added User: ${u}`);
  }
}

function uuidv4() {
  return "yxxx-xxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
