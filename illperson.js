import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { LoadingBar } from './LoadingBar.js';
import { SFX } from './libs/SFX.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
class SpeechBubble {
    constructor(scene, msg, size = 1) {
        this.config = { font: 'Calibri', size: 14, padding: 10, colour: '#000', width: 256, height: 256 };

        const planeGeometry = new THREE.PlaneGeometry(size, size);
        const planeMaterial = new THREE.MeshBasicMaterial()
        this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(this.mesh);

        const self = this;
        const loader = new THREE.TextureLoader();
        loader.load(
            // resource URL
            `./assets/images/speech.png`,

            // onLoad callback
            function (texture) {
                // in this example we create the material when the texture is loaded
                self.img = texture.image;
                self.mesh.material.map = texture;
                self.mesh.material.transparent = true;
                self.mesh.material.needsUpdate = true;
                if (msg !== undefined) self.update(msg);
            },

            // onProgress callback currently not supported
            undefined,

            // onError callback
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
            const canvas = this.createOffscreenCanvas(this.config.width, this.config.height);
            this.context = canvas.getContext('2d');
            context = this.context;
            context.font = `${this.config.size}pt ${this.config.font}`;
            context.fillStyle = this.config.colour;
            context.textAlign = 'center';
            this.mesh.material.map = new THREE.CanvasTexture(canvas);
        }

        const bg = this.img;
        context.clearRect(0, 0, this.config.width, this.config.height);
        context.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, this.config.width, this.config.height);
        this.wrapText(msg, context);

