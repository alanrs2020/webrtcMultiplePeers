const socket = io("/")
const audioButton = document.getElementById("micon");
const videoButton = document.getElementById("videoon");
const videoGrid = document.getElementById('video-grid');
const userId = getUniqueId();
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
const configuration = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};
let peerConnection = null;
let localStream = null;
let audio = true;
let video = true;
let remoteTrack = {}
let addedTracksId = ["3454356"];
let remoteStream = null;
let roomDialog = null;
let roomId = null;
const peerConnections = {}
getUserMedia();
async function getUserMedia(){
  //alert(`Room-Id: ${ROOM_ID}`,)
   const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
          addlocalVideoStream(stream);
          localStream = stream;
    // await createRoom();
    socket.emit("user-connected",userId,ROOM_ID,socket.id);
   // console.log("SOCKET ID"+socket.id);

    audioButton.addEventListener('click', toggleAudio);
    videoButton.addEventListener('click', toggleVideo);

}
function toggleVideo() {
  if (video == true) {
    document.getElementById("videoon").src = "videooff";
    localStream.getVideoTracks()[0].enabled = false
     video = false;
  } else {
    document.getElementById("videoon").src = "videoon";
    localStream.getVideoTracks()[0].enabled = true
    video = true;
  }
}

function toggleAudio() {
  if (audio == true) {
    audio = false
    document.getElementById("micon").src = "micoff";
      localStream.getAudioTracks()[0].enabled = false
  } else {
    audio = true
    document.getElementById("micon").src = "micon";
      localStream.getAudioTracks()[0].enabled = true
  }
}
socket.on("user-connected",async function(peerId,roomId,socketId){

  console.log("Already offered");
   if(ROOM_ID == roomId && peerId != userId){
    if(peerConnections[peerId] == null){
      await createOffer(peerId,socketId);
      peers[socketId] = peerId;
    }else{
      console.log("Already offered");
    }
   }
});

async function createOffer(id,socketId){
  peerConnection = new RTCPeerConnection(configuration);
  peerConnections[id] = peerConnection;

  registerPeerConnectionListeners(id);
  
    localStream.getTracks().forEach(track => {
      peerConnections[id].addTrack(track, localStream);
    });

 
    // Code for collecting ICE candidates below
    //const callerCandidatesCollection = roomRef.collection('callerCandidates');
  
    peerConnections[id].addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }
      console.log('Got candidate: ', event.candidate);
  
      //callerCandidatesCollection.add(event.candidate.toJSON());
      //Android.SaveCallerCandidates(JSON.stringify(event.candidate));
      socket.emit("callerCandidates",JSON.stringify(event.candidate),userId,roomId,id);
    });
    // Code for collecting ICE candidates above
  
    // Code for creating a room below
    const offer = await peerConnections[id].createOffer();
    await peerConnections[id].setLocalDescription(offer);
    console.log('Created offer:', offer);

    
    const roomWithOffer = {
      
        type: offer.type,
        sdp: offer.sdp,
    };
  
    // Code for creating a room above
  
    peerConnections[id].addEventListener('track', event => {
      console.log('Got remote track:', event.streams[0]);
  
          event.streams[0].getTracks().forEach(async track => {
        console.log('Add a track to the remoteStream:', track);
       await addRemoteTracks(track,remoteTrack.length,id);
  
        });
    });
        
        socket.emit("OfferSdp",JSON.stringify(roomWithOffer),userId,ROOM_ID);
  
        peerConnections[id].onremovestream = function(event){
  
               alert("onremovestream event detected!",event.id);
               peerConnections[id].remoteStream(event.streams[0]);
        };
}
  socket.on("OfferSdp",async function(sdp,peerId,roomId){
    await setRemoteOffer(sdp,peerId,roomId);    
  });

