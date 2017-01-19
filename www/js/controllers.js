angular.module('PooperSnooper.controllers', ['ionic', 'backand', 'ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, ConnectivityMonitor, $timeout, $ionicPopup, backandService, $ionicLoading, LoginService) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e))
  //

  $scope.findings = [];
  $scope.bins = [];
  $scope.input = {};
  $scope.poopMarkers = [{}];
  $scope.id = 0;


  $scope.getAllFindings = function() {
    backandService.getEveryFinding()
      .then(function(result) {
        $scope.findings = result.data.data;
        console.log("Got all findings");
      });
  }

  $scope.selectFinding = function(id, viewModal) {
    backandService.selectFinding(id)
      .then(function(result) {
        console.log("Selected finding");
        $scope.selectedRec = result.data;
        console.log(JSON.stringify($scope.selectedRec));
        viewModal.show();
        $ionicLoading.hide();
      });
  }


  $scope.addFinding = function() {
    backandService.addFinding($scope.input)
      .then(function(result) {
        $scope.input = {};
        $scope.id = result.data.__metadata.id;
        console.log($scope.id);
      });
  }

  $scope.deleteFinding = function(id) {
    backandService.deleteFinding(id)
      .then(function(result) {
        console.log("HERE");
        console.log(result);
      });
  }

  $scope.getAllBins = function() {
    backandService.getEveryBin()
      .then(function(result) {
        $scope.bins = result.data.data;
        console.log("Got all Bins");
      });
  }

  $scope.addBin = function() {
    backandService.addBin($scope.input)
      .then(function(result) {
        $scope.input = {};
      });
  }

  $scope.deleteBin = function(id) {
    backandService.deleteBin(id)
      .then(function(result) {
        console.log(result);
      });
  }

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

  function onLogin(username) {
    console.log("Loged in!");
  }

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    if(ConnectivityMonitor.isOnline()) {

    $ionicLoading.show({
      template: '<p>Logging in</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
    });

    console.log('Doing login > ' + $scope.loginData.email + ' ' + $scope.loginData.password);
    LoginService.signin($scope.loginData.email, $scope.loginData.password)
      .then(function() {
        $ionicLoading.hide();
        onLogin();
        $scope.closeLogin();
      }, function(error) {
        console.log(JSON.stringify(error));
        $ionicLoading.hide();
        var alertPopup = $ionicPopup.alert({
          title: 'Can\'t Login',
          template: error.error_description
        });
      })
    } else {
      var alertPopup = $ionicPopup.alert({
        title: 'Can\'t Login',
        template: 'Internet connection is needed to login'
      });
    }
  };

  $scope.getAllFindings();
  $scope.getAllBins();

})


/* ------------------------------------------------ */
/* ------------ Record Logs Controller ------------ */
/* ------------------------------------------------ */
.controller('RecordLogsCtrl', function($scope, $ionicModal, $cordovaCamera, $cordovaImagePicker, $filter, $ionicLoading, $cordovaGeolocation, GlobalService, $cordovaSQLite, backandService) {

  // // //Drop table for testing
  // var query = "DROP TABLE IF EXISTS dogFindings";
  // $cordovaSQLite.execute(db, query).then(function(res) {
  //   console.log("Table deleted");
  // }, function(err) {
  //   console.error(err);
  // });

  //This would be buggy when re-oppening the record page
  // //Update record logs from the factory service upon entering page
  // $scope.$on('$ionicView.afterEnter', function() {
  //   $scope.records = angular.copy(GlobalService.get_doggyRecords());
  // });

  // Blank form used reset fields
  $scope.record = {
    ImageURI: "",
    fileName: "",
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

  $ionicModal.fromTemplateUrl('templates/modal/record-modal.html', function(modal) {
    $scope.viewRecordModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });



  $scope.doRefresh = function() {
    $scope.getAllFindings();
    // Stop the ion-refresher from spinning
    $scope.$broadcast('scroll.refreshComplete');
  };


  $scope.doRefresh();

  // Called when the form is submitted
  $scope.createRecord = function() {
    //insert record in database
    $scope.input.Lat = $scope.record.lat;
    $scope.input.Long = $scope.record.long;
    $scope.input.DateTime = $scope.record.dateTime;
    $scope.input.ImageURI = $scope.record.imageURI;
    console.log(JSON.stringify($scope.input));
    $scope.addFinding();

    $scope.recordModal.hide();
    $scope.doRefresh();
  };

  clearRecord = function() {
    $scope.myLocation = "* No Location *";
    $scope.record.lat = 0;
    $scope.record.long = 0;
    $scope.record.fileName = 'No Image';
    $scope.record.imageURI = undefined;

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
    console.log("Record Selected > " + id);
    $scope.selectFinding(id, $scope.viewRecordModal);
  };


  // Close the new record modal
  $scope.closeNewRecord = function() {
    $scope.recordModal.hide();
  };
  $scope.closeViewRecord = function() {
    $scope.viewRecordModal.hide();
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
      $scope.createEnabled = true;
    }, function(error) {
      console.log("Could not get location");
      $scope.myLocation = "*Location not found*";
      $ionicLoading.hide();
    });
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
      $scope.record.imageURI = "data:image/jpeg;base64," + imageData;
      if ($scope.record.lat && $scope.record.long) $scope.createEnabled = true;
    }, function(err) {
      // An error occured. Show a message to the user
    });
  };


})

/* ----------------------------------------------------------- */
/* --------------------- Map Controller ---------------------- */
/* ----------------------------------------------------------- */

