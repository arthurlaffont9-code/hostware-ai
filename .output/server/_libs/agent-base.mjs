import { __commonJSMin, __require } from "../_runtime.mjs";
// node_modules/agent-base/dist/helpers.js
var require_helpers = /* @__PURE__ */ __commonJSMin(((exports, module, this$2) => {
	var __createBinding = this$2 && this$2.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$2 && this$2.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$2 && this$2.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.req = exports.json = exports.toBuffer = void 0;
	var http = __importStar(__require("http"));
	var https = __importStar(__require("https"));
	async function toBuffer(stream) {
		let length = 0;
		const chunks = [];
		for await (const chunk of stream) {
			length += chunk.length;
			chunks.push(chunk);
		}
		return Buffer.concat(chunks, length);
	}
	exports.toBuffer = toBuffer;
	async function json(stream) {
		const str = (await toBuffer(stream)).toString("utf8");
		try {
			return JSON.parse(str);
		} catch (_err) {
			const err = _err;
			err.message += ` (input: ${str})`;
			throw err;
		}
	}
	exports.json = json;
	function req(url, opts = {}) {
		const req = ((typeof url === "string" ? url : url.href).startsWith("https:") ? https : http).request(url, opts);
		const promise = new Promise((resolve, reject) => {
			req.once("response", resolve).once("error", reject).end();
		});
		req.then = promise.then.bind(promise);
		return req;
	}
	exports.req = req;
}));
// node_modules/agent-base/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports, module, this$1) => {
	var __createBinding = this$1 && this$1.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$1 && this$1.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$1 && this$1.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __exportStar = this$1 && this$1.__exportStar || function(m, exports) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Agent = void 0;
	var net = __importStar(__require("net"));
	var http = __importStar(__require("http"));
	var https_1 = __require("https");
	__exportStar(require_helpers(), exports);
	var INTERNAL = Symbol("AgentBaseInternalState");
	var Agent = class extends http.Agent {
		constructor(opts) {
			super(opts);
			this[INTERNAL] = {};
		}
		/**
		* Determine whether this is an `http` or `https` request.
		*/
		isSecureEndpoint(options) {
			if (options) {
				if (typeof options.secureEndpoint === "boolean") return options.secureEndpoint;
				if (typeof options.protocol === "string") return options.protocol === "https:";
			}
			const { stack } = /* @__PURE__ */ new Error();
			if (typeof stack !== "string") return false;
			return stack.split("\n").some((l) => l.indexOf("(https.js:") !== -1 || l.indexOf("node:https:") !== -1);
		}
		incrementSockets(name) {
			if (this.maxSockets === Infinity && this.maxTotalSockets === Infinity) return null;
			if (!this.sockets[name]) this.sockets[name] = [];
			const fakeSocket = new net.Socket({ writable: false });
			this.sockets[name].push(fakeSocket);
			this.totalSocketCount++;
			return fakeSocket;
		}
		decrementSockets(name, socket) {
			if (!this.sockets[name] || socket === null) return;
			const sockets = this.sockets[name];
			const index = sockets.indexOf(socket);
			if (index !== -1) {
				sockets.splice(index, 1);
				this.totalSocketCount--;
				if (sockets.length === 0) delete this.sockets[name];
			}
		}
		getName(options) {
			if (this.isSecureEndpoint(options)) return https_1.Agent.prototype.getName.call(this, options);
			return super.getName(options);
		}
		createSocket(req, options, cb) {
			const connectOpts = {
				...options,
				secureEndpoint: this.isSecureEndpoint(options)
			};
			const name = this.getName(connectOpts);
			const fakeSocket = this.incrementSockets(name);
			Promise.resolve().then(() => this.connect(req, connectOpts)).then((socket) => {
				this.decrementSockets(name, fakeSocket);
				if (socket instanceof http.Agent) try {
					return socket.addRequest(req, connectOpts);
				} catch (err) {
					return cb(err);
				}
				this[INTERNAL].currentSocket = socket;
				super.createSocket(req, options, cb);
			}, (err) => {
				this.decrementSockets(name, fakeSocket);
				cb(err);
			});
		}
		createConnection() {
			const socket = this[INTERNAL].currentSocket;
			this[INTERNAL].currentSocket = void 0;
			if (!socket) throw new Error("No socket was returned in the `connect()` function");
			return socket;
		}
		get defaultPort() {
			return this[INTERNAL].defaultPort ?? (this.protocol === "https:" ? 443 : 80);
		}
		set defaultPort(v) {
			if (this[INTERNAL]) this[INTERNAL].defaultPort = v;
		}
		get protocol() {
			return this[INTERNAL].protocol ?? (this.isSecureEndpoint() ? "https:" : "http:");
		}
		set protocol(v) {
			if (this[INTERNAL]) this[INTERNAL].protocol = v;
		}
	};
	exports.Agent = Agent;
}));
export { require_dist };
