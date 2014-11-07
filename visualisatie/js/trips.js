//Globals
var progressTrips; //Holds percentage for trips progressbar

function tripInit(){
    $("#getTrips") //Button maken
        .click(function( event ) {
            event.preventDefault();
            getAllTrips();
        });
    $("#showJSON")
        .click(function( event ) {
            event.preventDefault();
            $('#myReciever').toggle(); //Show/Hide
        });
    $("#calendarButton").click(function visitPage(){window.location='calendar.html'}); //Buttonlink
    initDatepickers();
    $('#myReciever').hide();
    $('#tripProgress').hide();
}

function getAllTrips(){ //JSON van alle trips opvragen en naar functies doorgeven
    progressTrips = BEGIN_PERCENT;
    $('#tripProgress').show(ANIM_TIME);
    $('#tripProgressBar').animate({ width: progressTrips.toString()+'%' },ANIM_TIME);
    //Check data in box, set getUrl
    var getUrl = "http://dali.cs.kuleuven.be:8080/qbike/trips?";
    //UserFilter
    var userName = $("#inputUserName").val();
    var userFilter;
    if (userName==null || userName == ''){
        userFilter = '';
        $("#inputUserName").css('border-color','#ee5f5b');
    } else {
        userFilter = 'userID=' + userName;
        $("#inputUserName").css('border-color','#CCC');
    }

    //DateFilter
    var dates = $("#datepicker").val().split(" - ");
    var dateFilter;
    try {
        dates[0] = dates[0].replace(/(\d{2})-(\d{2})-(\d{4})/, "$2-$1-$3");
        dates[1] = dates[1].replace(/(\d{2})-(\d{2})-(\d{4})/, "$2-$1-$3");

        if ((Date.parse(dates[0])) && (Date.parse(dates[1]))) { //Check for valid dates
            dateFilter = '&fromDate=' + dates[0] + '&toDate=' + dates[1];
            $("#datepicker").css('border-color','#CCC');
        } else {
            dateFilter = '';
            $("#datepicker").css('border-color','#ee5f5b');
        }
    }
    catch(err){
        dateFilter = '';
        $("#datepicker").css('border-color','#ee5f5b');
    }

    $('#myReciever').empty();
    $('#chart_div').empty();
    $('#accel_div').empty();
    $('#map_div').empty();
    $('#elevation_chart').empty();
    $('#temp_div').empty();
    $('#hum_div').empty();
    $.ajax({
        url: getUrl + userFilter + dateFilter,
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response){
            //$('#myReciever').append('<pre>' + JSON.stringify(response, null, 2) + '</pre>');
            progressTrips = progressTrips + 100/PROG_STEPS_TRIPS-BEGIN_PERCENT;
            $('#tripProgressBar').animate({ width: progressTrips.toString()+'%' },ANIM_TIME);
            checkProgressTrips();
            $('#myReciever').append(JSON.stringify(response));
            progressTrips = progressTrips + 100/PROG_STEPS_TRIPS;
            $('#tripProgressBar').animate({ width: progressTrips.toString()+'%' },ANIM_TIME);
            console.log('1');
            checkProgressTrips();
            drawChart(response);
            console.log('2');
            drawAccel(response);
            console.log('3');
            createMap(response);
            console.log('4');
            getHumidity(response);
            console.log('5');
            getTemperature(response);
            console.log('6');
        }
    });
}

function drawChart(data) { //Elapsed time graph of all trips
    var dataArray = [['Number', 'Elapsed time']]; //Titels
    for (var i = 0; i < data.length; i++) {
        if (!(data[i].endTime === undefined) && !(data[i].startTime === undefined)) { //Endtime moet bestaan
            var elap = (new Date(data[i].endTime) - new Date(data[i].startTime))/1000;//Tijdsduur in seconds
            if (Math.abs(elap) < 1000){ //Negeren van uitschieters
                dataArray.push([i, elap]);//Data toevoegen op het einde van de array
            }
        }
    }
    var chartData = google.visualization.arrayToDataTable(dataArray);

    var options = {'title':'Elapsed Times over all trips',backgroundColor:'#f5f5f5'};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.LineChart($("#chart_div")[0]); //Chart aanmaken in div
    chart.draw(chartData, options); //Tekenen
    progressTrips = progressTrips + 100/PROG_STEPS_TRIPS;
    $('#tripProgressBar').animate({ width: progressTrips.toString()+'%' },ANIM_TIME);
    checkProgressTrips();
}

