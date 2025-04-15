import { mounted, render, mut, sig, mem, eff_on, each, if_then } from "./chowk/monke.js"
import { hdom } from "./chowk/hdom/index.js"
import { Easings } from "./easings.js"
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
const toss = () => Math.random() > .5

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
	white: "#eeeeee",
	black: "#4D4D4D"
})

const type = mut({
	heading: "cirrus"
})


function move() {
	comps.forEach((e) => {
		let pos = random_pos(e.rectangle.w(), e.rectangle.h())
		e.rectangle.navigator.navigate_to(pos.x, pos.y, 25, 350)
	})
	let pos = random_range([0, 30], [40, 70])
	Timing.rectangle.navigator.navigate_to(pos.x, pos.y)
}

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

let random = (min, max) => Math.random() * (max - min) + min;
let random_range = (x = [0, 100], y = [0, 100]) => ({
	x: random(x[0], x[1]),
	y: random(y[0], y[1])
})

const offscreen = () => {
	// either outside positive
	let xr = Math.random() * 100
	let yr = Math.random() * 100

	let dx = (toss() ? 1 : -1)
	let dy = (toss() ? 1 : -1)

	let fx = dx > 0 ? (100 + xr) : xr * dx
	let fy = dy > 0 ? (100 + yr) : yr * dy

	return { x: fx, y: fy }
}


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
	loadfont("./fonts/Roberte-Regular.woff", "roberte"),
	loadfont("./fonts/Anthony.otf", "anthony"),
	loadfont("./fonts/TINY5x3GX.ttf", "tiny"),
	loadfont("./fonts/CirrusCumulus.otf", "cirrus"),
	loadfont("./fonts/Rajdhani-Light.ttf", "rajdhani"),
	loadfont("./fonts/DuctusCalligraphic.otf", "ductus"),

	["*", {
		padding: 0,
		margin: 0,
		transition: [["all", ms(20)]],
		cursor: "crosshair",
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
		background: colors.white,
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
// 1. #Navigator;
// 2. #Rectangle;
// 3. #Squad;
// 4. #Space;
// ------------------

// -----------------------
// gets ref to Rectangle
// ----------------------

/**
 * @typedef {{
 *	navigate_to : (x: number, y: number, increment?: number, interval?: number) => void
 *	destination : Chowk.Signal<{x: number, y: number}>,
 *	timeline: TimelineInstance,
 *	}} Navigator
 * @param {Rectangle} rectangle 
 * @returns {Navigator}
 * */
function Navigator(rectangle) {
	// init with a ref to rectangle

	/**@type {TimelineInstance}*/
	let timeline = Timeline()

	/**
	 * @typedef {{
	 *	queue: Keyframe[],
	 *	padded: Keyframe[],
	 *	last_value: number,
	 *	addempty: (duration: number) => void,
	 *	addnext: () => void,
	 * }} Accumalator
	 * @param {Keyframe[]} keys
	 * @returns {Accumalator}
	 * */
	let accumalator = (keys) => {
		/**@type {Accumalator}*/
		let api = {
			queue: keys,
			padded: [],
			last_value: keys[0]?.start,
			addempty: (duration) => {
				let key = { start: api.last_value, end: api.last_value, duration }
				api.padded.push(key)
			},
			addnext: () => {
				let last = api.queue.shift()
				api.padded.push(last)
				api.last_value = last.end
			}
		}

		return api
	}

	let destination = sig({ x: rectangle.x(), y: rectangle.y() })

	const navigate_to = (x, y, inc, int) => {
		timeline.clear()
		destination({ x, y })

		// will return based on dimensions...
		const increment = () => inc ? inc : 15
		// will return based on dimensions...
		const interval = () => int ? int : 500


		/**@type {Accumalator}*/ let x_
		/**@type {Accumalator}*/ let y_

		if (x !== undefined) { x_ = accumalator(generate(rectangle.x(), x, increment(), interval())) }
		if (y !== undefined) { y_ = accumalator(generate(rectangle.y(), y, increment(), interval())) }

		while (x_.queue.length > 0 || y_.queue.length > 0) {
			let opts = [x_, y_]
			let random = Math.floor(Math.random() * opts.length)
			let item = opts.splice(random, 1)[0]
			if (item.queue.length == 0) continue
			opts.forEach(e => e.addempty(interval()))
			item.addnext()
		}

		timeline.add(animate.prop(x_.padded, rectangle.x).setEasing("InOutCubic"))
		timeline.add(animate.prop(y_.padded, rectangle.y).setEasing("InOutCubic"))
	}

	/**@returns {Keyframe[]}*/
	const generate = (from, to, increment, interval) => {
		let diff = to - from
		let iterations = Math.ceil(Math.abs(diff) / increment)
		let last = from

		/**@type {Keyframe[]}*/
		let keyframes = Array(iterations).fill(0).map(e => {
			let direction = last < to ? 1 : -1
			let end = last + (increment * direction)
			let crossed = direction > 0 ? end > to : end < to
			end = crossed ? to : end

			let key = {
				start: last,
				end,
				duration: interval
			}

			last = end
			return key
		})

		return keyframes
	}

	// will manage an instace of animation
	// if new navigation request comes, dispose animation and create new
	//
	return { navigate_to, destination, timeline }
}

/**
 * @typedef {("px" | "vh" | "vw" | "v" | "em" | "%")} Unit
 * @typedef {{
 *   color?: string,
 *   opacity?: string,
 *   background?: string,
 *   "background-image"?: string,
 *   "background-size"?: string,
 *   "background-position"?: string,
 *   css: () => string
 * }} Material
 * @typedef {{
 *   xAxis?: ("left" | "right"),
 *   unit?: Unit,
 *   yAxis?: ("top" | "bottom"),
 *   strategy?: ("fixed" | "absolute"),
 *   wUnit?: Unit,
 *   hUnit?: Unit,
 *   xUnit?: Unit,
 *   yUnit?: Unit,
 *   material?: Material
 * }} RectangleOpts
 */
class Rectangle {

	/**
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} w 
	 * @param {number} h 
	 * @param {RectangleOpts} [opts]
	 */
	constructor(x, y, w, h, opts) {
		const default_opts = { xAxis: "left", yAxis: "top", strategy: "fixed", unit: "px" }
		/** @type {Chowk.Signal<RectangleOpts>} */
		this.opts = sig(Object.assign({}, default_opts, opts))

		this.x = sig(x)
		this.y = sig(y)
		this.w = sig(w)
		this.h = sig(h)

		/** @type {RectangleDOMChild[]} */
		this.children = []

		this.navigator = Navigator(this)

		// Reactions
		const derived = mem(() => ({
			x: this.x(),
			y: this.y(),
			w: this.w(),
			h: this.h(),
		}))

		eff_on(this.navigator.destination, () =>
			this.children.forEach(child => {
				const obj = {
					...derived(),
					...this.navigator.destination()
				}

				child.follow(obj)
			})
		)
	}

	/**
	 * @param {RectangleDOMChild} child
	 */
	add_child(child) {
		this.children.push(child)
	}

	/**
	 * @param {("x" | "y" | "w" | "h")} prop
	 * @returns {Unit}
	 */
	unit(prop) {
		const _opts = this.opts()
		const def = (axis) => _opts.unit === "v"
			? axis === "x" ? "vw" : "vh"
			: _opts.unit

		if (prop === "x") return _opts.xUnit ?? def("x")
		if (prop === "y") return _opts.yUnit ?? def("y")
		if (prop === "w") return _opts.wUnit ?? def("x")
		if (prop === "h") return _opts.hUnit ?? def("y")
	}

	/**
	 * @returns {() => string}
	 */
	css() {
		return mem(() =>
			css(rect(
				this.x() + this.unit("x"),
				this.y() + this.unit("y"),
				this.w() + this.unit("w"),
				this.h() + this.unit("h"),
				this.opts()
			)) +
			(this.opts().material?.css?.() ?? "")
		)
	}
}

/**
 * @typedef {{x: number, y: number, w: number, h: number}} Bounding
 * @param {RectangleDOM} element
 * @param {(bounding: Bounding) => void} followfn 
 * @returns {RectangleDOMChild}  
 * */
function Child(element, followfn) {
	let html = element.html
	let css = element.css
	let rectangle = element.rectangle
	let follow = followfn

	return { html, css, rectangle, follow }
}

// -----------------------
// #Squad;
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

// ----------------------
// #Clock;
//
// can't do without time.
// all game components ask the clock for elapsed time
// Clock can be asked to schedule events (use this for set timeout....)
// Clocks values are signals, so they can be subscribed to,
// for instance animation can be implemented in effect.
//
// ```
// eff_on(elapsedTime, () => 
//	 keyframe.time <= elapsedTime() 
//		 ? animate() 
//		 : null)
// ```
//
// ----------------------
/**
 * @typedef {( time:{
 *	stamp: number,
 *	start: number,
 *	delta: number,
 *	elapsed: number,
 *	last: number,
 *	destroy: () => void
 * }) => void} ClockCallback
 *
 * @typedef {{
 *	start: number,
 *	elapsed: Chowk.Signal<number>,
 *	last: Chowk.Signal<number>,
 *	add: (fn: ClockCallback) => void
 *	pause: () => void,
 *	play: () => void,
 *	paused: boolean
 * }} Clock
 *
 * @returns {Clock}
 * */
function Clock() {
	/**@type {ClockCallback[]}*/
	const callbacks = []

	/**@type {Clock}*/
	const i = {}
	i.paused = false
	i.pause = () => i.paused = false
	i.play = () => i.paused = true
	i.start = undefined
	i.elapsed = sig(0)
	i.last = sig(0)

	/**@param {ClockCallback} fn*/
	i.add = (fn) => callbacks.push(fn)

	/**@type {FrameRequestCallback}*/
	const run = stamp => {
		requestAnimationFrame(run)
		console.log("cb", callbacks.length)

		i.start ? null : i.start = stamp
		i.elapsed(stamp - i.start)

		if (!i.paused) {
			callbacks.forEach((e, index, c) => e({
				stamp,
				start: i.start,
				delta: stamp - i.last(),
				elapsed: i.elapsed(),
				last: i.last(),
				destroy: () => c.splice(c.findIndex(f => f === e), 1)
			}))
		}

		i.last(stamp)
	}

	requestAnimationFrame(run)
	return i
}

let clock = Clock()

// ------------------------
// #Space;
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
	///**@type {Chowk.Signal<(RectangleDOM | RectangleDOMChild)[]>}*/
	const space_entities = sig([])
	const add_css = (css) => style_ref.push(css)

	/**
	 * @param {{
	 *	html: any,
	 *	css: any,
	 * }} el
	 * */
	const add = (el) => {
		if (el.css) add_css(el.css)
		space_entities([...space_entities(), el])
	}

	const space_dom = mem(() =>
		hdom([".main",
			{ onclick: move },
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

/**
 * @typedef {{
 *	html: any,
 *	css: any,
 *	rectangle: Rectangle,
 *	follow: (bounding: Bounding) => void
 * }} RectangleDOMChild
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
	let farsi = "دیگر"
	let hindi = "अलग"
	let english = "alt"
	let text1 = english + "practices"
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
		p.textSize(40);
		p.noStroke();
		p.textAlign(p.CENTER, p.CENTER);

		let x = p.cos(angle) * r1;
		let y = p.sin(angle) * r2;

		p.rectMode(p.CENTER);
		//rotation for each point
		let x1 = x * p.cos(an) - y * p.sin(an) + p.width / 2;
		let y1 = x * p.sin(an) + y * p.cos(an) + p.height / 3;

		if (angle > 80) p.textFont(e2font);
		else p.textFont(e1font)

		p.stroke(colors.black);
		p.noFill()
		p.circle(x1, y1, 60)

		p.fill(colors.black)
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


		let rw = p.width / 4
		let ry = p.height / 4

		r1 = (rw * .8) + p.cos(90 - an) * (rw * .2);
		r2 = (ry * .8) + p.sin(90 - an) * (ry * .2);
	}
}

/**
 * @typedef {{
 *  start: number,
 *  end: number,
 *  duration: number,
 *  easing?: string,
 *	onend?: () => void 
 *	onstart?: () => void 
 *	onupdate?: () => void 
 *	ondestroy?: (reason: string) => void 
 * }} Keyframe
 *
 * @typedef {{
 *   active: boolean,
 *   looping: boolean,
 *   elapsedTime: number,
 *   activeMotion: number,
 *   currentValue: number,
 *   keyframes: Array<Keyframe>,
 *   destroy: () => void,
 *   animate: () => void,
 *   update: ClockCallback,
 *   add: (key: Keyframe) => PropInstance,
 *   loop: () => void,
 *   val: () => number,
 *   setEasing: (easing: string) => PropInstance,
 * }} PropInstance
 *
 * @param {Clock} clock 
 * @param {Keyframe[]} keyframes
 * @param {(val:number) => void} setter 
 * @returns {PropInstance}
 */
function Prop(clock, keyframes, setter) {
	let should_destroy = false
	/**@type {PropInstance}*/
	const api = {
		active: true,
		looping: false,
		elapsedTime: 0,
		activeMotion: 0,
		currentValue: 0,
		keyframes: keyframes.map(key => ({
			start: key.start,
			end: key.end,
			duration: key.duration,
			onend: key.onend,
			onstart: key.onstart,
			onupdate: key.onupdate,
			ondestroy: key.ondestroy,
			easing: key.easing ? key.easing : "linear",
		})),


		// Update method called on each frame, with time delta
		/**@type {ClockCallback}*/
		update(time) {
			let fps = 1000 / time.delta
			if (!_runChecks(time.destroy)) return
			let motion = api.keyframes[api.activeMotion]
			if (motion.onupdate) motion.onupdate()

			api.elapsedTime == 0 && motion.onstart
				? motion.onstart()
				: null

			api.elapsedTime += time.delta
			api.currentValue = _calculate(motion)
			setter(api.currentValue)
		},

		// Add a new keyframe to the animation
		/**@param { Keyframe } keyframe*/
		add(keyframe) {
			const last = api.keyframes[api.keyframes.length - 1]
			api.keyframes.push({
				start: last.end,
				end: keyframe.end,
				duration: keyframe.duration,
				easing: keyframe.easing ? keyframe.easing : "linear"
			})
			return api
		},

		destroy() { should_destroy = true },
		animate() { api.active = true },
		loop() { api.looping = true },
		val() { return api.currentValue },
		setEasing(easing) { api.keyframes.forEach((_, i, c) => c[i].easing = easing); return api },
	}

	// Check if animation should continue
	const _runChecks = (destroy) => {
		const motion = api.keyframes[api.activeMotion]

		if (api.elapsedTime >= motion.duration && motion.onend) motion.onend()
		if (should_destroy) {
			if (motion.ondestroy) motion.ondestroy("asked")
			destroy()
		}
		if (!api.active) return false

		if (api.elapsedTime >= motion.duration) {
			if (api.activeMotion < api.keyframes.length - 1) {
				api.activeMotion++
				api.elapsedTime = 0
			} else {
				if (api.looping) {
					api.activeMotion = 0
					api.elapsedTime = 0
				} else {
					api.active = false
					if (motion.ondestroy) motion.ondestroy("over and no loop")
					destroy()
					return false
				}
			}
		}

		return true
	}

	// Calculate the current value based on elapsed time and easing function
	const _calculate = (motion) => {
		const progress = api.elapsedTime / motion.duration
		return _interpolate(motion.start, motion.end, progress, motion.easing)
	}

	// Interpolation based on easing function
	const _interpolate = (start, end, amt, easing) => {
		const easingFn = easing in Easings ? Easings[easing] : Easings.linear
		return easingFn(amt) * (end - start) + start
	}

	clock.add(api.update)

	return api
}

/**
 * @typedef {{
 *   add: (prop: PropInstance) => TimelineInstance,
 *   loop: () => TimelineInstance,
 *   animate: () => TimelineInstance,
 *   setEasing: (easing: string) => TimelineInstance,
 *   pause: () => TimelineInstance,
 *   clear: () => void,
 * }} TimelineInstance
 *
 * @returns {TimelineInstance}
 */
function Timeline() {
	/** @type {PropInstance[]} */
	const props = [];

	/** @type {TimelineInstance} */
	const api = {
		add(prop) {
			props.push(prop);
			return api;
		},
		loop() {
			props.forEach(p => p.loop());
			return api;
		},
		animate() {
			props.forEach(p => p.animate());
			return api;
		},
		pause() {
			props.forEach(p => p.active = false);
			return api;
		},
		setEasing(easing) {
			props.forEach(p => p.setEasing(easing));
			return api;
		},
		clear() {
			props.forEach(p => p.destroy());
			props.length = 0;
		},
	};

	return api;
}

function Animator(clock) {
	/**@param {Keyframe[]} keyframes*/
	const prop = (keyframes, setter) => Prop(clock, keyframes, setter)
	return { prop }
}

const animate = Animator(clock)

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

	let onend = () => seek_rect(pos, rectangle, inc, t, timeout)
	let update_fn_x = () => {
		let start = rectangle.x()
		let end = new_x

		animate.prop([{ start, end, duration: t + 50, onend }], rectangle.x).setEasing("OutQuart")
	}

	let update_fn_y = () => {
		let start = rectangle.y()
		let end = new_y

		animate
			.prop([{ start, end, duration: t + 50, onend }], rectangle.y)
			.setEasing("OutQuart")
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

let colored_grid = (color, grid_size = 40, linecolor = "#2222") => ({
	css: () => CSS.css({
		background: color,
		"background-size": [[px(grid_size), px(grid_size)]],
		"background-image": [
			`linear-gradient(to right, ${linecolor} 1px, transparent 1px)`,
			`linear-gradient(to bottom, ${linecolor} 1px, transparent 1px)`,
		]
	})
})

/**@type {Material}*/
let purple_grid = colored_grid(colors.highlight, 40)

/**@type {Material}*/
let white_grid = colored_grid(colors.white, 4)

/**@type RectangleDOM*/
const Alternative = (() => {
	let rectangle = new Rectangle(20, 30, 40, 20, { unit: "v", material: purple_grid })

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
const Symposium = (() => {
	/**@type {Material}*/
	let material = purple_grid
	let rectangle = new Rectangle(40, 1, 40, 20, { unit: "v", material }
	)

	let style = rectangle.css()

	const html = [".resources", { style: style }]
	const css = [".resources",]

	return { css, html, rectangle }
})()

/** 
 * @param {Material[]} materials
 * @returns {Material}
 */
let compose = (...materials) => {
	let fns = []
	materials.forEach(m => fns.push(m.css))
	return { css: () => fns.reduce((acc, fn) => acc += fn(), "") }
}

/**@returns {Material}*/
let emptycolor = (color = colors.white) => ({
	css: () => CSS.css({
		"background-color": color,
	})
})

/**@type RectangleDOM*/
let Timing = (function() {
	let css = [
		".schedule", {
			"font-family": "monospace",
			background: colors.white,
			color: () => colors.text,
			//transition: [["all", ms(200)]],
			cursor: "crosshair",
			border: ".5px dotted " + colors.highlight,
			"box-shadow": [[0, 0, px(30), px(10), colors.black + "22"]],
			padding: em(1)
		},

		["h2.address", {
			"font-family": "Helvetica",
			"font-weight": 300,
			"line-height": em(1.4),
			"background-color": colors.white,
			"color": colors.black,
			//border: [[px(.5), "solid", "black"]],
			// "background-color": colors.text,
			"padding": [[0, px(5)]],

			"font-size": em(1.7),
			width: em(10),
		}],
		[".time", {
			"margin-top": px(10)
		}],

		["h2.date", {
			"font-family": "Helvetica",
			"font-weight": 600,
			"line-height": em(1.4),
			"background-color": colors.white,
			"color": colors.black,
			//border: [[px(.5), "solid", "black"]],
			// "background-color": colors.text,
			"padding": [[0, px(5)]],

			"font-size": em(1.7),
			"margin-top": em(.5),
			"margin-left": em(1),
			width: "min-width",
		}],
	]

	let rectangle = new Rectangle(1, 45, 50, 23, {
		unit: "v",
		material: colored_grid(colors.white)
		// compose(
		// 	colored_grid(colors.text + "22", 2),
		// 	emptycolor("white")
		// )
	})
	let inlincecss = rectangle.css()

	const html = [".schedule", { style: inlincecss },
		["h2.address", "113 McCaul"],
		["h2.address", "(Annex Building)"],
		["h2.address", "MCC 512"],
		["h4.time", "4:30pm - 9:30pm"],
		["h2.date", "22 APRIL"],
	]
	return { html, css, rectangle }
})()


const Stage = (() => {
	const html = () => hdom([".canvas", { ref: init_p5 }])
	const css = [".canvas", { position: "fixed", "mix-blend-mode": "difference" }, fullscreen]
	return { html, css }
})()



/**@returns {Keyframe[]}*/
let jump = (initial, then) => {
	let top = initial - 5
	return [
		{ start: initial, end: top, duration: 350, easing: "OutCubic" },
		{ start: top, end: top - .5, duration: 150, easing: "OutCubic" },
		{ start: top - .5, end: initial - .5, duration: 150, easing: "InCubic" },
		{ start: initial - .5, end: initial, duration: 350, easing: "InCubic", onend: then },
	]
}

let offset = (mul) => Math.random() * (toss() ? mul : mul * -1)

/** @param {(bounds: Bounding) => ({x: number, y: number})} anchor 
 * @param {Rectangle} rectangle
**/
function follow_fn(rectangle, anchor) {
	return function(dims) {
		setTimeout(() => {
			let pos = anchor(dims)

			let actual = () => rectangle.navigator.navigate_to(
				pos.x, pos.y, 8, 250)
			let jumpy = () => {
				let tl = rectangle.navigator.timeline
				tl.clear()
				tl.add(animate.prop(jump(rectangle.y(), actual), rectangle.y))
			}

			toss() ? jumpy() : actual()
		}, 700)
	}
}

/*
* @param {(bounds: Bounding) => ({x: number, y: number})} anchor
**/
function follow_simple(rectangle) {
	return function(dims) { rectangle.navigator.navigate_to(dims.x, dims.y, 8, 250) }
}

/**@type {RectangleDOM}*/
const First = (() => {
	let rectangle = new Rectangle(0, 0, 100, 100, { unit: "%", strategy: "absolute", material: colored_grid(colors.white, 8) })
	let ref = rectangle.css()
	let inlinecss = () => ref()
	let word = sig("Schedule")
	let html = () => hdom([".test-box", { style: inlinecss }, ["h2", { style: 'font-family: "cirrus";font-weight: 100;' }, word]])
	let css = [".test-box", {
		padding: [[rem(.5), rem(1)]],
		"font-family": "anthony",
		"background-color": colors.white, color: colors.text,
		//transition: "all 400ms ease-in"
	}]

	return { html, css, rectangle }
})()

/**@type {RectangleDOM}*/
const Second = (() => {
	let rectangle = new Rectangle(0, 0, 100, 100, { unit: "%", strategy: "absolute" })
	let inlinecss = rectangle.css()
	let html = () => hdom([".test-box", { style: inlinecss }, ["h2", "Schedule"]])
	return { html, css, rectangle }
})()

/**
 * @param {Rectangle} rect
 * @returns {RectangleDOM}
 * */
const domfromrectangle = (rect) => {
	let css = ""
	let ref = rect.css()
	let off = sig(offset(365))

	setInterval(() => {
		off(offset(185))
	}, 2000 + Math.random() * 2000)

	let inlinecss = () => ref() + `;transform: rotate(${off()}deg);transition: transform 200ms`
	let html = () => hdom(["div", { style: inlinecss }])
	return { html, css, rectangle: rect }
}

/**@returns {Material}*/
let imagematerial = (src) => ({
	css: () => css({
		background: "#fff0",
		"background-image": url(src),
		"background-size": "contain",
		"background-repeat": "no-repeat"
	})
})



/**
 * @param {RectangleDOM} first 
 * @param {RectangleDOM} second 
 * @returns {RectangleDOM}
 * */
const maskcontainer = (first, second, rectangle = new Rectangle(1, 94, 250, 10, { unit: "v", wUnit: "px" })) => {
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
		console.log("scheduled")
		swap()
		reset()
		setTimeout(_animate, 5)
	}

	const _animate = () => {
		console.log("ran")
		let direction = toss() ? -1 : 1
		let axis = toss() ? "x" : "y"

		let start = ordered()[1].rectangle[axis]()
		let end = 100 * direction
		let onend = onanimationend

		animate.prop(
			[
				{ start, end: start, duration: 1500, },
				{ start, end, duration: 500, onend }
			],
			ordered()[1].rectangle[axis]
		).setEasing("InCubic")
	}

	/**@type {Chowk.Signal<RectangleDOM[]>}*/
	const ordered = sig([first, second])
	const swap = () => {
		let f = ordered()[0]
		let s = ordered()[1]
		ordered([s, f])
	}

	const cssref = rectangle.css()
	const inlinecss = mem(() => cssref() + "overflow: hidden;")
	const render = e => e.html()
	const html = [".masked", { style: inlinecss }, () => each(ordered, render)]

	onanimationend()

	return { html, css: [".masked", { position: "relative" }, first.css, second.css], rectangle }
}


/**
 * @param {string} letter 
 * @param {Rectangle=} rectangle 
 * @param {[Material, Material]=} materials 
 * */
function Dual(letter, rectangle, materials, font = "cirrus") {
	rectangle = rectangle ? rectangle : new Rectangle(20, 20, 550, 10, { unit: "v", wUnit: "px" })
	materials = materials ? materials : [colored_grid(colors.white), colored_grid(colors.base)]
	let fo = { style: "font-family: " + font }
	let Alternative = (() => {
		let rectangle = new Rectangle(0, 0, 100, 100, { unit: "%", strategy: "absolute", material: materials[0] })
		let inlinecss = rectangle.css()
		let html = () => hdom([".alt-box", { style: inlinecss }, ["h2", fo, letter]])
		return { html, css, rectangle }
	})()

	let Practices = (() => {
		let rectangle = new Rectangle(0, 0, 100, 100, { unit: "%", strategy: "absolute", material: materials[1] })
		let inlinecss = rectangle.css()
		let html = () => hdom([".alt-box", { style: inlinecss }, ["h2", fo, letter]])
		return { html, css, rectangle }
	})()

	let dom = maskcontainer(Alternative, Practices, rectangle)
	return dom
}


/**@returns {Material}*/
let typography = (color, font = "anthony") => {
	return {
		css: () => CSS.css({
			"font-family": font,
			"color": color,
		})
	}
}

/**@returns {Material}*/
let curves = (radius = 50) => {
	return {
		css: () => CSS.css({
			"border-radius": px(radius),
		})
	}
}


let alternate_position = { x: 20, y: 20 }
let practices_position = { x: 8.5, y: 27 }
let symposium_position = { x: 18.5, y: 34 }



let materials = [
	compose(
		emptycolor(),
		typography(colors.text),
	),

	compose(
		colored_grid(colors.white, 10),
		typography(colors.text),
	),
]



// "Alternative".split("").map((char, i) => {
// 	let rect = new Rectangle(20 + i * 4, 20, 8, 10, { unit: "v" })
// 	space.add(Dual(char, rect))
// })

// x-------------------x
// Shape creator
// x-------------------x
const shape = (src, fn) => {
	let { x, y } = offscreen()
	let rectangle = new Rectangle(x, y, Math.random() * 8 + 5, Math.random() * 8 + 5, {
		unit: "v",
		material: imagematerial(src)
	})

	let domdom = domfromrectangle(rectangle)
	fn = fn ? fn(rectangle) : follow_fn(rectangle, (dims) => ({ x: dims.x + offset(3), y: dims.y + offset(2) }))

	return Child(domdom, fn)
}

// x-------------------x
// Follow fns
// x-------------------x
let tl = (rectangle) => follow_fn(rectangle, (dims) => ({ x: dims.x + offset(3), y: dims.y + offset(2) }))
let tr = (rectangle) => follow_fn(rectangle, (dims) => ({ x: dims.x + dims.w + offset(3), y: dims.y + offset(2) }))
let br = (rectangle) => follow_fn(rectangle, (dims) => ({ x: dims.x + dims.w + offset(3), y: dims.y + dims.h + offset(2) }))
let bl = (rectangle) => follow_fn(rectangle, (dims) => ({ x: dims.x + offset(3), y: dims.y + dims.h + offset(2) }))

let randomizer = (rectangle) => {
	let opts = [tl, tr, br, bl]
	let active = opts.map(e => e(rectangle))

	return (dims) => active[Math.floor(Math.random() * active.length)](dims)
}


function layer_one_shapes() {
	let shapes = Array(8).fill(0).map((e, i) => shape("./shapes/shape_" + ((i + 1) % 5) + ".png", randomizer))
	shapes.forEach((e) => {
		Symposium.rectangle.add_child(e)
		space.add(e)
	})
}
layer_one_shapes()


space.add(Symposium)
space.add(Stage)
space.add(Alternative)

let a = ["Alt", "ern", "ate", "ive"]
let mopts = [
	compose(
		emptycolor(colors.base),
		typography("black", "cirrus"),
	),
]

let alts = a.map((char, i) => {
	let lexlen = 12
	let randomarr = (arr) => arr[Math.floor(Math.random() * arr.length)]
	/**@type {[Material, Material]}*/
	let randos = [randomarr(mopts), randomarr(mopts)]
	let rect = new Rectangle(alternate_position.x + i * lexlen, alternate_position.y, lexlen, 10, { unit: "v" })
	return Dual(char, rect, randos)
})


let child_alts = alts.map((item, i) => {
	let lexlen = 12
	let fn = follow_fn(item.rectangle, (dims) => ({
		x: dims.x + offset(3) + i * lexlen,
		y: dims.y
	}))
	return Child(item, fn)
})

//child_alts.forEach((e) => Alternative.rectangle.add_child(e))
child_alts.forEach(space.add)

let p = ["Prac", "tices"]
p.forEach((char, i) => {
	let lexlen = 18

	let randomarr = (arr) => arr[Math.floor(Math.random() * arr.length)]
	/**@type {[Material, Material]}*/
	let randos = [randomarr(materials), randomarr(materials)]

	let rect = new Rectangle(practices_position.x + i * lexlen, practices_position.y, lexlen, 10, { unit: "v" })
	space.add(Dual(char, rect, randos))
})

let sym = ["Symp", "osium"]
sym.forEach((char, i) => {
	let lexlen = 20

	let randomarr = (arr) => arr[Math.floor(Math.random() * arr.length)]
	/**@type {[Material, Material]}*/
	let randos = [
		compose(
			emptycolor(colors.white),
		),
		compose(
			emptycolor(colors.white),
		)
	]

	let rect = new Rectangle(symposium_position.x + i * lexlen, symposium_position.y, lexlen, 10, { unit: "v" })
	space.add(Dual(char, rect, randos, "roberte"))
})

function layer_two_shapes() {
	let shapes = Array(3).fill(0).map((e, i) => shape("./shapes/shape_" + (i + 2) + ".png", randomizer))
	shapes.forEach((e) => {
		Alternative.rectangle.add_child(e)
		space.add(e)
	})
}
layer_two_shapes()

space.add(Timing)

function mount_schedule_banner() {
	let dom = maskcontainer(First, Second)
	let masked = Child(dom, follow_simple(dom.rectangle))
	Timing.rectangle.add_child(masked)
	space.add(masked)
}
//mount_schedule_banner()

// -----------------------
// Event Listeners
// -----------------------
document.body.onmousemove = (e) => {
	mouse_x(e.clientX)
	mouse_y(e.clientY)
}
// -----------------------
//

/**@type {RectangleDOM[]}*/
let comps = [Alternative, Symposium]

move()

render(Main, document.body) 
