//Globals
var progressCal; //Holds percentage for trips progressbar
var progressSingle; //Holds percentage for trips progressbar
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
var chartAccObj;
var chartPosObj;
var chartTempObj;
var chartElevObj;
var chartSpeedObj;

function initCalendar(){
    $('#calProgress').hide();
    $('#singleProgress').hide();
    $('#tripInfoDiv').hide();
    $('.tripInfoExtra').hide();
    progressCal = BEGIN_PERCENT;
    $('#calProgress').show(ANIM_TIME);
    $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
    //Initfcts
    calendarFcts();
    initGMap();
    $('#tripInfoClose').click(function(){$("#tripInfoDiv").hide('blind',ANIM_TIME)});
    $('#tripInfoHeight').click(function(){
        $("#tripInfoElev").toggle();
        drawChartObj(chartElevObj);
        $("#heightCaret").toggleClass("fa-caret-square-o-right");
        $("#heightCaret").toggleClass("fa-caret-square-o-down");
    });
    $('#tripInfoTemperature').click(function(){
        $("#tripInfoTemp").toggle();
        drawChartObj(chartTempObj);
        $("#tempCaret").toggleClass("fa-caret-square-o-right");
        $("#tempCaret").toggleClass("fa-caret-square-o-down");
    });
    $('#tripInfoTime').click(function(){
        $("#tripInfoTimeInfo").toggle();
        $("#timeCaret").toggleClass("fa-caret-square-o-right");
        $("#timeCaret").toggleClass("fa-caret-square-o-down");
    });
    $('#tripInfoAccel').click(function(){
        $("#tripInfoAccelAcc").toggle();
        $("#tripInfoAccelPos").toggle();
        drawChartObj(chartAccObj);
        drawChartObj(chartPosObj);
        $("#accelCaret").toggleClass("fa-caret-square-o-right");
        $("#accelCaret").toggleClass("fa-caret-square-o-down");
    });
    $('#tripInfoAverageSpeed').click(function(){
        $("#tripInfoSpeed").toggle();
        drawChartObj(chartSpeedObj);
        $("#speedCaret").toggleClass("fa-caret-square-o-right");
        $("#speedCaret").toggleClass("fa-caret-square-o-down");
    });
    progressCal = progressCal + 100/PROG_STEPS_CAL-BEGIN_PERCENT;
    checkProgressCal();
    var userFilter = '';
    $('#inputUserName').on('change', function() { //Userselect
        progressCal = 100/PROG_STEPS_CAL;
        $('#calProgressBar').animate({ width: '0%' },0);
        $('#calProgress').show(ANIM_TIME);
        checkProgressCal();
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
    calData = {};
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
            if (tripStart.getDate() == tripEnd.getDate()){ //Trip op 1 dag
                var linkText = addZero(tripStart.getHours()) + ':' + addZero(tripStart.getMinutes()) + ' - ' + addZero(tripEnd.getHours()) + ':' + addZero(tripEnd.getMinutes());
            } else {
                var linkText = addZero(tripStart.getDate())+'/'+addZero(tripStart.getMonth())+'/'+addZero(tripStart.getFullYear())+' '+addZero(tripStart.getHours())+':'+addZero(tripStart.getMinutes());

                if (!(data[i].endTime === undefined)) {
                    linkText = linkText+' - '+addZero(tripEnd.getDate())+'/'+addZero(tripEnd.getMonth())+'/'+addZero(tripEnd.getFullYear())+' '+addZero(tripEnd.getHours())+':'+addZero(tripEnd.getMinutes());
                }
            }
            if (data[i].meta == undefined){
                linkText += ' Real Time';
            }
            calData[curDate] = calData[curDate] + '<a href="#singleProgress" id='+data[i]._id+' class="tripEventLink">' + linkText + '</a>';
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
    checkProgressCal();
}

function showTripInfo(tripId){
    //Clean
    $('.tripInfo').empty();
    progressSingle = BEGIN_PERCENT;
    $('#singleProgress').show(ANIM_TIME);
    $('#singleProgressBar').animate({ width: progressSingle.toString()+'%' },ANIM_TIME);
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

    progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP-BEGIN_PERCENT;
    checkProgressSingle();

    //Elap time
    var tripStart = new Date(curTrip.startTime);
    var tripEnd = new Date(curTrip.endTime);
    var curTime = ((tripEnd - tripStart)/1000).toString().toHHMMSS();
    $('#tripInfoTime').append('<i class="fa fa-caret-square-o-right" id="timeCaret">&nbsp;</i><i class="fa fa-clock-o">&nbsp;</i>'+curTime);
    if (tripStart.getDate() == tripEnd.getDate()){ //Trip op 1 dag
        var timeText = addZero(tripStart.getHours()) + ':' + addZero(tripStart.getMinutes()) + ' - ' + addZero(tripEnd.getHours()) + ':' + addZero(tripEnd.getMinutes());
    } else {
        var timeText = addZero(tripStart.getDate())+'/'+addZero(tripStart.getMonth())+'/'+addZero(tripStart.getFullYear())+' '+addZero(tripStart.getHours())+':'+addZero(tripStart.getMinutes());

        if (!(data[i].endTime === undefined)) {
            timeText = timeText+' - '+addZero(tripEnd.getDate())+'/'+addZero(tripEnd.getMonth())+'/'+addZero(tripEnd.getFullYear())+' '+addZero(tripEnd.getHours())+':'+addZero(tripEnd.getMinutes());
        }
    }
    $("#tripInfoTimeInfo").append(timeText);
    //UserID
    $('#tripInfoUser').append('<i class="fa fa-square-o">&nbsp;</i><i class="fa fa-user">&nbsp;</i>'+curTrip.userID);
    //Google map trip
    var coords;
    var bounds = new google.maps.LatLngBounds();
    if (!(curTrip.sensorData === undefined)) {
        if (tripMapObj === undefined){
            tripMapObj = {}; //Create tripMap object
        }
        tripMapObj.id = curTrip._id;
        tripMapObj.coords = [];
        var accData = [];
        var posData = [];
        var tempData = [];
        var drawCharts = [];
        var heartbeatData = [];
        var counter_temperature=0;
        var counter_humidity =0;
        var counter_heartbeat = 0;
        var sum_of_elements_temperature=0;
        var sum_of_elements_humidity=0;
        var sum_of_elements_heartbeat=0;
        var prevGps = {};
        var speedData = [];
        var totaldist = 0;
        var curSpeedAverage = 0;


        for (a = 0; a < curTrip.sensorData.length; a++) { //Iterate over all sensorData
            var sensorData = curTrip.sensorData[a];
            switch (sensorData.sensorID){
                case 1: //GPS + Speed
                    if (!(sensorData.data === undefined)) {
                        var coord = new google.maps.LatLng(sensorData.data[0].coordinates[0], sensorData.data[0].coordinates[1]);
                        if (!(isNaN(coord.lat()) || isNaN(coord.lng()))) {
                            if (!coord.equals(tripMapObj.coords[tripMapObj.coords.length - 1])) {
                                tripMapObj.coords.push(coord);
                                bounds.extend(coord);
                            }
                        }
                        if (!(sensorData.data[0].speed === undefined)){
                            var timestampDate = new Date(sensorData.timestamp);
                            speedData.push([timestampDate, sensorData.data[0].speed[0]]);
                            //var distint = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(sensorData.data[0].coordinates[0], sensorData.data[0].coordinates[1]), new google.maps.LatLng(sensorData.data[0].coordinates[0], sensorData.data[0].coordinates[1]));
                            //totaldist += distint;
                            curSpeedAverage += sensorData.data[0].speed[0];
                        }
                        if (sensorData.data[0].speed === undefined){
                            if (sensorData.data[0].unit == 'dmc') {
                                sensorData.data[0].coordinates[0] = sensorData.data[0].coordinates[0] / 100;
                                sensorData.data[0].coordinates[1] = sensorData.data[0].coordinates[1] / 100;
                            }
                            if ($.isEmptyObject(prevGps)) {
                                prevGps = sensorData;
                            } else {
                                var timestampDate = new Date(prevGps.timestamp);
                                var distint = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(prevGps.data[0].coordinates[0], prevGps.data[0].coordinates[1]), new google.maps.LatLng(sensorData.data[0].coordinates[0], sensorData.data[0].coordinates[1]));
                                var timedif = ((new Date(sensorData.timestamp) - new Date(prevGps.timestamp)) / 1000);
                                var speedint = distint / timedif * 3.6;
                                speedData.push([timestampDate, speedint]);
                                totaldist += distint;
                                curSpeedAverage += speedint;
                                prevGps = sensorData;
                            }
                        }
                    }
                    break;
                case 2: //Light
                    break;
                case 3: //Temperature
                    if (!(sensorData.data === undefined) && !(sensorData.data[0] === undefined)) {
                        if (!(sensorData.data[0].value === undefined)) {
                            var timestampDate = new Date(sensorData.timestamp);
                            tempData.push([timestampDate,sensorData.data[0].value[0]]);
                            counter_temperature+=1;
                            sum_of_elements_temperature+=parseInt(sensorData.data[0].value);
                        }
                    }
                    break;
                case 4: //Humidity
                    if (!(sensorData.data[0] === undefined)) {
                        counter_humidity+=1;
                        sum_of_elements_humidity+=parseInt(sensorData.data[0].value);
                    }
                    break;
                case 5: //Accelerometer
                    if (!(sensorData.data === undefined) && !(sensorData.data[0] === undefined)) {
                        if (!(sensorData.data[0].acceleration === undefined)) {
                            var timestampDate = new Date(sensorData.timestamp);
                            accData.push([timestampDate,sensorData.data[0].acceleration[0].x,sensorData.data[0].acceleration[0].y,sensorData.data[0].acceleration[0].z]);
                            posData.push([timestampDate,sensorData.data[0].orientation[0].mx,sensorData.data[0].orientation[0].my,sensorData.data[0].orientation[0].mz]);
                        }
                    }
                    break;
                case 6: //Air quality
                    break;
                case 7: //Noise
                    break;
                case 8: //Camera
                    break;
                case 9: //Heartbeat
                    if (!(sensorData.data === undefined) && !(sensorData.data[0] === undefined)){
                        if (!(sensorData.data[0].value === undefined)){
                            counter_heartbeat +=1;
                            sum_of_elements_heartbeat+=parseInt(sensorData.data[0].value);
                            heartbeatData.push([sensorData.data[0].value[0]]);
                        }
                    }
                    break;
                case 10: //Barometer
                    break;
            }
        }
        // Weergeven van "Average Temperature", "Average Humidity" en "Heart rate Average"
        curTemperatureAverage = Math.round(sum_of_elements_temperature/counter_temperature);
        $('#tripInfoTemperature').append('<i class="fa fa-caret-square-o-right" id="tempCaret">&nbsp;</i><i class="wi wi-thermometer">&nbsp;</i>'+curTemperatureAverage+' °C');
        curHumidityAverage = Math.round(sum_of_elements_humidity/counter_humidity);
        curHeartbeatAverage = Math.round(sum_of_elements_heartbeat/counter_heartbeat);
        totaldist = Math.round((totaldist/1000)*100)/100;
        $('#tripInfoHeartbeat').text('Average Heartbeat: '+curHeartbeatAverage+ 'beats per minute');
        $('#tripInfoHumidity').append('<i class="fa fa-square-o">&nbsp;</i><i class="wi wi-sprinkles">&nbsp;</i>'+curHumidityAverage+ ' %');
        $('#tripInfoTotaldist').append('<i class="fa fa-square-o">&nbsp;</i>&nbsp;</i>'+totaldist+ ' km');


        // Speed (GPS)
        curSpeedAverage = Math.round(curSpeedAverage/speedData.length * 100)/100;
        $('#tripInfoAverageSpeed').append('<i class="fa fa-caret-square-o-right" id="speedCaret">&nbsp;</i><i class="fa fa-curTmeter">&nbsp;</i>' +curSpeedAverage+ ' km/h');

        //GPS
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
        }
        progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP;
        checkProgressSingle();
        //Accel
        $('#tripInfoAccel').append('<i class="fa fa-caret-square-o-right" id="accelCaret">&nbsp;</i>'+'Bouncy/Smooth');
        if (accData.length > 0) {
            accData.sort(SortByTimestamp);
            options = {'title':'Accelerometer acceleration: '+tripId,colors:['red','green','blue'],curveType:'function',backgroundColor:'#f5f5f5'};
            var chartData = new google.visualization.DataTable();
            chartData.addColumn('string', 'Time');
            chartData.addColumn('number', 'X');
            chartData.addColumn('number', 'Y');
            chartData.addColumn('number', 'Z');
            for (var b = 0; b < accData.length; b++) {
                chartData.addRow(['', accData[b][1],accData[b][2],accData[b][3]]);
            }

            var chartAccel = new google.visualization.LineChart($('#tripInfoAccelAcc')[0]); //Chart aanmaken in div
            chartAccObj = [chartAccel,chartData,options];
        }
        progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP;
        checkProgressSingle();
        if (posData.length > 0) {
            posData.sort(SortByTimestamp);
            options = {'title':'Accelerometer orientation: '+tripId,colors:['red','green','blue'],curveType:'function',backgroundColor:'#f5f5f5'};
            var chartData = new google.visualization.DataTable();
            chartData.addColumn('string', 'Time');
            chartData.addColumn('number', 'X');
            chartData.addColumn('number', 'Y');
            chartData.addColumn('number', 'Z');
            for (var b = 0; b < posData.length; b++) {
                chartData.addRow(['', posData[b][1],posData[b][2],posData[b][3]]);
            }

            var chartPos = new google.visualization.LineChart($('#tripInfoAccelPos')[0]); //Chart aanmaken in div
            chartPosObj = [chartPos,chartData,options];
        }
        progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP;
        checkProgressSingle();
        //Temp
        if (tempData.length > 0) {
            tempData.sort(SortByTimestamp);
            options = {'title': 'Temperature: ' + tripId, colors: ['red'], curveType: 'function', backgroundColor: '#f5f5f5'};
            var chartData = new google.visualization.DataTable();
            chartData.addColumn('string', 'Time');
            chartData.addColumn('number', 'Temperature');
            for (var b = 0; b < tempData.length; b++) {
                chartData.addRow(['', tempData[b][1]]);
            }

            var chartTemp = new google.visualization.LineChart($('#tripInfoTemp')[0]); //Chart aanmaken in div
            chartTempObj = [chartTemp,chartData,options];
        }
        progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP;
        checkProgressSingle();
        // Speed
        if (speedData.length > 0) {
            speedData.sort(SortByTimestamp);
            options = {'title': 'Speed: ' + tripId, colors: ['Yellow'], curveType: 'function', backgroundColor: '#f5f5f5'};
            var chartData = new google.visualization.DataTable();
            chartData.addColumn('string', 'Time');
            chartData.addColumn('number', 'Speed');
            for (var b = 0; b < speedData.length; b++) {
                chartData.addRow(['', speedData[b][1]]);
            }

            var chartSpeed = new google.visualization.LineChart($('#tripInfoSpeed')[0]); //Chart aanmaken in div
            chartSpeedObj = [chartSpeed,chartData,options];
        }
        progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP;
        checkProgressSingle();
        //Google  Elev
        elev_and_plot(tripMapObj.coords,tripId);
    }
}

