// importing these scripts from the web keeps us from having to include them locally
// but also necessitates us using a local server
import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";
import { DragControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/DragControls.js";
import { GUI } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/libs/dat.gui.module.js";

const peerConnections = {};
const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    // {
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ],
};

let audioElement = document.getElementById("webrtc");
let audioSelect = document.querySelector("select#audioSource");

let socket = io();
socket.on("connect", () => {
  console.log("pigeon player connected");
});

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("listener", (id) => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  let stream = audioElement.srcObject;
  stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then((sdp) => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", (id) => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

audioSelect.onchange = getStream;

function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
  window.deviceInfos = deviceInfos;
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      audioSelect.appendChild(option);
    }
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  const audioSource = audioSelect.value;
  //   const videoSource = videoSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    // video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

function gotStream(stream) {
  window.stream = stream;
  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    (option) => option.text === stream.getAudioTracks()[0].label
  );
  audioElement.srcObject = stream;
  socket.emit("broadcaster");
}

function handleError(error) {
  console.error("Error: ", error);
}

//getting devices
function getConnectedDevices(type, callback) {
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    const filtered = devices.filter((device) => device.kind === type);
    callback(filtered);
  });
}

getConnectedDevices("audioinput", (microphones) =>
  console.log("mics found", microphones)
);

let scene, camera, renderer;

let images = [];

let image, image1, image2, image3, image4, image5;
let pPos1, pPos2, pPos3, pPos4, pPos5, pPos6;
let textures = [];
let dragControls, group;
let options;

const mouse = new THREE.Vector2(),
  raycaster = new THREE.Raycaster();

let clock = new THREE.Clock();

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", async () => {
  // Tone.Transport.stop();
  // await Tone.start();
  getStream().then(getDevices).then(gotDevices);
  init();
  // Tone.Transport.start();
});

