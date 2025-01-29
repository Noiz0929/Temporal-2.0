import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GUI } from 'lil-gui';
import TWEEN from '@tweenjs/tween.js';

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(25, 25, 50);

// Orbit Controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.update();

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Audio Setup
const listener = new THREE.AudioListener();
camera.add(listener);

// Background Music
const backgroundMusic = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('audio/BackgroundMusic.mp3', (buffer) => {
  backgroundMusic.setBuffer(buffer);
  backgroundMusic.setLoop(true);
  backgroundMusic.setVolume(0.5);
  backgroundMusic.play();
});

// Sound Effects
const soundEffects = {
  upgrade: new THREE.Audio(listener),
  meteorite: new THREE.Audio(listener),
  tornado: new THREE.Audio(listener),
  thunder: new THREE.Audio(listener),
};

// Load Sound Effects
audioLoader.load('audio/Upgrade.mp3', (buffer) => {
  soundEffects.upgrade.setBuffer(buffer);
  soundEffects.upgrade.setVolume(1.5);
});

audioLoader.load('audio/Meteor.mp3', (buffer) => {
  soundEffects.meteorite.setBuffer(buffer);
  soundEffects.meteorite.setVolume(1.0);
});

audioLoader.load('audio/Tornado.mp3', (buffer) => {
  soundEffects.tornado.setBuffer(buffer);
  soundEffects.tornado.setVolume(0.1);
});

audioLoader.load('audio/Thunder.mp3', (buffer) => {
  soundEffects.thunder.setBuffer(buffer);
  soundEffects.thunder.setVolume(0.1);
});

// Play Sound Effects
function playSound(effect) {
  if (soundEffects[effect] && !soundEffects[effect].isPlaying) {
    soundEffects[effect].play();
  }
}


// Grid Dimensions
const gridSize = 10; // 10x10 tiles per grid
const tileSize = 2; // Size of each tile
const tileHeight = 0.5; // Height of the tile (thin box)

// Initial Player Resources
const playerResources = {
  wood: 50,
  stone: 30,
  iron: 20,
  humans: 10,
  food: 40,
  nuclear: 0,
};

// Colors for 5 islands
const islandColors = [0x009000, 0x009000, 0x009000, 0x009000, 0x009000];

// Island Positions
const islandPositions = [
  { x: -25, z: -25 }, // Bottom-left
  { x: 25, z: -25 },  // Bottom-right
  { x: -25, z: 25 },  // Top-left
  { x: 25, z: 25 },   // Top-right
  { x: 0, z: 0 }      // Center
];

// Tiles and Buildings
const tiles = [];
const buildings = [];

// Function to create a grid of tiles for an island
function createIsland(color, position) {
  const tileGeometry = new THREE.BoxGeometry(tileSize, tileHeight, tileSize);
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const tileMaterial = new THREE.MeshStandardMaterial({ color });

      const tile = new THREE.Mesh(tileGeometry, tileMaterial);
      tile.position.set(
        position.x + col * tileSize,
        tileHeight / 2,
        position.z + row * tileSize
      );
      tile.castShadow = true;
      tile.receiveShadow = true;
      scene.add(tile);

      // Add edges for the tile
      const edges = new THREE.EdgesGeometry(tileGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Black stroke
      const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
      edgeLines.raycast = () => {}; // Disable raycasting for edges
      tile.add(edgeLines); // Add edges as a child of the tile

      // Store tile position for later use
      tiles.push({
        mesh: tile,
        position: tile.position.clone(),
      });
    }
  }
}

// Create five islands
for (let i = 0; i < islandColors.length; i++) {
  createIsland(islandColors[i], islandPositions[i]);
}

// Function to load a model at a specific tile
function loadModelAtTile(modelPath, tileIndex) {
  const loader = new GLTFLoader();
  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      const tile = tiles[tileIndex];

      if (tile) {
        model.position.copy(tile.position);
        model.position.y += tileHeight; // Adjust height above the tile
        model.scale.set(0.5, 0.5, 0.5); // Scale the model as needed
        scene.add(model);
      }
    },
    undefined,
    (error) => {
      console.error('An error occurred while loading the model:', error);
    }
  );
}

