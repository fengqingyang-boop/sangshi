class Weapon {
    constructor(name, config) {
        this.name = name;
        this.damage = config.damage || 20;
        this.fireRate = config.fireRate || 0.5;
        this.maxAmmo = config.maxAmmo || 30;
        this.maxReserve = config.maxReserve || 120;
        this.reloadTime = config.reloadTime || 2;
        this.spread = config.spread || 0.02;
        this.projectiles = config.projectiles || 1;
        this.automatic = config.automatic || false;
        this.range = config.range || 50;
        this.muzzleFlash = config.muzzleFlash || false;
        
        this.currentAmmo = this.maxAmmo;
        this.reserveAmmo = this.maxReserve;
        this.lastFireTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.isFiring = false;
        
        this.model = null;
        this.muzzleFlashModel = null;
    }

    canFire() {
        if (this.isReloading) return false;
        if (this.currentAmmo <= 0) return false;
        
        const now = performance.now() / 1000;
        return (now - this.lastFireTime) >= this.fireRate;
    }

    fire() {
        if (!this.canFire()) return null;
        
        this.currentAmmo--;
        this.lastFireTime = performance.now() / 1000;
        
        const fireData = {
            damage: this.damage,
            spread: this.spread,
            projectiles: this.projectiles,
            range: this.range,
            muzzleFlash: this.muzzleFlash
        };
        
        return fireData;
    }

    startReload() {
        if (this.isReloading || this.currentAmmo === this.maxAmmo || this.reserveAmmo <= 0) return false;
        
        this.isReloading = true;
        this.reloadStartTime = performance.now() / 1000;
        return true;
    }

    updateReload() {
        if (!this.isReloading) return false;
        
        const now = performance.now() / 1000;
        if ((now - this.reloadStartTime) >= this.reloadTime) {
            this.finishReload();
            return true;
        }
        return false;
    }

    finishReload() {
        const ammoNeeded = this.maxAmmo - this.currentAmmo;
        const ammoToAdd = Math.min(ammoNeeded, this.reserveAmmo);
        
        this.currentAmmo += ammoToAdd;
        this.reserveAmmo -= ammoToAdd;
        this.isReloading = false;
    }

    cancelReload() {
        this.isReloading = false;
    }

    addReserveAmmo(amount) {
        this.reserveAmmo = Math.min(this.reserveAmmo + amount, this.maxReserve);
    }

    getAmmoDisplay() {
        return `${this.currentAmmo}/${this.reserveAmmo}`;
    }

    createModel(scene) {
        const group = new THREE.Group();
        this.model = group;
        return group;
    }

    updateModel(position, rotation) {
        if (this.model) {
            this.model.position.copy(position);
            this.model.rotation.copy(rotation);
        }
    }
}

class Revolver extends Weapon {
    constructor() {
        super('左轮手枪', {
            damage: 40,
            fireRate: 0.6,
            maxAmmo: 6,
            maxReserve: 36,
            reloadTime: 2.5,
            spread: 0.015,
            projectiles: 1,
            automatic: false,
            range: 60,
            muzzleFlash: true
        });
    }

    createModel(scene) {
        const group = new THREE.Group();
        
        const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.2;
        group.add(barrel);
        
        const cylinderGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8);
        const cylinder = new THREE.Mesh(cylinderGeometry, barrelMaterial);
        cylinder.rotation.x = Math.PI / 2;
        cylinder.position.z = -0.08;
        group.add(cylinder);
        
        const frameGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.15);
        const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.3, roughness: 0.7 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.z = 0.02;
        frame.position.y = -0.02;
        group.add(frame);
        
        const handleGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.08);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, metalness: 0.2, roughness: 0.8 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.x = -0.3;
        handle.position.y = -0.12;
        handle.position.z = 0.05;
        group.add(handle);
        
        const triggerGeometry = new THREE.BoxGeometry(0.03, 0.04, 0.02);
        const triggerMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.4 });
        const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
        trigger.position.y = -0.07;
        trigger.position.z = 0.02;
        group.add(trigger);
        
        group.position.set(0.3, -0.2, -0.5);
        
        this.model = group;
        scene.add(group);
        return group;
    }
}

