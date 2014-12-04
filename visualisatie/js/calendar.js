//Globals
var progressCal; //Holds percentage for trips progressbar
var progressSingle; //Holds percentage for trips progressbar
var calData; //all calendar events
var myCal;
var allTrips;
var map;
var bikeLayer;
var elevator;
var infowindow;
var tripMapObj;
var curMapBounds;
var chartAccObj;
var chartTempObj;
var chartElevObj;
var chartSpeedObj;
var userNames;
var showId;

function initCalendar(){
    $('#calProgress').hide();
    $('#singleProgress').hide();
    $('#tripInfoContainer').hide();
    $('.tripInfoExtra').hide();
    $('.tripInfoDiv').hide();
    progressCal = BEGIN_PERCENT;
    $('#calProgress').show(ANIM_TIME);
    $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
    //Initfcts
    calendarFcts();
    initGMap();
    $('#tripInfoClose').click(function(){
        $(".clickedTrip").removeClass('clickedTrip');
        $(".fa-check-square-o").remove();
        $("#tripInfoContainer").hide('blind',ANIM_TIME);
        showId = [];
    });
    $("[id^='tripInfoHeight']").click(function(){toggleInfo('tripInfoElev',chartElevObj,'heightCaret');});
    $("[id^='tripInfoTemperature']").click(function(){toggleInfo('tripInfoTemp',chartTempObj,'tempCaret');});
    $("[id^='tripInfoAccel']").click(function(){toggleInfo('tripInfoAccData',chartAccObj,'accelCaret');});
    $("[id^='tripInfoAverageSpeed']").click(function(){toggleInfo('tripInfoSpeed',chartSpeedObj,'speedCaret');});
    progressCal = progressCal + 100/PROG_STEPS_CAL-BEGIN_PERCENT;
    checkProgressCal();
    showId = [];
    userNames = {};
    var userFilter = '';
    getJson("");
    $('#inputUserName').on('change', function() { //Userselect
        progressCal = 100/PROG_STEPS_CAL;
        $('#calProgressBar').animate({ width: '0%' },0);
        $('#calProgress').show(ANIM_TIME);
        checkProgressCal();
        hideEvents();
        $("#tripInfoContainer").hide('blind',ANIM_TIME);
        var userName = $(this).val();
        if (userName=="all"){
            userFilter = '';
        } else {
            userFilter = '&userID=' + userName;
        }
        getJson(userFilter);
    });
}

function getJson(url){
    var urlParam = getQueryVariable('getUrl');
    if (urlParam == "DevPage"){
        var getUrl = GET_URL_PAGE;
        $("#devPageLink").css("text-decoration","underline");
    } else if (urlParam == "Dev") {
        var getUrl = GET_URL_DEV;
        $("#devLink").css("text-decoration","underline");
    } else {
        var getUrl = GET_URL;
        $("#prodLink").css("text-decoration","underline");
    }
    $.ajax({
        url: getUrl + url,
        jsonp: "callback",
        timeout: AJAX_TIMEOUT,
        dataType: "jsonp"
    }).done(function(data, textStatus, jqXHR){
        allTrips = data;
        fillCalendar(data);
    }).fail(function(jqXHR, textStatus, errorThrown){
        alert('AJAX Error, please check console. The server is probably down.');
        console.log("--- AJAX Error ---");
        console.log(textStatus);
        console.log(errorThrown);
        $('#calProgressBar').addClass("progress-bar-danger");
    });
}

