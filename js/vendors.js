var density = 50,
    speed = 0.3,
    winHeight = window.innerHeight,
    winWidth = window.innerWidth,
    start = {
        yMin: -600,
        yMax: 600,
        xMin: 0,
        xMax: 1920,
        scaleMin: 0.7,
        scaleMax: 0.95,
        scaleXMin: 1.2,
        scaleXMax: 2,
        scaleYMin: 1.2,
        scaleYMax: 2,
        opacityMin: 0.1,
        opacityMax: 0.4
    },
    mid = {
        yMin: winHeight * 0.4,
        yMax: winHeight * 0.9,
        xMin: winWidth * 0.1,
        xMax: winWidth * 0.9,
        scaleMin: 1,
        scaleMax: 1.8,
        opacityMin: 0.5,
        opacityMax: 1
    },
    end = {
        yMin: -180,
        yMax: -180,
        xMin: -100,
        xMax: winWidth + 180,
        scaleMin: 0.1,
        scaleMax: 1,
        opacityMin: 0.4,
        opacityMax: 0.7
    };

function range(map, prop) {
    var min = map[prop + 'Min'],
        max = map[prop + 'Max'];
    return min + (max - min) * Math.random();
}

function sign() {
    return Math.random() < 0.5 ? -1 : 1;
}

function randomEase(easeThis, easeThat) {
    if (Math.random() < 0.5) {
        return easeThat;
    }
    return easeThis;
}

function spawn(particle) {
    var wholeDuration = (10 / speed) * (0.7 + Math.random() * 0.4),
        delay = wholeDuration * Math.random(),
        partialDuration = (wholeDuration + 1) * (0.2 + Math.random() * 0.3);
    TweenLite.set(particle, {
        y: range(start, 'y'),
        x: range(start, 'x'),
        scaleX: range(start, 'scaleX'),
        scaleY: range(start, 'scaleY'),
        scale: range(start, 'scale'),
        opacity: range(start, 'opacity'),
        visibility: 'hidden'
    });
    // Moving upward
    TweenLite.to(particle, partialDuration, {
        delay: delay,
        y: range(mid, 'y'),
        ease: randomEase(Linear.easeOut, Back.easeInOut)
    });
    TweenLite.to(particle, wholeDuration - partialDuration, {
        delay: partialDuration + delay,
        y: range(end, 'y'),
        ease: Back.easeIn
    });
    //Moving on axis X
    TweenLite.to(particle, partialDuration, {
        delay: delay,
        x: range(mid, 'x'),
        ease: Power1.easeOut
    });
    TweenLite.to(particle, wholeDuration - partialDuration, {
        delay: partialDuration + delay,
        x: range(end, 'x'),
        ease: Power1.easeIn
    });
    //opacity and scale
    partialDuration = wholeDuration * (0.5 + Math.random() * 0.3);
    TweenLite.to(particle, partialDuration, {
        delay: delay,
        scale: range(mid, 'scale'),
        autoAlpha: range(mid, 'opacity'),
        ease: Linear.easeNone
    });
    TweenLite.to(particle, wholeDuration - partialDuration, {
        delay: partialDuration + delay,
        scale: range(end, 'scale'),
        autoAlpha: range(end, 'opacity'),
        ease: Linear.easeNone,
        onComplete: spawn,
        onCompleteParams: [particle]
    });
}


function createParticle() {
    var i, particleSpark;
    for (i = 0; i < density; i += 1) {
        particleSpark = document.createElement('div');
        particleSpark.classList.add('spark');
        document.getElementById("fire").appendChild(particleSpark);
        spawn(particleSpark);
    }
}


