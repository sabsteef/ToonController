



var toon = {
    "setState":function(state) {
        var states = {
            "comfort": 0,
            "home": 1,
            "sleep": 2,
            "away": 3
        };
        var changestate = states[state];

        if (typeof(changestate) == 'undefined') {
            console.error('Invalid state change');
            return false;
        } else {


            var url = 'php/api.php?action=changeSchemeState&state=2&temperatureState=' + changestate;

            // Show new state before even requesting
            var lastdata = dashboard.lastData;
            lastdata.activeState = changestate;
            dashboard.fillData(lastdata);

            $.ajax({
                "url":url,
                "dataType":"JSON",
                "method":"POST",
                "data":{
                    "command":"app"
                },
                "success":function(resp) {
                    if (resp.success) {
                        console.log('Successfully changed state');
                        dashboard.refresh();
                    } else {
                        location.reload();
                    }
                },
                "failure":function(resp) {
                    console.error('Failure');
                },
                "error":function(resp) {
                    console.error('Failure');
                }
            });
        }
    },
    "sendTempOn":null,
    "sendDelay":2000,
    "isIncreasing":false,
    "increaseTemp":function() {
        this.isIncreasing = true;

        var current = parseInt(dashboard.lastData.currentSetpoint);
        current += 50;
        dashboard.lastData.currentSetpoint = String(current);

        dashboard.fillData(dashboard.lastData);

        this.sendTempOn = (new Date()).getTime() + this.sendDelay;
        setTimeout(function() {
            if (toon.sendTempOn < (new Date).getTime()) {
                toon.isIncreasing = false;
                toon.sendTemp();
            }
        }, this.sendDelay + 10);

        $('.tempmonitor_parent').addClass('switch');

        return true;
    },
    "decreaseTemp":function() {
        this.isIncreasing = true;

        var current = parseInt(dashboard.lastData.currentSetpoint);
        current -= 50;
        dashboard.lastData.currentSetpoint = String(current);

        dashboard.fillData(dashboard.lastData);

        this.sendTempOn = (new Date()).getTime() + this.sendDelay;
        setTimeout(function() {
            if (toon.sendTempOn < (new Date).getTime()) {
                toon.isIncreasing = false;
                toon.sendTemp();
            }
        }, this.sendDelay + 10);

        $('.tempmonitor_parent').addClass('switch');

        return true;
    },
    "sendTemp":function() {
        var temp = dashboard.lastData.currentSetpoint;
        var url = 'php/api.php?action=setSetpoint&Setpoint=' + temp;

        $('.tempmonitor_parent').removeClass('switch');

        $.ajax({
            "url":url,
            "dataType":"JSON",
            "method":"POST",
            "data":{
                "command":"app"
            },
            "success":function(resp) {
                if (resp.success) {
                    console.log('Successfully changed temperature');
                    dashboard.refresh();
                } else {
                    location.reload();
                }
            },
            "error":function(resp) {
                console.error('Failed to change temp');
            },
            "failure":function(resp) {
                console.error('Failed to change temp');
            }
        })
    },
    "toggleProgram":function() {
        var program = parseInt(dashboard.lastData.nextProgram);
        if (program == 1) {
            // ON - TURN OFF
            var url = 'php/api.php?action=changeSchemeState&state=0';
            dashboard.lastData.nextProgram = -1;
        } else {
            // OFF - TURN ON
            var url = 'php/api.php?action=changeSchemeState&state=1';
            dashboard.lastData.nextProgram = 1;
        }

        dashboard.fillData(dashboard.lastData);
        $('#comming').html('');

        $.ajax({
            "url":url,
            "dataType":"JSON",
            "method":"POST",
            "data":{
                "command":"app"
            },
            "success":function(resp) {
                if (resp.success) {
                    console.log('Successfully toggled program');
                    dashboard.refresh();
                } else {
                    location.reload();
                }
            },
            "error":function(resp) {
                console.error('Failed to toggle program');
            },
            "failure":function(resp) {
                console.error('Failed to toggle program');
            }
        });
    }
}