// Load models at specific tiles
//loadModelAtTile('model/Dragon_Evolved.gltf', 12); // Load model at tile index 12
//loadModelAtTile('model/Dragon_Evolved.gltf', 45); // Load model at tile index 45
//loadModelAtTile('model/Dragon_Evolved.gltf', 78); // Load model at tile index 78

// Building Definitions
const buildingTypes = {
  Lumberyard: {
    resourceType: "wood", // Generates wood
    resources: [{ wood: 10, stone: 5, humans: 1 }, { wood: 20, stone: 10, humans: 5 }, { wood: 40, stone: 20, iron: 5, humans: 20 }],
    generationRates: [1, 2, 4],
    modelPaths: ['model/Lumberyard_1.glb', 'model/Lumberyard_2.glb', 'model/Lumberyard_3.glb'],
    levelOffsets: [
      { x: 0, y: 0.9, z: 0 }, // Level 1 offset
      { x: 0, y: 0.8, z: 0 }, // Level 2 offset
      { x: 0, y: 0.7, z: 0 }, // Level 3 offset
    ],
    levelScales: [
      { x: 1, y: 1, z: 1 },   // Level 1 scale
      { x: 1.0, y: 1.0, z: 1.0 }, // Level 2 scale
      { x: 1.0, y: 1.0, z: 1.0 }, // Level 3 scale
    ],
  },
  Quarry: {
    resourceType: "stone", // Generates stone
    resources: [{ wood: 10, stone: 10, humans: 1 }, { wood: 20, stone: 20, iron: 5, humans: 5 }, { wood: 40, stone: 40, iron: 10, humans: 30 }],
    generationRates: [1, 2, 3],
    modelPaths: ['model/Quarry_1.glb', 'model/Quarry_2.glb', 'model/Quarry_3.glb'],
    levelOffsets: [
      { x: 0, y: 0.8, z: 0 }, // Level 1 offset
      { x: 0, y: 0.6, z: 0 }, // Level 2 offset
      { x: 0, y: 0.7, z: 0 }, // Level 3 offset
    ],
    levelScales: [
      { x: 1, y: 1, z: 1 },   // Level 1 scale
      { x: 2.1, y: 1.2, z: 2.1 }, // Level 2 scale
      { x: 1.0, y: 1.0, z: 1.0 }, // Level 3 scale
    ],
  },
  IronMine: {
    resourceType: "iron", // Generates iron
    resources: [{ wood: 20, stone: 25, iron: 5, humans: 5 }, { wood: 40, stone: 50, iron: 20, humans: 20 }, { wood: 80, stone: 100, iron: 50, humans: 100 }],
    generationRates: [1, 2, 3],
    modelPaths: ['model/IronMine_1.glb', 'model/IronMine_2.glb', 'model/IronMine_3.glb'],
    levelOffsets: [
      { x: 0, y: 0.6, z: 0 }, // Level 1 offset
      { x: 0, y: 0.5, z: 0 }, // Level 2 offset
      { x: 0, y: 0.8, z: 0 }, // Level 3 offset
    ],
    levelScales: [
      { x: 1.5, y: 1.3, z: 1.5 },   // Level 1 scale
      { x: 0.9, y: 1.0, z: 0.9 }, // Level 2 scale
      { x: 1.0, y: 1.0, z: 1.0 }, // Level 3 scale
    ],
  },
  House: {
    resourceType: "humans", // Generates humans
    resources: [{ wood: 10, stone: 5, food: 10 }, { wood: 20, stone: 30, food: 20 }, { wood: 50, stone: 50, iron: 50, food: 50 }],
    generationRates: [1, 2, 4],
    modelPaths: ['model/House_1.glb', 'model/House_2.glb', 'model/House_3.glb'],
    levelOffsets: [
      { x: 0, y: 0.8, z: 0 }, // Level 1 offset
      { x: 0, y: 1.0, z: 0 }, // Level 2 offset
      { x: 0, y: 0.1, z: 0 }, // Level 3 offset
    ],
    levelScales: [
      { x: 2, y: 2, z: 2 },   // Level 1 scale
      { x: 2.0, y: 2.0, z: 2.0 }, // Level 2 scale
      { x: 1.0, y: 1.0, z: 1.0 }, // Level 3 scale
    ],
  },
  Paddy: {
    resourceType: "food", // Generates food
    resources: [{ wood: 5, stone: 5, humans: 1 }, { wood: 20, stone: 10, humans: 10 }, { wood: 40, stone: 30, humans: 50 }],
    generationRates: [1, 2, 3],
    modelPaths: ['model/Paddy_1.glb', 'model/Paddy_2.glb', 'model/Paddy_3.glb'],
    levelOffsets: [
      { x: 0, y: 0.5, z: 0 }, // Level 1 offset
      { x: 0, y: 0.3, z: 0 }, // Level 2 offset
      { x: 0, y: 0.5, z: 0 }, // Level 3 offset
    ],
    levelScales: [
      { x: 1, y: 1, z: 1 },   // Level 1 scale
      { x: 2.0, y: 2.0, z: 2.0 }, // Level 2 scale
      { x: 2.0, y: 2.0, z: 2.0 }, // Level 3 scale
    ],
  },
  NuclearPlant: {
    resourceType: "nuclear", // Generates nuclear material
    resources: [{ wood: 100, stone: 150, iron: 200, humans: 100 }, { wood: 200, stone: 300, iron: 400, humans: 500 }, { wood: 400, stone: 600, iron: 800, humans: 1500 }],
    generationRates: [1, 2, 3],
    modelPaths: ['model/NuclearPlant_2.glb', 'model/NuclearPlant_1.glb', 'model/NuclearPlant_3.glb'],
    levelOffsets: [
      { x: 0, y: 0.6, z: 0 }, // Level 1 offset
      { x: 0, y: 0.8, z: 0 }, // Level 2 offset
      { x: 0, y: 0.8, z: 0 }, // Level 3 offset
    ],
    levelScales: [
      { x: 1, y: 1, z: 1 },   // Level 1 scale
      { x: 0.9, y: 1.2, z: 0.9 }, // Level 2 scale
      { x: 0.9, y: 1.0, z: 0.9 }, // Level 3 scale
    ],
  },
  MainBuilding: {
    resourceType: null, // Doesn't generate resources
    resources: [{ wood: 50, stone: 50, humans:5 }, { wood: 500, stone: 500, humans:50 }, { wood: 700, stone: 1000, iron: 1500, humans: 100, nuclear: 100 }, { iron: 2000, nuclear: 5000 }], // Costs for each level
    generationRates: [], // No generation
    modelPaths: ['model/MainBuilding_1.glb', 'model/MainBuilding_2.glb', 'model/MainBuilding_2.glb', 'model/MainBuilding_2.glb'],
    levelOffsets: [
      { x: 0, y: 0.5, z: 0 }, // Level 1 offset
      { x: 0, y: 0.5, z: 0 }, // Level 2 offset
      { x: 0, y: 1.5, z: 0 }, // Level 3 offset
      { x: 0, y: 1.5, z: 0 }, // Level 4 offset
    ],
    levelScales: [
      { x: 1, y: 1, z: 1 },   // Level 1 scale
      { x: 1.2, y: 1.2, z: 1.2 }, // Level 2 scale
      { x: 1.2, y: 1.2, z: 1.2 }, // Level 3 scale
      { x: 1.2, y: 1.2, z: 1.2 }, // Level 4 scale
    ],
  },
};


