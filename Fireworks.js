export class Fireworks {
    constructor() {
        this.points = 0;
        this.canvas = this.createCanvas();
        this.ctx = this.canvas.getContext("2d");
        this.shells = [];
        this.pass = [];
        this.colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];
        this.lastRun = 0;
        this.runAnimation = null;
        this.gamebackgroundmusic = document.getElementById("bgAudio");
        this.fireworksbackgroundmusic = document.getElementById("fireworkAudio");
        window.onresize = () => this.reset();
        this.reset();
    }

    createCanvas() {
        const c = document.createElement("canvas");
        document.body.appendChild(c);
        return c;
    }

    reset() {
        this.cwidth = window.innerWidth;
        this.cheight = window.innerHeight;
        this.canvas.width = this.cwidth;
        this.canvas.height = this.cheight;
    }

    newShell() {
        var left = (Math.random() > 0.5);
        var shell = {};
        shell.x = (1 * left);
        shell.y = 1;
        shell.xoff = (0.01 + Math.random() * 0.007) * (left ? 1 : -1);
        shell.yoff = 0.01 + Math.random() * 0.007;
        shell.size = Math.random() * 6 + 3;
        shell.color = this.colors[Math.floor(Math.random() * this.colors.length)];

        this.shells.push(shell);
    }

    newPass(shell) {
        var pasCount = Math.ceil(Math.pow(shell.size, 2) * Math.PI);

        for (let i = 0; i < pasCount; i++) {
            var pas = {};
            pas.x = shell.x * this.cwidth;
            pas.y = shell.y * this.cheight;

            var a = Math.random() * 4;
            var s = Math.random() * 10;

            pas.xoff = s * Math.sin((5 - a) * (Math.PI / 2));
            pas.yoff = s * Math.sin(a * (Math.PI / 2));

            pas.color = shell.color;
            pas.size = Math.sqrt(shell.size);

            if (this.pass.length < 1000) { this.pass.push(pas); }
        }
    }

    removeMission(missionName) {
        this.canvas.style.display = "block";
        this.gamebackgroundmusic.pause();
        this.fireworksbackgroundmusic.play();
        document.getElementById('game').style.display = 'none';
        var missionList = document.querySelector('#mission-button .dropdown');
        var missions = missionList.getElementsByTagName('li');
        for (let i = 0; i < missions.length; i++) {
            if (missions[i].innerText === missionName) {
                missions[i].remove();
                this.run();

                var completedMissions = 5 - missionList.getElementsByTagName('li').length;
                document.querySelector('#mission-button span').textContent = completedMissions;

                this.points += 100; // Assuming each mission is worth 100 points
                this.updatePoints();
                break;
            }
        }
    }

    updatePoints() {
        var pointsElement = document.getElementById('points');
        pointsElement.innerHTML = `<img src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Rotating-golden-star.gif" alt="Star" />  ${this.points}`;
    }

    run() {
        var dt = 1;
        if (this.lastRun != 0) { dt = Math.min(50, (performance.now() - this.lastRun)); }
        this.lastRun = performance.now();

        this.ctx.fillStyle = "rgba(0,0,0,0.25)";
        this.ctx.fillRect(0, 0, this.cwidth, this.cheight);

        if ((this.shells.length < 10) && (Math.random() > 0.96)) { this.newShell(); }

        for (let ix in this.shells) {
            var shell = this.shells[ix];

            this.ctx.beginPath();
            this.ctx.arc(shell.x * this.cwidth, shell.y * this.cheight, shell.size, 0, 2 * Math.PI);
            this.ctx.fillStyle = shell.color;
            this.ctx.fill();

            shell.x -= shell.xoff;
            shell.y -= shell.yoff;
            shell.xoff -= (shell.xoff * dt * 0.001);
            shell.yoff -= ((shell.yoff + 0.2) * dt * 0.00005);

            if (shell.yoff < -0.005) {
                this.newPass(shell);
                this.shells.splice(ix, 1);
            }
        }

        for (let ix in this.pass) {
            var pas = this.pass[ix];

            this.ctx.beginPath();
            this.ctx.arc(pas.x, pas.y, pas.size, 0, 2 * Math.PI);
            this.ctx.fillStyle = pas.color;
            this.ctx.fill();

            pas.x -= pas.xoff;
            pas.y -= pas.yoff;
            pas.xoff -= (pas.xoff * dt * 0.001);
            pas.yoff -= ((pas.yoff + 5) * dt * 0.0005);
            pas.size -= (dt * 0.002 * Math.random());

            if ((pas.y > this.cheight) || (pas.y < -50) || (pas.size <= 0)) {
                this.pass.splice(ix, 1);
            }
        }

        this.runAnimation = requestAnimationFrame(() => this.run());

        setTimeout(() => {
            cancelAnimationFrame(this.runAnimation);
            this.canvas.style.display = "none";
            document.getElementById('game').style.display = 'block';
            this.gamebackgroundmusic.play();
            this.fireworksbackgroundmusic.pause();
        }, 5000); // Stop the animation after 5 seconds
    }
}

// const fireworks = new Fireworks();

// setTimeout(() => {
//     fireworks.removeMission("MISSION_3");
// }, 7000);

// setTimeout(() => {
//     fireworks.removeMission("MISSION_4");
// }, 20000);

