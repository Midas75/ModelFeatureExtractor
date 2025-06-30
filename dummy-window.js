import fs from 'fs';
import path from 'path';
global.window = global;
global.document = {
    addEventListener: () => { },
    documentElement: {
        style: {}
    },
    elements: {
        "logo-github": {
            getAttribute: (attributeName) => {
                if (attributeName == "href") {
                    return ""
                }
            }
        },
        "message-text": {
            innerText: ""
        },
        "message-button": {
            style: {
                removeProperty: () => { }
            },
            focus: () => { }
        }
    },
    getElementsByTagName: () => { return [] },
    getElementById: (id) => { return document.elements[id] },
    cookie: "",
    body: {
        classList: {
            remove: () => { },
            add: () => { }
        },
        getAttribute: () => { },
        addEventListener: () => { }
    }
}
global.location = {
    search: {},
    pathname: ".",
    host: "source",
    protocol: "."
}
global.Element = {
    prototype: {
        scrollTo: () => { }
    }
}
class DummyXMLHttpRequest {
    constructor() {
        this.readyState = 0;
        this.status = 0;
        this.response = null;
        this.responseText = '';
        this.responseType = '';
        this.timeout = 0;
        this.onreadystatechange = null;
        this.onload = null;
        this.onerror = null;
        this.ontimeout = null;
        this.onprogress = null;

        this._headers = {};
        this._method = null;
        this._url = null;
    }

    open(method, url, async = true) {
        this._method = method;
        this._url = url;
        this.readyState = 1;
        this._async = async;
        console.log(method, url)
        if (this.onreadystatechange) this.onreadystatechange();
    }

    setRequestHeader(name, value) {
        this._headers[name.toLowerCase()] = value;
    }

    abort() {
    }

    send() {
        if (this._method !== 'GET') {
            if (this.onerror) this.onerror(new Error('Only GET supported in DummyXMLHttpRequest'));
            return;
        }
        if (this.onprogress) {
            this.onprogress({ lengthComputable: true, loaded: 0, total: 100 });
        }

        let cleanUrl = this._url.split('?')[0];

        // 转换为绝对路径
        let filePath = cleanUrl;
        if (!path.isAbsolute(filePath)) {
            filePath = path.resolve("./", filePath);
        }
        console.log(filePath)
        fs.readFile(filePath, (err, data) => {
            if (err) {
                this.status = 404;
                if (this.onerror) this.onerror(err);
                return;
            }

            this.status = 200;
            this.readyState = 4;

            if (this.responseType === 'arraybuffer') {
                this.response = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            } else {
                this.responseText = data.toString('utf8');
                this.response = this.responseText;
            }

            if (this.onprogress) {
                this.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
            }

            if (this.onload) this.onload();

            if (this.onreadystatechange) this.onreadystatechange();
        });
    }
}

global.XMLHttpRequest = DummyXMLHttpRequest