//Note : removed $state from dependencies (dunno what it did!)
.controller('MapCtrl', function($scope, $cordovaGeolocation, $ionicModal,
  $window, $ionicPopup, $ionicLoading, $rootScope, $cordovaNetwork, $ionicSideMenuDelegate,
  GlobalService, ConnectivityMonitor, $cordovaCamera, $cordovaImagePicker, $cordovaSQLite) {

  // // //Drop table for testing
  // var query = "DROP TABLE IF EXISTS dogFindings";
  // $cordovaSQLite.execute(db, query).then(function(res) {
  //   console.log("Table deleted");
  // }, function(err) {
  //   console.error(err);
  // });

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

        //Get poop and bin markers from database
        getPoopMarkers();
        getBinMarkers();

        // INITIAL USER LOCATION Marker
        var marker = new google.maps.Marker({
          map: $scope.map,
          //animation: google.maps.Animation.DROP,
          zIndex: 100,
          icon: circle_icon,
          position: latLng
        });
        $scope.userMarker = marker;

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

  function getPoopMarkers() {
    var poopLats = [];
    var poopLngs = [];
    var marker = {};
    console.log("Number of findings > " + $scope.findings.length);
    if ($scope.findings.length > 0) {
      for (var i = 0; i < $scope.findings.length; i++) {
        poopLats.push(Number($scope.findings[i].Lat));
        poopLngs.push(Number($scope.findings[i].Long));
      }
      for (i = 0; i < poopLats.length; i++) {
        var myLatLng = new google.maps.LatLng({
          lat: poopLats[i],
          lng: poopLngs[i]
        });
        marker = new google.maps.Marker({
          position: myLatLng,
          icon: poop_icon
        });

        var markerData = {
          lat: marker.getPosition().lat(),
          lng: marker.getPosition().lng(),
          icon: marker.getIcon().url,
          id: $scope.findings[i].id
        };
        GlobalService.push_poopMarkers(markerData);


      }

      console.log("poop > " + poopLats + poopLngs);
    }
    loadMarkers();
  }


  function getBinMarkers() {
    var binLats = [];
    var binLngs = [];
    console.log("Number of bins > " + $scope.bins.length);
    if ($scope.bins.length > 0) {
      for (var i = 0; i < $scope.bins.length; i++) {
        binLats.push(Number($scope.bins[i].Lat));
        binLngs.push(Number($scope.bins[i].Long));
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

      console.log("bins > " + binLats + binLngs);
    }
    loadMarkers();
  }


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

    google.maps.event.addListener(marker, 'click', function() {
      console.log("clicked " + $scope.id);
      $ionicLoading.show({
        template: '<p>Loading Finding</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
      });
      $scope.selectFinding($scope.id, $scope.viewRecordModal);
    });

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

    $scope.input.Lat = markerData.lat;
    $scope.input.Long = markerData.lng;
    $scope.input.DateTime = new Date();
    console.log(JSON.stringify($scope.input));
    $scope.addBin();

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
        var id = markers[i].id;

        if (currentIcon == poop_icon) {
          google.maps.event.addListener(marker, 'click', function() {
            console.log("clicked " + id);
            $ionicLoading.show({
              template: '<p>Loading Finding</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
            });
            $scope.selectFinding(id, $scope.viewRecordModal);
          });
          console.log(JSON.stringify(id));
        }


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
    ImageURI: "",
    fileName: "",
    dateTime: "",
    time: "",
    lat: "",
    long: ""
  }
  $scope.createEnabled = false;

  // Create and load the Modal
  $ionicModal.fromTemplateUrl('templates/modal/newPoop-modal.html', function(modal) {
    $scope.poopModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });

  $ionicModal.fromTemplateUrl('templates/modal/record-modal.html', function(modal) {
    $scope.viewRecordModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });

  $scope.closeViewRecord = function() {
    $scope.viewRecordModal.hide();
  };

  clearRecord = function() {
    $scope.record.lat = null;
    $scope.record.long = null;
    $scope.record.fileName = 'No Image';
    $scope.record.imageURI = undefined;

    $scope.record.dateTime = new Date();
    $scope.record.time = ($scope.record.dateTime.getHours() < 10 ? '0' : '') + ($scope.record.dateTime.getHours() + ":" +
      ($scope.record.dateTime.getMinutes() < 10 ? '0' : '') + $scope.record.dateTime.getMinutes());
  };

  // Open our new record modal
  $scope.newRecord = function() {
    clearRecord();
    $scope.createEnabled = false;
    console.log(JSON.stringify(iconLatLng.lat()));
    console.log(JSON.stringify(iconLatLng.lng()));
    $scope.record.lat = iconLatLng.lat();
    $scope.record.long = iconLatLng.lng();
    $scope.poopModal.show();
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
      $scope.record.imageURI = "data:image/jpeg;base64," + imageData;
      $scope.createEnabled = true;
    }, function(err) {
      // An error occured. Show a message to the user
    });
  };

  // Close the new record modal
  $scope.closeNewRecord = function(record) {
    $scope.poopModal.hide();
    clearRecord();
  };

  // Create record item
  $scope.createRecord = function(record) {
    //insert record in database
    $scope.input.Lat = $scope.record.lat;
    $scope.input.Long = $scope.record.long;
    $scope.input.DateTime = $scope.record.dateTime;
    $scope.input.ImageURI = $scope.record.imageURI;
    console.log(JSON.stringify($scope.input));
    $scope.addFinding();
    $scope.poopModal.hide();
    clearRecord();

    //Adds the marker to your map upon creating the Record
    $scope.addPoopMarker();
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
