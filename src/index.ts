import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ToolbarButton } from '@jupyterlab/apputils';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { listIcon, folderIcon } from '@jupyterlab/ui-components';

import { YFile, YNotebook } from '@jupyter/ydoc';

import { FileSystemDrive } from './drive';

// https://github.com/hbcarlos/jupyterlab/blob/drives_demo/packages/fsdrive-extension/src/index.ts

/**
 * Initialization data for the jupyterlab-shared-filesystem extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-shared-filesystem:plugin',
  requires: [IFileBrowserFactory],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    browser: IFileBrowserFactory,
  ) => {
    console.log('JupyterLab extension jupyterlab-shared-filesystem is activated!');

    if (!window.showDirectoryPicker) {
      // bail if the browser does not support the File System API
      console.warn(
        'The File System Access API is not supported in this browser.'
      );
      return;
    }

    const { serviceManager } = app;
    const { createFileBrowser } = browser;
    
    const drive = new FileSystemDrive();
    drive.sharedModelFactory.registerDocumentFactory(
      'notebook',
      () => new YNotebook({ disableDocumentWideUndoRedo: true })
    );
    drive.sharedModelFactory.registerDocumentFactory('file', () => new YFile());

    serviceManager.contents.addDrive(drive);

    const widget = createFileBrowser('jp-filesystem-browser', {
      driveName: drive.name,
      // We don't want to restore old state, we don't have a drive handle ready
      restore: false
    });
    widget.title.caption = 'Shared File System';
    widget.title.icon = listIcon;

    const openDirectoryButton = new ToolbarButton({
      icon: folderIcon,
      onClick: async () => {
        const directoryHandle = await window.showDirectoryPicker();

        if (directoryHandle) {
          drive.rootHandle = directoryHandle;

          // Go to root directory
          widget.model.cd('/');
        }
      },
      tooltip: 'Open a new folder'
    });

    widget.toolbar.insertItem(0, 'open-directory', openDirectoryButton);

    app.shell.add(widget, 'left');
  }
};

export default plugin;
