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

.controller('MapCtrl', function($scope, $ionicLoading) {
  new GMaps({
    el: '#map',
    lat: -12.043333,
    lng: -77.028333
  })
})

/*google.maps.event.addDomListener(window, 'load', function() {

var map = new google.maps.Map(document.getElementById("map"), {
center: new google.maps.LatLng(48.878065, 2.372106),
zoom: 16,
mapTypeId: google.maps.MapTypeId.ROADMAP
});

navigator.geolocation.getCurrentPosition(function(pos) {
map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
var myLocation = new google.maps.Marker({
position: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
map: map,
title: "My Location"
});
console.log ("My location is "+ myLocation);
});

$scope.map = map;
//});

})*/

.controller('RecordCtrl', function($scope, $stateParams) {
})


.controller('RecordLogsCtrl', function($scope, $ionicModal, $cordovaSQLite, $cordovaCamera, $cordovaImagePicker, $ionicPlatform) {

  $scope.records = [];
  $scope.selectedRec = [];
  $scope.record = [];

  // Create and load the Modal
  $ionicModal.fromTemplateUrl('newRecord.html', function(modal) {
    $scope.recordModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });

  $scope.doRefresh = function() {
    $scope.records = [];
    var query = "SELECT * FROM dogFindings";
    $cordovaSQLite.execute(db, query, []).then(function(res) {
      if(res.rows.length > 0){
        for (var i=0; i<res.rows.length; i++){

          $scope.records.push({
            dateTime : res.rows.item(i).DateTime,
            location : res.rows.item(i).Location,
            id : res.rows.item(i).id
          });
          var ids = res.rows.item(i).id;
          console.log(ids);
        }
      }
    }, function(error){
      console.error();(error);
    });
    // Stop the ion-refresher from spinning
    $scope.$broadcast('scroll.refreshComplete');
  };

  // Called when the form is submitted
  $scope.createRecord = function(record) {
    //if (record.location.length > 0){
    //insert record in database
    var query = "INSERT INTO dogFindings (DateTime, Location, Image) VALUES (?,?,?)";
    $cordovaSQLite.execute(db, query, [record.dateTime, record.location, record.imgBlob]).then(function(res) {
      console.log("INSERT ID -> " + res.insertId);
    }, function (err) {
      console.error(err);
    });

    $scope.recordModal.hide();
    $scope.doRefresh;

    console.log("Record created!");
    record.dateTime = null;
    record.location = null;
  };

  // Open our new record modal
  $scope.newRecord = function() {
    $scope.record.dateTime = new Date();
    $scope.record.ImageURI = 'No Image';
    $scope.recordModal.show();
  };

  $scope.selectRecord = function(id) {
    console.log("Record Selected.");
    console.log(id);
    var query = "SELECT * FROM dogFindings WHERE id = ?";
    $cordovaSQLite.execute(db, query, [id]).then(function(res) {
      if(res.rows.length > 0){
        console.log("Record found");
        $scope.selectedRec.push({
          dateTime : res.rows.item(0).DateTime,
          location : res.rows.item(0).Location,
          id : res.rows.item(0).id
        });
        console.log("This happened");
      }
    }, function(error){
      console.error();(error);
    });
  };

  // Close the new record modal
  $scope.closeNewRecord = function() {
    $scope.recordModal.hide();
  };

  // Finds current location using GPS
  $scope.findLocation = function() {
    console.log("findLocation pressed!");
  };

  $scope.dataURItoBlob = function(dataURI) {
    return new Blob([dataURI]);
  };

  $scope.takePhoto = function() {  var options = {  quality : 75,  destinationType : Camera.DestinationType.DATA_URL,  sourceType : Camera.PictureSourceType.CAMERA,  allowEdit : false, encodingType: Camera.EncodingType.JPEG, targetWidth: 300, targetHeight: 300, popoverOptions: CameraPopoverOptions, saveToPhotoAlbum: false };

  $cordovaCamera.getPicture(options).then(function(imageData) {
    $scope.imageURI = "data:image/jpeg;base64," + imageData;
    blobImg = $scope.dataURItoBlob($scope.imageURI);
    console.log(blobImg);
    $scope.record.ImageURI = 'Image Selected';
    $scope.record.imgBlob = blobImg;
    //here you will call insert function
  }, function(err) {
    // An error occured. Show a message to the user

  });
  $scope.$apply();
};

$scope.getPhoto = function() {
  function UploadPicture(imageURI) {
    console.log(imageURI);
    $scope.record.ImageURI =  imageURI;
    $scope.$apply();
    console.log($scope.record.ImageURI);
  }
  navigator.camera.getPicture(UploadPicture, function(message) {
    alert('get picture failed');
  }, {
    quality: 50,
    destinationType: navigator.camera.DestinationType.FILE_URI,
    sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
  });
};

});