// Building Class
class Building {
  constructor(type, tile) {
    this.type = type;
    this.tile = tile;
    this.level = 1;
    this.model = null;
    this.isUpgrading = false;

    const data = buildingTypes[type];
    this.resources = data.resources;
    this.resourceType = data.resourceType;
    this.generationRates = data.generationRates;
    this.modelPaths = data.modelPaths;
    this.levelOffsets = data.levelOffsets || []; // Array of offsets for each level
    this.levelScales = data.levelScales || []; // Array of scales for each level

    this.loadModel();
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      this.modelPaths[this.level - 1],
      (gltf) => {
        if (this.model) {
          scene.remove(this.model);
        }
        this.model = gltf.scene;
        this.model.userData.building = this;

        // Adjust position based on tile and level offset
        const offset = this.levelOffsets[this.level - 1] || { x: 0, y: 0, z: 0 };
        this.model.position.set(
          this.tile.position.x + offset.x,
          this.tile.position.y + offset.y,
          this.tile.position.z + offset.z
        );

        // Adjust scale based on level
        const scale = this.levelScales[this.level - 1] || { x: 1, y: 1, z: 1 };
        this.model.scale.set(scale.x, scale.y, scale.z);

        scene.add(this.model);
      },
      undefined,
      (error) => console.error(`Error loading model for ${this.type} (Level ${this.level}):`, error)
    );
  }

  upgrade(playerResources) {
    if (this.level >= this.resources.length) {
      console.log(`${this.type} is already at max level!`);
      return;
    }

    const cost = this.resources[this.level];
    for (let resource in cost) {
      if (playerResources[resource] < cost[resource]) {
        console.log(`Not enough ${resource} to upgrade ${this.type}.`);
        return;
      }
    }

    for (let resource in cost) {
      playerResources[resource] -= cost[resource];
    }

    this.level++;
    this.loadModel();
    playSound('upgrade');
    console.log(`${this.type} upgraded to Level ${this.level}!`);
  }

  generateResources(playerResources) {
    const rate = this.generationRates[this.level - 1];
    const resourceType = this.resourceType;

    if (playerResources[resourceType] !== undefined) {
      playerResources[resourceType] += rate;
      console.log(`Generated ${rate} ${resourceType} from ${this.type}`);
    }
  }
}

