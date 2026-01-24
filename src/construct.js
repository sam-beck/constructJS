function logError(content) {
    console.error("[ConstructJS] " + content);
}
function logWarning(content) {
    console.warn("[ConstructJS] " + content);
}

function callMethod(func, val) {
    try {
        return func(val);
    } catch (e) {
        logError(e);
    }
}

function createState(init) {
    let stateValue = init;
    let initialValue = init;
    const stateListeners = new Set();
    return {
        get: () => stateValue,
        getInitial: () => initialValue,
        getListeners: () => stateListeners,
        set: (val) => {
            stateValue = val;
            // Call each listener
            for (const listener of stateListeners) { callMethod(listener, stateValue); }
        },
        addListener: (listener) => { stateListeners.add(listener); },
        removeListener: (listener) => { stateListeners.delete(listener); }
    };
}

function createEventHandler() {
    const events = new Map();
    return {
        get: () => events,
        addEvent: (event) => {
            if (!events.has(event)) events.set(event, new Set());
        },
        removeEvent: (event) => { events.delete(event); },
        addEventListener: (event, listener) => {
            if (!events.has(event)) events.set(event, new Set());
            events.get(event).add(listener);
            return true;
        },
        removeEventListener: (event, listener) => {
            if (!events.has(event)) return false;
            events.get(event).delete(listener);
            return true;
        },
        trigger: (event, value) => {
            if (events.has(event)) for (const func of events.get(event)) { callMethod(func, value); }
        }
    };
}

function createStyleMap() {
    const styles = new Map();
    const cssStyles = new Map();

    // Generates the css stylesheet for a given style
    const styleToString = (name) => {
        let styleObj;
        if (typeof name != 'string') styleObj = name, name = "undefined";
        else {
            if (!styles.has(name)) return null;
            styleObj = styles.get(name);
        }
        let styleText = name + '{';
        const properties = [];
        for (const key in styleObj) {
            if (typeof styleObj[key] == 'string') {
                let val = '';
                for (const char of key) {
                    if (char == char.toUpperCase() && char !== char.toLowerCase()) {
                        val += '-' + char.toLowerCase();
                    } else {
                        val += char;
                    }
                }
                styleText += val + ':' + styleObj[key] + ';';
            } else {
                properties.push(key);
            }
        }
        styleText += '}';
        // Now need to add properties (transitions) to the stylesheet. They are what's left in properties
        for (const key of properties) {
            styleText += name + ':' + key + '{';
            for (const sub_key in styleObj[key]) {
                let val = '';
                for (const char of sub_key) {
                    if (char == char.toUpperCase() && char !== char.toLowerCase()) {
                        val += '-' + char.toLowerCase();
                    } else {
                        val += char;
                    }
                }
                styleText += val + ':' + styleObj[key][sub_key] + ';';
            }
            styleText += '}';
        }
        return styleText;
    };

    return {
        styleToString: (name) => styleToString(name),
        getStyles: () => styles,
        getStyle: (name) => styles.get(name),
        getCssStyles: () => cssStyles,
        getCssStyle: (name) => cssStyles.get(name),
        isCSS: (name) => cssStyles.has(name),
        addStyle: (name, object) => { styles.set(name, object); },
        removeStyle: (name) => { styles.delete(name); cssStyles.delete(name); },
        processStyle: (configs = []) => {
            if (!Array.isArray(configs)) configs = [configs];
            const style = {};
            for (const styleElement of configs) {
                if (typeof styleElement == 'string') {
                    // Add from style map, only if it isnt a cssStyle, if it is, add it to the element's classList
                    if (styles.has(styleElement) && !cssStyles.has(styleElement)) Object.assign(style, styles.get(styleElement));
                } else if (typeof styleElement == 'object') {
                    Object.assign(style, styleElement);
                }
            }
            return style;
        },
        styleToCSS: (name) => {
            if (!styles.has(name)) return false;
            const styleText = styleToString(name);
            if (cssStyles.has(name)) {
                cssStyles.get(name).textContent = styleText;
            } else {
                const element = document.createElement('style');
                element.textContent = styleText;
                cssStyles.set(name, element);
                document.head.appendChild(element);
            }
            return true;
        },
        addToStyle: (name, object, set_to = false) => {
            if (!styles.has(name)) return false;
            const styleObj = styles.get(name);
            if (Array.isArray(object)) object = processStyle(object);
            for (const key in object) {
                if (styleObj[key] != null) {
                    const currentObj = styleObj[key];
                    if (typeof currentObj == 'string') {
                        if (set_to) styleObj[key] = object[key];
                        else styleObj[key] += ',' + object[key];
                    }
                    else {
                        for (const sub_key in currentObj) {
                            if (set_to) {
                                currentObj[sub_key] = object[key][sub_key];
                            } else {
                                if (currentObj[sub_key] != null) currentObj[sub_key] += ',' + object[key][sub_key];
                                else currentObj[sub_key] = object[key][sub_key];
                            }
                        }
                    }
                } else styleObj[key] = object[key];
            }
            if (cssStyles.has(name)) cssStyles.get(name).textContent = styleToString(name);
            return true;
        },
    };
}

