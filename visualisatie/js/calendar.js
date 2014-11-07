//Globals
var progressCal; //Holds percentage for trips progressbar
var calData; //all calendar events
var myCal;
var allTrips;
var userNames;

function initCalendar(){
    $('#calProgress').hide();
    progressCal = BEGIN_PERCENT;
    $('#calProgress').show(ANIM_TIME);
    $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
    calendarFcts();
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
            calData[curDate] = calData[curDate] + '<a href="#" id='+data[i]._id+' class="tripEventLink">' +linkText + '</a>';
        }

    }
    console.log($('#inputUserName option').length);
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
    $('#tripInfoDiv').empty();
    for (var i = 0; i < allTrips.length; i++) {
        if (allTrips[i]._id == tripId){
            var curTrip = allTrips[i];
            break;
        }
    }
    //Close
    var closeDiv = $('<a id="tripInfoClose">X</a>');
    closeDiv.click(function(){$("#tripInfoDiv").hide('blind',ANIM_TIME)});
    //Elap time
    var curTime = ((new Date(curTrip.endTime) - new Date(curTrip.startTime))/1000).toString().toHHMMSS();
    var timeDiv = $('<div>'+'Trip Time: '+curTime+'</div>');
    //UserID
    var userDiv = $('<div>'+'UserID: '+curTrip.userID+'</div>');
    //Create
    $('#tripInfoDiv').append(closeDiv);
    $('#tripInfoDiv').append(timeDiv);
    $('#tripInfoDiv').append(userDiv);
    $('#tripInfoDiv').show('blind',ANIM_TIME);
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
    if (progressCal >= 100) {
        $('#calProgressBar').animate({ width: '100%' },0);
        setTimeout($('#calProgress').hide('blind',2*ANIM_TIME),2*ANIM_TIME); //doet progressbar verdwijnen
    }
}

$(document).ready(initCalendar);