class MainBuilding extends Building {
  constructor(tile) {
    super("MainBuilding", tile);
  }

  downgrade() {
    if (this.level > 1) {
      this.level--;
      this.loadModel();
      console.log(`Main building downgraded to Level ${this.level}.`);
    } else {
      console.log("Main building cannot be downgraded below Level 1.");
    }
  }

  upgrade(playerResources) {
    
    super.upgrade(playerResources);

    if (this.level >= this.resources.length) {
      console.log("Main building is already at max level! Game ends.");
      endGame(); // Trigger game end logic
      return;
    }
  }
}

let mainBuilding = null;

// Place main building at a specific tile (e.g., center)
const mainBuildingTile = tiles.find((tile) => tile.position.x === tileSize * 5 && tile.position.z === tileSize * 5);
if (mainBuildingTile) {
  mainBuilding = new MainBuilding(mainBuildingTile);
  mainBuildingTile.building = mainBuilding;
  buildings.push(mainBuilding);
}

// Function to create a building on a specific tile
function createBuilding(type, tile) {
  if (tile.building) {
    console.log("This tile already has a building.");
    return;
  }

  const buildingData = buildingTypes[type];
  if (!buildingData) {
    console.log("Invalid building type.");
    return;
  }

  // Check if the player has enough resources
  const cost = buildingData.resources[0]; // Cost for level 1
  for (let resource in cost) {
    if (playerResources[resource] < cost[resource]) {
      console.log(`Not enough ${resource} to build ${type}.`);
      return;
    }
  }

  // Deduct resources
  for (let resource in cost) {
    playerResources[resource] -= cost[resource];
  }

  // Create the building
  const newBuilding = new Building(type, tile);
  buildings.push(newBuilding);

  // Mark the tile as occupied
  tile.building = newBuilding;

  console.log(`${type} built on tile at position (${tile.position.x}, ${tile.position.z}).`);
}

let mode = "build"; // Can be "build" or "upgrade"
let selectedBuildingType = null;
let hoveredBuilding = null;

// Function to toggle between modes
function setMode(newMode) {
  mode = newMode;
  selectedBuildingType = null; // Reset selected building type
  hoveredBuilding = null;
  console.log(`Mode set to: ${mode}`);
}

function selectBuildingType(type) {
  if (mode !== "build") {
    setMode("build");
  }
  selectedBuildingType = type;

  // Update the resource info dynamically
    const buildingData = buildingTypes[type];
    if (buildingData) {
        const cost = buildingData.resources[0]; // Cost for level 1
        const requirements = Object.entries(cost)
            .map(([resource, amount]) => `${resource}: ${amount}`)
            .join(', ');

        resourceInfo.building = type;
        resourceInfo.requirements = requirements;
    } else {
        resourceInfo.building = 'None';
        resourceInfo.requirements = 'No data available';
    }

  console.log(`Selected building type: ${type}`);
}

