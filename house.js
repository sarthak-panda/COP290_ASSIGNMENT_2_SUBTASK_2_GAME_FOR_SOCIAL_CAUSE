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

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 100);
camera.position.set(3.4806686, 3.32194232, 3.58464016);
camera.near = .015; // Set a smaller value, like 0.1
camera.rotation._x = -0.74738062;
camera.rotation._y = 0.618865494;
camera.rotation._z = 0.493271979;
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
renderer.domElement.id = 'house';
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
controls.maxDistance = 6; // Maximum zoom distance
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 3;
controls.maxAzimuthAngle = Math.PI / 4; // Maximum horizontal rotation (radians)
controls.minAzimuthAngle = 0.6 * Math.PI / 4; // Minimum horizontal rotation (radians)

// Create a grid
var gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);


window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
const backgroundmusic=document.getElementById("bgAudio");
function createQuestion() {
    const questionContainer = document.createElement('div');
    const question = document.createElement('p');
    const buttonDiv = document.createElement('div'); // Create a div to contain buttons
    const yesButton = document.createElement('button');
    const noButton = document.createElement('button');

    // Add inline styles for styling
    questionContainer.style.backgroundColor = "#f2f2f2";
    questionContainer.style.padding = "20px";
    questionContainer.style.borderRadius = "10px";
    questionContainer.style.width = "350px";
    questionContainer.style.position = "fixed";
    questionContainer.style.bottom = "20px";
    questionContainer.style.left = "50%";
    questionContainer.style.transform = "translateX(-50%)";
    questionContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";

    question.style.fontSize = "16px"; // Adjust the font size here
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

    // Add event listeners to buttons
    yesButton.addEventListener('click', function () {
        console.log("Great! Let's get started on that assignment.");
        // Hide question container
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
            sfx.play('yes')
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
        sfx.play('no')
        speechBubble.mesh.position.set(0.2, 3, 1);
        speechBubble.mesh.rotation.set(0, Math.PI / 4, 0);
        player.object.position.set(0.3, 0, 1.5);
        player.object.rotation.set(0, 3 * Math.PI / 4, 0);
        // Hide question container
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




// scene.add(controls.getObject());

// Create an ambient light with brightness
var ambientLight = new THREE.AmbientLight(0xffffff, 2); // Adjust the color as needed
scene.add(ambientLight);

// Load GLTF model
var loader = new GLTFLoader();


// Load GLTF model
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
}
// Handle Mouse Click Event
// document.addEventListener('mousedown', onMouseDown, false);
// document.addEventListener('touchstart', onMouseDown, false);
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
// function removeEscape() {
//     var elm = document.getElementById('escape');
//     if (elm) {
//         elm.remove();
//     }
// }
// function onMouseDown(event) {
//     // Calculate normalized mouse coordinates

// }
const fbxloader = new FBXLoader();


function set_action(name) {
    if (player !== undefined) {
        const action1 = player.mixer.clipAction(animations[name]);
        action1.time = 0;
        player.mixer.stopAllAction();
        player.action = name;
        player.actionTime = Date.now();
        player.actionName = name;
        action1.play();
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

    //console.log(object.animations[0]);

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
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('node_modules/three/examples/jsm/libs/draco/').preload();
    loader.setDRACOLoader(dracoLoader);
    loader.load(
        // resource URL
        './assets/plane/openbook.glb',
        // called when the resource is loaded
        gltf => {
            //console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
            //this.school_mission_started=true;

            gltf.scene.position.set(1.5, 2, -0.25)
            gltf.scene.rotation.set(0, 0, 0)
            gltf.scene.scale.set(3 * gltf.scene.scale.x, 3 * gltf.scene.scale.y, 3 * gltf.scene.scale.z)
            scene.add(gltf.scene);

        },
        // called while loading is progressing
        xhr => {
            console.log(xhr.loaded / xhr.total)

        },
        // called when loading has errors
        err => {

            console.error(err);

        }
    );
}
let clock = new THREE.Clock();
function animate() {
    //console.log(camera)
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    if (player.mixer !== undefined) player.mixer.update(dt);
    renderer.render(scene, camera);
}
animate();
