var databox, socket;
function initiate(){
  databox = document.getElementById('databox');
  var button = document.getElementById('button');
  button.addEventListener('click', send);

  // RMB socket = new WebSocket("ws://YOUR_IP_ADDRESS:12345/ws/server.php");
  socket = new WebSocket("ws://vws.cs.mtsu.edu:12345/ws/server.php");  // RMB
  socket.addEventListener('open', opened);
  socket.addEventListener('message', received);
  socket.addEventListener('close', closed);
  socket.addEventListener('error', showerror);
}
function opened(){
  databox.innerHTML = 'CONNECTION OPENED<br>';
  databox.innerHTML += 'Status: ' + socket.readyState;
}
function received(e){
  var list = databox.innerHTML;
  databox.innerHTML = 'Received: ' + e.data + '<br>' + list;
}
function closed(){
  var list = databox.innerHTML;
  databox.innerHTML = 'CONNECTION CLOSED<br>' + list;

  var button = document.getElementById('button');
  button.disabled = true;
}
function showerror(){
  var list = databox.innerHTML;
  databox.innerHTML = 'ERROR<br>' + list;
}
function send(){
  var command = document.getElementById('command').value;
  if(command == 'close'){
    socket.close();
  }else{
    socket.send(command);
  }
}
addEventListener('load', initiate);
