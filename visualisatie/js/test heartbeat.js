/**
 * Created by michieldedeken on 20/11/14.
 */

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
        if (data[i]._id == '5464c2f04e4238bc7756c0d6'){
            curHeartbeatTrip = data[i];
            break;}

    }
    for (a = 0; a < curHeartbeatTrip.sensorData.length; a++) { //Iterate over all sensorData
        var sensorData = curHeartbeatTrip.sensorData[a];
        if (!(sensorData.data === undefined) && !(sensorData.data[0] === undefined)) {
            if (!(sensorData.data[0].value === undefined)) {
                heartbeatData.push([sensorData.data[0].value[0]]);
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
                            var x = Date.UTC(year, month, day, hours, minutes, seconds),
                                y = heartbeatData[updatecounter];
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
                        color: 'rgba(0, 0, 0, 0)',
                        label: {
                            text: 'Light workout',
                            style: {
                                color: '#606060'
                            }
                        }
                    }, { // Moderate
                        from: 133,
                        to: 152,
                        color: 'rgba(68, 170, 213, 0.1)',
                        label: {
                            text: 'Moderate workout',
                            style: {
                                color: '#606060'
                            }
                        }
                    }, { // Hard
                        from: 152,
                        to: 171,
                        color: 'rgba(0, 0, 0, 0)',
                        label: {
                            text: 'Hard workout',
                            style: {
                                color: '#606060'
                            }
                        }
                    }, { // Maximum
                        from: 171,
                        to: 200,
                        color: 'rgba(68, 170, 213, 0.1)',
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
                name: 'Random data',
                data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = Date.UTC(year, month, day, hours, minutes, seconds),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: Math.random()
                        });
                    }
                    return data;
                }())
            }]
        });
    });
}