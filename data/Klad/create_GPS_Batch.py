import time
import serial
from socketIO_client import SocketIO
import json

arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)


def on_response(*args):
    print 'server_message', args


def convert_coordinates(coor):
    """Converts the coordinates from dd mm format to dd format."""
    k = 0
    coor = str(coor)
    for i in range(0, len(coor)):
        if coor[i] == ".":
            k = i
            break
    minutes = int(coor[k + 1:len(coor)])
    degrees = (coor[0:k])
    dmin = str(minutes / 60.0)

    for s in range(0, len(dmin)):
        if dmin[s] == ".":
            k = s
            break
    dmin1 = dmin[0:k]
    dmin2 = dmin[k + 1:len(dmin)]
    dmin = dmin1 + dmin2

    coordinates = degrees + "." + dmin
    return coordinates


def create_batch_data():
    batch_data = []
    starttime = time.strftime("%Y-%m-%dT%H:%M:%S")
    end = 1
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    while end != 0:
        ard = arduino.readline().strip()
        if ard == '1337':
            ln = eval(arduino.readline().strip())
            lt = eval(arduino.readline().strip())
            st = time.strftime("%Y-%m-%dT%H:%M:%S")
            ln = convert_coordinates(ln)
            lt = convert_coordinates(lt)
            batch_data += [{"sensorID": 1, "timestamp": st, "data": [{"type": "Point", "coordinates": [ln, lt]}]}, ]

        elif ard == '1995':
            end = 0
            endtime = time.strftime("%Y-%m-%dT%H:%M:%S")
        endtime = time.strftime("%Y-%m-%dT%H:%M:%S")

    return batch_data, starttime, endtime


def create_batch():
    batch_data, starttime, endtime = create_batch_data()
    batch = [
        {"startTime": starttime, "endTime": endtime, "groupID": "cwa2", "userID": "r0462183", "sensorData": batch_data,
         "meta": {}}]
    return batch


k = 0
while k == 0:
    if arduino.readline().strip() == '1995':
        k = 1
        batch = create_batch()

socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
socketIO.on('server_message', on_response)
a = socketIO.emit('start', json.dumps(data), on_response)
socketIO.wait(2)

socketIO.emit('batch-tripdata', json.dumps(batch), on_response)
socketIO.wait(5)

