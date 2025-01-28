// disasterSystem.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { scene, buildings, buildingTypes } from './scene.js';

const gltfLoader = new GLTFLoader();

// Select buildings by specific types for disasters
function getBuildingsByType(types) {
  return buildings.filter(building => types.includes(building.type));
}

function triggerMeteoriteImpact() {
  const targetTypes = ['Wood', 'Stone', 'Metal']; // Example of affected types
  const eligibleBuildings = getBuildingsByType(targetTypes);
  if (eligibleBuildings.length === 0) return;

  const targetBuilding = eligibleBuildings[Math.floor(Math.random() * eligibleBuildings.length)];

  gltfLoader.load('../public/Models/Island/forest/forest.gltf"', gltf => {
    const meteor = gltf.scene;
    meteor.position.set(targetBuilding.model.position.x, 20, targetBuilding.model.position.z);
    meteor.scale.set(0.5, 0.5, 0.5);
    scene.add(meteor);

    const duration = 1000;
    const startTime = performance.now();

    function animateMeteor() {
      const elapsedTime = performance.now() - startTime;
      const t = Math.min(elapsedTime / duration, 1);
      meteor.position.y = THREE.MathUtils.lerp(20, targetBuilding.model.position.y, t);

      if (t < 1) {
        requestAnimationFrame(animateMeteor);
      } else {
        scene.remove(meteor);
        scene.remove(targetBuilding.model);
        buildings.splice(buildings.indexOf(targetBuilding), 1);
        console.log(`${targetBuilding.type} building destroyed by meteorite.`);
      }
    }

    animateMeteor();
  });
}

function triggerThunder() {
  const targetTypes = ['Metal', 'Food'];
  const eligibleBuildings = getBuildingsByType(targetTypes);
  if (eligibleBuildings.length === 0) return;

  const targetBuilding = eligibleBuildings[Math.floor(Math.random() * eligibleBuildings.length)];

  const lightningGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10, 32);
  const lightningMaterial = new THREE.MeshBasicMaterial({ color: 0x87ceeb });
  const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);

  lightning.position.set(targetBuilding.model.position.x, targetBuilding.model.position.y + 5, targetBuilding.model.position.z);
  scene.add(lightning);

  setTimeout(() => scene.remove(lightning), 500);

  if (targetBuilding.level > 1) {
    targetBuilding.level--;
    targetBuilding.loadModel();
  } else {
    scene.remove(targetBuilding.model);
    buildings.splice(buildings.indexOf(targetBuilding), 1);
  }
}

function triggerTornado() {
  const targetTypes = ['Wood', 'Stone', 'Food'];
  const affectedBuildings = getBuildingsByType(targetTypes).sort(() => 0.5 - Math.random()).slice(0, 3);

  affectedBuildings.forEach(building => {
    gltfLoader.load('public/model/Tornado.gltf', gltf => {
      const tornado = gltf.scene;
      tornado.position.set(building.model.position.x, building.model.position.y + 2.5, building.model.position.z);
      tornado.scale.set(0.5, 0.5, 0.5);
      scene.add(tornado);

      let angle = 0;
      const duration = 2000;
      const startTime = performance.now();

      function animateTornado() {
        const elapsedTime = performance.now() - startTime;
        tornado.rotation.y += 0.1;

        if (elapsedTime < duration) {
          requestAnimationFrame(animateTornado);
        } else {
          scene.remove(tornado);
          if (building.level > 1) {
            building.level--;
            building.loadModel();
          } else {
            scene.remove(building.model);
            buildings.splice(buildings.indexOf(building), 1);
          }
        }
      }

      animateTornado();
    });
  });
}

function triggerEarthquake() {
  console.log("Earthquake triggered!");
  // Example of affecting all buildings in the scene
  buildings.forEach(building => {
    building.level = Math.max(1, building.level - 1);
    building.loadModel();
    console.log(`${building.type} downgraded by earthquake.`);
  });
}

function randomDisasterTrigger() {
  const disasters = [triggerMeteoriteImpact, triggerThunder, triggerTornado, triggerEarthquake];
  const randomDisaster = disasters[Math.floor(Math.random() * disasters.length)];
  randomDisaster();
}

export { triggerMeteoriteImpact, triggerThunder, triggerTornado, triggerEarthquake, randomDisasterTrigger };
