/**
 * Notes about 'background.js':
 * 1) console.log() DOES work - look at background scrip from chrome://extensions
 * --- http://stackoverflow.com/questions/3829150/google-chrome-extension-console-log-from-background-page
 * 2) This is supposed to be the "M" in "MVC" architecture
 */

// Initialize firebase:
var config = {
    apiKey: "AIzaSyAHfx_hQFBsTCgio8dCM-1qLw_PfSHH1N0",
    authDomain: "that-gform-validator.firebaseapp.com",
    databaseURL: "https://that-gform-validator.firebaseio.com",
    projectId: "that-gform-validator",
    storageBucket: "",
    messagingSenderId: "488962200929"
  };
  firebase.initializeApp(config);

// ================================================================================================
//                                  MAIN EVENT LISTENERS
// ================================================================================================

/* mObj             object containing config and data
 *                  {
 *               		action: "get_data_...",
 *               		dataObj: {
 *                          'key1': value1,
 *                          'key2': value2
 *                      },
 *                      noCallback: false
 *               	}
 * MessageSender    chrome object that holds information about message sender (ex: tab id)
 * sendResponse     callback function for message sender
 */
chrome.runtime.onMessage.addListener(function(mObj, MessageSender, sendResponse) {
    var action = mObj.action;
    var async = false;
    var noCallback = mObj.noCallback;

    // set default key:
    if (!mObj.key) mObj.key = 'key';

    // kill callback if noCallback flag is true
    if (noCallback) sendResponse = undefined;

    switch(action) {

        // gets data from chrome's local storage and returns to caller via sendResponse
        case 'get_data_from_chrome_storage_local':
            getValuesFromChromeLocalStorage(mObj, sendResponse);
            // async because uses promises
            async = true;
            break;

        // save data to chrome's local storage
        case 'store_data_to_chrome_storage_local':
            storeToChromeLocalStorage(mObj, sendResponse);
            // async because uses promises
            async = true;
            break;

        // clear data from keys in mObj.dataObj [clear means set to '']
        case 'clear_data_from_chrome_storage_local':
            clearDataFromChromeLocalStorage(mObj, sendResponse);
            // async because uses promises
            async = true;
            break;

        // ------ FIREBASE CALLS ------
        // gets validator object from firebase based on mObj.formCode
        case 'firebase_get_form_code_validator':
            FB_getFormCodeValidator(mObj, sendResponse, firebase);
            async = true;
            break;

        // TODO: save user to fb when last logged in
        // increment counters for button clicks at /button_clicks/*
        // case 'firebase_increment_button_count':
        //     FB_incrementClickCount(firebase, mObj);
        //     break;

        // send message back saying no response found:
        default:
            chrome.tabs.sendMessage(MessageSender.tab.id, {
                "message": 'message_not_handled_by_background_script'
            });
    }

    // returns true if asyncronous is needed
    if (async) return true;
});

// Listener tracks any changes to local storage in background's console 
// Got code here: https://developer.chrome.com/extensions/storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
	for (key in changes) {
		var storageChange = changes[key];
		console.log('Storage key "%s" in namespace "%s" changed. ' +
			'Old value was "%s", new value is: ',
			key,
			namespace,
			storageChange.oldValue,
			storageChange.newValue
		);
	}
});

// ==============================================================
//                      main functions
// ==============================================================

/**
 * Function gets chrome local data and sends data back to caller
 * 
 * Expects mObj to look like this:
 * {
 *      action: '...',
 *      keysObj: {
 *          'key1', '',
 *          'key2', '',
 *          ...
 *      }
 * }
 * 
 * @param {object} mObj message object with key data
 * @param {function} responseCallback callback function where gathered data will be sent
 */
function getValuesFromChromeLocalStorage(mObj, responseCallback) {
    // get object of keys from message object
    var keysObj = mObj.keysObj;

    getValuesFromStorage( keysObj )

    // responses is an array of objects {key:value}
    .then( function( responses ) {
        // turn responses into a serializable object
        var obj = Serialize_ArrayToObj(responses);

        responseCallback( obj );
    });

}

