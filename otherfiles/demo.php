## RMB:  this could be used by the phpws server discussed by
##    the author in chapter 23, BUT you have to install that server
public function onMessage(IWebSocketConnection $user, IWebSocketMessage $msg){
  $msg = trim($msg->getData());
  switch($msg){
    case 'hello':
      $msgback = WebSocketMessage::create("hello human");
      $user->sendMessage($msgback);
      break;
    case 'name':
      $msgback = WebSocketMessage::create("I don't have a name");
      $user->sendMessage($msgback);
      break;
    case 'age':
      $msgback = WebSocketMessage::create("I'm old");
      $user->sendMessage($msgback);
      break;
    case 'date':
      $msgback = WebSocketMessage::create("today is ".date("F j, Y"));
      $user->sendMessage($msgback);
      break;
    case 'time':
      $msgback = WebSocketMessage::create("the time is ".date("H:iA"));
      $user->sendMessage($msgback);
      break;
    case 'thanks':
      $msgback = WebSocketMessage::create("you're welcome");
      $user->sendMessage($msgback);
      break;
    case 'bye':
      $msgback = WebSocketMessage::create("have a nice day");
      $user->sendMessage($msgback);
      break;
    default:
      $msgback = WebSocketMessage::create("I don't understand");
      $user->sendMessage($msgback);
      break;
  }
}
