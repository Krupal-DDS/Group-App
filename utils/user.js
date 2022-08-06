const moment = require('moment')

const users = [];

let formatMessage = (username, text)=>{
    return{
        username,
        text,
        time: moment().format('h:mm a')
    }
}

//new user join
let userJoin = (id,username,room,userId,roomId)=>{
    const user = {id,username,room,userId,roomId};

    users.push(user);

    return user;
}

let getCurrentUser = (id)=>{
    return users.find(user => user.id == id);
}

//When user is leave
let userLeave = (id)=>{
    const index = users.findIndex(user => user.id == id);

    if(index !== -1){
        return users.splice(index,1)[0];
    }
}

//Get room Users
let getRoomUsers =(room)=>{
    return users.filter(user => user.room == room); 
}
module.exports =  {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    formatMessage
}