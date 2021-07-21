const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)


app.set('view engine', 'ejs')

app.use(express.static('public'))


app.get('/home', (req, res) => {
  res.sendFile(__dirname+"/views/index.html")
})
app.get('/', (req, res) => {
  res.redirect(`/${getUniqueId()}`)
})
app.get('/icon', (req, res) => {
  res.sendFile(__dirname+"/views/icon.png")
})
app.get('/micon', (req, res) => {
  res.sendFile(__dirname+"/views/miconn.png")
})
app.get('/micoff', (req, res) => {
  res.sendFile(__dirname+"/views/micoff.png")
})
app.get('/videoon', (req, res) => {
  res.sendFile(__dirname+"/views/videoon.png")
})
app.get('/videooff', (req, res) => {
  res.sendFile(__dirname+"/views/videooff.png")
})
app.get('/shareoff', (req, res) => {
  res.sendFile(__dirname+"/views/sharescreenoff.png")
})
app.get('/share', (req, res) => {
  res.sendFile(__dirname+"/views/sharescreen.png")
})
app.get('/person', (req, res) => {
  res.sendFile(__dirname+"/views/person.jpg")
})
app.get('/copy', (req, res) => {
  res.sendFile(__dirname+"/views/copy.png")
})
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})


io.on('connection', (socket) => {
 
  socket.on("callerCandidates",(iceCandidates,userId,roomId,to)=>{
   // console.log("callerCandidates"+iceCandidates+"userId: "+userId);
    socket.broadcast.emit('callerCandidates', iceCandidates,userId,roomId,to);
  });
  socket.on("OfferSdp",(sdp,userId,roomId,socketId)=>{
   // console.log("OfferSdp"+sdp+"userId: "+userId,roomId);
    socket.broadcast.emit("OfferSdp", sdp,userId,roomId,socketId);
  });
  socket.on("answerSdp",(sdp,userId,roomId,touser)=>{
   // console.log("answerSdp"+sdp+"userId: "+userId,roomId,touser);
    socket.broadcast.emit("answerSdp",sdp,userId,roomId,touser);
  });
  socket.on("calleeCandidates",(iceCandidates,userId,roomId,touser)=>{
    //console.log("calleeCandidates"+iceCandidates+"userId: "+userId+roomId+touser);
    socket.broadcast.emit('calleeCandidates', iceCandidates,userId,roomId,touser);
  });
  socket.on("user-connected",(userId,roomId,socketId)=>{
    console.log("user-conneted "+userId +socketId);
    socket.broadcast.emit("user-connected",userId,roomId,socketId);
  });
  
  socket.on("disconnect", ()=>{
    console.log("user-disconneted "+socket.id)
    socket.broadcast.emit("user-disconnected",socket.id)
  })
});
server.listen(process.env.PORT || 3000)
function getUniqueId() {
  // body...

    var length = 10;
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

  return result;
}