const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const Groups = require('./model/group');
const {userJoin,getCurrentUser,getRoomUsers,userLeave,formatMessage} = require('./utils/user');
const { response } = require('express');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//static file 
app.use(express.static(path.join(__dirname,'public')))


//Store Message in Database
mongoose.connect("mongodb://localhost:27017/Wishchat",{useNewUrlParser: true},(error)=>{
    if(error){
        console.log(error.message);
    }else{
        console.log('connect to Database');
    }


    const NewUser = 'Wishchat Admin';
    //connect the socket 
    io.on('connection',(socket)=>{
        socket.on('joinRoom',async ({username,room,userId,roomId})=>{       
            const user = userJoin(socket.id,username,room,userId,roomId);
            newUser = { username: username, userId: userId };
            const group = await Groups.find({ GroupName: user.room});            
            if(group.length == 0){
                await new Groups({
                    socketId: socket.id,
                    GroupName: room,
                    Groups:roomId,
                    Users: newUser
                    }).save().then(()=>{
                        console.log("Data stored"); 
                    }).catch((error)=>{
                        console.log(error.message);
                    })            
                } else {
                    const allUser = group[0].Users;                                
                    const find = allUser.find((User) => User.username == user.username)
                    if(find){                        
                        console.log('User Is Already Exits');                       
                        const OldMsgs = group[0].messages;           
                        if(OldMsgs.length > 0){                                 
                            allSender = OldMsgs.map(sender => sender.sender)
                            allMessages = OldMsgs.map(sender => sender.message)                              
                            for(let i=0;i<allMessages.length;i++){
                                socket.emit('message',formatMessage(allSender[i],allMessages[i]));
                            }
                        }
                    }else{
                        Groups.findOneAndUpdate(
                            {GroupName: user.room},
                            {$push:{Users:{username: user.username, userId: userId}}},                           
                            (error,response)=>{
                                if(error){
                                    console.log(error.message);
                                }else{
                                    console.log("User is Added In Group");
                                }
                            }
                        )                      
                    }
                } 
            socket.join(user.room);
            //Welcome
            socket.emit('message',formatMessage(NewUser,`Hello! ${user.username} welcome to Wishchat`));
            
            //broadcast           
            socket.broadcast.to(user.room).emit('message',formatMessage(NewUser,`${user.username} is connect to chat`));
          
            
            //Send Users and Room details
            const data = await Groups.find()                     
            const found = await Groups.find({ GroupName: user.room });
            const rooms = data.map((roomName) => roomName.GroupName)            
            io.to(user.room).emit('roomUsers',{
                rooms:rooms,
                users: found[0].Users.map(data=>data),                       
            });  
        })    
        //Listen chat Message
        socket.on('chatMessage',async msg =>{
            const user = getCurrentUser(socket.id);
            let setMsg = {
                sender:user.username,
                senderId: user.userId,
                message:msg
            }               
            Groups.findOneAndUpdate(
                    {GroupName: user.room},
                    {$push:{messages:{sender: user.username, senderId: user.userId, message: msg}}},
                    (error,response)=>{
                        if(error){
                            console.log(error.message);
                        }else{
                            io.to(user.room).emit('message',formatMessage(user.username,msg))                        
                        }
                    })        
                })
        //disconnect
        socket.on('disconnect',()=>{
            const user = userLeave(socket.id);                   
            if(user){                
                io.to(user.room).emit('message',formatMessage(NewUser,`${user.username} is Disconnect the Chat`));
                
                io.to(user.room).emit('roomUsers',{
                    room:user.room,
                    users:getRoomUsers(user.room)
                })
            }
            
        })
        
    })
})
    
server.listen(8001,()=>{
    console.log('connected to server');
})