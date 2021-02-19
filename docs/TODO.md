## Работа с несколькими полями на одном объекте

`attachToSelector(selector, live = true)`

Чистый javascript не дает возможности:

* сохранять ссылку на объект в data-атрибуте
  
* использовать для типов событий пространства имен (типа `keyup.phoneFormatter`)

Всё это нужно, чтобы иметь возможность отключить слежение за полем.

В jQuery, например, эти возможности достигаются за счет специального хранилища этих сущностей, общего для всего документа, где используется jQuery.

Для серьезной работы с множеством объектов в документе, похоже, нужно иметь отдельно сам formatter и отдельно реализацию его привязки к полям. Там должен быть кэш, метод `attachToSelector()` и пр.

Аналог `$(document.body).on(selector)` без jQuery 
см. https://stackoverflow.com/a/30880807/589600.

Событие вставки элементов в DOM для live [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) по `{childNodes: true, subTree:true}` + проверка по `Element.match(selector)`.  
В случае успеха - вызов действия.
