# constructJS
ConstructJS is a lightweight JavaScript library enabling website creation using nothing but JavaScript. Styles, functionality, states and content is developed programmatically within JavaScript and exported to a standalone output HTML file for deployment. 

Currently a work in progress, ConstructJS includes **HTML event handling, stylesheet creation, a state and listener function system and basic DOM element creation (using DOM heirarchy)** 

## Usage
### Use constructJS directly in the browser via the `<script>` tag
```html
<script src="https://sam-beck.github.io/constructJS/src/construct.js"></script>
```
## Quickstart
### 1. Create a HTML working document
This serves as the interface between the library and your website to be created. A **simplistic template** is given below:
```html
<!DOCTYPE html>
    <script src="https://sam-beck.github.io/constructJS/src/construct.js"></script>
        <!-- Add a createConstructApp intializer here and start creating your website! -->
    </script>
```

### 2. Adding a constructApp
Add the constructJS initialiser to interact with the library features:
```javascript
const constructApp = createConstructApp('insert page title here');
```
The **createConstructApp() object** can be used to create elements and configure the website.