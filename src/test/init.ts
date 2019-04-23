import { join } from "path";
import * as assert from "assert";
import {
  DbCollectionInterface,
  DbProviderInterface
} from "serendip-business-model";
import * as fs from "fs-extra";
import * as dotenv from "dotenv";
import { MongodbProvider } from "../MongodbProvider";


dotenv.config();
describe("init scenarios", () => {
  let provider: DbProviderInterface;
  let collection: DbCollectionInterface<any>;

  it("should do simple initiate", done => {
    (async () => {
      const provider = new MongodbProvider();

       
      await provider.initiate( {
        mongoDb: process.env["db.mongoDb"],
        mongoUrl: process.env["db.mongoUrl"],
        authSource: process.env["db.authSource"],
        user: process.env["db.user"],
        password: process.env["db.password"]
      });


    })()
      .then(done)
      .catch(done);
  });

  it("should get stats", done => {
    (async () => {
      const provider = new MongodbProvider();
            
      await provider.initiate( {
        mongoDb: process.env["db.mongoDb"],
        mongoUrl: process.env["db.mongoUrl"],
        authSource: process.env["db.authSource"],
        user: process.env["db.user"],
        password: process.env["db.password"]
      });


      console.log('\t db stats: ', await provider.stats());


    })()
      .then(done)
      .catch(done);
  });
});
