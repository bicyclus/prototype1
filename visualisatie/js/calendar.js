//Globals
var progressCal; //Holds percentage for trips progressbar
var calData; //all calendar events
var myCal;
var allTrips;
var userNames;
var map;
var bikeLayer;
var elevator;
var infowindow;
var tripMapObj;
var curMapBounds;

function initCalendar(){
    $('#calProgress').hide();
    progressCal = BEGIN_PERCENT;
    $('#calProgress').show(ANIM_TIME);
    $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
    //Initfcts
    calendarFcts();
    initGMap();
    $('tripInfoClose').click(function(){$("#tripInfoDiv").hide('blind',ANIM_TIME)});
    progressCal = progressCal + 100/PROG_STEPS_CAL-BEGIN_PERCENT;
    $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
    checkProgressCal();
    var userFilter = '';
    $('#inputUserName').on('change', function() { //Userselect
        progressCal = 100/PROG_STEPS_CAL;
        $('#calProgressBar').animate({ width: 0+'%' },0);
        $('#calProgress').show(ANIM_TIME);
        $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
        hideEvents();
        $("#tripInfoDiv").hide('blind',ANIM_TIME);
        var userName = $(this).val();
        if (userName=="all"){
            userFilter = '';
        } else {
            userFilter = 'userID=' + userName;
        }
        var getUrl = "http://dali.cs.kuleuven.be:8080/qbike/trips?";
        $.ajax({
            url: getUrl + userFilter,
            jsonp: "callback",
            dataType: "jsonp",
            success: function(response){
                allTrips = response;
                fillCalendar(response);
            }
        });
    });
    //GetJson
    var getUrl = "http://dali.cs.kuleuven.be:8080/qbike/trips";
    $.ajax({
        url: getUrl + userFilter,
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response){
            allTrips = response;
            fillCalendar(response);
        }
    });
}

function fillCalendar(data){
    var calData = {};
    userNames = {};
    for (var i = 0; i < data.length; i++) {
        if (!(data[i].startTime === undefined)) { //startTime moet bestaan
            userNames[data[i].userID] = data[i].userID;
            var tripStart = new Date(data[i].startTime);
            var tripEnd = new Date(data[i].endTime);
            var curDate = (tripStart).toJSON().replace(/^(\d{4})\-(\d{2})\-(\d{2}).*$/, '$2-$3-$1');
            if (calData[curDate] === undefined) {
                calData[curDate] = '';
            }
            if (data[i].startTime == data[i].endTime){ //Trip op 1 dag
                var linkText = tripStart.getHours() + ':' + tripStart.getMinutes() + ' - ' + tripEnd.getHours() + ':' + tripEnd.getMinutes();
            } else {
                var linkText = tripStart.getDay()+'/'+tripStart.getMonth()+'/'+tripStart.getFullYear()+' '+tripStart.getHours()+':'+tripStart.getMinutes();

                if (!(data[i].endTime === undefined)) {
                    linkText = linkText+' - '+tripEnd.getDay()+'/'+tripEnd.getMonth()+'/'+tripEnd.getFullYear()+' '+tripEnd.getHours()+':'+tripEnd.getMinutes();
                }
            }
            calData[curDate] = calData[curDate] + '<a href="javascript:;" id='+data[i]._id+' class="tripEventLink">' +linkText + '</a>';
        }

    }
    if ($('#inputUserName option').length < 2){
        $.each( userNames, function( key, value ) {
            $('#inputUserName')
                .append($("<option></option>")
                    .attr("value",key)
                    .text(value));
        });
    }
    myCal.setNewData(calData);
    progressCal = progressCal + 100/PROG_STEPS_CAL;
    $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
    checkProgressCal();
}

