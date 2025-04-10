import { render, mut, sig, mem, eff_on, each, if_then } from "./solid/monke.js"
import { hdom } from "./solid/hdom/index.js"
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
	[".main", Canvas, Tabs,]
])

const Canvas = [".canvas"]

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
			margin: rem(.5),
			padding: rem(.5),
			border: [[px(1), "dotted", colors.black]],
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
	[".resources"],
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
		["h" + (i + 1),
		{
			"font-family": () => type.heading,
			"font-size": em(4 - (i / 2))
		}
		]),

	[".canvas", {
		position: "fixed",
		background: colors.base,


		"background-size": [[px(40), px(40)]],
		"background-image": [
			"linear-gradient(to right, #2222 1px, transparent 1px)",
			"linear-gradient(to bottom, #2222 1px, transparent 1px)",
		]
	}, fullscreen],

	[".tabs",
		// revolving?
		schedule.css,
		[".resources",
			rect(
				calc(em(3), "+", vw(30)), em(1),
				calc(vw(100), "-", "(", em(4), "+", vw(30), ")"), vh(40),
			), {
				background: colors.highlight,
			}],
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
