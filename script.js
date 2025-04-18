import { mounted, render, mut, sig, mem, eff_on, each, if_then } from "./chowk/monke.js"
import { hdom } from "./chowk/hdom/index.js"
import { Q5 } from "./q5/q5.js"
import { drag } from "./drag.js"
import CSS from "./css/css.js"
import * as Chowk from "./chowk/monke.js"
const delay = fn => setTimeout(fn, 100)

let reducedmotion = matchMedia("(prefers-reduced-motion)").matches
console.log("reduced motion enabled:", reducedmotion)

delay(_ => console.log(`
x----------------x
Hello dear lurker,
x----------------x

This website will be in perpetual development till the 22nd of April 2025, do come back to see updates.
The code is documented with some comments and resources. Feel free to go into the source and check script.js
That's where all the magic is!

More information about the structure of the code can be found at https://github.com/caizoryan/symposium-website
`))

let px_to_vw = (px) => (px / window.innerWidth) * 100
let px_to_vh = (px) => (px / window.innerHeight) * 100

let windowwidth = sig(window.innerWidth)
window.onresize = () => windowwidth(window.innerWidth)
let scale = mem(() => windowwidth() > 1100 ? 1 : .75)
let mobile = mem(() => windowwidth() < 1000 ? true : false)
let tablet = mem(() => windowwidth() > 700 && mobile())

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

// x---------------------------
// Data: Speakers
// x---------------------------

let sections = [
	{
		title: "introduction",
		time: "4:00pm"
	},
	{ title: "Panel (1)", },
	{
		title: "Serena Peruzzo {1RG}", time: "4:30pm",
		bio: "Serena is a technologist and entrepreneur based in Toronto. She co-founded 1RG, a co-working space for humanist technologists and a consulting lab for public interest technology. Having worked in tech for over a decade, Serena is driven by a profound belief that technology can and should empower people. She is dedicated to creating spaces and solutions that support human agency, nurture curiosity, and foster innovative approaches to social challenges.",
		links: [
			["Website", "https://1RG.space"]
		]
	},
	{
		title: "E.L guerrero", time: "4:50pm",
		links: [
			["Website", "https://guerrero.ph"],
			["Instagram", "https://www.instagram.com/thinkbulecount2"]
		],
		bio: `E.L. Guerrero is a media and software artist working with identity, memory, and nostalgia in exploring alternative networks and infrastructures of care for being in a post-digital world. She is currently interning as an Accessibility Specialist at Rakuten Kobo.`

	},
	{
		title: "Garry Ing", time: "5:10pm",
		bio: "Garry Ing is a designer and researcher centred around web technologies and net-based practices. He's a co-organizer of Our Networks and A-B-Z-TXT.",
		links: [["Website", "https://garrying.com/"],]
	},
	{ title: "Discussion", time: "5:30pm" },

	{ title: "Panel (2)", },
	{
		title: "Skot Deeming", time: "6:10pm", links: [["Instagram", "https://www.instagram.com/yoyodynetoydivision"]],
		bio: `Skot Deeming is a pop culture obsessed maker, curator and scholar from Toronto, Canada. Working in limited run zines, handmade and painted toys, electronics and sculptures; Skot’s practice focuses on appropriating global IPs, characters, and pop culture detritus. He is currently in the final stages of his dissertation, which maps the Cultural Economies of character licensing, action figures, designer and bootleg toys.`
	},
	{
		title: "Eric Francsico {Reflex Editions}", time: "6:30pm",
		bio: `Eric Francisco is an artist-publisher and graphic designer whose research-driven practice synthesizes artists’ books, photography, printmaking, and writing to transform everyday situations and immediate landscapes into personal poetics. He co-runs Reflex Editions, a DIY publishing collective dedicated to exploring the collaborative and experimental possibilities of making handmade, small-edition publications and ephemera. `,
		links: [["Instagram", "https://www.instagram.com/efrncsco_/"]]
	},


	{
		title: "Symon Oliver {Tennis Studio}", time: "6:50pm",
		bio: "Symon Oliver is a founder and Design Director at Tennis, a digital agency that transforms complex challenges into accessible, scalable, and user-centred solutions. With over a decade of experience in UX design, digital strategy, and organizational transformation, Symon helps lead Tennis’ process-driven approach to delivering measurable impact. Through its HOLO Methodology, Tennis partners with businesses, nonprofits, and startups to drive growth, streamline operations, and create meaningful digital experiences.",
		links: [["Website", "https://www.designtennis.com/about"]]
	},
	{ title: "Discussion", time: "7:10pm" },

	{ title: "Panel (3)", },
	{
		title: "Yiu Hei {Myfriends studio}", time: "7:40pm",
		bio: "My Friends Studio is a community driven tattoo studio and event space that aims to foster connection between underrepresented multidisciplinary artists and those who seek exposure to creativity. Yiu Hei Cheung is one of four co-founders of My Friends Studio. He is an artist exploring the crafts of photography, tattooing, and sewing, and has a varied range of professional experiences spanning the fields of architecture, graphic design, and media production.",
		links: [["Instagram", "https://www.instagram.com/myfriends.studio/"]]
	},
	{
		title: "Jasmine Gui {Teh studio}", time: "&",
		bio: `Jasmine Gui is a Singaporean-born interdisciplinary artist, arts programmer, and PhD based in Tkaronto. She works in paper, ceramics, tea and experimental book formats. She is a member of Dinky Dinks Studio, co-founder of TACLA and 1/4 of the quartet responsible for "a momo room” zine. `,
		links: [
			["Instagram", "https://www.instagram.com/jaziimun"],
			["Website", "https://tehstudio.ca"]
		]
	},
	{
		title: "Nam Hoang {Sheep school}", time: "&",
		links: [
			["Website", "https://sheeep.school/"]
		]
	},
	{ title: "Discussion", time: "8:40pm" },

	{ title: "Wrap up", },
	{ title: "Final words and wrap up:", time: "9:00pm" },
]