function showTripInfo(tripId){
    //Clean
    $('.tripInfo').empty();
    if (!(tripMapObj === undefined)){
        tripMapObj.marker.setMap(null);
        tripMapObj.polyline.setMap(null);
    }
    //Find trip
    for (var i = 0; i < allTrips.length; i++) {
        if (allTrips[i]._id == tripId){
            var curTrip = allTrips[i];
            break;
        }
    }

    //Elap time
    var curTime = ((new Date(curTrip.endTime) - new Date(curTrip.startTime))/1000).toString().toHHMMSS();
    $('#tripInfoTime').text('Trip Time: '+curTime);
    //UserID
    $('#tripInfoUser').text('UserID: '+curTrip.userID);
    //Average Temperature
    var curTemperatureAverage=0;
    var counter=0;
    var sum_of_elements=0;
    for (i=0;i<curTrip.sensorData.length;i++){
        var curData=curTrip.sensorData[i];
        if ((curData.sensorID == "3") && !(curData.data[0] === undefined)) {
            counter+=1;
            console.log(curData.data[0].value);
            sum_of_elements+=parseInt(curData.data[0].value);

        }
    }
    curTemperatureAverage = sum_of_elements/counter;
    $('#tripInfoTemperature').text('Average Temperature: '+curTemperatureAverage);
    //Google map trip
    var coords;
    var bounds = new google.maps.LatLngBounds();
    if (!(curTrip.sensorData === undefined)) {
        if (tripMapObj === undefined){
            tripMapObj = {}; //Create tripMap object
        }
        tripMapObj.id = curTrip._id;
        tripMapObj.coords = [];

        for (a = 0; a < curTrip.sensorData.length; a++) { //Iterate over all sensorData
            var sensorData = curTrip.sensorData[a];
            if ((sensorData.sensorID == "1") && !(sensorData.data === undefined)) {
                for (b = 0; b < sensorData.data.length; b++) { //Iterate over all data
                    var coord = new google.maps.LatLng(sensorData.data[b].coordinates[0], sensorData.data[b].coordinates[1]);
                    if (!(isNaN(coord.lat()) || isNaN(coord.lng()))) {
                        if (!coord.equals(tripMapObj.coords[tripMapObj.coords.length - 1])) {
                            tripMapObj.coords.push(coord);
                            bounds.extend(coord);
                        }
                    }
                }
            }
        }
        if (tripMapObj.coords.length > 1) {
            tripMapObj.marker = new google.maps.Marker({ //Marker op begincoördinaat
                position: tripMapObj.coords[0],
                map: map,
                title: tripMapObj.id
            });
            //Random kleur van ID
            var stringHexNumber = (parseInt(parseInt(tripMapObj.id, 36).toExponential().slice(2,-5), 10) & 0xFFFFFF).toString(16).toUpperCase(); //http://stackoverflow.com/questions/17845584/converting-a-random-string-into-a-hex-colour
            var pathOptions = {
                path: tripMapObj.coords,
                strokeColor: '#' + ('000000' + stringHexNumber).slice(-6), //Lengte aanpassen
                opacity: 0.4,
                map: map
            };
            tripMapObj.polyline = new google.maps.Polyline(pathOptions);
            tripMapObj.polyline.myId = curTrip._id;
            google.maps.event.addListener(tripMapObj.polyline, 'click', function (event) { //Infowindow bij klikken op polyline
                infowindow.setPosition(event.latLng);
                infowindow.setContent(this.myId);
                infowindow.open(map);
            });
            curMapBounds = bounds;
            //elev(tripMapObj.coords);
        }
    }

    //Google  Elev

    $('#tripInfoDiv').show('blind',ANIM_TIME,function(){
        google.maps.event.trigger(map, 'resize');
        map.fitBounds(curMapBounds);
    });
}

function initGMap(){
    map = new google.maps.Map($("#tripInfoMap")[0]);
    bikeLayer = new google.maps.BicyclingLayer(); //Show bike paths
    bikeLayer.setMap(map);
    elevator = new google.maps.ElevationService();
    infowindow = new google.maps.InfoWindow();
}

function calendarFcts() {
    var transEndEventNames = {
            'WebkitTransition' : 'webkitTransitionEnd',
            'MozTransition' : 'transitionend',
            'OTransition' : 'oTransitionEnd',
            'msTransition' : 'MSTransitionEnd',
            'transition' : 'transitionend'
        };
        transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ];
        $wrapper = $( '#custom-inner' );
        $calendar = $( '#calendar' );
        myCal = $calendar.calendario( {
            onDayClick : function( $el, $content, dateProperties ) {
                if( $content.length > 0 ) {
                    showEvents( $content, dateProperties );
                }
            },
            //caldata : codropsEvents,
            displayWeekAbbr : true
        } );
        $month = $( '#custom-month' ).html( myCal.getMonthName() );
        $year = $( '#custom-year' ).html( myCal.getYear() );

    $( '#custom-next' ).on( 'click', function() {
        myCal.gotoNextMonth( updateMonthYear );
    } );
    $( '#custom-prev' ).on( 'click', function() {
        myCal.gotoPreviousMonth( updateMonthYear );
    } );
    function updateMonthYear() {
        $month.html( myCal.getMonthName() );
        $year.html( myCal.getYear() );
    }



    $("body").on("click",".tripEventLink",function(){
        showTripInfo($(this).attr('id'));
    });
}

function showEvents( $contentEl, dateProperties ) {
    hideEvents();

    var $events = $( '<div id="custom-content-reveal" class="custom-content-reveal"><h4>Trips for ' + dateProperties.day +'/'+ dateProperties.month + '/' + dateProperties.year + '</h4></div>' );
    var $close = $( '<span class="custom-content-close"></span>' ).on( 'click', hideEvents );

    $events.append( $contentEl.html() , $close ).insertAfter( $wrapper );

    setTimeout( function() {
        $events.css( 'top', '0%' );
    }, 25 );

}
function hideEvents() {

    var $events = $( '#custom-content-reveal' );
    if( $events.length > 0 ) {
        $events.css( 'top', '100%' );
        Modernizr.csstransitions ? $events.on( transEndEventName, function() { $( this ).remove(); } ) : $events.remove();
    }
}

function checkProgressCal(){
    if (progressCal >= 99.9) {
        $('#calProgressBar').animate({ width: '100%' },0);
        setTimeout($('#calProgress').hide('blind',2*ANIM_TIME),2*ANIM_TIME); //doet progressbar verdwijnen
    }
}

$(document).ready(initCalendar);