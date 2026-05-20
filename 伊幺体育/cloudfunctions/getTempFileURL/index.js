const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用云函数当前所在环境

exports.main = async (event, context) => {
  const { fileList } = event
  try {
    // 云函数端调用 getTempFileURL 有更高权限
    const res = await cloud.getTempFileURL({
      fileList: fileList
    })
    return res.fileList // 返回包含临时链接的数组
  } catch (err) {
    console.error(err)
    return err
  }
}