function upgradeSelectedBuilding() {
  setMode("upgrade");
  console.log("Upgrade mode activated. Click a building to upgrade.");
}

// Generate resources from all buildings
function generateResources() {
  buildings.forEach((building) => {
    const rate = building.generationRates[building.level - 1];
    const resourceType = building.resourceType; // Use the resourceType from the building

    if (playerResources[resourceType] !== undefined) {
      playerResources[resourceType] += rate;
      console.log(`Generated ${rate} ${resourceType} from ${building.type}`);
    }
  });
}

function triggerMeteoriteImpact() {
  const eligibleBuildings = buildings.filter((b) => b !== mainBuilding);
  if (eligibleBuildings.length === 0) {
    console.log("No buildings to destroy.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * eligibleBuildings.length);
  const targetBuilding = eligibleBuildings[randomIndex];

  const loader = new GLTFLoader();
  loader.load('model/Meteorite.glb', (gltf) => {
    const meteor = gltf.scene;

    meteor.position.set(targetBuilding.model.position.x, 20, targetBuilding.model.position.z); // Start above the building
    meteor.scale.set(0.5, 0.5, 0.5); // Scale the meteor as needed
    scene.add(meteor);

    const startTime = performance.now();
    const duration = 2000; // 1 second
    playSound('meteorite');

    function animateMeteor() {
      const elapsedTime = performance.now() - startTime;
      const t = Math.min(elapsedTime / duration, 1);

      meteor.position.y = THREE.MathUtils.lerp(20, targetBuilding.model.position.y, t);

      if (t < 1) {
        requestAnimationFrame(animateMeteor);
      } else {
        scene.remove(meteor);

        // Destroy the building
        const tile = targetBuilding.tile;
        scene.remove(targetBuilding.model);
        tile.building = null; // Mark the tile as empty
        buildings.splice(randomIndex, 1);
        console.log("A building was destroyed by a meteorite impact!");
      }
    }

    animateMeteor();
  });
}

function triggerThunder() {
  if (buildings.length === 0) {
    console.log("No buildings to damage.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * buildings.length);
  const targetBuilding = buildings[randomIndex];

  // Create lightning VFX
  createLightningVFX(targetBuilding.model.position);

  if (targetBuilding === mainBuilding) {
    mainBuilding.downgrade();
  } else if (targetBuilding.level > 1) {
    targetBuilding.level--;
    targetBuilding.loadModel();
    console.log(`${targetBuilding.type} was downgraded by thunder.`);
  } else {
    const tile = targetBuilding.tile;
    scene.remove(targetBuilding.model);
    tile.building = null;
    buildings.splice(buildings.indexOf(targetBuilding), 1);
    console.log(`${targetBuilding.type} was destroyed by thunder.`);
  }
  playSound('thunder');
}

function triggerTornado() {
  if (buildings.length === 0) {
    console.log("No buildings to damage.");
    return;
  }

  // Select up to 3 random buildings
  const affectedBuildings = [...buildings].sort(() => 0.5 - Math.random()).slice(0, 3);

  affectedBuildings.forEach((building) => {
    // Load a new tornado model for each building
    const loader = new GLTFLoader();
    loader.load(
      'model/Tornado.glb',
      (gltf) => {
        const tornado = gltf.scene;
        tornado.scale.set(1.0, 1.0, 1.0); // Scale the tornado model
        tornado.position.set(
          building.model.position.x,
          building.model.position.y + 1.5, // Slightly above the building
          building.model.position.z
        );
        tornado.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
          }
        });
        scene.add(tornado);

        // Rotate and animate the tornado
        let angle = 0;
        const startTime = performance.now();
        const duration = 2000; // 2 seconds

        function animateTornado() {
          const elapsedTime = performance.now() - startTime;
          const t = Math.min(elapsedTime / duration, 1);

          angle += 0.1;
          tornado.rotation.y = angle; // Rotate the tornado

          if (t < 1) {
            requestAnimationFrame(animateTornado);
          } else {
            scene.remove(tornado); // Remove tornado after animation completes

            // Downgrade or destroy the building
            if (building === mainBuilding) {
              mainBuilding.downgrade();
            } else if (building.level > 1) {
              building.level--;
              building.loadModel();
              console.log(`${building.type} was downgraded by a tornado.`);
            } else {
              // Destroy the building if at level 1
              const tile = building.tile;
              scene.remove(building.model);
              tile.building = null;
              buildings.splice(buildings.indexOf(building), 1);
              console.log(`${building.type} was destroyed by a tornado.`);
            }
          }
          playSound('tornado');
        }

        animateTornado();
      },
      undefined,
      (error) => {
        console.error("Error loading tornado model:", error);
      }
    );
  });
}

function createLightningVFX(position) {
  const lightningGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10, 32);
  const lightningMaterial = new THREE.MeshBasicMaterial({ color: 0x87ceeb });
  const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);

  lightning.position.set(position.x, position.y + 5, position.z); // Strike above the building
  lightning.userData.isVFX = true;
  scene.add(lightning);

  setTimeout(() => scene.remove(lightning), 500); // Remove after 0.5 seconds
}

