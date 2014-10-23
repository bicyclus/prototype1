import XLoBorg
import time
import serial
from socketIO_client import SocketIO
import json

def create_batch_data():
    batch_data = []
    starttime = time.strftime("%Y-%m-%dT%H:%M:%S")
    end = 1
    while end != 0 :
        if arduino.readline().strip() == '1337':
            arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 9600)
            ln = eval(arduino.readline().strip())
            lt = eval(arduino.readline().strip())
            st = time.strftime("%Y-%m-%dT%H:%M:%S")
            batch_data +=  [{"sensorID":1,"timestamp":st,"data":[{"type":"Point","coordinates":[ln, lt]}]},]
            
        elif arduino.readline().strip() == '1995':
            end = 0
            endtime = time.strftime("%Y-%m-%dT%H:%M:%S")

        batch_data += accelerometer_pointdata()
        
    return batch_data,starttime,endtime

def create_batch():
    batch_data,starttime,endtime = create_batch_data()
    batch=[{"startTime":starttime,"endTime":endtime,"groupID":"cwa2","userID":"r0462183","sensorData":batch_data,"meta":{}}]
    return batch

#HOOFDFUNCTIE
k = 0
while k == 0:
    ard = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 9600)
    if ard.readline().strip() == '1995':
        k=1
        batch=create_batch()


#CONNECTIE TESTEN EN DOORSTUREN NAAR SERVER
def try_connection():
    try:
        response=urllib2.urlopen('http://dali.cs.kuleuven.be:8080/qbike/',timeout=1)
        return True
    except urllib2.URLError as err: pass
    return False

while try_connection() == False:
    time.sleep(5)

socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
socketIO.on('server_message', on_response)
a=socketIO.emit('start', json.dumps(data), on_response)
socketIO.wait(2)


socketIO.emit('batch-tripdata', json.dumps(batch), on_response)
socketIO.wait(5)
