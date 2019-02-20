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
const serendip_business_model_1 = require("serendip-business-model");
const deep_diff_1 = require("deep-diff");
class MongodbCollection {
    constructor(collection, track, provider) {
        this.collection = collection;
        this.track = track;
        this.provider = provider;
    }
    ensureIndex(fieldOrSpec, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.createIndex(fieldOrSpec, options);
        });
    }
    find(query, skip, limit) {
        if (skip)
            skip = parseInt(skip);
        if (limit)
            limit = parseInt(limit);
        return new Promise((resolve, reject) => {
            if (skip >= 0 && limit > 0)
                this.collection
                    .find(query)
                    .skip(skip)
                    .limit(limit)
                    .toArray((err, results) => {
                    if (err)
                        return reject(err);
                    return resolve(results);
                });
            else
                this.collection.find(query).toArray((err, results) => {
                    if (err)
                        return reject(err);
                    return resolve(results.map((p) => {
                        p._id = p._id.toString();
                        return p;
                    }));
                });
        });
    }
    count(query) {
        return this.collection.find(query).count();
    }
    updateOne(model, userId) {
        return new Promise((resolve, reject) => {
            model["_id"] = new mongodb_1.ObjectID(model["_id"]);
            model["_vdate"] = Date.now();
            this.collection.findOneAndUpdate({ _id: model["_id"] }, { $set: model }, {
                upsert: true,
                returnOriginal: false
            }, (err, result) => {
                if (err)
                    return reject(err);
                resolve(result.value);
                if (this.track)
                    this.provider.changes.insertOne({
                        date: Date.now(),
                        model,
                        diff: deep_diff_1.default.diff(result.value, model),
                        type: serendip_business_model_1.EntityChangeType.Update,
                        userId: userId,
                        collection: this.collection.collectionName,
                        entityId: model["_id"]
                    });
            });
        });
    }
    deleteOne(_id, userId) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var model;
            var modelQuery = yield this.find({ _id: new mongodb_1.ObjectID(_id) });
            if (modelQuery && modelQuery[0])
                model = modelQuery[0];
            else
                return reject("not found");
            this.collection
                .deleteOne({ _id: new mongodb_1.ObjectID(_id) })
                .then(() => __awaiter(this, void 0, void 0, function* () {
                if (this.track) {
                    yield this.collection.insertOne({
                        date: Date.now(),
                        diff: null,
                        type: serendip_business_model_1.EntityChangeType.Delete,
                        userId: userId,
                        collection: this.collection.collectionName,
                        entityId: _id,
                        model: model
                    });
                }
                resolve(model);
            }))
                .catch(err => {
                console.error(`error in deleting ${_id} from ${this.collection.collectionName}`);
                reject(err);
            });
        }));
    }
    insertOne(model, userId) {
        model["_vdate"] = Date.now();
        return new Promise((resolve, reject) => {
            var objectId = new mongodb_1.ObjectID();
            if (model._id && typeof model._id == "string")
                model._id = new mongodb_1.ObjectID(model._id);
            if (!model._id)
                model._id = new mongodb_1.ObjectID();
            var doc = this.collection.insertOne(model, (err, result) => {
                if (err)
                    return reject(err);
                if (this.track)
                    this.provider.changes.insertOne({
                        date: Date.now(),
                        model: model,
                        diff: deep_diff_1.default.diff({}, model),
                        type: serendip_business_model_1.EntityChangeType.Create,
                        userId: userId,
                        collection: this.collection.collectionName,
                        entityId: model._id
                    });
                resolve(model);
            });
        });
    }
}
exports.MongodbCollection = MongodbCollection;
