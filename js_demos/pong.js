/** CG Lab project 1: Simple Pong-Game
/** Author: Ole Rönna
/** Date: 2019-10-28
*/

const gameOptions = function() {
	this.guiMessage1 = 'Gameoptions (press';
	this.guiMessage2 = '\'Restart\' to aply)';
	this.BallSpeed = 2.5;
	this.SpeedVariance = 1;
	this.racketSpeed = 5;
	this.twoPlayer = false;
	this.Restart = function(){ init() };
};
// dat.GUI control window:
const gameOpt = new gameOptions();
const gui = new dat.GUI();

window.onload = function() {
	gui.add(gameOpt, 'guiMessage1');
	gui.add(gameOpt, 'guiMessage2');
	gui.add(gameOpt, 'BallSpeed', 0, 10);
	gui.add(gameOpt, 'SpeedVariance', 0, 5);
	gui.add(gameOpt, 'racketSpeed', 0, 10);
	gui.add(gameOpt, 'twoPlayer');
	gui.add(gameOpt, 'Restart');
};
// Constants defining the playground and playball:
const playground = {
	width: 5,
	length: 10,
	hight: 0.5,
	Thickness: 0.1,
	racketWidth: 1,
	normalVRightLeft: new THREE.Vector3(1,0,0),	// Normalvectors for specular reflection
	normalVUpDown: new THREE.Vector3(0,1,0),
	twoPlayer: false
};
playground.rightBoundary = playground.width/2;
playground.leftBoundary = -playground.rightBoundary;

const playball = {
	radius: 0.2,
	widthSegments: 32,
	heightSegments: 32,
	speed: new THREE.Vector3()
};


//* Initialize webGL with camera and lights
const canvas1 = document.getElementById("mycanvas1");
const canvas2 = document.getElementById("mycanvas2");

const renderer1 = new THREE.WebGLRenderer({canvas:canvas1, antialias: true});
const renderer2 = new THREE.WebGLRenderer({canvas:canvas2, antialias: true});
renderer1.setClearColor("black");
renderer2.setClearColor("black");

// create scene and camera
const scene = new THREE.Scene();

const fieldOfView = 70;
const frustumNear = 0.1;
const frustumFar = 1000;
const aspectRatio1 = canvas1.width / canvas1.height;
const aspectRatio2 = canvas2.width / canvas2.height;
const camera1 = new THREE.PerspectiveCamera(fieldOfView, aspectRatio1,
                                            frustumNear, frustumFar);

const camera2 = new THREE.PerspectiveCamera(fieldOfView, aspectRatio2,
                                        	frustumNear, frustumFar);
camera1.position.set(0,-6,7);
camera2.up.set( 0, 0, 1 );
camera2.position.set(0,6,7);

const controls1 = new THREE.TrackballControls(camera1, canvas1);
let   controls2 = new THREE.TrackballControls(camera2, canvas2);

// Create the geometries:
const geoGround = new THREE.BoxBufferGeometry(
						playground.width,
						playground.length,
						playground.Thickness);

const geoCouchion = new THREE.BoxBufferGeometry(
						playground.Thickness,
						playground.length,
						playground.hight);

const geoBackCouchion = new THREE.BoxBufferGeometry(
						playground.width + 2*playground.Thickness,
						playground.Thickness,
						playground.hight); 

const geoRacket = new THREE.BoxBufferGeometry(
						playground.racketWidth,         
						playground.Thickness,
						playground.hight); 

const geoBall = new THREE.SphereBufferGeometry(
						playball.radius,
						playball.widthSegments,
						playball.heightSegments);

const geoCenterLine = new THREE.Geometry();
	const lineYPos = 0;
	const lineOffset = 0.01;
	geoCenterLine.vertices.push(
	new THREE.Vector3(playground.leftBoundary, lineYPos, lineOffset),
	new THREE.Vector3(playground.rightBoundary), lineYPos, lineOffset);

//create and positon the objects:
const ground = new THREE.Mesh(geoGround, new THREE.MeshBasicMaterial({color: "green"} ));
ground.position.z  = -(playground.Thickness/2);

const leftCouchion = new THREE.Mesh(geoCouchion, new THREE.MeshBasicMaterial({color: "darkgreen"}));
leftCouchion.position.x  = playground.leftBoundary -(playground.Thickness/2);
leftCouchion.position.z  = +(playground.hight/2) -(playground.Thickness);