var dashboard = {
    "lastData":{},
    "intervalID":null,
    "startRefresh":function() {
        rate = 1;

        rate = rate * 1000;

        this.intervalID = setInterval(function() {
            dashboard.refresh();
        }, rate);

        dashboard.refresh();

        return true;
    },
    "refresh":function(forcerefresh) {

        if (typeof(forcerefresh) == 'undefined') {var forcerefresh = false;}

        if (!toon.isIncreasing || forcerefresh) {
            console.log('refreshing');

            var url = 'php/api.php?action=getThermostatInfo';
            $.ajax({
                "url":url,
                "method":"POST",
                "data":{
                    "command":"app"
                },
                "dataType":"JSON",
                "success":function(resp) {
                    if (resp.success) {
                        $('.connection_status').html('Verbonden');
                        $('.connection').removeClass('loading')
                            .removeClass('disconnected')
                            .addClass('connected');


                        if (!toon.isIncreasing) {
                            dashboard.fillData(resp.return);
                            GetCurrentPower();
                            GetGasData();
                        }

                    } else {
                        location.reload();
                    }
                },
                "failure":function(resp) {
                    console.error('Could not connect');
                    dashboard.fillData({
                        "currentTemp":0,
                        "currentSetpoint":0,
                        "activeState":-1,
                        "nextProgram":-1
                    });
                    $('.connection_status').html('Niet verbonden');
                    $('.connection').removeClass('loading')
                        .addClass('disconnected')
                        .removeClass('connected');

                },
                "error":function(resp) {
                    console.error('Could not connect');
                    dashboard.fillData({
                        "currentTemp":0,
                        "currentSetpoint":0,
                        "activeState":-1,
                        "nextState":-1,
                        "nextTime":-1,
                        "nextProgram":-1
                    });
                    $('#GasToday').html("0 m3");
                    $('#PowerWattNow').html("0 Watt");
                    $('#PowerWattToday').html("0 kWh");
                    setProgress(0, 1000 ,elec);
                    setProgress(0,12,gas);

                    $('.connection_status').html('Niet verbonden');
                    $('.connection').removeClass('loading')
                        .addClass('disconnected')
                        .removeClass('connected');
                },
                "timeout":5000
            });
        } else {
            console.log('Skipping refresh, is increasing');
        }
    },
    "fillData":function(data) {
        this.lastData = data;
        console.log('Filling data', data);

        // TEMPERATURE MONITOR CODE
        var currentTemp = String(Math.round(parseInt(data.currentTemp) / 10) / 10).replace('.', ',');
        var currentSetpoint = String(Math.round(parseInt(data.currentSetpoint) / 10) / 10).replace('.', ',');

        $('#current_temp').html(currentTemp);
        $('#target_temp').html(currentSetpoint);

        $('#target_temp')
            .removeClass('less')
            .removeClass('more');

        if (parseFloat(currentSetpoint.replace(',', '.')) > parseFloat(currentTemp.replace(',', '.'))) {
            // More
            $('#target_temp').addClass('more');
        } else {
            // Less
            $('#target_temp').addClass('less');
        }


        // CURRENT PROGRAM CODE
        var buttons = [
            "comfort",
            "home",
            "sleep",
            "away"
        ];
        var program = parseInt(data.activeState);
        $('.programbtn').removeClass('active');
        if (program !== -1) {
            console.log('.act_' + buttons[program], $('.act_' + buttons[program]));
            $('.act_' + buttons[program]).addClass('active');
        }



        // NEXT PROGRAM CODE
        if (parseInt(data.nextProgram) == 1) {
            var language = [
                'Comfort',
                'Thuis',
                'Slapen',
                'Weg',
                "Handmatig"
            ];
            if (data.nextState == -1) {
                data.nextState = 4;
            }

            var now = new Date(parseInt(data.nextTime) * 1000);
            var hours = now.getHours();
            var minutes = now.getMinutes();

            if (minutes < 10) {
                var minutes = "0" + String(minutes);
            }

            var time = hours + ':' + minutes;
            if (data.nextTime == -1) {
                time = '--:--';
            }
            var string = 'Om ' + time + ' op ' + language[data.nextState];
            $('#toggleprogram').addClass('active');
        } else {
            var string = 'Programma uit';
            $('#toggleprogram').removeClass('active');
        }
        $('#comming').html(string);


        // BURNER CODE
        if (parseInt(data.burnerInfo) == 1) {
            // Burner is active
            $('#burner').attr('src', 'img/icon-heating.svg');
        } else {
            // Burner is not active
            $('#burner').attr('src', 'img/icon-heating-na.svg');
        }

        return true;
    },
// Fix for getting the correct gas uses a day. cannot get it from to so need to caculate
    "fillDataGas":function(data) {
        this.lastDatagas = Object.values(data);
        console.log("Gas metervalues" + Object.values(data));
        var metervalues = Object.values(data)
        //console.log('gas meter value first', metervalues[0]);
        //console.log('gas meter value last', metervalues[1]);
        var gasValue = (metervalues[1] - metervalues[0]) /1000;
        console.log('gas used total ', gasValue.toFixed(2));
        $('#GasToday').html(gasValue.toFixed(2)+ " m3");
        setProgress(gasValue.toFixed(2),12,gas);
        return true;
    },

  // add for Power options

  "fillCurrentPower":function(data) {
      this.CurrentPower = data;
      console.log('Filling NOW data', data);
      var Elec = this.CurrentPower["powerUsage"];
      //var Gas  = this.lastDataNOW["gasUsage"];
      $('#PowerWattNow').html(Elec.value + " Watt");
      $('#PowerWattToday').html(Elec.value+ " kWh");
      setProgress(Elec.value,2000,elec);
      return true;
  }
}

