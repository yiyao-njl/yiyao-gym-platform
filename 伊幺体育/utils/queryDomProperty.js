const queryDomProperty = (selector, instance, dataKey, property) => { //如果能接收对象就好了
  return new Promise((resolve, reject) => {
    const query = instance.createSelectorQuery();
    query.select(selector).boundingClientRect(res => {
      if (res) {
        const value = res[property];
        instance.setData({
          [dataKey]: value
        }, () => {
          resolve(value); // 数据更新后 resolve
        });
      } else {
        reject(new Error('元素未找到'));
      }
    }).exec();
  });
};

module.exports = queryDomProperty;