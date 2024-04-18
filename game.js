import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { LoadingBar } from './LoadingBar.js';
import { Fireworks } from './Fireworks.js';
import { SFX } from './libs/SFX.js';
class SpeechBubble {
	constructor(scene, msg, size = 1) {
		this.config = { font: 'Calibri', size: 14, padding: 10, colour: '#000', width: 256, height: 256 };
		this.scene = scene;
		const planeGeometry = new THREE.PlaneGeometry(size, size);
		const planeMaterial = new THREE.MeshBasicMaterial()
		this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
		this.scene.add(this.mesh);
		
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
		this.scene.remove(this.mesh);
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
class Game {
	constructor(character) {
		if (!Detector.webgl) Detector.addGetWebGLMessage();
		this.character = character;
		this.container;
		this.player = {};
		this.oldman = {};
		this.animations = {};
		this.oldmananimations = {};
		this.stats;
		this.camera;
		this.scene;
		this.renderer;
		this.count = 0;
		this.colliders = [];
		this.hospital = [];
		this.school = [];
		this.home = [];
		this.temple = [];
		// this.playground = [];
		this.medicine_delivery_house = [];
		this.KeyDown = new Set();
		this.container = document.createElement('div');
		this.container.id = 'game';
		this.container.style.height = '100%';
		document.body.appendChild(this.container);
		this.hospital_mission_started = false;
		this.hospital_mission_ended = false;
		this.hospital_visited = false;
		this.school_visited = false;
		this.school_mission_started = false;
		this.school_mission_ended = false;
		this.keyPressStartTime = null;
		//this.keyPressTimeout = null;
		this.exercising_mission_ended = false;
		this.exercising_start = null;
		this.temple_mission_completed = false;
		this.old_man_mission_started = false;
		this.old_man_mission_ended = false;
		this.conversation_start = null;
		this.oldmansfx = {};
		const game = this;
		this.anims = ['CarryingTurnRight', 'CarryingTurnLeft', 'CarryingRunning', 'CarryingWalking', 'CarryingIdle', 'Jump Push Up', 'Plank', 'Push Up', 'Writing', 'Holding Idle', 'Holding Turn Right', 'Holding Turn Left', 'Holding Walk', 'Walking', 'Bow', 'Praying End', 'Praying InBetween', 'Praying Start', 'Running', 'Turning Left', 'Turning Right', 'Walking Backwards Left', 'Walking Backwards Right'];
		this.fireworks = new Fireworks();
		this.assetsPath = './assets/';
		this.backgroundmusic=document.getElementById("bgAudio");
		this.clock = new THREE.Clock();

		this.init();


		window.onError = function (error) {
			console.error(JSON.stringify(error));
		}
	}
	async init() {
		this.mouse = new THREE.Vector2();
		this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
		this.camera.position.set(112, 100, 600);

		this.scene = new THREE.Scene();
		//this.scene.background = new THREE.Color( 0xa0a0a0 );
		//this.scene.fog = new THREE.Fog( 0xa0a0a0, 1000, 5000 );

		let light = new THREE.HemisphereLight(0xffffff, 0x444444);
		light.position.set(0, 500, 50);
		this.scene.add(light);

		const shadowSize = 200;
		light = new THREE.DirectionalLight(0xffffff);
		light.position.set(0, 500, 100);
		light.castShadow = true;
		light.shadow.camera.top = shadowSize;
		light.shadow.camera.bottom = -shadowSize;
		light.shadow.camera.left = -shadowSize;
		light.shadow.camera.right = shadowSize;
		this.scene.add(light);
		this.sun = light;

		// ground
		this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), new THREE.MeshPhongMaterial({ color: 0xd14600, depthWrite: false }));
		this.mesh.rotation.x = - Math.PI / 2;
		this.mesh.receiveShadow = true;
		this.scene.add(this.mesh);

		var grid = new THREE.GridHelper(5000, 40, 0x000000, 0x000000);
		grid.material.opacity = 0.2;
		grid.material.transparent = true;
		this.scene.add(grid);

		// model
		const loader = new FBXLoader();
		const game = this;
		let path = `${this.assetsPath}fbx/people/`
		if (this.character == "boy") {
			path += "school_boy/boy.fbx"
		}
		else if (this.character == "girl") {
			path += "school_girl/girl.fbx"
		}
		loader.load(path, function (object) {

			object.mixer = new THREE.AnimationMixer(object);
			// //console.log(object.mixer);
			game.player.mixer = object.mixer;
			game.player.root = object.mixer.getRoot();

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

			game.player.object = new THREE.Object3D();
			game.scene.add(game.player.object);
			game.player.object.add(object);
			game.animations.Idle = object.animations[0];
			game.player.object.position.set(0, 50, 600);//default intial location:0, 50, 600
			game.player.object.scale.set(0.8, 0.8, 0.8);
			game.loadNextAnim(loader);
			// game.animate();
		});


		loader.load(`${this.assetsPath}fbx/people/old_man/Old Man.fbx`, function (object) {

			object.mixer = new THREE.AnimationMixer(object);
			// //console.log(object.mixer);
			game.oldman.mixer = object.mixer;
			game.oldman.root = object.mixer.getRoot();
			object.traverse(function (child) {
				if (child.isMesh) {
					game.colliders.push(child);
					child.castShadow = true;
					child.receiveShadow = true;

				}
			});

			game.oldman.object = new THREE.Object3D();

			game.oldman.object.add(object);
			game.scene.add(game.oldman.object);
			game.oldmananimations.Idle = object.animations[0];

			game.oldman.object.position.set(-850, 0, 1250);
			game.oldman.object.rotation.set(0, Math.PI / 2, 0);
			game.oldman.object.scale.set(100, 100, 100);
			game.set_old_man_action('Idle')
			//game.loadNextAnim(loader);
			// game.animate();
		});
		loader.load(`${this.assetsPath}fbx/people/old_man/Late.fbx`, function (object) {
			game.oldmananimations.Warning = object.animations[0];
		});
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		// this.renderer.shadowMap.enabled = true;
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		this.renderer.physicallyCorrectLights = true;
		this.container.appendChild(this.renderer.domElement);
		this.loadingBar = new LoadingBar();
		this.setEnvironment();
		this.loadGLTF();
		this.loadCar();
		this.loadPlayground();
		// this.loadGrass();
		// this.loadMedicinebox();//govind
		//this.loadBook();
		// this.loadCar();
		window.addEventListener('resize', function () { game.onWindowResize(); }, false);
		document.addEventListener('keydown', this.handleKeyDown)
		document.addEventListener('keyup', this.handleKeyUp)
		document.addEventListener('mousedown', (event) => {
			this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

			// Update the picking ray from the camera
			var raycaster = new THREE.Raycaster();

			raycaster.setFromCamera(this.mouse, this.camera);

			// Check for intersections
			const intersects = raycaster.intersectObjects(this.scene.children, true);

			if (intersects.length > 0) {
				// You've clicked on a 3D object!
				console.log('Clicked on a 3D model:', intersects[0].object.name);

			}
		}, false);
		document.addEventListener('touchstart', (event) => {
			this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

			// Update the picking ray from the camera
			var raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(this.mouse, this.camera);

			// Check for intersections
			const intersects = raycaster.intersectObjects(this.scene.children, true);

			if (intersects.length > 0) {
				// You've clicked on a 3D object!
				console.log('Clicked on a 3D model:', intersects[0].object.name);

			}
		}, false);
	}
	set_old_man_action = (name) => {
		const action = this.oldman.mixer.clipAction(this.oldmananimations[name]);
		action.time = 0;
		this.oldman.mixer.stopAllAction();
		this.oldman.action = name;
		this.oldman.actionTime = Date.now();
		this.oldman.actionName = name;
		//console.log("hel")
		// action.fadeIn(0.5);	
		action.play();
	}
	// checkContinuousKeyPress() {
	// console.log("tffgfyh")
	// console.log(this.keyPressStartTime)
	// 	if (this.keyPressStartTime) {
	// 		const duration = Date.now() - this.keyPressStartTime;
	// 		if (duration >= 5000) {
	// 			console.log("Key 'p' was pressed continuously for 5 seconds.");
	// 		}
	// 		this.keyPressStartTime = null;
	// 	}
	// }
	// checkContinuousKeyPress = () => {
	// 	console.log("kkkkkkkkkkkkkkkkkkkkk")
	// 	if (this.keyPressStartTime) {
	// 		const duration = Date.now() - this.keyPressStartTime;
	// 		if (duration >= 5000) {
	// 			// if ((this.player.object.position.y <= 75 && this.player.object.position.y >= 71) && (this.player.object.position.x <= -10000 && this.player.object.position.x >= -11000) && (this.player.object.position.z <= 8900 && this.player.object.position.z >= 6500)) {
	// 			
	// 			// }
	// 		}
	// 		this.keyPressStartTime = null;
	// 	}
	// }
	helperHandler = (filename) => {
		var esc_elm = document.getElementById('escape')
		if (esc_elm) {
			esc_elm.remove();
			// Your logic here
			var scriptElement = document.querySelector(`script[src="${filename}.js"]`);
			if (scriptElement) {
				scriptElement.remove();
			}
			let game = document.getElementById('game');
			game.style.display = 'block';
			// document.getElementById('joystick_circle').style.display = 'block';
			// document.getElementById('joystick_thumb').style.display = 'block';
			var element = document.getElementById(filename)
			if (element) {
				element.remove();
			}
			document.addEventListener('keydown', this.handleKeyDown)
			document.addEventListener('keyup', this.handleKeyUp)

		}
	}
	handleEsckeyDown = (e) => {
		if (e.key === "Escape") {
			var game_elm = document.getElementById('game');
			if (game_elm.style.display == 'none') {
				var hosp_elm = document.getElementById('hospital');
				if (hosp_elm != undefined && hosp_elm.style.display == 'block') {
					this.helperHandler('hospital')
				}
				var ill_elm = document.getElementById('illperson');
				if (ill_elm != undefined && ill_elm.style.display == 'block') {
					this.helperHandler('illperson')
					this.hospital_mission_ended = true;
					this.scene.remove(game.medicinebox)
					console.log("mission completed")
					this.fireworks.removeMission("MISSION_2");
				}
				var shl_elm = document.getElementById('school');
				if (shl_elm != undefined && shl_elm.style.display == 'block') {
					this.helperHandler('school')
				}
				var house_elm = document.getElementById('house');
				if (house_elm != undefined && house_elm.style.display == 'block') {
					var mission_failed=document.getElementById('fail');
					if(mission_failed){
						this.helperHandler('house')
						this.school_mission_started=false;
						this.school_visited=false;
						this.school_mission_near_end=false;
						this.school_mission_ended=false;
						console.log("mission fail");
						this.scene.remove(game.book);
					}
					else{
						this.helperHandler('house')
						this.school_mission_ended = true;
						this.scene.remove(game.book)
						console.log("mission completed")
						this.fireworks.removeMission("MISSION_3");
					}
				}
			}
		}
	}

