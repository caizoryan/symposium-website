import { mounted, render, mut, sig, mem, eff_on, each, if_then } from "./chowk/monke.js"
import { hdom } from "./chowk/hdom/index.js"
import { Q5 } from "./q5/q5.js"
// import * as pixijs from 'https://esm.sh/pixi.js'
import CSS from "./css/css.js"
import * as ArenaType from "./arena.js"
import * as Chowk from "./chowk/monke.js"

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
// *Header: Introduction
// --------------------------
// Note: This sourcecode takes 
// the form of a game engine
//
// It manages a entities (Rectangles),
// existing on a plane. 
//
// Rectangles have children, 
// and children are related to
// their parents in certain ways:
// top-left, top-right, etc
//
// when parents move, children follow
// when layour changes, parents move
// when interaction, parents change, children change
//
// All the rectangles are choreographed to form
// various compositions.
//
// Compositions reveals something, like the schedule
// or information about the speaker or symposium
// or resources like pdfs
//
// and certan compositions unlock secret walls
// of communication.
//
// Graphics alter between on approach to another
// Graphics rotate, spin, change and mingle.
// --------------------------

// ------------------------------
// *Header: CSS
//----------------------------

// --------------------
// CSS Variables
// --------------------
const colors = mut({
	base: "#E5FD53",
	highlight: "#9366C3",
	text: "#268E17",
	white: "#FFFFFF",
	black: "#4D4D4D"
})

const type = mut({
	heading: "anthony"
})


// --------------------------
// CSS UTILITIES
// --------------------------
const { vw, px, vh, ms, css, url, em, rem, percent } = CSS
const calc = (...args) => `calc(${args.join(" ")})`

const fullscreen = {
	width: vw(100),
	height: vh(100)
}

const random_pos = (w = 10, h = 10) => ({
	x: ((100 - w) * Math.random()),
	y: ((100 - h) * Math.random()),
})


/**
 * @param {string} x 
 * @param {string} y 
 * @param {string} w 
 * @param {string} h 
 * @param {{
 *	xAxis?: ("left" | "right"),
 *	yAxis?: ("top" | "bottom"),
 *	strategy?: ("fixed" | "absolute")
 * }} opts
 * 
 * */
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

const loadfont = (src, name) => {
	return ['@font-face', {
		"font-family": name,
		src: url(src),
	}]
}

// ------------------
// *Header: CSS Definition
// ------------------
let style = mut([
	loadfont("./fonts/Anthony.otf", "anthony"),
	loadfont("./fonts/TINY5x3GX.ttf", "tiny"),
	loadfont("./fonts/CirrusCumulus.otf", "cirrus"),
	loadfont("./fonts/Rajdhani-Light.ttf", "rajdhani"),
	loadfont("./fonts/DuctusCalligraphic.otf", "ductus"),

	["*", {
		padding: 0,
		margin: 0,
		transition: [["all", ms(200)]],
	}],

	// -----------------
	// Heading
	// -----------------
	...Array(5).fill(0).map((e, i) =>
		["h" + (i + 1), {
			"font-family": () => type.heading,
			"font-size": em(4 - (i / 2))
		}
		]),


	[".main", {
		position: "fixed",
		background: colors.base,
		"background-size": [[px(100), px(100)]],
		"background-image": [
			"linear-gradient(to right, #2222 1px, transparent 1px)",
			"linear-gradient(to bottom, #2222 1px, transparent 1px)",
		]
	}, fullscreen],

])

// ------------------
// *Header: (Game) Components
//
// 1. Rectangle
// 2. Squad
// 3. Space
// ------------------

/**
 * @typedef {{
 *		xAxis: ("left" | "right"),
 *		unit: Unit,
 *		yAxis: ("top" | "bottom"),
 *		strategy: ("fixed" | "absolute"),
 *		wUnit?: (Unit | undefined),
 *		hUnit?: (Unit | undefined),
 *		xUnit?: (Unit | undefined),
 *		yUnit?: (Unit | undefined),
 * }} RectangleOpts
 *
 * @typedef {{
 *	x: Chowk.Signal<number>,
 *	y: Chowk.Signal<number>,
 *	w: Chowk.Signal<number>,
 *	h: Chowk.Signal<number>,
 *	unit: (axis: ("x" | "y" | "w" | "h")) => Unit,
 *	opts: Chowk.Signal<RectangleOpts>,
 *	css: () => () => string
 * }} Rectangle
 *
 * @typedef {("px" | "vh" | "vw" | "v" | "em" | "%")} Unit
 *  ---
 *  # Rectangle
 *  Manages rectangular, position width, height stuff
 *  gives us css and checks for intersections with: line and rect and or circle
 *
 *  example: 
 *  ```js
 *  ```
 *  ---
 *
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {RectangleOpts} [opts]
 * @returns {Rectangle}
 * */