function init() {
  let overlay = document.getElementById("overlay");
  overlay.remove();

  const container = document.getElementById("container");

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  // camera.position.set(20, 20, 100); for 2D
  camera.position.set(20, 50, 50);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000); // background color
  scene.fog = new THREE.Fog(0xcce0ff, 500, 10000); // fog is interesting, try commenting it out

  // boiler plate - now we add lights to the scene
  scene.add(new THREE.AmbientLight(0x666666));

  const light = new THREE.DirectionalLight(0xdfebff, 1);
  light.position.set(50, 200, 100);
  light.position.multiplyScalar(1.3);

  light.castShadow = true;

  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

  const d = 300;

  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;

  light.shadow.camera.far = 1000;

  scene.add(light);

  group = new THREE.Group();
  scene.add(group);

  //audio
  const listener = new THREE.AudioListener();
  camera.add(listener);

  //pigeons
  const pig = document.getElementById("track1");

  pPos1 = new THREE.PositionalAudio(listener);
  // pPos1.context = Tone.context;

  // const pigeon = new Tone.Player("sounds/pCoo.mp3").toDestination();
  // pigeon.loop = true;
  // pigeon.autostart = true;

  // var buffer = new Tone.Buffer("sounds/pCoo.mp3", function () {
  //   bufferAudio = buffer.get();
  //   console.log(bufferAudio);
  //   bufferAudio.play();
  //   const pigeon = new Tone.Player(url);
  //   pigeon.loop = true;d
  //   pigeon.autostart = true;
  // });

  pPos1.setMediaElementSource(pig);
  pPos1.setRefDistance(50);
  pPos1.setDistanceModel("exponential");
  pPos1.setDirectionalCone(90, 200, 0);
  pPos1.rotation.set(0, Math.PI / 2, 0);

  pig.play();
  const phelper = new PositionalAudioHelper(pPos1, 5);
  pPos1.add(phelper);

  //next pigeon sound
  const pig1 = document.getElementById("track2");
  pPos2 = new THREE.PositionalAudio(listener);
  pPos2.setRefDistance(50);
  pPos2.setDistanceModel("exponential");
  pPos2.setMediaElementSource(pig1);
  pPos2.setDirectionalCone(90, 200, 0);
  pPos2.rotation.set(0, Math.PI / 2, 0);
  pig1.play();
  const phelper1 = new PositionalAudioHelper(pPos2, 5);
  pPos2.add(phelper1);

  const pig2 = document.getElementById("track3");
  pPos3 = new THREE.PositionalAudio(listener);
  pPos3.setRefDistance(50);
  pPos3.setDistanceModel("exponential");
  pPos3.setMediaElementSource(pig2);
  pPos3.setDirectionalCone(90, 200, 0);
  pPos3.rotation.set(0, -Math.PI / 2, 0);
  pig2.play();
  const phelper2 = new PositionalAudioHelper(pPos3, 5);
  pPos3.add(phelper2);

  const pig3 = document.getElementById("track4");
  pPos4 = new THREE.PositionalAudio(listener);
  pPos4.setRefDistance(50);
  pPos4.setDistanceModel("exponential");
  pPos4.setMediaElementSource(pig3);
  pPos4.setDirectionalCone(90, 200, 0);
  pPos4.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
  pig3.play();
  const phelper3 = new PositionalAudioHelper(pPos4, 5);
  pPos4.add(phelper3);

  const pig4 = document.getElementById("track5");
  pPos5 = new THREE.PositionalAudio(listener);
  pPos5.setRefDistance(50);
  pPos5.setDistanceModel("exponential");
  pPos5.setMediaElementSource(pig4);
  pPos5.setDirectionalCone(90, 200, 0);
  pPos5.rotation.set(0, -Math.PI / 2, Math.PI / 2);
  pig4.play();
  const phelper4 = new PositionalAudioHelper(pPos5, 5);
  pPos5.add(phelper4);

  const pig5 = document.getElementById("track6");
  pPos6 = new THREE.PositionalAudio(listener);
  pPos6.setRefDistance(50);
  pPos6.setDistanceModel("exponential");
  pPos6.setMediaElementSource(pig5);
  pPos6.setDirectionalCone(90, 200, 0);
  pPos6.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  pig5.play();
  const phelper5 = new PositionalAudioHelper(pPos6, 5);
  pPos6.add(phelper5);

  navigator.mediaDevices.getUserMedia({ audio: true }).then(handleSuccess);

  function handleSuccess(stream) {
    var audio = new THREE.Audio(listener);

    var context = listener.context;
    audio.context = Tone.context;
    var source = context.createMediaStreamSource(stream);
    // audio.setNodeSource(source);

    // const tone = Tone.context._context._nativeAudioContext;
    const tone = Tone.context._context;
    // sound1.context = Tone.context;

    // var AudioContext = window.AudioContext || window.webkitAudioContext;
    // const context = new AudioContext();

    // sound1.context = tone;

    // Tone.setContext(sound1.context);

    const filter = new Tone.Filter(1500, "highpass").toDestination();
    // audio.connect(filter);

    const reverb = new Tone.Freeverb().toDestination();
    reverb.dampening = 2000;

    // audio.connect(reverb);

    // audio.connect(context.destination);
  }

  //images
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("images/pI1.jpg");
  textures.push(texture);
  const texture1 = textureLoader.load("images/pI2.png");
  textures.push(texture1);
  const texture2 = textureLoader.load("images/pI3.png");
  textures.push(texture2);
  const texture3 = textureLoader.load("images/pI4.png");
  textures.push(texture3);
  const texture4 = textureLoader.load("images/pI5.png");
  textures.push(texture4);
  const texture5 = textureLoader.load("images/pI6.png");
  textures.push(texture5);

  const geometry = new THREE.PlaneGeometry(5, 10, 32);
  geometry.translate(0, 0, 0);
  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    map: texture,
  });
  const material1 = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    map: texture1,
  });
  const material2 = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    map: texture2,
  });
  const material3 = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    map: texture3,
  });
  const material4 = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    map: texture4,
  });
  const material5 = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    map: texture5,
  });

  image = new THREE.Mesh(geometry, material);
  images.push(image);
  image1 = new THREE.Mesh(geometry, material1);
  images.push(image1);
  image2 = new THREE.Mesh(geometry, material2);
  images.push(image2);
  image3 = new THREE.Mesh(geometry, material3);
  images.push(image3);
  image4 = new THREE.Mesh(geometry, material4);
  images.push(image4);
  image5 = new THREE.Mesh(geometry, material5);
  images.push(image5);

  images.forEach(function (image) {
    image.position.set(
      Math.random() * 20,
      Math.random() * 30,
      Math.random() * 25
    );
    scene.add(image);
  });

  image.add(pPos1);
  image1.add(pPos2);
  image2.add(pPos3);
  image3.add(pPos4);
  image4.add(pPos5);
  image5.add(pPos6);

  // for (let i = 0; i < 3; i++) {
  //   image = new THREE.Mesh(geometry, material);

  //   image.position.set(
  //     Math.random() * 10,
  //     Math.random() * 10,
  //     Math.random() * 15
  //   );
  //   scene.add(image);
  //   images.push(image);
  //   images[i].add(pPos1);
  // }

  // for (let i = 0; i < textures.length; i++) {
  //   images.map(
  //     (image) => (image.material.map = textures[count % textures.length])
  //   );
  //   console.log(textures[i]);
  // }
  // count++;

  //stuff for GUI
  options = {
    velx: 0,
    vely: 0,
    speedx: 0.1,
    speedy: 0.1,
    start: function () {
      this.velx = this.speedx;
      this.vely = this.speedy;
    },
    stop: function () {
      this.velx = 0;
      this.vely = 0;
    },
  };

  const gui = new GUI();
  const imageFolder = gui.addFolder("Image");
  imageFolder.add(image.rotation, "x", 0, Math.PI * 2, 0.01);
  imageFolder.add(image.rotation, "y", 0, Math.PI * 2, 0.01);
  imageFolder.add(image1.rotation, "x", 0, Math.PI * 2, 0.01);
  imageFolder.add(image1.rotation, "y", 0, Math.PI * 2, 0.01);
  imageFolder.add(image2.rotation, "x", 0, Math.PI * 2, 0.01);
  imageFolder.add(image2.rotation, "y", 0, Math.PI * 2, 0.01);
  imageFolder.add(image3.rotation, "x", 0, Math.PI * 2, 0.01);
  imageFolder.add(image3.rotation, "y", 0, Math.PI * 2, 0.01);
  imageFolder.add(image4.rotation, "x", 0, Math.PI * 2, 0.01);
  imageFolder.add(image4.rotation, "y", 0, Math.PI * 2, 0.01);
  imageFolder.add(image5.rotation, "x", 0, Math.PI * 2, 0.01);
  imageFolder.add(image5.rotation, "y", 0, Math.PI * 2, 0.01);

  imageFolder.add(options, "start");
  imageFolder.add(options, "stop");
  imageFolder.add(options, "speedx", 0, 10, 0.01).name("Speed X").listen();
  imageFolder.add(options, "speedy", 0, 10, 0.01).name("Speed Y").listen();
  imageFolder.open();

  // boiler plate - setting up rendering from 3D to 2D
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.1, 0);
  controls.update();
  controls.minDistance = 10;
  controls.maxDistance = 1000;
  controls.maxPolarAngle = Math.PI;

  dragControls = new DragControls([...images], camera, renderer.domElement);

  dragControls.addEventListener("drag", render);

  window.addEventListener("resize", onWindowResize);
  document.addEventListener("click", onClick);
  // window.addEventListener("keydown", onKeyDown);
  // window.addEventListener("keyup", onKeyUp);

  animate();
  render();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

