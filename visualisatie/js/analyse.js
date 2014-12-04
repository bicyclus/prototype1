var RMS_POINTS = 7;
var SIGMA_INCREASE = 1.5;
function analyseAccel(data){
    //Returns:
    //[0]: Array of RMS, same length as data
    //[1]: Deviation from RMS, same length as data
    //[2]: Deviation average
    //[3]: Standard deviation of deviation
    //[4]: Points outside
    //[5]: Percentage which lies outside interval
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
            outside.push(0);
        }
    }
    var pntsPerc = pnts/data.length;
    return [rms,dev,dev_avg,sigma_rmsdev,outside,pntsPerc];
}