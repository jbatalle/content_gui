'use strict';

angular.module('openNaaSApp', ['ngResource', 'ngRoute', 'ngCookies', 'openNaaSApp.services', 'LocalStorageModule', 'cb.x2js', 'ngTable', 'ngDialog', 'mgcrea.ngStrap'])
        .config(function (localStorageServiceProvider) {
            localStorageServiceProvider
                    .setPrefix('openNaaSApp')
                    .setStorageType('sessionStorage')
                    .setNotify(true, true);
        }).config(
        ['$routeProvider', '$locationProvider', '$httpProvider', function ($routeProvider, $locationProvider, $httpProvider) {

                $routeProvider
                        .when('/login', {
                            templateUrl: 'partials/login.html',
                            controller: 'LoginController'
                        })
                        .when('/piMgt', {
                            templateUrl: 'partials/piMgt.html',
                            controller: 'PIMgtCtrl'
                        })
                        .when('/createVI', {
                            templateUrl: 'partials/createVI/index.html',
                            controller: 'listVIController'
                        })
                        .when('/editVIRequest/:id', {
                            templateUrl: 'partials/createVI/editor.html',
                            controller: 'editVIController'
                        })
                        .when('/mgt', {
                            templateUrl: 'partials/mgt.html',
                            controller: 'MgtCtrl'
                        })
                        .when('/statistics', {
                            templateUrl: 'partials/statistics.html',
                            controller: 'StatisticsCtrl'
                        })
                        .when('/users', {
                            templateUrl: 'partials/users.html',
                            controller: 'UsersController'
                        })
                        .otherwise({
                            templateUrl: 'partials/piMgt.html',
                            controller: "PIMgtCtrl"
                        });

                $locationProvider.hashPrefix('!');

                /* Register error provider that shows message on failed requests or redirects to login page on
                 * unauthenticated requests */
                $httpProvider.interceptors.push(function ($q, $rootScope, $location) {
                    return {
                        'responseError': function (rejection) {
                            var status = rejection.status;
                            var config = rejection.config;
                            var method = config.method;
                            var url = config.url;

                            if (status == 401) {
                                $location.path("/login");
                            } else {
                                $rootScope.error = method + " on " + url + " failed with status " + status;
                            }

                            return $q.reject(rejection);
                        }
                    };
                }
                );

                /* Registers auth token interceptor, auth token is either passed by header or by query parameter
                 * as soon as there is an authenticated user */
                $httpProvider.interceptors.push(function ($q, $rootScope, $location) {
                    return {
                        'request': function (config) {
                            var isRestCall = config.url.indexOf('rest') == 0;
                            if (isRestCall && angular.isDefined($rootScope.authToken)) {
                                var authToken = $rootScope.authToken;
                                if (openNaaSAppConfig.useAuthTokenHeader) {
                                    config.headers['X-Auth-Token'] = authToken;
                                } else {
                                    config.url = config.url + "?token=" + authToken;
                                }
                            }
                            return config || $q.when(config);
                        }
                    };
                }
                );

            }]

        ).run(function ($rootScope, $location, $cookieStore, UserService) {

    /* Reset error when a new view is loaded */
    $rootScope
            .$on('$viewContentLoaded', function () {
                delete $rootScope.error;
                delete $rootScope.info;
            });

    $rootScope.hasRole = function (role) {

        if ($rootScope.user === undefined) {
            return false;
        }

        if ($rootScope.user.roles[role] === undefined) {
            return false;
        }

        return $rootScope.user.roles[role];
    };

    $rootScope.logout = function () {
        delete $rootScope.user;
        delete $rootScope.authToken;
        $cookieStore.remove('authToken');
        $location.path("/login");
    };

    /* Try getting valid user from cookie or go to login page */
    var originalPath = $location.path();
    $location.path("/login");
    var authToken = $cookieStore.get('authToken');
    if (authToken !== undefined) {
        $rootScope.authToken = authToken;
        UserService.get(function (user) {
            $rootScope.user = user;
            $location.path(originalPath);
        });
    }

    $rootScope.initialized = true;
});

var services = angular.module('openNaaSApp.services', ['ngResource']);
var genericUrl = "rest/mqnaas/";
var graph;