function drawAccel(data){
    var dataArray;
    var options;
    for (i = 0; i < data.length; i++) { //Iterate over all trips
        if (!(data[i].sensorData === undefined)) {
            dataArray  = [];
            for (a = 0; a < data[i].sensorData.length; a++) { //Iterate over all sensorData
                var accelData = data[i].sensorData[a];
                if ((accelData.sensorID == "5") && !(accelData.data === undefined) && !(accelData.data[0] === undefined)) {
                    try {
                        if (!(accelData.data[0].acceleration === undefined)) {
                            var timestampDate = new Date(accelData.timestamp);
                            dataArray.push([timestampDate,accelData.data[0].acceleration[0].x,accelData.data[0].acceleration[0].y,accelData.data[0].acceleration[0].z]);
                        }
                    }
                    catch(err){console.log(err)}
                }
            }
            if (dataArray.length > 0) {
                dataArray.sort(SortByTimestamp);
                options = {'title':'Accelerometer: '+data[i]._id,colors:['red','green','blue'],curveType:'function',backgroundColor:'#f5f5f5'};
                var chartData = new google.visualization.DataTable();
                chartData.addColumn('string', 'Time');
                chartData.addColumn('number', 'X');
                chartData.addColumn('number', 'Y');
                chartData.addColumn('number', 'Z');
                for (var b = 0; b < dataArray.length; b++) {
                    chartData.addRow(['', dataArray[b][1],dataArray[b][2],dataArray[b][3]]);
                }
                var draw_div = $('<div></div>');
                $("#accel_div").append(draw_div);

                var chart = new google.visualization.LineChart(draw_div[0]); //Chart aanmaken in div
                chart.draw(chartData, options); //Tekenen
            }
        }
    }
    progressTrips = progressTrips + 100/PROG_STEPS_TRIPS;
    $('#tripProgressBar').animate({ width: progressTrips.toString()+'%' },ANIM_TIME);
    checkProgressTrips();
}

function SortByTimestamp(a, b){ //Sorteren
    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
}

function getTemperature(data) {
    var tempArray;
    var options;

    for (i = 0; i < data.length; i++) { // Iterate over all trips
        if (!(data[i].sensorData === undefined)) {
            tempArray = [];
            for (a = 0; a < data[i].sensorData.length; a++) {
                var temp = data[i].sensorData[a];

                if ((temp.sensorID == "3") && !(temp.data[0] === undefined)) {
                    if ((temp.data[0].value % 1 === 0) && (typeof temp.data[0].value == 'number') && (isFinite(temp.data[0].value))) {
                        var timestampDate = new Date(temp.timestamp);
                        tempArray.push([timestampDate, temp.data[0].value]);
                    }

                }
            }
            if (tempArray.length > 0) {
                tempArray.sort(SortByTimestamp);
                options = {'title': 'Temperature: ' + data[i]._id, colors: ['red'], curveType: 'function', backgroundColor: '#f5f5f5'};
                var chartData = new google.visualization.DataTable();
                chartData.addColumn('string', 'Time');
                chartData.addColumn('number', 'Temperature');
                for (var b = 0; b < tempArray.length; b++) {
                    chartData.addRow(['', tempArray[b][1]]);
                }
                var draw_temp_div = $('<div></div>');
                $("#temp_div").append(draw_temp_div);
                var chart = new google.visualization.LineChart(draw_temp_div[0]); //Chart aanmaken in div
                chart.draw(chartData, options); //Tekenen

            }
        }
    }
}

