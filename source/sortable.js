/*jshint undef: false, unused: false, indent: 2*/
/*global angular: false */

(function () {

  'use strict';
  var mainModule = angular.module('as.sortable');

  /**
   * Controller for Sortable.
   * @param $scope - the sortable scope.
   */
  mainModule.controller('as.sortable.sortableController', ['$scope', function ($scope) {

    this.scope = $scope;

    $scope.modelValue = null; // sortable list.
    $scope.callbacks = null;
    $scope.type = 'sortable';
    $scope.options = {};
    $scope.isDisabled = false;

    /**
     * Inserts the item in to the sortable list.
     *
     * @param index - the item index.
     * @param itemData - the item model data.
     */
    $scope.insertItem = function (index, itemData) {
      if ($scope.isMultipleSelect) {
        Array.prototype.splice.apply($scope.modelValue, [index, 0].concat($scope.removeList));
        $scope.removeList = null;
      } else {
        $scope.modelValue.splice(index, 0, itemData);
      }
    };

    /**
     * Removes the item from the sortable list.
     *
     * @param index - index to be removed.
     * @returns {*} - removed item.
     */
    $scope.removeItem = function (index) {

      // for multiple select
      if ($scope.isMultipleSelect) {
        $scope.removeList = []; // empty select remove item list
        // find all as-sortable-item all children
        var children = $scope.getAllSelectSortableItem(),
          selectIndex = [];
        for (var i = 0; i < children.length; i++) {
          if (angular.element(children[i]).scope().isSelect()) {
            selectIndex.push(i);
          }
        }
        // reverse order to splice list will not mess up array order
        for (var i = selectIndex.length - 1; i >= 0; i--) {
          // because we are reverse order to get item, push item in front of list
          $scope.removeList.unshift($scope.modelValue.splice(selectIndex[i], 1)[0]);
        }
        return $scope.removeList;
      } else {
        var removedItem = null;
        if (index > -1) {
          removedItem = $scope.modelValue.splice(index, 1)[0];
        }
        return removedItem;
      }
    };

    /**
     * Checks whether the sortable list is empty.
     *
     * @returns {null|*|$scope.modelValue|boolean}
     */
    $scope.isEmpty = function () {
      return ($scope.modelValue && $scope.modelValue.length === 0);
    };

    /**
     * Wrapper for the accept callback delegates to callback.
     *
     * @param sourceItemHandleScope - drag item handle scope.
     * @param destScope - sortable target scope.
     * @param destItemScope - sortable destination item scope.
     * @returns {*|boolean} - true if drop is allowed for the drag item in drop target.
     */
    $scope.accept = function (sourceItemHandleScope, destScope, destItemScope) {
      return $scope.callbacks.accept(sourceItemHandleScope, destScope, destItemScope);
    };

    /**
     * For multiple selection
     */
    // store parent variable indicate last modify item by shift key
    $scope.lastShiftModifyItemIndex = -1;

    $scope.getAllSelectSortableItem = function () {
      return $scope.element[0].querySelectorAll('.' + sortableConfig.itemClass);
    };

    /**
     * shiftFlag
     *
     * @return item with shiftFlagClass (should only has one)
     */
    $scope.getShiftFlagSortableItem = function () {
      return angular.element($scope.element[0].querySelector('.' + sortableConfig.shiftFlagClass));
    };

    $scope.cleanChildrenSelect = function () {
      // find as-sortable-item all children
      var children = $scope.getAllSelectSortableItem();
      for (var i = 0; i < children.length; i++) {
        var childrenScope = angular.element(children[i]).scope();
        childrenScope.removeSelectClass();
        childrenScope.removeShiftSelectClass();
      }
    };

    /**
     * there are four situations for shift selection
     * 1. user has not been modify before:
     *   simply use startIndex and endIndex indicate select range
     * 2. user has been modify before:
     *   2.1 newest end item is upside from last modify index, (removePrevSelection will be true)
     *   2.2 newest end item is closer to start index, remove the selection between newest end item and modify item (removeSelectionFromLastModify will be true)
     *   2.3 newest end item is equal or farer than modify item, simply use startIndex and endIndex indicate select range
     *
     * important: removeSelectionBetweenLastModifyAndEnd and removePrevSelection CAN NOT BE BOTH TRUE
     *
     * @param item1 - shfit start item index
     * @param item2 - shfit end item index (user current click)
     * */
    $scope.addSelectBetweenSortableItems = function (item1, item2) {
      var children = $scope.getAllSelectSortableItem(),
        hasLastModify = ($scope.lastShiftModifyItemIndex !== -1),
      // 2.1, modify -> item1 -> item2, item2 -> item1 -> modify
        removePrevSelection = hasLastModify && ($scope.lastShiftModifyItemIndex < item1 && item1 < item2) && ($scope.lastShiftModifyItemIndex > item1 && item1 > item2),
      // 2.2 if last shift item is closer to item1 than item2,
      // means user want to remove the selection between lastShiftIndex and item2 Index
        removeSelectionBetweenLastModifyAndEnd = hasLastModify && (!removePrevSelection),
        startIndex = (item1 < item2) ? item1 : item2,
        endIndex = (item1 < item2) ? item2 : item1,
        startAdding = false,
        startRemove = false,
        isEnd = false,
        isInModifyIndex = false;
      for (var i = 0; i < children.length; i++) {
        isInModifyIndex = (i === $scope.lastShiftModifyItemIndex);
        if (removePrevSelection && (isInModifyIndex || startRemove)) {
          startAdding = false;
          startRemove = true;
          angular.element(children[i]).removeClass(sortableConfig.selectClass);
          if (isInModifyIndex && isEnd) {
            // end of modify
            return;
          }
        }

        if (i === startIndex || startAdding) {
          startAdding = true;
          startRemove = false;
          angular.element(children[i]).addClass(sortableConfig.selectClass);
        }

        if (removeSelectionBetweenLastModifyAndEnd) {
          // start -> end -> modify, start -> modify -> end
          if (isInModifyIndex && startRemove) {
            // end of removeSelectionBetweenLastModifyAndEnd
            // when modifyIndex is after newest end point
            return;
          }

          // hit endIndex and not start yet, modify -> start -> end
          if ((i === endIndex) || startRemove || (isInModifyIndex && !startAdding && !startRemove)) {
            // start remove class
            startAdding = false;
            startRemove = true;
            if ((i !== endIndex)) {
              angular.element(children[i]).removeClass(sortableConfig.selectClass);
            }
            continue;
          }
        }

        if (i === endIndex && !startRemove) {
          startAdding = false;
          isEnd = true;
          if (!removePrevSelection) {
            // not farer implement
            return;
          }
          // start remove removePrevSelection
          startRemove = true;
        }
      }
    };

  }]);

  /**
   * Sortable directive - defines callbacks.
   * Parent directive for draggable and sortable items.
   * Sets modelValue, callbacks, element in scope.
   */
  mainModule.directive('asSortable', ['ui.sortable.sortableMultiHelper',
    function (sortableMultiHelper) {
      return {
        require: 'ngModel', // get a hold of NgModelController
        restrict: 'A',
        scope: true,
        controller: 'as.sortable.sortableController',
        link: function (scope, element, attrs, ngModelController) {

          var ngModel, callbacks;

          ngModel = ngModelController;

          if (!ngModel) {
            return; // do nothing if no ng-model
          }

          // Set the model value in to scope.
          ngModel.$render = function () {
            scope.modelValue = ngModel.$modelValue;
          };
          //set the element in scope to be accessed by its sub scope.
          scope.element = element;
          element.data('_scope',scope); // #144, work with angular debugInfoEnabled(false)

          callbacks = {accept: null, orderChanged: null, itemMoved: null, dragStart: null, dragMove:null, dragCancel: null, dragEnd: null};

          /**
           * Invoked to decide whether to allow drop.
           *
           * @param sourceItemHandleScope - the drag item handle scope.
           * @param destSortableScope - the drop target sortable scope.
           * @param destItemScope - the drop target item scope.
           * @returns {boolean} - true if allowed for drop.
           */
          callbacks.accept = function (sourceItemHandleScope, destSortableScope, destItemScope) {
            return true;
          };

          /**
           * Invoked when order of a drag item is changed.
           *
           * @param event - the event object.
           */
          callbacks.orderChanged = function (event) {
          };

          /**
           * Invoked when the item is moved to other sortable.
           *
           * @param event - the event object.
           */
          callbacks.itemMoved = function (event) {
          };

          /**
           * Invoked when the drag started successfully.
           *
           * @param event - the event object.
           */
          callbacks.dragStart = function (event) {
          };

          /**
           * Invoked when the drag started successfully.
           *
           * @param event - the event object.
          */
          callbacks.dragMove = function (event) {
          };

          /**
           * Invoked when the drag cancelled.
           *
           * @param event - the event object.
           */
          callbacks.dragCancel = function (event) {
          };

          /**
           * Invoked when the drag stopped.
           *
           * @param event - the event object.
           */
          callbacks.dragEnd = function (event) {
          };

          //Set the sortOptions callbacks else set it to default.
          scope.$watch(attrs.asSortable, function (newVal, oldVal) {
            angular.forEach(newVal, function (value, key) {
              if (callbacks[key]) {
                if (typeof value === 'function') {
                  callbacks[key] = value;
                }
              } else {
                scope.options[key] = value;
              }
            });
            scope.callbacks = callbacks;
          }, true);

          // Set isDisabled if attr is set, if undefined isDisabled = false
          if (angular.isDefined(attrs.isDisabled)) {
            scope.$watch(attrs.isDisabled, function (newVal, oldVal) {
              if (!angular.isUndefined(newVal)) {
                scope.isDisabled = newVal;
              }
            }, true);
          }

          /**
           * for multiple selection
           * */
          // can multiple select or not
          scope.isMultipleSelect = !!attrs.multiple;
          if (scope.isMultipleSelect) {
            sortableMultiHelper.init();
            // if it click on ng-sortable area, clean all current selection
            element.on('mousedown.cleanSelection', function (event) {
              if( event.target !== this ) {
                return false;
              }
              scope.cleanChildrenSelect();
            });
            // remove mouse selection area after scope destroy
            scope.$on('$destroy', function handleDestroyEvent() {
              sortableMultiHelper.cleanSelection();
            });
          }
        }
      };
    }]);

}());