	handleKeyDown = (e) => {
		this.KeyDown.add(e.key.toLowerCase())

		// else if (e.key.toLowerCase() === "p") {

		// }


	}
	handleKeyUp = (e) => {
		this.KeyDown.delete(e.key.toLowerCase())
		if(e.key.toLowerCase()==="p"){
			this.backgroundmusic.play();
		}

	}
	setEnvironment() {
		const loader = new RGBELoader();
		const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
		pmremGenerator.compileEquirectangularShader();

		const self = this;

		loader.load('./assets/hdr/venice_sunset_1k.hdr', (texture) => {
			const envMap = pmremGenerator.fromEquirectangular(texture).texture;
			pmremGenerator.dispose();

			self.scene.environment = envMap;

		}, undefined, (err) => {
			console.error('An error occurred setting the environment');
		});
	}
	// loadGLTF() {
	//     const loader = new GLTFLoader().setPath(`../../assets/`);
	//     this.ready = false;

	//     // Load a glTF resource
	//     loader.load(
	//         // resource URL
	//         'city.glb',
	//         // called when the resource is loaded
	//         gltf => {
	//             this.scene.add(gltf.scene);
	//             this.loadingBar.visible = false;
	//             this.renderer.setAnimationLoop(this.render.bind(this));
	//             this.plane= gltf.scene;
	//             // Perform any additional initialization for the city here
	//             this.ready = true;
	//         },
	//         // called while loading is progressing
	//         xhr => {
	//             this.loadingBar.progress = (xhr.loaded/xhr.total);
	//         },
	//         // called when loading has errors
	//         err => {
	//             console.error(err);
	//         }
	//     );
	// }
	loadGLTF() {
		const loader = new GLTFLoader().setPath('./assets/plane/');
		const game = this;

		// Load a glTF resource
		loader.load(
			// resource URL
			'city.glb',
			// called when the resource is loaded
			gltf => {
				// const bbox = new THREE.Box3().setFromObject(gltf.scene);
				//console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);

				this.plane = gltf.scene;

				this.scene.add(gltf.scene);
				gltf.scene.scale.set(100 * gltf.scene.scale.x, 100 * gltf.scene.scale.y, 100 * gltf.scene.scale.z)
				this.loadingBar.visible = false;
				this.loadSFX();
				const tloader = new THREE.CubeTextureLoader();
				tloader.setPath(`${game.assetsPath}/images/`);

				var textureCube = tloader.load([
					'px.jpg', 'nx.jpg',
					'py.jpg', 'ny.jpg',
					'pz.jpg', 'nz.jpg'
				]);

				game.scene.background = textureCube;
				gltf.scene.traverse(function (child) {
					if (child.isMesh) {
						//console.log(child.name);
						// if(child.name == 'Cube'){
						// 	//console.log(child.name);
						// 	//console.log('ewcnrh');
						// }
						if (child.name == 'Cube001' || child.name == 'Cube001_1' || child.name == 'Cube001_2') {
							console.log('hi');
							game.hospital.push(child);
						}
						else if (child.name == 'Object_118') {
							game.school.push(child)
						}
						else if (child.name == 'Building_ApartmentSmall_Orange_(1)001') {
							game.home.push(child)
						}
						else if (child.name == 'Building_House_03001') {
							game.medicine_delivery_house.push(child)
						}
						else if (child.name == 'Plane001_2' || child.name == 'Lord_Krishna' || child.name == 'Cylinder012') {
							game.temple.push(child)
						}
						game.colliders.push(child);
						child.castShadow = true;
						child.receiveShadow = true;

					}
				});
				game.animate();
			},
			// called while loading is progressing
			xhr => {

				this.loadingBar.progress = (xhr.loaded / xhr.total);

			},
			// called when loading has errors
			err => {

				console.error(err);

			}
		);

	}
	loadPlayground() {
		const loader = new GLTFLoader().setPath('./assets/plane/');
		const game = this;
		var playground;

		loader.load(
			'playground.glb',

			gltf => {
				playground = gltf.scene;
				playground.position.set(6644.17073821531, 0, 5817.950688973395);

				// this.plane = gltf.scene;
				var degrees = 225;
				var radians = degrees * (Math.PI / 180);
				playground.rotation.set(0, radians, 0);

				this.scene.add(playground);

				gltf.scene.scale.set(60 * gltf.scene.scale.x, 70 * gltf.scene.scale.y, 60 * gltf.scene.scale.z)
				this.loadingBar.visible = false;
				this.playgroundBB = new THREE.Box3().setFromObject(gltf.scene);
				gltf.scene.traverse(function (child) {
					if (child.isMesh) {
						child.castShadow = true;
						child.receiveShadow = true;
						game.colliders.push(child);
					}
				});

			},
			// called while loading is progressing
			xhr => {

			},

			err => {

				console.error(err);

			}
		);
	}
	loadCar() {
		const loader = new GLTFLoader().setPath('./assets/plane/');
		const game = this;
		var car;
		loader.load(
			'lamborghini.glb',

			gltf => {
				car = gltf.scene;
				car.position.set(11907.475041045696, 60.459721051546, -1333.6689664474354);

				// this.plane = gltf.scene;
				var degrees = 225;
				var radians = degrees * (Math.PI / 180);
				car.rotation.set(0, radians, 0);

				this.scene.add(car);

				gltf.scene.scale.set(50 * gltf.scene.scale.x, 50 * gltf.scene.scale.y, 50 * gltf.scene.scale.z)
				this.loadingBar.visible = false;

				gltf.scene.traverse(function (child) {
					if (child.isMesh) {
						child.castShadow = true;
						child.receiveShadow = true;

					}
				});

			},
			// called while loading is progressing
			xhr => {

			},

			err => {

				console.error(err);

			}
		);
	}
	loadGrass() {
		const loader = new GLTFLoader();
		const game = this;
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath('node_modules/three/examples/jsm/libs/draco/').preload();
		loader.setDRACOLoader(dracoLoader);
		loader.load(
			// resource URL
			'output1.glb',
			// called when the resource is loaded
			gltf => {

				//console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
				this.grass = gltf.scene;


				this.scene.add(gltf.scene);
				gltf.scene.scale.set(150 * gltf.scene.scale.x, 50 * gltf.scene.scale.y, 150 * gltf.scene.scale.z)

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
	loadMedicinebox() {
		const loader = new GLTFLoader();
		const game = this;
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath('node_modules/three/examples/jsm/libs/draco/').preload();
		loader.setDRACOLoader(dracoLoader);
		loader.load(
			// resource URL
			'./assets/plane/medical_bag.glb',
			// called when the resource is loaded
			gltf => {

				//console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
				this.medicinebox = gltf.scene;
				gltf.scene.position.set(11188.18, 0, 5691.11)
				gltf.scene.rotation.set(0, -1 * Math.PI / 2, 0)
				gltf.scene.scale.set(0.06 * gltf.scene.scale.x, 0.06 * gltf.scene.scale.y, 0.06 * gltf.scene.scale.z)
				this.scene.add(gltf.scene);

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
	loadBook() {
		const loader = new GLTFLoader();
		const game = this;
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath('node_modules/three/examples/jsm/libs/draco/').preload();
		loader.setDRACOLoader(dracoLoader);
		loader.load(
			// resource URL
			'./assets/plane/book.glb',
			// called when the resource is loaded
			gltf => {
				//console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
				//this.school_mission_started=true;
				this.book = gltf.scene;
				gltf.scene.position.set(-7341.79233, 85, -1029.69910)
				gltf.scene.rotation.set(Math.PI / 2, 0, 0)
				gltf.scene.scale.set(15 * gltf.scene.scale.x, 15 * gltf.scene.scale.y, 15 * gltf.scene.scale.z)
				this.scene.add(gltf.scene);

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
	loadSFX() {
		this.sfx = new SFX(this.camera, this.assetsPath + 'sound/');
		this.sfx.load('fast_pace');
		this.sfx.load('medium_pace');
		this.sfx.load('pray');
		this.oldmansfx = new SFX(this.camera, this.assetsPath + 'sound/');
		this.oldmansfx.load('oldman1')
	}
	loadNextAnim(loader) {
		let anim = this.anims.pop();
		const game = this;
		let animpath = `${this.assetsPath}fbx/people/`
		if (this.character == "boy") {
			animpath += `school_boy/${anim}.fbx`
		}
		else if (this.character == "girl") {
			animpath += `school_girl/${anim}.fbx`
		}
		loader.load(animpath, function (object) {
			game.animations[anim] = object.animations[0];
			//console.log(object.animations[0]);
			if (game.anims.length > 0) {
				game.loadNextAnim(loader);
			} else {
				game.createCameras();
				//game.createColliders();
				game.joystick = new JoyStick({
					onMove: game.playerControl,
					game: game
				});
				document.getElementById('joystick_circle').style.display = 'none';
				document.getElementById('joystick_thumb').style.display = 'none';
				delete game.anims;
				game.action = "Idle";
				// this.sfx.stopAll();
				game.animate();

			}
		});
	}
	// simulate(element, eventName) {
	// 	var event = new MouseEvent(eventName, {
	// 		bubbles: true,
	// 		cancelable: true,
	// 		view: window
	// 	});
	// 	element.dispatchEvent(event);
	// }
	createColliders() {
		// const geometry = new THREE.BoxGeometry(500, 400, 500);
		// const material = new THREE.MeshBasicMaterial({color:0x222222, wireframe:true});



		// for (let x=-5000; x<5000; x+=1000){
		//     for (let z=-5000; z<5000; z+=1000){
		//         if (x==0 && z==0) continue;
		//         const box = new THREE.Mesh(geometry, material);
		//         box.position.set(x, 250, z);
		//         this.scene.add(box);
		//         this.colliders.push(box);
		//     }
		// }

		// const geometry2 = new THREE.BoxGeometry(1000, 40, 1000);
		// const stage = new THREE.Mesh(geometry2, material);
		// stage.position.set(0, 20, 0);
		// this.colliders.push(stage);
		// this.scene.add(stage);
	}
	old_man_conversation_handler = () => {
		this.set_old_man_action('Warning');
		let game = this;
		this.player.object.position.set(-689.738, 0, 1271.0579);
		this.player.object.rotation.set(0, -1.508407346, 0);
		let speechBubble_oldman = new SpeechBubble(game.scene, "A very warm good afternoon to you as well. Actually, my son Bob is ill, and the doctors have confirmed that they will bring the necessary medicine for him. But they are too late Can you once visit the doctor, asking for updates?", 100);
		speechBubble_oldman.mesh.position.set(-850, 200, 1250);
		speechBubble_oldman.mesh.rotation.set(0, Math.PI / 2, 0);
		this.backgroundmusic.pause();
		this.oldmansfx.play('oldman1');
		setTimeout(() => {
			document.removeEventListener('keydown', this.handleKeyDown);
			document.removeEventListener('keyup', this.handleKeyUp);
		}, 750);
		setTimeout(() => {
			this.backgroundmusic.play();
			speechBubble_oldman.hide();
			this.set_old_man_action('Idle');
			document.addEventListener('keydown', this.handleKeyDown);
			document.addEventListener('keyup', this.handleKeyUp);
			this.old_man_mission_ended = true;
			console.log("mission completed")
			this.fireworks.removeMission("MISSION_1");
		}, 16000);
	}

	movePlayeronKeyboardinput(dt) {
		if (!this.player.object) {
			return
		}
		const pos = this.player.object.position.clone();
		pos.y += 60;
		let dir = new THREE.Vector3();

		this.player.object.getWorldDirection(dir);
		if (this.KeyDown.has('s') || this.KeyDown.has('arrowdown')) dir.negate();

		let raycaster = new THREE.Raycaster(pos, dir);
		let blocked = false;
		const colliders = this.colliders;
		if (colliders !== undefined) {
			const intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {
				if (intersect[0].distance < 50) blocked = true;
			}
		}
		if ((this.old_man_mission_ended) && !(this.hospital_visited)) {/////////////////////////////////////////////////////////////////////////////////////////////////////
			const hospital = this.hospital;
			if (hospital !== undefined) {
				const rev = raycaster.intersectObjects(hospital);
				if (rev.length > 0) {
					if (rev[0].distance < 50) {
						// if (!(this.hospital_visited)) {
						this.player.object.position.set(11188.18, 0, 5691.11);
						this.player.object.rotation.set(0, -1 * Math.PI, 0);
						this.container.style.display = 'none';
						// document.getElementById('joystick_circle').style.display = 'none';
						// document.getElementById('joystick_thumb').style.display = 'none';
						var scriptElement = document.createElement('script');

						// Set the attributes for the script element
						scriptElement.type = 'module';
						scriptElement.src = 'hospital.js';

						// Append the script element to the document body
						document.body.appendChild(scriptElement);
						this.hospital_visited = true;

						this.hospital_mission_started = true;
						this.loadMedicinebox();
						setTimeout(() => {
							document.removeEventListener('keydown', this.handleKeyDown);
							document.removeEventListener('keyup', this.handleKeyUp);

							// Add new event listener after removing the previous ones
							document.addEventListener('keydown', this.handleEsckeyDown);
						}, 500);
						// }
					}

				}
			}
		}

		if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
			const medicine_delivery_house = this.medicine_delivery_house;
			if (medicine_delivery_house !== undefined) {
				const rev2 = raycaster.intersectObjects(medicine_delivery_house);
				if (rev2.length > 0) {
					if (rev2[0].distance < 50) {
						// if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
						this.hospital_mission_near_end = true;
						this.player.object.position.set(-2062.0171711, 0, 750.3398705);
						this.player.object.rotation.set(0, -1.1, 0);
						this.container.style.display = 'none';
						// document.getElementById('joystick_circle').style.display = 'none';
						// document.getElementById('joystick_thumb').style.display = 'none';
						var scriptElement = document.createElement('script');

						// Set the attributes for the script element
						scriptElement.type = 'module';
						scriptElement.src = 'illperson.js';
						// document.onkeydown = function (e) {
						// 	e.preventDefault();
						// 	return false;
						// };

						// Append the script element to the document body
						document.body.appendChild(scriptElement);
						// }
						setTimeout(() => {
							document.removeEventListener('keydown', this.handleKeyDown);
							document.removeEventListener('keyup', this.handleKeyUp);

							// Add new event listener after removing the previous ones
							document.addEventListener('keydown', this.handleEsckeyDown);
						}, 500);
					}
				}
			}
		}

		if (this.hospital_mission_ended && !(this.school_visited)) {//this.hospital_mission_ended && !(this.school_visited)
			const school = this.school;
			if (school !== undefined) {
				const rev1 = raycaster.intersectObjects(school);
				if (rev1.length > 0) {
					if (rev1[0].distance < 50) {
						// if (!(this.school_visited)) {
						this.player.object.position.set(-7341.79233, 0, -1029.69910);
						this.player.object.rotation.set(0, 0, 0);
						this.container.style.display = 'none';
						// document.getElementById('joystick_circle').style.display = 'none';
						// document.getElementById('joystick_thumb').style.display = 'none';
						var scriptElement = document.createElement('script');

						// Set the attributes for the script element
						scriptElement.type = 'module';
						scriptElement.src = 'school.js';

						// Append the script element to the document body
						document.body.appendChild(scriptElement);
						this.loadBook();
						// }
						setTimeout(() => {
							document.removeEventListener('keydown', this.handleKeyDown);
							document.removeEventListener('keyup', this.handleKeyUp);

							// Add new event listener after removing the previous ones
							document.addEventListener('keydown', this.handleEsckeyDown);
						}, 500);
						this.school_visited = true;
						this.school_mission_started = true;
					}
				}
			}
		}
		if (this.school_mission_started && !(this.school_mission_ended)) {
			const home = this.home;
			if (home !== undefined) {
				const rev3 = raycaster.intersectObjects(home);
				if (rev3.length > 0) {
					if (rev3[0].distance < 50) {
						// if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
						this.school_mission_near_end = true;
						this.player.object.position.set(-7533.572789129, 0, 4710.936700226);
						this.player.object.rotation.set(0, -0.389999, 0);
						this.container.style.display = 'none';
						// document.getElementById('joystick_circle').style.display = 'none';
						// document.getElementById('joystick_thumb').style.display = 'none';
						var scriptElement = document.createElement('script');

						// Set the attributes for the script element
						scriptElement.type = 'module';
						scriptElement.src = 'house.js';
						// document.onkeydown = function (e) {
						// 	e.preventDefault();
						// 	return false;
						// };

						// Append the script element to the document body
						document.body.appendChild(scriptElement);
						// }
						setTimeout(() => {
							document.removeEventListener('keydown', this.handleKeyDown);
							document.removeEventListener('keyup', this.handleKeyUp);

							// Add new event listener after removing the previous ones
							document.addEventListener('keydown', this.handleEsckeyDown);
						}, 500);
					}
				}
			}
		}
		// console.log(this.playgroundBB)
		// console.log(this.playerBB)//this.temple_mission_completed
		if (((this.KeyDown.size == 1)) && (this.temple_mission_completed) && !(this.exercising_mission_ended) && (this.KeyDown.has('h') || this.KeyDown.has('j') || this.KeyDown.has('k'))) {
			if ((this.player.object.position.x >= 5600 && this.player.object.position.x <= 7400) && (this.player.object.position.y >= 0 && this.player.object.position.y <= 2) && (this.player.object.position.z >= 5000 && this.player.object.position.z <= 6817)) {
				if (!(this.exercising_start)) {
					this.exercising_start = Date.now();
				}
				else {
					let dur = Date.now() - this.exercising_start;
					if (dur >= 15000) {
						console.log("mission completed");
						this.fireworks.removeMission("MISSION_5");
						this.exercising_mission_ended = true;
						setTimeout(()=>{
							document.getElementById("endBtn").style.display='block';
							
						},6500)
						
					}
				}
			}
		}
		else {
			this.exercising_start = null;
		}
		if (((this.KeyDown.size == 1)) && (this.school_mission_ended) && !(this.temple_mission_completed) && this.KeyDown.has('p')) {
			if (this.keyPressStartTime) {
				const duration = Date.now() - this.keyPressStartTime;
				if (duration >= 15000) {
					if ((this.player.object.position.y <= 75 && this.player.object.position.y >= 71) && (this.player.object.position.x <= -10000 && this.player.object.position.x >= -11000) && (this.player.object.position.z <= 8900 && this.player.object.position.z >= 6500)) {
						console.log("mission completed");
						this.fireworks.removeMission("MISSION_4");
						this.keyPressStartTime = null;
						this.temple_mission_completed = true;
						setTimeout(() => {
							document.removeEventListener('keydown', this.handleKeyDown);
							document.removeEventListener('keyup', this.handleKeyUp);
						}, 750);
						setTimeout(() => {
							document.addEventListener('keydown', this.handleKeyDown);
							document.addEventListener('keyup', this.handleKeyUp);
						}, 4500);
					}
				}

			}
			else {
				//this.keyPressTimeout = setTimeout(this.checkContinuousKeyPress, 5000); // 5 seconds
				// console.log("ko")
				this.keyPressStartTime = Date.now();
				// console.log(this.keyPressStartTime)

			}
		}
		else {
			this.keyPressStartTime = null;
		}
		if (((this.KeyDown.size == 1)) && !(this.old_man_mission_started) && (this.KeyDown.has('b'))) {
			console.log(this.player.object.position.x);
			if (Math.sqrt(Math.pow(this.player.object.position.x + 771.2158, 2) + Math.pow(this.player.object.position.z - 1156.1133, 2)) < 350) {
				if (!(this.conversation_start)) {
					this.conversation_start = Date.now();
				}
				else {
					let dur = Date.now() - this.conversation_start;
					if (dur >= 2000) {
						this.old_man_conversation_handler();
						this.old_man_mission_started = true;
					}
				}
			}
		}
		else {
			this.conversation_start = null;
		}
		if ((!blocked) && ((this.KeyDown.has('w') || this.KeyDown.has('arrowup')) && (this.KeyDown.has('shift'))) && (this.KeyDown.has('a') || this.KeyDown.has('arrowleft'))) {
			const speed = 400;
			if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
				if (this.player.action != 'Holding Walk') {
					this.action = 'Holding Walk';
				}
			}
			else if (this.school_mission_started && !(this.school_mission_ended)) {
				if (this.player.action != 'CarryingRunning') {
					this.action = 'CarryingRunning';
				}
			}
			else if (this.player.action != 'Running') {
				this.action = 'Running';
			}
			this.player.object.translateZ(dt * speed);
			this.player.object.rotateY(0.01);
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(0.01);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(-0.01);
			}
			this.sfx.play('fast_pace')
		}
		else if ((!blocked) && ((this.KeyDown.has('w') || this.KeyDown.has('arrowup')) && (this.KeyDown.has('shift'))) && (this.KeyDown.has('d') || this.KeyDown.has('arrowright'))) {
			const speed = 400;
			if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
				if (this.player.action != 'Holding Walk') {
					this.action = 'Holding Walk';
				}
			}
			else if (this.school_mission_started && !(this.school_mission_ended)) {
				if (this.player.action != 'CarryingRunning') {
					this.action = 'CarryingRunning';
				}
			}
			else if (this.player.action != 'Running') {
				this.action = 'Running';
			}
			this.player.object.translateZ(dt * speed); //for moving the object this is necessary
			this.player.object.rotateY(-0.01);
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(-0.01);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(0.01);
			}
			this.sfx.play('fast_pace')
		}
		else if ((!blocked) && ((this.KeyDown.has('w') || this.KeyDown.has('arrowup')) && (this.KeyDown.has('shift')))) {
			const speed = 400;
			if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
				if (this.player.action != 'Holding Walk') {
					this.action = 'Holding Walk';
				}
			}
			else if (this.school_mission_started && !(this.school_mission_ended)) {
				if (this.player.action != 'CarryingRunning') {
					this.action = 'CarryingRunning';
				}
			}
			else if (this.player.action != 'Running') {
				this.action = 'Running';
			}
			this.player.object.translateZ(dt * speed); //for moving the object this is necessary
			this.sfx.play('fast_pace')
		}
		else if ((!blocked) && ((this.KeyDown.has('w') || this.KeyDown.has('arrowup')) && (!this.KeyDown.has('shift'))) && (this.KeyDown.has('a') || this.KeyDown.has('arrowleft'))) {
			const speed = 150;
			if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
				if (this.player.action != 'Holding Walk') {
					this.action = 'Holding Walk';
				}
			}
			else if (this.school_mission_started && !(this.school_mission_ended)) {
				if (this.player.action != 'CarryingWalking') {
					this.action = 'CarryingWalking';
				}
			}
			else if (this.player.action != 'Walking') {
				this.action = 'Walking';
			}
			this.player.object.translateZ(dt * speed); //for moving the object this is necessary
			this.player.object.rotateY(0.005);
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(0.005);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(-0.005);
			}
			this.sfx.play('medium_pace')
		}
		else if ((!blocked) && ((this.KeyDown.has('w') || this.KeyDown.has('arrowup')) && (!this.KeyDown.has('shift'))) && (this.KeyDown.has('d') || this.KeyDown.has('arrowright'))) {
			const speed = 150;
			if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
				if (this.player.action != 'Holding Walk') {
					this.action = 'Holding Walk';
				}
			}
			else if (this.school_mission_started && !(this.school_mission_ended)) {
				if (this.player.action != 'CarryingWalking') {
					this.action = 'CarryingWalking';
				}
			}
			else if (this.player.action != 'Walking') {
				this.action = 'Walking';
			}
			this.player.object.translateZ(dt * speed); //for moving the object this is necessary
			this.player.object.rotateY(-0.005);
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(-0.005);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(0.005);
			}
			this.sfx.play('medium_pace')
		}
		else if ((!blocked) && ((this.KeyDown.has('w') || this.KeyDown.has('arrowup')) && (!this.KeyDown.has('shift')))) {
			const speed = 150;
			if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
				if (this.player.action != 'Holding Walk') {
					this.action = 'Holding Walk';
				}
			}
			else if (this.school_mission_started && !(this.school_mission_ended)) {
				if (this.player.action != 'CarryingWalking') {
					this.action = 'CarryingWalking';
				}
			}
			else if (this.player.action != 'Walking') {
				this.action = 'Walking';
			}
			this.player.object.translateZ(dt * speed);
			this.sfx.play('medium_pace')
		}
		else if ((!blocked) && ((this.KeyDown.has('s') || this.KeyDown.has('arrowdown')) && ((this.KeyDown.has('d') || this.KeyDown.has('arrowright'))))) {
			this.player.object.translateZ(-dt * 30);
			if (!(this.school_mission_started && !(this.school_mission_ended)) && !(this.hospital_mission_started && !(this.hospital_mission_ended)) && this.player.action != 'Walking Backwards Right') {
				this.action = 'Walking Backwards Right';
			}
			this.sfx.play('medium_pace')
		}
		else if ((!blocked) && (this.KeyDown.has('s') || this.KeyDown.has('arrowdown'))) {
			this.player.object.translateZ(-dt * 30);
			if (!(this.school_mission_started && !(this.school_mission_ended)) && !(this.hospital_mission_started && !(this.hospital_mission_ended)) && this.player.action != 'Walking Backwards Left') {
				this.action = 'Walking Backwards Left';
			}
			this.sfx.play('medium_pace')
		}
		else if ((this.KeyDown.size == 1) && (this.KeyDown.has('a') || this.KeyDown.has('arrowleft'))) {
			this.player.object.rotateY(0.01)
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(0.01);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(-0.01);
			}
			if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
				if (this.player.action != 'Holding Idle') {
					this.action = 'Holding Idle';
				}
			}
			else if (this.school_mission_started && !(this.school_mission_ended)) {
				if (this.player.action != 'CarryingIdle') {
					this.action = 'CarryingIdle';
				}
			}
			else if (this.player.action != 'Turning Left') {
				this.action = 'Turning Left';
			}
			this.sfx.play('medium_pace');
		}
		else if ((this.KeyDown.size == 1) && (this.KeyDown.has('d') || this.KeyDown.has('arrowright'))) {
			this.player.object.rotateY(-0.01)
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(-0.01);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(0.01);
			}
			if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
				if (this.player.action != 'Holding Idle') {
					this.action = 'Holding Idle';
				}
			}
			else if (this.school_mission_started && !(this.school_mission_ended)) {
				if (this.player.action != 'CarryingIdle') {
					this.action = 'CarryingIdle';
				}
			}
			else if (this.player.action != 'Turning Right') {
				this.action = 'Turning Right';
			}
			this.sfx.play('medium_pace');
		}
		else if (!(this.school_mission_started && !(this.school_mission_ended)) && !(this.hospital_mission_started && !(this.hospital_mission_ended)) && (this.KeyDown.size == 1) && (this.KeyDown.has('p'))) {
			if (this.player.action != 'Praying InBetween') {
				this.action = 'Praying InBetween';
			}
			this.backgroundmusic.pause();
			this.sfx.play('pray');
		}
		else if (!(this.school_mission_started && !(this.school_mission_ended)) && !(this.hospital_mission_started && !(this.hospital_mission_ended)) && (this.KeyDown.size == 1) && (this.KeyDown.has('b'))) {
			if (this.player.action != 'Bow') {
				this.action = 'Bow';
			}
		}
		else if (!(this.school_mission_started && !(this.school_mission_ended)) && !(this.hospital_mission_started && !(this.hospital_mission_ended)) && (this.KeyDown.size == 1) && (this.KeyDown.has('h'))) {
			if (this.player.action != 'Push Up') {
				this.action = 'Push Up';
			}
		}
		else if (!(this.school_mission_started && !(this.school_mission_ended)) && !(this.hospital_mission_started && !(this.hospital_mission_ended)) && (this.KeyDown.size == 1) && (this.KeyDown.has('j'))) {
			if (this.player.action != 'Jump Push Up') {
				this.action = 'Jump Push Up';
			}
		}
		else if (!(this.school_mission_started && !(this.school_mission_ended)) && !(this.hospital_mission_started && !(this.hospital_mission_ended)) && (this.KeyDown.size == 1) && (this.KeyDown.has('k'))) {
			if (this.player.action != 'Plank') {
				this.action = 'Plank';
			}
		}
		else {
			if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
				if (this.player.action != 'Holding Idle') {
					this.action = 'Holding Idle';
				}
			}
			else if (this.school_mission_started && !(this.school_mission_ended)) {
				if (this.player.action != 'CarryingIdle') {
					this.action = 'CarryingIdle';
				}
			}
			else if (this.player.action != 'Idle') {
				this.action = 'Idle';
			}

			// this.backgroundmusic.play();
			this.sfx.stopAll();
		}



		// //console.log("hello")
		// const shiftKey=this.KeyDown.has('shift')
		// if(!shiftKey){
		//     if(this.KeyDown.has('a')||this.KeyDown.has('arrowleft')){
		//         this.player.object.rotateY(0.01)

		//     }
		//     else if(this.KeyDown.has('d')||this.KeyDown.has('arrowright')){
		//         this.player.object.rotateY(-0.01)
		//     }
		// }

		// const speed=150
		// const runspeed=400
		// if(this.KeyDown.has('w')||this.KeyDown.has('arrowup')){
		//     this.player.object.position.add(dir.clone().multiplyScalar(speed))
		// }
		// else if(this.KeyDown.has('s')||this.KeyDown.has('arrowdown')){
		//     this.player.object.position.add(dir.clone().multiplyScalar(-speed))
		// }
		// if(shiftKey){
		//     const strafeDir=dir.clone();
		//     const upVector=new THREE.Vector3(0,1,0)
		//     if(this.KeyDown.has('a')||this.KeyDown.has('arrowleft')){
		//         this.player.object.position.add(
		//             strafeDir.applyAxisAngle(upVector,Math.PI*0.5).multiplyScalar(speed)
		//         )
		//     }
		//     else if(this.KeyDown.has('d')||this.KeyDown.has('arrowright')){
		//         this.player.object.position.add(
		//             strafeDir.applyAxisAngle(upVector,Math.PI*-0.5).multiplyScalar(speed)
		//         )
		//     }
		// }


		if (colliders !== undefined) {
			//cast left
			dir.set(-1, 0, 0);
			dir.applyMatrix4(this.player.object.matrix); //the dir vector points to the object’s left side with respect to its current orientation in the 3D world.
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			let intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {
				if (intersect[0].distance < 50) this.player.object.translateX(100 - intersect[0].distance);
			}

			//cast right
			dir.set(1, 0, 0);
			dir.applyMatrix4(this.player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {
				if (intersect[0].distance < 50) this.player.object.translateX(intersect[0].distance - 100);
			}
			//cast forward
			// dir.set(0,0,-1);
			// dir.applyMatrix4(this.player.object.matrix);
			// dir.normalize();
			// raycaster = new THREE.Raycaster(pos, dir);

			// intersect = raycaster.intersectObjects(colliders);
			// if (intersect.length>0){
			// 	if (intersect[0].distance<50) this.player.object.translateZ(intersect[0].distance-100);
			// }

			//cast down
			dir.set(0, -1, 0);
			pos.y += 190;
			raycaster = new THREE.Raycaster(pos, dir);
			const gravity = 30;

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {
				// //console.log(intersect.length);

				const targetY = pos.y - intersect[0].distance;
				// //console.log(targetY);
				// //console.log(this.player.object.position.y);
				if (targetY > this.player.object.position.y) {
					//Going up
					this.player.object.position.y = 0.8 * this.player.object.position.y + 0.2 * targetY;
					this.player.velocityY = 0;
				} else if (targetY < this.player.object.position.y) {
					//Falling
					if (this.player.velocityY == undefined) this.player.velocityY = 0;
					this.player.velocityY += dt * gravity;
					this.player.object.position.y -= this.player.velocityY;
					if (this.player.object.position.y < targetY) {
						this.player.velocityY = 0;
						this.player.object.position.y = targetY;
					}
				}
			} else if (this.player.object.position.y > 0) {
				if (this.player.velocityY == undefined) this.player.velocityY = 0;
				this.player.velocityY += dt * gravity;
				this.player.object.position.y -= this.player.velocityY;
				if (this.player.object.position.y < 0) {
					this.player.velocityY = 0;
					this.player.object.position.y = 0;
				}
			}
		}
		this.mesh.position.x = this.player.object.position.x;
		this.mesh.position.z = this.player.object.position.z;
	}
	movePlayer(dt) {
		const pos = this.player.object.position.clone();
		pos.y += 60;
		let dir = new THREE.Vector3();

		this.player.object.getWorldDirection(dir);
		if (this.player.move.forward < 0) dir.negate();

		let raycaster = new THREE.Raycaster(pos, dir);
		let blocked = false;
		const colliders = this.colliders;
		if (colliders !== undefined) {
			const intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {

				if (intersect[0].distance < 50) blocked = true;
			}
		}

		const hospital = this.hospital;
		if (hospital !== undefined) {
			const rev = raycaster.intersectObjects(hospital);
			if (rev.length > 0) {
				if (rev[0].distance < 50) {
					this.player.object.position.set(11188.18, 0, 5691.11);
					this.player.object.rotation.set(0, -1 * Math.PI, 0);
					console.log('rev')
					this.container.style.display = 'none';
					// document.getElementById('joystick_circle').style.display = 'none';
					// document.getElementById('joystick_thumb').style.display = 'none';
					var scriptElement = document.createElement('script');

					// Set the attributes for the script element
					scriptElement.type = 'module';
					scriptElement.src = 'hospital.js';

					// Append the script element to the document body
					document.body.appendChild(scriptElement);

				}

			}
		}

		// raycaster = new THREE.Raycaster(pos, dir);
		// if(this.hospital !== undefined){
		// 	const is_hospital = raycaster.intersectObject(this.hospital);
		// 	if(is_hospital.length > 0 && is_hospital[0].distance< 50){
		// 		console.log('revanth');

		// 	}
		// }
		if (!blocked) {
			if (this.player.move.forward > 0) {
				const speed = (this.player.action == 'Running') ? 400 : 150;
				this.player.object.translateZ(dt * speed); //for moving the object this is necessary
			} else {
				this.player.object.translateZ(-dt * 30);
			}
		}

		if (colliders !== undefined) {
			//cast left
			dir.set(-1, 0, 0);
			dir.applyMatrix4(this.player.object.matrix); //the dir vector points to the object’s left side with respect to its current orientation in the 3D world.
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			let intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {
				if (intersect[0].distance < 50) this.player.object.translateX(100 - intersect[0].distance);
			}

			//cast right
			dir.set(1, 0, 0);
			dir.applyMatrix4(this.player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			// if(this.hospital !== undefined){
			// 	const is_hospital = raycaster.intersectObject(this.hospital);
			// 	if(is_hospital.length > 0 && is_hospital[0].distance< 50){
			// 		console.log('revanth');

			// 	}
			// }

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {
				if (intersect[0].distance < 50) this.player.object.translateX(intersect[0].distance - 100);
			}
			//cast forward
			// dir.set(0,0,-1);
			// dir.applyMatrix4(this.player.object.matrix);
			// dir.normalize();
			// raycaster = new THREE.Raycaster(pos, dir);

			// intersect = raycaster.intersectObjects(colliders);
			// if (intersect.length>0){
			// 	if (intersect[0].distance<50) this.player.object.translateZ(intersect[0].distance-100);
			// }

			//cast down
			dir.set(0, -1, 0);
			pos.y += 190;
			raycaster = new THREE.Raycaster(pos, dir);
			const gravity = 30;

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {
				// //console.log(intersect.length);

				const targetY = pos.y - intersect[0].distance;
				// //console.log(targetY);
				// //console.log(this.player.object.position.y);
				if (targetY > this.player.object.position.y) {
					//Going up
					this.player.object.position.y = 0.8 * this.player.object.position.y + 0.2 * targetY;
					this.player.velocityY = 0;
				} else if (targetY < this.player.object.position.y) {
					//Falling
					if (this.player.velocityY == undefined) this.player.velocityY = 0;
					this.player.velocityY += dt * gravity;
					this.player.object.position.y -= this.player.velocityY;
					if (this.player.object.position.y < targetY) {
						this.player.velocityY = 0;
						this.player.object.position.y = targetY;
					}
				}
			} else if (this.player.object.position.y > 0) {
				if (this.player.velocityY == undefined) this.player.velocityY = 0;
				this.player.velocityY += dt * gravity;
				this.player.object.position.y -= this.player.velocityY;
				if (this.player.object.position.y < 0) {
					this.player.velocityY = 0;
					this.player.object.position.y = 0;
				}
			}
		}

		this.player.object.rotateY(this.player.move.turn * dt); //this code is for rotation of the object.

		this.mesh.position.x = this.player.object.position.x;
		this.mesh.position.z = this.player.object.position.z;
		// setp(() => {
		// 	this.grass.position.x = this.player.object.position.x;
		// 	this.grass.position.z = this.player.object.position.z;
		// }, 15.5 * 1000)

	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);

	}

	set action(name) {
		const action = this.player.mixer.clipAction(this.animations[name]);
		action.time = 0;
		this.player.mixer.stopAllAction();
		this.player.action = name;
		this.player.actionTime = Date.now();
		this.player.actionName = name;
		//console.log("hel")
		//action.fadeIn(0.5);	
		action.play();
	}

	get action() {
		if (this.player === undefined || this.player.actionName === undefined) return "";
		return this.player.actionName;
	}

	playerControl(forward, turn) {
		turn = -turn;

		if (forward > 0.3) {
			if (this.player.action != 'Walking' && this.player.action != 'Running') this.action = 'Walking'; this.sfx.play('medium_pace');
		} else if (forward < -0.3) {

			if (turn >= 0) {
				if (this.player.action != 'Walking Backwards Left') {
					this.action = 'Walking Backwards Left';
				}
			}
			else {
				if (this.player.action != 'Walking Backwards Right') {
					this.action = 'Walking Backwards Right';
				}
			}
			this.sfx.play('medium_pace')

		} else {
			forward = 0;
			if (turn > 0.1) {
				if (this.player.action != 'Turning Left') this.action = 'Turning Left'; this.sfx.play('medium_pace');
			}
			else if (turn < -0.1) {
				if (this.player.action != 'Turning Right') this.action = 'Turning Right'; this.sfx.play('medium_pace');
			}
			else if (this.player.action != "Idle") {
				this.action = 'Idle';
				this.sfx.stopAll();
			}
		}

		if (forward == 0 && turn == 0) {
			delete this.player.move;
		} else {
			this.player.move = { forward, turn };
		}
	}

	set activeCamera(object) {
		this.player.cameras.active = object;
	}

	createCameras() {
		const offset = new THREE.Vector3(0, 80, 0);
		const front = new THREE.Object3D();
		front.position.set(112, 100, 600);
		front.parent = this.player.object;
		const back = new THREE.Object3D();
		back.position.set(0, 300, -600);
		back.parent = this.player.object;
		const wide = new THREE.Object3D();
		wide.position.set(178, 139, 1665);
		wide.parent = this.player.object;
		const overhead = new THREE.Object3D();
		overhead.position.set(0, 400, 0);
		overhead.parent = this.player.object;
		const collect = new THREE.Object3D();
		collect.position.set(40, 82, 94);
		collect.parent = this.player.object;
		this.player.cameras = { front, back, wide, overhead, collect };
		game.activeCamera = this.player.cameras.back;
	}

	animate() {
		const game = this;
		const dt = this.clock.getDelta();
		if (this.hospital_mission_started && !(this.hospital_mission_ended)) {
			if (this.medicinebox !== undefined) {
				let dir = new THREE.Vector3();
				this.player.object.getWorldDirection(dir);
				const strafeDir = dir.clone();
				const upVector = new THREE.Vector3(0, 1, 0)
				dir = strafeDir.applyAxisAngle(upVector, Math.PI * 0.5).multiplyScalar(20);
				this.medicinebox.position.set(this.player.object.position.x + dir.x, this.player.object.position.y + 42, this.player.object.position.z + dir.z);
				// this.medicinebox.position.y=this.player.object.position.y+42;
				// console.log(this.player.object.position.z);
				// console.log(this.medicinebox.position.z);
			}
		}
		if (this.school_mission_started && !(this.school_mission_ended)) {
			if (this.book !== undefined) {
				let dir = new THREE.Vector3();
				this.player.object.getWorldDirection(dir);
				const strafeDir = dir.clone();
				dir = strafeDir.multiplyScalar(15.5);
				this.book.position.set(this.player.object.position.x + dir.x, this.player.object.position.y + 96.5, this.player.object.position.z + dir.z);
				// this.medicinebox.position.y=this.player.object.position.y+42;
				// console.log(this.player.object.position.z);
				// console.log(this.medicinebox.position.z);
			}
		}
		// console.log('x')
		// console.log(this.player.object.position.x)
		// console.log('ry')
		// console.log(this.player.object.rotation.y)
		// console.log('z')
		// console.log(this.player.object.position.z)
		// this.count = this.count + 1;
		// if (this.count == 60) {
		// 	this.count = 0;
		// 	if (Math.sqrt((this.grass.position.x - this.player.object.position.x) * (this.grass.position.x - this.player.object.position.x) + (this.grass.position.z - this.player.object.position.z) * (this.grass.position.z - this.player.object.position.z)) > 2000) {
		// 		this.grass.position.x = this.player.object.position.x;
		// 		this.grass.position.z = this.player.object.position.z;
		// 	}
		// }
		// console.log(this.count);
		requestAnimationFrame(function () { game.animate(); });

		if (this.player.mixer !== undefined) this.player.mixer.update(dt);
		if (this.oldman.mixer !== undefined) this.oldman.mixer.update(dt);

		if (this.player.move !== undefined && this.player.action == 'Walking') {
			const elapsedTime = Date.now() - this.player.actionTime;
			if (elapsedTime > 1000 && this.player.move.forward > 0) {
				this.action = 'Running';
				this.sfx.play('fast_pace');
			}
		}

		if (this.player.move !== undefined) this.movePlayer(dt);
		else { this.movePlayeronKeyboardinput(dt); }
		if (this.player.cameras != undefined && this.player.cameras.active != undefined) {
			this.camera.position.lerp(this.player.cameras.active.getWorldPosition(new THREE.Vector3()), 0.01);
			const pos = this.player.object.position.clone();
			pos.y += 200;
			this.camera.lookAt(pos);
		}

		if (this.sun != undefined) {
			this.sun.position.x = this.player.object.position.x;
			this.sun.position.y = this.player.object.position.y + 200;
			this.sun.position.z = this.player.object.position.z + 100;
			this.sun.target = this.player.object;
		}

		this.renderer.render(this.scene, this.camera);

	}
}

