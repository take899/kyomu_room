import * as THREE from "../lib/threejsm/three.module.js";
import { OrbitControls } from "../lib/threejsm/OrbitControls.js";
 
let scene, camera, renderer;
let orbitControls;

let timerTexture, timerMesh;

const roomX = 40;
const roomY = 25;
const roomZ = 70;
const blackBallR = 7;
const jointHeight = 1.4;
const jointDepth = 0.3;

const roomParams = {
  back:   { geo: [ roomX, roomY ], pos: [ 0, roomY / 2, -roomZ / 2 ], rot: [ 0, 0, 0 ] },
  front:  { geo: [ roomX, roomY ], pos: [ 0, roomY / 2, roomZ /2 ],   rot: [ 0, Math.PI, 0 ] },
  right:  { geo: [ roomZ, roomY ], pos: [ roomX / 2, roomY / 2, 0 ],  rot: [ 0, -Math.PI / 2, 0 ] },
  left:   { geo: [ roomZ, roomY ], pos: [ -roomX / 2, roomY / 2, 0 ], rot: [ 0, Math.PI / 2, 0 ] },
  top:    { geo: [ roomX, roomZ ], pos: [ 0, roomY, 0 ],              rot: [ Math.PI / 2, 0, 0 ] },
}

window.addEventListener( "load", init );
window.addEventListener( "resize", setScreenSize );

