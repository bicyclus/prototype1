import XLoBorg
import time
import serial
from socketIO_client import SocketIO
import json
import urllib2

#DEFINING FUNCTIONS
def try_connection():
    """Checks if we can connect to the server by checking the availability of http://dali.cs.kuleuven.be:8080/qbike/."""
    try:
        response=urllib2.urlopen('http://dali.cs.kuleuven.be:8080/qbike/',timeout=1)
        return True
    except urllib2.URLError as err: pass
    return False

def accelerometer_pointdata():
    """Reads the accelerometer data at this specific moment and puts them in the desired format."""
    XLoBorg.printFunction = XLoBorg.NoPrint
    XLoBorg.Init()
    x, y, z = XLoBorg.ReadAccelerometer()
    mx, my, mz = XLoBorg.ReadCompassRaw()
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID":5,"timestamp":st,"data":[{"acceleration":[{"x":x,"y":y,"z":z}],"orientation":[{"mx":mx,"my":my,"mz":mz}]}]},]
    return data

def convert_coordinates(coor):
    """Converts the coordinates from dd mm format to dd format."""
    k = 0
    for i in range(0,len(coor)):
        if coor[i] == ".":
            k = i
            break
    minutes = int(coor[k+1:len(coor)])
    degrees =(coor[0:k])
    dmin = str(minutes/60.0)

    for s in range(0,len(dmin)):
        if dmin[s] == ".":
            k = s
            break
    dmin1 = dmin[0:k]
    dmin2 = dmin[k+1:len(dmin)]
    dmin = dmin1 + dmin2

    coordinates = degrees + "." + dmin
    return coordinates

def create_batch_data():
    """Creates all the data to send with the batch."""
    batch_data = []
    end = 1
    first_time = 1
    while end != 0 :
        if arduino.readline().strip() == '1337':
            if first_time ==1:
                starttime = time.strftime("%Y-%m-%dT%H:%M:%S")
                first_time = 0
            arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
            ln = arduino.readline().strip()
            ln = convert_coordinates(ln)
            lt = arduino.readline().strip()
            lt = convert_coordinates(lt)
            st = time.strftime("%Y-%m-%dT%H:%M:%S")
            batch_data +=  [{"sensorID":1,"timestamp":st,"data":[{"type":"Point","coordinates":[ln, lt]}]},]
        elif arduino.readline().strip() == '1995' and first_time != 1:
            end = 0
            endtime = time.strftime("%Y-%m-%dT%H:%M:%S")
        elif not arduino.readline().strip() == '1995' and first_time != 1:
            batch_data += accelerometer_pointdata()
    return batch_data,starttime,endtime

def create_batch():
    """Creates the batch itself using the create_atch_data() function."""
    batch_data,starttime,endtime = create_batch_data()
    batch=[{"startTime":starttime,"endTime":endtime,"groupID":"cwa2","userID":"r0462183","sensorData":batch_data,"meta":{}}]
    return batch

def on_response(*args):
    """Prints the server message."""
    print 'server_message', args

#MAIN LOOP: RUNS WHEN FILE IS RUNNED
k = 0
while k == 0:
    ard = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    if ard.readline().strip() == '1995':
        k=1
        batch=create_batch()


#TESTS CONNECTION AND SENDS BATCH IN THE CORRECT FORMAT TO THE SERVER
while try_connection() == False: time.sleep(5)

data = {'purpose': 'batch-sender', 'groupID': "cwa2", 'userID': "r0462183"}

socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
socketIO.on('server_message', on_response)
a=socketIO.emit('start', json.dumps(data), on_response)
socketIO.wait(2)


socketIO.emit('batch-tripdata', json.dumps(batch), on_response)
socketIO.wait(5)
