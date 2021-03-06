//'use strict';
angular.module('angular-scroll-animate', []).directive('whenVisible', ['$document', '$window',
 function($document, $window) {

    var determineWhereElementIsInViewport =
      function($el, viewportHeight, whenVisibleFn, whenNotVisibleFn, delayPercent, scope) {

        var elementBounds = $el[0].getBoundingClientRect();

        var panelTop = elementBounds.top;
        var panelBottom = elementBounds.bottom;

        // pixel buffer until deciding to show the element
        var delayPx = delayPercent * elementBounds.height;

        var bottomVisible = (panelBottom - delayPx > 0) && (panelBottom < viewportHeight);
        var topVisible = (panelTop + delayPx <= viewportHeight) && (panelTop > 0);

        if ($el.data('hidden') && bottomVisible || topVisible) {
          whenVisibleFn($el, scope);
          $el.data('hidden', false);
        }

        // scrolled out from scrolling down or up
        else if (!($el.data('hidden')) && (panelBottom < 0 || panelTop > viewportHeight)) {
          whenNotVisibleFn($el, scope);
          $el.data('hidden', true);
        }
      };

    return {
      restrict: 'A',
      scope: {
        whenVisible: '&',
        whenNotVisible: '&?',
        delayPercent: '=?',
        bindScrollTo: '@?'
      },

      controller: ['$scope', function(scope) {
        if (!scope.whenVisible || !angular.isFunction(scope.whenVisible())) {
          throw new Error('Directive: angular-scroll-animate \'when-visible\' attribute must specify a function.');
        }

        if (scope.whenNotVisible && !angular.isFunction(scope.whenNotVisible())) {
          throw new Error('Directive: angular-scroll-animate \'when-not-visible\' attribute must specify a function.');
        }
        else if (!scope.whenNotVisible) {
          scope.whenNotVisible = function() {
            return angular.noop;
          };
        }

        if (scope.delayPercent) {

          var delayPercent = parseFloat(scope.delayPercent);

          if (!angular.isNumber(delayPercent) || (delayPercent < 0 || delayPercent > 1)) {
            throw new Error('Directive: angular-scroll-animate \'delay-percent\' attribute must be a decimal fraction between 0 and 1.');
          }
        }
    }],

      link: function(scope, el, attributes) {

        var delayPercent = attributes.delayPercent || 0.25; // lower = more eager to hide / show, higher = less eager
        var document = $document[0].documentElement;
        var checkPending = false;

        var updateVisibility = function() {
          determineWhereElementIsInViewport(el, document.clientHeight /* viewportHeight */ ,
            scope.whenVisible(), scope.whenNotVisible(), delayPercent, scope);

          checkPending = false;
        };

        var onScroll = function() {

          if (!checkPending) {
            checkPending = true;

            /* globals requestAnimationFrame */
            requestAnimationFrame(updateVisibility);
          }
        };

        var documentListenerEvents = 'scroll';

        /* allows overflow:auto on container element to animate for Safari browsers */
        if (attributes.bindScrollTo) {
          angular.element($document[0].querySelector(attributes.bindScrollTo)).on(documentListenerEvents, onScroll);
        }

        /* always bind to document scroll as well - works for overflow: auto on Chrome, Firefox browsers */
        $document.on(documentListenerEvents, onScroll);

        scope.$on('$destroy', function() {
          $document.off(documentListenerEvents, onScroll);
        });

        var $elWindow = angular.element($window);
        var windowListenerEvents = 'resize orientationchange';
        $elWindow.on(windowListenerEvents, onScroll);

        scope.$on('$destroy', function() {
          $elWindow.off(windowListenerEvents, onScroll);
        });

        // initialise
        el.data('hidden', true);
        scope.$evalAsync(onScroll);
      }
    };
 }]);
