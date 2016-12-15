// Ionic PooperSnooper App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'PooperSnooper' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'PooperSnooper.controllers' is found in controllers.js
var db = null;
angular.module('PooperSnooper', ['ionic', 'PooperSnooper.controllers', 'ngCordova'])
.run(function($ionicPlatform, $cordovaSQLite) {
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
    db = $cordovaSQLite.openDB({name:'tester.db',location:'default'});
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS dogFindings (id integer primary key, DateTime text, Location text, Image blob)");
  });
})

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

  .state('app.record', {
    url: '/record',
    views: {
      'menuContent': {
        templateUrl: 'templates/record.html',
        controller: 'RecordCtrl'
      }
    }
  })

  // if none of the above states are matched, use this as the fall back
  $urlRouterProvider.otherwise('/app/welcome');
});