/**
 * Function stores data to chrome local storage based off config object (mObj)
 * 
 * @param {any} mObj message object holding data to store
 * @param {any} responseCallback callback function where success message is sent
 */
function storeToChromeLocalStorage(mObj, responseCallback) {
    var dataObj = mObj.dataObj;
    
    var storePromises = []; // used to store all key promises below

    // loop through keys in dataObj (turns obj into array of keys)
    // if dataObj is empty, loop will get skipped
    Object.keys( dataObj ).forEach( function(key, index) {
        // key: the name of the object key
        // index: the ordinal position of the key within the object
        var dataValue = dataObj[key]; 

		/* ============== AVAILABLE KEYS =============
				VALID_UNHCR   -	holds the on/off (true / false) value for each field
				VALID_PHONE
				VALID_DATES   - N/A
				VALID_APPT    - N/A

                CACHED_DATA   - Stores saved data in case RIPS timed out
                TIMEOUT_ERROR_FLAG  - flag that indicates if RIPS timed out recently
		*/
		switch (key) {
            // Recent update: all validation keys can just automatically store data, no need
            // for special handling (maybe in the future it will be needed)
			case 'VALID_UNHCR':
				// var validateUNHCR = dataValue;
				// storePromises.push(
				// 	saveValueToStorage('VALID_UNHCR', validateUNHCR)
				// );
                storePromises.push( saveValueToStorage(key, dataValue) );
				break;
            
            // store data directly to local storage
			case 'VALID_PHONE':
				storePromises.push( saveValueToStorage(key, dataValue) );
				break;

            // store data directly to local storage
            case 'CACHED_DATA':
                storePromises.push( saveValueToStorage(key, dataValue) );
                break;
            
            // store data directly to local storage
            case 'TIMEOUT_ERROR_FLAG':
                storePromises.push( saveValueToStorage(key, dataValue) );
                break;

            default:
                // log errored key to background console:
                console.log('unable to handle key when saving: ', key);
		}
    });

	Promise.all(storePromises)
    .then( function(responseMessageArr) {
        // if responseCallback isn't real, just console log the message
        if (responseCallback)
            responseCallback( responseMessageArr );
        else
            console.log('store messages: ',responseMessageArr);
    });
}

/**
 * Function clears all store data in chrome local storage for passed-in keys
 * 
 * Keys should be pased in serialized, like this:
 * {
 *      'CACHED_DATA': '',
 *      'VALID_PHONE': '',
 *      ... etc
 * }
 * 
 * @param {any} mObj message config object holding data keys object
 * @param {any} responseCallback callback function (may be undefined)
 */
function clearDataFromChromeLocalStorage(mObj, responseCallback) {
    var dataObj = mObj.dataObj;

    storeToChromeLocalStorage({
        dataObj: dataObj
    }, responseCallback);    
}

/**
 * Function gets form code validator from firebase, based on form code in the
 * message config object (mObj).
 * 
 * returned formCode (format below) is sent to responseCallback
 * {
 *  date: [
 *      {
 *          field_name: <question text>, - ex: Date of birth
 *          format: <future, past, regex>,
 *          include_today: <true / false> - if format includes today as valid
 *      }, ...
 *  ],
 *  email: [
 *      {
 *          field_name: <question text>, - ex: Email Address
 *          format: <regex?>
 *      }, ...
 *  ],
 *  phone: [
 *      {
 *          field_name: <question text>, - ex: Cell Phone
 *          formats: [ regex0, regex1, ... ]
 *      }, ...
 *  ],
 *  unhcr: [
 *      {
 *          field_name: <question text>, - ex: UNHCR Number
 *          formats: [ regex0, regex1, ... ]
 *      }, ...
 *  ]
 * }
 * 
 * @param {object} mObj - message config object 
 * @param {function} responseCallback - callback function after data is retrieved
 * @param {object} fb - firebase object 
 */
