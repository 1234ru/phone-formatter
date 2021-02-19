/**
 * @version 1.0
 */

var Freedom = Freedom || {};

/**
 * @param {string[]} patterns
 * @constructor
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
        keyup: function () {
            object.refreshInputValue( this );
        },
        focus: function () {
            if ( ! this.value.trim() ) {
                this.value = object.defaultEmptyFieldStart;
            }
        },
        blur: function () {
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
 * @private
 * @return string
 */
Freedom.PhoneFormatter.prototype.pickEmptyFieldStart = function() {
    var defaultPattern = this.patterns[ 0 ];
    if ( defaultPattern )   {
        // фрагмент до первой "N"
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
    for ( var i = 0; i < this.patterns.length; i++ ) {
        if ( newValue = this.formatPhoneNumber( currentValue, this.patterns[ i ] ) ) {
            break;
        }
    }
    if ( ! newValue ) {
        // Если не нашлось подходящего шаблона и телефон
        // не был отформатирован - хотя бы удаляем
        // недопустимые символы.
        newValue = this.removeInvalidCharacters( currentValue );
    }
    // При установке значения поля курсор сдвигается в конец.
    // Если полученное значение идентично текущему,
    // двигать курсор ни к чему, поэтому добавляем проверку.
    if ( currentValue !== newValue )   {
        input.value = newValue;
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

// Шаблоны номеров можно хранить в виде строк.
// Преобразование в объекты и разбор не требуются.
// /**
//  * @typedef {Object} phoneNumberPattern
//  * @property {string} leftmostNumbers
//  * @property {string} body
//  */
//
// /**
//  * @param patternStrings
//  * @return phoneNumberPattern[]
//  */
// Freedom.PhoneAutoformat.prototype.preparePatterns = function (patternStrings )   {
//     var i, patternString, patternObjects = [];
//     for (i = 0; i < patternStrings.length; i++) {
//         patternString = patternStrings[ i ];
//         patternObjects.push( {
//             leftmostNumbers: patternString.replace( /\D/g, ''),
//             body: patternString
//         });
//     }
//     return patternObjects;
// }

/**
 * @param {string} rawPhone
 * @param {string} pattern
 * @param {boolean} [returnOriginalWhenNoMatch=false]
 */
Freedom.PhoneFormatter.prototype.formatPhoneNumber = function(
    rawPhone,
    pattern,
    returnOriginalWhenNoMatch
) {
    // Разбираем шаблон по одному символу.
    // Если символ - цифра, сдвигаем "курсор" на одну позицию вправо
    // в исследуемой строке и вставляем эту цифру в результат.
    // В противном случае вставляем в результат символ из шаблона.

    // Если выполнение происходит вне контекста объекта -
    // проверяем шаблон.
    if ( typeof this.patterns === 'undefined' ) {
        if ( ! this.isPatternStringValid( pattern ) ) {
            this.throwInvalidPatternError( pattern );
        }
    }

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
        if ( patternChar == phoneChar ) {
            posAtPhone++;
            if ( phoneChar !== 'N' ) {
                // N обрабатываем отдельно, т.к. она входит в шаблон,
                // но частью конечного форматирования являться не должна
                formattedPhone += phoneChar;
                posAtPattern++;
            }
        } else if ( isNaN( parseInt( phoneChar ) ) ) {
            // это вместо удаления всех нецифровых символов
            posAtPhone++;
        } else if ( patternChar == 'N' ) {
            formattedPhone += phoneChar;
            posAtPattern++;
            posAtPhone++;
        } else if ( isNaN( parseInt( patternChar ) ) ) {
            // Является ли символ цифрой: https://stackoverflow.com/a/58102052/589600
            formattedPhone += patternChar;
            posAtPattern++;
        } else {
            // Нашли несовпадающие цифры в начальной части -
            // паттерн не совпадает, прекращаем выполнение.
            // console.log( "Discarding formatted phone");
            formattedPhone = '';
            break;
        }
        // console.log( "Formatted phone: ", formattedPhone );
    }

    return formattedPhone
        ? formattedPhone
        : ( returnOriginalWhenNoMatch ? rawPhone : formattedPhone );
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