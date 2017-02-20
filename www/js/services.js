angular.module('PooperSnooper.services', ['ionic', 'backand', 'ngCordova'])

  .service('APIInterceptor', function($rootScope, $q) {
    var service = this;

    service.responseError = function(response) {
      if (response.status === 401) {
        $rootScope.$broadcast('unauthorized');
      }
      return $q.reject(response);
    };
  })

  .service('backandService', function($http, Backand) {
    var baseUrl = '/1/objects/';
    var dogFindingsName = 'dogFindings/';
    var binLocationsName = 'binLocations/';
    var user_binValidationsName = 'user_binValidations/';


    function getFindingsUrl() {
      return Backand.getApiUrl() + baseUrl + dogFindingsName;
    }

    function getFindingsUrlForId(id) {
      return getFindingsUrl() + id;
    }

    getFindings = function() {
      return $http.get(getFindingsUrl());
    };

    getEveryFinding = function() {
      var timeToDecay = new Date(Date.now() - 1.814e+9); //3 weeks
      return $http.get(Backand.getApiUrl() + baseUrl + dogFindingsName + '?pageSize=200&filter=[{"fieldName":"DateTime","operator":"greaterThan","value":"' + timeToDecay.toJSON() + '"}]');
    };

    getUserFindings = function(id) {
      return $http.get(Backand.getApiUrl() + baseUrl + dogFindingsName + '?pageSize=200&filter=[{"fieldName":"user","operator":"in","value":"' + id + '"}]');
    };

    getUserBins = function(id) {
      return $http.get(Backand.getApiUrl() + baseUrl + binLocationsName + '?pageSize=200&filter=[{"fieldName":"user","operator":"in","value":"' + id + '"}]');
    };

    selectFinding = function(id) {
      return $http.get(getFindingsUrlForId(id));
    }

    function getBinsUrl() {
      return Backand.getApiUrl() + baseUrl + binLocationsName;
    }

    function getBinsUrlForId(id) {
      return getBinsUrl() + id;
    }

    selectBin = function(id) {
      return $http.get(getBinUrlForId(id));
    }

    addFinding = function(finding) {
      return $http.post(getFindingsUrl(), finding);
    }

    deleteFinding = function(id) {
      return $http.delete(getFindingsUrlForId(id));
    };

    updateFinding = function(id, data) {
      var returnObject;
      return $http({
        method: 'PUT',
        url: Backand.getApiUrl() + baseUrl + dogFindingsName + id,
        data: data, 
		params: {
			returnObject: returnObject
		}
      })
    };

    updateBin = function(id, data) {
      var returnObject;
      return $http({
        method: 'PUT',
        url: Backand.getApiUrl() + baseUrl + binLocationsName + id,
        data: data,
		params: {
			returnObject: returnObject
		}
      })
    };

    addUser_binValidation = function(data) {
      return $http.post(getUser_binValidationsUrl(), data);
    }

    function getUser_binValidationsUrl() {
      return Backand.getApiUrl() + baseUrl + user_binValidationsName;
    }

    function getBinUrl() {
      return Backand.getApiUrl() + baseUrl + binLocationsName;
    }

    function getBinUrlForId(id) {
      return getBinUrl() + id;
    }

    getBins = function() {
      return $http.get(getBinUrl());
    };

    getEveryBin = function() {
      return $http.get(Backand.getApiUrl() + baseUrl + binLocationsName + '?pageSize=200');
    };

    addBin = function(bin) {
      return $http.post(getBinUrl(), bin);
    }

    deleteBin = function(id) {
      return $http.delete(getBinUrlForId(id));
    };

    return {
      getFindings: getFindings,
      getEveryFinding: getEveryFinding,
      addFinding: addFinding,
      deleteFinding: deleteFinding,
      updateFinding: updateFinding,
      updateBin: updateBin,
      selectFinding: selectFinding,
      selectBin: selectBin,
      getUserFindings: getUserFindings,
      getUserBins: getUserBins,
      getBins: getBins,
      getEveryBin: getEveryBin,
      addBin: addBin,
      addUser_binValidation: addUser_binValidation,
      deleteBin: deleteBin
    }
  })

  .service('LoginService', function(Backand) {
    var service = this;

    // loadUserDetails();
    //
    // function loadUserDetails() {
    // var username = Backand.getUsername();
    // console.log("here " + JSON.stringify(username));
    //   // if (username) {
    //   //   getCurrentUserInfo()
    //   //     .then(function(data) {
    //   //       sdata;
    //   //     });
    //   // }
    // }

    service.signin = function(email, password, appName) {
      //call Backand for sign in
      return Backand.signin(email, password);
    };

    service.anonymousLogin = function() {
      // don't have to do anything here,
      // because we set app token att app.js
    }

    service.socialSignIn = function(provider) {
      console.log("inside the service.js for socialSignIn");
      return Backand.socialSignIn(provider);
    };

    service.socialsignUp = function(provider) {
      console.log(JSON.stringify(provider));
      return Backand.socialSignUp(provider);

    };

    service.facebookToken = function(token) {
      console.log("facebookToken", token);
      return Backand.socialSignInToken('facebook', token);
    };

    service.signout = function() {
      return Backand.signout();
    };

    service.signup = function(firstName, lastName, email, password, confirmPassword) {
      return Backand.signup(firstName, lastName, email, password, confirmPassword);
    }
  })

  .service('AuthService', function($http, Backand) {

    var self = this;
    var baseUrl = Backand.getApiUrl() + '/1/objects/';
    self.appName = 'Pooper Snooper';
    self.currentUser = {};

    loadUserDetails();

    function loadUserDetails() {
      self.currentUser.name = Backand.getUsername();
      if (self.currentUser.name) {
        getCurrentUserInfo()
          .then(function(data) {
            self.currentUser.details = data;
          });
      }
    }

    self.getSocialProviders = function() {
      return Backand.getSocialProviders()
    };

    self.socialSignIn = function(provider) {
      console.log("inside self.socialSignIN")
      return Backand.socialSignIn(provider)
        .then(function(response) {
          loadUserDetails();
          return response;
        });
    };

    self.socialsignUp = function(provider) {
      return Backand.socialsignUp(provider)
        .then(function(response) {
          loadUserDetails();
          return response;
        });
    };

    self.setAppName = function(newAppName) {
      self.appName = newAppName;
    };

    self.signIn = function(username, password, appName) {
      return Backand.signin(username, password, appName)
        .then(function(response) {
          loadUserDetails();
          return response;
        });
    };

    self.signUp = function(firstName, lastName, username, password, parameters) {
      return Backand.signUp(firstName, lastName, username, password, password, parameters)
        .then(function(signUpResponse) {

          if (signUpResponse.data.currentStatus === 1) {
            return self.signIn(username, password)
              .then(function() {
                return signUpResponse;
              });

          } else {
            return signUpResponse;
          }
        });
    };

    self.changePassword = function(oldPassword, newPassword) {
      return Backand.changePassword(oldPassword, newPassword)
    };

    self.requestResetPassword = function(username) {
      return Backand.requestResetPassword(username, self.appName)
    };

    self.resetPassword = function(password, token) {
      return Backand.resetPassword(password, token)
    };

    self.logout = function() {
      Backand.signout().then(function() {
        angular.copy({}, self.currentUser);
      });
    };

    function getCurrentUserInfo() {
      return $http({
        method: 'GET',
        url: baseUrl + "users",
        params: {
          filter: JSON.stringify([{
            fieldName: "email",
            operator: "contains",
            value: self.currentUser.name
          }])
        }
      }).then(function(response) {
        if (response.data && response.data.data && response.data.data.length == 1)
          return response.data.data[0];
      });
    }

  });
