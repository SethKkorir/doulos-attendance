import NodeCache from 'node-cache';

const checkInCache = new NodeCache({
    stdTTL: 60,
    checkperiod: 10,
    useClones: false,
});

export const CACHE_TTL = {
    sessionResolve: 30,
    duplicateCheck: 30,
    deviceCheck: 30,
    memberDevice: 60,
};

export const getCached = (key) => {
    const value = checkInCache.get(key);
    return value === undefined ? null : value;
};

export const setCached = (key, value, ttl = 30) => {
    checkInCache.set(key, value, ttl);
    return value;
};

export const deleteCached = (key) => {
    checkInCache.del(key);
};

export const getOrSetCached = async (key, loader, ttl = 30) => {
    const cached = getCached(key);
    if (cached !== null) {
        return cached;
    }

    const value = await loader();
    setCached(key, value, ttl);
    return value;
};

export default checkInCache;
