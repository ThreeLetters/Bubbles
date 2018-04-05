var renderOptions = {
    autoResize: true,
    resolution: 2,
    clearBeforeRender: true,
    roundPixels: true
};
var el = $('#background');
var width = el.width,
    height = el.height;
var half = (width / 2) - 50
var lenX = Math.ceil(width / 100);
var renderer = new PIXI.WebGLRenderer(width, height, renderOptions);
renderer.backgroundColor = 0xfbfbfb;
el.appendChild(renderer.view);
var stage = new PIXI.Container();

renderer.render(stage)
var map = new HashBounds(4, 3, Math.max(width + 200, height + 200))

function rgbToHex(r, g, b) {
    return (1 << 24) + (r << 16) + (g << 8) + b;
}

var paused = false;
$('#play').on('click', function () {

    if (paused) {

        $('#play').className = 'fa fa-pause';
        paused = false;
        update();
    } else {

        $('#play').className = 'fa fa-play';
        paused = true;
    }

})

var discovered = 0;

function RGBAtoRGB(r, g, b, a, r2, g2, b2) {
    var r3 = Math.round(((1 - a) * r2) + (a * r))
    var g3 = Math.round(((1 - a) * g2) + (a * g))
    var b3 = Math.round(((1 - a) * b2) + (a * b))
    return [r3, g3, b3];
}

function complimentary(color, limit) {
    var r = color[0],
        g = color[1],
        b = color[2];
    limit = limit || 255;
    return [limit - r, limit - g, limit - b];
}
var colors = [];

function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

var counter = $('#info');
class Bubble {

    constructor(x, y, size, vel, r, g, b) {
        // console.log(color)
        this.r = r;
        this.g = g;
        this.b = b;
        this.x = x;
        this.y = y;
        this.width = this.height = size * 2;
        this.angle = Math.PI * 2 * Math.random();
        this.velocity = vel;
        this.size = size;
        this.color = rgbToHex(r, g, b);

        this.apparent = RGBAtoRGB(r, g, b, .1, 251, 251, 251)
        this.border = rgbToHex(this.apparent[0], this.apparent[1], this.apparent[2]);
        this.graphics = new PIXI.Graphics;
        stage.addChild(this.graphics);

        this.render();
        this.graphics.position.set(x, y);
        map.insert(this, this);
    }

    render() {
        this.graphics.clear();
        this.graphics.lineStyle(2, this.border, 1)
        this.graphics.beginFill(this.color, .1);
        this.graphics.drawCircle(0, 0, this.size);
        this.graphics.endFill();
    }

    move() {
        this.x += Math.cos(this.angle) * this.velocity;
        this.y += Math.sin(this.angle) * this.velocity;
        if (this.x + this.size < 0) this.x = width + this.size;
        else if (this.x - this.size > width) this.x = -this.size;

        if (this.y + this.size < 0) this.y = height + this.size;
        else if (this.y - this.size > height) this.y = -this.size;

        this.graphics.position.set(this.x, this.y);
        map.update(this, this)
    }
    checkIntersect(node) {
        return (this.x - node.x) * (this.x - node.x) + (this.y - node.y) * (this.y - node.y) <= (this.size + node.size) * (this.size + node.size)
    }
    check() {
        var b = this.apparent.slice(0)
        var a = 0;
        map.forEach(this, (node) => {
            if (node && node !== this && this.checkIntersect(node)) {
                a = 1;
                b = RGBAtoRGB(node.r, node.g, node.b, .1, b[0], b[1], b[2])
            }
        });

        if (a) {
            //  b = complimentary(b)
            var c = rgbToHex(b[0], b[1], b[2]);
            // console.log('%c ' + b + ' ' + c, 'background-color: #' + c.toString(16).slice(1));
            if (this.border !== c) {
                this.border = c;
                this.render();

                if (!colors[this.border]) {
                    colors[this.border] = b;
                    discovered++;
                    counter.textContent = 'Discovered ' + discovered + ' Colors'
                    //  console.log('%cFound ' + b + ' ' + c, 'background-color: #' + c.toString(16).slice(1));
                }
            }
        }
    }

}
var objects = [];

for (var i = 0; i < 360; i += 5) {
    var warmth = 0;
    if (i < 180) {
        warmth = (180 - i) / 180;
    } else {
        warmth = (180 - (360 - i)) / 180
    }

    var rgb = hslToRgb(i / 365, .5, .5);
    objects.push(new Bubble(Math.random() * width, Math.random() * height, 80 * Math.random(), warmth * 1 + .5, rgb[0], rgb[1], rgb[2]))
}
renderer.render(stage)


function update() {
    if (!paused) requestAnimationFrame(update);
    objects.forEach((object) => {
        object.move();
        object.check();
    })
    renderer.render(stage)
}
update();

$('#refresh').on('click', function () {
    objects.forEach((object) => {
        stage.removeChild(object.graphics);

    })
    objects = [];
    map.clear();
    discovered = 0;
    colors = [];

    for (var i = 0; i < 360; i += 5) {
        var warmth = 0;
        if (i < 180) {
            warmth = (180 - i) / 180;
        } else {
            warmth = (180 - (360 - i)) / 180
        }

        var rgb = hslToRgb(i / 365, .5, .5);
        objects.push(new Bubble(Math.random() * width, Math.random() * height, 80 * Math.random(), warmth * 1 + .5, rgb[0], rgb[1], rgb[2]))
    }
    counter.textContent = 'Discovered 0 Colors'
    renderer.render(stage)
})
