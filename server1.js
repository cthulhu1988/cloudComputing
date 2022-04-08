#!/usr/bin/node
 ////////// other node IP and port //////////
const server2 = "ws://45.33.96.41:8001";

const JSONdb = require("simple-json-db");
const WebSocketServer = require("ws").Server;
const WebSocket = require("ws").WebSocket;
var fs = require("fs");

const db = new JSONdb("/root/cloudComputing/database.json");
const userFile = "accounts1.txt";
const users = new Map();
const clients = new Map();
var authClients = [];
var serverNode;

// Socket to talk to other server
const wsNode = new WebSocketServer({
  port: 8000
});
// Socket for client program
const wss = new WebSocketServer({
  port: 5995
});

/// Read in users from text file.
var array = fs.readFileSync(userFile).toString().split("\n");
var leng = array.length;
for (let i = 0; i < leng - 1; i++) {
  if (i % 2 == 1) {
    if (!db.has(array[i - 1])) {
      db.set(array[i - 1], []);
    }
    users.set(array[i - 1], array[i]);
  }
}
/// Sync data base with new users ////
db.sync();
///////////////////// Inter server communication //////////////////////////////
//Listen for server 2
wsNode.on("listening", function () {
  console.log("listening on port 8000");
});

////////////////////////////////////////////////////
////////// Handle incoming messages ///////////////
wsNode.on("connection", (wsNode) => {
  serverNode = new WebSocket(server2);
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

    // Check for new user,other stuff in server message//
    var leadingChar = charString.substring(0, 1);
    ////////////////////////////////////////////////

    //// Remove Item from Database ///////////
    if (leadingChar == "-") {
      var trimOffHash = charString.substring(1);
      removeItemArr = trimOffHash.split(",");
      var key = removeItemArr[0]
      var value = db.get(key)
      //console.log(`KEY ${key} and value ${value}`)
      var it = removeItemArr[1]
      //console.log(`it -> ${it}`)
      value = value.filter(function (item) {
        //console.log(item)
        return item !== it
      })
      //console.log("value new " + value)
      db.set(key, value);
      //////////// NEW USER INCOMING ////////////////////////
    } else if (leadingChar == "#") {
      ////////// ADD NEW USER TO TEXT FILE //////////
      var trimOffHash = charString.substring(1);
      var myArray = trimOffHash.split(",");

      if (!db.has(key)) {
        db.set(key, [])
      }

      fs.appendFile(userFile, myArray[0] + "\n" + myArray[1] + "\n", (err) => {
        if (err) {
          console.log(err);
        }
      });

      /////////////// EXIT: NOT A SPECIAL SERVER MESSAGE /////////
    } else {

      var JSONObjArray = JSON.parse(charMsg)
      // For Each Key in message, add to data. 
      for (const key in JSONObjArray) {
        if (db.has(key)) {
          // this is the items in that array
          var jsonKeyArr = JSONObjArray[key]
          // get array and push new values 
          var thisDBArray = db.get(key)
          for (let i = 0; i < jsonKeyArr.length; i++) {
            thisDBArray.push(jsonKeyArr[i])
          }
          var set = new Set();
          thisDBArray.forEach(item => set.add(item))
          cleanArr = Array.from(set);
          db.set(key, cleanArr)
        }
      }
    }
  });
});


///////////////////// END Inter server communication //////////////////////////////
///////////////////////////////////////////////////////////////////////////
//////////////////// CLIENT WEBSERVER ///////////////////////////////////////////////////////
wss.on("listening", function () {
  console.log("listening on port 5995");
});

/////////////// CLIENT/USER WEBSERVER //////////////
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
  var tries = 2;
  clients.set(ws, metadata);
  var writing = false
  var deleteInProgress = false

  /// INDIVIDUAL CONNECTIONS //
  ws.on("message", function (charMsg) {
    const metadata = clients.get(ws);
    var charString = String(charMsg);
    charString = charString.toLowerCase();
    var newUser = charString.substring(0, 1);
    var addUser = false;

    /// detect add user option to database. 
    if (newUser == ",") {
      addUser = true;
    }

    /////////// LOGIN THRESHHOLD - USE IF NO CURRENT USER LOGGED IN //
    if (metadata.loggedIn == false) {
      //// ADD NEW USER ////
      if (addUser == true) {
        addUser = false;
        funcaddUser(metadata, charString, ws);
      }
      /// USER IN SYSTEM, ADD PASSWORD /////
      else if (users.has(charString) && waitingForPass == false) {
        ws.send("Send password to login");
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
            ws.send("Failed login, closing connection...");
            ws.close();
          }
        }
      } else {
        ws.send("User Not found, please add New User with utility");
      }
      /////////////////////////////////////////////////////////////////////////////
      /////////////////////// NOW LOGGED IN ///////////////////////////////
      ///////////////////////////////////////////////////////////////////
    } else {
      if (addUser == true) {
        addUser = false;
        funcaddUser(metadata, charString, ws);
        console.log("Adding new user")
      }
      var key = metadata.user
      //////////DELETE DATA ////////////////////////
      if (deleteInProgress == true) {
        ws.send(`deleting ${charString}`)
        deleteInProgress = false
        var index = parseInt(charString) - 1
        var key = metadata.user
        var value = db.get(key)
        var it = value[index]
        value = value.filter(function (item) {
          return item !== it
        })
        db.set(key, value);
      }

      if (writing == true) {
        if (db.has(key)) {
          var value = db.get(key)
          value.push(charString)
          db.set(key, value)
          ws.send(`writing data to: ${key}`)
        }

        writing = false

        /////////READ DATA FROM USER /////////
      } else if (charString == "read") {

        if (db.has(key)) {
          ws.send(`Data for user: ${key}`)
          var value = db.get(key)
          if (value.length < 1) {
            ws.send("No Data Set yet for " + key)
          } else {
            ws.send(`${value}`)
          }
        }

        /////////WRITE DATA TO USER /////////
      } else if (charString == "write") {
        ws.send(`Send data to write to ${key}'s file`);
        writing = true

        /////////// DELETE DATA //////////////
      } else if (charString == "delete") {

        if (db.has(key)) {
          ws.send(`Select Number to delete:`)
          var value = db.get(key)
          for (let i = 1; i <= value.length; i++) {
            ws.send(`${i} ${value[i-1]}`)
          }
        }

        deleteInProgress = true

        /// Exit, Need to sync data ////
      } else if (charString == "exit") {
        serverNode.send(JSON.stringify(db.JSON()))
        ws.send("Closing Connection");
        ws.close();
      } else {
        ws.send(`Your User ID is -->${metadata.id}\n`);
        ws.send("Menu:\n");
        ws.send("1. READ");
        ws.send("2. WRITE");
        ws.send("3. DELETE");
      }
    }
  });
});

function funcaddUser(metadata, charString, ws) {
  var myArray;
  var p, u;
  var subcharString = charString.substring(1);
  myArray = subcharString.split(",");
  // new user
  u = myArray[0];
  // new password
  p = myArray[1];
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
    ws.send(`Added User: ${u} with id ${metadata.id}`);
    // Send message to other server about new user. 
    serverNode.send(`#${u},${p}`)
    // Add to own file 
    fs.appendFile(userFile, u + "\n" + p + "\n", (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
}

function uuidv4() {
  return "yxxx-xxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}