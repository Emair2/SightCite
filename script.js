const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;
let particles = [];
let lines = [];
let expandedCenters = new Set();
const maxParticles = 2000;  // 粒子的最大数量
const slowGrowthSpeed = 0.01;  // 原中心粒子的缓慢生长速度
const normalGrowthSpeed = 0.3;  // 正常生长速度
let refreshTimeout;  // 定时器句柄

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    resetSimulation();
});

class Particle {
    constructor(x, y, growthSpeed = normalGrowthSpeed) {
        this.x = x;
        this.y = y;
        this.radius = 1 + Math.random() * 5;
        this.color = `rgba(255, ${185 + Math.floor(Math.random() * 700)}, 0, 1)`;
        this.growthSpeed = growthSpeed;
        this.active = true;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Line {
    constructor(start, end) {
        this.start = start;
        this.end = end;
        this.currentX = start.x;
        this.currentY = start.y;
        this.growthSpeed = start.growthSpeed;
        this.complete = false;
    }

    grow() {
        if (!this.complete) {
            let dx = this.end.x - this.currentX;
            let dy = this.end.y - this.currentY;
            let step = this.growthSpeed;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < step) {
                this.currentX = this.end.x;
                this.currentY = this.end.y;
                this.complete = true;
                this.end.active = true;
                particles.push(this.end);
                checkRefresh();  // 检查是否需要刷新屏幕
            } else {
                this.currentX += (dx / distance) * step;
                this.currentY += (dy / distance) * step;
            }
        }
    }

    draw() {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.currentX, this.currentY);
        ctx.stroke();
    }
}

function initializeCenters() {
    for (let i = 0; i < 3; i++) {
        let centerX = Math.random() * width; // 随机初始化粒子位置
        let centerY = Math.random() * height; // 随机初始化粒子位置
        let centralParticle = new Particle(centerX, centerY);
        particles.push(centralParticle);
        expandFromParticle(centralParticle, 3);  // Start with multiple initial branches
    }
}

function expandFromParticle(particle, numExtensions = 1) {
    for (let i = 0; i < numExtensions; i++) {
        let angle = Math.random() * Math.PI * 2;
        let distance = 20 + Math.random() * 300;  // Random initial distances, increase max length
        let newEnd = new Particle(
            particle.x + Math.cos(angle) * distance,
            particle.y + Math.sin(angle) * distance,
            particle.growthSpeed
        );
        let line = new Line(particle, newEnd);
        lines.push(line);
    }
}

function addParticles() {
    particles.forEach(particle => {
        if (particle.active) {
            expandFromParticle(particle);  // Continue expanding from active particles
        }
    });

    if (particles.length >= maxParticles && expandedCenters.size < 100) {
        findEmptySpotAndExpand();
    }
}

function findEmptySpotAndExpand() {
    // 尝试在空旷区域生成新粒子并从现有粒子扩展到该位置
    let emptySpot;
    for (let attempt = 0; attempt < 100; attempt++) {
        let x = Math.random() * width;
        let y = Math.random() * height;
        let isFarEnough = particles.every(p => Math.hypot(p.x - x, p.y - y) > 100);
        if (isFarEnough) {
            emptySpot = { x, y };
            break;
        }
    }
    if (emptySpot) {
        let nearestParticle = particles.reduce((nearest, particle) => {
            let distToParticle = Math.hypot(particle.x - emptySpot.x, particle.y - emptySpot.y);
            return distToParticle < Math.hypot(nearest.x - emptySpot.x, nearest.y - emptySpot.y) ? particle : nearest;
        }, particles[0]);

        let newParticle = new Particle(emptySpot.x, emptySpot.y, normalGrowthSpeed);
        let line = new Line(nearestParticle, newParticle);
        lines.push(line);
        expandedCenters.add(newParticle);  // 将新粒子设为扩展中心

        // 将原中心粒子的生长速度设置为非常慢
        particles.forEach(p => {
            if (expandedCenters.has(p)) {
                p.growthSpeed = normalGrowthSpeed;
            } else {
                p.growthSpeed = slowGrowthSpeed;
            }
        });
    }
}

function checkRefresh() {
    if (!refreshTimeout) {
        refreshTimeout = setTimeout(resetSimulation, 45000);  // 45秒后刷新屏幕
    }
}

function resetSimulation() {
    particles = [];
    lines = [];
    expandedCenters.clear();
    initializeCenters();
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    lines.forEach(line => line.grow());
    lines.forEach(line => line.draw());
    particles.forEach(particle => particle.draw());
    requestAnimationFrame(animate);
}

initializeCenters();
setInterval(addParticles, 1800);  // Regularly attempt to add new branches
animate();
