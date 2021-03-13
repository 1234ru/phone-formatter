const invalidPatterbRegexp = /[^\d\s()+\-N ]/g;
const emptyStartRegexp = /^[^N]+/g;

type Handler = (this: HTMLInputElement) => void;
type Handlers = Record<string, Handler>;

class PhoneFormatter {
	static validatePattern(pattern: string) {
		return !invalidPatterbRegexp.test(pattern);
	}

	static removeInvalidCharacters(value: string) {
		return value.replace(/[^+\d\s()\-]/g, "");
	}

	static applyPattern(
		rawPhone: string,
		pattern: string,
		lengthStrictCheck: boolean = false
	) {
		// Parsing a template character by character.
		let posAtPattern: number = 0;
		let posAtPhone: number = 0;
		let patternChar: string;
		let phoneChar: string;
		let formatted = "";

		while (
			(patternChar = pattern[posAtPattern]) &&
			(phoneChar = rawPhone[posAtPhone])
		) {
			if (patternChar === phoneChar) {
				posAtPhone++;
				if (phoneChar !== "N") {
					// "N" may come from user input and should not be allowed
					formatted += phoneChar;
					posAtPattern++;
				}
			} else if (isNaN(parseInt(phoneChar))) {
				// Disallow non-numeric characters which don't match the pattern
				// Is character a digit: https://stackoverflow.com/a/58102052/589600
				posAtPhone++;
			} else if (patternChar === "N") {
				formatted += phoneChar;
				posAtPattern++;
				posAtPhone++;
			} else if (isNaN(parseInt(patternChar))) {
				formatted += patternChar;
				posAtPattern++;
			} else {
				// Ran into non-matching digits at the start -
				// pattern doesn't match, terminating execution.
				formatted = "";
				break;
			}
		}

		if (formatted && lengthStrictCheck) {
			if (posAtPattern !== pattern.length) {
				formatted = "";
			}
		}

		return formatted;
	}

	patterns: string[];
	input: HTMLInputElement;
	handlers: Handlers;

	get defaultEmptyFieldStart() {
		const [pattern] = this.patterns;

		if (pattern) {
			var matches = emptyStartRegexp.exec(pattern);
			return matches ? matches[0] : "";
		}

		return "";
	}

	constructor(patterns: string[]) {
		this.patterns = patterns.filter((pattern) => {
			const isValid = PhoneFormatter.validatePattern(pattern);

			if (!isValid) {
				console.error(
					`Invalid phone pattern "${pattern}". Only digits, spaces, "+", "-", "(", ")" and "N" are allowed`
				);
			}
			return isValid;
		});
	}

	attachToInput(input: HTMLInputElement) {
		this.input = input;
		this.handlers = this.createHandlers();

		for (let eventType in this.handlers) {
			this.input.addEventListener(eventType, this.handlers[eventType]);
		}

		this.refreshInputValue();
	}

	detachFromInput() {
		for (let eventType in this.handlers) {
			this.input.removeEventListener(eventType, this.handlers[eventType]);
			delete this.handlers[eventType];
		}
	}

	createHandlers(): Handlers {
		const self = this;

		return {
			input: function (this: HTMLInputElement) {
				self.refreshInputValue();
			},
			focusin: function (this: HTMLInputElement) {
				if (!this.value.trim()) {
					this.value = self.defaultEmptyFieldStart;
				}
			},
			focusout: function (this: HTMLInputElement) {
				if (this.value.trim() === self.defaultEmptyFieldStart) {
					this.value = "";
				}
			},
		};
	}

	refreshInputValue() {
		const { value } = this.input;

		this.setValueAndHandleCursor(
			this.format(value) || PhoneFormatter.removeInvalidCharacters(value)
		);
	}

	format(rawPhone: string, lengthStrictCheck: boolean = false) {
		for (let i = 0; i < this.patterns.length; i++) {
			const formatted = PhoneFormatter.applyPattern(
				rawPhone,
				this.patterns[i],
				lengthStrictCheck
			);

			if (formatted) {
				return formatted;
			}
		}

		return void 0;
	}

	setValueAndHandleCursor(newValue: string) {
		// @see: https://www.vishalon.net/blog/javascript-getting-and-setting-caret-position-in-textarea
		const { value, selectionEnd } = this.input;
		const keep = selectionEnd! < value.length;

		this.input.value = newValue;

		if (keep) {
			this.input.setSelectionRange(selectionEnd, selectionEnd);
		}
	}
}

(window as any).Freedom = {
	PhoneFormatter,
};
