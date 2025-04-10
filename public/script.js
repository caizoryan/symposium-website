import { mounted, render, mut, sig, mem, eff_on, each, if_then } from "./solid/monke.js"
import { hdom } from "./solid/hdom/index.js"
import { Q5 } from "./q5/q5.js"
// import * as pixijs from 'https://esm.sh/pixi.js'
// console.log(pixijs)
import CSS from "./css/css.js"
import * as ArenaType from "./arena.js"
import * as Tapri from "./solid/monke.js"

let canvas_dom
let timeout = undefined

const lerp = (start, stop, amt) => amt * (stop - start) + start
const invlerp = (x, y, a) => clamp((a - x) / (y - x));
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a));
const not = (value) => !value

/**@type {(val: number, min: number, max: number) => boolean}*/
const between = (val, min, max) => (val > min && val < max)

const mouse_x = sig(0)
const mouse_y = sig(0)
const rel_mouse_x = mem(() => mouse_x() / window.innerWidth)
const rel_mouse_y = mem(() => mouse_y() / window.innerHeight)

// --------------------------
// CSS UTILITIES
// --------------------------

const { vw, px, vh, ms, css, url, em, rem, percent } = CSS
const calc = (...args) => `calc(${args.join(" ")})`

const fullscreen = {
	width: vw(100),
	height: vh(100)
}

const rect = (x, y, w, h, opts = {
	xAxis: "left",
	yAxis: "top",
	strategy: "fixed"
}) => ({
	[opts.xAxis]: x,
	[opts.yAxis]: y,
	width: w,
	height: h,
	position: opts.strategy
})

let colors = mut({
	base: "#E5FD53",
	highlight: "#9366C3",
	text: "#268E17",
	white: "#FFFFFF",
	black: "#4D4D4D"
})

let type = mut({
	heading: "anthony"
})

const loadfont = (src, name) => {
	return ['@font-face', {
		"font-family": name,
		src: url(src),
	}]
}

//setTimeout(() => type.heading = "cirrus", 2500)
//setTimeout(() => type.heading = "ductus", 5000)

// -----------------------
// COMPONENT: Main
// -----------------------
const Main = () => hdom([
	["style", () => css(style)],
	//Add a loader,
	[".main",
		[".resources",
			[".ornament"]
		],
		Canvas.html, Tabs,]
])

function init_p5(el) {
	let p = new Q5('instance', el);

	let r1 = 200;
	let r2 = 440;
	let text1 = "ALTpractices"
	let textc = "#9366C5";
	let e1font, e2font, e3font
	p.setup = () => {
		p.createCanvas(window.innerWidth, window.innerWidth, { alpha: true });
		p.angleMode(p.DEGREES);
	};

	p.preload = () => {
		e1font = p.loadFont("./fonts/Anthony.otf");
		e2font = p.loadFont("./fonts/CirrusCumulus.otf");
		e3font = p.loadFont("./fonts/DuctusCalligraphic.otf");
		// farsifont = loadFont("fonts/Alexandria-VariableFont_wght.ttf");
		// (text1 = "ALTpractices"),
		//   (text2 = "دیگر"),
		//   (text3 = "alt"),
		//   "대안",
		//   "अन्य",
		//   "متبادل";
		// Adjust path as needed
	}
	function pickword() { }
	p.draw = () => {
		p.clear()
		let an = p.frameCount * 1;

		p.stroke(255);
		p.noFill();
		for (let i = 0; i < 360; i += 30) {
			p.textSize(70);
			p.noStroke();
			p.textAlign(p.CENTER, p.CENTER);

			let x = p.cos(i) * r1;
			let y = p.sin(i) * r2;

			p.rectMode(p.CENTER);
			//rotation for each point
			let x1 = x * p.cos(an) - y * p.sin(an) + p.width / 2;
			let y1 = x * p.sin(an) + y * p.cos(an) + p.height / 4;

			if (i > 80) p.textFont(e2font);
			else p.textFont(e1font)

			p.stroke(colors.white);
			p.noFill()
			p.circle(x1, y1, 80)

			p.fill(colors.white)
			p.noStroke()
			p.text(text1[i / 30], x1, y1);
		}
		// p.pop()
		//ellipse changing ratios
		r1 = 300 + p.cos(90 - an) * 80;
		r2 = 300 + p.sin(90 - an) * 120;
		// r1 = 300
		// r2 = 300
	}
}

