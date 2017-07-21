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
		var valArr = obj[valType];

		switch (valType) {
			case 'date':
				setupVal_Date(valArr);
				break;

			case 'email':
				setupVal_Email(valArr);
				break;

			case 'phone':
				setupVal_Phone(valArr);
				break;
			
			case 'unhcr':
				setupVal_Unhcr(valArr);
				break;

			default:
				console.error('Validation type <' + valType + '> not recognized' +
				' by switch inside setupValidators()');
		}
	});
}

// ========================================================================
//                       CHANGE -> VALIDATION FUNCTIONS (new)
// ========================================================================

function setupVal_Date(arr) {
	console.log('date val - in progress');

	// loop through all date elements in this form that need validation
	for (let i = 0; i < arr.length; i++) {
		var field = arr[i],
			fieldName = field['field_name'];

		// first get html element w/ name in field_name
		var elem = $('div[aria-label="' + fieldName + '"] input[type!="hidden"]');

		// next setup blur for when element changes
		elem.blur(function(e) {
			// get value of date - default format is probably 'yyyy-MM-dd'
			var val = $(this).val();

			// if invalid format, val will be empty
			if (val !== '') {
				// FIXME: TODO: how do we know date format should always be 'yyyy-MM-dd'???
			}

			debugger;
		});

		// inside blur check if data is valid

		// if not valid, throw error
		// debugger;
	}
}

function setupVal_Email(arr) { console.log('email val'); }
function setupVal_Phone(arr) { console.log('phone val'); }
function setupVal_Unhcr(arr) { console.log('unhcr val'); }

// ========================================================================
//                       CHANGE -> VALIDATION FUNCTIONS (old)
// ========================================================================

/**
 * Function adds / removes phone number validation to the following pages:
 * Registration
 * Client Basic Information
 * 
 * @param {boolean} on specifies if we are turning validation on or off
 */
function setValidatePhoneNo(on) {
	// Add jQuery 'blur' function to phone text box.
	// When phone number is changed and focus leaves, calls validation function
    
    if (on) {
    	updateStorageLocal({'VALID_PHONE': true}, function(response) {
			$("#" + getPhoneElemID() ).blur(function () {
		        validatePhoneNo(true);
		    });
		});
	} else {
		updateStorageLocal({'VALID_PHONE': false}, function(response) {
			$("#" + getPhoneElemID() ).unbind("blur");
		});
	}
}

/**
 * Function adds / removes UNHCR number validation to the following pages:
 * Registration
 * Client Basic Inforamtion
 * 
 * @param {boolean} on specifies if we are turning validation on or off
 */
function setValidateUNHCR(on) {
    // Add jQuery 'blur' function to UNHCR text box.
    // When UNHCR number is changed and focus leaves, call validation function
    
    if (on) {
    	updateStorageLocal({'VALID_UNHCR': true}, function(response) {
			$("#UNHCRIdentifier").blur(function () {
		        validateUNHCR(true);
		    });
		});
	} else {
		updateStorageLocal({'VALID_UNHCR': false}, function(response) {
			$("#UNHCRIdentifier").unbind("blur");
		});
	}
}

function setValidateAppointmentNo(on) {
	console.log('woot! not implemented yet...');
}

// ========================================================================
//                            CHROME LISTENERS
// ========================================================================

// "clicked_browser_action" is our point for kicking things off
chrome.runtime.onMessage.addListener( function(request, MessageSender, sendResponse) {
	// Kick things off in content.js!
	if( request.message === "clicked_browser_action" ) {
		// console.log(request.value, request.on);
		switch (request.value) {
			case "validate_unhcr":
				setValidateUNHCR(request.on);
				break;
	        case "validate_phone":
	        	setValidatePhoneNo(request.on);
        		break;
        	// case "validate_dates":
        	// 	changeValidateDates(request.on);
        	// 	break;
        	// case "validate_appt_no":
        	// 	changeValidateAppointmentNo(request.on);
        	// 	break;
			default:
				console.log('unhandled browser action click!');
		}
	} else {
		console.log('listened to message, but not handled -> ',
			request,
			request.message
		);
	}
});

// ========================================================================
//                            VALIDATION FUNCTIONS
// ========================================================================

/**
 *	Validates if a given UNHCR ID is valid in the new or old format
 *		valid 'New' format: ###-YYC#####
 *		valid 'Old' format: ####/YYYY
 *		valid 'Pre-card' format: ###-CS########
 *		valid 'Unknown' / 'None' format: 'None'
 * 
 * @param {boolean} throwErrorFlag if true, errors is thrown. If false, is not thrown
 * @returns boolean for valid fields (true = valid, false = invalid) 
 */
