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

//Note : removed $state from dependencies (dunno what it did!)

.controller('MapCtrl', function($scope, $cordovaGeolocation, $ionicModal,
$window, $ionicPopup, $ionicLoading, $rootScope, $cordovaNetwork, GlobalService,
ConnectivityMonitor) {
	
	/* ------------------------- */
	/* --- Initial resources --- */
	/* ------------------------- */
	var apiKey = "AIzaSyD1-OU4tSucidW9oHkB5CCpLqSUT5fcl-E";
	var map = null;
	var latLng = null;
	
	var DoggyMarkers = [];				// Currently replaced by GlobalService.get_doggyMarkers()
																// Will later be replaced again by Database.
	
	var myLocationMarker; 				// Used to remove old marker to update current location
	
	// Icon resources
	var poop_icon = "img/Assets/poop_small.png";
	var bin_icon = "img/Assets/bin_small.png";
	
	// Fixes the error where opening a modal would cause the map to 'break' 
	$scope.$on('$ionicView.afterEnter', function() {
		ionic.trigger('resize');
	});

	/* ------------------------- */
	/* --- Initializing. . . --- */
	/* ------------------------- */
	
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
		 
				enableMap();
				// disableMap();
				
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
	
	// ------------------------------------------>
	// ---------- Map related Functions ---------->
	// ------------------------------------------>
	
	// Refreshes the map
	$scope.refreshMap = function(){
		myLocationMarker.setMap(null);
		
		google.maps.event.trigger(map, 'resize');
		
		latLng = new google.maps.LatLng(position.coords.latitude, 
						 position.coords.longitude);
		
		var marker = new google.maps.Marker({
				map: $scope.map,
				animation: google.maps.Animation.DROP,
				position: latLng
		});      
	 
		myLocationMarker = marker;
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
	
	/* ---------------------------- */
	/* ----- Marker functions ----- CURRENTLY NOT USED! */
	/* ---------------------------- */
	
	// Sets the map on all markers in the array.
	$scope.setDoggyMarkers = function(map){
		for (var i = 0; i < DoggyMarkers.length; i++) {
			DoggyMarkers[i].setMap($scope.map);
		}
	};
	
	// Removes the markers from the map, but keeps them in the array.
	$scope.clearDoggyMarkers = function() {
		setDoggyMarkers(null);
	};

	// Shows any markers currently in the array.
	$scope.showDoggyMarkers = function() {
		setMapOnAll($scope.map);
	};
	
	// Deletes all markers in the array by removing references to them.
	$scope.deleteDoggyMarkers = function() {
		clearDoggyMarkers();
		DoggyMarkers = [];
	};
	
	/* ------------------------------------------ */
	/* ----- Connectivity related functions ----- */
	/* ------------------------------------------ */
	
	function enableMap(){
		$ionicLoading.hide();
		// $scope.dataLoading = true;
	}	

	function disableMap(){
		$ionicLoading.show({
			template: 'You must be connected to the Internet to view this map.'
		});
		// $scope.dataLoading = true;
	}
	
	function noLocationMap(){
		// $ionicLoading.show({
			// template: 'Could not get your location. Please check your connection.'
		// });
	}
	
	function loadGoogleMaps(){
 
    $ionicLoading.show({
      template: 'Loading Google Maps'
    });
		
		// $scope.dataLoading = true;
 
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
	
	function checkLoaded(){
    if(typeof google == "undefined" || typeof google.maps == "undefined"){
      loadGoogleMaps();
    } else {
      enableMap();
    }       
  }
	
	function loadMarkers(){
 
      //Get all of the markers from our Markers factory
      GlobalService.get_doggyMarkers().then(function(markers){
 
        console.log("Markers: ", markers);
 
        for (var i = 0; i < markers.length; i++) {
    
          // Add the markerto the map
          var marker = new google.maps.Marker({
              map: map,
              animation: google.maps.Animation.DROP,
              position: markers[i].getPosition()
          });
 
          var infoWindowContent = "<h4>" + "some info.." + "</h4>";          
 
          addInfoWindow(marker, infoWindowContent, record);
 
        }
 
      }); 
 
  }
	
	function addInfoWindow(marker, message, record) {
 
      var infoWindow = new google.maps.InfoWindow({
          content: message
      });
 
      google.maps.event.addListener(marker, 'click', function () {
          infoWindow.open(map, marker);
      });
 
  }
	
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
	
	//---------------------------------------------------------->
	// ---------- Record modal resources and Functions ---------->
	//---------------------------------------------------------->
	
	// Blank form used reset fields
	$scope.record = {
		date: "",
		time: "",
		location: ""
	}
	// Blank form used to reset fields
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
	
	//------------------------------------------------------>
	// ------- Confirm dialog resources and Functions ------->
	//------------------------------------------------------>

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