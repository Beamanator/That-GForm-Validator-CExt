$(document).ready(function(){
	var URL = Utils_GetPageURL();
	
	// get form code from url, use to get form code validator
	var formCode = Utils_GetFormCodeFromURL(URL);

	// get form code validator (validation config)
	var formCodeValidator = getFormCodeValidator(formCode);

	// TODO: add validator_link.html to pages that match
});

// ========================================================================
//                            MAIN SETUP FUNCTIONS
// ========================================================================

// Get "FormCodes" object from firebase:
/**
 * Function gets validator from firebase via specified form code
 * 
 * @param {string} code - code specifying exact google form 
 */
function getFormCodeValidator(code) {
	// setup config obj for background.js
	var mObj = {
		action: 'firebase_get_form_code_validator',
		formCode: code
	};

	chrome.runtime.sendMessage(mObj, function(validator) {
		if (validator === '')
			console.error('Error: No form code validator');

		else if (validator === 'empty')
			console.warn('Warning: form code not found in database');

		else {
			setupValidators(validator);
		}
	});
}

/**
 * Function breaks validator object into specific validation functions
 * 
 * @param {object} obj - validator object 
 */
function setupValidators(obj) {
	Object.keys(obj).forEach(function(valType, index) {
		// skip this key if not a type of validation
		if (valType === '_internal_notes')
			return;

		var valArr = obj[valType],
			blurFn;

		// set appropriate blur function depending on type of validation
		switch (valType) {
			case 'date':
				blurFn = setupBlur_Date;
				break;

			case 'email':
				blurFn = setupBlur_Email;
				break;

			case 'phone':
				blurFn = setupBlur_Phone;
				break;
			
			case 'unhcr':
				blurFn = setupBlur_Unhcr;
				break;

			default:
				console.error('Validation type <' + valType + '> not recognized' +
				' by switch inside setupValidators()');
		}

		if (blurFn !== undefined) {
			// loop through valArr to set up validation on all elements of this type
			for (let i = 0; i < valArr.length; i++) {
				var field = valArr[i],
					fieldName = field['field_name'];

				// get html element w/ name 'fieldName'
				var elem = Utils_GetFormField(fieldName);
				if (!elem)
					continue;

				// set blur function on element, passing field in first parameter
				// note: first param data goes to blur event's event.data node
				elem.blur(field, blurFn);
			}
		}
	});
}

// ========================================================================
//                       CHANGE -> VALIDATION FUNCTIONS (new)
// ========================================================================

/**
 * Function gets form data (date) then checks if it's valid. If it isn't, clears
 * the input back to nothing. Note: passed-in field data comes in e.data node.
 * 
 * @param {object} e - jQuery event object holding field data and more 
 */
function setupBlur_Date(e) {
	var field = e.data;

	// get value of date in Google Form - format doesn't really matter
	var formDate = $(this).val();

	// if invalid format (or didn't enter month or year or day),
	// val will be empty. If not empty, check format
	if (formDate !== '') {
		// If date is invalid, reset value in form to blank
		if ( !validateDate(field, formDate) )
			$(this).val('');
	}
}

function setupBlur_Email(e) { console.log('email val'); }
function setupBlur_Phone(e) { console.log('phone val'); }

function setupBlur_Unhcr(e) {
	var field = e.data,
		$this = $(this);
	
	// store this element variable
	field['$this'] = $this;

	// get value of unhcr number in Google form
	var formUNHCR = $this.val();

	// if textbox is empty, don't do validation
	if (formUNHCR !== '') {
		// If UNHCR is invalid, reset value in form to blank
		if ( !validateUNHCR(field, formUNHCR) )
			$this.val('');
	}
}

// ========================================================================
//                       CHANGE -> VALIDATION FUNCTIONS (old)
// ========================================================================

// ========================================================================
//                            CHROME LISTENERS
// ========================================================================

// chrome.runtime.onMessage.addListener( function(request, MessageSender, sendResponse) {
// });

// ========================================================================
//                            VALIDATION FUNCTIONS
// ========================================================================

/**
 * Function returns the validity of a UNHCR number entered (true / false if valid)
 * based on given fieldData settings
 * 
 * @param {object} fieldData - data describing form field and its settings 
 * @param {string} formUNHCR - data from input box in Google Form
 * @returns - true / false if valid
 */