function createConstructApp(title = 'ConstructJS Page') {
    if(document.body == null){
        logError('Body of HTML is missing');
        return null;
    }
    // Head init
    const charSet = document.createElement('meta');
    charSet.setAttribute('charset', 'UTF-8');
    document.head.appendChild(charSet);
    const metaElement = document.createElement('meta');
    metaElement.setAttribute('name', 'viewport');
    metaElement.setAttribute('content', 'width=device-width, initial-scale=1.0');
    document.head.appendChild(metaElement);
    // Title
    const titleElement = document.createElement('title');
    titleElement.textContent = title;
    document.head.appendChild(titleElement);
    // Default class for constructJS element container
    const rootClass = document.createElement('style');
    rootClass.textContent = '*,*::before,*::after {box-sizing:border-box;}body{margin:0px 0px;overflow:hidden;}';
    document.head.appendChild(rootClass);

    const configuration = {
        states: new Map(),
        events: createEventHandler(),
        styles: createStyleMap(),
        elementNames: new Set(),
        init: null
    }

    // Root class definition, configurable via configuration.styles
    configuration.styles.addStyle('.constructJSRoot', { display: 'flex', width: '100vw', height: '100vh' });
    configuration.styles.styleToCSS('.constructJSRoot');
    // ConstructJS root element
    const rootElement = document.createElement('div');
    rootElement.classList.add('constructJSRoot');
    document.body.appendChild(rootElement);
    configuration.root = rootElement;
    
    return {
        init: () => {if(configuration.init != null)configuration.init();},
        setInit: (func) => {configuration.init = func;},
        setTitle: (titleName) => {titleElement.textContent = titleName;},
        getRootClass: () => rootClass,
        getRoot: () => rootElement,
        appendChild: (element) => rootElement.appendChild(element),
        addState: (name, initial) => {
            if (configuration.states.has(name)) return configuration.get(name);
            const state = createState(initial);
            configuration.states.set(name, state);
            return state;
        },
        addStyle: (name, object) => {
            configuration.styles.addStyle(name, object);
        },
        addToStyle: (name, object) => {
            configuration.styles.addToStyle(name, object);
        },
        setToStyle: (name, object) => {
            configuration.styles.addToStyle(name, object, true);
        },
        addToRoot: (object) => {
            configuration.styles.addToStyle('.constructJSRoot', object);
        },
        setToRoot: (object) => {
            configuration.styles.addToStyle('.constructJSRoot', object, true);
        },
        addStyleToCSS: (name) => {
            configuration.styles.styleToCSS(name);
        },
        on: (name, func) => {
            configuration.events.addEventListener(name, func);
        },
        getConfiguration: () => configuration,
        getEvents: () => {
            return configuration.events.get().keys();
        },
        find: (element) => {
            if (typeof element == 'string') {
                const queries = { id: '#', tag: '', class: '.' };
                const result = {};
                for (const key in queries) {
                    const search = document.querySelectorAll(queries[key] + element);
                    if (search != null) result[key] = search;
                }
                return result;
            } else if (typeof element == 'object') {
                const elements = document.querySelectorAll('*');
                return Array.from(elements).filter(candidate => {
                    const elementStyle = candidate.style;
                    for (const styleRequirement in element) {
                        if (elementStyle[styleRequirement] !== element[styleRequirement]) return false;
                    }
                    return true;
                });
            }
            return null;
        },
        create: (type, config = {}, children = [], name = null) => {
            const element = document.createElement(type);
            if (name != null) {
                if (configuration.elementNames.has(name)) {
                    logError('Element of name ' + name + ' already exists.');
                    return null;
                }
                configuration.elementNames.add(name);
                element.setAttribute('id', name);
            }
            element.eventListeners = {};
            if (config.attributes) {
                for (const key in config.attributes) { element.setAttribute(key, config.attributes[key]); }
            }
            if (config.events) {
                for (const key in config.events) {
                    if (element.eventListeners[key]) {
                        element.eventListeners[key].push(config.events[key]);
                    } else {
                        element.eventListeners[key] = [config.events[key]];
                    }
                    if (typeof config.events[key] == 'function') {
                        element.addEventListener(key, config.events[key]);
                    } else {
                        logWarning('Cannot add non-function ' + config.events[key] + ' as element eventListener.');
                    }
                }
            }
            if (!Array.isArray(config.style)) config.style = [config.style];
            let other_styles = [];
            for (let i = 0; i < config.style.length; i++) {
                let configValue = config.style[i];
                if (typeof configValue == 'string') {
                    if (configuration.styles.isCSS(configValue)) {
                        if (configValue[0] == '.') element.classList.add(configValue.slice(1));
                        else if (configValue[0] == '#') element.setAttribute('id', configValue.slice(1));
                    } else {
                        const styleObj = configuration.styles.getStyle(configValue);
                        for (const val in styleObj) {
                            if (typeof styleObj[val] == 'object') logWarning(configValue + ' contains the pseudo-class ' + val + '. Add ' + configValue + ' as a CSS style for the correct functionality.');
                            else {
                                if (element.style[val] == '') element.style[val] = styleObj[val];
                                else element.style[val] += ',' + styleObj[val];
                            }
                        }
                    }
                } else {
                    other_styles.push(configValue);
                }
            }
            const other_stylesObj = configuration.styles.processStyle(other_styles);
            for (const val in other_stylesObj) {
                if (typeof other_stylesObj[val] == 'object') {
                    logWarning('Cannot define pseudo-class ' + val + ' when creating ' + type + ' as a dynamic style. Add this to a pre-defined CSS style for the correct functionality.');
                    other_stylesObj[val] = null;
                }
            }
            Object.assign(element.style, other_stylesObj);
            if (Array.isArray(children)) {
                for (const child of children) {
                    element.appendChild(child);
                }
            } else {
                element.textContent = children;
            }
            configuration.events.trigger("create", element);
            return element;
        },
        export: (download = true, downloadTitle = null) => {
            let result = '<!DOCTYPE html>';
            const htmlElement = document.getElementsByTagName('html');
            if (htmlElement.length > 0) result += '<html lang="' + htmlElement[0].lang + '">';
            else result += '<html>';
            // Export head and merge stylesheets (in order)
            result += '<head>';
            result += charSet.outerHTML;
            result += metaElement.outerHTML;
            result += titleElement.outerHTML;
            result += '<style id="constructStyles">';
            result += rootClass.innerHTML;
            for (const styleSheet of configuration.styles.getCssStyles().values()) result += styleSheet.innerHTML;
            result += '</style>';
            result += '</head>';
            // Export element tree from rootElement
            result += '<body>';
            // Function (events and state listeners) storage for addition to <script> element
            let functionIDs = 0;
            const functionSet = new Set();
            const functionIDMap = new WeakMap();
            const addFunction = (func) => {
                if (!functionSet.has(func)) {
                    functionSet.add(func);
                    functionIDMap.set(func, functionIDs++);
                }
                return functionIDMap.get(func);
            }
            // decompose each, getting the events and setting onto the elements, appending each event function progressively
            function parseElementText(element) {
                const tagName = element.tagName.toLowerCase();
                result += element.outerHTML.slice(0, element.outerHTML.indexOf('>'));
                if (element.eventListeners != null) {
                    for (const [key, value] of Object.entries(element.eventListeners)) {
                        // value
                        // so here only parse functions
                        result += 'on' + key + '="';
                        for (const event of value) {
                            if (typeof event == 'function') {
                                // store to a set add listener_functionIDs to <script> (actual implementation here)
                                result += 'constructJSMethod' + addFunction(event) + '(event);'
                            } else {
                                logWarning('Usage of non-function for on' + key + ' is not allowed.');
                            }
                        }
                        result += '" ';
                    }
                }
                result += '>';
                // for each child of this element, call this recursive func
                for (const child of element.childNodes) {
                    if (child.innerHTML == null) {
                        result += child.data;
                    } else {
                        parseElementText(child);
                    }
                }
                result += '</' + tagName + '>';
            }
            parseElementText(rootElement);

            // script, seperate the tag as parser can interpret as EOF otherwise
            result += '<';
            result += 'script>';
            // Hold intermediate string to parse and collect all functions first
            let intermediate_result = '';
            // Add in each element definition, add this to intermediate result
            for (const elementName of configuration.elementNames) {
                intermediate_result += 'const ' + elementName + '=document.getElementById("' + elementName + '");';
            }
            // Export the states of the configuration, to be done before defining the functions to get all the functions to be defined
            for (const [key, value] of configuration.states) {
                intermediate_result += 'const ' + key + '={value:' + value.getInitial() + ',get:()=>' + key + '.value,set:(val)=>{' + key + '.value=val;}};';
                if (value.getListeners().size != 0) {
                    let listenerStrings = '';
                    for (const func of value.getListeners().values()) {
                        listenerStrings += 'constructJSMethod' + addFunction(func) + '(' + key + '.get());';
                    }
                    intermediate_result += key + '.set=(val)=>{' + key + '.value=val;' + listenerStrings + '};';
                }
            }
            // A function for getting the body of a defined method that is stringified
            function getTrimmedBody(functionString, startIndex){
                // Gets the function body, stripping starting and ending parentheses
                const functionBody = functionString.slice(startIndex, functionString[functionString.length - 1] == '}' ? functionString.length - 1 : functionString.length).trim();
                // Finally, trims off the start and ending whitespace that JS automatically does for formatting in some cases
                return functionBody.split('\n').map(line => line.trim()).join(' ');
            }
            // Now define each and every function to be used, append this to result
            for (const ID of functionSet) {
                const functionString = ID.toString();
                let startIndex = functionString.indexOf(')');
                const parameters = functionString.slice(functionString.indexOf('(') + 1, startIndex++);
                while (functionString[startIndex] == '{' || functionString[startIndex] == '=' || functionString[startIndex] == '>' || functionString[startIndex] == ' ') startIndex++;
                result += 'const constructJSMethod' + functionIDMap.get(ID) + '=(' + parameters + ')=>{' + getTrimmedBody(functionString,startIndex) + '};';
            }
            // Add the state definitions afterwards
            result += intermediate_result;
            // Add the initializer function (if provided)
            if(configuration.init != null){
                if(typeof configuration.init != 'function')logError('Initalizer function is not a function.');
                else{
                    const functionString = configuration.init.toString();
                    let startIndex = functionString.indexOf(')'); startIndex++;
                    while (functionString[startIndex] == '{' || functionString[startIndex] == '=' || functionString[startIndex] == '>' || functionString[startIndex] == ' ') startIndex++;
                    result += 'window.onload=()=>{'+getTrimmedBody(functionString,startIndex)+'};';
                }
            }
            result += '<';
            result += '/script>';
            result += '</body>';
            result += '</html>';
            if (download) {
                if (downloadTitle == null) downloadTitle = titleElement.textContent;
                // Create the file
                const blob = new Blob([result], { type: 'text/html' });
                const blobURL = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobURL; a.style.display = 'none';
                a.download = downloadTitle + '.html';
                document.body.appendChild(a); a.click();
                // Remove the anchor element and the blob URL
                document.body.removeChild(a); URL.revokeObjectURL(blobURL);
            }
            return result;
        }
    };
}