function randomDisasterTrigger() {
  const disasterProbability = 0.5; // 10% chance

  if (Math.random() < disasterProbability) {
    const disasters = [triggerMeteoriteImpact, triggerThunder, triggerTornado];
    const randomDisaster = disasters[Math.floor(Math.random() * disasters.length)];
    randomDisaster(); // Trigger a random disaster
  } 
}

function endGame() {
  console.log("Congratulations! You've reached the maximum level for the main building. The game is over.");
  // Add any additional game-ending logic, like stopping resource generation or showing a message
  const endMessage = document.createElement("div");
  endMessage.style.position = "absolute";
  endMessage.style.top = "50%";
  endMessage.style.left = "50%";
  endMessage.style.transform = "translate(-50%, -50%)";
  endMessage.style.padding = "20px";
  endMessage.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  endMessage.style.color = "white";
  endMessage.style.fontSize = "24px";
  endMessage.style.textAlign = "center";
  endMessage.innerText = "🎉 You win! 🎉";
  document.body.appendChild(endMessage);

  // Optionally stop the animation loop
  cancelAnimationFrame(animate);
}


// Raycaster for detecting mouse hover
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;

// Event listener for mouse movement
window.addEventListener('mousemove', (event) => {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  // Cast a ray from the camera to the mouse position
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections with objects in the scene
  const intersections = raycaster.intersectObjects(scene.children, true);

  if (intersections.length > 0) {
    let intersectedObject = intersections[0].object;

    if (intersectedObject.userData.isVFX) return;

    // Traverse up the hierarchy to find the root object if necessary
    let parentObject = intersectedObject;
    while (parentObject.parent && !parentObject.userData.building) {
      parentObject = parentObject.parent;
    }

    // Reset the previous hovered object if it's different
    if (hoveredObject && hoveredObject !== intersectedObject) {
      if (hoveredObject.material && hoveredObject.material.emissive) {
        hoveredObject.material.emissive.set(0x000000);
      }
    }

    // Highlight the current object
    hoveredObject = intersectedObject;
    if (hoveredObject.material && hoveredObject.material.emissive) {
      hoveredObject.material.emissive.set(new THREE.Color(0x555555));
    }

    // Update resource info if the object is a building
    if (parentObject.userData.building) {
      const building = parentObject.userData.building;
      const buildingType = building.type;
      const buildingLevel = building.level;

      if (!buildingTypes[buildingType]) {
        console.warn("Invalid building type:", buildingType);
        return;
      }

      const resources = buildingTypes[buildingType]?.resources;
      if (resources && buildingLevel < resources.length) {
        const upgradeData = resources[buildingLevel];
        resourceInfo.upgradeRequire = Object.entries(upgradeData)
          .map(([resource, amount]) => `${resource}: ${amount}`)
          .join(', ');
      } else {
        resourceInfo.upgradeRequire = 'No upgrade available';
      }
    } else {
      resourceInfo.upgradeRequire = 'None'; // Not a building
    }
  } else if (hoveredObject) {
    // Reset the last hovered object if no intersection
    if (hoveredObject.material && hoveredObject.material.emissive) {
      hoveredObject.material.emissive.set(0x000000);
    }
    hoveredObject = null;

    resourceInfo.upgradeRequire = 'None'; // Reset resource info
  }
});