class SMG extends Weapon {
    constructor() {
        super('冲锋枪', {
            damage: 15,
            fireRate: 0.1,
            maxAmmo: 30,
            maxReserve: 120,
            reloadTime: 2.0,
            spread: 0.04,
            projectiles: 1,
            automatic: true,
            range: 40,
            muzzleFlash: true
        });
    }

    createModel(scene) {
        const group = new THREE.Group();
        
        const bodyGeometry = new THREE.BoxGeometry(0.06, 0.1, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.4 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.z = -0.15;
        group.add(body);
        
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.45;
        group.add(barrel);
        
        const magazineGeometry = new THREE.BoxGeometry(0.04, 0.15, 0.06);
        const magazineMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 });
        const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial);
        magazine.position.y = -0.13;
        magazine.position.z = -0.05;
        group.add(magazine);
        
        const handleGeometry = new THREE.BoxGeometry(0.05, 0.12, 0.06);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.4, roughness: 0.6 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.x = -0.2;
        handle.position.y = -0.1;
        handle.position.z = 0.08;
        group.add(handle);
        
        const stockGeometry = new THREE.BoxGeometry(0.05, 0.08, 0.15);
        const stockMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.3, roughness: 0.7 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.z = 0.1;
        group.add(stock);
        
        const sightGeometry = new THREE.BoxGeometry(0.02, 0.03, 0.05);
        const sightMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
        const sight = new THREE.Mesh(sightGeometry, sightMaterial);
        sight.position.y = 0.07;
        sight.position.z = -0.2;
        group.add(sight);
        
        group.position.set(0.25, -0.15, -0.5);
        
        this.model = group;
        scene.add(group);
        return group;
    }
}

class Flamethrower extends Weapon {
    constructor() {
        super('喷火器', {
            damage: 8,
            fireRate: 0.05,
            maxAmmo: 100,
            maxReserve: 300,
            reloadTime: 3.0,
            spread: 0.15,
            projectiles: 5,
            automatic: true,
            range: 15,
            muzzleFlash: false
        });
        
        this.flameParticles = [];
        this.flamePool = [];
        this.maxParticles = 50;
    }

    createModel(scene) {
        const group = new THREE.Group();
        
        const tankGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12);
        const tankMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.rotation.x = Math.PI / 2;
        tank.position.z = 0.05;
        group.add(tank);
        
