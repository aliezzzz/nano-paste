declare namespace chrome {
  const runtime: {
    id?: string;
    lastError?: { message?: string };
    onInstalled: { addListener: (callback: () => void) => void };
    onStartup: { addListener: (callback: () => void) => void };
  };

  namespace storage {
    interface StorageArea {
      get: (keys: string[] | string | Record<string, unknown>, callback: (items: Record<string, unknown>) => void) => void;
      set: (items: Record<string, unknown>, callback?: () => void) => void;
      remove: (keys: string[] | string, callback?: () => void) => void;
    }

    const local: StorageArea;
    const sync: StorageArea;
    const session: StorageArea;
  }

  const contextMenus: {
    create: (properties: {
      id?: string;
      title?: string;
      contexts?: string[];
    }, callback?: () => void) => void;
    removeAll: (callback?: () => void) => void;
    onClicked: {
      addListener: (
        callback: (
          info: {
            menuItemId: string | number;
            mediaType?: string;
            srcUrl?: string;
            selectionText?: string;
            linkUrl?: string;
            pageUrl?: string;
            frameUrl?: string;
          },
          tab?: { id?: number; title?: string; url?: string },
        ) => void,
      ) => void;
    };
  };

  const notifications: {
    create: (options: {
      type: "basic";
      iconUrl: string;
      title: string;
      message: string;
    }, callback?: () => void) => void;
  };

  const action: {
    openPopup?: () => Promise<void>;
  };
}