// --------------------------
// *Header: Introduction
// --------------------------
// Note: This sourcecode takes 
// the form of a game engine
//
// It manages a entities (Rectangles), existing on a plane. 
//
// Rectangles have children, and children are related to
// their parents through a follow function that returns anchors:
// top-left, top-right, etc
//
// All the rectangles are choreographed to form various compositions.

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

let shuffle = () => {
	comps.forEach((el) => {
		let pos = random_pos(
			el.rectangle.w(),
			el.rectangle.h())
		el.rectangle.navigator.navigate_to(pos.x, pos.y, 30, 800)
	})

	let w = Title.rectangle.w() + Schedule.rectangle.w() + About.rectangle.w() + 3
	let pos = random_range([5, 95 - w], [5, 95 - Schedule.rectangle.h()])
	Title.rectangle.navigator.navigate_to(pos.x, pos.y, 30, 800)
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
 * Takes in x, y, w, h, with opts and returns formatted obj to be used in CSS.css
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
	loadfont("./fonts/Oracle.ttf", "oracle"),
	loadfont("./fonts/Oracle_simple.ttf", "oracle-simple"),
	loadfont("./fonts/Anthony.otf", "anthony"),
	loadfont("./fonts/TINY5x3GX.ttf", "tiny"),
	loadfont("./fonts/CirrusCumulus.otf", "cirrus"),
	loadfont("./fonts/Rajdhani-Light.ttf", "rajdhani"),
	loadfont("./fonts/DuctusCalligraphic.otf", "ductus"),

	["*", {
		padding: 0,
		margin: 0,
	}],

	// -----------------
	// Heading
	// -----------------
	...Array(5).fill(0).map((e, i) =>
		["h" + (i + 1), {
			"font-family": () => type.heading,
			"font-size": em(4 - (i / 2))
		}]),

	["section:focus-within", {
		"box-shadow": [[0, 0, px(30), px(10), colors.black + "88"]],
	}],

	["main", {
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
// 3. #Child;
// 4. #Clock;
// 5. #Space;
// 6. #MobileSpace;
// ------------------


// x----------------------x
// #Navigator;
// x----------------------x
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
		if (mobile()) return
		if (reducedmotion) {
			rectangle.x(x)
			rectangle.y(y)
			destination({ x, y })
			return
		}

		// disabled on mobile
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


// x----------------------x
// #Rectangle;
// x----------------------x
class Rectangle {
	/**
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} w 
	 * @param {number} h 
	 * @param {RectangleOpts} [opts]
	 */
	constructor(x, y, w, h, opts) {
		const default_opts = { xAxis: "left", yAxis: "top", strategy: "absolute", unit: "v" }
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
		return mem(() => {
			let hunit = this.unit("h")
			return css(rect(
				this.x() + this.unit("x"),
				this.y() + this.unit("y"),
				mobile() ?
					tablet()
						? "75vw"
						: "90vw"
					: this.w() + this.unit("w"),
				this.h() + this.unit("h"),
				this.opts()
			)) +
				(this.opts().material?.css?.() ?? "")
				+ (hunit == "auto" ? "height: auto;" : "")
		})

	}
}

// x----------------------x
// #Child;
// x----------------------x
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

// x----------------------x
// #Clock;
// x----------------------x
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

/** @returns {Clock} */
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
	i.add = (fn) => {
		callbacks.push(fn)
		return () => callbacks.splice(callbacks.findIndex(f => f === fn), 1)
	}

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
				destroy: () => c.splice(c.findIndex(f => f === e), 1)
			}))
		}

		i.last(stamp)
	}

	requestAnimationFrame(run)
	return i
}


