(function () {
  "use strict";

  var NAMESPACE = "urn:x-cast:com.jasoncs.homegallery.photo";
  var DEFAULT_VIEWPORT = Object.freeze({ left: 0, top: 0, right: 1, bottom: 1 });
  var MAX_QUEUE_SIZE = 200;
  var demoMode = new URLSearchParams(window.location.search).get("demo") === "1";

  var stage = document.getElementById("photo-stage");
  var layers = [
    document.getElementById("photo-layer-a"),
    document.getElementById("photo-layer-b")
  ];
  var activeLayerIndex = -1;
  var loadGeneration = 0;
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

  function layoutLayer(layer) {
    if (!layer || !layer.naturalWidth || !layer.naturalHeight) return;

    var stageWidth = stage.clientWidth || window.innerWidth;
    var stageHeight = stage.clientHeight || window.innerHeight;
    var containScale = Math.min(
      stageWidth / layer.naturalWidth,
      stageHeight / layer.naturalHeight
    );
    var imageWidth = layer.naturalWidth * containScale;
    var imageHeight = layer.naturalHeight * containScale;
    var visibleWidth = imageWidth * (viewport.right - viewport.left);
    var visibleHeight = imageHeight * (viewport.bottom - viewport.top);
    var zoom = Math.min(stageWidth / visibleWidth, stageHeight / visibleHeight);
    var centerX = imageWidth * (viewport.left + viewport.right) / 2;
    var centerY = imageHeight * (viewport.top + viewport.bottom) / 2;
    var translateX = stageWidth / 2 - zoom * centerX;
    var translateY = stageHeight / 2 - zoom * centerY;

    layer.style.width = imageWidth + "px";
    layer.style.height = imageHeight + "px";
    layer.style.transform = "matrix(" + zoom + ",0,0," + zoom + "," +
      translateX + "," + translateY + ")";
  }

  function applyViewport() {
    layers.forEach(layoutLayer);
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

    var generation = ++loadGeneration;
    var nextIndex = activeLayerIndex === 0 ? 1 : 0;
    var nextLayer = layers[nextIndex];
    nextLayer.classList.remove("is-visible");

    nextLayer.onload = function () {
      if (generation !== loadGeneration ||
          (sequence !== null && sequence < lastSequence)) return;
      layoutLayer(nextLayer);
      document.body.classList.add("photo-mode");
      stage.setAttribute("aria-hidden", "false");
      nextLayer.classList.add("is-visible");
      if (activeLayerIndex >= 0) layers[activeLayerIndex].classList.remove("is-visible");
      activeLayerIndex = nextIndex;
      currentPhotoId = photo.photoId;
      currentUrl = photo.url;
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

  function handleViewport(message) {
    if (isStale(message, false)) return;
    var targetPhotoId = readPhotoId(message);
    if (targetPhotoId !== null && currentPhotoId !== null && targetPhotoId !== currentPhotoId) return;
    viewport = normalizeViewport(message);
    applyViewport();
  }

  function resetViewport(message) {
    if (isStale(message, false)) return;
    var targetPhotoId = readPhotoId(message);
    if (targetPhotoId !== null && currentPhotoId !== null && targetPhotoId !== currentPhotoId) return;
    viewport = DEFAULT_VIEWPORT;
    applyViewport();
  }

  function stopPhotoMode() {
    loadGeneration += 1;
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
  }

  window.addEventListener("resize", applyViewport);
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
