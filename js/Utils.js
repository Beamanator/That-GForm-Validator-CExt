// different from Auto Import Utils - started on July 20 2017

// =====================================================================================
//                                    PUBLIC FUNCTIONS
// =====================================================================================

/**
 * Function gets current page url (using jQuery) and returns it.
 * 
 * Called by: MainController.js
 * 
 * @returns gurrent page's url [as string]
 */
function Utils_GetPageURL() {
	return $(location).attr('href');
}

/**
 * Function gets the form html element (via jQuery) that matches a given field name
 * 
 * @param {string} fieldName - name of field to search for in form 
 * @returns - element if found, false otherwise
 */
function Utils_GetFormField(fieldName) {
	// get html element w/ specified field name
	var elem = $('div[aria-label="' + fieldName + '"] input[type!="hidden"]');

	// if 0 or > 1 elements found, quit and error
	if (elem.length !== 1) {
		ThrowError({
			title: 'Form Element Not Found',
			message: 'Couldn\'t find form element with name "' + fieldName + '"',
			errMethods: ['mConsoleW']
		});
		return false;
	}

	else
		return elem;
}

/**
 * Function gets Google Form Code from Google Form URL. This code is usually
 * a very long string, and will be used to store validation data in Firebase
 * 
 * @param {string} url - URL of Google Form that has form code in it
 * @returns - piece of URL that represents the Google Form code
 */
function Utils_GetFormCodeFromURL(url) {
	var urlArr = url.split('/');
	var checkIndex = urlArr.indexOf('forms');
	var formCode = '';

	for (let i = checkIndex; i < urlArr.length; i++) {
		let str = urlArr[i];

		if (str.length > 15) {
			formCode = str;
			break;
		}
	}

	return formCode;
}

/**
 * Function checks if a given piece of a URL is contained within the current page's
 * url string.  
 * 
 * Called By: CtrlAdvancedSearch.js
 * 
 * @param {string} urlPiece checks if this piece is within the current page url
 * @returns {boolean} true / false depending on if urlPiece is contained within current url
 */
function Utils_UrlContains(urlPiece) {
	var url = Utils_GetPageURL();

	if (url.indexOf(urlPiece) === -1) {
		// error & quit if the import is not on the right page.
		console.error(urlPiece + ' not found on page: ');
		return false;
	}

	return true;
}

/**
 * Function returns a promise that gets resolved whenever a specified function
 * returns true. Caller passes in a function and possibly a number (time between
 * intervals)
 * 
 * @param {function} Fcondition - function that must eventually return true
 * @param {object} params - array of parameters to pass to Fcondition
 * @param {number} [time=500] - time between each interval call
 * @param {number} [iter=10] - number of iterations allowed before rejecting
 * @returns Promise - resolves when Fcondition returns true
 */
function Utils_WaitForCondition( Fcondition, params, time = 1000, iter = 5 ) {
	return new Promise(function(resolve, reject) {
		var count = 0;
		
		var intervalID = setInterval(function() {
			// -> console logs may not work inside this function
			count++;
			
			// check if condition is true YET
			if ( Fcondition(params) ) {
				clearInterval(intervalID);
				resolve('condition passed');
			}

			// check if we've passed the desired amount of iterations on setInterval
			if (count > iter) {
				clearInterval(intervalID);
				reject('Condition <' + Fcondition.name + '> never returned true over '
					+ iter + ' checks, spaced by ' + time + 'ms.');
			}

		}, time);
	});
}

// =====================================================================================
//                                 UNUSED FUNCTIONS
// =====================================================================================
