import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { LoadingBar } from './LoadingBar.js';
import { SFX } from './libs/SFX.js'
import { OrbitControls } from 'three/examples/jsm/Addons.js';
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
var backgroundmusic = document.getElementById("bgAudio");
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 100);
camera.position.set(2.5, 2, 2.5);
camera.near = .015;
camera.updateProjectionMatrix();
var loadingBar = new LoadingBar();
var abandonedBuilding;
var doc1;
var colliders = [];
var renderer = new THREE.WebGLRenderer({ alpha: true, depth: true });
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
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var tommyGunLight = new THREE.PointLight(0xffffff, 100, 100);
tommyGunLight.position.set(0, 0, 0);
tommyGunLight.visible = false
scene.add(tommyGunLight);
var controls = new OrbitControls(camera, renderer.domElement);
controls.mouseSensitivity = 0.005;
controls.minDistance = 0;
controls.maxDistance = 4;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 3;
controls.maxAzimuthAngle = Math.PI / 4;
controls.minAzimuthAngle = Math.PI / 5;
var gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
var ambientLight = new THREE.AmbientLight(0xffffff, 2); // Adjust the color as needed
scene.add(ambientLight);
var loader = new GLTFLoader();
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
    },
    function (xhr) {
        loadingBar.progress = (xhr.loaded / xhr.total);
    },
    function (error) {
        console.error('An error occurred:', error);
    }
);
var doc1mixer;
var hidemsgdoc1 = true;
var hidemsgdoc2 = true;
var doc1visited = false;
var doc2visited = false;
var doc2playing = false;
var speechBubble_doc1;
var speechBubble_doc2;
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
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error occurred:', error);
    }
);
document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('touchstart', onMouseDown, false);
function addEscape() {
    var element = document.createElement('div');
    element.id = 'escape';
    element.style.width = '0px';
    element.style.height = '0px';
    document.body.appendChild(element);
    document.removeEventListener('mousedown', onMouseDown, false);
    document.removeEventListener('touchstart', onMouseDown, false);
}
function removeEscape() {
    var elm = document.getElementById('escape');
    if (elm) {
        elm.remove();
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('touchstart', onMouseDown, false);
    }
}
function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
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
var fbxloader = new FBXLoader();
let player = {};
let animations = {};
fbxloader.load('./assets/plane/doc2.fbx', function (object) {
    object.mixer = new THREE.AnimationMixer(object);
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
});
function set_action(name) {
    var action = player.mixer.clipAction(animations[name]);
    action.time = 0;
    player.mixer.stopAllAction();
    player.action = name;
    player.actionTime = Date.now();
    player.actionName = name;
    action.play();
}
var character = "boy";
console.log(document.getElementById("girl"))
if(document.getElementById('girly')){
    character = "girl";
}
console.log(character)
let path = `./assets/fbx/people/`
if (character === "boy") {
    path += "school_boy/boy.fbx"
}
else if (character === "girl") {
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
    player.object.position.set(1, 0, 2);
    player.object.rotation.set(0, -3 * Math.PI / 4, 0);
    player.object.scale.set(0.007, 0.007, 0.007);
    set_action('Idle')
});
let clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    var dt = clock.getDelta();
    if (player.mixer !== undefined) player.mixer.update(dt);
    if (doc1mixer !== undefined) doc1mixer.update(dt);
    renderer.render(scene, camera);
}
animate();