        const bodyGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.25);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.5 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.z = -0.15;
        group.add(body);
        
        const nozzleGeometry = new THREE.CylinderGeometry(0.04, 0.02, 0.15, 8);
        const nozzleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
        const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.z = -0.35;
        group.add(nozzle);
        
        const handleGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.06);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.4, roughness: 0.7 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.x = -0.3;
        handle.position.y = -0.12;
        handle.position.z = 0;
        group.add(handle);
        
        const hoseGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 6);
        const hoseMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.3, roughness: 0.8 });
        const hose = new THREE.Mesh(hoseGeometry, hoseMaterial);
        hose.rotation.x = Math.PI / 2;
        hose.rotation.z = 0.3;
        hose.position.z = -0.05;
        hose.position.y = -0.05;
        group.add(hose);
        
        group.position.set(0.2, -0.15, -0.5);
        
        this.model = group;
        scene.add(group);
        return group;
    }

    createFlameParticle() {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.visible = false;
        return particle;
    }

    emitFlame(position, direction, scene) {
        let particle = this.flamePool.find(p => !p.visible);
        
        if (!particle && this.flamePool.length < this.maxParticles) {
            particle = this.createFlameParticle();
            this.flamePool.push(particle);
            scene.add(particle);
        }
        
        if (particle) {
            particle.visible = true;
            particle.position.copy(position);
            
            particle.userData = {
                velocity: direction.clone().multiplyScalar(15 + Math.random() * 5),
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.5 + Math.random() * 0.3,
                startSize: 0.05 + Math.random() * 0.1,
                velocityOffset: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                )
            };
            
            particle.scale.setScalar(particle.userData.startSize, particle.userData.startSize, particle.userData.startSize);
        }
    }

    updateFlames(deltaTime) {
        for (const particle of this.flamePool) {
            if (!particle.visible) continue;
            
            const data = particle.userData;
            data.life -= deltaTime;
            
            if (data.life <= 0) {
                particle.visible = false;
                continue;
            }
            
            const lifeRatio = data.life / data.maxLife;
            
            particle.position.add(data.velocity.clone().multiplyScalar(deltaTime));
            particle.position.add(data.velocityOffset.clone().multiplyScalar(deltaTime * 2));
            
            const scale = data.startSize * (1 + (1 - lifeRatio) * 2);
            particle.scale.setScalar(scale, scale, scale);
            
            const material = particle.material;
            material.opacity = lifeRatio * 0.8;
            
            if (lifeRatio > 0.7) {
                material.color.setHex(0xffffff);
            } else if (lifeRatio > 0.4) {
                material.color.setHex(0xffaa00);
            } else {
                material.color.setHex(0xff3300);
            }
        }
    }

    hideAllFlames() {
        for (const particle of this.flamePool) {
            particle.visible = false;
        }
    }
}

class WeaponSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.weapons = [];
        this.currentWeaponIndex = 0;
        this.currentWeapon = null;
        
        this.isMouseDown = false;
        this.targetPosition = new THREE.Vector3();
        this.targetRotation = new THREE.Euler();
        
        this.recoil = 0;
        this.recoilTarget = 0;
        
        this.init();
    }

    init() {
        this.weapons.push(new Revolver());
        this.weapons.push(new SMG());
        this.weapons.push(new Flamethrower());
        
        for (const weapon of this.weapons) {
            weapon.createModel(this.scene);
            weapon.model.visible = false;
        }
        
        this.selectWeapon(0);
        
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('wheel', (e) => this.onWheel(e));
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    onMouseDown(e) {
        if (e.button === 0) {
            this.isMouseDown = true;
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.isMouseDown = false;
        }
    }

    onWheel(e) {
        e.preventDefault();
        if (e.deltaY > 0) {
            this.nextWeapon();
        } else {
            this.previousWeapon();
        }
    }

    onKeyDown(e) {
        switch (e.code) {
            case 'Digit1':
                this.selectWeapon(0);
                break;
            case 'Digit2':
                this.selectWeapon(1);
                break;
            case 'Digit3':
                this.selectWeapon(2);
                break;
            case 'KeyR':
                this.reload();
                break;
        }
    }

    selectWeapon(index) {
        if (index === this.currentWeaponIndex) return;
        if (index < 0 || index >= this.weapons.length) return;
        
        if (this.currentWeapon) {
            this.currentWeapon.model.visible = false;
            this.currentWeapon.cancelReload();
            
            if (this.currentWeapon instanceof Flamethrower) {
                this.currentWeapon.hideAllFlames();
            }
        }
        
        this.currentWeaponIndex = index;
        this.currentWeapon = this.weapons[index];
        this.currentWeapon.model.visible = true;
        
        this.updateWeaponUI();
        this.updateWeaponSlots();
    }

    nextWeapon() {
        const nextIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        this.selectWeapon(nextIndex);
    }

    previousWeapon() {
        const prevIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
        this.selectWeapon(prevIndex);
    }

    reload() {
        if (this.currentWeapon) {
            this.currentWeapon.startReload();
        }
    }

    update(deltaTime, playerPosition, playerRotation) {
        if (!this.currentWeapon) return;
        
        this.currentWeapon.updateReload();
        
        const shouldFire = this.isMouseDown && 
            (this.currentWeapon.automatic || this.isMouseDown);
        
        let fireData = null;
        if (shouldFire && this.currentWeapon.canFire()) {
            fireData = this.currentWeapon.fire();
            if (fireData) {
                this.recoilTarget = 0.1;
                this.updateWeaponUI();
            }
        }
        
        if (this.currentWeapon instanceof Flamethrower) {
            if (shouldFire && fireData) {
                const flamePosition = this.camera.position.clone();
                const forward = new THREE.Vector3(0, 0, -1);
                forward.applyQuaternion(this.camera.quaternion);
                
                const muzzleOffset = forward.clone().multiplyScalar(0.6);
                const rightOffset = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).multiplyScalar(0.25);
                const upOffset = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion).multiplyScalar(-0.15);
                
                flamePosition.add(muzzleOffset).add(rightOffset).add(upOffset);
                
                for (let i = 0; i < 3; i++) {
                    const spreadDir = forward.clone();
                    spreadDir.x += (Math.random() - 0.5) * 0.3;
                    spreadDir.y += (Math.random() - 0.5) * 0.3;
                    spreadDir.normalize();
                    
                    this.currentWeapon.emitFlame(flamePosition.clone(), spreadDir, this.scene);
                }
            }
            this.currentWeapon.updateFlames(deltaTime);
        }
        
        this.recoil = Utils.lerp(this.recoil, this.recoilTarget, deltaTime * 10);
        this.recoilTarget = Utils.lerp(this.recoilTarget, 0, deltaTime * 5);
        
        this.updateWeaponPosition(deltaTime);
        
        return fireData;
    }

    updateWeaponPosition(deltaTime) {
        if (!this.currentWeapon || !this.currentWeapon.model) return;
        
        const basePosition = new THREE.Vector3(0.25, -0.15, -0.5);
        const baseRotation = new THREE.Euler(0, 0, 0);
        
        const swayAmount = 0.02;
        const time = performance.now() / 1000;
        const swayX = Math.sin(time * 2) * swayAmount;
        const swayY = Math.cos(time * 4) * swayAmount * 0.5;
        
        basePosition.x += swayX;
        basePosition.y += swayY;
        
        basePosition.z -= this.recoil * 0.3;
        baseRotation.x += this.recoil * 0.5;
        
        const model = this.currentWeapon.model;
        
        const targetPos = this.camera.position.clone();
        const euler = new THREE.Euler(
            this.camera.rotation.x + baseRotation.x,
            this.camera.rotation.y,
            0,
            'YXZ'
        );
        
        const offset = basePosition.clone();
        offset.applyEuler(euler);
        
        targetPos.add(offset);
        
        model.position.lerp(targetPos, 0.3);
        model.rotation.copy(euler);
    }

    updateWeaponUI() {
        if (!this.currentWeapon) return;
        
        const weaponName = document.getElementById('weapon-name');
        const ammoInfo = document.getElementById('ammo-info');
        
        weaponName.textContent = this.currentWeapon.name;
        ammoInfo.textContent = this.currentWeapon.getAmmoDisplay();
    }

    updateWeaponSlots() {
        const slots = document.querySelectorAll('.weapon-slot');
        slots.forEach((slot, index) => {
            if (index === this.currentWeaponIndex) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
    }

    getCurrentWeapon() {
        return this.currentWeapon;
    }

    reset() {
        for (const weapon of this.weapons) {
            weapon.currentAmmo = weapon.maxAmmo;
            weapon.reserveAmmo = weapon.maxReserve;
            weapon.isReloading = false;
        }
        
        this.selectWeapon(0);
        this.recoil = 0;
        this.recoilTarget = 0;
        
        if (this.currentWeapon instanceof Flamethrower) {
            this.currentWeapon.hideAllFlames();
        }
    }
}
