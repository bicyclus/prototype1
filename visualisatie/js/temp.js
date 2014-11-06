function getTemperature(data) {
    var dataArrayTemp;
    var optionsTemp
    for (i = 0; i < data.length; i++) { //Iterate over all trips
        if (!(data[i].sensorData === undefined)) {
            dataArrayTemp = [];
            for (a = 0; a < data[i].sensorData.length; a++) { //Iterate over all sensorData
                var tempData = data[i].sensorData[a];
                if ((tempData.sensorID == "3") && !(tempData.data === undefined)) {
                    if (!(tempData.data[0].value === undefined)) {
                        var timestampDate = new Date(tempData.timestamp);
                        dataArrayTemp.push([timestampDate, tempData.data[0].value[0]]);
                    }
                }
            }
            if (dataArrayTemp.length > 0) {
                dataArrayTemp.sort(SortByTimestamp);
                optionsTemp = {'title': 'Temperatuur: ' + data[i]._id, colors: ['red'], curveType: 'function', backgroundColor: '#f5f5f5'};
                var chartData = new google.visualization.DataTable();
                chartData.addColumn('number', 'Temperatuur');
                for (var b = 0; b < dataArrayTemp.length; b++) {
                    chartData.addRow(['', dataArray[b][1]]);
                }
                var draw_div_temp = $('<div></div>');
                $("#temp_div").append(draw_div_temp);

                var chart = new google.visualization.LineChart(draw_div_temp[0]); //Chart aanmaken in div
                chart.draw(chartData, options); //Tekenen
            }
        }
    }
}




