/** CG Lab project 3: Billiard
/** Author: Ole Rönna
/** Date: 2019-12-13
/** textures: https://opengameart.org
*/
/*  global dat  */
"use strict";

const gameOptions = function () {
	this.numberBalls = 8;
	this.BallSpeed = 10;
	this.SpeedVariance = 5;
	this.wireframe = function () { wireframing(); };
	this.cameraReset = function () {
		camera.position.set(0, -42, 22);
		camera.up.set(0, 1, 0);
	};
	this.Restart = function () { init(); };
};
// dat.GUI control window:
const gameOpt = new gameOptions();
const gui = new dat.GUI();

window.onload = function () {
	gui.add(gameOpt, 'numberBalls', 1, 100).step(1);
	gui.add(gameOpt, 'BallSpeed', 0, 20).step(1);
	gui.add(gameOpt, 'SpeedVariance', 0, 10).step(1);
	gui.add(gameOpt, 'wireframe');
	gui.add(gameOpt, 'cameraReset');
	gui.add(gameOpt, 'Restart');
};
// Constants defining the room, table and playball
const room = {
	width: 60,
	length: 80,
	height: 30,
};
const table = {
	width: 14.2,
	length: 28.4,
	height: 2.5,
	Thickness: 1.5,
	legLength: 1.5,
	legHeight: 7.5,
	legWidth: 1.5,
	normalVectorX: new THREE.Vector3(1, 0, 0),	// Normalvectors for specular reflection
	normalVectorY: new THREE.Vector3(0, 1, 0),
};
table.BoundaryX = table.width / 2;
table.BoundaryY = table.length / 2;

const playball = {
	radius: 0.57,
	SegLowRes: 8,
	SegHighRes: 32,
};
playball.BoundaryX = table.width / 2 - playball.radius;
playball.BoundaryY = table.length / 2 - playball.radius;

//* Initialize webGL and scene
const canvas = document.getElementById("mycanvas");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("black");
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();

// create camera, mouse control and lights
const fieldOfView = 60;
const frustumNear = 2;
const frustumFar = 500;
const aspectRatio = canvas.width / canvas.height;
const camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio,
	frustumNear, frustumFar);
camera.aspect = window.innerWidth / window.innerHeight;
camera.position.set(0, -42, 22);

const controls = new THREE.TrackballControls(camera, canvas);

const ambLightIntensity = 0.4;
const spotLightIntensity = 0.8;
const ambientLight = new THREE.AmbientLight("white", ambLightIntensity);
const spotLight = new THREE.SpotLight("white", spotLightIntensity);
spotLight.angle = 70 / 180 * Math.PI;
spotLight.position.set(0, 0, 20);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 4096;
spotLight.shadow.mapSize.height = 4096;
spotLight.shadow.camera.near = 5;
spotLight.shadow.camera.far = 20;
spotLight.shadow.camera.fov = 10;
spotLight.distance = 50;

//create and positon the objects:
const wallTexture = new THREE.TextureLoader().load('img/wall.jpg');
const longWall = new THREE.Mesh(
	new THREE.PlaneBufferGeometry( room.length, room.height ), 
	new THREE.MeshPhongMaterial({ color: 0xA09070, map: wallTexture }));
longWall.rotation.set(-Math.PI / 2,-Math.PI / 2, 0);
longWall.position.set(room.width / 2, 0, room.height / 2);

const longWall2 = longWall.clone();
longWall2.rotation.y = Math.PI / 2;
longWall2.position.x = -room.width / 2;

const shortWall = new THREE.Mesh(
	new THREE.PlaneBufferGeometry( room.width, room.height ), 
	new THREE.MeshPhongMaterial({ color: 0xA09070, map: wallTexture }));
shortWall.rotation.x = -Math.PI / 2;
shortWall.position.set(0, -room.length / 2, room.height / 2);

const shortWall2 = shortWall.clone();
shortWall2.rotation.y = Math.PI;
shortWall2.position.y = room.length / 2;

const floorTexture = new THREE.TextureLoader().load('img/floor.jpg');
const floor = new THREE.Mesh(
	new THREE.PlaneBufferGeometry( room.width, room.length ),
	new THREE.MeshPhongMaterial({ color: 0x684C00, map: floorTexture }));
floor.receiveShadow = true;

