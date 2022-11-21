const canvas = document.createElement("canvas");

const width = window.innerWidth - 16;
const height = window.innerHeight - 16;

canvas.setAttribute("width", width);
canvas.setAttribute("height", height);

document.body.appendChild(canvas);

const g = canvas.getContext("2d");

let frames = 0;
let textures = new Map();

let map =
{
    tiles: [1, 1, 0, 1, 1,
            1, 0, 0, 0, 1,
            1, 0, 1, 0, 1,
            1, 0, 0, 0, 1,
            1, 1, 1, 1, 1,
        ],
    map_w: 5,
    map_h: 5,
}

bind_texture("hlc", "hlc");
bind_texture("hlcbg", "check");
bind_texture("hball", "helvetica ball");

bind_texture("guy", "guy");
bind_texture("tiles", "tiles");
bind_texture("weapons", "weapons");
bind_texture("entities", "entities");

g.imageSmoothingEnabled = false;
let active_scr = 'start';

function bind_texture(name, path)
{
    let img = document.createElement("img");

    img.src = path + ".png";
    img.srcset = path + ".png";

    textures.set(name, img);
}
let weapons =
[
    {
        name: "Generic Sword",
        id: 1,
        texture: 0,
        effects: [ /* Speed: */ 75.0, /* Trail: */ 12.0, /* Offset: */ 0.75, /* Trail Dist: */ 18.0, /* Divider Sin: */ 3.0, /* Absolute: */ false ],
        f_attack: function (frames, scale, dir)
        {
            if (frames * (1000.0 / 48.0) >= 15)
            {
                return 0;
            }

            for (let i = 0; i < this.effects[1]; i++)
            {
                g.globalAlpha = (i + 1) / this.effects[1];
                g.save();
                g.translate(width / 2, height / 2);
                let a = frames * this.effects[0] + i * (this.effects[3] / this.effects[1]);
                let sin = Math.sin(a / this.effects[1] + (this.effects[5]? Math.PI : 0));
                g.rotate(Math.PI * ((dir == 3? 1 : (dir == 1? 3 : dir)) / 2.0 - (this.effects[5]? Math.abs(sin) : sin) / this.effects[4]) - this.effects[2]);
                g.drawImage(textures.get("weapons"), this.texture * 16, 16, 16, 16, -40 * scale, 8 * scale, 32 * scale, 32 * scale);
                g.restore();
            }

            g.globalAlpha = 1.0;
            
            return 48.0 / 1000.0;
        }
    },
    {
        name: "Generic Scythe",
        id: 2,
        texture: 1,
        effects: [ /* Speed: */ 11.0, /* Trail: */ 12.0, /* Offset: */ 0.75, /* Trail Dist: */ 18.0, /* Divider Sin: */ -0.5, /* Absolute: */ true ],
        f_attack: function (frames, scale, dir)
        {
            if (frames * (1000.0 / 48.0) >= 85)
            {
                return 0;
            }

            for (let i = 0; i < this.effects[1]; i++)
            {
                let f = 60 * (48.0 / 1000.0) + (11 - i) / 11.0;
                let f1 = Math.min(Math.max(f - frames, 0), 1) - (frames / 120.0 * Math.floor(i / 11));
                g.globalAlpha = Math.min((frames * (1000.0 / 48.0)) / 15.0, 1) * ((i + 1) / this.effects[1]) * f1;
                g.save();
                g.translate(width / 2, height / 2);
                let a = Math.min(frames, 60 * (48.0 / 1000.0) + (11 - i) / 11.0 * 2.0) * this.effects[0] + i * (this.effects[3] / this.effects[1]);
                let sin = Math.sin(a / this.effects[1] + (this.effects[5]? Math.PI : 0));
                g.rotate(Math.PI * ((dir == 3? 1 : (dir == 1? 3 : dir)) / 2.0 - (this.effects[5]? Math.abs(sin) : sin) / this.effects[4]) - this.effects[2]);
                g.drawImage(textures.get("weapons"), this.texture * 16, 16, 16, 16, -40 * scale, 8 * scale, 32 * scale, 32 * scale);
                g.restore();
            }

            g.globalAlpha = 1.0;
            
            return 48.0 / 1000.0;
        }
    },
    {
        name: "Crystal Sword",
        id: 3,
        texture: 2,
        effects: [ /* Speed: */ 75.0, /* Trail: */ 12.0, /* Offset: */ 0.75, /* Trail Dist: */ 18.0, /* Divider Sin: */ 1.5, /* Absolute: */ false ],
        f_attack: function (frames, scale, dir)
        {
            if (frames * (1000.0 / 48.0) >= 23)
            {
                return 0;
            }

            for (let i = 0; i < this.effects[1]; i++)
            {
                g.globalAlpha = (i + 1) / this.effects[1] * Math.min((frames * (1000.0 / 48.0)) / 11.5, 1);
                g.save();
                g.translate(width / 2, height / 2);
                let a = frames * this.effects[0] + i * (this.effects[3] / this.effects[1]);
                let sin = Math.sin(a / this.effects[1] + (this.effects[5]? Math.PI : 0));
                g.rotate(Math.PI * ((dir == 3? 1 : (dir == 1? 3 : dir)) / 2.0 - (this.effects[5]? Math.abs(sin) : sin) / this.effects[4]) - this.effects[2]);
                g.drawImage(textures.get("weapons"), this.texture * 16, 16, 16, 16, -40 * scale, 8 * scale, 32 * scale, 32 * scale);
                g.restore();
            }

            g.globalAlpha = 1.0;
            
            return 48.0 / 1000.0;
        }
    },
]
let controller =
{
    up: false,
    left: false,
    down: false,
    right: false,
    roll: { 
        frames: 0,
        down: false,
        lock: false,
        p_x: 0,
        p_y: 0,
    },
    attack: {
        down: false,
        frames: 0,
    }
}
let pl = 
{
    x: 0,
    y: 0,
    v_x: 0,
    v_y: 0,
    dir: 0,
    att_dir: 0,
    mov: false,
    frames: 0,
    weapon: weapons[0],
    f_move: function(up, left, rolling)
    {
        this.f_turn();

        this.mov = this.v_x != 0.0 || this.v_y != 0.0;

        if (this.mov)
        {
            this.frames += 48.0 / 1000.0;

            if ((controller.roll.down || controller.roll.frames > 0) && !controller.roll.lock)
            {
                if (controller.roll.down && controller.roll.frames <= 0)
                {
                    controller.roll.p_x = left;
                    controller.roll.p_y = up;
                }
                controller.roll.frames++;
            }

            if (controller.roll.lock)
            {
                controller.roll.frames = Math.max(controller.roll.frames - 1, 0);
                if (controller.roll.frames <= 0 && !controller.roll.down)
                {
                    controller.roll.lock = false;
                }
            }

            if (controller.roll.frames >= 15)
            {
                controller.roll.lock = true;
            }
        }

        this.v_x *= rolling? 1.0 : 0.75;
        this.v_y *= rolling? 1.0 : 0.75;

        if (Math.abs(this.v_x) + Math.abs(this.v_y) <= 0.005)
        {
            this.v_x = 0;
            this.v_y = 0;
        }

        this.f_collide(rolling);

        if (!rolling)
        {
            this.v_x += left * 2 / 50.0;
            this.v_y += up * 2 / 50.0;
        }
        else
        {
            this.v_x = controller.roll.p_x * 18 / 50.0;
            this.v_y = controller.roll.p_y * 18 / 50.0
        }

        this.x += this.v_x;
        this.y += this.v_y;
    },
    f_turn: function()
    {
        if (controller.attack.down && controller.attack.frames == 0)
        {
            this.att_dir = this.dir;
        }

        if (this.v_y > 0 && controller.up)
            this.dir = 2;

        if (this.v_x < 0 && controller.left)
            this.dir = 3;

        if (this.v_y < 0 && controller.down)
            this.dir = 0;

        if (this.v_x > 0 && controller.right)
            this.dir = 1;
    },
    f_collide: function(rolling)
    {
        let x0 = Math.floor(this.x / 2.0 + 0.8 + this.v_x);
        let x1 = Math.floor(this.x / 2.0 + 0.2 + this.v_x);
        let y0 = Math.floor(-this.y / 2.0 + 0.05 - this.v_y);
        let y1 = Math.floor(-this.y / 2.0 + 0.95 - this.v_y);
        
        let cx = Math.floor(this.x / 2.0 + 0.5);
        let cy = Math.floor(-this.y / 2.0 + 0.5);

        if (tile_get(x0, cy) != 0)
        {
            this.v_x = -((this.x / 2.0 + 0.5 + this.v_x) - this.x / 2.0) / 10.0;
            controller.roll.frames = 2;
            controller.roll.lock = true;
        }
        if (tile_get(cx, y0) != 0)
        {
            this.v_y = -((this.y / 2.0 + 0.5 + this.v_y) - this.y / 2.0) / 10.0;
            controller.roll.frames = 2;
            controller.roll.lock = true;
        }
        if (tile_get(x1, cy) != 0)
        {
            this.v_x = ((this.x / 2.0 + 0.5 + this.v_x) - this.x / 2.0) / 10.0;
            controller.roll.frames = 2;
            controller.roll.lock = true;
        }
        if (tile_get(cx, y1) != 0)
        {
            this.v_y = ((this.y / 2.0 + 0.5 + this.v_y) - this.y / 2.0) / 10.0;
            controller.roll.frames = 2;
            controller.roll.lock = true;
        }
    },
    f_attack: function (frames, scale)
    {
        if (controller.attack.down || controller.attack.frames > 0)
        {
            let a = this.weapon.f_attack(controller.attack.frames, scale, this.att_dir);
            if (a > 0)
            {
                controller.attack.frames += a;
            }
            else
            {
                controller.attack.frames = 0;
            }
        }
        else
        {
            controller.attack.frames = 0;
        }
    }
}
let console_scr =
{
    // C.onsole A.ssembly I.nstructions
    // mes: memset a1, a2
    // meg: memget a1
    // med: memdefine a1
    // meb: memdebug a1
    // rea: registera v
    // reb: registerb v
    // rec: registerc v
    // jcm: jumpcompare a1, a2
    // jop: jumpoperation a1, a2
    // jmp: jump a1
	// inc: include a1
	// clc: clock a1
    // $: currentline arg
    // ;: comment
    // [a]: pointerstore c1
	// &: pointeraddress c1

    // User-definable memory.
    memory: [],
    varstore: [],

    // Game loop.
    loop: function (frames, scale)
    {
        if (active_scr != 'console')
            return;

        g.fillStyle = "#000000";
        g.fillRect(width / 2 - scale * (128 + 256) / 2, 0, scale * (128 + 256), height);
    },

    // Assembly compiler.
    assemble: function (instr, args)
    {
        let pos = 0;
        for (let i = 0; i < instr.length; i++)
        {
            switch (instr[i])
            {
                case "mes":
                    this.memory[args[pos]] = args[pos + 1];
                    pos += 2;
                    break;
                case "meg":
                    pos++;
                    break;
                case "med":
                    pos++;
                    break;
                case "meb":
                    break;
                case "rea":
                    break;
                case "reb":
                    break;
                case "rec":
                    break;
                case "jcm":
                    break;
                case "jop":
                    break;
                case "jmp":
                    break;
                default:
                    break;
            }
        }
    }
}
let game_scr =
{
    // The game screen.
    // Logic loop.
    entities: [],
    loop: function (frames, scale)
    {
        // Finds if it's midintro or if it's on the game screen.
		if (active_scr != 'game' && active_scr != 'start')
			return;

        // Player movement logic.
        let rolling = (controller.roll.down || controller.roll.frames > 0 && controller.roll.frames < 15) && !controller.roll.lock && pl.mov;

        let up = controller.up && !controller.down? 1 : (controller.down && !controller.up? -1 : 0);
        let left = controller.right && !controller.left? 1 : (controller.left && !controller.right? -1 : 0);

        // Just the generic background
        g.fillStyle = "#afafaf";
        g.fillRect(0, 0, width, height);

        // Function Move, handles all movements of the player.
        pl.f_move(up, left, rolling)

        // Rendering the game.
        for (let i = 0; i < map.map_w; i++)
        {
            for (let j = 0; j < map.map_h; j++)
            {
                if (tile_get(i, j) != 0)
                    tile_draw(2, -i, -j, scale, true);

                else
                    if (tile_get(i, j - 1) == 0)
                        tile_draw(2, -i, -j, scale, false);
            }
        }

        // TEST.
        entity_draw(0, Math.round(frames) % 4, -2, -3, 1, 1, scale);

        // I wanna draw the guy.
        g.drawImage(textures.get("guy"), ((Math.round(pl.frames * 2) % 2)) * 8 + ((pl.dir % 2) * 16), (Math.floor(pl.dir / 2) * 8) + (rolling? 16 : 0), 8, 8, width / 2 - 16 * scale, height / 2 - 16 * scale, 32 * scale, 32 * scale);
        pl.f_attack(frames, scale);
    }
}
let start_scr =
{
    // The intro screen.

    // The ball that bounces in the intro.
    ball: { x: -256, y: 64, v_x: 0, v_y: 0 },
    // Logic loop.
    loop: function (frames, scale)
    {
        // Checks if screen is intro.
        if (active_scr != 'start')
            return;

        // Draws background at the start of the intro for a smooth transition.
        if (frames / 1.5 < Math.PI)
        {
            g.fillStyle = "#ffffff";
            g.fillRect(0, 0, width, height);
        }

        // Logic that makes the ball move.
        this.ball.v_x = 4.0;
        this.ball.v_y += 0.6;
        this.ball.x += this.ball.v_x;
        this.ball.y += this.ball.v_y;

        // This statement is what makes it bounce.
        if (this.ball.y > 256 + 64)
        {
            this.ball.y = 256 + 64;
            this.ball.v_y *= -0.8;
        }

        // Rendering logic.
        // The new alpha.
        g.globalAlpha = Math.max(Math.min(Math.sin(frames / 3.0), 1), 0);
        g.fillStyle = "#ffffff";
        
        // Drawing everything like the logo, background, and the ball.
        g.drawImage(textures.get("hlcbg"), width / 2 - 196 * scale, height / 2 - 196 * scale, 392 * scale, 392 * scale)
        g.drawImage(textures.get("hball"), width / 2 - 128 * scale + scale * this.ball.x, height / 2 - 256 * scale + scale * this.ball.y, scale * 128, scale * 128);
        g.drawImage(textures.get("hlc"), width / 2 - 128 * scale, height / 2 - 78 * scale, 256 * scale, 156 * scale)
        
        // Reset alpha.
        g.globalAlpha = 1.0;

        // This statement ends intro
        if (frames / 3.0 >= Math.PI)
        {
			active_scr = 'game';
            frames = 0.0;
        }
    }
}

