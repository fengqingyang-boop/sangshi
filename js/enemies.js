class Zombie {
    constructor(scene, position, config = {}) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = new THREE.Vector3();
        
        this.maxHealth = config.health || 80;
        this.health = this.maxHealth;
        this.speed = config.speed || 3;
        this.damage = config.damage || 10;
        this.attackRange = config.attackRange || 2;
        this.attackCooldown = config.attackCooldown || 1.5;
        
        this.lastAttackTime = 0;
        this.isDead = false;
        this.isAttacking = false;
        
        this.rotation = 0;
        this.targetRotation = 0;
        
        this.state = 'idle';
        this.animState = 0;
        this.animSpeed = 5;
        
        this.burning = false;
        this.burnDamage = 0;
        this.burnTime = 0;
        this.burnTick = 0;
        
        this.model = null;
        this.bodyParts = {};
        
        this.createModel();
    }

    createModel() {
        const group = new THREE.Group();
        
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a7a5a,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const clothesMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const bodyGeometry = new THREE.CapsuleGeometry(0.25, 0.6, 4, 8);
        const body = new THREE.Mesh(bodyGeometry, clothesMaterial);
        body.position.y = 0.9;
        group.add(body);
        this.bodyParts.body = body;
        
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 6);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.y = 1.55;
        group.add(head);
        this.bodyParts.head = head;
        
        const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0x330000,
            roughness: 0.3,
            metalness: 0.5
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 1.58, -0.2);
        group.add(leftEye);
        this.bodyParts.leftEye = leftEye;
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 1.58, -0.2);
        group.add(rightEye);
        this.bodyParts.rightEye = rightEye;
        
        const armGeometry = new THREE.CapsuleGeometry(0.08, 0.4, 4, 6);
        
        const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
        leftArm.position.set(-0.35, 1.0, 0);
        leftArm.rotation.z = 0.3;
        group.add(leftArm);
        this.bodyParts.leftArm = leftArm;
        
        const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
        rightArm.position.set(0.35, 1.0, 0);
        rightArm.rotation.z = -0.3;
        group.add(rightArm);
        this.bodyParts.rightArm = rightArm;
        
        const legGeometry = new THREE.CapsuleGeometry(0.1, 0.4, 4, 6);
        
        const leftLeg = new THREE.Mesh(legGeometry, clothesMaterial);
        leftLeg.position.set(-0.15, 0.4, 0);
        group.add(leftLeg);
        this.bodyParts.leftLeg = leftLeg;
        
        const rightLeg = new THREE.Mesh(legGeometry, clothesMaterial);
        rightLeg.position.set(0.15, 0.4, 0);
        group.add(rightLeg);
        this.bodyParts.rightLeg = rightLeg;
        
        group.position.copy(this.position);
        this.model = group;
        this.scene.add(group);
    }

    update(deltaTime, playerPosition) {
        if (this.isDead) return;
        
        if (this.burning) {
            this.burnTime -= deltaTime;
            this.burnTick -= deltaTime;
            
            if (this.burnTick <= 0) {
                this.takeDamage(this.burnDamage);
                this.burnTick = 0.5;
            }
            
            if (this.burnTime <= 0) {
                this.burning = false;
            }
        }
        
        const distanceToPlayer = Utils.distance2D(this.position, playerPosition);
        
        if (distanceToPlayer <= this.attackRange) {
            this.state = 'attack';
            this.attack(playerPosition);
        } else {
            this.state = 'chase';
            this.chasePlayer(deltaTime, playerPosition);
        }
        
        this.updateAnimation(deltaTime);
        this.model.position.copy(this.position);
        this.model.rotation.y = this.rotation;
    }

    chasePlayer(deltaTime, playerPosition) {
        const direction = new THREE.Vector3(
            playerPosition.x - this.position.x,
            0,
            playerPosition.z - this.position.z
        ).normalize();
        
        this.targetRotation = Math.atan2(direction.x, direction.z);
        
        this.rotation = Utils.lerp(
            this.rotation,
            this.targetRotation,
            deltaTime * 5
        );
        
        const moveSpeed = this.speed * deltaTime;
        this.position.x += direction.x * moveSpeed;
        this.position.z += direction.z * moveSpeed;
        
        const mapSize = 45;
        this.position.x = Utils.clamp(this.position.x, -mapSize, mapSize);
        this.position.z = Utils.clamp(this.position.z, -mapSize, mapSize);
    }

    attack(playerPosition) {
        const now = performance.now() / 1000;
        
        if ((now - this.lastAttackTime) >= this.attackCooldown) {
            this.lastAttackTime = now;
            this.isAttacking = true;
            
            return { damage: this.damage };
        }
        return null;
    }

    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.die();
            return true;
        }
        
        this.flashDamage();
        return false;
    }

    setBurning(damage, duration) {
        this.burning = true;
        this.burnDamage = damage;
        this.burnTime = duration;
        this.burnTick = 0;
    }

    flashDamage() {
        for (const key in this.bodyParts) {
            const part = this.bodyParts[key];
            if (part.material && part.material.emissive) {
                part.material.emissive.setHex(0x550000);
                setTimeout(() => {
                    part.material.emissive.setHex(0x000000);
                }, 100);
            }
        }
    }

    die() {
        this.isDead = true;
        this.model.visible = false;
    }

    updateAnimation(deltaTime) {
        if (this.state === 'chase') {
            this.animState += deltaTime * this.animSpeed;
            
            const legSwing = Math.sin(this.animState * 2) * 0.5;
            const armSwing = Math.sin(this.animState * 2 + Math.PI) * 0.5;
            
            this.bodyParts.leftLeg.rotation.x = legSwing;
            this.bodyParts.rightLeg.rotation.x = -legSwing;
            this.bodyParts.leftArm.rotation.x = armSwing;
            this.bodyParts.rightArm.rotation.x = -armSwing;
        } else if (this.state === 'attack') {
            this.animState += deltaTime * 10;
            const attackSwing = Math.sin(this.animState) * 0.8;
            
            this.bodyParts.leftArm.rotation.x = attackSwing;
            this.bodyParts.rightArm.rotation.x = attackSwing;
        }
    }

    reset(position) {
        this.position.copy(position);
        this.health = this.maxHealth;
        this.isDead = false;
        this.isAttacking = false;
        this.state = 'idle';
        this.burning = false;
        this.lastAttackTime = 0;
        this.animState = 0;
        
        if (this.model) {
            this.model.visible = true;
            this.model.position.copy(position);
        }
    }

    destroy() {
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
        }
    }
}