function Rectangle(x, y, w, h, opts) {
	const default_opts = { xAxis: "left", yAxis: "top", strategy: "fixed", unit: "px" }
	const _opts = sig(Object.assign(default_opts, opts))
	const _x = sig(x)
	const _y = sig(y)
	const _w = sig(w)
	const _h = sig(h)
	/**@param {("x" | "y" | "w" | "h")}  prop*/

	const _unit = (prop) => {
		let def = (axis) => _opts().unit == "v"
			? axis == "x" ? "vw" : "vh"
			: _opts().unit

		if (prop == "x") return _opts().xUnit
			? _opts().xUnit : def("x")

		if (prop == "y") return _opts().yUnit
			? _opts().yUnit : def("y")

		if (prop == "w") return _opts().wUnit
			? _opts().wUnit : def("x")

		if (prop == "h") return _opts().hUnit
			? _opts().hUnit : def("y")
	}

	return {
		x: _x,
		y: _y,
		w: _w,
		h: _h,
		unit: _unit,
		opts: _opts,
		css: () => mem(() =>
			css(rect(
				_x() + _unit("x"),
				_y() + _unit("y"),
				_w() + _unit("w"),
				_h() + _unit("h"),
				_opts()
			)))
	}
}

// -----------------------
// Squad
// ----
// A squad is a grouping of a parent element, i.e a Rectangle
// with it's children. Children can be other Rectangles or 
// more squads. 
//
// Squad concept -> manages the movement of its memebers.
// When parents move due to any reason, the squad makes sure to inform the children
// so they can follow them around.
// -----------------------

function Squad(parent, children) { }


// ------------------------
// For any of these entities, to exist
// they require a container, a conception of something to be in.
//
// Space, provides this concept. 
// You can be (added) to a space
// Once added you can't be removed, even when you're lifetime is over,
// there will be a trace of you in this space.
//
// Space needs to be negotiated, sometimes its members will be required to compromise
// for the sake of each other. In this case its important that the members can communicate
// to each other their needs and capacities.
//
// If you are in a space, you're bounded by its (time), 
// and its (constraints)
// ------------------------
function Space(style_ref) {

	/**@type {Chowk.Signal<RectangleDOM[]>}*/
	const space_entities = sig([])

	const add_css = (css) => style_ref.push(css)
	const add = (el) => {
		if (el.css) add_css(el.css)
		space_entities([...space_entities(), el])
	}

	const space_dom = mem(() =>
		hdom([".main",
			...space_entities().map(e => e.html)
		])
	)

	return {
		add,
		html: space_dom,
	}
}

let space = Space(style)

/**
 * @typedef {{
 *	html: any,
 *	css: any,
 *	rectangle: Rectangle
 * }} RectangleDOM
 * */

// -----------------------
// *Header: Graphics
// 1. p5  
// 2. animation
// -----------------------
function init_p5(el) {
	let p = new Q5('instance', el);

	let r1 = 200;
	let r2 = 440;
	let text1 = "अलगpracticeseeee"
	let textc = "#9366C5";
	let e1font, e2font, e3font
	p.setup = () => {
		p.createCanvas(window.innerWidth, window.innerWidth, { alpha: true });
		p.angleMode(p.DEGREES);
	};

	p.preload = () => {
		e1font = p.loadFont("./fonts/Rajdhani-Light.ttf");
		e2font = p.loadFont("./fonts/Rajdhani-Light.ttf");
		e3font = p.loadFont("./fonts/DuctusCalligraphic.otf");
	}

	let an = 0
	function draw_character(angle, char) {
		p.textSize(70);
		p.noStroke();
		p.textAlign(p.CENTER, p.CENTER);

		let x = p.cos(angle) * r1;
		let y = p.sin(angle) * r2;

		p.rectMode(p.CENTER);
		//rotation for each point
		let x1 = x * p.cos(an) - y * p.sin(an) + p.width / 2;
		let y1 = x * p.sin(an) + y * p.cos(an) + p.height / 4;

		if (angle > 80) p.textFont(e2font);
		else p.textFont(e1font)

		p.stroke(colors.white);
		p.noFill()
		p.circle(x1, y1, 80)

		p.fill(colors.white)
		p.noStroke()
		p.text(char, x1, y1);
	}

	p.draw = () => {
		p.clear()
		an = p.lerp(an, (mouse_y() * mouse_x()) / 300, 0.001)
		p.stroke(255);
		p.noFill();

		text1.split("").forEach((char, i) => {
			let angle = 360 / text1.length * i
			draw_character(angle, char)
		})

		r1 = 300 + p.cos(90 - an) * 80;
		r2 = 300 + p.sin(90 - an) * 120;
	}
}

