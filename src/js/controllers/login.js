(function (angular, $) {
    'use strict';
    angular.module('FileManagerApp').controller('LoginController',
        ['$scope', '$location','authenticator','Flash',
            function ($scope, $location,Authenticator,Flash) {

                let auth = new Authenticator()

                $scope.login = function () {
                    let username = $scope.username;
                    let password = $scope.password;
                    auth.login(username, password, (response)=>{
                        if(response.success){
                        $location.path('/explorer');
                        }else{
                            Flash.create('danger', response.message, 3000, {id: 'show-error'}, true);

                        }
                    });
                }

                function clearFields(){
                    $scope.username ='';
                    $scope.password = '';
                }

            }]);
})(angular, jQuery);
