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
	
	.state('app.drag-drop', {
		url: '/drag-drop',
		views: {
			'menuContent': {
				templateUrl: 'templates/drag-drop.html',
				controller: 'MapCtrl'
			}
		}
	})
	
  // if none of the above states are matched, use this as the fall back
  
	$urlRouterProvider.otherwise('/app/drag-drop');
	//$urlRouterProvider.otherwise('/app/welcome');
})

//'Draggable' and 'droppable' directions
.directive('draggable', ['MapDropService', function(MapDropService) {
  return {
    scope: {
      click: '&' // parent
    },
    link: function(scope, element) {
			scope.model = MapDropService.sharedObject;
			
			// This gives us the native JS object
			var el = element[0];
			
			el.draggable = true;	  
			
			el.addEventListener(
				'click',
				function(e) {
					this.classList.add('drag');
					
					scope.model.iconSelected = true; 
					scope.model.iconType = this.id;				
					
					// Call the click passed click function
					scope.$apply('click()');
									
					return false;
				},
				false
			);
			
		}
	}
}])

.directive('droppable', ['MapDropService', function(MapDropService) {
  return {
    scope: {
      click: '&' // parent
    },
    link: function(scope, element) {
			scope.model = MapDropService.sharedObject;
		
      //We need the native object
      var el = element[0];
			
      el.addEventListener(
        'click',
        function(e) {
          // Stops some browsers from redirecting.
          if (e.stopPropagation) e.stopPropagation();
          
					//Grab screen coordinates to convert into to latLng
					scope.model.x_cord = event.x;
          scope.model.y_cord = event.y;
					
					var poopItem = document.getElementById("poopDraggable");
					var binItem = document.getElementById("binDraggable");
					
					//'Poop' panel icon selected
					if (scope.model.iconSelected == true){
										
						if (scope.model.iconType == "poopDraggable"){							
							//Passes data to our service for the controller 
							//and calls the click passed click function
							scope.model.iconType = poopItem.id;
							scope.$apply('click()');
							
							//Reset states
							poopItem.classList.remove('drag');
							scope.model.iconSelected == false;
						}
						else if (scope.model.iconType == "binDraggable"){							
							scope.model.iconType = binItem.id;
							scope.$apply('click()');
							
							binItem.classList.remove('drag');
							scope.model.iconSelected == false;
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
.factory('MapDropService', [function(){
	
	return {
		sharedObject: {
			x_cord : '',
			y_cord : '',
			iconSelected : '',
			iconType : ''
		}
	};
}]);