/**
 * @param {Rectangle} rectangle
 * @param {{x: number, y: number}} pos
 * @param {number=} inc
 * @param {number=} t
 * @param {any=} timeout
 * */
const seek_rect = (pos, rectangle, inc = 8, t = 300, timeout) => {
	if (timeout) clearTimeout(timeout)
	let diff_x = rectangle.x() - pos.x
	let diff_y = rectangle.y() - pos.y

	let new_x = rectangle.x() + (rectangle.x() < pos.x ? inc : inc * -1)
	let new_y = rectangle.y() + (rectangle.y() < pos.y ? inc : inc * -1)

	let need_update_x = Math.abs(diff_x) > inc
	let need_update_y = Math.abs(diff_y) > inc

	let update_fn_x = () => {
		rectangle.x(new_x)
		seek_rect(pos, rectangle, inc, t, timeout)
	}

	let update_fn_y = () => {
		rectangle.y(new_y)
		seek_rect(pos, rectangle, inc, t, timeout)
	}

	let fns = []
	if (need_update_x) fns.push(update_fn_x)
	if (need_update_y) fns.push(update_fn_y)

	timeout = setTimeout(() => {
		const is = fns[Math.floor(Math.random() * fns.length)]
		if (is) is()
	}, t)
}

// -----------------------
// *Header: COMPONENTs
// -----------------------
const Main = () => hdom([["style", () => css(style)], space.html])

/**@type RectangleDOM*/
const Banner = (() => {
	let rectangle = Rectangle(20, 30, 25, 40, { unit: "v" })

	let inlinecss = rectangle.css()

	let css = [".ornament", {
		background: colors.highlight,
		"background-size": [[px(40), px(40)]],
		"background-image": [
			"linear-gradient(to right, #2222 1px, transparent 1px)",
			"linear-gradient(to bottom, #2222 1px, transparent 1px)",
		]
	}]

	let html = [".ornament", { style: inlinecss }]

	return { html, css, rectangle }
})()

/**@type RectangleDOM*/
const Information = (() => {
	let rectangle = Rectangle(
		40, 1,
		100 - 40 - 1, 60,
		{ unit: "v" }
	)


	let style = rectangle.css()

	const html = [".resources", { style: style }]
	const css = [".resources", {
		position: "fixed",
		background: colors.highlight,
		"background-size": [[px(40), px(40)]],
		"background-image": [
			"linear-gradient(to right, #2222 1px, transparent 1px)",
			"linear-gradient(to bottom, #2222 1px, transparent 1px)",
		]
	}]

	return { css, html, rectangle }
})()

/**@type RectangleDOM*/
let Schedule = (function() {
	let css = [
		".schedule", {
			"font-family": "monospace",
			background: colors.white,
			color: () => colors.text,
			transition: [["all", ms(200)]],
			cursor: "crosshair",
			display: "grid",
			"grid-template-rows": [[percent(20), percent(80)]]
		},

		["h2", { "padding": rem(1) }],

		[".schedule-container", {
			"height": percent(100),
			"overflow-y": "scroll"
		}],

		[".section", {
			margin: [[0, rem(1.25)]],
			padding: rem(.25),
			"padding-bottom": rem(1.25),
			"border-top": [[px(1), "solid", colors.highlight]],
			color: colors.highlight,
		},
			[":hover", {
				color: colors.white,
				"background-color": colors.highlight
			}],

			[".title", { "font-family": "ductus" }],
			[".time", {
				display: "block-inline",
				padding: [[0, em(.5)]],
				"width": "min-content",
				"background-color": colors.highlight, color: colors.white,
				"border-radius": px(15)
			}]
		],
	]

	let rectangle = Rectangle(1, 45, 30, 60, { unit: "v" })
	let inlincecss = rectangle.css()

	const html =
		[".schedule",
			{
				onmouseenter: (e) => e.target == e.currentTarget
					? rectangle.y(rectangle.y() + (Math.random() * 5) - 2.5)
					: null,

				onmouseleave: (e) => e.target == e.currentTarget
					? rectangle.y(Math.random() * 50)
					: null,

				style: inlincecss
			},
			["h2", "Schedule"],
			[".schedule-container",
				[".section",
					[".title", "Eric Francisco"],
					[".time", "2pm"]
				],
				[".section",
					[".title", "Scott Deeming"],
					[".time", "3pm"]
				],
				[".section",
					[".title", "Garry Ing"],
					[".time", "3pm"]
				],
				[".section",
					[".title", "1RG"],
					[".time", "4pm"]
				],
				[".section",
					[".title", "E.L Guerero"],
					[".time", "4pm"]
				],
				[".section",
					[".title", "Symon Oliver"],
					[".time", "4pm"]
				],
				[".section",
					[".title", "SHEEP School"],
					[".time", "2pm"]
				],

			]
		]
	return { html, css, rectangle }
})()