const ceilingTexture = new THREE.TextureLoader().load('img/ceiling.jpg');
const ceiling = floor.clone();
ceiling.material = new THREE.MeshPhongMaterial({ color: 0x909090, map: ceilingTexture });
ceiling.rotation.x = Math.PI;
ceiling.position.z = room.height;

const doorWidth = 11;
const doorHeigth = 22;
const doorThickness = 0.5;
const doorTexture = new THREE.TextureLoader().load('img/door.jpg');
const door = new THREE.Mesh(
	new THREE.BoxBufferGeometry(doorWidth, doorHeigth, doorThickness),
	new THREE.MeshPhongMaterial({ map: doorTexture }));
door.rotation.x = Math.PI / 2;
door.position.set(0, room.length / 2, doorHeigth / 2);

const exitSign = new THREE.Object3D();
new THREE.FontLoader().load( 'font/helvetiker_regular.typeface.json',  function ( font ) {
		const geo = new THREE.TextGeometry( 'EXIT', {
		font: font,
		size: 1,
		height: 0.4,
		curveSegments: 2,
		bevelSize: 0,
		bevelOffset: 0,
		bevelSegments: 16
	} );	
	const exitSign_ = new THREE.Mesh( geo, new THREE.MeshBasicMaterial( { color: "red" } ) );	
	exitSign.add(exitSign_);
} );

const plateWidth = 3;
const plateHeigth = 1.3;
const plateThickness = 0.1;
const plate = new THREE.Mesh(
	new THREE.BoxBufferGeometry(plateWidth, plateHeigth, plateThickness),
	new THREE.MeshPhongMaterial({ color: "black" }));
plate.position.set(plateWidth / 2.1, plateHeigth / 2.5, 0);

exitSign.add(plate);
exitSign.position.set(-1.5, room.length / 2, doorHeigth+1);
exitSign.rotation.x = Math.PI / 2;

const tableGroundTexture = new THREE.TextureLoader().load('img/cloth.jpg');
const woodTexture = new THREE.TextureLoader().load('img/wood.png');

tableGroundTexture.wrapS = THREE.RepeatWrapping;
tableGroundTexture.wrapT = THREE.RepeatWrapping;
tableGroundTexture.repeat.set(16, 16);
const tableGround = new THREE.Mesh(
	new THREE.BoxBufferGeometry(table.width, table.length, table.Thickness),
	new THREE.MeshPhongMaterial({ color: "darkgreen", map: tableGroundTexture }));
tableGround.position.z = - table.Thickness / 2.01;
tableGround.castShadow = true;
tableGround.receiveShadow = true;

const matTable = [
	new THREE.MeshPhongMaterial({ map: woodTexture }),
	new THREE.MeshPhongMaterial({ color: "darkgreen", map: tableGroundTexture }),
	new THREE.MeshPhongMaterial({ map: woodTexture }),
	new THREE.MeshPhongMaterial({ map: woodTexture }),
	new THREE.MeshPhongMaterial({ map: woodTexture }),
	new THREE.MeshPhongMaterial({ map: woodTexture }),
	new THREE.MeshPhongMaterial({ map: woodTexture }),
];

const rightCushion = new THREE.Mesh(
	new THREE.BoxBufferGeometry(table.Thickness, table.length, table.height), matTable);
rightCushion.position.set(table.BoundaryX + table.Thickness / 2, 0, table.height / 2 - table.Thickness);
rightCushion.castShadow = true;
rightCushion.receiveShadow = true;

const leftCushion = rightCushion.clone();
leftCushion.rotation.y = Math.PI;
leftCushion.position.x *= -1;

const backCushion = rightCushion.clone();
backCushion.rotation.z = Math.PI / 2;
backCushion.scale.y = (table.width + 2*table.Thickness) / table.length;
backCushion.position.set(0, table.BoundaryY + table.Thickness / 2, table.height / 2 - table.Thickness);
backCushion.castShadow = true;
backCushion.receiveShadow = true;

const frontCushion = backCushion.clone();
frontCushion.rotation.x = Math.PI;
frontCushion.position.y *= -1;

const leg1 = new THREE.Mesh(
	new THREE.BoxBufferGeometry(table.legLength, table.legWidth, table.legHeight),
	new THREE.MeshStandardMaterial({ map: woodTexture }));
