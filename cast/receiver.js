(function () {
  "use strict";

  var NAMESPACE = "urn:x-cast:com.jasoncs.homegallery.photo";
  var DEFAULT_VIEWPORT = Object.freeze({ zoom: 1, centerX: 0.5, centerY: 0.5 });
  var MAX_QUEUE_SIZE = 200;
  var demoMode = new URLSearchParams(window.location.search).get("demo") === "1";

  var stage = document.getElementById("photo-stage");
  var layers = [
    document.getElementById("photo-layer-a"),
    document.getElementById("photo-layer-b")
  ];
  var detailLayer = document.getElementById("photo-detail-layer");
  var activeLayerIndex = -1;
  var loadGeneration = 0;
  var detailLoadGeneration = 0;
  var detailRequestTimer = null;
  var detailRequestCounter = 0;
  var latestDetailRequestId = null;
  var detailRegion = null;
  var lastSequence = -1;
  var lastShowSequence = -1;
  var currentPhotoId = null;
  var currentUrl = null;
  var viewport = DEFAULT_VIEWPORT;
  var queue = new Map();
  var prefetched = new Map();
  var receiverContext = null;
  var activeSenderId = null;

  function finiteNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function readSequence(message) {
    var value = message.sequence;
    if (value === undefined) value = message.seq;
    if (value === undefined) value = message.sequenceId;
    if (value === undefined || value === null) return null;
    var sequence = finiteNumber(value);
    return sequence !== null && sequence >= 0 ? sequence : null;
  }

  function readPhotoId(value) {
    var id = value && (value.photoId !== undefined ? value.photoId : value.id);
    if (id === undefined || id === null || id === "") return null;
    return String(id);
  }

  function safeImageUrl(value) {
    if (typeof value !== "string" || value.length === 0 || value.length > 8192) return null;
    try {
      var url = new URL(value, window.location.href);
      if (url.protocol === "https:" || url.protocol === "http:" ||
          url.protocol === "blob:" || (url.protocol === "data:" && url.pathname.startsWith("image/"))) {
        return url.href;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function send(senderId, message) {
    if (!receiverContext || !senderId) return;
    try {
      receiverContext.sendCustomMessage(NAMESPACE, senderId, message);
    } catch (error) {
      console.error("Unable to send Cast response", error);
    }
  }

  function sendReady(senderId, extra) {
    send(senderId, Object.assign({
      type: "READY",
      namespace: NAMESPACE,
      protocolVersion: 1
    }, extra || {}));
  }

  function sendError(senderId, code, detail, message) {
    var response = {
      type: "ERROR",
      code: code,
      message: detail
    };
    var sequence = message && readSequence(message);
    var photoId = message && readPhotoId(message);
    if (sequence !== null) response.sequence = sequence;
    if (photoId !== null) response.photoId = photoId;
    send(senderId, response);
  }

  function parseMessage(data) {
    var message = data;
    if (typeof data === "string") message = JSON.parse(data);
    if (!message || typeof message !== "object" || Array.isArray(message)) {
      throw new Error("Message must be a JSON object");
    }
    if (typeof message.type !== "string") {
      throw new Error("Message type is required");
    }
    message.type = message.type.toUpperCase();
    return message;
  }

  function isStale(message, forShow) {
    var sequence = readSequence(message);
    if (sequence !== null && sequence < lastSequence) return true;
    if (forShow && sequence !== null && sequence < lastShowSequence) return true;

    var photoId = readPhotoId(message);
    if (forShow && sequence !== null && sequence === lastShowSequence &&
        currentPhotoId !== null && photoId !== null && photoId !== currentPhotoId) {
      return true;
    }

    if (sequence !== null) lastSequence = Math.max(lastSequence, sequence);
    return false;
  }

  function normalizeViewport(message) {
    var value = message.viewport || message.visibleRect || message;
    var zoom = finiteNumber(value.zoom);
    var centerX = finiteNumber(value.centerX);
    var centerY = finiteNumber(value.centerY);
    if (zoom !== null || centerX !== null || centerY !== null) {
      if (zoom === null || centerX === null || centerY === null ||
          zoom < 1 || zoom > 8 ||
          centerX < 0 || centerX > 1 || centerY < 0 || centerY > 1) {
        throw new Error("Viewport transform requires zoom >= 1 and normalized centerX/centerY");
      }
      return { zoom: zoom, centerX: centerX, centerY: centerY };
    }
    var left = finiteNumber(value.left);
    var top = finiteNumber(value.top);
    var right = finiteNumber(value.right);
    var bottom = finiteNumber(value.bottom);
    if (left === null || top === null || right === null || bottom === null ||
        left < 0 || top < 0 || right > 1 || bottom > 1 ||
        right <= left || bottom <= top) {
      throw new Error("Viewport must satisfy 0 <= left < right <= 1 and 0 <= top < bottom <= 1");
    }
    return { left: left, top: top, right: right, bottom: bottom };
  }

  function imageGeometry(layer) {
    if (!layer || !layer.naturalWidth || !layer.naturalHeight) return null;
    var stageWidth = stage.clientWidth || window.innerWidth;
    var stageHeight = stage.clientHeight || window.innerHeight;
    var containScale = Math.min(
      stageWidth / layer.naturalWidth,
      stageHeight / layer.naturalHeight
    );
    var imageWidth = layer.naturalWidth * containScale;
    var imageHeight = layer.naturalHeight * containScale;
    var zoom = viewport.zoom === undefined ? 1 : viewport.zoom;
    var centerX = viewport.centerX === undefined ? 0.5 : viewport.centerX;
    var centerY = viewport.centerY === undefined ? 0.5 : viewport.centerY;
    return {
      stageWidth: stageWidth,
      stageHeight: stageHeight,
      imageWidth: imageWidth,
      imageHeight: imageHeight,
      zoom: zoom,
      translateX: stageWidth / 2 - zoom * imageWidth * centerX,
      translateY: stageHeight / 2 - zoom * imageHeight * centerY
    };
  }

  function layoutLayer(layer) {
    var geometry = imageGeometry(layer);
    if (!geometry) return;
    var stageWidth = geometry.stageWidth;
    var stageHeight = geometry.stageHeight;
    var imageWidth = geometry.imageWidth;
    var imageHeight = geometry.imageHeight;
    if (viewport.zoom !== undefined) {
      layer.style.width = imageWidth + "px";
      layer.style.height = imageHeight + "px";
      layer.style.clipPath = "none";
      layer.style.transform = "matrix(" + viewport.zoom + ",0,0," + viewport.zoom + "," +
        geometry.translateX + "," + geometry.translateY + ")";
      return;
    }
    var visibleWidth = imageWidth * (viewport.right - viewport.left);
    var visibleHeight = imageHeight * (viewport.bottom - viewport.top);
    var zoom = Math.min(stageWidth / visibleWidth, stageHeight / visibleHeight);
    var centerX = imageWidth * (viewport.left + viewport.right) / 2;
    var centerY = imageHeight * (viewport.top + viewport.bottom) / 2;
    var translateX = stageWidth / 2 - zoom * centerX;
    var translateY = stageHeight / 2 - zoom * centerY;

    layer.style.width = imageWidth + "px";
    layer.style.height = imageHeight + "px";
    layer.style.clipPath = "inset(" +
      (viewport.top * 100) + "% " +
      ((1 - viewport.right) * 100) + "% " +
      ((1 - viewport.bottom) * 100) + "% " +
      (viewport.left * 100) + "%)";
    layer.style.transform = "matrix(" + zoom + ",0,0," + zoom + "," +
      translateX + "," + translateY + ")";
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function currentVisibleRect() {
    if (activeLayerIndex < 0 || viewport.zoom === undefined) return null;
    var geometry = imageGeometry(layers[activeLayerIndex]);
    if (!geometry || geometry.zoom <= 1) return null;
    var scaledWidth = geometry.zoom * geometry.imageWidth;
    var scaledHeight = geometry.zoom * geometry.imageHeight;
    return {
      left: clamp01(-geometry.translateX / scaledWidth),
      top: clamp01(-geometry.translateY / scaledHeight),
      right: clamp01((geometry.stageWidth - geometry.translateX) / scaledWidth),
      bottom: clamp01((geometry.stageHeight - geometry.translateY) / scaledHeight)
    };
  }

  function regionContains(outer, inner) {
    return outer && inner &&
      outer.left <= inner.left + 0.002 &&
      outer.top <= inner.top + 0.002 &&
      outer.right >= inner.right - 0.002 &&
      outer.bottom >= inner.bottom - 0.002;
  }

  function layoutDetailLayer() {
    if (!detailRegion || activeLayerIndex < 0 || currentPhotoId !== detailRegion.photoId) {
      detailLayer.classList.remove("is-visible");
      return;
    }
    var visible = currentVisibleRect();
    if (!regionContains(detailRegion, visible)) {
      detailLayer.classList.remove("is-visible");
      return;
    }
    var geometry = imageGeometry(layers[activeLayerIndex]);
    if (!geometry) return;
    var left = geometry.translateX +
      geometry.zoom * geometry.imageWidth * detailRegion.left;
    var top = geometry.translateY +
      geometry.zoom * geometry.imageHeight * detailRegion.top;
    var width = geometry.zoom * geometry.imageWidth *
      (detailRegion.right - detailRegion.left);
    var height = geometry.zoom * geometry.imageHeight *
      (detailRegion.bottom - detailRegion.top);
    detailLayer.style.left = left + "px";
    detailLayer.style.top = top + "px";
    detailLayer.style.width = width + "px";
    detailLayer.style.height = height + "px";
    detailLayer.classList.add("is-visible");
  }

  function applyViewport() {
    layers.forEach(layoutLayer);
    layoutDetailLayer();
  }

  function clearDetail() {
    if (detailRequestTimer !== null) {
      clearTimeout(detailRequestTimer);
      detailRequestTimer = null;
    }
    detailLoadGeneration += 1;
    latestDetailRequestId = null;
    detailRegion = null;
    detailLayer.classList.remove("is-visible");
    detailLayer.onload = null;
    detailLayer.onerror = null;
    detailLayer.removeAttribute("src");
  }

  function scheduleDetailRequest() {
    if (detailRequestTimer !== null) clearTimeout(detailRequestTimer);
    detailRequestTimer = null;
    if (viewport.zoom === undefined || viewport.zoom < 1.35 || !currentPhotoId) {
      detailLayer.classList.remove("is-visible");
      return;
    }
    var visible = currentVisibleRect();
    if (!visible || regionContains(detailRegion, visible)) return;

    detailRequestTimer = setTimeout(function () {
      detailRequestTimer = null;
      var latestVisible = currentVisibleRect();
      if (!latestVisible || !currentPhotoId || viewport.zoom < 1.35) return;
      if (regionContains(detailRegion, latestVisible)) return;
      var horizontalPadding = (latestVisible.right - latestVisible.left) * 0.18;
      var verticalPadding = (latestVisible.bottom - latestVisible.top) * 0.18;
      var requested = {
        left: clamp01(latestVisible.left - horizontalPadding),
        top: clamp01(latestVisible.top - verticalPadding),
        right: clamp01(latestVisible.right + horizontalPadding),
        bottom: clamp01(latestVisible.bottom + verticalPadding)
      };
      var requestId = currentPhotoId + "-" + (++detailRequestCounter);
      latestDetailRequestId = requestId;
      var stageWidth = stage.clientWidth || window.innerWidth;
      var stageHeight = stage.clientHeight || window.innerHeight;
      send(activeSenderId, {
        type: "DETAIL_REQUEST",
        photoId: currentPhotoId,
        requestId: requestId,
        left: requested.left,
        top: requested.top,
        right: requested.right,
        bottom: requested.bottom,
        targetWidth: Math.min(4096, Math.max(1920, Math.round(stageWidth * 2))),
        targetHeight: Math.min(4096, Math.max(1080, Math.round(stageHeight * 2)))
      });
    }, 350);
  }

  function prefetch(url) {
    if (prefetched.has(url)) return;
    var image = new Image();
    prefetched.set(url, image);
    image.onload = function () {
      image.dataset.state = "loaded";
    };
    image.onerror = function () {
      image.dataset.state = "error";
    };
    image.decoding = "async";
    image.src = url;
  }

  function parseQueueItem(item, index) {
    var value = typeof item === "string" ? { url: item } : item;
    if (!value || typeof value !== "object") return null;
    var url = safeImageUrl(value.url || value.imageUrl || value.src);
    if (!url) return null;
    var id = readPhotoId(value);
    if (id === null) id = String(index);
    return { photoId: id, url: url };
  }

  function handleQueue(message, senderId) {
    if (isStale(message, false)) return;
    var items = message.photos || message.queue || message.items || message.urls;
    if (!Array.isArray(items)) {
      throw new Error("PHOTO_QUEUE requires a photos array");
    }
    if (items.length > MAX_QUEUE_SIZE) {
      throw new Error("PHOTO_QUEUE exceeds " + MAX_QUEUE_SIZE + " items");
    }

    queue.clear();
    var acceptedUrls = new Set();
    var accepted = 0;
    items.forEach(function (item, index) {
      var photo = parseQueueItem(item, index);
      if (!photo) return;
      queue.set(photo.photoId, photo.url);
      acceptedUrls.add(photo.url);
      prefetch(photo.url);
      accepted += 1;
    });
    prefetched.forEach(function (image, url) {
      if (acceptedUrls.has(url) || url === currentUrl) return;
      image.onload = null;
      image.onerror = null;
      image.removeAttribute("src");
      prefetched.delete(url);
    });
    send(senderId, {
      type: "QUEUE_READY",
      queueSize: accepted,
      sequence: readSequence(message)
    });
  }

  function resolvePhoto(message) {
    var photoId = readPhotoId(message);
    var url = safeImageUrl(message.url || message.imageUrl || message.src);
    if (!url && photoId !== null) url = queue.get(photoId) || null;
    if (!url) throw new Error("SHOW_PHOTO requires a valid image URL or queued photoId");
    return { photoId: photoId || url, url: url };
  }

  function showPhoto(message, senderId) {
    if (isStale(message, true)) return;
    var photo = resolvePhoto(message);
    var sequence = readSequence(message);
    if (sequence !== null) lastShowSequence = Math.max(lastShowSequence, sequence);
    clearDetail();

    var generation = ++loadGeneration;
    var nextIndex = activeLayerIndex === 0 ? 1 : 0;
    var nextLayer = layers[nextIndex];
    nextLayer.classList.remove("is-visible");

    nextLayer.onload = function () {
      if (generation !== loadGeneration ||
          (sequence !== null && sequence < lastShowSequence)) return;
      layoutLayer(nextLayer);
      document.body.classList.add("photo-mode");
      stage.setAttribute("aria-hidden", "false");
      nextLayer.classList.add("is-visible");
      if (activeLayerIndex >= 0) layers[activeLayerIndex].classList.remove("is-visible");
      activeLayerIndex = nextIndex;
      currentPhotoId = photo.photoId;
      currentUrl = photo.url;
      scheduleDetailRequest();
      send(senderId, {
        type: "PHOTO_READY",
        photoId: photo.photoId,
        sequence: sequence,
        url: photo.url
      });
    };
    nextLayer.onerror = function () {
      if (generation !== loadGeneration) return;
      sendError(senderId, "IMAGE_LOAD_FAILED", "The photo could not be loaded", message);
    };
    nextLayer.src = photo.url;
  }

  function upgradePhoto(message, senderId) {
    var photo = resolvePhoto(message);
    if (currentPhotoId === null || photo.photoId !== currentPhotoId || photo.url === currentUrl) {
      return;
    }
    var sequence = readSequence(message);
    if (sequence !== null && sequence < lastSequence) return;
    if (sequence !== null) lastSequence = Math.max(lastSequence, sequence);

    var generation = ++loadGeneration;
    var previousIndex = activeLayerIndex;
    var nextIndex = activeLayerIndex === 0 ? 1 : 0;
    var nextLayer = layers[nextIndex];
    nextLayer.classList.remove("is-visible");
    var swapUpgradedLayer = function () {
      if (generation !== loadGeneration || currentPhotoId !== photo.photoId) return;
      layoutLayer(nextLayer);
      // Instant swap — simultaneous opacity fade makes TVs briefly flash ~1–2s after SHOW_PHOTO
      // when the high-resolution upgrade arrives.
      nextLayer.style.transition = "none";
      if (previousIndex >= 0) {
        layers[previousIndex].style.transition = "none";
      }
      void nextLayer.offsetWidth;
      nextLayer.classList.add("is-visible");
      if (previousIndex >= 0) {
        layers[previousIndex].classList.remove("is-visible");
      }
      activeLayerIndex = nextIndex;
      currentUrl = photo.url;
      queue.set(photo.photoId, photo.url);
      layoutDetailLayer();
      requestAnimationFrame(function () {
        nextLayer.style.transition = "";
        if (previousIndex >= 0) {
          layers[previousIndex].style.transition = "";
        }
      });
      send(senderId, {
        type: "PHOTO_UPGRADED",
        photoId: photo.photoId,
        sequence: sequence,
        url: photo.url
      });
    };
    nextLayer.onload = function () {
      if (generation !== loadGeneration || currentPhotoId !== photo.photoId) return;
      // `load` can fire before the TV holds a paintable bitmap, so the swapped-in layer shows an
      // empty frame first. Waiting for decode keeps the exchange invisible.
      if (typeof nextLayer.decode === "function") {
        nextLayer.decode().then(swapUpgradedLayer, swapUpgradedLayer);
      } else {
        swapUpgradedLayer();
      }
    };
    nextLayer.onerror = function () {
      if (generation !== loadGeneration) return;
      console.warn("High-resolution photo upgrade could not be loaded");
    };
    nextLayer.src = photo.url;
  }

  function showDetailPhoto(message) {
    var photoId = readPhotoId(message);
    var requestId = message.requestId === undefined ? null : String(message.requestId);
    var url = safeImageUrl(message.url || message.imageUrl || message.src);
    var left = finiteNumber(message.left);
    var top = finiteNumber(message.top);
    var right = finiteNumber(message.right);
    var bottom = finiteNumber(message.bottom);
    if (!photoId || photoId !== currentPhotoId ||
        !requestId || requestId !== latestDetailRequestId || !url ||
        left === null || top === null || right === null || bottom === null ||
        left < 0 || top < 0 || right > 1 || bottom > 1 ||
        right <= left || bottom <= top) {
      return;
    }

    var generation = ++detailLoadGeneration;
    detailLayer.classList.remove("is-visible");
    detailLayer.onload = function () {
      if (generation !== detailLoadGeneration ||
          photoId !== currentPhotoId ||
          requestId !== latestDetailRequestId) {
        return;
      }
      detailRegion = {
        photoId: photoId,
        requestId: requestId,
        left: left,
        top: top,
        right: right,
        bottom: bottom
      };
      layoutDetailLayer();
    };
    detailLayer.onerror = function () {
      if (generation !== detailLoadGeneration) return;
      detailRegion = null;
      detailLayer.classList.remove("is-visible");
    };
    detailLayer.src = url;
  }

  function handleViewport(message) {
    if (isStale(message, false)) return;
    var targetPhotoId = readPhotoId(message);
    if (targetPhotoId !== null && currentPhotoId !== null && targetPhotoId !== currentPhotoId) return;
    viewport = normalizeViewport(message);
    applyViewport();
    scheduleDetailRequest();
  }

  function resetViewport(message) {
    if (isStale(message, false)) return;
    var targetPhotoId = readPhotoId(message);
    if (targetPhotoId !== null && currentPhotoId !== null && targetPhotoId !== currentPhotoId) return;
    viewport = DEFAULT_VIEWPORT;
    clearDetail();
    applyViewport();
  }

  function stopPhotoMode() {
    loadGeneration += 1;
    clearDetail();
    layers.forEach(function (layer) {
      layer.classList.remove("is-visible");
      layer.onload = null;
      layer.onerror = null;
      layer.removeAttribute("src");
    });
    document.body.classList.remove("photo-mode");
    stage.setAttribute("aria-hidden", "true");
    activeLayerIndex = -1;
    currentPhotoId = null;
    currentUrl = null;
    viewport = DEFAULT_VIEWPORT;
  }

  function routeMessage(message, senderId) {
    switch (message.type) {
      case "HELLO":
        lastSequence = -1;
        lastShowSequence = -1;
        sendReady(senderId);
        break;
      case "PHOTO_QUEUE":
        handleQueue(message, senderId);
        break;
      case "SHOW_PHOTO":
        showPhoto(message, senderId);
        break;
      case "UPGRADE_PHOTO":
        upgradePhoto(message, senderId);
        break;
      case "DETAIL_PHOTO":
        showDetailPhoto(message);
        break;
      case "VIEWPORT":
        handleViewport(message);
        break;
      case "RESET_VIEWPORT":
        resetViewport(message);
        break;
      case "STOP":
        if (!isStale(message, false)) stopPhotoMode();
        break;
      default:
        sendError(senderId, "UNSUPPORTED_MESSAGE", "Unsupported message type: " + message.type, message);
    }
  }

  function onCustomMessage(event) {
    var message = null;
    try {
      if (activeSenderId !== event.senderId) {
        activeSenderId = event.senderId;
        lastSequence = -1;
        lastShowSequence = -1;
      }
      message = parseMessage(event.data);
      routeMessage(message, event.senderId);
    } catch (error) {
      console.error("Home Gallery receiver message error", error);
      sendError(event.senderId, "INVALID_MESSAGE", error.message || "Invalid message", message);
    }
  }

  function startCastReceiver() {
    if (!window.cast || !cast.framework) return false;

    receiverContext = cast.framework.CastReceiverContext.getInstance();
    var playerManager = receiverContext.getPlayerManager();
    receiverContext.addCustomMessageListener(NAMESPACE, onCustomMessage);
    receiverContext.addEventListener(
      cast.framework.system.EventType.SENDER_CONNECTED,
      function (event) { sendReady(event.senderId); }
    );

    var loadType = cast.framework.messages.MessageType.LOAD;
    playerManager.setMessageInterceptor(loadType, function (request) {
      stopPhotoMode();
      return request;
    });

    var options = new cast.framework.CastReceiverOptions();
    options.disableIdleTimeout = false;
    receiverContext.start(options);
    return true;
  }

  function startDemo() {
    var svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">',
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
      '<stop stop-color="#172554"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs>',
      '<rect width="1600" height="900" fill="url(#g)"/>',
      '<circle cx="1240" cy="220" r="105" fill="#fde68a"/>',
      '<path d="M0 740L390 390 650 650 880 470 1300 820 1600 570V900H0Z" fill="#d1fae5"/>',
      '<path d="M0 810L420 510 720 790 1030 590 1600 850V900H0Z" fill="#115e59"/>',
      '</svg>'
    ].join("");
    var demoUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    routeMessage({
      type: "PHOTO_QUEUE",
      sequence: 1,
      photos: [{ photoId: "demo", url: demoUrl }]
    }, null);
    routeMessage({ type: "SHOW_PHOTO", sequence: 2, photoId: "demo" }, null);
    routeMessage({
      type: "VIEWPORT",
      sequence: 3,
      photoId: "demo",
      zoom: 2,
      centerX: 0.6,
      centerY: 0.45
    }, null);
  }

  window.addEventListener("resize", function () {
    applyViewport();
    scheduleDetailRequest();
  });
  window.addEventListener("error", function (event) {
    console.error("Home Gallery receiver error", event.error || event.message);
  });
  window.addEventListener("unhandledrejection", function (event) {
    console.error("Home Gallery receiver rejected promise", event.reason);
  });

  var castStarted = false;
  try {
    castStarted = startCastReceiver();
  } catch (error) {
    console.error("Unable to start Google Cast receiver", error);
  }

  if (!castStarted) {
    if (demoMode) {
      startDemo();
    } else {
      console.error("Google Cast Application Framework is unavailable");
    }
  } else if (demoMode) {
    startDemo();
  }
}());