const Canvas = (() => {
	const html = () => {
		mounted(() => {
			console.log("mounted", document.querySelector(".canvas"))
			init_p5(document.querySelector(".canvas"))
		})
		return hdom([".canvas"])
	}

	const css = [".canvas", { position: "fixed" }, fullscreen]

	return {
		html, css
	}
})()

const schedule = (() => {
	let top = sig(45)
	let css = [
		".schedule",
		{
			"font-family": "monospace",
			background: colors.white,
			color: () => colors.text,
			transition: [["all", ms(500)]],
			cursor: "crosshair"
		},

		// Children
		["> *", {
			margin: rem(.5),
			padding: rem(.5),
		}],

		[".section", {
			padding: rem(.25),
			"padding-bottom": rem(1.25),
			margin: [[0, rem(1.25)]],
			"border-top": [[px(1), "solid", colors.highlight]],
			color: colors.highlight,
		},
			[":hover", { color: colors.white, "background-color": colors.highlight }],
			// title and time
			[".title", { "font-family": "ductus" }],
			[".time", {
				display: "block-inline",
				"background-color": colors.highlight, color: colors.white,
				padding: [[0, em(.5)]],
				"width": "min-content",
				"border-radius": px(15)
			}]
		],
	]

	const html =
		[".schedule",
			{
				onmouseenter: (e) => e.target == e.currentTarget ? top(top() + (Math.random() * 5) - 2.5) : null,
				onmouseleave: (e) => e.target == e.currentTarget ? top(Math.random() * 50) : null,
				style: () => CSS.css(
					rect(
						em(1), vh(top()),
						vw(30), vh(40),
					))
			},
			["h2", "Schedule"],
			[".section",
				[".title", "SHEEP School"],
				[".time", "2pm"]
			],
			[".section",
				[".title", "Garry Ing"],
				[".time", "3pm"]
			],
			[".section",
				[".title", "1RG"],
				[".time", "4pm"]
			],
		]
	return { html, css }
})()

const Tabs = [
	".tabs",
	// revolving?
	schedule.html,
	[".info"]
]



let style = mut([
	loadfont("./fonts/Anthony.otf", "anthony"),
	loadfont("./fonts/TINY5x3GX.ttf", "tiny"),
	loadfont("./fonts/CirrusCumulus.otf", "cirrus"),
	loadfont("./fonts/Rajdhani-Light.ttf", "rajdhani"),
	loadfont("./fonts/DuctusCalligraphic.otf", "ductus"),

	["*", {
		padding: 0,
		margin: 0,
	}],

	...Array(5).fill(0).map((e, i) =>
		["h" + (i + 1), { "font-family": () => type.heading, "font-size": em(4 - (i / 2)) }]),

	[".main", {
		position: "fixed",
		background: colors.base,

		"background-size": [[px(40), px(40)]],
		"background-image": [
			"linear-gradient(to right, #2222 1px, transparent 1px)",
			"linear-gradient(to bottom, #2222 1px, transparent 1px)",
		]
	}, fullscreen],

	Canvas.css,

	[".resources",
		rect(
			calc(em(3), "+", vw(30)), em(1),
			calc(vw(100), "-", "(", em(4), "+", vw(30), ")"), vh(40),
		), {
			position: "fixed",
			background: colors.highlight,
		},
		[".ornament",
			rect(
				em(-5), vh(10),
				percent(75), vh(80), {
				xAxis: "left",
				yAxis: "top",
				strategy: "absolute"
			})
			, {
				background: colors.highlight
			}
		]
	],
	[".tabs",
		schedule.css,
		[".info"]
	],
])


// -----------------------
// Event Listeners
// -----------------------
document.body.onmousemove = (e) => {
	mouse_x(e.clientX)
	mouse_y(e.clientY)
}
// -----------------------

// -----------------------
// (u) COMPONENT: Button
// -----------------------
let button = (click_fn, one, two) => {
	let atts = { onclick: click_fn }
	let text = two

	if (typeof one == "object") Object.assign(atts, one)
	else if (typeof one == "string") text = one

	return ["button", atts, text]
}

// -----------------------
// (u) COMPONENT: label number input
// -----------------------
function label_number_input(label, getter, setter) {
	return [
		".label-input",
		["span.label", label],
		() => hdom(["input", {
			value: getter,
			type: "number",
			oninput: (e) => {
				let value = parseInt(e.target.value)
				if (isNaN(value)) value = 0
				setter(value)
			}
		}])
	]
}
render(Main, document.body)
