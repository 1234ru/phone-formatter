<img src="https://raw.githubusercontent.com/1234ru/phone-formatter/master/docs/live-en.gif" width="400" align="center">

Automatic formatting of phone numbers on input into HTML form fields improve 
readability and drastically decreases amount of misprints,
while not demanding users to enter anything but digits.

This tool is a quick and easy solution, providing formatting based on multiple arbitrary 
templates.

The library uses just pure Javascript and is compatible with all modern browsers including Internet Explorer 11.

[По-русски](../README.md)


## How to use

1. Include [`lib.js`](../lib.js) script.  

2. Make a list of phone number templates. For example:

```javascript
const numberPatterns = [
  '+1 (NNN) NNN-NN-NN',  // USA/Canada
  '+44 NN NNNN NNNN',    // UK
  '+7 (NNN) NNN-NNNN',   // Russia
  '+38 (0NN) NNN-NN-NN', // Ukraine
];
```

3. Instantiate a watcher and attach it to fields. For example, all of type `tel`:

```javascript
document.querySelectorAll( 'input[type=tel]' ).forEach( function( input ) {
    const formatterObject = new Freedom.PhoneFormatter( numberPatterns );
    formatterObject.attachToInput( input );
} );
```

(`Freedom` is a web framework featuring this library, hence the namespace's name.)

4. Detach the watcher: 
   
```javascript
formatterObject.detachFromInput();
```


## Features


* multiple formatting templates may be used simultaneously (different countries as an 
  example);  
all templates will be analyzed, and the one matching starting digits of the phone will be 
  applied  

* starting part of *first* template is set into empty field on focus;  
if there is no input eventually, the field is set back to empty when focus is lost    
<img src="https://raw.githubusercontent.com/1234ru/phone-formatter/master/docs/blank-input-en.gif" width="250" align="center">

* if no template matches the given phone number it will not be formatted 

* invalid characters (letters etc.) are removed anyway

* keeps cursor position on input (opposite to widely spread case when cursor always jumps to the end)  

The examples are in [docs/demo-en.html](docs/demo-en.html) file.


## Watching by selector

You can establish a watcher basing on arbitrary CSS selector. It will affect *not only 
fields currently present, but also added in the future*:

```javascript
formatterObject.attachToSelector( 'input[type=tel]' );
```

Detach the watcher: `formatterObject.detachFromSelector()`.

This feature requires 
[lib.js](https://github.com/1234ru/selector-watcher/blob/master/lib.js)
from 
[Freedom.SelectorWatcher](https://github.com/1234ru/selector-watcher)
package to be included.