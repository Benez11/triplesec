// Generated by IcedCoffeeScript 1.6.3-f
(function() {
  var HMAX, SHA3, SHA512, WordArray, util;



  SHA512 = require('./sha512').SHA512;

  SHA3 = require('./sha3').SHA3;

  util = require('./util');

  WordArray = require('./wordarray').WordArray;

  exports.HMAX = HMAX = (function() {
    HMAX.outputSize = 512 / 8;

    HMAX.prototype.outputSize = HMAX.outputSize;

    function HMAX(key, klasses, opts) {
      var i, klass, _i, _ref;
      this.key = key;
      if (klasses == null) {
        klasses = [SHA512, SHA3];
      }
      this.opts = opts != null ? opts : {};
      this.hashers = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = klasses.length; _i < _len; _i++) {
          klass = klasses[_i];
          _results.push(new klass());
        }
        return _results;
      })();
      if (this.hashers[0].output_size !== this.hashers[1].output_size) {
        throw new Error("hashers need the same blocksize");
      }
      this.hasher_output_size = this.hashers[0].blockSize;
      this.hasher_output_size_bytes = this.hasher_output_size * 4;
      if (this.key.sigBytes > this.hasher_output_size_bytes) {
        this.key = this.XOR_compose(this.key);
      }
      this.key.clamp();
      this._oKey = this.key.clone();
      this._iKey = this.key.clone();
      for (i = _i = 0, _ref = this.hasher_output_size; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        this._oKey.words[i] ^= 0x5c5c5c5c;
        this._iKey.words[i] ^= 0x36363636;
      }
      this._oKey.sigBytes = this._iKey.sigBytes = this.hasher_output_size_bytes;
      this.reset();
    }

    HMAX.prototype.XOR_compose = function(x) {
      var h, hn, i, out, tmp, _i, _len, _ref;
      if ((hn = this.opts.skip_compose) != null) {
        out = this.hashers[hn].reset().finalize(x);
      } else {
        x = (new WordArray([0])).concat(x);
        out = this.hashers[0].reset().finalize(x);
        _ref = this.hashers.slice(1);
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          h = _ref[i];
          x.words[0] = i;
          tmp = h.reset().finalize(x);
          out.xor(tmp, {});
          tmp.scrub();
        }
        x.scrub();
      }
      return out;
    };

    HMAX.prototype.get_output_size = function() {
      return this.hashers[0].output_size;
    };

    HMAX.prototype.reset = function() {
      var h, _i, _len, _ref, _results;
      _ref = this.hashers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        h = _ref[_i];
        _results.push(h.reset().update(this._iKey));
      }
      return _results;
    };

    HMAX.prototype.update = function(wa) {
      var h, _i, _len, _ref;
      _ref = this.hashers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        h = _ref[_i];
        h.update(wa);
      }
      return this;
    };

    HMAX.prototype.finalize = function(wa) {
      var h, i, innerHashes, innerPayload, out, _i, _j, _len, _len1, _ref;
      innerHashes = [];
      _ref = this.hashers;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        h = _ref[i];
        innerHashes.push(h.finalize(wa));
      }
      innerPayload = this._oKey.clone();
      for (_j = 0, _len1 = innerHashes.length; _j < _len1; _j++) {
        h = innerHashes[_j];
        innerPayload.concat(h);
        h.scrub();
      }
      out = this.XOR_compose(innerPayload);
      innerPayload.scrub();
      return out;
    };

    HMAX.prototype.scrub = function() {
      this.key.scrub();
      this._iKey.scrub();
      return this._oKey.scrub();
    };

    return HMAX;

  })();

  exports.sign = function(_arg) {
    var input, key;
    key = _arg.key, input = _arg.input;
    return (new HMAX(key)).finalize(input.clamp());
  };

  exports.bulk_sign = function(_arg, cb) {
    var async_args, eng, input, key, progress_hook, slice_args;
    key = _arg.key, input = _arg.input, progress_hook = _arg.progress_hook;
    eng = new HMAX(key);
    input.clamp();
    slice_args = {
      update: function(lo, hi) {
        return eng.update(input.slice(lo, hi));
      },
      finalize: function() {
        return eng.finalize();
      },
      default_n: eng.hasher_output_size * 500
    };
    async_args = {
      what: "hmax_sha512_sha3",
      progress_hook: progress_hook,
      cb: cb
    };
    return util.bulk(input.sigBytes, slice_args, async_args);
  };

}).call(this);