function setScreenSize() {
  var width = window.innerWidth;
  var height = window.innerHeight;

  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( width, height );
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

function init() {
  scene = new THREE.Scene();
  
  renderer = new THREE.WebGLRenderer({
    antialias: true, //  なめらかにする
  });

  camera = new THREE.PerspectiveCamera(
    60,     // 視野角
    1 / 1,  // アスペクト比(setScrenSize()で再設定する)
    0.1,    // カメラの距離(近)
    200,    // カメラの距離(遠)
  );
  setScreenSize();
  camera.position.set( 0, 10, 22 );

  orbitControls = new OrbitControls( camera, renderer.domElement );

  orbitControls.target = new THREE.Vector3( 0, blackBallR, - roomZ / 2 + 2 + blackBallR );
  orbitControls.update();

  // canvas追加(canvas, timerCanvas)
  document.body.appendChild( renderer.domElement );

  const timerCanvas = document.createElement( "canvas" );
  timerCanvas.id = "timerCanvas";
  document.body.appendChild( timerCanvas );

  // setGrid();
  setFloor();
  setWall();
  setBlackBoll();
  setLight();
  createTimer();
  setInterval(updateTimer, 1000);
  rendering();
}
 
function setGrid() {
  // XYZ軸表示 x:red, y:green, z:blue
  const axes = new THREE.AxesHelper( 1000 );
  axes.position.set( 0, 0, 0 );
  scene.add( axes );

  // グリッド表示
  const grid = new THREE.GridHelper( 100, 100 );
  scene.add( grid );
}
function setFloor() {
  const floorGeo = new THREE.PlaneGeometry( roomX, roomZ, 1, 1 );
  const floorTex = new THREE.TextureLoader().load( "./img/floor.jpg" ); // https://kenchiku-pers.com/download/103.html フローリング12  
  floorTex.rotation = Math.PI / 2;
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set( 4, 4 );

  const floorMat = new THREE.MeshPhongMaterial({
    map: floorTex,
    // side: THREE.DoubleSide,
  });
  const floorMesh =  new THREE.Mesh( floorGeo, floorMat );
  floorMesh.rotation.set( -Math.PI / 2, 0, 0);
  scene.add( floorMesh );
}

function setWall() {
  const wallGroup = new THREE.Group();
  const wallTex = new THREE.TextureLoader().load( "./img/wall.jpg" ); // https://kenchiku-pers.com/download/16.html 大理石11
  const jointTex = new THREE.TextureLoader().load( "./img/wood.jpg" ); // https://kenchiku-pers.com/download/100.html 木目26
  wallTex.wrapS = THREE.RepeatWrapping;
  wallTex.wrapT = THREE.RepeatWrapping;
  jointTex.rotation = Math.PI / 2;
  
  for ( var key in roomParams ) {
    var geo = roomParams[key].geo;
    var pos = roomParams[key].pos;
    var rot = roomParams[key].rot;
    wallTex.repeat.set( Math.round( geo[0] / 2 ), Math.round( geo[1] / 2 ) );
    var wallGeo = new THREE.PlaneGeometry( geo[0], geo[1], 1, 1 );
    var wallMat = new THREE.MeshPhongMaterial({
      map: wallTex,
      // side: THREE.DoubleSide,
    });
    var wallMesh =  new THREE.Mesh( wallGeo, wallMat );

    if ( key != "top" ) {
      var JointGeo = new THREE.BoxGeometry( geo[0], jointHeight, jointDepth );
      var JointMat = new THREE.MeshPhongMaterial({
        map: jointTex,
      });
      var JointMesh = new THREE.Mesh( JointGeo, JointMat );
      JointMesh.position.set( 0, - roomY / 2 + jointHeight / 2, jointDepth / 2 );
      wallMesh.add( JointMesh );
    }
    wallMesh.position.set( pos[0], pos[1], pos[2] );
    wallMesh.rotation.set( rot[0], rot[1], rot[2] );
    wallGroup.add( wallMesh );
  }
  scene.add( wallGroup );
}

function setBlackBoll() {
  const blackBollGeo = new THREE.SphereGeometry( blackBallR, 32, 32 );
  const blackBollMat = new THREE.MeshPhongMaterial({
    color: 0x000000,
    side: THREE.FrontSide,
    specular: 0xffffff,
    shininess: 1,
  });
  const blackBollMesh = new THREE.Mesh( blackBollGeo, blackBollMat );
  blackBollMesh.position.set( 0, blackBallR, -roomZ / 2 + 2 * blackBallR );
  scene.add( blackBollMesh );

  const shadowTex = new THREE.TextureLoader().load( "./img/roundshadow.png" ); // https://threejsfundamentals.org/threejs/lessons/ja/threejs-shadows.html
  const shadowGeo = new THREE.PlaneGeometry( blackBallR, blackBallR );
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh( shadowGeo, shadowMat );
  shadowMesh.position.set( 0, 0.01, -roomZ / 2 + 2 * blackBallR );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.scale.set( blackBallR, blackBallR, 1 ); // 乗算
  scene.add( shadowMesh );
}

function setLight() {
  const light = new THREE.PointLight(
    0xffffff, // 光源色
    1.8,      // 強度
    34,       // 範囲
    1,        // 減衰率
  );
  
  light.position.set( 0, roomY / 2, -roomZ / 2 + 3 * blackBallR );
  scene.add( light );
}

function setTimerTexture() {
  var timerCanvas = document.getElementById( "timerCanvas" );
  timerCanvas.width = 512;
  timerCanvas.height = 256;
  var textContext = timerCanvas.getContext( "2d" );
  textContext.font = "90px '7segment'";
  textContext.fillStyle = "rgb(255, 255, 255)";
  textContext.textAlign = "center";
  textContext.textBaseline = "middle";

  timerTexture = new THREE.CanvasTexture( timerCanvas );
}

function getTimerTexture() {
  var timerCanvas = document.getElementById( "timerCanvas" );
  var textContext = timerCanvas.getContext( "2d" );
  textContext.clearRect(0, 0, timerCanvas.width, timerCanvas.height);
  
  textContext.fillText(
    new Date().toLocaleTimeString(),  // text
    timerCanvas.width / 2,            // 横方向のtext開始位置 .textAlign = "center"と合わせて中央表示 
    timerCanvas.height / 2,           // 縦方向のtext終了位置 .textBaseline = "middle"と合わせて中央表示
  );
  timerTexture = new THREE.CanvasTexture( timerCanvas );
  return timerTexture;
}

function createTimer() {
  setTimerTexture();

  // フルフェイスヘルメットの窓のような形を作る
  const phi = Math.PI / 3.4; 
  const theata = Math.PI / 2.3;

  const timerGeo = new THREE.SphereGeometry(
    blackBallR,           // radius: Float
    32,                   // widthSegments: Integer
    32,                   // heightSegments: Integer
    phi,                  // phiStart: Float
    Math.PI - 2 * phi,    // phiLength: Float
    theata,               // thetaStart: Float
    Math.PI - 2 * theata, // thetaLength: Float
  );

  const timerMat = new THREE.MeshBasicMaterial({
    map: getTimerTexture(),
    transparent: true,
    color: 0xffffff,
    side: THREE.DoubleSide,
  });

  timerMesh = new THREE.Mesh( timerGeo, timerMat );
  timerMesh.position.set( 0, blackBallR, -roomZ / 2 + 2 * blackBallR );

  scene.add( timerMesh );
}

function updateTimer() {
  timerMesh.material.map = getTimerTexture();
}

function rendering() {
  requestAnimationFrame( rendering ); // 1フレームごとにループする
  renderer.render( scene, camera );
}
