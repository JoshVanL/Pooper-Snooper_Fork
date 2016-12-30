// Ionic PooperSnooper App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'PooperSnooper' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'PooperSnooper.controllers' is found in controllers.js
angular.module('PooperSnooper', ['ionic', 'PooperSnooper.controllers', 'ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

// Navigate through page states
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

	.state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.welcome', {
		url: '/welcome',
		views: {
		'menuContent': {
			templateUrl: 'templates/welcome.html'
		}
	}
  })	
  
  .state('app.about', {
    url: '/about',
    views: {
      'menuContent': {
        templateUrl: 'templates/about.html'
      }
    }
  })

	.state('app.map', {
    url: '/map',
    views: {
			'menuContent': {
				templateUrl: 'templates/map.html',
				controller: 'MapCtrl'
			}
		}
  })

	.state('app.recordLogs', {
		url: '/recordLogs',
		views: {
			'menuContent': {
				templateUrl: 'templates/recordLogs.html',			
				controller: 'RecordLogsCtrl'
			}		
		}
	})
	
  // if none of the above states are matched, use this as the fall back
  
	// $urlRouterProvider.otherwise('/app/map');
	$urlRouterProvider.otherwise('/app/welcome');
})

//'Draggable' and 'droppable' directions
.directive('draggable', ['GlobalService', function(GlobalService) {
  return {
    scope: {
      click: '&' // parent
    },
    link: function(scope, element) {
			
			// This gives us the native JS object
			var el = element[0];
			
			el.draggable = true;	  
			
			el.addEventListener(
				'click',
				function(e) {
					if (GlobalService.get_activeIcon() == false){
						
						this.classList.add('iconSelected');	//For CSS opacity change
						
						GlobalService.set_activeIcon(true); 
						GlobalService.set_iconType(this.id);				
						
					}
					return false;
				},
				false
			);
			
		}
	}
}])

.directive('droppable', ['GlobalService', function(GlobalService) {
  return {
    scope: {
      click: '&' // parent
    },
    link: function(scope, element) {
		
      //We need the native object
      var el = element[0];
			
      el.addEventListener(
        'click',
        function(e) {
          // Stops some browsers from redirecting.
          if (e.stopPropagation) e.stopPropagation();
          
					//Grab screen coordinates to convert into to latLng
					GlobalService.set_onScreenX(event.x);
          GlobalService.set_onScreenY(event.y);
										
					var poopItem = document.getElementById("poopDraggable");
					var binItem = document.getElementById("binDraggable");
					
					//'Poop' panel icon selected
					if (GlobalService.get_activeIcon() == true){
										
						if (GlobalService.get_iconType() == "poopDraggable"){							
							//Passes data to our service for the controller 
							//and calls the click passed click function
							GlobalService.set_iconType(poopItem.id);
							scope.$apply('click()');
							
							//Reset states
							poopItem.classList.remove('iconSelected');
							GlobalService.set_activeIcon(false);
						}
						else if (GlobalService.get_iconType() == "binDraggable"){							
							GlobalService.set_iconType(binItem.id);
							scope.$apply('click()');
							
							binItem.classList.remove('iconSelected');
							GlobalService.set_activeIcon(false);
						}
					}
          return false;
        },
        false
      );
    }
  }
}])

//Service between Droppable and the MapCtrl to convert screen coordinate data into latLng
.factory('GlobalService', [function(){
	var onScreenX = '';
	var onScreenY = '';
	var activeIcon = '';
	var iconType = '';
	var doggyRecords = [];
	var poopMarkers = [];
	var binMarkers = [];
	
	var nearbyPoopMarkers = [];
	var nearbyBinMarkers = [];
	
	var nearestBin = '';
	
	var markerCache = [];
	
	var markerCount = 0;
	var markerLimit = 25;
	
	// Adds new Marker to markerCache (so it won't be re-added)
	function addMarkerToCache(marker){
		var markerData = {
			lat: marker.lat,
			lng: marker.lng,
			icon: marker.icon,
		};
		markerCache.push(markerData);			
	}
	
	// Checks if the Marker exists on the Map already (via our Cache)
	function markerExists(lat, lng, icon){
		var exists = false;
		var cache = markerCache;
		for(var i = 0; i < cache.length; i++){
			if(cache[i].lat === lat && cache[i].lng === lng && 
				 cache[i].icon.url === icon.url){
				exists = true;
			}
		}
		return exists;
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
	
	return {
		get_onScreenX : function(){
			return onScreenX;
		},
		set_onScreenX : function(t){
			onScreenX = t;
		},
		
		get_onScreenY : function(){
			return onScreenY;
		},
		set_onScreenY : function(t){
			onScreenY = t;
		},
		
		get_activeIcon : function(){
			return activeIcon;
		},
		set_activeIcon : function(t){
			activeIcon = t;
		},
		
		get_iconType : function(){
			return iconType;
		},
		set_iconType : function(t){
			iconType = t;
		},
		
		get_doggyRecords : function(){
			return doggyRecords;
		},
		push_doggyRecords : function(t){
			doggyRecords.push(t);
		},
		
		// Returns new Markers of type 'markerType' (that have not been Cached) 
		get_newMarkers : function(param, markerType){
			
			if (markerType == "poop"){
				markerArray = poopMarkers;
				//nearbyMarkers = nearbyPoopMarkers;
			}
			else if (markerType == "bin"){
				markerArray = binMarkers;
				//nearbyMarkers = nearbyBinMarkers;
			}
			
			// Reset the nearbyPoopMarker array
			nearbyMarkers = [];
			
			for (i = 0; i < markerArray.length ; i++){
				
				var pos1 = {
					lat: markerArray[i].lat,
					lng: markerArray[i].lng
				}
				
				var pos2 = param.centre;
				
				var dist = getDistanceBetweenPoints(pos1,pos2,'miles');

				if (markerCount < markerLimit){ 
					if (!markerExists(markerArray[i].lat,
							markerArray[i].lng, markerArray[i].icon)){
						
						if (dist < 0.8*param.boundingRadius){
							nearbyMarkers.push(markerArray[i]);
							addMarkerToCache(markerArray[i]);
							markerCount++;
						}	
					}
				}
			}
			markerCount = 0;	
			
			return nearbyMarkers;
		},
		
		push_poopMarkers : function(t){
			poopMarkers.push(t);
		},
		
		// Return closest bin Marker
		get_NearestBin : function(param){
			// Reset the nearbyPoopMarker array
			nearbyBinMarkers = [];
			var nearestDist = param.boundingRadius;
			
			for (i = 0; i < binMarkers.length ; i++){
				var pos1 = {
					lat: binMarkers[i].lat,
					lng: binMarkers[i].lng
				}
				
				var pos2 = param.centre;
				
				var dist = getDistanceBetweenPoints(pos1,pos2,'miles');
				
				if (markerCount < markerLimit){ 
					if (dist < nearestDist){
						nearestBin = binMarkers[i];
						nearestDist = dist;
					}
				}
			}
			
			return nearestBin;
		},
		
		push_binMarkers : function(t){
			binMarkers.push(t);
		}
	};
}])

.factory('ConnectivityMonitor', function($rootScope, $cordovaNetwork){
 
  return {
    isOnline: function(){
 
      if(ionic.Platform.isWebView()){
        return $cordovaNetwork.isOnline();    
      } else {
        return navigator.onLine;
      }
 
    },
    ifOffline: function(){
 
      if(ionic.Platform.isWebView()){
        return !$cordovaNetwork.isOnline();    
      } else {
        return !navigator.onLine;
      }
 
    }
  }
})