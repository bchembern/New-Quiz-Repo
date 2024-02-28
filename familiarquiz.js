// --------------------------------------
// 
//    _  _ _/ .  _  _/ /_ _  _  _        
//   /_|/_ / /|//_  / / //_ /_// /_/     
//   http://activetheory.net     _/      
// 
// --------------------------------------
//   10/11/16 11:21a
// --------------------------------------
window.Global = {};
window.getURL = function(url, target) {
    if (!target) {
        target = "_blank"
    }
    window.open(url, target)
};

if (typeof(console) === "undefined") {
    window.console = {};
    console.log = console.error = console.info = console.debug = console.warn = console.trace = function() {}
}
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
        return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
            window.setTimeout(callback, 1000 / 60)
        }
    })()
}
window.performance = (function() {
    if (window.performance && window.performance.now) {
        return window.performance
    } else {
        return Date
    }
})();
Date.now = Date.now || function() {
    return +new Date
};
window.Class = function(_class, _type) {
    var _this = this || window;
    var _string = _class.toString();
    var _name = _class.toString().match(/function ([^\(]+)/)[1];
    var _static = null;
    if (typeof _type === "function") {
        _static = _type;
        _type = null
    }
    _type = (_type || "").toLowerCase();
    _class.prototype.__call = function() {
        if (this.events) {
            this.events.scope(this)
        }
    };
    if (!_type) {
        _this[_name] = _class;
        _static && _static()
    } else {
        if (_type == "static") {
            _this[_name] = new _class()
        } else {
            if (_type == "singleton") {
                _this[_name] = (function() {
                    var __this = {};
                    var _instance;
                    __this.instance = function(a, b, c) {
                        if (!_instance) {
                            _instance = new _class(a, b, c)
                        }
                        return _instance
                    };
                    return __this
                })()
            }
        }
    }
    if (this !== window) {
        if (!this.__namespace) {
            this.__namespace = this.constructor.toString().match(/function ([^\(]+)/)[1]
        }
        this[_name]._namespace = this.__namespace
    }
};
window.Inherit = function(child, parent, param) {
    if (typeof param === "undefined") {
        param = child
    }
    var p = new parent(param, true);
    var save = {};
    for (var method in p) {
        child[method] = p[method];
        save[method] = p[method]
    }
    if (child.__call) {
        child.__call()
    }
    defer(function() {
        for (method in p) {
            if ((child[method] && save[method]) && child[method] !== save[method]) {
                child["_" + method] = save[method]
            }
        }
        p = save = null;
        child = parent = param = null
    })
};
window.Implement = function(cl, intr) {
    Render.nextFrame(function() {
        var intrface = new intr();
        for (var property in intrface) {
            if (typeof cl[property] === "undefined") {
                throw "Interface Error: Missing Property: " + property + " ::: " + intr
            } else {
                var type = typeof intrface[property];
                if (typeof cl[property] != type) {
                    throw "Interface Error: Property " + property + " is Incorrect Type ::: " + intr
                }
            }
        }
    })
};
window.Namespace = function(name) {
    if (typeof name === "string") {
        window[name] = {
            Class: window.Class
        }
    } else {
        name.Class = window.Class
    }
};
window.Interface = function(display) {
    var name = display.toString().match(/function ([^\(]+)/)[1];
    Hydra.INTERFACES[name] = display
};
window.THREAD = false;
Class(function HydraObject(_selector, _type, _exists, _useFragment) {
    this._children = new LinkedList();
    this.__useFragment = _useFragment;
    this._initSelector(_selector, _type, _exists)
}, function() {
    var prototype = HydraObject.prototype;
    prototype._initSelector = function(_selector, _type, _exists) {
        if (_selector && typeof _selector !== "string") {
            this.div = _selector
        } else {
            var first = _selector ? _selector.charAt(0) : null;
            var name = _selector ? _selector.slice(1) : null;
            if (first != "." && first != "#") {
                name = _selector;
                first = "."
            }
            if (!_exists) {
                this._type = _type || "div";
                if (this._type == "svg") {
                    this.div = document.createElementNS("http://www.w3.org/2000/svg", this._type);
                    this.div.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink")
                } else {
                    this.div = document.createElement(this._type);
                    if (first) {
                        if (first == "#") {
                            this.div.id = name
                        } else {
                            this.div.className = name
                        }
                    }
                }
            } else {
                if (first != "#") {
                    throw "Hydra Selectors Require #ID"
                }
                this.div = document.getElementById(name)
            }
        }
        this.div.hydraObject = this
    };
    prototype.addChild = prototype.add = function(child) {
        var div = this.div;
        var createFrag = function() {
            if (this.__useFragment) {
                if (!this._fragment) {
                    this._fragment = document.createDocumentFragment();
                    var _this = this;
                    defer(function() {
                        if (!_this._fragment || !_this.div) {
                            return _this._fragment = null
                        }
                        _this.div.appendChild(_this._fragment);
                        _this._fragment = null
                    })
                }
                div = this._fragment
            }
        };
        if (child.element && child.element instanceof HydraObject) {
            createFrag();
            div.appendChild(child.element.div);
            this._children.push(child.element);
            child.element._parent = this;
            child.element.div.parentNode = this.div
        } else {
            if (child.div) {
                createFrag();
                div.appendChild(child.div);
                this._children.push(child);
                child._parent = this;
                child.div.parentNode = this.div
            } else {
                if (child.nodeName) {
                    createFrag();
                    div.appendChild(child);
                    child.parentNode = this.div
                }
            }
        }
        return this
    };
    prototype.clone = function() {
        return $(this.div.cloneNode(true))
    };
    prototype.create = function(name, type) {
        var $obj = $(name, type);
        this.addChild($obj);
        if (this.__root) {
            this.__root.__append[name] = $obj;
            $obj.__root = this.__root
        }
        return $obj
    };
    prototype.empty = function() {
        var child = this._children.start();
        while (child) {
            if (child && child.remove) {
                child.remove()
            }
            child = this._children.next()
        }
        this.div.innerHTML = "";
        return this
    };
    prototype.parent = function() {
        return this._parent
    };
    prototype.children = function() {
        return this.div.children ? this.div.children : this.div.childNodes
    };
    prototype.append = function(callback, params) {
        if (!this.__root) {
            this.__root = this;
            this.__append = {}
        }
        return callback.apply(this, params)
    };
    prototype.removeChild = function(object, keep) {
        try {
            object.div.parentNode.removeChild(object.div)
        } catch (e) {}
        if (!keep) {
            this._children.remove(object)
        }
    };
    prototype.remove = prototype.destroy = function() {
        this.removed = true;
        var parent = this._parent;
        if (!!(parent && !parent.removed && parent.removeChild)) {
            parent.removeChild(this, true)
        }
        var child = this._children.start();
        while (child) {
            if (child && child.remove) {
                child.remove()
            }
            child = this._children.next()
        }
        this._children.destroy();
        this.div.hydraObject = null;
        Utils.nullObject(this)
    }
});
Class(function Hydra() {
    var _this = this;
    var _inter, _pool;
    var _readyCallbacks = [];
    this.READY = false;
    this.HASH = window.location.hash.slice(1);
    this.LOCAL = !window._BUILT_ && (location.hostname.indexOf("local") > -1 || location.hostname.split(".")[0] == "10" || location.hostname.split(".")[0] == "192");
    (function() {
        initLoad()
    })();

    function initLoad() {
        if (!document || !window) {
            return setTimeout(initLoad, 1)
        }
        if (window._NODE_ || window._GLES_) {
            _this.addEvent = "addEventListener";
            _this.removeEvent = "removeEventListener";
            return setTimeout(loaded, 1)
        }
        if (window.addEventListener) {
            _this.addEvent = "addEventListener";
            _this.removeEvent = "removeEventListener";
            window.addEventListener("load", loaded, false)
        } else {
            _this.addEvent = "attachEvent";
            _this.removeEvent = "detachEvent";
            window.attachEvent("onload", loaded)
        }
    }

    function loaded() {
        if (window.removeEventListener) {
            window.removeEventListener("load", loaded, false)
        }
        if (!_readyCallbacks) {
            return
        }
        for (var i = 0; i < _readyCallbacks.length; i++) {
            _readyCallbacks[i]()
        }
        _readyCallbacks = null;
        _this.READY = true;
        if (window.Main) {
            Hydra.Main = new window.Main()
        }
    }
    this.development = function(flag, array) {
        var matchArray = function(prop) {
            if (!array) {
                return false
            }
            for (var i = 0; i < array.length; i++) {
                if (prop.strpos(array[i])) {
                    return true
                }
            }
            return false
        };
        clearInterval(_inter);
        if (flag) {
            _inter = setInterval(function() {
                for (var prop in window) {
                    if (prop.strpos("webkit")) {
                        continue
                    }
                    var obj = window[prop];
                    if (typeof obj !== "function" && prop.length > 2) {
                        if (prop.strpos("_ga") || prop.strpos("_typeface_js") || matchArray(prop)) {
                            continue
                        }
                        var char1 = prop.charAt(0);
                        var char2 = prop.charAt(1);
                        if (char1 == "_" || char1 == "$") {
                            if (char2 !== char2.toUpperCase()) {
                                console.log(window[prop]);
                                throw "Hydra Warning:: " + prop + " leaking into global scope"
                            }
                        }
                    }
                }
            }, 1000)
        }
    };
    this.getArguments = function(value) {
        var saved = this.arguments;
        var args = [];
        for (var i = 1; i < saved.length; i++) {
            if (saved[i] !== null) {
                args.push(saved[i])
            }
        }
        return args
    };
    this.getClassName = function(obj) {
        return obj.constructor.name || obj.constructor.toString().match(/function ([^\(]+)/)[1]
    };
    this.ready = function(callback) {
        if (this.READY) {
            return callback()
        }
        _readyCallbacks.push(callback)
    };
    this.$ = function(selector, type, exists) {
        return new HydraObject(selector, type, exists)
    };
    this.__triggerReady = function() {
        loaded()
    };
    this.setPageOffset = function(x, y) {
        _this.__offset = {
            x: x,
            y: y
        };
        Stage.css({
            left: x,
            top: y,
            width: Stage.width - x,
            height: Stage.height - y
        })
    };
    this.INTERFACES = {};
    this.HTML = {};
    this.JSON = {};
    this.SVG = {};
    this.$.fn = HydraObject.prototype;
    window.$ = this.$;
    window.ready = this.ready
}, "Static");
Hydra.ready(function() {
    window.__window = $(window);
    window.__document = $(document);
    window.__body = $(document.getElementsByTagName("body")[0]);
    window.Stage = window.Stage ? $(window.Stage) : __body.create("#Stage");
    Stage.size("100%");
    Stage.__useFragment = true;
    Stage.width = document.body.clientWidth || document.documentElement.offsetWidth || window.innerWidth;
    Stage.height = document.body.clientHeight || document.documentElement.offsetHeight || window.innerHeight;
    (function() {
        var _time = Date.now();
        var _last;
        setTimeout(function() {
            var list = ["hidden", "msHidden", "webkitHidden"];
            var hidden, eventName;
            (function() {
                for (var key in list) {
                    if (document[list[key]] !== "undefined") {
                        hidden = list[key];
                        switch (hidden) {
                            case "hidden":
                                eventName = "visibilitychange";
                                break;
                            case "msHidden":
                                eventName = "msvisibilitychange";
                                break;
                            case "webkitHidden":
                                eventName = "webkitvisibilitychange";
                                break
                        }
                        return
                    }
                }
            })();
            if (typeof document[hidden] === "undefined") {
                if (Device.browser.ie) {
                    document.onfocus = onfocus;
                    document.onblur = onblur
                } else {
                    window.onfocus = onfocus;
                    window.onblur = onblur
                }
            } else {
                document.addEventListener(eventName, function() {
                    var time = Date.now();
                    if (time - _time > 10) {
                        if (document[hidden] === false) {
                            onfocus()
                        } else {
                            onblur()
                        }
                    }
                    _time = time
                })
            }
        }, 250);

        function onfocus() {
            if (_last != "focus") {
                HydraEvents._fireEvent(HydraEvents.BROWSER_FOCUS, {
                    type: "focus"
                })
            }
            _last = "focus"
        }

        function onblur() {
            if (_last != "blur") {
                HydraEvents._fireEvent(HydraEvents.BROWSER_FOCUS, {
                    type: "blur"
                })
            }
            _last = "blur"
        }
    })();
    window.onresize = function() {
        if (!Device.mobile) {
            Stage.width = document.body.clientWidth || document.documentElement.offsetWidth || window.innerWidth;
            Stage.height = document.body.clientHeight || document.documentElement.offsetHeight || window.innerHeight;
            if (Hydra.__offset) {
                Stage.width -= Hydra.__offset.x;
                Stage.height -= Hydra.__offset.y;
                Stage.css({
                    width: Stage.width,
                    height: Stage.height
                })
            }
            HydraEvents._fireEvent(HydraEvents.RESIZE)
        }
    }
});
(function() {
    $.fn.text = function(text) {
        if (typeof text !== "undefined") {
            if (this.__cacheText != text) {
                this.div.textContent = text
            }
            this.__cacheText = text;
            return this
        } else {
            return this.div.textContent
        }
    };
    $.fn.html = function(text, force) {
        if (text && !text.strpos("<") && !force) {
            return this.text(text)
        }
        if (typeof text !== "undefined") {
            this.div.innerHTML = text;
            return this
        } else {
            return this.div.innerHTML
        }
    };
    $.fn.hide = function() {
        this.div.style.display = "none";
        return this
    };
    $.fn.show = function() {
        this.div.style.display = "";
        return this
    };
    $.fn.visible = function() {
        this.div.style.visibility = "visible";
        return this
    };
    $.fn.invisible = function() {
        this.div.style.visibility = "hidden";
        return this
    };
    $.fn.setZ = function(z) {
        this.div.style.zIndex = z;
        return this
    };
    $.fn.clearAlpha = function() {
        this.div.style.opacity = "";
        return this
    };
    $.fn.size = function(w, h, noScale) {
        if (typeof w === "string") {
            if (typeof h === "undefined") {
                h = "100%"
            } else {
                if (typeof h !== "string") {
                    h = h + "px"
                }
            }
            this.div.style.width = w;
            this.div.style.height = h
        } else {
            this.div.style.width = w + "px";
            this.div.style.height = h + "px";
            if (!noScale) {
                this.div.style.backgroundSize = w + "px " + h + "px"
            }
        }
        this.width = w;
        this.height = h;
        return this
    };
    $.fn.mouseEnabled = function(bool) {
        this.div.style.pointerEvents = bool ? "auto" : "none";
        return this
    };
    $.fn.fontStyle = function(family, size, color, style) {
        var font = {};
        if (family) {
            font.fontFamily = family
        }
        if (size) {
            font.fontSize = size
        }
        if (color) {
            font.color = color
        }
        if (style) {
            font.fontStyle = style
        }
        this.css(font);
        return this
    };
    $.fn.bg = function(src, x, y, repeat) {
        if (!src) {
            return this
        }
        if (src.strpos(".")) {
            src = Images.getPath(src)
        }
        if (!src.strpos(".")) {
            this.div.style.backgroundColor = src
        } else {
            this.div.style.backgroundImage = "url(" + src + ")"
        }
        if (typeof x !== "undefined") {
            x = typeof x == "number" ? x + "px" : x;
            y = typeof y == "number" ? y + "px" : y;
            this.div.style.backgroundPosition = x + " " + y
        }
        if (repeat) {
            this.div.style.backgroundSize = "";
            this.div.style.backgroundRepeat = repeat
        }
        if (x == "cover" || x == "contain") {
            this.div.style.backgroundSize = x;
            this.div.style.backgroundPosition = typeof y != "undefined" ? y + " " + repeat : "center"
        }
        return this
    };
    $.fn.center = function(x, y, noPos) {
        var css = {};
        if (typeof x === "undefined") {
            css.left = "50%";
            css.top = "50%";
            css.marginLeft = -this.width / 2;
            css.marginTop = -this.height / 2
        } else {
            if (x) {
                css.left = "50%";
                css.marginLeft = -this.width / 2
            }
            if (y) {
                css.top = "50%";
                css.marginTop = -this.height / 2
            }
        }
        if (noPos) {
            delete css.left;
            delete css.top
        }
        this.css(css);
        return this
    };
    $.fn.mask = function(arg, x, y, w, h) {
        this.div.style[CSS.prefix("Mask")] = (arg.strpos(".") ? "url(" + arg + ")" : arg) + " no-repeat";
        this.div.style[CSS.prefix("MaskSize")] = "contain";
        return this
    };
    $.fn.blendMode = function(mode, bg) {
        if (bg) {
            this.div.style["background-blend-mode"] = mode
        } else {
            this.div.style["mix-blend-mode"] = mode
        }
        return this
    };
    $.fn.css = function(obj, value) {
        if (typeof value == "boolean") {
            skip = value;
            value = null
        }
        if (typeof obj !== "object") {
            if (!value) {
                var style = this.div.style[obj];
                if (typeof style !== "number") {
                    if (style.strpos("px")) {
                        style = Number(style.slice(0, -2))
                    }
                    if (obj == "opacity") {
                        style = !isNaN(Number(this.div.style.opacity)) ? Number(this.div.style.opacity) : 1
                    }
                }
                if (!style) {
                    style = 0
                }
                return style
            } else {
                this.div.style[obj] = value;
                return this
            }
        }
        TweenManager.clearCSSTween(this);
        for (var type in obj) {
            var val = obj[type];
            if (!(typeof val === "string" || typeof val === "number")) {
                continue
            }
            if (typeof val !== "string" && type != "opacity" && type != "zIndex") {
                val += "px"
            }
            this.div.style[type] = val
        }
        return this
    };
    $.fn.transform = function(props) {
        if (this.multiTween && this.cssTweens && this._cssTweens.length > 1 && this.__transformTime && Render.TIME - this.__transformTime < 15) {
            return
        }
        this.__transformTime = Render.TIME;
        TweenManager.clearCSSTween(this);
        if (Device.tween.css2d) {
            if (!props) {
                props = this
            } else {
                for (var key in props) {
                    if (typeof props[key] === "number") {
                        this[key] = props[key]
                    }
                }
            }
            var transformString;
            if (!this._matrix) {
                transformString = TweenManager.parseTransform(props)
            } else {
                if (this._matrix.type == "matrix2") {
                    this._matrix.setTRS(this.x, this.y, this.rotation, this.scaleX || this.scale, this.scaleY || this.scale)
                } else {
                    this._matrix.setTRS(this.x, this.y, this.z, this.rotationX, this.rotationY, this.rotationZ, this.scaleX || this.scale, this.scaleY || this.scale, this.scaleZ || this.scale)
                }
                transformString = this._matrix.getCSS()
            }
            if (this.__transformCache != transformString) {
                this.div.style[Device.styles.vendorTransform] = transformString;
                this.__transformCache = transformString
            }
        }
        return this
    };
    $.fn.useMatrix3D = function() {
        this._matrix = new Matrix4();
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
        this.scale = 1;
        return this
    };
    $.fn.useMatrix2D = function() {
        this._matrix = new Matrix2();
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.scale = 1;
        return this
    };
    $.fn.willChange = function(props) {
        if (typeof props === "boolean") {
            if (props === true) {
                this._willChangeLock = true
            } else {
                this._willChangeLock = false
            }
        } else {
            if (this._willChangeLock) {
                return
            }
        }
        var string = typeof props === "string";
        if ((!this._willChange || string) && typeof props !== "null") {
            this._willChange = true;
            this.div.style["will-change"] = string ? props : Device.transformProperty + ", opacity"
        } else {
            this._willChange = false;
            this.div.style["will-change"] = ""
        }
    };
    $.fn.backfaceVisibility = function(visible) {
        if (visible) {
            this.div.style[CSS.prefix("BackfaceVisibility")] = "visible"
        } else {
            this.div.style[CSS.prefix("BackfaceVisibility")] = "hidden"
        }
    };
    $.fn.enable3D = function(perspective, x, y) {
        this.div.style[CSS.prefix("TransformStyle")] = "preserve-3d";
        if (perspective) {
            this.div.style[CSS.prefix("Perspective")] = perspective + "px"
        }
        if (typeof x !== "undefined") {
            x = typeof x === "number" ? x + "px" : x;
            y = typeof y === "number" ? y + "px" : y;
            this.div.style[CSS.prefix("PerspectiveOrigin")] = x + " " + y
        }
        return this
    };
    $.fn.disable3D = function() {
        this.div.style[CSS.prefix("TransformStyle")] = "";
        this.div.style[CSS.prefix("Perspective")] = "";
        return this
    };
    $.fn.transformPoint = function(x, y, z) {
        var origin = "";
        if (typeof x !== "undefined") {
            origin += (typeof x === "number" ? x + "px " : x + " ")
        }
        if (typeof y !== "undefined") {
            origin += (typeof y === "number" ? y + "px " : y + " ")
        }
        if (typeof z !== "undefined") {
            origin += (typeof z === "number" ? z + "px" : z)
        }
        this.div.style[CSS.prefix("TransformOrigin")] = origin;
        return this
    };
    $.fn.tween = function(props, time, ease, delay, callback, manual) {
        if (typeof delay === "boolean") {
            manual = delay;
            delay = 0;
            callback = null
        } else {
            if (typeof delay === "function") {
                callback = delay;
                delay = 0
            }
        }
        if (typeof callback === "boolean") {
            manual = callback;
            callback = null
        }
        if (!delay) {
            delay = 0
        }
        return TweenManager._detectTween(this, props, time, ease, delay, callback, manual)
    };
    $.fn.clearTransform = function() {
        if (typeof this.x === "number") {
            this.x = 0
        }
        if (typeof this.y === "number") {
            this.y = 0
        }
        if (typeof this.z === "number") {
            this.z = 0
        }
        if (typeof this.scale === "number") {
            this.scale = 1
        }
        if (typeof this.scaleX === "number") {
            this.scaleX = 1
        }
        if (typeof this.scaleY === "number") {
            this.scaleY = 1
        }
        if (typeof this.rotation === "number") {
            this.rotation = 0
        }
        if (typeof this.rotationX === "number") {
            this.rotationX = 0
        }
        if (typeof this.rotationY === "number") {
            this.rotationY = 0
        }
        if (typeof this.rotationZ === "number") {
            this.rotationZ = 0
        }
        if (typeof this.skewX === "number") {
            this.skewX = 0
        }
        if (typeof this.skewY === "number") {
            this.skewY = 0
        }
        this.div.style[Device.styles.vendorTransform] = "";
        return this
    };
    $.fn.stopTween = function() {
        if (this._cssTween) {
            this._cssTween.stop()
        }
        if (this._mathTween) {
            this._mathTween.stop()
        }
        return this
    };
    $.fn.keypress = function(callback) {
        this.div.onkeypress = function(e) {
            e = e || window.event;
            e.code = e.keyCode ? e.keyCode : e.charCode;
            if (callback) {
                callback(e)
            }
        }
    };
    $.fn.keydown = function(callback) {
        this.div.onkeydown = function(e) {
            e = e || window.event;
            e.code = e.keyCode;
            if (callback) {
                callback(e)
            }
        }
    };
    $.fn.keyup = function(callback) {
        this.div.onkeyup = function(e) {
            e = e || window.event;
            e.code = e.keyCode;
            if (callback) {
                callback(e)
            }
        }
    };
    $.fn.attr = function(attr, value) {
        if (attr && value) {
            if (value == "") {
                this.div.removeAttribute(attr)
            } else {
                this.div.setAttribute(attr, value)
            }
        } else {
            if (attr) {
                return this.div.getAttribute(attr)
            }
        }
        return this
    };
    $.fn.val = function(value) {
        if (typeof value === "undefined") {
            return this.div.value
        } else {
            this.div.value = value
        }
        return this
    };
    $.fn.change = function(callback) {
        var _this = this;
        if (this._type == "select") {
            this.div.onchange = function() {
                callback({
                    object: _this,
                    value: _this.div.value || ""
                })
            }
        }
    };
    $.fn.svgSymbol = function(id, width, height) {
        var config = SVG.getSymbolConfig(id);
        var svgHTML = '<svg viewBox="0 0 ' + config.width + " " + config.height + '" width="' + width + '" height="' + height + '"><use xlink:href="#' + config.id + '" x="0" y="0" /></svg>';
        this.html(svgHTML, true)
    }
})();
(function() {
    var windowsPointer = !!window.MSGesture;
    var translateEvent = function(evt) {
        if (Hydra.addEvent == "attachEvent") {
            switch (evt) {
                case "click":
                    return "onclick";
                    break;
                case "mouseover":
                    return "onmouseover";
                    break;
                case "mouseout":
                    return "onmouseleave";
                    break;
                case "mousedown":
                    return "onmousedown";
                    break;
                case "mouseup":
                    return "onmouseup";
                    break;
                case "mousemove":
                    return "onmousemove";
                    break
            }
        }
        if (windowsPointer) {
            switch (evt) {
                case "touchstart":
                    return "pointerdown";
                    break;
                case "touchmove":
                    return "MSGestureChange";
                    break;
                case "touchend":
                    return "pointerup";
                    break
            }
        }
        return evt
    };
    $.fn.click = function(callback) {
        var _this = this;

        function click(e) {
            if (!_this.div) {
                return false
            }
            if (Mouse._preventClicks) {
                return false
            }
            e.object = _this.div.className == "hit" ? _this.parent() : _this;
            e.action = "click";
            if (!e.pageX) {
                e.pageX = e.clientX;
                e.pageY = e.clientY
            }
            if (callback) {
                callback(e)
            }
            if (Mouse.autoPreventClicks) {
                Mouse.preventClicks()
            }
        }
        this.div[Hydra.addEvent](translateEvent("click"), click, true);
        this.div.style.cursor = "pointer";
        return this
    };
    $.fn.hover = function(callback) {
        var _this = this;
        var _over = false;
        var _time;

        function hover(e) {
            if (!_this.div) {
                return false
            }
            var time = Date.now();
            var original = e.toElement || e.relatedTarget;
            if (_time && (time - _time) < 5) {
                _time = time;
                return false
            }
            _time = time;
            e.object = _this.div.className == "hit" ? _this.parent() : _this;
            switch (e.type) {
                case "mouseout":
                    e.action = "out";
                    break;
                case "mouseleave":
                    e.action = "out";
                    break;
                default:
                    e.action = "over";
                    break
            }
            if (_over) {
                if (Mouse._preventClicks) {
                    return false
                }
                if (e.action == "over") {
                    return false
                }
                if (e.action == "out") {
                    if (isAChild(_this.div, original)) {
                        return false
                    }
                }
                _over = false
            } else {
                if (e.action == "out") {
                    return false
                }
                _over = true
            }
            if (!e.pageX) {
                e.pageX = e.clientX;
                e.pageY = e.clientY
            }
            if (callback) {
                callback(e)
            }
        }

        function isAChild(div, object) {
            var len = div.children.length - 1;
            for (var i = len; i > -1; i--) {
                if (object == div.children[i]) {
                    return true
                }
            }
            for (i = len; i > -1; i--) {
                if (isAChild(div.children[i], object)) {
                    return true
                }
            }
        }
        this.div[Hydra.addEvent](translateEvent("mouseover"), hover, true);
        this.div[Hydra.addEvent](translateEvent("mouseout"), hover, true);
        return this
    };
    $.fn.press = function(callback) {
        var _this = this;

        function press(e) {
            if (!_this.div) {
                return false
            }
            e.object = _this.div.className == "hit" ? _this.parent() : _this;
            switch (e.type) {
                case "mousedown":
                    e.action = "down";
                    break;
                default:
                    e.action = "up";
                    break
            }
            if (!e.pageX) {
                e.pageX = e.clientX;
                e.pageY = e.clientY
            }
            if (callback) {
                callback(e)
            }
        }
        this.div[Hydra.addEvent](translateEvent("mousedown"), press, true);
        this.div[Hydra.addEvent](translateEvent("mouseup"), press, true);
        return this
    };
    $.fn.bind = function(evt, callback) {
        if (!this._events) {
            this._events = {}
        }
        if (windowsPointer && this == __window) {
            return Stage.bind(evt, callback)
        }
        if (evt == "touchstart") {
            if (!Device.mobile) {
                evt = "mousedown"
            }
        } else {
            if (evt == "touchmove") {
                if (!Device.mobile) {
                    evt = "mousemove"
                }
                if (windowsPointer && !this.div.msGesture) {
                    this.div.msGesture = new MSGesture();
                    this.div.msGesture.target = this.div
                }
            } else {
                if (evt == "touchend") {
                    if (!Device.mobile) {
                        evt = "mouseup"
                    }
                }
            }
        }
        this._events["bind_" + evt] = this._events["bind_" + evt] || [];
        var _events = this._events["bind_" + evt];
        var e = {};
        var target = this.div;
        e.callback = callback;
        e.target = this.div;
        _events.push(e);

        function touchEvent(e) {
            if (windowsPointer && target.msGesture && evt == "touchstart") {
                target.msGesture.addPointer(e.pointerId)
            }
            var touch = Utils.touchEvent(e);
            if (windowsPointer) {
                var windowsEvt = e;
                e = {};
                e.x = Number(windowsEvt.pageX || windowsEvt.clientX);
                e.y = Number(windowsEvt.pageY || windowsEvt.clientY);
                e.target = windowsEvt.target;
                e.currentTarget = windowsEvt.currentTarget;
                e.path = [];
                var node = e.target;
                while (node) {
                    e.path.push(node);
                    node = node.parentElement || null
                }
                e.windowsPointer = true
            } else {
                e.x = touch.x;
                e.y = touch.y
            }
            for (var i = 0; i < _events.length; i++) {
                var ev = _events[i];
                if (ev.target == e.currentTarget) {
                    ev.callback(e)
                }
            }
        }
        if (!this._events["fn_" + evt]) {
            this._events["fn_" + evt] = touchEvent;
            this.div[Hydra.addEvent](translateEvent(evt), touchEvent, true)
        }
        return this
    };
    $.fn.unbind = function(evt, callback) {
        if (!this._events) {
            this._events = {}
        }
        if (windowsPointer && this == __window) {
            return Stage.unbind(evt, callback)
        }
        if (evt == "touchstart") {
            if (!Device.mobile) {
                evt = "mousedown"
            }
        } else {
            if (evt == "touchmove") {
                if (!Device.mobile) {
                    evt = "mousemove"
                }
            } else {
                if (evt == "touchend") {
                    if (!Device.mobile) {
                        evt = "mouseup"
                    }
                }
            }
        }
        var _events = this._events["bind_" + evt];
        if (!_events) {
            return this
        }
        for (var i = 0; i < _events.length; i++) {
            var ev = _events[i];
            if (ev.callback == callback) {
                _events.splice(i, 1)
            }
        }
        if (this._events["fn_" + evt] && !_events.length) {
            this.div[Hydra.removeEvent](translateEvent(evt), this._events["fn_" + evt], true);
            this._events["fn_" + evt] = null
        }
        return this
    };
    $.fn.interact = function(overCallback, clickCallback) {
        if (!this.hit) {
            this.hit = $(".hit");
            this.hit.css({
                width: "100%",
                height: "100%",
                zIndex: 99999,
                top: 0,
                left: 0,
                position: "absolute"
            });
            this.addChild(this.hit)
        }
        if (!Device.mobile) {
            this.hit.hover(overCallback).click(clickCallback)
        } else {
            this.hit.touchClick(overCallback, clickCallback)
        }
    };
    $.fn.touchSwipe = function(callback, distance) {
        if (!window.addEventListener) {
            return this
        }
        var _this = this;
        var _distance = distance || 75;
        var _startX, _startY;
        var _moving = false;
        var _move = {};
        if (Device.mobile) {
            this.div.addEventListener(translateEvent("touchstart"), touchStart);
            this.div.addEventListener(translateEvent("touchend"), touchEnd);
            this.div.addEventListener(translateEvent("touchcancel"), touchEnd)
        }

        function touchStart(e) {
            var touch = Utils.touchEvent(e);
            if (!_this.div) {
                return false
            }
            if (e.touches.length == 1) {
                _startX = touch.x;
                _startY = touch.y;
                _moving = true;
                _this.div.addEventListener(translateEvent("touchmove"), touchMove)
            }
        }

        function touchMove(e) {
            if (!_this.div) {
                return false
            }
            if (_moving) {
                var touch = Utils.touchEvent(e);
                var dx = _startX - touch.x;
                var dy = _startY - touch.y;
                _move.direction = null;
                _move.moving = null;
                _move.x = null;
                _move.y = null;
                _move.evt = e;
                if (Math.abs(dx) >= _distance) {
                    touchEnd();
                    if (dx > 0) {
                        _move.direction = "left"
                    } else {
                        _move.direction = "right"
                    }
                } else {
                    if (Math.abs(dy) >= _distance) {
                        touchEnd();
                        if (dy > 0) {
                            _move.direction = "up"
                        } else {
                            _move.direction = "down"
                        }
                    } else {
                        _move.moving = true;
                        _move.x = dx;
                        _move.y = dy
                    }
                }
                if (callback) {
                    callback(_move, e)
                }
            }
        }

        function touchEnd(e) {
            if (!_this.div) {
                return false
            }
            _startX = _startY = _moving = false;
            _this.div.removeEventListener(translateEvent("touchmove"), touchMove)
        }
        return this
    };
    $.fn.touchClick = function(hover, click) {
        if (!window.addEventListener) {
            return this
        }
        var _this = this;
        var _time, _move;
        var _start = {};
        var _touch = {};
        if (Device.mobile) {
            this.div.addEventListener(translateEvent("touchmove"), touchMove, false);
            this.div.addEventListener(translateEvent("touchstart"), touchStart, false);
            this.div.addEventListener(translateEvent("touchend"), touchEnd, false)
        }

        function touchMove(e) {
            if (!_this.div) {
                return false
            }
            _touch = Utils.touchEvent(e);
            if (Utils.findDistance(_start, _touch) > 5) {
                _move = true
            } else {
                _move = false
            }
        }

        function setTouch(e) {
            var touch = Utils.touchEvent(e);
            e.touchX = touch.x;
            e.touchY = touch.y;
            _start.x = e.touchX;
            _start.y = e.touchY
        }

        function touchStart(e) {
            if (!_this.div) {
                return false
            }
            _time = Date.now();
            e.action = "over";
            e.object = _this.div.className == "hit" ? _this.parent() : _this;
            setTouch(e);
            if (hover && !_move) {
                hover(e)
            }
        }

        function touchEnd(e) {
            if (!_this.div) {
                return false
            }
            var time = Date.now();
            var clicked = false;
            e.object = _this.div.className == "hit" ? _this.parent() : _this;
            setTouch(e);
            if (_time && time - _time < 750) {
                if (Mouse._preventClicks) {
                    return false
                }
                if (click && !_move) {
                    clicked = true;
                    e.action = "click";
                    if (click && !_move) {
                        click(e)
                    }
                    if (Mouse.autoPreventClicks) {
                        Mouse.preventClicks()
                    }
                }
            }
            if (hover) {
                e.action = "out";
                if (!Mouse._preventFire) {
                    hover(e)
                }
            }
            _move = false
        }
        return this
    }
})();
Class(function MVC() {
    Inherit(this, Events);
    var _setters = {};
    var _active = {};
    var _timers = [];
    this.classes = {};

    function defineSetter(_this, prop) {
        _setters[prop] = {};
        Object.defineProperty(_this, prop, {
            set: function(v) {
                if (_setters[prop] && _setters[prop].s) {
                    _setters[prop].s.call(_this, v)
                }
                v = null
            },
            get: function() {
                if (_setters[prop] && _setters[prop].g) {
                    return _setters[prop].g.apply(_this)
                }
            }
        })
    }
    this.set = function(prop, callback) {
        if (!_setters[prop]) {
            defineSetter(this, prop)
        }
        _setters[prop].s = callback
    };
    this.get = function(prop, callback) {
        if (!_setters[prop]) {
            defineSetter(this, prop)
        }
        _setters[prop].g = callback
    };
    this.delayedCall = function(callback, time, params) {
        var _this = this;
        var timer = Timer.create(function() {
            if (_this.destroy) {
                callback && callback(params)
            }
            _this = callback = null
        }, time || 0);
        _timers.push(timer);
        if (_timers.length > 20) {
            _timers.shift()
        }
        return timer
    };
    this.initClass = function(clss, a, b, c, d, e, f, g) {
        var name = Utils.timestamp();
        if (window.Hydra) {
            Hydra.arguments = arguments
        }
        var child = new clss(a, b, c, d, e, f, g);
        if (window.Hydra) {
            Hydra.arguments = null
        }
        child.parent = this;
        if (child.destroy) {
            this.classes[name] = child;
            this.classes[name].__id = name
        }
        var lastArg = arguments[arguments.length - 1];
        if (Array.isArray(lastArg) && lastArg.length == 1 && lastArg[0] instanceof HydraObject) {
            lastArg[0].addChild(child)
        } else {
            if (this.element && lastArg !== null) {
                this.element.addChild(child)
            }
        }
        return child
    };
    this.destroy = function() {
        if (this.onDestroy) {
            this.onDestroy()
        }
        for (var i in this.classes) {
            var clss = this.classes[i];
            if (clss && clss.destroy) {
                clss.destroy()
            }
        }
        this.clearTimers && this.clearTimers();
        this.classes = null;
        if (this.events) {
            this.events = this.events.destroy()
        }
        if (this.element && this.element.remove) {
            this.element = this.container = this.element.remove()
        }
        if (this.parent && this.parent.__destroyChild) {
            this.parent.__destroyChild(this.__id)
        }
        return Utils.nullObject(this)
    };
    this.clearTimers = function() {
        for (i = 0; i < _timers.length; i++) {
            clearTimeout(_timers[i])
        }
        _timers.length = 0
    };
    this.active = function(name, value, time) {
        if (typeof value !== "undefined") {
            _active[name] = value;
            if (time) {
                this.delayedCall(function() {
                    _active[name] = !_active[name]
                }, time)
            }
        } else {
            return _active[name]
        }
    };
    this.__destroyChild = function(name) {
        delete this.classes[name]
    }
});
Class(function Model(name) {
    Inherit(this, MVC);
    var _storage = {};
    var _data = 0;
    var _triggered = 0;
    var _callbacks;
    this.push = function(name, val) {
        _storage[name] = val
    };
    this.pull = function(name) {
        return _storage[name]
    };
    this.registerData = function() {
        _data++
    };
    this.triggerData = function() {
        _triggered++;
        if (_triggered == _data) {
            _callbacks && _callbacks.forEach(function(c) {
                c()
            });
            _callbacks = null
        }
    };
    this.onReady = function(callback) {
        if (_callbacks === null) {
            return callback()
        }
        if (!_callbacks) {
            _callbacks = []
        }
        _callbacks.push(callback)
    };
    this.initWithData = function(data) {
        this.STATIC_DATA = data;
        for (var key in this) {
            var model = this[key];
            var init = false;
            for (var i in data) {
                if (i.toLowerCase().replace(/-/g, "") == key.toLowerCase()) {
                    init = true;
                    if (model.init) {
                        model.init(data[i])
                    }
                }
            }
            if (!init && model.init) {
                model.init()
            }
        }
    };
    this.loadData = function(url, callback) {
        var _this = this;
        XHR.get(url + "?" + Utils.timestamp(), function(d) {
            defer(function() {
                _this.initWithData(d);
                callback(d)
            })
        })
    };
    this.Class = function(model) {
        var name = model.toString().match(/function ([^\(]+)/)[1];
        this[name] = new model()
    }
});
Class(function View(_child) {
    Inherit(this, MVC);
    var _resize;
    var name = Hydra.getClassName(_child);
    this.element = $("." + name);
    this.element.__useFragment = true;
    this.css = function(obj) {
        this.element.css(obj);
        return this
    };
    this.transform = function(obj) {
        this.element.transform(obj || this);
        return this
    };
    this.tween = function(props, time, ease, delay, callback, manual) {
        return this.element.tween(props, time, ease, delay, callback, manual)
    };
    var inter = Hydra.INTERFACES[name] || Hydra.INTERFACES[name + "UI"];
    if (inter) {
        this.ui = {};
        var params = Hydra.getArguments();
        params.push(_child);
        _resize = this.element.append(inter, params);
        var append = this.element.__append;
        for (var key in append) {
            this.ui[key] = append[key]
        }
        if (_resize) {
            this.resize = function() {
                _resize.apply(this.ui, arguments)
            }
        }
    }
    this.__call = function() {
        this.events.scope(this)
    }
});
Class(function Controller(name) {
    Inherit(this, MVC);
    name = Hydra.getClassName(name);
    this.element = this.container = $("#" + name);
    this.element.__useFragment = true;
    this.css = function(obj) {
        this.container.css(obj)
    }
});
Class(function Component() {
    Inherit(this, MVC);
    this.__call = function() {
        this.events.scope(this);
        delete this.__call
    }
});
Class(function Utils() {
    var _this = this;
    if (typeof Float32Array == "undefined") {
        Float32Array = Array
    }

    function rand(min, max) {
        return lerp(Math.random(), min, max)
    }

    function lerp(ratio, start, end) {
        return start + (end - start) * ratio
    }
    this.doRandom = function(min, max, precision) {
        if (typeof precision == "number") {
            var p = Math.pow(10, precision);
            return Math.round(rand(min, max) * p) / p
        } else {
            return Math.round(rand(min - 0.5, max + 0.5))
        }
    };
    this.headsTails = function(heads, tails) {
        return !_this.doRandom(0, 1) ? heads : tails
    };
    this.toDegrees = function(rad) {
        return rad * (180 / Math.PI)
    };
    this.toRadians = function(deg) {
        return deg * (Math.PI / 180)
    };
    this.findDistance = function(p1, p2) {
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy)
    };
    this.timestamp = function() {
        var num = Date.now() + _this.doRandom(0, 99999);
        return num.toString()
    };
    this.hitTestObject = function(obj1, obj2) {
        var x1 = obj1.x,
            y1 = obj1.y,
            w = obj1.width,
            h = obj1.height;
        var xp1 = obj2.x,
            yp1 = obj2.y,
            wp = obj2.width,
            hp = obj2.height;
        var x2 = x1 + w,
            y2 = y1 + h,
            xp2 = xp1 + wp,
            yp2 = yp1 + hp;
        if (xp1 >= x1 && xp1 <= x2) {
            if (yp1 >= y1 && yp1 <= y2) {
                return true
            } else {
                if (y1 >= yp1 && y1 <= yp2) {
                    return true
                }
            }
        } else {
            if (x1 >= xp1 && x1 <= xp2) {
                if (yp1 >= y1 && yp1 <= y2) {
                    return true
                } else {
                    if (y1 >= yp1 && y1 <= yp2) {
                        return true
                    }
                }
            }
        }
        return false
    };
    this.randomColor = function() {
        var color = "#" + Math.floor(Math.random() * 16777215).toString(16);
        if (color.length < 7) {
            color = this.randomColor()
        }
        return color
    };
    this.touchEvent = function(e) {
        var touchEvent = {};
        touchEvent.x = 0;
        touchEvent.y = 0;
        if (e.windowsPointer) {
            return e
        }
        if (!e) {
            return touchEvent
        }
        if (Device.mobile && (e.touches || e.changedTouches)) {
            if (e.touches.length) {
                touchEvent.x = e.touches[0].pageX;
                touchEvent.y = e.touches[0].pageY - Mobile.scrollTop
            } else {
                touchEvent.x = e.changedTouches[0].pageX;
                touchEvent.y = e.changedTouches[0].pageY - Mobile.scrollTop
            }
        } else {
            touchEvent.x = e.pageX;
            touchEvent.y = e.pageY
        }
        if (Mobile.orientationSet && Mobile.orientation !== Mobile.orientationSet) {
            if (window.orientation == 90 || window.orientation === 0) {
                var x = touchEvent.y;
                touchEvent.y = touchEvent.x;
                touchEvent.x = Stage.width - x
            }
            if (window.orientation == -90 || window.orientation === 180) {
                var y = touchEvent.x;
                touchEvent.x = touchEvent.y;
                touchEvent.y = Stage.height - y
            }
        }
        return touchEvent
    };
    this.clamp = function(num, min, max) {
        return Math.min(Math.max(num, min), max)
    };
    this.constrain = function(num, min, max) {
        return Math.min(Math.max(num, Math.min(min, max)), Math.max(min, max))
    };
    this.nullObject = function(object) {
        if (object.destroy || object.div) {
            for (var key in object) {
                if (typeof object[key] !== "undefined") {
                    object[key] = null
                }
            }
        }
        return null
    };
    this.convertRange = this.range = function(oldValue, oldMin, oldMax, newMin, newMax, clamped) {
        var oldRange = (oldMax - oldMin);
        var newRange = (newMax - newMin);
        var newValue = (((oldValue - oldMin) * newRange) / oldRange) + newMin;
        if (clamped) {
            return _this.clamp(newValue, Math.min(newMin, newMax), Math.max(newMin, newMax))
        }
        return newValue
    };
    this.cloneObject = function(obj) {
        return JSON.parse(JSON.stringify(obj))
    };
    this.mergeObject = function() {
        var obj = {};
        for (var i = 0; i < arguments.length; i++) {
            var o = arguments[i];
            for (var key in o) {
                obj[key] = o[key]
            }
        }
        return obj
    };
    this.mix = function(from, to, alpha) {
        return from * (1 - alpha) + to * alpha
    };
    this.numberWithCommas = function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    };
    this.query = function(key) {
        return decodeURI(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURI(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"))
    };
    this.smoothstep = function(min, max, value) {
        var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return x * x * (3 - 2 * x)
    };
    String.prototype.strpos = function(str) {
        if (Array.isArray(str)) {
            for (var i = 0; i < str.length; i++) {
                if (this.indexOf(str[i]) > -1) {
                    return true
                }
            }
            return false
        } else {
            return this.indexOf(str) != -1
        }
    };
    String.prototype.clip = function(num, end) {
        return this.length > num ? this.slice(0, num) + end : this
    };
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1)
    };
    Array.prototype.findAndRemove = function(reference) {
        if (!this.indexOf) {
            return
        }
        var index = this.indexOf(reference);
        if (index > -1) {
            return this.splice(index, 1)
        }
    };
    Array.prototype.getRandom = function() {
        return this[_this.doRandom(0, this.length - 1)]
    }
}, "Static");
Class(function CSS() {
    var _this = this;
    var _obj, _style, _needsUpdate;
    Hydra.ready(function() {
        _style = "";
        _obj = document.createElement("style");
        _obj.type = "text/css";
        document.getElementsByTagName("head")[0].appendChild(_obj)
    });

    function objToCSS(key) {
        var match = key.match(/[A-Z]/);
        var camelIndex = match ? match.index : null;
        if (camelIndex) {
            var start = key.slice(0, camelIndex);
            var end = key.slice(camelIndex);
            key = start + "-" + end.toLowerCase()
        }
        return key
    }

    function cssToObj(key) {
        var match = key.match(/\-/);
        var camelIndex = match ? match.index : null;
        if (camelIndex) {
            var start = key.slice(0, camelIndex);
            var end = key.slice(camelIndex).slice(1);
            var letter = end.charAt(0);
            end = end.slice(1);
            end = letter.toUpperCase() + end;
            key = start + end
        }
        return key
    }

    function setHTML() {
        _obj.innerHTML = _style;
        _needsUpdate = false
    }
    this._read = function() {
        return _style
    };
    this._write = function(css) {
        _style = css;
        if (!_needsUpdate) {
            _needsUpdate = true;
            Render.nextFrame(setHTML)
        }
    };
    this._toCSS = objToCSS;
    this.style = function(selector, obj) {
        var s = selector + " {";
        for (var key in obj) {
            var prop = objToCSS(key);
            var val = obj[key];
            if (typeof val !== "string" && key != "opacity") {
                val += "px"
            }
            s += prop + ":" + val + "!important;"
        }
        s += "}";
        _obj.innerHTML += s
    };
    this.get = function(selector, prop) {
        var values = new Object();
        var string = _obj.innerHTML.split(selector + " {");
        for (var i = 0; i < string.length; i++) {
            var str = string[i];
            if (!str.length) {
                continue
            }
            var split = str.split("!important;");
            for (var j in split) {
                if (split[j].strpos(":")) {
                    var fsplit = split[j].split(":");
                    if (fsplit[1].slice(-2) == "px") {
                        fsplit[1] = Number(fsplit[1].slice(0, -2))
                    }
                    values[cssToObj(fsplit[0])] = fsplit[1]
                }
            }
        }
        if (!prop) {
            return values
        } else {
            return values[prop]
        }
    };
    this.textSize = function($obj) {
        var $clone = $obj.clone();
        $clone.css({
            position: "relative",
            cssFloat: "left",
            styleFloat: "left",
            marginTop: -99999,
            width: "",
            height: ""
        });
        __body.addChild($clone);
        var width = $clone.div.offsetWidth;
        var height = $clone.div.offsetHeight;
        $clone.remove();
        return {
            width: width,
            height: height
        }
    };
    this.prefix = function(style) {
        return Device.styles.vendor == "" ? style.charAt(0).toLowerCase() + style.slice(1) : Device.styles.vendor + style
    }
}, "Static");
Class(function Device() {
    var _this = this;
    var _tagDiv;
    this.agent = navigator.userAgent.toLowerCase();
    this.detect = function(array) {
        if (typeof array === "string") {
            array = [array]
        }
        for (var i = 0; i < array.length; i++) {
            if (this.agent.strpos(array[i])) {
                return true
            }
        }
        return false
    };
    var prefix = (function() {
        var pre = "";
        if (!window._NODE_ && !window._GLES_) {
            var styles = window.getComputedStyle(document.documentElement, "");
            pre = (Array.prototype.slice.call(styles).join("").match(/-(moz|webkit|ms)-/) || (styles.OLink === "" && ["", "o"]))[1];
            var dom = ("WebKit|Moz|MS|O").match(new RegExp("(" + pre + ")", "i"))[1]
        } else {
            pre = "webkit"
        }
        var IE = _this.detect("trident");
        return {
            unprefixed: IE && !_this.detect("msie 9"),
            dom: dom,
            lowercase: pre,
            css: "-" + pre + "-",
            js: (IE ? pre[0] : pre[0].toUpperCase()) + pre.substr(1)
        }
    })();

    function checkForTag(prop) {
        var div = _tagDiv || document.createElement("div"),
            vendors = "Khtml ms O Moz Webkit".split(" "),
            len = vendors.length;
        _tagDiv = div;
        if (prop in div.style) {
            return true
        }
        prop = prop.replace(/^[a-z]/, function(val) {
            return val.toUpperCase()
        });
        while (len--) {
            if (vendors[len] + prop in div.style) {
                return true
            }
        }
        return false
    }
    this.mobile = !window._NODE_ && (!!(("ontouchstart" in window) || ("onpointerdown" in window)) && this.detect(["ios", "iphone", "ipad", "windows", "android", "blackberry"])) ? {} : false;
    if (this.mobile && this.detect("windows") && !this.detect("touch")) {
        this.mobile = false
    }
    if (this.mobile) {
        this.mobile.tablet = Math.max(screen.width, screen.height) > 800;
        this.mobile.phone = !this.mobile.tablet
    }
    this.browser = {};
    this.browser.ie = (function() {
        if (_this.detect("msie")) {
            return true
        }
        if (_this.detect("trident") && _this.detect("rv:")) {
            return true
        }
        if (_this.detect("windows") && _this.detect("edge")) {
            return true
        }
    })();
    this.browser.chrome = !this.browser.ie && this.detect("chrome");
    this.browser.safari = !this.browser.chrome && !this.browser.ie && this.detect("safari");
    this.browser.firefox = this.detect("firefox");
    this.browser.version = (function() {
        try {
            if (_this.browser.chrome) {
                return Number(_this.agent.split("chrome/")[1].split(".")[0])
            }
            if (_this.browser.firefox) {
                return Number(_this.agent.split("firefox/")[1].split(".")[0])
            }
            if (_this.browser.safari) {
                return Number(_this.agent.split("version/")[1].split(".")[0].charAt(0))
            }
            if (_this.browser.ie) {
                if (_this.detect("msie")) {
                    return Number(_this.agent.split("msie ")[1].split(".")[0])
                }
                if (_this.detect("rv:")) {
                    return Number(_this.agent.split("rv:")[1].split(".")[0])
                }
                return Number(_this.agent.split("edge/")[1].split(".")[0])
            }
        } catch (e) {
            return -1
        }
    })();
    this.vendor = prefix.css;
    this.transformProperty = (function() {
        switch (prefix.lowercase) {
            case "moz":
                return "-moz-transform";
                break;
            case "webkit":
                return "-webkit-transform";
                break;
            case "o":
                return "-o-transform";
                break;
            case "ms":
                return "-ms-transform";
                break;
            default:
                return "transform";
                break
        }
    })();
    this.system = {};
    this.system.retina = window.devicePixelRatio > 1;
    this.system.webworker = typeof window.Worker !== "undefined";
    this.system.offline = typeof window.applicationCache !== "undefined";
    if (!window._NODE_) {
        this.system.geolocation = typeof navigator.geolocation !== "undefined";
        this.system.pushstate = typeof window.history.pushState !== "undefined"
    }
    this.system.webcam = !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    this.system.language = window.navigator.userLanguage || window.navigator.language;
    this.system.webaudio = typeof window.AudioContext !== "undefined";
    this.system.vr = !!window.VRDisplay;
    try {
        this.system.localStorage = typeof window.localStorage !== "undefined"
    } catch (e) {
        this.system.localStorage = false
    }
    this.system.fullscreen = typeof document[prefix.lowercase + "CancelFullScreen"] !== "undefined";
    this.system.os = (function() {
        if (_this.detect("mac os")) {
            return "mac"
        } else {
            if (_this.detect("windows nt 6.3")) {
                return "windows8.1"
            } else {
                if (_this.detect("windows nt 6.2")) {
                    return "windows8"
                } else {
                    if (_this.detect("windows nt 6.1")) {
                        return "windows7"
                    } else {
                        if (_this.detect("windows nt 6.0")) {
                            return "windowsvista"
                        } else {
                            if (_this.detect("windows nt 5.1")) {
                                return "windowsxp"
                            } else {
                                if (_this.detect("windows")) {
                                    return "windows"
                                } else {
                                    if (_this.detect("linux")) {
                                        return "linux"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return "undetected"
    })();
    this.pixelRatio = window.devicePixelRatio;
    this.media = {};
    this.media.audio = (function() {
        if (!!document.createElement("audio").canPlayType) {
            return _this.detect(["firefox", "opera"]) ? "ogg" : "mp3"
        } else {
            return false
        }
    })();
    this.media.video = (function() {
        var vid = document.createElement("video");
        if (!!vid.canPlayType) {
            if (Device.mobile) {
                return "mp4"
            }
            if (_this.browser.chrome) {
                return "webm"
            }
            if (_this.browser.firefox || _this.browser.opera) {
                if (vid.canPlayType('video/webm; codecs="vorbis,vp8"')) {
                    return "webm"
                }
                return "ogv"
            }
            return "mp4"
        } else {
            return false
        }
    })();
    this.graphics = {};
    this.graphics.webgl = (function() {
        try {
            var gl;
            var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
            var canvas = document.createElement("canvas");
            for (var i = 0; i < names.length; i++) {
                gl = canvas.getContext(names[i]);
                if (gl) {
                    break
                }
            }
            var info = gl.getExtension("WEBGL_debug_renderer_info");
            var output = {};
            if (info) {
                var gpu = info.UNMASKED_RENDERER_WEBGL;
                output.gpu = gl.getParameter(gpu).toLowerCase()
            }
            output.renderer = gl.getParameter(gl.RENDERER).toLowerCase();
            output.version = gl.getParameter(gl.VERSION).toLowerCase();
            output.glsl = gl.getParameter(gl.SHADING_LANGUAGE_VERSION).toLowerCase();
            output.extensions = gl.getSupportedExtensions();
            output.detect = function(matches) {
                if (output.gpu && output.gpu.toLowerCase().strpos(matches)) {
                    return true
                }
                if (output.version && output.version.toLowerCase().strpos(matches)) {
                    return true
                }
                for (var i = 0; i < output.extensions.length; i++) {
                    if (output.extensions[i].toLowerCase().strpos(matches)) {
                        return true
                    }
                }
                return false
            };
            return output
        } catch (e) {
            return false
        }
    })();
    this.graphics.canvas = (function() {
        var canvas = document.createElement("canvas");
        return canvas.getContext ? true : false
    })();
    this.styles = {};
    this.styles.filter = checkForTag("filter");
    this.styles.blendMode = checkForTag("mix-blend-mode");
    this.styles.vendor = prefix.unprefixed ? "" : prefix.js;
    this.styles.vendorTransition = this.styles.vendor.length ? this.styles.vendor + "Transition" : "transition";
    this.styles.vendorTransform = this.styles.vendor.length ? this.styles.vendor + "Transform" : "transform";
    this.tween = {};
    this.tween.transition = checkForTag("transition");
    this.tween.css2d = checkForTag("transform");
    this.tween.css3d = checkForTag("perspective");
    this.tween.complete = (function() {
        if (prefix.unprefixed) {
            return "transitionend"
        }
        return prefix.lowercase + "TransitionEnd"
    })();
    this.test = function(name, test) {
        this[name] = test()
    };
    this.detectGPU = function(matches) {
        if (!this.graphics.webgl) {
            return false
        }
        return this.graphis.webgl.detect(matches)
    };

    function checkFullscreen() {
        if (!_this.getFullscreen()) {
            HydraEvents._fireEvent(HydraEvents.FULLSCREEN, {
                fullscreen: false
            });
            Render.stop(checkFullscreen)
        }
    }
    this.openFullscreen = function(obj) {
        obj = obj || __body;
        if (obj && _this.system.fullscreen) {
            if (obj == __body) {
                obj.css({
                    top: 0
                })
            }
            obj.div[prefix.lowercase + "RequestFullScreen"]();
            HydraEvents._fireEvent(HydraEvents.FULLSCREEN, {
                fullscreen: true
            });
            Render.start(checkFullscreen, 10)
        }
    };
    this.closeFullscreen = function() {
        if (_this.system.fullscreen) {
            document[prefix.lowercase + "CancelFullScreen"]()
        }
        Render.stop(checkFullscreen)
    };
    this.getFullscreen = function() {
        if (_this.browser.firefox) {
            return document.mozFullScreen
        }
        return document[prefix.lowercase + "IsFullScreen"]
    }
}, "Static");
Class(function DynamicObject(_properties) {
    var prototype = DynamicObject.prototype;
    if (_properties) {
        for (var key in _properties) {
            this[key] = _properties[key]
        }
    }
    this._tweens = {};
    if (typeof prototype.tween !== "undefined") {
        return
    }
    prototype.tween = function(properties, time, ease, delay, update, complete) {
        if (typeof delay !== "number") {
            complete = update;
            update = delay;
            delay = 0
        }
        if (!this.multiTween) {
            this.stopTween()
        }
        if (typeof complete !== "function") {
            complete = null
        }
        if (typeof update !== "function") {
            update = null
        }
        this._tween = TweenManager.tween(this, properties, time, ease, delay, complete, update);
        return this._tween
    };
    prototype.stopTween = function(tween) {
        var _tween = tween || this._tween;
        if (_tween && _tween.stop) {
            _tween.stop()
        }
    };
    prototype.pause = function() {
        var _tween = this._tween;
        if (_tween && _tween.pause) {
            _tween.pause()
        }
    };
    prototype.resume = function() {
        var _tween = this._tween;
        if (_tween && _tween.resume) {
            _tween.resume()
        }
    };
    prototype.copy = function(pool) {
        var c = pool && pool.get ? pool.get() : new DynamicObject();
        for (var key in this) {
            if (typeof this[key] === "number") {
                c[key] = this[key]
            }
        }
        return c
    };
    prototype.copyFrom = function(obj) {
        for (var key in obj) {
            if (typeof obj[key] == "number") {
                this[key] = obj[key]
            }
        }
    };
    prototype.copyTo = function(obj) {
        for (var key in obj) {
            if (typeof this[key] == "number") {
                obj[key] = this[key]
            }
        }
    };
    prototype.clear = function() {
        for (var key in this) {
            if (typeof this[key] !== "function") {
                delete this[key]
            }
        }
        return this
    }
});
Class(function ObjectPool(_type, _number) {
    Inherit(this, Component);
    var _this = this;
    var _pool = [];
    (function() {
        if (_type) {
            _number = _number || 10;
            _type = _type || Object;
            for (var i = 0; i < _number; i++) {
                _pool.push(new _type())
            }
        }
    })();
    this.get = function() {
        return _pool.shift()
    };
    this.empty = function() {
        _pool.length = 0
    };
    this.put = function(obj) {
        if (obj) {
            _pool.push(obj)
        }
    };
    this.insert = function(array) {
        if (typeof array.push === "undefined") {
            array = [array]
        }
        for (var i = 0; i < array.length; i++) {
            _pool.push(array[i])
        }
    };
    this.onDestroy = function() {
        for (var i = 0; i < _pool.length; i++) {
            if (_pool[i].destroy) {
                _pool[i].destroy()
            }
        }
        _pool = null
    }
});
Class(function LinkedList() {
    var prototype = LinkedList.prototype;
    this.length = 0;
    this.first = null;
    this.last = null;
    this.current = null;
    this.prev = null;
    if (typeof prototype.push !== "undefined") {
        return
    }
    prototype.push = function(obj) {
        if (!this.first) {
            this.first = obj;
            this.last = obj;
            obj.__prev = obj;
            obj.__next = obj
        } else {
            obj.__next = this.first;
            obj.__prev = this.last;
            this.last.__next = obj;
            this.last = obj
        }
        this.length++
    };
    prototype.remove = function(obj) {
        if (!obj || !obj.__next) {
            return
        }
        if (this.length <= 1) {
            this.empty()
        } else {
            if (obj == this.first) {
                this.first = obj.__next;
                this.last.__next = this.first;
                this.first.__prev = this.last
            } else {
                if (obj == this.last) {
                    this.last = obj.__prev;
                    this.last.__next = this.first;
                    this.first.__prev = this.last
                } else {
                    obj.__prev.__next = obj.__next;
                    obj.__next.__prev = obj.__prev
                }
            }
            this.length--
        }
        obj.__prev = null;
        obj.__next = null
    };
    prototype.empty = function() {
        this.first = null;
        this.last = null;
        this.current = null;
        this.prev = null;
        this.length = 0
    };
    prototype.start = function() {
        this.current = this.first;
        this.prev = this.current;
        return this.current
    };
    prototype.next = function() {
        if (!this.current) {
            return
        }
        this.current = this.current.__next;
        if (this.length == 1 || this.prev.__next == this.first) {
            return
        }
        this.prev = this.current;
        return this.current
    };
    prototype.destroy = function() {
        Utils.nullObject(this);
        return null
    }
});
Class(function Mouse() {
    var _this = this;
    var _capturing;
    this.x = 0;
    this.y = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.moveX = 0;
    this.moveY = 0;
    this.autoPreventClicks = false;

    function moved(e) {
        _this.lastX = _this.x;
        _this.lastY = _this.y;
        _this.ready = true;
        if (e.windowsPointer) {
            _this.x = e.x;
            _this.y = e.y
        } else {
            var convert = Utils.touchEvent(e);
            _this.x = convert.x;
            _this.y = convert.y
        }
        _this.moveX = _this.x - _this.lastX;
        _this.moveY = _this.y - _this.lastY;
        defer(resetMove)
    }
    this.capture = function(x, y) {
        if (_capturing) {
            return false
        }
        _capturing = true;
        _this.x = x || 0;
        _this.y = y || 0;
        if (!Device.mobile) {
            __window.bind("mousemove", moved)
        } else {
            __window.bind("touchmove", moved);
            __window.bind("touchstart", moved)
        }
    };
    this.stop = function() {
        if (!_capturing) {
            return false
        }
        _capturing = false;
        _this.x = 0;
        _this.y = 0;
        if (!Device.mobile) {
            __window.unbind("mousemove", moved)
        } else {
            __window.unbind("touchmove", moved);
            __window.unbind("touchstart", moved)
        }
    };
    this.preventClicks = function() {
        _this._preventClicks = true;
        Timer.create(function() {
            _this._preventClicks = false
        }, 300)
    };
    this.preventFireAfterClick = function() {
        _this._preventFire = true
    };

    function resetMove() {
        _this.moveX = 0;
        _this.moveY = 0
    }
}, "Static");
Class(function Render() {
    var _this = this;
    var _timer, _last, _timerName;
    var _render = [];
    var _time = Date.now();
    var _list0 = new LinkedList();
    var _list1 = new LinkedList();
    var _list = _list0;
    var _timeSinceRender = 0;
    this.TIME = Date.now();
    this.TARGET_FPS = 60;
    (function() {
        if (!THREAD) {
            requestAnimationFrame(render);
            Hydra.ready(addListeners)
        }
    })();

    function render() {
        if (_list.length) {
            fireCallbacks()
        }
        var t = Date.now();
        var timeSinceLoad = t - _time;
        var diff = 0;
        var fps = 60;
        if (_last) {
            diff = t - _last;
            fps = 1000 / diff
        }
        _last = t;
        _this.FPS = fps;
        _this.TIME = t;
        _this.DELTA = diff;
        _this.TSL = timeSinceLoad;
        for (var i = _render.length - 1; i > -1; i--) {
            var callback = _render[i];
            if (!callback) {
                continue
            }
            if (callback.fps) {
                _timeSinceRender += diff > 200 ? 0 : diff;
                if (_timeSinceRender < (1000 / callback.fps)) {
                    continue
                }
                _timeSinceRender -= (1000 / callback.fps)
            }
            callback(t, timeSinceLoad, diff, fps, callback.frameCount++)
        }
        if (!THREAD) {
            requestAnimationFrame(render)
        }
    }

    function fireCallbacks() {
        var list = _list;
        _list = _list == _list0 ? _list1 : _list0;
        var callback = list.start();
        while (callback) {
            var last = callback;
            callback();
            callback = list.next();
            last.__prev = last.__next = last = null
        }
        list.empty()
    }

    function addListeners() {
        HydraEvents._addEvent(HydraEvents.BROWSER_FOCUS, focus, _this)
    }

    function focus(e) {
        if (e.type == "focus") {
            _last = Date.now()
        }
    }
    this.startRender = this.start = function(callback, fps) {
        var allowed = true;
        var count = _render.length - 1;
        if (this.TARGET_FPS < 60) {
            fps = this.TARGET_FPS
        }
        if (typeof fps == "number") {
            callback.fps = fps
        }
        callback.frameCount = 0;
        if (_render.indexOf(callback) == -1) {
            _render.push(callback)
        }
    };
    this.stopRender = this.stop = function(callback) {
        var i = _render.indexOf(callback);
        if (i > -1) {
            _render.splice(i, 1)
        }
    };
    this.startTimer = function(name) {
        _timerName = name || "Timer";
        if (console.time && !window._NODE_) {
            console.time(_timerName)
        } else {
            _timer = Date.now()
        }
    };
    this.stopTimer = function() {
        if (console.time && !window._NODE_) {
            console.timeEnd(_timerName)
        } else {
            console.log("Render " + _timerName + ": " + (Date.now() - _timer))
        }
    };
    this.nextFrame = function(callback) {
        _list.push(callback)
    };
    this.setupTween = function(callback) {
        _this.nextFrame(function() {
            _this.nextFrame(callback)
        })
    };
    this.tick = function() {
        render()
    };
    this.onIdle = function(callback, max) {
        if (window.requestIdleCallback && false) {
            if (max) {
                max = {
                    timeout: max
                }
            }
            return window.requestIdleCallback(callback, max)
        } else {
            var start = _this.TIME;
            return defer(function() {
                callback({
                    didTimeout: false,
                    timeRemaining: function() {
                        return Math.max(0, 50 - (_this.TIME - start))
                    }
                })
            })
        }
    };
    window.defer = this.nextFrame;
    window.nextFrame = this.setupTween;
    window.onIdle = this.onIdle
}, "Static");
Class(function HydraEvents() {
    var _events = [];
    var _e = {};
    this.BROWSER_FOCUS = "hydra_focus";
    this.HASH_UPDATE = "hydra_hash_update";
    this.COMPLETE = "hydra_complete";
    this.PROGRESS = "hydra_progress";
    this.UPDATE = "hydra_update";
    this.LOADED = "hydra_loaded";
    this.END = "hydra_end";
    this.FAIL = "hydra_fail";
    this.SELECT = "hydra_select";
    this.ERROR = "hydra_error";
    this.READY = "hydra_ready";
    this.RESIZE = "hydra_resize";
    this.CLICK = "hydra_click";
    this.HOVER = "hydra_hover";
    this.MESSAGE = "hydra_message";
    this.ORIENTATION = "orientation";
    this.BACKGROUND = "background";
    this.BACK = "hydra_back";
    this.PREVIOUS = "hydra_previous";
    this.NEXT = "hydra_next";
    this.RELOAD = "hydra_reload";
    this.FULLSCREEN = "hydra_fullscreen";
    this._checkDefinition = function(evt) {
        if (typeof evt == "undefined") {
            throw "Undefined event"
        }
    };
    this._addEvent = function(e, callback, object) {
        if (this._checkDefinition) {
            this._checkDefinition(e)
        }
        var add = new Object();
        add.evt = e;
        add.object = object;
        add.callback = callback;
        _events.push(add)
    };
    this._removeEvent = function(eventString, callback) {
        if (this._checkDefinition) {
            this._checkDefinition(eventString)
        }
        defer(function() {
            for (var i = _events.length - 1; i > -1; i--) {
                if (_events[i].evt == eventString && _events[i].callback == callback) {
                    _events[i] = null;
                    _events.splice(i, 1)
                }
            }
        })
    };
    this._destroyEvents = function(object) {
        for (var i = _events.length - 1; i > -1; i--) {
            if (_events[i].object == object) {
                _events[i] = null;
                _events.splice(i, 1)
            }
        }
    };
    this._fireEvent = function(eventString, obj) {
        if (this._checkDefinition) {
            this._checkDefinition(eventString)
        }
        var fire = true;
        obj = obj || _e;
        obj.cancel = function() {
            fire = false
        };
        for (var i = 0; i < _events.length; i++) {
            if (_events[i].evt == eventString) {
                if (fire) {
                    _events[i].callback(obj)
                } else {
                    return false
                }
            }
        }
    };
    this._consoleEvents = function() {
        console.log(_events)
    };
    this.createLocalEmitter = function(child) {
        var events = new HydraEvents();
        child.on = events._addEvent;
        child.off = events._removeEvent;
        child.fire = events._fireEvent
    }
}, "Static");
Class(function Events(_this) {
    this.events = {};
    var _events = {};
    var _e = {};
    this.events.subscribe = function(evt, callback) {
        HydraEvents._addEvent(evt, !!callback._fire ? callback._fire : callback, _this);
        return callback
    };
    this.events.unsubscribe = function(evt, callback) {
        HydraEvents._removeEvent(evt, !!callback._fire ? callback._fire : callback)
    };
    this.events.fire = function(evt, obj, skip) {
        obj = obj || _e;
        HydraEvents._checkDefinition(evt);
        if (_events[evt]) {
            obj.target = obj.target || _this;
            _events[evt](obj);
            obj.target = null
        } else {
            if (!skip) {
                HydraEvents._fireEvent(evt, obj)
            }
        }
    };
    this.events.add = function(evt, callback) {
        HydraEvents._checkDefinition(evt);
        _events[evt] = !!callback._fire ? callback._fire : callback;
        return callback
    };
    this.events.remove = function(evt) {
        HydraEvents._checkDefinition(evt);
        if (_events[evt]) {
            delete _events[evt]
        }
    };
    this.events.bubble = function(object, evt) {
        HydraEvents._checkDefinition(evt);
        var _this = this;
        object.events.add(evt, function(e) {
            _this.fire(evt, e)
        })
    };
    this.events.scope = function(ref) {
        _this = ref
    };
    this.events.destroy = function() {
        HydraEvents._destroyEvents(_this);
        _events = null;
        _this = null;
        return null
    }
});
Class(function Dispatch() {
    var _this = this;
    var _callbacks = {};

    function empty() {}
    this.register = function(object, method) {
        defer(function() {
            _callbacks[Hydra.getClassName(object) + "-" + method] = object[method]
        })
    };
    this.find = function(object, method, args) {
        var path = object.toString().match(/function ([^\(]+)/)[1] + "-" + method;
        if (_callbacks[path]) {
            return _callbacks[path]
        } else {
            delete _callbacks[path];
            return empty
        }
    }
}, "static");
Class(function Mobile() {
    Inherit(this, Component);
    var _this = this;
    var _lastTime;
    var _cancelScroll = true;
    var _scrollTarget = {};
    var _orientationPrevent, _type, _lastWidth;
    this.sleepTime = 10000;
    this.scrollTop = 0;
    this.autoResizeReload = true;
    this.disableScrollManagement = false;
    Mobile.ScreenLock;
    if (Device.mobile) {
        for (var b in Device.browser) {
            Device.browser[b] = false
        }
        setInterval(checkTime, 250);
        this.phone = Device.mobile.phone;
        this.tablet = Device.mobile.tablet;
        this.orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
        this.os = (function() {
            if (Device.detect("windows", "iemobile")) {
                return "Windows"
            }
            if (Device.detect(["ipad", "iphone"])) {
                return "iOS"
            }
            if (Device.detect(["android", "kindle"])) {
                return "Android"
            }
            if (Device.detect("blackberry")) {
                return "Blackberry"
            }
            return "Unknown"
        })();
        this.version = (function() {
            try {
                if (_this.os == "iOS") {
                    var num = Device.agent.split("os ")[1].split("_");
                    var main = num[0];
                    var sub = num[1].split(" ")[0];
                    return Number(main + "." + sub)
                }
                if (_this.os == "Android") {
                    var version = Device.agent.split("android ")[1].split(";")[0];
                    if (version.length > 3) {
                        version = version.slice(0, -2)
                    }
                    if (version.charAt(version.length - 1) == ".") {
                        version = version.slice(0, -1)
                    }
                    return Number(version)
                }
                if (_this.os == "Windows") {
                    if (Device.agent.strpos("rv:11")) {
                        return 11
                    }
                    return Number(Device.agent.split("windows phone ")[1].split(";")[0])
                }
            } catch (e) {}
            return -1
        })();
        this.browser = (function() {
            if (_this.os == "iOS") {
                if (Device.detect(["twitter", "fbios"])) {
                    return "Social"
                }
                if (Device.detect("crios")) {
                    return "Chrome"
                }
                if (Device.detect("safari")) {
                    return "Safari"
                }
                return "Unknown"
            }
            if (_this.os == "Android") {
                if (Device.detect(["twitter", "fb", "facebook"])) {
                    return "Social"
                }
                if (Device.detect("chrome")) {
                    return "Chrome"
                }
                if (Device.detect("firefox")) {
                    return "Firefox"
                }
                return "Browser"
            }
            if (_this.os == "Windows") {
                return "IE"
            }
            return "Unknown"
        })();
        if (this.os == "Android" && this.browser == "Chrome") {
            this.browserVersion = Number(Device.agent.split("chrome/")[1].split(".")[0])
        }
        Hydra.ready(function() {
            window.addEventListener("orientationchange", orientationChange);
            window.onresize = resizeHandler;
            if (_this.browser == "Safari" && (!_this.NativeCore || !_this.NativeCore.active)) {
                document.body.scrollTop = 0;
                __body.css({
                    height: "101%"
                })
            }
            setHeight();
            _this.orientation = Stage.width > Stage.height ? "landscape" : "portrait";
            if (!(_this.NativeCore && _this.NativeCore.active)) {
                window.addEventListener("touchstart", touchStart)
            } else {
                Stage.css({
                    overflow: "hidden"
                })
            }
            determineType();
            _type = _this.phone ? "phone" : "tablet";
            _lastWidth = Stage.width
        });

        function determineType() {
            Device.mobile.tablet = (function() {
                if (Stage.width > Stage.height) {
                    return document.body.clientWidth > 800
                } else {
                    return document.body.clientHeight > 800
                }
            })();
            Device.mobile.phone = !Device.mobile.tablet;
            _this.phone = Device.mobile.phone;
            _this.tablet = Device.mobile.tablet
        }

        function setHeight() {
            Stage.width = document.body.clientWidth;
            Stage.height = document.body.clientHeight;
            if (Hydra.__offset) {
                Stage.width -= Hydra.__offset.x;
                Stage.height -= Hydra.__offset.y;
                Stage.css({
                    width: Stage.width,
                    height: Stage.height
                })
            }
            if (_this.browser == "Social" && _this.os == "iOS") {
                Stage.width = window.innerWidth;
                Stage.height = window.innerHeight
            }
        }

        function resizeHandler() {
            clearTimeout(_this.fireResize);
            if (!_this.allowScroll) {
                document.body.scrollTop = 0
            }
            _this.fireResize = _this.delayedCall(function() {
                setHeight();
                determineType();
                var type = _this.phone ? "phone" : "tablet";
                if ((_this.os == "iOS" || (_this.os == "Android" && _this.version >= 7)) && type != _type && _lastWidth != Stage.width && _this.autoResizeReload) {
                    window.location.reload()
                }
                _this.orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
                _this.events.fire(HydraEvents.RESIZE);
                _lastWidth = Stage.width
            }, 32)
        }

        function orientationChange() {
            _this.events.fire(HydraEvents.ORIENTATION)
        }

        function touchStart(e) {
            if (_this.disableScrollManagemenet) {
                return
            }
            var touch = Utils.touchEvent(e);
            var target = e.target;
            var inputElement = target.nodeName == "INPUT" || target.nodeName == "TEXTAREA" || target.nodeName == "SELECT" || target.nodeName == "A";
            if (inputElement) {
                return
            }
            if (_cancelScroll) {
                return e.preventDefault()
            }
            var prevent = true;
            target = e.target;
            while (target.parentNode) {
                if (target._scrollParent) {
                    prevent = false;
                    _scrollTarget.target = target;
                    _scrollTarget.y = touch.y;
                    target.hydraObject.__preventY = touch.y
                }
                target = target.parentNode
            }
            if (prevent) {
                e.preventDefault()
            }
        }
    }

    function checkTime() {
        var time = Date.now();
        if (_lastTime) {
            if (time - _lastTime > _this.sleepTime) {
                _this.events.fire(HydraEvents.BACKGROUND)
            }
        }
        _lastTime = time
    }
    this.Class = window.Class;
    this.fullscreen = function() {
        if (_this.NativeCore && _this.NativeCore.active) {
            return
        }
        if (_this.os == "Android") {
            __window.bind("touchstart", function() {
                Device.openFullscreen()
            });
            if (_this.orientationSet) {
                _this.events.fire(HydraEvents.RESIZE)
            }
            return true
        }
        return false
    };
    this.overflowScroll = function($object, dir) {
        if (!Device.mobile) {
            return false
        }
        var x = !!dir.x;
        var y = !!dir.y;
        var overflow = {
            "-webkit-overflow-scrolling": "touch"
        };
        if ((!x && !y) || (x && y)) {
            overflow.overflow = "scroll"
        }
        if (!x && y) {
            overflow.overflowY = "scroll";
            overflow.overflowX = "hidden"
        }
        if (x && !y) {
            overflow.overflowX = "scroll";
            overflow.overflowY = "hidden"
        }
        $object.css(overflow);
        $object.div._scrollParent = true;
        _cancelScroll = false;
        $object.div._preventEvent = function(e) {
            if ($object.maxScroll) {
                var touch = Utils.touchEvent(e);
                var delta = touch.y - $object.__preventY < 0 ? 1 : -1;
                if ($object.div.scrollTop < 2) {
                    if (delta == -1) {
                        e.preventDefault()
                    } else {
                        e.stopPropagation()
                    }
                } else {
                    if ($object.div.scrollTop > $object.maxScroll - 2) {
                        if (delta == 1) {
                            e.preventDefault()
                        } else {
                            e.stopPropagation()
                        }
                    }
                }
            } else {
                e.stopPropagation()
            }
        };
        if (!_this.isNative()) {
            $object.div.addEventListener("touchmove", $object.div._preventEvent)
        }
    };
    this.removeOverflowScroll = function($object) {
        $object.css({
            overflow: "hidden",
            overflowX: "",
            overflowY: "",
            "-webkit-overflow-scrolling": ""
        });
        $object.div.removeEventListener("touchmove", $object.div._preventEvent)
    };
    this.setOrientation = function(type) {
        if (_this.System && _this.NativeCore.active) {
            _this.System.orientation = _this.System[type.toUpperCase()];
            return
        }
        if (Device.mobile) {
            _this.ScreenLock.lock(type)
        }
        _this.orientationSet = type
    };
    this.vibrate = function(time) {
        navigator.vibrate && navigator.vibrate(time)
    };
    this.isNative = function() {
        return _this.NativeCore && _this.NativeCore.active
    }
}, "Static");
Class(function Modules() {
    var _this = this;
    var _modules = {};
    (function() {
        defer(exec)
    })();

    function exec() {
        for (var m in _modules) {
            for (var key in _modules[m]) {
                var module = _modules[m][key];
                if (module._ready) {
                    continue
                }
                module._ready = true;
                if (module.exec) {
                    module.exec()
                }
            }
        }
    }

    function requireModule(root, path) {
        var module = _modules[root][path];
        if (!module._ready) {
            module._ready = true;
            if (module.exec) {
                module.exec()
            }
        }
        return module
    }
    this.push = function(module) {};
    this.Module = function(module) {
        var m = new module();
        var name = module.toString().slice(0, 100).match(/function ([^\(]+)/);
        if (name) {
            m._ready = true;
            name = name[1];
            _modules[name] = {
                index: m
            }
        } else {
            if (!_modules[m.module]) {
                _modules[m.module] = {}
            }
            _modules[m.module][m.path] = m
        }
    };
    this.require = function(path) {
        var root;
        if (!path.strpos("/")) {
            root = path;
            path = "index"
        } else {
            root = path.split("/")[0];
            path = path.replace(root + "/", "")
        }
        return requireModule(root, path).exports
    };
    window.Module = this.Module;
    if (!window._NODE_) {
        window.requireNative = window.require;
        window.require = this.require
    }
}, "Static");
Class(function Timer() {
    var _this = this;
    var _clearTimeout;
    var _callbacks = [];
    var _completed = [];
    var _pool = new ObjectPool(Object, 100);
    (function() {
        Render.start(loop)
    })();

    function loop(t, tsl, delta) {
        var len = _completed.length;
        for (var i = 0; i < len; i++) {
            var obj = _completed[i];
            obj.callback = null;
            _callbacks.findAndRemove(obj);
            _pool.put(obj)
        }
        if (len > 0) {
            _completed.length = 0
        }
        if (delta > 250) {
            return
        }
        len = _callbacks.length;
        for (var i = 0; i < len; i++) {
            var obj = _callbacks[i];
            if (!obj) {
                continue
            }
            if (obj.frames) {
                ++obj.current;
                if (obj.current >= obj.frames) {
                    obj.callback();
                    _completed.push(obj)
                }
            }
            if (obj.time) {
                obj.current += delta;
                if (obj.current >= obj.time) {
                    obj.callback();
                    _completed.push(obj)
                }
            }
        }
    }

    function find(ref) {
        for (var i = _callbacks.length - 1; i > -1; i--) {
            var c = _callbacks[i];
            if (c.ref == ref) {
                return c
            }
        }
    }
    _clearTimeout = window.clearTimeout;
    window.clearTimeout = function(ref) {
        var c = find(ref);
        if (c) {
            _callbacks.findAndRemove(c)
        } else {
            _clearTimeout(ref)
        }
    };
    this.create = function(callback, time) {
        if (window._NODE_) {
            return setTimeout(callback, time)
        }
        if (time <= 0) {
            return callback()
        }
        var obj = _pool.get() || {};
        obj.time = time;
        obj.current = 0;
        obj.ref = Utils.timestamp();
        obj.callback = callback;
        _callbacks.push(obj);
        return obj.ref
    };
    this.waitFrames = function(callback, frames) {
        var obj = _pool.get() || {};
        obj.frames = frames;
        obj.current = 0;
        obj.callback = callback;
        _callbacks.push(obj)
    }
}, "static");
Class(function Color(_value) {
    Inherit(this, Component);
    var _this = this;
    var _hsl, _array;
    this.r = 1;
    this.g = 1;
    this.b = 1;
    (function() {
        set(_value)
    })();

    function set(value) {
        if (value instanceof Color) {
            copy(value)
        } else {
            if (typeof value === "number") {
                setHex(value)
            } else {
                if (Array.isArray(value)) {
                    setRGB(value)
                } else {
                    setHex(Number("0x" + value.slice(1)))
                }
            }
        }
    }

    function copy(color) {
        _this.r = color.r;
        _this.g = color.g;
        _this.b = color.b
    }

    function setHex(hex) {
        hex = Math.floor(hex);
        _this.r = (hex >> 16 & 255) / 255;
        _this.g = (hex >> 8 & 255) / 255;
        _this.b = (hex & 255) / 255
    }

    function setRGB(values) {
        _this.r = values[0];
        _this.g = values[1];
        _this.b = values[2]
    }

    function hue2rgb(p, q, t) {
        if (t < 0) {
            t += 1
        }
        if (t > 1) {
            t -= 1
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t
        }
        if (t < 1 / 2) {
            return q
        }
        if (t < 2 / 3) {
            return p + (q - p) * 6 * (2 / 3 - t)
        }
        return p
    }
    this.set = function(value) {
        set(value);
        return this
    };
    this.setRGB = function(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        return this
    };
    this.setHSL = function(h, s, l) {
        if (s === 0) {
            this.r = this.g = this.b = l
        } else {
            var p = l <= 0.5 ? l * (1 + s) : l + s - (l * s);
            var q = (2 * l) - p;
            this.r = hue2rgb(q, p, h + 1 / 3);
            this.g = hue2rgb(q, p, h);
            this.b = hue2rgb(q, p, h - 1 / 3)
        }
        return this
    };
    this.offsetHSL = function(h, s, l) {
        var hsl = this.getHSL();
        hsl.h += h;
        hsl.s += s;
        hsl.l += l;
        this.setHSL(hsl.h, hsl.s, hsl.l);
        return this
    };
    this.getStyle = function() {
        return "rgb(" + ((this.r * 255) | 0) + "," + ((this.g * 255) | 0) + "," + ((this.b * 255) | 0) + ")"
    };
    this.getHex = function() {
        return (this.r * 255) << 16 ^ (this.g * 255) << 8 ^ (this.b * 255) << 0
    };
    this.getHexString = function() {
        return "#" + ("000000" + this.getHex().toString(16)).slice(-6)
    };
    this.getHSL = function() {
        _hsl = _hsl || {
            h: 0,
            s: 0,
            l: 0
        };
        var hsl = _hsl;
        var r = this.r,
            g = this.g,
            b = this.b;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var hue, saturation;
        var lightness = (min + max) / 2;
        if (min === max) {
            hue = 0;
            saturation = 0
        } else {
            var delta = max - min;
            saturation = lightness <= 0.5 ? delta / (max + min) : delta / (2 - max - min);
            switch (max) {
                case r:
                    hue = (g - b) / delta + (g < b ? 6 : 0);
                    break;
                case g:
                    hue = (b - r) / delta + 2;
                    break;
                case b:
                    hue = (r - g) / delta + 4;
                    break
            }
            hue /= 6
        }
        hsl.h = hue;
        hsl.s = saturation;
        hsl.l = lightness;
        return hsl
    };
    this.add = function(color) {
        this.r += color.r;
        this.g += color.g;
        this.b += color.b
    };
    this.mix = function(color, percent) {
        this.r = this.r * (1 - percent) + (color.r * percent);
        this.g = this.g * (1 - percent) + (color.g * percent);
        this.b = this.b * (1 - percent) + (color.b * percent)
    };
    this.addScalar = function(s) {
        this.r += s;
        this.g += s;
        this.b += s
    };
    this.multiply = function(color) {
        this.r *= color.r;
        this.g *= color.g;
        this.b *= color.b
    };
    this.multiplyScalar = function(s) {
        this.r *= s;
        this.g *= s;
        this.b *= s
    };
    this.clone = function() {
        return new Color([this.r, this.g, this.b])
    };
    this.toArray = function() {
        if (!_array) {
            _array = []
        }
        _array[0] = this.r;
        _array[1] = this.g;
        _array[2] = this.b;
        return _array
    }
});
Class(function Matrix2() {
    var _this = this;
    var prototype = Matrix2.prototype;
    var a11, a12, a13, a21, a22, a23, a31, a32, a33;
    var b11, b12, b13, b21, b22, b23, b31, b32, b33;
    this.type = "matrix2";
    this.data = new Float32Array(9);
    (function() {
        identity()
    })();

    function identity(d) {
        d = d || _this.data;
        d[0] = 1, d[1] = 0, d[2] = 0;
        d[3] = 0, d[4] = 1, d[5] = 0;
        d[6] = 0, d[7] = 0, d[8] = 1
    }

    function noE(n) {
        n = Math.abs(n) < 0.000001 ? 0 : n;
        return n
    }
    if (typeof prototype.identity !== "undefined") {
        return
    }
    prototype.identity = function(d) {
        identity(d);
        return this
    };
    prototype.transformVector = function(v) {
        var d = this.data;
        var x = v.x;
        var y = v.y;
        v.x = d[0] * x + d[1] * y + d[2];
        v.y = d[3] * x + d[4] * y + d[5];
        return v
    };
    prototype.setTranslation = function(tx, ty, m) {
        var d = m || this.data;
        d[0] = 1, d[1] = 0, d[2] = tx;
        d[3] = 0, d[4] = 1, d[5] = ty;
        d[6] = 0, d[7] = 0, d[8] = 1;
        return this
    };
    prototype.getTranslation = function(v) {
        var d = this.data;
        v = v || new Vector2();
        v.x = d[2];
        v.y = d[5];
        return v
    };
    prototype.setScale = function(sx, sy, m) {
        var d = m || this.data;
        d[0] = sx, d[1] = 0, d[2] = 0;
        d[3] = 0, d[4] = sy, d[5] = 0;
        d[6] = 0, d[7] = 0, d[8] = 1;
        return this
    };
    prototype.setShear = function(sx, sy, m) {
        var d = m || this.data;
        d[0] = 1, d[1] = sx, d[2] = 0;
        d[3] = sy, d[4] = 1, d[5] = 0;
        d[6] = 0, d[7] = 0, d[8] = 1;
        return this
    };
    prototype.setRotation = function(a, m) {
        var d = m || this.data;
        var r0 = Math.cos(a);
        var r1 = Math.sin(a);
        d[0] = r0, d[1] = -r1, d[2] = 0;
        d[3] = r1, d[4] = r0, d[5] = 0;
        d[6] = 0, d[7] = 0, d[8] = 1;
        return this
    };
    prototype.setTRS = function(tx, ty, a, sx, sy) {
        var d = this.data;
        var r0 = Math.cos(a);
        var r1 = Math.sin(a);
        d[0] = r0 * sx, d[1] = -r1 * sy, d[2] = tx;
        d[3] = r1 * sx, d[4] = r0 * sy, d[5] = ty;
        d[6] = 0, d[7] = 0, d[8] = 1;
        return this
    };
    prototype.translate = function(tx, ty) {
        this.identity(Matrix2.__TEMP__);
        this.setTranslation(tx, ty, Matrix2.__TEMP__);
        return this.multiply(Matrix2.__TEMP__)
    };
    prototype.rotate = function(a) {
        this.identity(Matrix2.__TEMP__);
        this.setTranslation(a, Matrix2.__TEMP__);
        return this.multiply(Matrix2.__TEMP__)
    };
    prototype.scale = function(sx, sy) {
        this.identity(Matrix2.__TEMP__);
        this.setScale(sx, sy, Matrix2.__TEMP__);
        return this.multiply(Matrix2.__TEMP__)
    };
    prototype.shear = function(sx, sy) {
        this.identity(Matrix2.__TEMP__);
        this.setRotation(sx, sy, Matrix2.__TEMP__);
        return this.multiply(Matrix2.__TEMP__)
    };
    prototype.multiply = function(m) {
        var a = this.data;
        var b = m.data || m;
        a11 = a[0], a12 = a[1], a13 = a[2];
        a21 = a[3], a22 = a[4], a23 = a[5];
        a31 = a[6], a32 = a[7], a33 = a[8];
        b11 = b[0], b12 = b[1], b13 = b[2];
        b21 = b[3], b22 = b[4], b23 = b[5];
        b31 = b[6], b32 = b[7], b33 = b[8];
        a[0] = a11 * b11 + a12 * b21 + a13 * b31;
        a[1] = a11 * b12 + a12 * b22 + a13 * b32;
        a[2] = a11 * b13 + a12 * b23 + a13 * b33;
        a[3] = a21 * b11 + a22 * b21 + a23 * b31;
        a[4] = a21 * b12 + a22 * b22 + a23 * b32;
        a[5] = a21 * b13 + a22 * b23 + a23 * b33;
        return this
    };
    prototype.inverse = function(m) {
        m = m || this;
        var a = m.data;
        var b = this.data;
        a11 = a[0], a12 = a[1], a13 = a[2];
        a21 = a[3], a22 = a[4], a23 = a[5];
        a31 = a[6], a32 = a[7], a33 = a[8];
        var det = m.determinant();
        if (Math.abs(det) < 1e-7) {}
        var invdet = 1 / det;
        b[0] = (a22 * a33 - a32 * a23) * invdet;
        b[1] = (a13 * a32 - a12 * a33) * invdet;
        b[2] = (a12 * a23 - a13 * a22) * invdet;
        b[3] = (a23 * a31 - a21 * a33) * invdet;
        b[4] = (a11 * a33 - a13 * a31) * invdet;
        b[5] = (a21 * a13 - a11 * a23) * invdet;
        b[6] = (a21 * a32 - a31 * a22) * invdet;
        b[7] = (a31 * a12 - a11 * a32) * invdet;
        b[8] = (a11 * a22 - a21 * a12) * invdet;
        return m
    };
    prototype.determinant = function() {
        var a = this.data;
        a11 = a[0], a12 = a[1], a13 = a[2];
        a21 = a[3], a22 = a[4], a23 = a[5];
        a31 = a[6], a32 = a[7], a33 = a[8];
        return a11 * (a22 * a33 - a32 * a23) - a12 * (a21 * a33 - a23 * a31) + a13 * (a21 * a32 * a22 * a31)
    };
    prototype.copyTo = function(m) {
        var a = this.data;
        var b = m.data || m;
        b[0] = a[0], b[1] = a[1], b[2] = a[2];
        b[3] = a[3], b[4] = a[4], b[5] = a[5];
        b[6] = a[6], b[7] = a[7], b[8] = a[8];
        return m
    };
    prototype.copyFrom = function(m) {
        var a = this.data;
        var b = m.data || m;
        b[0] = a[0], b[1] = a[1], b[2] = a[2];
        b[3] = a[3], b[4] = a[4], b[5] = a[5];
        b[6] = a[6], b[7] = a[7], b[8] = a[8];
        return this
    };
    prototype.getCSS = function(force2D) {
        var d = this.data;
        if (Device.tween.css3d && !force2D) {
            return "matrix3d(" + noE(d[0]) + ", " + noE(d[3]) + ", 0, 0, " + noE(d[1]) + ", " + noE(d[4]) + ", 0, 0, 0, 0, 1, 0, " + noE(d[2]) + ", " + noE(d[5]) + ", 0, 1)"
        } else {
            return "matrix(" + noE(d[0]) + ", " + noE(d[3]) + ", " + noE(d[1]) + ", " + noE(d[4]) + ", " + noE(d[2]) + ", " + noE(d[5]) + ")"
        }
    }
}, function() {
    Matrix2.__TEMP__ = new Matrix2().data
});
Class(function Matrix4() {
    var _this = this;
    var prototype = Matrix4.prototype;
    this.type = "matrix4";
    this.data = new Float32Array(16);
    (function() {
        identity()
    })();

    function identity(m) {
        var d = m || _this.data;
        d[0] = 1, d[4] = 0, d[8] = 0, d[12] = 0;
        d[1] = 0, d[5] = 1, d[9] = 0, d[13] = 0;
        d[2] = 0, d[6] = 0, d[10] = 1, d[14] = 0;
        d[3] = 0, d[7] = 0, d[11] = 0, d[15] = 1
    }

    function noE(n) {
        return Math.abs(n) < 0.000001 ? 0 : n
    }
    if (typeof prototype.identity !== "undefined") {
        return
    }
    prototype.identity = function() {
        identity();
        return this
    };
    prototype.transformVector = function(v, pv) {
        var d = this.data;
        var x = v.x,
            y = v.y,
            z = v.z,
            w = v.w;
        pv = pv || v;
        pv.x = d[0] * x + d[4] * y + d[8] * z + d[12] * w;
        pv.y = d[1] * x + d[5] * y + d[9] * z + d[13] * w;
        pv.z = d[2] * x + d[6] * y + d[10] * z + d[14] * w;
        return pv
    };
    prototype.multiply = function(m, d) {
        var a = this.data;
        var b = m.data || m;
        var a00, a01, a02, a03, a04, a05, a06, a07, a08, a09, a10, a11, a12, a13, a14, a15;
        var b00, b01, b02, b03, b04, b05, b06, b07, b08, b09, b10, b11, b12, b13, b14, b15;
        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        a04 = a[4], a05 = a[5], a06 = a[6], a07 = a[7];
        a08 = a[8], a09 = a[9], a10 = a[10], a11 = a[11];
        a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
        b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
        b04 = b[4], b05 = b[5], b06 = b[6], b07 = b[7];
        b08 = b[8], b09 = b[9], b10 = b[10], b11 = b[11];
        b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
        a[0] = a00 * b00 + a04 * b01 + a08 * b02 + a12 * b03;
        a[1] = a01 * b00 + a05 * b01 + a09 * b02 + a13 * b03;
        a[2] = a02 * b00 + a06 * b01 + a10 * b02 + a14 * b03;
        a[3] = a03 * b00 + a07 * b01 + a11 * b02 + a15 * b03;
        a[4] = a00 * b04 + a04 * b05 + a08 * b06 + a12 * b07;
        a[5] = a01 * b04 + a05 * b05 + a09 * b06 + a13 * b07;
        a[6] = a02 * b04 + a06 * b05 + a10 * b06 + a14 * b07;
        a[7] = a03 * b04 + a07 * b05 + a11 * b06 + a15 * b07;
        a[8] = a00 * b08 + a04 * b09 + a08 * b10 + a12 * b11;
        a[9] = a01 * b08 + a05 * b09 + a09 * b10 + a13 * b11;
        a[10] = a02 * b08 + a06 * b09 + a10 * b10 + a14 * b11;
        a[11] = a03 * b08 + a07 * b09 + a11 * b10 + a15 * b11;
        a[12] = a00 * b12 + a04 * b13 + a08 * b14 + a12 * b15;
        a[13] = a01 * b12 + a05 * b13 + a09 * b14 + a13 * b15;
        a[14] = a02 * b12 + a06 * b13 + a10 * b14 + a14 * b15;
        a[15] = a03 * b12 + a07 * b13 + a11 * b14 + a15 * b15;
        return this
    };
    prototype.setTRS = function(tx, ty, tz, rx, ry, rz, sx, sy, sz, m) {
        m = m || this;
        var d = m.data;
        identity(m);
        var six = Math.sin(rx);
        var cox = Math.cos(rx);
        var siy = Math.sin(ry);
        var coy = Math.cos(ry);
        var siz = Math.sin(rz);
        var coz = Math.cos(rz);
        d[0] = (coy * coz + siy * six * siz) * sx;
        d[1] = (-coy * siz + siy * six * coz) * sx;
        d[2] = siy * cox * sx;
        d[4] = siz * cox * sy;
        d[5] = coz * cox * sy;
        d[6] = -six * sy;
        d[8] = (-siy * coz + coy * six * siz) * sz;
        d[9] = (siz * siy + coy * six * coz) * sz;
        d[10] = coy * cox * sz;
        d[12] = tx;
        d[13] = ty;
        d[14] = tz;
        return m
    };
    prototype.setScale = function(sx, sy, sz, m) {
        m = m || this;
        var d = m.data || m;
        identity(m);
        d[0] = sx, d[5] = sy, d[10] = sz;
        return m
    };
    prototype.setTranslation = function(tx, ty, tz, m) {
        m = m || this;
        var d = m.data || m;
        identity(m);
        d[12] = tx, d[13] = ty, d[14] = tz;
        return m
    };
    prototype.setRotation = function(rx, ry, rz, m) {
        m = m || this;
        var d = m.data || m;
        identity(m);
        var sx = Math.sin(rx);
        var cx = Math.cos(rx);
        var sy = Math.sin(ry);
        var cy = Math.cos(ry);
        var sz = Math.sin(rz);
        var cz = Math.cos(rz);
        d[0] = cy * cz + sy * sx * sz;
        d[1] = -cy * sz + sy * sx * cz;
        d[2] = sy * cx;
        d[4] = sz * cx;
        d[5] = cz * cx;
        d[6] = -sx;
        d[8] = -sy * cz + cy * sx * sz;
        d[9] = sz * sy + cy * sx * cz;
        d[10] = cy * cx;
        return m
    };
    prototype.setLookAt = function(eye, center, up, m) {
        m = m || this;
        var d = m.data || m;
        var f = D3.m4v31;
        var s = D3.m4v32;
        var u = D3.m4v33;
        f.subVectors(center, eye).normalize();
        s.cross(f, up).normalize();
        u.cross(s, f);
        d[0] = s.x;
        d[1] = u.x;
        d[2] = -f.x;
        d[3] = 0;
        d[4] = s.y;
        d[5] = u.y;
        d[6] = -f.y;
        d[7] = 0;
        d[8] = s.z;
        d[9] = u.z;
        d[10] = -f.z;
        d[11] = 0;
        d[12] = 0;
        d[13] = 0;
        d[14] = 0;
        d[15] = 1;
        this.translate(-eye.x, -eye.y, -eye.z);
        return this
    };
    prototype.setPerspective = function(fovy, aspect, near, far, m) {
        var e, rd, s, ct;
        if (near === far || aspect === 0) {
            throw "null frustum"
        }
        if (near <= 0) {
            throw "near <= 0"
        }
        if (far <= 0) {
            throw "far <= 0"
        }
        fovy = Math.PI * fovy / 180 / 2;
        s = Math.sin(fovy);
        if (s === 0) {
            throw "null frustum"
        }
        rd = 1 / (far - near);
        ct = Math.cos(fovy) / s;
        e = m ? (m.data || m) : this.data;
        e[0] = ct / aspect;
        e[1] = 0;
        e[2] = 0;
        e[3] = 0;
        e[4] = 0;
        e[5] = ct;
        e[6] = 0;
        e[7] = 0;
        e[8] = 0;
        e[9] = 0;
        e[10] = -(far + near) * rd;
        e[11] = -1;
        e[12] = 0;
        e[13] = 0;
        e[14] = -2 * near * far * rd;
        e[15] = 0
    };
    prototype.setRotationFromQuaternion = function(q) {
        var d = this.data;
        var x = q.x,
            y = q.y,
            z = q.z,
            w = q.w;
        var x2 = x + x,
            y2 = y + y,
            z2 = z + z;
        var xx = x * x2,
            xy = x * y2,
            xz = x * z2;
        var yy = y * y2,
            yz = y * z2,
            zz = z * z2;
        var wx = w * x2,
            wy = w * y2,
            wz = w * z2;
        d[0] = 1 - (yy + zz);
        d[4] = xy - wz;
        d[8] = xz + wy;
        d[1] = xy + wz;
        d[5] = 1 - (xx + zz);
        d[9] = yz - wx;
        d[2] = xz - wy;
        d[6] = yz + wx;
        d[10] = 1 - (xx + yy);
        d[3] = 0;
        d[7] = 0;
        d[11] = 0;
        d[12] = 0;
        d[13] = 0;
        d[14] = 0;
        d[15] = 1;
        return this
    }, prototype.perspective = function(fov, aspect, near, far) {
        this.setPerspective(fov, aspect, near, far, Matrix4.__TEMP__);
        return this.multiply(Matrix4.__TEMP__)
    };
    prototype.lookAt = function(eye, center, up) {
        this.setLookAt(eye, center, up, Matrix4.__TEMP__);
        return this.multiply(Matrix4.__TEMP__)
    };
    prototype.translate = function(tx, ty, tz) {
        this.setTranslation(tx, ty, tz, Matrix4.__TEMP__);
        return this.multiply(Matrix4.__TEMP__)
    };
    prototype.rotate = function(rx, ry, rz) {
        this.setRotation(rx, ry, rz, Matrix4.__TEMP__);
        return this.multiply(Matrix4.__TEMP__)
    };
    prototype.scale = function(sx, sy, sz) {
        this.setScale(sx, sy, sz, Matrix4.__TEMP__);
        return this.multiply(Matrix4.__TEMP__)
    };
    prototype.copyTo = function(m) {
        var a = this.data;
        var b = m.data || m;
        for (var i = 0; i < 16; i++) {
            b[i] = a[i]
        }
    };
    prototype.copyFrom = function(m) {
        var a = this.data;
        var b = m.data || m;
        for (var i = 0; i < 16; i++) {
            a[i] = b[i]
        }
        return this
    };
    prototype.copyRotationTo = function(m) {
        var a = this.data;
        var b = m.data || m;
        b[0] = a[0];
        b[1] = a[1];
        b[2] = a[2];
        b[3] = a[4];
        b[4] = a[5];
        b[5] = a[6];
        b[6] = a[8];
        b[7] = a[9];
        b[8] = a[10];
        return m
    };
    prototype.copyPosition = function(m) {
        var to = this.data;
        var from = m.data || m;
        to[12] = from[12];
        to[13] = from[13];
        to[14] = from[14];
        return this
    };
    prototype.getCSS = function() {
        var d = this.data;
        return "matrix3d(" + noE(d[0]) + "," + noE(d[1]) + "," + noE(d[2]) + "," + noE(d[3]) + "," + noE(d[4]) + "," + noE(d[5]) + "," + noE(d[6]) + "," + noE(d[7]) + "," + noE(d[8]) + "," + noE(d[9]) + "," + noE(d[10]) + "," + noE(d[11]) + "," + noE(d[12]) + "," + noE(d[13]) + "," + noE(d[14]) + "," + noE(d[15]) + ")"
    };
    prototype.extractPosition = function(v) {
        v = v || new Vector3();
        var d = this.data;
        v.set(d[12], d[13], d[14]);
        return v
    };
    prototype.determinant = function() {
        var d = this.data;
        return d[0] * (d[5] * d[10] - d[9] * d[6]) + d[4] * (d[9] * d[2] - d[1] * d[10]) + d[8] * (d[1] * d[6] - d[5] * d[2])
    };
    prototype.inverse = function(m) {
        var d = this.data;
        var a = (m) ? m.data || m : this.data;
        var det = this.determinant();
        if (Math.abs(det) < 0.0001) {
            console.warn("Attempt to inverse a singular Matrix4. ", this.data);
            console.trace();
            return m
        }
        var d0 = d[0],
            d4 = d[4],
            d8 = d[8],
            d12 = d[12],
            d1 = d[1],
            d5 = d[5],
            d9 = d[9],
            d13 = d[13],
            d2 = d[2],
            d6 = d[6],
            d10 = d[10],
            d14 = d[14];
        det = 1 / det;
        a[0] = (d5 * d10 - d9 * d6) * det;
        a[1] = (d8 * d6 - d4 * d10) * det;
        a[2] = (d4 * d9 - d8 * d5) * det;
        a[4] = (d9 * d2 - d1 * d10) * det;
        a[5] = (d0 * d10 - d8 * d2) * det;
        a[6] = (d8 * d1 - d0 * d9) * det;
        a[8] = (d1 * d6 - d5 * d2) * det;
        a[9] = (d4 * d2 - d0 * d6) * det;
        a[10] = (d0 * d5 - d4 * d1) * det;
        a[12] = -(d12 * a[0] + d13 * a[4] + d14 * a[8]);
        a[13] = -(d12 * a[1] + d13 * a[5] + d14 * a[9]);
        a[14] = -(d12 * a[2] + d13 * a[6] + d14 * a[10]);
        return m
    };
    prototype.transpose = function(m) {
        var d = this.data;
        var a = m ? m.data || m : this.data;
        var d0 = d[0],
            d4 = d[4],
            d8 = d[8],
            d1 = d[1],
            d5 = d[5],
            d9 = d[9],
            d2 = d[2],
            d6 = d[6],
            d10 = d[10];
        a[0] = d0;
        a[1] = d4;
        a[2] = d8;
        a[4] = d1;
        a[5] = d5;
        a[6] = d9;
        a[8] = d2;
        a[9] = d6;
        a[10] = d10
    }
}, function() {
    Matrix4.__TEMP__ = new Matrix4().data
});
Class(function Vector2(_x, _y) {
    var _this = this;
    var prototype = Vector2.prototype;
    this.x = typeof _x == "number" ? _x : 0;
    this.y = typeof _y == "number" ? _y : 0;
    this.type = "vector2";
    if (typeof prototype.set !== "undefined") {
        return
    }
    prototype.set = function(x, y) {
        this.x = x;
        this.y = y;
        return this
    };
    prototype.clear = function() {
        this.x = 0;
        this.y = 0;
        return this
    };
    prototype.copyTo = function(v) {
        v.x = this.x;
        v.y = this.y;
        return this
    };
    prototype.copyFrom = prototype.copy = function(v) {
        this.x = v.x;
        this.y = v.y;
        return this
    };
    prototype.addVectors = function(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        return this
    };
    prototype.subVectors = function(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        return this
    };
    prototype.multiplyVectors = function(a, b) {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        return this
    };
    prototype.add = function(v) {
        this.x += v.x;
        this.y += v.y;
        return this
    };
    prototype.sub = function(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this
    };
    prototype.multiply = function(v) {
        this.x *= v;
        this.y *= v;
        return this
    };
    prototype.divide = function(v) {
        this.x /= v;
        this.y /= v;
        return this
    };
    prototype.lengthSq = function() {
        return (this.x * this.x + this.y * this.y) || 0.00001
    };
    prototype.length = function() {
        return Math.sqrt(this.lengthSq())
    };
    prototype.setLength = function(length) {
        this.normalize().multiply(length);
        return this
    };
    prototype.normalize = function() {
        var length = this.length();
        this.x /= length;
        this.y /= length;
        return this
    };
    prototype.perpendicular = function(a, b) {
        var tx = this.x;
        var ty = this.y;
        this.x = -ty;
        this.y = tx;
        return this
    };
    prototype.lerp = function(v, alpha) {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        return this
    };
    prototype.interp = function(v, alpha, ease) {
        var a = 0;
        var f = TweenManager.Interpolation.convertEase(ease);
        var calc = Vector2.__TEMP__;
        calc.subVectors(this, v);
        var dist = Utils.clamp(Utils.range(calc.lengthSq(), 0, (5000 * 5000), 1, 0), 0, 1) * (alpha / 10);
        if (typeof f === "function") {
            a = f(dist)
        } else {
            a = TweenManager.Interpolation.solve(f, dist)
        }
        this.x += (v.x - this.x) * a;
        this.y += (v.y - this.y) * a
    };
    prototype.setAngleRadius = function(a, r) {
        this.x = Math.cos(a) * r;
        this.y = Math.sin(a) * r;
        return this
    };
    prototype.addAngleRadius = function(a, r) {
        this.x += Math.cos(a) * r;
        this.y += Math.sin(a) * r;
        return this
    };
    prototype.clone = function() {
        return new Vector2(this.x, this.y)
    };
    prototype.dot = function(a, b) {
        b = b || this;
        return (a.x * b.x + a.y * b.y)
    };
    prototype.distanceTo = function(v, noSq) {
        var dx = this.x - v.x;
        var dy = this.y - v.y;
        if (!noSq) {
            return Math.sqrt(dx * dx + dy * dy)
        }
        return dx * dx + dy * dy
    };
    prototype.solveAngle = function(a, b) {
        if (!b) {
            b = this
        }
        return Math.atan2(a.y - b.y, a.x - b.x)
    };
    prototype.equals = function(v) {
        return this.x == v.x && this.y == v.y
    };
    prototype.console = function() {
        console.log(this.x, this.y)
    };
    prototype.toString = function(split) {
        split = split || " ";
        return this.x + split + this.y
    }
}, function() {
    Vector2.__TEMP__ = new Vector2()
});
Class(function Vector3(_x, _y, _z, _w) {
    var _this = this;
    var prototype = Vector3.prototype;
    this.x = typeof _x === "number" ? _x : 0;
    this.y = typeof _y === "number" ? _y : 0;
    this.z = typeof _z === "number" ? _z : 0;
    this.w = typeof _w === "number" ? _w : 1;
    this.type = "vector3";
    if (typeof prototype.set !== "undefined") {
        return
    }
    prototype.set = function(x, y, z, w) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.w = w || 1;
        return this
    };
    prototype.clear = function() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;
        return this
    };
    prototype.copyTo = function(p) {
        p.x = this.x;
        p.y = this.y;
        p.z = this.z;
        p.w = this.w;
        return p
    };
    prototype.copyFrom = prototype.copy = function(p) {
        this.x = p.x || 0;
        this.y = p.y || 0;
        this.z = p.z || 0;
        this.w = p.w || 1;
        return this
    };
    prototype.lengthSq = function() {
        return this.x * this.x + this.y * this.y + this.z * this.z
    };
    prototype.length = function() {
        return Math.sqrt(this.lengthSq())
    };
    prototype.normalize = function() {
        var m = 1 / this.length();
        this.set(this.x * m, this.y * m, this.z * m);
        return this
    };
    prototype.setLength = function(length) {
        this.normalize().multiply(length);
        return this
    };
    prototype.addVectors = function(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        return this
    };
    prototype.subVectors = function(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this
    };
    prototype.multiplyVectors = function(a, b) {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;
        return this
    };
    prototype.add = function(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this
    };
    prototype.sub = function(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this
    };
    prototype.multiply = function(v) {
        this.x *= v;
        this.y *= v;
        this.z *= v;
        return this
    };
    prototype.divide = function(v) {
        this.x /= v;
        this.y /= v;
        this.z /= v;
        return this
    };
    prototype.limit = function(max) {
        if (this.length() > max) {
            this.normalize();
            this.multiply(max)
        }
    };
    prototype.heading2D = function() {
        var angle = Math.atan2(-this.y, this.x);
        return -angle
    };
    prototype.lerp = function(v, alpha) {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;
        return this
    };
    prototype.deltaLerp = function(v, alpha, delta) {
        delta = delta || 1;
        for (var i = 0; i < delta; i++) {
            var f = alpha;
            this.x += ((v.x - this.x) * alpha);
            this.y += ((v.y - this.y) * alpha);
            this.z += ((v.z - this.z) * alpha)
        }
        return this
    };
    prototype.interp = function(v, alpha, ease, dist) {
        if (!Vector3.__TEMP__) {
            Vector3.__TEMP__ = new Vector3()
        }
        dist = dist || 5000;
        var a = 0;
        var f = TweenManager.Interpolation.convertEase(ease);
        var calc = Vector3.__TEMP__;
        calc.subVectors(this, v);
        var dist = Utils.clamp(Utils.range(calc.lengthSq(), 0, (dist * dist), 1, 0), 0, 1) * (alpha / 10);
        if (typeof f === "function") {
            a = f(dist)
        } else {
            a = TweenManager.Interpolation.solve(f, dist)
        }
        this.x += (v.x - this.x) * a;
        this.y += (v.y - this.y) * a;
        this.z += (v.z - this.z) * a
    };
    prototype.setAngleRadius = function(a, r) {
        this.x = Math.cos(a) * r;
        this.y = Math.sin(a) * r;
        this.z = Math.sin(a) * r;
        return this
    };
    prototype.addAngleRadius = function(a, r) {
        this.x += Math.cos(a) * r;
        this.y += Math.sin(a) * r;
        this.z += Math.sin(a) * r;
        return this
    };
    prototype.dot = function(a, b) {
        b = b || this;
        return a.x * b.x + a.y * b.y + a.z * b.z
    };
    prototype.clone = function() {
        return new Vector3(this.x, this.y, this.z)
    };
    prototype.cross = function(a, b) {
        if (!b) {
            b = this
        }
        var x = a.y * b.z - a.z * b.y;
        var y = a.z * b.x - a.x * b.z;
        var z = a.x * b.y - a.y * b.x;
        this.set(x, y, z, this.w);
        return this
    };
    prototype.distanceTo = function(v, noSq) {
        var dx = this.x - v.x;
        var dy = this.y - v.y;
        var dz = this.z - v.z;
        if (!noSq) {
            return Math.sqrt(dx * dx + dy * dy + dz * dz)
        }
        return dx * dx + dy * dy + dz * dz
    };
    prototype.solveAngle = function(a, b) {
        if (!b) {
            b = this
        }
        return Math.acos(a.dot(b) / ((a.length() * b.length()) || 0.00001))
    };
    prototype.equals = function(v) {
        return this.x == v.x && this.y == v.y && this.z == v.z
    };
    prototype.console = function() {
        console.log(this.x, this.y, this.z)
    };
    prototype.toString = function(split) {
        split = split || " ";
        return this.x + split + this.y + split + this.z
    };
    prototype.applyQuaternion = function(q) {
        var x = this.x,
            y = this.y,
            z = this.z;
        var qx = q.x,
            qy = q.y,
            qz = q.z,
            qw = q.w;
        var ix = qw * x + qy * z - qz * y;
        var iy = qw * y + qz * x - qx * z;
        var iz = qw * z + qx * y - qy * x;
        var iw = -qx * x - qy * y - qz * z;
        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        return this
    }
}, function() {
    Vector3.__TEMP__ = new Vector3()
});
Mobile.Class(function Accelerometer() {
    var _this = this;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.alpha = 0;
    this.beta = 0;
    this.gamma = 0;
    this.heading = 0;
    this.rotationRate = {};
    this.rotationRate.alpha = 0;
    this.rotationRate.beta = 0;
    this.rotationRate.gamma = 0;
    this.toRadians = Mobile.os == "iOS" ? Math.PI / 180 : 1;
    HydraEvents.createLocalEmitter(this);

    function updateAccel(e) {
        switch (window.orientation) {
            case 0:
                _this.x = -e.accelerationIncludingGravity.x;
                _this.y = e.accelerationIncludingGravity.y;
                _this.z = e.accelerationIncludingGravity.z;
                if (e.rotationRate) {
                    _this.rotationRate.alpha = e.rotationRate.beta * _this.toRadians;
                    _this.rotationRate.beta = -e.rotationRate.alpha * _this.toRadians;
                    _this.rotationRate.gamma = e.rotationRate.gamma * _this.toRadians
                }
                break;
            case 180:
                _this.x = e.accelerationIncludingGravity.x;
                _this.y = -e.accelerationIncludingGravity.y;
                _this.z = e.accelerationIncludingGravity.z;
                if (e.rotationRate) {
                    _this.rotationRate.alpha = -e.rotationRate.beta * _this.toRadians;
                    _this.rotationRate.beta = e.rotationRate.alpha * _this.toRadians;
                    _this.rotationRate.gamma = e.rotationRate.gamma * _this.toRadians
                }
                break;
            case 90:
                _this.x = e.accelerationIncludingGravity.y;
                _this.y = e.accelerationIncludingGravity.x;
                _this.z = e.accelerationIncludingGravity.z;
                if (e.rotationRate) {
                    _this.rotationRate.alpha = e.rotationRate.alpha * _this.toRadians;
                    _this.rotationRate.beta = e.rotationRate.beta * _this.toRadians;
                    _this.rotationRate.gamma = e.rotationRate.gamma * _this.toRadians
                }
                break;
            case -90:
                _this.x = -e.accelerationIncludingGravity.y;
                _this.y = -e.accelerationIncludingGravity.x;
                _this.z = e.accelerationIncludingGravity.z;
                if (e.rotationRate) {
                    _this.rotationRate.alpha = -e.rotationRate.alpha * _this.toRadians;
                    _this.rotationRate.beta = -e.rotationRate.beta * _this.toRadians;
                    _this.rotationRate.gamma = e.rotationRate.gamma * _this.toRadians
                }
                break
        }
        _this.fire("motion", null)
    }

    function updateOrientation(e) {
        for (var key in e) {
            if (key.toLowerCase().strpos("heading")) {
                _this.heading = e[key]
            }
        }
        switch (window.orientation) {
            case 0:
                _this.alpha = e.beta * _this.toRadians;
                _this.beta = -e.alpha * _this.toRadians;
                _this.gamma = e.gamma * _this.toRadians;
                break;
            case 180:
                _this.alpha = -e.beta * _this.toRadians;
                _this.beta = e.alpha * _this.toRadians;
                _this.gamma = e.gamma * _this.toRadians;
                break;
            case 90:
                _this.alpha = e.alpha * _this.toRadians;
                _this.beta = e.beta * _this.toRadians;
                _this.gamma = e.gamma * _this.toRadians;
                break;
            case -90:
                _this.alpha = -e.alpha * _this.toRadians;
                _this.beta = -e.beta * _this.toRadians;
                _this.gamma = e.gamma * _this.toRadians;
                break
        }
        _this.tilt = e.beta * _this.toRadians;
        _this.yaw = e.alpha * _this.toRadians;
        _this.roll = -e.gamma * _this.toRadians;
        if (Mobile.os == "Android") {
            _this.heading = compassHeading(e.alpha, e.beta, e.gamma)
        }
        _this.fire("orientation", null)
    }

    function compassHeading(alpha, beta, gamma) {
        var degtorad = Math.PI / 180;
        var _x = beta ? beta * degtorad : 0;
        var _y = gamma ? gamma * degtorad : 0;
        var _z = alpha ? alpha * degtorad : 0;
        var cX = Math.cos(_x);
        var cY = Math.cos(_y);
        var cZ = Math.cos(_z);
        var sX = Math.sin(_x);
        var sY = Math.sin(_y);
        var sZ = Math.sin(_z);
        var Vx = -cZ * sY - sZ * sX * cY;
        var Vy = -sZ * sY + cZ * sX * cY;
        var compassHeading = Math.atan(Vx / Vy);
        if (Vy < 0) {
            compassHeading += Math.PI
        } else {
            if (Vx < 0) {
                compassHeading += 2 * Math.PI
            }
        }
        return compassHeading * (180 / Math.PI)
    }
    this.capture = function() {
        if (!this.active) {
            this.active = true;
            window.ondevicemotion = updateAccel;
            window.addEventListener("deviceorientation", updateOrientation)
        }
    };
    this.stop = function() {
        this.active = false;
        window.ondevicemotion = null;
        _this.x = _this.y = _this.z = 0;
        window.removeEventListener("deviceorientation", updateOrientation)
    }
}, "Static");
Mobile.Class(function ScreenLock() {
    Inherit(this, Component);
    var _this = this;
    var _lockedNodes = [];
    (function() {
        addListeners()
    })();

    function addListeners() {
        _this.events.subscribe(HydraEvents.RESIZE, orientationChange)
    }

    function orientationChange() {
        var width = document.body.clientWidth;
        var height = document.body.clientHeight;
        _lockedNodes.forEach(function(e) {
            if (Device.getFullscreen() && window.screen && window.screen.orientation.lock) {
                window.screen.orientation.lock(e.orientation == "portrait" ? "portrait" : "landscape");
                if (!Mobile.ScreenLock.FORCE_LOCK) {
                    return
                }
                e.object.size(width, height);
                e.object.div.style.transformOrigin = "";
                e.object.div.style.transform = "";
                return
            }
            if (!Mobile.ScreenLock.FORCE_LOCK) {
                return
            }
            if (width < height) {
                e.object.size(width, height);
                e.object.div.style.transformOrigin = "";
                e.object.div.style.transform = ""
            } else {
                var w = width;
                var h = height;
                width = Math.max(w, h);
                height = Math.min(w, h);
                e.object.size(height, width);
                e.object.div.style.transformOrigin = "0% 0%";
                if (window.orientation == -90 || window.orientation == 180) {
                    e.object.div.style.transform = "translateX(" + width + "px) rotate(90deg)"
                } else {
                    e.object.div.style.transform = "translateY(" + height + "px) rotate(-90deg)"
                }
            }
        })
    }
    this.lock = function(orientation) {
        _lockedNodes.push({
            object: Stage,
            orientation: orientation
        });
        orientationChange()
    };
    this.unlock = function() {
        var obj = Stage;
        _lockedNodes.every(function(o, i) {
            if (o.object == obj) {
                _lockedNodes.splice(i, 1);
                return false
            }
            return true
        })
    };
    this.forceOrientationChange = orientationChange
}, "static");
Class(function ParticlePhysics(_integrator) {
    Inherit(this, Component);
    var _this = this;
    _integrator = _integrator || new EulerIntegrator();
    var _timestep = 1 / 60;
    var _time = 0;
    var _step = 0;
    var _clock = null;
    var _buffer = 0;
    var _toDelete = [];
    this.friction = 1;
    this.maxSteps = 1;
    this.emitters = new LinkedList();
    this.initializers = new LinkedList();
    this.behaviors = new LinkedList();
    this.particles = new LinkedList();
    this.springs = new LinkedList();

    function init(p) {
        var i = _this.initializers.start();
        while (i) {
            i(p);
            i = _this.initializers.next()
        }
    }

    function updateSprings(dt) {
        var s = _this.springs.start();
        while (s) {
            s.update(dt);
            s = _this.springs.next()
        }
    }

    function deleteParticles() {
        for (var i = _toDelete.length - 1; i > -1; i--) {
            var particle = _toDelete[i];
            _this.particles.remove(particle);
            particle.system = null
        }
        _toDelete.length = 0
    }

    function updateParticles(dt) {
        var index = 0;
        var p = _this.particles.start();
        while (p) {
            if (!p.disabled) {
                var b = _this.behaviors.start();
                while (b) {
                    b.applyBehavior(p, dt, index);
                    b = _this.behaviors.next()
                }
                if (p.behaviors.length) {
                    p.update(dt, index)
                }
            }
            index++;
            p = _this.particles.next()
        }
    }

    function integrate(dt) {
        updateParticles(dt);
        if (_this.springs.length) {
            updateSprings(dt)
        }
        if (!_this.skipIntegration) {
            _integrator.integrate(_this.particles, dt, _this.friction)
        }
    }
    this.addEmitter = function(emitter) {
        if (!(emitter instanceof Emitter)) {
            throw "Emitter must be Emitter"
        }
        this.emitters.push(emitter);
        emitter.parent = emitter.system = this
    };
    this.removeEmitter = function(emitter) {
        if (!(emitter instanceof Emitter)) {
            throw "Emitter must be Emitter"
        }
        this.emitters.remove(emitter);
        emitter.parent = emitter.system = null
    };
    this.addInitializer = function(init) {
        if (typeof init !== "function") {
            throw "Initializer must be a function"
        }
        this.initializers.push(init)
    };
    this.removeInitializer = function(init) {
        this.initializers.remove(init)
    };
    this.addBehavior = function(b) {
        this.behaviors.push(b);
        b.system = this
    };
    this.removeBehavior = function(b) {
        this.behaviors.remove(b)
    };
    this.addParticle = function(p) {
        if (!_integrator.type) {
            if (typeof p.pos.z === "number") {
                _integrator.type = "3D"
            } else {
                _integrator.type = "2D"
            }
        }
        p.system = this;
        this.particles.push(p);
        if (this.initializers.length) {
            init(p)
        }
    };
    this.removeParticle = function(p) {
        p.system = null;
        _toDelete.push(p)
    };
    this.addSpring = function(s) {
        s.system = this;
        this.springs.push(s)
    };
    this.removeSpring = function(s) {
        s.system = null;
        this.springs.remove(s)
    };
    this.update = function(force) {
        if (!_clock) {
            _clock = THREAD ? Date.now() : Render.TIME
        }
        var time = THREAD ? Date.now() : Render.TIME;
        var delta = time - _clock;
        if (!force && delta <= 0) {
            return
        }
        delta *= 0.001;
        _clock = time;
        _buffer += delta;
        if (!force) {
            var i = 0;
            while (_buffer >= _timestep && i++ < _this.maxSteps) {
                integrate(_timestep);
                _buffer -= _timestep;
                _time += _timestep
            }
        } else {
            integrate(0.016)
        }
        _step = Date.now() - time;
        if (_toDelete.length) {
            deleteParticles()
        }
    }
});
Class(function Particle(_pos, _mass, _radius) {
    var _this = this;
    var _vel, _acc, _old;
    var prototype = Particle.prototype;
    this.mass = _mass || 1;
    this.massInv = 1 / this.mass;
    this.radius = _radius || 1;
    this.radiusSq = this.radius * this.radius;
    this.behaviors = new LinkedList();
    this.fixed = false;
    (function() {
        initVectors()
    })();

    function initVectors() {
        var Vector = typeof _pos.z === "number" ? Vector3 : Vector2;
        _pos = _pos || new Vector();
        _vel = new Vector();
        _acc = new Vector();
        _old = {};
        _old.pos = new Vector();
        _old.acc = new Vector();
        _old.vel = new Vector();
        _old.pos.copyFrom(_pos);
        _this.pos = _this.position = _pos;
        _this.vel = _this.velocity = _vel;
        _this.acc = _this.acceleration = _acc;
        _this.old = _old
    }
    this.moveTo = function(pos) {
        _pos.copyFrom(pos);
        _old.pos.copyFrom(_pos);
        _acc.clear();
        _vel.clear()
    };
    if (typeof prototype.setMass !== "undefined") {
        return
    }
    prototype.setMass = function(mass) {
        this.mass = mass || 1;
        this.massInv = 1 / this.mass
    };
    prototype.setRadius = function(radius) {
        this.radius = radius;
        this.radiusSq = radius * radius
    };
    prototype.update = function(dt) {
        if (!this.behaviors.length) {
            return
        }
        var b = this.behaviors.start();
        while (b) {
            b.applyBehavior(this, dt);
            b = this.behaviors.next()
        }
    };
    prototype.applyForce = function(force) {
        this.acc.add(force)
    };
    prototype.addBehavior = function(behavior) {
        if (!behavior || typeof behavior.applyBehavior === "undefined") {
            throw "Behavior must have applyBehavior method"
        }
        this.behaviors.push(behavior)
    };
    prototype.removeBehavior = function(behavior) {
        if (!behavior || typeof behavior.applyBehavior === "undefined") {
            throw "Behavior must have applyBehavior method"
        }
        this.behaviors.remove(behavior)
    }
});
Class(function EulerIntegrator() {
    Inherit(this, Component);
    var _this = this;
    var _vel, _accel;
    this.useDeltaTime = false;
    (function() {})();

    function createVectors() {
        var Vector = _this.type == "3D" ? Vector3 : Vector2;
        _vel = new Vector();
        _accel = new Vector()
    }
    this.integrate = function(particles, dt, drag) {
        if (!_vel) {
            createVectors()
        }
        var dtSq = dt * dt;
        var p = particles.start();
        while (p) {
            if (!p.fixed && !p.disabled) {
                p.old.pos.copyFrom(p.pos);
                p.acc.multiply(p.massInv);
                _vel.copyFrom(p.vel);
                _accel.copyFrom(p.acc);
                if (this.useDeltaTime) {
                    p.pos.add(_vel.multiply(dt)).add(_accel.multiply(0.5 * dtSq));
                    p.vel.add(p.acc.multiply(dt))
                } else {
                    p.pos.add(_vel).add(_accel.multiply(0.5));
                    p.vel.add(p.acc)
                }
                if (drag) {
                    p.vel.multiply(drag)
                }
                p.acc.clear()
            }
            if (p.saveTo) {
                p.pos.copyTo(p.saveTo)
            }
            p = particles.next()
        }
    }
});
Class(function Force(_force) {
    Inherit(this, Component);
    var _this = this;
    this.force = _force;
    if (!_force) {
        throw "Force requires parameter Vector"
    }
    this.applyBehavior = function(p, dt) {
        p.acc.add(_force)
    }
});
Class(function Emitter(_position, _startNumber) {
    Inherit(this, Component);
    var _this = this;
    var _pool;
    var _total = 0;
    var Vector = _position.type == "vector3" ? Vector3 : Vector2;
    this.initializers = [];
    this.position = _position;
    this.autoEmit = 1;
    (function() {
        initObjectPool();
        if (_startNumber != 0) {
            addParticles(_startNumber || 100)
        }
    })();

    function initObjectPool() {
        _pool = _this.initClass(ObjectPool)
    }

    function addParticles(total) {
        _total += total;
        var particles = [];
        for (var i = 0; i < total; i++) {
            particles.push(new Particle())
        }
        _pool.insert(particles)
    }
    this.addInitializer = function(callback) {
        if (typeof callback !== "function") {
            throw "Initializer must be a function"
        }
        this.initializers.push(callback)
    };
    this.removeInitializer = function(callback) {
        var index = this.initializers.indexOf(callback);
        if (index > -1) {
            this.initializers.splice(index, 1)
        }
    };
    this.emit = function(num) {
        if (!this.parent) {
            throw "Emitter needs to be added to a System"
        }
        num = num || this.autoEmit;
        for (var i = 0; i < num; i++) {
            var p = _pool.get();
            if (!p) {
                return
            }
            p.moveTo(this.position);
            p.emitter = this;
            p.enabled = true;
            if (!p.system) {
                this.parent.addParticle(p)
            }
            for (var j = 0; j < this.initializers.length; j++) {
                this.initializers[j](p, i / num)
            }
        }
    };
    this.remove = function(particle) {
        _pool.put(particle);
        if (!_this.persist) {
            _this.parent.removeParticle(particle)
        }
        particle.enabled = false
    };
    this.addToPool = function(particle) {
        _pool.put(particle);
        if (!_this.persist && particle.system) {
            _this.parent.removeParticle(particle)
        }
        particle.enabled = false
    }
});
Class(function SplitTextfield() {
    var _style = {
        display: "block",
        position: "relative",
        padding: 0,
        margin: 0,
        cssFloat: "left",
        styleFloat: "left",
        width: "auto",
        height: "auto"
    };

    function splitLetter($obj) {
        var _array = [];
        var text = $obj.div.innerHTML;
        var split = text.split("");
        $obj.div.innerHTML = "";
        for (var i = 0; i < split.length; i++) {
            if (split[i] == " ") {
                split[i] = "&nbsp;"
            }
            var letter = $("t", "span");
            letter.html(split[i], true).css(_style);
            _array.push(letter);
            $obj.addChild(letter)
        }
        return _array
    }

    function splitWord($obj) {
        var _array = [];
        var text = $obj.div.innerHTML;
        var split = text.split(" ");
        $obj.empty();
        for (var i = 0; i < split.length; i++) {
            var word = $("t", "span");
            var empty = $("t", "span");
            word.html(split[i]).css(_style);
            empty.html("&nbsp", true).css(_style);
            _array.push(word);
            _array.push(empty);
            $obj.addChild(word);
            $obj.addChild(empty)
        }
        return _array
    }
    this.split = function($obj, by) {
        if (by == "word") {
            return splitWord($obj)
        } else {
            return splitLetter($obj)
        }
    }
}, "Static");
Class(function CSSAnimation() {
    Inherit(this, Component);
    var _this = this;
    var _name = "a" + Utils.timestamp();
    var _frames, _timer, _started;
    var _duration = 1000;
    var _ease = "linear";
    var _delay = 0;
    var _loop = false;
    var _count = 1;
    var _steps = null;
    var _applyTo = [];
    (function() {})();

    function complete() {
        _this.playing = false;
        if (_this.events) {
            _this.events.fire(HydraEvents.COMPLETE, null, true)
        }
    }

    function updateCSS() {
        var css = CSS._read();
        var id = "/*" + _name + "*/";
        var keyframe = "@" + Device.vendor + "keyframes " + _name + " {\n";
        var string = id + keyframe;
        if (css.strpos(_name)) {
            var split = css.split(id);
            css = css.replace(id + split[1] + id, "")
        }
        var steps = _frames.length - 1;
        var perc = Math.round(100 / steps);
        var total = 0;
        for (var i = 0; i < _frames.length; i++) {
            var frame = _frames[i];
            if (i == _frames.length - 1) {
                total = 100
            }
            string += (frame.percent || total) + "% {\n";
            var hasTransform = false;
            var transforms = {};
            var styles = {};
            for (var key in frame) {
                if (TweenManager.checkTransform(key)) {
                    transforms[key] = frame[key];
                    hasTransform = true
                } else {
                    styles[key] = frame[key]
                }
            }
            if (hasTransform) {
                string += Device.vendor + "transform: " + TweenManager.parseTransform(transforms) + ";"
            }
            for (key in styles) {
                var val = styles[key];
                if (typeof val !== "string" && key != "opacity" && key != "zIndex") {
                    val += "px"
                }
                string += CSS._toCSS(key) + ": " + val + ";"
            }
            string += "\n}\n";
            total += perc
        }
        string += "}" + id;
        css += string;
        CSS._write(css)
    }

    function destroy() {
        var css = CSS._read();
        var id = "/*" + _name + "*/";
        if (css.strpos(_name)) {
            var split = css.split(id);
            css = css.replace(id + split[1] + id, "")
        }
        CSS._write(css)
    }

    function applyTo(callback) {
        for (var i = _applyTo.length - 1; i > -1; i--) {
            callback(_applyTo[i])
        }
    }
    this.set("frames", function(frames) {
        _frames = frames;
        updateCSS()
    });
    this.set("steps", function(steps) {
        _steps = steps;
        if (_this.playing) {
            applyTo(function($obj) {
                $obj.div.style[CSS.prefix("AnimationTimingFunction")] = "steps(" + steps + ")"
            })
        }
    });
    this.set("duration", function(duration) {
        _duration = Math.round(duration);
        if (_this.playing) {
            applyTo(function($obj) {
                $obj.div.style[CSS.prefix("AnimationDuration")] = _this.duration + "ms"
            })
        }
    });
    this.get("duration", function() {
        return _duration
    });
    this.set("ease", function(ease) {
        _ease = ease;
        if (_this.playing) {
            applyTo(function($obj) {
                $obj.div.style[CSS.prefix("AnimationTimingFunction")] = TweenManager.getEase(_ease)
            })
        }
    });
    this.get("ease", function() {
        return _ease
    });
    this.set("loop", function(loop) {
        _loop = loop;
        if (_this.playing) {
            applyTo(function($obj) {
                $obj.div.style[CSS.prefix("AnimationIterationCount")] = _loop ? "infinite" : _count
            })
        }
    });
    this.get("loop", function() {
        return _loop
    });
    this.set("count", function(count) {
        _count = count;
        if (_this.playing) {
            applyTo(function($obj) {
                $obj.div.style[CSS.prefix("AnimationIterationCount")] = _loop ? "infinite" : _count
            })
        }
    });
    this.get("count", function() {
        return _count
    });
    this.set("delay", function(delay) {
        _delay = delay;
        if (_this.playing) {
            applyTo(function($obj) {
                $obj.div.style[CSS.prefix("AnimationDelay")] = _delay + "ms"
            })
        }
    });
    this.get("delay", function() {
        return _delay
    });
    this.play = function() {
        applyTo(function($obj) {
            defer(function() {
                $obj.div.style[CSS.prefix("Animation")] = _name + " " + _this.duration + "ms " + (_steps ? "steps(" + _steps + ")" : TweenManager.getEase(_ease)) + " " + (_loop ? "infinite" : _count);
                $obj.div.style[CSS.prefix("AnimationPlayState")] = "running"
            })
        });
        _this.playing = true;
        clearTimeout(_timer);
        if (!_this.loop) {
            _started = Date.now();
            _timer = _this.delayedCall(complete, _count * _duration)
        }
    };
    this.pause = function() {
        _this.playing = false;
        clearTimeout(_timer);
        applyTo(function($obj) {
            $obj.div.style[CSS.prefix("AnimationPlayState")] = "paused"
        })
    };
    this.stop = function() {
        _this.playing = false;
        clearTimeout(_timer);
        applyTo(function($obj) {
            $obj.div.style[CSS.prefix("AnimationName")] = ""
        })
    };
    this.applyTo = function($obj) {
        _applyTo.push($obj);
        if (_this.playing) {
            defer(function() {
                $obj.div.style[CSS.prefix("Animation")] = _name + " " + _this.duration + "ms " + (_steps ? "steps(" + _steps + ")" : TweenManager.getEase(_ease)) + " " + (_loop ? "infinite" : _count);
                $obj.div.style[CSS.prefix("AnimationPlayState")] = "running"
            })
        }
    };
    this.remove = function($obj) {
        $obj.div.style[CSS.prefix("AnimationName")] = "";
        var i = _applyTo.indexOf($obj);
        if (i > -1) {
            _applyTo.splice(i, 1)
        }
    };
    this.destroy = function() {
        if (!this._destroy) {
            return
        }
        this.stop();
        _frames = null;
        destroy();
        return this._destroy()
    }
});
Class(function TweenManager() {
    Namespace(this);
    var _this = this;
    var _tweens = [];
    (function() {
        if (window.Hydra) {
            Hydra.ready(initPools)
        }
        if (window.Render) {
            Render.startRender(updateTweens)
        }
    })();

    function initPools() {
        _this._dynamicPool = new ObjectPool(DynamicObject, 100);
        _this._arrayPool = new ObjectPool(Array, 100);
        _this._dynamicPool.debug = true
    }

    function updateTweens(time) {
        for (var i = 0; i < _tweens.length; i++) {
            _tweens[i].update(time)
        }
    }

    function stringToValues(str) {
        var values = str.split("(")[1].slice(0, -1).split(",");
        for (var i = 0; i < values.length; i++) {
            values[i] = parseFloat(values[i])
        }
        return values
    }

    function findEase(name) {
        var eases = _this.CSSEases;
        for (var i = eases.length - 1; i > -1; i--) {
            if (eases[i].name == name) {
                return eases[i]
            }
        }
        return false
    }
    this._addMathTween = function(tween) {
        _tweens.push(tween)
    };
    this._removeMathTween = function(tween) {
        _tweens.findAndRemove(tween)
    };
    this._detectTween = function(object, props, time, ease, delay, callback) {
        if (ease === "spring") {
            return new SpringTween(object, props, time, ease, delay, callback)
        }
        if (!_this.useCSSTrans(props, ease, object)) {
            return new FrameTween(object, props, time, ease, delay, callback)
        } else {
            if (Device.tween.webAnimation) {
                return new CSSWebAnimation(object, props, time, ease, delay, callback)
            } else {
                return new CSSTransition(object, props, time, ease, delay, callback)
            }
        }
    };
    this.tween = function(obj, props, time, ease, delay, complete, update, manual) {
        if (typeof delay !== "number") {
            update = complete;
            complete = delay;
            delay = 0
        }
        if (ease === "spring") {
            return new SpringTween(obj, props, time, ease, delay, update, complete)
        } else {
            return new MathTween(obj, props, time, ease, delay, update, complete, manual)
        }
    };
    this.iterate = function(array, props, time, ease, offset, delay, callback) {
        if (typeof delay !== "number") {
            callback = delay;
            delay = 0
        }
        props = new DynamicObject(props);
        if (!array.length) {
            throw "TweenManager.iterate :: array is empty"
        }
        var len = array.length;
        for (var i = 0; i < len; i++) {
            var obj = array[i];
            var complete = i == len - 1 ? callback : null;
            obj.tween(props.copy(), time, ease, delay + (offset * i), complete)
        }
    };
    this.clearTween = function(obj) {
        if (obj._mathTween && obj._mathTween.stop) {
            obj._mathTween.stop()
        }
        if (obj._mathTweens) {
            var tweens = obj._mathTweens;
            for (var i = 0; i < tweens.length; i++) {
                var tw = tweens[i];
                if (tw && tw.stop) {
                    tw.stop()
                }
            }
            obj._mathTweens = null
        }
    };
    this.clearCSSTween = function(obj) {
        if (obj && !obj._cssTween && obj.div._transition && !obj.persistTween) {
            obj.div.style[Device.styles.vendorTransition] = "";
            obj.div._transition = false;
            obj._cssTween = null
        }
    };
    this.checkTransform = function(key) {
        var index = _this.Transforms.indexOf(key);
        return index > -1
    };
    this.addCustomEase = function(ease) {
        var add = true;
        if (typeof ease !== "object" || !ease.name || !ease.curve) {
            throw "TweenManager :: addCustomEase requires {name, curve}"
        }
        for (var i = _this.CSSEases.length - 1; i > -1; i--) {
            if (ease.name == _this.CSSEases[i].name) {
                add = false
            }
        }
        if (add) {
            if (ease.curve.charAt(0).toLowerCase() == "m") {
                ease.path = new EasingPath(ease.curve)
            } else {
                ease.values = stringToValues(ease.curve)
            }
            _this.CSSEases.push(ease)
        }
        return ease
    };
    this.getEase = function(name, values) {
        if (Array.isArray(name)) {
            var c1 = findEase(name[0]);
            var c2 = findEase(name[1]);
            if (!c1 || !c2) {
                throw "Multi-ease tween missing values " + JSON.stringify(name)
            }
            if (!c1.values) {
                c1.values = stringToValues(c1.curve)
            }
            if (!c2.values) {
                c2.values = stringToValues(c2.curve)
            }
            if (values) {
                return [c1.values[0], c1.values[1], c2.values[2], c2.values[3]]
            }
            return "cubic-bezier(" + c1.values[0] + "," + c1.values[1] + "," + c2.values[2] + "," + c2.values[3] + ")"
        } else {
            var ease = findEase(name);
            if (!ease) {
                return false
            }
            if (values) {
                return ease.path ? ease.path.solve : ease.values
            } else {
                return ease.curve
            }
        }
    };
    this.inspectEase = function(name) {
        return findEase(name)
    };
    this.getAllTransforms = function(object) {
        var obj = {};
        for (var i = _this.Transforms.length - 1; i > -1; i--) {
            var tf = _this.Transforms[i];
            var val = object[tf];
            if (val !== 0 && typeof val === "number") {
                obj[tf] = val
            }
        }
        return obj
    };
    this.parseTransform = function(props) {
        var transforms = "";
        var translate = "";
        if (props.perspective > 0) {
            transforms += "perspective(" + props.perspective + "px)"
        }
        if (typeof props.x !== "undefined" || typeof props.y !== "undefined" || typeof props.z !== "undefined") {
            var x = (props.x || 0);
            var y = (props.y || 0);
            var z = (props.z || 0);
            translate += x + "px, ";
            translate += y + "px";
            if (Device.tween.css3d) {
                translate += ", " + z + "px";
                transforms += "translate3d(" + translate + ")"
            } else {
                transforms += "translate(" + translate + ")"
            }
        }
        if (typeof props.scale !== "undefined") {
            transforms += "scale(" + props.scale + ")"
        } else {
            if (typeof props.scaleX !== "undefined") {
                transforms += "scaleX(" + props.scaleX + ")"
            }
            if (typeof props.scaleY !== "undefined") {
                transforms += "scaleY(" + props.scaleY + ")"
            }
        }
        if (typeof props.rotation !== "undefined") {
            transforms += "rotate(" + props.rotation + "deg)"
        }
        if (typeof props.rotationX !== "undefined") {
            transforms += "rotateX(" + props.rotationX + "deg)"
        }
        if (typeof props.rotationY !== "undefined") {
            transforms += "rotateY(" + props.rotationY + "deg)"
        }
        if (typeof props.rotationZ !== "undefined") {
            transforms += "rotateZ(" + props.rotationZ + "deg)"
        }
        if (typeof props.skewX !== "undefined") {
            transforms += "skewX(" + props.skewX + "deg)"
        }
        if (typeof props.skewY !== "undefined") {
            transforms += "skewY(" + props.skewY + "deg)"
        }
        return transforms
    };
    this.interpolate = function(num, alpha, ease) {
        var fn = _this.Interpolation.convertEase(ease);
        return num * (typeof fn == "function" ? fn(alpha) : _this.Interpolation.solve(fn, alpha))
    };
    this.interpolateValues = function(start, end, alpha, ease) {
        var fn = _this.Interpolation.convertEase(ease);
        return start + (end - start) * (typeof fn == "function" ? fn(alpha) : _this.Interpolation.solve(fn, alpha))
    }
}, "Static");
(function() {
    TweenManager.Transforms = ["scale", "scaleX", "scaleY", "x", "y", "z", "rotation", "rotationX", "rotationY", "rotationZ", "skewX", "skewY", "perspective", ];
    TweenManager.CSSEases = [{
        name: "easeOutCubic",
        curve: "cubic-bezier(0.215, 0.610, 0.355, 1.000)"
    }, {
        name: "easeOutQuad",
        curve: "cubic-bezier(0.250, 0.460, 0.450, 0.940)"
    }, {
        name: "easeOutQuart",
        curve: "cubic-bezier(0.165, 0.840, 0.440, 1.000)"
    }, {
        name: "easeOutQuint",
        curve: "cubic-bezier(0.230, 1.000, 0.320, 1.000)"
    }, {
        name: "easeOutSine",
        curve: "cubic-bezier(0.390, 0.575, 0.565, 1.000)"
    }, {
        name: "easeOutExpo",
        curve: "cubic-bezier(0.190, 1.000, 0.220, 1.000)"
    }, {
        name: "easeOutCirc",
        curve: "cubic-bezier(0.075, 0.820, 0.165, 1.000)"
    }, {
        name: "easeOutBack",
        curve: "cubic-bezier(0.175, 0.885, 0.320, 1.275)"
    }, {
        name: "easeInCubic",
        curve: "cubic-bezier(0.550, 0.055, 0.675, 0.190)"
    }, {
        name: "easeInQuad",
        curve: "cubic-bezier(0.550, 0.085, 0.680, 0.530)"
    }, {
        name: "easeInQuart",
        curve: "cubic-bezier(0.895, 0.030, 0.685, 0.220)"
    }, {
        name: "easeInQuint",
        curve: "cubic-bezier(0.755, 0.050, 0.855, 0.060)"
    }, {
        name: "easeInSine",
        curve: "cubic-bezier(0.470, 0.000, 0.745, 0.715)"
    }, {
        name: "easeInCirc",
        curve: "cubic-bezier(0.600, 0.040, 0.980, 0.335)"
    }, {
        name: "easeInBack",
        curve: "cubic-bezier(0.600, -0.280, 0.735, 0.045)"
    }, {
        name: "easeInOutCubic",
        curve: "cubic-bezier(0.645, 0.045, 0.355, 1.000)"
    }, {
        name: "easeInOutQuad",
        curve: "cubic-bezier(0.455, 0.030, 0.515, 0.955)"
    }, {
        name: "easeInOutQuart",
        curve: "cubic-bezier(0.770, 0.000, 0.175, 1.000)"
    }, {
        name: "easeInOutQuint",
        curve: "cubic-bezier(0.860, 0.000, 0.070, 1.000)"
    }, {
        name: "easeInOutSine",
        curve: "cubic-bezier(0.445, 0.050, 0.550, 0.950)"
    }, {
        name: "easeInOutExpo",
        curve: "cubic-bezier(1.000, 0.000, 0.000, 1.000)"
    }, {
        name: "easeInOutCirc",
        curve: "cubic-bezier(0.785, 0.135, 0.150, 0.860)"
    }, {
        name: "easeInOutBack",
        curve: "cubic-bezier(0.680, -0.550, 0.265, 1.550)"
    }, {
        name: "easeInOut",
        curve: "cubic-bezier(.42,0,.58,1)"
    }, {
        name: "linear",
        curve: "linear"
    }];
    TweenManager.useCSSTrans = function(props, ease, object) {
        if (props.math) {
            return false
        }
        if (typeof ease === "string" && (ease.strpos("Elastic") || ease.strpos("Bounce"))) {
            return false
        }
        if (object.multiTween || TweenManager.inspectEase(ease).path) {
            return false
        }
        if (!Device.tween.transition) {
            return false
        }
        return true
    }
})();
Class(function CSSTransition(_object, _props, _time, _ease, _delay, _callback) {
    var _this = this;
    var _transformProps, _transitionProps, _stack, _totalStacks;
    var _startTransform, _startProps;
    this.playing = true;
    (function() {
        if (typeof _time !== "number") {
            throw "CSSTween Requires object, props, time, ease"
        }
        initProperties();
        if (typeof _ease == "object" && !Array.isArray(_ease)) {
            initStack()
        } else {
            initCSSTween()
        }
    })();

    function killed() {
        return !_this || _this.kill || !_object || !_object.div
    }

    function initProperties() {
        var transform = TweenManager.getAllTransforms(_object);
        var properties = [];
        for (var key in _props) {
            if (TweenManager.checkTransform(key)) {
                transform.use = true;
                transform[key] = _props[key];
                delete _props[key]
            } else {
                if (typeof _props[key] === "number" || key.strpos("-")) {
                    properties.push(key)
                }
            }
        }
        if (transform.use) {
            properties.push(Device.transformProperty)
        }
        delete transform.use;
        _transformProps = transform;
        _transitionProps = properties
    }

    function initStack() {
        initStart();
        var prevTime = 0;
        var interpolate = function(start, end, alpha, ease, prev, ke) {
            var last = prev[key];
            if (last) {
                start += last
            }
            return TweenManager.interpolateValues(start, end, alpha, ease)
        };
        _stack = [];
        _totalStacks = 0;
        for (var p in _ease) {
            var perc = p.strpos("%") ? Number(p.replace("%", "")) / 100 : ((Number(p) + 1) / _ease.length);
            if (isNaN(perc)) {
                continue
            }
            var ease = _ease[p];
            _totalStacks++;
            var transform = {};
            var props = {};
            var last = _stack[_stack.length - 1];
            var pr = last ? last.props : {};
            var zeroOut = !last;
            for (var key in _transformProps) {
                if (!_startTransform[key]) {
                    _startTransform[key] = key.strpos("scale") ? 1 : 0
                }
                transform[key] = interpolate(_startTransform[key], _transformProps[key], perc, ease, pr, key);
                if (zeroOut) {
                    pr[key] = _startTransform[key]
                }
            }
            for (key in _props) {
                props[key] = interpolate(_startProps[key], _props[key], perc, ease, pr, key);
                if (zeroOut) {
                    pr[key] = _startProps[key]
                }
            }
            var time = (perc * _time) - prevTime;
            prevTime += time;
            _stack.push({
                percent: perc,
                ease: ease,
                transform: transform,
                props: props,
                delay: _totalStacks == 1 ? _delay : 0,
                time: time
            })
        }
        initCSSTween(_stack.shift())
    }

    function initStart() {
        _startTransform = TweenManager.getAllTransforms(_object);
        var transform = TweenManager.parseTransform(_startTransform);
        if (!transform.length) {
            for (var i = TweenManager.Transforms.length - 1; i > -1; i--) {
                var key = TweenManager.Transforms[i];
                _startTransform[key] = key == "scale" ? 1 : 0
            }
        }
        _startProps = {};
        for (key in _props) {
            _startProps[key] = _object.css(key)
        }
    }

    function initCSSTween(values) {
        if (killed()) {
            return
        }
        if (_object._cssTween) {
            _object._cssTween.kill = true
        }
        _object._cssTween = _this;
        _object.div._transition = true;
        var strings = (function() {
            if (!values) {
                return buildStrings(_time, _ease, _delay)
            } else {
                return buildStrings(values.time, values.ease, values.delay)
            }
        })();
        _object.willChange(strings.props);
        var time = values ? values.time : _time;
        var delay = values ? values.delay : _delay;
        var props = values ? values.props : _props;
        var transformProps = values ? values.transform : _transformProps;
        Timer.create(function() {
            if (killed()) {
                return
            }
            _object.div.style[Device.styles.vendorTransition] = strings.transition;
            _this.playing = true;
            if (Device.browser.safari) {
                Timer.create(function() {
                    if (killed()) {
                        return
                    }
                    _object.css(props);
                    _object.transform(transformProps)
                }, 16)
            } else {
                _object.css(props);
                _object.transform(transformProps)
            }
            Timer.create(function() {
                if (killed()) {
                    return
                }
                if (!_stack) {
                    clearCSSTween();
                    if (_callback) {
                        _callback()
                    }
                } else {
                    executeNextInStack()
                }
            }, time + delay)
        }, 50)
    }

    function executeNextInStack() {
        if (killed()) {
            return
        }
        var values = _stack.shift();
        if (!values) {
            clearCSSTween();
            if (_callback) {
                _callback
            }
        } else {
            var strings = buildStrings(values.time, values.ease, values.delay);
            _object.div.style[Device.styles.vendorTransition] = strings.transition;
            _object.css(values.props);
            _object.transform(values.transform);
            Timer.create(executeNextInStack, values.time)
        }
    }

    function buildStrings(time, ease, delay) {
        var props = "";
        var str = "";
        var len = _transitionProps.length;
        for (var i = 0; i < len; i++) {
            var transitionProp = _transitionProps[i];
            props += (props.length ? ", " : "") + transitionProp;
            str += (str.length ? ", " : "") + transitionProp + " " + time + "ms " + TweenManager.getEase(ease) + " " + delay + "ms"
        }
        return {
            props: props,
            transition: str
        }
    }

    function clearCSSTween() {
        if (killed()) {
            return
        }
        _this.playing = false;
        _object._cssTween = null;
        _object.willChange(null);
        _object = _props = null;
        _this = null;
        Utils.nullObject(this)
    }

    function tweenComplete() {
        if (!_callback && _this.playing) {
            clearCSSTween()
        }
    }
    this.stop = function() {
        if (!this.playing) {
            return
        }
        this.kill = true;
        this.playing = false;
        _object.div.style[Device.styles.vendorTransition] = "";
        _object.div._transition = false;
        _object.willChange(null);
        _object._cssTween = null;
        _this = null;
        Utils.nullObject(this)
    }
});
Class(function FrameTween(_object, _props, _time, _ease, _delay, _callback, _manual) {
    var _this = this;
    var _endValues, _transformEnd, _transformStart, _startValues;
    var _isTransform, _isCSS, _transformProps;
    var _cssTween, _transformTween;
    this.playing = true;
    (function() {
        if (typeof _ease === "object") {
            _ease = "easeOutCubic"
        }
        if (_object && _props) {
            if (typeof _time !== "number") {
                throw "FrameTween Requires object, props, time, ease"
            }
            initValues();
            startTween()
        }
    })();

    function killed() {
        return _this.kill || !_object || !_object.div
    }

    function initValues() {
        if (_props.math) {
            delete _props.math
        }
        if (Device.tween.transition && _object.div._transition) {
            _object.div.style[Device.styles.vendorTransition] = "";
            _object.div._transition = false
        }
        _endValues = new DynamicObject();
        _transformEnd = new DynamicObject();
        _transformStart = new DynamicObject();
        _startValues = new DynamicObject();
        if (!_object.multiTween) {
            if (typeof _props.x === "undefined") {
                _props.x = _object.x
            }
            if (typeof _props.y === "undefined") {
                _props.y = _object.y
            }
            if (typeof _props.z === "undefined") {
                _props.z = _object.z
            }
        }
        for (var key in _props) {
            if (TweenManager.checkTransform(key)) {
                _isTransform = true;
                _transformStart[key] = _object[key] || (key == "scale" ? 1 : 0);
                _transformEnd[key] = _props[key]
            } else {
                _isCSS = true;
                var v = _props[key];
                if (typeof v === "string") {
                    _object.div.style[key] = v
                } else {
                    if (typeof v === "number") {
                        _startValues[key] = Number(_object.css(key));
                        _endValues[key] = v
                    }
                }
            }
        }
    }

    function startTween() {
        if (_object._cssTween && !_manual && !_object.multiTween) {
            _object._cssTween.kill = true
        }
        if (_object.multiTween) {
            if (!_object._cssTweens) {
                _object._cssTweens = []
            }
            _object._cssTweens.push(_this)
        }
        _object._cssTween = _this;
        _this.playing = true;
        _props = _startValues.copy();
        _transformProps = _transformStart.copy();
        if (_isCSS) {
            _cssTween = TweenManager.tween(_props, _endValues, _time, _ease, _delay, tweenComplete, update, _manual)
        }
        if (_isTransform) {
            _transformTween = TweenManager.tween(_transformProps, _transformEnd, _time, _ease, _delay, (!_isCSS ? tweenComplete : null), (!_isCSS ? update : null), _manual)
        }
    }

    function clear() {
        if (_object._cssTweens) {
            _object._cssTweens.findAndRemove(_this)
        }
        _this.playing = false;
        _object._cssTween = null;
        _object = _props = null
    }

    function update() {
        if (killed()) {
            return
        }
        if (_isCSS) {
            _object.css(_props)
        }
        if (_isTransform) {
            if (_object.multiTween) {
                for (var key in _transformProps) {
                    if (typeof _transformProps[key] === "number") {
                        _object[key] = _transformProps[key]
                    }
                }
                _object.transform()
            } else {
                _object.transform(_transformProps)
            }
        }
    }

    function tweenComplete() {
        if (_this.playing) {
            clear();
            if (_callback) {
                _callback()
            }
        }
    }
    this.stop = function() {
        if (!this.playing) {
            return
        }
        if (_cssTween && _cssTween.stop) {
            _cssTween.stop()
        }
        if (_transformTween && _transformTween.stop) {
            _transformTween.stop()
        }
        clear()
    };
    this.interpolate = function(elapsed) {
        if (_cssTween) {
            _cssTween.interpolate(elapsed)
        }
        if (_transformTween) {
            _transformTween.interpolate(elapsed)
        }
        update()
    };
    this.getValues = function() {
        return {
            start: _startValues,
            transformStart: _transformStart,
            end: _endValues,
            transformEnd: _transformEnd,
        }
    };
    this.setEase = function(ease) {
        if (_cssTween) {
            _cssTween.setEase(ease)
        }
        if (_transformTween) {
            _transformTween.setEase(ease)
        }
    }
});
Class(function CSSWebAnimation(_object, _props, _time, _ease, _delay, _callback) {
    var _this = this;
    var _transform, _start, _end, _tween;
    var _properties, _killed, _transformValues, _startTransform;
    (function() {
        if (_object._cssTween) {
            _object._cssTween.stop()
        }
        initProperties();
        initTransform();
        initStart();
        initEnd();
        Render.setupTween(initAnimation)
    })();

    function initProperties() {
        var properties = [];
        var transform = false;
        for (var key in _props) {
            if (TweenManager.checkTransform(key)) {
                transform = true
            } else {
                if (typeof _props[key] === "number" || key.strpos("-")) {
                    properties.push(key)
                }
            }
        }
        if (transform) {
            properties.push(Device.transformProperty)
        }
        _object.willChange(properties);
        if (_object._cssTween) {
            _object._cssTween.kill = true
        }
        _object._cssTween = _this;
        _object.div._transition = true
    }

    function initTransform() {
        var transform = TweenManager.getAllTransforms(_object);
        for (var key in _props) {
            if (TweenManager.checkTransform(key)) {
                transform[key] = _props[key];
                delete _props[key]
            }
        }
        _transformValues = transform;
        _transform = TweenManager.parseTransform(transform)
    }

    function initStart() {
        _startTransform = TweenManager.getAllTransforms(_object);
        var transform = TweenManager.parseTransform(_startTransform);
        if (!transform.length) {
            transform = "translate3d(0, 0, 0)";
            for (var i = TweenManager.Transforms.length - 1; i > -1; i--) {
                var key = TweenManager.Transforms[i];
                _startTransform[key] = key == "scale" ? 1 : 0
            }
        }
        _start = {};
        if (_transform) {
            _start.transform = transform
        }
        for (var key in _props) {
            _start[key] = _object.css(key)
        }
    }

    function initEnd() {
        _end = {};
        if (_transform) {
            _end.transform = _transform
        }
        for (var key in _props) {
            _end[key] = _props[key]
        }
    }

    function initAnimation() {
        _this.playing = true;
        _tween = _object.div.animate([_start, _end], {
            duration: _time,
            delay: _delay,
            easing: TweenManager.getEase(_ease),
            fill: "forwards"
        });
        _tween.addEventListener("finish", tweenComplete)
    }

    function killed() {
        return !_this || _this.kill || !_object || !_object.div
    }

    function clear() {
        _this.playing = false;
        _object = _props = null;
        _this = null;
        _tween = null;
        Utils.nullObject(this)
    }

    function applyValues() {
        _object.css(_props);
        _object.transform(_transformValues)
    }

    function interpolate(start, end, alpha) {
        return TweenManager.interpolate(start + (end - start), alpha, _ease)
    }

    function stopValues() {
        if (!_tween) {
            return
        }
        var elapsed = _tween.currentTime / _time;
        var transform = {};
        var css = {};
        for (var key in _transformValues) {
            transform[key] = interpolate(_startTransform[key], _transformValues[key], elapsed)
        }
        for (key in _props) {
            css[key] = TweenManager.interpolate(_start[key], _props[key], elapsed)
        }
        _object.css(css);
        _object.transform(transform)
    }

    function tweenComplete() {
        if (killed()) {
            return
        }
        applyValues();
        _object.willChange(null);
        if (_callback) {
            Render.nextFrame(_callback)
        }
        clear()
    }
    this.stop = function() {
        if (!_this || !_this.playing) {
            return
        }
        stopValues();
        _this.kill = true;
        _this.playing = false;
        _object.willChange(null);
        _tween.pause();
        clear()
    }
});
TweenManager.Class(function Interpolation() {
    function calculateBezier(aT, aA1, aA2) {
        return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT
    }

    function getTForX(aX, mX1, mX2) {
        var aGuessT = aX;
        for (var i = 0; i < 4; i++) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope == 0) {
                return aGuessT
            }
            var currentX = calculateBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope
        }
        return aGuessT
    }

    function getSlope(aT, aA1, aA2) {
        return 3 * A(aA1, aA2) * aT * aT + 2 * B(aA1, aA2) * aT + C(aA1)
    }

    function A(aA1, aA2) {
        return 1 - 3 * aA2 + 3 * aA1
    }

    function B(aA1, aA2) {
        return 3 * aA2 - 6 * aA1
    }

    function C(aA1) {
        return 3 * aA1
    }
    this.convertEase = function(ease) {
        var fn = (function() {
            switch (ease) {
                case "easeInQuad":
                    return TweenManager.Interpolation.Quad.In;
                    break;
                case "easeInCubic":
                    return TweenManager.Interpolation.Cubic.In;
                    break;
                case "easeInQuart":
                    return TweenManager.Interpolation.Quart.In;
                    break;
                case "easeInQuint":
                    return TweenManager.Interpolation.Quint.In;
                    break;
                case "easeInSine":
                    return TweenManager.Interpolation.Sine.In;
                    break;
                case "easeInExpo":
                    return TweenManager.Interpolation.Expo.In;
                    break;
                case "easeInCirc":
                    return TweenManager.Interpolation.Circ.In;
                    break;
                case "easeInElastic":
                    return TweenManager.Interpolation.Elastic.In;
                    break;
                case "easeInBack":
                    return TweenManager.Interpolation.Back.In;
                    break;
                case "easeInBounce":
                    return TweenManager.Interpolation.Bounce.In;
                    break;
                case "easeOutQuad":
                    return TweenManager.Interpolation.Quad.Out;
                    break;
                case "easeOutCubic":
                    return TweenManager.Interpolation.Cubic.Out;
                    break;
                case "easeOutQuart":
                    return TweenManager.Interpolation.Quart.Out;
                    break;
                case "easeOutQuint":
                    return TweenManager.Interpolation.Quint.Out;
                    break;
                case "easeOutSine":
                    return TweenManager.Interpolation.Sine.Out;
                    break;
                case "easeOutExpo":
                    return TweenManager.Interpolation.Expo.Out;
                    break;
                case "easeOutCirc":
                    return TweenManager.Interpolation.Circ.Out;
                    break;
                case "easeOutElastic":
                    return TweenManager.Interpolation.Elastic.Out;
                    break;
                case "easeOutBack":
                    return TweenManager.Interpolation.Back.Out;
                    break;
                case "easeOutBounce":
                    return TweenManager.Interpolation.Bounce.Out;
                    break;
                case "easeInOutQuad":
                    return TweenManager.Interpolation.Quad.InOut;
                    break;
                case "easeInOutCubic":
                    return TweenManager.Interpolation.Cubic.InOut;
                    break;
                case "easeInOutQuart":
                    return TweenManager.Interpolation.Quart.InOut;
                    break;
                case "easeInOutQuint":
                    return TweenManager.Interpolation.Quint.InOut;
                    break;
                case "easeInOutSine":
                    return TweenManager.Interpolation.Sine.InOut;
                    break;
                case "easeInOutExpo":
                    return TweenManager.Interpolation.Expo.InOut;
                    break;
                case "easeInOutCirc":
                    return TweenManager.Interpolation.Circ.InOut;
                    break;
                case "easeInOutElastic":
                    return TweenManager.Interpolation.Elastic.InOut;
                    break;
                case "easeInOutBack":
                    return TweenManager.Interpolation.Back.InOut;
                    break;
                case "easeInOutBounce":
                    return TweenManager.Interpolation.Bounce.InOut;
                    break;
                case "linear":
                    return TweenManager.Interpolation.Linear.None;
                    break
            }
        })();
        if (!fn) {
            var curve = TweenManager.getEase(ease, true);
            if (curve) {
                fn = curve
            } else {
                fn = TweenManager.Interpolation.Cubic.Out
            }
        }
        return fn
    };
    this.solve = function(values, elapsed) {
        if (values[0] == values[1] && values[2] == values[3]) {
            return elapsed
        }
        return calculateBezier(getTForX(elapsed, values[0], values[2]), values[1], values[3])
    };
    this.Linear = {
        None: function(k) {
            return k
        }
    };
    this.Quad = {
        In: function(k) {
            return k * k
        },
        Out: function(k) {
            return k * (2 - k)
        },
        InOut: function(k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k
            }
            return -0.5 * (--k * (k - 2) - 1)
        }
    };
    this.Cubic = {
        In: function(k) {
            return k * k * k
        },
        Out: function(k) {
            return --k * k * k + 1
        },
        InOut: function(k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k
            }
            return 0.5 * ((k -= 2) * k * k + 2)
        }
    };
    this.Quart = {
        In: function(k) {
            return k * k * k * k
        },
        Out: function(k) {
            return 1 - --k * k * k * k
        },
        InOut: function(k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k * k
            }
            return -0.5 * ((k -= 2) * k * k * k - 2)
        }
    };
    this.Quint = {
        In: function(k) {
            return k * k * k * k * k
        },
        Out: function(k) {
            return --k * k * k * k * k + 1
        },
        InOut: function(k) {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k * k * k
            }
            return 0.5 * ((k -= 2) * k * k * k * k + 2)
        }
    };
    this.Sine = {
        In: function(k) {
            return 1 - Math.cos(k * Math.PI / 2)
        },
        Out: function(k) {
            return Math.sin(k * Math.PI / 2)
        },
        InOut: function(k) {
            return 0.5 * (1 - Math.cos(Math.PI * k))
        }
    };
    this.Expo = {
        In: function(k) {
            return k === 0 ? 0 : Math.pow(1024, k - 1)
        },
        Out: function(k) {
            return k === 1 ? 1 : 1 - Math.pow(2, -10 * k)
        },
        InOut: function(k) {
            if (k === 0) {
                return 0
            }
            if (k === 1) {
                return 1
            }
            if ((k *= 2) < 1) {
                return 0.5 * Math.pow(1024, k - 1)
            }
            return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2)
        }
    };
    this.Circ = {
        In: function(k) {
            return 1 - Math.sqrt(1 - k * k)
        },
        Out: function(k) {
            return Math.sqrt(1 - --k * k)
        },
        InOut: function(k) {
            if ((k *= 2) < 1) {
                return -0.5 * (Math.sqrt(1 - k * k) - 1)
            }
            return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1)
        }
    };
    this.Elastic = {
        In: function(k) {
            var s, a = 0.1,
                p = 0.4;
            if (k === 0) {
                return 0
            }
            if (k === 1) {
                return 1
            }
            if (!a || a < 1) {
                a = 1;
                s = p / 4
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI)
            }
            return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p))
        },
        Out: function(k) {
            var s, a = 0.1,
                p = 0.4;
            if (k === 0) {
                return 0
            }
            if (k === 1) {
                return 1
            }
            if (!a || a < 1) {
                a = 1;
                s = p / 4
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI)
            }
            return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1)
        },
        InOut: function(k) {
            var s, a = 0.1,
                p = 0.4;
            if (k === 0) {
                return 0
            }
            if (k === 1) {
                return 1
            }
            if (!a || a < 1) {
                a = 1;
                s = p / 4
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI)
            }
            if ((k *= 2) < 1) {
                return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p))
            }
            return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1
        }
    };
    this.Back = {
        In: function(k) {
            var s = 1.70158;
            return k * k * ((s + 1) * k - s)
        },
        Out: function(k) {
            var s = 1.70158;
            return --k * k * ((s + 1) * k + s) + 1
        },
        InOut: function(k) {
            var s = 1.70158 * 1.525;
            if ((k *= 2) < 1) {
                return 0.5 * (k * k * ((s + 1) * k - s))
            }
            return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2)
        }
    };
    this.Bounce = {
        In: function(k) {
            return 1 - this.Bounce.Out(1 - k)
        },
        Out: function(k) {
            if (k < (1 / 2.75)) {
                return 7.5625 * k * k
            } else {
                if (k < (2 / 2.75)) {
                    return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75
                } else {
                    if (k < (2.5 / 2.75)) {
                        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375
                    } else {
                        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375
                    }
                }
            }
        },
        InOut: function(k) {
            if (k < 0.5) {
                return this.Bounce.In(k * 2) * 0.5
            }
            return this.Bounce.Out(k * 2 - 1) * 0.5 + 0.5
        }
    }
}, "Static");
Class(function EasingPath(_curve) {
    Inherit(this, Component);
    var _this = this;
    var _path, _boundsStartIndex, _pathLength, _pool;
    var _precompute = 1450;
    var _step = 1 / _precompute;
    var _rect = 100;
    var _approximateMax = 5;
    var _eps = 0.001;
    var _boundsPrevProgress = -1;
    var _prevBounds = {};
    var _newPoint = {};
    var _samples = [];
    var _using = [];
    (function() {
        initPool();
        initPath();
        preSample()
    })();

    function initPool() {
        _pool = _this.initClass(ObjectPool, Object, 100)
    }

    function initPath() {
        _path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        _path.setAttributeNS(null, "d", normalizePath(_curve));
        _pathLength = _path.getTotalLength()
    }

    function preSample() {
        var i, j, length, point, progress, ref;
        for (i = j = 0, ref = _precompute; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
            progress = i * _step;
            length = _pathLength * progress;
            point = _path.getPointAtLength(length);
            _samples.push({
                point: point,
                length: length,
                progress: progress
            })
        }
    }

    function normalizePath(path) {
        var svgRegex = /[M|L|H|V|C|S|Q|T|A]/gim;
        var points = path.split(svgRegex);
        points.shift();
        var commands = path.match(svgRegex);
        var startIndex = 0;
        points[startIndex] = normalizeSegment(points[startIndex], 0);
        var endIndex = points.length - 1;
        points[endIndex] = normalizeSegment(points[endIndex], _rect);
        return joinNormalizedPath(commands, points)
    }

    function normalizeSegment(segment, value) {
        value = value || 0;
        segment = segment.trim();
        var nRgx = /(-|\+)?((\d+(\.(\d|\e(-|\+)?)+)?)|(\.?(\d|\e|(\-|\+))+))/gim;
        var pairs = getSegmentPairs(segment.match(nRgx));
        var lastPoint = pairs[pairs.length - 1];
        var x = lastPoint[0];
        var parsedX = Number(x);
        if (parsedX !== value) {
            segment = "";
            lastPoint[0] = value;
            for (var i = 0; i < pairs.length; i++) {
                var point = pairs[i];
                var space = i === 0 ? "" : " ";
                segment += "" + space + point[0] + "," + point[1]
            }
        }
        return segment
    }

    function joinNormalizedPath(commands, points) {
        var normalizedPath = "";
        for (var i = 0; i < commands.length; i++) {
            var command = commands[i];
            var space = i === 0 ? "" : " ";
            normalizedPath += "" + space + command + (points[i].trim())
        }
        return normalizedPath
    }

    function getSegmentPairs(array) {
        if (array.length % 2 !== 0) {
            throw "EasingPath :: Failed to parse path -- segment pairs are not even."
        }
        var newArray = [];
        for (var i = 0; i < array.length; i += 2) {
            var value = array[i];
            var pair = [array[i], array[i + 1]];
            newArray.push(pair)
        }
        return newArray
    }

    function findBounds(array, p) {
        if (p == _boundsPrevProgress) {
            return _prevBounds
        }
        if (!_boundsStartIndex) {
            _boundsStartIndex = 0
        }
        var len = array.length;
        var loopEnd, direction, start;
        if (_boundsPrevProgress > p) {
            loopEnd = 0;
            direction = "reverse"
        } else {
            loopEnd = len;
            direction = "forward"
        }
        if (direction == "forward") {
            start = array[0];
            end = array[array.length - 1]
        } else {
            start = array[array.length - 1];
            end = array[0]
        }
        var i, j, ref, ref1, buffer;
        for (i = j = ref = _boundsStartIndex, ref1 = loopEnd; ref <= ref1 ? j < ref1 : j > ref1; i = ref <= ref1 ? ++j : --j) {
            var value = array[i];
            var pointX = value.point.x / _rect;
            var pointP = p;
            if (direction == "reverse") {
                buffer = pointX;
                pointX = pointP;
                pointP = buffer
            }
            if (pointX < pointP) {
                start = value;
                _boundsStartIndex = i
            } else {
                end = value;
                break
            }
        }
        _boundsPrevProgress = p;
        _prevBounds.start = start;
        _prevBounds.end = end;
        return _prevBounds
    }

    function checkIfBoundsCloseEnough(p, bounds) {
        var point;
        var y = checkIfPointCloseEnough(p, bounds.start.point);
        if (y) {
            return y
        }
        return checkIfPointCloseEnough(p, bounds.end.point)
    }

    function findApproximate(p, start, end, approximateMax) {
        approximateMax = approximateMax || _approximateMax;
        var approximation = approximate(start, end, p);
        var point = _path.getPointAtLength(approximation);
        var x = point.x / _rect;
        if (closeEnough(p, x)) {
            return resolveY(point)
        } else {
            if (approximateMax-- < 1) {
                return resolveY(point)
            }
            var newPoint = _pool.get();
            newPoint.point = point;
            newPoint.length = approximation;
            _using.push(newPoint);
            if (p < x) {
                return findApproximate(p, start, newPoint, approximateMax)
            } else {
                return findApproximate(p, newPoint, end, approximateMax)
            }
        }
    }

    function approximate(start, end, p) {
        var deltaP = end.point.x - start.point.x;
        var percentP = (p - (start.point.x / _rect)) / (deltaP / _rect);
        return start.length + percentP * (end.length - start.length)
    }

    function checkIfPointCloseEnough(p, point) {
        if (closeEnough(p, point.x / _rect)) {
            return resolveY(point)
        }
    }

    function closeEnough(n1, n2) {
        return Math.abs(n1 - n2) < _eps
    }

    function resolveY(point) {
        return 1 - (point.y / _rect)
    }

    function cleanUpObjects() {
        for (var i = _using.length - 1; i > -1; i--) {
            _pool.put(_using[i])
        }
        _using.length = 0
    }
    this.solve = function(p) {
        p = Utils.clamp(p, 0, 1);
        var bounds = findBounds(_samples, p);
        var res = checkIfBoundsCloseEnough(p, bounds);
        var output = res;
        if (!output) {
            output = findApproximate(p, bounds.start, bounds.end)
        }
        cleanUpObjects();
        return output
    }
});
Class(function MathTween(_object, _props, _time, _ease, _delay, _update, _callback, _manual) {
    var _this = this;
    var _startTime, _startValues, _endValues, _currentValues;
    var _easeFunction, _paused, _newEase, _stack, _current;
    var _elapsed = 0;
    (function() {
        if (_object && _props) {
            if (typeof _time !== "number") {
                throw "MathTween Requires object, props, time, ease"
            }
            start();
            if (typeof _ease == "object" && !Array.isArray(_ease)) {
                initStack()
            }
        }
    })();

    function start() {
        if (!_object.multiTween && _object._mathTween && !_manual) {
            TweenManager.clearTween(_object)
        }
        if (!_manual) {
            TweenManager._addMathTween(_this)
        }
        _object._mathTween = _this;
        if (_object.multiTween) {
            if (!_object._mathTweens) {
                _object._mathTweens = []
            }
            _object._mathTweens.push(_this)
        }
        if (typeof _ease == "string") {
            _ease = TweenManager.Interpolation.convertEase(_ease);
            _easeFunction = typeof _ease === "function"
        } else {
            if (Array.isArray(_ease)) {
                _easeFunction = false;
                _ease = TweenManager.getEase(_ease, true)
            }
        }
        _startTime = Date.now();
        _startTime += _delay;
        _endValues = _props;
        _startValues = {};
        _this.startValues = _startValues;
        for (var prop in _endValues) {
            if (typeof _object[prop] === "number") {
                _startValues[prop] = _object[prop]
            }
        }
    }

    function initStack() {
        var prevTime = 0;
        var interpolate = function(start, end, alpha, ease, prev, key) {
            var last = prev[key];
            if (last) {
                start += last
            }
            return TweenManager.interpolateValues(start, end, alpha, ease)
        };
        _stack = [];
        for (var p in _ease) {
            var perc = p.strpos("%") ? Number(p.replace("%", "")) / 100 : ((Number(p) + 1) / _ease.length);
            if (isNaN(perc)) {
                continue
            }
            var ease = _ease[p];
            var last = _stack[_stack.length - 1];
            var props = {};
            var pr = last ? last.end : {};
            var zeroOut = !last;
            for (var key in _startValues) {
                props[key] = interpolate(_startValues[key], _endValues[key], perc, ease, pr, key);
                if (zeroOut) {
                    pr[key] = _startValues[key]
                }
            }
            var time = (perc * _time) - prevTime;
            prevTime += time;
            _stack.push({
                percent: perc,
                ease: ease,
                start: pr,
                end: props,
                time: time
            })
        }
        _currentValues = _stack.shift()
    }

    function clear() {
        if (!_object && !_props) {
            return false
        }
        _object._mathTween = null;
        TweenManager._removeMathTween(_this);
        Utils.nullObject(_this);
        if (_object._mathTweens) {
            _object._mathTweens.findAndRemove(_this)
        }
    }

    function updateSingle(time) {
        _elapsed = (time - _startTime) / _time;
        _elapsed = _elapsed > 1 ? 1 : _elapsed;
        var delta = _easeFunction ? _ease(_elapsed) : TweenManager.Interpolation.solve(_ease, _elapsed);
        for (var prop in _startValues) {
            if (typeof _startValues[prop] === "number") {
                var start = _startValues[prop];
                var end = _endValues[prop];
                _object[prop] = start + (end - start) * delta
            }
        }
        if (_update) {
            _update(delta)
        }
        if (_elapsed == 1) {
            if (_callback) {
                _callback()
            }
            clear()
        }
    }

    function updateStack(time) {
        var v = _currentValues;
        if (!v.elapsed) {
            v.elapsed = 0;
            v.timer = 0
        }
        v.timer += Render.DELTA;
        v.elapsed = v.timer / v.time;
        if (v.elapsed < 1) {
            for (var prop in v.start) {
                _object[prop] = TweenManager.interpolateValues(v.start[prop], v.end[prop], v.elapsed, v.ease)
            }
            if (_update) {
                _update(v.elapsed)
            }
        } else {
            _currentValues = _stack.shift();
            if (!_currentValues) {
                if (_callback) {
                    _callback()
                }
                clear()
            }
        }
    }
    this.update = function(time) {
        if (_paused || time < _startTime) {
            return
        }
        if (_stack) {
            updateStack(time)
        } else {
            updateSingle(time)
        }
    };
    this.pause = function() {
        _paused = true
    };
    this.resume = function() {
        _paused = false;
        _startTime = Date.now() - (_elapsed * _time)
    };
    this.stop = function() {
        _this.stopped = true;
        clear();
        return null
    };
    this.setEase = function(ease) {
        if (_newEase != ease) {
            _newEase = ease;
            _ease = TweenManager.Interpolation.convertEase(ease);
            _easeFunction = typeof _ease === "function"
        }
    };
    this.getValues = function() {
        return {
            start: _startValues,
            end: _endValues,
        }
    };
    this.interpolate = function(elapsed) {
        var delta = _easeFunction ? _ease(elapsed) : TweenManager.Interpolation.solve(_ease, elapsed);
        for (var prop in _startValues) {
            if (typeof _startValues[prop] === "number" && typeof _endValues[prop] === "number") {
                var start = _startValues[prop];
                var end = _endValues[prop];
                _object[prop] = start + (end - start) * delta
            }
        }
    }
});
Class(function SpringTween(_object, _props, _friction, _ease, _delay, _update, _callback) {
    var _this = this;
    var _startTime, _velocityValues, _endValues, _startValues;
    var _damping, _friction, _count, _paused;
    (function() {
        if (_object && _props) {
            if (typeof _friction !== "number") {
                throw "SpringTween Requires object, props, time, ease"
            }
            start()
        }
    })();

    function start() {
        TweenManager.clearTween(_object);
        _object._mathTween = _this;
        TweenManager._addMathTween(_this);
        _startTime = Date.now();
        _startTime += _delay;
        _endValues = {};
        _startValues = {};
        _velocityValues = {};
        if (_props.x || _props.y || _props.z) {
            if (typeof _props.x === "undefined") {
                _props.x = _object.x
            }
            if (typeof _props.y === "undefined") {
                _props.y = _object.y
            }
            if (typeof _props.z === "undefined") {
                _props.z = _object.z
            }
        }
        _count = 0;
        _damping = _props.damping || 0.5;
        delete _props.damping;
        for (var prop in _props) {
            if (typeof _props[prop] === "number") {
                _velocityValues[prop] = 0;
                _endValues[prop] = _props[prop]
            }
        }
        for (prop in _props) {
            if (typeof _object[prop] === "number") {
                _startValues[prop] = _object[prop] || 0;
                _props[prop] = _startValues[prop]
            }
        }
    }

    function clear(stop) {
        if (_object) {
            _object._mathTween = null;
            if (!stop) {
                for (var prop in _endValues) {
                    if (typeof _endValues[prop] === "number") {
                        _object[prop] = _endValues[prop]
                    }
                }
                if (_object.transform) {
                    _object.transform()
                }
            }
        }
        TweenManager._removeMathTween(_this)
    }
    this.update = function(time) {
        if (time < _startTime || _paused) {
            return
        }
        var vel;
        for (var prop in _startValues) {
            if (typeof _startValues[prop] === "number") {
                var start = _startValues[prop];
                var end = _endValues[prop];
                var val = _props[prop];
                var d = end - val;
                var a = d * _damping;
                _velocityValues[prop] += a;
                _velocityValues[prop] *= _friction;
                _props[prop] += _velocityValues[prop];
                _object[prop] = _props[prop];
                vel = _velocityValues[prop]
            }
        }
        if (Math.abs(vel) < 0.1) {
            _count++;
            if (_count > 30) {
                if (_callback) {
                    _callback.apply(_object)
                }
                clear()
            }
        }
        if (_update) {
            _update(time)
        }
        if (_object.transform) {
            _object.transform()
        }
    };
    this.pause = function() {
        _paused = true
    };
    this.stop = function() {
        clear(true);
        return null
    }
});
Class(function TweenTimeline() {
    Inherit(this, Component);
    var _this = this;
    var _tween;
    var _total = 0;
    var _tweens = [];
    var _fallbacks = [];
    this.elapsed = 0;
    (function() {})();

    function calculate() {
        _tweens.sort(function(a, b) {
            var ta = a.time + a.delay;
            var tb = b.time + b.delay;
            return tb - ta
        });
        var first = _tweens[0];
        _total = first.time + first.delay
    }

    function loop() {
        var time = _this.elapsed * _total;
        for (var i = _tweens.length - 1; i > -1; i--) {
            var t = _tweens[i];
            var relativeTime = time - t.delay;
            var elapsed = Utils.clamp(relativeTime / t.time, 0, 1);
            t.interpolate(elapsed)
        }
        if (_this.onUpdate) {
            _this.onUpdate(_this.elapsed)
        }
    }
    this.add = function(object, props, time, ease, delay) {
        var tween;
        if (object instanceof HydraObject) {
            tween = new FrameTween(object, props, time, ease, delay, null, true)
        } else {
            tween = new MathTween(object, props, time, ease, delay, null, null, true)
        }
        _tweens.push(tween);
        _fallbacks.push({
            object: object,
            props: props,
            time: time,
            ease: ease,
            delay: delay
        });
        tween.time = time;
        tween.delay = delay || 0;
        calculate();
        return tween
    };
    this.tween = function(to, time, ease, delay, callback) {
        this.stopTween();
        _tween = TweenManager.tween(_this, {
            elapsed: to
        }, time, ease, delay, callback, loop)
    };
    this.stopTween = function() {
        if (_tween && _tween.stop) {
            _tween.stop()
        }
    };
    this.startRender = function() {
        Render.startRender(loop)
    };
    this.stopRender = function() {
        Render.stopRender(loop)
    };
    this.update = function() {
        loop()
    };
    this.calculateRemainingTime = function() {
        return _total - (_this.elapsed * _total)
    };
    this.fallback = function(dir) {
        _fallbacks.forEach(function(config, index) {
            var fTween = _tweens[index].getValues();
            var props = null;
            if (config.object instanceof HydraObject) {
                if (dir == 1) {
                    props = Utils.mergeObject(fTween.end, fTween.transformEnd)
                } else {
                    props = Utils.mergeObject(fTween.start, fTween.transformStart)
                }
                for (var key in props) {
                    if (typeof props[key] != "number") {
                        delete props[key]
                    }
                }
                config.object.tween(props, config.time, config.ease, config.delay)
            } else {
                if (dir == 1) {
                    props = Utils.mergeObject(fTween.end)
                } else {
                    props = Utils.mergeObject(fTween.start)
                }
                for (var key in props) {
                    if (typeof props[key] != "number") {
                        delete props[key]
                    }
                }
                TweenManager.tween(config.object, props, config.time, config.ease, config.delay)
            }
        })
    };
    this.destroy = function() {
        Render.stopRender(loop);
        for (var i = 0; i < _tweens.length; i++) {
            _tweens[i].stop()
        }
        return this._destroy()
    }
});
Class(function Shaders() {
    var _this = this;
    (function() {})();

    function parseCompiled(shaders) {
        var split = shaders.split("{@}");
        split.shift();
        for (var i = 0; i < split.length; i += 2) {
            var name = split[i];
            var text = split[i + 1];
            _this[name] = text
        }
    }

    function parseRequirements() {
        for (var key in _this) {
            var obj = _this[key];
            if (typeof obj === "string") {
                _this[key] = require(obj)
            }
        }
    }

    function require(shader) {
        if (!shader.strpos("require")) {
            return shader
        }
        shader = shader.replace(/# require/g, "#require");
        while (shader.strpos("#require")) {
            var split = shader.split("#require(");
            var name = split[1].split(")")[0];
            name = name.replace(/ /g, "");
            if (!_this[name]) {
                throw "Shader required " + name + ", but not found in compiled shaders.\n" + shader
            }
            shader = shader.replace("#require(" + name + ")", _this[name])
        }
        return shader
    }
    this.parse = function(code, file) {
        if (!code.strpos("{@}")) {
            file = file.split("/");
            file = file[file.length - 1];
            _this[file] = code
        } else {
            parseCompiled(code);
            parseRequirements()
        }
    };
    this.getShader = function(string) {
        if (_this.FALLBACKS) {
            if (_this.FALLBACKS[string]) {
                string = _this.FALLBACKS[string]
            }
        }
        var code = _this[string];
        if (code) {
            while (code.strpos("#test ")) {
                try {
                    var test = code.split("#test ")[1];
                    var name = test.split("\n")[0];
                    var glsl = code.split("#test " + name + "\n")[1].split("#endtest")[0];
                    if (!eval(name)) {
                        code = code.replace(glsl, "")
                    }
                    code = code.replace("#test " + name + "\n", "");
                    code = code.replace("#endtest", "")
                } catch (e) {
                    throw "Error parsing test :: " + string
                }
            }
        }
        return code
    }
}, "static");
Class(function RenderPerformance() {
    Inherit(this, Component);
    var _this = this;
    var _time;
    var _times = [];
    var _fps = [];
    this.enabled = true;
    this.pastFrames = 60;
    this.time = function() {
        if (!this.enabled) {
            return
        }
        if (!_time) {
            _time = performance.now()
        } else {
            var t = performance.now() - _time;
            _time = null;
            _times.unshift(t);
            if (_times.length > this.pastFrames) {
                _times.pop()
            }
            _fps.unshift(Render.FPS);
            if (_fps.length > this.pastFrames) {
                _fps.pop()
            }
            this.average = 0;
            var len = _times.length;
            for (var i = 0; i < len; i++) {
                this.average += _times[i]
            }
            this.average /= len;
            this.averageFPS = 0;
            len = _fps.length;
            for (i = 0; i < len; i++) {
                this.averageFPS += _fps[i]
            }
            this.averageFPS /= len
        }
    };
    this.clear = function() {
        _times.length = 0
    };
    this.dump = function() {
        console.log(_times)
    };
    this.get("times", function() {
        return _times
    });
    this.get("median", function() {
        _times.sort(function(a, b) {
            return a - b
        });
        return _times[~~(_times.length / 2)]
    })
});
Class(function Video(_params) {
    Inherit(this, Component);
    var _this = this;
    var _inter, _time, _lastTime, _buffering, _seekTo, _loop, _forceRender;
    var _tick = 0;
    var _event = {};
    this.loop = false;
    this.playing = false;
    this.width = _params.width || 0;
    this.height = _params.height || 0;
    (function() {
        createDiv();
        if (_params.preload !== false) {
            preload()
        }
    })();

    function createDiv() {
        var src = _params.src;
        if (src && !src.strpos("webm") && !src.strpos("mp4") && !src.strpos("ogv")) {
            src += "." + Device.media.video
        }
        _this.div = document.createElement("video");
        if (src) {
            _this.div.src = src
        }
        _this.div.controls = _params.controls;
        _this.div.id = _params.id || "";
        _this.div.width = _params.width;
        _this.div.height = _params.height;
        _loop = _this.div.loop = _params.loop;
        if (Mobile.os == "iOS" && Mobile.version >= 9 && !_this.div.controls) {
            _this.div.autoplay = true;
            _this.div.load()
        }
        _this.object = $(_this.div);
        _this.width = _params.width;
        _this.height = _params.height;
        _this.object.size(_this.width, _this.height);
        if (Mobile.isNative() && Mobile.os == "iOS") {
            _this.object.attr("webkit-playsinline", true)
        }
    }

    function preload() {
        if (Device.mobile) {
            return
        }
        _this.div.preload = "none";
        _this.div.load();
        _this.div.addEventListener("canplaythrough", function() {
            if (_this.div && !_this.playing && !_this.div.preloadThroguh) {
                _this.div.play();
                _this.div.pause();
                _this.div.preloadThrough = true
            }
        })
    }

    function tick() {
        if (!_this.div || !_this.events) {
            return Render.stopRender(tick)
        }
        _this.duration = _this.div.duration;
        _this.time = _this.div.currentTime;
        if (_this.div.currentTime == _lastTime) {
            _tick++;
            if (_tick > 30 && !_buffering) {
                _buffering = true;
                _this.events.fire(HydraEvents.ERROR, null, true)
            }
        } else {
            _tick = 0;
            if (_buffering) {
                _this.events.fire(HydraEvents.READY, null, true);
                _buffering = false
            }
        }
        _lastTime = _this.div.currentTime;
        if (_this.div.currentTime >= (_this.duration || _this.div.duration) - 0.001) {
            if (!_loop) {
                if (!_forceRender) {
                    Render.stopRender(tick)
                }
                _this.events.fire(HydraEvents.COMPLETE, null, true)
            }
        }
        _event.time = _this.div.currentTime;
        _event.duration = _this.div.duration;
        _this.events.fire(HydraEvents.UPDATE, _event, true)
    }

    function checkReady() {
        if (!_this.div) {
            return false
        }
        if (!Device.mobile) {
            if (!_seekTo) {
                _this.buffered = _this.div.readyState == _this.div.HAVE_ENOUGH_DATA
            } else {
                var max = -1;
                var seekable = _this.div.seekable;
                if (seekable) {
                    for (var i = 0; i < seekable.length; i++) {
                        if (seekable.start(i) < _seekTo) {
                            max = seekable.end(i) - 0.5
                        }
                    }
                    if (max >= _seekTo) {
                        _this.buffered = true
                    }
                } else {
                    _this.buffered = true
                }
            }
        } else {
            _this.buffered = true
        }
        if (_this.buffered) {
            Render.stopRender(checkReady);
            _this.events.fire(HydraEvents.READY, null, true)
        }
    }
    this.set("loop", function(bool) {
        if (!_this.div) {
            return
        }
        _loop = bool;
        _this.div.loop = bool
    });
    this.get("loop", function() {
        return _loop
    });
    this.set("src", function(src) {
        if (src && !src.strpos("webm") && !src.strpos("mp4") && !src.strpos("ogv")) {
            src += "." + Device.media.video
        }
        _this.div.src = src
    });
    this.get("src", function() {
        return _this.div.src
    });
    this.play = function() {
        if (!_this.div) {
            return false
        }
        _this.playing = true;
        _this.div.play();
        Render.startRender(tick)
    };
    this.pause = function() {
        if (!_this.div) {
            return false
        }
        _this.playing = false;
        _this.div.pause();
        Render.stopRender(tick)
    };
    this.stop = function() {
        _this.playing = false;
        Render.stopRender(tick);
        if (!_this.div) {
            return false
        }
        _this.div.pause();
        if (_this.ready()) {
            _this.div.currentTime = 0
        }
    };
    this.volume = function(v) {
        if (!_this.div) {
            return false
        }
        _this.div.volume = v
    };
    this.seek = function(t) {
        if (!_this.div) {
            return false
        }
        if (_this.div.readyState <= 1) {
            Render.nextFrame(function() {
                _this.seek && _this.seek(t)
            });
            return
        }
        _this.div.currentTime = t
    };
    this.canPlayTo = function(t) {
        _seekTo = null;
        if (t) {
            _seekTo = t
        }
        if (!_this.div) {
            return false
        }
        if (!_this.buffered) {
            Render.startRender(checkReady)
        }
        return this.buffered
    };
    this.ready = function() {
        if (!_this.div) {
            return false
        }
        return _this.div.readyState >= 2
    };
    this.size = function(w, h) {
        if (!_this.div) {
            return false
        }
        this.div.width = this.width = w;
        this.div.height = this.height = h;
        this.object.css({
            width: w,
            height: h
        })
    };
    this.forceRender = function() {
        _forceRender = true;
        Render.startRender(tick)
    };
    this.destroy = function() {
        this.stop();
        this.object.remove();
        this.div.src = "";
        return this._destroy()
    }
});
Class(function AssetLoader(_assets, _complete) {
    Inherit(this, Component);
    var _this = this;
    var _total = 0;
    var _loaded = 0;
    var _added = 0;
    var _triggered = 0;
    var _queueLength = 2;
    var _lastTriggered = 0;
    var _queue, _qLoad, _currentQueue;
    var _output, _loadedFiles;
    var _id = Utils.timestamp();
    if (typeof _complete === "number") {
        _queueLength = _complete;
        _complete = null
    }(function() {
        _queue = {};
        _loadedFiles = [];
        prepareAssets();
        startLoading()
    })();

    function prepareAssets() {
        var perQueue = _assets.length / _queueLength;
        var count = 0;
        var index = 0;
        for (var i = 0; i < _assets.length; i++) {
            if (typeof _assets[i] !== "undefined") {
                if (!_queue[index]) {
                    _queue[index] = []
                }
                var queue = _queue[index];
                _total++;
                count++;
                if (count >= perQueue) {
                    index += 1;
                    count = 0
                }
                queue.push(_assets[i])
            }
        }
    }

    function startLoading() {
        _currentQueue = 0;
        loadQueue()
    }

    function loadQueue() {
        var queue = _queue[_currentQueue];
        if (!queue) {
            return
        }
        _qLoad = 0;
        for (var i = 0; i < queue.length; i++) {
            loadAsset(queue[i])
        }
    }

    function checkQ() {
        if (!_queue) {
            return
        }
        var queue = _queue[_currentQueue];
        if (!queue) {
            return
        }
        var length = queue.length;
        _qLoad++;
        if (_qLoad == length) {
            _currentQueue++;
            loadQueue()
        }
    }

    function missingFiles() {
        if (!_queue) {
            return
        }
        var missing = [];
        for (var i = 0; i < _queue.length; i++) {
            var loaded = false;
            for (var j = 0; j < _loadedFiles.length; j++) {
                if (_loadedFiles[j] == _queue[i]) {
                    loaded = true
                }
            }
            if (!loaded) {
                missing.push(_queue[i])
            }
        }
        if (missing.length) {
            console.log("AssetLoader Files Failed To Load:");
            console.log(missing)
        }
    }

    function wrapXHR(xhr) {
        xhr.onError = function(e) {
            _this.events.fire(HydraEvents.ERROR, e)
        }
    }

    function loadAsset(asset) {
        if (!asset) {
            return
        }
        var name = asset.split("/");
        name = name[name.length - 1];
        var split = name.split(".");
        var ext = split[split.length - 1].split("?")[0];
        switch (ext) {
            case "html":
                wrapXHR(XHR.get(asset, function(contents) {
                    Hydra.HTML[split[0]] = contents;
                    assetLoaded(asset)
                }, "text"));
                break;
            case "js":
            case "php":
            case undefined:
                wrapXHR(XHR.get(asset, function(script) {
                    script = script.replace("use strict", "");
                    eval.call(window, script);
                    assetLoaded(asset)
                }, "text"));
                break;
            case "fnt":
            case "json":
                wrapXHR(XHR.get(asset, function(contents) {
                    Hydra.JSON[split[0]] = contents;
                    assetLoaded(asset)
                }, ext == "fnt" ? "text" : null));
                break;
            case "svg":
                wrapXHR(XHR.get(asset, function(contents) {
                    Hydra.SVG[split[0]] = contents;
                    assetLoaded(asset)
                }, "text"));
                break;
            case "fs":
            case "vs":
                wrapXHR(XHR.get(asset, function(contents) {
                    Shaders.parse(contents, asset);
                    assetLoaded(asset)
                }, "text"));
                break;
            default:
                var image = Images.createImg(asset);
                if (image.complete) {
                    assetLoaded(asset);
                    return
                }
                image.onload = function() {
                    assetLoaded(asset)
                };
                break
        }
    }

    function assetLoaded(asset) {
        _loaded++;
        if (_this.events) {
            _this.events.fire(HydraEvents.PROGRESS, {
                percent: _loaded / _total
            })
        }
        _loadedFiles.push(asset);
        clearTimeout(_output);
        checkQ();
        if (_loaded == _total) {
            _this.complete = true;
            if (_this.events) {
                _this.events.fire(HydraEvents.COMPLETE, null, true)
            }
            if (typeof _complete === "function") {
                _complete()
            }
        } else {
            if (!window.THREAD && _this.delayedCall) {
                _output = _this.delayedCall(missingFiles, 5000)
            }
        }
    }
    this.add = function(num) {
        _total += num;
        _added += num
    };
    this.trigger = function(num) {
        num = num || 1;
        for (var i = 0; i < num; i++) {
            assetLoaded("trigger")
        }
    };
    this.triggerPercent = function(percent, num) {
        num = num || _added;
        var trigger = Math.ceil(num * percent);
        if (trigger > _lastTriggered) {
            this.trigger(trigger - _lastTriggered)
        }
        _lastTriggered = trigger
    };
    this.destroy = function() {
        _assets = null;
        _loaded = null;
        _queue = null;
        _qLoad = null;
        return this._destroy && this._destroy()
    }
}, function() {
    AssetLoader.loadAllAssets = function(callback, cdn) {
        cdn = cdn || "";
        var list = [];
        for (var i = 0; i < ASSETS.length; i++) {
            list.push(cdn + ASSETS[i])
        }
        var assets = new AssetLoader(list, function() {
            if (callback) {
                callback()
            }
            if (assets && assets.destroy) {
                assets = assets.destroy()
            }
        })
    };
    AssetLoader.loadAssets = function(list, callback) {
        var assets = new AssetLoader(list, function() {
            if (callback) {
                callback()
            }
            if (assets && assets.destroy) {
                assets = assets.destroy()
            }
        })
    };
    AssetLoader.waitForLib = function(name, callback) {
        var interval = setInterval(function() {
            if (window[name]) {
                clearInterval(interval);
                callback && callback();
                interval = callback = null
            }
        }, 100)
    }
});
Class(function AssetUtil() {
    var _this = this;
    var _assets = {};
    var _exclude = ["!!!"];
    this.PATH = "";

    function canInclude(asset, match) {
        for (var i = 0; i < _exclude.length; i++) {
            var excl = _exclude[i];
            if (asset.strpos(excl) && match != excl) {
                return false
            }
        }
        return true
    }
    this.getAssets = this.loadAssets = function(list) {
        if (Hydra.CDN && !_this.PATH.length) {
            _this.PATH = Hydra.CDN
        }
        var assets = this.get(list);
        var output = [];
        for (var i = assets.length - 1; i > -1; i--) {
            var asset = assets[i];
            if (!_assets[asset]) {
                output.push(asset.strpos("http") ? asset : _this.PATH + asset);
                _assets[asset] = 1
            }
        }
        return output
    };
    this.get = function(list) {
        if (!Array.isArray(list)) {
            list = [list]
        }
        var assets = [];
        for (var i = ASSETS.length - 1; i > -1; i--) {
            var asset = ASSETS[i];
            for (var j = list.length - 1; j > -1; j--) {
                var match = list[j];
                if (asset.strpos(match)) {
                    if (canInclude(asset, match)) {
                        assets.push(asset)
                    }
                }
            }
        }
        return assets
    };
    this.exclude = function(list) {
        if (!Array.isArray(list)) {
            list = [list]
        }
        for (var i = 0; i < list.length; i++) {
            _exclude.push(list[i])
        }
    };
    this.removeExclude = function(list) {
        if (!Array.isArray(list)) {
            list = [list]
        }
        for (var i = 0; i < list.length; i++) {
            _exclude.findAndRemove(list[i])
        }
    };
    this.loadAllAssets = this.getAllAssets = function(list) {
        var assets = _this.loadAssets(list || "/");
        var loader = new AssetLoader(assets)
    };
    this.exists = function(match) {
        for (var i = ASSETS.length - 1; i > -1; i--) {
            var asset = ASSETS[i];
            if (asset.strpos(match)) {
                return true
            }
        }
        return false
    };
    this.prependPath = function(path, files) {
        if (!Array.isArray(files)) {
            files = [files]
        }
        for (var i = ASSETS.length - 1; i > -1; i--) {
            var asset = ASSETS[i];
            files.forEach(function(file) {
                if (asset.strpos(file)) {
                    ASSETS[i] = path + asset
                }
            })
        }
    }
}, "Static");
Class(function Images() {
    var _this = this;
    this.inMemory = false;
    this.store = {};
    this.useCORS = false;

    function parseResolution(path) {
        if (!ASSETS.RES) {
            return path
        }
        var res = ASSETS.RES[path];
        var ratio = Math.min(Device.pixelRatio, 3);
        if (res) {
            if (res["x" + ratio]) {
                var split = path.split("/");
                var file = split[split.length - 1];
                split = file.split(".");
                return path.replace(file, split[0] + "-" + ratio + "x." + split[1])
            } else {
                return path
            }
        } else {
            return path
        }
    }
    this.getPath = function(path) {
        if (path.strpos("http")) {
            return path
        }
        path = parseResolution(path);
        return (Hydra.CDN || "") + path
    };
    this.createImg = function(path) {
        var cors = _this.useCORS;
        if (!path.strpos("http")) {
            path = parseResolution(path);
            path = (Hydra.CDN || "") + path
        }
        var img = new Image();
        if (cors) {
            img.crossOrigin = ""
        }
        img.src = path;
        if (this.store) {
            this.storeImg(img)
        }
        return img
    };
    this.storeImg = function(img) {
        if (this.inMemory) {
            this.store[img.src] = img
        }
    };
    this.releaseImg = function(path) {
        path = path.src ? path.src : path;
        delete this.store[path]
    }
}, "static");
Class(function XHR() {
    var _this = this;
    var _serial;
    var _android = window.location.href.strpos("file://");
    this.headers = {};
    this.options = {};

    function serialize(key, data) {
        if (typeof data === "object") {
            for (var i in data) {
                var newKey = key + "[" + i + "]";
                if (typeof data[i] === "object") {
                    serialize(newKey, data[i])
                } else {
                    _serial.push(newKey + "=" + data[i])
                }
            }
        } else {
            _serial.push(key + "=" + data)
        }
    }
    this.get = function(url, data, callback, type) {
        if (typeof data === "function") {
            type = callback;
            callback = data;
            data = null
        } else {
            if (typeof data === "object") {
                var string = "?";
                for (var key in data) {
                    string += key + "=" + data[key] + "&"
                }
                string = string.slice(0, -1);
                url += string
            }
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        if (type == "text") {
            xhr.overrideMimeType("text/plain")
        }
        if (type == "json") {
            xhr.setRequestHeader("Accept", "application/json")
        }
        var xhrObject = new XHRObject();
        for (var key in _this.headers) {
            xhr.setRequestHeader(key, _this.headers[key])
        }
        for (var key in _this.options) {
            xhr[key] = _this.options[key]
        }
        xhr.onerror = xhrObject._error;
        xhr.send();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && (_android || xhr.status == 200)) {
                if (typeof callback === "function") {
                    var data = xhr.responseText;
                    if (type == "text") {
                        callback(data)
                    } else {
                        try {
                            callback(JSON.parse(data))
                        } catch (e) {
                            if (xhrObject.onError) {
                                xhrObject._error("Error parsing JSON")
                            } else {
                                throw e
                            }
                        }
                    }
                }
            }
            if (xhr.status == 0 || xhr.status == 401 || xhr.status == 404 || xhr.status == 500) {
                xhrObject._error(xhr.status + " " + xhr.responseText)
            }
        };
        return xhrObject
    };
    this.post = function(url, data, callback, type, header) {
        if (typeof data === "function") {
            header = type;
            type = callback;
            callback = data;
            data = null
        } else {
            if (typeof data === "object") {
                if (callback == "json" || type == "json" || header == "json") {
                    data = JSON.stringify(data);
                    header = "json"
                } else {
                    _serial = new Array();
                    for (var key in data) {
                        serialize(key, data[key])
                    }
                    data = _serial.join("&");
                    data = data.replace(/\[/g, "%5B");
                    data = data.replace(/\]/g, "%5D");
                    _serial = null
                }
            }
        }
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        if (type == "text") {
            xhr.overrideMimeType("text/plain")
        }
        if (type == "json") {
            xhr.setRequestHeader("Accept", "application/json")
        }
        var xhrObject = new XHRObject();
        switch (header) {
            case "upload":
                header = "application/upload";
                break;
            case "json":
                header = "application/json";
                break;
            default:
                header = "application/x-www-form-urlencoded";
                break
        }
        xhr.setRequestHeader("Content-type", header);
        for (var key in _this.headers) {
            xhr.setRequestHeader(key, _this.headers[key])
        }
        for (var key in _this.options) {
            xhr[key] = _this.options[key]
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && (_android || xhr.status == 200)) {
                if (typeof callback === "function") {
                    var data = xhr.responseText;
                    if (type == "text") {
                        callback(data)
                    } else {
                        try {
                            callback(JSON.parse(data))
                        } catch (e) {
                            if (xhrObject.onError) {
                                xhrObject._error("Error parsing JSON")
                            } else {
                                throw e
                            }
                        }
                    }
                }
            }
            if (xhr.status == 0 || xhr.status == 401 || xhr.status == 404 || xhr.status == 500) {
                xhrObject._error(xhr.status + " " + xhr.responseText)
            }
        };
        xhr.onerror = xhrObject._error;
        xhr.send(data);
        return xhrObject
    };

    function XHRObject() {
        var _this = this;
        this._error = function(msg) {
            _this.onError && _this.onError(msg);
            _this.onError = null
        }
    }
}, "Static");
Class(function Storage() {
    var _this = this;
    var _storage;
    (function() {
        testStorage()
    })();

    function testStorage() {
        try {
            if (window.localStorage) {
                try {
                    window.localStorage.test = 1;
                    window.localStorage.removeItem("test");
                    _storage = true
                } catch (e) {
                    _storage = false
                }
            } else {
                _storage = false
            }
        } catch (e) {
            _storage = false
        }
    }

    function cookie(key, value, expires) {
        var options;
        if (arguments.length > 1 && (value === null || typeof value !== "object")) {
            options = {};
            options.path = "/";
            options.expires = expires || 1;
            if (value === null) {
                options.expires = -1
            }
            if (typeof options.expires === "number") {
                var days = options.expires,
                    t = options.expires = new Date();
                t.setDate(t.getDate() + days)
            }
            return (document.cookie = [encodeURIComponent(key), "=", options.raw ? String(value) : encodeURIComponent(String(value)), options.expires ? "; expires=" + options.expires.toUTCString() : "", options.path ? "; path=" + options.path : "", options.domain ? "; domain=" + options.domain : "", options.secure ? "; secure" : ""].join(""))
        }
        options = value || {};
        var result, decode = options.raw ? function(s) {
            return s
        } : decodeURIComponent;
        return (result = new RegExp("(?:^|; )" + encodeURIComponent(key) + "=([^;]*)").exec(document.cookie)) ? decode(result[1]) : null
    }
    this.setCookie = function(key, value, expires) {
        cookie(key, value, expires)
    };
    this.getCookie = function(key) {
        return cookie(key)
    };
    this.set = function(key, value) {
        if (value != null && typeof value === "object") {
            value = JSON.stringify(value)
        }
        if (_storage) {
            if (value === null) {
                window.localStorage.removeItem(key)
            } else {
                window.localStorage[key] = value
            }
        } else {
            cookie(key, value, 365)
        }
    };
    this.get = function(key) {
        var val;
        if (_storage) {
            val = window.localStorage[key]
        } else {
            val = cookie(key)
        }
        if (val) {
            var char0;
            if (val.charAt) {
                char0 = val.charAt(0)
            }
            if (char0 == "{" || char0 == "[") {
                val = JSON.parse(val)
            }
            if (val == "true" || val == "false") {
                val = val == "true" ? true : false
            }
        }
        return val
    }
}, "Static");
Class(function Thread(_class) {
    Inherit(this, Component);
    var _this = this;
    var _worker, _callbacks, _path, _mvc;
    (function() {
        init();
        importClasses();
        addListeners()
    })();

    function init() {
        _path = Thread.PATH;
        _callbacks = {};
        _worker = new Worker(_path + "assets/js/hydra/hydra-thread.js")
    }

    function importClasses() {
        importClass(Utils);
        importClass(MVC);
        importClass(Component);
        importClass(Events);
        importClass(_class, true)
    }

    function importClass(_class, scoped) {
        if (!_class) {
            return
        }
        var code, namespace;
        if (!scoped) {
            if (typeof _class !== "function") {
                var code = _class.constructor.toString();
                if (code.strpos("[native")) {
                    return
                }
                namespace = _class.constructor._namespace ? _class.constructor._namespace + "." : "";
                code = namespace + "Class(" + code + ', "static");'
            } else {
                namespace = _class._namespace ? _class._namespace + "." : "";
                code = namespace + "Class(" + _class.toString() + ");"
            }
        } else {
            code = _class.toString().replace("{", "!!!");
            code = code.split("!!!")[1];
            var splitChar = window._MINIFIED_ ? "=" : " ";
            while (code.strpos("this")) {
                var split = code.slice(code.indexOf("this."));
                var name = split.split("this.")[1].split(splitChar)[0];
                code = code.replace("this", "self");
                createMethod(name)
            }
            code = code.slice(0, -1)
        }
        _worker.postMessage({
            code: code
        })
    }

    function createMethod(name) {
        _this[name] = function(message, callback) {
            _this.send(name, message, callback)
        }
    }

    function addListeners() {
        _worker.addEventListener("message", workerMessage)
    }

    function workerMessage(e) {
        if (e.data.console) {
            console.log(e.data.message)
        } else {
            if (e.data.id) {
                var callback = _callbacks[e.data.id];
                if (callback) {
                    callback(e.data.message)
                }
                delete _callbacks[e.data.id]
            } else {
                if (e.data.emit) {
                    var callback = _callbacks[e.data.evt];
                    if (callback) {
                        callback(e.data.msg)
                    }
                } else {
                    var callback = _callbacks.transfer;
                    if (callback) {
                        callback(e.data)
                    }
                }
            }
        }
    }
    this.on = function(evt, callback) {
        _callbacks[evt] = callback
    };
    this.off = function(evt) {
        delete _callbacks[evt]
    };
    this.loadFunctions = function() {
        for (var i = 0; i < arguments.length; i++) {
            this.loadFunction(arguments[i])
        }
    };
    this.loadFunction = function(code) {
        code = code.toString();
        code = code.replace("(", "!!!");
        var split = code.split("!!!");
        var name = split[0].split(" ")[1];
        code = "self." + name + " = function(" + split[1];
        _worker.postMessage({
            code: code
        });
        createMethod(name)
    };
    this.importScript = function(path) {
        _worker.postMessage({
            path: path.strpos("http") ? path : location.protocol + "//" + location.hostname + location.pathname + "/" + path,
            importScript: true
        })
    };
    this.importClass = function() {
        for (var i = 0; i < arguments.length; i++) {
            var code = arguments[i];
            importClass(code)
        }
    };
    this.send = function(name, message, callback) {
        if (typeof name === "string") {
            var fn = name;
            message = message || {};
            message.fn = name
        } else {
            callback = message;
            message = name
        }
        var id = Utils.timestamp();
        if (callback) {
            _callbacks[id] = callback
        }
        if (message.transfer) {
            message.msg.id = id;
            message.msg.fn = message.fn;
            message.msg.transfer = true;
            _worker.postMessage(message.msg, message.buffer)
        } else {
            _worker.postMessage({
                message: message,
                id: id
            })
        }
    };
    this.destroy = function() {
        if (_worker.terminate) {
            _worker.terminate()
        }
        if (this._destroy) {
            return this._destroy()
        }
    }
}, function() {
    Thread.PATH = ""
});
Class(function Dev() {
    var _this = this;
    var _post, _alert;
    var _id = Utils.timestamp();
    (function() {
        if (Hydra.LOCAL) {
            Hydra.development(true)
        }
    })();

    function catchErrors() {
        window.onerror = function(message, file, line) {
            var string = message + " ::: " + file + " : " + line;
            if (_alert) {
                alert(string)
            }
            if (_post) {
                XHR.post(_post + "/api/data/debug", getDebugInfo(string))
            }
            if (_this.onError) {
                _this.onError(message, file, line)
            }
        }
    }

    function getDebugInfo(string) {
        var obj = {};
        obj.time = new Date().toString();
        obj.deviceId = _id;
        obj.err = string;
        obj.ua = Device.agent;
        obj.width = Stage.width;
        obj.height = Stage.height;
        obj.screenWidth = screen.width;
        obj.screenHeight = screen.height;
        return obj
    }
    this.alertErrors = function(url) {
        _alert = true;
        if (typeof url === "string") {
            url = [url]
        }
        for (var i = 0; i < url.length; i++) {
            if (location.href.strpos(url[i]) || location.hash.strpos(url[i])) {
                return catchErrors()
            }
        }
    };
    this.postErrors = function(url, post) {
        _post = post;
        if (typeof url === "string") {
            url = [url]
        }
        for (var i = 0; i < url.length; i++) {
            if (location.href.strpos(url[i])) {
                return catchErrors()
            }
        }
    };
    this.expose = function(name, val, force) {
        if (Hydra.LOCAL || force) {
            window[name] = val
        }
    };
    this.logServer = function(msg) {
        if (_post) {
            XHR.post(_post + "/api/data/debug", getDebugInfo(msg))
        }
    };
    this.unsupported = function(needsAlert) {
        if (needsAlert) {
            alert("Hi! This build is not yet ready for this device, things may not work as expected. Refer to build schedule for when this device will be supported.")
        }
    }
}, "Static");
window.ASSETS = ["assets/geometry/92-stag-intro.json", "assets/geometry/anim.json", "assets/geometry/curves.json", "assets/geometry/forest/lake-ground.json", "assets/geometry/forest/lake-positions.json", "assets/geometry/forest/tile0-ground.json", "assets/geometry/forest/tile0-positions.json", "assets/geometry/forest/tree-0.json", "assets/geometry/forest/tree-1.json", "assets/geometry/lake_settings.json", "assets/geometry/tile0_settings.json", "assets/geometry/tree-mask.json", "assets/images/dementor/dementor001.png", "assets/images/ethereal/particle.jpg", "assets/images/ethereal/ramp.jpg", "assets/images/fallback/regular/intro.jpg", "assets/images/fallback/regular/static.jpg", "assets/images/fallback/small/intro-small.jpg", "assets/images/fallback/small/static-small.jpg", "assets/images/fireflies/particle.jpg", "assets/images/fonts/cursor.png", "assets/images/fonts/magorian-bold.fnt", "assets/images/fonts/magorian-bold.png", "assets/images/fonts/magorian.fnt", "assets/images/fonts/magorian.png", "assets/images/forest/ao-shadows-forest.jpg", "assets/images/forest/center.jpg", "assets/images/forest/flare.jpg", "assets/images/forest/fog01.png", "assets/images/forest/lake_ao_shadows.jpg", "assets/images/forest/map.jpg", "assets/images/forest/tree-ao.jpg", "assets/images/forest/trees.png", "assets/images/forest/waternormals.jpg", "assets/images/patronus/distortion.jpg", "assets/images/patronus/ramp.jpg", "assets/images/share/email.png", "assets/images/share/facebook.png", "assets/images/share/gplus.png", "assets/images/share/more.png", "assets/images/share/stumbleUpon.png", "assets/images/share/tumblr.png", "assets/images/share/twitter.png", "assets/images/text/reveal.jpg", "assets/images/ui/cursor-solid.png", "assets/images/ui/cursor.png", "assets/images/ui/headphones.png", "assets/images/ui/load.jpg", "assets/images/ui/wwlogo.png", "assets/images/ui/rotate.png", "assets/images/ui/text-shadow.png", "assets/js/lib/klang.js", "assets/js/lib/three.min.js", "assets/js/lib/uil.min.js", "assets/js/lib/whammy.js", "assets/shaders/compiled.vs"];
ASSETS.RES = {
    "assets/images/text/reveal.jpg": {
        xe: true
    },
    "assets/images/ui/text-shadow.png": {
        xe: true
    }
};
Class(function Config() {
    var _this = this;
    this.CDN = (function() {
        if (window._CDN_ && window._CDN_ !== "") {
            return window._CDN_
        }
        if (window._BUCKET_ && window._BUCKET_ !== "") {
			return "https://" + window._BUCKET_ + ".s3.amazonaws.com/"
        }
		// CHANGED: change CDN to wizardmore
        //return "http://wizardmore.com/"
		return "https://s3.amazonaws.com/wizardmore/"
    })();
    this.PROXY = "";
    this.PROFILE_SERVER = (function() {
        if (Hydra.LOCAL && window.PROFILE_SERVER && window.PROFILE_SERVER !== "") {
            return window.PROFILE_SERVER
        }
        return window.location.protocol + "//" + window.location.host
    })();
    this.COPY_URL = (function() {
        if (window._COPY_ && window._COPY_ !== "") {
            return window._COPY_
        }
        return _this.CDN + "assets/data/copy-full.json?160920"
    })();
	// CHANGED: Added / add end, else wizardmore doesn't function well
    this.QUIZ_API = this.PROFILE_SERVER + "/api/quiz/patronus-full/";
    this.USER_API = this.PROFILE_SERVER + "/user-profile";
    this.SITE_URL = this.PROFILE_SERVER + "/patronus-full";
    this.PROFILE_URL = this.PROFILE_SERVER + "/patronus-full"; // after finish quiz go back to patronus
    this.LOGIN_URL = this.PROFILE_SERVER + "/account/login?return_to=" + encodeURIComponent(this.SITE_URL) + "&origin=patronus";
    this.JOIN_URL = this.PROFILE_SERVER + "/account/join?return_to=" + encodeURIComponent(this.SITE_URL) + "&origin=patronus";
    this.SHARE_IMAGE_URL = this.CDN + "assets/meta/animals/";
    this.RENDER = false;
    this.QUESTION_TIME = 99999999999; // This is the full version, so no timer and excluded questions
    this.PATRONUS_TIME = _this.RENDER ? 100000 : 30000;
    this.NON_CORPOREAL = 3;
    this.FALLBACK = Hydra.HASH.strpos("fallback");
    this.RECORDING = false;
    this.RECORDING = false;
    this.USE_ANIMALS = false
}, "static");
Class(function PatronusEvents() {
    var _this = this;
    this.CAMERA_CHANGE = "camera_change"
}, "static");
Class(function QuizEvents() {
    this.LOADED = "loaded";
    this.INIT_COMPLETED = "init_completed";
    this.INIT_INTRO = "init_intro";
    this.LOGGED_OUT = "logged_out";
    this.UNVERIFIED = "unverified";
    this.LOGGED_IN = "logged_in";
    this.VERIFY = "verify";
    this.STATUS_CHECKED = "status_checked";
    this.OPEN_LOGIN_IFRAME = "open_login_iframe";
    this.OPEN_JOIN_IFRAME = "open_join_iframe";
    this.OPEN_IFRAME = "open_iframe";
    this.CLOSE_IFRAME = "close_iframe";
    this.START_QUIZ = "start_quiz";
    this.ANSWER = "answer";
    this.NEW_QUESTION = "new_question";
    this.START_QUESTION = "start_question";
    this.PATRONUS_RECEIVED = "patronus_received";
    this.NON_CORPOREAL_COMPLETE = "non_corporeal_complete";
    this.MESSAGE = "message";
    this.EMBED_LOADED = "embed_loaded";
    this.GL_READY = "gl_ready"
}, "static");
Class(function Antimatter(_num, _renderer) {
    Inherit(this, AntimatterCalculation);
    var _this = this;
    var _buffer, _geometry, _callback;
    var _cursor = 0;
    var _size = findSize();
    this.particleCount = _num;
    (function() {
        if (!window.Shader) {
            throw "Antimatter requires hydra-three"
        }
        _this.delayedCall(createBuffer, 16)
    })();

    function findSize() {
        var values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
        for (var i = 0; i < values.length; i++) {
            var p2 = values[i];
            if (p2 * p2 >= _num) {
                return p2
            }
        }
    }

    function createBuffer() {
        AntimatterUtil.createBufferArray(_size, _num, function(geometry, vertices) {
            _this.vertices = _this.vertices || new AntimatterAttribute(vertices, 4);
            _geometry = new THREE.BufferGeometry();
            _geometry.addAttribute("position", new THREE.BufferAttribute(geometry, 3));
            _this.vertices.geometry = _geometry;
            _this.init(_geometry, _renderer, _size);
            if (_callback) {
                _callback();
                _callback = null
            }
        })
    }
    this.createFloatArray = function(components) {
        return new Float32Array(_size * _size * (components || 3))
    };
    this.ready = function(callback) {
        _callback = callback
    };
    this.getMesh = function() {
        var shader = _this.createShader(_this.fragmentShader || "void main() { gl_FragColor = vec4(1.0); }");
        _this.mesh = new THREE.Points(_geometry, shader.material);
        _this.mesh.frustumCulled = false;
        _this.shader = shader;
        _this.geometry = _geometry;
        return _this.mesh
    };
    this.createShader = function(fs) {
        var uniforms = _this.uniforms || {};
        var shader = new Shader(_this.vertexShader || "AntimatterPosition", fs);
        shader.uniforms = THREE.UniformsUtils.merge([{
            tPos: {
                type: "t",
                value: _this.vertices.texture
            },
        }, uniforms]);
        return shader
    }
});
Class(function AntimatterAttribute(_data, _components) {
    Inherit(this, Component);
    var _this = this;
    var _size = Math.sqrt(_data.length / (_components || 3));
    this.size = _size;
    this.count = _size * _size;
    this.buffer = _data;
    this.texture = new THREE.DataTexture(_data, _size, _size, _components == 4 ? THREE.RGBAFormat : THREE.RGBFormat, THREE.FloatType);
    this.texture.needsUpdate = true;
    this.set("needsUpdate", function() {
        _this.texture.needsUpdate = true
    });
    this.clone = function() {
        var array = new Float32Array(_data.length);
        array.set(_data);
        return new AntimatterAttribute(array, _components)
    };
    this.onDestroy = function() {
        _this.texture && _this.texture.dispose && _this.texture.dispose()
    }
});
Class(function AntimatterCalculation() {
    Inherit(this, Component);
    var _this, _gpuGeom, _renderer, _size;
    var _scene, _mesh, _camera, _copy, _geometry;
    var _frames = 0;
    var _output = {
        type: "t",
        value: null
    };
    var _callbacks = [];
    this.passes = [];

    function initPasses() {
        _camera = new THREE.OrthographicCamera(_size / -2, _size / 2, _size / 2, _size / -2, 1, 1000);
        _geometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
        _scene = new THREE.Scene();
        _mesh = new THREE.Mesh(_geometry, new THREE.MeshBasicMaterial());
        _scene.add(_mesh);
        var copyShader = AntimatterCalculation.getCopyShader();
        _copy = new THREE.Mesh(_geometry, copyShader.material);
        _scene.add(_copy);
        _copy.visible = false
    }

    function copy(input, output) {
        var clear = _renderer.autoClear;
        _copy.visible = true;
        _mesh.visible = false;
        _copy.material.uniforms.tDiffuse.value = input.texture;
        _renderer.autoClear = false;
        _renderer.render(_scene, _camera, output, false);
        _renderer.autoClear = clear;
        _copy.visible = false;
        _mesh.visible = true
    }

    function postRender(callback) {
        _callbacks.push(callback)
    }
    this.init = function(geometry, renderer, size) {
        _this = this;
        _gpuGeom = geometry.attributes.position.array;
        _renderer = renderer;
        _size = size;
        initPasses()
    };
    this.addPass = function(pass, index) {
        _this = this;
        var add = function(pass, index) {
            if (typeof index == "number") {
                _this.passes.splice(index, 0, pass);
                return
            }
            _this.passes.push(pass)
        };
        if (_this.passes.length) {
            add(pass, index)
        } else {
            postRender(function() {
                add(pass, index)
            })
        }
    };
    this.findPass = function(name) {
        for (var i = 0; i < _this.passes.length; i++) {
            var pass = _this.passes[i];
            if (pass.name == name) {
                return pass
            }
        }
    };
    this.removePass = function(pass) {
        _this = this;
        if (typeof pass == "number") {
            _this.passes.splice(pass)
        } else {
            _this.passes.findAndRemove(pass)
        }
    };
    this.update = function() {
        _this = this;
        if (!_this.mesh) {
            return
        }
        var output = _output.value || _this.vertices.texture;
        for (var i = 0; i < _this.passes.length; i++) {
            var pass = _this.passes[i];
            var needsInit = !pass.init;
            var firstRender = !pass.first;
            if (needsInit) {
                pass.initialize(_size, _this.particleCount)
            }
            pass.first = true;
            _mesh.material = pass.shader.material;
            _mesh.material.uniforms.tInput.value = output;
            _mesh.material.uniforms.tValues.value = firstRender ? (i == _this.passes.length - 1 || pass.origin ? pass.origin || _this.vertices.texture : null) : pass.output;
            _mesh.material.uniforms.tPrev.value = firstRender ? (i == _this.passes.length - 1 ? _this.vertices.texture : null) : pass.getRead();
            _mesh.material.uniforms.time.value = Render.TSL;
            var rt = firstRender ? pass.getRT(0) : pass.getWrite();
            var output = pass.output;
            _renderer.render(_scene, _camera, rt);
            copy(rt, output);
            if (firstRender) {
                copy(rt, pass.getRT(1));
                copy(rt, pass.getRT(2));
                pass.setRead(2);
                pass.setWrite(1);
                if (i == 0 && _this.passes.length > 1) {
                    return
                }
            } else {
                pass.swap()
            }
        }
        if (!output) {
            return
        }
        _output.value = output;
        _this.mesh.material.uniforms.tPos = _output;
        if (_callbacks.length) {
            _callbacks.forEach(function(c) {
                c()
            });
            _callbacks.length = 0
        }
    };
    this.onDestroy = function() {
        _geometry.dispose();
        _this.vertices.destroy();
        _this.passes.forEach(function(pass) {
            pass.first = false;
            if (!_this.persistPasses) {
                pass && pass.destroy && pass.destroy()
            }
        });
        _this.mesh.material.dispose();
        _this.mesh.geometry.dispose()
    };
    this.getOutput = function() {
        return _output
    }
}, function() {
    var _shader;
    AntimatterCalculation.getCopyShader = function() {
        if (!_shader) {
            _shader = new Shader("AntimatterCopy", "AntimatterCopy");
            _shader.uniforms = {
                tDiffuse: {
                    type: "t",
                    value: null
                }
            }
        }
        return _shader
    }
});
Class(function AntimatterPass(_shader, _uni, _clone) {
    var _this = this;
    var _uniforms = {
        tInput: {
            type: "t",
            value: null
        },
        tPrev: {
            type: "t",
            value: null
        },
        tValues: {
            type: "t",
            value: null
        },
        time: {
            type: "f",
            value: 0
        },
        fSize: {
            type: "f",
            value: 64
        },
        fTotalNum: {
            type: "f",
            value: 64
        },
    };
    var _rts = [];
    var _read = 0;
    var _write = 0;
    this.uniforms = _uniforms;
    this.output = initRT(64);
    this.name = _shader;
    this.id = Utils.timestamp();
    (function() {
        if (_uni) {
            for (var key in _uni) {
                _uniforms[key] = _uni[key]
            }
        }
    })();

    function prepareShader(size) {
        var utils = Shaders.getShader("antimatter.glsl");
        var fragment = Shaders.getShader(_shader + ".fs");
        fragment = fragment.replace("@SIZE", size);
        return ["uniform sampler2D tInput;", "uniform sampler2D tPrev;", "uniform sampler2D tValues;", "uniform float fSize;", "uniform float fTotalNum;", "uniform float time;", "vec2 getUV() { return (gl_FragCoord.xy / fSize); }", "bool notUsed() { return (gl_FragCoord.x * gl_FragCoord.y) > fTotalNum; }", utils, fragment].join("\n")
    }

    function initRT(size) {
        var type = Mobile.os == "Android" ? THREE.FloatType : THREE.HalfFloatType;
        var parameters = {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false,
            type: type
        };
        var rt = new THREE.WebGLRenderTarget(size, size, parameters);
        rt.texture.generateMipmaps = false;
        return rt
    }
    this.addInput = function(name, attribute) {
        var uniform = (function() {
            if (typeof attribute === "object" && !attribute.height && typeof attribute.type === "string") {
                return attribute
            }
            if (attribute instanceof AntimatterAttribute) {
                return {
                    type: "t",
                    value: attribute.texture
                }
            }
            return {
                type: "t",
                value: attribute
            }
        })();
        _uniforms[name] = uniform
    };
    this.getRT = function(index) {
        return _rts[index]
    };
    this.getRead = function() {
        return _rts[_read]
    };
    this.getWrite = function() {
        return _rts[_write]
    };
    this.setRead = function(index) {
        _read = index
    };
    this.setWrite = function(index) {
        _write = index
    };
    this.swap = function() {
        _write++;
        if (_write > 2) {
            _write = 0
        }
        _read++;
        if (_read > 2) {
            _read = 0
        }
    };
    this.initialize = function(size, num) {
        if (_this.init) {
            return
        }
        _this.init = true;
        for (var i = 0; i < 3; i++) {
            _rts.push(initRT(size))
        }
        _this.output.setSize(size, size);
        _uniforms.fTotalNum.value = num;
        if (!(_shader instanceof Shader)) {
            _shader = new Shader("AntimatterPass", prepareShader(size));
            _shader.uniforms = _uniforms;
            _shader.id = Utils.timestamp()
        }
        _this.shader = _shader;
        _shader.uniforms.fSize.value = size
    };
    this.setUniform = function(key, value) {
        if (_shader && _shader.uniforms) {
            _shader.uniforms[key].value = value
        }
    };
    this.tween = function(key, value, time, ease, delay, callback, update) {
        TweenManager.tween(_shader.uniforms[key], {
            value: value
        }, time, ease, delay, callback, update)
    };
    this.clone = function() {
        return new AntimatterPass(_shader, _uni)
    };
    this.destroy = function() {
        _rts.forEach(function(rt) {
            rt && rt.dispose && rt.dispose()
        })
    }
});
Class(function AntimatterUtil() {
    Inherit(this, Component);
    var _this = this;
    var _thread;
    (function() {
        initThread()
    })();

    function initThread() {
        _thread = _this.initClass(Thread);
        _thread.loadFunction(createBufferArray)
    }

    function createBufferArray(e, id) {
        var size = e.size;
        var num = e.num;
        var position = new Float32Array(num * 3);
        for (var i = 0; i < num; i++) {
            position[i * 3 + 0] = (i % size) / size;
            position[i * 3 + 1] = Math.floor(i / size) / size;
            position[i * 3 + 2] = 0
        }
        var vertices = new Float32Array(num * 4);
        for (var i = 0; i < num; i++) {
            vertices[i * 4 + 0] = Utils.doRandom(-1500, 1500);
            vertices[i * 4 + 1] = Utils.doRandom(-1500, 1500);
            vertices[i * 4 + 2] = Utils.doRandom(-1000, 1000);
            vertices[i * 4 + 3] = 1
        }
        post({
            array: position,
            vertices: vertices
        }, id, [position.buffer, vertices.buffer])
    }
    this.createBufferArray = function(size, num, callback) {
        _thread.createBufferArray({
            size: size,
            num: num
        }, function(data) {
            callback(data.array, data.vertices)
        })
    }
}, "static");
Class(function CPUTest() {
    Inherit(this, Component);
    var _this = this;
    (function() {})();

    function calculate(e, id) {
        var start = Date.now();
        var array = [];
        for (var i = 0; i < 20000; i++) {
            array[i] = Math.pow(Math.sin(Math.random()), 2)
        }
        array = null;
        var end = Date.now();
        post({
            time: end - start
        }, id)
    }
    this.run = function(callback) {
        if (!Device.system.webworker) {
            return callback(9999)
        }
        var thread = _this.initClass(Thread);
        thread.loadFunction(calculate);
        thread.calculate({}, function(e) {
            callback(e.time);
            thread.destroy()
        })
    }
}, "static");
Module(function GPUBlacklist() {
    this.exports = {
        match: function() {
            if (!Device.graphics.webgl) {
                return true
            }
            return Device.graphics.webgl.detect(["radeon hd 6970m", "radeon hd 6770m", "radeon hd 6490m", "radeon hd 6630m", "radeon hd 6750m", "radeon hd 5750", "radeon hd 5670", "radeon hd 4850", "radeon hd 4870", "radeon hd 4670", "geforce 9400m", "geforce 320m", "geforce 330m", "geforce gt 130", "geforce gt 120", "geforce gtx 285", "geforce 8600", "geforce 9600m", "geforce 9400m", "geforce 8800 gs", "geforce 8800 gt", "quadro fx 5", "quadro fx 4", "radeon hd 2600", "radeon hd 2400", "radeon hd 2600", "radeon r9 200"])
        }
    }
});
Class(function Lighting() {
    Inherit(this, Component);
    var _this = this;
    var _particleDepthShader;
    var _lights = [];
    (function() {})();

    function loop() {
        decomposeLights(_lights)
    }

    function decomposeLights(lights) {
        for (var i = lights.length - 1; i > -1; i--) {
            var light = lights[i];
            if (!light.parent) {
                light.updateMatrixWorld()
            } else {
                if (!light.parent.parent) {
                    light.parent.updateMatrixWorld()
                }
            }
            if (!light._world) {
                light._world = new THREE.Vector3()
            }
            light.getWorldPosition(light._world)
        }
    }

    function updateArrays(shader) {
        var lights = shader.lights;
        var lighting = shader.__lighting;
        var light;
        lighting.position.length = 0;
        lighting.color.length = 0;
        lighting.intensity.length = 0;
        lighting.distance.length = 0;
        for (var i = 0; i < lights.length; i++) {
            light = lights[i];
            lighting.position.push(light._world);
            lighting.color.push(light.color.r, light.color.g, light.color.b);
            lighting.intensity.push(light.intensity);
            lighting.distance.push(light.distance)
        }
        for (i = 0; i < _lights.length; i++) {
            light = _lights[i];
            lighting.position.push(light._world);
            lighting.color.push(light.color.r, light.color.g, light.color.b);
            lighting.intensity.push(light.intensity);
            lighting.distance.push(light.distance)
        }
    }
    this.add = function(light) {
        _lights.push(light);
        Render.start(loop)
    };
    this.remove = function(light) {
        _lights.findAndRemove(light)
    };
    this.getLighting = function(shader, force) {
        if (shader.__lighting && !force) {
            return shader.__lighting
        }
        var lighting = {
            position: [],
            color: [],
            intensity: [],
            distance: []
        };
        shader.__lighting = lighting;
        if (_lights[0] && !_lights[0]._world) {
            decomposeLights(_lights)
        }
        decomposeLights(shader.lights);
        updateArrays(shader);
        return lighting
    };
    this.update = function(shader) {
        decomposeLights(shader.lights);
        updateArrays(shader)
    };
    this.getParticleDepthShader = function(light, size) {
        if (!_particleDepthShader) {
            _particleDepthShader = new Shader("ParticleDepth");
            _particleDepthShader.uniforms = {
                pointSize: {
                    type: "f",
                    value: size || 5
                },
                lightPos: {
                    type: "v3",
                    value: light.position
                },
                far: {
                    type: "f",
                    value: light.shadow.camera.far
                },
            };
            _particleDepthShader.receiveShadow = true
        }
        var shader = _particleDepthShader.clone();
        shader.set("pointSize", size || 5);
        shader.set("lightPos", light.position);
        shader.set("far", light.shadow.camera.far);
        return shader
    }
}, "static");
Class(function BasicPass() {
    Inherit(this, NukePass);
    var _this = this;
    this.fragmentShader = ["varying vec2 vUv;", "uniform sampler2D tDiffuse;", "void main() {", "gl_FragColor = texture2D(tDiffuse, vUv);", "}"];
    this.init(this.fragmentShader)
});
Class(function FXLayer(_parentNuke, _pass) {
    Inherit(this, Component);
    var _this = this;
    var _nuke, _rt;
    var _scene = new THREE.Scene();
    var _objects = [];
    var _rts = {};
    var _id = Utils.timestamp();
    this.resolution = 1;
    this.autoVisible = true;

    function addListeners() {
        _this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
    }

    function resizeHandler() {
        _rt.setSize(_nuke.stage.width * _this.resolution * _nuke.dpr, _nuke.stage.height * _this.resolution * _nuke.dpr)
    }

    function initRT() {
        _rt = Utils3D.createRT(_nuke.stage.width * _this.resolution * _nuke.dpr, _nuke.stage.height * _this.resolution * _nuke.dpr);
        _this.rt = _rt
    }
    this.create = function(nuke, pass) {
        _this = this;
        _nuke = _this.initClass(Nuke, nuke.stage, {
            renderer: nuke.renderer,
            camera: nuke.camera,
            scene: _scene,
            dpr: nuke.dpr
        });
        _nuke.parentNuke = nuke;
        if (pass) {
            _nuke.add(pass)
        }
        _this.nuke = _nuke;
        initRT();
        addListeners()
    };
    this.addObject = function(object) {
        var clone = object.clone();
        object["clone_" + _id] = clone;
        _scene.add(clone);
        _objects.push(object);
        return clone
    };
    this.removeObject = function(object) {
        _scene.remove(object["clone_" + _id]);
        _objects.findAndRemove(object);
        delete object["clone_" + _id]
    };
    this.render = this.draw = function(stage, camera) {
        if (stage) {
            _nuke.stage = stage;
            _this.setSize(stage.width, stage.height)
        }
        if (camera) {
            _nuke.camera = camera
        }
        for (var i = _objects.length - 1; i > -1; i--) {
            var obj = _objects[i];
            var clone = obj["clone_" + _id];
            if (_this.autoVisible) {
                clone.material.visible = true;
                var parent = obj;
                while (parent) {
                    if (parent.visible == false || (parent.material && parent.material.visible == false)) {
                        clone.material.visible = false
                    }
                    parent = parent.parent
                }
            }
            obj.updateMatrixWorld();
            Utils3D.decompose(obj, clone)
        }
        _nuke.rtt = _rt;
        _nuke.render()
    };
    this.addPass = function(pass) {
        _nuke.add(pass)
    };
    this.removePass = function(pass) {
        _nuke.remove(pass)
    };
    this.setSize = function(width, height) {
        if (_rt.width == width && _rt.height == height) {
            return
        }
        _this.events.unsubscribe(HydraEvents.RESIZE, resizeHandler);
        _rt.setSize(width * _this.resolution * _nuke.dpr, height * _this.resolution * _nuke.dpr);
        _nuke.setSize(width * _this.resolution * _nuke.dpr, height * _this.resolution * _nuke.dpr)
    };
    this.setDPR = function(dpr) {
        _nuke.dpr = dpr
    };
    if (_parentNuke instanceof Nuke) {
        this.create(_parentNuke, _pass)
    }
});
Namespace("FX");
Class(function Nuke(_stage, _params) {
    Inherit(this, Component);
    var _this = this;
    if (!_params.renderer) {
        console.error("Nuke :: Must define renderer")
    }
    _this.stage = _stage;
    _this.renderer = _params.renderer;
    _this.camera = _params.camera;
    _this.scene = _params.scene;
    _this.rtt = _params.rtt;
    _this.enabled = _params.enabled == false ? false : true;
    _this.passes = _params.passes || [];
    var _dpr = _params.dpr || 1;
    var _rts = {};
    var _rttPing, _rttPong, _nukeScene, _nukeMesh, _rttCamera;
    (function() {
        initNuke();
        addListeners()
    })();

    function initNuke() {
        var width = _this.stage.width * _dpr;
        var height = _this.stage.height * _dpr;
        _rttPing = Nuke.getRT(width, height, "ping");
        _rttPong = Nuke.getRT(width, height, "pong");
        _rttCamera = new THREE.OrthographicCamera(_this.stage.width / -2, _this.stage.width / 2, _this.stage.height / 2, _this.stage.height / -2, 1, 1000);
        _nukeScene = new THREE.Scene();
        _nukeMesh = new THREE.Mesh(Nuke.getPlaneGeom(), new THREE.MeshBasicMaterial());
        _nukeScene.add(_nukeMesh)
    }

    function finalRender(scene, camera) {
        if (_this.rtt) {
            _this.renderer.render(scene, camera || _this.camera, _this.rtt)
        } else {
            _this.renderer.render(scene, camera || _this.camera)
        }
    }

    function addListeners() {
        _this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
    }

    function resizeHandler() {
        var width = _this.stage.width * _dpr;
        var height = _this.stage.height * _dpr;
        _rttPing.setSize(width);
        _rttPong.setSize(height);
        _rttCamera.left = _this.stage.width / -2;
        _rttCamera.right = _this.stage.width / 2;
        _rttCamera.top = _this.stage.height / 2;
        _rttCamera.bottom = _this.stage.height / -2;
        _rttCamera.updateProjectionMatrix()
    }
    _this.add = function(pass, index) {
        if (!pass.pass) {
            defer(function() {
                _this.add(pass, index)
            });
            return
        }
        if (typeof index == "number") {
            _this.passes.splice(index, 0, pass);
            return
        }
        _this.passes.push(pass)
    };
    _this.remove = function(pass) {
        if (typeof pass == "number") {
            _this.passes.splice(pass)
        } else {
            _this.passes.findAndRemove(pass)
        }
    };
    _this.renderToTexture = function(clear, rtt) {
        _this.renderer.render(_this.scene, _this.camera, rtt || _rttPing, typeof clear == "boolean" ? clear : true)
    };
    _this.render = function() {
        if (!_this.enabled || !_this.passes.length) {
            finalRender(_this.scene);
            return
        }
        if (!_this.multiRender) {
            _this.renderer.render(_this.scene, _this.camera, _rttPing, true)
        }
        var pingPong = true;
        for (var i = 0; i < _this.passes.length - 1; i++) {
            _nukeMesh.material = _this.passes[i].pass;
            _nukeMesh.material.uniforms.tDiffuse.value = pingPong ? _rttPing : _rttPong;
            _this.renderer.render(_nukeScene, _rttCamera, pingPong ? _rttPong : _rttPing);
            pingPong = !pingPong
        }
        _nukeMesh.material = _this.passes[_this.passes.length - 1].pass;
        _nukeMesh.material.uniforms.tDiffuse.value = pingPong ? _rttPing : _rttPong;
        finalRender(_nukeScene, _rttCamera)
    };
    _this.setSize = function(width, height) {
        _this.events.unsubscribe(HydraEvents.RESIZE, resizeHandler);
        if (!_rts[width + "_" + height]) {
            var rttPing = Nuke.getRT(width * _dpr, height * _dpr, "ping");
            var rttPong = Nuke.getRT(width * _dpr, height * _dpr, "pong");
            _rts[width + "_" + height] = {
                ping: rttPing,
                pong: rttPong
            }
        }
        var rts = _rts[width + "_" + height];
        _rttPing = rts.ping;
        _rttPong = rts.pong
    };
    _this.set("dpr", function(v) {
        _dpr = v || Device.pixelRatio;
        resizeHandler()
    });
    _this.get("dpr", function() {
        return _dpr
    })
}, function() {
    var _plane;
    var _rts = {};
    Nuke.getPlaneGeom = function() {
        if (!_plane) {
            _plane = new THREE.PlaneBufferGeometry(2, 2, 1, 1)
        }
        return _plane
    };
    Nuke.getRT = function(width, height, type) {
        if (!_rts[type] || width != _rts[type].width) {
            _rts[type] = Utils3D.createRT(width, height)
        }
        return _rts[type]
    }
});
Class(function NukePass(_fs, _vs, _pass) {
    Inherit(this, Component);
    var _this = this;

    function prefix(code) {
        var pre = "";
        if (!code.strpos("uniform sampler2D tDiffuse")) {
            pre += "uniform sampler2D tDiffuse;\n";
            pre += "varying vec2 vUv;\n"
        }
        code = pre + code;
        return code
    }
    this.init = function(fs) {
        if (_this.pass) {
            return
        }
        _this = this;
        var name = fs || this.constructor.toString().match(/function ([^\(]+)/)[1];
        var fragmentShader = Array.isArray(fs) ? fs.join("") : null;
        _this.uniforms = _this.uniforms || {};
        _this.uniforms.tDiffuse = {
            type: "t",
            value: null
        };
        _this.pass = new THREE.ShaderMaterial({
            uniforms: _this.uniforms,
            vertexShader: typeof _vs === "string" ? Shaders.getShader(name + ".vs") : "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }",
            fragmentShader: fragmentShader || prefix(Shaders.getShader(name + ".fs"))
        });
        _this.uniforms = _this.pass.uniforms
    };
    this.set = function(key, value) {
        TweenManager.clearTween(_this.uniforms[key]);
        this.uniforms[key].value = value
    };
    this.tween = function(key, value, time, ease, delay, callback, update) {
        TweenManager.tween(_this.uniforms[key], {
            value: value
        }, time, ease, delay, callback, update)
    };
    this.clone = function() {
        if (!_this.pass) {
            _this.init(_fs)
        }
        return new NukePass(null, null, _this.pass.clone())
    };
    if (typeof _fs === "string") {
        defer(function() {
            _this.init(_fs)
        })
    } else {
        if (_pass) {
            _this.pass = _pass;
            _this.uniforms = _pass.uniforms
        }
    }
});
Class(function Raycaster(_camera) {
    Inherit(this, Component);
    var _this = this;
    var _mouse = new THREE.Vector3();
    var _raycaster = new THREE.Raycaster();
    var _debug = null;
    (function() {})();

    function intersect(objects) {
        var hit;
        if (Array.isArray(objects)) {
            hit = _raycaster.intersectObjects(objects)
        } else {
            hit = _raycaster.intersectObject(objects)
        }
        if (_debug) {
            updateDebug()
        }
        return hit
    }

    function updateDebug() {
        var vertices = _debug.geometry.vertices;
        vertices[0].copy(_raycaster.ray.origin.clone());
        vertices[1].copy(_raycaster.ray.origin.clone().add(_raycaster.ray.direction.clone().multiplyScalar(10000)));
        vertices[0].x += 1;
        _debug.geometry.verticesNeedUpdate = true
    }
    this.set("camera", function(camera) {
        _camera = camera
    });
    this.debug = function(scene) {
        var geom = new THREE.Geometry();
        geom.vertices.push(new THREE.Vector3(-100, 0, 0));
        geom.vertices.push(new THREE.Vector3(100, 0, 0));
        var mat = new THREE.LineBasicMaterial({
            color: 16711680
        });
        _debug = new THREE.Line(geom, mat);
        scene.add(_debug)
    };
    this.checkHit = function(objects, mouse) {
        mouse = mouse || Mouse;
        var rect = _this.rect || Stage;
        _mouse.x = (mouse.x / rect.width) * 2 - 1;
        _mouse.y = -(mouse.y / rect.height) * 2 + 1;
        _raycaster.setFromCamera(_mouse, _camera);
        return intersect(objects)
    };
    this.checkFromValues = function(objects, origin, direction) {
        _raycaster.set(origin, direction, 0, Number.POSITIVE_INFINITY);
        return intersect(objects)
    }
});
Class(function ScreenProjection(_camera) {
    Inherit(this, Component);
    var _this = this;
    var _v3 = new THREE.Vector3();
    var _value = new THREE.Vector3();
    (function() {})();
    this.set("camera", function(v) {
        _camera = v
    });
    this.unproject = function(mouse, distance) {
        var rect = _this.rect || Stage;
        _v3.set((mouse.x / rect.width) * 2 - 1, -(mouse.y / rect.height) * 2 + 1, 0.5);
        _v3.unproject(_camera);
        var pos = _camera.position;
        _v3.sub(pos).normalize();
        var dist = distance || -pos.z / _v3.z;
        _value.copy(pos).add(_v3.multiplyScalar(dist));
        return _value
    };
    this.project = function(pos, screen) {
        screen = screen || Stage;
        if (pos instanceof THREE.Object3D) {
            pos.updateMatrixWorld();
            _v3.set(0, 0, 0).setFromMatrixPosition(pos.matrixWorld)
        } else {
            _v3.copy(pos)
        }
        _v3.project(_camera);
        _v3.x = (_v3.x + 1) / 2 * screen.width;
        _v3.y = -(_v3.y - 1) / 2 * screen.height;
        return _v3
    }
});
Class(function RandomEulerRotation(_container) {
    var _this = this;
    var _euler = ["x", "y", "z"];
    var _rot;
    this.speed = 1;
    (function() {
        initRotation()
    })();

    function initRotation() {
        _rot = {};
        _rot.x = Utils.doRandom(0, 2);
        _rot.y = Utils.doRandom(0, 2);
        _rot.z = Utils.doRandom(0, 2);
        _rot.vx = Utils.doRandom(-5, 5) * 0.0025;
        _rot.vy = Utils.doRandom(-5, 5) * 0.0025;
        _rot.vz = Utils.doRandom(-5, 5) * 0.0025
    }
    this.update = function() {
        var time = Render.TIME;
        for (var i = 0; i < 3; i++) {
            var v = _euler[i];
            switch (_rot[v]) {
                case 0:
                    _container.rotation[v] += Math.cos(Math.sin(time * 0.25)) * _rot["v" + v] * _this.speed;
                    break;
                case 1:
                    _container.rotation[v] += Math.cos(Math.sin(time * 0.25)) * _rot["v" + v] * _this.speed;
                    break;
                case 2:
                    _container.rotation[v] += Math.cos(Math.cos(time * 0.25)) * _rot["v" + v] * _this.speed;
                    break
            }
        }
    };
    this.startRender = function() {
        Render.start(_this.update)
    };
    this.stopRender = function() {
        Render.stop(_this.update)
    }
});
Class(function Shader(_vertexShader, _fragmentShader, _name, _material) {
    Inherit(this, Component);
    var _this = this;
    this.receiveShadow = false;
    this.receiveLight = false;
    this.lights = [];
    (function() {
        if (!_fragmentShader) {
            _fragmentShader = _vertexShader
        }
        if (Hydra.LOCAL && _name) {
            expose()
        }
        if (_material) {
            _this.uniforms = _material.uniforms;
            _this.attributes = _material.attributes;
            defer(function() {
                if (_this.receiveLight) {
                    initLights();
                    Render.start(updateLights)
                }
            })
        }
    })();

    function expose() {
        Dev.expose(_name, _this)
    }

    function process(code, type) {
        var lights = initLights();
        var header;
        if (type == "vs") {
            header = ["precision highp float;", "precision highp int;", "attribute vec2 uv;", "attribute vec3 position;", "attribute vec3 normal;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "uniform mat4 modelMatrix;", "uniform mat4 viewMatrix;", "uniform mat3 normalMatrix;", "uniform vec3 cameraPosition;", ""].join("\n")
        } else {
            header = [code.strpos("dFdx") ? "#extension GL_OES_standard_derivatives : enable" : "", "precision highp float;", "precision highp int;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "uniform mat4 modelMatrix;", "uniform mat4 viewMatrix;", "uniform mat3 normalMatrix;", "uniform vec3 cameraPosition;", ""].join("\n")
        }
        code = lights + code;
        if (!_this.receiveShadow && !_this.useShaderMaterial) {
            code = header + code
        }
        var threeChunk = function(a, b) {
            return THREE.ShaderChunk[b] + "\n"
        };
        return code.replace(/#s?chunk\(\s?(\w+)\s?\);/g, threeChunk)
    }

    function initLights() {
        if (!_this.receiveLight) {
            return ""
        }
        var lighting = Lighting.getLighting(_this);
        var numLights = lighting.position.length;
        if (numLights == 0) {
            if (!Shader.disableWarnings) {
                console.warn("Lighting enabled but 0 lights added. Be sure to add them before calling shader.material")
            }
            return ""
        }
        return ["#define NUM_LIGHTS " + numLights, "uniform vec3 lightPos[" + numLights + "];", "uniform vec3 lightColor[" + numLights + "];", "uniform float lightIntensity[" + numLights + "];", "uniform float lightDistance[" + numLights + "];", "", ].join("\n")
    }

    function updateMaterialLight(lighting) {
        _material.uniforms.lightPos = {
            type: "v3v",
            value: lighting.position
        };
        _material.uniforms.lightColor = {
            type: "fv",
            value: lighting.color
        };
        _material.uniforms.lightIntensity = {
            type: "fv1",
            value: lighting.intensity
        };
        _material.uniforms.lightDistance = {
            type: "fv1",
            value: lighting.distance
        };
        Render.start(updateLights)
    }

    function updateLights() {
        if (_material.visible !== false) {
            Lighting.update(_this, true)
        }
    }
    this.get("material", function() {
        if (!_material) {
            var params = {};
            params.vertexShader = process(Shaders.getShader(_vertexShader + ".vs") || _vertexShader, "vs");
            params.fragmentShader = process(Shaders.getShader(_fragmentShader + ".fs") || _fragmentShader, "fs");
            if (_this.attributes) {
                params.attributes = _this.attributes
            }
            if (_this.uniforms) {
                params.uniforms = _this.uniforms
            }
            if (_this.receiveShadow) {
                params.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.lights, params.uniforms])
            }
            _material = _this.receiveShadow || _this.useShaderMaterial ? new THREE.ShaderMaterial(params) : new THREE.RawShaderMaterial(params);
            _material.shader = _this;
            _this.uniforms = _material.uniforms;
            if (_this.receiveLight) {
                updateMaterialLight(_this.__lighting)
            }
            if (_this.receiveShadow) {
                _material.lights = true
            }
        }
        return _material
    });
    this.set = function(key, value) {
        if (typeof value !== "undefined") {
            _this.uniforms[key].value = value
        }
        return _this.uniforms[key].value
    };
    this.getValues = function() {
        var out = {};
        for (var key in _this.uniforms) {
            out[key] = _this.uniforms[key].value
        }
        return out
    };
    this.copyUniformsTo = function(obj) {
        for (var key in _this.uniforms) {
            obj.uniforms[key] = _this.uniforms[key]
        }
    };
    this.tween = function(key, value, time, ease, delay, callback, update) {
        TweenManager.tween(_this.uniforms[key], {
            value: value
        }, time, ease, delay, callback, update)
    };
    this.clone = function(name) {
        var shader = new Shader(_vertexShader, _fragmentShader, name || _name, _this.material.clone());
        shader.receiveLight = this.receiveLight;
        shader.receiveShadow = this.receiveShadow;
        shader.lights = this.lights.splice(0);
        return shader
    };
    this.updateLighting = function() {
        var lighting = Lighting.getLighting(_this, true);
        _material.uniforms.lightPos.value = lighting.position;
        _material.uniforms.lightColor.value = lighting.color;
        _material.uniforms.lightIntensity.value = lighting.intensity;
        _material.uniforms.lightDistance.value = lighting.distance
    };
    this.onDestroy = function() {
        Render.stop(updateLights);
        _material && _material.dispose && _material.dispose()
    }
});
Class(function Utils3D() {
    var _this = this;
    var _objectLoader, _geomLoader, _bufferGeomLoader;
    var _textures = {};
    this.PATH = "";
    this.decompose = function(local, world) {
        local.matrixWorld.decompose(world.position, world.quaternion, world.scale)
    };
    this.createDebug = function(size, color) {
        var geom = new THREE.IcosahedronGeometry(size || 40, 1);
        var mat = color ? new THREE.MeshBasicMaterial({
            color: color
        }) : new THREE.MeshNormalMaterial();
        return new THREE.Mesh(geom, mat)
    };
    this.createRT = function(width, height) {
        var params = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        };
        return new THREE.WebGLRenderTarget(width, height, params)
    };
    this.getTexture = function(path) {
        if (!_textures[path]) {
            var img = new Image();
            img.crossOrigin = "";
            img.src = _this.PATH + path;
            var texture = new THREE.Texture(img);
            img.onload = function() {
                texture.needsUpdate = true;
                if (texture.onload) {
                    texture.onload();
                    texture.onload = null
                }
                if (!THREE.Math.isPowerOfTwo(img.width * img.height)) {
                    texture.minFilter = THREE.LinearFilter
                }
            };
            _textures[path] = texture
        }
        return _textures[path]
    };
    this.setInfinity = function(v) {
        var inf = Number.POSITIVE_INFINITY;
        v.set(inf, inf, inf);
        return v
    };
    this.freezeMatrix = function(mesh) {
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix()
    };
    this.getCubemap = function(src) {
        var path = "cube_" + (Array.isArray(src) ? src[0] : src);
        if (!_textures[path]) {
            var images = [];
            for (var i = 0; i < 6; i++) {
                var img = new Image();
                img.crossOrigin = "";
                img.src = _this.PATH + (Array.isArray(src) ? src[i] : src);
                images.push(img);
                img.onload = function() {
                    _textures[path].needsUpdate = true
                }
            }
            _textures[path] = new THREE.Texture();
            _textures[path].image = images;
            _textures[path].minFilter = THREE.LinearFilter
        }
        return _textures[path]
    };
    this.loadObject = function(name) {
        if (!_objectLoader) {
            _objectLoader = new THREE.ObjectLoader()
        }
        return _objectLoader.parse(Hydra.JSON[name])
    };
    this.loadGeometry = function(name) {
        if (!_geomLoader) {
            _geomLoader = new THREE.JSONLoader()
        }
        if (!_bufferGeomLoader) {
            _bufferGeomLoader = new THREE.BufferGeometryLoader()
        }
        var json = Hydra.JSON[name];
        if (json.type == "BufferGeometry") {
            return _bufferGeomLoader.parse(json)
        } else {
            return _geomLoader.parse(json.data).geometry
        }
    };
    this.disposeAllTextures = function() {
        for (var key in _textures) {
            _textures[key].dispose()
        }
    };
    this.disableWarnings = function() {
        window.console.warn = function(str, msg) {};
        window.console.error = function() {}
    };
    this.detectGPU = function(matches) {
        var gpu = _this.GPU_INFO;
        if (gpu.gpu && gpu.gpu.strpos(matches)) {
            return true
        }
        if (gpu.version && gpu.version.strpos(matches)) {
            return true
        }
        return false
    };
    this.loadBufferGeometry = function(name) {
        var data = Hydra.JSON[name];
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(data.position), 3));
        geometry.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(data.normal), 3));
        geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(data.uv), 2));
        return geometry
    };
    this.loadSkinnedGeometry = function(name) {
        var data = Hydra.JSON[name];
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(data.position), 3));
        geometry.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(data.normal), 3));
        geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(data.uv), 2));
        geometry.addAttribute("skinIndex", new THREE.BufferAttribute(new Float32Array(data.skinIndices), 4));
        geometry.addAttribute("skinWeight", new THREE.BufferAttribute(new Float32Array(data.skinWeights), 4));
        geometry.bones = data.bones;
        return geometry
    };
    this.loadCurve = function(obj) {
        if (typeof obj === "string") {
            obj = Hydra.JSON[obj]
        }
        var data = obj;
        var points = [];
        for (var j = 0; j < data.length; j += 3) {
            points.push(new THREE.Vector3(data[j + 0], data[j + 1], data[j + 2]))
        }
        return new THREE.CatmullRomCurve3(points)
    };
    this.setLightCamera = function(light, size, near, far, texture) {
        light.shadow.camera.left = -size;
        light.shadow.camera.right = size;
        light.shadow.camera.top = size;
        light.shadow.camera.bottom = -size;
        light.castShadow = true;
        if (near) {
            light.shadow.camera.near = near
        }
        if (far) {
            light.shadow.camera.far = far
        }
        if (texture) {
            light.shadow.mapSize.width = light.shadow.mapSize.height = texture
        }
        light.shadow.camera.updateProjectionMatrix()
    };
    this.getRepeatTexture = function(src) {
        var texture = this.getTexture(src);
        texture.onload = function() {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
        };
        return texture
    }
}, "static");
Module(function iOSDevices() {
    this.exports = {
        find: function() {
            if (Mobile.os != "iOS" || navigator.platform.toLowerCase().strpos("mac")) {
                return ""
            }
            if (!Device.graphics.webgl) {
                return "legacy"
            }
            var detect = Device.graphics.webgl.detect;
            if (detect(["a9", "a10", "a11", "a12", "a13", "a14"])) {
                return Mobile.phone ? "6s" : "ipad pro"
            }
            if (detect("a8")) {
                return Mobile.phone ? "6x" : "ipad air 2, ipad mini 4"
            }
            if (detect("a7")) {
                return Mobile.phone ? "5s" : "ipad air 1, ipad mini 2, ipad mini 3"
            }
            if (detect(["sgx554", "sgx 554"])) {
                return Mobile.phone ? "" : "ipad 4"
            }
            if (detect(["sgx543", "sgx 543"])) {
                return Mobile.phone ? "5x, 5c, 4s" : "ipad mini 1, ipad 2"
            }
            return "legacy"
        }
    }
});
Class(function KeyboardUtil() {
    Inherit(this, Component);
    var _this = this;
    _this.DOWN = "keyboard_down";
    _this.PRESS = "keyboard_press";
    _this.UP = "keyboard_up";
    (function() {
        Hydra.ready(addListeners)
    })();

    function addListeners() {
        __window.keydown(keydown);
        __window.keyup(keyup);
        __window.keypress(keypress)
    }

    function keydown(e) {
        _this.events.fire(_this.DOWN, e)
    }

    function keyup(e) {
        _this.events.fire(_this.UP, e)
    }

    function keypress(e) {
        _this.events.fire(_this.PRESS, e)
    }
}, "static");
Module(function Randomizr() {
    this.exports = random;
    var _last = [];

    function random(min, max, range) {
        var num = Utils.doRandom(min, max);
        if (max > 3) {
            while (_last.indexOf(num) > -1) {
                num = Utils.doRandom(min, max)
            }
            _last.push(num);
            if (_last.length > range) {
                _last.shift()
            }
        }
        return num
    }
});
Class(function ParticleConverter(_particles) {
    Inherit(this, Component);
    var _this = this;
    var _attributes = [];
    var _output = {};

    function initPool() {
        for (var i = 0; i < attributes.length; i++) {
            _pool = _this.initClass(ObjectPool)
        }
        for (var i = 0; i < 3; i++) {
            var array = new Float32Array(_particles.length * 3);
            _pool.put(array)
        }
    }

    function createPool(attr) {
        attr.pool = new ObjectPool();
        attr.pool.size = _particles.length * attr.size;
        for (var i = 0; i < 3; i++) {
            attr.pool.put(new Float32Array(attr.pool.size))
        }
    }

    function findAttribute(name) {
        for (var i = 0; i < _attributes.length; i++) {
            var attr = _attributes[i];
            if (attr.name == name) {
                return attr
            }
        }
    }
    this.addAttribute = function(name, params) {
        var attr = {
            name: name,
            size: params.length,
            params: params
        };
        _attributes.push(attr);
        return attr
    };
    this.exec = function() {
        for (var i = 0; i < _attributes.length; i++) {
            var attr = _attributes[i];
            if (attr.disabled) {
                delete _output[attr.name];
                continue
            }
            if (!attr.pool) {
                createPool(attr)
            }
            var array = attr.pool.get() || new Float32Array(_particles.length * attr.size);
            var p = _particles.start();
            var index = 0;
            while (p) {
                for (var j = 0; j < attr.size; j++) {
                    array[index * attr.size + j] = p[attr.params[j]] || p.pos[attr.params[j]] || 0
                }
                index++;
                p = _particles.next()
            }
            _output[attr.name] = array
        }
        return _output
    };
    this.recycle = function(e) {
        var attr = findAttribute(e.name);
        if (attr.pool && attr.size == e.array.length) {
            attr.pool.put(e.array)
        }
    };
    this.clear = function() {
        _attributes.forEach(function(attr) {
            attr.pool = attr.pool.destroy()
        })
    };
    this.findAttribute = findAttribute
});
Class(function Tags() {
    Inherit(this, Model);
    var _this = this;
    this.SETTINGS = {
        facebook: {
            version: "v2.7",
            appId: "756205141187469"
        },
        gplus: {
            clientId: "795233789139-cu7ig3i2ql3tj2rj40nlnfq91gmniptl.apps.googleusercontent.com",
            buttons: ["G-Plus-Share"]
        },
        gtag: "GTM-"
    };
    this.SHARE_LIST = ["facebook", "gplus"];
    this.TAG_LIST = ["gTag"];
    this.ANALYTICS = {
        googleAnalytics: false,
        googleTagManager: true,
        omniture: false
    };
    this.CODE = {
        facebook: function() {
            window.fbAsyncInit = function() {
                FB.init({
                    appId: _this.SETTINGS.facebook.appId,
                    xfbml: true,
                    version: _this.SETTINGS.facebook.version
                })
            };
            (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {
                    return
                }
                js = d.createElement(s);
                js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs)
            }(document, "script", "facebook-jssdk"))
        },
        gplus: function() {
            var btns = [];
            var script = document.createElement("script");
            script.src = "https://apis.google.com/js/platform.js";
            script.async = "defer";
            _this.SETTINGS.gplus.buttons.forEach(function(id, i) {
                var btn = document.createElement("div");
                btn.id = id;
                btn.style.top = -10000 + "px";
                btn.style.left = -10000 + "px";
                btns.push(btn)
            });
            Hydra.ready(function() {
                defer(function() {
                    btns.forEach(function(btn, i) {
                        document.body.insertBefore(btn, i > 0 ? document.body.children[i] : document.body.firstChild)
                    });
                    document.body.parentNode.insertBefore(script, document.body.nextSibling)
                })
            })
        },
        gTag: function() {
            var iframe = document.createElement("iframe");
            iframe.setAttribute("src", "//www.googletagmanager.com/ns.html?id=" + _this.SETTINGS.gtag);
            iframe.style.height = 0 + "px";
            iframe.style.width = 0 + "px";
            iframe.style.display = "none";
            iframe.style.visibility = "hidden";
            document.body.parentNode.insertBefore(iframe, document.body.nextSibling);
            (function(w, d, s, l, i) {
                w[l] = w[l] || [];
                w[l].push({
                    "gtm.start": new Date().getTime(),
                    event: "gtm.js"
                });
                var f = d.getElementsByTagName(s)[0],
                    j = d.createElement(s),
                    dl = l != "dataLayer" ? "&l=" + l : "";
                j.async = true;
                j.src = "//www.googletagmanager.com/gtm.js?id=" + i + dl;
                f.parentNode.insertBefore(j, f)
            })(window, document, "script", "dataLayer", _this.SETTINGS.gtag)
        }
    }
}, "Static");
Class(function Track() {
    Inherit(this, Model);
    var _this = this;
    var _debug = Storage.get("analyticDebug");
    var _cast = 0;
    var _timer = {
        start: null,
        end: null
    };
    (function() {
        defer(initDebug)
    })();

    function initDebug() {
        Dev.expose("analyticDebug", _this.debug)
    }

    function readableTime(duration) {
        var milliseconds = parseInt((duration % 1000) / 100),
            seconds = parseInt((duration / 1000) % 60);
        return seconds + "." + milliseconds + "s"
    }
    this.startTimer = function() {
        var _this = this;
        if (!_timer.start) {
            _timer.start = new Date().getTime()
        }
    };
    this.stopTimer = function() {
        _timer.end = new Date().getTime();
        var elapsed = _timer.end - _timer.start;
        _timer.start = null;
        return readableTime(elapsed)
    };
    this.page = function(section) {
        if (typeof ga !== "undefined") {
            if (Tags.ANALYTICS.googleTagManager) {
                ga(getTrackerID(), "pageview", section)
            }
            if (Tags.ANALYTICS.googleAnalytics) {
                ga("send", "pageview", section)
            }
        }
        if (_debug) {
            console.log("EVENT TRACKING>>>>>>>>>>> ", "pageview", section)
        }
    };
    this.event = function(params) {
        if (typeof ga !== "undefined") {
            if (Tags.ANALYTICS.googleTagManager) {
                dataLayer.push(params)
            }
        }
        if (_debug) {
            console.log(">>>>>>>>>>>>>>>>>>>> New Event <<<<<<<<<<<<<<<<<<<");
            for (var obj in params) {
                var type = params[obj];
                console.log(obj + " " + type)
            }
            console.log(">>>>>>>>>>>>>>>>>>>> End Event <<<<<<<<<<<<<<<<<<<")
        }
    };
    this.debug = function(bool) {
        _debug = bool;
        Storage.set("analytic_debug", bool)
    };
    this.cast = function() {
        var _this = this;
        _cast++;
        _this.event({
            event: "PatronusQuiz",
            action: "cast",
            totalCast: _cast,
            patronusName: Data.Patronus.getData(Data.User.getPatronus()).name
        })
    }
}, "Static");
Class(function UILItem(_name, _value, _params, _callback) {
    Inherit(this, Component);
    var _this = this;
    _value = Storage.get("uilitem_" + _name) || _value;
    if (typeof _params === "function") {
        _callback = _params;
        _params = null
    }(function() {
        _callback && _callback(_value);
        initUIL();
        UILItem.register(_this)
    })();

    function initUIL() {
        _this.obj = {
            name: _name,
            type: "html",
            value: _value,
            callback: callback
        };
        if (_params) {
            for (var key in _params) {
                _this.obj[key] = _params[key]
            }
        }
    }

    function callback(v) {
        _value = v;
        Storage.set("uilitem_" + _name, v);
        _callback && _callback(v)
    }
    this.get("value", function() {
        return _value
    });
    this.dump = function() {
        var value = _value;
        if (_name.toLowerCase().strpos("color")) {
            value = new Color(value).getHexString()
        }
        console.log(_name, value)
    }
}, function() {
    var _items = [];
    UILItem.register = function(item) {
        _items.push(item)
    };
    UILItem.dump = function() {
        _items.forEach(function(item) {
            item.dump()
        })
    }
});
Class(function ViveControllers() {
    Inherit(this, Component);
    var _this = this;
    var _controls, _quaternion;
    var _controllers = [];
    (function() {})();

    function getGamepads() {
        var gamepads = [];
        var availableGamepads = navigator.getGamepads();
        for (var i = 0; i < availableGamepads.length; ++i) {
            var gamepad = availableGamepads[i];
            if (gamepad && gamepad.pose) {
                gamepads.push(gamepad)
            }
        }
        return gamepads
    }

    function loop() {
        var gamepads = getGamepads();
        _controllers.every(function(controller, i) {
            if (!gamepads[i]) {
                return false
            }
            var gamepad = gamepads[i];
            if (!controller.object.lastPosition) {
                controller.object.lastPosition = new THREE.Vector3()
            }
            if (!controller.object.movement) {
                controller.object.movement = new THREE.Vector3()
            }
            controller.object.position.fromArray(gamepad.pose.position);
            if (_controls) {
                controller.object.position.applyMatrix4(_controls.standingMatrix);
                controller.object.quaternion.setFromRotationMatrix(_controls.standingMatrix)
            }
            controller.object.movement.copy(controller.object.position).sub(controller.object.lastPosition);
            controller.object.velocity = controller.object.movement.length();
            controller.object.lastPosition.copy(controller.object.position);
            _quaternion.fromArray(gamepad.pose.orientation);
            controller.object.quaternion.multiply(_quaternion);
            var touchPad = gamepad.buttons[0];
            var trigger = gamepad.buttons[1];
            var menu = gamepad.buttons[3];
            if (touchPad) {
                if (controller.touchPad.touched !== touchPad.touched) {
                    controller.fireEvent(touchPad.touched ? "touchPadStart" : "touchPadEnd")
                }
                controller.touchPad.touched = touchPad.touched;
                if (controller.touchPad.pressed !== touchPad.pressed) {
                    controller.fireEvent(touchPad.pressed ? "touchPadDown" : "touchPadUp")
                }
                controller.touchPad.pressed = touchPad.pressed
            }
            if (trigger) {
                if (controller.trigger.pressed !== trigger.pressed) {
                    controller.fireEvent(trigger.pressed ? "triggerPull" : "triggerRelease")
                }
                controller.trigger.pressed = trigger.pressed;
                if (controller.trigger.value !== trigger.value) {
                    controller.fireEvent("triggerChange", trigger.value)
                }
                controller.trigger.value = trigger.value
            }
            if (menu) {
                if (controller.menu.pressed !== menu.pressed) {
                    controller.fireEvent(menu.pressed ? "menuDown" : "menuUp")
                }
                controller.menu.pressed = menu.pressed
            }
            if (typeof controller.vibration == "number") {
                gamepad.vibrate(controller.vibration);
                controller.vibration = null
            }
            return true
        })
    }
    this.addControls = function(controls) {
        _controls = controls;
        _quaternion = new THREE.Quaternion()
    };
    this.addController = function(object) {
        Render.start(loop);
        object.rotation.reorder("YXZ");
        var controller = {
            index: _controllers.length,
            object: object,
            menu: {
                pressed: false
            },
            trigger: {
                pressed: false,
                value: 0
            },
            touchPad: {
                touched: false,
                pressed: false
            },
            fireEvent: function(event, value) {
                if (typeof this[event] == "function") {
                    this[event]({
                        controller: this,
                        event: event,
                        value: value
                    })
                }
            },
            vibration: null,
            vibrate: function(value) {
                this.vibration = value || 10
            },
        };
        _controllers.push(controller);
        return controller
    }
}, "static");
Class(function WebGLText(_options) {
    Inherit(this, Component);
    var _this = this;
    var _data, _texture, _shader, _text, _mesh;
    var _params = {
        font: _options.font,
        image: _options.image,
        text: _options.text,
        vs: _options.vs || "SDFText",
        fs: _options.fs || "SDFText",
        opacity: _options.opacity && typeof _options.opacity == "number" ? _options.opacity : 1,
        color: _options.color || "#fff",
        width: _options.width || 1000,
        align: _options.align || "center",
        letterSpacing: _options.letterSpacing || 0,
    };
    (function() {
        initData();
        initTexture();
        initGeometry();
        initShader();
        initMesh()
    })();

    function initData() {
        _data = WebGLText.getFont(_params.font)
    }

    function initTexture() {
        _texture = Utils3D.getTexture(_params.image);
        _texture.minFilter = THREE.LinearMipMapLinearFilter;
        _texture.magFilter = THREE.LinearFilter;
        _texture.generateMipmaps = true;
        _texture.anisotropy = 16
    }

    function initGeometry() {
        _text = new BMFontText({
            text: _params.text,
            font: _data,
            width: _params.width,
            align: _params.align,
            letterSpacing: _params.letterSpacing || 0,
        });
        _text.geometry.rotateZ(Math.PI);
        _text.geometry.translate((_params.align == "left" ? 0 : _params.align == "right" ? 1 : 0.5) * _params.width, 0, 0)
    }

    function initShader() {
        var combine = function(parent, child) {
            if (parent == child) {
                parent = parent.replace("#params", "");
                parent = parent.replace("#main", "")
            } else {
                var split = child.split("void main() {");
                parent = parent.replace("#params", split[0]);
                parent = parent.replace("#main", split[1].slice(0, -1))
            }
            return parent
        };
        var vs = combine(Shaders.getShader("SDFText.vs"), Shaders.getShader(_params.vs + ".vs"));
        var fs = combine(Shaders.getShader("SDFText.fs"), Shaders.getShader(_params.fs + ".fs"));
        _shader = WebGLText.getShader(vs, fs, _params);
        _shader.uniforms.map.value = _texture;
        _shader.uniforms.opacity.value = _params.opacity;
        _shader.uniforms.count.value = _text.geometry.attributes.letter.count / 4;
        _shader.uniforms.color.value = new THREE.Color(_params.color);
        _this.shader = _shader
    }

    function initMesh() {
        _mesh = new THREE.Mesh(_text.geometry, _shader.material);
        _mesh.frustumCulled = false
    }
    this.get("mesh", function() {
        return _mesh
    });
    this.get("shader", function() {
        return _shader
    })
}, function() {
    var _fonts = {};
    var _shaders = {};
    WebGLText.getFont = function(font) {
        if (_fonts[font]) {
            return _fonts[font]
        }
        _fonts[font] = new BMFontParser().parse(font);
        return _fonts[font]
    };
    WebGLText.getShader = function(vs, fs, params) {
        if (_shaders[params.fs + "_" + params.vs]) {
            return _shaders[params.fs + "_" + params.vs].clone()
        }
        var shader = new Shader(vs, fs);
        shader.uniforms = {
            map: {
                type: "t",
                value: null
            },
            opacity: {
                type: "f",
                value: 1
            },
            count: {
                type: "f",
                value: 1
            },
            color: {
                type: "c",
                value: null
            },
        };
        shader.material.side = THREE.DoubleSide;
        shader.material.transparent = true;
        shader.material.extensions.derivatives = true;
        _shaders[params.fs + "_" + params.vs] = shader;
        return shader
    }
});
Class(function BMFontLayout() {
    var _this = this;
    var prototype = BMFontLayout.prototype;
    var X_HEIGHTS = ["x", "e", "a", "o", "n", "s", "r", "c", "u", "m", "v", "w", "z"];
    var M_WIDTHS = ["m", "w"];
    var CAP_HEIGHTS = ["H", "I", "N", "E", "F", "K", "L", "T", "U", "V", "W", "X", "Y", "Z"];
    var TAB_ID = "\t".charCodeAt(0);
    var SPACE_ID = " ".charCodeAt(0);
    var ALIGN_LEFT = 0,
        ALIGN_CENTER = 1,
        ALIGN_RIGHT = 2;
    var wordWrap = new BMFontWordWrap();
    var xtend = function(target) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
                if (hasOwnProperty.call(source, key)) {
                    target[key] = source[key]
                }
            }
        }
        return target
    };
    var findChar = (function(property) {
        if (!property || typeof property !== "string") {
            throw new Error("must specify property for indexof search")
        }
        return new Function("array", "value", "start", ["start = start || 0", "for (var i=start; i<array.length; i++)", '  if (array[i]["' + property + '"] === value)', "      return i", "return -1"].join("\n"))
    })("id");
    var number = function(num, def) {
        return typeof num === "number" ? num : (typeof def === "number" ? def : 0)
    };
    prototype.init = function(opt) {
        this.glyphs = [];
        this._measure = this.computeMetrics.bind(this);
        this.update(opt)
    };
    prototype.update = function(opt) {
        opt = xtend({
            measure: this._measure
        }, opt);
        this._opt = opt;
        this._opt.tabSize = number(this._opt.tabSize, 4);
        if (!opt.font) {
            throw new Error("must provide a valid bitmap font")
        }
        var glyphs = this.glyphs;
        var text = opt.text || "";
        var font = opt.font;
        this._setupSpaceGlyphs(font);
        var lines = wordWrap.lines(text, opt);
        var minWidth = opt.width || 0;
        glyphs.length = 0;
        var maxLineWidth = lines.reduce(function(prev, line) {
            return Math.max(prev, line.width, minWidth)
        }, 0);
        var x = 0;
        var y = 0;
        var lineHeight = number(opt.lineHeight, font.common.lineHeight);
        var baseline = font.common.base;
        var descender = lineHeight - baseline;
        var letterSpacing = opt.letterSpacing || 0;
        var height = lineHeight * lines.length - descender;
        var align = getAlignType(this._opt.align);
        y -= height;
        this._width = maxLineWidth;
        this._height = height;
        this._descender = lineHeight - baseline;
        this._baseline = baseline;
        this._xHeight = getXHeight(font);
        this._capHeight = getCapHeight(font);
        this._lineHeight = lineHeight;
        this._ascender = lineHeight - descender - this._xHeight;
        var self = this;
        lines.forEach(function(line, lineIndex) {
            var start = line.start;
            var end = line.end;
            var lineWidth = line.width;
            var lastGlyph;
            for (var i = start; i < end; i++) {
                var id = text.charCodeAt(i);
                var glyph = self.getGlyph(font, id);
                if (glyph) {
                    if (lastGlyph) {
                        x += getKerning(font, lastGlyph.id, glyph.id)
                    }
                    var tx = x;
                    if (align === ALIGN_CENTER) {
                        tx += (maxLineWidth - lineWidth) / 2
                    } else {
                        if (align === ALIGN_RIGHT) {
                            tx += (maxLineWidth - lineWidth)
                        }
                    }
                    glyphs.push({
                        position: [tx, y],
                        data: glyph,
                        index: i,
                        line: lineIndex
                    });
                    x += glyph.xadvance + letterSpacing;
                    lastGlyph = glyph
                }
            }
            y += lineHeight;
            x = 0
        });
        this._linesTotal = lines.length
    };
    prototype._setupSpaceGlyphs = function(font) {
        this._fallbackSpaceGlyph = null;
        this._fallbackTabGlyph = null;
        if (!font.chars || font.chars.length === 0) {
            return
        }
        space = getMGlyph(font);
        var tabWidth = this._opt.tabSize * space.xadvance;
        this._fallbackSpaceGlyph = space;
        this._fallbackSpaceGlyph = space;
        this._fallbackTabGlyph = xtend(space, {
            x: 0,
            y: 0,
            xadvance: tabWidth,
            id: TAB_ID,
            xoffset: 0,
            yoffset: 0,
            width: 0,
            height: 0
        })
    };
    prototype.getGlyph = function(font, id) {
        var glyph = getGlyphById(font, id);
        if (glyph) {
            return glyph
        } else {
            if (id === TAB_ID) {
                return this._fallbackTabGlyph
            } else {
                if (id === SPACE_ID) {
                    return this._fallbackSpaceGlyph
                }
            }
        }
        return null
    };
    prototype.computeMetrics = function(text, start, end, width) {
        var letterSpacing = this._opt.letterSpacing || 0;
        var font = this._opt.font;
        var curPen = 0;
        var curWidth = 0;
        var count = 0;
        var glyph, lastGlyph;
        if (!font.chars || font.chars.length === 0) {
            return {
                start: start,
                end: start,
                width: 0
            }
        }
        end = Math.min(text.length, end);
        for (var i = start; i < end; i++) {
            var id = text.charCodeAt(i);
            var glyph = this.getGlyph(font, id);
            if (glyph) {
                var xoff = glyph.xoffset;
                var kern = lastGlyph ? getKerning(font, lastGlyph.id, glyph.id) : 0;
                curPen += kern;
                var nextPen = curPen + glyph.xadvance + letterSpacing;
                var nextWidth = curPen + glyph.width;
                if (nextWidth >= width || nextPen >= width) {
                    break
                }
                curPen = nextPen;
                curWidth = nextWidth;
                lastGlyph = glyph
            }
            count++
        }
        if (lastGlyph) {
            curWidth += lastGlyph.xoffset
        }
        return {
            start: start,
            end: start + count,
            width: curWidth
        }
    };
    ["width", "height", "descender", "ascender", "xHeight", "baseline", "capHeight", "lineHeight"].forEach(addGetter);

    function addGetter(name) {
        Object.defineProperty(prototype, name, {
            get: wrapper(name),
            configurable: true
        })
    }

    function wrapper(name) {
        return (new Function(["return function " + name + "() {", "  return this._" + name, "}"].join("\n")))()
    }

    function getGlyphById(font, id) {
        if (!font.chars || font.chars.length === 0) {
            return null
        }
        var glyphIdx = findChar(font.chars, id);
        if (glyphIdx >= 0) {
            return font.chars[glyphIdx]
        }
        return null
    }

    function getXHeight(font) {
        for (var i = 0; i < X_HEIGHTS.length; i++) {
            var id = X_HEIGHTS[i].charCodeAt(0);
            var idx = findChar(font.chars, id);
            if (idx >= 0) {
                return font.chars[idx].height
            }
        }
        return 0
    }

    function getMGlyph(font) {
        return 0
    }

    function getCapHeight(font) {
        for (var i = 0; i < CAP_HEIGHTS.length; i++) {
            var id = CAP_HEIGHTS[i].charCodeAt(0);
            var idx = findChar(font.chars, id);
            if (idx >= 0) {
                return font.chars[idx].height
            }
        }
        return 0
    }

    function getKerning(font, left, right) {
        if (!font.kernings || font.kernings.length === 0) {
            return 0
        }
        var table = font.kernings;
        for (var i = 0; i < table.length; i++) {
            var kern = table[i];
            if (kern.first === left && kern.second === right) {
                return kern.amount
            }
        }
        return 0
    }

    function getAlignType(align) {
        if (align === "center") {
            return ALIGN_CENTER
        } else {
            if (align === "right") {
                return ALIGN_RIGHT
            }
        }
        return ALIGN_LEFT
    }
});
Class(function BMFontParser() {
    Inherit(this, Component);
    var _this = this;
    (function() {})();

    function parse(data) {
        if (!data) {
            throw new Error("no data provided")
        }
        data = data.toString().trim();
        var output = {
            pages: [],
            chars: [],
            kernings: []
        };
        var lines = data.split(/\r\n?|\n/g);
        if (lines.length === 0) {
            throw new Error("no data in BMFont file")
        }
        for (var i = 0; i < lines.length; i++) {
            var lineData = splitLine(lines[i], i);
            if (!lineData) {
                continue
            }
            if (lineData.key === "page") {
                if (typeof lineData.data.id !== "number") {
                    throw new Error("malformed file at line " + i + " -- needs page id=N")
                }
                if (typeof lineData.data.file !== "string") {
                    throw new Error("malformed file at line " + i + ' -- needs page file="path"')
                }
                output.pages[lineData.data.id] = lineData.data.file
            } else {
                if (lineData.key === "chars" || lineData.key === "kernings") {} else {
                    if (lineData.key === "char") {
                        output.chars.push(lineData.data)
                    } else {
                        if (lineData.key === "kerning") {
                            output.kernings.push(lineData.data)
                        } else {
                            output[lineData.key] = lineData.data
                        }
                    }
                }
            }
        }
        return output
    }

    function splitLine(line, idx) {
        line = line.replace(/\t+/g, " ").trim();
        if (!line) {
            return null
        }
        var space = line.indexOf(" ");
        if (space === -1) {
            throw new Error("no named row at line " + idx)
        }
        var key = line.substring(0, space);
        line = line.substring(space + 1);
        line = line.replace(/letter=[\'\"]\S+[\'\"]/gi, "");
        line = line.split("=");
        line = line.map(function(str) {
            return str.trim().match((/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g))
        });
        var data = [];
        for (var i = 0; i < line.length; i++) {
            var dt = line[i];
            if (i === 0) {
                data.push({
                    key: dt[0],
                    data: ""
                })
            } else {
                if (i === line.length - 1) {
                    data[data.length - 1].data = parseData(dt[0])
                } else {
                    data[data.length - 1].data = parseData(dt[0]);
                    data.push({
                        key: dt[1],
                        data: ""
                    })
                }
            }
        }
        var out = {
            key: key,
            data: {}
        };
        data.forEach(function(v) {
            out.data[v.key] = v.data
        });
        return out
    }

    function parseData(data) {
        if (!data || data.length === 0) {
            return ""
        }
        if (data.indexOf('"') === 0 || data.indexOf("'") === 0) {
            return data.substring(1, data.length - 1)
        }
        if (data.indexOf(",") !== -1) {
            return parseIntList(data)
        }
        return parseInt(data, 10)
    }

    function parseIntList(data) {
        return data.split(",").map(function(val) {
            return parseInt(val, 10)
        })
    }
    this.parse = function(font) {
        var data = Hydra.JSON[font];
        if (!data) {
            return console.error("Font has not been loaded:", font)
        }
        return parse(data)
    }
});
Class(function BMFontText(_opt) {
    Inherit(this, Component);
    var _this = this;
    var _layout;
    (function() {
        update()
    })();

    function update() {
        if (!_opt.font) {
            throw new TypeError("must specify a { font } in options")
        }
        _layout = new BMFontLayout();
        _layout.init(_opt);
        var flipY = _opt.flipY !== false;
        var font = _opt.font;
        var texWidth = font.common.scaleW;
        var texHeight = font.common.scaleH;
        var glyphs = _layout.glyphs.filter(function(glyph) {
            var bitmap = glyph.data;
            return bitmap.width * bitmap.height > 0
        });
        this.visibleGlyphs = glyphs;
        var positions = getPositions(glyphs);
        var texUVs = positions.uvs;
        positions = positions.positions;
        var uvs = getUvs(glyphs, texWidth, texHeight, flipY);
        var indices = createQuadElements({
            clockwise: true,
            type: "uint16",
            count: glyphs.length
        });
        var letters = [];
        var offsets = [];
        var orientations = [];
        var scales = [];
        var newPositions = [];
        var newUvs = [];
        var newTexUvs = [];
        indices.forEach(function(index) {
            newPositions.push(positions[index * 3 + 0]);
            newPositions.push(positions[index * 3 + 1]);
            newPositions.push(positions[index * 3 + 2]);
            newUvs.push(uvs[index * 2 + 0]);
            newUvs.push(uvs[index * 2 + 1]);
            newTexUvs.push(texUVs[index * 2 + 0]);
            newTexUvs.push(texUVs[index * 2 + 1]);
            letters.push(Math.floor(index / 4) + 1);
            offsets.push(0);
            offsets.push(0);
            offsets.push(0);
            orientations.push(0);
            orientations.push(0);
            orientations.push(0);
            orientations.push(1);
            scales.push(1)
        });
        _this.geometry = new THREE.BufferGeometry();
        var position = new THREE.BufferAttribute(new Float32Array(newPositions), 3);
        var uv = new THREE.BufferAttribute(new Float32Array(newUvs), 2);
        var texuv = new THREE.BufferAttribute(new Float32Array(newTexUvs), 2);
        var letter = new THREE.BufferAttribute(new Float32Array(letters), 1);
        var offset = new THREE.BufferAttribute(new Float32Array(offsets), 3);
        var orientation = new THREE.BufferAttribute(new Float32Array(orientations), 4);
        var scale = new THREE.BufferAttribute(new Float32Array(scales), 1);
        _this.geometry.addAttribute("position", position);
        _this.geometry.addAttribute("uv", uv);
        _this.geometry.addAttribute("texuv", texuv);
        _this.geometry.addAttribute("letter", letter);
        _this.geometry.addAttribute("offset", offset);
        _this.geometry.addAttribute("orientation", orientation);
        _this.geometry.addAttribute("scale", scale);
        _this.geometry.computeBoundingSphere = computeBoundingSphere;
        _this.geometry.computeBoundingBox = computeBoundingBox
    }

    function pages(glyphs) {
        var pages = new Float32Array(glyphs.length * 4 * 1);
        var i = 0;
        glyphs.forEach(function(glyph) {
            var id = glyph.data.page || 0;
            pages[i++] = id;
            pages[i++] = id;
            pages[i++] = id;
            pages[i++] = id
        });
        return pages
    }

    function getUvs(glyphs, texWidth, texHeight, flipY) {
        var uvs = new Float32Array(glyphs.length * 4 * 2);
        var i = 0;
        glyphs.forEach(function(glyph) {
            var bitmap = glyph.data;
            var bw = (bitmap.x + bitmap.width);
            var bh = (bitmap.y + bitmap.height);
            var u0 = bitmap.x / texWidth;
            var u1 = bw / texWidth;
            var v1 = (texHeight - bitmap.y) / texHeight;
            var v0 = (texHeight - bh) / texHeight;
            uvs[i++] = u0;
            uvs[i++] = v1;
            uvs[i++] = u0;
            uvs[i++] = v0;
            uvs[i++] = u1;
            uvs[i++] = v0;
            uvs[i++] = u1;
            uvs[i++] = v1
        });
        return uvs
    }

    function getPositions(glyphs) {
        var positions = new Float32Array(glyphs.length * 3 * 4);
        var uvs = new Float32Array(glyphs.length * 2 * 4);
        var i = 0;
        var uvi = 0;
        glyphs.forEach(function(glyph) {
            var bitmap = glyph.data;
            var x = glyph.position[0] + bitmap.xoffset;
            var y = glyph.position[1] + bitmap.yoffset;
            var w = bitmap.width;
            var h = bitmap.height;
            positions[i++] = x;
            positions[i++] = y;
            positions[i++] = 0;
            uvs[uvi++] = 1;
            uvs[uvi++] = 1;
            positions[i++] = x;
            positions[i++] = y + h;
            positions[i++] = 0;
            uvs[uvi++] = 1;
            uvs[uvi++] = 0;
            positions[i++] = x + w;
            positions[i++] = y + h;
            positions[i++] = 0;
            uvs[uvi++] = 0;
            uvs[uvi++] = 0;
            positions[i++] = x + w;
            positions[i++] = y;
            positions[i++] = 0;
            uvs[uvi++] = 0;
            uvs[uvi++] = 1
        });
        return {
            positions: positions,
            uvs: uvs
        }
    }

    function dtype(dtype) {
        switch (dtype) {
            case "int8":
                return Int8Array;
            case "int16":
                return Int16Array;
            case "int32":
                return Int32Array;
            case "uint8":
                return Uint8Array;
            case "uint16":
                return Uint16Array;
            case "uint32":
                return Uint32Array;
            case "float32":
                return Float32Array;
            case "float64":
                return Float64Array;
            case "array":
                return Array;
            case "uint8_clamped":
                return Uint8ClampedArray
        }
    }

    function createQuadElements(opt) {
        var CW = [0, 2, 3];
        var CCW = [2, 1, 3];
        var array = null;
        var type = typeof opt.type === "string" ? opt.type : "uint16";
        var count = typeof opt.count === "number" ? opt.count : 1;
        var start = (opt.start || 0);
        var dir = opt.clockwise !== false ? CW : CCW,
            a = dir[0],
            b = dir[1],
            c = dir[2];
        var numIndices = count * 6;
        var indices = [];
        for (var i = 0, j = 0; i < numIndices; i += 6, j += 4) {
            var x = i + start;
            indices[x + 0] = j + 0;
            indices[x + 1] = j + 1;
            indices[x + 2] = j + 2;
            indices[x + 3] = j + a;
            indices[x + 4] = j + b;
            indices[x + 5] = j + c
        }
        return indices
    }
    var itemSize = 2;
    var box = {
        min: [0, 0],
        max: [0, 0]
    };

    function bounds(positions) {
        var count = positions.length / itemSize;
        box.min[0] = positions[0];
        box.min[1] = positions[1];
        box.max[0] = positions[0];
        box.max[1] = positions[1];
        for (var i = 0; i < count; i++) {
            var x = positions[i * itemSize + 0];
            var y = positions[i * itemSize + 1];
            box.min[0] = Math.min(x, box.min[0]);
            box.min[1] = Math.min(y, box.min[1]);
            box.max[0] = Math.max(x, box.max[0]);
            box.max[1] = Math.max(y, box.max[1])
        }
    }

    function computeBoundingSphere() {
        if (this.boundingSphere === null) {
            this.boundingSphere = new THREE.Sphere()
        }
        var positions = this.attributes.position.array;
        var itemSize = this.attributes.position.itemSize;
        if (!positions || !itemSize || positions.length < 2) {
            this.boundingSphere.radius = 0;
            this.boundingSphere.center.set(0, 0, 0);
            return
        }
        var computeSphere = function(positions, output) {
            bounds(positions);
            var minX = box.min[0];
            var minY = box.min[1];
            var maxX = box.max[0];
            var maxY = box.max[1];
            var width = maxX - minX;
            var height = maxY - minY;
            var length = Math.sqrt(width * width + height * height);
            output.center.set(minX + width / 2, minY + height / 2, 0);
            output.radius = length / 2
        };
        computeSphere(positions, this.boundingSphere);
        if (isNaN(this.boundingSphere.radius)) {
            console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.')
        }
    }

    function computeBoundingBox() {
        if (this.boundingBox === null) {
            this.boundingBox = new THREE.Box3()
        }
        var bbox = this.boundingBox;
        var positions = this.attributes.position.array;
        var itemSize = this.attributes.position.itemSize;
        if (!positions || !itemSize || positions.length < 2) {
            bbox.makeEmpty();
            return
        }
        var computeBox = function(positions, output) {
            bounds(positions);
            output.min.set(box.min[0], box.min[1], 0);
            output.max.set(box.max[0], box.max[1], 0)
        };
        computeBox(positions, bbox)
    }
});
Class(function BMFontWordWrap() {
    var _this = this;
    var newline = /\n/;
    var newlineChar = "\n";
    var whitespace = /\s/;

    function idxOf(text, chr, start, end) {
        var idx = text.indexOf(chr, start);
        if (idx === -1 || idx > end) {
            return end
        }
        return idx
    }

    function isWhitespace(chr) {
        return whitespace.test(chr)
    }

    function pre(measure, text, start, end, width) {
        var lines = [];
        var lineStart = start;
        for (var i = start; i < end && i < text.length; i++) {
            var chr = text.charAt(i);
            var isNewline = newline.test(chr);
            if (isNewline || i === end - 1) {
                var lineEnd = isNewline ? i : i + 1;
                var measured = measure(text, lineStart, lineEnd, width);
                lines.push(measured);
                lineStart = i + 1
            }
        }
        return lines
    }

    function greedy(measure, text, start, end, width, mode) {
        var lines = [];
        var testWidth = width;
        if (mode === "nowrap") {
            testWidth = Number.MAX_VALUE
        }
        while (start < end && start < text.length) {
            var newLine = idxOf(text, newlineChar, start, end);
            while (start < newLine) {
                if (!isWhitespace(text.charAt(start))) {
                    break
                }
                start++
            }
            var measured = measure(text, start, newLine, testWidth);
            var lineEnd = start + (measured.end - measured.start);
            var nextStart = lineEnd + newlineChar.length;
            if (lineEnd < newLine) {
                while (lineEnd > start) {
                    if (isWhitespace(text.charAt(lineEnd))) {
                        break
                    }
                    lineEnd--
                }
                if (lineEnd === start) {
                    if (nextStart > start + newlineChar.length) {
                        nextStart--
                    }
                    lineEnd = nextStart
                } else {
                    nextStart = lineEnd;
                    while (lineEnd > start) {
                        if (!isWhitespace(text.charAt(lineEnd - newlineChar.length))) {
                            break
                        }
                        lineEnd--
                    }
                }
            }
            if (lineEnd >= start) {
                var result = measure(text, start, lineEnd, testWidth);
                lines.push(result)
            }
            start = nextStart
        }
        return lines
    }

    function monospace(text, start, end, width) {
        var glyphs = Math.min(width, end - start);
        return {
            start: start,
            end: start + glyphs
        }
    }
    this.lines = function(text, opt) {
        opt = opt || {};
        if (opt.width === 0 && opt.mode !== "nowrap") {
            return []
        }
        text = text || "";
        var width = typeof opt.width === "number" ? opt.width : Number.MAX_VALUE;
        var start = Math.max(0, opt.start || 0);
        var end = typeof opt.end === "number" ? opt.end : text.length;
        var mode = opt.mode;
        var measure = opt.measure || monospace;
        if (mode === "pre") {
            return pre(measure, text, start, end, width)
        } else {
            return greedy(measure, text, start, end, width, mode)
        }
    }
});
Class(function WiggleBehavior(_position) {
    Inherit(this, Component);
    var _this = this;
    var _angle = Utils.toRadians(Utils.doRandom(0, 360));
    var _wobble = new Vector3();
    var _origin = new Vector3();
    this.target = _wobble;
    this.scale = 0.1;
    this.alpha = 0.025;
    this.speed = 1;
    this.zMove = 2;
    this.enabled = true;
    (function() {
        if (_position) {
            _origin.copyFrom(_position)
        }
    })();
    this.update = function() {
        if (!_this.enabled || _this.disabled) {
            return
        }
        var t = window.Render ? Render.TIME : Date.now();
        _wobble.x = Math.cos(_angle + t * (0.00075 * _this.speed)) * (_angle + Math.sin(t * (0.00095 * _this.speed)) * 200);
        _wobble.y = Math.sin(Math.asin(Math.cos(_angle + t * (0.00085 * _this.speed)))) * (Math.sin(_angle + t * (0.00075 * _this.speed)) * 150);
        _wobble.x *= Math.sin(_angle + t * (0.00075 * _this.speed)) * 2;
        _wobble.y *= Math.cos(_angle + t * (0.00065 * _this.speed)) * 1.75;
        _wobble.x *= Math.cos(_angle + t * (0.00075 * _this.speed)) * 1.1;
        _wobble.y *= Math.sin(_angle + t * (0.00025 * _this.speed)) * 1.15;
        _wobble.z = Math.sin(_angle + _wobble.x * 0.0025) * (100 * _this.zMove);
        _wobble.multiply(_this.scale);
        _wobble.add(_origin);
        if (_position) {
            if (_this.ease) {
                _position.interp(_wobble, _this.alpha, _this.ease)
            } else {
                _position.lerp(_wobble, _this.alpha)
            }
        }
    };
    this.copyOrigin = function() {
        _origin.copyFrom(_position)
    };
    this.startRender = function() {
        Render.start(_this.update)
    };
    this.stopRender = function() {
        Render.stop(_this.update)
    };
    this.onDestroy = function() {
        Render.stop(_this.update)
    }
});
Class(function ForestThread() {
    Inherit(this, Component);
    var _this = this;
    var _thread, _geomCallback, _currentLoad;
    var _loads = [];
    var _cache = {};
    (function() {
        initThread()
    })();

    function initThread() {
        var path = (function() {
            if (Config.CDN != "") {
                return Config.CDN
            }
            return location.protocol + "//" + location.hostname + location.pathname
        })();
        _thread = _this.initClass(Thread, ForestThreadWorker);
        _thread.importClass(XHR, AssetLoader, HydraEvents, LinkedList, Render);
        _thread.importScript(Config.CDN + "assets/js/lib/three.min.js");
        _thread.init({
            path: path,
            reduce: Tests.getTreeReduce()
        });
        _thread.on("transfer", incomingGeom)
    }

    function receiveGeom(callback) {
        _geomCallback = callback
    }

    function loadNext() {
        var load = _loads.shift();
        if (load) {
            _this.load(load.path, load.callback)
        }
    }

    function incomingGeom(data) {
        var geom = new THREE.BufferGeometry();
        geom.addAttribute("position", new THREE.BufferAttribute(data.position, 3));
        geom.addAttribute("normal", new THREE.BufferAttribute(data.normal, 3));
        geom.addAttribute("uv", new THREE.BufferAttribute(data.uv, 2));
        _geomCallback(geom)
    }
    this.load = function(path, callback) {
        if (_currentLoad) {
            _loads.push({
                path: path,
                callback: callback
            });
            return
        }
        if (_cache[path] && _cache[path].length == 2) {
            callback(_cache[path]);
            loadNext();
            return
        }
        if (!_cache[path]) {
            _cache[path] = []
        }
        _currentLoad = path;
        _thread.load({
            path: path
        });
        var geometries = [];
        receiveGeom(function(geom) {
            geometries.push(geom);
            _cache[path].push(geom);
            if (geometries.length == 2) {
                callback(geometries);
                _currentLoad = null;
                loadNext()
            }
        })
    }
}, "singleton");
Class(function ForestThreadWorker() {
    Inherit(this, Component);
    var _this = this;
    var _trees;
    var REDUCE = 0;
    var PATH = "";
    var _keys = ["position", "normal", "uv"];

    function loadBufferGeometry(name) {
        var data = Hydra.JSON[name];
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(data.position), 3));
        geometry.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(data.normal), 3));
        geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(data.uv), 2));
        return geometry
    }

    function sendGeometry(geom) {
        var obj = {};
        var buffers = [];
        _keys.forEach(function(key) {
            obj[key] = geom.attributes[key].array;
            buffers.push(obj[key].buffer)
        });
        emit("transfer", obj, buffers)
    }

    function getPositions(name) {
        var data = Hydra.JSON[name];
        var count = data.length / 3;
        var positions = [];
        for (var i = 0; i < count; i++) {
            var p = {};
            p.x = data[i * 3 + 0];
            p.y = data[i * 3 + 1];
            p.z = data[i * 3 + 2];
            if (Utils.doRandom(0, 100) >= REDUCE) {
                positions.push(p)
            }
        }
        return positions
    }

    function generateBufferGeometry() {
        var geom = new THREE.BufferGeometry();
        geom.addAttribute("position", new THREE.BufferAttribute(new Float32Array(), 3));
        geom.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(), 3));
        geom.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(), 2));
        return geom
    }

    function loadTrees(callback) {
        if (_trees) {
            return callback(_trees)
        }
        var models = [PATH + "assets/geometry/forest/tree-0.json", PATH + "assets/geometry/forest/tree-1.json", ];
        var loader = new AssetLoader(models);
        loader.events.add(HydraEvents.COMPLETE, function() {
            _trees = [];
            for (var i = 0; i < 2; i++) {
                _trees.push(loadBufferGeometry("tree-" + i))
            }
            callback(_trees)
        })
    }
    this.init = function(e) {
        window.Hydra = {};
        Hydra.JSON = {};
        PATH = e.path + (e.path.charAt(e.path.length - 1) == "/" ? "" : "/");
        REDUCE = e.reduce
    };
    this.load = function(e, id) {
        loadTrees(function(trees) {
            var path = e.path;
            var models = [PATH + "assets/geometry/forest/" + path + "-ground.json", PATH + "assets/geometry/forest/" + path + "-positions.json"];
            var loader = new AssetLoader(models);
            loader.events.add(HydraEvents.COMPLETE, function() {
                var ground = loadBufferGeometry(path + "-ground");
                ground.computeVertexNormals();
                ground.computeFaceNormals();
                sendGeometry(ground);
                var obj = new THREE.Object3D();
                var lakeTrees = generateBufferGeometry();
                var positions = getPositions(path + "-positions");
                for (var i = 0; i < positions.length; i++) {
                    var p = positions[i];
                    var tree = trees[Utils.doRandom(0, 1)].clone();
                    obj.position.copy(p);
                    obj.rotation.y = Utils.toRadians(Utils.doRandom(0, 360));
                    obj.rotation.x = Utils.toRadians(Utils.doRandom(-2, 2));
                    obj.rotation.z = Utils.toRadians(Utils.doRandom(-2, 2));
                    obj.scale.set(Utils.doRandom(0.8, 1.2, 2), Utils.doRandom(0.9, 1.3, 2), Utils.doRandom(0.8, 1.2, 2));
                    obj.updateMatrixWorld();
                    tree.applyMatrix(obj.matrixWorld);
                    lakeTrees.merge(tree)
                }
                lakeTrees.computeVertexNormals();
                lakeTrees.computeFaceNormals();
                sendGeometry(lakeTrees)
            })
        })
    }
});
Class(function Hardware() {
    Inherit(this, Component);
    var _this = this;
    this.GPU_BLACKLIST = require("GPUBlacklist").match() || (!Device.mobile && Device.graphics.webgl && !Device.graphics.webgl.detect("float"));
    this.LOW_GPU = (!Device.mobile && Device.graphics.webgl && !Device.graphics.webgl.detect(["nvidia", "amd"]));
    this.NO_GPU = false;
    this.BOTTOM_GPU = (function() {
        if (_this.GPU_BLACKLIST) {
            return true
        }
        if (!Device.graphics.webgl) {
            return false
        }
        if (Device.graphics.webgl.detect("intel")) {
            try {
                var num = Number(Device.graphics.webgl.gpu.split("graphics ")[1].split(" ")[0]);
                return num > 1000 && num < 4000
            } catch (e) {
                return true
            }
        }
        return false
    })();
    this.GOOD_GPU = !this.LOW_GPU && !this.BOTTOM_GPU;
    this.MIN_PARTICLES = this.LOW_GPU || Mobile.os == "Android";
    this.BAD_MBP = this.LOW_GPU && Device.system.os == "mac" && Device.system.retina;
    this.OVERSIZED = !Device.mobile && this.LOW_GPU && Math.max(window.innerWidth, window.innerHeight) > 1440;
    this.IPAD_PRO = Mobile.tablet && Device.graphics.webgl && Device.graphics.webgl.detect("a9");
    this.FAST_IOS = Mobile.os == "iOS" && Device.graphics.webgl && Device.graphics.webgl.detect(["a9"]);
    this.IOS_DEVICE = require("iOSDevices").find();
    this.ACTIVE_VR = false;
    this.OLD_NEXUS = Device.graphics.webgl && Device.graphics.webgl.detect("adreno (tm) 330");
    this.BEAST_GPU = Device.graphics.webgl && Device.graphics.webgl.detect("titan x");
    this.OLD_SAMSUNG = Device.mobile && Device.graphics.webgl && Device.graphics.webgl.detect(["mali-4", "mali-3", "mali-2"]);
    this.ADRENO = 0;
    this.FAST_ANDROID = (function() {
        if (Mobile.os != "Android" || Mobile.browser != "Chrome") {
            return false
        }
        try {
            var version = Number(Device.agent.split("chrome/")[1].split(".")[0]);
            Mobile.bv = version;
            var gpu = Device.graphics.webgl.gpu.strpos("adreno (tm)") ? Number(Device.graphics.webgl.gpu.split("tm) ")[1]) : 0;
            _this.ADRENO = gpu;
            if (gpu > 0 && gpu <= 320) {
                _this.OLD_SAMSUNG = true
            }
            return gpu > 400 && version >= 53
        } catch (e) {
            return false
        }
    })();
    this.ANDROID_VFX = Device.detect("pixel c") || (_this.ADRENO >= 430 && Mobile.bv >= 53)
}, "Static");
Class(function Record() {
    Inherit(this, Component);
    var _this = this;
    var _encoder;
    var _recordingVideo, _saveImage;
    var _frameCount = 0;
    var _uilVideo, _uilImage;
    var _lastKey;
    (function() {
        Hydra.ready(function() {
            addListeners()
        })
    })();

    function addListeners() {
        if (Hydra.LOCAL) {
            _this.events.subscribe(KeyboardUtil.PRESS, keypress)
        }
    }

    function keypress(e) {
        if (_lastKey === "v" && e.key === "1") {
            video(true)
        }
        if (_lastKey === "v" && e.key === "2") {
            endRecording()
        }
        if (_lastKey === "i" && e.key === "1") {
            image()
        }
        _lastKey = e.key
    }

    function video() {
        if (_recordingVideo) {
            endRecording()
        } else {
            startRecording(60, 100)
        }
    }

    function image() {
        _saveImage = true
    }

    function startRecording(fps, quality) {
        if (_encoder) {
            return
        }
        _frameCount = 0;
        _recordingVideo = true;
        Config.RECORDING = true;
        _encoder = new Whammy.Video(fps ? fps : 60, quality ? quality : 100)
    }

    function endRecording() {
        if (!_encoder) {
            return
        }
        var filename = Embed.ID ? Embed.ID : "patronus-video";
        _encoder.compile(null, function(output) {
            saveVideo(output, filename);
            _recordingVideo = false;
            Config.RECORDING = false;
            if (_uilVideo) {
                _uilVideo.label("record video")
            }
        })
    }

    function captureFrame(renderer) {
        if (!_encoder) {
            return
        }
        _encoder.add(renderer.domElement.toDataURL("image/webp"))
    }

    function saveVideo(output, filename) {
        var url = window.URL.createObjectURL(output);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = filename + ".webm";
        a.click();
        window.URL.revokeObjectURL(url)
    }

    function saveImage(data, filename) {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = data;
        a.download = filename + ".png";
        a.click()
    }
    this.loop = function(renderer) {
        if (_saveImage) {
            saveImage(renderer.domElement.toDataURL("image/png"), Embed.ID ? Embed.ID : "patronus-image");
            _saveImage = false
        }
        if (!_recordingVideo) {
            return
        }
        if (_uilVideo) {
            _uilVideo.label("stop recording (" + _frameCount + " frames)")
        }
        captureFrame(renderer);
        _frameCount++
    };
    this.init = function(uil) {
        _uilVideo = uil.add("button", {
            name: "record video",
            callback: video
        });
        _uilImage = uil.add("button", {
            name: "save image",
            callback: image
        })
    }
}, "Static");
Class(function Tests() {
    var _this = this;
    this.useFallback = function() {
        if (Hydra.HASH && Hydra.HASH.strpos("fallback")) {
            return true
        }
        if (Hardware.NO_GPU || !Device.system.webworker) {
            return true
        }
        if (Device.browser.ie && Device.browser.version < 14) {
            return true
        }
        if (Hardware.IOS_DEVICE.strpos(["legacy", "5x", "ipad mini 1"])) {
            return true
        }
        if (Hardware.OLD_SAMSUNG) {
            return true
        }
        if (Device.detect("sm-t310")) {
            return true
        }
        if (!Device.graphics.webgl) {
            return true
        }
        if (Device.mobile && Mobile.os != "iOS" && Mobile.os != "Android") {
            return true
        }
        if (Mobile.os == "Android" && Mobile.browser != "Chrome") {
            return true
        }
        return false
    };
    this.useFallbackVideo = function() {
        if (!this.useFallback()) {
            return false
        }
        if (Hydra.HASH && Hydra.HASH.strpos("fallback")) {
            var arg = Hydra.HASH.split("/")[1] && Hydra.HASH.split("/")[1].split("?")[0];
            if (arg && arg === "image") {
                return false
            }
        }
        if (Mobile.phone || Mobile.tablet) {
            return false
        }
        if (Device.browser.ie && Device.browser.version <= 9) {
            return false
        }
        if (window.FORCE_FALLBACK_IMAGE && window.FORCE_FALLBACK_IMAGE === true) {
            return false
        }
        return true
    };
    this.useGPUParticles = function() {
        if (!Device.graphics.webgl) {
            return false
        }
        if (!Device.graphics.webgl.detect("float")) {
            return false
        }
        if (!Device.mobile && Device.system.os.strpos("windows") && Hardware.NO_GPU) {
            return false
        }
        if (Mobile.os == "Android" && Mobile.version < 5) {
            return false
        }
        if (Hardware.GPU_BLACKLIST || Hardware.BOTTOM_GPU) {
            return false
        }
        if (Hardware.IOS_DEVICE.strpos(["5x", "ipad mini 1"])) {
            return false
        }
        return true
    };
    this.getSize = function() {
        if (!this.useGPUParticles()) {
            return 1
        }
        if (Mobile.os == "Android" && Device.detect("pixel c")) {
            return 256
        }
        if (Mobile.os == "Android" && Hardware.FAST_ANDROID) {
            return 128
        }
        if (Mobile.os == "Android") {
            return 64
        }
        if (Hardware.BOTTOM_GPU) {
            return 64
        }
        if (Hardware.IOS_DEVICE.strpos(["ipad mini 1", "ipad mini 2", "ipad 4"])) {
            return 64
        }
        if (Hardware.IOS_DEVICE.strpos(["5s", "ipad mini 3", "ipad mini 4", "6x"])) {
            return 128
        }
        if (Device.mobile) {
            return 256
        }
        if (Hardware.LOW_GPU) {
            return 256
        }
        return 512
    };
    this.vfxExtras = function() {
        if (!Device.mobile && Hardware.GOOD_GPU) {
            return true
        }
        return false
    };
    this.renderVFX = function() {
        if (Hardware.IOS_DEVICE.strpos(["6s", "ipad pro"]) || Hardware.ANDROID_VFX) {
            return true
        }
        if (Device.mobile) {
            return false
        }
        if (!this.useGPUParticles()) {
            return false
        }
        if (this.embedded()) {
            return false
        }
        if (Hardware.NO_GPU || Hardware.BOTTOM_GPU || Hardware.OVERSIZED || Hardware.BAD_MBP) {
            return false
        }
        return true
    };
    this.translucentPatronus = function() {
        if (Hardware.BOTTOM_GPU) {
            return false
        }
        if (Mobile.os == "Android") {
            return false
        }
        if (Hardware.IOS_DEVICE.strpos(["ipad mini", "5x"])) {
            return false
        }
        return true
    };
    this.maxCPUTime = function() {
        if (Mobile.os == "iOS") {
            return 999999
        }
        if (Mobile.os == "Android") {
            return 160
        }
        if (Hardware.GOOD_GPU) {
            return 35
        }
        return 21
    };
    this.antialias = function() {
        if (Utils.query("debug") == "true") {
            return true
        }
        return false
    };
    this.reducePatronus = function() {
        if (Hardware.IOS_DEVICE.strpos(["5s", "ipad mini 3", "ipad mini 4"])) {
            return 50
        }
        return 0
    };
    this.particleScale = function() {
        switch (this.getSize()) {
            case 64:
                return 2;
                break;
            case 128:
                return 2;
                break;
            case 256:
                if (Mobile.phone) {
                    return 1.2
                }
                return 2;
                break;
            default:
                if (_this.embedded()) {
                    return 2
                }
                return 0.35;
                break
        }
    };
    this.simpleMirrorRender = function() {
        if (Device.mobile) {
            return true
        }
        if (Hardware.LOW_GPU) {
            return true
        }
        return false
    };
    this.embedded = function() {
        if (location.search) {
            return Utils.query("embed") == "true"
        }
        return false
    };
    this.insideIframe = function() {
        try {
            return window.self !== window.top
        } catch (e) {
            return false
        }
    };
    this.getTreeReduce = function() {
        if (this.getSize() < 128) {
            return 50
        }
        if (Hardware.IOS_DEVICE.strpos(["ipad mini"])) {
            return 45
        }
        if (Hardware.IOS_DEVICE.strpos(["5s"])) {
            return 35
        }
        if (Hardware.IOS_DEVICE.strpos("6x")) {
            return 25
        }
        if (Device.mobile) {
            return 20
        }
        if (Hardware.OVERSIZED) {
            return 45
        }
        if (Hardware.BOTTOM_GPU) {
            return 45
        }
        if (Hardware.LOW_GPU) {
            return 10
        }
        return 0
    };
    this.getMirrorSize = function() {
        if (Hardware.LOW_GPU) {
            return 256
        }
        if (Device.mobile) {
            return 256
        }
        return 512
    };
    this.getCPUChunks = function() {
        return 1
    };
    this.getShadowMapTexture = function() {
        if (Hardware.LOW_GPU) {
            return 256
        }
        return 1024
    };
    this.getDPR = function() {
        if (Hardware.IOS_DEVICE.strpos(["5x", "ipad mini 2", "ipad mini 1", "ipad 4"])) {
            return 1
        }
        if (Device.mobile) {
            return Math.min(1.5, Device.pixelRatio)
        }
        if (Hardware.OVERSIZED) {
            return 0.85
        }
        if (Hardware.GOOD_GPU) {
            return Math.min(1.1, Device.pixelRatio)
        }
        return 1
    };
    this.renderShadows = function() {
        return false
    };
    this.bakedShadows = function() {
        return true
    };
    this.dynamicShadows = function() {
        return false
    };
    this.getAntialias = function() {
        return false
    };
    this.getTotalFireflies = function() {
        if (Mobile.os == "Android") {
            return 0.5
        }
        if (Device.mobile) {
            return 0.8
        }
        return 1
    };
    this.getInteractiveFireflies = function() {
        if (Hardware.IOS_DEVICE.strpos(["6s", "ipad pro"])) {
            return true
        }
        if (Device.mobile) {
            return false
        }
        if (Hardware.ACTIVE_VR) {
            return false
        }
        return true
    };
    this.getEtherealReduction = function() {
        if (Hardware.BOTTOM_GPU) {
            return 0.4
        }
        if (Hardware.LOW_GPU) {
            return 0.8
        }
        if (Mobile.os == "Android" && !Device.detect("pixel c")) {
            return 0.25
        }
        if (Hardware.IOS_DEVICE.strpos(["5x", "ipad mini 1", "ipad mini 2", "ipad 4"])) {
            return 0.25
        }
        if (Hardware.IOS_DEVICE.strpos("5s")) {
            return 0.35
        }
        if (Device.mobile) {
            return 0.5
        }
        return 1
    };
    this.doNonCorporealReveal = function() {
        if (!this.useGPUParticles()) {
            return false
        }
        return true
    };
    this.simpleBG = function() {
        if (_this.embedded()) {
            return false
        }
        return true
    };
    this.useCurlNoise = function() {
        if (this.getSize() < 128) {
            return false
        }
        if (Hardware.OLD_NEXUS) {
            return false
        }
        return true
    };
    this.cacheBustThree = function() {
        if (Mobile.os == "iOS") {
            return true
        }
        if (Device.browser.safari) {
            return true
        }
        return false
    };
    this.mobilePortrait = function() {
        if (Device.mobile && Mobile.orientation == "portrait") {
            return true
        }
        return false
    };
    this.drawFog = function() {
        if (Hardware.FAST_ANDROID) {
            return true
        }
        if (this.getSize() < 256) {
            return false
        }
        if (!Device.graphics.webgl.detect("instance")) {
            return false
        }
        return true
    };
    this.getPerfNumber = function() {
        if (this.useFallback()) {
            return 0
        }
        if (!Device.mobile) {
            if (Hardware.BOTTOM_GPU) {
                return 1
            }
            if (Hardware.LOW_GPU) {
                return 2
            }
            return 3
        } else {
            if (this.renderVFX()) {
                return 3
            }
            return 2
        }
    }
}, "static");
Class(function Data() {
    Inherit(this, Model);
    var _this = this;
    var _questions, _question, _answers, _questionIndex, _timeouts, _sequentialAnswers, _answeredQuestions, _copy, _completed;
    var INITIAL_QUESTION_COUNT = 27; // UPDATE, this should be 5+6+5+6+5=27
    (function() {
        XHR.options = {
            withCredentials: true
        };
        init();
        reset()
    })();

    function init() {
        _answeredQuestions = [];
        _sequentialAnswers = 0
    }

    function reset() {
        _questionIndex = 0;
        _timeouts = 0;
        _sequentialAnswers = 0;
        _answers = []
    }

    function currentQuestion() {
        if (_questionIndex > INITIAL_QUESTION_COUNT - 1) {
            return {
                question: _question,
                copy: _copy,
                index: _questionIndex
            }
        } else {
            return {
                question: _questions[_questionIndex],
                copy: _copy,
                index: _questionIndex
            }
        }
    }

    function getCopy() {
        if (_completed && _questionIndex == 7) {
            return Copy.get("Z3")
        } else {
            if (_completed && _questionIndex == 6) {
                return Copy.get("Z2")
            } else {
                if (_completed) {
                    return Copy.get("Z1")
                } else {
                    if (_questionIndex >= 5 && _timeouts >= 2) {
                        return Copy.getRandom("T2")
                    } else {
                        if (_questionIndex >= 5 && _timeouts == 1) {
                            return Copy.getRandom("T1")
                        } else {
                            if (_questionIndex == 6) {
                                return Copy.getRandom("X2")
                            } else {
                                if (_questionIndex == 5) {
                                    return Copy.getRandom("X1")
                                } else {
                                    if (_sequentialAnswers >= 4) {
                                        return Copy.getRandom("R2")
                                    } else {
                                        if (_sequentialAnswers >= 3) {
                                            return Copy.getRandom("R1")
                                        } else {
                                            if (_timeouts >= 2) {
                                                return Copy.getRandom("T2")
                                            } else {
                                                if (_timeouts == 1) {
                                                    return Copy.getRandom("T1")
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return ""
    }

    function submitAnswers(callback) {
        var xhr = XHR.post(Config.QUIZ_API, _answers, function(response) {
            if (response.error) {
                _this.events.fire(QuizEvents.MESSAGE, Copy.get("ERROR", "server"));
                console.error("Error posting answers: " + response.error);
                return
            } else {
                callback(response)
            }
        }, null, "json");
        xhr.onError = function(error) {
            _this.events.fire(QuizEvents.MESSAGE, Copy.get("ERROR", "server"));
            console.error("Error submitting answers: " + error)
        }
    }

    function getQuestion(newQuestion, callback, exclude) {
        if (newQuestion) {
            var url = Config.QUIZ_API + "/" + (_questionIndex + 1);
            if (exclude) {
                url += "?exclude=" + exclude.join("&exclude=")
            }
            var xhr = XHR.get(url, {}, function(response) {
                _question = response;
                callback({
                    question: response,
                    copy: _copy,
                    index: _questionIndex
                })
            }, "json");
            xhr.onError = function(error) {
                _this.events.fire(QuizEvents.MESSAGE, Copy.get("ERROR", "server"));
                console.error("Error loading question from server: " + error)
            }
        } else {
            _question = _questions[_questionIndex];
            callback(currentQuestion())
        }
    }
    this.getNextQuestion = function(url, callback) {
        var xhr = XHR.get(Config.PROFILE_SERVER + url, {}, function(response) {
            _question = response;
            callback({
                question: response,
                copy: _copy,
                index: _questionIndex
            })
        }, "json");
        xhr.onError = function(error) {
            _this.events.fire(QuizEvents.MESSAGE, Copy.get("ERROR", "server"));
            console.error("Error loading question from server: " + error)
        }
    };
    this.getQuestions = function(callback, exclude) {
        var url = Config.QUIZ_API;
        if (exclude) {
            url += "?exclude=" + exclude.join("&exclude=")
        }
        var xhr = XHR.get(url, {}, function(response) {
            _questions = response;
            _question = _questions[0];
            callback({
                copy: _copy,
                question: _questions[0],
                index: _questionIndex
            })
        }, "json");
        xhr.onError = function(error) {
            _this.events.fire(QuizEvents.MESSAGE, Copy.get("ERROR", "server"));
            console.error("Error loading questions from server: " + error)
        }
    };
    this.submitAnswer = function(answer, callback) {
        _timeouts = 0;
        _sequentialAnswers++;
        _answers.push(answer);
        _copy = getCopy();
        _questionIndex++;
        if (_questionIndex >= INITIAL_QUESTION_COUNT) {
            submitAnswers(function(response) {
                if (response.outcome) {
                    if (response.outcome.type) {
                        if (response.outcome.type === "complete") {
                            _completed = true;
                            _copy = getCopy();
                            _this.User.handleResult(response.outcome.result);
                            callback({
                                completed: true,
                                result: response.outcome.result,
                                copy: _copy
                            })
                        } else {
                            if (response.outcome.type === "incomplete") {
                                _copy = getCopy();
                                _this.getNextQuestion(response.outcome.nextQuestion, function(response) {
                                    callback({
                                        completed: false,
                                        question: response,
                                        copy: _copy,
                                        index: _questionIndex
                                    })
                                })
                            }
                        }
                    }
                }
            })
        } else {
            getQuestion(false, function(response) {
                callback({
                    question: response,
                    copy: _copy,
                    index: _questionIndex
                })
            })
        }
    };
    this.timeout = function(callback) {
        _sequentialAnswers = 0;
        var question = encodeURIComponent(currentQuestion().question.id);
        if (_answeredQuestions.indexOf(question) == -1) {
            _answeredQuestions.push(question)
        }
        _timeouts++;
        _copy = getCopy();
        if (_timeouts > 1) {
            reset();
            _this.getQuestions(function(response) {
                callback(response)
            }, _answeredQuestions)
        } else {
            getQuestion(true, function(question) {
                callback(question)
            }, _answeredQuestions)
        }
    }
}, "Static");
Class(function Copy() {
    Inherit(this, Model);
    var _this = this;
    var _data;
    (function() {
        Data.registerData();
        loadCopyData()
    })();

    function loadCopyData() {
        XHR.get(Config.COPY_URL, function(data) {
            _data = data;
            Data.triggerData()
        })
    }

    function processA(copy, patronus) {
        if (patronus) {
            var c = patronus.charAt(0).toLowerCase();
            if (c === "a" || c === "e" || c === "i" || c === "o") {
                return copy.replace("{a}", "an")
            } else {
                return copy.replace("{a}", "a")
            }
        } else {
            return copy.replace("{a}", "a")
        }
    }
    this.get = function(section, id) {
        var copy;
        if (_data && _data[section]) {
            if (id) {
                copy = _data[section][id]
            } else {
                copy = _data[section]
            }
        } else {
            copy = "[MISSING COPY]"
        }
        if (Data.User && Data.User.getPatronus()) {
            copy = processA(copy, Data.User.getPatronus())
        }
        return copy
    };
    this.getSection = function(section) {
        if (_data && _data[section]) {
            return _data[section]
        }
        return "[MISSING COPY]"
    };
    this.getRandom = function(section) {
        if (_data && _data[section]) {
            return _data[section][Utils.doRandom(0, _data[section].length - 1)]
        }
        return "[MISSING COPY]"
    };
    this.processA = function(copy, patronus) {
        return processA(copy, patronus)
    }
}, "static");
Data.Class(function Patronus() {
    Inherit(this, Model);
    var _this = this;
    var _id, _data;
    (function() {
        if (Config.USE_ANIMALS) {
            Data.registerData();
            loadAnimalsData()
        }
    })();

    function loadAnimalsData() {
        XHR.get(Config.CDN + "assets/data/animals.json", function(data) {
            _data = data;
            Data.triggerData()
        })
    }

    function loadAnimalData(id, callback) {
        if (_this.loadingAnimalData) {
            return
        }
        _this.loadingAnimalData = true;
        XHR.get(Config.CDN + "assets/data/animals/" + id + ".json", function(data) {
            _id = id;
            _data = data;
            if (callback) {
                callback(_data)
            }
        })
    }
    this.loadData = function(id, callback) {
        if (Config.USE_ANIMALS) {
            _this.getData(id, callback)
        } else {
            if (id && _id !== id) {
                loadAnimalData(id, callback)
            } else {
                callback(_data)
            }
        }
    };
    this.getData = function(id, callback) {
        if (Config.USE_ANIMALS) {
            for (var i = 0; i < _data.length; i++) {
                var data = _data[i];
                if (data.id == (Embed.ID || id)) {
                    if (callback) {
                        callback(data)
                    }
                    return data
                }
            }
        } else {
            if (Embed.ID) {
                loadAnimalData(Embed.ID, callback);
                return
            }
            if (!_data) {
                loadAnimalData(id, callback);
                return _this.delayedCall(function() {
                    _this.getData(id, callback)
                }, 100)
            }
            if (_data) {
                if (callback) {
                    callback(_data)
                }
                return _data
            }
            return
        }
    }
});
Class(function Share() {
    Inherit(this, Model);
    var _this = this;
    var _info;
    var _debug = localStorage.share_debug || false;
    var _copy;
    var _gplusOptions = {};
    var _share = {
        twitter: twitter,
        facebook: facebook,
        gplus: gplus,
        email: email,
        stumbleUpon: stumbleUpon,
        tumblr: tumblr
    };
    (function() {
        Data.onReady(function() {
            _copy = Copy.getSection("SHARE");
			//initTags();
            //initDebug();
            //initGooglePlus()
        })
    })();

    function initTags() {
        var list = Tags.SHARE_LIST;
        list.forEach(function(tag) {
            Tags.CODE[tag]()
        })
    }

    function initGooglePlus() {
        if (typeof gapi !== "undefined") {
            _gplusOptions = {
                contenturl: _copy.url,
                clientid: Tags.SETTINGS.gplus.clientId,
                cookiepolicy: "single_host_origin",
                prefilltext: _copy.facebook,
                calltoactionlabel: "VISIT",
                calltoactionurl: _copy.url
            };
            gapi.interactivepost.render("G-Plus-Share", _gplusOptions)
        } else {
            setTimeout(initGooglePlus, 200)
        }
    }

    function initDebug() {
        Dev.expose("shareDebug", _this.debug)
    }

    function popWindow(url, name, w, h) {
        var nw = window.open(url, name, "height=" + h + ",width=" + w + ",scrollbars=yes");
        if (window.focus && nw && nw.focus) {
            nw.focus()
        }
        return false
    }

    function encodeURI(str) {
        return encodeURIComponent(str)
    }

    function shareInfo(type, patronus) {
        var copy = _copy[type] ? _copy[type] : _copy.description;
        var title = _copy.title;
        var url = _copy.url;
        var id = patronus.id;
        var name = patronus.name;
        var image = Config.SHARE_IMAGE_URL + patronus.id + ".jpg";
        copy = Copy.processA(copy, patronus.id);
        copy = copy.replace("{url}", url);
        copy = copy.replace("{image}", image);
        copy = copy.replace("{name}", name);
        title = Copy.processA(title, patronus.id);
        title = title.replace("{name}", name);
        return {
            copy: copy,
            id: id,
            name: name,
            image: image,
            title: title
        }
    }

    function email() {
        window.location.href = "mailto:?subject=" + _info.title + "&body=" + encodeURI(_info.copy)
    }

    function stumbleUpon() {
        var height = 400;
        var width = 500;
        var url = "http://www.stumbleupon.com/badge/?url=" + encodeURI(_copy.url);
        popWindow(url, "share", width, height)
    }

    function tumblr() {
        function createTumblrURL(url, image, desc, tags) {
            var link, i;
            var b = "http://tumblr.com/widgets/share/tool?";
            var u = "canonicalUrl=" + encodeURI(url);
            var d = "caption=" + encodeURI(desc);
            if (image) {
                i = "content=" + encodeURI(image)
            } else {
                i = "content=" + encodeURI(url)
            }
            var t = "title=" + encodeURI(_info.title);
            var l = "tags=" + encodeURI(tags + ", " + _info.id.toLowerCase());
            link = b + "posttype=link&" + u + "&" + t + "&" + i + "&" + d + "&" + l + "&shareSource=tumblr_share_button";
            return link
        }
        popWindow(createTumblrURL(_copy.url, null, _info.copy, _copy.tags), _info.title, 540, 600)
    }

    function twitter(tags) {
        var height = 400;
        var width = 500;
        var url = "https://twitter.com/intent/tweet?text=" + encodeURI(_info.copy);
        popWindow(url, "share", width, height)
    }

    function facebook() {
        var url = _share.url;
        if (!window.FB) {
            return
        }
        FB.ui({
            method: "feed",
            name: _info.title,
            picture: _info.image,
            link: _copy.url,
            description: _info.copy
        }, function() {})
    }

    function gplus() {
        _gplusOptions.prefilltext = _info.copy;
        gapi.interactivepost.render("G-Plus-Share", _gplusOptions);
        var btn = document.getElementById("G-Plus-Share");
        btn.click()
    }

    function debug(type, patronus) {
        console.log("<<<<<<<<<<<<" + type.toUpperCase() + " SHARE >>>>>>>>>>>>>>");
        console.log("Title: " + patronus.title);
        console.log("ID: " + patronus.id);
        console.log("DESCRIPTION: " + patronus.desc);
        console.log("Text: " + _text);
        console.log("URL: " + _copy.url);
        console.log("<<<<<<<<<<<< END" + type.toUpperCase() + " SHARE >>>>>>>>>>>>>>")
    }
    this.link = function(type, patronus) {
        _info = shareInfo(type, patronus);
        _share[type]();
        if (_debug) {
            debug(type, patronus)
        }
    };
    this.debug = function(bool) {
        _debug = bool;
        Storage.set("share_bebug", bool)
    }
}, "static");
Data.Class(function User() {
    Inherit(this, Model);
    var _this = this;
    var _data, _status;
    (function() {
        XHR.options = {
            withCredentials: true
        };
        Data.registerData();
        getStatus()
    })();

    function process(data) {
        if (_data.id && _data.emailVerified && _data.patronus) {
            return "completed"
        } else {
            if (_data.id && _data.emailVerified) {
                return "loggedIn"
            } else {
                if (_data.id && !_data.emailVerified) {
                    return "unverified"
                } else {
                    return "loggedOut"
                }
            }
        }
    }

    function getStatus(callback, force) {
        if (_status === undefined || force) {
            var xhr = XHR.get(Config.USER_API + "?r=" + Date.now(), function(response) {
                _data = response;
                _status = process(response);
                callback && callback(_status);
                Data.triggerData()
            }, "json");
            xhr.onError = function(error) {
                _data = null;
                _status = "loggedOut";
                callback && callback(_status);
                Data.triggerData()
            }
        } else {
            if (typeof callback == "function") {
                callback(_status)
            } else {
                return _status
            }
        }
    }
    this.getStatus = function(callback, force) {
		return getStatus(callback, force)
    };
    this.getName = function() {
        if (_data && _data.name) {
            return _data.name
        }
        return null
    };
    this.getPatronus = function() {
        if (_data && _data.patronus && _data.patronus.id) {
            return _data.patronus.id
        }
        return null
    };
    this.fakeLogin = function(callback) {
        _this.getStatus(function(response) {
            _this.delayedCall(function() {
                O;
                if (response === "loggedIn") {
                    callback(true)
                } else {
                    callback(false)
                }
            })
        })
    };
    this.handleResult = function(data) {
        _data = _data || {};
        _data.patronus = data
    };
    this.requestPatronus = function(callback) {
        if (Hardware.ACTIVE_VR) {
            return callback(Data.Patronus.getData())
        }
        if (!_this.getPatronus() && Tests.embedded() && !_data) {
            return callback(Data.Patronus.getData())
        }
        if (!_this.getPatronus()) {
            _this.delayedCall(_this.requestPatronus, 100, callback);
            return
        }
        callback(Data.Patronus.getData(_this.getPatronus()))
    }
}, "Static");
Class(function AudioController() {
    Inherit(this, Controller);
    if (Tests.useFallback()) {
        return
    }
    var SUCCESSFUL_ANSWERS_TO_COMPLETE = 6;
    var _this = this;
	var _klangConfigURI = "http://klangfiles.s3.amazonaws.com/uploads/projects/AEuwh/config.json";
    var _lastInteractionMap = {};
    var _refreshRate = 20;
    var _lastMouseSpeed = 0;
    var _isIntro = true;
    var _globalProgress = 0;
    var _successfulAnswers = 0;
    var _animal = true;
    var _patronusReceived = false;
    var _disableWand = false;
    var _progressEvents = [{
        fired: false,
        progress: 0.2,
        events: [
            ["rise_1", 0.1, 0]
        ]
    }, {
        fired: false,
        progress: 0.33,
        events: [
            ["rise_1", 0.2, 0.1]
        ]
    }, {
        fired: false,
        progress: 0.5,
        events: [
            ["rise_1", 0.3, 0.2]
        ]
    }, {
        fired: false,
        progress: 0.8,
        events: [
            ["rise_1", 0.4, 0.3]
        ]
    }, {
        fired: false,
        progress: 0.9,
        events: [
            ["rise_1", 0.5, 0.4]
        ]
    }, {
        fired: false,
        progress: 0.5,
        events: [
            ["rise_2", 0.4, 0]
        ]
    }, {
        fired: false,
        progress: 0.8,
        events: [
            ["rise_2", 0.6, 0.4]
        ]
    }, {
        fired: false,
        progress: 0.9,
        events: [
            ["rise_2", 0.7, 0.6]
        ]
    }, ];
    var _lastTransitionUpdateCache = {
        time: 0,
        newCamPos: {},
        vol: 0,
        lastFreqWind: 10000,
        lastFreqRise: 20000
    };
    (function() {}());

    function addHandlers() {
        _this.events.subscribe(QuizEvents.INIT_INTRO, handleInitIntro);
        _this.events.subscribe(QuizEvents.INIT_COMPLETED, handleInitCompleted);
        _this.events.subscribe(QuizEvents.START_QUIZ, handleStartQuiz);
        _this.events.subscribe(QuizEvents.NEW_QUESTION, handleNewQuestion);
        _this.events.subscribe(QuizEvents.START_QUESTION, handleStartQuestion);
        _this.events.subscribe(QuizEvents.PATRONUS_RECEIVED, handlePatronusReceived)
    }

    function scaleValue(norm, min, max) {
        return norm * (max - min) + min
    }

    function secondLoadComplete() {
        Klang.trigger("rise_start")
    }

    function handleInitIntro() {
        Klang.load("second");
        Klang.load(Device.mobile ? "second_mobile" : "second_desktop", secondLoadComplete);
        Klang.trigger("intro_start");
        triggerAnimal()
    }

    function handleInitCompleted() {
        handleInitIntro();
        _isIntro = false
    }

    function handleStartQuiz() {
        _isIntro = false;
        Klang.trigger("intro_stop")
    }

    function handleNewQuestion(question) {
        Klang.trigger("question_out");
        Klang.trigger("drone_static_fade_out")
    }

    function handleStartQuestion(question) {
        Klang.trigger("question_in");
        Klang.trigger("drone_static_fade_in")
    }

    function handlePatronusReceived() {
        _patronusReceived = true
    }

    function updateProgress() {
        _globalProgress = _successfulAnswers / SUCCESSFUL_ANSWERS_TO_COMPLETE;
        for (var i = 0; i < _progressEvents.length; i++) {
            var e = _progressEvents[i];
            if (e.progress <= _globalProgress && e.fired !== true) {
                for (var j = 0; j < e.events.length; j++) {
                    e.fired = true;
                    Klang.trigger(e.events[j][0], e.events[j][1], e.events[j][2])
                }
            }
        }
    }

    function rateLimiter(id, conditionalByPass) {
        if (conditionalByPass) {
            return true
        }
        var lastInteractionTime = _lastInteractionMap[id] || 0;
        var now = Date.now();
        if (now - lastInteractionTime > _refreshRate) {
            _lastInteractionMap[id] = now;
            return true
        }
        return false
    }

    function triggerAnimal() {
        var time = 30 + Math.random() * 15;
        setTimeout(function() {
            Klang.trigger("animal", _animal);
            _animal = !_animal;
            triggerAnimal()
        }, time * 1000)
    }

    function initMobile() {
        document.addEventListener("touchend", function onTouchEnd() {
            Klang.initIOS();
            document.removeEventListener("touchend", onTouchEnd)
        })
    }
    var getMouseSpeed = (function() {
        var _lastMouseX = 0;
        var _lastMouseY = 0;
        var _lastEventTime = 0;
        var _mouseSpeed = 0;
        return function getMouseSpeed(xNormalized, yNormalized, easing) {
            var dist = Math.abs(xNormalized - _lastMouseX) + Math.abs(yNormalized - _lastMouseY);
            var time = Klang.context.currentTime - _lastEventTime;
            if (time === 0) {
                return _mouseSpeed
            }
            var speed = dist / time;
            _mouseSpeed += speed * 0.01;
            _mouseSpeed *= easing;
            _lastEventTime = Klang.context.currentTime;
            _lastMouseX = xNormalized;
            _lastMouseY = yNormalized;
            return _mouseSpeed
        }
    }());
    this.updateCameraTarget = function(mouseX, mouseY) {
        if (!Klang.klangInited || !rateLimiter("camera")) {
            return
        }
        var xPos = mouseX / window.innerWidth;
        var yPos = mouseY / window.innerHeight;
        if (_disableWand) {
            _lastMouseSpeed *= 0.96;
            if (_lastMouseSpeed > 0) {
                Klang.trigger("particles_speed", _lastMouseSpeed, xPos)
            }
            if (_lastMouseSpeed < 0.05) {
                _lastMouseSpeed = 0
            }
        } else {
            var speed = getMouseSpeed(xPos, yPos, 0.96);
            if (speed !== _lastMouseSpeed) {
                Klang.trigger("particles_speed", speed, xPos);
                _lastMouseSpeed = speed
            }
        }
    };
    this.onButtonOver = function() {
        Klang.trigger("button_over")
    };
    this.onButtonOut = function() {
        Klang.trigger("button_out")
    };
    this.onButtonClick = function() {
        Klang.trigger("button_click")
    };
    this.onQuestionOver = function() {
        Klang.trigger("question_over")
    };
    this.onQuestionOut = function() {
        Klang.trigger("question_rollout")
    };
    this.onQuestionClick = function() {
        Klang.trigger("question_click")
    };
    this.onIntroTitleIn = function() {
        Klang.trigger("intro_title_in")
    };
    this.onMessageIn = function() {
        Klang.trigger("message_in")
    };
    this.mute = function() {
        Klang.trigger("sound_off")
    };
    this.unmute = function() {
        Klang.trigger("sound_on")
    };
    this.init = function(onComplete) {
        var _loadFromS3 = Klang.Util.getParameterByName("load_s3") == 1;
        var projectPath = _loadFromS3 ? _klangConfigURI : (Config.CDN + "assets/audio/config.js");
        Klang.init(projectPath, function() {
            if (Device.mobile) {
                Klang.load("mobile", onComplete);
                initMobile()
            } else {
                Klang.load("desktop", onComplete)
            }
        });
        addHandlers()
    };
    this.patronusAnimateIn = function() {
        if (_isIntro) {
            Klang.trigger("intro_patronus_start")
        } else {
            Klang.trigger("patronus_start")
        }
        if (_patronusReceived) {
            _disableWand = true
        }
    };
    this.patronusAnimateOut = function() {
        if (_isIntro) {
            Klang.trigger("intro_patronus_end")
        } else {
            if (_successfulAnswers > 0) {
                if (_patronusReceived) {
                    Klang.trigger("patronus_end_completed")
                } else {
                    Klang.trigger("patronus_end")
                }
            } else {
                Klang.trigger("patronus_fade_out")
            }
        }
        if (_patronusReceived) {
            _disableWand = false
        }
    };
    this.onCastStart = function() {
        Klang.trigger("cast_start")
    };
    this.onCastEnd = function() {
        Klang.trigger("cast_stop")
    };
    this.successfulAnswer = function() {
        _successfulAnswers++;
        updateProgress()
    };
    this.tileTransitionStart = function(duration, turnAmount, distance) {
        Klang.trigger("wind_loop_start")
    };
    this.tileTransitionUpdate = function(progress, camera_ref) {
        var camPos = camera_ref.position;
        var normCamY = Math.max(0, Math.min(1, (camera_ref.position.y - 1) / 9));
        normCamY = (normCamY * normCamY);
        var freqWind = scaleValue(normCamY, 240, 10000);
        var freqRise = scaleValue(normCamY, 1240, 20000);
        var now = Date.now();
        var dt = now - _lastTransitionUpdateCache.time;
        _lastTransitionUpdateCache.time = now;
        var speed = 0;
        _lastTransitionUpdateCache.newCamPos.x = camPos.x;
        _lastTransitionUpdateCache.newCamPos.y = camPos.z;
        if (_lastTransitionUpdateCache.lastCamPos) {
            var distance = Vector2.prototype.distanceTo.call(_lastTransitionUpdateCache.lastCamPos, _lastTransitionUpdateCache.newCamPos, true);
            speed = (distance / dt) || 0;
            var vol = Math.min(0.2, speed * 1000);
            if (_lastTransitionUpdateCache.vol != vol) {
                Klang.trigger("wind_loop_vol", vol);
                _lastTransitionUpdateCache.vol = vol
            }
        } else {
            _lastTransitionUpdateCache.lastCamPos = {}
        }
        _lastTransitionUpdateCache.lastCamPos.x = _lastTransitionUpdateCache.newCamPos.x;
        _lastTransitionUpdateCache.lastCamPos.y = _lastTransitionUpdateCache.newCamPos.y;
        Klang.trigger("windloop_freq", freqWind, 0.05, _lastTransitionUpdateCache.lastFreqWind);
        Klang.trigger("filter_bus_freq", freqRise, 0.05, _lastTransitionUpdateCache.lastFreqRise);
        _lastTransitionUpdateCache.lastFreqWind = freqWind;
        _lastTransitionUpdateCache.lastFreqRise = freqRise
    }
}, "static");
Class(function Camera() {
    Inherit(this, Component);
    var _this = this;
    var _debug, _lockCamera, _transition, _timer;
    var _lerp = new DynamicObject({
        v: 0.2
    });
    var _camera = this.worldCamera = new THREE.PerspectiveCamera(35, Stage.width / Stage.height, 0.1, 140);
    var _origin = new THREE.Group();
    var _target = new THREE.Group();
    var _last = new Vector3();
    var _last = new Vector3();
    var _invPos = new THREE.Vector3();
    var _invQuat = new THREE.Quaternion();
    var _velocity = new Vector3();
    this.velocity = _velocity;
    (function() {
        addListeners();
        Render.start(loop)
    })();

    function initPlayground() {
        _debug = Utils3D.createDebug(0.1);
        World.SCENE.add(_debug);
        if (Global.UIL) {}
    }

    function loop() {
        if (_debug) {
            _debug.position.copy(_camera.position);
            _debug.quaternion.copy(_camera.quaternion)
        }
        if (_lockCamera && !_transition) {
            _target.quaternion.copy(_lockCamera.quaternion);
            _target.position.copy(_lockCamera.position)
        }
        _camera.quaternion.slerp(_target.quaternion, _lerp.v);
        _camera.position.lerp(_target.position, _lerp.v);
        _camera.updateMatrix();
        _camera.updateMatrixWorld();
        _invQuat.copy(_camera.quaternion).inverse();
        _invPos.copy(_camera.position).applyQuaternion(_invQuat);
        _velocity.subVectors(_invPos, _last);
        _last.copy(_invPos)
    }

    function addListeners() {
        _this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
    }

    function resizeHandler() {
        _camera.aspect = Stage.width / Stage.height;
        _camera.updateProjectionMatrix()
    }
    this.setCamera = function(camera) {
        if (Hardware.ACTIVE_VR) {
            return
        }
        clearTimeout(_timer);
        var cameraWorld = new THREE.Group();
        camera.getWorldPosition(cameraWorld.position);
        camera.getWorldQuaternion(cameraWorld.quaternion);
        _camera.quaternion.copy(cameraWorld.quaternion);
        _camera.position.copy(cameraWorld.position);
        _target.quaternion.copy(cameraWorld.quaternion);
        _target.position.copy(cameraWorld.position);
        _lockCamera = camera;
        _lerp.v = 0.05
    };
    this.transition = function(camera, time, ease, delay, callback) {
        if (Hardware.ACTIVE_VR) {
            return
        }
        if (typeof delay == "function") {
            callback = delay;
            delay = 0
        }
        clearTimeout(_timer);
        _timer = _this.delayedCall(function() {
            _transition = true;
            var oldCamera = _lockCamera;
            var cameraWorld = new THREE.Group();
            var cameraOld = new THREE.Group();
            var d = new DynamicObject({
                v: 0.001
            });
            d.tween({
                v: 1
            }, time, ease, 0, function() {
                _lockCamera = camera;
                camera.getWorldPosition(cameraWorld.position);
                camera.getWorldQuaternion(cameraWorld.quaternion);
                oldCamera.getWorldPosition(cameraOld.position);
                oldCamera.getWorldQuaternion(cameraOld.quaternion);
                _target.quaternion.copy(oldCamera.quaternion).slerp(camera.quaternion, d.v * d.v);
                _target.position.copy(oldCamera.position).lerp(camera.position, d.v)
            }, function() {
                callback && callback();
                _transition = false
            })
        }, delay || 0)
    };
    this.lockOnCamera = function(camera) {
        if (_camera.fov != _camera.fov) {
            TweenManager.tween(_camera, {
                fov: camera.fov
            }, 1000, "easeInOutCubic")
        }
        _lockCamera = camera
    };
    this.adjust = function(delta) {
        _camera.position.sub(delta);
        _target.position.sub(delta);
        Display.instance().camera.group.position.sub(delta)
    };
    this.adjustLerp = function(speed) {
        _lerp.tween({
            v: 0.05 * speed
        }, 2000, "easeInOutSine")
    }
}, "singleton");
Class(function Container() {
    Inherit(this, Component);
    var _this = this;
    var _loader;
    var $fade;
    (function() {
        if (Tests.embedded()) {
            Embed.instance();
            return
        }
        init();
        addHandlers()
    })();

    function init() {
        Logic.instance();
        DisplayAccessibility.instance();
        if (Tests.useFallback()) {
            initFallback()
        }
        _loader = _this.initClass(Loader);
        if (Mobile.os == "Android" && !location.hostname.strpos("local")) {
            Mobile.fullscreen();
            Mobile.setOrientation("landscape")
        }
        $fade = Stage.create("fade");
        $fade.css({
            width: "100%",
            height: "100%",
            opcaity: 0,
            display: "none",
            backgroundColor: "black",
            zIndex: 9999999
        })
    }

    function addHandlers() {
        _loader.events.add(HydraEvents.FAIL, initFallback);
        _loader.events.add(HydraEvents.READY, initDisplay);
        _this.events.subscribe(QuizEvents.LOADED, loaded);
        _this.events.subscribe(HydraEvents.BROWSER_FOCUS, handlePause)
    }

    function initFallback() {
        DisplayFallback.instance()
    }

    function initDisplay() {
        Display.instance()
    }

    function loaded() {
        _loader.animateOut(function() {
            _loader.destroy()
        })
    }

    function handlePause(e) {
        if (!Tests.useFallback()) {
            if (e.type === "focus") {
                $fade.tween({
                    opacity: 0
                }, 1000, "easeOutCubic", 500, function() {
                    $fade.css({
                        opacity: 0,
                        display: "none"
                    })
                })
            } else {
                $fade.css({
                    opacity: 1,
                    display: "block"
                })
            }
        }
    }
}, "singleton");
Class(function Display() {
    Inherit(this, Controller);
    var _this = this;
    var $container;
    var _camera, _completed, _intro, _quiz, _tiling, _message, _readyText, _logo, _fullscreen, _volume;
    (function() {
        initContainer();
        if (!Mobile.phone) {
			// CHANGED: do not show logo
            //initLogo()
        }
        initUI();
        initWorld();
        initTiling();
        addHandlers()
    })();

    function initContainer() {
        $container = _this.container;
        $container.css({
            position: "static"
        }).setZ(10);
        Stage.add($container)
    }

    function initLogo() {
        _logo = _this.initClass(Logo, [$container])
    }

    function initUI() {
        _volume = _this.initClass(VolumeButton)
    }

    function initWorld() {
        World.instance();
        $container.add(World.ELEMENT)
    }

    function initTiling() {
        _camera = new ForestCamera();
        _camera.group.target = new THREE.Vector3();
        _this.camera = _camera;
        _tiling = _this.initClass(Tiling, _camera.group);
        World.SCENE.add(_tiling.group)
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.INIT_COMPLETED, initCompleted);
        _this.events.subscribe(QuizEvents.INIT_INTRO, initIntro);
        _this.events.subscribe(QuizEvents.START_QUIZ, startQuiz);
        _this.events.subscribe(QuizEvents.MESSAGE, message)
    }

    function initCompleted(e) {
        removeIntro();
        Track.event({
            event: "PatronusQuiz",
            action: "view",
            loggedIn: true
        });
        _completed = _this.initClass(CompletedView)
    }

    function initIntro() {
        _intro = _this.initClass(IntroView)
    }

    function message(text) {
        if (_message && _message.text) {
            _message.text(text)
        } else {
            _message = _this.initClass(Message, {
                text: text
            })
        }
    }

    function startQuiz() {
        _this.delayedCall(removeIntro, 1500);
        _quiz = _this.initClass(QuizView, _tiling, _camera);
        _readyText = _this.initClass(IntroReadyText);
        _readyText.onComplete = function() {
            _readyText.destroy()
        }
    }

    function removeIntro() {
        if (!_intro) {
            return
        }
        _intro = _intro.destroy()
    }
}, "singleton");
Class(function DisplayAccessibility() {
    Inherit(this, Controller);
    var _this = this;
    var $container;
    var _text, _completed, _intro, _quiz, _lastCode, _display;
    (function() {
        initContainer();
        initText();
        addHandlers()
    })();

    function initContainer() {
        $container = _this.container;
        Stage.add($container);
        $container.css({
            position: "fixed",
            width: "100%",
            top: "100%",
            padding: "10px 0",
            fontSize: "18px",
            lineHeight: "20px",
            color: "#fff",
            textAlign: "center",
            backgroundColor: "rgba(255,255,255,.1)",
            zIndex: 999
        });
        $container.div.setAttribute("autofocus", "");
        if (Hydra.HASH && Hydra.HASH.strpos("accessibility")) {
            $container.css({
                bottom: 0,
                top: "auto"
            });
            _display = true
        }
    }

    function initText() {
        Data.onReady(function() {
            _text = _this.initClass(AccessibilityText, {
                text: Copy.get("ACCESSIBILITY", "loading"),
                live: "polite",
                tabindex: 1,
                focus: true
            })
        })
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.INIT_COMPLETED, initCompleted);
        _this.events.subscribe(QuizEvents.INIT_INTRO, initIntro);
        _this.events.subscribe(QuizEvents.START_QUIZ, startQuiz);
        __window.keydown(keydown)
    }

    function initCompleted() {
        removeText();
        removeIntro();
        _completed = _this.initClass(AccessibilityCompletedView)
    }

    function initIntro() {
        removeText();
        _intro = _this.initClass(AccessibilityIntroView)
    }

    function startQuiz() {
        removeText();
        removeIntro();
        _quiz = _this.initClass(AccessibilityQuizView)
    }

    function keydown(e) {
        if (_lastCode === 16 && e.keyCode == 65) {
            if (_display) {
                $container.css({
                    bottom: "100%"
                });
                _display = false
            } else {
                $container.css({
                    bottom: 0,
                    top: "auto"
                });
                _display = true
            }
        }
        _lastCode = e.keyCode
    }

    function removeText() {
        if (_text && _text.destroy) {
            _text = _text.destroy()
        }
    }

    function removeIntro() {
        if (!_intro) {
            return
        }
        _intro = _intro.destroy()
    }
}, "singleton");
Class(function DisplayFallback() {
    Inherit(this, Controller);
    var _this = this;
    var $container;
    var _completed, _intro, _logo, _background;
    var _result = false;
    var _quiz = false;
    (function() {
        initContainer();
        if (!Mobile.phone) {
            // CHANGED: do not show logo
			//initLogo()
        }
        addHandlers()
    })();

    function initContainer() {
        $container = _this.container;
        Stage.add($container);
        $container.size("100%").css({
            background: "#1b1b1b"
        })
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.LOADED, init);
        _this.events.subscribe(QuizEvents.INIT_COMPLETED, initCompleted);
        _this.events.subscribe(QuizEvents.INIT_INTRO, initIntro);
        _this.events.subscribe(QuizEvents.START_QUIZ, startQuiz);
        _this.events.subscribe(QuizEvents.UNVERIFIED, showLoop);
        _this.events.subscribe(QuizEvents.PATRONUS_RECEIVED, endQuiz)
    }

    function init() {
        _background = _this.initClass(FallbackBackground);
        if (_result) {
            _background.result();
            _this.delayedCall(_completed.animateIn, 2000)
        }
        if (_quiz) {
            _background.quiz()
        } else {
            if (!_result && !_quiz) {
                _background.intro()
            }
        }
    }

    function initLogo() {
        _logo = _this.initClass(Logo, [$container])
    }

    function initCompleted() {
        removeIntro();
        Track.event({
            event: "PatronusQuiz",
            action: "view",
            loggedIn: true
        });
        _completed = _this.initClass(FallbackCompletedView);
        _result = true;
        if (_background && _background.loop) {
            _background.result();
            _this.delayedCall(_completed.animateIn, 2000)
        }
    }

    function initIntro() {
        _intro = _this.initClass(FallbackIntroView)
    }

    function startQuiz() {
        removeIntro();
        _quiz = _this.initClass(FallbackQuizView);
        if (_background) {
            _background.quiz()
        }
    }

    function removeIntro() {
        if (!_intro) {
            return
        }
        _intro = _intro.destroy()
    }

    function showLoop() {
        _quiz = true
    }

    function endQuiz() {
        _background.result()
    }
}, "singleton");
Class(function Embed() {
    Inherit(this, Component);
    var _this = this;
    var _uil, _loader, _camera, _patronus, _controls;
    (function() {
        if (!Utils.query("id") && !Utils.query("code")) {
            EmbedIndex.instance();
            return
        }
        if (Utils.query("code")) {
            var query = atob(Utils.query("code"));
            Embed.ID = getParameterByName("id", query);
            Embed.SPEED = getParameterByName("speed", query);
            Embed.SCALE = getParameterByName("scale", query)
        }
        Embed.ID = Embed.ID || Utils.query("id");
        Embed.DEBUG = Utils.query("debug") == "true";
        Embed.DEV = Utils.query("dev") == "true";
        Embed.ACTIVE = true;
        initLoader();
        addHandlers()
    })();

    function initLoader() {
        _loader = _this.initClass(EmbedLoader)
    }

    function initUIL(data) {
        Embed.SPEED = Embed.SPEED || Utils.query("speed") || data.speed;
        Embed.SCALE = Embed.SCALE || Utils.query("scale") || data.scale;
        Embed.LIGHTX = data.lightX;
        Embed.LIGHTY = data.lightY;
        Embed.LIGHTZ = data.lightZ;
        Embed.LIGHT_SCALE = data.lightScale;
        if (Utils.query("debug") !== "true") {
            return
        }
        _uil = new UIL.Gui({
            css: "top: 0; right: 50px;",
            size: 300,
            center: true
        });
        _uil.add("title", {
            name: "Patronus Embed Paramaters"
        });
        _uil.add("slide", {
            name: "speed",
            min: 0,
            max: 1,
            value: Embed.SPEED,
            precision: 3,
            fontColor: "#F6E497",
            height: 20
        });
        _uil.add("slide", {
            name: "scale",
            min: 0.1,
            max: 15,
            value: Embed.SCALE,
            precision: 1,
            fontColor: "#C79F4B",
            height: 20
        });
        _uil.add("bool", {
            name: "auto-rotate",
            h: 20,
            value: true
        });
        _uil.add("bool", {
            name: "zoom pan",
            h: 20,
            value: Embed.DEV
        });
        if (Embed.DEV) {
            _uil.add("number", {
                name: "light",
                value: [Embed.LIGHTX, Embed.LIGHTY, Embed.LIGHTZ],
                precision: 2,
                fontColor: "#E70739",
                height: 36
            })
        }
        if (Embed.DEV) {
            _uil.add("slide", {
                name: "light scale",
                min: 0.1,
                max: 2,
                value: Embed.LIGHT_SCALE,
                precision: 2,
                fontColor: "#F6E497",
                height: 20
            })
        }
        _uil.add("button", {
            name: "save url",
            callback: saveURL
        });
        _uil.add("button", {
            name: "embed code",
            callback: embedCode
        });
        Record.init(_uil);
        if (Device.mobile) {
            _uil.hide(true)
        }
    }

    function getURL(encode) {
        var params = "&id=" + Embed.ID + "&speed=" + Embed.SPEED + "&scale=" + Embed.SCALE;
        if (encode) {
            var code = btoa(params);
            return location.origin + location.pathname + "?embed=true&code=" + code
        } else {
            return location.origin + location.pathname + "?embed=true" + params
        }
    }

    function saveURL() {
        window.prompt("", getURL())
    }

    function embedCode() {
        var url = '<iframe width="100%" height="100%" frameborder="0" src="' + getURL(true) + '"></iframe>';
        window.prompt("", url)
    }

    function initWorld() {
        World.instance();
        Stage.add(World.ELEMENT);
        _this.group = new THREE.Group();
        World.SCENE.add(_this.group)
    }

    function initCamera() {
        _camera = new THREE.PerspectiveCamera(45, Stage.width / Stage.height, 0.1, 200);
        _camera.position.set(-10, 0, 0);
        World.instance().setCamera(_camera);
        _controls = new THREE.OrbitControls(_camera, World.ELEMENT);
        _controls.enableZoom = false;
        _controls.enablePan = false;
        _controls.enableKeys = false;
        _controls.autoRotate = true;
        _controls.autoRotateSpeed = 0.2
    }

    function initPatronus() {
        Data.Patronus.loadData(Embed.ID, function(data) {
            initUIL(data);
            _patronus = new Patronus(data, _this.group);
            World.SCENE.add(_patronus.group);
            _patronus.events.add(HydraEvents.READY, function() {
                _patronus.animateIn();
                _this.events.fire(QuizEvents.EMBED_LOADED)
            })
        })
    }

    function loop() {
        _controls.update();
        if (_uil) {
            updateParameters()
        }
    }

    function updateParameters() {
        Embed.SPEED = _uil.uis[1].value;
        Embed.SCALE = _uil.uis[2].value;
        _controls.autoRotate = _uil.uis[3].value;
        _controls.enableZoom = _uil.uis[4].value;
        _controls.enablePan = _uil.uis[4].value;
        Embed.LIGHTX = _uil.uis[5].value[0];
        Embed.LIGHTY = _uil.uis[5].value[1];
        Embed.LIGHTZ = _uil.uis[5].value[2];
        Embed.LIGHT_SCALE = _uil.uis[6].value
    }

    function addHandlers() {
        _loader.events.add(HydraEvents.READY, init);
        _this.events.subscribe(QuizEvents.LOADED, loaded)
    }

    function init() {
        initWorld();
        initCamera();
        initPatronus();
        Render.start(loop)
    }

    function loaded() {
        _loader.animateOut(_loader.destroy)
    }

    function getParameterByName(name, string) {
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(string);
        if (!results) {
            return null
        }
        if (!results[2]) {
            return ""
        }
        return decodeURIComponent(results[2].replace(/\+/g, " "))
    }
}, function() {
    var _instance;
    Embed.instance = function() {
        if (!_instance) {
            _instance = new Embed()
        }
        return _instance
    }
});
Class(function EmbedIndex() {
    Inherit(this, Controller);
    var _this = this;
    var $container, $content;
    var _data;
    (function() {
        initContainer();
        style();
        loadData()
    })();

    function initContainer() {
        $container = _this.container;
        Stage.add($container)
    }

    function style() {
        $container.size("100%").css({
            overflow: "auto",
        });
        Mobile.overflowScroll($container, {
            y: true
        })
    }

    function loadData() {
        XHR.get(Config.CDN + "assets/data/animals.json", function(data) {
            _data = data;
            createLinks()
        })
    }

    function createLinks() {
        _data.forEach(function(d) {
            if (d.delivered) {
                _this.initClass(EmbedIndexLink, d)
            }
        })
    }
}, "singleton");
Class(function EmbedIndexLink(_data) {
    Inherit(this, View);
    var _this = this;
    var $this, $title, $info;
    (function() {
        initHTML();
        style();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $title = $this.create("Title");
        $info = $this.create("Info")
    }

    function style() {
        $this.css({
            position: "relative",
            width: 250,
            padding: "10px 20px",
            color: _data.approved ? "#83af9b" : "#fe4365",
            fontSize: "13px",
        });
        $title.html(_data.perma).css({
            position: "relative",
            fontFamily: "sans-serif",
            fontStyle: "italic",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            padding: "10px 0",
        });
        $info.html("ID: " + _data.id + "<br />Name: " + _data.name + "<br />Model: " + _data.model + "<br />Animation: " + _data.anim + "<br />Speed: " + _data.speed + "<br />Scale: " + _data.scale).css({
            position: "relative",
            left: 30,
        })
    }

    function addHandlers() {
        $title.interact(null, click)
    }

    function click() {
        getURL(location.origin + location.pathname + "?embed=true&id=" + _data.id + "&debug=true" + (Hydra.LOCAL ? "&dev=true" : ""))
    }
});
Class(function ParticleEngine(_data, _shader, _system) {
    Inherit(this, Component);
    var _this = this;
    var _system, _shader;
    this.group = new THREE.Group();
    (function() {
        initSubSystem();
        Render.start(loop)
    })();

    function initSubSystem() {
        var System = Tests.useGPUParticles() ? ParticleEngineGPU : ParticleEngineCPU;
        if (_system) {
            System = _system
        }
        _system = _this.initClass(System, _data, _shader || "Patronus");
        _this.group.add(_system.group);
        _this.system = _system
    }

    function loop() {
        _system && _system.update()
    }
    this.onDestroy = function() {
        Render.stop(loop)
    };
    this.stopRender = function() {
        Render.stop(loop)
    };
    this.startRender = function() {
        Render.start(loop)
    };
    this.ready = function() {
        _this.events.fire(HydraEvents.READY, null, true)
    };
    this.addBehavior = function(behavior) {
        if (!_system) {
            return _this.delayedCall(_this.addBehavior, 20, behavior)
        }
        _system.addBehavior(behavior)
    };
    this.removeBehavior = function(behavior) {
        if (!_system) {
            return _this.delayedCall(_this.removeBehavior, 20, behavior)
        }
        _system.removeBehavior(behavior)
    }
}, function() {
    ParticleEngine.getShader = function(name, type) {
        var shader = new Shader(ParticleEngine.getVS(name, type), name);
        shader.uniforms = ParticleEngine.getUniforms();
        ParticleEngine.setProperties(shader);
        return shader
    };
    ParticleEngine.getVS = function(name, type) {
        var base = Shaders.getShader(type == "gpu" ? "ParticleEngineGPU.vs" : "ParticleEngineCPU.vs");
        var vs = Shaders.getShader(name + ".vs");
        if (!vs.strpos("void main() {")) {
            throw "Must have void main() {"
        }
        var split = vs.split("void main() {");
        var output = new String(base);
        output = output.replace("#param", split[0]);
        output = output.replace("#main", split[1].replace("}", ""));
        return output
    };
    ParticleEngine.getUniforms = function() {
        return {
            pointSize: {
                type: "f",
                value: 0.028 * Tests.particleScale() * World.DPR
            },
        }
    };
    ParticleEngine.setProperties = function(shader) {}
});
Class(function ParticleBehavior() {
    Inherit(this, Component);
    var _this = this;
    this.uniforms = {};
    this.uniformUpload = {};
    var _dynamicObjects = {};
    (function() {})();

    function createUniform(name, value) {
        value = (function() {
            if (typeof value == "object") {
                if (typeof value.z === "number") {
                    return new Vector3().copy(value)
                }
                if (typeof value.x === "number") {
                    return new Vector2().copy(value)
                }
            }
            return value
        })();
        _this.uniforms[name] = value
    }

    function convertUniform(value) {
        if (typeof value === "object") {
            if (typeof value.z === "number") {
                return new THREE.Vector3().copy(value)
            }
            if (typeof value.x === "number") {
                return new THREE.Vector2().copy(value)
            }
        }
        return value
    }
    this.addUniform = function(name, value) {
        this.uniforms[name] = value;
        if (this.pass) {
            value = convertUniform(value);
            var type = (function() {
                if (typeof value.z === "number") {
                    return "v3"
                }
                if (typeof value.x === "number") {
                    return "v2"
                }
                return "f"
            })();
            this.pass.uniforms[name] = {
                type: type,
                value: value
            }
        }
    };
    this.updateUniform = function(name, value, def) {
        if (!def) {
            this.uniforms[name] = value
        }
        _this = this;
        if (this.pass) {
            var uni = this.pass.uniforms[name];
            if (!uni) {
                nextFrame(function() {
                    _this.updateUniform(name, value, true)
                })
            } else {
                this.pass.uniforms[name].value = value
            }
        }
    };
    this.writeUniform = function(name, value) {
        _this = this;
        var uniforms = this.uniforms;
        if (!uniforms[name]) {
            createUniform(name, value)
        }
        if (typeof value === "object") {
            uniforms[name].copy(value)
        } else {
            uniforms[name] = value
        }
    };
    this.tween = function(key, value, time, ease, delay, callback, update) {
        _this = this;
        if (this.pass) {
            if (typeof value === "number") {
                TweenManager.tween(this.pass.uniforms[key], {
                    value: value
                }, time, ease, delay, callback)
            } else {
                TweenManager.tween(this.uniforms[key], value, time, ease, delay, callback, update)
            }
        } else {
            if (typeof value === "number") {
                var d = _dynamicObjects[key] || new DynamicObject({
                    v: 0
                });
                _dynamicObjects[key] = d;
                if (typeof delay !== "number") {
                    update = callback;
                    callback = delay;
                    delay = 0
                }
                d.stopTween();
                d.v = this.uniforms[key];
                d.tween({
                    v: value
                }, time, ease, function() {
                    _this.uniforms[key] = d.v
                }, callback)
            } else {
                TweenManager.tween(this.uniforms[key], value, time, ease, delay, callback, update)
            }
            delete _this.uniforms[key]._mathTween
        }
    };
    this.getUniform = function(name) {
        return this.pass ? this.pass.uniforms[name] : this.uniforms[name]
    };
    this.clone = function() {
        _this = this;
        var Behavior = _this.constructor;
        var instance = new Behavior();
        if (_this.pass) {
            instance.pass = _this.pass.clone()
        }
        return instance
    }
});
Class(function ParticleBehaviors() {
    var _this = this;
    var _behaviors = {};
    Namespace(this);
    this.get = function(name) {
        if (!Tests.useGPUParticles()) {
            return new _this[name]()
        }
        if (!_behaviors[name]) {
            var behavior = new _this[name]();
            behavior.initGPU();
            _behaviors[name] = behavior
        }
        return _behaviors[name].clone()
    }
}, "static");
Class(function ParticleEngineCPU(_data, _shader) {
    Inherit(this, Component);
    var _this = this;
    var _chunks = [];
    var _uniforms = [];
    var _behaviors = [];
    this.group = new THREE.Group();
    (function() {
        initChunks();
        defer(function() {
            _this.parent.ready()
        })
    })();

    function initChunks() {
        _shader = ParticleEngine.getShader(_shader, "cpu");
        _this.shader = _shader;
        var num = Tests.getCPUChunks();
        for (var i = 0; i < num; i++) {
            var chunk = _this.initClass(ParticleEngineCPUChunk, _data, i, _shader);
            _this.group.add(chunk.mesh);
            _chunks.push(chunk)
        }
    }

    function callChunks(fn, param) {
        for (var i = _chunks.length - 1; i > -1; i--) {
            _chunks[i][fn](param)
        }
    }
    this.update = function() {
        _uniforms.length = 0;
        for (var i = 0; i < _behaviors.length; i++) {
            var behavior = _behaviors[i];
            behavior.uniformUpload.name = behavior.name;
            behavior.uniformUpload.uniforms = behavior.uniforms;
            _uniforms.push(behavior.uniformUpload)
        }
        callChunks("update", _uniforms)
    };
    this.addBehavior = function(behavior) {
        behavior.onReady();
        behavior.system = this;
        var name = Hydra.getClassName(behavior);
        callChunks("addBehavior", "ParticleBehaviors." + name);
        behavior.name = "ParticleBehaviors." + name;
        _behaviors.push(behavior)
    };
    this.removeBehavior = function(behavior) {
        behavior.system = null;
        var name = Hydra.getClassName(behavior);
        callChunks("removeBehavior", "ParticleBehaviors." + name);
        _behaviors.findAndRemove(behavior)
    };
    this.exec = function(name, fn, data, index) {
        if (typeof index === "number") {
            _chunks[index].exec(name, fn, data)
        } else {
            for (var i = _chunks.length - 1; i > -1; i--) {
                _chunks[i].exec(name, fn, data)
            }
        }
    };
    this.importClass = function() {
        for (var i = _chunks.length - 1; i > -1; i--) {
            _chunks[i].importClass.apply(_this, arguments)
        }
    };
    this.importScript = function(path) {
        callChunks("importScript", path)
    };
    this.initialize = function() {
        for (var i = _chunks.length - 1; i > -1; i--) {
            _chunks[i].initialize.apply(_this, arguments)
        }
    };
    this.getChunks = function(callback) {
        for (var i = 0; i < _chunks.length; i++) {
            callback(_chunks[i])
        }
    };
    this.onDestroy = function() {
        _mesh.material.dispose();
        _mesh.geometry.dispose()
    }
});
Class(function ParticleEngineCPUChunk(_data, _index, _shader) {
    Inherit(this, ParticleEngineCPUChunkBase);
    var _this = this;
    var _chunk, _mesh;
    (function() {
        initChunk();
        initMesh();
        initBehaviors()
    })();

    function initChunk() {
        var vertices = [];
        var count = _data.position.length / 3;
        var skip = Tests.getCPUChunks();
        var index = 0;
        for (var i = _index; i < count; i += skip) {
            vertices[index * 3 + 0] = _data.position[i * 3 + 0];
            vertices[index * 3 + 1] = _data.position[i * 3 + 1];
            vertices[index * 3 + 2] = _data.position[i * 3 + 2];
            index++
        }
        _this.init(new Float32Array(vertices))
    }

    function initMesh() {
        _mesh = new THREE.Points(_this.geometry, _shader.material);
        _this.mesh = _mesh;
        _mesh.frustumCulled = false
    }

    function initBehaviors() {
        _this.thread.importClass(ParticleBehaviors, ParticleBehavior);
        for (var key in ParticleBehaviors) {
            var Class = ParticleBehaviors[key];
            if (Class.toString().strpos("ParticleBehavior")) {
                _this.thread.importClass(Class)
            }
        }
    }
});
Class(function ParticleEngineCPUChunkBase() {
    Inherit(this, Component);
    var _this = this;
    var _geom, _vertices, _thread, _recycle;
    var _msg = {};
    var _exec = {};

    function initGeometry() {
        _geom = new THREE.BufferGeometry();
        _geom.addAttribute("position", new THREE.BufferAttribute(_vertices, 3));
        _this.geometry = _geom
    }

    function initThread() {
        _thread = _this.initClass(Thread, ParticleEngineCPUThread);
        _thread.importClass(Vector2, Vector3, ParticlePhysics, EulerIntegrator, LinkedList, Particle, ObjectPool, TweenManager, TweenManager.Interpolation, Render, ParticleConverter);
        _this.thread = _thread;
        var clone = new Float32Array(_vertices.length);
        clone.set(_vertices);
        _thread.init({
            transfer: true,
            msg: {
                vertices: clone,
                buffer: [clone.buffer]
            }
        });
        _thread.on("transfer", transfer);
        _this.importClass = _thread.importClass
    }

    function recycle(buffer, key) {
        if (!_recycle) {
            _recycle = {
                transfer: true,
                msg: {
                    buffers: []
                }
            }
        }
        _recycle.msg.name = key;
        _recycle.msg.array = buffer;
        _recycle.msg.buffers.length = 0;
        _recycle.msg.buffers.push(buffer.buffer);
        _thread.recycleBuffer(_recycle)
    }

    function transfer(e) {
        for (var key in e) {
            var buffer = e[key];
            if (!(buffer instanceof Float32Array)) {
                continue
            }
            _geom.attributes[key].array = buffer;
            _geom.attributes[key].needsUpdate = true;
            recycle(buffer, key)
        }
    }
    this.init = function(vertices, normals) {
        _this = this;
        _vertices = vertices;
        initGeometry();
        initThread()
    };
    this.update = function(e) {
        _msg.data = e;
        _thread.update(_msg)
    };
    this.addBehavior = function(name) {
        _thread.addBehavior({
            name: name
        })
    };
    this.removeBehavior = function(name) {
        _thread.removeBehavior({
            name: name
        })
    };
    this.exec = function(name, fn, data) {
        _exec.name = name;
        _exec.cb = fn;
        _exec.data = data;
        _thread.exec(_exec)
    };
    this.initialize = function() {
        for (var i = 0; i < arguments.length; i++) {
            _thread.initialize({
                name: arguments[i]
            })
        }
    };
    this.importScript = function(path) {
        _thread.importScript(path)
    }
});
Class(function ParticleEngineCPUThread() {
    Inherit(this, Component);
    var _this = this;
    var _system, _vertices;
    var _behaviors = {};
    var _data = {};
    var _buffers = [];
    (function() {})();

    function initSystem(vertices) {
        _system = new ParticlePhysics();
        Global.SYSTEM = _system;
        var count = vertices.length / 3;
        for (var i = 0; i < count; i++) {
            var p = new Particle(new Vector3());
            p.pos.x = vertices[i * 3 + 0];
            p.pos.y = vertices[i * 3 + 1];
            p.pos.z = vertices[i * 3 + 2];
            _system.addParticle(p)
        }
    }

    function initConverter() {
        _converter = _this.initClass(ParticleConverter, _system.particles);
        _converter.addAttribute("position", ["x", "y", "z"]);
        _this.recycleBuffer = _converter.recycle;
        Global.CONVERTER = _converter
    }

    function loop() {
        _system.update();
        var outgoing = _converter.exec();
        _buffers.length = 0;
        for (var key in outgoing) {
            _buffers.push(outgoing[key].buffer)
        }
        emit("transfer", outgoing, _buffers)
    }

    function updateUniforms(e) {
        var uniforms = e.data;
        for (var i = 0; i < uniforms.length; i++) {
            var uni = uniforms[i];
            var behavior = _behaviors[uni.name];
            for (var key in uni.uniforms) {
                behavior.writeUniform(key, uni.uniforms[key])
            }
        }
    }
    this.init = function(e) {
        initSystem(e.vertices);
        initConverter()
    };
    this.update = function(e) {
        Render.tick();
        updateUniforms(e);
        loop()
    };
    this.addBehavior = function(e) {
        var name = e.name;
        var namespace = window;
        var behavior = null;
        if (name.strpos(".")) {
            var split = name.split(".");
            name = split[1];
            namespace = split[0];
            behavior = new window[namespace][name]()
        } else {
            behavior = new window[name]()
        }
        _behaviors[e.name] = behavior;
        _system.addBehavior(behavior);
        behavior.onReady()
    };
    this.removeBehavior = function(e) {
        var behavior = _behaviors[e.name];
        _system.removeBehavior(behavior);
        delete _behaviors[e.mame]
    };
    this.initialize = function(e) {
        Global[e.name] = new window[e.name]()
    };
    this.exec = function(e) {
        Global[e.name][e.cb](e.data)
    };
    Global.emit = loop
});
Class(function ParticleEngineGPU(_data, _shader) {
    Inherit(this, Component);
    var _this = this;
    var _antimatter;
    var _behaviors = [];
    this.group = new THREE.Group();
    (function() {
        initAntimatter()
    })();

    function initAntimatter() {
        _antimatter = _this.initClass(Antimatter, Math.pow(Tests.getSize(), 2), World.RENDERER);
        _antimatter.vertices = _data.vertices;
        _antimatter.vertexShader = ParticleEngine.getVS(_shader || "Patronus", "gpu");
        _antimatter.fragmentShader = Shaders.getShader((_shader || "Patronus") + ".fs");
        _antimatter.uniforms = ParticleEngine.getUniforms();
        _antimatter.persistPasses = true;
        _antimatter.particleAttributes = _data.attributes;
        _antimatter.ready(function() {
            var mesh = _antimatter.getMesh();
            _this.group.add(mesh);
            mesh.renderOrder = 1000;
            _this.parent.shader = _antimatter.shader;
            _this.parent.mesh = mesh;
            _this.parent.ready()
        })
    }
    this.update = function() {
        for (var i = _behaviors.length - 1; i > -1; i--) {
            var behavior = _behaviors[i];
            if (!behavior.pass) {
                console.log(behavior)
            }
            for (var key in behavior.uniforms) {
                var uniforms = behavior.pass.uniforms[key];
                if (!uniforms) {
                    continue
                }
                var value = uniforms.value;
                if (typeof value === "object") {
                    value.copy(behavior.uniforms[key])
                }
            }
        }
        _antimatter.update()
    };
    this.addBehavior = function(behavior) {
        if (!behavior.pass) {
            behavior.initGPU()
        }
        _behaviors.push(behavior);
        _antimatter.addPass(behavior.pass);
        behavior.onReady && behavior.onReady(_antimatter)
    };
    this.removeBehavior = function(behavior) {
        _antimatter.removePass(behavior.pass);
        _behaviors.findAndRemove(behavior)
    }
});
Class(function ParticleEngineThread() {
    Inherit(this, Component);
    var _this = this;
    var _thread;
    var _cache = {};
    (function() {
        initThread()
    })();

    function initThread() {
        var path = (function() {
            if (Config.CDN != "") {
                return Config.CDN
            }
            return location.protocol + "//" + location.hostname + location.pathname
        })();
        _thread = _this.initClass(Thread, ParticleEngineThreadWorker);
        _thread.importClass(XHR, ParticleThreadDistributor, Vector3);
        _thread.importScript(Config.CDN + "assets/js/lib/three.min.js");
        _thread.init({
            path: path
        })
    }
    this.generate = function(callback) {
        var size = Tests.getSize();
        if (_cache[size]) {
            return defer(function() {
                callback(_cache[size])
            })
        }
        _thread.generate({
            size: size
        }, function(data) {
            if (Tests.useGPUParticles()) {
                data.vertices = new AntimatterAttribute(data.position, 3);
                data.attributes = new AntimatterAttribute(data.attribs, 4)
            }
            _cache[size] = data;
            callback(data)
        })
    };
    this.generateEthereal = function(num, callback) {
        _thread.generateEthereal({
            size: num
        }, function(data) {
            callback(data)
        })
    };
    this.load = function(model, animation, callback) {
        if (_cache[model]) {
            return callback(_cache[model])
        }
        var config = {
            model: "assets/models/" + model + ".json",
            animation: "assets/models/" + animation + ".json",
            size: Tests.getSize(),
            reduce: Tests.reducePatronus()
        };
        _thread.load(config, function(data) {
            var geometry = new THREE.BufferGeometry();
            geometry.addAttribute("position", new THREE.BufferAttribute(data.position, 3));
            geometry.addAttribute("normal", new THREE.BufferAttribute(data.normal, 3));
            geometry.addAttribute("uv", new THREE.BufferAttribute(data.uv, 2));
            geometry.addAttribute("skinIndex", new THREE.BufferAttribute(data.skinIndices, 4));
            geometry.addAttribute("skinWeight", new THREE.BufferAttribute(data.skinWeights, 4));
            geometry.bones = data.bones;
            geometry.animation = data.animation;
            geometry.particles = {};
            geometry.particles.position = data.particleVertices;
            geometry.particles.attribs = data.attribs;
            geometry.particles.skinIndices = data.particleIndices;
            geometry.particles.skinWeights = data.particleWeights;
            if (Tests.useGPUParticles()) {
                geometry.particles.vertices = new AntimatterAttribute(data.particleVertices, 3);
                geometry.particles.attributes = new AntimatterAttribute(data.attribs, 4);
                geometry.particles.lifeOrigin = new AntimatterAttribute(data.particleLifeOrigin, 3)
            }
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            _cache[model] = geometry;
            callback(geometry)
        })
    };
    this.clearCache = function() {
        _cache = {}
    }
}, "singleton");
Class(function ParticleEngineThreadWorker() {
    Inherit(this, Component);
    var _this = this;
    var _reducePatronus;
    var PATH = "";

    function generateAttributes(size) {
        var num = size * size;
        var attribs = new Float32Array(num * 3);
        for (var i = 0; i < num; i++) {
            attribs[i * 4 + 0] = Utils.doRandom(50, 100) / 100;
            attribs[i * 4 + 1] = Utils.doRandom(50, 100) / 100;
            attribs[i * 4 + 2] = Utils.doRandom(50, 100) / 100;
            attribs[i * 4 + 3] = 1;
            if (_reducePatronus) {
                if (Utils.doRandom(0, 100) < _reducePatronus) {
                    attribs[i * 4 + 3] = 0
                }
            }
        }
        return attribs
    }

    function generateParticleVertices(obj, size, model, skinIndex, skinWeight, vertices) {
        var num = size * size;
        var position = new Float32Array(num * 3);
        var skinIndices = new Float32Array(num * 4);
        var skinWeights = new Float32Array(num * 4);
        var lifeOrigin = new Float32Array(num * 3);
        var total = vertices.length / 3;
        var distribution = new Vector3();
        var j = 0;
        for (var i = 0; i < num; i++) {
            j = Utils.doRandom(0, total / 3) * 3;
            distribution.set(Utils.doRandom(0, 100), Utils.doRandom(0, 100), Utils.doRandom(0, 100));
            var m = 1 / (distribution.x + distribution.y + distribution.z);
            distribution.set(distribution.x * m, distribution.y * m, distribution.z * m);
            position[i * 3 + 0] = vertices[j * 3 + 0] * distribution.x + vertices[j * 3 + 3] * distribution.y + vertices[j * 3 + 6] * distribution.z;
            position[i * 3 + 1] = vertices[j * 3 + 1] * distribution.x + vertices[j * 3 + 4] * distribution.y + vertices[j * 3 + 7] * distribution.z;
            position[i * 3 + 2] = vertices[j * 3 + 2] * distribution.x + vertices[j * 3 + 5] * distribution.y + vertices[j * 3 + 8] * distribution.z;
            if (false) {
                var skinCluster1 = {};
                skinCluster1[skinIndex[j * 4 + 0]] = skinWeight[j * 4 + 0];
                skinCluster1[skinIndex[j * 4 + 1]] = skinWeight[j * 4 + 1];
                skinCluster1[skinIndex[j * 4 + 2]] = skinWeight[j * 4 + 2];
                skinCluster1[skinIndex[j * 4 + 3]] = skinWeight[j * 4 + 3];
                var skinCluster2 = {};
                skinCluster2[skinIndex[j * 4 + 4]] = skinWeight[j * 4 + 4];
                skinCluster2[skinIndex[j * 4 + 5]] = skinWeight[j * 4 + 5];
                skinCluster2[skinIndex[j * 4 + 6]] = skinWeight[j * 4 + 6];
                skinCluster2[skinIndex[j * 4 + 7]] = skinWeight[j * 4 + 7];
                var skinCluster3 = {};
                skinCluster3[skinIndex[j * 4 + 8]] = skinWeight[j * 4 + 8];
                skinCluster3[skinIndex[j * 4 + 9]] = skinWeight[j * 4 + 9];
                skinCluster3[skinIndex[j * 4 + 10]] = skinWeight[j * 4 + 10];
                skinCluster3[skinIndex[j * 4 + 11]] = skinWeight[j * 4 + 11];
                var indices = [];
                for (var k = 0; k < 12; k++) {
                    var index = skinIndex[j * 4 + k];
                    if (indices.indexOf(index) === -1) {
                        indices.push(index)
                    }
                }
                var clusters = [];
                for (var k = 0; k < indices.length; k++) {
                    var index = indices[k];
                    clusters.push([index, (skinCluster1[index] || 0) * distribution.x + (skinCluster2[index] || 0) * distribution.y + (skinCluster3[index] || 0) * distribution.z])
                }
                clusters.sort(function(a, b) {
                    return b[1] - a[1]
                });
                for (var l = clusters.length - 1; l < 4; l++) {
                    clusters.push([0, 0])
                }
                var sum = clusters[0][1] + clusters[1][1] + clusters[2][1] + clusters[3][1];
                skinIndices[i * 4 + 0] = clusters[0][0];
                skinIndices[i * 4 + 1] = clusters[1][0];
                skinIndices[i * 4 + 2] = clusters[2][0];
                skinIndices[i * 4 + 3] = clusters[3][0];
                skinWeights[i * 4 + 0] = clusters[0][1] * (1 / sum);
                skinWeights[i * 4 + 1] = clusters[1][1] * (1 / sum);
                skinWeights[i * 4 + 2] = clusters[2][1] * (1 / sum);
                skinWeights[i * 4 + 3] = clusters[3][1] * (1 / sum)
            } else {
                skinIndices[i * 4 + 0] = skinIndex[j * 4 + 0];
                skinIndices[i * 4 + 1] = skinIndex[j * 4 + 1];
                skinIndices[i * 4 + 2] = skinIndex[j * 4 + 2];
                skinIndices[i * 4 + 3] = skinIndex[j * 4 + 3];
                skinWeights[i * 4 + 0] = skinWeight[j * 4 + 0];
                skinWeights[i * 4 + 1] = skinWeight[j * 4 + 1];
                skinWeights[i * 4 + 2] = skinWeight[j * 4 + 2];
                skinWeights[i * 4 + 3] = skinWeight[j * 4 + 3]
            }
            lifeOrigin[i] = Utils.doRandom(0, 100) / 100
        }
        obj.particleVertices = position;
        obj.particleIndices = skinIndices;
        obj.particleWeights = skinWeights;
        obj.particleLifeOrigin = lifeOrigin
    }
    this.init = function(e) {
        PATH = e.path + (e.path.charAt(e.path.length - 1) == "/" ? "" : "/")
    };
    this.generate = function(e, id) {
        var size = e.size;
        var num = size * size;
        var position = new Float32Array(num * 3);
        var attribs = new Float32Array(num * 4);
        for (var i = 0; i < num; i++) {
            position[i * 3 + 0] = Utils.doRandom(-100, 100);
            position[i * 3 + 1] = Utils.doRandom(-100, 100);
            position[i * 3 + 2] = Utils.doRandom(-100, 100);
            attribs[i * 4 + 0] = Utils.doRandom(50, 100) / 100;
            attribs[i * 4 + 1] = Utils.doRandom(50, 100) / 100;
            attribs[i * 4 + 2] = Utils.doRandom(50, 100) / 100;
            attribs[i * 4 + 3] = Utils.doRandom(50, 100) / 100
        }
        post({
            position: position,
            attribs: attribs
        }, id, [position.buffer, attribs.buffer])
    };
    this.generateEthereal = function(e, id) {
        var num = e.size;
        var position = new Float32Array(num * 3);
        for (var i = 0; i < num; i++) {
            position[i * 3 + 0] = Utils.doRandom(-50, 50);
            position[i * 3 + 1] = Utils.doRandom(-50, 50);
            position[i * 3 + 2] = Utils.doRandom(-50, 50)
        }
        post({
            position: position
        }, id, [position.buffer])
    };
    this.load = function(e, id) {
        _reducePatronus = e.reduce;
        XHR.get(PATH + e.model, function(model) {
            XHR.get(PATH + e.animation, function(animation) {
                var obj = {};
                obj.position = new Float32Array(model.position);
                obj.normal = new Float32Array(model.normal);
                obj.uv = new Float32Array(model.uv);
                obj.skinIndices = new Float32Array(model.skinIndices);
                obj.skinWeights = new Float32Array(model.skinWeights);
                obj.animation = animation.animation;
                obj.bones = model.bones;
                obj.attribs = generateAttributes(e.size);
                generateParticleVertices(obj, e.size, obj.position, obj.skinIndices, obj.skinWeights, obj.position);
                post(obj, id, [obj.position.buffer, obj.normal.buffer, obj.uv.buffer, obj.skinIndices.buffer, obj.skinWeights.buffer, obj.attribs.buffer, obj.particleVertices.buffer, obj.particleIndices.buffer, obj.particleWeights.buffer, obj.particleLifeOrigin.buffer])
            })
        })
    }
});
Class(function ParticleThreadDistributor(_vertices) {
    Inherit(this, Component);
    var _this = this;
    var _v3 = new Vector3();
    var _positions = [];
    var _length = 0;
    (function() {
        initTriangles()
    })();

    function initTriangles() {
        var count = _vertices.length / 3;
        var triangle = {
            vertices: []
        };
        for (var i = 0; i < count; i++) {
            var x = _vertices[i * 3 + 0];
            var y = _vertices[i * 3 + 1];
            var z = _vertices[i * 3 + 2];
            var p = new Vector3(x, y, z);
            p.triangle = triangle;
            p.index = i;
            triangle.vertices.push(p);
            _positions.push(p);
            if (triangle.vertices.length == 3) {
                computeTri(triangle);
                triangle = {
                    vertices: []
                }
            }
        }
        _length = _positions.length - 1
    }

    function computeTri(triangle) {
        _v3.set(0, 0, 0);
        _v3.add(triangle.vertices[0]);
        _v3.add(triangle.vertices[1]);
        _v3.add(triangle.vertices[2]);
        _v3.divide(3);
        triangle.centroid = _v3.clone()
    }
    this.getPos = function() {
        var p = _positions[Utils.doRandom(0, _length)];
        _v3.copy(p).lerp(p.triangle.centroid, Utils.doRandom(0, 100) / 100);
        _v3.index = p.index;
        return _v3
    }
});
Class(function Ethereal() {
    Inherit(this, Component);
    var _this = this;
    var _engine, _system, _interaction, _shader;
    var _percent = new DynamicObject({
        v: 0.15
    });
    this.group = new THREE.Group();
    (function() {
        if (Hardware.ACTIVE_VR) {
            return
        }
        ParticleEngineThread.instance().generateEthereal(Math.round(1000 * Tests.getEtherealReduction()), init);
        Utils3D.freezeMatrix(_this.group)
    })();

    function init(geom) {
        _engine = _this.initClass(ParticleEngine, geom, "Ethereal", ParticleEngineCPU);
        _this.group.add(_engine.group);
        _system = _engine.system;
        _system.importScript(Config.CDN + "assets/js/lib/three.min.js");
        _system.importClass(EtherealThreadBase, EtherealBehavior, HydraEvents, Emitter);
        _system.initialize("EtherealThreadBase");
        _system.getChunks(function(chunk) {
            var count = chunk.geometry.attributes.position.count;
            chunk.geometry.addAttribute("life", new THREE.BufferAttribute(new Float32Array(count), 1));
            chunk.geometry.addAttribute("attribs", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
            chunk.mesh.renderOrder = 3
        });
        _shader = _system.shader;
        _shader.material.depthWrite = false;
        _shader.material.transparent = true;
        _shader.material.blending = THREE.AdditiveBlending;
        _shader.uniforms.tMap = {
            type: "t",
            value: Utils3D.getTexture("assets/images/ethereal/particle.jpg")
        };
        _shader.uniforms.tRamp = {
            type: "t",
            value: Utils3D.getTexture("assets/images/ethereal/ramp.jpg")
        };
        _shader.uniforms.tRamp2 = {
            type: "t",
            value: Utils3D.getTexture("assets/images/patronus/ramp.jpg")
        };
        _shader.uniforms.rampMix = {
            type: "f",
            value: 0
        };
        _shader.set("pointSize", 0.025 * World.DPR);
        _interaction = _this.initClass(EtherealInteraction);
        _interaction.update = touchMove;
        _system.exec("EtherealThreadBase", "init", {
            reduction: Tests.getEtherealReduction()
        });
        addListeners();
        _this.isReady = true
    }

    function addListeners() {
        _this.events.subscribe(World.DROP_DPR, adjustSize)
    }

    function adjustSize() {
        _shader.set("pointSize", 0.025 * World.DPR)
    }

    function touchMove(e) {
        e.percent = _percent.v;
        _system.exec("EtherealThreadBase", "emit", e)
    }
    this.cast = function(target) {
        if (Hardware.ACTIVE_VR) {
            return
        }
        _interaction.cast(target);
        _this.forceTrail = false;
        _interaction.start()
    };
    this.arrived = function() {
        _system.exec("EtherealThreadBase", "arrived");
        _this.forceTrail = false
    };
    this.start = function() {
        _this.forceTrail = true
    };
    this.stop = function() {
        if (Hardware.ACTIVE_VR) {
            return
        }
    };
    this.increment = function(perc) {
        if (!_shader) {
            return _this.delayedCall(_this.increment, 100, perc)
        }
        _percent.tween({
            v: perc
        }, 5000, "easeOutCubic");
        _shader.tween("rampMix", 1, 5000, "easeInOutSine")
    }
}, "singleton");
Class(function ForestLakeTile() {
    Inherit(this, Component);
    var _this = this;
    var _trees, _ground, _lights, _intro, _reveal;
    var _fireflies, _water, _outer, _fog;
    var _show = 0;
    this.group = new THREE.Group();
    (function() {
        ForestLakeTile.instance = _this;
        initFireflies();
        initFog();
        ForestThread.instance().load("lake", function(geometries) {
            _lights = ForestLighting.instance().initLights("lake");
            ForestLighting.instance().attachLights(_lights, _this.group);
            var ground = _this.initClass(ForestGround, geometries[0], "lake");
            var trees = _this.initClass(ForestTrees, geometries[1], "lake");
            var water = _this.initClass(ForestWater);
            var outer = _this.initClass(ForestOuter);
            _this.group.add(ground.mesh);
            _this.group.add(trees.mesh);
            _this.group.add(water.mesh);
            _this.group.add(outer.group);
            ForestLighting.instance().applyLights(_lights, ground.shader);
            ForestLighting.instance().applyLights(_lights, trees.shader);
            ground.shader.updateLighting();
            trees.shader.updateLighting();
            ground.shader.set("useRimLight", 1);
            trees.shader.set("useRimLight", 1);
            _this.delayedCall(fireTracking, 5000);
            _trees = trees;
            _ground = ground;
            _water = water;
            _outer = outer;
            if (Hardware.ACTIVE_VR || Data.User.getPatronus()) {
                if (!Hardware.ACTIVE_VR) {
                    Global.REACHED_END = true
                }
                _reveal = _this.initClass(ForestReveal, true);
                _this.group.add(_reveal.group);
                Camera.instance().setCamera(_reveal.camera.worldCamera)
            } else {
                _intro = _this.initClass(ForestIntro);
                _this.group.add(_intro.group)
            }
        })
    })();

    function initFireflies() {
        _fireflies = new FireflyParticles(35, 20, 15, 1, 200, new THREE.Color(4781270));
        _fireflies.mesh.position.z -= 5;
        _this.group.add(_fireflies.mesh);
        _fireflies.alpha = 0.8;
        _fireflies.pointSize = _fireflies.size;
        _this.events.subscribe(ForestWaterShader.RENDER, waterRender)
    }

    function initFog() {
        if (Tests.drawFog()) {
            _fog = _this.initClass(ForestFog, _this.group, 50);
            if (!Tests.renderVFX()) {
                _this.group.add(_fog.group)
            }
        }
    }

    function fireTracking() {
        Track.event({
            event: "PatronusQuiz",
            action: "Visuals",
            fallback: Tests.useFallback(),
            tier: Tests.getPerfNumber(),
            fallbackImages: !Tests.useFallbackVideo()
        })
    }

    function waterRender(e) {
        if (!e.visible) {
            _fireflies.size = _fireflies.pointSize
        } else {
            _fireflies.size = _fireflies.pointSize * 2
        }
        _ground.mesh.visible = e.visible;
        _outer.group.visible = e.visible
    }
    this.hide = function() {
        if (!_trees) {
            return _this.delayedCall(_this.hide, 100)
        }
        _this.group.visible = false;
        _trees.shader.material.visible = false;
        _ground.shader.material.visible = false;
        _lights.group.visible = false;
        _fireflies.pause();
        _water.pause();
        FX.Translucency.instance().deactivate()
    };
    this.show = function() {
        if (!_trees) {
            return _this.delayedCall(_this.show, 100)
        }
        _this.group.visible = true;
        _trees.shader.material.visible = true;
        _ground.shader.material.visible = true;
        _lights.group.visible = true;
        _fireflies.resume();
        _water.resume();
        FX.Translucency.instance().activate();
        _ground.shader.set("darken", 0);
        _ground.shader.tween("darken", 1, 500, "easeOutSine", 100);
        _trees.shader.set("darken", 0);
        _trees.shader.tween("darken", 1, 500, "easeOutSine", 100)
    };
    this.removeIntro = function() {
        if (_intro) {
            _intro = _intro.destroy()
        }
        ParticleEngineThread.instance().clearCache()
    };
    this.nextPos = function(pos, lookAt, duration) {
        Global.REACHED_END = true;
        _this.delayedCall(function() {
            _reveal = _this.initClass(ForestReveal);
            _this.group.add(_reveal.group);
            Camera.instance().transition(_reveal.camera.worldCamera, duration * 0.5, "easeInOutSine")
        }, duration * 0.5);
        _this.delayedCall(function() {
            Ethereal.instance().arrived()
        }, duration)
    }
});
Class(function ForestTile(_index) {
    Inherit(this, Component);
    var _this = this;
    var _trees, _ground, _lights;
    var _fireflies, _firefliesSpread, _landing, _lightTimer, _fog;
    _index = _index || 0;
    this.group = new THREE.Group();
    (function() {
        initFireflies();
        initFog();
        if (Hydra.HASH.strpos("ForestTile/")) {
            _index = Hydra.HASH.split("ForestTile/")[1]
        }
        var path = "tile" + _index;
        ForestThread.instance().load(path, function(geometries) {
            World.RENDERER.shadowMap.needsUpdate = true;
            _lights = ForestLighting.instance().initLights(path);
            ForestLighting.instance().attachLights(_lights, _this.group);
            var ground = _this.initClass(ForestGround, geometries[0], path);
            var trees = _this.initClass(ForestTrees, geometries[1], path);
            _this.group.add(ground.mesh);
            _this.group.add(trees.mesh);
            ForestLighting.instance().applyLights(_lights, ground.shader);
            ForestLighting.instance().applyLights(_lights, trees.shader);
            ground.shader.updateLighting();
            trees.shader.updateLighting();
            ground.shader.set("tShadow", Utils3D.getTexture("assets/images/forest/ao-shadows-forest.jpg"));
            _trees = trees;
            _ground = ground
        })
    })();

    function initFireflies() {
        _fireflies = new FireflyParticles(10, 15, 15, 0.5, 100, new THREE.Color(4781270));
        _this.group.add(_fireflies.mesh);
        _firefliesSpread = new FireflyParticles(70, 10, 70, 0.5, 200, new THREE.Color(4781270));
        _firefliesSpread.mesh.position.y = 1;
        _this.group.add(_firefliesSpread.mesh)
    }

    function initFog() {
        if (Tests.drawFog()) {
            _fog = _this.initClass(ForestFog, _this.group);
            _this.group.add(_fog.group)
        }
    }

    function waterRender(e) {
        _this.group.visible = e.visible;
        _trees.shader.material.visible = e.visible;
        _ground.shader.material.visible = e.visible;
        _lights.group.visible = e.visible
    }
    this.hide = function() {
        if (!_trees) {
            return _this.delayedCall(_this.hide, 100)
        }
        _this.group.visible = false;
        _trees.shader.material.visible = false;
        _ground.shader.material.visible = false;
        _lights.group.visible = false;
        _fireflies.pause();
        _firefliesSpread.pause();
        _this.events.unsubscribe(ForestWaterShader.RENDER, waterRender)
    };
    this.show = function() {
        if (!_trees) {
            return _this.delayedCall(_this.show, 100)
        }
        _this.group.visible = true;
        _trees.shader.material.visible = true;
        _ground.shader.material.visible = true;
        _lights.group.visible = true;
        _fireflies.resume();
        _firefliesSpread.resume();
        _ground.shader.set("darken", 0);
        _ground.shader.tween("darken", 1, 500, "easeOutSine", 100);
        _this.events.subscribe(ForestWaterShader.RENDER, waterRender);
        _trees.shader.set("darken", 0);
        _trees.shader.tween("darken", 1, 500, "easeOutSine", 100)
    };
    this.nextPos = function(pos, lookAt, duration) {
        var local = pos.clone();
        _this.group.worldToLocal(local);
        _fireflies.mesh.position.copy(local);
        _fireflies.mesh.lookAt(lookAt);
        _fireflies.mesh.position.y = local.y - 2.5;
        _landing = {
            pos: pos,
            lookAt: lookAt,
            duration: duration,
            local: local
        };
        var light = ForestLighting.instance().getPatronusLight();
        _lightTimer = _this.delayedCall(function() {
            TweenManager.tween(light, {
                intensity: 0
            }, 1000, "easeInOutSine", function() {
                light.color.set(1125941);
                light.position.copy(pos);
                TweenManager.tween(light, {
                    intensity: 7
                }, 1000, "easeInOutSine", (duration - 1000) * 0.8)
            })
        }, 100)
    };
    this.nonCorporeal = function(callback) {
        var noncorp;
        clearTimeout(_lightTimer);
        _this.delayedCall(function() {
            noncorp = _this.initClass(ForestNonCorporeal, _landing.local, _landing.lookAt, _this.group);
            _this.delayedCall(noncorp.animateIn, 3000);
            noncorp.events.add(HydraEvents.COMPLETE, function() {
                callback();
                _this.delayedCall(function() {
                    noncorp.destroy()
                }, 2000)
            })
        }, 5000);
        return function() {
            if (noncorp) {
                noncorp.animateOut()
            }
        }
    }
});
Class(function EmbedLoader() {
    Inherit(this, Component);
    var _this = this;
    var _loader;
    (function() {
        initLoader()
    })();

    function getAssetList() {
        if (!Tests.useFallback()) {
            return ["ethereal", "fireflies", "patronus", "forest", "shaders", "geometry", "lib", ".fnt"]
        }
        return ["fireflies"]
    }

    function initLoader() {
        __body.bg("#000");
        Stage.css({
            opacity: 0
        });
        AssetUtil.exclude("geometry/forest");
        _loader = _this.initClass(AssetLoader, AssetUtil.getAssets(getAssetList()));
        _loader.add(2);
        _loader.events.add(HydraEvents.COMPLETE, loaded);
        _loader.events.add(HydraEvents.PROGRESS, progress);
        Data.onReady(function() {
            _loader.trigger()
        });
        if (Tests.useFallback()) {
            return _loader.trigger(1)
        }
        AssetLoader.waitForLib("THREE", function() {
            _this.events.subscribe(QuizEvents.EMBED_LOADED, function() {
                _loader.trigger()
            });
            _this.events.fire(HydraEvents.READY)
        })
    }

    function progress(e) {}

    function loaded() {
        _this.events.fire(QuizEvents.LOADED)
    }
    this.animateOut = function(callback) {
        Stage.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 500, "easeInOutSine", 250, function() {
            if (typeof callback == "function") {
                callback()
            }
        })
    }
});
Class(function Loader() {
    Inherit(this, Component);
    var _this = this;
    var _loader, _view, _timer;
    var $cover;
    (function() {
        initView();
        _this.delayedCall(function() {
            initLoader();
            addHandlers()
        }, 100)
    })();

    function initLoader() {
        AssetUtil.exclude(["geometry/forest", "share"]);
        if (Utils.query("debug") != "true") {
            AssetUtil.exclude("whammy")
        }
        if (!Hydra.HASH.strpos("playground")) {
            AssetUtil.exclude("uil")
        }
        if (!Tests.useFallback()) {
            AssetUtil.exclude("fallback")
        }
        var assets = AssetUtil.getAssets(getAssetList());
        if (Tests.cacheBustThree()) {
            assets.forEach(function(asset, i) {
                if (asset.strpos("three.min.js")) {
                    assets[i] += "?" + Utils.timestamp()
                }
            })
        }
        _loader = _this.initClass(AssetLoader, assets);
        _loader.events.add(HydraEvents.ERROR, loaderError);
        _loader.add(1);
        Data.onReady(function() {
            if (Tests.useFallback()) {
                if (Data.User.getPatronus()) {
                    Data.Patronus.loadData(Data.User.getPatronus(), function(data) {
                        _loader.trigger();
                        _timer = _this.delayedCall(function() {
                            if (_loader) {
                                loaded()
                            }
                        }, 4000)
                    })
                } else {
                    return _loader.trigger()
                }
            } else {
                _loader.add(1);
                CPUTest.run(function(time) {
                    Hardware.CPU_RESULT = time;
                    if (time > Tests.maxCPUTime()) {
                        Hardware.NO_GPU = true;
                        Hardware.LOW_GPU = true;
                        _this.events.fire(HydraEvents.FAIL);
                        _loader.trigger(2);
                        return
                    }
                    _loader.trigger();
                    _loader.add(1);
                    AssetLoader.waitForLib("Klang", function() {
                        AudioController.init(function() {
                            _loader.trigger()
                        })
                    });
                    AssetLoader.waitForLib("THREE", function() {
                        window.trackingEmbed && window.trackingEmbed();
                        var loaded = 0;
                        var loadedMax = 2;
                        var checkIfReady = function() {
                            if (++loaded == loadedMax) {
                                AssetLoader.loadAssets(AssetUtil.getAssets("fonts"));
                                _this.events.fire(HydraEvents.READY);
                                _this.events.subscribe(QuizEvents.GL_READY, function() {
                                    _loader.trigger()
                                })
                            }
                        };
                        _loader.add(2);
                        var model = "92-stag";
                        var anim = "93-doe-walk";

                        function initThreads() {
                            ParticleEngineThread.instance().load(model, anim, function() {
                                _loader.trigger();
                                checkIfReady()
                            });
                            ForestThread.instance().load("lake", function() {
                                _loader.trigger();
                                checkIfReady()
                            })
                        }
                        if (Data.User.getPatronus()) {
                            Global.DIRECT_END = true;
                            _loader.add(1);
                            loadedMax++;
                            Data.Patronus.loadData(Data.User.getPatronus(), function(data) {
                                model = data.model;
                                anim = data.anim;
                                _loader.trigger();
                                checkIfReady();
                                initThreads()
                            })
                        } else {
                            initThreads()
                        }
                    })
                })
            }
        })
    }

    function getAssetList() {
        if (!Tests.useFallback()) {
            return ["ethereal", "fireflies", "patronus", "forest", "shaders", "geometry", "lib", ".fnt"]
        }
        if (Tests.useFallback() && Mobile.phone) {
            return ["images/fallback/small"]
        }
        return ["images/fallback/regular"]
    }

    function initView() {
        _view = _this.initClass(LoaderView)
    }

    function addHandlers() {
        _loader.events.add(HydraEvents.PROGRESS, progress);
        _loader.events.add(HydraEvents.COMPLETE, loaded)
    }

    function progress(e) {
        _view.update(e.percent)
    }

    function loaderError(e) {
        location.reload()
    }

    function loaded() {
        _loader = null;
        _this.events.fire(QuizEvents.LOADED);
        clearTimeout(_timer);
        Global.LOAD_COMPLETE = true
    }
    this.animateOut = function(callback) {
        _view.animateOut(callback);
        _this.delayedCall(function() {
            _this.destroy()
        }, 4000)
    }
});
Class(function Logic() {
    Inherit(this, Component);
    var _this = this;
    var _introLogic, _quizLogic;
    (function() {
        addHandlers()
    })();

    function addHandlers() {
        _this.events.subscribe(QuizEvents.LOADED, init);
        _this.events.subscribe(QuizEvents.START_QUIZ, startQuiz);
        _this.events.subscribe(QuizEvents.INIT_COMPLETED, removeIntroLogic)
    }

    function init() {
        Data.User.getStatus(function(status) {
            if (status == "completed") {
                _this.events.fire(QuizEvents.INIT_COMPLETED)
            } else {
                _introLogic = _this.initClass(LogicIntro, status)
            }
        })
    }

    function removeIntroLogic() {
        if (_introLogic) {
            _this.delayedCall(function() {
                if (_introLogic) {
                    _introLogic.destroy()
                }
            }, 1000)
        }
    }

    function startQuiz() {
        removeIntroLogic();
        _quizLogic = _this.initClass(LogicQuiz)
    }
    this.resetTimer = function() {
        _quizLogic.resetTimer()
    }
}, "singleton");
Class(function LogicIntro(_status) {
    Inherit(this, Component);
    var _this = this;
    var _pollTimer;
    (function() {
        initIntro();
        initState();
        addListeners()
    })();

    function initIntro() {
        _this.events.fire(QuizEvents.INIT_INTRO)
    }

    function initState() {
        if (_status == "loggedIn") {
            Global.INIT_LOGGED_IN = true;
            _this.events.fire(QuizEvents.LOGGED_IN);
            return
        } else {
            if (_status == "unverified") {
                checkStatus();
                _this.events.fire(QuizEvents.UNVERIFIED)
            } else {
                _this.events.fire(QuizEvents.LOGGED_OUT)
            }
        }
    }

    function checkStatus() {
        Data.User.getStatus(function(status) {
            if (status === "loggedIn") {
                _this.events.fire(QuizEvents.LOGGED_IN);
                if (Mobile.os == "Android" && !location.hostname.strpos("local")) {
                    Mobile.setOrientation("landscape")
                }
                return
            } else {
                if (status === "unverified") {
                    _this.events.fire(QuizEvents.UNVERIFIED)
                } else {
                    if (status == "completed") {
                        if (Mobile.os == "Android" && !location.hostname.strpos("local")) {
                            Mobile.setOrientation("portrait")
                        }
                        location.reload();
                        return
                    }
                }
            }
            _this.events.fire(QuizEvents.STATUS_CHECKED)
        }, true)
    }

    function addListeners() {
        window.addEventListener("message", receiveMessage, false);
        _this.events.subscribe(QuizEvents.CLOSE_IFRAME, iframeClosed);
        _this.events.subscribe(QuizEvents.VERIFY, checkStatus)
    }

    function receiveMessage(e) {
        if (e.data === "CLOSE_IFRAME") {
            if (Mobile.os == "Android" && !location.hostname.strpos("local")) {
                Mobile.setOrientation("landscape")
            }
            window.removeEventListener("message", receiveMessage);
            _this.events.fire(QuizEvents.CLOSE_IFRAME)
        }
    }

    function iframeClosed() {
        if (Mobile.os == "Android" && !location.hostname.strpos("local")) {
            Mobile.setOrientation("landscape")
        }
        checkStatus()
    }
    this.onDestroy = function() {
        if (_pollTimer) {
            clearTimeout(_pollTimer)
        }
    }
});
Class(function LogicQuiz() {
    Inherit(this, Component);
    var _this = this;
    var _timeout, _question;
    var _current = 1;
    (function() {
        addHandlers();
        start()
    })();

    function start() {
        Data.getQuestions(function(response) {
            Track.event({
                event: "PatronusQuiz",
                action: "question",
                questionId: response.question.id,
                questionNumber: _current
            });
            newQuestion(response);
            _question = response.question
        })
    }

    function newQuestion(question) {
        if (_timeout) {
            clearTimeout(_timeout)
        }
        _this.answerReceived = false;
        _this.events.fire(QuizEvents.NEW_QUESTION, question)
    }

    function timeout() {
        _this.isTimeout = true;
        Track.stopTimer();
        Track.event({
            event: "PatronusQuiz",
            action: "timedOut",
            questionId: _question.id,
            questionNumber: _current
        });
        Data.timeout(function(question) {
            _this.isTimeout = false;
            _current = question.index + 1;
            Track.event({
                event: "PatronusQuiz",
                action: "question",
                questionId: question.question.id,
                questionNumber: _current
            });
            newQuestion(question);
            _question = question.question
        })
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.ANSWER, answer);
        _this.events.subscribe(QuizEvents.START_QUESTION, startTimer)
    }

    function startTimer() {
        Track.startTimer();
        if (_timeout) {
            clearTimeout(_timeout)
        }
        _timeout = _this.delayedCall(timeout, Config.QUESTION_TIME)
    }

    function answer(e) {
        if (_this.answerReceived || _this.isTimeout) {
            return
        }
        _this.answerReceived = true;
        Track.event({
            event: "PatronusQuiz",
            action: "answer",
            answerText: e.answer,
            answerId: e.id,
            questionId: _question.id,
            elapsedTime: Track.stopTimer()
        });
        if (!Tests.useFallback()) {
            AudioController.successfulAnswer()
        }
        Data.submitAnswer(e.id, function(response) {
            if (response.completed === true) {
                if (_timeout) {
                    clearTimeout(_timeout)
                }
                var id = response.result.id;
                Data.Patronus.loadData(id, function(data) {
                    Track.event({
                        event: "PatronusQuiz",
                        action: "patronus",
                        patronusId: id,
                        patronusName: data.name
                    });
                    _this.events.fire(QuizEvents.PATRONUS_RECEIVED, response)
                })
            } else {
                _current = response.index + 1;
                Track.event({
                    event: "PatronusQuiz",
                    action: "question",
                    questionId: response.question.question.id,
                    questionNumber: _current
                });
                newQuestion(response.question);
                _question = response.question.question
            }
        })
    }
    this.resetTimer = startTimer
});
Class(function Patronus(_data, _parentGroup) {
    Inherit(this, Component);
    var _this = this;
    var _animation, _shader, _engine, _particles, _light;
    var _lightSphere;
    var _null = new THREE.Group();
    var _modelInvMatrix = new THREE.Matrix4();
    var _rotationDirection = new THREE.Vector3();
    var USE_PARTICLES = Tests.useGPUParticles();
    this.group = new THREE.Group();
    this.root = new THREE.Group();
    this.center = new THREE.Group();
    Dev.expose("patronus", _this);
    (function() {
        addListeners();
        ParticleEngineThread.instance().load(_data.model, _data.anim, init)
    })();

    function initLight() {
        _light = ForestLighting.instance().getPatronusLight();
        _light.color.set(7131373);
        _light.intensity = 0;
        _this.light = _light;
        ForestLighting.instance().attachPatronusLight(_this.center.children[0])
    }

    function init(geometry) {
        _animation = _this.initClass(PatronusAnimation, geometry, _data, _this.root, _this.center);
        _this.group.add(_animation.mesh);
        _shader = _this.initClass(PatronusMeshShader, _animation.mesh, _data, _modelInvMatrix, _parentGroup.matrixWorld);
        Render.start(loop);
        if (USE_PARTICLES) {
            _particles = _this.initClass(PatronusParticles, geometry, _animation, _rotationDirection, _parentGroup.matrixWorld);
            _this.group.add(_particles.group)
        } else {
            defer(function() {
                _this.events.fire(HydraEvents.READY)
            })
        }
        if (!Config.EMBED) {
            initLight()
        }
        _lightSphere = new THREE.Mesh(new THREE.SphereGeometry(3.5, 20, 20), Patronus.getVolumeLightShader().material);
        _lightSphere.scale.set(0.2, 0.2, 0.2);
        FX.Light.instance().add(_lightSphere, true)
    }

    function loop() {
        _null.rotation.set(0, 0, 0);
        _this.center.children[0].getWorldPosition(_null.position);
        _this.center.children[0].getWorldQuaternion(_null.quaternion);
        _null.updateMatrixWorld();
        _modelInvMatrix.getInverse(_null.matrix);
        _rotationDirection.set(0, 0, -1);
        if (_this.isIntro) {
            _rotationDirection.applyQuaternion(_this.center.children[0].quaternion)
        } else {
            _rotationDirection.applyQuaternion(_this.root.quaternion)
        }
        _this.center.children[0].getWorldPosition(_lightSphere.position);
        _lightSphere.quaternion.copy(World.CAMERA.quaternion);
        if (ForestLakeTile.instance) {
            _lightSphere.position.applyMatrix4(ForestLakeTile.instance.group.matrixWorld)
        }
        _lightSphere.updateMatrixWorld();
        _light.translateMatrix = _parentGroup.matrixWorld
    }

    function addListeners() {
        _this.events.subscribe(ForestWaterShader.RENDER, renderWater)
    }

    function endPosition() {
        _this.animateOut();
        ForestLighting.instance().detachPatronusLight();
        _this.events.unsubscribe(TilingMovement.END_POSITION, endPosition)
    }

    function renderWater(e) {
        if (Global.REACHED_END) {
            _this.group.visible = e.visible
        }
        if (_particles) {
            _particles.group.visible = e.visible
        }
    }
    this.set("tileGroup", function(group) {
        _parentGroup = group;
        if (_particles) {
            _particles.tileMatrix = group.matrixWorld
        }
        _shader.tileMatrix = group.matrixWorld
    });
    this.animateIn = function(skipMesh, slow) {
        if (_particles) {
            _particles.animateIn(!skipMesh || slow)
        } else {
            skipMesh = false
        }
        if (!skipMesh) {
            _shader.animateIn()
        } else {
            _shader.preIn()
        }
        TweenManager.tween(_light, {
            intensity: 7
        }, !skipMesh ? 3000 : 300, "easeOutSine");
        _lightSphere.material.shader.tween("alpha", 1, !skipMesh ? 3000 : 300, "easeOutSine", skipMesh ? 2000 : 0);
        if (!_this.isIntro) {
            _this.events.subscribe(TilingMovement.END_POSITION, endPosition)
        }
        AudioController.patronusAnimateIn()
    };
    this.animateInMesh = function() {
        _shader.animateIn()
    };
    this.intro = function() {
        if (!USE_PARTICLES) {
            return
        }
        if (!_particles) {
            return _this.delayedCall(_this.intro, 100)
        }
        _this.isIntro = true;
        _particles.introParticles();
        _lightSphere.scale.set(1, 1, 1);
        _lightSphere.material.shader.set("intro", 1)
    };
    this.nonCorporeal = function() {
        if (!USE_PARTICLES) {
            return
        }
        if (!_particles) {
            return _this.delayedCall(_this.nonCorporeal, 100)
        }
        _particles.nonCorporeal();
        initLight()
    };
    this.animateOut = function(callback) {
        _particles && _particles.animateOut();
        _shader.animateOut();
        TweenManager.tween(_light, {
            intensity: 0
        }, 700, "easeInSine");
        _this.delayedCall(callback, 1000);
        AudioController.patronusAnimateOut();
        if (!_this.isIntro) {
            _lightSphere.material.shader.tween("alpha", 0, 400, "easeOutSine")
        }
    };
    this.animateOutVolume = function() {
        TweenManager.tween(_lightSphere.scale, {
            x: 0.2,
            y: 0.2,
            z: 0.2
        }, 4000, "easeInOutCubic");
        _lightSphere.material.shader.tween("alpha", 0, 700, "easeInSine", 2000)
    };
    this.stopRender = function() {
        Render.stop(loop);
        _particles && _particles.stopRender();
        _light.translateMatrix = null
    };
    this.onDestroy = function() {
        Render.stop(loop);
        _light.translateMatrix = null;
        FX.Light.instance().removeObject(_lightSphere)
    }
}, function() {
    var _shader;
    Patronus.getVolumeLightShader = function() {
        if (!_shader) {
            _shader = new Shader("PatronusVolumeLight");
            _shader.uniforms = {
                color: {
                    type: "c",
                    value: new THREE.Color(7131373)
                },
                alpha: {
                    type: "f",
                    value: 0
                },
                intro: {
                    type: "f",
                    value: 0
                }
            }
        }
        _shader.material.transparent = true;
        return _shader
    }
});
Class(function Playground() {
    Inherit(this, Controller);
    var _this = this;
    var $container;
    var _view, _camera, _controls;
    (function() {
        Global.PLAYGROUND = true;
        initContainer();
        initThree();
        initView()
    })();

    function initContainer() {
        $container = _this.container;
        $container.size("100%");
        Stage.add($container);
        Global.UIL = new UIL.Gui({
            css: "top: 0; right: 50px;",
            size: 300,
            center: true
        })
    }

    function initThree() {
        World.instance();
        Stage.add(World.ELEMENT);
        _camera = new THREE.PerspectiveCamera(45, Stage.width / Stage.height, 0.1, 1000);
        _camera.position.set(0, 0, 2);
        _controls = Hardware.ACTIVE_VR ? new THREE.VRControls(_camera) : new THREE.OrbitControls(_camera);
        Render.start(_controls.update);
        if (Hardware.ACTIVE_VR) {
            var group = new THREE.Group();
            group.add(_camera);
            group.position.y = 1.5;
            group.position.z = -20;
            World.SCENE.add(group);
            World.instance().setCamera(_camera)
        }
    }

    function initView() {
        var hash = Hydra.HASH.split("/")[1].split("?")[0];
        var view = "Playground" + hash;
        if (!hash) {
            throw "No view for Playground found on Hash"
        }
        if (!window[view]) {
            view = hash
        }
        if (!window[view]) {
            throw "No Playground class " + view + " found."
        }
        _view = _this.initClass(window[view], World.instance().camera);
        World.SCENE.add(_view.group || _view.object3D)
    }
    this.resetCamera = function() {
        World.instance().setCamera(_camera)
    }
}, "singleton");
Class(function World() {
    Inherit(this, Component);
    var _this = this;
    var _renderer, _scene, _camera, _controls, _effect, _vfx;
    var _perf = new RenderPerformance();
    World.DPR = Tests.getDPR();
    (function() {
        initWorld();
        addHandlers();
        Render.start(loop);
        _perf.enabled = false;
        _this.delayedCall(function() {
            _perf.enabled = true
        }, 3000)
    })();

    function initWorld() {
        _renderer = new THREE.WebGLRenderer({
            antialias: Tests.antialias()
        });
        _renderer.setPixelRatio(World.DPR);
        _renderer.setSize(Stage.width, Stage.height);
        _renderer.setClearColor(0);
        if (Tests.renderShadows()) {
            _renderer.shadowMap.enabled = true;
            _renderer.shadowMap.autoUpdate = false;
            _renderer.shadowMap.needsUpdate = true
        }
        _scene = new THREE.Scene();
        _camera = Camera.instance().worldCamera;
        _camera.position.z = 1;
        World.SCENE = _scene;
        World.RENDERER = _renderer;
        World.ELEMENT = _renderer.domElement;
        World.CAMERA = _camera;
        ForestLighting.instance();
        if (Hardware.ACTIVE_VR) {}
        _vfx = _this.initClass(VFX, _renderer, _scene);
        _effect = new THREE.VREffect(_renderer);
        _effect.onRenderEye = _vfx.onRenderEye;
        if (!Hardware.ACTIVE_VR && !Tests.embedded()) {
            _scene.add(Ethereal.instance().group)
        }
        _scene.add(ForestBG.instance().group)
    }

    function loop(t, dt) {
        _perf.time();
        _effect.render(_scene, _camera);
        _perf.time();
        if (Mobile.os == "Android" && _perf.enabled && World.DPR > 1 && _perf.averageFPS < 30) {
            if (!_perf.dropped) {
                _perf.dropped = 0
            }
            _perf.dropped++;
            if (_perf.dropped > 30) {
                dropDPR()
            }
        }
        if (Record.loop) {
            Record.loop(_renderer)
        }
    }

    function dropDPR() {
        World.DPR = 1;
        _renderer.setPixelRatio(1);
        _renderer.setSize(Stage.width, Stage.height);
        _this.events.fire(World.DROP_DPR)
    }

    function addHandlers() {
        _this.events.subscribe(HydraEvents.RESIZE, resize);
        if (Hardware.ACTIVE_VR) {
            Stage.bind("click", click)
        }
    }

    function click() {
        _effect.requestPresent()
    }

    function resize() {
        _renderer.setSize(Stage.width, Stage.height);
        _camera.aspect = Stage.width / Stage.height;
        _camera.updateProjectionMatrix()
    }
    this.setCamera = function(camera) {
        _camera = camera;
        World.CAMERA = camera;
        _this.events.fire(PatronusEvents.CAMERA_CHANGE)
    };
    this.forceRender = function() {}
}, function() {
    var _instance;
    World.instance = function() {
        if (!_instance) {
            _instance = new World()
        }
        return _instance
    };
    World.DROP_DPR = "drop_dpr"
});
Class(function CompletedView() {
    Inherit(this, View);
    var _this = this;
    var _share, _back;
    var $this, $result, $share, $castText, $shadow;
    var _text;
    var _first = false;
    var _animated = false;
    (function() {
        Data.Patronus.getData(Data.User.getPatronus(), function() {
            initHTML();
            style();
            resize();
            addListeners()
        })
    })();

    function initHTML() {
        $this = _this.element;
        _text = _this.initClass(UICopy, {
            text: Copy.get("INTRODUCTION", "completed"),
            size: 21
        });
        $castText = Stage.create("CastText");
        $result = $this.create(".result");
        $shadow = $this.create(".shadow");
        $share = $this.create(".share");
        _share = _this.initClass(ShareBtns)
    }

    function style() {
        $this.css({
            color: "#fff",
            textAlign: "center",
        });
        _back = _this.initClass(UIButton, {
            width: 200,
            height: 64,
            text: Copy.get("INTRODUCTION", "backProfile"),
            size: 9
        });
        _back.css({
            top: "",
            bottom: 0,
            marginTop: ""
        });
        _text.element.css({
            width: 260,
            margin: "0 auto 20px auto",
            height: 110
        });
        var text = Data.Patronus.getData(Data.User.getPatronus()).name;
        var size = Utils.convertRange(text.length, 10, 30, 45, 20, true);
        $result.fontStyle("Magorian", size, "#fff");
        $result.css({
            top: 60,
            opacity: 0,
            textAlign: "center",
            lineHeight: size,
            whiteSpace: "nowrap",
            color: "white",
            zIndex: 10
        });
        $result.text(text);
        $shadow.bg(Config.CDN + "assets/images/ui/text-shadow.png").css({
            backgroundPosition: "center center",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            zIndex: 0
        });
        defer(function() {
            var width = $result.div.clientWidth;
            var height = $result.div.clientHeight;
            $result.css({
                width: width,
                left: "50%",
                marginLeft: -(width / 2)
            });
            $shadow.css({
                width: width * 1.25,
                height: height * 1.5,
                left: "50%",
                marginLeft: -(width * 1.25) / 2,
                top: 50,
                opacity: 0
            })
        });
        $castText.fontStyle("Roboto", 10, "#fff");
        $castText.size(400, 30).center().css({
            textAlign: "center",
            lineHeight: 18,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            opacity: 0.5
        });
        var text = Device.mobile ? Copy.get("CAST_PROMPT_MOBILE") : Copy.get("CAST_PROMPT_DESKTOP");
        $castText.html(text);
        $castText.css({
            opacity: 0
        }).tween({
            opacity: 0.9
        }, 2000, "easeInOutSine");
        _share.css({
            opacity: 0
        });
        $share.fontStyle("Roboto", 9, "#fff");
        $share.css({
            opacity: 0,
            display: "block",
            lineHeight: 16,
            letterSpacing: 2.5,
            textTransform: "uppercase"
        });
        $share.html("SHARE")
    }

    function animateIn() {
        if (_this.visible) {
            return
        }
        _this.visible = true;
        _text.animateIn();
        _this.delayedCall(_back.animateIn, 2000);
        $result.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 2000, "easeInOutSine", 1300);
        $shadow.css({
            opacity: 0
        }).tween({
            opacity: 0.2
        }, 2000, "easeInOutSine", 1300);
        $share.css({
            opacity: 0
        }).tween({
            opacity: 0.8
        }, 1000, "easeInOutSine", 1500);
        _share.element.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 1000, "easeInOutSine", 1500)
    }

    function addListeners() {
        _back.events.add(HydraEvents.CLICK, finished);
        _this.events.subscribe(ForestReveal.CAST, removeCastText);
        _this.events.subscribe(ForestReveal.RECAST, showCastText);
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function removeCastText() {
        if (!_first) {
            _first = true;
            _this.delayedCall(animateIn, 1750)
        } else {
            animateIn()
        }
        if ($castText) {
            if (Device.browser.ie) {
                $castText.css({
                    opacity: 0
                })
            } else {
                $castText.tween({
                    opacity: 0
                }, 400, "easeOutSine")
            }
            _animated = false
        }
        if (Mobile.phone || Stage.width <= 768 || (Mobile.tablet && Stage.width <= 768)) {
            $this.tween({
                opacity: 1
            }, 800, "easeInOutSine", 500)
        }
    }

    function showCastText() {
        if ($castText) {
            if (Device.browser.ie) {
                $castText.css({
                    opacity: 0.9
                })
            } else {
                $castText.tween({
                    opacity: 0.9
                }, 400, "easeOutSine")
            }
        }
        if (Mobile.phone || Stage.width <= 768 || (Mobile.tablet && Stage.width <= 768)) {
            $this.tween({
                opacity: 0
            }, 400, "easeOutSine")
        }
        _animated = true
    }

    function finished() {
        window.location = Config.PROFILE_URL
    }

    function resize() {
        if (!Device.mobile || Stage.width > Stage.height) {
            $this.size(300, Device.mobile ? 270 : 290).center(0, 1).css({
                left: Mobile.phone ? 20 : "10%",
                marginLeft: 0
            });
            _share.css({
                left: 0,
                right: 0,
                margin: "auto",
                position: "relative",
                display: "block",
                bottom: "auto"
            });
            $share.css({
                margin: "30px auto 10px auto",
                position: "relative",
                width: "auto",
                bottom: "auto"
            });
            if (!Device.phone) {
                $this.css({
                    opacity: 1
                })
            }
        } else {
            var offset = Stage.height >= 720 ? Utils.range(Stage.height, 720, 1068, 200, 500, true) : Utils.range(Stage.height, 400, 720, 100, 50, true);
            var height = Stage.height - offset;
            $this.size(300, height).center(1, 1);
            $share.css({
                margin: "auto",
                position: "absolute",
                bottom: 110,
                width: "100%",
                textAlign: "center"
            });
            _share.css({
                left: 0,
                right: 0,
                margin: "auto",
                position: "absolute",
                display: "block",
                bottom: 80
            });
            if (!Mobile.phone) {
                if (_animated) {
                    $this.css({
                        opacity: 0
                    })
                } else {
                    $this.css({
                        opacity: 1
                    })
                }
            }
        }
    }
});
Class(function IntroLoginPrompt() {
    Inherit(this, View);
    var _this = this;
    var $this, $or;
    var _iframe, _text, _login, _register;
    (function() {
        initHTML();
        style();
        resize();
        addHandlers();
        _this.delayedCall(animateIn, 7000)
    })();

    function initHTML() {
        $this = _this.element;
        $or = $this.create("text");
        _text = _this.initClass(UICopy, {
            text: Copy.get("INTRODUCTION", "notLoggedIn"),
            size: 34
        });
        _login = _this.initClass(UIButton, {
            width: 200,
            height: 70,
            text: Copy.get("INTRODUCTION", "login"),
            size: 11
        });
        _register = _this.initClass(UIButton, {
            width: 200,
            height: 70,
            text: Copy.get("INTRODUCTION", "join"),
            size: 11
        })
    }

    function style() {
        $this.invisible();
        $or.html(Copy.get("INTRODUCTION", "or"));
        $or.fontStyle("Roboto", 10, "#fff").css({
            width: "100%",
            textAlign: "center",
            letterSpacing: 2.4,
            opacity: 0.9,
            textTransform: "uppercase",
            whiteSpace: "nowrap"
        })
    }

    function animateIn() {
        $this.visible();
        _text.animateIn();
        _this.delayedCall(_login.animateIn, 900);
        $or.css({
            opacity: 0
        }).tween({
            opacity: 0.9
        }, 500, "easeOutSine", 1600);
        _this.delayedCall(_register.animateIn, 1500)
    }

    function animateOut() {
        _login.animateOut();
        _register.animateOut();
        $or.tween({
            opacity: 0
        }, 300, "easeOutSine");
        _text.element.tween({
            opacity: 0
        }, 500, "easeOutSine")
    }

    function initIframe(mode) {
        _iframe = _this.initClass(IframeView, {
            mode: mode
        }, [Stage])
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.CLOSE_IFRAME, closeIframe);
        _this.events.subscribe(QuizEvents.OPEN_LOGIN_IFRAME, login);
        _this.events.subscribe(QuizEvents.OPEN_JOIN_IFRAME, join);
        _login.events.add(HydraEvents.CLICK, login);
        _register.events.add(HydraEvents.CLICK, join);
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function login() {
        if (_iframe) {
            return
        }
        Track.event({
            event: "PatronusQuiz",
            action: "login"
        });
        animateOut();
        _this.events.fire(QuizEvents.VERIFY);
        _this.events.subscribe(QuizEvents.STATUS_CHECKED, initLogin);
        if (Mobile.os == "Android" && !location.hostname.strpos("local")) {
            Mobile.setOrientation("portrait")
        }
    }

    function initLogin() {
        _this.events.unsubscribe(QuizEvents.STATUS_CHECKED, initLogin);
        initIframe("login")
    }

    function join() {
        if (_iframe) {
            return
        }
        Track.event({
            event: "PatronusQuiz",
            action: "join"
        });
        animateOut();
        _this.events.fire(QuizEvents.VERIFY);
        _this.events.subscribe(QuizEvents.STATUS_CHECKED, initJoin);
        if (Mobile.os == "Android" && !location.hostname.strpos("local")) {
            Mobile.setOrientation("portrait")
        }
    }

    function initJoin() {
        _this.events.unsubscribe(QuizEvents.STATUS_CHECKED, initJoin);
        initIframe("join")
    }

    function closeIframe() {
        if (!_iframe) {
            return
        }
        _iframe = _iframe.destroy();
        _this.events.subscribe(QuizEvents.STATUS_CHECKED, reshowLogin)
    }

    function reshowLogin() {
        _this.events.unsubscribe(QuizEvents.STATUS_CHECKED, reshowLogin);
        animateIn()
    }

    function resize() {
        if (!Device.mobile || Stage.width > Stage.height) {
            $this.size(360, Device.mobile ? 150 : 200).center().css({
                top: "44%"
            });
            _login.css({
                top: 90,
                left: "50%",
                marginLeft: -230
            });
            _register.css({
                top: 90,
                left: "50%",
                marginLeft: 30
            });
            $or.css({
                top: 85
            });
            _text.text.css({
                fontSize: "34px"
            })
        } else {
            $this.size(200, 300).center();
            _login.css({
                top: 140,
                left: "50%",
                marginLeft: -100
            });
            _register.css({
                top: 240,
                left: "50%",
                marginLeft: -100
            });
            $or.css({
                top: 184
            });
            _text.text.css({
                fontSize: "33px"
            })
        }
    }
});
Class(function IntroQuote() {
    Inherit(this, Component);
    var _this = this;
    var _mask, _isPortrait;
    var _frustum = {
        height: Stage.height,
        width: Stage.width
    };
    var _mouse = new THREE.Vector3();
    var _mouseLast = new THREE.Vector3();
    var _mouseDiff = new THREE.Vector3();
    var _vel = 0;
    var _dist = 50;
    var _lines = [];
    this.group = new THREE.Group();
    (function() {
        initMesh();
        initMask();
        _this.delayedCall(animateIn, Global.INIT_LOGGED_IN ? 7000 : 3000);
        Mouse.capture();
        Render.start(loop)
    })();

    function initMesh() {
        _isPortrait = Tests.mobilePortrait();
        var text;
        if (_isPortrait) {
            text = [
                [0, Copy.get("QUOTE_MOBILE_LINE1")],
                [0, Copy.get("QUOTE_MOBILE_LINE2")],
                [0, Copy.get("QUOTE_MOBILE_LINE3")],
                [0, Copy.get("QUOTE_MOBILE_LINE4")],
                [100, Copy.get("QUOTE_MOBILE_LINE5")],
                [200, "- " + Copy.get("QUOTE_AUTHOR")],
            ]
        } else {
            text = [
                [50, Copy.get("QUOTE_LINE1")],
                [-150, Copy.get("QUOTE_LINE2")],
                [0, Copy.get("QUOTE_LINE3")],
                [490, "- " + Copy.get("QUOTE_AUTHOR")],
            ]
        }
        text.forEach(function(text, i) {
            var line = initLine(text, i);
            _lines.push(line)
        });
        _this.group.target = new THREE.Vector3();
        _this.group.position.set(3, _isPortrait ? 10 : 8, 10);
        _this.group.rotation.y = 3.3;
        World.SCENE.add(_this.group)
    }

    function initLine(data, i) {
        var text = _this.initClass(WebGLText, {
            font: "magorian-bold",
            image: "assets/images/fonts/magorian-bold.png",
            vs: "Quote",
            fs: "Quote",
            text: data[1],
            width: 1500,
            align: "center",
            letterSpacing: 0,
            color: "#fff",
            opacity: 1,
        });
        var s = 0.018;
        text.mesh.position.set(data[0] * s, -i * 90 * s, 0);
        if (i == (_isPortrait ? 5 : 3)) {
            s *= 0.8
        }
        text.mesh.scale.set(s, s, s);
        text.mesh.rotation.y = Math.PI;
        text.mesh.frustumCulled = false;
        var shader = text.shader;
        shader.uniforms.fWipe = {
            type: "f",
            value: 0
        };
        shader.uniforms.fTime = {
            type: "f",
            value: 0
        };
        shader.uniforms.fAlpha = {
            type: "f",
            value: 0
        };
        shader.uniforms.fTransition = {
            type: "f",
            value: 0
        };
        shader.uniforms.fVel = {
            type: "f",
            value: 1
        };
        shader.uniforms.uMouse = {
            type: "v3",
            value: new THREE.Vector3()
        };
        _this.group.add(text.mesh);
        return text
    }

    function initMask() {
        var geometry = Utils3D.loadBufferGeometry("tree-mask");
        var material = new THREE.MeshBasicMaterial({
            color: "#000"
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -2.5;
        mesh.position.x = 2.5;
        FX.Fog.instance().add(mesh);
        FX.Fog.instance().addGround(mesh);
        FX.Light.instance().add(mesh);
        _mask = new THREE.Group();
        _mask.mesh = mesh;
        _mask.add(mesh);
        World.SCENE.add(_mask)
    }

    function animateIn() {
        var readTime = 12000;
        _lines.forEach(function(text) {
            text.shader.tween("fTransition", 1, 2000, "linear", 900);
            text.shader.tween("fAlpha", 1, 1500, "linear", 1200);
            TweenManager.tween(_mask.mesh.position, {
                x: -2.5
            }, 3500, "linear", readTime);
            text.shader.tween("fWipe", 1, 1500, "linear", readTime + 1000)
        })
    }

    function updateMousePosition() {
        calculateFrustum();
        _mouse.x = 2 * (Mouse.x / Stage.width) - 1;
        _mouse.y = -2 * (Mouse.y / Stage.height) + 1;
        _mouse.x *= _frustum.width * 0.5;
        _mouse.y *= _frustum.height * 0.5;
        _mouse.z = -_dist;
        World.CAMERA.localToWorld(_mouse);
        var lerp = 0.04;
        if (Device.mobile) {
            _mouseDiff.copy(_mouse).sub(_mouseLast);
            var newVel = _mouseDiff.length();
            if (newVel > 8) {
                newVel = 0
            }
            _vel += (newVel - _vel) * (newVel > _vel ? 0.2 : 0.05);
            _mouseLast.copy(_mouse)
        }
        _lines.forEach(function(text) {
            text.shader.uniforms.uMouse.value.lerp(_mouse, lerp);
            if (Device.mobile) {
                text.shader.uniforms.fVel.value = _vel
            }
        })
    }

    function calculateFrustum() {
        _dist = _this.group.position.distanceTo(World.CAMERA.position);
        _frustum.height = 2 * _dist * Math.tan((World.CAMERA.fov * Math.PI / 180) * 0.5);
        _frustum.width = _frustum.height * (Stage.width / Stage.height)
    }

    function loop(t, dt) {
        _mask.position.copy(World.CAMERA.position);
        _mask.quaternion.copy(World.CAMERA.quaternion);
        _lines.forEach(function(text) {
            text.shader.set("fTime", dt * 0.0005)
        });
        updateMousePosition()
    }
    this.animateOut = function() {
        World.SCENE.remove(_this.group)
    };
    this.onDestroy = function() {
        Render.stop(loop);
        World.SCENE.remove(_this.group);
        World.SCENE.remove(_mask);
        FX.Fog.instance().removeObject(_mask.mesh);
        FX.Light.instance().removeObject(_mask.mesh)
    }
});
Class(function IntroReadyText() {
    Inherit(this, Component);
    var _this = this;
    var _text, _shader, _mesh;
    this.group = new THREE.Group();
    (function() {
        initMesh();
        Render.start(loop)
    })();

    function initMesh() {
        _text = _this.initClass(WebGLText, {
            font: "magorian-bold",
            image: "assets/images/fonts/magorian-bold.png",
            vs: "QuizComment",
            fs: "QuizComment",
            text: Copy.get("READY_TEXT"),
            width: 1100,
            align: "center",
            letterSpacing: 0,
            color: "#fff",
            opacity: 1,
        });
        var s = 0.008;
        _text.mesh.scale.set(s, s, s);
        _text.mesh.position.set(6, 1, 0);
        _text.mesh.frustumCulled = false;
        _shader = _text.shader;
        _shader.uniforms.fTime = {
            type: "f",
            value: 0
        };
        _shader.uniforms.fAlpha = {
            type: "f",
            value: 0
        };
        _shader.uniforms.fTransition = {
            type: "f",
            value: 0
        };
        _shader.tween("fTransition", 1, 2000, "linear", 900);
        _shader.tween("fAlpha", 1, 1500, "linear", 1200);
        _this.delayedCall(function() {
            _shader.tween("fTransition", 0, 2000, "easeInSine", function() {
                if (typeof _this.onComplete == "function") {
                    _this.onComplete()
                }
            });
            _shader.tween("fAlpha", 0, 1000, "linear", 1000)
        }, 3300);
        TweenManager.tween(_text.mesh.position, {
            x: -7,
            y: 3,
            z: 30
        }, 1500 + 4000 + 1500, "easeInSine", 1200);
        _mesh = _text.mesh;
        _this.group.add(_mesh);
        _this.group.target = new THREE.Vector3();
        World.SCENE.add(_this.group)
    }

    function loop(t, dt) {
        _shader.set("fTime", dt * 0.001)
    }
    this.animateOut = function() {
        World.SCENE.remove(_this.group)
    };
    this.onDestroy = function() {
        Render.stop(loop);
        World.SCENE.remove(_this.group)
    }
});
Class(function IntroStartPrompt() {
    Inherit(this, View);
    var _this = this;
    var $this, $text, $wrapper, $line1, $line2, $sub, $startPrompt;
    var _button, _letters;
    (function() {
        initHTML();
        style();
        addHandlers();
        resize();
        _this.delayedCall(animateIn, Global.INIT_LOGGED_IN ? 24000 : 19000)
    })();

    function initHTML() {
        $this = _this.element;
        $wrapper = $this.create("wrapper");
        $text = $wrapper.create("StartText");
        $line1 = $wrapper.create("line");
        $line2 = $wrapper.create("line");
        $sub = $this.create("sub");
        $startPrompt = $this.create("StartPrompt")
    }

    function style() {
        $this.size(650, Mobile.phone ? 215 : 230).center().invisible().enable3D(1000).css({
            marginTop: Mobile.phone ? -130 : -150
        });
        $wrapper.size("100%").transformPoint("50%", "30%");
        $text.fontStyle("Magorian", 74, "#fff");
        $text.css({
            width: "100%",
            textAlign: "center",
            whiteSpace: "nowrap",
            height: 80
        }).enable3D();
        $text.html(Copy.get("INTRODUCTION", "title"));
        _letters = SplitTextfield.split($text);
        $sub.fontStyle("Roboto", Mobile.phone ? 9 : 10, "#fff");
        $sub.css({
            width: "100%",
            textAlign: "center",
            top: Mobile.phone ? 90 : 100,
            lineHeight: Mobile.phone ? 14 : 16,
            letterSpacing: 2,
            opacity: 0.9,
            textTransform: "uppercase",
            whiteSpace: "nowrap"
        });
        $sub.html(Copy.get("INTRODUCTION", "subtitle"));
        _button = _this.initClass(UIButton, {
            width: 180,
            height: 70,
            text: Copy.get("INTRODUCTION", "start"),
            size: 12
        });
        _button.css({
            top: "",
            marginTop: 0,
            bottom: 0
        })
    }

    function animateIn() {
        $this.visible().css({
            opacity: 0.5
        }).tween({
            opacity: 1
        }, 4000, "easeInOutSine", function() {
            $this.stopTween().clearTransform().clearAlpha()
        });
        AudioController.onIntroTitleIn();
        var delay = 0;
        for (var i = 0; i < _letters.length; i++) {
            (function(letter) {
                letter.transform({
                    y: 80,
                    rotationY: -90
                }).css({
                    opacity: 0
                }).tween({
                    y: 0,
                    rotationY: 0,
                    opacity: 1
                }, 5000, "easeOutQuint", delay, function() {
                    letter.stopTween().clearTransform().clearAlpha()
                })
            })(_letters[i]);
            delay += 100;
            if (_letters[i].text().length > 2) {
                delay += 200
            }
        }
        $sub.css({
            opacity: 0
        }).tween({
            opacity: 0.8
        }, 2000, "easeInOutSine", 3000);
        _this.delayedCall(_button.animateIn, 3500)
    }

    function addHandlers() {
        _button.events.add(HydraEvents.CLICK, start);
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function start() {
        Track.event({
            event: "PatronusQuiz",
            action: "start"
        });
        for (var i = 0; i < _letters.length; i++) {
            _letters[i].tween({
                y: 40,
                opacity: 0
            }, 900, "easeInCubic", i * 20)
        }
        $sub.tween({
            opacity: 0
        }, 500, "easeOutSine");
        _this.events.fire(QuizEvents.START_QUIZ)
    }

    function resize() {
        $wrapper.scale = Utils.convertRange(Stage.width, 200, 800, 0.3, 1, true);
        if (Mobile.phone && Stage.width > Stage.height) {
            $wrapper.scale = 0.6
        }
        $wrapper.transform()
    }
    this.onDestroy = function() {}
});
Class(function IntroVerifyPrompt() {
    Inherit(this, View);
    var _this = this;
    var $this, $text, $verifyPrompt;
    var _button;
    (function() {
        initHTML();
        style();
        resize();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $text = $this.create("VerifyText");
        $verifyPrompt = $this.create("VerifyPrompt")
    }

    function style() {
        $this.css({
            position: "static",
            color: "#fff",
            textAlign: "center",
        });
        $text.fontStyle("Magorian", 30, "#fff");
        $text.html(Copy.get("INTRODUCTION", "verifyMessage")).css({
            left: 0,
            right: 0,
            bottom: "50%",
            margin: "auto",
        });
        _button = _this.initClass(UIButton, {
            width: 240,
            height: 70,
            text: Copy.get("INTRODUCTION", "verify")
        });
        _button.css({
            marginTop: -10
        });
        _this.delayedCall(_button.animateIn, 200)
    }

    function addHandlers() {
        _button.events.add(HydraEvents.CLICK, verify);
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function verify() {
        Track.event({
            event: "PatronusQuiz",
            action: "verify"
        });
        _this.events.fire(QuizEvents.VERIFY);
        _this.events.subscribe(QuizEvents.UNVERIFIED, resetButton)
    }

    function resetButton() {
        _this.events.unsubscribe(QuizEvents.UNVERIFIED, resetButton);
        _button.animateIn()
    }

    function resize() {
        if (!Device.mobile || Stage.width > Stage.height) {
            $text.size(320, 200).center();
            $text.css({
                fontSize: "30px"
            })
        } else {
            $text.size(300, 200).center();
            $text.css({
                fontSize: "26px"
            })
        }
    }
});
Class(function IntroView() {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _startPrompt, _verifyPrompt, _loginPrompt, _raycaster;
    var _login = false;
    (function() {
        initHTML();
        initRaycaster();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $this.css({
            position: "static"
        })
    }

    function initRaycaster() {
        _raycaster = _this.initClass(Raycaster, World.CAMERA)
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.LOGGED_OUT, showLoginPrompt);
        _this.events.subscribe(QuizEvents.UNVERIFIED, showVerifyPrompt);
        _this.events.subscribe(QuizEvents.LOGGED_IN, showStartPrompt)
    }

    function showLoginPrompt() {
        if (_loginPrompt) {
            return
        }
        Track.event({
            event: "PatronusQuiz",
            action: "view",
            loggedIn: false
        });
        _loginPrompt = _this.initClass(IntroLoginPrompt);
        _login = true
    }

    function showVerifyPrompt() {
        if (_verifyPrompt) {
            return
        }
        removeLoginPrompt();
        _verifyPrompt = _this.initClass(IntroVerifyPrompt)
    }

    function showStartPrompt() {
        if (_startPrompt) {
            return
        }
        _this.initClass(IntroQuote);
        if (!_login) {
            Track.event({
                event: "PatronusQuiz",
                action: "view",
                loggedIn: true
            })
        }
        removeLoginPrompt();
        removeVerifyPrompt();
        _startPrompt = _this.initClass(IntroStartPrompt)
    }

    function removeLoginPrompt() {
        if (!_loginPrompt) {
            return
        }
        _loginPrompt.element.tween({
            opacity: 0,
            scale: 0.85
        }, 500, "easeInCubic", function() {
            if (_loginPrompt) {
                _loginPrompt = _loginPrompt.destroy()
            }
        })
    }

    function removeVerifyPrompt() {
        if (!_verifyPrompt) {
            return
        }
        _verifyPrompt.element.tween({
            opacity: 0,
            scale: 0.85
        }, 500, "easeInCubic", function() {
            if (_verifyPrompt) {
                _verifyPrompt = _verifyPrompt.destroy()
            }
        })
    }
});
Class(function QuizAnswer(_data, _perc) {
    Inherit(this, Component);
    var _this = this;
    var _text, _shader, _scale;
    var _spacing = 5;
    var _light = new THREE.Vector3(0, 0, 30);
    var _pos = new THREE.Vector3();
    this.lightColor = new THREE.Color(5259384);
    (function() {
        initMesh();
        addHandlers();
        resize()
    })();

    function initMesh() {
        _text = _this.initClass(WebGLText, {
            font: "magorian",
            image: "assets/images/fonts/magorian.png",
            vs: "QuizAnswers",
            fs: "QuizAnswers",
            text: _data.answer,
            width: 2000,
            align: "center",
            letterSpacing: 1,
            color: "#fff",
            opacity: 1,
        });
        var s = 0.01;
        _text.mesh.scale.set(s, s, s);
        _text.mesh.rotation.y = Math.PI;
        _scale = s;
        _shader = _text.shader;
        _shader.uniforms.lightColor = {
            type: "c",
            value: _this.lightColor
        };
        _shader.uniforms.lightPos = {
            type: "v3",
            value: _light
        };
        _shader.uniforms.transition = {
            type: "f",
            value: 0
        };
        _shader.uniforms.darken = {
            type: "f",
            value: 1
        };
        _shader.uniforms.tMask = {
            type: "t",
            value: Utils3D.getTexture("assets/images/text/reveal.jpg")
        };
        _this.mesh = _text.mesh;
        _this.mesh.answer = _this;
        _this.text = _data.answer
    }

    function addHandlers() {
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function resize() {
        if (Tests.mobilePortrait()) {
            _pos.y = _perc * _spacing * 0.5;
            _pos.x = 0
        } else {
            _pos.y = 0;
            _pos.x = _perc * _spacing
        }
        _text.mesh.position.copy(_pos)
    }
    this.animateIn = function(delay) {
        Camera.instance().adjustLerp(0.7);
        _this.mesh.position.y = _pos.y - 0.6;
        _this.mesh.position.multiTween = true;
        _shader.tween("transition", 1, 1500, "easeOutSine", delay);
        TweenManager.tween(_this.mesh.position, {
            y: _pos.y
        }, 1000, "easeOutQuart", delay)
    };
    this.animateOut = function(delay, clicked, callback) {
        Stage.div.style.removeProperty("cursor");
        Camera.instance().adjustLerp(1);
        if (_this.clicked) {
            delay += 1200
        }
        _shader.tween("transition", 0, 500, "easeOutSine", delay);
        TweenManager.tween(_this.mesh.position, {
            y: _this.clicked ? _pos.y + 0.6 : _pos.y - 0.6
        }, 1000, "easeInOutQuart", delay, callback)
    };
    this.over = function() {
        Stage.css({
            cursor: "pointer"
        });
        TweenManager.tween(_this.mesh.scale, {
            x: _scale * 1.1,
            y: _scale * 1.1,
            z: _scale * 1.1
        }, 300, "easeOutCubic");
        _shader.tween("darken", 1.5, 500, "easeOutSine")
    };
    this.out = function() {
        Stage.div.style.removeProperty("cursor");
        TweenManager.tween(_this.mesh.scale, {
            x: _scale,
            y: _scale,
            z: _scale
        }, 600, "easeOutCubic");
        _shader.tween("darken", 0.8, 500, "easeOutSine")
    }
});
Class(function QuizComment(_data) {
    Inherit(this, Component);
    var _this = this;
    var _text, _shader, _mesh;
    this.group = new THREE.Group();
    (function() {
        initMesh();
        Render.start(loop)
    })();

    function initMesh() {
        _text = _this.initClass(WebGLText, {
            font: "magorian-bold",
            image: "assets/images/fonts/magorian-bold.png",
            vs: "QuizComment",
            fs: "QuizComment",
            text: Tests.mobilePortrait() ? _data.replace("\n", " ") : _data,
            width: Tests.mobilePortrait() ? 700 : 1500,
            align: "center",
            letterSpacing: 0,
            color: "#fff",
            opacity: 1,
        });
        var s = 0.0045;
        _text.mesh.scale.set(s, s, s);
        _text.mesh.position.set(0, -2.5, -12);
        _text.mesh.rotation.y = Math.PI;
        _text.mesh.frustumCulled = false;
        _shader = _text.shader;
        _shader.material.depthTest = false;
        _shader.material.depthWrite = false;
        _text.mesh.renderOrder = 100;
        _shader.uniforms.fTime = {
            type: "f",
            value: 0
        };
        _shader.uniforms.fAlpha = {
            type: "f",
            value: 0
        };
        _shader.uniforms.fTransition = {
            type: "f",
            value: 0
        };
        _shader.tween("fTransition", 1, 2000, "linear", 900);
        _shader.tween("fAlpha", 1, 1500, "linear", 1200);
        AudioController.onMessageIn();
        _this.delayedCall(function() {
            _shader.tween("fTransition", 0, 3000, "easeInSine");
            _shader.tween("fAlpha", 0, 1500, "linear", 500)
        }, 6000);
        _mesh = _text.mesh;
        _this.group.add(_mesh);
        _this.group.target = new THREE.Vector3();
        World.SCENE.add(_this.group)
    }

    function loop(t, dt) {
        _this.group.position.lerp(World.CAMERA.position, 0.3);
        _this.group.quaternion.slerp(World.CAMERA.quaternion, 0.3);
        _shader.set("fTime", dt * 0.001)
    }
    this.animateOut = function() {
        World.SCENE.remove(_this.group)
    };
    this.onDestroy = function() {
        Render.stop(loop);
        World.SCENE.remove(_this.group)
    }
});
Class(function QuizQuestion(_data, _raycaster) {
    Inherit(this, View);
    var _this = this;
    var _comment, _over;
    var _answers = [];
    var _hitObjects = [];
    var _completed;
    this.group = new THREE.Group();
    var _offset = new THREE.Group();
    (function() {
        initAnswers();
        if (_data.copy && _data.copy.length) {
            initComment()
        }
    })();

    function initAnswers() {
        _this.group.add(_offset);
        _offset.position.set(0, 0, -3.5);
        var segment = 1 / _data.question.answers.length;
        _data.question.answers.forEach(function(data, i) {
            var answer = _this.initClass(QuizAnswer, data, (i * segment + 0.5 * segment) * 2 - 1);
            _offset.add(answer.mesh);
            _answers.push(answer);
            _hitObjects.push(answer.mesh);
            answer.mesh.patronusid = data.id
        })
    }

    function initComment() {
        _comment = _this.initClass(QuizComment, _data.copy)
    }

    function addHandlers() {
        if (Device.mobile) {
            Stage.bind("touchstart", click)
        } else {
            Stage.bind("click", click);
            Stage.bind("touchmove", touchMove)
        }
    }

    function click() {
        var hit = _raycaster.checkHit(_hitObjects);
        if (!hit.length) {
            return
        }
        hit[0].object.answer.clicked = true;
        _this.events.fire(QuizEvents.ANSWER, {
            id: hit[0].object.patronusid,
            answer: hit[0].object.answer.text
        });
        AudioController.onQuestionClick();
        _this.animateOut()
    }

    function touchMove() {
        var hit = _raycaster.checkHit(_hitObjects);
        if (!hit.length) {
            if (_over) {
                _over.out();
                AudioController.onQuestionOut();
                _over = null
            }
            return
        }
        var obj = hit[0].object.answer;
        if (_over) {
            if (_over != obj) {
                _over.out();
                obj.over();
                AudioController.onQuestionOver();
                _over = obj
            }
        } else {
            _over = obj;
            obj.over();
            AudioController.onQuestionOver()
        }
    }
    this.onDestroy = function() {
        World.SCENE.remove(_this.group)
    };
    this.place = function(e) {
        World.SCENE.add(_this.group);
        _this.group.position.copy(e.lookAt);
        _this.group.lookAt(e.pos)
    };
    this.start = function() {
        if (_comment) {
            _comment.animateOut()
        }
        addHandlers();
        _answers.forEach(function(answer, i) {
            answer.animateIn(i * 150)
        })
    };
    this.animateOut = function() {
        if (_completed) {
            return
        }
        _completed = true;
        if (Device.mobile) {
            Stage.unbind("touchstart", click)
        } else {
            Stage.unbind("click", click);
            Stage.unbind("touchmove", touchMove)
        }
        var out = 0;
        _answers.forEach(function(answer, i) {
            answer.animateOut(0, null, function() {
                out++;
                if (out >= _answers.length) {
                    if (_this.destroy) {
                        _this.destroy()
                    }
                }
            })
        })
    }
});
Class(function QuizResult(_data) {
    Inherit(this, View);
    var _this = this;
    var _share, _back;
    var $this, $text, $result, $share, $returnPrompt, $castText, $shadow;
    var _text;
    var _textCopy;
    var _first = false;
    var _animated = false;
    (function() {
        initHTML();
        style();
        resize();
        addListeners()
    })();

    function initHTML() {
        $this = _this.element;
        _textCopy = Copy.processA(_data.copy, _data.result.id);
        _text = _this.initClass(UICopy, {
            text: _textCopy,
            size: 21
        });
        $castText = Stage.create("CastText");
        $result = $this.create(".result");
        $shadow = $this.create(".shadow");
        $share = $this.create(".share");
        _share = _this.initClass(ShareBtns);
        $returnPrompt = $this.create("ReturnPrompt")
    }

    function style() {
        $this.css({
            color: "#fff",
            textAlign: "center",
        });
        _back = _this.initClass(UIButton, {
            width: 200,
            height: 64,
            text: Copy.get("INTRODUCTION", "backProfile"),
            size: 9
        });
        _back.css({
            top: "",
            bottom: 0,
            marginTop: ""
        });
        _text.element.css({
            width: 260,
            margin: "0 auto 20px auto",
            height: 110
        });
        var text = Data.Patronus.getData(Data.User.getPatronus()).name;
        var size = Utils.convertRange(text.length, 10, 30, 45, 20, true);
        $result.fontStyle("Magorian", size, "#fff");
        $result.css({
            top: 60,
            opacity: 0,
            textAlign: "center",
            lineHeight: size,
            whiteSpace: "nowrap",
            color: "white",
            zIndex: 10
        });
        $result.text(text);
        $shadow.bg(Config.CDN + "assets/images/ui/text-shadow.png").css({
            backgroundPosition: "center center",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            zIndex: 0
        });
        defer(function() {
            var width = $result.div.clientWidth;
            var height = $result.div.clientHeight;
            $result.css({
                width: width,
                left: "50%",
                marginLeft: -(width / 2)
            });
            $shadow.css({
                width: width * 1.25,
                height: height * 1.5,
                left: "50%",
                marginLeft: -(width * 1.25) / 2,
                top: 50,
                opacity: 0
            })
        });
        $castText.fontStyle("Roboto", 10, "#fff");
        $castText.size(400, 30).center().css({
            textAlign: "center",
            lineHeight: 18,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            opacity: 0.5
        });
        var text = Device.mobile ? Copy.get("CAST_PROMPT_MOBILE") : Copy.get("CAST_PROMPT_DESKTOP");
        $castText.html(text);
        $castText.css({
            opacity: 0
        }).tween({
            opacity: 0.9
        }, 2000, "easeInOutSine");
        _share.css({
            opacity: 0
        });
        $share.fontStyle("Roboto", 9, "#fff");
        $share.css({
            opacity: 0,
            display: "block",
            lineHeight: 16,
            letterSpacing: 2.5,
            textTransform: "uppercase"
        });
        $share.html("SHARE")
    }

    function animateIn() {
        if (_this.visible) {
            return
        }
        _this.visible = true;
        _text.animateIn();
        _this.delayedCall(_back.animateIn, 2000);
        $result.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 2000, "easeInOutSine", 1300);
        $shadow.css({
            opacity: 0
        }).tween({
            opacity: 0.2
        }, 2000, "easeInOutSine", 1300);
        $share.css({
            opacity: 0
        }).tween({
            opacity: 0.8
        }, 1000, "easeInOutSine", 1500);
        _share.element.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 1000, "easeInOutSine", 1500)
    }

    function addListeners() {
        _back.events.add(HydraEvents.CLICK, finished);
        _this.events.subscribe(ForestReveal.CAST, removeCastText);
        _this.events.subscribe(ForestReveal.RECAST, showCastText);
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function removeCastText() {
        if (!_first) {
            _first = true;
            _this.delayedCall(animateIn, 1750)
        } else {
            animateIn()
        }
        if ($castText) {
            if (Device.browser.ie) {
                $castText.css({
                    opacity: 0
                })
            } else {
                $castText.tween({
                    opacity: 0
                }, 400, "easeOutSine")
            }
            _animated = false
        }
        if (Mobile.phone || Stage.width <= 768 || Mobile.tablet) {
            $this.tween({
                opacity: 1
            }, 800, "easeInOutSine", 500)
        }
    }

    function showCastText() {
        if ($castText) {
            if (Device.browser.ie) {
                $castText.css({
                    opacity: 0.9
                })
            } else {
                $castText.tween({
                    opacity: 0.9
                }, 400, "easeOutSine")
            }
        }
        if (Mobile.phone || Stage.width <= 768 || Mobile.tablet) {
            $this.tween({
                opacity: 0
            }, 400, "easeOutSine")
        }
        _animated = true
    }

    function finished() {
        Track.event({
            event: "PatronusQuiz",
            action: "return"
        });
        window.location = Config.PROFILE_URL
    }

    function resize() {
        if (!Device.mobile || Stage.width > Stage.height) {
            $this.size(300, Device.mobile ? 270 : 290).center(0, 1).css({
                left: Mobile.phone ? 20 : "10%",
                marginLeft: 0
            });
            _share.css({
                left: 0,
                right: 0,
                margin: "auto",
                position: "relative",
                display: "block",
                bottom: "auto"
            });
            $share.css({
                margin: "30px auto 10px auto",
                position: "relative",
                width: "auto",
                bottom: "auto"
            });
            if (!Device.phone) {
                $this.css({
                    opacity: 1
                })
            }
        } else {
            var offset = Stage.height >= 720 ? Utils.range(Stage.height, 720, 1068, 200, 500, true) : Utils.range(Stage.height, 400, 720, 100, 50, true);
            var height = Stage.height - offset;
            $this.size(300, height).center(1, 1);
            $share.css({
                margin: "auto",
                position: "absolute",
                bottom: 110,
                width: "100%",
                textAlign: "center"
            });
            _share.css({
                left: 0,
                right: 0,
                margin: "auto",
                position: "absolute",
                display: "block",
                bottom: 80
            });
            if (!Mobile.phone) {
                if (_animated) {
                    $this.css({
                        opacity: 0
                    })
                } else {
                    $this.css({
                        opacity: 1
                    })
                }
            }
        }
    }
});
Class(function QuizView(_tiling, _camera) {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _question, _result, _raycaster;
    (function() {
        initHTML();
        transitionCamera();
        initRaycaster();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $this.css({
            position: "static"
        })
    }

    function transitionCamera() {
        _this.isCameraReady = true;
        Camera.instance().transition(_camera.worldCamera, 6000, "easeInOutSine")
    }

    function initRaycaster() {
        _raycaster = _this.initClass(Raycaster, World.CAMERA)
    }

    function waitForCamera(data) {
        if (_this.isCameraReady) {
            return newQuestion(data)
        }
        _this.delayedCall(waitForCamera, 100, data)
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.NEW_QUESTION, newQuestion);
        _this.events.subscribe(QuizEvents.PATRONUS_RECEIVED, endQuiz);
        _this.events.subscribe(TilingMovement.END_POSITION, placeQuestion)
    }

    function placeQuestion(e) {
        if (_question && _question.place) {
            _question.place(e)
        }
    }

    function clearQuestion() {
        if (_question && _question.destroy) {
            var oldQuestion = _question;
            _question = null;
            oldQuestion.animateOut()
        }
    }

    function newQuestion(data) {
        if (!_this.isCameraReady) {
            return waitForCamera(data)
        }
        clearQuestion();
        if (Tests.doNonCorporealReveal() && data.index === Config.NON_CORPOREAL && !_this.hasPaused) {
            _this.hasPaused = true;
            var finish;
            progressTiles(function() {
                finish()
            });
            var tile = _tiling.tiles[1].active[0];
            finish = tile.nonCorporeal(function() {
                _this.delayedCall(function() {
                    _this.events.fire(QuizEvents.NON_CORPOREAL_COMPLETE);
                    newQuestion(data)
                }, 10)
            });
            return
        }
        _question = _this.initClass(QuizQuestion, data, _raycaster);
        QuizView.QUESTION_INDEX = data.index || 0;
        progressTiles(function() {
            _this.events.fire(QuizEvents.START_QUESTION);
            _question.start()
        })
    }

    function endQuiz(data) {
        clearQuestion();
        progressTiles(function() {
            _result = _this.initClass(QuizResult, data)
        }, "lake")
    }

    function progressTiles(callback, dest) {
        if (dest == "lake") {
            _tiling.toLake(callback)
        } else {
            _tiling.toClearing(callback)
        }
    }
});
Class(function Logo() {
    Inherit(this, View);
    var _this = this;
    var $this;
    _this.visible = false;
    (function() {
        initHTML();
        style();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element
    }

    function style() {
        var scale = 0.5;
        $this.size(507 * scale, 125 * scale).center(1, 0).css({
            top: 45
        }).bg(Config.CDN + "assets/images/ui/wwlogo.png").setZ(10);
        if (Tests.useFallback()) {
            $this.setZ(500)
        }
        $this.css({
            opacity: 0
        });
        $this.interact(function(e) {
            if (!_this.visible) {
                return
            }
            $this.tween({
                opacity: e.action == "over" ? 0.8 : 1
            }, 300, "easeOutSine")
        }, function() {
            if (!_this.visible) {
                return
            }
            getURL("https://www.pottermore.com/", "_blank")
        });
        $this.hit.hide()
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.INIT_COMPLETED, initCompleted);
        _this.events.subscribe(QuizEvents.INIT_INTRO, initIntro);
        _this.events.subscribe(QuizEvents.START_QUIZ, startQuiz);
        _this.events.subscribe(QuizEvents.OPEN_IFRAME, openIframe);
        _this.events.subscribe(QuizEvents.CLOSE_IFRAME, closeIframe)
    }

    function initCompleted(e) {
        _this.visible = true;
        $this.hit.show();
        $this.tween({
            opacity: 1
        }, 3000, "easeInOutSine", 2000)
    }

    function initIntro() {
        _this.visible = true;
        $this.hit.show();
        $this.tween({
            opacity: 1
        }, 3000, "easeInOutSine", 5000)
    }

    function startQuiz() {
        _this.visible = false;
        $this.hit.hide();
        $this.tween({
            opacity: 0
        }, 2000, "easeInOutSine")
    }

    function openIframe() {
        _this.visible = false;
        $this.hit.hide();
        $this.tween({
            opacity: 0
        }, 1000, "easeInOutSine")
    }

    function closeIframe() {
        _this.visible = true;
        $this.hit.show();
        $this.tween({
            opacity: 1
        }, 3000, "easeInOutSine", 2000)
    }
});
Class(function Message(config) {
    Inherit(this, View);
    var _this = this;
    var $this, $text;
    var _timeout;
    var TIMEOUT_LENGTH = 5000;
    (function() {
        initHTML();
        initText();
        animateIn()
    })();

    function initHTML() {
        $this = _this.element;
        $this.css({
            position: "fixed",
            width: "100%",
            top: 0,
            height: 50,
            backgroundColor: "rgba(255,255,255,0.1)"
        }).setZ(999);
        $this.transform({
            y: -50
        })
    }

    function initText() {
        $text = $this.create("text");
        $text.css({
            opacity: 0,
            width: "100%",
            height: 50,
            lineHeight: 50,
            textAlign: "center",
            color: "white"
        });
        $text.div.setAttribute("aria-live", "polite");
        $text.div.setAttribute("role", "status");
        $text.transform({
            y: -25
        });
        $text.html(config.text)
    }

    function animateIn() {
        $this.tween({
            y: 0,
            height: 50
        }, 400, "easeOutCubic");
        $text.tween({
            opacity: 1,
            y: 0
        }, 400, "easeOutCubic");
        if (_timeout) {
            clearTimeout(_timeout)
        }
        _timeout = setTimeout(function() {
            animateOut()
        }, TIMEOUT_LENGTH)
    }

    function animateOut() {
        $this.tween({
            y: -50
        }, 400, "easeOutCubic", function() {
            if (_this.destroy) {
                _this.destroy()
            }
        });
        $text.tween({
            opacity: 0,
            y: -25
        }, 400, "easeOutCubic")
    }
    this.text = function(text) {
        $text.html(text);
        animateIn()
    }
});
Class(function TempText(config) {
    Inherit(this, Component);
    var _this = this;
    this.group = new THREE.Group();
    (function() {
        initText()
    })();

    function initText() {
        var text = _this.initClass(WebGLText, {
            font: "magorian-bold",
            image: "assets/images/fonts/magorian-bold.png",
            text: config.text,
            width: 2000,
            align: "center",
            letterSpacing: 1,
            color: "#eee",
            opacity: 1,
        });
        _this.group.add(text.mesh);
        var s = 0.001;
        text.mesh.scale.set(s, s, s);
        World.SCENE.add(_this.group)
    }
    this.onDestroy = function() {
        World.SCENE.remove(_this.group)
    }
});
Class(function UIButton(_data) {
    Inherit(this, View);
    var _this = this;
    var $this, $solid, $text1, $text2, $glow;
    var _outline1, _outline2;
    (function() {
        initHTML();
        initOutlines();
        initSolid();
        initText();
        initGlow();
        addListeners()
    })();

    function initHTML() {
        $this = _this.element;
        $this.size(_data.width, _data.height).center().invisible()
    }

    function initOutlines() {
        _outline1 = _this.initClass(UIButtonOutline, {
            width: _data.width - 10,
            height: _data.height
        });
        _outline1.css({
            left: 5
        });
        _outline2 = _this.initClass(UIButtonOutline, {
            width: _data.width,
            height: _data.height - 10
        });
        _outline2.css({
            top: 5
        })
    }

    function initText() {
        var size = _data.size || 11;
        $text1 = $this.create(".text");
        $text1.fontStyle("Roboto", size, "#fff");
        $text1.css({
            top: "50%",
            width: "100%",
            textTransform: "uppercase",
            textAlign: "center",
            marginTop: -size / 2,
            lineHeight: size,
            letterSpacing: 2
        });
        $text1.text(_data.text);
        $text2 = $this.create(".text");
        $text2.fontStyle("RobotoMed", size, "#000");
        $text2.css({
            top: "50%",
            width: "100%",
            textTransform: "uppercase",
            textAlign: "center",
            marginTop: -size / 2,
            lineHeight: size,
            letterSpacing: 1.9,
            opacity: 0
        }).transform({
            y: 10
        });
        $text2.text(_data.text)
    }

    function initSolid() {
        $solid = $this.create(".solid");
        $solid.size(_data.width - 20, _data.height - 20).center().css({
            overflow: "hidden"
        });
        $solid.inner = $solid.create(".inner");
        $solid.inner.size(_data.width - 20, _data.height - 20).bg("#fff").transform({
            scaleX: (_data.width - 10) / _data.width,
            scaleY: (_data.height - 10) / _data.height
        }).css({
            opacity: 0
        })
    }

    function initGlow() {
        $glow = $this.create(".glow");
        $glow.size(_data.width - 10, _data.height - 10).center().css({
            boxShadow: "0 0 " + _data.height * 1.1 + "px #8bcff7",
            opacity: 0
        })
    }

    function addListeners() {
        $this.interact(hover, click);
        $this.hit.hide().mouseEnabled(true)
    }

    function hover(e) {
        if (_this.clicked) {
            return
        }
        switch (e.action) {
            case "over":
                _outline1.over();
                _outline2.over(true);
                if ((Device.browser.ie && Device.browser.version <= 11) || (Device.system.os === "windows" && Device.browser.firefox)) {
                    $glow.css({
                        opacity: 0.7
                    });
                    $text1.transform({
                        y: -10
                    }).css({
                        opacity: 0
                    });
                    $text2.transform({
                        y: 0
                    }).css({
                        opacity: 1
                    });
                    $solid.inner.transform({
                        scaleY: 1,
                        scaleX: 1
                    }).css({
                        opacity: 1
                    })
                } else {
                    $glow.tween({
                        opacity: 0.7
                    }, 400, "easeOutSine");
                    $text1.tween({
                        y: -10,
                        opacity: 0
                    }, 400, "easeOutCubic");
                    $text2.tween({
                        y: 0,
                        opacity: 1
                    }, 400, "easeOutCubic");
                    $solid.inner.tween({
                        scaleY: 1,
                        scaleX: 1,
                        opacity: 1
                    }, 400, "easeOutQuart")
                }
                if (!Tests.useFallback()) {
                    AudioController.onButtonOver()
                }
                break;
            case "out":
                if (_outline1 && _outline1.out) {
                    _outline1.out()
                }
                if (_outline2 && _outline2.out) {
                    _outline2.out()
                }
                if ((Device.browser.ie && Device.browser.version <= 11) || (Device.system.os === "windows" && Device.browser.firefox)) {
                    $glow.css({
                        opacity: 0
                    });
                    $text1.transform({
                        y: 0
                    }).css({
                        opacity: 1
                    });
                    $text2.transform({
                        y: 10
                    }).css({
                        opacity: 0
                    });
                    $solid.inner.transform({
                        scaleX: (_data.width - 10) / _data.width,
                        scaleY: (_data.height - 10) / _data.height
                    }).css({
                        opacity: 0
                    })
                } else {
                    $glow.tween({
                        opacity: 0
                    }, 300, "easeOutSine");
                    $text1.tween({
                        y: 0,
                        opacity: 1
                    }, 300, "easeOutCubic");
                    $text2.tween({
                        y: 10,
                        opacity: 0
                    }, 300, "easeOutCubic");
                    $solid.inner.tween({
                        scaleX: (_data.width - 10) / _data.width,
                        scaleY: (_data.height - 10) / _data.height,
                        opacity: 0
                    }, 500, "easeOutQuart")
                }
                if (!Tests.useFallback()) {
                    AudioController.onButtonOut()
                }
                break
        }
    }

    function click() {
        $this.hit.hide();
        _this.clicked = true;
        $text1.tween({
            opacity: 0
        }, 300, "easeOutSine");
        $text2.tween({
            opacity: 0
        }, 300, "easeOutSine");
        $solid.inner.tween({
            opacity: 0,
            scaleX: (_data.width - 10) / _data.width,
            scaleY: (_data.height - 10) / _data.height
        }, 500, "easeOutCubic");
        $glow.tween({
            opacity: 0
        }, 700, "easeOutSine");
        _outline1.animateOut();
        _outline2.animateOut();
        _this.events.fire(HydraEvents.CLICK);
        if (!Tests.useFallback()) {
            AudioController.onButtonClick()
        }
    }
    this.animateIn = function() {
        _this.clicked = false;
        $this.visible().clearAlpha();
        $solid.inner.css({
            opacity: 0
        }).transform({
            scaleX: (_data.width - 10) / _data.width,
            scaleY: (_data.height - 10) / _data.height
        });
        $text1.transform({
            y: 10
        }).css({
            opacity: 0
        }).tween({
            y: 0,
            opacity: 1
        }, 600, "easeOutCubic", 400, function() {
            if ($this && $this.hit) {
                $this.hit.show()
            }
        });
        _outline1.animateIn();
        _this.delayedCall(_outline2.animateIn, 300)
    };
    this.animateOut = function() {
        $this.tween({
            opacity: 0
        }, 500, "easeOutSine", function() {
            $this.invisible();
            _outline1.element.invisible().css({
                opacity: 0.5
            });
            _outline2.element.invisible().css({
                opacity: 0.5
            })
        })
    }
});
Class(function UIButtonOutline(_data) {
    Inherit(this, View);
    var _this = this;
    var $this, $top, $right, $bottom, $left;
    var _lines;
    (function() {
        initHTML();
        initLines()
    })();

    function initHTML() {
        $this = _this.element;
        $this.size("100%").invisible().css({
            opacity: 0.5
        })
    }

    function initLines() {
        $top = $this.create(".line");
        $top.size(_data.width, 1).bg("#fff");
        $right = $this.create(".line");
        $right.size(1, _data.height).css({
            left: _data.width - 1
        }).bg("#fff");
        $bottom = $this.create(".line");
        $bottom.size(_data.width, 1).css({
            top: _data.height - 1
        }).bg("#fff");
        $left = $this.create(".line");
        $left.size(1, _data.height).bg("#fff")
    }
    this.over = function(top) {
        $this.tween({
            opacity: 1
        }, 300, "easeOutSine");
        if (!top) {
            if ((Device.browser.ie && Device.browser.version <= 11) || (Device.system.os === "windows" && Device.browser.firefox)) {
                $top.transform({
                    scaleX: 0
                });
                $bottom.transform({
                    scaleX: 0
                });
                $right.transform({
                    scaleY: (_data.height - 10) / _data.height
                });
                $left.transform({
                    scaleY: (_data.height - 10) / _data.height
                })
            } else {
                $top.tween({
                    scaleX: 0
                }, 400, "easeOutQuart");
                $bottom.tween({
                    scaleX: 0
                }, 400, "easeOutQuart");
                $right.tween({
                    scaleY: (_data.height - 10) / _data.height
                }, 400, "easeOutQuart");
                $left.tween({
                    scaleY: (_data.height - 10) / _data.height
                }, 400, "easeOutQuart")
            }
        } else {
            if ((Device.browser.ie && Device.browser.version <= 11) || (Device.system.os === "windows" && Device.browser.firefox)) {
                $top.transform({
                    scaleX: (_data.width - 10) / _data.width
                });
                $bottom.transform({
                    scaleX: (_data.width - 10) / _data.width
                });
                $right.transform({
                    scaleY: 0
                });
                $left.transform({
                    scaleY: 0
                })
            } else {
                $top.tween({
                    scaleX: (_data.width - 10) / _data.width
                }, 400, "easeOutQuart");
                $bottom.tween({
                    scaleX: (_data.width - 10) / _data.width
                }, 400, "easeOutQuart");
                $right.tween({
                    scaleY: 0
                }, 400, "easeOutQuart");
                $left.tween({
                    scaleY: 0
                }, 400, "easeOutQuart")
            }
        }
    };
    this.out = function() {
        if ((Device.browser.ie && Device.browser.version <= 11) || (Device.system.os === "windows" && Device.browser.firefox)) {
            $this.css({
                opacity: 0.5
            });
            $top.transform({
                scaleX: 1
            });
            $right.transform({
                scaleY: 1
            });
            $bottom.transform({
                scaleX: 1
            });
            $left.transform({
                scaleY: 1
            })
        } else {
            $this.tween({
                opacity: 0.5
            }, 400, "easeOutSine");
            $top.tween({
                scaleX: 1
            }, 800, "easeOutQuart");
            $right.tween({
                scaleY: 1
            }, 800, "easeOutQuart");
            $bottom.tween({
                scaleX: 1
            }, 800, "easeOutQuart");
            $left.tween({
                scaleY: 1
            }, 800, "easeOutQuart")
        }
    };
    this.animateIn = function() {
        $this.visible();
        if ((Device.browser.ie && Device.browser.version <= 11) || (Device.system.os === "windows" && Device.browser.firefox)) {
            $top.transform({
                scaleX: 1
            });
            $bottom.transform({
                scaleX: 1
            });
            $right.transform({
                scaleY: 1
            });
            $left.transform({
                scaleY: 1
            })
        } else {
            $top.transformPoint("50%", "50%").transform({
                scaleX: 0
            }).tween({
                scaleX: 1
            }, 1400, "easeInOutQuart");
            $right.transformPoint("50%", "50%").transform({
                scaleY: 0
            }).tween({
                scaleY: 1
            }, 1400, "easeInOutQuart");
            $bottom.transformPoint("50%", "50%").transform({
                scaleX: 0
            }).tween({
                scaleX: 1
            }, 1400, "easeInOutQuart");
            $left.transformPoint("50%", "50%").transform({
                scaleY: 0
            }).tween({
                scaleY: 1
            }, 1400, "easeInOutQuart")
        }
    };
    this.animateOut = function() {
        $right.tween({
            scaleY: 0
        }, 400, "easeOutQuart");
        $left.tween({
            scaleY: 0
        }, 400, "easeOutQuart");
        $top.tween({
            scaleX: 0
        }, 400, "easeOutQuart");
        $bottom.tween({
            scaleX: 0
        }, 400, "easeOutQuart")
    }
});
Class(function UICopy(_data) {
    Inherit(this, View);
    var _this = this;
    var $this, $text;
    var _words;
    _data.size = _data.size || 34;
    (function() {
        initHTML();
        initText()
    })();

    function initHTML() {
        $this = _this.element;
        $this.css({
            whiteSpace: "auto",
            width: "100%",
            height: "",
            position: "relative",
            display: "block",
            textAlign: "center",
            margin: "0 auto"
        }).invisible()
    }

    function initText() {
        $text = $this.create(".text");
        $text.fontStyle("Magorian", _data.size, "#fff");
        $text.css({
            position: "relative",
            display: "block",
            textAlign: "center",
            lineHeight: _data.size * 1.2
        });
        $text.text(_data.text);
        _this.text = $text;
        if (Device.browser.ie && Device.browser.version <= 11) {
            $text.css({
                opacity: 0
            }).transform({
                y: -10
            })
        } else {
            _words = SplitTextfield.split($text, "word");
            defer(function() {
                for (var i = 0; i < _words.length; i++) {
                    _words[i].css({
                        width: _words[i].div.offsetWidth,
                        cssFloat: "",
                        styleFloat: "",
                        display: "inline-block"
                    })
                }
            })
        }
    }
    this.animateIn = function() {
        $this.visible().clearAlpha();
        if (_words && _words.length > 0) {
            var delay = 0;
            for (var i = 0; i < _words.length; i++) {
                _words[i].transform({
                    y: _data.size * 0.6
                }).css({
                    opacity: 0
                }).tween({
                    y: 0,
                    rotationY: 0,
                    opacity: 1
                }, 4000, "easeOutQuint", delay);
                delay += 75;
                var html = _words[i].div.innerHTML;
                if (html.strpos(",") || html.strpos(".")) {
                    delay += 300
                }
            }
        } else {
            $text.tween({
                opacity: 1,
                y: 0
            }, 800, "easeOutCubic")
        }
    };
    this.animateOut = function() {
        console.trace();
        $this.tween({
            opacity: 0
        }, 500, "easeOutSine", function() {
            $this.invisible()
        })
    };
    this.resize = function(size) {
        $text.css({
            position: "relative",
            display: "block",
            textAlign: "center",
            lineHeight: size * 1.2,
            fontSize: size
        });
        if (_words && _words.length > 0) {
            _words.forEach(function(word) {
                word.css({
                    fontSize: size
                })
            });
            _this.delayedCall(function() {
                for (var i = 0; i < _words.length; i++) {
                    _words[i].css({
                        width: _words[i].div.offsetWidth,
                        cssFloat: "",
                        styleFloat: "",
                        display: "inline-block"
                    })
                }
            }, 500)
        }
    }
});
Class(function FullscreenButton() {
    Inherit(this, View);
    var _this = this;
    var $this, $boxes, $bg, $text;
    (function() {
        initHTML();
        initBoxes();
        initText();
        addListeners()
    })();

    function initHTML() {
        $this = _this.element;
        $this.size(60, 60).css({
            right: 40,
            bottom: 40
        }).setZ(10);
        $this.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 1500, "easeInOutSine", 1000)
    }

    function initBoxes() {
        $boxes = $this.create(".bars");
        $boxes.size(19, 19).center().css({
            opacity: 0.4
        });
        _this.boxes = [];
        for (var i = 0; i < 4; i++) {
            var $box = $boxes.create(".bar");
            $box.size(4, 4);
            if (i == 0) {
                $box.css({
                    borderLeft: "2px solid #fff",
                    borderTop: "2px solid #fff"
                })
            }
            if (i == 1) {
                $box.css({
                    right: 0,
                    borderRight: "2px solid #fff",
                    borderTop: "2px solid #fff"
                })
            }
            if (i == 2) {
                $box.css({
                    bottom: 0,
                    borderLeft: "2px solid #fff",
                    borderBottom: "2px solid #fff"
                })
            }
            if (i == 3) {
                $box.css({
                    bottom: 0,
                    right: 0,
                    borderRight: "2px solid #fff",
                    borderBottom: "2px solid #fff"
                })
            }
            _this.boxes.push($box)
        }
    }

    function initText() {
        var size = 8;
        $text = $this.create(".text");
        $text.fontStyle("RobotoMed", size, "#fff");
        $text.size(100, 20).center(1, 0).css({
            bottom: -10,
            textTransform: "uppercase",
            textAlign: "center",
            letterSpacing: 2,
            opacity: 0
        }).transform({
            y: 5
        })
    }

    function addListeners() {
        $this.interact(hover, click);
        _this.events.subscribe(HydraEvents.FULLSCREEN, fullscreenChange)
    }

    function hover(e) {
        if (_this.animating) {
            return
        }
        var x = 0.5;
        switch (e.action) {
            case "over":
                $boxes.tween({
                    opacity: 1
                }, 200, "easeOutSine");
                $text.text(_this.fullscreen ? "MINIMIZE" : "FULLSCREEN").tween({
                    opacity: 0.7,
                    y: 0
                }, 300, "easeOutCubic");
                if (_this.fullscreen) {
                    _this.boxes[0].tween({
                        x: x,
                        y: x
                    }, 300, "easeOutCubic");
                    _this.boxes[1].tween({
                        x: -x,
                        y: x
                    }, 300, "easeOutCubic");
                    _this.boxes[2].tween({
                        x: x,
                        y: -x
                    }, 300, "easeOutCubic");
                    _this.boxes[3].tween({
                        x: -x,
                        y: -x
                    }, 300, "easeOutCubic")
                } else {
                    _this.boxes[0].tween({
                        x: -x,
                        y: -x
                    }, 300, "easeOutCubic");
                    _this.boxes[1].tween({
                        x: x,
                        y: -x
                    }, 300, "easeOutCubic");
                    _this.boxes[2].tween({
                        x: -x,
                        y: x
                    }, 300, "easeOutCubic");
                    _this.boxes[3].tween({
                        x: x,
                        y: x
                    }, 300, "easeOutCubic")
                }
                break;
            case "out":
                $boxes.tween({
                    opacity: 0.4
                }, 200, "easeOutSine");
                for (var i = 0; i < _this.boxes.length; i++) {
                    _this.boxes[i].tween({
                        x: 0,
                        y: 0
                    }, 400, "easeOutQuart")
                }
                $text.tween({
                    opacity: 0,
                    y: 5
                }, 400, "easeOutCubic");
                break
        }
    }

    function click() {
        _this.animating = true;
        _this.delayedCall(function() {
            _this.animating = false
        }, 1000);
        $boxes.tween({
            opacity: 0.4
        }, 200, "easeOutSine");
        if (Device.getFullscreen()) {
            Device.closeFullscreen()
        } else {
            Device.openFullscreen()
        }
    }

    function fullscreenChange(e) {
        if (!e.fullscreen) {
            _this.fullscreen = false;
            for (var i = 0; i < _this.boxes.length; i++) {
                _this.boxes[i].tween({
                    x: 0,
                    y: 0,
                    rotation: 0
                }, 400, "easeOutQuart", 500)
            }
        } else {
            _this.fullscreen = true;
            for (var i = 0; i < _this.boxes.length; i++) {
                _this.boxes[i].tween({
                    x: 0,
                    y: 0,
                    rotation: 180
                }, 400, "easeOutQuart", 500)
            }
        }
        $text.tween({
            opacity: 0,
            y: 5
        }, 400, "easeOutCubic")
    }
    this.animateIn = function() {}
});
Class(function ShareBtns() {
    Inherit(this, View);
    var _this = this;
    var $this, $main, $secondary, $more;
    var _types = ["facebook", "twitter", "gplus", "stumbleUpon", "tumblr", "email"];
    var _btns = [];
    var _size = 22;
    var _expanded;
    (function() {
        initHTML();
        initBtns();
        style()
    })();

    function initHTML() {
        $this = _this.element;
        $main = $this.create("share-main-btns");
        $more = $this.create("share-show-secondary");
        $secondary = $this.create("share-secondary-btns")
    }

    function initBtns() {
        _types.forEach(function(type, i) {
            var btn;
            if (type === "facebook" || type === "twitter") {
                btn = _this.initClass(ShareBtn, type, _size, [$main])
            } else {
                btn = _this.initClass(ShareBtn, type, _size, [$secondary])
            }
            btn.events.add(HydraEvents.CLICK, click);
            _btns.push(btn)
        });
        $more.interact(moreHover, toggle);
        $more.hit.mouseEnabled(true)
    }

    function style() {
        var margin = 10;
        var width = _size + margin;
        $this.size(width * 3, 25).css({
            padding: 0,
            margin: 0,
            overflow: "hidden"
        });
        $main.size(width * 2, 25).css({
            left: 5,
            overflow: "hidden"
        });
        $more.size(_size, 25).css({
            right: margin - 5,
            opacity: 0.5
        }).bg(Config.CDN + "assets/images/share/more.png");
        $secondary.size(0, _size).css({
            left: width * 2 + 5,
            overflow: "hidden"
        });
        _btns.forEach(function(btn, i) {
            if (i > 1) {
                i = i - 2
            }
            btn.element.css({
                left: (_size + margin) * i
            })
        })
    }

    function click(e) {
        Share.link(e.type, {
            id: Data.User.getPatronus(),
            name: Data.Patronus.getData(Data.User.getPatronus()).name
        });
        Track.event({
            event: "PatronusQuiz",
            action: "sharedPatronus",
            patronus_id: Data.User.getPatronus(),
            patronus_name: Data.Patronus.getData(Data.User.getPatronus()).name,
            sharingSystem: e.type
        })
    }

    function moreHover(e) {
        if (e.action === "over") {
            $more.tween({
                opacity: 1
            }, 175, "easeOutCubic")
        } else {
            $more.tween({
                opacity: 0.5
            }, 175, "easeOutCubic")
        }
    }

    function toggle(e) {
        _expanded = !_expanded;
        $secondary.tween({
            width: _expanded ? (_types.length - 2) * (_size + 10) : 0
        }, 400, "easeOutCubic");
        $this.tween({
            width: _expanded ? (_types.length + 1) * (_size + 10) : (_size + 10) * 3
        }, 400, "easeOutCubic")
    }
    this.animateIn = function() {
        var duration = 125;
        $this.tween({
            opacity: 1
        }, 225, "easeOutCubic");
        _btns.forEach(function(btn) {
            btn.animateIn(duration)
        })
    };
    this.animateOut = function() {
        var duration = 175;
        $this.tween({
            opacity: 0
        }, 225, "easeOutCubic", _btns.length * duration);
        _btns.forEach(function(btn) {
            btn.animateOut(duration)
        })
    }
});
Class(function ShareBtn(_type, _size) {
    Inherit(this, View);
    var _this = this;
    var $this, $icon;
    _this.type = _type;
    (function() {
        initHTML();
        style();
        addEventListener()
    })();

    function initHTML() {
        $this = _this.element;
        $icon = $this.create("share-btn-" + _type)
    }

    function style() {
        $this.size(_size, _size);
        $icon.size("100%").bg(Config.CDN + "assets/images/share/" + _type + ".png", "contain").css({
            top: 0,
            opacity: 0.6
        })
    }

    function addEventListener() {
        $this.interact(hover, click);
        $this.hit.size(40, 40).center().mouseEnabled(true)
    }

    function hover(e) {
        if (e.action === "over") {
            $icon.tween({
                opacity: 1
            }, 100, "easeOutSine")
        } else {
            $icon.tween({
                opacity: 0.6
            }, 400, "easeOutSine")
        }
    }

    function click() {
        _this.events.fire(HydraEvents.CLICK, {
            type: _type
        })
    }
    this.animateIn = function(duration) {
        $this.tween({
            opacity: 1
        }, duration, "easeOutCubic")
    };
    this.animateOut = function(duration) {
        $this.tween({
            opacity: 0
        }, duration, "easeOutCubic")
    }
});
Class(function VolumeButton() {
    Inherit(this, View);
    var _this = this;
    var $this, $bars, $bg, $text;
    (function() {
        initHTML();
        initBars();
        initText();
        addListeners();
        resize();
        Render.start(loop)
    })();

    function initHTML() {
        $this = _this.element;
        $this.amount = 8;
        $this.volume = 1;
        $this.size(60, 60).setZ(10);
        $this.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 1500, "easeInOutSine", 1000)
    }

    function initBars() {
        $bars = $this.create(".bars");
        $bars.size(20, 20).center().css({
            overflow: "hidden",
            opacity: 0.4
        });
        _this.bars = [];
        for (var i = 0; i < 4; i++) {
            var $bar = $bars.create(".bar");
            $bar.size(2, 30).bg("#fff").css({
                left: i * 5 + 2
            });
            $bar.inc = Math.PI * 2 / (60 + i * 20);
            $bar.count = 0;
            $bar.y = 0;
            _this.bars.push($bar)
        }
    }

    function initText() {
        var size = 8;
        $text = $this.create(".text");
        $text.fontStyle("RobotoMed", size, "#fff");
        $text.size(100, 20).center(1, 0).css({
            bottom: -10,
            textTransform: "uppercase",
            textAlign: "center",
            letterSpacing: 2,
            opacity: 0
        }).transform({
            y: 5
        });
        $text.text("MUTE")
    }

    function loop() {
        for (var i = 0; i < _this.bars.length; i++) {
            var $bar = _this.bars[i];
            $bar.count += $bar.inc;
            $bar.y = $this.amount + (Math.sin($bar.count) / 2) * $this.amount;
            $bar.y = 17 - $bar.y * $this.volume;
            $bar.transform()
        }
    }

    function addListeners() {
        _this.events.subscribe(HydraEvents.RESIZE, resize);
        _this.events.subscribe(KeyboardUtil.PRESS, keypress);
        $this.interact(hover, click)
    }

    function keypress(e) {
        if (e.key === "m" || e.keyCode === 109) {
            click()
        }
    }

    function hover(e) {
        switch (e.action) {
            case "over":
                $text.text(_this.muted ? "UNMUTE" : "MUTE").tween({
                    opacity: 0.7,
                    y: 0
                }, 300, "easeOutCubic");
                $bars.tween({
                    opacity: 1
                }, 300, "easeOutSine");
                break;
            case "out":
                $bars.tween({
                    opacity: 0.4
                }, 400, "easeOutSine");
                $text.tween({
                    opacity: 0,
                    y: 5
                }, 400, "easeOutCubic");
                break
        }
    }

    function click() {
        if (_this.muted) {
            _this.muted = false;
            TweenManager.tween($this, {
                volume: 1
            }, 200, "easeOutSine");
            AudioController.unmute()
        } else {
            _this.muted = true;
            TweenManager.tween($this, {
                volume: 0
            }, 200, "easeOutSine");
            AudioController.mute()
        }
        $text.tween({
            opacity: 0,
            y: 5
        }, 400, "easeOutCubic")
    }

    function resize() {
        if (Mobile.phone) {
            if (Stage.width <= 340) {
                $this.css({
                    right: 5,
                    bottom: 5
                })
            }
            if (Stage.width > Stage.height) {
                $this.css({
                    right: 25,
                    bottom: 25
                })
            } else {
                $this.css({
                    right: 15,
                    bottom: 15
                })
            }
        } else {
            $this.css({
                right: 40,
                bottom: 40
            })
        }
    }
    this.animateIn = function() {};
    this.destroy = function() {
        Render.stop(loop);
        return _this._destroy()
    }
});
Class(function AccessibilityCompletedView() {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _text, _share, _returnPrompt, _cast, _castMobile;
    (function() {
        Data.Patronus.getData(Data.User.getPatronus(), function() {
            initHTML();
            addListeners()
        })
    })();

    function initHTML() {
        $this = _this.element;
        _text = _this.initClass(AccessibilityText, {
            text: Copy.processA(Copy.get("INTRODUCTION", "completed"), Data.User.getPatronus()) + " " + Data.Patronus.getData(Data.User.getPatronus()).name,
            live: "assertive",
            role: "alert",
            tabindex: 1,
            focus: true
        });
        _text.css({
            marginRight: 10
        });
        _share = _this.initClass(AccessibilityShare);
        _returnPrompt = _this.initClass(AccessibilityButton, {
            text: Copy.get("INTRODUCTION", "backProfile"),
            live: "polite",
            tabindex: 10
        });
        _returnPrompt.css({
            position: "relative",
            display: "block"
        });
        if (!Tests.useFallback()) {
            if (Mobile.phone || Mobile.tablet) {
                _castMobile = _this.initClass(AccessibilityButton, {
                    text: Copy.get("ACCESSIBILITY", "castMobile"),
                    live: "polite",
                    tabindex: 10
                });
                _castMobile.css({
                    position: "relative",
                    display: "block"
                })
            } else {
                _cast = _this.initClass(AccessibilityText, {
                    text: Copy.get("ACCESSIBILITY", "cast") + Copy.get("ACCESSIBILITY", "mute"),
                    live: "polite",
                    tabindex: 11
                });
                _cast.css({
                    position: "relative",
                    display: "block"
                })
            }
        }
    }

    function addListeners() {
        _returnPrompt.events.add(HydraEvents.CLICK, finished);
        if (_castMobile) {
            _castMobile.events.add(HydraEvents.CLICK, cast)
        }
    }

    function finished() {
        window.location = Config.PROFILE_URL
    }

    function cast() {
        KeyboardUtil.events.fire(KeyboardUtil.PRESS, {
            key: "Enter"
        })
    }
});
Class(function AccessibilityIntroLoginPrompt() {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _iframe, _text, _loginButton, _joinButton, _cancelButton;
    (function() {
        initHTML();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        _text = _this.initClass(AccessibilityText, {
            text: Copy.get("INTRODUCTION", "notLoggedIn"),
            live: "assertive",
            role: "alert",
            tabindex: 1,
            focus: true
        });
        _text.css({
            marginRight: 10
        });
        _loginButton = _this.initClass(AccessibilityButton, {
            role: "button",
            text: Copy.get("INTRODUCTION", "login"),
            live: "polite",
            tabindex: 2
        });
        _loginButton.css({
            marginRight: 10
        });
        _joinButton = _this.initClass(AccessibilityButton, {
            text: Copy.get("INTRODUCTION", "join"),
            live: "polite",
            tabindex: 3
        });
        _cancelButton = _this.initClass(AccessibilityButton, {
            text: "Cancel",
            live: "polite",
            tabindex: 4
        });
        _cancelButton.element.hide()
    }

    function addHandlers() {
        _loginButton.events.add(HydraEvents.CLICK, login);
        _joinButton.events.add(HydraEvents.CLICK, join);
        _cancelButton.events.add(HydraEvents.CLICK, cancel)
    }

    function login() {
        _loginButton.element.hide();
        _joinButton.element.hide();
        _cancelButton.css({
            display: "inline-block"
        });
        _this.events.fire(QuizEvents.OPEN_LOGIN_IFRAME)
    }

    function join() {
        _loginButton.element.hide();
        _joinButton.element.hide();
        _cancelButton.css({
            display: "inline-block"
        });
        _this.events.fire(QuizEvents.OPEN_JOIN_IFRAME)
    }

    function cancel() {
        _loginButton.css({
            display: "inline-block"
        });
        _joinButton.css({
            display: "inline-block"
        });
        _cancelButton.element.hide();
        _this.events.fire(QuizEvents.CLOSE_IFRAME)
    }
});
Class(function AccessibilityIntroStartPrompt() {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _text, _startPrompt, _mute;
    (function() {
        initHTML();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        _text = _this.initClass(AccessibilityText, {
            text: Copy.get("INTRODUCTION", "title") + ". " + Copy.get("INTRODUCTION", "subtitle") + ".",
            live: "polite",
            role: "alert",
            tabindex: 1,
            focus: true
        });
        _text.element.html(Copy.get("INTRODUCTION", "title") + ". " + Copy.get("INTRODUCTION", "subtitle"));
        _startPrompt = _this.initClass(AccessibilityButton, {
            text: Copy.get("INTRODUCTION", "start"),
            live: "polite",
            tabindex: 2
        });
        _startPrompt.css({
            position: "relative",
            display: "block"
        });
        if (!Mobile.phone && !Mobile.tablet && !Tests.useFallback()) {
            var muteText;
            muteText = Copy.get("ACCESSIBILITY", "start") + Copy.get("ACCESSIBILITY", "mute");
            _mute = _this.initClass(AccessibilityText, {
                text: muteText,
                live: "polite",
                tabindex: 11
            });
            _mute.css({
                position: "relative",
                display: "block"
            })
        }
    }

    function addHandlers() {
        _startPrompt.events.add(HydraEvents.CLICK, start);
        _this.events.subscribe(KeyboardUtil.PRESS, keypress)
    }

    function start() {
        _this.events.fire(QuizEvents.START_QUIZ)
    }

    function keypress(e) {
        if (e.key === "Enter" || e.keyCode === 13) {
            start()
        }
    }
});
Class(function AccessibilityIntroVerifyPrompt() {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _text, _verifyPrompt, _resendPrompt;
    (function() {
        initHTML();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        _text = _this.initClass(AccessibilityText, {
            text: Copy.get("INTRODUCTION", "verifyMessage"),
            live: "polite",
            role: "alert",
            tabindex: 0,
            focus: true
        });
        _text.css({
            marginRight: 10
        });
        _verifyPrompt = _this.initClass(AccessibilityButton, {
            text: Copy.get("INTRODUCTION", "verify"),
            live: "polite",
            tabindex: 1
        })
    }

    function addHandlers() {
        _verifyPrompt.events.add(HydraEvents.CLICK, verify)
    }

    function verify() {
        _this.events.fire(QuizEvents.VERIFY)
    }
});
Class(function AccessibilityIntroView() {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _startPrompt, _verifyPrompt, _loginPrompt;
    (function() {
        initHTML();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.LOGGED_OUT, showLoginPrompt);
        _this.events.subscribe(QuizEvents.UNVERIFIED, showVerifyPrompt);
        _this.events.subscribe(QuizEvents.LOGGED_IN, showStartPrompt)
    }

    function showLoginPrompt() {
        if (_loginPrompt) {
            return
        }
        _loginPrompt = _this.initClass(AccessibilityIntroLoginPrompt)
    }

    function showVerifyPrompt() {
        if (_verifyPrompt) {
            return
        }
        removeLoginPrompt();
        _verifyPrompt = _this.initClass(AccessibilityIntroVerifyPrompt)
    }

    function showStartPrompt() {
        if (_startPrompt) {
            return
        }
        removeLoginPrompt();
        removeVerifyPrompt();
        _startPrompt = _this.initClass(AccessibilityIntroStartPrompt)
    }

    function removeLoginPrompt() {
        if (!_loginPrompt) {
            return
        }
        _loginPrompt = _loginPrompt.destroy()
    }

    function removeVerifyPrompt() {
        if (!_verifyPrompt) {
            return
        }
        _verifyPrompt = _verifyPrompt.destroy()
    }
});
Class(function AccessibilityQuizQuestion(_data) {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _text;
    var _answers = [];
    var _nonCorporealComplete;
    var _answerSubmitted;
    (function() {
        initHTML();
        initCopy();
        initAnswers();
        addListeners()
    })();

    function initHTML() {
        $this = _this.element
    }

    function initCopy() {
        if (_data.index === (Config.NON_CORPOREAL - 1) && !_nonCorporealComplete) {
            displayText(Copy.get("NON_CORPOREAL_TEXT"))
        } else {
            if (_data.copy && _data.copy.length) {
                displayText(_data.copy)
            } else {
                var copy = Copy.get("ACCESSIBILITY", "preQuestion");
                if (Mobile.phone || Mobile.tablet) {
                    var copySplit = copy.split(".");
                    if (copySplit.length > 1) {
                        copy = copySplit[0]
                    }
                    displayText(copy)
                } else {
                    displayText(copy)
                }
            }
        }
    }

    function displayText(copy) {
        if (_text && _text.destroy) {
            _text = _text.destroy()
        }
        _text = _this.initClass(AccessibilityText, {
            text: copy,
            live: "polite",
            role: "alert",
            tabindex: 1,
            focus: true
        });
        _text.css({
            marginRight: 10
        })
    }

    function initAnswers() {
        _data.question.answers.forEach(function(d, i) {
            var answer = _this.initClass(AccessibilityButton, {
                text: (i + 1) + ". " + d.answer,
                live: "polite",
                tabindex: i + 2
            });
            answer.css({
                marginRight: 10,
                display: "none"
            });
            answer.id = d.id;
            _answers.push(answer)
        })
    }

    function addListeners() {
        _this.events.subscribe(QuizEvents.START_QUESTION, showAnswers);
        _this.events.subscribe(QuizEvents.NON_CORPOREAL_COMPLETE, nonCorporealComplete)
    }

    function showAnswers() {
        if (_text && _text.destroy) {
            _text = _text.destroy()
        }
        _text = _this.initClass(AccessibilityText, {
            text: Copy.get("ACCESSIBILITY", "answerPrompt"),
            live: "polite",
            tabindex: 1,
            focus: true
        });
        _answers.forEach(function(answer) {
            answer.css({
                display: "inline-block"
            });
            answer.events.add(HydraEvents.CLICK, click)
        });
        _this.events.subscribe(KeyboardUtil.PRESS, keypress)
    }

    function nonCorporealComplete() {
        _nonCorporealComplete = true;
        initCopy()
    }

    function click(e) {
        sendAnswer(e.target.id)
    }

    function keypress(e) {
        for (var i = 0; i < _answers.length; i++) {
            if (e.key === (i + 1).toString() || e.keyCode === (i + 49)) {
                sendAnswer(_answers[i].id, _answers[i].text)
            }
        }
    }

    function sendAnswer(id, answer) {
        if (_answerSubmitted) {
            return
        }
        _answers.forEach(function(answer) {
            answer.disable()
        });
        _this.events.fire(QuizEvents.ANSWER, {
            id: id,
            answer: answer
        });
        _answerSubmitted = true
    }
});
Class(function AccessibilityQuizResult(_data) {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _text, _share, _returnPrompt, _cast, _castMobile;
    (function() {
        initHTML();
        addListeners()
    })();

    function initHTML() {
        $this = _this.element;
        _text = _this.initClass(AccessibilityText, {
            text: Copy.processA(_data.copy, _data.result.id) + " " + Data.Patronus.getData(_data.result.id).name,
            live: "assertive",
            role: "alert",
            tabindex: 1,
            focus: true
        });
        _text.css({
            marginRight: 10
        });
        _share = _this.initClass(AccessibilityShare);
        _returnPrompt = _this.initClass(AccessibilityButton, {
            text: Copy.get("INTRODUCTION", "backProfile"),
            live: "polite",
            tabindex: 10
        });
        if (!Tests.useFallback()) {
            if (Mobile.phone || Mobile.tablet) {
                _castMobile = _this.initClass(AccessibilityButton, {
                    text: Copy.get("ACCESSIBILITY", "castMobile"),
                    live: "polite",
                    tabindex: 10
                });
                _castMobile.css({
                    position: "relative",
                    display: "block"
                })
            } else {
                _cast = _this.initClass(AccessibilityText, {
                    text: Copy.get("ACCESSIBILITY", "cast"),
                    live: "polite",
                    tabindex: 11
                });
                _cast.css({
                    position: "relative",
                    display: "block"
                })
            }
        }
    }

    function addListeners() {
        _returnPrompt.events.add(HydraEvents.CLICK, finished);
        if (_castMobile) {
            _castMobile.events.add(HydraEvents.CLICK, cast)
        }
    }

    function finished() {
        window.location = Config.PROFILE_URL
    }

    function cast() {
        KeyboardUtil.events.fire(KeyboardUtil.PRESS, {
            key: "Enter"
        })
    }
});
Class(function AccessibilityQuizView() {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _question, _result;
    (function() {
        initHTML();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.NEW_QUESTION, newQuestion);
        _this.events.subscribe(QuizEvents.PATRONUS_RECEIVED, endQuiz)
    }

    function newQuestion(data) {
        if (_question) {
            _question.destroy()
        }
        _question = _this.initClass(AccessibilityQuizQuestion, data)
    }

    function endQuiz(data) {
        if (_question) {
            _question.destroy()
        }
        _result = _this.initClass(AccessibilityQuizResult, data)
    }
});
Class(function AccessibilityShare(config) {
    Inherit(this, View);
    var _this = this;
    var _facebook, _twitter, _gplus, _email, _stumbleUpon, _tumblr;
    var $this;
    (function() {
        initHTML();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $this.css({
            display: "block",
            padding: "5px 0"
        });
        _facebook = _this.initClass(AccessibilityIcon, {
            role: "button",
            text: "Share on Facebook",
            live: "polite",
            image: Config.CDN + "assets/images/share/facebook.png",
            tabIndex: 2,
        });
        _twitter = _this.initClass(AccessibilityIcon, {
            role: "button",
            text: "Share on Twitter",
            live: "polite",
            image: Config.CDN + "assets/images/share/twitter.png",
            tabIndex: 3
        });
        _gplus = _this.initClass(AccessibilityIcon, {
            role: "button",
            text: "Share on Google Plus",
            live: "polite",
            image: Config.CDN + "assets/images/share/gplus.png",
            tabIndex: 4
        });
        _email = _this.initClass(AccessibilityIcon, {
            role: "button",
            text: "Share by Email",
            live: "polite",
            image: Config.CDN + "assets/images/share/email.png",
            tabIndex: 5
        });
        _stumbleUpon = _this.initClass(AccessibilityIcon, {
            role: "button",
            text: "Share on StumbleUpon",
            live: "polite",
            image: Config.CDN + "assets/images/share/stumbleUpon.png",
            tabIndex: 6
        });
        _tumblr = _this.initClass(AccessibilityIcon, {
            role: "button",
            text: "Share on Tumblr",
            live: "polite",
            image: Config.CDN + "assets/images/share/tumblr.png",
            tabIndex: 7
        })
    }

    function addHandlers() {
        _facebook.events.add(HydraEvents.CLICK, facebook);
        _twitter.events.add(HydraEvents.CLICK, twitter);
        _gplus.events.add(HydraEvents.CLICK, gplus);
        _email.events.add(HydraEvents.CLICK, email);
        _stumbleUpon.events.add(HydraEvents.CLICK, stumbleUpon);
        _tumblr.events.add(HydraEvents.CLICK, tumblr)
    }

    function share(type) {
        Share.link(type, {
            id: Data.User.getPatronus(),
            name: Data.Patronus.getData(Data.User.getPatronus()).name
        })
    }

    function facebook() {
        share("facebook")
    }

    function twitter() {
        share("twitter")
    }

    function email() {
        share("email")
    }

    function gplus() {
        share("gplus")
    }

    function stumbleUpon() {
        share("stumbleUpon")
    }

    function tumblr() {
        share("tumblr")
    }
});
Class(function AccessibilityButton(config) {
    Inherit(this, View);
    var _this = this;
    var $this;
    var $button;
    (function() {
        initHTML();
        addListeners()
    })();

    function initHTML() {
        $this = _this.element;
        $button = $this.create("button", "button");
        $button.div.setAttribute("role", config.role ? config.role : "button");
        if (config.live) {
            $button.div.setAttribute("aria-live", config.live)
        }
        if (config.tabindex || config.tabindex === 0) {
            $button.div.setAttribute("tabindex", config.tabindex)
        }
        $button.div.innerText = config.text
    }

    function addListeners() {
        if (Mobile.phone || Mobile.tablet) {
            $this.touchClick(click)
        } else {
            $this.click(click)
        }
    }

    function click() {
        _this.events.fire(HydraEvents.CLICK)
    }
    this.text = function(text) {
        $button.div.innerText = text
    };
    this.disable = function() {
        $button.div.setAttribute("disabled", true)
    }
});
Class(function AccessibilityIcon(config) {
    Inherit(this, View);
    var _this = this;
    var $this, $icon;
    (function() {
        initHTML();
        addEventListener()
    })();

    function initHTML() {
        $this = _this.element;
        $icon = $this.create("icon");
        if (config.live) {
            $this.div.setAttribute("aria-live", config.live)
        }
        if (config.role) {
            $this.div.setAttribute("role", config.role)
        }
        if (config.text) {
            $this.div.setAttribute("aria-label", config.text)
        }
        if (config.text) {
            $this.div.setAttribute("alt", config.text)
        }
        if (config.tabIndex) {
            $this.div.setAttribute("tabIndex", config.tabIndex)
        }
        $this.css({
            position: "relative",
            display: "inline-block",
            width: 25,
            height: 25,
            marginRight: 10
        });
        $icon.size("100%").bg(config.image, "contain")
    }

    function addEventListener() {
        if (Mobile.phone || Mobile.tablet) {
            $this.touchClick(click)
        } else {
            $this.click(click)
        }
        $this.keypress(press)
    }

    function press(e) {
        if (e.key === " " || e.key === "Enter") {
            click()
        }
    }

    function click() {
        _this.events.fire(HydraEvents.CLICK)
    }
});
Class(function AccessibilityText(config) {
    Inherit(this, View);
    var _this = this;
    var $this;
    (function() {
        initHTML()
    })();

    function initHTML() {
        $this = _this.element;
        if (config.live) {
            $this.div.setAttribute("aria-live", config.live)
        }
        if (config.role) {
            $this.div.setAttribute("role", config.role)
        }
        if (config.tabindex || config.tabindex === 0) {
            $this.div.setAttribute("tabindex", config.tabindex)
        }
        $this.div.innerText = config.text;
        $this.css({
            position: "relative",
            display: "none"
        });
        _this.delayedCall(function() {
            $this.css({
                display: "inline-block"
            });
            if (config.focus) {
                $this.div.focus()
            }
        })
    }
});
Class(function FallbackBackground() {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _media;
    var _video = Tests.useFallbackVideo();
    _this.loop = false;
    (function() {
        initHTML();
        initViews();
        addEvents();
        size()
    })();

    function initHTML() {
        $this = _this.element;
        $this.setZ(0)
    }

    function initViews() {
        if (_video) {
            _media = _this.initClass(FallbackBackgroundVideo)
        } else {
            _media = _this.initClass(FallbackBackgroundImage)
        }
    }

    function addEvents() {
        _this.events.subscribe(HydraEvents.RESIZE, size)
    }

    function size() {
        _media.resize()
    }

    function showLoop() {
        _this.loop = true;
        var src = _video ? "loop" : "static";
        _media.show(src, true, true, "center")
    }

    function showIntro() {
        var src = "intro";
        _media.show(src, false, true, "left")
    }

    function showPatronus() {
        Data.User.requestPatronus(function() {
            Data.Patronus.getData(Data.User.getPatronus(), function(data) {
                var src = data.id;
                _media.patronus(src, true, true, "center")
            })
        })
    }
    this.result = showPatronus;
    this.intro = showIntro;
    this.quiz = showLoop
});
Class(function FallbackBackgroundImage() {
    Inherit(this, View);
    var _this = this;
    var $this, $image0, $image1, $fade;
    var _video, _fade, _align;
    var _videos = {};
    var _size = {
        width: 1280,
        height: 720
    };
    var _offsetY = 0;
    var _offsetX = 0;
    (function() {
        initHTML()
    })();

    function initHTML() {
        $this = _this.element;
        $fade = $this.create("fade")
    }

    function size() {
        var aspect = 16 / 9;
        var width = (function() {
            if (Stage.width < Stage.height || Stage.height > Stage.width / aspect) {
                return Stage.height * aspect
            }
            return Stage.width
        })();
        var height = width / aspect;
        _offsetY = Math.abs(Stage.height - height) / 2;
        _offsetX = Math.abs(Stage.width - width) / 2;
        $this.css({
            width: width,
            height: height,
            left: 0,
            top: 0,
            zIndex: 0
        }).transform({
            x: -_offsetX,
            y: -_offsetY
        });
        $fade.css({
            width: width,
            height: height,
            top: 0,
            left: 0,
            backgroundColor: "black",
            opacity: 0,
            zIndex: 50,
            display: "none"
        });
        if (_align && $image0) {
            if (Stage.width < Stage.height) {
                $image0.transform({
                    x: 0
                })
            } else {
                $image0.transform({
                    x: _align === "left" ? _offsetX / 2 : 0
                })
            }
        }
    }

    function setImage(src, fade, align) {
        if ($image0) {
            fadeImages(src, fade, align)
        } else {
            $image0 = $this.create("image");
            $image0.size("100%").css({
                overflow: "hidden",
                background: "url(" + src + ".jpg)",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat"
            }).transform({
                z: 1,
                x: align === "left" ? _offsetX / 2 : 0
            }).setZ(100)
        }
    }

    function fadeImages(src, fade, align) {
        var adjust = function() {
            $image1.css({
                zIndex: 100
            });
            $image0.destroy();
            $image0 = $image1;
            $image1 = null;
            _video = _fade;
            _fade = null
        };
        $image1 = $this.create("image");
        $image1.size("100%").css({
            overflow: "hidden",
            background: "url(" + src + ".jpg)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat"
        }).transform({
            z: 1,
            x: align === "left" ? _offsetX / 2 : 0
        });
        $image1.css({
            zIndex: 25
        });
        if (fade) {
            $fade.css({
                display: "block",
                opacity: 1
            }).tween({
                opacity: 0
            }, 1000, "easeOutCubic", 800, function() {
                $fade.css({
                    opacity: 0,
                    display: "none"
                });
                adjust()
            });
            $image0.tween({
                opacity: 0
            }, 1250, "easeOutCubic")
        } else {
            $image0.tween({
                opacity: 0
            }, 1250, "easeOutCubic", adjust)
        }
    }
    this.show = function(src, loop, fade, align) {
        _align = align;
        var path = Config.CDN + "assets/images/fallback/";
        if (Stage.width < 600) {
            path += "small/" + src + "-small"
        } else {
            path += "regular/" + src
        }
        setImage(path, fade, align)
    };
    this.resize = size;
    this.patronus = function(src, loop, fade, align) {
        _align = align;
        var path = Config.CDN + "assets/fallback/images/animals/" + src;
        if (Stage.width < 600) {
            path += "-small"
        }
        setImage(path, fade, align)
    }
});
Class(function FallbackBackgroundVideo() {
    Inherit(this, View);
    var _this = this;
    var $this, $video0, $video1, $fade;
    var _video, _fade;
    var _videos = {};
    var _size = {
        width: 1280,
        height: 720
    };
    (function() {
        initHTML()
    })();

    function initHTML() {
        $this = _this.element;
        $fade = $this.create("fade")
    }

    function createVideo(src, loop) {
        if (!_videos[src]) {
            _videos[src] = new Video({
                width: "100%",
                height: "100%",
                src: src + ".mp4",
                loop: loop || false
            })
        }
        _videos[src].div.load();
        return _videos[src]
    }

    function size() {
        var aspect = 16 / 9;
        var width = (function() {
            if (Stage.width < Stage.height || Stage.height > Stage.width / aspect) {
                return Stage.height * aspect
            }
            return Stage.width
        })();
        var height = width / aspect;
        var offsetY = Math.abs(Stage.height - height) / 2;
        var offsetX = Math.abs(Stage.width - width) / 2;
        $this.css({
            width: width,
            height: height,
            left: 0,
            top: 0,
            zIndex: 0
        }).transform({
            x: -offsetX,
            y: -offsetY
        });
        $fade.css({
            width: width,
            height: height,
            top: 0,
            left: 0,
            backgroundColor: "black",
            opacity: 0,
            zIndex: 50,
            display: "none"
        })
    }

    function setVideo(src, loop, fade) {
        if (_video) {
            fadeVideos(src, loop, fade)
        } else {
            $video0 = $this.create("video");
            $video0.size("100%").css({
                overflow: "hidden"
            }).transform({
                z: 1
            }).setZ(100);
            _video = createVideo(src, loop);
            $video0.add(_video);
            _video.play()
        }
    }

    function fadeVideos(src, loop, fade) {
        _fade = createVideo(src, loop);
        var adjust = function() {
            $video0.css({
                zIndex: 100
            });
            $video1.css({
                zIndex: 0
            });
            $video0.destroy();
            $video0 = $video1;
            $video1 = null;
            _video = _fade;
            _fade = null
        };
        $video1 = $this.create("video");
        $video1.size("100%").css({
            overflow: "hidden"
        }).transform({
            z: 1
        }).setZ(0);
        if (fade) {
            $fade.css({
                display: "block",
                opacity: 1
            }).tween({
                opacity: 0
            }, 1000, "easeOutCubic", 800, function() {
                $fade.css({
                    opacity: 0,
                    display: "none"
                });
                adjust()
            });
            $video0.tween({
                opacity: 0
            }, 1000, "easeOutCubic")
        } else {
            $video0.tween({
                opacity: 0
            }, 250, "easeOutCubic", adjust)
        }
        _video.pause();
        $video1.add(_fade);
        _fade.play()
    }
    this.show = function(src, loop, fade, align) {
        src = Config.CDN + "assets/fallback/videos/" + src;
        setVideo(src, loop, fade)
    };
    this.resize = size;
    this.patronus = function(src, loop, fade, align) {
        var path = Config.CDN + "assets/fallback/videos/animals/" + src;
        setVideo(path, loop, fade)
    }
});
Class(function FallbackCompletedView() {
    Inherit(this, View);
    var _this = this;
    var _share, _back;
    var $this, $result, $share, $castText;
    var _text;
    (function() {
        Data.Patronus.getData(Data.User.getPatronus(), function() {
            initHTML();
            style();
            resize();
            addListeners()
        })
    })();

    function initHTML() {
        $this = _this.element;
        _text = _this.initClass(UICopy, {
            text: Copy.get("INTRODUCTION", "completed"),
            size: Stage.width < 600 ? 18 : 21
        });
        $castText = Stage.create("CastText");
        $result = $this.create(".result");
        $share = $this.create(".share");
        _share = _this.initClass(ShareBtns)
    }

    function style() {
        $this.css({
            color: "#fff",
            textAlign: "center",
            zIndex: 100
        });
        _back = _this.initClass(UIButton, {
            width: Stage.width < 600 ? 180 : 200,
            height: Stage.width < 600 ? 54 : 64,
            text: Copy.get("INTRODUCTION", "backProfile"),
            size: 9
        });
        _back.css({
            top: "",
            bottom: 0,
            marginTop: ""
        });
        _text.element.css({
            width: 260,
            margin: "0 auto 20px auto",
            height: 110
        });
        var text = Data.Patronus.getData(Data.User.getPatronus()).name;
        var size = Stage.width < 600 ? Utils.convertRange(text.length, 20, 40, 28, 16, true) : Utils.convertRange(text.length, 20, 40, 45, 20, true);
        $result.fontStyle("Magorian", size, "#fff");
        $result.css({
            top: 60,
            opacity: 0,
            textAlign: "center",
            textShadow: "0 0 40px rgba(155,155,255,1)",
            width: "100%",
            lineHeight: size,
            whiteSpace: "nowrap"
        });
        $result.text(text);
        _share.css({
            opacity: 0,
            left: 0,
            right: 0,
            margin: "auto",
            position: "relative",
            display: "block"
        });
        $share.fontStyle("Roboto", 9, "#fff");
        $share.css({
            position: "relative",
            opacity: 0,
            display: "block",
            lineHeight: 16,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            margin: Stage.width < 600 ? "-20px auto 10px auto" : "30px auto 10px auto"
        });
        $share.html("SHARE")
    }

    function animateIn() {
        if (!_text) {
            return _this.delayedCall(animateIn, 100)
        }
        _text.animateIn();
        _this.delayedCall(_back.animateIn, 2000);
        $result.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 2000, "easeInOutSine", 1300);
        $share.css({
            opacity: 0
        }).tween({
            opacity: 0.8
        }, 1000, "easeInOutSine", 1500);
        _share.element.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 1000, "easeInOutSine", 1500)
    }

    function addListeners() {
        _back.events.add(HydraEvents.CLICK, finished);
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function finished() {
        window.location = Config.PROFILE_URL
    }

    function resize() {
        if (!Device.mobile || Stage.width > Stage.height) {
            $this.size(300, Device.mobile ? 270 : 290).center(0, 1).css({
                left: "10%",
                marginLeft: "auto"
            });
            if (Stage.width < 500 && Stage.width > Stage.height) {
                $this.center(1, 1)
            }
        } else {
            $this.size(300, 320).center(1, 1)
        }
    }
    this.animateIn = animateIn
});
Class(function FallbackIntroLoginPrompt() {
    Inherit(this, View);
    var _this = this;
    var $this, $or;
    var _iframe, _text, _login, _register;
    (function() {
        initHTML();
        style();
        resize();
        _this.delayedCall(animateIn, Tests.useFallbackVideo() ? 7000 : 2000);
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $or = $this.create("text");
        var size = Stage.width < 600 ? 24 : 34;
        _text = _this.initClass(UICopy, {
            text: Copy.get("INTRODUCTION", "notLoggedIn"),
            size: size
        });
        _login = _this.initClass(UIButton, {
            width: Stage.width < 600 ? 150 : 180,
            height: Stage.width < 600 ? 60 : 70,
            text: Copy.get("INTRODUCTION", "login"),
            size: 11
        });
        _register = _this.initClass(UIButton, {
            width: Stage.width < 600 ? 150 : 180,
            height: Stage.width < 600 ? 60 : 70,
            text: Copy.get("INTRODUCTION", "join"),
            size: 11
        })
    }

    function style() {
        $this.invisible();
        $or.html(Copy.get("INTRODUCTION", "or"));
        $or.fontStyle("Roboto", 10, "#fff").css({
            width: "100%",
            textAlign: "center",
            letterSpacing: 2.4,
            opacity: 0.9,
            textTransform: "uppercase",
            whiteSpace: "nowrap"
        })
    }

    function animateIn() {
        $this.visible();
        _text.animateIn();
        _this.delayedCall(_login.animateIn, 900);
        $or.css({
            opacity: 0
        }).tween({
            opacity: 0.9
        }, 500, "easeOutSine", 1600);
        _this.delayedCall(_register.animateIn, 1500)
    }

    function animateOut() {
        _login.animateOut();
        _register.animateOut();
        $or.tween({
            opacity: 0
        }, 300, "easeOutSine");
        _text.element.tween({
            opacity: 0
        }, 500, "easeOutSine")
    }

    function initIframe(mode) {
        _iframe = _this.initClass(IframeView, {
            mode: mode
        }, [Stage])
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.CLOSE_IFRAME, closeIframe);
        _this.events.subscribe(QuizEvents.OPEN_LOGIN_IFRAME, login);
        _this.events.subscribe(QuizEvents.OPEN_JOIN_IFRAME, join);
        _login.events.add(HydraEvents.CLICK, login);
        _register.events.add(HydraEvents.CLICK, join);
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function login() {
        if (_iframe) {
            return
        }
        Track.event({
            event: "PatronusQuiz",
            action: "login"
        });
        animateOut();
        _this.events.fire(QuizEvents.VERIFY);
        _this.events.subscribe(QuizEvents.STATUS_CHECKED, initLogin)
    }

    function initLogin() {
        _this.events.unsubscribe(QuizEvents.STATUS_CHECKED, initLogin);
        initIframe("login")
    }

    function join() {
        if (_iframe) {
            return
        }
        Track.event({
            event: "PatronusQuiz",
            action: "join"
        });
        animateOut();
        _this.events.fire(QuizEvents.VERIFY);
        _this.events.subscribe(QuizEvents.STATUS_CHECKED, initJoin)
    }

    function initJoin() {
        _this.events.unsubscribe(QuizEvents.STATUS_CHECKED, initJoin);
        initIframe("join")
    }

    function closeIframe() {
        if (!_iframe) {
            return
        }
        _iframe = _iframe.destroy();
        animateIn()
    }

    function resize() {
        if (!Device.mobile || Stage.width > Stage.height) {
            $this.size(360, Device.mobile ? 120 : 200).center(1, 1);
            _login.element.css({
                top: 90,
                left: "50%",
                marginLeft: Mobile.phone ? -180 : -220
            });
            _register.element.css({
                top: 90,
                left: "50%",
                marginLeft: 30
            });
            $or.css({
                top: 85
            });
            _text.resize(28)
        } else {
            $this.size(200, 300).center();
            _login.element.css({
                top: 140,
                left: "50%"
            }).center(1, 0);
            _register.element.css({
                top: 240,
                left: "50%"
            }).center(1, 0);
            $or.css({
                top: 184
            });
            _text.resize(28)
        }
    }
});
Class(function FallbackIntroStartPrompt() {
    Inherit(this, View);
    var _this = this;
    var $this, $text, $wrapper, $line1, $line2, $sub, $startPrompt;
    var _button, _letters;
    (function() {
        initHTML();
        style();
        addHandlers();
        resize();
        _this.delayedCall(animateIn, Tests.useFallbackVideo() ? 7000 : 2000)
    })();

    function initHTML() {
        $this = _this.element;
        $wrapper = $this.create("wrapper");
        $text = $wrapper.create("StartText");
        $line1 = $wrapper.create("line");
        $line2 = $wrapper.create("line");
        $sub = $this.create("sub");
        $startPrompt = $this.create("StartPrompt")
    }

    function style() {
        $this.size(Stage.width < 600 ? 570 : 650, Mobile.phone ? 215 : 230).center().invisible().enable3D(1000).css({
            marginTop: Mobile.phone ? -130 : -150
        });
        $wrapper.size("100%").transformPoint("50%", "30%");
        $text.fontStyle("Magorian", Stage.width < 600 ? 64 : 74, "#fff");
        $text.css({
            width: "100%",
            textAlign: "center",
            whiteSpace: Stage.width < 600 ? "wrap" : "nowrap",
            height: 80
        }).enable3D();
        $text.html(Copy.get("INTRODUCTION", "title"));
        if (Device.browser.ie && Device.browser.version <= 11) {
            $text.css({
                opacity: 0
            }).transform({
                y: 15
            })
        } else {
            _letters = SplitTextfield.split($text)
        }
        $sub.fontStyle("Roboto", Mobile.phone ? Stage.width < 600 ? 8 : 9 : 10, "#fff");
        $sub.css({
            width: "100%",
            textAlign: "center",
            top: Mobile.phone ? 90 : 100,
            lineHeight: Mobile.phone ? 14 : 16,
            letterSpacing: 2,
            opacity: 0.9,
            textTransform: "uppercase",
            whiteSpace: "nowrap"
        });
        $sub.html(Copy.get("INTRODUCTION", "subtitle"));
        _button = _this.initClass(UIButton, {
            width: Stage.width < 600 ? 150 : 180,
            height: Stage.width < 600 ? 60 : 70,
            text: Copy.get("INTRODUCTION", "start"),
            size: 12
        });
        _button.css({
            top: "",
            marginTop: 0,
            bottom: 0
        })
    }

    function animateIn() {
        $this.visible().css({
            opacity: 0.5
        }).tween({
            opacity: 1
        }, 4000, "easeInOutSine");
        if (_letters) {
            var delay = 0;
            for (var i = 0; i < _letters.length; i++) {
                _letters[i].transform({
                    y: 80,
                    rotationY: -90
                }).css({
                    opacity: 0
                }).tween({
                    y: 0,
                    rotationY: 0,
                    opacity: 1
                }, 5000, "easeOutQuint", delay);
                delay += 100;
                if (_letters[i].div.innerHTML.length > 2) {
                    delay += 200
                }
            }
        } else {
            $text.tween({
                opacity: 1,
                y: 0
            }, 1000, "easeInOutSine")
        }
        $sub.css({
            opacity: 0
        }).tween({
            opacity: 0.8
        }, 2000, "easeInOutSine", 3000);
        _this.delayedCall(_button.animateIn, 3500)
    }

    function addHandlers() {
        _button.events.add(HydraEvents.CLICK, start);
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function start() {
        Track.event({
            event: "PatronusQuiz",
            action: "start"
        });
        if (_letters) {
            for (var i = 0; i < _letters.length; i++) {
                _letters[i].tween({
                    y: 40,
                    opacity: 0
                }, 900, "easeInCubic", i * 20)
            }
        } else {
            $text.tween({
                opacity: 0,
                y: -15
            }, 1000, "easeInOutCubic")
        }
        $sub.tween({
            opacity: 0
        }, 500, "easeOutSine");
        _this.events.fire(QuizEvents.START_QUIZ)
    }

    function resize() {
        $wrapper.scale = Utils.convertRange(Stage.width, 200, 800, 0.3, 1, true);
        if (Mobile.phone && Stage.width > Stage.height) {
            $wrapper.scale = 0.6
        }
        $wrapper.transform()
    }
});
Class(function FallbackIntroVerifyPrompt() {
    Inherit(this, View);
    var _this = this;
    var $this, $text, $verifyPrompt;
    var _button;
    (function() {
        initHTML();
        style();
        resize();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $text = $this.create("VerifyText");
        $verifyPrompt = $this.create("VerifyPrompt")
    }

    function style() {
        $this.css({
            position: "static",
            color: "#fff",
            textAlign: "center",
            zIndex: 100
        });
        $text.fontStyle("Magorian", Stage.width < 600 ? 18 : 30, "#fff");
        $text.html(Copy.get("INTRODUCTION", "verifyMessage")).css({
            left: 0,
            right: 0,
            bottom: "50%",
            margin: "auto",
            opacity: 0
        }).transform({
            y: 20
        });
        _button = _this.initClass(UIButton, {
            width: Stage.width < 600 ? 200 : 200,
            height: Stage.width < 600 ? 60 : 70,
            text: Copy.get("INTRODUCTION", "verify")
        });
        _button.css({
            marginTop: -10
        })
    }

    function addHandlers() {
        _button.events.add(HydraEvents.CLICK, verify);
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function verify() {
        Track.event({
            event: "PatronusQuiz",
            action: "verify"
        });
        _this.events.fire(QuizEvents.VERIFY);
        _this.events.subscribe(QuizEvents.UNVERIFIED, resetButton)
    }

    function resetButton() {
        _this.events.unsubscribe(QuizEvents.UNVERIFIED, resetButton);
        _button.animateIn()
    }

    function resize() {
        if (!Device.mobile || Stage.width > Stage.height) {
            $text.size(320, 200).center();
            $text.css({
                fontSize: "30px"
            })
        } else {
            if (Mobile.tablet) {
                $text.size(300, 200).center();
                $text.css({
                    fontSize: "24px"
                })
            } else {
                if (Mobile.phone) {
                    $text.size(220, 200).center();
                    $text.css({
                        fontSize: "18px"
                    })
                }
            }
        }
    }
    this.animateIn = function() {
        $text.tween({
            opacity: 1,
            y: 0
        }, 350, "easeOutCubic");
        _this.delayedCall(_button.animateIn, 200)
    }
});
Class(function FallbackIntroView() {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _startPrompt, _verifyPrompt, _loginPrompt;
    var _login = false;
    (function() {
        initHTML();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $this.css({
            width: "100%",
            height: "100%",
            zIndex: 100
        })
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.LOGGED_OUT, showLoginPrompt);
        _this.events.subscribe(QuizEvents.UNVERIFIED, showVerifyPrompt);
        _this.events.subscribe(QuizEvents.LOGGED_IN, showStartPrompt)
    }

    function showLoginPrompt() {
        if (_loginPrompt) {
            return
        }
        _loginPrompt = _this.initClass(FallbackIntroLoginPrompt);
        _login = true
    }

    function showVerifyPrompt() {
        if (_verifyPrompt) {
            return
        }
        removeLoginPrompt();
        _verifyPrompt = _this.initClass(FallbackIntroVerifyPrompt);
        if (_login) {
            _verifyPrompt.animateIn()
        } else {
            _this.delayedCall(_verifyPrompt.animateIn, 3000)
        }
    }

    function showStartPrompt() {
        if (_startPrompt) {
            return
        }
        removeLoginPrompt();
        removeVerifyPrompt();
        _startPrompt = _this.initClass(FallbackIntroStartPrompt)
    }

    function removeLoginPrompt() {
        if (!_loginPrompt) {
            return
        }
        _loginPrompt = _loginPrompt.destroy()
    }

    function removeVerifyPrompt() {
        if (!_verifyPrompt) {
            return
        }
        _verifyPrompt = _verifyPrompt.destroy()
    }
});
Class(function FallbackQuizAnswer(_data, _size, _comment) {
    Inherit(this, View);
    var _this = this;
    var $this, $answer, $container, $inner, $outer;
    var _letters;
    var _sides = ["top", "bottom", "left", "right"];
    var _animated = false;
    var _click = false;
    (function() {
        initHTML();
        initLines();
        eventListener();
        style();
        if (!_comment) {
            _this.delayedCall(function() {
                if (_letters) {
                    initWidth()
                }
                animateIn()
            }, 200)
        }
    })();

    function initHTML() {
        $this = _this.element;
        $this.css({
            opacity: 0
        });
        $answer = $this.create("answer-text");
        $answer.html(_data.answer);
        _this.id = _data.id;
        _this.text = _data.answer
    }

    function initLines() {
        $container = $this.create("answer-outline");
        $inner = $container.create("answer-outline-inner");
        $outer = $container.create("answer-outline-outer");
        for (var i = 0; i < _sides.length; i++) {
            var side = _sides[i];
            $inner[side] = $inner.create("inner-" + side + "-line");
            $outer[side] = $outer.create("outer-" + side + "-line")
        }
    }

    function initWidth() {
        var width = 0;
        _letters.forEach(function(letter, i) {
            letter.css({
                opacity: 0
            }).transform({
                y: 0,
                rotationY: -80,
                scale: 0.75
            });
            width += letter.div.clientWidth
        });
        width += 1;
        $answer.css({
            width: width,
            left: "50%",
            marginLeft: -(width / 2)
        })
    }

    function style() {
        $this.size(_size.width, _size.height).css({
            zIndex: 800
        });
        if (Device.browser.ie && Device.browser.version <= 11) {
            $answer.css({
                width: "100%",
                textAlign: "center",
                opacity: 0
            })
        } else {
            _letters = SplitTextfield.split($answer)
        }
        $answer.css({
            fontFamily: "CrimsonBold",
            fontSize: Stage.width < 600 ? 18 : 24,
            color: "white",
            height: 25,
            top: "50%",
            marginTop: -(25 / 2),
            overflow: "hidden"
        }).enable3D();
        var innerWidth = _size.width - 10;
        var outerHeight = _size.height - 10;
        $container.size(_size.width, _size.height);
        $inner.size(innerWidth, _size.height).css({
            top: "50%",
            left: "50%",
            marginTop: -(_size.height / 2),
            marginLeft: -((innerWidth) / 2)
        });
        $outer.size(_size.width, outerHeight).css({
            top: "50%",
            left: "50%",
            marginTop: -((outerHeight) / 2),
            marginLeft: -(_size.width / 2)
        });
        _sides.forEach(function(side) {
            $inner[side].css({
                backgroundColor: "white"
            }).transformPoint("50%", "50%");
            $outer[side].css({
                backgroundColor: "white"
            }).transformPoint("50%", "50%");
            if (side === "left" || side === "right") {
                $inner[side].css({
                    width: 1,
                    height: _size.height,
                    left: side === "left" ? 0 : "auto",
                    right: side === "right" ? 0 : "auto"
                });
                $outer[side].css({
                    width: 1,
                    height: outerHeight,
                    left: side === "left" ? 0 : "auto",
                    right: side === "right" ? 0 : "auto"
                });
                if (Device.browser.ie && Device.browser.version <= 11) {
                    $inner[side].css({
                        opacity: 0
                    });
                    $outer[side].css({
                        opacity: 0
                    })
                } else {
                    $inner[side].transform({
                        scaleY: 0
                    });
                    $outer[side].transform({
                        scaleY: 0
                    })
                }
            } else {
                $inner[side].css({
                    width: innerWidth,
                    height: 1,
                    top: side === "top" ? 0 : "auto",
                    bottom: side === "bottom" ? 0 : "auto"
                });
                $outer[side].css({
                    width: _size.width,
                    height: 1,
                    top: side === "top" ? 0 : "auto",
                    bottom: side === "bottom" ? 0 : "auto"
                });
                if (Device.browser.ie && Device.browser.version <= 11) {
                    $inner[side].css({
                        opacity: 0
                    });
                    $outer[side].css({
                        opacity: 0
                    })
                } else {
                    $inner[side].transform({
                        scaleX: 0
                    });
                    $outer[side].transform({
                        scaleX: 0
                    })
                }
            }
        })
    }

    function eventListener() {
        $this.interact(hover, click)
    }

    function hover(e) {
        if (!_animated) {
            return
        }
        if (_click) {
            return
        }
        if (e.action === "over") {
            _sides.forEach(function(side) {
                if (Device.browser.ie && Device.browser.version <= 11) {
                    $inner[side].css({
                        opacity: 1
                    });
                    $outer[side].css({
                        opacity: 1
                    })
                } else {
                    if (side === "left" || side === "right") {
                        $inner[side].tween({
                            scaleY: 1
                        }, 800, "easeInOutQuart", 200);
                        $outer[side].tween({
                            scaleY: 1
                        }, 1000, "easeInOutQuart", 0)
                    } else {
                        $inner[side].tween({
                            scaleX: 1
                        }, 1000, "easeInOutQuart", 200);
                        $outer[side].tween({
                            scaleX: 1
                        }, 800, "easeInOutQuart", 0)
                    }
                }
            })
        } else {
            _sides.forEach(function(side) {
                if (Device.browser.ie && Device.browser.version <= 11) {
                    $inner[side].css({
                        opacity: 0
                    });
                    $outer[side].css({
                        opacity: 0
                    })
                } else {
                    if (side === "left" || side === "right") {
                        $inner[side].tween({
                            scaleY: 0
                        }, 400, "easeInOutQuart", 350);
                        $outer[side].tween({
                            scaleY: 0
                        }, 700, "easeInOutQuart")
                    } else {
                        $inner[side].tween({
                            scaleX: 0
                        }, 400, "easeInOutQuart", 350);
                        $outer[side].tween({
                            scaleX: 0
                        }, 900, "easeInOutQuart")
                    }
                }
            })
        }
    }

    function click() {
        if (!_animated) {
            return
        }
        _click = true;
        _this.events.fire(HydraEvents.CLICK, _data)
    }

    function animateIn() {
        $this.css({
            opacity: 1
        });
        if (_letters) {
            var delay = 0;
            _letters.forEach(function(letter, i) {
                letter.tween({
                    y: 0,
                    rotationY: 0,
                    opacity: 1,
                    scale: 1
                }, 3000, "easeOutQuint", 500 + delay);
                delay += 100
            });
            _this.delayedCall(function() {
                _animated = true
            }, (_letters.length * 50))
        } else {
            $answer.tween({
                opacity: 1
            }, 750, "easeOutCubic", function() {
                _animated = true
            })
        }
    }
    this.animateOut = function(callback) {
        if (_click) {
            _sides.forEach(function(side) {
                if (Device.browser.ie && Device.browser.version <= 11) {
                    $inner[side].css({
                        opacity: 0
                    });
                    $outer[side].css({
                        opacity: 0
                    })
                } else {
                    if (side === "left" || side === "right") {
                        $inner[side].stopTween().tween({
                            scaleY: 1,
                            opacity: 0
                        }, 400, "easeOutCubic", 200);
                        $outer[side].stopTween().tween({
                            scaleY: 1,
                            opacity: 0
                        }, 600, "easeOutCubic", 0)
                    } else {
                        $inner[side].stopTween().tween({
                            scaleX: 1,
                            opacity: 0
                        }, 600, "easeOutCubic", 200);
                        $outer[side].stopTween().tween({
                            scaleX: 1,
                            opacity: 0
                        }, 400, "easeOutCubic", 0)
                    }
                }
            })
        }
        if (_letters) {
            _letters.forEach(function(letter, i) {
                if (i === _letters.length - 1) {
                    letter.tween({
                        rotationY: 80,
                        opacity: 0,
                        scale: 0.85
                    }, 800, "easeInOutQuart", function() {
                        if (callback) {
                            callback()
                        }
                    })
                } else {
                    letter.tween({
                        rotationY: 80,
                        opacity: 0,
                        scale: 0.85
                    }, 800, "easeInOutQuart")
                }
            })
        } else {
            $answer.tween({
                opacity: 0
            }, 450, "easeOutCubic", function() {
                if (callback) {
                    callback()
                }
            })
        }
    };
    this.animateIn = function() {
        if (_letters) {
            initWidth()
        }
        defer(animateIn)
    }
});
Class(function FallbackQuizComment(_text) {
    Inherit(this, View);
    var _this = this;
    var $this, $quote;
    var _letters = [];
    var _lines = [];
    (function() {
        initHTML();
        initLines();
        style();
        addListeners();
        _this.delayedCall(function() {
            if (_letters.length >= 1) {
                initWidth()
            }
            animateIn()
        }, 200)
    })();

    function initHTML() {
        $this = _this.element;
        $this.css({
            opacity: 0
        });
        $quote = $this.create("quote")
    }

    function initLines() {
        var line = [];
        var lines = [];
        var newline = false;
        if (Stage.width < 600) {
            var length = 28
        }
        for (var i = 0; i < _text.length; i++) {
            var letter = _text[i];
            if (letter === " " && line.length <= 0) {
                continue
            }
            if (letter.indexOf("\n") >= 0) {
                letter = " "
            }
            if (length && line.length >= length && letter === " ") {
                newline = true
            }
            if (newline || letter === "!" || letter === "." || letter === "?") {
                line.push(letter);
                newline = false;
                if (letter === "." && _text[i + 1] === ".") {
                    continue
                }
                if (i < _text.length - 1 && letter === "." && length && line.length < length) {
                    continue
                }
                if (line.length >= 1) {
                    lines.push(line)
                }
                line = []
            } else {
                line.push(letter);
                if (!_text[i + 1]) {
                    lines.push(line)
                }
            }
        }
        lines.forEach(function(str) {
            var line = $quote.create("quote-line");
            str = str.join("");
            line.html(str);
            _lines.push(line);
            if (!Device.browser.ie || (Device.browser.ie && Device.browser.version >= 12)) {
                var split = SplitTextfield.split(line);
                _letters.push(split)
            }
        })
    }

    function initWidth() {
        var size = 0;
        var widths = [];
        var offset = 30;
        var height = _lines.length * offset;
        _letters.forEach(function(line, i) {
            var width = 0;
            line.forEach(function(letter) {
                letter.css({
                    opacity: 0
                }).transform({
                    y: 0,
                    rotationY: -80,
                    scale: 0.75
                });
                width += letter.div.clientWidth
            });
            widths.push(width)
        });
        widths.forEach(function(width, i) {
            if (width > size) {
                size = width
            }
            _lines[i].css({
                width: width + 5,
                height: offset,
                top: i * offset,
                left: "50%",
                marginLeft: -(width + 5) / 2
            })
        });
        size += 5;
        $quote.css({
            width: size,
            left: "50%",
            marginLeft: -(size) / 2,
            height: height,
            top: "50%",
            marginTop: -(height) / 2
        });
        $this.size(Stage.width, height).css({
            top: "50%",
            marginTop: -(height / 2)
        })
    }

    function style() {
        $this.size(Stage.width, 100);
        $quote.css({
            fontFamily: "Magorian",
            fontSize: Stage.width < 600 ? 18 : 24,
            color: "white",
            overflow: "hidden"
        }).enable3D();
        if (Device.browser.ie && Device.browser.version <= 11) {
            var offset = 30;
            var height = _lines.length * offset;
            var size = Stage.width;
            _lines.forEach(function(line, i) {
                line.css({
                    width: "100%",
                    textAlign: "center",
                    top: i * offset,
                    opacity: 0
                }).transform({
                    y: 10
                })
            });
            $quote.css({
                width: Stage.width,
                height: height,
                top: "50%",
                marginTop: -(height) / 2
            });
            $this.size(Stage.width, height).css({
                top: "50%",
                marginTop: -(height / 2)
            })
        }
    }

    function addListeners() {
        _this.events.subscribe(HydraEvents.RESIZE, style)
    }

    function animateIn() {
        $this.css({
            opacity: 1,
            zIndex: 10
        });
        if (_letters.length >= 1) {
            var delay = 0;
            _letters.forEach(function(line, i) {
                line.forEach(function(letter, k) {
                    if (i === _letters.length - 1 && k === line.length - 1) {
                        letter.tween({
                            opacity: 1,
                            scale: 1,
                            rotationY: 0
                        }, 750, "easeOutQuart", delay, function() {
                            _this.delayedCall && _this.delayedCall(animateOut, 1250)
                        })
                    } else {
                        letter.tween({
                            opacity: 1,
                            scale: 1,
                            rotationY: 0
                        }, 750, "easeOutQuart", delay)
                    }
                    delay += 25
                });
                delay += 450
            })
        } else {
            _lines.forEach(function(line, i) {
                line.tween({
                    opacity: 1,
                    y: 0
                }, 375, "easeInOutCubic", i * 100)
            });
            _this.delayedCall && _this.delayedCall(animateOut, 1600)
        }
    }

    function animateOut() {
        _lines.forEach(function(line, i) {
            if (i === _lines.length - 1) {
                line.tween({
                    opacity: 0
                }, 450, "easeOutQuart", i * 75, function() {
                    _this.events.fire(HydraEvents.UPDATE);
                    $this.hide();
                    Logic.instance().resetTimer()
                })
            } else {
                line.tween({
                    opacity: 0
                }, 450, "easeOutQuart", i * 75)
            }
        })
    }
});
Class(function FallbackQuizQuestion(_data, _parent) {
    Inherit(this, View);
    var _this = this;
    var $this, $answers;
    var _comment;
    var _answers = [];
    var _size = {
        width: Stage.width < 600 ? 85 : 150,
        height: Stage.width < 600 ? 50 : 75
    };
    (function() {
        initHTML();
        style();
        addListeners()
    })();

    function initHTML() {
        $this = _this.element;
        $answers = $this.create("answers-container");
        if (_data.copy && _data.copy.length) {
            _comment = _this.initClass(FallbackQuizComment, _data.copy)
        }
        _data.question.answers.forEach(function(d, i) {
            var answer = _this.initClass(FallbackQuizAnswer, d, _size, _comment ? true : false, [$answers]);
            _answers.push(answer)
        })
    }

    function style() {
        var padding = Stage.width < 600 ? 10 : 75;
        var width = (_answers.length * _size.width) + (padding * (_answers.length - 1));
        $this.size("100%");
        $answers.css({
            width: width,
            height: _size.height,
            color: "#fff",
            textAlign: "center",
            top: "50%",
            left: "50%",
            marginTop: -(_size.height) / 2,
            marginLeft: -(width) / 2
        });
        _answers.forEach(function(answer, i) {
            answer.element.transform({
                x: i * (_size.width + padding)
            })
        })
    }

    function addListeners() {
        if (_answers) {
            _answers.forEach(function(answer) {
                answer.events.add(HydraEvents.CLICK, sendAnswer)
            })
        }
        if (_comment) {
            _comment.events.add(HydraEvents.UPDATE, animateIn)
        }
    }

    function animateIn() {
        _answers.forEach(function(answer, i) {
            answer.animateIn()
        })
    }

    function sendAnswer(e) {
        var data = e;
        if (data) {
            var fire = function() {
                _this.events && _this.events.fire(QuizEvents.ANSWER, {
                    id: data.id,
                    answer: data.answer
                })
            }
        }
        _answers.forEach(function(answer, i) {
            if (i === _answers.length - 1) {
                answer.animateOut(fire)
            } else {
                answer.animateOut()
            }
        })
    }
});
Class(function FallbackQuizResult(_data) {
    Inherit(this, View);
    var _this = this;
    var _share, _back;
    var $this, $text, $result, $share, $returnPrompt, $castText;
    var _text;
    var _textCopy;
    (function() {
        initHTML();
        style();
        resize();
        addListeners();
        animateIn()
    })();

    function initHTML() {
        $this = _this.element;
        _textCopy = Copy.processA(_data.copy, _data.result.id);
        _text = _this.initClass(UICopy, {
            text: _textCopy,
            size: 21
        });
        $castText = Stage.create("CastText");
        $result = $this.create(".result");
        $share = $this.create(".share");
        _share = _this.initClass(ShareBtns);
        $returnPrompt = $this.create("ReturnPrompt")
    }

    function style() {
        $this.css({
            color: "#fff",
            textAlign: "center",
            zIndex: 100
        });
        _back = _this.initClass(UIButton, {
            width: Stage.width < 600 ? 180 : 200,
            height: Stage.width < 600 ? 54 : 64,
            text: Copy.get("INTRODUCTION", "backProfile"),
            size: 9
        });
        _back.css({
            top: "",
            bottom: 0,
            marginTop: ""
        });
        _text.element.css({
            width: 260,
            margin: "0 auto 20px auto",
            height: 110
        });
        var text = Data.Patronus.getData(Data.User.getPatronus()).name;
        var size = Stage.width < 600 ? Utils.convertRange(text.length, 20, 40, 28, 16, true) : Utils.convertRange(text.length, 20, 40, 45, 20, true);
        $result.fontStyle("Magorian", size, "#fff");
        $result.css({
            top: 60,
            opacity: 0,
            textAlign: "center",
            textShadow: "0 0 40px rgba(155,155,255,1)",
            width: "100%",
            lineHeight: size,
            whiteSpace: "nowrap"
        });
        $result.text(text);
        _share.css({
            opacity: 0,
            left: 0,
            right: 0,
            margin: "auto",
            position: "relative",
            display: "block"
        });
        $share.fontStyle("Roboto", 9, "#fff");
        $share.css({
            position: "relative",
            opacity: 0,
            display: "block",
            lineHeight: 16,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            margin: Stage.width < 600 ? "-20px auto 10px auto" : "30px auto 10px auto"
        });
        $share.html("SHARE")
    }

    function animateIn() {
        _text.animateIn();
        _this.delayedCall(_back.animateIn, 2000);
        $result.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 2000, "easeInOutSine", 1300);
        $share.css({
            opacity: 0
        }).tween({
            opacity: 0.8
        }, 1000, "easeInOutSine", 1500);
        _share.element.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 1000, "easeInOutSine", 1500)
    }

    function addListeners() {
        _back.events.add(HydraEvents.CLICK, finished);
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function finished() {
        Track.event({
            event: "PatronusQuiz",
            action: "Return"
        });
        window.location = Config.PROFILE_URL
    }

    function resize() {
        if (!Device.mobile || Stage.width > Stage.height) {
            $this.size(300, Device.mobile ? 270 : 290).center(0, 1).css({
                left: "10%",
                marginLeft: "auto"
            });
            if (Stage.width < 500 && Stage.width > Stage.height) {
                $this.center(1, 1)
            }
        } else {
            $this.size(300, 320).center(1, 1)
        }
    }
});
Class(function FallbackQuizView() {
    Inherit(this, View);
    var _this = this;
    var $this;
    var _question, _result;
    (function() {
        initHTML();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $this.css({
            position: "static"
        })
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.NEW_QUESTION, newQuestion);
        _this.events.subscribe(QuizEvents.PATRONUS_RECEIVED, endQuiz)
    }

    function newQuestion(data) {
        if (_question) {
            _question.destroy()
        }
        _question = _this.initClass(FallbackQuizQuestion, data, $this);
        _this.events.fire(QuizEvents.START_QUESTION)
    }

    function endQuiz(data) {
        if (_question) {
            _question.destroy()
        }
        _result = _this.initClass(FallbackQuizResult, data)
    }
});
Class(function EtherealBehavior() {
    Inherit(this, Component);
    var _this = this;
    var _preventCull;
    var _target = new Vector3();
    var _delta = new Vector3();
    var _strength = 0.001 * 0.85;
    var _strengthMultiplier = 1;
    var _radius = 10;
    var _radiusSq = _radius * _radius;
    (function() {})();

    function init(p) {
        p.decay = (Utils.doRandom(70, 150) / 100) * 0.02 * 1.3;
        p.speedX = Utils.doRandom(50, 150) / 100;
        p.speedY = Utils.doRandom(50, 150) / 100;
        p.speedZ = Utils.doRandom(50, 150) / 100;
        p.rangeX = Utils.doRandom(-100, 100) / 100;
        p.rangeY = Utils.doRandom(-100, 100) / 100;
        p.rangeZ = Utils.doRandom(-100, 100) / 100
    }
    this.applyBehavior = function(p) {
        if (!p.enabled) {
            return
        }
        if (!p.decay) {
            init(p)
        }
        _delta.copyFrom(_target).sub(p.pos);
        var distSq = _delta.lengthSq();
        if (distSq < _radiusSq && distSq > 0.000001) {
            _delta.normalize().multiply(1 - distSq / _radiusSq);
            if (p.forceStrength == 0) {
                p.acc.add(_delta.multiply(-_strength * 0.1 * p.rand * _strengthMultiplier * p.life))
            }
            p.acc.add(_delta.multiply(_strength * p.rand * _strengthMultiplier * p.life))
        }
        var behindCamera = false;
        if (!_preventCull) {
            _delta.copyFrom(_this.cameraPos).sub(p.pos);
            distSq = _delta.lengthSq();
            if (distSq > 10.5 * 10.5) {
                behindCamera = true
            }
        }
        _delta.x = Math.sin(Render.TIME * 0.0075 * p.speedX) * p.rangeX;
        _delta.y = Math.sin(Render.TIME * 0.0075 * p.speedY) * p.rangeY;
        _delta.z = Math.sin(Render.TIME * 0.0075 * p.speedZ) * p.rangeZ;
        p.pos.add(_delta.multiply(0.005));
        p.life -= p.decay;
        if (p.life <= 0 || behindCamera) {
            _this.events.fire(HydraEvents.COMPLETE, p)
        }
    };
    this.update = function(e) {
        _target.copy(e.pos)
    };
    this.arrived = function() {
        _preventCull = true
    }
});
Class(function EtherealInteraction() {
    Inherit(this, Component);
    var _this = this;
    var _casting, _castPoints, _light, _dist;
    var _camera = Camera.instance();
    var _stage = new Vector2();
    var _v2last = new Vector2();
    var _v2vel = new Vector2();
    var _projection = new ScreenProjection(World.CAMERA);
    var _pos = new Vector3();
    var _velocity = new Vector3();
    var _last = new Vector3();
    var _evt = {};
    var _quaternion = {};
    var _mid = new Vector2();
    var CAMERA_DIST = 10;
    this.debug = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial());
    (function() {
        initLight();
        Render.start(loop)
    })();

    function initLight() {
        _light = ForestLighting.instance().getEtheralLight();
        _light.color.set(13493479);
        _light.intensity = 1.2;
        _light.distance = 20;
        _light.target = new THREE.Vector3()
    }

    function getQuaternion() {
        _quaternion.x = World.CAMERA.quaternion.x;
        _quaternion.y = World.CAMERA.quaternion.y;
        _quaternion.z = World.CAMERA.quaternion.z;
        _quaternion.w = World.CAMERA.quaternion.w;
        return _quaternion
    }

    function loop(t, dt, delta) {
        var dist = Utils.range(Mouse.y, 0, Stage.height, 10, 3);
        var cameraVel = Math.abs(_camera.velocity.z);
        var flying = cameraVel > 0.1;
        _dist = Utils.mix(dist, CAMERA_DIST, Utils.range(cameraVel, 0, 0.1, 0, 1, true));
        _projection.camera = World.CAMERA;
        var v3 = _projection.unproject(Mouse, _dist);
        _this.debug.position.copy(v3);
        _pos.copy(v3);
        _velocity.subVectors(_pos, _last).divide(delta).multiply(2);
        _last.copy(_pos);
        _light.position.lerp(_projection.unproject(Mouse, 10), 0.07);
        _evt.vel = _velocity;
        _evt.pos = _pos;
        _evt.velLength = _velocity.length();
        _evt.quaternion = getQuaternion();
        _evt.cameraPos = World.CAMERA.position;
        _evt.vel2Length = flying ? 1 : _v2vel.length();
        _this.update && _this.update(_evt);
        _v2vel.copy(Mouse);
        _v2vel.subVectors(Mouse, _v2last).divide(delta).multiply(2);
        _v2last.copy(Mouse)
    }

    function castStart() {
        var invMat = new THREE.Matrix4().getInverse(ForestLakeTile.instance.group.matrixWorld);
        var origin = _projection.unproject(Mouse, _dist * 3.5).clone().applyMatrix4(invMat);
        _casting = null;
        var move = 0;
        _castPoints = [origin];
        var touchMove = function(e) {
            if (!_castPoints) {
                return Stage.unbind("touchmove", touchMove)
            }
            _castPoints.push(_projection.unproject(Mouse, _dist * 3.5).clone().applyMatrix4(invMat));
            if (_castPoints.length > 30) {
                _castPoints.shift()
            }
            if (move++ > 100) {
                castEnd()
            }
        };
        Stage.bind("touchmove", touchMove);
        AudioController.onCastStart()
    }

    function castEnd() {
        if (!_castPoints || _castPoints.length < 3) {
            return
        }
        Stage.unbind("touchstart", castStart);
        Stage.unbind("touchend", castEnd);
        _this.events.fire(EtherealInteraction.CAST, {
            pos: _castPoints[0],
            points: _castPoints
        });
        _castPoints = null;
        Track.cast();
        AudioController.onCastEnd()
    }
    this.cast = function(target) {
        _casting = target.clone().applyMatrix4(ForestLakeTile.instance.group.matrixWorld);
        _v2vel.high = 0;
        Stage.bind("touchstart", castStart);
        Stage.bind("touchend", castEnd)
    };
    this.stop = function() {
        Render.stop(loop)
    };
    this.start = function() {
        Render.start(loop)
    };
    this.onDestroy = function() {
        Render.stop(loop)
    }
}, function() {
    EtherealInteraction.CAST = "ethereal_cast"
});
Class(function EtherealThreadBase() {
    Inherit(this, Component);
    var _this = this;
    var _behavior, _emitter;
    var _reduction = 1;
    var _system = Global.SYSTEM;
    var _converter = Global.CONVERTER;
    var _quaternion = new THREE.Quaternion();
    var _v3 = new THREE.Vector3();
    var _last = new Vector3();
    var _pos = new Vector3();
    var _values = {};
    (function() {
        initEmitter();
        initParticles();
        initBehavior()
    })();

    function initEmitter() {
        _emitter = _this.initClass(Emitter, new Vector3(), 0);
        _emitter.persist = true;
        _system.addEmitter(_emitter);
        _emitter.addInitializer(function(p) {
            p.life = 1;
            p.pos.copy(_pos);
            p.pos.addAngleRadius(Utils.toRadians(Utils.doRandom(0, 360)), (Utils.doRandom(0, 200) / 2000) * _values.radius);
            _v3.copy(p.pos).sub(_pos).applyQuaternion(_quaternion).add(_pos);
            p.pos.copy(_v3);
            p.vel.copy(_values.vel);
            p.vel.x += Utils.doRandom(-10, 10) / 8000;
            p.vel.y += Utils.doRandom(-10, 10) / 8000;
            p.vel.z = 0;
            p.forceStrength = _values.velLength
        })
    }

    function initParticles() {
        var p = _system.particles.start();
        while (p) {
            _emitter.addToPool(p);
            p.pos.x = Number.POSITIVE_INFINITY;
            p.life = 1;
            p.ax = Utils.doRandom(0, 100) / 100;
            p.ay = Utils.doRandom(0, 100) / 100;
            p.az = Utils.doRandom(0, 100) / 100;
            p.rand = Utils.doRandom(50, 150) / 100;
            p = _system.particles.next()
        }
        _converter.addAttribute("life", ["life"]);
        var attribs = _converter.addAttribute("attribs", ["ax", "ay", "az"]);
        Global.emit();
        attribs.disabled = true
    }

    function initBehavior() {
        _behavior = new EtherealBehavior();
        _system.addBehavior(_behavior);
        _behavior.events.add(HydraEvents.COMPLETE, resetParticle)
    }

    function resetParticle(p) {
        p.pos.x = Number.POSITIVE_INFINITY;
        _emitter.remove(p)
    }
    this.init = function(e) {
        _reduction = e.reduction
    };
    this.emit = function(e) {
        var percent = e.percent;
        _behavior.cameraPos = e.cameraPos;
        _values = e;
        _behavior.update(e);
        _values.radius = Utils.range(e.velLength, 0, 0.02, 1, 2);
        _quaternion.copy(e.quaternion);
        var iterations = Math.max(1, ~~((10 * _reduction) * percent));
        for (var i = 0; i < iterations; i++) {
            _pos.copy(_last).lerp(e.pos, i / iterations);
            if (e.vel2Length > 0.01) {
                _emitter.emit(100 * _reduction * percent)
            }
        }
        _last.copy(e.pos)
    };
    this.arrived = function() {
        _behavior.arrived()
    }
});
Class(function ForestBG() {
    Inherit(this, Component);
    var _this = this;
    var _shader, _attach;
    this.group = new THREE.Group();
    (function() {
        initMesh();
        initStars();
        if (!Tests.embedded()) {
            initGlow()
        }
        addListeners();
        Render.start(loop)
    })();

    function initMesh() {
        var geom = new THREE.IcosahedronGeometry(110, 3);
        _shader = _this.initClass(Shader, "ForestBG", "ForestBG");
        _shader.uniforms = {
            time: {
                type: "f",
                value: 0
            },
            hue: {
                type: "f",
                value: 0.5
            },
            brightness: {
                type: "f",
                value: 0.4
            },
            base: {
                type: "c",
                value: new THREE.Color(331029)
            },
        };
        _shader.material.side = THREE.BackSide;
        var mesh = new THREE.Mesh(geom, _shader.material);
        _this.group.add(mesh);
        FX.Fog.instance().add(mesh).material.side = THREE.BackSide;
        defer(function() {
            _this.attach(Camera.instance().worldCamera)
        })
    }

    function initGlow() {
        var texture = Utils3D.getTexture("assets/images/forest/trees.png");
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        var geom = new THREE.SphereBufferGeometry(100, 10, 10, 0, Utils.toRadians(360), Utils.toRadians(60), Utils.toRadians(40));
        var shader = _this.initClass(Shader, "BGTrees");
        shader.uniforms = {
            tMap: {
                type: "t",
                value: texture
            },
            uRepeat: {
                type: "v2",
                value: new THREE.Vector2(6, 1)
            },
        };
        shader.material.side = THREE.BackSide;
        var mesh = new THREE.Mesh(geom, shader.material);
        _this.group.add(mesh);
        _this.group.position.y = -10
    }

    function loop(t, dt) {
        _shader.uniforms.hue.value += 0.0002;
        if (_shader.uniforms.hue.value > 1) {
            _shader.uniforms.hue.value -= 1
        }
        _shader.set("time", dt * 0.00015);
        if (_attach) {
            _this.group.position.x = _attach.position.x;
            _this.group.position.z = _attach.position.z
        }
    }

    function initStars() {
        _this.group.add(_this.initClass(ForestBGStars).mesh)
    }

    function addListeners() {
        _this.events.subscribe(ForestWaterShader.RENDER, waterRender)
    }

    function waterRender(e) {
        _this.group.visible = e.visible
    }
    this.attach = function(group) {
        _attach = group
    }
}, "singleton");
Class(function ForestBGStars() {
    Inherit(this, Component);
    var _this = this;
    var _geom;
    var COUNT = 350;
    (function() {
        initGeometry();
        initMesh()
    })();

    function initGeometry() {
        _geom = new THREE.BufferGeometry();
        var vector = new Vector3();
        var matrix = new Matrix4();
        var position = new Float32Array(COUNT * 3);
        var scale = new Float32Array(COUNT);
        for (var i = 0; i < COUNT; i++) {
            vector.set(1, 0, 0);
            matrix.identity().setRotation(0, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
            matrix.transformVector(vector);
            vector.multiply(100);
            position[i * 3 + 0] = vector.x;
            position[i * 3 + 1] = Math.abs(vector.y);
            position[i * 3 + 2] = vector.z;
            scale[i] = Utils.doRandom(30, 120) / 100
        }
        _geom.addAttribute("position", new THREE.BufferAttribute(position, 3));
        _geom.addAttribute("scale", new THREE.BufferAttribute(scale, 1))
    }

    function initMesh() {
        var shader = new Shader("Stars", "Stars");
        shader.uniforms = {
            size: {
                type: "f",
                value: 12 * World.DPR
            },
            tFlare: {
                type: "t",
                value: Utils3D.getTexture("assets/images/forest/flare.jpg")
            },
            tCenter: {
                type: "t",
                value: Utils3D.getTexture("assets/images/forest/center.jpg")
            },
            tMap: {
                type: "t",
                value: Utils3D.getTexture("assets/images/forest/map.jpg")
            },
            resolution: {
                type: "v2",
                value: new Vector2(75, 75)
            }
        };
        shader.material.transparent = true;
        shader.material.depthWrite = false;
        shader.material.blending = THREE.AdditiveBlending;
        _this.mesh = new THREE.Points(_geom, shader.material)
    }
});
Class(function ForestCamera(_data) {
    Inherit(this, Component);
    var _this = this;
    var _group, _translation, _wiggle;
    var _lookAt = new THREE.Vector3(0, 0, 1);
    var _world = this.worldCamera = createCam();
    var _local = createCam();
    var _mid = new Vector2();
    var _mouse = new Vector2();
    var _accel = Mobile.Accelerometer;
    _this.strength = 1;
    _this.data = _data;
    _this.translationStrength = 1;
    (function() {
        _accel.capture();
        initLocal();
        addListeners();
        Render.start(loop)
    })();

    function initLocal() {
        _group = new THREE.Group();
        _wiggle = new THREE.Group();
        _wiggle.behavior = new WiggleBehavior(_wiggle.position);
        _group.add(_wiggle);
        _wiggle.behavior.scale *= 0.01 * 0.7;
        _wiggle.behavior.speed *= 0.6;
        _wiggle.behavior.startRender();
        _translation = new THREE.Group();
        _wiggle.add(_translation);
        _translation.add(_local);
        _local.target = new Vector3();
        _local.pos = new Vector3();
        _translation.target = new Vector3();
        _translation.pos = new Vector3();
        if (_data) {
            _group.position.set(_data.position[0], _data.position[1], _data.position[2]);
            _group.rotation.x = _data.rotation[0];
            _group.rotation.y = _data.rotation[1];
            _group.rotation.z = _data.rotation[2]
        }
        _this.group = _group
    }

    function createCam() {
        return new THREE.PerspectiveCamera(45, Stage.width / Stage.height, 0.1, 200)
    }

    function loop() {
        if (!Device.mobile || _this.isTouching) {
            _mouse.x = Mouse.x;
            _mouse.y = Mouse.y
        }
        _local.target.x = -Utils.range(_mouse.x, 0, Stage.width, 1, -1) * 0.07 * _this.strength;
        _local.target.y = Utils.range(_mouse.y, 0, Stage.height, -1, 1) * 0.07 * _this.strength;
        _local.pos.lerp(_local.target, 0.02);
        _local.pos.copyTo(_local.position);
        _local.lookAt(_lookAt);
        _translation.target.x = -Utils.range(_mouse.x, 0, Stage.width, 1, -1) * 0.9 * _this.strength * _this.translationStrength;
        _translation.target.y = Utils.range(_mouse.y, 0, Stage.height, -1, 1) * 0.9 * _this.strength * _this.translationStrength;
        _translation.pos.lerp(_translation.target, 0.05);
        _translation.pos.copyTo(_translation.position);
        _group.updateMatrixWorld();
        Utils3D.decompose(_local, _world);
        AudioController.updateCameraTarget(_mouse.x, _mouse.y);
        if (Device.mobile && !_this.isTouching) {
            _mid.set(Stage.width * 0.5, Stage.height * 0.5);
            _mouse.x += (_mid.x - _mouse.x) * 0.1;
            _mouse.y += (_mid.y - _mouse.y) * 0.1
        }
    }

    function addListeners() {
        _this.events.subscribe(HydraEvents.RESIZE, resizeHandler);
        if (!Device.mobile) {
            return
        }
        Stage.bind("touchstart", onDown);
        Stage.bind("touchend", onUp)
    }

    function resizeHandler() {
        _world.aspect = Stage.width / Stage.height;
        _world.updateProjectionMatrix()
    }

    function onDown() {
        _this.isTouching = true
    }

    function onUp() {
        _this.isTouching = false
    }
    this.onDestroy = function() {
        Render.stop(loop)
    }
});
Class(function FireflyBehavior(_height) {
    Inherit(this, Component);
    var _this = this;
    var INTERACTIVE = Tests.getInteractiveFireflies();
    var _v2 = new Vector2();
    var _calc = new Vector3();
    var _v3 = new THREE.Vector3();
    var _projection = new ScreenProjection(World.CAMERA);
    var _dist = Math.pow(300, 2);
    var _quaternion = new THREE.Quaternion();
    (function() {})();

    function init(p) {
        p.startPos = new Vector3().copy(p.pos);
        p.origin = new Vector3().copy(p.pos);
        p.v2 = new Vector3().copy(p.pos);
        p.o = new Vector3().copy(p.pos);
        p.life = Utils.doRandom(0, 1000) / 1000;
        p.lifeSpeed = (Utils.doRandom(60, 100) / 100) * 0.003;
        p.rangeX = (Utils.doRandom(-1000, 1000) / 1000) * 3;
        p.rangeY = (Utils.doRandom(-1000, 1000) / 1000) * 3;
        p.rangeZ = (Utils.doRandom(-1000, 1000) / 1000) * 3;
        p.speedX = (Utils.doRandom(500, 1000) / 1000) * 0.0025;
        p.speedY = (Utils.doRandom(500, 1500) / 1000) * 0.0025;
        p.speedZ = (Utils.doRandom(500, 1500) / 1000) * 0.0025;
        p.angleX = 0;
        p.angleY = 0;
        p.angleZ = 0;
        p.riseY = (Utils.doRandom(20, 100) / 100) * 0.01 * Utils.range(_height, 10, 20, 1, 2)
    }
    this.applyBehavior = function(p) {
        if (!p.origin) {
            init(p)
        }
        p.origin.x = p.o.x + Math.sin(p.angleX) * p.rangeX;
        p.origin.y = p.o.y + Math.sin(p.angleY) * p.rangeY;
        p.origin.z = p.o.z + Math.sin(p.angleZ) * p.rangeZ;
        p.o.y += p.riseY;
        p.angleX += p.speedX;
        p.angleY += p.speedY;
        p.angleZ += p.speedZ;
        p.life -= p.lifeSpeed;
        _projection.camera = World.CAMERA;
        _v3.copy(p.origin);
        _this.parent.mesh.localToWorld(_v3);
        if (INTERACTIVE) {
            var screen = _projection.project(_v3);
            _v2.subVectors(screen, Mouse);
            var lenSq = _v2.lengthSq();
            if (lenSq < _dist) {
                var angle = Math.atan2(_v2.y, _v2.x);
                _calc.clear().setAngleRadius(-angle, Math.pow(Math.sqrt(_dist - lenSq) * 0.004, 1));
                _v3.copy(_calc).applyQuaternion(World.CAMERA.quaternion);
                p.v2.copy(p.origin).add(_v3)
            } else {
                p.v2.copy(p.origin)
            }
        } else {
            p.v2.copy(p.origin)
        }
        p.pos.lerp(p.v2, 0.07);
        if (p.life <= 0) {
            p.pos.copy(p.startPos);
            p.pos.y = 0;
            p.angleX = p.angleY = p.angleZ = 0;
            p.origin.copy(p.pos);
            p.v2.copy(p.pos);
            p.o.copy(p.pos);
            p.life = 1
        }
    }
});
Class(function FireflyParticles(_x, _y, _z, _size, _total, _color) {
    Inherit(this, Component);
    var _this = this;
    var _system, _geom, _mesh, _shader;
    this.color = _color;
    (function() {
        initSystem();
        initGeometry();
        initMesh();
        Render.start(loop)
    })();

    function initSystem() {
        _system = _this.initClass(ParticlePhysics);
        _system.addBehavior(_this.initClass(FireflyBehavior, _y))
    }

    function initGeometry() {
        var geom = new THREE.BufferGeometry();
        var total = Math.round(_total * Tests.getTotalFireflies());
        var position = new Float32Array(total * 3);
        var alpha = new Float32Array(total);
        var life = new Float32Array(total);
        var scale = new Float32Array(total);
        for (var i = 0; i < total; i++) {
            var p = new Particle(new Vector3());
            p.pos.x = (Utils.doRandom(0, 1000) / 1000) * (_x / 2) * Utils.headsTails(-1, 1);
            p.pos.y = (Utils.doRandom(0, 1000) / 1000) * _y;
            p.pos.z = (Utils.doRandom(0, 1000) / 1000) * (_z / 2) * Utils.headsTails(-1, 1);
            _system.addParticle(p);
            position[i * 3 + 0] = p.pos.x;
            position[i * 3 + 1] = p.pos.y;
            position[i * 3 + 2] = p.pos.z;
            alpha[i] = Utils.doRandom(50, 100) / 100;
            life[i] = Utils.range(p.pos.y, 0, _y, 0, 1);
            scale[i] = Utils.doRandom(50, 150) / 100
        }
        geom.addAttribute("position", new THREE.BufferAttribute(position, 3));
        geom.addAttribute("alpha", new THREE.BufferAttribute(alpha, 1));
        geom.addAttribute("life", new THREE.BufferAttribute(life, 1));
        geom.addAttribute("scale", new THREE.BufferAttribute(scale, 1));
        _geom = geom
    }

    function initMesh() {
        _shader = FireflyParticles.getShader();
        _shader.set("tMap", Utils3D.getTexture("assets/images/fireflies/particle.jpg"));
        _shader.set("color", _color);
        _shader.material.transparent = true;
        _shader.material.blending = THREE.AdditiveBlending;
        _shader.material.depthWrite = false;
        _shader.uniforms.size.value *= _size;
        _mesh = new THREE.Points(_geom, _shader.material);
        _this.mesh = _mesh
    }

    function loop() {
        _system.update();
        var p = _system.particles.start();
        var index = 0;
        while (p) {
            _geom.attributes.position.setXYZ(index, p.pos.x, p.pos.y, p.pos.z);
            _geom.attributes.life.setX(index, p.life);
            index++;
            p = _system.particles.next()
        }
        _geom.attributes.position.needsUpdate = true;
        _geom.attributes.life.needsUpdate = true;
        _shader.set("time", Render.TSL * 0.0025)
    }
    this.onDestroy = function() {
        Render.stop(loop)
    };
    this.pause = function() {
        Render.stop(loop)
    };
    this.resume = function() {
        Render.start(loop)
    };
    this.set("alpha", function(v) {
        _shader.set("opacity", v)
    });
    this.get("alpha", function() {
        return _shader.uniforms.opacity.value
    });
    this.get("size", function() {
        return _shader.uniforms.size.value
    });
    this.get("size", function(v) {
        _shader.set("size", v)
    })
}, function() {
    var _shader;
    FireflyParticles.getShader = function() {
        if (!_shader) {
            _shader = new Shader("Fireflies");
            _shader.uniforms = {
                tMap: {
                    type: "t",
                    value: null
                },
                color: {
                    type: "c",
                    value: null
                },
                opacity: {
                    type: "f",
                    value: 1
                },
                time: {
                    type: "f",
                    value: 1
                },
                size: {
                    type: "f",
                    value: 2 * World.DPR
                }
            }
        }
        return _shader.clone()
    }
});
Class(function ForestFog(_parent, _lake) {
    Inherit(this, Component);
    var _this = this;
    var _geometry, _shader, _mesh;
    var _numInstances = _lake || 100;
    this.group = new THREE.Group();
    (function() {
        initGeometry();
        initInstances();
        initShader();
        initMesh();
        Render.start(loop)
    })();

    function initGeometry() {
        _geometry = new THREE.InstancedBufferGeometry();
        _geometry.maxInstancedCount = _numInstances;
        var plane = new THREE.PlaneBufferGeometry(10, 2);
        plane.translate(0, 1, 0);
        var data = plane.attributes;
        _geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(data.position.array), 3));
        _geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(data.uv.array), 2));
        _geometry.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(data.normal.array), 3));
        _geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(plane.index.array), 1));
        plane.dispose()
    }

    function initInstances() {
        var offsets = new THREE.InstancedBufferAttribute(new Float32Array(_numInstances * 3), 3);
        var scale = new THREE.InstancedBufferAttribute(new Float32Array(_numInstances * 2), 2);
        for (var i = 0; i < _numInstances; i++) {
            offsets.setXYZ(i, Utils.doRandom(-30, 30), 0, Utils.range(i, 0, _numInstances, -37.5, 37.5));
            scale.setXY(i, Utils.doRandom(1, 2, 2), Utils.doRandom(1, 2, 2))
        }
        _geometry.addAttribute("offset", offsets);
        _geometry.addAttribute("scale", scale)
    }

    function initShader() {
        _shader = ForestFog.getShader();
        _shader.set("tMap", Utils3D.getTexture("assets/images/forest/fog01.png"));
        _shader.set("alpha", _lake ? 0.15 : 0.07);
        _shader.set("near", _lake ? 0.4 : 0.3);
        _shader.set("far", _lake ? 0.6 : 0.5);
        _shader.set("camQuat", new THREE.Quaternion());
        _shader.material.transparent = true;
        _shader.material.depthWrite = false
    }

    function initMesh() {
        _mesh = new THREE.Mesh(_geometry, _shader.material);
        _mesh.frustumCulled = false;
        _this.group.add(_mesh);
        _this.fxMesh = FX.Fog.instance().addSprite(_mesh)
    }

    function loop() {
        _shader.uniforms.camQuat.value.copy(_parent.quaternion);
        _shader.uniforms.camQuat.value.inverse();
        _shader.uniforms.camQuat.value.multiply(World.CAMERA.quaternion)
    }
    this.onDestroy = function() {
        Render.stop(loop)
    }
}, function() {
    var _shader;
    ForestFog.getShader = function() {
        if (!_shader) {
            _shader = new Shader("Fog");
            _shader.uniforms = {
                tMap: {
                    type: "t",
                    value: null
                },
                alpha: {
                    type: "f",
                    value: 0.15
                },
                near: {
                    type: "f",
                    value: 0.3
                },
                far: {
                    type: "f",
                    value: 0.5
                },
                camQuat: {
                    type: "v4",
                    value: null
                },
            }
        }
        return _shader.clone()
    }
});
Class(function ForestDementor(_direction) {
    Inherit(this, Component);
    var _this = this;
    var _geometry, _shader, _mesh;
    this.group = new THREE.Group();
    (function() {
        init();
        Render.start(loop)
    })();

    function init() {
        _geometry = new THREE.PlaneBufferGeometry(2, 4);
        _geometry.rotateZ(1.3);
        _shader = _this.initClass(Shader, "Dementor");
        _shader.uniforms = {
            tMap: {
                type: "t",
                value: Utils3D.getTexture("assets/images/dementor/dementor001.png")
            },
            time: {
                type: "f",
                value: 0
            },
        };
        _shader.material.side = THREE.DoubleSide;
        _mesh = new THREE.Mesh(_geometry, _shader.material);
        _mesh.position.z = -5;
        _mesh.position.x = 10;
        _mesh.position.y = 1;
        _this.group.add(_mesh);
        World.SCENE.add(_this.group)
    }

    function loop(t, dt) {
        _shader.set("time", dt * 0.01);
        _this.group.position.copy(World.CAMERA.position);
        _this.group.quaternion.copy(World.CAMERA.quaternion)
    }
    this.animateIn = function(callback) {
        TweenManager.tween(_mesh.position, {
            x: -10,
            y: 1.5
        }, 5000, "linear", 0, callback)
    };
    this.onDestroy = function() {
        Render.stop(loop);
        World.SCENE.remove(_this.group)
    }
});
Class(function ForestIntro() {
    Inherit(this, Component);
    var _this = this;
    var _curve, _camera, _patronus, _cameraTimeout, _mixer, _action, _animTimeout;
    var _target = new THREE.Vector3(18, 6, 23);
    var _progress = {
        speed: 0,
        value: 0.273
    };
    this.group = new THREE.Group();
    (function() {
        Utils3D.freezeMatrix(_this.group);
        initCameraCurve();
        initPatronus();
        initDementor();
        initIntroCamera();
        Render.start(loop);
        addHandlers()
    })();

    function initCameraCurve() {
        var data = Hydra.JSON.curves.intro[0];
        var points = [];
        for (var j = 0; j < data.length; j += 3) {
            points.push(new THREE.Vector3(data[j + 0], data[j + 1], data[j + 2]))
        }
        _curve = new THREE.CatmullRomCurve3(points)
    }

    function initIntroCamera() {
        _camera = new ForestCamera();
        _this.group.add(_camera.group);
        _camera.strength = 0.5;
        _cameraTimeout = _this.delayedCall(function() {
            Camera.instance().setCamera(_camera.worldCamera)
        }, 100);
        if (Data.User.getStatus() !== "loggedIn") {
            _this.delayedCall(function() {
                TweenManager.tween(_progress, {
                    value: 0.32
                }, 7000, "easeInOutSine", 0)
            }, 500)
        }
    }

    function initPatronus() {
        var stag = {
            perma: "92-stag",
            model: "92-stag",
            anim: "93-doe-run",
            id: "Stag",
            name: "Stag",
            speed: 0.35,
            scale: 2.2,
            lightX: 0,
            lightY: 1.83,
            lightZ: 0,
            lightScale: 1.21,
            delivered: false,
            approved: false,
        };
        _patronus = new Patronus(stag, _this.group);
        _patronus.intro();
        _this.group.add(_patronus.group);
        _patronus.events.add(HydraEvents.READY, startAnimation);
        ForestLakeTile.patronus = _patronus
    }

    function initDementor() {
        var dementor = _this.initClass(ForestDementor);
        _this.delayedCall(function() {
            dementor.animateIn(function() {
                dementor.destroy()
            })
        }, 1600)
    }

    function startAnimation() {
        setTimeout(function() {
            _this.events.fire(QuizEvents.GL_READY)
        }, 100);
        _patronus.center.children[0].offset = new THREE.Vector3(0, 2, 0);
        var mesh = _patronus.group.children[0];
        _mixer = mesh.mixer;
        _mixer.stopAllAction();
        var animation = Hydra.JSON["92-stag-intro"].animation;
        var clip = THREE.AnimationClip.parseAnimation(animation, mesh.geometry.bones);
        _action = _mixer.clipAction(clip);
        _action.clampWhenFinished = true;
        _action.setLoop(THREE.LoopOnce, 0);
        _this.checkAnimEnd = true;
        _patronus.center.position.set(0, 0, 0);
        var s = 0.02;
        _patronus.root.scale.set(s, s, s);
        _patronus.root.position.set(0, 0, 0);
        _this.delayedCall(function() {
            _this.animLoop = true;
            _action.play();
            _patronus.animateIn()
        }, 4000)
    }

    function endAnimation() {
        _patronus.animateOut();
        _this.checkAnimEnd = false
    }

    function loop(t, dt, delta) {
        if (_this.checkAnimEnd) {
            if (_this.animLoop && _action.time >= 304) {
                _action.time = 204
            }
            if (_action.time > 340) {
                endAnimation()
            }
        }
        _progress.value += _progress.speed * (delta / 16);
        _camera.group.position.copy(_curve.getPoint(_progress.value % 1));
        _camera.group.lookAt(_target)
    }

    function addHandlers() {
        _this.events.subscribe(QuizEvents.LOGGED_IN, login);
        _this.events.subscribe(QuizEvents.START_QUIZ, letAnimFinish)
    }

    function login() {
        _this.delayedCall(function() {
            TweenManager.tween(_progress, {
                speed: 0.0002
            }, 2000, "easeInSine", 0)
        }, 500);
        _this.delayedCall(function() {
            TweenManager.tween(_target, {
                x: 5
            }, 6000, "easeInOutSine");
            _this.delayedCall(function() {
                TweenManager.tween(_target, {
                    x: 15
                }, 6000, "easeInOutSine")
            }, 12000)
        }, Global.INIT_LOGGED_IN ? 7000 : 3000)
    }

    function letAnimFinish() {
        _patronus.animateOutVolume();
        _action.time = 274;
        _this.animLoop = false
    }
    this.onDestroy = function() {
        if (_patronus) {
            ForestLighting.instance().detachPatronusLight();
            _this.group.remove(_patronus.group);
            if (_animTimeout) {
                clearTimeout(_animTimeout)
            }
            _mixer.stopAllAction();
            _mixer._actions[1].play();
            _this.checkAnimEnd = false
        }
        if (_cameraTimeout) {
            clearTimeout(_cameraTimeout)
        }
        Render.stop(loop)
    }
}, function() {
    ForestIntro.LOADED = "forest_intro_loaded"
});
Class(function ForestLighting() {
    Inherit(this, Component);
    var _this = this;
    var _patronusLight, _etherealLight;
    var _lights = {};
    var _cameras = [];
    var _groups = [];
    (function() {
        initPatronusLight();
        initLights();
        if (Global.UIL) {
            initUIL()
        }
        Render.start(loop);
        Shader.disableWarnings = true
    })();

    function initShadowLight() {
        var light = new THREE.DirectionalLight(16777215, 1);
        light.position.set(100, 100, -1000000);
        Utils3D.setLightCamera(light, 50, 0.1, 300, Tests.getShadowMapTexture());
        World.SCENE.add(light)
    }

    function initPatronusLight() {
        _patronusLight = new THREE.PointLight(7131373, 10, 17);
        Lighting.add(_patronusLight);
        _etherealLight = new THREE.PointLight(7131373, 10, 17);
        Lighting.add(_etherealLight)
    }

    function initLights() {
        ["lake_settings", "tile0_settings"].forEach(function(path) {
            if (!Hydra.JSON[path]) {
                return
            }
            var lights = Hydra.JSON[path].lights;
            var cameras = Hydra.JSON[path].cameras;
            var group = new THREE.Group();
            var pointLights = [];
            _lights[path] = {
                group: group,
                lights: pointLights
            };
            var geom = new THREE.IcosahedronGeometry(0.5, 1);
            lights.forEach(function(light, i) {
                var color = new THREE.Color(light.color[0], light.color[1], light.color[2]);
                var pointLight = new THREE.PointLight(color, light.intensity, light.falloff.outter);
                pointLight.position.set(light.position[0], light.position[1], light.position[2]);
                pointLights.push(pointLight);
                group.add(pointLight);
                if (path.strpos("tile0")) {
                    pointLight.intensity *= 0.8
                }
                if (Global.UIL && false) {
                    var mat = new THREE.MeshBasicMaterial({
                        color: color
                    });
                    mat.depthTest = false;
                    mat.depthWrite = false;
                    mat.transparent = true;
                    var mesh = new THREE.Mesh(geom, mat);
                    mesh.position.copy(pointLight.position);
                    World.SCENE.add(mesh)
                }
            });
            if (cameras && false) {
                var geom = new THREE.BoxGeometry(1, 1, 1);
                var mat = new THREE.MeshBasicMaterial({
                    color: 16777215
                });
                mat.depthTest = false;
                mat.depthWrite = false;
                mat.transparent = true;
                cameras.forEach(function(data) {
                    var camera = new ForestCamera(data);
                    _cameras.push(camera);
                    if (Global.UIL && false) {
                        var mesh = new THREE.Mesh(geom, mat);
                        mesh.position.set(data.position[0], data.position[1], data.position[2]);
                        World.SCENE.add(mesh)
                    }
                })
            }
        })
    }

    function initUIL() {
        var group = Global.UIL.add("group", {
            name: "Cameras"
        });
        group.add("button", {
            name: "World Camera",
            callback: function(b) {
                Playground.instance().resetCamera()
            }
        });
        _cameras.forEach(function(cam, i) {
            group.add("button", {
                name: cam.data.id,
                callback: function(b) {
                    World.instance().setCamera(cam.worldCamera)
                }
            })
        })
    }

    function loop() {
        if (_patronusLight && _patronusLight.attach) {
            _patronusLight.attach.getWorldPosition(_patronusLight.position);
            if (_patronusLight.attach.offset) {
                _patronusLight.position.add(_patronusLight.attach.offset)
            }
            if (_patronusLight.translateMatrix) {
                _patronusLight.position.applyMatrix4(_patronusLight.translateMatrix)
            }
        }
        for (var i = _groups.length - 1; i > -1; i--) {
            var group = _groups[i];
            if (group.copyPos && group.visible !== false) {
                group.position.copy(group.copyPos.position);
                group.updateMatrixWorld()
            }
        }
    }

    function clone(obj) {
        var group = new THREE.Group();
        var lights = [];
        obj.lights.forEach(function(light) {
            var lightClone = light.clone();
            lights.push(lightClone);
            group.add(lightClone)
        });
        _groups.push(group);
        return {
            group: group,
            lights: lights
        }
    }
    this.initLights = function(path) {
        return clone(_lights[path + "_settings"])
    };
    this.applyLights = function(settings, shader) {
        if (typeof settings === "string") {
            settings = _lights[settings + "_settings"]
        }
        shader.lights = [];
        settings.lights.forEach(function(light) {
            shader.lights.push(light)
        })
    };
    this.attachLights = function(settings, group) {
        settings.group.copyPos = group
    };
    this.attachPatronusLight = function(group) {
        if (_patronusLight) {
            _patronusLight.attach = group
        }
    };
    this.detachPatronusLight = function() {
        _patronusLight.attach = null
    };
    this.getPatronusLight = function() {
        return _patronusLight
    };
    this.getEtheralLight = function() {
        return _etherealLight
    }
}, "Singleton");
Class(function ForestGround(_geom, _path) {
    Inherit(this, Component);
    var _this = this;
    var _mesh, _shader;
    (function() {
        initMesh();
        if (Global.UIL && Hydra.HASH.strpos("Forest")) {
            initUIL()
        }
    })();

    function initMesh() {
        var shader = ForestGround.getShader();
        shader.set("diffuse", new THREE.Color(3158341));
        shader.set("rimLight", new THREE.Color(231661));
        shader.set("fogColor", new THREE.Color(0));
        shader.set("rimStrength", 0.34);
        if (Tests.bakedShadows()) {
            shader.set("tShadow", Utils3D.getTexture("assets/images/forest/lake_ao_shadows.jpg"));
            shader.set("colorMultiplier", 1.5);
            shader.set("shadowLower", 0.15)
        }
        shader.set("useFog", Global.PLAYGROUND ? 0 : 1);
        _shader = shader;
        _mesh = new THREE.Mesh(_geom, shader.material);
        _mesh.frustumCulled = false;
        if (Tests.renderShadows()) {
            _mesh.castShadow = true;
            _mesh.receiveShadow = true
        }
        _this.mesh = _mesh;
        _this.shader = shader;
        FX.Fog.instance().add(_this.mesh).material.side = THREE.DoubleSide;
        FX.Fog.instance().addGround(_this.mesh).material.side = THREE.DoubleSide;
        FX.Light.instance().add(_this.mesh);
        Utils3D.freezeMatrix(_this.mesh)
    }

    function initUIL() {
        var group = Global.UIL.add("group", {
            name: "Ground"
        });
        group.add("color", new UILItem("Tree Color", _shader.uniforms.diffuse.value.getHex(), function(color) {
            if (!color[0]) {
                return
            }
            _shader.uniforms.diffuse.value.setRGB(color[0], color[1], color[2])
        }).obj);
        group.add("color", new UILItem("Light Color", _shader.uniforms.rimLight.value.getHex(), function(color) {
            if (!color[0]) {
                return
            }
            _shader.uniforms.rimLight.value.setRGB(color[0], color[1], color[2])
        }).obj);
        group.add("slide", new UILItem("Rim Strength", _shader.uniforms.rimStrength.value, {
            min: 0,
            max: 1
        }, function(val) {
            _shader.uniforms.rimStrength.value = val
        }).obj)
    }
}, function() {
    var _shader;
    ForestGround.getShader = function() {
        if (!_shader) {
            _shader = new Shader("ForestGround");
            _shader.uniforms = {
                diffuse: {
                    type: "c",
                    value: null
                },
                tShadow: {
                    type: "t",
                    value: null
                },
                rimLight: {
                    type: "c",
                    value: null
                },
                fogColor: {
                    type: "c",
                    value: null
                },
                rimStrength: {
                    type: "f",
                    value: 0.5
                },
                useRimLight: {
                    type: "f",
                    value: 0
                },
                shadowLower: {
                    type: "f",
                    value: 0
                },
                darken: {
                    type: "f",
                    value: 1
                },
                useFog: {
                    type: "f",
                    value: 1
                },
                colorMultiplier: {
                    type: "f",
                    value: 1
                },
            };
            if (Tests.renderShadows()) {
                _shader.receiveShadow = true
            }
            _shader.receiveLight = true;
            ForestLighting.instance().applyLights("lake", _shader)
        }
        return _shader.clone()
    }
});
Class(function ForestTrees(_geom, _path) {
    Inherit(this, Component);
    var _this = this;
    var _mesh, _shader;
    (function() {
        initMesh();
        if (Global.UIL && Hydra.HASH.strpos("Forest")) {
            initUIL()
        }
    })();

    function initMesh() {
        var shader = ForestGround.getShader();
        shader.set("diffuse", new THREE.Color(1778991));
        shader.set("rimLight", new THREE.Color(345703));
        shader.set("fogColor", new THREE.Color(0));
        shader.set("useFog", Global.PLAYGROUND ? 0 : 1);
        if (Tests.bakedShadows()) {
            shader.set("tShadow", Utils3D.getTexture("assets/images/forest/tree-ao.jpg"));
            shader.set("colorMultiplier", 2)
        }
        shader.set("rimStrength", 0.5);
        _shader = shader;
        _mesh = new THREE.Mesh(_geom, shader.material);
        _mesh.frustumCulled = false;
        if (Tests.renderShadows()) {
            _mesh.castShadow = true;
            _mesh.receiveShadow = true
        }
        _this.mesh = _mesh;
        _this.shader = _shader;
        FX.Fog.instance().add(_this.mesh);
        FX.Fog.instance().addGround(_this.mesh);
        FX.Light.instance().add(_this.mesh);
        FX.Translucency.instance().add(_this.mesh);
        Utils3D.freezeMatrix(_this.mesh)
    }

    function initUIL() {
        var group = Global.UIL.add("group", {
            name: "Trees"
        });
        group.add("color", new UILItem("Tree Color", _shader.uniforms.diffuse.value.getHex(), function(color) {
            if (!color[0]) {
                return
            }
            _shader.uniforms.diffuse.value.setRGB(color[0], color[1], color[2])
        }).obj);
        group.add("color", new UILItem("Light Color", _shader.uniforms.rimLight.value.getHex(), function(color) {
            if (!color[0]) {
                return
            }
            _shader.uniforms.rimLight.value.setRGB(color[0], color[1], color[2])
        }).obj);
        group.add("slide", new UILItem("Rim Strength", _shader.uniforms.rimStrength.value, {
            min: 0,
            max: 1
        }, function(val) {
            _shader.uniforms.rimStrength.value = val
        }).obj)
    }
});
Class(function ForestOuter() {
    Inherit(this, Component);
    var _this = this;
    this.group = new THREE.Group();
    (function() {
        initLight()
    })();

    function initLight() {
        var geom = new THREE.PlaneBufferGeometry(60, 40, 10, 10);
        var shader = _this.initClass(Shader, "ForestOuterLight");
        shader.uniforms = {
            color: {
                type: "c",
                value: new THREE.Color(420508)
            }
        };
        shader.material.transparent = true;
        shader.material.depthWrite = false;
        var mesh = new THREE.Mesh(geom, shader.material);
        mesh.position.set(35, 0, 35);
        mesh.rotation.y = Utils.toRadians(-130);
        mesh.scale.set(1.5, 1.1, 1);
        _this.group.add(mesh);
        mesh.renderOrder = 5
    }
});
Class(function ForestNonCorporeal(_pos, _lookAt, _parentGroup) {
    Inherit(this, Component);
    var _this = this;
    var _patronus;
    (function() {
        initPatronus();
        Render.start(loop)
    })();

    function initPatronus() {
        var patronus = ForestLakeTile.patronus;
        patronus.tileGroup = _parentGroup;
        patronus.root.position.copy(_pos);
        patronus.nonCorporeal();
        World.SCENE.add(patronus.group);
        patronus.root.scale.multiplyScalar(0.5);
        _patronus = patronus
    }

    function loop() {
        _patronus.root.rotation.y += 0.02
    }
    this.animateIn = function() {
        Camera.instance().adjustLerp(0.2);
        _patronus.animateIn(true, true)
    };
    this.animateOut = function() {
        Camera.instance().adjustLerp(1);
        setTimeout(function() {
            _patronus.animateOut();
            _this.events.fire(HydraEvents.COMPLETE)
        }, 750)
    };
    this.onDestroy = function() {
        Render.stop(loop);
        World.SCENE.remove(_patronus.group);
        _patronus.destroy();
        ForestLakeTile.patronus = null
    }
});
Class(function ForestReveal() {
    Inherit(this, Component);
    var _this = this;
    var _track, _patronus, _timerEtherealReady;
    this.group = new THREE.Group();
    var _target = new THREE.Group();
    var _cast = new THREE.Vector3();
    var _lerpQuat = new THREE.Group();
    var _weights = {
        curve: 0.001,
        cast: 0.6,
    };
    _weights.multiTween = true;
    (function() {
        initPatronus();
        addListeners();
        Render.start(loop);
        Utils3D.freezeMatrix(_this.group)
    })();

    function initPatronus() {
        Data.User.requestPatronus(function() {
            Data.Patronus.getData(Data.User.getPatronus(), function(data) {
                initTrack(data);
                _patronus = new Patronus(data, _this.group);
                World.SCENE.add(_patronus.group);
                var onReady = function() {
                    if (_this.active("didOnReady")) {
                        return
                    }
                    _this.active("didOnReady", true);
                    _patronus.light.distance *= 1.8;
                    if (Hardware.ACTIVE_VR) {} else {
                        var cast = function() {
                            if (_this.thrash) {
                                return _this.delayedCall(cast, 100)
                            }
                            _this.events.unsubscribe(QuizEvents.LOADED, cast);
                            _this.delayedCall(function() {
                                Ethereal.instance().cast(_target.position)
                            }, Global.DIRECT_END ? 1500 : 5000)
                        };
                        if (Global.DIRECT_END && !Global.LOAD_COMPLETE) {
                            _this.events.subscribe(QuizEvents.LOADED, cast)
                        } else {
                            cast()
                        }
                    }
                };
                var loaded = 0;
                var partReady = function() {
                    loaded++;
                    if (loaded === 2) {
                        onReady()
                    }
                };
                var waitForEthereal = function() {
                    if (Ethereal.instance().isReady) {
                        partReady();
                        Render.stop(waitForEthereal)
                    }
                };
                Render.start(waitForEthereal);
                _patronus.events.add(HydraEvents.READY, partReady);
                _this.delayedCall(onReady, 6000)
            })
        })
    }

    function initTrack(data) {
        _track = _this.initClass(ForestRevealTrack, data);
        _this.group.add(_track.camera.group);
        _this.group.add(_track.target);
        if (Global.PLAYGROUND) {
            Camera.instance().setCamera(_track.camera.worldCamera)
        }
        _this.delayedCall(function() {
            Ethereal.instance().increment(0.2, 10000)
        }, 100);
        _this.camera = _track.camera;
        setTimeout(function() {
            _this.events.fire(QuizEvents.GL_READY)
        }, 100)
    }

    function loop(t) {
        if (!_this.isCast) {
            return _patronus.root.position.x = 599
        }
        _target.position.lerp(_track.target.position, _weights.curve);
        _target.position.lerp(_cast, _weights.cast);
        _lerpQuat.position.copy(_patronus.root.position);
        _lerpQuat.lookAt(_target.position);
        _patronus.root.quaternion.slerp(_lerpQuat.quaternion, 0.1);
        _patronus.root.position.lerp(_target.position, 0.1)
    }

    function addListeners() {
        _this.events.subscribe(EtherealInteraction.CAST, cast);
        _this.events.subscribe(KeyboardUtil.PRESS, keypress)
    }

    function keypress(e) {
        if (e.key === "Enter" || e.keyCode === 13) {
            cast({
                pos: _target.position,
                points: [_target.position, _target.position]
            })
        }
    }

    function cast(e) {
        if (_this.isCast === true) {
            return
        }
        _target.position.copy(e.pos);
        _patronus.root.position.copy(e.pos);
        var followCurve = function() {
            var points = e.points;
            var curve = new THREE.CatmullRomCurve3(points);
            var dist = new THREE.Vector3().copy(e.pos).sub(_target.position).length();
            var duration = Utils.range(dist, 16, 30, 2000, 4000, true);
            var d = new DynamicObject({
                v: 0.3
            });
            d.tween({
                v: 1
            }, duration, "easeOutSine", function() {
                _cast = curve.getPoint(d.v)
            });
            TweenManager.tween(_weights, {
                cast: 0.001
            }, duration, "easeOutSine")
        };
        var lerpToFinal = function() {
            var dist = new THREE.Vector3().copy(e.pos).sub(_target.position).length();
            var duration = Utils.range(dist, 10, 30, 6000, 9000, true);
            _patronus.animateInMesh();
            TweenManager.tween(_weights, {
                curve: 0.6
            }, duration, "easeInOutSine")
        };
        _patronus.animateIn(true);
        if (!Hardware.ACTIVE_VR) {
            followCurve()
        }
        lerpToFinal();
        Ethereal.instance().stop();
        Ethereal.instance().increment(0.06);
        _this.isCast = true;
        _this.events.fire(ForestReveal.CAST);
        _this.delayedCall(recast, Config.PATRONUS_TIME)
    }

    function recast() {
        _patronus.animateOut(function() {
            _weights.curve = 0.001;
            _weights.cast = 0.6;
            Ethereal.instance().increment(0.2);
            _patronus.root.position.x = 599;
            Ethereal.instance().cast(_target.position);
            _this.isCast = false;
            _this.events.fire(ForestReveal.RECAST)
        })
    }
    this.onDestroy = function() {
        Render.stop(loop);
        if (_timerEtherealReady) {
            clearTimeout(_timerEtherealReady)
        }
    }
}, function() {
    ForestReveal.RECAST = "reveal_recast";
    ForestReveal.CAST = "reveal_cast"
});
Class(function ForestRevealTrack(_data) {
    Inherit(this, Component);
    var _this = this;
    var _camera, _cameraCurve, _targetCurve;
    var _target = new THREE.Group();
    var _progress = {
        camSpeed: -0.000218,
        camValue: 0.35,
        targetSpeed: 0.00045 * _data.curveSpeed,
        targetValue: (function() {
            if (_data.curveIndex == 1) {
                return 0.65
            }
            if (_data.curveIndex == 2) {
                return 0
            }
            return 0.65
        })(),
        targetMult: 0.1,
    };
    (function() {
        initCamera();
        initCameraCurve();
        addHandlers();
        Render.start(loop)
    })();

    function initCamera() {
        _camera = new ForestCamera();
        _this.camera = _camera
    }

    function initCameraCurve() {
        _cameraCurve = initCurve(0);
        _targetCurve = initCurve(_data.curveIndex)
    }

    function initCurve(index) {
        return Utils3D.loadCurve(Hydra.JSON.curves.reveal[index])
    }

    function loop() {
        _progress.camValue += _progress.camSpeed;
        _progress.targetValue += _progress.targetSpeed * _progress.targetMult;
        if (_progress.camValue <= 0) {
            _progress.camValue += 1
        }
        _camera.group.position.copy(_cameraCurve.getPoint((_progress.camValue) % 1));
        _target.position.copy(_targetCurve.getPoint((_progress.targetValue) % 1));
        _camera.group.lookAt(_target.position)
    }

    function addHandlers() {
        _this.events.subscribe(ForestReveal.CAST, activate);
        _this.events.subscribe(ForestReveal.RECAST, deactivate)
    }

    function activate() {
        TweenManager.tween(_progress, {
            targetMult: 1
        }, 3000, "easeInOutSine")
    }

    function deactivate() {
        TweenManager.tween(_progress, {
            targetMult: 0.1
        }, 3000, "easeInOutSine")
    }
    this.get("target", function() {
        return _target
    });
    this.onDestroy = function() {
        Render.stop(loop)
    }
});
Class(function ForestWater() {
    Inherit(this, Component);
    var _this = this;
    var _mesh, _shader;
    (function() {
        initMesh();
        if (Global.UIL && Hydra.HASH.strpos("Forest")) {
            initUIL()
        }
    })();

    function initMesh() {
        var geom = new THREE.PlaneBufferGeometry(57, 35);
        geom.rotateX(Utils.toRadians(-90));
        geom.translate(1, 0.33, -4.3);
        var mat = new THREE.MeshNormalMaterial();
        _this.mesh = new THREE.Mesh(geom, mat);
        FX.Fog.instance().add(_this.mesh);
        Utils3D.freezeMatrix(_this.mesh);
        _shader = _this.initClass(ForestWaterShader, _this.mesh)
    }

    function initUIL() {
        var group = Global.UIL.add("group", {
            name: "Water"
        });
        group.add("color", new UILItem("Sun Color", _shader.uniforms.sunColor.value.getHex(), function(color) {
            if (!color[0]) {
                return
            }
            _shader.uniforms.sunColor.value.setRGB(color[0], color[1], color[2])
        }).obj);
        group.add("color", new UILItem("Base Color", _shader.uniforms.baseColor.value.getHex(), function(color) {
            if (!color[0]) {
                return
            }
            _shader.uniforms.baseColor.value.setRGB(color[0], color[1], color[2])
        }).obj);
        group.add("slide", new UILItem("Normal Scale", _shader.uniforms.normalScale.value, {
            min: 0.5,
            max: 20
        }, function(val) {
            _shader.uniforms.normalScale.value = val
        }).obj);
        group.add("slide", new UILItem("Flow Speed", _shader.speed, {
            min: 0.2,
            max: 2
        }, function(val) {
            _shader.speed = val
        }).obj);
        var pos = _shader.uniforms.sunDirection.value;
        group.add("number", new UILItem("Moon Position", [pos.x, pos.y, pos.z], function(val) {
            _shader.uniforms.sunDirection.value.set(val[0], val[1], val[2]).normalize()
        }).obj)
    }
    this.pause = function() {
        _shader.pause()
    };
    this.resume = function() {
        _shader.resume()
    }
});
Class(function ForestWaterShader(_mesh) {
    Inherit(this, Component);
    var _this = this;
    var _shader, _mirror;
    var _evt = {};
    this.speed = 0.77;
    (function() {
        initMirror();
        initShader();
        addListeners();
        Render.start(loop)
    })();

    function initMirror() {
        var size = Tests.getMirrorSize();
        _mirror = new THREE.Mirror(World.RENDERER, World.CAMERA, {
            clipBias: 0.1,
            textureWidth: size,
            textureHeight: size
        });
        _mirror.alwaysRender = !Tests.simpleMirrorRender();
        _mirror.needsRender = true;
        _mirror.dynamicRender = Tests.dynamicShadows();
        _mirror.rotation.x = Utils.toRadians(-90);
        _mesh.add(_mirror)
    }

    function initShader() {
        _shader = _this.initClass(Shader, "LakeWater");
        _shader.receiveLight = true;
        _shader.uniforms = {
            time: {
                type: "f",
                value: 0
            },
            normalSampler: {
                type: "t",
                value: getNormalTexture()
            },
            sunDirection: {
                type: "v3",
                value: new THREE.Vector3(-1.2, 1, -0.52).normalize()
            },
            sunColor: {
                type: "c",
                value: new THREE.Color(12380414)
            },
            baseColor: {
                type: "c",
                value: new THREE.Color(9953023)
            },
            reflection: {
                type: "t",
                value: _mirror.renderTarget.texture
            },
            textureMatrix: {
                type: "t",
                value: _mirror.textureMatrix
            },
            normalScale: {
                type: "f",
                value: 1.83
            },
            distortionStrength: {
                type: "f",
                value: 10
            },
        };
        _mesh.material = _shader.material;
        _this.uniforms = _shader.uniforms
    }

    function getNormalTexture() {
        var texture = Utils3D.getTexture("assets/images/forest/waternormals.jpg");
        texture.onload = function() {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
        };
        return texture
    }

    function loop() {
        _mirror.camera = World.CAMERA;
        _shader.set("time", (Render.TSL * 0.0001) * _this.speed);
        _mesh.material.visible = false;
        _evt.visible = false;
        _this.events.fire(ForestWaterShader.RENDER, _evt);
        if (_mirror.needsRender || _mirror.alwaysRender) {
            _mirror.render()
        }
        _mesh.material.visible = true;
        _evt.visible = true;
        _this.events.fire(ForestWaterShader.RENDER, _evt);
        _mirror.needsRender = false
    }

    function addListeners() {
        _this.events.subscribe(PatronusEvents.CAMERA_CHANGE, cameraChange)
    }

    function cameraChange() {
        _mirror.needsRender = true
    }
    this.pause = function() {
        Render.stop(loop)
    };
    this.resume = function() {
        Render.start(loop)
    }
}, function() {
    ForestWaterShader.RENDER = "water_render"
});
Class(function IframeView(config) {
    Inherit(this, View);
    var _this = this;
    var $this, $wrapper, $iframe;
    var _close;
    (function() {
        initHTML();
        style();
        initIframe();
        addHandlers();
        defer(animateIn);
        if (Mobile.os == "Android" && !location.hostname.strpos("local")) {
            Mobile.setOrientation("portrait")
        }
    })();

    function initHTML() {
        $this = _this.element;
        _this.events.fire(QuizEvents.OPEN_IFRAME)
    }

    function style() {
        $this.size("100%").setZ(500).css({
            textAlign: "center"
        }).invisible();
        if (Device.mobile) {
            $this.size("100%").css({
                top: 0,
                left: 0
            })
        } else {
            $this.size(480, 525).center()
        }
        $this.enable3D(2000);
        _close = _this.initClass(UIButton, {
            width: 100,
            height: 55,
            text: "CLOSE",
            size: 9
        });
        _close.css({
            top: 90,
            top: -65,
            marginTop: ""
        });
        if (Device.mobile) {
            _close.element.css({
                top: 15,
                background: "rgba(0, 0, 0, 0.9)",
                boxShadow: "0px 0px 15px 8px rgba(0, 0, 0, 0.9)",
            });
            _close.element.setZ(1)
        }
    }

    function initIframe() {
        $wrapper = $this.create(".wrapper");
        $wrapper.size("100%").bg("#000").css({
            boxShadow: "0 0 200px rgba(255,255,255,0.3)",
            overflow: "auto",
            "-webkit-overflow-scrolling": "touch"
        });
        $iframe = $wrapper.create("iframe", "iframe");
        $iframe.css({
            opacity: 0,
            left: 0,
            top: 0
        });
        $iframe.div.setAttribute("width", "100%");
        $iframe.div.setAttribute("height", "100%");
        $iframe.div.setAttribute("frameborder", 0);
        $iframe.div.onload = onLoad
    }

    function animateIn() {
        $this.visible().css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 1000, "easeInOutSine");
        $wrapper.transform({
            rotationX: 90,
            z: -700
        }).tween({
            rotationX: 0,
            z: 0
        }, 1400, "easeOutQuart", function() {
            $iframe.div.setAttribute("src", config.mode === "login" ? Config.LOGIN_URL : Config.JOIN_URL)
        });
        _this.delayedCall(_close.animateIn, 500)
    }

    function hide() {
        $iframe.tween({
            opacity: 0
        }, 400, "easeOutCubic")
    }

    function show() {
        $iframe.tween({
            opacity: 1
        }, 400, "easeOutCubic")
    }

    function onLoad() {
        if (config.mode === "login") {
            initLoginIframe()
        } else {
            if (config.mode === "join") {
                initJoinIframe()
            }
        }
    }

    function initLoginIframe() {
        show();
        try {
            var iframe = $iframe.div.contentDocument;
            var header = iframe.getElementsByClassName("header")[0];
            var footer = iframe.getElementsByClassName("footer")[0];
            var bg = iframe.getElementsByClassName("account-form__background")[0];
            header.style.display = "none";
            footer.style.display = "none";
            bg.style.position = "absolute";
            bg.style.width = "100%";
            bg.style.height = "100%";
            if (Device.mobile) {
                bg.style.paddingTop = "60px"
            }
            bg.style.backgroundImage = "none"
        } catch (e) {}
    }

    function initJoinIframe() {
        show();
        try {
            var iframe = $iframe.div.contentDocument;
            var header = iframe.getElementsByClassName("header")[0];
            var footer = iframe.getElementsByClassName("footer")[0];
            var bg = iframe.getElementsByClassName("account-form__background")[0];
            header.style.display = "none";
            footer.style.display = "none";
            bg.style.position = "absolute";
            bg.style.width = "100%";
            bg.style.height = "100%";
            if (Device.mobile) {
                bg.style.paddingTop = "60px"
            }
            bg.style.backgroundImage = "none"
        } catch (e) {}
    }

    function addHandlers() {
        _close.events.add(HydraEvents.CLICK, cancel)
    }

    function cancel() {
        $wrapper.tween({
            z: -200
        }, 500, "easeOutCubic");
        $this.tween({
            opacity: 0
        }, 400, "easeOutSine", function() {
            _this.events.fire(QuizEvents.CLOSE_IFRAME)
        })
    }
});
Class(function LoaderView() {
    Inherit(this, View);
    var _this = this;
    var $this, $flame, $text, $line;
    var _instruction;
    (function() {
        initHTML();
        initInstruction();
        initFlame();
        style();
        update()
    })();

    function initHTML() {
        $this = _this.element;
        Stage.add($this);
        $this.perc = 0;
        $flame = $this.create(".flame")
    }

    function style() {
        $this.size("100%").setZ(1).bg("#000");
        var size = 80;
        $line = $this.create(".line");
        $line.size(45, 2).center().bg("#333").css({
            overflow: "hidden",
            marginTop: 60
        });
        $line.css({
            opacity: 0
        }).tween({
            opacity: 1
        }, 500, "easeOutSine");
        $line.inner = $line.create(".inner");
        $line.inner.size("100%").css({
            left: "-100%"
        }).bg("#fff")
    }

    function initFlame() {
        $flame.css({
            width: 200,
            height: 200,
            top: "50%",
            left: "50%",
            overflow: "hidden",
            marginLeft: -100,
            marginTop: -100
        });
        $flame.inner = $flame.create(".load-flame");
        $flame.inner.size(5400, 200).bg(Config.CDN + "assets/images/ui/load.jpg", 0, 0);
        $flame.css({
            opacity: 0
        }).transform({
            scale: 0.9
        }).tween({
            opacity: 1,
            scale: 1
        }, 500, "easeOutSine")
    }

    function initInstruction() {
        var screen = Device.mobile && Mobile.os == "iOS" && Stage.height > Stage.width ? LoaderRotate : LoaderHeadphones;
        if (Tests.useFallback() && LoaderHeadphones) {
            return
        }
        _instruction = _this.initClass(screen);
        _this.delayedCall(_instruction.animateIn, 100)
    }

    function update() {
        if (!_this.complete) {
            $line.inner.x = Math.round($this.perc * 45);
            $line.inner.transform()
        }
    }
    this.update = function(p) {
        TweenManager.tween($this, {
            perc: p
        }, 1000, "easeInOutSine", null, update)
    };
    this.animateOut = function(callback) {
        if (_this.complete) {
            return
        }
        _this.complete = true;
        $line.bg("#000");
        $line.inner.stopTween().transform({
            x: 45
        }).tween({
            x: 90
        }, 600, "easeOutCubic", 500);
        if (_instruction) {
            _instruction.element.tween({
                opacity: 0
            }, 600, "easeOutSine", 800)
        }
        $flame.tween({
            opacity: 0,
            scale: 0.8
        }, 1500, "easeInOutSine", 800);
        $this.tween({
            opacity: 0
        }, 1500, "easeInOutSine", 1500, callback)
    }
});
Class(function LoaderHeadphones() {
    Inherit(this, View);
    var _this = this;
    var $this, $icon, $text;
    (function() {
        initHTML();
        initIcon();
        initText();
        resize();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $this.size(300, 100).center(1, 0).css({
            bottom: Mobile.phone ? 0 : 10
        }).invisible()
    }

    function initIcon() {
        $icon = $this.create(".icon");
        $icon.size(40, 40).center(1, 0).css({
            top: -25
        }).bg(Config.CDN + "assets/images/ui/headphones.png")
    }

    function initText() {
        var size = 10;
        $text = $this.create(".text");
        $text.fontStyle("RobotoMed", size, "#888");
        $text.css({
            top: "50%",
            width: "100%",
            textTransform: "uppercase",
            textAlign: "center",
            marginTop: -size - 10,
            lineHeight: size * 1.5,
            letterSpacing: 2
        });
        $text.text("Better with headphones")
    }

    function addHandlers() {
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function resize() {
        if (!Mobile.phone) {
            return
        }
        if (Stage.width < Stage.height) {
            $icon.show()
        } else {
            $icon.hide()
        }
    }
    this.animateIn = function() {
        $this.visible();
        $icon.transform({
            y: 10
        }).css({
            opacity: 0
        }).tween({
            opacity: 0.5,
            y: 0
        }, 600, "easeOutCubic");
        $text.transform({
            y: 10
        }).css({
            opacity: 0
        }).tween({
            opacity: 1,
            y: 0
        }, 600, "easeOutCubic", 200)
    }
});
Class(function LoaderRotate() {
    Inherit(this, View);
    var _this = this;
    var $this, $icon, $text;
    var _anim;
    (function() {
        initHTML();
        initIcon();
        initText();
        addHandlers()
    })();

    function initHTML() {
        $this = _this.element;
        $this.size(300, 100).center(1, 0).css({
            bottom: 10
        }).invisible()
    }

    function initIcon() {
        $icon = $this.create("icon");
        $icon.size(40, 40).center(1, 0).css({
            top: -25,
            opacity: 0.6
        }).bg(Config.CDN + "assets/images/ui/rotate.png");
        _anim = _this.initClass(CSSAnimation);
        _anim.loop = true;
        _anim.ease = "easeInOutQuart";
        _anim.duration = 2000;
        _anim.frames = [{
            rotation: 0
        }, {
            rotation: -180
        }, ];
        _anim.applyTo($icon)
    }

    function initText() {
        var size = 10;
        $text = $this.create(".text");
        $text.fontStyle("RobotoMed", size, "#888");
        $text.css({
            top: "50%",
            width: "100%",
            textTransform: "uppercase",
            textAlign: "center",
            marginTop: -size - 10,
            lineHeight: size * 1.5,
            letterSpacing: 2
        });
        $text.text("Better in landscape")
    }

    function addHandlers() {
        _this.events.subscribe(HydraEvents.RESIZE, resize)
    }

    function resize() {
        if (!Device.mobile) {
            return
        }
        if (Stage.width < Stage.height) {
            $this.show()
        } else {
            $this.hide()
        }
    }
    this.animateIn = function() {
        $this.visible();
        _anim.play();
        $this.transform({
            y: 10
        }).css({
            opacity: 0
        }).tween({
            opacity: 1,
            y: 0
        }, 600, "easeOutCubic");
        $text.transform({
            y: 10
        }).css({
            opacity: 0
        }).tween({
            opacity: 1,
            y: 0
        }, 600, "easeOutCubic", 200)
    }
});
ParticleBehaviors.Class(function Life() {
    Inherit(this, ParticleBehavior);
    var _this = this;

    function initUIL() {
        var group = Global.UIL.add("group", {
            name: "Life"
        });
        var config = [{
            name: "decay",
            min: 1,
            max: 10
        }, ];
        config.forEach(function(obj) {
            var val = new UILItem(obj.name, _this.getUniform(obj.name).value, {
                min: obj.min,
                max: obj.max
            }, function(val) {
                _this.updateUniform(obj.name, val)
            });
            group.add("slide", val.obj)
        })
    }
    this.initGPU = function() {
        var pass = new AntimatterPass("Life");
        _this.pass = pass
    };
    this.applyBehavior = function(p) {};
    this.onReady = function(antimatter) {
        if (antimatter) {
            this.addUniform("decay", 5.4);
            if (Global.UIL) {
                initUIL()
            }
        }
    }
});
ParticleBehaviors.Class(function ParticleFlow() {
    Inherit(this, ParticleBehavior);
    var _this = this;

    function initUIL() {
        var group = Global.UIL.add("group", {
            name: "Particles"
        });
        var config = [{
            name: "curlInput",
            min: 1,
            max: 1.5
        }, {
            name: "flowSpeed",
            min: 0,
            max: 5
        }, {
            name: "zSpeed",
            min: 0,
            max: 1
        }, ];
        config.forEach(function(obj) {
            var val = new UILItem(obj.name, _this.getUniform(obj.name).value, {
                min: obj.min,
                max: obj.max
            }, function(val) {
                _this.updateUniform(obj.name, val)
            });
            group.add("slide", val.obj)
        })
    }
    this.initGPU = function() {
        var pass = new AntimatterPass("ParticleFlow");
        _this.pass = pass
    };
    this.applyBehavior = function(p) {};
    this.onReady = function(antimatter) {
        if (antimatter) {
            _this.pass.addInput("tOrigin", antimatter.vertices);
            _this.addUniform("curlInput", Tests.embedded() ? 1.2 : 0.7);
            _this.addUniform("flowSpeed", Tests.embedded() ? 1.02 : 1.42);
            _this.addUniform("zSpeed", 0.64);
            _this.addUniform("zAmount", Tests.embedded() ? 1 : 0.05);
            _this.addUniform("speedMultiplier", 0.64);
            if (window.EMBED_UIL) {
                EMBED_UIL.add("slide", {
                    name: "particleSpeed",
                    min: 0,
                    max: 1,
                    value: 0.64,
                    precision: 3,
                    fontColor: "#F6E497",
                    height: 20,
                    callback: function(v) {
                        _this.updateUniform("speedMultiplier", v)
                    }
                })
            }
        }
    }
});
ParticleBehaviors.Class(function Test() {
    Inherit(this, ParticleBehavior);
    var _this = this;
    this.initGPU = function() {
        var pass = new AntimatterPass("Test");
        _this.pass = pass
    };
    this.applyBehavior = function(p) {};
    this.onReady = function(antimatter) {
        if (antimatter) {
            console.log(antimatter.particleAttributes)
        }
        this.addUniform("offset", new Vector2(1, 1))
    }
});
Class(function PatronusAnimation(_geometry, _data, _root, _center) {
    Inherit(this, Component);
    var _this = this;
    var _mesh, _mixer;
    var _scaleMultiplier = 0.008;
    (function() {
        initMesh();
        initAnimation();
        Render.start(loop)
    })();

    function initMesh() {
        var material = new THREE.MeshBasicMaterial({
            wireframe: true,
            skinning: true
        });
        _mesh = new THREE.SkinnedMesh(_geometry, material);
        _mesh.frustumCulled = false;
        _mesh.renderOrder = 0;
        _this.mesh = _mesh;
        var s = _data.scale * _scaleMultiplier;
        _root.scale.set(s, s, s);
        _center.position.y = -_geometry.boundingSphere.center.y;
        _center.add(_mesh.children[0]);
        _root.add(_center);
        _mesh.add(_root)
    }

    function initAnimation() {
        var clip = THREE.AnimationClip.parseAnimation(_geometry.animation, _geometry.bones);
        _mixer = new THREE.AnimationMixer(_mesh);
        var action = _mixer.clipAction(clip);
        action.play();
        _mesh.mixer = _mixer;
        _this.mixer = _mixer
    }

    function loop(t, dt, delta) {
        if (Embed.ID) {
            updateParameters()
        }
        _mixer.update(_data.speed * (Config.RECORDING ? 1 : (delta / 16)))
    }

    function updateParameters() {
        var speed = Embed.SPEED;
        var scale = Embed.SCALE;
        _data.speed = speed;
        var s = scale * _scaleMultiplier;
        _root.scale.set(s, s, s);
        _center.position.y = -_geometry.boundingSphere.center.y
    }
});
Class(function PatronusMeshShader(_mesh, _data, _invPosMat, _tileMat) {
    Inherit(this, Component);
    var _this = this;
    var _shader, _refractionRotation;
    (function() {
        initShader();
        Render.start(loop);
        if (Global.UIL) {
            defer(initUIL)
        }
    })();

    function initShader() {
        var lightScale = !Embed.ACTIVE ? _data.overrideLightScale || _data.lightScale : _data.lightScale;
        _shader = new Shader("PatronusMesh");
        _shader.uniforms = {
            lightColor0: {
                type: "c",
                value: new THREE.Color(6530293)
            },
            lightColor1: {
                type: "c",
                value: new THREE.Color(3915240)
            },
            illuminate: {
                type: "f",
                value: new THREE.Vector3(_data.lightX || 0, _data.lightY || 1.3, _data.lightZ || 0)
            },
            invPosMat: {
                type: "Matrix4fv",
                value: _invPosMat
            },
            tileMat: {
                type: "Matrix4fv",
                value: new THREE.Matrix4().copy(_tileMat).transpose()
            },
            boundingRadius: {
                type: "f",
                value: _mesh.geometry.boundingSphere.radius
            },
            rotateNormal: {
                type: "f",
                value: Utils.toRadians(_data.rotateNormal || 0)
            },
            refractionRate: {
                type: "f",
                value: 1
            },
            inTransition: {
                type: "f",
                value: 0
            },
            highlightMin: {
                type: "f",
                value: 0.6
            },
            highlightMax: {
                type: "f",
                value: 1
            },
            strength: {
                type: "f",
                value: 0.75
            },
            highlightStrength: {
                type: "f",
                value: 1
            },
            shininess: {
                type: "f",
                value: 8.71
            },
            LTPower: {
                type: "f",
                value: 0
            },
            LTScale: {
                type: "f",
                value: 0.2
            },
            LTDistortion: {
                type: "f",
                value: 0
            },
            LTAmbient: {
                type: "f",
                value: 1
            },
            alpha: {
                type: "f",
                value: 0
            },
            highlightScale: {
                type: "f",
                value: lightScale
            },
            resolution: {
                type: "v2",
                value: new THREE.Vector2(Stage.width, Stage.height)
            },
            envMap: {
                type: "t",
                value: FX.Translucency.instance().rt.texture
            },
            tDistortion: {
                type: "t",
                value: Utils3D.getTexture("assets/images/patronus/distortion.jpg")
            },
        };
        if (_data && _data.light) {
            console.log("here");
            _shader.uniforms.illuminate.value.copy(_data.light)
        }
        _shader.useShaderMaterial = true;
        _shader.material.side = THREE.DoubleSide;
        _shader.material.skinning = true;
        _shader.material.transparent = true;
        _mesh.material = _shader.material;
        _this.delayedCall(function() {
            _shader.uniforms.boundingRadius.value *= _this.parent.root.getWorldScale().x * 1.5
        }, 10)
    }

    function initUIL() {
        var group = Global.UIL.add("group", {
            name: "Mesh"
        });
        var lightColor0 = new UILItem("Light Color 0", _shader.uniforms.lightColor0.value.getHex(), function(color) {
            _shader.uniforms.lightColor0.value.set(color)
        });
        group.add("color", lightColor0.obj);
        var lightColor1 = new UILItem("Light Color 1", _shader.uniforms.lightColor1.value.getHex(), function(color) {
            _shader.uniforms.lightColor1.value.set(color)
        });
        group.add("color", lightColor1.obj);
        var config = [{
            name: "strength",
            min: 0,
            max: 1
        }, {
            name: "highlightStrength",
            min: 0,
            max: 1
        }, {
            name: "shininess",
            min: 0,
            max: 256
        }, {
            name: "refractionRate",
            min: 0,
            max: 1
        }, {
            name: "highlightMin",
            min: 0,
            max: 1
        }, {
            name: "highlightMax",
            min: 0,
            max: 1
        }, {
            name: "LTPower",
            min: 0,
            max: 20
        }, {
            name: "LTScale",
            min: 0,
            max: 20
        }, {
            name: "LTDistortion",
            min: 0,
            max: 0.5
        }, {
            name: "LTAmbient",
            min: 0,
            max: 10
        }, ];
        config.forEach(function(obj) {
            var val = new UILItem(obj.name, _shader.uniforms[obj.name].value, {
                min: obj.min,
                max: obj.max
            }, function(val) {
                _shader.set(obj.name, val)
            });
            group.add("slide", val.obj)
        })
    }

    function loop() {
        _shader.uniforms.resolution.value.set(Stage.width, Stage.height);
        if (Embed.DEV) {
            _shader.uniforms.illuminate.value.z = Embed.LIGHTZ;
            _shader.uniforms.illuminate.value.y = Embed.LIGHTY;
            _shader.uniforms.illuminate.value.x = Embed.LIGHTX;
            _shader.uniforms.highlightScale.value = Embed.LIGHT_SCALE
        }
    }
    this.set("tileMatrix", function(matrix) {
        _shader.set("tileMat", new THREE.Matrix4().copy(matrix).transpose())
    });
    this.preIn = function() {
        _shader.material.visible = false
    };
    this.animateIn = function() {
        if (_this.parent.isIntro) {
            _shader.material.visible = true
        }
        _shader.tween("inTransition", 1, 2000, "easeInOutSine", 1500);
        _shader.tween("alpha", 1, 1000, "easeInOutSine", 1500);
        _this.delayedCall(function() {
            _shader.material.visible = true
        }, 1500)
    };
    this.animateOut = function() {
        _shader.tween("inTransition", 0, _this.parent.isIntro ? 500 : 1000, "easeOutSine");
        _shader.tween("alpha", 0, 500, "easeOutSine", _this.parent.isIntro ? 0 : 500, function() {
            _shader.material.visible = false
        })
    };
    this.stopRender = function() {
        Render.stop(loop)
    };
    this.onDestroy = function() {
        Render.stop(loop)
    }
});
Class(function PatronusParticles(_geometry, _animation, _rotation, _tileMatrix) {
    Inherit(this, Component);
    var _this = this;
    var _engine, _flow;
    (function() {
        initEngine();
        initBehaviors();
        addListeners()
    })();

    function initEngine() {
        _engine = _this.initClass(ParticleEngine, _geometry.particles, "PatronusParticles");
        _engine.events.add(HydraEvents.READY, engineReady);
        _this.group = _engine.group
    }

    function initBehaviors() {
        var life = ParticleBehaviors.get("Life");
        if (life.pass) {
            life.pass.addInput("tDecay", _geometry.particles.attributes);
            life.pass.origin = _geometry.particles.lifeOrigin;
            _engine.addBehavior(life)
        }
        var flow = ParticleBehaviors.get("ParticleFlow");
        _engine.addBehavior(flow);
        _engine.lifePass = life.pass;
        var skinWeights = new AntimatterAttribute(_geometry.particles.skinWeights, 4);
        var skinIndices = new AntimatterAttribute(_geometry.particles.skinIndices, 4);
        flow.addUniform("inDirection", 1);
        flow.addUniform("inTransition", 0);
        if (Tests.useGPUParticles()) {
            flow.pass.addInput("tLife", life.pass.output);
            flow.pass.addInput("tProperties", _geometry.particles.attributes);
            flow.pass.addInput("rotationDirection", {
                type: "v3",
                value: _rotation
            });
            flow.pass.addInput("tSkinIndex", {
                type: "t",
                value: skinIndices.texture
            });
            flow.pass.addInput("tSkinWeight", {
                type: "t",
                value: skinWeights.texture
            });
            flow.pass.addInput("tBoneTexture", {
                type: "t",
                value: _animation.mesh.skeleton.boneTexture
            });
            flow.pass.addInput("boneTextureWidth", {
                type: "f",
                value: _animation.mesh.skeleton.boneTextureWidth
            });
            flow.pass.addInput("boneTextureHeight", {
                type: "f",
                value: _animation.mesh.skeleton.boneTextureHeight
            })
        }
        _flow = flow
    }

    function addListeners() {
        _this.events.subscribe(World.DROP_DPR, adjustSize)
    }

    function adjustSize() {
        _engine.shader.set("pointSize", 0.028 * Tests.particleScale() * World.DPR)
    }

    function engineReady() {
        _engine.shader.material.blending = THREE.AdditiveBlending;
        _engine.shader.material.transparent = true;
        _engine.shader.material.depthWrite = false;
        _engine.shader.uniforms.alpha = {
            type: "f",
            value: Tests.embedded() ? 1 : 0.7
        };
        _engine.shader.uniforms.inTransition = {
            type: "f",
            value: 0
        };
        _engine.shader.uniforms.minSize = {
            type: "f",
            value: World.DPR * 0.8 * Tests.particleScale()
        };
        _engine.shader.uniforms.tileMat = {
            type: "Matrix4fv",
            value: new THREE.Matrix4().copy(_tileMatrix).transpose()
        };
        _engine.shader.uniforms.tRamp = {
            type: "t",
            value: Utils3D.getTexture("assets/images/patronus/ramp.jpg")
        };
        Dev.expose("particles", _this);
        _this.engine = _engine;
        if (Tests.useGPUParticles()) {
            _engine.shader.uniforms.tProperties = {
                type: "t",
                value: _geometry.particles.attributes.texture
            };
            _engine.shader.uniforms.tLife = {
                type: "t",
                value: _engine.lifePass.output
            }
        }
        if (Tests.getSize() == 512) {
            _engine.shader.uniforms.minSize.origin = _engine.shader.uniforms.minSize.value;
            if (_this.active("intro")) {
                _engine.shader.uniforms.minSize.value *= 0.6
            }
        }
        _this.parent.events.fire(HydraEvents.READY)
    }
    this.set("tileMatrix", function(matrix) {
        _engine.shader.set("tileMat", new THREE.Matrix4().copy(matrix).transpose())
    });
    this.animateIn = function(slow) {
        if (!_engine.shader) {
            return _this.delayedCall(_this.animateIn, 50, slow)
        }
        _engine.startRender();
        _flow.updateUniform("inDirection", 1);
        _flow.tween("inTransition", 1, slow ? 5000 : 2000, "easeInOutSine", 100);
        _engine.shader.tween("inTransition", 1, slow ? 5000 : 500, "easeOutSine", 100)
    };
    this.animateOut = function() {
        _flow.updateUniform("inDirection", -1);
        _flow.tween("inTransition", 0, 1700, "easeOutSine");
        _engine.shader.tween("inTransition", 0, _this.parent.isIntro && !_this.corp ? 300 : (_this.corp ? 1200 : 700), "easeOutSine", function() {
            if (Tests.getSize() == 512 && _this.active("intro")) {
                _engine.shader.uniforms.minSize.value *= 4
            }
        })
    };
    this.stopRender = function() {
        _engine.stopRender()
    };
    this.introParticles = function() {
        if (_flow) {
            _flow.updateUniform("zAmount", 1.4);
            _flow.updateUniform("curlInput", 0.6)
        }
        _this.active("intro", true)
    };
    this.nonCorporeal = function() {
        if (_flow) {
            _this.corp = true;
            _flow.updateUniform("zAmount", -0.4);
            _flow.updateUniform("curlInput", 0.6);
            if (Hardware.LOW_GPU) {
                _engine.shader.uniforms.alpha = {
                    type: "f",
                    value: 1
                }
            }
        }
    }
});
Class(function Tiling(_camera) {
    Inherit(this, Component);
    var _this = this;
    var _treadmill, _store, _movement;
    this.group = new THREE.Group();
    var _tiles = [{
        size: 75,
        curves: [
            [Hydra.JSON.curves.lake[0], 15000, "straight", "bottom"],
        ],
        meshes: [],
        active: [],
    }, {
        size: 75,
        curves: [
            [Hydra.JSON.curves.forest[0], 10000, "straight", "bottom"],
            [Hydra.JSON.curves.forest[1], 10000, "straight", "bottom"],
            [Hydra.JSON.curves.forest[2], 10000, "straight", "bottom"],
            [Hydra.JSON.curves.forest[3], 10000, "straight", "bottom"],
            [Hydra.JSON.curves.forest[4], 10000, "right", "bottom"],
            [Hydra.JSON.curves.forest[5], 10000, "left", "bottom"],
            [Hydra.JSON.curves.forest[6], 10000, "straight", "left"],
            [Hydra.JSON.curves.forest[7], 10000, "right", "left"],
            [Hydra.JSON.curves.forest[8], 10000, "left", "left"],
        ],
        meshes: [],
        active: [],
    }];
    (function() {
        initGroups();
        createCurves();
        createTiles();
        initMovement()
    })();

    function initGroups() {
        _treadmill = new THREE.Group();
        _store = new THREE.Group();
        _this.group.add(_treadmill);
        _this.group.add(_store);
        _store.position.x = -99999
    }

    function createCurves() {
        _tiles.forEach(function(tile) {
            tile.curves.forEach(function(data, i) {
                var points = [];
                for (var j = 0; j < data[0].length; j += 3) {
                    points.push(new THREE.Vector3(data[0][j + 0], data[0][j + 1], data[0][j + 2]))
                }
                var curve = new THREE.CatmullRomCurve3(points);
                curve.duration = data[1];
                curve.direction = data[2];
                curve.entry = data[3];
                tile.curves[i] = curve
            })
        })
    }

    function createTiles() {
        _tiles.forEach(function(data, tileIndex) {
            for (var i = 0; i < (tileIndex > 0 ? 2 : 1); i++) {
                var tile;
                if (tileIndex === 0) {
                    tile = _this.initClass(ForestLakeTile)
                } else {
                    tile = _this.initClass(ForestTile, 0)
                }
                tile.hide();
                var group = tile.group;
                _store.add(group);
                data.meshes.push(tile)
            }
        });
        _this.tiles = _tiles
    }

    function initMovement() {
        _movement = _this.initClass(TilingMovement, _camera, _tiles, _treadmill, _store)
    }
    this.toClearing = function(callback) {
        if (!_movement) {
            return
        }
        _movement.toClearing(callback)
    };
    this.toLake = function(callback) {
        if (!_movement) {
            return
        }
        _movement.toLake(callback)
    }
});
Class(function TilingMovement(_camera, _tiles, _treadmill, _store) {
    Inherit(this, Component);
    var _this = this;
    var _randomizr;
    var _current = 0;
    var _next = 0;
    var _nextPosition = new THREE.Vector3();
    var _movement = new THREE.Vector3();
    var _turn = new THREE.Quaternion();
    var _yAxis = new THREE.Vector3(0, 1, 0);
    (function() {
        initFirstTile()
    })();

    function initFirstTile() {
        if (!_camera.target) {
            _camera.target = new THREE.Vector3()
        }
        var activeTile = _tiles[_current].meshes.splice(0, 1)[0];
        _tiles[_current].active.push(activeTile);
        _treadmill.add(activeTile.group);
        activeTile.show();
        activeTile.curve = _tiles[_current].curves.getRandom();
        _camera.position.copy(activeTile.group.localToWorld(activeTile.curve.getPoint(0.5)));
        _camera.target.copy(activeTile.group.localToWorld(activeTile.curve.getPoint(0.6)));
        _camera.lookAt(_camera.target);
        _randomizr = require("Randomizr")
    }

    function nextTile(index, ease, callback, isLast) {
        _next = index;
        var nextTile = _tiles[_next].meshes.splice(0, 1)[0];
        _tiles[_next].active.push(nextTile);
        _treadmill.add(nextTile.group);
        nextTile.show();
        var curveIndex = _randomizr(0, _tiles[_next].curves.length - 1, 5);
        if (index == 1 && QuizView.QUESTION_INDEX > 3) {
            curveIndex = [4, 5, 7, 8].getRandom()
        }
        nextTile.curve = _tiles[_next].curves[curveIndex];
        var activeTile = _tiles[_current].active.splice(0, 1)[0];
        _nextPosition.copy(activeTile.group.position);
        var distance = _tiles[_current].size * 0.5 + _tiles[_next].size * 0.5;
        var turnAmount = 0;
        var currentDir = activeTile.curve.direction;
        turnAmount += currentDir == "right" ? -Math.PI / 2 : currentDir == "left" ? Math.PI / 2 : 0;
        var currentEntry = activeTile.curve.entry;
        turnAmount += currentEntry == "right" ? Math.PI / 2 : currentEntry == "left" ? -Math.PI / 2 : 0;
        _turn.setFromAxisAngle(_yAxis, turnAmount);
        _movement.set(0, 0, distance);
        _movement.applyQuaternion(activeTile.group.quaternion);
        _movement.applyQuaternion(_turn);
        _nextPosition.add(_movement);
        nextTile.group.position.copy(_nextPosition);
        nextTile.group.quaternion.copy(activeTile.group.quaternion);
        nextTile.group.quaternion.multiply(_turn);
        var nextEntry = nextTile.curve.entry;
        turnAmount = nextEntry == "right" ? -Math.PI / 2 : nextEntry == "left" ? Math.PI / 2 : 0;
        _turn.setFromAxisAngle(_yAxis, turnAmount);
        nextTile.group.quaternion.multiply(_turn);
        var duration = 0.5 * activeTile.curve.duration + 0.5 * nextTile.curve.duration;
        AudioController.tileTransitionStart(duration, turnAmount, distance);
        if (isLast) {
            nextTile.group.updateMatrixWorld();
            var point1 = nextTile.group.localToWorld(nextTile.curve.getPoint(0.5));
            var point3 = nextTile.group.localToWorld(nextTile.curve.getPoint(0.6));
            var point2 = point3.clone();
            point2.sub(point1);
            point2.normalize();
            point2.multiplyScalar(10);
            point2.add(point1);
            _this.events.fire(TilingMovement.END_POSITION, {
                pos: point1,
                lookAt: point2
            });
            nextTile.nextPos(point2, point1, duration)
        }
        var progress = {
            x: 0
        };
        var onUpdate = function(force) {
            var p1 = Utils.range(progress.x, 0, 0.5, 0.5, 1);
            var p2 = Utils.range(progress.x, 0.5, 1, 0, 0.5);
            if (progress.x < 0.5) {
                _camera.position.copy(activeTile.group.localToWorld(activeTile.curve.getPoint(p1)))
            } else {
                _camera.position.copy(nextTile.group.localToWorld(nextTile.curve.getPoint(p2)))
            }
            var tP = progress.x + 0.1;
            var tP1 = Utils.range(tP, 0, 0.5, 0.5, 1);
            var tP2 = Utils.range(tP, 0.5, 1, 0, 0.5);
            if (tP < 0.5) {
                _camera.target.lerp(activeTile.group.localToWorld(activeTile.curve.getPoint(tP1)), 0.1)
            } else {
                if (force == "force") {
                    var target = nextTile.group.localToWorld(nextTile.curve.getPoint(tP2));
                    var lerp = _camera.target.distanceTo(target) > 1 ? 1 : 0.1;
                    _camera.target.lerp(target, lerp)
                } else {
                    _camera.target.lerp(nextTile.group.localToWorld(nextTile.curve.getPoint(tP2)), 0.1)
                }
            }
            _camera.lookAt(_camera.target);
            AudioController.tileTransitionUpdate(progress.x, _camera)
        };
        var onComplete = function() {
            onUpdate("force");
            if (!_this.hasMoved) {
                activeTile.removeIntro()
            }
            _this.hasMoved = true;
            activeTile.group.position.set(0, 0, 0);
            activeTile.group.quaternion.set(0, 0, 0, 1);
            _tiles[_current].meshes.push(activeTile);
            _store.add(activeTile.group);
            activeTile.hide();
            _current = _next;
            if (typeof callback == "function") {
                callback()
            }
        };
        TweenManager.tween(progress, {
            x: 1
        }, duration, ease, onComplete, onUpdate)
    }

    function moveTo(endIndex, callback) {
        if (_tiles[endIndex].meshes.length === 0) {
            console.trace("0 available tiles, why", _tiles)
        }
        nextTile(endIndex, "easeInOutSine", function() {
            if (typeof callback == "function") {
                callback()
            }
        }, true)
    }
    this.toClearing = function(callback) {
        moveTo(1, callback)
    };
    this.toLake = function(callback) {
        moveTo(0, callback)
    }
}, function() {
    TweenManager.addCustomEase({
        name: "EaseInLinearOut",
        curve: "cubic-bezier(0.5, 0.0, 0.75, 0.75);"
    });
    TweenManager.addCustomEase({
        name: "LinearInEaseOut",
        curve: "cubic-bezier(0.25, 0.25, 0.5, 1.00);"
    });
    TilingMovement.END_POSITION = "tiling_end_position"
});
Class(function VFX(_renderer, _scene) {
    Inherit(this, Component);
    var _this = this;
    var _nuke, _fog, _light, _pass, _trans;
    var _perf = new RenderPerformance();
    var _disabled = !Tests.renderVFX();
    var EXTRAS = Tests.vfxExtras();
    var MAX_SIZE = Hardware.GOOD_GPU ? 1600 : 1440;
    (function() {
        initNuke();
        initTranslucency();
        if (_disabled) {
            return
        }
        initFog();
        initLight();
        initPass();
        Render.start(loop);
        _perf.drop = 0;
        if (!Device.mobile) {
            _this.delayedCall(testPerf, 2000);
            if (_disabled) {
                _this.active("disabled", true)
            }
            _perf.enabled = false;
            setTimeout(function() {
                _perf.enabled = true
            }, 250);
            Dev.expose("perf", _perf)
        }
    })();

    function initNuke() {
        _nuke = _this.initClass(Nuke, Stage, {
            renderer: _renderer,
            scene: _scene,
            camera: World.CAMERA,
            dpr: World.DPR
        })
    }

    function initFog() {
        _fog = FX.Fog.instance(_nuke)
    }

    function initLight() {
        _light = FX.Light.instance(_nuke)
    }

    function initTranslucency() {
        _trans = FX.Translucency.instance(_nuke)
    }

    function testPerf() {
        _perf.enableFPS = true;
        if (_perf.median > 2) {
            _disabled = true;
            _this.active("disabled", true);
            _fog.show()
        }
        _this.delayedCall(function() {
            _perf.enableFPS = false
        }, Hardware.GOOD_GPU ? 5000 : 20000)
    }

    function initPass() {
        _pass = _this.initClass(NukePass, "VFXComposite");
        _pass.uniforms = {
            tFog: {
                type: "t",
                value: _fog.rt.texture
            },
            tLight: {
                type: "t",
                value: _light.rt.texture
            },
            tClouds: {
                type: "t",
                value: _fog.spriteRT.texture
            },
            time: {
                type: "f",
                value: 0
            },
            fogColor: {
                type: "c",
                value: new THREE.Color(397077)
            },
            cameraPos: {
                type: "v3",
                value: Camera.instance().worldCamera.position
            }
        };
        _nuke.add(_pass);
        if (Global.UIL) {
            var group = Global.UIL.add("group", {
                name: "Fog"
            });
            group.add("color", new UILItem("Fog Color", _pass.uniforms.fogColor.value.getHex(), function(color) {
                if (!color[0]) {
                    return
                }
                _pass.uniforms.fogColor.value.setRGB(color[0], color[1], color[2])
            }).obj)
        }
    }

    function loop() {
        _pass.set("time", Render.TSL * 0.0025);
        if (!_this.active("disabled")) {
            if (Math.max(Stage.width, Stage.height) > MAX_SIZE) {
                _disabled = true;
                _fog.show()
            } else {
                _disabled = false;
                _fog.hide()
            }
        }
        if (!Device.mobile) {
            if (_perf.enableFPS) {
                if (_perf.averageFPS < 54) {
                    _perf.drop++;
                    if (_perf.drop > 10) {
                        _disabled = true;
                        _this.active("disabled", true);
                        _perf.enabled = false;
                        _fog.show()
                    }
                } else {
                    _perf.drop--;
                    if (_perf.drop < 0) {
                        _perf.drop = 0
                    }
                }
            }
        }
    }
    this.onRenderEye = function(stage, camera) {
        if (!_trans.disabled) {
            _trans.render(stage, camera)
        }
        if (_disabled) {
            return _renderer.render(_scene, camera)
        }
        _perf.time();
        if (EXTRAS) {
            _fog && _fog.render(stage, camera);
            _light && _light.render(stage, camera)
        }
        _nuke.setSize(stage.width, stage.height);
        _nuke.stage = stage;
        _nuke.camera = camera;
        _nuke.render();
        _perf.time()
    }
});
FX.Class(function Fog(_nuke) {
    Inherit(this, FXLayer);
    var _this = this;
    var _base, _layer;
    this.resolution = Device.mobile ? 0.7 : 0.5;
    var _fogs = [];
    (function() {
        if (!Tests.renderVFX()) {
            return
        }
        _this.create(_nuke);
        _this.setDPR(1);
        initLayer()
    })();

    function getBaseMaterial() {
        if (!_base) {
            _base = new Shader("FogDepth");
            _base.uniforms = {
                far: {
                    type: "f",
                    value: 10
                }
            }
        }
        return _base.material
    }

    function initLayer() {
        _layer = _this.initClass(FXLayer, _nuke);
        _this.spriteRT = _layer.rt;
        _layer.autoVisible = false;
        _layer.resolution = 0.5
    }
    this.add = function(object) {
        var mesh = this.addObject(object);
        mesh.material = getBaseMaterial();
        return mesh
    };
    this.addSprite = function(object) {
        if (!_layer) {
            return
        }
        var mesh = _layer.addObject(object);
        mesh.frustumCulled = false;
        object.visible = false;
        _fogs.push(object);
        return mesh
    };
    this.addGround = function(object) {
        if (!_layer) {
            return {
                material: {}
            }
        }
        var mesh = _layer.addObject(object);
        mesh.frustumCulled = false;
        mesh.material = new THREE.MeshBasicMaterial({
            color: 0
        });
        return mesh
    };
    this.show = function() {
        _fogs.forEach(function(f) {
            f.visible = true
        })
    };
    this.hide = function() {
        _fogs.forEach(function(f) {
            f.visible = false
        })
    };
    this.render = function(stage, camera) {
        if (!this._render) {
            return
        }
        _layer.render(stage, camera);
        this._render(stage, camera)
    }
}, "singleton");
FX.Class(function Light(_nuke) {
    Inherit(this, FXLayer);
    var _this = this;
    var _projection, _volume, _lightPos;
    var _black = new THREE.MeshBasicMaterial({
        color: 0
    });
    var _blurs = [];
    this.resolution = 0.4;
    (function() {
        if (!Tests.renderVFX()) {
            return
        }
        _projection = new ScreenProjection(Camera.instance().worldCamera);
        _this.create(_nuke);
        _this.setDPR(1);
        initPass();
        initBlurPasses()
    })();

    function initPass() {
        _this.pass = new NukePass("LightComposite");
        _this.pass.uniforms = {
            tInput: {
                type: "t",
                value: _this.rt
            },
            fCoeff: {
                type: "f",
                value: 1
            }
        }
    }

    function initBlurPasses() {
        var blur = new NukePass("LightBlur");
        blur.uniforms = {
            res: {
                type: "v2",
                value: new THREE.Vector2()
            },
            dir: {
                type: "v2",
                value: new THREE.Vector2(1, 0)
            }
        };
        var directions = [new THREE.Vector2(5, 0), new THREE.Vector2(0, 5), ];
        directions.forEach(function(dir) {
            var pass = blur.clone();
            pass.set("dir", dir);
            _this.nuke.add(pass);
            _blurs.push(pass)
        });
        _volume = new NukePass("LightVolume");
        _volume.uniforms = {
            lightPos: {
                type: "v2",
                value: new THREE.Vector2()
            },
            fExposure: {
                type: "f",
                value: 0.2
            },
            fDecay: {
                type: "f",
                value: 0.93
            },
            fDensity: {
                type: "f",
                value: 0.96
            },
            fWeight: {
                type: "f",
                value: 0.4
            },
            fClamp: {
                type: "f",
                value: 1
            }
        };
        _this.nuke.add(_volume)
    }
    this.add = function(mesh, light) {
        var obj = this.addObject(mesh);
        if (!light) {
            obj.material = _black
        } else {
            _lightPos = obj.position
        }
        obj.material.side = THREE.DoubleSide
    };
    this.render = function(stage, camera) {
        if (!_lightPos) {
            return
        }
        _this = this;
        _nuke.stage = stage;
        _nuke.camera = camera;
        _this.setSize(stage.width, stage.height);
        for (var i = _blurs.length - 1; i > -1; i--) {
            _blurs[i].uniforms.res.value.set(stage.width * _this.resolution, stage.height * _this.resolution)
        }
        var clear = _nuke.renderer.getClearColor();
        _nuke.renderer.setClearColor(0);
        _this.draw(stage, camera);
        _nuke.renderer.setClearColor(clear);
        _projection.camera = camera;
        var screen = _projection.project(_lightPos, stage);
        screen.x /= stage.width;
        screen.y /= stage.height;
        _volume.uniforms.lightPos.value.set(screen.x, 1 - screen.y)
    }
}, "singleton");
FX.Class(function Translucency(_nuke) {
    Inherit(this, FXLayer);
    var _this = this;
    this.resolution = 0.5;
    (function() {
        _this.create(_nuke);
        _this.setDPR(1);
        if (!Tests.translucentPatronus()) {
            _this.disabled = true;
            _this.perfDisabled = true
        }
    })();
    this.add = function(obj) {
        var mesh = this.addObject(obj);
        mesh.frustumCulled = true
    };
    this.activate = function() {
        if (this.perfDisabled) {
            return
        }
        this.disabled = false
    };
    this.deactivate = function() {
        if (this.perfDisabled) {
            return
        }
        this.disabled = true
    }
}, "singleton");
Class(function Main() {
    Thread.PATH = Hydra.LOCAL ? "" : "/";
    (function() {
        init()
    })();

    function init() {
        Mouse.capture();
        if (!Tests.useFallback()) {
			// not sure if CORS must be true or false
            Images.useCORS = true
        }
        Mobile.autoResizeReload = false;
        Hydra.CDN = Config.CDN;
        AssetUtil.PATH = Config.CDN;
        Utils3D.PATH = Config.CDN;
        Utils3D.disableWarnings();
        if (Hydra.HASH && Hydra.HASH.strpos("playground")) {
            AssetUtil.exclude("geometry/forest");
            AssetLoader.loadAssets(AssetUtil.getAssets("/"), Playground.instance);
            return
        }
        if (Tests.insideIframe() && !Tests.embedded()) {
            window.parent.postMessage("CLOSE_IFRAME", Config.SITE_URL);
            return
        }
        Container.instance();
        if (Device.system.os == "mac") {
            Stage.div.className = "crs"
        }
    }
});
// CHANGED: MINIFIED MAKES A HUGE DIFFERENCE IN importmethod = vs " "
window._MINIFIED_ = false;
window._BUILT_ = true;