var databox, socket;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function initiate() {
  //// SERVER 1

  let server1 = new WebSocket("ws://139.177.205.73:5995");
  //// SERVER 2
  let server2 = new WebSocket("ws://45.33.96.41:5995");
  //// Load balancing //////
  //socket = server1

  randomServerNum = getRandomInt(1000);
  if (randomServerNum % 2 == 0) {
    socket = server2
    console.log("server 2")
  } else {
    console.log("server 1")
    socket = server1
  }
  console.log(socket)
  databox = document.getElementById("databox");
  var button = document.getElementById("button");
  var addUser = document.getElementById("userbtn")
  button.addEventListener("click", send);
  addUser.addEventListener("click", sendUser);
  ///var localhost = new WebSocket("ws://localhost:5995");

  socket.addEventListener("message", received);
}

function received(event) {
  var list = databox.innerHTML;
  if (event.data == "logged") {
    document.body.style.backgroundColor = "green";

  } else if (event.data == "Closing") {
    document.body.style.backgroundColor = "red";

  }

  databox.innerHTML = list  + "Received: " + event.data + "<br>";
}

function send() {
  var command = document.getElementById("command").value;
  socket.send(command);
  var commandField = document.getElementById("command");
  commandField.value = ""
}

function sendUser() {
  var user = document.getElementById("user").value;
  var pass = document.getElementById("pass").value;
  var combo = "," + user + "," + pass
  socket.send(combo);
  var userVal = document.getElementById("user");
  var passVal = document.getElementById("pass");
  passVal.value = "";
  userVal.value = "";
}

window.addEventListener("load", initiate);