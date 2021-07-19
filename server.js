const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)


app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${getUniqueId()}`)
})
app.get('/views/icon.png', (req, res) => {
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
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', (socket) => {
 
  socket.on("callerCandidates",(iceCandidates,userId,roomId,to)=>{
   // console.log("callerCandidates"+iceCandidates+"userId: "+userId);
    io.emit('callerCandidates', iceCandidates,userId,roomId,to);
  });
  socket.on("OfferSdp",(sdp,userId,roomId)=>{
   // console.log("OfferSdp"+sdp+"userId: "+userId,roomId);
    io.emit("OfferSdp", sdp,userId,roomId);
  });
  socket.on("answerSdp",(sdp,userId,roomId,touser)=>{
   // console.log("answerSdp"+sdp+"userId: "+userId,roomId,touser);
    io.emit("answerSdp",sdp,userId,roomId,touser);
  });
  socket.on("calleeCandidates",(iceCandidates,userId,roomId,touser)=>{
    console.log("calleeCandidates"+iceCandidates+"userId: "+userId+roomId+touser);
    io.emit('calleeCandidates', iceCandidates,userId,roomId,touser);
  });
  socket.on("user-connected",(userId,roomId)=>{
    console.log("user-conneted"+userId);
    io.emit("user-connected",userId,roomId);
  });

  socket.on("user-disconnected",(userId,roomId)=>{
    console.log("user-disconneted"+userId);
    io.emit("user-disconnected",userId,roomId)
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