leg1.position.set(table.width / 2, -table.length / 2, -table.legHeight / 2);
leg1.receiveShadow = true;

const leg2 = leg1.clone();
leg2.position.x *= -1;
const leg3 = leg1.clone();
leg3.position.y *= -1;
const leg4 = leg2.clone();
leg4.position.y *= -1;

const billiardTable = new THREE.Object3D().add(
	tableGround, rightCushion, leftCushion, backCushion, frontCushion,
	leg1, leg2, leg3, leg4);
billiardTable.position.z = table.legHeight;

const geoBall = new THREE.SphereGeometry(
	playball.radius,
	playball.SegHighRes,
	playball.SegHighRes);
const geoBall2 = new THREE.SphereGeometry(
	playball.radius,
	playball.SegLowRes,
	playball.SegLowRes);
let ball = new THREE.Mesh(geoBall, new THREE.MeshPhongMaterial());

const lightBulbRadius = 0.5;
const lightBulbSegments = 32;
const lightBulb = new THREE.Mesh(
	new THREE.SphereBufferGeometry(lightBulbRadius, lightBulbSegments, lightBulbSegments),
	new THREE.MeshBasicMaterial({ color: "yellow" }));
lightBulb.scale.set(0.6, 0.6, 1);

const socketRadius = 0.3;
const socketHeight = 1;
const socket = new THREE.Mesh(
	new THREE.CylinderBufferGeometry(socketRadius, socketRadius, socketHeight, lightBulbSegments),
	new THREE.MeshBasicMaterial({ color: "black" }));
socket.rotation.x = Math.PI / 2;
socket.position.z = 0.9;

const cordThickness = 0.02;
const cordLength = 10;
const cordSeg = 8;
const lightCord = new THREE.Mesh(
	new THREE.CylinderBufferGeometry(cordThickness, cordThickness, cordLength, cordSeg, cordSeg),
	new THREE.MeshBasicMaterial({ color: "black" }));
lightCord.rotation.x = Math.PI / 2;
lightCord.position.z = lightBulb.position.z + cordLength / 2;

const shade = new THREE.Mesh(
	new THREE.CylinderBufferGeometry(2, 3, socketHeight - 0.05, lightBulbSegments),
	new THREE.MeshPhongMaterial({ color: "navy" }));
	shade.position.z = 0.9;
	shade.rotation.x = Math.PI / 2;
const lamp = new THREE.Object3D().add(lightBulb, socket, lightCord, shade);
lamp.position.copy(spotLight.position);

// some variables to calculate the balls
let balls = [];
const clock = new THREE.Clock();
let deltaClock, omega;
let rotAxis = new THREE.Vector3(0, 0, 1);
const frictionBall = 0.08;
const ballCollisionCoef = 0.7;
const cushionCollisionCoef = 0.8;

init();
animate();

/************************ F U N C T I O N S ***************************/
/******* function to initialize the startpositions and ballspeed ******/
function init() {
	// reset everything after restart:	
	while (scene.children.length > 0) {
		scene.remove(scene.children[0]);
	}
	balls = [];  // restart with an empty array
	scene.add(ceiling, floor, longWall, longWall2, shortWall, shortWall2, door, exitSign,
		billiardTable, lamp, ambientLight, spotLight);
	// scene.add(new THREE.AxesHelper(20));

	ball.receiveShadow = true;
	ball.castShadow = true;
	for (let lv = 0; lv < gameOpt.numberBalls; lv++) {
		ball.matrixAutoUpdate = false;
		balls[lv] = ball.clone();

		// create ball textures		
		if (ball.material.wireframe == false) {
			const ballTexture = new THREE.TextureLoader().load('img/Ball' + (lv % 8 + 8) + '.jpg');
			balls[lv].material = new THREE.MeshBasicMaterial({ map: ballTexture });
		}
		// calculate the initial ball positions
		balls[lv].currentPos = new THREE.Vector3(0, 0,table.legHeight + playball.radius);
		balls[lv].currentPos.x = THREE.Math.randFloat(-playball.BoundaryX, playball.BoundaryX);
		balls[lv].currentPos.y = THREE.Math.randFloat(-playball.BoundaryY, playball.BoundaryY);
		while (balls.some(ball => ball.currentPos.distanceTo(balls[lv].currentPos) < 2 * playball.radius + 0.2
			& balls[lv].id != ball.id)) {
			balls[lv].currentPos.x = THREE.Math.randFloat(-playball.BoundaryX, playball.BoundaryX);
			balls[lv].currentPos.y = THREE.Math.randFloat(-playball.BoundaryY, playball.BoundaryY);
		}
		//calculate a "random" ball velocity between minBallSpeed and maxBallSpeed	
		balls[lv].speed = new THREE.Vector3(0, 0, 0);
		const minBallSpeed = gameOpt.BallSpeed - gameOpt.SpeedVariance;
		const maxBallSpeed = gameOpt.BallSpeed + gameOpt.SpeedVariance;
		balls[lv].speed.x = (Math.random() < 0.5 ? -1 : 1) * THREE.Math.randFloat(minBallSpeed, maxBallSpeed);
		balls[lv].speed.y = (Math.random() < 0.5 ? -1 : 1) * THREE.Math.randFloat(minBallSpeed, maxBallSpeed);

		scene.add(balls[lv]);
	}
}

