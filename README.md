# constructJS
ConstructJS is a lightweight JavaScript library enabling website creation using nothing but JavaScript. Styles, functionality, states and content is developed programmatically within JavaScript and is exported to a standalone output HTML file for deployment. 

Currently a work in progress, ConstructJS includes **HTML event handling, stylesheet creation, a state and listener function system and basic DOM element creation (using DOM heirarchy)** 

## Usage
### Use constructJS directly in the browser via the `<script>` tag
```html
<script src="https://sam-beck.github.io/constructJS/src/construct.js"></script>
```
See [examples](#examples) for basic implementations of library features and styling.

## Quickstart
To start using the library, create a new HTML working document for creating the website.

### 1. Boilerplate HTML working document
This interfaces with the library to generate the final website. Note that a **body** is required in order for the library to interface correctly. A **minimal template** is given below:
```html
<!DOCTYPE html>
<body>
    <script src="https://sam-beck.github.io/constructJS/src/construct.js"></script>
    <script>
        const constructApp = createConstructApp('Insert page title here');
        // Start website construction here 
    </script>
</body>
</html>
```
The **createConstructApp() object** (defined as **constructApp** here) can be used to create elements and configure the website. When the page is run, the HTML output of this document will now include additional features and HTML elements as well as the main website container, **constructJSRoot**:
```html
<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Insert page title here</title>
    <style>
        *,
        *::before,
        *::after {
            box-sizing: border-box;
        }

        body {
            margin: 0px 0px;
            overflow: hidden;
        }
    </style>
    <style>
        .constructJSRoot {
            display: flex;
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div class="constructJSRoot"></div>
    <script src="https://sam-beck.github.io/constructJS/src/construct.js"></script>
    <script>
        const constructApp = createConstructApp('Insert page title here');
        // Start website construction here 
    </script>
</body>
</html>
```

### 2. Configuration of the main website container 
The constructJS initialiser is used to interact with the library features:
```javascript
const constructApp = createConstructApp('Insert page title here');
```
To configure the main container **constructJSRoot** (where all constructJS elements will reside), it can be accessed using the constructJS stylesheet system to directly alter its CSS class. **Note** that each CSS property is converted to camelCase instead of kebab-case with dashes to split keywords:
```javascript
constructApp.setToRoot({ justifyContent: 'center', alignItems: 'center' /* Insert any other properties here */});
```
**Note** that by default, the root element is a *flexbox* as large as the viewport. This can be configured as shown above.

### 3. Creating a new constructJS style
To create a stylesheet (for elements of specific tags, classes and IDs), the **createConstructApp() object** can be used:
```javascript
// name -> tag names, .name -> classes, #name -> IDs
constructApp.addStyle('.class_style_name_here',{
    padding: '8px',
    border: 'none',
    /* Add other properties here */
});
```
This style is now a *relative* style, meaning it will become apart of every element's style component. However, typically it is intended to create a style that is reused, so to append this to a stylesheet, the following is called:
```javascript
constructApp.addStyleToCSS('.class_style_name_here');
```
Each style can be changed using the **setToStyle** and **addToStyle** methods:
```javascript
constructApp.setToStyle('.class_style_name_here', {border: '10px solid black'}); // Overwrites this property completely
constructApp.addToStyle('.class_style_name_here', {padding: '16px'}); // Adds to this property, resulting in padding: 8px 16px
```

### 4. Creating and configuring an element
Elements are created using the **createConstructApp() object**, with a similar syntax to style creation:
```javascript
/*
Params :
tagName - tagName of the element to create
configuration (object) - contains DOM element attributes, events and style
children - a string (text) or DOM elements that are to be appended to this element
definition - the variable definition of this element, only needed if it is to be referenced elsewhere in events or exported code

Return : 
The resulting DOM element
*/
const btn = constructApp.create('button',
        {
            attributes: { id: 'button_ID' },
            events: { click: (event) => { console.log('I was pressed!') } },
            style: ['.class_style_name_here', { backgroundColor: 'pink', width: '20%', height: '10%' }]
        },
        'Press Me',
        'btn');
```
Events can also be references to functions, however they MUST be functions. To append the newly created element to the page, either append to a previously created **element** using **element.appendChild()** or the main container element using the **createConstructApp() object**:
```javascript
constructApp.appendChild(btn);
```

### 5. States
ConstructJS supports state objects to listen to state changes, useful for counters that trigger on user events. Below displays the creation and usage of a **counter** state:
```javascript
// Create the state and set it to 0, its name should be the same as its parameter name
const counter = constructApp.addState('counter', 0);
// Add a listener that is called every single time counter changes
counter.addListener((value) => { console.log('Counter state: '+ value) });
counter.set(2); // counter.get() = 2 and triggers listeners -> console: Counter state: 2 
```

### 6. Page load initalizer method
In some cases, initalization is required of variables or other logic once the page has completely loaded. Such a method can be added using the **createConstructApp() object**:
```javascript
constructApp.setOnload(()=>{console.log('Page is loaded!')});
// Test the initalizer, do not need this when exporting the final website
constructApp.onload();
```  
**Note** that the exported website calls this using **window.onload** meaning it will be called as soon as the page has completely loaded.

### 7. Adding dependencies
Dependencies and external libraries can be added to the page allowing for interactions with the DOM elements and usage within the script of the document:
```javascript
function init(){
    // Put all the dependency script here, can interact with states, events and DOM elements
}
// Add a dependency and trigger init when loaded
constructApp.addDependency('link to dependency here', init);
```
The exported webpage runs the initializer function once the page is loaded.

### 8. Exporting the standalone HTML document
Once your website is complete, the following can be called to create and download the standalone document:
```javascript
/*
(Optional) params:
download = true - if the export is to be downloaded or not (true = yes, false = no)
downloadTitle = null - configure the title of the file output, defaults to the page title 

Return :
string of the HTML file
*/
constructApp.export();
```

## Examples
Each example displays the pre-export file used to create the HTML document and can be exported using the following command in the console:
```javascript
constructApp.export(); // Downloads the HTML document locally
```
___
### [hello.html](examples/hello.html)
* Button creation and implementation
* Transition styling for user events 
* State and event handling for events
___
### [scroll.html](examples/scroll.html)
* Scroll element implementation
* Usage of [Three.js](https://threejs.org/) graphics library
* State and event handling for mouse and pointer events
* Scroll and transform transition styling for user events 
___