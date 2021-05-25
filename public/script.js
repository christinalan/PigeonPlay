// importing these scripts from the web keeps us from having to include them locally
// but also necessitates us using a local server
import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";
import { DragControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/DragControls.js";
import { GUI } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/libs/dat.gui.module.js";

let scene, camera, renderer;

let images = [];
let objects = [];

let image, image1, image2;
let pPos1, pPos2, pPos3;
let textures = [];
let count = 0;
let dragControls, group;
let options;

let pSound;

const mouse = new THREE.Vector2(),
  raycaster = new THREE.Raycaster();

let clock = new THREE.Clock();

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

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
  camera.position.set(20, 20, 50);

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
  pPos1.setMediaElementSource(pig);
  pPos1.setRefDistance(50);
  pPos1.setDistanceModel("exponential");
  pPos1.setDirectionalCone(90, 200, 0);
  pig.play();
  const phelper = new PositionalAudioHelper(pPos1, 5);
  pPos1.add(phelper);

  // pSound = new Tone.Synth({
  //   frequency: 1000,
  //   envelope: {
  //     attack: 0.5,
  //     decay: 1.4,
  //     release: 0.9,
  //   },
  //   harmonicity: 5,
  // }).toDestination();
  // pSound.triggerAttackRelease("C4", "8n");
  // Tone.Transport.start();

  //TONE STUFF
  console.log(pPos1.context);
  const reverb = new Tone.Freeverb().toDestination();
  reverb.dampening = 1000;

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

  //images
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("Images/pI1.jpg");
  textures.push(texture);
  const texture1 = textureLoader.load("Images/pI2.png");
  textures.push(texture1);
  const texture2 = textureLoader.load("Images/pI3.png");
  textures.push(texture2);

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

  image = new THREE.Mesh(geometry, material);
  images.push(image);
  image1 = new THREE.Mesh(geometry, material1);
  images.push(image1);
  image2 = new THREE.Mesh(geometry, material2);
  images.push(image2);

  images.forEach(function (image) {
    image.position.set(
      Math.random() * 10,
      Math.random() * 10,
      Math.random() * 15
    );
    scene.add(image);
  });

  image.add(pPos1);
  image1.add(pPos2);
  image2.add(pPos3);

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
  controls.maxDistance = 5000;
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

  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);

  render();
}