function validateUNHCR(throwErrorFlag) {

    // can use '\\n' to enter text on a new line if needed
    function throwUnhcrError(message, fatal) {
    	var msg = '';

    	// if message is passed in, use that string. else use default.
    	if (message) {
    		msg = message;
    	} else {
    		msg = 'UNHCR numbers must match one of these formats:' +
    			'\\n###-YYC##### (new)' +
	        	'\\n####/YYYY (old)' +
	        	'\\n###-CS########' +
	        	'\\nFor no UNHCR number, enter \\"None\\"';
    	}

    	// if ThrowError (from ErrorThrowingAIP.js) doesn't exist,
    	// -> log error message to console
		// also if throwErrorFlag is false, just throw console error.
    	if (!ThrowError || !throwErrorFlag) {
    		console.error(msg);
    		return;
    	}

	    // if fatal flag is set, show different title
	    if (fatal) {
	    	title = 'Invalid UNHCR #';
	    } else {
	    	title = 'Warning: UNHCR # Edited'
	    }

    	ThrowError({
    		title: title,
    		message: msg,
        	errMethods: ['mConsole', 'mSwal']
    	});
    }

    // function removes non-alphanumeric values like \, -, +, etc
    function removeNonAlphanumeric(num) {
    	return num.replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789]/g,'');
    }

    // function checks if format is valid for the new UNHCR ID style
    function checkValidNew(num) {
        var format = "^[0-9]{3}-[0-9]{2}C[0-9]{5}$";

        // remove non-alphanumeric values from num
        num = removeNonAlphanumeric(num);

        // convert letters to uppercase and replace capital O with zeros (0)
	    num = num.replace(/O/g,"0");

        // add '-' in 3rd position!
	    num = num.substr(0, 3) + "-" + num.substr(3);

        // if entered data doesn't match format, return false.
        if (num.match(format) == null) {
        	return false;
        } else {
        	placeInputValue('UNHCR', num);
        	return true; 
        }
    }

    // function checks if format is valid for the old UNHCR ID style
    function checkValidOld(num) {
        var format = "^[0-9]{4}/[0-9]{4}$";

        // remove non-alphanumeric values from num
        num = removeNonAlphanumeric(num);

        // convert letters to uppercase and replace capital O with zeros (0)
	    num = num.replace(/O/g,"0");

        // add '/' in 4th position!
	    num = num.substr(0, 4) + "/" + num.substr(4);

        // if entered data doesn't match format, return false.
        if (num.match(format) == null) {
            return false;
        } else {
        	placeInputValue('UNHCR', num);
        	return true
        }
    }

    // function checks if format is valid for case number (before getting card)
    function checkValidCS(num) {
    	var format = "^[0-9]{3}-CS[0-9]{8}$";

    	// remove non-alphanumeric values from num
        num = removeNonAlphanumeric(num);

        // convert letters to uppercase and replace capital O with zeros (0)
	    num = num.replace(/O/g,"0");

        // add '/' in 4th position!
	    num = num.substr(0, 3) + "-" + num.substr(3);
    	
    	// if entered data doesn't match format, return false.
    	if (num.match(format) == null) {
    		return false;
    	} else {
    		placeInputValue('UNHCR', num);
    		return true;
    	}
    }

    // function checks if value is equal to "None"!!
    // @param: num = UNHCR ID in capital letters
    function checkValidNone(num) {
    	// remove non-alphanumeric values from num
        num = removeNonAlphanumeric(num);

    	// check if it is "NONE"
    	if (num === 'NONE') {
    		placeInputValue('UNHCR', 'None');
    		return true;
    	} else {
    		return false;
    	}
    }

    // get UNHCR number from input box
    var UNHCRID = "" + $('#' + getUnhcrElemID() ).val();

    // quit if number is empty
    if (!UNHCRID) return;

    // convert ID to uppercase:
    UNHCRID = UNHCRID.toUpperCase();

    // put upper-case value back into input box
    placeInputValue('UNHCR', UNHCRID);

    // Logic for deciding which format to validate on
    if (
    			checkValidCS(UNHCRID)  ||
    			checkValidNew(UNHCRID) ||
    			checkValidOld(UNHCRID) ||
    			checkValidNone(UNHCRID)
    		) {
    	// one format is correct, so we're happy!
    	// console.log('UNHCR ID is valid');
    	return true;
    } else {
    	// No valid formats, so pop up warning!
    	throwUnhcrError('', 1);
    	return false;
    }

    // notifications I threw out:
    // throwUnhcrError('Note: Added [-] to UNHCR Number', 0);
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

