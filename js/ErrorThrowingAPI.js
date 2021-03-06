// Last Updated: July 24, 2017
// ==================== ERROR THROWING API =======================

/**
 * Ideas for improvement:
 * 1) Throw real popupover, not just swal (from RIPS)
 */

/**
 * Changelog:
 * 24 July 2017:
 * 		- Updated format of comments / function documentation
 * 		- added title to mConsole, mConfirm, mAlert outputs
 * 		- changed console.log() to console.error()
 * 26 July 2017:
 * 		- added mConsoleE and mConsoleW for error and warn
 */

/**
 * API takes in a config object with different available properties, outlined
 * 		in param section below. This API is made to be transferrable between
 * 		many applications (originally created for Chrome Extensions). Written
 * 		in pure JS, no extra libraries are required.
 * 
 * @param {object} config - config object with the following possible properties:
 * 			message: 		(String) - message to display via errorTypes array
 * 
 * 			errMethods: 	(Array) - List of methods for displaying error message
 * 				mConsole: 		(String / number) - message
 * 					or mConsoleE (Error) or mConsoleW (Warn)
 * 				mPopup: 		(String) - message (REQUIRES EXTRA JQUERY LIBRARIES)
 * 				mAlert: 		(String) - message
 * 				mConfirm: 		(String) - message
 * 				mSwal: 			(String) - message (Swal error comes from RIPS codebase)
 * 
 * 
 * 			possible future properties that could be useful:
 * 				fFormatFunction: (function callback)
 * 				eValue: (Obj, String, etc) - error value (used in format function)
 */
function ThrowError(config) {
	if (!config) return;

	var title = config.title;
	var message = config.message;
	var errArr = config.errMethods;

	// defaults
	if (!message) return;
	if (!title) title = "Basic Error";
	if (!errArr || errArr.length === 0) errArr = ['mConsole'];

	// internal functions:
	function ThrowSwal(title, message) {
		location.href="javascript:" +
        "swal({" +
        	"title: '" + title + "'," +
        	"text: '" + message + "'" +
        "});";
	}

	// main logic below:
	if (typeof(errArr) !== 'object') {
		throw "TypeError - prop 'errMethods' must be of type object / Array";
		return;
	}
	for (var i = 0; i < errArr.length; i++) {
		var errType = errArr[i];

		switch(errType) {
			case 'mConsole':
				console.log(title + '\n' + message);
				break;
			case 'mConsoleE':
				console.error(title + '\n' + message);
				break;
			case 'mConsoleW':
				console.warn(title + '\n' + message);
				break;

			case 'mAlert':
				alert(title + '\n' + message);
				break;

			case 'mConfirm':
				confirm(title + '\n' + message);
				break;

			case 'mSwal':
				ThrowSwal(title, message);
				break;
			// case: 'popup':
			//	break;
			default:
				console.log('not sure where to send error message: ', message);
		}
	}

	// ============================= MESSAGE TYPES =================================
	/*
	// Message: Console Log
	var mConsole = config.mConsole;
	if (mConsole) console.log( mConsole );

	// Message: Alert
	var mAlert = config.mAlert;
	if (mAlert) alert( mAlert );

	// Message: Confirm
	var mConfirm = config.mConfirm;
	if (mConfirm) {
		var confirmResponse = confirm(mConfirm);
		// TODO: do something with response
	}

	// Message: Popup
	var mPopup = config.mPopup;
	// TODO: throw popup (requires jQuery)
	*/
}