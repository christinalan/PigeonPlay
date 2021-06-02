let peerConnection;

const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"],
    },
  ],
};

//configuring audio for listener
let audio = document.querySelector("audio");
let listenButton = document.getElementById("button");

let socket = io();

socket.on("connect", () => {
  console.log("listener connected");
});

socket.on("offer", (id, description) => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then((sdp) => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = (event) => {
    console.log(event.streams);
    audio.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});

socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch((e) => console.log(ed));
});

socket.on("connect", () => {
  socket.emit("listener is connected to server");
});

socket.on("broadcaster", () => {
  let message = "hello!";
  socket.emit("listener", message);
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
  peerConnection.close();
};

listenButton.addEventListener("click", () => {
  console.log("fetching audio from pigeon page");
  audio.play();
  audio.muted = false;
});