// function onKeyDown(event) {
//   enableSelection = event.keyCode === 16 ? true : false;
// }

// function onKeyUp() {
//   enableSelection = false;
// }

function onClick(event) {
  event.preventDefault();

  const draggableObjects = dragControls.getObjects();
  draggableObjects.length = 0;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersections = raycaster.intersectObjects(images, true);

  if (intersections.length > 0) {
    const object = intersections[0].image;

    if (group.children.includes(object) === true) {
      scene.attach(object);
    }
    // else {
    //   group.attach(object);
    // }

    dragControls.transformGroup = true;
    draggableObjects.push(group);
  }

  if (group.children.length === 0) {
    dragControls.transformGroup = false;
    draggableObjects.push(...images);
  }
  render();
}

function render() {
  image.rotation.x += options.velx * options.speedx;
  image.rotation.y += options.vely * options.speedy;
  image1.rotation.x += options.velx * options.speedx;
  image1.rotation.y += options.vely * options.speedy;
  image2.rotation.x += options.velx * options.speedx;
  image2.rotation.y += options.vely * options.speedy;
  image3.rotation.x += options.velx * options.speedx;
  image3.rotation.y += options.vely * options.speedy;
  image4.rotation.x += options.velx * options.speedx;
  image4.rotation.y += options.vely * options.speedy;
  image5.rotation.x += options.velx * options.speedx;
  image5.rotation.y += options.vely * options.speedy;

  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);

  render();
}