function getHumidity(data) {
    var humArray;
    var options;

    for (i = 0; i < data.length; i++) { // Iterate over all trips
        if (!(data[i].sensorData === undefined)) {
            humArray = [];
            for (a = 0; a < data[i].sensorData.length; a++) {
                var hum = data[i].sensorData[a];
                if ((hum.sensorID == "4") && !(hum.data[0] === undefined)) {
                    if ((hum.data[0].value % 1 === 0) && (typeof hum.data[0].value == 'number') && (isFinite(hum.data[0].value))){
                        var timestampDate = new Date(hum.timestamp);
                        humArray.push([timestampDate, hum.data[0].value]);
                    }
                }
            }
            if (humArray.length > 0) {
                humArray.sort(SortByTimestamp);
                options = {'title': 'Humidity: ' + data[i]._id, colors: ['Blue'], curveType: 'function', backgroundColor: '#f5f5f5'};
                var chartData = new google.visualization.DataTable();
                chartData.addColumn('string', 'Time');
                chartData.addColumn('number', 'Humidity');
                for (var b = 0; b < humArray.length; b++) {
                    chartData.addRow(['', humArray[b][1]]);
                }
                var draw_hum_div = $('<div></div>');
                $("#hum_div").append(draw_hum_div);
                var chart = new google.visualization.LineChart(draw_hum_div[0]); //Chart aanmaken in div
                chart.draw(chartData, options); //Tekenen
            }
        }
    }
}


//TripMap class:
//- id
//- coords
//- marker
//- polyline

var map;
var infowindow;
var bikeLayer;
var elevator;
var tripMaps = []; //Array of objects
var retries = 0;

function createMap(data){
    var mapOptions = {
        zoom: 14,
        center: new google.maps.LatLng(50.863774, 4.678921) //Campus
    };
    map = new google.maps.Map($("#map_div")[0], mapOptions);
    bikeLayer = new google.maps.BicyclingLayer(); //Show bike paths
    bikeLayer.setMap(map);
    elevator = new google.maps.ElevationService();
    infowindow = new google.maps.InfoWindow();
    retries = 0;

    for (i = 0; i < data.length; i++) { //Iterate over all trips
        if (!(data[i].sensorData === undefined)) {
            tripMapObj = {id:data[i]._id, coords:[]}; //Create tripMap object
            for (a = 0; a < data[i].sensorData.length; a++) { //Iterate over all sensorData
                var gpsData = data[i].sensorData[a];
                if ((gpsData.sensorID == "1") && !(gpsData.data === undefined)) {
                    for (b = 0; b < gpsData.data.length; b++) { //Iterate over all data
                        try { //Probeer deze blok uit te voeren
                            var coord = new google.maps.LatLng(gpsData.data[b].coordinates[0], gpsData.data[b].coordinates[1]);
                            if (!(isNaN(coord.lat()) || isNaN(coord.lng()))) {
                                if (!coord.equals(tripMapObj.coords[tripMapObj.coords.length - 1])) {
                                    tripMapObj.coords.push(coord);
                                }
                            }
                        }
                        catch (err) { //Ga hier als het ergens in de try een error oproept.
                            tripMapObj.coords = [];
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
                tripMapObj.polyline.myId = data[i]._id;
                google.maps.event.addListener(tripMapObj.polyline, 'click', function (event) { //Infowindow bij klikken op polyline
                    infowindow.setPosition(event.latLng);
                    infowindow.setContent(this.myId);
                    infowindow.open(map);
                });
                tripMaps.push(tripMapObj);
                elev(tripMapObj.coords);
            }
        }
    }
}

function elev(pathCoords){ //Plot elevation graphs, attention: async
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
                        progressTrips = progressTrips + 100 / PROG_STEPS_TRIPS / tripMaps.length;
                        $('#tripProgressBar').animate({width: progressTrips.toString() + '%'}, ANIM_TIME);
                        checkProgressTrips();
                    }
                }
            } else {
                var elevations = results;
                var elevationPath = [];
                var data = new google.visualization.DataTable();
                data.addColumn('string', 'Sample');
                data.addColumn('number', 'Elevation');

                for (var i = 0; i < elevations.length; i++) {
                    elevationPath.push(elevations[i].location);
                    data.addRow(['', elevations[i].elevation]);
                }

                var tempTitle = '';
                for (var a = 0; a < tripMaps.length; a++) { //Find trip
                    if (tripMaps[a].coords.equals(pathCoords)){
                        tempTitle = tripMaps[a].id;
                        break;
                    }
                }

                //Chart
                var el_div = $('<div style="display: block"></div>');
                $("#elevation_chart").append(el_div);
                chart = new google.visualization.ColumnChart(el_div[0]);
                chart.draw(data, {
                    height: 150,
                    legend: 'none',
                    titleY: 'Elevation (m)',
                    title: tempTitle
                });
                progressTrips = progressTrips + 100 / PROG_STEPS_TRIPS / tripMaps.length;
                $('#tripProgressBar').animate({width: progressTrips.toString() + '%'}, ANIM_TIME);
                checkProgressTrips();
            }
        }
    );
}

