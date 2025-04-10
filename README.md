# Working with,,,,,

-> All the code is in /public/script.js

```js
npm run dev
```

Will start a development server using esbuild 

### Alternatively ->
can also go into public and start a live server, or python server.




# Stack

### Solid's Reactivity
Uses solids signals, wrapped in tapri/monke.js for ergonomics. Mostly did it as a learning exercise, but has proved to be a lot more fun writing

```js
const reactive = sig(2)

// get value by calling fn
reactive() // 3

// set value by passing new value
reactive(4)
reactive() // 4
```

Instead of:
```js
const [reactive, setReactive] = createSignal(2)

// get value by calling fn
reactive() // 3

// set value by passing new value
setReactive(4)
reactive() // 4
```

### Basic hiccup-dom implementation
Using solids hyperscript dom. Allows you to write html in the form of arrays:

```js
[".parent",
    ["h2", "Title"],
    [".child",
        [".title", "event"],
        [".time", "2pm"]
    ],
    [".child",
        [".title", "another event"],
        [".time", "3pm"]
    ],
    [".child",
        [".title", "what could it be"],
        [".time", "4pm"]
    ],
],

```

### Hiccup-css from @thi.ng

Same way as above but for css

```js
[".parent", 
    { display: "flex" },
    ["h2", {
       color: "red"
       "font-size": em(2)
    }],
    [".child",
    [":hover", {opacity: 1}], 
    {
        width: vw(10),
        height: vh(10),
        opacity: .5 
    }]
],

```