// document.addEventListener("DOMContentLoaded", function(){
// 	const game = new Game();
// 	window.game = game;//For debugging only
// });
const btn = document.getElementById('startBtn');
const pbtn = document.getElementById('playBtn');
const avatar = document.getElementById('avatar-instructions');
const avatars = document.querySelectorAll('.avatar-img');
const backgroundmusic=document.getElementById("bgAudio");
let selectedAvatar = null;



btn.addEventListener('click', function () {
	avatar.style.display = 'block';
	pbtn.style.display = 'block';
	btn.style.display = 'none';
});



avatars.forEach(avatar => {
	avatar.addEventListener('click', function () {
		if (selectedAvatar) {
			selectedAvatar.classList.remove('clicked');
		}
		if (selectedAvatar !== this) {
			this.classList.add('clicked');
			selectedAvatar = this;
		} else {
			selectedAvatar = null;
		}
	});
});

let game;
pbtn.addEventListener('click', function () {
	if (selectedAvatar) {
		//console.log(selectedAvatar.id);
		game = new Game(selectedAvatar.id);
		window.game = game;//For debugging only
		pbtn.style.display = 'none';
		avatar.style.display = 'none';
		backgroundmusic.pause();
		backgroundmusic.src="/assets/sound/middle.mp3";
		backgroundmusic.play();
		backgroundmusic.volume=0.05;
	} else {
		//console.log('No avatar selected');
	}
});