var VanillaTilt = (function () {
	'use strict';

	/**
	 * Created by Sergiu Șandor (micku7zu) on 1/27/2017.
	 * Original idea: https://github.com/gijsroge/tilt.js
	 * MIT License.
	 * Version 1.7.0
	 */

	class VanillaTilt {
		constructor(element, settings = {}) {
			if (!(element instanceof Node)) {
				throw ("Can't initialize VanillaTilt because " + element + " is not a Node.");
			}

			this.width = null;
			this.height = null;
			this.clientWidth = null;
			this.clientHeight = null;
			this.left = null;
			this.top = null;

			// for Gyroscope sampling
			this.gammazero = null;
			this.betazero = null;
			this.lastgammazero = null;
			this.lastbetazero = null;

			this.transitionTimeout = null;
			this.updateCall = null;
			this.event = null;

			this.updateBind = this.update.bind(this);
			this.resetBind = this.reset.bind(this);

			this.element = element;
			this.settings = this.extendSettings(settings);

			this.reverse = this.settings.reverse ? -1 : 1;
			this.glare = VanillaTilt.isSettingTrue(this.settings.glare);
			this.glarePrerender = VanillaTilt.isSettingTrue(this.settings["glare-prerender"]);
			this.fullPageListening = VanillaTilt.isSettingTrue(this.settings["full-page-listening"]);
			this.gyroscope = VanillaTilt.isSettingTrue(this.settings.gyroscope);
			this.gyroscopeSamples = this.settings.gyroscopeSamples;

			this.elementListener = this.getElementListener();

			if (this.glare) {
				this.prepareGlare();
			}

			if (this.fullPageListening) {
				this.updateClientSize();
			}

			this.addEventListeners();
			this.updateInitialPosition();
		}

		static isSettingTrue(setting) {
			return setting === "" || setting === true || setting === 1;
		}

		/**
		 * Method returns element what will be listen mouse events
		 * @return {Node}
		 */
		getElementListener() {
			if (this.fullPageListening) {
				return window.document;
			}

			if (typeof this.settings["mouse-event-element"] === "string") {
				const mouseEventElement = document.querySelector(this.settings["mouse-event-element"]);

				if (mouseEventElement) {
					return mouseEventElement;
				}
			}

			if (this.settings["mouse-event-element"] instanceof Node) {
				return this.settings["mouse-event-element"];
			}

			return this.element;
		}

		/**
		 * Method set listen methods for this.elementListener
		 * @return {Node}
		 */
		addEventListeners() {
			this.onMouseEnterBind = this.onMouseEnter.bind(this);
			this.onMouseMoveBind = this.onMouseMove.bind(this);
			this.onMouseLeaveBind = this.onMouseLeave.bind(this);
			this.onWindowResizeBind = this.onWindowResize.bind(this);
			this.onDeviceOrientationBind = this.onDeviceOrientation.bind(this);

			this.elementListener.addEventListener("mouseenter", this.onMouseEnterBind);
			this.elementListener.addEventListener("mouseleave", this.onMouseLeaveBind);
			this.elementListener.addEventListener("mousemove", this.onMouseMoveBind);

			if (this.glare || this.fullPageListening) {
				window.addEventListener("resize", this.onWindowResizeBind);
			}

			if (this.gyroscope) {
				window.addEventListener("deviceorientation", this.onDeviceOrientationBind);
			}
		}

		/**
		 * Method remove event listeners from current this.elementListener
		 */
		removeEventListeners() {
			this.elementListener.removeEventListener("mouseenter", this.onMouseEnterBind);
			this.elementListener.removeEventListener("mouseleave", this.onMouseLeaveBind);
			this.elementListener.removeEventListener("mousemove", this.onMouseMoveBind);

			if (this.gyroscope) {
				window.removeEventListener("deviceorientation", this.onDeviceOrientationBind);
			}

			if (this.glare || this.fullPageListening) {
				window.removeEventListener("resize", this.onWindowResizeBind);
			}
		}

		destroy() {
			clearTimeout(this.transitionTimeout);
			if (this.updateCall !== null) {
				cancelAnimationFrame(this.updateCall);
			}

			this.reset();

			this.removeEventListeners();
			this.element.vanillaTilt = null;
			delete this.element.vanillaTilt;

			this.element = null;
		}

		onDeviceOrientation(event) {
			if (event.gamma === null || event.beta === null) {
				return;
			}

			this.updateElementPosition();

			if (this.gyroscopeSamples > 0) {
				this.lastgammazero = this.gammazero;
				this.lastbetazero = this.betazero;

				if (this.gammazero === null) {
					this.gammazero = event.gamma;
					this.betazero = event.beta;
				} else {
					this.gammazero = (event.gamma + this.lastgammazero) / 2;
					this.betazero = (event.beta + this.lastbetazero) / 2;
				}

				this.gyroscopeSamples -= 1;
			}

			const totalAngleX = this.settings.gyroscopeMaxAngleX - this.settings.gyroscopeMinAngleX;
			const totalAngleY = this.settings.gyroscopeMaxAngleY - this.settings.gyroscopeMinAngleY;

			const degreesPerPixelX = totalAngleX / this.width;
			const degreesPerPixelY = totalAngleY / this.height;

			const angleX = event.gamma - (this.settings.gyroscopeMinAngleX + this.gammazero);
			const angleY = event.beta - (this.settings.gyroscopeMinAngleY + this.betazero);

			const posX = angleX / degreesPerPixelX;
			const posY = angleY / degreesPerPixelY;

			if (this.updateCall !== null) {
				cancelAnimationFrame(this.updateCall);
			}

			this.event = {
				clientX: posX + this.left,
				clientY: posY + this.top,
			};

			this.updateCall = requestAnimationFrame(this.updateBind);
		}

		onMouseEnter() {
			this.updateElementPosition();
			this.element.style.willChange = "transform";
			this.setTransition();
		}

		onMouseMove(event) {
			if (this.updateCall !== null) {
				cancelAnimationFrame(this.updateCall);
			}

			this.event = event;
			this.updateCall = requestAnimationFrame(this.updateBind);
		}

		onMouseLeave() {
			this.setTransition();

			if (this.settings.reset) {
				requestAnimationFrame(this.resetBind);
			}
		}

		reset() {
			this.event = {
				clientX: this.left + this.width / 2,
				clientY: this.top + this.height / 2
			};

			if (this.element && this.element.style) {
				this.element.style.transform = `perspective(${this.settings.perspective}px) ` +
					`rotateX(0deg) ` +
					`rotateY(0deg) ` +
					`scale3d(1, 1, 1)`;
			}

			this.resetGlare();
		}

		resetGlare() {
			if (this.glare) {
				this.glareElement.style.transform = "rotate(180deg) translate(-50%, -50%)";
				this.glareElement.style.opacity = "0";
			}
		}

		updateInitialPosition() {
			if (this.settings.startX === 0 && this.settings.startY === 0) {
				return;
			}

			this.onMouseEnter();

			if (this.fullPageListening) {
				this.event = {
					clientX: (this.settings.startX + this.settings.max) / (2 * this.settings.max) * this.clientWidth,
					clientY: (this.settings.startY + this.settings.max) / (2 * this.settings.max) * this.clientHeight
				};
			} else {
				this.event = {
					clientX: this.left + ((this.settings.startX + this.settings.max) / (2 * this.settings.max) * this.width),
					clientY: this.top + ((this.settings.startY + this.settings.max) / (2 * this.settings.max) * this.height)
				};
			}


			let backupScale = this.settings.scale;
			this.settings.scale = 1;
			this.update();
			this.settings.scale = backupScale;
			this.resetGlare();
		}

		getValues() {
			let x, y;

			if (this.fullPageListening) {
				x = this.event.clientX / this.clientWidth;
				y = this.event.clientY / this.clientHeight;
			} else {
				x = (this.event.clientX - this.left) / this.width;
				y = (this.event.clientY - this.top) / this.height;
			}

			x = Math.min(Math.max(x, 0), 1);
			y = Math.min(Math.max(y, 0), 1);

			let tiltX = (this.reverse * (this.settings.max - x * this.settings.max * 2)).toFixed(2);
			let tiltY = (this.reverse * (y * this.settings.max * 2 - this.settings.max)).toFixed(2);
			let angle = Math.atan2(this.event.clientX - (this.left + this.width / 2), -(this.event.clientY - (this.top + this.height / 2))) * (180 / Math.PI);

			return {
				tiltX: tiltX,
				tiltY: tiltY,
				percentageX: x * 100,
				percentageY: y * 100,
				angle: angle
			};
		}

		updateElementPosition() {
			let rect = this.element.getBoundingClientRect();

			this.width = this.element.offsetWidth;
			this.height = this.element.offsetHeight;
			this.left = rect.left;
			this.top = rect.top;
		}

		update() {
			let values = this.getValues();

			this.element.style.transform = "perspective(" + this.settings.perspective + "px) " +
				"rotateX(" + (this.settings.axis === "x" ? 0 : values.tiltY) + "deg) " +
				"rotateY(" + (this.settings.axis === "y" ? 0 : values.tiltX) + "deg) " +
				"scale3d(" + this.settings.scale + ", " + this.settings.scale + ", " + this.settings.scale + ")";

			if (this.glare) {
				this.glareElement.style.transform = `rotate(${values.angle}deg) translate(-50%, -50%)`;
				this.glareElement.style.opacity = `${values.percentageY * this.settings["max-glare"] / 100}`;
			}

			this.element.dispatchEvent(new CustomEvent("tiltChange", {
				"detail": values
			}));

			this.updateCall = null;
		}

		/**
		 * Appends the glare element (if glarePrerender equals false)
		 * and sets the default style
		 */
		prepareGlare() {
			// If option pre-render is enabled we assume all html/css is present for an optimal glare effect.
			if (!this.glarePrerender) {
				// Create glare element
				const jsTiltGlare = document.createElement("div");
				jsTiltGlare.classList.add("js-tilt-glare");

				const jsTiltGlareInner = document.createElement("div");
				jsTiltGlareInner.classList.add("js-tilt-glare-inner");

				jsTiltGlare.appendChild(jsTiltGlareInner);
				this.element.appendChild(jsTiltGlare);
			}

			this.glareElementWrapper = this.element.querySelector(".js-tilt-glare");
			this.glareElement = this.element.querySelector(".js-tilt-glare-inner");

			if (this.glarePrerender) {
				return;
			}

			Object.assign(this.glareElementWrapper.style, {
				"position": "absolute",
				"top": "0",
				"left": "0",
				"width": "100%",
				"height": "100%",
				"overflow": "hidden",
				"pointer-events": "none"
			});

			Object.assign(this.glareElement.style, {
				"position": "absolute",
				"top": "50%",
				"left": "50%",
				"pointer-events": "none",
				"background-image": `linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)`,
				"width": `${this.element.offsetWidth * 2}px`,
				"height": `${this.element.offsetWidth * 2}px`,
				"transform": "rotate(180deg) translate(-50%, -50%)",
				"transform-origin": "0% 0%",
				"opacity": "0",
			});
		}

		updateGlareSize() {
			if (this.glare) {
				Object.assign(this.glareElement.style, {
					"width": `${this.element.offsetWidth * 2}`,
					"height": `${this.element.offsetWidth * 2}`,
				});
			}
		}

		updateClientSize() {
			this.clientWidth = window.innerWidth
				|| document.documentElement.clientWidth
				|| document.body.clientWidth;

			this.clientHeight = window.innerHeight
				|| document.documentElement.clientHeight
				|| document.body.clientHeight;
		}

		onWindowResize() {
			this.updateGlareSize();
			this.updateClientSize();
		}

		setTransition() {
			clearTimeout(this.transitionTimeout);
			this.element.style.transition = this.settings.speed + "ms " + this.settings.easing;
			if (this.glare) this.glareElement.style.transition = `opacity ${this.settings.speed}ms ${this.settings.easing}`;

			this.transitionTimeout = setTimeout(() => {
				this.element.style.transition = "";
				if (this.glare) {
					this.glareElement.style.transition = "";
				}
			}, this.settings.speed);

		}

		/**
		 * Method return patched settings of instance
		 * @param {boolean} settings.reverse - reverse the tilt direction
		 * @param {number} settings.max - max tilt rotation (degrees)
		 * @param {startX} settings.startX - the starting tilt on the X axis, in degrees. Default: 0
		 * @param {startY} settings.startY - the starting tilt on the Y axis, in degrees. Default: 0
		 * @param {number} settings.perspective - Transform perspective, the lower the more extreme the tilt gets
		 * @param {string} settings.easing - Easing on enter/exit
		 * @param {number} settings.scale - 2 = 200%, 1.5 = 150%, etc..
		 * @param {number} settings.speed - Speed of the enter/exit transition
		 * @param {boolean} settings.transition - Set a transition on enter/exit
		 * @param {string|null} settings.axis - What axis should be disabled. Can be X or Y
		 * @param {boolean} settings.glare - What axis should be disabled. Can be X or Y
		 * @param {number} settings.max-glare - the maximum "glare" opacity (1 = 100%, 0.5 = 50%)
		 * @param {boolean} settings.glare-prerender - false = VanillaTilt creates the glare elements for you, otherwise
		 * @param {boolean} settings.full-page-listening - If true, parallax effect will listen to mouse move events on the whole document, not only the selected element
		 * @param {string|object} settings.mouse-event-element - String selector or link to HTML-element what will be listen mouse events
		 * @param {boolean} settings.reset - false = If the tilt effect has to be reset on exit
		 * @param {gyroscope} settings.gyroscope - Enable tilting by deviceorientation events
		 * @param {gyroscopeSensitivity} settings.gyroscopeSensitivity - Between 0 and 1 - The angle at which max tilt position is reached. 1 = 90deg, 0.5 = 45deg, etc..
		 * @param {gyroscopeSamples} settings.gyroscopeSamples - How many gyroscope moves to decide the starting position.
		 */
		extendSettings(settings) {
			let defaultSettings = {
				reverse: false,
				max: 15,
				startX: 0,
				startY: 0,
				perspective: 1000,
				easing: "cubic-bezier(.03,.98,.52,.99)",
				scale: 1,
				speed: 300,
				transition: true,
				axis: null,
				glare: false,
				"max-glare": 1,
				"glare-prerender": false,
				"full-page-listening": false,
				"mouse-event-element": null,
				reset: true,
				gyroscope: true,
				gyroscopeMinAngleX: -45,
				gyroscopeMaxAngleX: 45,
				gyroscopeMinAngleY: -45,
				gyroscopeMaxAngleY: 45,
				gyroscopeSamples: 10
			};

			let newSettings = {};
			for (var property in defaultSettings) {
				if (property in settings) {
					newSettings[property] = settings[property];
				} else if (this.element.hasAttribute("data-tilt-" + property)) {
					let attribute = this.element.getAttribute("data-tilt-" + property);
					try {
						newSettings[property] = JSON.parse(attribute);
					} catch (e) {
						newSettings[property] = attribute;
					}

				} else {
					newSettings[property] = defaultSettings[property];
				}
			}

			return newSettings;
		}

		static init(elements, settings) {
			if (elements instanceof Node) {
				elements = [elements];
			}

			if (elements instanceof NodeList) {
				elements = [].slice.call(elements);
			}

			if (!(elements instanceof Array)) {
				return;
			}

			elements.forEach((element) => {
				if (!("vanillaTilt" in element)) {
					element.vanillaTilt = new VanillaTilt(element, settings);
				}
			});
		}
	}

	if (typeof document !== "undefined") {
		/* expose the class to window */
		window.VanillaTilt = VanillaTilt;

		/**
		 * Auto load
		 */
		VanillaTilt.init(document.querySelectorAll("[data-tilt]"));
	}

	return VanillaTilt;

}());
// Dynamic Adapt v.1
// HTML data-da="where(uniq class name),position(digi),when(breakpoint)"
// e.x. data-da="item,2,992"
// Andrikanych Yevhen 2020
// https://www.youtube.com/c/freelancerlifestyle

