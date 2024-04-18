import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { LoadingBar } from './LoadingBar.js';
import { SFX } from './libs/SFX.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
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
camera.position.set(2.5, 2, 2.5);
camera.near = .015; // Set a smaller value, like 0.1
camera.updateProjectionMatrix();
// Keyboard controls
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
// Setup Gun Object
var tommyGun;
var loadingBar = new LoadingBar();
// 3D Abandoned Building MOdel
var abandonedBuilding;
// Doctor1
var doc1;
// Doctor2
var doc2;
var colliders = [];

// Create the renderer
var renderer = new THREE.WebGLRenderer({ alpha: true, depth: true });
// Configure renderer settings
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.setClearColor(0x000000, 0); // Set background color to black
renderer.domElement.style.position = 'fixed';
renderer.domElement.id = 'hospital';
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
controls.minDistance = 0; // Minimum zoom distance
controls.maxDistance = 4; // Maximum zoom distance
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 3;
controls.maxAzimuthAngle = Math.PI / 4; // Maximum horizontal rotation (radians)
controls.minAzimuthAngle = Math.PI / 5; // Minimum horizontal rotation (radians)

// Create a grid
var gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);
// Set up pointer lock controls
// var blocker = document.getElementById('blocker');
// var instructions = document.getElementById('instructions');
// var playButton = document.getElementById('playButton');
// playButton.addEventListener('click', function () {
//     // controls.lock();
//     instructions.style.display = 'none';
//     blocker.style.display = 'none';
// });
// controls.addEventListener('lock', function () {
//     instructions.style.display = 'none';
//     blocker.style.display = 'none';
// });
// controls.addEventListener('unlock', function () {
//     blocker.style.display = 'block';
//     instructions.style.display = '';
// });
// Resize renderer when window size changes
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
    './assets/plane/hospital.glb',
    function (gltf) {
        abandonedBuilding = gltf.scene;
        abandonedBuilding.position.y = 0.009;
        scene.add(abandonedBuilding);
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                colliders.push(child);
                child.castShadow = true;
                child.receiveShadow = true;

            }
        });
        loadSFX();
        loadingBar.visible = false;
        // After the model has loaded, update the message in the playButton div
        // playButton.innerText = "Click To Explore";
    },
    // Add a function to handle loading progress or errors (optional)
    function (xhr) {
        loadingBar.progress = (xhr.loaded / xhr.total);
    },
    function (error) {
        console.error('An error occurred:', error);
    }
);
// const dracoLoader = new DRACOLoader();
// loader.setDRACOLoader( dracoLoader );
var doc1mixer;
var hidemsgdoc1 = true;
var hidemsgdoc2 = true;
var doc1visited = false;
var doc2visited = false;
var doc2playing = false;
var speechBubble_doc1;
var speechBubble_doc2;
var escape = false;
var sfx;
function loadSFX() {
    sfx = new SFX(camera, './assets/sound/');
    sfx.load('doc1');
    sfx.load('doc2');
}
loader.load(
    './assets/plane/doc1.glb',
    function (gltf) {
        doc1 = gltf.scene;
        doc1.position.set(1, 1.5, -1)
        doc1.scale.set(0.5, 0.5, 0.5)
        scene.add(doc1);
        doc1mixer = new THREE.AnimationMixer(gltf.scene);
        var idleanimation = gltf.animations[0];
        console.log(gltf.animations[0])
        var doc1action = doc1mixer.clipAction(idleanimation);
        doc1action.time = 0;
        doc1mixer.stopAllAction();
        doc1action.play();
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                colliders.push(child);
                child.castShadow = true;
                child.receiveShadow = true;

            }
        });


    },
    // Add a function to handle loading progress or errors (optional)
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error occurred:', error);
    }
);