// x----------------------x
// #Space;
// x----------------------x
//
// For any of these entities, to exist
// they require a container, a conception of something to be in.
//
// Space, provides this concept. 
// You can be (added) to a space
// Once added you can't be removed
//
// Space needs to be negotiated, sometimes its members will be required to compromise
// for the sake of each other. In this case its important that the members can communicate
// to each other their needs and capacities.
//
// If you are in a space, you're bounded by its (time), and its (constraints)
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

	const hiding = sig(false)
	const hide = () => hiding(true)
	const show = () => {
		if (hiding()) window.location.reload()
	}

	const space_dom = mem(() =>
		hdom(["main",
			//{ onclick: call_everyone },
			{ style: mem(() => "display:" + (hiding() ? "none" : "block")) },
			...space_entities().map(e => e.html)
		])
	)

	return {
		add,
		html: space_dom,
		hide, show,
	}
}


// x----------------------x
// #MobileSpace;
// x----------------------x
function MobileSpace() {
	//
	/**@type {Chowk.Signal<(RectangleDOM | RectangleDOMChild)[]>}*/
	const space_entities = sig([])

	/**
	 * @param {RectangleDOM} el
	 * */
	const add = (el) => {
		space_entities([...space_entities(), el,])
	}

	let wasTablet = false
	eff_on(tablet, () => tablet() ? null : wasTablet ? activate() : null)

	let activate = () => {
		let total = 0
		space_entities().forEach((el, i) => {
			if (el.rectangle.navigator) el.rectangle.navigator.timeline.clear()
			if (tablet()) wasTablet = true
			let upper = tablet() ? 15 : 3
			el.rectangle.x(random(0, upper))
			el.rectangle.y(total)
			if (i == space_entities().length - 1) {
				el.rectangle.opts({ ...el.rectangle.opts(), hUnit: "auto" })
				//el.rectangle.h(85)
			}
			total += el.rectangle.h()
		})
	}

	const hiding = sig(true)
	const hide = () => hiding(true)
	const show = () => {
		activate()
		hiding(false)
	}

	const space_dom = mem(() =>
		hdom([".container",
			{ style: mem(() => "display:" + (hiding() ? "none" : "block") + `;overflow-y: scroll; overflow-x: hidden;   position:relative; height:100vh`) },
			["main",
				//{ onclick: call_everyone },
				{ style: () => `; height: ${space_entities().reduce((acc, el) => acc + el.rectangle.h(), 155)}vh;position: relative;` },
				...space_entities().map(e => e.html)
			]])
	)

	return {
		add,
		html: space_dom,
		hide, show,
	}
}

let clock = Clock()
let space = Space(style)
let mobile_space = MobileSpace()

