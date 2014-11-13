/**
 * Created by michieldedeken on 13/11/14.
 */

$(function heartbeat() {
    $('#container').highcharts({
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Heartrate'
        },
        subtitle: {
            text: 'Dag'
        },
        xAxis: {
            type: 'datetime',
            labels: {
                overflow: 'justify'
            }
        },
        yAxis: {
            title: {
                text: 'Heartrate (bpm)'
            },
            min: 80,
            minorGridLineWidth: 0,
            gridLineWidth: 0,
            alternateGridColor: null,
            plotBands: [{ // Very light
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
            valueSuffix: ' bpm'
        },
        plotOptions: {
            spline: {
                lineWidth: 4,
                states: {
                    hover: {
                        lineWidth: 5
                    }
                },
                marker: {
                    enabled: false
                },
                pointInterval: 3600000/60*3, // 3 seconds interval

                pointStart: new Date(curTrip.startTime)
            }
        },
        series: [{
            name: 'test',
            data: heartbeatData

        }],
        navigation: {
            menuItemStyle: {
                fontSize: '10px'
            }
        }
    });
});