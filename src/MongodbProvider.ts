import { Db, MongoClientOptions, MongoClient } from "mongodb";

import * as deep from "deep-diff";

import { MongodbCollection } from "./MongodbCollection";
import {
  DbCollectionInterface,
  DbProviderInterface,
  EntityChangeModel
} from "serendip-business-model";
export class MongodbProvider implements DbProviderInterface {
  changes: DbCollectionInterface<EntityChangeModel>;
  /**
   * Instance of mongodb database
   */
  private db: Db;

  public async collection<T>(
    collectionName: string,
    track?: boolean
  ): Promise<DbCollectionInterface<T>> {
    collectionName = collectionName.trim();

    // if (this.db.collection.indexOf(collectionName) === -1) {
    //   await this.db.createCollection(collectionName);
    //   this.mongoCollections.push(collectionName);

    //   if (Server.opts.logging == "info")
    //     console.log(`☑ collection ${collectionName} created .`);
    // }

    return new MongodbCollection<T>(
      this.db.collection(collectionName),
      track,
      this
    );
  }
  async initiate(options: any): Promise<void> {
    try {
      // Creating mongoDB client from mongoUrl

      let connectOptions: MongoClientOptions = {
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

      var mongoClient = await MongoClient.connect(
        options.mongoUrl,
        connectOptions
      );

      this.db = mongoClient.db(options.mongoDb);

      this.changes = await this.collection<EntityChangeModel>(
        "EntityChanges",
        false
      );
    } catch (error) {
      throw new Error(
        "\n\nUnable to connect to MongoDb. Error details: \n" + error.message
      );
    }
  }
}