function fillCalendar(data){
    calData = {};
    data.sort(SortDataByTime);
    for (var i = 0; i < data.length; i++) {
        tripCal(data[i]);
    }
    if ($('#inputUserName').val() == "all"){
        $('#inputUserName').empty().append('<option value="all" selected>All Users</option>');
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

function tripCal(trip){
    if (!(trip.startTime === undefined)) { //startTime moet bestaan
        userNames[trip.userID] = trip.userID;
        var tripStart = new Date(trip.startTime);
        var tripEnd = new Date(trip.endTime);
        var curDate = (tripStart).toJSON().replace(/^(\d{4})\-(\d{2})\-(\d{2}).*$/, '$2-$3-$1');
        if (calData[curDate] === undefined) {
            calData[curDate] = '';
        }
        if (tripStart.getDate() == tripEnd.getDate()){ //Trip op 1 dag
            var linkText = addZero(tripStart.getHours()) + ':' + addZero(tripStart.getMinutes()) + ' - ' + addZero(tripEnd.getHours()) + ':' + addZero(tripEnd.getMinutes());
        } else {
            var linkText = addZero(tripStart.getDate())+'/'+addZero(tripStart.getMonth())+'/'+addZero(tripStart.getFullYear())+' '+addZero(tripStart.getHours())+':'+addZero(tripStart.getMinutes());

            if (!(trip.endTime === undefined)) {
                linkText = linkText+' - '+addZero(tripEnd.getDate())+'/'+addZero(tripEnd.getMonth())+'/'+addZero(tripEnd.getFullYear())+' '+addZero(tripEnd.getHours())+':'+addZero(tripEnd.getMinutes());
            }
        }
        calData[curDate] = calData[curDate] + '<a href="#custom-inner" id='+trip._id+' class="tripEventLink">'+ linkText + '</a>';//href="#tripInfoContainer"
    }
}

function showTripInfo(){
    //Clean
    $(".tripInfo").empty();
    $(".tripInfoDiv").hide();
    progressSingle = BEGIN_PERCENT;
    $("#singleProgressBar").animate({ width: progressSingle.toString()+'%' },0);
    $("#singleProgress").show(ANIM_TIME);
    $("#singleProgressBar").animate({ width: progressSingle.toString()+'%' },ANIM_TIME);
    for (var i = 0; i < tripMapObj.length; i++) {
        tripMapObj[i].markerStart.setMap(null);
        tripMapObj[i].markerEnd.setMap(null);
        tripMapObj[i].polyline.setMap(null);
    }
    for (var i = 0; i < MAX_COMPARE; i++) {
        $("#tripInfoElev"+i).hide();
        $("#heightCaret"+i).addClass("fa-caret-square-o-right");
        $("#heightCaret"+i).removeClass("fa-caret-square-o-down");
        $("#tripInfoTemp"+i).hide();
        $("#tempCaret"+i).addClass("fa-caret-square-o-right");
        $("#tempCaret"+i).removeClass("fa-caret-square-o-down");
        $("#tripInfoAccData"+i).hide();
        $("#accelCaret"+i).addClass("fa-caret-square-o-right");
        $("#accelCaret"+i).removeClass("fa-caret-square-o-down");
        $("#tripInfoSpeed"+i).hide();
        $("#speedCaret"+i).addClass("fa-caret-square-o-right");
        $("#speedCaret"+i).removeClass("fa-caret-square-o-down");
    }
    $(".tripInfoDiv").css("width",100/showId.length+'%');
    //Find trip
    var curTrip = [];
    for (var i = 0; i < allTrips.length; i++) {
        for (var j = 0; j < showId.length; j++) {
            if (allTrips[i]._id == showId[j]){
                curTrip[j] = allTrips[i];
            }
        }
    }
    progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP-BEGIN_PERCENT;
    checkProgressSingle();
    var bounds = new google.maps.LatLngBounds();
    chartAccObj = [];
    chartElevObj = [];
    chartSpeedObj = [];
    chartTempObj = [];
    for (var i = 0; i < curTrip.length; i++) {
        //Elap time
        var tripStart = new Date(curTrip[i].startTime);
        var tripEnd = new Date(curTrip[i].endTime);
        var curTime = ((tripEnd - tripStart) / 1000).toString().toHHMMSS();
        $('#tripInfoElap'+i).append('<i class="fa fa-square-o">&nbsp;</i>&nbsp;<i class="fa fa-clock-o">&nbsp;</i>' + curTime);
        if (tripStart.getDate() == tripEnd.getDate()) { //Trip op 1 dag
            var timeText = addZero(tripStart.getHours()) + ':' + addZero(tripStart.getMinutes()) + ' - ' + addZero(tripEnd.getHours()) + ':' + addZero(tripEnd.getMinutes());
        } else {
            var timeText = addZero(tripStart.getDate()) + '/' + addZero(tripStart.getMonth()) + '/' + addZero(tripStart.getFullYear()) + ' ' + addZero(tripStart.getHours()) + ':' + addZero(tripStart.getMinutes());
            if (!(data[i].endTime === undefined)) {
                timeText = timeText + ' - ' + addZero(tripEnd.getDate()) + '/' + addZero(tripEnd.getMonth()) + '/' + addZero(tripEnd.getFullYear()) + ' ' + addZero(tripEnd.getHours()) + ':' + addZero(tripEnd.getMinutes());
            }
        }
        $("#tripInfoTime"+i).append(timeText);
        //UserID
        $('#tripInfoUser'+i).append('<i class="fa fa-square-o">&nbsp;</i><i class="fa fa-user">&nbsp;</i>' + curTrip[i].userID);
        //Google map trip
        var coords;
        if (!(curTrip[i].sensorData === undefined)) {
            if (tripMapObj[i] === undefined) {
                tripMapObj[i] = {}; //Create tripMap object
            }
            tripMapObj[i].id = curTrip[i]._id;
            tripMapObj[i].coords = [];
            var accData = [];
            var tempData = [];
            var drawCharts = [];
            var heartbeatData = [];
            var counter_temperature = 0;
            var counter_humidity = 0;
            var counter_heartbeat = 0;
            var sum_of_elements_temperature = 0;
            var sum_of_elements_humidity = 0;
            var sum_of_elements_heartbeat = 0;
            var prevGps = {};
            var speedData = [];
            var totaldist = 0;
            var curSpeedAverage = 0;

            for (a = 0; a < curTrip[i].sensorData.length; a++) { //Iterate over all sensorData
                var sensorData = curTrip[i].sensorData[a];
                var timestampDate = new Date(sensorData.timestamp);
                switch (sensorData.sensorID) {
                    case 1: //GPS + Speed
                        if (!(sensorData.data === undefined)) {
                            var coord = new google.maps.LatLng(sensorData.data[0].coordinates[0], sensorData.data[0].coordinates[1]);
                            if (!(isNaN(coord.lat()) || isNaN(coord.lng()))) {
                                if (!coord.equals(tripMapObj[i].coords[tripMapObj[i].coords.length - 1])) {
                                    tripMapObj[i].coords.push(coord);
                                    bounds.extend(coord);
                                }
                            }
                            if (!(sensorData.data[0].speed === undefined)) {
                                speedData.push([timestampDate, sensorData.data[0].speed[0]]);
                                curSpeedAverage += sensorData.data[0].speed[0];
                            } else {
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
                                    if (timedif != 0){
                                        var speedint = distint / timedif * 3.6;
                                        speedData.push([timestampDate, speedint]);
                                        totaldist += distint;
                                        curSpeedAverage += speedint;
                                        prevGps = sensorData;
                                    }
                                }
                            }
                        }
                        break;
                    case 2: //Light
                        break;
                    case 3: //Temperature
                        if (!(sensorData.data === undefined) && !(sensorData.data[0] === undefined)) {
                            if (!(sensorData.data[0].value === undefined)) {
                                tempData.push([timestampDate, sensorData.data[0].value[0]]);
                                counter_temperature += 1;
                                sum_of_elements_temperature += parseInt(sensorData.data[0].value);
                            }
                        }
                        break;
                    case 4: //Humidity
                        if (!(sensorData.data[0] === undefined)) {
                            counter_humidity += 1;
                            sum_of_elements_humidity += parseInt(sensorData.data[0].value);
                        }
                        break;
                    case 5: //Accelerometer
                        if (!(sensorData.data === undefined) && !(sensorData.data[0] === undefined)) {
                            if (!(sensorData.data[0].acceleration === undefined)) {
                                accData.push([timestampDate, sensorData.data[0].acceleration[0].x, sensorData.data[0].acceleration[0].y, sensorData.data[0].acceleration[0].z]);
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
                        if (!(sensorData.data === undefined) && !(sensorData.data[0] === undefined)) {
                            if (!(sensorData.data[0].value === undefined)) {
                                counter_heartbeat += 1;
                                sum_of_elements_heartbeat += parseInt(sensorData.data[0].value);
                                heartbeatData.push([sensorData.data[0].value[0]]);
                            }
                        }
                        break;
                    case 10: //Barometer
                        break;
                }
            }
            // Weergeven van "Average Humidity" en "Heart rate Average" en distance
            curHumidityAverage = Math.round(sum_of_elements_humidity / counter_humidity);
            curHeartbeatAverage = Math.round(sum_of_elements_heartbeat / counter_heartbeat);
            totaldist = Math.round((totaldist / 1000) * 100) / 100;
            $('#tripInfoHeartbeat'+i).text('Average Heartbeat: ' + curHeartbeatAverage + 'beats per minute');
            $('#tripInfoHumidity'+i).append('<i class="fa fa-square-o">&nbsp;</i><i class="wi wi-sprinkles">&nbsp;</i>' + curHumidityAverage + ' %');
            $('#tripInfoTotaldist'+i).append('<i class="fa fa-square-o">&nbsp;</i>&nbsp;</i><i class="fa fa-bicycle">&nbsp;</i>' + totaldist + ' km');
            //GPS
            if (tripMapObj[i].coords.length > 1) {
                tripMapObj[i].markerStart = new google.maps.Marker({ //Marker op begincoördinaat
                    position: tripMapObj[i].coords[0],
                    map: map,
                    title: 'Start'
                });
                tripMapObj[i].markerEnd = new google.maps.Marker({ //Marker op begincoördinaat
                    position: tripMapObj[i].coords[tripMapObj[i].coords.length-1],
                    map: map,
                    title: 'End'
                });
                //Random kleur van ID
                var stringHexNumber = (parseInt(parseInt(tripMapObj[i].id, 36).toExponential().slice(2, -5), 10) & 0xFFFFFF).toString(16).toUpperCase(); //http://stackoverflow.com/questions/17845584/converting-a-random-string-into-a-hex-colour
                var tripColor = '#'+('000000' + stringHexNumber).slice(-6); //Lengte aanpassen
                var pathOptions = {
                    path: tripMapObj[i].coords,
                    strokeColor: tripColor,
                    opacity: 0.4,
                    map: map
                };
                tripMapObj[i].polyline = new google.maps.Polyline(pathOptions);
                tripMapObj[i].polyline.myId = curTrip[i]._id;
                google.maps.event.addListener(tripMapObj[i].polyline, 'click', function (event) { //Infowindow bij klikken op polyline
                    infowindow.setPosition(event.latLng);
                    infowindow.setContent(this.myId);
                    infowindow.open(map);
                });
                curMapBounds = bounds;
            }
            $('#tripInfoTime'+i).css("color",tripColor);
            progressSingle = progressSingle + 100 / PROG_STEPS_SINGLETRIP / curTrip.length;
            checkProgressSingle();
            //Accel
            $('#tripInfoAccel'+i).append('<i class="fa fa-caret-square-o-right" id="accelCaret'+i+'">&nbsp;</i>' + 'Bouncy/Smooth');
            if (accData.length > 0) {
                accData.sort(SortByTimestamp);
                var accOptions = {
                    titleY: 'Z-acceleration',
                    backgroundColor: '#f5f5f5'
                };
                var chartData = new google.visualization.DataTable();
                chartData.addColumn('datetime', 'Time');
                chartData.addColumn('number', 'Z');
                chartData.addColumn('number', 'Shocks');
                var passData = [];
                for (var b = 0; b < accData.length; b++) {
                    passData.push([accData[b][0], accData[b][3]]);
                }
                var analysed = analyseAccel(passData);
                console.log(analysed);
                for (var b = 0; b < accData.length; b++) {
                    chartData.addRow([accData[b][0], accData[b][3],analysed[4][b]]);
                }

                var chartAccel = new google.visualization.LineChart($('#tripInfoAccData'+i)[0]); //Chart aanmaken in div
                chartAccObj.push([chartAccel, chartData, accOptions]);
            }
            progressSingle = progressSingle + 100 / PROG_STEPS_SINGLETRIP / curTrip.length;
            checkProgressSingle();
            //Temp
            curTemperatureAverage = Math.round(sum_of_elements_temperature / counter_temperature);
            $('#tripInfoTemperature'+i).append('<i class="fa fa-caret-square-o-right" id="tempCaret'+i+'">&nbsp;</i>&nbsp;<i class="wi wi-thermometer">&nbsp;</i>' + curTemperatureAverage + ' °C');
            if (tempData.length > 0) {
                tempData.sort(SortByTimestamp);
                var tempOptions = {
                    titleY: 'Temperature (°C)',
                    colors: ['red', '#4ab9db'],
                    curveType: 'function',
                    backgroundColor: '#f5f5f5',
                    series: {1: {lineWidth: 1, visibleInLegend: true}}
                };
                var chartData = new google.visualization.DataTable();
                chartData.addColumn('datetime', 'Time');
                chartData.addColumn('number', 'Temperature');
                chartData.addColumn('number', 'Average');
                for (var b = 0; b < tempData.length; b++) {
                    chartData.addRow([tempData[b][0], tempData[b][1], curTemperatureAverage]);
                }
                var chartTemp = new google.visualization.LineChart($('#tripInfoTemp'+i)[0]); //Chart aanmaken in div
                chartTempObj.push([chartTemp, chartData, tempOptions]);
            }
            progressSingle = progressSingle + 100 / PROG_STEPS_SINGLETRIP / curTrip.length;
            checkProgressSingle();
            // Speed
            curSpeedAverage = Math.round(curSpeedAverage / speedData.length * 100) / 100;
            $('#tripInfoAverageSpeed'+i).append('<i class="fa fa-caret-square-o-right" id="speedCaret'+i+'">&nbsp;</i>&nbsp;<i class="fa fa-tachometer">&nbsp;</i>' + curSpeedAverage + ' km/h');
            if (speedData.length > 0) {
                speedData.sort(SortByTimestamp);
                var speedOptions = {
                    titleY: 'Speed (km/h)',
                    colors: ['red', '#4ab9db'],
                    curveType: 'function',
                    backgroundColor: '#f5f5f5',
                    series: {1: {lineWidth: 1, visibleInLegend: true}},
                    vAxis: {
                        viewWindowMode: 'explicit',
                        viewWindow: {
                            min: 0
                        }
                    }
                };
                var chartData = new google.visualization.DataTable();
                chartData.addColumn('datetime', 'Time');
                chartData.addColumn('number', 'Speed');
                chartData.addColumn('number', 'Average');
                for (var b = 0; b < speedData.length; b++) {
                    chartData.addRow([speedData[b][0], speedData[b][1], curSpeedAverage]);
                }
                var chartSpeed = new google.visualization.LineChart($('#tripInfoSpeed'+i)[0]); //Chart aanmaken in div
                chartSpeedObj.push([chartSpeed, chartData, speedOptions]);
            }
            progressSingle = progressSingle + 100 / PROG_STEPS_SINGLETRIP / curTrip.length;
            checkProgressSingle();
            //Google  Elev
            elev_and_plot(tripMapObj[i].coords, curTrip[i]._id,i);
            $("#tripInfo"+i).show();
        }
    }
}

function elev_and_plot(pathCoords,elevId,num){ //Plot elevation graphs, attention: async
    var pathRequest = {
        'path': pathCoords,
        'samples': ELEV_SAMPLE
    };
    if (pathCoords.length <3){
        $('#tripInfoContainer').show('blind',ANIM_TIME);
        progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP / showId.length;
        checkProgressSingle();
        return;
    }
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
                        progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP / showId.length;
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
                $("#tripInfoHeight"+num).append('<i class="fa fa-caret-square-o-right" id="heightCaret'+num+'">&nbsp;</i>&nbsp;<i class="fa fa-arrow-up">&nbsp;</i>'+Math.round(up)+' m '+'<i class="fa fa-arrow-down">&nbsp;</i>'+Math.round(down)+' m')
                //Chart
                chartElev = new google.visualization.ColumnChart($('#tripInfoElev'+num)[0]);
                $('#tripInfoContainer').show('blind',ANIM_TIME,function(){
                    //Callback
                    google.maps.event.trigger(map, 'resize');
                    map.fitBounds(curMapBounds);
                    options = {legend: 'none',titleY: 'Elevation (m)',backgroundColor:'#f5f5f5'};
                    chartElevObj.push([chartElev,data,options]);
                    drawChartObj(chartSpeedObj[num]);
                });
                progressSingle = progressSingle + 100/PROG_STEPS_SINGLETRIP / showId.length;
                checkProgressSingle();
            }
        }
    );
}

