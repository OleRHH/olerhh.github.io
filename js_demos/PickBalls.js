"use strict";

// * Initialize webGL and create a scene with camera and light
const canvas = document.getElementById("mycanvas");
const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true});
renderer.setClearColor('rgb(255, 255, 255)');    // set background color

const scene = new THREE.Scene();
const fov = 45;
const aspect = canvas.width / canvas.height;
const near = 0.1;
const far = 100;
const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
camera.position.set(8,18,8);
camera.lookAt(scene.position);
const light = new THREE.PointLight();
light.position.copy(camera.position.clone());
scene.add( light );
scene.add(new THREE.AmbientLight(0x606060));

// * Place balls randomly within outerRadius from center of world
const nBalls =10;
const outerRadius = 8;
const ballMinRadius = 0.5;
const ballMaxRadius = 1.5;
const balls = [];
for(let k=1; k<=nBalls; ++k) {
  // random color
  const rdColor = new THREE.Color(Math.random(), Math.random(), Math.random());
  // random radius
  const rdRadius = ballMinRadius + Math.random() * (ballMaxRadius - ballMinRadius);
  // random position
  const rd = () => 2*Math.random() - 1;  // just a helper function
  let rdPos;
  while(true) {
    rdPos = new THREE.Vector3(outerRadius*rd(), outerRadius*rd(), outerRadius*rd());
    if(rdPos.lengthSq() <= outerRadius*outerRadius) {
      break;
    }
  }

  // store all the balls within balls array
  const ball = new THREE.Mesh(new THREE.SphereBufferGeometry(rdRadius, 32, 32),
                              new THREE.MeshStandardMaterial( {color: rdColor}));
  ball.userData.radius = rdRadius;
  ball.position.copy(rdPos);
  scene.add(ball);
  balls.push(ball);
}

// * Implement picking functionionality
canvas.addEventListener('mousedown', event => {
  // calculate viewport pixel position:
  const rect = canvas.getBoundingClientRect();
  const xvp = event.clientX - rect.left;
  const yvp = event.clientY - rect.top;

  // highlight ball if it has been picked
  balls.forEach(b => pickBall(xvp, yvp, b));
});


/**
 * Find out if a ball is picked with the mouse. It it is, set the emissive color
 * of the material equal to its color.
 *
 * @param {Number} xvp the viewport x-coordinate (pixel units)
 * @param {Number} yvp the viewport y-coordinate (pixel units)
 * @param {Object} ball a THREE.Mesh storing the ball and its radius as ball.userData.radius.
 */
function pickBall(xvp, yvp, ball) {
	// viewport coordinates should be within the canvas
	console.assert(xvp>=0 && xvp<=canvas.width, 'xvp='+xvp);
	console.assert(yvp>=0 && yvp<=canvas.height, 'yvp='+yvp);

	// transform ball Matrixspace Coordinates to Camera Space Coordinates and 
	// Normalized Device Coordinates (NDC)  
	ball.userData.ballCamSpace = ball.position.clone().applyMatrix4(camera.matrixWorldInverse);
	ball.userData.ballNDC = ball.userData.ballCamSpace.clone().applyMatrix4(camera.projectionMatrix);

	// transform the mouse click coordinates from viewport to NDC 
	ball.userData.mouseCoord = new THREE.Vector3( ( 2 * xvp) / canvas.width  - 1,
										(-2 * yvp) / canvas.height + 1,
										1 );	// z = 1 means far plane in world coordinates

	// transform mouse click NDC to matrix world coordinates
	ball.userData.mouseCoord.applyMatrix4(camera.projectionMatrixInverse);
	ball.userData.mouseCoord.applyMatrix4(camera.matrixWorld);

	// check if the mouse click was in the radius of the ball
	const lineCamBall = ball.position.clone().sub(camera.position);
	const lineCamMouse = ball.userData.mouseCoord.clone().sub(camera.position);
	ball.userData.ballDist = lineCamBall.clone().sub(lineCamBall.clone().projectOnVector(lineCamMouse));

	if(ball.userData.ballDist.length() <= ball.userData.radius)
	{
		ball.userData.gotPicked = true;
		balls.forEach(b => {
			if(b.userData.gotPicked == true & b.id != ball.id)
			{
				// was another ball picked before and is closer?
				if(b.userData.ballCamSpace.z < ball.userData.ballCamSpace.z)
				{					
					b.userData.gotPicked = false;
				}
				else
				{
					ball.userData.gotPicked = false;
				}
			}
		});
	}
	else
	{
		ball.userData.gotPicked = false;
	}
	
	// last ball to check? then print out if a ball was picked and highlight it
	if(balls.every( b => (b.id <= ball.id)))
	{
		balls.forEach(b => {
			if(b.userData.gotPicked == true) 
			{	
				b.material.emissive = ball.material.color;

				console.log('normalized device coordinates of the center of the ball:');
				console.log(b.userData.ballNDC);
				console.log('camera space coordinates of the center of the ball:');
				console.log(b.userData.ballCamSpace);
				console.log('world space coordinates of the center of the ball:');
				console.log(b.position);
				console.log('distance ball-mouseclick: ' + b.userData.ballDist.length() +
							'  radius: ' + b.userData.radius);
				console.log('----------------------------------------------------');
			}
		});
	}
}


// Dehighlight ball if mouse is released
canvas.addEventListener('mouseup', function ()  {

		balls.forEach(ball => ball.material.emissive = new THREE.Color('rgb(0, 0, 0)'));
		balls.forEach(ball => ball.userData.gotPicked = false);

});


// * Render loop
const controls = new THREE.TrackballControls(camera, renderer.domElement);
function render() {
  requestAnimationFrame(render);
  controls.update();
  renderer.render(scene, camera);
}
render();