function elev_and_plot(pathCoords,elevId){ //Plot elevation graphs, attention: async
    var pathRequest = {
        'path': pathCoords,
        'samples': ELEV_SAMPLE
    };
    elevator.getElevationAlongPath(pathRequest,
        function(results, status) {
            if (status != google.maps.ElevationStatus.OK) { // google houdt request tegen
                console.log(status);
                if (status == google.maps.ElevationStatus.OVER_QUERY_LIMIT) { //Herproberen als we over de limiet zitten.
                    console.log("Retrying query of length: " + pathCoords.length + ". Try #" + retries);
                    if (retries < RETRY_COUNT) {
                        retries = retries + 1;
                        setTimeout(function(){elev(pathCoords);}, 2000+Math.floor((Math.random() * 500)));
                    } else {
                        retries = retries + 1;
                        if (retries = RETRY_COUNT) {
                            alert("Google elevation query error: Not all elevations  will be plotted.");
                        }
                        progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP;
                        checkProgressSingle();
                    }
                }
            } else {
                var elevations = results;
                var elevationPath = [];
                var data = new google.visualization.DataTable();
                data.addColumn('string', 'Sample');
                data.addColumn('number', 'Elevation');

                var up = 0;
                var down = 0;
                for (var i = 0; i < elevations.length; i++) {
                    elevationPath.push(elevations[i].location);
                    data.addRow(['', elevations[i].elevation]);
                    //analyze up/downhill
                    if (i>0){
                        if (elevations[i].elevation > elevations[i-1].elevation){
                            up +=  (elevations[i].elevation-elevations[i-1].elevation);
                        }else{
                            down +=  -(elevations[i].elevation-elevations[i-1].elevation);
                        }
                    }
                }
                $("#tripInfoHeight").append('<i class="fa fa-caret-square-o-right" id="heightCaret">&nbsp;</i><i class="fa fa-arrow-up">&nbsp;</i>'+Math.round(up)+' m '+'<i class="fa fa-arrow-down">&nbsp;</i>'+Math.round(down)+' m')
                //Chart
                chartElev = new google.visualization.ColumnChart($('#tripInfoElev')[0]);
                $('#tripInfoDiv').show('blind',ANIM_TIME,function(){
                    //Callback
                    google.maps.event.trigger(map, 'resize');
                    map.fitBounds(curMapBounds);
                    options = {legend: 'none',titleY: 'Elevation (m)',title: elevId,backgroundColor:'#f5f5f5'};
                    chartElevObj = [chartElev,data,options];
                    drawChartObj(chartSpeedObj);
                });
                progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP;
                checkProgressSingle();
            }
        }
    );
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
        $month = $( '#custom-month' ).html('<i class="fa fa-calendar">&nbsp;</i>'+myCal.getMonthName() );
        $year = $( '#custom-year' ).html( myCal.getYear() );

    $( '#custom-next' ).on( 'click', function() {
        myCal.gotoNextMonth( updateMonthYear );
    } );
    $( '#custom-prev' ).on( 'click', function() {
        myCal.gotoPreviousMonth( updateMonthYear );
    } );
    function updateMonthYear() {
        $month.html('<i class="fa fa-calendar">&nbsp;</i>'+myCal.getMonthName() );
        $year.html( myCal.getYear() );
    }



    $("body").on("click",".tripEventLink",function(){
        showTripInfo($(this).attr('id'));
    });
}

function showEvents( $contentEl, dateProperties ) {
    hideEvents();

    var $events = $( '<div id="custom-content-reveal" class="custom-content-reveal"><h4>Trips for ' + dateProperties.day +'/'+ dateProperties.month + '/' + dateProperties.year + '</h4></div>' );
    var $close = $( '<span class="custom-content-close"><i class="fa fa-times"></i></span>' ).on( 'click', hideEvents );

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
    $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
    if (progressCal >= 99.9) {
        $('#calProgressBar').animate({ width: '100%' },0,function(){
            setTimeout($('#calProgress').hide('blind',2*ANIM_TIME),2*ANIM_TIME); //doet progressbar verdwijnen
        });
    }
}

function checkProgressSingle(){
    $('#singleProgressBar').animate({ width: progressSingle.toString()+'%' },ANIM_TIME);
    if (progressSingle >= 99.9) {
        $('#singleProgressBar').animate({ width: '100%' },0,function(){
            setTimeout($('#singleProgress').hide('blind',2*ANIM_TIME),2*ANIM_TIME);
        });
    }
}

function addZero(i) { //Voor data en uren enzo
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function drawChartObj(chartObj) {
    chartObj[0].draw(chartObj[1],chartObj[2]);
}

$(document).ready(initCalendar);