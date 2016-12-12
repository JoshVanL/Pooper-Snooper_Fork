angular.module('PooperSnooper.controllers', ['ionic', 'ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $cordovaSQLite) {

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

.controller('RecordCtrl', function($scope, $stateParams) {
})

.controller('RecordLogsCtrl', function($scope, $ionicModal, $cordovaSQLite) {

  $scope.records = [];

  // Create and load the Modal
  $ionicModal.fromTemplateUrl('newRecord.html', function(modal) {
    $scope.recordModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });

  var query = "SELECT Date, Time, Location FROM dogFindings";
  $cordovaSQLite.execute(db, query, []).then(function(res) {
    if(res.rows.length > 0){
      for (var i=0; i<res.rows.length; i++){

        $scope.records.push({
          date : res.rows.item(i).Date,
          time : res.rows.item(i).Time,
          location : res.rows.item(i).Location
        });

      }
    }
  }, function(error){
    console.error();(error);
  });

  // Called when the form is submitted
  $scope.createRecord = function(record) {
    if (record.location.length > 0){
      $scope.records.push({
        date: record.date,
        time: record.time,
        location: record.location
      });
      $scope.recordModal.hide();
      //insert record in database
      var query = "INSERT INTO dogFindings (Date, Time, Location) VALUES (?,?,?)";
      $cordovaSQLite.execute(db, query, [record.date, record.time, record.location]).then(function(res) {
        console.log("INSERT ID -> " + res.insertId);
      }, function (err) {
        console.error(err);
      });

      console.log("Record created!");
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
});