const rightCouchion = leftCouchion.clone();
rightCouchion.position.x *= -1;

const backCouchion = new THREE.Mesh(geoBackCouchion, new THREE.MeshBasicMaterial({color: "darkgreen"}));
backCouchion.position.y  = +(playground.length/2) +(playground.Thickness/2);
backCouchion.position.z  = +(playground.hight/2) -(playground.Thickness);

const racketP1 = new THREE.Mesh(geoRacket, new THREE.MeshBasicMaterial({color: "red"}));
racketP1.position.y  = -(playground.length/2) -(playground.Thickness/2);
racketP1.position.z  = +(playground.hight/2) -(playground.Thickness);

const racketP2 = new THREE.Mesh(geoRacket, new THREE.MeshBasicMaterial({color: "blue"}));
racketP2.position.y  = +(playground.length/2) +(playground.Thickness/2);
racketP2.position.z  = +(playground.hight/2) -(playground.Thickness);

const ball = new THREE.Mesh(geoBall, new THREE.MeshBasicMaterial({color: "yellow"}));
ball.position.z = +playball.radius;

const centerLine = new THREE.Line(geoCenterLine, new THREE.LineBasicMaterial({color: "white"}))

// add objects to the scene:
scene.add(ground,leftCouchion, rightCouchion, racketP1, ball, centerLine);

// some variables to calculate the movements
const clock = new THREE.Clock();
let deltaClock;
let racketP1Speed = 0;
let racketP2Speed = 0;
let gameOver = false;
const Message1 = document.getElementById("Message1");
const Message2 = document.getElementById("Message2");
init();
animate();


/************************ F U N C T I O N S ***************************/
/******* function to initialize the startpositions and ballspeed ******/
function init() {	
// hide the messages after restart:
	Message1.style.visibility = "hidden";
	Message2.style.visibility = "hidden";
	gameOver = false;
	playground.twoPlayer = gameOpt.twoPlayer;   // pass over the gui selection
	
// calculate a random point on the middle line as balls startposition
	ball.position.x = THREE.Math.randFloat(playground.leftBoundary  + playball.radius,
														playground.rightBoundary - playball.radius);
	ball.position.y = 0;

//calculate a "random" ball velocity between minBallSpeed and maxBallSpeed	
	const minBallSpeed = gameOpt.BallSpeed - gameOpt.SpeedVariance;
	const maxBallSpeed = gameOpt.BallSpeed + gameOpt.SpeedVariance;
	const speedAxis1 = THREE.Math.randFloat(minBallSpeed, maxBallSpeed);
	const speedAxis2 = THREE.Math.randFloat(minBallSpeed, maxBallSpeed);
	// requirements: speed is positiv or negative and speed.x (left/right) < speed.y (up/down)
	// Math.random() generates numbers [0,1] => 50/50 chance Math.random() < 0.5 (=speed: Negative):
	playball.speed.x = (Math.random()<0.5  ? -1:1) * (speedAxis1 < speedAxis2  ? speedAxis1 : speedAxis2);
	playball.speed.y = (Math.random()<0.5  ? -1:1) * (speedAxis1 > speedAxis2  ? speedAxis1 : speedAxis2);
	
	if(playground.twoPlayer === true) {
	// enable canvas2. TrackballControls needs to be called afterwards:
		document.getElementById("mycanvas2").style.display = "inline";
		controls2 = new THREE.TrackballControls(camera2, canvas2);	
		scene.remove(backCouchion);
		scene.add(racketP2);
	}
	else {
		document.getElementById("mycanvas2").style.display = "none";	// disable canvas 2
		scene.remove(racketP2);
		scene.add(backCouchion);
	}
	racketP1Speed = 0;
	racketP1.position.x = 0;
	racketP2Speed = 0;
	racketP2.position.x = 0;
}

