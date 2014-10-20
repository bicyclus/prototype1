import serial
arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1184-if00-port0', 9600)

start = False
end = False

while start == False:
    if arduino.readline() == "Start":   
        start = True

while end == False:
    if arduino.readline() == "End":
        end = True
    Location = arduino.readline()
