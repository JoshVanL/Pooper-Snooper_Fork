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
  
	//$urlRouterProvider.otherwise('/app/map');
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
		var poopLatLng = [];
		var binLatLng = [];
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
		
		get_poopLatLng : function(){
			return poopLatLng;
		},
		push_poopLatLng : function(t){
			poopLatLng.push(t);
		},
		
		get_binLatLng : function(){
			return binLatLng;
		},
		push_binLatLng : function(t){
			binLatLng.push(t);
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
});
