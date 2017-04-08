angular.module('PooperSnooper.controllers', ['ionic', 'backand', 'ngCordova'])

.controller('AppCtrl', function($scope, $state, Backand, $ionicModal, ConnectivityMonitor, $timeout, $ionicPopup, $q, backandService, $ionicLoading, LoginService, AuthService) {

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
    $scope.loggedIn = 0;
    $scope.facebookToken = "";
    $scope.mapRec = null;
    $scope.numOfRecentRecords = 0; //Number of records user has made in last 24hrs

    loadUserDetails();

    function loadUserDetails() {
        var data = Backand.getUserDetails();
        if (data.$$state.value) {
            console.log("User already logged in!");
            console.log(JSON.stringify(data));
            $scope.userData = data.$$state.value;
            console.log(JSON.stringify($scope.userData));
            $scope.loggedIn = 1;
        }
    }


    $scope.getUserFindings = function(id) {
        backandService.getUserFindings(id)
        .then(function(result) {
            $scope.userFindings = result.data.data;

        });
    }

    $scope.getUserBins = function(id) {
        backandService.getUserBins(id)
        .then(function(result) {
            $scope.userBins = result.data.data;
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
        var poop_icon = {
            url: "img/Assets/poop_small.png",
            scaledSize: new google.maps.Size(20, 20)
        };
        if ($scope.mapRecMarker) $scope.mapRecMarker.setMap(null);
        $scope.mapRecMarker = new google.maps.Marker({
            map: $scope.mapRec,
            //animation: google.maps.Animation.DROP,
            zIndex: 100,
            icon: poop_icon,
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
                //};

                // //Create a script element to insert into the page
                //document.createElement("script");
                // $scope.script = document.createElement("script");
                // $scope.script.type = "text/javascript";
                // $scope.script.id = "googleMaps";
                //
                // //Note the callback function in the URL is the one we created above
                // $scope.script.src = 'http://maps.google.com/maps/api/js?key=' + apiKey +
                    //   '&callback=moveMap';
                // //console.log(JSON.stringify($scope.script));
                // document.body.appendChild($scope.script);
                //moveMap();
        } else {
            console.log("sdk and modal map exist");
            moveMap();
        }
    }

    $scope.selectFinding = function(id, viewModal) {
        backandService.selectFinding(id)
        .then(function(result) {
            console.log("Selected finding");
            $scope.selectedRec = result.data;
            $scope.selectedRec.type = 0; //finding
            $scope.ownRecord = 0;
            if (result.data.user == $scope.userData.userId) $scope.ownRecord = 1;
            console.log(JSON.stringify($scope.selectedRec));
            if($scope.showMap) getGoogleMaps();
            viewModal.show();
            $ionicLoading.hide();
        });
    }

    $scope.checkAbleToVote = function(id) {
        var defer = $q.defer();
        backandService.filterBinValidations($scope.userData.userId, id)
        .then(function(result) {
            if(result.data.totalRows ==0)  {
                console.log(JSON.stringify(result));
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

    $scope.selectBin = function(id, viewModal) {
        backandService.selectBin(id)
        .then(function(result) {
            console.log("Selected bin");
            $scope.selectedRec = {};
            $scope.selectedRec = result.data;
            $scope.selectedRec.type = 1; //bin
            $scope.ownRecord = 0;
            $scope.selectedRec.canValidate = $scope.selectedRec.canReport = 0;
            if($scope.loggedIn) {
                $scope.checkAbleToVote(id).then(function(res) {
                    if (result.data.user == $scope.userData.userId){
                        $scope.ownRecord = 1;
                        $scope.selectedRec.canValidate = $scope.selectedRec.canReport = 0;
                    }
                    console.log(JSON.stringify($scope.selectedRec));
                    viewModal.show();
                    $ionicLoading.hide();
                });
            } else {
                console.log(JSON.stringify($scope.selectedRec));
                viewModal.show();
                $ionicLoading.hide();
            }
        });
    }

    $scope.addFinding = function() {
        return new Promise(function(resolve, reject) {
            backandService.addFinding($scope.input)
            .then(function(result) {
                console.log(JSON.stringify(result));
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
            console.log("Finding deleted");
            console.log(JSON.stringify(result));
        });
    }

    $scope.updateFinding = function(id, data) {
        backandService.updateFinding(id, data)
        .then(function(result) {
            console.log(JSON.stringify(result));
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
                console.log(JSON.stringify(result));
                $scope.id = result.data.__metadata.id;
                console.log($scope.id);
                $scope.input = {};
                resolve();
            });
        });
    }

    $scope.deleteBin = function(id) {
        backandService.deleteBin(id)
        .then(function(result) {
            console.log(result);
            initMap();
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

    onValidLogin = function(response) {
        onLogin();
        $scope.userData.username = response.data || $scope.userData.username;
//		console.log( "User Data is " + JSON.stringify($scope.userData));
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
//        console.log("!!!!userdata is: ");
//        console.log("!!!! " + JSON.stringify($scope.userData));
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
            if (recentRecs > 2) return true;
        }
        for (var rec in $scope.userBins) {
            recDate = new Date($scope.userBins[rec].DateTime);
            if (recDate > testTime) recentRecs++;
            if (recentRecs > 2) return true;
        }
        return false;
    };

    //$scope.getAllFindings();
    //$scope.getAllBins();
    //
    //	$scope.username = '';
    //	onLogin();

})


/* ------------------------------------------------ */
/* ------------ Record Logs Controller ------------ */
/* ------------------------------------------------ */
.controller('RecordLogsCtrl', function($scope, $ionicModal, $cordovaCamera, $cordovaImagePicker, $filter, $ionicLoading, $cordovaGeolocation, $ionicPopup, GlobalService, backandService) {


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


    $scope.doRefresh();

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
        console.log(JSON.stringify($scope.input));
        $scope.addFinding();
        //$scope.userFindings.push($scope.input);

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
    $scope.newRecord = function(phrase, type) {
        if ($scope.loggedIn) {
            if ($scope.isOverRecordLimit()) {
                var limitRecsPopup = $ionicPopup.alert({
                    title: 'You have reached record limit',
                    template: 'Please wait before adding more records'
                });
            } else {
                clearRecord();
                $scope.createEnabled = false;
                $scope.recordModal.phrase = phrase;
                $scope.recordModal.type = type; //finding = 0, bin = 1
                console.log($scope.recordModal.type);
                $scope.recordModal.show();
            }
        } else {
            $scope.requireLogin('You must be logged in to create a record');
        }
    };

    $scope.selectRecord = function(id) {
        console.log("Record Selected > " + id);
        $scope.showMap = 1;
        $scope.selectFinding(id, $scope.viewRecordModal);
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
.controller('MapCtrl', function($scope, $cordovaGeolocation, backandService, $q, $ionicModal, $window, $ionicPopup, $ionicLoading, $rootScope, $cordovaNetwork, $ionicSideMenuDelegate, GlobalService, ConnectivityMonitor, $cordovaCamera, $cordovaImagePicker) {


    //Disables swipe to side menu feature on entering page
    $scope.$on('$ionicView.enter', function() {
        $ionicSideMenuDelegate.canDragContent(false);
    });
    //Re-enables swipe to side menu feature on exit page
    $scope.$on('$ionicView.leave', function() {
        $ionicSideMenuDelegate.canDragContent(true);
    });

    $scope.getAllFindings = function(){
        var center = $scope.map.getCenter();
        console.log(JSON.stringify(center));
        console.log(JSON.stringify(center.lng()));
        var returnObject = {};
        backandService.getEveryFinding(center.lat(), center.lng())
        .then(function(result) {
            console.log("succ");
            $scope.findings = result.data.data;
            console.log(JSON.stringify(result));
            console.log(JSON.stringify($scope.findings));
            getPoopMarkers();
        }, function(error) {
            console.log("err");
            console.log(JSON.stringify(error));
        });
    }

    $scope.getAllBins = function() {
        var center = $scope.map.getCenter();
        backandService.getEveryBin(center.lat(), center.lng())
        .then(function(result) {
            console.log(JSON.stringify(result));
            $scope.bins = result.data.data;
            getBinMarkers();
            console.log("Got all Bins");
          });
    }




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
    var bin_green_icon = {
        url: "img/Assets/dog_bin_small_green.png"
    }
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
            
            $scope.getAllFindings();
            $scope.getAllBins();
            console.log("here");
            

            // Wait until the map is loaded and add Marker to current location
            google.maps.event.addListenerOnce($scope.map, 'idle', function() {


                //Get poop and bin markers from database
                GlobalService.clear_allMarkers();
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
        var poopLatLng = [];
        var marker = {};
        console.log("Number of findings > " + $scope.findings.length);
        if ($scope.findings.length > 0) {
            for (var i = 0; i < $scope.findings.length; i++) {
                poopLatLng.push(($scope.findings[i].LatLng));
            }
            for (i = 0; i < poopLatLng.length; i++) {
                var myLatLng = new google.maps.LatLng({
                    lat: poopLatLng[i][0],
                    lng: poopLatLng[i][1]
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

            console.log("poop > " + poopLatLng);
        }
        loadMarkers();
    }


    function getBinMarkers() {
        var binLatLng = [];
        console.log("Number of bins > " + $scope.bins.length);
        if ($scope.bins.length > 0) {
            for (var i = 0; i < $scope.bins.length; i++) {
                binLatLng.push(($scope.bins[i].LatLng));
            }
            for (i = 0; i < binLatLng.length; i++) {
            console.log(JSON.stringify(binLatLng));
                var myLatLng = new google.maps.LatLng({
                    lat: binLatLng[i][0],
                    lng: binLatLng[i][1]
                });
                var marker = new google.maps.Marker({
                    position: myLatLng,
                    icon: bin_icon
                });
                var markerData = {
                    lat: marker.getPosition().lat(),
                    lng: marker.getPosition().lng(),
                    icon: marker.getIcon().url,
                    id: $scope.bins[i].id
                };
                GlobalService.push_binMarkers(markerData);
            }

            console.log("bins > " + binLatLng);
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
            icon: marker.getIcon().url
        };

        GlobalService.push_poopMarkers(markerData);

        // Adds the marker to markerCache (so it won't be re-added)
        addMarkerToCache(marker);

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
            icon: marker.getIcon().url
        };

        $scope.input.LatLng = [markerData.lat, markerData.lng];
        $scope.input.DateTime = new Date();
        $scope.input.user = $scope.userData.userId;
        $scope.input.Username = $scope.userData.username;
        console.log(JSON.stringify($scope.input));

        GlobalService.push_binMarkers(markerData);

        // Adds the marker to binMarkerCache so we have a reference to it
        // to deal with the Nearest bin marker case
        binMarkerCache.push(marker);
        // Adds the marker to markerCache (so it won't be re-added)
        addMarkerToCache(marker);

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
                    icon: currentIcon,
                    id : markers[i].id
                });

                // Adds the marker to markerCache (so it won't be re-added)
                addMarkerToCache(marker);

                if (currentIcon == poop_icon) {
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
                        console.log(JSON.stringify(this.id));
                        console.log("clicked " + this.id);
                        $ionicLoading.show({
                            template: '<p>Loading Bin</p><ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
                        });
                        $scope.selectBin(this.id, $scope.viewRecordModal);
                    });
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
            if (dist <= 0.1 && dist >= 0) {
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
              $scope.selectedMarker.setMap(null);
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
                    console.log(JSON.stringify(updateData));
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
        console.log("here");
        if($scope.recordModal.type){
            //bin
            $scope.input.Votes = 1;
            $scope.addBin().then(function() {
                console.log("here2");
                var validateQuery = $ionicPopup.alert({
                    title: 'Bin Added',
                    template: 'Your bin has been added to the map!'
                });
                validateQuery.then(function(res) {
                    $scope.recordModal.hide();
                    $scope.addBinMarker();
                    $scope.closePopover();
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
                    $scope.closePopover();
                });
            });
        }
        console.log(JSON.stringify($scope.input));
        //$scope.userFindings.push($scope.input);
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
