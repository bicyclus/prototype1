import XLoBorg
import time
import serial
from socketIO_client import SocketIO
import json


#DEEL 1: Eerst worden hulpfuncties gedefinieerd.
def accelerometer_pointdata():
    XLoBorg.printFunction = XLoBorg.NoPrint
    XLoBorg.Init()
    x, y, z = XLoBorg.ReadAccelerometer()       
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    

    data = [{"sensorID":5,"timestamp":st,"data":[{"type":"point","coordinates":[x,y,z]}]},]
    return data


def create_batch_data():
    batch_data = []
    end = 1
    starttime = time.strftime("%Y-%m-%dT%H:%M:%S")
    while end != 0:
        arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 9600)
        value = str(arduino.readline())
        print value
        if int(value) > 800:
            end = 0
            endtime = time.strftime("%Y-%m-%dT%H:%M:%S")
        else:
            batch_data += accelerometer_pointdata()
    return batch_data,starttime,endtime
        
def create_batch():
    batch_data,starttime,endtime = create_batch_data()
    batch=[{"startTime":starttime,"endTime":endtime,"groupID":"cwa2","userID":"r0462183","sensorData":batch_data,"meta":{}}]
    return batch


#DEEL 2: Deze loop start wanneer de file wordt gerund. Dit gebruikt de hulpfuncties om een batch aan te maken, die dan worden doorgestuurd in het derde deel van de file.
k = 0
while k == 0:
    ard = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 9600)
    val = str(ard.readline())
    print(val)
    if int(val) < 800:
        k=1
        batch=create_batch()

#DEEL 3: Hierop volgt een laatste deel code om de gegenereerde data te verzenden.
data = {'purpose': 'batch-sender', 'groupID': "cwa2", 'userID': "r0462183"}


def on_response(*args):
    print 'server_message', args

print json.dumps(batch)
    
socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
socketIO.on('server_message', on_response)
socketIO.emit('start', json.dumps(data), on_response)
socketIO.wait(2)


socketIO.emit('batch-tripdata', json.dumps(batch), on_response)
socketIO.wait(5)
      
