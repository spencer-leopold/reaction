function MemoryStore() {
  this.cache = {};
}

MemoryStore.prototype.get = function(key) {
  if (!key) {
    return;
  }

  return this._get(key);
};

MemoryStore.prototype.set = function(key, value, ttlSec) {
  var expires;

  if (!key || typeof value === 'undefined') {
    return false;
  }

  expires = ttlSec ? Date.now() + ttlSec * 1000 : null;

  this._set(key, {
    value: value,
    expires: expires
  });

  return true;
};

MemoryStore.prototype._get = function(key) {
  var data;

  if (!key) {
    return;
  }

  data = this.cache[key];

  if (data && data.expires && Date.now() > data.expires) {
    this.clear(key);
    data = undefined;
  }
  else if (data && data.value){
    data = data.value;
  }

  return data;
}

MemoryStore.prototype._set = function(key, data) {
  this.cache[key] = data;
}

MemoryStore.prototype.clear = function(key) {
  delete this.cache[key];
}

MemoryStore.prototype.clearAll = function() {
  this.cache = {};
}

module.exports = MemoryStore;
