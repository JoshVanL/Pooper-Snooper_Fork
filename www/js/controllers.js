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

.controller('RecordLogsCtrl', function($scope, $ionicModal) {
	
	$scope.records = [];
	
	// Create and load the Modal
  $ionicModal.fromTemplateUrl('newRecord.html', function(modal) {
    $scope.recordModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });
	
	// Called when the form is submitted
  $scope.createRecord = function(record) {
		if (record.location.length > 0){
			$scope.records.push({
				date: record.date,
				time: record.time,
				location: record.location
			});
			console.log("Record created!");
			$scope.recordModal.hide();
			record.date = null;
			record.time = null;
			record.location = null;
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
  };
	
	// Finds current location using GPS
	$scope.findLocation = function() {
		console.log("findLocation pressed!");
	};

})

.controller('DragDropCtrl', function($scope) {
  $scope.handleDrop = function() {
    console.log("Item dropped!");
		//alert('Item has been dropped');
  }
	
	$scope.handleDragStart = function(){
		console.log("Item dragged!");
		}
})


.controller('MapCtrl', function($scope, $state, $cordovaGeolocation, MapDropService) {
  var options = {timeout: 10000, enableHighAccuracy: true};
	
	$scope.model = MapDropService.sharedObject;
	
  $cordovaGeolocation.getCurrentPosition(options).then(function(position){
 
		var DoggyMarkers = [];
 
		var poop_icon = "img/Assets/poop_small.png";
		var bin_icon = "img/Assets/bin_small.png";
 
    var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
 
    var mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
 
    $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
		
		//Wait until the map is loaded and add Marker to current location (center)
		google.maps.event.addListenerOnce($scope.map, 'idle', function(){
	 
			var marker = new google.maps.Marker({
					map: $scope.map,
					animation: google.maps.Animation.DROP,
					position: latLng
			});      
		 
			var infoWindow = new google.maps.InfoWindow({
					content: "Here I am!"
			});
		 
			google.maps.event.addListener(marker, 'click', function () {
					infoWindow.open($scope.map, marker);
			});
	 
		});

		// Special panel click event function to add markers
		$scope.handleDrop = function() {	
			
			//Converts screen coordinates to latLng
			var topRight = $scope.map.getProjection().fromLatLngToPoint($scope.map.getBounds().getNorthEast());
			var bottomLeft = $scope.map.getProjection().fromLatLngToPoint($scope.map.getBounds().getSouthWest());
			var scale = Math.pow(2, $scope.map.getZoom());
			var worldPoint = new google.maps.Point($scope.model.x_cord / scale + bottomLeft.x, $scope.model.y_cord / scale + topRight.y);
			latLng = $scope.map.getProjection().fromPointToLatLng(worldPoint);
				
			//Poop panel icon selected -> add poop marker
			if ($scope.model.iconType == "poopDraggable"){
				var marker = new google.maps.Marker({
					position: latLng,
					map: $scope.map,
					animation: google.maps.Animation.DROP,
					icon: poop_icon
				});
				
				$scope.model.iconSelected = "neutral";
			}
			//Bin panel icon selected -> add bin marker
			else if ($scope.model.iconType == "binDraggable"){
				var marker = new google.maps.Marker({
					position: latLng,
					map: $scope.map,
					animation: google.maps.Animation.DROP,
					icon: bin_icon
				});
				
				$scope.model.iconSelected = "neutral";
			}
			
			var infoWindow = new google.maps.InfoWindow({
				content: "Date information to be implemented!"
			});
		 
			google.maps.event.addListener(marker, 'click', function () {
				infoWindow.open($scope.map, marker);
			});
			
		}
		
		// Sets the map on all markers in the array.
		$scope.setDoggyMarkers = function(map){
			for (var i = 0; i < DoggyMarkers.length; i++) {
				DoggyMarkers[i].setMap($scope.map);
			}
		};
		
		// Removes the markers from the map, but keeps them in the array.
		$scope.clearDoggyMarkers = function() {
			setMapOnAll(null);
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
		   
  }, function(error){
    console.log("Could not get location");
  });
});


/* Click event listener to add special markers
		google.maps.event.addListener($scope.map, 'click', function(event) {
			
			var marker = new google.maps.Marker({
				position: event.latLng,
				map: $scope.map,
				animation: google.maps.Animation.DROP,
				icon: poop_icon
			});
			
			DoggyMarkers.push(marker);
			var infoWindow = new google.maps.InfoWindow({
				content: "Date of poop"
			});
	 
			google.maps.event.addListener(marker, 'click', function () {
					infoWindow.open($scope.map, marker);
			});

		});
		
*/