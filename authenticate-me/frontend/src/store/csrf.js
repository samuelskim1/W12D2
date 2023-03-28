const csrfFetch = async (url, options = {}) => {
    options.method ||= 'GET'
    options.headers ||= {};

    if (options.method.toUpperCase() !== 'GET') {
        options.headers['X-CSRF-Token'] = sessionStorage.getItem('X-CSRF-Token')
        options.headers['Content-Type'] = 'application/json'
    }

    const res = await fetch(url, options);
    if (res.status >= 400) throw res;
    return res;

}

export const restoreCSRF = async () => {
    let res = await csrfFetch('/api/session/')
    storeCSRFToken(res);
    return res;
}

export const storeCSRFToken = (res) => {
    let token = res.headers.get('X-CSRF-Token')
    if (token) sessionStorage.setItem('X-CSRF-Token', token);
}


export default csrfFetch;