import { join } from "path";
import * as assert from "assert";
import {
  DbCollectionInterface,
  DbProviderInterface
} from "serendip-business-model";
import * as fs from "fs-extra";
import * as dotenv from "dotenv";
import { MongodbProvider } from "../MongodbProvider";

describe("update scenarios", () => {
  let provider: DbProviderInterface;
  let collection: DbCollectionInterface<any>;
  beforeEach(done => {
    (async () => {
      // runs before each test in this block

      provider = new MongodbProvider();
      await provider.initiate({
        mongoDb: process.env["db.mongoDb"],
        mongoUrl: process.env["db.mongoUrl"],
        authSource: process.env["db.authSource"],
        user: process.env["db.user"],
        password: process.env["db.password"]
      });
      try {
        await provider.dropCollection("test");
      } catch (error) {}
      collection = await provider.collection("test");

      done();
    })();
  });
  it("should return updated", done => {
    (async () => {
      let model = await collection.insertOne({
        hello: true
      });

      assert.equal(model.hello, true);

      model.hello = false;

      model = await collection.updateOne(model);

      assert.equal(model.hello, false);

      done();
    })()
      .then(() => { })
      .catch(done);
  });


  it("should upsert", done => {
    (async () => {


      await collection.updateOne({ upserted: true });

      done();
    })()
      .then(() => { })
      .catch(done);
  });

  it("should get update event", done => {
    (async () => {
      let model = await collection.insertOne({
        hello: true
      });

      assert.equal(model.hello, true);

      model.hello = false;

      provider.events["test"].on("update", doc => {
        assert.equal(model.hello, false);
        assert.equal(model._id.toString(), doc._id.toString());
        done();
      });

      model = await collection.updateOne(model);

      assert.equal(model.hello, false);
    })()
      .then(() => { })
      .catch(done);
  });


  it("should do more upserts", done => {
    (async () => {

      await collection.updateOne({ upserted1: true });
      await collection.updateOne({ upserted2: true });
      await collection.updateOne({ upserted3: true });
      await collection.updateOne({ upserted4: true });

      done();
    })()
      .then(() => { })
      .catch(done);
  });
});
