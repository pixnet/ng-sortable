/*jshint indent: 2 */
/*global angular: false */

(function () {

  'use strict';
  var mainModule = angular.module('as.sortable');

  /**
   * Controller for sortable item.
   *
   * @param $scope - drag item scope
   */
  mainModule.controller('as.sortable.sortableItemController', ['$scope', function ($scope) {

    this.scope = $scope;

    $scope.sortableScope = null;
    $scope.modelValue = null; // sortable item.
    $scope.type = 'item';

    /**
     * returns the index of the drag item from the sortable list.
     *
     * @returns {*} - index value.
     */
    $scope.index = function () {
      return $scope.$index;
    };

    /**
     * Returns the item model data.
     *
     * @returns {*} - item model value.
     */
    $scope.itemData = function () {
      return $scope.sortableScope.modelValue[$scope.$index];
    };

  }]);

  /**
   * sortableItem directive.
   */
  mainModule.directive('asSortableItem', ['sortableConfig',
    function (sortableConfig) {
      return {
        require: ['^asSortable', '?ngModel'],
        restrict: 'A',
        controller: 'as.sortable.sortableItemController',
        link: function (scope, element, attrs, ctrl) {
          var sortableController = ctrl[0];
          var ngModelController = ctrl[1];
          if (sortableConfig.itemClass) {
            element.addClass(sortableConfig.itemClass);
          }
          scope.sortableScope = sortableController.scope;
          if (ngModelController) {
            ngModelController.$render = function () {
              scope.modelValue = ngModelController.$modelValue;
            };
          } else {
            scope.modelValue = sortableController.scope.modelValue[scope.$index];
          }
          scope.element = element;
          element.data('_scope',scope); // #144, work with angular debugInfoEnabled(false)

          /**
           * For Multiple selection
           * */
          // remove selectClass class, call from sortableController
          scope.removeSelectClass = function () {
            element.removeClass(sortableConfig.selectClass);
          };

          // remove shiftFlagClass class, call from sortableController
          scope.removeShiftSelectClass = function () {
            element.removeClass(sortableConfig.shiftFlagClass);
          };

          // return is this item has been select or not
          scope.isSelect = function () {
            return element.hasClass(sortableConfig.selectClass);
          };

          /**
           * add event listen for click (use select item)
           * */
          if (scope.sortableScope.isMultipleSelect) {
            scope.element.on('click', function (e) {
              var shiftFlag = scope.getShiftFlagSortableItem(),
                parentScope = scope.sortableScope;
              if (e.ctrlKey || e.metaKey) {
                element.toggleClass(sortableConfig.selectClass);
              } else if (e.shiftKey && shiftFlag.length) {
                var shiftElementScope = shiftFlag.scope();
                if (shiftElementScope) {
                  var elementIndex = element.scope().index();
                  parentScope.addSelectBetweenSortableItems(shiftElementScope.index(), elementIndex);
                  parentScope.lastShiftModifyItemIndex = elementIndex;
                  return;
                }
              } else {
                // parent function will remove 'selectClass' for all asSortableItem element
                var hasClass = element.hasClass(sortableConfig.selectClass);
                parentScope.cleanChildrenSelect();
                if (hasClass) {
                  element.removeClass(sortableConfig.selectClass);
                } else {
                  element.addClass(sortableConfig.selectClass);
                }
                shiftFlag.removeClass(sortableConfig.shiftFlagClass);
                element.addClass(sortableConfig.shiftFlagClass);
                // clear last modify item, not shift modify yet
                parentScope.lastShiftModifyItemIndex = -1;
              }
            });
          }

        }
      };
    }]);

}());