function FB_getFormCodeValidator(mObj, responseCallback, fb) {
    var formCode = mObj.formCode;
    if (!formCode) {
        responseCallback('');
    }
    
    else {
        var getCodePromise = fb.database()
            .ref('/form_codes/' + formCode)
            .once('value');

        getCodePromise.then(function(snapshot) {
            if (snapshot.val() === null)
                responseCallback('empty');
            else
                responseCallback(snapshot.val());
        });
    }
}

// ===============================================================
//                      helper functions
// ===============================================================

/**
 * Function turns an array into a serializable object
 * Purpose = must send chrome messages as objects, not arrays
 * Note: if arr[i] is undefined, doesn't add to obj!
 * Note2: if arr[i]['key'] is undefined or null, also doesn't add to obj!
 * TODO: think if note2 is good or bad...
 * 
 * @param {array} arr array of objects to convert to single serializable object
 * @param {object} [obj={}] object to add keys to
 * @param {number} [index=0] starting index
 * @returns serializable object made from array
 */
function Serialize_ArrayToObj(arr, obj = {}, index = 0) {
    if (arr.length < 1) {
        console.error('Array not populated');
        return {};
    }

    for (let i = index; i < arr.length; i++) {
        // var nextKey = key + i;
        // // skip undefined values in arr:
        // if ( arr[i] != undefined )
        //     obj[nextKey] = arr[i];

        // get data object from array
        var dataObj = arr[i];

        // check if dataObj is an empty object. if so, skip
        if ( Object.keys( dataObj ).length < 1 )
            continue;

        else {
            Object.keys( dataObj ).forEach( function(nextKey, index) {
                // get next value to serialize from dataObj
                var nextVal = dataObj[nextKey];

                // if nextVal is legit, push into obj
                if (nextVal !== undefined && nextVal !== null)
                    obj[nextKey] = nextVal;
            });
        }
            
    }

    return obj;
}

/**
 * Gets key array from mObj - keys are derived from mObj like this:
 * 'key'0: key0val,
 * 'key'1: key1val,
 * etc...
 * 
 * key0, key1, etc are keys where data is stored
 * 
 * @param {any} mObj 
 * @returns array of keys from mObj
 */
function Serialize_ObjToArray(mObj) {
    var keyArr = [];
    var index = 0;
    var key = mObj.key;
    
    // default key to 'key'
    if (!key) key = 'key';

    var nextKey = key + index;

    while ( mObj[nextKey] !== undefined ) {
        keyArr.push( mObj[nextKey] );

        index++;
        nextKey = key + index;
    }

    return keyArr;
}

/**
 * Function stores single key of data into chrome local storage
 * 
 * @param {any} key self-explanatory
 * @param {any} value self-explanatory
 * @returns Promise that resolves with success message
 */
function saveValueToStorage(key, value) {
    return new Promise( function(resolve, reject) {
		var obj = {};
		obj[key] = value;

		chrome.storage.local.set(obj, function() {
            // if value is empty, it's a data clear (not store)
            var message = '';

            if (value === '')
                message = 'Cleared: ' + key;
            else
                message = 'Saved: ' + key + ':' + value;

            // send message back to caller
			resolve(message);
		});
	});
}

/**
 * Function gets single key of data from chrome local storage
 * 
 * @param {string} key self-explanatory
 * @returns Promise with data from 1 key
 */
function getValFromStorage(key) {
	return new Promise( function( resolve, reject ) {
		chrome.storage.local.get( key, function( dataObj ) {

			// successful -> return data from database
			resolve( dataObj );
		});
	});
}

/**
 * Function gets multiple keys of data from chrome local storage
 * 
 * @param {object} keysObj object full of keys
 * @returns Promise array with data from all keys
 */
function getValuesFromStorage( keysObj ) {
    var promises = [];

    Object.keys( keysObj ).forEach( function( key, index ) {
        promises.push( getValFromStorage( key ) );
    });

	return Promise.all(promises);
}