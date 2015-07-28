/*jshint indent: 2 */
/*global angular: false */

(function () {

  'use strict';

  var mainModule = angular.module('ui.sortable');

  /**
   * Helper factory for multi selection.
   * http://codepen.io/netgfx/pen/twAfG?editors=001
   * http://nightlycoding.com/index.php/2014/02/click-and-drag-multi-selection-rectangle-with-javascript/
   */
  mainModule.factory('as.sortable.sortableMultiHelper', ['$document', 'sortableConfig',
      function ($document, sortableConfig) {
        var helper = {},
          initialW = 0,
          initialH = 0,
          isDragging = false,
          isInitialize = false;

        helper.startDrag = function () {
          isDragging = true;
          cleanLocalSelection();
        };

        helper.stopDrag = function () {
          isDragging = false;
        };

        helper.init = function () {

          if (!isInitialize) {
            isInitialize = true;
            var dropArea = '<div class="'+ sortableConfig.mouseSelectionAreaClass +'">' +
              '<div class="' + sortableConfig.mouseSelectionSelectionClass + '"><span></span></div></div>';
            angular.element('body').append(dropArea);
          }

          angular.element($document).bind('mousedown.multiMouseSelection', function (event) {

            if (isDragging) {
              return;
            }

            initialW = event.pageX;
            initialH = event.pageY;

            getAngularElementByClass(sortableConfig.mouseSelectionSelectionClass)
              .addClass(sortableConfig.mouseSelectionActiveClass);

            angular.element($document).bind('mouseup.multiMouseSelection', selectElements);
            angular.element($document).bind('mousemove.multiMouseSelection', openSelector);
          });
        };

        helper.cleanSelection = function () {
          angular.element($document).unbind('mousedown.multiMouseSelection');
          getAngularElementByClass(sortableConfig.mouseSelectionAreaClass).remove();
          isInitialize = false;
          cleanLocalSelection();
        };

        function getAngularElementByClass (className) {
          return angular.element(document.getElementsByClassName(className));
        }

        function selectElements() {
          var aElem = getAngularElementByClass(sortableConfig.mouseSelectionSelectionClass);

          getAngularElementByClass(sortableConfig.itemClass).each(function () {
            var bElem = angular.element(this);
            var result = doObjectsCollide(aElem, bElem);

            if (result) {
              bElem.addClass(sortableConfig.selectClass);
            }
          });
          cleanLocalSelection();
        }

        function cleanLocalSelection() {
          var elem = getAngularElementByClass(sortableConfig.mouseSelectionSelectionClass);
          elem.removeClass(sortableConfig.mouseSelectionActiveClass);
          elem.css({
            'width': 0,
            'height': 0
          });

          angular.element($document).unbind('mousemove.multiMouseSelection', openSelector);
          angular.element($document).unbind('mouseup.multiMouseSelection', selectElements);
        }

        function openSelector(event) {

          var w = Math.abs(initialW - event.pageX);
          var h = Math.abs(initialH - event.pageY);
          var selectAreaElement = getAngularElementByClass(sortableConfig.mouseSelectionSelectionClass);

          selectAreaElement.css({
            'width': w,
            'height': h,
            'top': initialH,
            'left': initialW
          });
          if (event.pageX <= initialW && event.pageY >= initialH) {
            selectAreaElement.css({
              'left': event.pageX
            });
          } else if (event.pageY <= initialH && event.pageX >= initialW) {
            selectAreaElement.css({
              'top': event.pageY
            });
          } else if (event.pageY < initialH && event.pageX < initialW) {
            selectAreaElement.css({
              'left': event.pageX,
              'top': event.pageY
            });
          }
        }

        function doObjectsCollide(a, b) {

          var aTop = a.offset().top;
          var aLeft = a.offset().left;
          var bTop = b.offset().top;
          var bLeft = b.offset().left;
          var aHeight = a.height();
          var aWidth = a.width();

          // return if selection width and height is not valid
          if (0 === aWidth || 0 === aHeight) {
            return false;
          }

          return !(
            ((aTop + aHeight) < (bTop)) ||
            (aTop > (bTop + b.height())) ||
            ((aLeft + aWidth) < bLeft) ||
            (aLeft > (bLeft + b.width()))
            );
        }
        return helper;

      }]
  );

})();