class ZombieManager {
    constructor(scene) {
        this.scene = scene;
        this.zombies = [];
        this.maxZombies = 10;
        this.spawnInterval = 3;
        this.lastSpawnTime = 0;
        this.wave = 1;
        this.zombiesKilled = 0;
        
        this.waveConfig = {
            1: { maxZombies: 5, health: 60, speed: 2.5, damage: 8, spawnInterval: 4 },
            2: { maxZombies: 8, health: 70, speed: 3, damage: 10, spawnInterval: 3.5 },
            3: { maxZombies: 12, health: 80, speed: 3.5, damage: 12, spawnInterval: 3 },
            4: { maxZombies: 15, health: 90, speed: 4, damage: 15, spawnInterval: 2.5 },
            5: { maxZombies: 20, health: 100, speed: 4.5, damage: 18, spawnInterval: 2 }
        };
        
        this.waveKillsRequired = {
            1: 10,
            2: 20,
            3: 35,
            4: 50,
            5: 100
        };
        
        this.pendingKills = 0;
    }

    getCurrentWaveConfig() {
        const waveNum = Math.min(this.wave, 5);
        return this.waveConfig[waveNum];
    }

    getKillsRequiredForCurrentWave() {
        const waveNum = Math.min(this.wave, 5);
        return this.waveKillsRequired[waveNum];
    }

