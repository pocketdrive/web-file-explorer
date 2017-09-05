/**
 * Created by anuradhawick on 9/5/17.
 */
(function (angular) {

    'use strict';
    angular.module('FileManagerApp').service('sockHandler', ['$websocket',
        function ($websocket) {

            const SocketCommunicator = function () {
                this.connected = false;
                this.ws = null;
                this.callback = null;
                console.log('making instance')
            };

            SocketCommunicator.prototype.init = function () {
                this.ws = $websocket.$new('ws://localhost:8080');

                this.ws.$on('$open', () => {
                    this.connectToCentralServer('someName', 'someDevice');
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
                                fromName: 'someName',
                                fromId: 'someDevice'
                            });
                            clearInterval(int);
                        }
                    }, 1000);
                } else {
                    this.ws.$emit('webConsoleRelay', {
                        message: message,
                        toName: 'anuradha',
                        toId: 'device1234',
                        fromName: 'someName',
                        fromId: 'someDevice'
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
})(angular);