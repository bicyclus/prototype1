function initCalendar(){
    $('#calendar').calendario();

    var getUrl = "http://dali.cs.kuleuven.be:8080/qbike/trips?";
    $.ajax({
        url: getUrl,
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response){
            fillCalendar(response);
        }
    });
}

function fillCalendar(data){
    
}

$(document).ready(initCalendar);