// add for Power grafic

function setProgress(calcper, Maxvalue, type) {
   percent = (calcper / Maxvalue) *100
        if(percent > 100) percent = 100;
        if(percent < 0) percent = 0;
       if (0 < percent  && percent  < 10)
         {percent = 10 };
       if (10 < percent  && percent  < 20)
         {percent = 20};
       if (20 < percent  && percent  < 30)
         {percent = 30};
       if (30 < percent  && percent  < 40)
         {percent = 40};
       if (40 < percent  && percent  < 50)
         {percent = 50};
       if (50 < percent  && percent  < 60)
          {percent = 60};
       if (60 < percent  && percent  < 70)
          {percent = 70};
       if (70 < percent  && percent  < 80)
          {percent = 80};
       if (80 < percent  && percent  < 90)
          {percent = 90};
       if (90 < percent  && percent  < 100)
          {percent = 100};

   type(percent);
 }

function elec(percent){
  if(percent == 0){
  $('#path10').css({ fill: "#94989e"});
  $('#path9').css({ fill: "#94989e" });
  $('#path8').css({ fill: "#94989e" });
  $('#path7').css({ fill: "#94989e" });
  $('#path6').css({ fill: "#94989e" });
  $('#path5').css({ fill: "#94989e" });
  $('#path4').css({ fill: "#94989e" });
  $('#path3').css({ fill: "#94989e" });
  $('#path2').css({ fill: "#94989e" });
  $('#path1').css({ fill: "#94989e" });
     }
  if (percent == 10){
    //Set Meter to 10%
    $('#path10').css({ fill: "#94989e" });
    $('#path9').css({ fill: "#94989e" });
    $('#path8').css({ fill: "#94989e" });
    $('#path7').css({ fill: "#94989e" });
    $('#path6').css({ fill: "#94989e" });
    $('#path5').css({ fill: "#94989e" });
    $('#path4').css({ fill: "#94989e" });
    $('#path3').css({ fill: "#94989e" });
    $('#path2').css({ fill: "#94989e" });
    $('#path1').css({ fill: "#00695C" });
  }
  if (percent == 20){
    //Set Meter to 20%
  $('#path10').css({ fill: "#94989e" });
  $('#path9').css({ fill: "#94989e" });
  $('#path8').css({ fill: "#94989e" });
  $('#path7').css({ fill: "#94989e" });
  $('#path6').css({ fill: "#94989e" });
  $('#path5').css({ fill: "#94989e" });
  $('#path4').css({ fill: "#94989e" });
  $('#path3').css({ fill: "#94989e" });
  $('#path2').css({ fill: "#388E3C" });
  $('#path1').css({ fill: "#00695C" });
  }
  if (percent == 30){
    //Set Meter to 30%
  $('#path10').css({ fill: "#94989e" });
  $('#path9').css({ fill: "#94989e" });
  $('#path8').css({ fill: "#94989e" });
  $('#path7').css({ fill: "#94989e" });
  $('#path6').css({ fill: "#94989e" });
  $('#path5').css({ fill: "#94989e" });
  $('#path4').css({ fill: "#94989e" });
  $('#path3').css({ fill: "#689F38" });
  $('#path2').css({ fill: "#388E3C" });
  $('#path1').css({ fill: "#00695C" });
  }
  if (percent == 40){
    //Set Meter to 40%
  $('#path10').css({ fill: "#94989e" });
  $('#path9').css({ fill: "#94989e" });
  $('#path8').css({ fill: "#94989e" });
  $('#path7').css({ fill: "#94989e" });
  $('#path6').css({ fill: "#94989e" });
  $('#path5').css({ fill: "#94989e" });
  $('#path4').css({ fill: "#94989e" });
  $('#path3').css({ fill: "#689F38" });
  $('#path2').css({ fill: "#388E3C" });
  $('#path1').css({ fill: "#00695C" });
  }
  if (percent == 50){
    //Set Meter to 50%
  $('#path10').css({ fill: "#94989e" });
  $('#path9').css({ fill: "#94989e" });
  $('#path8').css({ fill: "#94989e" });
  $('#path7').css({ fill: "#94989e" });
  $('#path6').css({ fill: "#94989e" });
  $('#path5').css({ fill: "#FDD835" });
  $('#path4').css({ fill: "#C0CA33" });
  $('#path3').css({ fill: "#689F38" });
  $('#path2').css({ fill: "#388E3C" });
  $('#path1').css({ fill: "#00695C" });
  }
  if (percent == 60){
    //Set Meter to 60%
  $('#path10').css({ fill: "#94989e" });
  $('#path9').css({ fill: "#94989e" });
  $('#path8').css({ fill: "#94989e" });
  $('#path7').css({ fill: "#94989e" });
  $('#path6').css({ fill: "#FBC02D" });
  $('#path5').css({ fill: "#FDD835" });
  $('#path4').css({ fill: "#C0CA33" });
  $('#path3').css({ fill: "#689F38" });
  $('#path2').css({ fill: "#388E3C" });
  $('#path1').css({ fill: "#00695C" });
  }
  if (percent == 70){
    //Set Meter to 70%
  $('#path10').css({ fill: "#94989e" });
  $('#path9').css({ fill: "#94989e" });
  $('#path8').css({ fill: "#94989e" });
  $('#path7').css({ fill: "#FFA000" });
  $('#path6').css({ fill: "#FBC02D" });
  $('#path5').css({ fill: "#FDD835" });
  $('#path4').css({ fill: "#C0CA33" });
  $('#path3').css({ fill: "#689F38" });
  $('#path2').css({ fill: "#388E3C" });
  $('#path1').css({ fill: "#00695C" });
  }
  if (percent == 80){
    //Set Meter to 80%
  $('#path10').css({ fill: "#94989e" });
  $('#path9').css({ fill: "#94989e" });
  $('#path8').css({ fill: "#EF6C00" });
  $('#path7').css({ fill: "#FFA000" });
  $('#path6').css({ fill: "#FBC02D" });
  $('#path5').css({ fill: "#FDD835" });
  $('#path4').css({ fill: "#C0CA33" });
  $('#path3').css({ fill: "#689F38" });
  $('#path2').css({ fill: "#388E3C" });
  $('#path1').css({ fill: "#00695C" });
  }
  if (percent == 90){
    //Set Meter to 90%
  $('#path10').css({ fill: "#94989e" });
  $('#path9').css({ fill: "#E64A19" });
  $('#path8').css({ fill: "#EF6C00" });
  $('#path7').css({ fill: "#FFA000" });
  $('#path6').css({ fill: "#FBC02D" });
  $('#path5').css({ fill: "#FDD835" });
  $('#path4').css({ fill: "#C0CA33" });
  $('#path3').css({ fill: "#689F38" });
  $('#path2').css({ fill: "#388E3C" });
  $('#path1').css({ fill: "#00695C" });
  }
  if (percent == 100){
    //Set Meter to 100%
  $('#path10').css({ fill: "#DD2C00" });
  $('#path9').css({ fill: "#E64A19" });
  $('#path8').css({ fill: "#EF6C00" });
  $('#path7').css({ fill: "#FFA000" });
  $('#path6').css({ fill: "#FBC02D" });
  $('#path5').css({ fill: "#FDD835" });
  $('#path4').css({ fill: "#C0CA33" });
  $('#path3').css({ fill: "#689F38" });
  $('#path2').css({ fill: "#388E3C" });
  $('#path1').css({ fill: "#00695C" });
  }
}
function gas(percent)
{
  if(percent == 0){
  $('#darkBluefull').css({ fill: "#DCDCDC" });
  $('#lightBluefull').css({ fill: "#DCDCDC" });
  $('#lightBlue').css({ fill: "#DCDCDC" });
  $('#darkBlue').css({ fill: "#DCDCDC" });
  }
   if(1 == percent || 1 < percent  && percent  < 50){
   $('#darkBluefull').css({ fill: "#DCDCDC" });
   $('#lightBluefull').css({ fill: "#69F" });
   $('#lightBlue').css({ fill: "#DCDCDC" });
   $('#darkBlue').css({ fill: "#DCDCDC" });
    }

  if(50 == percent ||50 < percent  && percent  < 70){
   $('#darkBluefull').css({ fill: "#DCDCDC" });
   $('#lightBlue').css({ fill: "#69F" });
   $('#lightBluefull').css({ fill: "#69F" });
   $('#darkBlue').css({ fill: "#DCDCDC" });
     }

  if(70 == percent ||70 < percent && percent  < 90){
   $('#darkBlue').css({ fill: "#DCDCDC" });
   $('#darkBlue').css({ fill: "#295FCC" });
   $('#lightBluefull').css({ fill: "#69F" });
   $('#lightBlue').css({ fill: "#69F" });
     }
   if( 90 == percent || 90 < percent  ){
    $('#darkBlue').css({ fill: "#295FCC" });
    $('#darkBluefull').css({ fill: "#295FCC" });
    $('#lightBluefull').css({ fill: "#69F" });
    $('#lightBlue').css({ fill: "#69F" });
    }

  }

