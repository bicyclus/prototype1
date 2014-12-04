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
    $("#calendarButton").click(function visitPage(){window.location='../index.html'}); //Buttonlink
    initDatepickers();
    $('#myReciever').hide();
    $('#tripProgress').hide();
}

function getAllTrips(){ //JSON van alle trips opvragen en naar functies doorgeven
    $('#tripProgressBar').animate({ width: '0' },ANIM_TIME);
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
        url: "http://dali.cs.kuleuven.be:8080/qbike/trips/5473545aaf4f11315967541f",
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response){
            //$('#myReciever').append('<pre>' + JSON.stringify(response, null, 2) + '</pre>');
            progressTrips = progressTrips + 100/(PROG_STEPS_TRIPS-BEGIN_PERCENT);
            checkProgressTrips();
            $('#myReciever').append(JSON.stringify(response));
            progressTrips = progressTrips + 100/PROG_STEPS_TRIPS;
/*            console.log('1');
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
            console.log('6');*/
            heartbeat(response);
        }
    });
}


function heartbeat(data) {
    var curHeartbeatTrip;
    var heartbeatData = [];
    var start;
    var year;
    var month;
    var day;
    var hours;
    var minutes;
    var seconds;
    var updatecounter = 0;

    for (i = 0; i < data.length; i++){
        if (data[i]._id == '5473545aaf4f11315967541f'){
            curHeartbeatTrip = data[i];
            break;}

    }
    for (a = 0; a < curHeartbeatTrip.sensorData.length; a++) { //Iterate over all sensorData
        var sensorData = curHeartbeatTrip.sensorData[a];
        if (!(sensorData.data === undefined) && !(sensorData.data[0] === undefined)) {
            if (!(sensorData.data[0].value === undefined)) {
                heartbeatData.push(sensorData.data[0].value[0]);
            }
        }
    }
    start = new Date(curHeartbeatTrip.startTime);
    year = start.getFullYear();
    month = start.getMonth();
    day = start.getDate();
    hours = start.getHours();
    minutes = start.getMinutes();
    seconds = start.getSeconds();

    $(document).ready(function () {
        Highcharts.setOptions({
            global: {
                useUTC: true
            }
        });

        $('#container').highcharts({
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                events: {
                    load: function () {

                        // set up the updating of the chart each second
                        var series = this.series[0];
                        setInterval(function () {
                            updatecounter ++;
                            var x = Date.UTC(year, month, day, hours, minutes, seconds)+updatecounter*4000, // each 4 seconds new heartbeat timestamp
                                y = heartbeatData[updatecounter]; // new heartbeat
                            series.addPoint([x, y], true, true);
                        }, 4000);
                    }
                }
            },
            title: {
                text: 'Heartbeat'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
                title: {
                    text: 'Heartrate (bpm)'
                },
                min: 60,
                minorGridLineWidth: 0,
                gridLineWidth: 0,
                alternateGridColor: null,
                plotBands: [
                    { // Rest
                        from: 60,
                        to: 104,
                        color: 'rgba(0 , 0, 0, 0)',
                        label: {
                            text: 'Rest',
                            style: {
                                color: '#606060'
                            }
                        }
                    },
                    { // Very light
                        from: 104,
                        to: 114,
                        color: 'rgba(68, 170, 213, 0.1)',
                        label: {
                            text: 'Very light workout',
                            style: {
                                color: '#606060'
                            }
                        }
                    }, { // Light
                        from: 114,
                        to: 133,
                        color: 'rgba(0, 178, 242, 0.3)',
                        label: {
                            text: 'Light workout',
                            style: {
                                color: '#606060'
                            }
                        }
                    }, { // Moderate
                        from: 133,
                        to: 152,
                        color: 'rgba(209, 210, 0, 0.5)',
                        label: {
                            text: 'Moderate workout',
                            style: {
                                color: '#606060'
                            }
                        }
                    }, { // Hard
                        from: 152,
                        to: 171,
                        color: 'rgba(209, 100, 0, 0.5)',
                        label: {
                            text: 'Hard workout',
                            style: {
                                color: '#606060'
                            }
                        }
                    }, { // Maximum
                        from: 171,
                        to: 200,
                        color: 'rgba(223, 0, 0, 0.5)',
                        label: {
                            text: 'Maximum workout',
                            style: {
                                color: '#606060'
                            }
                        }
                    }]
            },
            tooltip: {
                formatter: function () {
                    return '<b>' + this.series.name + '</b><br/>' +
                        Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                        Highcharts.numberFormat(this.y, 2);
                }
            },
            legend: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            series: [{
                name: 'Heart rate',
                data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = Date.UTC(year, month, day, hours, minutes, seconds),
                        i;

                    for (i = -10; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 4000,
                            y: 90
                        });
                    }
                    return data;
                }())
            }]
        });
    });
}

function checkProgressTrips(){
    console.log('prog: '+progressTrips.toString());
    $('#tripProgressBar').animate({width: progressTrips.toString() + '%'}, ANIM_TIME);
    if (progressTrips >= 99.9) {
        $('#tripProgressBar').animate({ width: '100%' },0);
        setTimeout($('#tripProgress').hide('blind',2*ANIM_TIME),2*ANIM_TIME); //doet progressbar verdwijnen
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
