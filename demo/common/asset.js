/*! @license
 * Shaka Player
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */


/**
 * @fileoverview
 */

goog.provide('ShakaDemoAssetInfo');


/**
 * @param {string} key
 * @return {boolean}
 */
function shakaDemoIsBlockedKey_(key) {
  return key == '__proto__' || key == 'constructor' || key == 'prototype';
}


/**
 * An object that contains information about an asset.
 */
const ShakaDemoAssetInfo = class {
  /**
   * @param {string} name
   * @param {string} iconUri
   * @param {string} manifestUri
   * @param {shakaAssets.Source} source
   */
  constructor(name, iconUri, manifestUri, source) {
    // Required members.
    /** @type {string} */
    this.name = name;
    /** @type {string} */
    this.shortName = '';
    /** @type {string} */
    this.iconUri = iconUri;
    /** @type {string} */
    this.manifestUri = manifestUri;
    /** @type {!shakaAssets.Source} */
    this.source = source;

    // Optional members.
    /** @type {boolean} */
    this.focus = false;
    /** @type {boolean} */
    this.disabled = false;
    /** @type {!Array<!shaka.extern.ExtraText>} */
    this.extraText = [];
    /** @type {!Array<string>} */
    this.extraThumbnail = [];
    /** @type {!Array<!shaka.extern.ExtraChapter>} */
    this.extraChapter = [];
    /** @type {?string} */
    this.certificateUri = null;
    /** @type {?string} */
    this.description = null;
    /** @type {boolean} */
    this.isFeatured = false;
    /** @type {!Array<!shakaAssets.KeySystem>} */
    this.drm = [shakaAssets.KeySystem.CLEAR];
    /** @type {!Array<!shakaAssets.Feature>} */
    this.features = [shakaAssets.Feature.VOD];
    /** @type {!Map<string, string>} */
    this.licenseServers = new Map();
    /** @type {!Map<string, string>} */
    this.offlineLicenseServers = new Map();
    /** @type {!Map<string, string>} */
    this.licenseRequestHeaders = new Map();
    /** @type {?shaka.extern.RequestFilter} */
    this.requestFilter = null;
    /** @type {?shaka.extern.ResponseFilter} */
    this.responseFilter = null;
    /** @type {!Map<string, string>} */
    this.clearKeys = new Map(); // TODO: Setter method?
    /** @type {?Object} */
    this.extraConfig = null;
    /** @type {?Object} */
    this.extraUiConfig = null;
    /** @type {?string} */
    this.adTagUri = null;
    /** @type {?string} */
    this.imaVideoId = null;
    /** @type {?string} */
    this.imaAssetKey = null;
    /** @type {?string} */
    this.imaContentSrcId = null;
    /** @type {?string} */
    this.imaManifestType = null;
    /** @type {?string} */
    this.mediaTailorUrl = null;
    /** @type {?Object} */
    this.mediaTailorAdsParams = null;
    /** @type {boolean} */
    this.useIMA = true;
    /** @type {?string} */
    this.mimeType = null;
    /**
     * When true, |manifestUri| points to an M3U/M3U8 playlist file
     * rather than a single-stream manifest.  The demo will call
     * QueueManager.loadFromM3uPlaylist() instead of the normal load path,
     * and will play the first item in the playlist automatically.
     * @type {boolean}
     */
    this.isPlaylist = false;


    // Preload values.
    /** @type {?shaka.media.PreloadManager} */
    this.preloadManager;
    this.preloaded = false;
    this.preloadFailed = false;

    /** @type {?string} */
    this.playToken = null;
    /** @type {?string} */
    this.limeToken = null;

    // Offline storage values.
    /** @type {?function()} */
    this.storeCallback;
    /** @type {?function()} */
    this.unstoreCallback;
    /** @type {?shaka.extern.StoredContent} */
    this.storedContent;
    /** @type {number} */
    this.storedProgress = 1;
  }

  /**
   * @param {string} description
   * @return {!ShakaDemoAssetInfo}
   */
  addDescription(description) {
    this.description = description;
    return this;
  }

  /**
   * A sort comparator for comparing two messages, ignoring case.
   * @param {string} a
   * @param {string} b
   * @return {number}
   * @private
   */
  static caseLessAlphaComparator_(a, b) {
    if (a.toLowerCase() < b.toLowerCase()) {
      return -1;
    }
    if (a.toLowerCase() > b.toLowerCase()) {
      return 1;
    }
    return 0;
  }

  /**
   * @param {shakaAssets.Feature} feature
   * @return {!ShakaDemoAssetInfo}
   */
  addFeature(feature) {
    const Feature = shakaAssets.Feature;
    if (feature == Feature.LIVE) {
      // Unmark this feature as being VOD.
      this.features = this.features.filter((feature) => feature != Feature.VOD);
    }
    this.features.push(feature);
    // Sort the features list, so that features are in a predictable order.
    this.features.sort(ShakaDemoAssetInfo.caseLessAlphaComparator_);
    return this;
  }

  /**
   * @param {shakaAssets.Feature} feature
   * @return {!ShakaDemoAssetInfo}
   */
  removeFeature(feature) {
    this.features = this.features.filter((f) => f != feature);
    // Sort the features list, so that features are in a predictable order.
    this.features.sort(ShakaDemoAssetInfo.caseLessAlphaComparator_);
    return this;
  }

  /**
   * @private
   */
  checkAdFeature_() {
    let isAd = false;
    if (this.adTagUri || (this.imaVideoId && this.imaContentSrcId) ||
      this.imaAssetKey || this.mediaTailorUrl) {
      isAd = true;
    }
    if (isAd) {
      if (!this.features.includes(shakaAssets.Feature.ADS)) {
        this.addFeature(shakaAssets.Feature.ADS);
      }
    } else {
      if (this.features.includes(shakaAssets.Feature.ADS)) {
        this.removeFeature(shakaAssets.Feature.ADS);
      }
    }
  }

  /**
   * @private
   */
  checkChaptersFeature_() {
    if (this.extraChapter.length) {
      if (!this.features.includes(shakaAssets.Feature.CHAPTERS)) {
        this.addFeature(shakaAssets.Feature.CHAPTERS);
      }
    } else {
      if (this.features.includes(shakaAssets.Feature.CHAPTERS)) {
        this.removeFeature(shakaAssets.Feature.CHAPTERS);
      }
    }
  }

  /**
   * @private
   */
  checkThumbnailsFeature_() {
    if (this.extraThumbnail.length) {
      if (!this.features.includes(shakaAssets.Feature.THUMBNAILS)) {
        this.addFeature(shakaAssets.Feature.THUMBNAILS);
      }
    } else {
      if (this.features.includes(shakaAssets.Feature.THUMBNAILS)) {
        this.removeFeature(shakaAssets.Feature.THUMBNAILS);
      }
    }
  }

  /**
   * @param {shakaAssets.KeySystem} keySystem
   * @return {!ShakaDemoAssetInfo}
   */
  addKeySystem(keySystem) {
    if (this.isClear()) {
      // Once an asset has an actual key system, it's no longer a CLEAR asset.
      this.drm = [];
    }
    this.drm.push(keySystem);
    // Sort the drm list, so that key systems are in a predictable order.
    this.drm.sort(ShakaDemoAssetInfo.caseLessAlphaComparator_);
    return this;
  }

  /** @return {boolean} */
  isClear() {
    return this.drm.length == 1 && this.drm[0] == shakaAssets.KeySystem.CLEAR;
  }

  /** @return {boolean} */
  isAes128() {
    return this.drm.length == 1 && this.drm[0] == shakaAssets.KeySystem.AES128;
  }

  /**
   * @param {!Object} extraConfig
   * @return {!ShakaDemoAssetInfo}
   */
  setExtraConfig(extraConfig) {
    this.extraConfig = extraConfig;
    return this;
  }

  /**
   * @param {!Object} extraUiConfig
   * @return {!ShakaDemoAssetInfo}
   */
  setExtraUiConfig(extraUiConfig) {
    this.extraUiConfig = extraUiConfig;
    return this;
  }

  /**
   * @param {string} mimeType
   * @return {!ShakaDemoAssetInfo}
   */
  setMimeType(mimeType) {
    this.mimeType = mimeType;
    return this;
  }

  /**
   * @param {!shaka.extern.RequestFilter} requestFilter
   * @return {!ShakaDemoAssetInfo}
   */
  setRequestFilter(requestFilter) {
    this.requestFilter = requestFilter;
    return this;
  }

  /**
   * @param {!shaka.extern.ResponseFilter} responseFilter
   * @return {!ShakaDemoAssetInfo}
   */
  setResponseFilter(responseFilter) {
    this.responseFilter = responseFilter;
    return this;
  }

  /**
   * @param {string} keySystem
   * @param {string} licenseServer
   * @return {!ShakaDemoAssetInfo}
   */
  addLicenseServer(keySystem, licenseServer) {
    this.licenseServers.set(keySystem, licenseServer);
    return this;
  }

  /**
   * @return {!Map<string, string>}
   */
  getLicenseServers() {
    return this.licenseServers;
  }

  /**
   * @param {string} keySystem
   * @param {string} licenseServer
   * @return {!ShakaDemoAssetInfo}
   */
  addOfflineLicenseServer(keySystem, licenseServer) {
    this.offlineLicenseServers.set(keySystem, licenseServer);
    return this;
  }

  /**
   * @param {string} uri
   * @return {!ShakaDemoAssetInfo}
   */
  setAdTagUri(uri) {
    this.adTagUri = uri.trim();
    this.checkAdFeature_();
    return this;
  }

  /**
   * @param {string} id
   * @return {!ShakaDemoAssetInfo}
   */
  setIMAContentSourceId(id) {
    this.imaContentSrcId = id.trim();
    this.checkAdFeature_();

    return this;
  }

  /**
   * @param {string} id
   * @return {!ShakaDemoAssetInfo}
   */
  setIMAVideoId(id) {
    this.imaVideoId = id.trim();
    this.checkAdFeature_();

    return this;
  }

  /**
   * @param {string} key
   * @return {!ShakaDemoAssetInfo}
   */
  setIMAAssetKey(key) {
    this.imaAssetKey = key.trim();
    this.checkAdFeature_();

    return this;
  }

  /**
   * @param {string} type
   * @return {!ShakaDemoAssetInfo}
   */
  setIMAManifestType(type) {
    this.imaManifestType = type.trim();
    this.checkAdFeature_();

    return this;
  }

  /**
   * @param {string} url
   * @param {?Object=} adsParams
   * @return {!ShakaDemoAssetInfo}
   */
  setMediaTailor(url, adsParams=null) {
    this.mediaTailorUrl = url.trim();
    this.mediaTailorAdsParams = adsParams;
    this.checkAdFeature_();

    return this;
  }

  /**
   * @return {boolean}
   */
  hasAds() {
    return this.features.includes(shakaAssets.Feature.ADS);
  }

  /**
   * @param {string} headerName
   * @param {string} headerValue
   * @return {!ShakaDemoAssetInfo}
   */
  addLicenseRequestHeader(headerName, headerValue) {
    this.licenseRequestHeaders.set(headerName, headerValue);
    return this;
  }

  /**
   * @param {shaka.extern.ExtraText} extraText
   * @return {!ShakaDemoAssetInfo}
   */
  addExtraText(extraText) {
    this.extraText.push(extraText);
    return this;
  }

  /**
   * @param {string} textUri
   * @return {!ShakaDemoAssetInfo}
   */
  removeExtraText(textUri) {
    this.extraText = this.extraText.filter((extraText) => {
      return extraText.uri != textUri;
    });
    return this;
  }

  /**
   * @param {string} uri
   * @return {!ShakaDemoAssetInfo}
   */
  addExtraThumbnail(uri) {
    this.extraThumbnail.push(uri);
    this.checkThumbnailsFeature_();
    return this;
  }

  /**
   * @param {shaka.extern.ExtraChapter} extraChapter
   * @return {!ShakaDemoAssetInfo}
   */
  addExtraChapter(extraChapter) {
    this.extraChapter.push(extraChapter);
    this.checkChaptersFeature_();
    return this;
  }

  /**
   * @param {string} chapterUri
   * @return {!ShakaDemoAssetInfo}
   */
  removeExtraChapter(chapterUri) {
    this.extraChapter = this.extraChapter.filter((extraChapter) => {
      return extraChapter.uri != chapterUri;
    });
    this.checkChaptersFeature_();
    return this;
  }

  /**
   * If this is called, the asset will be focused on by the integration tests.
   * @return {!ShakaDemoAssetInfo}
   */
  markAsFocused() {
    this.focus = true;
    return this;
  }

  /**
   * If this is called, the asset will appear on the main page of the demo.
   * Also, this allows you to provide a shorter name to be used in the feature
   * card.
   * @param {string=} shortName
   * @return {!ShakaDemoAssetInfo}
   */
  markAsFeatured(shortName) {
    this.isFeatured = true;
    this.shortName = shortName || this.shortName;
    return this;
  }

  /**
   * If this is called, the asset is disabled in tests and in the demo app.
   * @return {!ShakaDemoAssetInfo}
   */
  markAsDisabled() {
    this.disabled = true;
    return this;
  }

  /**
   * @return {!Object}
   * @override
   * @suppress {checkTypes}
   * Suppress checkTypes warnings, so that we can access properties of this
   * object as though it were a struct.
   */
  toJSON() {
    // Construct a generic object with the values of this object, but with the
    // proper formatting.
    const raw = {};
    for (const key of Object.keys(this)) {
      if (shakaDemoIsBlockedKey_(key)) {
        continue;
      }
      if (key.startsWith('preload') || key.startsWith('store') ||
          key.endsWith('Callback')) {
        // These values shouldn't be saved, as they are dynamic.
        continue;
      }
      const value = this[key];
      if (value instanceof Map) {
        // The built-in JSON functions cannot convert Maps; this converts Maps
        // to objects.
        const replacement = {};
        replacement['__type__'] = 'map';
        for (const entry of value.entries()) {
          if (shakaDemoIsBlockedKey_(entry[0])) {
            continue;
          }
          replacement[entry[0]] = entry[1];
        }
        raw[key] = replacement;
      } else {
        raw[key] = value;
      }
    }
    return raw;
  }

  /**
   * @return {!string}
   */
  toBase64() {
    return window.btoa(JSON.stringify(this.toJSON()));
  }

  /**
   * Applies appropriate request or response filters to the player.
   * @param {shaka.net.NetworkingEngine} networkingEngine
   */
  applyFilters(networkingEngine) {
    networkingEngine.clearAllRequestFilters();
    networkingEngine.clearAllResponseFilters();

    if (this.requestFilter) {
      networkingEngine.registerRequestFilter(this.requestFilter);
    }
    if (this.responseFilter) {
      networkingEngine.registerResponseFilter(this.responseFilter);
    }

    if (this.licenseServers.get('com.apple.fps')) {
      /** @type {!shaka.extern.RequestFilter} */
      const requestFilter = (requestType, request, context) => {
        return this.addUnextFairPlayRequestFilter_(
            this.playToken, requestType, request);
      };
      networkingEngine.registerRequestFilter(requestFilter);
      /** @type {!shaka.extern.ResponseFilter} */
      const responseFilter = (requestType, response, context) => {
        return this.addUnextFairPlayResponseFilter_(requestType, response);
      };
      networkingEngine.registerResponseFilter(responseFilter);
    }

    if (this.playToken) {
      /** @type {!shaka.extern.RequestFilter} */
      const filter = (requestType, request, context) => {
        return this.addPlayTokenQuery_(
            this.playToken || '', requestType, request);
      };
      networkingEngine.registerRequestFilter(filter);
    }

    if (this.limeToken) {
      /** @type {!shaka.extern.RequestFilter} */
      const filter = (requestType, request, context) => {
        return this.addLimeAuthHeader_(
            this.limeToken || '', requestType, request);
      };
      networkingEngine.registerRequestFilter(filter);
    }
  }

  /**
   * Gets the configuration object for the asset.
   *
   * @param {boolean=} forStorage
   * @return {!shaka.extern.PlayerConfiguration}
   */
  getConfiguration(forStorage = false) {
    const config = /** @type {shaka.extern.PlayerConfiguration} */(
      {drm: {advanced: {}}, manifest: {dash: {}, hls: {}}, streaming: {}});

    if (this.extraConfig) {
      for (const key of Object.keys(this.extraConfig)) {
        if (shakaDemoIsBlockedKey_(key)) {
          continue;
        }
        config[key] = this.extraConfig[key];
      }
    }

    let licenseServers = this.licenseServers;
    // PR license servers may require a different URL for offline.
    if (forStorage && this.offlineLicenseServers.size) {
      licenseServers = this.offlineLicenseServers;
    }

    if (licenseServers.size) {
      config.drm.servers = config.drm.servers || {};
      licenseServers.forEach((value, key) => {
        config.drm.servers[key] = value;
        if (this.certificateUri || this.licenseRequestHeaders.size) {
          if (!config.drm.advanced[key]) {
            config.drm.advanced[key] =
                ShakaDemoAssetInfo.defaultAdvancedDrmConfig();
          }
          if (this.certificateUri) {
            config.drm.advanced[key].serverCertificateUri =
                this.certificateUri;
          }
          if (this.licenseRequestHeaders.size) {
            this.licenseRequestHeaders.forEach((headerValue, headerName) => {
              config.drm.advanced[key].headers[headerName] = headerValue;
            });
          }
        }
      });
    }

    if (this.clearKeys.size) {
      config.drm.clearKeys = config.drm.clearKeys || {};
      this.clearKeys.forEach((value, key) => {
        config.drm.clearKeys[key] = value;
      });
    }

    // Windows Edge only support persistent licenses with
    // `com.microsoft.playready.recommendation` keySystem.
    if (forStorage &&
        navigator.userAgent.match(/Edge?\//) &&
        navigator.platform &&
        navigator.platform.toLowerCase().includes('win32')) {
      config.drm.keySystemsMapping = {
        'com.microsoft.playready': 'com.microsoft.playready.recommendation',
      };
    }

    return config;
  }

  /**
   * Appends "play_token" query parameter to the request.
   * @param {!string} playToken
   * @param {shaka.net.NetworkingEngine.RequestType} requestType
   * @param {shaka.extern.Request} request
   * @private
   */
  addPlayTokenQuery_(playToken, requestType, request) {
    if (requestType != shaka.net.NetworkingEngine.RequestType.LICENSE &&
        requestType != shaka.net.NetworkingEngine.RequestType.MANIFEST &&
        !this.isUnextSampleAesLicenseRequest_(request) &&
        !this.isUnextAesLicenseRequest_(request)) {
      return;
    }
    if (requestType == shaka.net.NetworkingEngine.RequestType.MANIFEST &&
        request.uris[0].includes('/out/v')) {
      return; // Skip live manifest fetching requests
    }

    console.info(
        'Appending play_token query parameter to ' + request.uris[0] + '...');
    const sep = request.uris[0].includes('?') ? '&' : '?';
    request.uris[0] += sep + 'play_token=' + playToken;
  }

  /**
   * Adds "Authorization" header to the request.
   * @param {!string} limeToken
   * @param {shaka.net.NetworkingEngine.RequestType} requestType
   * @param {shaka.extern.Request} request
   * @private
   */
  addLimeAuthHeader_(limeToken, requestType, request) {
    if (requestType != shaka.net.NetworkingEngine.RequestType.LICENSE &&
        requestType !=
            shaka.net.NetworkingEngine.RequestType.SERVER_CERTIFICATE &&
        requestType != shaka.net.NetworkingEngine.RequestType.MANIFEST &&
        !this.isUnextSampleAesLicenseRequest_(request) &&
        !this.isUnextAesLicenseRequest_(request)) {
      return;
    }
    if (requestType == shaka.net.NetworkingEngine.RequestType.MANIFEST &&
        request.uris[0].includes('/out/v')) {
      return; // Skip live manifest fetching requests
    }

    console.info(
        'Adding Authorization request header for ' + request.uris[0] + '...');
    // Add these to the existing headers.  Do not clobber them!
    // For PlayReady, there will already be headers in the request.
    request.headers['Authorization'] = 'Bearer ' + limeToken;
  }

  /**
   * Checks if the request is an UNEXT Sample AES key request.
   * @param {shaka.extern.Request} request
   * @return {boolean}
   * @private
   */
  isUnextSampleAesLicenseRequest_(request) {
    return request.uris[0].includes('/saeslic') ||
        request.uris[0].includes('/hlsvodlic') ||
        request.uris[0].includes('/unextlivesampleaeslic');
  }

  /**
   * Checks if the request is an UNEXT AES128 key request.
   * @param {shaka.extern.Request} request
   * @return {boolean}
   * @private
   */
  isUnextAesLicenseRequest_(request) {
    return request.uris[0].includes('/aeslic') ||
        request.uris[0].includes('/hlsvodlic') ||
        request.uris[0].includes('/unextliveaes128lic');
  }

  /**
   * Wraps the FairPlay cert and license request into a UNEXT defined structure.
   * See: https://wiki.unext-info.jp/pages/viewpage.action?pageId=21348524
   * @param {?string} playToken
   * @param {shaka.net.NetworkingEngine.RequestType} requestType
   * @param {shaka.extern.Request} request
   * @private
   */
  addUnextFairPlayRequestFilter_(playToken, requestType, request) {
    if (!request.uris[0].includes('/fplic') &&
        !request.uris[0].includes('/unextlivefplic') &&
        !request.uris[0].includes('/unextlinearlic')) {
      return;
    }
    if (requestType ==
        shaka.net.NetworkingEngine.RequestType.SERVER_CERTIFICATE) {
      const bodyJson = {
        'request': 'cert',
        'service': 'unext',
      };
      request.method = 'POST';
      request.body = shaka.util.StringUtils.toUTF8(JSON.stringify(bodyJson));
    } else if (requestType == shaka.net.NetworkingEngine.RequestType.LICENSE) {
      // The DRM initData changed from
      //   b'sdk://xxx'
      // to
      //   b'<len-4b><data1><len-4b><content-id><len-4b><data2>'
      // since v4.16.10.
      const view = shaka.util.BufferUtils.toDataView(
          /** @type {!Uint8Array} */ (request.initData));
      const offset = 4 + view.getUint32(0, /* littleEndian= */ true);
      const dataSize = view.getUint32(offset, /* littleEndian= */ true);
      const contentIdUtf16 =
          request.initData.subarray(offset + 4, offset + 4 + dataSize);
      const contentId = shaka.util.StringUtils.fromBytesAutoDetect(
          contentIdUtf16);
      const bodyJson = {
        'version': '1.0',
        'request': 'license',
        'service': 'unext',
        'data': {
          'skd': contentId,
          'spc': shaka.util.Uint8ArrayUtils.toStandardBase64(
              /** @type {!ArrayBuffer} */ (request.body)),
        },
      };
      if (playToken) {
        bodyJson['data']['play_token'] = playToken;
      }
      request.method = 'POST';
      request.body = shaka.util.StringUtils.toUTF8(JSON.stringify(bodyJson));
    }
  }

  /**
   * Unwraps the FairPlay license response per a UNEXT defined structure.
   * See: https://wiki.unext-info.jp/pages/viewpage.action?pageId=21348524
   * @param {shaka.net.NetworkingEngine.RequestType} requestType
   * @param {shaka.extern.Response} response
   * @private
   */
  addUnextFairPlayResponseFilter_(requestType, response) {
    if (!response.uri.includes('/fplic') &&
        !response.uri.includes('/unextlivefplic') &&
        !response.uri.includes('/unextlinearlic')) {
      return;
    }
    if (requestType != shaka.net.NetworkingEngine.RequestType.LICENSE) {
      return;
    }
    const bodyJson = JSON.parse(shaka.util.StringUtils.fromUTF8(response.data));
    response.data = shaka.util.Uint8ArrayUtils.fromBase64(
        bodyJson['data']['ckc']);
  }

  /** @return {boolean} */
  isStored() {
    return this.storedContent != null;
  }

  /** @return {!ShakaDemoAssetInfo} */
  static makeBlankAsset() {
    return new ShakaDemoAssetInfo(
        /* name= */ '',
        /* iconUri= */ '',
        /* manifestUri= */ '',
        /* source= */ shakaAssets.Source.CUSTOM);
  }

  /**
   * @param {!Object} raw
   * @return {!ShakaDemoAssetInfo}
   */
  static fromJSON(raw) {
    // This handles the special case for Maps in toJSON.
    const parsed = {};
    for (const key of Object.keys(raw)) {
      if (shakaDemoIsBlockedKey_(key)) {
        continue;
      }
      const value = raw[key];
      if (value && typeof value == 'object' && value['__type__'] == 'map') {
        const replacement = new Map();
        for (const mapKey of Object.keys(value)) {
          if (mapKey != '__type__' && !shakaDemoIsBlockedKey_(mapKey)) {
            replacement.set(mapKey, value[mapKey]);
          }
        }
        parsed[key] = replacement;
      } else {
        parsed[key] = value;
      }
    }
    const asset = ShakaDemoAssetInfo.makeBlankAsset();
    for (const key of Object.keys(parsed)) {
      /** @type {!Object} */(asset)[key] = parsed[key];
    }
    return asset;
  }

  /**
   * @param {!string} raw
   * @return {?ShakaDemoAssetInfo}
   */
  static fromBase64(raw) {
    const data = window.atob(raw);
    try {
      const dataAsJson = /** @type {!Object} */(JSON.parse(data));
      return ShakaDemoAssetInfo.fromJSON(dataAsJson);
    } catch (e) {}
    return null;
  }

  /**
   * @return {!shaka.extern.AdvancedDrmConfiguration}
   */
  static defaultAdvancedDrmConfig() {
    return {
      distinctiveIdentifierRequired: false,
      persistentStateRequired: false,
      videoRobustness: [],
      audioRobustness: [],
      sessionType: '',
      serverCertificate: new Uint8Array(0),
      serverCertificateUri: '',
      individualizationServer: '',
      headers: {},
    };
  }
};