//----------------------------
// TEMP
//----------------------------
/**@type {RectangleDOM[]}*/
let comps = [Schedule, Information, Banner]

comps.forEach((el) => {
	seek_rect(random_pos(
		el.rectangle.w(),
		el.rectangle.h()),
		el.rectangle,
		5.5, 300)
})

setInterval(() => {
	comps.forEach((el) => {
		seek_rect(random_pos(
			el.rectangle.w(),
			el.rectangle.h()),
			el.rectangle,
			5.5, 300)
	})
}, 15000)


const Stage = (() => {
	const html = () => hdom([".canvas", { ref: init_p5 }])
	const css = [".canvas", { position: "fixed" }, fullscreen]
	return { html, css }
})()

space.add(Banner)
space.add(Information)
space.add(Stage)
space.add(Schedule)

// -----------------------
// Event Listeners
// -----------------------
document.body.onmousemove = (e) => {
	mouse_x(e.clientX)
	mouse_y(e.clientY)
}
// -----------------------
//

/**@type {RectangleDOM}*/
const First = (() => {
	let rectangle = Rectangle(0, 0, 100, 100, { unit: "%", strategy: "absolute" })
	let inlinecss = rectangle.css()
	let html = () => hdom([".test-box", { style: inlinecss }, "Alternative"])
	let css = [".test-box", {
		padding: [[rem(.5), rem(1)]],
		"font-family": "anthony",
		"background-color": colors.highlight, color: "white", transition: "all 700ms ease-in"
	}]

	return { html, css, rectangle }
})()

/**@type {RectangleDOM}*/
const Second = (() => {
	let rectangle = Rectangle(0, 0, 100, 100)
	let inlinecss = rectangle.css()
	let html = () => hdom([".test-box", { style: inlinecss }, "Practices"])
	return { html, css, rectangle }
})()

/**
 * @param {RectangleDOM} first 
 * @param {RectangleDOM} second 
 * @returns {RectangleDOM}
 * */
const maskcontainer = (first, second) => {
	// will get containers items that take 100% w and h 	
	const first_class = sig("bottom")
	const second_class = sig("top")

	const overrides = {
		wUnit: "%",
		hUnit: "%",
		xUnit: "%",
		yUnit: "%",
		strategy: "absolute"
	}

	const runoveride = (el) => {
		let opts = el.rectangle.opts()
		let new_opts = Object.assign(opts, overrides)
		el.rectangle.opts(new_opts)
	}

	const init = () => {
		runoveride(first)
		runoveride(second)
	}

	init()

	const runreset = (el) => {
		el.rectangle.x(0)
		el.rectangle.y(0)
		el.rectangle.w(100)
		el.rectangle.h(100)
	}

	const reset = () => {
		runreset(first)
		runreset(second)
	}

	const onanimationend = () => {
		swap()
		reset()
	}

	const animate = () => {
		ordered()[1].rectangle.x(100)
		ordered()[1].rectangle.w(0)

		setTimeout(() => {
			onanimationend()
			setTimeout(animate, 500)
		}, 2000)
	}

	/**@type {Chowk.Signal<RectangleDOM[]>}*/
	const ordered = sig([first, second])
	const swap = () => {
		let f = ordered()[0]
		let s = ordered()[1]
		ordered([s, f])
	}

	const rectangle = Rectangle(1, 94, 20, 5, { unit: "v" })
	const cssref = rectangle.css()
	const inlinecss = mem(() => cssref() + "overflow: hidden;")
	const render = e => e.html()
	const html = () => hdom([".masked",
		{ style: inlinecss },
		() => each(ordered, render)
	])

	animate()

	return { html, css: [".masked", { position: "relative" }, first.css, second.css], rectangle }
}

space.add(maskcontainer(First, Second))

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
