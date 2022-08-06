const chatForm = document.getElementById("chat-form");
const chatMessage = document.querySelector(".chat-messages");
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const roomList = document.getElementById('rooms');


//Get Username and Room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
const socket = io();

var userId = Math.random().toString(36).slice(2);
var roomId = Math.random().toString(36).slice(2);

//JOIn in room
socket.emit("joinRoom", { username, room, userId, roomId});

//Get room and Users
socket.on("roomUsers", ({ rooms, users }) => {
  outputRoomName(rooms);
  outputUsers(users);
});

socket.on("message", (message) => {  
  outputMessage(message);
  scrollBottom();
});
//scroll down for new messages
scrollBottom = () => {
  chatMessage.scrollTop = chatMessage.scrollHeight;
};

//Message Submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  //Get Message as text
  const msg = e.target.elements.msg.value;

  //Emit Message to Server
  socket.emit("chatMessage", msg);

  //clear the message write area
  e.target.elements.msg.value = "";
});

//Output Message to Dom
outputMessage = (message) => {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username}<span>${message.time}</span></p>
    <p class ="text"> ${message.text} </p>`;
  chatMessage.appendChild(div);
};

//Add room name to DOM
let outputRoomName = (rooms)=>{  
    roomList.innerHTML = '';
    rooms.forEach((elements)=>{
      const li = document.createElement('li');
      li.innerHTML = elements;
      li.addEventListener("click",(e)=>
      {
        let room = elements;
        // const datas = document.querySelectorAll(".chat-messages");
        // datas.forEach(data => {
        //   data.remove();
        // });
        socket.emit("joinRoom", { username, room, userId, roomId});        
      })
      roomList.appendChild(li);                            
    })

}

let outputUsers = (users)=>{ 
    userList.innerHTML = '';
    users.forEach((user) => {
      const li = document.createElement('li');
      li.innerText = user.username;
      userList.appendChild(li);
    });
  }

  