function validateUNHCR(fieldData, formUNHCR) {

    /**
	 * Function throws "ThrowError" error for UNHCR not matching any format
	 */
	function throwUnhcrError(message) {
		var msg;
		
		if (message) {
			msg = message;
		} else {
			msg = 'UNHCR numbers must match one of these formats:' +
    			'\n###-YYC##### (new)' +
	        	'\n####/YYYY (old)' +
	        	'\n###-CS########' +
				'\nFor no UNHCR number, try "None" or "Unknown"';
		}

    	// if ThrowError (from ErrorThrowingAIP.js) doesn't exist,
    	// -> log error message to console
		// also if throwErrorFlag is false, just throw console error.
    	if (!ThrowError) {
    		console.error(msg);
    		return;
		}
		
		let title = 'Invalid UNHCR #';

    	ThrowError({
    		title: title,
    		message: msg,
        	errMethods: ['mAlert', 'mConsoleE']
    	});
    }

	/**
	 * Functions below return specific known regex formats for 4 specific cases
	 * 
	 * @returns - string to be used in regex .match() function
	 */
	function getFormat_New() { return "^[0-9]{3}-[0-9]{2}C[0-9]{5}$"; }
	function getFormat_Old() { return "^[0-9]{4}/[0-9]{4}$"; }
	function getFormat_AS()  { return "^[0-9]{3}-CS[0-9]{8}$"; }
	function getFormat_None(){ return "^N0NE$"; }

    // convert ID to uppercase:
	formUNHCR = formUNHCR.toUpperCase();

	var $this = fieldData['$this'],
		formats = fieldData['formats'],
		valid = false;
		validFormatsMessage = 'UNHCR numbers must match one of these formats:';

    // put upper-case value back into input box
    $this.val( formUNHCR );

	// loop through formats
	for (let i = 0; i < formats.length; i++) {
		var fmt = formats[i],
			regexFormat = '',
			substrArr = [0, ''],
			specialOutput = '';

		switch (fmt) {
			case 'New':
				regexFormat = getFormat_New();
				substrArr = [3, '-'];
				validFormatsMessage += '\n###-YYC##### (new format)';
				break;

			case 'Appointment Slip':
				regexFormat = getFormat_AS();
				substrArr = [3, '-'];
				validFormatsMessage += '\n###-CS######## (appointment slip format)';
				break;

			case 'None':
				regexFormat = getFormat_None();
				specialOutput = 'None';
				validFormatsMessage += '\nNone';
				break;

			case 'Old':
				regexFormat = getFormat_Old();
				substrArr = [4, '/']
				validFormatsMessage += '\n####/YYYY (old format)';
				break;

			default:
				// treat format as "regex,finaloutput"
				let customFmtArr = fmt.split(',');

				regexFormat = customFmtArr[0];
				specialOutput = customFmtArr[1];
				validFormatsMessage += '\n' + specialOutput;
		}
		
		// remove non-alphanumeric characters, then replace O's with 0's
		formUNHCR = Utils_RemoveNonAlphanumeric(formUNHCR)
						.replace(/O/g, "0");

		// add in special character if needed (stored in substrArr)
		formUNHCR = formUNHCR.substr(0, substrArr[0]) + substrArr[1] +
						formUNHCR.substr(substrArr[0]);

    	// if number in form doesn't match desired regex format, don't do anything
    	if (formUNHCR.match(regexFormat) == null) {
			console.log('Aha! no match. Continuing to other formats');
		}
		
		// if number DOES match a desired regex format, put val back in input box
		// and set valid to true!
		else {
			// if format is 'None', set input value to 'None'.
			if (specialOutput !== '')
				$this.val( specialOutput );

			// else, set input value to new formUNHCR value
			else
				$this.val( formUNHCR );
			
			valid = true;
    		break;
    	}
	}

    if (valid) {
    	// one format is correct, so we're happy!
    	return true;
    } else {
    	// No valid formats, so pop up warning!
		// throwUnhcrError(validFormatsMessage); // TODO: add new message here, maybe
		throwUnhcrError(validFormatsMessage);
    	return false;
    }
}

/**
 * Validates if main Phone number is valid (11 numbers):
 * If only 10, add leading 0 and warn user
 * 
 * Notes about formatting function:
 * 		Turns 'I' and 'L' into 1's
 * 		Turns 'O' into 0's
 * 		Removes all other characters that aren't numbers
 * 
 * @param {boolean} throwErrorFlag if true, errors is thrown. If false, is not thrown
 * @returns boolean for valid field (true = valid, false = invalid) 
 */
