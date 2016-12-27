angular.module('PooperSnooper.controllers', ['ionic', 'ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

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
	
	var markerCache = [];
	
	var myLocationMarker; 				// Used to remove old marker to update current location
	
	// Icon resources
	var poop_icon = "img/Assets/poop_small.png";
	var bin_icon = "img/Assets/bin_small.png";
	
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
			
			latLng = new google.maps.LatLng(position.coords.latitude,
									 position.coords.longitude);
	 
			var mapOptions = {
				center: latLng,
				zoom: 15,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				mapTypeControl: false,
				streetViewControl: false
				//fullscreenControl: false
			};
			
			$scope.map = new google.maps.Map(document.getElementById("map"),
									 mapOptions);
			
			// Wait until the map is loaded and add Marker to current location
			google.maps.event.addListenerOnce($scope.map, 'idle', function(){
		 
				//Reload markers every time the map moves
        google.maps.event.addListener($scope.map, 'dragend', function(){
          //loadMarkers();
        });
 
        //Reload markers every time the zoom changes
        google.maps.event.addListener($scope.map, 'zoom_changed', function(){
          //loadMarkers();
        });
				
				enableMap();
				
				var marker = new google.maps.Marker({
						map: $scope.map,
						animation: google.maps.Animation.DROP,
						position: latLng
				});      
				myLocationMarker = marker;
				
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
		GlobalService.push_poopLatLng(latLng);
		
		var marker = new google.maps.Marker({
			position: latLng,
			map: $scope.map,
			animation: google.maps.Animation.DROP,
			icon: poop_icon
		});
		
		var infoWindow = new google.maps.InfoWindow({
			content: "Some information!"
		});
	 
		google.maps.event.addListener(marker, 'click', function () {
			infoWindow.open($scope.map, marker);
		});
		
		GlobalService.set_activeIcon("");
		confirmation = false;
	}
	
	//Adds the bin Marker to the map
	$scope.addBinMarker = function() {
		GlobalService.push_binLatLng(latLng);
		
		var marker = new google.maps.Marker({
			position: latLng,
			map: $scope.map,
			animation: google.maps.Animation.DROP,
			icon: bin_icon
		});
		
		var infoWindow = new google.maps.InfoWindow({
			content: "Some information!"
		});
	 
		google.maps.event.addListener(marker, 'click', function () {
			infoWindow.open($scope.map, marker);
		});
		
		GlobalService.set_activeIcon("");
		confirmation = false;
	}
	
	//---------------------------------------->
	//---- Connectivity related functions ---->
	//--------------------------------------->
	
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
      template: 'Loading Google Maps'
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
	
		//Get all of the markers from our Markers factory
		GlobalService.get_doggyMarkers().then(function(markers){
			for (var i = 0; i < markers.length; i++) {
				if (!markerExists(markers[i].getPosition().lat, markers[i].getPosition().lng)){
					// Adds the (new) marker to the map
					var marker = new google.maps.Marker({
							map: map,
							animation: google.maps.Animation.DROP,
							position: markers[i].getPosition()
					});
					// Adds the marker to markerCache (so it won't be re-added)
					var markerData = {
						lat: markers[i].getPosition().lat,
						lng: markers[i].getPosition().lng,
						marker: marker
					};
					markerCache.push(markerData);
				}
			}
		}); 
  }
	
	// Checks if the Marker exists on the Map already (via our Cache)
	function markerExists(lat, lng){
		var exists = false;
		var cache = markerCache;
		for(var i = 0; i < cache.length; i++){
			if(cache[i].lat === lat && cache[i].lng === lng){
				exists = true;
			}
		}
		return exists;
  }
 
	// Gets bounding radius
  function getBoundingRadius(center, bounds){
    return getDistanceBetweenPoints(center, bounds.northeast, 'miles');    
  }
 
	// Calculates the distance between two points
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
			title: 'Add a doggy record?',
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
			title: 'Add a Bin to this location?',
			template: 'It will be added to your Bin DataBase used to find your nearest bins.' 
		});
		confirmPopup.then(function(res) {
			if(res) {
				$scope.addBinMarker();
			}
		});
	};
});