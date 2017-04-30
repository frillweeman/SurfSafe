$(function(){
    
    jQuery.post( "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyDCa1LUe1vOczX1hO_iGYgyo8p_jYuGOPU", getCityFromPosition)
  .fail(function(err) {
    console.log("API Geolocation error! \n\n"+err);
    show();
  });
    var lastText = "";
    var successFlag;
    
    var geocoder = new google.maps.Geocoder();
    
    var habs = [
        {
            lon: -82.46,
            lat: 27.07,
            r: 70
        },
        {
            lon: -80.61,
            lat: 28.31,
            r: 5
        },
        {
            lon: -85.38,
            lat: 29.76,
            r: 5
        },
        {
            lon: -85.67,
            lat: 30.09,
            r: 5
        }
    ];
    
    $(".explanation").hide();
    $("#main").hide();
    
    var autocomplete = new google.maps.places.Autocomplete((document.getElementById('city-title')),{types: ['(regions)']});
    
    autocomplete.addListener('place_changed', function(){
        var place = autocomplete.getPlace();
        console.log(place);
        
        var cityAndState = getCityAndState(place);
        var city = cityAndState.city;
        var state = cityAndState.state;
        
        if (city && state) {
            $("#city-title").val(city + ", " + state);
        } else {
            $("#city-title").val(lastText);
        }
        $("#city-title").blur();
        
        updateConditions(city, state);
    });
    
    var today = new Date();
    
    // Event Listeners
    $(".data-section").click(function(e){
        var sisters = e.currentTarget.children;
        for (el in sisters) {
            if (sisters[el].getAttribute("class") == "explanation") {
                $(sisters[el]).slideToggle();
                break;
            }
        }
    });
    
    $("#city-title").focusin(function(){
        $(this).select();
    });
    
    // Description Strings
    var lvl1 = "less than 18%: Apply SPF 15 sunscreen.";
    var lvl2 = "25-33%: Apply SPF 15+ sunscreen. Wear protective clothing and a hat.";
    var lvl3 = "42-50%: Apply SPF 15+ sunscreen. Wear protective clothing and UV-A&B sunglasses.";
    var lvl4 = "58-100%: Apply SPF 15+ sunscreen. Wear protective clothing and UV-A&B sunglasses. Avoid the sun between 10am and 4pm.";
    
//    getCityFromPosition({
//        coords: {
//            latitude: 34.0522,
//            longitude: -118.2437
//        }
//    });
    
    var uvBar = new ProgressBar.Line("#uv-index-bar", {
      strokeWidth: 4,
      easing: 'easeInOut',
      duration: 1400,
      trailColor: 'rgba(0,0,0,0)',
      trailWidth: 4,
      svgStyle: {width: '100%', height: '100%'},
      from: {color: '#FFEA82'},
      to: {color: '#ED6A5A'},
      step: (state, bar) => {
        bar.path.setAttribute('stroke', state.color);
      }
    });
    
    var cloudBar = new ProgressBar.Line("#cloud-bar", {
      strokeWidth: 4,
      easing: 'easeInOut',
      duration: 1400,
      trailColor: 'rgba(0,0,0,0)',
      trailWidth: 4,
      svgStyle: {width: '100%', height: '100%'},
      from: {color: '#A8E1FB'},
      to: {color: '#4696BC'},
      step: (state, bar) => {
        bar.path.setAttribute('stroke', state.color);
      }
    });
   
function getCityFromPosition(position) {
    var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.location.lat + "," + position.location.lng + "&key=AIzaSyCnQittOLn_6c7WPfFjm8eF2Nc1lUTJSWs";
    
    $.ajax({url: url, success: function(result){
        var components = result.results[0].address_components;
        
        var city = "";
        var state = "";
        
        // Check for City
        for (var comp in components) {
            for (type in components[comp].types) {
                if (components[comp].types[type] == "locality") {
                    city = components[comp].long_name;
                    break;
                } else if (components[comp].types[type] == "administrative_area_level_1") {
                    state = components[comp].short_name;
                    break;
                }
            }
            
            if (city != "" && state != "") {
                break;
            }
        }
        
        $("#city-title").val(city + ", " + state);
        
        updateConditions(city, state);
//        console.log("City: " + city + "\nState: " + state);
         
        
    }, error: function(){
        console.log("City not recognized.");
    }});
}
    
function getCityAndState(place) {
    var components = place.address_components;
    var city = "";
    var state = "";
    for (var comp in components) {
        for (type in components[comp].types) {
            if (components[comp].types[type] == "locality") {
                city = components[comp].long_name;
                break;
            } else if (components[comp].types[type] == "administrative_area_level_1") {
                state = components[comp].short_name;
                break;
            }
        }

        if (city != "" && state != "") {
            break;
        }
    }
    return {city: city, state: state};
}
    
function updateConditions(city, state) {
    successFlag = false;
    setTimeout(function(){
        if (!successFlag) {
            loading();
        }
    }, 1000);
    
    // Old Key: 3624625ca3fb7947
    
    city = city.replace(" ", "_");
    var wuRequest = "http://api.wunderground.com/api/46b810d6f766daf0/hourly/q/" + state + "/" + city + ".json";
    $.ajax({url: wuRequest, success: function(result){
        successFlag = true;
        var uvi = result.hourly_forecast[0].uvi;
        var clouds = result.hourly_forecast[0].sky;

        // Find max uvi
        var maxUVI = result.hourly_forecast[0].uvi;
        for (i in result.hourly_forecast) {
            if (result.hourly_forecast[i].FCTTIME.hour >= 10) {
                if (result.hourly_forecast[i].uvi > maxUVI) {
                    maxUVI = result.hourly_forecast[i].uvi;
                }
            }

            if (result.hourly_forecast[i].FCTTIME.hour > 16) {
                break;
            }
        }

        console.log(result);
        console.log("Max UVI: " + maxUVI);

        var uviPercent = uvi / 12.0;

        console.log("UVI: " + uvi);
        console.log("UVI percent: " + uviPercent);
        console.log("Cloud Cover: " + clouds);

        // Set status bar at top
        var statusBar = $("#status");
        var tip = $("#sun-tip");
        var statusString;
        var statusColor;

        // Status
        if (maxUVI <= 2) {
            statusString = "Sun exposure levels are lower than normal today. Enjoy your time at the beach.";
            statusColor = "#22A100";
        } else if (maxUVI <= 4) {
            statusString = "Sun exposure levels are relatively low today, but don't forget your sunscreen.";
            statusColor = "#FFD400";
        } else if (maxUVI <= 6) {
            statusString = "Sun exposure levels are moderate today. Don't forget sunscreen, sunglasses, and protective clothing.";
            statusColor = "#FF9C1C";
        } else {
            statusString = "Sun exposure levels are higher than normal today. ";
            var hours = today.getHours();
            if (hours < 10) {
                statusString += "Avoid the beach between 10am and 4pm.";
                statusColor = "#FF9C1C";
            } else if (hours >= 10 && hours < 16) {
                statusString += "Wait until 4pm before going to the beach."
                statusColor = "#FF4016";
            } else {
                statusString += "However, it's safe to go to the beach now.";
                statusColor = "#22A100";
            }
        }

        if (uvi <= 2) {
            tip.text(lvl1);
        } else if (uvi <= 4) {
            tip.text(lvl2);
        } else if (uvi <= 6) {
            tip.text(lvl3);
        } else {
            tip.text(lvl4);
        }
        
        statusBar.text(statusString);
        statusBar.css("background", statusColor);
        
        var lat, lon;
        
        geocoder.geocode({address: city + ", " + state}, function(results, status) {
            if (status == "OK") {
                var pos = results[0].geometry.location;
                lat = pos.lat();
                lon = pos.lng();
            }
            
            var habColor = "#05B80A";
            var habText = "SAFE";
            var habTip = "No HAB colonies found in this area.";
        
        for (hab in habs) {
            var dist = getDistanceFromLatLonInKm(lat, lon, habs[hab].lat, habs[hab].lon);
            
            console.log(dist);
            
            if (dist <= habs[hab].r) {
                habColor = "#FF4016";
                habText = "HAZARD";
                habTip = "HAB colonies detected in this area. Use caution.";
                break;
            }
        }
        
        var habBar = $("#hab-bar");
        habBar.css("background", habColor);
        $("#hab-num").text(habText);
        $("#hab-tip").text(habTip);
        habBar.hide();
        
        
        loaded();
        
        uvBar.animate(uviPercent);
        $("#uvi-num").text(Math.round(uviPercent * 100) + "%");
        var tip = $("#sun-tip");

        cloudBar.animate(clouds / 100);
        $("#cloud-num").text(clouds + "%");
        
        habBar.show(500);
        })
        
    }}); 
}
    
function loaded() {
    $("#loading").hide(500);
    $("#main").slideDown(500);
}

function loading() {
    $("#main").slideUp(500);
    $("#loading").slideDown(500);
}
    
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 3959; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

});