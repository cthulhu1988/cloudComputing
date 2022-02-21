var databox, socket;
function initiate(){
  databox = document.getElementById('databox');
  var button = document.getElementById('button');
  button.addEventListener('click', send);

  // RMB socket = new WebSocket("ws://YOUR_IP_ADDRESS:12345/ws/server.php");
  socket = new WebSocket("ws://vws.cs.mtsu.edu:12345/ws/server.php");  // RMB
  socket.addEventListener('message', received);
}
function received(e){
  var list = databox.innerHTML;
  databox.innerHTML = 'Received: ' + e.data + '<br>' + list;
}
function send(){
  var command = document.getElementById('command').value;
  socket.send(command);
}
addEventListener('load', initiate);