function validatePhoneNo(throwErrorFlag) {
	function formatNum(num) {
		// use a regexp to replace 'I' or 'L' with '1'
		// num = num.replace(/[IL]/g,'1');
		
		// replace letter O's with 0's
		num = num.replace(/O/g,"0");

		// remove other characters potentially in phone number:
		num = num.replace(/[^0123456789]/g,'');

		return num;
	}

	// can use '\\n' to enter text on a new line if needed
    function throwPhoneNoError(message, fatal) {
    	var title;

    	// if ThrowError (from ErrorThrowingAIP.js) doesn't exist,
		// or no message, or throwErrorFlag is falss -> quit
    	if (!ThrowError || !message || !throwErrorFlag) {
			console.log('Phone # Error: ', message);
			return;
		}

    	// if fatal flag is set, show different title on swal
    	if (fatal) {
    		title = 'Invalid Preferred Phone #';
    	} else {
    		title = 'Warning: Preferred Phone # Edited';
    	}

    	ThrowError({
    		title: title,
    		message: message,
        	errMethods: ['mConsole', 'mSwal']
    	});
    }

	// get phone number from input box
	var num = $('#' + getPhoneElemID() ).val();

	// format user-entered number (after converting to upper-case)
	var num = formatNum( num.toUpperCase() );

	// replace text w/ new formatted text	
	placeInputValue('PHONE', num);

	// quit if num is empty
	if (!num) return;

	if ( num.length === 10 ) {
		// add leading 0, then show warning error
		num = '0' + num;

		// throw new number back into input box for user to see
		placeInputValue('PHONE', num);

		// show user warning
		throwPhoneNoError('Added leading 0 to phone number');

		return true;
	} else if ( num.length === 11) {
		// do nothing since '-' is removed already
		return true;
	} else {
		// throw fatal error
		throwPhoneNoError('Preferred Phone # must be 11 numbers\\n\\n' +
			'Extra #s should go in "Other phone" field', 1);

        return false;
	}
}

/**
 * Function returns the validity of the date entered (true if valid, false if not)
 * based on given fieldData settings
 * 
 * @param {object} fieldData - data describing form field and its settings
 * @param {string} inputDate - date from date box in form
 * @returns - true / false if valid
 */
function validateDate(fieldData, inputDate) {
	/**
	 * Function returns true if inputDate is in the future, false others
	 * 
	 * @param {string} dateString - date from google form
	 * @param {boolean} includeToday - include today in [future] calculation
	 * @returns - true / false if input date is valid or not
	 */
	function F_future(dateString, includeToday) {
		// get current date
		var currDate = new Date();
		var formDate = new Date(dateString);

		// if we include today, subtract 1 from current date before compare
		if (includeToday)
			currDate.setDate(currDate.getDate() - 1);

		// return true if given date is after today
		return formDate.getTime() > currDate.getTime();
	}

	var fieldName = fieldData['field_name'],
		format = 	fieldData['format'],
		includeToday = fieldData['include_today'];
	
	var valid = false;

	if (includeToday === undefined)
		includeToday = false;
	
	switch(format) {
		case 'future':
			valid = F_future(inputDate, includeToday);
			break;

		case 'past':
			// valid = F_past(inputDate, includeToday);
			break;

		default:
			console.error('Error: could not find validation function for format:',
				format);
	}

	// if date is not valid, send error message
	if (!valid) {
		let message = 'Form field invalid: (Field Name = "' + fieldName + '").' +
			'\nPlease enter date again.' +
			'\nDate entered: ' + inputDate +
			'\nDate must have format: ' + format;

		ThrowError({
			title: 'Invalid Date',
			message: message,
			errMethods: ['mAlert', 'mConsoleE']
		});
	}

	return valid;
}

// ========================================================================
//                             OTHER FUNCTIONS
// ========================================================================

 // places value into specified field
// @param:
// 	field: fields supported: 'UNHCR', 'PHONE'
function placeInputValue(field, val) {
	if (!field) return;

	var elem_id_unhcr = getUnhcrElemID(); 
	var elem_id_phone = getPhoneElemID();

	field = field.toUpperCase();

	switch(field) {
		case 'UNHCR':
			$('#' + elem_id_unhcr).val(val);
			break;
		case 'PHONE':
			$('#' + elem_id_phone).val(val);
			break;
		default:
			console.log('field <' + field + '> not recognized');
	}
}
