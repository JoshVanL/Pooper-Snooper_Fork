// Ionic PooperSnooper App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'PooperSnooper' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'PooperSnooper.controllers' is found in controllers.js

angular.module('PooperSnooper', ['ionic', 'backand', 'PooperSnooper.controllers', 'PooperSnooper.services', 'ngCordova'])

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
  .config(function($stateProvider, $urlRouterProvider, BackandProvider, $httpProvider) {
    //BackandProvider.setAppName('poopersnoop');
    //BackandProvider.setSignUpToken('a04c4d71-2b7e-4a72-8f11-d3a4e4c13623');
    //BackandProvider.setAnonymousToken('f0d16a81-c04c-448b-90e6-5b4b1c62d204');
  	BackandProvider.runSocket(true);
    BackandProvider.setAppName('poopersnooperapp');
    BackandProvider.setSignUpToken('bd7cfd8e-4c62-405b-943a-457a7b31b5fa');
    BackandProvider.setAnonymousToken('f855688d-f723-4706-ac50-ffb2bd6d3883');


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
            templateUrl: 'templates/about.html',
            controller: 'SocialMediaCtrl'
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

    $urlRouterProvider.otherwise('/app/welcome');
    $httpProvider.interceptors.push('APIInterceptor');
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
            //Allows the selecting of an icon
            if (GlobalService.get_activeIcon() == false) {

              this.classList.add('iconSelected'); //For CSS opacity change

              GlobalService.set_activeIcon(true);
              GlobalService.set_iconType(this.id);

            }
            //Allows the changing of icon after an icon has been selected
            else if (GlobalService.get_activeIcon() == true &&
              this.id != GlobalService.get_iconType()) {

              var poopItem = document.getElementById("poopDraggable");
              var binItem = document.getElementById("binDraggable");
              var manItem = document.getElementById("manDraggable");

              if (GlobalService.get_iconType() == "poopDraggable") {
                poopItem.classList.remove('iconSelected');
              } else if (GlobalService.get_iconType() == "binDraggable") {
                binItem.classList.remove('iconSelected');
              } else if (GlobalService.get_iconType() == "manDraggable") {
                manItem.classList.remove('iconSelected');
              }

              this.classList.add('iconSelected');
              GlobalService.set_iconType(this.id);
            }
            //Allows the de-selection of current icon
            else if (GlobalService.get_activeIcon() == true &&
              this.id == GlobalService.get_iconType()) {

              var poopItem = document.getElementById("poopDraggable");
              var binItem = document.getElementById("binDraggable");
              var manItem = document.getElementById("manDraggable");

              if (GlobalService.get_iconType() == "poopDraggable") {
                poopItem.classList.remove('iconSelected');
              } else if (GlobalService.get_iconType() == "binDraggable") {
                binItem.classList.remove('iconSelected');
              } else if (GlobalService.get_iconType() == "manDraggable") {
                manItem.classList.remove('iconSelected');
              }

              GlobalService.set_activeIcon(false);
              GlobalService.set_iconType('');
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
            var manItem = document.getElementById("manDraggable");

            //'Poop' panel icon selected
            if (GlobalService.get_activeIcon() == true) {

              if (GlobalService.get_iconType() == "poopDraggable") {
                scope.$apply('click()'); //Passes data to our service for the controller
                //and calls the click passed click function

                poopItem.classList.remove('iconSelected'); //Reset to 'neutral' state
                GlobalService.set_activeIcon(false);
              } else if (GlobalService.get_iconType() == "binDraggable") {
                scope.$apply('click()');
                binItem.classList.remove('iconSelected');
                GlobalService.set_activeIcon(false);
              } else if (GlobalService.get_iconType() == "manDraggable") {
                scope.$apply('click()');
                manItem.classList.remove('iconSelected');
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
  .factory('GlobalService', [function() {

		//Map Marker placing variables
		var onScreenX = '';				//X coordinate of where pin has been dropped on the map element
    var onScreenY = '';				//Y coordinate of where pin has been dropped on the map element
    var activeIcon = '';			//True when a pin has been selected
    var iconType = '';				//Type of Icon which has been selected - Poop/Bin/Man

		// ------------------------- >
		// --- RETURN FUNCTIONS --- >
		// ----------------------- >

    return {
      get_onScreenX: function() {
        return onScreenX;
      },
      set_onScreenX: function(t) {
        onScreenX = t;
      },

      get_onScreenY: function() {
        return onScreenY;
      },
      set_onScreenY: function(t) {
        onScreenY = t;
      },

      get_activeIcon: function() {
        return activeIcon;
      },
      set_activeIcon: function(t) {
        activeIcon = t;
      },

      get_iconType: function() {
        return iconType;
      },
      set_iconType: function(t) {
        iconType = t;
      },
    };
  }])

  .factory('ConnectivityMonitor', function($rootScope, $cordovaNetwork) {

    return {
      isOnline: function() {

        if (ionic.Platform.isWebView()) {
          return $cordovaNetwork.isOnline();
        } else {
          return navigator.onLine;
        }

      },
      ifOffline: function() {

        if (ionic.Platform.isWebView()) {
          return !$cordovaNetwork.isOnline();
        } else {
          return !navigator.onLine;
        }

      }
    }
  });
