(function (angular, $) {
    'use strict';
    angular.module('FileManagerApp').service('apiHandler', ['$http','$rootScope', '$q', '$window', '$translate', 'Upload', 'sockHandler', 'fileManagerConfig',
        function ($http, $rootScope, $q, $window, $translate, Upload, sockHandler, fileManagerConfig) {

            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

            var sh = new sockHandler();
            sh.init();


            var ApiHandler = function () {
                this.inprocess = false;
                this.asyncSuccess = false;
                this.deviceName = "";
                this.error = '';
            };

            ApiHandler.prototype.trackChanges = function(deviceID,deviceName){
              sh.PDdeviceID  = deviceID;
              this.deviceName = deviceName;

            };

            ApiHandler.prototype.deferredHandler = function (data, deferred, code, defaultMsg) {

                if (!data || typeof data !== 'object') {
                    this.error = 'Error %s - Bridge response error, please check the API docs or this ajax response.'.replace('%s', code);
                }
                if (code === 404) {
                    this.error = 'Error 404 - Backend bridge is not working, please check the ajax response.';
                }
                if (code === 503) {
                    this.error = 'Error - Pocket Drive device '+this.deviceName+' cannot be reached at the momentttttt.';
                }
                if (data.result && data.result.error) {
                    this.error = data.result.error;
                }
                if (!this.error && data.error) {
                    this.error = data.error.message;
                }
                if (!this.error && defaultMsg) {
                    this.error = defaultMsg;
                }
                if (this.error) {
                    return deferred.reject(data);
                }
                return deferred.resolve(data);
            };

            ApiHandler.prototype.list = function (apiUrl, path, customDeferredHandler, exts) {
                var self = this;
                var dfHandler = customDeferredHandler || self.deferredHandler;
                var deferred = $q.defer();
                var data = {
                    action: 'list',
                    path: path,
                    fileExtensions: exts && exts.length ? exts : undefined
                };

                self.inprocess = true;
                self.error = '';

                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        dfHandler(message.message, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        dfHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;
            };

            ApiHandler.prototype.copy = function (apiUrl, items, path, singleFilename) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'copy',
                    items: items,
                    newPath: path
                };

                if (singleFilename && items.length === 1) {
                    data.singleFilename = singleFilename;
                }

                self.inprocess = true;
                self.error = '';

                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        self.deferredHandler(message.message, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        self.deferredHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;
            };

            ApiHandler.prototype.move = function (apiUrl, items, path) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'move',
                    items: items,
                    newPath: path
                };
                self.inprocess = true;
                self.error = '';

                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        self.deferredHandler(message.message, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        self.deferredHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;
            };

            ApiHandler.prototype.remove = function (apiUrl, items) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'remove',
                    items: items
                };

                self.inprocess = true;
                self.error = '';

                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        self.deferredHandler(message.message, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        self.deferredHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;
            };

            ApiHandler.prototype.upload = function (apiUrl, destination, files) {
                var url = this.getUploadUrl(apiUrl, destination);
                
                return !!$window.open(url, '_blank', 'winPop');
            };

            ApiHandler.prototype.getContent = function (apiUrl, itemPath) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'getContent',
                    item: itemPath
                };

                self.inprocess = true;
                self.error = '';
                $http.post(apiUrl, data).success(function (data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function (data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('error_getting_content'));
                })['finally'](function () {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.edit = function (apiUrl, itemPath, content) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'edit',
                    item: itemPath,
                    content: content
                };

                self.inprocess = true;
                self.error = '';

                $http.post(apiUrl, data).success(function (data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function (data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('error_modifying'));
                })['finally'](function () {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.rename = function (apiUrl, itemPath, newPath) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'rename',
                    item: itemPath,
                    newItemPath: newPath
                };
                self.inprocess = true;
                self.error = '';

                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        self.deferredHandler(message.message, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        self.deferredHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;
            };

            ApiHandler.prototype.shareFolder = function(path,users,candidates,removedCandidates, issharedFolder){
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'sharefolder',
                    path:path,
                    users:users,
                    candidates:candidates,
                    removedcandidates:removedCandidates,
                    issharedFolder:issharedFolder
                };

                self.inprocess = true;
                self.error = '';
                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        self.deferredHandler(message.message, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        self.deferredHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;

            };

            ApiHandler.prototype.getUsers = function(path,issharedFolder){
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'getusers',
                    path:path,
                    issharedFolder:issharedFolder
                };

                self.inprocess = true;
                self.error = '';

                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        self.deferredHandler(message.message, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        self.deferredHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;
            };

            ApiHandler.prototype.getUrl = function (apiUrl, path) {
                const user = $rootScope.globals.currentUser;
                
                return `http://${fileManagerConfig.apiUrl}:${fileManagerConfig.linkSharePort}/${user.username}/${sh.PDdeviceID}/?mode=fileOpen&path=${path}`;
            };

            ApiHandler.prototype.getMultiUrl = function (apiUrl, items) {
                const user = $rootScope.globals.currentUser;

                return `http://${fileManagerConfig.apiUrl}:${fileManagerConfig.linkSharePort}/${user.username}/${sh.PDdeviceID}/?mode=fileOpen&multi=true&path=${JSON.stringify(items)}`;
            };
            
            ApiHandler.prototype.getUploadUrl = function (apiUrl, destiantion) {
                const user = $rootScope.globals.currentUser;

                return `http://${fileManagerConfig.apiUrl}:${fileManagerConfig.linkSharePort}/${user.username}/${sh.PDdeviceID}/?mode=upload&path=${destiantion}`;
            };

            ApiHandler.prototype.download = function (apiUrl, itemPath, toFilename, downloadByAjax, forceNewWindow) {
                var url = this.getUrl(apiUrl, itemPath);

                return !!$window.open(url, '_blank', 'winPop');
            };

            ApiHandler.prototype.downloadMultiple = function (apiUrl, items, toFilename, downloadByAjax, forceNewWindow) {
                var url = this.getMultiUrl(apiUrl, items);
                
                return !!$window.open(url, '_blank', '');
            };

            ApiHandler.prototype.shareLink = function (apiUrl, item) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'linkshare',
                    item: item
                };
                var user = $rootScope.globals.currentUser;

                self.inprocess = true;
                self.error = '';

                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        var link = `http://${fileManagerConfig.apiUrl}:${fileManagerConfig.linkSharePort}/${user.username}/${sh.PDdeviceID}/${message.message.result.id}`;
                        
                        self.deferredHandler(link, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        self.deferredHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;
            };


            ApiHandler.prototype.compress = function (apiUrl, items, compressedFilename, path) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'compress',
                    items: items,
                    destination: path,
                    compressedFilename: compressedFilename
                };

                self.inprocess = true;
                self.error = '';

                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        self.deferredHandler(message.message, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        self.deferredHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;
            };

            ApiHandler.prototype.extract = function (apiUrl, item, folderName, path) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'extract',
                    item: item,
                    destination: path,
                    folderName: folderName
                };

                self.inprocess = true;
                self.error = '';

                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        self.deferredHandler(message.message, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        self.deferredHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;
            };

            ApiHandler.prototype.changePermissions = function (apiUrl, items, permsOctal, permsCode, recursive) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'changePermissions',
                    items: items,
                    perms: permsOctal,
                    permsCode: permsCode,
                    recursive: !!recursive
                };

                self.inprocess = true;
                self.error = '';
                $http.post(apiUrl, data).success(function (data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function (data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('error_changing_perms'));
                })['finally'](function () {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.createFolder = function (apiUrl, path) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'createFolder',
                    newPath: path
                };

                self.inprocess = true;
                self.error = '';

                sh.send(data, (message) => {
                    if (message.type === 'webConsoleRelay') {
                        self.deferredHandler(message.message, deferred, 200);
                        self.inprocess = false;
                    }
                    if (message === 'error') {
                        self.deferredHandler({}, deferred, 503);
                    }
                });

                return deferred.promise;
            };

            return ApiHandler;

        }]);
})(angular, jQuery);