    getSpawnPosition(playerPosition) {
        const minDistance = 20;
        const maxDistance = 40;
        
        let attempts = 0;
        while (attempts < 50) {
            const point = Utils.randomPointInCircle(minDistance, maxDistance);
            const spawnPos = new THREE.Vector3(point.x, 1, point.z);
            
            spawnPos.x += playerPosition.x;
            spawnPos.z += playerPosition.z;
            
            spawnPos.x = Utils.clamp(spawnPos.x, -45, 45);
            spawnPos.z = Utils.clamp(spawnPos.z, -45, 45);
            
            const distToPlayer = Utils.distance2D(spawnPos, playerPosition);
            if (distToPlayer >= minDistance) {
                return spawnPos;
            }
            attempts++;
        }
        
        const angle = Math.random() * Math.PI * 2;
        const radius = 30;
        return new THREE.Vector3(
            playerPosition.x + Math.cos(angle) * radius,
            1,
            playerPosition.z + Math.sin(angle) * radius
        );
    }

    spawnZombie(playerPosition) {
        const config = this.getCurrentWaveConfig();
        const activeZombies = this.zombies.filter(z => !z.isDead).length;
        
        if (activeZombies >= config.maxZombies) return null;
        
        const spawnPos = this.getSpawnPosition(playerPosition);
        
        const zombie = new Zombie(this.scene, spawnPos, {
            health: config.health,
            speed: config.speed,
            damage: config.damage,
            attackRange: 2,
            attackCooldown: 1.5
        });
        
        this.zombies.push(zombie);
        return zombie;
    }

    update(deltaTime, playerPosition) {
        const config = this.getCurrentWaveConfig();
        
        const now = performance.now() / 1000;
        if ((now - this.lastSpawnTime) >= config.spawnInterval) {
            this.spawnZombie(playerPosition);
            this.lastSpawnTime = now;
        }
        
        for (const zombie of this.zombies) {
            if (!zombie.isDead) {
                const attackResult = zombie.update(deltaTime, playerPosition);
                
                if (attackResult) {
                    const distToPlayer = Utils.distance2D(zombie.position, playerPosition);
                    if (distToPlayer <= zombie.attackRange) {
                        return { type: 'playerDamage', damage: attackResult.damage };
                    }
                }
            }
        }
        
        if (this.pendingKills > 0) {
            const killsRequired = this.getKillsRequiredForCurrentWave();
            if (this.zombiesKilled >= killsRequired) {
                this.wave++;
                this.zombiesKilled = 0;
                this.pendingKills = 0;
                this.updateWaveUI();
                return { type: 'waveChange', wave: this.wave };
            }
            this.pendingKills = 0;
        }
        
        return null;
    }

    checkHit(raycaster, damage, isFlamethrower = false) {
        const activeZombies = this.zombies.filter(z => !z.isDead);
        if (activeZombies.length === 0) return null;
        
        const meshes = [];
        const zombieMap = new Map();
        
        for (const zombie of activeZombies) {
            if (zombie.model) {
                zombie.model.traverse((child) => {
                    if (child.isMesh) {
                        meshes.push(child);
                        zombieMap.set(child, zombie);
                    }
                });
            }
        }
        
        const intersects = raycaster.intersectObjects(meshes);
        
        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            const zombie = zombieMap.get(hitObject);
            
            if (zombie) {
                if (isFlamethrower) {
                    zombie.setBurning(damage, 2);
                }
                
                const isHeadshot = hitObject === zombie.bodyParts.head;
                const actualDamage = isHeadshot ? damage * 2 : damage;
                
                if (zombie.takeDamage(actualDamage)) {
                    this.zombiesKilled++;
                    this.pendingKills++;
                    return { 
                        type: 'kill', 
                        zombie: zombie,
                        isHeadshot: isHeadshot
                    };
                }
                
                return { 
                    type: 'hit', 
                    zombie: zombie,
                    isHeadshot: isHeadshot
                };
            }
        }
        
        return null;
    }

    updateWaveUI() {
        const waveElement = document.getElementById('wave');
        waveElement.textContent = `波次: ${this.wave}`;
    }

    updateScoreUI() {
        const scoreElement = document.getElementById('score');
        scoreElement.textContent = `击杀: ${this.zombiesKilled}`;
    }

    getKills() {
        return this.zombiesKilled;
    }

    getWave() {
        return this.wave;
    }

    reset() {
        for (const zombie of this.zombies) {
            zombie.destroy();
        }
        this.zombies = [];
        
        this.wave = 1;
        this.zombiesKilled = 0;
        this.pendingKills = 0;
        this.lastSpawnTime = 0;
        
        this.updateWaveUI();
        this.updateScoreUI();
    }
}
