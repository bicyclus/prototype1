// Test code for Adafruit GPS modules using MTK3329/MTK3339 driver
//
// This code shows how to listen to the GPS module in an interrupt
// which allows the program to have more 'freedom' - just parse
// when a new NMEA sentence is available! Then access data when
// desired.
//
// Tested and works great with the Adafruit Ultimate GPS module
// using MTK33x9 chipset
//    ------> http://www.adafruit.com/products/746
// Pick one up today at the Adafruit electronics shop 
// and help support open source hardware & software! -ada

#include <Adafruit_GPS.h>
#include <SoftwareSerial.h>
#include <DHT.h>
#define DHTPIN 6
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

//  VARIABLES
#define pulsePin 14                 // Pulse Sensor purple wire connected to analog pin 0
//int blinkPin = 13;                // pin to blink led at each beat
//int fadePin = 5;                  // pin to do fancy classy fading blink at each beat
//int fadeRate = 0;                 // used to fade LED on with PWM on fadePin

// these variables are volatile because they are used during the rupt service routine!
volatile int BPM;                   // used to hold the pulse rate
volatile int Signal;                // holds the incoming raw data
volatile int IBI = 600;             // holds the time between beats, must be seeded! 
volatile boolean Pulse = false;     // true when pulse wave is high, false when it's low
volatile boolean QS = false;        // becomes true when Arduoino finds a beat.

SoftwareSerial mySerial(3, 2);

Adafruit_GPS GPS(&mySerial);

#define GPS_INTERVAL 250

SIGNAL(TIMER0_COMPA_vect) {
  char c = GPS.read();
}
void setup()  
{   
  // connect at 115200 so we can read the GPS fast enough and echo without dropping chars
  // also spit it out
  //pinMode(blinkPin,OUTPUT);         // pin that will blink to your heartbeat!
  //pinMode(fadePin,OUTPUT);          // pin that will fade to your heartbeat!
  Serial.begin(115200);             // we agree to talk fast!
  GPSsetup();
  HBSsetup();
  //interruptSetup();
}

void GPSsetup(){
   GPS.begin(9600);
  // We use RMC (recommended minimum data) and GGA (Fix data)
  GPS.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCGGA);

  // Set the update rate
  GPS.sendCommand(PMTK_SET_NMEA_UPDATE_1HZ);   // 1 Hz update rate
  // For the parsing code to work nicely and have time to sort through the data, and
  // print it out we don't suggest using anything higher than 1 Hz

  // the nice thing about this code is you can have a timer0 interrupt go off
  // every 1 millisecond, and read data from the GPS for you. that makes the
  // loop code a heck of a lot easier!
  OCR0A = 0xAF;
  TIMSK0 |= _BV(OCIE0A);
  // Ask for firmware version
  mySerial.println(PMTK_Q_RELEASE);
}

uint32_t timer_GPS = millis();

void read_GPS(){
  char c = GPS.read();
    if (GPS.newNMEAreceived()) {
    // a tricky thing here is if we print the NMEA sentence, or data
    // we end up not listening and catching other sentences! 
    // so be very wary if using OUTPUT_ALLDATA and trytng to print out data
    //Serial.println(GPS.lastNMEA());   // this also sets the newNMEAreceived() flag to false
  
    if (!GPS.parse(GPS.lastNMEA())){   // this also sets the newNMEAreceived() flag to false
      return;  // we can fail to parse a sentence in which case we should just wait for another
  }
}
  if(timer_GPS > millis()) timer_GPS = millis();
  if(millis()-timer_GPS < GPS_INTERVAL){
    return;
  }
timer_GPS = millis();
if (GPS.fix) {
Serial.println("1337");
Serial.println(GPS.latitude,4);
Serial.println(GPS.longitude,4);
}
}

int button=8;
int sensorValue;
uint32_t timer_HUMI_TEMP = millis();
#define HUMI_TEMP_INTERVAL 10000


void read_HUMI_TEMP(){
  if(timer_HUMI_TEMP > millis()) timer_HUMI_TEMP = millis();
  if(millis()-timer_HUMI_TEMP < HUMI_TEMP_INTERVAL){
    return;
  }  
   timer_HUMI_TEMP = millis();
   Serial.println("1234");
   Serial.println((float)dht.readHumidity(), 2);
   Serial.println((float)dht.readTemperature(), 2);

}


void loop()                     // run over and over again
{

  sensorValue = digitalRead(button);
  if (sensorValue == LOW) {
    Serial.println("1995");
    delay(100);
  }  
    if (sensorValue == HIGH) {
      read_GPS();
      read_HUMI_TEMP();
      read_HBS();    
   }
  }

