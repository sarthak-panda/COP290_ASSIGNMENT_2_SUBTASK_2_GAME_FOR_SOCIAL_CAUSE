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
		this.exercising_mission_ended = false;
		this.exercising_start = null;
		this.temple_mission_completed = false;
		this.old_man_mission_started = false;
		this.old_man_mission_ended = false;
		this.conversation_start = null;
		this.oldmansfx = {};
		const game = this;
		this.anims = [ 'CarryingRunning', 'CarryingWalking', 'CarryingIdle', 'Jump Push Up', 'Plank', 'Push Up', 'Writing', 'Holding Idle', 'Holding Walk', 'Walking', 'Bow', 'Praying InBetween', 'Running', 'Turning Left', 'Turning Right', 'Walking Backwards Left', 'Walking Backwards Right'];
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
		this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), new THREE.MeshPhongMaterial({ color: 0xd14600, depthWrite: false }));
		this.mesh.rotation.x = - Math.PI / 2;
		this.mesh.receiveShadow = true;
		this.scene.add(this.mesh);
		var grid = new THREE.GridHelper(5000, 40, 0x000000, 0x000000);
		grid.material.opacity = 0.2;
		grid.material.transparent = true;
		this.scene.add(grid);
		const loader = new FBXLoader();
		const game = this;
		console.log(this.character)
		let path = `${this.assetsPath}fbx/people/`
		if (this.character === "boy") {
			path += "school_boy/boy.fbx"
		}
		else if (this.character === "girl") {
			path += "school_girl/girl.fbx"
			this.addGirl();
		}
		loader.load(path, function (object) {
			object.mixer = new THREE.AnimationMixer(object);
			game.player.mixer = object.mixer;
			game.player.root = object.mixer.getRoot();
			object.traverse(function (child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = false;
				}
			});
			game.player.object = new THREE.Object3D();
			game.scene.add(game.player.object);
			game.player.object.add(object);
			game.animations.Idle = object.animations[0];
			game.player.object.position.set(0, 50, 600);
			game.player.object.scale.set(0.8, 0.8, 0.8);
			game.loadNextAnim(loader);
		});
		loader.load(`${this.assetsPath}fbx/people/old_man/Old Man.fbx`, function (object) {
			object.mixer = new THREE.AnimationMixer(object);
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
		});
		loader.load(`${this.assetsPath}fbx/people/old_man/Late.fbx`, function (object) {
			game.oldmananimations.Warning = object.animations[0];
		});
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		this.renderer.physicallyCorrectLights = true;
		this.container.appendChild(this.renderer.domElement);
		this.loadingBar = new LoadingBar();
		this.setEnvironment();
		this.loadGLTF();
		this.loadCar();
		this.loadPlayground();
		window.addEventListener('resize', function () { game.onWindowResize(); }, false);
		this.reset_position=document.getElementById("rstBtn");
		this.reset_position.addEventListener("click", function() {
			game.player.object.position.set(0, 50, 600);
		});
		document.addEventListener('keydown', this.handleKeyDown)
		document.addEventListener('keyup', this.handleKeyUp)
		document.addEventListener("visibilitychange", (event) => {
			if (document.visibilityState == "visible") {
			  console.log("tab is active")
			} else {
			  console.log("tab is inactive")
			  this.KeyDown.clear();
			}
		  });
		document.addEventListener('mousedown', (event) => {
			this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			var raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(this.mouse, this.camera);
			const intersects = raycaster.intersectObjects(this.scene.children, true);
			if (intersects.length > 0) {
				console.log('Clicked on a 3D model:', intersects[0].object.name);
			}
		}, false);
		document.addEventListener('touchstart', (event) => {
			this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			var raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(this.mouse, this.camera);
			const intersects = raycaster.intersectObjects(this.scene.children, true);
			if (intersects.length > 0) {
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
		action.play();
	}
	addGirl() {
		var element = document.createElement('div');
		element.id = 'girly';
		element.style.width = '0px';
		element.style.height = '0px';
		document.body.appendChild(element);
	}
	helperHandler = (filename) => {
		var esc_elm = document.getElementById('escape')
		if (esc_elm) {
			esc_elm.remove();
			var scriptElement = document.querySelector(`script[src="${filename}.js"]`);
			if (scriptElement) {
				scriptElement.remove();
			}
			let game = document.getElementById('game');
			game.style.display = 'block';
			var element = document.getElementById(filename)
			if (element) {
				element.remove();
			}
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
		console.log(this.container.style.display)
		let game = document.getElementById('game');
		if(game.style.display !== 'none' && (!(this.old_man_mission_started)||(this.old_man_mission_ended))){
			this.KeyDown.add(e.key.toLowerCase())
		}
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
	loadGLTF() {
		const loader = new GLTFLoader().setPath('./assets/plane/');
		const game = this;
		loader.load(
			'city.glb',
			gltf => {
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
			xhr => {
				this.loadingBar.progress = (xhr.loaded / xhr.total);
			},
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
			'output1.glb',
			gltf => {
				this.grass = gltf.scene;
				this.scene.add(gltf.scene);
				gltf.scene.scale.set(150 * gltf.scene.scale.x, 50 * gltf.scene.scale.y, 150 * gltf.scene.scale.z)
			},
			xhr => {
				console.log(xhr.loaded / xhr.total)
			},
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
			'./assets/plane/medical_bag.glb',
			gltf => {
				this.medicinebox = gltf.scene;
				gltf.scene.position.set(11188.18, 0, 5691.11)
				gltf.scene.rotation.set(0, -1 * Math.PI / 2, 0)
				gltf.scene.scale.set(0.06 * gltf.scene.scale.x, 0.06 * gltf.scene.scale.y, 0.06 * gltf.scene.scale.z)
				this.scene.add(gltf.scene);
			},
			xhr => {
				console.log(xhr.loaded / xhr.total)
			},
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
			'./assets/plane/book.glb',
			gltf => {
				this.book = gltf.scene;
				gltf.scene.position.set(-7341.79233, 85, -1029.69910)
				if(document.getElementById('girl')){
					gltf.scene.position.y=65;
				}
				gltf.scene.rotation.set(Math.PI / 2, 0, 0)
				gltf.scene.scale.set(15 * gltf.scene.scale.x, 15 * gltf.scene.scale.y, 15 * gltf.scene.scale.z)
				this.scene.add(gltf.scene);
			},
			xhr => {
				console.log(xhr.loaded / xhr.total)
			},
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
		this.sfx.load('pray_girl');
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
			if (game.anims.length > 0) {
				game.loadNextAnim(loader);
			} else {
				game.createCameras();
				delete game.anims;
				game.action = "Idle";
				game.animate();
			}
		});
	}
	createColliders() {
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
		this.KeyDown.clear();
		setTimeout(() => {
			this.backgroundmusic.play();
			speechBubble_oldman.hide();
			this.set_old_man_action('Idle');
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
		if ((this.old_man_mission_ended) && !(this.hospital_visited)) {
			const hospital = this.hospital;
			if (hospital !== undefined) {
				const rev = raycaster.intersectObjects(hospital);
				if (rev.length > 0) {
					if (rev[0].distance < 50) {
						this.player.object.position.set(11188.18, 0, 5691.11);
						this.player.object.rotation.set(0, -1 * Math.PI, 0);
						this.container.style.display = 'none';
						var scriptElement = document.createElement('script');
						scriptElement.type = 'module';
						scriptElement.src = 'hospital.js';
						document.body.appendChild(scriptElement);
						this.hospital_visited = true;
						this.hospital_mission_started = true;
						this.loadMedicinebox();
						this.KeyDown.clear();
						setTimeout(() => {
							document.addEventListener('keydown', this.handleEsckeyDown);
						}, 800);
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
						this.hospital_mission_near_end = true;
						this.player.object.position.set(-2062.0171711, 0, 750.3398705);
						this.player.object.rotation.set(0, -1.1, 0);
						this.container.style.display = 'none';
						var scriptElement = document.createElement('script');
						scriptElement.type = 'module';
						scriptElement.src = 'illperson.js';
						document.body.appendChild(scriptElement);
						this.KeyDown.clear();
						setTimeout(() => {
							document.addEventListener('keydown', this.handleEsckeyDown);
						}, 800);
					}
				}
			}
		}
		if (this.hospital_mission_ended && !(this.school_visited)) {
			const school = this.school;
			if (school !== undefined) {
				const rev1 = raycaster.intersectObjects(school);
				if (rev1.length > 0) {
					if (rev1[0].distance < 50) {
						this.player.object.position.set(-7341.79233, 0, -1029.69910);
						this.player.object.rotation.set(0, 0, 0);
						this.container.style.display = 'none';
						var scriptElement = document.createElement('script');
						scriptElement.type = 'module';
						scriptElement.src = 'school.js';
						document.body.appendChild(scriptElement);
						this.loadBook();
						this.KeyDown.clear();
						setTimeout(() => {
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
						this.school_mission_near_end = true;
						this.player.object.position.set(-7439.248595, 0, 4732.58650089);
						this.player.object.rotation.set(0, 1.33159263589, 0);
						this.container.style.display = 'none';
						var scriptElement = document.createElement('script');
						scriptElement.type = 'module';
						scriptElement.src = 'house.js';
						document.body.appendChild(scriptElement);
						this.KeyDown.clear();
						setTimeout(() => {
							document.addEventListener('keydown', this.handleEsckeyDown);
						}, 800);
					}
				}
			}
		}
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
						this.KeyDown.clear();
					}
				}
			}
			else {
				this.keyPressStartTime = Date.now();
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
		var run_rotating_speed;
		if(this.school_mission_ended){
			run_rotating_speed=0.07;
		}
		else{
			run_rotating_speed=0.01;
		}
		var walk_rotating_speed;
		if(this.school_mission_ended){
			walk_rotating_speed=0.008;
		}
		else{
			walk_rotating_speed=0.03;
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
			this.player.object.rotateY(run_rotating_speed);
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(run_rotating_speed);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(-1*run_rotating_speed);
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
			this.player.object.translateZ(dt * speed); 
			this.player.object.rotateY(-1*run_rotating_speed);
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(-1*run_rotating_speed);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(run_rotating_speed);
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
			this.player.object.translateZ(dt * speed); 
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
			this.player.object.translateZ(dt * speed); 
			this.player.object.rotateY(walk_rotating_speed);
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(walk_rotating_speed);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(-1*walk_rotating_speed);
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
			this.player.object.translateZ(dt * speed); 
			this.player.object.rotateY(-1*walk_rotating_speed);
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(-1*walk_rotating_speed);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(walk_rotating_speed);
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
			this.player.object.rotateY(run_rotating_speed)
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(run_rotating_speed);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(-1*run_rotating_speed);
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
			this.player.object.rotateY(-1*run_rotating_speed)
			if (this.medicinebox !== undefined) {
				this.medicinebox.rotateY(-1*run_rotating_speed);
			}
			if (this.book !== undefined) {
				this.book.rotateZ(run_rotating_speed);
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
			if(this.character==='girl'){
				this.sfx.play('pray_girl');
			}
			else{
				this.sfx.play('pray');
			}
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
			this.sfx.stopAll();
		}
		if (colliders !== undefined) {
			dir.set(-1, 0, 0);
			dir.applyMatrix4(this.player.object.matrix); 
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);
			let intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {
				if (intersect[0].distance < 50) this.player.object.translateX(100 - intersect[0].distance);
			}
			dir.set(1, 0, 0);
			dir.applyMatrix4(this.player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);
			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {
				if (intersect[0].distance < 50) this.player.object.translateX(intersect[0].distance - 100);
			}
			dir.set(0, -1, 0);
			pos.y += 190;
			raycaster = new THREE.Raycaster(pos, dir);
			const gravity = 30;
			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0) {
				const targetY = pos.y - intersect[0].distance;
				if (targetY > this.player.object.position.y) {
					this.player.object.position.y = 0.8 * this.player.object.position.y + 0.2 * targetY;
					this.player.velocityY = 0;
				} else if (targetY < this.player.object.position.y) {
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
		action.play();
	}
	get action() {
		if (this.player === undefined || this.player.actionName === undefined) return "";
		return this.player.actionName;
	}
	set activeCamera(object) {
		this.player.cameras.active = object;
	}
	createCameras() {
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
		if(this.container.style.display==='none'){
			this.KeyDown.clear();
		}
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
			}
		}
		if (this.school_mission_started && !(this.school_mission_ended)) {
			if (this.book !== undefined) {
				let dir = new THREE.Vector3();
				this.player.object.getWorldDirection(dir);
				const strafeDir = dir.clone();
				dir = strafeDir.multiplyScalar(15.5);
				this.book.position.set(this.player.object.position.x + dir.x, this.player.object.position.y + 96.5, this.player.object.position.z + dir.z);
			}
		}
		requestAnimationFrame(function () { game.animate(); });
		if (this.player.mixer !== undefined) this.player.mixer.update(dt);
		if (this.oldman.mixer !== undefined) this.oldman.mixer.update(dt);
		this.movePlayeronKeyboardinput(dt);
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
		game = new Game(selectedAvatar.id);
		window.game = game;
		pbtn.style.display = 'none';
		avatar.style.display = 'none';
		backgroundmusic.pause();
		backgroundmusic.src="/assets/sound/middle.mp3";
		backgroundmusic.play();
		backgroundmusic.volume=0.05;
	} else {
	}
});