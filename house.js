import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { LoadingBar } from './LoadingBar.js';
import { SFX } from './libs/SFX.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
class SpeechBubble {
    constructor(scene, msg, size = 1) {
        this.config = { font: 'Calibri', size: 14, padding: 10, colour: '#000', width: 256, height: 256 };
        var planeGeometry = new THREE.PlaneGeometry(size, size);
        var planeMaterial = new THREE.MeshBasicMaterial()
        this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(this.mesh);
        var self = this;
        var loader = new THREE.TextureLoader();
        loader.load(
            `./assets/images/speech.png`,
            function (texture) {
                self.img = texture.image;
                self.mesh.material.map = texture;
                self.mesh.material.transparent = true;
                self.mesh.material.needsUpdate = true;
                if (msg !== undefined) self.update(msg);
            },
            undefined,
            function (err) {
                console.error('An error happened.');
            }
        );
    }
    hide() {
        scene.remove(this.mesh);
    }
    update(msg) {
        if (this.mesh === undefined) return;
        let context = this.context;
        if (this.mesh.userData.context === undefined) {
            var canvas = this.createOffscreenCanvas(this.config.width, this.config.height);
            this.context = canvas.getContext('2d');
            context = this.context;
            context.font = `${this.config.size}pt ${this.config.font}`;
            context.fillStyle = this.config.colour;
            context.textAlign = 'center';
            this.mesh.material.map = new THREE.CanvasTexture(canvas);
        }
        var bg = this.img;
        context.clearRect(0, 0, this.config.width, this.config.height);
        context.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, this.config.width, this.config.height);
        this.wrapText(msg, context);
        this.mesh.material.map.needsUpdate = true;
    }
    createOffscreenCanvas(w, h) {
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        return canvas;
    }
    wrapText(text, context) {
        var words = text.split(' ');
        let line = '';
        var lines = [];
        var maxWidth = this.config.width - 2 * this.config.padding;
        var lineHeight = this.config.size + 8;
        words.forEach(function (word) {
            var testLine = `${line}${word} `;
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth) {
                lines.push(line);
                line = `${word} `;
            } else {
                line = testLine;
            }
        });
        if (line != '') lines.push(line);
        let y = (this.config.height - lines.length * lineHeight) / 2;
        lines.forEach(function (line) {
            context.fillText(line, 128, y);
            y += lineHeight;
        });
    }
    show(pos) {
        if (this.mesh !== undefined && this.player !== undefined) {
            this.mesh.position.set(this.player.object.position.x, this.player.object.position.y + 380, this.player.object.position.z);
            this.mesh.lookAt(pos);
        }
    }
}
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 100);
camera.position.set(3.4806686, 3.32194232, 3.58464016);
camera.near = .015; 
camera.rotation._x = -0.74738062;
camera.rotation._y = 0.618865494;
camera.rotation._z = 0.493271979;
camera.updateProjectionMatrix();
var loadingBar = new LoadingBar();
var renderer = new THREE.WebGLRenderer({ alpha: true, depth: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.setClearColor(0x000000, 0); 
renderer.domElement.style.position = 'fixed';
renderer.domElement.id = 'house';
renderer.domElement.style.zIndex = '-1';
renderer.domElement.style.left = '0';
renderer.domElement.style.top = '0';
document.body.appendChild(renderer.domElement);
var tommyGunLight = new THREE.PointLight(0xffffff, 100, 100); 
tommyGunLight.position.set(0, 0, 0); 
tommyGunLight.visible = false
scene.add(tommyGunLight);
var controls = new OrbitControls(camera, renderer.domElement);
controls.mouseSensitivity = 0.005; 
controls.minDistance = 4; 
controls.maxDistance = 6; 
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 3;
controls.maxAzimuthAngle = Math.PI / 4; 
controls.minAzimuthAngle = 0.6 * Math.PI / 4; 
var gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
var backgroundmusic=document.getElementById("bgAudio");
function createQuestion() {
    var questionContainer = document.createElement('div');
    var question = document.createElement('p');
    var buttonDiv = document.createElement('div'); 
    var yesButton = document.createElement('button');
    var noButton = document.createElement('button');
    questionContainer.style.backgroundColor = "#f2f2f2";
    questionContainer.style.padding = "20px";
    questionContainer.style.borderRadius = "10px";
    questionContainer.style.width = "350px";
    questionContainer.style.position = "fixed";
    questionContainer.style.bottom = "20px";
    questionContainer.style.left = "50%";
    questionContainer.style.transform = "translateX(-50%)";
    questionContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    question.style.fontSize = "16px"; 
    question.style.color = "black";
    buttonDiv.style.display = "flex";
    buttonDiv.style.justifyContent = "space-between";
    yesButton.style.padding = "10px 20px";
    yesButton.style.border = "none";
    yesButton.style.borderRadius = "5px";
    yesButton.style.backgroundColor = "#4CAF50";
    yesButton.style.color = "white";
    yesButton.style.cursor = "pointer";
    noButton.style.padding = "10px 20px";
    noButton.style.border = "none";
    noButton.style.borderRadius = "5px";
    noButton.style.backgroundColor = "#f44336";
    noButton.style.color = "white";
    noButton.style.cursor = "pointer";
    question.textContent = "Should I complete the assignment?";
    yesButton.textContent = "Yes";
    noButton.textContent = "No";
    yesButton.addEventListener('click', function () {
        console.log("Great! Let's get started on that assignment.");
        set_action('Writing');
        loadBook();
        player.object.position.set(-0.02, 0.55, -0.25);
        player.object.rotation.set(0, 2 * Math.PI / 4, 0);
        questionContainer.style.display = "none";
        questionContainer.remove();
        let speechBubble;
        let assignment_doing_time=5000;
        setTimeout(() => {
            set_action('Idle');
            backgroundmusic.pause();
            speechBubble = new SpeechBubble(scene, "Yess!!! It is morning, and I have finished my assignment. I am going to leave (Hint:'Esc') the house, go to the temple, and get some exercise.", 2);
            if(character==='girl'){
                sfx.play('yes_girl')
            }
            else{
                sfx.play('yes')
            }
            speechBubble.mesh.position.set(0.2, 3, 1);
            speechBubble.mesh.rotation.set(0, Math.PI / 4, 0);
            player.object.position.set(0.3, 0, 1.5);
            player.object.rotation.set(0, 3 * Math.PI / 4, 0);
        }, assignment_doing_time)
        setTimeout(()=>{
            backgroundmusic.play();
            addEscape();
            speechBubble.hide();
        },10000+assignment_doing_time)
    });
    noButton.addEventListener('click', function () {
        backgroundmusic.pause();
        let speechBubble = new SpeechBubble(scene, "Damn!!! Mom complained to the teacher last night. I must leave (Hint:'Esc') the house now and go to school; otherwise, the teacher will scold me more.", 2);
        if(character==='girl'){
            sfx.play('no_girl')
        }
        else{
            sfx.play('no')
        }
        speechBubble.mesh.position.set(0.2, 3, 1);
        speechBubble.mesh.rotation.set(0, Math.PI / 4, 0);
        player.object.position.set(0.3, 0, 1.5);
        player.object.rotation.set(0, 3 * Math.PI / 4, 0);
        questionContainer.style.display = "none";
        setTimeout(()=>{
            backgroundmusic.play();
            addEscape();
            addMissionFail();
            speechBubble.hide();
        },9000)
    });
    questionContainer.appendChild(question);
    buttonDiv.appendChild(yesButton);
    buttonDiv.appendChild(noButton);
    questionContainer.appendChild(buttonDiv);
    document.body.appendChild(questionContainer);
}
createQuestion();
var ambientLight = new THREE.AmbientLight(0xffffff, 2); 
scene.add(ambientLight);
var loader = new GLTFLoader();
loader.load(
    './assets/plane/house.glb',
    function (gltf) {
        var abandonedBuilding = gltf.scene;
        abandonedBuilding.position.set(-20, 0, 10);
        abandonedBuilding.scale.set(0.06 * gltf.scene.scale.x, 0.06 * gltf.scene.scale.y, 0.06 * gltf.scene.scale.z)
        scene.add(abandonedBuilding);
        loadSFX();
        loadingBar.visible = false;
    },
    function (xhr) {
        loadingBar.progress = (xhr.loaded / xhr.total);
    },
    function (error) {
        console.error('An error occurred:', error);
    }
);
var sfx;
function loadSFX() {
    sfx = new SFX(camera, './assets/sound/');
    sfx.load('yes');
    sfx.load('no');
    sfx.load('yes_girl');
    sfx.load('no_girl');
}
function addEscape() {
    var element = document.createElement('div');
    element.id = 'escape';
    element.style.width = '0px';
    element.style.height = '0px';
    document.body.appendChild(element);
}
function addMissionFail(){
    var element = document.createElement('div');
    element.id = 'fail';
    element.style.width = '0px';
    element.style.height = '0px';
    document.body.appendChild(element);
}
var fbxloader = new FBXLoader();
function set_action(name) {
    if (player !== undefined) {
        var action1 = player.mixer.clipAction(animations[name]);
        action1.time = 0;
        player.mixer.stopAllAction();
        player.action = name;
        player.actionTime = Date.now();
        player.actionName = name;
        action1.play();
    }
}
var character = "boy";
if(document.getElementById("girly")){
    character = "girl";
}
let player = {};
let animations = {};
let path = `./assets/fbx/people/`
if (character == "boy") {
    path += "school_boy/boy.fbx"
}
else if (character == "girl") {
    path += "school_girl/girl.fbx"
}
fbxloader.load(path, function (object) {
    object.mixer = new THREE.AnimationMixer(object);
    player.mixer = object.mixer;
    player.root = object.mixer.getRoot();
    object.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
        }
    });
    player.object = new THREE.Object3D();
    scene.add(player.object);
    player.object.add(object);
    animations.Idle = object.animations[0];
    player.object.position.set(-1, 0, 0.5);
    player.object.rotation.set(0, 3 * Math.PI / 4, 0);
    player.object.scale.set(0.015, 0.015, 0.015);
    set_action('Idle')
});
path = `./assets/fbx/people/school_boy/Writing.fbx`
fbxloader.load(path, function (object) {
    animations.Writing = object.animations[0];
})
function loadBook() {
    var dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('node_modules/three/examples/jsm/libs/draco/').preload();
    loader.setDRACOLoader(dracoLoader);
    loader.load(
        './assets/plane/openbook.glb',
        gltf => {
            gltf.scene.position.set(1.5, 2, -0.25)
            gltf.scene.rotation.set(0, 0, 0)
            gltf.scene.scale.set(3 * gltf.scene.scale.x, 3 * gltf.scene.scale.y, 3 * gltf.scene.scale.z)
            scene.add(gltf.scene);
        },
        xhr => {
            console.log(xhr.loaded / xhr.total)
        },
        err => {
            console.error(err);
        }
    );
}
let clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    var dt = clock.getDelta();
    if (player.mixer !== undefined) player.mixer.update(dt);
    renderer.render(scene, camera);
}
animate();