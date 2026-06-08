import { config } from "@vue/test-utils";

config.global.stubs = {
  ClockIcon: { template: "<svg data-test-icon='clock' />" },
  RefreshIcon: { template: "<svg data-test-icon='refresh' />" },
  StarIcon: { template: "<svg data-test-icon='star' />" },
  CopyIcon: { template: "<svg data-test-icon='copy' />" },
  DownloadIcon: { template: "<svg data-test-icon='download' />" },
  DeleteIcon: { template: "<svg data-test-icon='delete' />" },
  InboxEmptyIcon: { template: "<svg data-test-icon='empty' />" },
  UploadCloudIcon: { template: "<svg data-test-icon='upload' />" },
  FolderIcon: { template: "<svg data-test-icon='folder' />" },
  SpinnerIcon: { template: "<svg data-test-icon='spinner' />" },
};
