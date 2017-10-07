(function (angular) {
    'use strict';
    angular.module('FileManagerApp').service('fileNavigator', [
        '$rootScope', 'apiMiddleware', 'fileManagerConfig', 'item', function ($rootScope, ApiMiddleware, fileManagerConfig, Item) {

            var FileNavigator = function () {
                this.apiMiddleware = new ApiMiddleware();
                this.requesting = false;
                this.fileList = [];
                this.currentPath = this.getBasePath();
                this.history = [];
                this.error = '';
                this.deviceId = "";
                this.deviceName = $rootScope.globals.currentUser.device.length ? $rootScope.globals.currentUser.device[0].name
                    : $rootScope.globals.currentUser.device.name;
                this.historyIndex = 0;

                this.onRefresh = function () {
                };
            };

            FileNavigator.prototype.getBasePath = function () {
                var path = (fileManagerConfig.basePath || '').replace(/^\//, '');
                return path.trim() ? path.split('/') : [];
            };

            FileNavigator.prototype.deferredHandler = function (data, deferred, code, defaultMsg) {
                if (!data || typeof data !== 'object') {
                    this.error = 'Error %s - Bridge response error, please check the API docs or this ajax response.'.replace('%s', code);
                }
                if (code === 404) {
                    this.error = 'Error 404 - Backend bridge is not working, please check the ajax response.';
                }
                if (code === 503) {
                    this.error = 'Error - Pocket Drive device ' + this.deviceName + ' cannot be reached at the moment.';
                }
                if (code === 200) {
                    this.error = null;
                }
                if (!this.error && data.result && data.result.error) {
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

            FileNavigator.prototype.list = function () {
                return this.apiMiddleware.list(this.currentPath, this.deferredHandler.bind(this));
            };

            FileNavigator.prototype.refresh = function () {
                var self = this;
                if (!self.currentPath.length) {
                    self.currentPath = this.getBasePath();
                }
                var path = self.currentPath.join('/');
                self.requesting = true;
                self.fileList = [];
                return self.list().then(function (data) {
                    self.fileList = (data.result || []).map(function (file) {
                        return new Item(file, self.currentPath);
                    });

                }).finally(function () {
                    self.buildTree(path);
                    self.onRefresh();
                    self.requesting = false;
                });
            };

            FileNavigator.prototype.buildTree = function (path) {
                var flatNodes = [], selectedNode = {};
                this.counter++;

                function recursive(parent, item, path) {
                    var absName = path ? (path + '/' + item.model.name) : item.model.name;
                    if (parent.name && parent.name.trim() && path.trim().indexOf(parent.name) !== 0) {
                        parent.nodes = [];
                    }
                    if (parent.name !== path) {
                        parent.nodes.forEach(function (nd) {
                            recursive(nd, item, path);
                        });
                    } else {
                        for (var e in parent.nodes) {
                            if (parent.nodes[e].name === absName) {
                                return;
                            }
                        }
                        parent.nodes.push({item: item, name: absName, nodes: []});
                    }

                    parent.nodes = parent.nodes.sort(function (a, b) {
                        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() === b.name.toLowerCase() ? 0 : 1;
                    });
                }

                function flatten(node, array) {
                    array.push(node);
                    for (var n in node.nodes) {
                        flatten(node.nodes[n], array);
                    }
                }

                function findNode(data, path) {
                    return data.filter(function (n) {
                        return n.name === path;
                    })[0];
                }

                if (!this.history.length) {
                    let internalCounter = -1;
                    if (!$rootScope.globals.currentUser.device.length) {
                        this.history.push({
                            name: $rootScope.globals.currentUser.device.name,
                            nodes: [],
                            deviceID: $rootScope.globals.currentUser.device.uuid,
                            count: ++internalCounter
                        })
                    } else {
                        for (let device of $rootScope.globals.currentUser.device) {
                            this.history.push({
                                name: device.name,
                                nodes: [],
                                deviceID: device.uuid,
                                count: ++internalCounter
                            })
                        }
                    }
                }

                for (let n = 0; n < this.history.length; ++n) {

                    if (n === this.historyIndex) {
                        flatten(this.history[n], flatNodes);
                        selectedNode = findNode(flatNodes, path);
                        selectedNode && (selectedNode.nodes = []);

                        for (var o in this.fileList) {
                            var item = this.fileList[o];
                            console.log(item);
                            item instanceof Item && item.isFolder() && recursive(this.history[n], item, path);
                        }
                    } else {
                        this.history[n].nodes = [];
                    }
                    this.history[n].name = $rootScope.globals.currentUser.device.length ? $rootScope.globals.currentUser.device[n].name
                        : $rootScope.globals.currentUser.device.name
                }

            };

            FileNavigator.prototype.getDetails = function (item) {
                if (item.deviceID) {
                    this.deviceId = item.deviceID;
                    this.historyIndex = item.count;
                    this.deviceName = item.name;
                }
                this.apiMiddleware.trackChanges(this.deviceId, this.deviceName);
            };


            FileNavigator.prototype.folderClick = function (item) {
                for(let historyItem of this.history){
                    historyItem.name="";
                }
                this.currentPath = [];
                if (item && item.isFolder()) {
                    this.currentPath = item.model.fullPath().split('/').splice(1);
                }
                this.refresh();
            };

            FileNavigator.prototype.upDir = function () {
                if (this.currentPath[0]) {
                    this.currentPath = this.currentPath.slice(0, -1);
                    this.refresh();
                }
            };

            FileNavigator.prototype.goTo = function (index) {
                this.currentPath = this.currentPath.slice(0, index + 1);
                this.refresh();
            };

            FileNavigator.prototype.fileNameExists = function (fileName) {
                return this.fileList.find(function (item) {
                    return fileName && item.model.name.trim() === fileName.trim();
                });
            };

            FileNavigator.prototype.listHasFolders = function () {
                return this.fileList.find(function (item) {
                    return item.model.type === 'dir';
                });
            };

            FileNavigator.prototype.getCurrentFolderName = function () {
                return this.currentPath.slice(-1)[0] || '/';
            };

            return FileNavigator;
        }]);
})(angular);