/** CG Lab project 2: Clock with Hamburg time and Tokio time
/** Author: Ole Rönna
/** Date: 2019-11-18
/** 
/** uses modified code from: https://github.com/jeromeetienne/threex.dynamictexture
/** image converted with:    https://www.base64-image.de/                            
*/
/*  global imageHamburg, THREEx  */
/*********** Initialize webGL with camera and lights  *****************/
const canvas = document.getElementById("mycanvas");

const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("white");

const scene = new THREE.Scene();

const fieldOfView = 70;
const frustumNear = 0.1;
const frustumFar = 100;
const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera( fieldOfView, aspectRatio,
											frustumNear, frustumFar);
camera.position.set(1,0,25);
camera.up.set( 0, 0, 1 );

const ambLightIntensity = 1.4;
const spotLightIntensity = 0.3;
const ambientLight = new THREE.AmbientLight("white", ambLightIntensity);
const spotlight1 = new THREE.SpotLight("white", spotLightIntensity);
const spotlight2 = spotlight1.clone();
spotlight1.position.set(50, -10, 100);
spotlight2.position.set(50, -10,-100);

const controls = new THREE.TrackballControls(camera, canvas);

/******************* Geometries, objects ******************************/
const depthSegments = 64;
// Hamburg logo
const hamburgTexture = new THREE.Texture();
hamburgTexture.minFilter = THREE.LinearFilter;	// this removes: "Texture has been resized" warning
imageHamburg.onload = function() {hamburgTexture.needsUpdate = true;}; // definition in lib/imageHamburg.js
hamburgTexture.image = imageHamburg;

const hamburgWidth = 6;
const hamburgHeight = 3;
const geoHamburg = new THREE.PlaneGeometry(hamburgWidth, hamburgHeight);
const hamburg = new THREE.Mesh(geoHamburg, new THREE.MeshStandardMaterial({ map: hamburgTexture }));
hamburg.rotation.set( 0, 0, Math.PI/2);
hamburg.position.set( 5, 0, 0);
hamburg.scale.set(1.8, 1.8, 1);

// Tokio logo
const tokioTextureWidth = 1024;
const tokioTextureHeight = 512;
const tokioTexturePosX = 200;
const tokioTexturePosY = 256;
const tokioTexture = new THREEx.DynamicTexture(tokioTextureWidth, tokioTextureHeight);
tokioTexture.context.font	= "bolder 200px Verdana";
tokioTexture.clear("white").drawText("Tokio", tokioTexturePosX, tokioTexturePosY, "black");

const tokioWidth = 8;
const tokioHeight = 3;
const geoTokio = new THREE.PlaneGeometry(tokioWidth, tokioHeight);
const tokio = new THREE.Mesh(geoTokio, new THREE.MeshStandardMaterial( {map: tokioTexture.texture} ));
tokio.rotation.set(0,0,Math.PI/2);
tokio.position.set(-5.5,0,0);


// Outer rim:
const extrudeSettings = {
							depth : 2,
							steps : 1,
							bevelEnabled: false,
							curveSegments: 512
						};
const rimPosX = 0;
const rimPosY = 0;
const rimRadius = 11.5;
const rimStartAngle = 0;
const rimEndAngle = Math.PI * 2;
const shapeRim = new THREE.Shape();
shapeRim.absarc(rimPosX, rimPosY, rimRadius, rimStartAngle, rimEndAngle);
const rimHolePath = new THREE.Path();

const rimInnerRadius = 11;
rimHolePath.absarc(rimPosX, rimPosY, rimInnerRadius, rimStartAngle, rimEndAngle);
shapeRim.holes.push(rimHolePath);
const geometryRim = new THREE.ExtrudeGeometry(shapeRim, extrudeSettings);
const rim = new THREE.Mesh(geometryRim, new THREE.MeshStandardMaterial({color: "white",
																		roughness: 0.5,
																		metalness: 1,} ));
rim.position.set(0, 0, -1);

// Clock body:
const bodHeight = 0.9;
const geoBody = new THREE.CylinderBufferGeometry(rimInnerRadius, rimInnerRadius, bodHeight, depthSegments);
const body = new THREE.Mesh(geoBody, new THREE.MeshStandardMaterial({color: "white"}));
body.rotation.set(Math.PI/2, 0, 0);

// clock shaft:
const shaftRadius = 0.2;
const shaftHeight = 0.8;
const geoShaft = new THREE.CylinderBufferGeometry(shaftRadius, shaftRadius,shaftHeight, depthSegments);
const shaft = new THREE.Mesh(geoShaft, new THREE.MeshStandardMaterial({color: "black"}));
shaft.rotation.set(Math.PI/2, 0, 0);

// clock blob:
const blobRadius = 0.5;
const geoBlob = new THREE.SphereBufferGeometry(blobRadius, depthSegments, depthSegments);
const blob = new THREE.Mesh(geoBlob, new THREE.MeshStandardMaterial({color: "red"}));
blob.scale.set(1, 1, 0.1);
blob.position.set(0, 0, 0.45);

