//Globals
var progressCal; //Holds percentage for trips progressbar
var calData; //all calendar events
var myCal;

function initCalendar(){
    progressCal = BEGIN_PERCENT;
    $('#calProgress').show(ANIM_TIME);
    $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
    calendarFcts();
    progressCal = progressCal + 100/PROG_STEPS_CAL-BEGIN_PERCENT;
    $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
    checkProgressCal();

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
    var calData = {};
    for (var i = 0; i < data.length; i++) {
        if (!(data[i].startTime === undefined)) { //startTime moet bestaan
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
            calData[curDate] = calData[curDate] + '<a href="#" id=data[i]._id>' +linkText + '</a>';
        }
    }
    myCal.setData(calData);
    progressCal = progressCal + 100/PROG_STEPS_CAL;
    $('#calProgressBar').animate({ width: progressCal.toString()+'%' },ANIM_TIME);
    checkProgressCal();
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

    function showEvents( $contentEl, dateProperties ) {

        hideEvents();

        var $events = $( '<div id="custom-content-reveal" class="custom-content-reveal"><h4>Events for ' + dateProperties.monthname + ' ' + dateProperties.day + ', ' + dateProperties.year + '</h4></div>' );
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
}

function checkProgressCal(){
    if (progressCal >= 100) {
        $('#calProgressBar').animate({ width: '100%' },0);
        $('#calProgress').hide('blind',3*ANIM_TIME); //doet progressbar verdwijnen
    }
}

$(document).ready(initCalendar);