/************************* Render loop ********************************/
function animate() {

	requestAnimationFrame(animate);
	deltaClock = clock.getDelta();

	// calculate the new ball positions:
	balls.forEach(ball => {
		// new position and speed:
		ball.speed.multiplyScalar(1 - deltaClock * frictionBall);
		ball.currentPos.add(ball.speed.clone().multiplyScalar(deltaClock));
		rotAxis = new THREE.Vector3(0, 0, 1);
		rotAxis.cross(ball.speed.clone()).normalize();
		omega = ball.speed.length() / playball.radius;
		const dR = new THREE.Matrix4();
		dR.makeRotationAxis(rotAxis, omega * deltaClock);
		ball.matrix.premultiply(dR);
		ball.matrix.setPosition(ball.currentPos);

		// check if the ball hits right or left cushion
		if (Math.abs(ball.currentPos.x) > playball.BoundaryX) {
			ball.currentPos.x = ball.currentPos.x < 0 ? -playball.BoundaryX : playball.BoundaryX;
			ball.speed.copy(specRef(ball.speed, table.normalVectorX)).multiplyScalar(cushionCollisionCoef);
		}
		// check if the ball hits upper or lower couchin:
		if (Math.abs(ball.currentPos.y) > playball.BoundaryY) {
			ball.currentPos.y = ball.currentPos.y < 0 ? -playball.BoundaryY : playball.BoundaryY;
			ball.speed.copy(specRef(ball.speed, table.normalVectorY)).multiplyScalar(cushionCollisionCoef);
		}
		// check if the ball hits another ball:
		const collision = balls.filter(otherBalls =>
			(otherBalls.currentPos.distanceTo(ball.currentPos) < 2 * playball.radius) &
			otherBalls.id != ball.id);
		collision.forEach(otherBall => {
			const vectorBallminusOtherBall = ball.speed.clone().sub(otherBall.speed);
			const vectorDistance = ball.currentPos.clone().sub(otherBall.currentPos);
			// calculate the new speed vectors (elastic collision):
			ball.speed.sub(vectorBallminusOtherBall.clone()
			.projectOnVector(vectorDistance)).multiplyScalar(ballCollisionCoef);
			otherBall.speed.add(vectorBallminusOtherBall.clone()
				.projectOnVector(vectorDistance)).multiplyScalar(ballCollisionCoef);
			// make sure that the distance between the balls isn't < 2*playball.radius:
			ball.currentPos.copy(otherBall.currentPos.clone()
				.add(vectorDistance.multiplyScalar(2 * playball.radius / vectorDistance.length())));
		});
	});

	controls.update();
	renderer.render(scene, camera);
}

/**** function to calculate the specular reflection of a vector vin ***/
function specRef(vin, n) {
	const v = vin.clone();
	const n_ = n.clone().normalize();
	return v.sub(n_.multiplyScalar(2 * v.dot(n_)));
}

window.addEventListener("resize", function () {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

/**** enable and disable balls wireframing ***/
function wireframing() {
	if (ball.material.wireframe == true) {
		ball = new THREE.Mesh(geoBall, new THREE.MeshPhongMaterial({ color: "white", wireframe: false }));
	}
	else {
		ball = new THREE.Mesh(geoBall2, new THREE.MeshPhongMaterial({ color: "white", wireframe: true }));
	}
	init();
}