/*
Validates if a given date is in correct format
	Validation format: DD/MM/YYYY
		00 <= DD <= 31
		00 <= MM <= 12
		1000 <= YYYY <= 2030
*/
function validateDate(element) {
	// debugger;
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

// function to localize where messages are sent
// Options:
// 		1 = console.log (default)
//  	2 = alert()
// 		3 = both (console.log then alert)
function message(text, option) {
	if (!text) return;
	else {
		if (option === 1) {
			console.log(text);
		} else if (option === 2) {
			alert(text);
		} else if (option === 3) {
			console.log(text);
			alert(text);
		} else {
			// default message method - no valid 'option' specified
			console.log(text);
		}
	}
}

/**
 * Function sends data to background.js for storage.
 * 
 * Format of dataObj: {
 * 		key1: value1,
 * 		key2: value2
 * }
 * 
 * @param {object} dataObj obj with all key:value pairs to store to chrome local storage
 * @param {function} callback function to call after data is stored
 * @returns nothing at this time
 */
function updateStorageLocal(dataObj, callback) {
	// set up message config object
	var mObj = {
		action: 'store_data_to_chrome_storage_local',
		dataObj: dataObj
	};
	
	// send message config to background.js
	chrome.runtime.sendMessage(mObj, callback);
}

// ======================= DATE VALIDATION ========================
// Removed because:
//  difficult to add event listeners in the right spot. Maybe can just add blur, but
//  users may experience extra warnings. This may be okay, but I tried to avoid :(

// function dateFocusIn() {
// 	debugger;
// 	$(this).data('valB4', $(this).val());
// 	console.log('focus in date', $(this).data('valB4'));
// }

// function dateChange() {
// 	console.log('date changed');
// 	console.log('before',$(this).data('valB4'));
// 	console.log('now', $(this).val());
// 	// debugger;
// 	// $(this).data('valB4');
// 	// validateDate( $(this) );
// }

/*
	add date format validation to all Date textboxes:
		Date of UNHCR Registration 
		Date of Birth
		Date of Arrival in Egypt
		RSD Date
*/
// function changeValidateDates(on) {
	// console.log('validation',on);

	// Add jQuery 'blur' function to Date text boxes.
    // Purpose: When user enters a date, this function will make sure the format
    //  is acceptable. If not, a swal error will be thrown.
    
  //   if (on) {
  //   	updateStorageLocal({'VALID_DATES': true})
		// .then(function(results) {
			// debugger;
			// Date of Birth:
			// $("input#LDATEOFBIRTH").on('focusin', dateFocusIn);
			// $("div#ui-datepicker-div").on('click', dateBoxClick);
			// $("table.ui-datepicker-calendar").on('click', dateBoxClick);
			
			// $("div#ui-datepicker-div tbody").on('click', dateBoxClick);
			// $("input#LDATEOFBIRTH").on('input propertychange paste', dateChange);
			// $("#ui-datepicker-div").datepicker({
			// 	onSelect: dateSelect
			// });

			// Date Entered Country:
			// $("input#CDDateEntryCountryLabel").on('focusin', dateFocusIn);
			// $("input#CDDateEntryCountryLabel").on('change', dateChange);

			// // Registration Date:
			// $("input#CDDateRegisteredLabel").on('focusin', dateFocusIn);
			// $("input#CDDateRegisteredLabel").on('change', dateChange);

			// // RSD Date:
			// $("input#LRSDDATE").on('focusin', dateFocusIn);
			// $("input#LRSDDATE").on('change', dateChange);
	// 	});
	// } else {
	// 	updateStorageLocal({'VALID_DATES': false})
	// 	.then(function(results) {
			// Date of Birth:
			// $("input#LDATEOFBIRTH").off('focusin', dateFocusIn);
			// $("input#LDATEOFBIRTH").off('change', dateChange);

			// Date Entered Country:
			// $("input#CDDateEntryCountryLabel").off('focusin', dateFocusIn);
			// $("input#CDDateEntryCountryLabel").off('change', dateChange);

			// // Registration Date:
			// $("input#CDDateRegisteredLabel").off('focusin', dateFocusIn);
			// $("input#CDDateRegisteredLabel").off('change', dateChange);

			// // RSD Date:
			// $("input#LRSDDATE").off('focusin', dateFocusIn);
			// $("input#LRSDDATE").off('change', dateChange);
// 		});
// 	}
// }