function checkProgressTrips(){
    if (progressTrips >= 100) {
        $('#tripProgressBar').animate({ width: '100%' },0);
        $('#tripProgress').hide('blind',3*ANIM_TIME); //doet progressbar verdwijnen
    }
}

function initDatepickers() { //DatePicker function
    var datepicker__updateDatepicker = $.datepicker._updateDatepicker;
    $.datepicker._updateDatepicker = function( inst ) {
        datepicker__updateDatepicker.call( this, inst );
        var onAfterUpdate = this._get(inst, 'onAfterUpdate');
        if (onAfterUpdate)
            onAfterUpdate.apply((inst.input ? inst.input[0] : null),
                [(inst.input ? inst.input.val() : ''), inst]);
    }

    $(function() {
        var cur = -1, prv = -1;
        $('#jrange div')
            .datepicker({
                //numberOfMonths: 3,
                changeMonth: false,
                changeYear: false,
                showButtonPanel: true,
                dateFormat: "dd-mm-yy",

                beforeShowDay: function ( date ) {
                    return [true, ( (date.getTime() >= Math.min(prv, cur) && date.getTime() <= Math.max(prv, cur)) ? 'date-range-selected' : '')];
                },

                onSelect: function ( dateText, inst ) {
                    var d1, d2;

                    prv = cur;
                    cur = (new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay)).getTime();
                    if ( prv == -1 || prv == cur ) {
                        prv = cur;
                        $('#jrange input').val( dateText );
                    } else {
                        d1 = $.datepicker.formatDate( 'dd-mm-yy', new Date(Math.min(prv,cur)), {} );
                        d2 = $.datepicker.formatDate( 'dd-mm-yy', new Date(Math.max(prv,cur)), {} );
                        $('#jrange input').val( d1+' - '+d2 );
                    }
                },

                onChangeMonthYear: function ( year, month, inst ) {
                    //prv = cur = -1;
                },

                onAfterUpdate: function ( inst ) {
                    $('<button type="button" class="ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all" data-handler="hide" data-event="click">Done</button>')
                        .appendTo($('#jrange div .ui-datepicker-buttonpane'))
                        .on('click', function () { $('#jrange div').hide();  });
                }
            })
            .position({
                my: 'left top',
                at: 'left bottom',
                of: $('#jrange input')
            })
            .hide();

        $('#jrange input').on('focus', function (e) {
            var v = this.value,
                d;
            try {
                if ( v.indexOf(' - ') > -1 ) {
                    d = v.split(' - ');
                    prv = $.datepicker.parseDate( 'dd-mm-yy', d[0] ).getTime();
                    cur = $.datepicker.parseDate( 'dd-mm-yy', d[1] ).getTime();
                } else if ( v.length > 0 ) {
                    prv = cur = $.datepicker.parseDate( 'dd-mm-yy', v ).getTime();
                }
            } catch ( e ) {
                cur = prv = -1;
            }

            if ( cur > -1 )
                $('#jrange div').datepicker('setDate', new Date(cur));
            $('#jrange div').datepicker('refresh').show();
        });
    });
}

$(document).ready(tripInit);

$.datepicker._defaults.onAfterUpdate = null;
