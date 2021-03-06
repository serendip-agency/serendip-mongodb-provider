"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const MongodbCollection_1 = require("./MongodbCollection");
const events_1 = require("events");
class MongodbProvider {
    constructor() {
        // you can listen for  any "update","delete","insert" event. each event emitter is accessible trough property named same as collectionName
        this.events = {};
    }
    dropDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.dropDatabase();
        });
    }
    dropCollection(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.dropCollection(name);
        });
    }
    collections() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.db.collections()).map(p => p.collectionName);
        });
    }
    openUploadStreamByFilePath(filePath, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const file of yield this.files.find({
                filename: filePath
            })) {
                yield this.files.deleteOne(file._id);
                for (const chunk of yield this.fileChunks.find({ files_id: new mongodb_1.ObjectID(file._id) })) {
                    yield this.fileChunks.deleteOne(chunk._id);
                }
            }
            return this.bucket.openUploadStream(filePath, {
                metadata
            });
        });
    }
    openDownloadStreamByFilePath(filePath, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!opts)
                opts = {};
            return this.bucket.openDownloadStreamByName(filePath, {
                revision: opts.revision,
                start: opts.start,
                end: opts.end
            });
        });
    }
    stats() {
        return __awaiter(this, void 0, void 0, function* () {
            const stat = yield this.db.stats({ scale: 1024 * 1024 });
            return {
                db: stat.db,
                collections: stat.collections,
                indexes: stat.indexes,
                avgObjSizeByte: stat.avgObjSize,
                objects: stat.objects,
                fsUsedMB: stat.fsUsedSize,
                fsTotalMB: stat.fsTotalSize,
                storageMB: stat.storageSize
            };
        });
    }
    collection(collectionName, track) {
        return __awaiter(this, void 0, void 0, function* () {
            collectionName = collectionName.trim();
            // if (this.db.collection.indexOf(collectionName) === -1) {
            //   await this.db.createCollection(collectionName);
            //   this.mongoCollections.push(collectionName);
            //   if (Server.opts.logging == "info")
            //     console.log(`☑ collection ${collectionName} created .`);
            // }
            if (!this.events[collectionName])
                this.events[collectionName] = new events_1.EventEmitter();
            return new MongodbCollection_1.MongodbCollection(this.db.collection(collectionName), track, this);
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.close(true);
        });
    }
    initiate(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Creating mongoDB client from mongoUrl
                let connectOptions = {
                    useNewUrlParser: true
                };
                if (options.authSource) {
                    connectOptions.authSource = options.authSource;
                }
                if (options.user && options.password) {
                    connectOptions.auth = {
                        user: options.user,
                        password: options.password
                    };
                }
                this.client = yield mongodb_1.MongoClient.connect(options.mongoUrl, connectOptions);
                this.db = this.client.db(options.mongoDb);
                this.bucket = new mongodb_1.GridFSBucket(this.db);
                this.changes = yield this.collection("EntityChanges", false);
                this.files = yield this.collection('fs.files');
                this.fileChunks = yield this.collection('fs.chunks');
            }
            catch (error) {
                throw new Error("\n\nUnable to connect to MongoDb. Error details: \n" + error.message);
            }
        });
    }
}
exports.MongodbProvider = MongodbProvider;
