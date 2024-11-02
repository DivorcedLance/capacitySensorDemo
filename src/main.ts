import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Configuración de la escena y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Control de cámara
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Luces
scene.add(new THREE.AmbientLight(0x404040, 0.5));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5).normalize();
scene.add(directionalLight);

// Escena
const sensorGeometry = new THREE.PlaneGeometry(5, 5);
const sensorMaterial = new THREE.MeshPhongMaterial({
    color: 0x656565,
    shininess: 100,
    side: THREE.DoubleSide,
    opacity: 0.7,
    transparent: true,
});
const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
sensor.rotation.x = -Math.PI / 2;
scene.add(sensor);

// Objeto de prueba
const objectGeometry = new THREE.BoxGeometry(1, 1, 1);
const objectMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100 });
const testObject = new THREE.Mesh(objectGeometry, objectMaterial);
testObject.position.set(0, 1, 0);
scene.add(testObject);

// Posicionar la cámara
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Constantes físicas
const epsilon0 = 8.854e-12; // Permisividad del vacío en F/m
const area = 0.01; // Área efectiva en m^2 (puedes ajustar este valor según el modelo)
const k = epsilon0 * area; // Constante para la capacitancia
const inductance = 1e-3; // Inductancia en henrios (1 mH)

// Interfaz de usuario
const capacitanceDisplay = document.getElementById("capacitance") as HTMLElement;
const frequencyDisplay = document.getElementById("frequency") as HTMLElement;

// Oscilador
const oscillatorContainer = document.createElement("div");
oscillatorContainer.id = "oscillator";
document.body.appendChild(oscillatorContainer);

const oscilloscope = document.createElement("canvas");
oscilloscope.width = oscillatorContainer.clientWidth;
oscilloscope.height = oscillatorContainer.clientHeight;
oscillatorContainer.appendChild(oscilloscope);
const oscilloscopeCtx = oscilloscope.getContext("2d") as CanvasRenderingContext2D;

// Escala para la frecuencia en la visualización
const frequencyScale = 1e-8;

// Función para actualizar la gráfica del oscilador
let time = 0;
function drawOscillator(frequency: number) {
    oscilloscopeCtx.clearRect(0, 0, oscilloscope.width, oscilloscope.height);
    oscilloscopeCtx.beginPath();
    const amplitude = oscilloscope.height / 3;
    
    const scaledFrequency = frequency * frequencyScale;
    const wavelength = 0.5;
    
    for (let x = 0; x < oscilloscope.width; x++) {
        const y = amplitude * Math.sin((x * wavelength * scaledFrequency) + time) + oscilloscope.height / 2;
        oscilloscopeCtx.lineTo(x, y);
    }
    oscilloscopeCtx.strokeStyle = "#00ff00";
    oscilloscopeCtx.stroke();
    
    time += frequency * frequencyScale * 0.1;
}

// Función para calcular la capacitancia en función de la distancia
function calculateCapacitance(distance: number): number {
  return k / distance;
}

// Función para calcular la frecuencia del oscilador en función de la capacitancia
function calculateFrequency(capacitance: number): number {
  return 1 / (2 * Math.PI * Math.sqrt(inductance * capacitance));
}

// Variables de movimiento del objeto
let moveUp = false;
let moveDown = false;

// Event listeners para el teclado
window.addEventListener("keydown", (event) => {
    if (event.key === "w") moveUp = true;
    if (event.key === "s") moveDown = true;
});

window.addEventListener("keyup", (event) => {
    if (event.key === "w") moveUp = false;
    if (event.key === "s") moveDown = false;
});


// Variables de movimiento del objeto y valores de capacitancia y frecuencia
let capacitance = 0;
let frequency = 0;

// Función de animación
function animate() {
  requestAnimationFrame(animate);

  // Control del movimiento del objeto
  if (moveUp) testObject.position.y += 0.01;
  if (moveDown && testObject.position.y > 0.5) testObject.position.y -= 0.01;

  // Calcular la distancia y actualizar capacitancia y frecuencia
  const distance = Math.max(0.001, testObject.position.y-0.5); // Evitar dividir por cero
  capacitance = calculateCapacitance(distance);
  frequency = calculateFrequency(capacitance);
  console.log(distance, capacitance, frequency);

  // Actualizar la interfaz
  capacitanceDisplay.textContent = capacitance.toExponential(2);
  frequencyDisplay.textContent = frequency.toExponential(2);

  // Dibujar la onda del oscilador
  drawOscillator(frequency);

  // Actualizar los controles de la cámara
  controls.update();

  // Renderizar la escena
  renderer.render(scene, camera);
}

animate();