function loop()
{
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, width, height);

    frames += 48.0 / 1000.0;
    let scale = Math.sqrt(height * height) / (128 + 256);
    
    game_scr.loop(frames, scale);
    start_scr.loop(frames, scale);
    console_scr.loop(frames, scale);

    g.fillStyle = "#000000";
    g.fillRect(0, 0, width / 2 - scale * (128 + 256) / 2.0, height);
    g.fillRect(width / 2 + scale * (128 + 256) / 2.0, 0, width / 2 - scale * (128 + 256) / 2.0, height);

    //g.fillStyle = "#ffffff";
    //g.fillText("Roll Frames: " + controller.roll.frames, 8, 12);
    //g.fillStyle = "#ffffff";
    //g.fillText("Attack Frames: " + (controller.attack.frames * (1000.0 / 48.0)), 8, 30);
}

function entity_create(x,y,tex,health)
{
    let en =
    {
        x: x,
        y: y,
        v_x: 0,
        v_y: 0,
        tex: tex,
        health: health,
        f_move: function()
        {
            let dx = Math.abs(pl.x - this.x);
            let dy = Math.abs(pl.y - this.y);
        }
    }
}
function entity_draw(index, frame, x, y, w, h, scale)
{
    g.drawImage(textures.get("entities"), (index + frame) * 8, Math.floor((index + frame) / 16) * 8, 8, 8, width / 2 - ((x * 2 + 1 + pl.x) * 16 * scale), height / 2 - ((y * 2 + 1 - pl.y) * 16 * scale), 32 * w * scale, 32 * h * scale);
}

function tile_draw(index, x, y, scale, top)
{
    g.drawImage(textures.get("tiles"), index * 8, Math.floor(index / 4) * 24 + (top? 0 : 16), 8, top? 16 : 8, width / 2 - Math.round((x * 2 + 1 + pl.x) * 16 * scale), height / 2 - Math.round((y * 2 + 1 - pl.y) * 16 * scale), Math.ceil(32 * scale), Math.ceil((top? 64 : 32) * scale));
}
function tile_get(x, y)
{
    if (x >= map.map_w || x < 0 || y >= map.map_h || y < 0)
        return 0;

    return map.tiles[x + (y * map.map_w)];
}

function keys(e, p)
{
    let key = e.key.toLowerCase();
    
    if (key === "arrowup")
        controller.up = p;
    
    if (key === "arrowleft")
        controller.left = p;

    if (key === "arrowdown")
        controller.down = p;

    if (key === "arrowright")
        controller.right = p;

    if (key === "shift")
        controller.roll.down = p;

    if (key === "z")
        controller.attack.down = p;
}

addEventListener("keydown", (e) => keys(e, true));
addEventListener("keyup", (e) => keys(e, false));

setInterval(loop, 1000 / 36.0);