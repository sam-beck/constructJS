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

// Checks if is lower and upper for alphabetical chars
function isLower(char) {
    return char == char.toLowerCase() && char !== char.toUpperCase();
}
function isUpper(char) {
    return char == char.toUpperCase() && char !== char.toLowerCase();
}

// converts camelCase to kebab-case
function camelToKebab(str) {
    let val = '';
    val += str[0].toLowerCase();
    let lower = isLower(str[0]);
    for (let i = 1; i < str.length; i++) {
        const char = str[i];
        if (lower && isUpper(char)) {
            val += '-' + char.toLowerCase();
            lower = false;
        } else {
            val += char;
            lower = true;
        }
    }
    return val;
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
                styleText += camelToKebab(key) + ':' + styleObj[key] + ';';
            } else {
                properties.push(key);
            }
        }
        styleText += '}';
        // Now need to add properties (transitions) to the stylesheet. They are what's left in properties
        for (const key of properties) {
            styleText += name + ':' + key + '{';
            for (const sub_key in styleObj[key]) {
                styleText += camelToKebab(sub_key) + ':' + styleObj[key][sub_key] + ';';
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

function createKeyframeMap() {
    const keyframes = new Map();

    // Updates the keyframe stylesheet
    const configureStyle = (name) => {
        if (!keyframes.has(name)) return false;
        const keyframe = keyframes.get(name);
        let styleText = '@keyframes ' + name + '{';
        for (const [key, value] of Object.entries(keyframe.style)) {
            styleText += key + '{';
            for (const propertyName in value) {
                styleText += camelToKebab(propertyName) + ':' + value[propertyName] + ';';
            }
            styleText += '}';
        }
        keyframe.styleSheet.textContent = styleText + '}';
        return true;
    };

    return {
        getKeyframes: () => keyframes,
        getKeyframe: (name) => keyframes.get(name),
        create: (name, config) => {
            const value = { style: config, styleSheet: document.createElement('style') };
            keyframes.set(name, value);
            document.head.appendChild(value.styleSheet);
            configureStyle(name);
            return keyframes.get(name);
        },
        update: (name) => configureStyle(name)
    };
}

function createDependencyList() {
    const dependencies = new Set();
    const initializers = new Set();
    return {
        getDependencies: () => dependencies,
        getInitializers: () => initializers,
        addDependency: (src, init) => {
            if (typeof src == 'string') dependencies.add(src);
            if (typeof init == 'function') initializers.add(init);
        },
    };
}

function createConstructApp(title = 'ConstructJS Page') {
    if (document.body == null) { logError('Body of HTML is missing'); return null; }
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
    const configuration = {
        dependencies: createDependencyList(),
        states: new Map(),
        events: createEventHandler(),
        styles: createStyleMap(),
        keyframes: createKeyframeMap(),
        elementNames: new Set(),
        styleVariables: new Map(),
        onload: null
    }
    // Default class for constructJS element container
    const rootClass = document.createElement('style');
    rootClass.textContent = '*,*::before,*::after{box-sizing:border-box;}body{margin:0px 0px;}';
    document.head.appendChild(rootClass);
    // Root class definition, configurable via configuration.styles
    configuration.styles.addStyle('.constructJSRoot', { display: 'flex', width: '100vw', height: '100vh' });
    configuration.styles.styleToCSS('.constructJSRoot');
    // ConstructJS root element
    const rootElement = document.createElement('div');
    rootElement.classList.add('constructJSRoot');
    document.body.appendChild(rootElement);
    configuration.root = rootElement;

    return {
        onload: () => { if (configuration.onload != null) configuration.onload(); },
        setOnload: (func) => { configuration.onload = func; },
        setTitle: (titleName) => { titleElement.textContent = titleName; },
        getRootClass: () => rootClass,
        getRoot: () => rootElement,
        appendChild: (element) => rootElement.appendChild(element),
        getVariable: (name) => configuration.styleVariables.get(name),
        createVariable: (name, data) => {
            document.documentElement.style.setProperty('--' + name, data);
            configuration.styleVariables.set(name, data);
        },
        setVariable: (name, data) => {
            if(configuration.styleVariables.has(name)){
                configuration.styleVariables.set(name, data);
                document.documentElement.style.setProperty('--' + name, data);
                return true;
            }
            return false;
        },
        removeVariable: (name) => {
            document.documentElement.style.removeProperty('--' + name);
            configuration.styleVariables.delete(name);
        },
        addState: (name, initial) => {
            if (configuration.states.has(name)) return configuration.get(name);
            const state = createState(initial);
            configuration.states.set(name, state);
            return state;
        },
        createAnimation: (name, config) => configuration.keyframes.create(name, config),
        getAnimations: () => configuration.keyframes.getKeyframes(),
        getAnimation: (name) => configuration.keyframes.getKeyframe(name),
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
        addDependency: (src, init) => {
            configuration.dependencies.addDependency(src, init);
            const scriptElement = document.createElement('script');
            scriptElement.src = src;
            document.body.prepend(scriptElement);
            scriptElement.onload = init;
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
            result += htmlElement.length > 0 ? '<html lang="' + htmlElement[0].lang + '"' : '<html';
            if(configuration.styleVariables.size > 0){
                result += ' style="';
                for(const [variable_name,variable] of configuration.styleVariables){
                    result += '--'+variable_name+':'+variable+';';
                }
                result += '"';
            }
            result += '>';
            // Export head and merge stylesheets (in order)
            result += '<head>';
            result += charSet.outerHTML; result += metaElement.outerHTML; result += titleElement.outerHTML;
            result += '<style id="constructAnimations">';
            // Add Keyframes
            for (const keyFrame of configuration.keyframes.getKeyframes().values()) result += keyFrame.styleSheet.innerHTML;
            result += '</style>'
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
            // Add the dependency sources
            for (const src of configuration.dependencies.getDependencies()) {
                result += '<' + 'script src="' + src + '"></script>';
            }
            // main script, seperate the tag as HTML interpreter can view as EOF otherwise
            result += '<' + 'script>';
            // Hold intermediate string to parse and collect all functions first
            let intermediate_result = '';
            // Add in each element definition, add this to intermediate result
            for (const elementName of configuration.elementNames) intermediate_result += 'const ' + elementName + '=document.getElementById("' + elementName + '");';
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
            function getTrimmedBody(functionString, startIndex) {
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
                result += 'const constructJSMethod' + functionIDMap.get(ID) + '=(' + parameters + ')=>{' + getTrimmedBody(functionString, startIndex) + '};';
            }
            // Add the state definitions afterwards
            result += intermediate_result;
            // Add dependency init functions
            for (const initFunction of configuration.dependencies.getInitializers()) {
                const functionString = initFunction.toString();
                let startIndex = functionString.indexOf(')'); startIndex++;
                while (functionString[startIndex] == '{' || functionString[startIndex] == '=' || functionString[startIndex] == '>' || functionString[startIndex] == ' ') startIndex++;
                const trimmedBody = getTrimmedBody(functionString, startIndex);
                // Append to script, add semicolon at end if not present
                result += trimmedBody + (trimmedBody[trimmedBody.length - 1] == ';' ? '' : ';');
            }
            // Add the initializer function (if provided)
            if (configuration.init != null) {
                if (typeof configuration.init != 'function') logError('Initalizer function is not a function.');
                else {
                    const functionString = configuration.init.toString();
                    let startIndex = functionString.indexOf(')'); startIndex++;
                    while (functionString[startIndex] == '{' || functionString[startIndex] == '=' || functionString[startIndex] == '>' || functionString[startIndex] == ' ') startIndex++;
                    result += 'window.onload=()=>{' + getTrimmedBody(functionString, startIndex) + '};';
                }
            }
            result += '<' + '/script>';
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