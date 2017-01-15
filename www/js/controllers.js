angular.module('PooperSnooper.controllers', ['ionic', 'ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e))
  //

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
.controller('RecordLogsCtrl', function($scope, $ionicModal, $cordovaCamera, $cordovaImagePicker, $filter, $ionicLoading, $cordovaGeolocation, GlobalService, $cordovaSQLite) {

  //Get database
  var db = $cordovaSQLite.openDB({
    name: 'tester.db',
    location: 'default'
  });
  // //Drop table for testing
  // var query = "DROP TABLE IF EXISTS dogFindings";
  // $cordovaSQLite.execute(db, query).then(function(res) {
  //   console.log("Table deleted");
  // }, function(err) {
  //   console.error(err);
  // });
  //Create table if doesn't exist
  var query = "CREATE TABLE IF NOT EXISTS dogFindings (id integer primary key, DateTime text, Lat number, Long number, Image blob)";
  $cordovaSQLite.execute(db, query).then(function(res) {
    console.log("Table Created");
    $scope.doRefresh();
  }, function(err) {
    console.error(err);
  });

  //Update record logs from the factory service upon entering page
  $scope.$on('$ionicView.afterEnter', function() {
    $scope.records = angular.copy(GlobalService.get_doggyRecords());
  });

  // Blank form used reset fields
  $scope.record = {
    ImageURI: "",
    fileName: "",
    imgBlob: "",
    dateTime: "",
    time: "",
    lat: "",
    long: ""
  }
  $scope.myLocation = "* No Location *";
  $scope.createEnabled = false;

  // Blank form used to reset fields
  var emptyForm = angular.copy($scope.record);

  // Create and load the Modal
  $ionicModal.fromTemplateUrl('templates/modal/newRecord-modal.html', function(modal) {
    $scope.recordModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });


  $scope.doRefresh = function() {
    $scope.records = [];
    var query = "SELECT * FROM dogFindings";
    $cordovaSQLite.execute(db, query, []).then(function(res) {
      if (res.rows.length > 0) {
        for (var i = 0; i < res.rows.length; i++) {

          $scope.records.push({
            dateTime: res.rows.item(i).DateTime,
            lat: res.rows.item(i).Lat,
            long: res.rows.item(i).Long,
            blob: res.rows.item(i).Image,
            id: res.rows.item(i).id
          });
        }
        console.log(JSON.stringify($scope.records));
      }
    }, function(error) {
      console.error();
    });
    // Stop the ion-refresher from spinning
    $scope.$broadcast('scroll.refreshComplete');
  };

  // Called when the form is submitted
  $scope.createRecord = function() {
    //insert record in database
    var query = "INSERT INTO dogFindings (DateTime, Lat, Long, Image) VALUES (?,?,?,?)";
    var record = [
      $scope.record.dateTime,
      $scope.record.lat,
      $scope.record.long,
      $scope.record.imgBlob
    ];
    $cordovaSQLite.execute(db, query, record).then(function(res) {
      console.log("INSERT ID -> " + res.insertId);
    }, function(err) {
      console.log('Error: ' + JSON.stringify(err));
    });

    $scope.recordModal.hide();
    $scope.doRefresh();
  };

  clearRecord = function() {
    $scope.myLocation = "* No Location *";
    $scope.record.lat = null;
    $scope.record.long = null;
    $scope.record.fileName = 'No Image';
    $scope.record.ImageURI = undefined;
    $scope.record.imgBlob = undefined;

    $scope.record.dateTime = new Date();
    $scope.record.time = ($scope.record.dateTime.getHours() < 10 ? '0' : '') + ($scope.record.dateTime.getHours() + ":" +
      ($scope.record.dateTime.getMinutes() < 10 ? '0' : '') + $scope.record.dateTime.getMinutes());
  };

  // Open our new record modal
  $scope.newRecord = function() {
    clearRecord();
    $scope.createEnabled = false;
    console.log($scope.record.dateTime);
    $scope.recordModal.show();
  };

  $scope.selectRecord = function(id) {
    console.log("Record Selected.");
    console.log(id);
    var query = "SELECT * FROM dogFindings WHERE id = ?";
    $cordovaSQLite.execute(db, query, [id]).then(function(res) {
      if (res.rows.length > 0) {
        console.log("Record found");
        $scope.selectedRec.push({
          dateTime: res.rows.item(0).DateTime,
          location: res.rows.item(0).Lat,
          location: res.rows.item(0).Long,
          id: res.rows.item(0).id
        });
        console.log("This happened");
      }
    }, function(error) {
      console.error();
      (error);
    });
  };


  // Close the new record modal
  $scope.closeNewRecord = function() {
    $scope.recordModal.hide();
  };

  // Finds current location using GPS
  $scope.findLocation = function() {
    $ionicLoading.show({
      template: '<p>Finding Location</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
    });
    var options = {
      timeout: 10000,
      enableHighAccuracy: true
    };
    $cordovaGeolocation.getCurrentPosition(options).then(function(position) {
      console.log(position.coords.latitude);
      console.log(position.coords.longitude);
      $scope.record.lat = position.coords.latitude;
      $scope.record.long = position.coords.longitude;
      $scope.myLocation = "Location Found";
      $ionicLoading.hide();
      if ($scope.record.imgBlob) $scope.createEnabled = true;
    }, function(error) {
      console.log("Could not get location");
      $scope.myLocation = "*Location not found*";
      $ionicLoading.hide();
    });
  };

  $scope.dataURItoBlob = function(dataURI, callback) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    try {
      return new Blob([ab], {
        type: mimeString
      });
    } catch (e) {
      // The BlobBuilder API has been deprecated in favour of Blob, but older
      // browsers don't know about the Blob constructor
      // IE10 also supports BlobBuilder, but since the `Blob` constructor
      //  also works, there's no need to add `MSBlobBuilder`.
      var BlobBuilder = window.WebKitBlobBuilder || window.MozBlobBuilder;
      var bb = new BlobBuilder();
      bb.append(ab);
      return bb.getBlob(mimeString);
    }
  };

  $scope.takePicture = function() {
    var options = {
      quality: 80,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 200,
      targetHeight: 200,
      popoverOptions: CameraPopoverOptions,
      correctOrientation: true,
      saveToPhotoAlbum: false
    };

    $cordovaCamera.getPicture(options).then(function(imageData) {
      $scope.record.ImageURI = "data:image/jpeg;base64," + imageData;
      $scope.record.imgBlob = $scope.dataURItoBlob($scope.record.ImageURI);
      console.log($scope.record.imgBlob);
      if ($scope.record.lat && $scope.record.long) $scope.createEnabled = true;
    }, function(err) {
      // An error occured. Show a message to the user
    });
  };


  $scope.getImage = function() {
    // Image picker will load images according to these settings
    var options = {
      maximumImagesCount: 1, // Max number of selected images, I'm using only one for this example
      width: 300,
      height: 300,
      quality: 80 // Higher is better
    };
    $cordovaImagePicker.getPictures(options).then(function(results) {
      // Loop through acquired images
      $scope.record.fileName = results[0].replace(/^.*[\\\/]/, '');
      $scope.record.ImageURI = results[0];
      $scope.record.imgBlob = $scope.dataURItoBlob(ImageURI);
      if ($scope.record.lat && $scope.record.long) $scope.createEnabled = true;
      //console.log($scope.record.fileName);
      //console.log($scope.record.ImageURI);
    }, function(error) {
      console.log('Error: ' + JSON.stringify(error)); // In case of error
    });
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
  $scope.$on('$ionicView.enter', function() {
    $ionicSideMenuDelegate.canDragContent(false);
  });
  //Re-enables swipe to side menu feature on exit page
  $scope.$on('$ionicView.leave', function() {
    $ionicSideMenuDelegate.canDragContent(true);
  });

  //------------------------->
  //--- Initial resources --->
  //------------------------>
  var apiKey = "AIzaSyD1-OU4tSucidW9oHkB5CCpLqSUT5fcl-E";
  var map = null;
  var iconLatLng = null;

  var markerCache = []; // Cache of all markerData. THESE ARE NOT REFERENCES TO MARKER OBJECTS!
  // It stores the MARKER DATA currently containing: 'lat', 'lng', 'icon.url'

  var binMarkerCache = []; // Cache of all (REFERENCES TO) BIN MARKER OBJECTS (hide/show)
  // It will probably be necessary to also keep references to poop markers
  // so we may refactor 'markerCache' to store references instead of data.
  // This will allow the users to remove delete Markers for instance.

  $scope.userMarker; // Used to reference current location Marker and update to new location

  var manMarker = null; // Reference to the 'man Marker' (finds nearestBin to the Marker location)

  var autoUpdateOption = true;

  var connLost = false;

  var nearestBinMarker; // Reference to the nearest bin marker (original) that we hide and
  // replace with the GIF marker indicating the nearest bin

  var tempBinMarker; // Reference to a temp Marker (gif) that indicates where the nearest bin is

  // Icon resources
  var poop_icon = {
    url: "img/Assets/poop_small.png",
    scaledSize: ''
  };
  var bin_icon = {
    url: "img/Assets/dog_bin_small.png",
    //scaledSize: ''
  };
  var man_icon = {
    url: "img/Assets/man-walking-dog_small.png",
    scaledSize: ''
  };
  var nearestBin_Icon = { //Bin GIF that indicates the nearest bin to the user
    url: "img/Assets/nearest-bin-small.gif",
    //scaledSize: ''
  };
  var circle_icon = {
    url: "img/Assets/blue.png",
    scaledSize: ''
  };
  var circle_iconA1 = {
    url: "img/Assets/blueA1.png",
    scaledSize: ''
  };
  var circle_iconA2 = {
    url: "img/Assets/blueA2.png",
    scaledSize: ''
  };
  var circle_iconA3 = {
    url: "img/Assets/blueA3.png",
    scaledSize: ''
  };
  var circle_iconA4 = {
    url: "img/Assets/blueA4.png",
    scaledSize: ''
  };


  // Fixes the error where opening a modal would cause the map to 'break'
  // Auto if the page has been visited before it will resume autoUpdate()
  $scope.$on('$ionicView.afterEnter', function() {
    ionic.trigger('resize');
    if (autoUpdateOption == false) {
      autoUpdateOption = true;
      autoUpdate();
      console.log("ABC");
    }
    if (connLost == true && ConnectivityMonitor.isOnline()) {
      connLost = false;
      loadGoogleMaps();
      initMap();
    }
  });

  // Resets button animation classes and stops autoUpdate
  $scope.$on('$ionicView.afterLeave', function() {
    document.getElementById("panelOpenHolder").style.visibility = "visible";
    document.getElementById("panelOpenHolder").className = "animated bounceInRight";
    document.getElementById("panelOpen").style.visibility = "visible";
    document.getElementById("panelOpen").className = "button button-icon animated bounceInRight";

    document.getElementById("panelMinimizeHolder").style.visibility = "hidden";
    document.getElementById("panelMinimizeHolder").className = "";
    document.getElementById("panelMinimize").style.visibility = "hidden";
    document.getElementById("panelMinimize").className = "button button-icon";
    document.getElementById("iconPanel").style.visibility = "hidden";
    document.getElementById("iconPanel").className = "";
    document.getElementById("poopDraggable").style.visibility = "hidden";
    document.getElementById("poopDraggable").className = "";
    document.getElementById("binDraggable").style.visibility = "hidden";
    document.getElementById("binDraggable").className = "";
    document.getElementById("manDraggable").style.visibility = "hidden";
    document.getElementById("manDraggable").className = "";

    autoUpdateOption = false;
  });

  //------------------------->
  //--- Initializing phase--->
  //------------------------>

  if (ConnectivityMonitor.isOnline()) {
    console.warn("online");
  } else {
    console.warn("offline");
  }


  if (typeof google == "undefined" || typeof google.maps == "undefined") {

    console.warn("Google Maps SDK needs to be loaded");

    //disableMap();
    var options = {
      timeout: 10000,
      enableHighAccuracy: true
    };

    if (ConnectivityMonitor.isOnline()) {
      loadGoogleMaps();
    }
  } else {
    if (ConnectivityMonitor.isOnline()) {
      initMap();
      enableMap();
    } else {
      disableMap();
    }
  }

  addConnectivityListeners();

  // Initialises Map element and gets current location
  function initMap() {
    var options = {
      timeout: 10000,
      enableHighAccuracy: true
    };

    $cordovaGeolocation.getCurrentPosition(options).then(function(position) {

      poop_icon.scaledSize = new google.maps.Size(20, 20);
      bin_icon.scaledSize = new google.maps.Size(35, 35);
      circle_icon.scaledSize = new google.maps.Size(50, 50);
      circle_iconA1.scaledSize = new google.maps.Size(50, 50);
      circle_iconA2.scaledSize = new google.maps.Size(50, 50);
      circle_iconA3.scaledSize = new google.maps.Size(50, 50);
      circle_iconA4.scaledSize = new google.maps.Size(50, 50);
      man_icon.scaledSize = new google.maps.Size(40, 40);

      var latLng = new google.maps.LatLng(position.coords.latitude,
        position.coords.longitude);

      var mapOptions = {
        center: latLng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false
      };

      $scope.map = new google.maps.Map(document.getElementById("map"),
        mapOptions);

      // Wait until the map is loaded and add Marker to current location
      google.maps.event.addListenerOnce($scope.map, 'idle', function() {

        // -------------------------------------------------
        // CREATING DUMMY MARKERS TO TEST LOADING FUNCTION
        // -------------------------------------------------

        var poopLats = [];
        var poopLngs = [];

        var binLats = [];
        var binLngs = [];

        //POOPS
        poopLats.push(53.650705);
        poopLngs.push(-2.986479);
        poopLats.push(53.646291);
        poopLngs.push(-2.975814);
        poopLats.push(53.648237);
        poopLngs.push(-2.969313);
        poopLats.push(53.648924);
        poopLngs.push(-2.979956);
        poopLats.push(53.648698);
        poopLngs.push(-2.978786);

        poopLats.push(53.650212);
        poopLngs.push(-2.979301);
        poopLats.push(53.650428);
        poopLngs.push(-2.97781);
        poopLats.push(53.64459966505379);
        poopLngs.push(-2.994503974914551);
        poopLats.push(53.647003665191235);
        poopLngs.push(-3.0152535438537598);
        poopLats.push(53.63496957119772);
        poopLngs.push(-2.972745895385742);

        poopLats.push(53.65099730954873);
        poopLngs.push(-2.958498001098633);
        poopLats.push(53.665951037123044);
        poopLngs.push(-2.9844188690185547);
        poopLats.push(53.66035672614186);
        poopLngs.push(-2.9656219482421875);
        poopLats.push(53.65567727758958);
        poopLngs.push(-2.994203567504883);
        poopLats.push(53.65588074267648);
        poopLngs.push(-2.9915428161621094);

        poopLats.push(53.652014738097655);
        poopLngs.push(-3.0062198638916016);
        poopLats.push(53.64692734983276);
        poopLngs.push(-3.0028724670410156);
        poopLats.push(53.64453606530589);
        poopLngs.push(-3.004159927368164);
        poopLats.push(53.63980397503522);
        poopLngs.push(-2.9929161071777344);
        poopLats.push(53.64061813590609);
        poopLngs.push(-2.9761791229248047);

        poopLats.push(53.642551704992265);
        poopLngs.push(-2.983388900756836);
        poopLats.push(53.643620218301244);
        poopLngs.push(-2.9889678955078125);
        poopLats.push(53.6473343634821);
        poopLngs.push(-2.994718551635742);

        // BINS
        binLats.push(53.64986539143778);
        binLngs.push(-2.979719638824463);
        binLats.push(53.648237410988955);
        binLngs.push(-2.9790759086608887);
        binLats.push(53.648046627915676);
        binLngs.push(-2.976651191711426);
        binLats.push(53.64901325326107);
        binLngs.push(-2.972724437713623);
        binLats.push(53.64952199454264);
        binLngs.push(-2.9810070991516113);

        binLats.push(53.65190027861155);
        binLngs.push(-2.980320453643799);
        binLats.push(53.645693565705784);
        binLngs.push(-2.979912757873535);
        binLats.push(53.644421585517954);
        binLngs.push(-2.975621223449707);
        binLats.push(53.647995752283684);
        binLngs.push(-2.9686689376831055);
        binLats.push(53.65287953306066);
        binLngs.push(-2.9754281044006348);

        binLats.push(53.650908283382584);
        binLngs.push(-2.9842472076416016);
        binLats.push(53.651366130234585);
        binLngs.push(-2.9871439933776855);
        binLats.push(53.64966189731898);
        binLngs.push(-2.9906201362609863);
        binLats.push(53.64691463059291);
        binLngs.push(-2.9868650436401367);
        binLats.push(53.64303508341375);
        binLngs.push(-2.9854488372802734);

        binLats.push(53.641597652376625);
        binLngs.push(-2.9799342155456543);
        binLats.push(53.63975308945901);
        binLngs.push(-2.9735398292541504);
        binLats.push(53.636292726261026);
        binLngs.push(-2.971973419189453);
        binLats.push(53.63602555406321);
        binLngs.push(-2.9680681228637695);
        binLats.push(53.641534048101576);
        binLngs.push(-2.9661154747009277);

        for (i = 0; i < poopLats.length; i++) {
          var myLatLng = new google.maps.LatLng(poopLats[i], poopLngs[i]);
          var marker = new google.maps.Marker({
            position: myLatLng,
            icon: poop_icon
          });
          var markerData = {
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng(),
            icon: marker.getIcon().url
          };
          GlobalService.push_poopMarkers(markerData);
        }

        for (i = 0; i < binLats.length; i++) {
          var myLatLng = new google.maps.LatLng({
            lat: binLats[i],
            lng: binLngs[i]
          });
          var marker = new google.maps.Marker({
            position: myLatLng,
            icon: bin_icon
          });
          var markerData = {
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng(),
            icon: marker.getIcon().url
          };
          GlobalService.push_binMarkers(markerData);
        }

        // INITIAL USER LOCATION Marker
        var marker = new google.maps.Marker({
          map: $scope.map,
          //animation: google.maps.Animation.DROP,
          zIndex: 100,
          icon: circle_icon,
          position: latLng
        });
        $scope.userMarker = marker;

        loadMarkers();

        //Reload markers every time the map moves
        google.maps.event.addListener($scope.map, 'dragend', function() {
          loadMarkers();
        });

        //Reload markers every time the zoom changes
        google.maps.event.addListener($scope.map, 'zoom_changed', function() {
          loadMarkers();
        });

        enableMap();
        autoUpdate();

      });

    }, function(error) {
      console.log("Could not get location");
      noLocationMap();
    });
  }
  //------------------------------->
  //---- Map related Functions ---->
  //------------------------------>

  // Auto Updates lngLat and user location
  function autoUpdate() {
    if (autoUpdateOption) {
      var options = {
        timeout: 10000,
        enableHighAccuracy: true
      };

      $cordovaGeolocation.getCurrentPosition(options).then(function(position) {

        var updateLatLng = new google.maps.LatLng(position.coords.latitude,
          position.coords.longitude);

        // Simulating movement by changing the latLng
        // var updateLatLng =  new google.maps.LatLng($scope.userMarker.getPosition().lat()+((Math.random()/4)-0.1)*0.0001,
        // $scope.userMarker.getPosition().lng()+((Math.random()/4)-0.1)*0.0001);

        $scope.userMarker.setPosition(updateLatLng);

        //$scope.map.panTo(updateLatLng);

      });

      // Call the autoUpdate() function every 1 seconds
      setTimeout(autoUpdate, 5);
    }
  }

  // Refreshes the map - currently has some unknown stutter ...
  $scope.refreshMap = function() {

    var options = {
      timeout: 10000,
      enableHighAccuracy: true
    };

    $cordovaGeolocation.getCurrentPosition(options).then(function(position) {

      var latLng = new google.maps.LatLng(position.coords.latitude,
        position.coords.longitude);

      $scope.map.panTo(latLng);

      $scope.userMarker.setPosition(latLng);

    }, function(error) {
      noLocationMap();
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

    var worldPoint = new google.maps.Point(GlobalService.get_onScreenX() /
      scale + bottomLeft.x, (GlobalService.get_onScreenY() -
        (0.0676 * $window.innerHeight)) / scale + topRight.y);

    //6.76% = Nav bar portion size of the Screen

    iconLatLng = $scope.map.getProjection().fromPointToLatLng(worldPoint);

    //Poop panel icon selected -> add poop marker
    if (GlobalService.get_iconType() == "poopDraggable") {
      $scope.showPConfirm();

    }
    //Bin panel icon selected -> add bin marker
    else if (GlobalService.get_iconType() == "binDraggable") {
      $scope.showBConfirm();
    }

    //Man panel icon selected -> add bin marker
    else if (GlobalService.get_iconType() == "manDraggable") {
      $scope.addManMarker();
    }

  }

  //Adds the poop Marker to the map (after record has been created)
  $scope.addPoopMarker = function() {
    $scope.minimizePanel();

    var marker = new google.maps.Marker({
      position: iconLatLng,
      map: $scope.map,
      animation: google.maps.Animation.DROP,
      zIndex: 0,
      icon: poop_icon
    });
    var markerData = {
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng(),
      icon: marker.getIcon().url
    };
    GlobalService.push_poopMarkers(markerData);

    // Adds the marker to markerCache (so it won't be re-added)
    addMarkerToCache(marker);

    /*
                var infoWindow = new google.maps.InfoWindow({
                content: "Some information!"
              });

              google.maps.event.addListener(marker, 'click', function () {
              infoWindow.open($scope.map, marker);
            });
            */

    GlobalService.set_activeIcon("");
  }

  //Adds the bin Marker to the map
  $scope.addBinMarker = function() {
    $scope.minimizePanel();

    var marker = new google.maps.Marker({
      position: iconLatLng,
      map: $scope.map,
      animation: google.maps.Animation.DROP,
      zIndex: 0,
      icon: bin_icon
    });
    var markerData = {
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng(),
      icon: marker.getIcon().url
    };
    GlobalService.push_binMarkers(markerData);

    // Adds the marker to binMarkerCache so we have a reference to it
    // to deal with the Nearest bin marker case
    binMarkerCache.push(marker);
    // Adds the marker to markerCache (so it won't be re-added)
    addMarkerToCache(marker);

    GlobalService.set_activeIcon("");
  }

  //Adds the bin Marker to the map
  $scope.addManMarker = function() {
    $scope.minimizePanel();

    if (manMarker != null) {
      manMarker.setVisible(true);
      manMarker.setPosition(iconLatLng);
    } else {
      var marker = new google.maps.Marker({
        position: iconLatLng,
        map: $scope.map,
        zIndex: 1,
        icon: man_icon
      });
      manMarker = marker;
    }
    GlobalService.set_activeIcon("");
    $scope.findNearestBin(manMarker);
  }

  //-------------------------------->
  //---- Connectivity functions ---->
  //------------------------------->

  function enableMap() {
    $ionicLoading.hide();
  }

  function disableMap() {
    $ionicLoading.hide();
    connLost = true;
    var alertPopup = $ionicPopup.alert({
      title: 'Connection not found.',
      template: 'You must be connected to the Internet to view this map.'
    });
  }

  function noLocationMap() {
    $ionicLoading.hide();
    connLost = true;
    var alertPopup = $ionicPopup.alert({
      title: 'Location not found.',
      template: 'Please check your location settings'
    });
  }

  // Attempts to load the map
  function loadGoogleMaps() {

    $ionicLoading.show({
      template: '<p>Loading Google Maps</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
    });

    //This function will be called once the SDK has been loaded
    window.mapInit = function() {
      initMap();
    };

    //Create a script element to insert into the page
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "googleMaps";

    //Note the callback function in the URL is the one we created above
    script.src = 'http://maps.google.com/maps/api/js?key=' + apiKey +
      '&callback=mapInit';

    document.body.appendChild(script);
  }

  // Checks if the Map has been loaded. Attempts to load otherwise.
  function checkLoaded() {
    if (typeof google == "undefined" || typeof google.maps == "undefined") {
      loadGoogleMaps();
    } else {
      enableMap();
    }
  }

  //---------------------------->
  //----- Marker functions ----->
  //--------------------------->

  // Load markers (Only load on screen Markers)
  // NOTE: Database only requires lngLat data and maybe the marker
  //			 information (message) as we create it from scratch
  function loadMarkers() {

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

    //Get all of the markers from our array of Markers
    var markers = GlobalService.get_newMarkers(params, "poop");
    var bMarkers = GlobalService.get_newMarkers(params, "bin");
    for (var i = 0; i < bMarkers.length; i++) {
      markers.push(bMarkers[i]);
    }

    for (var i = 0; i < markers.length; i++) {
      if (!markerExists(markers[i].lat, markers[i].lng, markers[i].icon)) {

        if (markers[i].icon == poop_icon.url) {
          currentIcon = poop_icon;
        } else if (markers[i].icon == bin_icon.url) {
          currentIcon = bin_icon;
        }

        var latLng = new google.maps.LatLng(markers[i].lat, markers[i].lng);

        var markerVisibility;

        // Hides the Bin Marker if it has been chosen as the nearest bin before it was loaded
        if (nearestBinMarker != null) {
          if (currentIcon.url == bin_icon.url &&
            latLng == nearestBinMarker.getPosition) {
            markerVisibility = false;
          } else {
            markerVisibility = true;
          }
        } else {
          markerVisibility = true;
        }

        // Adds the (new) marker to the map
        var marker = new google.maps.Marker({
          map: $scope.map,
          //animation: google.maps.Animation.DROP,
          position: latLng,
          zIndex: 0,
          visible: markerVisibility,
          icon: currentIcon
        });

        // Adds the marker to markerCache (so it won't be re-added)
        addMarkerToCache(marker);

        // Adds the marker to binMarkerCache so we have a reference to it
        // to deal with the Nearest bin marker (hide/show)
        if (marker.getIcon().url == bin_icon.url) {
          binMarkerCache.push(marker);
        }
      }
    }
  }

  // Find the nearest bin and add a Marker to indicate it (replacing the previous marker temporarily)
  // TWO DIFFERENT CASES:
  // Case 1 - Called via the bottom left button to search for the nearest bin to the user location
  // Case 2 - Called via placing the man Marker to search for the nearest bin to the placed Marker

  $scope.findNearestBin = function(loc) {

    // Hides the man Marker if function called for Case 1
    if (loc.getIcon().url == $scope.userMarker.getIcon().url) {
      if (manMarker != null) {
        manMarker.setVisible(false);
      }
    }
    // Replaces the indicator GIF with the original marker
    if (tempBinMarker != null) {
      tempBinMarker.setMap(null);
    }
    if (nearestBinMarker != null) {
      nearestBinMarker.setVisible(true);
    }

    //Convert objects returned by Google to be more readable
    var center = {
      lat: loc.getPosition().lat(),
      lng: loc.getPosition().lng()
    };

    // Receive the nearest bin Marker's DATA from Database.
    var nearestBin = GlobalService.get_NearestBin(center);

    // Find the reference to the nearest Bin Marker if already loaded (from binMarkerCache),
    // hide it temporarily and replace with the GIF indicator
    // Note: There is a chance that the nearest Bin Marker has not been loaded. In this case
    //       there is nothing to hide and it will be hidden when added if appropriate.
    for (var i = 0; i < binMarkerCache.length; i++) {
      if ((binMarkerCache[i].getPosition().lat() == nearestBin.lat) &&
        (binMarkerCache[i].getPosition().lng() == nearestBin.lng) &&
        (binMarkerCache[i].getIcon().url == nearestBin.icon)) {

        nearestBinMarker = binMarkerCache[i];
        nearestBinMarker.setVisible(false);
        break;
      }
    }

    var binLatLng = new google.maps.LatLng(nearestBin.lat,
      nearestBin.lng);

    var marker = new google.maps.Marker({
      map: $scope.map,
      position: binLatLng,
      icon: nearestBin_Icon,
      zIndex: 1,
      optimized: false
    });

    // Pan to the location of the Nearest Bin - Case 1
    // Pan to the placed marker	- Case 2
    if (manMarker != null) {
      if (loc.getIcon().url == manMarker.getIcon().url) {
        $scope.map.panTo(manMarker.getPosition());
      } else {
        $scope.map.panTo(binLatLng);
      }
    } else {
      $scope.map.panTo(binLatLng);
    }

    tempBinMarker = marker;
  }

  // Adds new Marker to markerCache (so it won't be re-added)
  function addMarkerToCache(marker) {
    var markerData = {
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng(),
      icon: marker.getIcon().url,
    };
    markerCache.push(markerData);
  }

  // Checks if the Marker exists on the Map already (via our Cache)
  function markerExists(lat, lng, icon) {
    var exists = false;
    var cache = markerCache;
    for (var i = 0; i < cache.length; i++) {
      if (cache[i].lat === lat && cache[i].lng === lng &&
        cache[i].icon === icon) {
        exists = true;
      }
    }
    return exists;
  }

  // Gets bounding radius
  function getBoundingRadius(center, bounds) {
    return getDistanceBetweenPoints(center, bounds.northeast, 'miles');
  }

  // Calculates the distance between two points
  // google.maps.geometry.spehrical.computeDistanceBetween() ?!
  function getDistanceBetweenPoints(pos1, pos2, units) {

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
  function toRad(x) {
    return x * Math.PI / 180;
  }

  //--------------------------->
  //----- Other functions ----->
  //-------------------------->

  // Displays icon Panel
  $scope.showIconPanel = function() {

    document.getElementById("panelOpenHolder").style.visibility = "hidden";
    document.getElementById("panelOpenHolder").className = "";
    document.getElementById("panelOpen").style.visibility = "hidden";
    document.getElementById("panelOpen").className = "button button-icon";

    document.getElementById("panelMinimizeHolder").style.visibility = "visible";
    document.getElementById("panelMinimizeHolder").className = "animated slideInRight";
    document.getElementById("panelMinimize").style.visibility = "visible";
    document.getElementById("panelMinimize").className = "button button-icon animated slideInRight";

    document.getElementById("iconPanel").style.visibility = "visible";
    document.getElementById("iconPanel").className = "animated slideInRight";
    document.getElementById("poopDraggable").style.visibility = "visible";
    document.getElementById("poopDraggable").className = "animated slideInRight";
    document.getElementById("binDraggable").style.visibility = "visible";
    document.getElementById("binDraggable").className = "animated slideInRight";
    document.getElementById("manDraggable").style.visibility = "visible";
    document.getElementById("manDraggable").className = "animated slideInRight";

  }

  // Minimizes icon Panel
  $scope.minimizePanel = function() {
    document.getElementById("panelOpenHolder").style.visibility = "visible";
    document.getElementById("panelOpenHolder").className = "animated slideInRight";
    document.getElementById("panelOpen").style.visibility = "visible";
    document.getElementById("panelOpen").className = "button button-icon animated slideInRight";

    document.getElementById("panelMinimizeHolder").style.visibility = "hidden";
    document.getElementById("panelMinimizeHolder").className = "";
    document.getElementById("panelMinimize").style.visibility = "hidden";
    document.getElementById("panelMinimize").className = "";
    document.getElementById("iconPanel").style.visibility = "hidden";
    document.getElementById("iconPanel").className = "";
    document.getElementById("poopDraggable").style.visibility = "hidden";
    document.getElementById("poopDraggable").className = "";
    document.getElementById("binDraggable").style.visibility = "hidden";
    document.getElementById("binDraggable").className = "";
    document.getElementById("manDraggable").style.visibility = "hidden";
    document.getElementById("manDraggable").className = "";

    if (GlobalService.get_activeIcon() == true) {
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

  }

  // Add info Window to Marker
  function addInfoWindow(marker, message) {

    var infoWindow = new google.maps.InfoWindow({
      content: message
    });

    google.maps.event.addListener(marker, 'click', function() {
      infoWindow.open(map, marker);
    });

  }

  // Connection checker
  function addConnectivityListeners() {

    if (ionic.Platform.isWebView()) {

      // Check if the map is already loaded when the user comes online,
      //if not, load it

      $rootScope.$on('$cordovaNetwork:online', function(event, networkState) {
        checkLoaded();
      });

      // Disable the map when the user goes offline
      $rootScope.$on('$cordovaNetwork:offline', function(event, networkState) {
        disableMap();
      });

    } else {

      //Same as above but for when we are not running on a device
      window.addEventListener("online", function(e) {
        checkLoaded();
      }, false);

      window.addEventListener("offline", function(e) {
        disableMap();
      }, false);
    }
  }

  //------------------------------>
  //---- New Record Functions ---->
  //------------------------------>

  // Blank form used reset fields
  $scope.record = {
    date: "",
    time: "",
    location: ""
  }
  var emptyForm = angular.copy($scope.record);

  // Create and load the Modal
  $ionicModal.fromTemplateUrl('templates/modal/newPoop-modal.html', function(modal) {
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
    if (record.location.length > 0) {
      GlobalService.push_doggyRecords({
        date: record.date,
        time: record.time,
        location: record.location
      });
      $scope.poopModal.hide();
      $scope.record = angular.copy(emptyForm);

      //Adds the marker to your map upon creating the Record
      $scope.addPoopMarker();
    } else {
      console.log("Location not entered!");
    }
  };

  //---------------------------->
  //---- Tutorial Functions ---->
  //--------------------------->

  $ionicModal.fromTemplateUrl('templates/modal/map-help/map-help-modal.html',
    function(modal) {
      $scope.helpModal = modal;
    }, {
      scope: $scope,
      animation: 'slide-in-left'
    });

  // Tutorial modal open
  $scope.tutorialStart = function() {
    $scope.helpModal.show();

    $scope.data = {};

    var setupSlider = function() {
      //some options to pass to our slider
      $scope.data.sliderOptions = {
        loop: false,
        effect: 'fade',
        speed: 300,
      };

      $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
        $scope.slider = data.slider;
      });

      $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {});

      $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
        $scope.activeIndex = data.slider.activeIndex;
        $scope.previousIndex = data.slider.previousIndex;
      });
    };
    setupSlider();
  }

  // Tutorial modal close
  $scope.tutorialEnd = function() {
    $scope.helpModal.hide();
  }

  //------------------------------------------------>
  //---- Confirm dialog resources and Functions ---->
  //----------------------------------------------->

  // Confirm dialog for adding Poop to the map
  $scope.showPConfirm = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Add this doggy record?',
      template: 'This logs your dog\'s mess. You can view all logs from your Doggy Records page.'
    });
    confirmPopup.then(function(res) {
      if (res) {
        $scope.newRecord();
      }
    });
  };

  // Confirm dialog for adding Bin to the map
  $scope.showBConfirm = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Add this Bin?',
      template: 'It will be added to your Bin DataBase used to find your nearest bins.'
    });
    confirmPopup.then(function(res) {
      if (res) {
        $scope.addBinMarker();
      }
    });
  };
});