async function setRemoteOffer(sdp,peerId,roomId){
  if(roomId == ROOM_ID && peerId != userId){
    peerConnection = new RTCPeerConnection(configuration);
    peerConnections[peerId] = peerConnection;
    registerPeerConnectionListeners(peerId);

   
     localStream.getTracks().forEach(track => {
      peerConnections[peerId].addTrack(track, localStream);
    });
    peerConnections[peerId].addEventListener('track', event => {
      console.log('Got remote track:', event.streams[0]);
  
          event.streams[0].getTracks().forEach(async track => {
        console.log('Add a track to the remoteStream:', track);
       await addRemoteTracks(track,remoteTrack.length,peerId);
  
        });
    });

    const rtcSessionDescription = new RTCSessionDescription(JSON.parse(sdp));
    await peerConnections[peerId].setRemoteDescription(rtcSessionDescription);
   
    const answer = await peerConnections[peerId].createAnswer();
    console.log('Created answer:', answer);
    await peerConnections[peerId].setLocalDescription(answer);

   const roomWithAnswer = {
      type: answer.type,
      sdp: answer.sdp,
    };
    
    peerConnections[peerId].addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }
      console.log('Got candidate: '+ event.candidate);
     socket.emit("calleeCandidates",JSON.stringify(event.candidate),userId,ROOM_ID,peerId);
    });
    socket.emit("answerSdp",JSON.stringify(roomWithAnswer),userId,ROOM_ID,peerId);
  }
  
}  
  socket.on("answerSdp",async function(sdp,peerId,roomId,isMine) {

    if(roomId == ROOM_ID && isMine == userId){
    
      await AddAnswerSdp(JSON.parse(sdp),peerId);
    }
  });
  socket.on("calleeCandidates",async function(ice,peerId,roomId,isMine) {

    if(roomId == ROOM_ID && peerId != userId){
     if(isMine == userId){
      await AddIceCandidate(ice,peerId);
     }else{
       console.log("NOt Mine ICECandidate");
     }
    }
  });
  socket.on("callerCandidates",async function(ice,peerId,roomId,isMine) {

    if(roomId == ROOM_ID && isMine == userId){
    
      await AddIceCandidate(ice,peerId);

    }
  });

async function AddIceCandidate(candidate,peerId){
   
   console.log(`Got new remote ICE candidate: ${JSON.stringify(candidate)}`);
  await peerConnections[peerId].addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
  
}
socket.on("user-disconnected",function(socketId){
  const parents = document.getElementsByTagName('div')


  if(peers[socketId] != null){
    const peerId = peers[socketId];
    const x = document.getElementById(peerId+"video");
    console.log(x);
    const y = document.getElementById(peerId+"audio");
    console.log(y)
    x.remove();
    y.remove();
  }
})
async function AddAnswerSdp(answerSdp,peerId){

  
    //  console.log('Got remote description: ', answerSdp);
      const rtcSessionDescription = new RTCSessionDescription(answerSdp);
      await peerConnections[peerId].setRemoteDescription(rtcSessionDescription);

}

function registerPeerConnectionListeners(peerId) {
  peerConnections[peerId].addEventListener('icegatheringstatechange', () => {
    console.log(
        `ICE gathering state changed: ${peerConnections[peerId].iceGatheringState}`);
  });

  peerConnections[peerId].addEventListener('connectionstatechange', () => {
    console.log(`Connection state change: ${peerConnections[peerId].connectionState}`);

  });

  peerConnections[peerId].addEventListener('signalingstatechange', () => {
    console.log(`Signaling state change: ${peerConnections[peerId].signalingState}`);
  });

  peerConnections[peerId].addEventListener('iceconnectionstatechange ', () => {
    console.log(
        `ICE connection state change: ${peerConnections[peerId].iceConnectionState}`);
  });
}

//socket.emit('chat message',stream,ROOM_ID,userId);



function addlocalVideoStream(stream) {
const video = document.getElementById('localVideo');
//const container = document.getElementsByClassName("video-container");
const label = document.getElementById("label");
label.innerHTML = userId;
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  //videoGrid.append(video)
}
function createContainer(){
  
}
async function addRemoteTracks(stremTrack,item,peerId){
 
  if (!addedTracksId.includes(stremTrack.id)) {
   addedTracksId.push(stremTrack.id);
    remoteStream = new MediaStream;
   remoteStream.addTrack(stremTrack);
   
   console.log("remoteStream tracks length",remoteTrack.length);
  
   const videoGrid = document.getElementById('video-grid');
   var container = document.createElement("div");
   const label = document.createElement("label");
   const video = document.createElement('video');
   if(stremTrack.kind == "video" && remoteTrack[peerId+"video"] == null){
    remoteTrack[peerId+"video"] = remoteStream;
    container.setAttribute("id",peerId+"video");
    container.className = "column";
    video.srcObject = remoteTrack[peerId+"video"];
    label.className = "label";
   label.innerHTML = peerId;

    video.setAttribute('autoplay',"")
     video.addEventListener('loadedmetadata', () => {
       video.play()
     })
     container.append(label)
     container.append(video)
     videoGrid.append(container)
   }else if(stremTrack.kind == "audio" && remoteTrack[peerId+"audio"] == null){
    remoteTrack[peerId+"audio"] = remoteStream;
     container.id = peerId+"audio";
     container.style.display = "none";
     video.srcObject = remoteTrack[peerId+"audio"];
     label.className = "label";
   label.innerHTML = peerId;

    video.setAttribute('autoplay',"")
     video.addEventListener('loadedmetadata', () => {
       video.play()
     })
     container.append(label)
     container.append(video)
     videoGrid.append(container)

   }else{
     
   }

   
   
  }
 
 }
function addRemoteVideoStream(stream) {
 
 
  }
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