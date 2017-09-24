/**
 * Created by anuradhawick on 9/5/17.
 */
(function (angular, $) {

    'use strict';
    angular.module('FileManagerApp').service('sockHandler', ['$websocket', 'uuid4', 'fileManagerConfig','$rootScope',
        function ($websocket, uuid4, fileManagerConfig,$rootScope) {

            const sessionId = uuid4.generate();
            const deviceId = `id-${sessionId}`;
            const username = $rootScope.globals.currentUser.username;

           // const fileNavigator =new fileNavigator();
            const SocketCommunicator = function () {
                this.connected = false;
                this.ws = null;
                this.callback = null;
                this.PDdeviceID = $rootScope.globals.currentUser.device.length ? $rootScope.globals.currentUser.device[0].uuid
                    :$rootScope.globals.currentUser.device.uuid;
            };

            SocketCommunicator.prototype.init = function () {
                this.ws = $websocket.$new(`ws://${fileManagerConfig.apiUrl}:${fileManagerConfig.apiPort}`);

                this.ws.$on('$open', () => {
                    this.connectToCentralServer(deviceId);
                    this.connected = true;
                    console.log('registering');
                }).$on('$message', (message) => {
                    console.log('received message');
                    this.callback && this.callback(message);
                });
            };

            SocketCommunicator.prototype.send = function (message, callback) {
                this.callback = callback;
                if (!this.connected) {
                    const int = setInterval(() => {
                        if (this.connected) {
                            this.ws.$emit('webConsoleRelay', {
                                message: message,
                                toName: username,
                                toId: this.PDdeviceID,
                                fromId: deviceId
                            });
                            clearInterval(int);
                        }
                    }, 1000);
                } else {
                    this.ws.$emit('webConsoleRelay', {
                        message: message,
                        toName: username,
                        toId: this.PDdeviceID,
                        fromId: deviceId
                    });
                }
                return this.ws;
            };

            SocketCommunicator.prototype.connectToCentralServer = function (deviceId) {
                const msg = {
                    deviceId: deviceId
                };
                this.ws.$emit('webConsoleRegister', msg);
            };

            return SocketCommunicator;

        }]);
})(angular, jQuery);