// clock Hands:
const handSecWidth = 9.6;
const handSecHeight = 0.14;
const handSecDepth = 0.1;
const handMinRadius = 4.4;
const handHourRadius = 3.5;
const geoHandSec = new THREE.BoxBufferGeometry(handSecWidth, handSecHeight, handSecDepth, depthSegments, depthSegments);
const handSec = new THREE.Mesh(geoHandSec, new THREE.MeshStandardMaterial({color: "red"}));
handSec.position.set(-5, 0, 0.45);

const geoHandMin = new THREE.SphereBufferGeometry(handMinRadius, depthSegments, depthSegments);
const handMin = new THREE.Mesh(geoHandMin, new THREE.MeshStandardMaterial({color: "blue"}));
handMin.scale.set(1, 0.05, 0.015);
handMin.position.set(-4.5, 0, 0.3);

const geoHandHour = new THREE.SphereBufferGeometry(handHourRadius, depthSegments, depthSegments);
const handHour = new THREE.Mesh(geoHandHour, new THREE.MeshStandardMaterial({color: "blue"}));
handHour.scale.set(1, 0.1, 0.015);
handHour.position.set(-3.5, 0, 0.15);

/** object helpers to bundle the hand **/
const Secs = new THREE.Object3D().add(handSec);
const Mins = new THREE.Object3D().add(handMin);
const Hours = new THREE.Object3D().add(handHour);

const HandsFront = new THREE.Object3D().add(Secs, Mins, Hours, shaft, blob);
HandsFront.position.set(0, 0, 0.5);

/** clock ticks and numbers  **/
const tickWidth = 2;
const tickHeight = 0.4;
const tickDepth = 0.001;
const numberWidth = 0.5;
const numberHeigth = 0.5;
const maxTicks = 60;
const numberTextureWidth = 256;
const numberTextureHeight = 256;
const numberTexturePosX = 10;
const numberTexturePosY = 200;
const geoTick  = new THREE.BoxBufferGeometry(tickWidth, tickHeight, tickDepth);
const tick = new THREE.Mesh(geoTick, new THREE.MeshStandardMaterial({color: "black"}));
const geoNumber = new THREE.PlaneGeometry(numberWidth, numberHeigth, depthSegments);
const number = new THREE.Mesh(geoNumber, new THREE.MeshStandardMaterial());

for (let numTicks = 1; numTicks <= maxTicks; numTicks++) {	
	const objTicks = new THREE.Object3D();

	if(numTicks === maxTicks) {
		tick.material = new THREE.MeshStandardMaterial({color: "red"});
	}
	if(numTicks % 5) {
		tick.scale.set(0.5, 0.5, 1);
		tick.position.set(-9.5, 0, 0.15);
	}
	else {
		tick.scale.set(1, 1, 1);
		tick.position.set(-9, 0, 0.15);
		const numberTexture	= new THREEx.DynamicTexture(numberTextureWidth, numberTextureHeight);
		numberTexture.context.font	= "bolder 200px Verdana";
		numberTexture.clear("white").drawText(numTicks/5, numberTexturePosX, numberTexturePosY, "black");
		number.material = new THREE.MeshStandardMaterial( {map: numberTexture.texture} );
		number.rotation.set(0, 0, 2*Math.PI * numTicks/60 + Math.PI/2);
		number.position.set(-7.7, 0, 0.15);
		objTicks.add(number);
	}
	objTicks.add(tick);
	objTicks.rotation.set(0, 0, -2*Math.PI * numTicks/60);
	HandsFront.add(objTicks.clone());
}

// create the back hands by cloning:
const HandsBack = HandsFront.clone();
HandsBack.rotation.set(0,Math.PI,Math.PI);
HandsBack.position.set(0, 0, -0.5);

HandsFront.add(hamburg);
HandsBack.add(tokio);

// add objects to the scene:
scene.add(rim, body, HandsFront, HandsBack, ambientLight, spotlight1, spotlight2);

/************************* Render loop ********************************/
// some variables to calculate the clock
let date, seconds, minutes, hours, oldSeconds, deltaClock;
const indexSecs = 0, indexMins = 1, indexHour = 2, hoursDivHamburgTokio = 8;
const clock = new THREE.Clock();
function animate() {

	requestAnimationFrame(animate);
	date = new Date();
	seconds = date.getSeconds();  
	minutes = date.getMinutes(); 
	hours = date.getHours(); 
	
	// lets make the front clock smoooooth:
	if(seconds != oldSeconds) {
		clock.start();
		oldSeconds = seconds;
	}
	deltaClock = clock.getElapsedTime();
		
	HandsFront.children[indexSecs].rotation.z  = -2*Math.PI * (seconds + deltaClock) / 60;
	HandsFront.children[indexMins].rotation.z  = -2*Math.PI * (minutes + (seconds + deltaClock)/60) / 60;
	HandsFront.children[indexHour].rotation.z  = -2*Math.PI * (hours + (minutes + seconds/60)/60) / 12;

	// lets make the back clock a 'tick' clock:
	HandsBack.children[indexSecs].rotation.z  = -2*Math.PI * seconds/60;
	HandsBack.children[indexMins].rotation.z  = -2*Math.PI * (minutes + seconds/60) / 60;
	HandsBack.children[indexHour].rotation.z  = -2*Math.PI * (hoursDivHamburgTokio + hours + minutes/60) / 12;

	controls.update();	  
	renderer.render(scene, camera);	
}

animate();
/********************** window resize event *****************'*********/
window.addEventListener("resize", function() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
});
