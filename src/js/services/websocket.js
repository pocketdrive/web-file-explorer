/**
 * Created by anuradhawick on 9/5/17.
 */
(function (angular, $) {

    'use strict';
    angular.module('FileManagerApp').service('sockHandler', ['$websocket', 'uuid4', 'fileManagerConfig',
        function ($websocket, uuid4, fileManagerConfig) {

            const sessionId = uuid4.generate();
            const username = `name-${sessionId}`;
            const deviceId = `id-${sessionId}`;

            const SocketCommunicator = function () {
                this.connected = false;
                this.ws = null;
                this.callback = null;
                console.log('making instance')
            };

            SocketCommunicator.prototype.init = function () {
                this.ws = $websocket.$new(`ws://${fileManagerConfig.apiUrl}:${fileManagerConfig.apiPort}`);

                this.ws.$on('$open', () => {
                    this.connectToCentralServer(username, deviceId);
                    this.connected = true;
                    console.log('registering');
                }).$on('$message', (message) => {
                    console.log('received message');
                    this.callback && this.callback(message);
                });
            };

            SocketCommunicator.prototype.send = function (message, callback) {
                console.log('sending message');
                this.callback = callback;
                if (!this.connected) {
                    const int = setInterval(() => {
                        if (this.connected) {
                            this.ws.$emit('webConsoleRelay', {
                                message: message,
                                toName: 'anuradha',
                                toId: 'device1234',
                                fromName: username,
                                fromId: deviceId
                            });
                            clearInterval(int);
                        }
                    }, 1000);
                } else {
                    this.ws.$emit('webConsoleRelay', {
                        message: message,
                        toName: 'anuradha',
                        toId: 'device1234',
                        fromName: username,
                        fromId: deviceId
                    });
                }
                return this.ws;
            };

            SocketCommunicator.prototype.connectToCentralServer = function (username, deviceId) {
                const msg = {
                    username: username, deviceId: deviceId
                };

                this.ws.$emit('webConsoleRegister', msg);
            };

            return SocketCommunicator;

        }]);
})(angular, jQuery);