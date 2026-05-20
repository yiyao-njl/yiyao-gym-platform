const DEFAULT_IMAGE_URL = '/images/浼婂购浣撹偛.jpg';

/**
 * Resolve cloud file IDs and save the result to a page data field.
 * Keeps the original public API: getTemporaryCloudStorageFilesLink(fileID, saveField, targetIndex).
 */
async function getTemporaryCloudStorageFilesLink(fileID, saveField, targetIndex = -1) {
  if (typeof fileID === 'string') {
    if (!fileID) return;
    const url = await resolveFileUrls(fileID);
    this.setData({ [saveField]: url });
    return;
  }

  if (!Array.isArray(fileID)) return;

  if (targetIndex >= 0) {
    const singleFileId = fileID[targetIndex];
    if (!singleFileId) return;

    const currentFiles = Array.isArray(this.data[saveField]) ? this.data[saveField] : [];
    const currentFile = currentFiles[targetIndex] || {};
    this.setData({
      [`${saveField}[${targetIndex}]`]: Object.assign({}, currentFile, { loading: true })
    });

    const url = await resolveFileUrls(singleFileId);
    this.setData({
      [`${saveField}[${targetIndex}]`]: Object.assign({}, currentFile, { url, loading: true })
    });
    return;
  }

  const urls = await resolveFileUrls(fileID);
  const files = urls.map(url => ({ url, loading: true }));
  this.setData({ [saveField]: files });
}

async function resolveFileUrls(input, customDefaultUrl) {
  const defaultUrl = customDefaultUrl !== undefined ? customDefaultUrl : DEFAULT_IMAGE_URL;

  if (typeof input === 'string') {
    try {
      const res = await wx.cloud.getTempFileURL({ fileList: [input] });
      const tempUrl = res.fileList && res.fileList[0] && res.fileList[0].tempFileURL;
      if (tempUrl) return tempUrl;

      console.warn('Client getTempFileURL returned an empty URL, falling back to cloud function.');
      return await getFileURLsViaCloudFunction(input, defaultUrl);
    } catch (err) {
      console.warn('Client getTempFileURL failed, falling back to cloud function.', err);
      return await getFileURLsViaCloudFunction(input, defaultUrl);
    }
  }

  if (Array.isArray(input)) {
    try {
      const res = await wx.cloud.getTempFileURL({ fileList: input });
      const fileList = Array.isArray(res.fileList) ? res.fileList : [];
      const allValid = fileList.length === input.length && fileList.every(item => item.tempFileURL);
      if (allValid) return fileList.map(item => item.tempFileURL);

      console.warn('Client getTempFileURL returned incomplete URLs, falling back to cloud function.');
      return await getFileURLsViaCloudFunction(input, defaultUrl);
    } catch (err) {
      console.warn('Client getTempFileURL failed, falling back to cloud function.', err);
      return await getFileURLsViaCloudFunction(input, defaultUrl);
    }
  }

  return Promise.reject(new Error('resolveFileUrls expects a string or an array of strings.'));
}

async function getFileURLsViaCloudFunction(input, defaultUrl) {
  try {
    const fileList = Array.isArray(input) ? input : [input];
    const res = await wx.cloud.callFunction({
      name: 'getTempFileURL',
      data: { fileList }
    });

    if (Array.isArray(res.result) && res.result.length) {
      const urls = res.result.map(item => item.tempFileURL || defaultUrl);
      return Array.isArray(input) ? urls : urls[0];
    }

    return Array.isArray(input) ? input.map(() => defaultUrl) : defaultUrl;
  } catch (cfErr) {
    console.error('Cloud function getTempFileURL failed.', cfErr);
    return Array.isArray(input) ? input.map(() => defaultUrl) : defaultUrl;
  }
}

module.exports = { getTemporaryCloudStorageFilesLink, resolveFileUrls };
