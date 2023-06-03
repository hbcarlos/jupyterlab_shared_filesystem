// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { DocumentChange, ISharedDocument, YDocument } from '@jupyter/ydoc';
import { Contents, Drive } from '@jupyterlab/services';
import {
  ISharedFileSystemDrive,
  ISharedModelFactory,
  SharedDocumentFactory
} from './tokens';

/**
 * The url for the default drive service.
 */
//const DOCUMENT_PROVIDER_URL = 'api/collaboration/room';

/**
 * A Collaborative implementation for an `IDrive`, talking to the
 * server using the Jupyter REST API and a WebSocket connection.
 */
export class FileSystemDrive extends Drive implements ISharedFileSystemDrive {
  /**
   * Construct a new drive object.
   *
   * @param user - The user manager to add the identity to the awareness of documents.
   */
  constructor() {
    super({ name: 'SharedFS' });

    this.sharedModelFactory = new SharedModelFactory(this._onCreate);
  }

  /**
   * SharedModel factory for the YDrive.
   */
  readonly sharedModelFactory: ISharedModelFactory;

  /**
   * Dispose of the resources held by the manager.
   */
  dispose(): void {
    super.dispose();
  }

  /**
   * Get a file or directory.
   *
   * @param localPath: The path to the file.
   *
   * @param options: The options used to fetch the file.
   *
   * @returns A promise which resolves with the file content.
   *
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
   */
  async get(
    localPath: string,
    options?: Contents.IFetchOptions
  ): Promise<Contents.IModel> {
    return super.get(localPath, options);
  }

  /**
   * Save a file.
   *
   * @param localPath - The desired file path.
   *
   * @param options - Optional overrides to the model.
   *
   * @returns A promise which resolves with the file content model when the
   *   file is saved.
   */
  async save(
    localPath: string,
    options: Partial<Contents.IModel> = {}
  ): Promise<Contents.IModel> {
    return super.save(localPath, options);
  }

  private _onCreate = (
    options: Contents.ISharedFactoryOptions,
    sharedModel: YDocument<DocumentChange>
  ) => {
	// TODO: Add shared model to YDirectory
  };
}

/**
 * Yjs sharedModel factory for real-time collaboration.
 */
class SharedModelFactory implements ISharedModelFactory {
  private _documentFactories: Map<Contents.ContentType, SharedDocumentFactory>;

  /**
   * Shared model factory constructor
   *
   * @param _onCreate Callback on new document model creation
   */
  constructor(
    private _onCreate: (
      options: Contents.ISharedFactoryOptions,
      sharedModel: YDocument<DocumentChange>
    ) => void
  ) {
    this._documentFactories = new Map();
  }

  /**
   * Whether the IDrive supports real-time collaboration or not.
   */
  readonly collaborative = true;

  /**
   * Register a SharedDocumentFactory.
   *
   * @param type Document type
   * @param factory Document factory
   */
  registerDocumentFactory(
    type: Contents.ContentType,
    factory: SharedDocumentFactory
  ) {
    if (this._documentFactories.has(type)) {
      throw new Error(`The content type ${type} already exists`);
    }
    this._documentFactories.set(type, factory);
  }

  /**
   * Create a new `ISharedDocument` instance.
   *
   * It should return `undefined` if the factory is not able to create a `ISharedDocument`.
   */
  createNew(
    options: Contents.ISharedFactoryOptions
  ): ISharedDocument | undefined {
    if (typeof options.format !== 'string') {
      console.warn(`Only defined format are supported; got ${options.format}.`);
      return;
    }

    if (!options.collaborative) {
      // Bail if the document model does not support collaboration
      // the `sharedModel` will be the default one.
      return;
    }

    if (this._documentFactories.has(options.contentType)) {
      const factory = this._documentFactories.get(options.contentType)!;
      const sharedModel = factory(options);
      this._onCreate(options, sharedModel);
      return sharedModel;
    }

    return;
  }
}