// -----------------------
// *Header: Graphics
// 1. p5  
// 2. animation
// -----------------------
function init_p5(el) {
	if (reducedmotion) return
	let p = new Q5('instance', el);

	let r1 = p.width / 4;
	let r2 = p.height / 4;
	let text1 = "अलगpractices"
	let textc = "#9366C5";
	let e1font, e2font, e3font
	p.setup = () => {
		p.createCanvas(window.innerWidth, window.innerHeight, { alpha: true });
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
		let y1 = x * p.sin(an) + y * p.cos(an) + p.height / 2;

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


		let rw = p.width / 4 - p.width / 12
		let ry = p.height / 4 - p.height / 12

		r1 = rw + p.cos(90 - an) * p.width / 10;
		r2 = ry + p.sin(90 - an) * p.height / 10;
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
 *   instant_destroy: () => void,
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

		destroy() {
			should_destroy = true;
		},
		instant_destroy() {
			destroy()
		},
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

	let destroy = clock.add(api.update)

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
const Main = () => hdom([["style", () => css(style)], space.html, mobile_space.html])

/**@type RectangleDOM*/
const About = (() => {
	//let { x, y } = offscreen()
	let x = 50
	let y = -55
	let rectangle = new Rectangle(x, y, 25, 55, { unit: "v", strategy: "absolute" })

	let inlinecss = rectangle.css()

	let css = [".banner", {
		padding: em(1),
		cursor: "grab",
		position: "relative",
		background: colors.base,
		"background-size": [[px(40), px(40)]],
		"background-image": [
			"linear-gradient(to right, #2222 1px, transparent 1px)",
			"linear-gradient(to bottom, #2222 1px, transparent 1px)",
		]
	},
		["h4", {
			"pointer-events": "none",
		}],

		["h5", {
			"font-family": "oracle-simple",
			"margin-top": em(.5),
			"font-size": em(1),
			"font-weight": "500",
			"text-transform": "uppercase",
		}],
		["button.switch", {
			all: "unset",
			cursor: "pointer",
			"font-family": "cirrus",
			position: "absolute",
			"font-size": em(1.2),
			top: em(1.2),
			right: em(.5),
		},
			[":hover", {
				"background-color": colors.highlight,
				"color": colors.white,
			}],

			[":focus", {
				"background-color": colors.highlight,
				"color": colors.white,
			}]
		],
		["p.description", {
			"pointer-events": "none",
			"padding": em(1),
			"box-shadow": [[0, 0, px(30), px(10), colors.black + "22"]],
			"background-color": colors.white + "dd",
			"line-height": em(1.3),
			"font-size": em(.8),
			"font-family": "oracle-simple"
		}]]


	/**
	 * @typedef {("about" | "colophon") } Section
	 * @type {Chowk.Signal<Section>}
	 * */
	let section = sig("about")

	let html = () => {
		let ref
		mounted(() => drag(ref, {
			set_left: (px) => rectangle.x(px_to_vw(px)),
			set_top: (px) => rectangle.y(px_to_vh(px)),
			enabled: () => !mobile()
		}))

		let about = [
			["h4", "About"],
			["button.switch", { title: "Show colophon page", onclick: () => section("colophon") }, "(colophon)"],

			["p.description", `
			As art/design students envisioning a meaningful engagement with our practices (post-graduation) is either threatened by the hype of AI or is hijacked by scarcity of individual opportunities and the culture of self promotion.
		`],
			["p.description", `
			This symposium hopes to bring to light the multitude of issues surrounding creative practices while reflecting on the ‘alternative’ modes of engaging with our practice, mutual care and pedagogy. At Alt-practices we aim to generate a connection between our locality in Toronto, with collectives/studios/individuals practicing alternatives, and the art/design students at OCAD. We invite you to join us, in a dialogue to see beyond the aspirations of “a successful career” and to envision novel forms of (alt) practices through an alliance with our locality and peers
		`]
		]

		let colophon = [
			["h4", "Colophon"],
			["button.switch", { title: "Show about page", onclick: () => section("about") }, "(about)"],
			["h5", "Type in use"],
			["p.description", `
	The display typface is CirrusCumulus from Velvetyne Foundry designed by Clara Sambot. The monospace and sans-serif type on this
	website is the Oracle Family designed by the type foundry ABC Dinamo. 
		`],

			["h5", "Hosting"],
			["p.description", `
	The website is hosted on Github Pages, on Microsoft's servers. This website is a physical being, hardware, memory; residing somewhere in a gigantic Equinix / Digital Reality's data center. We cannot track it's exact location but acknowledging it's physical existence somewhere on this planet is crucial. 
		`]]

		return hdom(["section.banner", { ref: e => ref = e, style: inlinecss },
			mem(() => section() == "about" ? hdom(about) : hdom(colophon))
		])
	}

	return { html, css, rectangle }
})()



let colored_grid = (color, grid_size = 40) => ({
	css: () => CSS.css({
		background: color,
		"background-size": [[px(grid_size), px(grid_size)]],
		"background-image": [
			"linear-gradient(to right, #2222 1px, transparent 1px)",
			"linear-gradient(to bottom, #2222 1px, transparent 1px)",
		]
	})
})

/**@type {Material}*/
let purple_grid = colored_grid(colors.highlight, 40)

/**@type {Material}*/
let white_grid = colored_grid(colors.white, 4)

/**@type RectangleDOM*/
const Information = (() => {
	/**@type {Material}*/
	let material = purple_grid
	let { x, y } = offscreen()
	let rectangle = new Rectangle(
		x, y,
		100 - 40 - 1, 60,
		{ unit: "v", material, strategy: "absolute" }
	)

	let style = rectangle.css()

	const html = [".resources", { style: style }]
	const css = [".resources",]

	return { css, html, rectangle }
})()

/**@type RectangleDOM*/
const Dumplicate = (() => {
	/**@type {Material}*/
	let material = purple_grid
	let { x, y } = offscreen()
	let rectangle = new Rectangle(
		x, y, 20, 25,
		{ unit: "v", material }
	)

	let style = rectangle.css()

	const html = ["graphic", { style: style }]
	const css = []

	return { css, html, rectangle }
})()

/**@type RectangleDOM*/
const DumplicateSmall = (() => {
	/**@type {Material}*/
	let material = purple_grid
	let { x, y } = offscreen()
	let rectangle = new Rectangle(
		x, y, 25, 18,
		{ unit: "v", material }
	)

	let style = rectangle.css()

	const html = ["graphic", { style: style }]
	const css = []

	return { css, html, rectangle }
})()

/**@type RectangleDOM*/
let Schedule = (function() {
	let css = [
		".schedule", {
			"font-family": "monospace",
			background: colors.white,
			"box-shadow": [[0, 0, px(30), px(10), colors.black + "33"]],
			color: () => colors.text,
			//transition: [["all", ms(200)]],
			cursor: "grab",
			display: "grid",
		},

		[".schedule-title", {
			"padding": rem(1),
			"pointer-events": "none",
			"font-family": "cirrus",
			"font-weight": 100,
			"font-size": em(3)
		}],
		[".break", {
			"padding": rem(1),
			"font-weight": 200,
			"font-size": em(1.9),
			"pointer-events": "none",
			"font-family": "oracle"
		}],

		[".schedule-container", {
			"height": percent(100),
			"overflow-y": "scroll"
		}],

		[".title", {
			"font-size": em(1.8),
			"text-transform": "lowercase",
			"font-family": "cirrus",
			//"background-color": colors.white
		}],

		[".time", {
			"font-family": "oracle-simple",
			"font-weight": "300",
			display: "block-inline",
			"font-size": em(1),
			"margin-bottom": em(.5),
			padding: [[rem(.35), rem(.35)]],
			"width": "min-content",
			"height": "min-content",
			//"background-color": colors.highlight,
			color: colors.highlight + "dd",
			"border": "1px solid " + colors.highlight + "dd",
			"border-radius": px(50)
		}],

		[".speaker-container", {
			// display: "grid",
			// "grid-template-rows": "3em 6em",
		}],

		[".info-container", {
			"overflow": "hidden",
			"max-height": 0,
			//visibility: "hidden",
			"transition": "max-height 500ms"
		}, [":focus-within", {
			"max-height": vh(100),
		}],
			["p.bio", {
				"font-weight": 500,
				"font-family": "oracle-simple",
				color: colors.black + "88",
				"line-height": em(1.1),
				"padding-bottom": em(.5)
			}],
			["a", {
				"text-decoration": "none",
				"color": colors.highlight,
				"cursor": "pointer",
				"font-weight": 300,
				"font-size": em(1.2),
				"font-family": "oracle",
			},
				[":hover", { "background-color": colors.highlight, color: colors.white }],
				[":focus", { "background-color": colors.highlight, color: colors.white }]
			]],

		["article", {
			margin: [[0, rem(1.25)]],
			padding: [[rem(.85), rem(.35), rem(2.5), rem(.35)]],
			"font-weight": 600,
			"border-top": [[px(1), "solid", colors.highlight]],
			color: colors.highlight,
			cursor: "pointer",
			transition: "all 200ms"
		},
			[":hover", {
				transform: "scale(1.01)",
				"box-shadow": [[0, 0, px(30), px(10), colors.black + "11"]],
			}],

			[":hover .info-container", {
				"max-height": "80vh",
				visibility: "visible",
				//height: em(18),
				"padding": rem(.5),
			}],

		],

		[".no-border", {
			border: "none !important",
			padding: [[rem(.35), rem(.35), rem(.75), rem(.35)]],
		}],
	]

	//let { x, y } = offscreen()
	let { x, y } = random_pos(30, 60)
	let rectangle = new Rectangle(x, y, 30, 85, { unit: "v", strategy: "absolute" })
	let inlincecss = rectangle.css()

	const html = () => {
		let ref
		mounted(() => drag(ref, {
			set_left: (px) => rectangle.x(px_to_vw(px)), set_top: (px) => rectangle.y(px_to_vh(px))
			, enabled: () => !mobile()
		}))

		return hdom(
			["section.schedule", { style: inlincecss, ref: e => ref = e },
				[".schedule-title", "Schedule"],
				[".schedule-container",
					...sections.map(e => {
						if (e.time) {
							let tag = "article"
							if (e.time == "&") tag = "article.no-border"
							return [tag,
								[".speaker-container",
									{ onclick: shuffle, style: mem(() => mobile() ? "pointer-events: none" : ""), tabindex: 0 },
									[".time", e.time],
									[".title", e.title],
								],
								e.links ?
									[".info-container",
										e.bio ? ["p.bio", e.bio] : "",
										...e.links.map((link) => ["p", ["a", { target: "_blank", href: link[1] }, link[0]]]),
									] : "",

							]
						}

						else {
							return [".break", e.title]
						}
					})
				]
			])
	}
	return { html, css, rectangle }
})()

/**@type RectangleDOM*/
let Timing = (function() {
	let css = [
		".timing", {
			"font-family": "monospace",
			background: colors.white,
			color: () => colors.text,
			//transition: [["all", ms(200)]],
			cursor: "grab",
			border: ".5px dotted " + colors.highlight,
			"box-shadow": [[0, 0, px(30), px(10), colors.black + "22"]],
			padding: em(1),
			transition: "transform 400ms",
		},

		[".addy-container", {
			width: "min-content",
			"box-shadow": [[0, 0, px(30), px(10), colors.black + "11"]],
		}],

		["h2.address", {
			"font-family": "oracle",
			"font-weight": 100,
			"line-height": em(1.1),
			"background-color": colors.white,
			"color": colors.black,
			//border: [[px(.5), "solid", "black"]],
			// "background-color": colors.text,
			"padding": [[0, px(5)]],
			"font-size": em(1.7),
			width: em(10),
		}],
		[".time", {
			transition: "transform 800ms",
			"background-color": colors.white,
			//"box-shadow": [[0, 0, px(30), px(10), colors.white + "22"]],
			"font-size": em(1.5),
			"margin-top": px(10),
			"margin-bottom": px(40),
			width: em(10),
		}],

		["h2.date", {
			"box-shadow": [[0, 0, px(30), px(10), colors.black + "11"]],
			transition: "transform 800ms",
			"font-family": "oracle",
			"font-weight": 100,
			"line-height": em(1.4),
			"background-color": colors.white,
			"color": colors.black,
			//border: [[px(.5), "solid", "black"]],
			"margin-bottom": em(.5),
			// "background-color": colors.text,
			"padding": [[0, px(5)]],

			"font-size": em(2.3),
			"margin-left": em(1.2),
			width: em(5.5),
		}],
	]

	let rectangle = new Rectangle(1, 45, 20, 23, {
		unit: "v",
		material: colored_grid(colors.white)
	})

	let ref = rectangle.css()
	let rotate = sig(0)
	let inlincecss = mem(() => ref() + `transform: rotate(${rotate()}deg)`)

	let resetrotate = (i) => setTimeout(() => {
		if (reducedmotion) { return }
		rotate(offset(8));
		resetrotate(Math.random() * 1500 + 1500)
	}, i)

	resetrotate(500)

	let address_rotate = mem(() => rotate() * -1 * 2)
	let date_rotate = mem(() => rotate() * -1)

	let addy_css = () => `transform: translateX(8px) rotate(${address_rotate()}deg)`
	let date_css = () => `transform: translate(8px, 12px) rotate(${date_rotate()}deg)`

	const html = () => {
		let ref
		mounted(() => drag(ref, {
			set_left: (px) => rectangle.x(px_to_vw(px)), set_top: (px) => rectangle.y(px_to_vh(px))
			, enabled: () => !mobile()
		}))
		return hdom(["section.timing",
			{ style: inlincecss, ref: e => ref = e, },
			["h2.date", { style: date_css, tabindex: 0 }, "22 APRIL"],
			["h4.time", { style: addy_css, tabindex: 0 }, "4:00pm - 9:00pm"],

			[".addy-container",
				{ tabindex: 0 },
				["h2.address", "113 McCaul"],
				["h2.address", "(Annex Building)"],
				["h2.address", "MCC 512"],
			]
		])
	}
	return { html, css, rectangle }
})()

function Dual(letter, rectangle, materials, time = 500, font = "cirrus", size = 3.7) {
	rectangle = rectangle ? rectangle : new Rectangle(20, 20, 550, 10, { unit: "v", wUnit: "px" })
	materials = materials ? materials : [colored_grid(colors.white), colored_grid(colors.base)]

	let fo = { style: mem(() => "font-family: " + font + ";font-size: " + em(size * scale()) + ";") }
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

	let dom = maskcontainer(Alternative, Practices, rectangle, time)
	return dom
}


let child_timing = Child(Timing, follow_fn(Timing.rectangle, (dims) => ({
	x: dims.x - random(0, 8),
	y: dims.y + dims.h - random(0, 2)
})))


const Stage = (() => {
	const html = () => hdom([".canvas", { ref: init_p5, onclick: shuffle }])
	const css = [".canvas", { cursor: "pointer", position: "fixed", "mix-blend-mode": "difference" }, fullscreen]
	return { html, css }
})()


// -----------------------
// Event Listeners
// -----------------------
document.body.onmousemove = (e) => {
	mouse_x(e.clientX)
	mouse_y(e.clientY)
}
// -----------------------
//
//

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

let pause = (initial, then) => {
	return [
		{ start: initial, end: initial + 1, duration: 800, easing: "OutCubic", onend: then },
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
			let actual = () => rectangle.navigator.navigate_to(pos.x, pos.y, 16, 250)

			let jumpy = () => {
				let tl = rectangle.navigator.timeline
				tl.clear()
				tl.add(animate.prop(jump(rectangle.y(), actual), rectangle.y))
			}

			actual()
			//toss() ? jumpy() : actual()
		}, 300)
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
	let html = () => hdom([".test-box", { style: inlinecss },
		["h2", { style: () => 'font-family: "cirrus";font-weight: 100;font-size:' + em(3 * scale()) }, word]])
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
	let html = () => hdom([".test-box", { style: inlinecss }, ["h2",
		{ style: () => 'font-family: "cirrus";font-weight: 100;font-size:' + em(3 * scale()) },
		"Schedule"]])
	return { html, css, rectangle }
})()

