// jsdom не реализует scroll-API. Компоненты вызывают их при фокусе и якорной
// навигации, поэтому добавляем no-op заглушки только там, где есть DOM.
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView ??= () => {};
}
