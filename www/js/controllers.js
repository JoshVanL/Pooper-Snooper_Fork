angular.module('PooperSnooper.controllers', ['ionic', 'backand', 'ngCordova', 'ng-walkthrough'])

// ----------------------------------------- >
// ------------ App Controller ------------ >
// --------------------------------------- >
.controller('AppCtrl', function($scope, $state, Backand, $ionicModal, ConnectivityMonitor,
 $timeout, $ionicPopup, $q, backandService, $ionicLoading, LoginService, AuthService, $cordovaSocialSharing, GlobalService) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    // $scope.$on('$ionicView.enter', function(e))

    $scope.findings = [];
    $scope.bins = [];
    $scope.input = {};
    $scope.poopMarkers = [{}];
    $scope.id = 0;
    $scope.loggedIn = 0;
    $scope.facebookToken = "";
    $scope.mapRec = null;
    $scope.numOfRecentRecords = 0; //Number of records user has made in last 24hrs

    loadUserDetails();


    function loadUserDetails() {
        var data = Backand.getUserDetails();
        if (data.$$state.value) {
            console.log("User already logged in!");
            //console.log(JSON.stringify(data));
            $scope.userData = data.$$state.value;
            //console.log(JSON.stringify($scope.userData));
            $scope.loggedIn = 1;
            getUserFindings($scope.userData.userId);
            getUserBins($scope.userData.userId);
        }
    }

    $scope.queryFindings = function() {
        return $scope.userFindings;
    }

    $scope.queryBins = function() {
        return $scope.userBins;
    }

    $scope.getUserFindings = function(id) {
        backandService.getUserFindings(id)
        .then(function(result) {
            $scope.userFindings = result.data.data;
            for(var i=0; i < $scope.userFindings.length; i++) {
                $scope.userFindings[i].date = JSON.stringify($scope.userFindings[i].DateTime).substring(1, 11);
                $scope.userFindings[i].time = JSON.stringify($scope.userFindings[i].DateTime).substring(12, 17);
                console.log($scope.userFindings[0].date);
            }
            $scope.displayFindings = $scope.userFindings;
        });
    }

    $scope.getUserBins = function(id) {
        backandService.getUserBins(id)
        .then(function(result) {
            $scope.userBins = result.data.data;
            for(var i=0; i < $scope.userBins.length; i++) {
                $scope.userBins[i].date = JSON.stringify($scope.userBins[i].DateTime).substring(1, 11);
                $scope.userBins[i].time = JSON.stringify($scope.userBins[i].DateTime).substring(12, 17);
            }
            $scope.displayBins = $scope.userBins;
        });
    }



    // Attempts to load the map
    function loadGoogleMaps() {
        $ionicLoading.show({
            template: '<p>Loading Google Maps</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
        });

        //This function will be called once the SDK has been loaded
        window.getGoogleMaps = function() {
            getGoogleMaps();
        };

        //Create a script element to insert into the page
        $scope.script = document.createElement("script");
        $scope.script.type = "text/javascript";
        $scope.script.id = "googleMaps";
        var apiKey = "AIzaSyD1-OU4tSucidW9oHkB5CCpLqSUT5fcl-E";

        //Note the callback function in the URL is the one we created above
        $scope.script.src = 'http://maps.google.com/maps/api/js?key=' + apiKey +
            '&callback=getGoogleMaps';

        document.body.appendChild($scope.script);
    }

    function moveMap() {
        var lat = ($scope.selectedRec.LatLng[0]);
        var long =($scope.selectedRec.LatLng[1]);
        console.log(lat, long);
        var latLng = new google.maps.LatLng(lat, long);
        if (!$scope.selectedRec.type) {
            var marker_icon = {
                url: "img/Assets/poop_small.png",
                scaledSize: new google.maps.Size(20, 20)
            };
        } else {
            var marker_icon = {
                url: "img/Assets/dog_bin_small.png",
                scaledSize: new google.maps.Size(20, 20)
            };
        }
        if ($scope.mapRecMarker) $scope.mapRecMarker.setMap(null);
        $scope.mapRecMarker = new google.maps.Marker({
            map: $scope.mapRec,
            //animation: google.maps.Animation.DROP,
            zIndex: 100,
            icon: marker_icon,
            position: latLng
        });
        $scope.mapRec.setCenter(latLng);
    }

    function getGoogleMaps() {
        if (typeof google == "undefined" || typeof google.maps == "undefined") {
            loadGoogleMaps();
            console.log("google maps needs to be loaded");
        } else if (1) {
            console.log("google maps sdk loaded, need modal map.");
            //This function will be called once the SDK has been loaded
            //window.moveMap = function() {
                var lat = ($scope.selectedRec.LatLng[0]);
                var long =($scope.selectedRec.LatLng[1]);
                var latLng = new google.maps.LatLng(lat, long);
                var mapOptions = {
                    center: latLng,
                    zoom: 15,
                    draggable: false,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    streetViewControl: false
                };
                $scope.mapRec = new google.maps.Map(document.getElementById("mapRec"), mapOptions);
                moveMap();

        } else {
            console.log("sdk and modal map exist");
            moveMap();
        }
    }

    $scope.selectFinding = function(id, viewModal, inRecLogs) {
        if(inRecLogs)$scope.showMap = 1;
        else $scope.showMap = 0;
        backandService.selectFinding(id)
        .then(function(result) {
            console.log("Selected finding");
            $scope.selectedRec = result.data;
            $scope.selectedRec.type = 0; //finding
            $scope.ownRecord = 0;

            $scope.selectedRec.date = JSON.stringify($scope.selectedRec.DateTime).substring(1, 11);
            $scope.selectedRec.time = JSON.stringify($scope.selectedRec.DateTime).substring(12, 17);
            if($scope.showMap && typeof google == "undefined") getGoogleMaps();
            if (result.data.user == $scope.userData.userId) $scope.ownRecord = 1;
            //console.log(JSON.stringify($scope.selectedRec));

            viewModal.show();
            $ionicLoading.hide();
            if($scope.showMap && ! (typeof google == "undefined")) getGoogleMaps();
        }, function(err) {
            $ionicLoading.hide();
            $scope.$broadcast('poopMarkerDeletedEvent', id);
            var noRec = $ionicPopup.alert({
                title: 'Record Not Found',
                template: 'This record cannot be found'
            });
        });
    }

    $scope.selectBin = function(id, viewModal, isRecLogs) {
        if(isRecLogs) $scope.showMap = 1;
        else $scope.showMap = 0;
        backandService.selectBin(id)
        .then(function(result) {
            console.log("Selected bin");
            $scope.selectedRec = result.data;
            $scope.selectedRec.type = 1; //bin
            $scope.ownRecord = 0;
            $scope.selectedRec.date = JSON.stringify($scope.selectedRec.DateTime).substring(1, 11);
            $scope.selectedRec.time = JSON.stringify($scope.selectedRec.DateTime).substring(12, 17);
            $scope.selectedRec.canValidate = $scope.selectedRec.canReport = 0;
            if($scope.showMap && typeof google == "undefined") getGoogleMaps();
            if($scope.loggedIn) {
                $scope.checkAbleToVote(id).then(function(res) {
                    if (result.data.user == $scope.userData.userId){
                        $scope.ownRecord = 1;
                        $scope.selectedRec.canValidate = $scope.selectedRec.canReport = 0;
                    }
                    //console.log(JSON.stringify($scope.selectedRec));
                    viewModal.show();
                    $ionicLoading.hide();
                    if($scope.showMap && ! (typeof google == "undefined")) getGoogleMaps();
                });
            } else {
                console.log(JSON.stringify($scope.selectedRec));
                viewModal.show();
                $ionicLoading.hide();
            }
        }, function(err) {
            $ionicLoading.hide();
            $scope.$broadcast('binMarkerDeletedEvent', id);
            var noRec = $ionicPopup.alert({
                title: 'Record Not Found',
                template: 'This record cannot be found'
            });
        });
    }

    $scope.checkAbleToVote = function(id) {
        var defer = $q.defer();
        backandService.filterBinValidations($scope.userData.userId, id)
        .then(function(result) {
            if(result.data.totalRows ==0)  {
                //console.log(JSON.stringify(result));
                console.log("User has not validated");
                backandService.filterBinReports($scope.userData.userId, id)
                .then(function(result2) {
                    if(result2.data.totalRows ==0) {
                        console.log("User has not reported");
                        $scope.selectedRec.canValidate = $scope.selectedRec.canReport = 1;
                        return 0;
                    }
                });
            }
        });
        defer.resolve();
        return defer.promise;
    };

    $scope.addFinding = function() {
        return new Promise(function(resolve, reject) {
            backandService.addFinding($scope.input)
            .then(function(result) {
                //console.log(JSON.stringify(result));
                $scope.input = {};
                $scope.id = result.data.__metadata.id;
                console.log($scope.id);
                $scope.input = {};
                //var createdFindingPopup = $ionicPopup.alert({
                //    title: 'Record Created',
                //    template: 'Your finding has been added!'
                //});
                resolve();
            });
        });
    }

    $scope.deleteFinding = function(id) {
        backandService.deleteFinding(id)
        .then(function(result) {
            //console.log("Finding deleted");
            $scope.$broadcast('poopMarkerDeletedEvent', id);
        });
    }

    $scope.updateFinding = function(id, data) {
        backandService.updateFinding(id, data)
        .then(function(result) {
            $scope.$broadcast('poopMarkerUpdatedEvent');
        });
    }

    $scope.updateBin = function(id, data, type) {
        $ionicLoading.show({
            template: '<p>Submitting Vote</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
        });
        backandService.updateBin(id, data)
        .then(function(result) {
            console.log(JSON.stringify(result));
            var valData = {
                user: $scope.userData.userId,
                bin: $scope.selectedRec.id
            };
            backandService.addUser_binValidation(valData)
            .then(function(result2) {
                $ionicLoading.hide();
                console.log(JSON.stringify(result2));
                if(type){
                    var validatedPopup = $ionicPopup.alert({
                        title: 'Validated!',
                        template: 'This bin has been confirmed by you!'
                    });
                } else {
                    var reportedPopup = $ionicPopup.alert({
                        title: 'Reported!',
                        template: 'This bin has been reported by you!'
                    });
                }
            });
        });
    }

    $scope.validateBin = function() {
        if($scope.loggedIn){
            var validateQuery = $ionicPopup.confirm({
                title: 'Validate?',
                template: 'Validating cannot be undone'
            });
            validateQuery.then(function(res) {
                if(res) {
                    $scope.selectedRec.Votes += 1;

                    var validatedID = $scope.selectedRec.id;
                    $scope.$broadcast('binValidatedEvent', validatedID);

                    $scope.selectedRec.canValidate = 0;
                    $scope.selectedRec.canReport = 0;
                    var updateData = {
                        Votes: ($scope.selectedRec.Votes)
                    };
                    $scope.updateBin($scope.selectedRec.id, updateData, 1);  //type 1 for validate
                }
            });
        } else {
            $scope.requireLogin('You must be logged in to validate or report a bin');
        }

    }
    // This should be made dry
    $scope.reportBin = function() {
        if($scope.loggedIn){
            var reportQuery = $ionicPopup.confirm({
                title: 'Report?',
                template: 'Report cannot be undone'
            });
            reportQuery.then(function(res) {
                $scope.selectedRec.Votes -= 1;

                var validatedID = $scope.selectedRec.id;
                $scope.$broadcast('binReportedEvent', validatedID);

                $scope.selectedRec.canReport = 0;
                $scope.selectedRec.canValidate = 0;
                var updateData = {
                    Votes: ($scope.selectedRec.Votes)
                };
                $scope.updateBin($scope.selectedRec.id, updateData, 0); //type 0 for report
            });
        } else {
            $scope.requireLogin('You must be logged in to validate or report a bin');
        }
    }

    $scope.getAllBins = function() {
        backandService.getEveryBin()
        .then(function(result) {
            $scope.bins = result.data.data;

        });
    }

    $scope.addBin = function() {
        return new Promise(function(resolve, reject) {
            backandService.addBin($scope.input)
            .then(function(result) {
                //console.log(JSON.stringify(result));
                $scope.id = result.data.__metadata.id;
                console.log($scope.id);
                $scope.input = {};
                resolve();
            });
        });
    }

    $scope.deleteBin = function(id) {
        //console.log("function: deleteBin - ID of Marker: " + id);
        backandService.deleteBin(id)
        .then(function(result) {
            $scope.$broadcast('binMarkerDeletedEvent', id);
        });
    }

    // Form data for the login modal
    $scope.loginData = {};
    $scope.signUpData = {};

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });

    // Create and load the Modal
    $ionicModal.fromTemplateUrl('templates/modal/signUp-modal.html', function(modal) {
        $scope.signUpModal = modal;
    }, {
        scope: $scope,
        animation: 'slide-in-up'
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function() {
        $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function() {
        $scope.loginData = {};
        $scope.modal.show();
    };

    // Triggered in the signUp modal to close it
    $scope.closeSignUp = function() {
        $scope.signUpModal.hide();
        $scope.signUpData = {};
        $scope.signUpData.password = '';
        $scope.modal.show();
    };

    //Open the signUp modal
    $scope.signUp = function() {
        $scope.signUpData = {};
        $scope.signUpData.password = '';
        $scope.modal.hide();
        $scope.signUpModal.show();
    };

    $scope.doSignUp = function() {

        $scope.signUpData.errorMessage = '';
        if ($scope.signUpData.password.length >= 6) {
            LoginService.signup($scope.signUpData.firstName, $scope.signUpData.lastName, $scope.signUpData.email, $scope.signUpData.password, $scope.signUpData.again)
            .then(function(response) {
                //getting invalid grant - username or password is incorrect for some reason
                // success

                var signedUpPopup = $ionicPopup.alert({
                    title: 'Signed Up!',
                    template: $scope.signUpData.email
                });
                signedUpPopup.then(function(res) {
                    onLogin($scope.signUpData.email);
                    $scope.signUpModal.hide();
                });

            }, function(reason) {
                console.log(JSON.stringify(reason));
                if (reason.data != undefined) {
                    console.log('reason.data!= undefined');
                    $scope.signUpData.errorMessage = reason.data;
                    if (reason.data.error_description == "The user is already signed up to this app"){
                        $scope.open = function(){}
                        var emailAlreadyExistsPopUp = $ionicPopup.show({
                            template: '',
                            title: 'The email address,<br>' + $scope.signUpData.email + ',<br>is already in use',
                            subTitle: 'Did you forget your password?',
                            scope: $scope,
                            buttons: [
                                {text: '<b>Try \n different\n email</b>',
                                    type: 'button-energized',
                                    onTap: function(e){
                                        emailAlreadyExistsPopUp.close();
                                    }
                                },
                                //						  {text: '<b>Log in</b>',
                                    //						   type: 'button-royal',
                                    //						   onTap: function(e){
                                        //						   			console.log('redirect to login');
                                        //						  		  }
                                        //						   },
                                        {text: '<b>Reset<br>password</b>',
                                            type: 'button-assertive',
                                            onTap: function(e){
                                                $scope.resetPwd($scope.signUpData.email);
                                                $scope.closeSignUp();
                                                var emailSentPopUp = $ionicPopup.show({
                                                    title: 'Email<br>with instructions<br>was sent to<br>' + $scope.signUpData.email //why??
                                                });
                                                closePopUpAuto(emailSentPopUp);
                                                emailSentPopUp.then(function(res) {
                                                    console.log('Does the menu button respond now?Yes');
                                                });
                                            }
                                        }
                            ]
                        });

                        emailAlreadyExistsPopUp.then(function(res) {
                            console.log('Does the menu button respond now?Yes');
                        });
                    }
                } else {
                    // getting invalid grant - username or password is incorrect for some reason
                    console.log('getting invalid grant');
                    //              $scope.signUpData.errorMessage = JSON.stringify(reason.error_description);
                    console.log($scope.signUpData.errorMessage);
                };
            });
        } else {
            $scope.signUpData.errorMessage = 'Password must be at least 6 characters';
        }
    };

    function closePopUpAuto (popup){ //close popup automatically
        $timeout(function() {
            popup.close(); //close the popup after 2 seconds
        }, 3000);
    };

    /*Reset password button*/
    $scope.resetPw = function () {
        var resetPopup = $ionicPopup.show({
            title: 'Enter your username',
            template: '<input type = "username">',
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Send Email</b>',
                    type: 'button-assertive',
                    onTap: function (e) {
                        $scope.resetPwd($scope.signUpData.email);
                        var sendPopup = $ionicPopup.show({
                            title: 'Reset email is sent to you'
                        });
                        closePopUpAuto(sendPopup);

                    }
                }

            ]



        })

    }

    $scope.resetPwd = function(email){
        console.log("reset password request for " + email);
        AuthService.requestResetPassword(email)
        .then(function(response){
            console.log("The response is " + JSON.stringify(response));
        }, function(rejection){
            console.log("rejected + "+JSON.stringify(rejection))
        });

    }

	$scope.socialSignIn = function(provider) {
        LoginService.socialSignIn(provider)
        .then(onValidLogin, onErrorInLogin);
    };

    $scope.socialSignUp = function(provider) {
          LoginService.socialSignUp(provider)
          .then(onValidLogin, onErrorInLogin);
      };

    onValidLogin = function(response) {
        onLogin();
        $scope.userData.username = response.data || $scope.userData.username;
        console.log("usrename is " + $scope.userData.username);
        var loginPopup = $ionicPopup.alert({
            title: 'Hi, ' + $scope.userData.fullName + ' :)'
        })
        loginPopup.then(function(res) {
            $scope.closeLogin();
        });
    }

    onErrorInLogin = function(rejection) {
        console.log("rejection");
        console.log(JSON.stringify(rejection));
    }

    function onLogin(username) {
        var data = Backand.getUserDetails();
        $scope.userData = data.$$state.value;
        if ($scope.userData == null){
          var loginPopup = $ionicPopup.alert({
              title: 'Oops... try again! :)'
          })
          loginPopup.then(function(res) {
              $scope.closePopUpAuto();
          });
        }
        $scope.loggedIn = 1;
        $scope.getUserFindings($scope.userData.userId);
        $scope.getUserBins($scope.userData.userId);
    }

    // Perform the login action when the user submits the login form
    $scope.doLogin = function() {
        if (ConnectivityMonitor.isOnline()) {

            $ionicLoading.show({
                template: '<p>Logging in</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
            });

            console.log('Doing login > ' + $scope.loginData.email + ' ' + $scope.loginData.password);
            LoginService.signin($scope.loginData.email, $scope.loginData.password)
            .then(function(res) {
                var loggedInPopup = $ionicPopup.alert({
                    title: 'Logged in!',
                    template: res.username
                });
                console.log(JSON.stringify(res));


                $scope.userData = res;
                $ionicLoading.hide();
                loggedInPopup.then(function(res) {
                    onLogin($scope.userData.username);
                    $scope.closeLogin();
                });
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


    $scope.doLogout = function() {
        if (ConnectivityMonitor.isOnline()) {
            $ionicLoading.show({
                template: '<p>Logging out</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
            });
            LoginService.signout().then(function() {
                $ionicLoading.hide();
                $scope.loggedIn = 0;
                $scope.userFindings = null;
                $scope.userData = null;
                var alertPopup = $ionicPopup.show({
                    title: 'Logged out',
                    template: 'You are now logged out'
                });
                closePopUpAuto(alertPopup);
            })
            $state.reload();
            $scope.userData.username = '';
        } else {
            var alertPopup = $ionicPopup.alert({
                title: 'Can\'t Logout',
                template: 'Internet connection is needed to logout'
            });
        }
    };

    $scope.requireLogin = function(text) {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Not logged in',
            template: text
        });
        confirmPopup.then(function(res) {
            if (res) {
                console.log('Pressed OK');
                $scope.login();
            } else {
                console.log('Pressed cancel');
            }
        });

    };

    $scope.isOverRecordLimit = function() {
        //console.log(JSON.stringify($scope.userFindings));
        var testTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago
        var recentRecs = 0;
        var recDate = new Date();
        for (var rec in $scope.userFindings) {
            recDate = new Date($scope.userFindings[rec].DateTime);
            if (recDate > testTime) recentRecs++;
            if (recentRecs > 4) return true;
        }
        for (var rec in $scope.userBins) {
            recDate = new Date($scope.userBins[rec].DateTime);
            if (recDate > testTime) recentRecs++;
            if (recentRecs > 4) return true;
        }
        return false;
    };


    //	change the link to the app link
    $scope.shareRecord = function() {
        var phrase = "Look at this poop! ";
        if ($scope.selectedRec.type) phrase = "Check out this bin! ";
        $cordovaSocialSharing.share(phrase, phrase, $scope.selectedRec.ImageURI, "http://www.natural-apptitude.co.uk");
    }


    //$scope.getAllFindings();
    //$scope.getAllBins();

    //
    //	$scope.username = '';
    //	onLogin();

})


/* ------------------------------------------------ */
/* ------------ Record Logs Controller ------------ */
/* ------------------------------------------------ */
.controller('RecordLogsCtrl', function($scope, $ionicModal, $cordovaCamera, $cordovaImagePicker,
 $filter, $ionicLoading, $cordovaGeolocation, $ionicPopup, GlobalService, backandService, sharedItems) {

    // Blank form used reset fields
    $scope.record = {
        ImageURI: "",
        fileName: "",
        dateTime: "",
        time: "",
        lat: "",
        long: ""
    }

    //Tutorial Functions
    $scope.demoCaption0 = "\nClick here to create a new doggy record";
    $scope.demoCaption1 = "\nWhen your records log is too full and you want to filter them, simply filter them here!";
    $scope.demoCaption2 = "Select which record you would like to add";
    $scope.demoCaption3 = "\nTake a picture of your record!";
    $scope.demoCaption4 = "\n\n\n\n\n\nMake sure to find your location";
    $scope.demoCaption5 = "\n\n\n\n\n\n\nFinally submit your record!";

    $scope.tutorialStart = function() {
        $scope.tutNum = 0;
        $scope.isActive0 = true;
    }

    $scope.nextTutorial = function() {
        switch ($scope.tutNum) {
            case 0:
                $scope.tutNum++;
                $scope.isActive0 = false;
                $scope.isActive1 = true;
                break;

            case 1:
                $scope.tutNum++;
                $scope.isActive1 = false;
                $scope.isActive2 = true;
                $scope.selectPopupTut = $ionicPopup.show({
                    title: 'Select record type to add!',
                    scope: $scope,
                    buttons: [
                        {
                            text: '<b">Doggy Finding</b>',
                            type: 'button icon-left button-energized',
                        },
                        {
                            text: '<b>Bin Location</b>',
                            type: 'button icon-left button-energized',
                        }
                    ]
                });
                break;


            case 2:
                $scope.selectPopupTut.close();
                $scope.recordModal.phrase = 'Add new finding';
                $scope.recordModal.type = 0; //finding = 0, bin = 1
                $scope.record.dateTime = new Date();
                $scope.record.time = ($scope.record.dateTime.getHours() < 10 ? '0' : '') + ($scope.record.dateTime.getHours() + ":" +
                    ($scope.record.dateTime.getMinutes() < 10 ? '0' : '') + $scope.record.dateTime.getMinutes());
                $scope.recordModalTut.show();
                $scope.tutNum++;
                $scope.isActive2 = false;
                $scope.isActive3 = true;
                break;

            case 3:
                $scope.tutNum++;
                $scope.isActive3 = false;
                $scope.isActive4 = true;
                break;

            case 4:
                $scope.tutNum++;
                $scope.isActive4 = false;
                $scope.isActive5 = true;
                break;

            case 5:
                $scope.recordModalTut.hide();
                $scope.isActive5 = false;
                $scope.tutNum = -1;
                break;

            default:
                break;
        }
    }



    $scope.myLocation = "* No Location *";
    $scope.createEnabled = false;

    $scope.showFindings = $scope.showBins = 1;

    // Blank form used to reset fields
    var emptyForm = angular.copy($scope.record);

    // Create and load the Modal
    $ionicModal.fromTemplateUrl('templates/modal/newRecord-modal.html', function(modal) {
        $scope.recordModal = modal;
    }, {
        scope: $scope,
        animation: 'slide-in-up'
    });

    $ionicModal.fromTemplateUrl('templates/modal/newRecord-modal.html', function(modal) {
        $scope.recordModalTut = modal;
    }, {
        scope: $scope,
        animation: 'none'
    });

    $ionicModal.fromTemplateUrl('templates/modal/record-modal.html', function(modal) {
        $scope.viewRecordModal = modal;
    }, {
        scope: $scope,
        animation: 'slide-in-up'
    });

    $ionicModal.fromTemplateUrl('templates/modal/filter-modal.html', function(modal) {
        $scope.filterModal = modal;
        // Shows Tutorial if this is the users first visit to the page!
        if(localStorage.getItem("firstRecVisit") == undefined){
            $scope.tutorialStart();

            localStorage.setItem("firstRecVisit", 1);
        } else {
            console.log("here");
            $scope.doRefresh();
        }

    }, {
        scope: $scope,
        animation: 'slide-in-up'
    });


    $scope.doRefresh = function() {
        //$scope.getAllFindings();
        if ($scope.loggedIn) {
            $scope.getUserFindings($scope.userData.userId);
            $scope.getUserBins($scope.userData.userId);
        } else {
            $scope.requireLogin('You must login to view your records');
        }
        // Stop the ion-refresher from spinning
        $scope.$broadcast('scroll.refreshComplete');
    };

    $scope.filterRecord = function() {
        $scope.filterAge =  "All";
        $scope.filterType = "All";
        $scope.filterModal.show();
    }

    $scope.applyFilter = function() {
        console.log($scope.filterAge);
        console.log($scope.filterType);
        if($scope.filterType == "Findings") {
            $scope.showBins = 0;
            $scope.showFindings = 1;
        } else if($scope.filterType == "Bins") {
            $scope.showBins = 1;
            $scope.showFindings = 0;
        } else {
            $scope.showBins = $scope.showFindings = 1;
        }
        if($scope.filterAge == "All") {
            $scope.displayBins = $scope.userBins;
            $scope.displayFindings = $scope.userFindings;
        } else if ($scope.filterAge = "Last 24 hrs") {
            var time = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
            $scope.displayBins = [];
            $scope.displayFindings = [];

            for(var i=0; i<$scope.userFindings.length; i++) {
                if(new Date($scope.userFindings[i].DateTime) > time) $scope.displayFindings.push($scope.userFindings[i]);
            }
            for(var i=0; i<$scope.userBins.length; i++) {
                if(new Date($scope.userBins[i].DateTime) > time) $scope.displayBins.push($scope.userBins[i]);
            }
        } else if ($scope.filterAge = "Last 3 weeks") {
            var time = new Date(new Date().getTime() - (24 * 60 * 60 * 1000 * 21));
            $scope.displayBins = [];
            $scope.displayFindings = [];

            for(var i=0; i<$scope.userFindings.length; i++) {
                if(new Date($scope.userFindings[i].DateTime) > time) $scope.displayFindings.push($scope.userFindings[i]);
            }
            for(var i=0; i<$scope.userBins.length; i++) {
                if(new Date($scope.userBins[i].DateTime) > time) $scope.displayBins.push($scope.userBins[i]);
            }
        }


        $scope.filterModal.hide();
    }

    $scope.onFilterChangeA = function(change) {
        console.log(change);
        $scope.filterAge = change;
    }

    $scope.onFilterChangeT = function(change) {
        console.log(change);
        $scope.filterType = change;
    }


    // Called when the form is submitted
    $scope.createRecord = function() {
        //insert record in database

        $scope.input.LatLng = [$scope.record.lat, $scope.record.long];
        $scope.input.DateTime = $scope.record.dateTime;
        $scope.input.ImageURI = $scope.record.imageURI;
        $scope.input.Username = $scope.userData.username;
        $scope.input.Cleaned = false;
        $scope.input.Cleanedby = null;
        $scope.input.user = $scope.userData.userId;
        //$scope.userFindings.push($scope.input);
        if($scope.recordModal.type){
            //bin
            $scope.input.Votes = 1;
            $scope.addBin().then(function() {
                var validateQuery = $ionicPopup.alert({
                    title: 'Bin Added',
                    template: 'Your bin has been added!'
                });
                validateQuery.then(function(res) {
                    $scope.recordModal.hide();
                });
            });
        } else {
            //poop
            $scope.input.Cleaned = false;
            $scope.input.Cleanedby = null;
            $scope.addFinding().then(function() {
                var validateQuery = $ionicPopup.alert({
                    title: 'Finding Added',
                    template: 'Your finding has been added!'
                });
                validateQuery.then(function(res) {
                    $scope.recordModal.hide();
                });
            });
        }


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
    $scope.newRecord = function(phrase, type) {
        $scope.record.dateTime = new Date();
        $scope.record.time = ($scope.record.dateTime.getHours() < 10 ? '0' : '') + ($scope.record.dateTime.getHours() + ":" +
            ($scope.record.dateTime.getMinutes() < 10 ? '0' : '') + $scope.record.dateTime.getMinutes());
        if ($scope.loggedIn) {
            if ($scope.isOverRecordLimit()) {
                var limitRecsPopup = $ionicPopup.alert({
                    title: 'You have reached record limit',
                    template: 'Please wait before adding more records'
                });
            } else {
                var selectPopup = $ionicPopup.show({
                    title: 'Select record type to add!',
                    scope: $scope,
                    buttons: [
                        {
                            text: '<b>Doggy Finding</b>',
                            type: 'button icon-left button-energized',
                            onTap: function(e) {
                                $scope.recordModal.type = 0;
                            }
                        },
                        {
                            text: '<b>Bin Location</b>',
                            type: 'button icon-left button-energized',
                            onTap: function(e) {
                                $scope.recordModal.type = 1;
                                phrase = 'Add new bin location';
                            }
                        }
                    ]
                });
                selectPopup.then(function(res) {
                    console.log(JSON.stringify(res));
                    clearRecord();
                    $scope.createEnabled = false;
                    $scope.recordModal.phrase = phrase;
                    //$scope.recordModal.type = type; //finding = 0, bin = 1
                    console.log($scope.recordModal.type);
                    $scope.recordModal.show();
                });
            }
        } else {
            $scope.requireLogin('You must be logged in to create a record');
        }
    };

    $scope.selectRecord = function(id, inRecLogs) {
        console.log("Record Selected > " + id);
        $scope.selectFinding(id, $scope.viewRecordModal, inRecLogs);
    };

    $scope.cleanUpRec = function() {
        if (!$scope.loggedIn) {
            $scope.requireLogin('You must be logged in to clean up a finding');
        } else {
            var confirmPopupClean = $ionicPopup.confirm({
                title: 'You cleaned up the finding?',
                template: 'This record will be marked as cleaned up by you and marked so on the map'
            });
            confirmPopupClean.then(function(res) {
                if (res) {
                    var updateData = {
                        Cleaned: true,
                        Cleanedby: $scope.userData.username
                    };
                    $scope.updateFinding($scope.selectedRec.id, updateData);
                    var createdFindingPopup = $ionicPopup.alert({
                        title: 'Record Cleaned Up!',
                        template: 'The finding has been marked as cleaned up by you!'
                    });
                    createdFindingPopup.then(function(res) {
                        $scope.viewRecordModal.hide();
                    });
                }
            });
        }
    };

    $scope.deleteRecord = function() {

        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete this doggy finding?',
            template: 'Deleted records cannot be retreived again. Are you sure??'
        });

        confirmPopup.then(function(res) {
            if (res) {
              if(!$scope.selectedRec.type) {
                console.log("Record to delete > " + $scope.selectedRec.id);
                $scope.deleteFinding($scope.selectedRec.id);
                var deleteFindingPopup = $ionicPopup.alert({
                    title: 'Record Deleted',
                    template: 'Your record has been deleted'
                });

                deleteFindingPopup.then(function(res) {
                    $scope.closeViewRecord();
                    sharedItems.setrefresh(true);
                    $scope.doRefresh();
                });
              } else {
                console.log("Record to delete > " + $scope.selectedRec.id);
                $scope.deleteBin($scope.selectedRec.id);
                var deleteBin = $ionicPopup.alert({
                    title: 'Record Deleted',
                    template: 'Your record has been deleted'
                });

                deleteBin.then(function(res) {
                    $scope.closeViewRecord();
                    sharedItems.setrefresh(true);
                    $scope.doRefresh();
                });
              }
            }
        });
    }


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
            quality: 70,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            allowEdit: false,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 320,
            targetHeight: 320,
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




// ------------------------------------------------- >
// ---------------- Map Controller ---------------- >
// ----------------------------------------------- >
.controller('MapCtrl', function($scope, $cordovaGeolocation, $ionicModal, $window, $ionicPopup,
 $ionicLoading, $rootScope, $cordovaNetwork, $ionicSideMenuDelegate, GlobalService, ConnectivityMonitor,
 $cordovaCamera, $cordovaImagePicker, backandService) {

    // -------------------------- >
    // --- Initial resources --- >
    // ------------------------ >

    var apiKey = "AIzaSyD1-OU4tSucidW9oHkB5CCpLqSUT5fcl-E";			// GMap API key
    var map = null;																							// Map element

    var iconLatLng = null;																			// Marker drop placement lat/lng (I think)

	// Marker storage
    var markerDataCache = []; 					    // Cache of all Markers that stores the data of each marker (lat/lng/icon/id)
	var binMarkerCache = []; 						// Cache of all BIN MARKER OBJECTS (holds all references)

	var poopDataCache = [];							// Cache storing poop marker data
	var binDataCache = [];							// Cache storing bin marker data

	var activePoopDataCache = [];
	var activeBinDataCache = [];

	var poopObjCache = [];							// Cache storing refs to poop marker objects
	var binObjCache = [];							// Cache storing refs to bin marker objects

	// Special Marker object references
    $scope.userMarker; 							    // Ref to current location Marker
    var manMarker = null; 							// Ref to the 'Man Marker' (finds nearestBin to the Marker location)
	var nearestBinMarker; 							// Ref to the nearest bin marker (original) that we hide temporarily
    var tempBinMarker; 							    // Ref to a temp Marker (gif) that indicates the nearest bin marker

	// Map options
    var autoUpdate = true;							// Bool - if set true then the user location will automatically update itself

	// System details
	var connLost = false;						    //True when user has no connection to internet
	var appInBackground = false;				    //True when app is minimized

	// Marker counters
	var binMarkerCount = 0;
	var poopMarkerCount = 0;

	var addMarkersCondition = 0;				    // Special condition used to 'wait' for Database functions to complete

	// Direction Service tools
	var directionsService = "";
	var directionsDisplay = "";

	// Geocoder
	var geocoder = "";

	// Downloaded marker area (when leaving this area a new DB call is needed)
	var loadedMapArea = {
		centerLat: "",
		centerLng: "",
		captureDist: ""
	};

    // Bool to show that the map page had been previously loaded
    var prevLoaded = 0;


    // Icon resources
    var poop_icon = {
        url: "img/Assets/poop_small.png",
        scaledSize: ''
    };
    var bin_icon = {
        url: "img/Assets/dog_bin_small.png",
        //scaledSize: ''
    };
    var bin_icon_conf = {
        url: "img/Assets/dog_bin_small_conf.png",
        //scaledSize: ''
    };
    var poop_icon_clean = {
        url: "img/Assets/poop_small_clean.png",
        //scaledSize: ''
    };
    var bin_green_icon = {
        url: "img/Assets/dog_bin_small_green.png"
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


    // ---------------------- >
    // --- Event handling --- >
    // ---------------------- >

    //Disables swipe to side menu feature on entering page
    $scope.$on('$ionicView.enter', function() {
        $ionicSideMenuDelegate.canDragContent(false);
    });
    //Re-enables swipe to side menu feature on exit page
    $scope.$on('$ionicView.leave', function() {
        $ionicSideMenuDelegate.canDragContent(true);
    });


    // Fixes the error where opening a modal would cause the map to 'break'
    // Auto if the page has been visited before it will resume Update()
    $scope.$on('$ionicView.afterEnter', function() {
        ionic.trigger('resize');

        if (autoUpdate == false) {
            autoUpdate = true;
            Update();

        }
        if (connLost == true && ConnectivityMonitor.isOnline()) {
            connLost = false;
            loadGoogleMaps();
            initMap();
        }

        if (prevLoaded == 1){
            $scope.loadMarkers();
        }

    });

    // Resets button animation classes and stops Update
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

        clearAllMarkers();
        prevLoaded = 1;
        autoUpdate = false;
    });

    $scope.$on('poopMarkerDeletedEvent', function (event, id) {
        removePoopMarkerByID(id);
    })

    $scope.$on('binMarkerDeletedEvent', function (event, id) {
        removeBinMarkerByID(id);
    })

    $scope.$on('binValidatedEvent', function (event, id) {
        clearAllMarkers();
        $scope.loadMarkers();
    })

    $scope.$on('binReportedEvent', function (event, id) {
        clearAllMarkers();
        $scope.loadMarkers();
    })

    $scope.$on('poopMarkerUpdatedEvent', function () {
        clearAllMarkers();
        $scope.loadMarkers();
    })


    // ------------------- >
    // --- Starting up --- >
    // ------------------- >

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

		// Direction service tools
		directionsService = new google.maps.DirectionsService;
		directionsDisplay = new google.maps.DirectionsRenderer({
			suppressMarkers: true
		});

		// Geocoder
		geocoder = new google.maps.Geocoder;

        $cordovaGeolocation.getCurrentPosition(options).then(function(position) {

			// Resizing Google Map Marker icons
            poop_icon.scaledSize = new google.maps.Size(20, 20);
            poop_icon_clean.scaledSize = new google.maps.Size(20, 20);
            bin_icon.scaledSize = new google.maps.Size(35, 35);
            bin_icon_conf.scaledSize = new google.maps.Size(35, 35);
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

                // User Marker
                var marker = new google.maps.Marker({
                    map: $scope.map,
                    zIndex: 100,
                    icon: circle_icon,
                    position: latLng,
										id: 99999999
                });
                $scope.userMarker = marker;

				$scope.loadMarkers();

                //Reload markers every time the map moves
                google.maps.event.addListener($scope.map, 'dragend', function() {
                    checkForNewMarkers();
					//loadMarkers();
                });

                //Reload markers every time the zoom changes
                google.maps.event.addListener($scope.map, 'zoom_changed', function() {
                    $scope.loadMarkers();
                });

                enableMap();
                Update();

            });

        }, function(error) {
            console.log("Could not get location");
            noLocationMap();
        });
    }

	//------------------------------->
    //---- Map related Functions ---->
    //------------------------------>

    // Update user location Marker
    function Update() {

		if (autoUpdate && !appInBackground) {

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

            // Call the Update() function every 1 seconds
            setTimeout(Update, 1000);
        }
    }

    // Used for the "Pinpoint button" - Manually grabs the user's lat/lng position and centers the map to that location
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
        console.log("here");
        $scope.minimizePanel();

        var marker = new google.maps.Marker({
            position: iconLatLng,
            map: $scope.map,
            animation: google.maps.Animation.DROP,
            zIndex: 0,
            icon: poop_icon,
            id: $scope.id
        });

        var markerData = {
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng(),
            type: getMarkerType(marker),
						id: marker.id
        };

		poopDataCache.push(markerData);
		poopObjCache.push(marker);

        google.maps.event.addListener(marker, 'click', function() {
            console.log("clicked " + this.id);
            $ionicLoading.show({
                template: '<p>Loading Finding</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
            });
            $scope.selectedMarker = this;
            $scope.selectFinding(this.id, $scope.viewRecordModal);
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
            icon: bin_icon,
            id: $scope.id
        });

        var markerData = {
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng(),
            type: getMarkerType(marker),
		    id: marker.id
        };

        $scope.input.LatLng = [markerData.lat, markerData.lng];
        $scope.input.DateTime = new Date();
        $scope.input.user = $scope.userData.userId;
        $scope.input.Username = $scope.userData.username;
        //console.log(JSON.stringify($scope.input));

		binDataCache.push(markerData);
		binObjCache.push(marker);

        google.maps.event.addListener(marker, 'click', function() {
            console.log("clicked " + this.id);
            $ionicLoading.show({
                template: '<p>Loading Bin</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
            });
            $scope.selectedMarker = this;
            $scope.selectBin(this.id, $scope.viewRecordModal);
        });

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
        // Shows Tutorial if this is the users first visit to the page!
        if(localStorage.getItem("firstMapVisit") == undefined){
            $scope.tutorialStart();
            localStorage.setItem("firstMapVisit", 1);
        }
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
        $scope.script = document.createElement("script");
        $scope.script.type = "text/javascript";
        $scope.script.id = "googleMaps";

        //Note the callback function in the URL is the one we created above
        $scope.script.src = 'http://maps.google.com/maps/api/js?key=' + apiKey +
            '&callback=mapInit';

        document.body.appendChild($scope.script);
    }

    // Checks if the Map has been loaded. Attempts to load otherwise.
    function checkLoaded() {
        if (typeof google == "undefined" || typeof google.maps == "undefined") {
            loadGoogleMaps();
        } else {
            enableMap();
        }
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

    //---------------------------->
    //----- Marker functions ----->
    //--------------------------->

    // Load markers data to local storage
    $scope.loadMarkers = function() {

        var center = $scope.map.getCenter();
        var bounds = $scope.map.getBounds();

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

		// The distance from the center of the map to the edge in miles
        var boundingRadius = getBoundingRadius(centerNorm, boundsNorm);

		//Update 'loadedMapArea'
		loadedMapArea.centerLat = center.lat();
		loadedMapArea.centerLng = center.lng();
		loadedMapArea.Dist = boundingRadius * 2;

		//Retreives marker data from Backand
		$scope.getNearbyFindings(centerNorm.lat,centerNorm.lng,boundingRadius*5);
		$scope.getNearbyBins(centerNorm.lat,centerNorm.lng,boundingRadius*5);

    }

	// Adds Markers to Google maps after both poop and bin data has been fully loaded
	function addMarkers(){

		addMarkersCondition++;

		if (addMarkersCondition == 2){

			//Get all of the markers from our array of Markers
			var markers = getMarkers();

			for (var i = 0; i < markers.length; i++) {

				if (markers[i].type == 0) {
					currentIcon = poop_icon;
					poopMarkerCount++;
					//console.log ("Poop > " + poopMarkerCount);
				} else if (markers[i].type == 1) {
					currentIcon = bin_icon;
					binMarkerCount++;
					//console.log ("Bin > " + binMarkerCount);
				} else if (markers[i].type == 2) {
					currentIcon = bin_icon_conf;
				} else if (markers[i].type == 3) {
					currentIcon = poop_icon_clean;
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
					animation: google.maps.Animation.DROP,
					position: latLng,
					zIndex: 0,
					visible: markerVisibility,
					icon: currentIcon,
					id : markers[i].id
				});

				if (currentIcon == poop_icon || currentIcon == poop_icon_clean) {
                    google.maps.event.addListener(marker, 'click', function() {
                        console.log("clicked " + this.id);
                        $ionicLoading.show({
                            template: '<p>Loading Finding</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
                        });
                        $scope.showMap = 0;
                        $scope.selectFinding(this.id, $scope.viewRecordModal);
                    });
                } else {
                    google.maps.event.addListener(marker, 'click', function() {
                        //console.log(JSON.stringify(this.id));
                        console.log("clicked " + this.id);
                        $ionicLoading.show({
                            template: '<p>Loading Bin</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
                        });
                        $scope.selectBin(this.id, $scope.viewRecordModal);
                    });
                }

				// Adds the marker to the relevent Obj Cache to store the reference the the GMaps Marker Object
                if (getMarkerType(marker) == 0 || getMarkerType(marker) == 3){
                    poopObjCache.push(marker);
                } else if ((getMarkerType(marker) == 1 || getMarkerType(marker) == 2)){
                    binObjCache.push(marker);
                }
			}

			addMarkersCondition = 0;

			console.log ("Total Poops Markers > " + poopObjCache.length);
			console.log ("Total Bin Markers > " + binObjCache.length);
		}

	}

	// Checks if the map view moves a new area requiring new data to be downloaded from the database
	function checkForNewMarkers() {
		var center = $scope.map.getCenter();
		var centerNorm = {
        lat: center.lat(),
        lng: center.lng()
    };
		var loadedCenter = {
			lat: loadedMapArea.centerLat,
			lng: loadedMapArea.centerLng
		};

		if (getDistanceBetweenPoints(centerNorm, loadedCenter, "miles") > loadedMapArea.Dist){
			console.log (" NEW AREA > LOAD NEW MARKERS ");
			$scope.loadMarkers();
		}
	}

    function removePoopMarkerByID(id){
        var marker = getPoopMarkerObjByID(id);
        getPoopMarkerObjByID(id).setMap(null);
    }

	function removeBinMarkerByID(id){
        var marker = getBinMarkerObjByID(id);
        getBinMarkerObjByID(id).setMap(null);
    }

    function getPoopMarkerObjByID (id){

        for (var i = 0; i < poopObjCache.length; i++){
            if (poopObjCache[i].id == id){
                return poopObjCache[i];
            }
        }

        console.log ("NO MARKER WITH THAT ID FOUND!");
    }


    function getBinMarkerObjByID (id){

        console.log("id of deleted marker: " + id);

        for (var i = 0; i < binObjCache.length; i++){
            if (binObjCache[i].id == id){
                return binObjCache[i];
            }

        }

        console.log ("NO MARKER WITH THAT ID FOUND!");
    }

    // Find the nearest bin and add a Marker to indicate it (replacing the previous marker temporarily)
    // TWO DIFFERENT CASES:
    // Case 1 - Called via the bottom left button to search for the nearest bin to the user location
    // Case 2 - Called via placing the man Marker to search for the nearest bin to the placed Marker
		// takes 'myPos' as a parameter which is a Marker Object
    $scope.findNearestBin = function(myPos) {

        // Hides the man Marker if function called for Case 1
        if (myPos.getIcon().url == circle_icon.url) {
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
            lat: myPos.getPosition().lat(),
            lng: myPos.getPosition().lng()
        };

        // Returns the nearest Bin Marker Data that has already been loaded
        var nearestBin = retNearestBin(center);

        // Find the reference to the nearest Bin Marker if already loaded (from binObjCache),
        // hide it temporarily and replace with the GIF indicator
        // Note: There is a chance that the nearest Bin Marker has not been loaded. In this case
        //       there is nothing to hide and it will be hidden when added if appropriate.
        for (var i = 0; i < binObjCache.length; i++) {
            if (binObjCache[i].id == nearestBin.id) {
                nearestBinMarker = binObjCache[i];
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

		// Draws the route from the desired location to the nearest bin marker
		calcRoute (myPos.getPosition(), binLatLng);

		// Prints address of the latLng of bin marker to console
		reverseGeocode(binLatLng);

        // Pan to the location of the Nearest Bin - Case 1
        // Pan to the placed marker	- Case 2
        if (manMarker != null) {
            if (myPos.getIcon().url == manMarker.getIcon().url) {
                $scope.map.panTo(manMarker.getPosition());
            } else {
                $scope.map.panTo(binLatLng);
            }
        } else {
            $scope.map.panTo(binLatLng);
        }

				// Stores references to nearest bin indicatior marker
        tempBinMarker = marker;
    }

	// Return closest bin Marker
	function retNearestBin(latLng){

		var markerCount = 0;
		var markerLimit = 1000;

		var nearestBin = '';		//This will store the marker data of the nearest bin to the desired location

        var nearestDist = 100; 	//Currently set to check 100 miles for bins around the area

        for (i = 0; i < binDataCache.length; i++) {
            var pos1 = {
                lat: binDataCache[i].lat,
                lng: binDataCache[i].lng
            }

            var pos2 = latLng;

            var dist = getDistanceBetweenPoints(pos1, pos2, 'miles');

            if (markerCount < markerLimit) {
                if (dist < nearestDist) {
                    nearestBin = binDataCache[i];
                    nearestDist = dist;
                }
            }
        }

        return nearestBin;
	}

	// Deactives nearest Bin Indicator and directions
	$scope.cancelNearestBin = function() {

		// Hides the man Marker if function called for Case 1
		if (manMarker != null) {
			manMarker.setVisible(false);
		}

		// Replaces the indicator GIF with the original marker
		if (tempBinMarker != null) {
			tempBinMarker.setMap(null);
		}
		if (nearestBinMarker != null) {
			nearestBinMarker.setVisible(true);
		}

		directionsDisplay.setMap(null);

	}

    // Adds new Marker to data Cache
    function addMarkerToCache(marker) {
        var markerData = {
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng(),
            type: getMarkerType(marker),
						id: marker.id,
        };
        if (markerData.type == 0){
			poopDataCache.push(markerData);
		} else if (markerData.type == 1){
			binDataCache.push(markerData);
		}
    }

    // Checks if the Marker Data exists in our overall cache
    function markerExists(type, id) {
        var exists = false;
        var cache = poopDataCache;
        for (var i = 0; i < cache.length; i++) {
            if (cache[i].type == type && cache[i].id === id){
                exists = true;
            }
        }
		if (!exists){
			cache = binDataCache;
			for (var i = 0; i < cache.length; i++) {
				if (cache[i].type == type && cache[i].id === id){
					exists = true;
				}
			}
		}
        return exists;
    }

	// Checks if the Marker Obj exists on the Map
	function markerObjExists(type, id) {
	    var exists = false;
        var cache = poopObjCache;
		var icon;
		if (type == 0){
			icon = poop_icon;
		}else if (type == 1){
			icon = bin_icon;
		}
        for (var i = 0; i < cache.length; i++) {
            if (cache[i].icon.url == icon && cache[i].id === id){
                exists = true;
            }
        }
		if (!exists){
			cache = binObjCache;
			for (var i = 0; i < cache.length; i++) {
				if (cache[i].icon.url == icon && cache[i].id === id){
					exists = true;
				}
			}
		}
        return exists;
	}


	// Retreives poop data from Backand
	$scope.getNearbyFindings = function(lat,lng,dist){
        //console.log ("Capture Distance > " + dist);
		$scope.findings = [];
        backandService.getEveryFinding(lat,lng,dist)
        .then(function(result) {
            $scope.findings = result.data.data;
            storePoopMarkers();
			addMarkers();
		  //console.log ($scope.findings.length);
        }, function(error) {
            console.log("err");
            console.log(JSON.stringify(error));
        });
    }

	// Retreives bin data from Backand
    $scope.getNearbyBins = function(lat,lng,dist) {
		$scope.bins = [];
        backandService.getEveryBin(lat,lng,dist)
        .then(function(result) {
            $scope.bins = result.data.data;
            storeBinMarkers();
			addMarkers();
		}, function(error) {
            console.log("err");
            console.log(JSON.stringify(error));
        });
    }


	// Stores Poop Marker Data into marker data cache
    function storePoopMarkers() {
		var poopLatLng = [];
		activePoopDataCache = [];

        //console.log("Number of findings > " + $scope.findings.length);

        if ($scope.findings.length > 0) {
            for (var i = 0; i < $scope.findings.length; i++) {
                poopLatLng.push(($scope.findings[i].LatLng));
            }
            for (i = 0; i < poopLatLng.length; i++) {
				var myLatLng = new google.maps.LatLng({
				    lat: poopLatLng[i][0],
                    lng: poopLatLng[i][1]
                });

                var poop = poop_icon;
                if ($scope.findings[i].Cleaned) poop = poop_icon_clean;
					var marker = new google.maps.Marker({
                    position: myLatLng,
                    icon: poop
                });

                var markerData = {
                    lat: marker.getPosition().lat(),
                    lng: marker.getPosition().lng(),
                    type: getMarkerType(marker),
					icon: marker.getIcon().url,
                    id: $scope.findings[i].id
                };

    			if (!markerExists(markerData.type,markerData.id)){
    				poopDataCache.push(markerData);
    				activePoopDataCache.push(markerData);
    			}
            }
        }
    }

	// Stores Bin Marker Data into marker data cache
    function storeBinMarkers() {
        var binLatLng = [];
		activeBinDataCache = [];

		//console.log("Number of bins > " + $scope.bins.length);

		if ($scope.bins.length > 0) {
            for (var i = 0; i < $scope.bins.length; i++) {
               binLatLng.push(($scope.bins[i].LatLng));
            }
            for (i = 0; i < binLatLng.length; i++) {
                var myLatLng = new google.maps.LatLng({
				    lat: binLatLng[i][0],
                    lng: binLatLng[i][1]
                });

				var bin = bin_icon;
                if ($scope.bins[i].Votes > 3) {
                    bin = bin_icon_conf;
                }
				var marker = new google.maps.Marker({
                    position: myLatLng,
                    icon: bin
                });
                var markerData = {
                    lat: marker.getPosition().lat(),
                    lng: marker.getPosition().lng(),
                    type: getMarkerType(marker),
					icon: marker.getIcon().url,
                    id: $scope.bins[i].id
                };

				if (!markerExists(markerData.type,markerData.id)){
					binDataCache.push(markerData);
					activeBinDataCache.push(markerData);
				}
            }
        }
    }

	// Returns Markers within the wanted area
	function getMarkers() {

		var markerCount = 0;
		var markerLimit = 1000;
		var nearbyMarkers = [];

		for (i = 0; i < activePoopDataCache.length; i++) {
			if (markerCount < markerLimit) {
                if (!markerObjExists(activePoopDataCache[i].type, activePoopDataCache[i].id)) {
					nearbyMarkers.push(activePoopDataCache[i]);
					markerCount++;
                }
            }
		}

		for (i = 0; i < activeBinDataCache.length; i++) {
			if (markerCount < markerLimit) {
                if (!markerObjExists(activeBinDataCache[i].type, activeBinDataCache[i].id)) {
				    nearbyMarkers.push(activeBinDataCache[i]);
					markerCount++;
                }
            }
		}

        return nearbyMarkers;
    }

	// Clears our Marker caches
	function clearAllMarkers() {

        for (var i = 0; i < poopObjCache.length; i++){
            poopObjCache[i].setMap(null);
        }

        for (var i = 0; i < binObjCache.length; i++){
            binObjCache[i].setMap(null);
        }

		poopDataCache.splice(0, poopDataCache.length);
        binDataCache.splice(0, binDataCache.length);
		poopObjCache.splice(0, poopDataCache.length);
        binObjCache.splice(0, binDataCache.length);
	}


	//--------------------------->
    //----- HELPER functions ----->
    //-------------------------->

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


	// ( I think this does the same as the above function Sonny )
	function distancecheck(currentlat, currentlng, nextlat, nextlng) {
        var radlat1 = Math.PI * currentlat / 180;
        var radlat2 = Math.PI * nextlat / 180;
        var theta = currentlng - nextlng;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344;
        return dist;
    }

    // Converts degrees to Radians
    function toRad(x) {
        return x * Math.PI / 180;
    }

	// Get Type of Marker - 0 for poop , 1 for bin
	function getMarkerType (marker){
		var type;

		if (marker.getIcon().url == poop_icon.url){
			type = 0;
		}else if (marker.getIcon().url == bin_icon.url){
			type = 1;
		}else if (marker.getIcon().url == bin_icon_conf.url){
			type = 2;
		}else if (marker.getIcon().url == poop_icon_clean.url){
			type = 3;
		}

		return type;
	}

	// Display Route
	function calcRoute(start,end) {
		var request = {
			origin: start,
			destination: end,
			travelMode: google.maps.TravelMode.WALKING
		};
		directionsService.route(request, function(response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
				directionsDisplay.setMap($scope.map);
			} else {
				alert("Directions Request from " + start.toUrlValue(6) + " to " + end.toUrlValue(6) + " failed: " + status);
			}
		});
	}


	// Reverse geocode function - returns a location name from latlng input
	function reverseGeocode(latlng) {
        geocoder.geocode({'location': latlng}, function(results, status) {
            if (status === 'OK') {
                if (results[1]) {
                    console.log("Address: " + results[1].formatted_address);
                } else {
                    window.alert('No results found');
                }
            } else {
                window.alert('Geocoder failed due to: ' + status);
            }
        });
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

    $scope.showIconPanelTut = function() {

        document.getElementById("panelOpenHolder").style.visibility = "hidden";
        document.getElementById("panelOpenHolder").className = "";
        document.getElementById("panelOpen").style.visibility = "hidden";
        document.getElementById("panelOpen").className = "button button-icon";

        document.getElementById("panelMinimizeHolder").style.visibility = "visible";
        document.getElementById("panelMinimizeHolder").className = "animated non";
        document.getElementById("panelMinimize").style.visibility = "visible";
        document.getElementById("panelMinimize").className = "button button-icon animated non";

        document.getElementById("iconPanel").style.visibility = "visible";
        document.getElementById("iconPanel").className = "animated none";
        document.getElementById("poopDraggable").style.visibility = "visible";
        document.getElementById("poopDraggable").className = "animated none";
        document.getElementById("binDraggable").style.visibility = "visible";
        document.getElementById("binDraggable").className = "animated none";
        document.getElementById("manDraggable").style.visibility = "visible";
        document.getElementById("manDraggable").className = "animated none";

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

    $scope.minimizePanelTut = function() {
        document.getElementById("panelOpenHolder").style.visibility = "visible";
        document.getElementById("panelOpenHolder").className = "animated none";
        document.getElementById("panelOpen").style.visibility = "visible";
        document.getElementById("panelOpen").className = "button button-icon animated none";

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
    $ionicModal.fromTemplateUrl('templates/modal/newMapRecord-modal.html', function(modal) {
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
    $scope.newRecord = function(phrase, type) {
        $scope.record.dateTime = new Date();
        $scope.record.time = ($scope.record.dateTime.getHours() < 10 ? '0' : '') + ($scope.record.dateTime.getHours() + ":" +
            ($scope.record.dateTime.getMinutes() < 10 ? '0' : '') + $scope.record.dateTime.getMinutes());
        clearRecord();
        $scope.createEnabled = false;
        console.log(JSON.stringify(iconLatLng.lat()));
        console.log(JSON.stringify(iconLatLng.lng()));
        $scope.record.lat = iconLatLng.lat();
        $scope.record.long = iconLatLng.lng();
        $cordovaGeolocation.getCurrentPosition(options).then(function(position) {
            currentlat = position.coords.latitude;
            currentlng = position.coords.longitude;
            var dist = distancecheck(currentlat, currentlng, $scope.record.lat, $scope.record.long);
            if (dist <= 0.5 && dist >= 0) {
                $scope.recordModal.phrase = phrase;
                $scope.recordModal.type = type; //finding = 0, bin = 1
                console.log($scope.recordModal.type);
                $scope.recordModal.show();
            } else {
                var alertPopup = $ionicPopup.alert({
                    title: 'Too far from marker',
                    template: 'You are too far away to place a marker here'
                });
            }
        }, function(error) {
            var alertPopup = $ionicPopup.alert({
                title: 'No internet connection',
                template: 'Please connect to the internet to place a marker'
            });
        });
    };


    $scope.takePicture = function() {
        var options = {
            quality: 70,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            allowEdit: false,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 320,
            targetHeight: 320,
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
        $scope.recordModal.hide();
        clearRecord();
    };

    $scope.deleteRecord = function() {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete this doggy finding?',
            template: 'Deleted records cannot be retreived again. Are you sure?'
        });
        confirmPopup.then(function(res) {
            if (res) {
                if(!$scope.selectedRec.type) {
                    console.log("Record to delete > " + $scope.selectedRec.id);
                    $scope.deleteFinding($scope.selectedRec.id);

                    var deleteFindingPopup = $ionicPopup.alert({
                        title: 'Record Deleted',
                        template: 'Your record has been deleted'
                    });

                    deleteFindingPopup.then(function(res) {
                        $scope.closeViewRecord();
                        //$scope.doRefresh();
                    });

                } else {
                    console.log("Record to delete > " + $scope.selectedRec.id);
                    $scope.deleteBin($scope.selectedRec.id);
                    var deleteBin = $ionicPopup.alert({
                        title: 'Record Deleted',
                        template: 'Your record has been deleted'
                    });

                    deleteBin.then(function(res) {
                        $scope.closeViewRecord();
                        //$scope.doRefresh();
                    });
                }
                //$scope.$broadcast('markerDeletedEvent', id);
                //loadMarkers();
                //$scope.selectedMarker.setMap(null);
            }
        });
    };

    $scope.cleanUpRec = function() {
        if (!$scope.loggedIn) {
            $scope.requireLogin('You must be logged in to clean up a finding');
        } else {
            var confirmPopupClean = $ionicPopup.confirm({
                title: 'You cleaned up the finding?',
                template: 'This record will be marked as cleaned up by you and marked so on the map'
            });
            confirmPopupClean.then(function(res) {
                if (res) {
                    var updateData = {
                        Cleaned: true,
                        Cleanedby: $scope.userData.username
                    };
                   // console.log(JSON.stringify(updateData));
                    $scope.updateFinding($scope.selectedRec.id, updateData);

                    $scope.closeViewRecord();

                }
            });
        }
    };

    // Create record item
    $scope.createRecord = function(record) {
        //insert record in database
        $scope.input.LatLng = [$scope.record.lat, $scope.record.long];
        $scope.input.DateTime = $scope.record.dateTime;
        $scope.input.ImageURI = $scope.record.imageURI;
        $scope.input.Username = $scope.userData.username;
        $scope.input.user = $scope.userData.userId;
        if($scope.recordModal.type){
            //bin
            $scope.input.Votes = 1;
            $scope.addBin().then(function() {
                var validateQuery = $ionicPopup.alert({
                    title: 'Bin Added',
                    template: 'Your bin has been added to the map!'
                });
                validateQuery.then(function(res) {
                    $scope.recordModal.hide();
                    $scope.addBinMarker();
                    //$scope.closePopover();
                });
            });
        } else {
            //poop
            $scope.input.Cleaned = false;
            $scope.input.Cleanedby = null;
            $scope.addFinding().then(function() {
                var validateQuery = $ionicPopup.alert({
                    title: 'Finding Added',
                    template: 'Your finding has been added to the map!'
                });
                validateQuery.then(function(res) {
                    $scope.recordModal.hide();
                    $scope.addPoopMarker();
                    //$scope.closePopover();
                });
            });
        }
        //console.log(JSON.stringify($scope.input));
        //$scope.userFindings.push($scope.input);
    };

    //---------------------------->
    //---- Tutorial Functions ---->
    //--------------------------->
    //


    $scope.nextTutorial = function() {
        switch ($scope.tutNum) {
            case 0:
                $scope.showIconPanelTut();
                $scope.tutNum++;
                $scope.isMapActive1 = true;
                $scope.isMapActive0 = false;
                break;

            case 1:
                $scope.tutNum++;
                $scope.isMapActive2 = true;
                $scope.isMapActive1 = false;
                break;
            
            case 2:
                $scope.tutNum++;
                $scope.isMapActive3 = true;
                $scope.isMapActive2 = false;
                break;

            case 3:
                $scope.tutNum++;
                $scope.minimizePanelTut();
                $scope.isMapActive4 = true;
                $scope.isMapActive3 = false;
                break;

            case 4:
                $scope.tutNum++;
                $scope.isMapActive5 = true;
                $scope.isMapActive4 = false;
                break;

            case 5:
                $scope.tutNum++;
                $scope.isMapActive5 = false;
                $scope.isMapActive6 = true;
                break;

            case 6:
                $scope.tutNum = -1;
                $scope.isMapActive6 = false;
                break;

            default:
                break;
        }
    }

    // Tutorial modal open
    $scope.tutorialStart = function() {

        $scope.demoMapCaption0 = "\nClick here to place new markers on the map";
        $scope.demoMapCaption1 = "\nHere you can add new record markers.\nSimply click where on the map you would like to add to on the map";
        $scope.demoMapCaption2 = "Viola! You have created your first record and placed your first Marker!";
        $scope.demoMapCaption3 = "\nYou can also drop the man marker to find the nearest bin from any location!";
        $scope.demoMapCaption4 = "\n\n\n\n\n\n\nClick here to find your nearest bin marker to you";
        $scope.demoMapCaption5 = "\n\n\n\n\n\n\nThen click the back button to revert the action";
        $scope.demoMapCaption6 = "\nRememebr you can click here to reset the the view to your location";

        $scope.minimizePanelTut();
        $scope.isMapActive0 = true;
        $scope.tutNum = 0;
    }


	//------------------------------------------------>
	//---- Confirm dialog resources and Functions ---->
	//----------------------------------------------->

	// Confirm dialog for adding Poop to the map
	$scope.showPConfirm = function() {
			if ($scope.loggedIn) {
					var confirmPopup = $ionicPopup.confirm({
							title: 'Add this doggy record?',
							template: 'This logs your dog\'s mess. You can view all logs from your Doggy Records page.'
					});
					confirmPopup.then(function(res) {
							if (res) {
									if ($scope.isOverRecordLimit()) {
											var limitRecsPopup = $ionicPopup.alert({
													title: 'You have reached record limit',
													template: 'Please wait before adding more records'
											});
									} else {
											$scope.newRecord('Add new finding', 0);
									}
							}
					});
			} else {
					$scope.requireLogin('Please login to add a record');
			}
	};


	// Confirm dialog for adding Bin to the map
	$scope.showBConfirm = function() {
		if ($scope.loggedIn) {
			var confirmPopup = $ionicPopup.confirm({
				title: 'Add this Bin?',
				template: 'It will be added to your Bin DataBase used to find your nearest bins.'
			});
			confirmPopup.then(function(res) {
				if (res) {
					if ($scope.isOverRecordLimit()) {
						var limitRecsPopup = $ionicPopup.alert({
							title: 'You have reached record limit',
							template: 'Please wait before adding more records'
						});
					} else {
						$scope.newRecord('Add new bin', 1);
					}
				}
			});
		} else {
			$scope.requireLogin('Please login to add a record');
		}
	};


	//----------------------------------->
	//---- APP INACTIVITY FUNCTIONS ---->
	//--------------------------------->

	// Wait for device API libraries to load
    //
    function onLoad() {
        document.addEventListener("deviceready", onDeviceReady, false);
    }

    // device APIs are available
    //
    function onDeviceReady() {
        document.addEventListener("pause", onPause, false);
		document.addEventListener("resume", onResume, false);
    }

    // Handle the pause event
    function onPause() {
		appInBackground = true;
    }

	// Handle the resume event
	function onResume() {
		appInBackground = false;
    }

})



/* -------------------------------------------------- */
/* -------Social Media (AboutPage) Controller ------- */
/* -------------------------------------------------- */
.controller('SocialMediaCtrl', function($scope, Backand, $state, LoginService, $cordovaSocialSharing, $cordovaInAppBrowser) {


    $(function() {
        $('.fadein img:gt(0)').hide();
        setInterval(function() {
            $('.fadein :first-child').fadeOut()
            .next('img').fadeIn()
            .end().appendTo('.fadein');
        }, 4000);
    })

    $scope.goToProjectsPage = function() {
        var options = {
            location: 'yes',
            clearcache: 'yes',
            toolbar: 'no'
        };
        $cordovaInAppBrowser.open("http://www.natural-apptitude.co.uk/projects/", '_blank', options)
            .then(function(event) {
                // success
            })
            .catch(function(event) {
                // error
            });
    }


    //	change the link to the app link
    $scope.shareAnywhere = function() {
        $cordovaSocialSharing.share("Check out this awesome app !!!", "This is a title for the share", null, "http://www.natural-apptitude.co.uk")
    }

});
