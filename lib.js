/**
 * @version 1.2.1
 */

var Freedom = Freedom || {};

/**
 * @constructor
 * @link https://github.com/1234ru/phone-formatter
 * @param {string[]} patterns
 */
Freedom.PhoneFormatter = function ( patterns ) {
    this.patterns = this.validatePatterns( patterns );
    this.defaultEmptyFieldStart = this.pickEmptyFieldStart();
}

/**
 * @param {HTMLInputElement} input
 */
Freedom.PhoneFormatter.prototype.attachToInput = function ( input ) {
    this.input = input;
    this.handlers = this.createHandlersInstance( this );
    for ( var eventType in this.handlers ) {
        this.input.addEventListener( eventType, this.handlers[ eventType ] );
    }
    this.refreshInputValue( this.input );
}

Freedom.PhoneFormatter.prototype.createHandlersInstance = function( object ) {
    return {
        input: function () {
            object.refreshInputValue( this );
        },
        focusin: function () {
            if ( ! this.value.trim() ) {
                this.value = object.defaultEmptyFieldStart;
            }
        },
        focusout: function () {
            if ( this.value.trim() === object.defaultEmptyFieldStart ) {
                this.value = '';
            }
        }
    };
}

Freedom.PhoneFormatter.prototype.detachFromInput = function () {
    for ( var eventType in this.handlers ) {
        this.input.removeEventListener( eventType, this.handlers[ eventType ] );
        delete this.handlers[ eventType ];
    }
    delete this.input;
}

/** @private */
Freedom.PhoneFormatter.prototype.validatePatterns = function( allPatterns )   {
    var validPatterns = [];
    var pattern;
    for ( var i = 0; i < allPatterns.length; i++) {
        pattern = allPatterns[ i ];
        if ( ! this.isPatternStringValid( pattern )   ) {
            this.throwInvalidPatternError( pattern );
        } else {
            validPatterns.push( pattern )  
        }
    }
    return validPatterns;
}

/**
 * Picks fragment preceding first number placholder.
 * @private
 * @return string
 */
Freedom.PhoneFormatter.prototype.pickEmptyFieldStart = function() {
    var defaultPattern = this.patterns[ 0 ];
    if ( defaultPattern )   {
        var matches = /^[^N]+/g.exec( defaultPattern );
        return matches[ 0 ] || '';
    } else {
        return '';
    }
}

/**
 * @param {HTMLInputElement} input
 */
Freedom.PhoneFormatter.prototype.refreshInputValue = function( input ) {
    var currentValue = input.value;
    var newValue;
    try {
        newValue = this.format( currentValue, true );
    } catch ( e ) {
        // If no pattern matched, removing invalid characters anyway.
        newValue = this.removeInvalidCharacters( currentValue );
    }
    this.setValueAndHandleCursor( input, newValue );
}

/**
 * @param {string} rawPhone
 * @param {boolean} throwExceptionWhenNoMatch=false
 * @param {boolean} lengthStrictCheck=false
 * @return {string}
 */
Freedom.PhoneFormatter.prototype.format = function (
    rawPhone,
    throwExceptionWhenNoMatch,
    lengthStrictCheck
) {
    var formattedPhone;
    for ( var i = 0; i < this.patterns.length; i++ ) {
        try {
            formattedPhone = this.applyPattern(
                rawPhone,
                this.patterns[ i ],
                true,
                lengthStrictCheck
            );
        } catch ( e ) { // no match
            formattedPhone = '';
        }
        if ( formattedPhone ) { // match!
            break;
        }
    }
    if ( formattedPhone ) {
        return formattedPhone;
    } else {
        if ( throwExceptionWhenNoMatch ) {
            throw 'Phone "' + rawPhone + '" didn\'t match any of the patterns:'
                + "\n" + this.patterns.join(",\n");
        } else {
            return rawPhone;
        }
    }
}

/**
 * Setting input's value and keeping cursor where it was
 * if it's not at the end.
 * @param {HTMLInputElement} input
 * @param {string} newValue
 */
