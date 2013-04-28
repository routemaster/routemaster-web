What are These "Shims"?
=======================

Most of the libaries we depend on don't support requirejs or the AMD spec.
RequireJS (as of version 2.1.0) can auto-generate "shim" modules for each of
these that re-wraps the global exports they create. We also continue to benefit
from RequireJS' dependency resolution.

Mustache already has support for requirejs/AMD built in, so it works flawlessly
as-is.

What Each Library Gives Us
==========================

-   **Almond**: A lightweight version of RequireJS for use with already
    optimized files. RequireJS itself has code in it for unoptimized codebases.
    This is a bit smaller.
-   **Backbone**: Provides the basic constructs needed in any MVC application
-   **Leaflet**: Probably our largest library. Handles the display of our maps
-   **Mustache**: Our templating system of choice. Simple and fast
-   **Underscore**: Needed by Backbone, also provides a lot of functional
    programming constructs, which are nice to use
-   **Zepto**: A light-weight clone of JQuery. Essentially JQuery without the IE
    stuff
-   **PlusOne**: Given as part of the Google+ API