function openTab(evt, TabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(TabName).style.display = "block";
    evt.currentTarget.className += " active";
}


    function GetCurrentPower() {
        // get meter info
        var url = 'php/api.php?action=GetCurrentUsage';

        $.ajax({
            "url":url,
            "dataType":"JSON",
            "method":"POST",
            "data":{
                "command":"GCP"
            },
            "success":function(resp) {
                if (resp.success) {
                    console.log('get CurrentElectricityFlow');
                      // get data
                      dashboard.fillCurrentPower(resp.return);
                    //dashboard.refresh()
                } else {
                    console.log('error: get CurrentElectricityFlow');
                }
            },
            "failure":function(resp) {
                console.log('Failure:get CurrentElectricityFlow');
            },
            "error":function(resp) {
              console.log('Error get CurrentElectricityFlow' + resp);
            }
        });
    }

    // created own function. Toon cannot get the correct gasUsage
    function GetGasData() {
        // Data of today
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        var day = yesterday.getDate();
        var month = yesterday.getMonth()+ 1; //needed to fix month
        var year = yesterday.getFullYear();
        // calculated day of yesterday in dd-mm-yyyy format
        var daybefore = day + "-" + month + "-" + year;

        // get meter info
      var url = 'php/api.php?action=getRrdData&loggerName=gas_quantity&rra=10yrdays&from='+ daybefore;
$.ajax({
    "url":url,
    "dataType":"JSON",
    "method":"POST",
    "data":{
        "command":"GAS"
    },
    "success":function(resp) {
        if (resp.success) {
            console.log('Get gas values');
              // get data
              dashboard.fillDataGas(resp.return);
            //dashboard.refresh()
        } else {
            console.log('error geting data gas'+ resp);
        }
    },
    "failure":function(resp) {
        console.log('Failure geting data gas');
    },
    "error":function(resp) {
      console.log('Error' + resp);
    }
});
    }



function initialize() {

    $('.programbtn').click(function() {
        toon.setState(this.dataset.state);
    });

    $('.tempchange.increase').click(function() {
        toon.increaseTemp();
    });
    $('.tempchange.decrease').click(function() {
        toon.decreaseTemp();
    });
    $('#toggleprogram').click(function() {
        toon.toggleProgram();
    })
    // set open default tab
    document.getElementById("defaultOpen").click();
    dashboard.startRefresh();
    return true;
}

$(document).ready(function() {

    initialize();
});
