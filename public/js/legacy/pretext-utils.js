const CDN_URL = 'https://esm.sh/@chenglou/pretext?bundle';

let _module = null;
let _loading = null;

const loadPretext = async () => {
    if (_module) return _module;
    if (!_loading) {
        _loading = import(CDN_URL).then((mod) => {
            _module = mod;
            return mod;
        });
    }
    return _loading;
};

export { loadPretext, CDN_URL };
