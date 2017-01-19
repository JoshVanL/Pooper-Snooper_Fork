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
    return $http.get(Backand.getApiUrl() + baseUrl + dogFindingsName +'?pageSize=200');
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
    return $http.get(Backand.getApiUrl() + baseUrl + binLocationsName +'?pageSize=200');
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
});
