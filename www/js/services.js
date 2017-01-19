angular.module('PooperSnooper.services', ['ionic', 'backand', 'ngCordova'])

.service('backandService', function($http, Backand) {
  var baseUrl = '/1/objects/';
  var dogFindingsName = 'dogFindings/';
  var binLocationsName = 'binLocations/';


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
    return $http.get(Backand.getApiUrl() + baseUrl + dogFindingsName + '?pageSize=200');
  };

  selectFinding = function(id) {
    return $http.get(getFindingsUrlForId(id));
  }

  addFinding = function(finding) {
    return $http.post(getFindingsUrl(), finding);
  }

  deleteFinding = function(id) {
    return $http.delete(getFindingsUrlForId(id));
  };

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
    selectFinding: selectFinding,
    getBins: getBins,
    getEveryBin: getEveryBin,
    addBin: addBin,
    deleteBin: deleteBin
  }
})

.service('LoginService', function(Backand) {
  var service = this;

  service.signin = function(email, password, appName) {
    //call Backand for sign in
    return Backand.signin(email, password);
  };

  service.signup = function(firstName, lastName, email, password, again) {
    return Backand.signup(firstName, lastName, email, password, password);
  };

  service.anonymousLogin = function() {
    // don't have to do anything here,
    // because we set app token att app.js
  };

  service.facebookToken = function(token) {
    console.log("facebookToken", token);
    return Backand.socialSignInToken('facebook', token);
  };

  service.signout = function() {
    return Backand.signout();
  };

  service.socialSignUp = function(provider) {
    return Backand.socialSignUp(provider);
  };

  service.socialSignIn = function(provider) {
    return Backand.socialSignIn(provider);
  };
});
