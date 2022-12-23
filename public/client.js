const urlParams = new URLSearchParams(window.location.search);
const ROOM_ID = urlParams.get('roomId');

const socket = io('http://localhost:3000');
const videoGrid = document.getElementById('video-grid');
const controlPanel = document.getElementById('control-panel');
const enableScreenShareButton = document.getElementById('enable-screen-share-button');
const disableScreenShareButton = document.getElementById('disable-screen-share-button');
const userCount = document.getElementById('user-count');

let myPeer = new SimplePeer({
  host: '/',
  port: '3000',
});

const myVideo = document.createElement('video');
myVideo.muted = true;
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
}).then(stream => {
  addVideoStream(myVideo, stream);

  myPeer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream);
  });
});

socket.on('user-disconnected', userId => {
  if (peers[userId]) {
    peers[userId].close();
  }
});

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

enableScreenShareButton.addEventListener('click', () => {
  navigator.mediaDevices.getDisplayMedia().then(stream => {
    addVideoStream(myVideo, stream);
    myPeer.call(ROOM_ID, stream);
  });
});

disableScreenShareButton.addEventListener('click', () => {
  myVideo.srcObject.getTracks().forEach(track => track.stop());
  myVideo.srcObject = null;
});

socket.on('user-connected', (userId) => {
  userCount.innerText = parseInt(userCount.innerText) + 1;
});

socket.on('user-disconnected', (userId) => {
  userCount.innerText = parseInt(userCount.innerText) - 1;
});
