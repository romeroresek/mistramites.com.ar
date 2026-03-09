/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./worker/index.ts":
/*!*************************!*\
  !*** ./worker/index.ts ***!
  \*************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/// <reference lib=\"webworker\" />\nself.addEventListener(\"push\", (event)=>{\n    if (!event.data) return;\n    const data = event.data.json();\n    const { title, body, icon, badge, url } = data;\n    const options = {\n        body,\n        icon: icon || \"/icon-192x192.png\",\n        badge: badge || \"/icon-192x192.png\",\n        data: {\n            url: url || \"/\"\n        }\n    };\n    event.waitUntil(self.registration.showNotification(title, options));\n});\nself.addEventListener(\"notificationclick\", (event)=>{\n    var _event_notification_data;\n    event.notification.close();\n    const url = ((_event_notification_data = event.notification.data) === null || _event_notification_data === void 0 ? void 0 : _event_notification_data.url) || \"/\";\n    event.waitUntil(self.clients.matchAll({\n        type: \"window\",\n        includeUncontrolled: true\n    }).then((clientList)=>{\n        for (const client of clientList){\n            if (client.url.includes(self.location.origin) && \"focus\" in client) {\n                client.focus();\n                if (\"navigate\" in client) {\n                    client.navigate(url);\n                }\n                return;\n            }\n        }\n        if (self.clients.openWindow) {\n            return self.clients.openWindow(url);\n        }\n    }));\n});\n\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                /* unsupported import.meta.webpackHot */ undefined.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi93b3JrZXIvaW5kZXgudHMiLCJtYXBwaW5ncyI6IjtBQUFBLGlDQUFpQztBQUlqQ0EsS0FBS0MsZ0JBQWdCLENBQUMsUUFBUSxDQUFDQztJQUM3QixJQUFJLENBQUNBLE1BQU1DLElBQUksRUFBRTtJQUVqQixNQUFNQSxPQUFPRCxNQUFNQyxJQUFJLENBQUNDLElBQUk7SUFDNUIsTUFBTSxFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxLQUFLLEVBQUVDLEdBQUcsRUFBRSxHQUFHTjtJQUUxQyxNQUFNTyxVQUErQjtRQUNuQ0o7UUFDQUMsTUFBTUEsUUFBUTtRQUNkQyxPQUFPQSxTQUFTO1FBQ2hCTCxNQUFNO1lBQUVNLEtBQUtBLE9BQU87UUFBSTtJQUMxQjtJQUVBUCxNQUFNUyxTQUFTLENBQUNYLEtBQUtZLFlBQVksQ0FBQ0MsZ0JBQWdCLENBQUNSLE9BQU9LO0FBQzVEO0FBRUFWLEtBQUtDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDQztRQUc5QkE7SUFGWkEsTUFBTVksWUFBWSxDQUFDQyxLQUFLO0lBRXhCLE1BQU1OLE1BQU1QLEVBQUFBLDJCQUFBQSxNQUFNWSxZQUFZLENBQUNYLElBQUksY0FBdkJELCtDQUFBQSx5QkFBeUJPLEdBQUcsS0FBSTtJQUU1Q1AsTUFBTVMsU0FBUyxDQUNiWCxLQUFLZ0IsT0FBTyxDQUFDQyxRQUFRLENBQUM7UUFBRUMsTUFBTTtRQUFVQyxxQkFBcUI7SUFBSyxHQUFHQyxJQUFJLENBQUMsQ0FBQ0M7UUFDekUsS0FBSyxNQUFNQyxVQUFVRCxXQUFZO1lBQy9CLElBQUlDLE9BQU9iLEdBQUcsQ0FBQ2MsUUFBUSxDQUFDdkIsS0FBS3dCLFFBQVEsQ0FBQ0MsTUFBTSxLQUFLLFdBQVdILFFBQVE7Z0JBQ2xFQSxPQUFPSSxLQUFLO2dCQUNaLElBQUksY0FBY0osUUFBUTtvQkFDdkJBLE9BQXdCSyxRQUFRLENBQUNsQjtnQkFDcEM7Z0JBQ0E7WUFDRjtRQUNGO1FBQ0EsSUFBSVQsS0FBS2dCLE9BQU8sQ0FBQ1ksVUFBVSxFQUFFO1lBQzNCLE9BQU81QixLQUFLZ0IsT0FBTyxDQUFDWSxVQUFVLENBQUNuQjtRQUNqQztJQUNGO0FBRUo7QUFFUyIsInNvdXJjZXMiOlsiRDpcXG1pc3RyYW1pdGVzLmNvbS5hclxcdHJhbWl0ZXMtYXBwXFx3b3JrZXJcXGluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIGxpYj1cIndlYndvcmtlclwiIC8+XHJcblxyXG5kZWNsYXJlIGNvbnN0IHNlbGY6IFNlcnZpY2VXb3JrZXJHbG9iYWxTY29wZVxyXG5cclxuc2VsZi5hZGRFdmVudExpc3RlbmVyKFwicHVzaFwiLCAoZXZlbnQpID0+IHtcclxuICBpZiAoIWV2ZW50LmRhdGEpIHJldHVyblxyXG5cclxuICBjb25zdCBkYXRhID0gZXZlbnQuZGF0YS5qc29uKClcclxuICBjb25zdCB7IHRpdGxlLCBib2R5LCBpY29uLCBiYWRnZSwgdXJsIH0gPSBkYXRhXHJcblxyXG4gIGNvbnN0IG9wdGlvbnM6IE5vdGlmaWNhdGlvbk9wdGlvbnMgPSB7XHJcbiAgICBib2R5LFxyXG4gICAgaWNvbjogaWNvbiB8fCBcIi9pY29uLTE5MngxOTIucG5nXCIsXHJcbiAgICBiYWRnZTogYmFkZ2UgfHwgXCIvaWNvbi0xOTJ4MTkyLnBuZ1wiLFxyXG4gICAgZGF0YTogeyB1cmw6IHVybCB8fCBcIi9cIiB9LFxyXG4gIH1cclxuXHJcbiAgZXZlbnQud2FpdFVudGlsKHNlbGYucmVnaXN0cmF0aW9uLnNob3dOb3RpZmljYXRpb24odGl0bGUsIG9wdGlvbnMpKVxyXG59KVxyXG5cclxuc2VsZi5hZGRFdmVudExpc3RlbmVyKFwibm90aWZpY2F0aW9uY2xpY2tcIiwgKGV2ZW50KSA9PiB7XHJcbiAgZXZlbnQubm90aWZpY2F0aW9uLmNsb3NlKClcclxuXHJcbiAgY29uc3QgdXJsID0gZXZlbnQubm90aWZpY2F0aW9uLmRhdGE/LnVybCB8fCBcIi9cIlxyXG5cclxuICBldmVudC53YWl0VW50aWwoXHJcbiAgICBzZWxmLmNsaWVudHMubWF0Y2hBbGwoeyB0eXBlOiBcIndpbmRvd1wiLCBpbmNsdWRlVW5jb250cm9sbGVkOiB0cnVlIH0pLnRoZW4oKGNsaWVudExpc3QpID0+IHtcclxuICAgICAgZm9yIChjb25zdCBjbGllbnQgb2YgY2xpZW50TGlzdCkge1xyXG4gICAgICAgIGlmIChjbGllbnQudXJsLmluY2x1ZGVzKHNlbGYubG9jYXRpb24ub3JpZ2luKSAmJiBcImZvY3VzXCIgaW4gY2xpZW50KSB7XHJcbiAgICAgICAgICBjbGllbnQuZm9jdXMoKVxyXG4gICAgICAgICAgaWYgKFwibmF2aWdhdGVcIiBpbiBjbGllbnQpIHtcclxuICAgICAgICAgICAgKGNsaWVudCBhcyBXaW5kb3dDbGllbnQpLm5hdmlnYXRlKHVybClcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAoc2VsZi5jbGllbnRzLm9wZW5XaW5kb3cpIHtcclxuICAgICAgICByZXR1cm4gc2VsZi5jbGllbnRzLm9wZW5XaW5kb3codXJsKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIClcclxufSlcclxuXHJcbmV4cG9ydCB7fVxyXG4iXSwibmFtZXMiOlsic2VsZiIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsImRhdGEiLCJqc29uIiwidGl0bGUiLCJib2R5IiwiaWNvbiIsImJhZGdlIiwidXJsIiwib3B0aW9ucyIsIndhaXRVbnRpbCIsInJlZ2lzdHJhdGlvbiIsInNob3dOb3RpZmljYXRpb24iLCJub3RpZmljYXRpb24iLCJjbG9zZSIsImNsaWVudHMiLCJtYXRjaEFsbCIsInR5cGUiLCJpbmNsdWRlVW5jb250cm9sbGVkIiwidGhlbiIsImNsaWVudExpc3QiLCJjbGllbnQiLCJpbmNsdWRlcyIsImxvY2F0aW9uIiwib3JpZ2luIiwiZm9jdXMiLCJuYXZpZ2F0ZSIsIm9wZW5XaW5kb3ciXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./worker/index.ts\n"));

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			if (cachedModule.error !== undefined) throw cachedModule.error;
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types policy */
/******/ 	(() => {
/******/ 		var policy;
/******/ 		__webpack_require__.tt = () => {
/******/ 			// Create Trusted Type policy if Trusted Types are available and the policy doesn't exist yet.
/******/ 			if (policy === undefined) {
/******/ 				policy = {
/******/ 					createScript: (script) => (script)
/******/ 				};
/******/ 				if (typeof trustedTypes !== "undefined" && trustedTypes.createPolicy) {
/******/ 					policy = trustedTypes.createPolicy("nextjs#bundler", policy);
/******/ 				}
/******/ 			}
/******/ 			return policy;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types script */
/******/ 	(() => {
/******/ 		__webpack_require__.ts = (script) => (__webpack_require__.tt().createScript(script));
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/react refresh */
/******/ 	(() => {
/******/ 		if (__webpack_require__.i) {
/******/ 		__webpack_require__.i.push((options) => {
/******/ 			const originalFactory = options.factory;
/******/ 			options.factory = (moduleObject, moduleExports, webpackRequire) => {
/******/ 				const hasRefresh = typeof self !== "undefined" && !!self.$RefreshInterceptModuleExecution$;
/******/ 				const cleanup = hasRefresh ? self.$RefreshInterceptModuleExecution$(moduleObject.id) : () => {};
/******/ 				try {
/******/ 					originalFactory.call(this, moduleObject, moduleExports, webpackRequire);
/******/ 				} finally {
/******/ 					cleanup();
/******/ 				}
/******/ 			}
/******/ 		})
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	
/******/ 	// noop fns to prevent runtime errors during initialization
/******/ 	if (typeof self !== "undefined") {
/******/ 		self.$RefreshReg$ = function () {};
/******/ 		self.$RefreshSig$ = function () {
/******/ 			return function (type) {
/******/ 				return type;
/******/ 			};
/******/ 		};
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./worker/index.ts");
/******/ 	
/******/ })()
;