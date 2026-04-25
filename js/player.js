class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.position = new THREE.Vector3(0, 1.6, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = { x: 0, y: 0 };
        
        this.moveSpeed = 8;
        this.jumpForce = 8;
        this.gravity = 20;
        this.isGrounded = true;
        
        this.maxHealth = 100;
        this.health = 100;
        this.isDead = false;
        
        this.moveDirection = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        this.cameraRotation = {
            x: 0,
            y: 0
        };
        
        this.invincible = false;
        this.invincibleTime = 0.5;
        
        this.damageFlash = 0;
        
        this.init();
    }

    init() {
        this.camera.position.copy(this.position);
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('click', () => this.requestPointerLock());
    }

    requestPointerLock() {
        document.body.requestPointerLock();
    }

    onKeyDown(e) {
        switch (e.code) {
            case 'KeyW':
                this.moveDirection.forward = true;
                break;
            case 'KeyS':
                this.moveDirection.backward = true;
                break;
            case 'KeyA':
                this.moveDirection.left = true;
                break;
            case 'KeyD':
                this.moveDirection.right = true;
                break;
            case 'Space':
                if (this.isGrounded) {
                    this.velocity.y = this.jumpForce;
                    this.isGrounded = false;
                }
                break;
        }
    }

    onKeyUp(e) {
        switch (e.code) {
            case 'KeyW':
                this.moveDirection.forward = false;
                break;
            case 'KeyS':
                this.moveDirection.backward = false;
                break;
            case 'KeyA':
                this.moveDirection.left = false;
                break;
            case 'KeyD':
                this.moveDirection.right = false;
                break;
        }
    }

    onMouseMove(e) {
        if (document.pointerLockElement !== document.body) return;
        
        const sensitivity = 0.002;
        
        this.rotation.y -= e.movementX * sensitivity;
        this.rotation.x -= e.movementY * sensitivity;
        
        this.rotation.x = Utils.clamp(this.rotation.x, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);
    }

    update(deltaTime) {
        if (this.isDead) return;
        
        this.updateCamera(deltaTime);
        this.updateMovement(deltaTime);
        
        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }
        
        if (this.damageFlash > 0) {
            this.damageFlash -= deltaTime * 5;
            if (this.damageFlash < 0) this.damageFlash = 0;
            const overlay = document.getElementById('damage-overlay');
            overlay.style.backgroundColor = `rgba(255, 0, 0, ${this.damageFlash * 0.3})`;
        }
    }

    updateCamera(deltaTime) {
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.rotation.y;
        this.camera.rotation.x = this.rotation.x;
    }

    updateMovement(deltaTime) {
        const moveVector = new THREE.Vector3();
        
        if (this.moveDirection.forward) moveVector.z -= 1;
        if (this.moveDirection.backward) moveVector.z += 1;
        if (this.moveDirection.left) moveVector.x -= 1;
        if (this.moveDirection.right) moveVector.x += 1;
        
        if (moveVector.length() > 0) {
            moveVector.normalize();
            
            const angle = this.rotation.y;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            const newX = moveVector.x * cos - moveVector.z * sin;
            const newZ = moveVector.x * sin + moveVector.z * cos;
            
            this.position.x += newX * this.moveSpeed * deltaTime;
            this.position.z += newZ * this.moveSpeed * deltaTime;
        }
        
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * deltaTime;
            this.position.y += this.velocity.y * deltaTime;
        }
        
        if (this.position.y <= 1.6) {
            this.position.y = 1.6;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        
        this.clampPosition();
        
        this.camera.position.copy(this.position);
    }

    clampPosition() {
        const mapSize = 45;
        this.position.x = Utils.clamp(this.position.x, -mapSize, mapSize);
        this.position.z = Utils.clamp(this.position.z, -mapSize, mapSize);
    }

    takeDamage(amount) {
        if (this.invincible || this.isDead) return;
        
        this.health -= amount;
        this.invincible = true;
        this.invincibleTime = 0.5;
        this.damageFlash = 1;
        
        this.updateHealthUI();
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            return true;
        }
        return false;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        this.updateHealthUI();
    }

    updateHealthUI() {
        const healthBar = document.getElementById('health-bar');
        const healthText = document.getElementById('health-text');
        const healthPercent = (this.health / this.maxHealth) * 100;
        
        healthBar.style.width = `${healthPercent}%`;
        healthText.textContent = `${Math.floor(this.health)}/${this.maxHealth}`;
        
        if (healthPercent < 30) {
            healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff3333)';
        } else if (healthPercent < 60) {
            healthBar.style.background = 'linear-gradient(90deg, #ff8800, #ffaa33)';
        } else {
            healthBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
        }
    }

    reset() {
        this.position.set(0, 1.6, 0);
        this.velocity.set(0, 0, 0);
        this.rotation = { x: 0, y: 0 };
        this.health = this.maxHealth;
        this.isDead = false;
        this.isGrounded = true;
        this.invincible = false;
        this.damageFlash = 0;
        
        this.moveDirection = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        this.updateHealthUI();
        
        const overlay = document.getElementById('damage-overlay');
        overlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
    }

    getForwardDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        return direction;
    }

    getRightDirection() {
        const direction = new THREE.Vector3(1, 0, 0);
        direction.applyQuaternion(this.camera.quaternion);
        return direction;
    }
}
