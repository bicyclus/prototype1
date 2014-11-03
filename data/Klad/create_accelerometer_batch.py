import XLoBorg
import time
import serial
from socketIO_client import SocketIO
import json


#DEEL 1: De hulpfuncties voor de rest van de file worden hier gedefinieerd.
def accelerometer_pointdata():
    XLoBorg.printFunction = XLoBorg.NoPrint
    XLoBorg.Init()
    x, y, z = XLoBorg.ReadAccelerometer()
    mx, my, mz = XLoBorg.ReadCompassRaw()
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID": 5, "timestamp": st,
             "data": [{"acceleration": [{"x": x, "y": y, "z": z}], "orientation": [{"mx": mx, "my": my, "mz": mz}]}]}, ]
    return data

def create_batch_data():
    batch_data = []
    end = 1
    starttime = time.strftime("%Y-%m-%dT%H:%M:%S")
    while end != 0:
        arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
        if arduino.readline().strip() == '1995':
            end = 0
            endtime = time.strftime("%Y-%m-%dT%H:%M:%S")
        else:
            batch_data += accelerometer_pointdata()
    return batch_data,starttime,endtime
        
def create_batch():
    batch_data,starttime,endtime = create_batch_data()
    batch=[{"startTime":starttime,"endTime":endtime,"groupID":"cwa2","userID":"r0462183","sensorData":batch_data,"meta":{}}]
    return batch

def try_connection():
    try:
        response=urllib2.urlopen('http://dali.cs.kuleuven.be:8080/qbike/',timeout=1)
        return True
    except urllib2.URLError as err: pass
    return False

def on_response(*args):
    print 'server_message', args


#DEEL 2: Deze loop start wanneer de file wordt gerund. Dit gebruikt de hulpfuncties om een batch aan te maken, die dan worden doorgestuurd in het derde deel van de file.
k = 0
while k == 0:
    ard = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    if ard.readline().strip() == '1995':
        k=1
        batch=create_batch()

#DEEL 3: Hierop volgt een laatste deel code om de gegenereerde data te verzenden.
data = {'purpose': 'batch-sender', 'groupID': "cwa2", 'userID': "r0462183"}

while try_connection() == False:
    time.sleep(5)

print json.dumps(batch)
    
socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
socketIO.on('server_message', on_response)
a=socketIO.emit('start', json.dumps(data), on_response)
socketIO.wait(2)


socketIO.emit('batch-tripdata', json.dumps(batch), on_response)
socketIO.wait(5)
      