        this.mesh.material.map.needsUpdate = true;
    }

    createOffscreenCanvas(w, h) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        return canvas;
    }

    wrapText(text, context) {
        const words = text.split(' ');
        let line = '';
        const lines = [];
        const maxWidth = this.config.width - 2 * this.config.padding;
        const lineHeight = this.config.size + 8;

        words.forEach(function (word) {
            const testLine = `${line}${word} `;
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
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
const backgroundmusic=document.getElementById("bgAudio");
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 100);
camera.position.set(-2.4, 5.1, -4.5);
camera.near = .015; // Set a smaller value, like 0.1
camera.updateProjectionMatrix();
var loadingBar = new LoadingBar();

// Create the renderer
var renderer = new THREE.WebGLRenderer({ alpha: true, depth: true });
// Configure renderer settings
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.setClearColor(0x000000, 0); // Set background color to black
renderer.domElement.style.position = 'fixed';
renderer.domElement.id = 'illperson';
renderer.domElement.style.zIndex = '-1';
renderer.domElement.style.left = '0';
renderer.domElement.style.top = '0';
document.body.appendChild(renderer.domElement);
//Create ray caster instance
var raycaster = new THREE.Raycaster();
//Create mouse instance
var mouse = new THREE.Vector2();
///flashing light // Create a point light
const tommyGunLight = new THREE.PointLight(0xffffff, 100, 100); // Adjust the light color and intensity as needed
tommyGunLight.position.set(0, 0, 0); // Set the light position
tommyGunLight.visible = false
// Add the light to the scene initially
scene.add(tommyGunLight);
// Add PointerLockControls
var controls = new OrbitControls(camera, renderer.domElement);
controls.mouseSensitivity = 0.005; // Adjust the sensitivity as needed
controls.minDistance = 4; // Minimum zoom distance
controls.maxDistance = 7; // Maximum zoom distance
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 3;
controls.maxAzimuthAngle = 5*Math.PI/4; // Maximum horizontal rotation (radians)
controls.minAzimuthAngle = Math.PI ; // Minimum horizontal rotation (radians)

// Create a grid
var gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
// scene.add(controls.getObject());

// Create an ambient light with brightness
var ambientLight = new THREE.AmbientLight(0xffffff, 2); // Adjust the color as needed
scene.add(ambientLight);

// Load GLTF model
var loader = new GLTFLoader();


// Load GLTF model
loader.load(
    './assets/plane/bedroom.glb',
    function (gltf) {
        var abandonedBuilding = gltf.scene;
        abandonedBuilding.position.y = 0.009;
        scene.add(abandonedBuilding);
        loadSFX();
        loadingBar.visible = false;

    },
    function (xhr) {
        loadingBar.progress = (xhr.loaded/xhr.total);
    },
    function (error) {
        console.error('An error occurred:', error);
    }
);

var doc1mixer;
var hidemsgillperson = true;
var speechBubble_ill_person;
var escape=false;
var sfx;
function loadSFX() {
    sfx = new SFX(camera, './assets/sound/');
    sfx.load('ill');
}
// Handle Mouse Click Event
document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('touchstart', onMouseDown, false);
function addEscape() {
    var element = document.createElement('div');
    element.id = 'escape';
    element.style.width = '0px';
    element.style.height = '0px';
    document.body.appendChild(element);
}
function removeEscape(){
    var elm=document.getElementById('escape');
    if(elm){
        elm.remove();
    }
}
function onMouseDown(event) {
    // Calculate normalized mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray from the camera
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        // You've clicked on a 3D object!
        console.log('Clicked on a 3D model:', intersects[0].object.name);
        var name_obj = intersects[0].object.name;
        if (name_obj=="Body"||name_obj=="Tops"||name_obj=="Bottoms"||name_obj=="Shoes") {

            if (hidemsgillperson) {
                backgroundmusic.pause();
                speechBubble_ill_person = new SpeechBubble(scene, "Thank you very much for bringing medicines, as you can see i was having very tough day till,hope that these medicine will improve my health", 2.6);
                speechBubble_ill_person.mesh.position.set(.6, 2.5, 5.5);
                speechBubble_ill_person.mesh.rotation.set(0, Math.PI, 0);
                sfx.play('ill');
                removeEscape();
                setTimeout(function() {
                    backgroundmusic.play();
                    speechBubble_ill_person.hide();
                        addEscape();
                }, 9000);
            }
        }
    }
}
const fbxloader = new FBXLoader();
let illplayer = {};
let illanimations = {};
fbxloader.load('./assets/plane/illperson.fbx', function (object) {

    object.mixer = new THREE.AnimationMixer(object);
    // //console.log(object.mixer);
    illplayer.mixer = object.mixer;
    illplayer.root = object.mixer.getRoot();
    illplayer.object = new THREE.Object3D();
    scene.add(illplayer.object);
    illplayer.object.add(object);
    illanimations.Idle = object.animations[0];
    console.log(999);
    console.log(object.animations[0]);
    console.log(999);
    illplayer.object.position.set(.6, -0.2, 4);
    illplayer.object.rotation.set(0, Math.PI, 0);
    illplayer.object.scale.set(0.008, 0.008, 0.008);
    set_action1('Idle')
});
function set_action(name) {
    if(player!==undefined){
    const action1 = player.mixer.clipAction(animations[name]);
    action1.time = 0;
    player.mixer.stopAllAction();
    player.action = name;
    player.actionTime = Date.now();
    player.actionName = name;
    action1.play();
    }
}
function set_action1(name){
    if(illplayer!==undefined){
        const action = illplayer.mixer.clipAction(illanimations[name]);
        action.time = 0;
        illplayer.mixer.stopAllAction();
        illplayer.action = name;
        illplayer.actionTime = Date.now();
        illplayer.actionName = name;	
        action.play();
        }
}
var character = "boy";
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

    console.log(object.animations[0]);

    player.object.position.set(-2, 0, -2.5);
    player.object.rotation.set(0, 1 * Math.PI / 4, 0);
    player.object.scale.set(0.015, 0.015, 0.015);
    set_action('Idle')
});


let clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    if (illplayer.mixer !== undefined) illplayer.mixer.update(dt);
    if (player.mixer !== undefined) player.mixer.update(dt);
    if (doc1mixer !== undefined) doc1mixer.update(dt);
    renderer.render(scene, camera);
}
animate();