window.addEventListener("mousedown", (event) => {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  // Cast a ray from the camera to the mouse position
  raycaster.setFromCamera(mouse, camera);

  if (mode === "build" && selectedBuildingType) {
    // Check for intersections with tiles
    const tileIntersections = raycaster.intersectObjects(
      tiles.map((tile) => tile.mesh),
      true
    );

    if (tileIntersections.length > 0) {
      const clickedTile = tiles.find((tile) => tile.mesh === tileIntersections[0].object);
      if (clickedTile) {
        createBuilding(selectedBuildingType, clickedTile);
      }
    }
  } else if (mode === "upgrade") {
    // Check for intersections with buildings
    const buildingIntersections = raycaster.intersectObjects(
      buildings.map((b) => b.model),
      true
    );

    if (buildingIntersections.length > 0) {
      let intersectedObject = buildingIntersections[0].object;

      while (intersectedObject.parent && !intersectedObject.userData.building) {
      intersectedObject = intersectedObject.parent;
      }

      hoveredBuilding = intersectedObject.userData.building;
      if (hoveredBuilding) {
        hoveredBuilding.upgrade(playerResources);
        console.log(`Upgraded ${hoveredBuilding.type} to Level ${hoveredBuilding.level}`);
      } else {
      console.log("Hovered building not found in userData.");
    }
    }
  }
});

// Update resources and UI every second
setInterval(() => {
  generateResources();
}, 1000);

setInterval(() => {
  randomDisasterTrigger();
}, 10000); // 10,000 ms = 10 seconds

// GUI
const gui = new GUI();
const resourceFolder = gui.addFolder('Resources');
Object.keys(playerResources).forEach((key) => {
  resourceFolder.add(playerResources, key).listen();
});
resourceFolder.open();

const buildFolder = gui.addFolder('Build');
Object.keys(buildingTypes).forEach((type) => {
  buildFolder.add({ [`Build ${type}`]: () => selectBuildingType(type) }, `Build ${type}`).name(`Build ${type}`);
});
buildFolder.open();

const upgradeFolder = gui.addFolder('Upgrade');
upgradeFolder.add({ Upgrade: () => upgradeSelectedBuilding() }, 'Upgrade').name('Upgrade Selected Building');
upgradeFolder.open();

const disasterFolder = gui.addFolder("Disasters");
disasterFolder.add({ Meteorite: triggerMeteoriteImpact }, "Meteorite").name("Trigger Meteorite Impact");
disasterFolder.add({ Thunder: triggerThunder }, "Thunder").name("Trigger Thunder");
disasterFolder.add({ Tornado: triggerTornado }, "Tornado").name("Trigger Tornado");
disasterFolder.open();

const audioFolder = gui.addFolder('Audio');
audioFolder.add({ toggleMusic: () => {
  if (backgroundMusic.isPlaying) {
    backgroundMusic.pause();
  } else {
    backgroundMusic.play();
  }
} }, 'toggleMusic').name('Toggle Music');

audioFolder.add({ volume: 0.5 }, 'volume', 0, 1).onChange((value) => {
  backgroundMusic.setVolume(value);
}).name('Music Volume');
audioFolder.open();

// GUI Resource Info
const requirementGUI = new GUI();
requirementGUI.domElement.style.left = '0px';
requirementGUI.domElement.style.top = '550px';
requirementGUI.domElement.style.width = '700px';
requirementGUI.domElement.style.zIndex = '9999';

const resourceInfo = {
    building: 'None',
    requirements: 'Select a building to see requirements',
    upgradeRequire: 'None',
};
const requireFolder = requirementGUI.addFolder('Resource Requirements Info');
requireFolder.add(resourceInfo, 'building').name('Building').listen();
requireFolder.add(resourceInfo, 'requirements').name('Requirements').listen();
requireFolder.add(resourceInfo, 'upgradeRequire').name('Upgrade Requirements').listen();
requireFolder.open();
// Adjust the width of the requirements folder
requireFolder.domElement.style.width = '700px';  // Increase width for better visibility

// Animation Loop
function animate() {
  TWEEN.update();  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
