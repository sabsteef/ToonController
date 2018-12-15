# ToonController
Control your hacked Toon Remotely from your Phone.

First of, all the credits goes to Sander Jonk (https://www.github.com/jonkootje). He made the initial app. 
I only wanted some aditional features. To look like the original Toon app.

## So what's been added:
- Logo Toon ( when added on the home screen)

<img src="https://github.com/sabsteef/ToonController/blob/master/Home%20Screen.jpeg" width="200"  alt="Toon Remote Controller on Home Screen">

- add aditional Tab with:
  - Power Now
  - Gas today.

## how does it look:

<img src="https://github.com/sabsteef/ToonController/blob/master/ToonControlFirstTab.png" width="300" align="left" alt="Toon Remote Controller Screen 1">

<img src="https://github.com/sabsteef/ToonController/blob/master/ToonControlSecondTab.png" width="300" alt="Toon Remote Controller Screen 2"> <br/>

## how do you in stall it:
1. Upload the software to a (local) website. like a NAS
2. go to /php/api.php
3. change the values to fit your environment.
```ruby
// SETTINGS - CHANGE THESE \/\/\/\/\/\/\/\/\/
$PASSWORD = 'Your complex Password'; // PASSWORD TO GET ACCESS TO TOON CONTROLLS
$PASSWORD_VERSION = 1; // INCREASE WHEN NEW PASSWORD (ALSO CHANGE IN INDEX.PHP)
$ADRESS = '0.0.0.0'; // LOCAL IP ADRESS OF TOON SERVER
$VERSION = '4.9'; // TOON VERSION (SUPPORTED: 4.8 / 4.9)
// END SETTINGS /\/\/\/\/\/\/\/\
```
4. if you want to control your Toon from the internet open a port form you firewall to your website. (NOT TO YOUR TOON!!)
5. On your Phone go to your website URL and enter "Your complex Password" :P
6. create a short cut to your home screen. for more info hoe to do this see here (https://www.howtogeek.com/196087/how-to-add-websites-to-the-home-screen-on-any-smartphone-or-tablet/)

## whats Next?!
Things i want to add:
- Add Toon Zon
- Add Hue Control
- add API on the Toon. To control toon from an external website securly.
- ?
