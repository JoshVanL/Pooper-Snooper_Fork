angular.module('PooperSnooper.controllers', ['ionic', 'ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})


/* ------------------------------------------------ */
/* ------------ Record Logs Controller ------------ */
/* ------------------------------------------------ */
.controller('RecordLogsCtrl', function($scope, $ionicModal, $filter, GlobalService) {
	
	//Update record logs from the factory service upon entering page
	$scope.$on('$ionicView.afterEnter', function() {
		$scope.records = angular.copy(GlobalService.get_doggyRecords());
	});
	
	// Blank form used reset fields
	$scope.record = {
    date: "",
    time: "",
		location: ""
  }
	// Blank form used to reset fields
	var emptyForm = angular.copy($scope.record);
	
	// Create and load the Modal
  $ionicModal.fromTemplateUrl('templates/newRecord.html', function(modal) {
    $scope.recordModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });
	
	// Called when the form is submitted
  $scope.createRecord = function(record) {
		if (record.location.length > 0){
			GlobalService.push_doggyRecords({
				date: record.date,
				time: record.time,
				location: record.location
			});
			
			$scope.records = angular.copy(GlobalService.get_doggyRecords());
			
			//Close Modal and reset fields
			$scope.recordModal.hide();
			$scope.record = angular.copy(emptyForm);
		}
		else {
			console.log("Location not entered!");
		}
  };

  // Open our new record modal
  $scope.newRecord = function() {
    $scope.recordModal.show();
  };

  // Close the new record modal
  $scope.closeNewRecord = function() {
    $scope.recordModal.hide();
		$scope.record = angular.copy(emptyForm);
  };
	
	// Finds current location using GPS
	$scope.findLocation = function() {
		console.log("findLocation pressed!");
	};

})

/* ----------------------------------------------------------- */
/* --------------------- Map Controller ---------------------- */
/* ----------------------------------------------------------- */

//Note : removed $state from dependencies (dunno what it did!)
.controller('MapCtrl', function($scope, $cordovaGeolocation, $ionicModal,
$window, $ionicPopup, $ionicLoading, $rootScope, $cordovaNetwork, $ionicSideMenuDelegate,
GlobalService, ConnectivityMonitor) {
	
	//Disables swipe to side menu feature on entering page
	$scope.$on('$ionicView.enter', function () { 
		$ionicSideMenuDelegate.canDragContent(false);
	});
	//Re-enables swipe to side menu feature on exit page
	$scope.$on('$ionicView.leave', function () { 
		$ionicSideMenuDelegate.canDragContent(true); 
	});
	
	//------------------------->
	//--- Initial resources --->
	//------------------------>
	var apiKey = "AIzaSyD1-OU4tSucidW9oHkB5CCpLqSUT5fcl-E";
	var map = null;
	var latLng = null;
	
	var markerCache = [];			// Cache of all markerData. THESE ARE NOT REFERENCES TO MARKER OBJECTS!
	var binMarkerCache = [];	// Cache of all (REFERENCES TO) BIN MARKER OBJECTS (hide/show)
	
	var myLocationMarker; 				// Used to remove old marker to update current location
	
	var nearestBinMarker;					// Reference to the nearest bin marker (original) that we hide and
																// replace with the GIF marker indicating the nearest bin
	var tempBinMarker;					// Reference to a temp Marker (gif) that indicates where the nearest bin is

	// Icon resources
	var poop_icon = {
    url: "img/Assets/poop.png",
    scaledSize: ''
	};
	var bin_icon = {
    url: "img/Assets/dog_bin.png",
    scaledSize: ''
	};
	var indicator_icon = {
		url: "img/Assets/nearest-bin.gif",
		scaledSize: ''
	}
	
	// Fixes the error where opening a modal would cause the map to 'break' 
	$scope.$on('$ionicView.afterEnter', function() {
		ionic.trigger('resize');
	});

	//------------------------->
	//--- Initializing phase--->
	//------------------------>
	
	if(typeof google == "undefined" || typeof google.maps == "undefined"){

		console.warn("Google Maps SDK needs to be loaded");

		disableMap();

		if(ConnectivityMonitor.isOnline()){
			loadGoogleMaps();
		}
	}
	else {
		if(ConnectivityMonitor.isOnline()){
			initMap();
			enableMap();
		} else {
			disableMap();
		}
	}

	addConnectivityListeners();
	
	// Initialises Map element and gets current location
	function initMap(){
		var options = {timeout: 10000, enableHighAccuracy: true};
		
		$cordovaGeolocation.getCurrentPosition(options).then(function(position){
			
			poop_icon.scaledSize = new google.maps.Size(25, 25);
			bin_icon.scaledSize = new google.maps.Size(40, 40);
			
			latLng = new google.maps.LatLng(position.coords.latitude,
									 position.coords.longitude);
	 
			var mapOptions = {
				center: latLng,
				zoom: 16,
				//zoom: 15,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				mapTypeControl: false,
				streetViewControl: false
				//fullscreenControl: false
			};
			
			$scope.map = new google.maps.Map(document.getElementById("map"),
									 mapOptions);
			
			// Wait until the map is loaded and add Marker to current location
			google.maps.event.addListenerOnce($scope.map, 'idle', function(){
				
				// -------------------------------------------------
				// CREATING DUMMY MARKERS TO TEST LOADING FUNCTION
				// -------------------------------------------------
				
				var poopLats = [];
				var poopLngs = [];
				
				var binLats = [];
				var binLngs = [];
				
				//POOPS
				poopLats.push(53.650705);poopLngs.push(-2.986479);
				poopLats.push(53.646291);poopLngs.push(-2.975814);
				poopLats.push(53.648237);poopLngs.push(-2.969313);
				poopLats.push(53.648924);poopLngs.push(-2.979956);
				poopLats.push(53.648698);poopLngs.push(-2.978786);
				
				poopLats.push(53.650212);poopLngs.push(-2.979301);
				poopLats.push(53.650428);poopLngs.push(-2.97781);
				poopLats.push(53.64459966505379);poopLngs.push(-2.994503974914551);
				poopLats.push(53.647003665191235);poopLngs.push(-3.0152535438537598);
				poopLats.push(53.63496957119772);poopLngs.push(-2.972745895385742);
				
				poopLats.push(53.65099730954873);poopLngs.push(-2.958498001098633);
				poopLats.push(53.665951037123044);poopLngs.push(-2.9844188690185547);
				poopLats.push(53.66035672614186);poopLngs.push(-2.9656219482421875);
				poopLats.push(53.65567727758958);poopLngs.push(-2.994203567504883);
				poopLats.push(53.65588074267648);poopLngs.push(-2.9915428161621094);
				
				poopLats.push(53.652014738097655);poopLngs.push(-3.0062198638916016);
				poopLats.push(53.64692734983276);poopLngs.push(-3.0028724670410156);
				poopLats.push(53.64453606530589);poopLngs.push(-3.004159927368164);
				poopLats.push(53.63980397503522);poopLngs.push(-2.9929161071777344);
				poopLats.push(53.64061813590609);poopLngs.push(-2.9761791229248047);
				
				poopLats.push(53.642551704992265);poopLngs.push(-2.983388900756836);
				poopLats.push(53.643620218301244);poopLngs.push(-2.9889678955078125);
				poopLats.push(53.6473343634821);poopLngs.push(-2.994718551635742);

				// BINS
				binLats.push(53.64986539143778);binLngs.push(-2.979719638824463);
				binLats.push(53.648237410988955);binLngs.push(-2.9790759086608887);
				binLats.push(53.648046627915676);binLngs.push(-2.976651191711426);
				binLats.push(53.64901325326107);binLngs.push(-2.972724437713623);
				binLats.push(53.64952199454264);binLngs.push(-2.9810070991516113);
				
				binLats.push(53.65190027861155);binLngs.push(-2.980320453643799);
				binLats.push(53.645693565705784);binLngs.push(-2.979912757873535);
				binLats.push(53.644421585517954);binLngs.push(-2.975621223449707);
				binLats.push(53.647995752283684);binLngs.push(-2.9686689376831055);
				binLats.push(53.65287953306066);binLngs.push(-2.9754281044006348);
				
				binLats.push(53.650908283382584);binLngs.push(-2.9842472076416016);
				binLats.push(53.651366130234585);binLngs.push(-2.9871439933776855);
				binLats.push(53.64966189731898);binLngs.push(-2.9906201362609863);
				binLats.push(53.64691463059291);binLngs.push(-2.9868650436401367);
				binLats.push(53.64303508341375);binLngs.push(-2.9854488372802734);
				
				binLats.push(53.641597652376625);binLngs.push(-2.9799342155456543);
				binLats.push(53.63975308945901);binLngs.push(-2.9735398292541504);
				binLats.push(53.636292726261026);binLngs.push(-2.971973419189453);
				binLats.push(53.63602555406321);binLngs.push(-2.9680681228637695);
				binLats.push(53.641534048101576);binLngs.push(-2.9661154747009277);
				
				poop_icon.scaledSize = new google.maps.Size(30, 30);
				bin_icon.scaledSize = new google.maps.Size(40, 40);
				
				for (i = 0; i < 23; i++){
					var myLatLng = new google.maps.LatLng({lat: poopLats[i], lng: poopLngs[i]});
					var marker = new google.maps.Marker({
							position: myLatLng,
							icon: poop_icon
					});   
					var markerData = {
						lat: marker.getPosition().lat(),
						lng: marker.getPosition().lng(),
						icon: marker.getIcon().url
					};
					GlobalService.push_poopMarkers(markerData);
				}
				
				for (i = 0; i < 20; i++){
					var myLatLng = new google.maps.LatLng({lat: binLats[i], lng: binLngs[i]});
					var marker = new google.maps.Marker({
							position: myLatLng,
							icon: bin_icon
					});   
					var markerData = {
						lat: marker.getPosition().lat(),
						lng: marker.getPosition().lng(),
						icon: marker.getIcon().url
					};
					GlobalService.push_binMarkers(markerData);
				}
				
				// CURRENT LOCATION Marker
				var marker = new google.maps.Marker({
					map: $scope.map,
					animation: google.maps.Animation.DROP,
					draggable: true,
					position: latLng
				});    
				myLocationMarker = marker;
				
				loadMarkers();
				
				//Reload markers every time the map moves
        google.maps.event.addListener($scope.map, 'dragend', function(){
          loadMarkers();
        });
 
        //Reload markers every time the zoom changes
        google.maps.event.addListener($scope.map, 'zoom_changed', function(){
					loadMarkers();
        });
				
				enableMap();
			
			});

		}, function(error){
			console.log("Could not get location");
		});
	}
	
	//------------------------------->
	//---- Map related Functions ---->
	//------------------------------>
	
	// Refreshes the map - currently has some unknown stutter ...
	$scope.refreshMap = function(){
		
		myLocationMarker.setMap(null);
		
		//document.getElementById("pinPointContainer").style.opacity = 0.3;
		
		var options = {timeout: 10000, enableHighAccuracy: true};
		
		$cordovaGeolocation.getCurrentPosition(options).then(function(position){
			
			latLng = new google.maps.LatLng(position.coords.latitude,
									 position.coords.longitude);
			
			$scope.map.setCenter(latLng);
			
			var marker = new google.maps.Marker({
					map: $scope.map,
					animation: google.maps.Animation.DROP,
					position: latLng
			});
			
			myLocationMarker = marker;
			
		}, function(error){
			console.log("Could not get location");
		});
	}

	// Special panel click event function to add markers
	$scope.handleIconPress = function() {	
	
		//Converts screen coordinates to latLng
		var topRight = $scope.map.getProjection().fromLatLngToPoint(
		$scope.map.getBounds().getNorthEast());
		
		var bottomLeft = $scope.map.getProjection().fromLatLngToPoint(
		$scope.map.getBounds().getSouthWest());
		
		var scale = Math.pow(2, $scope.map.getZoom());
		
		var worldPoint = new google.maps.Point(GlobalService.get_onScreenX() 
										 /scale + bottomLeft.x,(GlobalService.get_onScreenY()
										 -(0.0676 * $window.innerHeight)) / scale + topRight.y);	
										 
		//6.76% = Nav bar portion size of the Screen
		
		latLng = $scope.map.getProjection().fromPointToLatLng(worldPoint);
	
		//Poop panel icon selected -> add poop marker
		if (GlobalService.get_iconType() == "poopDraggable"){
			$scope.showPConfirm();

		}
		//Bin panel icon selected -> add bin marker
		else if (GlobalService.get_iconType() == "binDraggable"){
			$scope.showBConfirm();
		}
	}
	
	//Adds the poop Marker to the map (after record has been created)
	$scope.addPoopMarker = function(){
		var marker = new google.maps.Marker({
			position: latLng,
			map: $scope.map,
			animation: google.maps.Animation.DROP,
			optimized: false,
			icon: poop_icon
		});
		var markerData = {
			lat: marker.getPosition().lat(),
			lng: marker.getPosition().lng(),
			icon: marker.getIcon().url
		};
		GlobalService.push_poopMarkers(markerData);
		
		// Adds the marker to markerCache (so it won't be re-added)
		addMarkerToCache(marker);
		
		/*
		var infoWindow = new google.maps.InfoWindow({
			content: "Some information!"
		});
	 
		google.maps.event.addListener(marker, 'click', function () {
			infoWindow.open($scope.map, marker);
		});
		*/
		
		GlobalService.set_activeIcon("");
		confirmation = false;
	}
	
	//Adds the bin Marker to the map
	$scope.addBinMarker = function() {
		
		var marker = new google.maps.Marker({
			position: latLng,
			map: $scope.map,
			animation: google.maps.Animation.DROP,
			optimized: false,
			icon: bin_icon
		});
		var markerData = {
			lat: marker.getPosition().lat(),
			lng: marker.getPosition().lng(),
			icon: marker.getIcon().url
		};
		GlobalService.push_binMarkers(markerData);
		
		// Adds the marker to binMarkerCache so we have a reference to it
		// to deal with the Nearest bin marker case
		binMarkerCache.push(marker);
		// Adds the marker to markerCache (so it won't be re-added)
		addMarkerToCache(marker);
		
		/*
		var infoWindow = new google.maps.InfoWindow({
			content: "Some information!"
		});
	 
		google.maps.event.addListener(marker, 'click', function () {
			infoWindow.open($scope.map, marker);
		});
		*/
		GlobalService.set_activeIcon("");
		confirmation = false;
	}
	
	//-------------------------------->
	//---- Connectivity functions ---->
	//------------------------------->
	
	function enableMap(){
		$ionicLoading.hide();
	}	

	function disableMap(){
		$ionicLoading.show({
			template: 'You must be connected to the Internet to view this map.'
		});
	}
	
	function noLocationMap(){
		$ionicLoading.show({
			template: 'Could not get your location. Please check your connection.'
		});
	}
	
	// Attempts to load the map
	function loadGoogleMaps(){
 
    $ionicLoading.show({
       template: '<p>Loading Google Maps</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
    });
		
    //This function will be called once the SDK has been loaded
    window.mapInit = function(){
      initMap();
    };  
 
    //Create a script element to insert into the page
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "googleMaps";
 
    //Note the callback function in the URL is the one we created above
    script.src = 'http://maps.google.com/maps/api/js?key=' + apiKey
		+ '&callback=mapInit';
		
    document.body.appendChild(script);
  }
	
	// Checks if the Map has been loaded. Attempts to load otherwise.
	function checkLoaded(){
    if(typeof google == "undefined" || typeof google.maps == "undefined"){
      loadGoogleMaps();
    } else {
      enableMap();
    }       
  }
	
	//---------------------------->
	//----- Marker functions -----> 
	//--------------------------->
	
	// Load markers (Only load on screen Markers)
	// NOTE: Database only requires lngLat data and maybe the marker 
	//			 information (message) as we create it from scratch
	function loadMarkers(){
		
		var center = $scope.map.getCenter();
		var bounds = $scope.map.getBounds();
		var zoom = $scope.map.getZoom();
		
		//Convert objects returned by Google to be more readable
		var centerNorm = {
			lat: center.lat(),
			lng: center.lng()
		};
	
	  var boundsNorm = {
			northeast: {
				lat: bounds.getNorthEast().lat(),
				lng: bounds.getNorthEast().lng()
			},
			southwest: {
				lat: bounds.getSouthWest().lat(),
				lng: bounds.getSouthWest().lng()
			}
		};
	
		var boundingRadius = getBoundingRadius(centerNorm, boundsNorm);
		
		//Use these parameters to grab only nearby markers (onscreen)
		var params = {
			"centre": centerNorm,
			"bounds": boundsNorm,
			"zoom": zoom,
			"boundingRadius": boundingRadius
		};
	
		//Get all of the markers from our array of Markers
		var markers = GlobalService.get_newMarkers(params,"poop");
		var bMarkers = GlobalService.get_newMarkers(params,"bin");
		for (var i = 0; i < bMarkers.length; i ++){
			markers.push(bMarkers[i]);
		}
		
		for (var i = 0; i < markers.length; i++) {
			if (!markerExists(markers[i].lat, markers[i].lng, markers[i].icon)){
				
				if (markers[i].icon == poop_icon.url){
					currentIcon = poop_icon;
				}else if (markers[i].icon == bin_icon.url){
					currentIcon = bin_icon;
				}
				
				
				latLng = new google.maps.LatLng(markers[i].lat,markers[i].lng);
				
				// Adds the (new) marker to the map
				var marker = new google.maps.Marker({
					map: $scope.map,
					animation: google.maps.Animation.DROP,
					position: latLng,
					optimized: false,
					icon: currentIcon
				});

				// Adds the marker to markerCache (so it won't be re-added)
				addMarkerToCache(marker);
				
				// Adds the marker to binMarkerCache so we have a reference to it
				// to deal with the Nearest bin marker (hide/show)
				if (marker.getIcon().url == bin_icon.url){
					binMarkerCache.push(marker);
				}
			}
		}	
  }
	
	// Find the nearest bin and add a Marker to indicate it
	$scope.findNearestBin = function(){
		
		// (Excluding the first case where these variables are 'null')
		// We remove the old tempBinMarker from our map (which indicated the old nearest
		// Bin on the map) and also set the original bin Marker to be visible again.
		if (tempBinMarker != null){
			tempBinMarker.setMap(null);
			
		}
		if (nearestBinMarker != null){
			nearestBinMarker.setMap($scope.map);
			
		}
		
		var center = myLocationMarker.getPosition();
		var bounds = $scope.map.getBounds();
		var zoom = $scope.map.getZoom();
		
		//Convert objects returned by Google to be more readable
		var centerNorm = {
			lat: center.lat(),
			lng: center.lng()
		};
	
	  var boundsNorm = {
			northeast: {
				lat: bounds.getNorthEast().lat(),
				lng: bounds.getNorthEast().lng()
			},
			southwest: {
				lat: bounds.getSouthWest().lat(),
				lng: bounds.getSouthWest().lng()
			}
		};
	
		var boundingRadius = getBoundingRadius(centerNorm, boundsNorm);
		
		//Use these parameters to grab only nearby markers (onscreen)
		var params = {
			"centre": centerNorm,
			"bounds": boundsNorm,
			"zoom": zoom,
			"boundingRadius": boundingRadius
		};
			
		indicator_icon.scaledSize = new google.maps.Size(50, 50);
		
		var nearestBin = GlobalService.get_NearestBin(params);
		
		// We find the reference to the nearest Bin currently on the map (from binMarkerCache)
		// and set it to hide temporarily while we replace it with a new indicator
		for (var i = 0; i < binMarkerCache.length; i++){
			if ((binMarkerCache[i].getPosition().lat() == nearestBin.lat) && 
					(binMarkerCache[i].getPosition().lng() == nearestBin.lng) &&
					(binMarkerCache[i].getIcon().url == nearestBin.icon)){
					nearestBinMarker = binMarkerCache[i];
					nearestBinMarker.setMap(null);
			}
		}
		
		latLng = new google.maps.LatLng(nearestBin.lat,
						 nearestBin.lng);
		
		var marker = new google.maps.Marker({
			map: $scope.map,
			animation: google.maps.Animation.DROP,
			position: latLng,
			icon: indicator_icon,
			optimized: false
		});
		
		tempBinMarker = marker;
	}
	
	// Adds new Marker to markerCache (so it won't be re-added)
	function addMarkerToCache(marker){
		var markerData = {
			lat: marker.getPosition().lat(),
			lng: marker.getPosition().lng(),
			icon: marker.getIcon().url,
		};
		markerCache.push(markerData);			
	}
	
	// Checks if the Marker exists on the Map already (via our Cache)
	function markerExists(lat, lng, icon){
		var exists = false;
		var cache = markerCache;
		for(var i = 0; i < cache.length; i++){
			if(cache[i].lat === lat && cache[i].lng === lng && 
				 cache[i].icon === icon){
				exists = true;
				console.log("Marker already exists. It has not been added.");
			}
		}
		return exists;
  }
 
	// Gets bounding radius
  function getBoundingRadius(center, bounds){
    return getDistanceBetweenPoints(center, bounds.northeast, 'miles');    
  }
 
	// Calculates the distance between two points
	// google.maps.geometry.spehrical.computeDistanceBetween() ?!
  function getDistanceBetweenPoints(pos1, pos2, units){
 
    var earthRadius = {
        miles: 3958.8,
        km: 6371
    };
 
    var R = earthRadius[units || 'miles'];
    var lat1 = pos1.lat;
    var lon1 = pos1.lng;
    var lat2 = pos2.lat;
    var lon2 = pos2.lng;
 
    var dLat = toRad((lat2 - lat1));
    var dLon = toRad((lon2 - lon1));
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
 
    return d;
  }
 
	// Converts degrees to Radians
  function toRad(x){
      return x * Math.PI / 180;
  }
	
	//--------------------------->
	//----- Other functions ----->
	//-------------------------->
	
	// Add info Window to Marker
	function addInfoWindow(marker, message) {
 
      var infoWindow = new google.maps.InfoWindow({
          content: message
      });
 
      google.maps.event.addListener(marker, 'click', function () {
          infoWindow.open(map, marker);
      });
 
  }
	
	// Connection checker
	function addConnectivityListeners(){
 
    if(ionic.Platform.isWebView()){
 
      // Check if the map is already loaded when the user comes online, 
			//if not, load it
			
      $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
        checkLoaded();
      });
 
      // Disable the map when the user goes offline
      $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
        disableMap();
      });
 
    }
    else {
 
      //Same as above but for when we are not running on a device
      window.addEventListener("online", function(e) {
        checkLoaded();
      }, false);    
 
      window.addEventListener("offline", function(e) {
        disableMap();
      }, false);  
    }
  }
	
	//-------------------------------------->
	//---- New Record (Modal) Functions ---->
	//------------------------------------->
	
	// Blank form used reset fields
	$scope.record = {
		date: "",
		time: "",
		location: ""
	}
	var emptyForm = angular.copy($scope.record);
	
	// Create and load the Modal
	$ionicModal.fromTemplateUrl('templates/newPoop.html', function(modal) {
		$scope.poopModal = modal;
	}, {
		scope: $scope,
		animation: 'slide-in-up'
	});
	
	// Open our new record modal
	$scope.newRecord = function() {
		$scope.poopModal.show();
	};
	
	// Close the new record modal
	$scope.closeNewRecord = function(record) {
		$scope.poopModal.hide();
		$scope.record = angular.copy(emptyForm);
	};

	// Create record item
	$scope.createRecord = function(record) {
		if (record.location.length > 0){
			GlobalService.push_doggyRecords({
				date: record.date,
				time: record.time,
				location: record.location
			});
			$scope.poopModal.hide();
			$scope.record = angular.copy(emptyForm);
			
			//Adds the marker to your map upon creating the Record
			$scope.addPoopMarker();
		}
		else {
			console.log("Location not entered!");
		}
	};
	
	//------------------------------------------------>
	//---- Confirm dialog resources and Functions ---->
	//----------------------------------------------->

	// Confirm dialog for adding Poop to the map
	$scope.showPConfirm = function() {
		var confirmPopup = $ionicPopup.confirm({
			title: 'Add this doggy record?',
			template: 'This logs your dog\'s mess. You can view all logs from your Doggy Records page.' 
		});
		confirmPopup.then(function(res) {
			if(res) {
				$scope.newRecord();
			}
		});
	};
	
	// Confirm dialog for adding Bin to the map
	$scope.showBConfirm = function() {
		var confirmPopup = $ionicPopup.confirm({
			title: 'Add this Bin?',
			template: 'It will be added to your Bin DataBase used to find your nearest bins.' 
		});
		confirmPopup.then(function(res) {
			if(res) {
				$scope.addBinMarker();
			}
		});
	};
});