/**
 * @param {Rectangle} rect
 * @returns {RectangleDOM}
 *
 * // x-------------------x
 * // Dom from Rectangle
 * // x-------------------x
 * */
const domfromrectangle = (rect, atts = {}) => {
	let css = ""
	let ref = rect.css()
	let off = sig(offset(365))

	let interval = setInterval(() => {
		if (reducedmotion) clearInterval(interval)
		if (reducedmotion) return

		off(offset(185))
	}, 2000 + Math.random() * 2000)

	let inlinecss = () => ref() + `;transform: rotate(${off()}deg);transition: transform 200ms`
	let html = () => hdom(["div", { style: inlinecss, ...atts }])
	return { html, css, rectangle: rect }
}

/**@returns {Material}*/
let imagematerial = (src) => ({
	css: () => css({
		background: "#fff0",
		"background-image": url(src),
		"background-size": "contain",
		"background-repeat": "no-repeat",
		"cursor": "pointer",
	})
})



// x-------------------x
// Mask container
// x-------------------x
// TODO: Mask options
// TODO: more than one?
// x-------------------x
/**
 * @param {RectangleDOM} first 
 * @param {RectangleDOM} second 
 * @param {Rectangle} rectangle 
 * @returns {RectangleDOM}
 * */
const maskcontainer = (first, second, rectangle, t = 500, dragEnable = false) => {
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
		setTimeout(_animate, 5)
	}

	const _animate = () => {
		if (reducedmotion) return
		let direction = toss() ? -1 : 1
		let axis = toss() ? "x" : "y"

		let start = ordered()[1].rectangle[axis]()
		let end = 100 * direction
		let onend = onanimationend

		animate.prop(
			[
				{ start, end: start, duration: t * 3, },
				{ start, end, duration: t, onend }
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

	const { x, y } = offscreen()
	rectangle = rectangle ? rectangle : new Rectangle(x, y, 250, 10, { unit: "v", wUnit: "px" })
	const cssref = rectangle.css()
	const inlinecss = mem(() => cssref() + "overflow: hidden;")
	const render = e => e.html()

	const html = () => {
		let ref

		mounted(() => dragEnable ? drag(ref, {
			set_left: (px) => rectangle.x(px_to_vw(px)),
			set_top: (px) => rectangle.y(px_to_vh(px)),
			enabled: () => !mobile()
		}) : null)

		return hdom([".masked", { ref: e => ref = e, style: inlinecss }, () => each(ordered, render)])
	}

	onanimationend()
	return { html, css: [".masked", { style: CSS.css({ position: "relative", "pointer-events": "none" }) }, first.css, second.css], rectangle }
}

/**@returns {Material}*/
let emptycolor = (color = colors.white) => ({
	css: () => CSS.css({
		"background-color": color,
	})
})

/**@returns {Material}*/
let rotatematerial = (i) => {
	let siggy = mem(() => ((mouse_x() / window.innerWidth * 2) - 1) * (i * 2))
	let f = {
		css: () => mobile() ? "" : `transform: translateX(${i * 5}px) rotate(${siggy()}deg);`
	}

	return f
}

let Alternative = Dual("Alternative", new Rectangle(0, 0, 25, 10, { strategy: "absolute", material: rotatematerial(-2) }), undefined, 750)
let Practices = Dual("Practices", new Rectangle(0, 10, 25, 10, { strategy: "absolute", material: rotatematerial(-1) }), undefined, 500)
let Symposium = Dual("Symposium", new Rectangle(0, 20, 25, 10, { strategy: "absolute", material: rotatematerial(3) }), [emptycolor(colors.white), white_grid], 650)

/**
 * @param {RectangleDOM[]} doms
 * @param {Rectangle} rectangle
 * @returns {RectangleDOM}
 * */
let container = (rectangle, tag = ".container", ...doms) => {
	let style = rectangle.css()
	let inline = () => style() + ";cursor: grab;"

	let html = () => {
		let ref
		mounted(() => drag(ref, {
			set_left: (px) => rectangle.x(px_to_vw(px)), set_top: (px) => rectangle.y(px_to_vh(px))
			, enabled: () => !mobile()
		}))
		return hdom([tag, { ref: e => ref = e, style: inline }, ...doms.map(e => e.html)])
	}

	let css = [...doms.map(e => e.css)]
	return { html, css, rectangle }
}

let Title = container(new Rectangle(0, 0, 25, 30, { strategy: "absolute" }), "header", Alternative, Practices, Symposium)

// x-------------------x
// Shape creator
// x-------------------x
const shape = (src, fn) => {
	let { x, y } = offscreen()
	let rectangle = new Rectangle(x, y, Math.random() * 8 + 5, Math.random() * 8 + 5, {
		unit: "v",
		material: imagematerial(src)
	})

	let domdom = domfromrectangle(rectangle, { onclick: shuffle })
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
	let shapes = Array(5).fill(0).map((e, i) => shape("./shapes/shape_" + (i + 1) + ".png", randomizer))
	shapes.forEach((e) => {
		Information.rectangle.add_child(e)
		space.add(e)
	})
}
layer_one_shapes()


space.add(Information)
space.add(Dumplicate)
space.add(DumplicateSmall)
space.add(Stage)

function layer_two_shapes() {
	let shapes = Array(3).fill(0).map((e, i) => shape("./shapes/shape_" + (i + 2) + ".png", randomizer))
	shapes.forEach((e) => {
		About.rectangle.add_child(e)
		space.add(e)
	})
}
layer_two_shapes()

let about_child = Child(About, follow_fn(About.rectangle, (dim) => ({ x: dim.x + dim.w + random(-1, 2), y: random(0, 35) })))

Title.rectangle.add_child(child_timing)
Schedule.rectangle.add_child(about_child)

space.add(child_timing)

//Schedule.rectangle.add_child(TitleChild)
let schedule_child = Child(Schedule, follow_fn(Schedule.rectangle, (dim) => ({ x: dim.x + dim.w - random(-1, 3), y: dim.y + offset(3) })))

Title.rectangle.add_child(schedule_child)
space.add(Title)
space.add(schedule_child)

const schedule_title = (() => {
	let dom = maskcontainer(First, Second, new Rectangle(-50, -50, Schedule.rectangle.w(), 10), 500, true)
	let schedule_title = Child(dom, follow_fn(dom.rectangle, (dim) => ({ x: dim.x, y: dim.y })))
	return schedule_title
})()

function mount_schedule_banner() { Schedule.rectangle.add_child(schedule_title), space.add(schedule_title) }
mount_schedule_banner()
space.add(about_child)

mobile_space.add(domfromrectangle(new Rectangle(0, 0, 100, 5)))
mobile_space.add(Title)
mobile_space.add(child_timing)

mobile_space.add(domfromrectangle(new Rectangle(0, 0, 100, 35)))
mobile_space.add(about_child)

mobile_space.add(domfromrectangle(new Rectangle(0, 0, 100, 15)))
mobile_space.add(schedule_title)
mobile_space.add(schedule_child)

document.body.innerHTML = ""
render(Main, document.body)

//----------------------------
// TEMP
//----------------------------
/**@type {RectangleDOM[]}*/
let comps = [Information, Dumplicate, DumplicateSmall]
shuffle()


eff_on(mobile, () => {
	if (mobile()) {
		space.hide()
		mobile_space.show()
	}

	else {
		space.show()
		mobile_space.hide()
	}
})

// x------------------------x
// ------------------------
// #Types;
// ------------------------
// x------------------------x

/**
 * @typedef {("px" | "vh" | "vw" | "v" | "em" | "%" | "auto")} Unit
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
 *
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
 *	add: (fn: ClockCallback) => Function
 *	pause: () => void,
 *	play: () => void,
 *	paused: boolean
 * }} Clock
 *
 * @typedef {{
 *	html: any,
 *	css: any,
 *	rectangle: Rectangle
 * }} RectangleDOM
 *
 * @typedef {{
 *	html: any,
 *	css: any,
 *	rectangle: Rectangle,
 *	follow: (bounding: Bounding) => void
 * }} RectangleDOMChild
 */
