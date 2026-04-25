class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        this.player = null;
        this.weaponSystem = null;
        this.zombieManager = null;
        
        this.isRunning = false;
        this.isPaused = false;
        
        this.startTime = 0;
        this.lastFrameTime = 0;
        
        this.raycaster = new THREE.Raycaster();
        
        this.muzzleFlashEffect = null;
        
        this.hitEffects = [];
        this.hitEffectPool = [];
    }

    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLights();
        this.createEnvironment();
        
        this.player = new Player(this.scene, this.camera);
        this.weaponSystem = new WeaponSystem(this.scene, this.camera);
        this.zombieManager = new ZombieManager(this.scene);
        
        this.createMuzzleFlash();
        this.bindEvents();
        
        this.showScreen('start');
    }

    setupRenderer() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 80);
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('game-screen').appendChild(this.renderer.domElement);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404050, 0.3);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        const moonLight = new THREE.PointLight(0xaaaaff, 0.3, 100);
        moonLight.position.set(0, 50, 0);
        this.scene.add(moonLight);
    }

    createEnvironment() {
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
        const groundMaterial = Utils.createGroundMaterial();
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        const wallMaterial = Utils.createWallMaterial();
        const wallHeight = 8;
        const wallThickness = 2;
        const mapSize = 50;
        
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(mapSize * 2, wallHeight, wallThickness),
            wallMaterial
        );
        northWall.position.set(0, wallHeight / 2, -mapSize);
        northWall.receiveShadow = true;
        northWall.castShadow = true;
        this.scene.add(northWall);
        
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(mapSize * 2, wallHeight, wallThickness),
            wallMaterial
        );
        southWall.position.set(0, wallHeight / 2, mapSize);
        southWall.receiveShadow = true;
        southWall.castShadow = true;
        this.scene.add(southWall);
        
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, mapSize * 2),
            wallMaterial
        );
        eastWall.position.set(mapSize, wallHeight / 2, 0);
        eastWall.receiveShadow = true;
        eastWall.castShadow = true;
        this.scene.add(eastWall);
        
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, mapSize * 2),
            wallMaterial
        );
        westWall.position.set(-mapSize, wallHeight / 2, 0);
        westWall.receiveShadow = true;
        westWall.castShadow = true;
        this.scene.add(westWall);
        
        this.createObstacles();
        this.createStreetLamps();
    }

    createObstacles() {
        const obstaclePositions = [
            { x: -15, z: -15, type: 'car' },
            { x: 15, z: -15, type: 'car' },
            { x: -15, z: 15, type: 'barrel' },
            { x: 15, z: 15, type: 'barrel' },
            { x: 0, z: 0, type: 'fountain' },
            { x: -30, z: 0, type: 'bus_stop' },
            { x: 30, z: 0, type: 'bus_stop' },
            { x: 0, z: -30, type: 'bench' },
            { x: 0, z: 30, type: 'bench' }
        ];
        
        for (const pos of obstaclePositions) {
            this.createObstacle(pos.x, pos.z, pos.type);
        }
    }

    createObstacle(x, z, type) {
        let mesh;
        
        switch (type) {
            case 'car':
                const carBody = new THREE.BoxGeometry(4, 1.5, 2);
                const carMaterial = new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    roughness: 0.5,
                    metalness: 0.8
                });
                mesh = new THREE.Mesh(carBody, carMaterial);
                mesh.position.set(x, 1, z);
                
                const carTop = new THREE.BoxGeometry(2, 1, 1.8);
                const carTopMesh = new THREE.Mesh(carTop, carMaterial);
                carTopMesh.position.set(x - 0.5, 2.25, z);
                this.scene.add(carTopMesh);
                break;
                
            case 'barrel':
                const barrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
                const barrelMaterial = new THREE.MeshStandardMaterial({
                    color: 0x880000,
                    roughness: 0.7,
                    metalness: 0.3
                });
                mesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
                mesh.position.set(x, 0.75, z);
                break;
                
            case 'fountain':
                const fountainBase = new THREE.CylinderGeometry(3, 4, 0.5, 16);
                const stoneMaterial = new THREE.MeshStandardMaterial({
                    color: 0x808080,
                    roughness: 0.9,
                    metalness: 0.1
                });
                mesh = new THREE.Mesh(fountainBase, stoneMaterial);
                mesh.position.set(x, 0.25, z);
                
                const fountainCenter = new THREE.CylinderGeometry(0.5, 0.8, 2, 8);
                const centerMesh = new THREE.Mesh(fountainCenter, stoneMaterial);
                centerMesh.position.set(x, 1.5, z);
                this.scene.add(centerMesh);
                break;
                
            case 'bus_stop':
                const shelterRoof = new THREE.BoxGeometry(4, 0.2, 2);
                const roofMaterial = new THREE.MeshStandardMaterial({
                    color: 0x444444,
                    roughness: 0.6,
                    metalness: 0.4
                });
                const roofMesh = new THREE.Mesh(shelterRoof, roofMaterial);
                roofMesh.position.set(x, 3, z);
                this.scene.add(roofMesh);
                
                const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
                const poleMaterial = new THREE.MeshStandardMaterial({
                    color: 0x555555,
                    roughness: 0.5,
                    metalness: 0.6
                });
                
                for (let i = 0; i < 4; i++) {
                    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                    const px = x + (i % 2 === 0 ? -1.8 : 1.8);
                    const pz = z + (i < 2 ? -0.8 : 0.8);
                    pole.position.set(px, 1.5, pz);
                    this.scene.add(pole);
                }
                
                mesh = roofMesh;
                break;
                
            case 'bench':
                const benchSeat = new THREE.BoxGeometry(2, 0.1, 0.5);
                const woodMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8B4513,
                    roughness: 0.8,
                    metalness: 0.1
                });
                mesh = new THREE.Mesh(benchSeat, woodMaterial);
                mesh.position.set(x, 0.6, z);
                
                const benchBack = new THREE.BoxGeometry(2, 0.8, 0.1);
                const backMesh = new THREE.Mesh(benchBack, woodMaterial);
                backMesh.position.set(x, 1, z + 0.25);
                this.scene.add(backMesh);
                break;
        }
        
        if (mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        }
    }

    createStreetLamps() {
        const lampPositions = [
            { x: -25, z: -25 },
            { x: 25, z: -25 },
            { x: -25, z: 25 },
            { x: 25, z: 25 },
            { x: -25, z: 0 },
            { x: 25, z: 0 },
            { x: 0, z: -25 },
            { x: 0, z: 25 }
        ];
        
        for (const pos of lampPositions) {
            this.createStreetLamp(pos.x, pos.z);
        }
    }

    createStreetLamp(x, z) {
        const poleGeometry = new THREE.CylinderGeometry(0.15, 0.2, 6, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.6,
            metalness: 0.5
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, 3, z);
        pole.castShadow = true;
        this.scene.add(pole);
        
        const armGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.1);
        const arm = new THREE.Mesh(armGeometry, poleMaterial);
        arm.position.set(x + 0.75, 5.8, z);
        this.scene.add(arm);
        
        const lampGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const lampMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffaa,
            emissive: 0xffff00,
            emissiveIntensity: 0.5,
            roughness: 0.3
        });
        const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
        lamp.position.set(x + 1.5, 5.6, z);
        this.scene.add(lamp);
        
        const pointLight = new THREE.PointLight(0xffffaa, 0.8, 15);
        pointLight.position.set(x + 1.5, 5.5, z);
        this.scene.add(pointLight);
    }

    createMuzzleFlash() {
        const flashGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0
        });
        this.muzzleFlashEffect = new THREE.Mesh(flashGeometry, flashMaterial);
        this.muzzleFlashEffect.visible = false;
        this.scene.add(this.muzzleFlashEffect);
    }

    showMuzzleFlash(position) {
        if (!this.muzzleFlashEffect) return;
        
        this.muzzleFlashEffect.position.copy(position);
        this.muzzleFlashEffect.visible = true;
        this.muzzleFlashEffect.material.opacity = 1;
        
        setTimeout(() => {
            if (this.muzzleFlashEffect) {
                this.muzzleFlashEffect.visible = false;
            }
        }, 50);
    }

    createHitEffect(position) {
        let effect = this.hitEffectPool.find(e => !e.visible);
        
        if (!effect && this.hitEffectPool.length < 20) {
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8
            });
            effect = new THREE.Mesh(geometry, material);
            this.hitEffectPool.push(effect);
            this.scene.add(effect);
        }
        
        if (effect) {
            effect.position.copy(position);
            effect.visible = true;
            effect.scale.setScalar(1, 1, 1);
            effect.material.opacity = 0.8;
            effect.userData = { life: 0.3 };
        }
    }

    updateHitEffects(deltaTime) {
        for (const effect of this.hitEffectPool) {
            if (!effect.visible) continue;
            
            effect.userData.life -= deltaTime;
            
            if (effect.userData.life <= 0) {
                effect.visible = false;
                continue;
            }
            
            const lifeRatio = effect.userData.life / 0.3;
            effect.scale.setScalar(1 + (1 - lifeRatio) * 2, 1 + (1 - lifeRatio) * 2, 1 + (1 - lifeRatio) * 2);
            effect.material.opacity = lifeRatio * 0.8;
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    showScreen(screenName) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    startGame() {
        this.reset();
        this.isRunning = true;
        this.startTime = performance.now();
        this.lastFrameTime = performance.now();
        
        this.showScreen('game');
        document.body.requestPointerLock();
        
        this.animate();
    }

    restartGame() {
        this.startGame();
    }

    reset() {
        if (this.player) {
            this.player.reset();
        }
        if (this.weaponSystem) {
            this.weaponSystem.reset();
        }
        if (this.zombieManager) {
            this.zombieManager.reset();
        }
        
        for (const effect of this.hitEffectPool) {
            effect.visible = false;
        }
        
        if (this.muzzleFlashEffect) {
            this.muzzleFlashEffect.visible = false;
        }
    }

    gameOver() {
        this.isRunning = false;
        
        const survivalTime = Math.floor((performance.now() - this.startTime) / 1000);
        
        document.getElementById('final-score').textContent = `击杀: ${this.zombieManager.getKills()}`;
        document.getElementById('survival-time').textContent = `生存时间: ${survivalTime}秒`;
        
        this.showScreen('game-over');
        
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.render();
    }

    update(deltaTime) {
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        if (this.weaponSystem && this.player) {
            const fireData = this.weaponSystem.update(
                deltaTime,
                this.player.position,
                this.player.rotation
            );
            
            if (fireData && fireData.muzzleFlash) {
                const forward = this.player.getForwardDirection();
                const flashPos = this.camera.position.clone();
                flashPos.add(forward.clone().multiplyScalar(0.8));
                
                const right = this.player.getRightDirection();
                flashPos.add(right.clone().multiplyScalar(0.25));
                flashPos.y -= 0.15;
                
                this.showMuzzleFlash(flashPos);
            }
            
            if (fireData) {
                this.processFire(fireData);
            }
        }
        
        if (this.zombieManager && this.player) {
            const result = this.zombieManager.update(deltaTime, this.player.position);
            
            if (result) {
                if (result.type === 'playerDamage') {
                    if (this.player.takeDamage(result.damage)) {
                        this.gameOver();
                    }
                } else if (result.type === 'waveChange') {
                    this.zombieManager.updateScoreUI();
                }
            }
        }
        
        this.updateHitEffects(deltaTime);
    }

    processFire(fireData) {
        const camera = this.camera;
        const screenCenter = new THREE.Vector2(0, 0);
        
        this.raycaster.setFromCamera(screenCenter, camera);
        
        const isFlamethrower = fireData.range === 15;
        const projectiles = isFlamethrower ? 1 : fireData.projectiles;
        
        for (let i = 0; i < projectiles; i++) {
            const raycaster = isFlamethrower ? this.createFlamethrowerRay(camera, fireData.spread) : this.raycaster;
            
            const hitResult = this.zombieManager.checkHit(raycaster, fireData.damage, isFlamethrower);
            
            if (hitResult) {
                if (hitResult.type === 'hit' || hitResult.type === 'kill') {
                    const zombie = hitResult.zombie;
                    const hitPos = zombie.position.clone();
                    hitPos.y += 1;
                    this.createHitEffect(hitPos);
                    
                    if (hitResult.type === 'kill') {
                        this.zombieManager.updateScoreUI();
                    }
                }
            }
        }
    }

    createFlamethrowerRay(camera, spread) {
        const raycaster = new THREE.Raycaster();
        
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion);
        
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(camera.quaternion);
        
        const spreadX = (Math.random() - 0.5) * spread * 2;
        const spreadY = (Math.random() - 0.5) * spread * 2;
        
        const direction = forward.clone();
        direction.add(right.clone().multiplyScalar(spreadX));
        direction.add(up.clone().multiplyScalar(spreadY));
        direction.normalize();
        
        raycaster.set(camera.position.clone(), direction);
        
        return raycaster;
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
