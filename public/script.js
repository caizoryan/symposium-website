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
		transition: [["all", ms(20)]],
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
			last_value: keys[0].start,
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

		let count = 0
		while (x_.queue.length > 0 || y_.queue.length > 0) {
			count++
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
 * @typedef {{
 *	animate?: boolean,
 *	props?: {prop: string, ms: number}[], 
 *	ms?: number,
 * }} AnimationOpts
 *
 * @typedef {{
 *		xAxis?: ("left" | "right"),
 *		unit?: Unit,
 *		yAxis?: ("top" | "bottom"),
 *		strategy?: ("fixed" | "absolute"),
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
 *	navigator: Navigator,
 *	unit: (axis: ("x" | "y" | "w" | "h")) => Unit,
 *	opts: Chowk.Signal<RectangleOpts>,
 *	add_child: (child: RectangleDOMChild) => void,
 *	css: () => () => string
 * }} Rectangle
 *
 * @typedef {("px" | "vh" | "vw" | "v" | "em" | "%")} Unit
 *  ---
 *  #Rectangle;
 *  Manages rectangular, position width, height stuff
 *  gives us css and checks for intersections with: line and rect and or circle
 *
 *  example: 
 *  ```js
 *  ```
 *  ---
 *
 * TODO: Rectangle should own its animation queue: either in the form of set interval, or a queue that queues timeouts...
 * TODO: Rectangle should have animation props
 * TODO: Rectangle should a material, grid, lines, color, etc... -> with texture/image...
 * TODO: Rectangle should add children... on navigationChanged, follow children. Children have their own navigators.
 * TODO: Rotation and scale?
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

	/**@type {RectangleDOMChild[]}*/
	const children = []

	/**@param {RectangleDOMChild} child*/
	const add_child = (child) => children.push(child)

	const derived = mem(() => ({
		x: _x(),
		y: _y(),
		w: _w(),
		h: _h(),
	}))


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

	/**@type {Rectangle}*/
	const api = {
		x: _x,
		y: _y,
		w: _w,
		h: _h,
		unit: _unit,
		add_child,
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

	let navigator = Navigator(api)
	api.navigator = navigator

	eff_on(navigator.destination,
		() => children.forEach(child =>
			child.follow(
				Object.assign(derived(), navigator.destination())
			)))

	return api
}

/**
 * @param {RectangleDOM} element
 * @param {(bounding: {x: number, y: number, w: number, h: number}) => void} followfn 
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

		i.start ? null : i.start = stamp
		i.elapsed(stamp - i.start)

		if (!i.paused) {
			callbacks.forEach((e, index, c) => e({
				stamp,
				start: i.start,
				delta: stamp - i.last(),
				elapsed: i.elapsed(),
				last: i.last(),
				destroy: () => c.splice(index, 1)
			}))
		}

		i.last(stamp)
		console.log("cbs", callbacks.length)
	}

	requestAnimationFrame(run)
	return i
}

let clock = Clock()
//clock.add((t) => console.log((t.elapsed / 1000).toFixed(2)))
document.addEventListener("visibilitychange", () => {
	if (document.hidden) clock.pause()
	else clock.play()
});

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
 *	follow: (bounding: {x: number, y: number, w: number, h: number}) => void
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
 * @typedef {{
 *  start: number,
 *  end: number,
 *  duration: number,
 *  easing?: string,
 *	onend?: () => void 
 *	onstart?: () => void 
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
			easing: key.easing ? key.easing : "linear",
		})),


		// Update method called on each frame, with time delta
		/**@type {ClockCallback}*/
		update(time) {
			let fps = 1000 / time.delta

			if (!_runChecks(time.destroy)) return
			let motion = api.keyframes[api.activeMotion]

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
		if (should_destroy) destroy()
		if (!api.active) return false

		const motion = api.keyframes[api.activeMotion]

		if (api.elapsedTime >= motion.duration) {
			motion.onend ? motion.onend() : null

			if (api.activeMotion < api.keyframes.length - 1) {
				api.activeMotion++
				api.elapsedTime = 0
			} else {
				if (api.looping) {
					api.activeMotion = 0
					api.elapsedTime = 0
				} else {
					api.active = false
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
			//transition: [["all", ms(200)]],
			cursor: "crosshair",
			display: "grid",
			"grid-template-rows": [[percent(15), percent(85)]]
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
		[".schedule", { style: inlincecss },
			["h2", ""],
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
	let rectangle = Rectangle(0, 0, 100, 100, { unit: "%", strategy: "absolute" })
	let inlinecss = rectangle.css()
	let html = () => hdom([".test-box", { style: inlinecss }, ["h2", "Schedule"]])
	return { html, css, rectangle }
})()

/**
 * @param {RectangleDOM} first 
 * @param {RectangleDOM} second 
 * @returns {RectangleDOM}
 * */
const maskcontainer = (first, second) => {
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
		setTimeout(_animate, 150)
	}

	const _animate = () => {
		let direction = toss() ? -1 : 1
		let axis = toss() ? "x" : "y"

		let start = ordered()[1].rectangle[axis]()
		let end = 100 * direction
		let onend = onanimationend

		animate.prop(
			[
				{ start, end: start, duration: 1500 },
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

	const rectangle = Rectangle(1, 94, 250, 10, { unit: "v", wUnit: "px" })
	const cssref = rectangle.css()
	const inlinecss = mem(() => cssref() + "overflow: hidden;")
	const render = e => e.html()
	const html = [".masked", { style: inlinecss }, () => each(ordered, render)]

	onanimationend()

	return { html, css: [".masked", { position: "relative" }, first.css, second.css], rectangle }
}

let dom = maskcontainer(First, Second)

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

let masked = Child(dom, (dims) => {
	setTimeout(() => {
		let actual = () => dom.rectangle.navigator.navigate_to(
			dims.x + offset(3), dims.y + offset(4) - 2, 8, 250)
		let jumpy = () => {
			let tl = dom.rectangle.navigator.timeline
			tl.clear()
			tl.add(animate.prop(jump(dom.rectangle.y(), actual), dom.rectangle.y))
		}

		toss() ? jumpy() : actual()
	}, 700)
})

Schedule.rectangle.add_child(masked)
space.add(masked)

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

const Easings = {
	linear: (t) => t,
	InQuad: (t) => t * t,
	OutQuad: (t) => t * (2 - t),
	InOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
	InCubic: (t) => t * t * t,
	OutCubic: (t) => --t * t * t + 1,
	InOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
	InQuart: (t) => t * t * t * t,
	OutQuart: (t) => 1 - --t * t * t * t,
	InOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),
	InQuint: (t) => t * t * t * t * t,
	OutQuint: (t) => 1 + --t * t * t * t * t,
	InOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
};

render(Main, document.body)

//----------------------------
// TEMP
//----------------------------
/**@type {RectangleDOM[]}*/
let comps = [Schedule, Information, Banner]

comps.forEach((el) => {
	let pos = random_pos(
		el.rectangle.w(),
		el.rectangle.h())
	el.rectangle.navigator.navigate_to(pos.x, pos.y, 20, 800)
})

//
setInterval(() => {
	comps.forEach((el) => {
		let pos = random_pos(
			el.rectangle.w(),
			el.rectangle.h())
		el.rectangle.navigator.navigate_to(pos.x, pos.y)
	})
}, 5000)