/************************* Render loop ********************************/
function animate() {

  requestAnimationFrame(animate);
    
// calculate the new ball and racket positions:
	deltaClock = clock.getDelta();
	ball.position.add(playball.speed.clone().multiplyScalar(deltaClock));
	racketP1.position.x += racketP1Speed * deltaClock;
	racketP2.position.x += racketP2Speed * deltaClock;
	
// stop the rackets at the right and left couchions:
	if(racketP1.position.x - playground.racketWidth/2 < playground.leftBoundary) {
		racketP1.position.x = playground.leftBoundary + playground.racketWidth/2;
	} 
	if(racketP1.position.x + playground.racketWidth/2 > playground.rightBoundary) {
		racketP1.position.x = playground.rightBoundary - playground.racketWidth/2;
	} 
	if(racketP2.position.x - playground.racketWidth/2 < playground.leftBoundary) {
		racketP2.position.x = playground.leftBoundary + playground.racketWidth/2;
	} 
	if(racketP2.position.x + playground.racketWidth/2 > playground.rightBoundary) {
		racketP2.position.x = playground.rightBoundary - playground.racketWidth/2;
	} 
			
	controls1.update();	  
	controls2.update();	  
	renderer1.render(scene, camera1);
	renderer2.render(scene, camera2);
	
// leave the animate function without specular reflection when game is over:
	if(gameOver === true) { 			
		return;							
	}

// check if the ball hits a wall or racket. If so calculate the specular reflection:
	// check right cushion
	if(ball.position.x > (playground.rightBoundary - playball.radius)) {
		ball.position.x =  playground.rightBoundary - playball.radius;
		playball.speed.copy(specRef(playball.speed, playground.normalVRightLeft));
	}
	// check left cushion
	if(ball.position.x < (playground.leftBoundary + playball.radius)) {
		ball.position.x = (playground.leftBoundary + playball.radius);
		playball.speed.copy(specRef(playball.speed, playground.normalVRightLeft));
	}		
	// check racketP1:
	if(ball.position.y < -(playground.length/2 - playball.radius)) {
		if(Math.abs(ball.position.x - racketP1.position.x) < playground.racketWidth/2) {
			ball.position.y = -(playground.length/2 - playball.radius);
			playball.speed.copy(specRef(playball.speed, playground.normalVUpDown));
		}
		else {
			gameOver = true;
			if(playground.twoPlayer === false) {
				Message1.innerHTML = "<h1>Game Over!!</h1>";							
				Message1.style.visibility = "visible";					
			}
			else {
				Message1.innerHTML = "<h1>Game Over! you win!!</h1>";						
				Message1.style.visibility = "visible";	
				Message2.innerHTML = "<h1>Game Over! you lose!!</h1>";						
				Message2.style.visibility = "visible";				
			}
		}
	}	
	// check upper cushion respectively check racket2 (if two players):
	if(ball.position.y > (playground.length/2 - playball.radius)) {
		
		if(playground.twoPlayer === false) {		
			playball.speed.copy(specRef(playball.speed, playground.normalVUpDown));
		}
		else {																			
			if(Math.abs(ball.position.x - racketP2.position.x) < playground.racketWidth/2) {
				ball.position.y =  playground.length/2 - playball.radius;
				playball.speed.copy(specRef(playball.speed, playground.normalVUpDown));
			}
			else {
				gameOver = true;
				Message1.innerHTML = "<h1>Game Over! you lose!!</h1>";						
				Message1.style.visibility = "visible";	
				Message2.innerHTML = "<h1>Game Over! you win!!</h1>";						
				Message2.style.visibility = "visible";		
			}
		}				
	}
}

/**** function to calculate the specular reflection of a vector vin ***/
function specRef(vin, n) {
	let vin_temp = vin.clone();
	let n_temp = n.clone().normalize();
	return vin_temp.sub( n_temp.multiplyScalar(2*vin_temp.dot(n_temp)) );
}

/** Event listener to handle pressed keys (to control the racket movements) **/
document.addEventListener('keydown', function(event) {

	event.preventDefault();
//racketP1 key commands:
	if(event.keyCode === 37) {	
		racketP1Speed = -gameOpt.racketSpeed;
	}
	if(event.keyCode === 39) {	
		racketP1Speed = gameOpt.racketSpeed;
	}
  
//racketP2 key commands:
	if(event.keyCode === 65) {
		racketP2Speed = gameOpt.racketSpeed;
	}
	if(event.keyCode === 83) {
		racketP2Speed = -gameOpt.racketSpeed;
	}
});

/** Event listener to handle released keys (to control the racket movements) **/
document.addEventListener('keyup', function(event) {

	event.preventDefault();
// racketP1 stop:
	if(event.keyCode === 37 | event.keyCode === 39) {
    racketP1Speed = 0;
	}
// racketP2 stop:	
	if(event.keyCode === 65 | event.keyCode === 83) {
    racketP2Speed = 0;
	}
});
