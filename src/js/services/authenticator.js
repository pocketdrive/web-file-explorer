(function (angular) {
    'use strict';
    angular.module('FileManagerApp').service('authenticator', ['$http', '$cookies', '$location','$window', '$rootScope', 'fileManagerConfig',
        function ($http, $cookies, $location,$window, $rootScope, fileManagerConfig) {

            var Authenticator = function () {
                this.error = '';
                this.showerrormsg = false;
            };



            Authenticator.prototype.login = function (username, password, callback) {
                var self = this;
                var response = {success: false, message: ''};
                var data = {
                    username: username,
                    password: password,
                };

                $http.post(`http://${fileManagerConfig.apiUrl}:${fileManagerConfig.apiPort}/login`, data).success(function (data, code) {

                    if (data.success) {
                        self.SetCredentials(username,data.device);
                        response = {success: true};
                    } else if(!data.success && data.message==="Invalid"){
                        response = {success: false, message: 'Invalid credentials !!'};
                    }else{
                        response = {success: false, message: 'Currently no pocket drive device is attached with this user'};
                    }
                    callback(response);

                }).error(function (data, code) {
                    response = {success: false, message: 'Can\'t connect with the server please try again'}
                    callback(response);
                });
            };

            Authenticator.prototype.SetCredentials = function (username,device) {

                $rootScope.globals = {
                    currentUser: {
                        username: username,
                        device : device
                    }
                };

                // set default auth header for http requests
                // $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;

                // store user details in globals cookie that keeps user logged in for 1 week (or until they logout)
                var cookieExp = new Date();
                cookieExp.setDate(cookieExp.getDate() + 7);
                $cookies.putObject('globals', $rootScope.globals, {expires: cookieExp});
            };

            Authenticator.prototype.ClearCredentials = function () {
                console.log($rootScope.globals);
                $rootScope.globals = {};
                $cookies.remove('globals');
                $http.defaults.headers.common.Authorization = 'Basic';
                $window.location.reload();
            };
            return Authenticator;

        }
    ])

})(angular, jQuery);