function handleAudioEnd() {
    console.log('done');
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
        if (name_obj.startsWith("Object_")) {

            if (hidemsgdoc1 && !doc2playing) {
                backgroundmusic.pause();
                speechBubble_doc1 = new SpeechBubble(scene, "Hey kid! Today I am busy. Can you please deliver these medicines and report to Mr. Bob? If you don't know his address, you can ask Mr. Alex here.", 1);
                speechBubble_doc1.mesh.position.set(1, 2, -1);
                sfx.play('doc1');
                doc1visited = false;
                removeEscape();
                setTimeout(function () {
                    speechBubble_doc1.hide();
                    doc1visited = true;
                    backgroundmusic.play();
                    if (doc2visited) {
                        addEscape();
                    }
                }, 10000);
            }
        }
        if (name_obj == "Masks" || name_obj == "Hats" || name_obj == "Tops" || name_obj == "Bottoms" || name_obj == "Body") {
            if (doc1visited) {
                if (hidemsgdoc2) {
                    backgroundmusic.pause();
                    speechBubble_doc2 = new SpeechBubble(scene, "Actually, Mr. Bob lives in the red-colored house nearest to the city center. By the way, if you are having difficulty getting out, press the 'Esc' key.", 1);
                    speechBubble_doc2.mesh.position.set(-1, 2, 1);
                    speechBubble_doc2.mesh.rotation.set(0, Math.PI / 2, 0);
                    sfx.play('doc2');
                    doc2playing = true;
                    removeEscape()
                    setTimeout(function () {
                        backgroundmusic.play();
                        speechBubble_doc2.hide();
                        doc2playing = false;
                        doc2visited = true;
                        addEscape()
                    }, 10000);
                }
            }

        }
    }
}
const fbxloader = new FBXLoader();
let player = {};
let animations = {};
fbxloader.load('./assets/plane/doc2.fbx', function (object) {

    object.mixer = new THREE.AnimationMixer(object);
    // //console.log(object.mixer);
    player.mixer = object.mixer;
    player.root = object.mixer.getRoot();


    object.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
        }
    });
    object.traverse(function (child) {
        if (child.isMesh) {
            colliders.push(child);
            child.castShadow = true;
            child.receiveShadow = true;

        }
    });

    // const tLoader = new THREE.TextureLoader();
    // tLoader.load(`${game.assetsPath}images/SimplePeople_FireFighter_Brown.png`, function(texture){
    // 	object.traverse( function ( child ) {
    // 		if ( child.isMesh ){
    // 			child.material.map = texture;
    // 		}
    // 	} );
    // });

    player.object = new THREE.Object3D();
    scene.add(player.object);
    player.object.add(object);
    animations.Idle = object.animations[0];
    console.log(999);
    console.log(object.animations[0]);
    console.log(999);
    player.object.position.set(-1, 0, 1);
    player.object.rotation.set(0, Math.PI / 2, 0);
    player.object.scale.set(0.009, 0.009, 0.009);
    set_action('Idle')
    //game.loadNextAnim(loader);
    // game.animate();
});
function set_action(name) {
    const action = player.mixer.clipAction(animations[name]);
    action.time = 0;
    player.mixer.stopAllAction();
    player.action = name;
    player.actionTime = Date.now();
    player.actionName = name;
    //console.log("hel")
    //action.fadeIn(0.5);	
    action.play();
}
var character = "boy";
let char_player = {};
let char_animations = {};
let path = `./assets/fbx/people/`
if (character == "boy") {
    path += "school_boy/boy.fbx"
}
else if (character == "girl") {
    path += "school_girl/girl.fbx"
}
fbxloader.load(path, function (object) {

    object.mixer = new THREE.AnimationMixer(object);
    // //console.log(object.mixer);
    player.mixer = object.mixer;
    player.root = object.mixer.getRoot();



    object.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
        }
    });

    // const tLoader = new THREE.TextureLoader();
    // tLoader.load(`${game.assetsPath}images/SimplePeople_FireFighter_Brown.png`, function(texture){
    // 	object.traverse( function ( child ) {
    // 		if ( child.isMesh ){
    // 			child.material.map = texture;
    // 		}
    // 	} );
    // });

    player.object = new THREE.Object3D();
    scene.add(player.object);
    player.object.add(object);
    animations.Idle = object.animations[0];

    console.log(object.animations[0]);

    player.object.position.set(1, 0, 2);
    player.object.rotation.set(0, -3 * Math.PI / 4, 0);
    player.object.scale.set(0.007, 0.007, 0.007);
    set_action('Idle')
    //loadNextAnim(fbxloader);
    // game.animate();
});


let clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    if (player.mixer !== undefined) player.mixer.update(dt);
    if (doc1mixer !== undefined) doc1mixer.update(dt);
    //ramp up player movement speed and direction

    renderer.render(scene, camera);
}
animate();
// Add event listeners for the mouse down and mouse up events