function toggleInfo(elem,chart,caret){
    for (var i = 0; i < MAX_COMPARE; i++){
        if ($("#tripInfo"+i).is(":visible")){
            $("#"+elem+i).toggle();
            $("#"+caret+i).toggleClass("fa-caret-square-o-right");
            $("#"+caret+i).toggleClass("fa-caret-square-o-down");
            if ($("#"+elem+i).is(":visible")) {
                drawChartObj(chart[i]);
            }
        }
    }
}

function initGMap(){
    map = new google.maps.Map($("#tripInfoMap")[0],{scrollwheel: false});
    bikeLayer = new google.maps.BicyclingLayer(); //Show bike paths
    bikeLayer.setMap(map);
    elevator = new google.maps.ElevationService();
    infowindow = new google.maps.InfoWindow();
    tripMapObj = [];
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
        var thisId = $(this).attr('id');
        if ($(this).hasClass("clickedTrip") == false){
            if ($.inArray(thisId,showId) == -1){
                showId.push(thisId);
                showTripInfo();
                $(this).addClass('clickedTrip');
                $(this).prepend('<i class="fa fa-check-square-o">&nbsp;</i>');
            }
        } else {
            if ($.inArray(thisId,showId) > -1){
                showId.splice( $.inArray(thisId, showId), 1 );
                if (showId.length > 0){
                    showTripInfo();
                } else {
                    $("#tripInfoContainer").hide('blind',ANIM_TIME)
                }
                $(this).removeClass('clickedTrip');
                $(this).children(".fa-check-square-o").remove();
            }
        }
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

function SortByTimestamp(a, b){ //Sorteren
    return ((a[0] < b[0]) ? -1 : ((a[0] > b[0]) ? 1 : 0));
}

function SortDataByTime(a, b){ //Sorteren
    return ((a.startTime < b.startTime) ? -1 : ((a.startTime > b.startTime) ? 1 : 0));
}

function getQueryVariable(variable)
{
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
    }
    return(false);
}

$(document).ready(initCalendar);