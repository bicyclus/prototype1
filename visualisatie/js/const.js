//Constanten
var PROG_STEPS_TRIPS = 7;
//- Get JSON
//- Append
//- Elapsed chart
//- Accel chart
//- Temperature chart
//- Humidity chart
//- Elevation plots
var PROG_STEPS_CAL = 2;
//- Initfcts
//- Fill Calendar
var PROG_STEPS_SINGLETRIP = 6;
//- Find trip
//- GMap + Iterate
//- GElev
//- Accel acc
//- Temp
//- Speed
var BEGIN_PERCENT = 1.618;
var ANIM_TIME = 200;
var ELEV_SAMPLE = 128;//2-512
var RETRY_COUNT = 50;
var GET_URL_DEV = "http://dali.cs.kuleuven.be:8080/qbike/trips?";
var GET_URL_PAGE = "http://dali.cs.kuleuven.be:8080/qbike/trips?page=123";
var GET_URL = "http://dali.cs.kuleuven.be:8443/qbike/trips?";
var AJAX_TIMEOUT = 100*1000; //100s...
var MAX_COMPARE = 3;
var SPEED_ROUND = 2;
var TEMP_DIFF = 2;
