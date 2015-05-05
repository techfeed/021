(function() {
  angular
    .module('app', [
      'ui.router',
      'lbServices'
    ])
    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
      function($stateProvider, $urlRouterProvider, $locationProvider) {
        //$locationProvider.html5Mode(true);
        <% for name, def of @models: %>
          $stateProvider
            .state('<%= @detectModelPath def %>/list', {
              url: '<%= @detectModelPath def %>/list',
              controller: '<%= name %>ListController'
            });
          $stateProvider
            .state('<%= @detectModelPath def %>/add', {
              url: '<%= @detectModelPath def %>/add',
              controller: '<%= name %>AddController'
            });
        <% end %>
      }])
    .run(['$rootScope', '$state', function($rootScope, $state) {
      $rootScope.$on('$stateChangeStart', function(event, next) {
        if (next.authenticate && !$rootScope.currentUser) {
          event.preventDefault(); //prevent current page from loading
          $state.go('forbidden');
        }
      });
    }]);

  ons.ready(function() {
    <%= @navigator %>.on('prepop', function(event) {
      
    });
  });
})();