"use strict";

(function () {
	let originalPositions = [];
	let daElements = document.querySelectorAll('[data-da]');
	let daElementsArray = [];
	let daMatchMedia = [];
	//Заполняем массивы
	if (daElements.length > 0) {
		let number = 0;
		for (let index = 0; index < daElements.length; index++) {
			const daElement = daElements[index];
			const daMove = daElement.getAttribute('data-da');
			if (daMove != '') {
				const daArray = daMove.split(',');
				const daPlace = daArray[1] ? daArray[1].trim() : 'last';
				const daBreakpoint = daArray[2] ? daArray[2].trim() : '767';
				const daType = daArray[3] === 'min' ? daArray[3].trim() : 'max';
				const daDestination = document.querySelector('.' + daArray[0].trim())
				if (daArray.length > 0 && daDestination) {
					daElement.setAttribute('data-da-index', number);
					//Заполняем массив первоначальных позиций
					originalPositions[number] = {
						"parent": daElement.parentNode,
						"index": indexInParent(daElement)
					};
					//Заполняем массив элементов 
					daElementsArray[number] = {
						"element": daElement,
						"destination": document.querySelector('.' + daArray[0].trim()),
						"place": daPlace,
						"breakpoint": daBreakpoint,
						"type": daType
					}
					number++;
				}
			}
		}
		dynamicAdaptSort(daElementsArray);

		//Создаем события в точке брейкпоинта
		for (let index = 0; index < daElementsArray.length; index++) {
			const el = daElementsArray[index];
			const daBreakpoint = el.breakpoint;
			const daType = el.type;

			daMatchMedia.push(window.matchMedia("(" + daType + "-width: " + daBreakpoint + "px)"));
			daMatchMedia[index].addListener(dynamicAdapt);
		}
	}
	//Основная функция
	function dynamicAdapt(e) {
		for (let index = 0; index < daElementsArray.length; index++) {
			const el = daElementsArray[index];
			const daElement = el.element;
			const daDestination = el.destination;
			const daPlace = el.place;
			const daBreakpoint = el.breakpoint;
			const daClassname = "_dynamic_adapt_" + daBreakpoint;

			if (daMatchMedia[index].matches) {
				//Перебрасываем элементы
				if (!daElement.classList.contains(daClassname)) {
					let actualIndex = indexOfElements(daDestination)[daPlace];
					if (daPlace === 'first') {
						actualIndex = indexOfElements(daDestination)[0];
					} else if (daPlace === 'last') {
						actualIndex = indexOfElements(daDestination)[indexOfElements(daDestination).length];
					}
					daDestination.insertBefore(daElement, daDestination.children[actualIndex]);
					daElement.classList.add(daClassname);
				}
			} else {
				//Возвращаем на место
				if (daElement.classList.contains(daClassname)) {
					dynamicAdaptBack(daElement);
					daElement.classList.remove(daClassname);
				}
			}
		}
		//customAdapt();
	}

	//Вызов основной функции
	dynamicAdapt();

	//Функция возврата на место
	function dynamicAdaptBack(el) {
		const daIndex = el.getAttribute('data-da-index');
		const originalPlace = originalPositions[daIndex];
		const parentPlace = originalPlace['parent'];
		const indexPlace = originalPlace['index'];
		const actualIndex = indexOfElements(parentPlace, true)[indexPlace];
		parentPlace.insertBefore(el, parentPlace.children[actualIndex]);
	}
	//Функция получения индекса внутри родителя
	function indexInParent(el) {
		var children = Array.prototype.slice.call(el.parentNode.children);
		return children.indexOf(el);
	}
	//Функция получения массива индексов элементов внутри родителя 
	function indexOfElements(parent, back) {
		const children = parent.children;
		const childrenArray = [];
		for (let i = 0; i < children.length; i++) {
			const childrenElement = children[i];
			if (back) {
				childrenArray.push(i);
			} else {
				//Исключая перенесенный элемент
				if (childrenElement.getAttribute('data-da') == null) {
					childrenArray.push(i);
				}
			}
		}
		return childrenArray;
	}
	//Сортировка объекта
	function dynamicAdaptSort(arr) {
		arr.sort(function (a, b) {
			if (a.breakpoint > b.breakpoint) { return -1 } else { return 1 }
		});
		arr.sort(function (a, b) {
			if (a.place > b.place) { return 1 } else { return -1 }
		});
	}
	//Дополнительные сценарии адаптации
	function customAdapt() {
		//const viewport_width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	}
}());