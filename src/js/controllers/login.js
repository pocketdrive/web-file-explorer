(function(angular) {
    'use strict';
    angular.module('FileManagerApp').controller('LoginController',
        ['$scope','$location', function($scope,$location) {

        $scope.login = function () {
            this.ClearCredentials();
            $location.path('/explorer');
        };

            function SetCredentials(username, password) {
                var authdata = Base64.encode(username + ':' + password);

                $rootScope.globals = {
                    currentUser: {
                        username: username,
                        authdata: authdata
                    }
                };

                // set default auth header for http requests
                $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;

                // store user details in globals cookie that keeps user logged in for 1 week (or until they logout)
                var cookieExp = new Date();
                cookieExp.setDate(cookieExp.getDate() + 7);
                $cookies.putObject('globals', $rootScope.globals, { expires: cookieExp });
            }

            function ClearCredentials() {
                $rootScope.globals = {};
                $cookies.remove('globals');
                $http.defaults.headers.common.Authorization = 'Basic';
            }

        }]);
})(angular);
