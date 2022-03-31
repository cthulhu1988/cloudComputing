#!/usr/bin/node

const JSONdb = require("simple-json-db");
const db = new JSONdb("/root/cloudComputing/database.json");

const WebSocketServer = require("ws").Server;
const WebSocket = require("ws").WebSocket;
var fs = require("fs");
var userFile = "accounts1.txt";

var serverNode;
const clients = new Map();
const users = new Map();
var authClients = [];

const wsNode = new WebSocketServer({
  port: 8000
});
const wss = new WebSocketServer({
  port: 5995
});
var strArray = []
/// Read in users from text file.
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
//Listen for server 2
wsNode.on("listening", function () {
  console.log("listening on port 8000");
});

// WEBSERVER
wsNode.on("connection", (wsNode) => {
  serverNode = new WebSocket("ws://45.33.96.41:8001");
  serverNode.on("open", function open() {
    console.log("listening on 8001 for other server");
  });

  console.log("connection to port 8000");
  /// INDIVIDUAL CONNECTIONS //
  ////////// Handle incoming messages ///////////////
  wsNode.on("message", function (charMsg) {
    var charString = String(charMsg);
    charString = charString.toLowerCase();
    console.log("From server 2 " + charString);
    wsNode.send("Got your message");
    // Check for new user //
    var hash = charString.substring(0, 1);
    if (hash == "#") {
      console.log("new user")
      var trimOffHash = charString.substring(1);
      var myArray = trimOffHash.split(",");
      fs.appendFile(userFile, myArray[0] + "\n", (err) => {
        if (err) {
          console.log(err);
        }
      });

      fs.appendFile(userFile, myArray[1] + "\n", (err) => {
        if (err) {
          console.log(err);
        }
      });

    } else {
      console.log("hash " + hash)
      var obj = JSON.parse(charMsg)
      // For Each Key in message, add to data. 
      for (const key in obj) {
        console.log("const key: " + key)
        if (db.has(key)) {
          // this is the items in that array
          var valArray = obj[key]
          console.log("obj[key] " + valArray)
          // get array and push new values 
          var dbArray = db.get(key)
          console.log("db array from db.get(key) " + dbArray)
          for (let i = 0; i < valArray.length; i++) {
            console.log(`the item ${valArray[i]}`)
            dbArray.push(valArray[i])
          }
          db.set(key, dbArray)
          console.log(`the dbArray =  ${dbArray}`)
        }
      }

    }
    //console.log(JSON.stringify(db.JSON()))

  });
});
///////////////////// END Inter server communication //////////////////////////////

//////////////////// CLIENT WEBSERVER ///////////////////////////////////////////////////////
wss.on("listening", function () {
  console.log("listening on port 5995");
});

// Client WEBSERVER
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
    var charString = String(charMsg);
    charString = charString.toLowerCase();
    var newUser = charString.substring(0, 1);
    var addUser = false;
    if (newUser == ",") {
      addUser = true;
    }
    console.log("add " + addUser);
    console.log("char string " + charString);
    /// LOGIN THRESHHOLD //
    if (metadata.loggedIn == false) {
      //// ADD NEW USER ////
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
      /////////////////////////////////////////////////////////////////////////////
      /////////////////////// NOW LOGGED IN ///////////////////////////////
      ///////////////////////////////////////////////////////////////////
    } else {
      var key = metadata.user
      if (writing == true) {
        if (db.has(key)) {
          //ws.send(JSON.stringify(db.JSON()));
          var value = db.get(key)
          value.push(charString)
          db.set(key, value)
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
          ws.send("User to delete Not Present")
        }
        /// Exit, Need to sync data ////
      } else if (charString == "exit") {
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
  db.set(u, []);
  if (users.has(u)) {
    ws.send(`User: ${u} already added`);
  } else {
    users.set(u, p);
    ws.send(`Added User: ${u}`);
    serverNode.send(`#${u},${p}`)
  }
}

function readFile(users) {
  var array = fs.readFileSync(userFile).toString().split("\n");
  var myString = "";
  var leng = array.length;
  for (let i = 0; i < leng - 1; i++) {
    if (i % 2 == 1) {
      myString += array[i - 1];
      myString += " ";
      myString += array[i];
      myString += ",";

      users.set(array[i - 1], array[i]);
    }
  }
  console.log(myString);
  var ar = myString.split(",");
  return ar;
}

function logMapElements(value, key, map) {
  console.log(`m[${key}] = ${value}`);
}

function uuidv4() {
  return "yxxx-xxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}