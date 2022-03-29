var databox, socket;

function initiate() {
  databox = document.getElementById("databox");
  var button = document.getElementById("button");
  var addUser = document.getElementById("userbtn")
  button.addEventListener("click", send);
  addUser.addEventListener("click", sendUser);

  //socket = new WebSocket("ws://localhost:5995");


  //// SERVER 1
  // socket = new WebSocket("ws://139.177.205.73:5995");
  //// SERVER 2
  socket = new WebSocket("ws://45.33.96.41:5995");

  socket.addEventListener("message", received);
}

function received(event) {
  var list = databox.innerHTML;
  if (event.data == "logged") {
    document.body.style.backgroundColor = "green";

  } else if (event.data == "Closing") {
    document.body.style.backgroundColor = "red";

  }

  databox.innerHTML = "Received: " + event.data + "<br>" + list;
}

function send() {
  var command = document.getElementById("command").value;
  socket.send(command);
}

function sendUser() {
  var user = document.getElementById("user").value;
  var pass = document.getElementById("pass").value;
  var combo = "," + user + "," + pass
  socket.send(combo);
  pass = "";
  user = "";
}

window.addEventListener("load", initiate);