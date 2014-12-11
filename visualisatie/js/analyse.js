var RMS_POINTS = 7;
var SIGMA_INCREASE = 1.5;
var ROAD_TYPES = [[0.0,"Very smooth "], //Standaarddeviatie
    [0.05,"Pretty smooth ride "],
    [0.2,"Pretty bumpy ride "],
    [0.27,"Really bumpy ride "],
    [0.35,"Insanely bumpy ride "],
    [Infinity,""]];
var ROAD_CONDITION = [[0.0,"on a perfect road."], //Procent bumps
    [0.005,"on an almost perfect road."],
    [0.03,"on an average road surface."],
    [0.05,"with minor bumps."],
    [0.08,"with lots of obstacles."],
    [0.1,"on a true belgian road."],
    [Infinity,""]];
function analyseAccel(data){
    //Returns:
    //[x]: Array of RMS, same length as data
    //[x]: Deviation from RMS, same length as data
    //[x]: Deviation average
    //[x]: Standard deviation of deviation
    //[0]: Points outside
    //[x]: Percentage which lies outside interval
    //[1]: Road type text
    //[2]: Road condition text
    //[3]: Number of bumps

    //RMS
    var rms = [];
    var dev = [];
    var sq_sum = 0;
    var cnt = 0;
    var rms_cur = 0;
    var dev_cur = 0;
    var sigma_rmsdev = 0;
    var dev_avg = 0;
    //First pass:
    //RMS of accel data
    //Deviation of data from RMS
    for (var i = 0; i < data.length; i++) {
        sq_sum = Math.pow(data[i][1],2);
        cnt = 1;
        for (var b = 1; b < RMS_POINTS; b++) {
            if (!( ((i-b)<0))){
                sq_sum += Math.pow(data[i-b][1],2);
                cnt += 1;
            }
            if (!(((i+b+1)>data.length))){
                sq_sum += Math.pow(data[i+b][1],2);
                cnt += 1;
            }
        }
        rms_cur = Math.sqrt(sq_sum/(cnt));
        rms.push(rms_cur);
        dev_cur = Math.abs(data[i][1]-rms_cur)
        dev.push(dev_cur);
        dev_avg += dev_cur
    }
    dev_avg = dev_avg/data.length;
    //Second pass:
    //Standard deviation of RMS deviation
    for (var i = 0; i < data.length; i++) {
        sigma_rmsdev += Math.pow(dev[i]-dev_avg,2);
    }
    sigma_rmsdev = Math.sqrt(sigma_rmsdev/(data.length))*SIGMA_INCREASE;
    //Third pass:
    //Points outside sigma_rmsdev+-dev_avg interval
    var pnts = 0;
    var outside = [];
    for (var i = 0; i < data.length; i++) {
        if (dev[i]>dev_avg+sigma_rmsdev){
            pnts += 1;
            outside.push(1);
        } else
        if (dev[i]<dev_avg-sigma_rmsdev){
            pnts += 1;
            outside.push(1);
        } else {
            outside.push(null);
        }
    }
    var pntsPerc = pnts/data.length;
    //Text for analysation
    var typeText = ROAD_TYPES[0][1];
    for (var i = 1; i<ROAD_TYPES.length; i++){
        if (sigma_rmsdev<ROAD_TYPES[i][0]){
            typeText = ROAD_TYPES[i-1][1];
            break;
        }
    }
    var conditionText = ROAD_TYPES[0][1];
    for (var i = 1; i<ROAD_CONDITION.length; i++){
        if (pntsPerc<ROAD_CONDITION[i][0]){
            conditionText = ROAD_CONDITION[i-1][1];
            break;
        }
    }
    console.log(sigma_rmsdev);
    return [outside,typeText,conditionText,pnts];
}