Freedom.PhoneFormatter.prototype.setValueAndHandleCursor = function ( input, newValue ) {
    // https://www.vishalon.net/blog/javascript-getting-and-setting-caret-position-in-textarea
    var caretPosition = input.selectionEnd;
    var keep = ( caretPosition < input.value.length );
    input.value = newValue;
    if ( keep ) {
        input.setSelectionRange( caretPosition, caretPosition );
    }
}

/**
 * @private
 * @param {string} value
 * @return {string}
 */
Freedom.PhoneFormatter.prototype.removeInvalidCharacters = function( value )   {
    return value.replace( /[^+\d\s()\-]/g, '' );
}

/**
 * @private
 * @param {string} rawPhone
 * @param {string} pattern
 * @param {boolean} [throwExceptionWhenNoMatch=false]
 * @param {boolean} [lengthStrictCheck=false]
 */
Freedom.PhoneFormatter.prototype.applyPattern = function(
    rawPhone,
    pattern,
    throwExceptionWhenNoMatch,
    lengthStrictCheck
) {
    // Parsing a template character by character.
    var posAtPattern = 0;
    var posAtPhone = 0;
    var patternChar;
    var phoneChar;
    var formattedPhone = '';

    while (
        ( patternChar = pattern.substr( posAtPattern, 1 ) )
        &&
        ( phoneChar = rawPhone.substr( posAtPhone, 1 ) )
    ) {
        // console.log( "=======");
        // console.log( "Pattern char:", patternChar );
        // console.log( "Phone char: ", phoneChar );
        if ( patternChar === phoneChar ) {
            posAtPhone++;
            if ( phoneChar !== 'N' ) {
                // "N" may come from user input and should not be allowed
                formattedPhone += phoneChar;
                posAtPattern++;
            }
        } else if ( isNaN( parseInt( phoneChar ) ) ) {
            // Disallow non-numeric characters which don't match the pattern
            // Is character a digit: https://stackoverflow.com/a/58102052/589600
            posAtPhone++;
        } else if ( patternChar === 'N' ) {
            formattedPhone += phoneChar;
            posAtPattern++;
            posAtPhone++;
        } else if ( isNaN( parseInt( patternChar ) ) ) {
            formattedPhone += patternChar;
            posAtPattern++;
        } else {
            // Ran into non-matching digits at the start -
            // pattern doesn't match, terminating execution.
            // console.log( "Discarding formatted phone");
            formattedPhone = '';
            break;
        }
        // console.log( "Formatted phone: ", formattedPhone );
    }

    if ( formattedPhone && lengthStrictCheck ) {
        if ( posAtPattern != pattern.length ) {
            formattedPhone = '';
        }
    }

    if ( formattedPhone ) {
        return formattedPhone;
    } else {
        if ( throwExceptionWhenNoMatch ) {
            throw 'Phone "' + rawPhone + '" didn\'t match pattern "' + pattern + '".';
        } else {
            return rawPhone;
        }
    }
}

/** @private */
Freedom.PhoneFormatter.prototype.isPatternStringValid = function( patternString )   {
    var invalidCharsRegexp = /[^\d\s()+\-N ]/g;
    return ! invalidCharsRegexp.test( patternString );
}

/** @private */
Freedom.PhoneFormatter.prototype.throwInvalidPatternError = function( patternString ) {
    var msg = 'Invalid phone pattern "%s". '
        + 'Only digits, spaces, "+", "-", "(", ")" and "N" are allowed' ;
    console.error( msg, patternString );
}

/**
 * @param {string} selector
 */
Freedom.PhoneFormatter.prototype.attachToSelector = function( selector ) {
    if ( ! Freedom.SelectorWatcher ) {
        const msg = "You need Freedom.SelectorWatcher library.\n"
            + "Get it at https://github.com/1234ru/selector-watcher/blob/master/lib.js"
        console.error( msg );
    } else {
        try {
            var obj = this;
            this.watcher = new Freedom.SelectorWatcher();
            this.watcher.attach( {
                selector: selector,
                callback: function ( input ) {
                    obj.refreshInputValue( input );
                },
                handlersByType: this.createHandlersInstance( this )
            } );
        }
        catch ( e ) {
            console.error( e );
        }
    }

}

Freedom.PhoneFormatter.prototype.detachFromSelector = function() {
    if ( this.watcher ) {
        this.watcher.detach();
        delete this.watcher;
    }
}